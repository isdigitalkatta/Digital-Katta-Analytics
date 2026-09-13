export type CreditCategory = 'Excellent' | 'Good' | 'Fair' | 'Needs Improvement';
export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Very High';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type AccountStatus =
  | 'ACTIVE'
  | 'CLOSED'
  | 'WRITTEN_OFF'
  | 'SETTLED'
  | 'SUIT_FILED'
  | 'WILFUL_DEFAULT'
  | 'RESTRUCTURED'
  | 'DELINQUENT';

export type PaymentDPDStatus =
  | 'NORMAL'
  | 'LATE_30'
  | 'LATE_60'
  | 'LATE_90_PLUS'
  | 'WRITTEN_OFF'
  | 'SETTLED'
  | 'UNKNOWN';

export interface PaymentMonth {
  month: string; // e.g. "04/24" or "Apr 2024"
  monthName: string; // e.g. "Apr"
  year: number; // e.g. 2024
  dpd: number | string; // e.g. 0, 30, 60, 90, "000", "030", "STD", "SUB", "DBT", "LSS"
  status: PaymentDPDStatus;
}

export interface CreditAccount {
  id: string;
  lender: string;
  accountType: string;
  isCreditCard: boolean;
  isSecured: boolean;
  accountNumberMasked: string;
  accountNumberRaw?: string;
  openDate: string;
  closedDate?: string;
  lastReportedDate: string;
  sanctionedAmount: number; // or Credit Limit
  currentBalance: number;
  overdueAmount: number;
  cashLimit?: number;
  emiAmount?: number;
  interestRate?: string;
  paymentHistory: PaymentMonth[];
  normalizedStatus: AccountStatus;
  rawStatus: string;
  negativeRemarks: string[];
  maxDPD: number;
  severity: SeverityLevel;
  ownershipType?: string; // 'Individual', 'Joint', 'Guarantor'
}

export interface CreditEnquiry {
  id: string;
  date: string;
  institution: string;
  purpose: string;
  amount?: number;
}

export interface PersonalProfile {
  name: string;
  panMasked: string;
  dateOfBirth?: string;
  gender?: string;
  mobileMasked?: string;
  emailMasked?: string;
  address?: string;
  reportDate: string;
  reportNumber?: string;
}

export interface CreditScoreData {
  score: number;
  scoreName: string;
  scoreDate: string;
  category: CreditCategory;
  riskLevel: RiskLevel;
  minScore: number;
  maxScore: number;
}

export interface ReportSummary {
  totalAccounts: number;
  activeAccounts: number;
  closedAccounts: number;
  negativeAccounts: number;
  totalSanctioned: number;
  totalOutstanding: number;
  totalOverdue: number;
  creditCardsCount: number;
  totalCreditCardLimit: number;
  totalCreditCardBalance: number;
  creditCardUtilizationPct: number;
  oldestAccountDate: string;
  newestAccountDate: string;
  averageAccountAgeYears: number;
  enquiriesCount: number;
  enquiriesLast30Days: number;
  enquiriesLast90Days: number;
  enquiriesLast180Days: number;
  securedLoansCount: number;
  unsecuredLoansCount: number;
}

export interface NormalizedCreditReport {
  personal: PersonalProfile;
  score: CreditScoreData;
  accounts: CreditAccount[];
  enquiries: CreditEnquiry[];
  summary: ReportSummary;
  rawSourceType: 'PDF' | 'HTML' | 'JSON' | 'DEMO';
  fileName: string;
  parsedAt: string;
}

export interface NegativeAccountAnalysis {
  accountId: string;
  lender: string;
  accountType: string;
  accountNumberMasked: string;
  balance: number;
  overdue: number;
  status: string;
  dpdSummary: string;
  lastReportedDate: string;
  negativeRemark: string;
  severity: SeverityLevel;
  problem: string;
  whyItMatters: string;
  whatToVerify: string;
  recommendedAction: string;
  documentsRequired: string[];
}

export interface DisputeOpportunity {
  id: string;
  accountId?: string;
  issue: string;
  evidenceFromReport: string;
  whyInconsistent: string;
  evidenceToProvide: string;
  recommendedRoute: 'CIBIL Dispute Portal' | 'Lender Nodal/Grievance' | 'RBI Integrated Ombudsman';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RankedFactor {
  rank: number;
  title: string;
  severity: SeverityLevel;
  evidence: string;
  explanation: string;
  recommendedAction: string;
  priority: string;
}

export interface ActionPlan {
  first7Days: string[];
  days8To30: string[];
  days31To60: string[];
  days61To90: string[];
}

export interface AIAnalysisResult {
  creditHealth: {
    score: number;
    category: CreditCategory;
    riskLevel: RiskLevel;
    healthScore100: number;
    summary: string;
  };
  criticalIssues: Array<{
    title: string;
    severity: SeverityLevel;
    description: string;
    affectedAccount?: string;
    impact: string;
    actionImmediate: string;
  }>;
  negativeAccounts: NegativeAccountAnalysis[];
  disputeOpportunities: DisputeOpportunity[];
  rankedNegativeFactors: RankedFactor[];
  paymentBehaviour: {
    latePaymentsCount: number;
    dpd30Plus: number;
    dpd60Plus: number;
    dpd90Plus: number;
    repeatedDelays: boolean;
    persistentDelinquency: boolean;
    explanation: string;
    recommendation: string;
  };
  utilizationAnalysis: {
    totalLimit: number;
    totalBalance: number;
    utilizationPct: number;
    status: 'EXCELLENT' | 'GOOD' | 'HIGH' | 'CRITICAL';
    explanation: string;
    recommendations: string[];
  };
  creditAgeAnalysis: {
    oldestAccount: string;
    newestAccount: string;
    averageAgeYears: number;
    assessment: string;
  };
  creditMixAnalysis: {
    securedCount: number;
    unsecuredCount: number;
    ratioText: string;
    assessment: string;
  };
  enquiryAnalysis: {
    last30Days: number;
    last90Days: number;
    total: number;
    isVelocityHigh: boolean;
    assessment: string;
  };
  actionPlan30_60_90: ActionPlan;
  warnings: string[];
  generatedByAI: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedFollowUps?: string[];
}

export interface LetterTemplateConfig {
  templateType:
    | 'INCORRECT_DPD'
    | 'INCORRECT_OVERDUE'
    | 'ACCOUNT_CLOSURE'
    | 'WRONG_OWNERSHIP'
    | 'INCORRECT_SETTLEMENT'
    | 'INCORRECT_WRITTEN_OFF'
    | 'INCORRECT_BALANCE'
    | 'DUPLICATE_ACCOUNT'
    | 'INCORRECT_ENQUIRY';
  accountId?: string;
  lenderName: string;
  accountNumberMasked: string;
  borrowerName: string;
  borrowerPan: string;
  borrowerPhone: string;
  borrowerEmail: string;
  customDetails?: string;
}

export type PaymentRecord = PaymentMonth;
export type PaymentBehaviourAnalysis = AIAnalysisResult['paymentBehaviour'];
export type UtilizationAnalysis = AIAnalysisResult['utilizationAnalysis'];
export type EnquiryAnalysis = AIAnalysisResult['enquiryAnalysis'];
