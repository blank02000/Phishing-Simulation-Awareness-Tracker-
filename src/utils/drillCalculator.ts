import {
  Customer,
  AnnualPlan,
  DrillRecord,
  DrillStatus,
  CustomerComplianceSummary,
  AppReminder,
  DrillType,
  LmsDeliverable,
  DeliverableStatus,
} from '../types';

export const SYSTEM_TODAY = '2026-08-17';

/**
 * Parses YYYY-MM-DD to a local Date object without timezone shift bugs
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats Date to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD into a human-readable string: "Aug 15, 2026"
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Returns Month short name (e.g. "FEB", "MAY")
 */
export function formatMonthShort(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  } catch {
    return '—';
  }
}

/**
 * Formats a date into a campaign execution month window (e.g. "JUL – AUG", "Mid July – Mid August").
 * Phishing simulation campaigns span a 3-4 week period rather than a single fixed day.
 */
export function formatSimulationMonthWindow(
  dateStr?: string,
  mode: 'badge' | 'months' | 'detailed' | 'full' = 'badge'
): string {
  if (!dateStr) return '—';
  try {
    const d = parseDate(dateStr);
    const day = d.getDate();
    const startMonthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const startMonthFull = d.toLocaleDateString('en-US', { month: 'short' });
    const startMonthLong = d.toLocaleDateString('en-US', { month: 'long' });

    // Simulation campaign window runs ~28 to 30 days
    const endD = new Date(d);
    endD.setDate(endD.getDate() + 28);
    const endMonthShort = endD.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const endMonthFull = endD.toLocaleDateString('en-US', { month: 'short' });
    const endMonthLong = endD.toLocaleDateString('en-US', { month: 'long' });

    // Same month or cross month
    const isCrossMonth = startMonthShort !== endMonthShort;

    if (mode === 'badge') {
      if (isCrossMonth) {
        return `${startMonthShort} – ${endMonthShort}`;
      }
      return startMonthShort;
    }

    if (mode === 'months') {
      if (isCrossMonth) {
        return `${startMonthFull} – ${endMonthFull}`;
      }
      return startMonthFull;
    }

    if (mode === 'detailed') {
      if (day >= 10 && day <= 24) {
        return isCrossMonth
          ? `Mid ${startMonthLong} – Mid ${endMonthLong}`
          : `Mid ${startMonthLong}`;
      } else if (day > 24) {
        return isCrossMonth
          ? `Late ${startMonthLong} – ${endMonthLong}`
          : `Late ${startMonthLong}`;
      } else {
        return isCrossMonth
          ? `Early ${startMonthLong} – Early ${endMonthLong}`
          : `Early ${startMonthLong}`;
      }
    }

    // Default 'full'
    return isCrossMonth ? `${startMonthLong} – ${endMonthLong}` : startMonthLong;
  } catch {
    return dateStr;
  }
}

/**
 * Days difference between two YYYY-MM-DD strings (d2 - d1)
 */
export function daysBetween(d1Str: string, d2Str: string): number {
  const d1 = parseDate(d1Str);
  const d2 = parseDate(d2Str);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
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

export interface SanctionedDrillPeriodInfo {
  label: string; // e.g. "July – September 2026"
  quarter?: number; // 1, 2, 3, 4
  quarterLabel: string; // "Q3"
  months: string[]; // ["July", "August", "September"]
  startDate: string; // "2026-07-01"
  endDate: string; // "2026-09-30"
  isCurrentPeriod: boolean; // referenceDate is inside [startDate, endDate]
  isPastPeriod: boolean; // referenceDate > endDate
  isUpcomingPeriod: boolean; // referenceDate < startDate
  daysRemainingInPeriod: number; // if current, days until endDate
  daysOverdueIfPast: number; // if past, days since endDate
  statusText: string;
}

/**
 * Calculates the exact sanctioned period (e.g. quarterly 3-month window like July-September)
 * for a drill given its index, frequency, and interval.
 */
export function calculateSanctionedPeriod(
  startDateStr: string,
  drillIndex: number,
  intervalMonths: number = 3,
  drillCount: number = 4,
  frequencyStr?: string
): {
  label: string;
  quarter?: number;
  quarterLabel: string;
  months: string[];
  startDate: string;
  endDate: string;
} {
  const baseDate = parseDate(startDateStr);
  const baseYear = baseDate.getFullYear();
  const freq = (frequencyStr || '').toLowerCase();
  const isQuarterly = intervalMonths === 3 || drillCount === 4 || freq.includes('quarter');

  if (isQuarterly) {
    // Standard calendar quarters: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec)
    // Offset by start date month if license started mid-year
    const startQuarterIndex = Math.floor(baseDate.getMonth() / 3);
    const quarterIndex = (startQuarterIndex + drillIndex) % 4;
    const yearOffset = Math.floor((startQuarterIndex + drillIndex) / 4);
    const targetYear = baseYear + yearOffset;
    const quarterNumber = quarterIndex + 1;

    const startMonthIdx = quarterIndex * 3;
    const endMonthIdx = startMonthIdx + 2;

    const startM = MONTH_NAMES[startMonthIdx];
    const endM = MONTH_NAMES[endMonthIdx];
    const months = [
      MONTH_NAMES[startMonthIdx],
      MONTH_NAMES[startMonthIdx + 1],
      MONTH_NAMES[endMonthIdx],
    ];

    const lastDayOfEndMonth = new Date(targetYear, endMonthIdx + 1, 0).getDate();
    const startDate = `${targetYear}-${String(startMonthIdx + 1).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(endMonthIdx + 1).padStart(2, '0')}-${String(
      lastDayOfEndMonth
    ).padStart(2, '0')}`;

    return {
      label: `${startM} – ${endM} ${targetYear}`,
      quarter: quarterNumber,
      quarterLabel: `Q${quarterNumber}`,
      months,
      startDate,
      endDate,
    };
  }

  // Monthly, Bi-Monthly, Half-Yearly, Yearly
  const drillStartMonthOffset = baseDate.getMonth() + drillIndex * intervalMonths;
  const targetYear = baseYear + Math.floor(drillStartMonthOffset / 12);
  const startMonthIdx = drillStartMonthOffset % 12;
  const endMonthIdx = (startMonthIdx + intervalMonths - 1) % 12;

  const months: string[] = [];
  for (let m = 0; m < intervalMonths; m++) {
    months.push(MONTH_NAMES[(startMonthIdx + m) % 12]);
  }

  const lastDay = new Date(targetYear, endMonthIdx + 1, 0).getDate();
  const startDate = `${targetYear}-${String(startMonthIdx + 1).padStart(2, '0')}-01`;
  const endDate = `${targetYear}-${String(endMonthIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(
    2,
    '0'
  )}`;

  const label =
    intervalMonths === 1
      ? `${MONTH_NAMES[startMonthIdx]} ${targetYear}`
      : `${MONTH_NAMES[startMonthIdx]} – ${MONTH_NAMES[endMonthIdx]} ${targetYear}`;

  const quarterNumber = Math.floor(startMonthIdx / 3) + 1;

  return {
    label,
    quarter: quarterNumber,
    quarterLabel: `Q${quarterNumber}`,
    months,
    startDate,
    endDate,
  };
}

/**
 * Returns comprehensive sanctioned drill period information for any drill record.
 * Works with new drills (with stored drillPeriod fields) or derives on the fly for backwards compatibility.
 */
export function getSanctionedDrillPeriod(
  drill: DrillRecord,
  referenceDate: string = SYSTEM_TODAY
): SanctionedDrillPeriodInfo {
  let startDate = drill.drillPeriodStart;
  let endDate = drill.drillPeriodEnd;
  let label = drill.drillPeriodLabel;
  let months = drill.sanctionedMonths;
  let quarter = drill.quarter;

  if (!startDate || !endDate || !label || !months) {
    const pDate = parseDate(drill.plannedDate || referenceDate);
    const pYear = pDate.getFullYear();
    const pMonth = pDate.getMonth();
    const derivedQuarter = quarter || Math.floor(pMonth / 3) + 1;
    const startMIdx = (derivedQuarter - 1) * 3;
    const endMIdx = startMIdx + 2;
    const lastDay = new Date(pYear, endMIdx + 1, 0).getDate();

    startDate = `${pYear}-${String(startMIdx + 1).padStart(2, '0')}-01`;
    endDate = `${pYear}-${String(endMIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    months = [MONTH_NAMES[startMIdx], MONTH_NAMES[startMIdx + 1], MONTH_NAMES[endMIdx]];
    label = `${MONTH_NAMES[startMIdx]} – ${MONTH_NAMES[endMIdx]} ${pYear}`;
    quarter = derivedQuarter;
  }

  const isCurrentPeriod = referenceDate >= startDate && referenceDate <= endDate;
  const isPastPeriod = referenceDate > endDate;
  const isUpcomingPeriod = referenceDate < startDate;
  const daysRemainingInPeriod = isCurrentPeriod ? Math.max(0, daysBetween(referenceDate, endDate)) : 0;
  const daysOverdueIfPast = isPastPeriod ? Math.max(0, daysBetween(endDate, referenceDate)) : 0;

  let statusText = '';
  if (isCurrentPeriod) {
    statusText = `Active Period (${label}) • ${daysRemainingInPeriod} days remaining to complete`;
  } else if (isPastPeriod) {
    statusText = `Missed Period (${label}) • Overdue by ${daysOverdueIfPast} days`;
  } else {
    statusText = `Upcoming Period (${label}) • Starts ${formatDisplayDate(startDate)}`;
  }

  return {
    label,
    quarter,
    quarterLabel: `Q${quarter || 1}`,
    months,
    startDate,
    endDate,
    isCurrentPeriod,
    isPastPeriod,
    isUpcomingPeriod,
    daysRemainingInPeriod,
    daysOverdueIfPast,
    statusText,
  };
}

/**
 * Evaluates drill status dynamically based on planned date, actual date, current date,
 * and the sanctioned drill period window.
 */
export function computeDrillStatus(
  drill: DrillRecord,
  referenceDate: string = SYSTEM_TODAY,
  dueSoonThresholdDays: number = 14
): DrillStatus {
  // If explicitly cancelled or marked not completed
  if (drill.status === 'Cancelled' || drill.status === 'Not Completed') {
    return drill.status;
  }

  // Always resolve the full sanctioned drill period window (e.g. 3-month window for quarterly drills)
  const period = getSanctionedDrillPeriod(drill, referenceDate);

  // If actual completion date is recorded
  if (drill.actualCompletionDate) {
    const isLate = drill.actualCompletionDate > period.endDate;
    return isLate ? 'Completed Late' : 'Completed';
  }

  // 1. OVERDUE CHECK:
  // A drill is strictly ONLY overdue if the entire sanctioned drill period (e.g. 3-month quarter window)
  // has passed without completion (referenceDate > period.endDate).
  // If we are currently inside the 3-month period (or before it), it is NOT overdue!
  if (referenceDate > period.endDate) {
    return 'Overdue';
  }

  // 2. ACTIVE SANCTIONED PERIOD (Inside the 3-month window):
  if (period.isCurrentPeriod) {
    // As long as we are in the 3-month period, it is NEVER overdue.
    const daysUntilEnd = period.daysRemainingInPeriod;
    const daysUntilPlanned = daysBetween(referenceDate, drill.plannedDate);

    // It is marked "Due Soon" if:
    // - The tentative planned launch date has arrived/passed (actively open drill to complete this quarter)
    // - Or the planned launch date is approaching within threshold (e.g. <= 14 days)
    // - Or the 3-month period is closing within threshold (e.g. <= 14 days)
    if (
      drill.plannedDate <= referenceDate ||
      daysUntilPlanned <= dueSoonThresholdDays ||
      daysUntilEnd <= dueSoonThresholdDays
    ) {
      return 'Due Soon';
    }

    return 'Upcoming';
  }

  // 3. UPCOMING PERIOD (The 3-month period hasn't started yet):
  const daysUntilPlanned = daysBetween(referenceDate, drill.plannedDate);
  if (daysUntilPlanned >= 0 && daysUntilPlanned <= dueSoonThresholdDays) {
    return 'Due Soon';
  }

  return 'Upcoming';
}

/**
 * Evaluates Pro LMS deliverable status dynamically based on planned date, actual date, and current date
 */
export function computeDeliverableStatus(
  deliverable: LmsDeliverable,
  referenceDate: string = SYSTEM_TODAY,
  dueSoonThresholdDays: number = 14
): DeliverableStatus {
  if (deliverable.status === 'Cancelled' || deliverable.status === 'Not Completed') {
    return deliverable.status;
  }

  if (deliverable.actualCompletionDate) {
    const isLate = deliverable.actualCompletionDate > deliverable.plannedDate;
    return isLate ? 'Completed Late' : 'Completed';
  }

  if (deliverable.plannedDate < referenceDate) {
    return 'Overdue';
  }

  const daysUntil = daysBetween(referenceDate, deliverable.plannedDate);
  if (daysUntil >= 0 && daysUntil <= dueSoonThresholdDays) {
    return 'Due Soon';
  }

  return 'Upcoming';
}

/**
 * Automatically generates a list of DrillRecords for an annual plan based on start date,
 * number of drills per year, interval in months, and drill type.
 * Properly sanctions months for the customer drill period (e.g. July - September).
 * NOTE: Review meetings are NOT pre-created; CSM creates them on demand.
 */
export function generateAnnualTimeline(
  startDateStr: string,
  drillCount: number = 4,
  intervalMonths: number = 3,
  defaultDrillType: DrillType = 'Phishing Email Simulation',
  frequencyStr?: string
): DrillRecord[] {
  const drills: DrillRecord[] = [];
  const baseDate = parseDate(startDateStr);

  for (let i = 0; i < drillCount; i++) {
    const drillNumber = i + 1;
    const period = calculateSanctionedPeriod(startDateStr, i, intervalMonths, drillCount, frequencyStr);

    const drillDate = new Date(baseDate);
    drillDate.setMonth(baseDate.getMonth() + i * intervalMonths);
    const plannedDate = formatDateISO(drillDate);

    drills.push({
      id: `drill-${Date.now()}-${drillNumber}-${Math.random().toString(36).substring(2, 6)}`,
      drillNumber,
      title: `Drill ${drillNumber} — ${period.quarterLabel} (${period.label})`,
      plannedDate,
      drillType: defaultDrillType,
      status: 'Upcoming',
      campaignName: `${period.quarterLabel} Phishing Simulation Campaign`,
      drillPeriodLabel: period.label,
      drillPeriodStart: period.startDate,
      drillPeriodEnd: period.endDate,
      sanctionedMonths: period.months,
      quarter: period.quarter,
      frequency:
        frequencyStr ||
        (intervalMonths === 3
          ? 'Quarterly'
          : intervalMonths === 1
          ? 'Monthly'
          : intervalMonths === 6
          ? 'Half Yearly'
          : 'Yearly'),
      // Review meetings are NOT pre-created. CSM creates them on demand.
    });
  }

  return drills;
}

function formatQuarterOrMonth(date: Date, drillNum: number): string {
  const dateStr = formatDateISO(date);
  const monthWindow = formatSimulationMonthWindow(dateStr, 'months');
  return `Q${Math.min(drillNum, 4)} (${monthWindow})`;
}

/**
 * Calculates customer compliance stats for a given year
 */
export function calculateCustomerCompliance(
  customer: Customer,
  year: number = customer.currentYear || 2026,
  referenceDate: string = SYSTEM_TODAY,
  dueSoonThresholdDays: number = 14
): CustomerComplianceSummary {
  const plan = customer.annualPlans[year];
  const annualRequirement = plan?.annualRequirement ?? 4;

  if (!plan || !plan.drills || plan.drills.length === 0) {
    return {
      year,
      annualRequirement,
      completedCount: 0,
      completedOnTimeCount: 0,
      completedLateCount: 0,
      overdueCount: 0,
      dueSoonCount: 0,
      upcomingCount: 0,
      reviewMeetingsCompletedCount: 0,
      overallStatus: 'On Track',
    };
  }

  let completedOnTimeCount = 0;
  let completedLateCount = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;
  let upcomingCount = 0;
  let reviewMeetingsCompletedCount = 0;

  let totalClickRate = 0;
  let clickRateCount = 0;
  let totalReportingRate = 0;
  let reportingRateCount = 0;

  // Sort drills by drillNumber
  const sortedDrills = [...plan.drills].sort((a, b) => a.drillNumber - b.drillNumber);

  let nextDrill: DrillRecord | undefined;
  let lastDrill: DrillRecord | undefined;
  let lastReviewMeeting: { drillNumber: number; meeting: NonNullable<DrillRecord['reviewMeeting']> } | undefined;

  for (const drill of sortedDrills) {
    const computedStatus = computeDrillStatus(drill, referenceDate, dueSoonThresholdDays);

    if (computedStatus === 'Completed') {
      completedOnTimeCount++;
      lastDrill = drill;
    } else if (computedStatus === 'Completed Late') {
      completedLateCount++;
      lastDrill = drill;
    } else if (computedStatus === 'Overdue') {
      overdueCount++;
      if (!nextDrill) nextDrill = drill;
    } else if (computedStatus === 'Due Soon') {
      dueSoonCount++;
      if (!nextDrill) nextDrill = drill;
    } else if (computedStatus === 'Upcoming') {
      upcomingCount++;
      if (!nextDrill) nextDrill = drill;
    }

    if (drill.clickRate !== undefined) {
      totalClickRate += drill.clickRate;
      clickRateCount++;
    }
    if (drill.reportingRate !== undefined) {
      totalReportingRate += drill.reportingRate;
      reportingRateCount++;
    }

    if (
      drill.reviewMeeting &&
      drill.reviewMeeting.status !== 'Not Scheduled' &&
      drill.reviewMeeting.date
    ) {
      if (drill.reviewMeeting.status === 'Completed') {
        reviewMeetingsCompletedCount++;
        lastReviewMeeting = { drillNumber: drill.drillNumber, meeting: drill.reviewMeeting };
      } else if (drill.reviewMeeting.status === 'Scheduled' && !lastReviewMeeting) {
        lastReviewMeeting = { drillNumber: drill.drillNumber, meeting: drill.reviewMeeting };
      }
    }
  }

  const completedCount = completedOnTimeCount + completedLateCount;

  // Determine overall status
  let overallStatus: CustomerComplianceSummary['overallStatus'] = 'On Track';
  if (completedCount >= annualRequirement) {
    overallStatus = 'Completed';
  } else if (overdueCount > 0) {
    overallStatus = 'Overdue';
  } else if (dueSoonCount > 0) {
    overallStatus = 'Due Soon';
  } else if (customer.status === 'At Risk') {
    overallStatus = 'At Risk';
  } else {
    overallStatus = 'On Track';
  }

  return {
    year,
    annualRequirement,
    completedCount,
    completedOnTimeCount,
    completedLateCount,
    overdueCount,
    dueSoonCount,
    upcomingCount,
    nextDrill,
    lastDrill,
    lastReviewMeeting,
    reviewMeetingsCompletedCount,
    overallStatus,
    averageClickRate: clickRateCount > 0 ? +(totalClickRate / clickRateCount).toFixed(1) : undefined,
    averageReportingRate: reportingRateCount > 0 ? +(totalReportingRate / reportingRateCount).toFixed(1) : undefined,
  };
}

/**
 * Generates proactive operational reminders and action items across all customers,
 * with first-class support for Sanctioned Drill Periods (e.g. July - September Q3 window).
 */
export function generateReminders(
  customers: Customer[],
  referenceDate: string = SYSTEM_TODAY,
  dueSoonDays: number = 14
): AppReminder[] {
  const reminders: AppReminder[] = [];

  for (const customer of customers) {
    const year = customer.currentYear || 2026;
    const plan = customer.annualPlans[year];
    if (!plan || !plan.drills) continue;

    for (const drill of plan.drills) {
      const period = getSanctionedDrillPeriod(drill, referenceDate);
      const status = computeDrillStatus(drill, referenceDate, dueSoonDays);

      if (status === 'Overdue') {
        const daysAgo = period.daysOverdueIfPast || daysBetween(drill.plannedDate, referenceDate);
        reminders.push({
          id: `rem-overdue-${customer.id}-${drill.id}`,
          customerId: customer.id,
          companyName: customer.companyName,
          drillId: drill.id,
          drillNumber: drill.drillNumber,
          type: 'drill_overdue',
          severity: 'high',
          title: `${customer.companyName} — Drill ${drill.drillNumber} Overdue (Missed ${period.label})`,
          description: `Sanctioned drill period (${period.label}) ended without completion (${daysAgo} days overdue).`,
          dueDate: period.endDate || drill.plannedDate,
          actionLabel: 'Mark Drill Completed',
          sanctionedPeriodLabel: period.label,
          sanctionedMonths: period.months,
          quarter: period.quarter,
          daysRemainingInPeriod: 0,
          isCurrentActivePeriod: false,
        });
      } else if (
        period.isCurrentPeriod &&
        !drill.actualCompletionDate &&
        drill.status !== 'Cancelled' &&
        drill.status !== 'Not Completed'
      ) {
        // Active quarterly drill period (e.g. July - September)
        reminders.push({
          id: `rem-active-period-${customer.id}-${drill.id}`,
          customerId: customer.id,
          companyName: customer.companyName,
          drillId: drill.id,
          drillNumber: drill.drillNumber,
          type: 'drill_active_period',
          severity: period.daysRemainingInPeriod <= 30 ? 'high' : 'medium',
          title: `${customer.companyName} — Drill ${drill.drillNumber}: ${period.label} Active`,
          description: `Sanctioned 3-month drill period (${period.label}) is open. Complete simulation before quarter ends (${period.daysRemainingInPeriod} days remaining).`,
          dueDate: period.endDate,
          actionLabel: 'Fill / Complete Drill',
          sanctionedPeriodLabel: period.label,
          sanctionedMonths: period.months,
          quarter: period.quarter,
          daysRemainingInPeriod: period.daysRemainingInPeriod,
          isCurrentActivePeriod: true,
        });
      } else if (status === 'Due Soon') {
        const daysLeft = daysBetween(referenceDate, drill.plannedDate);
        reminders.push({
          id: `rem-duesoon-${customer.id}-${drill.id}`,
          customerId: customer.id,
          companyName: customer.companyName,
          drillId: drill.id,
          drillNumber: drill.drillNumber,
          type: 'drill_due_soon',
          severity: 'medium',
          title: `${customer.companyName} — Drill ${drill.drillNumber} due soon (${period.label})`,
          description: `Scheduled execution for ${formatDisplayDate(drill.plannedDate)} (${
            daysLeft === 0 ? 'Due Today' : `in ${daysLeft} days`
          }).`,
          dueDate: drill.plannedDate,
          actionLabel: 'Fill / Complete Drill',
          sanctionedPeriodLabel: period.label,
          sanctionedMonths: period.months,
          quarter: period.quarter,
          daysRemainingInPeriod: period.daysRemainingInPeriod,
          isCurrentActivePeriod: period.isCurrentPeriod,
        });
      }

      // Check review meeting status ONLY IF actually created/scheduled by CSM
      if (
        drill.reviewMeeting &&
        drill.reviewMeeting.status === 'Scheduled' &&
        drill.reviewMeeting.date
      ) {
        const daysUntilMeeting = daysBetween(referenceDate, drill.reviewMeeting.date);
        if (daysUntilMeeting >= 0 && daysUntilMeeting <= 14) {
          const dayLabel =
            daysUntilMeeting === 0
              ? 'Today'
              : daysUntilMeeting === 1
              ? 'Tomorrow'
              : `in ${daysUntilMeeting} days`;
          reminders.push({
            id: `rem-meeting-${customer.id}-${drill.id}`,
            customerId: customer.id,
            companyName: customer.companyName,
            drillId: drill.id,
            drillNumber: drill.drillNumber,
            type: 'meeting_scheduled',
            severity: 'low',
            title: `${customer.companyName} — Review Meeting scheduled ${dayLabel}`,
            description: `CSM Debrief meeting for Drill ${drill.drillNumber} on ${formatDisplayDate(
              drill.reviewMeeting.date
            )}.`,
            dueDate: drill.reviewMeeting.date,
            actionLabel: 'Open Meeting Details',
          });
        }
      }
    }

    // Check if customer is significantly behind on annual quota
    const compliance = calculateCustomerCompliance(customer, year, referenceDate, dueSoonDays);
    if (compliance.overallStatus !== 'Completed' && compliance.completedCount < compliance.annualRequirement) {
      const currentMonth = parseDate(referenceDate).getMonth() + 1; // 1-12
      if (currentMonth >= 8 && compliance.completedCount <= compliance.annualRequirement / 2) {
        reminders.push({
          id: `rem-annual-risk-${customer.id}`,
          customerId: customer.id,
          companyName: customer.companyName,
          type: 'annual_at_risk',
          severity: 'medium',
          title: `${customer.companyName} — Annual drill quota at risk`,
          description: `Completed only ${compliance.completedCount} of ${compliance.annualRequirement} required annual drills with ${12 - currentMonth} months remaining.`,
          actionLabel: 'Review Customer Plan',
        });
      }
    }
  }

  // Sort by severity (high -> medium -> low) and dueDate
  const severityScore = { high: 1, medium: 2, low: 3 };
  return reminders.sort((a, b) => {
    if (severityScore[a.severity] !== severityScore[b.severity]) {
      return severityScore[a.severity] - severityScore[b.severity];
    }
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });
}

export interface DashboardKPIs {
  totalCustomers: number;
  activeCustomers: number;
  drillsCompletedLastMonth: number;
  drillsDueThisMonth: number;
  drillsDueNextMonth: number;
  overdueDrills: number;
  upcomingReviewMeetings: number;
  annualDrillsCompleted: number;
  customersAtRisk: number;
  onTrackCustomers: number;
  dueSoonCustomers: number;
  overdueCustomers: number;
  urgentDrillsList: { customer: Customer; drill: DrillRecord }[];
}

export function calculateDashboardKPIs(
  customers: Customer[],
  referenceDate: string = SYSTEM_TODAY,
  dueSoonDays: number = 14
): DashboardKPIs {
  const refDateObj = parseDate(referenceDate);
  const currentMonth = refDateObj.getMonth(); // 0-11
  const currentYear = refDateObj.getFullYear();

  // Previous month and year
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Next month and year
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  let activeCustomers = 0;
  let drillsCompletedLastMonth = 0;
  let drillsDueThisMonth = 0;
  let drillsDueNextMonth = 0;
  let overdueDrills = 0;
  let upcomingReviewMeetings = 0;
  let annualDrillsCompleted = 0;
  let customersAtRisk = 0;

  let onTrackCustomers = 0;
  let dueSoonCustomers = 0;
  let overdueCustomers = 0;

  const urgentDrillsList: { customer: Customer; drill: DrillRecord }[] = [];

  for (const customer of customers) {
    if (customer.status === 'Active') {
      activeCustomers++;
    }

    const year = customer.currentYear || currentYear;
    const plan = customer.annualPlans[year];
    const compliance = calculateCustomerCompliance(customer, year, referenceDate, dueSoonDays);

    if (compliance.overallStatus === 'At Risk' || compliance.overallStatus === 'Overdue' || customer.status === 'At Risk') {
      customersAtRisk++;
    }

    if (compliance.overallStatus === 'On Track' || compliance.overallStatus === 'Completed') {
      onTrackCustomers++;
    } else if (compliance.overallStatus === 'Due Soon') {
      dueSoonCustomers++;
    } else if (compliance.overallStatus === 'Overdue' || compliance.overallStatus === 'At Risk') {
      overdueCustomers++;
    }

    if (plan && plan.drills) {
      for (const drill of plan.drills) {
        const status = computeDrillStatus(drill, referenceDate, dueSoonDays);

        // Check completion
        if (status === 'Completed' || status === 'Completed Late') {
          annualDrillsCompleted++;

          // Check if completed in last month
          if (drill.actualCompletionDate) {
            const compDate = parseDate(drill.actualCompletionDate);
            if (compDate.getFullYear() === prevYear && compDate.getMonth() === prevMonth) {
              drillsCompletedLastMonth++;
            }
          }
        } else if (status === 'Overdue') {
          overdueDrills++;
          urgentDrillsList.push({ customer, drill });
        } else if (status === 'Due Soon') {
          urgentDrillsList.push({ customer, drill });
        }

        // Pending drill month checks
        if (status !== 'Completed' && status !== 'Completed Late' && status !== 'Cancelled') {
          const plannedDateObj = parseDate(drill.plannedDate);
          if (plannedDateObj.getFullYear() === currentYear && plannedDateObj.getMonth() === currentMonth) {
            drillsDueThisMonth++;
          } else if (plannedDateObj.getFullYear() === nextYear && plannedDateObj.getMonth() === nextMonth) {
            drillsDueNextMonth++;
          }
        }

        // Review meetings
        if (drill.reviewMeeting && drill.reviewMeeting.status === 'Scheduled') {
          upcomingReviewMeetings++;
        }
      }
    }
  }

  return {
    totalCustomers: customers.length,
    activeCustomers,
    drillsCompletedLastMonth,
    drillsDueThisMonth,
    drillsDueNextMonth,
    overdueDrills,
    upcomingReviewMeetings,
    annualDrillsCompleted,
    customersAtRisk,
    onTrackCustomers,
    dueSoonCustomers,
    overdueCustomers,
    urgentDrillsList,
  };
}

