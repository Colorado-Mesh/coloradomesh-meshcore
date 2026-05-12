"use client";

import { useState, useMemo } from "react";
import { airports } from "@/lib/data/airports";
import { cities } from "@/lib/data/cities";
import { landmarks } from "@/lib/data/landmarks";
import { haversineDistance } from "@/lib/utils/haversine";
import { COMMUNITY_NAME, SITE_NAME } from "@/lib/constants";
import { MESHCORE_NODE_TYPES } from "@/lib/meshcore-data/node-types";
import { createRepeaterConfigExport, stringifySettingsJson } from "@/lib/meshcore-tools/config-export";
import { buildRepeaterName } from "@/lib/meshcore-tools/naming";
import {
  buildPrefixAnalysis,
  normalizePublicKeyPrefix,
} from "@/lib/meshcore-tools/prefixes";
import { useMapSnapshot } from "@/hooks/useMapSnapshot";
import CompanionNamer from "./CompanionNamer";

// --- Component ---

export default function NamingWizard() {
  const [region, setRegion] = useState("");
  const [cityMode, setCityMode] = useState<"known" | "custom">("known");
  const [cityCode, setCityCode] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [skipCity, setSkipCity] = useState(false);
  const [landmarkMode, setLandmarkMode] = useState<"known" | "custom">("custom");
  const [landmarkCode, setLandmarkCode] = useState("");
  const [customLandmark, setCustomLandmark] = useState("");
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [nodeType, setNodeType] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [copied, setCopied] = useState(false);

  // Airport lookup state
  const [addressInput, setAddressInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Pubkey conflict state — sourced from the canonical map snapshot
  const { nodes: allNodes, loading: nodesLoading, error: nodesError } = useMapSnapshot();
  const nodesLoaded = !nodesLoading && !nodesError;

  // Shared 4-character prefix analysis powers conflict warnings
  const prefixAnalysis = useMemo(() => buildPrefixAnalysis(allNodes), [allNodes]);

  const pubkeyState = useMemo(() => {
    const fullPrefix = normalizePublicKeyPrefix(pubkey, 4);
    if (!fullPrefix) {
      // Partial input — fall back to first-byte rollup once we have 2 chars
      const partial = normalizePublicKeyPrefix(pubkey, 2);
      if (!partial) return null;
      const primary = prefixAnalysis.primaryCells.get(partial);
      if (!primary || primary.count === 0) return null;
      return {
        kind: "partial" as const,
        prefix: partial,
        count: primary.count,
      };
    }

    const cell = prefixAnalysis.secondaryCells.get(fullPrefix);
    if (!cell) return null;

    if (cell.severity === "repeater-collision") {
      return { kind: "repeater-collision" as const, prefix: fullPrefix, count: cell.count };
    }
    if (cell.severity === "duplicate") {
      return { kind: "duplicate" as const, prefix: fullPrefix, count: cell.count };
    }
    if (cell.reserved) {
      return { kind: "reserved" as const, prefix: fullPrefix, count: cell.count };
    }
    if (cell.count > 0) {
      return { kind: "used" as const, prefix: fullPrefix, count: cell.count };
    }

    const primary = prefixAnalysis.primaryCells.get(fullPrefix.slice(0, 2));
    if (primary && primary.count > 0) {
      return {
        kind: "crowded" as const,
        prefix: fullPrefix,
        count: primary.count,
        first: fullPrefix.slice(0, 2),
      };
    }

    return { kind: "free" as const, prefix: fullPrefix, count: 0 };
  }, [pubkey, prefixAnalysis]);

  const city = cityMode === "known" ? cityCode : customCity.toUpperCase();

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const q = citySearch.toLowerCase();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [citySearch]);

  const filteredLandmarks = useMemo(() => {
    if (!landmarkSearch) return landmarks;
    const q = landmarkSearch.toLowerCase();
    return landmarks.filter(
      (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [landmarkSearch]);
  const landmark = landmarkMode === "known" ? landmarkCode : customLandmark;

  const generatedName = useMemo(
    () => buildRepeaterName({ region, city, skipCity, landmark, nodeType, pubkey }),
    [region, city, skipCity, landmark, nodeType, pubkey]
  );

  const charCount = generatedName.length;
  const isOverLimit = charCount > 23;
  const isComplete = region && (skipCity || city) && landmark && nodeType && pubkey.length === 4;

  // Validation
  const landmarkMaxLen = skipCity ? 11 : 5;
  const cityValid = skipCity || (city.length >= 1 && city.length <= 5 && /^[A-Z]+$/.test(city));
  const landmarkValid = landmark.length >= 1 && landmark.length <= landmarkMaxLen && /^[A-Za-z0-9.+_|]+$/.test(landmark);
  const pubkeyValid = /^[A-Fa-f0-9]{4}$/.test(pubkey);

  const errors: string[] = [];
  if (city && !skipCity && !cityValid) errors.push("City must be 1\u20135 letters only");
  if (landmark && !landmarkValid) errors.push(`Landmark must be 1\u2013${landmarkMaxLen} chars (A-Z, a-z, 0-9, +, ., _, |)`);
  if (pubkey && !pubkeyValid) errors.push("Pub key must be exactly 4 hex chars (0-9, A-F)");
  if (isOverLimit) errors.push("Name exceeds 23-character limit");

  const configExport = useMemo(
    () => createRepeaterConfigExport({ region, city, skipCity, landmark, nodeType, pubkey }),
    [region, city, skipCity, landmark, nodeType, pubkey]
  );
  const configPreview = configExport.ok
    ? stringifySettingsJson(configExport.settingsJson)
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const handleAirportLookup = async () => {
    if (!addressInput.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addressInput)}`);
      const body = await res.json();
      if (!res.ok || !body.success || !body.data) {
        setLookupError(body.error || "Location not found. Try a more specific address.");
        return;
      }
      const userLat = body.data.lat;
      const userLng = body.data.lon;

      // Find nearest airport
      let nearest = airports[0];
      let minDist = Infinity;
      for (const ap of airports) {
        const d = haversineDistance(userLat, userLng, ap.lat, ap.lng);
        if (d < minDist) {
          minDist = d;
          nearest = ap;
        }
      }

      setRegion(nearest.code);
      setLookupResult(`Nearest: ${nearest.code} \u2014 ${nearest.airport} (${Math.round(minDist)} km)`);
    } catch {
      setLookupError("Lookup failed. Check your connection and try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div className="card-mesh p-6 text-center">
        <p className="text-xs text-foreground-muted uppercase tracking-wider mb-2">Generated Name</p>
        <p className={`font-mono text-2xl md:text-3xl font-bold ${isOverLimit ? 'text-red-500' : generatedName ? 'text-mesh' : 'text-foreground-muted'}`}>
          {generatedName || "DEN-DNVR-CHSPK-RC-9F2E"}
        </p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className={`text-sm font-mono ${isOverLimit ? 'text-red-500 font-bold' : 'text-foreground-muted'}`}>
            {charCount}/23 chars
          </span>
          {isComplete && !isOverLimit && errors.length === 0 && (
            <button
              onClick={handleCopy}
              className="btn-accent text-sm px-4 py-1.5 inline-flex items-center gap-2"
            >
              {copied ? "Copied!" : "Copy"}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                )}
              </svg>
            </button>
          )}
        </div>
        {errors.length > 0 && (
          <div className="mt-3 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-red-500 text-xs">{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Format Reference */}
      <div className="card-mesh p-4 bg-night-800/20">
        <p className="font-mono text-sm text-center text-foreground-muted">
          <span className={region ? "text-mesh" : ""}>[REGION]</span>
          <span>-</span>
          <span className={!skipCity && city ? "text-mesh" : skipCity ? "line-through opacity-50" : ""}>[CITY]</span>
          <span className={skipCity ? "opacity-50" : ""}>-</span>
          <span className={landmark ? "text-mesh" : ""}>[LANDMARK]</span>
          <span>-</span>
          <span className={nodeType ? "text-mesh" : ""}>[TYPE]</span>
          <span>-</span>
          <span className={pubkey ? "text-mesh" : ""}>[PUBKEY]</span>
        </p>
      </div>

      {/* Step 1: Region */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">1.</span>Region (IATA Airport Code)
        </label>
        <p className="text-xs text-foreground-muted mb-3">Select the nearest commercial airport to your node location.</p>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="Region airport code"
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none"
        >
          <option value="">Select region...</option>
          {airports.map((r) => (
            <option key={r.code} value={r.code}>
              {r.code} — {r.city} ({r.airport})
            </option>
          ))}
        </select>

        {/* Airport Auto-Lookup */}
        <div className="mt-4 pt-4 border-t border-card-border">
          <p className="text-xs font-semibold text-foreground mb-2">Not sure? Find your nearest airport:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAirportLookup()}
              placeholder='e.g. "Denver, CO" or "80202"'
              className="flex-1 bg-night-800/30 border border-card-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
            />
            <button
              onClick={handleAirportLookup}
              disabled={lookupLoading || !addressInput.trim()}
              className="btn-accent text-sm px-4 py-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {lookupLoading && (
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Find Nearest
            </button>
          </div>
          {lookupResult && (
            <p className="text-xs text-forest-500 mt-2">{lookupResult}</p>
          )}
          {lookupError && (
            <p className="text-xs text-red-500 mt-2">{lookupError}</p>
          )}
          <p className="text-[10px] text-foreground-muted/50 mt-2">
            Your address is sent through this site&apos;s geocode proxy to OpenStreetMap&apos;s Nominatim service only when you click lookup. No data is stored.
          </p>
        </div>
      </div>

      {/* Step 2: City */}
      <div className="card-mesh p-6">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-semibold text-foreground">
            <span className="text-mountain-500 mr-2">2.</span>City
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
            <input
              type="checkbox"
              checked={skipCity}
              onChange={(e) => setSkipCity(e.target.checked)}
              className="rounded border-card-border text-mesh focus:ring-mesh"
            />
            Skip (prominent landmark)
          </label>
        </div>
        <p className="text-xs text-foreground-muted mb-3">
          {skipCity
            ? "City skipped \u2014 landmark can be up to 11 characters."
            : "1\u20135 letters. Pick from known codes or type your own."}
        </p>
        {!skipCity && (
          <>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setCityMode("known")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${cityMode === "known" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
              >
                Pick from list
              </button>
              <button
                onClick={() => setCityMode("custom")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${cityMode === "custom" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
              >
                Type custom
              </button>
            </div>
            {cityMode === "known" ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Search cities..."
                  className="w-full bg-night-800/30 border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
                />
                <select
                  value={cityCode}
                  onChange={(e) => setCityCode(e.target.value)}
                  size={6}
                  aria-label="Known city code"
                  className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none text-sm"
                >
                  <option value="">Select city...</option>
                  {filteredCities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                {citySearch && (
                  <p className="text-xs text-foreground-muted">{filteredCities.length} cities found</p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5))}
                placeholder="e.g. DENVR"
                maxLength={5}
                className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
              />
            )}
          </>
        )}
      </div>

      {/* Step 3: Landmark */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">3.</span>Landmark
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          1\u2013{landmarkMaxLen} chars. Mixed case OK for readability (e.g. RdRcks). A-Z, a-z, 0-9, <span className="font-mono">+ . _ |</span>
        </p>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setLandmarkMode("known")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${landmarkMode === "known" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
          >
            Pick from list
          </button>
          <button
            onClick={() => setLandmarkMode("custom")}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${landmarkMode === "custom" ? "bg-mesh text-white" : "bg-night-800/30 text-foreground-muted hover:bg-night-800/50"}`}
          >
            Type custom
          </button>
        </div>
        {landmarkMode === "known" ? (
          <div className="space-y-2">
            <input
              type="text"
              value={landmarkSearch}
              onChange={(e) => setLandmarkSearch(e.target.value)}
              placeholder="Search landmarks..."
              className="w-full bg-night-800/30 border border-card-border rounded-lg px-4 py-2 text-sm text-foreground focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
            />
            <select
              value={landmarkCode}
              onChange={(e) => setLandmarkCode(e.target.value)}
              size={6}
              aria-label="Known landmark code"
              className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none text-sm"
            >
              <option value="">Select landmark...</option>
              {filteredLandmarks.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} — {l.name}
                </option>
              ))}
            </select>
            {landmarkSearch && (
              <p className="text-xs text-foreground-muted">{filteredLandmarks.length} landmarks found</p>
            )}
          </div>
        ) : (
          <input
            type="text"
            value={customLandmark}
            onChange={(e) => setCustomLandmark(e.target.value.replace(/[^a-zA-Z0-9.+_|]/g, "").slice(0, landmarkMaxLen))}
            placeholder="e.g. RdRcks"
            maxLength={landmarkMaxLen}
            className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
          />
        )}
      </div>

      {/* Step 4: Node Type */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">4.</span>Node Type
        </label>
        <p className="text-xs text-foreground-muted mb-3">What kind of infrastructure node is this?</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MESHCORE_NODE_TYPES.map((t) => (
            <button
              key={t.code}
              onClick={() => setNodeType(t.code)}
              className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                nodeType === t.code
                  ? "border-mesh bg-mesh/10 text-foreground"
                  : "border-card-border bg-night-800/20 text-foreground-muted hover:border-mesh/50"
              }`}
            >
              <span className="font-mono font-bold text-sm">{t.code}</span>
              <span className="text-sm ml-2">{t.label}</span>
              <p className="text-xs text-foreground-muted mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Public Key */}
      <div className="card-mesh p-6">
        <label className="block text-sm font-semibold text-foreground mb-1">
          <span className="text-mountain-500 mr-2">5.</span>Public Key Prefix
        </label>
        <p className="text-xs text-foreground-muted mb-3">
          First 4 hex characters (0-9, A-F) of your node&apos;s public key.
        </p>
        <input
          type="text"
          value={pubkey}
          onChange={(e) => setPubkey(e.target.value.replace(/[^a-fA-F0-9]/g, "").slice(0, 4))}
          placeholder="e.g. 9F2E"
          maxLength={4}
          className="w-full bg-night-800/50 border border-card-border rounded-lg px-4 py-2.5 text-foreground font-mono uppercase focus:ring-2 focus:ring-mesh focus:border-mesh outline-none placeholder:text-foreground-muted/50"
        />

        {/* Conflict indicator — driven by shared 4-character analysis */}
        {pubkey.length >= 2 && nodesLoaded && (
          <div className="mt-2">
            <PubkeyConflictMessage
              state={pubkeyState}
              pubkeyLength={pubkey.length}
              communityName={COMMUNITY_NAME}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-3">
          <a
            href="/tools/prefix-matrix"
            className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-xs"
          >
            {SITE_NAME} Prefix Map
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
          <a
            href="https://analyzer.letsmesh.net/nodes/prefix-utilization"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-muted hover:text-mesh inline-flex items-center gap-1 text-xs"
          >
            Global Prefix Utilization
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <a
            href="https://gessaman.com/mc-keygen/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mesh hover:text-mesh-light inline-flex items-center gap-1 text-xs"
          >
            Key Generator
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Settings JSON */}
      <div className="card-mesh p-6 bg-mountain-500/5 border-mountain-500/20">
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <span aria-hidden="true">&#9881;&#65039;</span> Settings JSON
        </p>
        <div className="space-y-3 text-sm text-foreground-muted">
          <p>
            Generate a MeshCore settings JSON file with the Colorado Mesh radio defaults, region list, selected node type, and generated name. Private keys are not included.
          </p>
          {configExport.ok ? (
            <>
              <div className="rounded-lg border border-card-border bg-night-900/80 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-foreground-muted">
                  {configExport.fileName}
                </p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-forest-400">
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
              Complete a valid repeater name to enable settings JSON export.
            </div>
          )}
          <p>
            <strong className="text-foreground">Ownership:</strong> Set the ownership field to <span className="font-mono text-mesh">@yourdiscordname</span> (firmware 1.12.0+). Do not put emojis in repeater names.
          </p>
          <p>
            <strong className="text-foreground">Region Setting:</strong> Set your repeater&apos;s region setting to match its IATA code{region ? <> (<span className="font-mono text-mesh">{region}</span>)</> : ""}.
          </p>
        </div>
      </div>

      {/* Companion Naming */}
      <div className="border-t border-card-border pt-8 mt-8">
        <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">📱</span>
          Companion Node Naming
        </h2>
        <p className="text-sm text-foreground-muted mb-6">
          Companions (personal carry nodes) use a different format: <span className="font-mono text-mesh">[EMOJI] [HANDLE] [SUFFIX]</span>
        </p>
        <CompanionNamer />
      </div>
    </div>
  );
}

type PubkeyState =
  | { kind: "partial"; prefix: string; count: number }
  | { kind: "free"; prefix: string; count: number }
  | { kind: "used"; prefix: string; count: number }
  | { kind: "duplicate"; prefix: string; count: number }
  | { kind: "repeater-collision"; prefix: string; count: number }
  | { kind: "reserved"; prefix: string; count: number }
  | { kind: "crowded"; prefix: string; count: number; first: string };

function PubkeyConflictMessage({
  state,
  pubkeyLength,
  communityName,
}: {
  state: PubkeyState | null;
  pubkeyLength: number;
  communityName: string;
}) {
  if (state === null) {
    if (pubkeyLength < 4) {
      return (
        <p className="text-xs text-foreground-muted flex items-center gap-1.5">
          <WarningIcon />
          Enter all 4 hex characters to check for prefix conflicts.
        </p>
      );
    }
    return null;
  }

  switch (state.kind) {
    case "free":
      return (
        <p className="text-xs text-forest-500 flex items-center gap-1.5">
          <CheckIcon />
          Prefix 0x{state.prefix} is unique on the {communityName} network!
        </p>
      );
    case "partial":
      return (
        <p className="text-xs text-foreground-muted flex items-center gap-1.5">
          <WarningIcon />
          Enter all 4 hex characters to check for prefix conflicts. {state.count} node(s) currently start with 0x{state.prefix}.
        </p>
      );
    case "used":
      return (
        <p className="text-xs text-amber-500 flex items-center gap-1.5">
          <WarningIcon />
          Prefix 0x{state.prefix} is already used by another node. Pick a different 4-character prefix.
        </p>
      );
    case "duplicate":
      return (
        <p className="text-xs text-amber-500 flex items-center gap-1.5">
          <WarningIcon />
          Prefix 0x{state.prefix} is shared by {state.count} nodes. Pick a different 4-character prefix to avoid routing ambiguity.
        </p>
      );
    case "repeater-collision":
      return (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <WarningIcon />
          Repeater/room-server collision on 0x{state.prefix} ({state.count} infrastructure nodes). Pick a different prefix.
        </p>
      );
    case "reserved":
      return (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <WarningIcon />
          Prefix 0x{state.prefix} is reserved — do not use for new MeshCore identities.
        </p>
      );
    case "crowded":
      return (
        <p className="text-xs text-amber-500 flex items-center gap-1.5">
          <WarningIcon />
          Prefix 0x{state.prefix} is unused, but {state.count} other node(s) share its first byte 0x{state.first}. Consider a less crowded first byte.
        </p>
      );
  }
}

function WarningIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
