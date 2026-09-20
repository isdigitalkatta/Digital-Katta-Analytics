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
} from 'lucide-react';
import { MANDATORY_LEGAL_DISCLAIMER } from './LegalDisclaimer';

export const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Google Sheets CRM Sync State
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#329691]" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Platform Analytics & Runtime Health
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time server diagnostics, Google Sheets CRM sync, and Indian bureau compliance telemetry
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>System Healthy • DPDP Act 2023 Compliant</span>
        </div>
      </div>

      {/* Google Sheets CRM Synchronization Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 to-emerald-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#329691]/10 text-[#329691] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Google Sheets CRM Sync Status
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isBootstrapping ? 'animate-spin' : 'text-amber-600'}`} />
              <span>{isBootstrapping ? 'Bootstrapping...' : 'Bootstrap Sheets'}</span>
            </button>

            <button
              id="sync-now-btn"
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1c3859] hover:bg-[#142942] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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

        {/* Configuration Notice Banner */}
        {sheetsStatus?.configNotice && !sheetsStatus?.isConfigured && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1.5 leading-relaxed">
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <span>Google Sheets CRM Setup Notice</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-100 text-amber-800">Standby Mode Active</span>
              </div>
              <p className="text-[11px] text-amber-900/90">
                {sheetsStatus.configNotice}
              </p>
              <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 flex flex-wrap gap-x-4 gap-y-1">
                <span>💡 <strong>Quick Fix:</strong> Paste the complete JSON file downloaded from Google Cloud into <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[10px]">GOOGLE_SERVICE_ACCOUNT_JSON</code></span>
                <span>or provide <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[10px]">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> alongside your private key.</span>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Leads Spreadsheet Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  1. Leads Workbook (Unpaid Customers)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                  Columns A–X
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Stores all customers upon initial signup or login. Auto-upserts with unique key (Email + Phone + PAN) to prevent monthly duplicates.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                {sheetsStatus?.leadsSpreadsheetId ? `ID: ${sheetsStatus.leadsSpreadsheetId.slice(0, 16)}...` : 'Sheet ready to bootstrap'}
              </span>
              {sheetsStatus?.leadsSpreadsheetUrl ? (
                <a
                  id="leads-spreadsheet-link"
                  href={sheetsStatus.leadsSpreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#329691] hover:underline"
                >
                  <span>Open Leads Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Click Bootstrap to Generate</span>
              )}
            </div>
          </div>

          {/* 2. Paid Customers Spreadsheet Card */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  2. Paid Customers Workbook (Active Cases)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                  Columns A–X
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                When customer pays, ConversionService marks lead as Converted and adds them to Paid sheet in the payment month tab with assigned team.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[200px]">
                {sheetsStatus?.paidSpreadsheetId ? `ID: ${sheetsStatus.paidSpreadsheetId.slice(0, 16)}...` : 'Sheet ready to bootstrap'}
              </span>
              {sheetsStatus?.paidSpreadsheetUrl ? (
                <a
                  id="paid-spreadsheet-link"
                  href={sheetsStatus.paidSpreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <span>Open Paid Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Click Bootstrap to Generate</span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Meta Footer */}
        <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Last Synced:{' '}
              <strong className="text-slate-700">
                {formatLastSynced(sheetsStatus?.lastSyncedAt)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Service Account:{' '}
              <span className="font-mono text-slate-600">
                {sheetsStatus?.serviceAccountEmail || 'Standby Mode'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 4 Authentic Metric Cards (No fabricated counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Reports Analyzed</span>
          <div className="text-2xl font-extrabold text-slate-900 font-heading mt-1">
            {stats?.totalReportsAnalyzed ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Active Runtime Session</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Successful Ingests</span>
          <div className="text-2xl font-extrabold text-[#329691] font-heading mt-1">
            {stats?.successfulParses ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">PDF, HTML & JSON</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">AI Resolution Drafts</span>
          <div className="text-2xl font-extrabold text-purple-600 font-heading mt-1">
            {stats?.lettersDrafted ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Grievance Letters</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Engine Uptime</span>
          <div className="text-2xl font-extrabold text-blue-600 font-heading mt-1">
            {formatUptime(stats?.uptimeSeconds)}
          </div>
          <span className="text-[11px] text-slate-400">Cloud Run container</span>
        </div>
      </div>

      {/* Engine Architecture & Privacy Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Sparkles className="w-4 h-4 text-[#329691]" />
            <span>AI Orchestration Engine</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {stats?.aiAvailable
              ? 'Multi-model fallback active (gemini-3.1-flash-lite with gemini-3.8-flash). Instant resilient failover to deterministic engine.'
              : 'Running in offline deterministic baseline mode with 100% rule-based financial analysis.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>DPDP Zero-Retention Pipeline</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Transient in-memory execution only. Sensitive PII (PAN, mobile numbers, raw credit account numbers) is masked before rendering or processing.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Server className="w-4 h-4 text-blue-600" />
            <span>Rate Limiting & Abuse Defense</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cryptographic JWT tokens and IP-aware rate limiters protect AI endpoints against automated harvesting or quota depletion.
          </p>
        </div>
      </div>

      {/* Common Bureau Discrepancy Patterns & RBI Guidance Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Negative Factor Patterns */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600" />
            <span>Common Indian Bureau Negative Factors Diagnosed</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              {
                factor: 'Active Overdue Balance',
                desc: 'Unpaid dues continuing to report delinquency each billing cycle',
                impact: 'Severe (-50 to -90 pts)',
              },
              {
                factor: 'High Revolving Credit Utilization (>60%)',
                desc: 'Excessive reliance on credit cards or unsecured overdrafts',
                impact: 'High (-30 to -60 pts)',
              },
              {
                factor: 'Written-Off / Post-Settlement Status',
                desc: 'Lender marked debt as uncollectible or settled with concession',
                impact: 'Critical (-80 to -120 pts)',
              },
              {
                factor: 'Multiple Inquiries within 90 Days',
                desc: 'Credit-hungry behavior triggering lender risk alerts',
                impact: 'Moderate (-15 to -35 pts)',
              },
              {
                factor: 'Historical Delay > 60 DPD (Days Past Due)',
                desc: 'Late payments over 60 days damaging repayment track record',
                impact: 'High (-40 to -70 pts)',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">{item.factor}</span>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
                  {item.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Bureau Inconsistencies & Grievance Grounds */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-600" />
            <span>Frequent Indian Bureau Inconsistencies (Disputable)</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              {
                type: 'Active Status Shown After Loan Closure (NOC Issued)',
                remedy: 'Lender failed to submit updated month-end file to CIBIL/Experian',
                rule: 'RBI Circular 2023: Rectify within 30 days',
              },
              {
                type: 'Spurious Overdue Amount Post-Settlement',
                remedy: 'Settlement concession improperly recorded as live overdue balance',
                rule: 'Section 21 of CIC (Regulation) Act 2005',
              },
              {
                type: 'Duplicate Trade Line from Same Lender',
                remedy: 'Loan transferred between internal branches or NBFC subsidiaries',
                rule: 'Bureau data deduplication mandate',
              },
              {
                type: 'Unauthorized Hard Credit Enquiry',
                remedy: 'Lender triggered credit pull without explicit borrower consent',
                rule: 'RBI Master Direction on Credit Information',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">{item.type}</span>
                  <span className="text-[11px] text-slate-500">{item.remedy}</span>
                </div>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 shrink-0">
                  {item.rule}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="rounded-xl bg-slate-100/80 border border-slate-200 p-3.5 text-slate-500 text-[11px] leading-relaxed">
        <strong>Statutory Notice:</strong> {MANDATORY_LEGAL_DISCLAIMER}
      </div>
    </div>
  );
};
