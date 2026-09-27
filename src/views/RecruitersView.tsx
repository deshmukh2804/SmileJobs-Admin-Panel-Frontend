// FILE: frontend/src/views/RecruitersView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { userManagementApi } from '../services/api';

interface RecruiterItem {
  _id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  profileImage?: { url: string; publicId?: string };
  designation?: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  industry?: string;
  about?: string;
  verified?: boolean;
  isActive?: boolean;
  whatsappContactEnabled?: boolean;
  createdAt: string;
  updatedAt?: string;
  jobCount?: number;
}

const shortId = (id?: string) => (id ? id.slice(-8).toUpperCase() : '—');

export const RecruitersView: React.FC = () => {
  const [recruiters, setRecruiters] = useState<RecruiterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked' | 'verified'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, verified: 0 });
  const [selectedUser, setSelectedUser] = useState<RecruiterItem | null>(null);
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
        ...(filterStatus === 'verified' ? { verified: 'true' } : {}),
      };
      const res = await userManagementApi.getRecruiters(params);
      if (res.success) {
        setRecruiters(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
        setStats(res.stats || { total: 0, active: 0, inactive: 0, verified: 0 });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch recruiters', 'error');
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
      const res = await userManagementApi.getRecruiterById(id);
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
      const res = await userManagementApi.toggleRecruiterStatus(id);
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

  const handleToggleStatus = (user: RecruiterItem) => {
    const isBlocking = user.isActive !== false;
    setConfirmAction({
      title: isBlocking ? 'Block Recruiter' : 'Unblock Recruiter',
      message: isBlocking
        ? `Block ${user.name}? This employer will lose recruiter console access.`
        : `Unblock ${user.name}? Access will be restored immediately.`,
      variant: isBlocking ? 'warning' : 'danger',
      onConfirm: () => performToggleStatus(user._id),
    });
  };

  const performDelete = async (id: string) => {
    setActionLoading('delete');
    try {
      const res = await userManagementApi.deleteRecruiter(id);
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

  const handleDelete = (user: RecruiterItem) => {
    setConfirmAction({
      title: 'Delete Recruiter Permanently',
      message: `Permanently delete ${user.name}? Their company records will be purged from the database. This CANNOT be undone.`,
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
        if (selectedUser && selectedUser._id === id) {
          setSelectedUser({ ...selectedUser, verified: res.data?.verified });
        }
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Verification update failed', 'error');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleToggleVerification = (recruiter: RecruiterItem) => {
    setConfirmAction({
      title: recruiter.verified ? 'Revoke Verification' : 'Grant Verified Badge',
      message: recruiter.verified
        ? `Remove the verified badge from ${recruiter.name}?`
        : `Grant verified badge to ${recruiter.name}? Their company will show a verified checkmark.`,
      onConfirm: () => performToggleVerification(recruiter._id),
    });
  };

  return (
    <div className="space-y-4">
      {/* ═══════ HEADER ═══════ */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[22px] text-emerald-600">business_center</span>
            Recruiters Directory
            <span className="text-xs font-normal text-outline">({total.toLocaleString()})</span>
          </h1>
          <p className="text-[11px] text-outline mt-0.5">Manage employer accounts • Fetched from recruiter_db.recruiters</p>
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
          { key: 'all' as const, label: 'Total', value: stats.total, icon: 'group', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { key: 'active' as const, label: 'Active', value: stats.active, icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
          { key: 'blocked' as const, label: 'Blocked', value: stats.inactive, icon: 'block', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
          { key: 'verified' as const, label: 'Verified', value: stats.verified, icon: 'verified', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setFilterStatus(s.key); setPage(1); }}
            className={`border rounded-lg p-2.5 flex items-center gap-2.5 transition-all cursor-pointer text-left ${
              filterStatus === s.key ? `ring-2 ring-emerald-500 ${s.bg} ${s.border}` : 'bg-surface-container-lowest border-surface-variant hover:border-emerald-500/40'
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

      {/* ═══════ SEARCH ═══════ */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined text-[16px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">search</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, company, mobile..."
          className="w-full pl-8 pr-8 py-1.5 rounded-md border border-surface-variant bg-surface-container-low text-xs outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-error">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        )}
      </div>

      {/* ═══════ RECRUITER GRID ═══════ */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-outline mt-2">Fetching recruiters from database...</p>
        </div>
      ) : recruiters.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-lowest rounded-lg border border-surface-variant">
          <span className="material-symbols-outlined text-[40px] text-outline">business_center</span>
          <p className="text-sm font-semibold text-on-surface mt-1">No recruiters found</p>
          <p className="text-xs text-outline">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {recruiters.map((r) => (
            <div
              key={r._id}
              onClick={() => handleViewDetail(r._id)}
              className="bg-surface-container-lowest rounded-lg border border-surface-variant p-3 cursor-pointer hover:shadow-md hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-start gap-2.5">
                {r.profileImage?.url ? (
                  <img
                    src={r.profileImage.url}
                    alt={r.name}
                    className="w-11 h-11 rounded-full object-cover border border-surface-variant shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                    {r.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-on-surface text-sm truncate">{r.name}</h3>
                        {r.verified && (
                          <span className="material-symbols-outlined text-[13px] text-emerald-600" title="Verified">verified</span>
                        )}
                      </div>
                      <p className="text-[10px] text-outline truncate font-mono">{r.email}</p>
                    </div>
                    {r.jobCount !== undefined && r.jobCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold shrink-0">
                        {r.jobCount} jobs
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.isActive === false && (
                      <span className="text-[8px] font-bold px-1.5 py-0 rounded bg-red-100 text-red-700 uppercase">Blocked</span>
                    )}
                    {r.companyName && (
                      <span className="text-[9px] px-1.5 py-0 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 truncate max-w-[130px]">
                        🏢 {r.companyName}
                      </span>
                    )}
                    {r.designation && (
                      <span className="text-[9px] px-1.5 py-0 rounded-full bg-surface-container-high text-outline truncate max-w-[80px]">
                        {r.designation}
                      </span>
                    )}
                    {r.industry && (
                      <span className="text-[9px] px-1.5 py-0 rounded-full bg-purple-50 text-purple-700 truncate max-w-[80px]">
                        {r.industry}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-surface-variant">
                    <span className="text-[9px] text-outline font-mono">REC: {shortId(r._id)}</span>
                    <span className="text-[9px] text-outline">
                      Joined {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-outline mt-2">Loading full recruiter profile...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="relative bg-gradient-to-br from-emerald-100 via-emerald-50/50 to-transparent p-4 border-b border-surface-variant">
                  <button onClick={() => setShowDetailModal(false)} className="absolute top-3 right-3 w-7 h-7 rounded-md hover:bg-white/60 flex items-center justify-center cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                  <div className="flex items-center gap-3 pr-8">
                    {selectedUser.profileImage?.url ? (
                      <img src={selectedUser.profileImage.url} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-md shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl shrink-0">
                        {selectedUser.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-base font-bold text-on-surface truncate">{selectedUser.name}</h2>
                        {selectedUser.verified && <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>}
                        <span className={`text-[9px] px-1.5 py-0 rounded font-bold uppercase ${
                          selectedUser.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedUser.isActive !== false ? '● Active' : '● Blocked'}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-outline truncate">{selectedUser.email}</p>
                      {selectedUser.companyName && (
                        <p className="text-xs font-bold text-emerald-700 mt-0.5">🏢 {selectedUser.companyName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-outline">
                        <span>REC ID: <code className="font-mono bg-white/60 px-1 rounded">{shortId(selectedUser._id)}</code></span>
                        <span>•</span>
                        <span className="font-bold text-blue-700">{selectedUser.jobCount || 0} active job posts</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Contact */}
                  <SectionCard title="Contact Information" icon="contact_page">
                    <div className="grid grid-cols-2 gap-2.5">
                      <InfoRow label="Email Address" value={selectedUser.email} />
                      <InfoRow label="Mobile Phone" value={selectedUser.mobileNumber} />
                      <InfoRow label="WhatsApp" value={selectedUser.whatsappNumber} />
                      <InfoRow label="WhatsApp Enabled" value={selectedUser.whatsappContactEnabled ? '✓ Yes' : 'No'} />
                    </div>
                    {(selectedUser.email || selectedUser.mobileNumber || selectedUser.whatsappNumber) && (
                      <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-surface-variant">
                        {selectedUser.email && (
                          <a href={`mailto:${selectedUser.email}`} className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-medium hover:bg-blue-100 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">mail</span> Email
                          </a>
                        )}
                        {selectedUser.mobileNumber && (
                          <a href={`tel:${selectedUser.mobileNumber}`} className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-[10px] font-medium hover:bg-purple-100 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">call</span> Call
                          </a>
                        )}
                        {selectedUser.whatsappNumber && (
                          <a href={`https://wa.me/${selectedUser.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded bg-green-50 text-green-700 text-[10px] font-medium hover:bg-green-100 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">chat</span> WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </SectionCard>

                  {/* Company */}
                  <SectionCard title="Company / Organization" icon="business">
                    <div className="grid grid-cols-2 gap-2.5">
                      <InfoRow label="Company Name" value={selectedUser.companyName} />
                      <InfoRow label="Designation" value={selectedUser.designation} />
                      <InfoRow label="Company Size" value={selectedUser.companySize} />
                      <InfoRow label="Industry" value={selectedUser.industry} />
                      {selectedUser.companyWebsite && (
                        <div className="col-span-2">
                          <p className="text-[9px] text-outline uppercase tracking-wider font-bold">Website</p>
                          <a href={selectedUser.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline font-semibold truncate block mt-0.5">
                            {selectedUser.companyWebsite} ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                  {/* About */}
                  {selectedUser.about && (
                    <SectionCard title="About / Company Description" icon="article">
                      <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{selectedUser.about}</p>
                    </SectionCard>
                  )}

                  {/* Metadata */}
                  <SectionCard title="Account Metadata" icon="info">
                    <div className="grid grid-cols-2 gap-2.5">
                      <InfoRow label="Recruiter ID" value={selectedUser._id} />
                      <InfoRow label="Registration Date" value={new Date(selectedUser.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                      {selectedUser.updatedAt && (
                        <InfoRow label="Last Updated" value={new Date(selectedUser.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
                      )}
                      <InfoRow label="Active Job Posts" value={String(selectedUser.jobCount || 0)} />
                    </div>
                  </SectionCard>
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-surface-variant bg-surface-container-low flex flex-wrap gap-1.5 justify-end">
                  <button
                    onClick={() => handleToggleVerification(selectedUser)}
                    disabled={!!actionLoading}
                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 ${
                      selectedUser.verified
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{selectedUser.verified ? 'unpublished' : 'verified'}</span>
                    {selectedUser.verified ? 'Revoke Verified' : 'Grant Verified'}
                  </button>
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
                    {selectedUser.isActive !== false ? 'Block Console' : 'Unblock Console'}
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
      <span className="material-symbols-outlined text-[13px] text-emerald-600">{icon}</span>
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