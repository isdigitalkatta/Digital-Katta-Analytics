import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  History,
  Calendar,
} from 'lucide-react';
import { CreditAccount, NormalizedCreditReport } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';

interface AccountsListViewProps {
  accounts: CreditAccount[];
  onDraftLetter: (account: CreditAccount) => void;
  onNavigateHistory: () => void;
}

export const AccountsListView: React.FC<AccountsListViewProps> = ({
  accounts,
  onDraftLetter,
  onNavigateHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch =
      acc.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.accountNumberMasked.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return !acc.closedDate;
    if (statusFilter === 'CLOSED') return !!acc.closedDate || acc.normalizedStatus === 'CLOSED' || acc.normalizedStatus === 'SETTLED';
    if (statusFilter === 'OVERDUE') return acc.overdueAmount > 0;
    if (statusFilter === 'CARDS') return acc.isCreditCard;
    if (statusFilter === 'LOANS') return !acc.isCreditCard;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Credit Accounts & Facilities
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory of active and closed loans, credit cards, and retail credit lines
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search lender or account..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'OVERDUE', 'CLOSED', 'CARDS'].map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                  statusFilter === f
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Lender & Account</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Sanctioned</th>
                <th className="px-4 py-3.5">Current Balance</th>
                <th className="px-4 py-3.5">Overdue</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Max DPD</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                    No accounts matching your search filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(account => {
                  const hasOverdue = account.overdueAmount > 0;
                  const isWrittenOff = account.normalizedStatus === 'WRITTEN_OFF';

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lender */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {account.lender}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {account.accountNumberMasked}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-700">{account.accountType}</span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Opened: {account.openDate}
                        </span>
                      </td>

                      {/* Sanctioned */}
                      <td className="px-4 py-4 font-medium text-slate-800">
                        {formatIndianCurrency(account.sanctionedAmount)}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatIndianCurrency(account.currentBalance)}
                      </td>

                      {/* Overdue */}
                      <td className="px-4 py-4">
                        <span
                          className={`font-bold ${
                            hasOverdue ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100' : 'text-slate-500'
                          }`}
                        >
                          {formatIndianCurrency(account.overdueAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWrittenOff
                              ? 'bg-rose-100 text-rose-800'
                              : hasOverdue
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {account.rawStatus}
                        </span>
                      </td>

                      {/* DPD */}
                      <td className="px-4 py-4 font-semibold">
                        <span className={account.maxDPD > 30 ? 'text-rose-600' : 'text-slate-600'}>
                          {account.maxDPD > 0 ? `${account.maxDPD} Days` : '0 (Clean)'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onDraftLetter(account)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Draft Letter for this Account"
                          >
                            <FileSignature className="w-4 h-4" />
                          </button>
                          <button
                            onClick={onNavigateHistory}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View DPD History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
