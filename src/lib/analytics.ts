import { track } from '@vercel/analytics';
import type { BeforeSendEvent } from '@vercel/analytics';

export type MarketingEventName =
  | 'trial_cta_clicked'
  | 'sign_in_clicked'
  | 'demo_clicked'
  | 'pricing_cta_clicked';

export type MarketingPlacement = 'hero' | 'header' | 'preview' | 'pricing' | 'footer';

export interface MarketingEventProps {
  placement: MarketingPlacement;
  [key: string]: string | number | boolean | null | undefined;
}

const SENSITIVE_QUERY_PARAM_REGEX =
  /^(code|state|token|token_hash|access_token|refresh_token|id_token|session_id|razorpay_payment_id|razorpay_order_id|razorpay_signature|key|secret|password|email|phone)$/i;

/**
 * Sanitizes URLs to prevent accidental leakage of OAuth tokens, payment signatures,
 * or personal identifiers to analytics platforms.
 */
export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const isRelative = rawUrl.startsWith('/') || !rawUrl.includes('://');
    const url = new URL(rawUrl, 'https://zaaykatech.com');

    // Strip all query parameters on auth callback routes
    if (url.pathname.startsWith('/auth/callback')) {
      return isRelative ? url.pathname : `${url.origin}${url.pathname}`;
    }

    const filteredParams: [string, string][] = [];
    url.searchParams.forEach((value, key) => {
      if (!SENSITIVE_QUERY_PARAM_REGEX.test(key)) {
        filteredParams.push([key, value]);
      }
    });

    url.search = '';
    for (const [key, value] of filteredParams) {
      url.searchParams.append(key, value);
    }

    const searchStr = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
    return isRelative ? `${url.pathname}${searchStr}` : `${url.origin}${url.pathname}${searchStr}`;
  } catch {
    // If URL parsing fails, drop query string and hash completely for safety
    return rawUrl.split('?')[0].split('#')[0];
  }
}

/**
 * Privacy filter for Vercel Web Analytics.
 * Scrubs tokens, auth codes, and payment identifiers from outgoing event beacons.
 */
export function filterAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  if (!event || !event.url) return event;
  try {
    return {
      ...event,
      url: sanitizeUrl(event.url),
    };
  } catch {
    return event;
  }
}

/**
 * Privacy filter for Vercel Speed Insights.
 */
export function filterSpeedInsightsEvent<T extends { url: string }>(event: T): T | null {
  if (!event || !event.url) return event;
  try {
    return {
      ...event,
      url: sanitizeUrl(event.url),
    };
  } catch {
    return event;
  }
}

/**
 * Safe, non-blocking marketing custom event dispatcher.
 * Dispatches to Vercel Analytics without ever interrupting navigation or throwing.
 */
export function trackMarketingEvent(
  eventName: MarketingEventName,
  properties: MarketingEventProps
): void {
  try {
    if (typeof window === 'undefined') return;
    // Dispatch non-sensitive event
    track(eventName, properties);
  } catch (err) {
    // Silently ignore tracking errors so UX is never impacted
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Analytics] Track failed for ${eventName}:`, err);
    }
  }
}
