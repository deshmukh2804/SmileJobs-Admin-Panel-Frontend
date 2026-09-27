// FILE: frontend/src/views/UsersView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { userManagementApi } from '../services/api';

interface CandidateItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  city?: string;
  subLocation?: string;
  state?: string;
  country?: string;
  gender?: string;
  birthday?: string;
  aboutMe?: string;
  jobTitle?: string;
  currentCompany?: string;
  currentSalary?: string;
  startDate?: string;
  industry?: string;
  workType?: string;
  experienceLevel?: string;
  totalExperience?: string;
  englishLevel?: string;
  skills?: string[];
  knownLanguages?: string[];
  degree?: string;
  specialization?: string;
  collegeName?: string;
  endYear?: string;
  certifications?: any[];
  resumeUrl?: string;
  resumeFileName?: string;
  isActive?: boolean;
  isVerified?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  isVisibleToRecruiters?: boolean;
  profileCompletion?: number;
  authProvider?: string;
  googleId?: string;
  role?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  applicationCount?: number;
}

interface RecruiterItem {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  profileImage?: { url: string };
  designation?: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  about?: string;
  verified?: boolean;
  isActive?: boolean;
  authProvider?: string;
  googleId?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  whatsappContactEnabled?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  jobCount?: number;
}

type UserTab = 'candidates' | 'recruiters';
type FilterStatus = 'all' | 'active' | 'blocked' | 'verified';

interface LoginMethodInfo {
  label: string;
  icon: string;
  bg: string;
  text: string;
  emoji: string;
}

const getLoginMethod = (user: any): LoginMethodInfo => {
  const provider = (user.authProvider || '').toLowerCase();
  const hasGoogleId = !!user.googleId;
  const hasPhone = !!(user.phone || user.phoneNumber || user.mobileNumber);

  if (provider === 'google' || hasGoogleId) {
    return {
      label: 'Google',
      icon: 'account_circle',
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      emoji: '🔴',
    };
  }

  if (provider === 'mobile' || provider === 'otp' || provider === 'phone') {
    return {
      label: 'Mobile OTP',
      icon: 'sms',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      emoji: '📱',
    };
  }

  if (hasPhone && !user.email) {
    return {
      label: 'Mobile OTP',
      icon: 'sms',
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-700',
      emoji: '📱',
    };
  }

  return {
    label: 'Email',
    icon: 'mail',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    emoji: '✉️',
  };
};

const LoginMethodBadge: React.FC<{ user: any; size?: 'sm' | 'md' }> = ({ user, size = 'sm' }) => {
  const method = getLoginMethod(user);
  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${method.bg} ${method.text} ${
        isSm ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      <span className={`material-symbols-outlined ${isSm ? 'text-[12px]' : 'text-[14px]'}`}>{method.icon}</span>
      {method.label}
    </span>
  );
};

export const UsersView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserTab>('candidates');
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, verified: 0 });
  const [selectedUser, setSelectedUser] = useState<CandidateItem | RecruiterItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
  } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '20',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      };

      if (activeTab === 'candidates') {
        const res = await userManagementApi.getCandidates(params);
        if (res.success) {
          setCandidates(res.data || []);
          setTotalPages(res.pagination?.pages || 1);
          setTotal(res.pagination?.total || 0);
          setStats(res.stats || { total: 0, active: 0, inactive: 0, verified: 0 });
        }
      } else {
        const res = await userManagementApi.getRecruiters(params);
        if (res.success) {
          setRecruiters(res.data || []);
          setTotalPages(res.pagination?.pages || 1);
          setTotal(res.pagination?.total || 0);
          setStats(res.stats || { total: 0, active: 0, inactive: 0, verified: 0 });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedUser(null);
    setFilterStatus('all');
    setFilterProvider('all');
  }, [activeTab]);

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      if (activeTab === 'candidates') {
        const res = await userManagementApi.getCandidateById(id);
        if (res.success) setSelectedUser(res.data);
      } else {
        const res = await userManagementApi.getRecruiterById(id);
        if (res.success) setSelectedUser(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load details', 'error');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const performToggleStatus = async (id: string) => {
    setActionLoading('status');
    try {
      const res = activeTab === 'candidates'
        ? await userManagementApi.toggleCandidateStatus(id)
        : await userManagementApi.toggleRecruiterStatus(id);
      if (res.success) {
        showToast(res.message);
        if (selectedUser && selectedUser._id === id) {
          setSelectedUser({ ...selectedUser, isActive: res.data?.isActive });
        }
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleToggleStatus = (user: CandidateItem | RecruiterItem) => {
    const isBlocking = user.isActive !== false;
    setConfirmAction({
      title: isBlocking ? 'Block User' : 'Unblock User',
      message: isBlocking
        ? `Are you sure you want to block ${user.name}? They will not be allowed to sign in.`
        : `Unblock ${user.name}? This user will recover full access to the portal.`,
      variant: isBlocking ? 'warning' : 'danger',
      onConfirm: () => performToggleStatus(user._id),
    });
  };

  const performDelete = async (id: string) => {
    setActionLoading('delete');
    try {
      const res = activeTab === 'candidates'
        ? await userManagementApi.deleteCandidate(id)
        : await userManagementApi.deleteRecruiter(id);
      if (res.success) {
        showToast(res.message);
        setSelectedUser(null);
        setShowDetailModal(false);
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleDelete = (user: CandidateItem | RecruiterItem) => {
    setConfirmAction({
      title: 'Delete User Permanently',
      message: `Permanently delete ${user.name}? All database references including applications and files will be permanently purged. This action CANNOT be undone.`,
      variant: 'danger',
      onConfirm: () => performDelete(user._id),
    });
  };

  const performToggleVerification = async (id: string) => {
    setActionLoading('verify');
    try {
      const res = await userManagementApi.toggleRecruiterVerification(id);
      if (res.success) {
        showToast(res.message);
        if (selectedUser && selectedUser._id === id && 'verified' in selectedUser) {
          setSelectedUser({ ...selectedUser, verified: res.data?.verified } as RecruiterItem);
        }
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Verification toggle failed', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleToggleVerification = (recruiter: RecruiterItem) => {
    setConfirmAction({
      title: recruiter.verified ? 'Revoke Verification' : 'Verify Recruiter',
      message: recruiter.verified
        ? `Remove verification badge from ${recruiter.name}?`
        : `Mark ${recruiter.name} as a verified recruiter?`,
      onConfirm: () => performToggleVerification(recruiter._id),
    });
  };

  const filteredList = () => {
    let list: any[] = activeTab === 'candidates' ? candidates : recruiters;
    
    if (filterStatus === 'active') list = list.filter((u) => u.isActive !== false);
    else if (filterStatus === 'blocked') list = list.filter((u) => u.isActive === false);
    else if (filterStatus === 'verified')
      list = list.filter((u) => u.isVerified || u.verified);

    if (filterProvider !== 'all') {
      list = list.filter((u) => {
        const method = getLoginMethod(u).label.toLowerCase();
        return method.includes(filterProvider.toLowerCase());
      });
    }
    
    return list;
  };

  const displayList = filteredList();

  const providerCounts = () => {
    const list = activeTab === 'candidates' ? candidates : recruiters;
    const counts = { google: 0, email: 0, mobile: 0 };
    list.forEach((u: any) => {
      const label = getLoginMethod(u).label.toLowerCase();
      if (label.includes('google')) counts.google++;
      else if (label.includes('mobile')) counts.mobile++;
      else counts.email++;
    });
    return counts;
  };
  const pCounts = providerCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">User Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Oversee, configure, audit, and block platform users
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high text-sm font-medium hover:bg-surface-container-highest transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh System
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 w-fit">
        {(
          [
            { key: 'candidates' as const, label: 'Candidates', icon: 'person' },
            { key: 'recruiters' as const, label: 'Recruiters', icon: 'business_center' },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: 'all' as const, label: 'Total', value: stats.total, icon: 'group', color: 'text-primary', bg: 'bg-primary/5', ring: 'ring-primary' },
          { key: 'active' as const, label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-500' },
          { key: 'blocked' as const, label: 'Blocked', value: stats.inactive, icon: 'block', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-500' },
          { key: 'verified' as const, label: 'Verified', value: stats.verified, icon: 'verified', color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-500' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilterStatus(s.key)}
            className={`${s.bg} rounded-xl p-4 flex items-center gap-3 transition-all cursor-pointer hover:scale-[1.02] text-left ${
              filterStatus === s.key ? `ring-2 ${s.ring}` : ''
            }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${s.color}`}>{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-on-surface">{s.value.toLocaleString()}</p>
              <p className="text-xs text-outline">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Connection / Auth Filter */}
      <div className="bg-surface-container-low rounded-xl p-3">
        <div className="flex items-center gap-3 flex-wrap animate-fade-in">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">
            Filter Sign In Source:
          </span>
          {[
            { key: 'all', label: 'All Sources', count: pCounts.google + pCounts.email + pCounts.mobile, icon: 'apps', color: 'bg-surface-container-high text-on-surface border-surface-variant' },
            { key: 'google', label: 'Google', count: pCounts.google, icon: 'account_circle', color: 'bg-red-50 text-red-700 border-red-200' },
            { key: 'mobile', label: 'OTP Code', count: pCounts.mobile, icon: 'sms', color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { key: 'email', label: 'Email Only', count: pCounts.email, icon: 'mail', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setFilterProvider(p.key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                filterProvider === p.key
                  ? 'ring-2 ring-primary ' + p.color
                  : p.color + ' opacity-75 hover:opacity-100'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
              {p.label}
              <span className="px-1.5 py-0.5 rounded-full bg-white/60 text-[10px] font-bold">
                {p.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${activeTab} by name, email, credentials...`}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-variant bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* User Grid Content */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-outline mt-3 font-medium">Querying active users database...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-surface-variant">
            <span className="material-symbols-outlined text-[56px] text-outline">person_off</span>
            <p className="text-lg font-medium text-on-surface mt-2">No matching accounts found</p>
            <p className="text-sm text-outline mt-1">Refine your active filters or text search query</p>
          </div>
        ) : activeTab === 'candidates' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(displayList as CandidateItem[]).map((c) => (
              <div
                key={c._id}
                onClick={() => handleViewDetail(c._id)}
                className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-surface-variant shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-xl shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-on-surface truncate">{c.name}</h3>
                      {c.isVerified && (
                        <span className="material-symbols-outlined text-[16px] text-blue-500" title="Verified">
                          verified
                        </span>
                      )}
                      {c.isActive === false && (
                        <span className="text-[9px] tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold uppercase">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate font-mono mt-0.5">{c.email}</p>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <LoginMethodBadge user={c} />
                      {c.jobTitle && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                          {c.jobTitle}
                        </span>
                      )}
                      {c.city && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-outline">
                          📍 {c.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-container-high" />
                        <circle
                          cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${(c.profileCompletion || 0) * 0.94} 100`}
                          className="text-primary transition-all"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-primary">{c.profileCompletion || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(displayList as RecruiterItem[]).map((r) => (
              <div
                key={r._id}
                onClick={() => handleViewDetail(r._id)}
                className="bg-surface-container-lowest rounded-xl border border-surface-variant p-4 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  {r.profileImage?.url ? (
                    <img
                      src={r.profileImage.url}
                      alt={r.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-surface-variant shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-xl shrink-0">
                      {r.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-on-surface truncate">{r.name}</h3>
                      {r.verified && (
                        <span className="material-symbols-outlined text-[16px] text-green-500" title="Verified">
                          verified
                        </span>
                      )}
                      {r.isActive === false && (
                        <span className="text-[9px] tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold uppercase">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono truncate mt-0.5">{r.email}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <LoginMethodBadge user={r} />
                      {r.companyName && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          🏢 {r.companyName}
                        </span>
                      )}
                      {r.jobCount !== undefined && r.jobCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                          {r.jobCount} jobs posted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 cursor-pointer hover:bg-surface-container-highest transition"
            >
              ← Previous Page
            </button>
            <span className="text-xs text-on-surface-variant px-3">
              Page <b>{page}</b> of <b>{totalPages}</b> ({total} accounts)
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 cursor-pointer hover:bg-surface-container-highest transition"
            >
              Next Page →
            </button>
          </div>
        )}
      </div>

      {/* Detailed Modal Overlay */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !selectedUser ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-sm text-outline mt-3">Fetching full account records...</p>
              </div>
            ) : (
              <>
                {/* Header Profile Section */}
                <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border-b border-surface-variant">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>

                  <div className="flex items-center gap-4">
                    {'avatarUrl' in selectedUser && selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : 'profileImage' in selectedUser && selectedUser.profileImage?.url ? (
                      <img src={selectedUser.profileImage.url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-on-primary font-bold text-3xl border-4 border-white shadow-lg animate-pulse">
                        {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-on-surface truncate">{selectedUser.name}</h2>
                        {(('isVerified' in selectedUser && selectedUser.isVerified) ||
                          ('verified' in selectedUser && selectedUser.verified)) && (
                          <span className="material-symbols-outlined text-[18px] text-blue-500" title="System Verified Account">verified</span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-on-surface-variant truncate mt-0.5">{selectedUser.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase ${
                            selectedUser.isActive !== false
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {selectedUser.isActive !== false ? '● Active' : '● Blocked'}
                        </span>
                        <LoginMethodBadge user={selectedUser} size="md" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Authentication Section */}
                  <Section title="System Authentication & Metadata" icon="key">
                    <div className="bg-surface-container-low rounded-xl p-4 space-y-3 border border-surface-variant">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getLoginMethod(selectedUser).bg}`}>
                          <span className={`material-symbols-outlined text-[20px] ${getLoginMethod(selectedUser).text}`}>
                            {getLoginMethod(selectedUser).icon}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-outline uppercase tracking-wider">Login Strategy</p>
                          <p className="text-sm font-bold text-on-surface">
                            {getLoginMethod(selectedUser).label} Auth Connection {getLoginMethod(selectedUser).emoji}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-surface-variant">
                        {'googleId' in selectedUser && selectedUser.googleId && (
                          <div>
                            <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Verified Google ID</p>
                            <p className="text-xs font-mono text-on-surface truncate mt-0.5">{selectedUser.googleId}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">User Role Group</p>
                          <p className="text-xs text-on-surface mt-0.5 font-bold uppercase tracking-wider">
                            {selectedUser.role?.replace('_', ' ') || (activeTab === 'candidates' ? 'Job Seeker' : 'Recruiter')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Contact Email</p>
                          <p className="text-xs font-mono text-on-surface mt-0.5 flex items-center gap-1">
                            {selectedUser.email}
                            {(selectedUser.isEmailVerified || (selectedUser as any).isVerified) && (
                              <span className="material-symbols-outlined text-[13px] text-green-500 font-bold">check_circle</span>
                            )}
                          </p>
                        </div>
                        {(selectedUser.phone || selectedUser.phoneNumber || (selectedUser as any).mobileNumber) && (
                          <div>
                            <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Mobile Number</p>
                            <p className="text-xs text-on-surface font-mono mt-0.5 flex items-center gap-1">
                              {selectedUser.phone || selectedUser.phoneNumber || (selectedUser as any).mobileNumber}
                              {selectedUser.isPhoneVerified && (
                                <span className="material-symbols-outlined text-[13px] text-green-500 font-bold">check_circle</span>
                              )}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Created Date</p>
                          <p className="text-xs text-on-surface mt-0.5 font-semibold">
                            {new Date(selectedUser.createdAt).toLocaleString('en-US', { dateStyle: 'long' })}
                          </p>
                        </div>
                        {selectedUser.lastLogin && (
                          <div>
                            <p className="text-[10px] text-outline uppercase tracking-wider font-semibold">Last Verified Access</p>
                            <p className="text-xs text-on-surface mt-0.5 font-semibold">
                              {new Date(selectedUser.lastLogin).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Section>

                  {/* Profile Completion details */}
                  <Section title="Basic Metrics" icon="analytics">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {'city' in selectedUser && selectedUser.city && (
                        <InfoCard
                          icon="location_on"
                          label="Location"
                          value={`${selectedUser.city}${selectedUser.subLocation ? ` (${selectedUser.subLocation})` : ''}`}
                        />
                      )}
                      {'gender' in selectedUser && selectedUser.gender && (
                        <InfoCard icon="wc" label="Gender" value={selectedUser.gender} />
                      )}
                      {'birthday' in selectedUser && selectedUser.birthday && (
                        <InfoCard icon="cake" label="Birthdate" value={selectedUser.birthday} />
                      )}
                      {'applicationCount' in selectedUser && selectedUser.applicationCount !== undefined && (
                        <InfoCard icon="task" label="Applications" value={String(selectedUser.applicationCount)} />
                      )}
                      {'jobCount' in selectedUser && selectedUser.jobCount !== undefined && (
                        <InfoCard icon="work_history" label="Jobs Posted" value={String(selectedUser.jobCount)} />
                      )}
                    </div>
                  </Section>

                  {/* About Block */}
                  {(selectedUser.aboutMe || (selectedUser as any).about) && (
                    <Section title="About / Profile Bio" icon="article">
                      <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap bg-surface-container-low p-3 rounded-lg border">
                        {selectedUser.aboutMe || (selectedUser as any).about}
                      </p>
                    </Section>
                  )}

                  {/* Professional Detail Block (Candidate Only) */}
                  {'jobTitle' in selectedUser && (selectedUser.jobTitle || selectedUser.currentCompany) && (
                    <Section title="Candidate Job Experience" icon="history_edu">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-surface-container-low p-4 rounded-xl border">
                        {selectedUser.jobTitle && <InfoRow label="Current Job Title" value={selectedUser.jobTitle} />}
                        {selectedUser.currentCompany && <InfoRow label="Employer Company" value={selectedUser.currentCompany} />}
                        {selectedUser.experienceLevel && <InfoRow label="Experience Band" value={selectedUser.experienceLevel} />}
                        {selectedUser.totalExperience && <InfoRow label="Aggregate Experience Years" value={selectedUser.totalExperience} />}
                        {selectedUser.currentSalary && <InfoRow label="Current Compensation" value={selectedUser.currentSalary} />}
                        {selectedUser.workType && <InfoRow label="Desired Mode" value={selectedUser.workType} />}
                      </div>
                    </Section>
                  )}

                  {/* Education details */}
                  {'collegeName' in selectedUser && (selectedUser.collegeName || selectedUser.degree) && (
                    <Section title="Education History" icon="school">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-container-low p-4 rounded-xl border">
                        {selectedUser.degree && <InfoRow label="Academic Degree" value={selectedUser.degree} />}
                        {selectedUser.specialization && <InfoRow label="Field of Study" value={selectedUser.specialization} />}
                        {selectedUser.collegeName && <InfoRow label="University / College" value={selectedUser.collegeName} />}
                        {selectedUser.endYear && <InfoRow label="Graduation Year" value={selectedUser.endYear} />}
                      </div>
                    </Section>
                  )}

                  {/* Resume URL Link */}
                  {'resumeUrl' in selectedUser && selectedUser.resumeUrl && (
                    <Section title="Resume Document" icon="picture_as_pdf">
                      <a
                        href={selectedUser.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all border border-primary/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">file_open</span>
                        {selectedUser.resumeFileName || 'Download Submitted Resume'}
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    </Section>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-surface-variant bg-surface-container-low flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={!!actionLoading}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 ${
                      selectedUser.isActive !== false
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedUser.isActive !== false ? 'block' : 'check_circle'}
                    </span>
                    {selectedUser.isActive !== false ? 'Block Portal Access' : 'Unblock Access'}
                  </button>

                  {activeTab === 'recruiters' && 'verified' in selectedUser && (
                    <button
                      onClick={() => handleToggleVerification(selectedUser as RecruiterItem)}
                      disabled={!!actionLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      {(selectedUser as RecruiterItem).verified ? 'Revoke Verified Badge' : 'Grant Verified status'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedUser)}
                    disabled={!!actionLoading}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    Purge Record
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  confirmAction.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {confirmAction.variant === 'danger' ? 'warning' : 'help'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-on-surface">{confirmAction.title}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                disabled={!!actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${
                  confirmAction.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {actionLoading ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
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

const InfoCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-2.5 border border-surface-variant">
    <span className="material-symbols-outlined text-[18px] text-primary mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] text-outline uppercase tracking-wider font-bold">{label}</p>
      <p className="text-xs text-on-surface font-semibold truncate mt-0.5">{value}</p>
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[9px] text-outline uppercase tracking-wider font-bold">{label}</p>
    <p className="text-xs text-on-surface font-semibold mt-0.5">{value}</p>
  </div>
);

const Section: React.FC<{ title: string; icon?: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="space-y-2">
    <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider flex items-center gap-2">
      {icon ? (
        <span className="material-symbols-outlined text-[16px] text-primary font-bold">{icon}</span>
      ) : (
        <span className="w-1.5 h-3.5 bg-primary rounded-full" />
      )}
      {title}
    </h3>
    {children}
  </div>
);