// FILE: frontend/src/App.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { AddUserModal } from './components/AddUserModal';
import { JobDetailModal } from './components/JobDetailModal';
import { RolePickerModal } from './components/RolePickerModal';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { Toast } from './components/Toast';

import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { JobsView } from './views/JobsView';
import { JobApprovalsView } from './views/JobApprovalsView';
import { PostJobView } from './views/PostJobView';
import { CandidatesView } from './views/CandidatesView';
import { RecruitersView } from './views/RecruitersView';
import { VerificationView } from './views/VerificationView';
import { ApplicationsView } from './views/ApplicationsView';
import { ApplicationHierarchyView } from './views/ApplicationHierarchyView'; // ✅ FIXED: capital 'A'
import { ActivityLogView } from './views/ActivityLogView';
import { RolesPermissionsView } from './views/RolesPermissionsView';
import { BottomNavConfigView } from './views/BottomNavConfigView';
import { NotificationsView } from './views/NotificationsView';
import { PlaceholderView } from './views/PlaceholderView';
import { PaymentsBillingView } from './views/PaymentsBillingView';
import { SubscriptionManagementView } from './views/SubscriptionManagementView';
import { AdminJobsView } from './views/AdminJobsView';
import { PricingSettingsView } from './views/PricingSettingsView';
import { PaymentDashboardView } from './views/PaymentDashboardView';

import { INITIAL_JOBS, INITIAL_USERS, INITIAL_VERIFICATIONS } from './data/mockData';
import { jobApi, adminApi, dashboardApi, API_BASE_URL, paymentDashboardApi } from './services/api';
import {
  AdminUser,
  JobItem,
  NavItem,
  ROLE_DEFAULT_TABS,
  ROLE_PERMISSIONS,
  UserItem,
  VerificationItem,
} from './types';

interface SidebarCounts {
  pendingVerificationsCount: number;
  pendingJobsCount: number;
  activeJobsCount: number;
  totalCandidatesCount: number;
  totalRecruitersCount: number;
  totalApplicationsCount: number;
  reportsCount: number;
  totalPurchasesCount: number;
}

const INITIAL_SIDEBAR_COUNTS: SidebarCounts = {
  pendingVerificationsCount: 0,
  pendingJobsCount: 0,
  activeJobsCount: 0,
  totalCandidatesCount: 0,
  totalRecruitersCount: 0,
  totalApplicationsCount: 0,
  reportsCount: 0,
  totalPurchasesCount: 0,
};

const ADMIN_EMAILS = ['smilejobs@gmail.com', 'admin@smilejobs.com', 'admin@careerflow.com'];
const ADMIN_ROLES = ['admin', 'super admin', 'superadmin', 'sub admin', 'subadmin'];
const ADMIN_NAMES = ['smile jobs', 'smilejobs', 'admin'];
const RECRUITER_ROLES = ['recruiter', 'employer', 'hr'];

const detectIsAdminJob = (job: any): boolean => {
  if (!job) return false;
  if (typeof job.isAdminPosted === 'boolean') return job.isAdminPosted;
  const pb = String(job.postedBy || '').toLowerCase().trim();
  if (pb === 'admin') return true;
  if (pb === 'recruiter') return false;
  const role = String(job.postedByRole || '').toLowerCase().trim();
  if (RECRUITER_ROLES.includes(role)) return false;
  if (ADMIN_ROLES.includes(role)) return true;
  const email = String(job.postedByEmail || '').toLowerCase().trim();
  if (email && ADMIN_EMAILS.includes(email)) return true;
  const name = String(job.postedByName || '').toLowerCase().trim();
  if (name && ADMIN_NAMES.includes(name)) return true;
  if (job.recruiterId) return false;
  if (job.recruiterEmail && String(job.recruiterEmail).trim()) return false;
  if (job.contactPerson && (job.contactPerson.name || job.contactPerson.designation)) return false;
  return false;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [currentTab, setCurrentTab] = useState<any>('dashboard');

  // ✅ FIX: Track whether session restoration is in-progress on page refresh.
  // Initialize to TRUE if a token exists in localStorage — so we show a loader
  // instead of flashing the login screen while /me is being validated.
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const storedInfo = localStorage.getItem('adminInfo');
    return !!(token && storedInfo);
  });

  const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);

  const [verifications] = useState<VerificationItem[]>(INITIAL_VERIFICATIONS);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [inspectedJob, setInspectedJob] = useState<JobItem | null>(null);
  const [isLoadingJobDetail, setIsLoadingJobDetail] = useState(false);

  const [postJobMode, setPostJobMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);
  const [postJobFormKey, setPostJobFormKey] = useState(0);

  const [sidebarCounts, setSidebarCounts] = useState<SidebarCounts>(INITIAL_SIDEBAR_COUNTS);

  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  // ── Refs to break infinite loops ──
  const redirectGuardRef = useRef<string | null>(null);
  const sseErrorCheckRef = useRef<boolean>(false);
  const sessionRestoredRef = useRef<boolean>(false);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 5000);
    },
    []
  );

  const handleForceLogout = useCallback(
    (reason?: string) => {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');

      try {
        const channel = new BroadcastChannel('careerflow_instant_auth');
        channel.postMessage({ type: 'INSTANT_REVOKE', reason });
        channel.close();
      } catch {}

      setCurrentUser(null);
      setCurrentTab('dashboard');
      setPostJobMode('closed');
      setEditingJobId(null);
      setSidebarCounts(INITIAL_SIDEBAR_COUNTS);
      redirectGuardRef.current = null;
      sessionRestoredRef.current = false;
      showToast(reason || 'Your account has been deleted or deactivated.', 'error');
    },
    [showToast]
  );

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) return;

    let eventSource: EventSource | null = null;
    sseErrorCheckRef.current = false;

    try {
      eventSource = new EventSource(`${API_BASE_URL}/auth/stream?token=${encodeURIComponent(token)}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'FORCE_LOGOUT') {
            console.warn('⚡ [INSTANT LOGOUT] Received kill-signal from server!');
            handleForceLogout(data.reason);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource?.readyState === EventSource.CLOSED) {
          if (sseErrorCheckRef.current) return;
          sseErrorCheckRef.current = true;

          adminApi
            .getMe()
            .then((res) => {
              if (!res.success || !res.admin || res.admin.isActive === false) {
                handleForceLogout('Your account is no longer valid.');
              }
            })
            .catch(() => {})
            .finally(() => {
              sseErrorCheckRef.current = false;
            });
        }
      };
    } catch {}

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('careerflow_instant_auth');
      channel.onmessage = (event) => {
        if (event.data?.type === 'INSTANT_REVOKE') {
          handleForceLogout(event.data.reason);
        }
      };
    } catch {}

    const onForceLogoutEvent = (e: any) => {
      handleForceLogout(e.detail?.reason);
    };
    window.addEventListener('auth:force_logout', onForceLogoutEvent);

    return () => {
      if (eventSource) eventSource.close();
      if (channel) channel.close();
      window.removeEventListener('auth:force_logout', onForceLogoutEvent);
    };
  }, [currentUser, handleForceLogout]);

  const transformJobFull = (job: any): JobItem => {
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

    const isAdminPosted = detectIsAdminJob(job);
    const resolvedPostedBy = isAdminPosted ? 'admin' : 'recruiter';
    const resolvedPostedByName =
      job.postedByName ||
      (isAdminPosted
        ? 'Smile Jobs'
        : (job.recruiterId && typeof job.recruiterId === 'object' && job.recruiterId.name) ||
          job.contactPerson?.name ||
          'Recruiter');
    const resolvedPostedByEmail =
      job.postedByEmail ||
      (isAdminPosted
        ? 'smilejobs@gmail.com'
        : (job.recruiterId && typeof job.recruiterId === 'object' && job.recruiterId.email) ||
          job.recruiterEmail ||
          '');
    const resolvedPostedByRole =
      job.postedByRole || (isAdminPosted ? 'Super Admin' : 'Recruiter');

    return {
      id: job._id || job.id,
      title: job.title || '',
      company: companyName,
      companyInitials: initials,
      companyLogo: logoUrl,
      companyWebsite: job.companyWebsite || '',
      isCompanyVerified: job.isCompanyVerified || false,
      industry: job.industry || '',
      department: job.department || '',
      role: job.role || '',
      qualification: job.qualification || '',
      location: job.locationDisplay || job.location?.city || '',
      workMode: job.workMode || 'On-site',
      salaryRange: job.salaryRange || 'Not Disclosed',
      salaryPeriod: job.salary?.period ? `Per ${job.salary.period}` : 'Annual',
      jobType: job.jobType || 'Full-Time',
      status: job.status || 'Live',
      featured: job.featured || false,
      isNew: job.isNew || false,
      isActive: job.isActive,
      postedDate: job.postedDate || '',
      postedAt: job.postedAt || job.createdAt || '',
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
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
      rejectionReason: job.rejectionReason || '',
      recruiterWhatsappNumber: job.recruiterWhatsappNumber || '',
      recruiterMobileNumber: job.recruiterMobileNumber || '',
      recruiterEmail: job.recruiterEmail || '',
      whatsapp: job.whatsapp || { enabled: false },
      notes: job.notes || '',
      approvalStatus: job.approvalStatus || '',
      submittedForReviewAt: job.submittedForReviewAt || '',
      approvedAt: job.approvedAt || '',
      approvedBy: job.approvedBy || '',
      reviewNotes: job.reviewNotes || '',
      lastEditedAfterApproval: job.lastEditedAfterApproval || false,
      postedBy: resolvedPostedBy,
      postedByName: resolvedPostedByName,
      postedByEmail: resolvedPostedByEmail,
      postedByRole: resolvedPostedByRole,
      isAdminPosted,
      recruiterId: job.recruiterId || null,
    } as JobItem;
  };

  const refreshJobs = useCallback(async () => {
    try {
      const response = await jobApi.getJobs();
      if (response.success && response.data) {
        const transformedJobs: JobItem[] = response.data.map(transformJobFull);
        setJobs(transformedJobs);
      }
    } catch (err) {
      console.error('Failed to refresh jobs:', err);
    }
  }, []);

  const refreshSidebarCounts = useCallback(async () => {
    try {
      const res = await dashboardApi.getStats();
      let purchasesCount = 0;
      try {
        const payRes = await paymentDashboardApi.getStats();
        if (payRes.success && payRes.stats) {
          purchasesCount = payRes.stats.counts.total || 0;
        }
      } catch {}

      if (res.success && res.data) {
        setSidebarCounts({
          pendingVerificationsCount: res.data.kpis.pendingVerification.value || 0,
          pendingJobsCount: res.data.jobFunnel?.pending?.count || 0,
          activeJobsCount: res.data.kpis.activeJobs.value || 0,
          totalCandidatesCount: res.data.kpis.totalCandidates.value || 0,
          totalRecruitersCount: res.data.kpis.totalEmployers.value || 0,
          totalApplicationsCount: res.data.kpis.applications.value || 0,
          reportsCount: res.data.kpis.reportsComplaints.value || 0,
          totalPurchasesCount: purchasesCount,
        });
      }
    } catch (err) {
      console.error('Failed to refresh sidebar counts:', err);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentUser) refreshJobs();
  }, [currentUser, refreshJobs]);

  useEffect(() => {
    if (!currentUser) return;
    refreshSidebarCounts();
    const interval = setInterval(refreshSidebarCounts, 30000);
    return () => clearInterval(interval);
  }, [currentUser, refreshSidebarCounts]);

  // ── FIX: Session restoration on page refresh. ──
  // We only mark session as "restored" AFTER /me completes (success or failure).
  // During the in-flight period, isRestoringSession stays true and the UI
  // shows a loader instead of flashing to the login page.
  useEffect(() => {
    if (sessionRestoredRef.current) return;

    const restoreSession = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const storedInfo = localStorage.getItem('adminInfo');

      if (!token || !storedInfo) {
        setIsRestoringSession(false);
        sessionRestoredRef.current = true;
        return;
      }

      try {
        const res = await adminApi.getMe();
        if (res.success && res.admin && res.admin.isActive !== false) {
          const restoredUser: AdminUser = {
            id: res.admin.id || res.admin.adminId,
            name: res.admin.name,
            email: res.admin.email,
            avatarUrl:
              res.admin.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            roles: [res.admin.role],
            activeRole: res.admin.role,
            department: res.admin.department || 'Platform Operations',
            twoFactorEnabled: false,
            permissions: res.admin.permissions || [],
            landingPage: res.admin.landingPage || 'dashboard',
          };

          setCurrentUser(restoredUser);
          setCurrentTab(res.admin.landingPage || ROLE_DEFAULT_TABS[res.admin.role] || 'dashboard');
          sessionRestoredRef.current = true;
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          sessionRestoredRef.current = true;
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        sessionRestoredRef.current = true;
      } finally {
        setIsRestoringSession(false);
      }
    };
    restoreSession();
  }, []);

  const handleLoginSuccess = async (user: AdminUser, selectedRole?: string) => {
    sessionRestoredRef.current = true;
    redirectGuardRef.current = null;

    try {
      const meRes = await adminApi.getMe();
      if (meRes.success && meRes.admin) {
        const activeRole = selectedRole || meRes.admin.role || user.activeRole;
        const fullUser: AdminUser = {
          id: meRes.admin.id || meRes.admin.adminId,
          name: meRes.admin.name,
          email: meRes.admin.email,
          avatarUrl:
            meRes.admin.avatarUrl ||
            user.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          roles: [meRes.admin.role],
          activeRole,
          department: meRes.admin.department || 'Platform Operations',
          twoFactorEnabled: false,
          permissions: meRes.admin.permissions || [],
          landingPage: meRes.admin.landingPage || 'dashboard',
        };

        setCurrentUser(fullUser);
        const landing =
          fullUser.landingPage ||
          (fullUser.permissions && fullUser.permissions.length > 0
            ? fullUser.permissions[0]
            : ROLE_DEFAULT_TABS[activeRole] || 'dashboard');
        setCurrentTab(landing as NavItem);
        showToast(`Signed in as ${fullUser.name} (${activeRole})`, 'success');
        return;
      }
    } catch (err) {
      console.error('❌ Failed to fetch /me after login:', err);
    }

    const activeRole = selectedRole || user.activeRole;
    const fallbackUser: AdminUser = {
      ...user,
      activeRole,
      permissions: user.permissions || [],
      landingPage: user.landingPage || 'dashboard',
    };
    setCurrentUser(fallbackUser);
    setCurrentTab((fallbackUser.landingPage as NavItem) || 'dashboard');
    showToast(`Signed in as ${user.name} (${activeRole})`, 'success');
  };

  const handleSelectRole = (newRole: string) => {
    if (!currentUser) return;
    redirectGuardRef.current = null;
    const updatedUser: AdminUser = { ...currentUser, activeRole: newRole };
    setCurrentUser(updatedUser);
    const defaultLanding = ROLE_DEFAULT_TABS[newRole] || 'dashboard';
    setCurrentTab(defaultLanding);
    showToast(`Persona switched to ${newRole}.`, 'info');
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {}
    setCurrentUser(null);
    setCurrentTab('dashboard');
    setPostJobMode('closed');
    setEditingJobId(null);
    setSidebarCounts(INITIAL_SIDEBAR_COUNTS);
    redirectGuardRef.current = null;
    sessionRestoredRef.current = false;
    showToast('Signed out of administrative console.', 'info');
  };

  const handleOpenCreateJob = () => {
    setEditingJobId(null);
    setPostJobMode('create');
    setCurrentTab('jobs');
    setPostJobFormKey((k) => k + 1);
  };

  const handleEditJob = (jobId: string) => {
    setEditingJobId(jobId);
    setPostJobMode('edit');
    setCurrentTab('jobs');
    setPostJobFormKey((k) => k + 1);
  };

  const handleClosePostJob = () => {
    setPostJobMode('closed');
    setEditingJobId(null);
  };

  const handlePostJobSuccess = () => {
    const wasEditing = !!editingJobId;
    setPostJobMode('closed');
    setEditingJobId(null);
    setJobsRefreshKey((k) => k + 1);
    refreshJobs();
    refreshSidebarCounts();
    showToast(wasEditing ? 'Job updated successfully!' : 'Job posted successfully! It is now live.', 'success');
  };

  const handleInspectJob = async (job: JobItem) => {
    setInspectedJob(job);
    setIsLoadingJobDetail(true);
    try {
      const response = await jobApi.getJobById(job.id);
      if (response.success && response.data) {
        const rawJob = response.data.job || response.data;
        const fullJob = transformJobFull(rawJob);
        if (response.data.whatsapp) fullJob.whatsapp = response.data.whatsapp;
        setInspectedJob(fullJob);
      }
    } catch (err: any) {
      console.error('Failed to load full job:', err);
    } finally {
      setIsLoadingJobDetail(false);
    }
  };

  const handleApproveJob = async (id: string) => {
    try {
      await jobApi.approveJob?.(id);
      setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, status: 'Live' as const } : job)));
      showToast(`✅ Job approved and is now live for candidates!`, 'success');
      await refreshJobs();
      await refreshSidebarCounts();
    } catch (err: any) {
      console.error('Approve job failed:', err);
      showToast(err?.message || 'Failed to approve job', 'error');
    }
  };

  const handleRejectJob = async (id: string, reason?: string) => {
    try {
      await jobApi.rejectJob?.(id, reason || 'Not approved by admin');
      setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, status: 'Rejected' as const, rejectionReason: reason || '' } : job)));
      showToast(`❌ Job rejected. Recruiter has been notified.`, 'info');
      await refreshJobs();
      await refreshSidebarCounts();
    } catch (err: any) {
      console.error('Reject job failed:', err);
      showToast(err?.message || 'Failed to reject job', 'error');
    }
  };

  const handleDeleteJob = async (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
    await refreshSidebarCounts();
  };

  const handleToggleJobFeature = async (id: string) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, featured: !job.featured } : job)));
    showToast(`Updated featured status for job ${id}`);
    await refreshJobs();
  };

  const handleToggleJobStatus = async (id: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id ? { ...job, status: (job.status === 'Live' ? 'Expired' : 'Live') as any } : job
      )
    );
    showToast(`Job status updated successfully.`);
    await refreshJobs();
    await refreshSidebarCounts();
  };

  const handleSaveUser = (newUser: UserItem) => {
    setUsers((prev) => [newUser, ...prev]);
    setCurrentTab('candidates');
    showToast(`Created new ${newUser.role} account for ${newUser.name}!`);
    refreshSidebarCounts();
  };

  const handleDashboardVerifyEntity = (_id: string, name: string) => {
    showToast(`Approved credentials & issued verified badge for "${name}"!`);
    refreshSidebarCounts();
  };

  const handleExportData = async (moduleName: string, params?: Record<string, any>) => {
    try {
      if (moduleName === 'Jobs') {
        showToast('Preparing CSV export... please wait', 'info');
        const result = await jobApi.exportJobs(params || {});
        showToast(`✅ Exported successfully as ${result.filename}`, 'success');
        return;
      }

      const filename = `SmileJobs_${moduleName}_Export_${new Date().toISOString().slice(0, 10)}.csv`;
      const csvContent =
        'data:text/csv;charset=utf-8,ID,Name,Type,Status,Date\nSJ-01,Record 1,Verified,Active,2026-10-12';
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Exported ${moduleName} data to ${filename}`);
    } catch (err: any) {
      console.error('Export failed:', err);
      showToast(err?.message || 'Export failed. Please try again.', 'error');
    }
  };

  const permittedTabs = useMemo<NavItem[]>(() => {
    if (!currentUser) return [];

    const roleName = (currentUser.activeRole || '').trim();
    const isSuperAdmin =
      roleName.toLowerCase() === 'super admin' || roleName.toLowerCase() === 'superadmin';

    if (isSuperAdmin) {
      const basePermitted = ROLE_PERMISSIONS['Super Admin'] || [];
      return [...basePermitted, 'admin-jobs' as any];
    }

    if (Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0) {
      return [...currentUser.permissions, 'admin-jobs' as any];
    }

    return ['admin-jobs' as any];
  }, [currentUser]);

  const isTabPermitted = useMemo(() => {
    if (currentTab === 'admin-jobs') return true;
    if (currentTab === 'job-approvals') {
      const roleName = (currentUser?.activeRole || '').toLowerCase();
      if (roleName === 'super admin' || roleName === 'superadmin' || roleName === 'admin') return true;
      return permittedTabs.includes(currentTab) || permittedTabs.includes('jobs');
    }
    return permittedTabs.includes(currentTab);
  }, [permittedTabs, currentTab, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      redirectGuardRef.current = null;
      return;
    }
    if (permittedTabs.length === 0) return;
    if (isTabPermitted) {
      redirectGuardRef.current = null;
      return;
    }

    const landing =
      currentUser.landingPage && permittedTabs.includes(currentUser.landingPage as any)
        ? currentUser.landingPage
        : permittedTabs[0];

    const landingStr = String(landing);

    if (redirectGuardRef.current === landingStr) {
      return;
    }

    redirectGuardRef.current = landingStr;

    console.warn(
      `⛔ Tab "${currentTab}" not permitted for "${currentUser.activeRole}". Redirecting to "${landingStr}"`
    );
    setCurrentTab(landing);
  }, [currentUser, currentTab, isTabPermitted, permittedTabs]);

  // ✅ FIX: Show a full-screen loader while restoring the session on page refresh.
  // This prevents the brief flash of the login screen before /me resolves.
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-outline mt-3 font-medium">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          redirectGuardRef.current = null;
          setCurrentTab(tab);
          if (tab !== 'jobs') setPostJobMode('closed');
        }}
        currentUser={currentUser}
        pendingVerificationsCount={sidebarCounts.pendingVerificationsCount}
        pendingJobsCount={sidebarCounts.pendingJobsCount}
        activeJobsCount={sidebarCounts.activeJobsCount}
        totalCandidatesCount={sidebarCounts.totalCandidatesCount}
        totalRecruitersCount={sidebarCounts.totalRecruitersCount}
        totalApplicationsCount={sidebarCounts.totalApplicationsCount}
        reportsCount={sidebarCounts.reportsCount}
        totalPurchasesCount={sidebarCounts.totalPurchasesCount}
        onOpenRolePicker={() => setIsRolePickerOpen(true)}
        onLogout={handleLogout}
      />

      <Header
        currentTab={currentTab}
        currentUser={currentUser}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenPostVerify={handleOpenCreateJob}
        onSelectTab={(tab) => {
          redirectGuardRef.current = null;
          setCurrentTab(tab);
        }}
        onOpenRolePicker={() => setIsRolePickerOpen(true)}
        onLogout={handleLogout}
      />

      <main className="ml-[260px] pt-16 min-h-screen bg-background p-space-lg">
        {!isTabPermitted ? (
          <AccessRestrictedView
            attemptedTab={currentTab}
            currentRole={currentUser.activeRole}
            userRoles={currentUser.roles}
            onNavigateAllowed={(tab) => {
              redirectGuardRef.current = null;
              setCurrentTab(tab);
            }}
            onOpenRolePicker={() => setIsRolePickerOpen(true)}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                jobs={jobs}
                verifications={verifications}
                onSelectTab={(tab) => {
                  redirectGuardRef.current = null;
                  setCurrentTab(tab);
                }}
                onVerifyEntity={(id, name) => handleDashboardVerifyEntity(id, name)}
                onInspectEntity={(_id) => {
                  redirectGuardRef.current = null;
                  setCurrentTab('verification');
                }}
                onExportReport={() => handleExportData('Platform_Overview')}
              />
            )}

            {currentTab === 'job-approvals' && (
              <JobApprovalsView
                onApprove={handleApproveJob}
                onReject={handleRejectJob}
                onInspectJob={handleInspectJob}
                onRefresh={() => {
                  refreshJobs();
                  refreshSidebarCounts();
                }}
                onToast={showToast}
              />
            )}

            {currentTab === 'payments-and-billing' && (
              <PaymentsBillingView
                onToast={(msg, type) => showToast(msg, type || 'success')}
              />
            )}

            {currentTab === 'manage-subscriptions' && <SubscriptionManagementView />}

            {currentTab === 'candidate-profile-pricing' && <PricingSettingsView />}
            {currentTab === 'payment-dashboard' && <PaymentDashboardView />}

            {currentTab === 'jobs' &&
              (postJobMode !== 'closed' ? (
                <PostJobView
                  key={`postjob-${postJobMode}-${editingJobId || 'new'}-${postJobFormKey}`}
                  onClose={handleClosePostJob}
                  onSuccess={handlePostJobSuccess}
                  editJobId={postJobMode === 'edit' ? editingJobId : null}
                />
              ) : (
                <JobsView
                  key={jobsRefreshKey}
                  jobs={jobs}
                  onSelectJob={handleInspectJob}
                  onOpenPostJob={handleOpenCreateJob}
                  onEditJob={handleEditJob}
                  onApproveJob={handleApproveJob}
                  onRejectJob={handleRejectJob}
                  onDeleteJob={handleDeleteJob}
                  onToggleFeature={handleToggleJobFeature}
                  onToggleStatus={handleToggleJobStatus}
                  onSelectTab={(tab) => {
                    redirectGuardRef.current = null;
                    setCurrentTab(tab);
                  }}
                  onExport={(filters?: Record<string, any>) => handleExportData('Jobs', filters)}
                />
              ))}

            {currentTab === 'candidates' && <CandidatesView />}
            {currentTab === 'recruiters' && <RecruitersView />}

            {currentTab === 'verification' && (
              <VerificationView
                onToast={(msg, type) => {
                  showToast(msg, type);
                  refreshSidebarCounts();
                }}
              />
            )}

            {currentTab === 'applications' && <ApplicationsView />}
            {currentTab === 'application-hierarchy' && <ApplicationHierarchyView />}
            {currentTab === 'admin-activity-log' && <ActivityLogView />}
            {currentTab === 'roles-and-permissions' && <RolesPermissionsView />}
            {currentTab === 'bottom-nav-config' && <BottomNavConfigView />}
            {currentTab === 'notifications' && <NotificationsView />}

            {currentTab === 'admin-jobs' && <AdminJobsView />}

            {![
              'dashboard',
              'job-approvals',
              'jobs',
              'candidates',
              'recruiters',
              'verification',
              'applications',
              'application-hierarchy',
              'admin-activity-log',
              'roles-and-permissions',
              'bottom-nav-config',
              'notifications',
              'payments-and-billing',
              'manage-subscriptions',
              'admin-jobs',
              'candidate-profile-pricing',
              'payment-dashboard',
            ].includes(currentTab) && (
              <PlaceholderView tab={currentTab} onSelectTab={(tab) => {
                redirectGuardRef.current = null;
                setCurrentTab(tab);
              }} />
            )}
          </>
        )}
      </main>

      <RolePickerModal
        isOpen={isRolePickerOpen}
        onClose={() => setIsRolePickerOpen(false)}
        currentUser={currentUser}
        onSelectRole={handleSelectRole}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        jobs={jobs}
        users={users}
        currentRole={currentUser.activeRole}
        onSelectTab={(tab) => {
          redirectGuardRef.current = null;
          setCurrentTab(tab);
        }}
        onSelectJob={handleInspectJob}
        onOpenRolePicker={() => setIsRolePickerOpen(true)}
      />

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSaveUser={handleSaveUser}
      />

      <JobDetailModal
        job={inspectedJob}
        isLoading={isLoadingJobDetail}
        onClose={() => setInspectedJob(null)}
        onApprove={handleApproveJob}
        onReject={handleRejectJob}
        onToggleFeature={handleToggleJobFeature}
        onToggleStatus={handleToggleJobStatus}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}