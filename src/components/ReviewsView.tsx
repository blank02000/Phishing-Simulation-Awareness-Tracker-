import React, { useState, useMemo } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { Customer, AnnualPlan, DrillRecord, ReviewMeeting, ReviewMeetingStatus, DrillResult } from '../types';
import { formatDisplayDate, parseDate } from '../utils/drillCalculator';
import {
  ReviewMeetingStatusBadge,
  DrillStatusBadge,
  DrillResultBadge,
} from './common/StatusBadges';
import {
  MessageSquare,
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  ExternalLink,
  Edit3,
  Copy,
  Check,
  Building2,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  List,
  ShieldCheck,
  CalendarPlus,
  AlertCircle,
  Tag,
  UserCheck,
} from 'lucide-react';

interface ReviewsViewProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenReviewMeeting: (customer: Customer, drill: DrillRecord) => void;
}

interface ReviewMeetingItem {
  id: string; // composite key: `${customer.id}-${year}-${drill.id}`
  customer: Customer;
  customerId: string;
  customerName: string;
  csmName?: string;
  csmId?: string;
  industry?: string;
  year: number;
  drill: DrillRecord;
  drillNumber: number;
  drillTitle: string;
  drillType: string;
  drillStatus: string;
  actualCompletionDate?: string;
  plannedDate: string;
  clickRate?: number;
  submissionRate?: number;
  reportingRate?: number;
  overallResult?: DrillResult;
  reviewMeeting?: ReviewMeeting;
  meetingStatus: ReviewMeetingStatus;
  meetingDate?: string;
  participants?: string;
  discussionPoints?: string;
  findings?: string;
  actionItems?: string;
  nextFollowUpDate?: string;
  isRequired: boolean;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  onSelectCustomer,
  onOpenReviewMeeting,
}) => {
  const { customers, referenceDate, currentUser, users } = useCustomerContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCsm, setSelectedCsm] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'company' | 'drill'>('date-desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flatten all review meetings from all customer annual plans
  const allReviewItems = useMemo(() => {
    const items: ReviewMeetingItem[] = [];

    customers.forEach((customer) => {
      Object.entries(customer.annualPlans).forEach(([yearStr, planObj]) => {
        const year = Number(yearStr);
        const plan = planObj as AnnualPlan;
        if (!plan?.drills) return;
        plan.drills.forEach((drill) => {
          const meeting = drill.reviewMeeting;
          const isRequired = meeting?.required ?? true;
          const meetingStatus: ReviewMeetingStatus = !isRequired
            ? 'Cancelled'
            : meeting?.status || 'Not Scheduled';

          items.push({
            id: `${customer.id}-${year}-${drill.id}`,
            customer,
            customerId: customer.id,
            customerName: customer.companyName,
            csmName: customer.csmName || 'Unassigned',
            csmId: customer.csmId,
            industry: customer.industry,
            year,
            drill,
            drillNumber: drill.drillNumber,
            drillTitle: drill.title,
            drillType: drill.drillType,
            drillStatus: drill.status,
            actualCompletionDate: drill.actualCompletionDate,
            plannedDate: drill.plannedDate,
            clickRate: drill.clickRate,
            submissionRate: drill.submissionRate,
            reportingRate: drill.reportingRate,
            overallResult: drill.overallResult,
            reviewMeeting: meeting,
            meetingStatus,
            meetingDate: meeting?.date,
            participants: meeting?.participants,
            discussionPoints: meeting?.discussionPoints,
            findings: meeting?.findings,
            actionItems: meeting?.actionItems,
            nextFollowUpDate: meeting?.nextFollowUpDate,
            isRequired,
          });
        });
      });
    });

    return items;
  }, [customers]);

  // Extract unique available years and CSM names for filter dropdowns
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    allReviewItems.forEach((item) => yearsSet.add(item.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allReviewItems]);

  const availableCsms = useMemo(() => {
    const csmsSet = new Set<string>();
    allReviewItems.forEach((item) => {
      if (item.csmName) csmsSet.add(item.csmName);
    });
    return Array.from(csmsSet).sort();
  }, [allReviewItems]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = allReviewItems.length;
    const completed = allReviewItems.filter((i) => i.meetingStatus === 'Completed').length;
    const scheduled = allReviewItems.filter((i) => i.meetingStatus === 'Scheduled').length;
    const notScheduled = allReviewItems.filter(
      (i) => i.meetingStatus === 'Not Scheduled' && i.isRequired
    ).length;
    const hasFollowUp = allReviewItems.filter((i) => i.nextFollowUpDate || i.actionItems).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      scheduled,
      notScheduled,
      hasFollowUp,
      completionRate,
    };
  }, [allReviewItems]);

  // Filter & Sort review items
  const filteredItems = useMemo(() => {
    return allReviewItems
      .filter((item) => {
        // Status filter
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'needs_scheduling') {
            if (item.meetingStatus !== 'Not Scheduled') return false;
          } else if (item.meetingStatus.toLowerCase() !== selectedStatus.toLowerCase()) {
            return false;
          }
        }

        // Year filter
        if (selectedYear !== 'all' && item.year !== Number(selectedYear)) {
          return false;
        }

        // CSM filter
        if (selectedCsm !== 'all' && item.csmName !== selectedCsm) {
          return false;
        }

        // Drill result filter
        if (selectedResult !== 'all' && item.overallResult !== selectedResult) {
          return false;
        }

        // Search text filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchCompany = item.customerName.toLowerCase().includes(q);
          const matchCsm = item.csmName?.toLowerCase().includes(q);
          const matchDrill = item.drillTitle.toLowerCase().includes(q) || item.drillType.toLowerCase().includes(q);
          const matchParticipants = item.participants?.toLowerCase().includes(q);
          const matchDiscussion = item.discussionPoints?.toLowerCase().includes(q);
          const matchFindings = item.findings?.toLowerCase().includes(q);
          const matchAction = item.actionItems?.toLowerCase().includes(q);

          if (
            !matchCompany &&
            !matchCsm &&
            !matchDrill &&
            !matchParticipants &&
            !matchDiscussion &&
            !matchFindings &&
            !matchAction
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          const dateA = a.meetingDate || a.plannedDate;
          const dateB = b.meetingDate || b.plannedDate;
          return dateB.localeCompare(dateA);
        }
        if (sortBy === 'date-asc') {
          const dateA = a.meetingDate || a.plannedDate;
          const dateB = b.meetingDate || b.plannedDate;
          return dateA.localeCompare(dateB);
        }
        if (sortBy === 'company') {
          return a.customerName.localeCompare(b.customerName);
        }
        if (sortBy === 'drill') {
          return a.drillNumber - b.drillNumber;
        }
        return 0;
      });
  }, [allReviewItems, selectedStatus, selectedYear, selectedCsm, selectedResult, searchQuery, sortBy]);

  const handleCopyNotes = (item: ReviewMeetingItem) => {
    const text = [
      `SECURITY DRILL REVIEW MEETING SUMMARY`,
      `Customer: ${item.customerName}`,
      `CSM: ${item.csmName || 'Unassigned'}`,
      `Drill: Drill ${item.drillNumber} (${item.drillType}) - ${item.year}`,
      `Review Status: ${item.meetingStatus}`,
      `Meeting Date: ${item.meetingDate ? formatDisplayDate(item.meetingDate) : 'Not scheduled'}`,
      item.participants ? `Participants: ${item.participants}` : null,
      item.discussionPoints ? `\nDiscussion Points:\n${item.discussionPoints}` : null,
      item.findings ? `\nKey Findings:\n${item.findings}` : null,
      item.actionItems ? `\nAction Items:\n${item.actionItems}` : null,
      item.nextFollowUpDate ? `\nNext Follow-up Date: ${formatDisplayDate(item.nextFollowUpDate)}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12" id="review-meetings-view-container">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Debrief & Executive Governance Hub</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Security Drill Review Meetings
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Centralized register of all post-drill debrief sessions, key vulnerability findings, stakeholder attendees, remediation action items, and audit follow-up schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-reviews-view-cards"
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            type="button"
            id="btn-reviews-view-table"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Debriefs</span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-medium">drills in scope</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200/80 bg-emerald-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">{stats.completed}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
              {stats.completionRate}% Done
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200/80 bg-blue-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700">{stats.scheduled}</span>
            <span className="text-xs text-blue-600 font-medium">on calendar</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200/80 bg-amber-50/20 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Action Needed</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-800">{stats.notScheduled}</span>
            <span className="text-xs text-amber-700 font-medium">unscheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200/80 bg-purple-50/20 shadow-2xs col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Follow-Ups Tracked</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-800">{stats.hasFollowUp}</span>
            <span className="text-xs text-purple-600 font-medium">with actions</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="input-reviews-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company, CSM, findings, action items, participants..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Filter Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'Completed', label: 'Completed' },
              { id: 'Scheduled', label: 'Scheduled' },
              { id: 'needs_scheduling', label: 'Needs Scheduling' },
              { id: 'Cancelled', label: 'Waived/Cancelled' },
            ].map((st) => {
              const isSelected = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  id={`filter-reviews-status-${st.id}`}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filters Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Year:</span>
            <select
              id="select-reviews-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* CSM Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">CSM:</span>
            <select
              id="select-reviews-csm"
              value={selectedCsm}
              onChange={(e) => setSelectedCsm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All CSMs</option>
              {availableCsms.map((csm) => (
                <option key={csm} value={csm}>
                  {csm}
                </option>
              ))}
            </select>
          </div>

          {/* Drill Result Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Drill Outcome:</span>
            <select
              id="select-reviews-outcome"
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Results</option>
              <option value="Passed">Passed</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              id="select-reviews-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="date-desc">Meeting Date (Newest first)</option>
              <option value="date-asc">Meeting Date (Oldest first)</option>
              <option value="company">Customer Name (A - Z)</option>
              <option value="drill">Drill Number</option>
            </select>
          </div>

          {(selectedStatus !== 'all' ||
            selectedYear !== 'all' ||
            selectedCsm !== 'all' ||
            selectedResult !== 'all' ||
            searchQuery) && (
            <button
              type="button"
              id="btn-reset-review-filters"
              onClick={() => {
                setSelectedStatus('all');
                setSelectedYear('all');
                setSelectedCsm('all');
                setSelectedResult('all');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800 font-semibold">{filteredItems.length}</strong> review session records
        </span>
        <span className="text-[11px] text-slate-400">
          Click "Update Review" on any record to log discussions, participants, and remediation findings.
        </span>
      </div>

      {/* Main Review Items Display: Card or Table View */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No review meetings found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            There are no security review debriefs matching your current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedStatus('all');
              setSelectedYear('all');
              setSelectedCsm('all');
              setSelectedResult('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Detailed Cards View */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const hasNotes =
              item.discussionPoints || item.findings || item.actionItems || item.participants;

            return (
              <div
                key={item.id}
                id={`card-review-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(item.customerId)}
                          className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1.5 group text-left"
                        >
                          <span>{item.customerName}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          CSM: <strong className="text-slate-700">{item.csmName}</strong>
                        </span>
                        {item.industry && (
                          <>
                            <span>•</span>
                            <span>{item.industry}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <ReviewMeetingStatusBadge status={item.meetingStatus} />
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        {item.year} • Drill {item.drillNumber}
                      </span>
                    </div>
                  </div>

                  {/* Drill Context Strip */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{item.drillTitle}</span>
                      <span className="text-slate-400">({item.drillType})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DrillStatusBadge status={item.drillStatus as any} size="sm" />
                      {item.overallResult && <DrillResultBadge result={item.overallResult} />}
                      {item.clickRate !== undefined && (
                        <span className="text-[11px] font-semibold text-slate-600">
                          Clicks: <strong className="text-slate-900">{item.clickRate}%</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body: Meeting Info & Debrief Content */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Meeting Metadata Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">
                        Meeting Date
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {item.meetingDate ? (
                          <span>{formatDisplayDate(item.meetingDate)}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not scheduled yet</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px] mb-1">
                        Attendees / Stakeholders
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={item.participants || 'No attendees recorded'}>
                          {item.participants || <span className="text-slate-400 italic">No attendees recorded</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discussion Points */}
                  {item.discussionPoints && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        Discussion & Executive Overview:
                      </span>
                      <p className="text-xs text-slate-600 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100/70 leading-relaxed whitespace-pre-wrap">
                        {item.discussionPoints}
                      </p>
                    </div>
                  )}

                  {/* Security Findings */}
                  {item.findings && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Key Vulnerability Findings:
                      </span>
                      <p className="text-xs text-slate-600 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100/70 leading-relaxed whitespace-pre-wrap">
                        {item.findings}
                      </p>
                    </div>
                  )}

                  {/* Action Items */}
                  {item.actionItems && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Remediation Action Items:
                      </span>
                      <p className="text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/70 leading-relaxed whitespace-pre-wrap">
                        {item.actionItems}
                      </p>
                    </div>
                  )}

                  {/* Next Follow-Up Date Warning / Indicator */}
                  {item.nextFollowUpDate && (
                    <div className="flex items-center justify-between text-xs bg-purple-50 text-purple-900 border border-purple-200 px-3 py-2 rounded-lg font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>Next Governance Follow-Up:</span>
                      </div>
                      <span className="font-bold">{formatDisplayDate(item.nextFollowUpDate)}</span>
                    </div>
                  )}

                  {!hasNotes && (
                    <div className="py-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      No meeting minutes or notes documented yet for this drill debrief.
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyNotes(item)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg flex items-center gap-1 transition-colors"
                    title="Copy meeting notes to clipboard"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Notes</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(item.customerId)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Customer View
                    </button>
                    <button
                      type="button"
                      id={`btn-open-review-${item.id}`}
                      onClick={() => onOpenReviewMeeting(item.customer, item.drill)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{item.meetingStatus === 'Not Scheduled' ? 'Schedule Review' : 'Update Review'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / Data Grid View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Customer & CSM</th>
                  <th className="px-4 py-3.5">Drill & Year</th>
                  <th className="px-4 py-3.5">Review Status</th>
                  <th className="px-4 py-3.5">Meeting Date</th>
                  <th className="px-4 py-3.5">Participants</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Findings & Action Items</th>
                  <th className="px-4 py-3.5">Next Follow-Up</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    id={`row-review-${item.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(item.customerId)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-left block"
                      >
                        {item.customerName}
                      </button>
                      <span className="text-[11px] text-slate-500">CSM: {item.csmName}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">
                        {item.year} • Drill {item.drillNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {item.drillType}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <ReviewMeetingStatusBadge status={item.meetingStatus} />
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.meetingDate ? (
                        <span className="font-medium text-slate-800">
                          {formatDisplayDate(item.meetingDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 max-w-[160px]">
                      <span className="truncate block text-slate-700" title={item.participants}>
                        {item.participants || <span className="text-slate-400 italic">—</span>}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-[260px]">
                      {item.findings || item.actionItems || item.discussionPoints ? (
                        <div className="space-y-1">
                          {item.findings && (
                            <p className="text-[11px] text-slate-700 line-clamp-1">
                              <strong>Findings:</strong> {item.findings}
                            </p>
                          )}
                          {item.actionItems && (
                            <p className="text-[11px] text-emerald-700 line-clamp-1">
                              <strong>Actions:</strong> {item.actionItems}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No notes logged</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {item.nextFollowUpDate ? (
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                          {formatDisplayDate(item.nextFollowUpDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyNotes(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Copy meeting notes"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenReviewMeeting(item.customer, item.drill)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          {item.meetingStatus === 'Not Scheduled' ? 'Schedule' : 'Edit'}
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
  );
};
