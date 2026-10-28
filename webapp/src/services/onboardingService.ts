// Onboarding Service for MedTechFixaters
// Handles persistent onboarding steps, schedules, consultation fees, invoices & support tickets
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

export type AccountType = 'individual_doctor' | 'clinic' | 'hospital';
export type OnboardingStep =
  | 'basic_details'
  | 'organization'
  | 'availability'
  | 'consultation_fees'
  | 'review'
  | 'payment'
  | 'completed';

export interface DayScheduleInterval {
  start_time: string; // e.g. "09:00"
  end_time: string;   // e.g. "13:00"
}

export interface DaySchedule {
  day_of_week: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  is_enabled: boolean;
  intervals: DayScheduleInterval[];
}

export interface ConsultationFeeData {
  consultation_type: 'in_person' | 'online' | 'both';
  amount_inr: number; // e.g. 500
  duration_minutes: number; // e.g. 15
}

export interface OnboardingState {
  account_type: AccountType;
  current_step: OnboardingStep;
  basic_details: {
    full_name: string;
    email: string;
    phone: string;
    role: string;
    profile_photo_url?: string;
  };
  organization_details: {
    name: string;
    doctor_title?: string;
    registration_number?: string;
    specialization?: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    contact_phone?: string;
    contact_email?: string;
    authorized_admin?: string;
  };
  schedules: DaySchedule[];
  consultation_fees: ConsultationFeeData;
}

export interface InvoiceData {
  id: string;
  invoice_number: string;
  amount_paise: number;
  currency: string;
  merchant_details: {
    legal_name: string;
    trade_name: string;
    support_email: string;
    support_phone: string;
    website: string;
    address: string;
    hsn_sac: string;
  };
  customer_details: {
    name: string;
    email: string;
    phone: string;
    clinic_name: string;
    address: string;
    city: string;
    state: string;
  };
  item_description: string;
  invoice_date: string;
  invoice_status: string;
}

export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day_of_week: 'Mon', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '13:00' }, { start_time: '17:00', end_time: '21:00' }] },
  { day_of_week: 'Tue', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '13:00' }, { start_time: '17:00', end_time: '21:00' }] },
  { day_of_week: 'Wed', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '13:00' }, { start_time: '17:00', end_time: '21:00' }] },
  { day_of_week: 'Thu', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '13:00' }, { start_time: '17:00', end_time: '21:00' }] },
  { day_of_week: 'Fri', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '13:00' }, { start_time: '17:00', end_time: '21:00' }] },
  { day_of_week: 'Sat', is_enabled: true, intervals: [{ start_time: '09:00', end_time: '14:00' }] },
  { day_of_week: 'Sun', is_enabled: false, intervals: [{ start_time: '10:00', end_time: '13:00' }] },
];

class OnboardingService {
  /**
   * Fetches the user's current onboarding status from Supabase
   */
  async getStatus(): Promise<{
    authenticated: boolean;
    user_id?: string;
    is_complete: boolean;
    can_access_dashboard: boolean;
    route_destination: string;
    current_step?: OnboardingStep;
    account_type?: AccountType;
    onboarding_status?: string;
    step_data?: any;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        authenticated: false,
        is_complete: false,
        can_access_dashboard: false,
        route_destination: '/login',
      };
    }

    try {
      const { data, error } = await supabase.rpc('get_onboarding_status', {
        p_user_id: user.id,
      });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('get_onboarding_status RPC error, evaluating fallback:', err);
    }

    // Direct table query fallback
    try {
      const { data: obRecord } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (obRecord) {
        return {
          authenticated: true,
          user_id: user.id,
          is_complete: obRecord.onboarding_status === 'completed',
          can_access_dashboard: obRecord.onboarding_status === 'completed',
          current_step: obRecord.current_step,
          account_type: obRecord.account_type,
          onboarding_status: obRecord.onboarding_status,
          step_data: obRecord.step_data,
          route_destination: this.mapStepToRoute(obRecord.current_step, obRecord.onboarding_status),
        };
      }
    } catch {
      // Ignore
    }

    // New user default
    return {
      authenticated: true,
      user_id: user.id,
      is_complete: false,
      can_access_dashboard: false,
      current_step: 'basic_details',
      account_type: 'individual_doctor',
      onboarding_status: 'in_progress',
      route_destination: '/onboarding/basic-details',
    };
  }

  /**
   * Saves progress for any individual onboarding step
   */
  async saveStep(step: OnboardingStep, accountType: AccountType, stepData: Record<string, any>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    try {
      const { error } = await supabase.rpc('save_onboarding_step', {
        p_user_id: user.id,
        p_step: step,
        p_account_type: accountType,
        p_step_data: stepData,
      });

      if (error) {
        // Fallback direct upsert into onboarding_profiles
        await supabase.from('onboarding_profiles').upsert(
          {
            user_id: user.id,
            account_type: accountType,
            current_step: step,
            step_data: stepData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
      return true;
    } catch (err) {
      console.error('Error saving onboarding step:', err);
      return false;
    }
  }

  /**
   * Persists the doctor's weekly schedules in Supabase
   */
  async saveSchedules(schedules: DaySchedule[]): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    try {
      // Delete previous schedule records for doctor to ensure clean sync
      await supabase.from('doctor_schedules').delete().eq('doctor_id', user.id);

      const rows: any[] = [];
      for (const day of schedules) {
        if (!day.is_enabled) continue;
        for (const interval of day.intervals) {
          if (interval.start_time && interval.end_time && interval.start_time < interval.end_time) {
            rows.push({
              doctor_id: user.id,
              day_of_week: day.day_of_week,
              start_time: interval.start_time,
              end_time: interval.end_time,
              timezone: 'Asia/Kolkata',
              is_enabled: true,
            });
          }
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from('doctor_schedules').insert(rows);
        if (error) console.warn('doctor_schedules insert error:', error.message);
      }

      // Also save working hours to legacy doctor_working_hours for backward compatibility
      const firstEnabledDay = schedules.find((d) => d.is_enabled && d.intervals.length > 0);
      if (firstEnabledDay) {
        const morning = firstEnabledDay.intervals[0];
        const evening = firstEnabledDay.intervals[1];
        await supabase.from('doctor_working_hours').upsert(
          {
            doctor_id: user.id,
            hospital_id: user.id, // self or hospital
            morning_start: morning ? `${morning.start_time}:00` : '09:00:00',
            morning_end: morning ? `${morning.end_time}:00` : '13:00:00',
            evening_start: evening ? `${evening.start_time}:00` : '17:00:00',
            evening_end: evening ? `${evening.end_time}:00` : '21:00:00',
          },
          { onConflict: 'doctor_id' }
        );
      }

      return true;
    } catch (err) {
      console.warn('saveSchedules error:', err);
      return false;
    }
  }

  /**
   * Persists consultation fees in Supabase
   */
  async saveConsultationFees(feeData: ConsultationFeeData): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    try {
      const amountPaise = Math.round(Number(feeData.amount_inr || 500) * 100);

      await supabase.from('consultation_fees').upsert(
        {
          doctor_id: user.id,
          consultation_type: feeData.consultation_type || 'both',
          amount_paise: amountPaise,
          currency: 'INR',
          duration_minutes: Number(feeData.duration_minutes || 15),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'doctor_id' }
      );

      // Also update doctor_details consultation_fee
      await supabase.from('doctor_details').update({
        consultation_fee: feeData.amount_inr,
        slot_duration: feeData.duration_minutes,
      }).eq('id', user.id);

      return true;
    } catch (err) {
      console.warn('saveConsultationFees error:', err);
      return false;
    }
  }

  /**
   * Completes the onboarding profile review and transitions to payment pending
   */
  async completeProfile(): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    try {
      const { data, error } = await supabase.rpc('complete_onboarding_profile', {
        p_user_id: user.id,
      });

      if (error) {
        // Fallback update
        await supabase.from('profiles').update({
          profile_completed: true,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);

        await supabase.from('onboarding_profiles').update({
          current_step: 'payment',
          onboarding_status: 'pending_payment',
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to complete profile.' };
    }
  }

  /**
   * Submits a customer care ticket for payment debit/delay reconciliation
   */
  async submitSupportTicket(params: {
    orderId?: string;
    providerPaymentId?: string;
    category: string;
    description: string;
    contactPhone: string;
    contactEmail: string;
  }): Promise<{ success: boolean; ticketNumber?: string; message?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated.');

    try {
      const { data, error } = await supabase.rpc('create_payment_support_ticket', {
        p_user_id: user.id,
        p_order_id: params.orderId || null,
        p_provider_payment_id: params.providerPaymentId || null,
        p_category: params.category,
        p_description: params.description,
        p_email: params.contactEmail,
        p_phone: params.contactPhone,
      });

      if (error) throw error;
      return {
        success: true,
        ticketNumber: data.ticket_number,
        message: data.message,
      };
    } catch (err: any) {
      // Direct table insert fallback
      const ticketNum = `MTF-TKT-${Date.now().toString().slice(-6)}`;
      await supabase.from('payment_support_tickets').insert([
        {
          ticket_number: ticketNum,
          user_id: user.id,
          payment_order_id: params.orderId,
          provider_payment_id: params.providerPaymentId,
          issue_category: params.category,
          customer_description: params.description,
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
        },
      ]);
      return {
        success: true,
        ticketNumber: ticketNum,
        message: 'Support ticket registered. Our priority billing desk will contact you within 2 hours.',
      };
    }
  }

  /**
   * Fetches latest invoice for current user or by order/payment ID
   */
  async getLatestInvoice(orderId?: string): Promise<InvoiceData | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data, error } = await query.maybeSingle();
      if (!error && data) return data as InvoiceData;
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Generates and triggers download of official PDF Tax Invoice
   */
  generateInvoicePdf(invoice: Partial<InvoiceData> & { orderId?: string }) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [255, 106, 0]; // MedTech Orange
    const darkColor = [23, 23, 23];

    // Company Header
    doc.setFillColor(255, 247, 240);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDTECHFIXATERS', 15, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('MedTechFixaters Healthcare Technologies Pvt Ltd', 15, 27);
    doc.text('Healthcare Innovation Hub, Bengaluru, Karnataka, India', 15, 32);
    doc.text('Email: support@medtechfixaters.in | Web: www.medtechfixaters.in', 15, 37);

    // Invoice Title & Status Badge
    doc.setFontSize(16);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', 140, 20);

    doc.setFillColor(220, 252, 231);
    doc.roundedRect(140, 25, 45, 8, 2, 2, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID & ACTIVE', 147, 30.5);

    // Metadata Row
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    const invNo = invoice.invoice_number || `MTF-INV-${new Date().getFullYear()}-001`;
    const dateStr = invoice.invoice_date
      ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.text(`Invoice No: ${invNo}`, 15, 58);
    doc.text(`Invoice Date: ${dateStr}`, 15, 64);
    doc.text(`Internal Order ID: ${invoice.orderId || 'MTF-ORD-2026'}`, 15, 70);
    doc.text('Place of Supply: Karnataka (29)', 15, 76);

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('BILLED TO (CUSTOMER):', 120, 58);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const cust = invoice.customer_details || {} as any;
    doc.text(`${cust.name || 'Healthcare Practitioner'}`, 120, 64);
    doc.text(`${cust.clinic_name || 'Clinic / Practice'}`, 120, 70);
    doc.text(`${cust.city || 'India'} ${cust.state ? ', ' + cust.state : ''}`, 120, 76);
    doc.text(`Email: ${cust.email || 'Registered User'}`, 120, 82);

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 95, 180, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('DESCRIPTION', 20, 101);
    doc.text('HSN/SAC', 110, 101);
    doc.text('QTY', 145, 101);
    doc.text('AMOUNT (INR)', 165, 101);

    // Table Row
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('MedTechFixaters Platform Activation — First Month', 20, 115);
    doc.text('998313', 110, 115);
    doc.text('1', 148, 115);
    doc.text('₹500.00', 168, 115);

    // Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 125, 195, 125);

    // Totals Section
    doc.setFont('helvetica', 'normal');
    doc.text('Taxable Amount:', 130, 135);
    doc.text('₹423.73', 172, 135);
    doc.text('Integrated GST (18%):', 130, 142);
    doc.text('₹76.27', 174, 142);

    doc.setFillColor(255, 247, 240);
    doc.rect(125, 148, 70, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TOTAL PAID:', 130, 156);
    doc.text('₹500.00', 170, 156);

    // Footer & Terms
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Terms & Conditions:', 15, 220);
    doc.text('1. This invoice confirms 1 month of full platform access to MedTechFixaters.', 15, 225);
    doc.text('2. Subsequent monthly renewal rate is ₹5,000/mo. Subscriptions can be modified or cancelled anytime.', 15, 230);
    doc.text('3. For questions, contact priority billing support at support@medtechfixaters.in.', 15, 235);

    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated invoice and does not require a physical signature.', 15, 260);

    // Save PDF
    doc.save(`MedTechFixaters_Invoice_${invNo}.pdf`);
  }

  private mapStepToRoute(step: OnboardingStep, status?: string): string {
    if (status === 'completed') return '/dashboard';
    if (status === 'pending_payment') return '/onboarding/payment';
    switch (step) {
      case 'organization':
        return '/onboarding/organization';
      case 'availability':
        return '/onboarding/availability';
      case 'consultation_fees':
        return '/onboarding/consultation-fees';
      case 'review':
        return '/onboarding/review';
      case 'payment':
        return '/onboarding/payment';
      default:
        return '/onboarding/basic-details';
    }
  }
}

export const onboardingService = new OnboardingService();
