import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/api';

interface PricingData {
  _id?: string;
  enabled: boolean;
  price: number;
  priceInPaise: number;
  currency: string;
  updatedAt?: string;
}

// Helper: Build correct URL without duplicating /api/v1
const buildUrl = (path: string) => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  if (base.endsWith('/api/v1')) {
    return `${base}${path}`;
  }
  return `${base}/api/v1${path}`;
};

export const PricingSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [price, setPrice] = useState<string>('100');
  const [currency, setCurrency] = useState('INR');
  const [savedConfig, setSavedConfig] = useState<PricingData | null>(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(buildUrl('/pricing/settings'), {
        headers: getHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setEnabled(json.data.enabled !== false);
        setPrice(String(json.data.price || (json.data.priceInPaise ? json.data.priceInPaise / 100 : 100)));
        setCurrency(json.data.currency || 'INR');
        setSavedConfig(json.data);
      }
    } catch {
      showToast('Failed to fetch pricing from database', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price amount', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(buildUrl('/pricing/settings'), {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          enabled,
          price: priceNum,
          currency,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Profile price updated in database successfully!', 'success');
        setSavedConfig(json.data);
      } else {
        showToast(json.error || json.message || 'Failed to save', 'error');
      }
    } catch (err) {
      showToast('Network error while updating price', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        <span className="ml-3 text-gray-600 font-semibold">Loading price from database...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-semibold text-sm flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <span className="material-icons text-lg">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-icons text-blue-600">price_change</span>
            Candidate Profile Pricing
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Set the unlock fee for 1 candidate profile. Recruiters will be charged this exact amount.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition"
        >
          <span className="material-icons text-base">refresh</span>
          Refresh DB
        </button>
      </div>

      {/* Current Saved Price - Simple Badge */}
      {savedConfig && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Currently Active Price in Database</p>
            <p className="text-3xl font-black text-gray-900 mt-1">
              ₹{savedConfig.price ?? (savedConfig.priceInPaise ? savedConfig.priceInPaise / 100 : 100)}
              <span className="text-sm font-normal text-gray-500 ml-2">per profile</span>
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            savedConfig.enabled
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {savedConfig.enabled ? '✅ PAYWALL ON' : '🔓 PAYWALL OFF'}
          </div>
        </div>
      )}

      {/* Paywall Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="material-icons text-indigo-600">lock</span>
              Candidate Profile Paywall
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Turn ON to charge recruiters per profile view.
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className={`mt-4 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${
          enabled
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          <span className="material-icons text-base">
            {enabled ? 'paid' : 'lock_open'}
          </span>
          {enabled ? 'Paywall ACTIVE — Recruiters must pay' : 'Paywall DISABLED — Profiles are FREE'}
        </div>
      </div>

      {/* Price Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="material-icons text-emerald-600">payments</span>
          Set Unlock Price (1 Candidate Profile)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Price per Profile (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="100"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-2xl font-black text-gray-900 focus:border-blue-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-800 focus:border-blue-600 focus:outline-none bg-white h-[54px]"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          💡 Recruiter will be charged <strong>₹{price || 0}</strong> per unlock.
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-lg rounded-xl shadow-md transition flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            Saving to Database...
          </>
        ) : (
          <>
            <span className="material-icons">save</span>
            Save Price to Database
          </>
        )}
      </button>
    </div>
  );
};