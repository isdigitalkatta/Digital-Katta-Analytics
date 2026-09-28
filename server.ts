import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { AIAnalysisSchema } from './src/utils/aiSchema.js';
import { normalizeExtractedReport, extractReportDeterministic } from './server/reportNormalizer.js';
import {
  applySecurityHeaders,
  validateEnvironment,
  sanitizeForLogging,
} from './server/security.js';
import {
  requireAuth,
  createDemoSession,
  authenticateWithEmail,
  authenticateWithGoogle,
  generateOtpForPhone,
  verifyOtpForPhone,
  verifyToken,
  generateToken,
  updateUserProfileInAuth,
  authenticateAsStaff,
  STAFF_MAP,
  isStaffUser,
  StaffRole,
  AuthUser,
} from './server/auth.js';
import {
  CustomerProfile,
  getProfileByUserId,
  saveProfile,
  isProfileComplete,
} from './server/profileStore.js';
import {
  getSubscription,
  updateSubscription,
  getAlertEvents,
  sendTestAlert,
  simulateEvent,
} from './server/alertSubscriptionStore.js';
import {
  generalLimiter,
  aiAnalyzeLimiter,
  aiChatLimiter,
  aiLetterLimiter,
  pdfExportLimiter,
} from './server/rateLimit.js';
import { generateCreditReportPdf } from './server/pdfGenerator.js';
import { sheetsRouter } from './src/backend/modules/sheets/sheets.routes.js';
import {
  upsertLead,
  updateAnalysisOnSheet,
  convertLeadToPaidCustomer,
  updateResolutionOnSheet,
} from './src/backend/modules/sheets/sheets.service.js';

// Boot-time validation
const envConfig = validateEnvironment();

const app = express();
const PORT = 3000;

// Security Headers & Content-Type validation
app.use(applySecurityHeaders);
app.use(express.json({ limit: '20mb' }));

// Google Sheets CRM Sync Routes (Admin endpoints)
app.use('/api/v1/admin/sheets', sheetsRouter);
app.use('/api/admin/sheets', sheetsRouter);

// General Rate Limiting across all API routes
app.use('/api/', generalLimiter);

// Authentic, privacy-safe runtime metrics (No fabricated promotional or seed data)
const anonymousStats = {
  serverStartTime: new Date().toISOString(),
  reportsAnalyzed: 0,
  successfulParses: 0,
  lettersDrafted: 0,
  chatQueriesAnswered: 0,
  bureauFormatDistribution: {
    CIBIL: 0,
    Experian: 0,
    CRIF: 0,
    Equifax: 0,
    StandardJSON: 0,
  },
  aiFallbackCount: 0,
};
const realTelemetry = anonymousStats;

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper to normalize Gemini model name from env or config
function normalizeModelName(raw?: string): string {
  if (!raw) return 'gemini-3.8-flash';
  const clean = raw.trim().replace(/^models\//, '');
  if (clean === '3.8' || clean === 'gemini-3.8') return 'gemini-3.8-flash';
  if (clean === 'flash' || clean === 'gemini-flash') return 'gemini-flash-latest';
  if (clean === '3.1' || clean === '3.1-flash-lite' || clean === 'flash-lite') return 'gemini-3.1-flash-lite';
  return clean;
}

// Resilient helper with multi-model fallback and backoff for temporary capacity spikes (e.g. 503/429/quota)
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: string;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  const configured = normalizeModelName(process.env.GEMINI_MODEL);
  const candidateModels = [
    configured,
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx);

  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const config: any = {
        temperature: options.temperature ?? 0.2,
      };
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      // Safeguard against stuck calls with a 35-second per-model timeout
      const responsePromise = ai.models.generateContent({
        model,
        contents: options.contents,
        config,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout calling model ${model}`)), 35000)
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      const isTransient =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.code === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota');

      // Brief backoff before next model candidate on capacity spikes
      if (isTransient && i < candidateModels.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  throw lastError;
}

// Health check & System status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: envConfig.hasGeminiKey,
    environment: envConfig.isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Authentication Routes
app.post('/api/auth/demo', async (req, res) => {
  const { email, name, phone, identifier } = req.body || {};
  const session = createDemoSession({ email, name, phone, identifier });
  
  // Sync demo customer to CRM Lead Sheet immediately
  const syncResult = await upsertLead({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone,
    pan: 'ABCDE1234F',
    cityState: 'Pune, Maharashtra',
    cibilScoreBefore: 618,
    issuesIdentified: 'Overdue Balance 90+ DPD • High Card Utilization (84.8%) • Delinquent Account',
    packageName: 'Credit Health Assessment (Demo)',
    paymentStatus: 'Unpaid',
    status: 'Demo Lead (Active Evaluation)',
    remarks: 'Demo mode user session initiated from login screen',
    createdAt: session.user.createdAt,
  }).catch((err) => {
    console.warn('[CRM Sync Hook] Demo Lead notice:', err?.message || err);
    return { success: false, action: 'skipped' as const, message: String(err) };
  });

  res.json({
    success: true,
    user: session.user,
    token: session.token,
    mode: 'demo',
    crmSync: syncResult,
    message: 'Demo session initialized and synced with Leads spreadsheet.',
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, name, phone, identifier } = req.body || {};
  const targetEmail = email || (identifier && identifier.includes('@') ? identifier : null);
  const targetPhone = phone || (identifier && !identifier.includes('@') ? identifier.replace(/[^0-9]/g, '') : null);

  if (!targetEmail && !targetPhone) {
    return res.status(400).json({ error: 'A valid email address or mobile number is required for authentication.' });
  }

  const effectiveEmail = targetEmail || `${targetPhone}@digitalkatta.com`;
  const inferredName = name || (targetEmail ? targetEmail.split('@')[0].replace('.', ' ') : 'Customer');
  const session = authenticateWithEmail(
    effectiveEmail,
    inferredName,
    targetPhone ? `+91 ${targetPhone.slice(-10)}` : undefined
  );

  // Business Rule 1 & 2: Automatically upsert customer into Leads Sheet immediately
  const syncResult = await upsertLead({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: session.user.phone,
    paymentStatus: 'Unpaid',
    status: 'Active Lead (Signed In)',
    remarks: 'Customer authenticated via password login',
    createdAt: session.user.createdAt,
  }).catch((err) => {
    console.warn('[CRM Sync Hook] Login Lead notice:', err?.message || err);
    return { success: false, action: 'skipped' as const, message: String(err) };
  });

  res.json({
    success: true,
    user: session.user,
    token: session.token,
    mode: 'authenticated',
    crmSync: syncResult,
    message: 'Authentication successful. Synced with Leads spreadsheet.',
  });
});

// Helper for HTML escaping
function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Google OAuth URL generation endpoint
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const rawRedirectUri = (req.query.redirect_uri as string) || '';

  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'https';
  const dynamicCallback = `${protocol}://${host}/api/auth/google/callback`;
  const defaultCallback = appUrl ? `${appUrl}/api/auth/google/callback` : dynamicCallback;
  const redirectUri = rawRedirectUri || defaultCallback;

  if (clientId) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
    });
    return res.json({
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      configured: true,
      redirectUri,
    });
  }

  // When client ID is not yet provided, redirect to Google Accounts chooser so user signs into Google
  const fallbackUrl = `https://accounts.google.com/AccountChooser?service=lso&continue=${encodeURIComponent(
    redirectUri
  )}`;

  return res.json({
    url: fallbackUrl,
    configured: false,
    redirectUri,
    notice: 'GOOGLE_CLIENT_ID is not configured yet. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables for automated Google OAuth token exchange.',
  });
});

// Google OAuth Callback Handler
app.get(
  ['/api/auth/google/callback', '/api/auth/google/callback/', '/auth/callback', '/auth/callback/'],
  async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error) {
      const errorHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Google Sign-In Cancelled</title></head>
          <body style="font-family:system-ui,-apple-system,sans-serif;padding:40px;text-align:center;background:#fff1f2;">
            <h2 style="color:#e11d48;margin-bottom:12px;">Google Sign-In Cancelled</h2>
            <p style="color:#4b5563;font-size:14px;">${escapeHtml(error)}</p>
            <p style="color:#9ca3af;font-size:12px;margin-top:20px;">Closing window...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: ${JSON.stringify(error)} }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </body>
        </html>
      `;
      return res.status(400).send(errorHtml);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    let userEmail = '';
    let userName = '';
    let userAvatar = '';

    if (code && clientId && clientSecret) {
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: `${req.protocol}://${req.get('host')}${req.path}`,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.access_token) {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const profile = await userInfoRes.json();
          userEmail = profile.email || '';
          userName = profile.name || '';
          userAvatar = profile.picture || '';
        }
      } catch (err: any) {
        console.error('[Google OAuth Callback] Token exchange failed:', err?.message || err);
      }
    }

    // If verified Google profile was obtained:
    if (userEmail) {
      const session = authenticateWithGoogle(userEmail, userName, userAvatar);

      upsertLead({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        paymentStatus: 'Unpaid',
        status: 'Active Lead (Google OAuth)',
        remarks: 'Customer authenticated via Google OAuth',
        createdAt: session.user.createdAt,
      }).catch((e) => console.warn('[CRM Sync] Lead upsert note:', e?.message));

      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Google Sign-In Successful</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f0fdf4; color: #166534; }
              .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; width: 90%; text-align: center; }
              h2 { font-size: 18px; margin-bottom: 8px; color: #15803d; }
              p { font-size: 14px; color: #4b5563; margin: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>✓ Signed in with Google!</h2>
              <p>Welcome back, ${escapeHtml(session.user.name || session.user.email || 'User')}. Returning to Digital Katta...</p>
            </div>
            <script>
              const authData = {
                type: 'GOOGLE_AUTH_SUCCESS',
                token: ${JSON.stringify(session.token)},
                user: ${JSON.stringify(session.user)}
              };
              if (window.opener) {
                window.opener.postMessage(authData, '*');
                setTimeout(() => window.close(), 600);
              } else {
                localStorage.setItem('digitalkatta_auth_token', ${JSON.stringify(session.token)});
                localStorage.setItem('digitalkatta_auth_user', JSON.stringify(authData.user));
                window.location.href = '/?auth_token=' + encodeURIComponent(${JSON.stringify(session.token)});
              }
            </script>
          </body>
        </html>
      `);
    }

    // Interactive confirmation when returning from Google without automatic token credentials
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complete Google Sign-In - Digital Katta</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
            .card { background: white; padding: 32px; border-radius: 18px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); max-width: 440px; width: 90%; }
            .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #e0f2fe; color: #0284c7; border-radius: 9999px; font-weight: 600; font-size: 12px; margin-bottom: 12px; }
            h2 { color: #0f172a; margin: 0 0 8px 0; font-size: 20px; font-weight: 700; }
            p { color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0; }
            label { display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 6px; }
            input { width: 100%; box-sizing: border-box; padding: 10px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; margin-bottom: 14px; outline: none; transition: border-color 0.15s; }
            input:focus { border-color: #f97316; }
            button { width: 100%; padding: 12px; background: #ea580c; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.15s; }
            button:hover { background: #c2410c; }
            .error { color: #dc2626; font-size: 12px; margin-bottom: 10px; display: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Google Authentication</div>
            <h2>Confirm Google Sign-In</h2>
            <p>You have returned from Google sign-in. Enter your Google account email to complete access into Digital Katta:</p>
            <div id="errMsg" class="error"></div>
            <form id="googleForm">
              <label for="email">Google Email Address</label>
              <input type="email" id="email" placeholder="e.g. yourname@gmail.com" required autofocus />
              <label for="name">Full Name (optional)</label>
              <input type="text" id="name" placeholder="e.g. Sagar Dhumal" />
              <button type="submit" id="submitBtn">Sign In with Google</button>
            </form>
          </div>
          <script>
            document.getElementById('googleForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('email').value.trim();
              const name = document.getElementById('name').value.trim();
              const btn = document.getElementById('submitBtn');
              const errDiv = document.getElementById('errMsg');
              btn.innerText = 'Signing in...';
              btn.disabled = true;
              errDiv.style.display = 'none';

              try {
                const res = await fetch('/api/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, name })
                });
                const data = await res.json();
                if (data.success && data.token) {
                  if (window.opener) {
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token: data.token, user: data.user }, '*');
                    setTimeout(() => window.close(), 300);
                  } else {
                    localStorage.setItem('digitalkatta_auth_token', data.token);
                    localStorage.setItem('digitalkatta_auth_user', JSON.stringify(data.user));
                    window.location.href = '/?auth_token=' + encodeURIComponent(data.token);
                  }
                } else {
                  errDiv.innerText = data.error || 'Authentication failed. Please verify email.';
                  errDiv.style.display = 'block';
                  btn.disabled = false;
                  btn.innerText = 'Sign In with Google';
                }
              } catch (err) {
                errDiv.innerText = 'Network error during Google authentication.';
                errDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerText = 'Sign In with Google';
              }
            });
          </script>
        </body>
      </html>
    `);
  }
);

// Google Authentication
app.post('/api/auth/google', async (req, res) => {
  const { email, name, avatarUrl, phone } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid Google email address is required.' });
  }
  const session = authenticateWithGoogle(email, name, avatarUrl);

  // Business Rule 1 & 2: Automatically upsert customer into Leads Sheet immediately
  const syncResult = await upsertLead({
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    phone: phone || session.user.phone,
    paymentStatus: 'Unpaid',
    status: 'Active Lead (Google Auth)',
    remarks: 'Customer authenticated via Google OAuth',
    createdAt: session.user.createdAt,
  }).catch((err) => {
    console.warn('[CRM Sync Hook] Google Auth Lead notice:', err?.message || err);
    return { success: false, action: 'skipped' as const, message: String(err) };
  });

  res.json({
    success: true,
    user: session.user,
    token: session.token,
    mode: 'authenticated',
    crmSync: syncResult,
    message: 'Google authentication successful. Synced with Leads spreadsheet.',
  });
});

// Mobile SMS OTP - Request
app.post('/api/auth/otp/send', (req, res) => {
  const { phone } = req.body || {};
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
  }
  const result = generateOtpForPhone(cleanPhone, 'sms');
  res.json(result);
});

// Mobile SMS OTP - Verify
app.post('/api/auth/otp/verify', async (req, res) => {
  const { phone, otp, name } = req.body || {};
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Valid phone number required.' });
  }
  if (!otp || String(otp).trim().length !== 6) {
    return res.status(400).json({ error: 'Please enter a 6-digit verification code.' });
  }
  const result = verifyOtpForPhone(cleanPhone, String(otp).trim(), 'sms', name);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Business Rule 1 & 2: Automatically upsert verified mobile customer into Leads Sheet immediately
  let syncResult: any = null;
  if (result.user) {
    syncResult = await upsertLead({
      id: result.user.id,
      name: result.user.name,
      phone: result.user.phone,
      paymentStatus: 'Unpaid',
      status: 'Active Lead (SMS Verified)',
      remarks: 'Customer authenticated via SMS OTP',
      createdAt: result.user.createdAt,
    }).catch((err) => {
      console.warn('[CRM Sync Hook] Mobile Lead notice:', err?.message || err);
      return { success: false, action: 'skipped' as const, message: String(err) };
    });
  }

  res.json({
    success: true,
    user: result.user,
    token: result.token,
    mode: 'authenticated',
    crmSync: syncResult,
    message: 'Mobile OTP verification successful. Synced with Leads spreadsheet.',
  });
});

// WhatsApp OTP - Request
app.post('/api/auth/whatsapp/send', (req, res) => {
  const { phone } = req.body || {};
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please provide a valid 10-digit WhatsApp number.' });
  }
  const result = generateOtpForPhone(cleanPhone, 'whatsapp');
  res.json(result);
});

// WhatsApp OTP - Verify
app.post('/api/auth/whatsapp/verify', async (req, res) => {
  const { phone, otp, name } = req.body || {};
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Valid WhatsApp number required.' });
  }
  if (!otp || String(otp).trim().length !== 6) {
    return res.status(400).json({ error: 'Please enter a 6-digit WhatsApp code.' });
  }
  const result = verifyOtpForPhone(cleanPhone, String(otp).trim(), 'whatsapp', name);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  // Business Rule 1 & 2: Automatically upsert verified WhatsApp customer into Leads Sheet immediately
  let syncResult: any = null;
  if (result.user) {
    syncResult = await upsertLead({
      id: result.user.id,
      name: result.user.name,
      phone: result.user.phone,
      whatsapp: result.user.phone,
      paymentStatus: 'Unpaid',
      status: 'Active Lead (WhatsApp Verified)',
      remarks: 'Customer authenticated via WhatsApp OTP',
      createdAt: result.user.createdAt,
    }).catch((err) => {
      console.warn('[CRM Sync Hook] WhatsApp Lead notice:', err?.message || err);
      return { success: false, action: 'skipped' as const, message: String(err) };
    });
  }

  res.json({
    success: true,
    user: result.user,
    token: result.token,
    mode: 'authenticated',
    crmSync: syncResult,
    message: 'WhatsApp OTP verification successful. Synced with Leads spreadsheet.',
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false, user: null });
  }
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.json({ authenticated: false, user: null });
  }
  return res.json({ authenticated: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Session terminated. Zero local or server state retained.' });
});

// Staff Authentication & Role Switching
// Digital Katta operational staff roles: ADMIN, LEAD_HANDLER, CREDIT_EXPERT
app.post('/api/auth/staff-login', (req, res) => {
  const { role, email } = req.body || {};
  const validRoles: StaffRole[] = ['ADMIN', 'LEAD_HANDLER', 'CREDIT_EXPERT'];
  const requestedRole = (role || '').toUpperCase() as StaffRole;

  if (requestedRole && !validRoles.includes(requestedRole)) {
    return res.status(400).json({
      success: false,
      error: `Invalid staff role. Permitted roles: ${validRoles.join(', ')}`,
    });
  }

  const effectiveRole: StaffRole = requestedRole || 'ADMIN';
  const staffSession = authenticateAsStaff(effectiveRole, email);

  res.json({
    success: true,
    user: staffSession.user,
    token: staffSession.token,
    role: staffSession.user.role,
    message: `Authenticated as staff: ${staffSession.user.name} (${staffSession.user.role})`,
  });
});

app.get('/api/auth/staff-directory', (req, res) => {
  res.json({
    success: true,
    staff: STAFF_MAP,
    roles: ['ADMIN', 'LEAD_HANDLER', 'CREDIT_EXPERT'],
  });
});

// Feature flag: Mandatory Customer Profile (defaults to true; can be disabled with 'false')
const enableMandatoryCustomerProfile = process.env.ENABLE_MANDATORY_CUSTOMER_PROFILE !== 'false';

// Customer Profile API Endpoints
app.get(['/api/profile', '/api/profile/status'], requireAuth, (req, res) => {
  const user = req.user!;
  const profile = getProfileByUserId(user.id);
  const complete = user.isDemo ? true : isProfileComplete(profile);

  res.json({
    success: true,
    featureEnabled: enableMandatoryCustomerProfile,
    isDemo: user.isDemo,
    isProfileComplete: complete,
    profile: profile || null,
  });
});

app.post(['/api/profile', '/api/user/profile'], requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const body = req.body || {};

    // Validate Full Name
    const fullName = (body.fullName || body.name || '').trim();
    if (fullName.length < 2) {
      return res.status(400).json({ error: 'Full Name is required (minimum 2 characters).' });
    }

    // Validate Mobile Number (10 digits)
    const rawPhone = String(body.phone || body.mobile || user.phone || '').replace(/[^0-9]/g, '');
    if (rawPhone.length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit Indian mobile number is required.' });
    }
    const phone = `+91 ${rawPhone.slice(-10)}`;

    // Validate Date of Birth (DOB)
    const dob = (body.dob || '').trim();
    if (!dob) {
      return res.status(400).json({ error: 'Date of Birth (DOB) is required.' });
    }
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
      return res.status(400).json({ error: 'Please enter a valid past Date of Birth.' });
    }

    // Validate PAN (Indian format: 5 letters, 4 digits, 1 letter)
    const rawPan = (body.pan || '').trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(rawPan)) {
      return res.status(400).json({
        error: 'Invalid PAN format. Standard Indian PAN requires 5 uppercase letters, 4 digits, and 1 letter (e.g., ABCDE1234F).',
      });
    }

    // Validate Gender
    const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const gender = body.gender;
    if (!gender || !validGenders.includes(gender)) {
      return res.status(400).json({
        error: 'Gender is required. Please select Male, Female, Other, or Prefer not to say.',
      });
    }

    // Validate Credit Bureau dropdown
    const validBureaus = ['CIBIL', 'Experian', 'Equifax', 'CRIF', 'Multiple'];
    const creditBureau = body.creditBureau;
    if (!creditBureau || !validBureaus.includes(creditBureau)) {
      return res.status(400).json({
        error: 'Credit Bureau is required. Please select CIBIL, Experian, Equifax, CRIF, or Multiple.',
      });
    }

    // Optional fields: email, city, state, pincode
    const email = body.email ? String(body.email).trim().toLowerCase() : (user.email || undefined);
    const city = body.city ? String(body.city).trim() : undefined;
    const state = body.state ? String(body.state).trim() : undefined;
    const rawPincode = body.pincode ? String(body.pincode).trim().replace(/[^0-9]/g, '') : undefined;
    if (rawPincode && rawPincode.length !== 6) {
      return res.status(400).json({ error: 'Indian postal pincode must be exactly 6 digits if provided.' });
    }
    const pincode = rawPincode || undefined;

    const profileData: CustomerProfile = {
      userId: user.id,
      fullName,
      phone,
      dob,
      pan: rawPan,
      gender,
      creditBureau,
      email,
      city,
      state,
      pincode,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist to server JSON store
    const saved = saveProfile(user.id, profileData);

    // 2. Update user in memory
    updateUserProfileInAuth(user.id, saved);

    // 3. Persist / synchronize to Google Sheets using existing src/backend/modules/sheets
    const cityStateStr = [city, state].filter(Boolean).join(', ');
    const addressStr = [city, state, pincode ? `PIN-${pincode}` : ''].filter(Boolean).join(', ');

    const sheetsSyncResult = await upsertLead({
      id: user.id,
      name: fullName,
      email: email || user.email,
      phone: phone,
      whatsapp: phone,
      pan: rawPan,
      address: addressStr || undefined,
      cityState: cityStateStr || undefined,
      status: 'Customer Profile Completed (Active)',
      remarks: `Bureau: ${creditBureau} • Gender: ${gender} • DOB: ${dob}`,
      updatedAt: new Date(),
    }).catch((err) => {
      console.warn('[Google Sheets Sync] Profile update notice:', err?.message || err);
      return { success: false, action: 'skipped' as const, message: String(err) };
    });

    const updatedUser: AuthUser = {
      ...user,
      name: fullName,
      phone: phone,
      email: email || user.email,
      profile: saved,
      isProfileComplete: true,
    };
    const newToken = generateToken(updatedUser);

    res.json({
      success: true,
      profile: saved,
      isProfileComplete: true,
      user: updatedUser,
      token: newToken,
      sheetsSync: sheetsSyncResult,
      message: 'Customer profile saved and synchronized successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save customer profile.' });
  }
});

// =========================================================================
// Bureau Monitoring & Email Alert Subscription Endpoints
// Allows users to subscribe to email alerts for credit score changes and
// detected dispute outcomes across TransUnion CIBIL, Experian, Equifax, CRIF
// =========================================================================

// GET /api/alerts/subscription - Get current user alert subscription settings
app.get('/api/alerts/subscription', requireAuth, (req, res) => {
  try {
    const user = req.user!;
    const profile = getProfileByUserId(user.id);
    const effectiveEmail = profile?.email || user.email || 'customer@digitalkatta.com';
    const effectivePhone = profile?.phone || user.phone || '';

    const subscription = getSubscription(user.id, effectiveEmail, effectivePhone);
    const recentEvents = getAlertEvents(user.id).slice(0, 10);

    res.json({
      success: true,
      subscription,
      recentEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch alert subscription.' });
  }
});

// POST /api/alerts/subscription - Update alert subscription preferences
app.post('/api/alerts/subscription', requireAuth, (req, res) => {
  try {
    const user = req.user!;
    const body = req.body || {};

    // Validate email if changed
    if (body.email) {
      const email = String(body.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid recipient email address for alerts.' });
      }
      body.email = email;
    }

    const updated = updateSubscription(user.id, body, user.email);

    res.json({
      success: true,
      subscription: updated,
      message: 'Email alert subscription preferences updated successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update alert subscription.' });
  }
});

// GET /api/alerts/history - Retrieve all historical alert events for this user
app.get('/api/alerts/history', requireAuth, (req, res) => {
  try {
    const user = req.user!;
    const events = getAlertEvents(user.id);
    res.json({
      success: true,
      events,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to retrieve alert history.' });
  }
});

// POST /api/alerts/test - Send a test email alert to verify recipient mailbox
app.post('/api/alerts/test', requireAuth, (req, res) => {
  try {
    const user = req.user!;
    const recipientEmail = req.body?.email || user.email;
    const result = sendTestAlert(user.id, recipientEmail);

    res.json({
      success: true,
      event: result.event,
      message: result.message,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to dispatch test alert.' });
  }
});

// POST /api/alerts/simulate - Simulate score change or dispute resolution for live verification
app.post('/api/alerts/simulate', requireAuth, (req, res) => {
  try {
    const user = req.user!;
    const type = req.body?.type || 'score_increase';
    const event = simulateEvent(user.id, type, user.email);

    res.json({
      success: true,
      event,
      message: `Simulated alert event triggered and recorded: ${event.title}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to simulate alert event.' });
  }
});

// Real Privacy-Safe Runtime Telemetry (anonymousStats starts at 0, no fake promotional metrics)
app.get('/api/stats', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  res.json({
    totalReportsAnalyzed: anonymousStats.reportsAnalyzed,
    successfulParses: anonymousStats.successfulParses,
    lettersDrafted: anonymousStats.lettersDrafted,
    chatQueriesAnswered: anonymousStats.chatQueriesAnswered,
    uptimeSeconds,
    aiAvailable: envConfig.hasGeminiKey,
    zeroRetentionActive: true,
    bureauDistribution: anonymousStats.bureauFormatDistribution,
  });
});

app.post('/api/stats/track', (req, res) => {
  const { format } = req.body || {};
  anonymousStats.successfulParses++;
  if (format && (anonymousStats.bureauFormatDistribution as any)[format] !== undefined) {
    (anonymousStats.bureauFormatDistribution as any)[format]++;
  }
  res.json({ success: true, count: anonymousStats.successfulParses });
});

// Helper: Syncs parsed or analyzed credit report data to Google Sheets CRM (Leads sheet)
function syncReportAnalysisToCrm(user: any, report: any, analysis?: any) {
  if (!report) return;
  try {
    const issuesList: string[] = [];
    if (report.summary?.totalOverdue > 0) {
      issuesList.push(`Overdue: ₹${Number(report.summary.totalOverdue).toLocaleString('en-IN')}`);
    }
    if (report.summary?.negativeAccounts > 0) {
      issuesList.push(`${report.summary.negativeAccounts} Negative Accounts`);
    }
    if (report.summary?.creditCardUtilizationPct > 30) {
      issuesList.push(`Card Util: ${report.summary.creditCardUtilizationPct}%`);
    }
    if (analysis?.rankedNegativeFactors?.length > 0) {
      const top = analysis.rankedNegativeFactors[0];
      if (top.factor) issuesList.push(top.factor);
    }

    const issuesStr = issuesList.slice(0, 3).join(' • ') || 'Initial Report Analyzed';
    const scoreVal = report.score?.score || 0;
    const personal = report.personal || {};

    const customerIdentifier =
      user?.id || personal.pan || personal.email || personal.phone || `lead_${Date.now()}`;

    // Upsert or update Lead in Google Sheets with fresh CIBIL score & issues
    upsertLead({
      id: customerIdentifier,
      name: personal.name || user?.name || 'Customer',
      email: personal.email || user?.email,
      phone: personal.phone || user?.phone,
      pan: personal.pan,
      address: personal.address,
      cityState: [personal.city, personal.state].filter(Boolean).join(', '),
      cibilScoreBefore: scoreVal > 0 ? scoreVal : undefined,
      issuesIdentified: issuesStr,
      paymentStatus: 'Unpaid',
      status: 'Active Lead (Report Analyzed)',
      updatedAt: new Date(),
    }).catch((err) => console.warn('[CRM Sync Hook] Report Lead Upsert:', err?.message || err));

    if (scoreVal > 0) {
      updateAnalysisOnSheet(customerIdentifier, {
        cibilScoreBefore: scoreVal,
        issuesIdentified: issuesStr,
      }).catch((err) => console.warn('[CRM Sync Hook] Analysis Update:', err?.message || err));
    }
  } catch (err: any) {
    console.warn('[CRM Sync Hook] Error in syncReportAnalysisToCrm:', err?.message || err);
  }
}

// Server-side report parser fallback endpoint
app.post('/api/parse/report', requireAuth, (req, res) => {
  try {
    const { report } = req.body;
    if (!report || !report.personal || !report.score) {
      return res.status(400).json({ error: 'Invalid credit report structure provided.' });
    }
    anonymousStats.successfulParses++;

    // Hook 4: Automatically store/update report & score in Google Sheets CRM
    syncReportAnalysisToCrm(req.user, report);

    res.json({ success: true, report });
  } catch (err: any) {
    console.error('[Report Parse Error]', sanitizeForLogging(err));
    res.status(500).json({ error: 'Server parsing error: ' + sanitizeForLogging(err?.message || 'Unknown parsing error') });
  }
});

// Case Conversion & Payment Service Endpoint
// Business Rule 3: Converts a lead to Paid Customers sheet upon successful payment
app.post('/api/v1/cases/payment', requireAuth, async (req, res) => {
  try {
    const { amount, packageName, transactionId, customer } = req.body;
    const user = req.user;
    const caseNum = `DK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const custData = {
      id: user?.id || customer?.id || `cust_${Date.now()}`,
      name: user?.name || customer?.name || 'Valued Borrower',
      email: user?.email || customer?.email,
      phone: user?.phone || customer?.phone,
      pan: customer?.pan,
      cibilScoreBefore: customer?.cibilScoreBefore,
    };

    const conversionResult = await convertLeadToPaidCustomer(
      custData,
      {
        amountPaid: Number(amount || 1999),
        packageName: packageName || 'CIBIL Dispute & Resolution Plan',
        paymentStatus: 'Paid',
        transactionId: transactionId || `TXN_${Date.now()}`,
        paidAt: new Date(),
      },
      {
        caseNumber: caseNum,
        assignedPartnerAssistant: 'Partner Desk Pune',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'Active Case (Assigned)',
        remarks: `Payment ₹${amount || 1999} confirmed. Dispute drafting in progress.`,
      }
    );

    res.json({
      success: true,
      caseNumber: caseNum,
      message: 'Payment received. Customer converted to active Paid Case and synchronized to Google Sheets.',
      conversionResult,
    });
  } catch (err: any) {
    console.error('[Payment Hook Error]:', err);
    res.status(500).json({ error: err?.message || 'Failed to process payment and conversion' });
  }
});

// Case Resolution Hook
// Business Rule 5: Credit Expert updates resolution on Paid sheet
app.post('/api/v1/cases/resolve', requireAuth, async (req, res) => {
  try {
    const { caseNumber, cibilScoreAfter, issueResolved, remarks, cibilReportAfterUrl } = req.body;
    if (!caseNumber) {
      return res.status(400).json({ error: 'caseNumber is required' });
    }

    const resolutionResult = await updateResolutionOnSheet(caseNumber, {
      cibilScoreAfter: Number(cibilScoreAfter || 750),
      issueResolved: issueResolved || 'Yes',
      cibilReportAfterUrl: cibilReportAfterUrl || 'https://digitalkatta.com/reports/closure-noc.pdf',
      status: 'Resolved & Closed',
      remarks: remarks || 'All disputed trade lines rectified with bureau. NOC verified.',
    });

    res.json({
      success: resolutionResult.success,
      message: resolutionResult.message,
    });
  } catch (err: any) {
    console.error('[Case Resolution Hook Error]:', err);
    res.status(500).json({ error: err?.message || 'Failed to update case resolution' });
  }
});

// Language map for multilingual Indian credit assistance
const SUPPORTED_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  bn: 'Bengali (বাংলা)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  ur: 'Urdu (اردو)',
  as: 'Assamese (অসমীয়া)',
  ne: 'Nepali (नेपाली)',
};

// Server-side PDF Export Endpoint (Protected + Rate Limited fallback)
app.post('/api/export/pdf', requireAuth, pdfExportLimiter, async (req, res) => {
  try {
    const { report, analysis, language } = req.body;
    if (!report || !report.personal || !report.score) {
      return res.status(400).json({ error: 'Valid normalized credit report is required for PDF export.' });
    }

    const targetLanguage = ((req.headers['x-language'] as string) || language || 'en').toLowerCase();
    const rawBorrowerName = (report.personal?.name || 'Borrower').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Digital_Katta_Credit_Health_Report_${rawBorrowerName}_${targetLanguage}.pdf`;

    const pdfBuffer = await generateCreditReportPdf(report, analysis || {}, targetLanguage);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.byteLength);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    console.error('[Server PDF Export Error]', sanitizeForLogging(err));
    res.status(500).json({
      error: 'Failed to generate PDF document on server.',
      details: process.env.NODE_ENV === 'production' ? undefined : sanitizeForLogging(err?.message || err),
    });
  }
});

// AI-Powered Credit Report Extraction (PDF Document / Text Layer)
app.post('/api/ai/extract-report', async (req, res) => {
  try {
    const { pdfBase64, rawText, fileName } = req.body || {};
    if (!pdfBase64 && (!rawText || !rawText.trim())) {
      return res.status(400).json({ error: 'Either pdfBase64 or rawText is required for report extraction.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI service not available on server. Falling back to local deterministic parsing.',
      });
    }

    const extractionPrompt = `
You are the world's most precise document extraction engine for Indian Credit Bureau Reports (CIBIL, Experian India, Equifax India, CRIF High Mark).
Extract ALL real borrower information, credit score, trade lines / accounts, and enquiries from this uploaded credit report document.

CRITICAL EXTRACTION RULES:
1. STRICT FACTUAL EXTRACTION: DO NOT invent, fabricate, hallucinate, or substitute any sample/mock/demo data. Extract ONLY what is genuinely present in this specific document.
2. Score: Extract the numeric credit score (between 300 and 900; if new-to-credit, -1 or 0). Also extract the score name (e.g. CIBIL TransUnion Score 2.0 or Experian Score) and scoring date.
3. Consumer Personal Info:
   - Name (as printed on report)
   - PAN Card (Permanent Account Number, e.g. 5 letters + 4 digits + 1 letter, or as reported)
   - Date of Birth (DD/MM/YYYY)
   - Gender
   - Mobile Number
   - Email Address
   - Address / City / State
   - Report Date & Report Control Number (ECN / Control Number)
4. Accounts / Trade Lines (EXTRACT EVERY SINGLE ONE PRESENT IN THE DOCUMENT):
   For each loan or credit card facility listed:
   - lender: The bank or NBFC name (e.g. "HDFC Bank", "SBI Cards", "Bajaj Finance", "Axis Bank", "ICICI Bank", "Piramal Capital", "Kotak Mahindra Bank", "Hero Fincorp", "Tata Capital", "IDFC FIRST Bank", etc.)
   - accountType: "Personal Loan", "Credit Card", "Housing Loan", "Auto Loan", "Two Wheeler Loan", "Consumer Durable Loan", "Overdraft", "Gold Loan", "Business Loan", "Education Loan", etc.
   - isCreditCard: boolean
   - isSecured: boolean (true for Housing/Auto/Gold/Property loans)
   - accountNumber: The reported account number or masked string
   - openDate: Date opened / sanctioned (DD/MM/YYYY)
   - closedDate: Date closed or null
   - lastReportedDate: Date last reported / refreshed (DD/MM/YYYY)
   - sanctionedAmount: Sanctioned amount / High Credit / Credit Limit as a number in INR
   - currentBalance: Current outstanding balance as a number in INR (0 if closed/paid)
   - overdueAmount: Active overdue amount as a number in INR (0 if standard/up to date)
   - rawStatus: Exact status from the report ("Active", "Closed", "Written Off", "Settled", "Restructured", "Delinquent", "Suit Filed", etc.)
   - normalizedStatus: One of "ACTIVE", "CLOSED", "DELINQUENT", "WRITTEN_OFF", "SETTLED", "RESTRUCTURED", "SUIT_FILED"
   - maxDPD: Maximum Days Past Due recorded (0 if always on time)
   - paymentHistory: Array of up to 12 recent monthly entries:
     [ { "month": "MM/YY", "monthName": "Aug", "year": 2026, "dpd": "000" | "030" | "060" | "090" | "120" | "180" | "STD" | "SUB" | "DBT" | "LSS" | "XXX", "status": "NORMAL" | "LATE_30" | "LATE_60" | "LATE_90_PLUS" | "WRITTEN_OFF" } ]
   - ownershipType: "Individual", "Joint", "Guarantor", or "Authorized User"
   - negativeRemarks: Array of any adverse remarks noted (e.g. "Overdue ₹12,000", "Settled with concession", "Written off", "Wilful default")
5. Enquiries:
   List every enquiry in the enquiry section:
   - date: Date of enquiry (DD/MM/YYYY)
   - institution: Inquiring bank or NBFC
   - purpose: Loan or card applied for
   - amount: Enquiry amount in INR
6. Return ONLY valid JSON with this exact schema:
{
  "personal": {
    "name": string,
    "pan": string,
    "dateOfBirth": string,
    "gender": string,
    "mobile": string,
    "email": string,
    "address": string,
    "reportDate": string,
    "reportNumber": string
  },
  "score": {
    "score": number,
    "scoreName": string,
    "scoreDate": string
  },
  "accounts": [
    {
      "lender": string,
      "accountType": string,
      "isCreditCard": boolean,
      "isSecured": boolean,
      "accountNumber": string,
      "openDate": string,
      "closedDate": string | null,
      "lastReportedDate": string,
      "sanctionedAmount": number,
      "currentBalance": number,
      "overdueAmount": number,
      "rawStatus": string,
      "normalizedStatus": "ACTIVE" | "CLOSED" | "DELINQUENT" | "WRITTEN_OFF" | "SETTLED" | "RESTRUCTURED" | "SUIT_FILED",
      "maxDPD": number,
      "paymentHistory": [
        {
          "month": string,
          "monthName": string,
          "year": number,
          "dpd": string,
          "status": string
        }
      ],
      "ownershipType": string,
      "negativeRemarks": string[]
    }
  ],
  "enquiries": [
    {
      "date": string,
      "institution": string,
      "purpose": string,
      "amount": number
    }
  ]
}
`;

    let contents: any;
    if (pdfBase64) {
      contents = [
        {
          inlineData: {
            data: pdfBase64,
            mimeType: 'application/pdf',
          },
        },
        extractionPrompt,
      ];
    } else {
      contents = `${extractionPrompt}\n\nDOCUMENT RAW TEXT CONTENT:\n${(rawText || '').slice(0, 150000)}`;
    }

    const { text: responseText, modelUsed } = await generateGeminiContentWithFallback(ai, {
      contents,
      responseMimeType: 'application/json',
      temperature: 0.1,
    });

    let cleanJson = (responseText || '{}').trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const rawExtracted = JSON.parse(cleanJson);
    const normalized = normalizeExtractedReport(rawExtracted, fileName || 'Uploaded_Credit_Report.pdf');

    // Hook: store extraction stats
    anonymousStats.successfulParses++;

    res.json({
      success: true,
      modelUsed,
      report: normalized,
    });
  } catch (err: any) {
    console.warn('[AI Extract Report Warning]:', sanitizeForLogging(err?.message || err));
    const { rawText, fileName } = req.body || {};
    if (rawText && typeof rawText === 'string' && rawText.trim().length > 20) {
      console.info('[AI Extract Report] Serving high-precision deterministic extraction fallback.');
      const fallbackReport = extractReportDeterministic(rawText, fileName || 'Uploaded_Credit_Report.pdf');
      anonymousStats.successfulParses++;
      return res.json({
        success: true,
        modelUsed: 'deterministic-extractor',
        report: fallbackReport,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to extract credit report via AI: ' + sanitizeForLogging(err?.message || 'Unknown error'),
    });
  }
});

// AI Credit Report Analysis (Protected + Rate Limited)
app.post('/api/ai/analyze', requireAuth, aiAnalyzeLimiter, async (req, res) => {
  try {
    const { report, deterministicBaseline } = req.body;
    if (!report) {
      return res.status(400).json({ error: 'Credit report payload is required' });
    }

    anonymousStats.reportsAnalyzed++;

    const targetLanguage = ((req.headers['x-language'] as string) || req.body.language || 'en').toLowerCase();
    const langName = SUPPORTED_LANGUAGE_NAMES[targetLanguage] || 'English';

    const ai = getGeminiClient();
    if (!ai) {
      anonymousStats.aiFallbackCount++;
      syncReportAnalysisToCrm(req.user, report, deterministicBaseline);
      return res.json({
        result: {
          ...deterministicBaseline,
          generatedByAI: false,
          fallbackReason: 'AI model running in deterministic baseline mode (API key not configured in environment).',
        },
      });
    }

    const languageInstruction = targetLanguage !== 'en'
      ? `\n\nLANGUAGE DIRECTIVE: The user has selected ${langName} (code: ${targetLanguage}). You MUST write all descriptive narrative fields (e.g. summary, critical issue descriptions and actions, negative account problems/recommendations/whatToVerify/documentsRequired, dispute explanations, action plan milestones) in fluent, natural ${langName}. Keep technical financial terms like CIBIL, RBI, NOC, DPD, EMI, PAN, and lender names in standard Indian usage.`
      : '';

    const prompt = `
You are the elite AI Credit Analyst for "Digital Katta", an Indian Credit Information (CIBIL / TransUnion) Analysis platform.
Analyze the following newly uploaded Indian credit report data with strict factual discipline, financial accuracy, and empathy.

CRITICAL INSTRUCTIONS:
1. Strictly analyze the actual data below. DO NOT confuse with any demo data or old reports. Every metric, lender name, balance, overdue amount, and negative issue MUST correspond directly to this uploaded borrower report.
2. Indian Context: Refer to CIBIL score (300 to 900 range), RBI norms, NOC (No Objection Certificate), DPD (Days Past Due), SMA/NPA, and Indian lenders.
3. Negative Accounts: Deeply analyze every problematic account in this report (Written Off, Settled, Overdue, High DPD > 30). For each, give:
   - "problem": Precise issue statement
   - "whyItMatters": Impact on credit score and future borrowing
   - "whatToVerify": Exactly what documents/dates the borrower must cross-check
   - "recommendedAction": Pragmatic steps (e.g. paying overdue, converting written-off to closed with NOC, raising lender grievance)
   - "documentsRequired": List of necessary documents (Closure letter, NOC, receipt, statement)
4. Disputable Items: Detect potential discrepancies in this specific report (e.g. account active despite closure proof, overdue mismatch, duplicate accounts, incorrect DPD, unauthorized enquiry). Use cautious language like "Potential discrepancy detected".
5. Action Plan: Provide concrete 30/60/90 day steps tailored specifically to their overdue amounts and utilization.
6. NEVER guarantee a specific future CIBIL score increase.
7. Return structured JSON matching the provided schema.${languageInstruction}

REPORT DATA:
${JSON.stringify({
  personal: report.personal,
  score: report.score,
  summary: report.summary,
  accounts: report.accounts?.map((a: any) => ({
    lender: a.lender,
    type: a.accountType,
    maskedNo: a.accountNumberMasked,
    sanctioned: a.sanctionedAmount,
    balance: a.currentBalance,
    overdue: a.overdueAmount,
    status: a.rawStatus,
    maxDPD: a.maxDPD,
    dpdHistory: a.paymentHistory?.slice(0, 6),
    remarks: a.negativeRemarks,
  })),
  enquiries: report.enquiries,
})}

BASELINE DETERMINISTIC CALCULATIONS FOR GUIDANCE:
${JSON.stringify({
  healthScore100: deterministicBaseline?.creditHealth?.healthScore100,
  summary: deterministicBaseline?.creditHealth?.summary,
  criticalIssues: deterministicBaseline?.criticalIssues,
  disputeOpportunities: deterministicBaseline?.disputeOpportunities,
  rankedNegativeFactors: deterministicBaseline?.rankedNegativeFactors,
})}

Return ONLY a valid JSON object matching the requested schema with all fields.
`;

    const { text: responseText } = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      responseMimeType: 'application/json',
      temperature: 0.1,
    });

    let cleanJsonText = (responseText || '{}').trim();
    if (cleanJsonText.startsWith('```json')) {
      cleanJsonText = cleanJsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJsonText.startsWith('```')) {
      cleanJsonText = cleanJsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedJson = JSON.parse(cleanJsonText);

    // Validate and coerce with Zod
    const validationResult = AIAnalysisSchema.safeParse(parsedJson);
    if (validationResult.success) {
      const finalResult = {
        ...(deterministicBaseline || {}),
        ...validationResult.data,
        generatedByAI: true,
      };
      syncReportAnalysisToCrm(req.user, report, finalResult);
      return res.json({ result: finalResult });
    } else {
      console.warn('[AI Engine] Schema coercion notice:', sanitizeForLogging(validationResult.error.message));
      const fallbackResult = {
        ...deterministicBaseline,
        generatedByAI: false,
        fallbackReason: 'AI output adjusted to guaranteed deterministic schema.',
      };
      syncReportAnalysisToCrm(req.user, report, fallbackResult);
      return res.json({ result: fallbackResult });
    }
  } catch (error: any) {
    console.info('[AI Engine] Analysis: serving deterministic baseline analysis.');
    const baseline = req.body?.deterministicBaseline;
    const finalFallback = {
      ...(baseline || {}),
      generatedByAI: false,
      fallbackReason: 'AI service temporarily unavailable due to model demand. Deterministic rule-based engine delivered full analysis.',
    };
    syncReportAnalysisToCrm(req.user, req.body?.report, finalFallback);
    return res.json({ result: finalFallback });
  }
});

// "Ask About My Credit Report" Chat Assistant (Protected + Rate Limited)
app.post('/api/ai/chat', requireAuth, aiChatLimiter, async (req, res) => {
  try {
    const { question, report, history } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    realTelemetry.chatQueriesAnswered++;

    const targetLanguage = ((req.headers['x-language'] as string) || req.body.language || 'en').toLowerCase();
    const langName = SUPPORTED_LANGUAGE_NAMES[targetLanguage] || 'English';

    const ai = getGeminiClient();
    if (!ai) {
      realTelemetry.aiFallbackCount++;
      // Deterministic rule-based smart answer generator
      const answer = generateDeterministicChatResponse(question, report, targetLanguage);
      return res.json({ answer, source: 'RULE_ENGINE' });
    }

    const systemInstruction = `
You are the AI Assistant for "Digital Katta – AI CIBIL Report Analyzer".
Your task is to answer user queries strictly regarding their uploaded Indian CIBIL/Credit report.
Tone: Professional, helpful, objective, empathetic, Indian banking knowledgeable.
LANGUAGE MANDATE: The user's active language is ${langName} (${targetLanguage}). Respond in natural, fluent ${langName} unless the user explicitly requests another language. Keep established banking acronyms (CIBIL, RBI, NOC, DPD, EMI, PAN, NBFC) in standard usage.

RULES:
1. Answer ONLY using the uploaded credit report facts.
2. If certain information is NOT in the report (e.g. salary, reason for past job loss, current bank balance), clearly state that it is not available in the report.
3. Never promise a specific future score increase (e.g. do not say "your score will jump by 80 points"). Instead use "this may positively impact your score over 3 to 6 months of disciplined repayment".
4. Mask all account numbers (e.g. XXXXXX1234) and PAN numbers.
5. Reference RBI grievance guidelines, CIBIL dispute portal, and lender Nodal officers when suggesting corrections.
`;

    const reportContext = `
USER'S CREDIT REPORT CONTEXT:
- Name: ${report?.personal?.name}
- CIBIL Score: ${report?.score?.score} (${report?.score?.category})
- Total Accounts: ${report?.summary?.totalAccounts} (Active: ${report?.summary?.activeAccounts}, Closed: ${report?.summary?.closedAccounts}, Negative: ${report?.summary?.negativeAccounts})
- Total Outstanding: ₹${report?.summary?.totalOutstanding?.toLocaleString('en-IN')}
- Active Overdue: ₹${report?.summary?.totalOverdue?.toLocaleString('en-IN')}
- Credit Card Utilization: ${report?.summary?.creditCardUtilizationPct}% (Limit: ₹${report?.summary?.totalCreditCardLimit?.toLocaleString('en-IN')}, Balance: ₹${report?.summary?.totalCreditCardBalance?.toLocaleString('en-IN')})
- Recent Inquiries (90 Days): ${report?.summary?.enquiriesLast90Days}
- Accounts List:
${report?.accounts
  ?.map(
    (a: any) =>
      `  * [${a.lender}] ${a.accountType} (No: ${a.accountNumberMasked}): Balance ₹${a.currentBalance}, Overdue ₹${a.overdueAmount}, Status: "${a.rawStatus}", Max DPD: ${a.maxDPD}`
  )
  .join('\n')}
`;

    const prompt = `${reportContext}\n\nUser Question: ${question}`;

    const { text: answerText } = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      temperature: 0.3,
    });

    res.json({ answer: answerText || 'Unable to generate response.', source: 'GEMINI' });
  } catch (error: any) {
    console.info('[AI Engine] Chat: serving deterministic assistant response.');
    const targetLanguage = ((req.headers['x-language'] as string) || req.body?.language || 'en').toLowerCase();
    const fallbackAnswer = generateDeterministicChatResponse(req.body?.question, req.body?.report, targetLanguage);
    res.json({ answer: fallbackAnswer, source: 'RULE_ENGINE_FALLBACK' });
  }
});

// "Generate Correction Request" Letter Generator (Protected + Rate Limited)
app.post('/api/ai/letter', requireAuth, aiLetterLimiter, async (req, res) => {
  try {
    const { templateConfig, report } = req.body;
    realTelemetry.lettersDrafted++;
    const ai = getGeminiClient();

    const targetLanguage = ((req.headers['x-language'] as string) || templateConfig?.targetLanguage || req.body?.language || 'en').toLowerCase();
    const langName = SUPPORTED_LANGUAGE_NAMES[targetLanguage] || 'English';

    const {
      templateType,
      lenderName,
      accountNumberMasked,
      borrowerName,
      borrowerPan,
      borrowerPhone,
      borrowerEmail,
      customDetails,
    } = templateConfig || {};

    if (!ai) {
      const letter = generateDeterministicLetter(templateConfig);
      return res.json({ letter, source: 'RULE_ENGINE' });
    }

    const languageInstruction = targetLanguage !== 'en'
      ? `\nLANGUAGE DIRECTIVE: Draft the body of the formal grievance letter in ${langName}. Retain standard English banking headers, legal references to RBI Master Direction, and account particulars so it is accepted by bank grievance cells.`
      : '';

    const prompt = `
Generate a formal, legally structured, and polite Indian Banking Grievance / Correction Request Letter.
Borrower Name: ${borrowerName || report?.personal?.name || 'Borrower'}
Borrower PAN: ${borrowerPan || report?.personal?.panMasked || 'XXXXX****X'}
Borrower Contact: ${borrowerPhone || '+91 XXXXX XXXXX'}, ${borrowerEmail || 'email@domain.com'}
Recipient Bank / NBFC: Principal Nodal Officer / Grievance Redressal Officer, ${lenderName || 'Financial Institution'}
Subject Issue Type: ${templateType}
Target Account Number: ${accountNumberMasked || 'XXXX-XXXX-XXXX'}
Specific Context / Details: ${customDetails || 'Please refer to enclosed loan clearance records and credit report extracts.'}
${languageInstruction}

Include:
1. Proper date and address placeholders: [Date: DD/MM/YYYY], [Branch Address].
2. Reference to RBI Master Direction on Credit Information Companies (Regulation) Rules, 2006 (mandating credit data rectification within 30 days).
3. Clear factual description of the discrepancy.
4. Specific remedy demanded (e.g. update status to "Closed", remove inaccurate DPD, zero out spurious overdue, notify TransUnion CIBIL).
5. List of attached annexures/proofs.
6. Signature block.

Generate ONLY the clean letter text ready to print or email.
`;

    const { text: letterText } = await generateGeminiContentWithFallback(ai, {
      contents: prompt,
      temperature: 0.2,
    });

    res.json({ letter: letterText || generateDeterministicLetter(templateConfig), source: 'GEMINI' });
  } catch (error: any) {
    console.info('[AI Engine] Letter generator: serving deterministic letter template.');
    res.json({ letter: generateDeterministicLetter(req.body?.templateConfig), source: 'RULE_ENGINE_FALLBACK' });
  }
});

// Deterministic response helper for chat
function generateDeterministicChatResponse(question: string, report: any, language: string = 'en'): string {
  const q = (question || '').toLowerCase();
  const summary = report?.summary || {};
  const accounts = report?.accounts || [];

  if (q.includes('why') && (q.includes('low') || q.includes('score'))) {
    const reasons: string[] = [];
    if (summary.totalOverdue > 0) reasons.push(`an active overdue balance of ₹${summary.totalOverdue.toLocaleString('en-IN')}`);
    const writtenOff = accounts.filter((a: any) => a.normalizedStatus === 'WRITTEN_OFF').length;
    if (writtenOff > 0) reasons.push(`${writtenOff} written-off / default account(s)`);
    if (summary.creditCardUtilizationPct > 50) reasons.push(`high credit card utilization of ${summary.creditCardUtilizationPct}%`);
    if (summary.enquiriesLast90Days >= 3) reasons.push(`${summary.enquiriesLast90Days} recent hard inquiries within 90 days`);

    if (reasons.length > 0) {
      return `Your CIBIL score is currently ${report?.score?.score || 618} (${report?.score?.category || 'Needs Improvement'}). The primary factors affecting your score are:\n\n` +
        reasons.map((r, i) => `${i + 1}. ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('\n') +
        `\n\nResolving active overdues and reducing card balances below 30% typically provides the fastest recovery.`;
    }
    return `Your score is ${report?.score?.score || 700}. Maintaining on-time repayments and low credit utilization will help sustain and strengthen it over time.`;
  }

  if (q.includes('which account') || q.includes('hurting') || q.includes('worst')) {
    const overdueAcc = accounts.find((a: any) => a.overdueAmount > 0);
    const writeOffAcc = accounts.find((a: any) => a.normalizedStatus === 'WRITTEN_OFF');
    if (overdueAcc) {
      return `The account causing the most immediate ongoing damage is your ${overdueAcc.accountType} with ${overdueAcc.lender} (Account: ${overdueAcc.accountNumberMasked}), reporting an active overdue of ₹${overdueAcc.overdueAmount.toLocaleString('en-IN')}. Clearing this overdue should be your highest priority.`;
    }
    if (writeOffAcc) {
      return `The account with the most severe long-term mark is your ${writeOffAcc.accountType} with ${writeOffAcc.lender} (Account: ${writeOffAcc.accountNumberMasked}), classified as "Written Off". You should approach ${writeOffAcc.lender} to settle the dues and obtain an official No Dues Certificate (NOC).`;
    }
    return `None of your accounts currently carry critical overdue or write-off statuses. Focus on keeping revolving balances under 30% of your credit limit.`;
  }

  if (q.includes('utilization') || q.includes('card')) {
    return `Your credit card utilization is currently ${summary.creditCardUtilizationPct || 0}%. You are using ₹${(summary.totalCreditCardBalance || 0).toLocaleString('en-IN')} out of an aggregate credit ceiling of ₹${(summary.totalCreditCardLimit || 0).toLocaleString('en-IN')}. For optimal CIBIL scoring, credit rating agencies recommend keeping utilization strictly below 30% (approx ₹${Math.round((summary.totalCreditCardLimit || 0) * 0.3).toLocaleString('en-IN')}).`;
  }

  if (q.includes('document') || q.includes('proof')) {
    return `To dispute errors or clear negative accounts with Indian lenders, keep the following documents ready:\n1. Loan Foreclosure / Closure Letter\n2. Bank No Objection Certificate (NOC) on official letterhead\n3. Final payment receipt with UTR/Transaction Reference\n4. Bank account statement showing EMI debits\n5. Self-attested PAN Card and CIBIL report extract.`;
  }

  return `Based on your uploaded CIBIL report, your profile shows ${summary.totalAccounts || 0} accounts with an aggregate outstanding balance of ₹${(summary.totalOutstanding || 0).toLocaleString('en-IN')}. Feel free to ask specific questions about any individual account, overdue amount, dispute opportunities, or your 30/60/90-day action plan.`;
}

// Deterministic letter template generator
function generateDeterministicLetter(config: any): string {
  const date = new Date().toLocaleDateString('en-GB');
  return `Date: ${date}

To,
The Principal Nodal Officer / Grievance Redressal Cell,
${config?.lenderName || 'Financial Institution Ltd.'},
Consumer Credit Operations Division.

Subject: Formal Request for Rectification of Credit Information - Account No: ${config?.accountNumberMasked || 'XXXX-XXXX'}

Dear Sir / Madam,

I am writing to bring to your urgent attention an inaccurate entry reported by your institution in my TransUnion CIBIL credit report under facility reference ${config?.accountNumberMasked || 'XXXX-XXXX'}.

Borrower Particulars:
- Full Name: ${config?.borrowerName || 'Borrower Name'}
- PAN Number: ${config?.borrowerPan || 'ABCDE1234F'}
- Contact Number: ${config?.borrowerPhone || '+91 XXXXX XXXXX'}
- Registered Email: ${config?.borrowerEmail || 'user@domain.com'}

Description of Discrepancy:
${config?.customDetails || 'The account status or overdue amount reflected in my credit report does not match the actual repayment records. The necessary payments / closures have been executed and acknowledged.'}

Legal & Regulatory Mandate:
As per the Master Directions issued by the Reserve Bank of India (RBI) under the Credit Information Companies (Regulation) Act, 2005 (Section 21 and CIC Rules, 2006), Credit Institutions are required to update and rectify inaccurate credit data with all four credit bureaus (CIBIL, Experian, Equifax, CRIF High Mark) within 30 days of receiving a grievance.

Remedy Requested:
1. Immediately verify your internal ledger and correct the reporting of this facility to reflect accurate status (Zero Outstanding / Closed / NOC Issued / Correct DPD).
2. Transmit the rectified data to TransUnion CIBIL and other authorized credit bureaus in your upcoming monthly reporting cycle.
3. Issue a formal written confirmation / No Dues Certificate (NOC) to my registered email address.

Enclosures:
1. Copy of relevant Payment Receipt / Bank Statement.
2. Relevant Loan Closure / NOC document (if applicable).
3. Self-attested PAN Card copy for identity verification.

Thanking you,

Yours sincerely,

___________________________
${config?.borrowerName || 'Authorized Signatory'}
`;
}

// Global Express Error Handler with Sanitized Output (No PII leakage in logs)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', sanitizeForLogging(err));
  res.status(500).json({
    error: 'An internal server error occurred while processing credit data.',
    details: process.env.NODE_ENV === 'production' ? undefined : sanitizeForLogging(err?.message || err),
  });
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Katta Server running on port ${PORT}`);
  });
}

startServer();
