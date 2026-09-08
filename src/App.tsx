/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CustomerProvider, useCustomerContext } from './context/CustomerContext';
import { NavTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { CustomerListView } from './components/CustomerListView';
import { CustomerDetailView } from './components/CustomerDetailView';
import { CalendarView } from './components/CalendarView';
import { RemindersView } from './components/RemindersView';
import { AnnualReportView } from './components/AnnualReportView';
import { ReviewsView } from './components/ReviewsView';
import { CsmManagementView } from './components/CsmManagementView';

import { CreateCustomerModal } from './components/modals/CreateCustomerModal';
import { EditCustomerModal } from './components/modals/EditCustomerModal';
import { CompleteDrillModal } from './components/modals/CompleteDrillModal';
import { EditDrillModal } from './components/modals/EditDrillModal';
import { ReviewMeetingModal } from './components/modals/ReviewMeetingModal';
import { NewYearPlanModal } from './components/modals/NewYearPlanModal';
import { CreateEditDeliverableModal } from './components/modals/CreateEditDeliverableModal';
import { CompleteDeliverableModal } from './components/modals/CompleteDeliverableModal';
import { BulkUploadModal } from './components/modals/BulkUploadModal';
import { LoginView } from './components/LoginView';
import { Customer, DrillRecord, ReviewMeeting, LmsDeliverable } from './types';
import { generateReminders } from './utils/drillCalculator';
import { Mail, X } from 'lucide-react';

function MainApp() {
  const {
    customers,
    currentUser,
    selectedCustomerId,
    setSelectedCustomerId,
    referenceDate,
    dueSoonDays,
    addCustomer,
    markDrillCompleted,
    updateDrillSchedule,
    updateReviewMeeting,
    createNewYearPlan,
    deleteLmsDeliverable,
    lastSentEmail,
    clearLastSentEmail,
  } = useCustomerContext();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const urgentAlertsCount = useMemo(() => {
    const reminders = generateReminders(customers, referenceDate, dueSoonDays);
    return reminders.filter((r) => r.severity === 'high' || r.severity === 'medium').length;
  }, [customers, referenceDate, dueSoonDays]);

  // Modal States
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const [editCustomerState, setEditCustomerState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    initialTab?: 'profile' | 'dates' | 'drills';
  }>({
    isOpen: false,
    customer: null,
    initialTab: 'profile',
  });

  const [completeDrillState, setCompleteDrillState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [editDrillState, setEditDrillState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [reviewMeetingState, setReviewMeetingState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    drill: DrillRecord | null;
  }>({
    isOpen: false,
    customer: null,
    drill: null,
  });

  const [newYearPlanState, setNewYearPlanState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    currentYear: number;
  }>({
    isOpen: false,
    customer: null,
    currentYear: 2026,
  });

  const [reportParams, setReportParams] = useState<{
    customerId?: string;
    year?: number;
  }>({});

  const [deliverableModalState, setDeliverableModalState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    deliverable: LmsDeliverable | null;
    selectedYear: number;
  }>({
    isOpen: false,
    customer: null,
    deliverable: null,
    selectedYear: 2026,
  });

  const [completeDeliverableState, setCompleteDeliverableState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    deliverable: LmsDeliverable | null;
    selectedYear: number;
  }>({
    isOpen: false,
    customer: null,
    deliverable: null,
    selectedYear: 2026,
  });

  // Handlers
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveTab('customers');
  };

  const handleOpenEditCustomer = (
    customer: Customer,
    initialTab: 'profile' | 'dates' | 'drills' = 'profile'
  ) => {
    setEditCustomerState({
      isOpen: true,
      customer,
      initialTab,
    });
  };

  const handleOpenCompleteDrill = (customer: Customer, drill: DrillRecord) => {
    setCompleteDrillState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenEditDrill = (customer: Customer, drill: DrillRecord) => {
    setEditDrillState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenReviewMeeting = (customer: Customer, drill: DrillRecord) => {
    setReviewMeetingState({
      isOpen: true,
      customer,
      drill,
    });
  };

  const handleOpenNewYearPlan = (customer: Customer, currentYear: number) => {
    setNewYearPlanState({
      isOpen: true,
      customer,
      currentYear,
    });
  };

  const handleOpenAddDeliverable = (customer: Customer, year: number) => {
    setDeliverableModalState({
      isOpen: true,
      customer,
      deliverable: null,
      selectedYear: year,
    });
  };

  const handleOpenEditDeliverable = (customer: Customer, deliverable: LmsDeliverable) => {
    const year = Object.keys(customer.annualPlans).map(Number).find(yr => 
      customer.annualPlans[yr].deliverables?.some(d => d.id === deliverable.id)
    ) || customer.currentYear || 2026;

    setDeliverableModalState({
      isOpen: true,
      customer,
      deliverable,
      selectedYear: year,
    });
  };

  const handleOpenCompleteDeliverable = (customer: Customer, deliverable: LmsDeliverable) => {
    const year = Object.keys(customer.annualPlans).map(Number).find(yr => 
      customer.annualPlans[yr].deliverables?.some(d => d.id === deliverable.id)
    ) || customer.currentYear || 2026;

    setCompleteDeliverableState({
      isOpen: true,
      customer,
      deliverable,
      selectedYear: year,
    });
  };

  const handleDeleteDeliverable = (customer: Customer, year: number, deliverableId: string) => {
    if (window.confirm('Are you sure you want to delete this Pro LMS deliverable?')) {
      deleteLmsDeliverable(customer.id, year, deliverableId);
    }
  };

  const handleViewAnnualReport = (customerId: string, year: number) => {
    setReportParams({ customerId, year });
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans antialiased text-slate-900 overflow-hidden">
      {/* Left Icon Navigation Rail */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'customers') setSelectedCustomerId(null);
          setActiveTab(tab);
        }}
        urgentAlertsCount={urgentAlertsCount}
      />

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar with Breadcrumbs & Simulation Controls */}
        <TopHeader
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab !== 'customers') setSelectedCustomerId(null);
            setActiveTab(tab);
          }}
        />

        {/* Scrollable Main Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          <div className="max-w-7xl mx-auto">
            {/* Render Customer Detail if selected */}
            {selectedCustomerId && activeTab === 'customers' ? (
              <CustomerDetailView
                customerId={selectedCustomerId}
                onBack={() => setSelectedCustomerId(null)}
                onOpenCompleteDrill={handleOpenCompleteDrill}
                onOpenEditDrill={handleOpenEditDrill}
                onOpenReviewMeeting={handleOpenReviewMeeting}
                onOpenNewYearPlan={handleOpenNewYearPlan}
                onViewAnnualReport={handleViewAnnualReport}
                onOpenAddDeliverable={handleOpenAddDeliverable}
                onOpenEditDeliverable={handleOpenEditDeliverable}
                onOpenCompleteDeliverable={handleOpenCompleteDeliverable}
                onDeleteDeliverable={handleDeleteDeliverable}
              />
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                    onNavigateTab={(tab) => {
                      if (tab === 'customers') setSelectedCustomerId(null);
                      setActiveTab(tab);
                    }}
                  />
                )}

                {activeTab === 'customers' && (
                  <CustomerListView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenCreateCustomer={() => setIsCreateCustomerOpen(true)}
                    onOpenBulkUpload={() => setIsBulkUploadOpen(true)}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                    onOpenEditCustomer={handleOpenEditCustomer}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    onSelectCustomer={handleSelectCustomer}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                  />
                )}

                {activeTab === 'reviews' && (
                  <ReviewsView
                    onSelectCustomer={handleSelectCustomer}
                    onOpenReviewMeeting={handleOpenReviewMeeting}
                  />
                )}

                {activeTab === 'reminders' && (
                  <RemindersView
                    onSelectCustomer={handleSelectCustomer}
                    onMarkDrillComplete={handleOpenCompleteDrill}
                  />
                )}

                {activeTab === 'reports' && (
                  <AnnualReportView
                    initialCustomerId={reportParams.customerId}
                    initialYear={reportParams.year}
                    onSelectCustomer={handleSelectCustomer}
                  />
                )}

                {activeTab === 'team' && (
                  <CsmManagementView
                    onSelectCustomer={handleSelectCustomer}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateCustomerModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onSubmit={(data) => {
          const newCust = addCustomer(data);
          handleSelectCustomer(newCust.id);
        }}
      />

      <EditCustomerModal
        isOpen={editCustomerState.isOpen}
        onClose={() => setEditCustomerState({ isOpen: false, customer: null })}
        customer={editCustomerState.customer}
        initialTab={editCustomerState.initialTab}
      />

      <CompleteDrillModal
        isOpen={completeDrillState.isOpen}
        onClose={() => setCompleteDrillState({ isOpen: false, customer: null, drill: null })}
        customer={completeDrillState.customer}
        drill={completeDrillState.drill}
        onSubmit={(results) => {
          if (completeDrillState.customer && completeDrillState.drill) {
            markDrillCompleted(
              completeDrillState.customer.id,
              completeDrillState.drill.id,
              results
            );
          }
        }}
      />

      <EditDrillModal
        isOpen={editDrillState.isOpen}
        onClose={() => setEditDrillState({ isOpen: false, customer: null, drill: null })}
        customer={editDrillState.customer}
        drill={editDrillState.drill}
        onSubmit={(drillData) => {
          if (editDrillState.customer && editDrillState.drill) {
            updateDrillSchedule(
              editDrillState.customer.id,
              editDrillState.drill.id,
              drillData
            );
          }
        }}
      />

      <ReviewMeetingModal
        isOpen={reviewMeetingState.isOpen}
        onClose={() => setReviewMeetingState({ isOpen: false, customer: null, drill: null })}
        customer={reviewMeetingState.customer}
        drill={reviewMeetingState.drill}
        onSubmit={(meetingData) => {
          if (reviewMeetingState.customer && reviewMeetingState.drill) {
            updateReviewMeeting(
              reviewMeetingState.customer.id,
              reviewMeetingState.drill.id,
              meetingData
            );
          }
        }}
      />

      <NewYearPlanModal
        isOpen={newYearPlanState.isOpen}
        onClose={() => setNewYearPlanState({ isOpen: false, customer: null, currentYear: 2026 })}
        customer={newYearPlanState.customer}
        currentYear={newYearPlanState.currentYear}
        onSubmit={(year, startDate, annualRequirement, intervalMonths, defaultDrillType, notes) => {
          if (newYearPlanState.customer) {
            createNewYearPlan(
              newYearPlanState.customer.id,
              year,
              startDate,
              annualRequirement,
              intervalMonths,
              defaultDrillType,
              notes
            );
          }
        }}
      />

      <CreateEditDeliverableModal
        isOpen={deliverableModalState.isOpen}
        onClose={() => setDeliverableModalState({ isOpen: false, customer: null, deliverable: null, selectedYear: 2026 })}
        customer={deliverableModalState.customer}
        deliverable={deliverableModalState.deliverable}
        selectedYear={deliverableModalState.selectedYear}
      />

      <CompleteDeliverableModal
        isOpen={completeDeliverableState.isOpen}
        onClose={() => setCompleteDeliverableState({ isOpen: false, customer: null, deliverable: null, selectedYear: 2026 })}
        customer={completeDeliverableState.customer}
        deliverable={completeDeliverableState.deliverable}
        selectedYear={completeDeliverableState.selectedYear}
      />

      {/* Email Notification Toast when CSM is created */}
      {lastSentEmail && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl p-5 border border-slate-700 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Welcome Email Dispatched</h4>
                <p className="text-xs text-slate-400">{lastSentEmail.timestamp}</p>
              </div>
            </div>
            <button
              onClick={clearLastSentEmail}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-800/90 rounded-xl p-3 text-xs space-y-1.5 border border-slate-700/60 font-mono">
            <div className="text-slate-300"><span className="text-slate-500">To:</span> {lastSentEmail.to}</div>
            <div className="text-slate-300"><span className="text-slate-500">Subject:</span> {lastSentEmail.subject}</div>
            <div className="text-slate-400 whitespace-pre-line mt-1 pt-1 border-t border-slate-700/60">{lastSentEmail.body}</div>
          </div>
        </div>
      )}

      {/* Bulk Excel / CSV Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
      />
    </div>
  );
}

function RootContent() {
  const { isAuthenticated } = useCustomerContext();
  if (!isAuthenticated) {
    return <LoginView />;
  }
  return <MainApp />;
}

export default function App() {
  return (
    <CustomerProvider>
      <RootContent />
    </CustomerProvider>
  );
}
