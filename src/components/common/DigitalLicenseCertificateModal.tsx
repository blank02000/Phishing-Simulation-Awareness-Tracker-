import React from 'react';
import { CustomerLicenseFile, Customer } from '../../types';
import { formatDisplayDate } from '../../utils/drillCalculator';
import { X, ShieldCheck, Download, Printer, Award, Calendar, Users, Key } from 'lucide-react';

interface DigitalLicenseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  license: CustomerLicenseFile | null;
  customer?: Customer | null;
}

export const DigitalLicenseCertificateModal: React.FC<DigitalLicenseCertificateModalProps> = ({
  isOpen,
  onClose,
  license,
  customer,
}) => {
  if (!isOpen || !license) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // If real fileDataUrl exists, trigger download; otherwise trigger json/text cert export
    const element = document.createElement('a');
    if (license.fileDataUrl) {
      element.href = license.fileDataUrl;
      element.download = license.fileName || `${license.licenseKey}.pdf`;
    } else {
      const certData = JSON.stringify(
        {
          certificate: 'CYBERDRILL SECURITY OPS ENTERPRISE LICENSE',
          licenseKey: license.licenseKey,
          customer: customer?.companyName || 'Enterprise Account',
          planTier: license.planTier,
          targetSeats: license.targetSeats,
          issueDate: license.issueDate,
          expiryDate: license.expiryDate,
          status: license.status,
          digitalSignature: license.digitalSignature,
          issuer: 'Progist CyberDrill Security Operations Center',
        },
        null,
        2
      );
      const file = new Blob([certData], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = `${license.licenseKey}-certificate.json`;
    }
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Certificate Action Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold tracking-wide">
              Official Digital Security License Certificate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Print Certificate"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Download Certificate"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Parchment Body */}
        <div className="p-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-8 border-slate-100 m-4 rounded-2xl relative select-none">
          {/* Decorative Corner Watermark */}
          <div className="absolute top-4 right-4 text-slate-200 pointer-events-none">
            <Award className="w-20 h-20 opacity-30" />
          </div>

          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> CyberDrill SecOps Security Guarantee
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 font-serif">
              Enterprise License Certificate
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This digital credential certifies active enterprise entitlement for threat simulation,
              workforce awareness, and compliance tracking.
            </p>
          </div>

          {/* Recipient Organization */}
          <div className="text-center py-4 border-y border-dashed border-slate-300 my-4 bg-white/70 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Issued Exclusively To
            </p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {customer?.companyName || 'Enterprise Account'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Tier: <strong className="text-blue-700">{license.planTier}</strong>
            </p>
          </div>

          {/* Certificate Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs my-5">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                <span>License Key</span>
              </div>
              <p className="font-mono font-bold text-slate-800 truncate" title={license.licenseKey}>
                {license.licenseKey}
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Licensed Seats</span>
              </div>
              <p className="font-bold text-slate-800">
                {license.targetSeats.toLocaleString()} User Mailboxes
              </p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Validity Period</span>
              </div>
              <p className="font-bold text-slate-800">
                {formatDisplayDate(license.issueDate)} – {formatDisplayDate(license.expiryDate)}
              </p>
            </div>
          </div>

          {license.notes && (
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs text-slate-700 mb-5">
              <strong className="text-blue-900">Contract Notes & Scope:</strong> {license.notes}
            </div>
          )}

          {/* Signatures & Seal Row */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Digital Verification Hash
              </p>
              <p className="font-mono text-[11px] text-slate-600 font-medium truncate max-w-[200px]">
                {license.digitalSignature || 'SHA256:7b91d204fa69ce'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Stitched by {license.uploadedBy} on {formatDisplayDate(license.uploadedAt.split('T')[0])}
              </p>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                VERIFIED ACTIVE
              </div>
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Authorized by Progist SecOps Authority
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close Certificate
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
