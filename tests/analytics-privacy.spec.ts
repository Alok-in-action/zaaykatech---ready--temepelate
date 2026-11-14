import { test, expect } from '@playwright/test';
import {
  sanitizeUrl,
  filterAnalyticsEvent,
  filterSpeedInsightsEvent,
  trackMarketingEvent,
} from '../src/lib/analytics';

test.describe('Analytics Privacy & URL Sanitization', () => {
  test('strips sensitive OAuth parameters (code, state)', () => {
    const raw = 'https://zaaykatech.com/?code=secret_oauth_code_123&state=xyz987&utm_source=google';
    const cleaned = sanitizeUrl(raw);
    expect(cleaned).toContain('utm_source=google');
    expect(cleaned).not.toContain('code=');
    expect(cleaned).not.toContain('secret_oauth_code_123');
    expect(cleaned).not.toContain('state=');
  });

  test('strips sensitive payment parameters (razorpay_payment_id, signature)', () => {
    const raw = 'https://zaaykatech.com/owner/billing?razorpay_payment_id=pay_123&razorpay_signature=sig_abc&status=success';
    const cleaned = sanitizeUrl(raw);
    expect(cleaned).toContain('status=success');
    expect(cleaned).not.toContain('pay_123');
    expect(cleaned).not.toContain('sig_abc');
    expect(cleaned).not.toContain('razorpay_payment_id');
  });

  test('strips personal information (email, phone, password)', () => {
    const raw = '/login?email=user%40restaurant.com&phone=9876543210&tab=credentials';
    const cleaned = sanitizeUrl(raw);
    expect(cleaned).toContain('tab=credentials');
    expect(cleaned).not.toContain('user%40restaurant.com');
    expect(cleaned).not.toContain('9876543210');
  });

  test('completely redacts query parameters on /auth/callback', () => {
    const raw = 'https://zaaykatech.com/auth/callback?code=oauth_access_code_secret&token=abc';
    const cleaned = sanitizeUrl(raw);
    expect(cleaned).toBe('https://zaaykatech.com/auth/callback');
  });

  test('filterAnalyticsEvent transforms url safely', () => {
    const event = {
      type: 'pageview' as const,
      url: 'https://zaaykatech.com/r/demo?token=leak_token&table=4',
    };
    const filtered = filterAnalyticsEvent(event);
    expect(filtered).not.toBeNull();
    expect(filtered?.url).toContain('table=4');
    expect(filtered?.url).not.toContain('leak_token');
  });

  test('filterSpeedInsightsEvent transforms url safely', () => {
    const event = {
      type: 'vital' as const,
      url: 'https://zaaykatech.com/owner/dashboard?session_id=sess_999',
    };
    const filtered = filterSpeedInsightsEvent(event);
    expect(filtered).not.toBeNull();
    expect(filtered?.url).not.toContain('session_id');
    expect(filtered?.url).not.toContain('sess_999');
  });

  test('trackMarketingEvent runs without throwing in server/test environment', () => {
    expect(() => {
      trackMarketingEvent('trial_cta_clicked', { placement: 'hero' });
      trackMarketingEvent('sign_in_clicked', { placement: 'header' });
      trackMarketingEvent('demo_clicked', { placement: 'preview' });
      trackMarketingEvent('pricing_cta_clicked', { placement: 'pricing', plan: 'pro_annual' });
    }).not.toThrow();
  });
});
