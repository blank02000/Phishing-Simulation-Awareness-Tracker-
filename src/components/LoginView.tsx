import React, { useState } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import {
  Shield,
  Mail,
  ArrowRight,
  UserCheck,
  Lock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  Building2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { users, loginWithEmail, pendingLoginEmail, setPendingLoginEmail } = useCustomerContext();
  const [emailInput, setEmailInput] = useState(() => pendingLoginEmail || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync if pendingLoginEmail is updated externally
  React.useEffect(() => {
    if (pendingLoginEmail) {
      setEmailInput(pendingLoginEmail);
    }
  }, [pendingLoginEmail]);

  const adminUser = users.find((u) => u.role === 'Admin');
  const csmUsers = users.filter((u) => u.role === 'CSM' && u.status === 'Active');

  const handleLogin = (e?: React.FormEvent, targetEmail?: string) => {
    if (e) e.preventDefault();
    const emailToUse = targetEmail || emailInput;
    setErrorMsg(null);

    if (!emailToUse.trim()) {
      setErrorMsg('Please enter your email ID to log in.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = loginWithEmail(emailToUse);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication failed.');
      }
    }, 200);
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
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {pendingLoginEmail ? 'Switch Account / Sign In' : 'Sign in to your account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your authorized Progist email ID (Admin or assigned CSM).
            </p>
          </div>

          {pendingLoginEmail && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">
                  Switching to: <strong>{pendingLoginEmail}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingLoginEmail(null);
                  setEmailInput('');
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-bold underline shrink-0 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label htmlFor="login-email-input" className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  placeholder="name@progist.net"
                  autoFocus
                  required
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              id="btn-login-submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In with Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Authorized Accounts Selector for testing/convenience */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Authorized Team Accounts
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Quick Sign In</span>
            </div>

            <div className="space-y-2">
              {/* Admin Button */}
              {adminUser && (
                <button
                  type="button"
                  id="btn-quick-login-admin"
                  onClick={() => {
                    setEmailInput(adminUser.email);
                    handleLogin(undefined, adminUser.email);
                  }}
                  className="w-full p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      {adminUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900 flex items-center gap-1.5">
                        <span>{adminUser.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-200 text-purple-800 text-[9px] font-extrabold">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{adminUser.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {/* CSM Users */}
              {csmUsers.map((csm) => (
                <button
                  key={csm.id}
                  type="button"
                  onClick={() => {
                    setEmailInput(csm.email);
                    handleLogin(undefined, csm.email);
                  }}
                  className="w-full p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-100/70 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg ${
                        csm.avatarColor || 'bg-emerald-600'
                      } text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}
                    >
                      {csm.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                        <span>{csm.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-800 text-[9px] font-extrabold">
                          CSM
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{csm.email}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}

              {csmUsers.length === 0 && (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-[11px] text-slate-500">
                    No CSM accounts added yet. Log in as Admin to invite CSMs.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              Secured with Firebase Firestore & Role-Based Access Control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
