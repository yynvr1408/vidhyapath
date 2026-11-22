import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Mail,
  Smartphone,
  GraduationCap,
  Award,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useApp } from '../../context/AppContext';
import type { AuthRole } from '../../types/auth';
import { SAFETY_QUESTIONS } from '../../config/safetyQuestions';
import { LanguageSelector } from '../LanguageSelector';
import {
  ACADEMIC_GRADES,
  HIGHER_SECONDARY_STREAMS,
  EDUCATIONAL_BOARDS,
  INDIAN_STATES_AND_UTS,
} from '../../config/academic';

export type AuthRoleTab = AuthRole;

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: AuthRoleTab;
  initialMode?: 'login' | 'register' | 'forgot_pin';
  onAuthenticated?: (role: string) => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
  initialMode = 'login',
  onAuthenticated,
}) => {
  const { login, establishSession } = useEnterpriseAuth();
  const { currentLanguage } = useApp();

  const [activeTab, setActiveTab] = useState<AuthRoleTab>(initialRole);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_pin'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      if (initialRole) setActiveTab(initialRole);
      if (initialMode) setAuthMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialRole, initialMode]);

  // Student 5-step registration state
  const [registrationStep, setRegistrationStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form states
  const [identifier, setIdentifier] = useState(''); // Email or RollNumber / LoginCode
  const [credential, setCredential] = useState(''); // Password or 4-digit PIN
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [classGrade, setClassGrade] = useState<number>(10);
  const [board, setBoard] = useState('State SSC');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [stream, setStream] = useState('MPC');
  const [isIndependent, setIsIndependent] = useState(true);

  // EmailJS OTP verification states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Final registered student profile info for Step 5
  const [registeredStudentInfo, setRegisteredStudentInfo] = useState<{
    rollNumber: string;
    fullName: string;
    grade: number;
  } | null>(null);

  // Safety question PIN recovery
  const [safetyQuestion, setSafetyQuestion] = useState('');
  const [safetyAnswer, setSafetyAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [safetyQuestionFetched, setSafetyQuestionFetched] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIdentifier('');
    setCredential('');
    setRegistrationStep(1);
    setOtpCode('');
    setOtpSent(false);
    setOtpVerified(false);
  }, [isOpen, initialRole, initialMode]);

  useEffect(() => {
    setOtpCode('');
    setOtpSent(false);
    setOtpVerified(false);
  }, [activeTab, email, identifier]);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setIdentifier('');
    setCredential('');
    setSafetyAnswer('');
    setNewPin('');
    setSafetyQuestionFetched(false);
    setRegistrationStep(1);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpCode('');
    setRegisteredStudentInfo(null);
  };

  // 1. Handle Login (Role-Agnostic: Handles both Students & Staff)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        activeTab === 'student'
          ? { loginCode: identifier.trim().toUpperCase(), pin: credential.trim() }
          : { email: identifier.trim().toLowerCase(), password: credential };

      const result = await login(payload);
      if (!result.success || !result.user) throw new Error(result.error || 'Invalid login credentials.');
      const authenticatedUser = result.user;

      onClose();
      onAuthenticated?.(authenticatedUser.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Dispatch EmailJS OTP for Verification
  const handleSendOtp = async () => {
    const verificationEmail = activeTab === 'student' ? email : identifier;
    if (!verificationEmail || !verificationEmail.includes('@')) {
      setError('Please enter a valid email address for verification.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: verificationEmail.trim().toLowerCase(),
          purpose: 'registration',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpSent(true);
      setOtpCooldown(60);
      setSuccessMessage(data.message || 'Verification code dispatched to your email.');

      // Development-only OTPs may be returned by the local backend.
      if (import.meta.env.DEV && data.devOtp) {
        setOtpCode(data.devOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: (activeTab === 'student' ? email : identifier).trim().toLowerCase(),
          code: otpCode.trim(),
          purpose: 'registration',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification code invalid or expired.');
      }

      setOtpVerified(true);
      setSuccessMessage('Email verified successfully! Proceeding to PIN setup...');
      setTimeout(() => {
        setSuccessMessage(null);
        setRegistrationStep(4);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please double check the code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Student Registration Step 4 -> Complete Account Creation
  const handleCompleteStudentRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Verify your email before creating the student account.');
      return;
    }
    if (!/^\d{4}$/.test(credential)) {
      setError('Please set a secure 4-digit PIN for your student profile.');
      return;
    }
    if (!safetyAnswer.trim()) {
      setError('Please enter your security answer.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          email: email.trim().toLowerCase(),
          pin: credential.trim(),
          classGrade,
          board,
          state: stateName,
          stream: classGrade >= 11 ? stream : undefined,
          isIndependent,
          securityQuestionId: 'subject',
          securityQuestion: 'What is your favorite school subject?',
          securityAnswer: safetyAnswer.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete student enrollment.');
      }

      if (!data.token || !data.user) {
        throw new Error('The server created an incomplete account response. Please sign in before continuing.');
      }
      establishSession(data.token, data.user);

      const generatedRoll = data.user.studentProfile?.rollNumber;
      if (!generatedRoll) throw new Error('The server did not return a student login code.');

      setRegisteredStudentInfo({
        rollNumber: generatedRoll,
        fullName,
        grade: classGrade,
      });

      // Move to Step 5: Onboarding Walkthrough
      setRegistrationStep(5);
    } catch (err: any) {
      setError(err.message || 'Student registration encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Guardian or Institution Admin Registration
  const handleStaffRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!otpVerified) {
        throw new Error('Verify this email address before creating the account.');
      }
      if (activeTab === 'guardian') {
        const res = await fetch('/api/auth/register/guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email: identifier.trim().toLowerCase(),
            password: credential,
            phone,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to create parent account.');
        }

        if (data.token && data.user) establishSession(data.token, data.user);
        setSuccessMessage('Parent/Guardian account created.');
        setTimeout(() => {
          onClose();
          if (data.user?.role) onAuthenticated?.(data.user.role);
        }, 1200);
      } else if (activeTab === 'admin') {
        const res = await fetch('/api/auth/register/institution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            code: fullName.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'INST',
            type: 'school',
            contactEmail: identifier.trim().toLowerCase(),
            contactPhone: phone,
            adminFullName: 'Institution Administrator',
            adminPassword: credential,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit institution registration.');
        }

        setSuccessMessage('Institution registration submitted for Super Admin review!');
        setTimeout(() => {
          setAuthMode('login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Zero-Email PIN Reset
  const handleFetchSafetyQuestion = async () => {
    if (!identifier.trim()) {
      setError('Please provide your Student Login Code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/auth/student/safety-question?loginCode=${encodeURIComponent(identifier.trim().toUpperCase())}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Student code not recognized.');
      }
      setSafetyQuestion(data.question);
      setSafetyQuestionFetched(true);
    } catch (err: any) {
      setError(err.message || 'Could not retrieve safety question.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyAnswer.trim() || newPin.length !== 4) {
      setError('Please provide your answer and a new 4-digit PIN.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/student/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginCode: identifier.trim().toUpperCase(),
          answer: safetyAnswer.trim(),
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Incorrect safety answer. Try again.');
      }

      setSuccessMessage('PIN reset successfully! You may now sign in.');
      setTimeout(() => {
        setAuthMode('login');
        setCredential(newPin);
        setError(null);
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'PIN reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-linear-to-r from-[#F8FAFC] to-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-black">
              🏮
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#0F172A] leading-tight">
                Vidyapath Portal • విద్యాపథ్
              </h2>
              <p className="text-xs text-[#64748B] font-medium">
                Unified RBAC Authentication &amp; Class 1–12 Registration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector variant="compact" />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        {authMode !== 'forgot_pin' && !(authMode === 'register' && activeTab === 'student' && registrationStep === 5) && (
          <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC] px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
            {(['student', 'guardian', 'teacher', 'admin'] as AuthRoleTab[]).map((tab) => {
              const active = activeTab === tab;
              const labels: Record<AuthRoleTab, { label: string; icon: any }> = {
                student: { label: 'Student', icon: GraduationCap },
                guardian: { label: 'Parent / Guardian', icon: ShieldCheck },
                teacher: { label: 'Teacher', icon: BookOpen },
                admin: { label: 'Institution Admin', icon: Building2 },
              };
              const { label, icon: Icon } = labels[tab];

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    resetForm();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'border-[#0F766E] text-[#0F766E] bg-white shadow-2xs font-black'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] p-3 rounded-xl text-xs font-medium animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] p-3 rounded-xl text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: FORGOT PIN VIA ZERO-EMAIL SAFETY QUESTION */}
          {authMode === 'forgot_pin' ? (
            <form onSubmit={handleResetPinSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#0F766E]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">Zero-Email Student PIN Reset</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Student Login Code or Roll Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                    placeholder="e.g. 24SSC-001"
                    className="flex-1 px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm font-bold uppercase focus:border-[#0F766E] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSafetyQuestion}
                    disabled={loading}
                    className="px-3 py-2 bg-[#F1F5F9] text-[#0F766E] font-bold text-xs rounded-xl hover:bg-[#E2E8F0] transition-colors shrink-0 cursor-pointer"
                  >
                    Find Question
                  </button>
                </div>
              </div>

              {safetyQuestionFetched && (
                <>
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Your Security Question
                    </span>
                    <p className="text-sm font-extrabold text-[#0F172A]">{safetyQuestion}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Security Answer
                    </label>
                    <input
                      type="text"
                      required
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="e.g. Maths (or లెక్కలు)"
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      New 4-Digit Student PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-center text-lg font-black tracking-widest focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#115E59] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{loading ? 'Resetting...' : 'Set New PIN'}</span>
                  </button>
                </>
              )}
            </form>
          ) : authMode === 'login' ? (
            /* MODE 2: ROLE-BASED LOGIN */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Sign In as {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h3>
                {activeTab !== 'teacher' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      resetForm();
                    }}
                    className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    + Create New Account
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  {activeTab === 'student' ? 'Student Login Code or Roll Number' : 'Email Address'}
                </label>
                <input
                  type={activeTab === 'student' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    activeTab === 'student' ? 'e.g. 24SSC-001 or RAVI' : 'user@example.com'
                  }
                  className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-semibold focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#475569]">
                    {activeTab === 'student' ? '4-Digit Confidential PIN' : 'Password'}
                  </label>
                  {activeTab === 'student' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot_pin');
                        setError(null);
                      }}
                      className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                    >
                      Forgot PIN?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  maxLength={activeTab === 'student' ? 4 : 64}
                  required
                  value={credential}
                  onChange={(e) =>
                    setCredential(
                      activeTab === 'student' ? e.target.value.replace(/\D/g, '') : e.target.value
                    )
                  }
                  placeholder={activeTab === 'student' ? '••••' : '••••••••'}
                  className={`w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-semibold focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 focus:outline-hidden ${
                    activeTab === 'student' ? 'text-center text-lg font-mono tracking-widest' : ''
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] text-white font-extrabold text-sm rounded-xl hover:bg-[#115E59] transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : activeTab === 'teacher' ? (
            <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <h3 className="text-sm font-extrabold text-[#0F172A]">Teacher accounts are invitation-only</h3>
              <p className="text-xs leading-relaxed text-[#475569]">
                Ask your institution administrator to invite you. The invitation links your account to the correct school and teaching permissions.
              </p>
              <button type="button" onClick={() => setAuthMode('login')} className="text-xs font-bold text-[#0F766E] hover:underline">
                Back to teacher sign in
              </button>
            </div>
          ) : activeTab === 'student' ? (
            /* MODE 3: 5-STEP STRUCTURED STUDENT REGISTRATION */
            <div className="space-y-4">
              {/* Step Progression Bar */}
              {registrationStep <= 4 && (
                <div>
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#0F766E] mb-1.5">
                    <span>Step {registrationStep} of 5</span>
                    <span className="text-[#64748B] font-medium">
                      {registrationStep === 1
                        ? 'Personal Information'
                        : registrationStep === 2
                        ? 'Academic Level & Board'
                        : registrationStep === 3
                        ? 'EmailJS OTP Verification'
                        : 'Security PIN & Avatar'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] transition-all duration-300"
                      style={{ width: `${(registrationStep / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 1: Personal Information */}
              {registrationStep === 1 && (
                <div className="space-y-3.5">
                  <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#0F766E]" />
                    <span>Personal Information</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Student Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar / రమేష్"
                      className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-semibold focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Parent / Guardian Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!fullName.trim()}
                      onClick={() => setRegistrationStep(2)}
                      className="w-full py-3 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#115E59] disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Academic Info</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic Info (Classes 1–12 & Streams) */}
              {registrationStep === 2 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#0F766E]" />
                      <span>Academic Grade &amp; Board Selection</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(1)}
                      className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  {/* Class 1 to 12 Spectrum */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#475569]">
                        Class / Grade <span className="text-[#DC2626]">*</span>
                      </label>
                      <span className="text-[10px] font-black uppercase text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-full border border-[#CCFBF1]">
                        {classGrade <= 10 ? '100% Free Tier' : 'Senior Secondary'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 p-1.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] max-h-36 overflow-y-auto">
                      {ACADEMIC_GRADES.map((g) => (
                        <button
                          key={g.grade}
                          type="button"
                          onClick={() => setClassGrade(g.grade)}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                            classGrade === g.grade
                              ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs font-black'
                              : 'bg-white text-[#475569] border-[#CBD5E1] hover:border-[#0F766E]'
                          }`}
                        >
                          Class {g.grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Conditional Stream Selection for Classes 11 and 12 */}
                  {classGrade >= 11 && (
                    <div className="p-3 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl space-y-2 animate-fadeIn">
                      <label className="block text-xs font-black text-[#7E22CE]">
                        Specialized Stream (Class {classGrade}):
                      </label>
                      <select
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#D8B4FE] rounded-lg text-xs font-bold text-[#0F172A] focus:border-[#7E22CE] focus:outline-hidden"
                      >
                        {HIGHER_SECONDARY_STREAMS.map((s) => (
                          <option key={s.id} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-[#6B21A8]">
                        Curriculum mapped to higher examination standards with Socratic problem guidance.
                      </p>
                    </div>
                  )}

                  {/* Board Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">Board</label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-bold focus:border-[#0F766E] focus:outline-hidden"
                      >
                        {EDUCATIONAL_BOARDS.map((b) => (
                          <option key={b.id} value={b.code}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">State / UT</label>
                      <select
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl text-xs font-medium focus:border-[#0F766E] focus:outline-hidden"
                      >
                        {INDIAN_STATES_AND_UTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(3)}
                      className="w-full py-3 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#115E59] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: EmailJS OTP Verification */}
              {registrationStep === 3 && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0F766E]" />
                      <span>EmailJS OTP Verification</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(2)}
                      className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Student / Parent Email Address <span className="text-[#DC2626]">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="flex-1 px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || otpCooldown > 0}
                        className="px-3.5 py-2.5 bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                      >
                        {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? 'Resend' : 'Send OTP'}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] space-y-2">
                      <label className="block text-xs font-bold text-[#0F766E]">
                        Enter 6-Digit Verification Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="w-full text-center text-lg font-mono font-bold tracking-widest px-3 py-2 border border-[#CBD5E1] rounded-xl bg-white focus:border-[#0F766E] focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={loading || otpCode.length < 4}
                          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!email || !email.includes('@') || !otpVerified}
                      onClick={() => {
                        if (!otpVerified) {
                          setError('Verify your email before continuing.');
                          return;
                        }
                        setRegistrationStep(4);
                      }}
                      className="w-full py-3 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F766E] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Security Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Account Creation & Security PIN Setup */}
              {registrationStep === 4 && (
                <form onSubmit={handleCompleteStudentRegistration} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#0F766E]" />
                      <span>Set Student PIN &amp; Safety Question</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setRegistrationStep(3)}
                      className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Set 4-Digit Student Confidential PIN <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={credential}
                      onChange={(e) => setCredential(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-center text-xl font-mono font-black tracking-widest focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F766E]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Zero-Email PIN Recovery Question:</span>
                    </div>
                    <p className="text-[11px] text-[#475569] font-medium">
                      What is your favorite school subject?
                    </p>
                    <input
                      type="text"
                      required
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="e.g. Maths (or లెక్కలు)"
                      className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || credential.length !== 4}
                      className="w-full py-3 bg-[#0F766E] text-white font-extrabold text-sm rounded-xl hover:bg-[#115E59] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? 'Creating Account...' : 'Complete Enrollment & Launch'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 5: First-Time Student Onboarding Walkthrough */}
              {registrationStep === 5 && (
                <div className="space-y-4 py-2 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#15803D]">
                      Enrolled Successfully
                    </span>
                    <h3 className="text-xl font-black text-[#0F172A] mt-2 tracking-tight">
                      Welcome, {registeredStudentInfo?.fullName || fullName}!
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 font-medium">
                      Your confidential Student Login Code has been assigned:
                    </p>
                    <div className="mt-2 inline-block px-4 py-1.5 bg-[#F8FAFC] border-2 border-dashed border-[#0F766E] rounded-xl font-mono text-base font-black text-[#0F766E]">
                      {registeredStudentInfo?.rollNumber}
                    </div>
                  </div>

                  {/* Features Walkthrough Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left pt-2">
                    <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                      <div className="text-base mb-1">🏮</div>
                      <div className="text-xs font-black text-[#0F766E]">Socratic AI Tutor</div>
                      <p className="text-[10px] text-[#475569] mt-0.5 leading-snug">
                        Guides your doubts step-by-step in Telugu, Hindi &amp; English.
                      </p>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <div className="text-base mb-1">📶</div>
                      <div className="text-xs font-black text-[#0F172A]">100% Offline Mode</div>
                      <p className="text-[10px] text-[#475569] mt-0.5 leading-snug">
                        Practice and learn on shared phones even with no internet signal.
                      </p>
                    </div>

                    <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#FDE68A]">
                      <div className="text-base mb-1">🎯</div>
                      <div className="text-xs font-black text-[#B45309]">Weak Topic Coaching</div>
                      <p className="text-[10px] text-[#78350F] mt-0.5 leading-snug">
                        Instant remedial hints turn mistakes into genuine understanding.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAuthenticated?.('student');
                      }}
                      className="w-full py-3.5 bg-[#0F766E] hover:bg-[#115E59] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>Enter My Classroom · చదువు ప్రారంభిద్దాం</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Staff (Guardian, Teacher, or Admin) Registration Form */
            <form onSubmit={handleStaffRegisterSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-bold text-[#0F172A]">
                  Register as {activeTab === 'guardian' ? 'Parent / Guardian' : 'Institution Head'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Rao"
                  className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-semibold focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-[#CBD5E1] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#0F766E]">Verify this email address</span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || otpCooldown > 0 || !identifier.includes('@')}
                    className="px-3 py-2 bg-[#0F766E] disabled:opacity-50 text-white font-bold text-xs rounded-lg"
                  >
                    {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? 'Resend code' : 'Send code'}
                  </button>
                </div>
                {otpSent && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      className="flex-1 px-3 py-2 border border-[#CBD5E1] rounded-lg text-center font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otpCode.length !== 6}
                      className="px-3 py-2 bg-[#16A34A] disabled:opacity-50 text-white font-bold text-xs rounded-lg"
                    >
                      {otpVerified ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !otpVerified || (activeTab === 'guardian' && credential.length < 12) || (activeTab === 'admin' && credential.length < 12)}
                className="w-full py-3 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#115E59] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>{loading ? 'Submitting...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
