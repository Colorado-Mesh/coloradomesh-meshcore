import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import JsonLd, {
  organizationSchema,
  websiteSchema,
  communityOrganizationSchema,
} from "@/components/JsonLd";
import {
  BASE_URL,
  COMMUNITY_NAME,
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_TITLE,
} from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "mesh network",
    "Colorado",
    "Colorado Mesh",
    "Colorado MeshCore",
    "MeshCore",
    "decentralized",
    "LoRa",
    "off-grid",
    "emergency communication",
    "Front Range",
    "radio network",
  ],
  authors: [{ name: `${COMMUNITY_NAME} Community` }],
  creator: `${COMMUNITY_NAME} Community`,
  publisher: `${COMMUNITY_NAME} Community`,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/brand/win/colorado-mesh.ico", sizes: "any" },
      { url: "/brand/linux/16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/linux/32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/linux/256x256.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SITE_LOGO_PATH,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={communityOrganizationSchema} />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Navigation />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
