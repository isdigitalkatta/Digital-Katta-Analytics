import { google, sheets_v4, drive_v3 } from 'googleapis';
import { getSheetsConfig } from './sheets.config.js';

interface GoogleClients {
  sheets: sheets_v4.Sheets | null;
  drive: drive_v3.Drive | null;
  configured: boolean;
  serviceAccountEmail: string | null;
  error?: string | null;
}

let cachedClients: GoogleClients | null = null;
let hasLoggedWarning = false;

interface ParsedCredentialsResult {
  credentials: { client_email: string; private_key: string; [key: string]: any } | null;
  notice?: string | null;
}

/**
 * Validates if an email is a genuine Google Cloud Service Account
 */
function isServiceAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return lower.endsWith('.gserviceaccount.com');
}

/**
 * Parses the service account JSON from various formats (raw JSON, base64 encoded, escaped JSON, or raw private key with email)
 */
function parseServiceAccountCredentials(
  rawInput?: string | null,
  fallbackEmail?: string | null
): ParsedCredentialsResult {
  if (!rawInput || !rawInput.trim()) {
    return { credentials: null, notice: 'GOOGLE_SERVICE_ACCOUNT_JSON is not configured in environment.' };
  }

  let str = rawInput.trim();

  // Strip wrapping quotes if user pasted `"..."` or `'...'`
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1).trim();
  }

  // Helper to validate and clean a candidate credentials object
  const validateObj = (obj: any): ParsedCredentialsResult | null => {
    if (obj && typeof obj === 'object') {
      const email = (obj.client_email || fallbackEmail)?.trim();
      let pkey = obj.private_key;
      if (email && pkey && typeof pkey === 'string') {
        if (!isServiceAccountEmail(email)) {
          return {
            credentials: null,
            notice: `'${email}' is a personal or workspace user email (@gmail.com), not a Google Cloud Service Account. Service Account emails end with '.iam.gserviceaccount.com'. In Google Cloud Console, go to IAM & Admin > Service Accounts to find your service account email, or paste the entire JSON key file.`,
          };
        }
        pkey = pkey.replace(/\\n/g, '\n').trim();
        if (!pkey.includes('-----BEGIN')) {
          pkey = `-----BEGIN PRIVATE KEY-----\n${pkey}\n-----END PRIVATE KEY-----`;
        }
        return {
          credentials: {
            ...obj,
            client_email: email,
            private_key: pkey,
          },
        };
      }
    }
    return null;
  };

  // 1. Try direct JSON parse
  try {
    const parsed = JSON.parse(str);
    const valid = validateObj(parsed);
    if (valid) return valid;
  } catch {}

  // 2. Try Base64 decoding
  try {
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    if (decoded.trim().startsWith('{')) {
      const parsed = JSON.parse(decoded);
      const valid = validateObj(parsed);
      if (valid) return valid;
    }
  } catch {}

  // 3. Try unescaping literal \n and quotes
  try {
    const unescaped = str.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    if (unescaped.trim().startsWith('{')) {
      const parsed = JSON.parse(unescaped);
      const valid = validateObj(parsed);
      if (valid) return valid;
    }
  } catch {}

  // 4. Raw private key check (user pasted only the private key or base64 DER/PEM key)
  if (str.startsWith('MIIE') || str.includes('-----BEGIN') || str.includes('PRIVATE KEY')) {
    let cleanKey = str.replace(/\\n/g, '\n').trim();
    if (!cleanKey.includes('-----BEGIN')) {
      cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
    }

    const email = fallbackEmail?.trim();
    if (email) {
      if (!isServiceAccountEmail(email)) {
        return {
          credentials: null,
          notice: `'${email}' is a standard Google/Gmail account, not a Google Cloud Service Account. Service account emails end with '.iam.gserviceaccount.com'. Paste the complete service account JSON file from Google Cloud Console, or configure GOOGLE_SERVICE_ACCOUNT_EMAIL with your service account address.`,
        };
      }
      return {
        credentials: {
          client_email: email,
          private_key: cleanKey,
        },
      };
    }

    return {
      credentials: null,
      notice:
        'Service account private key detected in GOOGLE_SERVICE_ACCOUNT_JSON, but client_email is missing. Paste the entire JSON file from Google Cloud Console, or configure GOOGLE_SERVICE_ACCOUNT_EMAIL.',
    };
  }

  return {
    credentials: null,
    notice:
      'Could not parse GOOGLE_SERVICE_ACCOUNT_JSON. Ensure the complete JSON file from Google Cloud Console is pasted.',
  };
}

/**
 * Initializes and caches Google Sheets & Drive API clients using Google Service Account
 */
export function getGoogleClients(): GoogleClients {
  if (cachedClients) {
    return cachedClients;
  }

  const config = getSheetsConfig();

  if (!config.serviceAccountJson) {
    if (!hasLoggedWarning) {
      console.info(
        '\x1b[36m%s\x1b[0m',
        '[Google Sheets CRM] GOOGLE_SERVICE_ACCOUNT_JSON is not configured. Google Sheets CRM synchronization is running in offline/standby mode.'
      );
      hasLoggedWarning = true;
    }
    cachedClients = {
      sheets: null,
      drive: null,
      configured: false,
      serviceAccountEmail: null,
      error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured in environment',
    };
    return cachedClients;
  }

  const parseResult = parseServiceAccountCredentials(
    config.serviceAccountJson,
    config.serviceAccountEmail
  );

  if (!parseResult.credentials) {
    if (!hasLoggedWarning) {
      console.warn(
        '\x1b[33m%s\x1b[0m',
        `[Google Sheets CRM] Configuration notice: ${parseResult.notice}. CRM running in offline/standby mode.`
      );
      hasLoggedWarning = true;
    }
    cachedClients = {
      sheets: null,
      drive: null,
      configured: false,
      serviceAccountEmail: null,
      error: parseResult.notice || 'Invalid service account configuration',
    };
    return cachedClients;
  }

  try {
    const { client_email, private_key } = parseResult.credentials;

    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log(
      '\x1b[32m%s\x1b[0m',
      `[Google Sheets CRM] Google Sheets & Drive APIs connected successfully as ${client_email}`
    );

    cachedClients = {
      sheets,
      drive,
      configured: true,
      serviceAccountEmail: client_email,
      error: null,
    };
    return cachedClients;
  } catch (err: any) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `[Google Sheets CRM] Authentication notice: ${err?.message || err}. CRM running in offline/standby mode.`
    );
    cachedClients = {
      sheets: null,
      drive: null,
      configured: false,
      serviceAccountEmail: null,
      error: err?.message || 'Failed to initialize Google clients',
    };
    return cachedClients;
  }
}

/**
 * Resets client cache (useful after environment variable updates)
 */
export function resetGoogleClientsCache(): void {
  cachedClients = null;
  hasLoggedWarning = false;
}

/**
 * Invalidates current Google clients upon runtime authentication rejection (e.g. invalid_grant / revoked credentials)
 */
export function invalidateGoogleClients(authErrorMessage: string): void {
  const previousEmail = cachedClients?.serviceAccountEmail;
  console.warn(
    '\x1b[33m%s\x1b[0m',
    `[Google Sheets CRM] Authentication rejected by Google: ${authErrorMessage}. Shifting CRM to standby mode.`
  );
  cachedClients = {
    sheets: null,
    drive: null,
    configured: false,
    serviceAccountEmail: previousEmail || null,
    error: authErrorMessage,
  };
}
