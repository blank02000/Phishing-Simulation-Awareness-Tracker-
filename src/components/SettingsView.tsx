import React, { useState, useEffect } from 'react';
import { useCustomerContext } from '../context/CustomerContext';
import { formatDisplayDate } from '../utils/drillCalculator';
import {
  getSmtpStatus,
  verifySmtpConnection,
  sendEmail,
  SmtpStatusResponse,
} from '../utils/emailService';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Download,
  Upload,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cloud,
  Mail,
  Send,
  Loader2,
  Key,
  Server,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    customers,
    referenceDate,
    setReferenceDate,
    dueSoonDays,
    setDueSoonDays,
    purgeProductionData,
    exportDataJSON,
    importDataJSON,
  } = useCustomerContext();

  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // SMTP State
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusResponse | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Test Email Sender State
  const [testEmailTo, setTestEmailTo] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const fetchSmtpInfo = async () => {
    const status = await getSmtpStatus();
    setSmtpStatus(status);
  };

  useEffect(() => {
    fetchSmtpInfo();
  }, []);

  const handleTestSmtp = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const result = await verifySmtpConnection();
      setConnectionResult(result);
    } catch (err: any) {
      setConnectionResult({
        success: false,
        error: err?.message || 'Failed to verify SMTP connection.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo.trim()) return;

    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await sendEmail({
        to: testEmailTo.trim(),
        subject: 'CyberDrill SMTP Test - Nodemailer Verification',
        text: 'This is a test email dispatched from your CyberDrill Security Operations Center application via Nodemailer & SMTP.',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background-color: #f8fafc; color: #1e293b;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <h2 style="color: #0284c7; margin-top: 0;">🛡️ CyberDrill SMTP Connection Test</h2>
              <p>Hello,</p>
              <p>Your <strong>Nodemailer SMTP integration</strong> is operational and configured correctly!</p>
              <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 13px; font-family: monospace; margin: 16px 0;">
                Host: ${smtpStatus?.host || 'Configured'}<br/>
                Port: ${smtpStatus?.port || 587}<br/>
                Sender: ${smtpStatus?.from || 'Default'}
              </div>
              <p style="font-size: 13px; color: #64748b;">You can now send live phishing simulation schedules, overdue drill notices, and review invites to customers.</p>
            </div>
          </div>
        `,
      });

      if (res.success) {
        setTestEmailResult({
          success: true,
          message: `Test email sent to ${testEmailTo}! (ID: ${res.messageId || 'Delivered'})`,
        });
        setTestEmailTo('');
      } else {
        setTestEmailResult({
          success: false,
          error: res.error || 'Failed to send test email. Check SMTP credentials.',
        });
      }
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        error: err?.message || 'Network error occurred.',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberdrill_backup_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: 'Customer drill data exported successfully!', type: 'success' });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const success = importDataJSON(importText.trim());
    if (success) {
      setMessage({ text: 'Customer drill database successfully restored!', type: 'success' });
      setImportText('');
    } else {
      setMessage({ text: 'Failed to import JSON. Please verify the format.', type: 'error' });
    }
  };

  const handleReset = async () => {
    if (window.confirm('Purge all customer records and reset database to empty (0 customers)?')) {
      const success = await purgeProductionData();
      if (success) {
        setMessage({ text: 'All customer records purged. Database is now empty (0 customers).', type: 'success' });
      } else {
        setMessage({ text: 'Failed to purge database records.', type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16" id="settings-view-root">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Operations & Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure schedule parameters, SMTP mail server integration, and cloud persistence.
        </p>
      </div>

      {/* Cloud Firestore Status */}
      <div className="bg-emerald-50/70 rounded-xl border border-emerald-200/80 p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>Firebase Firestore Cloud Database</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Connected & Live
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Real-time synchronization active for customer accounts, drill logs, and CSM team profiles.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-500 hover:text-slate-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SMTP & Nodemailer Mailer Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Nodemailer SMTP Mail Server</h2>
              <p className="text-[11px] text-slate-500">
                Dispatches drill reminders, review meeting notifications, and overdue escalation alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchSmtpInfo}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Refresh SMTP status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  smtpStatus?.configured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-900">
                {smtpStatus?.configured ? 'SMTP Configured' : 'SMTP Environment Variables Pending'}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  smtpStatus?.configured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {smtpStatus?.configured ? 'Ready' : 'Not Configured in .env'}
              </span>
            </div>

            {smtpStatus?.configured && (
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingConnection}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying Connection...
                  </>
                ) : (
                  <>
                    <Server className="w-3.5 h-3.5 text-slate-500" /> Test SMTP Connection
                  </>
                )}
              </button>
            )}
          </div>

          {smtpStatus?.configured && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Host</span>
                <span className="font-mono font-semibold text-slate-800 truncate block">{smtpStatus.host}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Port</span>
                <span className="font-mono font-semibold text-slate-800">{smtpStatus.port} ({smtpStatus.secure ? 'SSL' : 'STARTTLS'})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">From Sender</span>
                <span className="font-medium text-slate-800 truncate block">{smtpStatus.from || 'Default'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Auth</span>
                <span className="font-semibold text-emerald-700">{smtpStatus.hasAuth ? 'Authenticated' : 'No Auth'}</span>
              </div>
            </div>
          )}

          {connectionResult && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                connectionResult.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-100 text-rose-900 border border-rose-200'
              }`}
            >
              {connectionResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{connectionResult.message || connectionResult.error}</span>
            </div>
          )}
        </div>

        {/* Send Quick Test Email */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            Send Live Test Email
          </h3>
          <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="Enter recipient email (e.g. your email)..."
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={sendingTestEmail || !smtpStatus?.configured}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              {sendingTestEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Test
                </>
              )}
            </button>
          </form>

          {testEmailResult && (
            <div
              className={`mt-2 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                testEmailResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testEmailResult.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{testEmailResult.message || testEmailResult.error}</span>
            </div>
          )}
        </div>

        {/* Environment Variables Reference Guide */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Required Environment Variables (.env / Secrets)
            </span>
          </div>
          <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
{`# SMTP Mail Server Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com          # Or smtp.sendgrid.net, smtp.mailgun.org, etc.
SMTP_PORT=587                     # 587 for TLS, 465 for SSL
SMTP_SECURE=false                 # true for 465, false for 587
SMTP_USER=your_email@gmail.com    # SMTP Username / Login Email
SMTP_PASS=your_app_password       # Gmail 16-character App Password / API Key
SMTP_FROM="CyberDrill SecOps <your_email@gmail.com>"`}
          </pre>
          <div className="pt-2 text-[10px] text-slate-400">
            💡 For Gmail: Use Google Account &gt; Security &gt; 2-Step Verification &gt; <strong>App Passwords</strong> to generate a 16-character SMTP password.
          </div>
        </div>
      </div>

      {/* Schedule Parameters Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Timing & Alert Thresholds
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              System Reference Date (Simulation Date)
            </label>
            <input
              id="input-settings-ref-date"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Currently set to: <span className="font-semibold text-slate-700">{formatDisplayDate(referenceDate)}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              &quot;Due Soon&quot; Alert Threshold (Days)
            </label>
            <input
              id="input-settings-due-soon-days"
              type="number"
              min={1}
              max={60}
              value={dueSoonDays}
              onChange={(e) => setDueSoonDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Drills within {dueSoonDays} days of planned date will be flagged as &quot;Due Soon&quot;.
            </p>
          </div>
        </div>
      </div>

      {/* Core Architecture Overview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          Standard Core Drill Lifecycle
        </h2>
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex flex-wrap items-center gap-2">
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Customer</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Annual Drill Plan</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Quarterly Drills</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Results</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Review Meeting</span>
          <span>→</span>
          <span className="bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs">Completion History</span>
        </div>
      </div>

      {/* Data Management Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900">Data Management & Backup</h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export All Customers JSON
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Purge All Data (0 Customers)
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Restore / Import JSON Database
          </label>
          <textarea
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste exported JSON customer records here..."
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Import JSON Data
          </button>
        </div>
      </div>
    </div>
  );
};
