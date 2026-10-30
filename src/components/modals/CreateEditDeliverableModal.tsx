import React, { useState, useEffect } from 'react';
import { Customer, LmsDeliverable, DeliverableFrequency, CustomField } from '../../types';
import { SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';
import { CustomFieldsFormSection } from '../common/CustomFieldsFormSection';

interface CreateEditDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  deliverable?: LmsDeliverable | null;
  selectedYear: number;
}

export const DELIVERABLE_TYPE_OPTIONS = [
  { value: 'Infographics', label: 'Infographics (Cheat Sheets & Visual Guides)', icon: '📊' },
  { value: 'Posters', label: 'Posters (Office Signage & Awareness Boards)', icon: '🖼️' },
  { value: 'Wallpapers', label: 'Wallpapers (Desktop & Mobile Lock Screens)', icon: '💻' },
  { value: 'Videos', label: 'Videos (Micro-Learning & Case Studies)', icon: '🎬' },
  { value: 'SCORM content', label: 'SCORM Content (Interactive LMS Course)', icon: '📦' },
  { value: 'Games', label: 'Games & Gamification (Escape Room & Simulators)', icon: '🎮' },
  { value: 'Security Awareness Course', label: 'Security Awareness Course / Curriculum', icon: '🎓' },
  { value: 'Crisis Simulator', label: 'Crisis Simulator & Tabletop Exercise', icon: '⚡' },
  { value: 'Policy & Handbook', label: 'Security Policy & Handbooks Document', icon: '📋' },
  { value: 'Other', label: 'Other (Custom Deliverable Type)', icon: '📁' },
];

const PRESETS_BY_TYPE: Record<string, string[]> = {
  'Infographics': [
    'Phishing Red Flags & Indicators Cheat Sheet',
    'Password Hygiene & Multi-Factor Auth Guide',
    'Safe Remote Work & Public Wi-Fi Best Practices',
    'Social Engineering & Pretexting Defense Guide',
  ],
  'Posters': [
    '"Think Before You Click" Office Awareness Poster',
    '"Verify Before You Wire" Finance Defense Poster',
    '"Lock Your Screen & Clean Desk" Notice',
  ],
  'Wallpapers': [
    'Q1 Cyber Vigilance Desktop Wallpaper',
    'Zero Trust Architecture Screen Reminder',
    'Mobile Device Phishing Lock Screen Wallpaper',
  ],
  'Videos': [
    '60s Micro-Learning: Spotting Spoofed Senders',
    'Executive BEC Impersonation Case Study Video',
    'Defending Against QR Code Phishing (Quishing)',
    'MFA Fatigue & Push-Bombing Defense Video',
  ],
  'SCORM content': [
    'Annual Cybersecurity Fundamentals (SCORM 1.2)',
    'Data Privacy, GDPR & Handling PII (SCORM 2004)',
    'Ransomware Defense & Incident Response Module',
  ],
  'Games': [
    'Gamification: PhishHunter Cyber Escape Room',
    'Gamification: Voice & SMS Defense Arena',
    'Gamification: Ransomware Crisis Commander',
  ],
  'Security Awareness Course': [
    'Q1 Security Awareness Mandatory Training Course',
    'Executive Cyber Threat Briefing & Compliance Quiz',
    'New Hire Security Onboarding Curriculum',
  ],
  'Crisis Simulator': [
    'Executive Ransomware Crisis Tabletop Scenario',
    'Helpdesk Credential Harvesting Incident Drill',
  ],
  'Policy & Handbook': [
    'Clean Desk & Screen Lock Corporate Policy',
    'Security Incident Reporting Protocol Handbook',
  ],
  'Other': [
    'Custom Security Awareness Deliverable',
  ],
};

function inferTypeFromTitle(titleStr: string): string {
  const lower = (titleStr || '').toLowerCase();
  if (lower.includes('escape') || lower.includes('arena') || lower.includes('commander') || lower.includes('game')) {
    return 'Games';
  }
  if (lower.includes('infographic') || lower.includes('cheat sheet')) {
    return 'Infographics';
  }
  if (lower.includes('poster')) {
    return 'Posters';
  }
  if (lower.includes('wallpaper')) {
    return 'Wallpapers';
  }
  if (lower.includes('video') || lower.includes('clip') || lower.includes('micro-learning')) {
    return 'Videos';
  }
  if (lower.includes('scorm')) {
    return 'SCORM content';
  }
  if (lower.includes('policy') || lower.includes('handbook')) {
    return 'Policy & Handbook';
  }
  if (lower.includes('tabletop') || lower.includes('simulator')) {
    return 'Crisis Simulator';
  }
  return 'Security Awareness Course';
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

  const [type, setType] = useState('Infographics');
  const [customTypeName, setCustomTypeName] = useState('');
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<DeliverableFrequency>('quarterly');
  const [plannedDate, setPlannedDate] = useState(SYSTEM_TODAY);
  const [targetAudience, setTargetAudience] = useState('All Employees');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    if (deliverable) {
      setTitle(deliverable.title);
      const initialType = deliverable.type || inferTypeFromTitle(deliverable.title) || 'Infographics';
      const isKnownType = DELIVERABLE_TYPE_OPTIONS.some((opt) => opt.value === initialType);
      if (isKnownType) {
        setType(initialType);
        setCustomTypeName('');
      } else {
        setType('Other');
        setCustomTypeName(initialType);
      }
      setFrequency(deliverable.frequency);
      setPlannedDate(deliverable.plannedDate);
      setTargetAudience(deliverable.targetAudience || 'All Employees');
      setNotes(deliverable.notes || '');
      setCustomFields(deliverable.customFields ? JSON.parse(JSON.stringify(deliverable.customFields)) : []);
    } else {
      setTitle('');
      setType('Infographics');
      setCustomTypeName('');
      setFrequency('quarterly');
      setPlannedDate(SYSTEM_TODAY);
      setTargetAudience('All Employees');
      setNotes('');
      setCustomFields([]);
    }
  }, [deliverable, isOpen]);

  if (!isOpen || !customer) return null;

  const currentPresets = PRESETS_BY_TYPE[type] || PRESETS_BY_TYPE['Infographics'];
  const effectiveType = type === 'Other' && customTypeName.trim() ? customTypeName.trim() : type;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && deliverable) {
      updateLmsDeliverable(customer.id, selectedYear, deliverable.id, {
        title: title.trim(),
        type: effectiveType,
        frequency,
        plannedDate,
        targetAudience: targetAudience.trim(),
        notes: notes.trim(),
        customFields: customFields.length > 0 ? customFields : undefined,
      });
    } else {
      addLmsDeliverable(customer.id, selectedYear, {
        title: title.trim(),
        type: effectiveType,
        frequency,
        plannedDate,
        targetAudience: targetAudience.trim(),
        notes: notes.trim(),
        customFields: customFields.length > 0 ? customFields : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Deliverable Type & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
                <span>Deliverable Type *</span>
                <span className="text-[10px] text-emerald-700 font-semibold normal-case bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  ProLMS Catalog
                </span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  // Optionally suggest the first preset if title is currently empty
                  if (!title && PRESETS_BY_TYPE[newType]?.[0]) {
                    setTitle(PRESETS_BY_TYPE[newType][0]);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
              >
                {DELIVERABLE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Frequency / Cadence *
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
          </div>

          {/* Conditional Custom Type Name Input if 'Other' selected */}
          {type === 'Other' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Custom Deliverable Type Name *
              </label>
              <input
                type="text"
                required
                value={customTypeName}
                onChange={(e) => setCustomTypeName(e.target.value)}
                placeholder="e.g. Executive Phishing Briefing, VR Security Simulation..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
              />
            </div>
          )}

          {/* Deliverable Title & Type-Aware Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Deliverable Title *
              </label>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Presets:</span>
              </span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Cybersecurity Compliance Course or Gamification: Cyber Escape Room"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30"
            />

            {/* Quick Presets tailored to currently selected Deliverable Type */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTitle(preset)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                    title === preset
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Target Planned Date & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Notes & Objectives */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Notes & Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional course objectives, format specifications, or client requirements..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 resize-none"
            />
          </div>

          {/* Deliverable Custom Fields — Seamlessly integrated into form */}
          <CustomFieldsFormSection
            fields={customFields}
            onChange={setCustomFields}
            formTitle="Deliverable Custom Attributes"
            formType="deliverable"
          />

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Create Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
