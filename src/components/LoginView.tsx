import React, { useState, useRef, useEffect } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  Shield,
  Mail,
  ArrowRight,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    users,
    loginWithEmail,
    sendLoginOtp,
    verifyLoginOtp,
    pendingLoginEmail,
    setPendingLoginEmail,
    lastSentEmail,
  } = useCustomerContext();

  const [emailInput, setEmailInput] = useState(() => pendingLoginEmail || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP space toggle: allows testing the 6-digit OTP workflow or direct email login
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync if pendingLoginEmail is updated externally
  useEffect(() => {
    if (pendingLoginEmail) {
      setEmailInput(pendingLoginEmail);
      setPasswordInput(pendingLoginEmail);
    }
  }, [pendingLoginEmail]);

  const adminUsers = users.filter((u) => u.role === 'Admin');
  const csmUsers = users.filter((u) => u.role === 'CSM' && u.status === 'Active');

  // Direct small email-and-password login
  const handleDirectLogin = (e?: React.FormEvent, targetEmail?: string, targetPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = targetEmail || emailInput;
    const passwordToUse = targetPassword !== undefined ? targetPassword : passwordInput;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailToUse.trim()) {
      setErrorMsg('Please enter your work email ID to log in.');
      return;
    }

    if (!passwordToUse.trim()) {
      setErrorMsg('Please enter your password. (For now, your password is the same as your email ID).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithEmail(emailToUse, passwordToUse);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed.');
      }
    }, 250);
  };

  // Dispatch 6-digit OTP to the entered email ID
  const handleRequestOtp = (e?: React.FormEvent, targetEmail?: string) => {
    if (e) e.preventDefault();
    const emailToUse = targetEmail || emailInput;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailToUse.trim()) {
      setErrorMsg('Please enter your work email ID to receive a verification OTP.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = sendLoginOtp(emailToUse);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Could not send verification code.');
      } else {
        setOtpSent(true);
        setActiveOtpCode(res.otp || null);
        setOtpDigits(['', '', '', '', '', '']);
        setSuccessMsg(`A 6-digit verification code was dispatched to ${emailToUse}`);
        // Focus first OTP box
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    }, 300);
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    // If user pasted a full 6-digit code
    if (clean.length > 1) {
      const pastedDigits = clean.slice(0, 6).split('');
      const updated = [...otpDigits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setOtpDigits(updated);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const updated = [...otpDigits];
    updated[index] = clean.slice(-1);
    setOtpDigits(updated);

    if (index < 5 && clean) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify entered 6-digit OTP
  const handleVerifyOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = verifyLoginOtp(emailInput, fullCode);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid OTP code.');
      }
    }, 250);
  };

  const autoFillOtp = () => {
    if (!activeOtpCode) return;
    const digits = activeOtpCode.split('');
    setOtpDigits(digits);
    setErrorMsg(null);
    otpInputRefs.current[5]?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="bg-slate-950 p-6 sm:p-7 text-white text-center border-b border-slate-800">
          <div className="w-13 h-13 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-blue-500/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            CyberDrill SecOps
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Progist Phishing Simulation & LMS Compliance Portal
          </p>

          {/* Session Token Guarantee Banner */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-700/80 rounded-full text-[11px] text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Active session token created for <strong>7 hours</strong> per login</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* View Title & Switcher */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {otpSent
                  ? 'Verify 6-Digit OTP'
                  : useOtpMode
                  ? 'Sign in with OTP Verification'
                  : 'Sign in to SecOps Portal'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {otpSent
                  ? `Enter the 6-digit code sent to ${emailInput}`
                  : 'Enter your authorized email to access customer simulation data.'}
              </p>
            </div>

            {/* Mode toggle button */}
            {!otpSent && (
              <button
                type="button"
                onClick={() => {
                  setUseOtpMode(!useOtpMode);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  useOtpMode
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle between direct email login and 6-digit OTP verification"
              >
                {useOtpMode ? '✓ OTP Mode' : '+ Enable OTP'}
              </button>
            )}
          </div>

          {/* Switching email banner */}
          {pendingLoginEmail && !otpSent && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">
                  Target Account: <strong>{pendingLoginEmail}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingLoginEmail(null);
                  setEmailInput('');
                  setPasswordInput('');
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-bold underline shrink-0 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Success / OTP Dispatched Alert */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-medium leading-relaxed">{successMsg}</div>
              </div>

              {/* Simulated Email Passcode Helper */}
              {activeOtpCode && otpSent && (
                <div className="mt-2 p-2.5 bg-white border border-emerald-300 rounded-lg flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Dispatched Security Code
                    </span>
                    <span className="font-mono text-base font-extrabold text-slate-900 tracking-widest">
                      {activeOtpCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={autoFillOtp}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Auto-Fill Code
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 1: OTP DIGIT ENTRY SCREEN */}
          {otpSent ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-13 text-center text-xl font-mono font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Passcode valid for 10 minutes • Issues 7-hour active token
                </p>
              </div>

              <button
                type="submit"
                id="btn-verify-otp-submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Validating OTP & Creating Token...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify Code & Start 7-Hour Session</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
                >
                  ← Change Email
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestOtp(undefined, emailInput)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              </div>
            </form>
          ) : (
            /* MODE 2: EMAIL INPUT (Direct Login OR Request OTP) */
            <form
              onSubmit={(e) => (useOtpMode ? handleRequestOtp(e) : handleDirectLogin(e))}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="login-email-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Work Email ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="name@progist.net or shiyadshubh2000@gmail.com"
                    autoFocus
                    required
                    className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Password Input (Direct Login Mode) */}
              {!useOtpMode && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="login-password-input"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (emailInput.trim()) {
                          setPasswordInput(emailInput.trim());
                          if (errorMsg) setErrorMsg(null);
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer hover:underline"
                      title="For now, sets password to match the email entered above"
                    >
                      Use Email as Password
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="Enter your password (same as email ID)"
                      required
                      className="w-full pl-9.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Default rule: Your login password is currently configured as your email address.
                  </p>
                </div>
              )}

              {useOtpMode ? (
                <button
                  type="submit"
                  id="btn-request-otp-submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Sending 6-Digit OTP...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send 6-Digit OTP to Email</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {isLoading ? (
                    <span>Authenticating & Creating 7h Token...</span>
                  ) : (
                    <>
                      <span>Sign In with Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {/* Toggle footnote */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {useOtpMode
                    ? 'Generates a 6-digit one-time passcode'
                    : 'Direct login creates a 7-hour session'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUseOtpMode(!useOtpMode);
                    setErrorMsg(null);
                  }}
                  className="text-blue-600 hover:underline font-bold cursor-pointer"
                >
                  {useOtpMode ? 'Switch to direct login' : 'Try OTP verification'}
                </button>
              </div>
            </form>
          )}

          {/* Quick Authorized Accounts Selector for testing & convenience */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Authorized Team Accounts
              </span>
              <span className="text-[10px] text-slate-400 font-medium">1-Click Sign In</span>
            </div>

            <div className="space-y-2">
              {/* Admin Accounts */}
              {adminUsers.map((admin) => (
                <button
                  key={admin.id}
                  type="button"
                  id={`btn-quick-login-${admin.id}`}
                  onClick={() => {
                    setEmailInput(admin.email);
                    setPasswordInput(admin.email);
                    if (useOtpMode) {
                      handleRequestOtp(undefined, admin.email);
                    } else {
                      handleDirectLogin(undefined, admin.email, admin.email);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      {admin.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900 flex items-center gap-1.5">
                        <span className="truncate">{admin.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-800 text-[9px] font-extrabold shrink-0">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{admin.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}

              {/* CSM Accounts */}
              {csmUsers.map((csm) => (
                <button
                  key={csm.id}
                  type="button"
                  id={`btn-quick-login-${csm.id}`}
                  onClick={() => {
                    setEmailInput(csm.email);
                    setPasswordInput(csm.email);
                    if (useOtpMode) {
                      handleRequestOtp(undefined, csm.email);
                    } else {
                      handleDirectLogin(undefined, csm.email, csm.email);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-100/70 text-left flex items-center justify-between transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg ${
                        csm.avatarColor || 'bg-emerald-600'
                      } text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}
                    >
                      {csm.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                        <span className="truncate">{csm.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 text-[9px] font-extrabold shrink-0">
                          CSM
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{csm.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}

              {csmUsers.length === 0 && (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] text-slate-500">
                    No CSM accounts added yet. Log in as Admin to invite CSM team members.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              Secured with Token-Based Session Management & Role-Based Access Control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
