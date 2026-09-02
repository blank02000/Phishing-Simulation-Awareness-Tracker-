import React, { useState, useMemo } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { Customer, DrillRecord, ReviewMeeting } from '../types';
import {
  computeDrillStatus,
  formatDisplayDate,
  formatMonthShort,
  parseDate,
} from '../utils/drillCalculator';
import { DrillStatusBadge, ReviewMeetingStatusBadge } from './common/StatusBadges';
import {
  Calendar as CalendarIcon,
  Filter,
  Users,
  MessageSquare,
  Shield,
  PlayCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectCustomer: (customerId: string) => void;
  onMarkDrillComplete: (customer: Customer, drill: DrillRecord) => void;
}

interface CalendarEvent {
  id: string;
  type: 'drill' | 'meeting';
  date: string;
  customer: Customer;
  drill: DrillRecord;
  title: string;
  subtitle?: string;
  status: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectCustomer,
  onMarkDrillComplete,
}) => {
  const { customers, referenceDate, dueSoonDays } = useCustomerContext();

  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [activityTypeFilter, setActivityTypeFilter] = useState<'ALL' | 'drill' | 'meeting'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(() => parseDate(referenceDate).getFullYear());

  // Aggregate all events across all customers for selected year
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    customers.forEach((customer) => {
      if (customerFilter !== 'ALL' && customer.id !== customerFilter) return;

      const plan = customer.annualPlans[selectedYear];
      if (!plan || !plan.drills) return;

      plan.drills.forEach((drill) => {
        const drillStatus = computeDrillStatus(drill, referenceDate, dueSoonDays);

        // Add Drill Event
        if (activityTypeFilter === 'ALL' || activityTypeFilter === 'drill') {
          if (statusFilter === 'ALL' || drillStatus === statusFilter) {
            events.push({
              id: `event-drill-${customer.id}-${drill.id}`,
              type: 'drill',
              date: drill.actualCompletionDate || drill.plannedDate,
              customer,
              drill,
              title: `${customer.companyName} — Drill ${drill.drillNumber} (${drill.drillType})`,
              subtitle: drill.campaignName,
              status: drillStatus,
            });
          }
        }

        // Add Review Meeting Event if scheduled/completed
        if (drill.reviewMeeting && drill.reviewMeeting.date) {
          if (activityTypeFilter === 'ALL' || activityTypeFilter === 'meeting') {
            if (statusFilter === 'ALL' || drill.reviewMeeting.status === statusFilter) {
              events.push({
                id: `event-meeting-${customer.id}-${drill.id}`,
                type: 'meeting',
                date: drill.reviewMeeting.date,
                customer,
                drill,
                title: `${customer.companyName} — Drill ${drill.drillNumber} Review Debrief`,
                subtitle: drill.reviewMeeting.participants,
                status: drill.reviewMeeting.status,
              });
            }
          }
        }
      });
    });

    // Sort chronologically
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [customers, selectedYear, customerFilter, activityTypeFilter, statusFilter, referenceDate, dueSoonDays]);

  // Group events by Month (e.g. "January 2026", "February 2026")
  const groupedEventsByMonth = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    allEvents.forEach((ev) => {
      try {
        const d = parseDate(ev.date);
        const monthKey = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const existing = map.get(monthKey) || [];
        existing.push(ev);
        map.set(monthKey, existing);
      } catch {
        // ignore
      }
    });

    return Array.from(map.entries());
  }, [allEvents]);

  return (
    <div className="space-y-5 pb-12" id="calendar-view-root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Cybersecurity Drill & Debrief Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Timeline of all scheduled quarterly phishing simulations and post-drill review meetings.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-2">{selectedYear} Schedule</span>
          <button
            type="button"
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar (Section 10) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </div>

        {/* Customer Filter */}
        <select
          id="select-calendar-customer"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="ALL">All Customers ({customers.length})</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>

        {/* Activity Filter (Drill vs Review Meeting) */}
        <select
          id="select-calendar-activity-type"
          value={activityTypeFilter}
          onChange={(e) => setActivityTypeFilter(e.target.value as any)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="ALL">All Activities (Drills & Reviews)</option>
          <option value="drill">Quarterly Drills Only</option>
          <option value="meeting">Review Debrief Meetings Only</option>
        </select>

        {/* Status Filter */}
        <select
          id="select-calendar-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
        >
          <option value="ALL">All Statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Overdue">Overdue</option>
          <option value="Completed">Completed</option>
          <option value="Completed Late">Completed Late</option>
          <option value="Scheduled">Scheduled (Meetings)</option>
        </select>
      </div>

      {/* Grouped Month Timeline (Section 10 example format) */}
      <div className="space-y-6">
        {groupedEventsByMonth.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
            <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">No scheduled activities found</div>
            <div className="text-xs text-slate-400 mt-1">
              Try adjusting the filters or select a different year.
            </div>
          </div>
        ) : (
          groupedEventsByMonth.map(([monthTitle, events]) => (
            <div key={monthTitle} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center justify-between">
                <span>{monthTitle}</span>
                <span className="text-slate-400 font-medium lowercase text-xs">
                  {events.length} {events.length === 1 ? 'activity' : 'activities'}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {events.map((ev) => {
                  const isDrill = ev.type === 'drill';
                  const eventDate = parseDate(ev.date);
                  const dayNum = eventDate.getDate();

                  return (
                    <div
                      key={ev.id}
                      className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left Date Node & Info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        {/* Day Number Tag */}
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm flex flex-col items-center justify-center shrink-0">
                          <span>{dayNum}</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectCustomer(ev.customer.id)}
                              className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {ev.title}
                            </button>

                            {isDrill ? (
                              <DrillStatusBadge status={ev.status as any} size="sm" />
                            ) : (
                              <ReviewMeetingStatusBadge status={ev.status as any} />
                            )}
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{formatDisplayDate(ev.date)}</span>
                            {ev.subtitle && <span>• {ev.subtitle}</span>}
                            <span>• Owner: {ev.customer.accountOwner}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {isDrill && ev.status !== 'Completed' && ev.status !== 'Completed Late' && (
                          <button
                            type="button"
                            onClick={() => onMarkDrillComplete(ev.customer, ev.drill)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Mark Done
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectCustomer(ev.customer.id)}
                          className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded font-medium text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Account View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
