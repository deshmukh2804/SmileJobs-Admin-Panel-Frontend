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
      const res = await jobApi.getJobs({ status: 'Pending', limit: 100 });
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
    return pendingJobs.filter(
      (j) =>
        j.title?.toLowerCase().includes(q) ||
        j.companyName?.toLowerCase().includes(q) ||
        j.contactPerson?.name?.toLowerCase().includes(q) ||
        j.recruiterEmail?.toLowerCase().includes(q) ||
        j._id?.toLowerCase().includes(q)
    );
  }, [pendingJobs, searchQuery]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await onApprove(id);
      setPendingJobs((prev) => prev.filter((j) => (j._id || j.id) !== id));
      onToast('Job approved and is now live on the candidate app!', 'success');
      fetchPendingJobs();
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to approve job', 'error');
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
      setPendingJobs((prev) => prev.filter((j) => (j._id || j.id) !== rejectModal.id));
      setRejectModal(null);
      setRejectReason('');
      onToast('Job rejected and feedback sent to recruiter', 'info');
      fetchPendingJobs();
      onRefresh();
    } catch (err: any) {
      onToast(err.message || 'Failed to reject job', 'error');
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
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-rose-600">block</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Job Listing</h3>
                <p className="text-xs text-gray-500 truncate max-w-[280px]">{rejectModal.title}</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g., Incomplete salary info, company email mismatch, inappropriate job description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              This note will be recorded and emailed to the recruiter so they can correct it.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                disabled={actionLoading === rejectModal.id}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
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
                    Confirm Rejection
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
              Admin Verification
            </span>
            {pendingJobs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                {pendingJobs.length} AWAITING APPROVAL
              </span>
            )}
          </div>
          <h1 className="text-2xl text-gray-900 font-extrabold mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">fact_check</span>
            Job Approval Queue
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Verify recruiter credentials and company information before publishing jobs to candidates.
          </p>
        </div>
        <button
          onClick={fetchPendingJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-bold hover:bg-gray-50 shadow-sm text-sm disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* ─── Search ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by job title, company name, recruiter email or contact name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-primary text-xs font-medium"
          />
        </div>
      </div>

      {/* ─── Pending Jobs List ─── */}
      {loading && filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-200">
          <span className="material-symbols-outlined text-primary animate-spin text-4xl mb-3">progress_activity</span>
          <p className="font-bold text-gray-500">Loading pending approval queue...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-emerald-50 rounded-2xl border-2 border-emerald-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
          </div>
          <p className="font-extrabold text-lg text-emerald-900 mb-1">Queue is Clear! 🎉</p>
          <p className="text-xs text-emerald-700 max-w-sm text-center">
            {pendingJobs.length === 0
              ? 'There are no pending jobs to approve right now. All submissions have been processed.'
              : 'No pending jobs match your search filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const jobId = job._id || job.id;
            const isLoadingThis = actionLoading === jobId;
            const recruiterInfo = job.recruiterId && typeof job.recruiterId === 'object' ? job.recruiterId : null;

            return (
              <div
                key={jobId}
                className="bg-white border-2 border-amber-200 rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  {/* Left: Complete Job & Recruiter Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-gray-200">
                      {job.companyLogo?.url ? (
                        <img src={job.companyLogo.url} alt={job.companyName} className="w-full h-full object-cover" />
                      ) : (
                        job.companyInitials || job.companyName?.slice(0, 2).toUpperCase() || 'CO'
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-lg">{job.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold animate-pulse">
                          AWAITING APPROVAL
                        </span>
                        {job.isCompanyVerified && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Verified Company
                          </span>
                        )}
                      </div>

                      {/* Company Info */}
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-700 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">{job.companyName}</span>
                        {job.industry && <span className="text-gray-500">• {job.industry}</span>}
                        {job.organizationSize && <span className="text-gray-500">• {job.organizationSize}</span>}
                        {job.companyWebsite && (
                          <a
                            href={job.companyWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                            Website
                          </a>
                        )}
                      </div>

                      {/* Recruiter Verification Box */}
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-xs text-gray-700 space-y-1">
                        <p className="font-bold text-amber-900 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-amber-700">badge</span>
                          Posted By Recruiter / Contact Person:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px]">
                          <div>
                            <span className="text-gray-500">Name:</span>{' '}
                            <span className="font-semibold text-gray-900">
                              {job.contactPerson?.name || recruiterInfo?.name || 'Not Provided'}
                              {job.contactPerson?.designation ? ` (${job.contactPerson.designation})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>{' '}
                            <span className="font-semibold text-gray-900">
                              {job.recruiterEmail || recruiterInfo?.email || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone / WhatsApp:</span>{' '}
                            <span className="font-semibold text-gray-900">
                              {job.recruiterMobileNumber || job.recruiterWhatsappNumber || recruiterInfo?.phone || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Job Metadata Tags */}
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap pt-1">
                        <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {job.location?.city || 'N/A'}, {job.location?.state || 'India'}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">work</span>
                          {job.jobType || 'Full-Time'} • {job.workMode || 'On-site'}
                        </span>
                        <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">payments</span>
                          {job.salary?.min ? `₹${job.salary.min.toLocaleString()} - ₹${job.salary.max?.toLocaleString() || '...'}` : 'Not Disclosed'}
                        </span>
                        <span className="flex items-center gap-1 bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Submitted {getTimeSince(job.submittedForReviewAt || job.createdAt)}
                        </span>
                      </div>

                      {/* Description Preview */}
                      <p className="text-xs text-gray-600 line-clamp-2 pt-1">
                        {job.jobDescription || job.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-36 justify-end">
                    <button
                      onClick={() => onInspectJob(job)}
                      className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-200 flex items-center gap-1.5 justify-center"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Inspect Job
                    </button>
                    <button
                      onClick={() => handleApprove(jobId)}
                      disabled={isLoadingThis}
                      className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 justify-center disabled:opacity-50 shadow-sm"
                    >
                      {isLoadingThis ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      )}
                      Approve & Live
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: jobId, title: job.title })}
                      disabled={isLoadingThis}
                      className="flex-1 lg:flex-none px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 flex items-center gap-1.5 justify-center disabled:opacity-50"
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