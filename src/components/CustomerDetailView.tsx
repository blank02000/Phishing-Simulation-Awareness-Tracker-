import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { Customer, DrillRecord, ReviewMeeting, LmsDeliverable } from '../types';
import { EditCustomerModal } from './modals/EditCustomerModal';
import { EmailReminderModal } from './modals/EmailReminderModal';
import {
  calculateCustomerCompliance,
  computeDrillStatus,
  computeDeliverableStatus,
  formatDisplayDate,
  formatMonthShort,
  formatSimulationMonthWindow,
  getSanctionedDrillPeriod,
} from '../utils/drillCalculator';
import { TimelineVisualizer } from './common/TimelineVisualizer';
import { DrillComplianceChart } from './common/DrillComplianceChart';
import { CustomFieldsDisplay } from './common/CustomFieldsDisplay';
import {
  ComplianceStatusBadge,
  DrillStatusBadge,
  DrillResultBadge,
  ReviewMeetingStatusBadge,
} from './common/StatusBadges';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Users,
  AlertTriangle,
  PlayCircle,
  CalendarPlus,
  Edit3,
  Trash2,
  FileBarChart2,
  Mail,
  Phone,
  Tag,
  FileText,
  ExternalLink,
  Percent,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Plus,
  Key,
  FileSpreadsheet,
  PhoneCall,
  FileCheck2,
  Target,
  Upload,
} from 'lucide-react';
import { CustomerAccountNotesHub } from './CustomerAccountNotesHub';
import { LicenseExpiryTrackerSection } from './LicenseExpiryTrackerSection';
import { UploadLicenseModal } from './modals/UploadLicenseModal';
import { ExcelLicenseViewerModal } from './common/ExcelLicenseViewerModal';
import { ScheduleLicenseDrillModal } from './modals/ScheduleLicenseDrillModal';
import { getDaysUntilExpiry } from '../utils/customizationDefaults';

interface CustomerDetailViewProps {
  customerId: string;
  onBack: () => void;
  onOpenCompleteDrill: (customer: Customer, drill: DrillRecord) => void;
  onOpenEditDrill: (customer: Customer, drill: DrillRecord) => void;
  onOpenReviewMeeting: (customer: Customer, drill: DrillRecord) => void;
  onOpenNewYearPlan: (customer: Customer, currentYear: number) => void;
  onViewAnnualReport: (customerId: string, year: number) => void;
  onOpenAddDeliverable: (customer: Customer, year: number) => void;
  onOpenEditDeliverable: (customer: Customer, deliverable: LmsDeliverable) => void;
  onOpenCompleteDeliverable: (customer: Customer, deliverable: LmsDeliverable) => void;
  onDeleteDeliverable: (customer: Customer, year: number, deliverableId: string) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customerId,
  onBack,
  onOpenCompleteDrill,
  onOpenEditDrill,
  onOpenReviewMeeting,
  onOpenNewYearPlan,
  onViewAnnualReport,
  onOpenAddDeliverable,
  onOpenEditDeliverable,
  onOpenCompleteDeliverable,
  onDeleteDeliverable,
}) => {
  const {
    customers,
    currentUser,
    users,
    referenceDate,
    dueSoonDays,
    deleteCustomer,
    updateCustomer,
    assignCustomerCsm,
    canUserEditCustomer,
    canUserDeleteCustomer,
  } = useCustomerContext();
  const customer = customers.find((c) => c.id === customerId);

  const isAdmin = currentUser.role === 'Admin';
  const canEdit = customer ? (isAdmin || canUserEditCustomer(customer, currentUser)) : false;
  const canDelete = customer ? (isAdmin || canUserDeleteCustomer(customer, currentUser)) : false;
  const csmUsers = users.filter((u) => u.role === 'CSM');

  // Available plan years for this customer
  const availableYears = customer
    ? Object.keys(customer.annualPlans)
        .map(Number)
        .sort((a, b) => b - a)
    : [2026];

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return customer?.currentYear || availableYears[0] || 2026;
  });

  const [selectedDrillId, setSelectedDrillId] = useState<string | undefined>(undefined);
  const [activeModuleTab, setActiveModuleTab] = useState<'prophish' | 'lms' | 'notes' | 'licenses'>('prophish');
  const [isUploadLicenseOpen, setIsUploadLicenseOpen] = useState(false);
  const [isExcelPreviewOpen, setIsExcelPreviewOpen] = useState(false);
  const [scheduleLicenseDrillData, setScheduleLicenseDrillData] = useState<{
    isOpen: boolean;
    drillType: 'Vishing' | 'Smishing';
  }>({ isOpen: false, drillType: 'Vishing' });
  const [drillCategoryFilter, setDrillCategoryFilter] = useState<'all' | 'phishing' | 'vishing' | 'smishing'>('all');
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editCustomerTab, setEditCustomerTab] = useState<'profile' | 'dates' | 'drills'>('profile');

  const handleOpenEditCustomer = (tab: 'profile' | 'dates' | 'drills' = 'profile') => {
    setEditCustomerTab(tab);
    setIsEditCustomerOpen(true);
  };
  const [emailModalData, setEmailModalData] = useState<{
    isOpen: boolean;
    drill?: DrillRecord | null;
    review?: ReviewMeeting | null;
    isOverdue?: boolean;
  }>({ isOpen: false });

  const [isDeleteCustomerOpen, setIsDeleteCustomerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    setIsDeleting(true);
    const res = await deleteCustomer(customer.id);
    setIsDeleting(false);
    if (res.success) {
      setIsDeleteCustomerOpen(false);
      onBack();
    }
  };

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <div className="text-sm font-semibold text-slate-800">Customer account not found</div>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Customer List
        </button>
      </div>
    );
  }

  const currentPlan = customer.annualPlans[selectedYear];
  const compliance = calculateCustomerCompliance(customer, selectedYear, referenceDate, dueSoonDays);
  const drills = currentPlan?.drills || [];
  const deliverables = currentPlan?.deliverables || [];
  const activeLicense = customer.licenses && customer.licenses.length > 0 ? customer.licenses[0] : null;

  // Multi-Vector Drill Categorization
  const phishingDrills = drills.filter(
    (d) =>
      !d.drillType ||
      d.drillType.toLowerCase().includes('phishing') ||
      d.drillType.toLowerCase().includes('credential') ||
      d.drillType.toLowerCase().includes('ransomware') ||
      d.drillType.toLowerCase().includes('usb') ||
      d.drillType.toLowerCase().includes('custom')
  );
  const vishingDrills = drills.filter(
    (d) =>
      d.drillType &&
      (d.drillType.toLowerCase().includes('vishing') ||
        d.drillType.toLowerCase().includes('call') ||
        d.drillType.toLowerCase().includes('voice'))
  );
  const smishingDrills = drills.filter(
    (d) => d.drillType && d.drillType.toLowerCase().includes('smishing')
  );

  const displayedDrills = (() => {
    if (drillCategoryFilter === 'phishing') return phishingDrills;
    if (drillCategoryFilter === 'vishing') return vishingDrills;
    if (drillCategoryFilter === 'smishing') return smishingDrills;
    return drills;
  })();

  return (
    <div className="space-y-6 pb-16" id="customer-detail-view-root">
      {/* Top Breadcrumb Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              id="btn-back-to-customers"
              type="button"
              onClick={onBack}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors"
            >
              Customers
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{customer.companyName}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {customer.companyName}
            </h1>
            <ComplianceStatusBadge status={compliance.overallStatus} />
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeLicense && (
            <button
              type="button"
              id="btn-quick-preview-license"
              onClick={() => setIsExcelPreviewOpen(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-emerald-300 shadow-2xs cursor-pointer"
              title="Preview active Excel license spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Preview License (.xlsx)</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              id="btn-quick-upload-license"
              onClick={() => setIsUploadLicenseOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
              title="Upload new license agreement or Excel file"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Upload License</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setEmailModalData({ isOpen: true })}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-blue-200"
            title="Send direct email notice via SMTP"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Email Customer</span>
          </button>

          {canEdit && (
            <button
              type="button"
              id="btn-edit-customer"
              onClick={() => handleOpenEditCustomer('profile')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
              title="Edit customer account details, dates, and drill schedules"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit Customer & Dates</span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              id="btn-delete-customer"
              onClick={() => setIsDeleteCustomerOpen(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
              title="Permanently delete customer account"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Customer</span>
            </button>
          )}

          <button
            type="button"
            id="btn-view-reports"
            onClick={() => onViewAnnualReport(customer.id, selectedYear)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <FileBarChart2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Progress & Audit Reports</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenNewYearPlan(customer, selectedYear)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Create {selectedYear + 1} Plan</span>
          </button>
        </div>
      </div>

      {/* Account Info Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-5">
            {/* Assigned CSM */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-medium">Assigned CSM:</span>
              {isAdmin ? (
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
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">⚠️ Unassigned</option>
                  {csmUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-bold text-slate-900">
                  {customer.csmName || 'Unassigned'}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400">Account Lead:</span>{' '}
              <span className="font-semibold text-slate-800">{customer.accountOwner}</span>
            </div>
            <div>
              <span className="text-slate-400">Primary Contact:</span>{' '}
              <span className="font-semibold text-slate-800">{customer.customerContact}</span>
            </div>
            {customer.contactEmail && (
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <a href={`mailto:${customer.contactEmail}`} className="text-blue-600 hover:underline font-medium">
                  {customer.contactEmail}
                </a>
              </div>
            )}
            {customer.contactPhone && (
              <div>
                <span className="text-slate-400">Phone:</span>{' '}
                <span className="text-slate-700">{customer.contactPhone}</span>
              </div>
            )}

            {/* CISO Information Block */}
            {customer.cisoName || customer.cisoEmail || customer.cisoPhone ? (
              <div className="flex items-center gap-1.5 bg-blue-50/90 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold text-blue-950">CISO:</span>
                <span className="font-bold text-slate-900">{customer.cisoName || 'CISO'}</span>
                {customer.cisoEmail && (
                  <>
                    <span className="text-blue-300">|</span>
                    <a href={`mailto:${customer.cisoEmail}`} className="text-blue-700 hover:underline">
                      {customer.cisoEmail}
                    </a>
                  </>
                )}
                {customer.cisoPhone && (
                  <>
                    <span className="text-blue-300">|</span>
                    <span className="text-slate-700">{customer.cisoPhone}</span>
                  </>
                )}
              </div>
            ) : canEdit ? (
              <button
                type="button"
                onClick={() => handleOpenEditCustomer('profile')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold bg-blue-50/60 px-2 py-0.5 rounded-md border border-blue-200/60"
                title="Add CISO / Executive Security Leadership"
              >
                <ShieldCheck className="w-3 h-3 text-blue-500" /> + Add CISO
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Start:</span>{' '}
                <span className="font-semibold text-slate-800">{formatDisplayDate(customer.startDate)}</span>
              </div>
              {customer.endDate && (
                <>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Renewal:</span>{' '}
                    <span className="font-semibold text-slate-800">{formatDisplayDate(customer.endDate)}</span>
                  </div>
                </>
              )}
              {customer.licenseDetails?.maintenanceEndDate && (
                <>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Maint:</span>{' '}
                    <span className="font-semibold text-slate-800">{formatDisplayDate(customer.licenseDetails.maintenanceEndDate)}</span>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => handleOpenEditCustomer('dates')}
                className="ml-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5"
                title="Edit Contract & Maintenance Dates"
              >
                <Edit3 className="w-3 h-3" /> Edit Dates
              </button>
              {customer.licenses && customer.licenses.length > 0 && (() => {
                const primaryLic = customer.licenses[0];
                const daysRemaining = getDaysUntilExpiry(primaryLic.expiryDate);
                const isExpired = daysRemaining < 0;
                const isExpiring = daysRemaining >= 0 && daysRemaining <= 60;
                return (
                  <button
                    type="button"
                    onClick={() => setActiveModuleTab('licenses')}
                    className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                      isExpired
                        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        : isExpiring
                        ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                    title="View License Entitlements & Validity"
                  >
                    <Key className="w-3 h-3 text-current" />
                    <span>
                      {isExpired
                        ? `Expired (${Math.abs(daysRemaining)}d ago)`
                        : isExpiring
                        ? `Expiring (${daysRemaining}d left)`
                        : `License Active (${daysRemaining}d)`}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Customer Custom Fields Display */}
        {customer.customFields && customer.customFields.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <CustomFieldsDisplay
              fields={customer.customFields}
              section="accountDetails"
              title="Custom Organization Attributes"
            />
            <CustomFieldsDisplay
              fields={customer.customFields}
              section="contacts"
              title="Custom CISO & Contact Attributes"
            />
            <CustomFieldsDisplay
              fields={customer.customFields}
              section="licenseInfo"
              title="Custom License & Subscription Attributes"
            />
          </div>
        )}

        {/* 4-Column High-Impact KPI Metrics Row (from Professional Polish Spec) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {/* Annual Goal */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Annual Goal
            </p>
            <div className="text-2xl font-bold text-slate-800">
              {compliance.annualRequirement} Drills
            </div>
            <p className="text-slate-400 text-xs mt-1 italic">
              1 Per Quarter ({currentPlan?.intervalMonths || 3} Mo Interval)
            </p>
          </div>

          {/* Completed with Progress Bar */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Completed
            </p>
            <div className="text-2xl font-bold text-emerald-600">
              {compliance.completedCount} / {compliance.annualRequirement}
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (compliance.completedCount / compliance.annualRequirement) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Next Drill */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Next Drill
            </p>
            <div className="text-2xl font-bold text-slate-800 truncate">
              {compliance.nextDrill ? formatDisplayDate(compliance.nextDrill.plannedDate) : 'Completed'}
            </div>
            <p className="text-blue-600 text-xs mt-1 font-medium">
              {compliance.nextDrill ? `Drill #${compliance.nextDrill.drillNumber}` : 'All drills finished'}
            </p>
          </div>

          {/* Last Drill Done */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              Last Drill Done
            </p>
            <div className="text-2xl font-bold text-slate-800 truncate">
              {compliance.lastDrill?.actualCompletionDate ? formatDisplayDate(compliance.lastDrill.actualCompletionDate) : 'None'}
            </div>
            <p className="text-slate-400 text-xs mt-1 italic">
              {compliance.reviewMeetingsCompletedCount} Debriefs Conducted
            </p>
          </div>
        </div>
      </div>

      {/* Product Subscriptions Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Product Subscriptions & Opted Products</h3>
              <p className="text-xs text-slate-500">Active product modules and reporting integrations</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Prophish */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${customer.products?.prophish ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div>
              <div className="text-xs font-bold text-slate-900">Prophish</div>
              <div className="text-[11px] text-slate-500">Phishing simulation drills</div>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${customer.products?.prophish ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {customer.products?.prophish ? '✓' : '✗'}
            </div>
          </div>

          {/* Pro LMS */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${customer.products?.proLms ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div>
              <div className="text-xs font-bold text-slate-900">Pro LMS</div>
              <div className="text-[11px] text-slate-500">Online learning management system</div>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${customer.products?.proLms ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {customer.products?.proLms ? '✓' : '✗'}
            </div>
          </div>

          {/* Pro Patrol */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${customer.products?.proPatrol ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <div>
              <div className="text-xs font-bold text-slate-900">Pro Patrol</div>
              <div className="text-[11px] text-slate-500">MS & Google reporting button plugin</div>
            </div>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${customer.products?.proPatrol ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {customer.products?.proPatrol ? '✓' : '✗'}
            </div>
          </div>
        </div>
      </div>

      {/* Product & Intelligence Module Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 pt-1 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveModuleTab('prophish')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeModuleTab === 'prophish'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>🎣 Prophish Drills</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeModuleTab === 'prophish' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {drills.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleTab('notes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeModuleTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Account & Drill Notes Hub</span>
          {(customer.generalNotes?.length || 0) > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeModuleTab === 'notes' ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
              {customer.generalNotes?.length}
            </span>
          )}
        </button>

        {customer.products?.proLms && (
          <button
            type="button"
            onClick={() => setActiveModuleTab('lms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeModuleTab === 'lms'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pro LMS Deliverables</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeModuleTab === 'lms' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {deliverables.length}
            </span>
          </button>
        )}

        <button
          type="button"
          id="btn-tab-customer-licenses"
          onClick={() => setActiveModuleTab('licenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeModuleTab === 'licenses'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Licenses & Expiry</span>
          {(customer.licenses?.length || 0) > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeModuleTab === 'licenses'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {customer.licenses?.length}
            </span>
          )}
        </button>
      </div>

      {/* Conditional Module View: Licenses vs Notes Hub vs Pro LMS Deliverables vs Prophish Drills */}
      {activeModuleTab === 'licenses' ? (
        <LicenseExpiryTrackerSection
          customer={customer}
          onOpenUploadLicense={() => setIsUploadLicenseOpen(true)}
          canEdit={canEdit}
        />
      ) : activeModuleTab === 'notes' ? (
        <CustomerAccountNotesHub
          customer={customer}
          selectedYear={selectedYear}
          availableYears={availableYears}
          canEdit={canEdit}
          onSelectYear={(yr) => setSelectedYear(yr)}
          onOpenDrillExecution={(drill) => onOpenCompleteDrill(customer, drill)}
        />
      ) : activeModuleTab === 'lms' && customer.products?.proLms ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {selectedYear} Pro LMS Trackable Deliverables
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Custom learning management modules, compliance quizzes, and curriculum deliverables created for this account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenAddDeliverable(customer, selectedYear)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add LMS Deliverable</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {deliverables.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-sm font-semibold text-slate-800">No Pro LMS deliverables found for {selectedYear}</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Deliverables can be monthly, quarterly, half-yearly, or yearly as per account requirements. Click above to add the first deliverable.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenAddDeliverable(customer, selectedYear)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  + Add LMS Deliverable
                </button>
              </div>
            ) : (
              deliverables.map((del) => {
                const status = computeDeliverableStatus(del, referenceDate, dueSoonDays);
                const isCompleted = status === 'Completed' || status === 'Completed Late';

                return (
                  <div
                    key={del.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden hover:border-slate-300 transition-all"
                  >
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                          📚
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{del.title}</h3>
                            <DrillStatusBadge status={status} size="sm" />
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 uppercase">
                              {del.frequency}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                            <span>Planned Target: <strong className="text-slate-700">{formatDisplayDate(del.plannedDate)}</strong></span>
                            {del.actualCompletionDate && (
                              <span>Completed: <strong className="text-emerald-700">{formatDisplayDate(del.actualCompletionDate)}</strong></span>
                            )}
                            {del.targetAudience && (
                              <span>Audience: <strong className="text-slate-700">{del.targetAudience}</strong></span>
                            )}
                            {del.completionRate !== undefined && (
                              <span>Completion Rate: <strong className="text-emerald-700">{del.completionRate}%</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => onOpenCompleteDeliverable(customer, del)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Complete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenEditDeliverable(customer, del)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDeliverable(customer, selectedYear, del.id)}
                          className="p-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                          title="Delete Deliverable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {del.notes && (
                      <div className="p-4 bg-white text-xs text-slate-600">
                        <span className="font-bold text-slate-700">Notes / Objectives:</span> {del.notes}
                      </div>
                    )}

                    {del.customFields && del.customFields.length > 0 && (
                      <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span>Deliverable Custom Specifications</span>
                        </div>
                        <CustomFieldsDisplay fields={del.customFields} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Annual Drill Compliance & Completion Health Visualization */}
          <DrillComplianceChart
            drills={drills}
            compliance={compliance}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onSelectYear={(yr) => {
              setSelectedYear(yr);
              setSelectedDrillId(undefined);
            }}
            referenceDate={referenceDate}
            dueSoonDays={dueSoonDays}
          />

          {/* Year Selection Tabs & Timeline Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Timeline Header bar with Year Tabs */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800">
              {selectedYear} Annual Drill Timeline
            </h2>
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => {
                    setSelectedYear(yr);
                    setSelectedDrillId(undefined);
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr} Plan
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Completed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Due Soon
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Upcoming
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Overdue
            </div>
          </div>
        </div>

        <div className="p-6">
          <TimelineVisualizer
            drills={drills}
            referenceDate={referenceDate}
            selectedDrillId={selectedDrillId}
            onSelectDrill={(d) => setSelectedDrillId(d.id)}
            onMarkComplete={(d) => onOpenCompleteDrill(customer, d)}
          />
        </div>
      </div>

      {/* Drill Records & Debriefs Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {selectedYear} Multi-Vector Drill Records & Debriefs
            </h2>
            <p className="text-xs text-slate-500">
              Showing {displayedDrills.length} simulation(s) • Categorized by threat vectors (Phishing, Vishing, Smishing)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Filter Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDrillCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  drillCategoryFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({drills.length})
              </button>
              <button
                type="button"
                onClick={() => setDrillCategoryFilter('phishing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  drillCategoryFilter === 'phishing'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                🎣 Phishing ({phishingDrills.length})
              </button>
              <button
                type="button"
                onClick={() => setDrillCategoryFilter('vishing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  drillCategoryFilter === 'vishing'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                📞 Vishing ({vishingDrills.length})
              </button>
              <button
                type="button"
                onClick={() => setDrillCategoryFilter('smishing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  drillCategoryFilter === 'smishing'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                💬 Smishing ({smishingDrills.length})
              </button>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScheduleLicenseDrillData({ isOpen: true, drillType: 'Vishing' })}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Schedule a new voice vishing simulation drill"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>+ Vishing</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleLicenseDrillData({ isOpen: true, drillType: 'Smishing' })}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Schedule a new SMS smishing simulation drill"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>+ Smishing</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {displayedDrills.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">
                No drills scheduled under &quot;{drillCategoryFilter}&quot;
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule a new Vishing or Smishing simulation above to add exercises into this category.
              </p>
            </div>
          ) : (
            displayedDrills.map((drill) => {
            const status = computeDrillStatus(drill, referenceDate, dueSoonDays);
            const isCompleted = status === 'Completed' || status === 'Completed Late';
            const isSelected = selectedDrillId === drill.id;
            const period = getSanctionedDrillPeriod(drill, referenceDate);
            const hasReviewMeeting = Boolean(
              drill.reviewMeeting &&
                drill.reviewMeeting.date &&
                drill.reviewMeeting.status !== 'Not Scheduled'
            );

            return (
              <div
                key={drill.id}
                id={`drill-card-${drill.id}`}
                className={`bg-white rounded-xl border transition-all shadow-xs overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Drill Card Header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      #{drill.drillNumber}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{drill.title}</h3>
                        <DrillStatusBadge status={status} size="sm" />
                        <DrillResultBadge result={drill.overallResult} />
                        {period.isCurrentPeriod && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                            Active Drill Quarter
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold border ${
                            period.isCurrentPeriod
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : period.isPastPeriod
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-100/80'
                          }`}
                        >
                          Period: {period.label} ({period.quarterLabel})
                          {period.isCurrentPeriod && ` • ${period.daysRemainingInPeriod}d left`}
                        </span>
                        <span>
                          Target Launch: <span className="font-semibold text-slate-700">{formatDisplayDate(drill.plannedDate)}</span>
                        </span>
                        {drill.drillType && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                            drill.drillType === 'Vishing (Voice Phishing)' || drill.drillType === 'Social Engineering Call'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : drill.drillType === 'Smishing (SMS)'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {(drill.drillType === 'Vishing (Voice Phishing)' || drill.drillType === 'Social Engineering Call') && '📞 '}
                            {drill.drillType === 'Smishing (SMS)' && '💬 '}
                            {drill.drillType}
                          </span>
                        )}
                        {drill.campaignName && (
                          <span>• Campaign: <span className="font-medium text-slate-700">{drill.campaignName}</span></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEmailModalData({ isOpen: true, drill, isOverdue: status === 'Overdue' })}
                      className="px-2.5 py-1.5 border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Send Drill Notice via SMTP"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Notice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditDrill(customer, drill)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Edit planned date or type"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReviewMeeting(customer, drill)}
                      className={`px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        hasReviewMeeting
                          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                      title={hasReviewMeeting ? 'Manage Scheduled Review Meeting' : 'Schedule Review Meeting'}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>{hasReviewMeeting ? `Meeting (${drill.reviewMeeting?.status})` : '+ Review Meeting'}</span>
                    </button>

                    {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onOpenCompleteDrill(customer, drill)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Mark Completed</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenCompleteDrill(customer, drill)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Update Results</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Drill Card Content */}
                <div className="p-5 space-y-4">
                  {/* Performance Metrics Bar (if completed) */}
                  {isCompleted ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs">
                      <div>
                        <div className="text-slate-500 font-medium">Actual Completion Date</div>
                        <div className="text-slate-900 font-bold mt-0.5 flex items-center gap-1">
                          {formatDisplayDate(drill.actualCompletionDate)}
                          {status === 'Completed Late' ? (
                            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">Late</span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">On Time</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 font-medium">Click Rate</div>
                        <div className="text-slate-900 font-bold mt-0.5 text-sm">
                          {drill.clickRate !== undefined ? `${drill.clickRate}%` : '—'}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 font-medium">Credential Submission</div>
                        <div className="text-slate-900 font-bold mt-0.5 text-sm">
                          {drill.submissionRate !== undefined ? `${drill.submissionRate}%` : '—'}
                        </div>
                      </div>

                      <div>
                        <div className="text-slate-500 font-medium">Reporting Rate</div>
                        <div className="text-slate-900 font-bold mt-0.5 text-sm">
                          {drill.reportingRate !== undefined ? `${drill.reportingRate}%` : '—'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          Sanctioned Drill Window: <strong className="text-slate-800 font-semibold">{period.label}</strong> (launch scheduled: {formatDisplayDate(drill.plannedDate)}). CSM can fill drill results when completed.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Drill Operational Notes Box */}
                  {drill.notes && (
                    <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-blue-900">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          Drill #{drill.drillNumber} Operational Notes
                        </span>
                        {drill.notesCreatedAt && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            Date Created: {formatDisplayDate(drill.notesCreatedAt)}
                            {drill.notesCreatedBy && ` by ${drill.notesCreatedBy}`}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {drill.notes}
                      </p>
                    </div>
                  )}

                  {/* Findings, Recommendations, Summary */}
                  {(drill.summary || drill.keyFindings || drill.recommendations) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {drill.summary && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="font-semibold text-slate-700 mb-1">Executive Summary</div>
                          <p className="text-slate-600 leading-relaxed">{drill.summary}</p>
                        </div>
                      )}

                      {drill.keyFindings && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="font-semibold text-slate-700 mb-1">Key Findings</div>
                          <p className="text-slate-600 leading-relaxed">{drill.keyFindings}</p>
                        </div>
                      )}

                      {drill.recommendations && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="font-semibold text-slate-700 mb-1">Recommendations</div>
                          <p className="text-slate-600 leading-relaxed">{drill.recommendations}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Meeting & MoM Section */}
                  {hasReviewMeeting && drill.reviewMeeting && (
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>{drill.reviewMeeting.meetingType || 'Debrief Meeting'}: Drill #{drill.drillNumber}</span>
                          </span>
                          {drill.reviewMeeting.momStatus && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              MoM: {drill.reviewMeeting.momStatus}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <ReviewMeetingStatusBadge status={drill.reviewMeeting.status} />
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => onOpenReviewMeeting(customer, drill)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <FileCheck2 className="w-3 h-3 text-emerald-600" />
                              <span>View / Edit MoM</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 text-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium text-slate-800">
                            Date: <strong>{formatDisplayDate(drill.reviewMeeting.date)}</strong>
                            {drill.reviewMeeting.participants && (
                              <span className="text-slate-600 font-normal"> • Attendees: {drill.reviewMeeting.participants}</span>
                            )}
                          </div>
                          {drill.reviewMeeting.nextFollowUpDate && (
                            <span className="text-blue-700 font-semibold bg-blue-100/60 px-2 py-0.5 rounded-md">
                              Next Follow-Up: {formatDisplayDate(drill.reviewMeeting.nextFollowUpDate)}
                            </span>
                          )}
                        </div>

                        {/* Scope Review Details if available */}
                        {drill.reviewMeeting.scopeDetails && (
                          <div className="bg-white p-3 rounded-lg border border-indigo-100 space-y-1.5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Authorized Scope Review Parameters</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                              <div>Domains: <strong>{drill.reviewMeeting.scopeDetails.domainsInScope || 'All Corporate Domains'}</strong></div>
                              <div>Target Seats: <strong>{drill.reviewMeeting.scopeDetails.targetCount || 'All Mailboxes'}</strong></div>
                              <div>Whitelisting: <strong className="text-emerald-700">{drill.reviewMeeting.scopeDetails.whitelistingConfirmed ? 'Confirmed ✓' : 'Pending Verification'}</strong></div>
                            </div>
                            {drill.reviewMeeting.scopeDetails.phoneSmsCoverage && (
                              <div className="text-[11px] text-slate-600">
                                📞 Vishing/Smishing Coverage: {drill.reviewMeeting.scopeDetails.phoneSmsCoverage}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Formal MoM (Minutes of Meeting) Decisions & Action Items */}
                        {(drill.reviewMeeting.momDecisions || (drill.reviewMeeting.momActionItems && drill.reviewMeeting.momActionItems.length > 0)) && (
                          <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Minutes of Meeting (MoM) — Agreed Resolutions</span>
                            </div>

                            {drill.reviewMeeting.momDecisions && (
                              <div className="text-slate-700 text-[11px] bg-emerald-50/40 p-2 rounded-md border border-emerald-100/60">
                                <span className="font-bold text-emerald-950">Key Decisions:</span> {drill.reviewMeeting.momDecisions}
                              </div>
                            )}

                            {drill.reviewMeeting.momActionItems && drill.reviewMeeting.momActionItems.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Agreed Action Items:</span>
                                <div className="space-y-1">
                                  {drill.reviewMeeting.momActionItems.map((act) => (
                                    <div
                                      key={act.id}
                                      className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-md border border-slate-200/80 text-[11px]"
                                    >
                                      <span className="text-slate-800 font-medium">• {act.task}</span>
                                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                        <span className="text-slate-500">Owner: <strong>{act.owner}</strong></span>
                                        <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                          act.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {act.status || 'Pending'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {drill.reviewMeeting.findings && (
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-700">Findings:</span> {drill.reviewMeeting.findings}
                          </div>
                        )}

                        {drill.reviewMeeting.actionItems && !drill.reviewMeeting.momActionItems?.length && (
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-700">Action Items:</span> {drill.reviewMeeting.actionItems}
                          </div>
                        )}

                        {drill.reviewMeeting.customFields && drill.reviewMeeting.customFields.length > 0 && (
                          <div className="pt-2 border-t border-blue-100/60">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                              Meeting Custom Attributes
                            </div>
                            <CustomFieldsDisplay fields={drill.reviewMeeting.customFields} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Drill Custom Fields */}
                  {drill.customFields && drill.customFields.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        <span>Drill Custom Specifications</span>
                      </div>
                      <CustomFieldsDisplay fields={drill.customFields} />
                    </div>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>

      {/* Customer Account Notes & Debriefs Hub (Outline: 1. Overall -> 2. General -> 3. Drill-wise) */}
      <CustomerAccountNotesHub
        customer={customer}
        selectedYear={selectedYear}
        availableYears={availableYears}
        canEdit={canEdit}
        onSelectYear={(yr) => setSelectedYear(yr)}
        onOpenDrillExecution={(drill) => onOpenCompleteDrill(customer, drill)}
      />
        </>
      )}

      {/* Annual Compliance Summary Box */}
      <div className="p-6 rounded-xl bg-slate-900 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase font-bold text-blue-400 tracking-wider">
              Annual Compliance Summary
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {customer.companyName} — {selectedYear} Security Awareness Drill Summary
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onViewAnnualReport(customer.id, selectedYear)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <FileBarChart2 className="w-3.5 h-3.5" /> Full Printable Report
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Required Drills</div>
            <div className="text-base font-bold text-white mt-0.5">
              {compliance.annualRequirement}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Total Completed</div>
            <div className="text-base font-bold text-white mt-0.5">
              {compliance.completedCount}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Completed On Time</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {compliance.completedOnTimeCount}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Completed Late</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              {compliance.completedLateCount}
            </div>
          </div>

          <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700">
            <div className="text-slate-400">Review Debriefs</div>
            <div className="text-base font-bold text-blue-300 mt-0.5">
              {compliance.reviewMeetingsCompletedCount}
            </div>
          </div>
        </div>
      </div>

      <EditCustomerModal
        isOpen={isEditCustomerOpen}
        onClose={() => setIsEditCustomerOpen(false)}
        customer={customer}
        initialTab={editCustomerTab}
      />

      {emailModalData.isOpen && (
        <EmailReminderModal
          isOpen={emailModalData.isOpen}
          onClose={() => setEmailModalData({ isOpen: false })}
          customer={customer}
          drill={emailModalData.drill}
          review={emailModalData.review}
          isOverdue={emailModalData.isOverdue}
        />
      )}

      {/* Delete Customer Confirmation Dialog */}
      {isDeleteCustomerOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Customer Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{customer.companyName}</strong>?
                </p>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
                  <p className="font-semibold">⚠️ Irreversible Action</p>
                  <p>
                    This will permanently delete all {Object.keys(customer.annualPlans).length} annual plan(s), quarterly drills, compliance debrief records, and LMS training modules.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteCustomerOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-customer"
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload & Provision License Modal */}
      <UploadLicenseModal
        isOpen={isUploadLicenseOpen}
        onClose={() => setIsUploadLicenseOpen(false)}
        customer={customer}
      />

      {/* Excel License Spreadsheet Preview Modal */}
      <ExcelLicenseViewerModal
        isOpen={isExcelPreviewOpen}
        onClose={() => setIsExcelPreviewOpen(false)}
        license={activeLicense}
        customer={customer}
      />

      {/* Schedule Vishing / Smishing Drill Modal */}
      <ScheduleLicenseDrillModal
        isOpen={scheduleLicenseDrillData.isOpen}
        onClose={() => setScheduleLicenseDrillData({ isOpen: false, drillType: 'Vishing' })}
        customer={customer}
        drillType={scheduleLicenseDrillData.drillType}
      />
    </div>
  );
};
