import React, { useState, useEffect } from 'react';
import { Customer, LmsDeliverable, DeliverableFrequency } from '../../types';
import { SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, BookOpen, Calendar, Users, FileText } from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';

interface CreateEditDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  deliverable?: LmsDeliverable | null;
  selectedYear: number;
}

export const CreateEditDeliverableModal: React.FC<CreateEditDeliverableModalProps> = ({
  isOpen,
  onClose,
  customer,
  deliverable,
  selectedYear,
}) => {
  const { addLmsDeliverable, updateLmsDeliverable } = useCustomerContext();
  const isEditing = !!deliverable;

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<DeliverableFrequency>('quarterly');
  const [plannedDate, setPlannedDate] = useState(SYSTEM_TODAY);
  const [targetAudience, setTargetAudience] = useState('All Employees');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (deliverable) {
      setTitle(deliverable.title);
      setFrequency(deliverable.frequency);
      setPlannedDate(deliverable.plannedDate);
      setTargetAudience(deliverable.targetAudience || 'All Employees');
      setNotes(deliverable.notes || '');
    } else {
      setTitle('');
      setFrequency('quarterly');
      setPlannedDate(SYSTEM_TODAY);
      setTargetAudience('All Employees');
      setNotes('');
    }
  }, [deliverable, isOpen]);

  if (!isOpen || !customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && deliverable) {
      updateLmsDeliverable(customer.id, selectedYear, deliverable.id, {
        title,
        frequency,
        plannedDate,
        targetAudience,
        notes,
      });
    } else {
      addLmsDeliverable(customer.id, selectedYear, {
        title,
        frequency,
        plannedDate,
        targetAudience,
        notes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Pro LMS Deliverable' : 'Add New Pro LMS Deliverable'}
              </h2>
              <p className="text-xs text-slate-500">{customer.companyName} • {selectedYear} Plan</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Cybersecurity Compliance Course"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Frequency / Cadence
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as DeliverableFrequency)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half-yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
                <option value="one-time">One-Time</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Target Planned Date *
              </label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. All Employees, Engineering, Finance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Notes & Description
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional course objectives or requirements..."
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
              {isEditing ? 'Save Changes' : 'Create Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
