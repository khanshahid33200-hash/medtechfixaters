import { useState, useEffect, useCallback } from 'react';
import { PRICING_PLANS, PricingPlan } from '../config/pricing';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'medtech_live_pricing_overrides';
const BROADCAST_CHANNEL_NAME = 'medtech_pricing_channel';

/**
 * Helper to get cached plans from localStorage synchronously
 * ensuring 0-millisecond rendering with no layout flicker.
 */
function getInitialPlans(): PricingPlan[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with canonical definitions to preserve all properties & structure
        return PRICING_PLANS.map((defaultPlan) => {
          const match = parsed.find((p: any) => p.id === defaultPlan.id);
          return match ? { ...defaultPlan, ...match } : defaultPlan;
        });
      }
    }
  } catch {
    // ignore parsing errors
  }
  return PRICING_PLANS;
}

export function usePricingPlans() {
  const [plans, setPlans] = useState<PricingPlan[]>(getInitialPlans);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to find a specific plan
  const getPlan = useCallback(
    (id: string): PricingPlan | undefined => {
      return plans.find((p) => p.id === id);
    },
    [plans]
  );

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from public dynamic pricing API
      const res = await fetch('/api/pricing', {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Pricing API returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.plans) && json.plans.length > 0) {
        // Merge with defaults to ensure full object structure
        const merged: PricingPlan[] = PRICING_PLANS.map((defaultPlan) => {
          const match = json.plans.find((p: any) => p.id === defaultPlan.id);
          return match ? { ...defaultPlan, ...match } : defaultPlan;
        });

        setPlans(merged);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
        } catch {
          // ignore localStorage quota errors
        }
      }
    } catch (err: any) {
      console.warn('[usePricingPlans] fetch failed, retaining cached/canonical plans:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount
    fetchPlans();

    // 1. Cross-component custom event listener (same tab)
    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setPlans(customEvent.detail);
      } else {
        fetchPlans();
      }
    };
    window.addEventListener('medtech_pricing_updated', handleCustomUpdate);

    // 2. BroadcastChannel for instant cross-tab sync
    let broadcast: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        broadcast = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        broadcast.onmessage = (event) => {
          if (event.data?.type === 'PRICING_UPDATED') {
            if (event.data.plans && Array.isArray(event.data.plans)) {
              setPlans(event.data.plans);
            } else {
              fetchPlans();
            }
          }
        };
      } catch {
        // BroadcastChannel unsupported or restricted
      }
    }

    // 3. Storage event for cross-tab fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPlans((prev) =>
              prev.map((dp) => {
                const match = parsed.find((p: any) => p.id === dp.id);
                return match ? { ...dp, ...match } : dp;
              })
            );
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Supabase Realtime channel on pricing_cards table
    const channel = supabase
      .channel('public_pricing_cards_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_cards' },
        () => {
          fetchPlans();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('medtech_pricing_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
      if (broadcast) {
        broadcast.close();
      }
      supabase.removeChannel(channel);
    };
  }, [fetchPlans]);

  return {
    plans,
    getPlan,
    loading,
    error,
    refresh: fetchPlans,
  };
}
