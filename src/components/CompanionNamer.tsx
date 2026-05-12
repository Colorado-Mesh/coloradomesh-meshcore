"use client";

import { useId, useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import {
  COMPANION_ROLES,
  buildCompanionName,
  buildCompanionSuffix,
  MESHCORE_NAME_LIMIT,
  type CompanionSuffixStrategy,
} from "@/lib/meshcore-tools/naming";
import {
  createCompanionConfigExport,
  stringifySettingsJson,
} from "@/lib/meshcore-tools/config-export";

function takeFirstGrapheme(value: string): string {
  if (!value) return "";
  const SegmenterCtor =
    typeof Intl !== "undefined"
      ? (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter
      : undefined;
  if (typeof SegmenterCtor === "function") {
    try {
      const segmenter = new SegmenterCtor();
      const iterator = segmenter.segment(value)[Symbol.iterator]();
      const first = iterator.next();
      if (!first.done) return first.value.segment;
      return "";
    } catch {
      // fall through to code-point fallback
    }
  }
  const iterator = value[Symbol.iterator]();
  const first = iterator.next();
  return first.done ? "" : first.value;
}

export default function CompanionNamer() {
  const [emoji, setEmoji] = useState("");
  const [handle, setHandle] = useState("");
  const [strategy, setStrategy] = useState<CompanionSuffixStrategy>("pubkey");
  const [pubkeyPrefix, setPubkeyPrefix] = useState("");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [number, setNumber] = useState("");

  const emojiId = useId();
  const handleId = useId();
  const pubkeyId = useId();
  const roleId = useId();
  const customRoleId = useId();
  const numberId = useId();

  const suffix = useMemo(
    () =>
      buildCompanionSuffix({
        strategy,
        pubkeyPrefix,
        role,
        customRole,
        number,
      }),
    [strategy, pubkeyPrefix, role, customRole, number],
  );

  const generatedName = useMemo(
    () => buildCompanionName({ emoji, handle, suffix, suffixStrategy: strategy }),
    [emoji, handle, suffix, strategy],
  );

  // Count visible characters (emoji = ~2 display chars, but counts as 1 in MeshCore)
  const charCount = generatedName.length;
  const isOverLimit = charCount > MESHCORE_NAME_LIMIT;

  const configExport = useMemo(
    () => createCompanionConfigExport({ emoji, handle, suffix, suffixStrategy: strategy }),
    [emoji, handle, suffix, strategy],
  );
  const configPreview = configExport.ok
    ? stringifySettingsJson(configExport.settingsJson)
    : "";

  const handleDownloadConfig = () => {
    if (!configExport.ok) return;
    const blob = new Blob([stringifySettingsJson(configExport.settingsJson)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = configExport.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const strategies: { value: CompanionSuffixStrategy; label: string; desc: string }[] = [
    { value: "pubkey", label: "Public key prefix", desc: "4 hex chars from your public key (default)" },
    { value: "role", label: "Role", desc: "2-4 chars: PRIM, SCND, HOME, etc." },
    { value: "number", label: "Number", desc: "01-99 (auto-prefixed with MY)" },
  ];

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="card-mesh p-5 text-center">
        <p className="text-xs text-foreground-muted uppercase tracking-wider mb-2">
          Companion Name Preview
        </p>
        <div className="flex items-center justify-center gap-2">
          <p
            className={`font-mono text-xl md:text-2xl font-bold ${
              isOverLimit ? "text-red-500" : generatedName ? "text-mesh" : "text-foreground-muted"
            }`}
          >
            {generatedName || "\uD83D\uDC7B M3SHGH\u00D8ST F4"}
          </p>
          {generatedName && <CopyButton text={generatedName} />}
        </div>
        <span
          className={`text-sm font-mono ${
            isOverLimit ? "text-red-500 font-bold" : "text-foreground-muted"
          }`}
        >
          {charCount}/23 chars
        </span>
      </div>

      {/* Emoji */}
      <div>
        <label htmlFor={emojiId} className="block text-sm font-semibold text-foreground mb-1">
          Emoji
        </label>
        <p className="text-xs text-foreground-muted mb-2">
          One emoji per person. Claim yours in Discord first.
        </p>
        <input
          id={emojiId}
          type="text"
          value={emoji}
          onChange={(e) => {
            setEmoji(takeFirstGrapheme(e.target.value));
          }}
          placeholder="\uD83D\uDC7B"
          className="w-20 bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground text-2xl text-center focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
        />
      </div>

      {/* Handle */}
      <div>
        <label htmlFor={handleId} className="block text-sm font-semibold text-foreground mb-1">
          Handle
        </label>
        <p className="text-xs text-foreground-muted mb-2">
          Your mesh alias (not your real name). Max 10 characters.
        </p>
        <input
          id={handleId}
          type="text"
          value={handle}
          onChange={(e) =>
            setHandle(
              e.target.value.replace(/[^a-zA-Z0-9\u00D8]/g, "").slice(0, 10)
            )
          }
          placeholder="e.g. M3SHGH\u00D8ST"
          maxLength={10}
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
        />
      </div>

      {/* Suffix Strategy */}
      <div>
        <span className="block text-sm font-semibold text-foreground mb-1">
          Identification Suffix
        </span>
        <p className="text-xs text-foreground-muted mb-3">
          How do you want to identify this device?
        </p>
        <div className="space-y-2">
          {strategies.map((s) => (
            <label
              key={s.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                strategy === s.value
                  ? "border-mesh bg-mesh/10"
                  : "border-card-border bg-night-800/20 hover:border-mesh/50"
              }`}
            >
              <input
                type="radio"
                name="suffix-strategy"
                value={s.value}
                checked={strategy === s.value}
                onChange={() => setStrategy(s.value)}
                className="mt-0.5 text-mesh focus:ring-mesh"
              />
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {s.label}
                </span>
                <p className="text-xs text-foreground-muted">{s.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Strategy-specific input */}
        <div className="mt-3">
          {strategy === "pubkey" && (
            <input
              id={pubkeyId}
              type="text"
              value={pubkeyPrefix}
              onChange={(e) =>
                setPubkeyPrefix(
                  e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 4)
                )
              }
              placeholder="e.g. F4A2"
              maxLength={4}
              aria-label="Public key prefix"
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
            />
          )}
          {strategy === "role" && (
            <div className="space-y-2">
              <select
                id={roleId}
                value={role}
                onChange={(e) => { setRole(e.target.value); setCustomRole(""); }}
                aria-label="Companion role"
                className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
              >
                <option value="">Select role...</option>
                {COMPANION_ROLES.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} — {r.label}
                  </option>
                ))}
                <option value="__custom">Custom...</option>
              </select>
              {role === "__custom" && (
                <input
                  id={customRoleId}
                  type="text"
                  value={customRole}
                  onChange={(e) =>
                    setCustomRole(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 4))
                  }
                  placeholder="e.g. CAMP"
                  maxLength={4}
                  aria-label="Custom role code"
                  className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
                />
              )}
              {role && role !== "__custom" && (
                <p className="text-xs text-foreground-muted">
                  {COMPANION_ROLES.find((r) => r.code === role)?.description}
                </p>
              )}
            </div>
          )}
          {strategy === "number" && (
            <input
              id={numberId}
              type="text"
              value={number}
              onChange={(e) =>
                setNumber(
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 2)
                )
              }
              placeholder="e.g. 01"
              maxLength={2}
              aria-label="Companion number"
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
            />
          )}
        </div>
      </div>

      {/* Settings JSON */}
      <div className="card-mesh p-6 bg-mountain-500/5 border-mountain-500/20">
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span aria-hidden="true">&#9881;&#65039;</span> Settings JSON
        </p>
        <div className="space-y-3 text-sm text-foreground-muted">
          <p>
            Generate a MeshCore settings JSON file with the Colorado Mesh radio defaults and your companion name. Private keys are not included.
          </p>
          {configExport.ok ? (
            <>
              <div className="rounded-lg border border-card-border bg-night-900/80 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
                  {configExport.fileName}
                </p>
                <pre
                  aria-label="Companion settings JSON preview"
                  className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-forest-400"
                >
                  {configPreview}
                </pre>
              </div>
              {configExport.warnings.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-xs text-amber-400">
                  {configExport.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleDownloadConfig}
                className="btn-accent text-sm px-4 py-2"
              >
                Download settings JSON
              </button>
            </>
          ) : (
            <div className="rounded-lg border border-card-border bg-night-800/30 p-3 text-xs text-foreground-muted">
              Complete a valid companion name to enable settings JSON export.
            </div>
          )}
        </div>
      </div>

      {/* Do Not rules */}
      <div className="card-mesh p-4 bg-sunset-500/5 border-sunset-500/20">
        <p className="text-sm font-semibold text-foreground mb-2">Do Not:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-foreground-muted">
          {[
            "Use your real name",
            "Put hardware in the name",
            "Use different emojis per device",
            "Take someone else\u2019s emoji",
            "Go over 23 characters",
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sunset-500">&#10005;</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
