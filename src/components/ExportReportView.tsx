import React from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  Building2,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { AIAnalysisResult, NormalizedCreditReport } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';

interface ExportReportViewProps {
  report: NormalizedCreditReport;
  analysis: AIAnalysisResult;
}

export const ExportReportView: React.FC<ExportReportViewProps> = ({
  report,
  analysis,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ report, analysis }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Digital_Katta_Credit_Report_${report.personal.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Non-printed Toolbar */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            AI Credit Health Diagnostic Report
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export a comprehensive dossier including score breakdown, negative accounts, dispute checklist, and action plan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Data (JSON)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              DK
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Digital Katta – Credit Health Report
              </h1>
              <p className="text-xs text-slate-500">
                AI Powered Indian CIBIL & Credit Bureau Diagnostic Dossier
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>Generated: <strong>{new Date().toLocaleDateString('en-GB')}</strong></div>
            <div>Report Ref: <strong className="font-mono">{report.personal.reportNumber || 'N/A'}</strong></div>
          </div>
        </div>

        {/* Borrower & Score Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Borrower</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{report.personal.name}</div>
            <div className="text-xs text-slate-600 font-mono mt-0.5">PAN: {report.personal.panMasked}</div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">CIBIL Score</span>
            <div className="text-2xl font-extrabold text-blue-600 font-heading mt-0.5">
              {report.score.score}
            </div>
            <div className="text-xs font-semibold text-slate-700">
              {report.score.category} • Risk: {report.score.riskLevel}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Financial Snapshot</span>
            <div className="text-xs text-slate-700 mt-1 space-y-0.5">
              <div>Total Accounts: <strong>{report.summary.totalAccounts}</strong> ({report.summary.activeAccounts} Active)</div>
              <div>Active Overdue: <strong className="text-rose-600">{formatIndianCurrency(report.summary.totalOverdue)}</strong></div>
              <div>Card Utilization: <strong>{report.summary.creditCardUtilizationPct}%</strong></div>
            </div>
          </div>
        </div>

        {/* AI Health Summary */}
        <div className="space-y-2 text-xs">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1">
            Executive Diagnostic Summary
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {analysis.creditHealth.summary}
          </p>
        </div>

        {/* Critical Issues */}
        {analysis.criticalIssues.length > 0 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1 text-rose-700">
              Critical Red Flags Identified ({analysis.criticalIssues.length})
            </h3>
            <div className="space-y-2">
              {analysis.criticalIssues.map((iss, i) => (
                <div key={i} className="p-3 rounded-lg bg-rose-50/70 border border-rose-100 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{iss.title}</span>
                    <span className="text-[10px] text-rose-700 uppercase font-bold">{iss.severity}</span>
                  </div>
                  <p className="text-slate-600">{iss.description}</p>
                  <div className="text-rose-800 font-medium">
                    <strong>Mandatory Action:</strong> {iss.actionImmediate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative Accounts Table */}
        <div className="space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1">
            Negative & Watch-list Accounts ({analysis.negativeAccounts.length})
          </h3>
          {analysis.negativeAccounts.length === 0 ? (
            <p className="text-slate-500 italic">No negative or delinquent accounts recorded.</p>
          ) : (
            <div className="space-y-3">
              {analysis.negativeAccounts.map((acc, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{acc.lender} ({acc.accountType})</span>
                    <span className="font-mono text-slate-500">{acc.accountNumberMasked}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded text-[11px]">
                    <div>Balance: <strong>{formatIndianCurrency(acc.balance)}</strong></div>
                    <div>Overdue: <strong className="text-rose-600">{formatIndianCurrency(acc.overdue)}</strong></div>
                    <div>Status: <strong>{acc.status}</strong></div>
                  </div>
                  <div className="text-slate-700">
                    <strong>Problem:</strong> {acc.problem}
                  </div>
                  <div className="text-slate-800">
                    <strong>Resolution Step:</strong> {acc.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispute Opportunities */}
        {analysis.disputeOpportunities.length > 0 && (
          <div className="space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1 text-amber-800">
              Potential Dispute Opportunities ({analysis.disputeOpportunities.length})
            </h3>
            <div className="space-y-2">
              {analysis.disputeOpportunities.map((disp, i) => (
                <div key={i} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{disp.issue}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                      {disp.recommendedRoute}
                    </span>
                  </div>
                  <p className="text-slate-700"><strong>Inconsistency:</strong> {disp.whyInconsistent}</p>
                  <p className="text-slate-600"><strong>Evidence required:</strong> {disp.evidenceToProvide}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 30/60/90 Day Plan */}
        <div className="space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1">
            Targeted 30 / 60 / 90-Day Action Roadmap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Month 1 (Days 1–30)</span>
              <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {analysis.actionPlan30_60_90.days8To30.slice(0, 3).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Month 2 (Days 31–60)</span>
              <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {analysis.actionPlan30_60_90.days31To60.slice(0, 3).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Month 3 (Days 61–90)</span>
              <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {analysis.actionPlan30_60_90.days61To90.slice(0, 3).map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-500">Legal & Regulatory Disclaimer:</p>
          <p>
            Digital Katta is an independent software diagnostic application and is NOT an official credit information company, bank, or governmental regulatory body. This report does not represent an official TransUnion CIBIL, Experian, Equifax, or CRIF High Mark credit report. No guarantee is made regarding loan approvals or specific score point increases. Borrowers should independently verify all claims with respective financial institutions.
          </p>
        </div>
      </div>
    </div>
  );
};
