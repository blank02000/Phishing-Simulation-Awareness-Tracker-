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
  LayoutGrid,
  List,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectCustomer: (customerId: string) => void;
  onMarkDrillComplete: (customer: Customer, drill: DrillRecord) => void;
}

interface CalendarEvent {
  id: string;
  type: 'drill' | 'meeting' | 'deliverable';
  date: string;
  customer: Customer;
  drill?: DrillRecord;
  title: string;
  subtitle?: string;
  status: string;
  vector?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectCustomer,
  onMarkDrillComplete,
}) => {
  const { customers, referenceDate, dueSoonDays, allActualDeliveries } = useCustomerContext();

  const refDateObj = parseDate(referenceDate);
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [customerFilter, setCustomerFilter] = useState<string>('ALL');
  const [activityTypeFilter, setActivityTypeFilter] = useState<'ALL' | 'drill' | 'meeting' | 'deliverable'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(() => refDateObj.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => refDateObj.getMonth()); // 0-indexed

  // Selected Day state for Grid inspection
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  // Aggregate all events across all customers for selected year
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    customers.forEach((customer) => {
      if (customerFilter !== 'ALL' && customer.id !== customerFilter) return;

      const plan = customer.annualPlans[selectedYear];
      if (plan?.drills) {
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
                title: `${customer.companyName} — Drill ${drill.drillNumber}`,
                subtitle: `${drill.drillType}${drill.campaignName ? ` (${drill.campaignName})` : ''}`,
                status: drillStatus,
                vector: drill.drillType,
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
                  title: `${customer.companyName} — Drill ${drill.drillNumber} Review`,
                  subtitle: drill.reviewMeeting.title || drill.reviewMeeting.participants,
                  status: drill.reviewMeeting.status,
                });
              }
            }
          }
        });
      }

      // Add Deliverable Events (if deliverables in plan or actual deliveries)
      if (activityTypeFilter === 'ALL' || activityTypeFilter === 'deliverable') {
        const customerDeliveries = allActualDeliveries.filter((d) => d.customerId === customer.id);
        customerDeliveries.forEach((del) => {
          if (del.dateShared && del.dateShared.startsWith(String(selectedYear))) {
            events.push({
              id: `event-deliv-${del.id}`,
              type: 'deliverable',
              date: del.dateShared,
              customer,
              title: `${customer.companyName} — ${del.category}`,
              subtitle: del.fileName || del.title,
              status: 'Delivered',
            });
          }
        });
      }
    });

    // Sort chronologically
    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [customers, selectedYear, customerFilter, activityTypeFilter, statusFilter, referenceDate, dueSoonDays, allActualDeliveries]);

  // Group events by Month for Agenda View
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

  // Calendar Month Grid Calculation
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Previous month filler days
    const prevMonthDaysCount = new Date(selectedYear, selectedMonth, 0).getDate();
    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      events: CalendarEvent[];
      isRefDate: boolean;
    }[] = [];

    // Fill days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDaysCount - i;
      const prevDate = new Date(selectedYear, selectedMonth - 1, dayNum);
      const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        events: allEvents.filter((e) => e.date === dateStr),
        isRefDate: dateStr === referenceDate,
      });
    }

    // Fill days of the current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const mm = String(selectedMonth + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dateStr = `${selectedYear}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        events: allEvents.filter((e) => e.date === dateStr),
        isRefDate: dateStr === referenceDate,
      });
    }

    // Fill trailing days to complete 35 or 42 grid cells
    const remainingCells = 42 - days.length > 7 ? 35 - days.length : 42 - days.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextDate = new Date(selectedYear, selectedMonth + 1, dayNum);
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        events: allEvents.filter((e) => e.date === dateStr),
        isRefDate: dateStr === referenceDate,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, allEvents, referenceDate]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleJumpToRefDate = () => {
    const d = parseDate(referenceDate);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
  };

  // Events of selected day for the Day Inspector drawer
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayDate) return [];
    return allEvents.filter((e) => e.date === selectedDayDate);
  }, [allEvents, selectedDayDate]);

  return (
    <div className="space-y-5 pb-12" id="calendar-view-root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Drill, Review & Deliverable Calendar
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Date-Wise Scheduling
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive schedule of phishing simulations, voice/SMS drills, review debriefs, and ProLMS deliverables.
          </p>
        </div>

        {/* View Switcher & Month Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Grid vs Agenda Toggle */}
          <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Month Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda List</span>
            </button>
          </div>

          {/* Month & Year Navigator */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-800 px-2 min-w-[120px] text-center">
              {monthNames[selectedMonth]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleJumpToRefDate}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors"
            title="Jump to current simulation reference date"
          >
            Jump to Ref Date
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
          <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter by:
        </div>

        {/* Customer Filter */}
        <select
          id="select-calendar-customer"
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="ALL">All Customers ({customers.length})</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>

        {/* Activity Filter */}
        <select
          id="select-calendar-activity-type"
          value={activityTypeFilter}
          onChange={(e) => setActivityTypeFilter(e.target.value as any)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="ALL">All Activities (Drills, Reviews, Deliverables)</option>
          <option value="drill">Quarterly Simulation Drills</option>
          <option value="meeting">Review Debrief Meetings</option>
          <option value="deliverable">ProLMS Deliverables</option>
        </select>

        {/* Status Filter */}
        <select
          id="select-calendar-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="ALL">All Statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Due Soon">Due Soon</option>
          <option value="Overdue">Overdue</option>
          <option value="Completed">Completed</option>
          <option value="Completed Late">Completed Late</option>
          <option value="Scheduled">Scheduled (Meetings)</option>
        </select>

        {/* Year Filter */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <span>Schedule Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
            className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2027}>2027</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: DATE-WISE MONTH GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 bg-slate-50/90 border-b border-slate-200 text-center text-[11px] font-extrabold uppercase text-slate-500 py-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar 7-Column Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[560px]">
            {calendarGridDays.map((cell) => {
              const hasEvents = cell.events.length > 0;
              const isSelected = selectedDayDate === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDayDate(cell.dateStr)}
                  className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer relative ${
                    !cell.isCurrentMonth
                      ? 'bg-slate-50/40 text-slate-300'
                      : 'bg-white text-slate-800 hover:bg-slate-50/80'
                  } ${cell.isRefDate ? 'ring-2 ring-purple-500 ring-inset bg-purple-50/20' : ''} ${
                    isSelected ? 'bg-blue-50/40 ring-2 ring-blue-500 ring-inset' : ''
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        cell.isRefDate
                          ? 'bg-purple-600 text-white font-black'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {cell.isRefDate && (
                      <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-100 px-1 rounded hidden sm:inline">
                        Ref Date
                      </span>
                    )}

                    {hasEvents && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </div>

                  {/* Event Chips List */}
                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[80px]">
                    {cell.events.slice(0, 3).map((ev) => {
                      const isCompleted = ev.status === 'Completed' || ev.status === 'Completed Late' || ev.status === 'Delivered';
                      const isOverdue = ev.status === 'Overdue';
                      const isDueSoon = ev.status === 'Due Soon';

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayDate(cell.dateStr);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center gap-1 border transition-all ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isDueSoon
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                          title={`${ev.title}\nStatus: ${ev.status}\nDate: ${ev.date}`}
                        >
                          {ev.type === 'drill' && (
                            ev.vector?.includes('Vishing') ? (
                              <PhoneCall className="w-2.5 h-2.5 shrink-0 text-purple-600" />
                            ) : ev.vector?.includes('Smishing') ? (
                              <MessageSquare className="w-2.5 h-2.5 shrink-0 text-amber-600" />
                            ) : (
                              <Shield className="w-2.5 h-2.5 shrink-0 text-blue-600" />
                            )
                          )}
                          {ev.type === 'meeting' && (
                            <MessageSquare className="w-2.5 h-2.5 shrink-0 text-indigo-600" />
                          )}
                          {ev.type === 'deliverable' && (
                            <GraduationCap className="w-2.5 h-2.5 shrink-0 text-teal-600" />
                          )}
                          <span className="truncate">{ev.customer.companyName.split(' ')[0]}: {ev.title.split('—')[1] || ev.title}</span>
                        </div>
                      );
                    })}

                    {cell.events.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-500 text-center">
                        +{cell.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: AGENDA TIMELINE LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="space-y-6">
          {groupedEventsByMonth.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No scheduled activities found</div>
              <div className="text-xs text-slate-400 mt-1">
                Try adjusting the filters or select a different year.
              </div>
            </div>
          ) : (
            groupedEventsByMonth.map(([monthTitle, events]) => (
              <div key={monthTitle} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-black text-sm flex flex-col items-center justify-center shrink-0">
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
                              <span className="text-slate-400 text-xs">•</span>
                              <span className="text-xs font-semibold text-slate-600">
                                {ev.subtitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span>Date: <strong>{formatDisplayDate(ev.date)}</strong></span>
                              <span>•</span>
                              <span>Customer: <strong>{ev.customer.companyName}</strong></span>
                              <span>•</span>
                              <span>CSM: <strong>{ev.customer.csmName || 'Assigned CSM'}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Right Status & Actions */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          {isDrill ? (
                            <DrillStatusBadge status={ev.status as any} />
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {ev.status}
                            </span>
                          )}

                          {isDrill && ev.drill && ev.status !== 'Completed' && ev.status !== 'Completed Late' && (
                            <button
                              type="button"
                              onClick={() => onMarkDrillComplete(ev.customer, ev.drill!)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                              <span>Execute</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectCustomer(ev.customer.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Open Customer Account"
                          >
                            <Eye className="w-4 h-4" />
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
      )}

      {/* DAY INSPECTION DRAWER (Shows details when user clicks a date on the grid) */}
      {selectedDayDate && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm">
                {parseDate(selectedDayDate).getDate()}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">
                  Schedule Details for {formatDisplayDate(selectedDayDate)}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedDayEvents.length} scheduled {selectedDayEvents.length === 1 ? 'activity' : 'activities'} on this date.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayDate(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="text-slate-400 text-xs py-2">
              No drills, meetings, or deliverables scheduled for this specific date.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        {ev.type === 'drill' ? 'Simulation Drill' : ev.type === 'meeting' ? 'Review Debrief' : 'ProLMS Deliverable'}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                        {ev.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">{ev.subtitle}</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Client: <strong className="text-white">{ev.customer.companyName}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(ev.customer.id)}
                      className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Account</span>
                    </button>

                    {ev.type === 'drill' && ev.drill && ev.status !== 'Completed' && ev.status !== 'Completed Late' && (
                      <button
                        type="button"
                        onClick={() => onMarkDrillComplete(ev.customer, ev.drill!)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Execute</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
