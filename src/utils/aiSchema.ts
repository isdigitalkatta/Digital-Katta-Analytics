import { z } from 'zod';

export const AIAnalysisSchema = z.object({
  creditHealth: z.object({
    score: z.number().catch(650),
    category: z.string().transform(v => {
      const lower = (v || '').toLowerCase();
      if (lower.includes('excel')) return 'Excellent';
      if (lower.includes('good')) return 'Good';
      if (lower.includes('fair') || lower.includes('avg') || lower.includes('average')) return 'Fair';
      return 'Needs Improvement';
    }),
    riskLevel: z.string().transform(v => {
      const lower = (v || '').toLowerCase();
      if (lower.includes('low') && !lower.includes('very')) return 'Low';
      if (lower.includes('mod') || lower.includes('med')) return 'Moderate';
      if (lower.includes('very')) return 'Very High';
      if (lower.includes('high') || lower.includes('crit')) return 'High';
      return 'Moderate';
    }),
    healthScore100: z.number().catch(60),
    summary: z.string().catch('Detailed credit health evaluation completed for your Indian bureau report.'),
  }),
  criticalIssues: z.array(
    z.object({
      title: z.string().catch('Credit Issue Detected'),
      severity: z.string().transform(v => {
        const u = (v || '').toUpperCase();
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(u)) return u as any;
        return 'HIGH';
      }),
      description: z.string().catch(''),
      affectedAccount: z.string().optional(),
      impact: z.string().catch('Impairs overall CIBIL rating.'),
      actionImmediate: z.string().catch('Review and verify with the respective financial institution.'),
    })
  ).catch([]),
  negativeAccounts: z.array(
    z.object({
      accountId: z.string().catch('acc-neg-1'),
      lender: z.string().catch('Financial Institution'),
      accountType: z.string().catch('Loan / Credit Account'),
      accountNumberMasked: z.string().catch('XXXX-XXXX-0000'),
      balance: z.number().catch(0),
      overdue: z.number().catch(0),
      status: z.string().catch('Active'),
      dpdSummary: z.string().catch('DPD Reported'),
      lastReportedDate: z.string().catch('Recent'),
      negativeRemark: z.string().catch('Adverse bureau entry'),
      severity: z.string().transform(v => {
        const u = (v || '').toUpperCase();
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(u)) return u as any;
        return 'HIGH';
      }),
      problem: z.string().catch('Negative reporting on this facility.'),
      whyItMatters: z.string().catch('Impacts credit rating and future loan approvals.'),
      whatToVerify: z.string().catch('Verify payment dates, loan foreclosure letters, and bank statements.'),
      recommendedAction: z.string().catch('Clear any outstanding dues and request updated bureau reporting with NOC.'),
      documentsRequired: z.array(z.string()).catch(['PAN Card', 'Bank NOC', 'Payment Receipts']),
    })
  ).catch([]),
  disputeOpportunities: z.array(
    z.object({
      id: z.string().catch('disp-1'),
      accountId: z.string().optional(),
      issue: z.string().catch('Potential Data Discrepancy'),
      evidenceFromReport: z.string().catch('Inconsistency identified in bureau records.'),
      whyInconsistent: z.string().catch('Discrepancy in dates, balances, or account closure status.'),
      evidenceToProvide: z.string().catch('Bank NOC, Statement of Account, or Foreclosure receipt.'),
      recommendedRoute: z.string().transform(v => {
        const lower = (v || '').toLowerCase();
        if (lower.includes('ombudsman')) return 'RBI Integrated Ombudsman';
        if (lower.includes('nodal') || lower.includes('grievance') || lower.includes('bank')) return 'Lender Nodal/Grievance';
        return 'CIBIL Dispute Portal';
      }),
      confidence: z.string().transform(v => {
        const u = (v || '').toUpperCase();
        if (['HIGH', 'MEDIUM', 'LOW'].includes(u)) return u as any;
        return 'HIGH';
      }),
      isClericalError: z.boolean().optional(),
      isInstantDisputeCandidate: z.boolean().optional(),
      clericalDetails: z.any().optional(),
    })
  ).catch([]),
  clericalErrorsCount: z.number().optional(),
  instantDisputeCount: z.number().optional(),
  clericalErrorsList: z.array(z.any()).optional(),
  rankedNegativeFactors: z.array(
    z.object({
      rank: z.number().catch(1),
      title: z.string().catch('Credit Scoring Factor'),
      severity: z.string().transform(v => {
        const u = (v || '').toUpperCase();
        if (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(u)) return u as any;
        return 'MEDIUM';
      }),
      evidence: z.string().catch('Identified from credit bureau data.'),
      explanation: z.string().catch('Affects credit standing.'),
      recommendedAction: z.string().catch('Take corrective action as recommended.'),
      priority: z.string().catch('High Priority'),
    })
  ).catch([]),
  paymentBehaviour: z.object({
    latePaymentsCount: z.number().catch(0),
    dpd30Plus: z.number().catch(0),
    dpd60Plus: z.number().catch(0),
    dpd90Plus: z.number().catch(0),
    repeatedDelays: z.boolean().catch(false),
    persistentDelinquency: z.boolean().catch(false),
    explanation: z.string().catch('Evaluation of historical repayment discipline.'),
    recommendation: z.string().catch('Ensure all ongoing loans and card bills are settled on or before due dates.'),
  }).catch({
    latePaymentsCount: 0,
    dpd30Plus: 0,
    dpd60Plus: 0,
    dpd90Plus: 0,
    repeatedDelays: false,
    persistentDelinquency: false,
    explanation: 'Evaluation of historical repayment discipline.',
    recommendation: 'Ensure all ongoing loans and card bills are settled on or before due dates.',
  }),
  utilizationAnalysis: z.object({
    totalLimit: z.number().catch(0),
    totalBalance: z.number().catch(0),
    utilizationPct: z.number().catch(0),
    status: z.string().transform(v => {
      const u = (v || '').toUpperCase();
      if (['EXCELLENT', 'GOOD', 'HIGH', 'CRITICAL'].includes(u)) return u as any;
      if (u.includes('CRIT')) return 'CRITICAL';
      if (u.includes('HIGH')) return 'HIGH';
      if (u.includes('GOOD')) return 'GOOD';
      return 'EXCELLENT';
    }),
    explanation: z.string().catch('Credit card revolving balance ratio analysis.'),
    recommendations: z.array(z.string()).catch(['Maintain credit card utilization under 30% limit.']),
  }).catch({
    totalLimit: 0,
    totalBalance: 0,
    utilizationPct: 0,
    status: 'EXCELLENT',
    explanation: 'Credit card revolving balance ratio analysis.',
    recommendations: ['Maintain credit card utilization under 30% limit.'],
  }),
  creditAgeAnalysis: z.object({
    oldestAccount: z.string().catch('N/A'),
    newestAccount: z.string().catch('N/A'),
    averageAgeYears: z.number().catch(3.5),
    assessment: z.string().catch('Credit profile age and vintage analyzed.'),
  }).catch({
    oldestAccount: 'N/A',
    newestAccount: 'N/A',
    averageAgeYears: 3.5,
    assessment: 'Credit profile age and vintage analyzed.',
  }),
  creditMixAnalysis: z.object({
    securedCount: z.number().catch(0),
    unsecuredCount: z.number().catch(0),
    ratioText: z.string().catch('Balanced portfolio'),
    assessment: z.string().catch('Secured vs unsecured credit distribution evaluated.'),
  }).catch({
    securedCount: 0,
    unsecuredCount: 0,
    ratioText: 'Balanced portfolio',
    assessment: 'Secured vs unsecured credit distribution evaluated.',
  }),
  enquiryAnalysis: z.object({
    last30Days: z.number().catch(0),
    last90Days: z.number().catch(0),
    total: z.number().catch(0),
    isVelocityHigh: z.boolean().catch(false),
    assessment: z.string().catch('Hard credit inquiry frequency analyzed.'),
  }).catch({
    last30Days: 0,
    last90Days: 0,
    total: 0,
    isVelocityHigh: false,
    assessment: 'Hard credit inquiry frequency analyzed.',
  }),
  actionPlan30_60_90: z.object({
    first7Days: z.array(z.string()).catch([]),
    days8To30: z.array(z.string()).catch([]),
    days31To60: z.array(z.string()).catch([]),
    days61To90: z.array(z.string()).catch([]),
  }).catch({
    first7Days: ['Review active overdue accounts and verify bank records.'],
    days8To30: ['Contact lenders to pay overdue amounts and request updated bureau reporting.'],
    days31To60: ['Track CIBIL refresh to verify overdue clearance and obtain NOCs.'],
    days61To90: ['Maintain on-time repayments across all facilities to rebuild credit score.'],
  }),
  warnings: z.array(z.string()).catch([]),
  generatedByAI: z.boolean().default(true),
});
