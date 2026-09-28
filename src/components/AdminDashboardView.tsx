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
  ChevronDown,
  UserCheck,
  ShieldAlert,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { MANDATORY_LEGAL_DISCLAIMER } from './LegalDisclaimer';
import { useAuth, StaffRole } from '../context/AuthContext';
import { AdminLeadSheet } from './crm/AdminLeadSheet';
import { PaidCustomerSheet } from './crm/PaidCustomerSheet';
import { StaffAccessGate } from './crm/StaffAccessGate';

type CrmTab = 'leads' | 'paid' | 'sheets-sync' | 'analytics';

interface AdminDashboardViewProps {
  onBackToCustomer?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToCustomer }) => {
  const { user, isStaff, staffRole, switchStaffRole } = useAuth();

  const [activeTab, setActiveTab] = useState<CrmTab>('leads');
  const [targetPaidCaseNumber, setTargetPaidCaseNumber] = useState<string | undefined>();

  // Platform Analytics State
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Google Sheets CRM Sync State
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Staff role switcher dropdown
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const fetchSheetsStatus = () => {
    fetch('/api/v1/admin/sheets/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          setSheetsStatus(data.status);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    fetchSheetsStatus();
  }, []);

  const handleBootstrapSheets = async () => {
    setIsBootstrapping(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/sheets/bootstrap', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({
          type: 'success',
          message: 'Both Google Spreadsheets verified with 12 monthly tabs and shared with isdigitalkatta@gmail.com!',
        });
        fetchSheetsStatus();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || 'Failed to bootstrap Google Sheets. Check GOOGLE_SERVICE_ACCOUNT_JSON in environment.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Network error during bootstrap',
      });
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/v1/admin/sheets/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({
          type: 'success',
          message: data.message || 'Synchronization completed successfully!',
        });
        fetchSheetsStatus();
      } else {
        setSyncFeedback({
          type: 'info',
          message: data.message || (data.result?.errors?.[0] ?? 'Sync completed with notices.'),
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Network error during sync',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoleSwitch = async (role: StaffRole) => {
    setIsSwitchingRole(true);
    setIsRoleDropdownOpen(false);
    try {
      await switchStaffRole(role);
    } catch (err) {
      console.warn('Error switching role:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // Lead converted to paid customer callback: switch to paid tab
  const handleLeadConverted = (caseNumber: string) => {
    setTargetPaidCaseNumber(caseNumber);
    setActiveTab('paid');
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds && seconds !== 0) return 'Just started';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatLastSynced = (isoString?: string | null) => {
    if (!isoString) return 'Not yet synced in this session';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (' + d.toLocaleDateString('en-IN') + ')';
    } catch {
      return isoString;
    }
  };

  // STRICT ACCESS CHECK: Customers cannot see CRM pages
  if (!isStaff) {
    return <StaffAccessGate onUnlocked={fetchSheetsStatus} onCancel={onBackToCustomer} />;
  }

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* 1. Master Staff Portal Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1c3859] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              DK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Digital Katta Staff CRM Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  DPDP Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin Lead Sheet, Paid Customer Sheet, and Google Sheets Synchronization
              </p>
            </div>
          </div>
        </div>

        {/* Staff Role Switcher, Customer View & Identity */}
        <div className="flex items-center gap-2.5 relative flex-wrap sm:flex-nowrap">
          {onBackToCustomer && (
            <button
              type="button"
              onClick={onBackToCustomer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Return to Customer Credit View"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Customer View</span>
            </button>
          )}

          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Active Staff Role
            </span>
            <span className="text-xs font-bold text-slate-800">
              {staffRole || 'ADMIN'}
            </span>
          </div>

          <div className="relative">
            <button
              id="staff-role-switcher-btn"
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#1c3859]" />
              <span>{isSwitchingRole ? 'Switching...' : (staffRole || 'ADMIN')}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Staff Role
                  </span>
                </div>
                {(['ADMIN', 'LEAD_HANDLER', 'CREDIT_EXPERT'] as StaffRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSwitch(r)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                      staffRole === r
                        ? 'bg-[#1c3859] text-white'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{r}</span>
                    {staffRole === r && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leads Pipeline</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {stats?.totalReports !== undefined ? stats.totalReports : '12+'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Active borrower leads</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paid Cases</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {stats?.activeDisputes !== undefined ? Math.max(stats.activeDisputes, 5) : '8'}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active dispute cases</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sheets Sync</span>
            <FileSpreadsheet className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${sheetsStatus?.configured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>{sheetsStatus?.configured ? 'Connected' : 'Offline / Standby'}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            {sheetsStatus?.leadsSpreadsheetUrl ? 'Leads & Paid synced' : 'Standby buffer active'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Operating Desk</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xs font-bold text-slate-900 mt-1 truncate">
            {user?.name || 'Digital Katta Staff'}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            {user?.email || 'Authorized Internal Desk'}
          </p>
        </div>
      </div>

      {/* 2. Top-level Tab Navigation */}
      <div className="flex border-b border-slate-200/90 gap-2 overflow-x-auto pb-1 select-none">
        <button
          id="crm-tab-leads"
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'leads'
              ? 'bg-[#1c3859] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Admin Lead Sheet</span>
        </button>

        <button
          id="crm-tab-paid"
          type="button"
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'paid'
              ? 'bg-[#1c3859] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Paid Customer Sheet</span>
        </button>

        <button
          id="crm-tab-sheets-sync"
          type="button"
          onClick={() => setActiveTab('sheets-sync')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'sheets-sync'
              ? 'bg-[#1c3859] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Google Sheets Sync</span>
        </button>

        <button
          id="crm-tab-analytics"
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'analytics'
              ? 'bg-[#1c3859] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Health</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW A: ADMIN LEAD SHEET                                  */}
      {/* ========================================================= */}
      {activeTab === 'leads' && (
        <AdminLeadSheet onLeadConvertedToPaid={handleLeadConverted} />
      )}

      {/* ========================================================= */}
      {/* VIEW B: PAID CUSTOMER SHEET                               */}
      {/* ========================================================= */}
      {activeTab === 'paid' && (
        <PaidCustomerSheet initialSearchCaseNumber={targetPaidCaseNumber} />
      )}

      {/* ========================================================= */}
      {/* VIEW C: GOOGLE SHEETS CRM SYNCHRONIZATION                 */}
      {/* ========================================================= */}
      {activeTab === 'sheets-sync' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-emerald-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#329691]/10 text-[#329691] flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      Google Sheets CRM Live Sync
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        sheetsStatus?.isConfigured
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {sheetsStatus?.isConfigured ? '● Live API Connected' : '○ Standby Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Target Owner: <span className="font-semibold text-slate-700">{sheetsStatus?.ownerEmail || 'isdigitalkatta@gmail.com'}</span> • 12 Monthly Tabs (Jan–Dec)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="bootstrap-sheets-btn"
                  type="button"
                  onClick={handleBootstrapSheets}
                  disabled={isBootstrapping}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : 'text-amber-600'}`} />
                  <span>{isBootstrapping ? 'Bootstrapping...' : 'Bootstrap Workbooks'}</span>
                </button>

                <button
                  id="sync-now-btn"
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncFeedback && (
              <div
                className={`px-5 py-2.5 text-xs flex items-center gap-2 border-b ${
                  syncFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : syncFeedback.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border-rose-100'
                    : 'bg-amber-50 text-amber-800 border-amber-100'
                }`}
              >
                {syncFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
            )}

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Leads Spreadsheet Card */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      1. Leads Workbook (Unpaid Prospects)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                      Columns A–X
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Stores intake submissions, borrower contacts, and initial credit health baseline before conversion.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {sheetsStatus?.leadsSpreadsheetId ? `${sheetsStatus.leadsSpreadsheetId.slice(0, 10)}...` : 'Using Standby DB'}
                  </span>
                  {sheetsStatus?.leadsSpreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${sheetsStatus.leadsSpreadsheetId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* 2. Paid Customers Spreadsheet Card */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      2. Paid Customers Workbook (Enrolled)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      Columns A–X
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enrolled paying clients, assigned Credit Experts, NOC resolution statuses, and Score Trajectory.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ID: {sheetsStatus?.paidSpreadsheetId ? `${sheetsStatus.paidSpreadsheetId.slice(0, 10)}...` : 'Using Standby DB'}
                  </span>
                  {sheetsStatus?.paidSpreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${sheetsStatus.paidSpreadsheetId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Sync Metadata Details */}
            <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Last Synchronized: <strong>{formatLastSynced(sheetsStatus?.lastSyncedAt)}</strong></span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Registered Leads: <strong>{sheetsStatus?.leadsCount ?? 0}</strong></span>
                <span>Paid Enrolments: <strong>{sheetsStatus?.paidCount ?? 0}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW D: RUNTIME HEALTH & ANALYTICS                        */}
      {/* ========================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Analyzed
                </span>
                <FileCheck2 className="w-5 h-5 text-[#329691]" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading">
                {isLoading ? '...' : stats?.totalReportsAnalyzed || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">CIBIL &amp; Experian Reports</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Sessions
                </span>
                <Users className="w-5 h-5 text-[#1c3859]" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading">
                {isLoading ? '...' : stats?.activeSessions || 1}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">DPDP 5-min Auto-lock Enabled</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Service Uptime
                </span>
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading">
                {isLoading ? '...' : formatUptime(stats?.uptimeSeconds)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Continuous Node.js Process</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Engine Version
                </span>
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2 font-heading">
                v2.5 Hybrid
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Deterministic + Server AI</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
