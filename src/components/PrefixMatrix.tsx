"use client";

import { useCallback, useMemo, useState } from "react";
import { useMapSnapshot } from "@/hooks/useMapSnapshot";
import {
  buildPrefixAnalysis,
  HEX_CHARS,
  searchPrefixAnalysis,
  suggestFreePrefix,
  type PrefixCell,
  type PrefixCellSeverity,
  type PrefixPrimaryCell,
} from "@/lib/meshcore-tools/prefixes";

interface PrefixMatrixProps {
  onSelectPrefix?: (prefix4: string) => void;
}

export default function PrefixMatrix({ onSelectPrefix }: PrefixMatrixProps) {
  const { nodes, loading, error, refetch } = useMapSnapshot();
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const analysis = useMemo(() => buildPrefixAnalysis(nodes), [nodes]);

  const primaryRows = useMemo(() => {
    const rows: PrefixPrimaryCell[][] = [];
    for (const first of HEX_CHARS) {
      const row: PrefixPrimaryCell[] = [];
      for (const second of HEX_CHARS) {
        const cell = analysis.primaryCells.get(`${first}${second}`);
        if (cell) row.push(cell);
      }
      rows.push(row);
    }
    return rows;
  }, [analysis]);

  const searchResult = useMemo(
    () => searchPrefixAnalysis(analysis, search),
    [analysis, search],
  );
  const isSearching = search.trim().length > 0;

  const totalNodes = analysis.nodeInfos.length;
  const freePrimaryCount = useMemo(() => {
    let count = 0;
    for (const cell of analysis.primaryCells.values()) {
      if (cell.count === 0) count += 1;
    }
    return count;
  }, [analysis]);

  const handleSuggestFreePrefix = useCallback(() => {
    const suggested = suggestFreePrefix(analysis, {
      preferredPrefix2: selectedPrimary ?? undefined,
    });
    if (!suggested) return;
    const primary = suggested.slice(0, 2);
    setSelectedPrimary(primary);
    setSelectedSecondary(suggested);
    onSelectPrefix?.(suggested);
  }, [analysis, onSelectPrefix, selectedPrimary]);

  const handlePrimaryClick = useCallback((prefix2: string) => {
    setSelectedPrimary((current) => {
      const next = current === prefix2 ? null : prefix2;
      setSelectedSecondary(null);
      return next;
    });
  }, []);

  const handleSecondaryClick = useCallback(
    (cell: PrefixCell) => {
      setSelectedSecondary((current) => (current === cell.id ? null : cell.id));
      if (cell.selectable) {
        onSelectPrefix?.(cell.id);
      }
    },
    [onSelectPrefix],
  );

  if (error && nodes.length === 0) {
    return (
      <div className="card-mesh p-8 text-center">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={() => {
            void refetch();
          }}
          className="text-mesh hover:text-mesh-light text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const selectedPrimaryCell = selectedPrimary
    ? analysis.primaryCells.get(selectedPrimary) ?? null
    : null;
  const selectedSecondaryCell = selectedSecondary
    ? analysis.secondaryCells.get(selectedSecondary) ?? null
    : null;

  const secondaryRows: PrefixCell[][] = [];
  if (selectedPrimaryCell) {
    for (let r = 0; r < HEX_CHARS.length; r++) {
      const row: PrefixCell[] = [];
      for (let c = 0; c < HEX_CHARS.length; c++) {
        const cell = selectedPrimaryCell.subCells[r * HEX_CHARS.length + c];
        if (cell) row.push(cell);
      }
      secondaryRows.push(row);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by prefix, node name, public key, or role..."
          aria-label="Search prefix matrix"
          data-testid="prefix-matrix-search"
          className="flex-1 bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
        />
        <button
          onClick={handleSuggestFreePrefix}
          data-testid="prefix-matrix-suggest"
          className="btn-accent px-4 py-2.5 text-sm whitespace-nowrap"
        >
          Suggest Free Prefix
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-muted">
        <LegendSwatch className="bg-night-800/50 border border-card-border" label={`Free (${freePrimaryCount}/256 first bytes)`} />
        <LegendSwatch className="bg-mesh/30 border border-mesh/50" label="Used" />
        <LegendSwatch className="bg-amber-500/40 border border-amber-500/60" label="Duplicate prefix" />
        <LegendSwatch className="bg-red-500/40 border border-red-500/60" label="Repeater collision" />
        <LegendSwatch className="bg-foreground-muted/20 border border-foreground-muted/40" label="Reserved" />
        <span className="text-foreground-muted/50">|</span>
        <span data-testid="prefix-matrix-summary">
          {loading && nodes.length === 0 ? (
            'Loading prefix data...'
          ) : (
            <>
              {totalNodes} nodes · {analysis.occupiedPrefixCount} occupied 4-char prefixes
              {analysis.duplicatePrefixCount > 0 && ` · ${analysis.duplicatePrefixCount} duplicates`}
              {analysis.repeaterCollisionCount > 0 && ` · ${analysis.repeaterCollisionCount} repeater collisions`}
            </>
          )}
        </span>
      </div>

      {/* Primary 16x16 grid (first byte) */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wider text-foreground-muted">
            First-byte prefix (2 chars)
          </p>
          <p className="text-[11px] text-foreground-muted/70">
            Click a tile to drill into its 4-character subgrid
          </p>
        </div>
        <PrefixGrid
          rows={primaryRows}
          selectedId={selectedPrimary}
          highlightedIds={isSearching ? searchResult.matchedPrimaryPrefixes : null}
          onCellClick={(cell) => handlePrimaryClick(cell.id)}
          renderCellContent={(cell) => (cell.count > 0 ? cell.count : "")}
          getCellTitle={(cell) => {
            const reservedTag = cell.reserved ? " · reserved" : "";
            return cell.count > 0
              ? `${cell.id}: ${cell.count} node(s) across ${cell.occupiedSubCellCount} prefixes${reservedTag}`
              : `${cell.id}: free${reservedTag}`;
          }}
          testIdPrefix="prefix-matrix-primary"
          ariaLabel="First-byte prefix matrix"
        />
      </div>

      {/* Secondary 16x16 grid (3rd/4th characters of selected primary) */}
      {selectedPrimaryCell && (
        <div className="card-mesh p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm font-bold text-foreground">
              0x{selectedPrimaryCell.id}__ subgrid
            </p>
            <button
              onClick={() => {
                setSelectedPrimary(null);
                setSelectedSecondary(null);
              }}
              className="text-foreground-muted hover:text-foreground text-sm"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-foreground-muted">
            Each tile is a full 4-character prefix starting with 0x{selectedPrimaryCell.id}.
            Click a free tile to use it. Reserved and occupied tiles cannot be selected.
          </p>
          <PrefixGrid
            rows={secondaryRows}
            selectedId={selectedSecondary}
            highlightedIds={isSearching ? searchResult.matchedPrefixes : null}
            onCellClick={handleSecondaryClick}
            renderCellContent={(cell) => (cell.count > 0 ? cell.count : cell.reserved ? "·" : "")}
            getCellTitle={(cell) => describeCell(cell)}
            testIdPrefix="prefix-matrix-secondary"
            ariaLabel={`Subgrid for 0x${selectedPrimaryCell.id}`}
          />
        </div>
      )}

      {/* Detail panel for the selected 4-character prefix */}
      {selectedSecondaryCell && (
        <div className="card-mesh p-4" data-testid="prefix-matrix-detail">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-sm font-bold text-foreground">
              Prefix: 0x{selectedSecondaryCell.id}
            </p>
            <button
              onClick={() => setSelectedSecondary(null)}
              className="text-foreground-muted hover:text-foreground text-sm"
            >
              Close
            </button>
          </div>

          {selectedSecondaryCell.severity === "repeater-collision" && (
            <SeverityNotice
              tone="red"
              text={`Repeater/room-server collision — ${selectedSecondaryCell.count} infrastructure nodes share this 4-character prefix.`}
            />
          )}
          {selectedSecondaryCell.severity === "duplicate" && (
            <SeverityNotice
              tone="amber"
              text={`${selectedSecondaryCell.count} nodes share 0x${selectedSecondaryCell.id}. Pick a different 4-character prefix to avoid routing ambiguity.`}
            />
          )}
          {selectedSecondaryCell.reserved && (
            <SeverityNotice
              tone="muted"
              text="Reserved prefix — do not use for new MeshCore identities."
            />
          )}
          {selectedSecondaryCell.severity === "free" && (
            <div className="text-center py-4">
              <p className="text-forest-500 font-semibold text-sm mb-1">
                This prefix is free!
              </p>
              <p className="text-xs text-foreground-muted">
                No nodes are using the 0x{selectedSecondaryCell.id} prefix.
              </p>
            </div>
          )}

          {selectedSecondaryCell.nodes.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
              {selectedSecondaryCell.nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-card-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        node.isOnline ? "bg-forest-500" : "bg-foreground-muted/30"
                      }`}
                      aria-hidden
                    />
                    <span className="text-foreground truncate">{node.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-foreground-muted/70 ml-1">
                      {node.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="font-mono text-xs text-foreground-muted">
                      {node.publicKey?.slice(0, 8) ?? node.prefix4}…
                    </span>
                    {node.lastHeardAt && (
                      <span className="text-xs text-foreground-muted/50">
                        {formatLastSeen(node.lastHeardAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* How to change your key */}
      <div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center gap-2 text-sm text-mesh hover:text-mesh-light transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showHelp ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          How to get a non-conflicting key
        </button>

        {showHelp && (
          <div className="mt-3 card-mesh p-5 space-y-4 text-sm text-foreground-muted">
            <div>
              <p className="font-semibold text-foreground mb-2">Generating a new key:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check which prefixes are free using the grid above or{" "}
                  <a href="https://analyzer.letsmesh.net/nodes/prefix-utilization" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
                    analyzer.letsmesh.net
                  </a>{" "}for the broader network
                </li>
                <li>Go to the{" "}
                  <a href="https://gessaman.com/mc-keygen/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
                    MeshCore Key Generator
                  </a>
                </li>
                <li>Enter your desired 4-character hex prefix</li>
                <li>Click &ldquo;Generate Key&rdquo; &mdash; it finds a matching Ed25519 key pair in seconds</li>
                <li>Copy the <strong className="text-foreground">private key</strong> (128 hex characters)</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Applying to a Companion device (via mobile app):</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Connect your device via USB-C or Bluetooth</li>
                <li>Open the MeshCore app &rarr; tap Settings (gear icon, top-right)</li>
                <li>Scroll down &rarr; tap &ldquo;Manage Identity Key&rdquo;</li>
                <li>Paste your 128-character <strong className="text-foreground">private key</strong> (not the public key)</li>
                <li>Tap &ldquo;Import Private Key&rdquo;</li>
                <li>Tap the checkmark to save</li>
                <li>Verify the new public key prefix on the main screen</li>
              </ol>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-2">Applying to a Repeater (via serial console):</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Connect repeater to computer via USB</li>
                <li>Open the{" "}
                  <a href="https://flasher.meshcore.io/" target="_blank" rel="noopener noreferrer" className="text-mesh hover:text-mesh-light">
                    MeshCore Web Console
                  </a>{" "}or a serial terminal
                </li>
                <li>Run: <code className="bg-night-800 px-1.5 py-0.5 rounded font-mono text-xs text-mesh">set prv.key &lt;your_128_char_private_key&gt;</code></li>
                <li>Takes effect immediately &mdash; verify the prefix matches</li>
              </ol>
            </div>

            <div className="card-mesh p-3 bg-sunset-500/5 border-sunset-500/20">
              <p className="text-xs">
                <strong className="text-foreground">Heads up:</strong> Changing your key means other nodes will see you as a new device. Message history with your old key is lost. Your custom key persists through firmware re-flashes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PrefixGridProps<TCell extends PrefixCell> {
  rows: readonly (readonly TCell[])[];
  selectedId: string | null;
  highlightedIds: ReadonlySet<string> | null;
  onCellClick: (cell: TCell) => void;
  renderCellContent: (cell: TCell) => React.ReactNode;
  getCellTitle: (cell: TCell) => string;
  testIdPrefix: string;
  ariaLabel: string;
}

function PrefixGrid<TCell extends PrefixCell>({
  rows,
  selectedId,
  highlightedIds,
  onCellClick,
  renderCellContent,
  getCellTitle,
  testIdPrefix,
  ariaLabel,
}: PrefixGridProps<TCell>) {
  const colCount = HEX_CHARS.length;
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table
        className="min-w-[520px] w-full table-fixed border-separate border-spacing-0.5"
        role="grid"
        aria-label={ariaLabel}
        aria-rowcount={rows.length + 1}
        aria-colcount={colCount + 1}
      >
        <colgroup>
          <col className="w-7" />
          {HEX_CHARS.map((c) => (
            <col key={c} />
          ))}
        </colgroup>
        <thead>
          <tr role="row" aria-rowindex={1}>
            <th
              scope="col"
              role="columnheader"
              aria-colindex={1}
              className="text-[10px] font-mono text-foreground-muted/50"
            >
              <span className="sr-only">Row label</span>
            </th>
            {HEX_CHARS.map((c, colIdx) => (
              <th
                key={c}
                scope="col"
                role="columnheader"
                aria-colindex={colIdx + 2}
                className="text-center text-[10px] font-mono text-foreground-muted/50"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} role="row" aria-rowindex={rowIdx + 2}>
              <th
                scope="row"
                role="rowheader"
                aria-colindex={1}
                className="pr-1 text-right align-middle text-[10px] font-mono text-foreground-muted/50"
              >
                {HEX_CHARS[rowIdx]}x
              </th>
              {row.map((cell, colIdx) => {
                const isSelected = selectedId === cell.id;
                const isDimmed = highlightedIds !== null && !highlightedIds.has(cell.id);
                const label = getCellTitle(cell);
                return (
                  <td
                    key={cell.id}
                    role="gridcell"
                    aria-colindex={colIdx + 2}
                    aria-selected={isSelected}
                    aria-label={label}
                    tabIndex={0}
                    onClick={() => onCellClick(cell)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onCellClick(cell);
                      }
                    }}
                    title={label}
                    data-testid={`${testIdPrefix}-${cell.id}`}
                    data-severity={cell.severity}
                    className={`aspect-square cursor-pointer rounded-sm p-0 align-middle text-[9px] font-mono transition-all focus:outline-2 focus:outline-offset-2 focus:outline-mesh ${cellClassName(cell.severity, isSelected)} ${isDimmed ? "opacity-20" : ""}`}
                  >
                    <span aria-hidden="true" className="flex aspect-square w-full items-center justify-center">
                      {renderCellContent(cell)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClassName(severity: PrefixCellSeverity, isSelected: boolean): string {
  if (isSelected) {
    if (severity === "repeater-collision") return "bg-red-500/80 text-white ring-1 ring-red-400 scale-110 z-10";
    if (severity === "duplicate") return "bg-amber-500/80 text-white ring-1 ring-amber-400 scale-110 z-10";
    if (severity === "used") return "bg-mesh/70 text-white ring-1 ring-mesh scale-110 z-10";
    if (severity === "reserved") return "bg-foreground-muted/40 text-foreground ring-1 ring-foreground-muted/60 scale-110 z-10";
    return "bg-mesh text-white ring-1 ring-mesh scale-110 z-10";
  }
  switch (severity) {
    case "repeater-collision":
      return "bg-red-500/40 border border-red-500/60 text-red-200 hover:bg-red-500/50";
    case "duplicate":
      return "bg-amber-500/40 border border-amber-500/60 text-amber-400 hover:bg-amber-500/50";
    case "used":
      return "bg-mesh/30 border border-mesh/50 text-mesh hover:bg-mesh/40";
    case "reserved":
      return "bg-foreground-muted/15 border border-foreground-muted/30 text-foreground-muted/70 hover:border-foreground-muted/50";
    case "free":
    default:
      return "bg-night-800/50 border border-card-border text-foreground-muted/30 hover:border-mesh/50 hover:text-foreground-muted";
  }
}

function describeCell(cell: PrefixCell): string {
  if (cell.severity === "repeater-collision") {
    return `0x${cell.id}: repeater collision (${cell.count} nodes)`;
  }
  if (cell.severity === "duplicate") {
    return `0x${cell.id}: duplicate (${cell.count} nodes)`;
  }
  if (cell.severity === "used") {
    return `0x${cell.id}: 1 node`;
  }
  if (cell.reserved) {
    return `0x${cell.id}: reserved`;
  }
  return `0x${cell.id}: free — click to use`;
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-4 h-4 rounded ${className}`} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

function SeverityNotice({ tone, text }: { tone: "red" | "amber" | "muted"; text: string }) {
  const colorClass =
    tone === "red"
      ? "text-red-400"
      : tone === "amber"
      ? "text-amber-500"
      : "text-foreground-muted";
  return (
    <p className={`text-xs flex items-start gap-1.5 ${colorClass}`}>
      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <span>{text}</span>
    </p>
  );
}

function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
