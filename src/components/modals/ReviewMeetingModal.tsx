import React, { useState, useEffect } from 'react';
import { Customer, DrillRecord, ReviewMeeting, ReviewMeetingStatus } from '../../types';
import { formatDisplayDate, SYSTEM_TODAY } from '../../utils/drillCalculator';
import { X, Calendar, CheckCircle2, MessageSquare, Check, ShieldCheck } from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';

interface ReviewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  drill: DrillRecord | null;
  customerName?: string;
  onSubmit?: (meeting: ReviewMeeting) => void;
  onSave?: (meeting: ReviewMeeting) => void;
}

export const ReviewMeetingModal: React.FC<ReviewMeetingModalProps> = ({
  isOpen,
  onClose,
  customer,
  drill,
  customerName,
  onSubmit,
  onSave,
}) => {
  const { updateCustomer } = useCustomerContext();
  const resolvedCustomerName = customer?.companyName || customerName || 'Customer Account';
  const [required, setRequired] = useState(true);
  const [date, setDate] = useState(SYSTEM_TODAY);
  const [participants, setParticipants] = useState('');
  const [status, setStatus] = useState<ReviewMeetingStatus>('Scheduled');
  const [discussionPoints, setDiscussionPoints] = useState('');
  const [findings, setFindings] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [meetingProducts, setMeetingProducts] = useState({
    prophish: true,
    proLms: true,
    proPatrol: true,
  });

  useEffect(() => {
    if (customer?.products) {
      setMeetingProducts({
        prophish: customer.products.prophish ?? true,
        proLms: customer.products.proLms ?? true,
        proPatrol: customer.products.proPatrol ?? true,
      });
    }
  }, [customer]);

  useEffect(() => {
    if (drill?.reviewMeeting) {
      setRequired(drill.reviewMeeting.required ?? true);
      setDate(drill.reviewMeeting.date || SYSTEM_TODAY);
      setParticipants(drill.reviewMeeting.participants || '');
      setStatus(drill.reviewMeeting.status || 'Not Scheduled');
      setDiscussionPoints(drill.reviewMeeting.discussionPoints || '');
      setFindings(drill.reviewMeeting.findings || '');
      setActionItems(drill.reviewMeeting.actionItems || '');
      setNextFollowUpDate(drill.reviewMeeting.nextFollowUpDate || '');
    } else if (drill) {
      setRequired(true);
      setDate(drill.actualCompletionDate || drill.plannedDate);
      setParticipants('');
      setStatus('Not Scheduled');
      setDiscussionPoints('');
      setFindings('');
      setActionItems('');
      setNextFollowUpDate('');
    }
  }, [drill]);

  if (!isOpen || !drill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (customer?.id) {
      updateCustomer(customer.id, { products: meetingProducts });
    }

    const payload: ReviewMeeting = {
      required,
      date: required && date ? date : undefined,
      participants: participants.trim() || undefined,
      status: required ? status : 'Not Scheduled',
      discussionPoints: discussionPoints.trim() || undefined,
      findings: findings.trim() || undefined,
      actionItems: actionItems.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
    };

    const handler = onSubmit || onSave;
    if (handler) {
      handler(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="modal-review-meeting"
        className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Drill {drill.drillNumber} Review Meeting
              </h2>
              <p className="text-xs text-slate-500">
                {resolvedCustomerName} • Drill Planned: {formatDisplayDate(drill.plannedDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Requirement Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <div className="text-sm font-semibold text-slate-800">Review Meeting Required</div>
              <div className="text-xs text-slate-500">
                Does this customer contract/compliance plan require a debrief meeting for this drill?
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Customer Products Subscriptions */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Customer Product Subscriptions
            </div>
            <p className="text-xs text-slate-600">
              Review or update opted products for {resolvedCustomerName}:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${meetingProducts.prophish ? 'bg-white border-blue-200 text-blue-950 shadow-2xs font-medium' : 'bg-white/60 border-slate-200 text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={meetingProducts.prophish}
                  onChange={(e) => setMeetingProducts({ ...meetingProducts, prophish: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">Prophish</span>
              </label>

              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${meetingProducts.proLms ? 'bg-white border-blue-200 text-blue-950 shadow-2xs font-medium' : 'bg-white/60 border-slate-200 text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={meetingProducts.proLms}
                  onChange={(e) => setMeetingProducts({ ...meetingProducts, proLms: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">Pro LMS</span>
              </label>

              <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all ${meetingProducts.proPatrol ? 'bg-white border-blue-200 text-blue-950 shadow-2xs font-medium' : 'bg-white/60 border-slate-200 text-slate-400'}`}>
                <input
                  type="checkbox"
                  checked={meetingProducts.proPatrol}
                  onChange={(e) => setMeetingProducts({ ...meetingProducts, proPatrol: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs">Pro Patrol</span>
              </label>
            </div>
          </div>

          {required && (
            <>
              {/* Meeting Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Status
                  </label>
                  <select
                    id="select-meeting-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReviewMeetingStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Not Scheduled">Not Scheduled</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Date
                  </label>
                  <input
                    id="input-meeting-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendees / Participants
                </label>
                <input
                  id="input-meeting-participants"
                  type="text"
                  placeholder="e.g. Sarah Jenkins (CISO), David Miller (SecOps), Brenda Lee (Finance)"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Discussion Points & Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discussion Points
                  </label>
                  <textarea
                    id="textarea-meeting-discussion"
                    rows={3}
                    placeholder="Key agenda topics discussed during the debrief session..."
                    value={discussionPoints}
                    onChange={(e) => setDiscussionPoints(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Findings
                  </label>
                  <textarea
                    id="textarea-meeting-findings"
                    rows={3}
                    placeholder="e.g. High click rate among finance users due to vendor impersonation..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Action Items & Follow Up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Action Items Agreed
                  </label>
                  <textarea
                    id="textarea-meeting-actions"
                    rows={2}
                    placeholder="e.g. Conduct additional awareness training for finance team by next week."
                    value={actionItems}
                    onChange={(e) => setActionItems(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    id="input-meeting-followup-date"
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-save-review-meeting"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Review Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
