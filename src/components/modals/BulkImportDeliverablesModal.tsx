import React, { useState } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  parseDeliverableImportFile,
  downloadRequirementTemplate,
  downloadDeliveryTemplate,
  DeliverableImportResult,
} from '../../utils/deliverableTrackerHelper';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface BulkImportDeliverablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportDeliverablesModal: React.FC<BulkImportDeliverablesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, bulkImportPlannedDeliverables, bulkImportActualDeliveries } =
    useCustomerContext();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<DeliverableImportResult | null>(null);
  const [commitSummary, setCommitSummary] = useState<{
    success: boolean;
    type: 'requirements' | 'deliveries';
    added: number;
    updated: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setCommitSummary(null);
    setIsProcessing(true);

    try {
      const res = await parseDeliverableImportFile(file, customers);
      setImportResult(res);
    } catch (err) {
      setImportResult({
        success: false,
        type: 'requirements',
        totalRows: 0,
        validRows: 0,
        errorRows: 1,
        errors: [{ row: 1, message: `Failed to read file: ${err instanceof Error ? err.message : String(err)}` }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = () => {
    if (!importResult) return;

    if (importResult.type === 'requirements' && importResult.parsedRequirements) {
      const result = bulkImportPlannedDeliverables(importResult.parsedRequirements);
      setCommitSummary({
        success: true,
        type: 'requirements',
        added: result.added,
        updated: result.updated,
      });
    } else if (importResult.type === 'deliveries' && importResult.parsedDeliveries) {
      const result = bulkImportActualDeliveries(importResult.parsedDeliveries);
      setCommitSummary({
        success: true,
        type: 'deliveries',
        added: result.added,
        updated: result.updated,
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setCommitSummary(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Bulk Import Deliverables & Requirements
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Import planned requirements or actual delivery logs via Excel (.xlsx) or CSV.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Download Official Templates Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" />
                <span>1. Download Official Bulk Import Templates</span>
              </span>
              <span className="text-[11px] text-slate-500">Supports .xlsx & .csv formats</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900">Planned Requirements Template</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    For setting up client deliverables, categories, cadences, and target quotas.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadRequirementTemplate('xlsx')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadRequirementTemplate('csv')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    <span>.csv</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900">Actual Deliveries Template</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    For logging actual delivered file names, formats, delivery modes, and dates shared.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadDeliveryTemplate('xlsx')}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDeliveryTemplate('csv')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    <span>.csv</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upload File Dropzone */}
          {!commitSummary && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>2. Select & Validate Your Spreadsheet File</span>
              </span>

              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors bg-white">
                <input
                  type="file"
                  id="deliverable-bulk-file-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="deliverable-bulk-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop spreadsheet'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Accepts Excel (.xlsx, .xls) and CSV (.csv). Max 15MB.
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Validating rows, clients, and license mappings...</span>
            </div>
          )}

          {/* Import Validation Results Preview */}
          {importResult && !commitSummary && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800 text-xs">
                    Detected: <strong className="text-indigo-700 capitalize">{importResult.type} Import</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                    {importResult.totalRows} Total Rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-[11px]">
                    {importResult.validRows} Valid
                  </span>
                  {importResult.errorRows > 0 && (
                    <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md text-[11px]">
                      {importResult.errorRows} Errors
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Errors List (if any) */}
              {importResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Validation Issues Detected ({importResult.errors.length})</span>
                  </div>
                  <ul className="divide-y divide-rose-100 text-[11px] text-rose-800">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx} className="py-1">
                        Row <strong>{err.row}</strong> {err.column ? `(${err.column})` : ''}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Items Sample Preview */}
              {importResult.validRows > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-700 text-xs">
                    Preview of Valid Records to be Imported ({importResult.validRows})
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto shadow-2xs">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Client</th>
                          <th className="py-2 px-3">License Key</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Title / Name</th>
                          {importResult.type === 'deliveries' ? (
                            <>
                              <th className="py-2 px-3">File Name</th>
                              <th className="py-2 px-3">Period</th>
                              <th className="py-2 px-3">Date Shared</th>
                            </>
                          ) : (
                            <>
                              <th className="py-2 px-3">Frequency</th>
                              <th className="py-2 px-3">Target Qty</th>
                              <th className="py-2 px-3">Year</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(importResult.type === 'deliveries'
                          ? importResult.parsedDeliveries || []
                          : importResult.parsedRequirements || []
                        )
                          .slice(0, 10)
                          .map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-semibold text-slate-900">{row.customerName}</td>
                              <td className="py-2 px-3 font-mono text-[10px] text-slate-600">{row.licenseKey}</td>
                              <td className="py-2 px-3">{row.category}</td>
                              <td className="py-2 px-3 font-medium text-slate-800">{row.title}</td>
                              {importResult.type === 'deliveries' ? (
                                <>
                                  <td className="py-2 px-3 font-mono text-[10px] text-slate-600">{row.fileName}</td>
                                  <td className="py-2 px-3 text-indigo-700 font-bold">{row.reportingPeriodKey}</td>
                                  <td className="py-2 px-3">{row.dateShared}</td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 px-3 text-indigo-700 font-bold">{row.frequency}</td>
                                  <td className="py-2 px-3 font-bold">{row.targetQuantityPerPeriod}</td>
                                  <td className="py-2 px-3">{row.year}</td>
                                </>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {importResult.validRows > 10 && (
                    <div className="text-[10px] text-slate-400 text-center">
                      Showing first 10 of {importResult.validRows} rows.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Success Summary View */}
          {commitSummary && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-emerald-950 text-base">Import Completed Successfully!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Processed <strong>{commitSummary.added}</strong> new records and updated{' '}
                <strong>{commitSummary.updated}</strong> existing records in client licenses without duplicates.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs transition-colors"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!commitSummary && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition-colors"
            >
              Cancel
            </button>

            {importResult && importResult.validRows > 0 && (
              <button
                type="button"
                onClick={handleCommit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Commit {importResult.validRows} Records</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
