import React, { useState, useEffect } from 'react';
import { Customer, DrillRecord, DrillResult } from '../../types';
import { formatDisplayDate, SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, CheckCircle2, Clock, ShieldAlert, Sparkles, Percent, Users, FileText } from 'lucide-react';

interface CompleteDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  drill: DrillRecord | null;
  customerName?: string;
  referenceDate?: string;
  onSubmit?: (data: {
    actualCompletionDate: string;
    campaignName?: string;
    participantsCount?: number;
    clickRate?: number;
    submissionRate?: number;
    reportingRate?: number;
    overallResult?: DrillResult;
    summary?: string;
    keyFindings?: string;
    recommendations?: string;
    notes?: string;
  }) => void;
  onSave?: (data: {
    actualCompletionDate: string;
    campaignName?: string;
    participantsCount?: number;
    clickRate?: number;
    submissionRate?: number;
    reportingRate?: number;
    overallResult?: DrillResult;
    summary?: string;
    keyFindings?: string;
    recommendations?: string;
    notes?: string;
  }) => void;
}

export const CompleteDrillModal: React.FC<CompleteDrillModalProps> = ({
  isOpen,
  onClose,
  customer,
  drill,
  customerName,
  referenceDate = SYSTEM_TODAY,
  onSubmit,
  onSave,
}) => {
  const resolvedCustomerName = customer?.companyName || customerName || 'Customer Account';
  const [actualCompletionDate, setActualCompletionDate] = useState(referenceDate);
  const [campaignName, setCampaignName] = useState('');
  const [participantsCount, setParticipantsCount] = useState<string>('');
  const [clickRate, setClickRate] = useState<string>('');
  const [submissionRate, setSubmissionRate] = useState<string>('');
  const [reportingRate, setReportingRate] = useState<string>('');
  const [overallResult, setOverallResult] = useState<DrillResult>('Passed');
  const [summary, setSummary] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (drill) {
      setActualCompletionDate(drill.actualCompletionDate || referenceDate || SYSTEM_TODAY);
      setCampaignName(drill.campaignName || `Drill ${drill.drillNumber} Simulation`);
      setParticipantsCount(drill.participantsCount !== undefined ? String(drill.participantsCount) : '250');
      setClickRate(drill.clickRate !== undefined ? String(drill.clickRate) : '');
      setSubmissionRate(drill.submissionRate !== undefined ? String(drill.submissionRate) : '');
      setReportingRate(drill.reportingRate !== undefined ? String(drill.reportingRate) : '');
      setOverallResult(drill.overallResult || 'Passed');
      setSummary(drill.summary || '');
      setKeyFindings(drill.keyFindings || '');
      setRecommendations(drill.recommendations || '');
      setNotes(drill.notes || '');
    }
  }, [drill, referenceDate]);

  if (!isOpen || !drill) return null;

  // Auto determine timing
  const isLate = actualCompletionDate > drill.plannedDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCompletionDate) return;

    const payload = {
      actualCompletionDate,
      campaignName: campaignName.trim() || undefined,
      participantsCount: participantsCount ? Number(participantsCount) : undefined,
      clickRate: clickRate !== '' ? Number(clickRate) : undefined,
      submissionRate: submissionRate !== '' ? Number(submissionRate) : undefined,
      reportingRate: reportingRate !== '' ? Number(reportingRate) : undefined,
      overallResult,
      summary: summary.trim() || undefined,
      keyFindings: keyFindings.trim() || undefined,
      recommendations: recommendations.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const handler = onSubmit || onSave;
    if (handler) {
      handler(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="modal-complete-drill"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Mark Drill {drill.drillNumber} Completed
              </h2>
              <p className="text-xs text-slate-500">
                {resolvedCustomerName} • Planned Date: {formatDisplayDate(drill.plannedDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Completion Timing & Automatic Status Check */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Completion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-actual-completion-date"
                  type="date"
                  required
                  value={actualCompletionDate}
                  onChange={(e) => setActualCompletionDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Automatic Status Resolution Tag */}
              <div className="sm:text-right">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Calculated Completion Status
                </div>
                <div className="mt-1">
                  {isLate ? (
                    <span
                      id="badge-calculated-status-late"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-700" /> Completed Late (Planned: {formatDisplayDate(drill.plannedDate)})
                    </span>
                  ) : (
                    <span
                      id="badge-calculated-status-ontime"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Completed On Time
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Campaign & Participant Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign / Scenario Name
              </label>
              <input
                id="input-campaign-name"
                type="text"
                placeholder="e.g. Q2 DocuSign Urgent Review Lure"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Participants / Target Employees
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="input-participants-count"
                  type="number"
                  placeholder="e.g. 350"
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Performance Metrics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> Drill Results & Metrics (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Click Rate (%)
                </label>
                <input
                  id="input-click-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 5.2"
                  value={clickRate}
                  onChange={(e) => setClickRate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Submission Rate (%)
                </label>
                <input
                  id="input-submission-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 2.1"
                  value={submissionRate}
                  onChange={(e) => setSubmissionRate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reporting Rate (%)
                </label>
                <input
                  id="input-reporting-rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 68.0"
                  value={reportingRate}
                  onChange={(e) => setReportingRate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Overall Outcome
                </label>
                <select
                  id="select-overall-result"
                  value={overallResult}
                  onChange={(e) => setOverallResult(e.target.value as DrillResult)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="Passed">Passed</option>
                  <option value="Needs Improvement">Needs Improvement</option>
                  <option value="High Risk">High Risk</option>
                  <option value="Pending Review">Pending Review</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Qualitative Findings & Recommendations */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Summary / Executive Overview
              </label>
              <textarea
                id="textarea-drill-summary"
                rows={2}
                placeholder="Brief summary of how the drill was delivered and general employee response..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Findings
                </label>
                <textarea
                  id="textarea-key-findings"
                  rows={2}
                  placeholder="e.g. High click rate among finance users; marketing had zero clicks."
                  value={keyFindings}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommendations & Next Actions
                </label>
                <textarea
                  id="textarea-recommendations"
                  rows={2}
                  placeholder="e.g. Conduct additional targeted awareness training for accounts payable."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-complete-drill"
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Save & Record Completion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
