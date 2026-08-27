/**
 * Site-wide SEO config for Ahona
 */

export const siteConfig = {
  name: "Ahona",
  legalName: "Ahona Health",
  tagline: "Trusted Medicine, Beauty & Healthcare",
  description:
    "Buy genuine medicines, book home lab tests, and consult verified doctors online in Bangladesh. Express delivery, COD, licensed pharmacy.",
  descriptionBn:
    "বাংলাদেশে অরিজিনাল মেডিসিন কিনুন, হোম ল্যাব টেস্ট বুক করুন এবং যাচাইকৃত ডাক্তারের সাথে অনলাইন পরামর্শ নিন। এক্সপ্রেস ডেলিভারি, COD, লাইসেন্সপ্রাপ্ত ফার্মেসি।",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://ahona.store",
  locale: "en_BD",
  localeBn: "bn_BD",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@ahona",
  phone: "+8809610016778",
  phoneDisplay: "16778",
  email: "support@ahona.store",
  address: {
    street: "Dhaka",
    locality: "Dhaka",
    region: "Dhaka",
    country: "BD",
  },
  keywords: [
    "online pharmacy Bangladesh",
    "buy medicine online Dhaka",
    "lab test at home",
    "doctor consultation online",
    "Ahona",
    "express medicine delivery",
    "COD pharmacy",
    "skincare Bangladesh",
    "supplements online",
    "video doctor consult",
    "বাংলাদেশ অনলাইন ফার্মেসি",
    "মেডিসিন অনলাইন",
    "ল্যাব টেস্ট বাসায়",
    "ডাক্তার পরামর্শ",
  ],
  ogImage: "/og-image.png",
  logo: "/brand/logo-mark.png",
  logoFull: "/brand/logo.png",
} as const;

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${p}`;
}

export function defaultOpenGraph(overrides?: {
  title?: string;
  description?: string;
  url?: string;
  images?: string[];
}) {
  const title = overrides?.title || `${siteConfig.name} – ${siteConfig.tagline}`;
  const description = overrides?.description || siteConfig.description;
  const url = overrides?.url || siteConfig.url;
  const images = (overrides?.images || [siteConfig.ogImage]).map((src) => ({
    url: absoluteUrl(src),
    width: 1200,
    height: 630,
    alt: title,
  }));

  return {
    type: "website" as const,
    locale: siteConfig.locale,
    alternateLocale: [siteConfig.localeBn],
    url,
    siteName: siteConfig.name,
    title,
    description,
    images,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "Pharmacy"],
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: absoluteUrl(siteConfig.logo),
    image: absoluteUrl(siteConfig.ogImage),
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      addressCountry: siteConfig.address.country,
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    sameAs: [] as string[],
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: ["en", "bn"],
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(siteConfig.logo),
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
