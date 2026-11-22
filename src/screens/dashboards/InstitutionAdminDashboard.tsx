// Institution Administrator Dashboard (Level 2)
// Institutional Command Matrix, Academic Departments, AI Policy & Syllabus Ingestion
import React, { useState, useEffect } from 'react';
import {
  Building,
  GraduationCap,
  Users,
  BookOpen,
  Plus,
  Send,
  Calendar,
  Layers,
  CheckCircle2,
  FileText,
  UserPlus,
  Cloud,
  Check,
  Shield,
  Clock,
  UploadCloud,
  Sparkles,
  Sliders,
  Bell,
  RefreshCw,
  ArrowRight,
  Filter,
  Download,
  AlertCircle,
  X,
  FileUp,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';
import { Department, Programme, Subject } from '../../types/enterprise';

interface InstitutionAdminDashboardProps {
  onNavigateToSyllabus?: () => void;
}

interface PendingFaculty {
  id: string;
  name: string;
  department: string;
  specialization: string;
  avatar: string;
  status: 'pending' | 'approved';
}

export const InstitutionAdminDashboard: React.FC<InstitutionAdminDashboardProps> = ({ onNavigateToSyllabus }) => {
  const { user, token } = useEnterpriseAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherDept, setTeacherDept] = useState('');
  const [teacherDesignation, setTeacherDesignation] = useState('Assistant Professor');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  // Toast / Status Message
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Guardrails Modal
  const [guardrailsModalOpen, setGuardrailsModalOpen] = useState(false);
  const [dailyCap, setDailyCap] = useState(40);
  const [temperature, setTemperature] = useState(0.1);
  const [socraticStrict, setSocraticStrict] = useState(true);

  // Broadcast Modal
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'academic' | 'infrastructure'>('academic');

  // Campus Broadcasts
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 'b-1',
      tag: 'Academic Alert',
      tagType: 'academic',
      timeAgo: '2h ago',
      title: 'Mid-Term Examinations Timetable Released',
      desc: 'Autonomous Term-1 schema published. Dispatched to 4,820 students and 184 faculty rosters across mobile app alerts.',
      delivered: true,
      openRate: '91%',
    },
    {
      id: 'b-2',
      tag: 'Infrastructure',
      tagType: 'infrastructure',
      timeAgo: 'Yesterday',
      title: 'Offline Server Node Synchronization Completed',
      desc: 'North Campus and Transit Campus storage mirrors fully refreshed with latest lecture recordings and lab manuals.',
      delivered: true,
      openRate: '100%',
    },
  ]);

  // Pending Faculty Approvals
  const [facultyApprovals, setFacultyApprovals] = useState<PendingFaculty[]>([
    {
      id: 'f-1',
      name: 'Prof. Manoj Kumar',
      department: 'CSE',
      specialization: 'AI & Robotics Specialization',
      avatar: 'MK',
      status: 'pending',
    },
    {
      id: 'f-2',
      name: 'Dr. Shreya Lahiri',
      department: 'Physics',
      specialization: 'Quantum Photonics Lab',
      avatar: 'SL',
      status: 'pending',
    },
    {
      id: 'f-3',
      name: 'Prof. R. T. Reddy',
      department: 'Mech Eng',
      specialization: 'Thermodynamics II',
      avatar: 'RT',
      status: 'pending',
    },
  ]);

  const instId = user?.institutionId || 'inst_ait_hyd';

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Departments
      const deptRes = await fetch(`/api/institution/${instId}/departments`, { headers });
      if (deptRes.ok) {
        const d = await deptRes.json();
        if (Array.isArray(d) && d.length > 0) setDepartments(d);
      }

      // Programmes
      const progRes = await fetch(`/api/institution/${instId}/programmes`, { headers });
      if (progRes.ok) {
        const p = await progRes.json();
        if (Array.isArray(p) && p.length > 0) setProgrammes(p);
      }

      // Subjects
      const subjRes = await fetch('/api/academic/student-syllabus');
      if (subjRes.ok) {
        const d = await subjRes.json();
        setSubjects(d.subjects || []);
      }
    } catch (err) {
      console.warn('Institution admin fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [instId]);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleInviteTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail || !teacherName) return;

    try {
      const res = await fetch(`/api/institution/${instId}/invite-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: teacherEmail,
          fullName: teacherName,
          departmentId: teacherDept || departments[0]?.id || 'dept_cse',
          designation: teacherDesignation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteStatus(`Invitation email successfully dispatched to ${teacherEmail}!`);
        setTeacherEmail('');
        setTeacherName('');
        setTimeout(() => {
          setInviteModalOpen(false);
          setInviteStatus(null);
        }, 2000);
      } else {
        setInviteStatus('Error: ' + data.error);
      }
    } catch (err: any) {
      setInviteStatus('Network error: ' + err.message);
    }
  };

  const handleApproveFaculty = (id: string, name: string) => {
    setFacultyApprovals((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'approved' } : f))
    );
    showToast(`Faculty credentials approved for ${name}. Handshake dispatched.`);
  };

  const handleResendInvite = (name: string) => {
    showToast(`Verification invitation re-sent to ${name}.`);
  };

  const handlePostBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle) return;
    const newBroadcast = {
      id: `b-${Date.now()}`,
      tag: broadcastType === 'academic' ? 'Academic Alert' : 'Infrastructure',
      tagType: broadcastType,
      timeAgo: 'Just now',
      title: broadcastTitle,
      desc: broadcastMessage || 'Urgent institutional advisory for students and faculty rosters.',
      delivered: true,
      openRate: '0%',
    };
    setBroadcasts([newBroadcast, ...broadcasts]);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastModalOpen(false);
    showToast('Campus broadcast published across mobile and web feeds.');
  };

  // Canonical departments display data
  const defaultDepartmentRows = [
    {
      code: 'CS',
      name: 'Computer Science & Eng.',
      enrolled: '1,420 Enrolled',
      hod: 'Dr. V. Srinivas',
      email: 'srinivas.cs@ait.edu.in',
      facultyCount: 48,
      batches: '12 Units',
      coverage: 92,
      status: 'Ahead',
      color: 'bg-[#80d5cb]/40 text-[#005c55]',
      progressColor: 'bg-[#0f766e]',
    },
    {
      code: 'EC',
      name: 'Electronics & Comm.',
      enrolled: '980 Enrolled',
      hod: 'Dr. Ananya Ray',
      email: 'ray.ece@ait.edu.in',
      facultyCount: 36,
      batches: '8 Units',
      coverage: 86,
      status: 'On Track',
      color: 'bg-[#dae2fd] text-[#0047bf]',
      progressColor: 'bg-[#0f766e]',
    },
    {
      code: 'ME',
      name: 'Mechanical Engineering',
      enrolled: '740 Enrolled',
      hod: 'Prof. B. Somanna',
      email: 'somanna.me@ait.edu.in',
      facultyCount: 28,
      batches: '6 Units',
      coverage: 64,
      status: 'Reviewing',
      color: 'bg-[#dae2fd] text-[#3e4947]',
      progressColor: 'bg-[#fe932c]',
    },
    {
      code: 'HU',
      name: 'Humanities & Social Sciences',
      enrolled: 'Core All Years',
      hod: 'Dr. P. Arundhati',
      email: 'arundhati.h@ait.edu.in',
      facultyCount: 32,
      batches: '10 Units',
      coverage: 94,
      status: 'Ahead',
      color: 'bg-[#dae2fd] text-[#904d00]',
      progressColor: 'bg-[#0f766e]',
    },
    {
      code: 'PH',
      name: 'Physics & Applied Sciences',
      enrolled: '1st Year Foundation',
      hod: 'Dr. M. Chaitanya',
      email: 'chaitanya.sci@ait.edu.in',
      facultyCount: 40,
      batches: '6 Units',
      coverage: 78,
      status: 'On Track',
      color: 'bg-[#80d5cb]/30 text-[#0f766e]',
      progressColor: 'bg-[#0f766e]',
    },
  ];

  return (
    <div className="flex flex-col w-full space-y-6 animate-fadeIn pb-12">
      {/* Action Toast */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0F172A] text-white text-xs font-bold shadow-xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#80d5cb]" />
          <span>{actionToast}</span>
        </div>
      )}

      {/* Top Academic Context Header & Sync Beacon */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#3e4947] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0f766e] animate-pulse"></span>
            <span>Institutional Command Matrix</span>
            <span>/</span>
            <span className="text-[#005c55] font-extrabold">Academic Year 2024-2025 (Term 1)</span>
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl lg:text-3xl font-black text-[#131b2e] tracking-tight">
              {user?.institutionName || 'Apex Institute of Technology & Sciences'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#dae2fd] text-[#3e4947] text-xs font-bold">
              Autonomous • NAAC A++
            </span>
          </div>
          <p className="text-xs text-[#3e4947] mt-1">
            Multi-campus administrative orchestration, automated syllabus alignment, and pedagogical AI governance.
          </p>
        </div>

        {/* Quick Action / Status Center */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f2f3ff] text-[#131b2e] border border-[#dae2fd]">
            <Cloud className="w-4 h-4 text-[#005c55]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-[#3e4947] uppercase font-bold tracking-wider leading-none">
                Local Edge Sync
              </span>
              <span className="text-xs font-black text-[#131b2e] leading-tight mt-0.5">
                Transit Nodes Live (4/4)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToSyllabus) {
                onNavigateToSyllabus();
              } else {
                showToast('Opening Syllabus Upload Pipeline');
              }
            }}
            className="h-11 px-4 rounded-xl bg-[#0f766e] text-white text-xs font-bold hover:bg-[#005c55] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Term Curriculum</span>
          </button>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="h-11 px-4 rounded-xl bg-white border border-[#CBD5E1] text-[#131b2e] text-xs font-bold hover:bg-[#F8FAFC] transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[#0f766e]" />
            <span>Onboard Faculty</span>
          </button>
        </div>
      </div>

      {/* Key Metrics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric 1: Students */}
        <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-[#005c55] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#131b2e]">4,820</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#80d5cb]/30 text-[#005c55] text-[10px] font-bold">
              +12% YoY
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#F1F5F9]">
            <span className="w-2 h-2 rounded-full bg-[#0f766e]"></span>
            <span className="text-[11px] text-[#64748B] font-medium">98.4% Sync Rate across 42 batches</span>
          </div>
        </div>

        {/* Metric 2: Faculty */}
        <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Active Faculty Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-[#0047bf] flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#131b2e]">184</span>
            <span className="text-xs font-bold text-[#0047bf]">8 Departments</span>
          </div>
          <div className="flex items-center justify-between text-[#64748B] text-[11px] font-medium mt-3 pt-2 border-t border-[#F1F5F9]">
            <span>1:26 Faculty-Student Ratio</span>
            <span className="text-[#005c55] font-bold">100% Verified</span>
          </div>
        </div>

        {/* Metric 3: Syllabus Parse Queue */}
        <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Syllabus AI Parse Queue
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdcc3] text-[#904d00] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-[#131b2e]">6</span>
              <span className="text-xs font-bold text-[#904d00]">Pending Approval</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#fe932c]/20 text-[#904d00] text-[10px] font-bold">
              High Priority
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#F1F5F9]">
            <Clock className="w-3.5 h-3.5 text-[#904d00]" />
            <span className="text-[11px] text-[#64748B] font-medium">Auto-parsing 2 syllabi currently</span>
          </div>
        </div>

        {/* Metric 4: AI Usage & Token Budget */}
        <div className="p-4 rounded-xl bg-white border border-[#CBD5E1] shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              AI Token Budget (Monthly)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#f2f3ff] text-[#005c55] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#131b2e]">74%</span>
            <span className="text-[11px] text-[#64748B] font-medium">3.7M / 5.0M Tokens</span>
          </div>
          <div className="w-full bg-[#E2E8F0] rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-[#0f766e] h-full rounded-full transition-all duration-700" style={{ width: '74%' }} />
          </div>
          <div className="flex items-center justify-between text-[#64748B] text-[10px] font-bold mt-2">
            <span className="text-[#005c55]">Socratic Guardrails Active</span>
            <span>Resets in 9d</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout (Asymmetric 2-Column: Wide / Narrower) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMN 1 (Wide: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Section 1: Academic Departments & Headcount */}
          <div className="rounded-xl bg-white border border-[#CBD5E1] shadow-xs overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9]">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#0f766e]" />
                  <h2 className="text-sm font-extrabold text-[#131b2e]">
                    Academic Departments & Headcount
                  </h2>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Core curriculum distribution across primary technical colleges
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Applied departmental filter')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#131b2e] text-xs font-bold hover:bg-[#F1F5F9] transition-colors flex items-center gap-1"
                >
                  <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Filter</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Audit report exported successfully')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#131b2e] text-xs font-bold hover:bg-[#F1F5F9] transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Audit Export</span>
                </button>
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-3">HOD / Lead</th>
                    <th className="py-2.5 px-2 text-center">Faculty</th>
                    <th className="py-2.5 px-2 text-center">Batches</th>
                    <th className="py-2.5 px-3">Syllabus Coverage</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#131b2e]">
                  {defaultDepartmentRows.map((dept, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${dept.color}`}>
                            {dept.code}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[#131b2e]">{dept.name}</div>
                            <div className="text-[10px] text-[#64748B]">{dept.enrolled}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-xs text-[#131b2e]">{dept.hod}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{dept.email}</div>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-xs text-[#131b2e]">
                        {dept.facultyCount}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-[#dae2fd]/60 text-[#131b2e] text-[10px] font-bold">
                          {dept.batches}
                        </span>
                      </td>
                      <td className="py-3 px-3 w-40">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#005c55]">{dept.coverage}%</span>
                          <span className="text-[10px] text-[#64748B]">{dept.status}</span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`${dept.progressColor} h-full rounded-full transition-all duration-500`}
                            style={{ width: `${dept.coverage}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => showToast(`Opening ${dept.name} settings`)}
                            className="px-2 py-1 rounded text-[#005c55] hover:bg-[#80d5cb]/20 font-bold text-xs transition-colors"
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Allocating faculty to ${dept.code}`)}
                            className="px-2 py-1 rounded text-[#64748B] hover:bg-[#F1F5F9] font-medium text-xs transition-colors"
                          >
                            Allocate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#64748B] font-medium">
                Showing 5 of 8 academic departments
              </span>
              <button
                type="button"
                onClick={() => showToast('All 8 departments loaded')}
                className="font-bold text-xs text-[#005c55] hover:underline flex items-center gap-1"
              >
                <span>View All Departments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 2: Syllabus PDF Auto-Parsing Pipeline */}
          <div className="rounded-xl bg-white border border-[#CBD5E1] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0f766e]" />
                  <h2 className="text-sm font-extrabold text-[#131b2e]">
                    Syllabus PDF Auto-Parsing Pipeline
                  </h2>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  NLP engine transforms raw university regulation PDFs into structured competency trees
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#80d5cb]/30 text-[#005c55] text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#005c55] animate-ping"></span>
                Parser v2.4 Live
              </span>
            </div>

            {/* Ingestion Status Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* Card 1: Completed Parse */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F1F5F9] transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#CBD5E1] text-[#005c55] flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#005c55]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#131b2e] truncate">
                        CBSE_Class10_Math_Curriculum_v2.pdf
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#80d5cb]/30 text-[#005c55] text-[10px] font-bold">
                        15 Chapters Mapped
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      Parsed 100% • Standard aligned with CBSE R24 guidelines • 48 Topics extracted
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToSyllabus) onNavigateToSyllabus();
                      else showToast('Inspecting CBSE Curriculum');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#131b2e] transition-colors flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Inspect</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Curriculum published live to all Class 10 student devices.')}
                    className="px-3 py-1.5 rounded-lg bg-[#0f766e] text-white text-xs font-bold hover:bg-[#005c55] transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Review & Publish</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Parsing in Progress */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#F1F5F9] transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#CBD5E1] text-[#904d00] flex items-center justify-center shrink-0 shadow-xs">
                    <RefreshCw className="w-5 h-5 text-[#904d00] animate-spin" />
                  </div>
                  <div className="flex flex-col min-w-0 w-full md:w-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#131b2e] truncate">
                        JNTU_DataStructures_BTech_R23.pdf
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#fe932c]/20 text-[#904d00] text-[10px] font-bold">
                        Parsing 68%
                      </span>
                    </div>
                    <div className="w-full md:w-64 bg-[#E2E8F0] rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-[#fe932c] h-full rounded-full transition-all duration-300" style={{ width: '68%' }} />
                    </div>
                    <div className="text-[10px] text-[#64748B] mt-1">
                      Extracting chapter learning outcomes & lab prerequisites...
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  <button
                    type="button"
                    onClick={() => showToast('Parsing job canceled')}
                    className="px-2.5 py-1.5 text-xs text-[#64748B] hover:text-[#131b2e] font-bold"
                  >
                    Cancel Job
                  </button>
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 rounded-lg bg-[#E2E8F0] text-[#94A3B8] text-xs font-bold cursor-not-allowed"
                  >
                    Processing
                  </button>
                </div>
              </div>

              {/* Dropzone Container */}
              <div
                onClick={() => {
                  if (onNavigateToSyllabus) onNavigateToSyllabus();
                  else showToast('Opening Syllabus Ingestion Dropzone');
                }}
                className="p-6 rounded-xl bg-white border-2 border-dashed border-[#CBD5E1] hover:border-[#0f766e] hover:bg-[#F8FAFC] transition-all flex flex-col items-center justify-center text-center cursor-pointer group min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-full bg-[#f2f3ff] group-hover:bg-[#80d5cb]/30 text-[#005c55] flex items-center justify-center mb-2 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-[#131b2e]">
                  Drag & drop syllabus PDF or University Scheme file
                </div>
                <p className="text-[11px] text-[#64748B] max-w-md mt-1">
                  Supports AICTE, JNTU-H, CBSE, and State Board formats up to 45MB. OCR active for scanned circulars.
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-[#005c55]" />
                  <span>Institution Schema Compliance Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 (Narrower: 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Section 1: Institution AI Policy & Guardrails Summary */}
          <div className="rounded-xl bg-white border border-[#CBD5E1] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0f766e]" />
                <h3 className="text-sm font-extrabold text-[#131b2e]">AI Policy & Guardrails</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#80d5cb]/30 text-[#005c55] text-[10px] font-bold uppercase">
                Enforced
              </span>
            </div>

            {/* Guardrail Status Box */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#005c55] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-[#131b2e]">Socratic Step-by-Step Enforced</div>
                  <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                    Direct answer generation and code completion are disabled for undergraduate accounts. AI acts strictly as an inquisitive tutor.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                <span>Student Daily Cap: <strong className="text-[#131b2e]">{dailyCap} Turns</strong></span>
                <span>Hallucination Filter: <strong className="text-[#005c55] font-bold">Rigid ({temperature} Temp)</strong></span>
              </div>
            </div>

            {/* Language Distribution Mini Matrix */}
            <div>
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-2">
                Multilingual Interaction Distribution
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center">
                  <span className="text-xs font-bold text-[#005c55]">English</span>
                  <span className="text-lg font-black text-[#131b2e] my-0.5">62%</span>
                  <span className="text-[10px] text-[#64748B]">Primary Medium</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center">
                  <span className="text-xs font-bold text-[#005c55]">తెలుగు</span>
                  <span className="text-lg font-black text-[#131b2e] my-0.5">24%</span>
                  <span className="text-[10px] text-[#64748B]">State Regional</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center">
                  <span className="text-xs font-bold text-[#005c55]">हिन्दी</span>
                  <span className="text-lg font-black text-[#131b2e] my-0.5">14%</span>
                  <span className="text-[10px] text-[#64748B]">National Core</span>
                </div>
              </div>
            </div>

            {/* Quick AI Adjust Button */}
            <button
              type="button"
              onClick={() => setGuardrailsModalOpen(true)}
              className="w-full h-11 px-4 rounded-xl bg-[#f2f3ff] hover:bg-[#dae2fd] text-[#131b2e] text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-[#dae2fd]"
            >
              <Sliders className="w-4 h-4 text-[#005c55]" />
              <span>Adjust AI Guardrails & Token Limits</span>
            </button>
          </div>

          {/* Section 2: Recent Institutional Announcements & Notices */}
          <div className="rounded-xl bg-white border border-[#CBD5E1] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#904d00]" />
                <h3 className="text-sm font-extrabold text-[#131b2e]">Campus Broadcasts</h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#0f766e] text-white text-xs font-bold hover:bg-[#005c55] transition-colors flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Broadcast</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {broadcasts.map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.tagType === 'academic'
                          ? 'bg-[#fe932c]/20 text-[#904d00]'
                          : 'bg-[#dae2fd] text-[#131b2e]'
                      }`}
                    >
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-[#64748B]">{item.timeAgo}</span>
                  </div>
                  <h4 className="font-bold text-xs text-[#131b2e] mt-0.5">{item.title}</h4>
                  <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{item.desc}</p>
                  <div className="flex items-center gap-3 text-[10px] text-[#94A3B8] mt-1 pt-1 border-t border-[#F1F5F9]">
                    <span className="flex items-center gap-1 text-[#005c55] font-bold">
                      <Check className="w-3 h-3" /> Delivered
                    </span>
                    <span>•</span>
                    <span>Open Rate: {item.openRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pending Faculty Invites & Approvals */}
          <div className="rounded-xl bg-white border border-[#CBD5E1] shadow-xs p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#0f766e]" />
                <h3 className="text-sm font-extrabold text-[#131b2e]">Pending Faculty Approvals</h3>
              </div>
              <span className="w-6 h-6 rounded-full bg-[#fe932c]/20 text-[#904d00] text-center text-xs font-bold flex items-center justify-center">
                {facultyApprovals.filter((f) => f.status === 'pending').length}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] -mt-2">
              Awaiting institutional domain handshake & digital signature
            </p>

            <div className="flex flex-col gap-2">
              {facultyApprovals.map((faculty) => (
                <div
                  key={faculty.id}
                  className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2 hover:bg-[#F1F5F9] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-xs shrink-0">
                      {faculty.avatar}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-[#131b2e] truncate">{faculty.name}</span>
                      <span className="text-[10px] text-[#64748B] truncate">
                        {faculty.department} • {faculty.specialization}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {faculty.status === 'approved' ? (
                      <span className="px-2.5 py-1 rounded bg-[#80d5cb]/30 text-[#005c55] text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveFaculty(faculty.id, faculty.name)}
                          className="px-2.5 py-1 rounded bg-[#0f766e] text-white text-xs font-bold hover:bg-[#005c55] transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResendInvite(faculty.name)}
                          className="px-2 py-1 text-xs text-[#64748B] hover:text-[#131b2e] font-medium"
                        >
                          Resend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FACULTY ONBOARDING MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0f766e]" />
                <h3 className="font-extrabold text-base text-[#131b2e]">Onboard Faculty Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#131b2e] hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteStatus && (
              <div className="p-3 bg-[#80d5cb]/20 text-[#005c55] border border-[#80d5cb] rounded-lg text-xs font-bold">
                {inviteStatus}
              </div>
            )}

            <form onSubmit={handleInviteTeacher} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Faculty Full Name</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="faculty@institution.edu"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Department</label>
                <select
                  value={teacherDept}
                  onChange={(e) => setTeacherDept(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] bg-white font-medium"
                >
                  <option value="dept_cse">Computer Science & Engineering (CSE)</option>
                  <option value="dept_ece">Electronics & Communication (ECE)</option>
                  <option value="dept_mech">Mechanical Engineering (ME)</option>
                  <option value="dept_humanities">Humanities & Social Sciences (HU)</option>
                  <option value="dept_physics">Physics & Applied Sciences (PH)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Designation</label>
                <input
                  type="text"
                  value={teacherDesignation}
                  onChange={(e) => setTeacherDesignation(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#005c55] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Send Invitation Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI GUARDRAILS MODAL */}
      {guardrailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0f766e]" />
                <h3 className="font-extrabold text-base text-[#131b2e]">Configure Institutional AI Policy</h3>
              </div>
              <button
                type="button"
                onClick={() => setGuardrailsModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#131b2e] hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Daily Question Cap per Student ({dailyCap} turns)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={dailyCap}
                  onChange={(e) => setDailyCap(Number(e.target.value))}
                  className="w-full accent-[#0f766e]"
                />
                <div className="flex justify-between text-[10px] text-[#64748B]">
                  <span>10 (Conservation)</span>
                  <span>40 (Recommended)</span>
                  <span>100 (Unrestricted)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Model Temperature / Hallucination Filter ({temperature})
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="0.7"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-[#0f766e]"
                />
                <div className="flex justify-between text-[10px] text-[#64748B]">
                  <span>0.0 (Deterministic)</span>
                  <span>0.1 (Strict)</span>
                  <span>0.7 (Creative)</span>
                </div>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#131b2e]">Socratic Step-by-Step Only</div>
                  <div className="text-[11px] text-[#64748B]">Prevents direct homework answer delivery</div>
                </div>
                <input
                  type="checkbox"
                  checked={socraticStrict}
                  onChange={(e) => setSocraticStrict(e.target.checked)}
                  className="w-4 h-4 text-[#0f766e] rounded accent-[#0f766e]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuardrailsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuardrailsModalOpen(false);
                    showToast('AI Policy updated and broadcasted to edge inference nodes.');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#005c55] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Save & Apply Guardrails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POST BROADCAST MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#904d00]" />
                <h3 className="font-extrabold text-base text-[#131b2e]">Post Campus Broadcast</h3>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#131b2e] hover:bg-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostBroadcast} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Broadcast Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastType('academic')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      broadcastType === 'academic'
                        ? 'border-[#0f766e] bg-[#80d5cb]/20 text-[#005c55]'
                        : 'border-[#CBD5E1] text-[#64748B]'
                    }`}
                  >
                    Academic Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastType('infrastructure')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      broadcastType === 'infrastructure'
                        ? 'border-[#0f766e] bg-[#80d5cb]/20 text-[#005c55]'
                        : 'border-[#CBD5E1] text-[#64748B]'
                    }`}
                  >
                    Infrastructure
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Broadcast Headline</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. End-Semester Practical Exam Schedule"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#0f766e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Details & Instructions</label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Provide circular details for students and staff..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] focus:outline-hidden focus:border-[#0f766e]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-bold text-[#475569] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0f766e] hover:bg-[#005c55] text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
