import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yweywvnivyftwtglxavr.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZXl3dm5pdnlmdHd0Z2x4YXZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTEyOTgsImV4cCI6MjEwNTI4NzI5OH0.niHlKWf4zWGQ1sb59ZZ2n2SnZxbLeKfqkSkJnWGIxts';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PROJECT_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_ANON_KEY;

// Canonical default plans fallback in case database query is unreachable
const DEFAULT_PLANS = [
  {
    id: 'doctor_intro_500',
    name: 'First Month Special Offer',
    tagline: 'Save 90% on your first month',
    targetAudience: 'Individual doctors and single-counter outpatient clinics',
    price: 500,
    originalPrice: 5000,
    discountBadge: '90% OFF',
    currency: '₹',
    billingFrequency: 'for your first month',
    secondaryBillingNote: 'From month two, ₹5,000 per month.',
    termsDisclosure: 'Introductory pricing applies to your first month only. From month two, regular ₹5,000 per month applies. No automatic deduction without prior renewal confirmation.',
    ctaText: 'Get Started for ₹500',
    isPopular: true,
    badge: 'Special Introductory Offer',
    features: [
      'Digital receptionist for healthcare facilities',
      'Hospital-specific QR code access for OPD check-in',
      'Doctor discovery and appointment booking',
      'AI-assisted patient triage and chatbot',
      'Live patient queue management with real-time tokens',
      'Online payment integration (UPI, QR & cards)',
      'Separate doctor workspace dashboard with data isolation',
      'Administrative management tools for timings & daily collections',
    ],
    omittedFeatures: [
      'Voice receptionist functionality (Hospital plan only)',
      'Multi-department reception load balancing',
    ],
    highlights: [
      '₹500 for your first month (Regular price ₹5,000)',
      'Save 90% on your first month',
      'From month two, ₹5,000 per month',
      'Full clinical platform unlocked on day one',
    ],
  },
  {
    id: 'doctor_monthly_5000',
    name: 'Doctor and Clinic Plan',
    tagline: 'Consistent, monthly digital healthcare management',
    targetAudience: 'Individual doctors and clinics seeking regular access to MedTechFixaters',
    price: 5000,
    currency: '₹',
    billingFrequency: 'per month',
    secondaryBillingNote: 'Standard monthly subscription. Cancel or renew anytime.',
    termsDisclosure: 'A monthly subscription for eligible individual doctors and clinics. Billed at ₹5,000 per month. You can review all terms before final checkout.',
    ctaText: 'Subscribe Now',
    isPopular: false,
    badge: 'Monthly Subscription',
    features: [
      'Digital receptionist for healthcare facilities',
      'Hospital-specific QR code access for OPD check-in',
      'Doctor discovery and appointment booking',
      'AI-assisted patient triage and chatbot',
      'Live patient queue management with real-time tokens',
      'Online payment integration (UPI, QR & cards)',
      'Separate doctor workspace dashboard with data isolation',
      'Administrative management tools for timings & daily collections',
    ],
    omittedFeatures: [
      'Voice receptionist functionality (Hospital plan only)',
      'Multi-department reception load balancing',
    ],
    highlights: [
      '₹5,000 per month',
      'Ongoing monthly access with uninterrupted patient queues',
      'All doctor tools & AI triage included',
      'Direct priority WhatsApp & phone assistance',
    ],
  },
  {
    id: 'doctor_yearly_50000',
    name: 'Yearly Doctor & Clinic Pro',
    tagline: 'Full annual subscription with 2 months free + custom website',
    targetAudience: 'Doctors & clinics wanting custom web presence and annual savings',
    price: 50000,
    originalPrice: 60000,
    discountBadge: '2 MONTHS FREE',
    currency: '₹',
    billingFrequency: 'per year',
    secondaryBillingNote: 'Save ₹10,000/year + Free Custom Clinic Website',
    termsDisclosure: 'Full 12-month license billed annually. Includes free custom clinic website build, Google SEO optimization, ABDM M1/M2 readiness, and dedicated priority support.',
    ctaText: 'Get Yearly Plan',
    isPopular: false,
    badge: 'Best Value (2 Months Free + Free Website)',
    features: [
      'Everything in Monthly Plan Included',
      '2 Months Completely Free (₹10,000 Savings)',
      'FREE Custom Clinic Website & Domain Setup',
      'Google Business Profile & Local SEO Optimization',
      'ABDM M1 & M2 Integration Ready',
      'Dedicated Account Manager & 24/7 SLA',
      'Priority Support with WhatsApp Direct Line',
      'Data Export & Full Annual Compliance Audit',
    ],
    omittedFeatures: [],
    highlights: [
      'Save ₹10,000 every year',
      'Free Custom Clinic Website Designed & Hosted',
      'Zero downtime priority server allocation',
      'Full annual receipt for business expense claim',
    ],
  },
  {
    id: 'hospital_custom',
    name: 'Hospital Solutions',
    tagline: 'Tailored pricing based on your hospital’s operational and technical requirements',
    targetAudience: 'Hospitals, multi-doctor facilities, and larger healthcare organizations',
    price: null,
    currency: '₹',
    billingFrequency: 'custom quotation',
    secondaryBillingNote: 'Enterprise SLA & dedicated engineering team included.',
    termsDisclosure: 'Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. Contact our enterprise team for a custom quote.',
    ctaText: 'Contact MedTechFixaters',
    isPopular: false,
    isEnterprise: true,
    badge: 'Enterprise Healthcare',
    features: [
      'Digital receptionist for healthcare facilities with multi-counter routing',
      'Hospital-specific QR code access for all departments and entrances',
      'Doctor discovery and appointment booking across departments',
      'AI-assisted patient triage and chatbot with department load-balancing',
      'Live patient queue management with TV display board streaming',
      'Online payment integration with department-wise revenue ledger',
      'Voice receptionist functionality with automated audio token callouts',
      'Separate hospital and doctor dashboards with strict PostgreSQL data isolation',
      'Administrative management tools with role-based access & audit logs',
    ],
    omittedFeatures: [],
    highlights: [
      'Custom Pricing tailored to your scale',
      'Voice receptionist functionality included',
      'Multi-doctor & multi-department architecture',
      'Dedicated hospital onboarding & staff training',
    ],
  },
];

// In-memory cache for live price updates across requests
let cachedLivePlans = null;

export default async function handler(req, res) {
  // Polyfill response methods for local dev & serverless environments
  if (!res.status) {
    res.status = function(code) { res.statusCode = code; return res; };
  }
  if (!res.json) {
    res.json = function(data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
  }

  // Set permissive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Helper to extract bearer token if present
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || ANON_KEY, {
    auth: { persistSession: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  // Handle POST: Update live pricing configuration
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }

      const { plan, plans: postedPlans } = body || {};

      if (!cachedLivePlans) {
        cachedLivePlans = JSON.parse(JSON.stringify(DEFAULT_PLANS));
      }

      if (Array.isArray(postedPlans)) {
        cachedLivePlans = postedPlans;
      } else if (plan && plan.id) {
        const idx = cachedLivePlans.findIndex(p => p.id === plan.id);
        if (idx >= 0) {
          cachedLivePlans[idx] = { ...cachedLivePlans[idx], ...plan };
        } else {
          cachedLivePlans.push(plan);
        }
      }

      // Also try to persist to platform_settings if authorized
      try {
        await client
          .from('platform_settings')
          .upsert([
            {
              key: 'live_pricing',
              value: cachedLivePlans,
              updated_at: new Date().toISOString(),
            },
          ]);
      } catch {
        // Continue even if database RLS skips
      }

      return res.status(200).json({
        success: true,
        source: 'cached_live',
        plans: cachedLivePlans,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. Query published pricing cards ordered by display_order
    const { data: cards, error: cardsErr } = await client
      .from('pricing_cards')
      .select('*')
      .eq('publication_status', 'published')
      .order('display_order', { ascending: true });

    if (!cardsErr && cards && cards.length > 0) {
      // Map database cards to frontend PricingPlan format
      const mappedPlans = cards.map((card) => {
        const isIntro = card.plan_id === 'doctor_intro_500' || card.plan_id === 'plan_trial_500';
        const isYearly = card.plan_id === 'doctor_yearly_50000' || card.plan_id === 'plan_yearly_50000';
        const isEnterprise = card.plan_id === 'hospital_custom' || card.billing_interval === 'custom';

        let billingFrequency = 'per month';
        if (card.billing_interval === 'year') {
          billingFrequency = 'per year';
        } else if (isIntro) {
          billingFrequency = 'for your first month';
        } else if (isEnterprise) {
          billingFrequency = 'custom quotation';
        }

        const price = isEnterprise ? null : Math.round(card.price_today_paise / 100);
        const originalPrice = card.original_price_paise ? Math.round(card.original_price_paise / 100) : undefined;

        // Canonical ID normalization
        const normalizedId = card.plan_id === 'plan_trial_500' ? 'doctor_intro_500' :
                             card.plan_id === 'plan_monthly_5000' ? 'doctor_monthly_5000' :
                             card.plan_id === 'plan_yearly_50000' ? 'doctor_yearly_50000' : card.plan_id;

        return {
          id: normalizedId,
          name: card.display_title || 'Healthcare Practice Plan',
          tagline: card.subtitle || '',
          targetAudience: card.subtitle || 'Individual doctors & clinics',
          price,
          originalPrice,
          discountBadge: card.badge_label || (isIntro ? '90% OFF' : isYearly ? '2 MONTHS FREE' : undefined),
          currency: '₹',
          billingFrequency,
          secondaryBillingNote: card.savings_display || (isIntro ? 'From month two, ₹5,000 per month.' : undefined),
          termsDisclosure: card.terms_disclosure || '',
          ctaText: card.cta_text || (price !== null ? `Get Started for ₹${price.toLocaleString('en-IN')}` : 'Contact MedTechFixaters'),
          isPopular: Boolean(card.highlighted || isIntro),
          isEnterprise,
          badge: card.badge_label || (isIntro ? 'Special Introductory Offer' : isYearly ? 'Best Value (2 Months Free)' : isEnterprise ? 'Enterprise Healthcare' : 'Standard Monthly'),
          features: Array.isArray(card.features) && card.features.length > 0 ? card.features : DEFAULT_PLANS.find(p => p.id === normalizedId)?.features || [],
          omittedFeatures: Array.isArray(card.omitted_features) ? card.omitted_features : [],
          highlights: Array.isArray(card.highlights) && card.highlights.length > 0 ? card.highlights : DEFAULT_PLANS.find(p => p.id === normalizedId)?.highlights || [],
        };
      });

      // Filter deduplicated by id
      const uniquePlans = [];
      const seen = new Set();
      for (const p of mappedPlans) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          uniquePlans.push(p);
        }
      }

      cachedLivePlans = uniquePlans;

      return res.status(200).json({
        success: true,
        source: 'database',
        plans: uniquePlans,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. If database cards query had RLS restrictions or empty, check cached live plans
    if (cachedLivePlans && cachedLivePlans.length > 0) {
      return res.status(200).json({
        success: true,
        source: 'cached_memory',
        plans: cachedLivePlans,
      });
    }

    // 3. Return canonical defaults
    return res.status(200).json({
      success: true,
      source: 'default',
      plans: DEFAULT_PLANS,
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      source: cachedLivePlans ? 'cached_fallback' : 'default_fallback',
      plans: cachedLivePlans || DEFAULT_PLANS,
      error: err.message,
    });
  }
}

