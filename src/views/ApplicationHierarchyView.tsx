// FILE: frontend/src/views/ApplicationHierarchyView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { applicationHierarchyApi, applicationApi } from '../services/api';
import { CompanyWithStats, JobWithStats } from '../types';

type HierarchyLevel = 'companies' | 'jobs' | 'applications';

interface ApplicationItem {
  _id: string;
  jobId: string;
  userId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  candidateCity: string;
  candidateAvatarUrl: string;
  resumeUrl: string;
  resumeFileName: string;
  candidateSkills: string[];
  candidateLanguages: string[];
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
  jobTitle: string;
  jobCompany: string;
  jobCompanyLogo: string;
  jobSalary: string;
  jobLocation: string;
  matchPercentage: number;
  coverNote: string;
  status: string;
  category: string;
  hrNotes: string;
  appliedAt: string;
  milestones: Array<{
    title: string;
    time?: string;
    completed: boolean;
    statusText: string;
    isHighlight: boolean;
  }>;
  recruiter?: {
    id: string;
    name: string;
    email: string;
    mobileNumber: string;
    whatsappNumber: string;
    designation: string;
    companyName: string;
    profileImageUrl: string | null;
    verified: boolean;
  } | null;
  jobDetails?: {
    id: string;
    title: string;
    companyName: string;
    companyLogo: string | null;
    location: { city?: string; state?: string };
    workMode: string;
    jobType: string;
  } | null;
  candidateAccount?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    memberSince: string;
  } | null;
  workflow?: {
    currentStatus: string;
    allowedNextStatuses: string[];
    isTerminal: boolean;
  } | null;
}

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

const shortId = (id?: string) => (id ? id.slice(-8).toUpperCase() : '—');

export const ApplicationHierarchyView: React.FC = () => {
  // ── Navigation state ──
  const [level, setLevel] = useState<HierarchyLevel>('companies');
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [selectedJob, setSelectedJob] = useState<{ id: string; title: string } | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  // ── Data state ──
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ── Filters ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── UI state ──
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string } | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // ── Refs to avoid dependency loops ──
  const selectedAppIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedAppIdRef.current = selectedApp?._id || null;
  }, [selectedApp]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ═══════════════════════════════════════════════════════════
  // DATA FETCHERS (stable references — no selectedApp in deps)
  // ═══════════════════════════════════════════════════════════
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      const res = await applicationHierarchyApi.getCompaniesWithStats(params);
      if (res.success) {
        setCompanies(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      } else {
        showToast(res.message || 'Failed to load companies', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchJobs = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await applicationHierarchyApi.getJobsByCompany(selectedCompany.id, params);
      if (res.success) {
        setJobs(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      } else {
        showToast(res.message || 'Failed to load jobs', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, page, search, statusFilter]);

  // ⚡ CRITICAL FIX: no `selectedApp` in deps — use ref instead.
  const fetchApplications = useCallback(async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await applicationApi.getApplicationsByJob(selectedJob.id, params);
      if (res.success) {
        const list: ApplicationItem[] = res.data || [];
        setApplications(list);
        setTotalPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);

        // Sync currently-open detail panel ONLY if its id still exists.
        const currentId = selectedAppIdRef.current;
        if (currentId) {
          const updated = list.find((a) => a._id === currentId);
          if (updated) {
            setSelectedApp(updated);
          }
        }
      } else {
        showToast(res.message || 'Failed to load applications', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedJob, page, statusFilter, search]);

  // ═══════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (level === 'companies') fetchCompanies();
  }, [level, fetchCompanies]);

  useEffect(() => {
    if (level === 'jobs') fetchJobs();
  }, [level, fetchJobs]);

  useEffect(() => {
    if (level === 'applications') fetchApplications();
  }, [level, fetchApplications]);

  // ═══════════════════════════════════════════════════════════
  // NAVIGATION HANDLERS WITH ID ROBUSTNESS
  // ═══════════════════════════════════════════════════════════
  const navigateToCompanies = () => {
    setLevel('companies');
    setSelectedCompany(null);
    setSelectedJob(null);
    setSelectedApp(null);
    setPage(1);
    setSearch('');
    setStatusFilter('all');
  };

  const navigateToJobs = (company: CompanyWithStats | any) => {
    const compId = company.companyId || company._id || company.id;
    if (!compId) {
      showToast('Invalid Company ID', 'error');
      return;
    }
    setSelectedCompany({ id: String(compId), name: company.companyName });
    setSelectedJob(null);
    setSelectedApp(null);
    setLevel('jobs');
    setPage(1);
    setSearch('');
    setStatusFilter('all');
  };

  const navigateToApplications = (job: JobWithStats | any) => {
    const jobId = job.jobId || job._id || job.id;
    if (!jobId) {
      showToast('Invalid Job ID', 'error');
      return;
    }
    setSelectedJob({ id: String(jobId), title: job.title });
    setSelectedApp(null);
    setLevel('applications');
    setPage(1);
    setSearch('');
    setStatusFilter('all');
  };

  const backToJobs = () => {
    setSelectedJob(null);
    setSelectedApp(null);
    setLevel('jobs');
    setPage(1);
    setSearch('');
    setStatusFilter('all');
  };

  // ═══════════════════════════════════════════════════════════
  // STATUS UPDATE
  // ═══════════════════════════════════════════════════════════
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
      showToast(err.message || 'Failed to update', 'error');
    } finally {
      setUpdatingStatus(false);
      setConfirmAction(null);
    }
  };

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

  // ═══════════════════════════════════════════════════════════
  // BREADCRUMBS
  // ═══════════════════════════════════════════════════════════
  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-1 text-xs flex-wrap mb-2">
      <button onClick={navigateToCompanies} className="text-primary hover:underline font-medium cursor-pointer flex items-center gap-0.5">
        <span className="material-symbols-outlined text-[14px]">apartment</span>
        All Companies
      </button>
      {selectedCompany && (
        <>
          <span className="text-outline">/</span>
          <button
            onClick={() => { setLevel('jobs'); setSelectedJob(null); setSelectedApp(null); setPage(1); setSearch(''); setStatusFilter('all'); }}
            className={`font-medium cursor-pointer ${level === 'jobs' ? 'text-on-surface' : 'text-primary hover:underline'}`}
          >
            {selectedCompany.name}
          </button>
        </>
      )}
      {selectedJob && (
        <>
          <span className="text-outline">/</span>
          <span className={`font-medium ${level === 'applications' ? 'text-on-surface' : 'text-primary'}`}>
            {selectedJob.title}
          </span>
        </>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════
  const renderLoading = () => (
    <div className="text-center py-16">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      <p className="text-xs text-outline mt-2">Loading...</p>
    </div>
  );

  const renderEmpty = (message: string) => (
    <div className="text-center py-16 bg-surface-container-lowest rounded-lg border border-surface-variant">
      <span className="material-symbols-outlined text-[40px] text-outline">inbox</span>
      <p className="text-sm font-medium text-on-surface mt-1">{message}</p>
    </div>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-center gap-1.5 pt-3">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-2.5 py-1 rounded-md bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer">← Prev</button>
        <span className="text-xs text-on-surface-variant">Page {page} / {totalPages} ({total.toLocaleString()} total)</span>
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-2.5 py-1 rounded-md bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer">Next →</button>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // LEVEL 1: COMPANIES
  // ═══════════════════════════════════════════════════════════
  const renderCompanies = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[22px] text-primary">apartment</span>
          Companies
          <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
        </h1>
        <button onClick={fetchCompanies} className="px-2.5 py-1.5 rounded-md border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined text-[14px]">refresh</span> Refresh
        </button>
      </div>

      <div className="relative max-w-md">
        <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search companies, industry, city..."
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-surface-variant bg-surface-container-low text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? renderLoading() : companies.length === 0 ? renderEmpty('No companies found') : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {companies.map((c, idx) => {
            const compId = (c as any).companyId || (c as any)._id || (c as any).id || `company-${idx}`;
            return (
              <div
                key={String(compId)}
                onClick={() => navigateToJobs(c)}
                className="bg-surface-container-lowest rounded-lg border border-surface-variant p-3 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-2.5">
                  {c.companyLogo ? (
                    <img
                      src={c.companyLogo}
                      alt={c.companyName}
                      className="w-10 h-10 rounded-lg object-cover border border-surface-variant shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {c.companyInitials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-sm text-on-surface truncate">{c.companyName}</h3>
                      {c.verified && (
                        <span className="material-symbols-outlined text-[12px] text-blue-500" title="Verified">verified</span>
                      )}
                    </div>
                    <p className="text-[10px] text-outline truncate">
                      {c.industry || 'General'}{c.city ? ` • ${c.city}` : ''}
                    </p>
                    {c.recruiterCount > 0 && (
                      <p className="text-[9px] text-outline mt-0.5">{c.recruiterCount} recruiter{c.recruiterCount !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-surface-variant">
                  <div className="text-center">
                    <p className="text-sm font-bold text-on-surface">{c.jobCount}</p>
                    <p className="text-[9px] text-outline">Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{c.applicationCount}</p>
                    <p className="text-[9px] text-outline">Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-amber-600">{c.pendingCount}</p>
                    <p className="text-[9px] text-outline">Pending</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {renderPagination()}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // LEVEL 2: JOBS
  // ═══════════════════════════════════════════════════════════
  const renderJobs = () => (
    <div className="space-y-3">
      {renderBreadcrumbs()}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-primary">work</span>
          Jobs — <span className="text-primary">{selectedCompany?.name}</span>
          <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
        </h1>
        <button onClick={fetchJobs} className="px-2.5 py-1.5 rounded-md border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined text-[14px]">refresh</span> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search jobs..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-surface-variant bg-surface-container-low text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-surface-variant rounded-md px-2 py-1.5 bg-white cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="Live">Live</option>
          <option value="Closed">Closed</option>
          <option value="Expired">Expired</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? renderLoading() : jobs.length === 0 ? renderEmpty('No jobs found for this company') : (
        <div className="space-y-1.5">
          {jobs.map((j, idx) => {
            const jobId = (j as any).jobId || (j as any)._id || (j as any).id || `job-${idx}`;
            return (
              <div
                key={String(jobId)}
                onClick={() => navigateToApplications(j)}
                className="bg-surface-container-lowest rounded-lg border border-surface-variant p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-on-surface truncate">{j.title}</h3>
                      <span className={`text-[9px] px-1.5 py-0 rounded font-medium border ${j.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {j.status}
                      </span>
                      {j.approvalStatus && j.approvalStatus !== 'approved' && (
                        <span className="text-[9px] px-1.5 py-0 rounded font-medium border bg-amber-50 text-amber-700 border-amber-200">
                          {j.approvalStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-outline mt-0.5">
                      {j.jobType} • {j.workMode}{j.location ? ` • ${j.location}` : ''}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      Recruiter: <strong>{j.recruiterName}</strong> • {j.salaryRange}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-bold text-primary">{j.applicationCount}</p>
                      <p className="text-[9px] text-outline">Apps</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-amber-600">{j.pendingCount}</p>
                      <p className="text-[9px] text-outline">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-600">{j.hiredCount}</p>
                      <p className="text-[9px] text-outline">Hired</p>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {renderPagination()}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // LEVEL 3: APPLICATIONS + DETAIL PANEL
  // ═══════════════════════════════════════════════════════════
  const statusFilters = ['Applied', 'Viewed', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Withdrawn'];

  const renderApplications = () => (
    <div className="space-y-3">
      {renderBreadcrumbs()}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-primary">description</span>
          Applications — <span className="text-primary">{selectedJob?.title}</span>
          <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
        </h1>
        <button onClick={backToJobs} className="px-2.5 py-1.5 rounded-md border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to Jobs
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); setSelectedApp(null); }}
          className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${statusFilter === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
        >
          All
        </button>
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); setSelectedApp(null); }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium cursor-pointer border ${statusFilter === s ? 'bg-primary text-on-primary border-primary' : statusColorMap[s]}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search candidates..."
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-surface-variant bg-surface-container-low text-xs outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? renderLoading() : applications.length === 0 ? renderEmpty('No applications for this job') : (
        <div className={`grid gap-3 ${selectedApp ? 'grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
          {/* LEFT: list */}
          <div className="space-y-1.5">
            {applications.map((app, idx) => {
              const appKey = app._id || `app-${idx}`;
              return (
                <div
                  key={appKey}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-surface-container-lowest rounded-lg border p-2.5 cursor-pointer transition-all ${
                    selectedApp?._id === app._id
                      ? 'border-primary shadow-md ring-1 ring-primary/30'
                      : 'border-surface-variant hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {app.candidateAvatarUrl ? (
                      <img
                        src={app.candidateAvatarUrl}
                        alt=""
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
                        <span className="text-sm font-bold shrink-0 text-green-600">
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
                    </div>
                  </div>
                </div>
              );
            })}
            {renderPagination()}
          </div>

          {/* RIGHT: detail panel */}
          {selectedApp && renderDetailPanel()}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // DETAIL PANEL
  // ═══════════════════════════════════════════════════════════
  const renderDetailPanel = () => {
    if (!selectedApp) return null;
    const isTerminal = selectedApp.workflow?.isTerminal || ['Rejected', 'Withdrawn', 'Hired'].includes(selectedApp.status);
    const rec = selectedApp.recruiter;

    return (
      <div className="bg-surface-container-lowest rounded-lg border border-surface-variant overflow-hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-surface-variant px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {selectedApp.candidateAvatarUrl ? (
              <img src={selectedApp.candidateAvatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {selectedApp.candidateName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-on-surface truncate">{selectedApp.candidateName}</h2>
                <span className={`text-[9px] px-1.5 py-0 rounded font-medium border ${statusColorMap[selectedApp.status]}`}>{selectedApp.status}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate">
                {selectedApp.candidateJobTitle}
                {selectedApp.candidateCurrentCompany ? ` @ ${selectedApp.candidateCurrentCompany}` : ''} • ID: <code className="text-[10px]">{shortId(selectedApp._id)}</code>
              </p>
            </div>
          </div>
          <button onClick={() => setSelectedApp(null)} className="w-7 h-7 rounded-md hover:bg-surface-container flex items-center justify-center cursor-pointer shrink-0">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
          {/* Workflow actions */}
          {!isTerminal && selectedApp.workflow && selectedApp.workflow.allowedNextStatuses.length > 0 && (
            <section className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary">timeline</span>
                Move to Next Stage
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedApp.workflow.allowedNextStatuses.map((ns) => {
                  const isReject = ns === 'Rejected' || ns === 'Withdrawn';
                  return (
                    <button
                      key={ns}
                      onClick={() => setConfirmAction({ status: ns })}
                      disabled={updatingStatus}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                        isReject
                          ? 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                          : 'bg-primary text-on-primary hover:opacity-90 shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px]">
                        {isReject ? 'close' : 'arrow_forward'}
                      </span>
                      {ns}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Contact */}
          <section className="bg-surface-container-low rounded-lg p-2.5">
            <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">contact_page</span>Contact
            </h3>
            <div className="space-y-1 text-[11px]">
              <p className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-outline">mail</span>
                <a href={`mailto:${selectedApp.candidateEmail}`} className="text-primary hover:underline truncate">{selectedApp.candidateEmail || '—'}</a>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-outline">call</span>
                <a href={`tel:${selectedApp.candidatePhone}`} className="text-primary hover:underline">{selectedApp.candidatePhone || '—'}</a>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                <span>{selectedApp.candidateCity || '—'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-outline">paid</span>
                <span>₹{selectedApp.candidateCurrentSalary || 'Not disclosed'}</span>
              </p>
            </div>
          </section>

          {/* Recruiter */}
          {rec && (
            <section className="bg-purple-50/50 border border-purple-100 rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-purple-600">badge</span>
                Recruiter
              </h3>
              <div className="flex items-start gap-2">
                {rec.profileImageUrl ? (
                  <img src={rec.profileImageUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                    {rec.name?.charAt(0)?.toUpperCase() || 'R'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-on-surface truncate">{rec.name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{rec.designation}{rec.companyName ? ` • ${rec.companyName}` : ''}</p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {rec.email && <a href={`mailto:${rec.email}`} className="text-[10px] text-primary hover:underline">✉ {rec.email}</a>}
                    {rec.mobileNumber && <a href={`tel:${rec.mobileNumber}`} className="text-[10px] text-primary hover:underline">📞 {rec.mobileNumber}</a>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Resume */}
          {selectedApp.resumeUrl && (
            <section className="bg-surface-container-low rounded-lg p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-red-600 text-[20px]">picture_as_pdf</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{selectedApp.resumeFileName || 'Resume.pdf'}</p>
                  <p className="text-[9px] text-outline">PDF Document</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setShowResumeModal(true)} className="px-2 py-1 rounded bg-primary text-on-primary text-[10px] font-medium cursor-pointer">View</button>
                <button onClick={() => forceDownloadResume(selectedApp.resumeUrl, selectedApp.resumeFileName)} className="px-2 py-1 rounded border border-surface-variant text-[10px] font-medium hover:bg-surface-container cursor-pointer">Download</button>
              </div>
            </section>
          )}

          {/* Experience + Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <section className="bg-surface-container-low rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">work_history</span>Experience
              </h3>
              <div className="space-y-0.5 text-[11px]">
                <p><span className="text-outline">Level:</span> <strong>{selectedApp.candidateExperienceLevel || '—'}</strong></p>
                <p><span className="text-outline">Years:</span> <strong>{selectedApp.candidateExperience || '—'}</strong></p>
                <p><span className="text-outline">Current:</span> <strong>{selectedApp.candidateJobTitle || '—'}</strong></p>
                <p><span className="text-outline">Company:</span> <strong>{selectedApp.candidateCurrentCompany || '—'}</strong></p>
              </div>
            </section>

            <section className="bg-surface-container-low rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">school</span>Education
              </h3>
              {selectedApp.candidateEducation ? (
                <div className="space-y-0.5 text-[11px]">
                  <p><span className="text-outline">Degree:</span> <strong>{selectedApp.candidateEducation.degree || '—'}</strong></p>
                  <p><span className="text-outline">Spec.:</span> <strong>{selectedApp.candidateEducation.specialization || '—'}</strong></p>
                  <p><span className="text-outline">College:</span> <strong>{selectedApp.candidateEducation.collegeName || '—'}</strong></p>
                  <p><span className="text-outline">Year:</span> <strong>{selectedApp.candidateEducation.endYear || '—'}</strong></p>
                </div>
              ) : (
                <p className="text-[10px] text-outline italic">No education details</p>
              )}
            </section>
          </div>

          {/* Skills */}
          {selectedApp.candidateSkills?.length > 0 && (
            <section className="bg-surface-container-low rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide">
                Skills ({selectedApp.candidateSkills.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {selectedApp.candidateSkills.map((s, i) => (
                  <span key={`skill-${i}-${s}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* Cover note */}
          {selectedApp.coverNote && (
            <section className="bg-surface-container-low rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1 uppercase tracking-wide">Cover Note</h3>
              <p className="text-[11px] text-on-surface-variant italic">"{selectedApp.coverNote}"</p>
            </section>
          )}

          {/* Timeline */}
          {selectedApp.milestones?.length > 0 && (
            <section className="bg-surface-container-low rounded-lg p-2.5">
              <h3 className="font-semibold text-[11px] text-on-surface mb-1.5 uppercase tracking-wide">Timeline</h3>
              <div className="space-y-1.5 pl-1.5 border-l-2 border-surface-variant ml-1">
                {selectedApp.milestones.map((m, i) => (
                  <div key={`milestone-${i}-${m.title}`} className="relative pl-3">
                    <div className={`absolute -left-[7px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${m.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-[11px] font-medium text-on-surface">{m.title}</p>
                    {m.time && <p className="text-[9px] text-outline">{m.time}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* HR Notes */}
          <section className="bg-surface-container-low rounded-lg p-2.5">
            <h3 className="font-semibold text-[11px] text-on-surface mb-1 uppercase tracking-wide">HR Notes</h3>
            <p className="text-[11px] text-on-surface-variant italic">{selectedApp.hrNotes || 'No notes added yet.'}</p>
          </section>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-3">
      {level === 'companies' && renderCompanies()}
      {level === 'jobs' && renderJobs()}
      {level === 'applications' && renderApplications()}

      {/* Confirmation modal */}
      {confirmAction && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-on-surface mb-2">Confirm Status Change</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Move <strong>{selectedApp.candidateName}</strong> from{' '}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColorMap[selectedApp.status]}`}>{selectedApp.status}</span>
              {' '}to{' '}
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColorMap[confirmAction.status]}`}>{confirmAction.status}</span>?
            </p>
            <div className="flex justify-end gap-1.5">
              <button onClick={() => setConfirmAction(null)} disabled={updatingStatus} className="px-3 py-1.5 rounded-md border border-surface-variant text-xs cursor-pointer">Cancel</button>
              <button
                onClick={() => handleStatusChange(selectedApp._id, confirmAction.status)}
                disabled={updatingStatus}
                className="px-3 py-1.5 rounded-md bg-primary text-on-primary text-xs font-medium cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {updatingStatus && <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume modal */}
      {showResumeModal && selectedApp?.resumeUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px]">picture_as_pdf</span>
                <h3 className="font-semibold text-sm">{selectedApp.resumeFileName || 'Resume'}</h3>
              </div>
              <button onClick={() => setShowResumeModal(false)} className="w-7 h-7 rounded-md hover:bg-surface-container-low flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              <iframe src={`${selectedApp.resumeUrl}#toolbar=1&navpanes=0`} title="Resume Preview" className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

export default ApplicationHierarchyView;