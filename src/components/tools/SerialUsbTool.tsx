'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_SERIAL_COMMAND_PROFILE,
  SERIAL_BAUD_RATES,
  lineEndingLabel,
  type SerialAction,
  type SerialActionStep,
  type SerialLineEnding,
} from '@/lib/tools/serial-commands';
import {
  buildSerialSettingsPlan,
  type SerialSettingsPlanResult,
} from '@/lib/meshcore-tools/serial-settings';

type SerialPortReadyState = 'opened' | 'closed';

interface WebSerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

interface WebSerialOpenOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  flowControl?: 'none' | 'hardware';
  bufferSize?: number;
}

interface WebSerialPortLike {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: WebSerialOpenOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): WebSerialPortInfo;
  addEventListener(
    type: 'disconnect',
    listener: (event: Event) => void
  ): void;
  removeEventListener(
    type: 'disconnect',
    listener: (event: Event) => void
  ): void;
  readyState?: SerialPortReadyState;
}

interface WebSerialLike {
  requestPort(options?: { filters?: Array<Record<string, number>> }): Promise<WebSerialPortLike>;
  getPorts(): Promise<WebSerialPortLike[]>;
}

interface NavigatorWithSerial extends Navigator {
  serial?: WebSerialLike;
}

type SupportState = 'unknown' | 'unsupported' | 'insecure' | 'ready';
type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

interface LogEntry {
  id: number;
  kind: 'info' | 'tx' | 'rx' | 'error';
  text: string;
  ts: number;
}

const PROFILE = DEFAULT_SERIAL_COMMAND_PROFILE;
const LOG_LIMIT = 500;

function nextId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

export default function SerialUsbTool() {
  const [support, setSupport] = useState<SupportState>('unknown');
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [baudRate, setBaudRate] = useState<number>(PROFILE.serial.baudRate);
  const [lineEnding, setLineEnding] = useState<SerialLineEnding>(
    PROFILE.serial.defaultLineEnding
  );
  const [manualInput, setManualInput] = useState('');
  const [settingsInput, setSettingsInput] = useState('');
  const [settingsFileName, setSettingsFileName] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);

  const portRef = useRef<WebSerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const readLoopAbortRef = useRef<boolean>(false);
  const cancelActionRef = useRef<boolean>(false);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
      setSupport('insecure');
      return;
    }
    const nav = navigator as NavigatorWithSerial;
    if (!nav.serial || typeof nav.serial.requestPort !== 'function') {
      setSupport('unsupported');
      return;
    }
    setSupport('ready');
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [log]);

  useEffect(() => {
    return () => {
      readLoopAbortRef.current = true;
      cancelActionRef.current = true;
      const reader = readerRef.current;
      const writer = writerRef.current;
      const port = portRef.current;
      readerRef.current = null;
      writerRef.current = null;
      portRef.current = null;
      reader?.cancel().catch(() => {});
      writer?.releaseLock();
      port?.close().catch(() => {});
    };
  }, []);

  const appendLog = useCallback(
    (kind: LogEntry['kind'], text: string) => {
      setLog((prev) => {
        const next = [...prev, { id: nextId(), kind, text, ts: Date.now() }];
        if (next.length > LOG_LIMIT) next.splice(0, next.length - LOG_LIMIT);
        return next;
      });
    },
    []
  );

  const startReadLoop = useCallback(
    async (port: WebSerialPortLike) => {
      if (!port.readable) return;
      const decoder = new TextDecoder();
      const reader = port.readable.getReader();
      readerRef.current = reader;
      readLoopAbortRef.current = false;
      let buffer = '';
      try {
        while (!readLoopAbortRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          if (!value) continue;
          buffer += decoder.decode(value, { stream: true });
          let newlineIdx = buffer.indexOf('\n');
          while (newlineIdx >= 0) {
            const line = buffer.slice(0, newlineIdx).replace(/\r$/, '');
            buffer = buffer.slice(newlineIdx + 1);
            if (line.length > 0) appendLog('rx', line);
            newlineIdx = buffer.indexOf('\n');
          }
        }
        if (buffer.length > 0) appendLog('rx', buffer);
      } catch (err) {
        if (!readLoopAbortRef.current) {
          appendLog('error', `Read error: ${(err as Error).message}`);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {
        }
        if (readerRef.current === reader) readerRef.current = null;
      }
    },
    [appendLog]
  );

  const handleDisconnectEvent = useCallback(() => {
    appendLog('info', 'Device disconnected.');
    setConnection('idle');
    readLoopAbortRef.current = true;
    cancelActionRef.current = true;
    setRunningActionId(null);
    const reader = readerRef.current;
    const writer = writerRef.current;
    const port = portRef.current;
    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    reader?.cancel().catch(() => {});
    writer?.releaseLock();
    port?.close().catch(() => {});
  }, [appendLog]);

  const handleConnect = useCallback(async () => {
    if (support !== 'ready') return;
    const nav = navigator as NavigatorWithSerial;
    if (!nav.serial) return;
    setConnection('connecting');
    setErrorMsg(null);
    try {
      const port = await nav.serial.requestPort();
      await port.open({
        baudRate,
        dataBits: PROFILE.serial.dataBits,
        stopBits: PROFILE.serial.stopBits,
        parity: PROFILE.serial.parity === 'mark' || PROFILE.serial.parity === 'space'
          ? 'none'
          : PROFILE.serial.parity,
        flowControl: PROFILE.serial.flowControl,
      });
      portRef.current = port;
      port.addEventListener('disconnect', handleDisconnectEvent);
      const writableStream = port.writable;
      if (!writableStream) {
        await port.close();
        throw new Error('Selected serial port is not writable.');
      }
      writerRef.current = writableStream.getWriter();
      setConnection('connected');
      const info = port.getInfo();
      const detail =
        info.usbVendorId !== undefined && info.usbProductId !== undefined
          ? ` (USB ${info.usbVendorId.toString(16).padStart(4, '0')}:${info.usbProductId
              .toString(16)
              .padStart(4, '0')})`
          : '';
      appendLog('info', `Connected at ${baudRate} baud${detail}.`);
      void startReadLoop(port);
    } catch (err) {
      const message = (err as Error).message || 'Failed to open serial port.';
      setErrorMsg(message);
      setConnection('error');
      appendLog('error', message);
      const port = portRef.current;
      portRef.current = null;
      if (port) {
        port.removeEventListener('disconnect', handleDisconnectEvent);
        port.close().catch(() => {});
      }
    }
  }, [appendLog, baudRate, handleDisconnectEvent, startReadLoop, support]);

  const handleDisconnect = useCallback(async () => {
    cancelActionRef.current = true;
    setRunningActionId(null);
    readLoopAbortRef.current = true;
    const reader = readerRef.current;
    const writer = writerRef.current;
    const port = portRef.current;
    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    if (reader) {
      try {
        await reader.cancel();
      } catch {
      }
    }
    if (writer) {
      writer.releaseLock();
    }
    if (port) {
      port.removeEventListener('disconnect', handleDisconnectEvent);
      try {
        await port.close();
      } catch {
      }
    }
    setConnection('idle');
    appendLog('info', 'Disconnected.');
  }, [appendLog, handleDisconnectEvent]);

  const sendCommand = useCallback(
    async (command: string, ending: SerialLineEnding) => {
      const writer = writerRef.current;
      if (!writer) {
        appendLog('error', 'Cannot send — not connected.');
        return false;
      }
      const payload = `${command}${ending}`;
      try {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(payload));
        appendLog('tx', command);
        return true;
      } catch (err) {
        appendLog('error', `Write failed: ${(err as Error).message}`);
        return false;
      }
    },
    [appendLog]
  );

  const handleManualSend = useCallback(async () => {
    const value = manualInput.trim();
    if (!value || connection !== 'connected') return;
    const ok = await sendCommand(value, lineEnding);
    if (ok) setManualInput('');
  }, [connection, lineEnding, manualInput, sendCommand]);

  const settingsResult = useMemo<SerialSettingsPlanResult | null>(() => {
    if (!settingsInput.trim()) return null;
    return buildSerialSettingsPlan(settingsInput);
  }, [settingsInput]);

  const handleSettingsFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        const text = await file.text();
        setSettingsInput(text);
        setSettingsFileName(file.name);
      } catch (err) {
        appendLog('error', `Could not read settings file: ${(err as Error).message}`);
      }
    },
    [appendLog]
  );

  const handleSettingsClear = useCallback(() => {
    setSettingsInput('');
    setSettingsFileName(null);
  }, []);

  const runAction = useCallback(
    async (action: SerialAction) => {
      if (connection !== 'connected' || runningActionId) return;
      if (action.confirm && !window.confirm(action.confirmMessage || `Run ${action.label}?`)) return;
      setRunningActionId(action.id);
      cancelActionRef.current = false;
      appendLog('info', `Running "${action.label}"…`);
      try {
        for (const step of action.steps) {
          if (cancelActionRef.current) break;
          await runStep(step, lineEnding, sendCommand);
        }
      } finally {
        setRunningActionId(null);
      }
    },
    [appendLog, connection, lineEnding, runningActionId, sendCommand]
  );

  const handleClearLog = useCallback(() => setLog([]), []);

  const supportBanner = useMemo(() => {
    if (support === 'unknown') return null;
    if (support === 'unsupported') {
      return {
        tone: 'sunset' as const,
        title: 'Web Serial not available',
        body:
          "Your browser doesn't support the Web Serial API. Use a recent Chromium-based browser (Chrome, Edge, Opera, Brave, Arc) on desktop. Firefox and Safari do not currently expose Web Serial.",
      };
    }
    if (support === 'insecure') {
      return {
        tone: 'sunset' as const,
        title: 'Secure context required',
        body:
          'Web Serial only runs in secure contexts (HTTPS or http://localhost). Reload this page over HTTPS to enable the connection button.',
      };
    }
    return null;
  }, [support]);

  return (
    <div className="space-y-6">
      {supportBanner && (
        <div className="card-mesh p-5 border-sunset-500/40 bg-sunset-500/5">
          <p className="text-sm font-semibold text-foreground mb-1">
            {supportBanner.title}
          </p>
          <p className="text-sm text-foreground-muted leading-relaxed">
            {supportBanner.body}
          </p>
          <p className="text-xs text-foreground-dim mt-3">
            You can still review the canned commands below to know what the tool
            would send.
          </p>
        </div>
      )}

      <div className="card-mesh p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-foreground-dim mono">
              Connection
            </p>
            <p className="text-sm text-foreground">
              {connection === 'connected' ? (
                <span className="text-forest-300">Connected · {baudRate} baud</span>
              ) : connection === 'connecting' ? (
                <span className="text-foreground-muted">Connecting…</span>
              ) : connection === 'error' ? (
                <span className="text-red-500">Error: {errorMsg}</span>
              ) : support === 'ready' ? (
                <span className="text-foreground-muted">Idle — click Connect to pick a port.</span>
              ) : (
                <span className="text-foreground-muted">Unavailable in this browser.</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {connection === 'connected' ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="btn-outline"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={support !== 'ready' || connection === 'connecting'}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connection === 'connecting' ? 'Opening…' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-foreground-muted">
            <span className="block mb-1 mono uppercase tracking-wider">Baud rate</span>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={connection === 'connected' || connection === 'connecting'}
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-3 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none disabled:opacity-60"
            >
              {SERIAL_BAUD_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-foreground-muted">
            <span className="block mb-1 mono uppercase tracking-wider">Line ending</span>
            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as SerialLineEnding)}
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-3 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
            >
              {(['\n', '\r', '\r\n', ''] as SerialLineEnding[]).map((opt) => (
                <option key={opt || 'none'} value={opt}>
                  {lineEndingLabel(opt)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="text-xs text-foreground-dim">
          ◊ The browser will prompt you to choose a serial port. Nothing is sent
          until you click <strong className="text-foreground">Connect</strong>{' '}
          and the data stays between this tab and your device.
        </p>
      </div>

      <div className="card-mesh p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Manual send</h3>
          <span className="text-xs text-foreground-dim mono uppercase tracking-wider">
            {connection === 'connected' ? 'Ready' : 'Disabled'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleManualSend();
              }
            }}
            placeholder='e.g. "help" or "get config"'
            disabled={connection !== 'connected'}
            className="flex-1 bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono text-sm focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleManualSend()}
            disabled={connection !== 'connected' || !manualInput.trim()}
            className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>

      <div className="card-mesh p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Canned commands</h3>
          <span className="text-xs text-foreground-dim mono uppercase tracking-wider">
            Default profile
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROFILE.actions.map((action) => {
            const isRunning = runningActionId === action.id;
            const disabled =
              connection !== 'connected' || (!!runningActionId && !isRunning);
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => void runAction(action)}
                disabled={disabled}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  isRunning
                    ? 'border-mesh bg-mesh/10 text-foreground'
                    : 'border-card-border bg-night-800/20 text-foreground-muted hover:border-mesh/50 disabled:opacity-50 disabled:hover:border-card-border disabled:cursor-not-allowed'
                }`}
              >
                <span className="font-mono font-bold text-sm text-foreground">
                  {action.label}
                </span>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {action.description}
                </p>
                {isRunning && (
                  <p className="text-[10px] text-mesh mt-1 mono uppercase tracking-wider">
                    Running…
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-mesh p-5 space-y-3" data-testid="serial-settings-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Apply settings JSON</h3>
          <span className="text-xs text-foreground-dim mono uppercase tracking-wider">
            {settingsResult?.ok
              ? `Preview · ${settingsResult.action.steps.length} step${
                  settingsResult.action.steps.length === 1 ? '' : 's'
                }`
              : settingsResult && !settingsResult.ok
                ? 'Errors'
                : 'Idle'}
          </span>
        </div>
        <p className="text-xs text-foreground-dim">
          Paste a MeshCore settings JSON (or upload a <code className="text-mesh">.json</code> file) to
          preview the exact serial commands that would be sent. Nothing is transmitted until you click
          <strong className="text-foreground"> Apply previewed settings</strong> and confirm.
        </p>

        <textarea
          value={settingsInput}
          onChange={(e) => {
            setSettingsInput(e.target.value);
            if (settingsFileName) setSettingsFileName(null);
          }}
          placeholder={'{\n  "name": "DEN-GLDN-LKVST-RC-A10F",\n  "node_type": "RC",\n  ...\n}'}
          spellCheck={false}
          rows={6}
          data-testid="serial-settings-input"
          aria-label="MeshCore settings JSON"
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-3 py-2 text-foreground font-mono text-xs leading-relaxed focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/40"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-outline cursor-pointer inline-flex items-center">
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleSettingsFileSelect}
              data-testid="serial-settings-file"
              className="sr-only"
            />
            Upload JSON…
          </label>
          <button
            type="button"
            onClick={handleSettingsClear}
            disabled={!settingsInput && !settingsFileName}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          {settingsFileName && (
            <span className="text-xs text-foreground-muted mono truncate max-w-[16rem]">
              {settingsFileName}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              if (settingsResult?.ok) void runAction(settingsResult.action);
            }}
            disabled={
              connection !== 'connected' ||
              !settingsResult?.ok ||
              !!runningActionId
            }
            data-testid="serial-settings-apply"
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed sm:ml-auto"
          >
            {runningActionId === 'apply-settings-json'
              ? 'Applying…'
              : 'Apply previewed settings'}
          </button>
        </div>

        {settingsResult && !settingsResult.ok && (
          <div
            data-testid="serial-settings-error"
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-300 space-y-1"
          >
            <p className="font-semibold text-red-200">Cannot apply these settings:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {settingsResult.errors.map((err, idx) => (
                <li key={`${idx}-${err}`}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {settingsResult?.ok && (
          <div data-testid="serial-settings-preview" className="space-y-3">
            <div className="rounded-lg border border-card-border bg-night-900/60 p-3">
              <p className="text-[10px] uppercase tracking-wider text-foreground-dim mono mb-2">
                Command preview
              </p>
              <ol className="space-y-0.5 font-mono text-xs">
                {settingsResult.action.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-foreground-dim w-6 text-right shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {step.type === 'send' ? (
                      <span className="text-foreground">
                        <span className="text-mesh mr-2">→</span>
                        {step.command}
                      </span>
                    ) : (
                      <span className="text-foreground-muted">
                        wait {step.durationMs}ms
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {settingsResult.warnings.length > 0 && (
              <div
                data-testid="serial-settings-warnings"
                className="rounded-lg border border-sunset-500/40 bg-sunset-500/5 p-3 text-xs text-foreground-muted space-y-1"
              >
                <p className="font-semibold text-foreground">Warnings</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {settingsResult.warnings.map((w, idx) => (
                    <li key={`${idx}-${w}`}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {settingsResult.unsupportedKeys.length > 0 && (
              <div
                data-testid="serial-settings-unsupported"
                className="rounded-lg border border-card-border bg-night-800/30 p-3 text-xs text-foreground-muted"
              >
                <p className="font-semibold text-foreground mb-1">
                  Keys not auto-applied
                </p>
                <p className="font-mono break-all leading-relaxed">
                  {settingsResult.unsupportedKeys.join(', ')}
                </p>
                <p className="text-foreground-dim mt-1">
                  Review and apply these manually if needed.
                </p>
              </div>
            )}

            {connection !== 'connected' && (
              <p className="text-xs text-foreground-dim">
                Connect a device above to enable Apply.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card-mesh p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-card-border bg-night-800/40">
          <h3 className="text-sm font-semibold text-foreground">Terminal log</h3>
          <button
            type="button"
            onClick={handleClearLog}
            className="text-xs text-foreground-muted hover:text-mesh transition-colors"
          >
            Clear
          </button>
        </div>
        <div
          className="bg-night-900 text-xs font-mono leading-relaxed h-72 overflow-y-auto p-4 space-y-0.5"
          aria-live="polite"
          aria-label="Serial terminal log"
        >
          {log.length === 0 ? (
            <p className="text-foreground-dim">
              Output will appear here once the device is connected.
            </p>
          ) : (
            log.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.kind === 'tx'
                    ? 'text-mesh'
                    : entry.kind === 'rx'
                      ? 'text-foreground'
                      : entry.kind === 'error'
                        ? 'text-red-400'
                        : 'text-foreground-muted'
                }
              >
                <span className="text-foreground-dim mr-2">
                  {formatTime(entry.ts)}
                </span>
                <span className="text-foreground-dim mr-2">
                  {entry.kind === 'tx'
                    ? '→'
                    : entry.kind === 'rx'
                      ? '←'
                      : entry.kind === 'error'
                        ? '!'
                        : '·'}
                </span>
                <span className="whitespace-pre-wrap break-words">{entry.text}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}

async function runStep(
  step: SerialActionStep,
  defaultEnding: SerialLineEnding,
  send: (cmd: string, ending: SerialLineEnding) => Promise<boolean>
): Promise<void> {
  if (step.type === 'send') {
    await send(step.command, step.lineEnding ?? defaultEnding);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, step.durationMs));
}
