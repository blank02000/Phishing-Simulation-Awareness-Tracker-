import React, { useState, useEffect } from 'react';
import { Customer, LmsDeliverable } from '../../types';
import { SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, CheckCircle2, Calendar, Percent } from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';

interface CompleteDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  deliverable: LmsDeliverable | null;
  selectedYear: number;
}

export const CompleteDeliverableModal: React.FC<CompleteDeliverableModalProps> = ({
  isOpen,
  onClose,
  customer,
  deliverable,
  selectedYear,
}) => {
  const { markDeliverableCompleted } = useCustomerContext();

  const [actualCompletionDate, setActualCompletionDate] = useState(SYSTEM_TODAY);
  const [completionRate, setCompletionRate] = useState<number>(100);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (deliverable) {
      setActualCompletionDate(deliverable.actualCompletionDate || SYSTEM_TODAY);
      setCompletionRate(deliverable.completionRate ?? 100);
      setNotes(deliverable.notes || '');
    }
  }, [deliverable, isOpen]);

  if (!isOpen || !customer || !deliverable) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    markDeliverableCompleted(customer.id, selectedYear, deliverable.id, {
      actualCompletionDate,
      completionRate: Number(completionRate),
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Complete Deliverable</h2>
              <p className="text-xs text-slate-500 truncate max-w-[260px]">{deliverable.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Actual Completion Date *
            </label>
            <input
              type="date"
              required
              value={actualCompletionDate}
              onChange={(e) => setActualCompletionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
            />
            {actualCompletionDate > deliverable.plannedDate && (
              <p className="text-[11px] text-amber-600 font-medium mt-1">
                ⚠️ Completion date is after planned target date ({deliverable.plannedDate}). Status will be marked as Completed Late.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Completion Rate (%) *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={completionRate}
                onChange={(e) => setCompletionRate(Number(e.target.value))}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Completion Notes & Observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of course completion stats or employee feedback..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 resize-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              Mark Completed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
