import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get configured Nodemailer transporter
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error('SMTP_HOST is not configured in environment variables. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS.');
  }

  const auth = user && pass ? { user, pass } : undefined;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  });
}

// 1. Check SMTP Configuration Status
app.get('/api/email/status', (req, res) => {
  const isConfigured = Boolean(process.env.SMTP_HOST);
  res.json({
    configured: isConfigured,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : null,
    hasAuth: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
  });
});

// 2. Verify SMTP Connection Test
app.post('/api/email/verify', async (req, res) => {
  try {
    if (!process.env.SMTP_HOST) {
      return res.status(400).json({
        success: false,
        error: 'SMTP_HOST is not configured in environment variables.',
      });
    }
    const transporter = getTransporter();
    await transporter.verify();
    res.json({
      success: true,
      message: 'SMTP server connection verified successfully!',
    });
  } catch (error: any) {
    console.error('SMTP Verify Error:', error);
    res.status(400).json({
      success: false,
      error: error?.message || 'Failed to connect to SMTP server. Please check your credentials.',
    });
  }
});

// 3. Send Email API Endpoint
app.post('/api/email/send', async (req, res) => {
  try {
    const { to, subject, text, html, cc, bcc, replyTo } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields: "to", "subject", and "text" or "html" content are required.',
      });
    }

    if (!process.env.SMTP_HOST) {
      return res.status(503).json({
        success: false,
        error: 'SMTP is not configured on the server. Please define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment variables.',
      });
    }

    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@cyberdrill.secops';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text: text || '',
      html: html || undefined,
    });

    console.log(`Email dispatched successfully to ${to} (Message ID: ${info.messageId})`);

    res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
      previewUrl: nodemailer.getTestMessageUrl(info) || null,
    });
  } catch (error: any) {
    console.error('Email Send Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to dispatch email through SMTP.',
    });
  }
});

// 4. Send Drill or Review Reminder with pre-built styling
app.post('/api/email/send-reminder', async (req, res) => {
  try {
    const { to, customerName, drillQuarter, drillType, dueDate, csmName, customNote, isOverdue } = req.body;

    if (!to || !customerName) {
      return res.status(400).json({
        success: false,
        error: 'Missing recipient email (to) or customerName.',
      });
    }

    if (!process.env.SMTP_HOST) {
      return res.status(503).json({
        success: false,
        error: 'SMTP is not configured on the server. Please define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment variables.',
      });
    }

    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'CyberDrill SecOps <no-reply@cyberdrill.secops>';

    const subject = isOverdue
      ? `[URGENT] Phishing Simulation Overdue Notice - ${customerName} (${drillQuarter || 'Drill'})`
      : `Upcoming Cyber Drill Reminder - ${customerName} (${drillQuarter || 'Scheduled Simulation'})`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: ${isOverdue ? '#e11d48' : '#0284c7'}; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em; }
    .content { padding: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #f1f5f9; color: #475569; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .footer { padding: 16px 24px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isOverdue ? '⚠️ Phishing Simulation Overdue Notice' : '🛡️ Cyber Drill Operational Notice'}</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${customerName} Security Team</strong>,</p>
      <p>This is a formal reminder regarding your cybersecurity awareness and phishing drill schedule:</p>
      <div class="card">
        <p style="margin: 0 0 8px 0;"><strong>Customer Account:</strong> ${customerName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Simulation Quarter:</strong> ${drillQuarter || 'Annual Plan'}</p>
        <p style="margin: 0 0 8px 0;"><strong>Drill Type:</strong> ${drillType || 'Phishing Simulation'}</p>
        <p style="margin: 0 0 8px 0;"><strong>Target Due Date:</strong> <span style="color: ${isOverdue ? '#e11d48' : '#0284c7'}; font-weight: bold;">${dueDate || 'Upcoming'}</span></p>
        ${csmName ? `<p style="margin: 0;"><strong>Assigned CSM:</strong> ${csmName}</p>` : ''}
      </div>
      ${customNote ? `<div style="padding: 12px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 16px 0; font-size: 13px;"><strong>Note from CSM:</strong><br>${customNote}</div>` : ''}
      <p style="font-size: 13px; color: #64748b;">Please coordinate with your Customer Success Manager or reply directly to this notice to ensure completion against compliance objectives.</p>
    </div>
    <div class="footer">
      Sent via CyberDrill Security Operations Center
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: `Reminder: ${customerName} Cyber Drill (${drillQuarter}) due on ${dueDate}. Assigned CSM: ${csmName || 'Operations Team'}. Note: ${customNote || 'None'}`,
      html: htmlContent,
    });

    res.json({
      success: true,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error: any) {
    console.error('Send Reminder Error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to dispatch reminder email.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CyberDrill Application Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
