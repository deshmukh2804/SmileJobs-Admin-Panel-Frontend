// FILE: frontend/src/views/VerificationView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { verificationApi } from '../services/api';
import {
  VerificationListItem,
  VerificationDetail,
  VerificationStats,
  VerificationStatus,
  DOC_TYPE_OPTIONS,
} from '../types';

interface VerificationViewProps {
  onToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  // Backward compatibility with previous App.tsx props
  verifications?: any[];
  selectedId?: string;
  onSelectEntity?: (id: string) => void;
  onApproveEntity?: (id: string, name: string) => void;
  onRejectEntity?: (id: string, name: string) => void;
  onRequestClarification?: (id: string, name: string) => void;
  onSelectTab?: (tab: any) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  pending: {
    label: 'Pending Review',
    badge: 'bg-[#FFF3D6] text-[#8C5D00] border-[#F5C77E]',
    dot: 'bg-[#C58A3A]',
  },
  under_review: {
    label: 'Under Review',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-500',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-[#E5F2EB] text-[#24593C] border-[#A8D4BB]',
    dot: 'bg-[#5F8A72]',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
  },
  clarification_requested: {
    label: 'Re-upload Requested',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    dot: 'bg-orange-500',
  },
};

const getStatusMeta = (status?: string) => {
  if (!status) return STATUS_CONFIG.pending;
  const key = String(status).toLowerCase().trim();
  return (
    STATUS_CONFIG[key] || {
      label: status,
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      dot: 'bg-gray-400',
    }
  );
};

const formatDate = (d?: string | Date) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(d);
  }
};

export const VerificationView: React.FC<VerificationViewProps> = ({ onToast }) => {
  const [items, setItems] = useState<VerificationListItem[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Default to 'all' so that existing records in any status are immediately visible
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sort, setSort] = useState<'oldest' | 'newest'>('newest');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [rejectModal, setRejectModal] = useState<boolean>(false);
  const [clarifyModal, setClarifyModal] = useState<boolean>(false);
  const [approveModal, setApproveModal] = useState<boolean>(false);
  const [fullscreenDoc, setFullscreenDoc] = useState<string | null>(null);

  // Modal Form Inputs
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectNotes, setRejectNotes] = useState<string>('');
  const [approveNotes, setApproveNotes] = useState<string>('');
  const [clarifyDocs, setClarifyDocs] = useState<string[]>([]);
  const [clarifyMessage, setClarifyMessage] = useState<string>('');

  // Document Viewer Controls
  const [activeDocIdx, setActiveDocIdx] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await verificationApi.getStats();
      if (res && res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Stats fetch notice:', err);
    }
  }, []);

  // Fetch List
  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await verificationApi.getVerifications({
        status: statusFilter,
        search: debouncedSearch,
        page,
        limit: 20,
        sort,
      });

      if (res && res.success) {
        const fetchedItems: VerificationListItem[] = Array.isArray(res.data) ? res.data : [];
        setItems(fetchedItems);
        setTotalPages(res.pagination?.totalPages || 1);

        // Auto-select first item if current selection not found
        if (fetchedItems.length > 0) {
          setSelectedId((prev) => {
            const exists = prev && fetchedItems.some((i) => i.id === prev);
            return exists ? prev : fetchedItems[0].id;
          });
        } else {
          setSelectedId(null);
          setDetail(null);
        }
      } else {
        throw new Error(res?.message || 'Failed to load verification list');
      }
    } catch (err: any) {
      console.error('Fetch verification list error:', err);
      setError(err?.message || 'Failed to connect to verification service');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, page, sort]);

  // Fetch Detail
  const fetchDetail = useCallback(
    async (id: string) => {
      if (!id) return;
      setDetailLoading(true);
      try {
        const res = await verificationApi.getVerificationById(id);
        if (res && res.success && res.data) {
          setDetail(res.data);
          setActiveDocIdx(0);
          setZoom(1);
          setRotation(0);
        } else {
          throw new Error(res?.message || 'Verification details not found');
        }
      } catch (err: any) {
        console.error('Fetch detail error:', err);
        onToast?.(err?.message || 'Failed to load document details', 'error');
      } finally {
        setDetailLoading(false);
      }
    },
    [onToast]
  );

  // Initial Load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, fetchDetail]);

  // ─── ACTION HANDLERS ─────────────────────────────────────────
  const handleApprove = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      const res = await verificationApi.approveVerification(detail.id, approveNotes);
      if (res && res.success) {
        onToast?.(`✓ "${detail.title}" has been approved and verified!`, 'success');
        setApproveModal(false);
        setApproveNotes('');
        await fetchList();
        await fetchStats();
        await fetchDetail(detail.id);
      }
    } catch (err: any) {
      onToast?.(err?.message || 'Approval action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    if (!rejectReason.trim()) {
      onToast?.('Please specify a rejection reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await verificationApi.rejectVerification(detail.id, rejectReason, rejectNotes);
      if (res && res.success) {
        onToast?.(`Verification for "${detail.title}" rejected. Notification dispatched.`, 'info');
        setRejectModal(false);
        setRejectReason('');
        setRejectNotes('');
        await fetchList();
        await fetchStats();
        await fetchDetail(detail.id);
      }
    } catch (err: any) {
      onToast?.(err?.message || 'Rejection action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClarify = async () => {
    if (!detail) return;
    if (clarifyDocs.length === 0) {
      onToast?.('Please select at least one document type to re-upload', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await verificationApi.requestClarification(detail.id, clarifyDocs, clarifyMessage);
      if (res && res.success) {
        onToast?.(`Re-upload request emailed to ${detail.recruiter?.email || 'recruiter'}.`, 'info');
        setClarifyModal(false);
        setClarifyDocs([]);
        setClarifyMessage('');
        await fetchList();
        await fetchStats();
        await fetchDetail(detail.id);
      }
    } catch (err: any) {
      onToast?.(err?.message || 'Failed to submit clarification request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const activeDoc = detail?.documents?.[activeDocIdx];

  const canTakeAction = useMemo(() => {
    if (!detail) return false;
    const s = (detail.status || '').toLowerCase();
    return s !== 'approved' && s !== 'rejected';
  }, [detail]);

  const downloadDoc = (url?: string, name?: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = name || 'document';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-space-lg">
      {/* ─── TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">
              Live Compliance Queue
            </span>
            <span className="text-xs text-outline font-medium">
              Employer Trust &amp; Authentication Protocol
            </span>
          </div>
          <h1 className="font-headline-lg text-primary font-bold mt-1">
            Verification &amp; Approval Center
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Authenticate corporate credentials, inspect statutory documents, and issue Verified badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchList();
              fetchStats();
              if (selectedId) fetchDetail(selectedId);
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ─── 4 KPI BENTO STATS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <KpiCard
          label="All Requests"
          value={
            stats
              ? stats.pending + stats.approved + stats.rejected + (stats.clarification_requested || 0) + (stats.under_review || 0)
              : items.length
          }
          icon="folder"
          iconColor="#4F46E5"
          subtitle="Total verification submissions"
          onClick={() => {
            setStatusFilter('all');
            setPage(1);
          }}
          active={statusFilter === 'all'}
        />

        <KpiCard
          label="Pending Review"
          value={stats?.pending ?? 0}
          icon="hourglass_top"
          iconColor="#C58A3A"
          badge={stats?.pending ? `${stats.pending} Action Needed` : undefined}
          subtitle="Requires compliance audit"
          onClick={() => {
            setStatusFilter('pending');
            setPage(1);
          }}
          active={statusFilter === 'pending'}
        />

        <KpiCard
          label="Approved / Verified"
          value={stats?.approved ?? 0}
          icon="verified"
          iconColor="#5F8A72"
          subtitle="Active verified companies"
          onClick={() => {
            setStatusFilter('approved');
            setPage(1);
          }}
          active={statusFilter === 'approved'}
        />

        <KpiCard
          label="Rejected / Action"
          value={(stats?.rejected ?? 0) + (stats?.clarification_requested ?? 0)}
          icon="gavel"
          iconColor="#DC2626"
          subtitle={`${stats?.clarification_requested || 0} re-uploads requested`}
          onClick={() => {
            setStatusFilter('rejected');
            setPage(1);
          }}
          active={statusFilter === 'rejected'}
        />
      </div>

      {/* ─── STATUS FILTER TABS ─── */}
      <div className="flex items-center gap-2 border-b border-surface-variant pb-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: 'Pending Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'clarification_requested', label: 'Re-upload Requested' },
          { key: 'rejected', label: 'Rejected' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-xs ring-2 ring-primary/20'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── SEARCH & SORT TOOLBAR ─── */}
      <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-variant flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-2.5 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, recruiter name, or email..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none focus:border-primary text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-outline">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant focus:outline-none text-xs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First (SLA Priority)</option>
          </select>
        </div>
      </div>

      {/* ─── MAIN 2-COLUMN INSPECTION LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-start">
        {/* LEFT COLUMN: Verifications Queue */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <SkeletonList />
          ) : error ? (
            <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-center">
              <span className="material-symbols-outlined text-[36px] text-red-500">error</span>
              <p className="text-xs text-red-800 font-semibold mt-1">{error}</p>
              <button
                onClick={fetchList}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 rounded-xl border border-surface-variant bg-surface-container-lowest text-center">
              <span className="material-symbols-outlined text-[42px] text-outline opacity-40">
                assignment_turned_in
              </span>
              <h4 className="text-sm font-bold text-primary mt-2">No Records Found</h4>
              <p className="text-xs text-outline mt-1">
                No verifications match the selected filter ({statusFilter}).
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-3 px-3 py-1.5 bg-surface-container rounded-lg text-xs font-semibold text-primary hover:bg-surface-container-high"
                >
                  View All Statuses
                </button>
              )}
            </div>
          ) : (
            <>
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                const statusMeta = getStatusMeta(item.status);
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/20'
                        : 'bg-surface-container-lowest border-surface-variant hover:border-outline shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary-container text-on-secondary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {item.initials || 'CF'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap justify-between">
                          <h3 className="font-label-lg text-primary font-bold truncate">
                            {item.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-outline mt-0.5 truncate">
                          {item.representativeName} • {item.representativeEmail}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[11px] text-outline">
                          <span className="font-mono bg-surface-container px-1.5 py-0.5 rounded text-[10px]">
                            {item.code}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-[#5F8A72]">
                              description
                            </span>
                            {item.documentsCount || (item.documents || []).length} docs
                          </span>
                          <span>•</span>
                          <span>{item.submittedTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 px-1 text-xs">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2.5 py-1 rounded bg-surface-container disabled:opacity-40 font-semibold"
                  >
                    ← Prev
                  </button>
                  <span className="text-outline">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2.5 py-1 rounded bg-surface-container disabled:opacity-40 font-semibold"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Document & Company Workspace */}
        <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-4">
          {detailLoading ? (
            <div className="bg-surface-container-lowest p-12 rounded-xl border border-surface-variant flex flex-col items-center justify-center min-h-[420px]">
              <span className="material-symbols-outlined text-[42px] text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-xs text-outline mt-3 font-semibold">
                Loading compliance workspace &amp; documents...
              </p>
            </div>
          ) : !detail ? (
            <div className="bg-surface-container-lowest p-12 rounded-xl border border-surface-variant text-center min-h-[420px] flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-[54px] text-outline opacity-40">
                dock_to_left
              </span>
              <p className="text-sm font-bold text-primary mt-2">Select an Entity to Inspect</p>
              <p className="text-xs text-outline mt-1 max-w-xs">
                Choose a submission from the left queue to review company credentials and documents.
              </p>
            </div>
          ) : (
            <>
              {/* Entity Overview Card */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-variant">
                  <div className="flex items-start gap-3">
                    {detail.company?.logoUrl ? (
                      <img
                        src={detail.company.logoUrl}
                        alt={detail.title}
                        className="w-12 h-12 rounded-xl object-cover border border-surface-variant shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary-container text-on-secondary flex items-center justify-center font-bold text-lg shrink-0">
                        {detail.initials || 'CF'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-headline-sm text-primary font-bold">
                          {detail.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusMeta(detail.status).badge}`}>
                          {getStatusMeta(detail.status).label}
                        </span>
                      </div>
                      <p className="text-xs text-outline font-mono mt-0.5">{detail.code}</p>
                    </div>
                  </div>
                </div>

                {/* Recruiter Details Row */}
                <div className="p-3 rounded-lg bg-surface-container-low flex items-center gap-3">
                  {detail.recruiter?.avatar ? (
                    <img
                      src={detail.recruiter.avatar}
                      alt={detail.recruiter.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-xs font-bold">
                      {detail.recruiter?.name?.charAt(0) || 'R'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-primary truncate">
                      {detail.recruiter?.name || 'Recruiter'}
                    </p>
                    <p className="text-[11px] text-outline truncate">
                      {detail.recruiter?.designation ? `${detail.recruiter.designation} • ` : ''}
                      {detail.recruiter?.email || detail.recruiter?.contactEmail}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-outline">Submission Date</p>
                    <p className="text-[11px] font-semibold text-primary">
                      {formatDate(detail.submittedAt)}
                    </p>
                  </div>
                </div>

                {/* Company Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <InfoItem label="Industry" value={detail.company?.industry} />
                  <InfoItem label="Founded / Established" value={detail.company?.foundedYear} />
                  <InfoItem label="Team / Org Size" value={detail.company?.teamSize || detail.company?.organizationSize} />
                  <InfoItem
                    label="Location"
                    value={[detail.company?.city, detail.company?.state, detail.company?.country].filter(Boolean).join(', ')}
                  />
                  {detail.company?.website && (
                    <InfoItem label="Website" value={detail.company.website} isLink />
                  )}
                  {detail.company?.address && (
                    <InfoItem label="Address" value={detail.company.address} />
                  )}
                </div>

                {/* Statutory Numbers */}
                {(detail.company?.registrationNumber || detail.company?.gstNumber || detail.company?.panNumber) && (
                  <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant text-xs space-y-1 font-mono">
                    <p className="text-[10px] font-sans font-bold text-outline uppercase tracking-wider mb-1.5">
                      Statutory Identifiers
                    </p>
                    {detail.company.registrationNumber && (
                      <div className="flex justify-between">
                        <span className="text-outline">Registration / CIN:</span>
                        <span className="text-primary font-bold">{detail.company.registrationNumber}</span>
                      </div>
                    )}
                    {detail.company.gstNumber && (
                      <div className="flex justify-between">
                        <span className="text-outline">GST Number:</span>
                        <span className="text-primary font-bold">{detail.company.gstNumber}</span>
                      </div>
                    )}
                    {detail.company.panNumber && (
                      <div className="flex justify-between">
                        <span className="text-outline">PAN Number:</span>
                        <span className="text-primary font-bold">{detail.company.panNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document Inspection Box */}
              <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      description
                    </span>
                    Submitted Documents ({detail.documents?.length || 0})
                  </h4>

                  {activeDoc && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                        className="p-1 rounded hover:bg-surface-container text-outline"
                        title="Zoom Out"
                      >
                        <span className="material-symbols-outlined text-[16px]">zoom_out</span>
                      </button>
                      <span className="text-[10px] font-mono text-outline w-9 text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                        className="p-1 rounded hover:bg-surface-container text-outline"
                        title="Zoom In"
                      >
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                      </button>
                      <button
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="p-1 rounded hover:bg-surface-container text-outline"
                        title="Rotate 90deg"
                      >
                        <span className="material-symbols-outlined text-[16px]">rotate_right</span>
                      </button>
                      <button
                        onClick={() => setFullscreenDoc(activeDoc.url)}
                        className="p-1 rounded hover:bg-surface-container text-outline"
                        title="Fullscreen"
                      >
                        <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                      </button>
                      <button
                        onClick={() => downloadDoc(activeDoc.url, activeDoc.docName)}
                        className="p-1 rounded hover:bg-surface-container text-outline"
                        title="Download Document"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Document Selection Tabs */}
                {detail.documents && detail.documents.length > 0 ? (
                  <>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {detail.documents.map((doc, idx) => {
                        const isDocActive = activeDocIdx === idx;
                        return (
                          <button
                            key={doc.id || idx}
                            onClick={() => {
                              setActiveDocIdx(idx);
                              setZoom(1);
                              setRotation(0);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                              isDocActive
                                ? 'bg-primary text-on-primary shadow-xs'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {doc.isImage ? 'image' : 'description'}
                            </span>
                            <span>{doc.docTypeLabel || doc.docType || `Doc ${idx + 1}`}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Document Viewer */}
                    {activeDoc && (
                      <div>
                        <div className="bg-neutral-900 rounded-xl overflow-hidden min-h-[300px] max-h-[480px] overflow-auto flex items-center justify-center p-4 border border-surface-variant">
                          {activeDoc.isImage ? (
                            <img
                              src={activeDoc.url}
                              alt={activeDoc.docName}
                              style={{
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transition: 'transform 0.18s ease-out',
                                maxWidth: '100%',
                                maxHeight: '420px',
                                objectFit: 'contain',
                              }}
                              className="rounded shadow-2xl"
                            />
                          ) : (
                            <div className="text-center text-white p-8">
                              <span className="material-symbols-outlined text-[54px] opacity-60">
                                description
                              </span>
                              <p className="mt-2 text-xs font-semibold">{activeDoc.docName}</p>
                              <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-3 px-4 py-2 bg-primary rounded-lg text-xs font-bold text-white hover:opacity-90"
                              >
                                Open in New Tab
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-outline">
                          <span className="font-mono truncate max-w-[65%]">{activeDoc.docName}</span>
                          <span>
                            {activeDoc.sizeFormatted || '—'} • {activeDoc.uploadedTime || 'Recent'}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-6 text-center text-outline text-xs bg-surface-container-low rounded-xl">
                    No documents uploaded for this entity.
                  </div>
                )}
              </div>

              {/* Review History / Remarks (If already audited) */}
              {(detail.status === 'approved' || detail.status === 'rejected' || detail.status === 'clarification_requested') && (
                <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-sm space-y-2 text-xs">
                  <h4 className="font-bold text-primary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    Compliance Audit Log
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-outline">Audited By:</span>
                    <span className="font-semibold text-primary">{detail.reviewedBy || 'Admin Compliance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Audited At:</span>
                    <span className="font-semibold text-primary">{formatDate(detail.reviewedAt)}</span>
                  </div>
                  {detail.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 mt-2">
                      <p className="font-bold uppercase text-[10px] text-red-800">Rejection Reason</p>
                      <p className="mt-0.5">{detail.rejectionReason}</p>
                    </div>
                  )}
                  {detail.clarificationDocs && detail.clarificationDocs.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 mt-2">
                      <p className="font-bold uppercase text-[10px] text-orange-800">Re-upload Requested</p>
                      <p className="mt-0.5">{detail.clarificationDocs.join(', ')}</p>
                      {detail.clarificationMessage && (
                        <p className="italic mt-1">"{detail.clarificationMessage}"</p>
                      )}
                    </div>
                  )}
                  {detail.adminNotes && (
                    <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant mt-2">
                      <p className="font-bold uppercase text-[10px] text-outline">Internal Audit Notes</p>
                      <p className="mt-0.5">{detail.adminNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons (Approve / Reject / Clarify) */}
              {canTakeAction ? (
                <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-sm">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                    Compliance Adjudication
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setClarifyModal(true)}
                      disabled={actionLoading}
                      className="py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">upload_file</span>
                      <span>Re-upload</span>
                    </button>
                    <button
                      onClick={() => setRejectModal(true)}
                      disabled={actionLoading}
                      className="py-2.5 rounded-xl bg-error-container text-on-error-container font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => setApproveModal(true)}
                      disabled={actionLoading}
                      className="py-2.5 rounded-xl bg-[#5F8A72] text-white font-bold text-xs shadow-md hover:opacity-90 flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-variant flex items-center justify-between text-xs text-outline">
                  <span>Decision recorded: <strong>{getStatusMeta(detail.status).label}</strong></span>
                  <button
                    onClick={() => setApproveModal(true)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Re-verify Entity
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── MODAL: APPROVE ─── */}
      {approveModal && detail && (
        <Modal onClose={() => setApproveModal(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#E5F2EB] flex items-center justify-center text-[#5F8A72] shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Issue Verified Badge</h3>
                <p className="text-xs text-outline">Approve compliance for {detail.title}</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Internal Compliance Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              placeholder="E.g., Validated with MCA registry. GST active."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs focus:outline-none focus:border-primary"
            />

            <div className="mt-3 p-2.5 rounded-lg bg-[#E5F2EB] border border-[#A8D4BB] text-xs text-[#24593C] space-y-0.5">
              <p className="font-bold">Automated system actions upon approval:</p>
              <p>✓ Verified badge attached to {detail.title} company profile</p>
              <p>✓ All published jobs marked with Verified shield</p>
              <p>✓ Confirmation email dispatched to recruiter</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setApproveModal(false)}
                className="flex-1 py-2 rounded-lg bg-surface-container font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-lg bg-[#5F8A72] text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Confirm & Issue Badge'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: REJECT ─── */}
      {rejectModal && detail && (
        <Modal onClose={() => setRejectModal(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                <span className="material-symbols-outlined text-[24px]">block</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Reject Verification</h3>
                <p className="text-xs text-outline">Notify recruiter of document denial</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Rejection Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs focus:outline-none focus:border-primary mb-3"
            >
              <option value="">-- Select a primary reason --</option>
              <option value="Documents are blurry, truncated, or illegible">Illegible / Poor quality documents</option>
              <option value="Company name mismatch across documents">Company name mismatch</option>
              <option value="Documents appear to be forged or altered">Forged or tampered documents</option>
              <option value="Invalid, canceled, or expired registration numbers">Invalid registration numbers</option>
              <option value="Entity not recognized in official corporate registrar">Entity not recognized in registrar</option>
              <option value="Incomplete documentation provided">Incomplete documentation</option>
              <option value="Other statutory non-compliance">Other statutory non-compliance</option>
            </select>

            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Detailed Feedback for Recruiter
            </label>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Provide specific notes so the recruiter can address the issue..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs focus:outline-none focus:border-primary"
            />

            <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              ⚠ The recruiter will be notified by email with the reason provided above.
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRejectModal(false)}
                className="flex-1 py-2 rounded-lg bg-surface-container font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── MODAL: RE-UPLOAD / CLARIFICATION ─── */}
      {clarifyModal && detail && (
        <Modal onClose={() => setClarifyModal(false)}>
          <div className="p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <span className="material-symbols-outlined text-[24px]">upload_file</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Request Document Re-upload</h3>
                <p className="text-xs text-outline">Select which documents need to be re-submitted</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-outline uppercase mb-2">
              Documents to Re-upload <span className="text-red-600">*</span>
            </label>
            <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto p-1">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={clarifyDocs.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) setClarifyDocs([...clarifyDocs, opt.value]);
                      else setClarifyDocs(clarifyDocs.filter((d) => d !== opt.value));
                    }}
                    className="rounded"
                  />
                  <span className="font-semibold">{opt.label}</span>
                </label>
              ))}
            </div>

            <label className="block text-xs font-bold text-outline uppercase mb-1">
              Instructions / Message
            </label>
            <textarea
              rows={3}
              value={clarifyMessage}
              onChange={(e) => setClarifyMessage(e.target.value)}
              placeholder="Please provide a clear scan of your Certificate of Incorporation with seal visible..."
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant text-xs focus:outline-none focus:border-primary"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setClarifyModal(false)}
                className="flex-1 py-2 rounded-lg bg-surface-container font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClarify}
                disabled={actionLoading || clarifyDocs.length === 0}
                className="flex-1 py-2 rounded-lg bg-orange-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Sending...' : 'Send Request Email'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── FULLSCREEN MODAL ─── */}
      {fullscreenDoc && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setFullscreenDoc(null)}
        >
          <button
            onClick={() => setFullscreenDoc(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            title="Close Fullscreen"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img
            src={fullscreenDoc}
            alt="Inspection"
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

// ─── HELPER COMPONENTS ───
const KpiCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  iconColor: string;
  badge?: string;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}> = ({ label, value, icon, iconColor, badge, subtitle, onClick, active }) => (
  <div
    onClick={onClick}
    className={`bg-surface-container-lowest p-space-md rounded-xl border shadow-xs transition-all ${
      onClick ? 'cursor-pointer hover:border-primary' : ''
    } ${active ? 'border-primary ring-2 ring-primary/20' : 'border-surface-variant'}`}
  >
    <div className="flex items-center justify-between">
      <span className="font-label-md text-outline">{label}</span>
      <span className="p-2 rounded-lg bg-surface-container" style={{ color: iconColor }}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
    </div>
    <div className="mt-2">
      <div className="flex items-baseline gap-2">
        <h3 className="font-headline-lg text-primary font-bold tracking-tight">{value}</h3>
        {badge && (
          <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container text-[10px] font-bold">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <div className="text-xs text-outline mt-1">{subtitle}</div>}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string; value?: any; isLink?: boolean }> = ({
  label,
  value,
  isLink,
}) => {
  if (!value) return null;
  return (
    <div className="p-2 rounded bg-surface-container-low">
      <p className="text-[10px] text-outline uppercase font-semibold">{label}</p>
      {isLink ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary font-semibold truncate block hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="text-xs text-primary font-semibold truncate">{String(value)}</p>
      )}
    </div>
  );
};

const SkeletonList: React.FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="p-4 rounded-xl border border-surface-variant bg-surface-container-lowest animate-pulse"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-container shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-container rounded w-1/2" />
            <div className="h-3 bg-surface-container rounded w-3/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Modal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children,
}) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
    onClick={onClose}
  >
    <div
      className="bg-surface-container-lowest rounded-2xl shadow-2xl max-h-[90vh] overflow-auto border border-surface-variant w-full max-w-md"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);