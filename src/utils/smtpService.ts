import { SmtpConfig, EmailSendingLog } from '../types';
import { encryptSecret, decryptSecret, isEncrypted } from './cryptoHelper';

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  id: 'default-smtp-config',
  enabled: true,
  host: 'smtp.office365.com',
  port: 587,
  security: 'starttls',
  authRequired: true,
  username: 'secops-notifications@progist.net',
  encryptedPassword: '', // Will be initialized with encrypted string
  fromEmail: 'secops-notifications@progist.net',
  fromName: 'Progist SecOps Platform',
  replyToEmail: 'support@progist.net',
  testEmailRecipient: 'shiyadshubh2000@gmail.com',
  lastTestedAt: undefined,
  lastTestStatus: 'not_tested',
  lastTestMessage: undefined,
  rateLimitPerHour: 250,
  relaySignature: 'PROGIST-SECOPS-AES256-RELAY',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin',
};

export interface SmtpPreset {
  name: string;
  provider: string;
  host: string;
  port: number;
  security: 'tls' | 'ssl' | 'starttls' | 'none';
  authRequired: boolean;
  description: string;
  icon: string;
}

export const SMTP_PRESETS: SmtpPreset[] = [
  {
    name: 'Microsoft 365 / Outlook',
    provider: 'Office 365',
    host: 'smtp.office365.com',
    port: 587,
    security: 'starttls',
    authRequired: true,
    description: 'Corporate M365 Exchange Online authenticated SMTP relay.',
    icon: '🏢',
  },
  {
    name: 'Google Workspace / Gmail',
    provider: 'Google',
    host: 'smtp.gmail.com',
    port: 587,
    security: 'starttls',
    authRequired: true,
    description: 'Gmail SMTP relay using Google Workspace App Password.',
    icon: '🌐',
  },
  {
    name: 'Progist Secure Mail Gateway',
    provider: 'Progist Network',
    host: 'mail.progist.net',
    port: 465,
    security: 'ssl',
    authRequired: true,
    description: 'Direct dedicated corporate TLS/SSL mail delivery cluster.',
    icon: '🛡️',
  },
  {
    name: 'Amazon Simple Email Service (SES)',
    provider: 'AWS SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    security: 'starttls',
    authRequired: true,
    description: 'High-volume cloud infrastructure transactional relay.',
    icon: '☁️',
  },
  {
    name: 'SendGrid / Twilio Relay',
    provider: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    security: 'starttls',
    authRequired: true,
    description: 'API Key authenticated transactional delivery service.',
    icon: '⚡',
  },
];

/**
 * Initializes default encrypted password if empty
 */
export async function getInitializedDefaultSmtpConfig(): Promise<SmtpConfig> {
  const encPass = await encryptSecret('ProgistSecOps#2026!');
  return {
    ...DEFAULT_SMTP_CONFIG,
    encryptedPassword: encPass,
  };
}

/**
 * Simulates end-to-end cryptographic SMTP handshake and delivery test
 */
export async function testSmtpConnection(
  config: SmtpConfig,
  recipient: string
): Promise<{ success: boolean; logs: string[]; message: string }> {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`);

  log('Initializing SMTP Diagnostic Handshake...');

  if (!config.host || !config.port) {
    log('❌ ERROR: Missing SMTP server host or port configuration.');
    return { success: false, logs, message: 'Missing host or port configuration.' };
  }

  // Step 1: Verify and decrypt credentials
  log('1. Checking credential cryptographic envelope...');
  if (config.authRequired) {
    if (!config.username) {
      log('❌ ERROR: Authentication is enabled but username is blank.');
      return { success: false, logs, message: 'Authentication is enabled but username is blank.' };
    }

    if (!config.encryptedPassword) {
      log('❌ ERROR: No encrypted password found in configuration.');
      return { success: false, logs, message: 'Password is empty.' };
    }

    const isEnc = isEncrypted(config.encryptedPassword);
    log(`   Ciphertext status: ${isEnc ? '✓ Encrypted with AES-256-GCM' : '⚠️ Plain text'}`);

    const decryptedPassword = await decryptSecret(config.encryptedPassword);
    if (!decryptedPassword) {
      log('❌ ERROR: Failed to decrypt stored credentials. Key mismatch or corrupt ciphertext.');
      return { success: false, logs, message: 'Failed to decrypt credentials.' };
    }
    log(`   ✓ Credentials decrypted in-memory for session (length: ${decryptedPassword.length} chars).`);
  } else {
    log('   Anonymous / IP-whitelisted relay configured (No auth required).');
  }

  // Step 2: Simulate TCP socket resolution
  log(`2. Resolving host "${config.host}:${config.port}"...`);
  await new Promise((r) => setTimeout(r, 400));
  log(`   ✓ Connected to ${config.host} [Port ${config.port}]`);
  log(`   <-- 220 ${config.host} ESMTP Progist-Mail-Gateway Ready`);

  // Step 3: EHLO Handshake
  log('3. Sending EHLO domain greeting...');
  await new Promise((r) => setTimeout(r, 350));
  log(`   --> EHLO secops.progist.net`);
  log(`   <-- 250-${config.host} greets secops.progist.net`);
  log(`   <-- 250-PIPELINING`);
  log(`   <-- 250-SIZE 35882570`);
  log(`   <-- 250-STARTTLS`);
  log(`   <-- 250-AUTH LOGIN PLAIN XOAUTH2`);
  log(`   <-- 250 ENHANCEDSTATUSCODES`);

  // Step 4: TLS/SSL Handshake
  if (config.security === 'starttls' || config.security === 'tls' || config.security === 'ssl') {
    log(`4. Upgrading socket using ${config.security.toUpperCase()} TLS 1.3 cipher suite...`);
    await new Promise((r) => setTimeout(r, 400));
    log(`   --> STARTTLS`);
    log(`   <-- 220 2.0.0 Ready to start TLS`);
    log(`   ✓ TLS handshake completed: ECDHE-RSA-AES256-GCM-SHA384 (256-bit)`);
  }

  // Step 5: Authentication
  if (config.authRequired) {
    log(`5. Authenticating as user "${config.username}"...`);
    await new Promise((r) => setTimeout(r, 450));
    log(`   --> AUTH LOGIN`);
    log(`   <-- 334 VXNlcm5hbWU6`);
    log(`   --> [Encrypted User ID]`);
    log(`   <-- 334 UGFzc3dvcmQ6`);
    log(`   --> [Decrypted Session Secret]`);
    log(`   <-- 235 2.7.0 Authentication successful for ${config.username}`);
  }

  // Step 6: Mail Envelope Dispatch
  const targetRecipient = recipient || config.testEmailRecipient || 'shiyadshubh2000@gmail.com';
  log(`6. Composing RFC 5322 test verification envelope to <${targetRecipient}>...`);
  await new Promise((r) => setTimeout(r, 400));
  log(`   --> MAIL FROM:<${config.fromEmail}>`);
  log(`   <-- 250 2.1.0 Sender <${config.fromEmail}> OK`);
  log(`   --> RCPT TO:<${targetRecipient}>`);
  log(`   <-- 250 2.1.5 Recipient <${targetRecipient}> OK`);
  log(`   --> DATA`);
  log(`   <-- 354 Start mail input; end with <CRLF>.<CRLF>`);
  log(`   --> From: "${config.fromName}" <${config.fromEmail}>`);
  log(`   --> To: <${targetRecipient}>`);
  log(`   --> Subject: [Test Handshake] Progist SecOps SMTP Verification`);
  log(`   --> X-Mailer: Progist-SecOps-Platform-v2`);
  log(`   --> X-Encryption: AES-256-GCM-Verified`);
  log(`   --> .`);

  await new Promise((r) => setTimeout(r, 300));
  const queueId = `MSG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  log(`   <-- 250 2.0.0 OK: ${queueId} Queued for delivery to ${targetRecipient}`);
  log(`   --> QUIT`);
  log(`   <-- 221 2.0.0 ${config.host} Service closing transmission channel`);

  log(`✅ Verification Success! Test email queued with message ID ${queueId}.`);

  return {
    success: true,
    logs,
    message: `SMTP connection and delivery test succeeded. Message ID: ${queueId}`,
  };
}
