// Client-side helper service for interacting with Nodemailer SMTP backend

export interface SmtpStatusResponse {
  configured: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  from: string | null;
  user: string | null;
  hasAuth: boolean;
}

export interface SendEmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

export interface SendReminderPayload {
  to: string;
  customerName: string;
  drillQuarter?: string;
  drillType?: string;
  dueDate?: string;
  csmName?: string;
  customNote?: string;
  isOverdue?: boolean;
}

/**
 * Fetch current SMTP configuration status from the backend server
 */
export async function getSmtpStatus(): Promise<SmtpStatusResponse> {
  try {
    const res = await fetch('/api/email/status');
    if (!res.ok) {
      throw new Error(`Status check failed: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching SMTP status:', error);
    return {
      configured: false,
      host: null,
      port: 587,
      secure: false,
      from: null,
      user: null,
      hasAuth: false,
    };
  }
}

/**
 * Test SMTP server credentials and connectivity
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error connecting to backend email service.',
    };
  }
}

/**
 * Send a generic custom email
 */
export async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to dispatch email.',
    };
  }
}

/**
 * Send a styled phishing simulation drill / review reminder notice
 */
export async function sendDrillReminderEmail(payload: SendReminderPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch('/api/email/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to dispatch reminder email.',
    };
  }
}
