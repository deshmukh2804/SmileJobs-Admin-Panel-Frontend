import React, { useState } from 'react';
import { JobItem } from '../types';
import { jobApi } from '../services/api';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (job: JobItem) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  onSaveJob,
}) => {
  // Section 1: Basic Job Information
  const [title, setTitle] = useState('test 6');
  const [department, setDepartment] = useState('Customer Service');
  const [role, setRole] = useState('test 6');
  const [jobType, setJobType] = useState<'Full-Time' | 'Part-Time' | 'Contract' | 'Internship'>('Part-Time');
  const [workMode, setWorkMode] = useState<'On-site' | 'Hybrid' | 'Remote'>('On-site');

  // Section 2: Company Information
  const [companyName, setCompanyName] = useState('Uwe services');
  const [companyWebsite, setCompanyWebsite] = useState('https://en.wikipedia.org/wiki/URL');
  const [industry, setIndustry] = useState('I T');
  const [establishedYear, setEstablishedYear] = useState('2014');
  const [organizationSize, setOrganizationSize] = useState('11-50 employees');

  // Section 3: Job Description
  const [jobDescription, setJobDescription] = useState('dfghjksdfghjkl;asdfg');

  // Section 4: Skills & Requirements
  const [skillsText, setSkillsText] = useState('ghjk, ghj]');
  const [requirementsText, setRequirementsText] = useState('ghjk');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');
  const [qualification, setQualification] = useState("MBA / PGDM in Human Resources or Bachelor's degree in any relevant field");
  const [languagesText, setLanguagesText] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('30 Days / 1 Month');

  // Section 5: Salary & Experience
  const [salaryMin, setSalaryMin] = useState('9');
  const [salaryMax, setSalaryMax] = useState('12');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [salaryPeriod, setSalaryPeriod] = useState<'hour' | 'day' | 'week' | 'month' | 'year'>('month');
  const [experienceMin, setExperienceMin] = useState('2');
  const [experienceMax, setExperienceMax] = useState('5');
  const [experienceText, setExperienceText] = useState('');

  // Section 6: Location & Schedule
  const [address, setAddress] = useState('In front of Bhakti hims Yashwant nagar talegaon');
  const [city, setCity] = useState('Bareilly');
  const [stateName, setStateName] = useState('Arunachal Pradesh');
  const [country, setCountry] = useState('India');
  const [jobTiming, setJobTiming] = useState('10:00 AM to 05:00 PM');
  const [workingDays, setWorkingDays] = useState('Mon - Fri');

  // Section 7: Recruiter Information
  const [recruiterName, setRecruiterName] = useState('gvhj');
  const [recruiterDesignation, setRecruiterDesignation] = useState('HR Manager');
  const [recruiterEmail, setRecruiterEmail] = useState('bhavukdeshmukh@gmail.com');
  const [recruiterMobileNumber, setRecruiterMobileNumber] = useState('915858658666');
  const [recruiterWhatsappNumber, setRecruiterWhatsappNumber] = useState('915564646464');

  // Section 8: Contact Visibility (Default: ON)
  const [showWhatsapp, setShowWhatsapp] = useState(true);
  const [showMobile, setShowMobile] = useState(true);

  // Section 9: Company Logo & Images
  const [companyLogoUrl, setCompanyLogoUrl] = useState('https://res.cloudinary.com/mqyjz7hl/image/upload/v1791380011/jobs/company/logos/uci3anetrdyy5rquntkx.png');
  const [companyImagesText, setCompanyImagesText] = useState('');

  // Section 10: Job Status
  const [status, setStatus] = useState<'Draft' | 'Pending Approval' | 'Live'>('Live');
  const [featured, setFeatured] = useState(false);
  const [applicantsCap, setApplicantsCap] = useState(100);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('Job Title is required.');
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }

    setIsLoading(true);

    const apiPayload = {
      title: title.trim(),
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim() || 'https://en.wikipedia.org/wiki/URL',
      companyLogo: companyLogoUrl.trim()
        ? { url: companyLogoUrl.trim(), publicId: 'jobs/company/logos/uci3anetrdyy5rquntkx' }
        : { url: '', publicId: '' },
      companyImages: companyImagesText.trim()
        ? companyImagesText
            .split(',')
            .map((url) => ({ url: url.trim(), publicId: 'jobs/company/gallery/img' }))
            .filter((img) => img.url)
        : [],
      industry: industry.trim() || 'I T',
      establishedYear: establishedYear ? parseInt(establishedYear, 10) : 2014,
      organizationSize: organizationSize.trim() || '11-50 employees',

      companyAddress: {
        city: '',
        state: '',
        country: country.trim() || 'India',
      },

      location: {
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim() || 'India',
      },

      salary: {
        min: salaryMin ? parseInt(salaryMin, 10) : 9,
        max: salaryMax ? parseInt(salaryMax, 10) : 12,
        currency: salaryCurrency,
        period: salaryPeriod,
      },

      experience: {
        min: parseInt(experienceMin, 10) || 2,
        max: experienceMax ? parseInt(experienceMax, 10) : 5,
        text: experienceText.trim(),
      },

      noticePeriod: noticePeriod.trim() || '30 Days / 1 Month',
      jobType,
      workMode,
      department: department.trim() || 'Customer Service',
      role: role.trim() || 'test 6',
      qualification: qualification.trim(),
      skills: skillsText
        ? skillsText.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      languages: languagesText
        ? languagesText.split(',').map((l) => l.trim()).filter(Boolean)
        : [],

      jobDescription: jobDescription.trim(),
      description: jobDescription.trim(),

      responsibilities: responsibilitiesText
        ? responsibilitiesText.split('\n').map((r) => r.trim()).filter(Boolean)
        : [],
      requirements: requirementsText
        ? requirementsText.split('\n').map((r) => r.trim()).filter(Boolean)
        : [],
      benefits: benefitsText
        ? benefitsText.split(',').map((b) => b.trim()).filter(Boolean)
        : [],

      jobTiming: jobTiming.trim() || '10:00 AM to 05:00 PM',
      workingDays: workingDays.trim() || 'Mon - Fri',

      contactPerson: {
        name: recruiterName.trim() || 'gvhj',
        designation: recruiterDesignation.trim() || 'HR Manager',
      },

      recruiterWhatsappNumber: recruiterWhatsappNumber.trim() || '915564646464',
      recruiterMobileNumber: recruiterMobileNumber.trim() || '915858658666',
      recruiterEmail: recruiterEmail.trim() || 'bhavukdeshmukh@gmail.com',
      applicationUrl: '',
      noPaymentInvolved: true,

      contactVisibility: {
        whatsapp: showWhatsapp,
        mobile: showMobile,
      },
      whatsappContactEnabled: showWhatsapp,

      status: 'Live',
      isActive: true,
      featured,
      isNew: true,
      isCompanyVerified: false,
      postedBy: 'admin',
      postedByName: 'Smile Jobs',
      postedByEmail: 'smilejobs@gmail.com',
      postedByRole: 'Super Admin',
      approvalStatus: 'approved',
      applicantsCount: 0,
      applicantsCap: Number(applicantsCap) || 100,
      notes: notes.trim(),
    };

    try {
      const response = await jobApi.createJob(apiPayload);
      const savedJob = response.data || response.job;

      const transformedJob: JobItem = {
        id: savedJob._id || savedJob.id,
        title: savedJob.title,
        company: savedJob.companyName,
        companyInitials: savedJob.companyInitials || 'US',
        isCompanyVerified: savedJob.isCompanyVerified || false,
        industry: savedJob.industry || 'I T',
        department: savedJob.department,
        location: savedJob.locationDisplay || `${savedJob.location?.city || ''}, ${savedJob.location?.state || ''}`,
        workMode: savedJob.workMode,
        salaryRange: savedJob.salaryRange || '₹ 9 - 12',
        jobType: savedJob.jobType,
        postedDate: 'Today',
        applicantsCount: 0,
        applicantsCap: savedJob.applicantsCap || 100,
        status: savedJob.status || 'Live',
        featured: savedJob.featured || false,
        isNew: true,
        notes: savedJob.notes || notes,
        contactVisibility: savedJob.contactVisibility,
        recruiterWhatsappNumber: savedJob.recruiterWhatsappNumber,
        recruiterMobileNumber: savedJob.recruiterMobileNumber,
        recruiterEmail: savedJob.recruiterEmail,
      };

      onSaveJob(transformedJob);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving job to DB.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-variant my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant bg-surface-container-low/40">
          <div>
            <h3 className="font-headline-sm text-primary font-bold text-lg">
              Create Dynamic Job Post
            </h3>
            <p className="text-xs text-outline">
              Provide dynamic parameters across 10 structured sections.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-error-container/30 border border-error text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECTION 1 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 1: Basic Job Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Job Title *</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Role / Designation</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Job Type</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none">
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Work Mode</label>
                <select value={workMode} onChange={(e) => setWorkMode(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none">
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 2: Company Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Name *</label>
                <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Website</label>
                <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Industry</label>
                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Established Year</label>
                <input type="number" value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Organization Size</label>
                <input type="text" value={organizationSize} onChange={(e) => setOrganizationSize(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 3: Job Description</h4>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Complete Job Description *</label>
              <textarea required rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 4: Skills &amp; Requirements</h4>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Skills (comma-separated)</label>
              <input type="text" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Requirements</label>
                <textarea rows={2} value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Notice Period</label>
                <input type="text" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 5 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 5: Salary &amp; Experience</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Min Salary</label>
                <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Max Salary</label>
                <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Period</label>
                <select value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none">
                  <option value="month">month</option>
                  <option value="year">year</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Min / Max Exp</label>
                <div className="flex gap-2">
                  <input type="number" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} className="w-1/2 px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
                  <input type="number" value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)} className="w-1/2 px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 6: Location &amp; Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">State</label>
                <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 7 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 7: Recruiter &amp; Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Contact Name</label>
                <input type="text" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Mobile</label>
                <input type="text" value={recruiterMobileNumber} onChange={(e) => setRecruiterMobileNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">WhatsApp</label>
                <input type="text" value={recruiterWhatsappNumber} onChange={(e) => setRecruiterWhatsappNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
          </div>

          {/* SECTION 9 */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 9: Logo URL</h4>
            <div>
              <input type="text" value={companyLogoUrl} onChange={(e) => setCompanyLogoUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-surface-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-primary text-on-primary font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">publish</span>
              )}
              <span>Create Dynamic Posting</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};