'use client';

import { useEffect, useState, type ComponentType, type CSSProperties } from 'react';
import CoveragePanel from './map/CoveragePanel';
import type { MapAdvancedFeature, MapNode, MapStats } from '@/lib/types';

interface NetworkMapWrapperProps {
  nodes?: MapNode[];
  stats?: MapStats | null;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: Date | null;
  refreshInterval?: number;
  className?: string;
  height?: number | string;
}

const DEFAULT_HEIGHT = 560;
const LOADING_ADVANCED_FEATURES: MapAdvancedFeature[] = [
  {
    id: 'advanced-live-map-proxy',
    label: 'Advanced live-map operator endpoints',
    status: 'available',
    message: 'Loading live-map operator endpoints.',
  },
];

function resolveHeight(height: number | string | undefined): CSSProperties['height'] {
  if (typeof height === 'number') return `${height}px`;
  if (typeof height === 'string' && height.length > 0) return height;
  return `${DEFAULT_HEIGHT}px`;
}

export function MapLoadingState({
  className = '',
  height,
}: {
  className?: string;
  height?: number | string;
}) {
  return (
    <div className="cm-map-shell">
      <div
        className={`cm-map ${className}`.trim()}
        style={{ height: resolveHeight(height) }}
      >
        <div className="cm-map__state">
          <div className="cm-map__state-inner">
            <span className="status-dot status-dot-pulse" aria-hidden />
            <span className="mono text-xs uppercase tracking-[0.18em] text-foreground-dim">
              Loading mesh map…
            </span>
          </div>
        </div>
      </div>
      <section
        id="cm-operator-panels"
        className="cm-operator-panels"
        aria-label="Live map operator panels"
        data-testid="map-operator-panels"
      >
        <CoveragePanel features={LOADING_ADVANCED_FEATURES} />
      </section>
    </div>
  );
}

let networkMapPromise: Promise<ComponentType<NetworkMapWrapperProps>> | null = null;
function loadNetworkMap(): Promise<ComponentType<NetworkMapWrapperProps>> {
  if (!networkMapPromise) {
    networkMapPromise = import('./NetworkMap').then((mod) => mod.NetworkMap);
  }
  return networkMapPromise;
}

export function NetworkMapWrapper(props: NetworkMapWrapperProps) {
  const [NetworkMap, setNetworkMap] = useState<ComponentType<NetworkMapWrapperProps> | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    loadNetworkMap().then((Component) => {
      if (mounted) setNetworkMap(() => Component);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!NetworkMap) {
    return <MapLoadingState height={props.height} className={props.className} />;
  }

  return <NetworkMap {...props} />;
}

export default NetworkMapWrapper;
