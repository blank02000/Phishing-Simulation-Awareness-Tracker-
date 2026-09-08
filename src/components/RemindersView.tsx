import React, { useMemo, useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { Customer, DrillRecord } from '../types';
import { generateReminders, formatDisplayDate } from '../utils/drillCalculator';
import { EmailReminderModal } from './modals/EmailReminderModal';
import {
  Bell,
  AlertTriangle,
  Clock,
  MessageSquare,
  ShieldAlert,
  PlayCircle,
  Eye,
  CheckCircle2,
  ArrowRight,
  Mail,
} from 'lucide-react';

interface RemindersViewProps {
  onSelectCustomer: (customerId: string) => void;
  onMarkDrillComplete: (customer: Customer, drill: DrillRecord) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  onSelectCustomer,
  onMarkDrillComplete,
}) => {
  const { customers, referenceDate, dueSoonDays } = useCustomerContext();

  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill?: DrillRecord | null;
    isOverdue?: boolean;
  }>({
    isOpen: false,
    customer: null,
  });

  const allReminders = useMemo(() => {
    return generateReminders(customers, referenceDate, dueSoonDays);
  }, [customers, referenceDate, dueSoonDays]);

  const overdueList = allReminders.filter((r) => r.type === 'drill_overdue');
  const dueSoonList = allReminders.filter((r) => r.type === 'drill_due_soon');
  const activePeriodList = allReminders.filter((r) => r.type === 'drill_active_period');
  const meetingList = allReminders.filter((r) => r.type === 'meeting_scheduled');
  const annualRiskList = allReminders.filter((r) => r.type === 'annual_at_risk');

  const handleAction = (rem: (typeof allReminders)[0]) => {
    const customer = customers.find((c) => c.id === rem.customerId);
    if (!customer) return;

    if (
      rem.drillId &&
      (rem.type === 'drill_overdue' ||
        rem.type === 'drill_due_soon' ||
        rem.type === 'drill_active_period')
    ) {
      const year = customer.currentYear || 2026;
      const plan = customer.annualPlans[year];
      const drill = plan?.drills.find((d) => d.id === rem.drillId);
      if (drill) {
        onMarkDrillComplete(customer, drill);
        return;
      }
    }

    onSelectCustomer(rem.customerId);
  };

  const handleOpenEmailModal = (rem: (typeof allReminders)[0], isOverdue: boolean) => {
    const customer = customers.find((c) => c.id === rem.customerId);
    if (!customer) return;

    let drill: DrillRecord | null = null;
    if (rem.drillId) {
      const year = customer.currentYear || 2026;
      drill = customer.annualPlans[year]?.drills.find((d) => d.id === rem.drillId) || null;
    }

    setEmailModalData({
      isOpen: true,
      customer,
      drill,
      isOverdue,
    });
  };

  return (
    <div className="space-y-6 pb-12" id="reminders-view-root">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Upcoming Activities & Operational Reminders
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Proactive alerts for upcoming customer drill due dates, overdue simulations, scheduled meetings, and annual quota risks.
        </p>
      </div>

      {allReminders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Zero active warnings</h3>
          <p className="text-xs text-slate-500 mt-1">
            All customer cybersecurity drills and review meetings are fully on schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Overdue Drills (High Priority) */}
          {overdueList.length > 0 && (
            <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Overdue Drills ({overdueList.length})
                </div>
                <span className="text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  Requires Immediate Action
                </span>
              </div>

              <div className="divide-y divide-rose-100">
                {overdueList.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 hover:bg-rose-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{rem.title}</div>
                      <div className="text-xs text-slate-600">{rem.description}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(rem, true)}
                        className="px-2.5 py-1.5 border border-rose-300 hover:bg-rose-100/60 text-rose-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                        title="Send Overdue Email Notice to customer contact"
                      >
                        <Mail className="w-3.5 h-3.5 text-rose-600" /> Send Email Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(rem)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(rem.customerId)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Account
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Drills Due Soon */}
          {dueSoonList.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Drills Due Soon (Next {dueSoonDays} Days) ({dueSoonList.length})
                </div>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Upcoming Execution
                </span>
              </div>

              <div className="divide-y divide-amber-100">
                {dueSoonList.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 hover:bg-amber-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{rem.title}</div>
                      <div className="text-xs text-slate-600">{rem.description}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(rem, false)}
                        className="px-2.5 py-1.5 border border-amber-300 hover:bg-amber-100/60 text-amber-900 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                        title="Send Schedule Notice to customer contact"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-700" /> Email Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(rem)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Execute & Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(rem.customerId)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Current Active Sanctioned Drill Windows (e.g. Current Quarter July–September) */}
          {activePeriodList.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-3.5 bg-blue-50/80 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Current Active Drill Windows ({activePeriodList.length})
                </div>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Sanctioned Drill Period
                </span>
              </div>

              <div className="divide-y divide-blue-100/60">
                {activePeriodList.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 hover:bg-blue-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{rem.title}</span>
                        {rem.drillPeriodLabel && (
                          <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded">
                            {rem.drillPeriodLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">{rem.description}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEmailModal(rem, false)}
                        className="px-2.5 py-1.5 border border-blue-300 hover:bg-blue-100/60 text-blue-800 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                        title="Send notice to customer contact"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Notice
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(rem)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Execute & Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(rem.customerId)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Account View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Scheduled Review Meetings */}
          {meetingList.length > 0 && (
            <div className="bg-white rounded-xl border border-blue-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Scheduled Review Meetings ({meetingList.length})
                </div>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Customer Debriefs
                </span>
              </div>

              <div className="divide-y divide-blue-100">
                {meetingList.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{rem.title}</div>
                      <div className="text-xs text-slate-600">{rem.description}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(rem.customerId)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Open Meeting Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Annual Drill Quota Health Warnings */}
          {annualRiskList.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Annual Drill Quota Health Warnings ({annualRiskList.length})
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {annualRiskList.map((rem) => (
                  <div
                    key={rem.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">{rem.title}</div>
                      <div className="text-xs text-slate-600">{rem.description}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectCustomer(rem.customerId)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 self-start sm:self-auto"
                    >
                      <span>Review Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Reminder Modal */}
      {emailModalData.isOpen && emailModalData.customer && (
        <EmailReminderModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData({ isOpen: false, customer: null })}
          customer={emailModalData.customer}
          drill={emailModalData.drill}
          isOverdue={emailModalData.isOverdue}
        />
      )}
    </div>
  );
};
