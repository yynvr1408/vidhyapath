// Announcements & Circulars Notice Board Screen
import React, { useState, useEffect } from 'react';
import {
  Send,
  Plus,
  ArrowLeft,
  RefreshCw,
  Calendar,
  AlertCircle,
  User,
  X,
  Megaphone,
} from 'lucide-react';
import { useEnterpriseAuth } from '../../context/EnterpriseAuthContext';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent' | 'important';
  targetAudience: string;
  authorName: string;
  createdAt: number;
}

interface AnnouncementsScreenProps {
  onBack?: () => void;
}

export const AnnouncementsScreen: React.FC<AnnouncementsScreenProps> = ({ onBack }) => {
  const { user, activeRole, token } = useEnterpriseAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'important'>('normal');
  const [targetAudience, setTargetAudience] = useState('all');
  const [creating, setCreating] = useState(false);

  const canPost = ['super_admin', 'institution_admin', 'academic_admin', 'teacher'].includes(activeRole);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.warn('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          priority,
          targetAudience,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('Announcement posted successfully!');
        setShowCreateModal(false);
        setTitle('');
        setContent('');
        await fetchAnnouncements();
      } else {
        setStatusMessage(data.error || 'Failed to post announcement');
      }
    } catch (err: any) {
      setStatusMessage('Error posting announcement: ' + err.message);
    } finally {
      setCreating(false);
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
              <Megaphone className="w-6 h-6 text-[#0F766E]" />
              Official Announcements & Circulars
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              Important circulars, exam schedules, and institutional notices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-[#CBD5E1] text-[#0F766E] hover:bg-[#F0FDFA] active:scale-95 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canPost && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold active:scale-95 transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Post Notice</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#0F766E]/40 text-xs font-bold text-[#0F766E] flex items-center justify-between animate-fadeIn">
          <span>{statusMessage}</span>
          <button type="button" onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Announcements Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F766E]" />
          Loading announcements...
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center">
          <Megaphone className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-60" />
          <h3 className="font-extrabold text-sm text-[#0F172A]">No announcements posted yet</h3>
          <p className="text-xs text-[#64748B] mt-1">
            {canPost ? 'Click "Post Notice" to dispatch a circular.' : 'All clear! No current circulars or alerts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
                ann.priority === 'urgent'
                  ? 'border-[#FECACA] bg-[#FFF5F5]'
                  : ann.priority === 'important'
                  ? 'border-[#FDE68A] bg-[#FFFBEB]'
                  : 'border-[#E2E8F0]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ann.priority === 'urgent'
                        ? 'bg-[#DC2626] text-white'
                        : ann.priority === 'important'
                        ? 'bg-[#D97706] text-white'
                        : 'bg-[#F0FDFA] text-[#0F766E]'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    Audience: <strong>{ann.targetAudience}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                  <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-[#0F172A] mt-3">{ann.title}</h3>
              <p className="text-xs text-[#475569] mt-1.5 leading-relaxed whitespace-pre-line">
                {ann.content}
              </p>

              <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center gap-2 text-[11px] text-[#64748B]">
                <User className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>Posted by: <strong>{ann.authorName}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-extrabold text-base text-[#0F172A]">Post New Notice / Circular</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Assessment Schedule & Guidelines"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white font-bold"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1">Target Audience</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white font-bold"
                  >
                    <option value="all">Everyone</option>
                    <option value="students">Students Only</option>
                    <option value="teachers">Faculty Only</option>
                    <option value="guardians">Parents / Guardians</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">Notice Body / Details</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write notice details, deadlines, and action steps..."
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] font-medium"
                />
              </div>

              <div className="flex items-end justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-bold text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold shadow-2xs"
                >
                  {creating ? 'Posting...' : 'Dispatch Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
