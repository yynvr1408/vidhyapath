# Vidyapath — EmailJS Configuration & 3-Template Architecture

**Constraint:** Exactly THREE EmailJS templates for all platform transactional messaging.

---

## 1. Environment Variable Configuration

Add the following keys to your deployment environment (Render, Netlify, or `.env`):

```bash
# EmailJS Master Account Credentials
EMAILJS_SERVICE_ID=service_vidyapath
EMAILJS_PUBLIC_KEY=user_pub_xxxxxxxxxxxxxx
EMAILJS_PRIVATE_KEY=key_priv_xxxxxxxxxxxxx

# Exactly 3 Consolidated Templates
EMAILJS_TEMPLATE_VERIFICATION=template_verification_v1
EMAILJS_TEMPLATE_PASSWORD_RESET=template_reset_v1
EMAILJS_TEMPLATE_NOTIFICATION=template_notification_v1
```

*Note:* When `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_VERIFICATION`, or `EMAILJS_PUBLIC_KEY` are not set, Vidyapath activates **Development Mode** where emails and OTPs are safely logged to standard output and persisted to the audit log without crashing.

---

## 2. Template Specifications

### Template 1: Account Verification (`EMAILJS_TEMPLATE_VERIFICATION`)
- **Subject:** `Vidyapath — Verify Your Email Address`
- **Use Cases:** Student registration, Parent registration, Family registration, Teacher registration, Institution Admin registration, Email change verification.
- **Dynamic Parameters:**
  - `to_email`: Recipient email address
  - `to_name`: Recipient full name
  - `otp_code`: 6-digit numeric OTP code
  - `verification_purpose`: Contextual label (e.g. `Account Registration Verification`)
  - `expiry_minutes`: `5` (or `10`)
  - `platform_name`: `Vidyapath Educational Ecosystem`
  - `support_email`: `support@vidyapath.edu`

### Template 2: Password Recovery (`EMAILJS_TEMPLATE_PASSWORD_RESET`)
- **Subject:** `Vidyapath — Password Reset Verification`
- **Use Cases:** Forgot password, Admin passcode reset, Account recovery.
- **Dynamic Parameters:**
  - `to_email`: Recipient email address
  - `to_name`: Administrator / user full name
  - `otp_code`: 6-digit numeric reset OTP
  - `expiry_minutes`: `15`
  - `platform_name`: `Vidyapath Educational Ecosystem`
  - `support_email`: `support@vidyapath.edu`
  - `ip_address`: Requester IP address for audit transparency

### Template 3: Account & Security Notifications (`EMAILJS_TEMPLATE_NOTIFICATION`)
- **Subject:** `[{{platform_name}}] {{notification_title}}`
- **Use Cases:**
  - `notification_type = password_changed`: Confirmation that password was updated.
  - `notification_type = teacher_invitation`: Teacher onboarding invite link.
  - `notification_type = guardian_link_request`: Guardian link approval prompt.
  - `notification_type = institution_approved`: Institution approval notice.
  - `notification_type = institution_rejected`: Institution rejection reason.
  - `notification_type = security_alert`: Security anomaly alert.
- **Dynamic Parameters:**
  - `to_email`, `to_name`, `notification_title`, `notification_message`, `notification_type`, `action_url`, `action_label`, `platform_name`, `support_email`
