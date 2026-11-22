// EmailJS Transactional Email Delivery Service
import { dataStore } from '../db/store.js';
import {
  getAdminRegistrationEmail,
  getPasswordResetEmail,
  getPasswordResetSuccessEmail,
} from '../templates/emailTemplates.js';

export interface EmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  templateParams: Record<string, string | number>;
}

export class EmailService {
  private static serviceId = process.env.EMAILJS_SERVICE_ID || '';
  private static templateId = process.env.EMAILJS_TEMPLATE_ID || '';
  private static publicKey = process.env.EMAILJS_PUBLIC_KEY || '';
  private static privateKey = process.env.EMAILJS_PRIVATE_KEY || '';

  static isConfigured(): boolean {
    return Boolean(this.serviceId && this.templateId && this.publicKey);
  }

  // Generic Email Sender via EmailJS REST API
  static async sendEmail(opts: EmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    const { toEmail, toName, subject, templateParams } = opts;

    // In local dev/testing without credentials, log the email safely
    if (!this.isConfigured()) {
      console.log(`\n======================================================`);
      console.log(`[TRANSACTIONAL EMAIL - SIMULATED (EmailJS not configured)]`);
      console.log(`To: "${toName}" <${toEmail}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Parameters:`, JSON.stringify(templateParams, null, 2));
      console.log(`======================================================\n`);

      dataStore.logAudit({
        category: 'auth',
        action: 'EMAIL_DISPATCH_SIMULATED',
        details: { toEmail, subject, templateParams },
      });

      return { success: true, messageId: 'sim_' + Date.now(), simulated: true };
    }

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Vidyapath-Server/1.0',
        },
        body: JSON.stringify({
          service_id: this.serviceId,
          template_id: this.templateId,
          user_id: this.publicKey,
          accessToken: this.privateKey || undefined,
          template_params: {
            to_name: toName,
            to_email: toEmail,
            subject,
            ...templateParams,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[EmailJS] Delivery error:', response.status, text);
        return { success: false };
      }

      dataStore.logAudit({
        category: 'auth',
        action: 'EMAIL_DISPATCH_SUCCESS',
        details: { toEmail, subject },
      });

      return { success: true, messageId: 'emjs_' + Date.now() };
    } catch (err: any) {
      console.error('[EmailJS] Network dispatch failed:', err.message);
      return { success: false };
    }
  }

  // 1. Send OTP Verification Email
  static async sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
    const purposeLabels: Record<string, string> = {
      registration: 'Account Registration Verification',
      login: 'Two-Factor Authentication Login Code',
      password_reset: 'Password Reset Verification',
      email_verification: 'Email Address Verification',
    };

    const label = purposeLabels[purpose] || 'Verification Code';
    const res = await this.sendEmail({
      toEmail: email,
      toName: email.split('@')[0],
      subject: `[Vidyapath] Your ${label}: ${otp}`,
      templateParams: {
        otp_code: otp,
        purpose_label: label,
        expiry_minutes: 10,
        app_name: 'Vidyapath Educational Ecosystem',
        message: `Your one-time security verification code is ${otp}. This code is valid for 10 minutes and can only be used once. Never share this code with anyone.`,
      },
    });

    return res.success;
  }

  // 2. Send Institution Status Update Email
  static async sendInstitutionStatusEmail(
    email: string,
    institutionName: string,
    status: 'approved' | 'rejected' | 'suspended',
    notes?: string
  ): Promise<boolean> {
    const res = await this.sendEmail({
      toEmail: email,
      toName: institutionName,
      subject: `[Vidyapath] Institution Registration Status: ${status.toUpperCase()}`,
      templateParams: {
        institution_name: institutionName,
        status: status.toUpperCase(),
        notes: notes || (status === 'approved' ? 'Your institution registration has been verified and approved by the Super Administrator. You may now activate your institutional admin portal.' : 'Your request has been reviewed.'),
        portal_url: 'https://vidyapath.edu/login',
      },
    });

    return res.success;
  }

  // 3. Send Teacher Invitation / Subject Assignment Email
  static async sendTeacherInviteEmail(
    email: string,
    teacherName: string,
    institutionName: string,
    departmentName: string,
    tempPassword?: string
  ): Promise<boolean> {
    const res = await this.sendEmail({
      toEmail: email,
      toName: teacherName,
      subject: `[Vidyapath] Faculty Invitation: ${institutionName}`,
      templateParams: {
        teacher_name: teacherName,
        institution_name: institutionName,
        department_name: departmentName,
        temp_password: tempPassword || 'Generated during activation',
        login_url: 'https://vidyapath.edu/login',
        message: `You have been officially invited to join ${institutionName} as a faculty member in ${departmentName}. Access your assigned curriculum, classroom resources, and student engagement tools.`,
      },
    });

    return res.success;
  }

  // 4. Send Security Alert Email
  static async sendSecurityAlertEmail(
    email: string,
    userName: string,
    alertTitle: string,
    ipAddress?: string
  ): Promise<boolean> {
    const res = await this.sendEmail({
      toEmail: email,
      toName: userName,
      subject: `[Vidyapath Security Alert] ${alertTitle}`,
      templateParams: {
        alert_title: alertTitle,
        ip_address: ipAddress || 'Unknown IP',
        timestamp: new Date().toUTCString(),
        message: 'A security-sensitive event occurred on your Vidyapath account. If this was not you, please immediately reset your password and contact institutional administration.',
      },
    });

    return res.success;
  }

  // 5. Send Admin Registration / Onboarding Email with HTML Template
  static async sendAdminRegistrationEmail(
    email: string,
    adminName: string,
    institutionName: string,
    institutionCode: string,
    role: string,
    tempPassword?: string,
    portalUrl: string = 'https://vidyapath.edu/admin'
  ): Promise<boolean> {
    const template = getAdminRegistrationEmail({
      adminName,
      adminEmail: email,
      institutionName,
      institutionCode,
      role,
      portalUrl,
      tempPassword,
    });

    const res = await this.sendEmail({
      toEmail: email,
      toName: adminName,
      subject: template.subject,
      templateParams: {
        admin_name: adminName,
        institution_name: institutionName,
        institution_code: institutionCode,
        assigned_role: role,
        portal_url: portalUrl,
        temp_password: tempPassword || 'Set by administrator',
        html_content: template.html,
        text_content: template.text,
      },
    });

    return res.success;
  }

  // 6. Send Admin Password Reset Request Email with OTP
  static async sendPasswordResetOtpEmail(
    email: string,
    adminName: string,
    otp: string,
    expiryMinutes: number = 15,
    ipAddress?: string,
    portalUrl: string = 'https://vidyapath.edu/admin'
  ): Promise<boolean> {
    const template = getPasswordResetEmail({
      adminName,
      adminEmail: email,
      resetCode: otp,
      expiryMinutes,
      portalUrl,
      ipAddress,
    });

    const res = await this.sendEmail({
      toEmail: email,
      toName: adminName,
      subject: template.subject,
      templateParams: {
        admin_name: adminName,
        reset_code: otp,
        expiry_minutes: expiryMinutes,
        portal_url: portalUrl,
        ip_address: ipAddress || '127.0.0.1',
        html_content: template.html,
        text_content: template.text,
      },
    });

    return res.success;
  }

  // 7. Send Admin Password Reset Success Notification
  static async sendPasswordResetSuccessEmail(
    email: string,
    adminName: string,
    ipAddress?: string,
    portalUrl: string = 'https://vidyapath.edu/admin'
  ): Promise<boolean> {
    const template = getPasswordResetSuccessEmail({
      adminName,
      adminEmail: email,
      timestamp: new Date().toUTCString(),
      portalUrl,
      ipAddress,
    });

    const res = await this.sendEmail({
      toEmail: email,
      toName: adminName,
      subject: template.subject,
      templateParams: {
        admin_name: adminName,
        portal_url: portalUrl,
        ip_address: ipAddress || '127.0.0.1',
        html_content: template.html,
        text_content: template.text,
      },
    });

    return res.success;
  }
}
