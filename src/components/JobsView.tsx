import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JobItem, NavItem } from '../types';
import { jobApi } from '../services/api';

interface JobsViewProps {
  jobs: JobItem[];
  onSelectJob: (job: JobItem) => void;
  onOpenPostJob: () => void;
  onEditJob?: (jobId: string) => void;
  onApproveJob: (id: string) => void;
  onRejectJob: (id: string) => void;
  onToggleFeature: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectTab: (tab: NavItem) => void;
  onExport: () => void;
}

export const JobsView: React.FC<JobsViewProps> = ({
  jobs: propJobs,
  onSelectJob,
  onOpenPostJob,
  onEditJob,
  onApproveJob,
  onRejectJob,
  onToggleFeature,
  onToggleStatus,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Expired'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');

  const [apiJobs, setApiJobs] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingJobDetail, setIsLoadingJobDetail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [counts, setCounts] = useState({ total: 0, live: 0, pending: 0, rejected: 0, expired: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  const jobs = apiJobs.length > 0 ? apiJobs : propJobs;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---------- Helper: Transform ANY backend job payload to full JobItem ----------
  const transformJob = (job: any, whatsappData?: any): JobItem => {
    const companyName = job.companyName || job.company || '';
    const initials =
      job.companyInitials ||
      companyName
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      'CF';

    // Handle companyLogo — it can be an object {url, publicId} OR a string
    let logoUrl: string | null = null;
    if (job.companyLogo) {
      if (typeof job.companyLogo === 'string') logoUrl = job.companyLogo;
      else if (job.companyLogo.url) logoUrl = job.companyLogo.url;
    }

    // Experience text
    let experienceRange = '';
    if (job.experience) {
      if (job.experience.text) experienceRange = job.experience.text;
      else if (job.experience.min !== undefined || job.experience.max !== undefined) {
        const min = job.experience.min ?? 0;
        const max = job.experience.max;
        experienceRange = max !== undefined ? `${min} - ${max} yrs` : `${min}+ yrs`;
      }
    }

    return {
      id: job._id || job.id,
      title: job.title || '',
      company: companyName,
      companyInitials: initials,
      companyLogo: logoUrl,
      companyWebsite: job.companyWebsite || '',
      isCompanyVerified: job.isCompanyVerified || false,
      industry: job.industry || '',
      location: job.locationDisplay || job.location?.city || '',
      workMode: job.workMode || 'On-site',
      salaryRange: job.salaryRange || 'Not Disclosed',
      salaryPeriod: job.salary?.period ? `Per ${job.salary.period}` : 'Annual',
      jobType: job.jobType || 'Full-Time',
      department: job.department || '',
      status: job.status || 'Pending Approval',
      featured: job.featured || false,
      isNew: job.isNew || false,
      postedDate: job.postedDate || '',
      applicantsCount: job.applicantsCount || 0,
      applicantsCap: job.applicantsCap || 100,
      contactVisibility: job.contactVisibility || { whatsapp: false, mobile: false },

      // Extended fields (schema-accurate)
      description: job.jobDescription || job.description || '',
      jobDescription: job.jobDescription || job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements : [],
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      skills: Array.isArray(job.skills) ? job.skills : [],
      languages: Array.isArray(job.languages) ? job.languages : [],
      qualification: job.qualification || '',
      role: job.role || '',
      experience: job.experience || {},
      experienceRange,
      salary: job.salary || {},
      locationDetails: job.location && typeof job.location === 'object' ? job.location : {},
      companyImages: Array.isArray(job.companyImages) ? job.companyImages : [],
      jobTiming: job.jobTiming || '',
      workingDays: job.workingDays || '',
      contactPerson: job.contactPerson || {},
      applicationUrl: job.applicationUrl || '',
      noPaymentInvolved: job.noPaymentInvolved,
      postedAt: job.postedAt || job.createdAt || '',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      rejectionReason: job.rejectionReason || '',
      recruiterWhatsappNumber: job.recruiterWhatsappNumber || '',
      recruiterMobileNumber: job.recruiterMobileNumber || '',
      recruiterEmail: job.recruiterEmail || '',
      whatsapp: whatsappData || job.whatsapp || { enabled: false },
      notes: job.notes || job.adminNotes || '',
    };
  };

  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    setApiError(null);
    try {
      const statusMap: Record<string, string> = {
        All: '',
        Pending: 'Pending',
        Approved: 'Approved',
        Rejected: 'Rejected',
        Expired: 'Expired',
      };

      const response = await jobApi.getJobs({
        status: statusMap[activeTab] || '',
        search: searchQuery || undefined,
        jobType: jobTypeFilter !== 'All' ? jobTypeFilter : undefined,
        workMode: workModeFilter !== 'All' ? workModeFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success && response.data) {
        const transformedJobs: JobItem[] = response.data.map((j: any) => transformJob(j));
        setApiJobs(transformedJobs);
        if (response.counts) setCounts(response.counts);
        if (response.pagination) setPagination((prev) => ({ ...prev, ...response.pagination }));
      }
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err.message);
      setApiError(err.message);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [activeTab, searchQuery, jobTypeFilter, workModeFilter, pagination.page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ---------- Fetch full job details (handles nested response.data.job) ----------
  const handleViewJob = async (job: JobItem) => {
    try {
      setIsLoadingJobDetail(job.id);
      const response = await jobApi.getJobById(job.id);

      if (response.success && response.data) {
        // Backend returns { data: { job: {...}, whatsapp: {...} } }
        const rawJob = response.data.job || response.data;
        const whatsappData = response.data.whatsapp;
        const fullJob = transformJob(rawJob, whatsappData);
        onSelectJob(fullJob);
      } else {
        onSelectJob(job);
        showToast('Loaded partial job details', 'error');
      }
    } catch (err: any) {
      console.error('Failed to load job details:', err.message);
      showToast(err.message || 'Failed to load full job details', 'error');
      onSelectJob(job);
    } finally {
      setIsLoadingJobDetail(null);
    }
  };

  const handleApproveJob = async (id: string) => {
    try {
      await jobApi.approveJob(id);
      onApproveJob(id);
      showToast('Job approved successfully!');
      fetchJobs();
    } catch (err: any) {
      showToast(err.message || 'Approve failed', 'error');
    }
  };

  const handleRejectJob = async (id: string) => {
    try {
      await jobApi.rejectJob(id);
      onRejectJob(id);
      showToast('Job rejected');
      fetchJobs();
    } catch (err: any) {
      showToast(err.message || 'Reject failed', 'error');
    }
  };

  const handleToggleFeature = async (id: string) => {
    try {
      await jobApi.toggleFeature(id);
      onToggleFeature(id);
      showToast('Feature status updated');
      fetchJobs();
    } catch (err: any) {
      showToast(err.message || 'Feature toggle failed', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await jobApi.toggleStatus(id);
      onToggleStatus(id);
      showToast('Status updated');
      fetchJobs();
    } catch (err: any) {
      showToast(err.message || 'Toggle failed', 'error');
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await jobApi.deleteJob(id);
      showToast('Job deleted successfully!');
      setDeleteConfirmId(null);
      fetchJobs();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeTab === 'Pending' && job.status !== 'Pending Approval') return false;
      if (activeTab === 'Approved' && job.status !== 'Live') return false;
      if (activeTab === 'Rejected' && job.status !== 'Rejected') return false;
      if (activeTab === 'Expired' && job.status !== 'Expired') return false;

      if (
        searchQuery &&
        !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (workModeFilter !== 'All' && job.workMode !== workModeFilter) return false;
      if (jobTypeFilter !== 'All' && job.jobType !== jobTypeFilter) return false;

      return true;
    });
  }, [jobs, activeTab, searchQuery, workModeFilter, jobTypeFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setJobTypeFilter('All');
    setWorkModeFilter('All');
    setActiveTab('All');
  };

  return (
    <div className="space-y-space-lg">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-[#E5F2EB] border-[#5F8A72]/40 text-[#24593C]'
              : 'bg-error-container border-error/30 text-on-error-container'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-error/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Delete Job Listing?</h3>
                <p className="text-xs text-outline">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant my-4">
              Are you sure you want to permanently delete this job listing? All associated Cloudinary images and data will be removed from MongoDB.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteJob(deleteConfirmId)}
                className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold hover:bg-error/90 cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-2 rounded-lg bg-[#FFF3D6] border border-[#C58A3A]/30 text-[#8C5D00] text-[11px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px]">cloud_off</span>
          <span>Backend connection issue: {apiError}</span>
          <button onClick={fetchJobs} className="ml-auto text-[#C58A3A] hover:underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">
              Governance Console
            </span>
            {isLoadingJobs && (
              <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
          </div>
          <h1 className="font-headline-lg text-primary font-bold mt-1">Job Management</h1>
          <p className="font-body-md text-on-surface-variant">
            Review, approve, edit, and orchestrate career opportunities.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md hover:bg-surface-container shadow-xs transition-colors cursor-pointer text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export</span>
          </button>
          <button
            onClick={onOpenPostJob}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer text-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Jobs', value: counts.total, icon: 'list_alt' },
          { label: 'Live', value: counts.live, icon: 'check_circle', filter: 'Approved' },
          { label: 'Pending', value: counts.pending, icon: 'pending', filter: 'Pending' },
          { label: 'Rejected', value: counts.rejected, icon: 'block', filter: 'Rejected' },
          { label: 'Expired', value: counts.expired, icon: 'archive', filter: 'Expired' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => kpi.filter && setActiveTab(kpi.filter as any)}
            className={`bg-surface-container-lowest p-4 rounded-xl border border-surface-variant shadow-xs transition-all ${
              kpi.filter ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-md text-outline text-xs">{kpi.label}</span>
              <span className="p-1.5 rounded-lg bg-surface-container">
                <span className="material-symbols-outlined text-[16px]">{kpi.icon}</span>
              </span>
            </div>
            <h3 className="font-headline-lg text-primary font-bold tracking-tight mt-2">
              {kpi.value.toLocaleString()}
            </h3>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-variant pb-2">
        {[
          { key: 'All', label: 'All Jobs', count: counts.total },
          { key: 'Pending', label: 'Pending', count: counts.pending },
          { key: 'Approved', label: 'Live', count: counts.live },
          { key: 'Rejected', label: 'Rejected', count: counts.rejected },
          { key: 'Expired', label: 'Expired', count: counts.expired },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-black/10'
              }`}
            >
              {tab.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-variant shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Job title, Company, ID..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none"
            >
              <option value="All">Job Type: All</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <select
              value={workModeFilter}
              onChange={(e) => setWorkModeFilter(e.target.value)}
              className="px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none"
            >
              <option value="All">Mode: All</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>

            <button
              onClick={clearAllFilters}
              className="px-2.5 py-2 rounded-lg text-outline hover:text-primary flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============ LIST FORMAT (rows) ============ */}
      {isLoadingJobs && filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-surface-variant">
          <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin inline-block mb-3" />
          <p className="font-semibold text-outline">Loading jobs from database...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-surface-variant">
          <span className="material-symbols-outlined text-6xl text-outline mb-3">work_off</span>
          <p className="font-bold text-primary mb-1">No job listings found</p>
          <p className="text-xs text-outline mb-4">Try relaxing filters or create your first job.</p>
          <button
            onClick={onOpenPostJob}
            className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create First Job
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-xs overflow-hidden">
          {/* List Header */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-3 bg-surface-container border-b border-surface-variant text-[11px] font-bold text-outline uppercase tracking-wide">
            <div className="col-span-4">Job Details</div>
            <div className="col-span-2">Location & Mode</div>
            <div className="col-span-2">Salary</div>
            <div className="col-span-1 text-center">Applicants</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* List Rows */}
          <div className="divide-y divide-surface-variant/60">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`group grid grid-cols-1 md:grid-cols-12 gap-3 px-4 py-4 items-center hover:bg-surface-container-low/40 transition-colors ${
                  job.featured ? 'bg-[#C58A3A]/5' : ''
                }`}
              >
                {/* Column 1: Job Details */}
                <div className="col-span-4 flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-lg bg-primary-container text-on-secondary flex items-center justify-center font-bold text-sm shadow-sm shrink-0 overflow-hidden">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      job.companyInitials
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3
                        onClick={() => handleViewJob(job)}
                        className="font-bold text-primary text-sm cursor-pointer hover:underline truncate"
                        title={job.title}
                      >
                        {job.title}
                      </h3>
                      {job.featured && (
                        <span
                          className="material-symbols-outlined text-[15px] text-[#C58A3A] shrink-0"
                          title="Featured"
                        >
                          star
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-on-surface-variant truncate">{job.company}</span>
                      {job.isCompanyVerified && (
                        <span className="material-symbols-outlined text-[12px] text-[#5F8A72]">verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {job.isNew && (
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-secondary font-bold text-[9px]">
                          NEW
                        </span>
                      )}
                      <span className="text-[10px] text-outline">{job.jobType}</span>
                      <span className="text-[10px] text-outline">•</span>
                      <span className="font-mono text-[9px] text-outline">#{job.id.slice(-6)}</span>
                    </div>
                    {/* Contact visibility badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          job.contactVisibility?.whatsapp
                            ? 'bg-[#25D366]/15 text-[#25D366]'
                            : 'bg-surface-container text-outline'
                        }`}
                        title="WhatsApp Visibility"
                      >
                        <span className="material-symbols-outlined text-[10px]">chat</span>
                        WA
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          job.contactVisibility?.mobile
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface-container text-outline'
                        }`}
                        title="Mobile Visibility"
                      >
                        <span className="material-symbols-outlined text-[10px]">phone</span>
                        Mobile
                      </span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Location & Mode */}
                <div className="col-span-2 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
                    <span className="truncate">{job.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-outline">
                    <span className="material-symbols-outlined text-[14px]">work</span>
                    <span>{job.workMode}</span>
                  </div>
                </div>

                {/* Column 3: Salary */}
                <div className="col-span-2">
                  <div className="text-sm font-bold text-primary">{job.salaryRange}</div>
                  <div className="text-[10px] text-outline">{job.salaryPeriod || 'Annual'}</div>
                </div>

                {/* Column 4: Applicants */}
                <div className="col-span-1 text-center">
                  <div className="text-sm font-bold text-primary">
                    {job.applicantsCount}
                    <span className="text-outline font-normal text-[10px]">/{job.applicantsCap}</span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((job.applicantsCount / job.applicantsCap) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Column 5: Status */}
                <div className="col-span-1 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                      job.status === 'Live'
                        ? 'bg-[#E5F2EB] text-[#24593C]'
                        : job.status === 'Pending Approval'
                        ? 'bg-[#FFF3D6] text-[#8C5D00]'
                        : job.status === 'Expired'
                        ? 'bg-surface-container text-outline'
                        : job.status === 'Closed'
                        ? 'bg-outline/20 text-outline'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        job.status === 'Live'
                          ? 'bg-[#24593C] animate-pulse'
                          : job.status === 'Pending Approval'
                          ? 'bg-[#8C5D00]'
                          : 'bg-outline'
                      }`}
                    />
                    {job.status === 'Pending Approval' ? 'Pending' : job.status}
                  </span>
                </div>

                {/* Column 6: Actions */}
                <div className="col-span-2 flex items-center justify-end gap-1">
                  {job.status === 'Pending Approval' ? (
                    <>
                      <button
                        onClick={() => handleApproveJob(job.id)}
                        className="px-2 py-1.5 rounded-lg bg-[#5F8A72] text-white text-[11px] font-bold hover:opacity-90 flex items-center gap-1 cursor-pointer"
                        title="Approve"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      </button>
                      <button
                        onClick={() => handleRejectJob(job.id)}
                        className="px-2 py-1.5 rounded-lg bg-error-container text-on-error-container text-[11px] font-bold hover:bg-error-container/80 flex items-center gap-1 cursor-pointer"
                        title="Reject"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                      <button
                        onClick={() => handleViewJob(job)}
                        disabled={isLoadingJobDetail === job.id}
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container cursor-pointer disabled:opacity-50"
                        title="View"
                      >
                        {isLoadingJobDetail === job.id ? (
                          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        )}
                      </button>
                      {onEditJob && (
                        <button
                          onClick={() => onEditJob(job.id)}
                          className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container cursor-pointer"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleViewJob(job)}
                        disabled={isLoadingJobDetail === job.id}
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container cursor-pointer disabled:opacity-50"
                        title="View Details"
                      >
                        {isLoadingJobDetail === job.id ? (
                          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin inline-block" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        )}
                      </button>
                      {onEditJob && (
                        <button
                          onClick={() => onEditJob(job.id)}
                          className="px-2 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-primary-container transition-colors"
                          title="Edit Job"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span className="hidden lg:inline">Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleFeature(job.id)}
                        className={`p-1.5 rounded-lg hover:bg-surface-container cursor-pointer transition-colors ${
                          job.featured ? 'text-[#C58A3A]' : 'text-outline hover:text-[#C58A3A]'
                        }`}
                        title={job.featured ? 'Unfeature' : 'Feature Job'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {job.featured ? 'star' : 'star_border'}
                        </span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(job.id)}
                        className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container cursor-pointer transition-colors"
                        title={job.status === 'Live' ? 'Pause' : 'Activate'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {job.status === 'Live' ? 'pause_circle' : 'play_circle'}
                        </span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(job.id)}
                        className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/30 cursor-pointer transition-colors"
                        title="Delete Job"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
          <div>
            Showing {filteredJobs.length} of {pagination.total} results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-2.5 py-1 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 rounded bg-primary text-on-primary font-bold">
              Page {pagination.page}
            </span>
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))
              }
              disabled={pagination.page >= pagination.pages}
              className="px-2.5 py-1 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};