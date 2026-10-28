import React, { useState } from 'react';
import { GamificationGameDeliverable, Customer } from '../../types';
import {
  X,
  Gamepad2,
  Award,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Clock,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface InteractiveGamePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: GamificationGameDeliverable | null;
  customer?: Customer | null;
  onGameCompleted?: (game: GamificationGameDeliverable, score: number) => void;
}

export const InteractiveGamePlayerModal: React.FC<InteractiveGamePlayerModalProps> = ({
  isOpen,
  onClose,
  game,
  customer,
  onGameCompleted,
}) => {
  if (!isOpen || !game) return null;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // Scenarios per game
  const scenarios = getScenariosForGame(game.slug || game.id);

  const handleSelectOption = (index: number) => {
    if (feedback) return; // already answered
    setSelectedAnswer(index);
    const option = scenarios[currentStep]?.options[index];
    const isCorrect = Boolean(option?.correct);
    if (isCorrect) {
      setScore((prev) => prev + 25);
    }
    setFeedback({
      isCorrect,
      explanation: option?.explanation || (isCorrect ? 'Correct tactical choice!' : 'Security risk identified.'),
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedAnswer(null);
    if (currentStep + 1 < scenarios.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsGameOver(true);
      if (onGameCompleted) {
        onGameCompleted(game, score + (feedback?.isCorrect ? 25 : 0));
      }
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setSelectedAnswer(null);
    setScore(0);
    setIsGameOver(false);
    setFeedback(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-950 text-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 flex flex-col">
        {/* Game Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 border-b border-indigo-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {game.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {game.durationMinutes} min mission
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{game.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Score: {score} XP</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isGameOver ? (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                Room / Challenge {currentStep + 1} of {scenarios.length}
              </span>
              <span>{Math.round(((currentStep) / scenarios.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / scenarios.length) * 100}%` }}
              />
            </div>

            {/* Scenario Card */}
            <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{scenarios[currentStep]?.scenarioType || 'Scenario Challenge'}</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">
                {scenarios[currentStep]?.prompt}
              </h4>
              {scenarios[currentStep]?.contextSnippet && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {scenarios[currentStep]?.contextSnippet}
                </div>
              )}
            </div>

            {/* Interactive Options */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Your Tactical Security Action:
              </p>
              {scenarios[currentStep]?.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                let btnStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200';
                if (feedback && isSelected) {
                  btnStyle = feedback.isCorrect
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30'
                    : 'bg-rose-950/60 border-rose-500 text-rose-200 ring-2 ring-rose-500/30';
                } else if (feedback && option.correct) {
                  btnStyle = 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={feedback !== null}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <div className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1 leading-relaxed">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback / Explanatory Note */}
            {feedback && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
                  feedback.isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {feedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Security Success (+25 XP)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Vulnerability Triggered</span>
                    </>
                  )}
                </div>
                <p>{feedback.explanation}</p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentStep + 1 === scenarios.length ? 'View Debrief Score' : 'Next Scenario'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Game Completed Scorecard */
          <div className="p-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-xl">
              <Award className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
                Challenge Completed
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">
                Mission Debrief: {game.title}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Security simulation completed for {customer?.companyName || 'Enterprise Account'}.
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 max-w-sm mx-auto space-y-3">
              <div className="text-3xl font-extrabold text-indigo-400 font-mono">
                {score} / 100 XP
              </div>
              <p className="text-xs text-slate-300 font-semibold">
                Badge Unlocked: <span className="text-amber-400 font-bold">{game.badgeAwarded || 'Cyber Defender 2026'}</span>
              </p>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                {score >= 75
                  ? 'Exemplary threat analysis! Your responses demonstrate readiness against real-world social engineering.'
                  : 'Awareness training recommended. Key takeaways logged into your security profile.'}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Mission</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Close</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ScenarioItem {
  scenarioType: string;
  prompt: string;
  contextSnippet?: string;
  options: { text: string; correct: boolean; explanation: string }[];
}

function getScenariosForGame(slug: string): ScenarioItem[] {
  if (slug.includes('voice') || slug.includes('sms')) {
    return [
      {
        scenarioType: 'Live Incoming Vishing Call',
        prompt: 'You receive a phone call displaying your company\'s internal IT Service Desk number. The caller states: "Hi, this is Dave from Helpdesk. We are pushing a critical security patch to your laptop. Please confirm the 6-digit MFA code we just pushed to your phone."',
        contextSnippet: 'CALLER ID: +1 (555) 019-4820 (Spoofed IT Internal Line)\nCALLER TONE: Urgent, professional, background server room white noise',
        options: [
          {
            text: 'Read out the 6-digit MFA code immediately so the patch completes.',
            correct: false,
            explanation: 'Critical mistake! IT staff never ask for 2FA/MFA codes over the phone. Reading it grants immediate account takeover.',
          },
          {
            text: 'Ask the caller for their employee ID and verify it on company Slack.',
            correct: false,
            explanation: 'Attacker may have researched names from LinkedIn. Never trust unverified call context.',
          },
          {
            text: 'Refuse to share the code, hang up, and call the verified IT Helpdesk number directly from the internal intranet directory.',
            correct: true,
            explanation: 'Golden standard defense! Always terminate unprompted incoming calls and dial back via a known trusted directory.',
          },
        ],
      },
      {
        scenarioType: 'Urgent Smishing SMS Message',
        prompt: 'You receive an SMS on your corporate mobile: "[ALERT]: Your corporate M365 password expires in 15 minutes. To prevent account suspension, reset now: https://login-progist-portal-update.com/reset"',
        contextSnippet: 'SMS SENDER: +1-888-SEC-DEPT\nTIMESTAMP: Friday 4:52 PM',
        options: [
          {
            text: 'Click the link immediately to prevent being locked out over the weekend.',
            correct: false,
            explanation: 'Urgency + Friday afternoon timing is a classic social engineering trick to bypass critical thinking.',
          },
          {
            text: 'Forward the message to your corporate SOC/Security team and block the sender.',
            correct: true,
            explanation: 'Spot on! The URL uses a deceptive look-alike domain. Forwarding to SOC protects your colleagues.',
          },
          {
            text: 'Reply "STOP" to unsubscribe from alerts.',
            correct: false,
            explanation: 'Replying confirms to attackers that your mobile number is live and monitored.',
          },
        ],
      },
      {
        scenarioType: 'Executive Voice Deepfake / Pretext',
        prompt: 'The VP of Finance receives a phone call from what sounds exactly like the CEO: "I am in confidential M&A negotiations in London and need an urgent $85,000 wire transferred to escrow immediately before market close."',
        contextSnippet: 'VOICE ANALYSIS: Matches CEO pitch & cadence\nREQUEST: Deviates from standard two-person approval policy',
        options: [
          {
            text: 'Initiate wire transfer right away because the CEO sounds distressed.',
            correct: false,
            explanation: 'AI voice cloning can replicate executive voices from as little as 3 seconds of public webinar audio.',
          },
          {
            text: 'Pause the transaction and initiate secondary out-of-band verification via a known pre-agreed channel or in-person confirmation.',
            correct: true,
            explanation: 'Correct! Financial wires must strictly enforce multi-party approval regardless of executive pressure.',
          },
          {
            text: 'Email the CEO back asking if the call was real.',
            correct: false,
            explanation: 'If the CEO\'s email was also compromised (BEC), the attacker could reply confirming the fraud.',
          },
        ],
      },
    ];
  }

  if (slug.includes('ransomware') || slug.includes('crisis')) {
    return [
      {
        scenarioType: 'Initial Breach Detection',
        prompt: 'At 02:14 AM on Sunday, endpoint detection agents flag mass file renaming with extension ".locked_apex" across 14 file servers in the European datacenter.',
        contextSnippet: 'SIEM ALERT: Abnormal volume of high-speed AES encryption\nRANSOM NOTE: ReadMe_Decrypt_Your_Data.txt found in C:\\Shares',
        options: [
          {
            text: 'Reboot the file servers to stop the running encryption processes.',
            correct: false,
            explanation: 'Rebooting can overwrite RAM where encryption keys may still reside, destroying forensic evidence.',
          },
          {
            text: 'Immediately sever all network links and isolate the datacenter VLAN from the corporate WAN and cloud interconnects.',
            correct: true,
            explanation: 'Immediate network containment halts lateral movement while preserving volatile memory for incident response.',
          },
          {
            text: 'Contact the ransom email in the text note to see how much they want.',
            correct: false,
            explanation: 'Never contact attackers prior to assessing clean immutable backup availability and consulting legal counsel.',
          },
        ],
      },
      {
        scenarioType: 'Crisis Containment & Disclosure',
        prompt: 'Forensics identifies the ransomware entry point as an unpatched VPN appliance with stolen credentials. The attackers claim to have exfiltrated 50GB of customer financial records.',
        contextSnippet: 'REGULATORY CLOCK: GDPR 72-hour notification countdown started\nEXTORTION THREAT: Publish on dark web leak site in 24 hours',
        options: [
          {
            text: 'Cover up the incident internally until systems are restored.',
            correct: false,
            explanation: 'Cover-ups violate regulatory disclosure laws (GDPR, SEC) and lead to severe criminal and civil penalties.',
          },
          {
            text: 'Activate the Incident Response Plan, convene the Crisis Committee, notify law enforcement, and draft mandatory regulatory disclosures.',
            correct: true,
            explanation: 'Complies with industry standards and legal requirements while retaining credibility with stakeholders.',
          },
        ],
      },
    ];
  }

  // Default: PhishHunter Escape Room
  return [
    [
      {
        scenarioType: 'Room 1: The Executive Mailbox',
        prompt: 'You enter the CFO\'s office. An unread email sits open with subject: "URGENT: Outstanding Vendor Invoice #INV-9921 - Action Required". What is the first indicator that this is a phishing simulation?',
        contextSnippet: 'FROM: "Billing Support" <billing@supp1ier-portal.net>\nTO: cfo@apexfinancial.com\nATTACHMENT: Invoice_Sep2026.pdf.exe (Hidden extension)',
        options: [
          {
            text: 'The email was sent during business hours.',
            correct: false,
            explanation: 'Business hours sending is normal.',
          },
          {
            text: 'The sender domain has a typo "supp1ier" and the file has a double extension (.pdf.exe).',
            correct: true,
            explanation: 'Spot on! Typo-squatting with number "1" instead of "l", plus executable payload hidden behind PDF icon.',
          },
          {
            text: 'The invoice amount is too small.',
            correct: false,
            explanation: 'Attackers frequently use realistic invoice numbers to blend in.',
          },
        ],
      },
      {
        scenarioType: 'Room 2: The Hallway QR Code Trap',
        prompt: 'In the office lobby, a new poster has appeared: "Quick Staff Survey: Win a $50 Amazon Gift Card! Scan QR to vote on office lunch menu".',
        contextSnippet: 'QR DECODED DESTINATION: https://tinyurl.com/apex-survey-auth-bypass',
        options: [
          {
            text: 'Scan it with your phone immediately since it has the company logo.',
            correct: false,
            explanation: 'Quishing (QR code phishing) bypasses mail gateway filters because QR images hide malicious URLs from text parsers.',
          },
          {
            text: 'Flag the poster to physical security and verify with Facilities before scanning unvetted QR codes.',
            correct: true,
            explanation: 'Brilliant defense! Physical social engineering traps are just as dangerous as malicious emails.',
          },
        ],
      },
      {
        scenarioType: 'Room 3: The Fake SSO Login Portal',
        prompt: 'You click a link from an invite and arrive at what looks like Microsoft 365 login. The browser address bar shows: https://login.microsoftonline.portal-apex-auth.cc/oauth2',
        contextSnippet: 'PAGE APPEARANCE: Identical corporate logo and background\nURL: Look-alike sub-domain ending in .cc',
        options: [
          {
            text: 'The lock icon is present, so the site is definitely safe to enter your corporate password.',
            correct: false,
            explanation: 'HTTPS only means the connection is encrypted, not that the recipient is trustworthy! Most phishing sites have SSL certificates.',
          },
          {
            text: 'The real domain is portal-apex-auth.cc, NOT microsoft.com. Do not enter credentials and click the Pro Patrol Report button!',
            correct: true,
            explanation: 'Masterful inspection! The root domain is .cc, a common malicious proxy server designed to harvest session cookies.',
          },
        ],
      },
    ][0],
    {
      scenarioType: 'Room 2: The Hallway QR Code Trap',
      prompt: 'In the office breakroom, a new flyer says: "Employee Wellness Bonus: Scan QR code to verify your direct deposit account details". What should you do?',
      contextSnippet: 'QR DESTINATION: Shortened Bit.ly link redirecting to external form',
      options: [
        {
          text: 'Scan the QR code from your personal phone so it doesn\'t affect your laptop.',
          correct: false,
          explanation: 'Your personal phone holds corporate credentials (Slack, email, 2FA apps) and is equally vulnerable.',
        },
        {
          text: 'Refuse to scan, notify Security Operations, and remove the unapproved poster.',
          correct: true,
          explanation: 'Excellent vigilance! Direct deposit changes are strictly handled through certified HR portals, never QR posters.',
        },
      ],
    },
    {
      scenarioType: 'Room 3: The Fake SSO Login Portal',
      prompt: 'You land on a login page that looks identical to your company SSO. The URL is: https://login.microsoftonline.apex-security-auth.cc. What do you do?',
      contextSnippet: 'BROWSER STATUS: HTTPS Green Lock\nURL HOST: apex-security-auth.cc',
      options: [
        {
          text: 'Check if your password manager auto-fills. If it doesn\'t auto-fill, it\'s an impostor domain!',
          correct: true,
          explanation: 'Password managers match against the exact registered domain name and will never auto-fill into phishing proxies!',
        },
        {
          text: 'Enter a fake password to test if the site accepts anything.',
          correct: false,
          explanation: 'Phishing kits often record every keystroke and might record your IP address or session tokens.',
        },
      ],
    },
  ];
}
