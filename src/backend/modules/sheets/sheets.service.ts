import { sheets_v4 } from 'googleapis';
import { getGoogleClients, invalidateGoogleClients } from './sheets.client.js';
import { getSheetsConfig, extractSpreadsheetId, maskPan, maskEmail, maskPhone } from './sheets.config.js';
import { MONTH_TABS, MonthTab, SHEET_COLUMNS, getMonthTabName } from './monthTabs.js';

export interface CustomerData {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  pan?: string | null;
  address?: string | null;
  cityState?: string | null;
  cibilScoreBefore?: number | string | null;
  cibilReportBeforeUrl?: string | null;
  cibilScoreAfter?: number | string | null;
  cibilReportAfterUrl?: string | null;
  issuesIdentified?: string | null;
  issueResolved?: 'Yes' | 'No' | 'In Progress' | string | null;
  packageName?: string | null;
  paymentStatus?: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'REFUNDED' | string | null;
  amountPaid?: number | string | null;
  assignedPartnerAssistant?: string | null;
  assignedCreditExpert?: string | null;
  caseNumber?: string | null;
  status?: string | null;
  remarks?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface PaymentInfo {
  packageName?: string;
  amountPaid: number;
  paymentStatus?: 'PAID' | 'UNPAID' | 'REFUNDED' | string;
  transactionId?: string;
  paidAt?: string | Date;
}

export interface CaseInfo {
  caseNumber: string;
  assignedPartnerAssistant?: string;
  assignedCreditExpert?: string;
  status?: string;
  remarks?: string;
}

export interface AnalysisUpdateData {
  cibilScoreBefore: number;
  issuesIdentified: string;
  cibilReportUrl?: string;
}

export interface ResolutionUpdateData {
  cibilScoreAfter: number;
  cibilReportAfterUrl?: string;
  issueResolved: 'Yes' | 'No' | 'In Progress';
  status?: string;
  remarks?: string;
}

export interface SheetsRuntimeStatus {
  isConfigured: boolean;
  serviceAccountEmail: string | null;
  ownerEmail: string;
  leadsSpreadsheetId: string | null;
  paidSpreadsheetId: string | null;
  leadsSpreadsheetUrl: string | null;
  paidSpreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  lastSyncResult: {
    leadsSynced: number;
    paidSynced: number;
    errors: string[];
  } | null;
  configNotice?: string | null;
  configError?: string | null;
}

// In-memory runtime persistence for workbook IDs and local CRM records
let runtimeLeadsSpreadsheetId: string | null = null;
let runtimePaidSpreadsheetId: string | null = null;
let lastSyncedAt: string | null = null;
let lastSyncResult: SheetsRuntimeStatus['lastSyncResult'] = null;

// Local synchronized CRM registry of all leads and paid cases
const localCustomersDb = new Map<string, CustomerData>();
const localPaidCasesDb = new Map<string, CustomerData>();

/**
 * Normalizes phone numbers for matching (e.g. extracts last 10 digits)
 */
function normalizePhoneForMatch(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Normalizes PAN for matching
 */
function normalizePanForMatch(pan?: string | null): string {
  return pan ? pan.trim().toUpperCase() : '';
}

/**
 * Formats a Date object to DD/MM/YYYY
 */
function formatDateIndian(dateInput?: string | number | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  const day = String(valid.getDate()).padStart(2, '0');
  const month = String(valid.getMonth() + 1).padStart(2, '0');
  const year = valid.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats full timestamp for "Last Updated At"
 */
function formatTimestamp(dateInput?: string | number | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  return valid.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

/**
 * Transforms a CustomerData object into an array of cell values matching SHEET_COLUMNS (A to X)
 */
function mapCustomerToRow(customer: CustomerData, serialNo: number): (string | number)[] {
  return [
    serialNo,                                                 // A. Serial No
    formatDateIndian(customer.createdAt),                     // B. Date
    customer.name || 'N/A',                                   // C. Full Name
    customer.address || '',                                   // D. Address
    customer.pan?.trim().toUpperCase() || '',                 // E. PAN
    customer.phone || '',                                     // F. Mobile Number
    customer.whatsapp || customer.phone || '',                // G. WhatsApp Number
    customer.email?.trim().toLowerCase() || '',               // H. Email Address
    customer.cityState || '',                                 // I. City / State
    customer.cibilScoreBefore ?? '',                          // J. CIBIL Score Before
    customer.cibilReportBeforeUrl || '',                      // K. CIBIL Report Before (link or URL)
    customer.cibilScoreAfter ?? '',                           // L. CIBIL Score After
    customer.cibilReportAfterUrl || '',                       // M. CIBIL Report After (link or URL)
    customer.issuesIdentified || '',                          // N. Issues Identified (short text)
    customer.issueResolved || 'No',                           // O. Issue Resolved?
    customer.packageName || 'Credit Health Assessment',      // P. Package Name
    customer.paymentStatus ? (customer.paymentStatus as string).toUpperCase() : 'UNPAID', // Q. Payment Status
    customer.amountPaid ? Number(customer.amountPaid) : 0,    // R. Amount Paid (INR)
    customer.assignedPartnerAssistant || 'Digital Katta Desk', // S. Assigned Partner Assistant
    customer.assignedCreditExpert || 'Senior Credit Analyst',  // T. Assigned Credit Expert
    customer.caseNumber || '',                                // U. Case Number (paid only)
    customer.status || 'Active Lead',                         // V. Status
    customer.remarks || '',                                   // W. Remarks
    formatTimestamp(customer.updatedAt || new Date()),        // X. Last Updated At
  ];
}

/**
 * Resolves current active spreadsheet IDs (env or runtime)
 */
export function getActiveSpreadsheetIds(): { leadsId: string | null; paidId: string | null } {
  const config = getSheetsConfig();
  const leadsId = config.leadsSpreadsheetId || (runtimeLeadsSpreadsheetId ? extractSpreadsheetId(runtimeLeadsSpreadsheetId) : null);
  const paidId = config.paidSpreadsheetId || (runtimePaidSpreadsheetId ? extractSpreadsheetId(runtimePaidSpreadsheetId) : null);
  return { leadsId, paidId };
}

/**
 * Returns current CRM status and links
 */
export function getSheetsStatus(): SheetsRuntimeStatus {
  const { configured, serviceAccountEmail, error } = getGoogleClients();
  const config = getSheetsConfig();
  const { leadsId, paidId } = getActiveSpreadsheetIds();

  return {
    isConfigured: configured,
    serviceAccountEmail,
    ownerEmail: config.ownerEmail,
    leadsSpreadsheetId: leadsId,
    paidSpreadsheetId: paidId,
    leadsSpreadsheetUrl: leadsId ? `https://docs.google.com/spreadsheets/d/${leadsId}/edit` : null,
    paidSpreadsheetUrl: paidId ? `https://docs.google.com/spreadsheets/d/${paidId}/edit` : null,
    lastSyncedAt,
    lastSyncResult,
    configNotice: error || null,
    configError: error || null,
  };
}

/**
 * Shares a Google Spreadsheet with the designated owner email (e.g. isdigitalkatta@gmail.com)
 */
async function shareSpreadsheetWithOwner(spreadsheetId: string, ownerEmail: string): Promise<void> {
  const { drive } = getGoogleClients();
  if (!drive) return;

  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: ownerEmail,
      },
      fields: 'id',
      sendNotificationEmail: false,
    });
    console.log(
      '\x1b[32m%s\x1b[0m',
      `[Google Sheets CRM] Shared workbook ${spreadsheetId} with owner ${ownerEmail}`
    );
  } catch (err: any) {
    // If already shared or permission exists, continue gracefully
    console.warn(
      `[Google Sheets CRM] Notice while sharing with ${ownerEmail}: ${err?.message || err}`
    );
  }
}

/**
 * Ensures all 12 monthly tabs (Jan to Dec) exist in the spreadsheet with standard header columns
 */
export async function ensureMonthTabsExist(spreadsheetId: string): Promise<void> {
  const { sheets } = getGoogleClients();
  if (!sheets) {
    console.warn('[Google Sheets CRM] Sheets client unavailable. Skipping month tabs check.');
    return;
  }

  // 1. Fetch current sheets in workbook
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(sheetId,title))',
  });

  const existingSheets = meta.data.sheets || [];
  const existingTitles = new Set(existingSheets.map((s) => s.properties?.title));

  const requests: sheets_v4.Schema$Request[] = [];
  const newlyAddedTabs: MonthTab[] = [];

  // 2. Identify missing month tabs
  for (const month of MONTH_TABS) {
    if (!existingTitles.has(month)) {
      requests.push({
        addSheet: {
          properties: {
            title: month,
            gridProperties: {
              frozenRowCount: 1,
              columnCount: 26,
            },
          },
        },
      });
      newlyAddedTabs.push(month);
    }
  }

  // If initial default "Sheet1" exists and we added our tabs, we can remove Sheet1
  const defaultSheet = existingSheets.find((s) => s.properties?.title === 'Sheet1');

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
    console.log(
      `[Google Sheets CRM] Added month tabs [${newlyAddedTabs.join(', ')}] to workbook ${spreadsheetId}`
    );
  }

  // If Sheet1 exists and we have at least one month tab, delete Sheet1
  if (defaultSheet && defaultSheet.properties?.sheetId !== undefined && existingTitles.size > 0) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId: defaultSheet.properties.sheetId,
              },
            },
          ],
        },
      });
    } catch {
      // Non-fatal if Sheet1 cannot be deleted
    }
  }

  // 3. Ensure Header Row exists in all 12 month tabs
  const dataToUpdate: sheets_v4.Schema$ValueRange[] = [];

  for (const month of MONTH_TABS) {
    dataToUpdate.push({
      range: `${month}!A1:X1`,
      values: [Array.from(SHEET_COLUMNS)],
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: dataToUpdate,
    },
  });

  // 4. Format header row styling (Bold, centered, colored background)
  try {
    const updatedMeta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    });
    const formatRequests: sheets_v4.Schema$Request[] = [];

    for (const sheet of updatedMeta.data.sheets || []) {
      const sId = sheet.properties?.sheetId;
      if (sId !== undefined && isMonthTabTitle(sheet.properties?.title)) {
        formatRequests.push({
          repeatCell: {
            range: {
              sheetId: sId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 24,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.11, green: 0.22, blue: 0.35 }, // #1c3859 Navy
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 10,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        });
      }
    }

    if (formatRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: formatRequests },
      });
    }
  } catch {
    // Non-critical formatting error ignored
  }
}

function isMonthTabTitle(title?: string | null): boolean {
  return title ? MONTH_TABS.includes(title as MonthTab) : false;
}

/**
 * Creates the two separate Google Spreadsheets if IDs are missing,
 * creates 12 monthly tabs in each, writes headers, and shares with isdigitalkatta@gmail.com
 */
export async function ensureWorkbooksExist(): Promise<{ leadsId: string; paidId: string }> {
  const { sheets, configured } = getGoogleClients();
  const config = getSheetsConfig();
  const { leadsId: existingLeadsId, paidId: existingPaidId } = getActiveSpreadsheetIds();

  if (!configured || !sheets) {
    throw new Error(
      'Google Sheets API credentials are not configured in GOOGLE_SERVICE_ACCOUNT_JSON. Please provide service account credentials to bootstrap workbooks.'
    );
  }

  let finalLeadsId = existingLeadsId;
  let finalPaidId = existingPaidId;

  // 1. Create or verify Leads Workbook
  if (!finalLeadsId) {
    console.log('[Google Sheets CRM] Creating Leads Workbook: "Digital Katta - Leads (Unpaid Customers)"...');
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Digital Katta - Leads (Unpaid Customers)',
        },
      },
    });
    finalLeadsId = createRes.data.spreadsheetId || null;
    if (!finalLeadsId) throw new Error('Failed to retrieve ID for new Leads spreadsheet.');
    runtimeLeadsSpreadsheetId = finalLeadsId;
  }

  // 2. Create or verify Paid Customers Workbook
  if (!finalPaidId) {
    console.log('[Google Sheets CRM] Creating Paid Customers Workbook: "Digital Katta - Paid Customers"...');
    const createRes = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Digital Katta - Paid Customers',
        },
      },
    });
    finalPaidId = createRes.data.spreadsheetId || null;
    if (!finalPaidId) throw new Error('Failed to retrieve ID for new Paid Customers spreadsheet.');
    runtimePaidSpreadsheetId = finalPaidId;
  }

  // 3. Ensure all 12 month tabs exist in both workbooks
  await Promise.all([
    ensureMonthTabsExist(finalLeadsId),
    ensureMonthTabsExist(finalPaidId),
  ]);

  // 4. Share both spreadsheets with isdigitalkatta@gmail.com
  await Promise.all([
    shareSpreadsheetWithOwner(finalLeadsId, config.ownerEmail),
    shareSpreadsheetWithOwner(finalPaidId, config.ownerEmail),
  ]);

  console.log(
    '\x1b[32m%s\x1b[0m',
    `[Google Sheets CRM] Successfully bootstrapped workbooks! Leads ID: ${finalLeadsId}, Paid ID: ${finalPaidId}`
  );

  return { leadsId: finalLeadsId, paidId: finalPaidId };
}

/**
 * Searches a workbook across all 12 monthly tabs for an existing customer
 * Match criteria: Email OR Mobile OR PAN (sanitized)
 */
async function findCustomerRowInWorkbook(
  spreadsheetId: string,
  customer: CustomerData
): Promise<{ tab: MonthTab; rowIndex: number; rowData: any[] } | null> {
  const { sheets } = getGoogleClients();
  if (!sheets) return null;

  const targetEmail = customer.email?.trim().toLowerCase();
  const targetPhone = normalizePhoneForMatch(customer.phone);
  const targetPan = normalizePanForMatch(customer.pan);

  // Search through all months
  for (const tab of MONTH_TABS) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tab}!A2:X`, // Rows starting after header
      });

      const rows = res.data.values || [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowPan = normalizePanForMatch(row[4]);
        const rowPhone = normalizePhoneForMatch(row[5]);
        const rowWhatsapp = normalizePhoneForMatch(row[6]);
        const rowEmail = (row[7] || '').trim().toLowerCase();

        // Match criteria
        const matchPan = targetPan && rowPan && targetPan === rowPan;
        const matchEmail = targetEmail && rowEmail && targetEmail === rowEmail;
        const matchPhone = targetPhone && (rowPhone === targetPhone || rowWhatsapp === targetPhone);

        if (matchPan || matchEmail || matchPhone) {
          return {
            tab,
            rowIndex: i + 2, // 1-indexed for sheets: header is row 1, data starts at row 2
            rowData: row,
          };
        }
      }
    } catch {
      // Continue searching next tab
    }
  }

  return null;
}

/**
 * Upsert a Lead into "Digital Katta - Leads (Unpaid Customers)"
 * Business Rule 1 & 2:
 * - If customer exists: UPDATE their row, preserving serial number and signup date
 * - If customer is new: Append to their signup month tab
 */
export async function upsertLead(customer: CustomerData): Promise<{ success: boolean; action: 'updated' | 'inserted' | 'skipped'; message: string }> {
  // Always update local in-memory registry first
  const customerId = customer.id || customer.email || customer.phone || `cust_${Date.now()}`;
  const existingLocal = localCustomersDb.get(customerId) || {};
  const mergedCustomer: CustomerData = {
    ...existingLocal,
    ...customer,
    updatedAt: new Date(),
  };
  localCustomersDb.set(customerId, mergedCustomer);

  const { sheets, configured } = getGoogleClients();
  if (!configured || !sheets) {
    return {
      success: true,
      action: 'skipped',
      message: `Local customer stored (Sheets offline: GOOGLE_SERVICE_ACCOUNT_JSON pending). PAN: ${maskPan(customer.pan)}`,
    };
  }

  try {
    const { leadsId } = getActiveSpreadsheetIds();
    let targetSpreadsheetId = leadsId;

    if (!targetSpreadsheetId) {
      const created = await ensureWorkbooksExist();
      targetSpreadsheetId = created.leadsId;
    }

    // Check for existing customer in the Leads workbook
    const existing = await findCustomerRowInWorkbook(targetSpreadsheetId, mergedCustomer);

    if (existing) {
      // UPDATE EXISTING ROW (Do not create duplicate rows)
      const serialNo = Number(existing.rowData[0]) || existing.rowIndex - 1;
      const originalDate = existing.rowData[1] || formatDateIndian(mergedCustomer.createdAt);

      const updatedRow = mapCustomerToRow(mergedCustomer, serialNo);
      updatedRow[1] = originalDate; // Keep original creation date

      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSpreadsheetId,
        range: `${existing.tab}!A${existing.rowIndex}:X${existing.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow],
        },
      });

      console.log(
        `[Google Sheets CRM] Updated existing Lead in tab '${existing.tab}' row ${existing.rowIndex} for ${maskEmail(customer.email)} / PAN ${maskPan(customer.pan)}`
      );

      return {
        success: true,
        action: 'updated',
        message: `Updated existing lead row in '${existing.tab}' tab.`,
      };
    } else {
      // INSERT NEW ROW IN SIGNUP MONTH TAB
      const monthTab = getMonthTabName(mergedCustomer.createdAt || new Date());

      // Get count of existing rows in this month tab to compute next Serial No
      const existingRowsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: targetSpreadsheetId,
        range: `${monthTab}!A2:A`,
      });
      const currentCount = existingRowsRes.data.values?.length || 0;
      const serialNo = currentCount + 1;

      const newRow = mapCustomerToRow(mergedCustomer, serialNo);

      await sheets.spreadsheets.values.append({
        spreadsheetId: targetSpreadsheetId,
        range: `${monthTab}!A:X`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow],
        },
      });

      console.log(
        `[Google Sheets CRM] Inserted new Lead into tab '${monthTab}' with Serial No ${serialNo} for ${maskEmail(customer.email)} / PAN ${maskPan(customer.pan)}`
      );

      return {
        success: true,
        action: 'inserted',
        message: `Appended new lead to '${monthTab}' month tab.`,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('invalid_grant') || errorMsg.includes('account not found') || err?.code === 401 || err?.code === 403) {
      invalidateGoogleClients(`Google Authentication Notice: ${errorMsg}`);
    }
    console.warn(`[Google Sheets CRM] Notice in upsertLead: ${errorMsg}`);
    return {
      success: false,
      action: 'skipped',
      message: `Google Sheets sync notice: ${errorMsg}`,
    };
  }
}

/**
 * Converts a Lead into a Paid Customer
 * Business Rule 3:
 * - In Leads sheet: Mark customer as Converted
 * - In Paid Customers sheet: Upsert them in the month of payment tab
 */
export async function convertLeadToPaidCustomer(
  customer: CustomerData,
  payment: PaymentInfo,
  caseInfo: CaseInfo
): Promise<{ success: boolean; message: string }> {
  const customerId = customer.id || customer.email || customer.phone || `paid_${Date.now()}`;
  const localRecord = localCustomersDb.get(customerId) || customer;

  const paidRecord: CustomerData = {
    ...localRecord,
    ...customer,
    paymentStatus: (payment.paymentStatus || 'PAID').toUpperCase() as any,
    amountPaid: payment.amountPaid,
    packageName: payment.packageName || localRecord.packageName || 'CIBIL Dispute & Resolution Plan',
    caseNumber: caseInfo.caseNumber,
    assignedPartnerAssistant: caseInfo.assignedPartnerAssistant || 'Partner Assistant',
    assignedCreditExpert: caseInfo.assignedCreditExpert || 'Senior Credit Officer',
    status: caseInfo.status || 'PAID',
    remarks: caseInfo.remarks || `Converted to Case #${caseInfo.caseNumber} via payment ₹${payment.amountPaid}`,
    updatedAt: new Date(),
  };

  localPaidCasesDb.set(customerId, paidRecord);
  localCustomersDb.set(customerId, {
    ...localRecord,
    paymentStatus: 'PAID',
    amountPaid: payment.amountPaid,
    status: 'PAID',
    remarks: `Converted to Case #${caseInfo.caseNumber}`,
    updatedAt: new Date(),
  });

  const { sheets, configured } = getGoogleClients();
  if (!configured || !sheets) {
    return {
      success: true,
      message: `Local paid case #${caseInfo.caseNumber} recorded (Sheets offline: GOOGLE_SERVICE_ACCOUNT_JSON pending).`,
    };
  }

  try {
    const { leadsId, paidId } = getActiveSpreadsheetIds();
    let leadsSheetId = leadsId;
    let paidSheetId = paidId;

    if (!leadsSheetId || !paidSheetId) {
      const created = await ensureWorkbooksExist();
      leadsSheetId = created.leadsId;
      paidSheetId = created.paidId;
    }

    // 1. Mark as Converted in Leads Sheet
    const existingInLeads = await findCustomerRowInWorkbook(leadsSheetId, paidRecord);
    if (existingInLeads) {
      // Update Payment Status (Col Q / index 16), Status (Col V / index 21), Remarks (Col W / index 22), Last Updated (Col X / index 23)
      await sheets.spreadsheets.values.update({
        spreadsheetId: leadsSheetId,
        range: `${existingInLeads.tab}!Q${existingInLeads.rowIndex}:X${existingInLeads.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              'Paid',                                            // Q. Payment Status
              payment.amountPaid,                                // R. Amount Paid
              paidRecord.assignedPartnerAssistant || '',         // S. Assigned Partner Assistant
              paidRecord.assignedCreditExpert || '',             // T. Assigned Credit Expert
              caseInfo.caseNumber,                               // U. Case Number
              'Converted to Paid Case',                          // V. Status
              `Converted to Case #${caseInfo.caseNumber}`,       // W. Remarks
              formatTimestamp(new Date()),                       // X. Last Updated At
            ],
          ],
        },
      });
      console.log(
        `[Google Sheets CRM] Marked customer as Converted in Leads Sheet (${existingInLeads.tab} row ${existingInLeads.rowIndex})`
      );
    }

    // 2. Add / Update in Paid Customers Sheet (Month of Payment tab)
    const paymentMonthTab = getMonthTabName(payment.paidAt || new Date());
    const existingInPaid = await findCustomerRowInWorkbook(paidSheetId, paidRecord);

    if (existingInPaid) {
      const serialNo = Number(existingInPaid.rowData[0]) || existingInPaid.rowIndex - 1;
      const row = mapCustomerToRow(paidRecord, serialNo);

      await sheets.spreadsheets.values.update({
        spreadsheetId: paidSheetId,
        range: `${existingInPaid.tab}!A${existingInPaid.rowIndex}:X${existingInPaid.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });
      console.log(
        `[Google Sheets CRM] Updated Paid Customers workbook in tab ${existingInPaid.tab} row ${existingInPaid.rowIndex}`
      );
    } else {
      const existingRowsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: paidSheetId,
        range: `${paymentMonthTab}!A2:A`,
      });
      const currentCount = existingRowsRes.data.values?.length || 0;
      const serialNo = currentCount + 1;

      const newRow = mapCustomerToRow(paidRecord, serialNo);

      await sheets.spreadsheets.values.append({
        spreadsheetId: paidSheetId,
        range: `${paymentMonthTab}!A:X`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [newRow],
        },
      });
      console.log(
        `[Google Sheets CRM] Appended new Paid Customer #${caseInfo.caseNumber} to '${paymentMonthTab}' tab with Serial No ${serialNo}`
      );
    }

    return {
      success: true,
      message: `Customer converted to Paid Case #${caseInfo.caseNumber} and synced to Google Sheets.`,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('invalid_grant') || errorMsg.includes('account not found') || err?.code === 401 || err?.code === 403) {
      invalidateGoogleClients(`Google Authentication Notice: ${errorMsg}`);
    }
    console.warn(`[Google Sheets CRM] Notice in convertLeadToPaidCustomer: ${errorMsg}`);
    return {
      success: false,
      message: `Google Sheets sync notice: ${errorMsg}`,
    };
  }
}

/**
 * Updates CIBIL Analysis fields on the customer's sheet row
 * Business Rule 4:
 * -> update Score Before (Col J) + Issues Identified (Col N) + Last Updated At (Col X)
 */
export async function updateAnalysisOnSheet(
  customerIdOrIdentifier: string,
  analysis: AnalysisUpdateData
): Promise<{ success: boolean; message: string }> {
  // Update local store
  const localCust = localCustomersDb.get(customerIdOrIdentifier);
  if (localCust) {
    localCust.cibilScoreBefore = analysis.cibilScoreBefore;
    localCust.issuesIdentified = analysis.issuesIdentified;
    if (analysis.cibilReportUrl) localCust.cibilReportBeforeUrl = analysis.cibilReportUrl;
    localCust.updatedAt = new Date();
    localCustomersDb.set(customerIdOrIdentifier, localCust);
  }

  const { sheets, configured } = getGoogleClients();
  if (!configured || !sheets) {
    return { success: true, message: 'Local analysis recorded (Sheets offline).' };
  }

  try {
    const { leadsId, paidId } = getActiveSpreadsheetIds();
    const probeCustomer: CustomerData = localCust || {
      id: customerIdOrIdentifier,
      name: '',
      email: customerIdOrIdentifier.includes('@') ? customerIdOrIdentifier : undefined,
      phone: !customerIdOrIdentifier.includes('@') ? customerIdOrIdentifier : undefined,
    };

    // Check Leads Sheet first, then Paid Sheet
    let targetSheetId = leadsId;
    let found = leadsId ? await findCustomerRowInWorkbook(leadsId, probeCustomer) : null;

    if (!found && paidId) {
      targetSheetId = paidId;
      found = await findCustomerRowInWorkbook(paidId, probeCustomer);
    }

    if (found && targetSheetId) {
      // Update Column J (CIBIL Score Before) & Column K (CIBIL Report Link)
      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSheetId,
        range: `${found.tab}!J${found.rowIndex}:K${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[analysis.cibilScoreBefore, analysis.cibilReportUrl || 'Uploaded & Analyzed']],
        },
      });

      // Update Column N (Issues Identified)
      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSheetId,
        range: `${found.tab}!N${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[analysis.issuesIdentified]],
        },
      });

      // Update Column X (Last Updated At)
      await sheets.spreadsheets.values.update({
        spreadsheetId: targetSheetId,
        range: `${found.tab}!X${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[formatTimestamp(new Date())]],
        },
      });

      console.log(
        `[Google Sheets CRM] Updated CIBIL analysis on sheet tab '${found.tab}' row ${found.rowIndex}`
      );
      return { success: true, message: `Updated CIBIL analysis on sheet '${found.tab}' row ${found.rowIndex}.` };
    }

    return { success: true, message: 'Customer row not yet present on sheet; saved in local cache.' };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('invalid_grant') || errorMsg.includes('account not found') || err?.code === 401 || err?.code === 403) {
      invalidateGoogleClients(`Google Authentication Notice: ${errorMsg}`);
    }
    console.warn(`[Google Sheets CRM] Notice in updateAnalysisOnSheet: ${errorMsg}`);
    return { success: false, message: `Failed to update analysis on sheet: ${errorMsg}` };
  }
}

/**
 * Updates Resolution outcome when Credit Expert resolves issues
 * Business Rule 5:
 * -> update Score After (Col L) + Issue Resolved (Col O) + Remarks (Col W) + Last Updated (Col X)
 */
export async function updateResolutionOnSheet(
  caseIdOrIdentifier: string,
  resolution: ResolutionUpdateData
): Promise<{ success: boolean; message: string }> {
  // Update local store
  const localCase = localPaidCasesDb.get(caseIdOrIdentifier);
  if (localCase) {
    localCase.cibilScoreAfter = resolution.cibilScoreAfter;
    localCase.cibilReportAfterUrl = resolution.cibilReportAfterUrl || localCase.cibilReportAfterUrl;
    localCase.issueResolved = resolution.issueResolved;
    if (resolution.status) localCase.status = resolution.status;
    if (resolution.remarks) localCase.remarks = resolution.remarks;
    localCase.updatedAt = new Date();
    localPaidCasesDb.set(caseIdOrIdentifier, localCase);
  }

  const { sheets, configured } = getGoogleClients();
  if (!configured || !sheets) {
    return { success: true, message: 'Local resolution recorded (Sheets offline).' };
  }

  try {
    const { paidId } = getActiveSpreadsheetIds();
    if (!paidId) return { success: false, message: 'Paid customers spreadsheet not yet initialized.' };

    const probeCustomer: CustomerData = localCase || {
      id: caseIdOrIdentifier,
      name: '',
      caseNumber: caseIdOrIdentifier,
    };

    const found = await findCustomerRowInWorkbook(paidId, probeCustomer);
    if (found) {
      // Update Column L (CIBIL Score After) & Column M (CIBIL Report After)
      await sheets.spreadsheets.values.update({
        spreadsheetId: paidId,
        range: `${found.tab}!L${found.rowIndex}:M${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[resolution.cibilScoreAfter, resolution.cibilReportAfterUrl || 'Closure NOC Verified']],
        },
      });

      // Update Column O (Issue Resolved)
      await sheets.spreadsheets.values.update({
        spreadsheetId: paidId,
        range: `${found.tab}!O${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[resolution.issueResolved]],
        },
      });

      // Update Column V (Status), W (Remarks), X (Last Updated At)
      await sheets.spreadsheets.values.update({
        spreadsheetId: paidId,
        range: `${found.tab}!V${found.rowIndex}:X${found.rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              resolution.status || 'Resolved / Case Closed',
              resolution.remarks || 'All disputed items corrected and verified with bureau.',
              formatTimestamp(new Date()),
            ],
          ],
        },
      });

      console.log(
        `[Google Sheets CRM] Updated resolution on Paid sheet tab '${found.tab}' row ${found.rowIndex}`
      );
      return { success: true, message: `Updated resolution on Paid sheet '${found.tab}' row ${found.rowIndex}.` };
    }

    return { success: false, message: 'Case not found on Paid Customers sheet.' };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    if (errorMsg.includes('invalid_grant') || errorMsg.includes('account not found') || err?.code === 401 || err?.code === 403) {
      invalidateGoogleClients(`Google Authentication Notice: ${errorMsg}`);
    }
    console.warn(`[Google Sheets CRM] Notice in updateResolutionOnSheet: ${errorMsg}`);
    return { success: false, message: `Failed to update resolution on sheet: ${errorMsg}` };
  }
}

/**
 * Manual Admin Resync: Syncs all local customers and paid cases into Google Sheets
 */
export async function syncNow(): Promise<{
  leadsSynced: number;
  paidSynced: number;
  timestamp: string;
  errors: string[];
}> {
  const errors: string[] = [];
  let leadsSynced = 0;
  let paidSynced = 0;

  const { configured } = getGoogleClients();
  if (!configured) {
    return {
      leadsSynced: localCustomersDb.size,
      paidSynced: localPaidCasesDb.size,
      timestamp: new Date().toISOString(),
      errors: [
        'Google Sheets credentials (GOOGLE_SERVICE_ACCOUNT_JSON) not configured. Local CRM counts tracked in memory.',
      ],
    };
  }

  try {
    // 1. Ensure workbooks & tabs exist
    await ensureWorkbooksExist();

    // 2. Sync all local leads
    for (const [, lead] of localCustomersDb.entries()) {
      try {
        const res = await upsertLead(lead);
        if (res.success) leadsSynced++;
        else if (res.message) errors.push(res.message);
      } catch (e: any) {
        errors.push(`Lead sync failed for ${maskEmail(lead.email)}: ${e?.message || e}`);
      }
    }

    // 3. Sync all paid cases
    for (const [, paidCase] of localPaidCasesDb.entries()) {
      try {
        const res = await convertLeadToPaidCustomer(
          paidCase,
          {
            amountPaid: Number(paidCase.amountPaid || 1499),
            packageName: paidCase.packageName || 'Comprehensive Credit Fix',
            paidAt: paidCase.updatedAt || new Date(),
          },
          {
            caseNumber: paidCase.caseNumber || `DK-${Math.floor(100000 + Math.random() * 900000)}`,
            status: paidCase.status || 'Active Case',
            remarks: paidCase.remarks || 'Synced from CRM database',
          }
        );
        if (res.success) paidSynced++;
        else errors.push(res.message);
      } catch (e: any) {
        errors.push(`Paid case sync failed for ${paidCase.caseNumber}: ${e?.message || e}`);
      }
    }
  } catch (err: any) {
    errors.push(`Sync failed during workbook verification: ${err?.message || err}`);
  }

  lastSyncedAt = new Date().toISOString();
  lastSyncResult = {
    leadsSynced,
    paidSynced,
    errors,
  };

  return {
    leadsSynced,
    paidSynced,
    timestamp: lastSyncedAt,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Lead Sheet & Paid Customer CRM Data Management Engine
// ---------------------------------------------------------------------------

export interface LeadQueryParams {
  search?: string;
  status?: string;
  paymentStatus?: string;
  month?: string;
  bureau?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaidQueryParams {
  search?: string;
  status?: string;
  month?: string;
  resolved?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Parses a 24-column Google Sheet row into a structured CustomerData object
 */
function mapRowToCustomer(row: any[], tabName: string, rowIndex: number): CustomerData {
  const dateStr = row[1] || '';
  const name = row[2] || '';
  const address = row[3] || '';
  const pan = row[4] || '';
  const phone = row[5] || '';
  const whatsapp = row[6] || '';
  const email = row[7] || '';
  const cityState = row[8] || '';
  const cibilScoreBefore = row[9] ? Number(row[9]) : undefined;
  const cibilReportBeforeUrl = row[10] || '';
  const cibilScoreAfter = row[11] ? Number(row[11]) : undefined;
  const cibilReportAfterUrl = row[12] || '';
  const issuesIdentified = row[13] || '';
  const issueResolved = row[14] || 'No';
  const packageName = row[15] || '';
  const rawPayment = (row[16] || '').toString().trim().toUpperCase();
  const paymentStatus =
    rawPayment === 'PAID'
      ? 'PAID'
      : rawPayment === 'REFUNDED'
      ? 'REFUNDED'
      : rawPayment.includes('PENDING')
      ? 'PENDING_VERIFICATION'
      : 'UNPAID';
  const amountPaid = row[17] ? Number(row[17]) : 0;
  const assignedPartnerAssistant = row[18] || '';
  const assignedCreditExpert = row[19] || '';
  const caseNumber = row[20] || '';
  const status = row[21] || 'NEW';
  const remarks = row[22] || '';
  const updatedAt = row[23] || '';

  const id = caseNumber
    ? `case_${caseNumber.toLowerCase()}`
    : pan
    ? `pan_${pan.toLowerCase()}`
    : phone
    ? `ph_${phone.replace(/\D/g, '')}`
    : `row_${tabName}_${rowIndex}`;

  return {
    id,
    name,
    address,
    pan,
    phone,
    whatsapp,
    email,
    cityState,
    cibilScoreBefore,
    cibilReportBeforeUrl,
    cibilScoreAfter,
    cibilReportAfterUrl,
    issuesIdentified,
    issueResolved,
    packageName,
    paymentStatus,
    amountPaid,
    assignedPartnerAssistant,
    assignedCreditExpert,
    caseNumber,
    status,
    remarks,
    createdAt: dateStr || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
  };
}

/**
 * Seeds comprehensive realistic borrower leads and paid cases across various
 * months, statuses, and score categories if CRM storage is currently fresh.
 */
export function seedInitialDataIfEmpty() {
  if (localCustomersDb.size > 0 && localPaidCasesDb.size > 0) return;

  if (localCustomersDb.size === 0) {
    const sampleLeads: CustomerData[] = [
      {
        id: 'lead_sagar_01',
        name: 'Sagar Dhumal',
        email: 'sagar.dhumal@example.com',
        phone: '+91 98201 23456',
        whatsapp: '+91 98201 23456',
        pan: 'ABCDE1234F',
        cityState: 'Mumbai, Maharashtra',
        cibilScoreBefore: 612,
        issuesIdentified: '2 Written-off credit card accounts (HDFC, SBI), 1 settled personal loan',
        issueResolved: 'No',
        packageName: 'Comprehensive CIBIL Resolution',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'NEW',
        remarks: 'Borrower requested urgent callback regarding home loan eligibility pre-approval.',
        createdAt: '2026-09-15T10:30:00.000Z',
        updatedAt: '2026-09-15T10:30:00.000Z',
      },
      {
        id: 'lead_rajesh_02',
        name: 'Rajesh Kumar Sharma',
        email: 'rajesh.sharma@example.com',
        phone: '+91 98765 43210',
        whatsapp: '+91 98765 43210',
        pan: 'BKFPS4567M',
        cityState: 'Pune, Maharashtra',
        cibilScoreBefore: 580,
        issuesIdentified: 'DPD 90+ on HDFC Bank Credit Card, 3 hard enquiries in 30 days',
        issueResolved: 'No',
        packageName: 'CIBIL Dispute & Resolution Plan',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'CONTACTED',
        remarks: 'Initial phone consultation completed. Borrower gathering past settlement letters.',
        createdAt: '2026-09-10T14:15:00.000Z',
        updatedAt: '2026-09-12T11:20:00.000Z',
      },
      {
        id: 'lead_priya_03',
        name: 'Priya Deshpande',
        email: 'priya.deshpande@sample.in',
        phone: '+91 98112 34567',
        whatsapp: '+91 98112 34567',
        pan: 'CRIPD7891K',
        cityState: 'Nagpur, Maharashtra',
        cibilScoreBefore: 645,
        issuesIdentified: 'Identity mismatch: guarantor commercial vehicle loan wrongly linked to personal PAN',
        issueResolved: 'No',
        packageName: 'Identity & Wrong Ownership Correction',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Siddharth Joshi',
        assignedCreditExpert: 'Dr. Neha Kulkarni',
        status: 'DOCUMENTS_PENDING',
        remarks: 'Awaiting copy of loan sanction letter and PAN verification affidavit from applicant.',
        createdAt: '2026-08-20T09:00:00.000Z',
        updatedAt: '2026-08-22T16:45:00.000Z',
      },
      {
        id: 'lead_amit_04',
        name: 'Amit Kulkarni',
        email: 'amit.kulkarni@sample.in',
        phone: '+91 99220 87654',
        whatsapp: '+91 99220 87654',
        pan: 'DFGAK2345P',
        cityState: 'Nashik, Maharashtra',
        cibilScoreBefore: 590,
        issuesIdentified: 'Wrong Suit Filed remark by ICICI Bank despite full payment and closure in 2024',
        issueResolved: 'No',
        packageName: 'Suit Filed & Derogatory Mark Deletion',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'UNDER_REVIEW',
        remarks: 'Section 21 legal dispute notice draft prepared under Credit Information Companies Act.',
        createdAt: '2026-08-05T12:00:00.000Z',
        updatedAt: '2026-08-18T10:00:00.000Z',
      },
      {
        id: 'lead_sunita_05',
        name: 'Sunita Gaikwad',
        email: 'sunita.gaikwad@sample.in',
        phone: '+91 97654 12398',
        whatsapp: '+91 97654 12398',
        pan: 'ERTGS8901L',
        cityState: 'Kolhapur, Maharashtra',
        cibilScoreBefore: 625,
        issuesIdentified: 'Incorrect Settlement status after OTS; official Bank NOC already received',
        issueResolved: 'No',
        packageName: 'Settled to Closed Conversion',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Siddharth Joshi',
        assignedCreditExpert: 'Dr. Neha Kulkarni',
        status: 'OFFER_SENT',
        remarks: 'Resolution retainer package of ₹1,999 offered with guaranteed bureau follow-up.',
        createdAt: '2026-07-14T11:30:00.000Z',
        updatedAt: '2026-07-20T15:10:00.000Z',
      },
      {
        id: 'lead_vikram_06',
        name: 'Vikram Patel',
        email: 'vikram.patel@sample.in',
        phone: '+91 98450 67890',
        whatsapp: '+91 98450 67890',
        pan: 'GHJVP3456Q',
        cityState: 'Ahmedabad, Gujarat',
        cibilScoreBefore: 582,
        issuesIdentified: 'Two duplicate consumer loan entries with overlapping disbursement dates',
        issueResolved: 'No',
        packageName: 'Full Bureau Dispute Service',
        paymentStatus: 'Paid',
        amountPaid: 2499,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        caseNumber: 'DK-2026-1042',
        status: 'PAID',
        remarks: 'Payment verified via Razorpay; case opened on Paid Customers Sheet.',
        createdAt: '2026-06-10T14:00:00.000Z',
        updatedAt: '2026-06-12T16:30:00.000Z',
      },
      {
        id: 'lead_mahesh_07',
        name: 'Mahesh Shinde',
        email: 'mahesh.shinde@sample.in',
        phone: '+91 98190 54321',
        whatsapp: '+91 98190 54321',
        pan: 'JKLMS6789R',
        cityState: 'Thane, Maharashtra',
        cibilScoreBefore: 775,
        issuesIdentified: 'Minor spelling mistake in address line',
        issueResolved: 'No',
        packageName: 'Credit Report Health Check',
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        assignedPartnerAssistant: 'Siddharth Joshi',
        assignedCreditExpert: 'Dr. Neha Kulkarni',
        status: 'DROPPED',
        remarks: 'Lead dropped: Borrower score already 775 (prime tier); dispute not recommended.',
        createdAt: '2026-05-18T10:00:00.000Z',
        updatedAt: '2026-05-19T11:00:00.000Z',
      },
    ];

    for (const lead of sampleLeads) {
      localCustomersDb.set(lead.id, lead);
    }
  }

  if (localPaidCasesDb.size === 0) {
    const samplePaidCases: CustomerData[] = [
      {
        id: 'paid_vikram_01',
        caseNumber: 'DK-2026-1042',
        name: 'Vikram Patel',
        email: 'vikram.patel@sample.in',
        phone: '+91 98450 67890',
        whatsapp: '+91 98450 67890',
        pan: 'GHJVP3456Q',
        cityState: 'Ahmedabad, Gujarat',
        cibilScoreBefore: 582,
        cibilReportBeforeUrl: 'https://digitalkatta.com/reports/dk-1042-before.pdf',
        cibilScoreAfter: 640,
        cibilReportAfterUrl: '',
        issuesIdentified: 'Two duplicate consumer loan entries with overlapping dates',
        issueResolved: 'In Progress',
        packageName: 'Full Bureau Dispute Service',
        paymentStatus: 'Paid',
        amountPaid: 2499,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'ASSIGNED',
        remarks: 'Assigned to Adv. Ramesh Patil; notice filed with bureau',
        createdAt: '2026-06-12T16:30:00.000Z',
        updatedAt: '2026-06-15T11:00:00.000Z',
      },
      {
        id: 'paid_ananya_02',
        caseNumber: 'DK-2026-1019',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@sample.in',
        phone: '+91 98234 56789',
        whatsapp: '+91 98234 56789',
        pan: 'MNPAI1234T',
        cityState: 'Bengaluru, Karnataka',
        cibilScoreBefore: 595,
        cibilReportBeforeUrl: 'https://digitalkatta.com/reports/dk-1019-before.pdf',
        cibilScoreAfter: 680,
        cibilReportAfterUrl: '',
        issuesIdentified: 'Incorrect DPD 90+ reported on closed SBI car loan',
        issueResolved: 'In Progress',
        packageName: 'Car Loan Derogatory Fix',
        paymentStatus: 'Paid',
        amountPaid: 1999,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'DISPUTE_FILED',
        remarks: 'Section 21 notice served to SBI Consumer Grievance Desk; 30 day timer running',
        createdAt: '2026-05-20T10:15:00.000Z',
        updatedAt: '2026-05-25T14:30:00.000Z',
      },
      {
        id: 'paid_rahul_03',
        caseNumber: 'DK-2026-1008',
        name: 'Rahul Verma',
        email: 'rahul.verma@sample.in',
        phone: '+91 98101 23456',
        whatsapp: '+91 98101 23456',
        pan: 'QWERY5678U',
        cityState: 'Delhi NCR',
        cibilScoreBefore: 560,
        cibilReportBeforeUrl: 'https://digitalkatta.com/reports/dk-1008-before.pdf',
        cibilScoreAfter: 690,
        cibilReportAfterUrl: '',
        issuesIdentified: 'Written-off credit card balance of ₹42,000 wrongly remaining post OTS',
        issueResolved: 'In Progress',
        packageName: 'OTS & Settlement Rectification',
        paymentStatus: 'Paid',
        amountPaid: 2999,
        assignedPartnerAssistant: 'Siddharth Joshi',
        assignedCreditExpert: 'Dr. Neha Kulkarni',
        status: 'IN_FOLLOWUP',
        remarks: 'Bank accepted bank statement verification; awaiting bureau tape refresh',
        createdAt: '2026-04-10T12:00:00.000Z',
        updatedAt: '2026-04-28T16:00:00.000Z',
      },
      {
        id: 'paid_kavita_04',
        caseNumber: 'DK-2026-0985',
        name: 'Kavita Nair',
        email: 'kavita.nair@sample.in',
        phone: '+91 98330 98765',
        whatsapp: '+91 98330 98765',
        pan: 'TYUKN9012V',
        cityState: 'Kochi, Kerala',
        cibilScoreBefore: 540,
        cibilReportBeforeUrl: 'https://digitalkatta.com/reports/dk-0985-before.pdf',
        cibilScoreAfter: 742,
        cibilReportAfterUrl: 'https://digitalkatta.com/reports/dk-0985-noc-verified.pdf',
        issuesIdentified: 'Willful default misclassification on Kotak personal loan',
        issueResolved: 'Yes',
        packageName: 'High-Impact Legal Bureau Dispute',
        paymentStatus: 'Paid',
        amountPaid: 3499,
        assignedPartnerAssistant: 'Pooja Deshmukh',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'RESOLVED',
        remarks: 'Kotak Bank corrected bureau tape. Derogatory mark completely expunged. Score jumped to 742.',
        createdAt: '2026-03-01T09:00:00.000Z',
        updatedAt: '2026-03-28T15:00:00.000Z',
      },
      {
        id: 'paid_deepak_05',
        caseNumber: 'DK-2026-0952',
        name: 'Deepak Sawant',
        email: 'deepak.sawant@sample.in',
        phone: '+91 98920 11223',
        whatsapp: '+91 98920 11223',
        pan: 'OPIDS3456W',
        cityState: 'Pune, Maharashtra',
        cibilScoreBefore: 610,
        cibilReportBeforeUrl: 'https://digitalkatta.com/reports/dk-0952-before.pdf',
        cibilScoreAfter: 768,
        cibilReportAfterUrl: 'https://digitalkatta.com/reports/dk-0952-noc.pdf',
        issuesIdentified: 'Settled remark on Bajaj Finserv EMI card',
        issueResolved: 'Yes',
        packageName: 'Comprehensive CIBIL Resolution',
        paymentStatus: 'Paid',
        amountPaid: 1999,
        assignedPartnerAssistant: 'Siddharth Joshi',
        assignedCreditExpert: 'Dr. Neha Kulkarni',
        status: 'NOC_ISSUED',
        remarks: 'Official Bank NOC issued. CIBIL score increased from 610 to 768.',
        createdAt: '2026-02-15T11:00:00.000Z',
        updatedAt: '2026-02-28T18:00:00.000Z',
      },
    ];

    for (const paidCase of samplePaidCases) {
      localPaidCasesDb.set(paidCase.id, paidCase);
    }
  }
}

/**
 * Retrieve paginated, filtered, and searchable leads from Google Sheets (or fallback local CRM)
 */
export async function getLeads(params: LeadQueryParams = {}): Promise<{
  leads: CustomerData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalLeads: number;
    newLeads: number;
    inProgressLeads: number;
    convertedLeads: number;
    paidLeads?: number;
    unpaidLeads?: number;
    conversionRate: string;
  };
}> {
  seedInitialDataIfEmpty();

  const leadsMap = new Map<string, CustomerData>();
  for (const [id, lead] of localCustomersDb.entries()) {
    leadsMap.set(id, { ...lead });
  }

  // If Google Sheets is configured, fetch real sheet rows
  const { sheets, configured } = getGoogleClients();
  const { leadsId } = getActiveSpreadsheetIds();
  if (configured && sheets && leadsId) {
    try {
      const tabsToFetch =
        params.month && params.month !== 'ALL' && params.month !== 'all'
          ? [params.month]
          : MONTH_TABS;

      const ranges = tabsToFetch.map((tab) => `${tab}!A2:X`);
      const batchRes = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: leadsId,
        ranges,
      });

      const valueRanges = batchRes.data.valueRanges || [];
      for (const vr of valueRanges) {
        const tabName = (vr.range?.split('!')[0] || '').replace(/'/g, '');
        const rows = vr.values || [];
        for (let idx = 0; idx < rows.length; idx++) {
          const row = rows[idx];
          if (!row || row.length === 0 || !row[2]) continue;
          const parsed = mapRowToCustomer(row, tabName, idx + 2);
          leadsMap.set(parsed.id, parsed);
        }
      }
    } catch (err: any) {
      console.warn('[Google Sheets Lead Engine] Read notice:', err?.message || err);
    }
  }

  let allLeads = Array.from(leadsMap.values());

  // Calculate summary metrics before filters
  const totalLeadsCount = allLeads.length;
  const newLeadsCount = allLeads.filter(
    (l) => (l.status || '').toUpperCase() === 'NEW' || (l.status || '').toLowerCase().includes('active')
  ).length;
  const convertedLeadsCount = allLeads.filter(
    (l) =>
      (l.status || '').toUpperCase() === 'PAID' ||
      (l.status || '').toLowerCase().includes('paid') ||
      (l.status || '').toLowerCase().includes('convert') ||
      (l.paymentStatus || '').toUpperCase() === 'PAID'
  ).length;
  const paidLeadsCount = allLeads.filter(
    (l) => (l.paymentStatus || '').toUpperCase() === 'PAID' || (l.status || '').toUpperCase() === 'PAID'
  ).length;
  const unpaidLeadsCount = allLeads.filter(
    (l) => (l.paymentStatus || 'UNPAID').toUpperCase() === 'UNPAID'
  ).length;
  const inProgressLeadsCount = Math.max(0, totalLeadsCount - newLeadsCount - convertedLeadsCount);
  const conversionRate = totalLeadsCount > 0 ? `${((convertedLeadsCount / totalLeadsCount) * 100).toFixed(1)}%` : '0%';

  // Search query filter
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    allLeads = allLeads.filter((l) => {
      const name = (l.name || '').toLowerCase();
      const phone = (l.phone || '').toLowerCase();
      const whatsapp = (l.whatsapp || '').toLowerCase();
      const email = (l.email || '').toLowerCase();
      const pan = (l.pan || '').toLowerCase();
      const city = (l.cityState || '').toLowerCase();
      const notes = (l.remarks || '').toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        whatsapp.includes(q) ||
        email.includes(q) ||
        pan.includes(q) ||
        city.includes(q) ||
        notes.includes(q)
      );
    });
  }

  // Status filter
  if (params.status && params.status !== 'ALL' && params.status !== 'all') {
    const targetStatus = params.status.trim().toUpperCase();
    allLeads = allLeads.filter((l) => {
      const s = (l.status || '').toUpperCase();
      if (targetStatus === 'PAID') {
        return s === 'PAID' || s.includes('CONVERT') || (l.paymentStatus || '').toUpperCase() === 'PAID';
      }
      return s === targetStatus || s.includes(targetStatus);
    });
  }

  // Payment Status filter (UNPAID | PAID | PENDING_VERIFICATION | REFUNDED)
  if (params.paymentStatus && params.paymentStatus !== 'ALL' && params.paymentStatus !== 'all') {
    const targetPay = params.paymentStatus.trim().toUpperCase();
    allLeads = allLeads.filter((l) => {
      const ps = (l.paymentStatus || 'UNPAID').toUpperCase();
      return ps === targetPay;
    });
  }

  // Month tab filter
  if (params.month && params.month !== 'ALL' && params.month !== 'all') {
    const targetMonth = params.month.trim().toLowerCase();
    allLeads = allLeads.filter((l) => {
      const tab = getMonthTabName(l.createdAt).toLowerCase();
      return tab === targetMonth;
    });
  }

  // Bureau format filter (if specified)
  if (params.bureau && params.bureau !== 'ALL' && params.bureau !== 'all') {
    const b = params.bureau.trim().toLowerCase();
    allLeads = allLeads.filter((l) => {
      const issues = (l.issuesIdentified || '').toLowerCase();
      const pkg = (l.packageName || '').toLowerCase();
      return issues.includes(b) || pkg.includes(b);
    });
  }

  // Sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
  allLeads.sort((a: any, b: any) => {
    let valA = a[sortBy] ?? '';
    let valB = b[sortBy] ?? '';
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      const timeA = new Date(valA).getTime() || 0;
      const timeB = new Date(valB).getTime() || 0;
      return (timeA - timeB) * sortOrder;
    }
    if (sortBy === 'cibilScoreBefore') {
      return ((Number(valA) || 0) - (Number(valB) || 0)) * sortOrder;
    }
    return String(valA).localeCompare(String(valB)) * sortOrder;
  });

  // Pagination
  const total = allLeads.length;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedLeads = allLeads.slice(startIndex, startIndex + limit);

  return {
    leads: paginatedLeads,
    total,
    page,
    limit,
    totalPages,
    summary: {
      totalLeads: totalLeadsCount,
      newLeads: newLeadsCount,
      inProgressLeads: inProgressLeadsCount,
      convertedLeads: convertedLeadsCount,
      paidLeads: paidLeadsCount,
      unpaidLeads: unpaidLeadsCount,
      conversionRate,
    },
  };
}

/**
 * Retrieve paginated, filtered, and searchable paid customer cases from Google Sheets (or fallback local CRM)
 */
export async function getPaidCustomers(params: PaidQueryParams = {}): Promise<{
  paidCases: CustomerData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalCases: number;
    resolvedCases: number;
    totalRevenue: number;
    resolutionRate: string;
    avgScoreDelta: number;
  };
}> {
  seedInitialDataIfEmpty();

  const casesMap = new Map<string, CustomerData>();
  for (const [id, paidCase] of localPaidCasesDb.entries()) {
    casesMap.set(id, { ...paidCase });
  }

  // If Google Sheets is configured, fetch real sheet rows from Paid Customers workbook
  const { sheets, configured } = getGoogleClients();
  const { paidId } = getActiveSpreadsheetIds();
  if (configured && sheets && paidId) {
    try {
      const tabsToFetch =
        params.month && params.month !== 'ALL' && params.month !== 'all'
          ? [params.month]
          : MONTH_TABS;

      const ranges = tabsToFetch.map((tab) => `${tab}!A2:X`);
      const batchRes = await sheets.spreadsheets.values.batchGet({
        spreadsheetId: paidId,
        ranges,
      });

      const valueRanges = batchRes.data.valueRanges || [];
      for (const vr of valueRanges) {
        const tabName = (vr.range?.split('!')[0] || '').replace(/'/g, '');
        const rows = vr.values || [];
        for (let idx = 0; idx < rows.length; idx++) {
          const row = rows[idx];
          if (!row || row.length === 0 || !row[2]) continue;
          const parsed = mapRowToCustomer(row, tabName, idx + 2);
          casesMap.set(parsed.id, parsed);
        }
      }
    } catch (err: any) {
      console.warn('[Google Sheets Paid Engine] Read notice:', err?.message || err);
    }
  }

  let allCases = Array.from(casesMap.values());

  // Metrics before filters
  const totalCasesCount = allCases.length;
  const resolvedCasesCount = allCases.filter(
    (c) =>
      (c.issueResolved || '').toLowerCase() === 'yes' ||
      (c.status || '').toUpperCase() === 'RESOLVED' ||
      (c.status || '').toUpperCase() === 'NOC_ISSUED'
  ).length;

  let totalRevenue = 0;
  let totalScoreDelta = 0;
  let scoreDeltaCount = 0;

  for (const c of allCases) {
    totalRevenue += Number(c.amountPaid) || 0;
    if (c.cibilScoreBefore && c.cibilScoreAfter) {
      const delta = Number(c.cibilScoreAfter) - Number(c.cibilScoreBefore);
      if (!isNaN(delta)) {
        totalScoreDelta += delta;
        scoreDeltaCount++;
      }
    }
  }

  const resolutionRate = totalCasesCount > 0 ? `${((resolvedCasesCount / totalCasesCount) * 100).toFixed(1)}%` : '0%';
  const avgScoreDelta = scoreDeltaCount > 0 ? Math.round(totalScoreDelta / scoreDeltaCount) : 0;

  // Search filter
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    allCases = allCases.filter((c) => {
      const caseNum = (c.caseNumber || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const pan = (c.pan || '').toLowerCase();
      const expert = (c.assignedCreditExpert || '').toLowerCase();
      const assistant = (c.assignedPartnerAssistant || '').toLowerCase();
      const remarks = (c.remarks || '').toLowerCase();
      return (
        caseNum.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        pan.includes(q) ||
        expert.includes(q) ||
        assistant.includes(q) ||
        remarks.includes(q)
      );
    });
  }

  // Status filter
  if (params.status && params.status !== 'ALL' && params.status !== 'all') {
    const targetStatus = params.status.trim().toUpperCase();
    allCases = allCases.filter((c) => {
      const s = (c.status || '').toUpperCase();
      return s === targetStatus || s.includes(targetStatus);
    });
  }

  // Resolution status filter (Yes, No, In Progress)
  if (params.resolved && params.resolved !== 'ALL' && params.resolved !== 'all') {
    const targetRes = params.resolved.trim().toLowerCase();
    allCases = allCases.filter((c) => (c.issueResolved || 'no').toLowerCase() === targetRes);
  }

  // Month tab filter
  if (params.month && params.month !== 'ALL' && params.month !== 'all') {
    const targetMonth = params.month.trim().toLowerCase();
    allCases = allCases.filter((c) => {
      const tab = getMonthTabName(c.createdAt).toLowerCase();
      return tab === targetMonth;
    });
  }

  // Sorting
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
  allCases.sort((a: any, b: any) => {
    let valA = a[sortBy] ?? '';
    let valB = b[sortBy] ?? '';
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      const timeA = new Date(valA).getTime() || 0;
      const timeB = new Date(valB).getTime() || 0;
      return (timeA - timeB) * sortOrder;
    }
    if (sortBy === 'amountPaid' || sortBy === 'cibilScoreBefore' || sortBy === 'cibilScoreAfter') {
      return ((Number(valA) || 0) - (Number(valB) || 0)) * sortOrder;
    }
    return String(valA).localeCompare(String(valB)) * sortOrder;
  });

  // Pagination
  const total = allCases.length;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const paginatedCases = allCases.slice(startIndex, startIndex + limit);

  return {
    paidCases: paginatedCases,
    total,
    page,
    limit,
    totalPages,
    summary: {
      totalCases: totalCasesCount,
      resolvedCases: resolvedCasesCount,
      totalRevenue,
      resolutionRate,
      avgScoreDelta,
    },
  };
}

/**
 * Update pipeline status of a Lead (NEW → CONTACTED → DOCUMENTS_PENDING → UNDER_REVIEW → OFFER_SENT → PAID → DROPPED)
 */
export async function updateLeadStatus(
  leadId: string,
  status: string,
  remarks?: string,
  assignedPartnerAssistant?: string,
  assignedCreditExpert?: string,
  paymentStatus?: string,
  amountPaid?: number | string
): Promise<{ success: boolean; lead?: CustomerData; message?: string }> {
  seedInitialDataIfEmpty();

  let existing = localCustomersDb.get(leadId);
  if (!existing) {
    for (const [id, lead] of localCustomersDb.entries()) {
      if (id === leadId || lead.email === leadId || lead.phone === leadId || lead.pan === leadId) {
        existing = lead;
        leadId = id;
        break;
      }
    }
  }

  if (!existing) {
    return { success: false, message: `Lead '${leadId}' not found in registry.` };
  }

  existing.status = status;
  if (remarks !== undefined) existing.remarks = remarks;
  if (assignedPartnerAssistant) existing.assignedPartnerAssistant = assignedPartnerAssistant;
  if (assignedCreditExpert) existing.assignedCreditExpert = assignedCreditExpert;
  if (paymentStatus) {
    existing.paymentStatus = paymentStatus.toUpperCase() as any;
  } else if (status === 'PAID') {
    existing.paymentStatus = 'PAID';
  }
  if (amountPaid !== undefined && amountPaid !== null) {
    existing.amountPaid = Number(amountPaid);
  }
  existing.updatedAt = new Date().toISOString();
  localCustomersDb.set(leadId, existing);

  // Sync to Google Sheets if configured
  const { sheets, configured } = getGoogleClients();
  const { leadsId } = getActiveSpreadsheetIds();
  if (configured && sheets && leadsId) {
    try {
      const found = await findCustomerRowInWorkbook(leadsId, existing);
      if (found) {
        // Update Column Q (Payment Status) through Column X (Last Updated At)
        await sheets.spreadsheets.values.update({
          spreadsheetId: leadsId,
          range: `${found.tab}!Q${found.rowIndex}:X${found.rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                existing.paymentStatus || (status === 'PAID' ? 'PAID' : 'UNPAID'), // Q. Payment Status
                existing.amountPaid ? Number(existing.amountPaid) : 0,            // R. Amount Paid
                existing.assignedPartnerAssistant || '',                         // S. Assigned Partner Assistant
                existing.assignedCreditExpert || '',                             // T. Assigned Credit Expert
                existing.caseNumber || '',                                        // U. Case Number
                status,                                                          // V. Pipeline Status
                existing.remarks || '',                                          // W. Remarks
                formatTimestamp(new Date()),                                     // X. Last Updated At
              ],
            ],
          },
        });
      }
    } catch (e: any) {
      console.warn('[Google Sheets Lead Engine] Status update notice:', e?.message || e);
    }
  }

  return { success: true, lead: existing, message: `Lead status updated to ${status}` };
}

/**
 * Update case status of a Paid Customer (PAID → ASSIGNED → DISPUTE_FILED → IN_FOLLOWUP → RESOLVED → NOC_ISSUED → CLOSED)
 */
export async function updatePaidCaseStatus(
  caseNumber: string,
  status: string,
  remarks?: string
): Promise<{ success: boolean; paidCase?: CustomerData; message?: string }> {
  seedInitialDataIfEmpty();

  let existing: CustomerData | undefined;
  let caseKey = '';
  for (const [id, c] of localPaidCasesDb.entries()) {
    if (c.caseNumber === caseNumber || id === caseNumber) {
      existing = c;
      caseKey = id;
      break;
    }
  }

  if (!existing) {
    return { success: false, message: `Paid case '${caseNumber}' not found.` };
  }

  existing.status = status;
  if (remarks !== undefined) existing.remarks = remarks;
  existing.updatedAt = new Date().toISOString();
  localPaidCasesDb.set(caseKey, existing);

  // Update sheet if configured
  const { sheets, configured } = getGoogleClients();
  const { paidId } = getActiveSpreadsheetIds();
  if (configured && sheets && paidId) {
    try {
      const found = await findCustomerRowInWorkbook(paidId, existing);
      if (found) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: paidId,
          range: `${found.tab}!V${found.rowIndex}:X${found.rowIndex}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[status, existing.remarks || '', formatTimestamp(new Date())]],
          },
        });
      }
    } catch (e: any) {
      console.warn('[Google Sheets Paid Engine] Status update notice:', e?.message || e);
    }
  }

  return { success: true, paidCase: existing, message: `Case status updated to ${status}` };
}

/**
 * Add a new manual prospective lead to the CRM registry and Google Sheets
 */
export async function addNewLead(data: Partial<CustomerData>): Promise<{ success: boolean; lead: CustomerData; message: string }> {
  seedInitialDataIfEmpty();

  const id = data.id || `lead_manual_${Date.now()}`;
  const newLead: CustomerData = {
    id,
    name: (data.name || 'New Prospective Borrower').trim(),
    email: data.email?.trim().toLowerCase() || '',
    phone: data.phone?.trim() || '',
    whatsapp: data.whatsapp?.trim() || data.phone?.trim() || '',
    pan: data.pan?.trim().toUpperCase() || '',
    cityState: data.cityState?.trim() || 'Maharashtra, India',
    cibilScoreBefore: data.cibilScoreBefore ? Number(data.cibilScoreBefore) : 600,
    issuesIdentified: data.issuesIdentified?.trim() || 'Pending initial bureau analysis',
    issueResolved: 'No',
    packageName: data.packageName || 'Credit Health Assessment',
    paymentStatus: 'Unpaid',
    amountPaid: 0,
    assignedPartnerAssistant: data.assignedPartnerAssistant || 'Pooja Deshmukh',
    assignedCreditExpert: data.assignedCreditExpert || 'Adv. Ramesh Patil',
    status: data.status || 'NEW',
    remarks: data.remarks || 'Manually registered lead via Admin CRM Desk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localCustomersDb.set(id, newLead);

  // Upsert to Google Sheets if configured
  await upsertLead(newLead).catch((err) => {
    console.warn('[Google Sheets Lead Engine] Manual lead insert notice:', err?.message || err);
  });

  return { success: true, lead: newLead, message: 'New prospective lead created successfully.' };
}

