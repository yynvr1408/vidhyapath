// Enterprise Application Shell with Hierarchical Role Navigation & Status Bar
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building,
  GraduationCap,
  BookOpen,
  Users,
  Bell,
  Wifi,
  WifiOff,
  LogOut,
  Menu,
  X,
  FileText,
  HelpCircle,
  FolderDown,
  Layers,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Globe,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEnterpriseAuth, DEMO_USERS } from '../../context/EnterpriseAuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole, NotificationItem } from '../../types/enterprise';
import { VidyapathLogo } from '../VidyapathLogo';
import { AppUpdateButton } from '../AppUpdateButton';
import { SCHEDULED_LANGUAGES } from '../../config/languages';
import { SupportedLang } from '../../utils/translations';

export type EnterpriseScreenId =
  | 'DASHBOARD'
  | 'SUBJECT_VIEW'
  | 'AI_TUTOR'
  | 'SYLLABUS_MANAGER'
  | 'OFFLINE_CENTER'
  | 'FOUNDATION_MASCOTS'
  | 'PRACTICE_ENGINE'
  | 'MY_PROGRESS'
  | 'GUARDIAN_DIGEST'
  | 'INSTITUTIONS_QUEUE'
  | 'USERS_DIRECTORY'
  | 'AUDIT_LOGS'
  | 'ASSIGNMENTS'
  | 'ANNOUNCEMENTS';

interface EnterpriseShellProps {
  currentScreen: EnterpriseScreenId;
  setScreen: (screen: EnterpriseScreenId) => void;
  children: React.ReactNode;
}

export const EnterpriseShell: React.FC<EnterpriseShellProps> = ({ currentScreen, setScreen, children }) => {
  const { user, activeRole, switchRoleDemo, logout } = useEnterpriseAuth();
  const {
    currentLanguage,
    switchLanguage,
    isOffline,
    simulatedOffline,
    toggleSimulatedOffline,
  } = useApp();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch in-app notifications
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('vidyapath_token');
        if (!token) return;
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const list = await res.json();
          setNotifications(list);
        }
      } catch (err) {
        console.warn('Could not load notifications:', err);
      }
    };
    fetchNotifs();
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Role labels and styling
  const roleBadges: Record<UserRole, { label: string; bg: string; text: string }> = {
    super_admin: { label: 'Level 1: Platform Super Admin', bg: 'bg-[#EDE9FE]', text: 'text-[#6D28D9]' },
    institution_admin: { label: 'Level 2: Institution Admin', bg: 'bg-[#E0F2FE]', text: 'text-[#0369A1]' },
    academic_admin: { label: 'Level 3: Department Head / HOD', bg: 'bg-[#FEF3C7]', text: 'text-[#B45309]' },
    teacher: { label: 'Level 4: Faculty / Teacher', bg: 'bg-[#DCFCE7]', text: 'text-[#15803D]' },
    student: { label: 'Level 5: Student', bg: 'bg-[#F0FDFA]', text: 'text-[#0F766E]' },
    guardian: { label: 'Parent / Guardian', bg: 'bg-[#FDF2F8]', text: 'text-[#BE185D]' },
    coordinator: { label: 'Academic Coordinator', bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]' },
    exam_admin: { label: 'Examination Admin', bg: 'bg-[#FEE2E2]', text: 'text-[#B91C1C]' },
  };

  const badge = roleBadges[activeRole] || roleBadges.student;

  // Role-tailored navigation items
  const getNavItems = () => {
    switch (activeRole) {
      case 'super_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'Super Admin Overview', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'INSTITUTIONS_QUEUE' as EnterpriseScreenId, label: 'Institution Approvals', icon: <CheckCircle2 className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: 'Global User Directory', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'AUDIT_LOGS' as EnterpriseScreenId, label: 'Security & Audit Logs', icon: <Shield className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: 'Global Announcements', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'institution_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'Institution Dashboard', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'SYLLABUS_MANAGER' as EnterpriseScreenId, label: 'Syllabus Ingestion & Upload', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: 'Faculty & Students', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: 'Announcements', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'academic_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'Department Overview', icon: <Layers className="w-5 h-5 shrink-0" /> },
          { id: 'SYLLABUS_MANAGER' as EnterpriseScreenId, label: 'Curriculum & Syllabi', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: 'Department Faculty', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: 'Department Notices', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'teacher':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'Faculty Teaching Hub', icon: <GraduationCap className="w-5 h-5 shrink-0" /> },
          { id: 'SUBJECT_VIEW' as EnterpriseScreenId, label: 'My Classroom & Materials', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
          { id: 'ASSIGNMENTS' as EnterpriseScreenId, label: 'Assignments & Quizzes', icon: <Award className="w-5 h-5 shrink-0" /> },
          { id: 'AI_TUTOR' as EnterpriseScreenId, label: 'AI Teaching Assistant', icon: <HelpCircle className="w-5 h-5 shrink-0" /> },
        ];
      case 'guardian':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'Guardian Portal', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'GUARDIAN_DIGEST' as EnterpriseScreenId, label: 'Weekly Audio Summary', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'FOUNDATION_MASCOTS' as EnterpriseScreenId, label: 'Mascot Learner Profiles', icon: <Users className="w-5 h-5 shrink-0" /> },
        ];
      case 'student':
      default:
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: 'My Academic Dashboard', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
          { id: 'SUBJECT_VIEW' as EnterpriseScreenId, label: 'Subject Classroom (LMS)', icon: <Layers className="w-5 h-5 shrink-0" /> },
          { id: 'AI_TUTOR' as EnterpriseScreenId, label: 'Socratic AI Tutor', icon: <HelpCircle className="w-5 h-5 shrink-0" /> },
          { id: 'PRACTICE_ENGINE' as EnterpriseScreenId, label: 'Adaptive Practice Engine', icon: <Award className="w-5 h-5 shrink-0" /> },
          { id: 'MY_PROGRESS' as EnterpriseScreenId, label: 'Learner Progress & Lanterns', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
          { id: 'FOUNDATION_MASCOTS' as EnterpriseScreenId, label: 'Class 10 Mascots (Zero-PII)', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'OFFLINE_CENTER' as EnterpriseScreenId, label: 'Offline Learning Center', icon: <FolderDown className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: 'Notices & Deadlines', icon: <Calendar className="w-5 h-5 shrink-0" /> },
        ];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (screen: EnterpriseScreenId) => {
    setScreen(screen);
    setMobileDrawerOpen(false);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Language Selector Component (Telugu, Hindi, English)
  const LanguageDropdown = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-2 py-1 ${className}`}>
      <Globe className="w-4 h-4 text-[#0F766E] shrink-0" />
      <select
        value={currentLanguage}
        onChange={(e) => switchLanguage(e.target.value as SupportedLang)}
        className="text-xs bg-transparent text-[#0F172A] font-bold cursor-pointer focus:outline-hidden truncate w-full"
        title="Select Language (Telugu, Hindi, English)"
      >
        {SCHEDULED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] border-r border-[#E2E8F0] p-4 text-[#0F172A] justify-between overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0] mb-4">
          <VidyapathLogo size="sm" showWordmark={false} />
          <div>
            <h1 className="font-black text-base text-[#0F172A] leading-tight tracking-tight">
              VIDYAPATH
            </h1>
            <p className="text-[10px] font-bold text-[#0F766E] uppercase tracking-wider">
              Educational Ecosystem
            </p>
          </div>
        </div>

        {/* Current Active Role Card */}
        <div className="p-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] mb-4">
          <div className="text-[11px] font-semibold text-[#64748B] mb-1">Active User</div>
          <div className="font-extrabold text-sm text-[#0F172A] truncate">
            {user?.fullName || 'Active User'}
          </div>
          <div className="mt-1.5 inline-block">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>
          {user?.institutionName && (
            <div className="text-[11px] text-[#475569] font-medium mt-1.5 truncate">
              {user.institutionName}
            </div>
          )}
        </div>

        {/* Language Selection in Sidebar */}
        <div className="mb-4">
          <div className="text-[10px] font-extrabold uppercase text-[#64748B] tracking-wider mb-1">
            Interface Language (తెలుగు / हिन्दी / English)
          </div>
          <LanguageDropdown className="w-full" />
        </div>

        {/* Role-Specific Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs font-bold transition-all text-left min-h-[44px] ${
                  active
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className={active ? 'text-white' : 'text-[#0F766E]'}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Demo Switcher, App Update & Logout */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-2 mt-4">
        {/* Rapid Role Testing Switcher */}
        <div className="bg-[#F8FAFC] p-2.5 rounded-[10px] border border-[#E2E8F0]">
          <div className="text-[10px] font-extrabold uppercase text-[#64748B] tracking-wider mb-1.5 flex items-center justify-between">
            <span>Demo Role Switcher</span>
            <span className="text-[9px] text-[#0F766E] font-bold">5 Tiers</span>
          </div>
          <select
            value={activeRole}
            onChange={(e) => switchRoleDemo(e.target.value as UserRole)}
            className="w-full text-xs font-bold bg-white text-[#0F172A] border border-[#CBD5E1] rounded-[6px] p-1.5 cursor-pointer focus:outline-hidden min-h-[36px]"
          >
            <option value="super_admin">Level 1: Platform Super Admin</option>
            <option value="institution_admin">Level 2: Institution Admin</option>
            <option value="academic_admin">Level 3: Department Head (HOD)</option>
            <option value="teacher">Level 4: Faculty / Teacher</option>
            <option value="student">Level 5: Student (Aditya Verma)</option>
            <option value="guardian">Guardian / Parent</option>
          </select>
        </div>

        {/* Release & Update Checker */}
        <AppUpdateButton />

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[8px] bg-white hover:bg-[#FEE2E2] border border-[#E2E8F0] text-xs font-bold text-[#DC2626] transition-all min-h-[40px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-[#0F172A] w-full overflow-x-hidden">
      {/* Desktop Persistent Sidebar (260px) */}
      <aside className="hidden md:block w-[260px] h-screen sticky top-0 shrink-0 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Main Column: Header + Fluid Responsive Content */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen w-full">
        {/* Sticky Top Header Bar with Safe-Area Padding for Mobile Status Bar */}
        <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)] flex items-center justify-between shadow-2xs gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open Navigation Menu"
              className="md:hidden w-10 h-10 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-extrabold text-[#0F172A] truncate block max-w-[200px] lg:max-w-md">
                {user?.institutionName || 'Vidyapath Educational Ecosystem'}
              </span>
            </div>
          </div>

          {/* Right Header Status Bar: Language Dropdown + Offline Toggle + Notifications */}
          <div className="flex items-center gap-2">
            {/* Language Dropdown (Telugu, Hindi, English) */}
            <LanguageDropdown className="max-w-[130px] sm:max-w-[180px]" />

            {/* Interactive Offline / Online Mode Toggle */}
            <button
              type="button"
              onClick={toggleSimulatedOffline}
              title={simulatedOffline || isOffline ? 'Offline Mode Active - Click to Switch Online' : 'Online Connected - Click to Test Offline Mode'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border transition-all active:scale-95 min-h-[34px] ${
                simulatedOffline || isOffline
                  ? 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E] hover:bg-[#FDE68A]'
                  : 'bg-[#DCFCE7] border-[#16A34A]/40 text-[#16A34A] hover:bg-[#BBF7D0]'
              }`}
            >
              {simulatedOffline || isOffline ? <WifiOff className="w-3.5 h-3.5 text-[#D97706]" /> : <Wifi className="w-3.5 h-3.5 text-[#16A34A]" />}
              <span className="text-[11px] hidden sm:inline">
                {simulatedOffline ? 'Offline (Demo)' : isOffline ? 'Offline' : 'Online'}
              </span>
            </button>

            {/* Notifications Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <Bell className="w-4 h-4 text-[#475569]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[12px] border border-[#CBD5E1] shadow-xl z-50 p-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2">
                    <span className="font-extrabold text-xs text-[#0F172A]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] text-[#0F766E] font-bold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#64748B]">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-[8px] border text-xs ${
                            n.read ? 'bg-white border-[#E2E8F0]' : 'bg-[#F0FDFA] border-[#99F6E4]'
                          }`}
                        >
                          <div className="font-bold text-[#0F172A]">{n.title}</div>
                          <div className="text-[11px] text-[#475569] mt-0.5">{n.message}</div>
                          <div className="text-[9px] text-[#94A3B8] mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Slide-out Drawer */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 animate-fadeIn">
            <div
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-[280px] max-w-[85vw] h-full bg-[#FFFFFF] shadow-2xl z-50 pt-[env(safe-area-inset-top)]">
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-md text-[#475569] hover:text-[#0F172A] flex items-center justify-center hover:bg-[#F8FAFC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* Main Content Area: Completely expanded responsive on desktop webview, touch-safe on mobile */}
        <main className="flex-1 min-w-0 w-full p-3 sm:p-5 md:p-6 lg:p-8 pb-[max(env(safe-area-inset-bottom),4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
