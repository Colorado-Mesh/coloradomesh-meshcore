interface TopoBackgroundProps {
  variant?: 'topo' | 'grid' | 'topo-grid' | 'mesh' | 'stars';
  showMountains?: boolean;
  intensity?: 'subtle' | 'normal' | 'bold';
  className?: string;
  children?: React.ReactNode;
}

const VARIANT_CLASS: Record<NonNullable<TopoBackgroundProps['variant']>, string> = {
  topo: 'bg-topo',
  grid: 'bg-grid',
  'topo-grid': 'bg-topo-grid',
  mesh: 'bg-mesh',
  stars: 'bg-night-stars',
};

const INTENSITY_OPACITY: Record<NonNullable<TopoBackgroundProps['intensity']>, string> = {
  subtle: 'opacity-30',
  normal: 'opacity-60',
  bold: 'opacity-90',
};

export default function TopoBackground({
  variant = 'topo',
  showMountains = false,
  intensity = 'normal',
  className = '',
  children,
}: TopoBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className={`absolute inset-0 ${VARIANT_CLASS[variant]} ${INTENSITY_OPACITY[intensity]} pointer-events-none`}
      />
      {showMountains && (
        <svg
          aria-hidden
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-40 sm:h-56 pointer-events-none"
        >
          <path
            fill="var(--night-sky-700)"
            d="M0,256L48,240C96,224,192,192,288,186.7C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L0,320Z"
          />
          <path
            fill="var(--night-sky-800)"
            opacity="0.85"
            d="M0,288L60,277.3C120,267,240,245,360,234.7C480,224,600,224,720,229.3C840,235,960,245,1080,250.7C1200,256,1320,256,1380,256L1440,256L1440,320L0,320Z"
          />
        </svg>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
