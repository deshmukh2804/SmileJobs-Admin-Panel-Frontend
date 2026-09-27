// FILE: frontend/src/views/DashboardView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { NavItem, DashboardStats } from '../types';
import { dashboardApi } from '../services/api';

interface DashboardViewProps {
  onSelectTab: (tab: NavItem) => void;
  onVerifyEntity: (id: string, name: string) => void;
  onInspectEntity: (id: string) => void;
  onExportReport: () => void;
  jobs: any[];
  verifications: any[];
}

const DONUT_COLORS = ['#42326E', '#675492', '#AF9DE1', '#CEB9FF', '#D1BCFF', '#EADDFF'];

const getStatusTagStyle = (type: string, tag: string) => {
  if (type === 'complaint' || tag === 'High Priority' || tag === 'Alert') {
    return 'bg-error-container text-on-error-container';
  }
  if (type === 'approval' || type === 'kyc' || tag === 'Verified by Admin' || tag === 'Success') {
    return 'bg-[#D4E8DC] text-[#2E6047]';
  }
  return 'bg-secondary-fixed text-primary';
};

const getDotColor = (type: string) => {
  if (type === 'complaint') return 'bg-error-container';
  if (type === 'approval' || type === 'kyc') return 'bg-[#D4E8DC]';
  if (type === 'candidate') return 'bg-primary-fixed';
  return 'bg-secondary-fixed';
};

const formatTimeAgo = (timestamp: string) => {
  if (!timestamp) return 'just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTab,
  onVerifyEntity,
  onInspectEntity,
  onExportReport,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [chartMode, setChartMode] = useState<'users' | 'applications'>('users');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const res = await dashboardApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
        if (res.data.growthChart?.months?.length > 0) {
          setHoveredMonth(res.data.growthChart.months.length - 1);
        }
      } else {
        setError(res.message || 'Failed to load stats');
      }
    } catch (err: any) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          <p className="mt-3 text-outline text-sm">Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-error text-[48px]">error</span>
          <p className="mt-3 text-error font-semibold text-lg">Dashboard Data Unavailable</p>
          <p className="mt-1 text-outline text-sm">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadStats();
            }}
            className="mt-4 px-6 py-2.5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ═══════════════════════════════════════════════════════════
  // DESTRUCTURE REAL DATA
  // ═══════════════════════════════════════════════════════════
  const {
    kpis,
    growthChart,
    jobsByCategory,
    applicationPipeline,
    jobFunnel,
    activityFeed,
    pendingVerifications,
    systemHealth,
  } = stats;

  const months = growthChart.months;
  const candidateChartData = chartMode === 'users' ? growthChart.candidates : growthChart.applications;
  const employerChartData = growthChart.employers;

  // ═══════════════════════════════════════════════════════════
  // SVG CHART PATH BUILDERS
  // ═══════════════════════════════════════════════════════════
  const chartHeight = 135;
  const topPad = 30;
  const svgWidth = 600;
  const baselineY = topPad + chartHeight; // 165

  const chartMax = Math.max(...candidateChartData, 1);
  const chartMaxEmp = Math.max(...employerChartData, 1);
  const stepX = months.length > 1 ? svgWidth / (months.length - 1) : svgWidth;

  const buildLinePath = (data: number[], maxVal: number) => {
    if (!data || data.length === 0) return '';
    return data
      .map((val, idx) => {
        const x = 30 + idx * stepX;
        const y = topPad + chartHeight - (val / maxVal) * chartHeight;
        return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  };

  const buildAreaPath = (linePath: string) => {
    if (!linePath) return '';
    const lastX = 30 + (months.length - 1) * stepX;
    return `${linePath} L ${lastX},${baselineY} L 30,${baselineY} Z`;
  };

  const candidateLinePath = buildLinePath(candidateChartData, chartMax);
  const employerLinePath = buildLinePath(employerChartData, chartMaxEmp);
  const candidateAreaPath = buildAreaPath(candidateLinePath);
  const employerAreaPath = buildAreaPath(employerLinePath);

  // ═══════════════════════════════════════════════════════════
  // DONUT CHART MATH
  // ═══════════════════════════════════════════════════════════
  const donutCircumference = 2 * Math.PI * 38;
  let cumulativeDonutOffset = 0;

  // ═══════════════════════════════════════════════════════════
  // HELPER: render trend indicator
  // ═══════════════════════════════════════════════════════════
  const renderTrend = (change: number | undefined, subtitle: string, isCount = false) => {
    const val = change ?? 0;
    const isPositive = val >= 0;
    return (
      <div className="flex items-center gap-1 mt-1 text-xs text-[#5F8A72]">
        <span className="material-symbols-outlined text-[14px]">
          {isPositive ? 'trending_up' : 'trending_down'}
        </span>
        <span className="font-semibold">
          {isPositive ? '+' : ''}
          {val}
          {!isCount ? '%' : ''}
        </span>
        <span className="text-outline ml-1">{subtitle}</span>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-space-lg">
      {/* ─── Page Title & Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg text-primary font-bold">Dashboard Overview</h1>
            <span className="px-2 py-0.5 rounded-full font-label-sm text-[11px] bg-secondary-fixed text-on-secondary-fixed flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="font-body-md text-on-surface-variant mt-0.5">
            Monitor real-time platform activity, acquisition metrics, and verification workflows.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-lowest p-0.5 shadow-xs">
            {(['7d', '30d', '3m', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 font-label-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? 'Last 30 Days' : range === '3m' ? '3 Months' : '1 Year'}
              </button>
            ))}
          </div>

          <button
            onClick={onExportReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-label-md hover:bg-surface-container shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* ─── Operational Alert Banner ─── */}
      <div className="bg-primary-fixed/30 border border-primary-fixed-dim rounded-xl p-space-sm px-space-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
          <p className="font-body-sm text-on-primary-fixed-variant">
            <strong className="text-primary font-semibold">
              System Health: {systemHealth.uptime} uptime
            </strong>{' '}
            • All services functioning normally • {systemHealth.pendingCritical} critical verification items
            awaiting supervisory audit
          </p>
        </div>
        <button
          onClick={() => onSelectTab('verification')}
          className="font-label-sm text-primary hover:underline flex items-center gap-1 shrink-0 font-bold"
        >
          <span>Review Verification Queue</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* ─── 8 KPI Cards (Revenue removed → Verified Companies) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Card 1: Total Candidates */}
        <div
          onClick={() => onSelectTab('candidates')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Total Candidates</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.totalCandidates.value.toLocaleString()}
            </h3>
            {renderTrend(kpis.totalCandidates.change, kpis.totalCandidates.subtitle || 'vs last month')}
          </div>
        </div>

        {/* Card 2: Total Employers */}
        <div
          onClick={() => onSelectTab('recruiters')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Total Employers</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">domain</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.totalEmployers.value.toLocaleString()}
            </h3>
            {renderTrend(kpis.totalEmployers.change, kpis.totalEmployers.subtitle || 'verified companies')}
          </div>
        </div>

        {/* Card 3: Active Jobs */}
        <div
          onClick={() => onSelectTab('jobs')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Active Jobs</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">work</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.activeJobs.value.toLocaleString()}
            </h3>
            {renderTrend(kpis.activeJobs.change, kpis.activeJobs.subtitle || 'hiring brands')}
          </div>
        </div>

        {/* Card 4: Applications */}
        <div
          onClick={() => onSelectTab('applications')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Applications</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">description</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.applications.value.toLocaleString()}
            </h3>
            {renderTrend(kpis.applications.change, kpis.applications.subtitle || 'total submissions')}
          </div>
        </div>

        {/* Card 5: Pending Verification */}
        <div
          onClick={() => onSelectTab('verification')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Pending Verification</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <h3 className="font-headline-lg text-primary font-bold tracking-tight">
                {kpis.pendingVerification.value.toLocaleString()}
              </h3>
              {(kpis.pendingVerification.expedited || 0) > 0 && (
                <span className="font-label-sm text-[10px] px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-semibold">
                  {kpis.pendingVerification.expedited} Expedited
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs text-outline">
              <span>{kpis.pendingVerification.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Card 6: Reports & Complaints */}
        <div
          onClick={() => onSelectTab('reports-and-complaints')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Reports &amp; Complaints</span>
            <span className="p-2 rounded-lg bg-surface-container text-error group-hover:bg-error group-hover:text-on-error transition-colors">
              <span className="material-symbols-outlined text-[18px]">report_problem</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-error font-bold tracking-tight">
              {kpis.reportsComplaints.value.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-outline">
              <span>{kpis.reportsComplaints.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Card 7: Verified Companies (replaces Revenue) */}
        <div
          onClick={() => onSelectTab('verification')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">Verified Companies</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.verifiedCompanies.value.toLocaleString()}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-[#5F8A72]">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              <span className="font-semibold">{(kpis.verifiedCompanies.total || 0).toLocaleString()} total</span>
              <span className="text-outline ml-1">{kpis.verifiedCompanies.subtitle}</span>
            </div>
          </div>
        </div>

        {/* Card 8: New Users Today */}
        <div
          onClick={() => onSelectTab('candidates')}
          className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs hover:border-primary transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-outline">New Users Today</span>
            <span className="p-2 rounded-lg bg-surface-container text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </span>
          </div>
          <div className="mt-2">
            <h3 className="font-headline-lg text-primary font-bold tracking-tight">
              {kpis.newUsersToday.value.toLocaleString()}
            </h3>
            {renderTrend(kpis.newUsersToday.change, kpis.newUsersToday.subtitle || 'vs yesterday', true)}
          </div>
        </div>
      </div>

      {/* ─── Admin Quick Access Panel ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div
          onClick={() => onSelectTab('banners')}
          className="bg-gradient-to-br from-[#F4F3FF] to-[#E8DEF8] p-space-md rounded-xl border border-primary/20 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary text-on-primary shadow-md">
              <span className="material-symbols-outlined text-[22px]">view_carousel</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
          </div>
          <h3 className="font-headline-sm text-primary font-bold">Banner Management</h3>
          <p className="text-xs text-on-surface-variant mt-1">Promotional banners with up to 5 images, live scheduling, and CTR tracking.</p>
        </div>

        <div
          onClick={() => onSelectTab('payments-and-billing')}
          className="bg-gradient-to-br from-[#ECFDF3] to-[#D1FADF] p-space-md rounded-xl border border-[#12B76A]/20 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#12B76A] text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">credit_card</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-[#12B76A] transition-colors">arrow_forward</span>
          </div>
          <h3 className="font-headline-sm text-[#027A48] font-bold">Subscriptions</h3>
          <p className="text-xs text-on-surface-variant mt-1">Create pricing plans for recruiters & candidates with Razorpay integration.</p>
        </div>

        <div
          onClick={() => onSelectTab('roles-and-permissions')}
          className="bg-gradient-to-br from-[#FEF6EE] to-[#FEDF89] p-space-md rounded-xl border border-[#D97706]/20 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#D97706] text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-[#D97706] transition-colors">arrow_forward</span>
          </div>
          <h3 className="font-headline-sm text-[#B54708] font-bold">Roles & Permissions</h3>
          <p className="text-xs text-on-surface-variant mt-1">Create/edit/deactivate admin users. Assign 6 preset roles with permissions.</p>
        </div>

        <div
          onClick={() => onSelectTab('admin-activity-log')}
          className="bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] p-space-md rounded-xl border border-[#2563EB]/20 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-[#2563EB] text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">history</span>
            </div>
            <span className="material-symbols-outlined text-outline group-hover:text-[#2563EB] transition-colors">arrow_forward</span>
          </div>
          <h3 className="font-headline-sm text-[#1E40AF] font-bold">Activity Log</h3>
          <p className="text-xs text-on-surface-variant mt-1">Full audit trail: who changed what, when. Before/after diff snapshots.</p>
        </div>
      </div>

      {/* ─── Analytics Charts Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Left (8 Cols): User Growth Chart - REAL DATA */}
        <div className="lg:col-span-8 bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-headline-sm text-primary font-bold">User Growth &amp; Acquisition</h3>
                <p className="font-body-sm text-outline">
                  Monthly trajectory of {chartMode === 'users' ? 'candidates vs employers' : 'application submissions'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-xs text-outline mr-2">
                  <span className="flex items-center gap-1 font-semibold text-[#42326E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#42326E]" />
                    {chartMode === 'users' ? 'Candidates' : 'Applications'}
                  </span>
                  {chartMode === 'users' && (
                    <span className="flex items-center gap-1 font-semibold text-[#937AD2]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#937AD2]" />
                      Employers
                    </span>
                  )}
                </div>
                <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-0.5 text-xs">
                  <button
                    onClick={() => setChartMode('users')}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      chartMode === 'users' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline'
                    }`}
                  >
                    Candidates vs Employers
                  </button>
                  <button
                    onClick={() => setChartMode('applications')}
                    className={`px-2 py-0.5 rounded font-semibold ${
                      chartMode === 'applications' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline'
                    }`}
                  >
                    Applications
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart with REAL data */}
            <div className="relative h-64 w-full pt-4">
              {/* Tooltip */}
              {hoveredMonth !== null && months[hoveredMonth] && (
                <div
                  className="absolute z-20 pointer-events-none -translate-x-1/2 -top-2 bg-primary text-on-primary px-3 py-1.5 rounded-lg shadow-lg text-xs"
                  style={{ left: `${(hoveredMonth / Math.max(months.length - 1, 1)) * 90 + 5}%` }}
                >
                  <p className="font-bold">{months[hoveredMonth]}</p>
                  <p className="text-[#CEB9FF]">
                    {(candidateChartData[hoveredMonth] || 0).toLocaleString()}{' '}
                    {chartMode === 'users' ? 'Candidates' : 'Applications'}
                    {chartMode === 'users' && ` • ${(employerChartData[hoveredMonth] || 0).toLocaleString()} Employers`}
                  </p>
                </div>
              )}

              <svg className="w-full h-full overflow-visible" viewBox="0 0 700 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="candidateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#42326E" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#42326E" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="employerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#937AD2" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#937AD2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="700" y2="30" stroke="#EEEEE9" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="700" y2="80" stroke="#EEEEE9" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="700" y2="130" stroke="#EEEEE9" strokeDasharray="3 3" />
                <line x1="0" y1="180" x2="700" y2="180" stroke="#E2E3DE" />

                {/* Candidate/Application area + line */}
                {candidateAreaPath && <path d={candidateAreaPath} fill="url(#candidateGrad)" />}
                {candidateLinePath && (
                  <path d={candidateLinePath} fill="none" stroke="#42326E" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Employer area + line (only in users mode) */}
                {chartMode === 'users' && employerAreaPath && <path d={employerAreaPath} fill="url(#employerGrad)" />}
                {chartMode === 'users' && employerLinePath && (
                  <path d={employerLinePath} fill="none" stroke="#937AD2" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" />
                )}

                {/* Interactive hover points */}
                {candidateChartData.map((val, idx) => {
                  const x = 30 + idx * stepX;
                  const y = topPad + chartHeight - (val / chartMax) * chartHeight;
                  return (
                    <g key={idx} onMouseEnter={() => setHoveredMonth(idx)} className="cursor-pointer">
                      <rect x={x - 25} y="0" width="50" height="200" fill="transparent" />
                      {hoveredMonth === idx && (
                        <>
                          <line x1={x} y1="15" x2={x} y2="180" stroke="#42326E" strokeWidth="1" strokeDasharray="2 2" />
                          <circle cx={x} cy={y} r="5" fill="#42326E" stroke="#ffffff" strokeWidth="2" />
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Month Labels */}
              <div className="flex justify-between text-[11px] text-outline px-4 -mt-2">
                {months.map((m, idx) => (
                  <span
                    key={`${m}-${idx}`}
                    className={`cursor-pointer ${hoveredMonth === idx ? 'text-primary font-bold' : ''}`}
                    onClick={() => setHoveredMonth(idx)}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-variant flex flex-wrap items-center justify-between text-xs text-outline">
            <span>
              Total Candidates: {kpis.totalCandidates.value.toLocaleString()} • Total Employers:{' '}
              {kpis.totalEmployers.value.toLocaleString()}
            </span>
            <span className="font-semibold text-primary">Live Database Sync</span>
          </div>
        </div>

        {/* Right (4 Cols): Jobs by Category Donut Chart - REAL DATA */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-headline-sm text-primary font-bold">Jobs by Category</h3>
              <span className="font-label-sm text-[11px] text-outline">
                {kpis.activeJobs.value.toLocaleString()} Active
              </span>
            </div>
            <p className="font-body-sm text-outline mb-4">Distribution of live roles across key sectors</p>

            {/* Donut Chart */}
            <div className="flex items-center justify-center my-3 relative">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F4F4EF" strokeWidth="14" />
                {jobsByCategory.map((cat, idx) => {
                  const dashLength = (cat.percentage / 100) * donutCircumference;
                  const dashArray = `${dashLength} ${donutCircumference - dashLength}`;
                  const offset = -cumulativeDonutOffset;
                  cumulativeDonutOffset += dashLength;
                  return (
                    <circle
                      key={cat.name}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                      strokeWidth="14"
                      strokeDasharray={dashArray}
                      strokeDashoffset={offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-headline-sm text-primary font-bold">
                  {kpis.activeJobs.value.toLocaleString()}
                </span>
                <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider">Live Postings</span>
              </div>
            </div>

            {/* Category list */}
            <div className="space-y-2 mt-4 text-xs">
              {jobsByCategory.length === 0 ? (
                <p className="text-center text-outline py-4">No active job categories yet</p>
              ) : (
                jobsByCategory.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      />
                      <span className="text-on-surface font-medium truncate max-w-[140px]">{cat.name}</span>
                    </span>
                    <span className="font-semibold text-primary">
                      {cat.count.toLocaleString()} ({cat.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectTab('jobs')}
            className="mt-4 w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>Manage Category Taxonomies</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* ─── Mid Row: Job Funnel & Application Pipeline ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Job Platform Funnel - REAL DATA */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-headline-sm text-primary font-bold">Job Platform Funnel &amp; Distribution</h3>
              <p className="font-body-sm text-outline">
                Current operational balance across active, pending, and archived lifecycle stages
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container text-xs font-bold text-primary">
              Total {jobFunnel.total.toLocaleString()} Postings
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
              <span className="text-[#5F8A72]">
                Live: {jobFunnel.live.count.toLocaleString()} ({jobFunnel.live.percentage}%)
              </span>
              <span className="text-[#C58A3A]">
                Pending: {jobFunnel.pending.count.toLocaleString()} ({jobFunnel.pending.percentage}%)
              </span>
              <span className="text-outline">
                Archived: {jobFunnel.archived.count.toLocaleString()} ({jobFunnel.archived.percentage}%)
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden flex">
              <div className="bg-[#5F8A72] h-full" style={{ width: `${jobFunnel.live.percentage}%` }} />
              <div className="bg-[#C58A3A] h-full" style={{ width: `${jobFunnel.pending.percentage}%` }} />
              <div className="bg-outline-variant h-full" style={{ width: `${jobFunnel.archived.percentage}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                <span className="material-symbols-outlined text-[16px] text-[#C58A3A]">schedule</span>
                <span>Pending Moderation Queue</span>
              </div>
              <p className="text-xs text-outline">
                {jobFunnel.pending.count} job descriptions awaiting compliance scrutiny.
              </p>
              <button
                onClick={() => onSelectTab('jobs')}
                className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>Review {jobFunnel.pending.count} Pending Jobs</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low border border-surface-variant">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                <span className="material-symbols-outlined text-[16px] text-outline">auto_delete</span>
                <span>Archived Postings</span>
              </div>
              <p className="text-xs text-outline">
                {jobFunnel.archived.count} jobs have been archived or expired.
              </p>
              <button
                onClick={() => onSelectTab('jobs')}
                className="mt-2 text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Archived Postings</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Application Pipeline Health - REAL DATA */}
        <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-headline-sm text-primary font-bold">Application Pipeline Health</h3>
                <p className="font-body-sm text-outline">
                  Stage progression across {applicationPipeline.total.toLocaleString()} submissions
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-secondary-fixed text-primary text-xs font-bold">
                {applicationPipeline.total.toLocaleString()} Total
              </span>
            </div>

            <div className="space-y-3 my-2">
              {applicationPipeline.stages.map((stage, idx) => {
                const colors = ['bg-primary', 'bg-secondary', 'bg-on-primary-container', 'bg-[#5F8A72]'];
                const textColors = ['text-primary', 'text-primary', 'text-primary', 'text-[#5F8A72]'];
                return (
                  <div key={stage.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-on-surface">
                        {idx + 1}. {stage.name}
                      </span>
                      <span className={`font-bold ${textColors[idx]}`}>
                        {stage.count.toLocaleString()} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`${colors[idx]} h-full rounded-full`}
                        style={{ width: `${Math.min(stage.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-variant flex items-center justify-between text-xs">
            <span className="text-outline">Real-time pipeline snapshot</span>
            <button
              onClick={() => onSelectTab('applications')}
              className="text-primary font-bold hover:underline flex items-center gap-1"
            >
              <span>Detailed Pipeline Analytics</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bottom Row: Activity Feed & Pending Verifications ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Activity Feed - REAL DATA */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5F8A72] animate-pulse" />
                <h3 className="font-headline-sm text-primary font-bold">Recent Platform Activity</h3>
              </div>
              <button
                onClick={loadStats}
                className="text-outline hover:text-primary transition-colors p-1"
                title="Refresh Activity"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-variant">
              {activityFeed.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-outline text-[32px]">inbox</span>
                  <p className="text-outline text-sm mt-2">No recent platform activity yet</p>
                  <p className="text-outline text-xs mt-1">Activity will appear here as users interact with the platform</p>
                </div>
              ) : (
                activityFeed.map((item) => (
                  <div key={item.id} className="relative">
                    <span
                      className={`absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full ${getDotColor(item.type)} border-2 border-surface-container-lowest`}
                    />
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-label-md text-on-surface text-sm">{item.title}</p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${getStatusTagStyle(item.type, item.statusTag)}`}
                      >
                        {item.statusTag}
                      </span>
                    </div>
                    <p className="font-body-sm text-outline mt-0.5">{item.description}</p>
                    <span className="text-[10px] text-outline mt-0.5 block">{formatTimeAgo(item.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-variant text-right">
            <button
              onClick={() => onSelectTab('admin-activity-log')}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Audit Log</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Pending Verifications - REAL DATA */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant mb-3">
              <div>
                <h3 className="font-headline-sm text-primary font-bold">Pending Verifications</h3>
                <p className="font-body-sm text-outline">Entities awaiting identity, compliance, and credential audit</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-xs font-bold">
                {systemHealth.pendingCritical} Urgent
              </span>
            </div>

            <div className="space-y-3">
              {pendingVerifications.length === 0 ? (
                <div className="py-8 text-center">
                  <span className="material-symbols-outlined text-[#5F8A72] text-[32px]">verified</span>
                  <p className="text-[#5F8A72] font-semibold text-sm mt-2">All Clear!</p>
                  <p className="text-outline text-xs mt-1">No pending verifications at this time</p>
                </div>
              ) : (
                pendingVerifications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-surface-variant hover:border-primary transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-container text-on-secondary flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {item.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-label-md text-primary font-bold">{item.title}</h4>
                          <span className="px-1.5 py-0.2 rounded bg-surface-container text-[10px] text-outline font-mono">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-xs text-outline mt-0.5">
                          {item.type} • Submitted {item.submittedTime}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {item.documents.map((doc, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-surface-container-lowest text-on-surface border border-outline-variant flex items-center gap-1 font-medium"
                            >
                              <span
                                className={`material-symbols-outlined text-[12px] ${
                                  doc.verified ? 'text-[#5F8A72]' : 'text-outline'
                                }`}
                              >
                                {doc.verified ? 'check' : 'pending'}
                              </span>
                              {doc.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => onInspectEntity(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary text-xs font-semibold border border-outline-variant transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onVerifyEntity(item.id, item.title)}
                        className="px-3 py-1 rounded-lg bg-[#5F8A72] hover:opacity-90 text-on-secondary text-xs font-bold shadow-xs transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-variant flex items-center justify-between text-xs">
            <span className="text-outline">
              {kpis.pendingVerification.value} total in queue
            </span>
            <button
              onClick={() => onSelectTab('verification')}
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Go to Verification Center Queue</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};