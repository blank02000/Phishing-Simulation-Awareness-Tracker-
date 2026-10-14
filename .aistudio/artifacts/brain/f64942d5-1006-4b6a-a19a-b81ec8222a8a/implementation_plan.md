# Platform Capabilities Audit & Feature Architecture Blueprint

Comprehensive audit report, role permission matrix, and feature taxonomy documenting every user persona, operational capability, data persistence mechanism, and functional workflow currently implemented in the **CyberDrill (Phishing Simulation & Awareness Tracker)** platform.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your clarifying choices, this blueprint details a comprehensive audit report and feature breakdown covering all platform modules (Customers, CSMs, Simulation Drills, LMS Deliverables, Customization Studio, and Persistence Layers). It also outlines an optional in-app **Platform Capabilities Matrix** view so team members can inspect live system capabilities and role boundaries directly within the interface.

- **Confirmed Presentation Format**: Comprehensive audit report and feature breakdown.
- **Confirmed Domain Focus**: Exhaustive end-to-end breakdown across all modules: Customer Management, CSM Operations, Customization Studio, Simulation Engine, and Platform Security.
- **In-App Integration Recommendation**: Embed an accessible, read-only "Platform Capabilities & Audit Guide" drawer/dialog inside the application to allow administrators and auditors to review system capabilities live alongside existing workflows.

---

## 1. Overview & Core Concept

**CyberDrill** is an enterprise customer success operations and cybersecurity compliance management platform. It coordinates and tracks customer security simulations (phishing drills, executive spear-phishing, smishing, USB drops, credential harvesting) and Learning Management System (LMS) security awareness deliverables across annual contract lifecycles.

### Target Personas & User Profiles

| Persona / Role | Core Responsibilities | Key Needs & Primary Workflows |
| :--- | :--- | :--- |
| **Platform Administrator (`Admin`)** | System configuration, schema design, user provisioning, global customer governance. | Full CRUD on customers, assigning CSMs, configuring dynamic form fields in Customization Studio, managing user accounts and roles, configuring session timeouts and OTP authentication. |
| **Customer Success Manager (`CSM`)** | Account health oversight, simulation execution, cadence tracking, meeting debriefs. | Dedicated customer book-of-business view, completing planned drills, logging phishing metrics (click rates, report rates), scheduling debrief reviews, tracking LMS deliverable milestones. |
| **Account Owner / Executive Sponsor** | Strategic account alignment, contract renewals, executive reporting. | Annual compliance summaries, renewal radar, digital license certificates, high-level risk posture reviews. |

---

## 2. Platform Modules & Feature Breakdown

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CYBERDRILL PLATFORM MAP                                  │
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
│ CUSTOMER LIFECYCLE       │ SIMULATION & COMPLIANCE  │ ADMINISTRATION & CUSTOMIZATION   │
│ • Account Management     │ • Annual Drill Calendars │ • Role-Based Access Control      │
│ • Contact & CISO Registry│ • Compliance Engine      │ • Form Fields Designer           │
│ • Product Suite Matrix   │ • Debrief Reviews Hub    │ • Dynamic Schema Synchronization │
│ • Digital License Vault  │ • Real-time Alert Center │ • Dual Firestore + Local Storage │
│ • Account Notes Audit    │ • Executive Reports      │ • Temporal Simulation Controls   │
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### Module 1: Executive Dashboard & Analytics
- **Summary Metrics**: Real-time counters for Total Accounts, Active Drills, High-Risk Accounts, and Due Soon Drills.
- **Temporal Time Travel Engine**: Configurable reference date (`referenceDate`) and warning window (`dueSoonDays`), allowing operators to simulate future dates and stress-test renewal or drill compliance alerts.
- **Urgent Action Radar**: Severity-tiered alerts (High, Medium, Low) flagged by automated drill window algorithms.
- **Compliance Distribution Chart**: Visual distribution of accounts across `On Track`, `Due Soon`, `Overdue`, `Completed`, and `At Risk`.
- **Product Adoption Metrics**: Breakdown of accounts using ProPhish (simulations), ProLMS (courseware), and ProPatrol (email reporting button).

### Module 2: Customer Account Management
- **Central Customer Registry**: Paginated, filterable directory with real-time search across company name, industry, CSM, and contact email.
- **Customer Lifecycle States**: Explicit states (`Active`, `Onboarding`, `At Risk`, `Paused`, `Inactive`).
- **Granular Security Contacts**: Dual-contact tracking separating Day-to-Day Operations from CISO / Executive contacts (name, email, direct phone).
- **Product Entitlement Flags**: Explicit toggles for ProPhish, ProLMS, and ProPatrol.
- **Digital License Vault & Certificate Engine**:
  - Auto-generated and uploaded customer license files with issue dates, expiry dates, seat quotas, and license keys.
  - Interactive Digital Certificate generator rendering verifiable license credentials with print/export styling.
- **Structured Account Notes Hub**: General notes with categorization (`Technical`, `Billing`, `Strategic`, `Meeting`, `Risk`) and timestamped author tracking.
- **Bulk Upload & Ingestion**: CSV/JSON bulk importer for rapid account onboarding.

### Module 3: Simulation Drills & Annual Compliance Engine
- **Annual Cadence Calculation**: Automated generation of quarterly, bi-monthly, or monthly drill schedules based on contract start dates and requirement targets.
- **Supported Drill Typologies**:
  - Phishing Email Simulation
  - Spear Phishing / Executive Impersonation
  - Smishing (SMS)
  - Credential Harvesting
  - Ransomware Awareness
  - USB Drop / Physical Security
  - Social Engineering Call
  - Custom Drills
- **Completion & Evaluation Machine**:
  - Records planned date, actual execution date, participants count, click rate %, submission rate %, reporting rate %.
  - Automatic result classification (`Passed`, `Needs Improvement`, `High Risk`, `Pending Review`).
  - Comprehensive status state machine (`Upcoming`, `Due Soon`, `Completed`, `Completed Late`, `Overdue`, `Cancelled`).

### Module 4: LMS Security Awareness Deliverables
- **Cadence & Milestone Tracking**: Schedules monthly, quarterly, or yearly training modules for employee cohorts.
- **Target Audience Segmentation**: Filterable by audience (All Employees, Engineering, Executives, Finance).
- **Completion Scoring & Attachment Uploads**: Tracks progress rates and archives training collateral.

### Module 5: Debrief Reviews & Post-Mortem Tracking
- **Post-Drill Debrief Workflows**: Scheduled stakeholder sessions to analyze user vulnerabilities and repeat offenders.
- **Structured Findings**: Captures discussion points, critical vulnerabilities, action items, and next follow-up dates.

### Module 6: Alerts & Notification Center
- **Automated Algorithmic Reminders**: Dynamically evaluates all customer drills against the active reference date and alert window.
- **Email Dispatching Simulation**: Generates and simulates email notifications to customer contacts and assigned CSMs, complete with preview modal and toast feedback.

### Module 7: Annual Compliance & Executive Reports
- **Executive Report Generator**: Generates formal annual compliance certificates and audit reports.
- **Customizable Metrics**: Annual completion rates, average click rate benchmarks, reporting rate improvements.
- **Print & PDF Layouts**: Dedicated print stylesheets ensuring clean executive-ready exports.

### Module 8: CSM Team & User Administration
- **User Directory**: Full team list with roles, titles, activity states, and assigned customer counts.
- **Granular RBAC Permissions**:
  - `canCreateCustomers`, `canEditCustomers`, `canDeleteCustomers`
  - `canManageUsers`, `canAssignCsm`
  - `canManageDrills`, `canExportReports`, `canManageCustomization`
- **Authentication & Session Security**:
  - Password and Email OTP authentication workflows.
  - Session expiration tracking with remaining time counter and auto-logout.
- **User Profile Custom Fields**: Seamlessly supports administrator-configured custom fields on user accounts.

### Module 9: Customization Studio (Dynamic Schema Engine)
- **Form Fields Designer**: Configure custom fields across five isolated form sections:
  1. `accountDetails`: Company metadata, sector attributes, ERP identifiers.
  2. `contacts`: Additional stakeholder channels, escalation paths.
  3. `licenseInfo`: Custom contract terms, tier codes, partner IDs.
  4. `generalNotes`: Note tagging, compliance categories.
  5. `userProfile`: Employee IDs, regional offices, certifications.
- **Supported Field Types**: Text, Number, Date, Dropdown/Select, Textarea, Boolean Switch, Email, and Phone/Tel.
- **Field Configuration Controls**: Label, placeholder, help text, required validation, dropdown option manager, reordering, and visibility toggle.
- **Live Interactive Preview**: Real-time preview verifying field behavior before deployment.

### Module 10: Dual Persistence & Offline Architecture
- **Local-First Reliability**: Instant state hydration from `localStorage` (`cs_hub_customers`, `cs_hub_users`, `cs_hub_customization`).
- **Cloud Firestore Synchronization**: Real-time snapshots and write-back to Firestore collections (`customers`, `users`, `app_config/customization`).
- **Resilient Fallback**: Automatic offline tolerance preventing application lockup if network connectivity is interrupted.

---

## 3. User Experience & Visual Design

- **Aesthetic Direction**: Utilitarian, high-clarity SaaS operations console adhering to strict anti-slop guidelines (no decorative pills, no ungrounded metrics, clean hairline dividers).
- **Typography**: Clean display pairing using `Plus Jakarta Sans` for headers and `Plus Jakarta Sans` / `Manrope` for body prose, strictly paired with tabular figures (`font-mono tabular-nums`) for data columns, click rates, and dates.
- **Color Discipline**:
  - Canvas: Pure white (`#FFFFFF`) with slate neutral borders (`border-slate-200`).
  - Dark Surfaces: Slate-900 / Slate-800 for sidebars and headers.
  - Status Semantics: Emerald for on-time/passed, Amber for due-soon/warning, Crimson for overdue/high-risk, Indigo for active tabs.
- **Spatial Hierarchy**: 260px collapsible sidebar with single-line navigation links, top bar with temporal reference controls, and a generous main workspace canvas with high-density data tables.

---

## 4. Technical Architecture & Data Strategy

### System Component & Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION CANVAS                                      │
│                                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────────────────┐  │
│  │   Sidebar Navigation  │  │  TopHeader (Reference Date · Time Travel · User Badge)  │  │
│  │  • Dashboard          │  └────────────────────────────────────────────────────────┘  │
│  │  • Customers          │  ┌────────────────────────────────────────────────────────┐  │
│  │  • Drill Calendar     │  │  Active Workspace View                                 │  │
│  │  • Debrief Reviews    │  │  [DashboardView | CustomerListView | CustomerDetail]   │  │
│  │  • Reminders Hub      │  │  [CalendarView  | AnnualReportView | ReviewsView]      │  │
│  │  • Annual Reports     │  │  [CsmManagementView | CustomizationView]               │  │
│  │  • Team Management    │  │                                                        │  │
│  │  • Customization      │  │  Dynamic Section Custom Fields:                        │  │
│  │                       │  │  • SectionCustomFields · CustomFieldsDisplay           │  │
│  └───────────────────────┘  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL STATE: CustomerContext.tsx                              │
│  • customers[]           • users[]                  • customizationSettings.fields[]   │
│  • referenceDate         • dueSoonDays              • authSession & currentUser        │
│  • RBAC permission guards: hasPermission, canUserMutateCustomer, canManageCustomization│
└────────────────────────────────────────────────────────────────────────────────────────┘
                       │                                         │
                       ▼                                         ▼
         ┌───────────────────────────┐             ┌───────────────────────────┐
         │ LocalStorage Cache Layer  │             │ Cloud Firestore Database  │
         │ • cs_hub_customers        │             │ • collection("customers") │
         │ • cs_hub_users            │             │ • collection("users")     │
         │ • cs_hub_customization    │             │ • doc("app_config/custom")│
         └───────────────────────────┘             └───────────────────────────┘
```

---

## 5. Execution & Verification Steps

1. **Verification of Schema-Driven Custom Fields**: Ensure all 5 sections (`accountDetails`, `contacts`, `licenseInfo`, `generalNotes`, and `userProfile`) correctly hydrate from `customizationSettings.fields`.
2. **Persistence Audit**: Confirm both `localStorage` and Firestore synchronization persist all modifications without state loss or form clearing.
3. **Optional In-App Matrix Drawer**: Add an accessible "Platform Audit & Capabilities" reference panel accessible from the TopHeader or Team view, allowing administrators to inspect the full list of capabilities and RBAC rules live in the UI.
4. **Build & Type Checking**: Verify application compilation via `npm run build` and `npm run lint`.
