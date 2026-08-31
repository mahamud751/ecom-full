import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ToastHost } from "@/components/ui/Toast";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  defaultOpenGraph,
  organizationJsonLd,
  siteConfig,
  websiteJsonLd,
} from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const notoBn = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "health",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      bn: "/",
      "x-default": "/",
    },
  },
  openGraph: defaultOpenGraph(),
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} – ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? {
          "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
        }
      : undefined,
  },
  other: {
    "geo.region": "BD",
    "geo.placename": "Dhaka",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c2a28" },
    { media: "(prefers-color-scheme: dark)", color: "#0c2a28" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${notoBn.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-[var(--ivory)] font-sans text-sm text-[var(--ink)]"
        suppressHydrationWarning
      >
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <I18nProvider>
          <AuthProvider>
            <Header />
            <main className="page-offset flex-1 pb-16 lg:pb-0 [&:has([data-admin-root])]:p-0 [&:has([data-admin-root])]:pb-0">
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <MobileBottomNav />
            <ToastHost />
            <AnalyticsScripts />
            <PwaRegister />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
