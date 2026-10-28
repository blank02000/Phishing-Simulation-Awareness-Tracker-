import React, { useState } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import {
  X,
  Shield,
  Users,
  Layers,
  Database,
  CheckCircle2,
  Lock,
  Calendar,
  Award,
  Bell,
  Sliders,
  FileText,
  Key,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  BookOpen,
  CheckSquare,
  FileSpreadsheet,
  PhoneCall,
  MessageSquare,
  ClipboardCheck,
  ArrowRight,
  Download,
} from 'lucide-react';
import { FormFieldSection } from '../../types';

interface PlatformAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const PlatformAuditModal: React.FC<PlatformAuditModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    customers,
    users,
    currentUser,
    customizationSettings,
    referenceDate,
    authSession,
    getActiveSessionRemainingTime,
  } = useCustomerContext();

  const [activeAuditTab, setActiveAuditTab] = useState<'guide' | 'users' | 'modules' | 'schema' | 'architecture'>('guide');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sessionRemaining = getActiveSessionRemainingTime();

  // Compute live statistics
  const totalCustomers = customers.length;
  let totalDrills = 0;
  let completedDrills = 0;
  let totalDeliverables = 0;

  customers.forEach((c) => {
    const plan = c.annualPlans?.[c.currentYear || 2026];
    if (plan?.drills) {
      totalDrills += plan.drills.length;
      completedDrills += plan.drills.filter((d) => d.status === 'Completed' || d.status === 'Completed Late').length;
    }
    if (plan?.deliverables) {
      totalDeliverables += plan.deliverables.length;
    }
  });

  const sectionsList: { section: FormFieldSection; label: string; desc: string }[] = [
    { section: 'accountDetails', label: 'Account Details', desc: 'Company identity, ERP IDs, sector classification' },
    { section: 'contacts', label: 'Contacts & Stakeholders', desc: 'Emergency contacts, C-suite escalation points' },
    { section: 'licenseInfo', label: 'License & Contracts', desc: 'Contract tiers, seat allowances, SLA codes' },
    { section: 'generalNotes', label: 'Account Notes', desc: 'Internal audits, risk notes, executive meetings' },
    { section: 'userProfile', label: 'User Profiles', desc: 'CSM certifications, employee IDs, department units' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Platform Capabilities & Feature Audit</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  v2.6 Enterprise SecOps
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive operational blueprint, user access matrix, and dynamic feature registry.
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

        {/* Live System Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 border-b border-slate-200 text-xs">
          <div className="bg-white px-4 py-3 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Registered Accounts</span>
            <span className="text-lg font-black text-slate-800 mt-0.5">{totalCustomers} Companies</span>
          </div>
          <div className="bg-white px-4 py-3 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Drill Progress</span>
            <span className="text-lg font-black text-emerald-600 mt-0.5">{completedDrills} / {totalDrills} Executed</span>
          </div>
          <div className="bg-white px-4 py-3 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Configured Custom Fields</span>
            <span className="text-lg font-black text-blue-600 mt-0.5">{customizationSettings?.fields?.length || 0} Dynamic Fields</span>
          </div>
          <div className="bg-white px-4 py-3 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Simulation Ref Date</span>
            <span className="text-lg font-black text-purple-600 mt-0.5 font-mono">{referenceDate}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 shrink-0 gap-4 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveAuditTab('guide')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeAuditTab === 'guide'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>How the Tool Works (Operating Manual)</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 text-blue-800">
              DOCS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditTab('users')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeAuditTab === 'users'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Role Matrix ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditTab('modules')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeAuditTab === 'modules'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>10 Platform Modules & Features</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditTab('schema')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeAuditTab === 'schema'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Form Fields Schema ({customizationSettings?.fields?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditTab('architecture')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
              activeAuditTab === 'architecture'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Architecture & Persistence</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700 space-y-6">
          {/* TAB: OPERATING GUIDE & HOW THE TOOL WORKS */}
          {activeAuditTab === 'guide' && (
            <div className="space-y-6 text-slate-800">
              {/* Hero Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      Standard Operating Procedure
                    </span>
                    <span className="text-xs text-slate-400">CyberDrill Operations Manual v2.6</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-white">
                    How CyberDrill Works: Complete System Walkthrough
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    CyberDrill is an operations hub for Customer Success Managers and SecOps administrators to manage simulated cyber attacks, verify scope whitelisting, conduct formal review meetings, and generate auditable compliance certificates.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/HOW_THE_TOOL_WORKS.md"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View HOW_THE_TOOL_WORKS.md</span>
                  </a>
                </div>
              </div>

              {/* 7-Step Operational Lifecycle Flow */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    7-Step Operational Lifecycle
                  </h4>
                  <span className="text-[11px] text-slate-500">From onboarding to annual compliance sign-off</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  {/* Step 1 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black flex items-center justify-center text-xs">
                        1
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Onboarding</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Account & Excel License Upload</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Create customer accounts manually, in bulk, or upload Excel licenses (<code className="text-emerald-700 font-mono">.xlsx</code>). SheetJS parses multi-sheet workbooks and allocates quotas for Phishing, Vishing, Smishing, and Gamification games.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                        2
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Planning</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>Annual Simulation Plan</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Configure yearly requirements (e.g. 4 drills/year, quarterly intervals). Schedule simulation dates across vectors: Email Phishing, Voice Vishing, SMS Smishing, and Ransomware crisis drills.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs">
                        3
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pre-Drill</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ClipboardCheck className="w-4 h-4 text-amber-600" />
                      <span>Scope Review & CISO Sign-Off</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Conduct pre-drill Scope Reviews to verify mail filter whitelisting, authorize target email domains, set seat counts, confirm phone/SMS prefixes, and document formal CISO sign-off.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-black flex items-center justify-center text-xs">
                        4
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Execution</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-rose-600" />
                      <span>Drill Execution & Metrics</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Execute simulation campaigns. Record total participants, Click Rate %, Credential Submission %, and ProPatrol Reporting %. The system calculates Passed, Needs Improvement, or High Risk outcomes.
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">
                        5
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Governance</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span>Debrief & Minutes of Meeting</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Host drill debrief meetings. Log key executive decisions, recommendations, and trackable action items with owners and deadlines. Generate one-click MoM email summaries.
                    </p>
                  </div>

                  {/* Step 6 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                        6
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Operations</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>TaskFlow Kanban Board</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Track operational tasks across To Do, In Progress, and Done. Tasks auto-sync with scheduled drills, upcoming deliverables, and MoM action items with direct deep-links.
                    </p>
                  </div>

                  {/* Step 7 */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors md:col-span-2 lg:col-span-3">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                        7
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Compliance</span>
                    </div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal-600" />
                      <span>Compliance Verification, Alerts & PDF Audit Reports</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Monitor live SLA status (On Track, Due Soon, Overdue, At Risk). Generate multi-page executive PDF compliance certificates with vector charts, participation stats, and historical audit tables for ISO 27001 and SOC 2 audits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Vectors & Categorization */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Supported Simulation Vectors & Customer Categorization</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span>🎣</span>
                      <span>Phishing Simulations</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Email simulations targeting corporate inboxes. Supports credential harvesting, attachments, executive spear phishing, and urgent invoices.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-1">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
                      <span>Vishing (Voice Phishing)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Simulated phone calls impersonating IT Helpdesk, banks, or suppliers to test employee voice verification protocols.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      <span>Smishing (SMS Phishing)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      SMS text message lures with shortlinks simulating MFA verification, delivery tracking, and payroll notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact Mathematical Formulae */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-xs">
                <div className="font-sans font-bold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>SLA State Machine & Mathematical Decision Logic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
                    <div className="text-emerald-400 font-bold font-sans">Drill SLA Status Logic:</div>
                    <div className="text-slate-300">
                      • Completed if completionDate &le; plannedDate<br />
                      • Completed Late if completionDate &gt; plannedDate<br />
                      • Overdue if refDate &gt; plannedDate<br />
                      • Due Soon if refDate &ge; (plannedDate - dueSoonDays)<br />
                      • Upcoming if refDate &lt; (plannedDate - dueSoonDays)
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 space-y-1">
                    <div className="text-indigo-400 font-bold font-sans">Account Compliance Status:</div>
                    <div className="text-slate-300">
                      • Completed: totalCompleted &ge; annualRequirement<br />
                      • Overdue: any active drill is Overdue<br />
                      • At Risk: &gt; 1 drill overdue or time insufficient<br />
                      • Due Soon: any drill is Due Soon<br />
                      • On Track: all scheduled drills upcoming
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Quick Links */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Switch to other tabs above to inspect live User RBAC, the 10 Module registry, or Custom Field schemas.
                </span>
                <div className="flex items-center gap-2">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('tasks');
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200"
                    >
                      <span>Open TaskFlow</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateTab('customers');
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>View Customers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: USERS & ROLE MATRIX */}
          {activeAuditTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900">Role-Based Access Control (RBAC) Architecture</div>
                  <p className="text-slate-600 leading-relaxed">
                    The platform enforces two primary role paradigms: <strong>Platform Administrator (`Admin`)</strong> and <strong>Customer Success Manager (`CSM`)</strong>.
                    Administrators possess complete governance across customer accounts, CSM allocations, user provisioning, and Customization Studio. CSMs are assigned explicit books of business with drill management and reporting capabilities.
                  </p>
                  {authSession && (
                    <div className="mt-2 text-[11px] text-blue-800 font-mono bg-white/80 p-2 rounded-lg border border-blue-200">
                      Current Active User: <strong>{currentUser.name}</strong> ({currentUser.role}) • Session Valid: <strong>{sessionRemaining?.formatted || 'Active'}</strong> • Token Prefix: {authSession.token.slice(0, 16)}...
                    </div>
                  )}
                </div>
              </div>

              {/* User Directory Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Configured User Accounts on Platform</span>
                  <span className="text-slate-500 font-normal">{users.length} Total Users</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">User & Persona</th>
                        <th className="py-2.5 px-4">Role & Status</th>
                        <th className="py-2.5 px-4">Job Title</th>
                        <th className="py-2.5 px-4">Assigned Accounts</th>
                        <th className="py-2.5 px-4">Primary Permissions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {users.map((u) => {
                        const assignedCount = customers.filter((c) => c.csmId === u.id).length;
                        const perms = u.permissions;
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold ${u.avatarColor || 'bg-blue-600'}`}>
                                  {u.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{u.name}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {u.role}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {u.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-600">{u.title}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                                {assignedCount} {assignedCount === 1 ? 'account' : 'accounts'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {perms?.canManageCustomization && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
                                    Customization Studio
                                  </span>
                                )}
                                {perms?.canManageUsers && (
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                    Manage Users
                                  </span>
                                )}
                                {perms?.canDeleteCustomers && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                                    Delete Accounts
                                  </span>
                                )}
                                {perms?.canManageDrills && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                    Manage Drills
                                  </span>
                                )}
                                {perms?.canExportReports && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                    Reports
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 10 PLATFORM MODULES & FEATURES */}
          {activeAuditTab === 'modules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Detailed architectural breakdown of all 10 core operational modules currently live on CyberDrill.
                </p>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search feature or capability..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Module 1 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Module 01
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/dashboard</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Executive Dashboard & Temporal Simulation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Provides global SecOps posture and individual CSM portfolio tracking. Includes high-risk account alerts, compliance status distributions, product adoption metrics (ProPhish, ProLMS, ProPatrol), and an interactive <strong>Temporal Time-Travel Engine</strong> to simulate future review dates.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Time-Travel Engine</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Health Radar</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Portfolio Filtering</span>
                  </div>
                </div>

                {/* Module 2 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      Module 02
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/customers</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Customer Account & Lifecycle Management</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paginated customer directory with search, filter by CSM/industry/status, lifecycle states (`Active`, `Onboarding`, `At Risk`, `Paused`), dual-stakeholder tracking (Day-to-day Contact vs CISO / Executive), and bulk CSV / Excel ingestion.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Dual Contacts</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Bulk CSV Importer</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Account Notes Hub</span>
                  </div>
                </div>

                {/* Module 3 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Module 03
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/calendar</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Simulation Drills & Annual Compliance Engine</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated generation of annual drill plans based on contract cadence. Supports 8 drill typologies (Phishing, Smishing, Spear Phishing, USB Drop, Credential Harvesting, Ransomware). Tracks execution metrics (participants, click rate %, submission rate %, reporting rate %).
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">8 Simulation Types</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Click & Reporting Rates</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Cadence State Machine</span>
                  </div>
                </div>

                {/* Module 4 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Module 04
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/deliverables</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">LMS Security Awareness Deliverables</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Tracks recurring training modules, employee awareness collateral, target audience segmentation (All Employees, Engineering, Executives), completion scoring, and courseware attachments.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Target Audiences</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Completion Percentages</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Collateral Attachments</span>
                  </div>
                </div>

                {/* Module 5 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Module 05
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/reviews</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Debrief Reviews & Post-Mortem Tracking</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Formal post-drill stakeholder debriefs. Captures attendee logs, key vulnerabilities, discussion points, corrective action items, and next follow-up dates.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Stakeholder Debriefs</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Action Item Logs</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Vulnerability Analysis</span>
                  </div>
                </div>

                {/* Module 6 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Module 06
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/reminders</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Alerts & Notification Dispatcher</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated algorithmic alerting engine that identifies upcoming, due-soon, and overdue simulation windows based on reference date. Includes simulated email dispatch with live preview and toast notifications.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Algorithmic Alerts</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Email Dispatch Preview</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Severity Tiering</span>
                  </div>
                </div>

                {/* Module 7 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
                      Module 07
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/reports</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Annual Compliance & Executive Reports</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Export-ready annual audit certificates and executive reports. Aggregates annual completion rates, click rate improvements, reporting trend benchmarks, and formal sign-offs.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Executive Certificates</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Audit Compliance Logs</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Print / PDF Stylesheets</span>
                  </div>
                </div>

                {/* Module 8 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                      Module 08
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/team</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">CSM Team & User Administration</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    User directory, role assignments, custom profile fields, automated welcome email generation, session expiration tracking (7h timeout counter), and password / email OTP authentication modes.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Email OTP Login</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">7-Hour Active Token</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">User Profile Custom Fields</span>
                  </div>
                </div>

                {/* Module 9 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded">
                      Module 09
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/customization</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Customization Studio (Dynamic Schema Engine)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Schema-driven Form Fields Designer covering 5 sections (`accountDetails`, `contacts`, `licenseInfo`, `generalNotes`, `userProfile`). Supports 8 field types (Text, Number, Date, Dropdown/Select, Textarea, Boolean Switch, Email, Phone/Tel) with live preview and dual persistence.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">5 Dynamic Sections</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">8 Field Input Types</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Single Source of Truth</span>
                  </div>
                </div>

                {/* Module 10 */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Module 10
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/customer-detail</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Digital License Vault & Certificate Engine</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Auto-generates cryptographically formatted customer licenses with issue dates, expiry warnings, seat quotas, and license keys. Includes an interactive Digital Certificate viewer with print/download styling.
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Auto License Keys</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Digital Certificates</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">Expiry Threshold Alerts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM FORM FIELDS SCHEMA */}
          {activeAuditTab === 'schema' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Schema-Driven Field Registry (`customizationSettings.fields`)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Current active schema definitions serving as the single source of truth across customer forms and user profile modals.
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('customization');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Customization Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {sectionsList.map(({ section, label, desc }) => {
                  const sectionFields = customizationSettings?.fields?.filter((f) => f.section === section) || [];
                  return (
                    <div key={section} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{label} <span className="font-mono text-[10px] text-slate-500 font-normal">({section})</span></div>
                          <div className="text-[11px] text-slate-400">{desc}</div>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-200/80 rounded-md text-[10px] font-bold text-slate-700">
                          {sectionFields.length} {sectionFields.length === 1 ? 'Field' : 'Fields'}
                        </span>
                      </div>
                      {sectionFields.length === 0 ? (
                        <div className="p-4 text-xs text-slate-400 italic text-center">
                          No custom fields configured for this section yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sectionFields.map((field) => (
                            <div key={field.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-600 font-mono text-[11px] uppercase font-bold">
                                  {field.type}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{field.label}</span>
                                    {field.required && (
                                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1 rounded">Required</span>
                                    )}
                                    {field.isSystem && (
                                      <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1 rounded">System</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    key: <span className="text-slate-600 font-bold">{field.key}</span> • id: {field.id}
                                    {field.placeholder && <span> • placeholder: "{field.placeholder}"</span>}
                                  </div>
                                </div>
                              </div>
                              {field.options && field.options.length > 0 && (
                                <div className="text-right">
                                  <span className="text-[11px] text-slate-500 font-medium">Options: </span>
                                  <span className="text-[11px] text-slate-700 font-bold font-mono">[{field.options.join(', ')}]</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE & PERSISTENCE */}
          {activeAuditTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span>Dual Storage Strategy (Local-First + Cloud Firestore)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The platform implements a resilient local-first architecture. All user, customer, and custom field state hydrates instantly from browser <code className="text-slate-800 font-mono bg-slate-200 px-1 rounded">localStorage</code>, eliminating initial render latency or offline stalls.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                      <span>localStorage: cs_hub_customers</span>
                      <span className="text-emerald-600 font-bold">Synchronized</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                      <span>localStorage: cs_hub_users</span>
                      <span className="text-emerald-600 font-bold">Synchronized</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 font-mono text-[11px]">
                      <span>localStorage: cs_hub_customization</span>
                      <span className="text-emerald-600 font-bold">Synchronized</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span>Security & Session Lifecycle</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sessions are issued with high-entropy cryptographic tokens valid for 7 hours. Inactivity countdown is evaluated periodically. Users can authenticate either with passwords or simulated one-time email OTP verification.
                  </p>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-bold text-slate-800">Firestore Collections:</div>
                    <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px] font-mono">
                      <li>collection("customers") - Customer accounts & annual plans</li>
                      <li>collection("users") - Admin and CSM staff profiles</li>
                      <li>doc("app_config/customization") - Central schema repository</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                <h4 className="text-xs font-bold text-slate-900">End-to-End Validation & Form State Protection</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The reusable <code className="text-slate-800 font-mono bg-slate-100 px-1 rounded">SectionCustomFields</code> component guarantees that every configured field from <code className="text-slate-800 font-mono bg-slate-100 px-1 rounded">customizationSettings.fields</code> renders even if the existing record lacks a prior value. Inline field creation retains all currently typed input values without wiping state.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>CyberDrill SecOps & Customer Success Intelligence System</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
