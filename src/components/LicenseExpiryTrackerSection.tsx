import React, { useState, useMemo } from 'react';
import { Customer, CustomerLicenseFile, GamificationGameDeliverable, LmsDeliverable, DrillRecord } from '../types';
import { useCustomerContext } from '../context/CustomerContext';
import { formatDisplayDate } from '../utils/drillCalculator';
import { getDaysUntilExpiry, calculateLicenseStatus } from '../utils/customizationDefaults';
import { DigitalLicenseCertificateModal } from './common/DigitalLicenseCertificateModal';
import { ExcelLicenseViewerModal } from './common/ExcelLicenseViewerModal';
import { InteractiveGamePlayerModal } from './common/InteractiveGamePlayerModal';
import { ScheduleLicenseDrillModal } from './modals/ScheduleLicenseDrillModal';
import { DEFAULT_GAMIFICATION_GAMES, downloadExcelLicenseFile, createDefaultCustomerLicenseExcel } from '../utils/excelLicenseHelper';
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
  FileSpreadsheet,
  Download,
  PhoneCall,
  MessageSquare,
  Gamepad2,
  Play,
  Sparkles,
  Layers,
  Award,
  CheckCircle2,
  ExternalLink,
  Flame,
  ArrowRight,
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
    updateCustomer,
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

  const [excelViewerModal, setExcelViewerModal] = useState<{
    isOpen: boolean;
    license: CustomerLicenseFile | null;
    customer: Customer | null;
  }>({
    isOpen: false,
    license: null,
    customer: null,
  });

  const [scheduleDrillModal, setScheduleDrillModal] = useState<{
    isOpen: boolean;
    drillType: 'Vishing' | 'Smishing';
  }>({
    isOpen: false,
    drillType: 'Vishing',
  });

  const [gamePlayerModal, setGamePlayerModal] = useState<{
    isOpen: boolean;
    game: GamificationGameDeliverable | null;
  }>({
    isOpen: false,
    game: null,
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

  // Primary active license for single customer view
  const primaryLicense = useMemo(() => {
    if (!customer) return null;
    if (customer.licenses && customer.licenses.length > 0) {
      return customer.licenses[0];
    }
    return null;
  }, [customer]);

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

  // Customer Drills Breakdown (Phishing, Vishing, Smishing)
  const drillsMetrics = useMemo(() => {
    if (!customer) return null;
    const year = customer.currentYear || 2026;
    const currentDrills: DrillRecord[] = customer.annualPlans?.[year]?.drills || [];

    const phishingDrills = currentDrills.filter(
      (d) =>
        d.drillType === 'Phishing Email Simulation' ||
        d.drillType === 'Spear Phishing / Executive' ||
        d.drillType === 'Credential Harvesting' ||
        d.drillType === 'Ransomware Awareness'
    );
    const vishingDrills = currentDrills.filter(
      (d) =>
        d.drillType === 'Vishing (Voice Phishing)' ||
        d.drillType === 'Social Engineering Call'
    );
    const smishingDrills = currentDrills.filter((d) => d.drillType === 'Smishing (SMS)');

    const phishingCompleted = phishingDrills.filter((d) => d.status === 'Completed' || d.status === 'Completed Late').length;
    const vishingCompleted = vishingDrills.filter((d) => d.status === 'Completed' || d.status === 'Completed Late').length;
    const smishingCompleted = smishingDrills.filter((d) => d.status === 'Completed' || d.status === 'Completed Late').length;

    const phishingQuota = primaryLicense?.phishingQuota || 4;
    const vishingQuota = primaryLicense?.vishingQuota || 2;
    const smishingQuota = primaryLicense?.smishingQuota || 4;
    const gamificationQuota = primaryLicense?.gamificationQuota || 6;

    const deliverables = customer.annualPlans?.[year]?.deliverables || [];
    const gamificationDeliverables = deliverables.filter((del) =>
      del.title.toLowerCase().includes('gamif') ||
      del.title.toLowerCase().includes('escape') ||
      del.title.toLowerCase().includes('arena') ||
      del.title.toLowerCase().includes('trivia')
    );

    return {
      phishing: {
        quota: phishingQuota,
        totalScheduled: phishingDrills.length,
        completed: phishingCompleted,
        remaining: Math.max(0, phishingQuota - phishingCompleted),
      },
      vishing: {
        quota: vishingQuota,
        totalScheduled: vishingDrills.length,
        completed: vishingCompleted,
        remaining: Math.max(0, vishingQuota - vishingCompleted),
      },
      smishing: {
        quota: smishingQuota,
        totalScheduled: smishingDrills.length,
        completed: smishingCompleted,
        remaining: Math.max(0, smishingQuota - smishingCompleted),
      },
      gamification: {
        quota: gamificationQuota,
        assignedCount: gamificationDeliverables.length,
        completedCount: gamificationDeliverables.filter((d) => d.status === 'Completed').length,
        remaining: Math.max(0, gamificationQuota - gamificationDeliverables.filter((d) => d.status === 'Completed').length),
      },
    };
  }, [customer, primaryLicense]);

  // Gamification Games Catalog for Customer
  const gamificationGamesList = useMemo(() => {
    return customer?.gamificationGames || DEFAULT_GAMIFICATION_GAMES;
  }, [customer]);

  // Filtered Rows for Global/Customer Table
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

  const handleOpenExcelPreview = (license: CustomerLicenseFile, cust: Customer) => {
    setExcelViewerModal({
      isOpen: true,
      license,
      customer: cust,
    });
  };

  const handleDownloadLicenseFile = (license: CustomerLicenseFile, cust: Customer) => {
    if (license.excelData?.sheets && license.excelData.sheets.length > 0) {
      downloadExcelLicenseFile(license.excelData.sheets, license.fileName || `${cust.companyName}_License.xlsx`);
    } else {
      const generated = createDefaultCustomerLicenseExcel(
        cust.companyName,
        license.licenseKey,
        license.targetSeats || 1250,
        license.expiryDate
      );
      downloadExcelLicenseFile(generated.parsedData.sheets, generated.fileName);
    }
  };

  const handleAssignGameToCustomer = (game: GamificationGameDeliverable) => {
    if (!customer) return;
    const year = customer.currentYear || 2026;
    const currentPlan = customer.annualPlans?.[year] || {
      year,
      annualRequirement: 4,
      startDate: customer.startDate || '2026-01-01',
      intervalMonths: 3,
      drills: [],
      deliverables: [],
    };

    const newDeliverable: LmsDeliverable = {
      id: `deliv-game-${Date.now()}`,
      title: `Gamification: ${game.title}`,
      frequency: 'quarterly',
      plannedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Upcoming',
      targetAudience: game.targetAudience,
      notes: `Contracted gamification deliverable assigned from license quota (${game.durationMinutes} min ${game.category}, Badge: ${game.badgeAwarded || 'Cyber Star'}).`,
    };

    const updatedDeliverables = [...(currentPlan.deliverables || []), newDeliverable];
    const updatedPlans = {
      ...customer.annualPlans,
      [year]: {
        ...currentPlan,
        deliverables: updatedDeliverables,
      },
    };

    updateCustomer(customer.id, {
      annualPlans: updatedPlans,
    });

    alert(`Successfully assigned "${game.title}" as an active deliverable for ${customer.companyName}!`);
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
    <div className="space-y-6" id="license-expiry-tracker-root">
      {/* If viewing a single customer: Active Excel License File Hub & Quick Preview Bar */}
      {customer && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active License File
                  </span>
                  <span className="text-xs font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                    {primaryLicense?.licenseKey || 'LIC-2026-ACTIVE'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {primaryLicense?.name || `${customer.companyName} Enterprise Security License`}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                  <span>Spreadsheet: <strong className="text-white font-mono">{primaryLicense?.fileName || 'License_Entitlements.xlsx'}</strong></span>
                  <span>•</span>
                  <span>Seats: <strong className="text-emerald-400 font-bold">{primaryLicense?.targetSeats?.toLocaleString() || '1,250'} Mailboxes</strong></span>
                  <span>•</span>
                  <span>Valid until: <strong className="text-white">{formatDisplayDate(primaryLicense?.expiryDate || '2026-12-31')}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {primaryLicense && (
                <button
                  type="button"
                  id="btn-preview-customer-license"
                  onClick={() => handleOpenExcelPreview(primaryLicense, customer)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  title="Open interactive preview of customer's Excel license file"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Preview License File (Excel)</span>
                </button>
              )}

              {primaryLicense && (
                <button
                  type="button"
                  onClick={() => handleDownloadLicenseFile(primaryLicense, customer)}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Download raw Excel license (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.xlsx</span>
                </button>
              )}

              {primaryLicense && (
                <button
                  type="button"
                  onClick={() => handleOpenCertificate(primaryLicense, customer)}
                  className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View Official Certificate"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Certificate</span>
                </button>
              )}

              {onOpenUploadLicense && canEdit && (
                <button
                  type="button"
                  onClick={onOpenUploadLicense}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload Excel License</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contracted Simulation Drills & Interactive Gamification Deliverables Hub (Requested: Vishing, Smishing, Gamification) */}
      {customer && drillsMetrics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Simulation Drills & Interactive Gamification Deliverables
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contracted license quotas for Voice Phishing (Vishing), SMS Phishing (Smishing), Email Simulations, and Gamification Deliverables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                Year {customer.currentYear || 2026} Contract Quotas
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* 4 Entitlement Vector Tiles (Phishing, Vishing, Smishing, Gamification) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tile 1: Vishing (Voice Phishing Simulation) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" />
                      Voice Calls
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {drillsMetrics.vishing.completed} / {drillsMetrics.vishing.quota} Done
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Vishing (Voice Phishing) Drills</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Live caller & AI voice cloning scenarios targeting finance wire fraud and IT helpdesk OTP harvesting.
                  </p>

                  <div className="mt-3 bg-white p-2.5 rounded-lg border border-emerald-100 text-xs">
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Quota Balance:</span>
                      <strong className="text-emerald-900 font-bold">{drillsMetrics.vishing.remaining} Remaining</strong>
                    </div>
                    <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (drillsMetrics.vishing.completed / (drillsMetrics.vishing.quota || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setScheduleDrillModal({ isOpen: true, drillType: 'Vishing' })}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>+ Schedule Vishing Drill</span>
                  </button>
                )}
              </div>

              {/* Tile 2: Smishing (SMS Phishing Simulation) */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/20 hover:border-purple-300 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Mobile SMS
                    </span>
                    <span className="text-xs font-bold text-purple-700">
                      {drillsMetrics.smishing.completed} / {drillsMetrics.smishing.quota} Done
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Smishing (SMS Phishing) Drills</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    SMS lures testing mobile awareness: urgent M365 token reset alerts, delivery notices, and SSO portals.
                  </p>

                  <div className="mt-3 bg-white p-2.5 rounded-lg border border-purple-100 text-xs">
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Quota Balance:</span>
                      <strong className="text-purple-900 font-bold">{drillsMetrics.smishing.remaining} Remaining</strong>
                    </div>
                    <div className="w-full bg-purple-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (drillsMetrics.smishing.completed / (drillsMetrics.smishing.quota || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setScheduleDrillModal({ isOpen: true, drillType: 'Smishing' })}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>+ Schedule Smishing Drill</span>
                  </button>
                )}
              </div>

              {/* Tile 3: Email Phishing Simulations */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 hover:border-blue-300 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Email Vectors
                    </span>
                    <span className="text-xs font-bold text-blue-700">
                      {drillsMetrics.phishing.completed} / {drillsMetrics.phishing.quota} Done
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Email Phishing Simulations</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Quarterly enterprise phishing campaigns with look-alike domain infrastructure and Pro Patrol reporting plugin.
                  </p>

                  <div className="mt-3 bg-white p-2.5 rounded-lg border border-blue-100 text-xs">
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Quota Balance:</span>
                      <strong className="text-blue-900 font-bold">{drillsMetrics.phishing.remaining} Remaining</strong>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (drillsMetrics.phishing.completed / (drillsMetrics.phishing.quota || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="py-2 px-3 bg-blue-100/60 rounded-lg text-[11px] text-blue-900 font-medium flex items-center justify-between">
                  <span>Scheduled Drills:</span>
                  <strong className="font-bold">{drillsMetrics.phishing.totalScheduled} in Calendar</strong>
                </div>
              </div>

              {/* Tile 4: Gamification Games & Deliverables */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 hover:border-amber-300 transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3" />
                      Gamified LMS
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {drillsMetrics.gamification.assignedCount} / {drillsMetrics.gamification.quota} Assigned
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Gamification Deliverables</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Interactive escape rooms, audio crisis simulators, and executive trivia tournaments with digital badge accreditations.
                  </p>

                  <div className="mt-3 bg-white p-2.5 rounded-lg border border-amber-100 text-xs">
                    <div className="flex justify-between text-slate-600 mb-1">
                      <span>Games Balance:</span>
                      <strong className="text-amber-900 font-bold">{drillsMetrics.gamification.remaining} Available</strong>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (drillsMetrics.gamification.assignedCount / (drillsMetrics.gamification.quota || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="py-2 px-3 bg-amber-100/60 rounded-lg text-[11px] text-amber-900 font-medium flex items-center justify-between">
                  <span>Catalog Status:</span>
                  <strong className="font-bold">4 Ready to Play</strong>
                </div>
              </div>
            </div>

            {/* Interactive Gamification Games Deliverables Catalog */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-amber-600" />
                    <span>Interactive Gamification Deliverables Catalog</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Playable security awareness games deliverable modules contracted for this account. Click &quot;Play / Preview Game&quot; to test the gameplay simulation.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Interactive Simulator Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gamificationGamesList.map((game) => (
                  <div
                    key={game.id}
                    className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {game.category}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {game.durationMinutes}m
                        </span>
                      </div>

                      <h5 className="font-bold text-xs text-slate-900 leading-snug">{game.title}</h5>
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                        {game.description}
                      </p>

                      <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 flex items-center justify-between">
                        <span>Target: <strong className="text-slate-700">{game.targetAudience}</strong></span>
                        <span className="text-amber-700 font-bold">{game.difficulty}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGamePlayerModal({ isOpen: true, game })}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Experience playable preview of this deliverable game"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play / Preview</span>
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleAssignGameToCustomer(game)}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
                          title="Assign as Deliverable to Customer Annual Plan"
                        >
                          <PlusCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                className={`px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${statusFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All ({licenseRows.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expiring')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 cursor-pointer ${statusFilter === 'expiring' ? 'bg-amber-600 text-white font-bold' : 'text-amber-700 hover:bg-amber-50'}`}
              >
                Expiring ({stats.expiring})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Active ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className={`px-2.5 py-1.5 font-medium transition-colors border-l border-slate-200 cursor-pointer ${statusFilter === 'expired' ? 'bg-rose-600 text-white font-bold' : 'text-rose-700 hover:bg-rose-50'}`}
              >
                Expired ({stats.expired})
              </button>
            </div>

            {onOpenUploadLicense && canEdit && (
              <button
                type="button"
                onClick={onOpenUploadLicense}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 cursor-pointer"
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
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
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
                          {/* Excel Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenExcelPreview(license, cust)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                            title="Preview Excel License File & Entitlements"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden sm:inline text-[11px]">Preview Excel</span>
                          </button>

                          {/* Certificate Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCertificate(license, cust)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Official Certificate"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenRenewal(license, cust.id)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Extend License Validity"
                              >
                                <RotateCw className="w-3 h-3" />
                                <span>Extend</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(cust.id, license.id, license.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

      {/* Excel License Spreadsheet Preview Modal */}
      <ExcelLicenseViewerModal
        isOpen={excelViewerModal.isOpen}
        onClose={() => setExcelViewerModal({ isOpen: false, license: null, customer: null })}
        license={excelViewerModal.license}
        customer={excelViewerModal.customer}
      />

      {/* Interactive Playable Game Simulator Modal */}
      <InteractiveGamePlayerModal
        isOpen={gamePlayerModal.isOpen}
        onClose={() => setGamePlayerModal({ isOpen: false, game: null })}
        game={gamePlayerModal.game}
        customer={customer}
      />

      {/* Schedule Vishing / Smishing Drill Modal */}
      {customer && (
        <ScheduleLicenseDrillModal
          isOpen={scheduleDrillModal.isOpen}
          onClose={() => setScheduleDrillModal({ isOpen: false, drillType: 'Vishing' })}
          customer={customer}
          drillType={scheduleDrillModal.drillType}
        />
      )}

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
                      className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
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
                className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
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
