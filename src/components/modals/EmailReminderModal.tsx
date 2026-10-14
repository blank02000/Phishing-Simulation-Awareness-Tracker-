import React, { useState } from 'react';
import { Customer, DrillRecord, ReviewMeeting, CustomField } from '../../types';
import { useCustomerContext } from '../../context/CustomerContext';
import { sendDrillReminderEmail, sendEmail } from '../../utils/emailService';
import { formatDisplayDate } from '../../utils/drillCalculator';
import { Mail, Send, X, AlertCircle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { CustomFieldsFormSection } from '../common/CustomFieldsFormSection';

interface EmailReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  drill?: DrillRecord | null;
  review?: ReviewMeeting | null;
  isOverdue?: boolean;
}

export const EmailReminderModal: React.FC<EmailReminderModalProps> = ({
  isOpen,
  onClose,
  customer,
  drill,
  review,
  isOverdue,
}) => {
  const { currentUser } = useCustomerContext();

  const [toEmail, setToEmail] = useState(customer.contactEmail || customer.cisoEmail || '');
  const [subject, setSubject] = useState(() => {
    if (drill) {
      return isOverdue
        ? `[URGENT] Phishing Simulation Overdue Notice - ${customer.name} (${drill.quarter})`
        : `Phishing Simulation Schedule Notice - ${customer.name} (${drill.quarter})`;
    }
    if (review) {
      return `Annual Cyber Drill Review Meeting - ${customer.name} (${review.date})`;
    }
    return `Security Awareness & Cyber Drill Notice - ${customer.name}`;
  });
  const [customNote, setCustomNote] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      setStatus({ type: 'error', message: 'Recipient email address is required.' });
      return;
    }

    setSending(true);
    setStatus(null);

    const customFieldsText =
      customFields.length > 0
        ? '\n\n' +
          customFields
            .map((f) => `${f.name}: ${f.type === 'boolean' ? (f.value ? 'Yes' : 'No') : f.value}`)
            .join('\n')
        : '';

    const customFieldsHtml =
      customFields.length > 0
        ? `<div style="margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 12px;">` +
          customFields
            .map(
              (f) =>
                `<p style="margin: 4px 0; font-size: 13px;"><strong>${f.name}:</strong> ${
                  f.type === 'boolean' ? (f.value ? 'Yes' : 'No') : f.value
                }</p>`
            )
            .join('') +
          `</div>`
        : '';

    try {
      if (drill) {
        const result = await sendDrillReminderEmail({
          to: toEmail.trim(),
          customerName: customer.name,
          drillQuarter: drill.quarter,
          drillType: drill.drillType,
          dueDate: formatDisplayDate(drill.plannedDate),
          csmName: currentUser.name,
          customNote: ((customNote.trim() || '') + customFieldsText).trim() || undefined,
          isOverdue: Boolean(isOverdue),
        });

        if (result.success) {
          setStatus({
            type: 'success',
            message: `Email successfully dispatched via SMTP! (Message ID: ${result.messageId || 'Sent'})`,
          });
          setTimeout(() => {
            onClose();
          }, 1800);
        } else {
          setStatus({
            type: 'error',
            message: result.error || 'Failed to dispatch email. Please check your SMTP settings in Settings.',
          });
        }
      } else {
        const result = await sendEmail({
          to: toEmail.trim(),
          subject: subject.trim(),
          text: `Cyber Drill Notice for ${customer.name}:\n\n${customNote || 'Please review your scheduled security drills.'}${customFieldsText}\n\nAssigned CSM: ${currentUser.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #0284c7;">CyberDrill Operations Notice</h2>
              <p>Hello <strong>${customer.name} Team</strong>,</p>
              <p>${customNote ? customNote.replace(/\n/g, '<br>') : 'This is a scheduled operational notice regarding your cybersecurity awareness and phishing drills.'}</p>
              ${customFieldsHtml}
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">Sender: ${currentUser.name} (${currentUser.email || 'CSM Team'})</p>
            </div>
          `,
        });

        if (result.success) {
          setStatus({
            type: 'success',
            message: `Email successfully dispatched via SMTP! (Message ID: ${result.messageId || 'Sent'})`,
          });
          setTimeout(() => {
            onClose();
          }, 1800);
        } else {
          setStatus({
            type: 'error',
            message: result.error || 'Failed to dispatch email. Check SMTP credentials.',
          });
        }
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Unexpected network error dispatching email.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {drill ? 'Send Phishing Drill Notice' : review ? 'Send Review Meeting Invite' : 'Send Customer Email'}
              </h3>
              <p className="text-[11px] text-slate-500">{customer.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {status && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{status.message}</span>
            </div>
          )}

          {drill && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-900">{drill.quarter} Drill</span>
                <span className="text-blue-700 ml-2">({drill.drillType})</span>
              </div>
              <div className="font-semibold text-blue-800">
                Target: {formatDisplayDate(drill.plannedDate)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Email (To) <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="customer.security@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Quick fill:</span>
              {customer.contactEmail && (
                <button
                  type="button"
                  onClick={() => setToEmail(customer.contactEmail || '')}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
                >
                  Primary: {customer.customerContact} ({customer.contactEmail})
                </button>
              )}
              {customer.cisoEmail && (
                <button
                  type="button"
                  onClick={() => setToEmail(customer.cisoEmail || '')}
                  className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 transition-colors font-medium flex items-center gap-1"
                >
                  CISO: {customer.cisoName || 'CISO'} ({customer.cisoEmail})
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Personalized Message / CSM Note</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <textarea
              rows={4}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add tailored instructions, target department criteria, or specific action items..."
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Admin Field Builder & Email Custom Fields */}
          <CustomFieldsFormSection
            fields={customFields}
            onChange={setCustomFields}
            formTitle="Email Notice Custom Fields"
            formType="email"
          />

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Sender:</span>
              <span className="font-semibold text-slate-700">{currentUser.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending via SMTP...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
