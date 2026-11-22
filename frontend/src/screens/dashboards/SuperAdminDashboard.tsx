// Platform Super Administrator Dashboard (Level 1)
import React, { useState, useEffect } from 'react';
import {
  Building,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  Layers,
  Cpu,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Institution, AuditLog } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

export const SuperAdminDashboard: React.FC = () => {
  const { token } = useEnterpriseAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [rejectModalInst, setRejectModalInst] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('Verification documents required or accreditation mismatch.');
  const [rejecting, setRejecting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch institutions
      const instRes = await fetch('/api/super-admin/institutions', { headers });
      if (instRes.ok) {
        setInstitutions(await instRes.json());
      }

      // Fetch stats
      const statsRes = await fetch('/api/super-admin/stats', { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch audit logs
      const auditRes = await fetch('/api/super-admin/audit-logs', { headers });
      if (auditRes.ok) {
        setAuditLogs(await auditRes.json());
      }
    } catch (err) {
      console.warn('Super admin dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleApprove = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/super-admin/institutions/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Approved ${name} successfully! Transactional confirmation email sent.`);
        await fetchData();
      }
    } catch (err: any) {
      setActionMessage('Failed to approve institution: ' + err.message);
    }
  };

  const handleOpenReject = (id: string, name: string) => {
    setRejectModalInst({ id, name });
  };

  const handleConfirmReject = async () => {
    if (!rejectModalInst) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/super-admin/institutions/${rejectModalInst.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Rejected ${rejectModalInst.name}. Feedback notification dispatched.`);
        setRejectModalInst(null);
        await fetchData();
      } else {
        setActionMessage(data.error || 'Failed to reject institution');
      }
    } catch (err: any) {
      setActionMessage('Failed to reject institution: ' + err.message);
    } finally {
      setRejecting(false);
    }
  };

  const pendingList = institutions.filter((i) => i.status === 'pending');
  const approvedList = institutions.filter((i) => i.status === 'approved');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-[12px] border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EDE9FE] text-[#6D28D9] mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Governance • Level 1 Authority</span>
          </div>
          <h2 className="text-xl font-black text-[#0F172A] tracking-tight">
            Platform Super Administrator Console
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Full oversight of multi-institution registrations, security policies, global academic catalog, and AI governance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-bold text-[#0F172A] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-[#DCFCE7] border border-[#86EFAC] rounded-[10px] text-xs font-bold text-[#166534] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)} className="text-[#166534] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Approved Institutions</div>
          <div className="text-2xl font-black text-[#0F766E] mt-1">
            {stats?.approvedInstitutions ?? approvedList.length}
          </div>
          <div className="text-[10px] text-[#059669] font-medium mt-1">Active on platform</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Pending Approvals</div>
          <div className="text-2xl font-black text-[#D97706] mt-1">
            {stats?.pendingInstitutions ?? pendingList.length}
          </div>
          <div className="text-[10px] text-[#B45309] font-medium mt-1">Require your review</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Registered Students</div>
          <div className="text-2xl font-black text-[#2563EB] mt-1">
            {stats?.studentsCount ?? 0}
          </div>
          <div className="text-[10px] text-[#1D4ED8] font-medium mt-1">Verified academic profiles</div>
        </div>

        <div className="p-4 bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs">
          <div className="text-[11px] font-bold text-[#64748B]">Security & Audit Logs</div>
          <div className="text-2xl font-black text-[#7C3AED] mt-1">
            {stats?.totalAuditLogs ?? auditLogs.length}
          </div>
          <div className="text-[10px] text-[#6D28D9] font-medium mt-1">Real-time event tracking</div>
        </div>
      </div>

      {/* PENDING APPROVAL QUEUE */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
              <Building className="w-4 h-4 text-[#D97706]" />
              <span>Pending Institution Registration Queue</span>
              {pendingList.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                  {pendingList.length} Action Needed
                </span>
              )}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Review institutional credentials, contact details, and approve or reject onboarding.
            </p>
          </div>
        </div>

        {pendingList.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B] bg-[#F8FAFC] rounded-[8px] border border-[#E2E8F0]">
            No pending institution requests at this time. All submissions have been processed!
          </div>
        ) : (
          <div className="space-y-3">
            {pendingList.map((inst) => (
              <div
                key={inst.id}
                className="p-4 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0F172A]">{inst.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#92400E]">
                      Code: {inst.code}
                    </span>
                    <span className="text-xs text-[#64748B] uppercase font-bold">• {inst.type}</span>
                  </div>
                  <div className="text-xs text-[#475569] mt-1">
                    Contact: <span className="font-semibold">{inst.contactEmail}</span> • {inst.contactPhone}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">{inst.address}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(inst.id, inst.name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Institution</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenReject(inst.id, inst.name)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-white hover:bg-[#FEE2E2] border border-[#CBD5E1] text-[#DC2626] text-xs font-bold active:scale-95 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPROVED INSTITUTIONS DIRECTORY */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Active Approved Institutions ({approvedList.length})</span>
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Operational institutions with active academic hierarchies, faculty assignments, and enrolled students.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-bold">
                <th className="py-2.5 px-3">Institution Name</th>
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Contact Email</th>
                <th className="py-2.5 px-3">AI Safety Policy</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {approvedList.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-3 font-bold text-[#0F172A]">{inst.name}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-[#0F766E]">{inst.code}</td>
                  <td className="py-3 px-3 capitalize font-medium text-[#475569]">{inst.type}</td>
                  <td className="py-3 px-3 text-[#475569]">{inst.contactEmail}</td>
                  <td className="py-3 px-3 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9] font-bold">
                      {inst.aiPolicy?.maxDailyQueriesStudent || 30} queries/day • Exam Guard Active
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                      Approved & Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AUDIT LOGS */}
      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs p-5 space-y-4">
        <div>
          <h3 className="font-extrabold text-sm text-[#0F172A] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#7C3AED]" />
            <span>Platform Security & Operational Audit Trail</span>
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Tamper-evident logs of logins, administrative approvals, syllabus publications, and blocked AI guardrail attempts.
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto border border-[#E2E8F0] rounded-[8px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-2 px-3 text-[#64748B] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        log.category === 'ai_guardrail'
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : log.category === 'auth'
                          ? 'bg-[#E0F2FE] text-[#0369A1]'
                          : 'bg-[#F3E8FF] text-[#7E22CE]'
                      }`}
                    >
                      {log.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono font-semibold text-[#0F172A]">{log.action}</td>
                  <td className="py-2 px-3 text-[#475569] text-[11px] truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    
      {/* Rejection Modal */}
      {rejectModalInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">Reject Institution Application</h3>
              <button
                type="button"
                onClick={() => setRejectModalInst(null)}
                className="text-xs text-[#64748B]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#475569]">
              Enter the reason for rejecting <strong>{rejectModalInst.name}</strong>. This feedback will be emailed to the applicant:
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-[#CBD5E1] focus:border-[#DC2626] focus:outline-hidden font-medium"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setRejectModalInst(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
