import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { AIAnalysisResult, NormalizedCreditReport } from '../types';
import { formatIndianCurrency } from '../utils/normalizer';
import { CompanyLogo } from './CompanyLogo';
import { LegalDisclaimer } from './LegalDisclaimer';
import { exportReportToPdf, printReportDocument } from '../utils/pdfExport';

interface ExportReportViewProps {
  report: NormalizedCreditReport;
  analysis: AIAnalysisResult;
}

export const ExportReportView: React.FC<ExportReportViewProps> = ({
  report,
  analysis,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const cleanBorrowerName = report.personal.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Borrower';
  const reportFileName = `Digital_Katta_Credit_Health_Report_${cleanBorrowerName}.pdf`;

  const handleSavePdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setStatusMessage(null);

    try {
      await exportReportToPdf('printable-credit-report', {
        fileName: reportFileName,
        onProgress: (status) => setPdfProgressText(status),
      });

      setStatusMessage({
        type: 'success',
        text: `PDF successfully downloaded (${reportFileName}).`,
      });
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not generate PDF. Please try printing or downloading JSON data.',
      });
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText('');
    }
  };

  const handlePrint = async () => {
    setStatusMessage(null);
    try {
      const printed = await printReportDocument(
        'printable-credit-report',
        `Digital Katta Credit Health Dossier - ${report.personal.name}`
      );

      if (!printed) {
        // If print dialog is blocked in iframe sandbox, auto-trigger direct PDF export
        setStatusMessage({
          type: 'info',
          text: 'Print dialog restricted in preview iframe. Automatically downloading direct PDF instead...',
        });
        await handleSavePdf();
      }
    } catch (err) {
      console.warn('Print trigger warning, invoking PDF fallback:', err);
      await handleSavePdf();
    }
  };

  const handleDownloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ report, analysis }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `Digital_Katta_Credit_Report_${cleanBorrowerName}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatusMessage({
      type: 'success',
      text: 'JSON data report downloaded successfully.',
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Non-printed Toolbar */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              AI Credit Health Diagnostic Report
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Print & PDF Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Export a comprehensive dossier including score breakdown, negative accounts, dispute checklist, and 30/60/90 action plan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Export raw structured data"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Data (JSON)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Open browser print dialog or print to local printer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleSavePdf}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed"
            title="Directly compile and download multi-page PDF document"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pdfProgressText || 'Generating PDF...'}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Save as PDF (.pdf)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress / Status feedback banner */}
      {statusMessage && (
        <div
          className={`print:hidden p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-black/5 rounded-md text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Printable Report Canvas */}
      <div
        id="printable-credit-report"
        className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-4xl mx-auto space-y-8 print:p-0 print:border-none print:shadow-none print:max-w-none"
      >
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print-break-inside-avoid">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
              <CompanyLogo size="md" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                Digital Katta – Credit Health Report
              </h1>
              <p className="text-xs text-slate-500">
                AI Powered Indian CIBIL & Credit Bureau Diagnostic Dossier • ठिकाण एक, सुविधा अनेक..!
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>
              Generated: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
            </div>
            <div>
              Report Ref: <strong className="font-mono">{report.personal.reportNumber || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Borrower & Score Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 print-break-inside-avoid">
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
              <div>
                Total Accounts: <strong>{report.summary.totalAccounts}</strong> ({report.summary.activeAccounts} Active)
              </div>
              <div>
                Active Overdue: <strong className="text-rose-600">{formatIndianCurrency(report.summary.totalOverdue)}</strong>
              </div>
              <div>
                Card Utilization: <strong>{report.summary.creditCardUtilizationPct}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* AI Health Summary */}
        <div className="space-y-2 text-xs print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1">
            Executive Diagnostic Summary
          </h3>
          <p className="text-slate-700 leading-relaxed">
            {analysis.creditHealth.summary}
          </p>
        </div>

        {/* Critical Issues */}
        {analysis.criticalIssues.length > 0 && (
          <div className="space-y-3 text-xs print-break-inside-avoid">
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
        <div className="space-y-3 text-xs print-break-inside-avoid">
          <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1">
            Negative & Watch-list Accounts ({analysis.negativeAccounts.length})
          </h3>
          {analysis.negativeAccounts.length === 0 ? (
            <p className="text-slate-500 italic">No negative or delinquent accounts recorded.</p>
          ) : (
            <div className="space-y-3">
              {analysis.negativeAccounts.map((acc, i) => (
                <div key={i} className="p-3.5 rounded-lg border border-slate-200 text-xs space-y-2 print-break-inside-avoid">
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
          <div className="space-y-3 text-xs print-break-inside-avoid">
            <h3 className="text-sm font-bold text-slate-900 font-heading border-b border-slate-100 pb-1 text-amber-800">
              Potential Dispute Opportunities ({analysis.disputeOpportunities.length})
            </h3>
            <div className="space-y-2">
              {analysis.disputeOpportunities.map((disp, i) => (
                <div key={i} className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1 print-break-inside-avoid">
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
        <div className="space-y-3 text-xs print-break-inside-avoid">
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
        <div className="pt-6 border-t border-slate-200 text-[10px] text-slate-400 space-y-1 leading-relaxed print-break-inside-avoid">
          <p className="font-semibold text-slate-500">Legal & Regulatory Disclaimer:</p>
          <p>
            Digital Katta is an independent software diagnostic application and is NOT an official credit information company, bank, or governmental regulatory body. This report does not represent an official TransUnion CIBIL, Experian, Equifax, or CRIF High Mark credit report. No guarantee is made regarding loan approvals or specific score point increases. Borrowers should independently verify all claims with respective financial institutions.
          </p>
        </div>
      </div>

      {/* Screen Interactive Legal Disclaimer */}
      <LegalDisclaimer variant="card" className="print:hidden mt-6" />
    </div>
  );
};

