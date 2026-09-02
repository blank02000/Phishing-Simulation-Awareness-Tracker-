export type UserRole = 'Admin' | 'CSM';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarColor: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
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
  participantsCount?: number;
  clickRate?: number; // 0 - 100%
  submissionRate?: number; // 0 - 100%
  reportingRate?: number; // 0 - 100%
  overallResult?: DrillResult;
  summary?: string;
  keyFindings?: string;
  recommendations?: string;
  notes?: string;
  reviewMeeting?: ReviewMeeting;
  attachments?: string[];
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

export interface Customer {
  id: string;
  companyName: string;
  customerContact: string;
  contactEmail?: string;
  contactPhone?: string;
  accountOwner: string;
  csmId?: string; // ID of assigned CSM
  csmName?: string; // Cached display name of assigned CSM
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status: CustomerStatus;
  industry?: string;
  notes?: string;
  products: CustomerProducts;
  licenseDetails?: LicenseDetails;
  annualPlans: Record<number, AnnualPlan>; // Keyed by year e.g. 2026
  currentYear: number;
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
  type: 'drill_overdue' | 'drill_due_soon' | 'meeting_scheduled' | 'annual_at_risk';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dueDate?: string;
  actionLabel?: string;
}
