import React, { useState, useMemo } from 'react';
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
  X,
  RotateCcw,
  ShieldAlert,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  Info,
  BadgeAlert,
  Landmark,
} from 'lucide-react';
import { CreditAccount, AccountStatus } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';
import { useAppLanguage } from '../hooks/useAppLanguage';

interface AccountsListViewProps {
  accounts: CreditAccount[];
  onDraftLetter?: (account: CreditAccount) => void;
  onNavigateHistory?: (account?: CreditAccount) => void;
  title?: string;
  description?: string;
  hideHeader?: boolean;
}

export const AccountsListView: React.FC<AccountsListViewProps> = ({
  accounts,
  onDraftLetter,
  onNavigateHistory,
  title = 'Credit Accounts & Facilities',
  description = 'Complete inventory of active and closed loans, credit cards, and credit facilities extracted from your credit bureau report.',
  hideHeader = false,
}) => {
  const { t } = useAppLanguage();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'balance-desc' | 'overdue-desc' | 'lender-asc'>('default');

  // Unique bank names extracted from accounts
  const bankOptions = useMemo(() => {
    const banks = Array.from(new Set(accounts.map((a) => a.lender.trim()))).filter(
      (b): b is string => Boolean(b)
    );
    banks.sort((a: string, b: string) => a.localeCompare(b));
    return banks;
  }, [accounts]);

  // Account counts by status category
  const statusCounts = useMemo(() => {
    const total = accounts.length;
    let active = 0;
    let overdue = 0;
    let settled = 0;
    let writtenOff = 0;
    let closed = 0;

    accounts.forEach((acc) => {
      const norm = (acc.normalizedStatus || '').toUpperCase();
      const raw = (acc.rawStatus || '').toUpperCase();
      const isClosed = Boolean(acc.closedDate) || norm === 'CLOSED' || raw.includes('CLOSED');
      const isSettled = norm === 'SETTLED' || raw.includes('SETTLED');
      const isWrittenOff = norm === 'WRITTEN_OFF' || raw.includes('WRITTEN-OFF') || raw.includes('LOSS');
      const hasOverdue = acc.overdueAmount > 0 || norm === 'DELINQUENT';

      if (hasOverdue) overdue++;
      if (isWrittenOff) writtenOff++;
      else if (isSettled) settled++;
      else if (isClosed) closed++;
      else active++;
    });

    return { total, active, overdue, settled, writtenOff, closed };
  }, [accounts]);

  // Filtered & Sorted accounts
  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        // 1. Bank Name Search (Prioritizes bank name, but also matches account type and number)
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const lenderMatch = acc.lender.toLowerCase().includes(term);
          const typeMatch = acc.accountType.toLowerCase().includes(term);
          const numMatch = acc.accountNumberMasked.toLowerCase().includes(term);
          const rawStatusMatch = (acc.rawStatus || '').toLowerCase().includes(term);
          if (!lenderMatch && !typeMatch && !numMatch && !rawStatusMatch) {
            return false;
          }
        }

        // 2. Specific Bank Selector
        if (selectedBank !== 'ALL') {
          if (acc.lender.trim().toLowerCase() !== selectedBank.trim().toLowerCase()) {
            return false;
          }
        }

        // 3. Status Filter
        if (statusFilter !== 'ALL') {
          const norm = (acc.normalizedStatus || '').toUpperCase();
          const raw = (acc.rawStatus || '').toUpperCase();
          const isClosed = Boolean(acc.closedDate) || norm === 'CLOSED' || raw.includes('CLOSED');
          const isSettled = norm === 'SETTLED' || raw.includes('SETTLED');
          const isWrittenOff = norm === 'WRITTEN_OFF' || raw.includes('WRITTEN-OFF') || raw.includes('LOSS');
          const hasOverdue = acc.overdueAmount > 0 || norm === 'DELINQUENT';

          if (statusFilter === 'ACTIVE') {
            if (isClosed || isWrittenOff || isSettled) return false;
          } else if (statusFilter === 'OVERDUE') {
            if (!hasOverdue) return false;
          } else if (statusFilter === 'SETTLED') {
            if (!isSettled) return false;
          } else if (statusFilter === 'WRITTEN_OFF') {
            if (!isWrittenOff) return false;
          } else if (statusFilter === 'CLOSED') {
            if (!isClosed) return false;
          }
        }

        // 4. Type Filter (Credit Cards vs Loans)
        if (typeFilter === 'CARDS' && !acc.isCreditCard) return false;
        if (typeFilter === 'LOANS' && acc.isCreditCard) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance-desc') {
          return b.currentBalance - a.currentBalance;
        }
        if (sortBy === 'overdue-desc') {
          return b.overdueAmount - a.overdueAmount;
        }
        if (sortBy === 'lender-asc') {
          return a.lender.localeCompare(b.lender);
        }
        return 0; // default order from report
      });
  }, [accounts, searchTerm, selectedBank, statusFilter, typeFilter, sortBy]);

  // Aggregate metrics for filtered subset
  const metrics = useMemo(() => {
    let sanctioned = 0;
    let balance = 0;
    let overdue = 0;

    filteredAccounts.forEach((acc) => {
      sanctioned += acc.sanctionedAmount || 0;
      balance += acc.currentBalance || 0;
      overdue += acc.overdueAmount || 0;
    });

    return { sanctioned, balance, overdue };
  }, [filteredAccounts]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedBank !== 'ALL' ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    sortBy !== 'default';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBank('ALL');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('default');
  };

  return (
    <div className="space-y-4">
      {/* Header Block (Optional if embedded) */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6A00] flex items-center justify-center border border-orange-200/60 shadow-2xs">
                <Landmark className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#12233F] font-heading">
                {title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Total Accounts:</span>
            <span className="font-bold text-[#12233F]">{accounts.length}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Overdue:</span>
            <span className="font-bold text-rose-600">{statusCounts.overdue}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY SEARCH & FILTER BAR                                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
        {/* Row 1: Search by Bank Name + Bank Dropdown Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Bank Name Search Input */}
          <div className="sm:col-span-7 lg:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by bank name (e.g. HDFC, SBI, Axis, Bajaj) or account..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/10 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Bank Selector Dropdown */}
          <div className="sm:col-span-5 lg:col-span-4 relative">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full pl-10 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#FF6A00] focus:outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="ALL">All Banks & Lenders ({accounts.length})</option>
              {bankOptions.map((bank) => {
                const count = accounts.filter((a) => a.lender.trim() === bank).length;
                return (
                  <option key={bank} value={bank}>
                    {bank} ({count})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Row 2: Status Filter Segmented Control & Extra Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 select-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#FF6A00]" />
              <span>Status:</span>
            </span>

            {[
              { id: 'ALL', label: 'All Accounts', count: statusCounts.total, pillColor: 'text-slate-700' },
              { id: 'ACTIVE', label: 'Active', count: statusCounts.active, pillColor: 'text-emerald-700' },
              { id: 'OVERDUE', label: 'Overdue / Late', count: statusCounts.overdue, pillColor: 'text-rose-700' },
              { id: 'SETTLED', label: 'Settled', count: statusCounts.settled, pillColor: 'text-amber-700' },
              { id: 'WRITTEN_OFF', label: 'Written-Off', count: statusCounts.writtenOff, pillColor: 'text-purple-700' },
              { id: 'CLOSED', label: 'Closed', count: statusCounts.closed, pillColor: 'text-slate-600' },
            ].map((st) => {
              const isActive = statusFilter === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#12233F] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                    }`}
                  >
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Type Filter & Sort by Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Type Filter */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  typeFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('CARDS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  typeFilter === 'CARDS'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('LOANS')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                  typeFilter === 'LOANS'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Loans
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 pl-2.5 pr-6 rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#FF6A00] cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="overdue-desc">Highest Overdue</option>
              <option value="balance-desc">Highest Balance</option>
              <option value="lender-asc">Lender Name (A-Z)</option>
            </select>

            {/* Reset All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="Reset all search queries and filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Live Active Filter Feedback Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-400 text-[11px]">Filtered Results:</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-[#FF6A00] font-semibold text-[11px] border border-orange-200">
                Bank/Keyword: "{searchTerm}"
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-orange-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedBank !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                Bank: {selectedBank}
                <button
                  type="button"
                  onClick={() => setSelectedBank('ALL')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                Status: {statusFilter}
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {typeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-200">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className="hover:text-slate-950 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-700 underline cursor-pointer ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ACCOUNTS DATA TABLE / CARDS VIEW                                          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredAccounts.length === 0 ? (
          /* Empty Search & Filter State */
          <div className="p-10 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6A00] flex items-center justify-center mx-auto border border-orange-200/60 shadow-2xs">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#12233F] font-heading">
              No Accounts Matched Your Filter
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No credit accounts found for bank "{searchTerm || selectedBank}" with status "{statusFilter}". Try adjusting your keywords or clearing the active filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12233F] hover:bg-[#1E3A8A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Lender & Bank Name</th>
                  <th className="px-4 py-3.5">Account Type</th>
                  <th className="px-4 py-3.5">Sanctioned / Limit</th>
                  <th className="px-4 py-3.5">Current Balance</th>
                  <th className="px-4 py-3.5">Overdue Amount</th>
                  <th className="px-4 py-3.5">Reported Status</th>
                  <th className="px-4 py-3.5">Max DPD</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => {
                  const hasOverdue = account.overdueAmount > 0;
                  const isWrittenOff =
                    account.normalizedStatus === 'WRITTEN_OFF' ||
                    (account.rawStatus || '').toLowerCase().includes('written-off');
                  const isSettled =
                    account.normalizedStatus === 'SETTLED' ||
                    (account.rawStatus || '').toLowerCase().includes('settled');
                  const isClosed =
                    Boolean(account.closedDate) ||
                    account.normalizedStatus === 'CLOSED' ||
                    (account.rawStatus || '').toLowerCase().includes('closed');

                  // Highlighting search term in lender name if present
                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Bank / Lender */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              account.isCreditCard
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {account.isCreditCard ? (
                              <CreditCard className="w-4 h-4" />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm font-heading group-hover:text-[#FF6A00] transition-colors">
                              {account.lender}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {account.accountNumberMasked}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Account Type */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {account.accountType}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{account.isSecured ? 'Secured' : 'Unsecured'}</span>
                          {account.openDate && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Opened: {account.openDate}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Sanctioned Limit */}
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {formatIndianCurrency(account.sanctionedAmount)}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatIndianCurrency(account.currentBalance)}
                      </td>

                      {/* Overdue */}
                      <td className="px-4 py-4">
                        {hasOverdue ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 text-xs">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{formatIndianCurrency(account.overdueAmount)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">₹0 (Nil)</span>
                        )}
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-4 py-4">
                        {isWrittenOff ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            Written-Off
                          </span>
                        ) : isSettled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            Settled
                          </span>
                        ) : hasOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            Overdue
                          </span>
                        ) : isClosed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                            Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        )}

                        <span className="block text-[10px] text-slate-400 mt-1 truncate max-w-[130px]" title={account.rawStatus}>
                          {account.rawStatus || 'Regular'}
                        </span>
                      </td>

                      {/* Max DPD */}
                      <td className="px-4 py-4">
                        {account.maxDPD > 30 ? (
                          <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 text-[11px]">
                            {account.maxDPD} DPD
                          </span>
                        ) : account.maxDPD > 0 ? (
                          <span className="font-bold text-amber-700 text-[11px]">
                            {account.maxDPD} DPD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>0 (Clean)</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onDraftLetter && (
                            <button
                              type="button"
                              onClick={() => onDraftLetter(account)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                              title="Draft dispute notice or settlement letter for this account"
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                              <span>Dispute</span>
                            </button>
                          )}

                          {onNavigateHistory && (
                            <button
                              type="button"
                              onClick={() => onNavigateHistory(account)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Inspect full monthly payment history heatmap"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Summary Stats */}
        {filteredAccounts.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Showing {filteredAccounts.length} of {accounts.length} accounts</span>
              {filteredAccounts.length < accounts.length && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-bold text-[#FF6A00] hover:underline cursor-pointer"
                >
                  (View All)
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
              <span>
                Total Limit: <strong className="text-slate-800">{formatIndianCurrency(metrics.sanctioned)}</strong>
              </span>
              <span>
                Current Balance: <strong className="text-slate-800">{formatIndianCurrency(metrics.balance)}</strong>
              </span>
              {metrics.overdue > 0 && (
                <span>
                  Total Overdue: <strong className="text-rose-600">{formatIndianCurrency(metrics.overdue)}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
