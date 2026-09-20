export const MONTH_TABS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type MonthTab = (typeof MONTH_TABS)[number];

export const SHEET_COLUMNS = [
  'Serial No',
  'Date',
  'Full Name',
  'Address',
  'PAN',
  'Mobile Number',
  'WhatsApp Number',
  'Email Address',
  'City / State',
  'CIBIL Score Before',
  'CIBIL Report Before (link or file URL)',
  'CIBIL Score After',
  'CIBIL Report After (link or file URL)',
  'Issues Identified (short text)',
  'Issue Resolved? (Yes / No / In Progress)',
  'Package Name',
  'Payment Status (Unpaid / Paid / Refunded)',
  'Amount Paid (INR)',
  'Assigned Partner Assistant',
  'Assigned Credit Expert',
  'Case Number (paid only)',
  'Status',
  'Remarks',
  'Last Updated At',
] as const;

/**
 * Returns the 3-letter month tab name ('Jan', 'Feb', etc.) for a given date.
 */
export function getMonthTabName(dateInput?: string | number | Date | null): MonthTab {
  const date = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(date.getTime()) ? new Date() : date;
  const monthIndex = validDate.getMonth(); // 0 to 11
  return MONTH_TABS[monthIndex] || 'Jan';
}

/**
 * Validates whether a tab name is one of the standard 12 months.
 */
export function isMonthTab(name: string): name is MonthTab {
  return MONTH_TABS.includes(name as MonthTab);
}
