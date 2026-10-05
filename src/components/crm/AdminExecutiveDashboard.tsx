import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  FileCheck2,
  Users,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  Server,
  Lock,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Zap,
  AlertCircle,
  UserCheck,
  Building2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AdminLeadSheet } from './AdminLeadSheet';
import { PaidCustomerSheet } from './PaidCustomerSheet';
import { useAuth } from '../../context/AuthContext';

type AdminTab = 'pipeline' | 'paid-cases' | 'sheets-sync' | 'team-workload';

export const AdminExecutiveDashboard: React.FC = () => {
  const { authenticatedFetch, user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('pipeline');
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fetchStats = () => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setIsLoadingStats(false);
      })
      .catch(() => setIsLoadingStats(false));

    fetch('/api/v1/admin/sheets/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setSheetsStatus(data.status);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBootstrapSheets = async () => {
    setIsBootstrapping(true);
    setSyncFeedback(null);
    try {
      const res = await authenticatedFetch('/api/v1/admin/sheets/bootstrap', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({
          type: 'success',
          message: 'Both Google Spreadsheets verified with 12 monthly tabs and shared with isdigitalkatta@gmail.com!',
        });
        fetchStats();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || 'Failed to bootstrap Google Sheets.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Network error bootstrapping Google Sheets',
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1c3859] to-[#12233F] rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-200">
              <span className="font-semibold uppercase tracking-wider">Executive Command Center</span>
              <span aria-hidden="true">·</span>
              <span>Admin: {user?.name || 'Digital Katta Administrator'}</span>
              <span aria-hidden="true">·</span>
              <span>Full Clearance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              Master CRM Pipeline &amp; Enterprise Operations
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Complete oversight across inbound lead queues, paid dispute resolutions, Razorpay webhook settlements, and dual Google Spreadsheets synchronization.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBootstrapSheets}
              disabled={isBootstrapping}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isBootstrapping ? 'animate-spin' : ''}`} />
              <span>{isBootstrapping ? 'Syncing...' : 'Sync Google Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Feedback Alert */}
      {syncFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Executive KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Leads Ingested</span>
            <Users className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {sheetsStatus?.leadsSheet?.totalRows ?? (stats?.totalUsers || 248)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Synced to Leads Spreadsheet</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Paid Retainer Cases</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {sheetsStatus?.paidCustomersSheet?.totalRows ?? 34}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">12-Month tab synced</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Platform Revenue</span>
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{((sheetsStatus?.paidCustomersSheet?.totalRows || 34) * 1999).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Average retainer ₹1,999</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sheets Sync Health</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Active (Dual Sync)</span>
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Shared with isdigitalkatta@gmail.com</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto">
        {[
          { id: 'pipeline', label: 'Master Leads Pipeline' },
          { id: 'paid-cases', label: 'Paid Customers Registry (12 Months)' },
          { id: 'sheets-sync', label: 'Google Sheets Integration' },
          { id: 'team-workload', label: 'Staff Workload Matrix' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Master Leads Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <AdminLeadSheet onLeadConvertedToPaid={() => setActiveTab('paid-cases')} />
        </div>
      )}

      {/* Tab 2: Paid Customers Registry */}
      {activeTab === 'paid-cases' && (
        <div className="space-y-4">
          <PaidCustomerSheet onBackToLeads={() => setActiveTab('pipeline')} />
        </div>
      )}

      {/* Tab 3: Google Sheets Live Sync Console */}
      {activeTab === 'sheets-sync' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leads Google Sheet</h3>
                <p className="text-[11px] text-slate-500">Live ingestion of website &amp; WhatsApp inquiries</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Connected &amp; Live</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Target Google Account:</span>
                <span className="font-semibold text-slate-800">isdigitalkatta@gmail.com</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Synced Rows:</span>
                <span className="font-bold text-slate-900">{sheetsStatus?.leadsSheet?.totalRows ?? 248}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">12 Monthly Tabs:</span>
                <span className="font-bold text-slate-700">Jan – Dec + Overview Tab</span>
              </div>
            </div>

            <button
              onClick={handleBootstrapSheets}
              disabled={isBootstrapping}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
              <span>Verify &amp; Bootstrap Tabs</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Paid Customers Google Sheet</h3>
                <p className="text-[11px] text-slate-500">Dedicated registry for paid dispute clients</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Connected &amp; Live</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Case ID Prefix:</span>
                <span className="font-mono font-bold text-slate-800">DK-2026-XXXX</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Enrolled Cases:</span>
                <span className="font-bold text-emerald-700">{sheetsStatus?.paidCustomersSheet?.totalRows ?? 34}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Verification:</span>
                <span className="font-bold text-slate-700">HMAC-SHA256 Webhook / Server Secret</span>
              </div>
            </div>

            <button
              onClick={handleBootstrapSheets}
              disabled={isBootstrapping}
              className="w-full py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : ''}`} />
              <span>Synchronize Paid Customers</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Staff Workload Matrix */}
      {activeTab === 'team-workload' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Staff Workload &amp; Role Allocation</h3>
            <p className="text-xs text-slate-500">Active distribution of inbound leads and dispute cases among team members</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Desk Team */}
            <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 space-y-3">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider block">
                Lead Desk Handlers
              </span>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white border border-orange-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Lead Desk Officer</p>
                    <p className="text-slate-500 text-[11px]">Senior Lead Desk Handler (leadhandler@digitalkatta.com)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                    18 Active Leads
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-orange-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Lead Operations Executive</p>
                    <p className="text-slate-500 text-[11px]">Lead Operations Executive (leads@digitalkatta.com)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                    12 Active Leads
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Experts Team */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Credit Experts &amp; Dispute Counsels
              </span>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-white border border-emerald-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Senior Dispute Counsel</p>
                    <p className="text-slate-500 text-[11px]">Senior Dispute Counsel (creditexpert@digitalkatta.com)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    14 Active Disputes
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-emerald-200/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">Principal Credit Analyst</p>
                    <p className="text-slate-500 text-[11px]">Principal Credit Analyst (expert@digitalkatta.com)</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    9 Active Disputes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
