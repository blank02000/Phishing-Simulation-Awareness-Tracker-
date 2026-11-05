import { Customer, UserAccount, CustomerStatus, DEFAULT_CSM_PERMISSIONS } from '../types';

export interface RawMasterAccount {
  name: string;
  industry: string; // "Tier 1", "Tier 2", "Tier 3", "Partner", etc.
  status: CustomerStatus;
  handledBy: string; // "Tasmiya", "Shubh", "Gokula", "Nancy", "Sonia", "Nikhil", "Nikhil & Lakshmi"
}

export const MASTER_ACCOUNTS_RAW: RawMasterAccount[] = [
  { name: 'Mahindra Finance', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Avanse Financial Services', industry: 'Tier 2', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'HDFC Bank', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Capital Bank', industry: 'Tier 3', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Axis Securities', industry: 'Tier 3', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'SBI Life', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'PI Industries', industry: 'Tier 2', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Bajaj Allianz/ Bajaj Life', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Bajaj General Insurance', industry: 'Tier 2', status: 'Active', handledBy: 'Shubh' },
  { name: 'Bandhan Life', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'IFTAS', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Trent Tata', industry: 'Tier 1', status: 'Active', handledBy: 'Gokula' },
  { name: 'Quantiphi', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Ajitkhimji group', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Godrej and Boyce', industry: 'Tier 1', status: 'Active', handledBy: 'Gokula' },
  { name: 'KRaheja', industry: 'Tier 3', status: 'Active', handledBy: 'Gokula' },
  { name: 'Groww', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Hitachi Payments', industry: 'Tier 1', status: 'Active', handledBy: 'Gokula' },
  { name: 'Hitachi CMS', industry: 'Tier 1', status: 'Active', handledBy: 'Gokula' },
  { name: 'Magma Insurance', industry: 'Tier 3', status: 'Inactive', handledBy: 'Gokula' },
  { name: 'Manappuram Finance', industry: 'Tier 3', status: 'Inactive', handledBy: 'Gokula' },
  { name: 'CDSL INndia', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Indiafirstlife', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Amararaja', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Acre India', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Naikwealth', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'PPFAS', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Rustomji', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Manappuram Home Fin', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'SBI Caps Ventures', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Mahindra & Mahindra', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'RBL Bank', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'IIFL', industry: 'Tier 1', status: 'Active', handledBy: 'Sonia' },
  { name: 'ISECPD', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'Polycab', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'BSE', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'DS Group', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Suryoday bank (in process)', industry: 'Tier 3', status: 'Active', handledBy: 'Shubh' },
  { name: 'WNS', industry: 'Tier 1', status: 'Active', handledBy: 'Nikhil' },
  { name: 'Vodafone', industry: 'Tier 1', status: 'Active', handledBy: 'Nikhil' },
  { name: 'Karnataka Bank', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'Jio Financial Services', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Ria Advisory', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Tata Technologies', industry: 'Tier 1', status: 'Active', handledBy: 'Nikhil' },
  { name: 'Virima Tech', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'FDC India', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'IBN Nafees', industry: 'Tier 3', status: 'Inactive', handledBy: 'Nancy' },
  { name: 'Bharti Axa', industry: 'Tier 3', status: 'Active', handledBy: 'Shubh' },
  { name: 'Tru Finance', industry: 'Tier 3', status: 'Active', handledBy: 'Shubh' },
  { name: 'IKS Health', industry: 'Tier 2', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'ICICI Bank', industry: 'Tier 1', status: 'Active', handledBy: 'Nikhil & Lakshmi' },
  { name: 'Asirvad Microfinance', industry: 'Tier 3', status: 'Active', handledBy: 'Shubh' },
  { name: 'HDFC LIFE', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'HDFC Sales', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'Borosil', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'AHFL', industry: 'Tier 2', status: 'Active', handledBy: 'Gokula' },
  { name: 'FirstSource', industry: 'Tier 1', status: 'Active', handledBy: 'Shubh' },
  { name: 'SBM Bank', industry: 'Tier 3', status: 'Active', handledBy: 'Sonia' },
  { name: 'Jio Black Rock Amc', industry: 'Tier 1', status: 'Active', handledBy: 'Sonia' },
  { name: 'Onward Group', industry: 'Tier 3', status: 'Active', handledBy: 'Sonia' },
  { name: 'Tata AIA', industry: 'Tier 1', status: 'Onboarding', handledBy: 'Shubh' },
  { name: 'Evoke Technologies', industry: 'Tier 3', status: 'Active', handledBy: 'Nancy' },
  { name: 'Theranym Biologics', industry: 'Tier 3', status: 'Active', handledBy: 'Sonia' },
  { name: 'Asian Paints', industry: 'Tier 1', status: 'Active', handledBy: 'Tasmiya' },
  { name: 'Pacific International Lines', industry: 'Tier 2', status: 'Active', handledBy: 'Sonia' },
  { name: 'Cybersec Knights', industry: 'Partner', status: 'Active', handledBy: 'Nikhil' },
  { name: 'Adani', industry: 'Tier 1', status: 'Active', handledBy: 'Nancy' },
];

export const ADDITIONAL_CSM_USERS: UserAccount[] = [
  {
    id: 'user-csm-nikhil',
    name: 'Nikhil Sharma',
    email: 'nikhil.sharma@progist.net',
    role: 'CSM',
    title: 'Customer Success Manager',
    avatarColor: 'bg-cyan-600',
    status: 'Active',
    permissions: DEFAULT_CSM_PERMISSIONS,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'user-csm-lakshmi',
    name: 'Lakshmi Narayan',
    email: 'lakshmi.narayan@progist.net',
    role: 'CSM',
    title: 'Customer Success Manager',
    avatarColor: 'bg-violet-600',
    status: 'Active',
    permissions: DEFAULT_CSM_PERMISSIONS,
    createdAt: '2026-01-01T08:00:00Z',
  },
];

export function mapCsmNameToUser(csmStr: string): { csmId: string; csmName: string } {
  const norm = (csmStr || '').trim().toLowerCase();
  if (norm.includes('tasmiya')) {
    return { csmId: 'user-csm-tasmiya', csmName: 'Tasmiya Zaman' };
  }
  if (norm.includes('shubh')) {
    return { csmId: 'user-admin-shubh', csmName: 'Shubh (SecOps)' };
  }
  if (norm.includes('gokula')) {
    return { csmId: 'user-csm-gokulalakshmi', csmName: 'R. Gokulalakshmi' };
  }
  if (norm.includes('nancy')) {
    return { csmId: 'user-csm-nancy', csmName: 'Nancy Rajput' };
  }
  if (norm.includes('sonia')) {
    return { csmId: 'user-csm-sonia', csmName: 'Sonia Dsouza' };
  }
  if (norm.includes('nikhil') && norm.includes('lakshmi')) {
    return { csmId: 'user-csm-nikhil', csmName: 'Nikhil & Lakshmi' };
  }
  if (norm.includes('nikhil')) {
    return { csmId: 'user-csm-nikhil', csmName: 'Nikhil Sharma' };
  }
  if (norm.includes('lakshmi')) {
    return { csmId: 'user-csm-lakshmi', csmName: 'Lakshmi Narayan' };
  }
  return { csmId: 'user-admin-shubh', csmName: 'Shubh (SecOps)' };
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates rich, complete customer records for all 67 master accounts.
 */
export function generateMasterCustomerRecords(): Customer[] {
  return MASTER_ACCOUNTS_RAW.map((raw, idx) => {
    const slug = generateSlug(raw.name);
    const id = `cust-${slug || `acc-${idx + 1}`}`;
    const { csmId, csmName } = mapCsmNameToUser(raw.handledBy);

    // Target seats & tiering based on Industry / Tier
    let targetSeats = 500;
    let productPlan = 'Corporate Cyber Suite';
    let phishingQuota = 4;
    let vishingQuota = 2;
    let smishingQuota = 4;
    let gamificationQuota = 4;

    if (raw.industry.includes('Tier 1')) {
      targetSeats = 2500;
      productPlan = 'Enterprise Cyber Suite (Tier 1)';
      phishingQuota = 6;
      vishingQuota = 4;
      smishingQuota = 6;
      gamificationQuota = 6;
    } else if (raw.industry.includes('Tier 2')) {
      targetSeats = 1000;
      productPlan = 'Professional Cyber Defense (Tier 2)';
      phishingQuota = 4;
      vishingQuota = 2;
      smishingQuota = 4;
      gamificationQuota = 4;
    } else if (raw.industry.includes('Partner')) {
      targetSeats = 750;
      productPlan = 'Channel Partner MSSP Suite';
      phishingQuota = 4;
      vishingQuota = 2;
      smishingQuota = 2;
      gamificationQuota = 4;
    } else {
      targetSeats = 350;
      productPlan = 'Standard Cyber Security (Tier 3)';
      phishingQuota = 4;
      vishingQuota = 1;
      smishingQuota = 2;
      gamificationQuota = 2;
    }

    const licenseKey = `LIC-2026-${slug.toUpperCase().slice(0, 8)}-${1000 + idx}`;

    const customer: Customer = {
      id,
      companyName: raw.name,
      customerContact: `SecOps Lead (${raw.name})`,
      contactEmail: `security@${slug.slice(0, 15)}.com`,
      contactPhone: `+91 22 ${2000 + idx} ${1000 + idx}`,
      cisoName: `CISO Office`,
      cisoEmail: `ciso@${slug.slice(0, 15)}.com`,
      accountOwner: 'Vinisha Mendonca',
      csmId,
      csmName,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: raw.status,
      industry: raw.industry || 'Tier 2',
      notes: `Contracted Account: Managed by ${csmName}. Category classification: ${raw.industry}. Status: ${raw.status}. Security simulations and deliverables scheduled across 2026 fiscal year.`,
      overallNotesCreatedAt: '2026-01-01T08:00:00.000Z',
      overallNotesUpdatedAt: '2026-01-01T08:00:00.000Z',
      overallNotesUpdatedBy: csmName,
      generalNotes: [
        {
          id: `gnote-${id}-1`,
          content: `Account onboarded and assigned to ${csmName}. Contract tier: ${raw.industry}. Initial review meeting scheduled for Q1.`,
          category: 'Handover',
          createdAt: '2026-01-10T10:00:00.000Z',
          createdBy: csmName,
        },
      ],
      products: {
        prophish: true,
        proLms: true,
        proPatrol: raw.industry.includes('Tier 1'),
      },
      licenseDetails: {
        productPlan,
        productSubscription: `Annual ${raw.industry}`,
        adminUsersCount: raw.industry.includes('Tier 1') ? 8 : 4,
        managedDrillFrequency: 'Quarterly',
        targetEmployeesCount: targetSeats,
        companySector: raw.industry,
        country: 'India',
        activationStatus: raw.status,
      },
      licenses: [
        {
          id: `lic-${id}-2026`,
          licenseKey,
          name: `${raw.name} Master Agreement 2026`,
          planTier: productPlan,
          targetSeats,
          issueDate: '2026-01-01',
          expiryDate: '2026-12-31',
          status: raw.status === 'Inactive' ? 'Expired' : 'Active',
          fileName: `${slug}_license_2026.xlsx`,
          fileSize: 32000,
          fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploadedAt: '2026-01-02T09:00:00.000Z',
          uploadedBy: csmName,
          notes: `Official active agreement for ${raw.name}. Quota: ${phishingQuota} Phishing, ${vishingQuota} Vishing, ${smishingQuota} Smishing, ${gamificationQuota} Gamification modules.`,
          isAutoGenerated: false,
          phishingQuota,
          vishingQuota,
          smishingQuota,
          gamificationQuota,
          plannedDeliverables: [
            {
              id: `req-${id}-infographic-2026`,
              customerId: id,
              customerName: raw.name,
              licenseId: `lic-${id}-2026`,
              licenseKey,
              category: 'Infographics',
              title: `${raw.name} Quarterly Threat Intelligence Infographic`,
              frequency: 'Quarterly',
              targetQuantityPerPeriod: 1,
              startDate: '2026-01-01',
              endDate: '2026-12-31',
              csmId,
              csmName,
              status: 'Active',
              year: 2026,
              notes: 'Quarterly compliance threat cheat sheet',
              createdAt: '2026-01-02T09:00:00.000Z',
            },
            {
              id: `req-${id}-scorm-2026`,
              customerId: id,
              customerName: raw.name,
              licenseId: `lic-${id}-2026`,
              licenseKey,
              category: 'SCORM content',
              title: `${raw.name} Security Awareness E-Learning SCORM Package`,
              frequency: 'Quarterly',
              targetQuantityPerPeriod: 1,
              startDate: '2026-01-01',
              endDate: '2026-12-31',
              csmId,
              csmName,
              status: 'Active',
              year: 2026,
              notes: 'Quarterly SCORM module upload to client corporate LMS',
              createdAt: '2026-01-02T09:00:00.000Z',
            },
          ],
        },
      ],
      annualPlans: {
        2026: {
          year: 2026,
          annualRequirement: phishingQuota,
          startDate: '2026-01-01',
          intervalMonths: 3,
          defaultDrillType: 'Phishing Email Simulation',
          drills: [
            {
              id: `drill-${id}-2026-1`,
              drillNumber: 1,
              title: `Q1 Spear Phishing Simulation - Drill #1`,
              drillType: 'Phishing Email Simulation',
              campaignName: 'IT Password Reset & M365 Auth Lure',
              plannedDate: '2026-02-15',
              actualCompletionDate: '2026-02-28',
              status: 'Completed',
              overallResult: 'Passed',
              participantsCount: targetSeats,
              clickRate: 8,
              submissionRate: 3,
              reportingRate: 61,
              summary: 'Q1 drill completed successfully with 61% prompt reporting rate.',
              reviewMeeting: {
                required: true,
                date: '2026-03-05',
                status: 'Completed',
                participants: `${csmName}, CISO Team`,
                momStatus: 'Approved by Client',
                momDecisions: 'Approved continuing Q2 smishing module to executive mobile users.',
              },
            },
            {
              id: `drill-${id}-2026-2`,
              drillNumber: 2,
              title: `Q2 Credential Harvesting & Vishing Drill #2`,
              drillType: 'Credential Harvesting',
              campaignName: 'Urgent Wire Transfer & Vendor Invoice Verification',
              plannedDate: '2026-05-18',
              status: 'Upcoming',
              participantsCount: targetSeats,
            },
            {
              id: `drill-${id}-2026-3`,
              drillNumber: 3,
              title: `Q3 Smishing & Mobile Threat Simulation - Drill #3`,
              drillType: 'Smishing (SMS)',
              campaignName: 'Mobile SSO Token Expiry SMS Alert',
              plannedDate: '2026-08-20',
              status: 'Upcoming',
              participantsCount: Math.round(targetSeats * 0.5),
            },
            {
              id: `drill-${id}-2026-4`,
              drillNumber: 4,
              title: `Q4 Ransomware Awareness & Incident Tabletop - Drill #4`,
              drillType: 'Ransomware Awareness',
              campaignName: 'Year-End Executive Audit & Cloud Storage Alert',
              plannedDate: '2026-11-12',
              status: 'Upcoming',
              participantsCount: targetSeats,
            },
          ],
          deliverables: [
            {
              id: `deliv-${id}-1`,
              title: 'Q1 Cybersecurity Foundation Infographic',
              type: 'Infographics',
              frequency: 'quarterly',
              plannedDate: '2026-02-10',
              actualCompletionDate: '2026-02-10',
              status: 'Completed',
              targetAudience: 'All Employees',
              completionRate: 100,
            },
            {
              id: `deliv-${id}-2`,
              title: 'Q2 PhishHunter Cyber Escape Room',
              type: 'Games',
              frequency: 'quarterly',
              plannedDate: '2026-05-20',
              status: 'Upcoming',
              targetAudience: 'All Employees',
            },
          ],
        },
      },
      currentYear: 2026,
      createdAt: '2026-01-01T08:00:00.000Z',
      updatedAt: '2026-01-01T08:00:00.000Z',
    };

    return customer;
  });
}
