// FILE: frontend/src/views/PostJobView.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { jobApi } from '../services/api';

/* ─────────────────────────────────────────────────────────────────────────
   TS INTERFACES & INITIAL STATE (Full API schema retained)
   ───────────────────────────────────────────────────────────────────────── */
export interface PostJobViewProps {
  onClose: () => void;
  onSuccess: () => void;
  editJobId?: string | null;
}

interface JobFormData {
  title: string;
  department: string;
  role: string;
  jobType: string;
  workMode: string;
  qualification: string;
  applicationUrl: string;
  status: string;

  locationAddress: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;

  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryPeriod: string;
  experienceMin: string;
  experienceMax: string;
  experienceText: string;
  noticePeriod: string;

  jobDescription: string;
  skills: string;
  languages: string;
  responsibilities: string;
  requirements: string;
  benefits: string;

  jobTiming: string;
  workingDays: string;

  companyName: string;
  companyWebsite: string;
  industry: string;
  establishedYear: string;
  organizationSize: string;
  companyAddressCity: string;
  companyAddressState: string;
  companyAddressCountry: string;

  recruiterName: string;
  recruiterDesignation: string;
  recruiterEmail: string;
  recruiterMobileNumber: string;
  recruiterWhatsappNumber: string;

  contactVisibilityWhatsapp: boolean;
  contactVisibilityMobile: boolean;

  noPaymentInvolved: boolean;
  featured: boolean;
}

const initialFormData: JobFormData = {
  title: '', department: '', role: '', jobType: 'Full-Time', workMode: 'On-site',
  qualification: '', applicationUrl: '', status: 'Draft',
  locationAddress: '', locationCity: '', locationState: '', locationCountry: 'India',
  salaryMin: '', salaryMax: '', salaryCurrency: 'INR', salaryPeriod: 'month',
  experienceMin: '', experienceMax: '', experienceText: '', noticePeriod: '',
  jobDescription: '', skills: '', languages: '', responsibilities: '', requirements: '', benefits: '',
  jobTiming: '10:00 AM to 05:00 PM', workingDays: 'Mon - Fri',
  companyName: '', companyWebsite: '', industry: '', establishedYear: '', organizationSize: '',
  companyAddressCity: '', companyAddressState: '', companyAddressCountry: 'India',
  recruiterName: '', recruiterDesignation: '', recruiterEmail: '',
  recruiterMobileNumber: '', recruiterWhatsappNumber: '',
  contactVisibilityWhatsapp: false, contactVisibilityMobile: false,
  noPaymentInvolved: true, featured: false,
};

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

/* ─────────────────────────────────────────────────────────────────────────
   PRESET SUGGESTION LISTS
   ───────────────────────────────────────────────────────────────────────── */
const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis',
  'HTML', 'CSS', 'Tailwind CSS', 'Sass', 'Bootstrap', 'Next.js', 'Vue.js', 'Angular',
  'Express.js', 'Django', 'Flask', 'Spring Boot', 'GraphQL', 'REST API',
  'Git', 'GitHub', 'CI/CD', 'Jenkins', 'Linux',
  'Unity 3D', 'Unreal Engine', 'AR/VR', 'Blender', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
  'Data Analysis', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'SQL',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management', 'Agile', 'Scrum',
];

const LANGUAGE_SUGGESTIONS = [
  'English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam',
  'Bengali', 'Punjabi', 'Odia', 'Assamese', 'Urdu', 'Sanskrit',
  'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Korean', 'Arabic',
];

const BENEFIT_SUGGESTIONS = [
  'Health Insurance', 'Medical Insurance', 'Life Insurance', 'Dental Coverage',
  'Annual Bonus', 'Performance Bonus', 'Joining Bonus', 'Stock Options', 'ESOPs',
  'Paid Time Off', 'Flexible Working Hours', 'Work From Home', 'Remote Work',
  'Provident Fund', 'Gratuity', 'Meal Coupons', 'Free Meals', 'Cab Facility',
  'Gym Membership', 'Wellness Programs', 'Mental Health Support',
  'Training & Development', 'Certification Reimbursement', 'Learning Budget',
  'Maternity Leave', 'Paternity Leave', 'Childcare Support',
  'Relocation Assistance', 'Housing Allowance', 'Internet Reimbursement',
];

const DESIGNATION_SUGGESTIONS = [
  'HR Manager', 'HR Lead', 'HR Executive', 'HR Business Partner', 'Senior HR Manager',
  'Talent Acquisition Manager', 'Talent Acquisition Specialist', 'Talent Acquisition Lead',
  'Recruiter', 'Senior Recruiter', 'Technical Recruiter', 'Lead Recruiter', 'Recruitment Manager',
  'Hiring Manager', 'People Operations Manager', 'People & Culture Lead',
  'CEO', 'CTO', 'COO', 'CHRO', 'Founder', 'Co-Founder', 'Director', 'Managing Director',
  'VP of Engineering', 'VP of HR', 'VP of People',
  'Team Lead', 'Engineering Manager', 'Project Manager', 'Product Manager',
  'Operations Manager', 'Admin Manager', 'Office Manager',
];

const ORGANIZATION_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-100 employees',
  '100-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5001-10000 employees',
  '10000+ employees',
];

const NOTICE_PERIOD_OPTIONS = [
  'Immediate Joiner',
  '15 Days',
  '30 Days / 1 Month',
  '45 Days',
  '60 Days / 2 Months',
  '90 Days / 3 Months',
  'Serving Notice Period',
  'Flexible / Negotiable',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const INDIAN_CITIES: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur', 'Amravati', 'Navi Mumbai'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Vijayapura', 'Shivamogga'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Noida'],
  'Delhi': ['New Delhi', 'Delhi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Chandigarh': ['Chandigarh'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
};

const ALL_CITIES = Array.from(new Set(Object.values(INDIAN_CITIES).flat())).sort();
const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY'];
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥' };
const getCurrencySymbol = (c: string): string => CURRENCY_SYMBOLS[(c || '').toUpperCase().trim()] || (c || '').trim() || '';

const PERIOD_OPTIONS: Array<{ value: string; label: string; short: string }> = [
  { value: 'hour', label: 'Hourly', short: 'hr' }, { value: 'day', label: 'Daily', short: 'day' },
  { value: 'week', label: 'Weekly', short: 'wk' }, { value: 'month', label: 'Monthly', short: 'mo' },
  { value: 'year', label: 'Yearly', short: 'yr' },
];

const formatNumberIN = (v: string): string => { if (!v) return ''; const n = Number(v); if (isNaN(n)) return v; return n.toLocaleString('en-IN'); };

/* ─────────────────────────────────────────────────────────────────────────
   HELPER FUNCTIONS & FORMATTERS
   ───────────────────────────────────────────────────────────────────────── */
const convertTo24h = (timeStr: string): string => {
  if (!timeStr) return '10:00';
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '10:00';
  let hours = parseInt(match[1], 10); const minutes = match[2]; const ampm = match[3];
  if (ampm) { if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12; if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0; }
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const parseJobTimingString = (str?: string): { start: string; end: string } => {
  if (!str) return { start: '10:00', end: '17:00' };
  const parts = str.trim().split(/\s*(?:to|-|–|—|→)\s*/i);
  if (parts.length >= 2) return { start: convertTo24h(parts[0]), end: convertTo24h(parts[1]) };
  return { start: '10:00', end: '17:00' };
};

const parseWorkingDaysString = (str?: string): string[] => {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (!str) return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const cleaned = str.trim();
  if (cleaned.includes('-') || cleaned.includes('–')) {
    const parts = cleaned.split(/\s*(?:-|–)\s*/);
    if (parts.length === 2) {
      const startIdx = order.findIndex((d) => d.toLowerCase() === parts[0].trim().toLowerCase().slice(0, 3));
      const endIdx = order.findIndex((d) => d.toLowerCase() === parts[1].trim().toLowerCase().slice(0, 3));
      if (startIdx !== -1 && endIdx !== -1) {
        const range = []; const start = Math.min(startIdx, endIdx); const end = Math.max(startIdx, endIdx);
        for (let i = start; i <= end; i++) range.push(order[i]); return range;
      }
    }
  }
  const list = cleaned.split(',').map((s) => s.trim().slice(0, 3));
  return order.filter((d) => list.some((item) => d.toLowerCase().startsWith(item.toLowerCase())));
};

const serializeWorkingDays = (selected: string[]): string => {
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const sorted = [...selected].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  if (sorted.length === 0) return '';
  let isConsecutive = true;
  const indices = sorted.map((d) => order.indexOf(d));
  for (let i = 1; i < indices.length; i++) { if (indices[i] !== indices[i - 1] + 1) { isConsecutive = false; break; } }
  if (isConsecutive && sorted.length > 2) return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
  return sorted.join(', ');
};

const sanitizePhoneInput = (raw: string): string => {
  if (!raw) return ''; let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length > 10) digits = digits.slice(0, 10); return digits;
};

const extractTenDigitPhone = (raw: string | null | undefined): string => {
  if (!raw) return ''; let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10); return digits;
};

const formatTo12hString = (t24: string): string => {
  if (!t24 || !t24.includes(':')) return '10:00 AM';
  const [hStr, mStr] = t24.split(':'); const h = parseInt(hStr, 10) || 0; const m = parseInt(mStr, 10) || 0;
  const period = h >= 12 ? 'PM' : 'AM'; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
};

/* ─────────────────────────────────────────────────────────────────────────
   MERGED SECTION LABELS (9 sections)
   ───────────────────────────────────────────────────────────────────────── */
const sectionLabels = [
  'Basic Info',
  'Company Info',
  'Job Description',
  'Skills & Requirements',
  'Salary & Experience',
  'Location & Schedule',
  'Recruiter & Contact',
  'Logo & Showcase',
  'Status & Settings',
];

/* ─────────────────────────────────────────────────────────────────────────
   FIELD TO SECTION MAPPINGS
   ───────────────────────────────────────────────────────────────────────── */
const FIELD_TO_SECTION: Record<string, { index: number; sectionName: string; friendlyName: string }> = {
  title: { index: 0, sectionName: 'Basic Info', friendlyName: 'Job Title' },
  department: { index: 0, sectionName: 'Basic Info', friendlyName: 'Department' },
  role: { index: 0, sectionName: 'Basic Info', friendlyName: 'Role / Designation' },
  jobType: { index: 0, sectionName: 'Basic Info', friendlyName: 'Job Type' },
  workMode: { index: 0, sectionName: 'Basic Info', friendlyName: 'Work Mode' },
  qualification: { index: 0, sectionName: 'Basic Info', friendlyName: 'Qualification' },
  applicationUrl: { index: 0, sectionName: 'Basic Info', friendlyName: 'Application URL' },
  companyName: { index: 1, sectionName: 'Company Info', friendlyName: 'Company Name' },
  companyWebsite: { index: 1, sectionName: 'Company Info', friendlyName: 'Company Website' },
  industry: { index: 1, sectionName: 'Company Info', friendlyName: 'Industry' },
  establishedYear: { index: 1, sectionName: 'Company Info', friendlyName: 'Established Year' },
  organizationSize: { index: 1, sectionName: 'Company Info', friendlyName: 'Organization Size' },
  jobDescription: { index: 2, sectionName: 'Job Description', friendlyName: 'Job Description' },
  skills: { index: 3, sectionName: 'Skills & Requirements', friendlyName: 'Skills' },
  requirements: { index: 3, sectionName: 'Skills & Requirements', friendlyName: 'Requirements' },
  responsibilities: { index: 3, sectionName: 'Skills & Requirements', friendlyName: 'Responsibilities' },
  benefits: { index: 3, sectionName: 'Skills & Requirements', friendlyName: 'Benefits' },
  languages: { index: 3, sectionName: 'Skills & Requirements', friendlyName: 'Languages' },
  salaryMin: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Minimum Salary' },
  salaryMax: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Maximum Salary' },
  salaryCurrency: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Currency' },
  experienceMin: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Minimum Experience' },
  experienceMax: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Maximum Experience' },
  noticePeriod: { index: 4, sectionName: 'Salary & Experience', friendlyName: 'Notice Period' },
  locationAddress: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'Full Address' },
  locationCity: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'City' },
  locationState: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'State' },
  locationCountry: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'Country' },
  jobTiming: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'Job Timing' },
  workingDays: { index: 5, sectionName: 'Location & Schedule', friendlyName: 'Working Days' },
  recruiterName: { index: 6, sectionName: 'Recruiter & Contact', friendlyName: 'Recruiter Name' },
  recruiterDesignation: { index: 6, sectionName: 'Recruiter & Contact', friendlyName: 'Recruiter Designation' },
  recruiterEmail: { index: 6, sectionName: 'Recruiter & Contact', friendlyName: 'Recruiter Email' },
  recruiterMobileNumber: { index: 6, sectionName: 'Recruiter & Contact', friendlyName: 'Mobile Number' },
  recruiterWhatsappNumber: { index: 6, sectionName: 'Recruiter & Contact', friendlyName: 'WhatsApp Number' },
};

const VALIDATORS = {
  required: (v: string) => (!v || !v.trim() ? 'This field is required' : ''),
  url: (v: string) => { if (!v) return ''; return /^https?:\/\/([\w\-]+\.)+[\w\-]+(\/.*)?$/.test(v) ? '' : 'Must start with http:// or https://'; },
  email: (v: string) => { if (!v) return ''; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address'; },
  phone: (v: string) => { if (!v) return ''; const trimmed = v.trim(); if (!/^\d+$/.test(trimmed)) return 'Only digits (0-9) allowed'; if (trimmed.length !== 10) return 'Must be exactly 10 digits'; return ''; },
  number: (v: string, min?: number, max?: number) => { if (!v) return ''; if (!/^\d+(\.\d+)?$/.test(v)) return 'Must be a valid number'; const num = Number(v); if (min !== undefined && num < min) return `Minimum value: ${min}`; if (max !== undefined && num > max) return `Maximum value: ${max}`; return ''; },
  year: (v: string) => { if (!v) return ''; const year = Number(v); const current = new Date().getFullYear(); if (!/^\d{4}$/.test(v)) return 'Must be a 4-digit year'; if (year < 1800 || year > current) return `Year must be between 1800 and ${current}`; return ''; },
  minLength: (v: string, len: number) => { if (!v) return ''; return v.trim().length < len ? `Must be at least ${len} characters` : ''; },
};

/* ─────────────────────────────────────────────────────────────────────────
   TAG / CHIP INPUT COMPONENT
   ───────────────────────────────────────────────────────────────────────── */
interface TagInputProps { value: string; onChange: (val: string) => void; placeholder?: string; suggestions?: string[]; chipColor?: string; chipBg?: string; chipBorder?: string; }

const TagInput = memo(function TagInput({ value, onChange, placeholder, suggestions = [], chipColor = '#6750A4', chipBg = '#E8DEF8', chipBorder = '#D6BBFB' }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = useMemo(() => value.split(',').map((s) => s.trim()).filter(Boolean), [value]);

  const addTag = useCallback((raw: string) => {
    const trimmed = raw.trim(); if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) { setInput(''); return; }
    onChange([...tags, trimmed].join(', ')); setInput('');
  }, [tags, onChange]);

  const removeTag = useCallback((index: number) => { onChange(tags.filter((_, i) => i !== index).join(', ')); }, [tags, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input); }
    else if (e.key === 'Backspace' && !input && tags.length > 0) { removeTag(tags.length - 1); }
  }, [input, tags, addTag, removeTag]);

  const filteredSuggestions = useMemo(() => {
    if (!input.trim() || !suggestions.length) return [];
    const lower = input.toLowerCase();
    return suggestions.filter((s) => s.toLowerCase().includes(lower) && !tags.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 8);
  }, [input, suggestions, tags]);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, border: '1.5px solid #D0D5DD', borderRadius: 10, padding: '8px 10px', minHeight: 46, background: '#fff', cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
        {tags.map((tag, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: chipBg, color: chipColor, border: `1px solid ${chipBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
            {tag}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 14, fontWeight: 700, color: chipColor, lineHeight: 1, display: 'flex', alignItems: 'center' }} title="Remove">×</button>
          </span>
        ))}
        <input ref={inputRef} type="text" value={input} onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }} onKeyDown={handleKeyDown} onFocus={() => setShowSuggestions(true)} onBlur={() => { setTimeout(() => setShowSuggestions(false), 180); if (input.trim()) addTag(input); }} placeholder={tags.length === 0 ? placeholder : ''} style={{ flex: 1, minWidth: 130, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#1D2939', padding: '4px 2px' }} />
      </div>
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: 200, overflowY: 'auto' }}>
          {filteredSuggestions.map((sug, idx) => (
            <div key={idx} onMouseDown={(e) => { e.preventDefault(); addTag(sug); }} style={{ padding: '8px 12px', fontSize: 13, color: '#344054', cursor: 'pointer', borderBottom: idx < filteredSuggestions.length - 1 ? '1px solid #F2F4F7' : 'none' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')} onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}>{sug}</div>
          ))}
        </div>
      )}
      <p style={{ margin: '5px 0 0', fontSize: 11, color: '#98A2B3' }}>
        Press <strong>Enter</strong> or <strong>comma</strong> to add · Click <strong>×</strong> to remove
        {tags.length > 0 && <span style={{ marginLeft: 6, color: '#6750A4', fontWeight: 600 }}>({tags.length} added)</span>}
      </p>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   SEARCHABLE COMBOBOX
   ───────────────────────────────────────────────────────────────────────── */
interface ComboBoxProps { value: string; onChange: (val: string) => void; options: string[]; placeholder?: string; error?: string; onBlur?: () => void; compact?: boolean; }

const ComboBox = memo(function ComboBox({ value, onChange, options, placeholder, error, onBlur, compact = false }: ComboBoxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSearch(value || ''); }, [value]);
  useEffect(() => { const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, []);

  const filteredOptions = useMemo(() => { if (!search.trim()) return options; const lower = search.toLowerCase(); return options.filter((opt) => opt.toLowerCase().includes(lower)); }, [search, options]);
  const showAddCustom = search.trim().length > 0 && !options.some((opt) => opt.toLowerCase() === search.trim().toLowerCase());
  const handleSelect = useCallback((val: string) => { onChange(val); setSearch(val); setOpen(false); if (onBlur) onBlur(); }, [onChange, onBlur]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${error ? '#F04438' : open ? '#6750A4' : '#D0D5DD'}`, borderRadius: 10, background: error ? '#FEF3F2' : '#fff', height: compact ? 40 : 44, padding: '0 10px', gap: 6, transition: 'border-color 0.15s' }}>
        <input ref={inputRef} type="text" value={search} placeholder={placeholder} onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => { setTimeout(() => { if (onBlur) onBlur(); }, 150); }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: compact ? 13 : 14, background: 'transparent', color: '#1D2939', minWidth: 0 }} />
        <button type="button" onClick={() => { setOpen((p) => !p); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#98A2B3', fontSize: 10, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</button>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 250, maxHeight: 240, overflowY: 'auto' }}>
          {filteredOptions.length > 0 ? filteredOptions.map((opt, idx) => (
            <div key={idx} onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }} style={{ padding: '10px 14px', fontSize: 13, color: opt === value ? '#6750A4' : '#344054', fontWeight: opt === value ? 700 : 500, cursor: 'pointer', background: opt === value ? '#F4F3FF' : '#fff', borderBottom: idx < filteredOptions.length - 1 || showAddCustom ? '1px solid #F2F4F7' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onMouseEnter={(e) => { if (opt !== value) e.currentTarget.style.background = '#F9FAFB'; }} onMouseLeave={(e) => { if (opt !== value) e.currentTarget.style.background = '#fff'; }}>
              <span>{opt}</span>{opt === value && <span style={{ fontSize: 12 }}>✓</span>}
            </div>
          )) : !showAddCustom && (<div style={{ padding: '12px 14px', fontSize: 12, color: '#98A2B3', textAlign: 'center' }}>No matches found</div>)}
          {showAddCustom && (
            <div onMouseDown={(e) => { e.preventDefault(); handleSelect(search.trim()); }} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', background: '#F0F9FF', color: '#0369A1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#E0F2FE')} onMouseLeave={(e) => (e.currentTarget.style.background = '#F0F9FF')}>
              <span style={{ fontSize: 16 }}>+</span><span>Add <strong>"{search.trim()}"</strong> as custom entry</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────
   ANALOG CLOCK PICKER COMPONENT
   ───────────────────────────────────────────────────────────────────────── */
interface AnalogClockPickerProps { label: string; value: string; onChange: (val: string) => void; accentColor?: string; }

const AnalogClockPicker = memo(function AnalogClockPicker({ label, value, onChange, accentColor = '#6750A4' }: AnalogClockPickerProps) {
  const clockRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);
  const [h24, m] = value.split(':').map((v) => parseInt(v, 10) || 0);
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const hour12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;

  const updateTime = (newHour12: number, newMinute: number, newPeriod: 'AM' | 'PM') => {
    let h = newHour12 % 12; if (newPeriod === 'PM') h += 12;
    onChange(`${h.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`);
  };

  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { let val = parseInt(e.target.value.replace(/\D/g, ''), 10); if (isNaN(val)) return; if (val < 1) val = 12; if (val > 12) val = 12; updateTime(val, m, period); };
  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { let val = parseInt(e.target.value.replace(/\D/g, ''), 10); if (isNaN(val)) return; if (val < 0) val = 0; if (val > 59) val = 59; updateTime(hour12, val, period); };

  const handleClockInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
    let clientX = 0; let clientY = 0;
    if ('touches' in e) { if (e.touches.length === 0) return; clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = e.clientX; clientY = e.clientY; }
    const dx = clientX - centerX; const dy = clientY - centerY;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; if (angle < 0) angle += 360;
    if (mode === 'hour') { let selected = Math.round(angle / 30); if (selected === 0) selected = 12; if (selected > 12) selected = 12; updateTime(selected, m, period); }
    else { const selected = Math.round(angle / 6) % 60; updateTime(hour12, selected, period); }
  };

  const handleModeSelection = () => { if (mode === 'hour') setTimeout(() => setMode('minute'), 200); setIsDragging(false); };

  const size = 180; const center = size / 2; const numberRadius = 60;
  const handAngle = mode === 'hour' ? (hour12 % 12) * 30 : m * 6;
  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handX = center + numberRadius * Math.cos(handRad); const handY = center + numberRadius * Math.sin(handRad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#FCFBFF', border: '1.5px solid #E4E7EC', borderRadius: 14, padding: 12, width: 200 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#667085', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#F2F4F7', borderRadius: 8, padding: '4px 8px' }}>
          <input type="text" pattern="[0-9]*" inputMode="numeric" value={hour12.toString().padStart(2, '0')} onFocus={() => setMode('hour')} onChange={handleHourInputChange} style={{ width: 24, textAlign: 'center', border: 'none', background: mode === 'hour' ? accentColor : 'transparent', color: mode === 'hour' ? '#fff' : '#1D2939', borderRadius: 4, fontSize: 14, fontWeight: 'bold', outline: 'none' }} />
          <span style={{ color: '#475467', fontWeight: 'bold' }}>:</span>
          <input type="text" pattern="[0-9]*" inputMode="numeric" value={m.toString().padStart(2, '0')} onFocus={() => setMode('minute')} onChange={handleMinuteInputChange} style={{ width: 24, textAlign: 'center', border: 'none', background: mode === 'minute' ? accentColor : 'transparent', color: mode === 'minute' ? '#fff' : '#1D2939', borderRadius: 4, fontSize: 14, fontWeight: 'bold', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button type="button" onClick={() => updateTime(hour12, m, 'AM')} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: period === 'AM' ? accentColor : '#F2F4F7', color: period === 'AM' ? '#fff' : '#475467' }}>AM</button>
          <button type="button" onClick={() => updateTime(hour12, m, 'PM')} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 'bold', border: 'none', cursor: 'pointer', background: period === 'PM' ? accentColor : '#F2F4F7', color: period === 'PM' ? '#fff' : '#475467' }}>PM</button>
        </div>
      </div>
      <svg ref={clockRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        onMouseDown={(e) => { setIsDragging(true); handleClockInteraction(e); }} onMouseMove={(e) => { if (isDragging) handleClockInteraction(e); }} onMouseUp={handleModeSelection} onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => { setIsDragging(true); handleClockInteraction(e); }} onTouchMove={(e) => { if (isDragging) handleClockInteraction(e); }} onTouchEnd={handleModeSelection}
        style={{ cursor: 'pointer', userSelect: 'none', touchAction: 'none' }}>
        <circle cx={center} cy={center} r={75} fill="#F5F0FF" stroke={accentColor} strokeWidth="1" opacity="0.5" />
        {mode === 'hour'
          ? Array.from({ length: 12 }, (_, i) => { const num = i + 1; const angle = (num * 30 - 90) * (Math.PI / 180); const x = center + numberRadius * Math.cos(angle); const y = center + numberRadius * Math.sin(angle); const isSelected = num === hour12; return (<g key={num}>{isSelected && <circle cx={x} cy={y} r="11" fill={accentColor} />}<text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" fill={isSelected ? '#FFFFFF' : '#475467'} style={{ pointerEvents: 'none' }}>{num}</text></g>); })
          : Array.from({ length: 12 }, (_, i) => { const num = i * 5; const angle = (num * 6 - 90) * (Math.PI / 180); const x = center + numberRadius * Math.cos(angle); const y = center + numberRadius * Math.sin(angle); const isSelected = num === m || (num === 0 && m === 0); return (<g key={num}>{isSelected && <circle cx={x} cy={y} r="11" fill={accentColor} />}<text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill={isSelected ? '#FFFFFF' : '#475467'} style={{ pointerEvents: 'none' }}>{num.toString().padStart(2, '0')}</text></g>); })}
        <line x1={center} y1={center} x2={handX} y2={handY} stroke={accentColor} strokeWidth="2" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
        <circle cx={center} cy={center} r="3.5" fill={accentColor} style={{ pointerEvents: 'none' }} />
        {mode === 'minute' && m % 5 !== 0 && <circle cx={handX} cy={handY} r="3" fill={accentColor} style={{ pointerEvents: 'none' }} />}
      </svg>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   MAIN PostJobView COMPONENT
   ═══════════════════════════════════════════════ */
export const PostJobView: React.FC<PostJobViewProps> = ({ onClose, onSuccess, editJobId }) => {
  const isEditing = !!editJobId;
  const [activeSection, setActiveSection] = useState(0);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [timingStart, setTimingStart] = useState('10:00');
  const [timingEnd, setTimingEnd] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const TOTAL_SECTIONS = sectionLabels.length; // 9

  useEffect(() => {
    const timingString = `${formatTo12hString(timingStart)} to ${formatTo12hString(timingEnd)}`;
    const daysString = serializeWorkingDays(selectedDays);
    setFormData((prev) => ({ ...prev, jobTiming: timingString, workingDays: daysString }));
  }, [timingStart, timingEnd, selectedDays]);

  useEffect(() => {
    if (editJobId) {
      const fetchJobData = async () => {
        setIsFetching(true);
        try {
          const response = await jobApi.getJobById(editJobId);
          const job = response.data?.job || response.data;
          const localMobile = extractTenDigitPhone(job.recruiterMobileNumber || job.contactPerson?.phone);
          const localWhatsapp = extractTenDigitPhone(job.recruiterWhatsappNumber || job.contactPerson?.whatsapp);
          setFormData({
            title: job.title || '', department: job.department || '', role: job.role || '',
            jobType: job.jobType || 'Full-Time', workMode: job.workMode || 'On-site',
            qualification: job.qualification || '', applicationUrl: job.applicationUrl || '', status: job.status || 'Draft',
            locationAddress: job.location?.address || job.locationDetails?.fullAddress || '',
            locationCity: job.location?.city || job.locationDetails?.city || '',
            locationState: job.location?.state || job.locationDetails?.state || '',
            locationCountry: job.location?.country || job.locationDetails?.country || 'India',
            salaryMin: job.salary?.min?.toString() || '', salaryMax: job.salary?.max?.toString() || '',
            salaryCurrency: job.salary?.currency || 'INR', salaryPeriod: job.salary?.period || 'month',
            experienceMin: job.experience?.min?.toString() || '', experienceMax: job.experience?.max?.toString() || '',
            experienceText: job.experience?.text || '',
            noticePeriod: job.noticePeriod || '',
            jobDescription: job.jobDescription || job.description || '',
            skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
            languages: Array.isArray(job.languages) ? job.languages.join(', ') : '',
            responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : '',
            requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '',
            benefits: Array.isArray(job.benefits) ? job.benefits.join(', ') : '',
            jobTiming: job.jobTiming || '10:00 AM to 05:00 PM', workingDays: job.workingDays || 'Mon - Fri',
            companyName: job.companyName || job.company || '', companyWebsite: job.companyWebsite || '',
            industry: job.industry || '', establishedYear: job.company?.establishedYear?.toString() || '',
            organizationSize: job.company?.organizationSize || job.organizationSize || '',
            companyAddressCity: job.company?.address?.city || '', companyAddressState: job.company?.address?.state || '',
            companyAddressCountry: job.company?.address?.country || 'India',
            recruiterName: job.contactPerson?.name || '', recruiterDesignation: job.contactPerson?.designation || '',
            recruiterEmail: job.recruiterEmail || job.contactPerson?.email || '',
            recruiterMobileNumber: localMobile, recruiterWhatsappNumber: localWhatsapp,
            contactVisibilityWhatsapp: !!job.contactVisibility?.whatsapp, contactVisibilityMobile: !!job.contactVisibility?.mobile,
            noPaymentInvolved: job.noPaymentInvolved !== false, featured: !!job.featured,
          });
          if (job.jobTiming) { const parsedTiming = parseJobTimingString(job.jobTiming); setTimingStart(parsedTiming.start); setTimingEnd(parsedTiming.end); }
          if (job.workingDays) { setSelectedDays(parseWorkingDaysString(job.workingDays)); }
          if (job.companyLogo) { const logoUrl = typeof job.companyLogo === 'string' ? job.companyLogo : job.companyLogo.url; setExistingLogoUrl(logoUrl); setLogoPreview(logoUrl); }
          if (Array.isArray(job.companyImages)) { const urls = job.companyImages.map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean); setExistingImageUrls(urls); setImagePreviews(urls); }
        } catch (err: any) { setError(err.message || 'Failed to load job profile'); }
        finally { setIsFetching(false); }
      };
      fetchJobData();
    }
  }, [editJobId]);

  const validateField = useCallback((name: string, value: any): string => {
    switch (name) {
      case 'title': return VALIDATORS.required(value) || VALIDATORS.minLength(value, 3);
      case 'companyName': return VALIDATORS.required(value) || VALIDATORS.minLength(value, 2);
      case 'locationCity': return VALIDATORS.required(value);
      case 'jobDescription': return VALIDATORS.required(value) || VALIDATORS.minLength(value, 20);
      case 'companyWebsite': case 'applicationUrl': return VALIDATORS.url(value);
      case 'recruiterEmail': return VALIDATORS.email(value);
      case 'recruiterMobileNumber': case 'recruiterWhatsappNumber': return VALIDATORS.phone(value);
      case 'salaryMin': case 'salaryMax': return VALIDATORS.number(value, 0);
      case 'experienceMin': case 'experienceMax': return VALIDATORS.number(value, 0, 50);
      case 'establishedYear': return VALIDATORS.year(value);
      default: return '';
    }
  }, []);

  const validateAll = useCallback((): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => { const err = validateField(key, (formData as any)[key]); if (err) errors[key] = err; });
    if (formData.salaryMin && formData.salaryMax && !errors.salaryMin && !errors.salaryMax) { if (Number(formData.salaryMin) > Number(formData.salaryMax)) errors.salaryMax = 'Maximum salary must be greater than or equal to minimum salary'; }
    if (formData.experienceMin && formData.experienceMax && !errors.experienceMin && !errors.experienceMax) { if (Number(formData.experienceMin) > Number(formData.experienceMax)) errors.experienceMax = 'Maximum experience must be greater than or equal to minimum experience'; }
    if (formData.contactVisibilityWhatsapp && !String(formData.recruiterWhatsappNumber || '').trim()) errors.recruiterWhatsappNumber = 'WhatsApp number is required when WhatsApp visibility is enabled';
    if (formData.contactVisibilityMobile && !String(formData.recruiterMobileNumber || '').trim()) errors.recruiterMobileNumber = 'Mobile number is required when mobile visibility is enabled';
    return { valid: Object.keys(errors).length === 0, errors };
  }, [formData, validateField]);

  useEffect(() => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      const sMinRaw = formData.salaryMin; const sMaxRaw = formData.salaryMax;
      const sMaxBase = VALIDATORS.number(sMaxRaw, 0);
      if (sMaxBase) next.salaryMax = sMaxBase;
      else if (sMinRaw && sMaxRaw && Number(sMinRaw) > Number(sMaxRaw)) next.salaryMax = 'Maximum salary must be greater than or equal to minimum salary';
      else if (next.salaryMax) delete next.salaryMax;
      const eMinRaw = formData.experienceMin; const eMaxRaw = formData.experienceMax;
      const eMaxBase = VALIDATORS.number(eMaxRaw, 0, 50);
      if (eMaxBase) next.experienceMax = eMaxBase;
      else if (eMinRaw && eMaxRaw && Number(eMinRaw) > Number(eMaxRaw)) next.experienceMax = 'Maximum experience must be greater than or equal to minimum experience';
      else if (next.experienceMax) delete next.experienceMax;
      return next;
    });
  }, [formData.salaryMin, formData.salaryMax, formData.experienceMin, formData.experienceMax]);

  useEffect(() => { if (showErrorSummary && Object.keys(fieldErrors).length === 0) { setShowErrorSummary(false); setError(null); } }, [fieldErrors, showErrorSummary]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    if (name === 'recruiterMobileNumber' || name === 'recruiterWhatsappNumber') newValue = sanitizePhoneInput(value);
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (touchedFields[name] || fieldErrors[name]) {
      const err = validateField(name, newValue);
      setFieldErrors((prev) => { const next = { ...prev }; if (err) next[name] = err; else delete next[name]; return next; });
    }
  }, [touchedFields, fieldErrors, validateField]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => { const next = { ...prev }; if (err) next[name] = err; else delete next[name]; return next; });
  }, [validateField]);

  const handleToggleDays = useCallback((day: string) => { setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])); }, []);
  const applyWorkingDaysPreset = useCallback((preset: 'weekdays' | 'extended' | 'weekends' | 'flexible') => {
    const presets: Record<string, string[]> = { weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], extended: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], weekends: ['Sat', 'Sun'], flexible: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
    setSelectedDays(presets[preset] || presets.weekdays);
  }, []);

  const handleToggle = useCallback((field: 'contactVisibilityWhatsapp' | 'contactVisibilityMobile') => {
    const newValue = !formData[field];
    if (newValue) {
      const phoneField = field === 'contactVisibilityWhatsapp' ? 'recruiterWhatsappNumber' : 'recruiterMobileNumber';
      const phoneLabel = field === 'contactVisibilityWhatsapp' ? 'WhatsApp' : 'mobile';
      const phoneVal = String((formData as any)[phoneField] || '').trim();
      if (!phoneVal) { setError(`Please enter a valid 10-digit ${phoneLabel} number first before enabling visibility`); setFieldErrors((prev) => ({ ...prev, [phoneField]: `${phoneLabel.charAt(0).toUpperCase() + phoneLabel.slice(1)} number is required to enable visibility` })); setTouchedFields((prev) => ({ ...prev, [phoneField]: true })); return; }
      const err = VALIDATORS.phone(phoneVal);
      if (err) { setError(`Please fix the ${phoneLabel} number format before enabling visibility`); setFieldErrors((prev) => ({ ...prev, [phoneField]: err })); setTouchedFields((prev) => ({ ...prev, [phoneField]: true })); return; }
    }
    setError(null);
    setFormData((prev) => ({ ...prev, [field]: newValue }));
  }, [formData]);

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Logo must be an image file'); return; }
    if (file.size > MAX_LOGO_SIZE) { setError('Logo file size must be less than 5MB'); return; }
    setError(null); setLogoFile(file); setExistingLogoUrl(null);
    const reader = new FileReader(); reader.onload = (ev) => setLogoPreview(ev.target?.result as string); reader.readAsDataURL(file);
  }, []);

  const handleRemoveLogo = useCallback(() => { setLogoFile(null); setLogoPreview(null); setExistingLogoUrl(null); if (logoInputRef.current) logoInputRef.current.value = ''; }, []);

  const handleImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    const availableSlots = MAX_IMAGES - (imageFiles.length + existingImageUrls.length);
    if (availableSlots <= 0) { setError(`Maximum ${MAX_IMAGES} images allowed`); return; }
    const filesToAdd = files.slice(0, availableSlots);
    for (const file of filesToAdd) { if (!file.type.startsWith('image/')) { setError('All files must be images'); return; } if (file.size > MAX_IMAGE_SIZE) { setError(`Image "${file.name}" exceeds 5MB limit`); return; } }
    setError(null); setImageFiles((prev) => [...prev, ...filesToAdd]);
    filesToAdd.forEach((file) => { const reader = new FileReader(); reader.onload = (ev) => { setImagePreviews((prev) => [...prev, ev.target?.result as string]); }; reader.readAsDataURL(file); });
    if (imagesInputRef.current) imagesInputRef.current.value = '';
  }, [imageFiles, existingImageUrls]);

  const handleRemoveImage = useCallback((index: number) => {
    const existingCount = existingImageUrls.length;
    if (index < existingCount) { setExistingImageUrls((prev) => prev.filter((_, i) => i !== index)); setImagePreviews((prev) => prev.filter((_, i) => i !== index)); }
    else { const fileIndex = index - existingCount; setImageFiles((prev) => prev.filter((_, i) => i !== fileIndex)); setImagePreviews((prev) => prev.filter((_, i) => i !== index)); }
  }, [existingImageUrls]);

  const sectionHasErrors = useCallback((sectionIdx: number): boolean => {
    return Object.keys(fieldErrors).some((fieldName) => { const info = FIELD_TO_SECTION[fieldName]; return info && info.index === sectionIdx && !!fieldErrors[fieldName]; });
  }, [fieldErrors]);

  const errorsBySection = useMemo(() => {
    const grouped: Record<number, Array<{ field: string; friendlyName: string; error: string; sectionName: string }>> = {};
    Object.keys(fieldErrors).forEach((fieldName) => {
      const info = FIELD_TO_SECTION[fieldName];
      if (info && fieldErrors[fieldName]) { if (!grouped[info.index]) grouped[info.index] = []; grouped[info.index].push({ field: fieldName, friendlyName: info.friendlyName, error: fieldErrors[fieldName], sectionName: info.sectionName }); }
    });
    return grouped;
  }, [fieldErrors]);

  const buildJobPayload = useCallback(() => {
    const payload: any = {
      title: formData.title.trim(), department: formData.department.trim(), role: formData.role.trim(),
      jobType: formData.jobType, workMode: formData.workMode, qualification: formData.qualification.trim(),
      applicationUrl: formData.applicationUrl.trim(), status: formData.status,
      location: { address: formData.locationAddress.trim(), city: formData.locationCity.trim(), state: formData.locationState.trim(), country: formData.locationCountry.trim() },
      salary: { min: formData.salaryMin ? Number(formData.salaryMin) : undefined, max: formData.salaryMax ? Number(formData.salaryMax) : undefined, currency: formData.salaryCurrency, period: formData.salaryPeriod },
      experience: { min: formData.experienceMin ? Number(formData.experienceMin) : undefined, max: formData.experienceMax ? Number(formData.experienceMax) : undefined, text: formData.experienceText.trim() },
      noticePeriod: formData.noticePeriod.trim(),
      jobDescription: formData.jobDescription.trim(),
      skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      languages: formData.languages.split(',').map((s) => s.trim()).filter(Boolean),
      responsibilities: formData.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean),
      requirements: formData.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
      benefits: formData.benefits.split(',').map((s) => s.trim()).filter(Boolean),
      jobTiming: formData.jobTiming.trim(), workingDays: formData.workingDays.trim(),
      companyName: formData.companyName.trim(), companyWebsite: formData.companyWebsite.trim(), industry: formData.industry.trim(),
      company: { establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined, organizationSize: formData.organizationSize.trim() },
      organizationSize: formData.organizationSize.trim(),
      contactPerson: { name: formData.recruiterName.trim(), designation: formData.recruiterDesignation.trim() },
      recruiterEmail: formData.recruiterEmail.trim(),
      recruiterMobileNumber: formData.recruiterMobileNumber.trim() ? `+91${formData.recruiterMobileNumber.trim()}` : '',
      recruiterWhatsappNumber: formData.recruiterWhatsappNumber.trim() ? `+91${formData.recruiterWhatsappNumber.trim()}` : '',
      contactVisibility: { whatsapp: formData.contactVisibilityWhatsapp, mobile: formData.contactVisibilityMobile },
      noPaymentInvolved: formData.noPaymentInvolved, featured: formData.featured,
    };
    if (isEditing && existingImageUrls.length > 0) payload.existingImages = existingImageUrls;
    if (isEditing && existingLogoUrl && !logoFile) payload.keepExistingLogo = true;
    return payload;
  }, [formData, isEditing, existingImageUrls, existingLogoUrl, logoFile]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccessMessage(null);
    const { valid, errors } = validateAll();
    if (!valid) {
      setFieldErrors(errors); const touched: Record<string, boolean> = { ...touchedFields };
      Object.keys(errors).forEach((k) => (touched[k] = true)); setTouchedFields(touched); setShowErrorSummary(true);
      const firstErrorField = Object.keys(errors)[0]; const sectionInfo = FIELD_TO_SECTION[firstErrorField];
      if (sectionInfo) { setActiveSection(sectionInfo.index); setError(`Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} in "${sectionInfo.sectionName}"`); }
      else { setError(`Please fix the ${Object.keys(errors).length} highlighted errors before submitting`); }
      return;
    }
    setShowErrorSummary(false); setIsLoading(true);
    try {
      const payload = buildJobPayload();
      if (isEditing && editJobId) { await jobApi.updateJob(editJobId, payload, logoFile || undefined, imageFiles.length > 0 ? imageFiles : undefined); setSuccessMessage('Job listing updated successfully!'); }
      else { await jobApi.createJob(payload, logoFile || undefined, imageFiles.length > 0 ? imageFiles : undefined); setSuccessMessage('Job listing created successfully!'); }
      setTimeout(() => onSuccess(), 1500);
    } catch (err: any) { setError(err.message || 'An error occurred while saving the job listing'); }
    finally { setIsLoading(false); }
  }, [validateAll, touchedFields, buildJobPayload, isEditing, editJobId, logoFile, imageFiles, onSuccess]);

  /* ─── Styling Helpers ─── */
  const getFieldContainerStyle = (name: string): React.CSSProperties => {
    const hasError = touchedFields[name] && fieldErrors[name];
    return { display: 'flex', alignItems: 'stretch', border: `1.5px solid ${hasError ? '#F04438' : '#D0D5DD'}`, borderRadius: 10, overflow: 'hidden', height: 44, background: hasError ? '#FEF3F2' : '#fff', transition: 'all 0.2s' };
  };

  const getInputStyle = (name: string): React.CSSProperties => {
    const hasError = touchedFields[name] && fieldErrors[name];
    return { width: '100%', padding: '10px 12px', border: `1.5px solid ${hasError ? '#F04438' : '#D0D5DD'}`, borderRadius: 10, fontSize: 14, outline: 'none', background: hasError ? '#FEF3F2' : '#fff', color: '#1D2939', boxSizing: 'border-box', transition: 'border-color 0.15s ease' };
  };

  const getSelectStyle = (name: string): React.CSSProperties => ({
    ...getInputStyle(name), appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23667085' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '20px',
  });

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#344054', marginBottom: 6, display: 'block' };
  const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.04)' };
  const cardHeaderStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F2F4F7' };
  const FieldError = ({ name }: { name: string }) => { if (!touchedFields[name] || !fieldErrors[name]) return null; return (<span style={{ color: '#F04438', fontSize: 11, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {fieldErrors[name]}</span>); };

  const salaryRangeInvalid = !!(formData.salaryMin && formData.salaryMax && !VALIDATORS.number(formData.salaryMin, 0) && !VALIDATORS.number(formData.salaryMax, 0) && Number(formData.salaryMin) > Number(formData.salaryMax));
  const experienceRangeInvalid = !!(formData.experienceMin && formData.experienceMax && !VALIDATORS.number(formData.experienceMin, 0, 50) && !VALIDATORS.number(formData.experienceMax, 0, 50) && Number(formData.experienceMin) > Number(formData.experienceMax));
  const swapSalary = useCallback(() => { setFormData((prev) => ({ ...prev, salaryMin: prev.salaryMax, salaryMax: prev.salaryMin })); }, []);
  const swapExperience = useCallback(() => { setFormData((prev) => ({ ...prev, experienceMin: prev.experienceMax, experienceMax: prev.experienceMin })); }, []);
  const currencySymbol = getCurrencySymbol(formData.salaryCurrency);
  const activePeriod = PERIOD_OPTIONS.find((p) => p.value === formData.salaryPeriod);
  const salaryPreview = useMemo(() => { const min = formData.salaryMin ? `${currencySymbol}${formatNumberIN(formData.salaryMin)}` : ''; const max = formData.salaryMax ? `${currencySymbol}${formatNumberIN(formData.salaryMax)}` : ''; const per = activePeriod ? ` / ${activePeriod.short}` : ''; if (min && max) return `${min} – ${max}${per}`; if (min) return `From ${min}${per}`; if (max) return `Up to ${max}${per}`; return 'Not disclosed'; }, [formData.salaryMin, formData.salaryMax, currencySymbol, activePeriod]);
  const experiencePreview = useMemo(() => { const min = formData.experienceMin; const max = formData.experienceMax; if (min && max) return `${min} – ${max} years`; if (min) return `${min}+ years`; if (max) return `Up to ${max} years`; return 'Any experience'; }, [formData.experienceMin, formData.experienceMax]);
  const errorCount = Object.keys(fieldErrors).filter((k) => fieldErrors[k]).length;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1800 + 1 }, (_, i) => (currentYear - i).toString());

  if (isFetching) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)' }}>
        <div style={{ background: '#fff', padding: '24px 40px', borderRadius: 16, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <span className="postjob-spinner" /><p style={{ margin: '12px 0 0', fontSize: 14, color: '#475467', fontWeight: 600 }}>Loading job details...</p>
        </div>
        <style>{`.postjob-spinner { width: 32px; height: 32px; border: 3px solid rgba(103, 80, 164, 0.2); border-top-color: #6750A4; border-radius: 50%; display: inline-block; animation: postjob-spin 0.6s linear infinite; } @keyframes postjob-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '96%', maxWidth: 980, height: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1D2939' }}>{isEditing ? 'Edit Job Listing' : 'Create New Job Listing'}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#667085' }}>Section: {sectionLabels[activeSection]}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 26, color: '#667085', cursor: 'pointer', padding: 4, lineHeight: 1 }}>×</button>
        </div>

        {/* Alerts */}
        {error && (<div style={{ background: '#FEF3F2', borderBottom: '1px solid #FECDCA', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: '#F04438', fontSize: 16 }}>⚠️</span><span style={{ fontSize: 13, color: '#B42318', fontWeight: 600, flex: 1 }}>{error}</span><button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#F04438', cursor: 'pointer', fontSize: 14 }}>✕</button></div>)}
        {successMessage && (<div style={{ background: '#ECFDF3', borderBottom: '1px solid #D1FADF', padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ color: '#12B76A', fontSize: 16 }}>✓</span><span style={{ fontSize: 13, color: '#027A48', fontWeight: 600 }}>{successMessage}</span></div>)}

        {showErrorSummary && errorCount > 0 && (
          <div style={{ background: '#FEF3F2', borderBottom: '2px solid #FDA29B', padding: '14px 28px', maxHeight: 150, overflowY: 'auto' }}>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#B42318' }}>{errorCount} Error{errorCount > 1 ? 's' : ''} must be resolved before posting:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px 16px' }}>
              {Object.keys(errorsBySection).map((secIdxStr) => {
                const idx = Number(secIdxStr); const errorsList = errorsBySection[idx];
                return (
                  <div key={idx} style={{ background: '#fff', borderRadius: 8, padding: 8, border: '1px solid #FECDCA' }}>
                    <button type="button" onClick={() => setActiveSection(idx)} style={{ background: 'none', border: 'none', color: '#6750A4', fontWeight: 700, fontSize: 11, cursor: 'pointer', padding: 0, textAlign: 'left', textDecoration: 'underline', marginBottom: 4, display: 'block' }}>Section {idx + 1}: {sectionLabels[idx]} →</button>
                    <ul style={{ margin: 0, paddingLeft: 12, fontSize: 10, color: '#475467' }}>{errorsList.map((err, itemIdx) => (<li key={itemIdx}><strong>{err.friendlyName}:</strong> {err.error}</li>))}</ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sidebar Nav + Form Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 220, borderRight: '1px solid #E4E7EC', overflowY: 'auto', padding: '12px 0', flexShrink: 0, background: '#FAFAFA' }}>
            {sectionLabels.map((lbl, idx) => {
              const hasErr = sectionHasErrors(idx); const isActive = activeSection === idx;
              return (
                <button key={idx} type="button" onClick={() => setActiveSection(idx)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 18px', border: 'none', background: isActive ? '#E8DEF8' : 'transparent', color: hasErr ? '#F04438' : isActive ? '#6750A4' : '#344054', fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', borderLeft: isActive ? '3px solid #6750A4' : '3px solid transparent' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: hasErr ? '#FEE4E2' : isActive ? '#6750A4' : '#E4E7EC', color: hasErr ? '#F04438' : isActive ? '#fff' : '#667085', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{hasErr ? '!' : idx + 1}</span>
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{lbl}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} noValidate style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, background: '#FCFCFD' }}>

            {/* ══════ SECTION 0: Basic Info ══════ */}
            {activeSection === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Basic Job Information</h3>
                <div><label style={labelStyle}>Job Title *</label><input type="text" name="title" value={formData.title} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. AR / VR Developer" style={getInputStyle('title')} /><FieldError name="title" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Department</label><input type="text" name="department" value={formData.department} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Software Engineering" style={getInputStyle('department')} /></div>
                  <div><label style={labelStyle}>Role / Designation</label><input type="text" name="role" value={formData.role} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. AR / VR Lead Developer" style={getInputStyle('role')} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Job Type</label><select name="jobType" value={formData.jobType} onChange={handleChange} style={getSelectStyle('jobType')}><option value="Full-Time">Full-Time</option><option value="Part-Time">Part-Time</option><option value="Contract">Contract</option><option value="Internship">Internship</option><option value="Freelance">Freelance</option></select></div>
                  <div><label style={labelStyle}>Work Mode</label><select name="workMode" value={formData.workMode} onChange={handleChange} style={getSelectStyle('workMode')}><option value="On-site">On-site</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option></select></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Qualification</label><input type="text" name="qualification" value={formData.qualification} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. B.E. / B.Tech Computer Science" style={getInputStyle('qualification')} /></div>
                  <div><label style={labelStyle}>Application URL</label><input type="url" name="applicationUrl" value={formData.applicationUrl} onChange={handleChange} onBlur={handleBlur} placeholder="https://careerflow.internal/apply" style={getInputStyle('applicationUrl')} /><FieldError name="applicationUrl" /></div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 1: Company Info ══════ */}
            {activeSection === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Company Information</h3>
                <div><label style={labelStyle}>Company Name *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Mechatrix Technobolutions" style={getInputStyle('companyName')} /><FieldError name="companyName" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Company Website</label><input type="url" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} onBlur={handleBlur} placeholder="https://www.mechatrix.com" style={getInputStyle('companyWebsite')} /><FieldError name="companyWebsite" /></div>
                  <div><label style={labelStyle}>Industry</label><input type="text" name="industry" value={formData.industry} onChange={handleChange} onBlur={handleBlur} placeholder="Gaming / AR Tech" style={getInputStyle('industry')} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                  <div>
                    <label style={labelStyle}>Established Year</label>
                    <select name="establishedYear" value={formData.establishedYear} onChange={handleChange} onBlur={handleBlur} style={getSelectStyle('establishedYear')}>
                      <option value="">Select Year</option>
                      {yearOptions.map((yr) => (<option key={yr} value={yr}>{yr}</option>))}
                    </select>
                    <FieldError name="establishedYear" />
                  </div>
                  <div>
                    <label style={labelStyle}>Organization Size</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'stretch' }}>
                      <select name="organizationSize" value={ORGANIZATION_SIZE_OPTIONS.includes(formData.organizationSize) ? formData.organizationSize : ''} onChange={handleChange} style={getSelectStyle('organizationSize')}>
                        <option value="">Select Size</option>
                        {ORGANIZATION_SIZE_OPTIONS.map((sz) => (<option key={sz} value={sz}>{sz}</option>))}
                      </select>
                      <input type="text" name="organizationSize" value={formData.organizationSize} onChange={handleChange} onBlur={handleBlur} placeholder="Or custom (e.g. 100-200)" style={getInputStyle('organizationSize')} />
                    </div>
                    <p style={{ margin: '5px 0 0', fontSize: 11, color: '#98A2B3' }}>Choose a preset or type a custom range on the right</p>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 2: Job Description ══════ */}
            {activeSection === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#101828' }}>Job Description</h3>
                <div>
                  <label style={labelStyle}>Description * <span style={{ fontWeight: 'normal', color: '#667085' }}>(minimum 20 characters)</span></label>
                  <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} onBlur={handleBlur} rows={12} placeholder="Describe the overall scope, responsibilities, work environment, and impact of the role..." style={{ ...getInputStyle('jobDescription'), height: 'auto', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><FieldError name="jobDescription" /><span style={{ fontSize: 11, color: formData.jobDescription.length < 20 ? '#F04438' : '#667085', fontWeight: 500, marginLeft: 'auto' }}>{formData.jobDescription.length} / 20 min characters</span></div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 3: Skills & Requirements ══════ */}
            {activeSection === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Skills & Requirements</h3>
                <div style={cardStyle}><div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>🛠</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Skills Required</span></div><TagInput value={formData.skills} onChange={(v) => setFormData((prev) => ({ ...prev, skills: v }))} placeholder="Type a skill and press Enter (e.g. React, Unity 3D)" suggestions={SKILL_SUGGESTIONS} chipColor="#6750A4" chipBg="#E8DEF8" chipBorder="#D6BBFB" /></div>
                <div style={cardStyle}><div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>📋</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Requirements & Responsibilities</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><label style={labelStyle}>Key Requirements <span style={{ fontWeight: 'normal', color: '#667085' }}>(one per line)</span></label><textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={5} placeholder={'Must have 2+ years of Unity development\nStrong knowledge of 3D shaders'} style={{ ...getInputStyle('requirements'), height: 'auto', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} /></div>
                    <div><label style={labelStyle}>Responsibilities <span style={{ fontWeight: 'normal', color: '#667085' }}>(one per line)</span></label><textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={5} placeholder={'Design immersive interactive modules\nCollaborate with game designers'} style={{ ...getInputStyle('responsibilities'), height: 'auto', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} /></div>
                  </div>
                </div>
                <div style={cardStyle}><div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>🎁</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Benefits Offered</span></div><TagInput value={formData.benefits} onChange={(v) => setFormData((prev) => ({ ...prev, benefits: v }))} placeholder="Type a benefit and press Enter (e.g. Health Insurance)" suggestions={BENEFIT_SUGGESTIONS} chipColor="#027A48" chipBg="#D1FADF" chipBorder="#A6F4C5" /></div>
                <div style={cardStyle}><div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>🗣</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Languages</span></div><TagInput value={formData.languages} onChange={(v) => setFormData((prev) => ({ ...prev, languages: v }))} placeholder="Type a language and press Enter (e.g. English)" suggestions={LANGUAGE_SUGGESTIONS} chipColor="#B54708" chipBg="#FEF0C7" chipBorder="#FEDF89" /></div>
              </div>
            )}

            {/* ══════ SECTION 4: Salary & Experience ══════ */}
            {activeSection === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Salary & Experience</h3>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>💰</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Compensation Package</span><span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#667085', background: '#F2F4F7', padding: '3px 10px', borderRadius: 20 }}>Optional</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, marginBottom: 20 }}>
                    <div><label style={labelStyle}>Currency</label><ComboBox value={formData.salaryCurrency} onChange={(v) => setFormData((prev) => ({ ...prev, salaryCurrency: v }))} options={CURRENCY_OPTIONS} placeholder="INR" compact /></div>
                    <div><label style={labelStyle}>Payment Period</label><div style={{ display: 'flex', gap: 6, background: '#F9FAFB', border: '1.5px solid #E4E7EC', borderRadius: 10, padding: 4, height: 40, alignItems: 'center' }}>{PERIOD_OPTIONS.map((p) => { const active = formData.salaryPeriod === p.value; return (<button key={p.value} type="button" onClick={() => setFormData((prev) => ({ ...prev, salaryPeriod: p.value }))} style={{ flex: 1, height: '100%', borderRadius: 7, border: 'none', background: active ? '#6750A4' : 'transparent', color: active ? '#fff' : '#475467', fontSize: 12, fontWeight: active ? 700 : 600, cursor: 'pointer', transition: 'all 0.15s' }}>{p.label}</button>); })}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 12, alignItems: 'start' }}>
                    <div><label style={labelStyle}>Minimum Salary</label><div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${touchedFields.salaryMin && fieldErrors.salaryMin ? '#F04438' : salaryRangeInvalid ? '#FDA29B' : '#D0D5DD'}`, borderRadius: 10, height: 48, background: touchedFields.salaryMin && fieldErrors.salaryMin ? '#FEF3F2' : '#fff', overflow: 'hidden' }}><span style={{ width: 44, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', borderRight: '1.5px solid #E4E7EC', fontSize: 15, fontWeight: 700, color: '#475467', flexShrink: 0 }}>{currencySymbol || '¤'}</span><input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} onBlur={handleBlur} placeholder="25000" min="0" style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 15, fontWeight: 600, color: '#1D2939', background: 'transparent', height: '100%', minWidth: 0 }} /></div>{formData.salaryMin && !fieldErrors.salaryMin && (<span style={{ fontSize: 11, color: '#667085', marginTop: 5, display: 'block' }}>{currencySymbol}{formatNumberIN(formData.salaryMin)}</span>)}<FieldError name="salaryMin" /></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 25, color: '#98A2B3', fontSize: 16, fontWeight: 700 }}>—</div>
                    <div><label style={labelStyle}>Maximum Salary</label><div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${fieldErrors.salaryMax && (touchedFields.salaryMax || salaryRangeInvalid) ? '#F04438' : '#D0D5DD'}`, borderRadius: 10, height: 48, background: fieldErrors.salaryMax && (touchedFields.salaryMax || salaryRangeInvalid) ? '#FEF3F2' : '#fff', overflow: 'hidden' }}><span style={{ width: 44, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', borderRight: '1.5px solid #E4E7EC', fontSize: 15, fontWeight: 700, color: '#475467', flexShrink: 0 }}>{currencySymbol || '¤'}</span><input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} onBlur={handleBlur} placeholder="45000" min="0" style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 15, fontWeight: 600, color: '#1D2939', background: 'transparent', height: '100%', minWidth: 0 }} /></div>{formData.salaryMax && !fieldErrors.salaryMax && (<span style={{ fontSize: 11, color: '#667085', marginTop: 5, display: 'block' }}>{currencySymbol}{formatNumberIN(formData.salaryMax)}</span>)}{!salaryRangeInvalid && <FieldError name="salaryMax" />}</div>
                  </div>
                  {salaryRangeInvalid && (<div style={{ marginTop: 16, background: '#FEF3F2', border: '1.5px solid #FDA29B', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span><div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#B42318' }}>Invalid salary range</p><p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#B42318', lineHeight: 1.4 }}>Maximum ({currencySymbol}{formatNumberIN(formData.salaryMax)}) must be ≥ minimum ({currencySymbol}{formatNumberIN(formData.salaryMin)}).</p></div><button type="button" onClick={swapSalary} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F04438', background: '#fff', color: '#B42318', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>⇄ Swap Values</button></div>)}
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#667085', letterSpacing: '0.04em' }}>CANDIDATE PREVIEW</span><span style={{ background: salaryRangeInvalid ? '#FEF3F2' : '#F4F3FF', border: `1px solid ${salaryRangeInvalid ? '#FDA29B' : '#D6BBFB'}`, color: salaryRangeInvalid ? '#B42318' : '#53389F', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{salaryPreview}</span></div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>🎯</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Experience Requirement</span><span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#667085', background: '#F2F4F7', padding: '3px 10px', borderRadius: 20 }}>0 – 50 years</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 12, alignItems: 'start' }}>
                    <div><label style={labelStyle}>Minimum Experience</label><div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${touchedFields.experienceMin && fieldErrors.experienceMin ? '#F04438' : experienceRangeInvalid ? '#FDA29B' : '#D0D5DD'}`, borderRadius: 10, height: 48, background: touchedFields.experienceMin && fieldErrors.experienceMin ? '#FEF3F2' : '#fff', overflow: 'hidden' }}><input type="number" name="experienceMin" value={formData.experienceMin} onChange={handleChange} onBlur={handleBlur} placeholder="0" min="0" max="50" style={{ flex: 1, border: 'none', outline: 'none', padding: '0 14px', fontSize: 15, fontWeight: 600, color: '#1D2939', background: 'transparent', height: '100%', minWidth: 0 }} /><span style={{ padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', background: '#F9FAFB', borderLeft: '1.5px solid #E4E7EC', fontSize: 12, fontWeight: 700, color: '#667085', flexShrink: 0 }}>yrs</span></div><FieldError name="experienceMin" /></div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 25, color: '#98A2B3', fontSize: 16, fontWeight: 700 }}>—</div>
                    <div><label style={labelStyle}>Maximum Experience</label><div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${fieldErrors.experienceMax && (touchedFields.experienceMax || experienceRangeInvalid) ? '#F04438' : '#D0D5DD'}`, borderRadius: 10, height: 48, background: fieldErrors.experienceMax && (touchedFields.experienceMax || experienceRangeInvalid) ? '#FEF3F2' : '#fff', overflow: 'hidden' }}><input type="number" name="experienceMax" value={formData.experienceMax} onChange={handleChange} onBlur={handleBlur} placeholder="5" min="0" max="50" style={{ flex: 1, border: 'none', outline: 'none', padding: '0 14px', fontSize: 15, fontWeight: 600, color: '#1D2939', background: 'transparent', height: '100%', minWidth: 0 }} /><span style={{ padding: '0 14px', height: '100%', display: 'flex', alignItems: 'center', background: '#F9FAFB', borderLeft: '1.5px solid #E4E7EC', fontSize: 12, fontWeight: 700, color: '#667085', flexShrink: 0 }}>yrs</span></div>{!experienceRangeInvalid && <FieldError name="experienceMax" />}</div>
                  </div>
                  {experienceRangeInvalid && (<div style={{ marginTop: 16, background: '#FEF3F2', border: '1.5px solid #FDA29B', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span><div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#B42318' }}>Invalid experience range</p><p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#B42318', lineHeight: 1.4 }}>Maximum ({formData.experienceMax} yrs) must be ≥ minimum ({formData.experienceMin} yrs).</p></div><button type="button" onClick={swapExperience} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #F04438', background: '#fff', color: '#B42318', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>⇄ Swap Values</button></div>)}
                  <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#667085', marginRight: 2 }}>QUICK SET:</span>{[{ label: 'Fresher', min: '0', max: '1' }, { label: '1 - 3 yrs', min: '1', max: '3' }, { label: '2 - 5 yrs', min: '2', max: '5' }, { label: '5 - 8 yrs', min: '5', max: '8' }, { label: '8 - 12 yrs', min: '8', max: '12' }, { label: '10+ yrs', min: '10', max: '20' }].map((preset) => { const active = formData.experienceMin === preset.min && formData.experienceMax === preset.max; return (<button key={preset.label} type="button" onClick={() => setFormData((prev) => ({ ...prev, experienceMin: preset.min, experienceMax: preset.max }))} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? '#6750A4' : '#D0D5DD'}`, background: active ? '#E8DEF8' : '#fff', color: active ? '#6750A4' : '#475467', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{preset.label}</button>); })}</div>
                  <div style={{ marginTop: 18 }}><label style={labelStyle}>Experience Info Label <span style={{ fontWeight: 'normal', color: '#667085' }}>(free text shown on listing)</span></label><input type="text" name="experienceText" value={formData.experienceText} onChange={handleChange} placeholder="e.g. 2-5 years of immersive dev experience preferred" style={getInputStyle('experienceText')} /></div>
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#667085', letterSpacing: '0.04em' }}>CANDIDATE PREVIEW</span><span style={{ background: experienceRangeInvalid ? '#FEF3F2' : '#F4F3FF', border: `1px solid ${experienceRangeInvalid ? '#FDA29B' : '#D6BBFB'}`, color: experienceRangeInvalid ? '#B42318' : '#53389F', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{experiencePreview}</span></div>
                </div>

                {/* ─── NEW: Notice Period Card ─── */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}>
                    <span style={{ fontSize: 16 }}>⏳</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Notice Period</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#667085', background: '#F2F4F7', padding: '3px 10px', borderRadius: 20 }}>Optional</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'stretch' }}>
                    <select name="noticePeriod" value={NOTICE_PERIOD_OPTIONS.includes(formData.noticePeriod) ? formData.noticePeriod : ''} onChange={handleChange} style={getSelectStyle('noticePeriod')}>
                      <option value="">Select Notice Period</option>
                      {NOTICE_PERIOD_OPTIONS.map((np) => (<option key={np} value={np}>{np}</option>))}
                    </select>
                    <input type="text" name="noticePeriod" value={formData.noticePeriod} onChange={handleChange} onBlur={handleBlur} placeholder="Or custom (e.g. 45 Days)" style={getInputStyle('noticePeriod')} />
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#667085', marginRight: 2 }}>QUICK SET:</span>
                    {NOTICE_PERIOD_OPTIONS.slice(0, 6).map((np) => {
                      const active = formData.noticePeriod === np;
                      return (
                        <button key={np} type="button" onClick={() => setFormData((prev) => ({ ...prev, noticePeriod: np }))} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${active ? '#6750A4' : '#D0D5DD'}`, background: active ? '#E8DEF8' : '#fff', color: active ? '#6750A4' : '#475467', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{np}</button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#667085', letterSpacing: '0.04em' }}>CANDIDATE PREVIEW</span>
                    <span style={{ background: '#F4F3FF', border: '1px solid #D6BBFB', color: '#53389F', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{formData.noticePeriod || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 5: Location & Schedule ══════ */}
            {activeSection === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Location & Timing Schedule</h3>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>📍</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Job Location</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div><label style={labelStyle}>Full Address</label><input type="text" name="locationAddress" value={formData.locationAddress} onChange={handleChange} placeholder="e.g. H NO 124, Kalpana Nagar, Phase 3" style={getInputStyle('locationAddress')} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                      <div><label style={labelStyle}>State</label><ComboBox value={formData.locationState} onChange={(v) => setFormData((prev) => ({ ...prev, locationState: v }))} options={INDIAN_STATES} placeholder="Search or type state" /></div>
                      <div><label style={labelStyle}>City *</label><ComboBox value={formData.locationCity} onChange={(v) => { setFormData((prev) => ({ ...prev, locationCity: v })); if (touchedFields.locationCity || fieldErrors.locationCity) { const err = validateField('locationCity', v); setFieldErrors((prev) => { const next = { ...prev }; if (err) next.locationCity = err; else delete next.locationCity; return next; }); } }} onBlur={() => { setTouchedFields((prev) => ({ ...prev, locationCity: true })); const err = validateField('locationCity', formData.locationCity); setFieldErrors((prev) => { const next = { ...prev }; if (err) next.locationCity = err; else delete next.locationCity; return next; }); }} options={formData.locationState && INDIAN_CITIES[formData.locationState] ? INDIAN_CITIES[formData.locationState] : ALL_CITIES} placeholder="Search or type city" error={touchedFields.locationCity ? fieldErrors.locationCity : undefined} /><FieldError name="locationCity" /></div>
                      <div><label style={labelStyle}>Country</label><input type="text" name="locationCountry" value={formData.locationCountry} onChange={handleChange} style={getInputStyle('locationCountry')} /></div>
                    </div>
                    {formData.locationState && INDIAN_CITIES[formData.locationState] && (<p style={{ margin: 0, fontSize: 11, color: '#667085' }}>Showing <strong>{INDIAN_CITIES[formData.locationState].length}</strong> cities for <strong>{formData.locationState}</strong>. You can also type any custom city name.</p>)}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>🕒</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Job Timing (Analog Dial Pick) *</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 20 }}><AnalogClockPicker label="Start Time" value={timingStart} onChange={setTimingStart} accentColor="#6750A4" /><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 18, color: '#98A2B3' }}>➔</span><span style={{ fontSize: 10, color: '#667085', fontWeight: 700 }}>TO</span></div><AnalogClockPicker label="End Time" value={timingEnd} onChange={setTimingEnd} accentColor="#5D5279" /></div>
                    <div style={{ borderTop: '1px dashed #E4E7EC', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#475467' }}>SAVED RUNTIME TIMING:</span><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ background: '#F4F3FF', border: '1px solid #D6BBFB', color: '#53389F', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{formatTo12hString(timingStart)}</span><span style={{ color: '#98A2B3', fontWeight: 'bold' }}>➔</span><span style={{ background: '#F4F3FF', border: '1px solid #D6BBFB', color: '#53389F', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{formatTo12hString(timingEnd)}</span></div></div>
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>📅</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Working Days *</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: '#475467', marginRight: 4 }}>PRESETS:</span>{(['weekdays', 'extended', 'weekends', 'flexible'] as const).map((preset) => (<button key={preset} type="button" onClick={() => applyWorkingDaysPreset(preset)} style={{ padding: '5px 12px', borderRadius: 20, background: '#fff', border: '1.5px solid #D0D5DD', fontSize: 11.5, fontWeight: 600, color: '#344054', cursor: 'pointer' }}>{preset === 'weekdays' && 'Mon - Fri'}{preset === 'extended' && 'Mon - Sat'}{preset === 'weekends' && 'Weekend Only'}{preset === 'flexible' && 'All 7 Days'}</button>))}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => { const isSelected = selectedDays.includes(day); return (<button key={day} type="button" onClick={() => handleToggleDays(day)} style={{ padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${isSelected ? '#6750A4' : '#D0D5DD'}`, background: isSelected ? '#E8DEF8' : '#fff', color: isSelected ? '#6750A4' : '#344054', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', transition: 'all 0.12s ease' }}>{day}</button>); })}</div>
                    <div style={{ borderTop: '1px dashed #E4E7EC', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 11, fontWeight: 700, color: '#475467' }}>SAVED CONSTRUCT:</span><span style={{ background: '#F4F3FF', border: '1px solid #D6BBFB', color: '#53389F', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{formData.workingDays || 'No days selected'}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 6: MERGED — Recruiter Info + Contact Visibility ══════ */}
            {activeSection === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Recruiter Information & Contact Settings</h3>

                {/* Recruiter Details */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>👤</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Recruiter Details</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div><label style={labelStyle}>Recruiter Name</label><input type="text" name="recruiterName" value={formData.recruiterName} onChange={handleChange} placeholder="e.g. Sadashiv" style={getInputStyle('recruiterName')} /></div>
                    <div>
                      <label style={labelStyle}>Designation</label>
                      <ComboBox
                        value={formData.recruiterDesignation}
                        onChange={(v) => setFormData((prev) => ({ ...prev, recruiterDesignation: v }))}
                        options={DESIGNATION_SUGGESTIONS}
                        placeholder="e.g. HR Lead"
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}><label style={labelStyle}>Recruiter Email</label><input type="email" name="recruiterEmail" value={formData.recruiterEmail} onChange={handleChange} onBlur={handleBlur} placeholder="recruiter@mechatrix.com" style={getInputStyle('recruiterEmail')} /><FieldError name="recruiterEmail" /></div>
                </div>

                {/* Phone Numbers */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>📞</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Contact Numbers</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Mobile Number (10 digits)</label>
                      <div style={getFieldContainerStyle('recruiterMobileNumber')}>
                        <span style={{ background: '#F2F4F7', padding: '0 12px', fontWeight: 700, color: '#475467', fontSize: 13, display: 'flex', alignItems: 'center', borderRight: '1.5px solid #D0D5DD', userSelect: 'none' }}>+91</span>
                        <input type="tel" name="recruiterMobileNumber" value={formData.recruiterMobileNumber} onChange={handleChange} onBlur={handleBlur} placeholder="9876543210" maxLength={10} inputMode="numeric" style={{ border: 'none', outline: 'none', flex: 1, padding: '0 10px', fontSize: 14, background: 'transparent', color: '#1D2939' }} />
                      </div>
                      <FieldError name="recruiterMobileNumber" />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp Number (10 digits)</label>
                      <div style={getFieldContainerStyle('recruiterWhatsappNumber')}>
                        <span style={{ background: '#F2F4F7', padding: '0 12px', fontWeight: 700, color: '#475467', fontSize: 13, display: 'flex', alignItems: 'center', borderRight: '1.5px solid #D0D5DD', userSelect: 'none' }}>+91</span>
                        <input type="tel" name="recruiterWhatsappNumber" value={formData.recruiterWhatsappNumber} onChange={handleChange} onBlur={handleBlur} placeholder="9876543210" maxLength={10} inputMode="numeric" style={{ border: 'none', outline: 'none', flex: 1, padding: '0 10px', fontSize: 14, background: 'transparent', color: '#1D2939' }} />
                      </div>
                      <FieldError name="recruiterWhatsappNumber" />
                    </div>
                  </div>
                </div>

                {/* Visibility Toggles */}
                <div style={cardStyle}>
                  <div style={cardHeaderStyle}><span style={{ fontSize: 16 }}>👁</span><span style={{ fontSize: 14, fontWeight: 700, color: '#101828' }}>Contact Visibility Controls</span></div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: '#667085', fontStyle: 'italic' }}>Toggle below to let job seekers view and use these contact options on active listings.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* WhatsApp Toggle */}
                    <div style={{ padding: 16, borderRadius: 12, border: `2px solid ${formData.contactVisibilityWhatsapp ? '#25D366' : '#E4E7EC'}`, background: formData.contactVisibilityWhatsapp ? 'rgba(37, 211, 102, 0.05)' : '#fff', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#101828' }}>Show WhatsApp Number</p><p style={{ margin: '4px 0 0', fontSize: 11, color: '#667085', lineHeight: 1.3 }}>{formData.contactVisibilityWhatsapp ? '✓ Users can message recruiter directly.' : '✗ WhatsApp button hidden from profile.'}</p></div>
                        <button type="button" onClick={() => handleToggle('contactVisibilityWhatsapp')} style={{ width: 44, height: 24, borderRadius: 12, background: formData.contactVisibilityWhatsapp ? '#25D366' : '#D0D5DD', position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          <span style={{ position: 'absolute', top: 2, left: formData.contactVisibilityWhatsapp ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                        </button>
                      </div>
                      {formData.contactVisibilityWhatsapp && (<div style={{ borderTop: '1px solid rgba(37, 211, 102, 0.2)', marginTop: 12, paddingTop: 8, fontSize: 11, color: '#25D366', fontWeight: 600 }}>Active: +91 {formData.recruiterWhatsappNumber || 'No number set'}</div>)}
                    </div>
                    {/* Mobile Toggle */}
                    <div style={{ padding: 16, borderRadius: 12, border: `2px solid ${formData.contactVisibilityMobile ? '#6750A4' : '#E4E7EC'}`, background: formData.contactVisibilityMobile ? 'rgba(103, 80, 164, 0.05)' : '#fff', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#101828' }}>Show Mobile Contact</p><p style={{ margin: '4px 0 0', fontSize: 11, color: '#667085', lineHeight: 1.3 }}>{formData.contactVisibilityMobile ? '✓ Phone dial option enabled.' : '✗ Contact number hidden.'}</p></div>
                        <button type="button" onClick={() => handleToggle('contactVisibilityMobile')} style={{ width: 44, height: 24, borderRadius: 12, background: formData.contactVisibilityMobile ? '#6750A4' : '#D0D5DD', position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          <span style={{ position: 'absolute', top: 2, left: formData.contactVisibilityMobile ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                        </button>
                      </div>
                      {formData.contactVisibilityMobile && (<div style={{ borderTop: '1px solid rgba(103, 80, 164, 0.2)', marginTop: 12, paddingTop: 8, fontSize: 11, color: '#6750A4', fontWeight: 600 }}>Active: +91 {formData.recruiterMobileNumber || 'No number set'}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 7: Logo & Showcase ══════ */}
            {activeSection === 7 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Company Branding & Showcase Photos</h3>
                <div>
                  <label style={labelStyle}>Company Logo (Max 5MB)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {logoPreview ? (
                      <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, border: '1.5px solid #E4E7EC', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        <button type="button" onClick={handleRemoveLogo} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: '#F04438', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                      </div>
                    ) : (<div style={{ width: 80, height: 80, borderRadius: 12, background: '#F2F4F7', border: '1.5px dashed #D0D5DD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 24, color: '#98A2B3' }}>🖼</span></div>)}
                    <div><input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} /><button type="button" onClick={() => logoInputRef.current?.click()} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #D0D5DD', background: '#fff', color: '#344054', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{logoPreview ? 'Change Logo' : 'Upload Logo'}</button></div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #E4E7EC', paddingTop: 20 }}>
                  <label style={labelStyle}>Company Showcase Images (Max {MAX_IMAGES} photos)</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><input ref={imagesInputRef} type="file" accept="image/*" multiple onChange={handleImagesChange} style={{ display: 'none' }} /><button type="button" onClick={() => imagesInputRef.current?.click()} disabled={imagePreviews.length >= MAX_IMAGES} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #D0D5DD', background: imagePreviews.length >= MAX_IMAGES ? '#F2F4F7' : '#fff', color: imagePreviews.length >= MAX_IMAGES ? '#98A2B3' : '#344054', fontWeight: 600, fontSize: 13, cursor: imagePreviews.length >= MAX_IMAGES ? 'not-allowed' : 'pointer' }}>Add Gallery Photos ({imagePreviews.length}/{MAX_IMAGES})</button></div>
                    {imagePreviews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                        {imagePreviews.map((src, idx) => (
                          <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 12, border: '1.5px solid #E4E7EC', overflow: 'hidden', background: '#F9FAFB' }}>
                            <img src={src} alt={`Showcase ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(240, 68, 56, 0.9)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            {idx < existingImageUrls.length && (<div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>Existing</div>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SECTION 8: Status & Settings (NO EXPIRY FIELD) ══════ */}
            {activeSection === 8 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#101828' }}>Listing Settings & Publishing Flags</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Job Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} style={getSelectStyle('status')}>
                      <option value="Draft">Draft</option>
                      <option value="Live">Live / Active</option>
                      {isEditing && <option value="Closed">Closed</option>}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 26 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" name="featured" checked={formData.featured} onChange={handleChange} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6750A4' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Feature This Job listing</span></label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" name="noPaymentInvolved" checked={formData.noPaymentInvolved} onChange={handleChange} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6750A4' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>No payment involved (strictly free to apply)</span></label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
          <button type="button" disabled={activeSection === 0} onClick={() => setActiveSection((s) => Math.max(0, s - 1))} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #D0D5DD', background: '#fff', color: activeSection === 0 ? '#D0D5DD' : '#344054', fontWeight: 600, fontSize: 14, cursor: activeSection === 0 ? 'not-allowed' : 'pointer' }}>← Previous</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: 10, border: '1.5px solid #D0D5DD', background: '#fff', color: '#344054', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            {activeSection < TOTAL_SECTIONS - 1 ? (
              <button type="button" onClick={() => setActiveSection((s) => Math.min(TOTAL_SECTIONS - 1, s + 1))} style={{ padding: '10px 28px', borderRadius: 10, border: 'none', background: '#6750A4', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Next →</button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isLoading} style={{ padding: '10px 32px', borderRadius: 10, border: 'none', background: isLoading ? '#B0A0D8' : '#6750A4', color: '#fff', fontWeight: 700, fontSize: 14, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLoading && <span className="footer-spin" />}
                {isLoading ? 'Saving...' : isEditing ? 'Update Listing' : 'Publish Listing'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`.footer-spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: postjob-spin 0.6s linear infinite; } @keyframes postjob-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PostJobView;