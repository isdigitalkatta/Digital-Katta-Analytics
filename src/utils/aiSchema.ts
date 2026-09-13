import { z } from 'zod';

export const AIAnalysisSchema = z.object({
  creditHealth: z.object({
    score: z.number(),
    category: z.enum(['Excellent', 'Good', 'Fair', 'Needs Improvement']),
    riskLevel: z.enum(['Low', 'Moderate', 'High', 'Very High']),
    healthScore100: z.number(),
    summary: z.string(),
  }),
  criticalIssues: z.array(
    z.object({
      title: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
      description: z.string(),
      affectedAccount: z.string().optional(),
      impact: z.string(),
      actionImmediate: z.string(),
    })
  ),
  negativeAccounts: z.array(
    z.object({
      accountId: z.string(),
      lender: z.string(),
      accountType: z.string(),
      accountNumberMasked: z.string(),
      balance: z.number(),
      overdue: z.number(),
      status: z.string(),
      dpdSummary: z.string(),
      lastReportedDate: z.string(),
      negativeRemark: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
      problem: z.string(),
      whyItMatters: z.string(),
      whatToVerify: z.string(),
      recommendedAction: z.string(),
      documentsRequired: z.array(z.string()),
    })
  ),
  disputeOpportunities: z.array(
    z.object({
      id: z.string(),
      accountId: z.string().optional(),
      issue: z.string(),
      evidenceFromReport: z.string(),
      whyInconsistent: z.string(),
      evidenceToProvide: z.string(),
      recommendedRoute: z.enum([
        'CIBIL Dispute Portal',
        'Lender Nodal/Grievance',
        'RBI Integrated Ombudsman',
      ]),
      confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
  ),
  rankedNegativeFactors: z.array(
    z.object({
      rank: z.number(),
      title: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
      evidence: z.string(),
      explanation: z.string(),
      recommendedAction: z.string(),
      priority: z.string(),
    })
  ),
  paymentBehaviour: z.object({
    latePaymentsCount: z.number(),
    dpd30Plus: z.number(),
    dpd60Plus: z.number(),
    dpd90Plus: z.number(),
    repeatedDelays: z.boolean(),
    persistentDelinquency: z.boolean(),
    explanation: z.string(),
    recommendation: z.string(),
  }),
  utilizationAnalysis: z.object({
    totalLimit: z.number(),
    totalBalance: z.number(),
    utilizationPct: z.number(),
    status: z.enum(['EXCELLENT', 'GOOD', 'HIGH', 'CRITICAL']),
    explanation: z.string(),
    recommendations: z.array(z.string()),
  }),
  creditAgeAnalysis: z.object({
    oldestAccount: z.string(),
    newestAccount: z.string(),
    averageAgeYears: z.number(),
    assessment: z.string(),
  }),
  creditMixAnalysis: z.object({
    securedCount: z.number(),
    unsecuredCount: z.number(),
    ratioText: z.string(),
    assessment: z.string(),
  }),
  enquiryAnalysis: z.object({
    last30Days: z.number(),
    last90Days: z.number(),
    total: z.number(),
    isVelocityHigh: z.boolean(),
    assessment: z.string(),
  }),
  actionPlan30_60_90: z.object({
    first7Days: z.array(z.string()),
    days8To30: z.array(z.string()),
    days31To60: z.array(z.string()),
    days61To90: z.array(z.string()),
  }),
  warnings: z.array(z.string()),
  generatedByAI: z.boolean().default(true),
});
