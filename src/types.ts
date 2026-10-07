// FILE: frontend/src/types.ts

export type NavItem =
  | 'dashboard'
  | 'candidates'
  | 'recruiters'
  | 'jobs'
  | 'applications'
  | 'resumes-and-profiles'
  | 'verification'
  | 'payments-and-billing'
   | 'manage-subscriptions' 
  | 'reports-and-complaints'
  | 'content-management'
  | 'job-approvals' 
  | 'banners'
  | 'notifications'
  | 'roles-and-permissions'
  | 'platform-settings'
  | 'bottom-nav-config' 
  | 'admin-activity-log';

export type AdminRole = string;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  roles: AdminRole[];
  activeRole: AdminRole;
  department?: string;
  twoFactorEnabled: boolean;
  permissions?: NavItem[];
  landingPage?: NavItem;
}

export interface CustomRole {
  _id: string;
  name: string;
  description: string;
  permissions: NavItem[];
  isSystem: boolean;
  color: string;
  icon: string;
  landingPage: NavItem;
  isActive: boolean;
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionMeta {
  id: NavItem;
  label: string;
  icon: string;
  group: 'Overview' | 'Management' | 'Operations' | 'System';
  description: string;
  critical?: boolean;
}

export const ROLE_DEFAULT_TABS: Record<string, NavItem> = {
  'Super Admin': 'dashboard',
  'Admin': 'dashboard',
  'Moderator': 'verification',
  'Support Agent': 'reports-and-complaints',
  'Content Manager': 'content-management',
  'Finance Manager': 'payments-and-billing',
};

export const ROLE_PERMISSIONS: Record<string, NavItem[]> = {
  'Super Admin': [
    'dashboard',
    'candidates',
    'recruiters',
    'jobs',
    'applications',
    'resumes-and-profiles',
    'verification',
    'payments-and-billing',
    'manage-subscriptions',
    'reports-and-complaints',
    'content-management',
    'banners',
    'notifications',
    'roles-and-permissions',
    'platform-settings',
    'admin-activity-log',
    'bottom-nav-config', 
  ],
  'Admin': [
    'dashboard',
    'candidates',
    'recruiters',
    'jobs',
    'applications',
    'resumes-and-profiles',
    'verification',
    'reports-and-complaints',
    'content-management',
    'banners',
    'notifications',
    'admin-activity-log',
    'bottom-nav-config', 
  ],
  'Moderator': [
    'verification',
    'jobs',
    'candidates',
    'recruiters',
    'resumes-and-profiles',
    'reports-and-complaints',
    'admin-activity-log',
    'bottom-nav-config', 
  ],
  'Support Agent': [
    'reports-and-complaints',
    'candidates',
    'recruiters',
    'resumes-and-profiles',
    'applications',
    'notifications',
    'bottom-nav-config', 
  ],
  'Content Manager': [
    'content-management',
    'banners',
    'notifications',
    'resumes-and-profiles',
    'bottom-nav-config', 
  ],
  'Finance Manager': [
    'payments-and-billing',
    'dashboard',
    'reports-and-complaints',
    'bottom-nav-config', 
  ],
};

export const ROLE_METADATA: Record<
  string,
  {
    badgeClass: string;
    description: string;
    landingModule: string;
    level: string;
  }
> = {
  'Super Admin': {
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Unrestricted enterprise control, security policies, billing & global oversight.',
    landingModule: 'Dashboard Overview',
    level: 'Tier 1 • Full Authority',
  },
  'Admin': {
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Operational administration across jobs, users, applications, and general queues.',
    landingModule: 'Dashboard Overview',
    level: 'Tier 2 • Operational',
  },
  'Moderator': {
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Compliance auditing, statutory KYC inspection, employer verification & trust safety.',
    landingModule: 'Verification & Approval Queue',
    level: 'Tier 3 • Compliance',
  },
  'Support Agent': {
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Candidate assistance, employer tickets, dispute mediation & incident resolution.',
    landingModule: 'Reports & Complaints',
    level: 'Tier 3 • Customer Ops',
  },
  'Content Manager': {
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Editorial guides, spotlight banners, marketing campaigns & notifications.',
    landingModule: 'Content Management',
    level: 'Tier 3 • Marketing & Editorial',
  },
  'Finance Manager': {
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Corporate billing, Razorpay/Stripe reconciliation, invoices & revenue audit.',
    landingModule: 'Payments & Billing',
    level: 'Tier 2 • Financial Ledger',
  },
};

export const getRoleBadgeClass = (role: string): string => {
  return ROLE_METADATA[role]?.badgeClass || 'bg-gray-100 text-gray-700 border-gray-300';
};

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  initials?: string;
  role: 'Candidate' | 'Employer';
  status: 'Active' | 'Pending' | 'Blocked';
  joinedDate: string;
  verificationStatus: 'Verified' | 'Unverified' | 'Flagged';
  location: string;
  tag?: string;
  companyName?: string;
}

export interface JobItem {
  id: string;
  title: string;
  company: string;
  companyName?: string;
  companyInitials: string;
  companyLogo?: string | null;
  companyWebsite?: string;
  isCompanyVerified?: boolean;
  industry?: string;
  establishedYear?: number | null;
  organizationSize?: string;
  companyAddress?: {
    city?: string;
    state?: string;
    country?: string;
  };
  companyImages?: Array<{ url: string; publicId?: string }>;
  location: string;
  locationDetails?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  workMode: string;
  jobType: string;
  department?: string;
  role?: string;
  qualification?: string;
  salaryRange: string;
  salaryPeriod?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  experience?: {
    min?: number;
    max?: number;
    text?: string;
  };
  experienceRange?: string;
  noticePeriod?: string;
  status: string;
  featured?: boolean;
  isNew?: boolean;
  isActive?: boolean;
  applicantsCount: number;
  applicantsCap: number;
  contactVisibility?: {
    whatsapp?: boolean;
    mobile?: boolean;
  };
  description?: string;
  jobDescription?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  skills?: string[];
  languages?: string[];
  jobTiming?: string;
  workingDays?: string;
  contactPerson?: {
    name?: string;
    designation?: string;
  };
  recruiterWhatsappNumber?: string;
  recruiterMobileNumber?: string;
  recruiterEmail?: string;
  applicationUrl?: string;
  noPaymentInvolved?: boolean;
  postedDate?: string;
  postedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
  whatsapp?: { enabled: boolean; url?: string };
  notes?: string;
}

export interface VerificationItem {
  id: string;
  code: string;
  title: string;
  initials: string;
  type: 'Employer Verification' | 'Candidate KYC' | 'Staffing License' | 'Branch Office Addition';
  priority: 'Critical' | 'High Priority' | 'Medium Priority' | 'Normal Priority';
  slaWarning?: string;
  slaUrgent?: boolean;
  submittedTime: string;
  representativeName: string;
  representativeRole?: string;
  representativeEmail?: string;
  ocrAlert?: string;
  documents: {
    name: string;
    type: string;
    verified: boolean;
    tag?: string;
  }[];
  ocrMatchScore?: number;
  status: 'pending' | 'approved' | 'rejected' | 'clarification';
  inspectedDoc?: {
    filename: string;
    totalPages: number;
    currentPage: number;
    ministryHeader: string;
    docTitle: string;
    docLegalNote: string;
    entityName: string;
    incorporationDate: string;
    cin: string;
    pan: string;
    sealNote: string;
    registrarLocation: string;
    ocrMatch: string;
    checks: {
      name: string;
      detail: string;
      result: string;
      isExact?: boolean;
    }[];
    auditorRemarks: string;
  };
}

export interface ActivityItem {
  id: string;
  type: 'job' | 'kyc' | 'payment' | 'candidate' | 'complaint' | 'approval';
  title: string;
  statusTag: string;
  statusTagColor: 'purple' | 'green' | 'red' | 'lavender';
  description: string;
  timestamp: string;
}

export type MobileNavKey = 'home' | 'allJobs' | 'activity' | 'premium' | 'profile';

export interface MobileBottomNavItem {
  key: MobileNavKey;
  label: string;
  icon: string;
  enabled: boolean;
  order: number;
}

export interface MobileNavSizeConfig {
  barHeight: number;
  iconSize: number;
  fontSize: number;
  borderRadius: number;
  horizontalPadding: number;
  iconLabelGap: number;
}

export interface MobileNavColorConfig {
  backgroundColor: string;
  activeColor: string;
  inactiveColor: string;
  badgeColor: string;
  shadowColor: string;
  shadowOpacity: number;
}

export interface MobileBottomNavConfig {
  items: MobileBottomNavItem[];
  size: MobileNavSizeConfig;
  colors: MobileNavColorConfig;
  isVisible: boolean;
  showLabels: boolean;
  showBadges: boolean;
}

export const MOBILE_NAV_DEFAULTS: MobileBottomNavConfig = {
  items: [
    { key: 'home', label: 'Home', icon: 'Home', enabled: true, order: 1 },
    { key: 'allJobs', label: 'All Jobs', icon: 'Briefcase', enabled: true, order: 2 },
    { key: 'activity', label: 'Activity', icon: 'Activity', enabled: true, order: 3 },
    { key: 'premium', label: 'Premium', icon: 'Crown', enabled: true, order: 4 },
    { key: 'profile', label: 'Profile', icon: 'User', enabled: true, order: 5 },
  ],
  size: {
    barHeight: 60,
    iconSize: 24,
    fontSize: 11,
    borderRadius: 0,
    horizontalPadding: 8,
    iconLabelGap: 4,
  },
  colors: {
    backgroundColor: '#FFFFFF',
    activeColor: '#4F46E5',
    inactiveColor: '#9CA3AF',
    badgeColor: '#EF4444',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
  },
  isVisible: true,
  showLabels: true,
  showBadges: true,
};

export const MOBILE_NAV_ITEM_META: Record<
  MobileNavKey,
  { label: string; icon: string; description: string; color: string }
> = {
  home: {
    label: 'Home',
    icon: 'Home',
    description: 'Main landing screen with featured jobs & recommendations',
    color: '#4F46E5',
  },
  allJobs: {
    label: 'All Jobs',
    icon: 'Briefcase',
    description: 'Full job listing with search, filters & map view',
    color: '#059669',
  },
  activity: {
    label: 'Activity',
    icon: 'Activity',
    description: 'Application tracking, notifications & interview schedule',
    color: '#D97706',
  },
  premium: {
    label: 'Premium',
    icon: 'Crown',
    description: 'Subscription plans, premium features & upgrade prompts',
    color: '#7C3AED',
  },
  profile: {
    label: 'Profile',
    icon: 'User',
    description: 'User profile, resume, settings & account management',
    color: '#DC2626',
  },
};


// ═══════════════════════════════════════════════════════════
// DASHBOARD STATS TYPES (real-time data from backend)
// ═══════════════════════════════════════════════════════════
export interface DashboardKpi {
  value: number;
  change?: number;
  subtitle?: string;
  expedited?: number;
  total?: number;
}

export interface DashboardStats {
  kpis: {
    totalCandidates: DashboardKpi;
    totalEmployers: DashboardKpi;
    activeJobs: DashboardKpi;
    applications: DashboardKpi;
    pendingVerification: DashboardKpi;
    reportsComplaints: DashboardKpi;
    verifiedCompanies: DashboardKpi;
    newUsersToday: DashboardKpi;
  };
  growthChart: {
    months: string[];
    candidates: number[];
    employers: number[];
    applications: number[];
  };
  jobsByCategory: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  applicationPipeline: {
    total: number;
    stages: Array<{
      name: string;
      count: number;
      percentage: number;
    }>;
  };
  jobFunnel: {
    total: number;
    live: { count: number; percentage: number };
    pending: { count: number; percentage: number };
    archived: { count: number; percentage: number };
  };
  activityFeed: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    statusTag: string;
    timestamp: string;
  }>;
  pendingVerifications: Array<{
    id: string;
    code: string;
    title: string;
    initials: string;
    type: string;
    submittedTime: string;
    documents: Array<{ name: string; verified: boolean }>;
  }>;
  systemHealth: {
    uptime: string;
    uptimeStatus: string;
    pendingCritical: number;
  };
}


// ═══════════════════════════════════════════════════════════
// VERIFICATION TYPES (Real Backend Data)
// ═══════════════════════════════════════════════════════════
export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'clarification_requested';

export interface VerificationListItem {
  id: string;
  code: string;
  title: string;
  initials: string;
  type: string;
  priority: string;
  submittedTime: string;
  submittedAtRaw: string;
  representativeName: string;
  representativeEmail: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentsCount: number;
  documents: Array<{ name: string; type: string; verified: boolean }>;
}

export interface VerificationDocument {
  id: string;
  docType: string;
  docTypeLabel: string;
  docName: string;
  url: string;
  publicId: string;
  format: string;
  size: number;
  sizeFormatted: string;
  uploadedAt: string;
  uploadedTime: string;
  isImage: boolean;
}

export interface VerificationDetail {
  id: string;
  code: string;
  title: string;
  initials: string;
  status: VerificationStatus;
  submittedAt: string;
  submittedTime: string;
  reviewedAt?: string;
  reviewedBy: string;
  rejectionReason: string;
  adminNotes: string;
  clarificationDocs: string[];
  clarificationMessage: string;
  company: {
    name: string;
    industry: string;
    website: string;
    linkedIn: string;
    about: string;
    tagline: string;
    logoUrl: string;
    city: string;
    state: string;
    country: string;
    address: string;
    headquarters: string;
    registrationNumber: string;
    gstNumber: string;
    panNumber: string;
    foundedYear: string | number;
    teamSize: string;
    organizationSize: string;
    perks: string[];
  };
  recruiter: {
    id: string | null;
    name: string;
    email: string;
    avatar: string;
    designation: string;
    loginMethod: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    verificationStatus: string;
    lastLogin: string | null;
    contactPerson: { name?: string; designation?: string };
    contactEmail: string;
    contactPhone: string;
    whatsappNumber: string;
  };
  documents: VerificationDocument[];
}

export interface VerificationStats {
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  clarification_requested: number;
  submittedToday: number;
  approvedThisWeek: number;
  totalPending: number;
}

export const DOC_TYPE_OPTIONS = [
  { value: 'company_registration', label: 'Company Registration' },
  { value: 'gst_certificate', label: 'GST Certificate' },
  { value: 'incorporation_certificate', label: 'Incorporation Certificate' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'authorization_letter', label: 'Authorization Letter' },
  { value: 'other', label: 'Other Document' },
];