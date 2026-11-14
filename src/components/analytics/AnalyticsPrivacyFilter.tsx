'use client';

import { useEffect } from 'react';
import { filterAnalyticsEvent, filterSpeedInsightsEvent } from '@/lib/analytics';

export default function AnalyticsPrivacyFilter() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register beforeSend handler on window.va queue for Vercel Web Analytics
    try {
      if (typeof window.va === 'function') {
        window.va('beforeSend', filterAnalyticsEvent);
      } else {
        window.vaq = window.vaq || [];
        window.vaq.push(['beforeSend', filterAnalyticsEvent]);
      }
    } catch {
      // Non-blocking
    }

    // Register beforeSend handler on window.si queue for Vercel Speed Insights
    try {
      if (typeof window.si === 'function') {
        window.si('beforeSend', filterSpeedInsightsEvent);
      } else {
        window.siq = window.siq || [];
        window.siq.push(['beforeSend', filterSpeedInsightsEvent]);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  return null;
}
