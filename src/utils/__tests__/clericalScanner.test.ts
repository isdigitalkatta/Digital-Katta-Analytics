import { scanReportForClericalErrors } from '../clericalErrorScanner.js';
import { NormalizedCreditReport } from '../../types.js';

export function runClericalScannerTests(): { total: number; passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✓ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`✗ FAIL: ${testName}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Duplicate Account Detection (Same lender, same amount, close dates)
  // --------------------------------------------------------------------------
  const duplicateReport: NormalizedCreditReport = {
    rawSourceType: 'JSON',
    fileName: 'test-report.json',
    parsedAt: '2026-09-10T10:00:00Z',
    personal: {
      name: 'Test Borrower',
      panMasked: 'ABCDE1234F',
      dateOfBirth: '15/06/1990',
      gender: 'Male',
      mobileMasked: '9876543210',
      emailMasked: 'borrower@example.com',
      address: '123 MG Road, Pune, Maharashtra 411001',
      state: 'Maharashtra',
      reportDate: '10/09/2026',
      reportNumber: 'TEST-001',
    },
    score: {
      score: 650,
      scoreName: 'CIBIL',
      scoreDate: '10/09/2026',
      category: 'Fair',
      riskLevel: 'Moderate',
      minScore: 300,
      maxScore: 900,
    },
    accounts: [
      {
        id: 'acc-dup-1',
        lender: 'Tata Capital Financial Services',
        accountType: 'Personal Loan',
        isCreditCard: false,
        isSecured: false,
        accountNumberMasked: 'XXXX-1102',
        accountNumberRaw: 'XXXX1102',
        openDate: '10/11/2023',
        lastReportedDate: '31/08/2026',
        sanctionedAmount: 50000,
        currentBalance: 12000,
        overdueAmount: 0,
        normalizedStatus: 'ACTIVE',
        rawStatus: 'Active',
        maxDPD: 0,
        severity: 'NONE',
        paymentHistory: [],
        negativeRemarks: [],
        ownershipType: 'Individual',
      },
      {
        id: 'acc-dup-2',
        lender: 'Tata Capital Financial Services Ltd',
        accountType: 'Personal Loan',
        isCreditCard: false,
        isSecured: false,
        accountNumberMasked: 'XXXX-1103',
        accountNumberRaw: 'XXXX1103',
        openDate: '10/11/2023',
        lastReportedDate: '31/08/2026',
        sanctionedAmount: 50000,
        currentBalance: 12000,
        overdueAmount: 0,
        normalizedStatus: 'ACTIVE',
        rawStatus: 'Active',
        maxDPD: 0,
        severity: 'NONE',
        paymentHistory: [],
        negativeRemarks: [],
        ownershipType: 'Individual',
      },
    ],
    enquiries: [],
    summary: {
      totalAccounts: 2,
      activeAccounts: 2,
      closedAccounts: 0,
      negativeAccounts: 0,
      totalSanctioned: 100000,
      totalOutstanding: 24000,
      totalOverdue: 0,
      creditCardsCount: 0,
      totalCreditCardLimit: 0,
      totalCreditCardBalance: 0,
      creditCardUtilizationPct: 0,
      oldestAccountDate: '10/11/2023',
      newestAccountDate: '10/11/2023',
      averageAccountAgeYears: 2.8,
      enquiriesCount: 0,
      enquiriesLast30Days: 0,
      enquiriesLast90Days: 0,
      enquiriesLast180Days: 0,
      securedLoansCount: 0,
      unsecuredLoansCount: 2,
    },
  };

  const dupDisputes = scanReportForClericalErrors(duplicateReport);
  const foundDup = dupDisputes.find((d) => d.clericalDetails?.category === 'DUPLICATE_ACCOUNT');

  assert(Boolean(foundDup), 'Duplicate account detected between identical lender trade lines');
  assert(foundDup?.isInstantDisputeCandidate === true, 'Duplicate account flagged as isInstantDisputeCandidate');
  assert(foundDup?.isClericalError === true, 'Duplicate account flagged as isClericalError');

  // --------------------------------------------------------------------------
  // TEST 2: Mismatched Birth Date (Underage Lending)
  // --------------------------------------------------------------------------
  const underageReport: NormalizedCreditReport = {
    ...duplicateReport,
    personal: {
      ...duplicateReport.personal,
      dateOfBirth: '15/06/2010', // Born in 2010, account opened in 2023 (age 13)
    },
    accounts: [duplicateReport.accounts[0]],
  };

  const underageDisputes = scanReportForClericalErrors(underageReport);
  const foundUnderage = underageDisputes.find(
    (d) => d.clericalDetails?.category === 'DATE_OF_BIRTH_MISMATCH' && d.issue.includes('Under Age')
  );

  assert(Boolean(foundUnderage), 'Underage lending clerical anomaly detected');
  assert(foundUnderage?.isInstantDisputeCandidate === true, 'Underage lending flagged as Instant Dispute candidate');

  // --------------------------------------------------------------------------
  // TEST 3: Pre-Birth Account Opening Date
  // --------------------------------------------------------------------------
  const preBirthReport: NormalizedCreditReport = {
    ...duplicateReport,
    personal: {
      ...duplicateReport.personal,
      dateOfBirth: '15/06/2025', // Born in 2025, account opened in 2023
    },
    accounts: [duplicateReport.accounts[0]],
  };

  const preBirthDisputes = scanReportForClericalErrors(preBirthReport);
  const foundPreBirth = preBirthDisputes.find(
    (d) => d.clericalDetails?.category === 'DATE_OF_BIRTH_MISMATCH' && d.issue.includes('Prior to Borrower Date of Birth')
  );

  assert(Boolean(foundPreBirth), 'Pre-birth account opening chronological contradiction detected');

  // --------------------------------------------------------------------------
  // TEST 4: Address Inaccuracy (State vs PIN prefix mismatch)
  // --------------------------------------------------------------------------
  const addressMismatchReport: NormalizedCreditReport = {
    ...duplicateReport,
    personal: {
      ...duplicateReport.personal,
      state: 'Maharashtra', // Maharashtra prefixes are 40-44
      address: 'Flat 402, Baner, Pune, Maharashtra 110045', // 11 is Delhi
    },
    accounts: [duplicateReport.accounts[0]],
  };

  const addressDisputes = scanReportForClericalErrors(addressMismatchReport);
  const foundAddressMismatch = addressDisputes.find(
    (d) => d.clericalDetails?.category === 'ADDRESS_INACCURACY' && d.issue.includes('Pincode')
  );

  assert(Boolean(foundAddressMismatch), 'State vs Postal Pincode mismatch detected');
  assert(foundAddressMismatch?.isInstantDisputeCandidate === true, 'Address mismatch flagged as Instant Dispute candidate');

  // --------------------------------------------------------------------------
  // TEST 5: Placeholder / Corrupted Address Line
  // --------------------------------------------------------------------------
  const placeholderAddrReport: NormalizedCreditReport = {
    ...duplicateReport,
    personal: {
      ...duplicateReport.personal,
      address: 'NOT PROVIDED, TEST ADDRESS DUMMY',
    },
    accounts: [duplicateReport.accounts[0]],
  };

  const placeholderDisputes = scanReportForClericalErrors(placeholderAddrReport);
  const foundPlaceholder = placeholderDisputes.find(
    (d) => d.clericalDetails?.category === 'ADDRESS_INACCURACY' && d.issue.includes('Placeholder Address')
  );

  assert(Boolean(foundPlaceholder), 'Placeholder / corrupt address tokens detected');

  // --------------------------------------------------------------------------
  // TEST 6: Mathematical Ledger Glitch (Current Balance = 0 with Overdue > 0)
  // --------------------------------------------------------------------------
  const zeroBalanceOverdueReport: NormalizedCreditReport = {
    ...duplicateReport,
    accounts: [
      {
        ...duplicateReport.accounts[0],
        currentBalance: 0,
        overdueAmount: 5500, // Mathematical impossibility
      },
    ],
  };

  const zeroBalDisputes = scanReportForClericalErrors(zeroBalanceOverdueReport);
  const foundZeroBal = zeroBalDisputes.find(
    (d) => d.clericalDetails?.category === 'MATHEMATICAL_LEDGER' && d.issue.includes('Zero-Balance')
  );

  assert(Boolean(foundZeroBal), 'Zero-balance overdue ledger contradiction detected');
  assert(foundZeroBal?.isInstantDisputeCandidate === true, 'Zero-balance overdue flagged as Instant Dispute candidate');

  // --------------------------------------------------------------------------
  // TEST 7: Closed Account Marked Active with Overdue
  // --------------------------------------------------------------------------
  const closedActiveReport: NormalizedCreditReport = {
    ...duplicateReport,
    accounts: [
      {
        ...duplicateReport.accounts[0],
        closedDate: '15/03/2024',
        normalizedStatus: 'ACTIVE',
        overdueAmount: 3200,
      },
    ],
  };

  const closedDisputes = scanReportForClericalErrors(closedActiveReport);
  const foundClosedActive = closedDisputes.find(
    (d) => d.clericalDetails?.category === 'MATHEMATICAL_LEDGER' && d.issue.includes('Closed Facility Still Reported')
  );

  assert(Boolean(foundClosedActive), 'Closed facility still marked active/overdue detected');

  // --------------------------------------------------------------------------
  // TEST 8: PAN Syntax Data-Entry Typo
  // --------------------------------------------------------------------------
  const panTypoReport: NormalizedCreditReport = {
    ...duplicateReport,
    personal: {
      ...duplicateReport.personal,
      pan: 'ABCDE12345', // 5 numbers instead of 4 numbers + 1 letter
    },
    accounts: [duplicateReport.accounts[0]],
  };

  const panDisputes = scanReportForClericalErrors(panTypoReport);
  const foundPanTypo = panDisputes.find((d) => d.clericalDetails?.category === 'IDENTITY_CLERICAL');

  assert(Boolean(foundPanTypo), 'Malformed PAN syntax typo detected');

  return { total: passed + failed, passed, failed, results };
}

// Auto-run if executed via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('clericalScanner.test')) {
  const { total, passed, failed, results } = runClericalScannerTests();
  console.log(`\n=== Digital Katta Clerical Error Scanner Test Suite ===`);
  results.forEach((r) => console.log(r));
  console.log(`Summary: ${passed}/${total} passed\n`);
  if (failed > 0) process.exit(1);
}
