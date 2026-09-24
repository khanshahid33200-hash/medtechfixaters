import { supabase } from './supabase'

// Paid activation is opt-in: set VITE_PAYMENTS_ENABLED=true once the `payments` edge
// function has Razorpay keys, then set platform_settings.payments_required = true.
export const PAYMENTS_ENABLED = import.meta.env.VITE_PAYMENTS_ENABLED === 'true'

interface RazorpaySuccess {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment gateway. Please check your connection.'))
    document.body.appendChild(script)
  })
}

/**
 * Runs Razorpay checkout for a doctor subscription. The order is created and the
 * payment verified server-side (edge function `payments`); the browser only relays
 * Razorpay's signed response. Resolves with the activation result.
 */
export async function payForSubscription(
  planId: 'doctor_monthly' | 'doctor_annual',
  prefill: { name?: string; email?: string; contact?: string }
): Promise<{ success: boolean; qr_token?: string; booking_url?: string; error?: string }> {
  const { data: order, error: orderErr } = await supabase.functions.invoke('payments', {
    body: { action: 'create_order', payload: { plan_id: planId } },
  })
  if (orderErr || !order?.success) throw new Error(order?.error || 'Could not start the payment.')

  await loadCheckoutScript()
  if (!window.Razorpay) throw new Error('Payment gateway unavailable.')

  const paid = await new Promise<RazorpaySuccess>((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: 'MedTech Fixaters',
      description: order.description,
      prefill,
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
    })
    checkout.open()
  })

  const { data: result, error: verifyErr } = await supabase.functions.invoke('payments', {
    body: { action: 'verify_payment', payload: paid },
  })
  if (verifyErr || !result?.success) throw new Error(result?.error || 'Payment could not be verified.')
  return result
}
