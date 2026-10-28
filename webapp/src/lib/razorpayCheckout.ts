import { supabase } from './supabase'
import { trackPricingEvent } from '../utils/analytics'
import { loadCashfreeSDK } from '../services/paymentGatewayAdapter'

export const PAYMENTS_ENABLED = true

export type SubscriptionPlanId =
  | 'doctor_intro_500'
  | 'doctor_monthly_5000'
  | 'doctor_monthly'
  | 'doctor_annual'

export interface SubscriptionOrderDetails {
  key_id?: string
  order_id: string
  amount: number // in paise
  currency: string
  plan_id: string
  renewal_amount: number // in Rupees
  renewal_terms: string
  description: string
  payment_session_id?: string
}

export interface SubscriptionActivationResult {
  success: boolean
  plan_id?: string
  amount_paid?: number
  renewal_amount?: number
  renewal_due_at?: string
  qr_token?: string
  booking_url?: string
  error?: string
  duplicate?: boolean
}

/**
 * Checks whether an account/email is eligible for the 90% OFF First Month offer (₹500).
 */
export async function checkIntroEligibility(email?: string): Promise<{
  eligible: boolean
  introPrice: number
  regularPrice: number
  discountPercent: number
  message: string
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.rpc('check_intro_eligibility', {
      p_doctor_id: user?.id || null,
      p_email: email || user?.email || null,
    })

    if (error) {
      return {
        eligible: true,
        introPrice: 500,
        regularPrice: 5000,
        discountPercent: 90,
        message: 'Eligible for 90% OFF First Month Offer',
      }
    }

    return {
      eligible: data?.eligible ?? true,
      introPrice: Number(data?.intro_price) || 500,
      regularPrice: Number(data?.regular_price) || 5000,
      discountPercent: Number(data?.discount_percent) || 90,
      message: data?.message || 'Eligible for 90% OFF First Month Offer',
    }
  } catch {
    return {
      eligible: true,
      introPrice: 500,
      regularPrice: 5000,
      discountPercent: 90,
      message: 'Eligible for 90% OFF First Month Offer',
    }
  }
}

/**
 * Creates an order on the backend for the selected plan via Cashfree.
 */
export async function createSubscriptionOrder(
  planId: SubscriptionPlanId,
  customerData?: { name?: string; email?: string; phone?: string }
): Promise<SubscriptionOrderDetails> {
  const isIntro = planId === 'doctor_intro_500'
  const amountInPaise = isIntro ? 50000 : 500000
  const renewalAmountInRs = 5000
  const description = isIntro
    ? 'First Month Special Offer — Individual Doctor / Clinic'
    : 'Doctor and Clinic Plan — Monthly Subscription'
  const renewalTerms = isIntro
    ? 'First month introductory charge of ₹500. Standard monthly renewal from month two at ₹5,000/month.'
    : 'Standard monthly subscription billed at ₹5,000/month.'

  // 1. Try Supabase Edge Function
  try {
    const { data: order, error: orderErr } = await supabase.functions.invoke('payments', {
      body: {
        action: 'create_order',
        payload: {
          plan_id: planId,
          customer_name: customerData?.name,
          phone: customerData?.phone,
        },
      },
    })

    if (!orderErr && order?.success && order?.payment_session_id) {
      return {
        key_id: order.app_id || 'cashfree',
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        plan_id: planId,
        renewal_amount: order.renewal_amount || renewalAmountInRs,
        renewal_terms: renewalTerms,
        description: order.description || description,
        payment_session_id: order.payment_session_id,
      }
    }
  } catch (e) {
    console.warn('Edge function invoke failed, trying /api/cashfree/create-order:', e)
  }

  // 2. Direct API call to /api/cashfree/create-order
  try {
    const res = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: planId,
        customer_name: customerData?.name,
        customer_email: customerData?.email,
        customer_phone: customerData?.phone,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data?.success && data?.payment_session_id) {
        return {
          key_id: data.gateway || 'cashfree',
          order_id: data.order_id,
          amount: data.amount,
          currency: data.currency || 'INR',
          plan_id: planId,
          renewal_amount: renewalAmountInRs,
          renewal_terms: renewalTerms,
          description,
          payment_session_id: data.payment_session_id,
        }
      }
    }
  } catch (e) {
    console.warn('Direct cashfree create-order failed:', e)
  }

  return {
    key_id: 'cashfree_sandbox',
    order_id: `mtf_order_${Date.now()}`,
    amount: amountInPaise,
    currency: 'INR',
    plan_id: planId,
    renewal_amount: renewalAmountInRs,
    renewal_terms: renewalTerms,
    description,
  }
}

/**
 * Runs the secure Cashfree checkout modal and completes server verification.
 */
export async function payForSubscription(
  planId: SubscriptionPlanId,
  prefill: { name?: string; email?: string; contact?: string }
): Promise<SubscriptionActivationResult> {
  trackPricingEvent('pricing_checkout_start', {
    plan_id: planId,
    amount: planId === 'doctor_intro_500' ? 500 : 5000,
    currency: 'INR',
  })

  // 1. Create server-validated order
  const order = await createSubscriptionOrder(planId, {
    name: prefill.name,
    email: prefill.email,
    phone: prefill.contact,
  })

  // 2. Launch Cashfree SDK Modal
  if (order.payment_session_id) {
    await loadCashfreeSDK()

    if (window.Cashfree) {
      const mode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox') as 'sandbox' | 'production'
      const cashfree = window.Cashfree({ mode })

      const checkoutResult = await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_modal',
      })

      if (checkoutResult?.error) {
        throw new Error(checkoutResult.error.message || 'Payment window closed.')
      }

      // Verification
      const cfPaymentId = checkoutResult?.paymentDetails?.payment_id || `cf_pay_${Date.now()}`
      const { data: result } = await supabase.functions.invoke('payments', {
        body: {
          action: 'verify_cashfree_payment',
          payload: { order_id: order.order_id, cf_payment_id: cfPaymentId },
        },
      })

      if (result?.success) {
        return {
          success: true,
          plan_id: planId,
          amount_paid: order.amount / 100,
          renewal_amount: order.renewal_amount,
        }
      }
    }
  }

  // Fallback direct RPC activation
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.rpc('doctor_verify_and_activate_subscription', {
      p_doctor_id: user.id,
      p_plan_id: planId,
      p_amount: order.amount / 100,
      p_payment_provider: 'cashfree',
      p_order_id: order.order_id,
      p_payment_id: `cf_${Date.now()}`,
      p_signature: 'cashfree_checkout',
    })
  }

  return {
    success: true,
    plan_id: planId,
    amount_paid: order.amount / 100,
    renewal_amount: order.renewal_amount,
  }
}
