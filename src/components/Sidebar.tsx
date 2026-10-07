// FILE: frontend/src/components/Sidebar.tsx
import React, { useMemo } from 'react';
import { AdminUser, NavItem, ROLE_PERMISSIONS, getRoleBadgeClass } from '../types';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  currentUser: AdminUser;
  pendingVerificationsCount?: number;
  pendingJobsCount?: number;  // ✅ NEW
  activeJobsCount?: number;
  totalCandidatesCount?: number;
  totalRecruitersCount?: number;
  totalApplicationsCount?: number;
  reportsCount?: number;
  onOpenRolePicker: () => void;
  onLogout: () => void;
}

interface NavMenuItem {
  id: NavItem;
  label: string;
  icon: string;
  count?: string | number;
  countColor?: string;
  highlight?: boolean;  // ✅ NEW: Pulse animation for urgent items
}

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  pendingVerificationsCount = 0,
  pendingJobsCount = 0,  // ✅ NEW
  activeJobsCount = 0,
  totalCandidatesCount = 0,
  totalRecruitersCount = 0,
  totalApplicationsCount = 0,
  reportsCount = 0,
  onOpenRolePicker,
  onLogout,
}) => {
  const permittedTabs = useMemo<NavItem[]>(() => {
    const roleName = (currentUser.activeRole || '').trim();
    const isSuperAdmin =
      roleName.toLowerCase() === 'super admin' || roleName.toLowerCase() === 'superadmin';

    if (isSuperAdmin) {
      return ROLE_PERMISSIONS['Super Admin'] || [];
    }

    if (Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0) {
      return currentUser.permissions;
    }

    return [];
  }, [currentUser]);

  const badgeClass = getRoleBadgeClass(currentUser.activeRole);

  const isAllowed = (tab: NavItem) => {
    const roleName = (currentUser.activeRole || '').trim().toLowerCase();
    if (roleName === 'super admin' || roleName === 'superadmin') {
      return true;
    }
    return permittedTabs.includes(tab);
  };

  const overviewItems: NavMenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  ].filter((item) => isAllowed(item.id));

  // ✅ NEW: Approvals section — dedicated job approval queue
  const approvalItems: NavMenuItem[] = [
    {
      id: 'job-approvals' as NavItem,
      label: 'Job Approvals',
      icon: 'fact_check',
      count: pendingJobsCount > 0 ? pendingJobsCount : undefined,
      countColor: pendingJobsCount > 0 ? 'bg-amber-500 text-white animate-pulse font-bold' : undefined,
      highlight: pendingJobsCount > 0,
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: 'verified',
      count: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
      countColor: pendingVerificationsCount > 0 ? 'bg-amber-500 text-white animate-pulse font-bold' : 'bg-surface-container-highest text-on-surface font-semibold',
      highlight: pendingVerificationsCount > 0,
    },
  ].filter((item) => isAllowed(item.id) || item.id === 'job-approvals'); // Always show job-approvals for admins

  const managementItems: NavMenuItem[] = [
    {
      id: 'candidates',
      label: 'Candidates',
      icon: 'person',
      count: formatCount(totalCandidatesCount),
    },
    {
      id: 'recruiters',
      label: 'Recruiters',
      icon: 'business_center',
      count: formatCount(totalRecruitersCount),
    },
    {
      id: 'jobs',
      label: 'All Jobs',
      icon: 'work',
      count: formatCount(activeJobsCount),
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: 'description',
      count: formatCount(totalApplicationsCount),
    },
  ].filter((item) => isAllowed(item.id));

  const operationsItems: NavMenuItem[] = [
    { id: 'payments-and-billing', label: 'Payments & Billing', icon: 'credit_card' },
    {
      id: 'manage-subscriptions',
      label: 'Manage Subscriptions',
      icon: 'workspace_premium',
      countColor: 'bg-[#EAE8F4] text-[#6750A4] font-bold',
    },
    { id: 'banners', label: 'Banners', icon: 'image' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  ].filter((item) => isAllowed(item.id));

  const systemItems: NavMenuItem[] = [
    { id: 'roles-and-permissions', label: 'Roles & Permissions', icon: 'security' },
    { id: 'bottom-nav-config', label: 'Mobile Bottom Nav', icon: 'phone_iphone' },
    { id: 'admin-activity-log', label: 'Admin Activity Log', icon: 'history' },
  ].filter((item) => isAllowed(item.id));

  const totalItems =
    overviewItems.length + approvalItems.length + managementItems.length + operationsItems.length + systemItems.length;

  const renderNavGroup = (title: string, items: NavMenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1 animate-fade-in">
        <p className="px-space-sm py-1 font-label-sm text-outline uppercase tracking-wider text-[10px] font-bold">
          {title}
        </p>
        {items.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-space-sm py-1.5 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
                isActive
                  ? 'bg-secondary-fixed text-primary font-bold shadow-xs'
                  : item.highlight
                  ? 'text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] shrink-0">{item.icon}</span>
                <span className="truncate text-left">{item.label}</span>
              </div>
              {item.count !== undefined && item.count !== 0 && item.count !== '0' && (
                <span
                  className={`text-[9px] px-1.5 py-0 rounded-full shrink-0 ${
                    item.countColor || 'bg-surface-container-high text-on-surface-variant font-bold'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-surface-container-lowest border-r border-surface-variant z-50 flex flex-col justify-between overflow-y-auto select-none">
      <div className="flex flex-col">
        {/* Brand Header — Smile Jobs */}
        <div className="h-16 px-space-md border-b border-surface-variant flex items-center justify-between gap-space-sm">
          <div
            className="flex items-center gap-space-sm min-w-0 cursor-pointer"
            onClick={() => {
              if (isAllowed('dashboard')) onSelectTab('dashboard');
              else if (permittedTabs.length > 0) onSelectTab(permittedTabs[0]);
            }}
          >
            <div className="h-9 w-9 rounded-lg bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[22px]">sentiment_very_satisfied</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-primary truncate tracking-tight text-sm">Smile Jobs</span>
              <span className="text-[10px] text-outline leading-none">Admin Portal</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-secondary-fixed text-on-secondary-fixed whitespace-nowrap font-bold">
            v1.0
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="p-space-sm space-y-space-md">
          {renderNavGroup('Overview', overviewItems)}
          {/* ✅ NEW: Approvals section */}
          {renderNavGroup('Approvals', approvalItems)}
          {renderNavGroup('Management', managementItems)}
          {renderNavGroup('Operations', operationsItems)}
          {renderNavGroup('System', systemItems)}

          {totalItems === 0 && (
            <div className="p-3 mt-4 rounded-lg bg-error-container/20 border border-error-container/40 text-center animate-pulse">
              <span className="material-symbols-outlined text-[20px] text-error">error</span>
              <p className="text-[11px] text-error font-semibold mt-1">
                No permissions detected for role: <br />
                <strong>"{currentUser.activeRole}"</strong>
              </p>
              <p className="text-[10px] text-outline mt-1">
                Contact your Super Admin to assign permissions.
              </p>
            </div>
          )}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-space-sm border-t border-surface-variant bg-surface-container-lowest">
        <div className="p-2 rounded-xl bg-surface-container-low border border-surface-variant space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-surface-variant"
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#5F8A72] border-2 border-surface-container-lowest" />
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <span className="text-on-surface truncate text-xs font-bold">
                  {currentUser.name}
                </span>
                <span
                  className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded mt-0.5 border w-fit truncate ${badgeClass}`}
                >
                  {currentUser.activeRole}
                </span>
              </div>
            </div>

            <button
              className="text-outline hover:text-error transition-colors p-1 flex items-center justify-center rounded cursor-pointer"
              title="Sign Out"
              onClick={onLogout}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>

          <div className="pt-1.5 border-t border-surface-variant flex items-center justify-between text-[10px]">
            <span className="text-outline">
              {permittedTabs.length} module{permittedTabs.length !== 1 ? 's' : ''} accessible
            </span>
            <button
              onClick={onOpenRolePicker}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px]">info</span>
              <span>View Role</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};