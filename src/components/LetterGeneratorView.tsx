import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Download,
  Printer,
  Sparkles,
  Check,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CreditAccount, NormalizedCreditReport } from '../types';
import { useAuth } from '../context/AuthContext';
import { LegalDisclaimer } from './LegalDisclaimer';

interface LetterGeneratorViewProps {
  report: NormalizedCreditReport;
  prefillAccountId?: string;
  prefillIssueType?: string;
}

export const LetterGeneratorView: React.FC<LetterGeneratorViewProps> = ({
  report,
  prefillAccountId,
  prefillIssueType,
}) => {
  const { authenticatedFetch } = useAuth();
  const issueTypes = [
    { id: 'Account Closure Update', label: 'Account Closure Not Reflected (NOC Available)' },
    { id: 'Incorrect Overdue Balance', label: 'Spurious / Incorrect Overdue Amount' },
    { id: 'Incorrect DPD / Late Mark', label: 'Incorrect Days Past Due (DPD) Correction' },
    { id: 'Incorrect Written-Off Status', label: 'Incorrect Written-Off / Loss Classification' },
    { id: 'Settlement Status Rectification', label: 'Settlement / Haircut Status Dispute' },
    { id: 'Duplicate Account Entry', label: 'Duplicate Trade Line from Same Lender' },
    { id: 'Wrong Account Ownership', label: 'Fraudulent / Identity Theft Account' },
    { id: 'Unauthorized Enquiry Dispute', label: 'Unauthorized Hard Credit Enquiry' },
  ];

  const [selectedIssue, setSelectedIssue] = useState<string>(
    prefillIssueType || issueTypes[0].id
  );
  const [selectedAccount, setSelectedAccount] = useState<string>(
    prefillAccountId || (report.accounts.length > 0 ? report.accounts[0].id : '')
  );

  const [borrowerName, setBorrowerName] = useState<string>(report.personal.name || '');
  const [borrowerPan, setBorrowerPan] = useState<string>(report.personal.panMasked || '');
  const [borrowerPhone, setBorrowerPhone] = useState<string>(report.personal.mobileMasked || '+91 ');
  const [borrowerEmail, setBorrowerEmail] = useState<string>(report.personal.email || 'borrower@domain.com');
  const [customDetails, setCustomDetails] = useState<string>(
    'The subject account was paid in full and formal clearance was issued by the branch. Kindly update the bureau records to reflect Closed status with Nil balance.'
  );

  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const currentAccount = report.accounts.find(a => a.id === selectedAccount);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        templateConfig: {
          templateType: selectedIssue,
          lenderName: currentAccount ? currentAccount.lender : 'Financial Institution',
          accountNumberMasked: currentAccount ? currentAccount.accountNumberMasked : 'XXXX-XXXX-XXXX',
          borrowerName,
          borrowerPan,
          borrowerPhone,
          borrowerEmail,
          customDetails,
        },
        report,
      };

      const res = await authenticatedFetch('/api/ai/letter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedLetter(data.letter || '');
      } else {
        throw new Error('Failed to generate letter via server.');
      }
    } catch (err) {
      console.error(err);
      // Fallback letter
      setGeneratedLetter(createLocalTemplate());
    } finally {
      setIsGenerating(false);
    }
  };

  const createLocalTemplate = () => {
    const date = new Date().toLocaleDateString('en-GB');
    const lender = currentAccount ? currentAccount.lender : 'Financial Institution';
    const accNo = currentAccount ? currentAccount.accountNumberMasked : 'XXXX-XXXX';

    return `Date: ${date}

To,
The Principal Nodal Officer / Grievance Redressal Officer,
${lender},
Customer Grievance Redressal Division.

Subject: Formal Grievance & Rectification Notice under RBI CIC Regulations (2006) - Account No: ${accNo}

Dear Sir / Madam,

I am writing to formally dispute an inaccurate record reflected under my TransUnion CIBIL credit report pertaining to facility reference ${accNo} reported by your esteemed institution.

Borrower Particulars:
- Full Name: ${borrowerName}
- PAN: ${borrowerPan}
- Mobile: ${borrowerPhone}
- Email: ${borrowerEmail}

Discrepancy Details:
Category: ${selectedIssue}
${customDetails}

Statutory & Regulatory Provisions:
Under Section 21 of the Credit Information Companies (Regulation) Act, 2005 read with Rule 20 of the CIC Rules 2006 and the Reserve Bank of India Master Directions, credit institutions are legally required to verify, rectify, and transmit corrected credit data to all credit bureaus (CIBIL, Experian, Equifax, CRIF High Mark) within a mandatory period of 30 days from the date of receiving this notice.

Remedies Demanded:
1. Immediately review your internal ledger records for facility ${accNo} and correct the reported data.
2. Ensure the status is updated to reflect zero overdue / closed / paid in full, and remove inaccurate late DPD marks.
3. Transmit the rectified trade line to TransUnion CIBIL in your forthcoming monthly reporting cycle.
4. Provide a formal written acknowledgment and updated No Dues Certificate (NOC) to my registered email address.

Failure to resolve this grievance within the statutory 30-day timeline will constrain me to escalate this matter to the Reserve Bank of India (RBI) Integrated Ombudsman for deficiency in banking services.

Thanking you,

Yours sincerely,

___________________________
${borrowerName}
`;
  };

  // Generate initial template on load
  useEffect(() => {
    handleGenerate();
  }, [selectedAccount, selectedIssue]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Grievance_Letter_${currentAccount?.lender || 'Lender'}_${borrowerName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printLetter = () => {
    try {
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute('title', 'Print Letter Frame');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.visibility = 'hidden';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Banking Grievance Letter - ${borrowerName}</title>
              <style>
                @page { size: A4 portrait; margin: 20mm; }
                body {
                  font-family: 'Courier New', Courier, monospace;
                  font-size: 13px;
                  line-height: 1.6;
                  padding: 24px;
                  white-space: pre-wrap;
                  color: #0f172a;
                  background: #ffffff;
                }
              </style>
            </head>
            <body>${generatedLetter.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print error, falling back to download:', e);
            downloadTextFile();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(printIframe);
              } catch (_) {}
            }, 3000);
          }
        }, 300);
        return;
      }
    } catch (err) {
      console.warn('Print iframe creation error:', err);
    }

    // Fallback if print is prohibited
    downloadTextFile();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Grievance & Correction Letter Generator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal, RBI-compliant grievance letters addressed to bank Principal Nodal Officers and CIBIL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Grievance Particulars
          </h3>

          {/* Issue Type */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Discrepancy Category:</label>
            <select
              value={selectedIssue}
              onChange={e => setSelectedIssue(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              {issueTypes.map(it => (
                <option key={it.id} value={it.id}>
                  {it.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account selector */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Account / Trade Line:</label>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
            >
              {report.accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.lender} - {acc.accountType} ({acc.accountNumberMasked})
                </option>
              ))}
            </select>
          </div>

          {/* Borrower Name & PAN */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Borrower Name:</label>
              <input
                type="text"
                value={borrowerName}
                onChange={e => setBorrowerName(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">PAN Number:</label>
              <input
                type="text"
                value={borrowerPan}
                onChange={e => setBorrowerPan(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile:</label>
              <input
                type="text"
                value={borrowerPhone}
                onChange={e => setBorrowerPhone(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email:</label>
              <input
                type="text"
                value={borrowerEmail}
                onChange={e => setBorrowerEmail(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Description */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Specific Facts & Payment Proof Reference:</label>
            <textarea
              rows={4}
              value={customDetails}
              onChange={e => setCustomDetails(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Loan closed on 14/02/2023 with payment UTR 48271. Final NOC was issued by branch."
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <strong>Pro Tip:</strong> Always attach your official bank loan foreclosure receipt, NOC, and self-attested PAN card when emailing this to the lender nodal officer.
          </div>
        </div>

        {/* Right Output Letter (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Generated Letter Preview</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                RBI Compliant
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={downloadTextFile}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Download text file"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                onClick={printLetter}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Print Letter"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Letter Body */}
          <div className="flex-1 bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap overflow-y-auto max-h-[500px] leading-relaxed select-text">
            {generatedLetter}
          </div>

          <p className="text-[11px] text-slate-400">
            Review all dates and bank particulars before sending via registered post or official bank grievance email.
          </p>
        </div>
      </div>

      <LegalDisclaimer variant="card" className="mt-4" />
    </div>
  );
};
