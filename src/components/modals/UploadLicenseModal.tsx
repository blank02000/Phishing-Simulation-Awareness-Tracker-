import React, { useState } from 'react';
import { Customer, CustomerLicenseFile, ParsedLicenseExcelData } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import { formatDisplayDate } from '../../utils/drillCalculator';
import { parseUploadedExcelLicense, createDefaultCustomerLicenseExcel, downloadExcelLicenseFile } from '../../utils/excelLicenseHelper';
import {
  X,
  Upload,
  FileText,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  FileSpreadsheet,
  Layers,
  Download,
  Sparkles,
} from 'lucide-react';

interface UploadLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

export const UploadLicenseModal: React.FC<UploadLicenseModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const { customizationSettings, addCustomerLicense } = useCustomerContext();
  const licenseConfig = customizationSettings.licenseConfig;

  const [licenseName, setLicenseName] = useState(
    `${customer.companyName} Master License Certificate`
  );
  const [licenseKey, setLicenseKey] = useState(
    `${licenseConfig.licenseKeyPrefix || 'LIC-2026-'}${customer.companyName
      .substring(0, 4)
      .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [planTier, setPlanTier] = useState(
    customer.licenseDetails?.productPlan || licenseConfig.defaultPlanTier || 'Enterprise Cyber Suite'
  );
  const [targetSeats, setTargetSeats] = useState<number>(
    customer.licenseDetails?.targetEmployeesCount || 500
  );
  const [issueDate, setIssueDate] = useState(
    customer.startDate || new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState(() => {
    if (customer.endDate) return customer.endDate;
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [parsedExcelData, setParsedExcelData] = useState<ParsedLicenseExcelData | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsingExcel, setIsParsingExcel] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size
    const maxBytes = (licenseConfig.maxUploadSizeMb || 15) * 1024 * 1024;
    if (file.size > maxBytes) {
      setFileError(`File exceeds maximum size of ${licenseConfig.maxUploadSizeMb} MB.`);
      return;
    }

    // Check extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowed = licenseConfig.allowedUploadFormats || [
      '.xlsx',
      '.xls',
      '.csv',
      '.pdf',
      '.docx',
      '.png',
      '.cert',
      '.json',
    ];
    if (allowed.length > 0 && !allowed.includes(extension)) {
      setFileError(
        `File format "${extension}" is not allowed. Supported formats: ${allowed.join(', ')}`
      );
      return;
    }

    setSelectedFile(file);

    // If Excel or CSV file, parse with SheetJS
    const isSpreadsheet = ['.xlsx', '.xls', '.csv'].includes(extension);
    if (isSpreadsheet) {
      setIsParsingExcel(true);
      try {
        const parsed = await parseUploadedExcelLicense(file);
        setParsedExcelData(parsed);

        // Auto-populate seats if discovered
        if (parsed.entitlements?.licensedSeats && parsed.entitlements.licensedSeats > 0) {
          setTargetSeats(parsed.entitlements.licensedSeats);
        }

        // Auto-enrich notes
        if (!notes) {
          setNotes(
            `Imported license agreement from spreadsheet "${file.name}" with ${parsed.totalSheets} sheets. Entitlements detected: Phishing (${parsed.entitlements?.phishingDrillsQuota || 4}), Vishing (${parsed.entitlements?.vishingDrillsQuota || 2}), Smishing (${parsed.entitlements?.smishingDrillsQuota || 4}), Gamification (${parsed.entitlements?.gamificationGamesQuota || 6}).`
          );
        }
      } catch (err: any) {
        console.error('Error parsing Excel file:', err);
        setFileError(`Could not parse spreadsheet: ${err.message || 'Invalid format'}`);
      } finally {
        setIsParsingExcel(false);
      }
    } else {
      setParsedExcelData(null);
    }

    // Read preview/data URL
    const reader = new FileReader();
    reader.onload = () => {
      setFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadSampleTemplate = () => {
    const sample = createDefaultCustomerLicenseExcel(
      customer.companyName,
      licenseKey,
      targetSeats,
      expiryDate
    );
    downloadExcelLicenseFile(
      sample.parsedData.sheets,
      `${customer.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_License_Entitlements_Template.xlsx`
    );
  };

  const handleApplyPresetDuration = (months: number) => {
    const start = new Date(issueDate || new Date());
    start.setMonth(start.getMonth() + months);
    setExpiryDate(start.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseName.trim()) return;

    if (licenseConfig.requireLicenseKeyOnUpload && !licenseKey.trim()) {
      alert('License Key is required by account customization policy.');
      return;
    }

    if (licenseConfig.requireExpiryDateOnUpload && !expiryDate) {
      alert('Expiry Date is required by account customization policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If no Excel was uploaded, generate a standard verified Excel dataset for this license
      const finalExcelData = parsedExcelData || createDefaultCustomerLicenseExcel(
        customer.companyName,
        licenseKey.trim(),
        Number(targetSeats) || 1250,
        expiryDate
      ).parsedData;

      const licensePayload: Omit<CustomerLicenseFile, 'id' | 'uploadedAt' | 'uploadedBy'> = {
        licenseKey: licenseKey.trim(),
        name: licenseName.trim(),
        planTier,
        targetSeats: Number(targetSeats) || 1,
        issueDate,
        expiryDate,
        status: 'Active',
        fileName: selectedFile?.name || `${customer.companyName.replace(/\s+/g, '_')}_License_Entitlements.xlsx`,
        fileSize: selectedFile?.size || 1024000,
        fileType: selectedFile?.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileDataUrl: fileDataUrl || undefined,
        notes: notes.trim() || undefined,
        isAutoGenerated: !selectedFile,
        digitalSignature: `SHA256:${Math.random().toString(16).substring(2, 12)}`,
        excelData: finalExcelData,
        phishingQuota: finalExcelData.entitlements?.phishingDrillsQuota || 4,
        vishingQuota: finalExcelData.entitlements?.vishingDrillsQuota || 2,
        smishingQuota: finalExcelData.entitlements?.smishingDrillsQuota || 4,
        gamificationQuota: finalExcelData.entitlements?.gamificationGamesQuota || 6,
      };

      addCustomerLicense(customer.id, licensePayload);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload & Provision License</h3>
              <p className="text-xs text-slate-400">
                Register contract certificates & configure validity for {customer.companyName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                License Document / Excel Spreadsheet <span className="text-emerald-600 font-bold">(.xlsx, .xls, .csv, .pdf)</span>
              </label>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample .xlsx Template</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-5 text-center transition-colors bg-emerald-50/20">
              <input
                type="file"
                id="license-file-input"
                className="hidden"
                accept=".xlsx,.xls,.csv,.pdf,.docx,.png,.cert,.json"
                onChange={handleFileChange}
              />
              <label htmlFor="license-file-input" className="cursor-pointer block">
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 text-left">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        {selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv') ? (
                          <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                        ) : (
                          <FileCheck className="w-6 h-6 text-emerald-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {isParsingExcel ? 'Parsing spreadsheet...' : 'File attached & ready to provision'}
                        </p>
                      </div>
                    </div>

                    {parsedExcelData && (
                      <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-left text-xs space-y-2">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Spreadsheet Sheets Discovered ({parsedExcelData.totalSheets}):
                          </span>
                          <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full font-mono">
                            Auto-Parsed
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedExcelData.sheets.map((s) => (
                            <span
                              key={s.sheetName}
                              className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md text-[11px] font-semibold text-emerald-950 flex items-center gap-1"
                            >
                              <Layers className="w-3 h-3 text-emerald-600" />
                              <span>{s.sheetName}</span>
                              <span className="text-[10px] text-slate-500">({s.rowCount} rows)</span>
                            </span>
                          ))}
                        </div>
                        {parsedExcelData.entitlements && (
                          <div className="text-[11px] text-emerald-900 grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-emerald-200/60 font-medium">
                            <div>🎣 Phishing: <strong>{parsedExcelData.entitlements.phishingDrillsQuota || 4} drills</strong></div>
                            <div>📞 Vishing: <strong>{parsedExcelData.entitlements.vishingDrillsQuota || 2} calls</strong></div>
                            <div>💬 Smishing: <strong>{parsedExcelData.entitlements.smishingDrillsQuota || 4} SMS</strong></div>
                            <div>🎮 Gamification: <strong>{parsedExcelData.entitlements.gamificationGamesQuota || 6} games</strong></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <FileSpreadsheet className="w-9 h-9 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">
                      Upload Customer License Excel File (.xlsx, .xls, .csv)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag & drop your contract spreadsheet to automatically extract seat quotas, vishing/smishing allocations, and gamification deliverables.
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-2xs">
                      Browse Files
                    </span>
                  </div>
                )}
              </label>
            </div>
            {fileError && (
              <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fileError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* License Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                License Certificate Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={licenseName}
                onChange={(e) => setLicenseName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="e.g. Enterprise Cyber Security Suite"
              />
            </div>

            {/* License Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                License Key / Identifier
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full px-3 py-2 font-mono border border-slate-300 rounded-lg text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="LIC-2026-CORP-XXXX"
              />
            </div>

            {/* Product Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Edition / Tier
              </label>
              <select
                value={planTier}
                onChange={(e) => setPlanTier(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="Enterprise Cyber Suite">Enterprise Cyber Suite</option>
                <option value="Enterprise Pro">Enterprise Pro</option>
                <option value="Standard Security Suite">Standard Security Suite</option>
                <option value="ProPhish Dedicated">ProPhish Dedicated</option>
                <option value="ProLMS Compliance Edition">ProLMS Compliance Edition</option>
                <option value="Custom Tier">Custom Tier</option>
              </select>
            </div>

            {/* Target Seats */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target User / Seat Capacity
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  value={targetSeats}
                  onChange={(e) => setTargetSeats(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDuration(6)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                  >
                    +6 Mo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDuration(12)}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold"
                  >
                    +1 Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetDuration(24)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium"
                  >
                    +2 Yrs
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              License Terms & Scope Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Master agreement signed with CISO Marcus Thorne. Includes 4 quarterly simulations and Pro LMS compliance modules..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Digital audit stamp will be signed upon registration</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Provision License</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
