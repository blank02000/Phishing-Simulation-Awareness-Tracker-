import React, { useState } from 'react';
import { CustomField, CustomFieldType } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  Plus,
  Trash2,
  Check,
  X,
  SlidersHorizontal,
  AlertCircle,
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

  // If no fields and not adding, render a clean, understated button
  if (fields.length === 0 && !isAddingField) {
    if (!isAdmin) return null;
    return (
      <div className={`pt-3 border-t border-slate-100 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{formTitle}</span>
        </div>
        <button
          type="button"
          id={`btn-add-field-${formType}`}
          onClick={() => setIsAddingField(true)}
          className="text-xs font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-emerald-600" />
          <span>+ Add Custom Field</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`pt-3 border-t border-slate-100 space-y-3 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            {formTitle}
          </span>
          {fields.length > 0 && (
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
              {fields.length}
            </span>
          )}
        </div>

        {isAdmin && !isAddingField && (
          <button
            type="button"
            id={`btn-add-field-${formType}`}
            onClick={() => setIsAddingField(true)}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Add a custom form field"
          >
            <Plus className="w-3 h-3 text-emerald-600" />
            <span>+ Add Field</span>
          </button>
        )}
      </div>

      {/* Admin Inline Creator Panel */}
      {isAddingField && isAdmin && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure New Form Field</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsAddingField(false);
                setError(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
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
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  placeholder="e.g. Enter details..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Mark as required field</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsAddingField(false);
                setError(null);
              }}
              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-add-field"
              onClick={handleAddField}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm & Add Field</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Current Custom Fields List — Perfectly matching native form styling */}
      {fields.length > 0 && (
        <div className={`grid grid-cols-1 ${compact ? 'gap-3' : 'sm:grid-cols-2 gap-4'}`}>
          {fields.map((field) => (
            <div
              key={field.id}
              className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
            >
              {/* Field Label Header with Delete Button */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 truncate">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title={`Delete field "${field.label}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Native Input Renderers */}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 hover:bg-white transition-colors"
                />
              )}

              {field.type === 'select' && (
                <select
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 hover:bg-white transition-colors"
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
                <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/30 cursor-pointer select-none hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(field.value)}
                    onChange={(e) => handleFieldValueChange(field.id, e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    {field.value ? 'Yes / Enabled' : 'No / Disabled'}
                  </span>
                </label>
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={field.value ?? ''}
                  onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  rows={2}
                  required={field.required}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/30 resize-none hover:bg-white transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
