import SectionEyebrow from './SectionEyebrow';

type NetworkPanelStatus = 'online' | 'stale' | 'offline' | 'idle';
type NetworkPanelTone = 'default' | 'mesh' | 'elevated';
type NetworkPanelHeadingLevel = 'h2' | 'h3' | 'h4';

interface NetworkPanelProps {
  eyebrow?: React.ReactNode;
  eyebrowTone?: 'mesh' | 'sunset' | 'sky';
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  status?: NetworkPanelStatus;
  statusLabel?: string;
  actions?: React.ReactNode;
  tone?: NetworkPanelTone;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
  headingLevel?: NetworkPanelHeadingLevel;
}

const TONE_CLASS: Record<NetworkPanelTone, string> = {
  default: 'panel',
  mesh: 'panel-mesh',
  elevated: 'panel-elevated',
};

const PADDING_CLASS: Record<NonNullable<NetworkPanelProps['padding']>, string> = {
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-7',
  lg: 'p-7 sm:p-9',
};

const STATUS_CLASS: Record<NetworkPanelStatus, { dot: string; text: string }> = {
  online: { dot: 'status-dot status-dot-pulse', text: 'text-mesh' },
  stale: { dot: 'status-dot status-dot-amber', text: 'text-amber-signal' },
  offline: { dot: 'status-dot status-dot-red', text: 'text-red-signal' },
  idle: { dot: 'status-dot opacity-40', text: 'text-foreground-dim' },
};

export default function NetworkPanel({
  eyebrow,
  eyebrowTone = 'mesh',
  title,
  subtitle,
  status,
  statusLabel,
  actions,
  tone = 'default',
  padding = 'md',
  className = '',
  children,
  headingLevel = 'h2',
}: NetworkPanelProps) {
  const hasHeader = eyebrow || title || subtitle || status || actions;
  const Heading = headingLevel;

  return (
    <section className={`${TONE_CLASS[tone]} ${PADDING_CLASS[padding]} ${className}`}>
      {hasHeader && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <SectionEyebrow tone={eyebrowTone} className="mb-2">
                {eyebrow}
              </SectionEyebrow>
            )}
            {title && (
              <Heading className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
                {title}
              </Heading>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-foreground-muted">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {status && (
              <span className="inline-flex items-center gap-2">
                <span className={STATUS_CLASS[status].dot} aria-hidden />
                <span
                  className={`mono text-xs uppercase ${STATUS_CLASS[status].text}`}
                >
                  {statusLabel ?? status}
                </span>
              </span>
            )}
            {actions}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}
