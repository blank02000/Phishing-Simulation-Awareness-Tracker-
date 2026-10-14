import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Tag,
  History,
  Target,
  Send,
} from 'lucide-react';
import {
  Customer,
  DrillRecord,
  AccountGeneralNote,
  GeneralNoteCategory,
} from '../types';
import { useCustomerContext } from '../context/CustomerContext';
import {
  formatDisplayDate,
  formatDateTimeDisplay,
  formatRelativeTime,
  computeDrillStatus,
} from '../utils/drillCalculator';

interface CustomerAccountNotesHubProps {
  customer: Customer;
  selectedYear: number;
  availableYears: number[];
  canEdit: boolean;
  onSelectYear?: (year: number) => void;
  onOpenDrillExecution?: (drill: DrillRecord) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  'Client Call': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Meeting: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Escalation: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Compliance: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Handover: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Renewal: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const getCategoryStyle = (cat: string) => {
  return (
    CATEGORY_STYLES[cat] || {
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    }
  );
};

const SUGGESTED_PROMPTS = [
  '• RBI / ISO 27001 Cybersecurity Framework compliance mandate',
  '• Executive Whitelist approval required 5 days prior to launch',
  '• Zero-Tolerance Click Rate SLA threshold: < 5%',
  '• Monthly CISO briefing debrief scheduled with security leadership',
  '• Quarter-end financial freeze period (no drills in last week)',
];

export const CustomerAccountNotesHub: React.FC<CustomerAccountNotesHubProps> = ({
  customer,
  selectedYear,
  availableYears,
  canEdit,
  onSelectYear,
  onOpenDrillExecution,
}) => {
  const {
    currentUser,
    referenceDate,
    dueSoonDays,
    updateCustomerOverallNotes,
    addCustomerGeneralNote,
    updateCustomerGeneralNote,
    deleteCustomerGeneralNote,
    updateDrillNotes,
    customizationSettings,
  } = useCustomerContext();

  const noteCategories = customizationSettings?.notesConfig?.generalNoteCategories || [
    'General',
    'Client Call',
    'Meeting',
    'Escalation',
    'Compliance',
    'Handover',
    'Renewal',
  ];

  // Outline section filter: 'all' (complete outline 1 -> 2 -> 3), or focused section
  const [activeSection, setActiveSection] = useState<'all' | 'overall' | 'general' | 'drills'>('all');

  // --- Tier 1: Overall Notes State ---
  const [isEditingOverall, setIsEditingOverall] = useState(false);
  const [overallText, setOverallText] = useState(customer.notes || '');

  // --- Tier 2: General Notes State ---
  const [isAddingGeneral, setIsAddingGeneral] = useState(false);
  const [newGeneralContent, setNewGeneralContent] = useState('');
  const [newGeneralCategory, setNewGeneralCategory] = useState<GeneralNoteCategory>('General');
  const [generalSearchQuery, setGeneralSearchQuery] = useState('');
  const [generalCategoryFilter, setGeneralCategoryFilter] = useState<string>('all');
  const [editingGeneralId, setEditingGeneralId] = useState<string | null>(null);
  const [editingGeneralContent, setEditingGeneralContent] = useState('');
  const [editingGeneralCategory, setEditingGeneralCategory] = useState<GeneralNoteCategory>('General');

  // --- Tier 3: Drill Notes State ---
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [drillNotesText, setDrillNotesText] = useState('');
  const [drillSummaryText, setDrillSummaryText] = useState('');
  const [drillFindingsText, setDrillFindingsText] = useState('');
  const [drillRecsText, setDrillRecsText] = useState('');
  const [expandedDrills, setExpandedDrills] = useState<Record<string, boolean>>({});

  // Sync overall text when customer notes change
  React.useEffect(() => {
    setOverallText(customer.notes || '');
  }, [customer.notes]);

  const generalNotes = useMemo(() => {
    return (customer.generalNotes || []).slice().sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [customer.generalNotes]);

  const filteredGeneralNotes = useMemo(() => {
    return generalNotes.filter((note) => {
      const matchCat =
        generalCategoryFilter === 'all' || note.category === generalCategoryFilter;
      const matchQuery =
        !generalSearchQuery ||
        note.content.toLowerCase().includes(generalSearchQuery.toLowerCase()) ||
        (note.createdBy && note.createdBy.toLowerCase().includes(generalSearchQuery.toLowerCase())) ||
        note.category.toLowerCase().includes(generalSearchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [generalNotes, generalCategoryFilter, generalSearchQuery]);

  const currentPlan = customer.annualPlans[selectedYear];
  const drills = currentPlan ? currentPlan.drills : [];

  // Count drills with notes
  const drillsWithNotesCount = useMemo(() => {
    return drills.filter((d) => d.notes || d.summary || d.keyFindings).length;
  }, [drills]);

  // Handler: Save Overall Notes
  const handleSaveOverall = () => {
    updateCustomerOverallNotes(customer.id, overallText);
    setIsEditingOverall(false);
  };

  // Handler: Add Suggested Prompt to Overall Notes
  const handleAppendPrompt = (prompt: string) => {
    setOverallText((prev) => (prev ? `${prev}\n${prompt}` : prompt));
  };

  // Handler: Add General Note
  const handleAddGeneralNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGeneralContent.trim()) return;
    addCustomerGeneralNote(customer.id, {
      content: newGeneralContent,
      category: newGeneralCategory,
    });
    setNewGeneralContent('');
    setNewGeneralCategory('General');
    setIsAddingGeneral(false);
  };

  // Handler: Start Editing General Note
  const handleStartEditGeneral = (note: AccountGeneralNote) => {
    setEditingGeneralId(note.id);
    setEditingGeneralContent(note.content);
    setEditingGeneralCategory(note.category);
  };

  // Handler: Save Edited General Note
  const handleSaveEditGeneral = (noteId: string) => {
    if (!editingGeneralContent.trim()) return;
    updateCustomerGeneralNote(
      customer.id,
      noteId,
      editingGeneralContent,
      editingGeneralCategory
    );
    setEditingGeneralId(null);
  };

  // Handler: Delete General Note
  const handleDeleteGeneralNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this general note?')) {
      deleteCustomerGeneralNote(customer.id, noteId);
    }
  };

  // Handler: Start Editing Drill Notes
  const handleStartEditDrill = (drill: DrillRecord) => {
    setEditingDrillId(drill.id);
    setDrillNotesText(drill.notes || '');
    setDrillSummaryText(drill.summary || '');
    setDrillFindingsText(drill.keyFindings || '');
    setDrillRecsText(drill.recommendations || '');
  };

  // Handler: Save Drill Notes
  const handleSaveDrillNotes = (drillId: string) => {
    updateDrillNotes(customer.id, selectedYear, drillId, drillNotesText, {
      summary: drillSummaryText,
      keyFindings: drillFindingsText,
      recommendations: drillRecsText,
    });
    setEditingDrillId(null);
  };

  const toggleExpandDrill = (drillId: string) => {
    setExpandedDrills((prev) => ({
      ...prev,
      [drillId]: !prev[drillId],
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* ========================================================= */}
      {/* 0. HUB HEADER & OUTLINE NAVIGATION BAR                   */}
      {/* ========================================================= */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <FileText className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Customer Account Notes Hub
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {customer.companyName}
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Account-wise key notes outline: overall account objectives, general activity log, and drill-by-drill simulation debriefs.
            </p>
          </div>

          {/* Quick Outline Navigator Pills */}
          <div className="flex items-center gap-1.5 flex-wrap bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSection === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Outline (1 → 2 → 3)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSection === 'overall'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>1. Overall Notes</span>
              {customer.notes ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Overall notes recorded" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-500" title="Empty" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('general')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSection === 'general'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>2. General Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-blue-300 font-bold">
                {generalNotes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('drills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSection === 'drills'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>3. Drill-Wise Notes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-emerald-300 font-bold">
                {drillsWithNotesCount}/{drills.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-8">
        {/* ========================================================= */}
        {/* TIER 1: OVERALL NOTES FOR ACCOUNT                         */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'overall') && (
          <section id="section-overall-notes" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600 text-white text-xs font-black shadow-xs">
                  01
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Overall Notes for Account
                    {customer.cisoName && (
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        CISO: {customer.cisoName}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    High-level account objectives, executive mandates (RBI / ISO 27001), CISO instructions & SLA agreements.
                  </p>
                </div>
              </div>

              {/* Date Created & Audit Details */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                {customer.overallNotesCreatedAt && (
                  <div className="flex items-center gap-1 text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>
                      <strong className="font-semibold text-slate-700">Date Created:</strong>{' '}
                      {formatDateTimeDisplay(customer.overallNotesCreatedAt)}
                    </span>
                  </div>
                )}
                {customer.overallNotesUpdatedAt && customer.overallNotesUpdatedAt !== customer.overallNotesCreatedAt && (
                  <div className="flex items-center gap-1 text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                    <History className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>
                      <strong className="font-semibold text-slate-700">Updated:</strong>{' '}
                      {formatRelativeTime(customer.overallNotesUpdatedAt)}
                      {customer.overallNotesUpdatedBy && ` by ${customer.overallNotesUpdatedBy}`}
                    </span>
                  </div>
                )}

                {canEdit && !isEditingOverall && (
                  <button
                    type="button"
                    onClick={() => setIsEditingOverall(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{customer.notes ? 'Edit Overall Notes' : '+ Add Overall Notes'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Overall Notes Box: Read vs Edit Mode */}
            {isEditingOverall ? (
              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Editing Overall Account Key Notes & Objectives
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Will be saved with timestamp: {formatDisplayDate(referenceDate)}
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={overallText}
                  onChange={(e) => setOverallText(e.target.value)}
                  placeholder="Record customer specific requirements, compliance audit dates, internal handover notes, executive mandates..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-inner"
                />

                {/* Quick Prompts Helper */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Click to append standard security mandate:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAppendPrompt(prompt)}
                        className="text-[10px] bg-white hover:bg-blue-100 hover:text-blue-800 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition-colors font-medium text-left"
                      >
                        {prompt.split(':')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => {
                      setOverallText(customer.notes || '');
                      setIsEditingOverall(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOverall}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Overall Notes
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
                {customer.notes ? (
                  <div className="whitespace-pre-line text-slate-700 font-medium">
                    {customer.notes}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-500 py-1">
                    <p className="italic">
                      No overall account key notes or compliance requirements recorded yet.
                    </p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditingOverall(true)}
                        className="text-xs text-blue-600 hover:underline font-semibold text-left"
                      >
                        + Click here to establish overall account notes
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* TIER 2: GENERAL NOTES FOR ACCOUNT                         */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'general') && (
          <section id="section-general-notes" className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-600 text-white text-xs font-black shadow-xs">
                  02
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    General Notes Log
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {generalNotes.length} {generalNotes.length === 1 ? 'entry' : 'entries'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chronological timeline of operational updates, client discussions, check-ins, escalations, and handover memos.
                  </p>
                </div>
              </div>

              {/* Add Note Button & Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {canEdit && !isAddingGeneral && (
                  <button
                    type="button"
                    onClick={() => setIsAddingGeneral(true)}
                    className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add General Note</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter and Search Bar for General Notes */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={generalSearchQuery}
                  onChange={(e) => setGeneralSearchQuery(e.target.value)}
                  placeholder="Search general notes by keyword, topic, or author..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-medium">Category:</span>
                {(['all', ...noteCategories]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGeneralCategoryFilter(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-colors ${
                      generalCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Add General Note Form Card */}
            {isAddingGeneral && (
              <form
                onSubmit={handleAddGeneralNote}
                className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 space-y-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    Record New General Account Note
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Author: <strong className="text-slate-800">{currentUser.name}</strong> • Date Created: {formatDisplayDate(referenceDate)}
                  </span>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Note Category
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {noteCategories.map((cat) => {
                      const style = getCategoryStyle(cat);
                      const isSelected = newGeneralCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewGeneralCategory(cat)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : `${style.bg} ${style.text} ${style.border} hover:opacity-80`
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note Content Textarea */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Note Content & Observations *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newGeneralContent}
                    onChange={(e) => setNewGeneralContent(e.target.value)}
                    placeholder="Describe discussion details, action items, customer feedback, escalation notes, or operational updates..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-indigo-100">
                  <button
                    type="button"
                    onClick={() => {
                      setNewGeneralContent('');
                      setIsAddingGeneral(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post General Note
                  </button>
                </div>
              </form>
            )}

            {/* General Notes List */}
            {filteredGeneralNotes.length > 0 ? (
              <div className="space-y-3">
                {filteredGeneralNotes.map((note) => {
                  const style = getCategoryStyle(note.category);
                  const isEditingThis = editingGeneralId === note.id;

                  return (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all space-y-2 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Category and Date Created */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                          >
                            {note.category}
                          </span>

                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>
                              <strong className="font-semibold text-slate-800">Date Created:</strong>{' '}
                              {formatDateTimeDisplay(note.createdAt)}
                            </span>
                            <span className="text-slate-400">({formatRelativeTime(note.createdAt)})</span>
                          </div>

                          {note.updatedAt && note.updatedAt !== note.createdAt && (
                            <span className="text-[10px] text-slate-400 italic">
                              • Edited {formatRelativeTime(note.updatedAt)}
                            </span>
                          )}
                        </div>

                        {/* Author and Action Buttons */}
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1 text-slate-600 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700">{note.createdBy || 'Team Member'}</span>
                          </div>

                          {canEdit && !isEditingThis && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditGeneral(note)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                                title="Edit Note"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGeneralNote(note.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                title="Delete Note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Note Content / Inline Edit */}
                      {isEditingThis ? (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {noteCategories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setEditingGeneralCategory(cat)}
                                className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                                  editingGeneralCategory === cat
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={editingGeneralContent}
                            onChange={(e) => setEditingGeneralContent(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingGeneralId(null)}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditGeneral(note.id)}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pl-1">
                          {note.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                <p>
                  {generalSearchQuery || generalCategoryFilter !== 'all'
                    ? 'No general notes matching the active search or category filter.'
                    : 'No general account notes recorded yet.'}
                </p>
                {canEdit && !isAddingGeneral && (
                  <button
                    type="button"
                    onClick={() => setIsAddingGeneral(true)}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    + Record the first general note for {customer.companyName}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* TIER 3: DRILL-WISE NOTES & DEBRIEFS                       */}
        {/* ========================================================= */}
        {(activeSection === 'all' || activeSection === 'drills') && (
          <section id="section-drill-notes" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-black shadow-xs">
                  03
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Drill-Wise Notes & Debrief Records
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {selectedYear} Annual Plan • {drills.length} Drills
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cycle-by-cycle operational notes, lure observations, executive summaries, and debrief meeting outcomes.
                  </p>
                </div>
              </div>

              {/* Year Switcher */}
              {availableYears.length > 1 && onSelectYear && (
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  {availableYears.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => onSelectYear(yr)}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                        selectedYear === yr
                          ? 'bg-white text-emerald-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Drill Records List */}
            {drills.length > 0 ? (
              <div className="space-y-4">
                {drills.map((drill) => {
                  const status = computeDrillStatus(drill, referenceDate, dueSoonDays);
                  const isCompleted = status === 'Completed' || status === 'Completed Late';
                  const isEditingThisDrill = editingDrillId === drill.id;
                  const isExpanded = expandedDrills[drill.id] !== false; // Default expanded

                  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                    Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                    'Completed Late': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                    'Due Soon': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                    Upcoming: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    Overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                    Cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' },
                  };
                  const currentStatusStyle = statusColors[status] || statusColors.Upcoming;

                  return (
                    <div
                      key={drill.id}
                      className={`rounded-xl border transition-all ${
                        isCompleted
                          ? 'bg-white border-slate-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      } shadow-xs overflow-hidden`}
                    >
                      {/* Drill Header Bar */}
                      <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white shadow-xs">
                            Drill #{drill.drillNumber}
                          </span>

                          <span className="font-semibold text-xs text-slate-800">
                            {drill.title}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
                          >
                            {status}
                          </span>
                        </div>

                        {/* Date Stamps & Action */}
                        <div className="flex items-center gap-2.5 flex-wrap text-xs">
                          {/* Planned Target Date */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>Planned: <strong className="text-slate-800">{formatDisplayDate(drill.plannedDate)}</strong></span>
                          </div>

                          {/* Completed Date if completed */}
                          {drill.actualCompletionDate && (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Done: {formatDisplayDate(drill.actualCompletionDate)}</span>
                            </div>
                          )}

                          {/* Drill Notes Date Created Badge */}
                          {drill.notesCreatedAt ? (
                            <div className="flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>Notes Created: {formatDisplayDate(drill.notesCreatedAt)}</span>
                              {drill.notesCreatedBy && (
                                <span className="text-slate-400">({drill.notesCreatedBy})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No notes logged</span>
                          )}

                          {canEdit && !isEditingThisDrill && (
                            <button
                              type="button"
                              onClick={() => handleStartEditDrill(drill)}
                              className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>{drill.notes ? 'Edit Notes' : '+ Add Note'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleExpandDrill(drill.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Drill Body Content */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 text-xs">
                          {/* In-Line Editing Mode for this Drill */}
                          {isEditingThisDrill ? (
                            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                                  Editing Drill #{drill.drillNumber} Operational Notes
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Date Created / Stamped: {formatDisplayDate(referenceDate)} by {currentUser.name}
                                </span>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                  Drill Operational Notes *
                                </label>
                                <textarea
                                  rows={3}
                                  value={drillNotesText}
                                  onChange={(e) => setDrillNotesText(e.target.value)}
                                  placeholder="Campaign lure details, target employee groups, delivery challenges, whitelist confirmations, or observation notes..."
                                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Executive Summary (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={drillSummaryText}
                                    onChange={(e) => setDrillSummaryText(e.target.value)}
                                    placeholder="Brief outcome overview..."
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Key Findings (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={drillFindingsText}
                                    onChange={(e) => setDrillFindingsText(e.target.value)}
                                    placeholder="Departments vulnerable..."
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                                    Recommendations (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={drillRecsText}
                                    onChange={(e) => setDrillRecsText(e.target.value)}
                                    placeholder="Reinforce training..."
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                                <button
                                  type="button"
                                  onClick={() => setEditingDrillId(null)}
                                  className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveDrillNotes(drill.id)}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save Drill Notes
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Drill Notes Display Box */
                            <div className="space-y-2">
                              {/* 1. Operational Drill Notes */}
                              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                                  <span className="flex items-center gap-1.5 text-slate-900">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                    Drill Operational Notes
                                  </span>
                                  {drill.notesCreatedAt && (
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      Date Created: {formatDateTimeDisplay(drill.notesCreatedAt)}
                                      {drill.notesCreatedBy && ` by ${drill.notesCreatedBy}`}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                  {drill.notes || (
                                    <span className="italic text-slate-400">
                                      No operational notes recorded for this drill cycle yet.
                                    </span>
                                  )}
                                </p>
                              </div>

                              {/* 2. Simulation Metrics & Findings (if executed) */}
                              {(drill.summary || drill.keyFindings || drill.recommendations) && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                                  {drill.summary && (
                                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                                      <div className="font-semibold text-blue-950 text-[11px] mb-0.5">Executive Summary</div>
                                      <p className="text-slate-700 text-[11px] leading-snug">{drill.summary}</p>
                                    </div>
                                  )}
                                  {drill.keyFindings && (
                                    <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-100">
                                      <div className="font-semibold text-amber-950 text-[11px] mb-0.5">Key Findings</div>
                                      <p className="text-slate-700 text-[11px] leading-snug">{drill.keyFindings}</p>
                                    </div>
                                  )}
                                  {drill.recommendations && (
                                    <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100">
                                      <div className="font-semibold text-purple-950 text-[11px] mb-0.5">Recommendations</div>
                                      <p className="text-slate-700 text-[11px] leading-snug">{drill.recommendations}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* 3. Debrief Review Meeting Notes */}
                              {drill.reviewMeeting && drill.reviewMeeting.status !== 'Not Scheduled' && (
                                <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                      Debrief Review Meeting Notes
                                    </span>
                                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                      {drill.reviewMeeting.status}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-slate-700">
                                    <strong className="text-slate-900">Meeting Date:</strong>{' '}
                                    {drill.reviewMeeting.date ? formatDisplayDate(drill.reviewMeeting.date) : 'Pending'}{' '}
                                    {drill.reviewMeeting.participants && (
                                      <span>• Attendees: {drill.reviewMeeting.participants}</span>
                                    )}
                                  </div>

                                  {drill.reviewMeeting.discussionPoints && (
                                    <div className="text-[11px] text-slate-600">
                                      <span className="font-semibold text-slate-800">Discussion Points:</span>{' '}
                                      {drill.reviewMeeting.discussionPoints}
                                    </div>
                                  )}

                                  {drill.reviewMeeting.actionItems && (
                                    <div className="text-[11px] text-slate-600">
                                      <span className="font-semibold text-slate-800">Action Items:</span>{' '}
                                      {drill.reviewMeeting.actionItems}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs">
                No scheduled drills found for {selectedYear}.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
