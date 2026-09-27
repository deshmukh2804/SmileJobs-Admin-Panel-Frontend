import { useState, useEffect, useCallback } from 'react';
import {
  MobileBottomNavConfig,
  MobileNavKey,
  MOBILE_NAV_DEFAULTS,
  MOBILE_NAV_ITEM_META,
} from '../types';
import { appConfigApi } from '../services/api';

// ── Lucide-style SVG icons ──
const ICONS: Record<string, JSX.Element> = {
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Crown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M5 16h14v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2z" />
    </svg>
  ),
  User: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const DEVICES = {
  se: { name: 'iPhone SE', width: 320 },
  ip15: { name: 'iPhone 15', width: 375 },
  ipmax: { name: 'Pro Max', width: 414 },
};

type TabId = 'items' | 'size' | 'colors';

export function BottomNavConfigView() {
  const [config, setConfig] = useState<MobileBottomNavConfig>(MOBILE_NAV_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [device, setDevice] = useState<keyof typeof DEVICES>('ip15');
  const [activePreviewTab, setActivePreviewTab] = useState<MobileNavKey>('home');
  const [activeTab, setActiveTab] = useState<TabId>('items');

  // ── Fetch config ──
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await appConfigApi.getBottomNavConfig();
      if (res.success && res.data?.bottomNav) {
        setConfig(res.data.bottomNav);
      }
    } catch (err) {
      console.error('Failed to fetch bottom nav config:', err);
      showStatus('Failed to load config. Using defaults.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const toggleItem = (key: MobileNavKey) => {
    setConfig((prev) => {
      const updatedItems = prev.items.map((item) =>
        item.key === key ? { ...item, enabled: !item.enabled } : item
      );
      if (updatedItems.filter((i) => i.enabled).length < 2) {
        showStatus('At least 2 items must remain enabled.', 'error');
        return prev;
      }
      return { ...prev, items: updatedItems };
    });
    setHasChanges(true);
  };

  const updateSize = (field: string, value: number) => {
    setConfig((prev) => ({ ...prev, size: { ...prev.size, [field]: value } }));
    setHasChanges(true);
  };

  const updateColor = (field: string, value: string | number) => {
    setConfig((prev) => ({ ...prev, colors: { ...prev.colors, [field]: value } }));
    setHasChanges(true);
  };

  const toggleBoolean = (field: 'isVisible' | 'showLabels' | 'showBadges') => {
    setConfig((prev) => ({ ...prev, [field]: !prev[field] }));
    setHasChanges(true);
  };

  const moveItem = (key: MobileNavKey, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const sorted = [...prev.items].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((i) => i.key === key);
      if (idx === -1) return prev;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const newItems = [...sorted];
      const tempOrder = newItems[idx].order;
      newItems[idx] = { ...newItems[idx], order: newItems[swapIdx].order };
      newItems[swapIdx] = { ...newItems[swapIdx], order: tempOrder };
      return { ...prev, items: newItems };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await appConfigApi.updateBottomNavConfig({
        items: config.items,
        size: config.size,
        colors: config.colors,
        isVisible: config.isVisible,
        showLabels: config.showLabels,
        showBadges: config.showBadges,
      });
      if (res.success) {
        showStatus('Config saved successfully!', 'success');
        setHasChanges(false);
      } else {
        showStatus(res.message || 'Save failed.', 'error');
      }
    } catch {
      showStatus('Network error.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    try {
      setSaving(true);
      const res = await appConfigApi.resetBottomNavConfig();
      if (res.success) {
        setConfig(MOBILE_NAV_DEFAULTS);
        showStatus('Reset to defaults!', 'success');
        setHasChanges(false);
      }
    } catch {
      showStatus('Failed to reset.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const enabledItems = config.items.filter((i) => i.enabled).sort((a, b) => a.order - b.order);
  const enabledCount = enabledItems.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-96px)] flex flex-col">
      {/* ══════════ COMPACT HEADER BAR ══════════ */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Mobile Bottom Navigation</h1>
            <p className="text-xs text-gray-500 leading-tight">
              {enabledCount} of {config.items.length} tabs enabled · Live preview updates instantly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Pill */}
          {statusMsg && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 animate-in fade-in ${
                statusMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              <span>{statusMsg.type === 'success' ? '✓' : '✕'}</span>
              {statusMsg.text}
            </div>
          )}

          {hasChanges && !statusMsg && (
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Unsaved
            </span>
          )}

          <button
            onClick={handleReset}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 transition-all"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══════════ MAIN GRID (3 columns: Global | Controls | Preview) ══════════ */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">
        {/* ═════ LEFT: GLOBAL TOGGLES ═════ */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h2 className="text-sm font-bold text-gray-900">Global Settings</h2>
          </div>

          {[
            { key: 'isVisible' as const, label: 'Show Nav Bar', icon: '👁️', desc: 'Show/hide entire bar' },
            { key: 'showLabels' as const, label: 'Show Labels', icon: '📝', desc: 'Text below icons' },
            { key: 'showBadges' as const, label: 'Show Badges', icon: '🔴', desc: 'Notification dots' },
          ].map(({ key, label, icon, desc }) => (
            <label
              key={key}
              className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${
                config[key]
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-gray-50 border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 truncate">{label}</div>
                <div className="text-[10px] text-gray-400 truncate">{desc}</div>
              </div>
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={config[key]}
                  onChange={() => toggleBoolean(key)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 rounded-full peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          ))}

          {/* Info panel */}
          <div className="mt-auto pt-2 border-t border-gray-100">
            <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
              <div className="flex items-start gap-1.5">
                <svg className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div className="text-[10px] text-indigo-700 leading-tight">
                  <strong>API:</strong>
                  <code className="block mt-0.5 bg-white/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-indigo-800 break-all">
                    GET /api/v1/app-config/bottom-nav
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═════ CENTER: TABBED CONTROLS ═════ */}
        <div className="col-span-5 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
            {[
              { id: 'items' as TabId, label: 'Tab Items', icon: '📱', badge: enabledCount },
              { id: 'size' as TabId, label: 'Size', icon: '📐' },
              { id: 'colors' as TabId, label: 'Colors', icon: '🎨' },
            ].map(({ id, label, icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
                  activeTab === id
                    ? 'text-indigo-700 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{icon}</span>
                {label}
                {badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    activeTab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {badge}
                  </span>
                )}
                {activeTab === id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {/* TAB: ITEMS */}
            {activeTab === 'items' && (
              <div className="space-y-2">
                {[...config.items]
                  .sort((a, b) => a.order - b.order)
                  .map((item, idx, arr) => {
                    const meta = MOBILE_NAV_ITEM_META[item.key];
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                          item.enabled
                            ? 'border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-transparent'
                            : 'border-gray-100 bg-gray-50/50 opacity-60'
                        }`}
                      >
                        {/* Order Number */}
                        <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 flex-shrink-0">
                          {idx + 1}
                        </div>

                        {/* Icon */}
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: meta.color + '18', color: meta.color }}
                        >
                          <div className="w-5 h-5">{ICONS[item.icon]}</div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900">{meta.label}</div>
                          <div className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                            {meta.description}
                          </div>
                        </div>

                        {/* Reorder */}
                        <div className="flex flex-col gap-0 flex-shrink-0">
                          <button
                            onClick={() => moveItem(item.key, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveItem(item.key, 'down')}
                            disabled={idx === arr.length - 1}
                            className="p-0.5 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>

                        {/* Toggle */}
                        <label className="relative cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={item.enabled}
                            onChange={() => toggleItem(item.key)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-gray-300 rounded-full peer-checked:bg-green-500 transition-colors" style={{ height: '22px' }} />
                          <div className="absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform peer-checked:translate-x-[18px]" />
                        </label>
                      </div>
                    );
                  })}

                <div className="mt-2 text-[10px] text-gray-500 text-center py-1.5 bg-gray-50 rounded-md">
                  💡 Minimum 2 items must be enabled · Use arrows to reorder
                </div>
              </div>
            )}

            {/* TAB: SIZE */}
            {activeTab === 'size' && (
              <div className="space-y-3">
                {[
                  { key: 'barHeight', label: 'Bar Height', min: 40, max: 120, icon: '📏' },
                  { key: 'iconSize', label: 'Icon Size', min: 14, max: 48, icon: '🔍' },
                  { key: 'fontSize', label: 'Label Font Size', min: 8, max: 20, icon: '🔤' },
                  { key: 'borderRadius', label: 'Border Radius', min: 0, max: 40, icon: '◗' },
                  { key: 'horizontalPadding', label: 'Horizontal Padding', min: 0, max: 32, icon: '↔️' },
                  { key: 'iconLabelGap', label: 'Icon-Label Gap', min: 0, max: 16, icon: '⬍' },
                ].map(({ key, label, min, max, icon }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <span>{icon}</span>
                        {label}
                      </label>
                      <span className="text-[11px] font-mono font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200 shadow-sm">
                        {(config.size as any)[key]}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={(config.size as any)[key]}
                      onChange={(e) => updateSize(key, Number(e.target.value))}
                      className="w-full h-1.5 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                      <span>{min}px</span>
                      <span>{max}px</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: COLORS */}
            {activeTab === 'colors' && (
              <div className="space-y-2">
                {[
                  { key: 'backgroundColor', label: 'Background', icon: '🎨' },
                  { key: 'activeColor', label: 'Active Icon', icon: '✨' },
                  { key: 'inactiveColor', label: 'Inactive Icon', icon: '⚫' },
                  { key: 'badgeColor', label: 'Badge Color', icon: '🔴' },
                  { key: 'shadowColor', label: 'Shadow Color', icon: '🌑' },
                ].map(({ key, label, icon }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base flex-shrink-0 shadow-sm">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-800">{label}</div>
                      <div className="text-[10px] font-mono text-gray-500 mt-0.5 uppercase">
                        {(config.colors as any)[key]}
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      <input
                        type="color"
                        value={(config.colors as any)[key]}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 border-white cursor-pointer p-0 shadow-md hover:scale-105 transition-transform"
                        style={{ backgroundColor: (config.colors as any)[key] }}
                      />
                    </div>
                  </div>
                ))}

                {/* Shadow Opacity Special */}
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <span>💨</span> Shadow Opacity
                    </label>
                    <span className="text-[11px] font-mono font-bold bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-200">
                      {Math.round(config.colors.shadowOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={config.colors.shadowOpacity}
                    onChange={(e) => updateColor('shadowOpacity', Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═════ RIGHT: LIVE PREVIEW ═════ */}
        <div className="col-span-4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900">Live Preview</h2>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-md p-0.5">
              {Object.entries(DEVICES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDevice(key as keyof typeof DEVICES)}
                  className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                    device === key
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {val.name}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Frame */}
          <div className="flex-1 flex items-center justify-center p-3 bg-gradient-to-br from-gray-100 via-slate-100 to-gray-200 overflow-hidden">
            <div
              className="relative bg-gray-900 rounded-[2rem] p-2 shadow-2xl"
              style={{ width: 220 }}
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-b-xl z-10" />

              {/* Screen */}
              <div
                className="bg-white rounded-[1.5rem] overflow-hidden flex flex-col"
                style={{ height: 440 }}
              >
                {/* Status Bar */}
                <div className="h-6 bg-white flex items-end justify-between px-4 pb-1 flex-shrink-0">
                  <span className="text-[8px] font-bold text-gray-900">9:41</span>
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-1.5 border border-gray-900 rounded-sm relative">
                      <div className="absolute inset-[1px] bg-gray-900 rounded-[0.5px]" style={{ width: '70%' }} />
                    </div>
                  </div>
                </div>

                {/* Mock App Content */}
                <div className="flex-1 bg-gradient-to-b from-indigo-50 via-purple-50/40 to-white p-2.5 overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
                    {activePreviewTab === 'home' && <>🏠 Home</>}
                    {activePreviewTab === 'allJobs' && <>💼 All Jobs</>}
                    {activePreviewTab === 'activity' && <>📊 Activity</>}
                    {activePreviewTab === 'premium' && <>👑 Premium</>}
                    {activePreviewTab === 'profile' && <>👤 Profile</>}
                  </div>
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-8 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-2 gap-1.5"
                      >
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-indigo-200 to-purple-200" />
                        <div className="flex-1 space-y-0.5">
                          <div className="h-1 bg-gray-200 rounded w-3/4" />
                          <div className="h-1 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── ACTUAL BOTTOM NAV BAR PREVIEW ── */}
                {config.isVisible && (
                  <div
                    className="flex items-center justify-around flex-shrink-0 relative"
                    style={{
                      height: Math.max(40, Math.min(config.size.barHeight * 0.75, 70)),
                      backgroundColor: config.colors.backgroundColor,
                      borderRadius: `${config.size.borderRadius * 0.6}px ${config.size.borderRadius * 0.6}px 0 0`,
                      paddingLeft: config.size.horizontalPadding * 0.6,
                      paddingRight: config.size.horizontalPadding * 0.6,
                      boxShadow: `0 -2px 8px ${config.colors.shadowColor}${Math.round(config.colors.shadowOpacity * 255).toString(16).padStart(2, '0')}`,
                    }}
                  >
                    {enabledItems.map((item) => {
                      const isActive = activePreviewTab === item.key;
                      const scaledIconSize = Math.max(12, Math.min(config.size.iconSize * 0.65, 24));
                      const scaledFontSize = Math.max(7, Math.min(config.size.fontSize * 0.75, 11));
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActivePreviewTab(item.key)}
                          className="flex flex-col items-center justify-center flex-1 transition-all relative"
                          style={{ gap: config.size.iconLabelGap * 0.5 }}
                        >
                          <div
                            className="transition-colors relative"
                            style={{
                              width: scaledIconSize,
                              height: scaledIconSize,
                              color: isActive ? config.colors.activeColor : config.colors.inactiveColor,
                            }}
                          >
                            {ICONS[item.icon]}
                            {config.showBadges && item.key === 'activity' && (
                              <div
                                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-white"
                                style={{ backgroundColor: config.colors.badgeColor }}
                              />
                            )}
                          </div>
                          {config.showLabels && (
                            <span
                              className="font-medium transition-colors leading-none"
                              style={{
                                fontSize: scaledFontSize,
                                color: isActive ? config.colors.activeColor : config.colors.inactiveColor,
                              }}
                            >
                              {item.label}
                            </span>
                          )}
                          {isActive && (
                            <span
                              className="absolute top-0 h-0.5 w-4 rounded-full"
                              style={{ backgroundColor: config.colors.activeColor }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Device Stats */}
          <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 flex-shrink-0 bg-gray-50">
            <span>
              <strong className="text-gray-700">{DEVICES[device].name}</strong> · {DEVICES[device].width}px
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Tap tabs to preview
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}