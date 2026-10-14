export type UserRole = 'Admin' | 'CSM';

export interface UserPermissions {
  canCreateCustomers: boolean;
  canEditCustomers: boolean;
  canDeleteCustomers: boolean;
  canManageUsers: boolean;
  canAssignCsm: boolean;
  canManageDrills: boolean;
  canExportReports: boolean;
  canManageCustomization?: boolean;
}

export const DEFAULT_ADMIN_PERMISSIONS: UserPermissions = {
  canCreateCustomers: true,
  canEditCustomers: true,
  canDeleteCustomers: true,
  canManageUsers: true,
  canAssignCsm: true,
  canManageDrills: true,
  canExportReports: true,
  canManageCustomization: true,
};

export const DEFAULT_CSM_PERMISSIONS: UserPermissions = {
  canCreateCustomers: true,
  canEditCustomers: true,
  canDeleteCustomers: false,
  canManageUsers: false,
  canAssignCsm: false,
  canManageDrills: true,
  canExportReports: true,
  canManageCustomization: false,
};

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  title: string;
  avatarColor: string;
  status: 'Active' | 'Inactive';
  permissions?: UserPermissions;
  customFields?: CustomField[];
  createdAt: string;
}

export type CustomFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'boolean'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'phone';

export interface CustomField {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  value?: any;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  section?: FormFieldSection;
  helpText?: string;
}

export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
  sessionDurationHours: number;
}

export type DrillStatus =
  | 'Upcoming'
  | 'Due Soon'
  | 'Completed'
  | 'Completed Late'
  | 'Overdue'
  | 'Not Completed'
  | 'Cancelled';

export type CustomerStatus = 'Active' | 'Onboarding' | 'At Risk' | 'Paused' | 'Inactive';

export type AnnualComplianceStatus = 'On Track' | 'Due Soon' | 'Overdue' | 'Completed' | 'At Risk';

export type ReviewMeetingStatus = 'Not Scheduled' | 'Scheduled' | 'Completed' | 'Cancelled';

export type DrillType =
  | 'Phishing Email Simulation'
  | 'Spear Phishing / Executive'
  | 'Smishing (SMS)'
  | 'Credential Harvesting'
  | 'Ransomware Awareness'
  | 'USB Drop / Physical'
  | 'Social Engineering Call'
  | 'Custom Drill';

export type DrillResult = 'Passed' | 'Needs Improvement' | 'High Risk' | 'Pending Review';

export interface ReviewMeeting {
  required: boolean;
  date?: string; // YYYY-MM-DD
  participants?: string;
  status: ReviewMeetingStatus;
  discussionPoints?: string;
  findings?: string;
  actionItems?: string;
  nextFollowUpDate?: string;
  customFields?: CustomField[];
}

export interface DrillRecord {
  id: string;
  drillNumber: number; // 1, 2, 3, 4...
  title: string;
  plannedDate: string; // YYYY-MM-DD
  actualCompletionDate?: string; // YYYY-MM-DD
  drillType: DrillType;
  status: DrillStatus;
  campaignName?: string;
  drillPeriodLabel?: string; // e.g. "July – September 2026"
  drillPeriodStart?: string; // YYYY-MM-DD
  drillPeriodEnd?: string; // YYYY-MM-DD
  sanctionedMonths?: string[]; // e.g. ["July", "August", "September"]
  quarter?: number; // 1, 2, 3, 4
  frequency?: string; // 'Quarterly' | 'Monthly' | 'Bi-Monthly' | 'Half-Yearly' | 'Yearly'
  participantsCount?: number;
  clickRate?: number; // 0 - 100%
  submissionRate?: number; // 0 - 100%
  reportingRate?: number; // 0 - 100%
  overallResult?: DrillResult;
  summary?: string;
  keyFindings?: string;
  recommendations?: string;
  notes?: string;
  notesCreatedAt?: string;
  notesCreatedBy?: string;
  notesUpdatedAt?: string;
  reviewMeeting?: ReviewMeeting;
  attachments?: string[];
  customFields?: CustomField[];
  createdAt?: string;
  updatedAt?: string;
}

export type DeliverableFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'one-time' | 'custom';

export type DeliverableStatus =
  | 'Upcoming'
  | 'Due Soon'
  | 'Completed'
  | 'Completed Late'
  | 'Overdue'
  | 'Not Completed'
  | 'Cancelled';

export interface LmsDeliverable {
  id: string;
  title: string;
  frequency: DeliverableFrequency;
  plannedDate: string; // YYYY-MM-DD
  actualCompletionDate?: string; // YYYY-MM-DD
  status: DeliverableStatus;
  targetAudience?: string; // e.g. "All Employees", "Engineering Dept"
  completionRate?: number; // 0 - 100%
  notes?: string;
  reviewMeeting?: ReviewMeeting;
  attachments?: string[];
  customFields?: CustomField[];
}

export interface AnnualPlan {
  year: number;
  annualRequirement: number; // e.g. 4
  startDate: string; // YYYY-MM-DD
  intervalMonths: number; // e.g. 3 for quarterly
  defaultDrillType?: DrillType;
  drills: DrillRecord[];
  deliverables?: LmsDeliverable[];
  notes?: string;
  customFields?: CustomField[];
}

export interface CustomerProducts {
  prophish: boolean; // Phishing simulation drills
  proLms: boolean;   // Online learning management system
  proPatrol: boolean; // Reporting button plugin for Microsoft and Google
}

export interface LicenseDetails {
  productPlan?: string;
  productSubscription?: string;
  adminUsersCount?: number;
  managedDrillFrequency?: string;
  targetEmployeesCount?: number;
  unlimitedSelfRunDrills?: string;
  templatesCount?: string;
  lookAlikeDomainsCount?: number;
  onSpotTrainingRequired?: string;
  onSpotTrainingFormat?: string;
  onSpotTrainingDelivery?: string;
  campaignReminders?: string;
  vigilantCertificate?: string;
  accessContentLibrary?: string;
  employeeDetailsSource?: string;
  reportsFormat?: string;
  lmsDeliverablesSummary?: string;
  propatrolUsersCount?: number;
  tiering?: string;
  companySector?: string;
  salesChannel?: string;
  country?: string;
  activationStatus?: string;
  maintenanceEndDate?: string;
}

export interface CustomerLicenseFile {
  id: string;
  licenseKey: string;
  name: string; // e.g. "Enterprise Annual Master License"
  planTier: string; // e.g. "Enterprise Cyber Suite"
  targetSeats: number;
  issueDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended';
  fileName?: string;
  fileSize?: number; // bytes
  fileType?: string;
  fileDataUrl?: string; // base64 / blob uri
  uploadedAt: string; // ISO string
  uploadedBy: string;
  notes?: string;
  isAutoGenerated?: boolean;
  digitalSignature?: string;
}

export type FormFieldSection =
  | 'accountDetails'
  | 'contacts'
  | 'licenseInfo'
  | 'generalNotes'
  | 'drillNotes'
  | 'userProfile';

export interface FormFieldCustomization {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  section: FormFieldSection;
  required: boolean;
  visible: boolean;
  order: number;
  placeholder?: string;
  options?: string[]; // For 'select'
  isSystem?: boolean; // System fields can be toggled/edited, cannot be deleted
  defaultValue?: any;
  helpText?: string;
}

export interface NotesCustomizationConfig {
  generalNoteCategories: string[];
  generalNotesDefaultTemplate: string;
  requireCategory: boolean;
  enableAuthorTag: boolean;
  drillNotesPrompt: string;
  drillNotesRequireReviewLink: boolean;
  enableDebriefInsights: boolean;
  overallNotesPlaceholder: string;
}

export interface LicenseCustomizationConfig {
  autoGenerateOnCustomerCreation: boolean;
  defaultValidityMonths: number;
  licenseKeyPrefix: string;
  defaultPlanTier: string;
  expiryWarningThresholdDays: number; // e.g. 60
  expiryCriticalThresholdDays: number; // e.g. 30
  allowedUploadFormats: string[]; // ['.pdf', '.docx', '.png', '.cert', '.json']
  maxUploadSizeMb: number; // e.g. 15
  requireExpiryDateOnUpload: boolean;
  requireLicenseKeyOnUpload: boolean;
}

export interface CustomizationSettings {
  fields: FormFieldCustomization[];
  notesConfig: NotesCustomizationConfig;
  licenseConfig: LicenseCustomizationConfig;
  updatedAt?: string;
  updatedBy?: string;
}

export type GeneralNoteCategory =
  | 'General'
  | 'Client Call'
  | 'Meeting'
  | 'Escalation'
  | 'Compliance'
  | 'Handover'
  | 'Renewal'
  | string;

export interface AccountGeneralNote {
  id: string;
  content: string;
  category: GeneralNoteCategory;
  createdAt: string; // ISO string e.g. 2026-09-23T08:52:00.000Z
  createdBy?: string;
  createdById?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  customerContact: string;
  contactEmail?: string;
  contactPhone?: string;
  cisoName?: string;
  cisoEmail?: string;
  cisoPhone?: string;
  accountOwner: string;
  csmId?: string; // ID of assigned CSM
  csmName?: string; // Cached display name of assigned CSM
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: CustomerStatus;
  industry?: string;
  notes?: string; // Overall account key notes / objectives
  overallNotesCreatedAt?: string;
  overallNotesUpdatedAt?: string;
  overallNotesUpdatedBy?: string;
  generalNotes?: AccountGeneralNote[];
  products: CustomerProducts;
  licenseDetails?: LicenseDetails;
  licenses?: CustomerLicenseFile[]; // Configurable uploaded & auto-generated licenses
  annualPlans: Record<number, AnnualPlan>; // Keyed by year e.g. 2026
  currentYear: number;
  customFields?: CustomField[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerComplianceSummary {
  year: number;
  annualRequirement: number;
  completedCount: number;
  completedOnTimeCount: number;
  completedLateCount: number;
  overdueCount: number;
  dueSoonCount: number;
  upcomingCount: number;
  nextDrill?: DrillRecord;
  lastDrill?: DrillRecord;
  lastReviewMeeting?: {
    drillNumber: number;
    meeting: ReviewMeeting;
  };
  reviewMeetingsCompletedCount: number;
  overallStatus: AnnualComplianceStatus;
  averageClickRate?: number;
  averageReportingRate?: number;
}

export interface AppReminder {
  id: string;
  customerId: string;
  companyName: string;
  drillId?: string;
  drillNumber?: number;
  type: 'drill_overdue' | 'drill_due_soon' | 'drill_active_period' | 'meeting_scheduled' | 'annual_at_risk';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueDate?: string;
  actionLabel?: string;
  sanctionedPeriodLabel?: string;
  sanctionedMonths?: string[];
  quarter?: number;
  daysRemainingInPeriod?: number;
  isCurrentActivePeriod?: boolean;
}
