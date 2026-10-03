// FILE: frontend/src/views/PaymentsBillingView.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { billingApi } from '../services/api';

interface Recruiter {
  name?: string;
  email?: string;
  companyName?: string;
}

interface Payment {
  _id: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  planSnapshot?: { name?: string; tier?: string };
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  recruiter: Recruiter;
}

interface Subscription {
  _id: string;
  planSnapshot?: {
    name?: string;
    tier?: string;
    billingCycle?: string;
    price?: number;
    jobPostLimit?: number;
    resumeViewLimit?: number;
    features?: string[];
  };
  status: string;
  amount: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  paymentStatus: string;
  activatedAt?: string;
  cancelAtPeriodEnd?: boolean;
  lastPaymentId?: string;
  createdAt?: string;
  recruiter: Recruiter;
}

interface RecruiterLimit {
  _id: string;
  candidateViewsLimit: number;
  candidateViewsUsed: number;
  jobPostsLimit: number;
  jobPostsUsed: number;
  resetAt?: string;
  updatedAt?: string;
  recruiter: Recruiter;
}

interface PaymentsBillingViewProps {
  onToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// ──────────────────────────────────────────────────────────
// STATUS BADGE HELPER
// ──────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const key = (status || '').toLowerCase();
  const config: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
    captured: { bg: '#E5F2EB', text: '#24593C', border: '#A8D4BB', icon: '✓', label: 'Successful' },
    successful: { bg: '#E5F2EB', text: '#24593C', border: '#A8D4BB', icon: '✓', label: 'Successful' },
    paid: { bg: '#E5F2EB', text: '#24593C', border: '#A8D4BB', icon: '✓', label: 'Paid' },
    active: { bg: '#E5F2EB', text: '#24593C', border: '#A8D4BB', icon: '●', label: 'Active' },
    failed: { bg: '#FEE4E2', text: '#B42318', border: '#FDA29B', icon: '✕', label: 'Failed' },
    cancelled: { bg: '#FEE4E2', text: '#B42318', border: '#FDA29B', icon: '⊘', label: 'Cancelled' },
    expired: { bg: '#F2F4F7', text: '#475467', border: '#D0D5DD', icon: '⏱', label: 'Expired' },
    pending: { bg: '#FEF0C7', text: '#B54708', border: '#FEDF89', icon: '⏳', label: 'Pending' },
    unpaid: { bg: '#FEF0C7', text: '#B54708', border: '#FEDF89', icon: '⚠', label: 'Unpaid' },
    inactive: { bg: '#F2F4F7', text: '#475467', border: '#D0D5DD', icon: '○', label: 'Inactive' },
    refunded: { bg: '#EAE8F4', text: '#6750A4', border: '#D6BBFB', icon: '↩', label: 'Refunded' },
  };

  const c = config[key] || { bg: '#F2F4F7', text: '#475467', border: '#D0D5DD', icon: '•', label: status || 'Unknown' };
  const px = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  const fs = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 ${px} ${fs} rounded-full font-bold uppercase tracking-wide border`}
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span className="text-[10px] leading-none">{c.icon}</span>
      <span>{c.label}</span>
    </span>
  );
};

// ──────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────
export const PaymentsBillingView: React.FC<PaymentsBillingViewProps> = ({ onToast }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscriptions' | 'limits'>('payments');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [limits, setLimits] = useState<RecruiterLimit[]>([]);

  // ⚡ Modal states for detailed inspection
  const [inspectedPayment, setInspectedPayment] = useState<Payment | null>(null);
  const [inspectedSubscription, setInspectedSubscription] = useState<Subscription | null>(null);

  // Override modal (limits only)
  const [editLimit, setEditLimit] = useState<RecruiterLimit | null>(null);
  const [jobLimit, setJobLimit] = useState<number>(0);
  const [viewsLimit, setViewsLimit] = useState<number>(0);
  const [savingLimit, setSavingLimit] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'payments') {
        const res = await billingApi.getPayments({ page, limit: 20, search: debouncedSearch, status: statusFilter });
        if (res.success) {
          setPayments(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } else if (activeTab === 'subscriptions') {
        const res = await billingApi.getSubscriptions({ page, limit: 20, search: debouncedSearch, status: statusFilter });
        if (res.success) {
          setSubscriptions(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } else if (activeTab === 'limits') {
        const res = await billingApi.getLimits({ page, limit: 20, search: debouncedSearch });
        if (res.success) {
          setLimits(res.data || []);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      }
    } catch (err: any) {
      onToast?.(err.message || 'Error loading billing data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, debouncedSearch, statusFilter, onToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (limit: RecruiterLimit) => {
    setEditLimit(limit);
    setJobLimit(limit.jobPostsLimit);
    setViewsLimit(limit.candidateViewsLimit);
  };

  const handleSaveLimits = async () => {
    if (!editLimit) return;
    setSavingLimit(true);
    try {
      const res = await billingApi.updateLimits(editLimit._id, {
        jobPostsLimit: jobLimit,
        candidateViewsLimit: viewsLimit,
      });
      if (res.success) {
        onToast?.('Quota limits updated successfully', 'success');
        setEditLimit(null);
        loadData();
      } else {
        throw new Error(res.message || 'Failed to update');
      }
    } catch (err: any) {
      onToast?.(err.message || 'Failed to update quota limits', 'error');
    } finally {
      setSavingLimit(false);
    }
  };

  // Summary KPIs
  const summary = useMemo(() => {
    if (activeTab === 'payments') {
      const totalRevenue = payments.filter((p) => ['captured', 'successful', 'paid'].includes(p.status.toLowerCase())).reduce((sum, p) => sum + (p.amount || 0), 0);
      const successCount = payments.filter((p) => ['captured', 'successful', 'paid'].includes(p.status.toLowerCase())).length;
      const failedCount = payments.filter((p) => p.status.toLowerCase() === 'failed').length;
      const pendingCount = payments.filter((p) => p.status.toLowerCase() === 'pending').length;
      return { type: 'payments' as const, totalRevenue, successCount, failedCount, pendingCount };
    }
    if (activeTab === 'subscriptions') {
      const active = subscriptions.filter((s) => s.status.toLowerCase() === 'active').length;
      const cancelled = subscriptions.filter((s) => ['cancelled', 'expired'].includes(s.status.toLowerCase())).length;
      const totalMrr = subscriptions.filter((s) => s.status.toLowerCase() === 'active').reduce((sum, s) => sum + (s.amount || 0), 0);
      return { type: 'subscriptions' as const, active, cancelled, totalMrr };
    }
    return null;
  }, [payments, subscriptions, activeTab]);

  const formatDate = (d?: string): string => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const formatCurrency = (amt: number, cur: string = 'INR'): string => {
    const symbol = cur === 'INR' ? '₹' : cur === 'USD' ? '$' : cur + ' ';
    return `${symbol}${(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => onToast?.(`${label}: ${text}`, 'success'));
  };

  return (
    <div className="space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-label-sm text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">
              Financial Console
            </span>
            <span className="text-xs text-outline font-medium">Payment Gateway Integration Portal</span>
          </div>
          <h1 className="font-headline-lg text-primary font-bold mt-1">Payments & Billing</h1>
          <p className="font-body-md text-on-surface-variant">
            Complete visibility into transactions, subscriptions, and recruiter quotas.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-sm hover:opacity-90 transition-all text-sm disabled:opacity-50 cursor-pointer"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* ═══ KPI CARDS ═══ */}
      {summary?.type === 'payments' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard label="Total Revenue" value={formatCurrency(summary.totalRevenue)} icon="payments" color="#24593C" bg="#E5F2EB" subtitle="From successful transactions" />
          <KpiCard label="Successful" value={String(summary.successCount)} icon="check_circle" color="#24593C" bg="#E5F2EB" subtitle="Captured payments" />
          <KpiCard label="Failed" value={String(summary.failedCount)} icon="cancel" color="#B42318" bg="#FEE4E2" subtitle="Requires investigation" />
          <KpiCard label="Pending" value={String(summary.pendingCount)} icon="hourglass_top" color="#B54708" bg="#FEF0C7" subtitle="Awaiting settlement" />
        </div>
      )}

      {summary?.type === 'subscriptions' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <KpiCard label="Active Subs" value={String(summary.active)} icon="workspace_premium" color="#24593C" bg="#E5F2EB" subtitle="Currently running" />
          <KpiCard label="Cancelled/Expired" value={String(summary.cancelled)} icon="pause_circle" color="#B42318" bg="#FEE4E2" subtitle="No longer active" />
          <KpiCard label="Monthly Revenue" value={formatCurrency(summary.totalMrr)} icon="trending_up" color="#6750A4" bg="#EAE8F4" subtitle="Recurring revenue" />
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div className="flex gap-2 border-b border-surface-variant pb-2 overflow-x-auto">
        {[
          { id: 'payments', label: 'Payment Transactions', icon: 'receipt_long' },
          { id: 'subscriptions', label: 'Active Subscriptions', icon: 'workspace_premium' },
          { id: 'limits', label: 'Usage & Quotas', icon: 'tune' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPage(1);
              setStatusFilter('all');
              setSearch('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ SEARCH + FILTER ═══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recruiter name, email, or company..."
            className="w-full pl-10 pr-3 py-2 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant outline-none focus:border-primary"
          />
        </div>
        {activeTab !== 'limits' && (
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-surface-container-low text-on-surface text-xs rounded-xl border border-outline-variant outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {activeTab === 'payments' ? (
              <>
                <option value="captured">Captured</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
              </>
            ) : (
              <>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </>
            )}
          </select>
        )}
      </div>

      {/* ═══ DATA DISPLAY ═══ */}
      {loading ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-surface-variant">
          <span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin inline-block" />
          <p className="text-xs text-outline mt-3 font-semibold">Loading billing data...</p>
        </div>
      ) : (
        <>
          {/* ── PAYMENTS TABLE ── */}
          {activeTab === 'payments' && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden">
              {payments.length === 0 ? (
                <EmptyState icon="receipt_long" title="No Payment Records" subtitle="No transactions match your criteria." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container text-outline font-bold uppercase tracking-wider text-[10px] border-b border-surface-variant">
                        <th className="p-4">Recruiter / Company</th>
                        <th className="p-4">Payment Details</th>
                        <th className="p-4">Plan Purchased</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4">Date & Time</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/40">
                      {payments.map((p) => (
                        <tr
                          key={p._id}
                          className="hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                          onClick={() => setInspectedPayment(p)}
                        >
                          <td className="p-4">
                            <div className="font-bold text-primary text-sm">{p.recruiter?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-outline">{p.recruiter?.email || 'N/A'}</div>
                            {p.recruiter?.companyName && (
                              <div className="text-[10px] text-primary font-semibold mt-0.5">🏢 {p.recruiter.companyName}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-mono text-[11px] text-primary font-bold">
                              {p.razorpayPaymentId ? p.razorpayPaymentId.slice(0, 18) + '...' : 'N/A'}
                            </div>
                            <div className="font-mono text-[10px] text-outline mt-0.5">
                              Order: {p.razorpayOrderId ? p.razorpayOrderId.slice(0, 16) + '...' : 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="bg-[#EAE8F4] text-[#6750A4] font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                              {p.planSnapshot?.name || 'N/A'}
                            </span>
                            {p.planSnapshot?.tier && (
                              <div className="text-[10px] text-outline mt-0.5 uppercase">Tier: {p.planSnapshot.tier}</div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="font-bold text-primary text-sm">{formatCurrency(p.amount, p.currency)}</div>
                            <div className="text-[10px] text-outline mt-0.5">{p.paymentType?.replace('_', ' ') || 'one time'}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-[11px] text-primary font-semibold">{formatDate(p.paidAt || p.createdAt)}</div>
                            {p.paidAt && p.paidAt !== p.createdAt && (
                              <div className="text-[10px] text-outline">Initiated: {formatDate(p.createdAt)}</div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <StatusBadge status={p.status} />
                            {p.failureReason && (
                              <div className="text-[9px] text-red-600 mt-1 max-w-[100px] mx-auto truncate" title={p.failureReason}>
                                {p.failureReason}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedPayment(p);
                              }}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                              title="View full details"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SUBSCRIPTIONS TABLE ── */}
          {activeTab === 'subscriptions' && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden">
              {subscriptions.length === 0 ? (
                <EmptyState icon="workspace_premium" title="No Subscriptions Found" subtitle="No active subscriptions match your criteria." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container text-outline font-bold uppercase tracking-wider text-[10px] border-b border-surface-variant">
                        <th className="p-4">Recruiter / Company</th>
                        <th className="p-4">Plan & Tier</th>
                        <th className="p-4">Billing</th>
                        <th className="p-4">Period</th>
                        <th className="p-4 text-center">Payment</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/40">
                      {subscriptions.map((s) => (
                        <tr
                          key={s._id}
                          className="hover:bg-surface-container-low/40 cursor-pointer transition-colors"
                          onClick={() => setInspectedSubscription(s)}
                        >
                          <td className="p-4">
                            <div className="font-bold text-primary text-sm">{s.recruiter?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-outline">{s.recruiter?.email || 'N/A'}</div>
                            {s.recruiter?.companyName && (
                              <div className="text-[10px] text-primary font-semibold mt-0.5">🏢 {s.recruiter.companyName}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-[#6750A4] text-sm">{s.planSnapshot?.name || 'N/A'}</div>
                            <div className="text-[10px] text-outline uppercase mt-0.5">Tier: {s.planSnapshot?.tier || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-primary capitalize">{s.planSnapshot?.billingCycle || 'monthly'}</div>
                            <div className="text-[11px] text-outline">{formatCurrency(s.amount, s.currency)}</div>
                          </td>
                          <td className="p-4 text-outline">
                            <div className="text-[11px]">
                              <strong className="text-primary">Start:</strong>{' '}
                              {s.currentPeriodStart ? new Date(s.currentPeriodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                            <div className="text-[11px]">
                              <strong className="text-primary">End:</strong>{' '}
                              {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <StatusBadge status={s.paymentStatus} />
                          </td>
                          <td className="p-4 text-center">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectedSubscription(s);
                              }}
                              className="p-1.5 rounded-lg text-primary hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                              title="View full details"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── QUOTAS TABLE ── */}
          {activeTab === 'limits' && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden">
              {limits.length === 0 ? (
                <EmptyState icon="tune" title="No Quota Records" subtitle="No recruiter usage quotas are configured yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-container text-outline font-bold uppercase tracking-wider text-[10px] border-b border-surface-variant">
                        <th className="p-4">Recruiter / Company</th>
                        <th className="p-4">Job Posting Quota</th>
                        <th className="p-4">Candidate Views Quota</th>
                        <th className="p-4">Next Reset</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-variant/40">
                      {limits.map((l) => {
                        const jobPct = Math.min(100, Math.round((l.jobPostsUsed / (l.jobPostsLimit || 1)) * 100));
                        const viewsPct = Math.min(100, Math.round((l.candidateViewsUsed / (l.candidateViewsLimit || 1)) * 100));
                        return (
                          <tr key={l._id} className="hover:bg-surface-container-low/40 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-primary text-sm">{l.recruiter?.name || 'Unknown'}</div>
                              <div className="text-[10px] text-outline">{l.recruiter?.email || 'N/A'}</div>
                              {l.recruiter?.companyName && (
                                <div className="text-[10px] text-primary font-semibold mt-0.5">🏢 {l.recruiter.companyName}</div>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-primary text-[13px]">
                                {l.jobPostsUsed} <span className="text-outline text-[11px]">/ {l.jobPostsLimit}</span>
                              </div>
                              <div className="w-40 bg-surface-container h-2 rounded overflow-hidden mt-1.5">
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${jobPct}%`,
                                    background: jobPct >= 90 ? '#DC2626' : jobPct >= 70 ? '#D97706' : '#6750A4',
                                  }}
                                />
                              </div>
                              <div className="text-[10px] text-outline mt-1">{jobPct}% used</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-primary text-[13px]">
                                {l.candidateViewsUsed} <span className="text-outline text-[11px]">/ {l.candidateViewsLimit}</span>
                              </div>
                              <div className="w-40 bg-surface-container h-2 rounded overflow-hidden mt-1.5">
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${viewsPct}%`,
                                    background: viewsPct >= 90 ? '#DC2626' : viewsPct >= 70 ? '#D97706' : '#24593C',
                                  }}
                                />
                              </div>
                              <div className="text-[10px] text-outline mt-1">{viewsPct}% used</div>
                            </td>
                            <td className="p-4 text-outline text-[11px]">
                              {l.resetAt ? formatDate(l.resetAt) : 'N/A'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenEdit(l)}
                                className="px-3 py-1.5 rounded-lg bg-[#EAE8F4] text-[#6750A4] font-bold border border-[#6750A4]/20 hover:bg-[#6750A4] hover:text-white transition-all cursor-pointer text-[11px] inline-flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">tune</span>
                                <span>Adjust</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ PAGINATION ═══ */}
      {totalPages > 1 && (
        <div className="bg-surface-container-lowest p-3 rounded-xl border border-surface-variant flex items-center justify-between text-xs">
          <span className="text-outline">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40 font-semibold"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 rounded bg-primary text-on-primary font-bold">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded border border-outline-variant bg-surface-container-lowest text-outline hover:text-on-surface cursor-pointer disabled:opacity-40 font-semibold"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PAYMENT DETAIL MODAL — Complete Transaction Overview  */}
      {/* ═══════════════════════════════════════════════════════ */}
      {inspectedPayment && (
        <DetailModal onClose={() => setInspectedPayment(null)}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={inspectedPayment.status} size="md" />
                  {inspectedPayment.paymentType && (
                    <span className="px-2 py-0.5 rounded bg-[#EAE8F4] text-[#6750A4] text-[10px] font-bold uppercase">
                      {inspectedPayment.paymentType.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-primary">Payment Transaction Details</h2>
                <p className="text-xs text-outline mt-0.5">Complete inspection of this payment record</p>
              </div>
              <button onClick={() => setInspectedPayment(null)} className="p-2 rounded-lg hover:bg-surface-container cursor-pointer text-outline">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Amount Hero */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#E5F2EB] to-[#F0FDF4] border border-[#A8D4BB] mb-4">
              <p className="text-[10px] text-[#24593C] uppercase font-bold tracking-wider">Total Amount</p>
              <p className="text-3xl font-bold text-[#24593C] mt-1">{formatCurrency(inspectedPayment.amount, inspectedPayment.currency)}</p>
              <p className="text-xs text-[#24593C] mt-1">
                {inspectedPayment.paidAt ? (
                  <>Captured on {formatDate(inspectedPayment.paidAt)}</>
                ) : (
                  <>Created on {formatDate(inspectedPayment.createdAt)}</>
                )}
              </p>
            </div>

            {/* Recruiter Info */}
            <SectionCard title="Recruiter Information" icon="person">
              <InfoRow label="Name" value={inspectedPayment.recruiter?.name} />
              <InfoRow label="Email" value={inspectedPayment.recruiter?.email} copyable onCopy={copyToClipboard} />
              <InfoRow label="Company" value={inspectedPayment.recruiter?.companyName} />
            </SectionCard>

            {/* Payment IDs */}
            <SectionCard title="Payment Gateway Details (Razorpay)" icon="key">
              <InfoRow label="Payment ID" value={inspectedPayment.razorpayPaymentId} mono copyable onCopy={copyToClipboard} />
              <InfoRow label="Order ID" value={inspectedPayment.razorpayOrderId} mono copyable onCopy={copyToClipboard} />
              {inspectedPayment.razorpaySignature && (
                <InfoRow label="Signature" value={inspectedPayment.razorpaySignature} mono copyable onCopy={copyToClipboard} />
              )}
            </SectionCard>

            {/* Plan Info */}
            <SectionCard title="Plan Details" icon="workspace_premium">
              <InfoRow label="Plan Name" value={inspectedPayment.planSnapshot?.name} />
              <InfoRow label="Tier" value={inspectedPayment.planSnapshot?.tier?.toUpperCase()} />
              <InfoRow label="Currency" value={inspectedPayment.currency} />
              <InfoRow label="Payment Type" value={inspectedPayment.paymentType?.replace('_', ' ')} />
            </SectionCard>

            {/* Timestamps */}
            <SectionCard title="Timeline" icon="schedule">
              <InfoRow label="Created At" value={formatDate(inspectedPayment.createdAt)} />
              <InfoRow label="Paid At" value={formatDate(inspectedPayment.paidAt)} />
              {inspectedPayment.updatedAt && <InfoRow label="Last Updated" value={formatDate(inspectedPayment.updatedAt)} />}
            </SectionCard>

            {/* Failure Reason */}
            {inspectedPayment.failureReason && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
                <p className="text-[10px] text-red-800 uppercase font-bold tracking-wider">⚠ Failure Reason</p>
                <p className="text-sm text-red-900 mt-1 font-semibold">{inspectedPayment.failureReason}</p>
              </div>
            )}
          </div>
        </DetailModal>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SUBSCRIPTION DETAIL MODAL — Full Plan Overview        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {inspectedSubscription && (
        <DetailModal onClose={() => setInspectedSubscription(null)}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={inspectedSubscription.status} size="md" />
                  <StatusBadge status={inspectedSubscription.paymentStatus} size="md" />
                </div>
                <h2 className="text-xl font-bold text-primary">Subscription Details</h2>
                <p className="text-xs text-outline mt-0.5">Complete plan and billing overview</p>
              </div>
              <button onClick={() => setInspectedSubscription(null)} className="p-2 rounded-lg hover:bg-surface-container cursor-pointer text-outline">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Plan Hero */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#EAE8F4] to-[#F4F3FF] border border-[#D6BBFB] mb-4">
              <p className="text-[10px] text-[#6750A4] uppercase font-bold tracking-wider">Active Plan</p>
              <p className="text-2xl font-bold text-[#6750A4] mt-1">{inspectedSubscription.planSnapshot?.name || 'N/A'}</p>
              <p className="text-xs text-[#6750A4] mt-1">
                Tier: <strong>{(inspectedSubscription.planSnapshot?.tier || 'N/A').toUpperCase()}</strong> ·{' '}
                {formatCurrency(inspectedSubscription.amount, inspectedSubscription.currency)} /{' '}
                {inspectedSubscription.planSnapshot?.billingCycle || 'monthly'}
              </p>
            </div>

            {/* Recruiter */}
            <SectionCard title="Recruiter" icon="person">
              <InfoRow label="Name" value={inspectedSubscription.recruiter?.name} />
              <InfoRow label="Email" value={inspectedSubscription.recruiter?.email} copyable onCopy={copyToClipboard} />
              <InfoRow label="Company" value={inspectedSubscription.recruiter?.companyName} />
            </SectionCard>

            {/* Plan Config */}
            <SectionCard title="Plan Configuration" icon="tune">
              <InfoRow label="Job Post Limit" value={String(inspectedSubscription.planSnapshot?.jobPostLimit ?? 'N/A')} />
              <InfoRow label="Resume View Limit" value={String(inspectedSubscription.planSnapshot?.resumeViewLimit ?? 'N/A')} />
              <InfoRow label="Base Price" value={formatCurrency(inspectedSubscription.planSnapshot?.price ?? 0, inspectedSubscription.currency)} />
              <InfoRow label="Billing Cycle" value={inspectedSubscription.planSnapshot?.billingCycle} />
            </SectionCard>

            {/* Features */}
            {inspectedSubscription.planSnapshot?.features && inspectedSubscription.planSnapshot.features.length > 0 && (
              <SectionCard title="Features Included" icon="checklist">
                <ul className="space-y-1">
                  {inspectedSubscription.planSnapshot.features.map((f, i) => (
                    <li key={i} className="text-xs text-primary flex items-center gap-2">
                      <span className="text-[#24593C]">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Billing Period */}
            <SectionCard title="Billing Period" icon="date_range">
              <InfoRow label="Current Period Start" value={formatDate(inspectedSubscription.currentPeriodStart)} />
              <InfoRow label="Current Period End" value={formatDate(inspectedSubscription.currentPeriodEnd)} />
              <InfoRow label="Activated At" value={formatDate(inspectedSubscription.activatedAt)} />
              <InfoRow label="Cancel at Period End" value={inspectedSubscription.cancelAtPeriodEnd ? 'Yes' : 'No'} />
            </SectionCard>

            {/* Payment Link */}
            {inspectedSubscription.lastPaymentId && (
              <SectionCard title="Last Payment" icon="payments">
                <InfoRow label="Last Payment ID" value={inspectedSubscription.lastPaymentId} mono copyable onCopy={copyToClipboard} />
              </SectionCard>
            )}
          </div>
        </DetailModal>
      )}

      {/* ═══ QUOTA EDIT MODAL ═══ */}
      {editLimit && (
        <DetailModal onClose={() => setEditLimit(null)} maxWidth="max-w-md">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#EAE8F4] flex items-center justify-center text-[#6750A4]">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Adjust Quotas</h3>
                <p className="text-xs text-outline">Editing limits for {editLimit.recruiter?.name || 'Recruiter'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Max Job Posts Allowed</label>
                <input
                  type="number"
                  min="0"
                  value={jobLimit}
                  onChange={(e) => setJobLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-surface-container text-on-surface rounded-xl border border-outline-variant outline-none focus:border-primary text-sm font-semibold"
                />
                <p className="text-[10px] text-outline mt-1">Currently used: {editLimit.jobPostsUsed}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase mb-1">Max Candidate Views</label>
                <input
                  type="number"
                  min="0"
                  value={viewsLimit}
                  onChange={(e) => setViewsLimit(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-surface-container text-on-surface rounded-xl border border-outline-variant outline-none focus:border-primary text-sm font-semibold"
                />
                <p className="text-[10px] text-outline mt-1">Currently used: {editLimit.candidateViewsUsed}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button onClick={() => setEditLimit(null)} disabled={savingLimit} className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSaveLimits} disabled={savingLimit} className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                {savingLimit && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {savingLimit ? 'Saving...' : 'Save Limits'}
              </button>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ──────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; icon: string; color: string; bg: string; subtitle: string }> = ({ label, value, icon, color, bg, subtitle }) => (
  <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-variant">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-outline uppercase font-bold tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg" style={{ background: bg, color }}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
    </div>
    <p className="text-xl font-bold mt-2" style={{ color }}>{value}</p>
    <p className="text-[10px] text-outline mt-1">{subtitle}</p>
  </div>
);

const EmptyState: React.FC<{ icon: string; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <div className="text-center py-16 px-4">
    <span className="material-symbols-outlined text-[48px] text-outline opacity-40">{icon}</span>
    <p className="text-sm font-bold text-primary mt-2">{title}</p>
    <p className="text-xs text-outline mt-1">{subtitle}</p>
  </div>
);

const DetailModal: React.FC<{ onClose: () => void; children: React.ReactNode; maxWidth?: string }> = ({ onClose, children, maxWidth = 'max-w-2xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
    <div className={`w-full ${maxWidth} max-h-[90vh] overflow-auto bg-surface-container-lowest rounded-2xl border border-surface-variant shadow-2xl`} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const SectionCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-4">
    <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {title}
    </h4>
    <div className="bg-surface-container-low rounded-xl border border-surface-variant p-3 space-y-2">
      {children}
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value?: string; mono?: boolean; copyable?: boolean; onCopy?: (val: string, label?: string) => void }> = ({ label, value, mono, copyable, onCopy }) => {
  if (!value || value === 'N/A' || value === '—') {
    return (
      <div className="flex justify-between items-center py-1 text-xs">
        <span className="text-outline">{label}:</span>
        <span className="text-outline italic">Not available</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between items-center py-1 gap-3 text-xs">
      <span className="text-outline flex-shrink-0">{label}:</span>
      <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
        <span className={`text-primary font-semibold text-right truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
        {copyable && onCopy && (
          <button
            onClick={() => onCopy(value, label)}
            className="p-0.5 rounded hover:bg-surface-container-high text-outline hover:text-primary shrink-0 cursor-pointer"
            title="Copy"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentsBillingView;