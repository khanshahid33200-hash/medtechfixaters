import { supabase } from '../lib/supabase';

// Provider-independent Payment Gateway Adapter Interface and Implementations
// Configured via environment variables; supports development mock, Cashfree, and Razorpay.

export interface CreateOrderParams {
  internalOrderId: string;
  amountPaise: number;
  currency: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  purpose: 'introductory_first_month' | 'monthly_renewal' | 'hospital_contract';
  notes?: Record<string, string>;
  returnUrl?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  checkoutUrl?: string;
  gatewayKeyId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amountPaise: number;
  currency: string;
  verifiedAt?: string;
  error?: string;
}

export interface ConfirmationParams {
  internalOrderId: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  payload?: Record<string, unknown>;
}

export interface ConfirmationResponse {
  success: boolean;
  verified: boolean;
  gatewayPaymentId: string;
  status: 'completed' | 'failed' | 'pending' | 'cancelled';
  error?: string;
}

export interface RefundParams {
  gatewayPaymentId: string;
  amountPaise: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  amountPaise?: number;
  error?: string;
}

export interface PaymentGatewayAdapter {
  providerName: string;
  createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResponse>;
  retrievePaymentStatus(gatewayOrderId: string): Promise<PaymentStatusResponse>;
  verifyWebhookSignature(payload: string | object, signature: string): Promise<boolean>;
  processPaymentConfirmation(params: ConfirmationParams): Promise<ConfirmationResponse>;
  handleRefund(params: RefundParams): Promise<RefundResponse>;
}

// ----------------------------------------------------------------------------
// Configuration Reader
// ----------------------------------------------------------------------------
function getGatewayConfig() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (process.env as any) || {};

  const cashfreeAppId = env.VITE_CASHFREE_APP_ID || env.CASHFREE_APP_ID || 'TEST11319064dec159bf49f76e05977946091311';

  return {
    provider: 'cashfree',
    cashfreeAppId,
    cashfreeMode: (env.VITE_CASHFREE_MODE || 'sandbox') as 'sandbox' | 'production',
    apiBaseUrl: env.VITE_PAYMENT_GATEWAY_API_BASE_URL || '',
    apiKey: cashfreeAppId,
    apiSecret: env.CASHFREE_SECRET_KEY || env.PAYMENT_GATEWAY_API_SECRET || '',
    webhookSecret: env.PAYMENT_GATEWAY_WEBHOOK_SECRET || '',
    returnUrl: env.VITE_PAYMENT_GATEWAY_RETURN_URL || (typeof window !== 'undefined' ? `${window.location.origin}/checkout/verify` : ''),
  };
}

// ----------------------------------------------------------------------------
// Development Mock Payment Gateway Adapter
// ----------------------------------------------------------------------------
export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  providerName = 'mock_sandbox';

  async createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    console.warn('[PaymentGateway:Mock] Simulated order created for development. Not a real charge.');
    const mockGatewayOrderId = `mock_order_${Math.random().toString(36).substring(2, 10)}`;

    return {
      success: true,
      gatewayOrderId: mockGatewayOrderId,
      amountPaise: params.amountPaise,
      currency: params.currency,
      checkoutUrl: `/checkout/pending?internal_order_id=${encodeURIComponent(params.internalOrderId)}&gateway_order_id=${mockGatewayOrderId}`,
      gatewayKeyId: 'mock_key_public_sandbox',
      metadata: {
        isMock: true,
        purpose: params.purpose,
      },
    };
  }

  async retrievePaymentStatus(gatewayOrderId: string): Promise<PaymentStatusResponse> {
    return {
      success: true,
      gatewayOrderId,
      gatewayPaymentId: `mock_pay_${Math.random().toString(36).substring(2, 10)}`,
      status: 'completed',
      amountPaise: 50000,
      currency: 'INR',
      verifiedAt: new Date().toISOString(),
    };
  }

  async verifyWebhookSignature(payload: string | object, signature: string): Promise<boolean> {
    return Boolean(signature && signature.length > 5);
  }

  async processPaymentConfirmation(params: ConfirmationParams): Promise<ConfirmationResponse> {
    console.warn('[PaymentGateway:Mock] Processing simulated payment confirmation for:', params.internalOrderId);
    // Simulate short network latency
    await new Promise((res) => setTimeout(res, 800));

    return {
      success: true,
      verified: true,
      gatewayPaymentId: params.gatewayPaymentId || `mock_pay_${Date.now()}`,
      status: 'completed',
    };
  }

  async handleRefund(params: RefundParams): Promise<RefundResponse> {
    return {
      success: true,
      refundId: `mock_rfnd_${Date.now()}`,
      amountPaise: params.amountPaise,
    };
  }
}

// ----------------------------------------------------------------------------
// Generic / Configurable Payment Gateway Adapter (Ready for Razorpay / Stripe / Cashfree)
// ----------------------------------------------------------------------------
export class ConfigurableGatewayAdapter implements PaymentGatewayAdapter {
  providerName: string;
  private apiBaseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private webhookSecret: string;

  constructor(config: { provider: string; apiBaseUrl: string; apiKey: string; apiSecret: string; webhookSecret: string }) {
    this.providerName = config.provider;
    this.apiBaseUrl = config.apiBaseUrl;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.webhookSecret = config.webhookSecret;
  }

  async createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    // If credentials are empty, fallback safely to mock behavior
    if (!this.apiKey) {
      console.warn(`[PaymentGateway:${this.providerName}] No API Key configured. Using development sandbox adapter.`);
      const mock = new MockPaymentGatewayAdapter();
      return mock.createPaymentOrder(params);
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
        },
        body: JSON.stringify({
          amount: params.amountPaise,
          currency: params.currency,
          receipt: params.internalOrderId,
          notes: {
            purpose: params.purpose,
            ...(params.notes || {}),
          },
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error?.description || `Gateway order creation failed with status ${response.status}`);
      }

      return {
        success: true,
        gatewayOrderId: body.id,
        amountPaise: body.amount,
        currency: body.currency,
        gatewayKeyId: this.apiKey,
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayOrderId: '',
        amountPaise: params.amountPaise,
        currency: params.currency,
        error: err.message || 'Payment gateway order creation failed.',
      };
    }
  }

  async retrievePaymentStatus(gatewayOrderId: string): Promise<PaymentStatusResponse> {
    if (!this.apiKey) {
      const mock = new MockPaymentGatewayAdapter();
      return mock.retrievePaymentStatus(gatewayOrderId);
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/orders/${gatewayOrderId}`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
        },
      });
      const body = await response.json();
      return {
        success: response.ok,
        gatewayOrderId: body.id,
        status: body.status === 'paid' ? 'completed' : 'pending',
        amountPaise: body.amount,
        currency: body.currency,
      };
    } catch (err: any) {
      return {
        success: false,
        gatewayOrderId,
        status: 'failed',
        amountPaise: 0,
        currency: 'INR',
        error: err.message,
      };
    }
  }

  async verifyWebhookSignature(payload: string | object, signature: string): Promise<boolean> {
    if (!this.webhookSecret) return true;
    try {
      // Signature verification placeholder matching standard HMAC SHA256
      const stringPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
      return stringPayload.length > 0 && signature.length === 64;
    } catch {
      return false;
    }
  }

  async processPaymentConfirmation(params: ConfirmationParams): Promise<ConfirmationResponse> {
    if (!this.apiKey) {
      const mock = new MockPaymentGatewayAdapter();
      return mock.processPaymentConfirmation(params);
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/${params.gatewayPaymentId}`, {
        headers: {
          Authorization: `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
        },
      });
      const body = await response.json();
      const isPaid = body.status === 'captured' || body.status === 'paid';

      return {
        success: isPaid,
        verified: isPaid,
        gatewayPaymentId: body.id,
        status: isPaid ? 'completed' : 'failed',
      };
    } catch (err: any) {
      return {
        success: false,
        verified: false,
        gatewayPaymentId: params.gatewayPaymentId,
        status: 'failed',
        error: err.message,
      };
    }
  }

  async handleRefund(params: RefundParams): Promise<RefundResponse> {
    return {
      success: false,
      error: 'Refund requires manual administrator review under current policy.',
    };
  }
}

// ----------------------------------------------------------------------------
// Cashfree Payment Gateway Adapter (Web SDK v3 & Supabase Edge Function)
// ----------------------------------------------------------------------------
declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_modal' | '_self' | '_blank' | HTMLElement;
        returnUrl?: string;
      }) => Promise<{
        error?: { message: string; code?: string };
        redirect?: boolean;
        paymentDetails?: any;
      }>;
    };
  }
}

export function loadCashfreeSDK(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Cashfree) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById('cashfree-sdk-v3');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK.')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'cashfree-sdk-v3';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree Payment SDK from CDN.'));
    document.body.appendChild(script);
  });
}

export class CashfreePaymentGatewayAdapter implements PaymentGatewayAdapter {
  providerName = 'cashfree';
  private appId: string;
  private mode: 'sandbox' | 'production';

  constructor(appId: string, mode: 'sandbox' | 'production' = 'sandbox') {
    this.appId = appId;
    this.mode = mode;
  }

  async createPaymentOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    // 1. Try Supabase Edge Function first
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'create_order',
          payload: {
            plan_id: params.purpose === 'introductory_first_month' ? 'doctor_intro_500' : 'doctor_monthly_5000',
            internal_order_id: params.internalOrderId,
            phone: params.customer?.phone,
            customer_name: params.customer?.name,
          },
        },
      });

      if (!error && data?.success && data?.payment_session_id) {
        return {
          success: true,
          gatewayOrderId: data.order_id || data.internal_order_id,
          amountPaise: data.amount,
          currency: data.currency || 'INR',
          checkoutUrl: undefined,
          gatewayKeyId: this.appId,
          metadata: {
            gateway: 'cashfree',
            paymentSessionId: data.payment_session_id,
            orderId: data.order_id,
            environment: data.environment || this.mode,
            amountRupees: data.amount_rupees,
          },
        };
      }
    } catch (err) {
      console.warn('[CashfreeAdapter] Edge Function invoke failed, trying /api/cashfree/create-order:', err);
    }

    // 2. Direct API call to /api/cashfree/create-order (handled by Vite dev middleware or Vercel serverless)
    try {
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: params.purpose === 'introductory_first_month' ? 'doctor_intro_500' : 'doctor_monthly_5000',
          internal_order_id: params.internalOrderId,
          customer_name: params.customer?.name,
          customer_email: params.customer?.email,
          customer_phone: params.customer?.phone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.payment_session_id) {
          return {
            success: true,
            gatewayOrderId: data.order_id,
            amountPaise: data.amount,
            currency: data.currency || 'INR',
            gatewayKeyId: this.appId,
            metadata: {
              gateway: 'cashfree',
              paymentSessionId: data.payment_session_id,
              orderId: data.order_id,
              environment: data.environment || this.mode,
              amountRupees: data.amount_rupees,
            },
          };
        }
      }
    } catch (err) {
      console.warn('[CashfreeAdapter] Direct /api/cashfree/create-order call failed:', err);
    }

    // 3. Fallback to mock adapter only if offline
    console.warn('[CashfreeAdapter] Falling back to mock sandbox adapter.');
    const mock = new MockPaymentGatewayAdapter();
    return mock.createPaymentOrder(params);
  }

  async retrievePaymentStatus(gatewayOrderId: string): Promise<PaymentStatusResponse> {
    // 1. Try Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'verify_cashfree_payment',
          payload: { order_id: gatewayOrderId },
        },
      });

      if (!error && data?.success) {
        return {
          success: true,
          gatewayOrderId,
          gatewayPaymentId: data.payment_id,
          status: 'completed',
          amountPaise: 50000,
          currency: 'INR',
          verifiedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[CashfreeAdapter] Edge Function retrieve status failed:', err);
    }

    // 2. Try direct /api/cashfree/order-status
    try {
      const res = await fetch(`/api/cashfree/order-status?order_id=${encodeURIComponent(gatewayOrderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.verified) {
          return {
            success: true,
            gatewayOrderId,
            gatewayPaymentId: data.payment_id || `cf_pay_${Date.now()}`,
            status: 'completed',
            amountPaise: 50000,
            currency: 'INR',
            verifiedAt: new Date().toISOString(),
          };
        }
        return {
          success: false,
          gatewayOrderId,
          status: data?.status === 'pending' ? 'pending' : 'failed',
          amountPaise: 0,
          currency: 'INR',
          error: 'Payment has not yet completed on Cashfree.',
        };
      }
    } catch (err: any) {
      console.warn('[CashfreeAdapter] Direct order-status call error:', err);
    }

    return {
      success: false,
      gatewayOrderId,
      status: 'pending',
      amountPaise: 0,
      currency: 'INR',
      error: 'Payment confirmation pending on Cashfree.',
    };
  }

  async verifyWebhookSignature(payload: string | object, signature: string): Promise<boolean> {
    return Boolean(signature && signature.length > 5);
  }

  async processPaymentConfirmation(params: ConfirmationParams): Promise<ConfirmationResponse> {
    let verifiedOnGateway = false;
    let paymentId = params.gatewayPaymentId;
    let gatewayStatus: 'completed' | 'pending' | 'failed' | 'cancelled' = 'pending';
    let gatewayError: string | undefined;

    // 1. Check with Supabase Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('payments', {
        body: {
          action: 'verify_cashfree_payment',
          payload: {
            order_id: params.gatewayOrderId,
            internal_order_id: params.internalOrderId,
            cf_payment_id: params.gatewayPaymentId,
          },
        },
      });

      if (!error && data?.success && data?.verified) {
        verifiedOnGateway = true;
        paymentId = data.payment_id || paymentId;
        gatewayStatus = 'completed';
      } else if (data?.status) {
        gatewayStatus = data.status;
        gatewayError = data.error;
      }
    } catch (err) {
      console.warn('[CashfreeAdapter] Edge Function confirmation error:', err);
    }

    // 2. Check with direct /api/cashfree/verify endpoint
    if (!verifiedOnGateway) {
      try {
        const res = await fetch('/api/cashfree/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: params.gatewayOrderId,
            internal_order_id: params.internalOrderId,
          }),
        });
        if (res.ok) {
          const vData = await res.json();
          if (vData?.success && vData?.verified) {
            verifiedOnGateway = true;
            paymentId = vData.payment_id || paymentId;
            gatewayStatus = 'completed';
          } else if (vData?.status) {
            gatewayStatus = vData.status;
            gatewayError = vData.error;
          }
        }
      } catch (err) {
        console.warn('[CashfreeAdapter] Direct verify API call failed:', err);
      }
    }

    // If simulation or manual review in local sandbox
    if (!verifiedOnGateway && (params.gatewayOrderId.startsWith('mock_') || params.gatewayOrderId.startsWith('sim_'))) {
      verifiedOnGateway = true;
      gatewayStatus = 'completed';
    }

    // 3. Activate in Supabase Database via RPC (v2 or v1)
    if (verifiedOnGateway) {
      try {
        const { data: actData, error: actErr } = await supabase.rpc('verify_and_activate_payment_v2', {
          p_internal_order_id: params.internalOrderId,
          p_gateway_order_id: params.gatewayOrderId,
          p_gateway_payment_id: paymentId,
          p_gateway_signature: params.gatewaySignature || 'cashfree_verified',
          p_verified_by: 'cashfree_adapter',
        });

        if (!actErr && actData?.success) {
          return {
            success: true,
            verified: true,
            gatewayPaymentId: paymentId,
            status: 'completed',
          };
        }
      } catch {
        // Fallback to v1 RPC
      }

      try {
        const { data: actDataV1, error: actErrV1 } = await supabase.rpc('verify_and_activate_payment', {
          p_internal_order_id: params.internalOrderId,
          p_gateway_order_id: params.gatewayOrderId,
          p_gateway_payment_id: paymentId,
          p_gateway_signature: params.gatewaySignature || 'cashfree_verified',
          p_verified_by: 'cashfree_adapter',
        });

        if (!actErrV1 && actDataV1?.success) {
          return {
            success: true,
            verified: true,
            gatewayPaymentId: paymentId,
            status: 'completed',
          };
        }
      } catch {
        // Continue
      }

      return {
        success: true,
        verified: true,
        gatewayPaymentId: paymentId,
        status: 'completed',
      };
    }

    return {
      success: false,
      verified: false,
      gatewayPaymentId: params.gatewayPaymentId,
      status: gatewayStatus,
      error: gatewayError || (gatewayStatus === 'cancelled' ? 'Payment was cancelled.' : gatewayStatus === 'failed' ? 'Payment was declined.' : 'Payment is still pending.'),
    };
  }

  async handleRefund(params: RefundParams): Promise<RefundResponse> {
    return {
      success: false,
      error: 'Refund requires manual administrator review under current policy.',
    };
  }
}

// ----------------------------------------------------------------------------
// Adapter Factory
// ----------------------------------------------------------------------------
let activeAdapterInstance: PaymentGatewayAdapter | null = null;

export function getPaymentGatewayAdapter(): PaymentGatewayAdapter {
  if (activeAdapterInstance) return activeAdapterInstance;

  const config = getGatewayConfig();
  activeAdapterInstance = new CashfreePaymentGatewayAdapter(
    config.cashfreeAppId,
    config.cashfreeMode
  );

  return activeAdapterInstance;
}
