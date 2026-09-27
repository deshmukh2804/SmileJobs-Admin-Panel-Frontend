// FILE: frontend/src/services/api.ts

/**
 * Single Source of Truth for frontend API Base URL.
 * Sanitizes input, performs environment checks, and throws clear warnings/errors.
 */
const getRawApiUrl = (): string => {
  const rawApiUrl = import.meta.env.VITE_API_URL;

  if (!rawApiUrl) {
    if (import.meta.env.PROD) {
      throw new Error(
        'VITE_API_URL is not configured. Please define VITE_API_URL in the production environment.'
      );
    } else {
      console.warn(
        'VITE_API_URL is missing from development environment variables. Falling back to development default: http://localhost:5001'
      );
      return 'http://localhost:5001';
    }
  }

  const normalized = rawApiUrl.replace(/\/+$/, '');

  // Detect local addresses in production environments
  if (import.meta.env.PROD) {
    const lower = normalized.toLowerCase();
    if (
      lower.includes('localhost') ||
      lower.includes('127.0.0.1') ||
      lower.includes('192.168.')
    ) {
      throw new Error(
        `Production Configuration Violation: VITE_API_URL cannot point to a local address ("${normalized}") in a production environment.`
      );
    }
  }

  return normalized;
};

export const RAW_API_BASE_URL = getRawApiUrl();

const resolveBaseUrl = () => {
  if (RAW_API_BASE_URL.endsWith('/api/v1')) return RAW_API_BASE_URL;
  return `${RAW_API_BASE_URL}/api/v1`;
};

export const API_BASE_URL = resolveBaseUrl();

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getJsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...getAuthHeader(),
});

// Convert nested JSON payload into FormData suitable for multipart upload
const buildFormData = (payload: any, logoFile: File | null, imageFiles: File[]) => {
  const form = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'object' && !Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
    } else if (Array.isArray(value)) {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, String(value));
    }
  });

  if (logoFile) form.append('logo', logoFile);
  imageFiles.forEach((file) => form.append('images', file));

  return form;
};

// ═══════════════════════════════════════════════════════════
// INSTANT AUTO-LOGOUT INTERCEPTOR FOR DELETED/DEACTIVATED USERS
// ═══════════════════════════════════════════════════════════
const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const res = await fetch(url, options);

  if (res.status === 401 || res.status === 403) {
    try {
      const data = await res.clone().json();
      if (
        data.accountStatus === 'deleted' ||
        data.accountStatus === 'deactivated' ||
        data.accountStatus === 'expired' ||
        data.message?.includes('deleted') ||
        data.message?.includes('deactivated')
      ) {
        window.dispatchEvent(
          new CustomEvent('auth:force_logout', {
            detail: {
              reason: data.message || 'Your account is no longer active.',
            },
          })
        );
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return res;
};

/* ═══════════════════════════════════════════════════════════
   JOB API
   ═══════════════════════════════════════════════════════════ */
export const jobApi = {
  async getJobs(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/jobs${query}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async getJob(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async getJobById(id: string) {
    return this.getJob(id);
  },

  async createJob(payload: any, logoFile?: File | null, imageFiles?: File[]) {
    const hasFiles = !!(logoFile || (imageFiles && imageFiles.length > 0));
    const adjustedPayload = { ...payload, status: 'Live' };

    let res;
    if (hasFiles) {
      const form = buildFormData(adjustedPayload, logoFile || null, imageFiles || []);
      res = await safeFetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: form,
      });
    } else {
      res = await safeFetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: getJsonHeaders(),
        body: JSON.stringify(adjustedPayload),
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create job');
    return data;
  },

  async updateJob(id: string, payload: any, logoFile?: File | null, imageFiles?: File[]) {
    const hasFiles = !!(logoFile || (imageFiles && imageFiles.length > 0));

    let res;
    if (hasFiles) {
      const form = buildFormData(payload, logoFile || null, imageFiles || []);
      res = await safeFetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader() },
        body: form,
      });
    } else {
      res = await safeFetch(`${API_BASE_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update job');
    return data;
  },

  async deleteJob(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async approveJob(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}/approve`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async rejectJob(id: string, reason?: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}/reject`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },

  async toggleFeature(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}/toggle-feature`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async toggleStatus(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async updateContactVisibility(jobId: string, whatsapp: boolean, mobile: boolean) {
    const res = await safeFetch(`${API_BASE_URL}/jobs/${jobId}/contact-visibility`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ whatsapp, mobile }),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   COMPANY API
   ═══════════════════════════════════════════════════════════ */
export const companyApi = {
  async getCompanyById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/companies/${id}`, { headers: getJsonHeaders() });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   WHATSAPP API
   ═══════════════════════════════════════════════════════════ */
export const whatsappApi = {
  async updateContactVisibility(jobId: string, whatsapp: boolean, mobile: boolean) {
    return jobApi.updateContactVisibility(jobId, whatsapp, mobile);
  },
};

/* ═══════════════════════════════════════════════════════════
   BANNER API
   ═══════════════════════════════════════════════════════════ */
export const bannerApi = {
  async getBanners(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/banners${query}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async getBannerById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/banners/${id}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async createBanner(payload: any, primaryFile: File, additionalFiles: File[] = [], mobileFile?: File | null) {
    if (!primaryFile) throw new Error('Primary banner image is required');
    if (additionalFiles.length > 4) throw new Error('Maximum 4 additional images allowed');

    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'object') form.append(key, JSON.stringify(value));
      else form.append(key, String(value));
    });

    form.append('image', primaryFile);
    additionalFiles.slice(0, 4).forEach((file) => form.append('images', file));
    if (mobileFile) form.append('mobileImage', mobileFile);

    const res = await safeFetch(`${API_BASE_URL}/banners`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: form,
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create banner');
    return data;
  },

  async updateBanner(id: string, payload: any, primaryFile?: File | null, additionalFiles: File[] = [], mobileFile?: File | null) {
    const hasFiles = !!(primaryFile || additionalFiles.length > 0 || mobileFile);

    let res;
    if (hasFiles) {
      const form = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'object') form.append(key, JSON.stringify(value));
        else form.append(key, String(value));
      });

      if (primaryFile) form.append('image', primaryFile);
      additionalFiles.slice(0, 4).forEach((file) => form.append('images', file));
      if (mobileFile) form.append('mobileImage', mobileFile);

      res = await safeFetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: { ...getAuthHeader() },
        body: form,
      });
    } else {
      res = await safeFetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update banner');
    return data;
  },

  async deleteBanner(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async toggleStatus(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/banners/${id}/toggle`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async reorderBanners(orders: Array<{ id: string; slot: number; priority: number }>) {
    const res = await safeFetch(`${API_BASE_URL}/banners/reorder`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ orders }),
    });
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to reorder banners');
    return data;
  },

  async bulkAction(ids: string[], action: 'activate' | 'pause' | 'archive' | 'delete') {
    const res = await safeFetch(`${API_BASE_URL}/banners/bulk`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify({ ids, action }),
    });
    return res.json();
  },

  async changeBannerPosition(id: string, newSlot: number) {
    const res = await safeFetch(`${API_BASE_URL}/banners/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify({ slot: newSlot }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to change banner position');
    return data;
  },

  async trackImpression(id: string) {
    try {
      await safeFetch(`${API_BASE_URL}/banners/${id}/impression`, { method: 'POST', headers: getJsonHeaders() });
    } catch {}
  },

  async trackClick(id: string) {
    try {
      await safeFetch(`${API_BASE_URL}/banners/${id}/click`, { method: 'POST', headers: getJsonHeaders() });
    } catch {}
  },
};

/* ═══════════════════════════════════════════════════════════
   PAYMENTS & SUBSCRIPTION API
   ═══════════════════════════════════════════════════════════ */
export interface SubscriptionPlanPayload {
  _id?: string;
  name: string;
  tier: 'basic' | 'pro' | 'enterprise';
  audience: 'recruiters' | 'candidates' | 'both';
  price: number;
  priceYearly: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  description: string;
  features: string[];
  advantages: string[];
  jobPostLimit: number;
  resumeViewLimit: number;
  isPopular: boolean;
  isActive?: boolean;
  discountPercent: number;
  trialDays: number;
}

export const subscriptionApi = {
  async getPlans(params?: { audience?: string; isActive?: string }) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/plans${query}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async createPlan(payload: SubscriptionPlanPayload) {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/plans`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updatePlan(id: string, payload: SubscriptionPlanPayload) {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/plans/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async toggleStatus(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/plans/${id}/toggle`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async deletePlan(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/plans/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async seedPlans() {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/seed`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getTransactions(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/transactions${query}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async getAnalytics() {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/analytics`, { headers: getJsonHeaders() });
    return res.json();
  },

  async triggerMockPurchase(payload: { planId: string; type: string; cycle: string }) {
    const res = await safeFetch(`${API_BASE_URL}/subscriptions/mock-transaction`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   ADMIN MANAGEMENT API
   ═══════════════════════════════════════════════════════════ */
export interface AdminUserPayload {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  lastLoginIP?: string;
  loginCount?: number;
  createdAt?: string;
  createdBy?: any;
}

export const adminApi = {
  async getAllAdmins(params?: { role?: string; isActive?: string; search?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/auth/admins${query}`, { headers: getJsonHeaders() });
    return res.json();
  },

  async createAdmin(payload: AdminUserPayload) {
    const res = await safeFetch(`${API_BASE_URL}/auth/admins`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateAdmin(id: string, payload: Partial<AdminUserPayload>) {
    const res = await safeFetch(`${API_BASE_URL}/auth/admins/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async toggleAdminStatus(id: string, reason?: string) {
    const res = await safeFetch(`${API_BASE_URL}/auth/admins/${id}/toggle`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ reason: reason || '' }),
    });
    return res.json();
  },

  async resetAdminPassword(id: string, newPassword: string) {
    const res = await safeFetch(`${API_BASE_URL}/auth/admins/${id}/reset-password`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    return res.json();
  },

  async deleteAdmin(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/auth/admins/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getMe() {
    const res = await safeFetch(`${API_BASE_URL}/auth/me`, { headers: getJsonHeaders() });
    return res.json();
  },

  async logout() {
    try {
      await safeFetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getJsonHeaders(),
      });
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
  },
};

/* ═══════════════════════════════════════════════════════════
   AUDIT LOG API
   ═══════════════════════════════════════════════════════════ */
export interface AuditLogEntry {
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
  endpoint?: string;
  method?: string;
  status: 'success' | 'failed' | 'warning';
  errorMessage?: string;
  createdAt: string;
}

export const auditApi = {
  async getLogs(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/auth/audit-logs${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   ROLES & PERMISSIONS API
   ═══════════════════════════════════════════════════════════ */
export const roleApi = {
  async getAllRoles() {
    const res = await safeFetch(`${API_BASE_URL}/roles`, { headers: getJsonHeaders() });
    return res.json();
  },

  async getAvailablePermissions() {
    const res = await safeFetch(`${API_BASE_URL}/roles/permissions`, { headers: getJsonHeaders() });
    return res.json();
  },

  async createRole(payload: {
    name: string;
    description?: string;
    permissions: string[];
    color?: string;
    icon?: string;
    landingPage?: string;
  }) {
    const res = await safeFetch(`${API_BASE_URL}/roles`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateRole(id: string, payload: {
    description?: string;
    permissions?: string[];
    color?: string;
    icon?: string;
    landingPage?: string;
    isActive?: boolean;
  }) {
    const res = await safeFetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deleteRole(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   APP CONFIG API — Mobile Bottom Navigation Bar Control
   ═══════════════════════════════════════════════════════════ */
export interface MobileBottomNavItemPayload {
  key: 'home' | 'allJobs' | 'activity' | 'premium' | 'profile';
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface MobileNavSizePayload {
  barHeight?: number;
  iconSize?: number;
  fontSize?: number;
  borderRadius?: number;
  horizontalPadding?: number;
  iconLabelGap?: number;
}

export interface MobileNavColorPayload {
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  badgeColor?: string;
  shadowColor?: string;
  shadowOpacity?: number;
}

export interface BottomNavConfigPayload {
  items?: MobileBottomNavItemPayload[];
  size?: MobileNavSizePayload;
  colors?: MobileNavColorPayload;
  isVisible?: boolean;
  showLabels?: boolean;
  showBadges?: boolean;
}

export const appConfigApi = {
  async getBottomNavConfig() {
    const res = await safeFetch(`${API_BASE_URL}/app-config/bottom-nav/admin`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async updateBottomNavConfig(config: BottomNavConfigPayload) {
    const res = await safeFetch(`${API_BASE_URL}/app-config/bottom-nav`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(config),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update bottom nav config');
    return data;
  },

  async resetBottomNavConfig() {
    const res = await safeFetch(`${API_BASE_URL}/app-config/bottom-nav/reset`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reset bottom nav config');
    return data;
  },

  async getMobileBottomNav() {
    const res = await safeFetch(`${API_BASE_URL}/app-config/bottom-nav`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   NOTIFICATION API (Admin Panel)
   Notifications are saved to DB — mobile app fetches them from DB
   ═══════════════════════════════════════════════════════════ */
export const notificationApi = {
  async getNotifications(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/notifications${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getNotificationById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/notifications/${id}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async sendNotification(payload: {
    title: string;
    body: string;
    imageUrl?: string;
    targetAudience: 'all' | 'candidates' | 'recruiters' | 'specific';
    targetUserIds?: string[];
    filters?: {
      city?: string;
      state?: string;
      experienceLevel?: string;
      skills?: string[];
      industry?: string;
    };
    channels?: { inApp?: boolean; email?: boolean };
    type?: string;
    actionUrl?: string;
    scheduledAt?: string;
  }) {
    const res = await safeFetch(`${API_BASE_URL}/notifications/send`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send notification');
    return data;
  },

  async previewCount(payload: {
    targetAudience: string;
    filters?: Record<string, any>;
    targetUserIds?: string[];
  }) {
    const res = await safeFetch(`${API_BASE_URL}/notifications/preview-count`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async cancelNotification(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/notifications/${id}/cancel`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async deleteNotification(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   PROMOTIONAL EMAIL API
   ═══════════════════════════════════════════════════════════ */
export const promoEmailApi = {
  async getCampaigns(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getCampaignById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/${id}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async createDraft(payload: {
    campaignName: string;
    subject: string;
    previewText?: string;
    htmlContent: string;
    templateType?: string;
    targetAudience?: string;
    targetUserIds?: string[];
    filters?: Record<string, any>;
    scheduledAt?: string;
  }) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/draft`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save draft');
    return data;
  },

  async sendCampaign(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/${id}/send`, {
      method: 'POST',
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send campaign');
    return data;
  },

  async sendNow(payload: {
    campaignName: string;
    subject: string;
    previewText?: string;
    htmlContent: string;
    templateType?: string;
    targetAudience?: string;
    targetUserIds?: string[];
    filters?: Record<string, any>;
  }) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/send-now`, {
      method: 'POST',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send campaign');
    return data;
  },

  async updateCampaign(id: string, payload: Record<string, any>) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/${id}`, {
      method: 'PUT',
      headers: getJsonHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to update campaign');
    return data;
  },

  async deleteCampaign(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async checkSmtpHealth() {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/smtp-health`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getTemplates() {
    const res = await safeFetch(`${API_BASE_URL}/promotional-emails/templates`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   USER MANAGEMENT API (Candidates + Recruiters)
   ═══════════════════════════════════════════════════════════ */
export const userManagementApi = {
  // ── CANDIDATES ──
  async getCandidates(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/user-management/candidates${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getCandidateById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/candidates/${id}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async toggleCandidateStatus(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/candidates/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async deleteCandidate(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/candidates/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  // ── RECRUITERS ──
  async getRecruiters(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/user-management/recruiters${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getRecruiterById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/recruiters/${id}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async toggleRecruiterStatus(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/recruiters/${id}/toggle-status`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async toggleRecruiterVerification(id: string) {
    const res = await safeFetch(
      `${API_BASE_URL}/user-management/recruiters/${id}/toggle-verification`,
      {
        method: 'PATCH',
        headers: getJsonHeaders(),
      }
    );
    return res.json();
  },

  async deleteRecruiter(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/user-management/recruiters/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   APPLICATION API
   ═══════════════════════════════════════════════════════════ */
export const applicationApi = {
  async getApplications(params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/applications${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getApplicationById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/applications/${id}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async updateApplicationStatus(id: string, status: string, hrNotes?: string) {
    const res = await safeFetch(`${API_BASE_URL}/applications/${id}/status`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ status, hrNotes }),
    });
    return res.json();
  },

  async deleteApplication(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/applications/${id}`, {
      method: 'DELETE',
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getApplicationsByJob(jobId: string, params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/applications/job/${jobId}${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async getApplicationsByUser(userId: string, params?: Record<string, any>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/applications/user/${userId}${query}`, {
      headers: getJsonHeaders(),
    });
    return res.json();
  },

  async bulkUpdateStatus(ids: string[], status: string) {
    const res = await safeFetch(`${API_BASE_URL}/applications/bulk-status`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ ids, status }),
    });
    return res.json();
  },
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD API — Real-time stats aggregated from database
   ═══════════════════════════════════════════════════════════ */
export const dashboardApi = {
  async getStats() {
    const res = await safeFetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load dashboard stats');
    }
    return data;
  },
};
/* ═══════════════════════════════════════════════════════════
   VERIFICATION API (Real backend from recruiter_db)
   ═══════════════════════════════════════════════════════════ */
export const verificationApi = {
  async getVerifications(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'oldest' | 'newest';
  }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const res = await safeFetch(`${API_BASE_URL}/verifications${query}`, {
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch verifications');
    return data;
  },

  async getVerificationById(id: string) {
    const res = await safeFetch(`${API_BASE_URL}/verifications/${id}`, {
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch verification detail');
    return data;
  },

  async approveVerification(id: string, adminNotes?: string) {
    const res = await safeFetch(`${API_BASE_URL}/verifications/${id}/approve`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ adminNotes: adminNotes || '' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to approve');
    return data;
  },

  async rejectVerification(id: string, reason: string, adminNotes?: string) {
    const res = await safeFetch(`${API_BASE_URL}/verifications/${id}/reject`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ reason, adminNotes: adminNotes || '' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to reject');
    return data;
  },

  async requestClarification(id: string, docs: string[], message: string) {
    const res = await safeFetch(`${API_BASE_URL}/verifications/${id}/request-clarification`, {
      method: 'PATCH',
      headers: getJsonHeaders(),
      body: JSON.stringify({ docs, message }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to request clarification');
    return data;
  },

  async getStats() {
    const res = await safeFetch(`${API_BASE_URL}/verifications/stats/overview`, {
      headers: getJsonHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Failed to fetch stats');
    return data;
  },
};