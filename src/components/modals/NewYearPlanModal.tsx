import React, { useState, useMemo } from 'react';
import { Customer, DrillType } from '../../types';
import { generateAnnualTimeline, formatDisplayDate, formatMonthShort } from '../../utils/drillCalculator';
import { X, CalendarPlus, Sparkles, Check } from 'lucide-react';

interface NewYearPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  currentYear: number;
  onSubmit?: (
    newYear: number,
    startDate: string,
    annualRequirement: number,
    intervalMonths: number,
    defaultDrillType?: DrillType,
    notes?: string
  ) => void;
  onSave?: (
    newYear: number,
    startDate: string,
    annualRequirement: number,
    intervalMonths: number,
    defaultDrillType?: DrillType,
    notes?: string
  ) => void;
}

const DRILL_TYPES: DrillType[] = [
  'Phishing Email Simulation',
  'Spear Phishing / Executive',
  'Smishing (SMS)',
  'Credential Harvesting',
  'Ransomware Awareness',
  'USB Drop / Physical',
  'Social Engineering Call',
  'Custom Drill',
];

export const NewYearPlanModal: React.FC<NewYearPlanModalProps> = ({
  isOpen,
  onClose,
  customer,
  currentYear,
  onSubmit,
  onSave,
}) => {
  const nextYear = currentYear + 1;
  const [targetYear, setTargetYear] = useState<number>(nextYear);
  const [startDate, setStartDate] = useState<string>(`${nextYear}-01-15`);
  const [annualRequirement, setAnnualRequirement] = useState<number>(4);
  const [intervalMonths, setIntervalMonths] = useState<number>(3);
  const [defaultDrillType, setDefaultDrillType] = useState<DrillType>('Phishing Email Simulation');
  const [notes, setNotes] = useState<string>('');

  const previewDrills = useMemo(() => {
    if (!startDate) return [];
    return generateAnnualTimeline(startDate, annualRequirement, intervalMonths, defaultDrillType);
  }, [startDate, annualRequirement, intervalMonths, defaultDrillType]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate) return;

    const handler = onSubmit || onSave;
    if (handler) {
      handler(
        targetYear,
        startDate,
        annualRequirement,
        intervalMonths,
        defaultDrillType,
        notes.trim() || undefined
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="modal-new-year-plan"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Create {targetYear} Annual Drill Plan
              </h2>
              <p className="text-xs text-slate-500">
                {customer.companyName} • Yearly Renewal & Timeline Setup
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

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Year</label>
              <input
                id="input-new-plan-year"
                type="number"
                min={2025}
                max={2035}
                value={targetYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setTargetYear(y);
                  setStartDate(`${y}-01-15`);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Drill Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-new-plan-startdate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Drills Count
              </label>
              <select
                id="select-new-plan-count"
                value={annualRequirement}
                onChange={(e) => {
                  const c = Number(e.target.value);
                  setAnnualRequirement(c);
                  if (c === 4) setIntervalMonths(3);
                  else if (c === 6) setIntervalMonths(2);
                  else if (c === 12) setIntervalMonths(1);
                  else if (c === 2) setIntervalMonths(6);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value={4}>4 Drills (Quarterly)</option>
                <option value={6}>6 Drills (Bi-Monthly)</option>
                <option value={12}>12 Drills (Monthly)</option>
                <option value={2}>2 Drills (Semi-Annual)</option>
                <option value={1}>1 Drill (Annual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interval</label>
              <select
                id="select-new-plan-interval"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value={1}>Every 1 Month</option>
                <option value={2}>Every 2 Months</option>
                <option value={3}>Every 3 Months</option>
                <option value={4}>Every 4 Months</option>
                <option value={6}>Every 6 Months</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Drill Type
            </label>
            <select
              id="select-new-plan-type"
              value={defaultDrillType}
              onChange={(e) => setDefaultDrillType(e.target.value as DrillType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {DRILL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Generated Schedule Preview */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Generated {targetYear} Timeline ({previewDrills.length} Drills)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {previewDrills.map((d) => (
                <div key={d.drillNumber} className="bg-white p-2 rounded border border-slate-200 text-xs">
                  <div className="font-bold text-blue-600">
                    {formatMonthShort(d.plannedDate)} (Drill {d.drillNumber})
                  </div>
                  <div className="text-slate-600 mt-0.5">{formatDisplayDate(d.plannedDate)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-create-new-plan"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Create {targetYear} Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
