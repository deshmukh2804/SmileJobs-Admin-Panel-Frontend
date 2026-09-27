import React from 'react';
import { JobItem } from '../types';

interface JobDetailModalProps {
  job: JobItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onToggleFeature?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

// ============ OFFICIAL WHATSAPP ICON ============
const WhatsAppIcon = ({ active, size = 20 }: { active: boolean; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={active ? '#25D366' : '#9CA3AF'}
    className="shrink-0 transition-colors"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ============ OFFICIAL PHONE ICON ============
const PhoneIcon = ({ active, size = 20 }: { active: boolean; size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={active ? '#6750A4' : '#9CA3AF'}
    className="shrink-0 transition-colors"
  >
    <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.27.36-.66.25-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2c0-4.97-4.03-9-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z" />
  </svg>
);

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isLoading,
  onClose,
  onApprove,
  onReject,
  onToggleFeature,
  onToggleStatus,
}) => {
  if (!job) return null;

  const formatDate = (d?: string) => {
    if (!d) return '';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return d;
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (d?: string) => {
    if (!d) return '';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ✅ Parse job timing string (e.g., "9:00 AM to 5:00 PM", "9-5", "9:00-17:00") into start & end
  const parseJobTiming = (timing?: string): { start: string; end: string } | null => {
    if (!timing) return null;
    const cleaned = timing.trim();

    // Try common separators: "to", "-", "–", "—"
    const separators = /\s*(?:to|-|–|—|→)\s*/i;
    const parts = cleaned.split(separators);

    if (parts.length >= 2) {
      return {
        start: parts[0].trim(),
        end: parts[1].trim(),
      };
    }
    return null;
  };

  const hasArr = (a?: any[]) => Array.isArray(a) && a.length > 0;
  const hasVal = (v?: any) => v !== undefined && v !== null && v !== '';

  const Field = ({ label, value, mono }: { label: string; value?: any; mono?: boolean }) => (
    <div>
      <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">
        {label}
      </span>
      <span
        className={`text-sm text-on-surface font-medium ${mono ? 'font-mono' : ''} ${
          !hasVal(value) ? 'text-outline italic' : ''
        }`}
      >
        {hasVal(value) ? value : 'Not provided'}
      </span>
    </div>
  );

  // ✅ Date Field with Calendar Icon (+ optional Clock for time)
  const DateField = ({ label, value }: { label: string; value?: string }) => {
    const dateStr = formatDate(value);
    const timeStr = formatTime(value);

    if (!hasVal(value)) {
      return (
        <div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
            {label}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-variant w-fit">
            <span className="material-symbols-outlined text-[16px] text-outline">calendar_today</span>
            <span className="text-sm text-outline italic">Not provided</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
          {label}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
            <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
            <span className="text-sm font-semibold text-on-surface">{dateStr}</span>
          </div>
          {timeStr && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span className="text-sm font-semibold text-on-surface">{timeStr}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ Job Timing Field with Clock Icons (Start → End format)
  const JobTimingField = ({ label, value }: { label: string; value?: string }) => {
    const parsed = parseJobTiming(value);

    if (!hasVal(value)) {
      return (
        <div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
            {label}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-variant w-fit">
            <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
            <span className="text-sm text-outline italic">Not provided</span>
          </div>
        </div>
      );
    }

    if (parsed) {
      return (
        <div>
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
            {label}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span className="text-sm font-semibold text-on-surface">{parsed.start}</span>
            </div>
            <span className="text-outline text-sm font-bold">→</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
              <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
              <span className="text-sm font-semibold text-on-surface">{parsed.end}</span>
            </div>
          </div>
        </div>
      );
    }

    // Fallback: display raw value with single clock icon
    return (
      <div>
        <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
          {label}
        </span>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 w-fit">
          <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
          <span className="text-sm font-semibold text-on-surface">{value}</span>
        </div>
      </div>
    );
  };

  // ✅ Working Days Field with Calendar-Month icon
  const WorkingDaysField = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-1">
        {label}
      </span>
      {hasVal(value) ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/20 w-fit">
          <span className="material-symbols-outlined text-[16px] text-primary">event</span>
          <span className="text-sm font-semibold text-on-surface">{value}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-container border border-surface-variant w-fit">
          <span className="material-symbols-outlined text-[16px] text-outline">event</span>
          <span className="text-sm text-outline italic">Not provided</span>
        </div>
      )}
    </div>
  );

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-surface-variant">
      <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
      <h3 className="text-xs font-bold text-primary uppercase tracking-wider">{title}</h3>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============ HEADER ============ */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-surface-variant bg-surface-container-low/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-primary-container text-on-secondary flex items-center justify-center font-bold text-lg shadow-xs overflow-hidden shrink-0">
              {job.companyLogo ? (
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              ) : (
                job.companyInitials || 'CF'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg text-primary font-bold truncate">{job.title}</h2>
                {job.featured && (
                  <span className="px-2 py-0.5 rounded bg-[#FFF3D6] text-[#8C5D00] font-bold text-[10px]">
                    ⭐ FEATURED
                  </span>
                )}
                {job.isNew && (
                  <span className="px-2 py-0.5 rounded bg-primary-container text-on-secondary font-bold text-[10px]">
                    NEW
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    job.status === 'Live'
                      ? 'bg-[#E5F2EB] text-[#24593C]'
                      : job.status === 'Pending Approval'
                      ? 'bg-[#FFF3D6] text-[#8C5D00]'
                      : 'bg-outline/20 text-outline'
                  }`}
                >
                  {job.status}
                </span>
                {isLoading && (
                  <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-outline flex-wrap">
                <span className="text-on-surface font-medium">{job.company}</span>
                {job.isCompanyVerified && (
                  <span className="material-symbols-outlined text-[12px] text-[#5F8A72]">verified</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* ============ CONTENT SCROLLABLE ============ */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-background/30">
          {/* ============ SECTION 1: BASIC INFO ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="work" title="Section 1: Basic Job Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Job Title" value={job.title} />
              <Field label="Department" value={job.department} />
              <Field label="Role / Designation" value={job.role} />
              <Field label="Job Type" value={job.jobType} />
              <Field label="Work Mode" value={job.workMode} />
              <Field label="Qualification" value={job.qualification} />
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">
                  Application URL
                </span>
                {hasVal(job.applicationUrl) ? (
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary font-semibold hover:underline break-all"
                  >
                    {job.applicationUrl}
                  </a>
                ) : (
                  <span className="text-sm text-outline italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* ============ SECTION 2: COMPANY INFO ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="business" title="Section 2: Company Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Company Name" value={job.company} />
              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5">
                  Company Website
                </span>
                {hasVal(job.companyWebsite) ? (
                  <a
                    href={job.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary font-semibold hover:underline break-all"
                  >
                    {job.companyWebsite}
                  </a>
                ) : (
                  <span className="text-sm text-outline italic">Not provided</span>
                )}
              </div>
              <Field label="Industry" value={job.industry} />
              <Field
                label="Verified Company"
                value={job.isCompanyVerified ? '✓ Verified' : 'Not Verified'}
              />
            </div>
          </div>

          {/* ============ SECTION 3: JOB DESCRIPTION ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="description" title="Section 3: Job Description" />
            {hasVal(job.description || job.jobDescription) ? (
              <p className="text-sm text-on-surface-variant whitespace-pre-line leading-relaxed">
                {job.description || job.jobDescription}
              </p>
            ) : (
              <p className="text-sm text-outline italic">No description provided</p>
            )}
          </div>

          {/* ============ SECTION 4: SKILLS & REQUIREMENTS ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="checklist" title="Section 4: Skills & Requirements" />
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Skills Required
                </span>
                {hasArr(job.skills) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills!.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-primary-container text-on-secondary text-xs font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-outline italic">No skills listed</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Key Requirements
                </span>
                {hasArr(job.requirements) ? (
                  <ul className="space-y-1">
                    {job.requirements!.map((r, i) => (
                      <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-outline italic">No requirements listed</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Responsibilities
                </span>
                {hasArr(job.responsibilities) ? (
                  <ul className="space-y-1">
                    {job.responsibilities!.map((r, i) => (
                      <li key={i} className="text-sm text-on-surface-variant flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-outline italic">No responsibilities listed</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Benefits Offered
                </span>
                {hasArr(job.benefits) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.benefits!.map((b, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-[#E5F2EB] text-[#24593C] text-xs font-semibold"
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-outline italic">No benefits listed</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Languages
                </span>
                {hasArr(job.languages) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.languages!.map((l, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface text-xs font-semibold"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-outline italic">No languages specified</span>
                )}
              </div>
            </div>
          </div>

          {/* ============ SECTION 5: SALARY & EXPERIENCE ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="payments" title="Section 5: Salary & Experience" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field
                label="Min Salary"
                value={
                  hasVal(job.salary?.min)
                    ? `${job.salary?.currency === 'INR' ? '₹' : job.salary?.currency || ''}${job.salary?.min?.toLocaleString()}`
                    : undefined
                }
              />
              <Field
                label="Max Salary"
                value={
                  hasVal(job.salary?.max)
                    ? `${job.salary?.currency === 'INR' ? '₹' : job.salary?.currency || ''}${job.salary?.max?.toLocaleString()}`
                    : undefined
                }
              />
              <Field label="Currency" value={job.salary?.currency} />
              <Field
                label="Period"
                value={job.salary?.period ? `Per ${job.salary.period}` : undefined}
              />
              <Field
                label="Min Experience"
                value={hasVal(job.experience?.min) ? `${job.experience?.min} yrs` : undefined}
              />
              <Field
                label="Max Experience"
                value={hasVal(job.experience?.max) ? `${job.experience?.max} yrs` : undefined}
              />
              <div className="col-span-2">
                <Field label="Experience Info" value={job.experience?.text} />
              </div>
              <div className="col-span-2 sm:col-span-4 mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">
                  Compiled Salary Range
                </span>
                <span className="text-base font-bold text-primary">{job.salaryRange}</span>
              </div>
            </div>
          </div>

          {/* ============ SECTION 6: LOCATION & SCHEDULE ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="location_on" title="Section 6: Location & Schedule" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2 md:col-span-3">
                <Field label="Full Address" value={job.locationDetails?.address} />
              </div>
              <Field label="City" value={job.locationDetails?.city} />
              <Field label="State" value={job.locationDetails?.state} />
              <Field label="Country" value={job.locationDetails?.country} />

              {/* ✅ Job Timing with Clock icons (Start → End) */}
              <div className="sm:col-span-2 md:col-span-3">
                <JobTimingField label="Job Timing" value={job.jobTiming} />
              </div>

              {/* ✅ Working Days with Calendar icon */}
              <div className="sm:col-span-2 md:col-span-3">
                <WorkingDaysField label="Working Days" value={job.workingDays} />
              </div>
            </div>
          </div>

          {/* ============ SECTION 7: RECRUITER INFO ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="person" title="Section 7: Recruiter Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Recruiter Name" value={job.contactPerson?.name} />
              <Field label="Designation" value={job.contactPerson?.designation} />
              <Field label="Email" value={job.recruiterEmail} />
              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  <PhoneIcon active={true} size={12} />
                  Mobile Number
                </span>
                <span className={`text-sm font-mono ${hasVal(job.recruiterMobileNumber) ? 'text-on-surface' : 'text-outline italic'}`}>
                  {job.recruiterMobileNumber || 'Not provided'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                  <WhatsAppIcon active={true} size={12} />
                  WhatsApp Number
                </span>
                <span className={`text-sm font-mono ${hasVal(job.recruiterWhatsappNumber) ? 'text-on-surface' : 'text-outline italic'}`}>
                  {job.recruiterWhatsappNumber || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* ============ SECTION 8: CONTACT VISIBILITY ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="visibility" title="Section 8: Contact Visibility" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  job.contactVisibility?.whatsapp
                    ? 'border-[#25D366] bg-[#25D366]/5 shadow-sm'
                    : 'border-outline-variant bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      job.contactVisibility?.whatsapp ? 'bg-[#25D366]/15' : 'bg-surface-container'
                    }`}
                  >
                    <WhatsAppIcon active={!!job.contactVisibility?.whatsapp} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-primary block">WhatsApp Number</span>
                    <span className="text-[10px] text-outline block font-mono truncate">
                      {job.recruiterWhatsappNumber || 'Not provided'}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 whitespace-nowrap ${
                    job.contactVisibility?.whatsapp
                      ? 'bg-[#E5F2EB] text-[#24593C]'
                      : 'bg-outline/10 text-outline'
                  }`}
                >
                  {job.contactVisibility?.whatsapp ? '✓ VISIBLE' : '✗ HIDDEN'}
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  job.contactVisibility?.mobile
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-outline-variant bg-surface-container-low'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      job.contactVisibility?.mobile ? 'bg-primary/15' : 'bg-surface-container'
                    }`}
                  >
                    <PhoneIcon active={!!job.contactVisibility?.mobile} size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-primary block">Mobile Number</span>
                    <span className="text-[10px] text-outline block font-mono truncate">
                      {job.recruiterMobileNumber || 'Not provided'}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ml-2 whitespace-nowrap ${
                    job.contactVisibility?.mobile
                      ? 'bg-primary/10 text-primary'
                      : 'bg-outline/10 text-outline'
                  }`}
                >
                  {job.contactVisibility?.mobile ? '✓ VISIBLE' : '✗ HIDDEN'}
                </span>
              </div>
            </div>

            {job.whatsapp?.enabled && job.whatsapp.url && (
              <a
                href={job.whatsapp.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <WhatsAppIcon active={false} size={14} />
                <span className="text-white">Test WhatsApp Chat Link</span>
                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            )}
          </div>

          {/* ============ SECTION 9: LOGO & IMAGES ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="image" title="Section 9: Company Logo & Showcase Images" />
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Company Logo
                </span>
                {job.companyLogo ? (
                  <a href={job.companyLogo} target="_blank" rel="noreferrer">
                    <div className="w-24 h-24 rounded-xl border-2 border-outline-variant bg-surface-container overflow-hidden hover:border-primary transition-colors">
                      <img src={job.companyLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  </a>
                ) : (
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-[32px]">image</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block mb-2">
                  Company Showcase Images ({job.companyImages?.length || 0})
                </span>
                {hasArr(job.companyImages) ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {job.companyImages!.map((img, i) => (
                      <a
                        key={i}
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block aspect-square rounded-xl border border-outline-variant overflow-hidden hover:border-primary transition-colors"
                      >
                        <img
                          src={img.url}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center bg-surface-container/30">
                    <span className="material-symbols-outlined text-outline text-[32px]">
                      collections
                    </span>
                    <p className="text-xs text-outline mt-1">No showcase images uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ============ SECTION 10: JOB STATUS & FLAGS ============ */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-variant">
            <SectionHeader icon="flag" title="Section 10: Job Status & Publishing Flags" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Status" value={job.status} />
              <Field label="Featured" value={job.featured ? '⭐ Yes' : 'No'} />
              <Field
                label="No Payment Involved"
                value={
                  job.noPaymentInvolved !== false ? '✓ Free to apply' : '⚠️ Payment may be involved'
                }
              />
              <Field label="Applicants" value={`${job.applicantsCount} / ${job.applicantsCap}`} />
            </div>

            {/* ✅ Date Fields with Calendar + Clock icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <DateField label="Posted Date" value={job.postedAt || job.postedDate} />
              <DateField label="Created On" value={job.createdAt} />
              <DateField label="Last Updated" value={job.updatedAt} />
            </div>

            {/* Capacity bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-primary">Application Fill Rate</span>
                <span className="text-outline">
                  {Math.round((job.applicantsCount / job.applicantsCap) * 100)}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((job.applicantsCount / job.applicantsCap) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Rejection reason */}
            {job.status === 'Rejected' && hasVal(job.rejectionReason) && (
              <div className="mt-4 p-3 rounded-lg border border-error/30 bg-error-container/40">
                <h4 className="text-xs font-bold text-on-error-container uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">block</span>
                  Rejection Reason
                </h4>
                <p className="text-sm text-on-error-container">{job.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* ============ FOOTER ACTIONS ============ */}
        <div className="px-6 py-4 border-t border-surface-variant bg-surface-container-low/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onToggleFeature && (
              <button
                type="button"
                onClick={() => onToggleFeature(job.id)}
                className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {job.featured ? 'star' : 'star_border'}
                </span>
                <span>{job.featured ? 'Unfeature' : 'Feature'}</span>
              </button>
            )}
            {onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(job.id)}
                className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {job.status === 'Live' ? 'pause' : 'play_arrow'}
                </span>
                <span>{job.status === 'Live' ? 'Deactivate' : 'Activate'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {job.status === 'Pending Approval' && onReject && (
              <button
                type="button"
                onClick={() => {
                  onReject(job.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg bg-error-container hover:bg-error-container/80 text-on-error-container font-semibold text-xs flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
                <span>Reject</span>
              </button>
            )}

            {job.status === 'Pending Approval' && onApprove && (
              <button
                type="button"
                onClick={() => {
                  onApprove(job.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-[#5F8A72] text-on-secondary font-bold text-xs shadow-sm hover:opacity-90 flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Approve & Publish</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};