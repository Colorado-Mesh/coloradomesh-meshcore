type MetricTone = 'mesh' | 'sky' | 'sunset' | 'forest' | 'neutral';

export interface MetricItem {
  label: string;
  value: string;
  tone?: MetricTone;
  hint?: string;
}

interface MetricStripProps {
  metrics: MetricItem[];
  liveLabel?: string;
  showLiveDot?: boolean;
  variant?: 'panel' | 'bare';
  className?: string;
}

const TONE_CLASS: Record<MetricTone, string> = {
  mesh: 'text-mesh',
  sky: 'text-sky-signal',
  sunset: 'text-sunset-500',
  forest: 'text-forest-300',
  neutral: 'text-foreground',
};

export default function MetricStrip({
  metrics,
  liveLabel = 'LIVE',
  showLiveDot = true,
  variant = 'panel',
  className = '',
}: MetricStripProps) {
  const wrapperClass =
    variant === 'panel'
      ? 'panel px-5 sm:px-7 py-5 backdrop-blur-md bg-card/85'
      : '';

  return (
    <div
      className={`${wrapperClass} flex flex-wrap items-center gap-x-8 gap-y-5 ${className}`}
      role="group"
      aria-label="Network metrics"
    >
      {showLiveDot && (
        <div className="flex items-center gap-2 pr-6 border-r border-card-border">
          <span className="status-dot status-dot-pulse" aria-hidden />
          <span className="metric-label">{liveLabel}</span>
        </div>
      )}
      {metrics.map((m) => (
        <div key={m.label} className="min-w-[5rem]">
          <div className={`metric-value ${TONE_CLASS[m.tone ?? 'neutral']}`}>{m.value}</div>
          <div className="metric-label mt-1.5">{m.label}</div>
          {m.hint && <div className="text-xs text-foreground-dim mt-1">{m.hint}</div>}
        </div>
      ))}
    </div>
  );
}
