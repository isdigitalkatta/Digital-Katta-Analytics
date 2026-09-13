import { AccountStatus, CreditCategory, RiskLevel, SeverityLevel } from '../types';

export function maskAccountNumber(acc?: string): string {
  if (!acc) return 'XXXX-XXXX-0000';
  const clean = acc.replace(/[\s-]/g, '');
  if (clean.length <= 4) return `XXXX-XXXX-${clean}`;
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskPan(pan?: string): string {
  if (!pan) return 'ABCDE****F';
  const clean = pan.trim().toUpperCase();
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}**${clean.slice(5, 7)}**${clean.slice(9)}`;
  }
  return 'XXXXX****X';
}

export function maskMobile(mobile?: string): string {
  if (!mobile) return '+91 98****0000';
  const clean = mobile.replace(/\D/g, '');
  if (clean.length >= 10) {
    const last4 = clean.slice(-4);
    return `+91 ******${last4}`;
  }
  return '+91 ******0000';
}

export function normalizeStatus(raw?: string): { status: AccountStatus; severity: SeverityLevel } {
  if (!raw) return { status: 'ACTIVE', severity: 'NONE' };
  const s = raw.toUpperCase().trim();

  if (s.includes('WRITTEN') || s.includes('WRITE OFF') || s.includes('WRITE-OFF') || s === 'WO' || s === 'LSS') {
    return { status: 'WRITTEN_OFF', severity: 'CRITICAL' };
  }
  if (s.includes('SUIT') || s.includes('WILFUL') || s.includes('LEGAL')) {
    return { status: 'SUIT_FILED', severity: 'CRITICAL' };
  }
  if (s.includes('SETTLE') || s.includes('OTS') || s.includes('COMPROMISE')) {
    return { status: 'SETTLED', severity: 'HIGH' };
  }
  if (s.includes('RESTRUCT') || s.includes('RESCHEDUL')) {
    return { status: 'RESTRUCTURED', severity: 'HIGH' };
  }
  if (s.includes('DELINQUENT') || s.includes('OVERDUE') || s.includes('NPA') || s.includes('SMA') || s.includes('SUB-STD') || s.includes('DBT')) {
    return { status: 'DELINQUENT', severity: 'CRITICAL' };
  }
  if (s.includes('CLOSED') || s.includes('PAID') || s.includes('CLOSURE') || s.includes('NOC ISSUED')) {
    return { status: 'CLOSED', severity: 'NONE' };
  }
  return { status: 'ACTIVE', severity: 'NONE' };
}

export function calculateScoreCategory(score: number): { category: CreditCategory; riskLevel: RiskLevel } {
  if (score >= 750) {
    return { category: 'Excellent', riskLevel: 'Low' };
  } else if (score >= 700) {
    return { category: 'Good', riskLevel: 'Moderate' };
  } else if (score >= 650) {
    return { category: 'Fair', riskLevel: 'High' };
  } else {
    return { category: 'Needs Improvement', riskLevel: 'Very High' };
  }
}

export function formatIndianCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
