type EyebrowTone = 'mesh' | 'sunset' | 'sky';

interface SectionEyebrowProps {
  children: React.ReactNode;
  tone?: EyebrowTone;
  marker?: string;
  as?: 'div' | 'span' | 'p';
  className?: string;
}

const TONE_CLASS: Record<EyebrowTone, string> = {
  mesh: 'eyebrow',
  sunset: 'eyebrow eyebrow-sunset',
  sky: 'eyebrow eyebrow-sky',
};

export default function SectionEyebrow({
  children,
  tone = 'mesh',
  marker,
  as = 'div',
  className = '',
}: SectionEyebrowProps) {
  const Tag = as;
  return (
    <Tag className={`${TONE_CLASS[tone]} ${className}`}>
      {marker && <span aria-hidden>{marker}</span>}
      <span>{children}</span>
    </Tag>
  );
}
