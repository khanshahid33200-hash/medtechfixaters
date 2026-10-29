-- ==============================================================================
-- 11_DYNAMIC_PRICING_AND_SUBSCRIPTIONS.sql
-- MedTechFixaters Platform: Dynamic Pricing, Price Cards, Offers, Coupons,
-- and Subscription Lifecycle Management
--
-- Aligned with PricingPage.tsx and Section 3 of Platform Architecture
-- ==============================================================================

-- 1. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    target_audience TEXT,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('one_time', 'month', 'year', 'custom')),
    duration_days INTEGER NOT NULL DEFAULT 30,
    introductory_price_paise INTEGER NOT NULL DEFAULT 50000,
    recurring_price_paise INTEGER NOT NULL DEFAULT 500000,
    original_price_paise INTEGER NOT NULL DEFAULT 500000,
    is_trial BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Safely drop old restrictive check constraints if they exist
DO $$
BEGIN
    ALTER TABLE public.subscription_plans DROP CONSTRAINT IF EXISTS subscription_plans_billing_interval_check;
    ALTER TABLE public.pricing_cards DROP CONSTRAINT IF EXISTS pricing_cards_billing_interval_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ensure all columns exist even if table pre-existed with older schema
ALTER TABLE public.subscription_plans
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS tagline TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS target_audience TEXT,
    ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month',
    ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 30,
    ADD COLUMN IF NOT EXISTS introductory_price_paise INTEGER DEFAULT 50000,
    ADD COLUMN IF NOT EXISTS recurring_price_paise INTEGER DEFAULT 500000,
    ADD COLUMN IF NOT EXISTS original_price_paise INTEGER DEFAULT 500000,
    ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Re-apply inclusive constraint supporting custom and annual intervals
ALTER TABLE public.subscription_plans
    ADD CONSTRAINT subscription_plans_billing_interval_check
    CHECK (billing_interval IN ('one_time', 'month', 'year', 'custom', 'monthly', 'yearly', 'annual'));

-- 2. PRICING CARDS TABLE (Configurable for public pricing page)
CREATE TABLE IF NOT EXISTS public.pricing_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    display_title TEXT NOT NULL,
    subtitle TEXT,
    badge_label TEXT,
    price_today_paise INTEGER NOT NULL,
    future_recurring_paise INTEGER NOT NULL DEFAULT 0,
    original_price_paise INTEGER NOT NULL,
    billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('one_time', 'month', 'year', 'custom', 'monthly', 'yearly', 'annual')),
    savings_display TEXT,
    terms_disclosure TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    omitted_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
    cta_text TEXT NOT NULL DEFAULT 'Get Started',
    cta_link TEXT NOT NULL DEFAULT '/signup',
    display_order INTEGER NOT NULL DEFAULT 0,
    publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('draft', 'published', 'archived')),
    highlighted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns exist even if pricing_cards pre-existed
ALTER TABLE public.pricing_cards
    ADD COLUMN IF NOT EXISTS plan_id TEXT,
    ADD COLUMN IF NOT EXISTS display_title TEXT,
    ADD COLUMN IF NOT EXISTS subtitle TEXT,
    ADD COLUMN IF NOT EXISTS badge_label TEXT,
    ADD COLUMN IF NOT EXISTS price_today_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS future_recurring_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS original_price_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month',
    ADD COLUMN IF NOT EXISTS savings_display TEXT,
    ADD COLUMN IF NOT EXISTS terms_disclosure TEXT,
    ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS omitted_features JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Get Started',
    ADD COLUMN IF NOT EXISTS cta_link TEXT DEFAULT '/signup',
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'published',
    ADD COLUMN IF NOT EXISTS highlighted BOOLEAN DEFAULT false;

-- Re-apply inclusive constraint on pricing_cards
ALTER TABLE public.pricing_cards
    ADD CONSTRAINT pricing_cards_billing_interval_check
    CHECK (billing_interval IN ('one_time', 'month', 'year', 'custom', 'monthly', 'yearly', 'annual'));

-- 3. PROMOTIONAL OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.promotional_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    applicable_plan_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    max_redemptions INTEGER DEFAULT NULL,
    redemptions_count INTEGER NOT NULL DEFAULT 0,
    per_user_limit INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. COUPON CODES TABLE
CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL, -- e.g. 50 for 50%, or 25000 for ₹250.00
    applicable_plan_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    valid_from TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    valid_until TIMESTAMPTZ,
    max_uses INTEGER DEFAULT NULL,
    times_used INTEGER NOT NULL DEFAULT 0,
    per_user_limit INTEGER NOT NULL DEFAULT 1,
    min_order_value_paise INTEGER NOT NULL DEFAULT 0,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure all columns exist even if coupon_codes pre-existed
ALTER TABLE public.coupon_codes
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage',
    ADD COLUMN IF NOT EXISTS discount_value INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS applicable_plan_ids JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS min_order_value_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. COUPON REDEMPTIONS TABLE (Audit & Limit Tracking)
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES public.coupon_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    discount_amount_paise INTEGER NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. EXTEND EXISTING TABLES SAFELY
DO $$
BEGIN
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_code_check;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.subscriptions
    ADD COLUMN IF NOT EXISTS plan_id TEXT,
    ADD COLUMN IF NOT EXISTS plan_name TEXT,
    ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month',
    ADD COLUMN IF NOT EXISTS renewal_behavior TEXT DEFAULT 'manual_prompt',
    ADD COLUMN IF NOT EXISTS coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS discount_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
    ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT;

ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS plan_id TEXT,
    ADD COLUMN IF NOT EXISTS plan_name TEXT,
    ADD COLUMN IF NOT EXISTS original_amount_paise INTEGER,
    ADD COLUMN IF NOT EXISTS discount_paise INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS coupon_code TEXT,
    ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB DEFAULT '{}'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_cards_published
    ON public.pricing_cards(publication_status, display_order);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code
    ON public.coupon_codes(code) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user
    ON public.coupon_redemptions(coupon_id, user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_lifecycle
    ON public.subscriptions(status, current_period_end, trial_end);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Public read policies (unrestricted for published/active catalog items)
DROP POLICY IF EXISTS "Public can view active plans" ON public.subscription_plans;
CREATE POLICY "Public can view active plans"
    ON public.subscription_plans FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public can view published pricing cards" ON public.pricing_cards;
CREATE POLICY "Public can view published pricing cards"
    ON public.pricing_cards FOR SELECT
    TO anon, authenticated
    USING (publication_status = 'published');

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupon_codes;
CREATE POLICY "Public can view active coupons"
    ON public.coupon_codes FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Super Admin management policies
DROP POLICY IF EXISTS "Super admins manage subscription_plans" ON public.subscription_plans;
CREATE POLICY "Super admins manage subscription_plans"
    ON public.subscription_plans FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage pricing_cards" ON public.pricing_cards;
CREATE POLICY "Super admins manage pricing_cards"
    ON public.pricing_cards FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage promotional_offers" ON public.promotional_offers;
CREATE POLICY "Super admins manage promotional_offers"
    ON public.promotional_offers FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage coupon_codes" ON public.coupon_codes;
CREATE POLICY "Super admins manage coupon_codes"
    ON public.coupon_codes FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins manage coupon_redemptions" ON public.coupon_redemptions;
CREATE POLICY "Super admins manage coupon_redemptions"
    ON public.coupon_redemptions FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Role Grants
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.pricing_cards TO anon, authenticated;
GRANT SELECT ON public.coupon_codes TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;


-- 7. STORED PROCEDURE: VALIDATE AND APPLY COUPON
CREATE OR REPLACE FUNCTION public.validate_and_apply_coupon(
    p_code TEXT,
    p_plan_id TEXT,
    p_order_amount_paise INTEGER,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_clean_code TEXT := UPPER(TRIM(p_code));
    v_now TIMESTAMPTZ := NOW();
    v_user_uses INTEGER := 0;
    v_discount_paise INTEGER := 0;
    v_final_amount_paise INTEGER := p_order_amount_paise;
    v_plan_list JSONB;
BEGIN
    SELECT * INTO v_coupon FROM public.coupon_codes
    WHERE code = v_clean_code;

    IF v_coupon.id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code.');
    END IF;

    IF NOT v_coupon.is_active THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This coupon is no longer active.');
    END IF;

    IF v_coupon.valid_from IS NOT NULL AND v_now < v_coupon.valid_from THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Coupon offer has not started yet.');
    END IF;

    IF v_coupon.valid_until IS NOT NULL AND v_now > v_coupon.valid_until THEN
        RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired.');
    END IF;

    IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Coupon redemption limit has been reached.');
    END IF;

    IF p_order_amount_paise < v_coupon.min_order_value_paise THEN
        RETURN jsonb_build_object('valid', false, 'error',
            'Minimum order value of ₹' || (v_coupon.min_order_value_paise / 100) || ' required for this coupon.');
    END IF;

    -- Plan applicability check
    v_plan_list := v_coupon.applicable_plan_ids;
    IF v_plan_list IS NOT NULL AND jsonb_array_length(v_plan_list) > 0 THEN
        IF NOT (v_plan_list ? p_plan_id) THEN
            RETURN jsonb_build_object('valid', false, 'error', 'This coupon is not applicable to the selected plan.');
        END IF;
    END IF;

    -- Per-user limit check
    IF p_user_id IS NOT NULL AND v_coupon.per_user_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_uses FROM public.coupon_redemptions
        WHERE coupon_id = v_coupon.id AND user_id = p_user_id;

        IF v_user_uses >= v_coupon.per_user_limit THEN
            RETURN jsonb_build_object('valid', false, 'error', 'You have already reached the redemption limit for this coupon.');
        END IF;
    END IF;

    -- Calculate discount
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount_paise := ROUND((p_order_amount_paise * v_coupon.discount_value) / 100.0);
    ELSE
        v_discount_paise := v_coupon.discount_value;
    END IF;

    -- Prevent negative amounts
    IF v_discount_paise > p_order_amount_paise THEN
        v_discount_paise := p_order_amount_paise;
    END IF;

    v_final_amount_paise := p_order_amount_paise - v_discount_paise;

    RETURN jsonb_build_object(
        'valid', true,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'discount_paise', v_discount_paise,
        'original_amount_paise', p_order_amount_paise,
        'final_amount_paise', v_final_amount_paise,
        'is_recurring', v_coupon.is_recurring,
        'message', 'Coupon ' || v_clean_code || ' applied successfully!'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_and_apply_coupon TO anon, authenticated, service_role;

-- 8. STORED PROCEDURE: RECORD COUPON REDEMPTION ATOMICALLY
CREATE OR REPLACE FUNCTION public.record_coupon_redemption(
    p_coupon_id UUID,
    p_user_id UUID,
    p_order_id TEXT,
    p_plan_id TEXT,
    p_discount_amount_paise INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.coupon_redemptions (
        coupon_id, user_id, order_id, plan_id, discount_amount_paise
    ) VALUES (
        p_coupon_id, p_user_id, p_order_id, p_plan_id, p_discount_amount_paise
    );

    UPDATE public.coupon_codes
    SET times_used = times_used + 1,
        updated_at = NOW()
    WHERE id = p_coupon_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_coupon_redemption TO authenticated, service_role;

-- 9. SEED CANONICAL PLANS FROM PRICINGPAGE.TSX
INSERT INTO public.subscription_plans (
    id, name, tagline, description, target_audience,
    billing_interval, duration_days,
    introductory_price_paise, recurring_price_paise, original_price_paise,
    is_trial, is_active
) VALUES
(
    'doctor_intro_500',
    'First Month Special Offer',
    'Save 90% on your first month',
    'Introductory pricing applies to your first month only. From month two, regular ₹5,000 per month applies. No automatic deduction without prior renewal confirmation.',
    'Individual doctors and single-counter outpatient clinics',
    'month',
    30,
    50000,
    500000,
    500000,
    true,
    true
),
(
    'doctor_monthly_5000',
    'Doctor and Clinic Plan',
    'Consistent, monthly digital healthcare management',
    'A monthly subscription for eligible individual doctors and clinics. Billed at ₹5,000 per month. You can review all terms before final checkout.',
    'Individual doctors and clinics seeking regular access to MedTechFixaters',
    'month',
    30,
    500000,
    500000,
    650000,
    false,
    true
),
(
    'doctor_yearly_50000',
    'Yearly Doctor & Clinic Pro',
    'Annual subscription with 2 months free + custom clinic website',
    'Full 12-month license including 2 months free, complimentary custom clinic website build, Google SEO setup, and dedicated account manager.',
    'Individual doctors and polyclinics wanting an online clinic web presence and annual savings',
    'year',
    365,
    5000000,
    5000000,
    6000000,
    false,
    true
),
(
    'hospital_custom',
    'Hospital Solutions',
    'Tailored pricing based on your hospital’s operational and technical requirements',
    'Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. Contact our enterprise team for a custom quote.',
    'Hospitals, multi-doctor facilities, and larger healthcare organizations',
    'custom',
    365,
    0,
    0,
    0,
    false,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tagline = EXCLUDED.tagline,
    description = EXCLUDED.description,
    target_audience = EXCLUDED.target_audience,
    introductory_price_paise = EXCLUDED.introductory_price_paise,
    recurring_price_paise = EXCLUDED.recurring_price_paise,
    original_price_paise = EXCLUDED.original_price_paise,
    is_trial = EXCLUDED.is_trial,
    is_active = EXCLUDED.is_active;

-- Seed Pricing Cards
DELETE FROM public.pricing_cards WHERE plan_id IN ('doctor_intro_500', 'doctor_monthly_5000', 'doctor_yearly_50000', 'hospital_custom');

INSERT INTO public.pricing_cards (
    plan_id, display_title, subtitle, badge_label,
    price_today_paise, future_recurring_paise, original_price_paise,
    billing_interval, savings_display, terms_disclosure, features,
    omitted_features, highlights, cta_text, cta_link, display_order, publication_status, highlighted
) VALUES
(
    'doctor_intro_500',
    'First Month Special Offer',
    'Save 90% on your first month',
    'Special Introductory Offer (90% OFF)',
    50000,
    500000,
    500000,
    'month',
    'Save 90% on your first month',
    'Introductory pricing applies to your first month only. From month two, regular ₹5,000 per month applies. No automatic deduction without prior renewal confirmation.',
    '[
        "Digital receptionist for healthcare facilities",
        "Hospital-specific QR code access for OPD check-in",
        "Doctor discovery and appointment booking",
        "AI-assisted patient triage and chatbot",
        "Live patient queue management with real-time tokens",
        "Online payment integration (UPI, QR & cards)",
        "Separate doctor workspace dashboard with data isolation",
        "Administrative management tools for timings & daily collections"
    ]'::jsonb,
    '[
        "Voice receptionist functionality (Hospital plan only)",
        "Multi-department reception load balancing"
    ]'::jsonb,
    '[
        "₹500 for your first month (Regular price ₹5,000)",
        "Save 90% on your first month",
        "From month two, ₹5,000 per month",
        "Full clinical platform unlocked on day one"
    ]'::jsonb,
    'Get Started for ₹500',
    '/signup?plan=doctor_intro_500',
    1,
    'published',
    true
),
(
    'doctor_monthly_5000',
    'Doctor and Clinic Plan',
    'Consistent, monthly digital healthcare management',
    'Standard Monthly Subscription',
    500000,
    500000,
    650000,
    'month',
    'Standard monthly subscription. Cancel or renew anytime.',
    'A monthly subscription for eligible individual doctors and clinics. Billed at ₹5,000 per month. You can review all terms before final checkout.',
    '[
        "Digital receptionist for healthcare facilities",
        "Hospital-specific QR code access for OPD check-in",
        "Doctor discovery and appointment booking",
        "AI-assisted patient triage and chatbot",
        "Live patient queue management with real-time tokens",
        "Online payment integration (UPI, QR & cards)",
        "Separate doctor workspace dashboard with data isolation",
        "Administrative management tools for timings & daily collections"
    ]'::jsonb,
    '[
        "Voice receptionist functionality (Hospital plan only)",
        "Multi-department reception load balancing"
    ]'::jsonb,
    '[
        "₹5,000 per month",
        "Ongoing monthly access with uninterrupted patient queues",
        "All doctor tools & AI triage included",
        "Direct priority WhatsApp & phone assistance"
    ]'::jsonb,
    'Subscribe Now',
    '/signup?plan=doctor_monthly_5000',
    2,
    'published',
    false
),
(
    'doctor_yearly_50000',
    'Yearly Doctor & Clinic Pro',
    'Full annual subscription with 2 months free + custom website',
    'Best Value (2 Months Free + Free Website)',
    5000000,
    5000000,
    6000000,
    'year',
    'Save ₹10,000/year + Free Custom Clinic Website',
    'Full 12-month license billed annually. Includes free custom clinic website build, Google SEO optimization, ABDM M1/M2 readiness, and dedicated priority support.',
    '[
        "Everything in Monthly Plan Included",
        "2 Months Completely Free (₹10,000 Savings)",
        "FREE Custom Clinic Website & Domain Setup",
        "Google Business Profile & Local SEO Optimization",
        "ABDM M1 & M2 Integration Ready",
        "Dedicated Account Manager & 24/7 SLA"
    ]'::jsonb,
    '[]'::jsonb,
    '[
        "Save ₹10,000 every year",
        "Free Custom Clinic Website Designed & Hosted",
        "Zero downtime priority server allocation",
        "Full annual receipt for business expense claim"
    ]'::jsonb,
    'Get Yearly Plan',
    '/signup?plan=doctor_yearly_50000',
    3,
    'published',
    false
),
(
    'hospital_custom',
    'Hospital Solutions',
    'Tailored pricing based on your hospital’s operational and technical requirements',
    'Enterprise Healthcare',
    0,
    0,
    0,
    'custom',
    'Enterprise SLA & dedicated engineering team included.',
    'Pricing depends on hospital requirements, number of doctors, facilities, deployment needs, and required integrations. Contact our enterprise team for a custom quote.',
    '[
        "Digital receptionist for healthcare facilities with multi-counter routing",
        "Hospital-specific QR code access for all departments and entrances",
        "Doctor discovery and appointment booking across departments",
        "AI-assisted patient triage and chatbot with department load-balancing",
        "Live patient queue management with TV display board streaming",
        "Online payment integration with department-wise revenue ledger",
        "Voice receptionist functionality with automated audio token callouts",
        "Separate hospital and doctor dashboards with strict PostgreSQL data isolation",
        "Administrative management tools with role-based access & audit logs"
    ]'::jsonb,
    '[]'::jsonb,
    '[
        "Custom Pricing tailored to your scale",
        "Voice receptionist functionality included",
        "Multi-doctor & multi-department architecture",
        "Dedicated hospital onboarding & staff training"
    ]'::jsonb,
    'Contact MedTechFixaters',
    '/pricing#contact',
    4,
    'published',
    false
);

-- Seed Default Coupons
INSERT INTO public.coupon_codes (
    code, description, discount_type, discount_value,
    max_uses, per_user_limit, is_active
) VALUES
('CLINIC50', '50% discount on initial activation', 'percentage', 50, 1000, 1, true),
('MEDTECH10', '10% discount on all plans', 'percentage', 10, 5000, 2, true)
ON CONFLICT (code) DO NOTHING;
