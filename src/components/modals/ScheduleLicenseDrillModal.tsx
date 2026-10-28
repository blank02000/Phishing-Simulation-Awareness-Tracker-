import React, { useState } from 'react';
import { Customer, DrillRecord, DrillType } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  X,
  PhoneCall,
  MessageSquare,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface ScheduleLicenseDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  drillType: 'Vishing' | 'Smishing';
}

export const ScheduleLicenseDrillModal: React.FC<ScheduleLicenseDrillModalProps> = ({
  isOpen,
  onClose,
  customer,
  drillType,
}) => {
  const { updateCustomer } = useCustomerContext();

  const isVishing = drillType === 'Vishing';
  const fullDrillType: DrillType = isVishing ? 'Vishing (Voice Phishing)' : 'Smishing (SMS)';

  const [title, setTitle] = useState(
    isVishing
      ? `${customer.companyName} Executive Vishing Voice Simulation`
      : `${customer.companyName} Mobile Smishing (SMS) Verification Drill`
  );
  const [plannedDate, setPlannedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks out
    return d.toISOString().split('T')[0];
  });
  const [quarter, setQuarter] = useState<number>(() => {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  });
  const [targetAudience, setTargetAudience] = useState(
    isVishing ? 'Finance, AP & Executive Assistants (50 Targets)' : 'All Corporate Mobile Users (1,250 Targets)'
  );
  const [pretextScenario, setPretextScenario] = useState(
    isVishing
      ? 'Executive Voice Impersonation: Urgent Vendor Wire Authorization Request'
      : 'Urgent M365 Authentication Token Expiry Alert with Look-alike Link'
  );
  const [notes, setNotes] = useState(
    `Contracted ${isVishing ? 'Vishing' : 'Smishing'} entitlement scheduled via License Management Tab. Gateway whitelisting and telephony routing verified.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const year = customer.currentYear || 2026;
      const currentPlan = customer.annualPlans?.[year] || {
        year,
        annualRequirement: 4,
        startDate: customer.startDate || '2026-01-01',
        intervalMonths: 3,
        drills: [],
      };

      const newDrillNumber = (currentPlan.drills?.length || 0) + 1;
      const newDrill: DrillRecord = {
        id: `drill-${isVishing ? 'vishing' : 'smishing'}-${Date.now()}`,
        drillNumber: newDrillNumber,
        title: title.trim(),
        plannedDate,
        drillType: fullDrillType,
        status: 'Upcoming',
        campaignName: pretextScenario.trim(),
        quarter,
        participantsCount: isVishing ? 50 : (customer.licenseDetails?.targetEmployeesCount || 500),
        notes: notes.trim(),
        notesCreatedAt: new Date().toISOString(),
        notesCreatedBy: customer.accountOwner || 'CSM Lead',
      };

      const updatedDrills = [...(currentPlan.drills || []), newDrill];
      const updatedPlans = {
        ...customer.annualPlans,
        [year]: {
          ...currentPlan,
          drills: updatedDrills,
        },
      };

      updateCustomer(customer.id, {
        annualPlans: updatedPlans,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className={`p-6 text-white flex items-center justify-between ${
          isVishing ? 'bg-gradient-to-r from-emerald-900 to-teal-950' : 'bg-gradient-to-r from-purple-900 to-indigo-950'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${
              isVishing ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' : 'bg-purple-500/20 border-purple-400/30 text-purple-300'
            }`}>
              {isVishing ? <PhoneCall className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                License Entitlement
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Schedule {drillType} Drill
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Drill Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Launch Date</label>
              <input
                type="date"
                required
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Operating Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              >
                <option value={1}>Quarter 1 (Jan - Mar)</option>
                <option value={2}>Quarter 2 (Apr - Jun)</option>
                <option value={3}>Quarter 3 (Jul - Sep)</option>
                <option value={4}>Quarter 4 (Oct - Dec)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Audience Scope</label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Finance & Treasury, Executive Leadership"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {isVishing ? 'Voice Call Pretext Scenario' : 'SMS Lure Template'}
            </label>
            <textarea
              rows={2}
              value={pretextScenario}
              onChange={(e) => setPretextScenario(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Operational Preparation Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isVishing ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-purple-600 hover:bg-purple-500'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Schedule {drillType} Drill</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
