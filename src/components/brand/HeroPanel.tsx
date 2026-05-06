import SectionEyebrow from './SectionEyebrow';
import TopoBackground from './TopoBackground';

interface HeroPanelProps {
  eyebrow?: React.ReactNode;
  eyebrowTone?: 'mesh' | 'sunset' | 'sky';
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  background?: 'topo' | 'mesh' | 'topo-grid' | 'stars' | 'none';
  showMountains?: boolean;
  align?: 'start' | 'center';
  className?: string;
  children?: React.ReactNode;
}

export default function HeroPanel({
  eyebrow,
  eyebrowTone = 'mesh',
  title,
  description,
  actions,
  meta,
  background = 'topo',
  showMountains = true,
  align = 'start',
  className = '',
  children,
}: HeroPanelProps) {
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  const inner = (
    <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32 flex flex-col ${alignClass}`}>
      {eyebrow && (
        <SectionEyebrow tone={eyebrowTone} className="mb-6">
          {eyebrow}
        </SectionEyebrow>
      )}
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold leading-[1.02] tracking-tight text-foreground max-w-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-6 text-lg sm:text-xl text-foreground-muted max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
      {actions && (
        <div className={`mt-10 flex flex-wrap gap-3 ${align === 'center' ? 'justify-center' : ''}`}>
          {actions}
        </div>
      )}
      {meta && <div className="mt-12 w-full">{meta}</div>}
      {children}
    </div>
  );

  if (background === 'none') {
    return <section className={`relative ${className}`}>{inner}</section>;
  }

  const variant = background === 'mesh' ? 'mesh' : background === 'stars' ? 'stars' : background === 'topo-grid' ? 'topo-grid' : 'topo';

  return (
    <TopoBackground variant={variant} showMountains={showMountains} className={className}>
      {inner}
    </TopoBackground>
  );
}
