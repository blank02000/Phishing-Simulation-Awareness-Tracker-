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
 * Days difference between two YYYY-MM-DD strings (d2 - d1)
 */
export function daysBetween(d1Str: string, d2Str: string): number {
  const d1 = parseDate(d1Str);
  const d2 = parseDate(d2Str);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates drill status dynamically based on planned date, actual date, and current date
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

  // If actual completion date is recorded
  if (drill.actualCompletionDate) {
    const isLate = drill.actualCompletionDate > drill.plannedDate;
    return isLate ? 'Completed Late' : 'Completed';
  }

  // Drill is not completed yet: check planned date vs reference date
  if (drill.plannedDate < referenceDate) {
    return 'Overdue';
  }

  const daysUntil = daysBetween(referenceDate, drill.plannedDate);
  if (daysUntil >= 0 && daysUntil <= dueSoonThresholdDays) {
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
 */
export function generateAnnualTimeline(
  startDateStr: string,
  drillCount: number = 4,
  intervalMonths: number = 3,
  defaultDrillType: DrillType = 'Phishing Email Simulation'
): DrillRecord[] {
  const drills: DrillRecord[] = [];
  const baseDate = parseDate(startDateStr);

  for (let i = 0; i < drillCount; i++) {
    // Add intervalMonths * i
    const drillDate = new Date(baseDate);
    drillDate.setMonth(baseDate.getMonth() + i * intervalMonths);
    const plannedDate = formatDateISO(drillDate);

    const drillNumber = i + 1;
    drills.push({
      id: `drill-${Date.now()}-${drillNumber}-${Math.random().toString(36).substring(2, 6)}`,
      drillNumber,
      title: `Drill ${drillNumber} — ${formatQuarterOrMonth(drillDate, i + 1)}`,
      plannedDate,
      drillType: defaultDrillType,
      status: 'Upcoming',
      campaignName: `Q${i + 1} Phishing Simulation Campaign`,
      reviewMeeting: {
        required: true,
        status: 'Not Scheduled',
      },
    });
  }

  return drills;
}

function formatQuarterOrMonth(date: Date, drillNum: number): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `Q${Math.min(drillNum, 4)} (${month})`;
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

    if (drill.reviewMeeting) {
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
 * Generates proactive operational reminders and action items across all customers
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
      const status = computeDrillStatus(drill, referenceDate, dueSoonDays);

      if (status === 'Overdue') {
        const daysAgo = daysBetween(drill.plannedDate, referenceDate);
        reminders.push({
          id: `rem-overdue-${customer.id}-${drill.id}`,
          customerId: customer.id,
          companyName: customer.companyName,
          drillId: drill.id,
          drillNumber: drill.drillNumber,
          type: 'drill_overdue',
          severity: 'high',
          title: `${customer.companyName} — Drill ${drill.drillNumber} is overdue`,
          description: `Planned for ${formatDisplayDate(drill.plannedDate)} (${daysAgo} days overdue).`,
          dueDate: drill.plannedDate,
          actionLabel: 'Mark Drill Completed',
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
          title: `${customer.companyName} — Drill ${drill.drillNumber} is due soon`,
          description: `Scheduled for ${formatDisplayDate(drill.plannedDate)} (${daysLeft === 0 ? 'Due Today' : `in ${daysLeft} days`}).`,
          dueDate: drill.plannedDate,
          actionLabel: 'View Schedule',
        });
      }

      // Check review meeting status
      if (drill.reviewMeeting && drill.reviewMeeting.status === 'Scheduled' && drill.reviewMeeting.date) {
        const daysUntilMeeting = daysBetween(referenceDate, drill.reviewMeeting.date);
        if (daysUntilMeeting >= 0 && daysUntilMeeting <= 7) {
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
            description: `Review meeting for Drill ${drill.drillNumber} on ${formatDisplayDate(drill.reviewMeeting.date)}.`,
            dueDate: drill.reviewMeeting.date,
            actionLabel: 'Open Meeting Details',
          });
        }
      }
    }

    // Check if customer is significantly behind on annual quota
    const compliance = calculateCustomerCompliance(customer, year, referenceDate, dueSoonDays);
    if (compliance.overallStatus !== 'Completed' && compliance.completedCount < compliance.annualRequirement) {
      // If reference date is in late Q3 or Q4 and completed < half
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

