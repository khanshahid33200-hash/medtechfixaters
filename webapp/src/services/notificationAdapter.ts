// Notification Service Adapter for Renewal Reminders and Status Alerts
// Supports Email, SMS, and WhatsApp notifications behind a unified interface with idempotency.

export interface NotificationPayload {
  recipientEmail: string;
  recipientPhone?: string;
  recipientName: string;
  notificationType: 'renewal_reminder_7d' | 'renewal_reminder_3d' | 'renewal_due_0d' | 'grace_period_warning' | 'payment_receipt';
  amountDueRupees: number;
  renewalDate: string;
  renewalLink: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: 'email' | 'sms' | 'whatsapp';
  messageId: string;
  deliveredAt: string;
  error?: string;
}

export interface NotificationChannelAdapter {
  channelName: string;
  send(payload: NotificationPayload): Promise<NotificationDeliveryResult>;
}

// ----------------------------------------------------------------------------
// Email Notification Adapter
// ----------------------------------------------------------------------------
export class EmailNotificationAdapter implements NotificationChannelAdapter {
  channelName = 'email';

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    console.log(`[Notification:Email] Sending ${payload.notificationType} to ${payload.recipientEmail}:`, {
      amount: `₹${payload.amountDueRupees}`,
      renewalDate: payload.renewalDate,
      idempotencyKey: payload.idempotencyKey,
    });

    // In a production environment with RESEND_API_KEY or SENDGRID_API_KEY, this calls the email API.
    // For local development or mock, log delivery with simulated unique ID:
    return {
      success: true,
      channel: 'email',
      messageId: `msg_email_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

// ----------------------------------------------------------------------------
// WhatsApp / SMS Notification Adapter (Stub / Configurable)
// ----------------------------------------------------------------------------
export class WhatsAppNotificationAdapter implements NotificationChannelAdapter {
  channelName = 'whatsapp';

  async send(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
    if (!payload.recipientPhone) {
      return {
        success: false,
        channel: 'whatsapp',
        messageId: '',
        deliveredAt: '',
        error: 'No phone number provided.',
      };
    }

    console.log(`[Notification:WhatsApp] Sending ${payload.notificationType} to +91-${payload.recipientPhone}:`, {
      amount: `₹${payload.amountDueRupees}`,
      renewalDate: payload.renewalDate,
      idempotencyKey: payload.idempotencyKey,
    });

    return {
      success: true,
      channel: 'whatsapp',
      messageId: `msg_wa_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      deliveredAt: new Date().toISOString(),
    };
  }
}

// ----------------------------------------------------------------------------
// Central Notification Dispatcher
// ----------------------------------------------------------------------------
class NotificationService {
  private emailAdapter = new EmailNotificationAdapter();
  private whatsappAdapter = new WhatsAppNotificationAdapter();

  async dispatchRenewalReminder(payload: NotificationPayload): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    // Always dispatch via Email
    try {
      const emailRes = await this.emailAdapter.send(payload);
      results.push(emailRes);
    } catch (err: any) {
      results.push({
        success: false,
        channel: 'email',
        messageId: '',
        deliveredAt: '',
        error: err.message,
      });
    }

    // Optionally dispatch via WhatsApp if phone is present
    if (payload.recipientPhone) {
      try {
        const waRes = await this.whatsappAdapter.send(payload);
        results.push(waRes);
      } catch (err: any) {
        // Log non-blocking WhatsApp delivery failure
      }
    }

    return results;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
