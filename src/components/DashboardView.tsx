import React, { useMemo } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  calculateCustomerCompliance,
  calculateDashboardKPIs,
  computeDrillStatus,
  generateReminders,
  formatDisplayDate,
  formatMonthShort,
  parseDate,
} from '../utils/drillCalculator';
import { Customer, DrillRecord } from '../types';
import { DrillStatusBadge, ComplianceStatusBadge } from './common/StatusBadges';
import {
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Plus,
  PlayCircle,
  TrendingUp,
  Sparkles,
  UserCheck,
  Building2,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenCreateCustomer: () => void;
  onMarkDrillComplete: (customer: Customer, drill: DrillRecord) => void;
  onNavigateTab: (tab: 'customers' | 'calendar' | 'reminders' | 'reports' | 'reviews' | 'team') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectCustomer,
  onOpenCreateCustomer,
  onMarkDrillComplete,
  onNavigateTab,
}) => {
  const { customers, currentUser, referenceDate, dueSoonDays } = useCustomerContext();

  const isAdmin = currentUser.role === 'Admin';

  const stats = useMemo(() => {
    return calculateDashboardKPIs(customers, referenceDate, dueSoonDays);
  }, [customers, referenceDate, dueSoonDays]);

  const reminders = useMemo(() => {
    return generateReminders(customers, referenceDate, dueSoonDays).slice(0, 4);
  }, [customers, referenceDate, dueSoonDays]);

  return (
    <div className="space-y-6 pb-12" id="dashboard-view-root">
      {/* Top Role-Aware Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAdmin
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAdmin ? 'Admin Dashboard · Global View' : `CSM Dashboard · ${currentUser.name}`}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">
              {isAdmin
                ? `Monitoring all ${stats.totalCustomers} company accounts`
                : `Managing ${stats.totalCustomers} assigned customer accounts`}
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
            {isAdmin
              ? 'Cybersecurity Awareness & Phishing Operations'
              : `${currentUser.name}’s Customer Drill Portfolio`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Real-time quarterly drill execution, compliance status, and debrief tracking across all customers.'
              : 'Track drill schedules, log simulation results, and conduct review meetings for your assigned accounts.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isAdmin && (
            <button
              type="button"
              id="btn-dash-team"
              onClick={() => onNavigateTab('team')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              Manage CSMs
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('calendar')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            Calendar
          </button>

        </div>
      </div>

      {/* Main Dashboard KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* KPI 1: Total Customers */}
        <div
          id="kpi-total-customers"
          onClick={() => onNavigateTab('customers')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isAdmin ? 'Total Customers' : 'My Customers'}
            </span>
            <Users className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {stats.totalCustomers}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {stats.activeCustomers} Active
          </div>
        </div>

        {/* KPI 2: Drills Done Last Month */}
        <div id="kpi-drills-last-month" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Done Last Month
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {stats.drillsCompletedLastMonth}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Previous calendar month
          </div>
        </div>

        {/* KPI 3: Drills Due This Month */}
        <div
          id="kpi-drills-due-this-month"
          onClick={() => onNavigateTab('calendar')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Due This Month
            </span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
            {stats.drillsDueThisMonth}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Scheduled drills
          </div>
        </div>

        {/* KPI 4: Drills Due Next Month */}
        <div
          id="kpi-drills-due-next-month"
          onClick={() => onNavigateTab('calendar')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Due Next Month
            </span>
            <Calendar className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600 tracking-tight">
            {stats.drillsDueNextMonth}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Upcoming pipeline
          </div>
        </div>

        {/* KPI 5: Overdue Drills */}
        <div
          id="kpi-overdue-drills"
          onClick={() => onNavigateTab('reminders')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            stats.overdueDrills > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                stats.overdueDrills > 0 ? 'text-rose-600' : 'text-slate-400'
              }`}
            >
              Overdue
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                stats.overdueDrills > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-300'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-2xl font-black tracking-tight ${
              stats.overdueDrills > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {stats.overdueDrills}
          </div>
          <div
            className={`text-[11px] font-semibold mt-0.5 ${
              stats.overdueDrills > 0 ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {stats.overdueDrills > 0 ? 'Action required' : 'Zero overdue'}
          </div>
        </div>

        {/* KPI 6: Upcoming Review Meetings */}
        <div
          id="kpi-review-meetings"
          onClick={() => onNavigateTab('reviews')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Upcoming Reviews
            </span>
            <MessageSquare className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 tracking-tight">
            {stats.upcomingReviewMeetings}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Debrief meetings
          </div>
        </div>

        {/* KPI 7: Annual Drills Completed */}
        <div id="kpi-completed-drills" className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Annual Done
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {stats.annualDrillsCompleted}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Completed drills YTD
          </div>
        </div>

        {/* KPI 8: Customers At Risk */}
        <div
          id="kpi-customers-at-risk"
          onClick={() => onNavigateTab('customers')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
            stats.customersAtRisk > 0
              ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                stats.customersAtRisk > 0 ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              At Risk
            </span>
            <ShieldAlert
              className={`w-4 h-4 ${
                stats.customersAtRisk > 0 ? 'text-amber-600' : 'text-slate-300'
              }`}
            />
          </div>
          <div
            className={`mt-2 text-2xl font-black tracking-tight ${
              stats.customersAtRisk > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}
          >
            {stats.customersAtRisk}
          </div>
          <div
            className={`text-[11px] font-medium mt-0.5 ${
              stats.customersAtRisk > 0 ? 'text-amber-700' : 'text-slate-500'
            }`}
          >
            {stats.customersAtRisk > 0 ? 'Missed / delayed' : 'All on track'}
          </div>
        </div>
      </div>

      {/* Portfolio Health Breakdown Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAdmin ? 'Enterprise Customer Health Overview' : `${currentUser.name}’s Portfolio Status`}
              </h3>
              <p className="text-xs text-slate-500">
                {stats.totalCustomers} total accounts: {stats.onTrackCustomers} on track, {stats.dueSoonCustomers} due soon, {stats.overdueCustomers} overdue/at risk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {stats.onTrackCustomers} On Track
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {stats.dueSoonCustomers} Due Soon
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {stats.overdueCustomers} Overdue
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{
              width: `${stats.totalCustomers > 0 ? (stats.onTrackCustomers / stats.totalCustomers) * 100 : 0}%`,
            }}
            title={`${stats.onTrackCustomers} on track`}
          />
          <div
            className="bg-amber-400 h-full transition-all"
            style={{
              width: `${stats.totalCustomers > 0 ? (stats.dueSoonCustomers / stats.totalCustomers) * 100 : 0}%`,
            }}
            title={`${stats.dueSoonCustomers} due soon`}
          />
          <div
            className="bg-rose-500 h-full transition-all"
            style={{
              width: `${stats.totalCustomers > 0 ? (stats.overdueCustomers / stats.totalCustomers) * 100 : 0}%`,
            }}
            title={`${stats.overdueCustomers} overdue`}
          />
        </div>
      </div>

      {/* Main Split: Immediate Actions & Customer Portfolio List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Reminders & Drills Needing Action */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Immediate Action Items</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('reminders')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-semibold text-slate-700">All customer drills are on schedule!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No overdue drills or urgent review meetings.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-3 rounded-xl border transition-all ${
                      reminder.severity === 'high'
                        ? 'bg-rose-50/60 border-rose-200'
                        : reminder.severity === 'medium'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              reminder.severity === 'high'
                                ? 'bg-rose-500'
                                : reminder.severity === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => onSelectCustomer(reminder.customerId)}
                            className="text-xs font-bold text-slate-900 hover:text-blue-600 text-left line-clamp-1"
                          >
                            {reminder.title}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 pl-3.5">
                          {reminder.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectCustomer(reminder.customerId)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold shrink-0 shadow-2xs"
                      >
                        Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Schedule Reference */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quarterly Drill Cadence Standard
              </span>
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-slate-300">
              Annual requirement defaults to 4 quarterly drills (Q1, Q2, Q3, Q4) with formal review meetings conducted within 14 days of completion.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Simulations Configured:</span>
              <span className="font-bold text-blue-400">Email, Smishing, Spear Phishing</span>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Accounts Overview (Filtered strictly by role) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isAdmin ? 'Customer Accounts Portfolio' : 'My Assigned Customer Accounts'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAdmin
                    ? 'Showing all active and onboarding accounts with current annual compliance progress.'
                    : `Showing all accounts assigned to ${currentUser.name}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View full list <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">No customers found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAdmin
                    ? 'Create your first customer to begin managing quarterly drill plans.'
                    : 'You currently have no customer accounts assigned. Ask an Admin to assign accounts.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3 pl-2">Customer / Contact</th>
                      {isAdmin && <th className="pb-3">Assigned CSM</th>}
                      <th className="pb-3">Annual Progress</th>
                      <th className="pb-3">Next Scheduled Drill</th>
                      <th className="pb-3">Compliance</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.slice(0, 7).map((customer) => {
                      const year = customer.currentYear || 2026;
                      const compliance = calculateCustomerCompliance(
                        customer,
                        year,
                        referenceDate,
                        dueSoonDays
                      );

                      return (
                        <tr
                          key={customer.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => onSelectCustomer(customer.id)}
                        >
                          <td className="py-3 pl-2">
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {customer.companyName}
                            </div>
                            <div className="text-[11px] text-slate-500">{customer.customerContact}</div>
                          </td>

                          {isAdmin && (
                            <td className="py-3">
                              {customer.csmName ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  {customer.csmName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                              )}
                            </td>
                          )}

                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (compliance.completedCount / compliance.annualRequirement) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span className="font-bold text-slate-800">
                                {compliance.completedCount}/{compliance.annualRequirement}
                              </span>
                            </div>
                          </td>

                          <td className="py-3">
                            {compliance.nextDrill ? (
                              <div className="space-y-0.5">
                                <div className="font-medium text-slate-800">
                                  {compliance.nextDrill.title}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {formatDisplayDate(compliance.nextDrill.plannedDate)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">All drills completed</span>
                            )}
                          </td>

                          <td className="py-3">
                            <ComplianceStatusBadge status={compliance.overallStatus} />
                          </td>

                          <td className="py-3 text-right pr-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCustomer(customer.id);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Manage →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
