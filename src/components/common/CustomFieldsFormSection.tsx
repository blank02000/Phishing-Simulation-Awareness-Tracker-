import React, { useState } from 'react';
import { CustomField, CustomFieldType } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  Plus,
  Trash2,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  FileText,
  Hash,
  Calendar,
  ListFilter,
  CheckSquare,
  AlignLeft,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CustomFieldsFormSectionProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  formTitle?: string;
  formType?: 'customer' | 'drill' | 'deliverable' | 'meeting' | 'user' | 'plan' | 'general';
  className?: string;
  compact?: boolean;
}

export const CustomFieldsFormSection: React.FC<CustomFieldsFormSectionProps> = ({
  fields = [],
  onChange,
  formTitle = 'Custom Fields',
  formType = 'general',
  className = '',
  compact = false,
}) => {
  const { currentUser } = useCustomerContext();
  const isAdmin = currentUser.role === 'Admin';

  const [isAddingField, setIsAddingField] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldType>('text');
  const [newOptions, setNewOptions] = useState('');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddField = () => {
    setError(null);
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) {
      setError('Please provide a field label or name.');
      return;
    }

    const key = trimmedLabel
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

    // Check for duplicate key
    const exists = fields.some((f) => f.key === key || f.label.toLowerCase() === trimmedLabel.toLowerCase());
    if (exists) {
      setError(`A field named "${trimmedLabel}" already exists in this form.`);
      return;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (newType === 'select') {
      parsedOptions = newOptions
        .split(',')
        .map((opt) => opt.trim())
        .filter(Boolean);
      if (parsedOptions.length === 0) {
        setError('Please enter at least two comma-separated options for the dropdown.');
        return;
      }
    }

    const createdField: CustomField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      key,
      label: trimmedLabel,
      type: newType,
      value: newType === 'boolean' ? false : '',
      options: parsedOptions,
      placeholder: newPlaceholder.trim() || undefined,
      required: newRequired,
    };

    onChange([...fields, createdField]);

    // Reset inline add modal/box
    setNewLabel('');
    setNewType('text');
    setNewOptions('');
    setNewPlaceholder('');
    setNewRequired(false);
    setIsAddingField(false);
  };

  const handleRemoveField = (fieldId: string) => {
    onChange(fields.filter((f) => f.id !== fieldId));
  };

  const handleFieldValueChange = (fieldId: string, value: any) => {
    onChange(
      fields.map((f) => (f.id === fieldId ? { ...f, value } : f))
    );
  };

  return (
    <div className={`rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 transition-all ${className}`}>
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                {formTitle}
              </h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100/90 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-2.5 h-2.5" />
                Admin Feature
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {isAdmin
                ? 'Add custom form fields dynamically to capture custom requirements.'
                : 'Custom form fields specified by your administrator.'}
            </p>
          </div>
        </div>

        {/* Add Field Button (Admin only) */}
        {isAdmin ? (
          <button
            type="button"
            id={`btn-add-field-${formType}`}
            onClick={() => setIsAddingField(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Add a new custom field to this form"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Field</span>
          </button>
        ) : (
          <span
            className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded"
            title="Only administrators can add new custom fields"
          >
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Admin-managed fields</span>
          </span>
        )}
      </div>

      {/* Admin Inline Creator Panel */}
      {isAddingField && isAdmin && (
        <div className="mt-3 p-3.5 bg-white rounded-xl border-2 border-purple-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-purple-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Configure New Form Field</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingField(false);
                setError(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field Label */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Field Label / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. PO Number, Escalation Contact, Risk Rating"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                autoFocus
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Field Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CustomFieldType)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="text">Short Text (Single Line)</option>
                <option value="textarea">Long Text / Paragraph</option>
                <option value="number">Number (Metric, Count, ID)</option>
                <option value="date">Date (Picker)</option>
                <option value="select">Dropdown Menu (List of Options)</option>
                <option value="boolean">Yes / No Switch (Checkbox)</option>
              </select>
            </div>

            {/* Dropdown Options if select */}
            {newType === 'select' && (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Dropdown Options <span className="text-rose-500">*</span>{' '}
                  <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="e.g. Tier 1, Tier 2, Tier 3 or Low, Medium, High, Critical"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            )}

            {/* Placeholder */}
            {newType !== 'boolean' && newType !== 'date' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Placeholder / Input Hint <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newPlaceholder}
                  onChange={(e) => setNewPlaceholder(e.target.value)}
                  placeholder="e.g. Enter PO code..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                />
              </div>
            )}

            {/* Required Toggle */}
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Mark as required field</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsAddingField(false);
                setError(null);
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-add-field"
              onClick={handleAddField}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Add Field</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Current Custom Fields List */}
      {fields.length > 0 ? (
        <div className={`mt-3 grid grid-cols-1 ${compact ? 'gap-2.5' : 'sm:grid-cols-2 gap-3'}`}>
          {fields.map((field) => (
            <div
              key={field.id}
              className={`p-2.5 rounded-lg border bg-white shadow-2xs relative group transition-all ${
                field.type === 'textarea' ? 'sm:col-span-2' : ''
              } border-slate-200 hover:border-slate-300`}
            >
              {/* Field Label Header with Type Icon & Delete Button */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate">
                  {field.type === 'text' && <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {field.type === 'number' && <Hash className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  {field.type === 'date' && <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  {field.type === 'select' && <ListFilter className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {field.type === 'boolean' && <CheckSquare className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                  {field.type === 'textarea' && <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  <span className="truncate">{field.label}</span>
                  {field.required && <span className="text-rose-500">*</span>}
                </label>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                    title={`Delete field "${field.label}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Input Renderers based on Field Type */}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  required={field.required}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  required={field.required}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors"
                >
                  <option value="">-- Select {field.label} --</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'boolean' && (
                <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs text-slate-700">
                    {field.value ? 'Yes / Enabled' : 'No / Disabled'}
                  </span>
                </label>
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter notes for ${field.label}...`}
                  rows={2}
                  required={field.required}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50 hover:bg-white transition-colors resize-y"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAddingField && (
          <div className="mt-2 text-center py-3 px-2 border border-dashed border-slate-200 rounded-lg bg-white/50">
            <p className="text-xs text-slate-400">
              No custom fields added yet.
              {isAdmin && (
                <span className="block mt-0.5 text-[11px] text-purple-600 font-medium">
                  Click <strong>+ Add Field</strong> above to configure custom data inputs for this form.
                </span>
              )}
            </p>
          </div>
        )
      )}
    </div>
  );
};
