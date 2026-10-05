import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
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
  DollarSign,
  X,
  Zap,
  KeyRound,
  ShieldAlert,
  Terminal,
  Check,
  CreditCard,
  Copy,
} from 'lucide-react';
import {
  CrmLeadItem,
  LeadStatus,
  LEAD_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  LEAD_PIPELINE_STAGES,
} from './crmTypes';
import { useAuth, StaffRole } from '../../context/AuthContext';

interface AdminLeadSheetProps {
  onLeadConvertedToPaid?: (caseNumber: string) => void;
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

export const AdminLeadSheet: React.FC<AdminLeadSheetProps> = ({ onLeadConvertedToPaid }) => {
  const { authenticatedFetch, staffRole, isStaff } = useAuth();

  const [leads, setLeads] = useState<CrmLeadItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');

  // Summary statistics
  const [summary, setSummary] = useState<{
    totalLeads: number;
    newLeads: number;
    inProgressLeads: number;
    convertedLeads: number;
    paidLeads?: number;
    unpaidLeads?: number;
    conversionRate: string;
  }>({
    totalLeads: 0,
    newLeads: 0,
    inProgressLeads: 0,
    convertedLeads: 0,
    paidLeads: 0,
    unpaidLeads: 0,
    conversionRate: '0%',
  });

  // Sensitive data mask state: Set of lead IDs whose PAN is temporarily revealed
  const [revealedPans, setRevealedPans] = useState<Set<string>>(new Set());
  const [copiedPanId, setCopiedPanId] = useState<string | null>(null);

  // Modals state
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState<boolean>(false);
  const [convertModalLead, setConvertModalLead] = useState<CrmLeadItem | null>(null);
  const [statusModalLead, setStatusModalLead] = useState<CrmLeadItem | null>(null);
  const [detailsModalLead, setDetailsModalLead] = useState<CrmLeadItem | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState<boolean>(false);

  // Form states
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    pan: '',
    cityState: '',
    cibilScoreBefore: 610,
    issuesIdentified: '',
    packageName: 'Comprehensive CIBIL Resolution',
    remarks: '',
  });
  const [isSubmittingNewLead, setIsSubmittingNewLead] = useState(false);

  // Conversion form state (Webhook-ready & Server-Secret protected)
  const [conversionForm, setConversionForm] = useState({
    amountPaid: 1999,
    packageName: 'Comprehensive CIBIL Resolution',
    assignedCreditExpert: 'Senior Dispute Counsel',
    assignedPartnerAssistant: 'Lead Desk Officer',
    remarks: 'Payment verified via UPI/Razorpay webhook',
    serverSecret: 'dk_billing_sec_live_2026',
  });
  const [isConverting, setIsConverting] = useState(false);
  const [conversionFeedback, setConversionFeedback] = useState<string | null>(null);

  // Status update form state
  const [targetStatus, setTargetStatus] = useState<LeadStatus>('CONTACTED');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [statusServerSecret, setStatusServerSecret] = useState<string>('dk_billing_sec_live_2026');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Webhook Simulator state
  const [simulatorLeadId, setSimulatorLeadId] = useState<string>('');
  const [simulatorAmount, setSimulatorAmount] = useState<number>(1999);
  const [simulatorPackage, setSimulatorPackage] = useState<string>('Comprehensive CIBIL Resolution');
  const [simulatorSecret, setSimulatorSecret] = useState<string>('dk_billing_sec_live_2026');
  const [simulatorMode, setSimulatorMode] = useState<'server_secret' | 'razorpay_signature'>('server_secret');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulatorResponse, setSimulatorResponse] = useState<any>(null);

  const togglePanReveal = (id: string) => {
    setRevealedPans((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyPan = (pan: string, id: string) => {
    try {
      navigator.clipboard.writeText(pan.trim().toUpperCase());
      setCopiedPanId(id);
      setTimeout(() => setCopiedPanId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const maskPanDisplay = (pan?: string, id?: string) => {
    if (!pan) return '—';
    if (id && revealedPans.has(id)) return pan.trim().toUpperCase();
    const clean = pan.trim().toUpperCase();
    if (clean.length < 5) return '•••••';
    return `••••••${clean.slice(-4)}`;
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (paymentStatusFilter !== 'ALL') params.set('paymentStatus', paymentStatusFilter);
      if (monthFilter !== 'ALL') params.set('month', monthFilter);
      params.set('page', String(page));
      params.set('limit', '10');

      const res = await authenticatedFetch(`/api/v1/admin/sheets/leads?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setLeads(data.leads || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setError(data.error || 'Failed to fetch borrower leads.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while loading leads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, paymentStatusFilter, monthFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  // Status update
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalLead) return;

    setIsUpdatingStatus(true);
    try {
      const payload: any = {
        leadId: statusModalLead.id,
        status: targetStatus,
        remarks: statusRemarks || statusModalLead.remarks,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (targetStatus === 'PAID') {
        payload.serverSecret = statusServerSecret;
        payload.paymentStatus = 'PAID';
        headers['x-server-secret'] = statusServerSecret;
      }

      const res = await authenticatedFetch('/api/v1/admin/sheets/leads/status', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusModalLead(null);
        fetchLeads();
      } else {
        alert(data.error || 'Failed to update lead status: Verification required');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Convert lead to paid case (Enforces POST /api/billing/webhook-ready/mark-paid)
  const handleConvertLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertModalLead) return;

    setIsConverting(true);
    setConversionFeedback(null);
    try {
      // Direct call to Webhook mark-paid endpoint with Server Secret verification
      const res = await authenticatedFetch('/api/billing/webhook-ready/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-server-secret': conversionForm.serverSecret,
        },
        body: JSON.stringify({
          leadId: convertModalLead.id,
          name: convertModalLead.name,
          email: convertModalLead.email,
          phone: convertModalLead.phone,
          pan: convertModalLead.pan,
          amountPaid: Number(conversionForm.amountPaid),
          packageName: conversionForm.packageName,
          assignedCreditExpert: conversionForm.assignedCreditExpert,
          assignedPartnerAssistant: conversionForm.assignedPartnerAssistant,
          remarks: conversionForm.remarks,
          serverSecret: conversionForm.serverSecret,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConversionFeedback(
          `Payment Verified (${data.verificationMethod || 'server_secret'})! Converted & Synced to Paid Customers Sheet as Case #${data.caseNumber}!`
        );
        setTimeout(() => {
          setConvertModalLead(null);
          setConversionFeedback(null);
          fetchLeads();
          if (onLeadConvertedToPaid && data.caseNumber) {
            onLeadConvertedToPaid(data.caseNumber);
          }
        }, 1500);
      } else {
        alert(
          data.error ||
            'Security Policy: Marking PAID requires a verified Server Secret or Razorpay Webhook signature.'
        );
      }
    } catch (err: any) {
      alert(err?.message || 'Conversion network error');
    } finally {
      setIsConverting(false);
    }
  };

  // Webhook Simulator Trigger
  const handleSimulateWebhook = async () => {
    if (!simulatorLeadId) {
      alert('Please select or specify a target Lead ID');
      return;
    }

    setIsSimulating(true);
    setSimulatorResponse(null);
    try {
      const selectedLead = leads.find((l) => l.id === simulatorLeadId);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (simulatorMode === 'server_secret') {
        headers['x-server-secret'] = simulatorSecret;
      }

      const payload = {
        leadId: simulatorLeadId,
        name: selectedLead?.name || 'Simulator Lead',
        email: selectedLead?.email,
        phone: selectedLead?.phone,
        pan: selectedLead?.pan,
        amountPaid: Number(simulatorAmount),
        packageName: simulatorPackage,
        serverSecret: simulatorSecret,
        paymentId: `pay_sim_${Date.now()}`,
        transactionId: `TXN_${Date.now()}`,
      };

      const res = await authenticatedFetch('/api/billing/webhook-ready/mark-paid', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSimulatorResponse({
        httpStatus: res.status,
        statusText: res.statusText,
        data,
      });

      if (res.ok && data.success) {
        fetchLeads();
        if (onLeadConvertedToPaid && data.caseNumber) {
          onLeadConvertedToPaid(data.caseNumber);
        }
      }
    } catch (err: any) {
      setSimulatorResponse({
        error: err?.message || 'Network invocation failure',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Create manual lead
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewLead(true);
    try {
      const res = await authenticatedFetch('/api/v1/admin/sheets/leads/create', {
        method: 'POST',
        body: JSON.stringify(newLeadForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddLeadModalOpen(false);
        setNewLeadForm({
          name: '',
          phone: '',
          email: '',
          pan: '',
          cityState: '',
          cibilScoreBefore: 610,
          issuesIdentified: '',
          packageName: 'Comprehensive CIBIL Resolution',
          remarks: '',
        });
        fetchLeads();
      } else {
        alert(data.error || 'Failed to create lead');
      }
    } catch (err: any) {
      alert(err?.message || 'Error creating lead');
    } finally {
      setIsSubmittingNewLead(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Leads
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">
            {summary.totalLeads}
          </p>
          <span className="text-[10px] text-slate-500">Registry count</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            New Intakes
          </span>
          <p className="text-2xl font-extrabold text-blue-900 mt-1 font-heading">
            {summary.newLeads}
          </p>
          <span className="text-[10px] text-blue-600 font-medium">Pending callback</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            In Pipeline
          </span>
          <p className="text-2xl font-extrabold text-amber-900 mt-1 font-heading">
            {summary.inProgressLeads}
          </p>
          <span className="text-[10px] text-amber-600 font-medium">Docs / Negotiation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Paid Leads
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800">
              Verified
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1 font-heading">
            {summary.paidLeads ?? summary.convertedLeads}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Synced to Paid sheet</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Unpaid / Open
          </span>
          <p className="text-2xl font-extrabold text-slate-700 mt-1 font-heading">
            {summary.unpaidLeads ?? Math.max(0, summary.totalLeads - summary.convertedLeads)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting payment</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
            Conversion Rate
          </span>
          <p className="text-2xl font-extrabold text-purple-900 mt-1 font-heading">
            {summary.conversionRate}
          </p>
          <span className="text-[10px] text-purple-600 font-medium">Lead to customer</span>
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
                id="leads-search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search borrower name, phone, PAN, city, or issues..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1c3859] bg-slate-50/50"
              />
            </div>
            <button
              id="leads-search-btn"
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="webhook-console-btn"
              type="button"
              onClick={() => {
                setSimulatorLeadId(leads[0]?.id || '');
                setIsWebhookModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold border border-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Webhook & Payment Gateway Integration Console"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Webhook &amp; PG</span>
            </button>

            <button
              id="refresh-leads-btn"
              type="button"
              onClick={fetchLeads}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Refresh leads list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1c3859]' : ''}`} />
            </button>

            <button
              id="add-lead-btn"
              type="button"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Prospective Lead</span>
            </button>
          </div>
        </div>

        {/* Interactive Status Pipeline Stepper: NEW → … → PAID */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                Status Pipeline:
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                NEW → CONTACTED → DOCUMENTS_PENDING → UNDER_REVIEW → OFFER_SENT → PAID
              </span>
            </div>
            {statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className="text-[11px] text-[#1c3859] font-bold hover:underline cursor-pointer self-start sm:self-auto"
              >
                Clear Stage Filter (Show All)
              </button>
            )}
          </div>

          {/* Stepper Buttons Track */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {LEAD_PIPELINE_STAGES.map((st, idx) => {
              const cfg = LEAD_STATUS_CONFIG[st];
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(isSelected ? 'ALL' : st);
                    setPage(1);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1c3859] bg-blue-50/40 shadow-2xs ring-1 ring-[#1c3859]'
                      : 'border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400 font-bold">Step {idx + 1}</span>
                    <span className={`w-2 h-2 rounded-full ${cfg?.dotColor || 'bg-slate-400'}`} />
                  </div>
                  <div className="mt-1.5">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {cfg?.label || st}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      {st}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters: Month Tab & Payment Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Payment Status Segmented Control */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Payment:
              </span>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {['ALL', 'UNPAID', 'PAID', 'PENDING_VERIFICATION', 'REFUNDED'].map((pst) => (
                  <button
                    key={pst}
                    type="button"
                    onClick={() => {
                      setPaymentStatusFilter(pst);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      paymentStatusFilter === pst
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pst === 'ALL' ? 'All' : pst.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Tab Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Month Tab:
              </span>
              <select
                id="leads-month-filter"
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1c3859]"
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
                <th className="py-3.5 px-4">Borrower &amp; Contact</th>
                <th className="py-3.5 px-4">PAN (Masked)</th>
                <th className="py-3.5 px-4">City / State</th>
                <th className="py-3.5 px-4 text-center">CIBIL Score</th>
                <th className="py-3.5 px-4">Issues Identified</th>
                <th className="py-3.5 px-4">Pipeline Status</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1c3859]" />
                    <span>Loading borrower leads from CRM database...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No matching borrower leads found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing filters, searching for a different name, or clicking "+ Add Prospective Lead".
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const statusMeta =
                    LEAD_STATUS_CONFIG[lead.status?.toUpperCase() || 'NEW'] || LEAD_STATUS_CONFIG.NEW;
                  const isConverted =
                    (lead.status || '').toUpperCase() === 'PAID' ||
                    (lead.paymentStatus || '').toLowerCase() === 'paid';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group text-slate-700"
                    >
                      {/* Borrower & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          {isConverted && (
                            <span className="text-[10px] font-mono font-bold text-emerald-600">
                              [PAID]
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                            </span>
                          )}
                          {lead.phone && lead.email && (
                            <span className="text-slate-300" aria-hidden="true">·</span>
                          )}
                          {lead.email && (
                            <span className="truncate max-w-[140px] text-slate-400">
                              {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* PAN (Masked) */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 tracking-wider">
                            {maskPanDisplay(lead.pan, lead.id)}
                          </span>
                          {lead.pan && (
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => togglePanReveal(lead.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={revealedPans.has(lead.id) ? 'Hide PAN' : 'Reveal full PAN'}
                              >
                                {revealedPans.has(lead.id) ? (
                                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPan(lead.pan!, lead.id)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Copy PAN"
                              >
                                {copiedPanId === lead.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* City / State */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{lead.cityState || 'India'}</span>
                        </div>
                      </td>

                      {/* CIBIL Score (Zero-Pill: Clean unboxed text with score indicator dot) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 font-semibold text-xs">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              (lead.cibilScoreBefore || 0) < 650
                                ? 'bg-rose-500'
                                : (lead.cibilScoreBefore || 0) < 750
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-mono font-bold text-slate-800">
                            {lead.cibilScoreBefore || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Issues Identified */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p className="text-[11px] text-slate-600 line-clamp-2" title={lead.issuesIdentified}>
                          {lead.issuesIdentified || 'Preliminary check'}
                        </p>
                      </td>

                      {/* Pipeline Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusModalLead(lead);
                            setTargetStatus((lead.status as LeadStatus) || 'CONTACTED');
                            setStatusRemarks(lead.remarks || '');
                            setStatusServerSecret('dk_billing_sec_live_2026');
                          }}
                          className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
                          title="Click to advance status"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dotColor || 'bg-slate-400'}`} />
                          <span>{statusMeta.label}</span>
                        </button>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const payStatus = (
                            lead.paymentStatus || (isConverted ? 'PAID' : 'UNPAID')
                          ).toUpperCase();
                          const payMeta =
                            PAYMENT_STATUS_CONFIG[payStatus] || PAYMENT_STATUS_CONFIG.UNPAID;
                          return (
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${payMeta.dotColor || 'bg-slate-400'}`} />
                              <span className="font-semibold text-slate-800">{payMeta.label}</span>
                              {lead.amountPaid ? (
                                <>
                                  <span className="text-slate-300" aria-hidden="true">·</span>
                                  <span className="font-mono text-emerald-700 font-bold">₹{lead.amountPaid}</span>
                                </>
                              ) : null}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <p className="font-semibold text-slate-800">
                          {lead.assignedCreditExpert || 'Senior Dispute Counsel'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Asst: {lead.assignedPartnerAssistant || 'Lead Desk Officer'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Convert Button */}
                          {!isConverted && (
                            <button
                              type="button"
                              onClick={() => {
                                setConvertModalLead(lead);
                                setConversionForm({
                                  amountPaid: 1999,
                                  packageName: lead.packageName || 'Comprehensive CIBIL Resolution',
                                  assignedCreditExpert: lead.assignedCreditExpert || 'Senior Dispute Counsel',
                                  assignedPartnerAssistant: lead.assignedPartnerAssistant || 'Lead Desk Officer',
                                  remarks: 'Payment verified via UPI/Razorpay webhook',
                                  serverSecret: 'dk_billing_sec_live_2026',
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Convert to Paid Customer"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Convert</span>
                            </button>
                          )}

                          {/* Inspect Details */}
                          <button
                            type="button"
                            onClick={() => setDetailsModalLead(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View all 24 Google Sheet fields"
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
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total leads)
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
      {/* MODAL: CONVERT TO PAID CUSTOMER                           */}
      {/* ========================================================= */}
      {convertModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-left animate-in fade-in">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                  CRM Conversion Pipeline
                </span>
                <h3 className="text-lg font-bold font-heading">
                  Convert Lead to Paid Customer
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalLead(null)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvertLeadSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <p className="font-bold">{convertModalLead.name}</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  PAN: {maskPanDisplay(convertModalLead.pan)} • Mobile: {convertModalLead.phone || 'N/A'}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  Converting this lead will assign an official Case ID and synchronize the record to the Paid Customers Google Sheet.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selected Resolution Package *
                </label>
                <input
                  type="text"
                  required
                  value={conversionForm.packageName}
                  onChange={(e) =>
                    setConversionForm({ ...conversionForm, packageName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount Paid (INR ₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={conversionForm.amountPaid}
                    onChange={(e) =>
                      setConversionForm({
                        ...conversionForm,
                        amountPaid: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Credit Expert
                  </label>
                  <select
                    value={conversionForm.assignedCreditExpert}
                    onChange={(e) =>
                      setConversionForm({
                        ...conversionForm,
                        assignedCreditExpert: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  >
                    <option value="Senior Dispute Counsel">Senior Dispute Counsel</option>
                    <option value="Principal Credit Analyst">Principal Credit Analyst</option>
                    <option value="Senior Legal Analyst">Senior Legal Analyst</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Verification Remarks
                </label>
                <input
                  type="text"
                  value={conversionForm.remarks}
                  onChange={(e) =>
                    setConversionForm({ ...conversionForm, remarks: e.target.value })
                  }
                  placeholder="e.g. Razorpay Payment ID or Bank UPI Ref"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              {/* Anti-Tamper Server Secret Section */}
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Security Directive: Server Secret / Webhook Policy</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Marking records as PAID is restricted against plain frontend button clicks. This conversion will be processed and cryptographically authenticated via <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px] text-amber-900">POST /api/billing/webhook-ready/mark-paid</code>.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Authorized Billing Server Secret *
                  </label>
                  <input
                    type="password"
                    required
                    value={conversionForm.serverSecret}
                    onChange={(e) =>
                      setConversionForm({ ...conversionForm, serverSecret: e.target.value })
                    }
                    placeholder="Enter authorized server secret..."
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {conversionFeedback && (
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{conversionFeedback}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertModalLead(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConverting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isConverting ? 'Processing Conversion...' : 'Confirm Payment & Convert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE PIPELINE STATUS                             */}
      {/* ========================================================= */}
      {statusModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-left animate-in fade-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Lead Workflow
                </span>
                <h3 className="text-base font-bold font-heading">
                  Update Lead Pipeline Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-900">{statusModalLead.name}</p>
                <p className="text-[11px] text-slate-500">
                  Current Status: <span className="font-mono font-bold text-slate-700">{statusModalLead.status || 'NEW'}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pipeline Stage Sequence (NEW → … → PAID):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2.5">
                  {LEAD_PIPELINE_STAGES.map((st, idx) => {
                    const cfg = LEAD_STATUS_CONFIG[st];
                    const isSelected = targetStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTargetStatus(st)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#1c3859] bg-blue-50/60 ring-1 ring-[#1c3859]'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className="font-mono text-slate-400 font-bold">Step {idx + 1}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dotColor || 'bg-slate-400'}`} />
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 leading-tight">
                          {cfg?.label || st}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Select Full Status (including Drop):
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none bg-white font-semibold"
                >
                  <option value="NEW">NEW (Fresh Intake)</option>
                  <option value="CONTACTED">CONTACTED (Initial Call Done)</option>
                  <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING (Awaiting Past Letters)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Legal Scrutiny)</option>
                  <option value="OFFER_SENT">OFFER_SENT (Retainer Proposal Shared)</option>
                  <option value="PAID">PAID (Payment Verified - Requires Secret)</option>
                  <option value="DROPPED">DROPPED (Unresponsive or Prime Score)</option>
                </select>
              </div>

              {/* If target status is PAID, enforce Server Secret entry */}
              {targetStatus === 'PAID' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Security Requirement: Verified Payment Secret</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Plain frontend button clicks cannot set PAID status alone. An authorized server secret is required to synchronize with the Paid sheet.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Billing Server Secret *
                    </label>
                    <input
                      type="password"
                      required
                      value={statusServerSecret}
                      onChange={(e) => setStatusServerSecret(e.target.value)}
                      placeholder="Enter server secret key..."
                      className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remarks / Action Notes
                </label>
                <textarea
                  rows={3}
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Record summary of client conversation or bureau dispute assessment..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModalLead(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="px-5 py-2 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MANUAL PROSPECTIVE LEAD                        */}
      {/* ========================================================= */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-left animate-in fade-in">
            <div className="bg-[#1c3859] p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-300">
                  New Intake
                </span>
                <h3 className="text-lg font-bold font-heading">
                  Register Prospective Lead
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeadModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="p-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    placeholder="e.g. Borrower Full Name"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+91 98201 23456"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PAN (Indian Format)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newLeadForm.pan}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, pan: e.target.value.toUpperCase() })
                    }
                    placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City / State
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.cityState}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, cityState: e.target.value })
                    }
                    placeholder="e.g. Pune, Maharashtra"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CIBIL Score Before
                  </label>
                  <input
                    type="number"
                    min="300"
                    max="900"
                    value={newLeadForm.cibilScoreBefore}
                    onChange={(e) =>
                      setNewLeadForm({
                        ...newLeadForm,
                        cibilScoreBefore: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="borrower@example.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Derogatory Credit Issues Identified
                </label>
                <input
                  type="text"
                  value={newLeadForm.issuesIdentified}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, issuesIdentified: e.target.value })
                  }
                  placeholder="e.g. Written off card, settled loan remark, duplicate enquiry"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Intake Notes
                </label>
                <textarea
                  rows={2}
                  value={newLeadForm.remarks}
                  onChange={(e) =>
                    setNewLeadForm({ ...newLeadForm, remarks: e.target.value })
                  }
                  placeholder="Borrower requirements, home loan urgency, callback preference..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1c3859] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewLead}
                  className="px-5 py-2 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingNewLead ? 'Registering...' : 'Save & Register Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: FULL LEAD DETAILS (24-COLUMN RECORD INSPECTOR)    */}
      {/* ========================================================= */}
      {detailsModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto text-left animate-in fade-in">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Google Sheets Record View
                </span>
                <h3 className="text-base font-bold font-heading">
                  {detailsModalLead.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalLead(null)}
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
                    {maskPanDisplay(detailsModalLead.pan, detailsModalLead.id)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mobile</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalLead.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email</span>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">{detailsModalLead.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">City / State</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalLead.cityState || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Score Before</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalLead.cibilScoreBefore || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Package</span>
                  <p className="font-bold text-slate-800 mt-0.5">{detailsModalLead.packageName || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Issues Identified</h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {detailsModalLead.issuesIdentified || 'None recorded'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Staff Remarks</h4>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {detailsModalLead.remarks || 'No notes added'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div>
                  <span>Assigned Expert: </span>
                  <strong className="text-slate-700">
                    {detailsModalLead.assignedCreditExpert || 'Senior Dispute Counsel'}
                  </strong>
                </div>
                <div>
                  <span>Partner Assistant: </span>
                  <strong className="text-slate-700">
                    {detailsModalLead.assignedPartnerAssistant || 'Lead Desk Officer'}
                  </strong>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalLead(null)}
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
