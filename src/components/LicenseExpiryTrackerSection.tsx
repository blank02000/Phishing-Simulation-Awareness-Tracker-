import React, { useState, useMemo } from 'react';
import { Customer, CustomerLicenseFile } from '../types';
import { useCustomerContext } from '../context/CustomerContext';
import { formatDisplayDate } from '../utils/drillCalculator';
import { getDaysUntilExpiry, calculateLicenseStatus } from '../utils/customizationDefaults';
import { DigitalLicenseCertificateModal } from './common/DigitalLicenseCertificateModal';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCw,
  Eye,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Users,
  Key,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface LicenseExpiryTrackerSectionProps {
  // If customer is provided, tracks licenses for that customer.
  // If not provided, tracks all licenses across all customers globally!
  customer?: Customer;
  onOpenUploadLicense?: () => void;
  canEdit?: boolean;
}

export const LicenseExpiryTrackerSection: React.FC<LicenseExpiryTrackerSectionProps> = ({
  customer,
  onOpenUploadLicense,
  canEdit = true,
}) => {
  const {
    customers,
    allCustomers,
    customizationSettings,
    renewCustomerLicense,
    deleteCustomerLicense,
  } = useCustomerContext();

  const warningThreshold = customizationSettings.licenseConfig.expiryWarningThresholdDays || 60;
  const criticalThreshold = customizationSettings.licenseConfig.expiryCriticalThresholdDays || 30;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [certificateModal, setCertificateModal] = useState<{
    isOpen: boolean;
    license: CustomerLicenseFile | null;
    customer: Customer | null;
  }>({
    isOpen: false,
    license: null,
    customer: null,
  });

  const [renewalModal, setRenewalModal] = useState<{
    isOpen: boolean;
    license: CustomerLicenseFile | null;
    customerId: string;
    durationMonths: number;
  }>({
    isOpen: false,
    license: null,
    customerId: '',
    durationMonths: 12,
  });

  // Collect target list of licenses with customer metadata
  const licenseRows = useMemo(() => {
    const list: { license: CustomerLicenseFile; cust: Customer }[] = [];
    const sourceCustomers = customer ? [customer] : allCustomers.length > 0 ? allCustomers : customers;

    sourceCustomers.forEach((c) => {
      if (c.licenses && c.licenses.length > 0) {
        c.licenses.forEach((lic) => {
          list.push({ license: lic, cust: c });
        });
      }
    });

    return list;
  }, [customer, allCustomers, customers]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let totalSeats = 0;

    licenseRows.forEach(({ license }) => {
      total += 1;
      totalSeats += license.targetSeats || 0;
      const days = getDaysUntilExpiry(license.expiryDate);
      if (days < 0) {
        expired += 1;
      } else if (days <= warningThreshold) {
        expiring += 1;
      } else {
        active += 1;
      }
    });

    return { total, active, expiring, expired, totalSeats };
  }, [licenseRows, warningThreshold]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return licenseRows.filter(({ license, cust }) => {
      const days = getDaysUntilExpiry(license.expiryDate);
      const isExpired = days < 0;
      const isExpiring = days >= 0 && days <= warningThreshold;
      const isActive = days > warningThreshold;

      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'expiring' && !isExpiring) return false;
      if (statusFilter === 'expired' && !isExpired) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = cust.companyName.toLowerCase().includes(query);
        const matchesLicName = license.name.toLowerCase().includes(query);
        const matchesKey = license.licenseKey.toLowerCase().includes(query);
        const matchesTier = license.planTier.toLowerCase().includes(query);
        if (!matchesName && !matchesLicName && !matchesKey && !matchesTier) return false;
      }

      return true;
    });
  }, [licenseRows, statusFilter, searchTerm, warningThreshold]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenCertificate = (license: CustomerLicenseFile, cust: Customer) => {
    setCertificateModal({
      isOpen: true,
      license,
      customer: cust,
    });
  };

  const handleOpenRenewal = (license: CustomerLicenseFile, customerId: string) => {
    setRenewalModal({
      isOpen: true,
      license,
      customerId,
      durationMonths: 12,
    });
  };

  const handleConfirmRenewal = () => {
    if (!renewalModal.license || !renewalModal.customerId) return;
    renewCustomerLicense(
      renewalModal.customerId,
      renewalModal.license.id,
      renewalModal.durationMonths
    );
    setRenewalModal({ isOpen: false, license: null, customerId: '', durationMonths: 12 });
  };

  const handleDelete = (customerId: string, licenseId: string, licenseName: string) => {
    if (window.confirm(`Are you sure you want to remove the license "${licenseName}"?`)) {
      deleteCustomerLicense(customerId, licenseId);
    }
  };

  return (
    <div className="space-y-5" id="license-expiry-tracker-root">
      {/* Expiry Tracking KPI Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Licenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Entitlements
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stats.active}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compliant & Valid</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expiring &lt; {warningThreshold} Days
            </p>
            <p className={`text-2xl font-bold mt-1 ${stats.expiring > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {stats.expiring}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Configured Alert Window
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.expiring > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Expired / Lapsed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expired / Inactive
            </p>
            <p className={`text-2xl font-bold mt-1 ${stats.expired > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {stats.expired}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Requires Contract Renewal
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.expired > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Licensed Seats */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Protected Seats
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {stats.totalSeats.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Licensed Mailbox Capacity
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {customer ? `${customer.companyName} Licenses & Validity Tracker` : 'Enterprise License Expiry Tracking Matrix'}
              </h3>
              <p className="text-xs text-slate-500">
                Live monitoring of contractual validity, grace periods, and renewal schedules (Alert window: {warningThreshold} days)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search licenses, keys, orgs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 w-48 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 font-medium transition-colors ${statusFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All ({licenseRows.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expiring')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 ${statusFilter === 'expiring' ? 'bg-amber-600 text-white font-bold' : 'text-amber-700 hover:bg-amber-50'}`}
              >
                Expiring ({stats.expiring})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 ${statusFilter === 'active' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Active ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 ${statusFilter === 'expired' ? 'bg-rose-600 text-white font-bold' : 'text-rose-700 hover:bg-rose-50'}`}
              >
                Expired ({stats.expired})
              </button>
            </div>

            {onOpenUploadLicense && canEdit && (
              <button
                type="button"
                onClick={onOpenUploadLicense}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Upload License</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No licenses matching criteria</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter tags.'
                : 'Upload an enterprise agreement or enable automatic license generation in Customization.'}
            </p>
            {onOpenUploadLicense && canEdit && (
              <button
                type="button"
                onClick={onOpenUploadLicense}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500"
              >
                Upload First License Document
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  {!customer && <th className="py-3 px-4">Organization</th>}
                  <th className="py-3 px-4">License Certificate</th>
                  <th className="py-3 px-4">Tier & Seats</th>
                  <th className="py-3 px-4">Validity Window</th>
                  <th className="py-3 px-4">Days to Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRows.map(({ license, cust }) => {
                  const daysRemaining = getDaysUntilExpiry(license.expiryDate);
                  const isExpired = daysRemaining < 0;
                  const isExpiring = daysRemaining >= 0 && daysRemaining <= warningThreshold;

                  return (
                    <tr
                      key={license.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpired
                          ? 'bg-rose-50/20'
                          : isExpiring
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* Organization (if global view) */}
                      {!customer && (
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{cust.companyName}</p>
                          <p className="text-[11px] text-slate-500">
                            {cust.customerContact || 'Primary Contact'}
                            {cust.cisoName && ` • CISO: ${cust.cisoName}`}
                          </p>
                        </td>
                      )}

                      {/* License Name & Key */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">{license.name}</p>
                          {license.isAutoGenerated && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                              Auto-Provisioned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {license.licenseKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(license.licenseKey)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy License Key"
                          >
                            {copiedKey === license.licenseKey ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Plan & Seats */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{license.planTier}</span>
                        <p className="text-[11px] text-slate-500">
                          {license.targetSeats.toLocaleString()} Licensed Seats
                        </p>
                      </td>

                      {/* Validity Window */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-800 font-medium">
                          {formatDisplayDate(license.issueDate)}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-600">
                          until <strong className="text-slate-900">{formatDisplayDate(license.expiryDate)}</strong>
                        </p>
                      </td>

                      {/* Days Countdown Meter */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Expired {Math.abs(daysRemaining)}d ago</span>
                          </div>
                        ) : isExpiring ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>{daysRemaining} days left</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{daysRemaining} days remaining</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isExpired ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white">
                            EXPIRED
                          </span>
                        ) : isExpiring ? (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-white">
                            EXPIRING SOON
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCertificate(license, cust)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View Official Certificate"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRenewal(license, cust.id)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                title="Extend License Validity"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>Extend</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(cust.id, license.id, license.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete License"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* Certificate Viewer Modal */}
      <DigitalLicenseCertificateModal
        isOpen={certificateModal.isOpen}
        onClose={() => setCertificateModal({ isOpen: false, license: null, customer: null })}
        license={certificateModal.license}
        customer={certificateModal.customer}
      />

      {/* Renewal / Extension Modal */}
      {renewalModal.isOpen && renewalModal.license && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold">Extend License Validity</h4>
              </div>
              <button
                type="button"
                onClick={() => setRenewalModal({ isOpen: false, license: null, customerId: '', durationMonths: 12 })}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  Target License
                </p>
                <p className="text-sm font-bold text-slate-900">{renewalModal.license.name}</p>
                <code className="text-slate-500 font-mono text-[11px]">{renewalModal.license.licenseKey}</code>
              </div>

              <div>
                <p className="text-slate-600 mb-1">
                  Current Expiry Date:{' '}
                  <strong className="text-slate-800">
                    {formatDisplayDate(renewalModal.license.expiryDate)}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Extension Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenewalModal((prev) => ({ ...prev, durationMonths: m }))}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        renewalModal.durationMonths === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      +{m} Months
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-900">
                <p className="font-semibold">Calculated New Expiry Date:</p>
                <p className="text-sm font-bold mt-0.5">
                  {(() => {
                    const d = new Date(renewalModal.license.expiryDate || new Date());
                    d.setMonth(d.getMonth() + renewalModal.durationMonths);
                    return formatDisplayDate(d.toISOString().split('T')[0]);
                  })()}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenewalModal({ isOpen: false, license: null, customerId: '', durationMonths: 12 })}
                className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Confirm Extension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
