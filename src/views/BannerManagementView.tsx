// FILE: frontend/src/views/BannerManagementView.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { bannerApi } from '../services/api';

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */
interface BannerImage {
  url: string;
  publicId?: string;
}

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: BannerImage;
  images?: BannerImage[];
  mobileImage?: BannerImage;
  linkUrl?: string;
  linkType: 'external' | 'internal' | 'deep_link' | 'none';
  ctaLabel: string;
  openInNewTab: boolean;
  priority: number;
  slot: number;
  platform: string[];
  targetAudience: string;
  placement: string;
  category: string;
  tags: string[];
  startDate?: string;
  endDate?: string;
  status: 'draft' | 'scheduled' | 'live' | 'paused' | 'expired' | 'archived';
  isActive: boolean;
  impressions: number;
  clicks: number;
  ctr: number;
  variant: string;
  experimentId?: string;
  backgroundColor: string;
  textColor: string;
  overlayOpacity: number;
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
}

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────────────────────── */
const MAX_BANNERS_PER_PLACEMENT = 5;
const MAX_IMAGES_PER_BANNER = 5;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

const PLACEMENT_OPTIONS = [
  { value: 'home_hero', label: 'Home Hero', icon: 'home' },
  { value: 'home_middle', label: 'Home Middle', icon: 'place' },
  { value: 'job_listing_top', label: 'Job Top', icon: 'work' },
  { value: 'job_listing_sidebar', label: 'Job Sidebar', icon: 'view_sidebar' },
  { value: 'profile_page', label: 'Profile', icon: 'person' },
  { value: 'app_splash', label: 'Splash', icon: 'smartphone' },
  { value: 'notification_popup', label: 'Popup', icon: 'notifications' },
];

const CATEGORY_OPTIONS = [
  { value: 'promotional', label: 'Promotional', color: '#6750A4' },
  { value: 'campus_drive', label: 'Campus Drive', color: '#2563EB' },
  { value: 'hackathon', label: 'Hackathon', color: '#DC2626' },
  { value: 'premium_upgrade', label: 'Premium', color: '#D97706' },
  { value: 'new_feature', label: 'Feature', color: '#059669' },
  { value: 'partner_spotlight', label: 'Partner', color: '#7C3AED' },
  { value: 'seasonal', label: 'Seasonal', color: '#DB2777' },
  { value: 'announcement', label: 'Announce', color: '#0891B2' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string; gradient: string }> = {
  draft: { color: '#667085', bg: '#F2F4F7', label: 'Draft', icon: 'edit_note', gradient: 'linear-gradient(135deg,#667085,#475467)' },
  scheduled: { color: '#B54708', bg: '#FEF0C7', label: 'Scheduled', icon: 'schedule', gradient: 'linear-gradient(135deg,#B54708,#D97706)' },
  live: { color: '#027A48', bg: '#D1FADF', label: 'Live', icon: 'radio_button_checked', gradient: 'linear-gradient(135deg,#027A48,#12B76A)' },
  paused: { color: '#B42318', bg: '#FEF3F2', label: 'Paused', icon: 'pause_circle', gradient: 'linear-gradient(135deg,#B42318,#F04438)' },
  expired: { color: '#98A2B3', bg: '#F9FAFB', label: 'Expired', icon: 'hourglass_disabled', gradient: 'linear-gradient(135deg,#98A2B3,#667085)' },
  archived: { color: '#475467', bg: '#EAECF0', label: 'Archived', icon: 'archive', gradient: 'linear-gradient(135deg,#475467,#344054)' },
};

/* ─────────────────────────────────────────────────────────────
   ICON + UTILITY
   ───────────────────────────────────────────────────────────── */
const Icon: React.FC<{ name: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  name, size = 18, color, style,
}) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1, verticalAlign: 'middle', userSelect: 'none', ...style }}>
    {name}
  </span>
);

const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP, or GIF allowed';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return `Max ${MAX_IMAGE_SIZE_MB}MB (yours: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  if (file.size === 0) return 'File is empty';
  return null;
};

/* ═══════════════════════════════════════════════════════════
   MAIN BANNER MANAGEMENT VIEW
   ═══════════════════════════════════════════════════════════ */
export const BannerManagementView: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState({ totalImpressions: 0, totalClicks: 0, totalBanners: 0, liveCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'reorder'>('grid');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [reordering, setReordering] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPlacement !== 'all') params.placement = filterPlacement;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const response = await bannerApi.getBanners(params);
      if (response.success) {
        setBanners(response.data.banners || []);
        setStats(response.data.stats || { totalImpressions: 0, totalClicks: 0, totalBanners: 0, liveCount: 0 });
      } else {
        setError(response.message || 'Failed to load banners');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlacement, filterCategory, searchQuery]);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3500); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 6000); return () => clearTimeout(t); } }, [error]);

  const bannersByPlacement = useMemo(() => {
    const map: Record<string, Banner[]> = {};
    banners.forEach((b) => { if (!map[b.placement]) map[b.placement] = []; map[b.placement].push(b); });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.slot ?? 999) - (b.slot ?? 999)));
    return map;
  }, [banners]);

  const placementCount = (p: string) => bannersByPlacement[p]?.length || 0;
  const overallCTR = useMemo(() => stats.totalImpressions ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : '0.00', [stats]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner permanently?')) return;
    try { const res = await bannerApi.deleteBanner(id); if (res.success) { setSuccess('Banner deleted'); fetchBanners(); } else setError(res.message); } catch (err: any) { setError(err?.message); }
  };

  const handleToggleStatus = async (id: string) => {
    try { const res = await bannerApi.toggleStatus(id); if (res.success) { setSuccess(res.message || 'Status updated'); fetchBanners(); } else setError(res.message); } catch (err: any) { setError(err?.message); }
  };

  const handleBulkAction = async (action: 'activate' | 'pause' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.length} banner(s)?`)) return;
    try { const res = await bannerApi.bulkAction(selectedIds, action); if (res.success) { setSuccess(res.message); setSelectedIds([]); fetchBanners(); } else setError(res.message); } catch (err: any) { setError(err?.message); }
  };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleReorderSave = async (placement: string, orderedBanners: Banner[]) => {
    setReordering(true);
    try {
      const orders = orderedBanners.map((b, idx) => ({ id: b._id, slot: idx + 1, priority: orderedBanners.length - idx }));
      const res = await bannerApi.reorderBanners(orders);
      if (res?.success !== false) { setSuccess(`Reordered in "${placement}"`); fetchBanners(); } else setError(res.message);
    } catch (err: any) { setError(err?.message); } finally { setReordering(false); }
  };

  const handleCreateClick = () => {
    if (filterPlacement !== 'all' && placementCount(filterPlacement) >= MAX_BANNERS_PER_PLACEMENT) {
      setError(`Max ${MAX_BANNERS_PER_PLACEMENT} banners per placement.`); return;
    }
    setEditingBanner(null);
    setShowEditor(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .b-card { transition: all 0.25s ease; }
        .b-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important; }
        .b-btn:hover { transform: translateY(-1px); }
      `}</style>

      {/* ═══ HEADER (Matches Subscription Style) ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid #E4E7EC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6750A4,#7F56D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(103,80,164,0.25)' }}>
            <Icon name="view_carousel" size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#101828' }}>Banner Management</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#667085' }}>Max {MAX_BANNERS_PER_PLACEMENT}/placement · {MAX_IMAGES_PER_BANNER} images/banner</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchBanners} className="b-btn" style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E4E7EC', background: '#fff', color: '#344054', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
          <button onClick={handleCreateClick} className="b-btn" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6750A4,#7F56D9)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 3px 10px rgba(103,80,164,0.25)', transition: 'all 0.2s' }}>
            <Icon name="add_circle" size={16} color="#fff" /> Create Banner
          </button>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#B42318', fontWeight: 600, fontSize: 12, animation: 'slideDown 0.3s ease' }}>
          <Icon name="error" size={16} color="#B42318" /> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="close" size={14} color="#B42318" /></button>
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: '#ECFDF3', border: '1px solid #A6F4C5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#027A48', fontWeight: 600, fontSize: 12, animation: 'slideDown 0.3s ease' }}>
          <Icon name="check_circle" size={16} color="#027A48" /> <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="close" size={14} color="#027A48" /></button>
        </div>
      )}

      {/* ═══ ANALYTICS (Compact, matches subscription) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total Banners', value: stats.totalBanners, icon: 'dashboard', color: '#6750A4', bg: '#F4F3FF' },
          { label: 'Currently Live', value: stats.liveCount, icon: 'radio_button_checked', color: '#027A48', bg: '#ECFDF3' },
          { label: 'Impressions', value: stats.totalImpressions.toLocaleString('en-IN'), icon: 'visibility', color: '#2563EB', bg: '#DBEAFE' },
          { label: 'Clicks', value: `${stats.totalClicks.toLocaleString('en-IN')} (${overallCTR}%)`, icon: 'ads_click', color: '#DC2626', bg: '#FEE2E2' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={s.icon} size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#101828', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#667085', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ PLACEMENT CAPACITY (Compact chips) ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PLACEMENT_OPTIONS.map((p) => {
          const count = placementCount(p.value);
          const full = count >= MAX_BANNERS_PER_PLACEMENT;
          return (
            <div key={p.value} style={{
              padding: '5px 10px', borderRadius: 8,
              background: full ? '#FEF3F2' : count > 0 ? '#F4F3FF' : '#F9FAFB',
              border: `1px solid ${full ? '#FECDCA' : count > 0 ? '#D6BBFB' : '#E4E7EC'}`,
              fontSize: 10, fontWeight: 700,
              color: full ? '#B42318' : count > 0 ? '#53389F' : '#667085',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name={p.icon} size={12} color={full ? '#B42318' : count > 0 ? '#53389F' : '#667085'} />
              {p.label}
              <span style={{ padding: '1px 5px', borderRadius: 10, background: full ? '#F04438' : count > 0 ? '#6750A4' : '#D0D5DD', color: '#fff', fontSize: 9 }}>
                {count}/{MAX_BANNERS_PER_PLACEMENT}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══ FILTER BAR (Compact) ═══ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Icon name="search" size={14} color="#98A2B3" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Search banners..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {[
          { val: filterStatus, set: setFilterStatus, opts: [{ value: 'all', label: 'All Status' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))] },
          { val: filterPlacement, set: setFilterPlacement, opts: [{ value: 'all', label: 'All Placement' }, ...PLACEMENT_OPTIONS.map(p => ({ value: p.value, label: p.label }))] },
          { val: filterCategory, set: setFilterCategory, opts: [{ value: 'all', label: 'All Category' }, ...CATEGORY_OPTIONS.map(c => ({ value: c.value, label: c.label }))] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={(e) => f.set(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 11, background: '#fff', cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
            {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <div style={{ display: 'inline-flex', border: '1px solid #E4E7EC', borderRadius: 8, overflow: 'hidden' }}>
          {([
            { m: 'grid' as const, icon: 'grid_view' },
            { m: 'list' as const, icon: 'view_list' },
            { m: 'reorder' as const, icon: 'swap_vert' },
          ]).map(({ m, icon }) => (
            <button key={m} onClick={() => setViewMode(m)} style={{
              padding: '6px 10px', border: 'none', cursor: 'pointer',
              background: viewMode === m ? '#6750A4' : '#fff',
              color: viewMode === m ? '#fff' : '#475467',
              display: 'flex', alignItems: 'center',
            }}>
              <Icon name={icon} size={14} color={viewMode === m ? '#fff' : '#475467'} />
            </button>
          ))}
        </div>
      </div>

      {/* ═══ BULK ACTIONS ═══ */}
      {selectedIds.length > 0 && (
        <div style={{ padding: '8px 14px', background: '#F4F3FF', border: '1px solid #D6BBFB', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
          <span style={{ fontWeight: 700, color: '#53389F' }}>{selectedIds.length} selected</span>
          <div style={{ flex: 1 }} />
          {(['activate', 'pause', 'archive', 'delete'] as const).map(a => {
            const cfg = { activate: { c: '#12B76A', i: 'play_arrow' }, pause: { c: '#F79009', i: 'pause' }, archive: { c: '#667085', i: 'archive' }, delete: { c: '#F04438', i: 'delete' } }[a];
            return (
              <button key={a} onClick={() => handleBulkAction(a)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${cfg.c}`, background: '#fff', color: cfg.c, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name={cfg.i} size={11} color={cfg.c} /> {a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            );
          })}
          <button onClick={() => setSelectedIds([])} style={{ background: 'none', border: 'none', color: '#53389F', cursor: 'pointer', fontWeight: 600, fontSize: 10 }}>Clear</button>
        </div>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#667085', background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC' }}>
          <Icon name="progress_activity" size={28} color="#6750A4" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Loading banners...</div>
        </div>
      ) : banners.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '2px dashed #D6BBFB', borderRadius: 14 }}>
          <Icon name="view_carousel" size={36} color="#6750A4" />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: '#101828' }}>No banners yet</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#667085' }}>Create your first promotional banner</p>
          <button onClick={handleCreateClick} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6750A4', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="add" size={14} color="#fff" /> Create Banner
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {banners.map((banner) => (
            <CompactBannerCard
              key={banner._id}
              banner={banner}
              selected={selectedIds.includes(banner._id)}
              onToggleSelect={() => toggleSelect(banner._id)}
              onEdit={() => { setEditingBanner(banner); setShowEditor(true); }}
              onDelete={() => handleDelete(banner._id)}
              onToggleStatus={() => handleToggleStatus(banner._id)}
              onPreview={() => setPreviewBanner(banner)}
            />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <CompactBannerList
          banners={banners}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onEdit={(b) => { setEditingBanner(b); setShowEditor(true); }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
          onPreview={setPreviewBanner}
        />
      ) : (
        <BannerReorderView
          bannersByPlacement={bannersByPlacement}
          reordering={reordering}
          onSaveOrder={handleReorderSave}
        />
      )}

      {showEditor && (
        <BannerEditor
          banner={editingBanner}
          existingCountByPlacement={bannersByPlacement}
          onClose={() => { setShowEditor(false); setEditingBanner(null); }}
          onSuccess={(msg) => { setShowEditor(false); setEditingBanner(null); fetchBanners(); setSuccess(msg); }}
        />
      )}

      {previewBanner && <BannerPreview banner={previewBanner} onClose={() => setPreviewBanner(null)} />}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPACT BANNER CARD (Edit button made more visible)
   ═══════════════════════════════════════════════════════════ */
const CompactBannerCard: React.FC<{
  banner: Banner; selected: boolean;
  onToggleSelect: () => void; onEdit: () => void;
  onDelete: () => void; onToggleStatus: () => void; onPreview: () => void;
}> = ({ banner, selected, onToggleSelect, onEdit, onDelete, onToggleStatus, onPreview }) => {
  const st = STATUS_CONFIG[banner.status] || STATUS_CONFIG.draft;
  const cat = CATEGORY_OPTIONS.find(c => c.value === banner.category);
  const pl = PLACEMENT_OPTIONS.find(p => p.value === banner.placement);
  const imgCount = (banner.images?.length || 0) + (banner.image?.url ? 1 : 0);

  return (
    <div className="b-card" style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: selected ? '2px solid #6750A4' : '1px solid #E4E7EC',
      boxShadow: selected ? '0 4px 16px rgba(103,80,164,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Image Area */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/1', background: '#F2F4F7', overflow: 'hidden' }}>
        {banner.image?.url ? (
          <img src={banner.image.url} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={28} color="#D0D5DD" />
          </div>
        )}
        <div style={{ position: 'absolute', top: 6, left: 6 }}>
          <input type="checkbox" checked={selected} onChange={onToggleSelect} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#6750A4' }} />
        </div>
        <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 3, flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Icon name={st.icon} size={10} color={st.color} /> {st.label}
          </span>
          {imgCount > 1 && (
            <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(103,80,164,0.9)', color: '#fff', fontSize: 9, fontWeight: 700 }}>
              {imgCount} imgs
            </span>
          )}
        </div>
        <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
          <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {pl && <Icon name={pl.icon} size={10} color="#fff" />} #{banner.slot}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.title}</h3>
            {banner.subtitle && <p style={{ margin: '1px 0 0', fontSize: 10, color: '#667085', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{banner.subtitle}</p>}
          </div>
          <div style={{ display: 'flex', gap: 3, marginLeft: 6 }}>
            <button onClick={onEdit} title="Edit Banner" style={{ padding: 4, background: '#F4F3FF', border: '1px solid #E8DEF8', borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
              <Icon name="edit" size={11} color="#6750A4" />
            </button>
            <button onClick={onDelete} title="Delete Banner" style={{ padding: 4, background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
              <Icon name="delete" size={11} color="#B42318" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {cat && <span style={{ padding: '1px 5px', borderRadius: 3, background: `${cat.color}12`, color: cat.color, fontSize: 9, fontWeight: 700 }}>{cat.label}</span>}
          {pl && <span style={{ padding: '1px 5px', borderRadius: 3, background: '#F2F4F7', color: '#475467', fontSize: 9, fontWeight: 600 }}>{pl.label}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 6, background: '#F9FAFB', borderRadius: 6 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#98A2B3', fontWeight: 600 }}>Views</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#101828' }}>{banner.impressions.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#98A2B3', fontWeight: 600 }}>Clicks</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#101828' }}>{banner.clicks.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#98A2B3', fontWeight: 600 }}>CTR</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#027A48' }}>{(banner.ctr || 0).toFixed(1)}%</div>
          </div>
        </div>

        {banner.endDate && banner.daysRemaining != null && (
          <div style={{ fontSize: 9, color: banner.daysRemaining < 3 ? '#B42318' : '#667085', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Icon name="schedule" size={10} color={banner.daysRemaining < 3 ? '#B42318' : '#667085'} />
            {banner.daysRemaining === 0 ? 'Expires today' : `${banner.daysRemaining}d left`}
          </div>
        )}
      </div>

      {/* Footer Actions — Edit button added here as well for visibility */}
      <div style={{ padding: '8px 12px', background: '#FAFAFA', borderTop: '1px solid #E4E7EC', display: 'flex', gap: 4 }}>
        <button onClick={onPreview} style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: '1px solid #DBEAFE', background: '#EFF6FF', color: '#2563EB', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Icon name="visibility" size={11} color="#2563EB" /> View
        </button>
        <button onClick={onEdit} style={{ flex: 1, padding: '5px 0', borderRadius: 5, border: '1px solid #E8DEF8', background: '#F4F3FF', color: '#6750A4', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <Icon name="edit" size={11} color="#6750A4" /> Edit
        </button>
        <button onClick={onToggleStatus} style={{
          flex: 1, padding: '5px 0', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 3,
          background: banner.status === 'live' ? '#FEF0C7' : '#D1FADF',
          color: banner.status === 'live' ? '#B54708' : '#027A48',
          border: `1px solid ${banner.status === 'live' ? '#FEDF89' : '#A6F4C5'}`,
        }}>
          <Icon name={banner.status === 'live' ? 'pause' : 'play_arrow'} size={11} color={banner.status === 'live' ? '#B54708' : '#027A48'} />
          {banner.status === 'live' ? 'Pause' : 'Live'}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPACT LIST VIEW
   ═══════════════════════════════════════════════════════════ */
const CompactBannerList: React.FC<{
  banners: Banner[]; selectedIds: string[];
  onToggleSelect: (id: string) => void; onEdit: (b: Banner) => void;
  onDelete: (id: string) => void; onToggleStatus: (id: string) => void;
  onPreview: (b: Banner) => void;
}> = ({ banners, selectedIds, onToggleSelect, onEdit, onDelete, onToggleStatus, onPreview }) => (
  <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
      <thead>
        <tr style={{ background: '#F9FAFB' }}>
          {['', 'Banner', 'Placement', 'Status', 'Analytics', 'Actions'].map(h => (
            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9, color: '#667085', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #E4E7EC' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {banners.map((b) => {
          const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
          const pl = PLACEMENT_OPTIONS.find(p => p.value === b.placement);
          return (
            <tr key={b._id} style={{ borderBottom: '1px solid #F2F4F7' }}>
              <td style={{ padding: '8px 12px' }}>
                <input type="checkbox" checked={selectedIds.includes(b._id)} onChange={() => onToggleSelect(b._id)} style={{ width: 13, height: 13, accentColor: '#6750A4', cursor: 'pointer' }} />
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {b.image?.url && <img src={b.image.url} alt="" style={{ width: 48, height: 30, objectFit: 'cover', borderRadius: 4 }} />}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#101828' }}>{b.title}</div>
                    <div style={{ fontSize: 9, color: '#98A2B3' }}>{b.subtitle || '—'}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: '#475467', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {pl && <Icon name={pl.icon} size={11} color="#475467" />}{pl?.label}
                </div>
                <div style={{ fontSize: 9, color: '#98A2B3' }}>Slot {b.slot}</div>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{ padding: '2px 6px', borderRadius: 4, background: st.bg, color: st.color, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  <Icon name={st.icon} size={10} color={st.color} /> {st.label}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontSize: 10, color: '#101828', fontWeight: 600 }}>{b.impressions.toLocaleString('en-IN')} / {b.clicks.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 9, color: '#027A48', fontWeight: 600 }}>{(b.ctr || 0).toFixed(1)}% CTR</div>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  <button onClick={() => onPreview(b)} style={{ padding: 3, background: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: 4, cursor: 'pointer', display: 'flex' }}><Icon name="visibility" size={11} color="#2563EB" /></button>
                  <button onClick={() => onEdit(b)} style={{ padding: 3, background: '#F4F3FF', border: '1px solid #E8DEF8', borderRadius: 4, cursor: 'pointer', display: 'flex' }}><Icon name="edit" size={11} color="#6750A4" /></button>
                  <button onClick={() => onToggleStatus(b._id)} style={{ padding: 3, background: b.status === 'live' ? '#FEF0C7' : '#D1FADF', border: `1px solid ${b.status === 'live' ? '#FEDF89' : '#A6F4C5'}`, borderRadius: 4, cursor: 'pointer', display: 'flex' }}>
                    <Icon name={b.status === 'live' ? 'pause' : 'play_arrow'} size={11} color={b.status === 'live' ? '#B54708' : '#027A48'} />
                  </button>
                  <button onClick={() => onDelete(b._id)} style={{ padding: 3, background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 4, cursor: 'pointer', display: 'flex' }}><Icon name="delete" size={11} color="#B42318" /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   REORDER VIEW (Simplified)
   ═══════════════════════════════════════════════════════════ */
const BannerReorderView: React.FC<{
  bannersByPlacement: Record<string, Banner[]>; reordering: boolean;
  onSaveOrder: (p: string, b: Banner[]) => void;
}> = ({ bannersByPlacement, reordering, onSaveOrder }) => {
  const placements = Object.keys(bannersByPlacement);
  if (placements.length === 0) return <div style={{ padding: 30, textAlign: 'center', background: '#fff', border: '1px dashed #D0D5DD', borderRadius: 12, color: '#667085', fontSize: 12 }}>No banners to reorder</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {placements.map(p => (
        <ReorderGroup key={p} placement={p} initialBanners={bannersByPlacement[p]} reordering={reordering} onSave={(list) => onSaveOrder(p, list)} />
      ))}
    </div>
  );
};

const ReorderGroup: React.FC<{
  placement: string; initialBanners: Banner[]; reordering: boolean;
  onSave: (b: Banner[]) => void;
}> = ({ placement, initialBanners, reordering, onSave }) => {
  const [list, setList] = useState<Banner[]>(initialBanners);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setList(initialBanners); setDirty(false); }, [initialBanners]);
  const pl = PLACEMENT_OPTIONS.find(p => p.value === placement);

  const move = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const n = [...list]; const [m] = n.splice(from, 1); n.splice(to, 0, m); setList(n); setDirty(true);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#101828', display: 'flex', alignItems: 'center', gap: 6 }}>
          {pl && <Icon name={pl.icon} size={16} color="#6750A4" />} {pl?.label || placement}
          <span style={{ fontSize: 10, color: '#667085', fontWeight: 600 }}>({list.length}/{MAX_BANNERS_PER_PLACEMENT})</span>
        </div>
        {dirty && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setList(initialBanners); setDirty(false); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #D0D5DD', background: '#fff', color: '#344054', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Reset</button>
            <button onClick={() => onSave(list)} disabled={reordering} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: reordering ? '#B0A0D8' : '#6750A4', color: '#fff', fontSize: 10, fontWeight: 700, cursor: reordering ? 'not-allowed' : 'pointer' }}>
              {reordering ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {list.map((b, idx) => {
          const st = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
          return (
            <div key={b._id} draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { move(dragIdx, idx); setDragIdx(idx); } }}
              onDragEnd={() => setDragIdx(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                background: dragIdx === idx ? '#F4F3FF' : '#F9FAFB',
                border: `1px solid ${dragIdx === idx ? '#6750A4' : '#E4E7EC'}`,
                borderRadius: 8, cursor: 'grab', opacity: dragIdx === idx ? 0.6 : 1,
              }}
            >
              <Icon name="drag_indicator" size={16} color="#98A2B3" />
              <span style={{ padding: '2px 6px', borderRadius: 10, background: '#6750A4', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 24, textAlign: 'center' }}>#{idx + 1}</span>
              {b.image?.url && <img src={b.image.url} alt="" style={{ width: 48, height: 30, objectFit: 'cover', borderRadius: 4 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#101828', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
                  <span style={{ padding: '1px 4px', borderRadius: 3, background: st.bg, color: st.color, fontSize: 8, fontWeight: 700 }}>{st.label}</span>
                  <span style={{ fontSize: 9, color: '#667085' }}>{b.impressions.toLocaleString('en-IN')} views</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => move(idx, 0)} disabled={idx === 0} style={{ padding: 3, borderRadius: 4, border: '1px solid #D0D5DD', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === 0 ? 0.4 : 1 }}>
                  <Icon name="keyboard_double_arrow_up" size={11} color="#344054" />
                </button>
                <button onClick={() => move(idx, idx - 1)} disabled={idx === 0} style={{ padding: 3, borderRadius: 4, border: '1px solid #D0D5DD', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === 0 ? 0.4 : 1 }}>
                  <Icon name="arrow_upward" size={11} color="#344054" />
                </button>
                <button onClick={() => move(idx, idx + 1)} disabled={idx === list.length - 1} style={{ padding: 3, borderRadius: 4, border: '1px solid #D0D5DD', background: '#fff', cursor: idx === list.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === list.length - 1 ? 0.4 : 1 }}>
                  <Icon name="arrow_downward" size={11} color="#344054" />
                </button>
                <button onClick={() => move(idx, list.length - 1)} disabled={idx === list.length - 1} style={{ padding: 3, borderRadius: 4, border: '1px solid #D0D5DD', background: '#fff', cursor: idx === list.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', opacity: idx === list.length - 1 ? 0.4 : 1 }}>
                  <Icon name="keyboard_double_arrow_down" size={11} color="#344054" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BANNER EDITOR MODAL (Same structure, cleaned up)
   ═══════════════════════════════════════════════════════════ */
interface ImageSlot { file: File | null; preview: string | null; existing?: BannerImage; }

const BannerEditor: React.FC<{
  banner: Banner | null; existingCountByPlacement: Record<string, Banner[]>;
  onClose: () => void; onSuccess: (msg: string) => void;
}> = ({ banner, existingCountByPlacement, onClose, onSuccess }) => {
  const isEdit = !!banner;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildSlots = (): ImageSlot[] => {
    const s: ImageSlot[] = [];
    if (banner?.image?.url) s.push({ file: null, preview: banner.image.url, existing: banner.image });
    banner?.images?.forEach(img => { if (img?.url) s.push({ file: null, preview: img.url, existing: img }); });
    return s.slice(0, MAX_IMAGES_PER_BANNER);
  };

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(buildSlots());
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewIdx, setPreviewIdx] = useState(0);

  const [form, setForm] = useState({
    title: banner?.title || '', subtitle: banner?.subtitle || '', description: banner?.description || '',
    linkUrl: banner?.linkUrl || '', linkType: (banner?.linkType || 'external') as any,
    ctaLabel: banner?.ctaLabel || 'Learn More', openInNewTab: banner?.openInNewTab ?? true,
    priority: banner?.priority || 1, slot: banner?.slot || 1,
    platform: banner?.platform?.[0] || 'both', targetAudience: banner?.targetAudience || 'all',
    placement: banner?.placement || 'home_hero', category: banner?.category || 'promotional',
    tags: banner?.tags?.join(', ') || '',
    startDate: banner?.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
    endDate: banner?.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
    status: (banner?.status || 'draft') as any,
    backgroundColor: banner?.backgroundColor || '#6750A4',
    textColor: banner?.textColor || '#FFFFFF',
    overlayOpacity: banner?.overlayOpacity ?? 0.3,
    variant: banner?.variant || 'none', experimentId: banner?.experimentId || '',
  });

  const cntList = existingCountByPlacement[form.placement] || [];
  const cntUsed = isEdit ? cntList.filter(b => b._id !== banner?._id).length : cntList.length;
  const placementFull = cntUsed >= MAX_BANNERS_PER_PLACEMENT;

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError(null);
    const remaining = MAX_IMAGES_PER_BANNER - imageSlots.length;
    if (remaining <= 0) { setError(`Max ${MAX_IMAGES_PER_BANNER} images`); e.target.value = ''; return; }
    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) setError(`Only ${remaining} more allowed`);
    const newSlots: ImageSlot[] = [];
    let done = 0;
    toProcess.forEach(file => {
      const err = validateImageFile(file);
      if (err) { setError(err); done++; if (done === toProcess.length && newSlots.length) setImageSlots(p => [...p, ...newSlots].slice(0, MAX_IMAGES_PER_BANNER)); return; }
      const r = new FileReader();
      r.onload = ev => { newSlots.push({ file, preview: (ev.target?.result as string) || null }); done++; if (done === toProcess.length) setImageSlots(p => [...p, ...newSlots].slice(0, MAX_IMAGES_PER_BANNER)); };
      r.onerror = () => { done++; setError('Failed to read file'); };
      r.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImg = (idx: number) => {
    setImageSlots(p => { const n = p.filter((_, i) => i !== idx); if (previewIdx >= n.length && n.length > 0) setPreviewIdx(n.length - 1); if (!n.length) setPreviewIdx(0); return n; });
  };

  const moveImg = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= imageSlots.length || to >= imageSlots.length) return;
    setImageSlots(p => { const n = [...p]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n; });
    if (previewIdx === from) setPreviewIdx(to);
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return 'Title is required';
    if (form.title.length > 100) return 'Title max 100 chars';
    if (imageSlots.length === 0) return 'At least one image required';
    if (form.linkType !== 'none' && form.linkUrl && form.linkType === 'external' && !/^https?:\/\/.+/i.test(form.linkUrl)) return 'URL must start with http(s)://';
    if (form.slot < 1 || form.slot > MAX_BANNERS_PER_PLACEMENT) return `Slot 1-${MAX_BANNERS_PER_PLACEMENT}`;
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start';
    if (placementFull && !isEdit) return `Placement full (${MAX_BANNERS_PER_PLACEMENT} max)`;
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setSaving(true);
    try {
      const primary = imageSlots[0];
      const additional = imageSlots.slice(1);
      const primaryFile = primary?.file || null;
      const additionalFiles = additional.map(s => s.file).filter((f): f is File => !!f);
      const payload = {
        ...form, title: form.title.trim(), subtitle: form.subtitle.trim(),
        description: form.description.trim(), linkUrl: form.linkUrl.trim(),
        ctaLabel: form.ctaLabel.trim(), platform: [form.platform],
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        keptPrimaryImage: primary?.existing || null,
        keptAdditionalImages: additional.map(s => s.existing).filter((e): e is BannerImage => !!e),
      };
      if (isEdit && banner) { await bannerApi.updateBanner(banner._id, payload, primaryFile, additionalFiles); onSuccess('Banner updated'); }
      else { if (!primaryFile) throw new Error('Primary image required'); await bannerApi.createBanner(payload, primaryFile, additionalFiles); onSuccess('Banner created'); }
    } catch (err: any) { setError(err?.message || 'Save failed'); } finally { setSaving(false); }
  };

  const previewImg = imageSlots[previewIdx]?.preview || null;
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1.5px solid #D0D5DD', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#344054', marginBottom: 4, display: 'block' };
  const sec: React.CSSProperties = { background: '#F9FAFB', border: '1px solid #E4E7EC', borderRadius: 10, padding: 14 };
  const secH: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#101828', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', gap: 6 };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(16,24,40,0.6)', backdropFilter: 'blur(6px)', padding: 16, animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1000, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ padding: '14px 22px', borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6750A4,#7F56D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={isEdit ? 'edit' : 'add_photo_alternate'} size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>{isEdit ? 'Edit Banner' : 'Create Banner'}</h2>
              <p style={{ margin: 0, fontSize: 10, color: '#667085' }}>Up to {MAX_IMAGES_PER_BANNER} images · Live preview</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 6, cursor: 'pointer', padding: 6, display: 'flex' }}>
            <Icon name="close" size={18} color="#667085" />
          </button>
        </div>

        {/* Alerts */}
        {placementFull && !isEdit && (
          <div style={{ padding: '8px 22px', background: '#FEF3F2', borderBottom: '1px solid #FECDCA', color: '#B42318', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="warning" size={14} color="#B42318" /> Placement full. Choose another or archive existing.
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 22px', background: '#FEF3F2', borderBottom: '1px solid #FECDCA', color: '#B42318', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="error" size={14} color="#B42318" /> <span style={{ flex: 1 }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Icon name="close" size={12} color="#B42318" /></button>
          </div>
        )}

        {/* Body: Form + Preview */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 320px', minHeight: 0 }}>
          {/* LEFT: Form */}
          <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid #E4E7EC' }}>
            {/* Images */}
            <div style={sec}>
              <div style={secH}><Icon name="photo_library" size={14} color="#101828" /> Images ({imageSlots.length}/{MAX_IMAGES_PER_BANNER})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 8 }}>
                {imageSlots.map((slot, idx) => (
                  <div key={idx} onClick={() => setPreviewIdx(idx)} style={{
                    position: 'relative', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden',
                    border: `2px solid ${previewIdx === idx ? '#6750A4' : '#E4E7EC'}`, cursor: 'pointer', background: '#000',
                  }}>
                    {slot.preview && <img src={slot.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span style={{ position: 'absolute', top: 2, left: 2, padding: '1px 4px', borderRadius: 3, background: '#6750A4', color: '#fff', fontSize: 8, fontWeight: 800 }}>#{idx + 1}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeImg(idx); }} style={{ position: 'absolute', top: 2, right: 2, padding: 2, borderRadius: 3, background: 'rgba(240,68,56,0.85)', border: 'none', cursor: 'pointer', display: 'flex' }}>
                      <Icon name="close" size={9} color="#fff" />
                    </button>
                    <div style={{ position: 'absolute', bottom: 2, right: 2, display: 'flex', gap: 1 }}>
                      <button onClick={(e) => { e.stopPropagation(); moveImg(idx, idx - 1); }} disabled={idx === 0} style={{ padding: 2, borderRadius: 2, background: idx === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', display: 'flex' }}><Icon name="chevron_left" size={9} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveImg(idx, idx + 1); }} disabled={idx === imageSlots.length - 1} style={{ padding: 2, borderRadius: 2, background: idx === imageSlots.length - 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', border: 'none', cursor: idx === imageSlots.length - 1 ? 'not-allowed' : 'pointer', display: 'flex' }}><Icon name="chevron_right" size={9} /></button>
                    </div>
                  </div>
                ))}
                {imageSlots.length < MAX_IMAGES_PER_BANNER && (
                  <div onClick={() => fileRef.current?.click()} style={{ aspectRatio: '16/9', borderRadius: 8, border: '2px dashed #D0D5DD', background: '#F9FAFB', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="add_photo_alternate" size={20} color="#6750A4" />
                    <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: '#667085' }}>Add</div>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple onChange={handleAddImages} style={{ display: 'none' }} />
            </div>

            {/* Content */}
            <div style={sec}>
              <div style={secH}><Icon name="edit_note" size={14} /> Content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><label style={lbl}>Title * ({form.title.length}/100)</label><input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={100} placeholder="Banner title" style={inp} /></div>
                <div><label style={lbl}>Subtitle ({form.subtitle.length}/200)</label><input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} maxLength={200} placeholder="Optional subtitle" style={inp} /></div>
                <div><label style={lbl}>Description ({form.description.length}/500)</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={500} rows={2} placeholder="Optional description" style={{ ...inp, fontFamily: 'inherit', resize: 'vertical' }} /></div>
              </div>
            </div>

            {/* Link */}
            <div style={sec}>
              <div style={secH}><Icon name="link" size={14} /> Link & CTA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <div><label style={lbl}>URL</label><input type="url" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." style={inp} disabled={form.linkType === 'none'} /></div>
                <div><label style={lbl}>Type</label><select value={form.linkType} onChange={e => setForm({ ...form, linkType: e.target.value })} style={inp}><option value="external">External</option><option value="internal">Internal</option><option value="deep_link">Deep Link</option><option value="none">None</option></select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginTop: 8 }}>
                <div><label style={lbl}>CTA Label ({form.ctaLabel.length}/30)</label><input type="text" value={form.ctaLabel} onChange={e => setForm({ ...form, ctaLabel: e.target.value })} maxLength={30} style={inp} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#344054' }}>
                    <input type="checkbox" checked={form.openInNewTab} onChange={e => setForm({ ...form, openInNewTab: e.target.checked })} style={{ accentColor: '#6750A4' }} /> New tab
                  </label>
                </div>
              </div>
            </div>

            {/* Placement */}
            <div style={sec}>
              <div style={secH}><Icon name="my_location" size={14} /> Placement & Targeting</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={lbl}>Placement * ({cntUsed}/{MAX_BANNERS_PER_PLACEMENT})</label>
                  <select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })} style={inp}>
                    {PLACEMENT_OPTIONS.map(p => {
                      const c = (existingCountByPlacement[p.value] || []).filter(b => isEdit && banner ? b._id !== banner._id : true).length;
                      return <option key={p.value} value={p.value} disabled={c >= MAX_BANNERS_PER_PLACEMENT && p.value !== form.placement}>{p.label} ({c}/{MAX_BANNERS_PER_PLACEMENT})</option>;
                    })}
                  </select>
                </div>
                <div><label style={lbl}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>{CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
                <div><label style={lbl}>Slot (1-{MAX_BANNERS_PER_PLACEMENT})</label><input type="number" min={1} max={MAX_BANNERS_PER_PLACEMENT} value={form.slot} onChange={e => setForm({ ...form, slot: Math.max(1, Math.min(MAX_BANNERS_PER_PLACEMENT, Number(e.target.value) || 1)) })} style={inp} /></div>
                <div><label style={lbl}>Priority (1-100)</label><input type="number" min={1} max={100} value={form.priority} onChange={e => setForm({ ...form, priority: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} style={inp} /></div>
                <div><label style={lbl}>Audience</label><select value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} style={inp}><option value="all">All</option><option value="candidates">Candidates</option><option value="recruiters">Recruiters</option><option value="premium">Premium</option><option value="new_users">New Users</option></select></div>
                <div>
                  <label style={lbl}>Platform</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[{ v: 'web', i: 'desktop_windows', l: 'Web' }, { v: 'mobile', i: 'smartphone', l: 'Mobile' }, { v: 'both', i: 'devices', l: 'Both' }].map(({ v, i, l }) => (
                      <button key={v} type="button" onClick={() => setForm({ ...form, platform: v })} style={{
                        flex: 1, padding: '6px', borderRadius: 6,
                        border: `1px solid ${form.platform === v ? '#6750A4' : '#D0D5DD'}`,
                        background: form.platform === v ? '#E8DEF8' : '#fff',
                        color: form.platform === v ? '#6750A4' : '#475467',
                        fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                      }}>
                        <Icon name={i} size={11} color={form.platform === v ? '#6750A4' : '#475467'} />{l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}><label style={lbl}>Tags (comma separated)</label><input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="hiring, festive" style={inp} /></div>
            </div>

            {/* Design */}
            <div style={sec}>
              <div style={secH}><Icon name="palette" size={14} /> Design</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Button Color</label><input type="color" value={form.backgroundColor} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} style={{ ...inp, height: 34, padding: 3 }} /></div>
                <div><label style={lbl}>Text Color</label><input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} style={{ ...inp, height: 34, padding: 3 }} /></div>
                <div><label style={lbl}>Overlay ({(form.overlayOpacity * 100).toFixed(0)}%)</label><input type="range" min={0} max={1} step={0.05} value={form.overlayOpacity} onChange={e => setForm({ ...form, overlayOpacity: Number(e.target.value) })} style={{ width: '100%', marginTop: 8 }} /></div>
              </div>
            </div>

            {/* Schedule */}
            <div style={sec}>
              <div style={secH}><Icon name="calendar_month" size={14} /> Schedule & Status</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>End Date</label><input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => setForm({ ...form, endDate: e.target.value })} style={inp} /></div>
                <div><label style={lbl}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inp}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="paused">Paused</option></select></div>
              </div>
            </div>

            {/* A/B */}
            <div style={sec}>
              <div style={secH}><Icon name="science" size={14} /> A/B Testing</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                <div><label style={lbl}>Variant</label><select value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} style={inp}><option value="none">None</option><option value="control">Control</option><option value="A">A</option><option value="B">B</option></select></div>
                <div><label style={lbl}>Experiment ID</label><input type="text" value={form.experimentId} onChange={e => setForm({ ...form, experimentId: e.target.value })} placeholder="exp_id" style={inp} /></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div style={{ padding: 14, overflowY: 'auto', background: '#F9FAFB', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#101828', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon name="visibility" size={14} /> Preview
              {imageSlots.length > 1 && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#667085', fontWeight: 600 }}>{previewIdx + 1}/{imageSlots.length}</span>}
            </div>

            {!previewImg ? (
              <div style={{ background: '#fff', border: '1.5px dashed #D0D5DD', borderRadius: 10, padding: 30, textAlign: 'center', color: '#98A2B3', fontSize: 11 }}>
                <Icon name="image" size={30} color="#98A2B3" />
                <div style={{ marginTop: 4 }}>Upload to preview</div>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #E4E7EC', background: '#000', aspectRatio: '16/9' }}>
                <img src={previewImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,${form.overlayOpacity}) 100%)`,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12,
                }}>
                  <h3 style={{ margin: 0, color: form.textColor, fontSize: 14, fontWeight: 800, lineHeight: 1.2 }}>{form.title || 'Title'}</h3>
                  {form.subtitle && <p style={{ margin: '2px 0 0', color: form.textColor, fontSize: 10, opacity: 0.9 }}>{form.subtitle}</p>}
                  {form.linkType !== 'none' && (
                    <button style={{ marginTop: 6, alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 4, border: 'none', background: form.backgroundColor, color: form.textColor, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                      {form.ctaLabel || 'Learn More'} →
                    </button>
                  )}
                </div>
              </div>
            )}

            {imageSlots.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                {imageSlots.map((_, i) => (
                  <button key={i} onClick={() => setPreviewIdx(i)} style={{ width: 6, height: 6, borderRadius: '50%', border: 'none', background: previewIdx === i ? '#6750A4' : '#D0D5DD', cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid #E4E7EC', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#F9FAFB' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D0D5DD', background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || (placementFull && !isEdit)} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: (saving || (placementFull && !isEdit)) ? '#B0A0D8' : 'linear-gradient(135deg,#6750A4,#7F56D9)',
            color: '#fff', fontWeight: 700, fontSize: 12,
            cursor: (saving || (placementFull && !isEdit)) ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            boxShadow: saving ? 'none' : '0 3px 10px rgba(103,80,164,0.3)',
          }}>
            <Icon name={saving ? 'progress_activity' : 'save'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } : {}} />
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   BANNER PREVIEW MODAL
   ═══════════════════════════════════════════════════════════ */
const BannerPreview: React.FC<{ banner: Banner; onClose: () => void }> = ({ banner, onClose }) => {
  const allImages = useMemo(() => {
    const arr: string[] = [];
    if (banner.image?.url) arr.push(banner.image.url);
    banner.images?.forEach(img => { if (img?.url && img.url !== banner.image?.url) arr.push(img.url); });
    return arr;
  }, [banner]);

  const [idx, setIdx] = useState(0);
  const img = allImages[idx] || null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{banner.title}</h3>
          {allImages.length > 1 && <p style={{ margin: '2px 0 0', fontSize: 10, opacity: 0.6 }}>Image {idx + 1}/{allImages.length}</p>}
        </div>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 800, width: '100%', background: '#000' }}>
          {img && <img src={img} alt="" style={{ width: '100%', display: 'block' }} />}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, transparent 40%, rgba(0,0,0,${banner.overlayOpacity}) 100%)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24,
          }}>
            <h2 style={{ margin: 0, color: banner.textColor, fontSize: 26, fontWeight: 800 }}>{banner.title}</h2>
            {banner.subtitle && <p style={{ margin: '4px 0 0', color: banner.textColor, fontSize: 14, opacity: 0.9 }}>{banner.subtitle}</p>}
            {banner.linkUrl && <button style={{ marginTop: 10, alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 8, border: 'none', background: banner.backgroundColor, color: banner.textColor, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{banner.ctaLabel} →</button>}
          </div>
          {allImages.length > 1 && (
            <>
              <button onClick={() => setIdx(i => (i - 1 + allImages.length) % allImages.length)} style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', padding: 8, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex' }}><Icon name="chevron_left" size={18} /></button>
              <button onClick={() => setIdx(i => (i + 1) % allImages.length)} style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', padding: 8, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex' }}><Icon name="chevron_right" size={18} /></button>
              <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                {allImages.map((_, i) => <button key={i} onClick={() => setIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }} />)}
              </div>
            </>
          )}
        </div>
        <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#fff', color: '#101828', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="close" size={14} /> Close
        </button>
      </div>
    </div>
  );
};

export default BannerManagementView;