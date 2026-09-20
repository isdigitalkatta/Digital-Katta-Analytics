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
  paymentStatus?: 'Unpaid' | 'Paid' | 'Refunded' | string | null;
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
  paymentStatus?: 'Paid' | 'Unpaid' | 'Refunded';
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
    customer.paymentStatus || 'Unpaid',                       // Q. Payment Status
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
    paymentStatus: payment.paymentStatus || 'Paid',
    amountPaid: payment.amountPaid,
    packageName: payment.packageName || localRecord.packageName || 'CIBIL Dispute & Resolution Plan',
    caseNumber: caseInfo.caseNumber,
    assignedPartnerAssistant: caseInfo.assignedPartnerAssistant || 'Partner Assistant',
    assignedCreditExpert: caseInfo.assignedCreditExpert || 'Senior Credit Officer',
    status: caseInfo.status || 'Active Case (Paid)',
    remarks: caseInfo.remarks || `Converted to Case #${caseInfo.caseNumber} via payment ₹${payment.amountPaid}`,
    updatedAt: new Date(),
  };

  localPaidCasesDb.set(customerId, paidRecord);
  localCustomersDb.set(customerId, {
    ...localRecord,
    status: 'Converted to Paid Case',
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
