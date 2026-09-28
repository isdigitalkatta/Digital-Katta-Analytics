import { Router, Request, Response } from 'express';
import {
  getSheetsStatus,
  ensureWorkbooksExist,
  syncNow,
  convertLeadToPaidCustomer,
  updateResolutionOnSheet,
  getLeads,
  getPaidCustomers,
  updateLeadStatus,
  updatePaidCaseStatus,
  addNewLead,
  CustomerData,
} from './sheets.service.js';
import { requireStaff, requireRole } from '../../../../server/auth.js';
import { verifyBillingRequest } from '../billing/billing.service.js';

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
 * GET /api/v1/admin/sheets/leads
 * Staff endpoint to query, search, filter, and paginate borrower leads
 * Protected by requireStaff (ADMIN, LEAD_HANDLER, CREDIT_EXPERT)
 * Customers cannot access CRM pages.
 */
sheetsRouter.get('/leads', requireStaff, async (req: Request, res: Response) => {
  try {
    const { search, status, paymentStatus, month, bureau, page, limit, sortBy, sortOrder } = req.query;
    const result = await getLeads({
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      paymentStatus: paymentStatus ? String(paymentStatus) : undefined,
      month: month ? String(month) : undefined,
      bureau: bureau ? String(bureau) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy ? String(sortBy) : 'createdAt',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.warn('[Sheets Routes] GET /leads notice:', err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch borrower leads',
    });
  }
});

/**
 * POST /api/v1/admin/sheets/leads/status
 * Updates lead status in the pipeline:
 * NEW → CONTACTED → DOCUMENTS_PENDING → UNDER_REVIEW → OFFER_SENT → PAID → DROPPED
 * STRICT POLICY: Plain frontend buttons cannot mark records as PAID without verified Server Secret or Razorpay signature.
 */
sheetsRouter.post('/leads/status', requireStaff, async (req: Request, res: Response) => {
  try {
    const {
      leadId,
      status,
      remarks,
      assignedPartnerAssistant,
      assignedCreditExpert,
      paymentStatus,
      amountPaid,
    } = req.body || {};

    if (!leadId || !status) {
      return res.status(400).json({
        success: false,
        error: 'leadId and status are required parameters.',
      });
    }

    // STRICT SECURITY CHECK: Never mark PAID from a plain frontend button alone
    if (status === 'PAID' || (paymentStatus && String(paymentStatus).toUpperCase() === 'PAID')) {
      const verification = verifyBillingRequest(req);
      if (!verification.isValid) {
        return res.status(403).json({
          success: false,
          error:
            'Security Policy Violation: Marking records as PAID requires a verified Server Secret or Razorpay Webhook signature. Plain frontend buttons cannot alter payment status.',
          code: 'PAYMENT_VERIFICATION_REQUIRED',
          hint: 'Provide serverSecret in request body/headers or submit via POST /api/billing/webhook-ready.',
        });
      }
    }

    const result = await updateLeadStatus(
      leadId,
      status,
      remarks,
      assignedPartnerAssistant,
      assignedCreditExpert,
      paymentStatus,
      amountPaid
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update lead status' });
  }
});

/**
 * POST /api/v1/admin/sheets/leads/convert
 * Converts a prospective borrower lead into an active Paid Customer Case
 * STRICT POLICY: Requires verified Server Secret or Razorpay Webhook signature.
 * Writes to both Google Sheets workbooks and assigns official Case Number.
 */
sheetsRouter.post('/leads/convert', requireStaff, async (req: Request, res: Response) => {
  try {
    // STRICT SECURITY CHECK: Never mark PAID from a plain frontend button alone
    const verification = verifyBillingRequest(req);
    if (!verification.isValid) {
      return res.status(403).json({
        success: false,
        error:
          'Security Policy Violation: Converting to a Paid Customer Case requires a verified Server Secret or Razorpay Webhook signature. Plain frontend buttons cannot unilaterally mark records as PAID.',
        code: 'PAYMENT_VERIFICATION_REQUIRED',
        hint: 'Provide serverSecret in request or trigger conversion via POST /api/billing/webhook-ready.',
      });
    }

    const {
      leadId,
      customer,
      amountPaid,
      packageName,
      assignedCreditExpert,
      assignedPartnerAssistant,
      remarks,
    } = req.body || {};
    
    let targetCustomer: CustomerData = customer;
    if (!targetCustomer && leadId) {
      const leadsRes = await getLeads({ search: leadId, limit: 1 });
      targetCustomer = leadsRes.leads[0];
    }

    if (!targetCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Valid customer data or existing leadId required to convert lead to paid case.',
      });
    }

    const currentYear = new Date().getFullYear();
    const caseNumber = `DK-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    const pkg = packageName || targetCustomer.packageName || 'Comprehensive CIBIL Dispute Resolution';
    const amount = Number(amountPaid) || Number(targetCustomer.amountPaid) || 1999;
    const expert = assignedCreditExpert || targetCustomer.assignedCreditExpert || 'Adv. Ramesh Patil';
    const assistant = assignedPartnerAssistant || targetCustomer.assignedPartnerAssistant || 'Pooja Deshmukh';

    // 1. Mark lead as PAID in Leads sheet & local registry
    await updateLeadStatus(
      targetCustomer.id,
      'PAID',
      `Converted to paid case #${caseNumber}. Package: ${pkg}. Amount: ₹${amount}`,
      assistant,
      expert,
      'PAID',
      amount
    );

    // 2. Add to Paid Customers sheet & local registry
    const conversionResult = await convertLeadToPaidCustomer(
      targetCustomer,
      {
        amountPaid: amount,
        packageName: pkg,
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
      {
        caseNumber,
        assignedPartnerAssistant: assistant,
        assignedCreditExpert: expert,
        status: 'PAID',
        remarks: remarks || `Payment received for ${pkg} (Verified via ${verification.method})`,
      }
    );

    res.json({
      success: conversionResult.success,
      message: `Lead successfully converted to Paid Customer Case #${caseNumber}.`,
      caseNumber,
      verificationMethod: verification.method,
      details: conversionResult,
    });
  } catch (err: any) {
    console.warn('[Sheets Routes] Conversion notice:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to convert lead to paid customer' });
  }
});

/**
 * POST /api/v1/admin/sheets/leads/create
 * Creates/inserts a prospective borrower lead
 */
sheetsRouter.post('/leads/create', requireStaff, async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ success: false, error: 'Borrower Name is required.' });
    }

    const result = await addNewLead(body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to add new lead' });
  }
});

/**
 * GET /api/v1/admin/sheets/paid
 * Staff endpoint to query, search, filter, and paginate paid customer cases
 * Protected by requireStaff (ADMIN, LEAD_HANDLER, CREDIT_EXPERT)
 */
sheetsRouter.get('/paid', requireStaff, async (req: Request, res: Response) => {
  try {
    const { search, status, month, resolved, page, limit, sortBy, sortOrder } = req.query;
    const result = await getPaidCustomers({
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      month: month ? String(month) : undefined,
      resolved: resolved ? String(resolved) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      sortBy: sortBy ? String(sortBy) : 'createdAt',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.warn('[Sheets Routes] GET /paid notice:', err?.message || err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch paid customer cases',
    });
  }
});

/**
 * POST /api/v1/admin/sheets/paid/resolve
 * Credit Expert / Admin updates CIBIL resolution outcome on Paid Customer Sheet
 */
sheetsRouter.post('/paid/resolve', requireStaff, async (req: Request, res: Response) => {
  try {
    const { caseNumber, scoreAfter, remarks, reportUrl, issueResolved, status } = req.body || {};
    if (!caseNumber) {
      return res.status(400).json({ success: false, error: 'caseNumber is required.' });
    }

    const result = await updateResolutionOnSheet(caseNumber, {
      cibilScoreAfter: scoreAfter !== undefined && scoreAfter !== '' ? Number(scoreAfter) : 740,
      cibilReportAfterUrl: reportUrl || '',
      issueResolved: issueResolved || 'Yes',
      status: status || 'RESOLVED',
      remarks: remarks || 'Dispute resolution successfully completed and verified.',
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Resolution update failed' });
  }
});

/**
 * POST /api/v1/admin/sheets/paid/status
 * Updates status of a paid customer case
 */
sheetsRouter.post('/paid/status', requireStaff, async (req: Request, res: Response) => {
  try {
    const { caseNumber, status, remarks } = req.body || {};
    if (!caseNumber || !status) {
      return res.status(400).json({ success: false, error: 'caseNumber and status are required.' });
    }

    const result = await updatePaidCaseStatus(caseNumber, status, remarks);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update case status' });
  }
});

/**
 * POST /api/v1/admin/sheets/bootstrap
 * Bootstraps both Google Spreadsheets (Leads & Paid Customers)
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
 * Kept for backwards compatibility
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
 * Kept for backwards compatibility
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

