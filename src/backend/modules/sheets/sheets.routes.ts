import { Router, Request, Response } from 'express';
import {
  getSheetsStatus,
  ensureWorkbooksExist,
  syncNow,
  convertLeadToPaidCustomer,
  updateResolutionOnSheet,
  CustomerData,
} from './sheets.service.js';

export const sheetsRouter = Router();

/**
 * GET /api/v1/admin/sheets/status
 * Returns connection health, workbook IDs, and spreadsheet links
 */
sheetsRouter.get('/status', (req: Request, res: Response) => {
  const status = getSheetsStatus();
  res.json({
    success: true,
    status,
  });
});

/**
 * POST /api/v1/admin/sheets/bootstrap
 * Bootstraps both Google Spreadsheets (Leads & Paid Customers)
 * - Creates both workbooks if IDs not provided
 * - Creates 12 month tabs (Jan - Dec)
 * - Writes standard header row (A to X)
 * - Shares with isdigitalkatta@gmail.com
 */
sheetsRouter.post('/bootstrap', async (req: Request, res: Response) => {
  try {
    const { leadsId, paidId } = await ensureWorkbooksExist();
    const updatedStatus = getSheetsStatus();

    res.json({
      success: true,
      message: 'Google Sheets CRM workbooks bootstrapped successfully with 12 monthly tabs and shared with isdigitalkatta@gmail.com',
      workbooks: {
        leadsSpreadsheetId: leadsId,
        paidSpreadsheetId: paidId,
        leadsSpreadsheetUrl: updatedStatus.leadsSpreadsheetUrl,
        paidSpreadsheetUrl: updatedStatus.paidSpreadsheetUrl,
      },
      status: updatedStatus,
    });
  } catch (err: any) {
    console.warn('[Sheets Routes] Bootstrap notice:', err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to bootstrap Google Sheets workbooks',
      hint: 'Ensure GOOGLE_SERVICE_ACCOUNT_JSON is configured with valid Google Cloud service account keys.',
    });
  }
});

/**
 * POST /api/v1/admin/sheets/sync
 * Manually triggers a complete synchronization from the CRM registry to Google Sheets
 */
sheetsRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = await syncNow();
    const status = getSheetsStatus();

    res.json({
      success: result.errors.length === 0,
      message: `Sync completed: ${result.leadsSynced} leads and ${result.paidSynced} paid cases synchronized.`,
      result,
      status,
    });
  } catch (err: any) {
    console.warn('[Sheets Routes] Sync notice:', err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Sync failed',
    });
  }
});

/**
 * POST /api/v1/admin/cases/mock-payment
 * Simulates a customer payment and triggers ConversionService to move lead to Paid Customers sheet
 */
sheetsRouter.post('/mock-payment', async (req: Request, res: Response) => {
  try {
    const { customer, amount, packageName } = req.body;
    const custData: CustomerData = customer || {
      id: `cust_${Date.now()}`,
      name: 'Sample Borrower',
      email: 'borrower@sample.in',
      phone: '+91 98765 43210',
      pan: 'ABCDE1234F',
    };

    const caseNum = `DK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await convertLeadToPaidCustomer(
      custData,
      {
        amountPaid: Number(amount || 1999),
        packageName: packageName || 'Complete CIBIL Resolution Package',
        paymentStatus: 'Paid',
        paidAt: new Date(),
      },
      {
        caseNumber: caseNum,
        assignedPartnerAssistant: 'Partner Desk Pune',
        assignedCreditExpert: 'Adv. Ramesh Patil',
        status: 'Active Case (Assigned)',
        remarks: `Client opted for ${packageName || 'Resolution Package'}`,
      }
    );

    res.json({
      success: result.success,
      message: result.message,
      caseNumber: caseNum,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Payment simulation failed' });
  }
});

/**
 * POST /api/v1/admin/cases/resolve
 * Credit expert marks issues as resolved and updates Paid sheet
 */
sheetsRouter.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { caseNumber, scoreAfter, remarks, reportUrl } = req.body;
    if (!caseNumber) {
      return res.status(400).json({ error: 'caseNumber is required' });
    }

    const result = await updateResolutionOnSheet(caseNumber, {
      cibilScoreAfter: Number(scoreAfter || 745),
      cibilReportAfterUrl: reportUrl || 'https://digitalkatta.com/reports/verified-noc.pdf',
      issueResolved: 'Yes',
      status: 'Case Resolved & Closed',
      remarks: remarks || 'All disputed accounts updated with bureau and NOC received.',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Resolution update failed' });
  }
});
