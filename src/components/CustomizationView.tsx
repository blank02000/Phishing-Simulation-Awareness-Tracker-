import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  FormFieldCustomization,
  FormFieldSection,
  CustomFieldType,
  NotesCustomizationConfig,
  LicenseCustomizationConfig,
} from '../types';
import { LicenseExpiryTrackerSection } from './LicenseExpiryTrackerSection';
import {
  Sliders,
  LayoutGrid,
  FileText,
  Key,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  Save,
  Tag,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const CustomizationView: React.FC = () => {
  const {
    currentUser,
    customizationSettings,
    addFormField,
    updateFormField,
    deleteFormField,
    reorderFormField,
    updateNotesConfig,
    updateLicenseConfig,
    resetCustomizationToDefault,
    canUserManageCustomization,
  } = useCustomerContext();

  const isAuthorized = canUserManageCustomization(currentUser);

  const [activeTab, setActiveTab] = useState<'fields' | 'notes' | 'licenses' | 'tracker' | 'preview'>(
    'fields'
  );
  const [selectedSection, setSelectedSection] = useState<FormFieldSection>('accountDetails');
  const [savedToast, setSavedToast] = useState(false);

  // Add Field Modal State
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType | 'email' | 'tel'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldHelpText, setNewFieldHelpText] = useState('');

  // Edit Field Modal State
  const [editingField, setEditingField] = useState<FormFieldCustomization | null>(null);

  // New Note Category Input
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // New Upload Format Input
  const [newFormatInput, setNewFormatInput] = useState('');

  const sectionFields = customizationSettings.fields
    .filter((f) => f.section === selectedSection)
    .sort((a, b) => a.order - b.order);

  const handleShowSaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const rawKey =
      newFieldKey.trim() ||
      newFieldLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '_');

    const baseKey = rawKey.replace(/_+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`;
    let generatedKey = baseKey;
    let counter = 1;
    while (customizationSettings.fields.some((f) => f.key === generatedKey)) {
      generatedKey = `${baseKey}_${counter++}`;
    }

    const optionsArray =
      newFieldType === 'select'
        ? newFieldOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    addFormField({
      label: newFieldLabel.trim(),
      key: generatedKey,
      type: newFieldType,
      section: selectedSection,
      required: newFieldRequired,
      visible: true,
      placeholder: newFieldPlaceholder.trim() || undefined,
      options: optionsArray,
      helpText: newFieldHelpText.trim() || undefined,
      isSystem: false,
    });

    setIsAddFieldOpen(false);
    setNewFieldLabel('');
    setNewFieldKey('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldPlaceholder('');
    setNewFieldOptions('');
    setNewFieldHelpText('');
    handleShowSaved();
  };

  const handleSaveEditedField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    updateFormField(editingField.id, {
      label: editingField.label,
      placeholder: editingField.placeholder,
      required: editingField.required,
      options: editingField.options,
      helpText: editingField.helpText,
    });

    setEditingField(null);
    handleShowSaved();
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const current = customizationSettings.notesConfig.generalNoteCategories || [];
    if (!current.includes(newCategoryInput.trim())) {
      updateNotesConfig({
        generalNoteCategories: [...current, newCategoryInput.trim()],
      });
      setNewCategoryInput('');
      handleShowSaved();
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const current = customizationSettings.notesConfig.generalNoteCategories || [];
    updateNotesConfig({
      generalNoteCategories: current.filter((c) => c !== cat),
    });
    handleShowSaved();
  };

  const handleAddUploadFormat = () => {
    let fmt = newFormatInput.trim().toLowerCase();
    if (!fmt) return;
    if (!fmt.startsWith('.')) fmt = '.' + fmt;
    const current = customizationSettings.licenseConfig.allowedUploadFormats || [];
    if (!current.includes(fmt)) {
      updateLicenseConfig({
        allowedUploadFormats: [...current, fmt],
      });
      setNewFormatInput('');
      handleShowSaved();
    }
  };

  const handleRemoveUploadFormat = (fmt: string) => {
    const current = customizationSettings.licenseConfig.allowedUploadFormats || [];
    updateLicenseConfig({
      allowedUploadFormats: current.filter((f) => f !== fmt),
    });
    handleShowSaved();
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to restore all Customer Account forms, fields, notes, and license policies to default system values?'
      )
    ) {
      resetCustomizationToDefault();
      handleShowSaved();
    }
  };

  return (
    <div className="space-y-6 pb-20" id="customization-view-root">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
              <Sliders className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Customer Account Customization
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure form fields, contacts, notes tiers, and license automation policies without code modification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedToast && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Settings Synced</span>
            </div>
          )}

          {isAuthorized && (
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Revert all fields to system defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          )}

          <div className="px-3 py-1.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>{currentUser.role === 'Admin' ? 'Admin Access' : 'Authorized Role'}</span>
          </div>
        </div>
      </div>

      {!isAuthorized && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            You are viewing customization settings in Read-Only mode. Administrator permissions are required to modify schema and policies.
          </span>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('fields')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'fields'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Form Fields Designer</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'fields' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {customizationSettings.fields.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'notes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Notes Customization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('licenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'licenses'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>License Provisioning & Policies</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'tracker'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Live License Expiry Tracker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'preview'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Preview Live Forms</span>
        </button>
      </div>

      {/* TAB 1: FORM FIELDS DESIGNER */}
      {activeTab === 'fields' && (
        <div className="space-y-5">
          {/* Section Picker Pills */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2 pr-1">
              Section:
            </span>
            {(
              [
                { id: 'accountDetails', label: '🏢 Account Details' },
                { id: 'contacts', label: '👤 CISO & Account Contacts' },
                { id: 'licenseInfo', label: '📜 License Information' },
                { id: 'generalNotes', label: '📝 General Account Notes' },
                { id: 'drillNotes', label: '🎯 Drill-Wise Notes' },
                { id: 'userProfile', label: '👥 Team & User Accounts' },
              ] as { id: FormFieldSection; label: string }[]
            ).map((sec) => {
              const isSelected = selectedSection === sec.id;
              const count = customizationSettings.fields.filter((f) => f.section === sec.id).length;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{sec.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-700 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Field Manager Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedSection === 'accountDetails' && 'Account & Profile Details Fields'}
                {selectedSection === 'contacts' && 'CISO Contact & Primary Account Contact Fields'}
                {selectedSection === 'licenseInfo' && 'License & Enterprise Contract Fields'}
                {selectedSection === 'generalNotes' && 'General Account Activity Log Fields'}
                {selectedSection === 'drillNotes' && 'Drill-Wise Operational Notes Fields'}
                {selectedSection === 'userProfile' && 'User Profile & Team Account Fields'}
              </h3>
              <p className="text-xs text-slate-500">
                Reorder fields, configure mandatory requirements, toggle visibility, or add custom attributes.
              </p>
            </div>

            {isAuthorized && (
              <button
                type="button"
                onClick={() => setIsAddFieldOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Field</span>
              </button>
            )}
          </div>

          {/* Fields List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-200 overflow-hidden">
            {sectionFields.map((field, idx) => (
              <div
                key={field.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  !field.visible ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Field Details */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0 || !isAuthorized}
                      onClick={() => reorderFormField(field.id, 'up')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{field.order}
                    </span>
                    <button
                      type="button"
                      disabled={idx === sectionFields.length - 1 || !isAuthorized}
                      onClick={() => reorderFormField(field.id, 'down')}
                      className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">{field.label}</span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {field.key}
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-200">
                        {field.type}
                      </span>
                      {field.isSystem ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          System
                        </span>
                      ) : (
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                          Custom
                        </span>
                      )}
                    </div>
                    {field.placeholder && (
                      <p className="text-xs text-slate-400 mt-0.5 italic">
                        Placeholder: "{field.placeholder}"
                      </p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-semibold">Options:</span>
                        {field.options.slice(0, 4).map((opt) => (
                          <span
                            key={opt}
                            className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded"
                          >
                            {opt}
                          </span>
                        ))}
                        {field.options.length > 4 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            +{field.options.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Field Controls */}
                <div className="flex items-center gap-3">
                  {/* Required Toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      disabled={!isAuthorized}
                      checked={field.required}
                      onChange={(e) => updateFormField(field.id, { required: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Required</span>
                  </label>

                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    disabled={!isAuthorized}
                    onClick={() => updateFormField(field.id, { visible: !field.visible })}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1 ${
                      field.visible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                    }`}
                    title={field.visible ? 'Field is visible in forms' : 'Field is hidden from forms'}
                  >
                    {field.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{field.visible ? 'Visible' : 'Hidden'}</span>
                  </button>

                  {/* Edit Properties Button */}
                  {isAuthorized && (
                    <button
                      type="button"
                      onClick={() => setEditingField(field)}
                      className="px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}

                  {/* Delete Button (Only for Custom fields) */}
                  {isAuthorized && !field.isSystem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove custom field "${field.label}"?`)) {
                          deleteFormField(field.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Custom Field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NOTES CUSTOMIZATION */}
      {activeTab === 'notes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <span>General Account Notes Categories</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure allowed note interaction categories for account logs (e.g. client meetings, escalations, audits).
              </p>
            </div>

            {/* Categories Tag Manager */}
            <div className="flex flex-wrap gap-2 items-center">
              {customizationSettings.notesConfig.generalNoteCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <span>{cat}</span>
                  {isAuthorized && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-indigo-400 hover:text-rose-600 transition-colors"
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}

              {isAuthorized && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>

            {/* Note Templates & Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Activity Note Template
                </label>
                <textarea
                  rows={4}
                  disabled={!isAuthorized}
                  value={customizationSettings.notesConfig.generalNotesDefaultTemplate}
                  onChange={(e) =>
                    updateNotesConfig({ generalNotesDefaultTemplate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  placeholder="Scaffold text for new activity notes..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Drill Operational Notes Prompt
                </label>
                <textarea
                  rows={4}
                  disabled={!isAuthorized}
                  value={customizationSettings.notesConfig.drillNotesPrompt}
                  onChange={(e) => updateNotesConfig({ drillNotesPrompt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  placeholder="Instructions for drill debrief and operational notes..."
                />
              </div>
            </div>

            {/* Overall Mandate Notes Customization */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Key Mandate (Overall Notes) Placeholder Guidance
              </label>
              <input
                type="text"
                disabled={!isAuthorized}
                value={customizationSettings.notesConfig.overallNotesPlaceholder}
                onChange={(e) => updateNotesConfig({ overallNotesPlaceholder: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LICENSE CONFIGURATION & POLICIES */}
      {activeTab === 'licenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <span>Automatic License Provisioning & Upload Rules</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control auto-generation of digital certificates on customer onboarding and enforce document upload standards.
              </p>
            </div>

            {/* Auto Creation Card */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Automatic License Creation on Customer Registration
                  </h4>
                  <p className="text-xs text-emerald-800">
                    When enabled, saving a new customer automatically provisions a digital certificate and assigned License Key.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAuthorized}
                    checked={customizationSettings.licenseConfig.autoGenerateOnCustomerCreation}
                    onChange={(e) =>
                      updateLicenseConfig({ autoGenerateOnCustomerCreation: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    License Key Prefix
                  </label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.licenseKeyPrefix}
                    onChange={(e) => updateLicenseConfig({ licenseKeyPrefix: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Validity Duration
                  </label>
                  <select
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.defaultValidityMonths}
                    onChange={(e) =>
                      updateLicenseConfig({ defaultValidityMonths: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Plan Edition
                  </label>
                  <input
                    type="text"
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.defaultPlanTier}
                    onChange={(e) => updateLicenseConfig({ defaultPlanTier: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload Configuration */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">
                License File Upload Specifications
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allowed Document Formats
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {customizationSettings.licenseConfig.allowedUploadFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-200"
                    >
                      <span>{fmt}</span>
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadFormat(fmt)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  ))}

                  {isAuthorized && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder=".ext"
                        value={newFormatInput}
                        onChange={(e) => setNewFormatInput(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded-lg text-xs w-20 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddUploadFormat}
                        className="px-2.5 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maximum Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.maxUploadSizeMb}
                    onChange={(e) =>
                      updateLicenseConfig({ maxUploadSizeMb: Number(e.target.value) })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-require-expiry"
                    disabled={!isAuthorized}
                    checked={customizationSettings.licenseConfig.requireExpiryDateOnUpload}
                    onChange={(e) =>
                      updateLicenseConfig({ requireExpiryDateOnUpload: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="chk-require-expiry" className="font-semibold text-slate-700">
                    Mandatory Expiry Date on Upload
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-require-key"
                    disabled={!isAuthorized}
                    checked={customizationSettings.licenseConfig.requireLicenseKeyOnUpload}
                    onChange={(e) =>
                      updateLicenseConfig({ requireLicenseKeyOnUpload: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <label htmlFor="chk-require-key" className="font-semibold text-slate-700">
                    Mandatory License Key Identifier
                  </label>
                </div>
              </div>
            </div>

            {/* Expiry Tracking Thresholds */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">
                License Expiry Monitoring & Alert Thresholds
              </h4>
              <p className="text-xs text-slate-500">
                Determines when licenses trigger amber "Expiring Soon" countdown badges and notification alerts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Warning Threshold (Days Before Expiry)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.expiryWarningThresholdDays}
                    onChange={(e) =>
                      updateLicenseConfig({
                        expiryWarningThresholdDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Licenses with remaining days below this value will display amber countdown badges.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Critical Threshold (Days Before Expiry)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    disabled={!isAuthorized}
                    value={customizationSettings.licenseConfig.expiryCriticalThresholdDays}
                    onChange={(e) =>
                      updateLicenseConfig({
                        expiryCriticalThresholdDays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Triggers urgent renewal callouts across the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE EXPIRY TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <LicenseExpiryTrackerSection />
        </div>
      )}

      {/* TAB 5: PREVIEW LIVE FORMS */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <span>Dynamic Form Engine Interactive Sandbox</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live preview of how customized fields render across Customer Account registration and update views.
            </p>
          </div>

          <div className="space-y-6 max-w-3xl">
            {/* Account Details Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Account & Profile Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizationSettings.fields
                  .filter((f) => f.section === 'accountDetails' && f.visible)
                  .map((f) => (
                    <div key={f.id} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      ) : f.type === 'select' ? (
                        <select className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                          {(f.options || ['Standard', 'Other']).map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Contacts Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>CISO & Primary Account Contacts</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizationSettings.fields
                  .filter((f) => f.section === 'contacts' && f.visible)
                  .map((f) => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* License & Subscriptions Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>License & Enterprise Subscriptions</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizationSettings.fields
                  .filter((f) => f.section === 'licenseInfo' && f.visible)
                  .map((f) => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      {f.type === 'select' ? (
                        <select className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                          {(f.options || ['Standard Tier']).map((opt) => (
                            <option key={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* General Notes Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>General Account Notes & Interaction Logs</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizationSettings.fields
                  .filter((f) => f.section === 'generalNotes' && f.visible)
                  .map((f) => (
                    <div key={f.id} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <input
                          type={f.type}
                          placeholder={f.placeholder}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* User Profile Block */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                <span>Team & User Account Profile</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customizationSettings.fields
                  .filter((f) => f.section === 'userProfile' && f.visible)
                  .map((f) => (
                    <div key={f.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {f.label} {f.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Field Modal */}
      {isAddFieldOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h4 className="text-sm font-bold">Add Custom Form Field</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateField} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Field Display Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Risk Classification Level"
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value);
                    if (!newFieldKey) {
                      setNewFieldKey(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-zA-Z0-9]/g, '_')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Field Attribute Key (Internal ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. risk_classification_level"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="text">Text (Single Line)</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone / Tel</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown (Select)</option>
                    <option value="textarea">Multi-line Text</option>
                    <option value="boolean">Toggle / Checkbox</option>
                  </select>
                </div>

                <div className="pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Mandatory Required</span>
                  </label>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropdown Options (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="High, Medium, Low, Critical"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placeholder Text</label>
                <input
                  type="text"
                  placeholder="e.g. Select risk level..."
                  value={newFieldPlaceholder}
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFieldOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Existing Field Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">Edit Field Properties: {editingField.label}</h4>
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditedField} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Label</label>
                <input
                  type="text"
                  required
                  value={editingField.label}
                  onChange={(e) =>
                    setEditingField({ ...editingField, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placeholder Text</label>
                <input
                  type="text"
                  value={editingField.placeholder || ''}
                  onChange={(e) =>
                    setEditingField({ ...editingField, placeholder: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {editingField.type === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Options (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingField.options?.join(', ') || ''}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingField.required}
                    onChange={(e) =>
                      setEditingField({ ...editingField, required: e.target.checked })
                    }
                    className="rounded text-blue-600"
                  />
                  <span>Mandatory Required</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-3 py-1.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
