// FILE: frontend/src/views/RolesPermissionsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, roleApi, AdminUserPayload } from '../services/api';
import { CustomRole, NavItem, PermissionMeta, ROLE_METADATA, getRoleBadgeClass } from '../types';

const MIcon: React.FC<{ name: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  name, size = 18, color, style,
}) => (
  <span
    className="material-symbols-outlined"
    style={{ fontSize: size, color, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {name}
  </span>
);

const PERMISSION_META: PermissionMeta[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'Overview', description: 'View analytics, KPIs & platform metrics' },
  { id: 'users', label: 'Users Management', icon: 'group', group: 'Management', description: 'Manage candidates and employers' },
  { id: 'jobs', label: 'Jobs Management', icon: 'work', group: 'Management', description: 'Post, approve, edit & moderate jobs' },
  { id: 'applications', label: 'Applications', icon: 'description', group: 'Management', description: 'View & manage job applications' },
  { id: 'resumes-and-profiles', label: 'Resumes & Profiles', icon: 'badge', group: 'Management', description: 'Access candidate resumes' },
  { id: 'verification', label: 'Verification Queue', icon: 'verified', group: 'Operations', description: 'Review & approve KYC documents' },
  { id: 'payments-and-billing', label: 'Payments & Billing', icon: 'credit_card', group: 'Operations', description: 'Subscription plans & transactions' },
  { id: 'reports-and-complaints', label: 'Reports & Complaints', icon: 'warning', group: 'Operations', description: 'Handle user reports & disputes' },
  { id: 'content-management', label: 'Content Management', icon: 'view_kanban', group: 'Operations', description: 'Manage editorial content' },
  { id: 'banners', label: 'Banners', icon: 'image', group: 'Operations', description: 'Manage promotional banners' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications', group: 'Operations', description: 'Send platform-wide notifications' },
  { id: 'roles-and-permissions', label: 'Roles & Permissions', icon: 'security', group: 'System', description: 'Manage admin roles & access', critical: true },
  { id: 'platform-settings', label: 'Platform Settings', icon: 'settings', group: 'System', description: 'Global platform configuration', critical: true },
  { id: 'admin-activity-log', label: 'Admin Activity Log', icon: 'history', group: 'System', description: 'View audit trail of admin actions' },
];

const GROUP_COLORS: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  Overview:   { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', accent: '#0EA5E9' },
  Management: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', accent: '#22C55E' },
  Operations: { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C', accent: '#F97316' },
  System:     { bg: '#FAF5FF', border: '#E9D5FF', text: '#7E22CE', accent: '#A855F7' },
};

const ROLE_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DB2777', '#0891B2', '#DC2626', '#4F46E5', '#EA580C', '#0D9488'];
const ROLE_ICONS = ['shield', 'admin_panel_settings', 'verified_user', 'support_agent', 'edit_note', 'account_balance', 'manage_accounts', 'supervisor_account', 'engineering', 'psychology'];

const getAdminId = (admin: any): string => admin._id || admin.id || '';

const parseBadgeClass = (cls: string): React.CSSProperties => {
  if (cls.includes('purple')) return { background: '#F4F3FF', color: '#6750A4', border: '1px solid #E8DEF8' };
  if (cls.includes('blue'))   return { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' };
  if (cls.includes('emerald'))return { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
  if (cls.includes('amber'))  return { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
  if (cls.includes('rose'))   return { background: '#FFF1F2', color: '#DB2777', border: '1px solid #FECDD3' };
  if (cls.includes('teal'))   return { background: '#F0FDFA', color: '#0891B2', border: '1px solid #99F6E4' };
  return { background: '#F9FAFB', color: '#475467', border: '1px solid #E4E7EC' };
};

type ViewTab = 'admins' | 'roles';

export const RolesPermissionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>('admins');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 3500); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 6000); return () => clearTimeout(t); }
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .row-h:hover { background: #F9FAFB; }
        .perm-card { transition: all 0.15s ease; }
        .perm-card:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .role-card { transition: all 0.15s ease; }
        .role-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .tab-btn { transition: all 0.15s ease; }
        .tab-btn.active {
          background: linear-gradient(135deg,#6750A4,#7F56D9);
          color: #fff;
          box-shadow: 0 3px 10px rgba(103,80,164,0.25);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 10, padding: '18px 20px',
        background: '#fff', borderRadius: 14, border: '1px solid #E4E7EC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#6750A4,#7F56D9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(103,80,164,0.25)',
          }}>
            <MIcon name="security" size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#101828' }}>
              Roles & Permissions
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#667085' }}>
              Manage administrative users and configure granular access control
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
          color: '#B42318', fontWeight: 600, fontSize: 12, animation: 'fadeIn 0.2s ease',
        }}>
          <MIcon name="error" size={16} color="#B42318" />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
            <MIcon name="close" size={14} color="#B42318" />
          </button>
        </div>
      )}
      {success && (
        <div style={{
          padding: '10px 14px', background: '#ECFDF3', border: '1px solid #A6F4C5',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
          color: '#027A48', fontWeight: 600, fontSize: 12, animation: 'fadeIn 0.2s ease',
        }}>
          <MIcon name="check_circle" size={16} color="#027A48" />
          <span style={{ flex: 1 }}>{success}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: 4, background: '#F2F4F7',
        borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        <button
          onClick={() => setActiveTab('admins')}
          className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            background: activeTab === 'admins' ? undefined : 'transparent',
            color: activeTab === 'admins' ? undefined : '#667085',
          }}
        >
          <MIcon name="group" size={16} color={activeTab === 'admins' ? '#fff' : '#667085'} />
          Admin Users
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            background: activeTab === 'roles' ? undefined : 'transparent',
            color: activeTab === 'roles' ? undefined : '#667085',
          }}
        >
          <MIcon name="shield" size={16} color={activeTab === 'roles' ? '#fff' : '#667085'} />
          Manage Roles
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'admins' && <AdminsTab onSuccess={setSuccess} onError={setError} />}
      {activeTab === 'roles' && <RolesTab onSuccess={setSuccess} onError={setError} />}
    </div>
  );
};

const AdminsTab: React.FC<{ onSuccess: (m: string) => void; onError: (m: string) => void }> = ({
  onSuccess, onError,
}) => {
  const [admins, setAdmins] = useState<AdminUserPayload[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserPayload | null>(null);
  const [resetPwdFor, setResetPwdFor] = useState<AdminUserPayload | null>(null);
  const [filterRole, setFilterRole] = useState('all');
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<CustomRole[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterRole !== 'all') params.role = filterRole;
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.getAllAdmins(params);
      if (res.success) { setAdmins(res.data); setStats(res.stats); }
    } catch { /* silent */ }
    try {
      const rolesRes = await roleApi.getAllRoles();
      if (rolesRes.success) setRoles(rolesRes.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filterRole, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (admin: AdminUserPayload) => {
    const adminId = getAdminId(admin);
    if (!adminId) return;
    const reason = admin.isActive
      ? window.prompt(`Reason for deactivating ${admin.name}? (optional)`)
      : '';
    if (admin.isActive && reason === null) return;
    try {
      const res = await adminApi.toggleAdminStatus(adminId, reason || '');
      if (res.success) { onSuccess(res.message); fetchData(); }
      else onError(res.message);
    } catch (err: any) { onError(err.message); }
  };

  const handleDelete = async (admin: AdminUserPayload) => {
    const adminId = getAdminId(admin);
    if (!adminId) return;
    if (!window.confirm(`Permanently delete ${admin.name} (${admin.role})?\n\nThis cannot be undone.`)) return;
    try {
      const res = await adminApi.deleteAdmin(adminId);
      if (res.success) { onSuccess(res.message); fetchData(); }
      else onError(res.message);
    } catch (err: any) { onError(err.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideUp 0.25s ease' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Admins', value: stats.total, icon: 'group', color: '#6750A4', bg: '#F4F3FF' },
          { label: 'Active', value: stats.active, icon: 'check_circle', color: '#027A48', bg: '#ECFDF3' },
          { label: 'Inactive', value: stats.inactive, icon: 'block', color: '#B42318', bg: '#FEF3F2' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MIcon name={s.icon} size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#101828', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#667085', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MIcon name="search" size={14} color="#98A2B3" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' } as any} />
          <input
            type="text" placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, background: '#fff', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
        >
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r._id} value={r.name}>{r.name}</option>)}
        </select>
        <button
          onClick={() => { setEditingAdmin(null); setModalOpen(true); }}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#6750A4,#7F56D9)', color: '#fff',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 3px 10px rgba(103,80,164,0.25)',
          }}
        >
          <MIcon name="person_add" size={16} color="#fff" /> Add Admin
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#667085', background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC' }}>
          <MIcon name="progress_activity" size={28} color="#6750A4" style={{ animation: 'spin 1s linear infinite' } as any} />
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Loading admins...</div>
        </div>
      ) : admins.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '2px dashed #D6BBFB', borderRadius: 14 }}>
          <MIcon name="group_off" size={36} color="#6750A4" />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: '#101828' }}>No admins found</h3>
          <p style={{ margin: 0, fontSize: 12, color: '#667085' }}>Create your first admin user to get started</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Admin', 'Role', 'Department', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 10,
                    color: '#667085', fontWeight: 700, textTransform: 'uppercase',
                    borderBottom: '1px solid #E4E7EC', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const adminId = getAdminId(a);
                const badge = getRoleBadgeClass(a.role);
                return (
                  <tr key={adminId || Math.random()} className="row-h" style={{ borderBottom: '1px solid #F2F4F7', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#6750A4,#7F56D9)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 800, fontSize: 13,
                        }}>
                          {a.name ? a.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: '#667085' }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, ...parseBadgeClass(badge) }}>
                        {a.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#475467' }}>{a.department || 'General'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: a.isActive ? '#D1FADF' : '#FEE4E2',
                        color: a.isActive ? '#027A48' : '#B42318',
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: a.isActive ? '#12B76A' : '#F04438' }} />
                        {a.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#667085' }}>
                      {a.lastLoginAt ? (
                        <>
                          <div style={{ fontWeight: 600, color: '#344054' }}>{new Date(a.lastLoginAt).toLocaleDateString('en-IN')}</div>
                          <div style={{ fontSize: 9, color: '#98A2B3' }}>
                            {new Date(a.lastLoginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {a.loginCount || 0} logins
                          </div>
                        </>
                      ) : 'Never'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditingAdmin({ ...a, id: adminId }); setModalOpen(true); }} title="Edit" style={{ padding: 5, background: '#F4F3FF', border: '1px solid #E8DEF8', borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                          <MIcon name="edit" size={12} color="#6750A4" />
                        </button>
                        <button onClick={() => setResetPwdFor({ ...a, id: adminId })} title="Reset password" style={{ padding: 5, background: '#FEF6EE', border: '1px solid #FDDCAB', borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                          <MIcon name="lock_reset" size={12} color="#B54708" />
                        </button>
                        <button onClick={() => handleToggle({ ...a, id: adminId })} title={a.isActive ? 'Deactivate' : 'Activate'} style={{ padding: 5, background: a.isActive ? '#FEF3F2' : '#ECFDF3', border: `1px solid ${a.isActive ? '#FECDCA' : '#A6F4C5'}`, borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                          <MIcon name={a.isActive ? 'block' : 'check_circle'} size={12} color={a.isActive ? '#B42318' : '#027A48'} />
                        </button>
                        <button onClick={() => handleDelete({ ...a, id: adminId })} title="Delete" style={{ padding: 5, background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                          <MIcon name="delete" size={12} color="#B42318" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <AdminFormModal
          admin={editingAdmin}
          roles={roles}
          onClose={() => { setModalOpen(false); setEditingAdmin(null); }}
          onSuccess={(msg) => { onSuccess(msg); setModalOpen(false); setEditingAdmin(null); fetchData(); }}
          onError={onError}
        />
      )}
      {resetPwdFor && (
        <PasswordResetModal
          admin={resetPwdFor}
          onClose={() => setResetPwdFor(null)}
          onSuccess={(msg) => { onSuccess(msg); setResetPwdFor(null); }}
          onError={onError}
        />
      )}
    </div>
  );
};
const RolesTab: React.FC<{ onSuccess: (m: string) => void; onError: (m: string) => void }> = ({
  onSuccess, onError,
}) => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<NavItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roleApi.getAllRoles();
      if (res.success) setRoles(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleSelectRole = (role: CustomRole) => {
    setSelectedRole(role);
    setEditingPermissions([...role.permissions]);
  };

  const handleTogglePermission = (permId: NavItem) => {
    if (selectedRole?.name === 'Super Admin') return;
    setEditingPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = (group: string) => {
    if (selectedRole?.name === 'Super Admin') return;
    const groupPerms = PERMISSION_META.filter(p => p.group === group).map(p => p.id);
    const allSelected = groupPerms.every(p => editingPermissions.includes(p));
    if (allSelected) {
      setEditingPermissions(prev => prev.filter(p => !groupPerms.includes(p)));
    } else {
      setEditingPermissions(prev => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if (editingPermissions.length === 0) { onError('Role must have at least one permission'); return; }
    setSaving(true);
    try {
      const res = await roleApi.updateRole(selectedRole._id, { permissions: editingPermissions });
      if (res.success) {
        onSuccess(`Permissions updated for "${selectedRole.name}"`);
        fetchRoles();
        setSelectedRole({ ...selectedRole, permissions: editingPermissions });
      } else {
        onError(res.message);
      }
    } catch (err: any) { onError(err.message); }
    finally { setSaving(false); }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.isSystem) { onError('System roles cannot be deleted'); return; }
    if (!window.confirm(`Delete role "${role.name}"?\n\nThis cannot be undone.`)) return;
    try {
      const res = await roleApi.deleteRole(role._id);
      if (res.success) {
        onSuccess(res.message);
        if (selectedRole?._id === role._id) setSelectedRole(null);
        fetchRoles();
      } else { onError(res.message); }
    } catch (err: any) { onError(err.message); }
  };

  const groups = ['Overview', 'Management', 'Operations', 'System'] as const;
  const hasChanges = selectedRole
    && JSON.stringify([...editingPermissions].sort()) !== JSON.stringify([...selectedRole.permissions].sort());

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#667085', background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC' }}>
        <MIcon name="progress_activity" size={28} color="#6750A4" style={{ animation: 'spin 1s linear infinite' } as any} />
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Loading roles...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16, animation: 'slideUp 0.25s ease', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* LEFT PANEL: Role List */}
      <div style={{ width: 320, minWidth: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#101828' }}>
            All Roles ({roles.length})
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '6px 12px', borderRadius: 7, border: 'none',
              background: 'linear-gradient(135deg,#6750A4,#7F56D9)', color: '#fff',
              fontWeight: 700, fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              boxShadow: '0 2px 8px rgba(103,80,164,0.2)',
            }}
          >
            <MIcon name="add" size={14} color="#fff" /> New Role
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', paddingRight: 4 }}>
          {roles.map(role => {
            const isSelected = selectedRole?._id === role._id;
            return (
              <div
                key={role._id}
                className="role-card"
                onClick={() => handleSelectRole(role)}
                style={{
                  padding: '12px 14px', borderRadius: 10,
                  border: isSelected ? `2px solid ${role.color}` : '1px solid #E4E7EC',
                  background: isSelected ? `${role.color}08` : '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: `${role.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MIcon name={role.icon} size={18} color={role.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>{role.name}</span>
                    {role.isSystem && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                        background: '#F4F3FF', color: '#6750A4', border: '1px solid #E8DEF8',
                      }}>SYSTEM</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#667085', marginTop: 2 }}>
                    {role.permissions.length} permissions · {role.userCount || 0} users
                  </div>
                </div>
                {isSelected && <MIcon name="chevron_right" size={18} color={role.color} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Permission Editor */}
      <div style={{ flex: 1, minWidth: 400 }}>
        {!selectedRole ? (
          <div style={{
            padding: 60, textAlign: 'center', background: '#fff',
            border: '2px dashed #E4E7EC', borderRadius: 14,
          }}>
            <MIcon name="touch_app" size={40} color="#D0D5DD" />
            <h3 style={{ margin: '12px 0 4px', fontSize: 16, color: '#667085', fontWeight: 700 }}>Select a Role</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#98A2B3' }}>
              Click on a role from the left panel to view and edit its permissions
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeIn 0.2s ease' }}>
            {/* Role Header Card */}
            <div style={{
              padding: '16px 18px', background: '#fff', borderRadius: 12,
              border: '1px solid #E4E7EC', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: `${selectedRole.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MIcon name={selectedRole.icon} size={24} color={selectedRole.color} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>
                      {selectedRole.name}
                    </h2>
                    {selectedRole.isSystem && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
                        background: '#F4F3FF', color: '#6750A4', border: '1px solid #E8DEF8',
                      }}>PROTECTED</span>
                    )}
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#667085' }}>
                    {selectedRole.description || 'No description'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {hasChanges && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#D97706', background: '#FFFBEB',
                    padding: '3px 8px', borderRadius: 6, border: '1px solid #FDE68A',
                  }}>Unsaved changes</span>
                )}
                {!selectedRole.isSystem && (
                  <button
                    onClick={() => handleDeleteRole(selectedRole)}
                    style={{
                      padding: '7px 12px', borderRadius: 7, border: '1px solid #FECDCA',
                      background: '#FEF3F2', color: '#B42318', fontWeight: 700,
                      fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <MIcon name="delete" size={14} color="#B42318" /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Permission Progress Bar */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px',
              background: '#F9FAFB', borderRadius: 8, border: '1px solid #E4E7EC',
            }}>
              <MIcon name="tune" size={16} color="#6750A4" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#344054' }}>
                {editingPermissions.length} of {PERMISSION_META.length} sections enabled
              </span>
              <div style={{ flex: 1, height: 4, background: '#E4E7EC', borderRadius: 2, overflow: 'hidden', marginLeft: 8 }}>
                <div style={{
                  width: `${(editingPermissions.length / PERMISSION_META.length) * 100}%`,
                  height: '100%', background: 'linear-gradient(90deg,#6750A4,#7F56D9)',
                  borderRadius: 2, transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {/* Permission Groups */}
            {groups.map(group => {
              const groupPerms = PERMISSION_META.filter(p => p.group === group);
              const colors = GROUP_COLORS[group];
              const selectedCount = groupPerms.filter(p => editingPermissions.includes(p.id)).length;
              const allSelected = selectedCount === groupPerms.length;

              return (
                <div key={group} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC', overflow: 'hidden' }}>
                  {/* Group Header */}
                  <div
                    onClick={() => handleSelectAll(group)}
                    style={{
                      padding: '10px 16px', background: colors.bg,
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: selectedRole.name === 'Super Admin' ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {group}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: colors.text, opacity: 0.7 }}>
                        {selectedCount}/{groupPerms.length}
                      </span>
                    </div>
                    {selectedRole.name !== 'Super Admin' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: colors.text }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `2px solid ${allSelected ? colors.accent : colors.border}`,
                          background: allSelected ? colors.accent : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}>
                          {allSelected && <MIcon name="check" size={12} color="#fff" />}
                        </div>
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </div>
                    )}
                  </div>

                  {/* Permission Cards Grid */}
                  <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                    {groupPerms.map(perm => {
                      const isChecked = editingPermissions.includes(perm.id);
                      const isDisabled = selectedRole.name === 'Super Admin';
                      return (
                        <div
                          key={perm.id}
                          className="perm-card"
                          onClick={() => !isDisabled && handleTogglePermission(perm.id)}
                          style={{
                            padding: '10px 12px', borderRadius: 8,
                            border: isChecked ? `1.5px solid ${colors.accent}` : '1.5px solid #E4E7EC',
                            background: isChecked ? `${colors.accent}08` : '#FAFAFA',
                            cursor: isDisabled ? 'default' : 'pointer',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            opacity: isDisabled ? 0.8 : 1,
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0,
                            border: isChecked ? `2px solid ${colors.accent}` : '2px solid #D0D5DD',
                            background: isChecked ? colors.accent : '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}>
                            {isChecked && <MIcon name="check" size={13} color="#fff" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <MIcon name={perm.icon} size={14} color={isChecked ? colors.accent : '#98A2B3'} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: isChecked ? '#101828' : '#475467' }}>
                                {perm.label}
                              </span>
                              {perm.critical && (
                                <span style={{
                                  fontSize: 8, fontWeight: 800, padding: '1px 4px',
                                  borderRadius: 3, background: '#FEF3F2', color: '#B42318',
                                }}>CRITICAL</span>
                              )}
                            </div>
                            <p style={{ margin: '3px 0 0', fontSize: 10, color: '#98A2B3', lineHeight: 1.4 }}>
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Sticky Save Bar */}
            {hasChanges && (
              <div style={{
                position: 'sticky', bottom: 16, padding: '12px 18px',
                background: '#fff', borderRadius: 12, border: '2px solid #6750A4',
                boxShadow: '0 8px 24px rgba(103,80,164,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                animation: 'slideUp 0.2s ease',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6750A4' }}>
                  <MIcon name="info" size={14} color="#6750A4" />{' '}
                  {editingPermissions.length} permissions will be applied to all "{selectedRole.name}" users
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setEditingPermissions([...selectedRole.permissions])}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: '1.5px solid #D0D5DD',
                      background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}
                  >Discard</button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    style={{
                      padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: saving ? '#B0A0D8' : 'linear-gradient(135deg,#6750A4,#7F56D9)',
                      color: '#fff', fontWeight: 700, fontSize: 12,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                      boxShadow: '0 3px 10px rgba(103,80,164,0.25)',
                    }}
                  >
                    <MIcon name={saving ? 'progress_activity' : 'save'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } as any : {}} />
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(msg) => { onSuccess(msg); setShowCreateModal(false); fetchRoles(); }}
          onError={onError}
        />
      )}
    </div>
  );
};

const CreateRoleModal: React.FC<{
  onClose: () => void; onSuccess: (m: string) => void; onError: (m: string) => void;
}> = ({ onClose, onSuccess, onError }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<NavItem[]>([]);
  const [color, setColor] = useState(ROLE_COLORS[0]);
  const [icon, setIcon] = useState(ROLE_ICONS[0]);
  const [saving, setSaving] = useState(false);

  const togglePerm = (id: NavItem) => {
    setPermissions(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { onError('Role name is required'); return; }
    if (permissions.length === 0) { onError('Select at least one permission'); return; }
    setSaving(true);
    try {
      const res = await roleApi.createRole({
        name: name.trim(), description, permissions, color, icon, landingPage: permissions[0],
      });
      if (res.success) onSuccess(res.message);
      else onError(res.message);
    } catch (err: any) { onError(err.message); }
    finally { setSaving(false); }
  };

  const groups = ['Overview', 'Management', 'Operations', 'System'] as const;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 640, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid #E4E7EC',
          background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#6750A4,#7F56D9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MIcon name="shield" size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>Create New Role</h2>
              <p style={{ margin: 0, fontSize: 10, color: '#667085' }}>Define name, appearance & section access</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'flex' }}>
            <MIcon name="close" size={18} color="#667085" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 }}>Role Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HR Manager" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0D5DD', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 }}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this role do?" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D0D5DD', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 6 }}>Color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ROLE_COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{
                    width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer',
                    border: color === c ? '3px solid #101828' : '2px solid transparent', transition: 'all 0.1s',
                  }} />
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 6 }}>Icon</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {ROLE_ICONS.map(ic => (
                  <div key={ic} onClick={() => setIcon(ic)} style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: icon === ic ? `${color}18` : '#F2F4F7', cursor: 'pointer',
                    border: icon === ic ? `2px solid ${color}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s',
                  }}>
                    <MIcon name={ic} size={16} color={icon === ic ? color : '#667085'} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {name.trim() && (
            <div style={{
              padding: '10px 14px', background: `${color}08`, border: `1px solid ${color}30`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MIcon name={icon} size={18} color={color} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>{name}</span>
              <span style={{ fontSize: 10, color: '#667085' }}>{permissions.length} permissions selected</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 8 }}>
              Section Access * <span style={{ fontWeight: 500, color: '#98A2B3' }}>(click to toggle)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {groups.map(group => {
                const gPerms = PERMISSION_META.filter(p => p.group === group);
                const colors = GROUP_COLORS[group];
                return (
                  <div key={group}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, marginTop: 6 }}>
                      {group}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {gPerms.map(perm => {
                        const isChecked = permissions.includes(perm.id);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePerm(perm.id)}
                            style={{
                              padding: '6px 8px', borderRadius: 6,
                              border: isChecked ? `1.5px solid ${colors.accent}` : '1.5px solid #E4E7EC',
                              background: isChecked ? `${colors.accent}08` : '#FAFAFA',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                              fontSize: 11, fontWeight: 600,
                              color: isChecked ? '#101828' : '#667085', transition: 'all 0.1s',
                            }}
                          >
                            <div style={{
                              width: 14, height: 14, borderRadius: 3,
                              border: isChecked ? `2px solid ${colors.accent}` : '2px solid #D0D5DD',
                              background: isChecked ? colors.accent : '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              {isChecked && <MIcon name="check" size={10} color="#fff" />}
                            </div>
                            <MIcon name={perm.icon} size={13} color={isChecked ? colors.accent : '#98A2B3'} />
                            {perm.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid #E4E7EC',
          background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #D0D5DD', background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || permissions.length === 0}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: saving || !name.trim() || permissions.length === 0 ? '#B0A0D8' : 'linear-gradient(135deg,#6750A4,#7F56D9)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <MIcon name={saving ? 'progress_activity' : 'shield'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } as any : {}} />
            {saving ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminFormModal: React.FC<{
  admin: AdminUserPayload | null; roles: CustomRole[];
  onClose: () => void; onSuccess: (m: string) => void; onError: (m: string) => void;
}> = ({ admin, roles, onClose, onSuccess, onError }) => {
  const adminId = admin ? getAdminId(admin) : '';
  const isEdit = !!adminId;

  const [form, setForm] = useState({
    name: admin?.name || '',
    email: admin?.email || '',
    password: '',
    role: admin?.role || (roles.length > 0 ? roles.find(r => !r.isSystem)?.name || 'Admin' : 'Admin'),
    department: admin?.department || '',
    phone: admin?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (!isEdit && (!form.password || form.password.length < 6)) e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = isEdit
        ? await adminApi.updateAdmin(adminId, { name: form.name, role: form.role, department: form.department, phone: form.phone })
        : await adminApi.createAdmin(form as AdminUserPayload);
      if (res.success) onSuccess(res.message);
      else onError(res.message);
    } catch (err: any) { onError(err.message); }
    finally { setSaving(false); }
  };

  const inp = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '9px 12px',
    border: `1.5px solid ${err ? '#F04438' : '#D0D5DD'}`,
    borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box',
  });
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 };

  const roleOptions = roles.length > 0
    ? roles
    : [{ name: 'Super Admin' }, { name: 'Admin' }, { name: 'Moderator' }, { name: 'Support Agent' }, { name: 'Content Manager' }, { name: 'Finance Manager' }] as any[];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '16px 22px', borderBottom: '1px solid #E4E7EC',
          background: '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#6750A4,#7F56D9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MIcon name={isEdit ? 'edit' : 'person_add'} size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>
                {isEdit ? `Edit: ${admin?.name}` : 'Create New Admin User'}
              </h2>
              <p style={{ margin: 0, fontSize: 10, color: '#667085' }}>Assign role and permissions</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 6, padding: 6, cursor: 'pointer', display: 'flex' }}>
            <MIcon name="close" size={18} color="#667085" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={lbl}>Full Name *</label>
            <input type="text" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }} placeholder="Bhavuk Deshmukh" style={inp(errors.name)} />
            {errors.name && <p style={{ margin: '3px 0 0', fontSize: 10, color: '#F04438', fontWeight: 600 }}>{errors.name}</p>}
          </div>

          <div>
            <label style={lbl}>Email {isEdit && '(cannot change)'}</label>
            <input
              type="email" value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }); }}
              placeholder="admin@careerflow.com" disabled={isEdit}
              style={{ ...inp(errors.email), background: isEdit ? '#F9FAFB' : '#fff' }}
            />
            {errors.email && <p style={{ margin: '3px 0 0', fontSize: 10, color: '#F04438', fontWeight: 600 }}>{errors.email}</p>}
          </div>

          {!isEdit && (
            <div>
              <label style={lbl}>Password * (min 6 chars)</label>
              <input
                type="text" value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }); }}
                placeholder="Auto-generate or type" style={inp(errors.password)}
              />
              <p style={{ margin: '3px 0 0', fontSize: 10, color: '#667085' }}>Share this password securely with the new admin</p>
              {errors.password && <p style={{ margin: '3px 0 0', fontSize: 10, color: '#F04438', fontWeight: 600 }}>{errors.password}</p>}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Role *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inp()}>
                {roleOptions.map((r: any) => (
                  <option key={r.name} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Department</label>
              <input
                type="text" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="Operations" style={inp()}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98765 43210" style={inp()}
            />
          </div>

          <div style={{
            padding: 10, background: '#F4F3FF', border: '1px solid #E8DEF8',
            borderRadius: 8, fontSize: 11, color: '#53389F', display: 'flex', gap: 6,
          }}>
            <MIcon name="info" size={14} color="#53389F" />
            <span>{ROLE_METADATA[form.role]?.description || 'Custom role — permissions managed in the "Manage Roles" tab'}</span>
          </div>
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid #E4E7EC',
          background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onClose} disabled={saving}
            style={{
              padding: '9px 18px', borderRadius: 8, border: '1.5px solid #D0D5DD',
              background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit} disabled={saving}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: saving ? '#B0A0D8' : 'linear-gradient(135deg,#6750A4,#7F56D9)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <MIcon name={saving ? 'progress_activity' : 'save'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } as any : {}} />
            {saving ? 'Saving...' : isEdit ? 'Update Admin' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordResetModal: React.FC<{
  admin: AdminUserPayload; onClose: () => void;
  onSuccess: (m: string) => void; onError: (m: string) => void;
}> = ({ admin, onClose, onSuccess, onError }) => {
  const adminId = getAdminId(admin);
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = async () => {
    if (!adminId) { onError('Cannot identify admin. Missing ID.'); return; }
    if (pwd.length < 6) { onError('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      const res = await adminApi.resetAdminPassword(adminId, pwd);
      if (res.success) onSuccess(res.message);
      else onError(res.message);
    } catch (err: any) { onError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)',
        backdropFilter: 'blur(6px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          padding: '16px 22px', background: '#FEF6EE',
          borderBottom: '1px solid #FDDCAB', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#B54708,#D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MIcon name="lock_reset" size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>Reset Password</h2>
            <p style={{ margin: 0, fontSize: 11, color: '#B54708' }}>For {admin.name} ({admin.email})</p>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 }}>
            New Password (min 6 characters)
          </label>
          <input
            type="text" value={pwd} onChange={e => setPwd(e.target.value)}
            placeholder="e.g. TempPass@2026" autoFocus
            style={{
              width: '100%', padding: '10px 12px', border: '1.5px solid #D0D5DD',
              borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#B54708', display: 'flex', gap: 4 }}>
            <MIcon name="warning" size={13} color="#B54708" />
            Share this password securely — admin should change on first login.
          </p>
        </div>

        <div style={{
          padding: '14px 22px', borderTop: '1px solid #E4E7EC',
          background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <button
            onClick={onClose} disabled={saving}
            style={{
              padding: '9px 18px', borderRadius: 8, border: '1.5px solid #D0D5DD',
              background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleReset} disabled={saving || pwd.length < 6}
            style={{
              padding: '9px 22px', borderRadius: 8, border: 'none',
              background: saving || pwd.length < 6 ? '#B0A0D8' : 'linear-gradient(135deg,#B54708,#D97706)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: saving || pwd.length < 6 ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
          >
            <MIcon name={saving ? 'progress_activity' : 'lock_reset'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } as any : {}} />
            {saving ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissionsView;