// FILE: frontend/src/App.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { ApplicationHierarchyView } from './views/ApplicationHierarchyView';
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

// ✅ Map NavItem IDs to URL paths
const TAB_TO_PATH: Record<string, string> = {
  'dashboard': '/dashboard',
  'job-approvals': '/job-approvals',
  'jobs': '/jobs',
  'candidates': '/candidates',
  'recruiters': '/recruiters',
  'verification': '/verification',
  'applications': '/applications',
  'application-hierarchy': '/application-hierarchy',
  'admin-activity-log': '/admin-activity-log',
  'roles-and-permissions': '/roles-and-permissions',
  'bottom-nav-config': '/bottom-nav-config',
  'notifications': '/notifications',
  'payments-and-billing': '/payments-and-billing',
  'manage-subscriptions': '/manage-subscriptions',
  'admin-jobs': '/admin-jobs',
  'candidate-profile-pricing': '/candidate-profile-pricing',
  'payment-dashboard': '/payment-dashboard',
  'banners': '/banners',
  'reports-and-complaints': '/reports-and-complaints',
  'content-management': '/content-management',
  'platform-settings': '/platform-settings',
  'resumes-and-profiles': '/resumes-and-profiles',
};

const PATH_TO_TAB: Record<string, string> = Object.entries(TAB_TO_PATH).reduce(
  (acc, [tab, path]) => ({ ...acc, [path]: tab }),
  {}
);

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
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // ✅ Derive currentTab from URL
  const currentTab: NavItem = useMemo(() => {
    const path = location.pathname;
    const tab = PATH_TO_TAB[path];
    return (tab || 'dashboard') as NavItem;
  }, [location.pathname]);

  // ✅ Helper to navigate to a tab (updates URL)
  const setCurrentTab = useCallback(
    (tab: NavItem | string) => {
      const path = TAB_TO_PATH[tab as string] || `/${tab}`;
      navigate(path);
    },
    [navigate]
  );

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
      navigate('/login');
      setPostJobMode('closed');
      setEditingJobId(null);
      setSidebarCounts(INITIAL_SIDEBAR_COUNTS);
      showToast(reason || 'Your account has been deleted or deactivated.', 'error');
    },
    [showToast, navigate]
  );

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) return;

    let eventSource: EventSource | null = null;
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
        adminApi
          .getMe()
          .then((res) => {
            if (!res.success || !res.admin || res.admin.isActive === false) {
              handleForceLogout('Your account is no longer valid.');
            }
          })
          .catch(() => {});
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

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const storedInfo = localStorage.getItem('adminInfo');

      if (!token || !storedInfo) return;

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
          // ✅ Only navigate if currently on login/root
          if (location.pathname === '/' || location.pathname === '/login') {
            const landing = res.admin.landingPage || ROLE_DEFAULT_TABS[res.admin.role] || 'dashboard';
            navigate(TAB_TO_PATH[landing] || '/dashboard');
          }
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
      }
    };
    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSuccess = async (user: AdminUser, selectedRole?: string) => {
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
        navigate(TAB_TO_PATH[landing as string] || '/dashboard');
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
    navigate(TAB_TO_PATH[fallbackUser.landingPage as string] || '/dashboard');
    showToast(`Signed in as ${user.name} (${activeRole})`, 'success');
  };

  const handleSelectRole = (newRole: string) => {
    if (!currentUser) return;
    const updatedUser: AdminUser = { ...currentUser, activeRole: newRole };
    setCurrentUser(updatedUser);
    const defaultLanding = ROLE_DEFAULT_TABS[newRole] || 'dashboard';
    navigate(TAB_TO_PATH[defaultLanding] || '/dashboard');
    showToast(`Persona switched to ${newRole}.`, 'info');
  };

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {}
    setCurrentUser(null);
    navigate('/login');
    setPostJobMode('closed');
    setEditingJobId(null);
    setSidebarCounts(INITIAL_SIDEBAR_COUNTS);
    showToast('Signed out of administrative console.', 'info');
  };

  const handleOpenCreateJob = () => {
    setEditingJobId(null);
    setPostJobMode('create');
    navigate('/jobs');
    setPostJobFormKey((k) => k + 1);
  };

  const handleEditJob = (jobId: string) => {
    setEditingJobId(jobId);
    setPostJobMode('edit');
    navigate('/jobs');
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
    navigate('/candidates');
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
    if (!currentUser) return;
    if (permittedTabs.length === 0) return;
    if (isTabPermitted) return;

    const landing =
      currentUser.landingPage && permittedTabs.includes(currentUser.landingPage)
        ? currentUser.landingPage
        : permittedTabs[0];

    console.warn(
      `⛔ Tab "${currentTab}" not permitted for "${currentUser.activeRole}". Redirecting to "${landing}"`
    );
    navigate(TAB_TO_PATH[landing as string] || '/dashboard');
  }, [currentUser, currentTab, isTabPermitted, permittedTabs, navigate]);

  // ✅ Close post-job overlay when leaving /jobs route
  useEffect(() => {
    if (location.pathname !== '/jobs' && postJobMode !== 'closed') {
      setPostJobMode('closed');
      setEditingJobId(null);
    }
  }, [location.pathname, postJobMode]);

  if (!currentUser) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ✅ Wrapper for all authenticated routes (keeps Sidebar + Header)
  const AuthLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
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
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenRolePicker={() => setIsRolePickerOpen(true)}
        onLogout={handleLogout}
      />

      <main className="ml-[260px] pt-16 min-h-screen bg-background p-space-lg">
        {!isTabPermitted ? (
          <AccessRestrictedView
            attemptedTab={currentTab}
            currentRole={currentUser.activeRole}
            userRoles={currentUser.roles}
            onNavigateAllowed={(tab) => setCurrentTab(tab)}
            onOpenRolePicker={() => setIsRolePickerOpen(true)}
          />
        ) : (
          children
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
        onSelectTab={(tab) => setCurrentTab(tab)}
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

  return (
    <Routes>
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <AuthLayout>
            <DashboardView
              jobs={jobs}
              verifications={verifications}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onVerifyEntity={(id, name) => handleDashboardVerifyEntity(id, name)}
              onInspectEntity={(_id) => {
                setCurrentTab('verification');
              }}
              onExportReport={() => handleExportData('Platform_Overview')}
            />
          </AuthLayout>
        }
      />

      <Route
        path="/job-approvals"
        element={
          <AuthLayout>
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
          </AuthLayout>
        }
      />

      <Route
        path="/payments-and-billing"
        element={
          <AuthLayout>
            <PaymentsBillingView
              onToast={(msg, type) => showToast(msg, type || 'success')}
            />
          </AuthLayout>
        }
      />

      <Route
        path="/manage-subscriptions"
        element={
          <AuthLayout>
            <SubscriptionManagementView />
          </AuthLayout>
        }
      />

      <Route
        path="/candidate-profile-pricing"
        element={
          <AuthLayout>
            <PricingSettingsView />
          </AuthLayout>
        }
      />

      <Route
        path="/payment-dashboard"
        element={
          <AuthLayout>
            <PaymentDashboardView />
          </AuthLayout>
        }
      />

      <Route
        path="/jobs"
        element={
          <AuthLayout>
            {postJobMode !== 'closed' ? (
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
                onSelectTab={(tab) => setCurrentTab(tab)}
                onExport={(filters?: Record<string, any>) => handleExportData('Jobs', filters)}
              />
            )}
          </AuthLayout>
        }
      />

      <Route
        path="/candidates"
        element={
          <AuthLayout>
            <CandidatesView />
          </AuthLayout>
        }
      />

      <Route
        path="/recruiters"
        element={
          <AuthLayout>
            <RecruitersView />
          </AuthLayout>
        }
      />

      <Route
        path="/verification"
        element={
          <AuthLayout>
            <VerificationView
              onToast={(msg, type) => {
                showToast(msg, type);
                refreshSidebarCounts();
              }}
            />
          </AuthLayout>
        }
      />

      <Route
        path="/applications"
        element={
          <AuthLayout>
            <ApplicationsView />
          </AuthLayout>
        }
      />

      <Route
        path="/application-hierarchy"
        element={
          <AuthLayout>
            <ApplicationHierarchyView />
          </AuthLayout>
        }
      />

      <Route
        path="/admin-activity-log"
        element={
          <AuthLayout>
            <ActivityLogView />
          </AuthLayout>
        }
      />

      <Route
        path="/roles-and-permissions"
        element={
          <AuthLayout>
            <RolesPermissionsView />
          </AuthLayout>
        }
      />

      <Route
        path="/bottom-nav-config"
        element={
          <AuthLayout>
            <BottomNavConfigView />
          </AuthLayout>
        }
      />

      <Route
        path="/notifications"
        element={
          <AuthLayout>
            <NotificationsView />
          </AuthLayout>
        }
      />

      <Route
        path="/admin-jobs"
        element={
          <AuthLayout>
            <AdminJobsView />
          </AuthLayout>
        }
      />

      {/* Catch-all for unknown routes → placeholder */}
      <Route
        path="*"
        element={
          <AuthLayout>
            <PlaceholderView tab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />
          </AuthLayout>
        }
      />
    </Routes>
  );
}