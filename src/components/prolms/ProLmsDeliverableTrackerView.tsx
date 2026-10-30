import React, { useState, useMemo } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  PlannedDeliverableRequirement,
  ActualDeliveryRecord,
  DeliverableCategory,
  DeliverableTrackingFrequency,
  DeliverablePeriodStatus,
  Customer,
} from '../../types';
import {
  DELIVERABLE_CATEGORIES,
  DELIVERABLE_FREQUENCIES,
  generateReportingPeriods,
  calculateDeliverablePeriodProgress,
  getDeliverableStatusBadge,
  exportDeliverablesReport,
  downloadRequirementTemplate,
  downloadDeliveryTemplate,
} from '../../utils/deliverableTrackerHelper';
import { formatDisplayDate } from '../../utils/drillCalculator';
import { AddEditDeliverableRequirementModal } from '../modals/AddEditDeliverableRequirementModal';
import { RecordDeliveryModal } from '../modals/RecordDeliveryModal';
import { DeliverableHistoryModal } from '../modals/DeliverableHistoryModal';
import { BulkImportDeliverablesModal } from '../modals/BulkImportDeliverablesModal';
import {
  GraduationCap,
  Layers,
  PlusCircle,
  FileCheck2,
  Upload,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Building2,
  User,
  History,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';

export const ProLmsDeliverableTrackerView: React.FC = () => {
  const {
    customers,
    users,
    referenceDate,
    currentUser,
    allPlannedDeliverables,
    allActualDeliveries,
    deletePlannedDeliverable,
    deleteActualDelivery,
  } = useCustomerContext();

  // Active View Tab
  const [activeSubTab, setActiveSubTab] = useState<'requirements' | 'deliveries' | 'summaries'>('requirements');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [csmFilter, setCsmFilter] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Modals State
  const [reqModalState, setReqModalState] = useState<{
    isOpen: boolean;
    requirement: PlannedDeliverableRequirement | null;
    defaultCustomerId?: string;
  }>({
    isOpen: false,
    requirement: null,
  });

  const [deliveryModalState, setDeliveryModalState] = useState<{
    isOpen: boolean;
    delivery: ActualDeliveryRecord | null;
    defaultRequirement?: PlannedDeliverableRequirement | null;
    defaultCustomerId?: string;
  }>({
    isOpen: false,
    delivery: null,
  });

  const [historyModalState, setHistoryModalState] = useState<{
    isOpen: boolean;
    requirement?: PlannedDeliverableRequirement | null;
    customer?: Customer | null;
  }>({
    isOpen: false,
  });

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // ProLMS customer accounts
  const prolmsCustomers = useMemo(() => {
    return customers.filter((c) => c.products?.proLms || c.licenses?.length);
  }, [customers]);

  // Available periods for the selected year across selected frequency (or Quarterly by default)
  const availablePeriods = useMemo(() => {
    const freq = frequencyFilter !== 'ALL' ? (frequencyFilter as DeliverableTrackingFrequency) : 'Quarterly';
    return generateReportingPeriods(freq, selectedYear);
  }, [frequencyFilter, selectedYear]);

  // Compute metrics and progress for each planned requirement across the chosen period/year
  const requirementsWithCalculations = useMemo(() => {
    return allPlannedDeliverables.map((req) => {
      // Find periods applicable for this requirement
      const periods = generateReportingPeriods(req.frequency, selectedYear);
      // Determine target period to evaluate
      let targetPeriod = periods[0];
      if (periodFilter !== 'ALL') {
        const found = periods.find((p) => p.key === periodFilter);
        if (found) targetPeriod = found;
      } else {
        // Find current active period based on referenceDate
        const active = periods.find((p) => referenceDate >= p.startDate && referenceDate <= p.endDate);
        if (active) targetPeriod = active;
      }

      const calculation = calculateDeliverablePeriodProgress(
        req,
        allActualDeliveries,
        targetPeriod,
        referenceDate
      );

      return {
        requirement: req,
        calculation,
        targetPeriod,
      };
    });
  }, [allPlannedDeliverables, allActualDeliveries, selectedYear, periodFilter, referenceDate]);

  // Filtered Requirements
  const filteredRequirements = useMemo(() => {
    return requirementsWithCalculations.filter(({ requirement: req, calculation, targetPeriod }) => {
      if (clientFilter !== 'ALL' && req.customerId !== clientFilter) return false;
      if (categoryFilter !== 'ALL' && req.category !== categoryFilter) return false;
      if (frequencyFilter !== 'ALL' && req.frequency !== frequencyFilter) return false;
      if (statusFilter !== 'ALL' && calculation.status !== statusFilter) return false;
      if (csmFilter !== 'ALL' && req.csmName !== csmFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = req.title.toLowerCase().includes(term);
        const matchClient = (req.customerName || '').toLowerCase().includes(term);
        const matchNotes = (req.notes || '').toLowerCase().includes(term);
        const matchCategory = req.category.toLowerCase().includes(term);
        if (!matchTitle && !matchClient && !matchNotes && !matchCategory) return false;
      }

      return true;
    });
  }, [requirementsWithCalculations, clientFilter, categoryFilter, frequencyFilter, statusFilter, csmFilter, searchTerm]);

  // Filtered Deliveries (Actual deliveries log)
  const filteredDeliveries = useMemo(() => {
    return allActualDeliveries.filter((del) => {
      if (clientFilter !== 'ALL' && del.customerId !== clientFilter) return false;
      if (categoryFilter !== 'ALL' && del.category !== categoryFilter) return false;
      if (frequencyFilter !== 'ALL' && del.frequency !== frequencyFilter) return false;
      if (csmFilter !== 'ALL' && del.csmName !== csmFilter) return false;
      if (periodFilter !== 'ALL' && del.reportingPeriodKey !== periodFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchFile = del.fileName.toLowerCase().includes(term);
        const matchTitle = del.title.toLowerCase().includes(term);
        const matchClient = (del.customerName || '').toLowerCase().includes(term);
        const matchRemarks = (del.remarks || '').toLowerCase().includes(term);
        if (!matchFile && !matchTitle && !matchClient && !matchRemarks) return false;
      }

      return true;
    });
  }, [allActualDeliveries, clientFilter, categoryFilter, frequencyFilter, csmFilter, periodFilter, searchTerm]);

  // Summary Metrics (Section 6)
  const summaryMetrics = useMemo(() => {
    let totalPlanned = 0;
    let totalDelivered = 0;
    let totalPending = 0;
    let overdueCount = 0;
    let completedCount = 0;

    requirementsWithCalculations.forEach(({ calculation }) => {
      totalPlanned += calculation.plannedQuantity;
      totalDelivered += calculation.deliveredQuantity;
      totalPending += calculation.pendingQuantity;
      if (calculation.status === 'Overdue') overdueCount++;
      if (calculation.status === 'Completed') completedCount++;
    });

    const completionPct =
      totalPlanned > 0
        ? Math.min(100, Math.round((totalDelivered / totalPlanned) * 100))
        : totalDelivered > 0
        ? 100
        : 0;

    return {
      totalPlanned,
      totalDelivered,
      totalPending,
      overdueCount,
      completedCount,
      completionPct,
    };
  }, [requirementsWithCalculations]);

  // Export handlers
  const handleExport = (format: 'xlsx' | 'csv') => {
    const exportRows = filteredRequirements.map(({ requirement: req, calculation, targetPeriod }) => {
      const lastDelivery = calculation.matchingDeliveries[0];
      return {
        client: req.customerName || 'Client',
        licenseKey: req.licenseKey || 'Active',
        category: req.category,
        title: req.title,
        frequency: req.frequency,
        reportingPeriod: targetPeriod.label,
        plannedQty: calculation.plannedQuantity,
        deliveredQty: calculation.deliveredQuantity,
        pendingQty: calculation.pendingQuantity,
        completionPct: `${calculation.completionPercentage}%`,
        status: calculation.status,
        fileName: lastDelivery?.fileName,
        fileFormat: lastDelivery?.fileFormat,
        deliveryMode: lastDelivery?.deliveryMode,
        dateShared: lastDelivery?.dateShared,
        csm: req.csmName || 'CSM',
        notes: req.notes,
      };
    });

    exportDeliverablesReport(exportRows, format, `ProLMS_Deliverables_${selectedYear}`);
  };

  const handleDeleteRequirement = (reqId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete requirement "${title}"?`)) {
      deletePlannedDeliverable(reqId);
    }
  };

  const handleDeleteDelivery = (delId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete delivery "${fileName}"?`)) {
      deleteActualDelivery(delId);
    }
  };

  return (
    <div className="space-y-6 pb-16" id="prolms-deliverable-tracker-root">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="text-indigo-600 font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              ProLMS Intelligence
            </span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Deliverable Tracker</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ProLMS Client Deliverable Tracker
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              License-Integrated Cadence
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track, manage, and verify client deliverables (Infographics, Posters, Wallpapers, Videos, SCORM, Games) across Monthly, Quarterly, Half-Yearly, and Yearly periods.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setReqModalState({ isOpen: true, requirement: null })}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Requirement</span>
          </button>

          <button
            type="button"
            onClick={() => setDeliveryModalState({ isOpen: true, delivery: null })}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>+ Record Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Bulk import requirements or actual deliveries via Excel/CSV"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bulk Import</span>
          </button>

          <div className="flex items-center rounded-xl border border-slate-300 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="px-3 py-2 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1"
              title="Export report to Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export (.xlsx)</span>
            </button>
            <span className="w-px h-5 bg-slate-200" />
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="px-2.5 py-2 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              title="Export report to CSV"
            >
              .csv
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Summary Cards (Section 6 Requirements) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Planned */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Planned</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {summaryMetrics.totalPlanned}
          </div>
          <p className="text-[10px] text-slate-500">Contracted target across active licenses</p>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {summaryMetrics.totalDelivered}
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold">
            {summaryMetrics.completedCount} requirements 100% fulfilled
          </p>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Pending Delivery</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">
            {summaryMetrics.totalPending}
          </div>
          <p className="text-[10px] text-amber-800">Remaining to be shared with clients</p>
        </div>

        {/* Card 4: Overdue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Overdue Deliverables</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 tracking-tight">
            {summaryMetrics.overdueCount}
          </div>
          <p className="text-[10px] text-rose-700 font-semibold">Past period deadline</p>
        </div>

        {/* Card 5: Overall Completion % */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider">
            <span>Overall Completion</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tight">
              {summaryMetrics.completionPct}%
            </span>
            <span className="text-[11px] text-slate-500">of contracted</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${summaryMetrics.completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Filter Bar (Section 6) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filters & Search</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 font-bold"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, client, file name..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Clients ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Deliverable Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Categories ({DELIVERABLE_CATEGORIES.length})</option>
              {DELIVERABLE_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency Filter */}
          <div>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Frequencies</option>
              {DELIVERABLE_FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Overdue">Overdue</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('requirements')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'requirements'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Planned Requirements & Progress ({filteredRequirements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('deliveries')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'deliveries'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Actual Deliveries Audit Log ({filteredDeliveries.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('summaries')}
          className={`py-2.5 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
            activeSubTab === 'summaries'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Client & Period Summaries</span>
        </button>
      </div>

      {/* SUB-TAB 1: PLANNED REQUIREMENTS & CADENCE MATRIX */}
      {activeSubTab === 'requirements' && (
        <div className="space-y-4">
          {filteredRequirements.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No deliverable requirements match your filters</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Define client requirements to track infographics, posters, wallpapers, videos, SCORM packages, or games against active licenses.
              </p>
              <button
                type="button"
                onClick={() => setReqModalState({ isOpen: true, requirement: null })}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create New Requirement</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-4">Client & License</th>
                      <th className="py-3.5 px-4">Category & Requirement Title</th>
                      <th className="py-3.5 px-4">Frequency & Reporting Period</th>
                      <th className="py-3.5 px-4 text-center">Target Qty</th>
                      <th className="py-3.5 px-4 text-center">Delivered</th>
                      <th className="py-3.5 px-4 text-center">Pending</th>
                      <th className="py-3.5 px-4">Completion %</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">CSM Owner</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRequirements.map(({ requirement: req, calculation, targetPeriod }) => {
                      const statusBadge = getDeliverableStatusBadge(calculation.status);
                      const catInfo = DELIVERABLE_CATEGORIES.find((c) => c.key === req.category);

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Client & License */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{req.customerName || 'Client'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {req.licenseKey || 'Active License'}
                            </div>
                          </td>

                          {/* Category & Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo?.badgeBg || 'bg-slate-50'} ${catInfo?.badgeText || 'text-slate-700'} ${catInfo?.borderColor || 'border-slate-200'}`}
                              >
                                {req.category}
                              </span>
                              {req.customCategoryName && (
                                <span className="text-[10px] text-slate-400">({req.customCategoryName})</span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-800 mt-1 leading-snug">
                              {req.title}
                            </div>
                            {req.notes && (
                              <div className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5" title={req.notes}>
                                {req.notes}
                              </div>
                            )}
                          </td>

                          {/* Frequency & Period */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {req.frequency}
                            </span>
                            <div className="text-[11px] font-bold text-indigo-700 mt-1">
                              {targetPeriod.label}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {targetPeriod.startDate} – {targetPeriod.endDate}
                            </div>
                          </td>

                          {/* Target Qty */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-800 text-sm">
                            {calculation.plannedQuantity}
                          </td>

                          {/* Delivered Qty */}
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-600 text-sm">
                            {calculation.deliveredQuantity}
                          </td>

                          {/* Pending Qty */}
                          <td className="py-3.5 px-4 text-center font-bold text-amber-600 text-sm">
                            {calculation.pendingQuantity}
                          </td>

                          {/* Completion Progress Bar */}
                          <td className="py-3.5 px-4 min-w-[120px]">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span className="text-slate-700">{calculation.completionPercentage}%</span>
                              <span className="text-[10px] text-slate-400">
                                {calculation.deliveredQuantity}/{calculation.plannedQuantity}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  calculation.completionPercentage >= 100
                                    ? 'bg-emerald-500'
                                    : calculation.completionPercentage > 0
                                    ? 'bg-blue-600'
                                    : 'bg-slate-300'
                                }`}
                                style={{ width: `${calculation.completionPercentage}%` }}
                              />
                            </div>
                            {calculation.lastDeliveryDate && (
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                <span>Last: {formatDisplayDate(calculation.lastDeliveryDate)}</span>
                              </div>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>

                          {/* CSM Owner */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{req.csmName || 'CSM'}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Record Delivery Quick Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setDeliveryModalState({
                                    isOpen: true,
                                    delivery: null,
                                    defaultRequirement: req,
                                    defaultCustomerId: req.customerId,
                                  })
                                }
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-bold text-[11px] border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                                title="Log a delivery against this requirement"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>Record</span>
                              </button>

                              {/* View History Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setHistoryModalState({
                                    isOpen: true,
                                    requirement: req,
                                  })
                                }
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="View delivery history"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Requirement Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setReqModalState({
                                    isOpen: true,
                                    requirement: req,
                                  })
                                }
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit requirement settings"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Requirement Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRequirement(req.id, req.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete requirement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ACTUAL DELIVERIES AUDIT LOG */}
      {activeSubTab === 'deliveries' && (
        <div className="space-y-4">
          {filteredDeliveries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No delivery records found</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No actual deliverables have been shared matching your search and filter criteria.
              </p>
              <button
                type="button"
                onClick={() => setDeliveryModalState({ isOpen: true, delivery: null })}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Record New Delivery</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="py-3.5 px-4">Client & License</th>
                      <th className="py-3.5 px-4">Deliverable Title & Category</th>
                      <th className="py-3.5 px-4">Actual File Name & Format</th>
                      <th className="py-3.5 px-4">Delivery Mode</th>
                      <th className="py-3.5 px-4">Reporting Period</th>
                      <th className="py-3.5 px-4">Date Shared</th>
                      <th className="py-3.5 px-4">CSM Owner</th>
                      <th className="py-3.5 px-4">Asset Link / Remarks</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDeliveries.map((del) => (
                      <tr key={del.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Client & License */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{del.customerName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            {del.licenseKey}
                          </div>
                        </td>

                        {/* Title & Category */}
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {del.category}
                          </span>
                          <div className="font-semibold text-slate-800 mt-1 leading-snug">
                            {del.title}
                          </div>
                        </td>

                        {/* File Name & Format */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{del.fileName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Format: <strong className="uppercase text-slate-700">{del.fileFormat}</strong>
                          </div>
                        </td>

                        {/* Delivery Mode */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Send className="w-3.5 h-3.5 text-blue-600" />
                            <span>{del.deliveryMode}</span>
                          </div>
                        </td>

                        {/* Reporting Period */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {del.reportingPeriodLabel || del.reportingPeriodKey}
                          </span>
                        </td>

                        {/* Date Shared */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                          {formatDisplayDate(del.dateShared)}
                        </td>

                        {/* CSM Owner */}
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {del.csmName || 'CSM'}
                        </td>

                        {/* Reference Link & Remarks */}
                        <td className="py-3.5 px-4 max-w-[160px]">
                          {del.referenceUrl ? (
                            <a
                              href={del.referenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 truncate text-[11px]"
                              title={del.referenceUrl}
                            >
                              <span>View File</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {del.remarks && (
                            <div className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5" title={del.remarks}>
                              &quot;{del.remarks}&quot;
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setDeliveryModalState({ isOpen: true, delivery: del })}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit delivery details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDelivery(del.id, del.fileName)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete delivery record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: CLIENT & PERIOD SUMMARIES */}
      {activeSubTab === 'summaries' && (
        <div className="space-y-6">
          {/* Client-wise compliance cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Client-Level Deliverable Fulfillment</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((cust) => {
                const custReqs = requirementsWithCalculations.filter((r) => r.requirement.customerId === cust.id);
                if (custReqs.length === 0) return null;

                const custPlanned = custReqs.reduce((sum, r) => sum + r.calculation.plannedQuantity, 0);
                const custDelivered = custReqs.reduce((sum, r) => sum + r.calculation.deliveredQuantity, 0);
                const custPending = custReqs.reduce((sum, r) => sum + r.calculation.pendingQuantity, 0);
                const custOverdue = custReqs.filter((r) => r.calculation.status === 'Overdue').length;
                const custPct =
                  custPlanned > 0
                    ? Math.min(100, Math.round((custDelivered / custPlanned) * 100))
                    : 100;

                return (
                  <div
                    key={cust.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Client Account
                        </span>
                        {custOverdue > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {custOverdue} Overdue
                          </span>
                        ) : custPct >= 100 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            100% On Schedule
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            In Progress
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900 tracking-tight">{cust.companyName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        CSM: <strong className="text-slate-700">{cust.csmName || 'Assigned CSM'}</strong> •{' '}
                        {custReqs.length} Contracted Requirements
                      </p>

                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Fulfillment Progress:</span>
                          <span className="text-blue-600">{custPct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              custPct >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${custPct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-bold">Planned</span>
                            <span className="font-black text-slate-800">{custPlanned}</span>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-emerald-600 block font-bold">Delivered</span>
                            <span className="font-black text-emerald-700">{custDelivered}</span>
                          </div>
                          <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                            <span className="text-[10px] text-amber-600 block font-bold">Pending</span>
                            <span className="font-black text-amber-700">{custPending}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setHistoryModalState({
                            isOpen: true,
                            customer: cust,
                          })
                        }
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>View Shared Assets</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryModalState({
                            isOpen: true,
                            delivery: null,
                            defaultCustomerId: cust.id,
                          })
                        }
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Record
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddEditDeliverableRequirementModal
        isOpen={reqModalState.isOpen}
        onClose={() => setReqModalState({ isOpen: false, requirement: null })}
        requirement={reqModalState.requirement}
        defaultCustomerId={reqModalState.defaultCustomerId}
      />

      <RecordDeliveryModal
        isOpen={deliveryModalState.isOpen}
        onClose={() => setDeliveryModalState({ isOpen: false, delivery: null })}
        delivery={deliveryModalState.delivery}
        defaultRequirement={deliveryModalState.defaultRequirement}
        defaultCustomerId={deliveryModalState.defaultCustomerId}
      />

      <DeliverableHistoryModal
        isOpen={historyModalState.isOpen}
        onClose={() => setHistoryModalState({ isOpen: false })}
        requirement={historyModalState.requirement}
        customer={historyModalState.customer}
        onOpenRecordDelivery={(req) =>
          setDeliveryModalState({
            isOpen: true,
            delivery: null,
            defaultRequirement: req,
            defaultCustomerId: req?.customerId,
          })
        }
      />

      <BulkImportDeliverablesModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </div>
  );
};
