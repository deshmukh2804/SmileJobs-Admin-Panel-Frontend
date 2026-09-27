// FILE: frontend/src/components/RolePickerModal.tsx
import React from 'react';
import { AdminUser, NavItem, ROLE_DEFAULT_TABS, ROLE_METADATA, ROLE_PERMISSIONS, getRoleBadgeClass } from '../types';

interface RolePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser;
  onSelectRole: (role: string) => void;
  title?: string;
  subtitle?: string;
}

export const RolePickerModal: React.FC<RolePickerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
  title = 'Select Active Administrative Role',
  subtitle = 'Choose your operational persona. Your navigation menu and permissions will adapt automatically.',
}) => {
  if (!isOpen) return null;

  const availableRoles: string[] = currentUser.roles.length > 0
    ? currentUser.roles
    : [currentUser.activeRole];

  const formatTabName = (tab: NavItem | string) =>
    tab
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface-container-lowest border border-surface-variant rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-surface-variant flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container/10 border border-primary-container/30 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <h3 className="font-label-lg text-primary font-bold">{title}</h3>
              <p className="text-xs text-outline mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User context summary */}
        <div className="px-5 py-3 bg-surface-container-low/30 border-b border-surface-variant flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-surface-variant"
            />
            <span className="font-semibold text-primary">{currentUser.name}</span>
            <span className="text-outline font-mono">({currentUser.email})</span>
          </div>
          <span className="text-outline">
            {availableRoles.length} role{availableRoles.length > 1 ? 's' : ''} authorized
          </span>
        </div>

        {/* Role Options */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {availableRoles.map((role) => {
            const meta = ROLE_METADATA[role];
            const defaultTab = ROLE_DEFAULT_TABS[role] || currentUser.landingPage || 'dashboard';
            // Use dynamic permissions from currentUser, fallback to hardcoded
            const permissions = (currentUser.permissions && currentUser.permissions.length > 0)
              ? currentUser.permissions
              : (ROLE_PERMISSIONS[role] || []);
            const isActive = currentUser.activeRole === role;
            const badgeClass = getRoleBadgeClass(role);

            return (
              <button
                key={role}
                onClick={() => {
                  onSelectRole(role);
                  onClose();
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-4 cursor-pointer relative ${
                  isActive
                    ? 'border-primary bg-primary-fixed/30 shadow-xs'
                    : 'border-surface-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/40'
                }`}
              >
                {/* Active Checkmark */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    isActive
                      ? 'bg-primary border-primary text-white'
                      : 'border-outline-variant bg-surface-container-lowest'
                  }`}
                >
                  {isActive && <span className="material-symbols-outlined text-[14px]">check</span>}
                </div>

                {/* Role Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-label-md text-primary font-bold text-sm">{role}</span>
                    {meta && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                        {meta.level}
                      </span>
                    )}
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white">
                        Currently Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {meta?.description || 'Custom role with configured permissions'}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-surface-variant/60 flex items-center justify-between text-[11px] text-outline flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">flight_takeoff</span>
                      <span>Lands on:</span>
                      <strong className="text-primary font-semibold">{formatTabName(defaultTab)}</strong>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">layers</span>
                      <span>{permissions.length} accessible modules</span>
                    </div>
                  </div>
                </div>

                <div className="self-center shrink-0 text-outline">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-variant bg-surface-container-low/50 flex items-center justify-between">
          <p className="text-[11px] text-outline">
            Role switching takes effect immediately without requiring re-authentication.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};