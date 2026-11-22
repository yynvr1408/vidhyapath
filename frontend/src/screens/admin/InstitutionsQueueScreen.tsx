// Institution Approvals & Verification Queue Screen (Super Admin Level 1)
import React, { useState, useEffect } from 'react';
import {
  Building,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Mail,
  Shield,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Institution } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface InstitutionsQueueScreenProps {
  onBack?: () => void;
}

export const InstitutionsQueueScreen: React.FC<InstitutionsQueueScreenProps> = ({ onBack }) => {
  const { token } = useEnterpriseAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // In-app reject modal state (Replaces window.prompt)
  const [rejectingInst, setRejectingInst] = useState<Institution | null>(null);
  const [rejectReason, setRejectReason] = useState('Verification documents required or accreditation mismatch.');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchInstitutions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/institutions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setInstitutions(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch institutions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, [token]);

  const handleApprove = async (inst: Institution) => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/super-admin/institutions/${inst.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Approved ${inst.name}! Confirmation email sent to ${inst.contactEmail}.`);
        await fetchInstitutions();
      } else {
        setActionMessage(data.error || 'Failed to approve institution');
      }
    } catch (err: any) {
      setActionMessage('Failed to approve: ' + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingInst) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/super-admin/institutions/${rejectingInst.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Rejected ${rejectingInst.name}. Reason emailed to applicant.`);
        setRejectingInst(null);
        await fetchInstitutions();
      } else {
        setActionMessage(data.error || 'Failed to reject institution');
      }
    } catch (err: any) {
      setActionMessage('Failed to reject: ' + err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const pending = institutions.filter((i) => i.status === 'pending');
  const approved = institutions.filter((i) => i.status === 'approved');

  const filteredList = (tab === 'pending' ? pending : approved).filter((i) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.contactEmail && i.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-[#0F172A] flex items-center gap-2">
              <Building className="w-6 h-6 text-[#0F766E]" />
              Institution Approvals & Registration Queue
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Review and approve institutional onboarding requests across schools, colleges, and polytechnics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInstitutions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#0F766E] hover:bg-[#F0FDFA] active:scale-95 transition-all shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/40 text-xs font-bold text-[#0F766E] flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)} className="text-[#0F766E]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'pending'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Pending Approvals</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              pending.length > 0 ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#E2E8F0] text-[#64748B]'
            }`}>
              {pending.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              tab === 'approved'
                ? 'bg-white text-[#0F766E] shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span>Approved Institutions</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#16A34A]">
              {approved.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code, email..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:border-[#0F766E] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          Loading institutions...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Building className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="font-extrabold text-sm text-[#0F172A]">No institutions found</h3>
          <p className="text-xs text-[#64748B] mt-1">
            {tab === 'pending'
              ? 'No pending institutional applications in queue.'
              : 'No approved institutions matching your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-[#0F766E]/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded-md border border-[#0F766E]/20">
                      {inst.type} · {inst.code}
                    </span>
                    <h3 className="font-extrabold text-base text-[#0F172A] mt-1.5 leading-snug">
                      {inst.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shrink-0 ${
                      inst.status === 'approved'
                        ? 'bg-[#DCFCE7] text-[#16A34A]'
                        : 'bg-[#FEF3C7] text-[#D97706]'
                    }`}
                  >
                    {inst.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-[#475569]">
                  {inst.contactEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="font-mono text-[11px]">{inst.contactEmail}</span>
                    </div>
                  )}
                  {inst.contactPhone && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>Phone: <strong>{inst.contactPhone}</strong></span>
                    </div>
                  )}
                  {inst.address && (
                    <div className="text-[11px] text-[#64748B] truncate">
                      {inst.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Pending */}
              {inst.status === 'pending' && (
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingInst(inst)}
                    disabled={submittingAction}
                    className="px-3.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] font-bold text-xs border border-[#FECACA] active:scale-95 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(inst)}
                    disabled={submittingAction}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Institution</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Accessible In-App Rejection Modal (Zero browser alert/prompt) */}
      {rejectingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-[#0F172A]">Reject Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingInst(null)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#475569] leading-relaxed">
              You are about to reject the registration for <strong>{rejectingInst.name}</strong>. An email notification will be dispatched to <strong>{rejectingInst.contactEmail}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Reason for Rejection:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#CBD5E1] focus:border-[#DC2626] focus:outline-hidden"
                placeholder="State the compliance or document requirement..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingInst(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569] hover:bg-[#E2E8F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingAction || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-2xs active:scale-95 transition-all"
              >
                {submittingAction ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
