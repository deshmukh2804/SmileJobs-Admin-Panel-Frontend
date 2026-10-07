// FILE: frontend/src/views/JobApprovalsView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { jobApi } from '../services/api';
import { JobItem } from '../types';

interface JobApprovalsViewProps {
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onInspectJob: (job: JobItem) => void;
  onRefresh: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const JobApprovalsView: React.FC<JobApprovalsViewProps> = ({
  onApprove,
  onReject,
  onInspectJob,
  onRefresh,
  onToast,
}) => {
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchPendingJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobApi.getJobs({ status: 'Pending' });
      if (res.success && res.data) {
        setPendingJobs(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending jobs:', err);
      onToast('Failed to load pending jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    fetchPendingJobs();
    const interval = setInterval(fetchPendingJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingJobs]);

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pendingJobs;
    return pendingJobs.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.companyName?.toLowerCase().includes(q) ||
      j._id?.toLowerCase().includes(q)
    );
  }, [pendingJobs, searchQuery]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await onApprove(id);
      setPendingJobs(prev => prev.filter(j => (j._id || j.id) !== id));
      fetchPendingJobs();
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      onToast('Please provide a rejection reason', 'error');
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      await onReject(rejectModal.id, rejectReason.trim());
      setPendingJobs(prev => prev.filter(j => (j._id || j.id) !== rejectModal.id));
      setRejectModal(null);
      setRejectReason('');
      fetchPendingJobs();
      onRefresh();
    } finally {
      setActionLoading(null);
    }
  };

  const getTimeSince = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffH = Math.floor((now - then) / (1000 * 60 * 60));
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.floor(diffH / 24)}d ago`;
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ─── Reject Modal ─── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-rose-600">block</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Reject Job Listing</h3>
                <p className="text-xs text-outline truncate max-w-[280px]">{rejectModal.title}</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-on-surface mb-2">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g. Salary information missing, misleading job title, incomplete company details..."
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
            />
            <p className="text-[10px] text-outline mt-1">
              This reason will be emailed to the recruiter so they can fix issues and resubmit.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                disabled={actionLoading === rejectModal.id}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm font-semibold hover:bg-surface-container-highest disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading === rejectModal.id || !rejectReason.trim()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading === rejectModal.id ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    Rejecting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    Reject Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
              Admin Workflow
            </span>
            {pendingJobs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                {pendingJobs.length} AWAITING REVIEW
              </span>
            )}
          </div>
          <h1 className="text-2xl text-on-surface font-extrabold mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            Job Approval Queue
          </h1>
          <p className="text-sm text-outline mt-0.5">
            Review and approve job postings submitted by recruiters before they go live.
          </p>
        </div>
        <button
          onClick={fetchPendingJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-bold hover:bg-surface-container-high shadow-sm text-sm disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">Pending Approval</span>
            <span className="p-1.5 rounded-lg bg-amber-500 text-white">
              <span className="material-symbols-outlined text-[16px]">pending</span>
            </span>
          </div>
          <h3 className="text-3xl text-amber-900 font-extrabold mt-3">{pendingJobs.length}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline">Approved Today</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
            </span>
          </div>
          <h3 className="text-3xl text-on-surface font-extrabold mt-3">—</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline">Rejected Today</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-[16px]">block</span>
            </span>
          </div>
          <h3 className="text-3xl text-on-surface font-extrabold mt-3">—</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-outline">Avg Review Time</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-[16px]">timer</span>
            </span>
          </div>
          <h3 className="text-3xl text-on-surface font-extrabold mt-3">~2h</h3>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined text-outline absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, or job ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-xs font-medium"
          />
        </div>
      </div>

      {/* ─── Pending Jobs List ─── */}
      {loading && filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-surface-container-lowest rounded-2xl border border-outline-variant">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl mb-3">progress_activity</span>
          <p className="font-bold text-outline">Loading pending jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
          </div>
          <p className="font-extrabold text-lg text-emerald-900 mb-1">All caught up! 🎉</p>
          <p className="text-xs text-emerald-700 max-w-sm text-center">
            {pendingJobs.length === 0 ? 'No jobs are pending approval right now.' : 'No jobs match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const jobId = job._id || job.id;
            const isLoadingThis = actionLoading === jobId;

            return (
              <div
                key={jobId}
                className="bg-surface-container-lowest border-2 border-amber-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Job Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                      {job.companyLogo?.url ? (
                        <img src={job.companyLogo.url} alt={job.companyName} className="w-full h-full object-cover" />
                      ) : (
                        (job.companyInitials || job.companyName?.slice(0, 2).toUpperCase() || 'CO')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-extrabold text-on-surface text-base truncate">{job.title}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500 text-white font-bold animate-pulse">
                          PENDING
                        </span>
                        {job.lastEditedAfterApproval && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500 text-white font-bold">
                            EDITED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant font-semibold mb-2">
                        {job.companyName}
                        {job.isCompanyVerified && (
                          <span className="material-symbols-outlined text-emerald-600 text-[14px] align-middle ml-1">verified</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-outline flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {job.location?.city || 'N/A'}, {job.location?.state || ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">work</span>
                          {job.jobType || 'Full-Time'} • {job.workMode || 'On-site'}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          {job.salary?.min ? `₹${job.salary.min.toLocaleString()}+` : 'Not disclosed'}
                        </span>
                        <span className="flex items-center gap-1 text-amber-700 font-bold">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Submitted {getTimeSince(job.submittedForReviewAt || job.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-outline mt-2 line-clamp-2">
                        {(job.jobDescription || job.description || '').slice(0, 200)}
                        {(job.jobDescription || job.description || '').length > 200 ? '...' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onInspectJob(job)}
                      className="px-4 py-2 rounded-xl bg-surface-container-high border border-outline-variant text-on-surface text-xs font-bold hover:bg-surface-container-highest flex items-center gap-1.5 justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Preview
                    </button>
                    <button
                      onClick={() => handleApprove(jobId)}
                      disabled={isLoadingThis}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 justify-center disabled:opacity-50 shadow-sm"
                    >
                      {isLoadingThis ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: jobId, title: job.title })}
                      disabled={isLoadingThis}
                      className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5 justify-center disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobApprovalsView;