import { Router, Request, Response } from 'express';
import {
  verifyBillingRequest,
  processMarkPaidAndSync,
  getBillingSecrets,
  isValidServerSecret,
} from './billing.service.js';

export const billingRouter = Router();

/**
 * Common handler for Webhook-Ready Mark-Paid execution
 * Strictly enforces that ONLY requests with a valid server secret OR
 * valid Razorpay webhook signature can mark rows as PAID.
 * Syncs the paid row to the Paid Customers sheet.
 */
async function handleWebhookMarkPaid(req: Request, res: Response) {
  try {
    // 1. Enforce Server Secret or Razorpay signature
    const verification = verifyBillingRequest(req);
    if (!verification.isValid) {
      console.warn(
        `[Billing Webhook] Blocked unauthorized attempt to mark PAID: ${verification.error}`
      );
      return res.status(403).json({
        success: false,
        error: verification.error,
        code: 'PAYMENT_VERIFICATION_REQUIRED',
        hint:
          'Pass the server secret in the x-server-secret header, Bearer auth, or serverSecret body field, or provide an authentic x-razorpay-signature header.',
      });
    }

    // 2. Process Mark-Paid and sync to Paid Customers Google Sheet
    const method =
      verification.method === 'razorpay_signature' ? 'razorpay_signature' : 'server_secret';
    const result = await processMarkPaidAndSync(req.body, method);

    return res.status(200).json({
      success: true,
      verificationMethod: verification.method,
      ...result,
    });
  } catch (err: any) {
    console.error('[Billing Webhook Error]', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to process payment webhook and sync customer.',
    });
  }
}

/**
 * POST /api/billing/webhook-ready
 * Primary Webhook endpoint for Razorpay and Server-Side Automation
 */
billingRouter.post('/webhook-ready', handleWebhookMarkPaid);

/**
 * POST /api/billing/webhook-ready/mark-paid
 * Explicit sub-route for marking leads as paid
 */
billingRouter.post('/webhook-ready/mark-paid', handleWebhookMarkPaid);

/**
 * POST /api/billing/mark-paid
 * Alias for server-to-server or staff mark-paid
 */
billingRouter.post('/mark-paid', handleWebhookMarkPaid);

/**
 * GET /api/billing/webhook-ready
 * Status and diagnostic info about webhook-ready configuration
 */
billingRouter.get('/webhook-ready', (req: Request, res: Response) => {
  const { serverSecret, razorpaySecret } = getBillingSecrets();
  res.json({
    success: true,
    service: 'Digital Katta Billing & Razorpay Webhook Gateway',
    status: 'ACTIVE',
    endpoints: {
      webhook: '/api/billing/webhook-ready',
      markPaid: '/api/billing/webhook-ready/mark-paid',
    },
    verificationRequirements: {
      serverSecretHeader: 'x-server-secret',
      razorpaySignatureHeader: 'x-razorpay-signature',
      plainFrontendButtonsAllowed: false,
    },
    hasCustomServerSecret: Boolean(serverSecret && serverSecret !== 'dev_billing_secret_staging_only'),
    hasRazorpayWebhookConfigured: !!razorpaySecret,
    defaultSecretAvailable: process.env.NODE_ENV !== 'production',
  });
});

/**
 * POST /api/billing/verify-secret
 * Validates a staff-entered secret key without revealing the expected secret
 */
billingRouter.post('/verify-secret', (req: Request, res: Response) => {
  const { secret } = req.body || {};
  const valid = isValidServerSecret(secret);
  res.json({
    success: true,
    isValid: valid,
    message: valid ? 'Server secret verified.' : 'Invalid server secret.',
  });
});
