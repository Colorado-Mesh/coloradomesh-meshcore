import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import NamingWizard from "@/components/NamingWizard";
import PrefixMatrix from "@/components/PrefixMatrix";
import { generateBreadcrumbSchema } from "@/lib/schemas/breadcrumb";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Node Naming Standard v2.1 | Denver MeshCore",
  description: "Denver MeshCore node naming standard v2.1. Interactive wizard for generating valid repeater and room server names. Companion naming instructions included.",
  keywords: ["MeshCore", "naming standard", "node name", "Denver", "mesh network", "repeater", "room server", "naming wizard"],
  alternates: {
    canonical: '/guides/naming-standard',
  },
  openGraph: {
    title: "Node Naming Standard v2.1 | Denver MeshCore",
    description: "Interactive wizard for naming your Denver MeshCore nodes following the v2.1 standard.",
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
      </div>
    </>
  );
}
