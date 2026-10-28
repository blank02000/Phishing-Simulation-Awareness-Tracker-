import React, { useState, useEffect } from 'react';
import { Customer, DrillRecord, ReviewMeeting, ReviewMeetingStatus, ReviewMeetingType, ReviewMeetingActionItem, CustomField } from '../../types';
import { formatDisplayDate, SYSTEM_TODAY } from '../../utils/drillCalculator';
import {
  X,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Check,
  ShieldCheck,
  FileText,
  Users,
  Target,
  FileCheck2,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCustomerContext } from '../../context/CustomerContext';
import { CustomFieldsFormSection } from '../common/CustomFieldsFormSection';

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

  const [activeTab, setActiveTab] = useState<'meeting' | 'scope' | 'mom'>('meeting');
  const [required, setRequired] = useState(true);
  const [meetingType, setMeetingType] = useState<ReviewMeetingType>('Scope Review');
  const [date, setDate] = useState(SYSTEM_TODAY);
  const [participants, setParticipants] = useState('');
  const [status, setStatus] = useState<ReviewMeetingStatus>('Scheduled');
  const [discussionPoints, setDiscussionPoints] = useState('');
  const [findings, setFindings] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [meetingProducts, setMeetingProducts] = useState({
    prophish: true,
    proLms: true,
    proPatrol: true,
  });

  // Scope Review Details
  const [domainsInScope, setDomainsInScope] = useState('');
  const [whitelistingConfirmed, setWhitelistingConfirmed] = useState(true);
  const [targetCount, setTargetCount] = useState<number>(500);
  const [excludedGroups, setExcludedGroups] = useState('');
  const [phoneSmsCoverage, setPhoneSmsCoverage] = useState('');
  const [approvedByCiso, setApprovedByCiso] = useState(true);

  // Minutes of Meeting (MoM) Details
  const [momTitle, setMomTitle] = useState('');
  const [momStatus, setMomStatus] = useState<'Draft' | 'Finalized' | 'Approved by Client'>('Finalized');
  const [momDecisions, setMomDecisions] = useState('');
  const [momNotes, setMomNotes] = useState('');
  const [momActionItems, setMomActionItems] = useState<ReviewMeetingActionItem[]>([]);
  const [copiedMom, setCopiedMom] = useState(false);

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
      const rm = drill.reviewMeeting;
      setRequired(rm.required ?? true);
      setMeetingType(rm.meetingType || (drill.drillNumber === 1 ? 'Scope Review' : 'Drill Debrief'));
      setDate(rm.date || SYSTEM_TODAY);
      setParticipants(rm.participants || (customer?.customerContact ? `${customer.customerContact}, ${customer.cisoName || 'CISO'}` : ''));
      setStatus(rm.status || 'Scheduled');
      setDiscussionPoints(rm.discussionPoints || '');
      setFindings(rm.findings || '');
      setActionItems(rm.actionItems || '');
      setNextFollowUpDate(rm.nextFollowUpDate || '');
      setCustomFields(rm.customFields ? JSON.parse(JSON.stringify(rm.customFields)) : []);

      // Scope fields
      setDomainsInScope(rm.scopeDetails?.domainsInScope || (customer?.contactEmail ? `@${customer.contactEmail.split('@')[1]}` : ''));
      setWhitelistingConfirmed(rm.scopeDetails?.whitelistingConfirmed ?? true);
      setTargetCount(rm.scopeDetails?.targetCount || customer?.licenseDetails?.targetEmployeesCount || 500);
      setExcludedGroups(rm.scopeDetails?.excludedGroups || '');
      setPhoneSmsCoverage(rm.scopeDetails?.phoneSmsCoverage || 'Direct dialing extension lines & corporate SMS endpoints');
      setApprovedByCiso(rm.scopeDetails?.approvedByCiso ?? true);

      // MoM fields
      setMomTitle(rm.momTitle || `MoM: Drill #${drill.drillNumber} Scope & Simulation Review`);
      setMomStatus(rm.momStatus || 'Finalized');
      setMomDecisions(rm.momDecisions || 'Approved drill window schedule, confirmed IP whitelisting in email security gateway, verified Vishing/Smishing target roster.');
      setMomNotes(rm.momNotes || rm.discussionPoints || '');
      setMomActionItems(
        rm.momActionItems || [
          {
            id: 'act-1',
            task: 'Confirm DNS SPF/DKIM bypass records on Microsoft 365 Exchange',
            owner: customer?.accountOwner || 'SecOps Team',
            dueDate: date,
            status: 'Completed',
          },
          {
            id: 'act-2',
            task: 'Send advance reminder to executive assistants for vishing schedule',
            owner: customer?.csmName || 'CSM Lead',
            dueDate: date,
            status: 'In Progress',
          },
        ]
      );
    } else if (drill) {
      setRequired(true);
      setMeetingType(drill.drillNumber === 1 ? 'Scope Review' : 'Drill Debrief');
      setDate(drill.actualCompletionDate || drill.plannedDate || SYSTEM_TODAY);
      setParticipants(customer?.customerContact ? `${customer.customerContact}, ${customer.cisoName || 'CISO'}` : '');
      setStatus('Scheduled');
      setDiscussionPoints('');
      setFindings('');
      setActionItems('');
      setNextFollowUpDate('');
      setCustomFields([]);

      setDomainsInScope(customer?.contactEmail ? `@${customer.contactEmail.split('@')[1]}` : '');
      setWhitelistingConfirmed(true);
      setTargetCount(customer?.licenseDetails?.targetEmployeesCount || 500);
      setExcludedGroups('');
      setPhoneSmsCoverage('Direct dialing extension lines & corporate mobile endpoints');
      setApprovedByCiso(true);

      setMomTitle(`MoM: Drill #${drill.drillNumber} Scope & Execution Alignment`);
      setMomStatus('Finalized');
      setMomDecisions('Approved simulation window, confirmed target email domains and whitelisting.');
      setMomNotes('Scope review meeting held between Progist CyberDrill CSM and client security team. All operational boundaries agreed upon.');
      setMomActionItems([
        {
          id: 'act-1',
          task: 'Verify gateway whitelisting 24 hours prior to simulation launch',
          owner: customer?.csmName || 'CSM Lead',
          dueDate: drill.plannedDate,
          status: 'Pending',
        },
      ]);
    }
  }, [drill, customer]);

  if (!isOpen || !drill) return null;

  const handleAddActionItem = () => {
    const newItem: ReviewMeetingActionItem = {
      id: `act-${Date.now()}`,
      task: '',
      owner: customer?.csmName || 'CSM Lead',
      dueDate: date,
      status: 'Pending',
    };
    setMomActionItems([...momActionItems, newItem]);
  };

  const handleUpdateActionItem = (id: string, updates: Partial<ReviewMeetingActionItem>) => {
    setMomActionItems(momActionItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveActionItem = (id: string) => {
    setMomActionItems(momActionItems.filter((item) => item.id !== id));
  };

  const handleCopyMoMSummary = () => {
    const text = `=====================================================
MINUTES OF MEETING (MoM) — ${momTitle}
Organization: ${resolvedCustomerName}
Meeting Type: ${meetingType}
Date: ${formatDisplayDate(date)}
Status: ${momStatus}
Attendees: ${participants || 'Listed Participants'}
=====================================================

1. SCOPE REVIEW PARAMETERS:
- Domains in Scope: ${domainsInScope || 'All Verified Domains'}
- Target User Count: ${targetCount} users
- Whitelisting Verified: ${whitelistingConfirmed ? 'YES' : 'PENDING'}
- Telephony & SMS Scope: ${phoneSmsCoverage || 'Standard'}
- CISO Sign-off: ${approvedByCiso ? 'APPROVED' : 'PENDING'}

2. KEY DECISIONS TAKEN:
${momDecisions || 'None recorded'}

3. DISCUSSION NOTES & FINDINGS:
${momNotes || discussionPoints || 'Routine security review completed.'}

4. AGREED ACTION ITEMS:
${momActionItems.map((item, idx) => `${idx + 1}. [${item.status || 'Pending'}] ${item.task} (Owner: ${item.owner}, Due: ${item.dueDate || 'TBD'})`).join('\n')}

Recorded by: Progist CyberDrill Security Operations
=====================================================`;

    navigator.clipboard.writeText(text);
    setCopiedMom(true);
    setTimeout(() => setCopiedMom(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (customer?.id) {
      updateCustomer(customer.id, { products: meetingProducts });
    }

    const payload: ReviewMeeting = {
      required,
      meetingType,
      title: momTitle.trim() || `Drill #${drill.drillNumber} Review`,
      date: required && date ? date : undefined,
      participants: participants.trim() || undefined,
      status: required ? status : 'Not Scheduled',
      discussionPoints: discussionPoints.trim() || undefined,
      findings: findings.trim() || undefined,
      actionItems: actionItems.trim() || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      customFields: customFields.length > 0 ? customFields : undefined,
      // MoM additions
      momTitle: momTitle.trim() || undefined,
      momStatus,
      momDecisions: momDecisions.trim() || undefined,
      momNotes: momNotes.trim() || undefined,
      momActionItems: momActionItems.length > 0 ? momActionItems : undefined,
      // Scope additions
      scopeDetails: {
        domainsInScope: domainsInScope.trim() || undefined,
        whitelistingConfirmed,
        targetCount: Number(targetCount) || undefined,
        excludedGroups: excludedGroups.trim() || undefined,
        phoneSmsCoverage: phoneSmsCoverage.trim() || undefined,
        approvedByCiso,
      },
    };

    const handler = onSubmit || onSave;
    if (handler) {
      handler(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        id="modal-review-meeting"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Review Meeting & Minutes of Meeting (MoM)
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Drill #{drill.drillNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {resolvedCustomerName} • Drill: {drill.title} ({formatDisplayDate(drill.plannedDate)})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Overview & Debrief vs Scope Review vs Formal MoM */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('meeting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'meeting'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Meeting Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scope')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scope'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Scope Review & Targets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Minutes of Meeting (MoM)</span>
              {momActionItems.length > 0 && (
                <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {momActionItems.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'mom' && (
            <button
              type="button"
              onClick={handleCopyMoMSummary}
              className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedMom ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMom ? 'Copied MoM!' : 'Copy MoM'}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* TAB 1: Meeting Details */}
          {activeTab === 'meeting' && (
            <div className="space-y-4 text-xs">
              {/* Requirement Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Review Meeting Required</div>
                  <div className="text-xs text-slate-500">
                    Mandatory debrief and scope sign-off under customer compliance policy.
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

              {/* Meeting Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Type</label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value as ReviewMeetingType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Scope Review">Scope Review Meeting</option>
                    <option value="Drill Debrief">Drill Debrief Meeting</option>
                    <option value="Executive Review">Executive Review</option>
                    <option value="Quarterly Sync">Quarterly Sync</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReviewMeetingStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Not Scheduled">Not Scheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Attendees / Participants</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Thorne (CISO), David Sterling (Finance VP), R. Gokulalakshmi (CSM)"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Discussion Points & Findings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agenda & Discussion Points</label>
                  <textarea
                    rows={3}
                    placeholder="Key topics, review of whitelist test, scenario approvals..."
                    value={discussionPoints}
                    onChange={(e) => setDiscussionPoints(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Key Findings & Debrief Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Workforce response timing, reporting behavior, areas of risk..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Next Follow-Up / Execution Date</label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Scope Review & Targets */}
          {activeTab === 'scope' && (
            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Target className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 text-sm">
                    Scope Review & Operational Authorization
                  </h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Review and formalize authorized customer targets, IP whitelisting confirmation, telephony extensions for Vishing, and mobile numbers for Smishing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Authorized Domains in Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. @apexfinancial.com, @apex-capital.eu"
                    value={domainsInScope}
                    onChange={(e) => setDomainsInScope(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Seat / Mailbox Count</label>
                  <input
                    type="number"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Telephony & SMS Scope (Vishing & Smishing)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50 executive direct lines for voice vishing; 1,250 corporate mobile numbers for SMS"
                  value={phoneSmsCoverage}
                  onChange={(e) => setPhoneSmsCoverage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Excluded Business Units or Restricted VIPs
                </label>
                <input
                  type="text"
                  placeholder="e.g. Live Trading Desk Floor, Incident Response On-Call Team"
                  value={excludedGroups}
                  onChange={(e) => setExcludedGroups(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whitelistingConfirmed}
                    onChange={(e) => setWhitelistingConfirmed(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Email & Telephony Whitelisting Confirmed</span>
                    <p className="text-[11px] text-slate-500">M365, Proofpoint/Mimecast filters, and SIP trunking tested successfully.</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approvedByCiso}
                    onChange={(e) => setApprovedByCiso(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-800">CISO / Security Committee Formal Sign-off</span>
                    <p className="text-[11px] text-slate-500">Simulation rules of engagement and dates approved by client CISO.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: Minutes of Meeting (MoM) Addition */}
          {activeTab === 'mom' && (
            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      Formal Minutes of Meeting (MoM) Addition
                    </h4>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Record official meeting minutes, client resolutions, and trackable action items with owners and deadlines.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={momStatus}
                    onChange={(e) => setMomStatus(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-900 text-xs"
                  >
                    <option value="Finalized">MoM Finalized</option>
                    <option value="Approved by Client">Approved by Client</option>
                    <option value="Draft">Draft MoM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">MoM Subject / Document Reference</label>
                <input
                  type="text"
                  value={momTitle}
                  onChange={(e) => setMomTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Key Decisions Agreed by Client</label>
                <textarea
                  rows={2}
                  value={momDecisions}
                  onChange={(e) => setMomDecisions(e.target.value)}
                  placeholder="e.g. Agreed to conduct Q2 Vishing voice simulation on June 15 targeting finance team..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Comprehensive Meeting Minutes & Discussion Record</label>
                <textarea
                  rows={4}
                  value={momNotes}
                  onChange={(e) => setMomNotes(e.target.value)}
                  placeholder="Detailed discussion summary, responses to findings, executive questions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono text-[11px] focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Action Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>MoM Action Items & Assignees ({momActionItems.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Action Item</span>
                  </button>
                </div>

                {momActionItems.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] p-3 text-center bg-slate-50 rounded-xl border border-slate-200">
                    No action items recorded yet. Click &quot;Add Action Item&quot; to assign tasks to CSM or client owners.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {momActionItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                      >
                        <div className="sm:col-span-5">
                          <input
                            type="text"
                            placeholder="Action task description..."
                            value={item.task}
                            onChange={(e) => handleUpdateActionItem(item.id, { task: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Owner"
                            value={item.owner}
                            onChange={(e) => handleUpdateActionItem(item.id, { owner: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="date"
                            value={item.dueDate || date}
                            onChange={(e) => handleUpdateActionItem(item.id, { dueDate: e.target.value })}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-end gap-1">
                          <select
                            value={item.status || 'Pending'}
                            onChange={(e) => handleUpdateActionItem(item.id, { status: e.target.value as any })}
                            className="px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveActionItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Fields section */}
          <CustomFieldsFormSection
            fields={customFields}
            onChange={setCustomFields}
            formTitle="Review Meeting Custom Attributes"
            formType="meeting"
          />

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            {drill.reviewMeeting && (drill.reviewMeeting.date || drill.reviewMeeting.status !== 'Not Scheduled') ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Remove this review meeting and MoM from the drill?')) {
                    const handler = onSubmit || onSave;
                    if (handler) {
                      handler(undefined as any);
                    }
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
              >
                Delete Meeting
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-save-review-meeting"
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Review Meeting & MoM</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
