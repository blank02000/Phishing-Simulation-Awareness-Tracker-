import * as XLSX from 'xlsx';
import { ExcelSheetData, ParsedLicenseExcelData, LicenseEntitlementsBreakdown, GamificationGameDeliverable } from '../types';

/**
 * Standard pre-configured Gamification deliverable games catalog
 */
export const DEFAULT_GAMIFICATION_GAMES: GamificationGameDeliverable[] = [
  {
    id: 'game-escape-room',
    title: 'PhishHunter: The Cyber Escape Room',
    slug: 'phishhunter-escape-room',
    category: 'Escape Room',
    description: 'Immersive narrative challenge where employees navigate a virtual executive suite, uncover hidden malicious QR codes, identify spoofed vendor invoices, and defuse a credential phishing attack before the 10-minute timer runs out.',
    durationMinutes: 10,
    difficulty: 'Intermediate',
    targetAudience: 'All Employees & New Hires',
    status: 'Ready' as any,
    badgeAwarded: 'PhishHunter Master Badge',
    completionRate: 88.5,
    participantsCount: 420,
  },
  {
    id: 'game-voice-sms-arena',
    title: 'Voice & SMS Defense Arena (Vishing/Smishing Trainer)',
    slug: 'voice-sms-defense-arena',
    category: 'Voice/SMS Trainer',
    description: 'Interactive audio simulator putting employees in realistic phone calls and urgent SMS scenarios (fake banking fraud alerts, CEO emergency wire requests, spoofed IT helpdesk OTP requests). Players must analyze red flags and choose defensive actions in real time.',
    durationMinutes: 8,
    difficulty: 'Intermediate',
    targetAudience: 'Finance, AP, HR & Executive Assistants',
    status: 'Ready' as any,
    badgeAwarded: 'Social Engineering Sentinel',
    completionRate: 91.0,
    participantsCount: 185,
  },
  {
    id: 'game-ransomware-commander',
    title: 'Ransomware Crisis Commander',
    slug: 'ransomware-crisis-commander',
    category: 'Crisis Simulator',
    description: 'High-stakes tabletop simulation game. Players make branching strategic decisions under time pressure: network isolation, backup restoration, ransom negotiation policy, regulator breach disclosures, and public relations statements.',
    durationMinutes: 15,
    difficulty: 'Advanced',
    targetAudience: 'IT SecOps, Legal & Department Heads',
    status: 'Ready' as any,
    badgeAwarded: 'Crisis Incident Commander',
    completionRate: 76.4,
    participantsCount: 64,
  },
  {
    id: 'game-executive-trivia-quest',
    title: 'Executive Spear-Phishing Trivia Quest',
    slug: 'executive-trivia-quest',
    category: 'Executive Trivia',
    description: 'Gamified competitive quiz tournament designed for C-level and senior management. Tests awareness on deepfake voice impersonation, business email compromise (BEC), whaling, and supply-chain risk with live leaderboard rankings.',
    durationMinutes: 6,
    difficulty: 'Intermediate',
    targetAudience: 'C-Suite, Board & Senior Leadership',
    status: 'Ready' as any,
    badgeAwarded: 'Executive Cyber Shield',
    completionRate: 95.0,
    participantsCount: 32,
  },
];

/**
 * Parses an uploaded Excel or CSV file in the browser using SheetJS
 */
export async function parseUploadedExcelLicense(file: File): Promise<ParsedLicenseExcelData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheets: ExcelSheetData[] = [];
  const entitlements: LicenseEntitlementsBreakdown = {};

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to array of rows
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    if (rawRows.length === 0) return;

    // First non-empty row as header
    let headerIndex = 0;
    while (headerIndex < rawRows.length && (!rawRows[headerIndex] || rawRows[headerIndex].length === 0)) {
      headerIndex++;
    }

    const rawHeaders = (rawRows[headerIndex] || []).map((h, i) =>
      h !== undefined && h !== null && String(h).trim() ? String(h).trim() : `Column ${i + 1}`
    );

    const dataRows = rawRows.slice(headerIndex + 1).filter((row) =>
      row && row.some((val) => val !== '' && val !== null && val !== undefined)
    );

    sheets.push({
      sheetName,
      headers: rawHeaders,
      rows: dataRows,
      rowCount: dataRows.length,
    });

    // Inspect content for automatic entitlement discovery
    dataRows.forEach((row) => {
      const rowText = row.map((c) => String(c).toLowerCase()).join(' ');
      
      // Target Seats detection
      if (rowText.includes('seat') || rowText.includes('mailbox') || rowText.includes('user capacity')) {
        const numbers = row.filter((c) => typeof c === 'number' || (!isNaN(Number(c)) && Number(c) > 0));
        if (numbers.length > 0 && !entitlements.licensedSeats) {
          entitlements.licensedSeats = Number(numbers[0]);
        }
      }

      // Phishing Quota
      if (rowText.includes('phish') && (rowText.includes('quota') || rowText.includes('drill') || rowText.includes('sim'))) {
        const numbers = row.filter((c) => typeof c === 'number' || (!isNaN(Number(c)) && Number(c) > 0));
        if (numbers.length > 0 && !entitlements.phishingDrillsQuota) {
          entitlements.phishingDrillsQuota = Number(numbers[0]);
        }
      }

      // Vishing Quota
      if (rowText.includes('vishing') || rowText.includes('voice phishing') || rowText.includes('phone simulation')) {
        const numbers = row.filter((c) => typeof c === 'number' || (!isNaN(Number(c)) && Number(c) > 0));
        if (numbers.length > 0 && !entitlements.vishingDrillsQuota) {
          entitlements.vishingDrillsQuota = Number(numbers[0]);
        }
      }

      // Smishing Quota
      if (rowText.includes('smishing') || rowText.includes('sms phishing')) {
        const numbers = row.filter((c) => typeof c === 'number' || (!isNaN(Number(c)) && Number(c) > 0));
        if (numbers.length > 0 && !entitlements.smishingDrillsQuota) {
          entitlements.smishingDrillsQuota = Number(numbers[0]);
        }
      }

      // Gamification Quota
      if (rowText.includes('gamif') || rowText.includes('game') || rowText.includes('escape room')) {
        const numbers = row.filter((c) => typeof c === 'number' || (!isNaN(Number(c)) && Number(c) > 0));
        if (numbers.length > 0 && !entitlements.gamificationGamesQuota) {
          entitlements.gamificationGamesQuota = Number(numbers[0]);
        }
      }
    });
  });

  return {
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    sheets,
    totalSheets: sheets.length,
    entitlements: {
      licensedSeats: entitlements.licensedSeats || 500,
      phishingDrillsQuota: entitlements.phishingDrillsQuota || 4,
      vishingDrillsQuota: entitlements.vishingDrillsQuota || 2,
      smishingDrillsQuota: entitlements.smishingDrillsQuota || 4,
      gamificationGamesQuota: entitlements.gamificationGamesQuota || 6,
      contractTier: 'Enterprise Cyber Suite',
      slaSupportHours: '24/7 Premium SOC',
      lookAlikeDomains: 3,
      customScenariosAllowed: true,
    },
    summaryText: `Successfully parsed ${sheets.length} worksheet(s) from "${file.name}".`,
  };
}

/**
 * Creates a structured multi-sheet Excel license workbook for a customer
 * and returns both the parsed structure and the downloadable Base64 Data URL.
 */
export function createDefaultCustomerLicenseExcel(
  companyName: string,
  licenseKey: string,
  targetSeats = 1250,
  expiryDate = '2026-12-31'
): { parsedData: ParsedLicenseExcelData; fileDataUrl: string; fileName: string; fileSize: number } {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Entitlements & Drills Scope
  const entitlementsHeaders = [
    'Entitlement / Simulation Type',
    'Category',
    'Contracted Annual Quota',
    'Conducted / Used',
    'Remaining Balance',
    'Delivery Cadence',
    'SLA & Pretext Scope',
    'Status',
  ];
  const entitlementsRows = [
    [
      'Prophish Email Simulation',
      'Phishing Simulation Drills',
      4,
      1,
      3,
      'Quarterly',
      'High-urgency M365, Wire Fraud, Vendor Invoicing',
      'Active & On Track',
    ],
    [
      'Vishing (Voice Phishing Drills)',
      'Voice Call Drills',
      2,
      0,
      2,
      'Bi-Annual / On-Demand',
      'Deepfake Voice & Spoofed Banking Verification Pretext (500 Targets)',
      'Available to Conduct',
    ],
    [
      'Smishing (SMS Phishing Drills)',
      'SMS Text Message Drills',
      4,
      1,
      3,
      'Quarterly',
      'MFA Token Reset, Courier Delivery Tracking, Urgent HR Alerts',
      'Active & On Track',
    ],
    [
      'Interactive Gamification Deliverables',
      'Cyber Awareness Games',
      6,
      2,
      4,
      'Quarterly / Milestone',
      'Escape Rooms, Voice/SMS Arena, Ransomware Simulator, Leaderboards',
      'Ready to Launch',
    ],
    [
      'Pro Patrol Reporting Plugin',
      'Mailbox Defense Integration',
      targetSeats,
      targetSeats,
      0,
      'Continuous 24/7',
      '1-Click Microsoft Outlook & Google Workspace Integration',
      'Deployed & Active',
    ],
    [
      'Pro LMS Security Modules',
      'Interactive LMS Curriculum',
      12,
      3,
      9,
      'Monthly',
      'Bite-sized Micro Modules (2-5 mins) with Automated Quizzes',
      'Active',
    ],
  ];

  const wsEntitlements = XLSX.utils.aoa_to_sheet([entitlementsHeaders, ...entitlementsRows]);
  XLSX.utils.book_append_sheet(wb, wsEntitlements, 'Entitlements & Quotas');

  // Sheet 2: Department Seat Allocation
  const seatHeaders = [
    'Business Unit / Department',
    'Total Mailbox Seats',
    'Vishing Voice Target Quota',
    'Smishing Mobile Quota',
    'Risk Profile Tier',
    'Assigned Security Lead',
  ];
  const seatRows = [
    ['Executive Committee & Board', Math.round(targetSeats * 0.03), 25, 25, 'Tier 1 - High Risk (VIP Whaling)', 'Marcus Thorne (CISO)'],
    ['Finance, Treasury & Accounts', Math.round(targetSeats * 0.08), 65, 80, 'Tier 1 - High Risk (Wire Fraud)', 'David Sterling'],
    ['Legal, Compliance & HR', Math.round(targetSeats * 0.07), 40, 60, 'Tier 2 - Sensitive Data Access', 'Sarah Jenkins'],
    ['IT Operations & DevOps', Math.round(targetSeats * 0.12), 80, 120, 'Tier 2 - Infrastructure Control', 'Alex Chen (SecOps)'],
    ['Sales, Marketing & Commercial', Math.round(targetSeats * 0.35), 180, 400, 'Tier 3 - Standard Exposure', 'Elena Rostova'],
    ['Customer Care & Support Operations', Math.round(targetSeats * 0.35), 110, 565, 'Tier 3 - Standard Exposure', 'Michael Brown'],
  ];

  const wsSeats = XLSX.utils.aoa_to_sheet([seatHeaders, ...seatRows]);
  XLSX.utils.book_append_sheet(wb, wsSeats, 'Seat Allocation & Scope');

  // Sheet 3: Gamification Deliverables Catalog
  const gameHeaders = [
    'Deliverable Game Title',
    'Deliverable Category',
    'Duration (mins)',
    'Difficulty Rating',
    'Target Audience',
    'Contracted Status',
    'Badge Credential Awarded',
  ];
  const gameRows = [
    [
      'PhishHunter: The Cyber Escape Room',
      'Interactive Narrative Escape Room',
      10,
      'Intermediate',
      'Entire Organization',
      'Ready to Launch',
      'PhishHunter Master 2026',
    ],
    [
      'Voice & SMS Defense Arena',
      'Real-time Audio/Text Trainer (Vishing/Smishing)',
      8,
      'Intermediate',
      'Finance, AP, HR & Executive Staff',
      'Ready to Launch',
      'Social Engineering Sentinel',
    ],
    [
      'Ransomware Crisis Commander',
      'Crisis Simulation & Branching Decision',
      15,
      'Advanced',
      'IT, Legal & Business Leadership',
      'Ready to Launch',
      'Incident Response Star',
    ],
    [
      'Executive Spear-Phishing Trivia Quest',
      'Competitive Leaderboard Trivia Challenge',
      6,
      'Intermediate',
      'C-Suite & Department Heads',
      'Ready to Launch',
      'Executive Cyber Shield',
    ],
  ];

  const wsGames = XLSX.utils.aoa_to_sheet([gameHeaders, ...gameRows]);
  XLSX.utils.book_append_sheet(wb, wsGames, 'Gamification Games Catalog');

  // Sheet 4: Contract License Terms
  const termsHeaders = ['Contract Parameter', 'Contract Specification', 'Enforcement Status'];
  const termsRows = [
    ['Customer Organization', companyName, 'Verified Client'],
    ['Master License Key', licenseKey, 'Cryptographically Validated'],
    ['Plan Tier', 'Enterprise Cyber Suite + Multi-Vector Drills', 'Fully Provisioned'],
    ['Total Contracted Seats', `${targetSeats.toLocaleString()} Corporate Mailboxes`, 'Active'],
    ['Effective Start Date', '2026-01-01', 'Active'],
    ['License Expiry Date', expiryDate, 'Active Contract Window'],
    ['Vishing Drill Allocation', '2 Live Voice Simulations per Year', 'Contracted Entitlement'],
    ['Smishing Drill Allocation', '4 SMS Broadcast Drills per Year', 'Contracted Entitlement'],
    ['Gamification Deliverables', '6 Interactive Cyber Games & Escape Rooms', 'Contracted Entitlement'],
    ['Compliance Frameworks', 'PCI-DSS v4.0, ISO 27001:2022, SOC 2 Type II, NIST CSF', 'Compliance Ready'],
    ['SOC SLA Response Time', '< 15 Minutes P1 Urgent / 2 Hours Standard', 'Guaranteed SLA'],
    ['Digital Signature Hash', `SHA256:PROGIST-${Math.random().toString(36).substring(2, 10).toUpperCase()}-LIC`, 'Verified'],
  ];

  const wsTerms = XLSX.utils.aoa_to_sheet([termsHeaders, ...termsRows]);
  XLSX.utils.book_append_sheet(wb, wsTerms, 'Contract Terms & Signatures');

  // Generate Base64
  const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
  const fileDataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelBase64}`;
  const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Master_License_Entitlements.xlsx`;

  const parsedData: ParsedLicenseExcelData = {
    fileName,
    fileSize: Math.round(excelBase64.length * 0.75),
    uploadedAt: new Date().toISOString(),
    sheets: [
      {
        sheetName: 'Entitlements & Quotas',
        headers: entitlementsHeaders,
        rows: entitlementsRows,
        rowCount: entitlementsRows.length,
      },
      {
        sheetName: 'Seat Allocation & Scope',
        headers: seatHeaders,
        rows: seatRows,
        rowCount: seatRows.length,
      },
      {
        sheetName: 'Gamification Games Catalog',
        headers: gameHeaders,
        rows: gameRows,
        rowCount: gameRows.length,
      },
      {
        sheetName: 'Contract Terms & Signatures',
        headers: termsHeaders,
        rows: termsRows,
        rowCount: termsRows.length,
      },
    ],
    totalSheets: 4,
    entitlements: {
      licensedSeats: targetSeats,
      phishingDrillsQuota: 4,
      vishingDrillsQuota: 2,
      smishingDrillsQuota: 4,
      gamificationGamesQuota: 6,
      contractTier: 'Enterprise Cyber Suite',
      slaSupportHours: '24/7 SOC Tier-1',
      lookAlikeDomains: 3,
      customScenariosAllowed: true,
    },
    summaryText: `Master license contract covering ${targetSeats} seats with Phishing (4), Vishing (2), Smishing (4) and Gamification (6) entitlements.`,
  };

  return {
    parsedData,
    fileDataUrl,
    fileName,
    fileSize: parsedData.fileSize,
  };
}

/**
 * Triggers client-side download of an Excel spreadsheet
 */
export function downloadExcelLicenseFile(
  sheets: ExcelSheetData[],
  fileName: string = 'License_Entitlements.xlsx'
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName.substring(0, 31)); // 31 char max for sheet name
  });

  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
