import { describe, it, expect } from 'vitest';
import {
  getAdminRegistrationEmail,
  getPasswordResetEmail,
  getPasswordResetSuccessEmail,
} from '../../backend/server/templates/emailTemplates';
import { EmailService } from '../../backend/server/services/email';

describe('Admin Panel Email Templates & Delivery Suite', () => {
  it('renders admin registration and institutional onboarding email template properly', () => {
    const data = {
      adminName: 'Dr. Ramesh Kumar',
      adminEmail: 'ramesh@andhrauniversity.edu',
      institutionName: 'Andhra Pradesh Model High School',
      institutionCode: 'AP-MOD-01',
      role: 'institution_admin',
      portalUrl: 'https://vidyapath.edu/admin',
      tempPassword: 'Pass@2026',
    };

    const email = getAdminRegistrationEmail(data);

    expect(email.subject).toContain('Welcome to Institutional Admin Portal');
    expect(email.subject).toContain('Andhra Pradesh Model High School');

    // HTML assertions
    expect(email.html).toContain('Dr. Ramesh Kumar');
    expect(email.html).toContain('AP-MOD-01');
    expect(email.html).toContain('Pass@2026');
    expect(email.html).toContain('https://vidyapath.edu/admin');
    expect(email.html).toContain('Institutional Administrator (Level 2)');
    expect(email.html).toContain('Vidyapath');
    expect(email.html).toContain('విద్యాపథ్');
    expect(email.html).toContain('विद्यापथ');

    // Plain text assertions
    expect(email.text).toContain('Hello Dr. Ramesh Kumar');
    expect(email.text).toContain('Pass@2026');
  });

  it('renders admin password reset request email template with 6-digit OTP code', () => {
    const data = {
      adminName: 'Smt. Lakshmi Devi',
      adminEmail: 'lakshmi@vidyapath.edu',
      resetCode: '849201',
      expiryMinutes: 15,
      portalUrl: 'https://vidyapath.edu/admin',
      ipAddress: '192.168.1.50',
    };

    const email = getPasswordResetEmail(data);

    expect(email.subject).toContain('Admin Password Reset Code: 849201');

    // HTML assertions
    expect(email.html).toContain('849201');
    expect(email.html).toContain('15 minutes');
    expect(email.html).toContain('Smt. Lakshmi Devi');
    expect(email.html).toContain('lakshmi@vidyapath.edu');
    expect(email.html).toContain('192.168.1.50');
    expect(email.html).toContain('Did not request this password reset?');

    // Plain text assertions
    expect(email.text).toContain('849201');
    expect(email.text).toContain('15 minutes');
  });

  it('renders password reset success confirmation email template', () => {
    const data = {
      adminName: 'Smt. Lakshmi Devi',
      adminEmail: 'lakshmi@vidyapath.edu',
      timestamp: 'Sun, 22 Nov 2026 09:30:00 GMT',
      portalUrl: 'https://vidyapath.edu/admin',
      ipAddress: '192.168.1.50',
    };

    const email = getPasswordResetSuccessEmail(data);

    expect(email.subject).toContain('Admin Password Changed Successfully');
    expect(email.html).toContain('Smt. Lakshmi Devi');
    expect(email.html).toContain('lakshmi@vidyapath.edu');
    expect(email.html).toContain('Did not authorize this change?');
    expect(email.text).toContain('password for lakshmi@vidyapath.edu was successfully changed');
  });

  it('dispatches emails cleanly through EmailService helper methods', async () => {
    // Simulated dispatch (dev/test mode)
    const regRes = await EmailService.sendAdminRegistrationEmail(
      'admin@test.edu',
      'Admin Tester',
      'Test High School',
      'TEST-01',
      'institution_admin',
      'TempPass123'
    );
    expect(regRes).toBe(true);

    const otpRes = await EmailService.sendPasswordResetOtpEmail(
      'admin@test.edu',
      'Admin Tester',
      '654321',
      15
    );
    expect(otpRes).toBe(true);

    const successRes = await EmailService.sendPasswordResetSuccessEmail(
      'admin@test.edu',
      'Admin Tester'
    );
    expect(successRes).toBe(true);
  });
});
