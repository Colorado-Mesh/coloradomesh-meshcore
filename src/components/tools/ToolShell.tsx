import type { ReactNode } from 'react';
import Link from 'next/link';

import Breadcrumbs, { type BreadcrumbItem } from '@/components/Breadcrumbs';
import { HeroPanel, SectionEyebrow } from '@/components/brand';

interface ToolShellProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  apiTag?: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  asideEyebrow?: string;
  aside?: ReactNode;
}

export default function ToolShell({
  eyebrow = 'Operator Tools',
  title,
  description,
  apiTag,
  breadcrumbs,
  children,
  asideEyebrow,
  aside,
}: ToolShellProps) {
  return (
    <div className="min-h-screen">
      <HeroPanel
        background="topo-grid"
        showMountains={false}
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Link href="/tools" className="btn-secondary">
              All tools
            </Link>
            <Link href="/map" className="btn-outline">
              Network map
            </Link>
          </>
        }
        meta={
          <div className="panel px-5 sm:px-6 py-4 backdrop-blur-md bg-card/85">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs">
              <Breadcrumbs items={breadcrumbs} />
              {apiTag && (
                <span className="inline-flex items-center gap-2 mono uppercase tracking-[0.18em] text-foreground-dim">
                  <span aria-hidden className="text-mesh">◊</span>
                  <span>{apiTag}</span>
                </span>
              )}
            </div>
          </div>
        }
      />

      <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-24 -mt-10">
        <div
          className={`mx-auto max-w-5xl ${
            aside
              ? 'lg:max-w-7xl lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10'
              : ''
          }`}
        >
          <div className="space-y-8">{children}</div>

          {aside && (
            <div className="mt-10 lg:mt-0">
              <div className="lg:sticky lg:top-24 panel p-5 sm:p-6 space-y-3">
                {asideEyebrow && (
                  <SectionEyebrow tone="sky" className="mb-1">
                    {asideEyebrow}
                  </SectionEyebrow>
                )}
                <div className="text-sm text-foreground-muted leading-relaxed space-y-3">
                  {aside}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
