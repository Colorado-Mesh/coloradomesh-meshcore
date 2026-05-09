import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import NamingWizard from "@/components/NamingWizard";
import PrefixMatrix from "@/components/PrefixMatrix";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Node Naming Standard v2.1",
  description: "Colorado MeshCore node naming standard v2.1. Interactive wizard for generating valid repeater and room server names. Companion naming instructions included.",
  keywords: ["MeshCore", "naming standard", "node name", "Colorado", "Denver", "Front Range", "mesh network", "repeater", "room server", "naming wizard"],
  alternates: {
    canonical: '/guides/naming-standard',
  },
  openGraph: {
    title: "Node Naming Standard v2.1 | Colorado MeshCore",
    description: "Interactive wizard for naming your Colorado MeshCore nodes following the v2.1 standard.",
    url: `${BASE_URL}/guides/naming-standard`,
  },
};

const breadcrumbData = generateBreadcrumbSchema([
  { name: 'Home', url: BASE_URL },
  { name: 'Guides', url: `${BASE_URL}/guides` },
  { name: 'Naming Standard', url: `${BASE_URL}/guides/naming-standard` },
]);

export default function NamingStandardPage() {
  return (
    <>
      <JsonLd data={breadcrumbData} />
      <div className="min-h-screen bg-mesh">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24 text-center">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Guides', href: '/guides' }, { label: 'Naming Standard' }]} />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              Node Name Generator <span className="text-base font-normal text-foreground-muted">v2.1</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted mb-8 max-w-2xl mx-auto">
              Build a valid name for your <span className="text-mesh font-semibold">repeater or room server</span> following our naming standard. All names are limited to 23 characters. Companion naming instructions are included below.
            </p>
          </div>
        </section>

        {/* Naming Wizard */}
        <section className="px-6 pb-16 md:pb-24">
          <div className="max-w-4xl mx-auto">
            <NamingWizard />
          </div>
        </section>

        {/* Prefix Matrix */}
        <section id="prefix-matrix" className="px-6 pb-16 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <PrefixMatrix />
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="card-mesh p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2 tracking-tight">
                Use the standalone naming tools
              </h2>
              <p className="text-foreground-muted text-sm mb-6 max-w-2xl">
                This page is the standard. When you just need to generate a name or check a prefix, jump straight to the operator tools — same logic, focused workflow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/tools/repeater-name" className="panel p-5 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Repeater name wizard</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Region, city, landmark, and node type with live conflict checks.</p>
                </Link>
                <Link href="/tools/companion-name" className="panel p-5 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Naming Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Companion name builder</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Emoji, handle, and identification suffix inside the 23-char limit.</p>
                </Link>
                <Link href="/tools/prefix-matrix" className="panel p-5 group hover:-translate-y-0.5 transition-all focus-ring">
                  <div className="text-xs mono uppercase tracking-[0.18em] text-foreground-dim mb-2">Planning Tool</div>
                  <h3 className="font-semibold text-foreground group-hover:text-mesh transition-colors">Public-key prefix matrix</h3>
                  <p className="mt-1 text-sm text-foreground-muted">Pick a free first-byte prefix before generating a new key pair.</p>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
