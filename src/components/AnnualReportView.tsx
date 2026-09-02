import React, { useState, useMemo } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  calculateCustomerCompliance,
  computeDrillStatus,
  formatDisplayDate,
  parseDate,
} from '../utils/drillCalculator';
import {
  getMonthlyProgress,
  downloadSingleCustomerMonthlyExcel,
  downloadPortfolioMonthlyExcel,
  downloadMonthlyProgressPDF,
  downloadAnnualAuditPDF,
  downloadPortfolioPDF,
  exportToExcel,
  MONTH_NAMES,
  MonthlyProgressSummary,
} from '../utils/reportExporter';
import {
  ComplianceStatusBadge,
  DrillStatusBadge,
  DrillResultBadge,
  ReviewMeetingStatusBadge,
} from './common/StatusBadges';
import {
  FileBarChart2,
  Printer,
  Shield,
  CheckCircle2,
  Building2,
  Calendar,
  Users,
  MessageSquare,
  Percent,
  Download,
  Send,
  Mail,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Sparkles,
  UserCheck,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface AnnualReportViewProps {
  initialCustomerId?: string;
  initialYear?: number;
  onSelectCustomer: (id: string) => void;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({
  initialCustomerId,
  initialYear = 2026,
  onSelectCustomer,
}) => {
  const { customers, referenceDate, dueSoonDays, currentUser } = useCustomerContext();

  // Derive initial month index from referenceDate (e.g. "2026-08-17" -> month 7 / August)
  const currentRefDate = useMemo(() => parseDate(referenceDate), [referenceDate]);
  const initialMonth = currentRefDate.getMonth(); // 0 - 11

  const [reportTab, setReportTab] = useState<'monthly' | 'annual' | 'portfolio'>('monthly');
  const [selectedCustId, setSelectedCustId] = useState<string>(
    initialCustomerId || customers[0]?.id || ''
  );
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);

  // Dispatch simulation state
  const [dispatchStatus, setDispatchStatus] = useState<{
    sending: boolean;
    sent: boolean;
    timestamp?: string;
    recipient?: string;
  }>({
    sending: false,
    sent: false,
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const customer = customers.find((c) => c.id === selectedCustId) || customers[0];

  const availableYears = useMemo(() => {
    if (!customer) return [2026, 2025];
    const years = Object.keys(customer.annualPlans).map(Number);
    if (!years.includes(2026)) years.push(2026);
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [customer]);

  // Monthly Progress Data
  const monthlySummary: MonthlyProgressSummary | null = useMemo(() => {
    if (!customer) return null;
    return getMonthlyProgress(customer, selectedYear, selectedMonth, referenceDate, dueSoonDays);
  }, [customer, selectedYear, selectedMonth, referenceDate, dueSoonDays]);

  // Annual Compliance Data
  const annualCompliance = useMemo(() => {
    if (!customer) return null;
    return calculateCustomerCompliance(customer, selectedYear, referenceDate, dueSoonDays);
  }, [customer, selectedYear, referenceDate, dueSoonDays]);

  const currentPlan = customer?.annualPlans[selectedYear] || customer?.annualPlans[availableYears[0]];
  const annualDrills = currentPlan?.drills || [];

  if (!customer) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <div className="text-sm font-semibold text-slate-800">No customer accounts available</div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    setDownloadingPdf(true);
    try {
      if (reportTab === 'monthly') {
        if (!monthlySummary) return;
        downloadMonthlyProgressPDF(monthlySummary, referenceDate);
        setDownloadSuccess(`Downloaded ${customer.companyName} ${monthlySummary.monthName} Monthly Report PDF`);
      } else if (reportTab === 'annual') {
        if (!annualCompliance) return;
        downloadAnnualAuditPDF(customer, selectedYear, annualCompliance, annualDrills, referenceDate);
        setDownloadSuccess(`Downloaded ${customer.companyName} ${selectedYear} Annual Audit Report PDF`);
      } else if (reportTab === 'portfolio') {
        downloadPortfolioPDF(customers, selectedYear, selectedMonth, referenceDate);
        setDownloadSuccess(`Downloaded Portfolio Monthly Progress Matrix PDF`);
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setDownloadingPdf(false);
      setTimeout(() => setDownloadSuccess(null), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMonthlyExcel = () => {
    if (!monthlySummary) return;
    downloadSingleCustomerMonthlyExcel(monthlySummary, referenceDate);
  };

  const handleDownloadPortfolioExcel = () => {
    downloadPortfolioMonthlyExcel(customers, selectedYear, selectedMonth, referenceDate);
  };

  const handleDownloadAnnualExcel = () => {
    if (!annualCompliance) return;
    const rows: (string | number | undefined | null)[][] = [
      ['CYBERDRILL SECURITY OPERATIONS — ANNUAL COMPLIANCE AUDIT REPORT'],
      ['Generated Date', formatDisplayDate(referenceDate)],
      ['Customer Company', customer.companyName],
      ['Fiscal Audit Year', selectedYear],
      ['Account Owner', customer.accountOwner],
      ['Assigned CSM', customer.csmName || 'Unassigned'],
      ['Customer Contact', customer.customerContact],
      ['Contact Email', customer.contactEmail || 'N/A'],
      ['Industry', customer.industry || 'Enterprise'],
      ['Overall Compliance Status', annualCompliance.overallStatus],
      ['Annual Drill Quota Target', annualCompliance.annualRequirement],
      ['Total Completed', annualCompliance.completedCount],
      ['Completed On Time', annualCompliance.completedOnTimeCount],
      ['Completed Late', annualCompliance.completedLateCount],
      ['Review Debriefs Held', annualCompliance.reviewMeetingsCompletedCount],
      ['Avg Click Rate (%)', annualCompliance.averageClickRate !== undefined ? `${annualCompliance.averageClickRate}%` : 'N/A'],
      ['Avg Reporting Rate (%)', annualCompliance.averageReportingRate !== undefined ? `${annualCompliance.averageReportingRate}%` : 'N/A'],
      [],
      ['DRILL EXECUTION LOG'],
      ['Drill #', 'Title', 'Simulation Type', 'Planned Date', 'Actual Date', 'Status', 'Click Rate', 'Reporting Rate', 'Overall Result', 'Key Findings'],
    ];

    annualDrills.forEach((d) => {
      rows.push([
        `Drill ${d.drillNumber}`,
        d.title,
        d.drillType,
        d.plannedDate,
        d.actualCompletionDate || 'N/A',
        d.status,
        d.clickRate !== undefined ? `${d.clickRate}%` : 'N/A',
        d.reportingRate !== undefined ? `${d.reportingRate}%` : 'N/A',
        d.overallResult || 'N/A',
        d.keyFindings || d.summary || 'N/A',
      ]);
    });

    const filename = `Annual_Audit_Report_${customer.companyName.replace(/\s+/g, '_')}_${selectedYear}.csv`;
    exportToExcel(filename, rows);
  };

  const handleSimulateDispatch = () => {
    if (!monthlySummary) return;
    setDispatchStatus({ sending: true, sent: false });

    setTimeout(() => {
      setDispatchStatus({
        sending: false,
        sent: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recipient: monthlySummary.csmEmail,
      });
      setTimeout(() => {
        setDispatchStatus((prev) => ({ ...prev, sent: false }));
      }, 5000);
    }, 900);
  };

  return (
    <div className="space-y-6 pb-16" id="reports-hub-root">
      {/* Header & Mode Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <FileBarChart2 className="w-4 h-4" />
            <span>Executive Reporting & CSM Dispatch</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Security Progress & Audit Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Monthly account progress digests dispatched to CSMs on the 1st of every month, paired with exportable audit reports and Excel data downloads.
          </p>
        </div>

        {/* Report Mode Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            id="tab-report-monthly"
            onClick={() => setReportTab('monthly')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              reportTab === 'monthly'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Monthly Progress</span>
          </button>
          <button
            type="button"
            id="tab-report-annual"
            onClick={() => setReportTab('annual')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              reportTab === 'annual'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Annual Audit</span>
          </button>
          <button
            type="button"
            id="tab-report-portfolio"
            onClick={() => setReportTab('portfolio')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              reportTab === 'portfolio'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Portfolio Matrix</span>
          </button>
        </div>
      </div>

      {/* Top Filter & Export Bar (Hidden in Print) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        {/* Left Selectors */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700">
          {/* Customer selector (for monthly & annual) */}
          {reportTab !== 'portfolio' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Customer:</span>
              <select
                id="select-report-customer"
                value={selectedCustId}
                onChange={(e) => setSelectedCustId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month Selector (for monthly & portfolio) */}
          {reportTab !== 'annual' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Month:</span>
              <select
                id="select-report-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName} {idx === initialMonth ? '(Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Year:</span>
            <select
              id="select-report-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Download & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Direct PDF Download Button (jsPDF generated vector PDF) */}
          <button
            type="button"
            id="btn-download-pdf"
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            title="Download formatted vector PDF document directly to disk"
          >
            {downloadingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF (.pdf)</span>
              </>
            )}
          </button>

          {/* Excel Download Button */}
          {reportTab === 'monthly' && (
            <button
              type="button"
              id="btn-download-monthly-excel"
              onClick={handleDownloadMonthlyExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              title="Download full monthly progress data to Microsoft Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.csv)</span>
            </button>
          )}

          {reportTab === 'annual' && (
            <button
              type="button"
              id="btn-download-annual-excel"
              onClick={handleDownloadAnnualExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              title="Download annual compliance audit data to Microsoft Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.csv)</span>
            </button>
          )}

          {reportTab === 'portfolio' && (
            <button
              type="button"
              id="btn-download-portfolio-excel"
              onClick={handleDownloadPortfolioExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              title="Download entire customer portfolio monthly progress matrix to Microsoft Excel / CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Portfolio Matrix (.csv)</span>
            </button>
          )}

          {/* Print Fallback */}
          <button
            type="button"
            id="btn-print-report"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs flex items-center justify-between gap-2 animate-fadeIn print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>PDF Downloaded:</strong> {downloadSuccess}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">Saved to Downloads</span>
        </div>
      )}

      {/* =========================================================================
          TAB 1: MONTHLY ACCOUNT PROGRESS REPORT (CURRENT PROGRESS & CSM DISPATCH)
          ========================================================================= */}
      {reportTab === 'monthly' && monthlySummary && (
        <div className="space-y-6">
          {/* Automated CSM Monthly Dispatch Banner (Hidden in print) */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Automated CSM Cadence Active
                </span>
                <span className="text-xs text-blue-200">
                  Dispatched on the <strong>1st of every month (00:00 UTC)</strong>
                </span>
              </div>
              <div className="text-sm font-semibold flex items-center gap-2 pt-0.5">
                <Mail className="w-4 h-4 text-blue-300" />
                <span>
                  Target Recipient: <strong className="text-white">{monthlySummary.csmName}</strong>{' '}
                  <span className="text-blue-300">({monthlySummary.csmEmail})</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-simulate-dispatch-csm"
                onClick={handleSimulateDispatch}
                disabled={dispatchStatus.sending}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                {dispatchStatus.sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Dispatching Digest...</span>
                  </>
                ) : dispatchStatus.sent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Dispatched to {monthlySummary.csmName}!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to CSM Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {dispatchStatus.sent && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs flex items-center justify-between gap-2 animate-fadeIn print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Success:</strong> Monthly progress report for{' '}
                  <strong>{monthlySummary.customer.companyName}</strong> was dispatched to{' '}
                  <strong>{monthlySummary.csmEmail}</strong> at {dispatchStatus.timestamp}.
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">1st of Month Auto-Cadence</span>
            </div>
          )}

          {/* Printable / Viewable Monthly Progress Document Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-8 print:shadow-none print:border-none print:p-0">
            {/* Document Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {monthlySummary.customer.companyName}
                  </h2>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2 mt-0.5">
                    <span>
                      {monthlySummary.monthName} {monthlySummary.year} Account Progress Report
                    </span>
                    <span>•</span>
                    <span className="text-slate-500 font-medium">CSM Operations Digest</span>
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                <div className="font-bold text-slate-900">CyberDrill Security Ops</div>
                <div>Report Ref: {monthlySummary.reportRef}</div>
                <div>Dispatched: 1st of {monthlySummary.monthName} {monthlySummary.year}</div>
              </div>
            </div>

            {/* Account & Stakeholder Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Assigned CSM
                </span>
                <span className="text-slate-900 font-bold mt-0.5 block">{monthlySummary.csmName}</span>
                <span className="text-slate-500 text-[11px]">{monthlySummary.csmEmail}</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Customer Contact
                </span>
                <span className="text-slate-900 font-bold mt-0.5 block">
                  {monthlySummary.customer.customerContact}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {monthlySummary.customer.contactEmail || 'No email on file'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Industry Sector
                </span>
                <span className="text-slate-900 font-bold mt-0.5 block">
                  {monthlySummary.customer.industry || 'Enterprise'}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Owner: {monthlySummary.customer.accountOwner}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">
                  Annual Compliance
                </span>
                <div className="mt-1">
                  <ComplianceStatusBadge status={monthlySummary.overallStatus} />
                </div>
              </div>
            </div>

            {/* Product Subscriptions Opted Status Strip */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" /> Subscribed Product Modules:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${monthlySummary.customer.products?.prophish ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  Prophish: {monthlySummary.customer.products?.prophish ? '✓ Opted In' : '✗ Not Opted'}
                </span>
                <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${monthlySummary.customer.products?.proLms ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  Pro LMS: {monthlySummary.customer.products?.proLms ? '✓ Opted In' : '✗ Not Opted'}
                </span>
                <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${monthlySummary.customer.products?.proPatrol ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                  Pro Patrol: {monthlySummary.customer.products?.proPatrol ? '✓ Opted In' : '✗ Not Opted'}
                </span>
              </div>
            </div>

            {/* Current Account Health & YTD Cadence Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Year-to-Date Simulation & Compliance Progress
                </h3>
                <span className="text-xs font-bold text-blue-600">
                  {monthlySummary.totalCompletedYtd} of {monthlySummary.annualRequirement} Drills Completed (
                  {monthlySummary.completionPercentageYtd}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/80">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    monthlySummary.completionPercentageYtd === 100
                      ? 'bg-emerald-500'
                      : monthlySummary.completionPercentageYtd >= 50
                      ? 'bg-blue-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, monthlySummary.completionPercentageYtd))}%` }}
                ></div>
              </div>

              {/* Key Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Target Quota</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {monthlySummary.annualRequirement} Drills
                  </div>
                  <div className="text-[10px] text-slate-400">{monthlySummary.year} Plan</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Completed YTD</div>
                  <div className="text-xl font-black text-emerald-600 mt-0.5">
                    {monthlySummary.totalCompletedYtd}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">
                    {monthlySummary.completionPercentageYtd}% Achieved
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Avg Click Rate YTD</div>
                  <div className="text-xl font-black text-amber-600 mt-0.5">
                    {monthlySummary.averageClickRateYtd !== undefined
                      ? `${monthlySummary.averageClickRateYtd}%`
                      : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">Employee baseline</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Avg Reporting Rate YTD</div>
                  <div className="text-xl font-black text-blue-600 mt-0.5">
                    {monthlySummary.averageReportingRateYtd !== undefined
                      ? `${monthlySummary.averageReportingRateYtd}%`
                      : '—'}
                  </div>
                  <div className="text-[10px] text-slate-400">Phish alert plugin</div>
                </div>
              </div>
            </div>

            {/* Section 1: Drills Occurring In This Month */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>1. Drills Executed or Planned in {monthlySummary.monthName} {monthlySummary.year}</span>
                <span className="text-[11px] font-normal lowercase text-slate-400">
                  ({monthlySummary.drillsThisMonth.length} in scope)
                </span>
              </h3>

              {monthlySummary.drillsThisMonth.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No simulations were scheduled or executed during {monthlySummary.monthName} {monthlySummary.year}.
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlySummary.drillsThisMonth.map((drill) => (
                    <div
                      key={drill.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                            #{drill.drillNumber}
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-900">{drill.title}</span>
                            <span className="text-xs text-slate-500 ml-2">({drill.drillType})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DrillStatusBadge status={drill.status} size="sm" />
                          {drill.overallResult && <DrillResultBadge result={drill.overallResult} />}
                        </div>
                      </div>

                      {/* Simulation Performance Ratios */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">Planned Date</span>
                          <span className="font-semibold text-slate-800">
                            {formatDisplayDate(drill.plannedDate)}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">Completion Date</span>
                          <span className="font-semibold text-slate-800">
                            {drill.actualCompletionDate ? (
                              formatDisplayDate(drill.actualCompletionDate)
                            ) : (
                              <span className="text-slate-400 italic">Pending execution</span>
                            )}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">Click / Fall-for Rate</span>
                          <span className="font-bold text-slate-900">
                            {drill.clickRate !== undefined ? `${drill.clickRate}%` : '—'}
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-[10px]">Reporting Alert Rate</span>
                          <span className="font-bold text-blue-700">
                            {drill.reportingRate !== undefined ? `${drill.reportingRate}%` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Findings & Notes */}
                      {(drill.keyFindings || drill.summary) && (
                        <div className="text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 space-y-1">
                          {drill.summary && (
                            <p className="text-slate-600">
                              <strong className="text-slate-700">Scenario Summary:</strong> {drill.summary}
                            </p>
                          )}
                          {drill.keyFindings && (
                            <p className="text-slate-600">
                              <strong className="text-slate-700">Observations:</strong> {drill.keyFindings}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Review Meetings & Debriefs for the Month */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Executive Debriefs & Review Sessions ({monthlySummary.monthName} {monthlySummary.year})
              </h3>

              {monthlySummary.reviewMeetingsThisMonth.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No review debrief meetings recorded for {monthlySummary.monthName} {monthlySummary.year}.
                </div>
              ) : (
                <div className="space-y-3">
                  {monthlySummary.reviewMeetingsThisMonth.map((meeting, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span>Drill {meeting.drillNumber} Debrief ({meeting.drillTitle})</span>
                        </div>
                        <ReviewMeetingStatusBadge status={meeting.status as any} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <strong>Date:</strong>{' '}
                          {meeting.meetingDate ? formatDisplayDate(meeting.meetingDate) : 'Not Scheduled'}
                        </div>
                        <div>
                          <strong>Attendees:</strong> {meeting.participants || 'None listed'}
                        </div>
                      </div>

                      {meeting.findings && (
                        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-amber-950">
                          <strong>Vulnerability Findings:</strong> {meeting.findings}
                        </div>
                      )}

                      {meeting.actionItems && (
                        <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-emerald-950">
                          <strong>Action Items:</strong> {meeting.actionItems}
                        </div>
                      )}

                      {meeting.nextFollowUpDate && (
                        <div className="text-[11px] text-purple-700 font-semibold">
                          Next Follow-up Governance Date: {formatDisplayDate(meeting.nextFollowUpDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Next 60 Days Lookahead */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Upcoming Simulation Pipeline (Next 60 Days)
              </h3>

              {monthlySummary.drillsUpcomingNext60Days.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  No drills scheduled in the immediate 60-day forecast.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {monthlySummary.drillsUpcomingNext60Days.map((drill) => (
                    <div
                      key={drill.id}
                      className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Drill {drill.drillNumber}</span>
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {formatDisplayDate(drill.plannedDate)}
                        </span>
                      </div>
                      <div className="text-slate-600 font-medium">{drill.title}</div>
                      <div className="text-[11px] text-slate-500">Type: {drill.drillType}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: Automated CSM Recommendations */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>4. CSM Monthly Action Plan & Security Advisory</span>
              </h3>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100 space-y-2 text-xs">
                {monthlySummary.csmRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span>CyberDrill Automated Governance Engine • {monthlySummary.csmEmail}</span>
              <span>Page 1 of 1 • Monthly Progress Digest</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ANNUAL COMPLIANCE AUDIT REPORT
          ========================================================================= */}
      {reportTab === 'annual' && annualCompliance && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-8 print:shadow-none print:border-none print:p-0">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {customer.companyName}
                  </h2>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mt-0.5">
                    {selectedYear} Annual Security Awareness & Phishing Compliance Audit
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <div className="font-bold text-slate-900">CyberDrill Security Ops</div>
              <div>Generated: {formatDisplayDate(referenceDate)}</div>
              <div>Report Ref: CDR-{selectedYear}-{customer.id.substring(0, 6).toUpperCase()}</div>
            </div>
          </div>

          {/* Executive Summary Metrics Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Annual Executive Compliance Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Required Drills</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {annualCompliance.annualRequirement}
                </div>
                <div className="text-[10px] text-slate-400">Annual Target</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Total Completed</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5">
                  {annualCompliance.completedCount}
                </div>
                <div className="text-[10px] text-slate-400">
                  {Math.round((annualCompliance.completedCount / annualCompliance.annualRequirement) * 100)}%
                  Fulfilled
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Completed On Time</div>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  {annualCompliance.completedOnTimeCount}
                </div>
                <div className="text-[10px] text-slate-400">Met planned date</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Completed Late</div>
                <div className="text-xl font-bold text-amber-600 mt-0.5">
                  {annualCompliance.completedLateCount}
                </div>
                <div className="text-[10px] text-slate-400">Delayed completion</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-500 font-medium">Review Debriefs</div>
                <div className="text-xl font-bold text-blue-600 mt-0.5">
                  {annualCompliance.reviewMeetingsCompletedCount}
                </div>
                <div className="text-[10px] text-slate-400">Meetings Held</div>
              </div>
            </div>
          </div>

          {/* Customer Account Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <div className="text-slate-500 font-medium">Customer Contact</div>
              <div className="text-slate-900 font-semibold mt-0.5">{customer.customerContact}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Internal Account Owner</div>
              <div className="text-slate-900 font-semibold mt-0.5">{customer.accountOwner}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Industry Sector</div>
              <div className="text-slate-900 font-semibold mt-0.5">{customer.industry || 'Enterprise'}</div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Annual Audit Status</div>
              <div className="mt-1">
                <ComplianceStatusBadge status={annualCompliance.overallStatus} />
              </div>
            </div>
          </div>

          {/* Product Subscriptions Opted Status Strip */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" /> Subscribed Product Modules:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${customer.products?.prophish ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                Prophish: {customer.products?.prophish ? '✓ Opted In' : '✗ Not Opted'}
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${customer.products?.proLms ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                Pro LMS: {customer.products?.proLms ? '✓ Opted In' : '✗ Not Opted'}
              </span>
              <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded text-xs ${customer.products?.proPatrol ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                Pro Patrol: {customer.products?.proPatrol ? '✓ Opted In' : '✗ Not Opted'}
              </span>
            </div>
          </div>

          {/* Drills Audit Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Drill Execution Log & Audit Evidence
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3">#</th>
                    <th className="px-3.5 py-3">Drill Title & Type</th>
                    <th className="px-3.5 py-3">Planned Date</th>
                    <th className="px-3.5 py-3">Completion</th>
                    <th className="px-3.5 py-3">Status</th>
                    <th className="px-3.5 py-3">Click Rate</th>
                    <th className="px-3.5 py-3">Reporting</th>
                    <th className="px-3.5 py-3">Outcome</th>
                    <th className="px-3.5 py-3">Debrief Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {annualDrills.map((drill) => {
                    const effectiveStatus = computeDrillStatus(drill, referenceDate, dueSoonDays);

                    return (
                      <tr key={drill.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-3 font-bold text-slate-700">{drill.drillNumber}</td>
                        <td className="px-3.5 py-3">
                          <div className="font-semibold text-slate-900">{drill.title}</div>
                          <div className="text-[10px] text-slate-500">{drill.drillType}</div>
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">{formatDisplayDate(drill.plannedDate)}</td>
                        <td className="px-3.5 py-3 text-slate-600">
                          {drill.actualCompletionDate ? (
                            formatDisplayDate(drill.actualCompletionDate)
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3">
                          <DrillStatusBadge status={effectiveStatus} size="sm" />
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-800">
                          {drill.clickRate !== undefined ? `${drill.clickRate}%` : '—'}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-blue-700">
                          {drill.reportingRate !== undefined ? `${drill.reportingRate}%` : '—'}
                        </td>
                        <td className="px-3.5 py-3">
                          <DrillResultBadge result={drill.overallResult} />
                        </td>
                        <td className="px-3.5 py-3">
                          {drill.reviewMeeting ? (
                            <ReviewMeetingStatusBadge status={drill.reviewMeeting.status} />
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification Statement */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-900">Security Operations Compliance Attestation</div>
            <p className="text-slate-600 leading-relaxed">
              This document serves as formal evidence that cybersecurity awareness drills and employee phishing simulations for <strong>{customer.companyName}</strong> were scheduled and audited in compliance with organizational security mandates for calendar year {selectedYear}.
            </p>
            <div className="pt-2 flex items-center justify-between text-slate-500 text-[11px] border-t border-slate-200">
              <span>Account Owner: {customer.accountOwner}</span>
              <span>CSM Lead: {customer.csmName || 'Security Operations'}</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PORTFOLIO-WIDE MONTHLY MATRIX
          ========================================================================= */}
      {reportTab === 'portfolio' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Portfolio Monthly Progress Matrix — {MONTH_NAMES[selectedMonth]} {selectedYear}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidated multi-account status digest showing auto-dispatch state for each assigned CSM.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadPortfolioExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Matrix to Excel (.csv)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Customer Account</th>
                  <th className="px-4 py-3">Assigned CSM</th>
                  <th className="px-4 py-3">Compliance</th>
                  <th className="px-4 py-3">Annual Drills</th>
                  <th className="px-4 py-3">This Month's Drills</th>
                  <th className="px-4 py-3">This Month's Reviews</th>
                  <th className="px-4 py-3">Auto-Dispatch</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const summary = getMonthlyProgress(c, selectedYear, selectedMonth, referenceDate);

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(c.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left block"
                        >
                          {c.companyName}
                        </button>
                        <span className="text-[11px] text-slate-500">{c.customerContact}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800">{c.csmName || 'Unassigned'}</span>
                        <div className="text-[11px] text-slate-400">{summary.csmEmail}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <ComplianceStatusBadge status={summary.overallStatus} />
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800">
                          {summary.totalCompletedYtd} / {summary.annualRequirement}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1">
                          ({summary.completionPercentageYtd}%)
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {summary.drillsThisMonth.length > 0 ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                            {summary.drillsThisMonth.length} active
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {summary.reviewMeetingsThisMonth.length > 0 ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold rounded border border-purple-200">
                            {summary.reviewMeetingsThisMonth.length} sessions
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          1st of Month Cadence
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustId(c.id);
                              setReportTab('monthly');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            View Monthly
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
  );
};
