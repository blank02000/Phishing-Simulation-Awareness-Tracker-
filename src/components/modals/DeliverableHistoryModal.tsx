import React from 'react';
import {
  PlannedDeliverableRequirement,
  ActualDeliveryRecord,
  Customer,
} from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import { formatDisplayDate } from '../../utils/drillCalculator';
import {
  X,
  History,
  FileText,
  ExternalLink,
  Trash2,
  Calendar,
  Send,
  User,
  PlusCircle,
  Building2,
  Layers,
} from 'lucide-react';

interface DeliverableHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirement?: PlannedDeliverableRequirement | null;
  customer?: Customer | null;
  onOpenRecordDelivery: (req?: PlannedDeliverableRequirement) => void;
}

export const DeliverableHistoryModal: React.FC<DeliverableHistoryModalProps> = ({
  isOpen,
  onClose,
  requirement,
  customer,
  onOpenRecordDelivery,
}) => {
  const { allActualDeliveries, deleteActualDelivery, currentUser } = useCustomerContext();

  if (!isOpen) return null;

  // Filter deliveries
  const deliveries: ActualDeliveryRecord[] = allActualDeliveries.filter((d) => {
    if (requirement) {
      if (d.requirementId === requirement.id) return true;
      return (
        d.customerId === requirement.customerId &&
        d.licenseId === requirement.licenseId &&
        d.category === requirement.category
      );
    }
    if (customer) {
      return d.customerId === customer.id;
    }
    return true;
  });

  const sortedDeliveries = [...deliveries].sort((a, b) => b.dateShared.localeCompare(a.dateShared));

  const handleDelete = (delId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to remove delivery record "${fileName}"?`)) {
      deleteActualDelivery(delId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Delivery History & Shared Assets
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                  {deliveries.length} {deliveries.length === 1 ? 'Delivery' : 'Deliveries'} Logged
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {requirement
                  ? `${requirement.customerName || 'Client'} — ${requirement.title} (${requirement.frequency})`
                  : customer
                  ? `${customer.companyName} — All Client License Deliverables`
                  : 'Complete audit log of files and artifacts shared with clients.'}
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {requirement && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Contracted Requirement Details
                </div>
                <div className="font-bold text-slate-900 text-sm">{requirement.title}</div>
                <div className="text-slate-600 flex items-center gap-3 flex-wrap text-[11px]">
                  <span>Category: <strong className="text-slate-800">{requirement.category}</strong></span>
                  <span>•</span>
                  <span>Cadence: <strong className="text-indigo-700">{requirement.frequency}</strong></span>
                  <span>•</span>
                  <span>Target: <strong className="text-slate-800">{requirement.targetQuantityPerPeriod} per period</strong></span>
                  <span>•</span>
                  <span>License: <strong className="text-slate-800 font-mono">{requirement.licenseKey || 'Active'}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordDelivery(requirement);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record New Delivery</span>
              </button>
            </div>
          )}

          {sortedDeliveries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">No actual deliveries recorded yet</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No delivery records have been logged for this requirement. Click &quot;Record New Delivery&quot; to log actual files shared with the client.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecordDelivery(requirement || undefined);
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Record First Delivery</span>
              </button>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Reporting Period</th>
                    <th className="py-3 px-4">Actual File Name & Format</th>
                    <th className="py-3 px-4">Delivery Mode</th>
                    <th className="py-3 px-4">Date Shared</th>
                    <th className="py-3 px-4">Responsible CSM</th>
                    <th className="py-3 px-4">Reference / URL</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDeliveries.map((del) => (
                    <tr key={del.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {del.reportingPeriodLabel || del.reportingPeriodKey}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{del.fileName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="bg-slate-100 font-bold text-slate-700 px-1.5 py-0.2 rounded uppercase">
                            {del.fileFormat}
                          </span>
                          <span>•</span>
                          <span>{del.title}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Send className="w-3 h-3 text-blue-500" />
                          <span>{del.deliveryMode}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDisplayDate(del.dateShared)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{del.csmName || 'CSM'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {del.referenceUrl ? (
                          <a
                            href={del.referenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 truncate max-w-[120px]"
                            title={del.referenceUrl}
                          >
                            <span>Open Asset</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {del.remarks && (
                          <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic" title={del.remarks}>
                            &quot;{del.remarks}&quot;
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(del.id, del.fileName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete delivery record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Total of <strong>{deliveries.length}</strong> delivered artifacts logged for audit verification.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
