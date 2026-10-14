import React from 'react';
import { CustomField, FormFieldSection } from '../../types';
import { SlidersHorizontal, CheckCircle, XCircle } from 'lucide-react';

interface CustomFieldsDisplayProps {
  fields?: CustomField[];
  title?: string;
  className?: string;
  section?: FormFieldSection;
}

export const CustomFieldsDisplay: React.FC<CustomFieldsDisplayProps> = ({
  fields,
  title = 'Custom Fields',
  className = '',
  section,
}) => {
  if (!fields || fields.length === 0) return null;

  const filteredFields = section
    ? fields.filter((f) => (f.section ? f.section === section : section === 'accountDetails'))
    : fields;

  if (filteredFields.length === 0) return null;

  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredFields.map((field) => {
          let displayValue: React.ReactNode = '-';
          if (field.type === 'boolean') {
            displayValue = field.value ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" /> Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                <XCircle className="w-3.5 h-3.5" /> No
              </span>
            );
          } else if (field.value !== undefined && field.value !== null && field.value !== '') {
            displayValue = String(field.value);
          }

          return (
            <div
              key={field.id}
              className={`p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs ${
                field.type === 'textarea' ? 'sm:col-span-2 md:col-span-3' : ''
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {field.label}
              </div>
              <div className="text-xs font-semibold text-slate-800 break-words whitespace-pre-wrap">
                {displayValue}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
