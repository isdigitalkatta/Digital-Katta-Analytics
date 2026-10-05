import {
  CreditAccount,
  DisputeOpportunity,
  NormalizedCreditReport,
  ClericalErrorDetails,
} from '../types';

/**
 * State to Indian Postal PIN Code 2-digit prefix mapping
 * Used to cross-check address records for clerical state/pincode inconsistencies
 */
const STATE_PIN_PREFIX_MAP: Record<string, number[]> = {
  DELHI: [11],
  HARYANA: [12, 13],
  PUNJAB: [14, 15],
  CHANDIGARH: [16],
  HIMACHAL: [17],
  'HIMACHAL PRADESH': [17],
  'JAMMU & KASHMIR': [18, 19],
  'JAMMU AND KASHMIR': [18, 19],
  'UTTAR PRADESH': [20, 21, 22, 23, 24, 25, 26, 27, 28],
  UTTARAKHAND: [24, 26],
  RAJASTHAN: [30, 31, 32, 33, 34],
  GUJARAT: [36, 37, 38, 39],
  MAHARASHTRA: [40, 41, 42, 43, 44],
  GOA: [40],
  'MADHYA PRADESH': [45, 46, 47, 48, 49],
  CHHATTISGARH: [49],
  'ANDHRA PRADESH': [51, 52, 53],
  TELANGANA: [50],
  KARNATAKA: [56, 57, 58, 59],
  'TAMIL NADU': [60, 61, 62, 63, 64],
  KERALA: [67, 68, 69],
  'WEST BENGAL': [70, 71, 72, 73, 74],
  ODISHA: [75, 76, 77],
  ASSAM: [78],
  BIHAR: [80, 81, 82, 83, 84, 85],
  JHARKHAND: [81, 82, 83],
};

/**
 * Helper: Parse DD/MM/YYYY or YYYY-MM-DD into a valid Date object
 */
function parseDateFlexible(dateStr?: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();
  if (!clean) return null;

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  // DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normalize bank / lender names for comparison (strips Ltd, Bank, Finance, NBFC, etc.)
 */
function normalizeLenderName(lender: string): string {
  return (lender || '')
    .toLowerCase()
    .replace(/\b(limited|ltd|bank|finance|financial services|finserv|housing finance|credit|corporation|nbfc)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Main automated scanner for common clerical errors in Indian credit reports
 * Flags detected discrepancies specifically as Instant Dispute candidates.
 */
export function scanReportForClericalErrors(report: NormalizedCreditReport): DisputeOpportunity[] {
  const instantDisputes: DisputeOpportunity[] = [];
  const { personal, accounts = [] } = report;

  // --------------------------------------------------------------------------
  // 1. DUPLICATE ACCOUNT DETECTION (CBS Migration / Parallel Feed Glitches)
  // --------------------------------------------------------------------------
  const duplicatePairsSeen = new Set<string>();

  for (let i = 0; i < accounts.length; i++) {
    for (let j = i + 1; j < accounts.length; j++) {
      const a = accounts[i];
      const b = accounts[j];

      const normLenderA = normalizeLenderName(a.lender);
      const normLenderB = normalizeLenderName(b.lender);

      // Same lender
      const isSameLender = normLenderA === normLenderB || normLenderA.includes(normLenderB) || normLenderB.includes(normLenderA);
      if (!isSameLender) continue;

      // Both loans or both credit cards
      const sameCategory = a.isCreditCard === b.isCreditCard;
      if (!sameCategory) continue;

      // Identical or near identical sanctioned amount (within ₹10)
      const sameAmount = a.sanctionedAmount > 0 && Math.abs(a.sanctionedAmount - b.sanctionedAmount) <= 10;

      // Same or near identical open date
      const dateA = parseDateFlexible(a.openDate);
      const dateB = parseDateFlexible(b.openDate);
      let sameDate = false;
      if (dateA && dateB) {
        const diffDays = Math.abs(dateA.getTime() - dateB.getTime()) / (1000 * 60 * 60 * 24);
        sameDate = diffDays <= 45; // Within 45 days (often core banking batch rebilling)
      } else if (a.openDate && b.openDate && a.openDate.trim() === b.openDate.trim()) {
        sameDate = true;
      }

      // Check account numbers: same masked number or 1-digit difference
      const numA = (a.accountNumberRaw || a.accountNumberMasked || '').replace(/[^0-9]/g, '');
      const numB = (b.accountNumberRaw || b.accountNumberMasked || '').replace(/[^0-9]/g, '');
      const closeAccountNumbers = (numA && numB && numA.slice(-3) === numB.slice(-3)) || (numA.length > 0 && numA === numB);
      const exactSameAccountNum = (a.accountNumberRaw && b.accountNumberRaw && a.accountNumberRaw === b.accountNumberRaw) ||
        (a.accountNumberMasked && b.accountNumberMasked && a.accountNumberMasked === b.accountNumberMasked && a.accountNumberMasked !== 'XXXX');

      if ((sameAmount && (sameDate || closeAccountNumbers)) || (sameDate && closeAccountNumbers) || exactSameAccountNum) {
        const pairKey = [a.id, b.id].sort().join('::');
        if (duplicatePairsSeen.has(pairKey)) continue;
        duplicatePairsSeen.add(pairKey);

        const clericalDetails: ClericalErrorDetails = {
          category: 'DUPLICATE_ACCOUNT',
          categoryLabel: 'Duplicate Trade Line Entry',
          field: 'Account Details & Sanction Amount',
          foundValue: `${a.lender} (${a.accountNumberMasked}) & ${b.lender} (${b.accountNumberMasked})`,
          expectedOrContradictingValue: 'Single individual credit facility',
          explanation: `Two trade lines from ${a.lender} share identical sanctioned amounts (₹${a.sanctionedAmount.toLocaleString('en-IN')}) and overlapping open dates (${a.openDate} vs ${b.openDate}). In Core Banking System (CBS) migrations, lenders frequently batch-feed duplicate records under varying internal sequence numbers, falsely doubling borrower liability.`,
          legalGround: 'Section 21 of Credit Information Companies (Regulation) Act, 2005 (Inaccuracy of Information) & RBI Master Direction DBR.No.CID.BC.60/20.16.056.',
          resolutionTimeframeDays: 15,
          estimatedScoreImpactPoints: 35,
          isInstantCandidate: true,
          requiredDocuments: [
            'Loan Sanction Letter showing single sanction',
            'Bank Statement confirming only one disbursement was received',
            'PAN Card Copy',
          ],
          disputeNoticeType: 'Clerical Error: Duplicate Account Removal',
        };

        instantDisputes.push({
          id: `disp-clerical-dup-${a.id}-${b.id}`,
          accountId: b.id,
          issue: `Clerical Error: Duplicate Trade Line at ${a.lender}`,
          evidenceFromReport: `Account ${a.accountNumberMasked} (₹${a.sanctionedAmount.toLocaleString('en-IN')}, Open: ${a.openDate}) matches Account ${b.accountNumberMasked} (₹${b.sanctionedAmount.toLocaleString('en-IN')}, Open: ${b.openDate}).`,
          whyInconsistent: 'A single loan facility was reported twice by the member bank, artificially inflating total debt and utilization ratios.',
          evidenceToProvide: 'Original loan sanction letter & bank statement demonstrating a single disbursement.',
          recommendedRoute: 'CIBIL Dispute Portal',
          confidence: 'HIGH',
          isClericalError: true,
          isInstantDisputeCandidate: true,
          clericalDetails,
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. DATE OF BIRTH (DOB) ANOMALIES & UNDERAGE LENDING
  // --------------------------------------------------------------------------
  if (personal?.dateOfBirth) {
    const dob = parseDateFlexible(personal.dateOfBirth);
    if (dob) {
      const now = new Date();
      const currentAge = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      // Check impossible birth year (e.g. future date, or age > 100, or age < 18)
      if (dob > now) {
        instantDisputes.push({
          id: 'disp-clerical-dob-future',
          issue: 'Clerical Error: Date of Birth Reported in the Future',
          evidenceFromReport: `Date of birth on record is ${personal.dateOfBirth}, which is in the future.`,
          whyInconsistent: 'Bureau identity record contains an obvious clerical date-entry transposition.',
          evidenceToProvide: 'Valid government ID (PAN Card, Passport, or Aadhaar) showing authentic DOB.',
          recommendedRoute: 'CIBIL Dispute Portal',
          confidence: 'HIGH',
          isClericalError: true,
          isInstantDisputeCandidate: true,
          clericalDetails: {
            category: 'DATE_OF_BIRTH_MISMATCH',
            categoryLabel: 'Invalid Date of Birth Record',
            field: 'Personal Information: Date of Birth',
            foundValue: personal.dateOfBirth,
            expectedOrContradictingValue: 'Valid past calendar date',
            explanation: 'Bureau database holds a future-dated birthdate record causing automatic validation flags in bank loan origination systems.',
            legalGround: 'Section 21 of CICRA 2005 (Mandatory Accuracy of Identity Records).',
            resolutionTimeframeDays: 10,
            estimatedScoreImpactPoints: 15,
            isInstantCandidate: true,
            requiredDocuments: ['PAN Card', 'Aadhaar Card', 'Birth Certificate or Passport'],
            disputeNoticeType: 'Clerical Error: Date of Birth Rectification',
          },
        });
      }

      // Check if accounts were opened when borrower was under 18 or prior to birth
      accounts.forEach(acc => {
        const openDate = parseDateFlexible(acc.openDate);
        if (openDate) {
          const ageAtOpen = (openDate.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
          if (ageAtOpen <= 0) {
            instantDisputes.push({
              id: `disp-clerical-prebirth-${acc.id}`,
              accountId: acc.id,
              issue: `Clerical Error: Account Opened Prior to Borrower Date of Birth at ${acc.lender}`,
              evidenceFromReport: `Account opened on ${acc.openDate} while borrower DOB on record is ${personal.dateOfBirth}.`,
              whyInconsistent: 'Chronologically impossible record: facility was opened before borrower birth date, indicating clerical misattribution or file merge bug.',
              evidenceToProvide: 'Official PAN / Passport copy verifying correct legal age alongside sanction letter.',
              recommendedRoute: 'CIBIL Dispute Portal',
              confidence: 'HIGH',
              isClericalError: true,
              isInstantDisputeCandidate: true,
              clericalDetails: {
                category: 'DATE_OF_BIRTH_MISMATCH',
                categoryLabel: 'Chronological Birth Date Contradiction',
                field: `Account Opening Date vs Borrower DOB (${acc.lender})`,
                foundValue: `Account opened ${acc.openDate} vs DOB ${personal.dateOfBirth}`,
                expectedOrContradictingValue: 'Account opening date must succeed birth date by at least 18 years',
                explanation: `The credit bureau record displays an account opened prior to the consumer's date of birth. This is an indisputable clerical error under Section 21 of CICRA 2005.`,
                legalGround: 'Section 21 of CICRA 2005 & RBI Master Direction on Credit Information.',
                resolutionTimeframeDays: 10,
                estimatedScoreImpactPoints: 35,
                isInstantCandidate: true,
                requiredDocuments: ['PAN Card Copy', 'Aadhaar Card Copy', 'Loan Sanction Letter'],
                disputeNoticeType: 'Clerical Error: Pre-Birth Account Opening Rectification',
              },
            });
          } else if (ageAtOpen > 0 && ageAtOpen < 18) {
            const roundedAge = Math.floor(ageAtOpen);
            instantDisputes.push({
              id: `disp-clerical-underage-${acc.id}`,
              accountId: acc.id,
              issue: `Clerical Error: Loan Opened Under Age of Majority at ${acc.lender}`,
              evidenceFromReport: `Account opened on ${acc.openDate} while borrower DOB is ${personal.dateOfBirth} (Borrower was ${roundedAge} years old at opening).`,
              whyInconsistent: 'Under Section 11 of the Indian Contract Act 1872 & RBI KYC Directions, minors cannot enter unsecured credit contracts. This represents a clerical data entry error by bank branch operators in the birthdate or sanction date.',
              evidenceToProvide: 'Official PAN / Passport copy verifying correct legal age alongside sanction letter.',
              recommendedRoute: 'Lender Nodal/Grievance',
              confidence: 'HIGH',
              isClericalError: true,
              isInstantDisputeCandidate: true,
              clericalDetails: {
                category: 'DATE_OF_BIRTH_MISMATCH',
                categoryLabel: 'Underage Account Opening Anomaly',
                field: `Account Opening Date vs Borrower DOB (${acc.lender})`,
                foundValue: `Age ${roundedAge} at opening (${acc.openDate})`,
                expectedOrContradictingValue: 'Age 18+ for legal credit agreement',
                explanation: `Account opened on ${acc.openDate} violates Section 11 of Indian Contract Act 1872 if recorded DOB (${personal.dateOfBirth}) is accurate. The branch either logged an incorrect birth year or erroneously linked a guardian facility to a minor PAN.`,
                legalGround: 'Section 11 Indian Contract Act 1872 & Section 21 of CICRA 2005.',
                resolutionTimeframeDays: 15,
                estimatedScoreImpactPoints: 30,
                isInstantCandidate: true,
                requiredDocuments: ['PAN Card Copy', 'Birth Certificate / Passport', 'Loan Agreement'],
                disputeNoticeType: 'Clerical Error: Underage / DOB Rectification',
              },
            });
          }
        }
      });
    } else {
      instantDisputes.push({
        id: 'disp-clerical-dob-syntax',
        issue: 'Clerical Error: Corrupted Date of Birth Syntax in Bureau Header',
        evidenceFromReport: `Date of birth on record is "${personal.dateOfBirth}".`,
        whyInconsistent: 'Date of birth is not in a recognized calendar format (DD/MM/YYYY or YYYY-MM-DD).',
        evidenceToProvide: 'Government ID (PAN Card / Aadhaar / Passport) showing accurate birth date.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'DATE_OF_BIRTH_MISMATCH',
          categoryLabel: 'Corrupted Birth Date Syntax',
          field: 'Personal Profile: Date of Birth',
          foundValue: personal.dateOfBirth,
          expectedOrContradictingValue: 'Valid DD/MM/YYYY calendar date',
          explanation: 'Bureau database holds an invalid date format token, preventing automated KYC verification.',
          legalGround: 'Section 21 of CICRA 2005.',
          resolutionTimeframeDays: 10,
          estimatedScoreImpactPoints: 15,
          isInstantCandidate: true,
          requiredDocuments: ['PAN Card Copy', 'Aadhaar Card Copy'],
          disputeNoticeType: 'Clerical Error: Date of Birth Rectification',
        },
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. ADDRESS & POSTAL PINCODE INACCURACIES
  // --------------------------------------------------------------------------
  if (personal?.address) {
    const rawAddr = personal.address.trim();
    const upperAddr = rawAddr.toUpperCase();

    // Check placeholder / corrupt address lines
    const isPlaceholder = /(?:NOT PROVIDED|SAME AS ABOVE|\bNA\b|\bN\/A\b|TEST ADDRESS|DUMMY|UNKNOWN ADDRESS|XXXX)/i.test(upperAddr);
    if (isPlaceholder) {
      instantDisputes.push({
        id: 'disp-clerical-addr-dummy',
        issue: 'Clerical Error: Corrupted / Placeholder Address in Bureau Record',
        evidenceFromReport: `Address recorded as "${rawAddr}".`,
        whyInconsistent: 'Financial institutions must report verified KYC address records under RBI Master Direction on Credit Information.',
        evidenceToProvide: 'Utility Bill (Electricity/Piped Gas) / Aadhaar Card / Passport showing actual address.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'ADDRESS_INACCURACY',
          categoryLabel: 'Placeholder Address Correction',
          field: 'Personal Profile: Contact Address',
          foundValue: rawAddr,
          expectedOrContradictingValue: 'Verified physical address',
          explanation: 'A member institution uploaded a system placeholder token instead of authentic verified KYC address data, creating address verification failures during credit card and loan underwriting.',
          legalGround: 'Section 21 CICRA 2005 & RBI KYC Master Directions.',
          resolutionTimeframeDays: 10,
          estimatedScoreImpactPoints: 10,
          isInstantCandidate: true,
          requiredDocuments: ['Aadhaar Card (Masked)', 'Latest Electricity / Water Bill', 'Passport'],
          disputeNoticeType: 'Clerical Error: Address Record Update',
        },
      });
    }

    // Check dummy/invalid PIN codes like 000000 or 999999
    const dummyPinMatch = rawAddr.match(/\b(000000|999999|111111|123456)\b/);
    if (dummyPinMatch) {
      instantDisputes.push({
        id: 'disp-clerical-addr-dummy-pin',
        issue: 'Clerical Error: Dummy / Invalid Postal PIN Code in Address Record',
        evidenceFromReport: `Address contains invalid dummy PIN code "${dummyPinMatch[1]}".`,
        whyInconsistent: 'Dummy PIN codes violate India Post postal standards and trigger automated underwriting rejections.',
        evidenceToProvide: 'Aadhaar Card or Utility Bill confirming true postal PIN code.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'ADDRESS_INACCURACY',
          categoryLabel: 'Invalid Placeholder Postal PIN',
          field: 'Personal Profile: Address PIN Code',
          foundValue: dummyPinMatch[1],
          expectedOrContradictingValue: 'Valid 6-digit India Post postal PIN code',
          explanation: 'Lender member system submitted an unverified dummy placeholder PIN code into the bureau registry.',
          legalGround: 'Section 21 of CICRA 2005.',
          resolutionTimeframeDays: 10,
          estimatedScoreImpactPoints: 10,
          isInstantCandidate: true,
          requiredDocuments: ['Aadhaar Card (Masked)', 'Latest Electricity / Water Bill'],
          disputeNoticeType: 'Clerical Error: Address Pincode Rectification',
        },
      });
    }

    // Check PIN Code
    const pinMatch = rawAddr.match(/\b([1-9][0-9]{5})\b/);
    const statedState = (personal.state || '').toUpperCase().trim();

    if (pinMatch && statedState) {
      const pin = pinMatch[1];
      const prefix = parseInt(pin.slice(0, 2), 10);
      const allowedPrefixes = STATE_PIN_PREFIX_MAP[statedState];

      if (allowedPrefixes && !allowedPrefixes.includes(prefix)) {
        instantDisputes.push({
          id: 'disp-clerical-addr-pin-mismatch',
          issue: `Clerical Error: Address Pincode (${pin}) Inconsistent with State (${personal.state})`,
          evidenceFromReport: `Report indicates PIN ${pin} for state ${personal.state}.`,
          whyInconsistent: `India Post PIN prefix '${pin.slice(0, 2)}' does not belong to ${personal.state}. This clerical error creates geo-demographic risk flag anomalies in automated loan scorecards.`,
          evidenceToProvide: 'Aadhaar / Utility Bill confirming true postal address and PIN code.',
          recommendedRoute: 'CIBIL Dispute Portal',
          confidence: 'HIGH',
          isClericalError: true,
          isInstantDisputeCandidate: true,
          clericalDetails: {
            category: 'ADDRESS_INACCURACY',
            categoryLabel: 'Postal Pincode Geographical Mismatch',
            field: 'Address: Postal Pincode vs State',
            foundValue: `PIN ${pin} in ${personal.state}`,
            expectedOrContradictingValue: `Valid ${personal.state} postal zone (Prefixes: ${allowedPrefixes.join(', ')})`,
            explanation: `PIN code ${pin} is assigned to a different postal circle by India Post than ${personal.state}. Branch data-entry clerks frequently transpose or mix address fields from prior applicants.`,
            legalGround: 'Section 21 CICRA 2005 (Right to Accurate Credit Profile).',
            resolutionTimeframeDays: 12,
            estimatedScoreImpactPoints: 15,
            isInstantCandidate: true,
            requiredDocuments: ['Aadhaar Card Copy', 'Recent Bank Statement with Address', 'Electricity Bill'],
            disputeNoticeType: 'Clerical Error: Pincode Correction',
          },
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. MATHEMATICAL & LEDGER CLERICAL CONTRADICTIONS
  // --------------------------------------------------------------------------
  accounts.forEach(acc => {
    // Error A: Current Balance = 0 but Overdue Amount > 0
    if (acc.currentBalance === 0 && acc.overdueAmount > 0) {
      instantDisputes.push({
        id: `disp-clerical-bal-zero-${acc.id}`,
        accountId: acc.id,
        issue: `Clerical Error: Overdue Reported on Zero-Balance Account at ${acc.lender}`,
        evidenceFromReport: `Current Balance: ₹0 | Overdue Amount Reported: ₹${acc.overdueAmount.toLocaleString('en-IN')}.`,
        whyInconsistent: 'An overdue balance cannot mathematically exist when the total outstanding balance is zero. This is a known bureau batch feed bug where overdue flags remain unpurged post full payment.',
        evidenceToProvide: 'Zero-balance statement / account closure letter from bank branch.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'MATHEMATICAL_LEDGER',
          categoryLabel: 'Mathematical Contradiction (Overdue on Nil Balance)',
          field: `${acc.lender} Balance & Overdue Fields`,
          foundValue: `Balance ₹0, Overdue ₹${acc.overdueAmount.toLocaleString('en-IN')}`,
          expectedOrContradictingValue: 'Overdue must be ₹0 when Balance is ₹0',
          explanation: 'Accounting principles dictate that past-due balance is a subset of gross balance. A nil balance with positive overdue is an undeniable clerical error that causes immediate score point deductions every cycle.',
          legalGround: 'Section 21 of CICRA 2005 & RBI Circular on Inaccurate Default Reporting.',
          resolutionTimeframeDays: 15,
          estimatedScoreImpactPoints: 40,
          isInstantCandidate: true,
          requiredDocuments: ['Latest Bank Statement showing ₹0 Balance', 'Payment Confirmation Slip', 'Bank NOC'],
          disputeNoticeType: 'Clerical Error: Zero Balance Overdue Glitch',
        },
      });
    }

    // Error B: Closed Account with Active Overdue / Active Status
    if (acc.closedDate && (acc.normalizedStatus === 'ACTIVE' || acc.overdueAmount > 0)) {
      instantDisputes.push({
        id: `disp-clerical-closed-active-${acc.id}`,
        accountId: acc.id,
        issue: `Clerical Error: Closed Facility Still Reported Active/Overdue at ${acc.lender}`,
        evidenceFromReport: `Closure Date: ${acc.closedDate}, yet status is "${acc.rawStatus}" with Overdue ₹${acc.overdueAmount.toLocaleString('en-IN')}.`,
        whyInconsistent: 'Once a loan is formally closed with a documented closure date, ongoing status updates and overdue accruals are clerical inaccuracies.',
        evidenceToProvide: 'Lender No Dues Certificate (NOC) or Loan Closure Letter.',
        recommendedRoute: 'Lender Nodal/Grievance',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'MATHEMATICAL_LEDGER',
          categoryLabel: 'Post-Closure Overdue Flag Error',
          field: `${acc.lender} Account Status & Closed Date`,
          foundValue: `Closed on ${acc.closedDate} but marked Active / Overdue ₹${acc.overdueAmount.toLocaleString('en-IN')}`,
          expectedOrContradictingValue: 'Status: CLOSED, Balance: ₹0, Overdue: ₹0',
          explanation: 'The loan was paid and closed on the recorded date, but the lender operations desk failed to send the final "CLOSED" status code to the credit bureau, leaving active delinquency marks.',
          legalGround: 'Section 21 CICRA 2005 & RBI Ombudsman Scheme (Deficiency in Reporting Closed Accounts).',
          resolutionTimeframeDays: 20,
          estimatedScoreImpactPoints: 45,
          isInstantCandidate: true,
          requiredDocuments: ['No Objection Certificate (NOC)', 'Loan Payoff Letter', 'Final Zero Balance Receipt'],
          disputeNoticeType: 'Clerical Error: Closed Account Update',
        },
      });
    }

    // Error C: Credit Card with 0 limit but carrying active balance
    if (acc.isCreditCard && acc.sanctionedAmount === 0 && acc.currentBalance > 0) {
      instantDisputes.push({
        id: `disp-clerical-card-limit-${acc.id}`,
        accountId: acc.id,
        issue: `Clerical Error: Missing Credit Card Limit at ${acc.lender}`,
        evidenceFromReport: `Credit Limit reported as ₹0 while Balance is ₹${acc.currentBalance.toLocaleString('en-IN')}.`,
        whyInconsistent: 'Reporting ₹0 limit causes the bureau algorithm to calculate 100%+ utilization, devastating the credit score.',
        evidenceToProvide: 'Monthly credit card statement showing actual sanctioned limit.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'MATHEMATICAL_LEDGER',
          categoryLabel: 'Missing Credit Limit Clerical Omission',
          field: `${acc.lender} Sanctioned Credit Limit`,
          foundValue: '₹0 Limit with active balance',
          expectedOrContradictingValue: 'Actual approved credit limit (e.g. ₹50,000+)',
          explanation: 'Lender omitted the credit limit field in the monthly bureau submission. The bureau algorithm interprets this as an over-limit card at 100%+ utilization, imposing heavy mathematical score penalties.',
          legalGround: 'Section 21 CICRA 2005 (Full & Complete Data Submission Mandate).',
          resolutionTimeframeDays: 15,
          estimatedScoreImpactPoints: 30,
          isInstantCandidate: true,
          requiredDocuments: ['Latest Credit Card Statement displaying Approved Limit'],
          disputeNoticeType: 'Clerical Error: Credit Limit Updation',
        },
      });
    }
  });

  // --------------------------------------------------------------------------
  // 5. PAN SYNTAX / IDENTITY HEADER CLERICAL ERRORS
  // --------------------------------------------------------------------------
  if (personal?.pan) {
    const rawPan = personal.pan.trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(rawPan) && rawPan !== 'NOT PROVIDED') {
      instantDisputes.push({
        id: 'disp-clerical-pan-syntax',
        issue: 'Clerical Error: Malformed PAN Syntax in Bureau Record',
        evidenceFromReport: `PAN is recorded as "${rawPan}".`,
        whyInconsistent: 'Standard Indian Permanent Account Number requires 5 uppercase letters, 4 digits, and 1 letter (e.g. ABCDE1234F).',
        evidenceToProvide: 'Original PAN Card copy or e-PAN download from Income Tax portal.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
        isClericalError: true,
        isInstantDisputeCandidate: true,
        clericalDetails: {
          category: 'IDENTITY_CLERICAL',
          categoryLabel: 'PAN Syntax Data-Entry Typo',
          field: 'Personal Profile: Permanent Account Number (PAN)',
          foundValue: rawPan,
          expectedOrContradictingValue: '10-character alphanumeric PAN (AAAAA9999A)',
          explanation: 'A data entry operator mistyped numbers or substituted the letter O for 0. This typographical error can cause cross-linking with another borrower file.',
          legalGround: 'Section 21 of CICRA 2005 (Mandatory Accuracy of Tax Identification Numbers).',
          resolutionTimeframeDays: 10,
          estimatedScoreImpactPoints: 20,
          isInstantCandidate: true,
          requiredDocuments: ['Copy of Government PAN Card', 'Income Tax e-Filing Profile Screenshot'],
          disputeNoticeType: 'Clerical Error: PAN Typo Rectification',
        },
      });
    }
  }

  return instantDisputes;
}
