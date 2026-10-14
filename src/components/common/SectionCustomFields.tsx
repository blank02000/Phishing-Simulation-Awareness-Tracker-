import React, { useState, useMemo } from 'react';
import { CustomField, CustomFieldType, FormFieldSection } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import { Plus, Trash2, Check, X, Sliders, AlertCircle } from 'lucide-react';

interface SectionCustomFieldsProps {
  section: FormFieldSection;
  customFields: CustomField[];
  onChange: (fields: CustomField[]) => void;
  gridColsClass?: string;
  showAddButton?: boolean;
  addButtonLabel?: string;
}

export const SectionCustomFields: React.FC<SectionCustomFieldsProps> = ({
  section,
  customFields = [],
  onChange,
  gridColsClass = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3',
  showAddButton = true,
  addButtonLabel,
}) => {
  const {
    currentUser,
    customizationSettings,
    addFormField,
    deleteFormField,
    canUserManageCustomization,
  } = useCustomerContext();
  const isAuthorized = currentUser.role === 'Admin' || canUserManageCustomization(currentUser);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldType | 'email' | 'tel'>('text');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newOptions, setNewOptions] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [newHelpText, setNewHelpText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 1. Source of Truth: All non-system, visible fields defined in customizationSettings for this section
  const schemaCustomFields = useMemo(() => {
    return (customizationSettings?.fields || [])
      .filter((f) => f.section === section && !f.isSystem && f.visible)
      .sort((a, b) => a.order - b.order);
  }, [customizationSettings?.fields, section]);

  // 2. Combine schema fields with current field values:
  // Every field in the schema is guaranteed to render in the form!
  const fieldsToRender = useMemo(() => {
    const list: CustomField[] = [];
    const seenKeys = new Set<string>();

    schemaCustomFields.forEach((sf) => {
      seenKeys.add(sf.key);
      const existingValObj = customFields.find((cf) => cf.key === sf.key || cf.id === sf.id);
      list.push({
        id: sf.id,
        key: sf.key,
        label: sf.label,
        type: sf.type as CustomFieldType,
        options: sf.options,
        placeholder: sf.placeholder,
        required: sf.required,
        value: existingValObj?.value !== undefined ? existingValObj.value : (sf.defaultValue ?? ''),
        section: sf.section,
        helpText: sf.helpText,
      });
    });

    // Also include any customFields explicitly passed in that belong to this section but are not in schema
    customFields.forEach((cf) => {
      if (cf.section === section && !seenKeys.has(cf.key)) {
        seenKeys.add(cf.key);
        list.push(cf);
      }
    });

    return list;
  }, [schemaCustomFields, customFields, section]);

  const handleFieldValueChange = (fieldDef: CustomField, val: any) => {
    const exists = customFields.some(
      (f) => (f.id && f.id === fieldDef.id) || f.key === fieldDef.key
    );
    let updated: CustomField[];
    if (exists) {
      updated = customFields.map((f) =>
        (f.id && f.id === fieldDef.id) || f.key === fieldDef.key
          ? {
              ...f,
              id: fieldDef.id,
              key: fieldDef.key,
              label: fieldDef.label,
              type: fieldDef.type,
              section: fieldDef.section,
              required: fieldDef.required,
              options: fieldDef.options,
              placeholder: fieldDef.placeholder,
              helpText: fieldDef.helpText,
              value: val,
            }
          : f
      );
    } else {
      updated = [...customFields, { ...fieldDef, value: val }];
    }
    onChange(updated);
  };

  const handleDeleteField = (id: string, key: string, label: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove the field "${label}" from the form? This will remove it from all forms in this section.`
      )
    ) {
      deleteFormField(id);
      onChange(customFields.filter((f) => f.id !== id && f.key !== key));
    }
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedLabel = newLabel.trim();
    if (!trimmedLabel) {
      setError('Please provide a field label.');
      return;
    }

    const baseKey = trimmedLabel
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || `field_${Date.now()}`;

    // Ensure unique key in schema
    let key = baseKey;
    let counter = 1;
    while (customizationSettings.fields.some((f) => f.key === key)) {
      key = `${baseKey}_${counter++}`;
    }

    let parsedOptions: string[] | undefined = undefined;
    if (newType === 'select') {
      parsedOptions = newOptions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsedOptions.length === 0) {
        setError('Please enter at least two comma-separated options for the select dropdown.');
        return;
      }
    }

    // 1. Directly add to customized fields schema in CustomerContext
    const createdField = addFormField({
      label: trimmedLabel,
      key,
      type: newType as CustomFieldType,
      section,
      required: newRequired,
      visible: true,
      placeholder: newPlaceholder.trim() || undefined,
      options: parsedOptions,
      helpText: newHelpText.trim() || undefined,
      isSystem: false,
    });

    // 2. Add to active form state values immediately using exact createdField ID
    const newFieldObj: CustomField = {
      id: createdField.id,
      key: createdField.key,
      label: createdField.label,
      type: createdField.type as CustomFieldType,
      value: newType === 'boolean' ? false : '',
      options: parsedOptions,
      placeholder: newPlaceholder.trim() || undefined,
      required: newRequired,
      section,
      helpText: newHelpText.trim() || undefined,
    };

    onChange([...customFields, newFieldObj]);

    // Reset and close
    setNewLabel('');
    setNewType('text');
    setNewPlaceholder('');
    setNewOptions('');
    setNewRequired(false);
    setNewHelpText('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Render All Custom Fields for this section directly in the form */}
      {fieldsToRender.length > 0 && (
        <div className={gridColsClass}>
          {fieldsToRender.map((field) => {
            const isTextarea = field.type === 'textarea';
            return (
              <div
                key={field.id || field.key}
                className={`relative group ${isTextarea ? 'sm:col-span-2 md:col-span-3' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 text-xs">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {field.helpText && (
                      <span className="text-[10px] text-slate-400" title={field.helpText}>
                        {field.helpText}
                      </span>
                    )}
                    {isAuthorized && (
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field.id, field.key, field.label)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                        title="Delete this field from form schema"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {field.type === 'select' ? (
                  <select
                    value={field.value ?? ''}
                    required={field.required}
                    onChange={(e) => handleFieldValueChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="">{field.placeholder || 'Select an option'}</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    value={field.value ?? ''}
                    required={field.required}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    onChange={(e) => handleFieldValueChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center gap-2.5 mt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!!field.value}
                      onClick={() => handleFieldValueChange(field, !field.value)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                        field.value ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                          field.value ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-slate-700 font-medium">
                      {field.value ? 'Yes / Enabled' : 'No / Disabled'}
                      {field.placeholder ? ` (${field.placeholder})` : ''}
                    </span>
                  </div>
                ) : (
                  <input
                    type={field.type === 'phone' || field.type === 'tel' ? 'tel' : field.type}
                    value={field.value ?? ''}
                    required={field.required}
                    placeholder={field.placeholder || `Enter ${field.label}...`}
                    onChange={(e) => handleFieldValueChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Authorized Inline Button to Add a Field directly to this section */}
      {isAuthorized && showAddButton && (
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition-colors cursor-pointer"
            title="Directly add a new customized field to this section schema"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addButtonLabel || `+ Add Field to ${formatSectionName(section)}`}</span>
          </button>
        </div>
      )}

      {/* Modal: Directly Add Field to Customized Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Add Customized Field
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Directly added to <span className="font-semibold text-blue-600">{formatSectionName(section)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateField} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Field Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTIN, Department, Alternate SPOC"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden"
                  >
                    <option value="text">Text (Single Line)</option>
                    <option value="number">Numeric</option>
                    <option value="date">Date Picker</option>
                    <option value="select">Dropdown Select</option>
                    <option value="textarea">Multi-line Text</option>
                    <option value="boolean">Yes / No Toggle</option>
                    <option value="email">Email Address</option>
                    <option value="tel">Phone / Contact</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    placeholder="e.g. Enter details..."
                    value={newPlaceholder}
                    onChange={(e) => setNewPlaceholder(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {newType === 'select' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Dropdown Options (comma-separated) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Option 1, Option 2, Option 3"
                    value={newOptions}
                    onChange={(e) => setNewOptions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Help Text / Guidance</label>
                <input
                  type="text"
                  placeholder="Optional hint displayed next to field"
                  value={newHelpText}
                  onChange={(e) => setNewHelpText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700 text-xs">
                    Mark this field as mandatory / required
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save to Customized Fields</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function formatSectionName(sec: FormFieldSection): string {
  switch (sec) {
    case 'accountDetails':
      return 'Customer Organization';
    case 'contacts':
      return 'CISO & Contacts';
    case 'licenseInfo':
      return 'License & Subscriptions';
    case 'generalNotes':
      return 'General Notes';
    case 'drillNotes':
      return 'Drill Notes';
    case 'userProfile':
      return 'User Profile';
    default:
      return 'Section';
  }
}
