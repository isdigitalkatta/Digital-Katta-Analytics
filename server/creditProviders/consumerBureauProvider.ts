import { normalizeExtractedReport } from '../reportNormalizer.js';
import {
  BureauName,
  type CreditBureauProvider,
  type BureauPullRequest,
  type BureauPullResult,
} from './types.js';

/**
 * Live Consumer Bureau Provider
 * Integrates with licensed bureau API partner gateway for official self-pulls
 * Requires:
 *  - BUREAU_PROVIDER_ENABLED=true
 *  - BUREAU_API_BASE_URL
 *  - BUREAU_API_KEY
 */
export class ConsumerBureauProvider implements CreditBureauProvider {
  readonly id = 'consumer-bureau';
  readonly name = 'Official Consumer Bureau Gateway';

  isAvailable(): boolean {
    const isEnabled = process.env.BUREAU_PROVIDER_ENABLED === 'true';
    const hasBaseUrl = Boolean(process.env.BUREAU_API_BASE_URL?.trim());
    const hasApiKey = Boolean(process.env.BUREAU_API_KEY?.trim());
    return isEnabled && hasBaseUrl && hasApiKey;
  }

  async pullReport(req: BureauPullRequest): Promise<BureauPullResult> {
    const targetBureau = req.bureau || BureauName.CIBIL;

    // 1. Availability / Configuration guard
    if (!this.isAvailable()) {
      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'NOT_CONFIGURED',
        errorMessage: 'Official pull is not connected. Upload your CIBIL PDF instead.',
      };
    }

    // 2. Strict Consent validation
    if (!req.consentAccepted) {
      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'CONSENT_REQUIRED',
        errorMessage: 'Borrower consent is strictly mandatory under DPDP Act 2023.',
      };
    }

    // 3. Strict Purpose validation (Must be CONSUMER_SELF_VIEW only)
    if (req.purpose !== 'CONSUMER_SELF_VIEW') {
      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'VENDOR_ERROR',
        errorMessage: 'Unauthorized purpose. Only CONSUMER_SELF_VIEW is permitted for self pulls.',
      };
    }

    // 4. Strict OTP Verification validation
    if (!req.otpVerified) {
      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'OTP_REQUIRED',
        errorMessage: 'Two-factor OTP authentication is required before bureau data pull.',
      };
    }

    const baseUrl = (process.env.BUREAU_API_BASE_URL || '').trim().replace(/\/+$/, '');
    const apiKey = (process.env.BUREAU_API_KEY || '').trim();
    const timeoutMs = Number(process.env.BUREAU_API_TIMEOUT_MS) || 30000;

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/v1/bureau/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-Consumer-Purpose': 'CONSUMER_SELF_VIEW',
        },
        body: JSON.stringify({
          userId: req.userId,
          name: req.name,
          pan: req.pan,
          dob: req.dob,
          mobile: req.mobile,
          consent: {
            accepted: true,
            version: req.consentTextVersion,
            purpose: req.purpose,
            timestamp: new Date().toISOString(),
          },
          bureau: targetBureau,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        return {
          ok: false,
          providerName: this.name,
          bureau: targetBureau,
          errorCode: 'VENDOR_ERROR',
          errorMessage: `Bureau gateway returned status ${response.status}: ${errorText || response.statusText}`,
        };
      }

      const responseData = await response.json();

      // If vendor returns structured JSON report
      if (responseData.report || responseData.normalized || responseData.accounts) {
        const rawToNormalize = responseData.report || responseData;
        const normalized = normalizeExtractedReport(rawToNormalize, `${targetBureau.toLowerCase()}_pull.json`);
        return {
          ok: true,
          providerName: this.name,
          bureau: targetBureau,
          score: normalized.score.score,
          vendorRef: responseData.vendorRef || responseData.referenceId,
          rawJson: responseData,
          normalized,
        };
      }

      // If vendor returns base64 PDF
      if (responseData.pdfBase64) {
        return {
          ok: true,
          providerName: this.name,
          bureau: targetBureau,
          score: responseData.score,
          pdfBase64: responseData.pdfBase64,
          vendorRef: responseData.vendorRef,
        };
      }

      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'PARSE_FAILED',
        errorMessage: 'Unrecognized response payload from bureau gateway.',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          ok: false,
          providerName: this.name,
          bureau: targetBureau,
          errorCode: 'VENDOR_ERROR',
          errorMessage: `Bureau pull request timed out after ${timeoutMs / 1000}s.`,
        };
      }
      return {
        ok: false,
        providerName: this.name,
        bureau: targetBureau,
        errorCode: 'VENDOR_ERROR',
        errorMessage: `Failed to contact credit bureau gateway: ${err?.message || 'Network error'}`,
      };
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}

export const defaultConsumerBureauProvider = new ConsumerBureauProvider();
