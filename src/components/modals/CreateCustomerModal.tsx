import React, { useState, useMemo, useEffect } from 'react';
import { DrillType, CustomerProducts, CustomField } from '../../types';
import { generateAnnualTimeline, SYSTEM_TODAY } from '../../utils/drillCalculator';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  X,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Check,
  FileSpreadsheet,
  Key,
} from 'lucide-react';
import { SectionCustomFields } from '../common/SectionCustomFields';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    companyName: string;
    customerContact: string;
    contactEmail?: string;
    contactPhone?: string;
    cisoName?: string;
    cisoEmail?: string;
    cisoPhone?: string;
    accountOwner: string;
    startDate: string;
    endDate?: string;
    annualRequirement: number;
    intervalMonths: number;
    defaultDrillType: DrillType;
    industry?: string;
    notes?: string;
    products?: CustomerProducts;
    customFields?: CustomField[];
    licenseDetails?: {
      productPlan?: string;
      productSubscription?: string;
      adminUsersCount?: number;
      managedDrillFrequency?: string;
      targetEmployeesCount?: number;
      tiering?: string;
      companySector?: string;
      salesChannel?: string;
      country?: string;
      activationStatus?: string;
      maintenanceEndDate?: string;
    };
  }) => void;
}

const DRILL_TYPES: DrillType[] = [
  'Phishing Email Simulation',
  'Spear Phishing / Executive',
  'Smishing (SMS)',
  'Vishing (Voice Phishing)',
  'Credential Harvesting',
  'Ransomware Awareness',
  'USB Drop / Physical',
  'Social Engineering Call',
  'Custom Drill',
];

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // ProGist License Form State
  const [companyName, setCompanyName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [cisoName, setCisoName] = useState('');
  const [cisoEmail, setCisoEmail] = useState('');
  const [cisoPhone, setCisoPhone] = useState('');
  
  const [startDate, setStartDate] = useState(SYSTEM_TODAY);
  const [endDate, setEndDate] = useState('2027-08-31');
  const [maintenanceEndDate, setMaintenanceEndDate] = useState('2027-08-01');

  const [productPlan, setProductPlan] = useState('Enterprise Pro');
  const [productSubscription, setProductSubscription] = useState('ProPhish & ProLMS');
  const [adminUsersCount, setAdminUsersCount] = useState<number>(1300);
  const [targetEmployeesCount, setTargetEmployeesCount] = useState<number>(500);
  const [tiering, setTiering] = useState('1');
  const [companySector, setCompanySector] = useState('Conglomerate');
  const [salesChannel, setSalesChannel] = useState('Direct');
  const [country, setCountry] = useState('India');
  const [activationStatus, setActivationStatus] = useState('Activated');

  const [managedFrequency, setManagedFrequency] = useState('Quarterly');
  const [annualRequirement, setAnnualRequirement] = useState<number>(4);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [defaultDrillType, setDefaultDrillType] = useState<DrillType>('Phishing Email Simulation');

  const [products, setProducts] = useState<CustomerProducts>({
    prophish: true,
    proLms: true,
    proPatrol: true,
  });

  const { customizationSettings } = useCustomerContext();

  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCustomFields((prevFields) => {
        const userDefinedFields = customizationSettings.fields.filter((f) => !f.isSystem && f.visible);
        const map = new Map<string, any>();
        prevFields.forEach((pf) => {
          if (pf.id) map.set(pf.id, pf.value);
          if (pf.key) map.set(pf.key, pf.value);
        });

        return userDefinedFields.map((udf) => ({
          id: udf.id,
          key: udf.key,
          label: udf.label,
          type: udf.type as any,
          options: udf.options,
          placeholder: udf.placeholder,
          required: udf.required,
          value: map.has(udf.id)
            ? map.get(udf.id)
            : map.has(udf.key)
            ? map.get(udf.key)
            : (udf.defaultValue ?? (udf.type === 'boolean' ? false : '')),
          section: udf.section,
          helpText: udf.helpText,
        }));
      });
    } else {
      setCustomFields([]);
    }
  }, [isOpen, customizationSettings.fields]);

  // Frequency change handler
  const handleFrequencyChange = (freq: string) => {
    setManagedFrequency(freq);
    if (freq.toLowerCase().includes('quarter')) {
      setAnnualRequirement(4);
      setIntervalMonths(3);
    } else if (freq.toLowerCase().includes('month')) {
      setAnnualRequirement(12);
      setIntervalMonths(1);
    } else if (freq.toLowerCase().includes('half')) {
      setAnnualRequirement(2);
      setIntervalMonths(6);
    } else if (freq.toLowerCase().includes('year')) {
      setAnnualRequirement(1);
      setIntervalMonths(12);
    }
  };

  // Preview generated timeline dynamically with sanctioned periods
  const previewDrills = useMemo(() => {
    if (!startDate) return [];
    return generateAnnualTimeline(
      startDate,
      annualRequirement,
      intervalMonths,
      defaultDrillType,
      managedFrequency
    );
  }, [startDate, annualRequirement, intervalMonths, defaultDrillType, managedFrequency]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !customerContact.trim() || !startDate) return;

    onSubmit({
      companyName: companyName.trim(),
      customerContact: customerContact.trim(),
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      cisoName: cisoName.trim() || undefined,
      cisoEmail: cisoEmail.trim() || undefined,
      cisoPhone: cisoPhone.trim() || undefined,
      accountOwner: salesChannel.trim() || 'Direct',
      startDate,
      endDate: endDate.trim() || undefined,
      annualRequirement,
      intervalMonths,
      defaultDrillType,
      industry: companySector.trim() || undefined,
      notes: notes.trim() || undefined,
      products,
      customFields: customFields.length > 0 ? customFields : undefined,
      licenseDetails: {
        productPlan: productPlan.trim(),
        productSubscription: productSubscription.trim(),
        adminUsersCount,
        managedDrillFrequency: managedFrequency,
        targetEmployeesCount,
        tiering,
        companySector,
        salesChannel,
        country,
        activationStatus,
        maintenanceEndDate,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="modal-create-customer"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create ProGist Customer Account</h2>
              <p className="text-xs text-slate-400">
                Configure annual license, product subscription, tiering, and automated drill schedule.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 text-xs">
          {/* Section 1: Customer Identity & SPOC */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" /> 1. Customer Organization & SPOC Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer Name / Company <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-company-name"
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SPOC Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-customer-contact"
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SPOC Email</label>
                <input
                  id="input-contact-email"
                  type="email"
                  placeholder="rahul@acme.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SPOC Contact (Phone)</label>
                <input
                  id="input-contact-phone"
                  type="text"
                  placeholder="9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Conglomerate, Fintech"
                  value={companySector}
                  onChange={(e) => setCompanySector(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  placeholder="e.g. India, USA"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Customized fields directly inside Section 1 (Organization & Account) */}
            <SectionCustomFields
              section="accountDetails"
              customFields={customFields}
              onChange={setCustomFields}
              gridColsClass="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
              addButtonLabel="+ Add Field to Organization & SPOC"
            />

            {/* CISO / Chief Information Security Officer Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>CISO Information (Executive Security Leadership)</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Optional
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CISO Full Name</label>
                  <input
                    id="input-ciso-name"
                    type="text"
                    placeholder="e.g. Rajesh Nair (CISO)"
                    value={cisoName}
                    onChange={(e) => setCisoName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CISO Email</label>
                  <input
                    id="input-ciso-email"
                    type="email"
                    placeholder="ciso@company.com"
                    value={cisoEmail}
                    onChange={(e) => setCisoEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CISO Phone / Contact</label>
                  <input
                    id="input-ciso-phone"
                    type="text"
                    placeholder="+91 98765 43210"
                    value={cisoPhone}
                    onChange={(e) => setCisoPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  />
                </div>
              </div>

              {/* Customized fields directly inside CISO & Contacts */}
              <SectionCustomFields
                section="contacts"
                customFields={customFields}
                onChange={setCustomFields}
                gridColsClass="grid grid-cols-1 sm:grid-cols-3 gap-3"
                addButtonLabel="+ Add Field to CISO Info"
              />
            </div>
          </div>

          {/* Section 2: License & Product Plan */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> 2. License & Product Subscriptions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Plan</label>
                <input
                  type="text"
                  value={productPlan}
                  onChange={(e) => setProductPlan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Subscription</label>
                <input
                  type="text"
                  value={productSubscription}
                  onChange={(e) => setProductSubscription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Users Provisioned</label>
                <input
                  type="number"
                  value={adminUsersCount}
                  onChange={(e) => setAdminUsersCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Employees Count</label>
                <input
                  type="number"
                  value={targetEmployeesCount}
                  onChange={(e) => setTargetEmployeesCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiering (1 / 2 / 3)</label>
                <select
                  value={tiering}
                  onChange={(e) => setTiering(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="1">Tier 1 (Enterprise)</option>
                  <option value="2">Tier 2 (Mid-Market)</option>
                  <option value="3">Tier 3 (Standard)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Channel</label>
                <select
                  value={salesChannel}
                  onChange={(e) => setSalesChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="Direct">Direct</option>
                  <option value="Partner">via Partner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Activation Status</label>
                <select
                  value={activationStatus}
                  onChange={(e) => setActivationStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="Activated">Activated</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maintenance End Date</label>
                <input
                  type="date"
                  value={maintenanceEndDate}
                  onChange={(e) => setMaintenanceEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Products Toggles */}
            <div className="pt-2 flex items-center gap-6">
              <span className="font-semibold text-slate-700">Product Modules:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={products.prophish}
                  onChange={(e) => setProducts({ ...products, prophish: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium text-slate-800">ProPhish</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={products.proLms}
                  onChange={(e) => setProducts({ ...products, proLms: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium text-slate-800">ProLMS / Awareness</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={products.proPatrol}
                  onChange={(e) => setProducts({ ...products, proPatrol: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium text-slate-800">ProPatrol</span>
              </label>
            </div>

            {/* Automatic License Provisioning Banner */}
            {customizationSettings.licenseConfig.autoGenerateOnCustomerCreation && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between mt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Automatic License Generation Policy Active
                    </p>
                    <p className="text-[11px] text-emerald-700">
                      Saving this account will automatically issue an active master license (Prefix:{' '}
                      <code className="font-mono font-bold bg-white px-1 py-0.2 rounded border border-emerald-200">
                        {customizationSettings.licenseConfig.licenseKeyPrefix}
                      </code>
                      , Duration: {customizationSettings.licenseConfig.defaultValidityMonths} Months).
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                  Auto-Issued
                </span>
              </div>
            )}

            {/* Customized fields directly inside Section 2: License & Product Subscriptions */}
            <SectionCustomFields
              section="licenseInfo"
              customFields={customFields}
              onChange={setCustomFields}
              gridColsClass="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3"
              addButtonLabel="+ Add Field to License & Subscriptions"
            />
          </div>

          {/* Section 3: Annual Drill Schedule & Dates */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> 3. Drill Schedule & Timeline Generator
              </h3>
              <span className="text-[11px] text-blue-700 bg-blue-50 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Automatic Timeline
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  License Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">License End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Managed Drill Frequency</label>
                <select
                  value={managedFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  <option value="Monthly">Monthly (12/yr)</option>
                  <option value="Quarterly">Quarterly (4/yr)</option>
                  <option value="Half yearly">Half Yearly (2/yr)</option>
                  <option value="Yearly">Yearly (1/yr)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Drill Type</label>
                <select
                  value={defaultDrillType}
                  onChange={(e) => setDefaultDrillType(e.target.value as DrillType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                >
                  {DRILL_TYPES.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generated Timeline Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Sanctioned Drill Periods ({previewDrills.length} Drills):</span>
                <span className="text-slate-500 font-normal">Sanctioned execution window per frequency</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {previewDrills.map((drill, idx) => (
                  <div key={drill.id} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Drill #{idx + 1}</span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        Q{drill.quarter || idx + 1}
                      </span>
                    </div>
                    <div className="text-emerald-700 font-semibold text-[10px]">
                      {drill.drillPeriodLabel || drill.plannedDate}
                    </div>
                    <div className="text-slate-500 text-[10px] truncate">{drill.drillType}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Additional Notes / Remarks</label>
            <textarea
              rows={2}
              placeholder="Enter special requirements or agreement notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden"
            />
          </div>

          {/* Customized fields directly inside General Notes */}
          <SectionCustomFields
            section="generalNotes"
            customFields={customFields}
            onChange={setCustomFields}
            addButtonLabel="+ Add Field to Notes"
          />

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-customer"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Create Customer Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
