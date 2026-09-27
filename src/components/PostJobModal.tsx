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
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [role, setRole] = useState('');
  const [jobType, setJobType] = useState<'Full-Time' | 'Part-Time' | 'Contract' | 'Internship'>('Full-Time');
  const [workMode, setWorkMode] = useState<'On-site' | 'Hybrid' | 'Remote'>('Hybrid');

  // Section 2: Company Information
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [establishedYear, setEstablishedYear] = useState('');
  const [organizationSize, setOrganizationSize] = useState('50-200');

  // Section 3: Job Description
  const [jobDescription, setJobDescription] = useState('');

  // Section 4: Skills & Requirements
  const [skillsText, setSkillsText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [qualification, setQualification] = useState('');
  const [languagesText, setLanguagesText] = useState('');

  // Section 5: Salary & Experience
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');
  const [salaryPeriod, setSalaryPeriod] = useState<'hour' | 'day' | 'week' | 'month' | 'year'>('month');
  const [experienceMin, setExperienceMin] = useState('0');
  const [experienceMax, setExperienceMax] = useState('');
  const [experienceText, setExperienceText] = useState('');

  // Section 6: Location & Schedule
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [jobTiming, setJobTiming] = useState('');
  const [workingDays, setWorkingDays] = useState('');

  // Section 7: Recruiter Information
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterDesignation, setRecruiterDesignation] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterMobileNumber, setRecruiterMobileNumber] = useState('');
  const [recruiterWhatsappNumber, setRecruiterWhatsappNumber] = useState('');

  // Section 8: Contact Visibility (Independent ON/OFF Switches - DEFAULT: OFF)
  const [showWhatsapp, setShowWhatsapp] = useState(false);
  const [showMobile, setShowMobile] = useState(false);

  // Section 9: Company Logo & Images
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyImagesText, setCompanyImagesText] = useState('');

  // Section 10: Job Status
  const [status, setStatus] = useState<'Draft' | 'Pending Approval' | 'Live'>('Live');
  const [featured, setFeatured] = useState(false);
  const [applicantsCap, setApplicantsCap] = useState(150);
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation checks
    if (!title.trim()) {
      setErrorMessage("Job Title is required.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage("Company Name is required.");
      return;
    }

    if (showWhatsapp && !recruiterWhatsappNumber.trim()) {
      setErrorMessage("WhatsApp number is required when WhatsApp visibility is enabled.");
      return;
    }

    if (showMobile && !recruiterMobileNumber.trim()) {
      setErrorMessage("Mobile number is required when mobile visibility is enabled.");
      return;
    }

    setIsLoading(true);

    const apiPayload = {
      title: title.trim(),
      companyName: companyName.trim(),
      companyWebsite: companyWebsite.trim() || undefined,
      industry,
      department,
      role: role.trim() || undefined,
      jobType,
      workMode,

      companyLogo: companyLogoUrl ? { url: companyLogoUrl, publicId: 'logo_url' } : undefined,
      companyImages: companyImagesText ? companyImagesText.split(',').map(url => ({ url: url.trim(), publicId: 'image_url' })) : [],

      location: {
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        country: country.trim(),
      },

      salary: {
        min: salaryMin ? parseInt(salaryMin) : undefined,
        max: salaryMax ? parseInt(salaryMax) : undefined,
        currency: salaryCurrency,
        period: salaryPeriod,
      },

      experience: {
        min: parseInt(experienceMin) || 0,
        max: experienceMax ? parseInt(experienceMax) : undefined,
        text: experienceText.trim(),
      },

      qualification: qualification.trim() || undefined,
      skills: skillsText ? skillsText.split(',').map(s => s.trim()) : [],
      languages: languagesText ? languagesText.split(',').map(l => l.trim()) : [],

      jobDescription: jobDescription.trim(),
      responsibilities: responsibilitiesText ? responsibilitiesText.split('\n').map(r => r.trim()).filter(Boolean) : [],
      requirements: requirementsText ? requirementsText.split('\n').map(r => r.trim()).filter(Boolean) : [],

      jobTiming: jobTiming.trim() || undefined,
      workingDays: workingDays.trim() || undefined,

      recruiterEmail: recruiterEmail.trim() || undefined,
      recruiterMobileNumber: recruiterMobileNumber.trim() || undefined,
      recruiterWhatsappNumber: recruiterWhatsappNumber.trim() || undefined,

      contactPerson: {
        name: recruiterName.trim() || undefined,
        designation: recruiterDesignation.trim() || undefined,
      },

      contactVisibility: {
        whatsapp: showWhatsapp,
        mobile: showMobile,
      },

      status,
      featured,
      applicantsCap,
      notes: notes.trim(),
    };

    try {
      const response = await jobApi.createJob(apiPayload);
      const savedJob = response.data;

      const transformedJob: JobItem = {
        id: savedJob._id || savedJob.id,
        title: savedJob.title,
        company: savedJob.companyName,
        companyInitials: savedJob.companyInitials || 'CF',
        isCompanyVerified: savedJob.isCompanyVerified || false,
        industry: savedJob.industry || 'Technology',
        department: savedJob.department,
        location: savedJob.locationDisplay || `${savedJob.location?.city || ''}, ${savedJob.location?.state || ''}`,
        workMode: savedJob.workMode,
        salaryRange: savedJob.salaryRange || 'Not Disclosed',
        jobType: savedJob.jobType,
        postedDate: 'Today',
        applicantsCount: 0,
        applicantsCap: savedJob.applicantsCap,
        status: savedJob.status,
        featured: savedJob.featured,
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-variant bg-surface-container-low/40">
          <div>
            <h3 className="font-headline-sm text-primary font-bold">
              Create Dynamic Job Post
            </h3>
            <p className="text-xs text-outline">
              Provide dynamic parameters across 10 structured sections. No hardcoded credentials used.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-error-container/30 border border-error-container text-on-error-container text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-error">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* SECTION 1: Basic Job Information */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 1: Basic Job Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Job Title *</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm text-on-surface border border-outline-variant focus:outline-none" placeholder="e.g. AR / VR Developer" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. Design" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Role / Designation</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. Senior Unity Artist" />
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

          {/* SECTION 2: Company Information */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 2: Company Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Name *</label>
                <input required type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. Mechatrix Technobolutions India" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Website</label>
                <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="https://www.mechatrix.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Industry</label>
                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Gaming / VR Tech" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Established Year</label>
                <input type="number" value={establishedYear} onChange={(e) => setEstablishedYear(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="2018" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Organization Size</label>
                <input type="text" value={organizationSize} onChange={(e) => setOrganizationSize(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="50-100 employees" />
              </div>
            </div>
          </div>

          {/* SECTION 3: Job Description */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 3: Job Description</h4>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Complete Job Description *</label>
              <textarea required rows={4} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Explain the dynamic roles and tech-stack details..." />
            </div>
          </div>

          {/* SECTION 4: Skills & Requirements */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 4: Skills &amp; Requirements</h4>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Skills (comma-separated)</label>
              <input type="text" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="AR/VR, Unity 3D, C#, Modeling" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Key Requirements (one per line)</label>
              <textarea rows={3} value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Must have 2+ years of Unity development..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Responsibilities (one per line)</label>
              <textarea rows={3} value={responsibilitiesText} onChange={(e) => setResponsibilitiesText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Develop AR filters, write scalable clean code..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Qualification Required</label>
                <input type="text" value={qualification} onChange={(e) => setQualification(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="B.E./B.Tech Computer Science" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Languages (comma-separated)</label>
                <input type="text" value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="English, Hindi" />
              </div>
            </div>
          </div>

          {/* SECTION 5: Salary & Experience */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 5: Salary &amp; Experience</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Min Salary</label>
                <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="25000" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Max Salary</label>
                <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="40000" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Currency</label>
                <input type="text" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Period</label>
                <select value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none">
                  <option value="month">Per Month</option>
                  <option value="year">Per Year</option>
                  <option value="day">Per Day</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Min Exp (Years)</label>
                <input type="number" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Max Exp (Years)</label>
                <input type="number" value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Experience Custom Text</label>
                <input type="text" value={experienceText} onChange={(e) => setExperienceText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. 2 - 5 years of experience" />
              </div>
            </div>
          </div>

          {/* SECTION 6: Location & Schedule */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 6: Location &amp; Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Full Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. Phase 3, Hinjewadi" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Pune" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">State</label>
                <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Maharashtra" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Job Timings</label>
                <input type="text" value={jobTiming} onChange={(e) => setJobTiming(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. 9:00 AM - 6:00 PM" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Working Days</label>
                <input type="text" value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. Mon - Fri (5 days)" />
              </div>
            </div>
          </div>

          {/* SECTION 7: Recruiter Information */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 7: Recruiter Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Name</label>
                <input type="text" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Siddharth" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Designation</label>
                <input type="text" value={recruiterDesignation} onChange={(e) => setRecruiterDesignation(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Managing Director" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Email</label>
                <input type="email" value={recruiterEmail} onChange={(e) => setRecruiterEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="hr@mechatrix.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Mobile Number</label>
                <input type="text" value={recruiterMobileNumber} onChange={(e) => setRecruiterMobileNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. +91 9876543210" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">WhatsApp Number</label>
                <input type="text" value={recruiterWhatsappNumber} onChange={(e) => setRecruiterWhatsappNumber(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="e.g. +91 9112233445" />
              </div>
            </div>
          </div>

          {/* SECTION 8: Contact Visibility (CONFORMS TO REQUIREMENTS) */}
          <div className="p-4 rounded-xl border border-surface-variant bg-surface-container-low/20 space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 8: Contact Visibility Settings</h4>
            <p className="text-xs text-outline italic">Enable an option to allow users to access that contact method for this job.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-variant flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary">Show WhatsApp Number</p>
                  <p className="text-[10px] text-outline mt-0.5">
                    {showWhatsapp 
                      ? "ON — Users will be able to contact the recruiter directly on WhatsApp." 
                      : "OFF — WhatsApp option is completely hidden from public."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWhatsapp(!showWhatsapp)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showWhatsapp ? 'bg-[#25D366]' : 'bg-outline/30'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${showWhatsapp ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-variant flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary">Show Mobile Number</p>
                  <p className="text-[10px] text-outline mt-0.5">
                    {showMobile 
                      ? "ON — Users will be able to access the recruiter's mobile contact option." 
                      : "OFF — Mobile options are completely redacted."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobile(!showMobile)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${showMobile ? 'bg-primary' : 'bg-outline/30'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${showMobile ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* SECTION 9: Company Logo & Images */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 9: Logo &amp; Corporate Gallery</h4>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Logo URL (Cloudinary Preferred)</label>
              <input type="text" value={companyLogoUrl} onChange={(e) => setCompanyLogoUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Paste secure url..." />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Company Showcase Images (comma-separated URL list)</label>
              <input type="text" value={companyImagesText} onChange={(e) => setCompanyImagesText(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="https://res.cloudinary.com/.../img1.png, https://res.cloudinary.com/.../img2.png" />
            </div>
          </div>

          {/* SECTION 10: Job Status */}
          <div className="space-y-3 p-4 rounded-xl border border-surface-variant bg-surface-container-low/20">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">SECTION 10: Governance &amp; Publishing Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Post Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none">
                  <option value="Live">Live / Immediately Active</option>
                  <option value="Pending Approval">Pending Moderator Review</option>
                  <option value="Draft">Draft Mode</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase mb-1">Applicants Capacity Limit</label>
                <input type="number" value={applicantsCap} onChange={(e) => setApplicantsCap(parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="feature" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-outline-variant text-primary" />
                <label htmlFor="feature" className="text-xs font-bold text-on-surface cursor-pointer select-none">Feature This Job</label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-outline uppercase mb-1">Internal Moderator Notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-sm border border-outline-variant focus:outline-none" placeholder="Verification notes or specific recruiter directions..." />
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