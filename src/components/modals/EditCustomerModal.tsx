import React, { useState, useEffect } from 'react';
import {
  Customer,
  CustomerStatus,
  DrillRecord,
  DrillType,
  DrillStatus,
  AnnualPlan,
} from '../../types';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Layers,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';
import { formatDisplayDate } from '../../utils/drillCalculator';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  initialTab?: 'profile' | 'dates' | 'drills';
}

const DRILL_TYPES: DrillType[] = [
  'Phishing Email Simulation',
  'Spear Phishing / Executive',
  'Smishing (SMS)',
  'Credential Harvesting',
  'Ransomware Awareness',
  'USB Drop / Physical',
  'Social Engineering Call',
  'Custom Drill',
];

const DRILL_STATUSES: DrillStatus[] = [
  'Upcoming',
  'Due Soon',
  'Completed',
  'Completed Late',
  'Overdue',
  'Not Completed',
  'Cancelled',
];

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  initialTab = 'profile',
}) => {
  const { updateCustomer, users, currentUser } = useCustomerContext();

  const [activeTab, setActiveTab] = useState<'profile' | 'dates' | 'drills'>(initialTab);

  // Profile Fields
  const [companyName, setCompanyName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [accountOwner, setAccountOwner] = useState('');
  const [csmId, setCsmId] = useState('');
  const [status, setStatus] = useState<CustomerStatus>('Active');
  const [notes, setNotes] = useState('');

  // Dates & License Fields
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maintenanceEndDate, setMaintenanceEndDate] = useState('');
  const [tiering, setTiering] = useState('Standard');
  const [productSubscription, setProductSubscription] = useState('Annual');
  const [targetEmployeesCount, setTargetEmployeesCount] = useState<number>(100);
  const [adminUsersCount, setAdminUsersCount] = useState<number>(3);
  const [lookAlikeDomainsCount, setLookAlikeDomainsCount] = useState<number>(1);
  const [products, setProducts] = useState({
    prophish: true,
    proLms: true,
    proPatrol: true,
  });

  // Drill Schedule Fields
  const [selectedPlanYear, setSelectedPlanYear] = useState<number>(2026);
  const [annualRequirement, setAnnualRequirement] = useState<number>(4);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [drillsList, setDrillsList] = useState<DrillRecord[]>([]);

  // Available Plan Years
  const availableYears = customer
    ? Object.keys(customer.annualPlans || {})
        .map(Number)
        .sort((a, b) => b - a)
    : [2026];

  const csmUsers = users.filter((u) => u.role === 'CSM');

  useEffect(() => {
    if (customer) {
      setCompanyName(customer.companyName || '');
      setCustomerContact(customer.customerContact || '');
      setContactEmail(customer.contactEmail || '');
      setContactPhone(customer.contactPhone || '');
      setIndustry(customer.industry || '');
      setAccountOwner(customer.accountOwner || '');
      setCsmId(customer.csmId || '');
      setStatus(customer.status || 'Active');
      setNotes(customer.notes || '');

      setStartDate(customer.startDate || '');
      setEndDate(customer.endDate || '');
      setMaintenanceEndDate(customer.licenseDetails?.maintenanceEndDate || '');
      setTiering(customer.licenseDetails?.tiering || 'Standard');
      setProductSubscription(customer.licenseDetails?.productSubscription || 'Annual');
      setTargetEmployeesCount(customer.licenseDetails?.targetEmployeesCount ?? 100);
      setAdminUsersCount(customer.licenseDetails?.adminUsersCount ?? 3);
      setLookAlikeDomainsCount(customer.licenseDetails?.lookAlikeDomainsCount ?? 1);

      setProducts({
        prophish: customer.products?.prophish ?? true,
        proLms: customer.products?.proLms ?? true,
        proPatrol: customer.products?.proPatrol ?? true,
      });

      const year = customer.currentYear || availableYears[0] || 2026;
      setSelectedPlanYear(year);

      const plan = customer.annualPlans?.[year];
      if (plan) {
        setAnnualRequirement(plan.annualRequirement || 4);
        setIntervalMonths(plan.intervalMonths || 3);
        setDrillsList(plan.drills ? JSON.parse(JSON.stringify(plan.drills)) : []);
      } else {
        setDrillsList([]);
      }
    }
  }, [customer, isOpen]);

  // When selected plan year changes, update drills list from customer annualPlans
  const handleYearChange = (year: number) => {
    setSelectedPlanYear(year);
    if (customer && customer.annualPlans?.[year]) {
      const plan = customer.annualPlans[year];
      setAnnualRequirement(plan.annualRequirement || 4);
      setIntervalMonths(plan.intervalMonths || 3);
      setDrillsList(plan.drills ? JSON.parse(JSON.stringify(plan.drills)) : []);
    } else {
      setDrillsList([]);
    }
  };

  if (!isOpen || !customer) return null;

  // Handle updating drill attribute
  const handleDrillChange = (index: number, field: keyof DrillRecord, value: any) => {
    setDrillsList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  // Add a new drill row
  const handleAddDrill = () => {
    const nextNum = drillsList.length + 1;
    const lastDrill = drillsList[drillsList.length - 1];
    let calculatedDate = startDate || new Date().toISOString().split('T')[0];

    if (lastDrill?.plannedDate) {
      const lastDate = new Date(lastDrill.plannedDate);
      lastDate.setMonth(lastDate.getMonth() + (intervalMonths || 3));
      calculatedDate = lastDate.toISOString().split('T')[0];
    }

    const newDrill: DrillRecord = {
      id: `drill-${customer.id}-${selectedPlanYear}-${nextNum}-${Date.now().toString(36)}`,
      drillNumber: nextNum,
      title: `Drill ${nextNum} - Q${nextNum > 4 ? nextNum : nextNum} Phishing Simulation`,
      plannedDate: calculatedDate,
      drillType: 'Phishing Email Simulation',
      status: 'Upcoming',
      campaignName: `${customer.companyName} Drill ${nextNum}`,
    };

    setDrillsList((prev) => [...prev, newDrill]);
  };

  // Remove a drill row
  const handleRemoveDrill = (index: number) => {
    setDrillsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !customerContact.trim() || !startDate) return;

    // Resolve assigned CSM display name
    const assignedCsm = users.find((u) => u.id === csmId);

    // Build updated annual plans
    const existingPlans = customer.annualPlans ? { ...customer.annualPlans } : {};
    const existingYearPlan = existingPlans[selectedPlanYear] || {
      year: selectedPlanYear,
      annualRequirement: annualRequirement || 4,
      startDate: startDate,
      intervalMonths: intervalMonths || 3,
      drills: [],
    };

    existingPlans[selectedPlanYear] = {
      ...existingYearPlan,
      annualRequirement: Number(annualRequirement) || 4,
      intervalMonths: Number(intervalMonths) || 3,
      drills: drillsList,
    };

    // Update customer in context and Firestore
    updateCustomer(customer.id, {
      companyName: companyName.trim(),
      customerContact: customerContact.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      industry: industry.trim() || undefined,
      accountOwner: accountOwner.trim() || undefined,
      csmId: csmId || undefined,
      csmName: assignedCsm ? assignedCsm.name : undefined,
      status: status,
      startDate: startDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
      products: products,
      licenseDetails: {
        ...(customer.licenseDetails || {}),
        tiering,
        productSubscription,
        targetEmployeesCount: Number(targetEmployeesCount) || 100,
        adminUsersCount: Number(adminUsersCount) || 3,
        lookAlikeDomainsCount: Number(lookAlikeDomainsCount) || 1,
        maintenanceEndDate: maintenanceEndDate || undefined,
      },
      annualPlans: existingPlans,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Edit Customer & Drill Dates</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {currentUser.role} Mode
                </span>
              </div>
              <p className="text-xs text-slate-500">{customer.companyName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Account</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dates')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'dates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Contract & Key Dates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drills')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'drills'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Drill Schedule & Planned Dates ({drillsList.length})</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: PROFILE & ACCOUNT */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Account Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Paused">Paused</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Primary Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Sector / Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Financial Services"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Account Lead / SecOps
                  </label>
                  <input
                    type="text"
                    value={accountOwner}
                    onChange={(e) => setAccountOwner(e.target.value)}
                    placeholder="e.g. Vinisha Mendonca"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Assigned CSM
                  </label>
                  <select
                    value={csmId}
                    onChange={(e) => setCsmId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  >
                    <option value="">⚠️ Unassigned</option>
                    {csmUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title || 'CSM'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Account Notes / Objectives
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter internal customer notes, compliance guidelines, or VIP preferences..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACT, LICENSE & KEY DATES */}
          {activeTab === 'dates' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Adjust contract tenure and maintenance dates below. These dates calculate compliance timelines and renewal alerts.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contract Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Effective contract start</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Contract End / Renewal Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Annual expiry / renewal</span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Maintenance End Date
                  </label>
                  <input
                    type="date"
                    value={maintenanceEndDate}
                    onChange={(e) => setMaintenanceEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Support & platform warranty</span>
                </div>
              </div>

              {/* License Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Target Employees (License Cap)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={targetEmployeesCount}
                    onChange={(e) => setTargetEmployeesCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Admin Users Allowed
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={adminUsersCount}
                    onChange={(e) => setAdminUsersCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Look-Alike Domains
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={lookAlikeDomainsCount}
                    onChange={(e) => setLookAlikeDomainsCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Product Modules Selection */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Opted Modules & Subscriptions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={products.prophish}
                      onChange={(e) => setProducts({ ...products, prophish: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Prophish</div>
                      <div className="text-[10px] text-slate-500">Phishing Simulation Drills</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={products.proLms}
                      onChange={(e) => setProducts({ ...products, proLms: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Pro LMS</div>
                      <div className="text-[10px] text-slate-500">Online Learning Management</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={products.proPatrol}
                      onChange={(e) => setProducts({ ...products, proPatrol: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Pro Patrol</div>
                      <div className="text-[10px] text-slate-500">Outlook & Gmail Plugin</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRILL SCHEDULE & PLANNED DATES */}
          {activeTab === 'drills' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Plan Year & Interval Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Plan Year
                    </label>
                    <select
                      value={selectedPlanYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr} Annual Plan
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Drills / Year
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={annualRequirement}
                      onChange={(e) => setAnnualRequirement(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                      Interval (Months)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={intervalMonths}
                      onChange={(e) => setIntervalMonths(Number(e.target.value))}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddDrill}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Scheduled Drill</span>
                </button>
              </div>

              {/* Drills List with direct planned date & completion date inputs */}
              <div className="space-y-3">
                {drillsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs font-semibold">No drills scheduled for {selectedPlanYear}.</p>
                    <button
                      type="button"
                      onClick={handleAddDrill}
                      className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                    >
                      + Add Drill 1
                    </button>
                  </div>
                ) : (
                  drillsList.map((drill, idx) => (
                    <div
                      key={drill.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-100">
                            #{drill.drillNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Drill {drill.drillNumber}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDrill(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Remove this drill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                            Planned Date <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={drill.plannedDate || ''}
                            onChange={(e) => handleDrillChange(idx, 'plannedDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                            Actual Completion Date
                          </label>
                          <input
                            type="date"
                            value={drill.actualCompletionDate || ''}
                            onChange={(e) =>
                              handleDrillChange(idx, 'actualCompletionDate', e.target.value || undefined)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                            Drill Type
                          </label>
                          <select
                            value={drill.drillType}
                            onChange={(e) =>
                              handleDrillChange(idx, 'drillType', e.target.value as DrillType)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          >
                            {DRILL_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                            Status
                          </label>
                          <select
                            value={drill.status}
                            onChange={(e) =>
                              handleDrillChange(idx, 'status', e.target.value as DrillStatus)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          >
                            {DRILL_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Campaign Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Q1 Spear Phishing Campaign"
                            value={drill.campaignName || ''}
                            onChange={(e) => handleDrillChange(idx, 'campaignName', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Notes / Simulation Scope
                          </label>
                          <input
                            type="text"
                            placeholder="Target departments or scenario details..."
                            value={drill.notes || ''}
                            onChange={(e) => handleDrillChange(idx, 'notes', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Changes will update local session and sync with live database.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

