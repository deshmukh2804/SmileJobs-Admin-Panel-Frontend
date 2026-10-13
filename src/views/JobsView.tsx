// FILE: frontend/src/views/JobsView.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { JobItem, NavItem } from '../types';
import { jobApi } from '../services/api';

interface JobsViewProps {
  jobs: JobItem[];
  onSelectJob: (job: JobItem) => void;
  onOpenPostJob: () => void;
  onEditJob?: (jobId: string) => void;
  onApproveJob: (id: string) => void;
  onRejectJob: (id: string) => void;
  onDeleteJob: (id: string) => void;
  onToggleFeature: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onSelectTab: (tab: NavItem) => void;
  onExport: (filters?: Record<string, any>) => void; // ✅ Now accepts filters
}

// ───────────────────────────────────────────────────────────
// ✅ CUSTOM SVG ICONS
// ───────────────────────────────────────────────────────────
const AdminShieldIcon = ({ size = 14, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0, display: 'inline-block' }}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z"/>
  </svg>
);

const RecruiterBadgeIcon = ({ size = 14, color = '#ffffff' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={color} style={{ flexShrink: 0, display: 'inline-block' }}>
    <path d="M20 7h-4V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-6 0h-4V5h4v2zm-2 5c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
  </svg>
);

const WhatsAppIcon = ({ active, size = 14 }: { active: boolean; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={active ? '#25D366' : '#9CA3AF'} className="shrink-0 transition-colors">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

const PhoneIcon = ({ active, size = 14 }: { active: boolean; size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill={active ? '#6750A4' : '#9CA3AF'} className="shrink-0 transition-colors">
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════
// ✅ SMART POSTER DETECTION HELPER
// Trusts backend's postedBy / isAdminPosted first, then falls back
// to field inspection for jobs that haven't been migrated yet.
// ═══════════════════════════════════════════════════════════════
const detectIsAdminJob = (job: any): boolean => {
  if (!job) return false;

  // 1. Explicit backend boolean (set by transformJobForFrontend)
  if (typeof job.isAdminPosted === 'boolean') return job.isAdminPosted;

  // 2. Explicit postedBy string
  const pb = String(job.postedBy || '').toLowerCase().trim();
  if (pb === 'admin') return true;
  if (pb === 'recruiter') return false;

  // 3. postedByRole check
  const role = String(job.postedByRole || '').toLowerCase().trim();
  if (['admin', 'super admin', 'superadmin', 'sub admin', 'subadmin'].includes(role)) return true;
  if (['recruiter', 'employer', 'hr'].includes(role)) return false;

  // 4. Admin email check
  const adminEmails = ['smilejobs@gmail.com', 'admin@smilejobs.com', 'admin@careerflow.com'];
  const email = String(job.postedByEmail || '').toLowerCase().trim();
  if (email && adminEmails.includes(email)) return true;

  // 5. Admin name check
  const nm = String(job.postedByName || '').toLowerCase().trim();
  if (nm === 'smile jobs' || nm === 'smilejobs' || nm === 'admin') return true;

  // 6. If recruiterId exists AND no admin markers → recruiter
  if (job.recruiterId) return false;

  // 7. Default fallback
  return false;
};

// ═══════════════════════════════════════════════════════════════
// POSTED-BY TAG
// ═══════════════════════════════════════════════════════════════
const PostedByTag = ({ job, compact = false }: { job: JobItem; compact?: boolean }) => {
  const isAdmin = detectIsAdminJob(job);

  const posterName =
    (job as any).postedByName ||
    ((job as any).recruiterId && typeof (job as any).recruiterId === 'object' ? ((job as any).recruiterId as any).name : '') ||
    ((job as any).contactPerson && (job as any).contactPerson.name) ||
    (isAdmin ? 'Smile Jobs' : 'Recruiter');

  const posterEmail =
    (job as any).postedByEmail ||
    ((job as any).recruiterId && typeof (job as any).recruiterId === 'object' ? ((job as any).recruiterId as any).email : '') ||
    (job as any).recruiterEmail ||
    '';

  const posterRole = (job as any).postedByRole || (isAdmin ? 'Super Admin' : 'Recruiter');

  const bgGradient = isAdmin
    ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
    : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
  const borderColor = isAdmin ? '#1d4ed8' : '#b45309';
  const label = isAdmin ? 'ADMIN JOB' : 'RECRUITER JOB';
  const title = isAdmin
    ? `🛡️ Admin Posted Job\n\nName: ${posterName}\nEmail: ${posterEmail}\nRole: ${posterRole}\n\nThis job was posted directly via the Admin Portal.`
    : `👤 Recruiter Posted Job\n\nName: ${posterName}\nEmail: ${posterEmail}\nRole: ${posterRole}\n\nThis job was posted by an external recruiter.`;

  if (compact) {
    return (
      <span
        title={title}
        style={{
          background: bgGradient,
          border: `1px solid ${borderColor}`,
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: 800,
          letterSpacing: '0.3px',
          padding: '3px 8px',
          borderRadius: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          cursor: 'help',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          lineHeight: 1,
          verticalAlign: 'middle',
        }}
      >
        {isAdmin ? <AdminShieldIcon size={10} /> : <RecruiterBadgeIcon size={10} />}
        <span>{isAdmin ? 'ADMIN' : 'RECRUITER'}</span>
      </span>
    );
  }

  return (
    <span
      title={title}
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.4px',
        padding: '4px 10px',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        cursor: 'help',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        maxWidth: '280px',
        lineHeight: 1,
        verticalAlign: 'middle',
      }}
    >
      {isAdmin ? <AdminShieldIcon size={12} /> : <RecruiterBadgeIcon size={12} />}
      <span>{label}</span>
      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          opacity: 0.95,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '120px',
          display: 'inline-block',
        }}
      >
        {posterName}
      </span>
    </span>
  );
};

export const JobsView: React.FC<JobsViewProps> = ({
  jobs: propJobs,
  onSelectJob,
  onOpenPostJob,
  onEditJob,
  onApproveJob,
  onRejectJob,
  onDeleteJob,
  onToggleFeature,
  onToggleStatus,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'All jobs' | 'Live' | 'Feature' | 'Drafts' | 'Pending' | 'Approved' | 'Rejected' | 'Closed'>('All jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('All');
  const [workModeFilter, setWorkModeFilter] = useState('All');
  const [postedByFilter, setPostedByFilter] = useState<'All' | 'admin' | 'recruiter'>('All');

  const [apiJobs, setApiJobs] = useState<JobItem[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingJobDetail, setIsLoadingJobDetail] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // ✅ NEW: Export loading state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const deletedIdsRef = useRef<Set<string>>(new Set());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [counts, setCounts] = useState({ total: 0, live: 0, pending: 0, rejected: 0, expired: 0, adminPosted: 0, recruiterPosted: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  const jobs = useMemo(() => {
    const source = apiJobs.length > 0 ? apiJobs : propJobs;
    if (deletedIdsRef.current.size === 0) return source;
    return source.filter((j) => !deletedIdsRef.current.has(j.id));
  }, [apiJobs, propJobs]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const transformJob = useCallback((job: any, whatsappData?: any): JobItem => {
    const companyName = job.companyName || job.company || '';
    const initials =
      job.companyInitials ||
      companyName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ||
      'CF';

    let logoUrl: string | null = null;
    if (job.companyLogo) {
      if (typeof job.companyLogo === 'string') logoUrl = job.companyLogo;
      else if (job.companyLogo.url) logoUrl = job.companyLogo.url;
    }

    let experienceRange = '';
    if (job.experience) {
      if (job.experience.text) experienceRange = job.experience.text;
      else if (job.experience.min !== undefined || job.experience.max !== undefined) {
        const min = job.experience.min ?? 0;
        const max = job.experience.max;
        experienceRange = max !== undefined ? `${min} - ${max} yrs` : `${min}+ yrs`;
      }
    }

    let locationDisplay = '';
    if (job.locationDisplay) {
      locationDisplay = job.locationDisplay;
    } else if (job.location) {
      if (typeof job.location === 'string') {
        locationDisplay = job.location;
      } else if (typeof job.location === 'object') {
        const parts = [job.location.city, job.location.state, job.location.country].filter(Boolean);
        if (parts.length > 0) {
          locationDisplay = parts.join(', ');
        } else if (job.location.address) {
          locationDisplay = job.location.address;
        }
      }
    }

    let salaryRange = 'Not Disclosed';
    if (job.salaryRange && typeof job.salaryRange === 'string' && job.salaryRange !== 'Not Disclosed') {
      salaryRange = job.salaryRange;
    } else if (job.salary && typeof job.salary === 'object') {
      const min = job.salary.min || 0;
      const max = job.salary.max || 0;
      const currency = job.salary.currency || 'INR';
      const symbol = currency === 'INR' ? '₹' : currency;
      const period = job.salary.period || 'month';
      if (min || max) {
        salaryRange = `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()} / ${period}`;
      }
    }

    // ✅ SMART DETECTION — uses helper that checks multiple fields
    const isAdminPosted = detectIsAdminJob(job);
    const resolvedPostedBy: 'admin' | 'recruiter' = isAdminPosted ? 'admin' : 'recruiter';

    // ✅ Resolve poster name from best available source
    let resolvedPostedByName = job.postedByName || '';
    if (!resolvedPostedByName) {
      if (isAdminPosted) {
        resolvedPostedByName = 'Smile Jobs';
      } else if (job.recruiterId && typeof job.recruiterId === 'object' && job.recruiterId.name) {
        resolvedPostedByName = job.recruiterId.name;
      } else if (job.contactPerson?.name) {
        resolvedPostedByName = job.contactPerson.name;
      } else {
        resolvedPostedByName = 'Recruiter';
      }
    }

    let resolvedPostedByEmail = job.postedByEmail || '';
    if (!resolvedPostedByEmail) {
      if (isAdminPosted) {
        resolvedPostedByEmail = 'smilejobs@gmail.com';
      } else if (job.recruiterId && typeof job.recruiterId === 'object' && job.recruiterId.email) {
        resolvedPostedByEmail = job.recruiterId.email;
      } else if (job.recruiterEmail) {
        resolvedPostedByEmail = job.recruiterEmail;
      }
    }

    const resolvedPostedByRole = job.postedByRole || (isAdminPosted ? 'Super Admin' : 'Recruiter');

    return {
      id: job._id || job.id,
      title: job.title || '',
      company: companyName,
      companyName: companyName,
      companyInitials: initials,
      companyLogo: logoUrl,
      companyWebsite: job.companyWebsite || '',
      isCompanyVerified: job.isCompanyVerified || false,
      industry: job.industry || '',
      establishedYear: job.establishedYear || job.company?.establishedYear || null,
      organizationSize: job.organizationSize || job.company?.organizationSize || '',
      companyAddress: job.companyAddress || job.company?.address || {},
      companyImages: Array.isArray(job.companyImages) ? job.companyImages : [],
      location: locationDisplay,
      locationDetails: job.location && typeof job.location === 'object' ? job.location : {},
      workMode: job.workMode || 'On-site',
      jobType: job.jobType || 'Full-Time',
      department: job.department || '',
      role: job.role || '',
      qualification: job.qualification || '',
      salaryRange: salaryRange,
      salaryPeriod: job.salary?.period ? `Per ${job.salary.period}` : 'Annual',
      salary: job.salary || {},
      experience: job.experience || {},
      experienceRange,
      noticePeriod: job.noticePeriod || '',
      status: job.status || 'Live',
      approvalStatus: job.approvalStatus || '',
      featured: job.featured || false,
      isNew: job.isNew || false,
      isActive: job.isActive !== false,
      applicantsCount: job.applicantsCount || 0,
      applicantsCap: job.applicantsCap || 100,
      contactVisibility: job.contactVisibility || { whatsapp: false, mobile: false },
      description: job.jobDescription || job.description || '',
      jobDescription: job.jobDescription || job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements : [],
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
      benefits: Array.isArray(job.benefits) ? job.benefits : [],
      skills: Array.isArray(job.skills) ? job.skills : [],
      languages: Array.isArray(job.languages) ? job.languages : [],
      jobTiming: job.jobTiming || '',
      workingDays: job.workingDays || '',
      contactPerson: job.contactPerson || {},
      recruiterWhatsappNumber: job.recruiterWhatsappNumber || '',
      recruiterMobileNumber: job.recruiterMobileNumber || '',
      recruiterEmail: job.recruiterEmail || '',
      recruiterId: job.recruiterId,
      postedBy: resolvedPostedBy as any,
      postedByUserId: job.postedByUserId || '',
      postedByName: resolvedPostedByName,
      postedByEmail: resolvedPostedByEmail,
      postedByRole: resolvedPostedByRole,
      isAdminPosted,
      applicationUrl: job.applicationUrl || '',
      noPaymentInvolved: job.noPaymentInvolved,
      postedDate: job.postedDate || '',
      postedAt: job.postedAt || job.createdAt || '',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      rejectionReason: job.rejectionReason || '',
      whatsapp: whatsappData || job.whatsapp || { enabled: false },
      notes: job.notes || '',
    } as JobItem;
  }, []);

  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    setApiError(null);
    try {
      const statusMap: Record<string, string> = {
        'All jobs': '',
        Live: 'Live',
        Feature: '',
        Drafts: 'Draft',
        Pending: 'Pending Approval',
        Approved: 'Live',
        Rejected: 'Rejected',
        Closed: 'Closed',
      };

      const queryParams: any = {
        status: statusMap[activeTab] || '',
        search: searchQuery || undefined,
        jobType: jobTypeFilter !== 'All' ? jobTypeFilter : undefined,
        workMode: workModeFilter !== 'All' ? workModeFilter : undefined,
        postedBy: postedByFilter !== 'All' ? postedByFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      if (activeTab === 'Feature') {
        queryParams.featured = true;
      }

      Object.keys(queryParams).forEach((k) => {
        if (queryParams[k] === undefined || queryParams[k] === '') delete queryParams[k];
      });

      const response = await jobApi.getJobs(queryParams);

      if (response.success && response.data) {
        const transformedJobs: JobItem[] = response.data
          .map((j: any) => transformJob(j))
          .filter((j: JobItem) => !deletedIdsRef.current.has(j.id));

        console.log('[JobsView] ═══════════ FETCH DEBUG ═══════════');
        console.log('[JobsView] Filter:', postedByFilter, '| Tab:', activeTab);
        console.log('[JobsView] Total jobs returned:', transformedJobs.length);
        console.log('[JobsView] Admin in list:', transformedJobs.filter((j) => (j as any).postedBy === 'admin').length);
        console.log('[JobsView] Recruiter in list:', transformedJobs.filter((j) => (j as any).postedBy === 'recruiter').length);
        console.log('[JobsView] Backend counts:', response.counts);
        console.log('[JobsView] ═════════════════════════════════════');

        setApiJobs(transformedJobs);

        if (response.counts) {
          setCounts((prev) => ({ ...prev, ...response.counts }));
        }

        if (response.pagination) {
          setPagination((prev) => ({
            page: response.pagination.page || prev.page,
            limit: response.pagination.limit || prev.limit,
            total: response.pagination.total ?? response.pagination.totalItems ?? transformedJobs.length,
            pages: response.pagination.pages ?? response.pagination.totalPages ?? 1,
          }));
        } else {
          setPagination((prev) => ({ ...prev, total: transformedJobs.length, pages: 1 }));
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch jobs:', err.message);
      setApiError(err.message);
    } finally {
      setIsLoadingJobs(false);
    }
  }, [activeTab, searchQuery, jobTypeFilter, workModeFilter, postedByFilter, pagination.page, pagination.limit, transformJob]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ✅ FIX: Reset page to 1 whenever filters change (prevents stuck on empty page 5)
  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    // Scroll to top on filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, postedByFilter, jobTypeFilter, workModeFilter, searchQuery]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      fetchJobs();
      refreshTimerRef.current = null;
    }, 800);
  }, [fetchJobs]);

  const handleViewJob = async (job: JobItem) => {
    try {
      setIsLoadingJobDetail(job.id);
      const response = await jobApi.getJobById(job.id);
      if (response.success && response.data) {
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
    setApiJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'Live' as any } : j)));
    setCounts((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1), live: prev.live + 1 }));
    try {
      await jobApi.approveJob(id);
      onApproveJob(id);
      showToast('Job approved successfully!');
      scheduleRefresh();
    } catch (err: any) {
      showToast(err.message || 'Approve failed', 'error');
      fetchJobs();
    }
  };

  const handleRejectJob = async (id: string) => {
    setApiJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: 'Rejected' as any } : j)));
    setCounts((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1), rejected: prev.rejected + 1 }));
    try {
      await jobApi.rejectJob(id, 'Rejected via Admin Panel');
      onRejectJob(id);
      showToast('Job rejected');
      scheduleRefresh();
    } catch (err: any) {
      showToast(err.message || 'Reject failed', 'error');
      fetchJobs();
    }
  };

  const handleToggleFeature = async (id: string) => {
    setApiJobs((prev) => prev.map((j) => (j.id === id ? { ...j, featured: !j.featured } : j)));
    try {
      await jobApi.toggleFeature(id);
      onToggleFeature(id);
      showToast('Feature status updated');
    } catch (err: any) {
      showToast(err.message || 'Feature toggle failed', 'error');
      fetchJobs();
    }
  };

  const handleToggleStatus = async (id: string) => {
    setApiJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: (j.status === 'Live' ? 'Closed' : 'Live') as any } : j
      )
    );
    try {
      await jobApi.toggleStatus(id);
      onToggleStatus(id);
      showToast('Status updated');
      scheduleRefresh();
    } catch (err: any) {
      showToast(err.message || 'Toggle failed', 'error');
      fetchJobs();
    }
  };

  const handleDeleteJob = async (id: string) => {
    setDeleteConfirmId(null);
    setDeletingIds((prev) => new Set(prev).add(id));
    deletedIdsRef.current.add(id);
    setIsDeleting(true);

    setTimeout(() => {
      setApiJobs((prev) => prev.filter((j) => j.id !== id));
      setCounts((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 250);

    try {
      await jobApi.deleteJob(id);
      onDeleteJob(id);
      showToast('Job deleted successfully!');

      setTimeout(() => {
        setTimeout(() => deletedIdsRef.current.delete(id), 5000);
        fetchJobs();
      }, 2000);
    } catch (err: any) {
      deletedIdsRef.current.delete(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(err.message || 'Delete failed on server — please refresh', 'error');
      fetchJobs();
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ FIX: Export with current filters + loading state
  const handleExportClick = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const statusMap: Record<string, string> = {
        'All jobs': '',
        Live: 'Live',
        Feature: '',
        Drafts: 'Draft',
        Pending: 'Pending Approval',
        Approved: 'Live',
        Rejected: 'Rejected',
        Closed: 'Closed',
      };

      const filters: Record<string, any> = {
        status: statusMap[activeTab] || '',
        search: searchQuery || '',
        jobType: jobTypeFilter !== 'All' ? jobTypeFilter : '',
        workMode: workModeFilter !== 'All' ? workModeFilter : '',
        postedBy: postedByFilter !== 'All' ? postedByFilter : '',
      };
      if (activeTab === 'Feature') filters.featured = 'true';

      // Strip empties
      Object.keys(filters).forEach((k) => {
        if (!filters[k]) delete filters[k];
      });

      // Call parent — parent will invoke jobApi.exportJobs
      await onExport(filters);
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(err?.message || 'Export failed', 'error');
    } finally {
      // Keep spinner for ~500ms for visual feedback
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [activeTab, searchQuery, jobTypeFilter, workModeFilter, postedByFilter, onExport, isExporting, showToast]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (activeTab === 'Pending' && job.status !== 'Pending Approval') return false;
      if (activeTab === 'Approved' && job.status !== 'Live') return false;
      if (activeTab === 'Live' && job.status !== 'Live') return false;
      if (activeTab === 'Rejected' && job.status !== 'Rejected') return false;
      if (activeTab === 'Closed' && job.status !== 'Closed') return false;
      if (activeTab === 'Drafts' && job.status !== 'Draft') return false;
      if (activeTab === 'Feature' && !job.featured) return false;

      // ✅ Use helper for consistent detection on client-side filter too
      if (postedByFilter !== 'All') {
        const jobIsAdmin = detectIsAdminJob(job);
        if (postedByFilter === 'admin' && !jobIsAdmin) return false;
        if (postedByFilter === 'recruiter' && jobIsAdmin) return false;
      }

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
  }, [jobs, activeTab, searchQuery, workModeFilter, jobTypeFilter, postedByFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setJobTypeFilter('All');
    setWorkModeFilter('All');
    setPostedByFilter('All');
    setActiveTab('All jobs');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { bg: string; text: string; dot: string; animate?: boolean }> = {
      Live: { bg: 'bg-[#E5F2EB]', text: 'text-[#24593C]', dot: 'bg-[#24593C]', animate: true },
      'Pending Approval': { bg: 'bg-[#FFF3D6]', text: 'text-[#8C5D00]', dot: 'bg-[#8C5D00]' },
      Rejected: { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-error' },
      Expired: { bg: 'bg-surface-container', text: 'text-outline', dot: 'bg-outline' },
      Closed: { bg: 'bg-outline/20', text: 'text-outline', dot: 'bg-outline' },
      Draft: { bg: 'bg-[#EAE8F4]', text: 'text-[#6750A4]', dot: 'bg-[#6750A4]' },
    };
    const c = config[status] || config.Expired;
    const label = status === 'Pending Approval' ? 'Pending' : status;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} ${c.animate ? 'animate-pulse' : ''}`} />
        {label}
      </span>
    );
  };

  const ContactBadges = ({ job, size = 14 }: { job: JobItem; size?: number }) => (
    <div className="inline-flex items-center gap-1 shrink-0">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded">
        <WhatsAppIcon active={!!job.contactVisibility?.whatsapp} size={size} />
      </span>
      <span className="inline-flex items-center justify-center w-5 h-5 rounded">
        <PhoneIcon active={!!job.contactVisibility?.mobile} size={size} />
      </span>
    </div>
  );

  const NoticePeriodBadge = ({ notice, size = 'sm' }: { notice: string; size?: 'sm' | 'md' }) => {
    if (!notice) return null;
    const isSmall = size === 'sm';
    return (
      <span className={`inline-flex items-center gap-1 rounded font-bold whitespace-nowrap ${isSmall ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'} bg-[#EAE8F4] text-[#6750A4] border border-[#6750A4]/20`}>
        <span className={`material-symbols-outlined ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>schedule</span>
        <span>{notice}</span>
      </span>
    );
  };

  const getTabCount = (key: string) => {
    switch (key) {
      case 'All jobs':
        return counts.total;
      case 'Live':
      case 'Approved':
        return counts.live;
      case 'Pending':
        return counts.pending;
      case 'Rejected':
        return counts.rejected;
      case 'Feature':
        return jobs.filter((j) => j.featured).length;
      case 'Drafts':
        return jobs.filter((j) => j.status === 'Draft').length;
      case 'Closed':
        return jobs.filter((j) => j.status === 'Closed').length;
      default:
        return 0;
    }
  };

  const tabList = [
    { key: 'All jobs', label: 'All jobs' },
    { key: 'Live', label: 'Live' },
    { key: 'Feature', label: 'Feature' },
    { key: 'Drafts', label: 'Drafts' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Approved', label: 'Approved' },
    { key: 'Rejected', label: 'Rejected' },
    { key: 'Closed', label: 'Closed' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {toast && (
        <div className={`fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border max-w-sm animate-in fade-in slide-in-from-right ${toast.type === 'success' ? 'bg-[#E5F2EB] border-[#5F8A72]/40 text-[#24593C]' : 'bg-error-container border-error/30 text-on-error-container'}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px] shrink-0">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-error/30 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-error text-[24px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Delete Job Listing?</h3>
                <p className="text-xs text-outline">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant my-4">Are you sure you want to permanently delete this job listing?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)} disabled={isDeleting} className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high cursor-pointer disabled:opacity-50">Cancel</button>
              <button onClick={() => handleDeleteJob(deleteConfirmId)} disabled={isDeleting} className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold hover:bg-error/90 cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                {isDeleting ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Deleting...</span></>) : (<><span className="material-symbols-outlined text-[16px]">delete</span><span>Yes, Delete</span></>)}
              </button>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <div className="p-2.5 rounded-lg bg-[#FFF3D6] border border-[#C58A3A]/30 text-[#8C5D00] text-[11px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] shrink-0">cloud_off</span>
          <span className="flex-1">Backend connection issue: {apiError}</span>
          <button onClick={fetchJobs} className="text-[#C58A3A] hover:underline font-semibold shrink-0">Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">Governance Console</span>
            {isLoadingJobs && (<span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />)}
          </div>
          <h1 className="font-headline-lg text-primary font-bold mt-1">Job Management</h1>
          <p className="font-body-md text-on-surface-variant">Review, approve, edit, and orchestrate career opportunities.</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* ✅ FIX: Export with loading spinner + current filters */}
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md hover:bg-surface-container shadow-xs transition-colors cursor-pointer text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            title={`Export ${postedByFilter !== 'All' ? postedByFilter + ' ' : ''}jobs as CSV`}
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span className="hidden sm:inline">Export CSV</span>
              </>
            )}
          </button>
          <button onClick={onOpenPostJob} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer text-sm active:scale-95">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Post New Job</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: 'Total Jobs', value: counts.total, icon: 'list_alt', color: '' },
          { label: 'Live', value: counts.live, icon: 'check_circle', filter: 'Live', color: '' },
          { label: 'Pending', value: counts.pending, icon: 'pending', filter: 'Pending', color: '' },
          { label: 'Rejected', value: counts.rejected, icon: 'block', filter: 'Rejected', color: '' },
          { label: 'Admin Jobs', value: counts.adminPosted, icon: 'shield_person', postedFilter: 'admin', color: 'border-blue-300 bg-blue-50/60' },
          { label: 'Recruiter Jobs', value: counts.recruiterPosted, icon: 'badge', postedFilter: 'recruiter', color: 'border-amber-300 bg-amber-50/60' },
        ].map((kpi: any) => (
          <div
            key={kpi.label}
            onClick={() => {
              // ✅ FIX: Properly reset BOTH tab AND filter when clicking KPIs
              if (kpi.filter) {
                setActiveTab(kpi.filter as any);
                setPostedByFilter('All');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }
              if (kpi.postedFilter) {
                setPostedByFilter(kpi.postedFilter as any);
                setActiveTab('All jobs');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }
            }}
            className={`p-3 sm:p-4 rounded-xl border shadow-xs transition-all ${(kpi.filter || kpi.postedFilter) ? 'cursor-pointer hover:border-primary hover:shadow-md' : ''} ${kpi.color || 'bg-surface-container-lowest border-surface-variant'} ${
              (kpi.postedFilter && postedByFilter === kpi.postedFilter) ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-md text-outline text-[11px] sm:text-xs">{kpi.label}</span>
              <span
                style={{
                  padding: '4px 6px',
                  borderRadius: '8px',
                  background: kpi.postedFilter === 'admin' ? '#dbeafe' : kpi.postedFilter === 'recruiter' ? '#fef3c7' : '#f3f4f6',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {kpi.postedFilter === 'admin'
                  ? <AdminShieldIcon size={14} color="#1d4ed8" />
                  : kpi.postedFilter === 'recruiter'
                    ? <RecruiterBadgeIcon size={14} color="#b45309" />
                    : <span className="material-symbols-outlined text-[14px] sm:text-[16px]">{kpi.icon}</span>}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl text-primary font-bold tracking-tight mt-1 sm:mt-2">{(kpi.value || 0).toLocaleString()}</h3>
          </div>
        ))}
      </div>

      {/* Active Source Filter Banner */}
      {postedByFilter !== 'All' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid',
            fontSize: '14px',
            fontWeight: 600,
            background: postedByFilter === 'admin' ? '#eff6ff' : '#fffbeb',
            borderColor: postedByFilter === 'admin' ? '#93c5fd' : '#fcd34d',
            color: postedByFilter === 'admin' ? '#1e3a8a' : '#78350f',
          }}
        >
          {postedByFilter === 'admin' ? <AdminShieldIcon size={16} color="#1d4ed8" /> : <RecruiterBadgeIcon size={16} color="#b45309" />}
          <span>Showing only <strong>{postedByFilter === 'admin' ? 'Admin' : 'Recruiter'}</strong> posted jobs ({postedByFilter === 'admin' ? counts.adminPosted : counts.recruiterPosted} total)</span>
          <button
            onClick={() => setPostedByFilter('All')}
            style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-surface-variant scrollbar-hide">
        {tabList.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${activeTab === tab.key ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-black/10'}`}>{getTabCount(tab.key).toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border border-surface-variant shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Job title, Company, ID..." className="w-full pl-9 pr-8 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-xs" />
            {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"><span className="material-symbols-outlined text-[16px]">close</span></button>)}
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <select
              value={postedByFilter}
              onChange={(e) => setPostedByFilter(e.target.value as any)}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: postedByFilter === 'admin' ? '#eff6ff' : postedByFilter === 'recruiter' ? '#fffbeb' : '#ffffff',
                borderColor: postedByFilter === 'admin' ? '#60a5fa' : postedByFilter === 'recruiter' ? '#fbbf24' : '#d1d5db',
                color: postedByFilter === 'admin' ? '#1e3a8a' : postedByFilter === 'recruiter' ? '#78350f' : '#111827',
              }}
            >
              <option value="All">📋 Source: All</option>
              <option value="admin">🛡️ Admin Jobs</option>
              <option value="recruiter">👤 Recruiter Jobs</option>
            </select>

            <select value={jobTypeFilter} onChange={(e) => setJobTypeFilter(e.target.value)} className="px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-xs">
              <option value="All">Type: All</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>

            <select value={workModeFilter} onChange={(e) => setWorkModeFilter(e.target.value)} className="px-2.5 py-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-xs">
              <option value="All">Mode: All</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>

            <button onClick={clearAllFilters} className="px-2.5 py-2 rounded-lg text-outline hover:text-primary flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Job List */}
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
          <button onClick={onOpenPostJob} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">add</span>Create First Job
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-xs overflow-hidden">
          <div className="hidden lg:grid lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_100px_100px_minmax(0,1.2fr)] gap-4 px-5 py-3 bg-surface-container border-b border-surface-variant text-[11px] font-bold text-outline uppercase tracking-wider">
            <div>Job Details</div>
            <div>Location & Mode</div>
            <div>Salary & Notice</div>
            <div className="text-center">Applicants</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="divide-y divide-surface-variant/50">
            {filteredJobs.map((job) => {
              const isBeingDeleted = deletingIds.has(job.id);
              // ✅ Use helper for consistent admin detection
              const isAdmin = detectIsAdminJob(job);

              return (
                <div
                  key={job.id}
                  className={`group transition-all duration-300 hover:bg-surface-container-low/40 ${job.featured ? 'bg-[#C58A3A]/[0.03]' : ''}`}
                  style={{
                    opacity: isBeingDeleted ? 0 : 1,
                    transform: isBeingDeleted ? 'translateX(-20px) scale(0.98)' : 'translateX(0) scale(1)',
                    maxHeight: isBeingDeleted ? 0 : 500,
                    overflow: 'hidden',
                    pointerEvents: isBeingDeleted ? 'none' : 'auto',
                    transition: 'opacity 0.25s ease-out, transform 0.25s ease-out, max-height 0.25s ease-out',
                    borderLeft: `5px solid ${isAdmin ? '#3b82f6' : '#f59e0b'}`,
                  }}
                >
                  {/* ========== DESKTOP ROW ========== */}
                  <div className="hidden lg:grid lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1.5fr)_minmax(0,1.2fr)_100px_100px_minmax(0,1.2fr)] gap-4 px-5 py-3.5 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-container text-on-secondary flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                          {job.companyLogo ? (<img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />) : (job.companyInitials)}
                        </div>
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            background: isAdmin ? '#3b82f6' : '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        >
                          {isAdmin ? <AdminShieldIcon size={8} /> : <RecruiterBadgeIcon size={8} />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 onClick={() => handleViewJob(job)} className="font-bold text-primary text-sm cursor-pointer hover:underline truncate" title={job.title}>{job.title}</h3>
                          {job.featured && (<span className="material-symbols-outlined text-[14px] text-[#C58A3A] shrink-0">star</span>)}
                          <ContactBadges job={job} size={14} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                          <span className="text-xs text-on-surface-variant truncate">{job.company}</span>
                          {job.isCompanyVerified && (<span className="material-symbols-outlined text-[12px] text-[#5F8A72] shrink-0">verified</span>)}
                        </div>
                        <div style={{ marginTop: '6px', display: 'block', overflow: 'visible' }}>
                          <PostedByTag job={job} />
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {job.isNew && (<span className="px-1.5 py-0.5 rounded bg-primary-container text-on-secondary font-bold text-[9px] leading-none">NEW</span>)}
                          <span className="text-[10px] text-outline">{job.jobType}</span>
                          {job.industry && (<span className="text-[10px] text-outline">· {job.industry}</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="material-symbols-outlined text-[14px] text-outline shrink-0">location_on</span>
                        <span className="text-xs text-on-surface-variant truncate">{job.location || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[14px] text-outline shrink-0">work</span>
                        <span className="text-xs text-outline">{job.workMode}</span>
                      </div>
                      {job.organizationSize && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-outline shrink-0">groups</span>
                          <span className="text-[10px] text-outline truncate">{job.organizationSize}</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-primary truncate">{job.salaryRange}</div>
                      <div className="text-[10px] text-outline mt-0.5">{job.salaryPeriod || 'Annual'}</div>
                      {job.experienceRange && (<div className="text-[10px] text-outline mt-1 truncate">🎯 {job.experienceRange}</div>)}
                      {job.noticePeriod && (<div className="mt-1.5"><NoticePeriodBadge notice={job.noticePeriod} size="sm" /></div>)}
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-bold text-primary">{job.applicantsCount}<span className="text-outline font-normal text-[10px]">/{job.applicantsCap}</span></div>
                      <div className="w-full max-w-[80px] mx-auto bg-surface-container h-1 rounded-full overflow-hidden mt-1">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((job.applicantsCount / job.applicantsCap) * 100))}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-center"><StatusBadge status={job.status} /></div>

                    <div className="flex items-center justify-end gap-1">
                      {job.status === 'Pending Approval' ? (
                        <>
                          <button onClick={() => handleApproveJob(job.id)} className="w-8 h-8 rounded-lg bg-[#5F8A72] text-white flex items-center justify-center hover:opacity-90 cursor-pointer transition-opacity" title="Approve"><span className="material-symbols-outlined text-[16px]">check</span></button>
                          <button onClick={() => handleRejectJob(job.id)} className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center hover:bg-error-container/80 cursor-pointer transition-colors" title="Reject"><span className="material-symbols-outlined text-[16px]">close</span></button>
                          <button onClick={() => handleViewJob(job)} disabled={isLoadingJobDetail === job.id} className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50" title="View">
                            {isLoadingJobDetail === job.id ? (<span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />) : (<span className="material-symbols-outlined text-[16px]">visibility</span>)}
                          </button>
                          {onEditJob && (<button onClick={() => onEditJob(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors" title="Edit"><span className="material-symbols-outlined text-[16px]">edit</span></button>)}
                          <button onClick={() => setDeleteConfirmId(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error-container/30 flex items-center justify-center cursor-pointer transition-colors" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleViewJob(job)} disabled={isLoadingJobDetail === job.id} className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50" title="View">
                            {isLoadingJobDetail === job.id ? (<span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />) : (<span className="material-symbols-outlined text-[16px]">visibility</span>)}
                          </button>
                          {onEditJob && (<button onClick={() => onEditJob(job.id)} className="h-8 px-2.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer hover:bg-primary-container transition-colors" title="Edit"><span className="material-symbols-outlined text-[14px]">edit</span><span>Edit</span></button>)}
                          <button onClick={() => handleToggleFeature(job.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container cursor-pointer transition-colors ${job.featured ? 'text-[#C58A3A]' : 'text-outline hover:text-[#C58A3A]'}`} title={job.featured ? 'Unfeature' : 'Feature'}>
                            <span className="material-symbols-outlined text-[16px]">{job.featured ? 'star' : 'star_border'}</span>
                          </button>
                          <button onClick={() => handleToggleStatus(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container flex items-center justify-center cursor-pointer transition-colors" title={job.status === 'Live' ? 'Pause' : 'Activate'}>
                            <span className="material-symbols-outlined text-[16px]">{job.status === 'Live' ? 'pause_circle' : 'play_circle'}</span>
                          </button>
                          <button onClick={() => setDeleteConfirmId(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error-container/30 flex items-center justify-center cursor-pointer transition-colors" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* ========== TABLET ROW ========== */}
                  <div className="hidden md:block lg:hidden px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-lg bg-primary-container text-on-secondary flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
                          {job.companyLogo ? (<img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />) : (job.companyInitials)}
                        </div>
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            background: isAdmin ? '#3b82f6' : '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isAdmin ? <AdminShieldIcon size={8} /> : <RecruiterBadgeIcon size={8} />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 onClick={() => handleViewJob(job)} className="font-bold text-primary text-sm cursor-pointer hover:underline truncate">{job.title}</h3>
                              {job.featured && (<span className="material-symbols-outlined text-[14px] text-[#C58A3A] shrink-0">star</span>)}
                              <ContactBadges job={job} size={13} />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-xs text-on-surface-variant truncate">{job.company}</span>
                              {job.isCompanyVerified && (<span className="material-symbols-outlined text-[12px] text-[#5F8A72] shrink-0">verified</span>)}
                              {job.industry && (<span className="text-[10px] text-outline">· {job.industry}</span>)}
                            </div>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div style={{ marginTop: '6px', display: 'block', overflow: 'visible' }}>
                          <PostedByTag job={job} />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-outline">location_on</span>
                              <span className="text-[10px] text-outline uppercase font-bold">Location</span>
                            </div>
                            <span className="text-xs text-on-surface-variant block truncate">{job.location || 'N/A'}</span>
                            <span className="text-[10px] text-outline">{job.workMode}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-outline">payments</span>
                              <span className="text-[10px] text-outline uppercase font-bold">Salary</span>
                            </div>
                            <span className="text-xs text-primary font-bold block truncate">{job.salaryRange}</span>
                            <span className="text-[10px] text-outline">{job.salaryPeriod || 'Annual'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="material-symbols-outlined text-[12px] text-outline">group</span>
                              <span className="text-[10px] text-outline uppercase font-bold">Applicants</span>
                            </div>
                            <span className="text-xs text-primary font-bold">{job.applicantsCount}/{job.applicantsCap}</span>
                            <div className="w-full max-w-[80px] bg-surface-container h-1 rounded-full overflow-hidden mt-0.5">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(100, Math.round((job.applicantsCount / job.applicantsCap) * 100))}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-variant/40">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {job.isNew && (<span className="px-1.5 py-0.5 rounded bg-primary-container text-on-secondary font-bold text-[9px]">NEW</span>)}
                            <span className="text-[10px] text-outline">{job.jobType}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {job.status === 'Pending Approval' ? (
                              <>
                                <button onClick={() => handleApproveJob(job.id)} className="w-8 h-8 rounded-lg bg-[#5F8A72] text-white flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">check</span></button>
                                <button onClick={() => handleRejectJob(job.id)} className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">close</span></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleToggleFeature(job.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${job.featured ? 'text-[#C58A3A]' : 'text-outline'}`}><span className="material-symbols-outlined text-[16px]">{job.featured ? 'star' : 'star_border'}</span></button>
                                <button onClick={() => handleToggleStatus(job.id)} className="w-8 h-8 rounded-lg text-outline flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">{job.status === 'Live' ? 'pause_circle' : 'play_circle'}</span></button>
                              </>
                            )}
                            <button onClick={() => setDeleteConfirmId(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-error flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                            <button onClick={() => handleViewJob(job)} disabled={isLoadingJobDetail === job.id} className="w-8 h-8 rounded-lg text-outline hover:text-primary flex items-center justify-center cursor-pointer disabled:opacity-50">
                              {isLoadingJobDetail === job.id ? (<span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />) : (<span className="material-symbols-outlined text-[16px]">visibility</span>)}
                            </button>
                            {onEditJob && (<button onClick={() => onEditJob(job.id)} className="h-8 px-2 rounded-lg bg-primary text-on-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer"><span className="material-symbols-outlined text-[14px]">edit</span>Edit</button>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ========== MOBILE ROW ========== */}
                  <div className="md:hidden px-3 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-container text-on-secondary flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                          {job.companyLogo ? (<img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />) : (job.companyInitials)}
                        </div>
                        <span
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            background: isAdmin ? '#3b82f6' : '#f59e0b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isAdmin ? <AdminShieldIcon size={7} /> : <RecruiterBadgeIcon size={7} />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 onClick={() => handleViewJob(job)} className="font-bold text-primary text-sm cursor-pointer hover:underline truncate">{job.title}</h3>
                              {job.featured && (<span className="material-symbols-outlined text-[12px] text-[#C58A3A] shrink-0">star</span>)}
                              <ContactBadges job={job} size={12} />
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[11px] text-on-surface-variant truncate">{job.company}</span>
                              {job.isCompanyVerified && (<span className="material-symbols-outlined text-[11px] text-[#5F8A72] shrink-0">verified</span>)}
                            </div>
                          </div>
                          <StatusBadge status={job.status} />
                        </div>
                        <div style={{ marginTop: '4px', display: 'block', overflow: 'visible' }}>
                          <PostedByTag job={job} compact />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[11px]">
                          <span className="flex items-center gap-1 text-on-surface-variant">
                            <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                            <span className="truncate max-w-[120px]">{job.location || 'N/A'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-outline">
                            <span className="material-symbols-outlined text-[13px]">work</span>{job.workMode}
                          </span>
                          <span className="text-primary font-bold">{job.salaryRange}</span>
                          <span className="text-outline">{job.jobType}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                          {job.isNew && (<span className="px-1.5 py-0.5 rounded bg-primary-container text-on-secondary font-bold text-[8px]">NEW</span>)}
                          <span className="text-[10px] text-outline">{job.applicantsCount}/{job.applicantsCap} applicants</span>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-surface-variant/40">
                          <div className="flex items-center gap-0.5">
                            {job.status === 'Pending Approval' ? (
                              <>
                                <button onClick={() => handleApproveJob(job.id)} className="w-8 h-8 rounded-lg bg-[#5F8A72] text-white flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">check</span></button>
                                <button onClick={() => handleRejectJob(job.id)} className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">close</span></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => handleToggleFeature(job.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer ${job.featured ? 'text-[#C58A3A]' : 'text-outline'}`}><span className="material-symbols-outlined text-[16px]">{job.featured ? 'star' : 'star_border'}</span></button>
                                <button onClick={() => handleToggleStatus(job.id)} className="w-8 h-8 rounded-lg text-outline flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">{job.status === 'Live' ? 'pause_circle' : 'play_circle'}</span></button>
                              </>
                            )}
                            <button onClick={() => setDeleteConfirmId(job.id)} className="w-8 h-8 rounded-lg text-outline hover:text-error flex items-center justify-center cursor-pointer"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleViewJob(job)} disabled={isLoadingJobDetail === job.id} className="h-8 px-2.5 rounded-lg border border-outline-variant text-outline hover:text-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50">
                              {isLoadingJobDetail === job.id ? (<span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />) : (<span className="material-symbols-outlined text-[14px]">visibility</span>)}
                              <span>View</span>
                            </button>
                            {onEditJob && (<button onClick={() => onEditJob(job.id)} className="h-8 px-2.5 rounded-lg bg-primary text-on-primary text-[11px] font-semibold flex items-center gap-1 cursor-pointer"><span className="material-symbols-outlined text-[14px]">edit</span><span>Edit</span></button>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <div className="bg-surface-container-lowest p-3 sm:p-4 rounded-xl border border-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
          <div>Showing {filteredJobs.length} of {pagination.total || filteredJobs.length} results</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40 text-xs">Previous</button>
            <span className="px-3 py-1.5 rounded bg-primary text-on-primary font-bold text-xs">{pagination.page}</span>
            <button onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages || 1, prev.page + 1) }))} disabled={pagination.page >= (pagination.pages || 1)} className="px-2.5 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40 text-xs">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};