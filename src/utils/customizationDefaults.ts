import {
  CustomizationSettings,
  FormFieldCustomization,
  CustomerLicenseFile,
  LicenseCustomizationConfig,
} from '../types';

export const DEFAULT_FORM_FIELDS: FormFieldCustomization[] = [
  // Section: accountDetails
  {
    id: 'f-company-name',
    key: 'companyName',
    label: 'Company Name',
    type: 'text',
    section: 'accountDetails',
    required: true,
    visible: true,
    order: 1,
    placeholder: 'e.g. Acme Financial Group',
    isSystem: true,
    helpText: 'Official client organization name',
  },
  {
    id: 'f-industry',
    key: 'industry',
    label: 'Industry Sector',
    type: 'select',
    section: 'accountDetails',
    required: false,
    visible: true,
    order: 2,
    placeholder: 'Select industry',
    options: [
      'Banking & Financial Services',
      'Healthcare & Life Sciences',
      'Technology & SaaS',
      'Manufacturing & Supply Chain',
      'Retail & E-commerce',
      'Government & Defense',
      'Conglomerate',
      'Higher Education',
      'Energy & Utilities',
      'Other',
    ],
    isSystem: true,
  },
  {
    id: 'f-status',
    key: 'status',
    label: 'Account Status',
    type: 'select',
    section: 'accountDetails',
    required: true,
    visible: true,
    order: 3,
    options: ['Active', 'Onboarding', 'At Risk', 'Paused', 'Inactive'],
    defaultValue: 'Active',
    isSystem: true,
  },
  {
    id: 'f-account-owner',
    key: 'accountOwner',
    label: 'Account Owner',
    type: 'text',
    section: 'accountDetails',
    required: true,
    visible: true,
    order: 4,
    placeholder: 'e.g. Vinisha Mendonca',
    isSystem: true,
  },
  {
    id: 'f-csm-id',
    key: 'csmId',
    label: 'Assigned Customer Success Manager (CSM)',
    type: 'select',
    section: 'accountDetails',
    required: false,
    visible: true,
    order: 5,
    placeholder: 'Select CSM',
    isSystem: true,
  },
  {
    id: 'f-start-date',
    key: 'startDate',
    label: 'Contract Start Date',
    type: 'date',
    section: 'accountDetails',
    required: true,
    visible: true,
    order: 6,
    isSystem: true,
  },
  {
    id: 'f-end-date',
    key: 'endDate',
    label: 'Contract Renewal / End Date',
    type: 'date',
    section: 'accountDetails',
    required: false,
    visible: true,
    order: 7,
    isSystem: true,
  },
  {
    id: 'f-notes-mandate',
    key: 'notes',
    label: 'Overall Account Key Mandate & Objectives',
    type: 'textarea',
    section: 'accountDetails',
    required: false,
    visible: true,
    order: 8,
    placeholder: 'Executive security targets, regulatory guidelines (PCI-DSS, ISO27001), board reporting criteria...',
    isSystem: true,
  },

  // Section: contacts
  {
    id: 'f-cust-contact',
    key: 'customerContact',
    label: 'Primary Account Contact',
    type: 'text',
    section: 'contacts',
    required: true,
    visible: true,
    order: 1,
    placeholder: 'e.g. Sarah Jenkins',
    isSystem: true,
  },
  {
    id: 'f-contact-email',
    key: 'contactEmail',
    label: 'Primary Contact Email',
    type: 'email',
    section: 'contacts',
    required: false,
    visible: true,
    order: 2,
    placeholder: 'contact@clientdomain.com',
    isSystem: true,
  },
  {
    id: 'f-contact-phone',
    key: 'contactPhone',
    label: 'Primary Contact Phone',
    type: 'tel',
    section: 'contacts',
    required: false,
    visible: true,
    order: 3,
    placeholder: '+1 (555) 000-0000',
    isSystem: true,
  },
  {
    id: 'f-ciso-name',
    key: 'cisoName',
    label: 'CISO / Security Head Name',
    type: 'text',
    section: 'contacts',
    required: false,
    visible: true,
    order: 4,
    placeholder: 'e.g. Marcus Thorne (CISO)',
    isSystem: true,
  },
  {
    id: 'f-ciso-email',
    key: 'cisoEmail',
    label: 'CISO Official Email',
    type: 'email',
    section: 'contacts',
    required: false,
    visible: true,
    order: 5,
    placeholder: 'ciso@clientdomain.com',
    isSystem: true,
  },
  {
    id: 'f-ciso-phone',
    key: 'cisoPhone',
    label: 'CISO Direct Phone / Hotline',
    type: 'tel',
    section: 'contacts',
    required: false,
    visible: true,
    order: 6,
    placeholder: '+1 (555) 000-1111',
    isSystem: true,
  },

  // Section: licenseInfo
  {
    id: 'f-product-plan',
    key: 'productPlan',
    label: 'Product Plan & Edition',
    type: 'select',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 1,
    options: [
      'Enterprise Cyber Suite',
      'Enterprise Pro',
      'Standard Security Suite',
      'ProPhish Dedicated',
      'ProLMS Compliance Edition',
      'Custom Tier',
    ],
    defaultValue: 'Enterprise Cyber Suite',
    isSystem: true,
  },
  {
    id: 'f-product-subscription',
    key: 'productSubscription',
    label: 'Subscription Tier & Billing Cycle',
    type: 'select',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 2,
    options: ['Annual Tier 1', 'Annual Tier 2', 'Multi-Year 3-Year', 'Quarterly Retainer', 'Trial / POC'],
    defaultValue: 'Annual Tier 1',
    isSystem: true,
  },
  {
    id: 'f-target-employees',
    key: 'targetEmployeesCount',
    label: 'Licensed Employee Target Seats',
    type: 'number',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 3,
    placeholder: 'e.g. 500',
    defaultValue: 500,
    isSystem: true,
  },
  {
    id: 'f-admin-users',
    key: 'adminUsersCount',
    label: 'Licensed Admin Seats',
    type: 'number',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 4,
    defaultValue: 5,
    isSystem: true,
  },
  {
    id: 'f-look-alike-domains',
    key: 'lookAlikeDomainsCount',
    label: 'Allocated Look-Alike Domains',
    type: 'number',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 5,
    defaultValue: 3,
    isSystem: true,
  },
  {
    id: 'f-tiering',
    key: 'tiering',
    label: 'Enterprise Tiering Rank',
    type: 'select',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 6,
    options: ['Tier 1 (High Priority)', 'Tier 2 (Standard)', 'Tier 3 (Basic)', 'Strategic Board Key Account'],
    defaultValue: 'Tier 1 (High Priority)',
    isSystem: true,
  },
  {
    id: 'f-country',
    key: 'country',
    label: 'Operating Country / Jurisdiction',
    type: 'text',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 7,
    placeholder: 'e.g. United States, India, UK',
    isSystem: true,
  },
  {
    id: 'f-activation-status',
    key: 'activationStatus',
    label: 'License Activation Status',
    type: 'select',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 8,
    options: ['Active', 'Pending Provisioning', 'Grace Period', 'Suspended', 'Expired'],
    defaultValue: 'Active',
    isSystem: true,
  },
  {
    id: 'f-maint-end-date',
    key: 'maintenanceEndDate',
    label: 'Maintenance & Support Expiry Date',
    type: 'date',
    section: 'licenseInfo',
    required: false,
    visible: true,
    order: 9,
    isSystem: true,
  },

  // Section: generalNotes
  {
    id: 'f-gnote-category',
    key: 'gnoteCategory',
    label: 'Note Interaction Category',
    type: 'select',
    section: 'generalNotes',
    required: true,
    visible: true,
    order: 1,
    options: ['Client Call', 'Meeting', 'Escalation', 'Compliance', 'Handover', 'Renewal', 'Technical Review'],
    isSystem: true,
  },
  {
    id: 'f-gnote-content',
    key: 'gnoteContent',
    label: 'Activity & Discussion Details',
    type: 'textarea',
    section: 'generalNotes',
    required: true,
    visible: true,
    order: 2,
    placeholder: 'Log summary of meeting, decisions made, client requests or operational handovers...',
    isSystem: true,
  },

  // Section: drillNotes
  {
    id: 'f-dnote-content',
    key: 'drillNotesContent',
    label: 'Drill Operational Notes',
    type: 'textarea',
    section: 'drillNotes',
    required: false,
    visible: true,
    order: 1,
    placeholder: 'Operational anomalies, target scope clarifications, gateway whitelisting confirmations...',
    isSystem: true,
  },
  {
    id: 'f-dnote-summary',
    key: 'drillSummary',
    label: 'Executive Drill Summary',
    type: 'textarea',
    section: 'drillNotes',
    required: false,
    visible: true,
    order: 2,
    placeholder: 'High-level synthesis of drill results for stakeholders...',
    isSystem: true,
  },
  // Section: userProfile
  {
    id: 'f-user-name',
    key: 'name',
    label: 'Full Name',
    type: 'text',
    section: 'userProfile',
    required: true,
    visible: true,
    order: 1,
    placeholder: 'e.g. Maya Chen',
    isSystem: true,
  },
  {
    id: 'f-user-email',
    key: 'email',
    label: 'Work Email Address (Sign-In ID)',
    type: 'email',
    section: 'userProfile',
    required: true,
    visible: true,
    order: 2,
    placeholder: 'e.g. maya.chen@progist.net',
    isSystem: true,
  },
  {
    id: 'f-user-title',
    key: 'title',
    label: 'Job Title / Specialization',
    type: 'text',
    section: 'userProfile',
    required: false,
    visible: true,
    order: 3,
    placeholder: 'Senior Customer Success Manager',
    isSystem: true,
  },
];

export const DEFAULT_NOTES_CONFIG = {
  generalNoteCategories: [
    'General',
    'Client Call',
    'Meeting',
    'Escalation',
    'Compliance',
    'Handover',
    'Renewal',
    'Technical Review',
    'Executive Debrief',
  ],
  generalNotesDefaultTemplate: 'Summary of call/meeting:\n- Key discussion points:\n- Client feedback:\n- Next action items:',
  requireCategory: true,
  enableAuthorTag: true,
  drillNotesPrompt: 'Record operational details, whitelisting validations, and observations during execution.',
  drillNotesRequireReviewLink: false,
  enableDebriefInsights: true,
  overallNotesPlaceholder: 'Strategic account security directives, board audit requirements, and contractual milestones...',
};

export const DEFAULT_LICENSE_CONFIG: LicenseCustomizationConfig = {
  autoGenerateOnCustomerCreation: true,
  defaultValidityMonths: 12,
  licenseKeyPrefix: 'LIC-2026-',
  defaultPlanTier: 'Enterprise Cyber Suite',
  expiryWarningThresholdDays: 60,
  expiryCriticalThresholdDays: 30,
  allowedUploadFormats: ['.xlsx', '.xls', '.csv', '.pdf', '.docx', '.png', '.jpg', '.cert', '.json', '.txt'],
  maxUploadSizeMb: 15,
  requireExpiryDateOnUpload: true,
  requireLicenseKeyOnUpload: true,
};

export const DEFAULT_CUSTOMIZATION_SETTINGS: CustomizationSettings = {
  fields: DEFAULT_FORM_FIELDS,
  notesConfig: DEFAULT_NOTES_CONFIG,
  licenseConfig: DEFAULT_LICENSE_CONFIG,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

/**
 * Generate a cryptographically styled digital license record
 */
export function generateDigitalLicense(
  companyName: string,
  config: LicenseCustomizationConfig,
  overrides?: Partial<CustomerLicenseFile>
): CustomerLicenseFile {
  const acronym = companyName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || 'CORP';

  const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
  const year = new Date().getFullYear();
  const licenseKey = overrides?.licenseKey || `${config.licenseKeyPrefix || `LIC-${year}-`}${acronym}-${randomHash}`;

  const today = new Date();
  const issueDate = overrides?.issueDate || today.toISOString().split('T')[0];

  let expiryDate = overrides?.expiryDate;
  if (!expiryDate) {
    const exp = new Date(today);
    exp.setMonth(exp.getMonth() + (config.defaultValidityMonths || 12));
    expiryDate = exp.toISOString().split('T')[0];
  }

  const status = calculateLicenseStatus(
    expiryDate,
    config.expiryWarningThresholdDays || 60,
    config.expiryCriticalThresholdDays || 30
  );

  return {
    id: `lic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    licenseKey,
    name: overrides?.name || `${companyName} Digital Master Certificate`,
    planTier: overrides?.planTier || config.defaultPlanTier || 'Enterprise Cyber Suite',
    targetSeats: overrides?.targetSeats || 500,
    issueDate,
    expiryDate,
    status,
    uploadedAt: new Date().toISOString(),
    uploadedBy: overrides?.uploadedBy || 'System Auto-Provisioning',
    notes: overrides?.notes || 'Automatically generated digital enterprise license upon customer registration.',
    isAutoGenerated: true,
    digitalSignature: `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
  };
}

/**
 * Calculate dynamic status from expiry date
 */
export function calculateLicenseStatus(
  expiryDateStr?: string,
  warningDays = 60,
  _criticalDays = 30
): 'Active' | 'Expiring Soon' | 'Expired' {
  if (!expiryDateStr) return 'Active';
  const diffDays = getDaysUntilExpiry(expiryDateStr);
  if (diffDays < 0) return 'Expired';
  if (diffDays <= warningDays) return 'Expiring Soon';
  return 'Active';
}

/**
 * Returns number of days remaining until expiry (negative if overdue)
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
  if (!expiryDateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expiryDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
