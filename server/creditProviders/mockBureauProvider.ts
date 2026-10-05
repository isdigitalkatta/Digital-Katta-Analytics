import { maskPan, maskMobile } from '../../src/utils/normalizer.js';
import { normalizeExtractedReport } from '../reportNormalizer.js';
import {
  BureauName,
  type CreditBureauProvider,
  type BureauPullRequest,
  type BureauPullResult,
} from './types.js';

/**
 * Mock Bureau Provider (Deterministic Sandbox)
 * Used strictly for safe testing without connecting to live bureaus.
 */
export class MockBureauProvider implements CreditBureauProvider {
  readonly id = 'mock-bureau';
  readonly name = 'Digital Katta Sandbox Credit Bureau';

  isAvailable(): boolean {
    return true;
  }

  async pullReport(req: BureauPullRequest): Promise<BureauPullResult> {
    // 1. Mandatory consent check
    if (!req.consentAccepted) {
      return {
        ok: false,
        providerName: this.name,
        bureau: req.bureau || BureauName.CIBIL,
        errorCode: 'CONSENT_REQUIRED',
        errorMessage: 'Borrower consent is strictly mandatory under DPDP Act 2023.',
      };
    }

    // 2. Mandatory purpose check
    if (req.purpose !== 'CONSUMER_SELF_VIEW') {
      return {
        ok: false,
        providerName: this.name,
        bureau: req.bureau || BureauName.CIBIL,
        errorCode: 'VENDOR_ERROR',
        errorMessage: 'Invalid purpose. Only CONSUMER_SELF_VIEW is authorized for consumer pulls.',
      };
    }

    // 3. Mandatory OTP verification check
    if (!req.otpVerified) {
      return {
        ok: false,
        providerName: this.name,
        bureau: req.bureau || BureauName.CIBIL,
        errorCode: 'OTP_REQUIRED',
        errorMessage: 'Mobile OTP verification must be completed prior to bureau pull.',
      };
    }

    const maskedPan = maskPan(req.pan || 'ABCDE1234F');
    const maskedMobile = maskMobile(req.mobile || '9876543210');
    const today = new Date().toISOString().split('T')[0];

    // Generate deterministic sandbox trade lines
    const mockRawData = {
      personal: {
        name: req.name || 'Sandbox Borrower',
        pan: maskedPan,
        panMasked: maskedPan,
        mobileMasked: maskedMobile,
        dateOfBirth: req.dob || '1990-05-15',
        reportDate: today,
        reportNumber: `SB-${Date.now().toString().slice(-8)}`,
      },
      score: {
        score: 685,
        scoreName: `${req.bureau || 'CIBIL'} Score`,
        scoreDate: today,
      },
      accounts: [
        {
          lender: 'HDFC Bank Ltd',
          accountType: 'Personal Loan',
          isCreditCard: false,
          isSecured: false,
          accountNumber: 'XXXX-XXXX-4819',
          openDate: '15/03/2023',
          lastReportedDate: '31/08/2026',
          sanctionedAmount: 250000,
          currentBalance: 85400,
          overdueAmount: 0,
          rawStatus: 'Active',
          normalizedStatus: 'ACTIVE',
          maxDPD: 0,
          paymentHistory: [
            { month: '08/26', monthName: 'Aug', year: 2026, dpd: '000', status: 'NORMAL' },
            { month: '07/26', monthName: 'Jul', year: 2026, dpd: '000', status: 'NORMAL' },
            { month: '06/26', monthName: 'Jun', year: 2026, dpd: '000', status: 'NORMAL' },
          ],
          negativeRemarks: [],
        },
        {
          lender: 'ICICI Bank Cards',
          accountType: 'Credit Card',
          isCreditCard: true,
          isSecured: false,
          accountNumber: 'XXXX-XXXX-9102',
          openDate: '10/11/2021',
          lastReportedDate: '31/08/2026',
          sanctionedAmount: 100000,
          currentBalance: 78000,
          overdueAmount: 0,
          rawStatus: 'Active',
          normalizedStatus: 'ACTIVE',
          maxDPD: 0,
          paymentHistory: [
            { month: '08/26', monthName: 'Aug', year: 2026, dpd: '000', status: 'NORMAL' },
            { month: '07/26', monthName: 'Jul', year: 2026, dpd: '000', status: 'NORMAL' },
          ],
          negativeRemarks: ['High credit card utilization (78%)'],
        },
        {
          lender: 'Bajaj Finance Ltd',
          accountType: 'Consumer Durable Loan',
          isCreditCard: false,
          isSecured: false,
          accountNumber: 'XXXX-XXXX-3341',
          openDate: '05/01/2022',
          closedDate: '20/02/2024',
          lastReportedDate: '28/02/2024',
          sanctionedAmount: 45000,
          currentBalance: 0,
          overdueAmount: 0,
          rawStatus: 'Settled',
          normalizedStatus: 'SETTLED',
          maxDPD: 60,
          paymentHistory: [
            { month: '02/24', monthName: 'Feb', year: 2024, dpd: '060', status: 'LATE_60' },
            { month: '01/24', monthName: 'Jan', year: 2024, dpd: '030', status: 'LATE_30' },
          ],
          negativeRemarks: ['Settled with concession'],
        },
      ],
      enquiries: [
        {
          date: '10/08/2026',
          institution: 'Axis Bank',
          purpose: 'Credit Card',
          amount: 150000,
        },
      ],
    };

    const chosenBureau = req.bureau || BureauName.CIBIL;
    const normalized = normalizeExtractedReport(mockRawData, `sandbox_${chosenBureau.toLowerCase()}_report.json`);

    return {
      ok: true,
      providerName: this.name,
      bureau: req.bureau || BureauName.CIBIL,
      score: normalized.score.score,
      vendorRef: `SB-MOCK-${Date.now()}`,
      normalized,
    };
  }
}

export const defaultMockBureauProvider = new MockBureauProvider();
