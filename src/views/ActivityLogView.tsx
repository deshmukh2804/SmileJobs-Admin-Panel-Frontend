// FILE: frontend/src/views/ActivityLogView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../services/api';

const MIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 18, color }) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1, verticalAlign: 'middle' }}>{name}</span>
);

const CATEGORY_META: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  auth: { color: '#2563EB', bg: '#DBEAFE', icon: 'login', label: 'Auth' },
  admin: { color: '#7C3AED', bg: '#F4F3FF', icon: 'admin_panel_settings', label: 'Admin' },
  job: { color: '#059669', bg: '#D1FADF', icon: 'work', label: 'Job' },
  banner: { color: '#DC2626', bg: '#FEE4E2', icon: 'view_carousel', label: 'Banner' },
  subscription: { color: '#B54708', bg: '#FEF0C7', icon: 'credit_card', label: 'Plan' },
  user: { color: '#0891B2', bg: '#CFFAFE', icon: 'person', label: 'User' },
  verification: { color: '#D97706', bg: '#FEF6EE', icon: 'verified', label: 'Verify' },
  system: { color: '#667085', bg: '#F2F4F7', icon: 'settings', label: 'System' },
};

const STATUS_META: Record<string, { color: string; bg: string; icon: string }> = {
  success: { color: '#027A48', bg: '#D1FADF', icon: 'check_circle' },
  failed: { color: '#B42318', bg: '#FEE4E2', icon: 'error' },
  warning: { color: '#B54708', bg: '#FEF0C7', icon: 'warning' },
};

interface AuditLog {
  _id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  category: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  changesBefore?: any;
  changesAfter?: any;
  description: string;
  ipAddress: string;
  userAgent: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export const ActivityLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, today: 0, failed: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await auditApi.getLogs(params);
      if (res.success) { setLogs(res.data); setStats(res.stats); }
      else setError(res.message);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [filterCategory, filterStatus, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .log-row { transition: background 0.15s; cursor: pointer; } .log-row:hover { background: #F9FAFB; }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid #E4E7EC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6750A4,#7F56D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(103,80,164,0.25)' }}>
            <MIcon name="history" size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#101828' }}>Admin Activity Log</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#667085' }}>Complete audit trail — who did what and when</p>
          </div>
        </div>
        <button onClick={fetchLogs} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E4E7EC', background: '#fff', color: '#344054', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><MIcon name="refresh" size={14} /> Refresh</button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, color: '#B42318', fontWeight: 600, fontSize: 12 }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Events', value: stats.total, icon: 'timeline', color: '#6750A4', bg: '#F4F3FF' },
          { label: 'Today', value: stats.today, icon: 'today', color: '#027A48', bg: '#ECFDF3' },
          { label: 'Failed Actions', value: stats.failed, icon: 'error', color: '#B42318', bg: '#FEE4E2' },
          { label: 'Auth Events', value: stats.byCategory?.auth || 0, icon: 'login', color: '#2563EB', bg: '#DBEAFE' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MIcon name={s.icon} size={18} color={s.color} /></div>
            <div><div style={{ fontSize: 18, fontWeight: 800, color: '#101828' }}>{s.value}</div><div style={{ fontSize: 10, color: '#667085', fontWeight: 600 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <MIcon name="search" size={14} color="#98A2B3" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' } as any} />
          <input type="text" placeholder="Search admin, description, target..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          <option value="all">All Categories</option>
          {Object.keys(CATEGORY_META).map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {/* Logs */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#667085', background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC' }}>
          <MIcon name="progress_activity" size={28} color="#6750A4" style={{ animation: 'spin 1s linear infinite' } as any} />
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Loading audit trail...</div>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '2px dashed #D6BBFB', borderRadius: 14 }}>
          <MIcon name="history_toggle_off" size={36} color="#6750A4" />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: '#101828' }}>No activity yet</h3>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
          {logs.map((log) => {
            const cat = CATEGORY_META[log.category] || CATEGORY_META.system;
            const st = STATUS_META[log.status] || STATUS_META.success;
            const isExpanded = expanded === log._id;
            return (
              <div key={log._id} style={{ borderBottom: '1px solid #F2F4F7' }}>
                <div className="log-row" onClick={() => setExpanded(isExpanded ? null : log._id)} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MIcon name={cat.icon} size={18} color={cat.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: cat.bg, color: cat.color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>{cat.label}</span>
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}><MIcon name={st.icon} size={9} color={st.color} />{log.status.toUpperCase()}</span>
                      <span style={{ fontSize: 10, color: '#667085', fontFamily: 'monospace', background: '#F2F4F7', padding: '1px 6px', borderRadius: 3 }}>{log.action}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#101828', fontWeight: 600, lineHeight: 1.4 }}>{log.description || log.action}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 10, color: '#667085', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MIcon name="person" size={11} color="#667085" /><strong style={{ color: '#344054' }}>{log.adminName}</strong> ({log.adminRole})</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MIcon name="schedule" size={11} color="#667085" />{formatTime(log.createdAt)}</span>
                      {log.ipAddress && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MIcon name="location_on" size={11} color="#667085" />{log.ipAddress}</span>}
                      {log.targetName && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MIcon name="my_location" size={11} color="#667085" />Target: <strong style={{ color: '#344054' }}>{log.targetName}</strong></span>}
                    </div>
                  </div>
                  {(log.changesBefore || log.changesAfter) && (
                    <MIcon name={isExpanded ? 'expand_less' : 'expand_more'} size={18} color="#667085" style={{ marginTop: 8 } as any} />
                  )}
                </div>
                {isExpanded && (log.changesBefore || log.changesAfter) && (
                  <div style={{ padding: '10px 16px 14px 64px', background: '#FAFAFA', borderTop: '1px solid #F2F4F7', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#B42318', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>❌ Before</div>
                      <pre style={{ margin: 0, padding: 10, background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 6, fontSize: 10, color: '#B42318', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.changesBefore ? JSON.stringify(log.changesBefore, null, 2) : '(no data)'}</pre>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#027A48', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>✅ After</div>
                      <pre style={{ margin: 0, padding: 10, background: '#ECFDF3', border: '1px solid #A6F4C5', borderRadius: 6, fontSize: 10, color: '#027A48', overflow: 'auto', maxHeight: 200, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.changesAfter ? JSON.stringify(log.changesAfter, null, 2) : '(no data)'}</pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivityLogView;