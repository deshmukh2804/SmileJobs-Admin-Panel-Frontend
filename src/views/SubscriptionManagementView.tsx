// FILE: frontend/src/views/SubscriptionManagementView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { subscriptionApi, SubscriptionPlanPayload } from '../services/api';

/* ═══════════════════════════════════════════════════════════
   MATERIAL ICON WRAPPER
   ═══════════════════════════════════════════════════════════ */
const MIcon: React.FC<{ name: string; size?: number; color?: string; style?: React.CSSProperties }> = ({
  name, size = 18, color, style,
}) => (
  <span className="material-symbols-outlined" style={{ fontSize: size, color, lineHeight: 1, verticalAlign: 'middle', ...style }}>
    {name}
  </span>
);

/* ═══════════════════════════════════════════════════════════
   TIER STYLING
   ═══════════════════════════════════════════════════════════ */
const TIER_CONFIG: Record<string, any> = {
  basic: { label: 'Basic', icon: 'rocket_launch', gradient: 'linear-gradient(135deg, #667085 0%, #475467 100%)', accentColor: '#475467', lightBg: '#F9FAFB', borderColor: '#D0D5DD' },
  pro: { label: 'Professional', icon: 'workspace_premium', gradient: 'linear-gradient(135deg, #6750A4 0%, #7F56D9 100%)', accentColor: '#6750A4', lightBg: '#F4F3FF', borderColor: '#D6BBFB' },
  enterprise: { label: 'Enterprise', icon: 'diamond', gradient: 'linear-gradient(135deg, #B54708 0%, #D97706 100%)', accentColor: '#B54708', lightBg: '#FEF6EE', borderColor: '#FDDCAB' },
};

/* ═══════════════════════════════════════════════════════════
   QUICK TEMPLATES
   ═══════════════════════════════════════════════════════════ */
const RECRUITER_TEMPLATES: SubscriptionPlanPayload[] = [
  { name: 'Startup Basic', tier: 'basic', audience: 'recruiters', price: 2999, priceYearly: 29999, billingCycle: 'monthly', description: 'Perfect for small startups hiring their first employees.', features: ['5 Job Posts', '50 Resume Views', 'Email Support', 'Basic Filters'], advantages: ['Lowest cost entry', 'No lock-in contract'], jobPostLimit: 5, resumeViewLimit: 50, isPopular: false, discountPercent: 0, trialDays: 7 },
  { name: 'Growth Pro', tier: 'pro', audience: 'recruiters', price: 9999, priceYearly: 99999, billingCycle: 'monthly', description: 'For growing companies with active hiring pipelines.', features: ['25 Job Posts', '500 Resume Views', 'AI Matching', 'WhatsApp Bot', 'Verified Badge'], advantages: ['AI reduces screening time', 'Priority listing'], jobPostLimit: 25, resumeViewLimit: 500, isPopular: true, discountPercent: 10, trialDays: 14 },
  { name: 'Enterprise Elite', tier: 'enterprise', audience: 'recruiters', price: 29999, priceYearly: 299999, billingCycle: 'monthly', description: 'Full-scale hiring infrastructure for large enterprises.', features: ['Unlimited Job Posts', 'Unlimited Resume Views', 'Dedicated CSM', 'DigiLocker API', 'API Integration'], advantages: ['Zero limits', 'White-label career page', '99.9% SLA'], jobPostLimit: 9999, resumeViewLimit: 9999, isPopular: false, discountPercent: 15, trialDays: 30 },
];
const CANDIDATE_TEMPLATES: SubscriptionPlanPayload[] = [
  { name: 'Student Starter', tier: 'basic', audience: 'candidates', price: 149, priceYearly: 1499, billingCycle: 'monthly', description: 'For college students and fresh graduates.', features: ['2x Profile Visibility', '20 Applications/mo', 'Resume Score', 'Job Alerts'], advantages: ['Cheapest plan', 'Perfect for freshers'], jobPostLimit: 0, resumeViewLimit: 0, isPopular: false, discountPercent: 0, trialDays: 3 },
  { name: 'Career Accelerator', tier: 'pro', audience: 'candidates', price: 499, priceYearly: 4999, billingCycle: 'monthly', description: 'For working professionals seeking better roles.', features: ['5x Profile Visibility', '100 Applications/mo', 'AI Resume Rewriter', 'Priority Applications', 'Direct HR Messages'], advantages: ['40% higher callback rate', 'Real salary insights'], jobPostLimit: 0, resumeViewLimit: 0, isPopular: true, discountPercent: 20, trialDays: 7 },
  { name: 'Premium Elite', tier: 'enterprise', audience: 'candidates', price: 1299, priceYearly: 12999, billingCycle: 'monthly', description: 'For senior professionals targeting leadership roles.', features: ['10x Visibility', 'Unlimited Applications', 'Career Coach', 'Headhunter Access', 'Confidential Mode'], advantages: ['Access to ₹30L+ roles', 'Human-reviewed resume'], jobPostLimit: 0, resumeViewLimit: 0, isPopular: false, discountPercent: 25, trialDays: 14 },
];

/* ═══════════════════════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════════════════════ */
export const SubscriptionManagementView: React.FC = () => {
  const [audience, setAudience] = useState<'recruiters' | 'candidates'>('recruiters');
  const [plans, setPlans] = useState<SubscriptionPlanPayload[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanPayload | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, analyticsRes] = await Promise.all([
        subscriptionApi.getPlans({ audience }),
        subscriptionApi.getAnalytics(),
      ]);
      if (planRes.success) setPlans(planRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [audience]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (success) { const t = setTimeout(() => setSuccess(null), 3500); return () => clearTimeout(t); } }, [success]);
  useEffect(() => { if (error) { const t = setTimeout(() => setError(null), 6000); return () => clearTimeout(t); } }, [error]);

  const handleQuickSetup = async () => {
    const templates = audience === 'recruiters' ? RECRUITER_TEMPLATES : CANDIDATE_TEMPLATES;
    if (!window.confirm(`Create 3 default ${audience} plans?`)) return;
    try {
      const baseUrl = ((import.meta.env?.VITE_API_URL as string) || 'http://localhost:500').replace(/\/$/, '');
      const endpoint = baseUrl.endsWith('/api/v1') ? `${baseUrl}/subscriptions/plans/bulk` : `${baseUrl}/api/v1/subscriptions/plans/bulk`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plans: templates }) });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); fetchData(); } else setError(data.message);
    } catch (err: any) { setError(err.message); }
  };

  const handleToggle = async (id: string) => {
    try { const res = await subscriptionApi.toggleStatus(id); if (res.success) { setSuccess(res.message); fetchData(); } else setError(res.message); } catch (err: any) { setError(err.message); }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" permanently?`)) return;
    try { const res = await subscriptionApi.deletePlan(id); if (res.success) { setSuccess(`"${name}" deleted`); fetchData(); } else setError(res.message); } catch (err: any) { setError(err.message); }
  };
  const handleMockBuy = async (planId: string, planName: string) => {
    try { const res = await subscriptionApi.triggerMockPurchase({ planId, type: audience === 'recruiters' ? 'Company' : 'User', cycle: 'monthly' }); if (res.success) { setSuccess(`Test purchase of "${planName}" logged!`); fetchData(); } else setError(res.message); } catch (err: any) { setError(err.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .plan-card { transition: all 0.25s ease; }
        .plan-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important; }
        .btn-h:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(103,80,164,0.3); }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '18px 20px', background: '#fff', borderRadius: 14, border: '1px solid #E4E7EC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6750A4,#7F56D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(103,80,164,0.25)' }}>
            <MIcon name="workspace_premium" size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#101828' }}>Subscription Plans</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#667085' }}>Manage pricing for Recruiters & Candidates</p>
          </div>
        </div>
        <button className="btn-h" onClick={() => { setEditingPlan(null); setModalOpen(true); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#6750A4,#7F56D9)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 10px rgba(103,80,164,0.25)', transition: 'all 0.2s ease' }}>
          <MIcon name="add_circle" size={16} color="#fff" /> New Plan
        </button>
      </div>

      {/* ═══ ALERTS ═══ */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#B42318', fontWeight: 600, fontSize: 12, animation: 'slideDown 0.3s ease' }}>
          <MIcon name="error" size={16} color="#B42318" /> <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={14} color="#B42318" /></button>
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: '#ECFDF3', border: '1px solid #A6F4C5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#027A48', fontWeight: 600, fontSize: 12, animation: 'slideDown 0.3s ease' }}>
          <MIcon name="check_circle" size={16} color="#027A48" /> <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={14} color="#027A48" /></button>
        </div>
      )}

      {/* ═══ ANALYTICS (Compact single row) ═══ */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Revenue', value: `₹${(analytics.grossRevenue / 1000).toFixed(1)}k`, icon: 'account_balance', color: '#6750A4', bg: '#F4F3FF' },
            { label: 'Subscribers', value: analytics.activeSubscribers || 0, icon: 'group', color: '#027A48', bg: '#ECFDF3' },
            { label: 'Total Plans', value: analytics.totalPlans || 0, icon: 'inventory_2', color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Active', value: analytics.activePlans || 0, icon: 'toggle_on', color: '#D97706', bg: '#FEF6EE' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MIcon name={s.icon} size={18} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#101828', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#667085', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ AUDIENCE TOGGLE (Compact) ═══ */}
      <div style={{ display: 'inline-flex', gap: 3, padding: 3, background: '#F2F4F7', borderRadius: 10, border: '1px solid #E4E7EC' }}>
        {[
          { key: 'recruiters', label: 'Recruiter Plans', icon: 'business' },
          { key: 'candidates', label: 'Candidate Plans', icon: 'school' },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => setAudience(key as any)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
            background: audience === key ? 'linear-gradient(135deg,#6750A4,#7F56D9)' : 'transparent',
            color: audience === key ? '#fff' : '#475467', fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: audience === key ? '0 2px 8px rgba(103,80,164,0.25)' : 'none',
          }}>
            <MIcon name={icon} size={14} color={audience === key ? '#fff' : '#475467'} /> {label}
          </button>
        ))}
      </div>

      {/* ═══ PLAN CARDS (Compact Grid — 3 per row) ═══ */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#667085', background: '#fff', borderRadius: 12, border: '1px solid #E4E7EC' }}>
          <MIcon name="progress_activity" size={28} color="#6750A4" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>Loading plans...</div>
        </div>
      ) : plans.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: '#fff', border: '2px dashed #D6BBFB', borderRadius: 14 }}>
          <MIcon name="rocket_launch" size={36} color="#6750A4" />
          <h3 style={{ margin: '8px 0 4px', fontSize: 16, color: '#101828' }}>No {audience === 'recruiters' ? 'Recruiter' : 'Candidate'} Plans</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: '#667085' }}>Create plans manually or use Quick Setup.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleQuickSetup} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px dashed #6750A4', background: '#F4F3FF', color: '#6750A4', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <MIcon name="auto_awesome" size={14} color="#6750A4" /> Quick Setup (3 Plans)
            </button>
            <button onClick={() => { setEditingPlan(null); setModalOpen(true); }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#6750A4', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <MIcon name="add" size={14} color="#fff" /> Create Plan
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {plans.map((plan) => (
            <CompactPlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => { setEditingPlan(plan); setModalOpen(true); }}
              onDelete={() => handleDelete(plan._id!, plan.name)}
              onToggle={() => handleToggle(plan._id!)}
              onBuy={() => handleMockBuy(plan._id!, plan.name)}
            />
          ))}
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {modalOpen && (
        <PlanFormModal
          plan={editingPlan}
          audience={audience}
          onClose={() => { setModalOpen(false); setEditingPlan(null); }}
          onSave={async (payload) => {
            try {
              const res = editingPlan?._id
                ? await subscriptionApi.updatePlan(editingPlan._id, payload)
                : await subscriptionApi.createPlan(payload);
              if (res.success) { setSuccess(res.message); setModalOpen(false); setEditingPlan(null); fetchData(); }
              else setError(res.message || 'Failed to save');
            } catch (err: any) { setError(err.message); }
          }}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPACT PLAN CARD (Small, fits 3 per row, scrollable features)
   ═══════════════════════════════════════════════════════════ */
const CompactPlanCard: React.FC<{
  plan: SubscriptionPlanPayload;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onBuy: () => void;
}> = ({ plan, onEdit, onDelete, onToggle, onBuy }) => {
  const tier = TIER_CONFIG[plan.tier] || TIER_CONFIG.basic;
  const savings = plan.priceYearly > 0 && plan.price > 0
    ? Math.round(((plan.price * 12 - plan.priceYearly) / (plan.price * 12)) * 100)
    : 0;
  const MAX_FEATURES_SHOWN = 4;
  const visibleFeatures = plan.features.slice(0, MAX_FEATURES_SHOWN);
  const hiddenCount = plan.features.length - MAX_FEATURES_SHOWN;

  return (
    <div className="plan-card" style={{
      background: '#fff', borderRadius: 14, position: 'relative',
      border: plan.isPopular ? `2px solid ${tier.accentColor}` : '1px solid #E4E7EC',
      boxShadow: plan.isPopular ? `0 4px 16px ${tier.accentColor}18` : '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* POPULAR TAG */}
      {plan.isPopular && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: tier.gradient,
        }} />
      )}

      {/* TOP: Tier icon + Name + Actions */}
      <div style={{ padding: '14px 14px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: tier.gradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: `0 3px 8px ${tier.accentColor}30`,
        }}>
          <MIcon name={tier.icon} size={20} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plan.name}
              </h3>
              <div style={{ display: 'flex', gap: 4, marginTop: 3, alignItems: 'center' }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: tier.accentColor,
                  padding: '1px 6px', borderRadius: 6,
                  background: tier.lightBg, border: `1px solid ${tier.borderColor}`,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {tier.label}
                </span>
                {plan.isPopular && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#6750A4', background: '#E8DEF8', padding: '1px 6px', borderRadius: 6 }}>
                    ⭐ Popular
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3, marginLeft: 6 }}>
              <button onClick={onEdit} title="Edit" style={{ padding: 4, background: '#F4F3FF', border: '1px solid #E8DEF8', borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                <MIcon name="edit" size={12} color="#6750A4" />
              </button>
              <button onClick={onDelete} title="Delete" style={{ padding: 4, background: '#FEF3F2', border: '1px solid #FECDCA', borderRadius: 5, cursor: 'pointer', display: 'flex' }}>
                <MIcon name="delete" size={12} color="#B42318" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRICE SECTION */}
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#98A2B3' }}>₹</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#101828', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {plan.price.toLocaleString('en-IN')}
          </span>
          <span style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>/mo</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
          {plan.priceYearly > 0 && (
            <span style={{ fontSize: 9, padding: '2px 6px', background: '#ECFDF3', border: '1px solid #A6F4C5', borderRadius: 4, color: '#027A48', fontWeight: 700 }}>
              ₹{plan.priceYearly.toLocaleString('en-IN')}/yr {savings > 0 && `(${savings}% off)`}
            </span>
          )}
          {plan.discountPercent > 0 && (
            <span style={{ fontSize: 9, padding: '2px 6px', background: '#FEF0C7', border: '1px solid #FEDF89', borderRadius: 4, color: '#B54708', fontWeight: 700 }}>
              {plan.discountPercent}% OFF
            </span>
          )}
          {plan.trialDays > 0 && (
            <span style={{ fontSize: 9, padding: '2px 6px', background: '#F0F9FF', border: '1px solid #B9E6FE', borderRadius: 4, color: '#0369A1', fontWeight: 700 }}>
              {plan.trialDays}d trial
            </span>
          )}
        </div>
      </div>

      {/* DESCRIPTION (1-2 lines max) */}
      {plan.description && (
        <div style={{ padding: '0 14px 8px' }}>
          <p style={{
            margin: 0, fontSize: 11, color: '#667085', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {plan.description}
          </p>
        </div>
      )}

      {/* LIMITS (Recruiter only — inline badges) */}
      {plan.audience === 'recruiters' && (plan.jobPostLimit > 0 || plan.resumeViewLimit > 0) && (
        <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6 }}>
          <div style={{ flex: 1, padding: '6px 8px', background: tier.lightBg, borderRadius: 6, border: `1px solid ${tier.borderColor}`, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: tier.accentColor, lineHeight: 1 }}>
              {plan.jobPostLimit >= 9999 ? '∞' : plan.jobPostLimit}
            </div>
            <div style={{ fontSize: 8, color: '#667085', fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>Jobs</div>
          </div>
          <div style={{ flex: 1, padding: '6px 8px', background: tier.lightBg, borderRadius: 6, border: `1px solid ${tier.borderColor}`, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: tier.accentColor, lineHeight: 1 }}>
              {plan.resumeViewLimit >= 9999 ? '∞' : plan.resumeViewLimit}
            </div>
            <div style={{ fontSize: 8, color: '#667085', fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>Resumes</div>
          </div>
        </div>
      )}

      {/* FEATURES (Show max 4, then "+X more") */}
      <div style={{ padding: '0 14px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {visibleFeatures.length === 0 ? (
            <div style={{ fontSize: 10, color: '#98A2B3', fontStyle: 'italic', padding: '4px 0' }}>No features listed</div>
          ) : (
            visibleFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#344054' }}>
                <MIcon name="check_circle" size={13} color={tier.accentColor} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
              </div>
            ))
          )}
          {hiddenCount > 0 && (
            <div style={{ fontSize: 10, color: tier.accentColor, fontWeight: 700, paddingLeft: 19 }}>
              +{hiddenCount} more feature{hiddenCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{ padding: '10px 14px 14px', display: 'flex', gap: 6, marginTop: 'auto' }}>
        <button onClick={onToggle} style={{
          flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer',
          background: plan.isActive ? '#ECFDF3' : '#F2F4F7',
          color: plan.isActive ? '#027A48' : '#667085',
          border: `1px solid ${plan.isActive ? '#A6F4C5' : '#D0D5DD'}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <MIcon name={plan.isActive ? 'radio_button_checked' : 'radio_button_unchecked'} size={11} color={plan.isActive ? '#027A48' : '#667085'} />
          {plan.isActive ? 'Active' : 'Paused'}
        </button>
        <button onClick={onBuy} style={{
          padding: '7px 12px', borderRadius: 7, border: 'none',
          background: tier.gradient, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          boxShadow: `0 2px 6px ${tier.accentColor}30`,
        }}>
          <MIcon name="shopping_bag" size={11} color="#fff" /> Test
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PLAN FORM MODAL (Validated)
   ═══════════════════════════════════════════════════════════ */
const PlanFormModal: React.FC<{
  plan: SubscriptionPlanPayload | null;
  audience: 'recruiters' | 'candidates';
  onClose: () => void;
  onSave: (payload: SubscriptionPlanPayload) => void;
}> = ({ plan, audience, onClose, onSave }) => {
  const [form, setForm] = useState<SubscriptionPlanPayload>({
    name: plan?.name || '', tier: plan?.tier || 'basic', audience: plan?.audience || audience,
    price: plan?.price || 0, priceYearly: plan?.priceYearly || 0, billingCycle: plan?.billingCycle || 'monthly',
    description: plan?.description || '', features: plan?.features || [], advantages: plan?.advantages || [],
    jobPostLimit: plan?.jobPostLimit || 0, resumeViewLimit: plan?.resumeViewLimit || 0,
    isPopular: plan?.isPopular || false, discountPercent: plan?.discountPercent || 0, trialDays: plan?.trialDays || 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Plan name is required';
    else if (form.name.length < 3) e.name = 'Min 3 characters';
    if (!form.description.trim()) e.description = 'Description is required';
    else if (form.description.length < 10) e.description = 'Min 10 characters';
    if (form.price <= 0) e.price = 'Price must be > 0';
    if (form.priceYearly > 0 && form.priceYearly < form.price) e.priceYearly = 'Should be ≥ monthly';
    if (form.discountPercent < 0 || form.discountPercent > 100) e.discountPercent = '0-100%';
    if (form.features.length === 0) e.features = 'Add at least 1 feature';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFeature = () => {
    const val = featureInput.trim();
    if (!val) return;
    if (form.features.includes(val)) { setErrors({ ...errors, fi: 'Already exists' }); return; }
    if (form.features.length >= 12) { setErrors({ ...errors, fi: 'Max 12' }); return; }
    setForm({ ...form, features: [...form.features, val] });
    setFeatureInput('');
    setErrors({ ...errors, fi: '', features: '' });
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await onSave({ ...form, name: form.name.trim(), description: form.description.trim() });
    setSaving(false);
  };

  const inp = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', border: `1.5px solid ${err ? '#F04438' : '#D0D5DD'}`,
    borderRadius: 8, fontSize: 12, outline: 'none', boxSizing: 'border-box', background: '#fff',
  });
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 };
  const errTxt: React.CSSProperties = { margin: '3px 0 0', fontSize: 10, color: '#F04438', fontWeight: 600 };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.6)', backdropFilter: 'blur(6px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 660, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        {/* HEADER */}
        <div style={{ padding: '16px 22px', background: '#F9FAFB', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6750A4,#7F56D9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MIcon name={plan ? 'edit' : 'add_circle'} size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#101828' }}>
                {plan ? `Edit: ${plan.name}` : `New ${audience === 'recruiters' ? 'Recruiter' : 'Candidate'} Plan`}
              </h2>
              <p style={{ margin: 0, fontSize: 10, color: '#667085' }}>Fields marked * are required</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 6, cursor: 'pointer', padding: 6, display: 'flex' }}>
            <MIcon name="close" size={18} color="#667085" />
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name + Tier */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Plan Name *</label>
              <input type="text" value={form.name} maxLength={60} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }); }} placeholder="e.g. Startup Basic" style={inp(errors.name)} />
              {errors.name && <p style={errTxt}>{errors.name}</p>}
            </div>
            <div>
              <label style={lbl}>Tier</label>
              <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as any })} style={inp()}>
                <option value="basic">🚀 Basic</option>
                <option value="pro">⭐ Pro</option>
                <option value="enterprise">💎 Enterprise</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description * ({form.description.length}/200)</label>
            <textarea value={form.description} maxLength={200} rows={2} onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }); }} placeholder="Brief summary shown on the plan card..." style={{ ...inp(errors.description), resize: 'vertical', fontFamily: 'inherit', minHeight: 50 }} />
            {errors.description && <p style={errTxt}>{errors.description}</p>}
          </div>

          {/* Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Monthly (₹) *</label>
              <input type="number" min={0} value={form.price} onChange={(e) => { setForm({ ...form, price: Math.max(0, Number(e.target.value)) }); setErrors({ ...errors, price: '' }); }} style={inp(errors.price)} />
              {errors.price && <p style={errTxt}>{errors.price}</p>}
            </div>
            <div>
              <label style={lbl}>Yearly (₹)</label>
              <input type="number" min={0} value={form.priceYearly} onChange={(e) => { setForm({ ...form, priceYearly: Math.max(0, Number(e.target.value)) }); setErrors({ ...errors, priceYearly: '' }); }} style={inp(errors.priceYearly)} />
              {errors.priceYearly && <p style={errTxt}>{errors.priceYearly}</p>}
            </div>
            <div>
              <label style={lbl}>Discount %</label>
              <input type="number" min={0} max={100} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Math.max(0, Math.min(100, Number(e.target.value))) })} style={inp(errors.discountPercent)} />
            </div>
          </div>

          {/* Limits (Recruiter) */}
          {audience === 'recruiters' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Job Post Limit</label>
                <input type="number" min={0} value={form.jobPostLimit} onChange={(e) => setForm({ ...form, jobPostLimit: Math.max(0, Number(e.target.value)) })} style={inp()} />
                <p style={{ margin: '2px 0 0', fontSize: 9, color: '#98A2B3' }}>9999 = unlimited</p>
              </div>
              <div>
                <label style={lbl}>Resume Limit</label>
                <input type="number" min={0} value={form.resumeViewLimit} onChange={(e) => setForm({ ...form, resumeViewLimit: Math.max(0, Number(e.target.value)) })} style={inp()} />
              </div>
              <div>
                <label style={lbl}>Trial Days</label>
                <input type="number" min={0} max={90} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: Math.max(0, Math.min(90, Number(e.target.value))) })} style={inp()} />
              </div>
            </div>
          )}

          {/* Features */}
          <div>
            <label style={lbl}>Features * ({form.features.length}/12)</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="text" value={featureInput} maxLength={80} onChange={(e) => { setFeatureInput(e.target.value); setErrors({ ...errors, fi: '' }); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} placeholder="e.g. 5 Job Posts per month" style={{ ...inp(errors.fi), flex: 1 }} />
              <button onClick={addFeature} disabled={!featureInput.trim()} style={{ padding: '0 14px', background: featureInput.trim() ? '#6750A4' : '#D0D5DD', color: '#fff', border: 'none', borderRadius: 8, cursor: featureInput.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, gap: 3 }}>
                <MIcon name="add" size={14} color="#fff" /> Add
              </button>
            </div>
            {errors.fi && <p style={{ ...errTxt, marginBottom: 4 }}>{errors.fi}</p>}
            {errors.features && <p style={{ ...errTxt, marginBottom: 4 }}>{errors.features}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 160, overflowY: 'auto' }}>
              {form.features.length === 0 ? (
                <div style={{ padding: 14, textAlign: 'center', fontSize: 11, color: '#98A2B3', border: '1px dashed #E4E7EC', borderRadius: 8 }}>
                  Add features that appear as checkmarks on the card
                </div>
              ) : form.features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F9FAFB', border: '1px solid #E4E7EC', borderRadius: 6, fontSize: 11 }}>
                  <MIcon name="check_circle" size={13} color="#6750A4" />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f}</span>
                  <button onClick={() => setForm({ ...form, features: form.features.filter((_, idx) => idx !== i) })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <MIcon name="close" size={12} color="#B42318" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Popular */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: form.isPopular ? '#F4F3FF' : '#F9FAFB', border: `1px solid ${form.isPopular ? '#6750A4' : '#E4E7EC'}`, borderRadius: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#6750A4' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#101828' }}>⭐ Mark as Popular</span>
          </label>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #E4E7EC', background: '#F9FAFB', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #D0D5DD', background: '#fff', color: '#344054', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: saving ? '#B0A0D8' : 'linear-gradient(135deg,#6750A4,#7F56D9)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: saving ? 'none' : '0 3px 10px rgba(103,80,164,0.3)' }}>
            <MIcon name={saving ? 'progress_activity' : 'save'} size={14} color="#fff" style={saving ? { animation: 'spin 1s linear infinite' } : {}} />
            {saving ? 'Saving...' : plan ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagementView;