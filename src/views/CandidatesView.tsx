// FILE: frontend/src/views/CandidatesView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  profileCompletion?: number;
  authProvider?: string;
  googleId?: string;
  lastLogin?: string;
  createdAt: string;
  applicationCount?: number;
}

const shortId = (id?: string) => (id ? id.slice(-8).toUpperCase() : '—');

const getLoginProvider = (u: any) => {
  const p = (u.authProvider || '').toLowerCase();
  if (p === 'google' || u.googleId) return { label: 'Google', emoji: '🔴', class: 'bg-red-50 text-red-700 border-red-200' };
  if (p === 'mobile' || p === 'otp' || p === 'phone') return { label: 'OTP', emoji: '📱', class: 'bg-purple-50 text-purple-700 border-purple-200' };
  return { label: 'Email', emoji: '✉️', class: 'bg-blue-50 text-blue-700 border-blue-200' };
};

export const CandidatesView: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'verified'>('all');
  const [filterProvider, setFilterProvider] = useState<'all' | 'google' | 'email' | 'mobile'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, verified: 0 });
  const [selectedUser, setSelectedUser] = useState<CandidateItem | null>(null);
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
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '24',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filterStatus === 'active' ? { isActive: 'true' } : {}),
        ...(filterStatus === 'blocked' ? { isActive: 'false' } : {}),
        ...(filterStatus === 'verified' ? { isVerified: 'true' } : {}),
      };
      const res = await userManagementApi.getCandidates(params);
      if (res.success) {
        setCandidates(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
        setStats(res.stats || { total: 0, active: 0, inactive: 0, verified: 0 });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch candidates', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const res = await userManagementApi.getCandidateById(id);
      if (res.success) setSelectedUser(res.data);
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
      const res = await userManagementApi.toggleCandidateStatus(id);
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

  const handleToggleStatus = (user: CandidateItem) => {
    const isBlocking = user.isActive !== false;
    setConfirmAction({
      title: isBlocking ? 'Block Candidate' : 'Unblock Candidate',
      message: isBlocking
        ? `Block ${user.name}? They will lose mobile portal access immediately.`
        : `Unblock ${user.name}? Full access will be restored.`,
      variant: isBlocking ? 'warning' : 'danger',
      onConfirm: () => performToggleStatus(user._id),
    });
  };

  const performDelete = async (id: string) => {
    setActionLoading('delete');
    try {
      const res = await userManagementApi.deleteCandidate(id);
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

  const handleDelete = (user: CandidateItem) => {
    setConfirmAction({
      title: 'Delete Candidate Permanently',
      message: `Permanently delete ${user.name}? All applications, submissions, and files will be purged. This CANNOT be undone.`,
      variant: 'danger',
      onConfirm: () => performDelete(user._id),
    });
  };

  const displayList = useMemo(() => {
    if (filterProvider === 'all') return candidates;
    return candidates.filter((c) => {
      const p = getLoginProvider(c).label.toLowerCase();
      if (filterProvider === 'mobile') return p === 'otp';
      return p === filterProvider;
    });
  }, [candidates, filterProvider]);

  return (
    <div className="space-y-4">
      {/* ═══════ COMPACT HEADER ═══════ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[22px] text-primary">person</span>
            Candidates Directory
            <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
          </h1>
          <p className="text-[11px] text-outline mt-0.5">Manage mobile job-seeker accounts • Fetched from careerflow_admin.users</p>
        </div>
        <button
          onClick={fetchData}
          className="px-2.5 py-1.5 rounded-md border border-surface-variant text-xs font-medium hover:bg-surface-container flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* ═══════ STATS CARDS ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { key: 'all' as const, label: 'Total', value: stats.total, icon: 'group', color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
          { key: 'active' as const, label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { key: 'blocked' as const, label: 'Blocked', value: stats.inactive, icon: 'block', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { key: 'verified' as const, label: 'Verified', value: stats.verified, icon: 'verified', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setFilterStatus(s.key); setPage(1); }}
            className={`border rounded-lg p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left ${
              filterStatus === s.key ? `ring-2 ring-primary ${s.bg} ${s.border}` : 'bg-surface-container-lowest border-surface-variant hover:border-primary/40'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
            <div>
              <p className="text-lg font-bold text-on-surface leading-tight">{s.value.toLocaleString()}</p>
              <p className="text-[9px] text-outline uppercase tracking-wider font-semibold">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ═══════ FILTER BAR ═══════ */}
      <div className="flex flex-wrap gap-2 items-center bg-surface-container-low border border-surface-variant rounded-lg p-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone, city..."
            className="w-full pl-8 pr-8 py-1.5 rounded border border-surface-variant bg-white text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-outline hover:text-error">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Provider filter */}
        <div className="flex items-center gap-1 border-l border-surface-variant pl-2">
          <span className="text-[10px] text-outline font-semibold uppercase mr-1">Source:</span>
          {[
            { key: 'all', label: 'All', emoji: '📋' },
            { key: 'google', label: 'Google', emoji: '🔴' },
            { key: 'email', label: 'Email', emoji: '✉️' },
            { key: 'mobile', label: 'OTP', emoji: '📱' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setFilterProvider(p.key as any)}
              className={`px-2 py-1 rounded text-[10px] font-medium border transition-all cursor-pointer ${
                filterProvider === p.key
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-white border-surface-variant text-outline hover:border-primary/40'
              }`}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ CANDIDATE GRID ═══════ */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs text-outline mt-2">Fetching candidates from database...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-lg border border-surface-variant">
          <span className="material-symbols-outlined text-[40px] text-outline">person_off</span>
          <p className="text-sm font-semibold text-on-surface mt-1">No candidates found</p>
          <p className="text-xs text-outline">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {displayList.map((c) => {
            const provider = getLoginProvider(c);
            return (
              <div
                key={c._id}
                onClick={() => handleViewDetail(c._id)}
                className="bg-surface-container-lowest rounded-lg border border-surface-variant p-3 cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start gap-2.5">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-11 h-11 rounded-full object-cover border border-surface-variant shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-on-surface text-sm truncate">{c.name}</h3>
                          {c.isVerified && <span className="material-symbols-outlined text-[13px] text-blue-500">verified</span>}
                        </div>
                        <p className="text-[10px] text-outline truncate font-mono">{c.email}</p>
                      </div>
                      {/* Match circle for profile completion */}
                      <div className="relative w-9 h-9 shrink-0">
                        <svg className="w-9 h-9 -rotate-90">
                          <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-surface-container-high" />
                          <circle
                            cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="2.5" fill="none"
                            strokeDasharray={`${(c.profileCompletion || 0) * 0.942} 94.2`}
                            className="text-primary"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-primary">
                          {c.profileCompletion || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.isActive === false && (
                        <span className="text-[8px] font-bold px-1.5 py-0 rounded bg-red-100 text-red-700 uppercase">Blocked</span>
                      )}
                      <span className={`text-[9px] px-1.5 py-0 rounded-full font-medium border ${provider.class}`}>
                        {provider.emoji} {provider.label}
                      </span>
                      {c.jobTitle && (
                        <span className="text-[9px] px-1.5 py-0 rounded-full bg-primary/10 text-primary font-medium truncate max-w-[100px]">
                          {c.jobTitle}
                        </span>
                      )}
                      {c.city && (
                        <span className="text-[9px] px-1.5 py-0 rounded-full bg-surface-container-high text-outline">
                          📍 {c.city}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-variant">
                      <span className="text-[9px] text-outline font-mono">ID: {shortId(c._id)}</span>
                      <span className="text-[9px] text-outline">
                        Joined {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-2.5 py-1.5 rounded bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer hover:bg-surface-container-highest"
          >
            ← Prev
          </button>
          <span className="text-xs text-on-surface-variant font-medium">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-2.5 py-1.5 rounded bg-surface-container-high text-xs disabled:opacity-40 cursor-pointer hover:bg-surface-container-highest"
          >
            Next →
          </button>
        </div>
      )}

      {/* ═══════ DETAIL MODAL ═══════ */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {detailLoading || !selectedUser ? (
              <div className="p-20 text-center">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="text-xs text-outline mt-2">Loading full candidate profile...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 border-b border-surface-variant">
                  <button onClick={() => setShowDetailModal(false)} className="absolute top-3 right-3 w-7 h-7 rounded-md hover:bg-white/60 flex items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                  <div className="flex items-center gap-3 pr-8">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-md shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                        {selectedUser.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-base font-bold text-on-surface truncate">{selectedUser.name}</h2>
                        {selectedUser.isVerified && <span className="material-symbols-outlined text-[16px] text-blue-500">verified</span>}
                        <span className={`text-[9px] px-1.5 py-0 rounded font-bold uppercase ${
                          selectedUser.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedUser.isActive !== false ? '● Active' : '● Blocked'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-outline truncate">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-outline">
                        <span>ID: <code className="font-mono bg-white/60 px-1 rounded">{shortId(selectedUser._id)}</code></span>
                        <span>•</span>
                        <span>{selectedUser.applicationCount || 0} applications</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Contact & Auth */}
                  <SectionCard title="Contact & Authentication" icon="key">
                    <div className="grid grid-cols-2 gap-2.5">
                      <InfoRow label="Login Provider" value={`${getLoginProvider(selectedUser).emoji} ${getLoginProvider(selectedUser).label}`} />
                      <InfoRow label="Mobile Phone" value={selectedUser.phone || selectedUser.phoneNumber} />
                      <InfoRow label="Email Verified" value={selectedUser.isEmailVerified ? '✓ Yes' : 'No'} />
                      <InfoRow label="Phone Verified" value={selectedUser.isPhoneVerified ? '✓ Yes' : 'No'} />
                      <InfoRow label="Location" value={selectedUser.city ? `${selectedUser.city}, ${selectedUser.state || ''}` : undefined} />
                      <InfoRow label="Gender" value={selectedUser.gender} />
                      {selectedUser.googleId && <InfoRow label="Google ID" value={shortId(selectedUser.googleId)} />}
                      <InfoRow label="Member Since" value={new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                    </div>
                  </SectionCard>

                  {/* About */}
                  {selectedUser.aboutMe && (
                    <SectionCard title="About / Bio" icon="article">
                      <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{selectedUser.aboutMe}</p>
                    </SectionCard>
                  )}

                  {/* Career */}
                  {(selectedUser.jobTitle || selectedUser.currentCompany) && (
                    <SectionCard title="Professional Experience" icon="work_history">
                      <div className="grid grid-cols-2 gap-2.5">
                        <InfoRow label="Current Title" value={selectedUser.jobTitle} />
                        <InfoRow label="Employer" value={selectedUser.currentCompany} />
                        <InfoRow label="Experience Level" value={selectedUser.experienceLevel} />
                        <InfoRow label="Total Years" value={selectedUser.totalExperience ? `${selectedUser.totalExperience} yrs` : undefined} />
                        <InfoRow label="Current Salary" value={selectedUser.currentSalary ? `₹${selectedUser.currentSalary}` : undefined} />
                        <InfoRow label="Preferred Mode" value={selectedUser.workType} />
                        <InfoRow label="English Fluency" value={selectedUser.englishLevel} />
                      </div>
                    </SectionCard>
                  )}

                  {/* Education */}
                  {(selectedUser.degree || selectedUser.collegeName) && (
                    <SectionCard title="Education" icon="school">
                      <div className="grid grid-cols-2 gap-2.5">
                        <InfoRow label="Degree" value={selectedUser.degree} />
                        <InfoRow label="Specialization" value={selectedUser.specialization} />
                        <InfoRow label="College" value={selectedUser.collegeName} />
                        <InfoRow label="Graduation Year" value={selectedUser.endYear} />
                      </div>
                    </SectionCard>
                  )}

                  {/* Skills */}
                  {selectedUser.skills && selectedUser.skills.length > 0 && (
                    <SectionCard title={`Skills (${selectedUser.skills.length})`} icon="psychology">
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.skills.map((s, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">{s}</span>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Languages */}
                  {selectedUser.knownLanguages && selectedUser.knownLanguages.length > 0 && (
                    <SectionCard title="Languages" icon="language">
                      <div className="flex flex-wrap gap-1">
                        {selectedUser.knownLanguages.map((l, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{l}</span>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Resume */}
                  {selectedUser.resumeUrl && (
                    <SectionCard title="Resume Document" icon="picture_as_pdf">
                      <div className="flex items-center justify-between gap-2 bg-red-50/50 border border-red-100 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded bg-red-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-red-600 text-[18px]">picture_as_pdf</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{selectedUser.resumeFileName || 'Resume.pdf'}</p>
                            <p className="text-[9px] text-outline">PDF Document</p>
                          </div>
                        </div>
                        <a
                          href={selectedUser.resumeUrl}
                          target="_blank" rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-primary text-on-primary text-[10px] font-medium hover:opacity-90 flex items-center gap-1 shrink-0"
                        >
                          <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                          View
                        </a>
                      </div>
                    </SectionCard>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="p-3 border-t border-surface-variant bg-surface-container-low flex flex-wrap gap-1.5 justify-end">
                  <button
                    onClick={() => handleToggleStatus(selectedUser)}
                    disabled={!!actionLoading}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 ${
                      selectedUser.isActive !== false
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{selectedUser.isActive !== false ? 'block' : 'check_circle'}</span>
                    {selectedUser.isActive !== false ? 'Block Account' : 'Unblock Account'}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser)}
                    disabled={!!actionLoading}
                    className="px-3 py-1.5 rounded text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete_forever</span>
                    Delete Permanently
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white rounded-lg max-w-sm w-full p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmAction.variant === 'danger' ? 'bg-red-100' : 'bg-orange-100'}`}>
                <span className={`material-symbols-outlined text-[20px] ${confirmAction.variant === 'danger' ? 'text-red-600' : 'text-orange-600'}`}>
                  {confirmAction.variant === 'danger' ? 'warning' : 'help'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-on-surface">{confirmAction.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{confirmAction.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-1.5">
              <button onClick={() => setConfirmAction(null)} disabled={!!actionLoading} className="px-3 py-1.5 rounded bg-surface-container-high text-xs font-medium cursor-pointer">Cancel</button>
              <button
                onClick={confirmAction.onConfirm}
                disabled={!!actionLoading}
                className={`px-3 py-1.5 rounded text-xs font-bold text-white cursor-pointer disabled:opacity-50 ${confirmAction.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}`}
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-xs font-bold flex items-center gap-1.5 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          <span className="material-symbols-outlined text-[16px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// ═══ HELPER COMPONENTS ═══
const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-surface-container-low rounded-lg p-3 border border-surface-variant">
    <h3 className="text-[10px] font-bold text-on-surface uppercase tracking-wider flex items-center gap-1 mb-2">
      <span className="material-symbols-outlined text-[13px] text-primary">{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
  <div>
    <p className="text-[9px] text-outline uppercase tracking-wider font-bold">{label}</p>
    <p className="text-[11px] text-on-surface font-semibold truncate mt-0.5">{value || '—'}</p>
  </div>
);