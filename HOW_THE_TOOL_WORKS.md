# CyberDrill — How the Tool Works
### Comprehensive Architecture, Operating Manual, and Technical Blueprint

---

## 1. Executive Summary & Core Mission

**CyberDrill** (Progist CyberDrill Platform) is an enterprise-grade cybersecurity operations and compliance management application. It is purpose-built for **Customer Success Managers (CSMs)**, **Security Operations (SecOps) teams**, and **Enterprise Cybersecurity Leadership (CISOs)**.

The primary mission of the platform is to eliminate spreadsheet chaos, prevent missed simulation deadlines, enforce multi-vector security drill cadences (Email Phishing, Voice Vishing, SMS Smishing), manage formal **Scope Reviews** and **Minutes of Meeting (MoM)**, track contracted deliverables and gamification modules, and provide verifiable proof of annual compliance for regulatory audits (ISO 27001, SOC 2, NIST, PCI-DSS).

---

## 2. High-Level System Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                   |
|   React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Canvas-Confetti   |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                           APPLICATION STATE & LOGIC                               |
|  • CustomerContext (Global State & Mutators)                                      |
|  • drillCalculator.ts (Compliance Math, SLA & Reminder State Machines)             |
|  • excelLicenseHelper.ts (SheetJS Multi-Sheet Excel Parser & Generator)           |
|  • reportExporter.ts (jsPDF & jsPDF-AutoTable Vector PDF Report Generator)        |
|  • emailService.ts (Simulated SLA Notification Dispatcher)                        |
+-----------------------------------------------------------------------------------+
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
+-----------------------------------------+ +---------------------------------------+
|           PERSISTENCE LAYER             | |        SIMULATION CLOCK ENGINE        |
|  • Google Cloud Firestore               | |  • Dynamic referenceDate Picker       |
|    (ai-studio-phishingsimulati-...)     | |  • dueSoonDays Window Configurator    |
|  • LocalStorage Cache Fallback          | |  • Deterministic SLA Time-Travel      |
|  • Seed Data Resilient Bootstrap        | +---------------------------------------+
+-----------------------------------------+
```

### Technology Highlights
- **React 19 & TypeScript**: Strict type safety across all drill states, license sheets, customer records, and RBAC matrices.
- **Tailwind CSS**: Modern, ultra-clean responsive interface with zero external UI bloat.
- **SheetJS (`xlsx`)**: Browser-native Excel parsing and generation for client licenses (`.xlsx`, `.xls`, `.csv`).
- **jsPDF & jsPDF-AutoTable**: Client-side vector rendering of multi-page Executive Reports, Theme Snapshots, and Audit Packs.
- **Dual Persistence**: Automatic sync with Google Cloud Firestore when configured, with seamless offline local storage fallback.
- **Simulation Time-Travel Engine**: Interactive `referenceDate` selector allowing CSMs and auditors to travel to any date (past, present, or future) to inspect SLA triggers, upcoming windows, and historical compliance.

---

## 3. Core Entities & Data Model

The platform operates on a structured, relational-like data hierarchy:

### 3.1 Customer (`Customer`)
The central entity representing an enrolled enterprise organization.
- **Identity**: `id`, `companyName`, `customerContact`, `contactEmail`, `contactPhone`, `industry`, `status` (`Active`, `Onboarding`, `At Risk`, `Paused`, `Inactive`).
- **CISO & Governance**: `cisoName`, `cisoEmail`, `cisoPhone`.
- **Account Ownership & Assignment**: `accountOwner`, `csmId` (CSM assigned to this book of business), `csmName`.
- **Contract & Products**: `startDate`, `endDate`, `products` (`prophish`, `proLms`, `proPatrol`).
- **Licenses**: Array of `CustomerLicenseFile` with parsed Excel data, seat counts, and vector quotas.
- **Annual Plans**: Dictionary of `AnnualPlan` objects keyed by year (e.g. `2026`).
- **Notes Hub**: Structured 3-tier hierarchy:
  1. *Overall Key Account Notes*
  2. *General Categorized Notes* (Client Call, Escalation, Meeting, Renewal, Compliance)
  3. *Drill-wise Debrief Notes*
- **Gamification Deliverables**: Array of `GamificationGameDeliverable` objects.
- **Dynamic Custom Fields**: Extensible attributes defined via the Customization Studio.

### 3.2 Annual Plan (`AnnualPlan`)
Represents a customer's contracted simulation year (e.g. Calendar Year 2026).
- `year`: Target compliance year (e.g., 2026).
- `annualRequirement`: Total mandatory simulations contracted for the year (e.g., 4 quarterly drills).
- `intervalMonths`: Cadence spacing (3 for Quarterly, 1 for Monthly, 6 for Semi-Annual).
- `drills`: Ordered array of `DrillRecord` items.
- `deliverables`: Array of `LmsDeliverable` items (training modules, policy releases).

### 3.3 Drill Record (`DrillRecord`)
Represents an individual security simulation event.
- **Metadata**: `id`, `drillNumber` (1, 2, 3...), `title`, `campaignName`.
- **Simulation Vector (`drillType`)**:
  - `Phishing Email Simulation`
  - `Spear Phishing / Executive`
  - `Vishing (Voice Phishing)` *(Telephone social engineering)*
  - `Smishing (SMS)` *(Text message phishing)*
  - `Credential Harvesting`
  - `Ransomware Awareness`
  - `USB Drop / Physical`
  - `Social Engineering Call`
  - `Custom Drill`
- **Schedule**: `plannedDate` (YYYY-MM-DD), `actualCompletionDate`, `drillPeriodLabel` (e.g., "July – September 2026"), `drillPeriodStart`, `drillPeriodEnd`, `quarter` (Q1..Q4).
- **Execution Status (`DrillStatus`)**: `Upcoming`, `Due Soon`, `Completed`, `Completed Late`, `Overdue`, `Not Completed`, `Cancelled`.
- **Campaign Metrics**: `participantsCount`, `clickRate` (%), `submissionRate` (%), `reportingRate` (%), `overallResult` (`Passed`, `Needs Improvement`, `High Risk`, `Pending Review`).
- **Insights & Deliverables**: `summary`, `keyFindings`, `recommendations`, `notes`, `attachments`.
- **Linked Review Meeting**: An embedded `ReviewMeeting` object.

### 3.4 Review Meeting & Scope Review (`ReviewMeeting`)
Manages formal customer meetings associated with drills or governance milestones:
- **Meeting Type**: `Scope Review`, `Drill Debrief`, `Executive Review`, `Quarterly Sync`.
- **Schedule & Attendees**: `date`, `participants`, `status` (`Not Scheduled`, `Scheduled`, `Completed`, `Cancelled`).
- **Formal Scope Review Details (`ReviewMeetingScopeDetails`)**:
  - `domainsInScope`: Authorized target email domains.
  - `whitelistingConfirmed`: Verification that mail security filters will not drop simulation payloads.
  - `targetCount`: Total in-scope employees / seats.
  - `excludedGroups`: Departments or VIPs excluded from the drill.
  - `phoneSmsCoverage`: Target telephone numbers or ranges for Vishing/Smishing.
  - `approvedByCiso`: Formal CISO authorization toggle.
- **Minutes of Meeting (MoM)**:
  - `momTitle`, `momStatus` (`Draft`, `Finalized`, `Approved by Client`).
  - `momDecisions`: Key executive decisions reached during the session.
  - `momNotes`: Detailed chronological notes.
  - `momActionItems`: Structured register of tasks (`ReviewMeetingActionItem`), each with `task`, `owner`, `dueDate`, and `status`.

### 3.5 License File & Excel Entitlements (`CustomerLicenseFile`)
Stores license parameters and parsed spreadsheet models:
- `licenseKey`, `name`, `planTier`, `targetSeats`, `issueDate`, `expiryDate`, `status`.
- `phishingQuota`, `vishingQuota`, `smishingQuota`, `gamificationQuota`.
- `excelData`: Parsed multi-sheet structure (`ParsedLicenseExcelData`) containing:
  - Sheet 1: **License Summary** (Customer details, contract tier, dates)
  - Sheet 2: **Entitlements Quota** (Seats, Phishing, Vishing, Smishing quotas)
  - Sheet 3: **Gamification Modules** (Contracted security games)
  - Sheet 4: **Scope & Telephony Targets** (Authorized domains, SMS prefixes)

### 3.6 TaskFlow Items (`TaskItem`)
Operational tasks displayed on the Kanban board:
- `id`, `title`, `description`, `column` (`todo`, `in_progress`, `done`).
- `priority`: `urgent`, `high`, `medium`, `low`.
- `type`: `drill`, `deliverable`, `review`, `scope_review`, `custom`.
- `customerId`, `customerName`, `csmId`, `csmName`, `dueDate`, `year`.
- Deep links to drills (`drillId`, `drillNumber`) and deliverables (`deliverableId`).

### 3.7 User Accounts & RBAC (`UserAccount`)
Enforces identity and operational boundaries:
- `Admin`: Global visibility across all accounts, ability to create/edit/delete customers, assign CSMs, customize fields, and configure SLAs.
- `CSM`: Focused portfolio view displaying only assigned accounts, with full drill execution, meeting logging, and reporting capabilities.

---

## 4. End-to-End Operational Lifecycle & Workflows

### Workflow 1: Customer Onboarding & License Activation
1. Navigate to **Customers** tab.
2. Click **Add Customer** or **Bulk Upload**.
3. Choose one of two license methods:
   - **Auto-Generate Default License**: Automatically generates an enterprise license key with configurable seat allowances.
   - **Upload Excel License (`.xlsx`, `.xls`, `.csv`)**: SheetJS parses the file in memory, automatically detects sheets, and sets phishing, vishing, smishing, and gamification quotas.
4. Set Customer Details: Company Name, Industry, CISO credentials, assigned CSM, and subscribed products (`ProPhish`, `ProLMS`, `ProPatrol`).
5. Set Annual Plan parameters: Requirement (e.g. 4 drills), Cadence (Quarterly), and Default Drill Type.

### Workflow 2: Interactive License Inspection & Excel Preview
1. On the Customer Details page or License Expiry Tracker, click **Preview License (.xlsx)**.
2. The modal loads an interactive multi-sheet workbook viewer:
   - Switch between sheets (*License Summary*, *Entitlements Quota*, *Gamification Modules*, *Scope & Telephony Targets*).
   - Use the instant search bar to find employee departments, domains, or quota lines.
   - Inspect entitlement chips (Total Seats, Phishing, Vishing, Smishing, Games).
   - Export or download the active `.xlsx` workbook anytime.

### Workflow 3: Multi-Vector Annual Simulation Scheduling
1. Inside the Customer Account, observe the **Annual Plan Drills** section.
2. Use the **Category Switcher** to filter simulations by vector:
   - `All` — Unified timeline of all planned drills.
   - `🎣 Phishing` — Standard email phishing campaigns.
   - `📞 Vishing` — Voice phishing & social engineering calls.
   - `💬 Smishing` — SMS text message phishing.
3. Click **+ Vishing** or **+ Smishing** to schedule a new vector directly from contracted license entitlements.
4. Set planned execution date, quarter, campaign theme, and target employee groups.

### Workflow 4: Formal Scope Review & CISO Sign-Off
Before initiating any simulation:
1. Open the drill card and click **Schedule Scope Review / Debrief** (or navigate to the **Reviews** tab).
2. Select **Meeting Type** = `Scope Review`.
3. In the **Scope Review & Targets** tab:
   - Enter authorized email domains (e.g. `@apexglobal.com`).
   - Check **Whitelisting Confirmed** (validates IT/SecOps whitelisting).
   - Verify target seat count and exclude exempt groups (e.g. Helpdesk, Executive Board).
   - For Vishing/Smishing, confirm telephony number ranges.
   - Toggle **CISO / Client Lead Sign-off Approved**.
4. In the **Minutes of Meeting (MoM)** tab:
   - Document key decisions and scope approvals.
   - Create trackable action items with owners and due dates.
   - Click **Copy MoM Summary** to paste formatted meeting minutes directly into executive emails.

### Workflow 5: Drill Execution & Metric Logging
1. When a campaign concludes, click **Execute / Complete Drill** on the drill card.
2. Enter the execution data:
   - **Actual Completion Date** (defaults to planned or simulation reference date).
   - **Participants Count** (e.g. 5,000 employees).
   - **Click Rate %** (percentage of users who clicked the simulated link).
   - **Submission Rate %** (percentage who entered credentials on the mock landing page).
   - **Reporting Rate %** (percentage who reported the email using the ProPatrol button).
3. The system automatically computes the **Overall Result**:
   - `Passed`: Click rate low, reporting rate high.
   - `Needs Improvement`: Moderate engagement requiring targeted training.
   - `High Risk`: Critical compromise rate requiring immediate refresher courses.
4. Document **Executive Summary**, **Key Findings**, and **Recommendations**.
5. Save the drill. The system transitions the status to `Completed` (or `Completed Late` if executed past the planned SLA).

### Workflow 6: Gamification Security Training
1. In the **Gamification Deliverables** tab, view contracted modules (e.g. *Security Awareness Escape Room*, *Voice & Smishing Defense Arena*, *Ransomware Crisis Commander*).
2. Click **Launch Simulation** to preview the interactive game player.
3. Users and trainees can play through scenarios, make threat-response choices, and earn XP and badges.
4. Track completion rates and issue completion certificates.

### Workflow 7: TaskFlow Kanban Execution
1. Navigate to the **TaskFlow** tab.
2. The board organizes operations across three columns: **To Do**, **In Progress**, and **Done**.
3. Auto-generated tasks sync with scheduled drills, upcoming deliverables, and MoM action items.
4. Filter tasks by CSM, Priority (`urgent`, `high`, `medium`, `low`), or Type.
5. Drag and drop tasks between columns. Click any drill-linked task to jump straight to drill execution.

### Workflow 8: SLA Alerts & Time-Travel Simulation
1. Navigate to the **Alerts** tab (or check the red/amber badge in the sidebar).
2. The engine groups alerts into:
   - **Overdue Drills** (High Severity): Drill planned date is in the past and status is not Completed.
   - **Due Soon Drills** (Medium Severity): Drill planned date falls within the configured `dueSoonDays` window.
   - **Active Cadence Period Alerts**: Highlights drills whose sanctioned quarter/period is currently open.
   - **At Risk Accounts**: Accounts with multiple overdue items threatening annual compliance.
3. Test time-sensitive behavior:
   - Click the **Ref: [Date]** picker in the top header.
   - Shift the date forward (e.g., jump 60 days into the future).
   - Observe how drill statuses instantly transition from `Upcoming` to `Due Soon` to `Overdue`, proving the SLA alert system works deterministically.

### Workflow 9: Executive Reports & PDF Generation
1. In Customer Details or the **Reports** tab, click **Full Printable Report** or **Quarterly Breakdown**.
2. View annual KPI dashboards: Total Drills, Completed vs Required, Average Click Rate, Average Reporting Rate, and Cadence Trends.
3. Click **Export PDF Report**: The jsPDF engine compiles a clean, multi-page document featuring executive KPI cards, drill histories, and signature blocks ready for C-suite presentation.

---

## 5. Mathematical Models & Status Decision Logic

### 5.1 Drill Status Decision Tree
For any given drill $D$, with planned date $P$, completion date $C$, and system reference date $R$:

```
IF D is marked 'Cancelled' -> Status = 'Cancelled'
ELSE IF D is marked 'Completed':
    IF C <= P (or within sanctioned period) -> Status = 'Completed'
    ELSE -> Status = 'Completed Late'
ELSE (D is not yet completed):
    IF R > P -> Status = 'Overdue'
    ELSE IF R >= (P - dueSoonDays) -> Status = 'Due Soon'
    ELSE -> Status = 'Upcoming'
```

### 5.2 Overall Customer Annual Compliance Status
Evaluated across all required drills in the active annual plan:

- **`Completed`**: Total Completed Drills $\ge$ Annual Requirement.
- **`Overdue`**: Any active drill has `Overdue` status.
- **`At Risk`**: More than 1 drill is overdue, or remaining time in the year is mathematically insufficient to complete remaining drills given the `intervalMonths` cadence.
- **`Due Soon`**: Any active drill has `Due Soon` status and no drills are `Overdue`.
- **`On Track`**: All scheduled drills are in `Upcoming` status and the customer is on schedule.

### 5.3 Drill Risk Assessment Formula
When completing a drill, the default risk rating evaluates:
- $\text{Click Rate} \le 5\%$ AND $\text{Reporting Rate} \ge 60\% \implies \mathbf{Passed}$
- $\text{Click Rate} \le 15\%$ AND $\text{Reporting Rate} \ge 35\% \implies \mathbf{Needs\ Improvement}$
- $\text{Click Rate} > 15\%$ OR $\text{Submission Rate} > 10\% \implies \mathbf{High\ Risk}$

---

## 6. Role-Based Access Control (RBAC) Matrix

| Platform Capability | Admin | Customer Success Manager (CSM) | Auditor / Viewer |
| :--- | :---: | :---: | :---: |
| View Global Dashboard (All Accounts) |  Yes |  No (Assigned Portfolio Only) |  Yes (Read-Only) |
| Create Customer Account |  Yes |  Yes |  No |
| Edit Assigned Customer Details |  Yes |  Yes |  No |
| Edit Unassigned Customer Details |  Yes |  No |  No |
| Delete Customer Account |  Yes |  No |  No |
| Assign / Reassign CSM to Account |  Yes |  No |  No |
| Schedule & Complete Drills |  Yes |  Yes (Assigned Accounts) |  No |
| Schedule Vishing & Smishing Drills |  Yes |  Yes (Assigned Accounts) |  No |
| Upload & Preview Excel Licenses |  Yes |  Yes |  View Only |
| Conduct Scope Review & Edit MoM |  Yes |  Yes |  View Only |
| Manage TaskFlow Items |  Yes |  Yes |  View Only |
| Access Customization Studio |  Yes |  No |  No |
| Provision User Accounts & Reset Passwords |  Yes |  No |  No |
| Export Executive Audit Reports (PDF/CSV) |  Yes |  Yes |  Yes |

---

## 7. Dynamic Customization Studio

Administrators can customize the platform to fit unique enterprise workflows without touching source code:
1. **Dynamic Custom Form Fields**:
   - Add custom fields to 5 key sections: `Account Details`, `Contacts`, `License Info`, `General Notes`, and `User Profile`.
   - Field types supported: `Text`, `Number`, `Date`, `Select (Dropdown)`, `Boolean (Toggle)`, `Textarea`, `Email`, `Phone`.
   - Mark fields as required, set display order, and configure helper text.
2. **Notes Customization**:
   - Define custom note categories (e.g. `Client Call`, `Escalation`, `Quarterly Review`, `SOC 2 Compliance`).
   - Configure default note templates and mandate author attribution.
3. **License Thresholds & SLAs**:
   - Set Warning Threshold Days (default: 60 days before expiration).
   - Set Critical Threshold Days (default: 30 days before expiration).
   - Configure allowed upload formats and default contract tiers.

---

## 8. Persistence & Data Integrity Architecture

- **Primary Cloud Store**: Google Cloud Firestore (`ai-studio-phishingsimulati-...`). Every mutation (customer creation, drill update, MoM edit, task movement) automatically synchronizes with Firestore.
- **Resilient Fallback**: If network connectivity is lost, the application seamlessly buffers state inside browser `localStorage`.
- **Initial Bootstrapping**: On the very first run or after clearing cache, `seedData.ts` populates the platform with realistic enterprise sample data (including Apex Global Technologies with full Vishing, Smishing, Scope Review, and MoM records).

---

## 9. Frequently Asked Questions & Operational Tips

#### Q: How do I test what happens when a drill becomes overdue?
> Open the **Ref: [Date]** picker in the top navigation bar. Select a date 30 days after the planned drill date. The drill will immediately display the red **Overdue** badge, and the Alerts hub will raise a High-severity reminder.

#### Q: Can I conduct Voice Phishing (Vishing) and SMS Phishing (Smishing) simulations?
> Yes. When creating a drill or clicking **+ Vishing** / **+ Smishing** in the Customer Details view, select the corresponding drill type. The system tracks telephony numbers, speech scenarios, and SMS metrics.

#### Q: Where are the Minutes of Meeting (MoM) stored?
> MoMs are linked directly to each drill's Review Meeting. Open any completed or scheduled drill, click **Schedule Scope Review / Debrief**, and open the **Minutes of Meeting (MoM)** tab to review decisions, notes, and trackable action items.

#### Q: How do I switch roles to test Admin vs CSM behavior?
> Click the user badge in the top right header (e.g., "Sarah Jenkins" or "Marcus Vance"). The dropdown allows instant switching between users and roles to verify RBAC access restrictions without logging out.

---
*CyberDrill Operations Manual — Version 2.6 Enterprise Edition*
