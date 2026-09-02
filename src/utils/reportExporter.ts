import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, DrillRecord, AnnualComplianceStatus, AnnualPlan } from '../types';
import {
  calculateCustomerCompliance,
  computeDrillStatus,
  formatDisplayDate,
  parseDate,
} from './drillCalculator';

export interface MonthlyProgressSummary {
  monthIndex: number; // 0 - 11
  monthName: string; // e.g. "August"
  year: number;
  customer: Customer;
  csmName: string;
  csmEmail?: string;
  reportDate: string; // YYYY-MM-DD
  reportRef: string;
  overallStatus: AnnualComplianceStatus;
  annualRequirement: number;
  totalCompletedYtd: number;
  completionPercentageYtd: number;
  drillsThisMonth: DrillRecord[];
  drillsUpcomingNext60Days: DrillRecord[];
  reviewMeetingsThisMonth: {
    drillNumber: number;
    drillTitle: string;
    meetingDate?: string;
    status: string;
    participants?: string;
    findings?: string;
    actionItems?: string;
    nextFollowUpDate?: string;
  }[];
  averageClickRateYtd?: number;
  averageReportingRateYtd?: number;
  csmRecommendations: string[];
  dispatchCadence: {
    scheduledDate: string; // 1st of month
    status: 'Delivered' | 'Scheduled' | 'Pending';
    recipientEmail: string;
    recipientName: string;
  };
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getMonthlyProgress(
  customer: Customer,
  year: number,
  monthIndex: number, // 0 - 11
  referenceDate: string,
  dueSoonDays: number = 14
): MonthlyProgressSummary {
  const plan = customer.annualPlans[year] || {
    year,
    annualRequirement: 4,
    startDate: `${year}-01-01`,
    intervalMonths: 3,
    drills: [],
  };

  const compliance = calculateCustomerCompliance(customer, year, referenceDate, dueSoonDays);

  const monthStr = String(monthIndex + 1).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const monthEnd = `${year}-${monthStr}-${new Date(year, monthIndex + 1, 0).getDate()}`;

  // Drills occurring in this month (either completed or planned)
  const drillsThisMonth = (plan.drills || []).filter((d) => {
    const plannedInMonth = d.plannedDate >= monthStart && d.plannedDate <= monthEnd;
    const completedInMonth =
      d.actualCompletionDate &&
      d.actualCompletionDate >= monthStart &&
      d.actualCompletionDate <= monthEnd;
    return plannedInMonth || completedInMonth;
  });

  // Drills upcoming in the next 60 days from this month's end
  const next60End = new Date(year, monthIndex + 3, 0);
  const next60EndStr = `${next60End.getFullYear()}-${String(next60End.getMonth() + 1).padStart(2, '0')}-${String(next60End.getDate()).padStart(2, '0')}`;

  const drillsUpcomingNext60Days = (plan.drills || []).filter((d) => {
    return (
      d.plannedDate > monthEnd &&
      d.plannedDate <= next60EndStr &&
      d.status !== 'Completed' &&
      d.status !== 'Completed Late' &&
      d.status !== 'Cancelled'
    );
  });

  // Review meetings in this month
  const reviewMeetingsThisMonth = (plan.drills || [])
    .filter((d) => {
      const meeting = d.reviewMeeting;
      if (!meeting || !meeting.required) return false;
      if (meeting.date && meeting.date >= monthStart && meeting.date <= monthEnd) return true;
      // or if drill was completed this month
      if (
        d.actualCompletionDate &&
        d.actualCompletionDate >= monthStart &&
        d.actualCompletionDate <= monthEnd
      )
        return true;
      return false;
    })
    .map((d) => ({
      drillNumber: d.drillNumber,
      drillTitle: d.title,
      meetingDate: d.reviewMeeting?.date,
      status: d.reviewMeeting?.status || 'Not Scheduled',
      participants: d.reviewMeeting?.participants,
      findings: d.reviewMeeting?.findings,
      actionItems: d.reviewMeeting?.actionItems,
      nextFollowUpDate: d.reviewMeeting?.nextFollowUpDate,
    }));

  // Contextual CSM Recommendations
  const csmRecommendations: string[] = [];
  if (drillsThisMonth.some((d) => d.status === 'Overdue')) {
    csmRecommendations.push(
      `Escalate overdue drill with ${customer.customerContact} to ensure annual compliance quota is not compromised.`
    );
  }
  if (drillsThisMonth.some((d) => (d.clickRate ?? 0) > 5)) {
    csmRecommendations.push(
      `Phishing click rate exceeded 5% threshold this month. Suggest scheduling targeted remedial training for affected departments.`
    );
  }
  if (
    drillsThisMonth.some(
      (d) =>
        (d.status === 'Completed' || d.status === 'Completed Late') &&
        (!d.reviewMeeting || d.reviewMeeting.status === 'Not Scheduled')
    )
  ) {
    csmRecommendations.push(
      `Schedule executive debrief review meeting with ${customer.customerContact} for the recently concluded simulation.`
    );
  }
  if (drillsUpcomingNext60Days.length > 0) {
    csmRecommendations.push(
      `Next drill "${drillsUpcomingNext60Days[0].title}" planned on ${formatDisplayDate(drillsUpcomingNext60Days[0].plannedDate)}. Confirm simulation lure template 10 business days prior.`
    );
  }
  if (csmRecommendations.length === 0) {
    csmRecommendations.push(
      `Account is fully on track. Maintain monthly stakeholder contact and monitor security awareness reporting engagement.`
    );
  }

  const csmEmail =
    customer.csmName?.toLowerCase().replace(/\s+/g, '.') + '@cyberdrill.io' || 'csm@cyberdrill.io';

  const reportRef = `MPR-${year}-${String(monthIndex + 1).padStart(2, '0')}-${customer.id.substring(0, 8).toUpperCase()}`;

  return {
    monthIndex,
    monthName: MONTH_NAMES[monthIndex],
    year,
    customer,
    csmName: customer.csmName || 'Assigned CSM',
    csmEmail,
    reportDate: `${year}-${monthStr}-01`,
    reportRef,
    overallStatus: compliance.overallStatus,
    annualRequirement: compliance.annualRequirement,
    totalCompletedYtd: compliance.completedCount,
    completionPercentageYtd:
      compliance.annualRequirement > 0
        ? Math.round((compliance.completedCount / compliance.annualRequirement) * 100)
        : 0,
    drillsThisMonth,
    drillsUpcomingNext60Days,
    reviewMeetingsThisMonth,
    averageClickRateYtd: compliance.averageClickRate,
    averageReportingRateYtd: compliance.averageReportingRate,
    csmRecommendations,
    dispatchCadence: {
      scheduledDate: `${year}-${monthStr}-01`,
      status: referenceDate >= `${year}-${monthStr}-01` ? 'Delivered' : 'Scheduled',
      recipientEmail: csmEmail,
      recipientName: customer.csmName || 'Customer Success Manager',
    },
  };
}

/**
 * Exports data to CSV/Excel format and triggers download
 */
export function exportToExcel(filename: string, rows: (string | number | undefined | null)[][]) {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === undefined || cell === null) return '""';
          const stringValue = String(cell).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates structured single customer monthly progress CSV
 */
export function downloadSingleCustomerMonthlyExcel(
  summary: MonthlyProgressSummary,
  referenceDate: string
) {
  const rows: (string | number | undefined | null)[][] = [
    ['CYBERDRILL SECURITY OPERATIONS — MONTHLY ACCOUNT PROGRESS REPORT'],
    ['Generated On', formatDisplayDate(referenceDate)],
    ['Report Month', `${summary.monthName} ${summary.year}`],
    ['Report Reference ID', summary.reportRef],
    [],
    ['ACCOUNT DETAILS'],
    ['Customer Company', summary.customer.companyName],
    ['Customer Contact', summary.customer.customerContact],
    ['Contact Email', summary.customer.contactEmail || 'N/A'],
    ['Assigned CSM', summary.csmName],
    ['CSM Email (Dispatch Target)', summary.csmEmail],
    ['Internal Account Owner', summary.customer.accountOwner],
    ['Industry Sector', summary.customer.industry || 'Enterprise'],
    ['Annual Compliance Status', summary.overallStatus],
    ['Annual Target Drills', summary.annualRequirement],
    ['Completed YTD Drills', summary.totalCompletedYtd],
    ['Completion % YTD', `${summary.completionPercentageYtd}%`],
    ['Avg Click Rate YTD', summary.averageClickRateYtd !== undefined ? `${summary.averageClickRateYtd}%` : 'N/A'],
    ['Avg Reporting Rate YTD', summary.averageReportingRateYtd !== undefined ? `${summary.averageReportingRateYtd}%` : 'N/A'],
    [],
    ['MONTHLY DISPATCH SCHEDULE & CADENCE'],
    ['Cadence Schedule', '1st of Every Month (00:00 UTC)'],
    ['Scheduled Dispatch Date', formatDisplayDate(summary.dispatchCadence.scheduledDate)],
    ['Dispatch Status', summary.dispatchCadence.status],
    ['Recipient', `${summary.dispatchCadence.recipientName} <${summary.dispatchCadence.recipientEmail}>`],
    [],
    ['DRILLS EXECUTED / SCHEDULED IN THIS MONTH'],
    [
      'Drill #',
      'Title',
      'Simulation Type',
      'Planned Date',
      'Actual Date',
      'Status',
      'Click Rate (%)',
      'Submission Rate (%)',
      'Reporting Rate (%)',
      'Overall Result',
      'Key Findings',
    ],
  ];

  if (summary.drillsThisMonth.length === 0) {
    rows.push(['No drills scheduled in this specific calendar month', '', '', '', '', '', '', '', '', '', '']);
  } else {
    summary.drillsThisMonth.forEach((d) => {
      rows.push([
        `Drill ${d.drillNumber}`,
        d.title,
        d.drillType,
        d.plannedDate,
        d.actualCompletionDate || 'N/A',
        d.status,
        d.clickRate !== undefined ? `${d.clickRate}%` : 'N/A',
        d.submissionRate !== undefined ? `${d.submissionRate}%` : 'N/A',
        d.reportingRate !== undefined ? `${d.reportingRate}%` : 'N/A',
        d.overallResult || 'N/A',
        d.keyFindings || d.summary || 'N/A',
      ]);
    });
  }

  rows.push([]);
  rows.push(['DEBRIEF & REVIEW MEETINGS FOR THIS MONTH']);
  rows.push([
    'Drill #',
    'Drill Title',
    'Meeting Status',
    'Meeting Date',
    'Attendees',
    'Vulnerability Findings',
    'Action Items',
    'Next Follow-Up Date',
  ]);

  if (summary.reviewMeetingsThisMonth.length === 0) {
    rows.push(['No review meetings logged for this month', '', '', '', '', '', '', '']);
  } else {
    summary.reviewMeetingsThisMonth.forEach((m) => {
      rows.push([
        `Drill ${m.drillNumber}`,
        m.drillTitle,
        m.status,
        m.meetingDate || 'Not Scheduled',
        m.participants || 'N/A',
        m.findings || 'N/A',
        m.actionItems || 'N/A',
        m.nextFollowUpDate || 'N/A',
      ]);
    });
  }

  rows.push([]);
  rows.push(['UPCOMING DRILLS IN NEXT 60 DAYS']);
  rows.push(['Drill #', 'Title', 'Simulation Type', 'Planned Date', 'Status']);

  if (summary.drillsUpcomingNext60Days.length === 0) {
    rows.push(['No drills in the immediate 60-day window', '', '', '', '']);
  } else {
    summary.drillsUpcomingNext60Days.forEach((d) => {
      rows.push([`Drill ${d.drillNumber}`, d.title, d.drillType, d.plannedDate, d.status]);
    });
  }

  rows.push([]);
  rows.push(['CSM MONTHLY ACTION ITEMS & RECOMMENDATIONS']);
  summary.csmRecommendations.forEach((rec, idx) => {
    rows.push([`${idx + 1}.`, rec]);
  });

  const filename = `Monthly_Progress_${summary.customer.companyName.replace(/\s+/g, '_')}_${summary.monthName}_${summary.year}.csv`;
  exportToExcel(filename, rows);
}

/**
 * Generates portfolio-wide monthly progress matrix Excel export
 */
export function downloadPortfolioMonthlyExcel(
  customers: Customer[],
  year: number,
  monthIndex: number,
  referenceDate: string
) {
  const monthName = MONTH_NAMES[monthIndex];
  const rows: (string | number | undefined | null)[][] = [
    ['CYBERDRILL — PORTFOLIO MONTHLY PROGRESS AUDIT MATRIX'],
    ['Month & Year', `${monthName} ${year}`],
    ['Generated Date', formatDisplayDate(referenceDate)],
    ['Total Accounts', customers.length],
    ['Auto-Dispatch Cadence', '1st of Month to Assigned CSMs'],
    [],
    [
      'Company Name',
      'Assigned CSM',
      'CSM Email',
      'Customer Contact',
      'Compliance Status',
      'Annual Target',
      'Completed YTD',
      'Completion %',
      'Drills In Month',
      'Reviews In Month',
      'Avg Click Rate (%)',
      'Avg Reporting Rate (%)',
      'Next Drill Date',
      'Dispatch Status',
    ],
  ];

  customers.forEach((c) => {
    const summary = getMonthlyProgress(c, year, monthIndex, referenceDate);
    const nextDrill = summary.drillsUpcomingNext60Days[0];

    rows.push([
      c.companyName,
      c.csmName || 'Unassigned',
      summary.csmEmail,
      c.customerContact,
      summary.overallStatus,
      summary.annualRequirement,
      summary.totalCompletedYtd,
      `${summary.completionPercentageYtd}%`,
      summary.drillsThisMonth.length,
      summary.reviewMeetingsThisMonth.length,
      summary.averageClickRateYtd !== undefined ? `${summary.averageClickRateYtd}%` : 'N/A',
      summary.averageReportingRateYtd !== undefined ? `${summary.averageReportingRateYtd}%` : 'N/A',
      nextDrill ? formatDisplayDate(nextDrill.plannedDate) : 'None scheduled',
      summary.dispatchCadence.status,
    ]);
  });

  const filename = `Portfolio_Monthly_Progress_${monthName}_${year}.csv`;
  exportToExcel(filename, rows);
}

/**
 * =========================================================================
 * HIGH-QUALITY PDF GENERATION USING jsPDF & AUTO-TABLE
 * Downloads standalone .pdf files directly to disk without window.print() issues
 * =========================================================================
 */

export function downloadMonthlyProgressPDF(
  summary: MonthlyProgressSummary,
  referenceDate: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- HEADER SECTION ---
  // Dark Blue Top Brand Bar
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CYBERDRILL SECURITY OPERATIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(219, 234, 254);
  doc.text(
    `MONTHLY ACCOUNT PROGRESS REPORT • ${summary.monthName.toUpperCase()} ${summary.year}`,
    14,
    19
  );

  doc.setFontSize(8);
  doc.setTextColor(191, 219, 254);
  doc.text(`Ref: ${summary.reportRef}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Dispatched: 1st of Month Cadence`, pageWidth - 14, 19, { align: 'right' });

  let curY = 34;

  // --- ACCOUNT OVERVIEW BOX ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(summary.customer.companyName, 18, curY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Industry: ${summary.customer.industry || 'Enterprise'}`, 18, curY + 13);
  doc.text(`Primary Contact: ${summary.customer.customerContact} (${summary.customer.contactEmail || 'N/A'})`, 18, curY + 18);
  doc.text(`Internal Account Owner: ${summary.customer.accountOwner}`, 18, curY + 23);

  // Right Side of Account Box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`Assigned CSM: ${summary.csmName}`, pageWidth - 18, curY + 7, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`CSM Direct Email: ${summary.csmEmail}`, pageWidth - 18, curY + 13, { align: 'right' });
  doc.text(`Compliance Status: ${summary.overallStatus.toUpperCase()}`, pageWidth - 18, curY + 18, { align: 'right' });

  curY += 32;

  // --- METRIC TILES ---
  const boxWidth = (pageWidth - 28 - 9) / 4;
  const metrics = [
    { label: 'ANNUAL TARGET', value: `${summary.annualRequirement} Drills`, sub: `${summary.year} Requirement` },
    { label: 'COMPLETED YTD', value: `${summary.totalCompletedYtd} Drills`, sub: `${summary.completionPercentageYtd}% Quota Met` },
    { label: 'AVG CLICK RATE', value: summary.averageClickRateYtd !== undefined ? `${summary.averageClickRateYtd}%` : '—', sub: 'Employee Baseline' },
    { label: 'AVG REPORTING', value: summary.averageReportingRateYtd !== undefined ? `${summary.averageReportingRateYtd}%` : '—', sub: 'Phish Alert Rate' },
  ];

  metrics.forEach((m, idx) => {
    const bx = 14 + idx * (boxWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(bx, curY, boxWidth, 18, 1.5, 1.5, 'FD');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, bx + 3, curY + 5);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, bx + 3, curY + 11.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, bx + 3, curY + 15.5);
  });

  curY += 24;

  // --- SECTION 1: DRILLS THIS MONTH ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. Drills Executed / Scheduled in ${summary.monthName} ${summary.year}`, 14, curY);
  curY += 3;

  const drillHeaders = [['#', 'Simulation Title', 'Type', 'Planned Date', 'Actual Date', 'Status', 'Click %', 'Report %', 'Result']];
  const drillRows = summary.drillsThisMonth.map((d) => [
    `#${d.drillNumber}`,
    d.title,
    d.drillType,
    formatDisplayDate(d.plannedDate),
    d.actualCompletionDate ? formatDisplayDate(d.actualCompletionDate) : 'Pending',
    d.status,
    d.clickRate !== undefined ? `${d.clickRate}%` : '—',
    d.reportingRate !== undefined ? `${d.reportingRate}%` : '—',
    d.overallResult || '—',
  ]);

  if (drillRows.length === 0) {
    drillRows.push(['—', `No simulation drills scheduled for ${summary.monthName} ${summary.year}`, '—', '—', '—', '—', '—', '—', '—']);
  }

  autoTable(doc, {
    head: drillHeaders,
    body: drillRows,
    startY: curY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // --- SECTION 2: REVIEW MEETINGS & DEBRIEFS ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`2. Executive Debriefs & Review Sessions (${summary.monthName} ${summary.year})`, 14, curY);
  curY += 3;

  const reviewHeaders = [['Drill', 'Meeting Date', 'Status', 'Attendees', 'Key Findings & Remediation Items']];
  const reviewRows = summary.reviewMeetingsThisMonth.map((m) => [
    `Drill ${m.drillNumber}: ${m.drillTitle}`,
    m.meetingDate ? formatDisplayDate(m.meetingDate) : 'Not Scheduled',
    m.status,
    m.participants || 'None listed',
    [
      m.findings ? `Findings: ${m.findings}` : '',
      m.actionItems ? `Actions: ${m.actionItems}` : '',
      m.nextFollowUpDate ? `Next Follow-Up: ${formatDisplayDate(m.nextFollowUpDate)}` : '',
    ]
      .filter(Boolean)
      .join('\n') || 'No minutes recorded',
  ]);

  if (reviewRows.length === 0) {
    reviewRows.push(['—', '—', 'None', '—', `No debrief review sessions logged for ${summary.monthName} ${summary.year}`]);
  }

  autoTable(doc, {
    head: reviewHeaders,
    body: reviewRows,
    startY: curY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229], // Indigo 600
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      4: { cellWidth: 80 },
    },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need page break before recommendations
  if (curY > 230) {
    doc.addPage();
    curY = 20;
  }

  // --- SECTION 3: UPCOMING 60 DAYS & CSM ACTION PLAN ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Upcoming Pipeline (Next 60 Days) & CSM Action Plan', 14, curY);
  curY += 4;

  // Box for recommendations
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  const recsHeight = Math.max(26, summary.csmRecommendations.length * 6 + 10);
  doc.roundedRect(14, curY, pageWidth - 28, recsHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('CSM Priority Recommendations:', 18, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  summary.csmRecommendations.forEach((rec, idx) => {
    doc.text(`• ${rec}`, 18, curY + 12 + idx * 5.5, { maxWidth: pageWidth - 36 });
  });

  curY += recsHeight + 10;

  // --- FOOTER ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CyberDrill Security Awareness & Phishing Simulation Platform • Confidential', 14, 288);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 288, { align: 'right' });
  }

  const filename = `Monthly_Progress_${summary.customer.companyName.replace(/\s+/g, '_')}_${summary.monthName}_${summary.year}.pdf`;
  doc.save(filename);
}

/**
 * Downloads Annual Compliance Audit Report PDF
 */
export function downloadAnnualAuditPDF(
  customer: Customer,
  selectedYear: number,
  compliance: ReturnType<typeof calculateCustomerCompliance>,
  drills: DrillRecord[],
  referenceDate: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Dark Blue Top Brand Bar
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CYBERDRILL SECURITY OPERATIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`ANNUAL COMPLIANCE AUDIT REPORT • FISCAL YEAR ${selectedYear}`, 14, 19);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Ref: CDR-${selectedYear}-${customer.id.substring(0, 6).toUpperCase()}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Generated: ${formatDisplayDate(referenceDate)}`, pageWidth - 14, 19, { align: 'right' });

  let curY = 34;

  // Account Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(customer.companyName, 18, curY + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Industry: ${customer.industry || 'Enterprise'} | Contact: ${customer.customerContact}`, 18, curY + 14);
  doc.text(`Internal Account Owner: ${customer.accountOwner}`, 18, curY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Assigned CSM: ${customer.csmName || 'Unassigned'}`, pageWidth - 18, curY + 7, { align: 'right' });
  doc.setTextColor(30, 58, 138);
  doc.text(`Audit Status: ${compliance.overallStatus.toUpperCase()}`, pageWidth - 18, curY + 14, { align: 'right' });

  curY += 30;

  // Metric Cards
  const boxWidth = (pageWidth - 28 - 12) / 5;
  const metrics = [
    { label: 'ANNUAL TARGET', value: `${compliance.annualRequirement}`, sub: 'Drill Quota' },
    { label: 'COMPLETED', value: `${compliance.completedCount}`, sub: `${Math.round((compliance.completedCount / compliance.annualRequirement) * 100)}% Fulfilled` },
    { label: 'ON TIME', value: `${compliance.completedOnTimeCount}`, sub: 'Met SLA' },
    { label: 'LATE', value: `${compliance.completedLateCount}`, sub: 'Delayed' },
    { label: 'DEBRIEFS', value: `${compliance.reviewMeetingsCompletedCount}`, sub: 'Reviews Held' },
  ];

  metrics.forEach((m, idx) => {
    const bx = 14 + idx * (boxWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(bx, curY, boxWidth, 18, 1.5, 1.5, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, bx + 2.5, curY + 5);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(m.value, bx + 2.5, curY + 11.5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, bx + 2.5, curY + 15.5);
  });

  curY += 24;

  // Drills Log Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Drill Execution Log & Audit Evidence (${selectedYear})`, 14, curY);
  curY += 3;

  const drillHeaders = [['#', 'Title', 'Simulation Type', 'Planned', 'Actual', 'Status', 'Click %', 'Report %', 'Outcome', 'Debrief']];
  const drillRows = drills.map((d) => [
    `#${d.drillNumber}`,
    d.title,
    d.drillType,
    formatDisplayDate(d.plannedDate),
    d.actualCompletionDate ? formatDisplayDate(d.actualCompletionDate) : '—',
    d.status,
    d.clickRate !== undefined ? `${d.clickRate}%` : '—',
    d.reportingRate !== undefined ? `${d.reportingRate}%` : '—',
    d.overallResult || '—',
    d.reviewMeeting ? d.reviewMeeting.status : 'None',
  ]);

  autoTable(doc, {
    head: drillHeaders,
    body: drillRows,
    startY: curY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  curY = (doc as any).lastAutoTable.finalY + 8;

  // Attestation Statement
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Security Operations Compliance Attestation', 18, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This document certifies that cybersecurity awareness drills and phishing simulations for ${customer.companyName} were executed and tracked according to mandated enterprise security policies for calendar year ${selectedYear}.`,
    18,
    curY + 12,
    { maxWidth: pageWidth - 36 }
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CyberDrill Security Awareness & Phishing Simulation Platform • Confidential', 14, 288);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 288, { align: 'right' });
  }

  const filename = `Annual_Audit_Report_${customer.companyName.replace(/\s+/g, '_')}_${selectedYear}.pdf`;
  doc.save(filename);
}

/**
 * Downloads Portfolio Matrix PDF
 */
export function downloadPortfolioPDF(
  customers: Customer[],
  year: number,
  monthIndex: number,
  referenceDate: string
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const monthName = MONTH_NAMES[monthIndex];

  // Dark Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CYBERDRILL — PORTFOLIO MONTHLY PROGRESS AUDIT MATRIX', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(219, 234, 254);
  doc.text(`Reporting Period: ${monthName} ${year} • Generated: ${formatDisplayDate(referenceDate)} • Auto-Dispatched to CSMs on 1st of Month`, 14, 18);

  const headers = [[
    'Company Name',
    'Assigned CSM',
    'Customer Contact',
    'Compliance',
    'Annual Target',
    'Completed YTD',
    'Quota %',
    'Drills In Month',
    'Reviews In Month',
    'Avg Click Rate',
    'Dispatch Status',
  ]];

  const rows = customers.map((c) => {
    const summary = getMonthlyProgress(c, year, monthIndex, referenceDate);
    return [
      c.companyName,
      c.csmName || 'Unassigned',
      c.customerContact,
      summary.overallStatus,
      summary.annualRequirement,
      summary.totalCompletedYtd,
      `${summary.completionPercentageYtd}%`,
      summary.drillsThisMonth.length,
      summary.reviewMeetingsThisMonth.length,
      summary.averageClickRateYtd !== undefined ? `${summary.averageClickRateYtd}%` : '—',
      summary.dispatchCadence.status,
    ];
  });

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 30,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('CyberDrill Security Awareness Platform • Portfolio Progress Summary', 14, 200);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, 200, { align: 'right' });
  }

  const filename = `Portfolio_Monthly_Progress_${monthName}_${year}.pdf`;
  doc.save(filename);
}
