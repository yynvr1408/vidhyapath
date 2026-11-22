import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Building2,
  Lock,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useApp } from '../../context/AppContext';
import { SAFETY_QUESTIONS } from '../../config/safetyQuestions';
import { LanguageSelector } from '../LanguageSelector';

export type AuthRoleTab = 'student' | 'guardian' | 'teacher' | 'admin';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: AuthRoleTab;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'student',
}) => {
  const { login } = useEnterpriseAuth();
  const { setScreen, learners, selectLearner } = useApp();

  const [activeTab, setActiveTab] = useState<AuthRoleTab>(initialRole);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_pin'>('login');

  // Form states
  const [identifier, setIdentifier] = useState(''); // Email or RollNumber / LoginCode
  const [credential, setCredential] = useState(''); // Password or 4-digit PIN
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [classGrade, setClassGrade] = useState('10');
  const [board, setBoard] = useState('State SSC');
  const [stateName, setStateName] = useState('Andhra Pradesh');
  const [isIndependent, setIsIndependent] = useState(true);

  // Safety question PIN recovery
  const [safetyQuestion, setSafetyQuestion] = useState('');
  const [safetyAnswer, setSafetyAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [safetyQuestionFetched, setSafetyQuestionFetched] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
    setIdentifier('');
    setCredential('');
    setSafetyAnswer('');
    setNewPin('');
    setSafetyQuestionFetched(false);
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

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid login credentials.');
      }

      // Store JWT token
      localStorage.setItem('vidyapath_token', data.token);

      // Route based on role
      if (activeTab === 'student') {
        // If matches a local learner profile, select it
        const matched = learners.find(
          (l) =>
            l.nickname.toUpperCase() === identifier.trim().toUpperCase() ||
            l.id === data.user.id
        );
        if (matched) {
          selectLearner(matched);
        }
        setScreen('MY_SYLLABUS');
      } else if (activeTab === 'guardian') {
        setScreen('PARENT_VIEW');
      } else {
        setScreen('ADMIN');
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
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

        localStorage.setItem('vidyapath_token', data.token);
        setSuccessMessage('Parent/Guardian account created! Sibling profiles can now be managed.');
        setTimeout(() => {
          setScreen('PARENT_VIEW');
          onClose();
        }, 1200);
      } else if (activeTab === 'student') {
        const res = await fetch('/api/auth/register/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            pin: credential.trim(),
            classGrade: parseInt(classGrade, 10),
            board,
            state: stateName,
            isIndependent,
            securityQuestionId: 'subject',
            securityQuestion: 'What is your favorite school subject?',
            securityAnswer: safetyAnswer || 'Maths',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to enroll student.');
        }

        localStorage.setItem('vidyapath_token', data.token);
        setSuccessMessage(`Welcome, ${fullName}! Your Login Code is ${data.user?.studentProfile?.rollNumber}.`);
        setTimeout(() => {
          setScreen('MY_SYLLABUS');
          onClose();
        }, 1500);
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
            adminFullName: 'Institution Head',
            adminPassword: credential,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit institution registration.');
        }

        setSuccessMessage('Institution registration submitted! Sent to Platform Super Administrator for review.');
        setTimeout(() => {
          setAuthMode('login');
          setSuccessMessage(null);
        }, 2200);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Student Safety Question PIN Reset
  const handleFetchSafetyQuestion = async () => {
    if (!identifier.trim()) {
      setError('Please enter your Student Login Code or Roll Number first.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/student/safety-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginCode: identifier.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Student account not found.');
      }
      setSafetyQuestion(data.securityQuestion);
      setSafetyQuestionFetched(true);
    } catch (err: any) {
      setError(err.message || 'Could not find safety question for this code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/student/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginCode: identifier.trim().toUpperCase(),
          securityAnswer: safetyAnswer.trim(),
          newPin: newPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset PIN.');
      }

      setSuccessMessage('PIN reset successfully! You can now log in.');
      setTimeout(() => {
        setAuthMode('login');
        setCredential(newPin);
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Incorrect answer or invalid PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Vidyapath Teal Branding */}
        <div className="bg-[#0F766E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              🎓
            </div>
            <div>
              <h2 className="font-extrabold text-lg leading-tight">Vidyapath Portal Login</h2>
              <p className="text-xs text-[#CCFBF1]">Unified Multi-Role Authentication</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="pill" />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Role Navigation Tabs */}
        <div className="grid grid-cols-4 bg-[#F8FAFC] border-b border-[#E2E8F0] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setAuthMode('login');
              resetForm();
            }}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === 'student'
                ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('guardian');
              setAuthMode('login');
              resetForm();
            }}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === 'guardian'
                ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Parent</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('teacher');
              setAuthMode('login');
              resetForm();
            }}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === 'teacher'
                ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setAuthMode('login');
              resetForm();
            }}
            className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeTab === 'admin'
                ? 'bg-white text-[#0F766E] shadow-2xs font-extrabold border border-[#E2E8F0]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Admin</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] p-3 rounded-xl text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] p-3 rounded-xl text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE: FORGOT PIN VIA SAFETY QUESTION */}
          {authMode === 'forgot_pin' ? (
            <form onSubmit={handleResetPinSubmit} className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                <HelpCircle className="w-4 h-4 text-[#0F766E]" />
                <h3 className="text-sm font-bold text-[#0F172A]">Zero-PII Student PIN Reset</h3>
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
                    placeholder="e.g. RAVI-10"
                    className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-bold uppercase focus:border-[#0F766E] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleFetchSafetyQuestion}
                    disabled={loading}
                    className="px-3 py-2 bg-[#F1F5F9] text-[#0F766E] font-bold text-xs rounded-xl hover:bg-[#E2E8F0] transition-colors shrink-0"
                  >
                    Find Question
                  </button>
                </div>
              </div>

              {safetyQuestionFetched && (
                <>
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                      Your Security Question
                    </span>
                    <p className="text-sm font-extrabold text-[#0F172A]">{safetyQuestion}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Your Security Answer
                    </label>
                    <input
                      type="text"
                      required
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="e.g. Maths (or లెక్కలు)"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
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
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-center text-lg font-black tracking-widest focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#0D655E] transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <span>Reset PIN &amp; Unlock</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-bold text-[#64748B] hover:text-[#0F172A] pt-2"
              >
                Back to Login
              </button>
            </form>
          ) : authMode === 'login' ? (
            /* MODE: LOGIN */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
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
                    activeTab === 'student'
                      ? 'e.g. RAVI-10 or Roll No.'
                      : activeTab === 'guardian'
                      ? 'parent@example.com'
                      : 'staff@institution.edu'
                  }
                  className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#475569]">
                    {activeTab === 'student' ? '4-Digit Student PIN' : 'Password'}
                  </label>
                  {activeTab === 'student' && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot_pin')}
                      className="text-[11px] font-bold text-[#0F766E] hover:underline"
                    >
                      Forgot PIN?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  maxLength={activeTab === 'student' ? 4 : undefined}
                  required
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={activeTab === 'student' ? '••••' : '••••••••'}
                  className={`w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden ${
                    activeTab === 'student' ? 'text-center font-black tracking-widest text-base' : ''
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#0D655E] transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{loading ? 'Authenticating...' : `Sign In as ${activeTab.toUpperCase()}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Registration Toggle for All Roles */}
              <div className="pt-2 text-center text-xs text-[#64748B]">
                <span>New to Vidyapath? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    resetForm();
                  }}
                  className="font-bold text-[#0F766E] hover:underline"
                >
                  {activeTab === 'student'
                    ? 'Enroll as Student (Free)'
                    : activeTab === 'guardian'
                    ? 'Create Parent Account'
                    : 'Register Institution'}
                </button>
              </div>
            </form>
          ) : (
            /* MODE: REGISTRATION */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Priya Reddy"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                />
              </div>

              {activeTab === 'guardian' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
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
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>
                </>
              ) : (
                /* Student Registration (Classes 1–10 100% Free) */
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">
                        Class / Grade
                      </label>
                      <select
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-bold focus:border-[#0F766E] focus:outline-hidden"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                          <option key={g} value={g}>
                            Class {g} (FREE)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1">Board</label>
                      <select
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-bold focus:border-[#0F766E] focus:outline-hidden"
                      >
                        <option value="State SSC">State Board (SSC)</option>
                        <option value="CBSE">CBSE Pan-India</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">State</label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    >
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Delhi">Delhi (NCR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Set 4-Digit Student PIN
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={credential}
                      onChange={(e) => setCredential(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-center text-lg font-black tracking-widest focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Security Answer for PIN Reset (What is your favorite subject?)
                    </label>
                    <input
                      type="text"
                      required
                      value={safetyAnswer}
                      onChange={(e) => setSafetyAnswer(e.target.value)}
                      placeholder="e.g. Maths"
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm font-medium focus:border-[#0F766E] focus:outline-hidden"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0F766E] text-white font-bold text-sm rounded-xl hover:bg-[#0D655E] transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Creating...' : 'Complete Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-xs font-bold text-[#64748B] hover:text-[#0F172A] pt-2"
              >
                Already registered? Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
