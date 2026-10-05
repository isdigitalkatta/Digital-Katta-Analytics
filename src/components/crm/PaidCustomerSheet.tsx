import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  X,
  IndianRupee,
  FileBadge,
  Copy,
  Check,
} from 'lucide-react';
import { CrmLeadItem, PaidCaseStatus, PAID_STATUS_CONFIG } from './crmTypes';
import { useAuth } from '../../context/AuthContext';

interface PaidCustomerSheetProps {
  initialSearchCaseNumber?: string;
}

const MONTH_OPTIONS = [
  'ALL',
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
];

export const PaidCustomerSheet: React.FC<PaidCustomerSheetProps> = ({
  initialSearchCaseNumber,
}) => {
  const { authenticatedFetch, staffRole } = useAuth();

  const [cases, setCases] = useState<CrmLeadItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>(initialSearchCaseNumber || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  const [resolvedFilter, setResolvedFilter] = useState<string>('ALL');

  // Summary statistics
  const [summary, setSummary] = useState<{
    totalPaidCases: number;
    totalRevenue: number;
    resolvedCount: number;
    resolutionRate: string;
    avgScoreGain: number;
  }>({
    totalPaidCases: 0,
    totalRevenue: 0,
    resolvedCount: 0,
    resolutionRate: '0%',
    avgScoreGain: 0,
  });

  // Mask state
  const [revealedPans, setRevealedPans] = useState<Set<string>>(new Set());

  // Modals state
  const [resolutionModalCase, setResolutionModalCase] = useState<CrmLeadItem | null>(null);
  const [detailsModalCase, setDetailsModalCase] = useState<CrmLeadItem | null>(null);

  // Resolution outcome form state
  const [resolutionForm, setResolutionForm] = useState({
    status: 'RESOLVED' as PaidCaseStatus,
    cibilScoreAfter: 750,
    issueResolved: 'Yes',
    cibilReportAfterUrl: '',
    remarks: 'Dispute confirmed by bank. Late payment mark removed and NOC granted.',
  });
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);

  const togglePanReveal = (id: string) => {
    setRevealedPans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskPanDisplay = (pan?: string, id?: string) => {
    if (!pan) return 'N/A';
    if (id && revealedPans.has(id)) return pan.toUpperCase();
    const clean = pan.trim().toUpperCase();
    if (clean.length < 5) return '***';
    return `******${clean.slice(-4)}`;
  };

  const fetchPaidCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (monthFilter !== 'ALL') params.set('month', monthFilter);
      if (resolvedFilter !== 'ALL') params.set('resolved', resolvedFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await authenticatedFetch(`/api/v1/admin/sheets/paid?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCases(data.paidCases || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setError(data.error || 'Failed to fetch paid customer cases.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while loading paid cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidCases();
  }, [page, statusFilter, monthFilter, resolvedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPaidCases();
  };

  // Resolution outcome update submit
  const handleResolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalCase) return;

    setIsSubmittingResolution(true);
    try {
      const res = await authenticatedFetch('/api/v1/admin/sheets/paid/status', {
        method: 'POST',
        body: JSON.stringify({
          caseId: resolutionModalCase.id,
          status: resolutionForm.status,
          cibilScoreAfter: Number(resolutionForm.cibilScoreAfter),
          issueResolved: resolutionForm.issueResolved,
          cibilReportAfterUrl: resolutionForm.cibilReportAfterUrl,
          remarks: resolutionForm.remarks,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResolutionModalCase(null);
        fetchPaidCases();
      } else {
        alert(data.error || 'Failed to update resolution details');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating resolution');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Paid Cases
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">
            {summary.totalPaidCases}
          </p>
          <span className="text-[10px] text-slate-500">Enrolled customers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Collections (INR)
          </span>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1 font-heading flex items-center">
            <span className="text-lg">₹</span>
            {summary.totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Verified fees</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200/80 bg-teal-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
            Disputes Resolved
          </span>
          <p className="text-2xl font-extrabold text-teal-900 mt-1 font-heading">
            {summary.resolvedCount}
          </p>
          <span className="text-[10px] text-teal-600 font-medium">NOCs / Marks cleared</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            Success Rate
          </span>
          <p className="text-2xl font-extrabold text-blue-900 mt-1 font-heading">
            {summary.resolutionRate}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">Cases resolved</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-orange-200/80 bg-orange-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
            Avg Score Gain
          </span>
          <p className="text-2xl font-extrabold text-orange-900 mt-1 font-heading flex items-center gap-1">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>+{summary.avgScoreGain} pts</span>
          </p>
          <span className="text-[10px] text-orange-600 font-medium">Post dispute repair</span>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="paid-cases-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case # (DK-2025-001), name, mobile, PAN, or expert..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1c3859] bg-slate-50/50"
              />
            </div>
            <button
              id="paid-cases-search-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Refresh Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="refresh-paid-btn"
              type="button"
              onClick={fetchPaidCases}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh paid customers"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1c3859]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Pipeline Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            {['ALL', 'PAID', 'ASSIGNED', 'DISPUTE_FILED', 'IN_FOLLOWUP', 'RESOLVED', 'NOC_ISSUED', 'CLOSED'].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Cases' : PAID_STATUS_CONFIG[st]?.label || st}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Resolution Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400">Resolved:</span>
              <select
                value={resolvedFilter}
                onChange={(e) => {
                  setResolvedFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
              >
                <option value="ALL">All Outcomes</option>
                <option value="Yes">Yes (Resolved)</option>
                <option value="No">No / In Process</option>
              </select>
            </div>

            {/* Month Tab Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Month Tab:
              </span>
              <select
                id="paid-month-filter"
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ALL' ? 'All 12 Month Tabs' : `Tab: ${m}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4">Case # &amp; Customer</th>
                <th className="py-3.5 px-4">PAN (Masked)</th>
                <th className="py-3.5 px-4">Fee Paid</th>
                <th className="py-3.5 px-4">Score Trajectory</th>
                <th className="py-3.5 px-4">Resolution Status</th>
                <th className="py-3.5 px-4">Assigned Expert</th>
                <th className="py-3.5 px-4">Issue Resolved?</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading paid customer cases from registry...</span>
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileBadge className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No paid customer cases found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Convert borrower leads from the "Admin Lead Sheet" to view active customer cases here.
                    </p>
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const statusMeta =
                    PAID_STATUS_CONFIG[c.status?.toUpperCase() || 'PAID'] || PAID_STATUS_CONFIG.PAID;
                  const isResolved =
                    (c.issueResolved || '').toLowerCase() === 'yes' ||
                    (c.status || '').toUpperCase() === 'RESOLVED' ||
                    (c.status || '').toUpperCase() === 'NOC_ISSUED';
                  const scoreGain =
                    c.cibilScoreAfter && c.cibilScoreBefore
                      ? c.cibilScoreAfter - c.cibilScoreBefore
                      : 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition-colors group text-slate-700"
                    >
                      {/* Case # & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-extrabold text-[#1c3859] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {c.caseNumber || 'DK-CASE'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-1">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {c.phone ? c.phone : c.cityState}
                        </div>
                      </td>

                      {/* PAN (Masked) */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              revealedPans.has(c.id)
                                ? 'text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200'
                                : 'text-slate-600'
                            }
                          >
                            {maskPanDisplay(c.pan, c.id)}
                          </span>
                          {c.pan && (
                            <button
                              type="button"
                              onClick={() => togglePanReveal(c.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title={revealedPans.has(c.id) ? 'Hide PAN' : 'Reveal full PAN'}
                            >
                              {revealedPans.has(c.id) ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Fee Paid */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-800 text-xs flex items-center">
                          ₹{(c.amountPaid || 1999).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                          {c.packageName || 'Comprehensive'}
                        </span>
                      </td>

                      {/* Score Trajectory */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {c.cibilScoreBefore || 'N/A'}
                          </span>
                          <span className="text-slate-300">→</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              c.cibilScoreAfter
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {c.cibilScoreAfter || 'In repair'}
                          </span>
                        </div>
                        {scoreGain > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>+{scoreGain} pts improved</span>
                          </div>
                        )}
                      </td>

                      {/* Resolution Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionModalCase(c);
                            setResolutionForm({
                              status: (c.status as PaidCaseStatus) || 'RESOLVED',
                              cibilScoreAfter: c.cibilScoreAfter || (c.cibilScoreBefore ? c.cibilScoreBefore + 80 : 750),
                              issueResolved: c.issueResolved || 'Yes',
                              cibilReportAfterUrl: c.cibilReportAfterUrl || '',
                              remarks: c.remarks || '',
                            });
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer transition-transform active:scale-95 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                          title="Click to update resolution outcome"
                        >
                          {statusMeta.label}
                        </button>
                      </td>

                      {/* Assigned Expert */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <p className="font-bold text-slate-800">
                          {c.assignedCreditExpert || 'Senior Dispute Counsel'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {c.assignedPartnerAssistant || 'Lead Desk Officer'}
                        </p>
                      </td>

                      {/* Issue Resolved? */}
                      <td className="py-3.5 px-4">
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Yes</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>In Progress</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Update Outcome */}
                          <button
                            type="button"
                            onClick={() => {
                              setResolutionModalCase(c);
                              setResolutionForm({
                                status: (c.status as PaidCaseStatus) || 'RESOLVED',
                                cibilScoreAfter: c.cibilScoreAfter || (c.cibilScoreBefore ? c.cibilScoreBefore + 80 : 750),
                                issueResolved: c.issueResolved || 'Yes',
                                cibilReportAfterUrl: c.cibilReportAfterUrl || '',
                                remarks: c.remarks || '',
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1c3859] hover:bg-[#142942] text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                          >
                            Update
                          </button>

                          {/* View All Details */}
                          <button
                            type="button"
                            onClick={() => setDetailsModalCase(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Inspect 24-column record"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total paid cases)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: UPDATE RESOLUTION OUTCOME & POST SCORE            */}
      {/* ========================================================= */}
      {resolutionModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-left animate-in fade-in">
            <div className="bg-gradient-to-r from-[#1c3859] to-teal-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                  Case Resolution Desk
                </span>
                <h3 className="text-base font-bold font-heading">
                  Update Outcome • {resolutionModalCase.caseNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolutionModalCase(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{resolutionModalCase.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Baseline Score: <strong>{resolutionModalCase.cibilScoreBefore || 'N/A'}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] text-slate-600 font-bold">
                    {maskPanDisplay(resolutionModalCase.pan)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workflow Status
                  </label>
                  <select
                    value={resolutionForm.status}
                    onChange={(e) =>
                      setResolutionForm({
                        ...resolutionForm,
                        status: e.target.value as PaidCaseStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none bg-white font-semibold"
                  >
                    <option value="PAID">PAID (Enrolled)</option>
                    <option value="ASSIGNED">ASSIGNED (Expert Allocated)</option>
                    <option value="DISPUTE_FILED">DISPUTE_FILED (CICRA Section 21)</option>
                    <option value="IN_FOLLOWUP">IN_FOLLOWUP (Bank Escalation)</option>
                    <option value="RESOLVED">RESOLVED (Derogatory Mark Removed)</option>
                    <option value="NOC_ISSUED">NOC_ISSUED (Bank Clearance Letter)</option>
                    <option value="CLOSED">CLOSED (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Score After Repair
                  </label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={resolutionForm.cibilScoreAfter}
                    onChange={(e) =>
                      setResolutionForm({
                        ...resolutionForm,
                        cibilScoreAfter: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issue Resolved?
                  </label>
                  <select
                    value={resolutionForm.issueResolved}
                    onChange={(e) =>
                      setResolutionForm({
                        ...resolutionForm,
                        issueResolved: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none bg-white font-semibold"
                  >
                    <option value="Yes">Yes (Resolved)</option>
                    <option value="No">No (Still Disputing)</option>
                    <option value="Partial">Partial Resolution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NOC / Report URL
                  </label>
                  <input
                    type="url"
                    value={resolutionForm.cibilReportAfterUrl}
                    onChange={(e) =>
                      setResolutionForm({
                        ...resolutionForm,
                        cibilReportAfterUrl: e.target.value,
                      })
                    }
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resolution Remarks &amp; Bank Details
                </label>
                <textarea
                  rows={3}
                  value={resolutionForm.remarks}
                  onChange={(e) =>
                    setResolutionForm({ ...resolutionForm, remarks: e.target.value })
                  }
                  placeholder="e.g. HDFC Bank approved settlement NOC on 15-Mar-2025. CIBIL score refreshed from 620 to 748."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionModalCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResolution}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>{isSubmittingResolution ? 'Saving...' : 'Save Resolution Outcome'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FULL CASE DETAILS (24-COLUMN RECORD INSPECTOR)     */}
      {/* ========================================================= */}
      {detailsModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto text-left animate-in fade-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Paid Customer Sheet Record
                </span>
                <h3 className="text-base font-bold font-heading">
                  {detailsModalCase.caseNumber} • {detailsModalCase.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalCase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">PAN</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {maskPanDisplay(detailsModalCase.pan, detailsModalCase.id)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Fee Paid</span>
                  <p className="font-bold text-emerald-700 mt-0.5">
                    ₹{(detailsModalCase.amountPaid || 1999).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Score Gain</span>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {detailsModalCase.cibilScoreBefore || 'N/A'} → {detailsModalCase.cibilScoreAfter || 'In repair'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">City / State</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalCase.cityState || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned Expert</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalCase.assignedCreditExpert || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Resolution</span>
                  <p className="font-bold text-teal-700 mt-0.5">{detailsModalCase.issueResolved || 'In Progress'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Derogatory Accounts Disputed</h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {detailsModalCase.issuesIdentified || 'None recorded'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Expert Remarks &amp; Resolution Notes</h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {detailsModalCase.remarks || 'No notes added'}
                </p>
              </div>

              {detailsModalCase.cibilReportAfterUrl && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">NOC / Document Proof</h4>
                  <a
                    href={detailsModalCase.cibilReportAfterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{detailsModalCase.cibilReportAfterUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalCase(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
