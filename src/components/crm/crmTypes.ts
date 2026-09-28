import { StaffRole } from '../../context/AuthContext';

export interface CrmLeadItem {
  id: string;
  name: string;
  pan?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  cityState?: string;
  cibilScoreBefore?: number;
  cibilReportBeforeUrl?: string;
  cibilScoreAfter?: number;
  cibilReportAfterUrl?: string;
  issuesIdentified?: string;
  issueResolved?: string;
  packageName?: string;
  paymentStatus?: string;
  amountPaid?: number;
  assignedPartnerAssistant?: string;
  assignedCreditExpert?: string;
  caseNumber?: string;
  status?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'DOCUMENTS_PENDING'
  | 'UNDER_REVIEW'
  | 'OFFER_SENT'
  | 'PAID'
  | 'DROPPED';

export type PaidCaseStatus =
  | 'PAID'
  | 'ASSIGNED'
  | 'DISPUTE_FILED'
  | 'IN_FOLLOWUP'
  | 'RESOLVED'
  | 'NOC_ISSUED'
  | 'CLOSED';

export const LEAD_PIPELINE_STAGES: LeadStatus[] = [
  'NEW',
  'CONTACTED',
  'DOCUMENTS_PENDING',
  'UNDER_REVIEW',
  'OFFER_SENT',
  'PAID',
];

export const LEAD_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; step: number; dotColor: string }
> = {
  NEW: {
    label: 'New Lead',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    step: 1,
    dotColor: 'bg-blue-500',
  },
  CONTACTED: {
    label: 'Contacted',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    step: 2,
    dotColor: 'bg-purple-500',
  },
  DOCUMENTS_PENDING: {
    label: 'Docs Pending',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    step: 3,
    dotColor: 'bg-amber-500',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    step: 4,
    dotColor: 'bg-indigo-500',
  },
  OFFER_SENT: {
    label: 'Offer Sent',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    step: 5,
    dotColor: 'bg-cyan-500',
  },
  PAID: {
    label: 'Paid & Converted',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    step: 6,
    dotColor: 'bg-emerald-500',
  },
  DROPPED: {
    label: 'Dropped',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    step: 0,
    dotColor: 'bg-slate-400',
  },
};

export const PAID_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  PAID: {
    label: 'Payment Verified',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  ASSIGNED: {
    label: 'Assigned to Expert',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dotColor: 'bg-blue-500',
  },
  DISPUTE_FILED: {
    label: 'Dispute Notice Filed',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dotColor: 'bg-purple-500',
  },
  IN_FOLLOWUP: {
    label: 'In Bank Follow-up',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  RESOLVED: {
    label: 'Dispute Resolved',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dotColor: 'bg-teal-500',
  },
  NOC_ISSUED: {
    label: 'Bank NOC Issued',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dotColor: 'bg-emerald-600',
  },
  CLOSED: {
    label: 'Case Closed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dotColor: 'bg-slate-400',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dotColor: string }
> = {
  PAID: {
    label: 'PAID',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  PENDING_VERIFICATION: {
    label: 'PENDING',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dotColor: 'bg-amber-500',
  },
  UNPAID: {
    label: 'UNPAID',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dotColor: 'bg-slate-400',
  },
  REFUNDED: {
    label: 'REFUNDED',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dotColor: 'bg-rose-500',
  },
};

