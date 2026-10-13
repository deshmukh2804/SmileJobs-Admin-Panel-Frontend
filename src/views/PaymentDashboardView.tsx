import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../services/api';

/* ═══════════════════════════════════════════════════════════════
   INLINE SVG ICONS (Guarantees zero text leaks or font overlap)
   ═══════════════════════════════════════════════════════════════ */

const IconReceipt: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8h4" />
  </svg>
);

const IconRefresh: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconWallet: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconUsers: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IconTrendingUp: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconCheckCircle: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSearch: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconClose: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconCopy: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const IconCheck: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const IconChevronLeft: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const IconChevronRight: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const IconChevronDown: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════════════════════ */

interface PurchaseTransaction {
  _id: string;
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterMobile?: string;
  recruiterCompany?: string;
  candidateName: string;
  candidateEmail: string;
  candidateIds?: string[];
  quantity: number;
  unitPriceInPaise: number;
  totalAmountInPaise: number;
  amountInPaise: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  status: 'created' | 'pending' | 'captured' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

interface StatsSummary {
  totalPurchases: number;
  successfulPurchases: number;
  pendingPurchases: number;
  failedPurchases: number;
  refundedPurchases: number;
  collectedRevenueInPaise: number;
  totalProfilesSold: number;
  averagePricePerProfile: number;
}

const buildUrl = (path: string) => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  if (base.endsWith('/api/v1')) return `${base}${path}`;
  return `${base}/api/v1${path}`;
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  captured: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Captured' },
  paid: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
  pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  created: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Created' },
  failed: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Failed' },
  refunded: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500', label: 'Refunded' },
  cancelled: { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Cancelled' },
};

const formatCurrency = (paise: number): string => {
  const rupees = (paise || 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCurrencyShort = (paise: number): string => {
  const rupees = (paise || 0) / 100;
  if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(2)} Lakh`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getInitials = (name: string): string => {
  if (!name) return 'RC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const PaymentDashboardView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<StatsSummary>({
    totalPurchases: 0,
    successfulPurchases: 0,
    pendingPurchases: 0,
    failedPurchases: 0,
    refundedPurchases: 0,
    collectedRevenueInPaise: 0,
    totalProfilesSold: 0,
    averagePricePerProfile: 0,
  });

  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(buildUrl('/payment-dashboard/stats'), { headers: getHeaders() });
      const json = await res.json();
      if (json.success && json.data?.summary) {
        setStats(json.data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, [getHeaders]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
      });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(
        `${buildUrl('/payment-dashboard/transactions')}?${params.toString()}`,
        { headers: getHeaders() }
      );
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, currentPage, debouncedSearch, statusFilter]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {}
  };

  const handleRefresh = () => {
    fetchStats();
    fetchTransactions();
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter]);

  const successRate = useMemo(() => {
    if (stats.totalPurchases === 0) return 0;
    return Math.round((stats.successfulPurchases / stats.totalPurchases) * 100);
  }, [stats]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── 1. Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
              <IconReceipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Profile Purchases
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                Track recruiter profile orders, transactions & collected revenue
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading || statsLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <IconRefresh className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ─── 2. Top Stats Grid (Clean 3-Layer Cards) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            loading={statsLoading}
            icon={<IconWallet className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            label="Total Revenue"
            value={formatCurrencyShort(stats.collectedRevenueInPaise)}
            subtitle={`${stats.successfulPurchases} successful orders`}
          />

          <StatCard
            loading={statsLoading}
            icon={<IconUsers className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-50"
            label="Profiles Sold"
            value={String(stats.totalProfilesSold)}
            subtitle={`${stats.totalPurchases} total purchase attempts`}
          />

          <StatCard
            loading={statsLoading}
            icon={<IconTrendingUp className="w-5 h-5 text-indigo-600" />}
            iconBg="bg-indigo-50"
            label="Average Price"
            value={formatCurrency(stats.averagePricePerProfile)}
            subtitle="Calculated per profile"
          />

          <StatCard
            loading={statsLoading}
            icon={<IconCheckCircle className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-50"
            label="Success Rate"
            value={`${successRate}%`}
            subtitle={`${stats.failedPurchases} failed · ${stats.pendingPurchases} pending`}
          />
        </div>

        {/* ─── 3. Search & Filters Bar ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by recruiter name, email, company, or order ID..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 focus:outline-none transition placeholder:text-slate-400 text-slate-800"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  title="Clear search"
                >
                  <IconClose className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative min-w-[170px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 focus:outline-none transition cursor-pointer appearance-none pr-9"
              >
                <option value="ALL">All Statuses</option>
                <option value="captured">Captured</option>
                <option value="paid">Paid</option>
                <option value="created">Created</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <IconChevronDown className="w-4 h-4" />
              </span>
            </div>
          </div>

          {(debouncedSearch || statusFilter !== 'ALL') && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-500">
                Showing <strong className="text-slate-900 font-semibold">{totalCount}</strong> matching record{totalCount !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* ─── 4. Transactions List (Table Desktop / Cards Mobile) ─── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium mt-3">Loading purchase records...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
                <IconReceipt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {debouncedSearch || statusFilter !== 'ALL' ? 'No matching transactions' : 'No profile purchases yet'}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto mt-1">
                {debouncedSearch || statusFilter !== 'ALL'
                  ? 'Try modifying your search keywords or status filter.'
                  : 'Purchases made by recruiters will appear in this table automatically.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Recruiter</th>
                      <th className="px-6 py-3.5">Quantity</th>
                      <th className="px-6 py-3.5 text-right">Total Amount</th>
                      <th className="px-6 py-3.5">Order / Payment ID</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Purchased Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {transactions.map((tx) => {
                      const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.created;
                      const dt = formatDate(tx.createdAt);
                      return (
                        <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Recruiter Details */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                                {getInitials(tx.recruiterName)}
                              </div>
                              <div className="min-w-0 max-w-[200px]">
                                <p className="font-semibold text-slate-900 truncate">{tx.recruiterName}</p>
                                <p className="text-xs text-slate-500 truncate">{tx.recruiterEmail}</p>
                                {tx.recruiterCompany && (
                                  <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                                    {tx.recruiterCompany}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Quantity & Unit Price */}
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-900">
                              {tx.quantity} {tx.quantity === 1 ? 'Profile' : 'Profiles'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatCurrency(tx.unitPriceInPaise)} each
                            </p>
                          </td>

                          {/* Amount */}
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-slate-900 text-base">
                              {formatCurrency(tx.totalAmountInPaise)}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                              {tx.currency}
                            </span>
                          </td>

                          {/* Razorpay IDs */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <button
                                onClick={() => handleCopy(tx.razorpayOrderId, `order-${tx._id}`)}
                                className="group flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-600 font-mono transition text-left"
                                title="Click to copy Order ID"
                              >
                                <span className="text-[10px] uppercase font-sans font-bold text-slate-400 w-10">Order</span>
                                <span className="truncate max-w-[130px]">{tx.razorpayOrderId}</span>
                                <span className="opacity-0 group-hover:opacity-100 text-blue-600 transition">
                                  {copiedField === `order-${tx._id}` ? <IconCheck /> : <IconCopy />}
                                </span>
                              </button>

                              {tx.razorpayPaymentId ? (
                                <button
                                  onClick={() => handleCopy(tx.razorpayPaymentId!, `pay-${tx._id}`)}
                                  className="group flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 font-mono transition text-left"
                                  title="Click to copy Payment ID"
                                >
                                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 w-10">Pay</span>
                                  <span className="truncate max-w-[130px]">{tx.razorpayPaymentId}</span>
                                  <span className="opacity-0 group-hover:opacity-100 text-blue-600 transition">
                                    {copiedField === `pay-${tx._id}` ? <IconCheck /> : <IconCopy />}
                                  </span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                                  <span className="text-[10px] uppercase font-sans font-bold text-slate-400 w-10">Pay</span>
                                  <span className="italic text-slate-300 font-sans">Pending</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800 text-xs">{dt.date}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{dt.time}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.created;
                  const dt = formatDate(tx.createdAt);
                  const isExpanded = expandedRow === tx._id;

                  return (
                    <div key={tx._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {getInitials(tx.recruiterName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">{tx.recruiterName}</p>
                            <p className="text-xs text-slate-500 truncate">{tx.recruiterEmail}</p>
                            {tx.recruiterCompany && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{tx.recruiterCompany}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-900 text-base">{formatCurrency(tx.totalAmountInPaise)}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold mt-1 ${statusCfg.bg} ${statusCfg.text}`}>
                            <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Quantity</span>
                          <span className="font-semibold text-slate-800">{tx.quantity} Profile{tx.quantity !== 1 ? 's' : ''}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Price</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(tx.unitPriceInPaise)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : tx._id)}
                        className="w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide payment IDs' : 'View payment IDs'}</span>
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <IconChevronDown className="w-3.5 h-3.5" />
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Order ID</span>
                            <span className="font-mono text-slate-700 break-all">{tx.razorpayOrderId}</span>
                          </div>
                          {tx.razorpayPaymentId && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment ID</span>
                              <span className="font-mono text-slate-700 break-all">{tx.razorpayPaymentId}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date</span>
                            <span className="text-slate-700">{dt.date} at {dt.time}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50/60 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                    <span className="font-semibold text-slate-800">{totalPages}</span> ({totalCount} total)
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <IconChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <span>Next</span>
                      <IconChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STAT CARD SUB-COMPONENT (Structured 3-Layer Layout)
   ═══════════════════════════════════════════════════════════════ */

interface StatCardProps {
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({
  loading,
  icon,
  iconBg,
  label,
  value,
  subtitle,
}) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
    {/* Layer 1: Label & Icon */}
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
        {label}
      </span>
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>

    {/* Layer 2: Big Metric Value */}
    <div className="mt-3">
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </p>
      )}
    </div>

    {/* Layer 3: Subtitle / Context */}
    <p className="text-xs font-medium text-slate-500 mt-2 truncate">
      {subtitle}
    </p>
  </div>
);