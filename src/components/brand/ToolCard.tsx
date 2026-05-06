import Link from 'next/link';

type ToolCardTone = 'mesh' | 'sky' | 'sunset' | 'forest';

interface ToolCardProps {
  glyph?: string;
  tag?: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  tone?: ToolCardTone;
  active?: boolean;
  className?: string;
}

const TONE: Record<
  ToolCardTone,
  { text: string; bgSubtle: string; ring: string; accent: string }
> = {
  mesh: {
    text: 'text-mesh',
    bgSubtle: 'bg-mesh/[0.06]',
    ring: 'ring-mesh/40',
    accent: 'group-hover:border-mesh/60',
  },
  sky: {
    text: 'text-sky-signal',
    bgSubtle: 'bg-sky-signal/[0.06]',
    ring: 'ring-sky-signal/40',
    accent: 'group-hover:border-sky-signal/60',
  },
  sunset: {
    text: 'text-sunset-500',
    bgSubtle: 'bg-sunset-500/[0.06]',
    ring: 'ring-sunset-500/40',
    accent: 'group-hover:border-sunset-500/60',
  },
  forest: {
    text: 'text-forest-300',
    bgSubtle: 'bg-forest-300/[0.06]',
    ring: 'ring-forest-300/40',
    accent: 'group-hover:border-forest-300/60',
  },
};

export default function ToolCard({
  glyph = '◊',
  tag,
  title,
  description,
  href,
  external = false,
  tone = 'mesh',
  active = false,
  className = '',
}: ToolCardProps) {
  const palette = TONE[tone];
  const baseClasses = `group relative block panel p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-ring ${palette.accent} ${
    active ? `${palette.bgSubtle} ring-1 ${palette.ring}` : ''
  } ${className}`;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          aria-hidden
          className={`text-3xl leading-none ${palette.text}`}
        >
          {glyph}
        </span>
        {tag && (
          <span className={`mono text-[0.65rem] uppercase ${palette.text}`}>
            ◊ {tag}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex items-center justify-between text-xs text-foreground-dim">
        <span className="mono">explore</span>
        <span className={palette.text} aria-hidden>
          →
        </span>
      </div>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={baseClasses}>
      {inner}
    </Link>
  );
}
