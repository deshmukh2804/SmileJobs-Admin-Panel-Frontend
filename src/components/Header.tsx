// FILE: frontend/src/components/Header.tsx
import React, { useState } from 'react';
import { AdminUser, NavItem, ROLE_METADATA, AdminRole } from '../types';

interface HeaderProps {
  currentTab: NavItem;
  currentUser: AdminUser;
  onOpenCommandPalette: () => void;
  onOpenPostVerify: () => void;
  onSelectTab: (tab: NavItem) => void;
  onOpenRolePicker: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  onOpenCommandPalette,
  onOpenPostVerify,
  onSelectTab,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const normalizeRole = (role: string): AdminRole => {
    const validRoles: AdminRole[] = [
      'Super Admin',
      'Admin',
      'Moderator',
      'Support Agent',
      'Content Manager',
      'Finance Manager',
    ];
    if (validRoles.includes(role as AdminRole)) return role as AdminRole;
    const foundRole = validRoles.find(
      (r) => r.toLowerCase().trim() === (role || '').toLowerCase().trim()
    );
    return foundRole || 'Admin';
  };

  const normalizedRole = normalizeRole(currentUser.activeRole);
  const roleMeta = ROLE_METADATA[normalizedRole] || ROLE_METADATA['Admin'];

  const getBreadcrumbLabel = (tab: NavItem) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview';
      case 'jobs':
        return 'Job Management';
      case 'candidates':
        return 'Candidates';
      case 'recruiters':
        return 'Recruiters';
      case 'verification':
        return 'Verification & Approval';
      case 'applications':
        return 'Applications Pipeline';
      case 'reports-and-complaints':
        return 'Reports & Complaints';
      case 'admin-activity-log':
        return 'Admin Activity Log';
      case 'banners':
        return 'Banner Management';
      case 'payments-and-billing':
        return 'Payments & Subscriptions';
      case 'roles-and-permissions':
        return 'Roles & Access Control';
      case 'content-management':
        return 'Content Management';
      case 'notifications':
        return 'Notifications & Broadcasts';
      case 'platform-settings':
        return 'Platform Settings';
      case 'resumes-and-profiles':
        return 'Resumes & Talent Profiles';
      default:
        return tab
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
    }
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-variant z-40 px-space-lg flex items-center justify-between select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 font-label-md text-on-surface-variant text-sm min-w-0">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          Home
        </button>
        <span className="text-outline">/</span>
        <button
          onClick={() => onSelectTab('dashboard')}
          className="hover:text-primary transition-colors cursor-pointer shrink-0"
        >
          Smile Jobs Admin
        </button>
        <span className="text-outline">/</span>
        <span className="text-primary font-semibold truncate">
          {getBreadcrumbLabel(currentTab)}
        </span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-space-md shrink-0">
        {/* Search Bar with ⌘K Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface-variant w-72 shadow-xs hover:border-primary transition-colors text-left cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-outline">
            search
          </span>
          <span className="font-body-sm text-outline flex-1 truncate">
            Search listings, candidates, records...
          </span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface-container font-label-sm text-[10px] text-outline border border-outline-variant">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-space-sm relative">
          {/* Action Trigger Button */}
          <button
            onClick={onOpenPostVerify}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-secondary font-label-md hover:bg-primary transition-colors shadow-xs cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Post/Verify</span>
          </button>

          {/* User Profile Bar with Role Badge */}
          <div className="relative pl-1 border-l border-surface-variant ml-1">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group"
            >
              <div className="relative">
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

              <div className="hidden sm:flex items-center gap-2 text-left">
                <span className="font-label-md text-primary font-bold text-xs">
                  {currentUser.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold border shrink-0 ${roleMeta.badgeClass}`}
                >
                  {normalizedRole}
                </span>
              </div>

              <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
                expand_more
              </span>
            </button>

            {/* Profile Dropdown - Switch Account REMOVED */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-surface-variant rounded-xl shadow-xl p-2 z-50 animate-in fade-in">
                <div className="px-3 py-2.5 border-b border-surface-variant">
                  <p className="font-label-md text-primary font-bold text-sm">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-outline font-mono truncate">{currentUser.email}</p>

                  <div className="mt-2 p-2 rounded-lg bg-surface-container-low border border-surface-variant/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-outline font-semibold uppercase">Active Role</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleMeta.badgeClass}`}>
                        {normalizedRole}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-tight">
                      {roleMeta.level}
                    </p>
                  </div>
                </div>

                <div className="pt-1 text-xs text-on-surface space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectTab('admin-activity-log');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span>Admin Audit Trail</span>
                  </button>

                  <div className="pt-1 border-t border-surface-variant">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-error-container/30 text-error transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};