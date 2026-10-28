import React, { useState, useMemo } from 'react';
import { CustomerLicenseFile, Customer, ExcelSheetData } from '../../types';
import { downloadExcelLicenseFile, createDefaultCustomerLicenseExcel } from '../../utils/excelLicenseHelper';
import { formatDisplayDate } from '../../utils/drillCalculator';
import {
  X,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Users,
  Shield,
  PhoneCall,
  MessageSquare,
  Gamepad2,
  Calendar,
  Key,
  ExternalLink,
  Table,
} from 'lucide-react';

interface ExcelLicenseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: CustomerLicenseFile | null;
  customer?: Customer | null;
}

export const ExcelLicenseViewerModal: React.FC<ExcelLicenseViewerModalProps> = ({
  isOpen,
  onClose,
  license,
  customer,
}) => {
  if (!isOpen || !license) return null;

  // Resolve Excel data (either existing in license or generated default for customer)
  const excelData = useMemo(() => {
    if (license.excelData && license.excelData.sheets.length > 0) {
      return license.excelData;
    }
    // Fallback: build instant multi-sheet Excel model
    const fallback = createDefaultCustomerLicenseExcel(
      customer?.companyName || 'Enterprise Account',
      license.licenseKey,
      license.targetSeats || 1250,
      license.expiryDate || '2026-12-31'
    );
    return fallback.parsedData;
  }, [license, customer]);

  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const currentSheet: ExcelSheetData | undefined = excelData.sheets[activeSheetIndex] || excelData.sheets[0];

  // Search filter inside current active sheet
  const filteredRows = useMemo(() => {
    if (!currentSheet) return [];
    if (!searchTerm.trim()) return currentSheet.rows;

    const query = searchTerm.toLowerCase();
    return currentSheet.rows.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(query))
    );
  }, [currentSheet, searchTerm]);

  const handleDownloadExcel = () => {
    const filename = license.fileName && (license.fileName.endsWith('.xlsx') || license.fileName.endsWith('.xls'))
      ? license.fileName
      : `${(customer?.companyName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}_License_Entitlements.xlsx`;

    downloadExcelLicenseFile(excelData.sheets, filename);
  };

  const entitlements = excelData.entitlements || {
    licensedSeats: license.targetSeats || 1250,
    phishingDrillsQuota: license.phishingQuota || 4,
    vishingDrillsQuota: license.vishingQuota || 2,
    smishingDrillsQuota: license.smishingQuota || 4,
    gamificationGamesQuota: license.gamificationQuota || 6,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Banner */}
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  {customer ? customer.companyName : 'Customer'} — License Excel File Preview
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verified Spreadsheet
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>File: <strong className="text-slate-200 font-mono">{license.fileName || 'Master_License.xlsx'}</strong></span>
                <span>•</span>
                <span>Key: <strong className="text-slate-200 font-mono">{license.licenseKey}</strong></span>
                <span>•</span>
                <span>Valid to: <strong className="text-slate-200">{formatDisplayDate(license.expiryDate)}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              title="Download full Excel workbook (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .xlsx</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contracted Entitlements Quick Bar (Phishing, Vishing, Smishing, Gamification) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Mailbox Seats</div>
                <div className="font-extrabold text-slate-800 text-sm">{entitlements.licensedSeats?.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-bold">Phishing Drills</div>
                <div className="font-extrabold text-slate-800 text-sm">{entitlements.phishingDrillsQuota || 4} / Year</div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/30 flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] text-emerald-800 uppercase font-bold">Vishing Calls</div>
                <div className="font-extrabold text-emerald-950 text-sm">{entitlements.vishingDrillsQuota || 2} Drills</div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-purple-200 bg-purple-50/30 flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <div className="text-[10px] text-purple-800 uppercase font-bold">Smishing SMS</div>
                <div className="font-extrabold text-purple-950 text-sm">{entitlements.smishingDrillsQuota || 4} Drills</div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-amber-200 bg-amber-50/30 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <Gamepad2 className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <div className="text-[10px] text-amber-800 uppercase font-bold">Gamification</div>
                <div className="font-extrabold text-amber-950 text-sm">{entitlements.gamificationGamesQuota || 6} Games</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Tabs & Search Bar */}
        <div className="px-6 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
          {/* Sheet Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              Sheets:
            </span>
            {excelData.sheets.map((sheet, idx) => (
              <button
                key={sheet.sheetName}
                type="button"
                onClick={() => {
                  setActiveSheetIndex(idx);
                  setSearchTerm('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeSheetIndex === idx
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>{sheet.sheetName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeSheetIndex === idx ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {sheet.rowCount}
                </span>
              </button>
            ))}
          </div>

          {/* Search Table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={`Filter in ${currentSheet?.sheetName || 'sheet'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Spreadsheet Data Grid */}
        <div className="overflow-auto flex-1 p-6 bg-slate-50/50">
          {currentSheet && currentSheet.headers.length > 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400 bg-slate-100 border-r border-slate-200 font-mono text-[10px]">
                      #
                    </th>
                    {currentSheet.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className="py-2.5 px-4 text-slate-800 font-bold border-r border-slate-200 last:border-r-0 whitespace-nowrap bg-slate-100"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={currentSheet.headers.length + 1} className="py-10 text-center text-slate-500">
                        No rows found matching &quot;{searchTerm}&quot; in this worksheet.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-emerald-50/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 bg-slate-50/80 border-r border-slate-200 font-mono text-[10px]">
                          {rIdx + 1}
                        </td>
                        {currentSheet.headers.map((_, cIdx) => {
                          const cellVal = row[cIdx];
                          const strVal = cellVal !== null && cellVal !== undefined ? String(cellVal) : '—';
                          const isHighRisk = strVal.toLowerCase().includes('high risk') || strVal.toLowerCase().includes('tier 1');
                          const isStatusActive = strVal.toLowerCase().includes('active') || strVal.toLowerCase().includes('ready');

                          return (
                            <td
                              key={cIdx}
                              className="py-2.5 px-4 text-slate-700 border-r border-slate-100 last:border-r-0"
                            >
                              {isHighRisk ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[11px] border border-rose-200">
                                  {strVal}
                                </span>
                              ) : isStatusActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                                  {strVal}
                                </span>
                              ) : (
                                strVal
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              No spreadsheet data available for preview.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Showing {filteredRows.length} of {currentSheet?.rowCount || 0} rows from sheet &quot;{currentSheet?.sheetName}&quot;.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {currentSheet?.sheetName}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
