import React, { useState } from 'react';
import { useCustomerContext } from '../../context/CustomerContext';
import { SmtpSecurityProtocol } from '../../types';
import { SMTP_PRESETS, SmtpPreset } from '../../utils/smtpService';
import { isEncrypted, maskSecret } from '../../utils/cryptoHelper';
import {
  Mail,
  ShieldCheck,
  Lock,
  Key,
  Server,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Clock,
  Sparkles,
  HelpCircle,
  Database,
  Building2,
  Trash2,
} from 'lucide-react';

export const SmtpSettingsView: React.FC = () => {
  const {
    smtpConfig,
    smtpLogs,
    updateSmtpConfig,
    testSmtpConnectionHandler,
    clearSmtpLogs,
    allCustomers,
    syncMasterAccounts,
    currentUser,
  } = useCustomerContext();

  // Local form state
  const [formData, setFormData] = useState({
    enabled: smtpConfig.enabled,
    host: smtpConfig.host,
    port: smtpConfig.port,
    security: smtpConfig.security,
    authRequired: smtpConfig.authRequired,
    username: smtpConfig.username,
    fromEmail: smtpConfig.fromEmail,
    fromName: smtpConfig.fromName,
    replyToEmail: smtpConfig.replyToEmail || '',
    rateLimitPerHour: smtpConfig.rateLimitPerHour || 250,
  });

  // Password & Encryption State
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCiphertext, setShowCiphertext] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Test Console State
  const [testRecipient, setTestRecipient] = useState(
    smtpConfig.testEmailRecipient || 'shiyadshubh2000@gmail.com'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    logs: string[];
    message: string;
  } | null>(null);

  // Master accounts sync status
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'Admin';
  const hasEncryptedSecret = Boolean(smtpConfig.encryptedPassword);
  const isSecretEncryptedFormat = isEncrypted(smtpConfig.encryptedPassword);

  // Apply provider preset
  const handleApplyPreset = (preset: SmtpPreset) => {
    setFormData((prev) => ({
      ...prev,
      host: preset.host,
      port: preset.port,
      security: preset.security,
      authRequired: preset.authRequired,
    }));
  };

  // Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      await updateSmtpConfig(
        {
          enabled: formData.enabled,
          host: formData.host.trim(),
          port: Number(formData.port),
          security: formData.security as SmtpSecurityProtocol,
          authRequired: formData.authRequired,
          username: formData.username.trim(),
          fromEmail: formData.fromEmail.trim(),
          fromName: formData.fromName.trim(),
          replyToEmail: formData.replyToEmail?.trim(),
          rateLimitPerHour: Number(formData.rateLimitPerHour),
          testEmailRecipient: testRecipient.trim(),
        },
        newPassword.trim() ? newPassword.trim() : undefined
      );

      setNewPassword('');
      setSaveSuccessMsg('SMTP configuration & encrypted credentials updated successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error saving SMTP settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Run Test Handshake
  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSmtpConnectionHandler(testRecipient);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        logs: [`[CRITICAL ERROR] Handshake execution failed: ${err.message}`],
        message: err.message || 'Diagnostic failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Sync 67 Master Accounts
  const handleSyncMasterAccounts = () => {
    const res = syncMasterAccounts();
    setSyncStatus(
      `Master Accounts Verified: ${res.totalAccounts} total accounts active (${res.totalAdded} newly provisioned from master catalog).`
    );
    setTimeout(() => setSyncStatus(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Title & Breadcrumb Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Outbound SMTP Mail & Relay Configuration
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3" />
                  AES-256-GCM Encrypted
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Configure encrypted mail servers for phishing notifications, executive review invites, drill alerts, and deliverable dispatches.
              </p>
            </div>
          </div>
        </div>

        {/* Master Accounts Sync Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 font-medium block">Client Database</span>
            <span className="text-sm font-bold text-slate-800 flex items-center justify-end gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              {allCustomers.length} Master Accounts Loaded
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncMasterAccounts}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Re-verify that all 67 master client accounts are present in active state"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Sync Master Accounts
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Settings & Test Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Quick Provider Presets */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Quick Provider Presets
                </h3>
                <span className="text-xs text-slate-400">1-click host & port populate</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SMTP_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 text-left border rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex flex-col justify-between bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                        {preset.provider}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono mt-1 block truncate">
                      {preset.host}:{preset.port}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Server & Security Parameters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Mail Server Connection</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-700">
                    {formData.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SMTP Host / Server Domain *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    placeholder="e.g. smtp.office365.com or mail.company.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Port *</label>
                  <input
                    type="number"
                    required
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Security Encryption Protocol *
                  </label>
                  <select
                    value={formData.security}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        security: e.target.value as SmtpSecurityProtocol,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-800"
                  >
                    <option value="starttls">STARTTLS (Port 587 - Standard / Recommended)</option>
                    <option value="ssl">SSL / Direct TLS (Port 465 - Implicit)</option>
                    <option value="tls">TLS 1.3 / Explicit Handshake</option>
                    <option value="none">Plain Text (Port 25 - Not Recommended / Insecure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rate Limit (Emails / Hour)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimitPerHour}
                    onChange={(e) =>
                      setFormData({ ...formData, rateLimitPerHour: Number(e.target.value) })
                    }
                    placeholder="250"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Encrypted Credentials Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Encrypted Authentication Credentials
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Plain-Text Storage
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="authRequired"
                  checked={formData.authRequired}
                  onChange={(e) => setFormData({ ...formData, authRequired: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="authRequired" className="text-xs font-bold text-slate-700">
                  Requires Server Authentication (AUTH LOGIN / PLAIN)
                </label>
              </div>

              {formData.authRequired && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      SMTP Username / Account *
                    </label>
                    <input
                      type="text"
                      required={formData.authRequired}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. secops-relay@yourdomain.com"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {hasEncryptedSecret ? 'Update Password / App Secret' : 'Password / App Secret *'}
                      </label>
                      {hasEncryptedSecret && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Encrypted secret currently stored
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={
                          hasEncryptedSecret
                            ? 'Leave blank to keep existing encrypted password'
                            : 'Enter app password or SMTP secret'
                        }
                        className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Any password entered is transformed into AES-256-GCM ciphertext via Web Crypto PBKDF2 before saving.
                    </p>
                  </div>

                  {/* Cryptographic Envelope Inspector */}
                  {hasEncryptedSecret && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Active Ciphertext Envelope
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCiphertext(!showCiphertext)}
                          className="text-[11px] text-blue-600 hover:underline font-semibold"
                        >
                          {showCiphertext ? 'Hide Ciphertext' : 'Inspect Ciphertext'}
                        </button>
                      </div>

                      {showCiphertext ? (
                        <div className="mt-2 text-[10px] font-mono bg-slate-900 text-emerald-400 p-2.5 rounded-lg break-all select-all">
                          {smtpConfig.encryptedPassword}
                        </div>
                      ) : (
                        <div className="mt-1 text-xs text-slate-500 font-mono">
                          Status: <span className="text-emerald-700 font-bold">AES-256-GCM Authenticated</span> (PBKDF2 100k rounds)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sender Identity Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Sender Identity & Envelope</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The From address and sender display name that recipients see.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    placeholder="e.g. Progist SecOps Platform"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    From Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    placeholder="secops-notifications@yourdomain.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reply-To Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.replyToEmail}
                    onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                    placeholder="support@yourdomain.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Last modified: {new Date(smtpConfig.updatedAt).toLocaleDateString()} by{' '}
                {smtpConfig.updatedBy}
              </span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Save & Encrypt Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Diagnostic Console & Outbound Log (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Handshake Diagnostic Console */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Diagnostic Handshake Console</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                RFC 5321
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Verify your encrypted credentials, negotiate the TLS socket, and verify relay authorization with a live test recipient.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Email Recipient
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="shiyadshubh2000@gmail.com"
                    className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-400 outline-none font-mono"
                  />
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleRunTest}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Test Handshake
                  </button>
                </div>
              </div>

              {/* Console Output Screen */}
              <div className="mt-3 bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto space-y-1 text-slate-300">
                {testResult ? (
                  <>
                    <div
                      className={`font-bold mb-2 ${
                        testResult.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {testResult.success ? '✓ 250 HANDSHAKE VERIFIED' : '✗ HANDSHAKE FAILED'}
                    </div>
                    {testResult.logs.map((logLine, idx) => (
                      <div
                        key={idx}
                        className={
                          logLine.includes('ERROR')
                            ? 'text-rose-400'
                            : logLine.includes('✓') || logLine.includes('Success')
                            ? 'text-emerald-400'
                            : logLine.includes('-->')
                            ? 'text-cyan-300'
                            : logLine.includes('<--')
                            ? 'text-amber-300'
                            : 'text-slate-400'
                        }
                      >
                        {logLine}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-slate-600 py-6 text-center italic">
                    Press "Test Handshake" to decrypt credentials and simulate socket handshake...
                  </div>
                )}
              </div>

              {smtpConfig.lastTestedAt && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Last Status:{' '}
                    <strong
                      className={
                        smtpConfig.lastTestStatus === 'success'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }
                    >
                      {smtpConfig.lastTestStatus?.toUpperCase()}
                    </strong>
                  </span>
                  <span>{new Date(smtpConfig.lastTestedAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Outbound Dispatch Audit Log */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Recent Outbound Activity</h3>
              </div>
              {smtpLogs.length > 0 && (
                <button
                  type="button"
                  onClick={clearSmtpLogs}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Clear dispatch history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {smtpLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No outbound mail dispatched yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {smtpLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200/60 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 truncate max-w-[200px]">
                        {log.to}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium truncate">{log.subject}</div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                      <span className="truncate">{log.smtpHost}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
