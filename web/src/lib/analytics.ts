/**
 * Production analytics helpers.
 *
 * Env (public):
 *   NEXT_PUBLIC_GA_ID=G-XXXXXXXX
 *   NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
 *   NEXT_PUBLIC_META_PIXEL_ID=123456
 *   NEXT_PUBLIC_SENTRY_DSN=https://...
 *   NEXT_PUBLIC_SITE_URL=https://ahona.store
 */

type EventParams = Record<
  string,
  string | number | boolean | undefined | null
>;

function clean(params?: EventParams) {
  if (!params) return {};
  const out: Record<string, string | number | boolean> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) out[k] = v;
  });
  return out;
}

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(payload);
}

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  const data = clean(params);

  try {
    // GTM dataLayer
    pushDataLayer({ event: name, ...data });

    // GA4 gtag
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", name, data);
    }

    // Meta Pixel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      // Prefer standard events when matched
      const standard = [
        "PageView",
        "ViewContent",
        "AddToCart",
        "InitiateCheckout",
        "Purchase",
        "Search",
        "Lead",
        "CompleteRegistration",
      ];
      if (standard.includes(name)) {
        fbq("track", name, data);
      } else {
        fbq("trackCustom", name, data);
      }
    }

    // Session debug trail (dev / QA)
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1") {
      const key = "htp_analytics_events";
      const prev = JSON.parse(sessionStorage.getItem(key) || "[]");
      prev.unshift({ name, params: data, at: new Date().toISOString() });
      sessionStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
    }
  } catch {
    /* ignore */
  }
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") return;
  const page_path = path || window.location.pathname;
  const page_title = title || document.title;
  const page_location = window.location.href;

  pushDataLayer({
    event: "page_view",
    page_path,
    page_title,
    page_location,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag;
  if (typeof gtag === "function") {
    gtag("event", "page_view", {
      page_path,
      page_title,
      page_location,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fbq = (window as any).fbq;
  if (typeof fbq === "function") {
    fbq("track", "PageView");
  }

  trackEvent("virtual_page_view", { page_path, page_title });
}

/** Ecommerce / conversion helpers */
export const analytics = {
  viewItem(item: {
    id: string;
    name: string;
    price?: number;
    category?: string;
  }) {
    trackEvent("view_item", {
      item_id: item.id,
      item_name: item.name,
      value: item.price,
      currency: "BDT",
      item_category: item.category,
    });
    trackEvent("ViewContent", {
      content_ids: item.id,
      content_name: item.name,
      content_type: "product",
      value: item.price,
      currency: "BDT",
    });
  },

  addToCart(item: {
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }) {
    trackEvent("add_to_cart", {
      item_id: item.id,
      item_name: item.name,
      value: item.price * (item.quantity || 1),
      currency: "BDT",
      quantity: item.quantity || 1,
    });
    trackEvent("AddToCart", {
      content_ids: item.id,
      content_name: item.name,
      content_type: "product",
      value: item.price * (item.quantity || 1),
      currency: "BDT",
    });
  },

  beginCheckout(value: number, itemsCount: number) {
    trackEvent("begin_checkout", {
      value,
      currency: "BDT",
      items: itemsCount,
    });
    trackEvent("InitiateCheckout", {
      value,
      currency: "BDT",
      num_items: itemsCount,
    });
  },

  purchase(order: {
    orderId: string;
    value: number;
    itemsCount?: number;
  }) {
    trackEvent("purchase", {
      transaction_id: order.orderId,
      value: order.value,
      currency: "BDT",
      items: order.itemsCount,
    });
    trackEvent("Purchase", {
      value: order.value,
      currency: "BDT",
      content_type: "product",
    });
  },

  search(query: string, results?: number) {
    trackEvent("search", { search_term: query, results });
    trackEvent("Search", { search_string: query });
  },

  lead(source?: string) {
    trackEvent("generate_lead", { source });
    trackEvent("Lead", { content_name: source });
  },
};

export function reportError(err: unknown, context?: string) {
  console.error(context || "error", err);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Sentry = typeof window !== "undefined" ? (window as any).Sentry : null;
  if (Sentry?.captureException) {
    Sentry.captureException(err, { tags: { context } });
  }
  trackEvent("app_error", {
    context: context || "unknown",
    message: err instanceof Error ? err.message : String(err),
  });
}
