// Global & Institutional User Directory Screen (RBAC Levels 1 - 3)
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Mail,
  Shield,
  GraduationCap,
  Building,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { User, UserRole } from '../../types/enterprise';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface UsersDirectoryScreenProps {
  onBack?: () => void;
}

export const UsersDirectoryScreen: React.FC<UsersDirectoryScreenProps> = ({ onBack }) => {
  const { token } = useEnterpriseAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch user directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((u.studentProfile?.rollNumber || (u as any).rollNumber) && (u.studentProfile?.rollNumber || (u as any).rollNumber).toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EDE9FE] text-[#6D28D9]">Super Admin</span>;
      case 'institution_admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E0F2FE] text-[#0369A1]">Institution Admin</span>;
      case 'teacher':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DCFCE7] text-[#15803D]">Teacher / Faculty</span>;
      case 'guardian':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FDF2F8] text-[#BE185D]">Parent / Guardian</span>;
      case 'student':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#F0FDFA] text-[#0F766E]">Student</span>;
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
              <Users className="w-6 h-6 text-[#0F766E]" />
              User & Identity Directory
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Manage student enrollments, faculty profiles, and institutional roles across the ecosystem.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#0F766E] hover:bg-[#F0FDFA] active:scale-95 transition-all"
            title="Refresh User List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Role Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-[#F1F5F9] p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'student', label: 'Students' },
            { id: 'teacher', label: 'Faculty' },
            { id: 'guardian', label: 'Guardians' },
            { id: 'institution_admin', label: 'Admins' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setRoleFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === pill.id
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, roll number..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#0F172A] focus:border-[#0F766E] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          Loading user records...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Users className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="font-extrabold text-sm text-[#0F172A]">No users match this filter</h3>
          <p className="text-xs text-[#64748B] mt-1">Try switching roles or clearing the search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">User & Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Roll / Code</th>
                  <th className="py-3 px-4">Institution / Family</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-[#0F172A]">{u.fullName}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                      {u.studentProfile?.rollNumber || (u as any).rollNumber || (u as any).details?.loginCode || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#475569]">
                      {u.institutionName || (u as any).details?.familyId ? 'Family Linked' : 'Independent'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
