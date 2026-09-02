import React, { useState, useMemo } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { Customer, DrillRecord, AnnualComplianceStatus } from '../types';
import {
  calculateCustomerCompliance,
  computeDrillStatus,
  formatDisplayDate,
} from '../utils/drillCalculator';
import { ComplianceStatusBadge, DrillStatusBadge, ReviewMeetingStatusBadge } from './common/StatusBadges';
import {
  Search,
  Plus,
  Filter,
  Users,
  PlayCircle,
  Eye,
  ChevronRight,
  ShieldCheck,
  Building,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface CustomerListViewProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenCreateCustomer: () => void;
  onOpenBulkUpload?: () => void;
  onMarkDrillComplete: (customer: Customer, drill: DrillRecord) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onSelectCustomer,
  onOpenCreateCustomer,
  onOpenBulkUpload,
  onMarkDrillComplete,
}) => {
  const {
    customers,
    currentUser,
    users,
    referenceDate,
    dueSoonDays,
    assignCustomerCsm,
  } = useCustomerContext();

  const isAdmin = currentUser.role === 'Admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [csmFilter, setCsmFilter] = useState<string>('ALL');

  const csmUsers = users.filter((u) => u.role === 'CSM');

  // Compute and filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const year = cust.currentYear || 2026;
      const compliance = calculateCustomerCompliance(cust, year, referenceDate, dueSoonDays);

      // Search match
      const query = searchQuery.toLowerCase();
      const matchSearch =
        cust.companyName.toLowerCase().includes(query) ||
        cust.customerContact.toLowerCase().includes(query) ||
        cust.accountOwner.toLowerCase().includes(query) ||
        (cust.csmName && cust.csmName.toLowerCase().includes(query)) ||
        (cust.industry && cust.industry.toLowerCase().includes(query));

      if (!matchSearch) return false;

      // Status filter
      if (statusFilter !== 'ALL' && compliance.overallStatus !== statusFilter) {
        return false;
      }

      // CSM filter (for Admin)
      if (csmFilter !== 'ALL') {
        if (csmFilter === 'UNASSIGNED') {
          if (cust.csmId) return false;
        } else if (cust.csmId !== csmFilter) {
          return false;
        }
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter, csmFilter, referenceDate, dueSoonDays]);

  return (
    <div className="space-y-5 pb-12" id="customer-list-view-root">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isAdmin ? 'All Customer Accounts' : 'My Customer Accounts'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAdmin ? `Admin View (${customers.length})` : `Assigned to ${currentUser.name} (${customers.length})`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Manage cybersecurity awareness contracts, assign CSM owners, and track quarterly drill execution.'
              : 'Conduct scheduled drills, record results, and lead debrief review meetings for your accounts.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              id="btn-bulk-upload-customers"
              type="button"
              onClick={onOpenBulkUpload}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Upload Excel / CSV
            </button>
            <button
              id="btn-add-customer-from-list"
              type="button"
              onClick={onOpenCreateCustomer}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Customer Account
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-customer-search"
            type="text"
            placeholder={
              isAdmin
                ? 'Search by company, contact, assigned CSM...'
                : 'Search your assigned companies or contacts...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="On Track">On Track</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
            <option value="At Risk">At Risk</option>
          </select>

          {isAdmin && (
            <select
              id="select-csm-filter"
              value={csmFilter}
              onChange={(e) => setCsmFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">All Assigned CSMs</option>
              <option value="UNASSIGNED">⚠️ Unassigned Accounts</option>
              {csmUsers.map((csm) => (
                <option key={csm.id} value={csm.id}>
                  {csm.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Searchable Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">No matching customer accounts</div>
            <div className="text-xs text-slate-400 mt-1">
              {isAdmin
                ? 'Try adjusting your search terms or filters, or add a new customer account.'
                : 'No assigned customer accounts match your search filters.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="table-customer-accounts">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  {isAdmin && <th className="px-4 py-3.5">Assigned CSM</th>}
                  <th className="px-4 py-3.5">Annual Requirement</th>
                  <th className="px-4 py-3.5">Completed</th>
                  <th className="px-4 py-3.5">Next Drill</th>
                  <th className="px-4 py-3.5">Last Drill</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-4 py-3.5">Overall Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCustomers.map((customer) => {
                  const year = customer.currentYear || 2026;
                  const compliance = calculateCustomerCompliance(
                    customer,
                    year,
                    referenceDate,
                    dueSoonDays
                  );
                  const nextDrill = compliance.nextDrill;
                  const nextDrillStatus = nextDrill
                    ? computeDrillStatus(nextDrill, referenceDate, dueSoonDays)
                    : undefined;

                  const isAllCompleted =
                    compliance.completedCount >= compliance.annualRequirement;

                  return (
                    <tr
                      key={customer.id}
                      id={`row-customer-${customer.id}`}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectCustomer(customer.id)}
                    >
                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {customer.companyName}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {customer.customerContact} • Lead: <span className="font-medium text-slate-700">{customer.accountOwner}</span>
                        </div>
                      </td>

                      {/* Assigned CSM (Admin View with quick reassign) */}
                      {isAdmin && (
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={customer.csmId || ''}
                            onChange={(e) => {
                              const newCsmId = e.target.value;
                              const selectedCsm = users.find((u) => u.id === newCsmId);
                              assignCustomerCsm(
                                customer.id,
                                newCsmId || undefined,
                                selectedCsm?.name || undefined
                              );
                            }}
                            className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${
                              customer.csmId
                                ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                                : 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            }`}
                          >
                            <option value="">⚠️ Unassigned</option>
                            {csmUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      {/* Annual Requirement */}
                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {compliance.annualRequirement} Drills / Year
                      </td>

                      {/* Completed */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {compliance.completedCount} / {compliance.annualRequirement}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({compliance.completedOnTimeCount} on time
                            {compliance.completedLateCount > 0 && `, ${compliance.completedLateCount} late`})
                          </span>
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (compliance.completedCount / compliance.annualRequirement) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Next Drill */}
                      <td className="px-4 py-4">
                        {nextDrill && nextDrillStatus ? (
                          <div>
                            <div className="font-medium text-slate-800">
                              Drill {nextDrill.drillNumber} — {formatDisplayDate(nextDrill.plannedDate)}
                            </div>
                            <div className="mt-1">
                              <DrillStatusBadge status={nextDrillStatus} size="sm" />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {isAllCompleted ? 'All annual drills completed' : 'None scheduled'}
                          </span>
                        )}
                      </td>

                      {/* Last Drill */}
                      <td className="px-4 py-4">
                        {compliance.lastDrill?.actualCompletionDate ? (
                          <div>
                            <div className="font-medium text-slate-800">
                              {formatDisplayDate(compliance.lastDrill.actualCompletionDate)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Drill {compliance.lastDrill.drillNumber}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td className="px-4 py-4">
                        {compliance.lastReviewMeeting ? (
                          <div>
                            <ReviewMeetingStatusBadge
                              status={compliance.lastReviewMeeting.meeting.status}
                            />
                            {compliance.lastReviewMeeting.meeting.date && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {formatDisplayDate(compliance.lastReviewMeeting.meeting.date)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">None</span>
                        )}
                      </td>

                      {/* Overall Status */}
                      <td className="px-4 py-4">
                        <ComplianceStatusBadge status={compliance.overallStatus} />
                      </td>

                      {/* Quick Actions */}
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {nextDrill && (
                            <button
                              type="button"
                              onClick={() => onMarkDrillComplete(customer, nextDrill)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold text-xs transition-colors flex items-center gap-1"
                              title="Mark Next Drill Completed"
                            >
                              <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden lg:inline">Complete</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectCustomer(customer.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
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
  );
};
