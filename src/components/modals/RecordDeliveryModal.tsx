import React, { useState, useEffect } from 'react';
import {
  ActualDeliveryRecord,
  PlannedDeliverableRequirement,
  DeliverableCategory,
  DeliverableFileFormat,
  DeliverableDeliveryMode,
  DeliverableTrackingFrequency,
} from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  DELIVERABLE_CATEGORIES,
  DELIVERABLE_FILE_FORMATS,
  DELIVERABLE_DELIVERY_MODES,
  DELIVERABLE_FREQUENCIES,
  getReportingPeriodForDate,
  generateReportingPeriods,
} from '../../utils/deliverableTrackerHelper';
import {
  X,
  FileCheck2,
  Building2,
  Calendar,
  Layers,
  FileText,
  Send,
  Link,
  Save,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface RecordDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery?: ActualDeliveryRecord | null;
  defaultRequirement?: PlannedDeliverableRequirement | null;
  defaultCustomerId?: string;
  defaultLicenseId?: string;
}

export const RecordDeliveryModal: React.FC<RecordDeliveryModalProps> = ({
  isOpen,
  onClose,
  delivery,
  defaultRequirement,
  defaultCustomerId,
  defaultLicenseId,
}) => {
  const {
    customers,
    users,
    currentUser,
    referenceDate,
    allPlannedDeliverables,
    recordActualDelivery,
    updateActualDelivery,
  } = useCustomerContext();

  const [customerId, setCustomerId] = useState<string>('');
  const [licenseId, setLicenseId] = useState<string>('');
  const [requirementId, setRequirementId] = useState<string>('');
  const [category, setCategory] = useState<DeliverableCategory>('Infographics');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState<DeliverableFileFormat>('PDF');
  const [deliveryMode, setDeliveryMode] = useState<DeliverableDeliveryMode>('Email');
  const [dateShared, setDateShared] = useState(referenceDate || new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<DeliverableTrackingFrequency>('Quarterly');
  const [reportingPeriodKey, setReportingPeriodKey] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [csmName, setCsmName] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (delivery) {
      setCustomerId(delivery.customerId);
      setLicenseId(delivery.licenseId);
      setRequirementId(delivery.requirementId || '');
      setCategory(delivery.category);
      setCustomCategoryName(delivery.customCategoryName || '');
      setTitle(delivery.title);
      setFileName(delivery.fileName);
      setFileFormat(delivery.fileFormat);
      setDeliveryMode(delivery.deliveryMode);
      setDateShared(delivery.dateShared);
      setFrequency(delivery.frequency);
      setReportingPeriodKey(delivery.reportingPeriodKey);
      setQuantity(delivery.quantity || 1);
      setCsmName(delivery.csmName || '');
      setReferenceUrl(delivery.referenceUrl || '');
      setRemarks(delivery.remarks || '');
    } else if (defaultRequirement) {
      setCustomerId(defaultRequirement.customerId);
      setLicenseId(defaultRequirement.licenseId);
      setRequirementId(defaultRequirement.id);
      setCategory(defaultRequirement.category);
      setCustomCategoryName(defaultRequirement.customCategoryName || '');
      setTitle(defaultRequirement.title);
      setFileName('');
      setFileFormat('PDF');
      setDeliveryMode('Email');
      const todayDate = referenceDate || new Date().toISOString().split('T')[0];
      setDateShared(todayDate);
      setFrequency(defaultRequirement.frequency);
      const computedPeriod = getReportingPeriodForDate(todayDate, defaultRequirement.frequency);
      setReportingPeriodKey(computedPeriod.key);
      setQuantity(1);
      setCsmName(defaultRequirement.csmName || currentUser.name || '');
      setReferenceUrl('');
      setRemarks('');
    } else {
      const initialCustId = defaultCustomerId || (customers.length > 0 ? customers[0].id : '');
      const cust = customers.find((c) => c.id === initialCustId);
      const initialLicId =
        defaultLicenseId || (cust?.licenses && cust.licenses.length > 0 ? cust.licenses[0].id : '');

      setCustomerId(initialCustId);
      setLicenseId(initialLicId);
      setRequirementId('');
      setCategory('Infographics');
      setCustomCategoryName('');
      setTitle('');
      setFileName('');
      setFileFormat('PDF');
      setDeliveryMode('Email');
      const todayDate = referenceDate || new Date().toISOString().split('T')[0];
      setDateShared(todayDate);
      setFrequency('Quarterly');
      const computedPeriod = getReportingPeriodForDate(todayDate, 'Quarterly');
      setReportingPeriodKey(computedPeriod.key);
      setQuantity(1);
      setCsmName(cust?.csmName || currentUser.name || '');
      setReferenceUrl('');
      setRemarks('');
    }
    setError(null);
  }, [delivery, defaultRequirement, defaultCustomerId, defaultLicenseId, isOpen, customers, currentUser, referenceDate]);

  // Recalculate reporting period automatically when dateShared or frequency changes
  useEffect(() => {
    if (dateShared && frequency) {
      const computed = getReportingPeriodForDate(dateShared, frequency);
      setReportingPeriodKey(computed.key);
    }
  }, [dateShared, frequency]);

  // When requirement is picked, auto-fill title, category, frequency
  const handleRequirementSelect = (reqId: string) => {
    setRequirementId(reqId);
    if (!reqId) return;

    const matchedReq = allPlannedDeliverables.find((r) => r.id === reqId);
    if (matchedReq) {
      setTitle(matchedReq.title);
      setCategory(matchedReq.category);
      setCustomCategoryName(matchedReq.customCategoryName || '');
      setFrequency(matchedReq.frequency);
      if (dateShared) {
        const computed = getReportingPeriodForDate(dateShared, matchedReq.frequency);
        setReportingPeriodKey(computed.key);
      }
    }
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const availableLicenses = selectedCustomer?.licenses || [];
  const matchedLicense = availableLicenses.find((l) => l.id === licenseId) || availableLicenses[0];
  const csmUsers = users.filter((u) => u.role === 'CSM' || u.role === 'Admin');

  // Filter requirements matching selected customer and license
  const customerRequirements = allPlannedDeliverables.filter(
    (r) => r.customerId === customerId && (r.licenseId === licenseId || !licenseId)
  );

  // Available reporting periods for the year
  const availablePeriods = generateReportingPeriods(
    frequency,
    dateShared ? new Date(dateShared).getFullYear() : 2026
  );
  const activePeriod = availablePeriods.find((p) => p.key === reportingPeriodKey) || availablePeriods[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Please select a client organization.');
      return;
    }
    if (!licenseId) {
      setError('Please select an active client license.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a deliverable name or title.');
      return;
    }
    if (!fileName.trim()) {
      setError('Please provide the actual delivered file name (e.g. October_Cybersecurity_Awareness.mp4).');
      return;
    }
    if (!dateShared) {
      setError('Please select the date the deliverable was shared with the client.');
      return;
    }

    const payload = {
      requirementId: requirementId || undefined,
      customerId,
      customerName: selectedCustomer?.companyName || 'Client',
      licenseId: matchedLicense?.id || licenseId,
      licenseKey: matchedLicense?.licenseKey || 'LIC-ACTIVE',
      category,
      customCategoryName: category === 'Other' ? customCategoryName : undefined,
      title: title.trim(),
      fileName: fileName.trim(),
      fileFormat,
      deliveryMode,
      dateShared,
      frequency,
      reportingPeriodKey: activePeriod?.key || reportingPeriodKey,
      reportingPeriodLabel: activePeriod?.label || 'Reporting Period',
      reportingPeriodStartDate: activePeriod?.startDate || `${dateShared.slice(0, 7)}-01`,
      reportingPeriodEndDate: activePeriod?.endDate || `${dateShared.slice(0, 7)}-28`,
      csmName: csmName || currentUser.name || 'Assigned CSM',
      referenceUrl: referenceUrl.trim() || undefined,
      remarks: remarks.trim() || undefined,
      quantity: Number(quantity) || 1,
    };

    if (delivery) {
      updateActualDelivery(delivery.id, payload);
    } else {
      recordActualDelivery(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {delivery ? 'Edit Delivered Item Record' : 'Record Actual Client Delivery'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Log the actual file name, delivery format, mode, and date shared with the client.
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
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  const cust = customers.find((c) => c.id === e.target.value);
                  if (cust?.licenses && cust.licenses.length > 0) {
                    setLicenseId(cust.licenses[0].id);
                  }
                }}
                disabled={!!delivery || !!defaultRequirement}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Associated Client License *</span>
              </label>
              <select
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                disabled={!!delivery || !!defaultRequirement}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {availableLicenses.map((lic) => (
                  <option key={lic.id} value={lic.id}>
                    {lic.licenseKey} ({lic.planTier})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Link to Planned Requirement */}
          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-indigo-900">
                Link to Contracted Deliverable Requirement (Optional)
              </label>
              <span className="text-[10px] text-indigo-700 font-semibold">
                Auto-tracks against quota
              </span>
            </div>
            <select
              value={requirementId}
              onChange={(e) => handleRequirementSelect(e.target.value)}
              className="w-full px-3 py-2 border border-indigo-200 rounded-lg bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">— Standalone Delivery (Not linked to requirement) —</option>
              {customerRequirements.map((req) => (
                <option key={req.id} value={req.id}>
                  [{req.frequency}] {req.category}: {req.title} (Target: {req.targetQuantityPerPeriod}/period)
                </option>
              ))}
            </select>
          </div>

          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deliverable Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeliverableCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {DELIVERABLE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={category === 'Other' ? 'sm:col-span-1' : 'sm:col-span-2'}>
              <label className="block font-bold text-slate-700 mb-1">Deliverable Title / Topic *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q1 Cybersecurity Awareness Infographic"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            {category === 'Other' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Custom Category</label>
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="e.g. Policy Document"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            )}
          </div>

          {/* Actual File Name & Format & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Actual File Name *</span>
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. October_Cybersecurity_Awareness.mp4"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Exact delivered asset file name.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">File Format *</label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as DeliverableFileFormat)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {DELIVERABLE_FILE_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Delivery Mode *</span>
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value as DeliverableDeliveryMode)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {DELIVERABLE_DELIVERY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Shared & Reporting Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date Shared with Client *</span>
              </label>
              <input
                type="date"
                value={dateShared}
                onChange={(e) => setDateShared(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cadence Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as DeliverableTrackingFrequency)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {DELIVERABLE_FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Reporting Period *</span>
              </label>
              <select
                value={reportingPeriodKey}
                onChange={(e) => setReportingPeriodKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold text-indigo-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {availablePeriods.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Window: {activePeriod?.startDate} to {activePeriod?.endDate}
              </span>
            </div>
          </div>

          {/* CSM, URL, Quantity, Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Quantity Delivered</label>
              <input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Responsible CSM / Owner</label>
              <select
                value={csmName}
                onChange={(e) => setCsmName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="">Select CSM...</option>
                {csmUsers.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-slate-500" />
                <span>Reference Link / File URL</span>
              </label>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="https://sharepoint.com/asset..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Delivery Remarks & Client Feedback</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Distributed to all AP team members; feedback confirmed by client SecOps lead."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{delivery ? 'Update Delivery' : 'Record Delivery'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
