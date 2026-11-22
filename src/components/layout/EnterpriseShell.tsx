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
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole, NotificationItem } from '../../types/enterprise';
import { VidyapathLogo } from '../VidyapathLogo';
import { LanguageSelector } from '../LanguageSelector';
import { AppUpdateButton } from '../AppUpdateButton';
import { AppUpdateHeaderPill } from '../AppUpdateHeaderPill';
import { AppUpdateBanner } from '../AppUpdateBanner';
import { AppUpdateModal } from '../AppUpdateModal';
import { SCHEDULED_LANGUAGES } from '../../config/languages';
import { SupportedLang, getTranslations } from '../../utils/translations';
import { navigationManager } from '../../services/navigationManager';

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
  const { user, activeRole, logout } = useEnterpriseAuth();
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

  
  // Hardware back button integration to close mobile drawer or notifications popover
  useEffect(() => {
    if (!mobileDrawerOpen && !notificationsOpen) return;
    return navigationManager.registerBackHandler(() => {
      if (notificationsOpen) {
        setNotificationsOpen(false);
        return true;
      }
      if (mobileDrawerOpen) {
        setMobileDrawerOpen(false);
        return true;
      }
      return false;
    }, 100);
  }, [mobileDrawerOpen, notificationsOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const t = getTranslations(currentLanguage);

  // Role labels and styling (Strict Trilingual)
  const roleBadges: Record<UserRole, { label: string; bg: string; text: string }> = {
    super_admin: {
      label: currentLanguage === 'hi' ? 'स्तर 1: प्लेटफ़ॉर्म सुपर व्यवस्थापक' : currentLanguage === 'en' ? 'Level 1: Platform Super Admin' : 'లెవల్ 1: ప్లాట్‌ఫామ్ సూపర్ అడ్మిన్',
      bg: 'bg-[#EDE9FE]',
      text: 'text-[#6D28D9]',
    },
    institution_admin: {
      label: currentLanguage === 'hi' ? 'स्तर 2: संस्थान व्यवस्थापक' : currentLanguage === 'en' ? 'Level 2: Institution Admin' : 'లెవల్ 2: సంస్థ అడ్మిన్',
      bg: 'bg-[#E0F2FE]',
      text: 'text-[#0369A1]',
    },
    academic_admin: {
      label: currentLanguage === 'hi' ? 'स्तर 3: विभागाध्यक्ष / HOD' : currentLanguage === 'en' ? 'Level 3: Department Head / HOD' : 'లెవల్ 3: విభాగాధిపతి / HOD',
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#B45309]',
    },
    teacher: {
      label: currentLanguage === 'hi' ? 'स्तर 4: शिक्षक / प्राध्यापक' : currentLanguage === 'en' ? 'Level 4: Faculty / Teacher' : 'లెవల్ 4: అధ్యాపకులు / ఉపాధ్యాయులు',
      bg: 'bg-[#DCFCE7]',
      text: 'text-[#15803D]',
    },
    student: {
      label: currentLanguage === 'hi' ? 'स्तर 5: विद्यार्थी' : currentLanguage === 'en' ? 'Level 5: Student' : 'లెవల్ 5: విద్యార్థి',
      bg: 'bg-[#F0FDFA]',
      text: 'text-[#0F766E]',
    },
    guardian: {
      label: currentLanguage === 'hi' ? 'अभिभावक' : currentLanguage === 'en' ? 'Parent / Guardian' : 'తల్లిదండ్రులు / సంరక్షకులు',
      bg: 'bg-[#FDF2F8]',
      text: 'text-[#BE185D]',
    },
    coordinator: {
      label: currentLanguage === 'hi' ? 'शैक्षणिक समन्वयक' : currentLanguage === 'en' ? 'Academic Coordinator' : 'అకడమిక్ కోఆర్డినేటర్',
      bg: 'bg-[#F3E8FF]',
      text: 'text-[#7E22CE]',
    },
    exam_admin: {
      label: currentLanguage === 'hi' ? 'परीक्षा व्यवस्थापक' : currentLanguage === 'en' ? 'Examination Admin' : 'పరీక్షల నిర్వాహకులు',
      bg: 'bg-[#FEE2E2]',
      text: 'text-[#B91C1C]',
    },
  };

  const badge = roleBadges[activeRole] || roleBadges.student;

  // Role-tailored navigation items (Strict Trilingual)
  const getNavItems = () => {
    switch (activeRole) {
      case 'super_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'सुपर व्यवस्थापक अवलोकन' : currentLanguage === 'en' ? 'Super Admin Overview' : 'సూపర్ అడ్మిన్ అవలోకనం', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'INSTITUTIONS_QUEUE' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'संस्थान अनुमोदन' : currentLanguage === 'en' ? 'Institution Approvals' : 'సంస్థల ఆమోదాలు', icon: <CheckCircle2 className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'ग्लोबल उपयोगकर्ता निर्देशिका' : currentLanguage === 'en' ? 'Global User Directory' : 'గ్లోబల్ యూజర్ డైరెక్టరీ', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'AUDIT_LOGS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'सुरक्षा एवं ऑडिट लॉग' : currentLanguage === 'en' ? 'Security & Audit Logs' : 'సెక్యూరిటీ & ఆడిట్ లాగ్స్', icon: <Shield className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'ग्लोबल घोषणाएं' : currentLanguage === 'en' ? 'Global Announcements' : 'గ్లోబల్ ప్రకటనలు', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'institution_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'संस्थान डैशबोर्ड' : currentLanguage === 'en' ? 'Institution Dashboard' : 'సంస్థ డ్యాష్‌బోర్డ్', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'SYLLABUS_MANAGER' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'पाठ्यक्रम अपलोड' : currentLanguage === 'en' ? 'Syllabus Ingestion & Upload' : 'సిలబస్ నిర్వహణ & అప్‌లోడ్', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'शिक्षक एवं छात्र' : currentLanguage === 'en' ? 'Faculty & Students' : 'ఉపాధ్యాయులు & విద్యార్థులు', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'संस्थान घोषणाएं' : currentLanguage === 'en' ? 'Announcements' : 'ప్రకటనలు', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'academic_admin':
      case 'coordinator':
      case 'exam_admin':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'विभाग अवलोकन' : currentLanguage === 'en' ? 'Department Overview' : 'విభాగం అవలోకనం', icon: <Layers className="w-5 h-5 shrink-0" /> },
          { id: 'SYLLABUS_MANAGER' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'पाठ्यक्रम एवं विषय' : currentLanguage === 'en' ? 'Curriculum & Syllabi' : 'సిలబస్ & అంశాలు', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'USERS_DIRECTORY' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'विभाग संकाय' : currentLanguage === 'en' ? 'Department Faculty' : 'విభాగ అధ్యాపకులు', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'विभाग सूचनाएं' : currentLanguage === 'en' ? 'Department Notices' : 'విభాగం నోటీసులు', icon: <Send className="w-5 h-5 shrink-0" /> },
        ];
      case 'teacher':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'शिक्षण केंद्र' : currentLanguage === 'en' ? 'Faculty Teaching Hub' : 'అధ్యాపకుల బోధన హబ్', icon: <GraduationCap className="w-5 h-5 shrink-0" /> },
          { id: 'SUBJECT_VIEW' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'मेरी कक्षा एवं सामग्री' : currentLanguage === 'en' ? 'My Classroom & Materials' : 'నా తరగతి & సామగ్రి', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
          { id: 'ASSIGNMENTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'असाइनमेंट एवं क्विज़' : currentLanguage === 'en' ? 'Assignments & Quizzes' : 'అసైన్‌మెంట్లు & క్విజ్‌లు', icon: <Award className="w-5 h-5 shrink-0" /> },
          { id: 'AI_TUTOR' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'AI शिक्षण सहायक' : currentLanguage === 'en' ? 'AI Teaching Assistant' : 'AI బోధనా సహాయకుడు', icon: <HelpCircle className="w-5 h-5 shrink-0" /> },
        ];
      case 'guardian':
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'अभिभावक पोर्टल' : currentLanguage === 'en' ? 'Guardian Portal' : 'తల్లిదండ్రుల పోర్టల్', icon: <Building className="w-5 h-5 shrink-0" /> },
          { id: 'GUARDIAN_DIGEST' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'साप्ताहिक ऑडियो सारांश' : currentLanguage === 'en' ? 'Weekly Audio Summary' : 'వారపు ఆడియో సారాంశం', icon: <FileText className="w-5 h-5 shrink-0" /> },
          { id: 'FOUNDATION_MASCOTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'विद्यार्थी प्रोफ़ाइल' : currentLanguage === 'en' ? 'Mascot Learner Profiles' : 'విద్యార్థి ప్రొఫైల్స్', icon: <Users className="w-5 h-5 shrink-0" /> },
        ];
      case 'student':
      default:
        return [
          { id: 'DASHBOARD' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'मेरा शैक्षणिक डैशबोर्ड' : currentLanguage === 'en' ? 'My Academic Dashboard' : 'నా విద్యా డ్యాష్‌బోర్డ్', icon: <BookOpen className="w-5 h-5 shrink-0" /> },
          { id: 'SUBJECT_VIEW' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'विषय कक्षा (LMS)' : currentLanguage === 'en' ? 'Subject Classroom (LMS)' : 'తరగతి గది & సిలబస్', icon: <Layers className="w-5 h-5 shrink-0" /> },
          { id: 'AI_TUTOR' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'AI गणित ट्यूटर' : currentLanguage === 'en' ? 'Socratic AI Tutor' : 'AI గణిత ట్యూటర్', icon: <HelpCircle className="w-5 h-5 shrink-0" /> },
          { id: 'PRACTICE_ENGINE' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'अभ्यास एवं कमज़ोर विषय' : currentLanguage === 'en' ? 'Adaptive Practice Engine' : 'సాధన & బలహీన అంశాల పరీక్ష', icon: <Award className="w-5 h-5 shrink-0" /> },
          { id: 'MY_PROGRESS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'प्रगति एवं लालटेन' : currentLanguage === 'en' ? 'Learner Progress & Lanterns' : 'నా ప్రగతి & లాంతర్లు', icon: <TrendingUp className="w-5 h-5 shrink-0" /> },
          { id: 'FOUNDATION_MASCOTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'कक्षा 10 प्रोफ़ाइल (Zero-PII)' : currentLanguage === 'en' ? 'Class 10 Mascots (Zero-PII)' : '10వ తరగతి ప్రొఫైల్స్ (Zero-PII)', icon: <Users className="w-5 h-5 shrink-0" /> },
          { id: 'OFFLINE_CENTER' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'ऑफलाइन अध्ययन केंद्र' : currentLanguage === 'en' ? 'Offline Learning Center' : 'ఆఫ్‌లైన్ లెర్నింగ్ సెంటర్', icon: <FolderDown className="w-5 h-5 shrink-0" /> },
          { id: 'ANNOUNCEMENTS' as EnterpriseScreenId, label: currentLanguage === 'hi' ? 'सूचनाएं एवं समय-सीमा' : currentLanguage === 'en' ? 'Notices & Deadlines' : 'నోటీసులు & గడువులు', icon: <Calendar className="w-5 h-5 shrink-0" /> },
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
            Interface Language (22 Scheduled Languages)
          </div>
          <LanguageSelector className="w-full" />
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

      {/* Footer Area: App Update & Logout */}
      <div className="pt-3 border-t border-[#E2E8F0] space-y-2 mt-4">
        <AppUpdateButton />

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[8px] bg-white hover:bg-[#FEE2E2] border border-[#E2E8F0] text-xs font-bold text-[#DC2626] transition-all min-h-[40px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t.signOut}</span>
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
        <header className="app-top-header sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5 pt-[max(env(safe-area-inset-top),0.625rem)] flex items-center justify-between shadow-2xs gap-2">
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

          {/* Right Header Status Bar: Update Pill + Language Dropdown + Offline Toggle + Notifications */}
          <div className="flex items-center gap-2">
            {/* In-App Release & Update Checker Pill */}
            <AppUpdateHeaderPill />

            {/* Language Dropdown (Telugu, Hindi, English) */}
            <LanguageSelector variant="compact" />

            {/* Honest Connection Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full border min-h-[34px] ${
                isOffline
                  ? 'bg-[#FEF3C7] border-[#D97706]/40 text-[#92400E]'
                  : 'bg-[#DCFCE7] border-[#16A34A]/40 text-[#16A34A]'
              }`}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5 text-[#D97706]" /> : <Wifi className="w-3.5 h-3.5 text-[#16A34A]" />}
              <span className="text-[11px] hidden sm:inline">
                {isOffline ? 'Offline' : 'Online'}
              </span>
            </div>

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

        {/* Global Floating App Update Notification Banner */}
        <AppUpdateBanner />

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

        {/* Global Interactive In-App Update Modal */}
        <AppUpdateModal />
      </div>
    </div>
  );
};
