import React, { useState, useEffect } from 'react';
import {
  Customer,
  PlannedDeliverableRequirement,
  DeliverableCategory,
  DeliverableTrackingFrequency,
} from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  DELIVERABLE_CATEGORIES,
  DELIVERABLE_FREQUENCIES,
} from '../../utils/deliverableTrackerHelper';
import { X, Layers, Building2, Calendar, User, Save, AlertCircle } from 'lucide-react';

interface AddEditDeliverableRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement?: PlannedDeliverableRequirement | null;
  defaultCustomerId?: string;
  defaultLicenseId?: string;
}

export const AddEditDeliverableRequirementModal: React.FC<AddEditDeliverableRequirementModalProps> = ({
  isOpen,
  onClose,
  requirement,
  defaultCustomerId,
  defaultLicenseId,
}) => {
  const { customers, users, currentUser, addPlannedDeliverable, updatePlannedDeliverable } =
    useCustomerContext();

  const [customerId, setCustomerId] = useState<string>('');
  const [licenseId, setLicenseId] = useState<string>('');
  const [category, setCategory] = useState<DeliverableCategory>('Infographics');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<DeliverableTrackingFrequency>('Quarterly');
  const [targetQuantity, setTargetQuantity] = useState<number>(1);
  const [year, setYear] = useState<number>(2026);
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [csmName, setCsmName] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Populate state on open or change
  useEffect(() => {
    if (requirement) {
      setCustomerId(requirement.customerId);
      setLicenseId(requirement.licenseId);
      setCategory(requirement.category);
      setCustomCategoryName(requirement.customCategoryName || '');
      setTitle(requirement.title);
      setFrequency(requirement.frequency);
      setTargetQuantity(requirement.targetQuantityPerPeriod);
      setYear(requirement.year || 2026);
      setStartDate(requirement.startDate || '2026-01-01');
      setEndDate(requirement.endDate || '2026-12-31');
      setCsmName(requirement.csmName || '');
      setStatus(requirement.status || 'Active');
      setNotes(requirement.notes || '');
    } else {
      const initialCustId = defaultCustomerId || (customers.length > 0 ? customers[0].id : '');
      const cust = customers.find((c) => c.id === initialCustId);
      const initialLicId =
        defaultLicenseId || (cust?.licenses && cust.licenses.length > 0 ? cust.licenses[0].id : '');

      setCustomerId(initialCustId);
      setLicenseId(initialLicId);
      setCategory('Infographics');
      setCustomCategoryName('');
      setTitle('');
      setFrequency('Quarterly');
      setTargetQuantity(1);
      setYear(2026);
      setStartDate('2026-01-01');
      setEndDate('2026-12-31');
      setCsmName(cust?.csmName || currentUser.name || '');
      setStatus('Active');
      setNotes('');
    }
    setError(null);
  }, [requirement, isOpen, defaultCustomerId, defaultLicenseId, customers, currentUser]);

  // When customer changes, update available licenses & default CSM
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const selectedCust = customers.find((c) => c.id === newCustId);
    if (selectedCust?.licenses && selectedCust.licenses.length > 0) {
      setLicenseId(selectedCust.licenses[0].id);
    } else {
      setLicenseId('');
    }
    if (selectedCust?.csmName) {
      setCsmName(selectedCust.csmName);
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const availableLicenses = selectedCustomer?.licenses || [];
  const csmUsers = users.filter((u) => u.role === 'CSM' || u.role === 'Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a customer client.');
      return;
    }
    if (!licenseId) {
      setError('A valid customer license is required to attach deliverables.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a deliverable title or requirement name.');
      return;
    }
    if (targetQuantity <= 0) {
      setError('Target quantity per period must be at least 1.');
      return;
    }

    const matchedLicense = availableLicenses.find((l) => l.id === licenseId);

    if (requirement) {
      // Edit mode
      updatePlannedDeliverable(requirement.id, {
        customerId,
        customerName: selectedCustomer?.companyName,
        licenseId,
        licenseKey: matchedLicense?.licenseKey || requirement.licenseKey,
        category,
        customCategoryName: category === 'Other' ? customCategoryName : undefined,
        title: title.trim(),
        frequency,
        targetQuantityPerPeriod: Number(targetQuantity),
        year: Number(year),
        startDate,
        endDate,
        csmName,
        status,
        notes: notes.trim(),
      });
    } else {
      // Add mode
      addPlannedDeliverable({
        customerId,
        customerName: selectedCustomer?.companyName || 'Client',
        licenseId,
        licenseKey: matchedLicense?.licenseKey || 'LIC-ACTIVE',
        category,
        customCategoryName: category === 'Other' ? customCategoryName : undefined,
        title: title.trim(),
        frequency,
        targetQuantityPerPeriod: Number(targetQuantity),
        year: Number(year),
        startDate,
        endDate,
        csmName,
        status,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {requirement ? 'Edit Planned Deliverable Requirement' : 'Add Planned Deliverable Requirement'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Define client entitlements for ProLMS deliverables across periodic cadences.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client & License Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Client Organization *</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                disabled={!!requirement}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} {c.products?.proLms ? '(ProLMS Active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Associated Client License *</span>
              </label>
              {availableLicenses.length > 0 ? (
                <select
                  value={licenseId}
                  onChange={(e) => setLicenseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  {availableLicenses.map((lic) => (
                    <option key={lic.id} value={lic.id}>
                      {lic.licenseKey} — {lic.name || lic.planTier}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px]">
                  No licenses found. Please create or upload a license for this client first.
                </div>
              )}
            </div>
          </div>

          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deliverable Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeliverableCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {DELIVERABLE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={category === 'Other' ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block font-bold text-slate-700 mb-1">Requirement Title / Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quarterly Cyber Threat Defense Infographic"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                required
              />
            </div>

            {category === 'Other' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Category Name</label>
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="e.g. Executive Briefing"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            )}
          </div>

          {/* Frequency & Target Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tracking Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as DeliverableTrackingFrequency)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                {DELIVERABLE_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {frequency === 'Monthly' && 'Tracked Jan–Dec (12 periods)'}
                {frequency === 'Quarterly' && 'Tracked Q1, Q2, Q3, Q4 (4 periods)'}
                {frequency === 'Half-Yearly' && 'Tracked H1 and H2 (2 periods)'}
                {frequency === 'Yearly' && 'Tracked once across the full year'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Qty Per Period *</label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Target quantity required in each {frequency.toLowerCase()} period.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Requirement Year *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  const y = parseInt(e.target.value) || 2026;
                  setYear(y);
                  setStartDate(`${y}-01-01`);
                  setEndDate(`${y}-12-31`);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Dates & Responsible CSM */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Responsible CSM / Owner</span>
              </label>
              <select
                value={csmName}
                onChange={(e) => setCsmName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="">Select CSM...</option>
                {csmUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Requirement Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              >
                <option value="Active">Active (Tracked)</option>
                <option value="Inactive">Inactive / Suspended</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Requirement Notes & Guidelines</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific guidance, themes, or stakeholder delivery instructions..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{requirement ? 'Save Changes' : 'Create Requirement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
