import React from 'react';
import { DrillStatus, AnnualComplianceStatus, CustomerStatus, ReviewMeetingStatus, DrillResult } from '../../types';
import { CheckCircle2, AlertCircle, Clock, XCircle, AlertTriangle, Calendar, ShieldCheck, ShieldAlert } from 'lucide-react';

export const DrillStatusBadge: React.FC<{ status: DrillStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  switch (status) {
    case 'Completed':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case 'Completed Late':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Completed Late
        </span>
      );
    case 'Due Soon':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/70 text-amber-900 font-semibold ${sizeClasses}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Due Soon
        </span>
      );
    case 'Overdue':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          Overdue
        </span>
      );
    case 'Upcoming':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 ${sizeClasses}`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          Upcoming
        </span>
      );
    case 'Not Completed':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-600 ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-zinc-500" />
          Not Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span
          id={`badge-drill-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 line-through ${sizeClasses}`}
        >
          <XCircle className="w-3.5 h-3.5 text-zinc-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export const ComplianceStatusBadge: React.FC<{ status: AnnualComplianceStatus }> = ({ status }) => {
  switch (status) {
    case 'On Track':
      return (
        <span
          id="badge-compliance-ontrack"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          On Track
        </span>
      );
    case 'Completed':
      return (
        <span
          id="badge-compliance-completed"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          Completed
        </span>
      );
    case 'Due Soon':
      return (
        <span
          id="badge-compliance-duesoon"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          Due Soon
        </span>
      );
    case 'Overdue':
      return (
        <span
          id="badge-compliance-overdue"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Overdue
        </span>
      );
    case 'At Risk':
      return (
        <span
          id="badge-compliance-atrisk"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          At Risk
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export const ReviewMeetingStatusBadge: React.FC<{ status: ReviewMeetingStatus }> = ({ status }) => {
  switch (status) {
    case 'Completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
        </span>
      );
    case 'Scheduled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="w-3 h-3 text-blue-600" /> Scheduled
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-500 line-through">
          Cancelled
        </span>
      );
    case 'Not Scheduled':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
          Not Scheduled
        </span>
      );
  }
};

export const DrillResultBadge: React.FC<{ result?: DrillResult }> = ({ result }) => {
  if (!result) return <span className="text-slate-400 text-xs">—</span>;

  switch (result) {
    case 'Passed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Passed
        </span>
      );
    case 'Needs Improvement':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Needs Improvement
        </span>
      );
    case 'High Risk':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3" /> High Risk
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{result}</span>;
  }
};
