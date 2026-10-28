// Analytics Event Tracking Utility for MedTechFixaters Pricing and Subscriptions
import { supabase } from '../lib/supabase';

export type PricingAnalyticsEvent =
  | 'pricing_page_view'
  | 'pricing_plan_select'
  | 'pricing_checkout_start'
  | 'pricing_payment_success'
  | 'pricing_hospital_inquiry';

export interface PricingAnalyticsPayload {
  plan_id?: string;
  plan_name?: string;
  amount?: number;
  currency?: string;
  source?: string;
  order_id?: string;
  payment_id?: string;
  hospital_name?: string;
  doctor_count?: string;
  meta?: Record<string, unknown>;
}

// Generate or retrieve persistent anonymous session ID
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem('mtf_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      sessionStorage.setItem('mtf_session_id', sid);
    }
    return sid;
  } catch {
    return 'sid_fallback';
  }
}

/**
 * Tracks pricing funnel events to Supabase analytics_events table and local browser storage.
 */
export async function trackPricingEvent(
  eventName: PricingAnalyticsEvent,
  payload: PricingAnalyticsPayload = {}
): Promise<void> {
  const timestamp = new Date().toISOString();
  const sessionId = getSessionId();

  const eventRecord = {
    event_name: eventName,
    event_data: {
      ...payload,
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      timestamp,
    },
    session_id: sessionId,
  };

  // 1. Audit log to local storage for instant debugging & inspection
  try {
    const existing = JSON.parse(localStorage.getItem('mtf_analytics_events') || '[]');
    existing.unshift({
      eventName,
      payload,
      timestamp,
      sessionId,
    });
    // Keep last 50 events
    if (existing.length > 50) existing.length = 50;
    localStorage.setItem('mtf_analytics_events', JSON.stringify(existing));
  } catch (err) {
    // Ignore storage quota errors
  }

  // 2. Dispatch to Supabase analytics table asynchronously (non-blocking)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('analytics_events').insert([
      {
        event_name: eventName,
        event_data: eventRecord.event_data,
        session_id: sessionId,
        user_id: user?.id || null,
      },
    ]);
  } catch (err) {
    // Non-blocking catch to ensure UI never fails on telemetry
    console.debug('[Analytics] Telemetry logged locally:', eventName, payload);
  }
}
