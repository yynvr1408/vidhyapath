// Security & Compliance Audit Trail Screen (Super Admin Level 1)
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Lock,
  FileText,
  Clock,
  Terminal,
  X,
} from 'lucide-react';
import { AuditLog } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface AuditLogsScreenProps {
  onBack?: () => void;
}

export const AuditLogsScreen: React.FC<AuditLogsScreenProps> = ({ onBack }) => {
  const { token } = useEnterpriseAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(searchTerm)) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'auth':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E0F2FE] text-[#0369A1]">AUTH</span>;
      case 'academic':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DCFCE7] text-[#15803D]">ACADEMIC</span>;
      case 'course':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FEF3C7] text-[#D97706]">COURSE</span>;
      case 'security':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EDE9FE] text-[#6D28D9]">SECURITY</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              <Shield className="w-6 h-6 text-[#0F766E]" />
              Security & Compliance Audit Trail
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Immutable logging of administrative actions, grading events, and security access.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-bold text-[#0F766E] hover:bg-[#F0FDFA] active:scale-95 transition-all shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 bg-[#F1F5F9] p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'auth', label: 'Authentication' },
            { id: 'academic', label: 'Academic & LMS' },
            { id: 'course', label: 'Courses' },
            { id: 'security', label: 'Security' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action code, actor, IP..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:border-[#0F766E] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          Loading audit trail...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Terminal className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="font-extrabold text-sm text-[#0F172A]">No audit logs recorded</h3>
          <p className="text-xs text-[#64748B] mt-1">Actions taken across the ecosystem will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#475569] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">{getCategoryBadge(log.category)}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-[#0F172A]">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#0F766E]">
                      {log.userId || 'system'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F766E] font-bold text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-extrabold text-base text-[#0F172A]">{selectedLog.action}</h3>
                <span className="text-[11px] text-[#64748B] font-mono">ID: {selectedLog.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] mb-1">Audit Details Payload</label>
              <pre className="p-3 bg-[#0F172A] text-[#38BDF8] rounded-xl text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
