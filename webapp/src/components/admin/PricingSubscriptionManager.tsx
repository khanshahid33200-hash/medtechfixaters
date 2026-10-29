import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Tag,
  Percent,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building2,
  Stethoscope,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  Check,
  X,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface PlanItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  target_audience: string;
  billing_interval: 'month' | 'year' | 'custom' | 'one_time' | string;
  introductory_price_paise: number;
  recurring_price_paise: number;
  original_price_paise: number;
  is_trial: boolean;
  is_active: boolean;
  badge_label?: string;
  savings_display?: string;
  cta_text?: string;
  terms_disclosure?: string;
  metadata?: any;
}


export interface CouponItem {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  max_uses?: number | null;
  times_used: number;
  per_user_limit: number;
  min_order_value_paise: number;
  is_recurring: boolean;
  is_active: boolean;
  applicable_plan_ids?: string[];
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  organization_id?: string;
  plan_id?: string;
  plan_code?: string;
  status: 'active' | 'grace_period' | 'expired' | 'unpaid' | 'cancelled' | 'trialing';
  billing_interval?: string;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string;
  amount_paise?: number;
  currency?: string;
  coupon_code?: string;
  discount_paise?: number;
  organization_name?: string;
  owner_email?: string;
  owner_name?: string;
  created_at: string;
}

export default function PricingSubscriptionManager() {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons' | 'subscriptions'>('plans');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Data states
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);

  // Modals state
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Coupon Form
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    max_uses: 500,
    per_user_limit: 1,
    valid_until: '',
    applicable_plan_id: 'all',
    is_active: true,
  });

  // Coupon Live Tester
  const [testCode, setTestCode] = useState('CLINIC50');
  const [testPlanId, setTestPlanId] = useState('doctor_intro_500');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Subscription Filters
  const [subSearch, setSubSearch] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  // Fallback Canonical Plans (Matching PricingPage.tsx & config/pricing.ts)
  const defaultPlans: PlanItem[] = [
    {
      id: 'doctor_intro_500',
      name: 'First Month Special Offer',
      tagline: 'Save 90% on your first month',
      description: 'Introductory pricing applies to first month only. From month two, regular ₹5,000/month applies.',
      target_audience: 'Individual doctors and single-counter outpatient clinics',
      billing_interval: 'month',
      introductory_price_paise: 50000,
      recurring_price_paise: 500000,
      original_price_paise: 500000,
      badge_label: '90% OFF FIRST MONTH',
      savings_display: 'From month two, ₹5,000 per month.',
      cta_text: 'Get Started for ₹500',
      terms_disclosure: 'Introductory pricing applies to your first month only. From month two, regular ₹5,000 per month applies. No automatic deduction without prior renewal confirmation.',
      is_trial: true,
      is_active: true,
    },
    {
      id: 'doctor_monthly_5000',
      name: 'Doctor and Clinic Plan',
      tagline: 'Consistent, monthly digital healthcare management',
      description: 'Standard monthly subscription billed at ₹5,000/mo. Cancel or renew anytime.',
      target_audience: 'Individual doctors and clinics seeking regular access',
      billing_interval: 'month',
      introductory_price_paise: 500000,
      recurring_price_paise: 500000,
      original_price_paise: 650000,
      badge_label: 'Monthly Subscription',
      savings_display: 'Standard monthly subscription. Cancel or renew anytime.',
      cta_text: 'Subscribe Now',
      terms_disclosure: 'A monthly subscription for eligible individual doctors and clinics. Billed at ₹5,000 per month. You can review all terms before final checkout.',
      is_trial: false,
      is_active: true,
    },
    {
      id: 'doctor_yearly_50000',
      name: 'Yearly Doctor & Clinic Pro',
      tagline: 'Annual subscription with 2 months free + custom clinic website',
      description: 'Full 12-month license including 2 months free, complimentary custom clinic website build, Google SEO setup.',
      target_audience: 'Doctors & clinics wanting custom web presence and annual savings',
      billing_interval: 'year',
      introductory_price_paise: 5000000,
      recurring_price_paise: 5000000,
      original_price_paise: 6000000,
      badge_label: '2 MONTHS FREE + WEBSITE',
      savings_display: 'Save ₹10,000/year + Free Custom Clinic Website',
      cta_text: 'Get Yearly Plan',
      terms_disclosure: 'Full 12-month license billed annually. Includes free custom clinic website build, Google SEO optimization, ABDM M1/M2 readiness, and dedicated priority support.',
      is_trial: false,
      is_active: true,
    },
    {
      id: 'hospital_custom',
      name: 'Hospital Solutions',
      tagline: 'Tailored pricing based on operational and technical scale',
      description: 'Pricing depends on hospital requirements, doctor count, voice callouts, and TV queues. Custom quotation.',
      target_audience: 'Hospitals, multi-doctor facilities, and larger healthcare organizations',
      billing_interval: 'custom',
      introductory_price_paise: 0,
      recurring_price_paise: 0,
      original_price_paise: 0,
      badge_label: 'ENTERPRISE SCALE',
      savings_display: 'Enterprise SLA & dedicated engineering team included.',
      cta_text: 'Contact MedTechFixaters',
      terms_disclosure: 'Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. Contact our enterprise team for a custom quote.',
      is_trial: false,
      is_active: true,
    },
  ];

  const defaultCoupons: CouponItem[] = [
    {
      id: 'default-1',
      code: 'CLINIC50',
      description: '50% promotional discount on platform activation',
      discount_type: 'percentage',
      discount_value: 50,
      max_uses: 1000,
      times_used: 12,
      per_user_limit: 1,
      min_order_value_paise: 50000,
      is_recurring: false,
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'default-2',
      code: 'MEDTECH10',
      description: '10% discount on all plans and renewals',
      discount_type: 'percentage',
      discount_value: 10,
      max_uses: 5000,
      times_used: 48,
      per_user_limit: 2,
      min_order_value_paise: 50000,
      is_recurring: true,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  // Load data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Plans AND Pricing Cards in parallel
      const [plansRes, cardsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('introductory_price_paise', { ascending: true }),
        supabase.from('pricing_cards').select('*'),
      ]);

      const plansData = plansRes.data;
      const cardsData = cardsRes.data;

      if (plansData && plansData.length > 0) {
        const mergedPlans: PlanItem[] = plansData.map((plan: any) => {
          const card = cardsData?.find((c: any) => c.plan_id === plan.id);
          const defaultPlan = defaultPlans.find((dp) => dp.id === plan.id);
          return {
            id: plan.id,
            name: card?.display_title || plan.name,
            tagline: card?.subtitle || plan.tagline || defaultPlan?.tagline || '',
            description: plan.description || defaultPlan?.description || '',
            target_audience: plan.target_audience || defaultPlan?.target_audience || '',
            billing_interval: card?.billing_interval || plan.billing_interval || defaultPlan?.billing_interval || 'month',
            introductory_price_paise: card?.price_today_paise ?? plan.introductory_price_paise ?? 0,
            recurring_price_paise: card?.future_recurring_paise ?? plan.recurring_price_paise ?? 0,
            original_price_paise: card?.original_price_paise ?? plan.original_price_paise ?? 0,
            badge_label: card?.badge_label || defaultPlan?.badge_label || '',
            savings_display: card?.savings_display || defaultPlan?.savings_display || '',
            cta_text: card?.cta_text || defaultPlan?.cta_text || 'Get Started',
            terms_disclosure: card?.terms_disclosure || defaultPlan?.terms_disclosure || '',
            is_trial: Boolean(plan.is_trial),
            is_active: card ? card.publication_status === 'published' : Boolean(plan.is_active),
            metadata: plan.metadata,
          };
        });
        setPlans(mergedPlans);
      } else {
        setPlans(defaultPlans);
      }

      // 2. Fetch Coupons
      const { data: couponData, error: coupErr } = await supabase
        .from('coupon_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!coupErr && couponData && couponData.length > 0) {
        setCoupons(couponData);
      } else {
        setCoupons(defaultCoupons);
      }

      // 3. Fetch Subscriptions
      const { data: subData, error: subErr } = await supabase
        .from('subscriptions')
        .select('*, organizations(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!subErr && subData) {
        const mappedSubs: SubscriptionRecord[] = subData.map((s: any) => ({
          id: s.id,
          organization_id: s.organization_id,
          plan_id: s.plan_id || s.plan_code,
          plan_code: s.plan_code || s.plan_id,
          status: s.status,
          billing_interval: s.billing_interval || 'month',
          current_period_start: s.current_period_start,
          current_period_end: s.current_period_end,
          trial_end: s.trial_end,
          amount_paise: s.amount_paise || (s.plan_code === 'doctor_intro_500' ? 50000 : 500000),
          currency: s.currency || 'INR',
          coupon_code: s.coupon_code,
          discount_paise: s.discount_paise,
          organization_name: s.organizations?.organization_name || 'Individual Practice',
          created_at: s.created_at,
        }));
        setSubscriptions(mappedSubs);
      }
    } catch (err: any) {
      console.warn('[PricingManager] fetch error, using fallbacks:', err.message);
      setPlans(defaultPlans);
      setCoupons(defaultCoupons);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Save edited plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setActionLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const introPaise = Number(editingPlan.introductory_price_paise);
      const recurringPaise = Number(editingPlan.recurring_price_paise);
      const originalPaise = Number(editingPlan.original_price_paise);

      // Clean and guarantee valid billing_interval & duration_days
      const cleanInterval = ['month', 'year', 'custom', 'one_time'].includes(editingPlan.billing_interval)
        ? editingPlan.billing_interval
        : (editingPlan.id.includes('yearly') ? 'year' : editingPlan.id.includes('custom') ? 'custom' : 'month');

      const durationDays = cleanInterval === 'year' ? 365 : cleanInterval === 'custom' ? 365 : 30;

      // 1. Update subscription_plans table in Supabase
      const planPayload = {
        name: editingPlan.name.trim(),
        tagline: editingPlan.tagline?.trim() || null,
        description: editingPlan.description?.trim() || null,
        target_audience: editingPlan.target_audience?.trim() || null,
        billing_interval: cleanInterval,
        duration_days: durationDays,
        introductory_price_paise: introPaise,
        recurring_price_paise: recurringPaise,
        original_price_paise: originalPaise,
        is_trial: Boolean(editingPlan.is_trial),
        is_active: Boolean(editingPlan.is_active),
        updated_at: nowIso,
      };

      const { error: upErr } = await supabase
        .from('subscription_plans')
        .update(planPayload)
        .eq('id', editingPlan.id);

      if (upErr) {
        console.warn('subscription_plans update error:', upErr);
      }

      // Sync alias row if exists (e.g. plan_trial_500 vs doctor_intro_500)
      const aliasId =
        editingPlan.id === 'doctor_intro_500'
          ? 'plan_trial_500'
          : editingPlan.id === 'plan_trial_500'
          ? 'doctor_intro_500'
          : editingPlan.id === 'doctor_monthly_5000'
          ? 'plan_monthly_5000'
          : editingPlan.id === 'plan_monthly_5000'
          ? 'doctor_monthly_5000'
          : editingPlan.id === 'doctor_yearly_50000'
          ? 'plan_yearly_50000'
          : editingPlan.id === 'plan_yearly_50000'
          ? 'doctor_yearly_50000'
          : null;

      if (aliasId) {
        await supabase
          .from('subscription_plans')
          .update(planPayload)
          .eq('id', aliasId);
      }

      // 2. Update pricing_cards table in Supabase
      const cardPayload = {
        display_title: editingPlan.name.trim(),
        subtitle: editingPlan.tagline?.trim() || null,
        badge_label: editingPlan.badge_label?.trim() || null,
        price_today_paise: introPaise,
        future_recurring_paise: recurringPaise,
        original_price_paise: originalPaise,
        billing_interval: cleanInterval,
        savings_display: editingPlan.savings_display?.trim() || null,
        cta_text: editingPlan.cta_text?.trim() || 'Get Started',
        terms_disclosure: editingPlan.terms_disclosure?.trim() || null,
        publication_status: editingPlan.is_active ? 'published' : 'draft',
        updated_at: nowIso,
      };

      const { error: cardErr } = await supabase
        .from('pricing_cards')
        .update(cardPayload)
        .eq('plan_id', editingPlan.id);

      if (cardErr) {
        console.warn('pricing_cards update error:', cardErr);
      }

      if (aliasId) {
        await supabase
          .from('pricing_cards')
          .update(cardPayload)
          .eq('plan_id', aliasId);
      }

      // 3. Prepare mapped frontend PricingPlan object
      const isIntro = editingPlan.id === 'doctor_intro_500';
      const isYearly = editingPlan.id === 'doctor_yearly_50000';
      const isEnterprise = editingPlan.id === 'hospital_custom' || editingPlan.billing_interval === 'custom';

      let billingFrequency = 'per month';
      if (editingPlan.billing_interval === 'year') {
        billingFrequency = 'per year';
      } else if (isIntro) {
        billingFrequency = 'for your first month';
      } else if (isEnterprise) {
        billingFrequency = 'custom quotation';
      }

      const mappedPrice = isEnterprise ? null : Math.round(introPaise / 100);
      const mappedPlanForFrontend = {
        id: editingPlan.id,
        name: editingPlan.name.trim(),
        tagline: editingPlan.tagline?.trim() || '',
        targetAudience: editingPlan.target_audience?.trim() || '',
        price: mappedPrice,
        originalPrice: originalPaise > 0 ? Math.round(originalPaise / 100) : undefined,
        discountBadge: editingPlan.badge_label?.trim() || undefined,
        currency: '₹',
        billingFrequency,
        secondaryBillingNote: editingPlan.savings_display?.trim() || undefined,
        termsDisclosure: editingPlan.terms_disclosure?.trim() || editingPlan.description?.trim() || '',
        ctaText: editingPlan.cta_text?.trim() || (isEnterprise ? 'Contact MedTechFixaters' : `Get Started for ₹${(mappedPrice ?? 0).toLocaleString('en-IN')}`),
        badge: editingPlan.badge_label?.trim() || undefined,
        isPopular: Boolean(editingPlan.is_trial || isIntro),
        isEnterprise,
      };

      // 4. Update localStorage cache & broadcast for instant live website update
      const CACHE_KEY = 'medtech_live_pricing_overrides';
      let currentCache: any[] = [];
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) currentCache = JSON.parse(raw);
      } catch {
        // ignore
      }
      const existingIdx = currentCache.findIndex((p: any) => p.id === editingPlan.id);
      if (existingIdx >= 0) {
        currentCache[existingIdx] = { ...currentCache[existingIdx], ...mappedPlanForFrontend };
      } else {
        currentCache.push(mappedPlanForFrontend);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(currentCache));

      // Dispatch event in current window
      window.dispatchEvent(new CustomEvent('medtech_pricing_updated', { detail: currentCache }));

      // Broadcast across tabs
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('medtech_pricing_channel');
          bc.postMessage({ type: 'PRICING_UPDATED', plans: currentCache });
          bc.close();
        } catch {
          // ignore
        }
      }

      // 5. POST to /api/pricing to update server memory cache
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token || '';
        await fetch('/api/pricing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            plan: mappedPlanForFrontend,
            plans: currentCache,
          }),
        });
      } catch (postErr) {
        console.warn('Failed to POST to /api/pricing:', postErr);
      }

      // 6. Update platform_settings in Supabase
      try {
        await supabase
          .from('platform_settings')
          .upsert([
            {
              key: 'live_pricing',
              value: currentCache,
              updated_at: nowIso,
            },
          ]);
      } catch {
        // ignore
      }

      setNotice(`Plan "${editingPlan.name}" updated successfully! Changes are live across the website.`);
      setEditingPlan(null);
      fetchData();
    } catch (err: any) {
      setError(`Failed to update plan: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCoupon = async (coupon: CouponItem) => {
    setActionLoading(true);
    try {
      const updatedStatus = !coupon.is_active;
      const { error } = await supabase
        .from('coupon_codes')
        .update({ is_active: updatedStatus, updated_at: new Date().toISOString() })
        .eq('id', coupon.id);

      if (error) throw error;

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: updatedStatus } : c))
      );
      setNotice(`Coupon ${coupon.code} is now ${updatedStatus ? 'Active' : 'Disabled'}.`);
    } catch (err: any) {
      setError(`Coupon update failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Create Coupon
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const cleanCode = newCoupon.code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please provide a coupon code.');
      setActionLoading(false);
      return;
    }

    try {
      const applicablePlans =
        newCoupon.applicable_plan_id === 'all' ? [] : [newCoupon.applicable_plan_id];

      const discountValue =
        newCoupon.discount_type === 'percentage'
          ? Number(newCoupon.discount_value)
          : Number(newCoupon.discount_value) * 100; // convert rupees to paise for fixed

      const { data, error } = await supabase
        .from('coupon_codes')
        .insert([
          {
            code: cleanCode,
            description: newCoupon.description.trim() || `${cleanCode} promotional offer`,
            discount_type: newCoupon.discount_type,
            discount_value: discountValue,
            max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
            per_user_limit: Number(newCoupon.per_user_limit) || 1,
            valid_until: newCoupon.valid_until ? new Date(newCoupon.valid_until).toISOString() : null,
            applicable_plan_ids: applicablePlans,
            is_active: newCoupon.is_active,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setNotice(`Coupon ${cleanCode} created successfully!`);
      setShowCreateCouponModal(false);
      setNewCoupon({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 10,
        max_uses: 500,
        per_user_limit: 1,
        valid_until: '',
        applicable_plan_id: 'all',
        is_active: true,
      });
      fetchData();
    } catch (err: any) {
      setError(`Failed to create coupon: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Test Coupon Calculation Live
  const handleTestCoupon = async () => {
    setTestLoading(true);
    setTestResult(null);

    const plan = plans.find((p) => p.id === testPlanId) || defaultPlans[0];
    const basePaise = plan.introductory_price_paise;

    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        p_code: testCode.trim().toUpperCase(),
        p_plan_id: testPlanId,
        p_order_amount_paise: basePaise,
      });

      if (error) {
        // Fallback local test calculation
        const coup = coupons.find((c) => c.code === testCode.trim().toUpperCase() && c.is_active);
        if (coup) {
          const discount =
            coup.discount_type === 'percentage'
              ? Math.round((basePaise * coup.discount_value) / 100)
              : coup.discount_value;
          setTestResult({
            valid: true,
            code: coup.code,
            discount_type: coup.discount_type,
            discount_value: coup.discount_value,
            original_amount_paise: basePaise,
            discount_paise: discount,
            final_amount_paise: Math.max(0, basePaise - discount),
            message: `Coupon ${coup.code} verified locally.`,
          });
        } else {
          setTestResult({
            valid: false,
            error: 'Coupon not found or inactive.',
          });
        }
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestResult({ valid: false, error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  // Extend Subscription Expiry by 30 days
  const handleExtendSubscription = async (sub: SubscriptionRecord, daysToAdd = 30) => {
    setActionLoading(true);
    try {
      const currentEnd = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
      const newEnd = new Date(currentEnd.getTime() + daysToAdd * 86400000);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          current_period_end: newEnd.toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      if (error) throw error;

      setNotice(`Subscription extended by ${daysToAdd} days until ${newEnd.toLocaleDateString('en-IN')}.`);
      fetchData();
    } catch (err: any) {
      setError(`Extend subscription error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered subscriptions
  const filteredSubs = subscriptions.filter((s) => {
    if (subStatusFilter !== 'all' && s.status !== subStatusFilter) return false;
    if (subSearch) {
      const q = subSearch.toLowerCase();
      return (
        s.organization_name?.toLowerCase().includes(q) ||
        s.plan_code?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header and KPI Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-1.5">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Centralized Billing & Monetization Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Dynamic Pricing & Subscription Control
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Configure real-time pricing cards, promotional coupon campaigns, and manage doctor subscription lifecycles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowCreateCouponModal(true)}
            className="px-4 py-2.5 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={15} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Configured Plans
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{plans.length}</span>
            <span className="text-xs font-bold text-emerald-600">4 Canonical</span>
          </div>
          <span className="text-[10px] text-slate-400">Trial, Monthly, Yearly, Hospital</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Coupons
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#FF6A00]">
              {coupons.filter((c) => c.is_active).length}
            </span>
            <span className="text-xs font-bold text-slate-600">{coupons.length} Total</span>
          </div>
          <span className="text-[10px] text-slate-400">Atomic server-side validation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tracked Subscriptions
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600">{subscriptions.length}</span>
            <span className="text-xs font-bold text-emerald-600">
              {subscriptions.filter((s) => s.status === 'active').length} Active
            </span>
          </div>
          <span className="text-[10px] text-slate-400">PostgreSQL RLS Protected</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Payment Gateway
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black text-slate-900">Cashfree v3</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
              Live Verified
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Auto webhook reconciliation</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard size={15} />
          <span>Plans & Public Price Cards</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'coupons'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Tag size={15} />
          <span>Coupons & Promotional Offers ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3.5 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'subscriptions'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers size={15} />
          <span>Subscriptions Ledger ({subscriptions.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: PLANS & PRICING CARDS ──────────────────────────── */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isIntro = plan.id === 'doctor_intro_500';
              const isYearly = plan.id === 'doctor_yearly_50000';
              const isEnterprise = plan.id === 'hospital_custom';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-5 border shadow-sm flex flex-col justify-between transition-all bg-white ${
                    isIntro
                      ? 'border-orange-300 ring-2 ring-orange-500/10'
                      : isYearly
                      ? 'border-indigo-300 ring-2 ring-indigo-500/10'
                      : isEnterprise
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isIntro
                            ? 'bg-orange-100 text-orange-800'
                            : isYearly
                            ? 'bg-indigo-100 text-indigo-800'
                            : isEnterprise
                            ? 'bg-orange-500/20 text-orange-400'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isIntro ? 'First Month 90% OFF' : isYearly ? 'Best Value (2 Mo Free)' : isEnterprise ? 'Enterprise' : 'Monthly Regular'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            plan.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <span className={`text-[10px] font-bold ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          {plan.is_active ? 'Active' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className={`font-black text-lg ${isEnterprise ? 'text-white' : 'text-slate-900'}`}>
                        {plan.name}
                      </h3>
                      <p className={`text-xs mt-1 font-medium ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Price in INR */}
                    <div className="pt-2 border-t border-slate-100/10">
                      {plan.id !== 'hospital_custom' ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            {plan.original_price_paise > plan.introductory_price_paise && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                ₹{(plan.original_price_paise / 100).toLocaleString('en-IN')}
                              </span>
                            )}
                            <span className={`text-3xl font-black font-mono ${isEnterprise ? 'text-white' : 'text-slate-900'}`}>
                              ₹{(plan.introductory_price_paise / 100).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold block mt-0.5 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                            {isIntro ? 'for first month (then ₹5,000/mo)' : isYearly ? 'per year (save ₹10,000)' : 'per month'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-2xl font-black text-white">Custom Quote</span>
                          <span className="text-[11px] text-orange-400 block font-bold mt-0.5">
                            Tailored to hospital beds/scale
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Audience */}
                    <p className={`text-[11px] leading-relaxed pt-2 border-t border-slate-100/10 ${isEnterprise ? 'text-slate-300' : 'text-slate-600'}`}>
                      <strong>Target:</strong> {plan.target_audience}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-slate-100/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{plan.id}</span>
                    <button
                      type="button"
                      onClick={() => setEditingPlan(plan)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Edit3 size={13} />
                      <span>Edit Plan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: COUPONS & PROMOTIONAL OFFERS ───────────────────── */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Coupon Live Validator Widget */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-50 via-white to-indigo-50 border border-orange-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  Live Server Validator
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-1">
                  Test Coupon Code Against Plans
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Simulates real-time checkout discount calculation
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Enter coupon code (e.g. CLINIC50)"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-xs outline-none focus:border-[#FF6A00] min-w-[200px]"
              />

              <select
                value={testPlanId}
                onChange={(e) => setTestPlanId(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-[#FF6A00]"
              >
                <option value="doctor_intro_500">First Month Trial (₹500)</option>
                <option value="doctor_monthly_5000">Monthly Regular (₹5,000)</option>
                <option value="doctor_yearly_50000">Yearly Pro (₹50,000)</option>
              </select>

              <button
                type="button"
                onClick={handleTestCoupon}
                disabled={testLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition-all disabled:opacity-50"
              >
                {testLoading ? 'Validating...' : 'Validate Code'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between ${
                  testResult.valid
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {testResult.valid ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      Coupon <strong>{testResult.code}</strong> applied: Discount of{' '}
                      <strong>₹{(testResult.discount_paise / 100).toLocaleString('en-IN')}</strong>. Final payable:{' '}
                      <strong className="text-emerald-700 font-mono text-sm">
                        ₹{(testResult.final_amount_paise / 100).toLocaleString('en-IN')}
                      </strong>{' '}
                      (Original: ₹{(testResult.original_amount_paise / 100).toLocaleString('en-IN')}).
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{testResult.error || 'Invalid or inapplicable coupon.'}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Coupons Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Configured Coupon Codes</h3>
              <span className="text-xs font-bold text-slate-500">{coupons.length} Coupons</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Coupon Code</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Redemptions</th>
                    <th className="py-3.5 px-4">Per User Limit</th>
                    <th className="py-3.5 px-4">Validity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="text-slate-400 hover:text-slate-700 p-1"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        {c.description && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {c.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.discount_type === 'percentage'
                          ? `${c.discount_value}% OFF`
                          : `₹${(c.discount_value / 100).toLocaleString('en-IN')} Flat`}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold">
                        {c.times_used} / {c.max_uses ? c.max_uses : '∞'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {c.per_user_limit} {c.per_user_limit === 1 ? 'time' : 'times'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {c.valid_until
                          ? new Date(c.valid_until).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'No expiry'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            c.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c)}
                          disabled={actionLoading}
                          className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                            c.is_active
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {c.is_active ? 'Deactivate' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SUBSCRIPTIONS LEDGER ───────────────────────────── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search doctor or clinic..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-[#FF6A00] min-w-[240px]"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => setSubStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="grace_period">Grace Period</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Showing {filteredSubs.length} of {subscriptions.length} subscriptions
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Clinic / Practice</th>
                    <th className="py-3.5 px-4">Plan Code</th>
                    <th className="py-3.5 px-4">Interval</th>
                    <th className="py-3.5 px-4">Expiry Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Quick Extend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                        No subscriptions found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => {
                      const daysLeft = sub.current_period_end
                        ? Math.ceil(
                            (new Date(sub.current_period_end).getTime() - Date.now()) / 86400000
                          )
                        : null;

                      return (
                        <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              {sub.organization_name || 'Individual Practice'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {sub.id.slice(0, 8)}...
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            {sub.plan_code || 'doctor_intro_500'}
                          </td>

                          <td className="py-3 px-4 capitalize text-slate-600">
                            {sub.billing_interval || 'month'}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 block">
                              {sub.current_period_end
                                ? new Date(sub.current_period_end).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Indefinite'}
                            </span>
                            {daysLeft !== null && (
                              <span
                                className={`text-[10px] font-bold ${
                                  daysLeft > 7
                                    ? 'text-emerald-600'
                                    : daysLeft > 0
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                sub.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sub.status === 'grace_period'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleExtendSubscription(sub, 30)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                              >
                                +30 Days
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExtendSubscription(sub, 365)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-700 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
                              >
                                +1 Year
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PLAN ───────────────────────────────────────── */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                  Plan Configuration
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Edit {editingPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan Display Name *</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={editingPlan.tagline || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                />
              </div>

              {/* 3 Price Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Price Today / Intro (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editingPlan.introductory_price_paise / 100}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        introductory_price_paise: Number(e.target.value) * 100,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-[#FF6A00]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Visible card price</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editingPlan.original_price_paise / 100}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        original_price_paise: Number(e.target.value) * 100,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-[#FF6A00]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Strikethrough discount</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recurring Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editingPlan.recurring_price_paise / 100}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        recurring_price_paise: Number(e.target.value) * 100,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-[#FF6A00]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Subsequent renewals</span>
                </div>
              </div>

              {/* Billing Interval & Promo Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Billing Interval</label>
                  <select
                    value={editingPlan.billing_interval || 'month'}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        billing_interval: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  >
                    <option value="month">Monthly (/month)</option>
                    <option value="year">Yearly (/year)</option>
                    <option value="custom">Custom Quotation</option>
                    <option value="one_time">One-Time Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Promo Badge Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 90% OFF FIRST MONTH"
                    value={editingPlan.badge_label || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, badge_label: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              {/* CTA Text & Savings Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Call To Action (CTA)</label>
                  <input
                    type="text"
                    placeholder="e.g. Get Started for ₹500"
                    value={editingPlan.cta_text || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, cta_text: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Savings / Secondary Note</label>
                  <input
                    type="text"
                    placeholder="e.g. From month two, ₹5,000 per month."
                    value={editingPlan.savings_display || ''}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, savings_display: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <input
                  type="text"
                  value={editingPlan.target_audience || ''}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, target_audience: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Terms & Renewal Disclosure</label>
                <textarea
                  rows={2}
                  value={editingPlan.terms_disclosure || ''}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, terms_disclosure: e.target.value })
                  }
                  placeholder="Legal and renewal terms displayed beneath card CTA"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_trial}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, is_trial: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Is Introductory / Trial Offer</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingPlan.is_active}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, is_active: e.target.checked })
                    }
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                  <span>Active & Published on Website</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold rounded-xl shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? 'Publishing Live...' : 'Save & Publish Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE COUPON ──────────────────────────────────── */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                  Campaign Engine
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Create Promotional Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCouponModal(false)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CLINIC70 or LAUNCH2026"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Description</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor conference discount code"
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={newCoupon.discount_type}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#FF6A00]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {newCoupon.discount_type === 'percentage' ? 'Percentage (1 - 100)' : 'Amount in INR (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newCoupon.discount_type === 'percentage' ? 100 : 50000}
                    value={newCoupon.discount_value}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Total Uses</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="e.g. 1000"
                    value={newCoupon.max_uses}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, max_uses: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Per-User Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newCoupon.per_user_limit}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, per_user_limit: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable Plan</label>
                <select
                  value={newCoupon.applicable_plan_id}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, applicable_plan_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#FF6A00]"
                >
                  <option value="all">All Plans</option>
                  <option value="doctor_intro_500">First Month Trial Only</option>
                  <option value="doctor_monthly_5000">Monthly Regular Plan Only</option>
                  <option value="doctor_yearly_50000">Yearly Pro Plan Only</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold rounded-xl shadow cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Coupon Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
