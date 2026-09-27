import { ActivityItem, AdminUser, JobItem, UserItem, VerificationItem } from '../types';

export const BRAND_LOGO = 'https://lh3.googleusercontent.com/aida/AEtjO1WCB2TtjgdvuI0cEafAPCuAnFcS-xmRnOEDIkMPRbSO3ssbPc1Xi4gdWNffTMr2YsQS82JEC1d0wVeW_yl_gRQl02Pd9IZLXTIDae93rbhbkgSoXw-yTee14tgc9pEJlmsBFGNn2LY-NdPfSsxWnmMseOZ0QO3lfFHUSYwtACAMBQuNuCmY_NlT9qrZW9rZrO1rGASRwbGHPbF-7tjQ3fXCuNY2cG7U_mb85TfHjjFsTkpU1DEfveYx9ack';

export const ADMIN_AVATAR = 'https://lh3.googleusercontent.com/aida/AEtjO1UsQPSZ8VUfGHXt7zOuoqb31MyfNB3LogLw-01fTu8XZAlyIc2N1FD5Bn2sZ9ZNhIRl3nYEvIUrCq7arO_uOe4VE4oOTKyhpThXCvhsM6aht0G-qIgjUqGDpYJsJ4YaqY_g5OoiBy_4BBFOoZarH4p2qrhCFViWD8V6H4gXGhSz__cp2rdZmzwpvk-Ngd8DTRZC-mWdAqAI7wnO4qVR8XCa8U0yF29TuXObyaBuKZxX5GCJ4TE6oQu60JeN';

export const INITIAL_JOBS: JobItem[] = [
  {
    id: '#CF-9821',
    title: 'Data Analyst',
    company: 'Neubrain Solutions',
    companyInitials: 'NS',
    isCompanyVerified: true,
    industry: 'IT Services',
    department: 'Analytics',
    location: 'Pune | Chinchwad',
    workMode: 'On-site',
    salaryRange: '₹ 15,000 - 20,000',
    salaryPeriod: 'per month',
    jobType: 'Full-Time',
    postedDate: 'Today',
    applicantsCount: 48,
    applicantsCap: 100,
    status: 'Live',
    notes: 'Requires SQL and Tableau proficiency. Fast-track screening.'
  },
  {
    id: '#CF-8924',
    title: 'Lead Product Designer',
    company: 'Swiggy',
    companyInitials: 'SW',
    isCompanyVerified: true,
    industry: 'Foodtech Unicorn',
    department: 'Product & UX',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    salaryRange: '₹ 24 - 32 LPA',
    salaryPeriod: 'Includes ESOPs',
    jobType: 'Full-Time',
    postedDate: '2 days ago',
    applicantsCount: 142,
    applicantsCap: 200,
    status: 'Live',
    featured: true,
    notes: 'Tier-1 design role for grocery delivery vertical. Direct VP interview.'
  },
  {
    id: '#CF-9901',
    title: 'Senior React Architect',
    company: 'TechNova Solutions',
    companyInitials: 'TN',
    isCompanyVerified: false,
    industry: 'Startup • Series A',
    department: 'Frontend / Core',
    location: 'Remote',
    workMode: 'Remote',
    salaryRange: '₹ 28 - 36 LPA',
    salaryPeriod: 'Annual CTC',
    jobType: 'Full-Time',
    postedDate: '1 hour ago',
    applicantsCount: 0,
    applicantsCap: 100,
    status: 'Pending Approval',
    isNew: true,
    notes: 'Series A funding confirmed. GST document verification in progress.'
  },
  {
    id: '#CF-9780',
    title: 'Business Development Executive',
    company: 'Apex Dynamics Corp',
    companyInitials: 'AD',
    isCompanyVerified: false,
    industry: 'Enterprise Sales',
    department: 'B2B Sales',
    location: 'Gurgaon',
    workMode: 'On-site',
    salaryRange: '₹ 4.5 - 6.5 LPA',
    salaryPeriod: '+ Uncapped Incentives',
    jobType: 'Full-Time',
    postedDate: '3 hours ago',
    applicantsCount: 12,
    applicantsCap: 50,
    status: 'Pending Approval',
    notes: 'Pending PAN name match check before public distribution.'
  },
  {
    id: '#CF-8712',
    title: 'Flutter Mobile Developer',
    company: 'Zomato',
    companyInitials: 'ZM',
    isCompanyVerified: true,
    industry: 'Consumer Tech',
    department: 'iOS & Android Apps',
    location: 'Gurugram',
    workMode: 'Hybrid',
    salaryRange: '₹ 16 - 22 LPA',
    salaryPeriod: 'Base CTC',
    jobType: 'Full-Time',
    postedDate: 'Oct 10, 2026',
    applicantsCount: 96,
    applicantsCap: 150,
    status: 'Live',
    notes: '3 days in office weekly. Mobile performance optimization experience.'
  },
  {
    id: '#CF-8140',
    title: 'HR Operations Specialist',
    company: 'Cognizant',
    companyInitials: 'CT',
    isCompanyVerified: true,
    industry: 'IT Consulting',
    department: 'People Team',
    location: 'Hyderabad',
    workMode: 'On-site',
    salaryRange: '₹ 6 - 8 LPA',
    salaryPeriod: 'Fixed Annual',
    jobType: 'Full-Time',
    postedDate: 'Oct 08, 2026',
    applicantsCount: 210,
    applicantsCap: 200,
    status: 'Expired',
    notes: 'Application cap reached. Candidate shortlisting underway.'
  }
];

export const INITIAL_USERS: UserItem[] = [
  {
    id: '#CF-89211',
    name: 'Bhavuk Deshmukh',
    email: 'bhavuk.deshmukh@email.com',
    phone: '+91 7389353999',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw3NDe5nI2uEyHAGrGBpKjSBGkhoxe0-IfhFG10K2YIQIBzeoHKt3RIyvboue97CKUboLAY5-fDREmTz3qunZBATje-RRgHEojkW2IVP0Fi9wVVTBhJplZ5mj_PMEqJqtSmA23HV-lhP3gK061Vc7FKZiU65CSko1_CIP0cNBuWvtHYHE-K1ooQpB9-YVv9s7Kg6sjBxR6tcWmSYHKZkqcAK-BGrp0Jv8TcRGNGeyv5h0YCaL0Jfr6zg',
    role: 'Candidate',
    status: 'Active',
    joinedDate: 'Sep 14, 2026',
    verificationStatus: 'Verified',
    location: 'Pune | Chinchwad'
  },
  {
    id: '#EMP-44029',
    name: 'TechNova Solutions',
    email: 'hr@technova.io',
    phone: '+91 9823019283',
    initials: 'TN',
    role: 'Employer',
    status: 'Active',
    joinedDate: 'Oct 02, 2026',
    verificationStatus: 'Verified',
    location: 'Bengaluru'
  },
  {
    id: '#CF-90114',
    name: 'Ananya Roy',
    email: 'ananya.r@design.co',
    phone: '+91 9845012345',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLzcfpjD0fsOxgXg_xyshC_NmmQyj6ai8z_fZq2S_2-3UwHDs2DmueX_d-rkTPmzMWufzaDGDtII8OVmzWou33AEZpO4QlOg44PZstem6REcqapQr7FMec6amrPqtL0NVF3AEt22xXwd3VPz9QcRuSbqxfAY_oowfKKCTFqstqPUl1ozodzzH1SvjnySf20HnS3RtuWiWjlxmLySdhdiqmenjpu2AhgWt-55iQ_ux2t7AAdPZZbEXZCA',
    role: 'Candidate',
    status: 'Active',
    joinedDate: 'Oct 08, 2026',
    verificationStatus: 'Verified',
    location: 'Mumbai'
  },
  {
    id: '#EMP-51982',
    name: 'Apex Dynamics Corp',
    email: 'talent@apexdynamics.in',
    phone: '+91 9911223344',
    initials: 'AD',
    role: 'Employer',
    status: 'Pending',
    joinedDate: 'Oct 11, 2026',
    verificationStatus: 'Unverified',
    location: 'Gurgaon',
    tag: 'KYB Pending'
  },
  {
    id: '#CF-11920',
    name: 'Rajesh Verma',
    email: 'rajesh.v@techmail.com',
    phone: '+91 9123456780',
    initials: 'RV',
    role: 'Candidate',
    status: 'Blocked',
    joinedDate: 'Aug 19, 2026',
    verificationStatus: 'Flagged',
    location: 'Hyderabad'
  },
  {
    id: '#EMP-29011',
    name: 'Neubrain Solutions Pvt. Ltd.',
    email: 'info@neubrain.com',
    phone: '+91 7766554433',
    initials: 'NB',
    role: 'Employer',
    status: 'Active',
    joinedDate: 'Jul 15, 2026',
    verificationStatus: 'Verified',
    location: 'Pune'
  },
  {
    id: '#CF-99432',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@datascience.org',
    phone: '+91 9876543210',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGlAX_GWZJDGb91p9ZTTWVqcgaymLi0hzAg4ox8ue5ovEF6NnU_uNWBf8Ivm_nqN3K6kfMsrudUw-fwjm2kqehlEHA3s_NrDmpumOF46HEsHFqa-PLpgKkQ4qZaVC0-vr7WMjBSl6sLjmw6LvApoEMyAhXnNRm_CjJlucEieplnhA5dgFgeusxTccU6eaWD2sYVEXi3fRtHMyOAS9y-fxTKvq0tXXnk0PXNvvKpxxgdLtep3ASWeVPHg',
    role: 'Candidate',
    status: 'Active',
    joinedDate: 'Oct 10, 2026',
    verificationStatus: 'Verified',
    location: 'Delhi NCR'
  }
];

export const INITIAL_VERIFICATIONS: VerificationItem[] = [
  {
    id: 'tg-global',
    code: 'DOC-89421',
    title: 'TechSphere Global Pvt. Ltd.',
    initials: 'TG',
    type: 'Employer Verification',
    priority: 'High Priority',
    submittedTime: '45 mins ago',
    representativeName: 'Rajesh Malhotra',
    representativeRole: 'Director HR',
    representativeEmail: 'r.malhotra@techsphere.in',
    status: 'pending',
    documents: [
      { name: 'Cert. of Incorporation', type: 'MCA PDF', verified: true },
      { name: 'GSTIN: 27AAACT1234M1Z2', type: 'Tax ID', verified: true, tag: '✓' },
      { name: 'Domain MX Verified', type: 'DNS', verified: true }
    ],
    ocrMatchScore: 100,
    inspectedDoc: {
      filename: 'MCA_Certificate_Incorporation_2024.pdf',
      totalPages: 2,
      currentPage: 1,
      ministryHeader: 'Government of India • Ministry of Corporate Affairs',
      docTitle: 'Certificate of Incorporation',
      docLegalNote: '[Pursuant to sub-section (2) of section 7 of Companies Act, 2013]',
      entityName: 'TECHSPHERE GLOBAL PRIVATE LIMITED',
      incorporationDate: 'Twelfth day of January Two Thousand Twenty-Three',
      cin: 'U72900MH2023PTC392810',
      pan: 'AAACT1234M',
      sealNote: 'Digitally Signed by Registrar',
      registrarLocation: 'RoC - Mumbai / Maharashtra',
      ocrMatch: '100%',
      checks: [
        {
          name: 'GSTIN Validation API',
          detail: '27AAACT1234M1Z2 • Active Taxpayer',
          result: 'Matched 100%'
        },
        {
          name: 'Registered Address Match',
          detail: 'Bandra-Kurla Complex, Mumbai, 400051',
          result: 'Exact Match',
          isExact: true
        },
        {
          name: 'Corporate Domain Authority',
          detail: 'DNS TXT Token Verified via AWS Route53',
          result: 'Passed'
        }
      ],
      auditorRemarks: 'CIN and GSTIN verified against Ministry database. Authorized signatory identity confirmed.'
    }
  },
  {
    id: 'apex-dynamics',
    code: 'DOC-88310',
    title: 'Apex Dynamics Corp',
    initials: 'AD',
    type: 'Employer Verification',
    priority: 'Critical',
    slaWarning: 'Critical SLA (1h remaining)',
    slaUrgent: true,
    submittedTime: '5 hours ago',
    representativeName: 'Vikram Singhania',
    representativeRole: 'Founder & CEO',
    ocrAlert: 'Company name on PAN card ("Apex Dynamic Solutions") differs slightly from portal registration ("Apex Dynamics Corp").',
    status: 'pending',
    documents: [
      { name: 'PAN Card (Corporate)', type: 'Identity', verified: false },
      { name: 'Incorporation Articles', type: 'MCA PDF', verified: true }
    ],
    ocrMatchScore: 88,
    inspectedDoc: {
      filename: 'Apex_PAN_and_Incorporation_Docs.pdf',
      totalPages: 3,
      currentPage: 1,
      ministryHeader: 'Income Tax Department • Government of India',
      docTitle: 'Permanent Account Number Card',
      docLegalNote: '[Pursuant to Section 139A of Income Tax Act, 1961]',
      entityName: 'APEX DYNAMIC SOLUTIONS PRIVATE LIMITED',
      incorporationDate: 'Fifth day of March Two Thousand Twenty-One',
      cin: 'U74999HR2021PTC093120',
      pan: 'AAACA9821L',
      sealNote: 'Digitally Verified by NSDL e-Gov',
      registrarLocation: 'Income Tax Ward 14(2) - Gurgaon',
      ocrMatch: '88% (Name Mismatch)',
      checks: [
        {
          name: 'PAN Validation API',
          detail: 'AAACA9821L • Active Entity',
          result: 'Matched'
        },
        {
          name: 'Entity Name Matching',
          detail: '"Apex Dynamic Solutions" vs "Apex Dynamics Corp"',
          result: 'Requires Audit'
        },
        {
          name: 'Registered Office Check',
          detail: 'Cyber City, Sector 24, Gurgaon, Haryana 122002',
          result: 'Matched 100%'
        }
      ],
      auditorRemarks: 'Requested supplementary resolution letter verifying trade name DBA alias.'
    }
  },
  {
    id: 'bhavuk-deshmukh',
    code: 'DOC-91024',
    title: 'Bhavuk Deshmukh',
    initials: 'BD',
    type: 'Candidate KYC',
    priority: 'Normal Priority',
    submittedTime: '3 hours ago',
    representativeName: 'Bhavuk Deshmukh',
    representativeRole: 'Applied: Lead Data Analyst',
    status: 'pending',
    documents: [
      { name: 'M.Tech Degree (Savitribai Phule University)', type: 'Degree', verified: true },
      { name: 'Past Experience Letter (Accredited)', type: 'Work History', verified: true }
    ],
    ocrMatchScore: 99,
    inspectedDoc: {
      filename: 'Bhavuk_Deshmukh_Degree_Experience.pdf',
      totalPages: 4,
      currentPage: 1,
      ministryHeader: 'Savitribai Phule Pune University • Academic Registry',
      docTitle: 'Master of Technology Degree Certificate',
      docLegalNote: '[Autonomous State University under UGC Act]',
      entityName: 'BHAVUK DESHMUKH',
      incorporationDate: 'Conferred on 18th July 2024 with First Class Distinction',
      cin: 'REG-PU/2022/ENG/99042',
      pan: 'ABCDE1234F',
      sealNote: 'Signed by Vice-Chancellor & Dean',
      registrarLocation: 'Ganeshkhind, Pune 411007',
      ocrMatch: '99.4%',
      checks: [
        {
          name: 'DigiLocker NAD Academic Match',
          detail: 'Roll #PU-ENG-2204 • Verified Grade Sheet',
          result: 'Matched 100%'
        },
        {
          name: 'Prior Employment Experience',
          detail: '4.5 Years as Senior Data Engineer confirmed',
          result: 'Accredited'
        },
        {
          name: 'Identity Cross-Verification',
          detail: 'Aadhaar / National ID Masked Check',
          result: 'Passed'
        }
      ],
      auditorRemarks: 'Candidate academic and employment history thoroughly validated.'
    }
  },
  {
    id: 'neubrain-branch',
    code: 'DOC-88912',
    title: 'Neubrain Solutions',
    initials: 'NS',
    type: 'Branch Office Addition',
    priority: 'Normal Priority',
    submittedTime: '2 hours ago',
    representativeName: 'Priya Sen',
    representativeRole: 'Head of Talent',
    status: 'pending',
    documents: [
      { name: 'Trade License 2026', type: 'Govt License', verified: true },
      { name: 'Electricity Utility Bill (Address Proof)', type: 'Utility', verified: true }
    ],
    ocrMatchScore: 94.6,
    inspectedDoc: {
      filename: 'Neubrain_Branch_Registration_BLR.pdf',
      totalPages: 2,
      currentPage: 1,
      ministryHeader: 'Bruhat Bengaluru Mahanagara Palike • Trade Licensing Dept',
      docTitle: 'Commercial Establishment & Trade License',
      docLegalNote: '[Under Karnataka Municipal Corporations Act 1976]',
      entityName: 'NEUBRAIN SOLUTIONS PVT. LTD.',
      incorporationDate: 'Valid till 31st March 2027',
      cin: 'U72200PN2019PTC184491',
      pan: 'AAACN7766M',
      sealNote: 'BBMP Health & Licensing Officer Seal',
      registrarLocation: 'South Zone, Bengaluru 560078',
      ocrMatch: '94.6%',
      checks: [
        {
          name: 'Municipal Trade Register',
          detail: 'BBMP/TL/2026/0912 • Active Commercial License',
          result: 'Matched 100%'
        },
        {
          name: 'Address Verification',
          detail: 'JP Nagar 4th Phase, Bengaluru South',
          result: 'Exact Match'
        },
        {
          name: 'BESCOM Electricity Utility Match',
          detail: 'Consumer ID #90882194 - Account in good standing',
          result: 'Passed'
        }
      ],
      auditorRemarks: 'Branch office address verified against municipal registry.'
    }
  },
  {
    id: 'cloudscale-innovations',
    code: 'DOC-87002',
    title: 'CloudScale Innovations',
    initials: 'CI',
    type: 'Employer Verification',
    priority: 'Medium Priority',
    submittedTime: '1 day ago',
    representativeName: 'Anil Deshpande',
    representativeRole: 'Managing Partner',
    status: 'pending',
    documents: [
      { name: 'MSME Udyam Registration', type: 'Govt Certificate', verified: true },
      { name: 'Corporate Bank Penny-Drop Verification', type: 'Banking API', verified: true }
    ],
    ocrMatchScore: 96,
    inspectedDoc: {
      filename: 'Cloudscale_MSME_and_PennyDrop.pdf',
      totalPages: 2,
      currentPage: 1,
      ministryHeader: 'Ministry of Micro, Small and Medium Enterprises',
      docTitle: 'UDYAM REGISTRATION CERTIFICATE',
      docLegalNote: '[For Micro, Small & Medium Enterprises]',
      entityName: 'CLOUDSCALE INNOVATIONS LLP',
      incorporationDate: 'Registered on 14th February 2022',
      cin: 'AAY-9014',
      pan: 'AAAFC3311L',
      sealNote: 'General Manager, District Industries Centre',
      registrarLocation: 'Pune Rural / Maharashtra',
      ocrMatch: '96.2%',
      checks: [
        {
          name: 'Udyam Verification Portal',
          detail: 'UDYAM-MH-26-0039218 • Active Status',
          result: 'Matched 100%'
        },
        {
          name: 'Bank Account Penny-Drop',
          detail: 'HDFC Bank - Current A/C #50200039182901',
          result: 'Name Matched'
        },
        {
          name: 'LLP Agreement Validation',
          detail: 'Designated Partners KYC Verified',
          result: 'Passed'
        }
      ],
      auditorRemarks: 'MSME registration and banking penny drop completed successfully.'
    }
  }
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'job',
    title: 'TechNova Solutions submitted a new job',
    statusTag: 'Pending Review',
    statusTagColor: 'lavender',
    description: 'Role: Senior React Architect • ₹32-45 LPA • Bangalore / Hybrid',
    timestamp: '5 minutes ago'
  },
  {
    id: 'act-2',
    type: 'kyc',
    title: 'Employer KYC Approved',
    statusTag: 'Verified by Admin',
    statusTagColor: 'green',
    description: 'Neubrain Solutions Pvt. Ltd. (CIN registered, tax clearance checked)',
    timestamp: '18 minutes ago'
  },
  {
    id: 'act-3',
    type: 'payment',
    title: 'Payment Captured: ₹4,999',
    statusTag: 'Success',
    statusTagColor: 'purple',
    description: 'Enterprise Quarterly Plan - Apex Corp via Razorpay Gateway',
    timestamp: '42 minutes ago'
  },
  {
    id: 'act-4',
    type: 'candidate',
    title: 'Candidate Profile Completed',
    statusTag: 'Score 100%',
    statusTagColor: 'lavender',
    description: 'Bhavuk Deshmukh uploaded portfolio + automated AI ATS score parsed',
    timestamp: '1 hour ago'
  },
  {
    id: 'act-5',
    type: 'complaint',
    title: 'Complaint Submitted',
    statusTag: 'High Priority',
    statusTagColor: 'red',
    description: 'Suspicious payment solicitation reported on Job #8821 (Immediate hold placed)',
    timestamp: '2 hours ago'
  },
  {
    id: 'act-6',
    type: 'approval',
    title: 'Job Approved: Product Designer',
    statusTag: 'Live',
    statusTagColor: 'green',
    description: 'Swiggy Design Studio • 12 candidates routed in first 60m',
    timestamp: '3 hours ago'
  }
];

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'adm-1',
    name: 'Bhavuk Deshmukh',
    email: 'bhavuk.deshmukh@careerflow.internal',
    avatarUrl: ADMIN_AVATAR,
    roles: ['Super Admin', 'Finance Manager'],
    activeRole: 'Super Admin',
    department: 'Platform Security & Governance',
    twoFactorEnabled: true,
  },
  {
    id: 'adm-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@careerflow.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roles: ['Admin'],
    activeRole: 'Admin',
    department: 'Platform Operations',
    twoFactorEnabled: true,
  },
  {
    id: 'adm-3',
    name: 'Marcus Vance',
    email: 'marcus.vance@careerflow.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roles: ['Moderator'],
    activeRole: 'Moderator',
    department: 'Trust, Compliance & KYC',
    twoFactorEnabled: true,
  },
  {
    id: 'adm-4',
    name: 'Priya Patel',
    email: 'priya.patel@careerflow.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    roles: ['Support Agent'],
    activeRole: 'Support Agent',
    department: 'Customer & Employer Support',
    twoFactorEnabled: false,
  },
  {
    id: 'adm-5',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@careerflow.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roles: ['Content Manager'],
    activeRole: 'Content Manager',
    department: 'Editorial & Marketing Spotlights',
    twoFactorEnabled: false,
  },
  {
    id: 'adm-6',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@careerflow.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    roles: ['Finance Manager'],
    activeRole: 'Finance Manager',
    department: 'Finance & Gateway Billing',
    twoFactorEnabled: true,
  },
];
