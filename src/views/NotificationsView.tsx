// FILE: frontend/src/views/NotificationsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../services/api';

interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetAudience: string;
  channels: { inApp?: boolean; email?: boolean };
  type: string;
  actionUrl?: string;
  status: string;
  sentAt?: string;
  scheduledAt?: string;
  stats: {
    totalTargeted: number;
    inAppDelivered: number;
    emailSent: number;
    emailFailed: number;
  };
  sentBy: { adminName: string; adminEmail: string };
  createdAt: string;
}

interface PreviewCount {
  total: number;
  candidates: number;
  recruiters: number;
  withEmail: number;
}

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ draft: 0, sent: 0, scheduled: 0, failed: 0, total: 0 });
  const [previewCount, setPreviewCount] = useState<PreviewCount | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Compose form
  const [form, setForm] = useState({
    title: '',
    body: '',
    imageUrl: '',
    targetAudience: 'all' as 'all' | 'candidates' | 'recruiters' | 'specific',
    type: 'general',
    actionUrl: '',
    channelInApp: true,
    channelEmail: false,
    filterCity: '',
    filterState: '',
    filterExperienceLevel: '',
    filterIndustry: '',
    filterSkills: '',
    scheduledAt: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await notificationApi.getNotifications(params);
      if (res.success) {
        setNotifications(res.data);
        setTotalPages(res.pagination.pages);
        setCounts(res.counts);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    if (activeTab === 'history') fetchNotifications();
  }, [activeTab, fetchNotifications]);

  const handlePreviewCount = async () => {
    setPreviewLoading(true);
    try {
      const filters: Record<string, any> = {};
      if (form.filterCity) filters.city = form.filterCity;
      if (form.filterState) filters.state = form.filterState;
      if (form.filterExperienceLevel) filters.experienceLevel = form.filterExperienceLevel;
      if (form.filterIndustry) filters.industry = form.filterIndustry;
      if (form.filterSkills) {
        filters.skills = form.filterSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      const res = await notificationApi.previewCount({
        targetAudience: form.targetAudience,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      if (res.success) {
        setPreviewCount(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to preview count', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showToast('Title and body are required', 'error');
      return;
    }

    if (!form.channelInApp && !form.channelEmail) {
      showToast('Please select at least one delivery channel', 'error');
      return;
    }

    setSending(true);
    try {
      const filters: Record<string, any> = {};
      if (form.filterCity) filters.city = form.filterCity;
      if (form.filterState) filters.state = form.filterState;
      if (form.filterExperienceLevel) filters.experienceLevel = form.filterExperienceLevel;
      if (form.filterIndustry) filters.industry = form.filterIndustry;
      if (form.filterSkills) {
        filters.skills = form.filterSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      const payload: any = {
        title: form.title,
        body: form.body,
        targetAudience: form.targetAudience,
        type: form.type,
        channels: {
          inApp: form.channelInApp,
          email: form.channelEmail,
        },
      };

      if (form.imageUrl) payload.imageUrl = form.imageUrl;
      if (form.actionUrl) payload.actionUrl = form.actionUrl;
      if (Object.keys(filters).length > 0) payload.filters = filters;
      if (form.scheduledAt) payload.scheduledAt = form.scheduledAt;

      const res = await notificationApi.sendNotification(payload);
      showToast(res.message || 'Notification sent!', 'success');

      // Reset form
      setForm({
        title: '', body: '', imageUrl: '', targetAudience: 'all', type: 'general',
        actionUrl: '', channelInApp: true, channelEmail: false,
        filterCity: '', filterState: '', filterExperienceLevel: '', filterIndustry: '',
        filterSkills: '', scheduledAt: '',
      });
      setPreviewCount(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await notificationApi.deleteNotification(id);
      showToast('Notification deleted', 'success');
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const statusColors: Record<string, string> = {
    sent: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
    cancelled: 'bg-orange-100 text-orange-700',
  };

  const typeIcons: Record<string, string> = {
    general: 'campaign',
    job_alert: 'work',
    promotion: 'local_offer',
    system: 'settings',
    reminder: 'alarm',
    update: 'update',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Save notifications to database — mobile app will fetch and display them automatically
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 w-fit">
        {(['compose', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">
              {tab === 'compose' ? 'edit_note' : 'history'}
            </span>
            {tab === 'compose' ? 'Compose' : 'History'}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* COMPOSE TAB */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="xl:col-span-2 space-y-5">
            {/* Notification Content */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Notification Content
              </h2>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. New Job Alert: 50+ Openings in Bangalore!"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="text-xs text-outline mt-1">{form.title.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Body *</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your notification message here..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
                <p className="text-xs text-outline mt-1">{form.body.length}/1000</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Action URL (optional)</label>
                  <input
                    type="url"
                    value={form.actionUrl}
                    onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                    placeholder="https://careerflow.app/jobs/123"
                    className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="job_alert">Job Alert</option>
                    <option value="promotion">Promotion</option>
                    <option value="system">System</option>
                    <option value="reminder">Reminder</option>
                    <option value="update">Update</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Schedule (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-surface-variant bg-surface-container-low text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Target Audience & Filters */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                Target Audience
              </h2>

              <div className="flex flex-wrap gap-2">
                {(['all', 'candidates', 'recruiters'] as const).map((aud) => (
                  <button
                    key={aud}
                    onClick={() => setForm({ ...form, targetAudience: aud })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      form.targetAudience === aud
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {aud === 'all' ? '👥 All Users' : aud === 'candidates' ? '🧑‍💼 Candidates Only' : '🏢 Recruiters Only'}
                  </button>
                ))}
              </div>

              {/* Advanced Filters */}
              <details className="group">
                <summary className="text-sm font-medium text-primary cursor-pointer flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Advanced Filters (Optional)
                  <span className="material-symbols-outlined text-[14px] group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.filterCity}
                    onChange={(e) => setForm({ ...form, filterCity: e.target.value })}
                    placeholder="City (e.g. Bangalore)"
                    className="px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={form.filterState}
                    onChange={(e) => setForm({ ...form, filterState: e.target.value })}
                    placeholder="State (e.g. Karnataka)"
                    className="px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={form.filterExperienceLevel}
                    onChange={(e) => setForm({ ...form, filterExperienceLevel: e.target.value })}
                    placeholder="Experience Level (e.g. Fresher)"
                    className="px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={form.filterIndustry}
                    onChange={(e) => setForm({ ...form, filterIndustry: e.target.value })}
                    placeholder="Industry (e.g. IT)"
                    className="px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={form.filterSkills}
                    onChange={(e) => setForm({ ...form, filterSkills: e.target.value })}
                    placeholder="Skills (comma separated)"
                    className="px-3 py-2 rounded-lg border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary md:col-span-2"
                  />
                </div>
              </details>

              <button
                onClick={handlePreviewCount}
                disabled={previewLoading}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm font-medium hover:bg-surface-container-highest transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">preview</span>
                {previewLoading ? 'Counting...' : 'Preview Target Count'}
              </button>

              {previewCount && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Users', value: previewCount.total, icon: 'group' },
                    { label: 'Candidates', value: previewCount.candidates, icon: 'person' },
                    { label: 'Recruiters', value: previewCount.recruiters, icon: 'business' },
                    { label: 'With Email', value: previewCount.withEmail, icon: 'email' },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">{item.icon}</span>
                      <p className="text-xl font-bold text-on-surface">{item.value.toLocaleString()}</p>
                      <p className="text-[10px] text-outline">{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel — Channels & Send */}
          <div className="space-y-5">
            {/* Delivery Channels */}
            <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">send</span>
                Delivery Channels
              </h2>

              {[
                {
                  key: 'channelInApp' as const,
                  label: 'In-App Notification',
                  icon: 'notifications_active',
                  desc: 'Saved to database — mobile app will fetch and display it automatically',
                },
                {
                  key: 'channelEmail' as const,
                  label: 'Email',
                  icon: 'email',
                  desc: 'Also send an email to all recipients via SMTP',
                },
              ].map((ch) => (
                <label
                  key={ch.key}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[ch.key]}
                    onChange={(e) => setForm({ ...form, [ch.key]: e.target.checked })}
                    className="mt-0.5 w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">{ch.icon}</span>
                      <span className="text-sm font-medium text-on-surface">{ch.label}</span>
                    </div>
                    <p className="text-xs text-outline mt-0.5">{ch.desc}</p>
                  </div>
                </label>
              ))}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-600 mt-0.5">info</span>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>How it works:</strong> The notification is saved to your database.
                  Your mobile app fetches new notifications automatically when users open the app
                  or via periodic polling.
                </p>
              </div>
            </div>

            {/* Preview Card */}
            {form.title && (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-variant p-6">
                <h2 className="text-sm font-semibold text-outline mb-3">PREVIEW</h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[16px]">
                        {typeIcons[form.type] || 'campaign'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">CareerFlow</p>
                      <p className="text-sm font-bold text-gray-900">{form.title}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{form.body}</p>
                  {form.imageUrl && (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="w-full h-32 object-cover rounded-lg mt-2"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sending || !form.title.trim() || !form.body.trim()}
              className="w-full py-4 rounded-xl bg-primary text-on-primary font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Sending...
                </>
              ) : form.scheduledAt ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                  Schedule Notification
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Send Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* HISTORY TAB */}
      {/* ═══════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: counts.total, color: 'text-on-surface', bg: 'bg-surface-container-high' },
              { label: 'Sent', value: counts.sent, color: 'text-green-700', bg: 'bg-green-50' },
              { label: 'Scheduled', value: counts.scheduled, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Failed', value: counts.failed, color: 'text-red-700', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-outline">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Notification List */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-sm text-outline mt-3">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-[48px] text-outline">notifications_off</span>
              <p className="text-lg font-medium text-on-surface mt-2">No notifications found</p>
              <p className="text-sm text-outline">Send your first notification from the Compose tab</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => setSelectedNotification(selectedNotification?._id === n._id ? null : n)}
                  className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                          {typeIcons[n.type] || 'campaign'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-on-surface truncate">{n.title}</h3>
                        <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              statusColors[n.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {n.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-medium">
                            {n.targetAudience}
                          </span>
                          {n.channels?.inApp && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">notifications</span>
                              In-App
                            </span>
                          )}
                          {n.channels?.email && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[10px]">email</span>
                              Email
                            </span>
                          )}
                          <span className="text-[10px] text-outline">
                            {n.sentAt
                              ? new Date(n.sentAt).toLocaleString()
                              : new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-lg font-bold text-on-surface">
                        {n.stats.totalTargeted.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-outline">targeted</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n._id);
                        }}
                        className="text-error hover:bg-error/10 p-1 rounded transition-all cursor-pointer"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedNotification?._id === n._id && (
                    <div className="mt-4 pt-4 border-t border-surface-variant grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-purple-50 rounded-lg">
                        <p className="text-lg font-bold text-purple-700">
                          {n.stats.inAppDelivered}
                        </p>
                        <p className="text-[10px] text-purple-600">In-App Delivered</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-700">{n.stats.emailSent}</p>
                        <p className="text-[10px] text-blue-600">Emails Sent</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded-lg">
                        <p className="text-lg font-bold text-amber-700">{n.stats.emailFailed}</p>
                        <p className="text-[10px] text-amber-600">Emails Failed</p>
                      </div>
                      <div className="col-span-full text-xs text-outline">
                        Sent by: <strong>{n.sentBy.adminName}</strong> ({n.sentBy.adminEmail})
                      </div>
                      {n.actionUrl && (
                        <div className="col-span-full text-xs text-outline">
                          Action URL:{' '}
                          <a
                            href={n.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {n.actionUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-sm text-on-surface-variant">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in ${
            toast.type === 'error' ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
};