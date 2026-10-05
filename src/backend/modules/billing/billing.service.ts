import crypto from 'crypto';
import { Request } from 'express';
import {
  CustomerData,
  convertLeadToPaidCustomer,
  updateLeadStatus,
  getLeads,
  addNewLead,
} from '../sheets/sheets.service.js';

export interface BillingConfig {
  hasCustomServerSecret: boolean;
  hasRazorpaySecret: boolean;
  webhookPath: string;
  enforceWebhookOnly: boolean;
}

export interface WebhookPaymentPayload {
  leadId?: string;
  customerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  pan?: string;
  amountPaid?: number | string;
  packageName?: string;
  transactionId?: string;
  paymentId?: string;
  assignedCreditExpert?: string;
  assignedPartnerAssistant?: string;
  remarks?: string;
  serverSecret?: string;
  // Razorpay webhook fields
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        email?: string;
        contact?: string;
        notes?: {
          leadId?: string;
          customerId?: string;
          packageName?: string;
          pan?: string;
          expert?: string;
        };
      };
    };
  };
}

export interface VerificationResult {
  isValid: boolean;
  method: 'server_secret' | 'razorpay_signature' | 'none';
  error?: string;
}

export function getBillingSecrets(): { serverSecret: string; razorpaySecret: string | null; isProduction: boolean } {
  const isProduction = process.env.NODE_ENV === 'production';
  const serverSecret =
    process.env.BILLING_WEBHOOK_SECRET?.trim() ||
    process.env.SERVER_SECRET?.trim() ||
    (isProduction ? '' : 'dev_billing_secret_staging_only');

  const razorpaySecret =
    process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim() ||
    null;

  return { serverSecret, razorpaySecret, isProduction };
}

/**
 * Validates whether a provided server secret matches the configured webhook secret
 */
export function isValidServerSecret(secretInput?: string | null): boolean {
  if (!secretInput) return false;
  const { serverSecret, isProduction } = getBillingSecrets();
  if (!serverSecret || (isProduction && serverSecret.length < 16)) return false;

  const inputClean = secretInput.trim();
  if (!inputClean) return false;

  // Constant-time comparison when lengths match
  if (inputClean.length === serverSecret.length) {
    try {
      return crypto.timingSafeEqual(Buffer.from(inputClean), Buffer.from(serverSecret));
    } catch {
      return inputClean === serverSecret;
    }
  }

  return false;
}

/**
 * Validates Razorpay Webhook HMAC-SHA256 signature against the raw request body
 */
export function isValidRazorpaySignature(
  rawBody: string | Buffer | undefined,
  signature?: string | null
): boolean {
  if (!signature || !rawBody) return false;
  const { razorpaySecret } = getBillingSecrets();
  if (!razorpaySecret) {
    // In production or sandbox, if Razorpay secret is not set, refuse signature verification
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8'))
      .digest('hex');

    if (expectedSignature.length === signature.length) {
      return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
    }
    return expectedSignature === signature;
  } catch (err) {
    console.warn('[Billing Service] Signature verification failed:', err);
    return false;
  }
}

/**
 * Comprehensive verification of incoming mark-paid requests:
 * Only accepts valid server secret OR future Razorpay webhook signature.
 * NEVER accepts a plain unauthenticated/unverified frontend button click.
 */
export function verifyBillingRequest(req: Request): VerificationResult {
  // 1. Check Server Secret via Headers
  const headerSecret =
    (req.headers['x-server-secret'] as string) ||
    (req.headers['x-billing-secret'] as string) ||
    (req.headers['x-webhook-secret'] as string);

  if (headerSecret && isValidServerSecret(headerSecret)) {
    return { isValid: true, method: 'server_secret' };
  }

  // 1b. Check Authorization Bearer secret (if provided as token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (isValidServerSecret(token)) {
      return { isValid: true, method: 'server_secret' };
    }
  }

  // 1c. Check Server Secret in body
  const bodySecret = req.body?.serverSecret;
  if (bodySecret && isValidServerSecret(bodySecret)) {
    return { isValid: true, method: 'server_secret' };
  }

  // 2. Check Razorpay Signature via Header
  const rzpSignature =
    (req.headers['x-razorpay-signature'] as string) ||
    (req.headers['x-razorpay-webhook-signature'] as string);

  if (rzpSignature) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    if (isValidRazorpaySignature(rawBody, rzpSignature)) {
      return { isValid: true, method: 'razorpay_signature' };
    } else {
      return {
        isValid: false,
        method: 'razorpay_signature',
        error: 'Invalid Razorpay webhook signature (HMAC-SHA256 mismatch).',
      };
    }
  }

  // 3. Reject plain frontend request
  return {
    isValid: false,
    method: 'none',
    error:
      'Security Policy Violation: Marking records as PAID requires a verified Server Secret or Razorpay Webhook signature. Plain frontend buttons cannot alter payment status.',
  };
}

/**
 * Executes the mark-paid operation:
 * 1. Sets paymentStatus to 'PAID'
 * 2. Sets pipeline status to 'PAID' / 'Converted to Paid Case'
 * 3. Assigns unique official Case Number
 * 4. Syncs the row to the Paid Customers Google Sheet (in the month tab of payment)
 * 5. Updates the Leads Google Sheet row to reflect payment and case number
 */
export async function processMarkPaidAndSync(
  payload: WebhookPaymentPayload,
  method: 'server_secret' | 'razorpay_signature'
): Promise<{
  success: boolean;
  message: string;
  caseNumber: string;
  leadId: string;
  paymentStatus: 'PAID';
  amountPaid: number;
  packageName: string;
  transactionId: string;
  syncedToSheets: boolean;
  sheetsMessage?: string;
}> {
  // Parse Razorpay webhook payload if event-wrapped
  let targetLeadId = payload.leadId || payload.customerId;
  let targetName = payload.name;
  let targetEmail = payload.email;
  let targetPhone = payload.phone;
  let targetPan = payload.pan;
  let amount = Number(payload.amountPaid) || 1999;
  let packageName = payload.packageName || 'Comprehensive CIBIL Dispute Resolution';
  let transactionId = payload.transactionId || payload.paymentId || `TXN_WEBHOOK_${Date.now()}`;
  let expert = payload.assignedCreditExpert || 'Senior Dispute Counsel';
  let assistant = payload.assignedPartnerAssistant || 'Lead Desk Officer';
  let remarks = payload.remarks;

  if (payload.event && payload.payload?.payment?.entity) {
    const rzpEntity = payload.payload.payment.entity;
    transactionId = rzpEntity.id || transactionId;
    amount = (rzpEntity.amount || 0) / 100 || amount;
    targetEmail = rzpEntity.email || targetEmail;
    targetPhone = rzpEntity.contact || targetPhone;
    if (rzpEntity.notes) {
      targetLeadId = rzpEntity.notes.leadId || rzpEntity.notes.customerId || targetLeadId;
      targetPan = rzpEntity.notes.pan || targetPan;
      packageName = rzpEntity.notes.packageName || packageName;
      expert = rzpEntity.notes.expert || expert;
    }
    remarks = `Automated Razorpay Webhook [${payload.event}] Txn: ${transactionId}`;
  }

  // 1. Locate Lead in CRM by ID, email, phone, or PAN
  let foundLead: CustomerData | undefined;
  if (targetLeadId) {
    const res = await getLeads({ search: targetLeadId, limit: 1 });
    foundLead = res.leads[0];
  }

  if (!foundLead && (targetEmail || targetPhone || targetPan)) {
    const searchParam = targetEmail || targetPhone || targetPan;
    const res = await getLeads({ search: searchParam, limit: 1 });
    foundLead = res.leads[0];
  }

  const currentYear = new Date().getFullYear();
  const caseNumber = `DK-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

  let customerRecord: CustomerData;
  if (foundLead) {
    customerRecord = {
      ...foundLead,
      name: targetName || foundLead.name,
      email: targetEmail || foundLead.email,
      phone: targetPhone || foundLead.phone,
      pan: targetPan || foundLead.pan,
      paymentStatus: 'PAID',
      status: 'PAID',
      amountPaid: amount,
      packageName,
      assignedCreditExpert: expert,
      assignedPartnerAssistant: assistant,
      caseNumber,
      remarks: remarks || `Payment verified via ${method.toUpperCase()} (${transactionId})`,
      updatedAt: new Date().toISOString(),
    };

    // Update Lead status in Leads Sheet & Local registry
    await updateLeadStatus(
      foundLead.id,
      'PAID',
      customerRecord.remarks || undefined,
      assistant,
      expert
    );
  } else {
    // Lead wasn't found (e.g. direct online payment from a new borrower)
    const newLeadRes = await addNewLead({
      name: targetName || 'Direct Online Customer',
      email: targetEmail || '',
      phone: targetPhone || '',
      pan: targetPan || '',
      packageName,
      paymentStatus: 'PAID',
      amountPaid: amount,
      assignedCreditExpert: expert,
      assignedPartnerAssistant: assistant,
      status: 'PAID',
      remarks: `Direct online payment verified via ${method.toUpperCase()} (${transactionId})`,
    });
    customerRecord = {
      ...newLeadRes.lead,
      paymentStatus: 'PAID',
      amountPaid: amount,
      caseNumber,
    };
  }

  // 2. CRUCIAL: Sync row to Paid Customers Google Sheet & Registry in current month tab
  const syncResult = await convertLeadToPaidCustomer(
    customerRecord,
    {
      amountPaid: amount,
      packageName,
      paymentStatus: 'Paid',
      transactionId,
      paidAt: new Date(),
    },
    {
      caseNumber,
      assignedPartnerAssistant: assistant,
      assignedCreditExpert: expert,
      status: 'PAID',
      remarks: customerRecord.remarks || `Enrolled via ${method}`,
    }
  );

  return {
    success: true,
    message: `Payment verified via ${method}. Lead marked as PAID and synced to Paid Customers sheet under case #${caseNumber}.`,
    caseNumber,
    leadId: customerRecord.id,
    paymentStatus: 'PAID',
    amountPaid: amount,
    packageName,
    transactionId,
    syncedToSheets: syncResult.success,
    sheetsMessage: syncResult.message,
  };
}
