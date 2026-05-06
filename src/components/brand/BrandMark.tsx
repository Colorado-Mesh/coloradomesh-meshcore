import Image from 'next/image';
import Link from 'next/link';
import { SITE_LOGO_PATH, SITE_NAME } from '@/lib/constants';

type BrandMarkSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: BrandMarkSize;
  href?: string | null;
  showWordmark?: boolean;
  showCallsign?: boolean;
  callsign?: string;
  tone?: 'default' | 'inverse';
  className?: string;
  ariaLabel?: string;
}

const SIZE_MAP: Record<BrandMarkSize, { mark: number; primary: string; secondary: string; gap: string }> = {
  sm: { mark: 28, primary: 'text-sm', secondary: 'text-[9px]', gap: 'gap-2' },
  md: { mark: 36, primary: 'text-base', secondary: 'text-[10px]', gap: 'gap-2.5' },
  lg: { mark: 44, primary: 'text-lg', secondary: 'text-[11px]', gap: 'gap-3' },
};

export default function BrandMark({
  size = 'md',
  href = '/',
  showWordmark = true,
  showCallsign = true,
  callsign = 'FRONT_RANGE / LoRa.915',
  tone = 'default',
  className = '',
  ariaLabel,
}: BrandMarkProps) {
  const sizing = SIZE_MAP[size];
  const primaryColor = tone === 'inverse' ? 'text-snow-100' : 'text-foreground';
  const wordmarkParts = SITE_NAME.split(' ');
  const accentWord = wordmarkParts.pop();
  const leadingWords = wordmarkParts.join(' ');

  const inner = (
    <span className={`inline-flex items-center ${sizing.gap}`}>
      <Image
        src={SITE_LOGO_PATH}
        alt={`${SITE_NAME} logo`}
        width={sizing.mark}
        height={sizing.mark}
        className="rounded-full ring-1 ring-mesh/30 transition-transform duration-300 group-hover:scale-105"
        unoptimized
      />
      {showWordmark && (
        <span className="flex flex-col leading-tight">
          <span className={`${sizing.primary} font-semibold tracking-tight ${primaryColor}`}>
            {leadingWords}{leadingWords && accentWord ? ' ' : ''}
            {accentWord && <span className="text-mesh">{accentWord}</span>}
          </span>
          {showCallsign && (
            <span
              className={`mt-0.5 font-mono ${sizing.secondary} uppercase text-foreground-dim`}
              style={{ letterSpacing: '0.18em' }}
            >
              {callsign}
            </span>
          )}
        </span>
      )}
    </span>
  );

  const label = ariaLabel ?? `${SITE_NAME} — Home`;

  if (!href) {
    return (
      <span className={`inline-flex items-center ${className}`} aria-label={label}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`group inline-flex items-center rounded-md focus-ring ${className}`}
      aria-label={label}
    >
      {inner}
    </Link>
  );
}
