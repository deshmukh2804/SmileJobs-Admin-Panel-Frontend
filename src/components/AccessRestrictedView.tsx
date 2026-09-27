// FILE: frontend/src/components/AccessRestrictedView.tsx
import React from 'react';
import { NavItem, ROLE_DEFAULT_TABS, ROLE_METADATA, getRoleBadgeClass } from '../types';

interface AccessRestrictedViewProps {
  attemptedTab: NavItem;
  currentRole: string;
  userRoles: string[];
  onNavigateAllowed: (tab: NavItem) => void;
  onOpenRolePicker: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  attemptedTab,
  currentRole,
  userRoles,
  onNavigateAllowed,
  onOpenRolePicker,
}) => {
  const defaultTab = ROLE_DEFAULT_TABS[currentRole] || 'dashboard';
  const roleMeta = ROLE_METADATA[currentRole];
  const badgeClass = getRoleBadgeClass(currentRole);

  const getModuleLabel = (tab: NavItem | string) => {
    return tab
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };

  const hasAlternativeRoles = userRoles.length > 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="max-w-lg w-full bg-surface-container-lowest border border-surface-variant rounded-2xl p-space-xl shadow-lg relative overflow-hidden">
        {/* Subtle accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-error" />

        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-error-container/30 border border-error-container text-error flex items-center justify-center mx-auto mb-5 shadow-xs">
          <span className="material-symbols-outlined text-[36px]">gpp_bad</span>
        </div>

        {/* Title & Code */}
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-error-container text-on-error-container mb-2">
          HTTP 403 • FORBIDDEN
        </span>
        <h2 className="font-headline-md text-primary font-bold tracking-tight">
          Access Restricted
        </h2>
        <p className="font-body-md text-on-surface-variant mt-2 text-sm leading-relaxed">
          You do not have administrative privileges to view the{' '}
          <strong className="text-primary font-semibold">"{getModuleLabel(attemptedTab)}"</strong>{' '}
          module with your current active profile.
        </p>

        {/* Role & Context Information Box */}
        <div className="mt-5 p-3.5 rounded-xl bg-surface-container-low border border-surface-variant text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-outline font-medium">Your Active Role:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}>
              {currentRole}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline font-medium">Clearance Level:</span>
            <span className="text-on-surface font-semibold">{roleMeta?.level || 'Custom Role'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline font-medium">Default Landing:</span>
            <span className="text-on-surface font-semibold">{getModuleLabel(defaultTab)}</span>
          </div>
          <div className="pt-2 border-t border-surface-variant text-[11px] text-outline">
            Access to this resource requires higher security clearance or a specialized administrative role assigned to your enterprise ID.
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigateAllowed(defaultTab)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary-container text-on-secondary font-label-md hover:bg-primary transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Return to {getModuleLabel(defaultTab)}</span>
          </button>

          {hasAlternativeRoles && (
            <button
              onClick={onOpenRolePicker}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container font-label-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">switch_account</span>
              <span>Switch Role</span>
            </button>
          )}
        </div>

        {/* Footer info note */}
        <p className="mt-5 text-[11px] text-outline">
          Need access? Contact your Organization Super Admin or Security Governance Team.
        </p>
      </div>
    </div>
  );
};