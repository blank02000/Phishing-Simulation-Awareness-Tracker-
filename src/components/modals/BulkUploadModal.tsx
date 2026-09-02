import React, { useState } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, AlertTriangle, FileText, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DrillType, Customer } from '../../types';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ValidationResult {
  rowIndex: number;
  accountName: string;
  startDate: string;
  endDate: string;
  spocName: string;
  spocContact: string;
  spocEmail: string;
  drillTypes: string[];
  products: string[];
  isValid: boolean;
  errors: string[];
  suggestions: string[];
  isDuplicate: boolean;
  rawRow: any;
}

const VALID_DRILL_TYPES = [
  'Phishing Simulation',
  'Spear Phishing / Executive',
  'Smishing Simulation',
  'Vishing Simulation',
  'Credential Harvesting',
  'Ransomware Awareness',
  'USB Drop / Physical',
  'Social Engineering Call',
  'Custom Drill',
];

const VALID_PRODUCTS = ['Phishing', 'LMS', 'Awareness Content', 'ProPatro', 'ProPhish', 'ProLMS'];

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { allCustomers, bulkImportCustomers, users } = useCustomerContext();
  const [file, setFile] = useState<File | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessCount(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseAndValidateFile(selectedFile);
  };

  const parseAndValidateFile = (uploadFile: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setError('The uploaded file contains no rows or valid data.');
          setValidationResults([]);
          setIsProcessing(false);
          return;
        }

        const results: ValidationResult[] = [];
        const seenAccountNames = new Set<string>();

        json.forEach((row, idx) => {
          const rowIndex = idx + 2; // Excel row numbering (1-indexed + header)
          const accountName = String(
            row['Customer Name'] || row['Account Name'] || row.companyName || row.company || ''
          ).trim();
          const startDate = String(
            row['License Start Date'] || row['Start Date'] || row.startDate || ''
          ).trim();
          const endDate = String(
            row['License End Date'] || row['End Date'] || row.endDate || ''
          ).trim();
          const spocName = String(
            row['SPOC Name'] || row.spocName || row['Customer Contact'] || row.customerContact || ''
          ).trim();
          const spocContact = String(
            row['SPOC Contact'] || row.spocContact || row['Contact Phone'] || row.contactPhone || row.phone || ''
          ).trim();
          const spocEmail = String(
            row['SPOC Email'] || row.spocEmail || row['Contact Email'] || row.contactEmail || row.email || ''
          ).trim();
          const drillTypesRaw = String(
            row['Drill Types'] || row.drillTypes || row['Default Drill Type'] || row.defaultDrillType || 'Phishing Simulation'
          );
          const productsRaw = String(
            row['Products'] || row['Product Subscription'] || row.products || 'ProPhish, ProLMS'
          );

          // Parse multi-values (comma or semicolon delimited)
          const drillTypes = drillTypesRaw
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          const products = productsRaw
            .split(/[,;]+/)
            .map((s) => s.trim())
            .filter(Boolean);

          const errors: string[] = [];
          const suggestions: string[] = [];

          // 1. Account Name / Customer Name required
          if (!accountName) {
            errors.push('Customer Name / Account Name is required.');
            suggestions.push('Provide a valid company or organization name.');
          }

          // 2. Start Date required & valid
          if (!startDate) {
            errors.push('License Start Date is required.');
            suggestions.push('Format as YYYY-MM-DD or DD-MM-YYYY.');
          }

          // 3. End Date required & valid
          if (!endDate) {
            errors.push('License End Date is required.');
            suggestions.push('Format as YYYY-MM-DD or DD-MM-YYYY.');
          }

          // Date chronology validation
          if (startDate && endDate) {
            const startMs = Date.parse(startDate);
            const endMs = Date.parse(endDate);
            if (!isNaN(startMs) && !isNaN(endMs) && startMs >= endMs) {
              errors.push('License Start Date must be before End Date.');
              suggestions.push('Ensure End Date is chronologically later than Start Date.');
            }
          }

          // 4. SPOC Name required
          if (!spocName) {
            errors.push('SPOC Name is required.');
            suggestions.push('Enter primary point of contact full name.');
          }

          // 5. Email validation if provided
          if (spocEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(spocEmail)) {
              errors.push('Invalid SPOC Email format.');
              suggestions.push('Enter a valid email address (e.g. name@domain.com).');
            }
          }

          // 6. At least one product required & valid
          if (products.length === 0) {
            errors.push('At least one Product or Subscription is required.');
            suggestions.push('Select from ProPhish, ProLMS, Awareness Content, ProPatrol.');
          }

          // 7. Duplicate detection
          let isDuplicate = false;
          if (accountName) {
            const lowerName = accountName.toLowerCase();
            const existsInDb = allCustomers.some((c) => c.companyName.toLowerCase() === lowerName);
            const existsInFile = seenAccountNames.has(lowerName);

            if (existsInDb || existsInFile) {
              isDuplicate = true;
              errors.push(`Customer Name "${accountName}" already exists.`);
              suggestions.push('Use a unique customer name or enable update existing customers.');
            } else {
              seenAccountNames.add(lowerName);
            }
          }

          results.push({
            rowIndex,
            accountName,
            startDate,
            endDate,
            spocName,
            spocContact,
            spocEmail,
            drillTypes,
            products,
            isValid: errors.length === 0,
            errors,
            suggestions,
            isDuplicate,
            rawRow: row,
          });
        });

        setValidationResults(results);
        setActiveTab('preview');
        setIsProcessing(false);
      } catch (err) {
        console.error('Error parsing file:', err);
        setError('Failed to parse ProGist License File. Please check the file format.');
        setValidationResults([]);
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(uploadFile);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Customer Name': 'Acme Corporation',
        'License Start Date': '2026-09-01',
        'License End Date': '2027-08-31',
        'Product Plan': 'Enterprise Pro',
        'Product Subscription': 'ProPhish & ProLMS',
        'Admin/UserAccess Provisioned (No. of Users)': 1300,
        'Managed Drill Frequency (Monthly/Quarterly/Half yearly/yearly)': 'Quarterly',
        'Drill Types': 'Phishing Simulation; Smishing Simulation',
        'Approx. number of employees that needs to be targeted': 500,
        'Tiering (1/2/3)': '1',
        'Company sector': 'Conglomerate',
        'Direct Sale/via Partner': 'Direct',
        'Country': 'India',
        'Activation Status': 'Activated',
        'Last Date for Repeat Orders/End of Maintenance Charges': '2027-08-01',
        'SPOC Name': 'Rahul Sharma',
        'SPOC Contact': '9876543210',
        'SPOC Email': 'rahul@acme.com',
        'Products': 'ProPhish, ProLMS',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProGistLicenseFile');
    XLSX.writeFile(workbook, 'progist_license_file_template.xlsx');
  };

  const handleDownloadErrorReport = () => {
    const invalidRows = validationResults.filter((r) => !r.isValid);
    if (invalidRows.length === 0) return;

    const errorReportData = invalidRows.map((r) => ({
      'Row Number': r.rowIndex,
      'Customer Name': r.accountName || '[Missing]',
      'Validation Errors': r.errors.join(' | '),
      'Suggested Correction': r.suggestions.join(' | '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorReportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportErrors');
    XLSX.writeFile(workbook, 'progist_import_error_report.xlsx');
  };

  const validRows = validationResults.filter((r) => r.isValid);
  const invalidRows = validationResults.filter((r) => !r.isValid);
  const duplicateRows = validationResults.filter((r) => r.isDuplicate);

  const handleConfirmImport = () => {
    if (validRows.length === 0) return;

    const rowsToImport = validRows.map((r) => ({
      ...r.rawRow,
      'Customer Name': r.accountName,
      'License Start Date': r.startDate,
      'License End Date': r.endDate,
      'SPOC Name': r.spocName,
      'SPOC Contact': r.spocContact,
      'SPOC Email': r.spocEmail,
      'Drill Types': r.drillTypes,
      'Products': r.products,
    }));

    const count = bulkImportCustomers(rowsToImport);
    setSuccessCount(count);
    setTimeout(() => {
      onClose();
      setFile(null);
      setValidationResults([]);
      setSuccessCount(null);
      setActiveTab('upload');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">ProGist License File Bulk Upload</h3>
              <p className="text-xs text-slate-400">Import multi-product ProPHISH, ProLMS, and Propatrol license files</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {successCount !== null ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Successfully Imported {successCount} License Accounts!</h4>
              <p className="text-xs text-slate-500">All customer accounts, license schedules, and annual timelines have been created.</p>
            </div>
          ) : (
            <>
              {/* Top Banner / Template Download */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">ProGist License File Template</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Download the official ProGist License File Excel template containing ProPHISH, ProLMS, Tiering, and SPOC information fields.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" /> Download License Template
                </button>
              </div>

              {/* Navigation Tabs if file uploaded */}
              {validationResults.length > 0 && (
                <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`pb-2.5 border-b-2 transition-colors ${
                      activeTab === 'upload' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    1. File Upload & Dropzone
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                      activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    2. Validation & Preview
                    {invalidRows.length > 0 ? (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px]">
                        {invalidRows.length} Errors
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">
                        Ready
                      </span>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'upload' ? (
                <>
                  {/* File Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/50 transition-colors relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-xs">
                        {isProcessing ? <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {file ? file.name : 'Click to upload or drag & drop ProGist License Excel / CSV file'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Supports .xlsx, .xls, and .csv formats</p>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {validationResults.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800">License File Parsed & Validated Successfully</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Total Rows: {validationResults.length} | Valid: {validRows.length} | Errors: {invalidRows.length}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        View Validation Preview &rarr;
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[11px] font-medium text-slate-500">Total Rows</p>
                      <p className="text-lg font-bold text-slate-900 mt-0.5">{validationResults.length}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-[11px] font-medium text-emerald-700">Ready to Import</p>
                      <p className="text-lg font-bold text-emerald-900 mt-0.5">{validRows.length}</p>
                    </div>
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                      <p className="text-[11px] font-medium text-rose-700">Failed / Errors</p>
                      <p className="text-lg font-bold text-rose-900 mt-0.5">{invalidRows.length}</p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] font-medium text-amber-700">Duplicates</p>
                      <p className="text-lg font-bold text-amber-900 mt-0.5">{duplicateRows.length}</p>
                    </div>
                  </div>

                  {invalidRows.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Invalid license rows detected. Only valid rows will be imported, or you can download the error report.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadErrorReport}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        Download Error Report
                      </button>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-2.5 font-semibold">Row</th>
                          <th className="p-2.5 font-semibold">Customer Name</th>
                          <th className="p-2.5 font-semibold">License Dates</th>
                          <th className="p-2.5 font-semibold">SPOC</th>
                          <th className="p-2.5 font-semibold">Products / Plan</th>
                          <th className="p-2.5 font-semibold">Status / Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {validationResults.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50'}>
                            <td className="p-2.5 font-mono text-slate-500">#{row.rowIndex}</td>
                            <td className="p-2.5 font-medium text-slate-900">{row.accountName || '[Missing Name]'}</td>
                            <td className="p-2.5 text-slate-600 text-[11px]">
                              {row.startDate} to {row.endDate}
                            </td>
                            <td className="p-2.5 text-slate-600">
                              <div>{row.spocName || '[Missing]'}</div>
                              <div className="text-[10px] text-slate-400">{row.spocEmail}</div>
                            </td>
                            <td className="p-2.5 text-slate-600">
                              <div className="flex flex-wrap gap-1">
                                {row.products.map((p, pIdx) => (
                                  <span key={pIdx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2.5">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  {row.errors.map((err, eIdx) => (
                                    <div key={eIdx} className="text-[11px] text-rose-700 font-medium">
                                      • {err}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          {validationResults.length > 0 && successCount === null && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={validRows.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" /> Confirm & Import {validRows.length} Valid License Accounts
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
