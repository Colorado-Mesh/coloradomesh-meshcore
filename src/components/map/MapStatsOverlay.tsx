import type { MapStats } from '@/lib/types';
import { formatRelativeTime } from './format';

interface MapStatsOverlayProps {
  stats: MapStats | null;
  visibleMarkers: number;
  lastUpdated: Date | null;
}

const SOURCE_TONE: Record<string, { label: string; tone: string }> = {
  sample: { label: 'Sample data', tone: 'cm-overlay__tag--sunset' },
  empty: { label: 'No live data', tone: 'cm-overlay__tag--dim' },
  mqtt: { label: 'Live MQTT', tone: 'cm-overlay__tag--mesh' },
  live_map_api: { label: 'Live map API', tone: 'cm-overlay__tag--mesh' },
};

export default function MapStatsOverlay({ stats, visibleMarkers, lastUpdated }: MapStatsOverlayProps) {
  const sourceType = stats?.source.type ?? 'empty';
  const sourceMeta = SOURCE_TONE[sourceType] ?? SOURCE_TONE.empty;
  const freshnessIso = stats?.lastUpdated ?? lastUpdated?.toISOString() ?? null;
  const freshness = freshnessIso ? formatRelativeTime(freshnessIso) : 'Unknown';
  const located = stats?.locatedNodes ?? visibleMarkers;
  const visible = stats?.visibleNodes ?? visibleMarkers;
  const total = stats?.totalNodes ?? visibleMarkers;
  const online = stats?.onlineNodes ?? null;

  return (
    <div className="cm-overlay cm-overlay--stats">
      <div className="cm-overlay__head">
        <span className={`cm-overlay__tag ${sourceMeta.tone}`}>{sourceMeta.label}</span>
        <span className="cm-overlay__freshness" title={freshnessIso ?? undefined}>
          {freshness}
        </span>
      </div>
      <div className="cm-overlay__stats">
        <div className="cm-overlay__stat">
          <div className="cm-overlay__value">{visibleMarkers}</div>
          <div className="cm-overlay__label">Plotted</div>
        </div>
        <div className="cm-overlay__stat">
          <div className="cm-overlay__value">{located}</div>
          <div className="cm-overlay__label">Located</div>
        </div>
        <div className="cm-overlay__stat">
          <div className="cm-overlay__value">{visible}</div>
          <div className="cm-overlay__label">Visible</div>
        </div>
        {online !== null && (
          <div className="cm-overlay__stat">
            <div className="cm-overlay__value cm-overlay__value--mesh">{online}</div>
            <div className="cm-overlay__label">Online</div>
          </div>
        )}
        <div className="cm-overlay__stat">
          <div className="cm-overlay__value">{total}</div>
          <div className="cm-overlay__label">Total</div>
        </div>
      </div>
    </div>
  );
}
