import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Building2,
  Shield,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { useEnterpriseAuth } from '../context/EnterpriseAuthContext';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { VidyapathLogo } from '../components/VidyapathLogo';
import { getTranslations } from '../utils/translations';
import {
  ACADEMIC_GRADES,
  HIGHER_SECONDARY_STREAMS,
  INDIAN_STATES_AND_UTS,
  AcademicGrade,
} from '../config/academic';
import { LearnerProfile } from '../types';

export type AuthRole = 'student' | 'guardian' | 'teacher' | 'admin' | 'super_admin';

interface WebsiteAuthPageProps {
  initialRole?: AuthRole;
  initialMode?: 'login' | 'register' | 'forgot_pin';
  onNavigateHome?: () => void;
  onLoginSuccess?: (role: string) => void;
}

export const WebsiteAuthPage: React.FC<WebsiteAuthPageProps> = ({
  initialRole = 'student',
  initialMode = 'login',
  onNavigateHome,
  onLoginSuccess,
}) => {
  const { refreshProfile } = useEnterpriseAuth();
  const { currentLanguage, createLearner, selectLearner, learners, setScreen } = useApp();
  const t = getTranslations(currentLanguage);

  const [activeRole, setActiveRole] = useState<AuthRole>(initialRole);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_pin'>(initialMode);

  // Form states
  const [identifier, setIdentifier] = useState(''); // Email or RollNumber / Student Code
  const [password, setPassword] = useState(''); // Password or 4-digit PIN
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [classGrade, setClassGrade] = useState<number>(10);
  const [board, setBoard] = useState('State SSC');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [stream, setStream] = useState('MPC');
  const [safetyAnswer, setSafetyAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [safetyQuestion, setSafetyQuestion] = useState('');
  const [safetyQuestionFetched, setSafetyQuestionFetched] = useState(false);

  // Student 5-step registration
  const [studentStep, setStudentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Handle Role Switch
  const switchRole = (role: AuthRole) => {
    setActiveRole(role);
    setError(null);
    setSuccessMessage(null);
    setIdentifier('');
    setPassword('');
    setStudentStep(1);
    setOtpSent(false);
    setOtpVerified(false);
  };

  // 1. Submit Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        activeRole === 'student'
          ? { loginCode: identifier.trim().toUpperCase(), pin: password.trim() }
          : { email: identifier.trim().toLowerCase(), password };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      // Store JWT token
      localStorage.setItem('vidyapath_token', data.token);
      await refreshProfile();

      // Route according to authenticated role
      if (activeRole === 'student') {
        const matched = learners.find(
          (l) =>
            l.nickname.toUpperCase() === identifier.trim().toUpperCase() ||
            l.loginCode?.toUpperCase() === identifier.trim().toUpperCase() ||
            l.id === data.user?.id
        );
        if (matched) {
          selectLearner(matched);
        } else if (data.user) {
          const studentProfile: LearnerProfile = {
            id: data.user.id || 'learner_' + Date.now(),
            nickname: data.user.fullName || identifier.trim(),
            loginCode: data.user.studentProfile?.rollNumber || identifier.trim().toUpperCase(),
            pin: password.trim(),
            pinHash: password.trim(),
            avatarEmoji: '🧑‍🎓',
            avatarColor: '#0F766E',
            classGrade: data.user.studentProfile?.grade || 10,
            packId: 'te-10-maths-ap',
            createdAt: Date.now(),
          };
          await createLearner(studentProfile);
          selectLearner(studentProfile);
        }
        setScreen('MY_SYLLABUS');
        onLoginSuccess?.('student');
      } else if (activeRole === 'guardian') {
        setScreen('PARENT_VIEW');
        onLoginSuccess?.('guardian');
      } else {
        setScreen('ADMIN');
        onLoginSuccess?.(data.user?.role || 'admin');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Dispatch OTP for Student Registration
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'student_registration' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch verification code.');

      setOtpSent(true);
      setOtpCooldown(60);
      setSuccessMessage(data.message || 'Verification code dispatched to your email.');
      if (data.devOtp) setOtpCode(data.devOtp);
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
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          purpose: 'student_registration',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification code invalid or expired.');

      setOtpVerified(true);
      setSuccessMessage('Email verified successfully! Setting up PIN...');
      setTimeout(() => {
        setSuccessMessage(null);
        setStudentStep(4);
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Complete Student Registration
  const handleCompleteStudentRegistration = async () => {
    if (!password || password.length < 4) {
      setError('Please enter a 4-digit numeric PIN.');
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
          email: email.trim().toLowerCase(),
          pin: password.trim(),
          classGrade,
          board,
          state: stateName,
          stream: classGrade >= 11 ? stream : undefined,
          isIndependent: true,
          securityQuestionId: 'subject',
          securityQuestion: 'What is your favorite school subject?',
          securityAnswer: safetyAnswer || 'Maths',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete student enrollment.');
      }

      localStorage.setItem('vidyapath_token', data.token);
      await refreshProfile();

      const generatedRoll = data.user?.studentProfile?.rollNumber || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      const localProfile: LearnerProfile = {
        id: data.user?.id || 'learner_' + Date.now(),
        nickname: `${fullName} / ${fullName}`,
        loginCode: generatedRoll,
        pin: password.trim(),
        pinHash: password.trim(),
        avatarEmoji: '🧑‍🎓',
        avatarColor: '#0F766E',
        classGrade,
        packId: board === 'CBSE' ? 'en-10-maths-cbse' : 'te-10-maths-ap',
        securityQuestionId: 'subject',
        securityQuestion: 'What is your favorite school subject?',
        securityAnswer: safetyAnswer || 'Maths',
        createdAt: Date.now(),
      };

      await createLearner(localProfile);
      selectLearner(localProfile);
      setStudentStep(5);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Register Staff / Guardian / Institution
  const handleRegisterOther = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeRole === 'guardian') {
        const res = await fetch('/api/auth/register/guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email: identifier.trim().toLowerCase(),
            phone,
            password,
            relationship: 'Parent',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to register guardian.');
        setSuccessMessage('Guardian account registered successfully! You may now sign in.');
        setTimeout(() => setAuthMode('login'), 1200);
      } else if (activeRole === 'teacher') {
        const res = await fetch('/api/auth/register/guardian', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            email: identifier.trim().toLowerCase(),
            phone,
            password,
            relationship: 'Teacher',
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to register teacher.');
        setSuccessMessage('Teacher account registered! Please sign in with your email.');
        setTimeout(() => setAuthMode('login'), 1200);
      } else if (activeRole === 'admin') {
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
            adminPassword: password,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to register institution.');
        setSuccessMessage('Institution registration submitted for Super Admin review!');
        setTimeout(() => setAuthMode('login'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Zero-Email PIN Reset
  const handleFetchSafetyQuestion = async () => {
    if (!identifier.trim()) {
      setError('Please provide your Student Login Code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/student/safety-question?loginCode=${encodeURIComponent(identifier.trim().toUpperCase())}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Student code not recognized.');
      setSafetyQuestion(data.question);
      setSafetyQuestionFetched(true);
    } catch (err: any) {
      setError(err.message || 'Could not retrieve safety question.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyAnswer.trim() || newPin.trim().length !== 4) {
      setError('Please provide your safety answer and a 4-digit PIN.');
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Incorrect safety answer. Try again.');

      setSuccessMessage('PIN reset successfully! You may now sign in.');
      setTimeout(() => {
        setAuthMode('login');
        setPassword(newPin);
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* 1. Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F766E] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentLanguage === 'te' ? 'హోమ్‌కు తిరిగి వెళ్లండి' : currentLanguage === 'hi' ? 'होम पर वापस जाएं' : 'Back to Home'}</span>
        </button>

        <div className="flex items-center gap-3">
          <VidyapathLogo size="sm" showWordmark={true} />
          <LanguageSelector variant="compact" />
        </div>
      </header>

      {/* 2. Main Login Card Container */}
      <main className="max-w-lg w-full mx-auto my-6 bg-white rounded-3xl border border-[#CBD5E1] shadow-xl overflow-hidden animate-fadeIn">
        {/* Card Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-[#F8FAFC] to-[#FFFFFF] border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                {activeRole === 'super_admin'
                  ? 'Platform Super Admin Gateway'
                  : activeRole === 'admin'
                  ? 'Institution & School LMS Portal'
                  : activeRole === 'teacher'
                  ? 'Teacher & Faculty Portal'
                  : activeRole === 'guardian'
                  ? 'Guardian & Parent Portal'
                  : 'Student Learning Gateway'}
              </h1>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                {activeRole === 'student'
                  ? 'Class 1–12 State SSC & CBSE Curriculum'
                  : 'Enterprise Multi-Tier Role-Based Access'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] text-[#0F766E] border border-[#CCFBF1] flex items-center justify-center font-bold shrink-0">
              {activeRole === 'student' && <GraduationCap className="w-5 h-5" />}
              {activeRole === 'guardian' && <ShieldCheck className="w-5 h-5" />}
              {activeRole === 'teacher' && <BookOpen className="w-5 h-5" />}
              {activeRole === 'admin' && <Building2 className="w-5 h-5" />}
              {activeRole === 'super_admin' && <Shield className="w-5 h-5" />}
            </div>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            {(
              [
                { role: 'student', label: 'Student', icon: GraduationCap },
                { role: 'guardian', label: 'Parent / Guardian', icon: ShieldCheck },
                { role: 'teacher', label: 'Teacher', icon: BookOpen },
                { role: 'admin', label: 'Institution', icon: Building2 },
                { role: 'super_admin', label: 'Super Admin', icon: Shield },
              ] as const
            ).map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => switchRole(item.role)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeRole === item.role
                    ? 'bg-[#0F766E] text-white shadow-2xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Alerts */}
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#DC2626] animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-xs font-semibold text-[#16A34A] animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Mode Tabs for Non-Super-Admin */}
          {activeRole !== 'super_admin' && (
            <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authMode === 'login' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-lg transition-all text-center cursor-pointer ${
                  authMode === 'register' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* -------------------- 1. LOGIN FORM -------------------- */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              {activeRole === 'super_admin' && (
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#92400E] font-medium leading-relaxed">
                  Default Platform Master Account: <code className="font-bold">admin@vidyapath.edu</code>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  {activeRole === 'student' ? 'Student Login Code or Roll Number' : 'Email Address'}
                </label>
                <div className="relative">
                  {activeRole === 'student' ? (
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  ) : (
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  )}
                  <input
                    type={activeRole === 'student' ? 'text' : 'email'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activeRole === 'student'
                        ? 'e.g. RAVI-10 or STU-2026'
                        : activeRole === 'super_admin'
                        ? 'admin@vidyapath.edu'
                        : 'user@institution.edu'
                    }
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#0F766E] focus:outline-hidden uppercase font-medium bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#475569]">
                    {activeRole === 'student' ? '4-Digit Confidential PIN' : 'Password'}
                  </label>
                  {activeRole === 'student' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot_pin')}
                      className="text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      Forgot PIN?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                  <input
                    type="password"
                    maxLength={activeRole === 'student' ? 4 : 50}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeRole === 'student' ? '••••' : '••••••••'}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:border-[#0F766E] focus:outline-hidden font-mono bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* -------------------- 2. STUDENT REGISTRATION (5 Steps) -------------------- */}
          {authMode === 'register' && activeRole === 'student' && (
            <div className="space-y-4">
              {/* Step Indicator */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] text-xs font-bold text-[#64748B]">
                <span>Step {studentStep} of 5</span>
                <span className="text-[#0F766E]">
                  {studentStep === 1 && 'Academic Profile'}
                  {studentStep === 2 && 'Personal Details'}
                  {studentStep === 3 && 'Email Verification'}
                  {studentStep === 4 && 'PIN & Safety Question'}
                  {studentStep === 5 && 'Enrolled!'}
                </span>
              </div>

              {/* Step 1: Academic Profile */}
              {studentStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Select Class / Grade</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {ACADEMIC_GRADES.map((c: AcademicGrade) => (
                        <button
                          key={c.grade}
                          type="button"
                          onClick={() => setClassGrade(c.grade)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            classGrade === c.grade
                              ? 'bg-[#0F766E] text-white border-[#0F766E]'
                              : 'bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:border-[#0F766E]'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Education Board</label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    >
                      <option value="State SSC">State Board (SSC) - 100% Free for Class 1-10</option>
                      <option value="CBSE">Central Board (CBSE) - 100% Free for Class 1-10</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">State / Union Territory</label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    >
                      {INDIAN_STATES_AND_UTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {classGrade >= 11 && (
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">Higher Secondary Stream</label>
                      <select
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                      >
                        {HIGHER_SECONDARY_STREAMS.map((st) => (
                          <option key={st.id} value={st.id}>{st.name} ({st.subjects.join(', ')})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setStudentStep(2)}
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer mt-2"
                  >
                    Continue to Details →
                  </button>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {studentStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Student Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Reddy"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Email Address (for Verification)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentStep(1)}
                      className="py-2.5 px-4 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F1F5F9] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!fullName || !email}
                      onClick={() => {
                        setStudentStep(3);
                        handleSendOtp();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#0F766E] disabled:opacity-50 text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer"
                    >
                      Send Verification Code →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Email OTP Verification */}
              {studentStep === 3 && (
                <div className="space-y-3">
                  <p className="text-xs text-[#64748B]">
                    A 6-digit verification code has been dispatched to <strong className="text-[#0F172A]">{email}</strong>.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full p-3 rounded-xl border border-[#CBD5E1] text-center text-lg font-mono font-bold tracking-widest bg-[#F8FAFC]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || loading}
                      onClick={handleSendOtp}
                      className="font-bold text-[#0F766E] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStep(2)}
                      className="text-[#64748B] hover:underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={loading || !otpCode}
                    onClick={handleVerifyOtp}
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] disabled:opacity-50 text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer mt-2"
                  >
                    Verify Code →
                  </button>
                </div>
              )}

              {/* Step 4: PIN & Safety Question */}
              {studentStep === 4 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Choose a 4-Digit Confidential PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-center text-base font-mono font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Safety Question for PIN Recovery</label>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#475569]">
                      What is your favorite school subject?
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Your Secret Answer</label>
                    <input
                      type="text"
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="e.g. Mathematics"
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={loading || password.length < 4 || !safetyAnswer}
                    onClick={handleCompleteStudentRegistration}
                    className="w-full py-3 rounded-xl bg-[#0F766E] disabled:opacity-50 text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer shadow-xs mt-2"
                  >
                    Complete Student Registration 🎉
                  </button>
                </div>
              )}

              {/* Step 5: Onboarding Success Walkthrough */}
              {studentStep === 5 && (
                <div className="text-center py-4 space-y-3 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mx-auto text-2xl">
                    🎉
                  </div>
                  <h3 className="text-base font-extrabold text-[#0F172A]">Welcome to Vidyapath, {fullName}!</h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Your profile has been created for Class {classGrade} ({board}). You can now explore your syllabus, ask doubts to the vernacular AI tutor, and practice weak topics.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setScreen('MY_SYLLABUS');
                      onLoginSuccess?.('student');
                    }}
                    className="w-full py-3 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer shadow-xs"
                  >
                    Start Learning Now →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* -------------------- 3. OTHER ROLES REGISTRATION -------------------- */}
          {authMode === 'register' && activeRole !== 'student' && activeRole !== 'super_admin' && (
            <form onSubmit={handleRegisterOther} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  {activeRole === 'admin' ? 'Institution Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={activeRole === 'admin' ? 'Apex Institute of Technology' : 'Dr. Sunita Rao'}
                  required
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Email Address</label>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="contact@institution.edu"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-98765-43210"
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Register {activeRole === 'admin' ? 'Institution' : activeRole === 'teacher' ? 'Teacher' : 'Guardian'}</span>
                )}
              </button>
            </form>
          )}

          {/* -------------------- 4. FORGOT PIN FLOW (Zero-Email) -------------------- */}
          {authMode === 'forgot_pin' && (
            <div className="space-y-3.5">
              <h3 className="text-xs font-extrabold text-[#0F172A]">Zero-Email Instant PIN Recovery</h3>
              <p className="text-xs text-[#64748B]">
                Recover your PIN using your Student Code and secret safety answer.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Student Login Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                    placeholder="e.g. RAVI-10"
                    className="flex-1 p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold uppercase bg-[#F8FAFC]"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSafetyQuestion}
                    className="py-2.5 px-3 rounded-xl bg-[#0F766E] text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Find Question
                  </button>
                </div>
              </div>

              {safetyQuestionFetched && (
                <form onSubmit={handleResetPin} className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Your Safety Question</label>
                    <div className="p-2.5 bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl text-xs font-bold text-[#0F766E]">
                      {safetyQuestion}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">Your Answer</label>
                    <input
                      type="text"
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="Answer provided during registration"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-xs font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">New 4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#CBD5E1] text-center text-sm font-mono font-bold bg-[#F8FAFC]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#0F766E] text-white text-xs font-bold hover:bg-[#115E59] cursor-pointer"
                  >
                    Set New PIN &amp; Unlock
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-bold text-[#64748B] hover:text-[#0F172A] pt-2"
              >
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <p className="flex items-center justify-center gap-1.5 font-medium">
          <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
          <span>{t.zeroPiiNotice}</span>
        </p>
      </footer>
    </div>
  );
};
