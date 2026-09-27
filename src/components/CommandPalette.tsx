import React, { useState, useEffect } from 'react';
import { AdminRole, JobItem, NavItem, ROLE_PERMISSIONS, UserItem } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: JobItem[];
  users: UserItem[];
  currentRole?: AdminRole;
  onSelectTab: (tab: NavItem) => void;
  onSelectJob: (job: JobItem) => void;
  onOpenRolePicker?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  jobs,
  users,
  currentRole,
  onSelectTab,
  onSelectJob,
  onOpenRolePicker,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.company.toLowerCase().includes(query.toLowerCase()) ||
      j.id.toLowerCase().includes(query.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      u.id.toLowerCase().includes(query.toLowerCase())
  );

  const permitted = currentRole ? ROLE_PERMISSIONS[currentRole] || [] : [];

  const modules: { id: NavItem; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard' },
    { id: 'jobs', label: 'Job Management', icon: 'work' },
    { id: 'users', label: 'User Directory', icon: 'group' },
    { id: 'verification', label: 'Verification Center', icon: 'verified' },
    { id: 'reports-and-complaints', label: 'Reports & Complaints', icon: 'warning' },
    { id: 'payments-and-billing', label: 'Payments & Billing', icon: 'credit_card' },
    { id: 'content-management', label: 'Content Management', icon: 'view_kanban' },
    { id: 'roles-and-permissions', label: 'Roles & Permissions', icon: 'security' },
    { id: 'admin-activity-log', label: 'Admin Activity Log', icon: 'history' },
  ];

  const filteredModules = modules.filter((m) =>
    m.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div
        className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-surface-variant">
          <span className="material-symbols-outlined text-[22px] text-outline">
            search
          </span>
          <input
            autoFocus
            type="text"
            className="w-full px-3 py-3.5 bg-transparent text-on-surface placeholder:text-outline text-base focus:outline-none"
            placeholder="Search candidates, jobs, commands, or jump to module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-0.5 text-xs bg-surface-container rounded text-outline border border-outline-variant">
            ESC
          </kbd>
        </div>

        {/* Quick Nav Options */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-surface-container-low">
          {/* Persona Switch Action */}
          {onOpenRolePicker && (
            <div className="py-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenRolePicker();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary-fixed/30 text-primary hover:bg-primary-fixed/50 text-left text-xs font-semibold cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    switch_account
                  </span>
                  <span>Switch Operational Persona (Continue as…)</span>
                </div>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>
          )}

          {/* Quick Actions / Modules */}
          <div className="py-2">
            <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
              Jump To Module
            </p>
            <div className="grid grid-cols-2 gap-1">
              {filteredModules.map((m) => {
                const isAllowed = !currentRole || permitted.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectTab(m.id);
                      onClose();
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container text-left text-xs text-on-surface cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                        {m.icon}
                      </span>
                      <span className="truncate">{m.label}</span>
                    </div>
                    {!isAllowed && (
                      <span className="text-[10px] text-error font-semibold flex items-center gap-0.5 shrink-0">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matching Jobs */}
          {filteredJobs.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                Jobs ({filteredJobs.length})
              </p>
              {filteredJobs.slice(0, 4).map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    onSelectJob(job);
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      work_outline
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{job.title}</p>
                      <p className="text-xs text-outline">
                        {job.company} • {job.location} • {job.id}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matching Users */}
          {filteredUsers.length > 0 && (
            <div className="py-2">
              <p className="px-3 text-[11px] font-bold text-outline uppercase tracking-wider mb-1">
                Users &amp; Employers ({filteredUsers.length})
              </p>
              {filteredUsers.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelectTab('users');
                    onClose();
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      account_circle
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{user.name}</p>
                      <p className="text-xs text-outline">
                        {user.email} • {user.role} • {user.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-fixed text-primary">
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-surface-container-low text-xs text-outline flex items-center justify-between border-t border-surface-variant">
          <span>Press ESC or click outside to dismiss</span>
          <button
            onClick={onClose}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
