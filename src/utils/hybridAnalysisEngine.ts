import {
  AIAnalysisResult,
  ActionPlan,
  CreditAccount,
  DisputeOpportunity,
  NegativeAccountAnalysis,
  NormalizedCreditReport,
  RankedFactor,
  SeverityLevel,
} from '../types';

/**
 * Deterministic analysis engine that calculates factual metrics,
 * identifies negative accounts, flags potential disputes, and builds ranked factors.
 */
export function runDeterministicAnalysis(report: NormalizedCreditReport): AIAnalysisResult {
  const { score, accounts, enquiries, summary } = report;

  // 1. Credit Health 1-100 index
  let healthScore100 = Math.round(((score.score - 300) / 600) * 100);
  if (healthScore100 < 10) healthScore100 = 10;
  if (healthScore100 > 100) healthScore100 = 100;

  // 2. Identify Negative Accounts & Problems
  const negativeAccounts: NegativeAccountAnalysis[] = [];
  const criticalIssues: AIAnalysisResult['criticalIssues'] = [];

  let totalLateCount = 0;
  let dpd30PlusCount = 0;
  let dpd60PlusCount = 0;
  let dpd90PlusCount = 0;

  accounts.forEach(acc => {
    acc.paymentHistory.forEach(ph => {
      const d = typeof ph.dpd === 'number' ? ph.dpd : parseInt(ph.dpd, 10) || 0;
      if (d > 0 || ph.status !== 'NORMAL') {
        totalLateCount++;
        if (d >= 90 || ph.status === 'LATE_90_PLUS' || ph.status === 'WRITTEN_OFF') dpd90PlusCount++;
        else if (d >= 60 || ph.status === 'LATE_60') dpd60PlusCount++;
        else if (d >= 30 || ph.status === 'LATE_30') dpd30PlusCount++;
      }
    });

    const isWrittenOff = acc.normalizedStatus === 'WRITTEN_OFF';
    const isSettled = acc.normalizedStatus === 'SETTLED';
    const isDelinquent = acc.normalizedStatus === 'DELINQUENT' || acc.overdueAmount > 0;
    const isHighDpd = acc.maxDPD >= 30;
    const isHighUtilization = acc.isCreditCard && acc.sanctionedAmount > 0 && (acc.currentBalance / acc.sanctionedAmount) > 0.8;

    if (isWrittenOff || isSettled || isDelinquent || isHighDpd || isHighUtilization) {
      let problem = '';
      let whyItMatters = '';
      let whatToVerify = '';
      let recommendedAction = '';
      const docs: string[] = ['Identity Proof (PAN Card)', 'Recent Credit Report Copy'];

      if (isWrittenOff) {
        problem = `Account marked as "Written Off" with historical loss classification by ${acc.lender}.`;
        whyItMatters = 'A Written-off remark severely impairs future unsecured borrowing and home loan eligibility for years.';
        whatToVerify = 'Verify whether this account was ever paid in full or settled, and check if a formal No Dues Certificate (NOC) was issued.';
        recommendedAction = 'Negotiate a full closure payoff with the lender to convert status from "Written Off" to "Closed / Paid in Full" and secure an official NOC.';
        docs.push('Lender Loan Foreclosure / Payoff Statement', 'No Objection Certificate (NOC)', 'Bank Transaction Statement');
      } else if (isSettled) {
        problem = `Account marked as "Settled" rather than "Closed Paid in Full".`;
        whyItMatters = 'A Settled tag signals to prospective lenders that a haircut was taken and the borrower did not repay the full principal/interest.';
        whatToVerify = 'Check settlement letter terms and whether any residual balance is incorrectly still showing as overdue.';
        recommendedAction = 'Consider approaching the lender to pay the difference amount to upgrade the tag to "Closed", or ensure no residual overdue remains.';
        docs.push('Settlement Agreement Letter', 'Payment Receipts', 'Lender NOC');
      } else if (acc.overdueAmount > 0) {
        problem = `Active overdue amount of ₹${acc.overdueAmount.toLocaleString('en-IN')} reported.`;
        whyItMatters = 'Active overdues cause continuous point deductions every month until cleared and reported as updated by the lender.';
        whatToVerify = 'Verify current dues with the bank branch or customer portal to ensure charges or late fees are accounted for.';
        recommendedAction = 'Clear the overdue balance immediately. Once cleared, demand a zero-balance statement and monitor next month credit refresh.';
        docs.push('Payment Confirmation Receipt', 'Updated Account Statement', 'Bank Clearance SMS/Email');
      } else if (isHighDpd) {
        problem = `Historical Days Past Due (DPD) reached ${acc.maxDPD} days.`;
        whyItMatters = 'Late payment records stay in bureau archives for up to 36 months, reducing perceived repayment reliability.';
        whatToVerify = 'Check if delayed reporting was due to technical processing lag or unauthorized EMI date changes by the lender.';
        recommendedAction = 'If caused by a bank error or glitch, request a DPD correction via the lender grievance cell. If legitimate, maintain 12+ months clean streak.';
        docs.push('Bank Account Statement showing timely debit attempts', 'Complaint Ticket with Lender');
      } else if (isHighUtilization) {
        problem = `Revolving credit card utilization at ${Math.round((acc.currentBalance / acc.sanctionedAmount) * 100)}% on this card.`;
        whyItMatters = 'High utilization suggests heavy credit dependency and elevates default risk in credit algorithms.';
        whatToVerify = 'Verify if total credit limit reported in bureau matches your actual approved card limit.';
        recommendedAction = 'Pay down balance below 30% before the billing statement generation date or request a credit limit enhancement.';
        docs.push('Card Statement showing approved credit limit', 'Payment Receipts');
      }

      negativeAccounts.push({
        accountId: acc.id,
        lender: acc.lender,
        accountType: acc.accountType,
        accountNumberMasked: acc.accountNumberMasked,
        balance: acc.currentBalance,
        overdue: acc.overdueAmount,
        status: acc.rawStatus,
        dpdSummary: acc.maxDPD > 0 ? `${acc.maxDPD} Days Past Due` : 'No Recent DPD',
        lastReportedDate: acc.lastReportedDate,
        negativeRemark: acc.negativeRemarks.join('; ') || 'Negative flag reported',
        severity: acc.severity,
        problem,
        whyItMatters,
        whatToVerify,
        recommendedAction,
        documentsRequired: docs,
      });
    }
  });

  // Critical issues overview
  if (summary.totalOverdue > 0) {
    criticalIssues.push({
      title: 'Active Overdue Balances Detected',
      severity: 'CRITICAL',
      description: `You have an aggregate active overdue of ₹${summary.totalOverdue.toLocaleString('en-IN')} across your facilities.`,
      impact: 'Ongoing monthly score penalties and high likelihood of loan rejection.',
      actionImmediate: 'Prioritize clearing all overdue balances within 7 days to halt further credit damage.',
    });
  }

  const writtenOffCount = accounts.filter(a => a.normalizedStatus === 'WRITTEN_OFF').length;
  if (writtenOffCount > 0) {
    criticalIssues.push({
      title: `${writtenOffCount} Written-off Account(s)`,
      severity: 'CRITICAL',
      description: 'Lenders have reported loss asset write-offs on your profile.',
      impact: 'Severe hurdle for obtaining fresh credit cards or personal loans.',
      actionImmediate: 'Contact lender recovery/nodal team to discuss full payoff settlement for an NOC.',
    });
  }

  if (summary.creditCardUtilizationPct > 60) {
    criticalIssues.push({
      title: `Elevated Credit Card Utilization (${summary.creditCardUtilizationPct}%)`,
      severity: summary.creditCardUtilizationPct > 80 ? 'CRITICAL' : 'HIGH',
      description: `Your revolving balance is ₹${summary.totalCreditCardBalance.toLocaleString('en-IN')} against ₹${summary.totalCreditCardLimit.toLocaleString('en-IN')} limit.`,
      impact: 'Significantly dampens CIBIL score even if minimum payments are made on time.',
      actionImmediate: 'Target reducing balance below 30% of aggregate limit (₹' + Math.round(summary.totalCreditCardLimit * 0.3).toLocaleString('en-IN') + ').',
    });
  }

  if (summary.enquiriesLast90Days >= 4) {
    criticalIssues.push({
      title: 'High Velocity of Hard Credit Inquiries',
      severity: 'MEDIUM',
      description: `${summary.enquiriesLast90Days} credit enquiries were recorded within the last 90 days.`,
      impact: 'Indicates credit hunger, which temporary suppresses credit score ratings.',
      actionImmediate: 'Pause all fresh credit card and personal loan applications for at least 90-120 days.',
    });
  }

  // 3. Potential Disputable Items
  const disputeOpportunities: DisputeOpportunity[] = [];

  // Inconsistency 1: Account marked active with overdue despite possible closure
  accounts.forEach(acc => {
    if (acc.rawStatus.toLowerCase().includes('discrepancy') || acc.rawStatus.toLowerCase().includes('noc') || (acc.closedDate && acc.currentBalance > 0)) {
      disputeOpportunities.push({
        id: `disp-${acc.id}`,
        accountId: acc.id,
        issue: `Account marked active/overdue despite closure or settlement`,
        evidenceFromReport: `${acc.lender} (${acc.accountType}) reports Balance: ₹${acc.currentBalance.toLocaleString('en-IN')}, Overdue: ₹${acc.overdueAmount.toLocaleString('en-IN')}.`,
        whyInconsistent: 'Credit report indicates ongoing dues or delayed status on an account claimed closed by borrower.',
        evidenceToProvide: 'Official Loan Closure Letter / Bank No Objection Certificate (NOC) / Final Zero-balance statement.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
      });
    }

    // Inconsistency 2: Potential duplicate account
    const duplicates = accounts.filter(
      other =>
        other.id !== acc.id &&
        other.lender === acc.lender &&
        other.sanctionedAmount === acc.sanctionedAmount &&
        other.openDate === acc.openDate
    );
    if (duplicates.length > 0 && !disputeOpportunities.some(d => d.issue.includes('Duplicate'))) {
      disputeOpportunities.push({
        id: `disp-dup-${acc.id}`,
        accountId: acc.id,
        issue: `Potential Duplicate Trade Line Detected at ${acc.lender}`,
        evidenceFromReport: `Two facilities from ${acc.lender} share identical sanctioned amounts (₹${acc.sanctionedAmount.toLocaleString('en-IN')}) and identical opening dates (${acc.openDate}).`,
        whyInconsistent: 'Lenders occasionally upload the same loan twice under different internal reference IDs during system migrations.',
        evidenceToProvide: 'Original loan agreement showing only a single loan account was sanctioned.',
        recommendedRoute: 'Lender Nodal/Grievance',
        confidence: 'MEDIUM',
      });
    }

    // Inconsistency 3: Overdue reported on 0 balance or mismatch
    if (acc.currentBalance === 0 && acc.overdueAmount > 0) {
      disputeOpportunities.push({
        id: `disp-bal-${acc.id}`,
        accountId: acc.id,
        issue: `Mathematical Discrepancy: Overdue with Zero Balance at ${acc.lender}`,
        evidenceFromReport: `Current Balance is ₹0 but Overdue Amount is reported as ₹${acc.overdueAmount.toLocaleString('en-IN')}.`,
        whyInconsistent: 'Overdue amounts cannot exceed total outstanding balance without explicit fee reversal or accounting error.',
        evidenceToProvide: 'Latest account statement showing nil outstanding balance.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'HIGH',
      });
    }
  });

  // Inconsistency 4: Enquiry verification
  enquiries.forEach(enq => {
    if (enq.purpose.toLowerCase().includes('unknown') || enq.institution.toLowerCase().includes('unknown')) {
      disputeOpportunities.push({
        id: `disp-enq-${enq.id}`,
        issue: `Unrecognized Credit Enquiry by ${enq.institution}`,
        evidenceFromReport: `Enquiry logged on ${enq.date} for purpose '${enq.purpose}'.`,
        whyInconsistent: 'Borrower states no application or consent was granted to this specific financial entity.',
        evidenceToProvide: 'Affidavit/Declaration of no credit application submitted to said lender.',
        recommendedRoute: 'CIBIL Dispute Portal',
        confidence: 'MEDIUM',
      });
    }
  });

  // 4. Ranked Factors (What Is Hurting Your Score?)
  const rankedNegativeFactors: RankedFactor[] = [];
  let currentRank = 1;

  if (summary.totalOverdue > 0) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'Active Overdue Balances',
      severity: 'CRITICAL',
      evidence: `₹${summary.totalOverdue.toLocaleString('en-IN')} currently past due across active accounts.`,
      explanation: 'Overdue accounts trigger monthly adverse notifications to credit bureaus, causing persistent score drops.',
      recommendedAction: 'Pay the exact overdue amount immediately to stop compounding late reporting.',
      priority: 'Priority 1 – Immediate Action',
    });
  }

  if (writtenOffCount > 0) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'Written-Off / Default Accounts',
      severity: 'CRITICAL',
      evidence: `${writtenOffCount} loan or credit card facility classified as Written Off.`,
      explanation: 'Write-off records are treated as unrecoverable losses by automated underwriting systems.',
      recommendedAction: 'Engage with the lender to obtain a formal payoff settlement and convert status to Closed.',
      priority: 'Priority 2 – High Strategic Impact',
    });
  }

  if (dpd90PlusCount > 0 || dpd60PlusCount > 0) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'Severe Payment Delays (60+ & 90+ DPD)',
      severity: 'CRITICAL',
      evidence: `${dpd90PlusCount + dpd60PlusCount} delayed monthly payment instances reported in credit history.`,
      explanation: 'Repayment history constitutes approximately 35% of your total credit score calculation.',
      recommendedAction: 'Ensure 100% on-time automated repayments (NACH/e-mandates) going forward.',
      priority: 'Priority 3 – Consistent Habit',
    });
  }

  if (summary.creditCardUtilizationPct > 30) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'High Revolving Credit Card Utilization',
      severity: summary.creditCardUtilizationPct > 75 ? 'HIGH' : 'MEDIUM',
      evidence: `Aggregate utilization at ${summary.creditCardUtilizationPct}%, above the recommended 30% threshold.`,
      explanation: 'High utilization signals liquidity strain and inflates debt burden ratios.',
      recommendedAction: 'Pay down balances mid-cycle before statement generation date or request credit limit bump.',
      priority: 'Priority 4 – Fast Score Boost',
    });
  }

  if (summary.enquiriesLast90Days >= 3) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'Frequent Recent Hard Inquiries',
      severity: 'MEDIUM',
      evidence: `${summary.enquiriesLast90Days} lender inquiries within 90 days.`,
      explanation: 'Each hard inquiry can temporarily shave 5-10 points and indicates credit seeking behavior.',
      recommendedAction: 'Avoid applying for multiple loan products simultaneously; use soft-check eligibility tools.',
      priority: 'Priority 5 – Preventative',
    });
  }

  if (summary.securedLoansCount === 0 && summary.unsecuredLoansCount > 2) {
    rankedNegativeFactors.push({
      rank: currentRank++,
      title: 'Skewed Credit Mix (100% Unsecured Facilities)',
      severity: 'LOW',
      evidence: `All ${summary.totalAccounts} accounts are unsecured (Personal Loans/Credit Cards) with no secured backing.`,
      explanation: 'A balanced portfolio demonstrates reliability across collateralized assets (Home/Auto loans).',
      recommendedAction: 'Maintain current facilities responsibly; do not take unnecessary loans solely for mix balancing.',
      priority: 'Priority 6 – Long Term Observation',
    });
  }

  // 5. Action Plan 30 / 60 / 90 Days
  const actionPlan30_60_90: ActionPlan = {
    first7Days: [
      'Download and review every line item in this diagnostic breakdown.',
      'Check all active overdue amounts with respective lenders to get exact settlement figures including taxes.',
      'Gather original NOCs, loan closure receipts, and payment statements for any disputable items.',
      'Verify that all personal details (PAN, Address, Mobile) belong strictly to you.',
    ],
    days8To30: [
      summary.totalOverdue > 0
        ? `Clear the active overdue balance of ₹${summary.totalOverdue.toLocaleString('en-IN')} across affected accounts.`
        : 'Ensure all upcoming EMIs and credit card minimum dues are set to auto-debit.',
      'Submit formal online dispute requests on the CIBIL Dispute Resolution portal for identified discrepancies.',
      summary.creditCardUtilizationPct > 50
        ? `Reduce credit card balance from ₹${summary.totalCreditCardBalance.toLocaleString('en-IN')} towards target ₹${Math.round(summary.totalCreditCardLimit * 0.3).toLocaleString('en-IN')}.`
        : 'Maintain card balances under 30% of approved credit limits.',
      'Do not apply for any new credit cards, BNPL schemes, or personal loans during this stabilization window.',
    ],
    days31To60: [
      'Follow up with lender Nodal Grievance Officers on dispute ticket status (mandatory 30-day turnaround under RBI guidelines).',
      'Obtain written confirmation or NOC for any accounts settled or cleared during Month 1.',
      'Maintain an unbroken streak of 100% on-time payments across all active credit lines.',
      'Request existing credit card issuers for a complimentary credit limit enhancement without hard inquiries.',
    ],
    days61To90: [
      'Pull a fresh CIBIL score refresh to verify if dispute resolutions and balance reductions have reflected.',
      'Ensure that closed accounts are correctly updated with zero balance and closed status.',
      'Re-calculate your credit utilization percentage and confirm it remains consistently below 30%.',
      'Continue healthy financial discipline: keep older credit card lines active to lengthen average credit history.',
    ],
  };

  // 6. Payment behaviour analysis
  const paymentBehaviour = {
    latePaymentsCount: totalLateCount,
    dpd30Plus: dpd30PlusCount,
    dpd60Plus: dpd60PlusCount,
    dpd90Plus: dpd90PlusCount,
    repeatedDelays: totalLateCount >= 3,
    persistentDelinquency: dpd90PlusCount > 0,
    explanation:
      totalLateCount > 0
        ? `A total of ${totalLateCount} delayed payment milestones were identified in the reported history (${dpd90PlusCount} in the 90+ DPD category). In India, severe DPD signals significant financial stress to credit assessment models.`
        : 'All reported payments have been executed on time with zero recorded DPD instances.',
    recommendation:
      totalLateCount > 0
        ? 'Establish automated bank mandates (e-NACH) 3 days prior to your monthly due dates to avoid inadvertent technical failures.'
        : 'Continue maintaining 100% on-time repayment records.',
  };

  // 7. Utilization analysis
  const utilizationStatus =
    summary.creditCardUtilizationPct > 80
      ? 'CRITICAL'
      : summary.creditCardUtilizationPct > 50
      ? 'HIGH'
      : summary.creditCardUtilizationPct > 30
      ? 'GOOD'
      : 'EXCELLENT';

  const utilizationAnalysis = {
    totalLimit: summary.totalCreditCardLimit,
    totalBalance: summary.totalCreditCardBalance,
    utilizationPct: summary.creditCardUtilizationPct,
    status: utilizationStatus as any,
    explanation: `Your revolving credit card balance is ₹${summary.totalCreditCardBalance.toLocaleString('en-IN')} against an aggregate credit limit of ₹${summary.totalCreditCardLimit.toLocaleString('en-IN')}, resulting in a utilization ratio of ${summary.creditCardUtilizationPct}%. Ratios above 30% negatively weight your credit assessment.`,
    recommendations: [
      'Strive to keep individual card utilization as well as aggregate portfolio utilization strictly under 30%.',
      'Pay down credit card bills before the statement billing cycle cutoff date.',
      'Do not close older zero-balance credit cards, as closing them reduces your total credit ceiling and elevates utilization %.',
    ],
  };

  // 8. Credit age & mix
  const creditAgeAnalysis = {
    oldestAccount: summary.oldestAccountDate,
    newestAccount: summary.newestAccountDate,
    averageAgeYears: summary.averageAccountAgeYears,
    assessment: `Your oldest active credit line was opened on ${summary.oldestAccountDate}, representing a credit vintage of approximately ${summary.averageAccountAgeYears} years. A longer credit history provides greater predictability to credit bureau algorithms.`,
  };

  const creditMixAnalysis = {
    securedCount: summary.securedLoansCount,
    unsecuredCount: summary.unsecuredLoansCount,
    ratioText: `${summary.securedLoansCount} Secured : ${summary.unsecuredLoansCount} Unsecured`,
    assessment:
      summary.securedLoansCount > 0
        ? 'Your credit profile displays a healthy blend of secured and unsecured credit facilities.'
        : 'Your profile currently consists solely of unsecured credit lines (personal loans or credit cards). Note: You should never take a loan solely to improve your credit mix.',
  };

  const enquiryAnalysis = {
    last30Days: summary.enquiriesLast30Days,
    last90Days: summary.enquiriesLast90Days,
    total: summary.enquiriesCount,
    isVelocityHigh: summary.enquiriesLast90Days >= 3,
    assessment:
      summary.enquiriesLast90Days >= 3
        ? `Lenders have made ${summary.enquiriesLast90Days} hard enquiries in the last 90 days. Multiple loan or credit card applications within a compressed timeframe can be interpreted as urgent credit seeking.`
        : 'Inquiry frequency is within moderate, acceptable thresholds.',
  };

  return {
    creditHealth: {
      score: score.score,
      category: score.category,
      riskLevel: score.riskLevel,
      healthScore100,
      summary: `Credit profile demonstrates a CIBIL TransUnion score of ${score.score} (${score.category}). Based on the report data, we identified ${negativeAccounts.length} critical or watch-list facilities, an aggregate overdue of ₹${summary.totalOverdue.toLocaleString('en-IN')}, and ${summary.creditCardUtilizationPct}% credit card utilization.`,
    },
    criticalIssues,
    negativeAccounts,
    disputeOpportunities,
    rankedNegativeFactors,
    paymentBehaviour,
    utilizationAnalysis,
    creditAgeAnalysis,
    creditMixAnalysis,
    enquiryAnalysis,
    actionPlan30_60_90,
    warnings: [
      'Digital Katta is an independent AI financial analysis tool and is not officially affiliated with TransUnion CIBIL, Experian, Equifax, CRIF High Mark, RBI, or any banking institution.',
      'This analysis is purely informational and does not guarantee any specific credit score improvement or loan approval.',
    ],
    generatedByAI: false,
  };
}
