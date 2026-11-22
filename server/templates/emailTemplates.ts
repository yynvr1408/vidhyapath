// Professional Responsive HTML Email Templates for Vidyapath Platform Administration
// Features responsive typography, Vidyapath teal/gold branding, cross-client compatibility

export interface AdminRegistrationEmailData {
  adminName: string;
  adminEmail: string;
  institutionName: string;
  institutionCode: string;
  role: string;
  portalUrl: string;
  tempPassword?: string;
  supportEmail?: string;
}

export interface PasswordResetEmailData {
  adminName: string;
  adminEmail: string;
  resetCode: string;
  expiryMinutes: number;
  portalUrl?: string;
  ipAddress?: string;
  timestamp?: string;
}

export interface PasswordResetSuccessEmailData {
  adminName: string;
  adminEmail: string;
  timestamp: string;
  portalUrl: string;
  ipAddress?: string;
}

// Common styles & brand header
const brandHeaderHtml = `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0F766E; border-top-left-radius: 12px; border-top-right-radius: 12px; padding: 28px 24px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="vertical-align: middle;">
              <div style="background-color: #FFFFFF; width: 44px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; line-height: 44px; text-align: center; margin-bottom: 8px;">
                🎓
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Vidyapath <span style="font-weight: 400; opacity: 0.9; font-size: 18px;">· విద్యాపథ్ · विद्यापथ</span>
              </h1>
              <p style="margin: 4px 0 0; color: #CCFBF1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: 500;">
                The Last-Mile Multilingual Educational Operating System
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const brandFooterHtml = (supportEmail: string = 'support@vidyapath.edu') => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; padding: 24px; margin-top: 24px;">
    <tr>
      <td align="center" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748B; line-height: 18px;">
        <p style="margin: 0 0 8px;">
          This is an automated administrative notification dispatched by <strong>Vidyapath Education System</strong>.
        </p>
        <p style="margin: 0 0 8px;">
          Need assistance? Contact System Administration at <a href="mailto:${supportEmail}" style="color: #0F766E; text-decoration: underline; font-weight: 600;">${supportEmail}</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #94A3B8;">
          © ${new Date().getFullYear()} Vidyapath Foundation. All rights reserved. Zero-PII student architecture & Enterprise Compliance.
        </p>
      </td>
    </tr>
  </table>
`;

// 1. ADMIN REGISTRATION & ONBOARDING TEMPLATE
export const getAdminRegistrationEmail = (data: AdminRegistrationEmailData) => {
  const {
    adminName,
    adminEmail,
    institutionName,
    institutionCode,
    role,
    portalUrl,
    tempPassword,
    supportEmail = 'support@vidyapath.edu',
  } = data;

  const roleLabels: Record<string, string> = {
    super_admin: 'Platform Super Administrator (Level 1)',
    institution_admin: 'Institutional Administrator (Level 2)',
    academic_admin: 'Academic Dean / Curriculum Admin (Level 3)',
    teacher: 'Faculty / Subject Teacher (Level 4)',
    exam_admin: 'Examination Administrator',
  };

  const formattedRole = roleLabels[role] || role;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Vidyapath Admin Portal</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${brandHeaderHtml}
              
              <div style="padding: 32px 28px;">
                <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                  Welcome to Vidyapath Administration, ${adminName}!
                </h2>
                
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #334155;">
                  Your administrative account for <strong>${institutionName}</strong> has been configured. You now have delegated control to oversee academic curriculum, student cohorts, AI tutor parameters, and offline sync packages.
                </p>

                <!-- Institutional Credentials Box -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
                  <tr>
                    <td>
                      <h3 style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #0F766E; text-transform: uppercase; letter-spacing: 0.5px;">
                        Account & Authorization Details
                      </h3>
                      <table role="presentation" width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; color: #1E293B;">
                        <tr>
                          <td style="width: 140px; color: #64748B; font-weight: 500;">Institution:</td>
                          <td style="font-weight: 700;">${institutionName} (${institutionCode})</td>
                        </tr>
                        <tr>
                          <td style="color: #64748B; font-weight: 500;">Assigned Role:</td>
                          <td style="font-weight: 700; color: #0F766E;">${formattedRole}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748B; font-weight: 500;">Admin Email:</td>
                          <td style="font-weight: 600; font-family: monospace;">${adminEmail}</td>
                        </tr>
                        ${tempPassword ? `
                        <tr>
                          <td style="color: #64748B; font-weight: 500;">Temporary Passcode:</td>
                          <td style="font-weight: 700; font-family: monospace; color: #D97706; background-color: #FEF3C7; padding: 2px 8px; border-radius: 4px; display: inline-block;">${tempPassword}</td>
                        </tr>` : ''}
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Primary CTA -->
                <div align="center" style="margin: 28px 0;">
                  <a href="${portalUrl}" style="background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
                    Access Admin Portal &rarr;
                  </a>
                </div>

                <!-- Security Checklist -->
                <div style="background-color: #F0FDFA; border-left: 4px solid #0F766E; padding: 14px 16px; border-radius: 4px; margin-top: 24px;">
                  <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0F766E;">
                    🛡️ Security Directives for Institutional Administrators:
                  </h4>
                  <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #134E4A; line-height: 20px;">
                    <li>Update your temporary passcode immediately upon first sign-in.</li>
                    <li>Student profiles utilize zero-PII mascots and localized safety questions without requiring email or OTP.</li>
                    <li>All administrator actions are logged in the cryptographically hashed audit journal.</li>
                  </ul>
                </div>
              </div>

              ${brandFooterHtml(supportEmail)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
======================================================
VIDYAPATH - WELCOME TO ADMIN PORTAL
======================================================
Hello ${adminName},

Your administrative account for ${institutionName} (${institutionCode}) has been activated.

Assigned Role: ${formattedRole}
Registered Email: ${adminEmail}
${tempPassword ? `Temporary Passcode: ${tempPassword}\n` : ''}
Portal URL: ${portalUrl}

Please access the portal and update your credentials upon first login.
For assistance, contact ${supportEmail}.

© ${new Date().getFullYear()} Vidyapath Educational Ecosystem.
======================================================
  `;

  return { html, text, subject: `[Vidyapath] Welcome to Institutional Admin Portal · ${institutionName}` };
};

// 2. ADMIN PASSWORD RESET REQUEST TEMPLATE
export const getPasswordResetEmail = (data: PasswordResetEmailData) => {
  const {
    adminName,
    adminEmail,
    resetCode,
    expiryMinutes = 15,
    portalUrl = 'https://vidyapath.edu/admin',
    ipAddress = '127.0.0.1',
    timestamp = new Date().toUTCString(),
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Vidyapath Admin Password</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${brandHeaderHtml}
              
              <div style="padding: 32px 28px;">
                <div style="display: inline-block; background-color: #FEF3C7; color: #D97706; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⚠️ Security Action Required
                </div>

                <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                  Admin Password Reset Request
                </h2>
                
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #334155;">
                  Hello <strong>${adminName}</strong>, we received a request to reset the administrator password for <strong>${adminEmail}</strong>.
                </p>

                <!-- Prominent Verification Code Display -->
                <div style="background-color: #F8FAFC; border: 2px dashed #0F766E; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
                  <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
                    Your 6-Digit Password Reset Code
                  </p>
                  <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0F766E; margin: 6px 0;">
                    ${resetCode}
                  </div>
                  <p style="margin: 8px 0 0; font-size: 12px; color: #64748B;">
                    ⏱️ Valid for <strong>${expiryMinutes} minutes</strong>. Do NOT share this code with anyone.
                  </p>
                </div>

                <!-- Action Button -->
                <div align="center" style="margin: 28px 0;">
                  <a href="${portalUrl}" style="background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(15, 118, 110, 0.2);">
                    Open Admin Login to Enter Code &rarr;
                  </a>
                </div>

                <!-- Audit Metadata & Warning -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-top: 24px;">
                  <tr>
                    <td>
                      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #B45309;">
                        Did not request this password reset?
                      </p>
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #78350F;">
                        If you did not initiate this request, someone may be attempting to access your account. Your password remains unchanged. You can safely disregard this email, or alert your Super Administrator immediately.
                      </p>
                      <p style="margin: 8px 0 0; font-size: 11px; color: #92400E; font-family: monospace;">
                        Request IP: ${ipAddress} | Dispatched: ${timestamp}
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              ${brandFooterHtml()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
======================================================
VIDYAPATH - ADMIN PASSWORD RESET REQUEST
======================================================
Hello ${adminName},

We received a request to reset the administrator password for ${adminEmail}.

Your 6-Digit Password Reset Code is:
>>> ${resetCode} <<<

This code is valid for ${expiryMinutes} minutes.
Admin Portal: ${portalUrl}

If you did not request this, please notify your Super Administrator immediately.
Request IP: ${ipAddress} | Timestamp: ${timestamp}

© ${new Date().getFullYear()} Vidyapath Educational Ecosystem.
======================================================
  `;

  return { html, text, subject: `[Vidyapath] Admin Password Reset Code: ${resetCode}` };
};

// 3. ADMIN PASSWORD RESET SUCCESS CONFIRMATION TEMPLATE
export const getPasswordResetSuccessEmail = (data: PasswordResetSuccessEmailData) => {
  const {
    adminName,
    adminEmail,
    timestamp = new Date().toUTCString(),
    portalUrl = 'https://vidyapath.edu/admin',
    ipAddress = '127.0.0.1',
  } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful · Vidyapath Admin</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              ${brandHeaderHtml}
              
              <div style="padding: 32px 28px;">
                <div style="width: 48px; height: 48px; background-color: #DCFCE7; border-radius: 50%; color: #16A34A; font-size: 24px; line-height: 48px; text-align: center; margin-bottom: 16px;">
                  ✓
                </div>

                <h2 style="margin: 0 0 16px; color: #0F172A; font-size: 20px; font-weight: 700;">
                  Admin Password Successfully Changed
                </h2>
                
                <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: #334155;">
                  Hello <strong>${adminName}</strong>, the administrator password associated with <strong>${adminEmail}</strong> was successfully updated on <strong>${timestamp}</strong>.
                </p>

                <div align="center" style="margin: 28px 0;">
                  <a href="${portalUrl}" style="background-color: #0F766E; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; display: inline-block;">
                    Sign In to Admin Portal &rarr;
                  </a>
                </div>

                <div style="background-color: #FEE2E2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px 16px; margin-top: 24px;">
                  <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #991B1B;">
                    Did not authorize this change?
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #7F1D1D; line-height: 18px;">
                    If you did not perform this action, your credentials may be compromised. Immediately notify your organization's Super Administrator and contact support at support@vidyapath.edu.
                  </p>
                  <p style="margin: 6px 0 0; font-size: 11px; color: #991B1B; font-family: monospace;">
                    Device IP: ${ipAddress}
                  </p>
                </div>
              </div>

              ${brandFooterHtml()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
======================================================
VIDYAPATH - PASSWORD RESET CONFIRMATION
======================================================
Hello ${adminName},

The administrator password for ${adminEmail} was successfully changed on ${timestamp}.
Device IP: ${ipAddress}

Sign In: ${portalUrl}

If you did not make this change, please contact support@vidyapath.edu immediately.

© ${new Date().getFullYear()} Vidyapath Educational Ecosystem.
======================================================
  `;

  return { html, text, subject: `[Security Notice] Vidyapath Admin Password Changed Successfully` };
};
