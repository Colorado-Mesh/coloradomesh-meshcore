'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SectionEyebrow } from '@/components/brand';
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
  const logScrollRef = useRef<HTMLDivElement | null>(null);

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
    if (log.length === 0) return;
    const container = logScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
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

  const statusBadge: { dot: string; tone: string } = (() => {
    if (connection === 'connected') {
      return {
        dot: 'status-dot status-dot-pulse',
        tone: 'text-forest-300',
      };
    }
    if (connection === 'connecting') {
      return {
        dot: 'status-dot status-dot-amber status-dot-pulse',
        tone: 'text-amber-signal',
      };
    }
    if (connection === 'error') {
      return {
        dot: 'status-dot status-dot-red',
        tone: 'text-red-signal',
      };
    }
    if (support === 'ready') {
      return {
        dot: 'status-dot opacity-40',
        tone: 'text-foreground-muted',
      };
    }
    return {
      dot: 'status-dot status-dot-red opacity-70',
      tone: 'text-foreground-muted',
    };
  })();

  return (
    <div className="space-y-6">
      {supportBanner && (
        <div
          data-testid="serial-support-banner"
          role="status"
          className="panel border-sunset-500/40 bg-sunset-500/[0.06] p-5"
        >
          <div className="flex items-start gap-3">
            <span className="status-dot status-dot-amber mt-2" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {supportBanner.title}
              </p>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {supportBanner.body}
              </p>
              <p className="text-xs text-foreground-dim">
                You can still review the canned commands below to know what the tool
                would send.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="panel p-5 sm:p-6 space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <SectionEyebrow tone="mesh">Connection</SectionEyebrow>
            <p
              data-testid="serial-support-status"
              className={`inline-flex items-center gap-2 text-sm ${statusBadge.tone}`}
            >
              <span className={statusBadge.dot} aria-hidden />
              <span>
                {connection === 'connected' ? (
                  <>Connected · {baudRate} baud</>
                ) : connection === 'connecting' ? (
                  <>Connecting…</>
                ) : connection === 'error' ? (
                  <>Error: {errorMsg}</>
                ) : support === 'ready' ? (
                  <>Idle — click Connect to pick a port.</>
                ) : (
                  <>Unavailable in this browser.</>
                )}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
                data-testid="serial-connect"
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connection === 'connecting' ? 'Opening…' : 'Connect'}
              </button>
            )}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs text-foreground-muted">
            <span className="metric-label block mb-1.5">Baud rate</span>
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={connection === 'connected' || connection === 'connecting'}
              aria-label="Baud rate"
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-3 py-2.5 text-foreground font-mono text-sm focus:ring-2 focus:ring-mesh focus:border-mesh outline-none disabled:opacity-60"
            >
              {SERIAL_BAUD_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-foreground-muted">
            <span className="metric-label block mb-1.5">Line ending</span>
            <select
              value={lineEnding}
              onChange={(e) => setLineEnding(e.target.value as SerialLineEnding)}
              aria-label="Line ending"
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-3 py-2.5 text-foreground font-mono text-sm focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
            >
              {(['\n', '\r', '\r\n', ''] as SerialLineEnding[]).map((opt) => (
                <option key={opt || 'none'} value={opt}>
                  {lineEndingLabel(opt)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="rounded-lg border border-card-border bg-night-800/30 px-3 py-2.5 text-xs text-foreground-dim leading-relaxed">
          <span aria-hidden className="text-mesh mr-1.5">◊</span>
          The browser will prompt you to choose a serial port. Nothing is sent
          until you click <strong className="text-foreground">Connect</strong>{' '}
          and the data stays between this tab and your device.
        </p>
      </section>

      <section className="panel p-5 sm:p-6 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <SectionEyebrow tone="mesh">Manual send</SectionEyebrow>
            <h2 className="text-sm font-semibold text-foreground">
              One-off commands
            </h2>
          </div>
          <span
            className={`mono text-[0.65rem] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border ${
              connection === 'connected'
                ? 'border-forest-300/40 bg-forest-300/[0.08] text-forest-300'
                : 'border-card-border bg-night-800/40 text-foreground-dim'
            }`}
          >
            {connection === 'connected' ? 'Ready' : 'Disabled'}
          </span>
        </header>
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
        <p className="text-[11px] text-foreground-dim">
          Press <kbd className="mono px-1.5 py-0.5 rounded border border-card-border bg-night-800/60 text-foreground-muted">Enter</kbd> to send. Line ending follows the connection setting above.
        </p>
      </section>

      <section className="panel p-5 sm:p-6 space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5">
            <SectionEyebrow tone="sky">Canned commands</SectionEyebrow>
            <h2 className="text-sm font-semibold text-foreground">
              Default profile
            </h2>
          </div>
          <span className="mono text-[0.65rem] uppercase tracking-[0.18em] text-foreground-dim">
            {PROFILE.actions.length} actions
          </span>
        </header>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {PROFILE.actions.map((action) => {
            const isRunning = runningActionId === action.id;
            const disabled =
              connection !== 'connected' || (!!runningActionId && !isRunning);
            const requiresConfirm = !!action.confirm;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => void runAction(action)}
                disabled={disabled}
                className={`group text-left px-4 py-3 rounded-lg border transition-all ${
                  isRunning
                    ? 'border-mesh bg-mesh/10 text-foreground'
                    : 'border-card-border bg-night-800/20 text-foreground-muted hover:border-mesh/50 hover:bg-night-800/40 disabled:opacity-50 disabled:hover:border-card-border disabled:hover:bg-night-800/20 disabled:cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-sm text-foreground">
                    {action.label}
                  </span>
                  {requiresConfirm && (
                    <span
                      className="mono text-[0.6rem] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded border border-sunset-500/40 text-sunset-500"
                      title="Requires confirmation"
                    >
                      confirm
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                  {action.description}
                </p>
                {isRunning && (
                  <p className="text-[10px] text-mesh mt-2 mono uppercase tracking-[0.18em] inline-flex items-center gap-1.5">
                    <span className="status-dot status-dot-pulse" aria-hidden />
                    Running…
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section
        className="panel p-5 sm:p-6 space-y-4"
        data-testid="serial-settings-card"
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <SectionEyebrow tone="sunset">Settings JSON</SectionEyebrow>
            <h2 className="text-sm font-semibold text-foreground">
              Apply settings JSON
            </h2>
          </div>
          <span
            className={`mono text-[0.65rem] uppercase tracking-[0.18em] px-2.5 py-1 rounded-full border ${
              settingsResult?.ok
                ? 'border-mesh/40 bg-mesh/[0.08] text-mesh'
                : settingsResult && !settingsResult.ok
                  ? 'border-red-500/40 bg-red-500/[0.08] text-red-signal'
                  : 'border-card-border bg-night-800/40 text-foreground-dim'
            }`}
          >
            {settingsResult?.ok
              ? `Preview · ${settingsResult.action.steps.length} step${
                  settingsResult.action.steps.length === 1 ? '' : 's'
                }`
              : settingsResult && !settingsResult.ok
                ? 'Errors'
                : 'Idle'}
          </span>
        </header>
        <p className="text-xs text-foreground-muted leading-relaxed">
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
          className="w-full bg-night-900/60 border border-card-border rounded-lg px-3 py-2.5 text-foreground font-mono text-xs leading-relaxed focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/40"
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
            className="rounded-lg border border-red-500/40 bg-red-500/[0.06] p-3 text-xs text-red-300 space-y-1"
          >
            <p className="font-semibold text-red-200 inline-flex items-center gap-1.5">
              <span aria-hidden>✕</span>
              Cannot apply these settings:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {settingsResult.errors.map((err, idx) => (
                <li key={`${idx}-${err}`}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {settingsResult?.ok && (
          <div data-testid="serial-settings-preview" className="space-y-3">
            <div className="rounded-lg border border-card-border bg-night-900/70 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-foreground-dim mono">
                  Command preview
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-foreground-dim mono">
                  {settingsResult.action.steps.length} step
                  {settingsResult.action.steps.length === 1 ? '' : 's'}
                </p>
              </div>
              <ol className="space-y-1 font-mono text-xs">
                {settingsResult.action.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 items-baseline">
                    <span className="text-foreground-dim w-6 text-right shrink-0 select-none">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {step.type === 'send' ? (
                      <span className="text-foreground break-all">
                        <span className="text-mesh mr-2" aria-hidden>→</span>
                        {step.command}
                      </span>
                    ) : (
                      <span className="text-foreground-muted italic">
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
                className="rounded-lg border border-sunset-500/40 bg-sunset-500/[0.06] p-3 text-xs text-foreground-muted space-y-1"
              >
                <p className="font-semibold text-foreground inline-flex items-center gap-1.5">
                  <span aria-hidden className="text-sunset-500">⚠</span>
                  Warnings
                </p>
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
                <p className="text-foreground-dim mt-1.5">
                  Review and apply these manually if needed.
                </p>
              </div>
            )}

            {connection !== 'connected' && (
              <p className="text-xs text-foreground-dim inline-flex items-center gap-1.5">
                <span aria-hidden className="text-foreground-dim">◌</span>
                Connect a device above to enable Apply.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="panel overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-card-border bg-night-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={
                connection === 'connected'
                  ? 'status-dot status-dot-pulse'
                  : 'status-dot opacity-30'
              }
              aria-hidden
            />
            <h2 className="text-sm font-semibold text-foreground truncate">
              Terminal log
            </h2>
            <span className="mono text-[0.65rem] uppercase tracking-[0.18em] text-foreground-dim hidden sm:inline">
              {log.length} {log.length === 1 ? 'line' : 'lines'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearLog}
            disabled={log.length === 0}
            className="text-xs text-foreground-muted hover:text-mesh disabled:opacity-40 disabled:hover:text-foreground-muted transition-colors"
          >
            Clear
          </button>
        </header>
        <div
          ref={logScrollRef}
          className="bg-night-900 text-xs font-mono leading-relaxed h-72 overflow-y-auto p-4 space-y-0.5"
          aria-live="polite"
          aria-label="Serial terminal log"
        >
          {log.length === 0 ? (
            <p className="text-foreground-dim flex items-center gap-2">
              <span aria-hidden>·</span>
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
                <span className="text-foreground-dim mr-2 select-none">
                  {formatTime(entry.ts)}
                </span>
                <span className="text-foreground-dim mr-2 select-none">
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
        </div>
      </section>
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
