'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngBounds, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type {
  MapAdvancedFeature,
  MapConnectionStatus,
  MapNode,
  MapNodeRole,
  MapNodeStatus,
  MapRuntimePublicConfig,
  MapSnapshotSource,
  MapSnapshotWarning,
  MapStats,
} from '@/lib/types';
import { useMapSnapshot } from '@/hooks/useMapSnapshot';
import { DEFAULT_REFRESH_INTERVAL } from '@/lib/constants';

import MapControls from './map/MapControls';
import MapLegend from './map/MapLegend';
import MapStatsOverlay from './map/MapStatsOverlay';
import NodePopup from './map/NodePopup';
import MapDiagnosticsPanel from './map/MapDiagnosticsPanel';
import MapPreferencesPanel from './map/MapPreferencesPanel';
import LiveMapStatsPanel from './map/LiveMapStatsPanel';
import CoveragePanel from './map/CoveragePanel';
import LosPanel from './map/LosPanel';
import WeatherRadarPanel from './map/WeatherRadarPanel';
import PeerHistoryPanel from './map/PeerHistoryPanel';
import { buildMarkerHtml, MARKER_SIZING } from './map/markers';
import { useMapPreferences } from './map/preferences';

interface NetworkMapProps {
  nodes?: MapNode[];
  stats?: MapStats | null;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: Date | null;
  runtimeConfig?: MapRuntimePublicConfig | null;
  connection?: MapConnectionStatus | null;
  source?: MapSnapshotSource | null;
  warnings?: MapSnapshotWarning[];
  features?: MapAdvancedFeature[];
  refreshInterval?: number;
  className?: string;
  height?: number | string;
}

const COLORADO_CENTER: LatLngTuple = [39.5501, -105.7821];
const COLORADO_ZOOM = 7;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

type LocatedMapNode = MapNode & {
  coordinates: NonNullable<MapNode['coordinates']>;
};

function hasCoordinates(node: MapNode): node is LocatedMapNode {
  const coords = node.coordinates;
  if (!coords) return false;
  const { latitude, longitude } = coords;
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

interface FitBoundsProps {
  bounds: LatLngBounds | null;
}

function FitBounds({ bounds }: FitBoundsProps) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [bounds, map]);
  return null;
}

function ScrollWheelZoomGate() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    map.on('focus', enable);
    map.on('click', enable);
    map.on('blur', disable);
    map.on('mouseout', disable);
    return () => {
      map.off('focus', enable);
      map.off('click', enable);
      map.off('blur', disable);
      map.off('mouseout', disable);
    };
  }, [map]);
  return null;
}

function MapStateLayer({ children }: { children: React.ReactNode }) {
  return <div className="cm-map__state">{children}</div>;
}

function normalize(value: string | null | undefined): string {
  return value ? value.toLowerCase() : '';
}

function matchesQuery(node: LocatedMapNode, query: string): boolean {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (normalize(node.name).includes(needle)) return true;
  if (normalize(node.publicKey).includes(needle)) return true;
  if (normalize(node.id).includes(needle)) return true;
  return false;
}

function shortNodeLabel(node: MapNode): string {
  const raw = node.name?.trim();
  if (raw) return raw.length > 18 ? `${raw.slice(0, 17)}…` : raw;
  const key = node.publicKey || node.id;
  if (!key) return 'Node';
  return key.length > 8 ? `${key.slice(0, 8)}…` : key;
}

function buildMarkerAccessibleName(node: MapNode): string {
  const name = node.name?.trim() || node.publicKey || node.id || 'Node';
  const role = node.role ? node.role.replace(/_/g, ' ') : 'node';
  const status = node.status ?? 'unknown';
  return `${name} — ${role}, ${status}`;
}

export function NetworkMap({
  nodes: providedNodes,
  stats: providedStats,
  loading: loadingProp,
  error: errorProp,
  lastUpdated: lastUpdatedProp,
  runtimeConfig: runtimeConfigProp,
  connection: connectionProp,
  source: sourceProp,
  warnings: warningsProp,
  features: featuresProp,
  refreshInterval = DEFAULT_REFRESH_INTERVAL,
  className = '',
  height = 560,
}: NetworkMapProps) {
  const externallyControlled = providedNodes !== undefined;
  const snapshot = useMapSnapshot({
    enabled: !externallyControlled,
    refreshInterval,
  });

  const nodes = useMemo(
    () => (externallyControlled ? providedNodes ?? [] : snapshot.nodes),
    [externallyControlled, providedNodes, snapshot.nodes]
  );
  const stats = externallyControlled ? providedStats ?? null : snapshot.stats;
  const runtimeConfig = runtimeConfigProp ?? snapshot.runtimeConfig;
  const connection = connectionProp ?? snapshot.connection;
  const source = sourceProp ?? snapshot.source;
  const warnings = warningsProp ?? snapshot.warnings;
  const features = featuresProp ?? snapshot.features;
  const loading = loadingProp ?? snapshot.loading;
  const error = errorProp ?? snapshot.error;
  const lastUpdated = lastUpdatedProp ?? snapshot.lastUpdated;

  const { preferences, hydrated, update, reset } = useMapPreferences();

  const peerHistoryAvailable = useMemo(
    () =>
      features.some(
        (feature) => feature.id === 'advanced-live-map-proxy' && feature.status === 'available'
      ),
    [features]
  );

  // Strip the default Leaflet marker icon URL resolver so divIcon styling is consistent.
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  }, []);

  const locatedNodes = useMemo<LocatedMapNode[]>(
    () => nodes.filter(hasCoordinates),
    [nodes]
  );

  const [query, setQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<Set<MapNodeRole>>(() => new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<MapNodeStatus>>(
    () => new Set()
  );
  const [focusedNode, setFocusedNode] = useState<MapNode | null>(null);

  const toggleRole = useCallback((role: MapNodeRole) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }, []);

  const toggleStatus = useCallback((status: MapNodeStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedRoles(new Set());
    setSelectedStatuses(new Set());
  }, []);

  const availableRoles = useMemo<MapNodeRole[]>(() => {
    const set = new Set<MapNodeRole>();
    for (const node of locatedNodes) set.add(node.role);
    return Array.from(set);
  }, [locatedNodes]);

  const availableStatuses = useMemo<MapNodeStatus[]>(() => {
    const set = new Set<MapNodeStatus>();
    for (const node of locatedNodes) set.add(node.status);
    return Array.from(set);
  }, [locatedNodes]);

  const effectiveSelectedRoles = useMemo<Set<MapNodeRole>>(() => {
    if (selectedRoles.size === 0) return selectedRoles;
    const next = new Set<MapNodeRole>();
    for (const role of selectedRoles) {
      if (availableRoles.includes(role)) next.add(role);
    }
    return next;
  }, [selectedRoles, availableRoles]);

  const effectiveSelectedStatuses = useMemo<Set<MapNodeStatus>>(() => {
    if (selectedStatuses.size === 0) return selectedStatuses;
    const next = new Set<MapNodeStatus>();
    for (const status of selectedStatuses) {
      if (availableStatuses.includes(status)) next.add(status);
    }
    return next;
  }, [selectedStatuses, availableStatuses]);

  const filtersActive =
    query.trim().length > 0 ||
    effectiveSelectedRoles.size > 0 ||
    effectiveSelectedStatuses.size > 0;

  const markerNodes = useMemo<LocatedMapNode[]>(() => {
    return locatedNodes.filter((node) => {
      if (!matchesQuery(node, query)) return false;
      if (effectiveSelectedRoles.size > 0 && !effectiveSelectedRoles.has(node.role)) {
        return false;
      }
      if (
        effectiveSelectedStatuses.size > 0 &&
        !effectiveSelectedStatuses.has(node.status)
      ) {
        return false;
      }
      return true;
    });
  }, [locatedNodes, query, effectiveSelectedRoles, effectiveSelectedStatuses]);

  const bounds = useMemo<LatLngBounds | null>(() => {
    if (markerNodes.length === 0) return null;
    if (markerNodes.length === 1) {
      const { latitude, longitude } = markerNodes[0].coordinates;
      return L.latLng(latitude, longitude).toBounds(20000); // ~20km
    }
    return L.latLngBounds(
      markerNodes.map(
        (node): LatLngTuple => [node.coordinates.latitude, node.coordinates.longitude]
      )
    );
  }, [markerNodes]);

  const activeRoles = useMemo(() => {
    const set = new Set<MapNodeRole>();
    for (const node of markerNodes) set.add(node.role);
    return set;
  }, [markerNodes]);

  const buildIcon = useCallback(
    (node: MapNode, cache: Map<string, L.DivIcon>): L.DivIcon => {
      const sizing = MARKER_SIZING[preferences.markerSize];
      if (preferences.showLabels) {
        return L.divIcon({
          className: 'cm-marker-icon cm-marker-icon--with-label',
          html: buildMarkerHtml(node.role, node.status, {
            size: preferences.markerSize,
            label: shortNodeLabel(node),
          }),
          iconSize: [sizing.container, sizing.container],
          iconAnchor: sizing.iconAnchor,
          popupAnchor: sizing.popupAnchor,
        });
      }
      const key = `${node.role}:${node.status}:${preferences.markerSize}`;
      const cached = cache.get(key);
      if (cached) return cached;
      const icon = L.divIcon({
        className: 'cm-marker-icon',
        html: buildMarkerHtml(node.role, node.status, { size: preferences.markerSize }),
        iconSize: [sizing.container, sizing.container],
        iconAnchor: sizing.iconAnchor,
        popupAnchor: sizing.popupAnchor,
      });
      cache.set(key, icon);
      return icon;
    },
    [preferences.markerSize, preferences.showLabels]
  );

  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return {
      get(node: MapNode): L.DivIcon {
        return buildIcon(node, cache);
      },
    };
  }, [buildIcon]);

  const containerStyle = { height: typeof height === 'number' ? `${height}px` : height };
  const containerClass = `cm-map ${className}`.trim();
  const showControls = !loading && !error && locatedNodes.length > 0;
  const showAdvancedPanels = preferences.showAdvancedPanels;
  const generatedAt = lastUpdated ?? null;

  const handleFocusNode = useCallback((node: MapNode) => {
    setFocusedNode(node);
    if (typeof document !== 'undefined') {
      const target = document.getElementById('cm-operator-panels');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const clearFocus = useCallback(() => setFocusedNode(null), []);

  const diagnostics = (
    <MapDiagnosticsPanel
      source={source ?? null}
      connection={connection ?? null}
      runtimeConfig={runtimeConfig ?? null}
      warnings={warnings ?? []}
      features={features ?? []}
      generatedAt={generatedAt}
    />
  );

  const preferencesPanel = (
    <MapPreferencesPanel
      preferences={preferences}
      onUpdate={update}
      onReset={reset}
      hydrated={hydrated}
    />
  );

  const operatorPanels = showAdvancedPanels ? (
    <section
      id="cm-operator-panels"
      className="cm-operator-panels"
      aria-label="Live map operator panels"
      data-testid="map-operator-panels"
    >
      <LiveMapStatsPanel features={features ?? []} enabled />
      <CoveragePanel features={features ?? []} />
      <LosPanel
        features={features ?? []}
        defaultCenter={runtimeConfig?.defaultCenter ?? null}
        nodes={markerNodes}
        selectedNode={focusedNode}
      />
      <WeatherRadarPanel
        features={features ?? []}
        defaultCenter={runtimeConfig?.defaultCenter ?? null}
        selectedNode={focusedNode}
      />
      <PeerHistoryPanel
        features={features ?? []}
        selectedNode={focusedNode}
        nodes={markerNodes}
        onClear={focusedNode ? clearFocus : undefined}
      />
    </section>
  ) : null;

  if (loading) {
    return (
      <div className="cm-map-shell">
        {diagnostics}
        {preferencesPanel}
        <div className={containerClass} style={containerStyle}>
          <MapStateLayer>
            <div className="cm-map__state-inner">
              <span className="status-dot status-dot-pulse" aria-hidden />
              <span className="mono text-xs uppercase tracking-[0.18em] text-foreground-dim">
                Initializing map…
              </span>
            </div>
          </MapStateLayer>
        </div>
        {operatorPanels}
      </div>
    );
  }

  if (error) {
    return (
      <div className="cm-map-shell">
        {diagnostics}
        <div className={containerClass} style={containerStyle}>
          <MapStateLayer>
            <div className="cm-map__state-inner">
              <span className="status-dot status-dot-red" aria-hidden />
              <div>
                <div className="text-foreground font-medium">Could not load map data</div>
                <div className="text-sm text-foreground-muted mt-1">{error}</div>
              </div>
            </div>
          </MapStateLayer>
        </div>
        {operatorPanels}
      </div>
    );
  }

  if (locatedNodes.length === 0) {
    return (
      <div className="cm-map-shell">
        {diagnostics}
        {preferencesPanel}
        <div className={containerClass} style={containerStyle}>
          <MapStateLayer>
            <div className="cm-map__state-inner cm-map__state-inner--empty">
              <span className="status-dot status-dot-amber" aria-hidden />
              <div>
                <div className="text-foreground font-medium">No located nodes yet</div>
                <div className="text-sm text-foreground-muted mt-1 max-w-sm">
                  Once Colorado MeshCore receives node positions, they will appear here. Diagnostics
                  above explain whether the source is sample, configured, or live.
                </div>
              </div>
            </div>
          </MapStateLayer>
          {preferences.showStatsOverlay && (
            <MapStatsOverlay stats={stats} visibleMarkers={0} lastUpdated={lastUpdated} />
          )}
        </div>
        {operatorPanels}
      </div>
    );
  }

  const fallbackCenter: LatLngTuple = runtimeConfig
    ? [runtimeConfig.defaultCenter.latitude, runtimeConfig.defaultCenter.longitude]
    : COLORADO_CENTER;
  const center: LatLngTuple = bounds
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : fallbackCenter;
  const zoom = runtimeConfig?.defaultZoom ?? COLORADO_ZOOM;
  const tileUrl = runtimeConfig?.tileUrl ?? TILE_URL;
  const tileAttribution = runtimeConfig?.tileAttribution ?? TILE_ATTRIBUTION;

  return (
    <div className="cm-map-shell">
      {diagnostics}
      {preferencesPanel}
      {showControls && (
        <MapControls
          query={query}
          onQueryChange={setQuery}
          availableRoles={availableRoles}
          selectedRoles={effectiveSelectedRoles}
          onToggleRole={toggleRole}
          availableStatuses={availableStatuses}
          selectedStatuses={effectiveSelectedStatuses}
          onToggleStatus={toggleStatus}
          onClear={clearFilters}
          matchCount={markerNodes.length}
          totalCount={locatedNodes.length}
          filtersActive={filtersActive}
        />
      )}

      <div className={containerClass} style={containerStyle}>
        {markerNodes.length === 0 ? (
          <>
            <MapStateLayer>
              <div className="cm-map__state-inner cm-map__state-inner--empty">
                <span className="status-dot status-dot-amber" aria-hidden />
                <div>
                  <div className="text-foreground font-medium">No nodes match the current filter</div>
                  <div className="text-sm text-foreground-muted mt-1 max-w-sm">
                    {locatedNodes.length === 1
                      ? '1 located node is hidden by the active filter.'
                      : `${locatedNodes.length} located nodes are hidden by the active filter.`}{' '}
                    Adjust the search or role chips above, or clear the filter to plot every node.
                  </div>
                </div>
              </div>
            </MapStateLayer>
            {preferences.showStatsOverlay && (
              <MapStatsOverlay stats={stats} visibleMarkers={0} lastUpdated={lastUpdated} />
            )}
            {preferences.showLegend && <MapLegend activeRoles={new Set(availableRoles)} />}
          </>
        ) : (
          <>
            <MapContainer
              center={center}
              zoom={markerNodes.length === 1 ? 11 : zoom}
              scrollWheelZoom={false}
              className="cm-map__leaflet"
              style={{ background: 'var(--night-sky-950)' }}
            >
              <TileLayer attribution={tileAttribution} url={tileUrl} />
              <FitBounds bounds={bounds} />
              <ScrollWheelZoomGate />

              {markerNodes.map((node) => {
                const accessibleName = buildMarkerAccessibleName(node);
                return (
                <Marker
                  key={node.publicKey || node.id}
                  position={[node.coordinates.latitude, node.coordinates.longitude]}
                  icon={iconCache.get(node)}
                  title={accessibleName}
                  alt={accessibleName}
                >
                  <Popup className="cm-popup-wrapper">
                    <NodePopup
                      node={node}
                      onFocus={handleFocusNode}
                      isFocused={
                        focusedNode?.publicKey === node.publicKey ||
                        focusedNode?.id === node.id
                      }
                      peerHistoryAvailable={peerHistoryAvailable}
                    />
                  </Popup>
                </Marker>
                );
              })}
            </MapContainer>

            {preferences.showStatsOverlay && (
              <MapStatsOverlay
                stats={stats}
                visibleMarkers={markerNodes.length}
                lastUpdated={lastUpdated}
              />
            )}
            {preferences.showLegend && <MapLegend activeRoles={activeRoles} />}
          </>
        )}
      </div>

      {operatorPanels}
    </div>
  );
}

export default NetworkMap;
