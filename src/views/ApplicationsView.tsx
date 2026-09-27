// FILE: frontend/src/views/ApplicationsView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { applicationApi } from '../services/api';

interface RecruiterInfo {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string;
  designation: string;
  companyName: string;
  profileImageUrl: string | null;
  verified: boolean;
}

interface JobDetails {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  companyWebsite: string;
  location: { city?: string; state?: string; country?: string; address?: string };
  workMode: string;
  jobType: string;
  contactPerson: { name?: string; designation?: string };
}

interface CandidateAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  memberSince: string;
}

interface WorkflowMeta {
  currentStatus: string;
  allowedNextStatuses: string[];
  currentStepIndex: number;
  totalSteps: number;
  isTerminal: boolean;
}

interface ApplicationItem {
  _id: string;
  jobId: string;
  userId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateCity: string;
  candidateSubLocation: string;
  candidateAvatarUrl: string;
  resumeUrl: string;
  resumeFileName: string;
  candidateSkills: string[];
  candidateLanguages: string[];
  candidateEnglishLevel: string;
  candidateExperience: string;
  candidateExperienceLevel: string;
  candidateJobTitle: string;
  candidateCurrentCompany: string;
  candidateCurrentSalary: string;
  candidateEducation: {
    collegeName: string;
    degree: string;
    specialization: string;
    endYear: string;
  };
  candidateAssets: string[];
  candidateCertifications: string[];
  jobTitle: string;
  jobCompany: string;
  jobCompanyLogo: string;
  jobSalary: string;
  jobLocation: string;
  jobHrName: string;
  jobHrRole: string;
  jobHrPhone: string;
  jobHrWhatsapp: string;
  matchPercentage: number;
  coverNote: string;
  status: string;
  category: string;
  hrNotes: string;
  milestones: Array<{
    title: string;
    time?: string;
    completed: boolean;
    statusText: string;
    isHighlight: boolean;
  }>;
  appliedAt: string;
  createdAt: string;
  recruiter?: RecruiterInfo | null;
  jobDetails?: JobDetails | null;
  candidateAccount?: CandidateAccount | null;
  workflow?: WorkflowMeta;
}

const WORKFLOW_STAGES = [
  { key: 'Applied', short: 'Apply', icon: 'send' },
  { key: 'Viewed', short: 'View', icon: 'visibility' },
  { key: 'Shortlisted', short: 'Short', icon: 'star' },
  { key: 'Interview', short: 'Intv', icon: 'event' },
  { key: 'Offered', short: 'Offer', icon: 'card_giftcard' },
  { key: 'Hired', short: 'Hired', icon: 'verified' },
];

const TERMINAL_STAGES = ['Rejected', 'Withdrawn'];

const statusColorMap: Record<string, string> = {
  Applied: 'bg-blue-100 text-blue-700 border-blue-200',
  Viewed: 'bg-purple-100 text-purple-700 border-purple-200',
  Shortlisted: 'bg-green-100 text-green-700 border-green-200',
  Interview: 'bg-amber-100 text-amber-700 border-amber-200',
  Offered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Hired: 'bg-green-200 text-green-800 border-green-300',
  Rejected: 'bg-red-100 text-red-700 border-red-200',
  Withdrawn: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Short-id helper — displays a short readable version of Mongo ObjectId
const shortId = (id?: string) => (id ? id.slice(-8).toUpperCase() : '—');

export const ApplicationsView: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await applicationApi.getApplications(params);
      if (res.success) {
        setApplications(res.data);
        setTotalPages(res.pagination.pages);
        setTotal(res.pagination.total);
        setCounts(res.counts);
        if (selectedApp) {
          const updated = res.data.find((a: ApplicationItem) => a._id === selectedApp._id);
          if (updated) setSelectedApp(updated);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch applications', 'error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await applicationApi.updateApplicationStatus(id, newStatus);
      if (res.success) {
        showToast(`✓ Moved to ${newStatus}`, 'success');
        if (res.data && selectedApp?._id === id) setSelectedApp(res.data);
        fetchApplications();
      } else {
        showToast(res.message || 'Update failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
      setConfirmAction(null);
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await applicationApi.bulkUpdateStatus(selectedIds, status);
      if (res.success) {
        showToast(res.message || `Updated to ${status}`, 'success');
        setSelectedIds([]);
        fetchApplications();
      }
    } catch (err: any) {
      showToast(err.message || 'Bulk update failed', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this application permanently?')) return;
    try {
      await applicationApi.deleteApplication(id);
      showToast('Application deleted', 'success');
      if (selectedApp?._id === id) setSelectedApp(null);
      fetchApplications();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) setSelectedIds([]);
    else setSelectedIds(applications.map((a) => a._id));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied`, 'info'));
  };

  const matchColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  const statusFilters = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];

  const forceDownloadResume = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'resume.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentStageIndex = useMemo(() => {
    if (!selectedApp) return -1;
    return WORKFLOW_STAGES.findIndex((s) => s.key === selectedApp.status);
  }, [selectedApp]);

  const isTerminalStatus = selectedApp && TERMINAL_STAGES.includes(selectedApp.status);
  const isHiredFinal = selectedApp?.status === 'Hired';

  // ═══════════════════════════════════════════════════════════════
  // RESOLVE RECRUITER DISPLAY (from populated recruiter OR fallback to jobHr fields)
  // ═══════════════════════════════════════════════════════════════
  const getRecruiterDisplay = (app: ApplicationItem) => {
    if (app.recruiter && app.recruiter.name) {
      return {
        id: app.recruiter.id,
        name: app.recruiter.name,
        role: app.recruiter.designation || 'Recruiter',
        company: app.recruiter.companyName || app.jobCompany,
        email: app.recruiter.email,
        phone: app.recruiter.mobileNumber,
        whatsapp: app.recruiter.whatsappNumber,
        avatar: app.recruiter.profileImageUrl,
        verified: app.recruiter.verified,
        source: 'db' as const,
      };
    }
    // Fallback to jobHr* fields on application
    return {
      id: null,
      name: app.jobHrName || 'Unknown Recruiter',
      role: app.jobHrRole || 'HR',
      company: app.jobCompany,
      email: '',
      phone: app.jobHrPhone,
      whatsapp: app.jobHrWhatsapp,
      avatar: null,
      verified: false,
      source: 'fallback' as const,
    };
  };

  return (
    <div className="space-y-3">
      {/* ═══════════ COMPACT HEADER ═══════════ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[22px] text-primary">description</span>
            Applications
            <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
          </h1>
        </div>
        <button
          onClick={fetchApplications}
          className="px-2.5 py-1.5 rounded-md border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* ═══════════ COMPACT FILTER CHIPS ═══════════ */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); setSelectedApp(null); }}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
          }`}
        >
          All ({counts.total || 0})
        </button>
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); setSelectedApp(null); }}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              statusFilter === s
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : `${statusColorMap[s]} hover:opacity-80`
            }`}
          >
            {s} ({counts[s.toLowerCase()] || 0})
          </button>
        ))}
      </div>

      {/* ═══════════ COMPACT SEARCH & BULK ═══════════ */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search name, email, phone, job..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-surface-variant bg-surface-container-low text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/20 rounded-md px-2 py-1">
            <span className="text-xs font-medium text-primary">{selectedIds.length} selected</span>
            <select
              onChange={(e) => { if (e.target.value) handleBulkAction(e.target.value); e.target.value = ''; }}
              className="text-xs border border-primary/30 rounded px-1.5 py-0.5 bg-white cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Bulk Action...</option>
              {statusFilters.map((s) => <option key={s} value={s}>Move to {s}</option>)}
            </select>
            <button onClick={() => setSelectedIds([])} className="text-[10px] text-outline hover:text-error px-1">Clear</button>
          </div>
        )}
      </div>

      {/* ═══════════ SPLIT LAYOUT ═══════════ */}
      <div className={`grid gap-3 ${selectedApp ? 'grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        {/* ═════════ LEFT: COMPACT LIST ═════════ */}
        <div className="space-y-1.5">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-xs text-outline mt-2">Loading...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-lg border border-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-outline">description</span>
              <p className="text-sm font-medium text-on-surface mt-1">No applications found</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 px-1 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === applications.length && applications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                />
                <span className="text-[10px] text-outline">Select all ({applications.length})</span>
              </label>

              {applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-surface-container-lowest rounded-lg border p-2.5 cursor-pointer transition-all ${
                    selectedApp?._id === app._id
                      ? 'border-primary shadow-md ring-1 ring-primary/30'
                      : 'border-surface-variant hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app._id)}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(app._id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-3.5 h-3.5 rounded accent-primary cursor-pointer shrink-0"
                    />
                    {app.candidateAvatarUrl ? (
                      <img
                        src={app.candidateAvatarUrl}
                        alt={app.candidateName}
                        className="w-9 h-9 rounded-full object-cover border border-surface-variant shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {app.candidateName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-on-surface text-[13px] truncate leading-tight">{app.candidateName}</h3>
                          <p className="text-[11px] text-on-surface-variant truncate leading-tight">
                            {app.candidateJobTitle || 'Candidate'}
                          </p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${matchColor(app.matchPercentage)}`}>
                          {app.matchPercentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className={`text-[9px] px-1.5 py-0 rounded font-medium border ${statusColorMap[app.status]}`}>
                          {app.status}
                        </span>
                        {app.candidateCity && (
                          <span className="text-[9px] text-outline">📍{app.candidateCity}</span>
                        )}
                        <span className="text-[9px] text-outline">• {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                        → <strong>{app.jobTitle}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-2 py-1 rounded-md bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer"
              >
                ← Prev
              </button>
              <span className="text-xs text-on-surface-variant">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 rounded-md bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* ═════════ RIGHT: DETAIL PANEL ═════════ */}
        {selectedApp && (
          <div className="bg-surface-container-lowest rounded-lg border border-surface-variant overflow-hidden">
            {/* ── STICKY COMPACT HEADER ── */}
            <div className="sticky top-0 z-10 bg-white border-b border-surface-variant px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {selectedApp.candidateAvatarUrl ? (
                  <img
                    src={selectedApp.candidateAvatarUrl}
                    alt={selectedApp.candidateName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {selectedApp.candidateName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-bold text-sm text-on-surface truncate">{selectedApp.candidateName}</h2>
                    <span className={`text-[9px] px-1.5 py-0 rounded font-medium border ${statusColorMap[selectedApp.status]}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    {selectedApp.candidateJobTitle}
                    {selectedApp.candidateCurrentCompany ? ` @ ${selectedApp.candidateCurrentCompany}` : ''}
                    &nbsp;• ID: <code className="text-[10px]">{shortId(selectedApp._id)}</code>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Compact match circle */}
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none" className="text-surface-container-high" />
                    <circle
                      cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="3" fill="none"
                      strokeDasharray={`${(selectedApp.matchPercentage / 100) * 106.8} 106.8`}
                      className={matchColor(selectedApp.matchPercentage)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className={`absolute inset-0 flex items-center justify-center font-bold text-[10px] ${matchColor(selectedApp.matchPercentage)}`}>
                    {selectedApp.matchPercentage}%
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="w-7 h-7 rounded-md hover:bg-surface-container flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">

              {/* ═════════ COMPACT PIPELINE ═════════ */}
              <section className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-semibold text-xs text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-primary">timeline</span>
                    Hiring Pipeline
                  </h3>
                  {isTerminalStatus && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium border ${statusColorMap[selectedApp.status]}`}>
                      {selectedApp.status}
                    </span>
                  )}
                </div>

                {/* Horizontal compact steps */}
                <div className="flex items-center gap-0 mb-3">
                  {WORKFLOW_STAGES.map((stage, idx) => {
                    const isCompleted = currentStageIndex > idx;
                    const isCurrent = currentStageIndex === idx;
                    return (
                      <React.Fragment key={stage.key}>
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                            isCompleted ? 'bg-green-500 text-white'
                              : isCurrent ? 'bg-primary text-white ring-2 ring-primary/30'
                              : 'bg-surface-container-high text-outline'
                          }`}>
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-[13px]">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-[13px]">{stage.icon}</span>
                            )}
                          </div>
                          <span className={`text-[8px] mt-1 font-semibold ${
                            isCurrent ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-outline'
                          }`}>
                            {stage.short}
                          </span>
                        </div>
                        {idx < WORKFLOW_STAGES.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-0.5 mt-[-14px] ${
                            isCompleted ? 'bg-green-500' : 'bg-surface-container-high'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Action buttons */}
                {!isTerminalStatus && !isHiredFinal && selectedApp.workflow && (
                  <div className="pt-2 border-t border-primary/10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-outline font-medium mr-1">Next:</span>
                      {selectedApp.workflow.allowedNextStatuses.length === 0 ? (
                        <p className="text-[10px] text-outline italic">No further actions</p>
                      ) : (
                        selectedApp.workflow.allowedNextStatuses.map((nextStatus) => {
                          const isReject = nextStatus === 'Rejected' || nextStatus === 'Withdrawn';
                          return (
                            <button
                              key={nextStatus}
                              onClick={() => setConfirmAction({ status: nextStatus, label: nextStatus })}
                              disabled={updatingStatus}
                              className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                                isReject
                                  ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                                  : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[11px]">
                                {isReject ? 'close' : 'arrow_forward'}
                              </span>
                              {nextStatus}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ═════════ 2-COL GRID: CONTACT + JOB ═════════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* CONTACT */}
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">contact_page</span>
                    Candidate Contact
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <MiniRow
                      icon="mail"
                      value={selectedApp.candidateEmail}
                      href={`mailto:${selectedApp.candidateEmail}`}
                      onCopy={() => copyToClipboard(selectedApp.candidateEmail, 'Email')}
                    />
                    <MiniRow
                      icon="call"
                      value={selectedApp.candidatePhone}
                      href={`tel:${selectedApp.candidatePhone}`}
                      onCopy={() => copyToClipboard(selectedApp.candidatePhone, 'Phone')}
                    />
                    <MiniRow
                      icon="location_on"
                      value={`${selectedApp.candidateCity}${selectedApp.candidateSubLocation ? ', ' + selectedApp.candidateSubLocation : ''}`}
                    />
                    <MiniRow
                      icon="paid"
                      value={`₹${selectedApp.candidateCurrentSalary || 'Not disclosed'}`}
                    />
                  </div>
                  {selectedApp.candidateAccount && (
                    <div className="mt-2 pt-2 border-t border-surface-variant flex items-center justify-between text-[10px] text-outline">
                      <span>Member since {new Date(selectedApp.candidateAccount.memberSince).toLocaleDateString()}</span>
                      <span className={`px-1.5 py-0 rounded ${selectedApp.candidateAccount.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {selectedApp.candidateAccount.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                  )}
                </section>

                {/* JOB */}
                <section className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px] text-blue-600">work</span>
                    Job Applied For
                  </h3>
                  <div className="flex items-start gap-2">
                    {selectedApp.jobCompanyLogo && (
                      <img
                        src={selectedApp.jobCompanyLogo}
                        alt=""
                        className="w-8 h-8 rounded object-cover border border-surface-variant shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-on-surface truncate">{selectedApp.jobTitle}</p>
                      <p className="text-[11px] text-on-surface-variant truncate">{selectedApp.jobCompany}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-outline">
                    <span className="flex items-center gap-0.5 truncate">📍 {selectedApp.jobLocation}</span>
                    <span className="flex items-center gap-0.5 truncate">💰 {selectedApp.jobSalary}</span>
                    {selectedApp.jobDetails?.jobType && <span className="truncate">⏱ {selectedApp.jobDetails.jobType}</span>}
                    {selectedApp.jobDetails?.workMode && <span className="truncate">🏢 {selectedApp.jobDetails.workMode}</span>}
                  </div>
                  <p className="text-[9px] text-outline mt-1.5 font-mono">Job ID: {shortId(selectedApp.jobId)}</p>
                </section>
              </div>

              {/* ═════════ RECRUITER (COMPACT + PROFESSIONAL) ═════════ */}
              {(() => {
                const rec = getRecruiterDisplay(selectedApp);
                return (
                  <section className="bg-purple-50/50 border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-[13px] text-purple-600">badge</span>
                        Recruiter / Job Poster
                      </h3>
                      {rec.verified && (
                        <span className="text-[9px] px-1.5 py-0 rounded-full bg-blue-500 text-white font-medium flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[9px]">verified</span> Verified
                        </span>
                      )}
                      {rec.source === 'fallback' && (
                        <span className="text-[9px] px-1.5 py-0 rounded bg-amber-100 text-amber-700 font-medium" title="Recruiter data missing from DB - showing job HR fallback">
                          ⚠ Fallback
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      {rec.avatar ? (
                        <img
                          src={rec.avatar}
                          alt={rec.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-purple-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                          {rec.name?.charAt(0)?.toUpperCase() || 'R'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-on-surface truncate">{rec.name}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {rec.role}{rec.company ? ` • ${rec.company}` : ''}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {rec.email && (
                            <a href={`mailto:${rec.email}`} className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline truncate">
                              <span className="material-symbols-outlined text-[11px]">mail</span>
                              {rec.email}
                            </a>
                          )}
                          {rec.phone && (
                            <a href={`tel:${rec.phone}`} className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline">
                              <span className="material-symbols-outlined text-[11px]">call</span>
                              {rec.phone}
                            </a>
                          )}
                          {rec.whatsapp && (
                            <a
                              href={`https://wa.me/${rec.whatsapp.replace(/\D/g, '')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] text-green-600 hover:underline"
                            >
                              <span className="material-symbols-outlined text-[11px]">chat</span>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-outline uppercase font-semibold">Rec ID</p>
                        <code className="text-[10px] font-mono text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                          {rec.id ? shortId(rec.id) : 'N/A'}
                        </code>
                      </div>
                    </div>
                  </section>
                );
              })()}

              {/* ═════════ RESUME (COMPACT) ═════════ */}
              {selectedApp.resumeUrl && (
                <section className="bg-surface-container-low rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-red-600 text-[18px]">picture_as_pdf</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{selectedApp.resumeFileName || 'Resume.pdf'}</p>
                      <p className="text-[9px] text-outline">PDF Document</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setShowResumeModal(true)}
                      className="px-2 py-1 rounded bg-primary text-on-primary text-[10px] font-medium hover:opacity-90 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">visibility</span>
                      View
                    </button>
                    <button
                      onClick={() => forceDownloadResume(selectedApp.resumeUrl, selectedApp.resumeFileName)}
                      className="px-2 py-1 rounded border border-surface-variant text-[10px] font-medium hover:bg-surface-container flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">download</span>
                      Download
                    </button>
                    <a
                      href={selectedApp.resumeUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="px-2 py-1 rounded border border-surface-variant text-[10px] font-medium hover:bg-surface-container flex items-center gap-0.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      Open
                    </a>
                  </div>
                </section>
              )}

              {/* ═════════ EXPERIENCE + EDUCATION ═════════ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">work_history</span>
                    Experience
                  </h3>
                  <div className="space-y-1 text-xs">
                    <InfoRow label="Level" value={selectedApp.candidateExperienceLevel} />
                    <InfoRow label="Years" value={`${selectedApp.candidateExperience} yrs`} />
                    <InfoRow label="Current Role" value={selectedApp.candidateJobTitle} />
                    <InfoRow label="Company" value={selectedApp.candidateCurrentCompany} />
                  </div>
                </section>

                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">school</span>
                    Education
                  </h3>
                  {selectedApp.candidateEducation ? (
                    <div className="space-y-1 text-xs">
                      <InfoRow label="Degree" value={selectedApp.candidateEducation.degree} />
                      <InfoRow label="Specialization" value={selectedApp.candidateEducation.specialization} />
                      <InfoRow label="College" value={selectedApp.candidateEducation.collegeName} />
                      <InfoRow label="End Year" value={selectedApp.candidateEducation.endYear} />
                    </div>
                  ) : (
                    <p className="text-[10px] text-outline italic">No education details</p>
                  )}
                </section>
              </div>

              {/* ═════════ SKILLS ═════════ */}
              {selectedApp.candidateSkills?.length > 0 && (
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">psychology</span>
                    Skills <span className="text-outline">({selectedApp.candidateSkills.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.candidateSkills.map((skill, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ═════════ 3-COL: LANGUAGES / ASSETS / CERTS ═════════ */}
              {(selectedApp.candidateLanguages?.length > 0 || selectedApp.candidateAssets?.length > 0 || selectedApp.candidateCertifications?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedApp.candidateLanguages?.length > 0 && (
                    <ChipSection
                      title="Languages"
                      icon="language"
                      items={selectedApp.candidateLanguages}
                      chipClass="bg-blue-50 text-blue-700"
                      footer={selectedApp.candidateEnglishLevel ? `English: ${selectedApp.candidateEnglishLevel}` : undefined}
                    />
                  )}
                  {selectedApp.candidateAssets?.length > 0 && (
                    <ChipSection
                      title="Documents"
                      icon="badge"
                      items={selectedApp.candidateAssets}
                      chipClass="bg-emerald-50 text-emerald-700"
                    />
                  )}
                  {selectedApp.candidateCertifications?.length > 0 && (
                    <ChipSection
                      title="Certifications"
                      icon="workspace_premium"
                      items={selectedApp.candidateCertifications}
                      chipClass="bg-amber-50 text-amber-700"
                    />
                  )}
                </div>
              )}

              {/* ═════════ COVER NOTE ═════════ */}
              {selectedApp.coverNote && (
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-1.5 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">edit_note</span>
                    Cover Note
                  </h3>
                  <p className="text-xs text-on-surface-variant italic leading-relaxed">"{selectedApp.coverNote}"</p>
                </section>
              )}

              {/* ═════════ TIMELINE (COMPACT) ═════════ */}
              {selectedApp.milestones?.length > 0 && (
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-2 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">history</span>
                    Activity Timeline
                  </h3>
                  <div className="space-y-2 pl-1.5 border-l-2 border-surface-variant ml-1">
                    {selectedApp.milestones.map((m, i) => (
                      <div key={i} className="relative">
                        <div className={`absolute -left-[7px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div className="pl-3">
                          <p className="text-[11px] font-medium text-on-surface leading-tight">{m.title}</p>
                          {m.time && <p className="text-[9px] text-outline">{m.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ═════════ HR NOTES + DELETE ═════════ */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                <section className="bg-surface-container-low rounded-lg p-3">
                  <h3 className="font-semibold text-[11px] text-on-surface flex items-center gap-1 mb-1 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[13px]">sticky_note_2</span>
                    Internal HR Notes
                  </h3>
                  <p className="text-xs text-on-surface-variant italic">{selectedApp.hrNotes || 'No notes added yet.'}</p>
                </section>
                <button
                  onClick={() => handleDelete(selectedApp._id)}
                  className="px-3 py-2 rounded-md border border-red-300 text-red-700 text-xs hover:bg-red-50 transition-all cursor-pointer flex items-center gap-1 h-fit"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ CONFIRMATION MODAL ═══════════ */}
      {confirmAction && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-on-surface mb-2">Confirm Status Change</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Move <strong>{selectedApp.candidateName}</strong> from{' '}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColorMap[selectedApp.status]}`}>{selectedApp.status}</span>
              &nbsp;to&nbsp;
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColorMap[confirmAction.status]}`}>{confirmAction.status}</span>?
            </p>
            <p className="text-[10px] text-outline mb-3 italic">This action will be logged.</p>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-md border border-surface-variant text-xs hover:bg-surface-container-low cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(selectedApp._id, confirmAction.status)}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-md bg-primary text-on-primary text-xs font-medium hover:opacity-90 cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {updatingStatus && <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ RESUME PREVIEW MODAL ═══════════ */}
      {showResumeModal && selectedApp?.resumeUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px]">picture_as_pdf</span>
                <h3 className="font-semibold text-sm">{selectedApp.resumeFileName || 'Resume'}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => forceDownloadResume(selectedApp.resumeUrl, selectedApp.resumeFileName)}
                  className="px-2.5 py-1 rounded border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">download</span>
                  Download
                </button>
                <button
                  onClick={() => setShowResumeModal(false)}
                  className="w-7 h-7 rounded-md hover:bg-surface-container-low flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <iframe
                src={`${selectedApp.resumeUrl}#toolbar=1&navpanes=0`}
                title="Resume Preview"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-xs font-medium flex items-center gap-1.5 ${
          toast.type === 'error' ? 'bg-red-600 text-white'
            : toast.type === 'info' ? 'bg-blue-600 text-white'
            : 'bg-green-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-[16px]">
            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT UI HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════
const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div className="flex justify-between gap-2 text-[11px]">
    <span className="text-outline shrink-0">{label}:</span>
    <span className="text-on-surface font-medium text-right truncate">{value || '—'}</span>
  </div>
);

const MiniRow: React.FC<{
  icon: string;
  value: string;
  href?: string;
  onCopy?: () => void;
}> = ({ icon, value, href, onCopy }) => (
  <div className="flex items-center gap-1.5 group">
    <span className="material-symbols-outlined text-[13px] text-outline shrink-0">{icon}</span>
    {href ? (
      <a href={href} className="text-[11px] text-primary hover:underline truncate flex-1 min-w-0">
        {value || '—'}
      </a>
    ) : (
      <span className="text-[11px] text-on-surface truncate flex-1 min-w-0">{value || '—'}</span>
    )}
    {onCopy && value && (
      <button
        onClick={onCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-surface-container rounded cursor-pointer shrink-0"
        title="Copy"
      >
        <span className="material-symbols-outlined text-[12px] text-outline">content_copy</span>
      </button>
    )}
  </div>
);

const ChipSection: React.FC<{
  title: string;
  icon: string;
  items: string[];
  chipClass: string;
  footer?: string;
}> = ({ title, icon, items, chipClass, footer }) => (
  <div className="bg-surface-container-low rounded-lg p-3">
    <h3 className="font-semibold text-[10px] text-on-surface flex items-center gap-1 mb-1.5 uppercase tracking-wide">
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      {title}
    </h3>
    <div className="flex flex-wrap gap-1">
      {items.map((item, i) => (
        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${chipClass}`}>
          {item}
        </span>
      ))}
    </div>
    {footer && <p className="text-[9px] text-outline mt-1.5">{footer}</p>}
  </div>
);