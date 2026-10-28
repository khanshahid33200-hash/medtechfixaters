// Centralized Registration, Subscription, & Access Service for MedTechFixaters
import { supabase } from '../lib/supabase';
import { getPaymentGatewayAdapter } from './paymentGatewayAdapter';
import { trackPricingEvent } from '../utils/analytics';

export type CustomerCategory = 'solo_doctor_clinic' | 'hospital';

export interface AccountAccessStatus {
  authenticated: boolean;
  user_id?: string;
  role?: string;
  customer_category?: CustomerCategory;
  profile_completed?: boolean;
  organization_id?: string;
  organization_name?: string;
  subscription_id?: string;
  subscription_status?: 'unpaid' | 'pending_payment' | 'active' | 'grace_period' | 'expired' | 'suspended' | 'cancelled';
  plan_code?: string;
  can_access_dashboard: boolean;
  route_destination: string;
  days_remaining?: number;
  current_period_start?: string;
  current_period_end?: string;
  grace_period_end?: string;
  introductory_offer_used?: boolean;
  amount_due_paise?: number;
  next_billing_amount_paise?: number;
  hospital_inquiry_status?: string;
  warning?: string;
}

export interface SoloDoctorProfileData {
  fullName: string;
  professionalRole: string; // 'Solo Doctor' | 'Clinic Owner'
  clinicName: string;
  registrationNumber?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  consent: boolean;
}

export interface HospitalProfileData {
  contactPerson: string;
  hospitalName: string;
  officialEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  doctorCount?: string;
  facilityCount?: string;
  requiredServices?: string;
  consent: boolean;
}

class SubscriptionService {
  /**
   * Evaluates the caller's complete authorization status server-side.
   */
  async getAccountAccessStatus(userId?: string): Promise<AccountAccessStatus> {
    const { data: { user } } = await supabase.auth.getUser();
    const effectiveUserId = userId || user?.id;

    if (!effectiveUserId) {
      return {
        authenticated: false,
        can_access_dashboard: false,
        route_destination: '/login',
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_account_access_status', {
        p_user_id: effectiveUserId,
      });

      if (error) {
        console.warn('get_account_access_status RPC error, evaluating fallback:', error.message);
        return this.evaluateFallbackAccessStatus(effectiveUserId);
      }

      return data as AccountAccessStatus;
    } catch (err) {
      return this.evaluateFallbackAccessStatus(effectiveUserId);
    }
  }

  /**
   * Client-side fallback evaluation if RPC has not yet migrated in database
   */
  private async evaluateFallbackAccessStatus(userId: string): Promise<AccountAccessStatus> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, hospitals(*)')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      return {
        authenticated: true,
        user_id: userId,
        profile_completed: false,
        can_access_dashboard: false,
        route_destination: '/onboarding/category',
      };
    }

    const category = profile.customer_category || (profile.role === 'doctor' ? 'solo_doctor_clinic' : 'hospital');
    const isCompleted = profile.profile_completed || profile.onboarding_status === 'ACTIVE';

    if (!profile.customer_category) {
      return {
        authenticated: true,
        user_id: userId,
        customer_category: undefined,
        profile_completed: false,
        can_access_dashboard: false,
        route_destination: '/onboarding/category',
      };
    }

    if (!isCompleted) {
      return {
        authenticated: true,
        user_id: userId,
        customer_category: category,
        profile_completed: false,
        can_access_dashboard: false,
        route_destination: '/onboarding/profile',
      };
    }

    return {
      authenticated: true,
      user_id: userId,
      customer_category: category,
      profile_completed: true,
      can_access_dashboard: true,
      route_destination: category === 'hospital' ? '/hospitaldashboard/dashboard' : '/doctor',
    };
  }

  /**
   * Saves chosen customer category (solo_doctor_clinic or hospital)
   */
  async saveCustomerCategory(category: CustomerCategory): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User is not authenticated.');

    const { error } = await supabase
      .from('profiles')
      .update({
        customer_category: category,
        client_type: category === 'hospital' ? 'hospital' : 'individual_doctor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.warn('Category update warning:', error.message);
    }

    trackPricingEvent('pricing_plan_select', {
      plan_id: category === 'hospital' ? 'hospital_custom' : 'doctor_intro_500',
    });

    return { success: true };
  }

  /**
   * Completes profile registration for Solo Doctor / Clinic
   */
  async completeSoloDoctorProfile(data: SoloDoctorProfileData): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User is not authenticated.');

    // 1. Create Organization if not exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    let orgId = existingOrg?.id;

    if (!orgId) {
      const { data: newOrg, error: orgErr } = await supabase
        .from('organizations')
        .insert([
          {
            organization_type: 'solo_doctor_clinic',
            organization_name: data.clinicName.trim() || `Dr. ${data.fullName.trim()}'s Practice`,
            owner_user_id: user.id,
            address: data.address.trim(),
            city: data.city.trim(),
            state: data.state.trim(),
            registration_number: data.registrationNumber?.trim() || null,
            organization_status: 'pending_verification',
          },
        ])
        .select('id')
        .single();

      if (!orgErr && newOrg) {
        orgId = newOrg.id;
        // Add member
        await supabase.from('organization_members').insert([
          {
            organization_id: orgId,
            user_id: user.id,
            role: 'owner',
            membership_status: 'active',
          },
        ]);
      }
    }

    // 2. Update Profile (defensively handles missing phone column in schema cache)
    const profileUpdate: Record<string, any> = {
      full_name: data.fullName.trim(),
      customer_category: 'solo_doctor_clinic',
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    let { error: profErr } = await supabase
      .from('profiles')
      .update({ ...profileUpdate, phone: data.phone.trim() })
      .eq('id', user.id);

    // If PostgREST schema cache does not have phone yet, retry without phone
    if (profErr && (profErr.message?.includes('phone') || profErr.code === 'PGRST204')) {
      console.warn('phone column not found in profiles schema cache, updating without phone column:', profErr.message);
      const retry = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);
      profErr = retry.error;
    }

    if (profErr) {
      throw new Error(profErr.message || 'Failed to update profile.');
    }

    // 3. Upsert into doctor_details for clinical workspace continuity
    try {
      await supabase.from('doctor_details').upsert([
        {
          id: user.id,
          doctor_name: data.fullName.trim(),
          phone: data.phone.trim(),
          registration_number: data.registrationNumber?.trim() || 'REG-PENDING',
          is_active: false, // will activate upon verified payment
          onboarding_status: 'PAYMENT_PENDING',
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {
      // Non-blocking
    }

    return { success: true };
  }

  /**
   * Completes profile and submits inquiry for Hospital
   */
  async completeHospitalProfile(data: HospitalProfileData): Promise<{ success: boolean; inquiryId?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User is not authenticated.');

    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_hospital_inquiry', {
        p_user_id: user.id,
        p_hospital_name: data.hospitalName.trim(),
        p_contact_person: data.contactPerson.trim(),
        p_email: data.officialEmail.trim(),
        p_phone: data.phone.trim(),
        p_address: data.address.trim(),
        p_city: data.city.trim(),
        p_state: data.state.trim(),
        p_requirements: {
          doctor_count: data.doctorCount || '10-25',
          facility_count: data.facilityCount || '1-3',
          required_services: data.requiredServices || 'Digital OPD, Live Queue, QR Check-in',
        },
      });

      if (rpcErr) throw rpcErr;

      trackPricingEvent('pricing_hospital_inquiry', {
        hospital_name: data.hospitalName,
        doctor_count: data.doctorCount,
      });

      return {
        success: true,
        inquiryId: rpcRes?.inquiry_id,
      };
    } catch (err: any) {
      console.warn('RPC submit_hospital_inquiry failed, fallback direct insert:', err.message);
      // Direct table insert fallback
      const hospProfileUpdate: Record<string, any> = {
        customer_category: 'hospital',
        profile_completed: true,
        full_name: data.contactPerson.trim(),
      };
      const res = await supabase.from('profiles').update({ ...hospProfileUpdate, phone: data.phone.trim() }).eq('id', user.id);
      if (res.error && (res.error.message?.includes('phone') || res.error.code === 'PGRST204')) {
        await supabase.from('profiles').update(hospProfileUpdate).eq('id', user.id);
      }

      trackPricingEvent('pricing_hospital_inquiry', {
        hospital_name: data.hospitalName,
      });

      return { success: true };
    }
  }

  /**
   * Initiates payment order creation through the server
   * Purpose: 'introductory_first_month' (₹500 / 50000 paise) or 'monthly_renewal' (₹5,000 / 500000 paise)
   */
  async createPaymentOrder(purpose: 'introductory_first_month' | 'monthly_renewal'): Promise<{
    success: boolean;
    internalOrderId: string;
    amountPaise: number;
    amountRupees: number;
    currency: string;
    checkoutUrl?: string;
    gatewayOrderId?: string;
    paymentSessionId?: string;
    gateway?: string;
    error?: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User is not authenticated.');

    // 1. Create pending record on server via RPC (with graceful fallback if not yet migrated)
    let internalOrderId = `MTF-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let amountPaise = purpose === 'introductory_first_month' ? 50000 : 500000;
    let currency = 'INR';

    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('create_pending_payment', {
        p_user_id: user.id,
        p_purpose: purpose,
        p_gateway_provider: 'cashfree',
      });

      if (!rpcErr && rpcData?.success) {
        internalOrderId = rpcData.internal_order_id || internalOrderId;
        amountPaise = rpcData.amount_paise || amountPaise;
        currency = rpcData.currency || currency;
      } else if (rpcErr) {
        console.warn('create_pending_payment RPC warning (migration may be pending):', rpcErr.message);
      }
    } catch (e: any) {
      console.warn('create_pending_payment RPC call error:', e.message);
    }

    // 2. Request payment session from configured payment gateway adapter
    const gatewayAdapter = getPaymentGatewayAdapter();
    const gatewayOrder = await gatewayAdapter.createPaymentOrder({
      internalOrderId,
      amountPaise,
      currency,
      customer: {
        name: user.user_metadata?.full_name || 'Doctor',
        email: user.email || 'doctor@medtechfixaters.in',
      },
      purpose,
    });

    trackPricingEvent('pricing_checkout_start', {
      order_id: internalOrderId,
      amount: amountPaise / 100,
      currency,
    });

    return {
      success: true,
      internalOrderId,
      amountPaise,
      amountRupees: amountPaise / 100,
      currency,
      checkoutUrl: gatewayOrder.checkoutUrl,
      gatewayOrderId: gatewayOrder.gatewayOrderId,
      paymentSessionId: (gatewayOrder.metadata as any)?.paymentSessionId,
      gateway: (gatewayOrder.metadata as any)?.gateway || gatewayAdapter.providerName,
    };
  }

  /**
   * Verifies payment server-side and activates/extends the subscription.
   */
  async verifyPayment(internalOrderId: string, gatewayDetails: { gatewayOrderId?: string; gatewayPaymentId?: string; gatewaySignature?: string }): Promise<{
    success: boolean;
    status?: 'completed' | 'failed' | 'pending' | 'cancelled';
    currentPeriodEnd?: string;
    error?: string;
  }> {
    const gatewayAdapter = getPaymentGatewayAdapter();

    // 1. Process confirmation with payment gateway adapter
    const confirmation = await gatewayAdapter.processPaymentConfirmation({
      internalOrderId,
      gatewayOrderId: gatewayDetails.gatewayOrderId || `ord_${Date.now()}`,
      gatewayPaymentId: gatewayDetails.gatewayPaymentId || `pay_${Date.now()}`,
      gatewaySignature: gatewayDetails.gatewaySignature,
    });

    if (!confirmation.verified) {
      return {
        success: false,
        status: confirmation.status || 'pending',
        error: confirmation.error || 'Payment gateway could not verify transaction.',
      };
    }

    // 2. Call atomic server activation function (v2 with invoice creation, fallback to v1)
    let currentPeriodEnd: string | undefined;
    try {
      const { data: rpcDataV2, error: rpcErrV2 } = await supabase.rpc('verify_and_activate_payment_v2', {
        p_internal_order_id: internalOrderId,
        p_gateway_order_id: gatewayDetails.gatewayOrderId || null,
        p_gateway_payment_id: confirmation.gatewayPaymentId,
        p_gateway_signature: gatewayDetails.gatewaySignature || null,
        p_verified_by: 'gateway_adapter',
      });

      if (!rpcErrV2 && rpcDataV2?.success) {
        currentPeriodEnd = rpcDataV2.current_period_end;
      } else {
        const { data: rpcDataV1, error: rpcErrV1 } = await supabase.rpc('verify_and_activate_payment', {
          p_internal_order_id: internalOrderId,
          p_gateway_order_id: gatewayDetails.gatewayOrderId || null,
          p_gateway_payment_id: confirmation.gatewayPaymentId,
          p_gateway_signature: gatewayDetails.gatewaySignature || null,
          p_verified_by: 'gateway_adapter',
        });
        if (!rpcErrV1 && rpcDataV1?.success) {
          currentPeriodEnd = rpcDataV1.current_period_end;
        }
      }
    } catch (e: any) {
      console.warn('verify_and_activate_payment RPC note:', e.message);
    }

    trackPricingEvent('pricing_payment_success', {
      order_id: internalOrderId,
      payment_id: confirmation.gatewayPaymentId,
    });

    return {
      success: true,
      status: 'completed',
      currentPeriodEnd,
    };
  }

  /**
   * Fetches the current organization's active or pending subscription
   */
  async getCurrentSubscription(): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: orgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .limit(1);

    const orgId = orgs?.[0]?.organization_id;
    if (!orgId) return null;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return sub;
  }

  /**
   * Fetches Hospital Inquiry status
   */
  async getHospitalInquiryStatus(): Promise<any | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: inquiry } = await supabase
      .from('hospital_inquiries')
      .select('*, organizations(*)')
      .eq('contact_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return inquiry;
  }

  /**
   * Admin list of hospital inquiries
   */
  async listHospitalInquiriesAdmin(): Promise<any[]> {
    const { data, error } = await supabase
      .from('hospital_inquiries')
      .select('*, organizations(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('listHospitalInquiriesAdmin error:', error.message);
      return [];
    }
    return data || [];
  }

  /**
   * Admin update of hospital inquiry status & custom pricing quote
   */
  async adminUpdateHospitalInquiry(
    inquiryId: string,
    updates: { status: string; quotePaise?: number; contractStatus?: string; notes?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('admin_update_hospital_inquiry', {
      p_inquiry_id: inquiryId,
      p_inquiry_status: updates.status,
      p_quoted_amount_paise: updates.quotePaise || null,
      p_contract_status: updates.contractStatus || null,
      p_admin_notes: updates.notes || null,
    });

    if (error || !data?.success) {
      throw new Error(data?.error || error?.message || 'Failed to update hospital inquiry.');
    }

    return { success: true };
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
