import React, { useState, useEffect } from 'react';
import { Customer, DrillRecord, DrillType, DrillStatus } from '../../types';
import { formatDisplayDate } from '../../utils/drillCalculator';
import { X, Calendar, Edit3, Check } from 'lucide-react';

interface EditDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  drill: DrillRecord | null;
  customerName?: string;
  onSubmit?: (data: Partial<DrillRecord>) => void;
  onSave?: (data: Partial<DrillRecord>) => void;
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

export const EditDrillModal: React.FC<EditDrillModalProps> = ({
  isOpen,
  onClose,
  customer,
  drill,
  customerName,
  onSubmit,
  onSave,
}) => {
  const resolvedCustomerName = customer?.companyName || customerName || 'Customer Account';
  const [plannedDate, setPlannedDate] = useState('');
  const [drillType, setDrillType] = useState<DrillType>('Phishing Email Simulation');
  const [campaignName, setCampaignName] = useState('');
  const [status, setStatus] = useState<DrillStatus>('Upcoming');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (drill) {
      setPlannedDate(drill.plannedDate);
      setDrillType(drill.drillType);
      setCampaignName(drill.campaignName || '');
      setStatus(drill.status);
      setNotes(drill.notes || '');
    }
  }, [drill]);

  if (!isOpen || !drill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedDate) return;

    const payload: Partial<DrillRecord> = {
      plannedDate,
      drillType,
      campaignName: campaignName.trim() || undefined,
      status,
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
        id="modal-edit-drill"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Edit Drill {drill.drillNumber} Schedule
              </h2>
              <p className="text-xs text-slate-500">{resolvedCustomerName}</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Planned Schedule Date <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-edit-planned-date"
              type="date"
              required
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Drill Simulation Type
            </label>
            <select
              id="select-edit-drill-type"
              value={drillType}
              onChange={(e) => setDrillType(e.target.value as DrillType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {DRILL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign / Scenario Reference
            </label>
            <input
              id="input-edit-campaign-name"
              type="text"
              placeholder="e.g. Q3 Executive Spear Phishing Drill"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Manual Status Override</label>
            <select
              id="select-edit-status-override"
              value={status}
              onChange={(e) => setStatus(e.target.value as DrillStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Completed">Completed</option>
              <option value="Completed Late">Completed Late</option>
              <option value="Overdue">Overdue</option>
              <option value="Not Completed">Not Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Drill Notes</label>
            <textarea
              id="textarea-edit-drill-notes"
              rows={2}
              placeholder="Internal operational notes for this drill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
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
              id="btn-save-edit-drill"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
