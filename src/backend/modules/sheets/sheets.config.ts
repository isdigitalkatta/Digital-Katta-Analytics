/**
 * Google Sheets & Drive CRM Configuration
 * Digital Katta (digitalkatta.com)
 */

export interface SheetsConfig {
  serviceAccountJson: string | null;
  serviceAccountEmail: string | null;
  leadsSpreadsheetId: string | null;
  paidSpreadsheetId: string | null;
  ownerEmail: string;
}

/**
 * Extracts pure Google Spreadsheet ID from either a raw ID or full Google Docs URL
 * e.g., 'https://docs.google.com/spreadsheets/d/1tC9M5ulTFxAkfnj.../edit' -> '1tC9M5ulTFxAkfnj...'
 */
export function extractSpreadsheetId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check if input is a Google Sheets URL
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // If plain ID or has query/hash parameters, isolate the pure ID
  const cleanId = trimmed.split('/')[0].split('?')[0].split('#')[0].trim();
  return cleanId || null;
}

export function maskPan(pan?: string | null): string {
  if (!pan) return 'N/A';
  const clean = pan.trim().toUpperCase();
  if (clean.length < 5) return '***';
  return `******${clean.slice(-4)}`;
}

export function maskEmail(email?: string | null): string {
  if (!email) return 'N/A';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? `${name.slice(0, 2)}***` : '***';
  return `${maskedName}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return 'N/A';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 4) return '***';
  return `+91 ******${clean.slice(-4)}`;
}

export function getSheetsConfig(): SheetsConfig {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || null;
  const serviceAccountEmail =
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL)?.trim() || null;
  const leadsSpreadsheetId = extractSpreadsheetId(process.env.GOOGLE_LEADS_SPREADSHEET_ID);
  const paidSpreadsheetId = extractSpreadsheetId(process.env.GOOGLE_PAID_CUSTOMERS_SPREADSHEET_ID);
  const ownerEmail = process.env.GOOGLE_WORKSPACE_OWNER_EMAIL?.trim() || 'isdigitalkatta@gmail.com';

  return {
    serviceAccountJson,
    serviceAccountEmail,
    leadsSpreadsheetId,
    paidSpreadsheetId,
    ownerEmail,
  };
}
