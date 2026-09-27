// FILE: frontend/src/views/PlaceholderView.tsx
import React from 'react';
import { NavItem } from '../types';
import { BannerManagementView } from './BannerManagementView';
import { SubscriptionManagementView } from './SubscriptionManagementView';
import { RolesPermissionsView } from './RolesPermissionsView';

interface PlaceholderViewProps {
  tab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ tab, onSelectTab }) => {
  // ═══════════════════════════════════════════════════
  // ROUTE BANNERS TAB TO FULL BANNER MANAGEMENT VIEW
  // ═══════════════════════════════════════════════════
  if (tab === 'banners') {
    return <BannerManagementView />;
  }

  // ═══════════════════════════════════════════════════
  // ROUTE PAYMENTS & BILLING TAB TO SUBSCRIPTION VIEW
  // ═══════════════════════════════════════════════════
  if (tab === 'payments-and-billing') {
    return <SubscriptionManagementView />;
  }

  // ═══════════════════════════════════════════════════
  // ROUTE ROLES & PERMISSIONS TAB TO ADMIN MANAGEMENT
  // ═══════════════════════════════════════════════════
  if (tab === 'roles-and-permissions') {
    return <RolesPermissionsView />;
  }

  const getDetails = (t: NavItem) => {
    switch (t) {
      case 'reports-and-complaints':
        return {
          title: 'Reports & Complaints Governance',
          desc: 'Investigate reported job listings, suspicious recruiters, and candidate policy dispute tickets.',
          icon: 'warning',
          stats: [
            { label: 'Active Disputed Tickets', value: '38 Issues', sub: '-4.3% flag volume down' },
            { label: 'Critical Payment Complaints', value: '7 Urgent', sub: 'Immediate freeze placed' },
            { label: 'Average Resolution Time', value: '2.4 Hours', sub: '99.1% SLA compliance' },
          ],
        };
      case 'content-management':
        return {
          title: 'Content & Editorial Management',
          desc: 'Curate career resources, blog updates, interview cheat-sheets, and featured hiring partner spotlights.',
          icon: 'view_kanban',
          stats: [
            { label: 'Published Guides', value: '142 Articles', sub: '3.8k daily readers' },
            { label: 'Drafts in Review', value: '14 Submissions', sub: 'Awaiting editorial sign-off' },
            { label: 'Partner Spotlights', value: '12 Featured', sub: 'Swiggy, Zomato, TechNova' },
          ],
        };
      case 'notifications':
        return {
          title: 'System Notifications & Broadcasts',
          desc: 'Send targeted push alerts, email digests, and candidate job match updates.',
          icon: 'notifications',
          stats: [
            { label: 'Broadcast Delivery Rate', value: '99.4%', sub: '24,580 candidates reached' },
            { label: 'Weekly Digest Open Rate', value: '48.2%', sub: 'Above industry benchmark' },
            { label: 'Pending Triggers', value: '18 Alerts', sub: 'Automated match notifications' },
          ],
        };
      case 'platform-settings':
        return {
          title: 'Platform Settings & Configurations',
          desc: 'Configure system integrations, domain authorization, cloud gateways, and security thresholds.',
          icon: 'settings',
          stats: [
            { label: 'Environment', value: 'Production v3.4', sub: 'Cluster health 99.98%' },
            { label: 'OCR Engine', value: 'Active (v2.8)', sub: 'Threshold: 92.5% pass' },
            { label: 'API Gateways', value: '14 Connected', sub: 'MCA, Razorpay, DigiLocker' },
          ],
        };
      case 'resumes-and-profiles':
        return {
          title: 'Resumes & Talent Profiles Directory',
          desc: 'Search candidate CV repository, parsed skill taxonomies, and verified credentials.',
          icon: 'badge',
          stats: [
            { label: 'Indexed Resumes', value: '24,580 Files', sub: '100% parsed with AI ATS' },
            { label: 'Verified Degrees', value: '18,420 Degrees', sub: 'DigiLocker NAD integrated' },
            { label: 'Average Talent Score', value: '88.4%', sub: 'Ready for recruiter discovery' },
          ],
        };
      default:
        return {
          title: 'Module Center',
          desc: 'Enterprise administrative operations portal.',
          icon: 'dashboard',
          stats: [],
        };
    }
  };

  const details = getDetails(tab);

  return (
    <div className="space-y-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-primary font-bold">{details.title}</h1>
          <p className="font-body-md text-on-surface-variant">{details.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="px-3.5 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {details.stats.map((stat, i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs"
          >
            <span className="text-xs font-medium text-outline">{stat.label}</span>
            <h3 className="font-headline-lg text-primary font-bold mt-1">{stat.value}</h3>
            <p className="text-xs text-[#5F8A72] font-semibold mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest p-space-md rounded-xl border border-surface-variant shadow-xs space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-container-low border border-surface-variant">
          <span className="material-symbols-outlined text-[28px] text-primary">
            {details.icon}
          </span>
          <div>
            <h4 className="font-label-lg text-primary font-bold">Operational Control Matrix</h4>
            <p className="text-xs text-outline">
              All records in this module sync continuously with the core database and compliance ledger.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onSelectTab('jobs')}
            className="p-4 rounded-xl border border-surface-variant hover:border-primary bg-surface-container-low/40 text-left transition-colors cursor-pointer"
          >
            <p className="font-label-md text-primary font-bold">Navigate to Job Management</p>
            <p className="text-xs text-outline mt-0.5">
              Review and moderate the 3,842 active listings and 148 pending approvals.
            </p>
          </button>

          <button
            onClick={() => onSelectTab('verification')}
            className="p-4 rounded-xl border border-surface-variant hover:border-primary bg-surface-container-low/40 text-left transition-colors cursor-pointer"
          >
            <p className="font-label-md text-primary font-bold">Open Verification Queue</p>
            <p className="text-xs text-outline mt-0.5">
              Inspect statutory credentials, corporate GSTIN, and identity KYC documents.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};