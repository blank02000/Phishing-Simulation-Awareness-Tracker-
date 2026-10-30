import * as XLSX from 'xlsx';
import {
  DeliverableCategory,
  DeliverableFileFormat,
  DeliverableDeliveryMode,
  DeliverableTrackingFrequency,
  DeliverablePeriodStatus,
  PlannedDeliverableRequirement,
  ActualDeliveryRecord,
  Customer,
} from '../types';

export const DELIVERABLE_CATEGORIES: {
  key: DeliverableCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
}[] = [
  {
    key: 'Infographics',
    label: 'Infographics',
    color: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    description: 'Visual security guides, attack breakdowns, and cheat sheets.',
  },
  {
    key: 'Posters',
    label: 'Posters',
    color: 'amber',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    description: 'Printable & digital office awareness posters and bulletin graphics.',
  },
  {
    key: 'Wallpapers',
    label: 'Wallpapers',
    color: 'teal',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    borderColor: 'border-teal-200',
    description: 'Corporate desktop wallpapers and mobile lock screens with tips.',
  },
  {
    key: 'Videos',
    label: 'Videos',
    color: 'rose',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    description: 'Short micro-learning security clips, real case studies, and animations.',
  },
  {
    key: 'SCORM content',
    label: 'SCORM Content',
    color: 'purple',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    description: 'Interactive SCORM 1.2 / 2004 e-learning packages for corporate LMS.',
  },
  {
    key: 'Games',
    label: 'Games & Gamification',
    color: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    description: 'Interactive cyber escape rooms, voice/SMS trainers, and crisis games.',
  },
  {
    key: 'Other',
    label: 'Other Deliverables',
    color: 'slate',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-300',
    description: 'Custom client policies, executive threat briefings, or custom campaigns.',
  },
];

export const DELIVERABLE_FILE_FORMATS: DeliverableFileFormat[] = [
  'MP4',
  'PNG',
  'JPG',
  'JPEG',
  'PDF',
  'PPT',
  'PPTX',
  'SCORM',
  'HTML',
  'ZIP',
  'Other',
];

export const DELIVERABLE_DELIVERY_MODES: DeliverableDeliveryMode[] = [
  'Email',
  'Email Campaign',
  'LMS',
  'Client Portal',
  'Teams',
  'Shared Drive',
  'Meeting',
  'Other',
];

export const DELIVERABLE_FREQUENCIES: DeliverableTrackingFrequency[] = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly',
];

export interface ReportingPeriod {
  key: string; // e.g. "2026-M01", "2026-Q1", "2026-H1", "2026-FY"
  label: string; // e.g. "January 2026", "Q1 2026 (Jan - Mar)", "H1 2026 (Jan - Jun)", "2026 Full Year"
  shortLabel: string; // e.g. "Jan", "Q1", "H1", "FY"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  frequency: DeliverableTrackingFrequency;
  year: number;
  periodIndex: number; // 1-indexed
}

/**
 * Generate standard reporting periods for a given frequency and year.
 */
export function generateReportingPeriods(
  frequency: DeliverableTrackingFrequency,
  year: number = 2026
): ReportingPeriod[] {
  switch (frequency) {
    case 'Monthly': {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const shortNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      return monthNames.map((name, idx) => {
        const monthNum = idx + 1;
        const mm = String(monthNum).padStart(2, '0');
        const lastDay = new Date(year, monthNum, 0).getDate();
        return {
          key: `${year}-M${mm}`,
          label: `${name} ${year}`,
          shortLabel: shortNames[idx],
          startDate: `${year}-${mm}-01`,
          endDate: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
          frequency: 'Monthly',
          year,
          periodIndex: monthNum,
        };
      });
    }

    case 'Quarterly': {
      return [
        {
          key: `${year}-Q1`,
          label: `Q1 ${year} (Jan – Mar)`,
          shortLabel: 'Q1',
          startDate: `${year}-01-01`,
          endDate: `${year}-03-31`,
          frequency: 'Quarterly',
          year,
          periodIndex: 1,
        },
        {
          key: `${year}-Q2`,
          label: `Q2 ${year} (Apr – Jun)`,
          shortLabel: 'Q2',
          startDate: `${year}-04-01`,
          endDate: `${year}-06-30`,
          frequency: 'Quarterly',
          year,
          periodIndex: 2,
        },
        {
          key: `${year}-Q3`,
          label: `Q3 ${year} (Jul – Sep)`,
          shortLabel: 'Q3',
          startDate: `${year}-07-01`,
          endDate: `${year}-09-30`,
          frequency: 'Quarterly',
          year,
          periodIndex: 3,
        },
        {
          key: `${year}-Q4`,
          label: `Q4 ${year} (Oct – Dec)`,
          shortLabel: 'Q4',
          startDate: `${year}-10-01`,
          endDate: `${year}-12-31`,
          frequency: 'Quarterly',
          year,
          periodIndex: 4,
        },
      ];
    }

    case 'Half-Yearly': {
      return [
        {
          key: `${year}-H1`,
          label: `H1 ${year} (Jan – Jun)`,
          shortLabel: 'H1',
          startDate: `${year}-01-01`,
          endDate: `${year}-06-30`,
          frequency: 'Half-Yearly',
          year,
          periodIndex: 1,
        },
        {
          key: `${year}-H2`,
          label: `H2 ${year} (Jul – Dec)`,
          shortLabel: 'H2',
          startDate: `${year}-07-01`,
          endDate: `${year}-12-31`,
          frequency: 'Half-Yearly',
          year,
          periodIndex: 2,
        },
      ];
    }

    case 'Yearly':
    default: {
      return [
        {
          key: `${year}-FY`,
          label: `${year} Full Year`,
          shortLabel: 'FY',
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          frequency: 'Yearly',
          year,
          periodIndex: 1,
        },
      ];
    }
  }
}

/**
 * Find or auto-calculate the appropriate reporting period for a specific date.
 */
export function getReportingPeriodForDate(
  dateStr: string,
  frequency: DeliverableTrackingFrequency
): ReportingPeriod {
  const date = new Date(dateStr);
  const year = isNaN(date.getFullYear()) ? 2026 : date.getFullYear();
  const periods = generateReportingPeriods(frequency, year);

  const matched = periods.find((p) => dateStr >= p.startDate && dateStr <= p.endDate);
  if (matched) return matched;

  // Fallback to closest period
  return periods[0];
}

export interface DeliverablePeriodCalculation {
  period: ReportingPeriod;
  plannedQuantity: number;
  deliveredQuantity: number;
  pendingQuantity: number;
  completionPercentage: number;
  lastDeliveryDate?: string;
  status: DeliverablePeriodStatus;
  matchingDeliveries: ActualDeliveryRecord[];
}

/**
 * Calculates delivery progress, completion percentage, and status for a single requirement across a period.
 */
export function calculateDeliverablePeriodProgress(
  requirement: PlannedDeliverableRequirement,
  deliveries: ActualDeliveryRecord[],
  period: ReportingPeriod,
  referenceDate: string
): DeliverablePeriodCalculation {
  const matchingDeliveries = deliveries.filter((d) => {
    // Primary match: requirementId
    if (d.requirementId && d.requirementId === requirement.id) {
      return d.reportingPeriodKey === period.key || (d.dateShared >= period.startDate && d.dateShared <= period.endDate);
    }
    // Secondary match: same customer, same license, same category, and matching period
    return (
      d.customerId === requirement.customerId &&
      d.licenseId === requirement.licenseId &&
      d.category === requirement.category &&
      (d.reportingPeriodKey === period.key || (d.dateShared >= period.startDate && d.dateShared <= period.endDate))
    );
  });

  const plannedQuantity = requirement.status === 'Inactive' ? 0 : requirement.targetQuantityPerPeriod;
  const deliveredQuantity = matchingDeliveries.reduce((sum, d) => sum + (d.quantity || 1), 0);
  const pendingQuantity = Math.max(0, plannedQuantity - deliveredQuantity);

  let completionPercentage = 0;
  if (plannedQuantity > 0) {
    completionPercentage = Math.min(100, Math.round((deliveredQuantity / plannedQuantity) * 100));
  } else if (deliveredQuantity > 0) {
    completionPercentage = 100;
  }

  // Find last delivery date
  let lastDeliveryDate: string | undefined;
  if (matchingDeliveries.length > 0) {
    const sorted = [...matchingDeliveries].sort((a, b) => b.dateShared.localeCompare(a.dateShared));
    lastDeliveryDate = sorted[0].dateShared;
  }

  // Status calculation
  let status: DeliverablePeriodStatus = 'Not Started';
  if (requirement.status === 'Inactive' || plannedQuantity === 0) {
    status = 'Not Applicable';
  } else if (deliveredQuantity >= plannedQuantity) {
    status = 'Completed';
  } else if (deliveredQuantity > 0) {
    status = referenceDate > period.endDate ? 'Overdue' : 'In Progress';
  } else {
    status = referenceDate > period.endDate ? 'Overdue' : 'Not Started';
  }

  return {
    period,
    plannedQuantity,
    deliveredQuantity,
    pendingQuantity,
    completionPercentage,
    lastDeliveryDate,
    status,
    matchingDeliveries,
  };
}

/**
 * Returns color classes for delivery status badges
 */
export function getDeliverableStatusBadge(status: DeliverablePeriodStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (status) {
    case 'Completed':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Completed',
      };
    case 'In Progress':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'In Progress',
      };
    case 'Overdue':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        label: 'Overdue',
      };
    case 'Not Started':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        label: 'Not Started',
      };
    case 'Not Applicable':
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-400',
        border: 'border-slate-200',
        label: 'N/A',
      };
  }
}

/**
 * Download sample template for Planned Requirements
 */
export function downloadRequirementTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = [
    'Client Name or ID',
    'License Key or ID',
    'Deliverable Category',
    'Requirement Title',
    'Tracking Frequency',
    'Target Quantity Per Period',
    'Year',
    'Start Date (YYYY-MM-DD)',
    'End Date (YYYY-MM-DD)',
    'Responsible CSM',
    'Notes',
  ];

  const sampleRows = [
    [
      'Apex Global Financial Services',
      'LIC-2026-APEX-9842',
      'Infographics',
      'Quarterly Cyber Threat Defense Infographic',
      'Quarterly',
      4,
      2026,
      '2026-01-01',
      '2026-12-31',
      'R. Gokulalakshmi',
      'Focus on mobile banking fraud & spear phishing',
    ],
    [
      'Apex Global Financial Services',
      'LIC-2026-APEX-9842',
      'Wallpapers',
      'Monthly Security Awareness Desktop Wallpaper',
      'Monthly',
      1,
      2026,
      '2026-01-01',
      '2026-12-31',
      'R. Gokulalakshmi',
      '12 wallpapers covering MFA, clean desk, password security',
    ],
    [
      'Apex Global Financial Services',
      'LIC-2026-APEX-9842',
      'Videos',
      'Semi-Annual Executive Incident Response Video',
      'Half-Yearly',
      1,
      2026,
      '2026-01-01',
      '2026-12-31',
      'Vinisha Mendonca',
      'Executive tabletop debrief video animation',
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Planned_Requirements');

  const fileName = `ProLMS_Planned_Deliverables_Template.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
}

/**
 * Download sample template for Actual Deliveries
 */
export function downloadDeliveryTemplate(format: 'xlsx' | 'csv' = 'xlsx') {
  const headers = [
    'Client Name or ID',
    'License Key or ID',
    'Deliverable Category',
    'Deliverable Title',
    'Actual File Name',
    'File Format',
    'Delivery Mode',
    'Date Shared (YYYY-MM-DD)',
    'Tracking Frequency',
    'Reporting Period Key',
    'Delivered Quantity',
    'Responsible CSM',
    'Reference URL / Link',
    'Remarks / Notes',
  ];

  const sampleRows = [
    [
      'Apex Global Financial Services',
      'LIC-2026-APEX-9842',
      'Infographics',
      'Q1 Cyber Threat Defense Infographic',
      'Apex_Q1_2026_Executive_Threat_Infographic.pdf',
      'PDF',
      'Email Campaign',
      '2026-02-15',
      'Quarterly',
      '2026-Q1',
      1,
      'R. Gokulalakshmi',
      'https://sharepoint.apexfinancial.com/secops/Q1_infographic.pdf',
      'Delivered to 1,250 mailboxes via M365 announcement',
    ],
    [
      'Apex Global Financial Services',
      'LIC-2026-APEX-9842',
      'Wallpapers',
      'January 2026 Security Desktop Wallpaper',
      'Jan2026_CleanDesk_Wallpaper_4K.png',
      'PNG',
      'Shared Drive',
      '2026-01-10',
      'Monthly',
      '2026-M01',
      1,
      'R. Gokulalakshmi',
      'https://sharepoint.apexfinancial.com/wallpapers/jan_2026.png',
      'Active wallpaper deployed via Microsoft Intune',
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Actual_Deliveries');

  const fileName = `ProLMS_Actual_Deliveries_Template.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
}

export interface DeliverableImportResult {
  success: boolean;
  type: 'requirements' | 'deliveries';
  totalRows: number;
  validRows: number;
  errorRows: number;
  errors: { row: number; column?: string; message: string; data?: any }[];
  parsedRequirements?: PlannedDeliverableRequirement[];
  parsedDeliveries?: ActualDeliveryRecord[];
}

/**
 * Robust parser for Bulk Deliverable CSV/Excel imports
 */
export async function parseDeliverableImportFile(
  file: File,
  customers: Customer[]
): Promise<DeliverableImportResult> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (rows.length < 2) {
    return {
      success: false,
      type: 'requirements',
      totalRows: 0,
      validRows: 0,
      errorRows: 0,
      errors: [{ row: 1, message: 'File is empty or contains no data rows.' }],
    };
  }

  const rawHeaders = rows[0].map((h: any) => String(h).trim().toLowerCase());
  const isActualDelivery =
    rawHeaders.some((h) => h.includes('file name') || h.includes('date shared') || h.includes('mode'));

  const errors: { row: number; column?: string; message: string; data?: any }[] = [];
  const parsedRequirements: PlannedDeliverableRequirement[] = [];
  const parsedDeliveries: ActualDeliveryRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty lines
    if (!row || row.every((c: any) => String(c).trim() === '')) continue;

    const rowNum = i + 1;

    if (isActualDelivery) {
      // Parse Actual Delivery
      const clientIdentifier = String(row[0] || '').trim();
      const licenseIdentifier = String(row[1] || '').trim();
      const category = String(row[2] || '').trim() as DeliverableCategory;
      const title = String(row[3] || '').trim();
      const fileName = String(row[4] || '').trim();
      const fileFormat = String(row[5] || 'PDF').trim().toUpperCase() as DeliverableFileFormat;
      const deliveryMode = String(row[6] || 'Email').trim() as DeliverableDeliveryMode;
      const dateShared = String(row[7] || '').trim();
      const frequency = (String(row[8] || 'Quarterly').trim() as DeliverableTrackingFrequency) || 'Quarterly';
      let periodKey = String(row[9] || '').trim();
      const quantity = Number(row[10]) || 1;
      const csmName = String(row[11] || '').trim();
      const referenceUrl = String(row[12] || '').trim();
      const remarks = String(row[13] || '').trim();

      // Find matching customer
      const customer = customers.find(
        (c) =>
          c.id === clientIdentifier ||
          c.companyName.toLowerCase() === clientIdentifier.toLowerCase()
      );
      if (!customer) {
        errors.push({
          row: rowNum,
          column: 'Client Name',
          message: `Customer "${clientIdentifier}" not found in system.`,
        });
        continue;
      }

      // Find matching license
      const license = customer.licenses?.find(
        (l) =>
          l.id === licenseIdentifier ||
          l.licenseKey.toLowerCase() === licenseIdentifier.toLowerCase()
      ) || customer.licenses?.[0];

      if (!license) {
        errors.push({
          row: rowNum,
          column: 'License Key',
          message: `No active license found for customer "${customer.companyName}".`,
        });
        continue;
      }

      if (!title) {
        errors.push({ row: rowNum, column: 'Deliverable Title', message: 'Deliverable title is required.' });
        continue;
      }

      if (!fileName) {
        errors.push({ row: rowNum, column: 'File Name', message: 'Actual file name is required.' });
        continue;
      }

      if (!dateShared || !/^\d{4}-\d{2}-\d{2}$/.test(dateShared)) {
        errors.push({
          row: rowNum,
          column: 'Date Shared',
          message: `Invalid date format "${dateShared}". Expected YYYY-MM-DD.`,
        });
        continue;
      }

      // Auto-compute period if blank
      const computedPeriod = getReportingPeriodForDate(dateShared, frequency);
      if (!periodKey) {
        periodKey = computedPeriod.key;
      }

      parsedDeliveries.push({
        id: `deliv-rec-import-${Date.now()}-${i}`,
        customerId: customer.id,
        customerName: customer.companyName,
        licenseId: license.id,
        licenseKey: license.licenseKey,
        category: (DELIVERABLE_CATEGORIES.some((c) => c.key === category) ? category : 'Other') as DeliverableCategory,
        title,
        fileName,
        fileFormat: (DELIVERABLE_FILE_FORMATS.includes(fileFormat) ? fileFormat : 'Other') as DeliverableFileFormat,
        deliveryMode: (DELIVERABLE_DELIVERY_MODES.includes(deliveryMode) ? deliveryMode : 'Other') as DeliverableDeliveryMode,
        dateShared,
        frequency,
        reportingPeriodKey: periodKey,
        reportingPeriodLabel: computedPeriod.label,
        reportingPeriodStartDate: computedPeriod.startDate,
        reportingPeriodEndDate: computedPeriod.endDate,
        csmName: csmName || customer.csmName || 'Assigned CSM',
        referenceUrl,
        remarks,
        quantity,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Parse Planned Requirement
      const clientIdentifier = String(row[0] || '').trim();
      const licenseIdentifier = String(row[1] || '').trim();
      const category = String(row[2] || '').trim() as DeliverableCategory;
      const title = String(row[3] || '').trim();
      const frequency = (String(row[4] || 'Quarterly').trim() as DeliverableTrackingFrequency) || 'Quarterly';
      const targetQuantity = Number(row[5]) || 1;
      const year = Number(row[6]) || 2026;
      const startDate = String(row[7] || `${year}-01-01`).trim();
      const endDate = String(row[8] || `${year}-12-31`).trim();
      const csmName = String(row[9] || '').trim();
      const notes = String(row[10] || '').trim();

      const customer = customers.find(
        (c) =>
          c.id === clientIdentifier ||
          c.companyName.toLowerCase() === clientIdentifier.toLowerCase()
      );
      if (!customer) {
        errors.push({
          row: rowNum,
          column: 'Client Name',
          message: `Customer "${clientIdentifier}" not found.`,
        });
        continue;
      }

      const license = customer.licenses?.find(
        (l) =>
          l.id === licenseIdentifier ||
          l.licenseKey.toLowerCase() === licenseIdentifier.toLowerCase()
      ) || customer.licenses?.[0];

      if (!license) {
        errors.push({
          row: rowNum,
          column: 'License Key',
          message: `No active license found for customer "${customer.companyName}".`,
        });
        continue;
      }

      if (!title) {
        errors.push({ row: rowNum, column: 'Requirement Title', message: 'Requirement title is required.' });
        continue;
      }

      if (targetQuantity <= 0) {
        errors.push({ row: rowNum, column: 'Target Quantity', message: 'Target quantity must be at least 1.' });
        continue;
      }

      parsedRequirements.push({
        id: `deliv-req-import-${Date.now()}-${i}`,
        customerId: customer.id,
        customerName: customer.companyName,
        licenseId: license.id,
        licenseKey: license.licenseKey,
        category: (DELIVERABLE_CATEGORIES.some((c) => c.key === category) ? category : 'Other') as DeliverableCategory,
        title,
        frequency,
        targetQuantityPerPeriod: targetQuantity,
        startDate,
        endDate,
        csmName: csmName || customer.csmName || 'Assigned CSM',
        status: 'Active',
        year,
        notes,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const validRows = isActualDelivery ? parsedDeliveries.length : parsedRequirements.length;
  return {
    success: errors.length === 0,
    type: isActualDelivery ? 'deliveries' : 'requirements',
    totalRows: rows.length - 1,
    validRows,
    errorRows: errors.length,
    errors,
    parsedRequirements: isActualDelivery ? undefined : parsedRequirements,
    parsedDeliveries: isActualDelivery ? parsedDeliveries : undefined,
  };
}

/**
 * Export filtered tracker data to Excel or CSV
 */
export function exportDeliverablesReport(
  data: {
    client: string;
    licenseKey: string;
    category: string;
    title: string;
    frequency: string;
    reportingPeriod: string;
    plannedQty: number;
    deliveredQty: number;
    pendingQty: number;
    completionPct: string;
    status: string;
    fileName?: string;
    fileFormat?: string;
    deliveryMode?: string;
    dateShared?: string;
    csm: string;
    notes?: string;
  }[],
  format: 'xlsx' | 'csv' = 'xlsx',
  fileName: string = 'ProLMS_Deliverable_Tracker_Report'
) {
  const headers = [
    'Client Name',
    'License Key',
    'Category',
    'Deliverable Title',
    'Frequency',
    'Reporting Period',
    'Planned Qty',
    'Delivered Qty',
    'Pending Qty',
    'Completion %',
    'Status',
    'Actual File Name',
    'File Format',
    'Delivery Mode',
    'Date Shared',
    'Responsible CSM',
    'Remarks / Notes',
  ];

  const rows = data.map((d) => [
    d.client,
    d.licenseKey,
    d.category,
    d.title,
    d.frequency,
    d.reportingPeriod,
    d.plannedQty,
    d.deliveredQty,
    d.pendingQty,
    d.completionPct,
    d.status,
    d.fileName || '—',
    d.fileFormat || '—',
    d.deliveryMode || '—',
    d.dateShared || '—',
    d.csm,
    d.notes || '—',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Deliverables_Report');

  const fullFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, fullFileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fullFileName, { bookType: 'xlsx' });
  }
}
