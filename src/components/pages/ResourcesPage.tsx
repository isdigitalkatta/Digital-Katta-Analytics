import React from 'react';
import {
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Award,
  Scale,
  Building2,
  FileText,
  HelpCircle,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-5xl mx-auto pb-10">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
          Credit & Legal Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
          Official statutory dispute mechanisms, RBI Ombudsman guidelines, and credit education.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Resource 1: RBI Integrated Ombudsman */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F56B2B] flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#12233F]">
            RBI Integrated Ombudsman Scheme (2021)
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            If a bank fails to resolve your credit report dispute or overdue status within 30 days, file an escalation directly with the Reserve Bank of India.
          </p>
          <a
            href="https://cms.rbi.org.in"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F56B2B] mt-4 hover:underline"
          >
            <span>Visit RBI CMS Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Resource 2: CICRA Act 2005 Dispute Rights */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0284C7] flex items-center justify-center mb-3">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#12233F]">
            CICRA Act 2005 &amp; Section 21
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Statutory rights under the Credit Information Companies (Regulation) Act. Credit bureaus must investigate disputes within 30 days or provide written justification.
          </p>
          <div className="mt-4 text-xs font-bold text-[#0284C7]">
            30-Day Mandatory Bureau SLA
          </div>
        </div>

        {/* Resource 3: DPDP Act 2023 Compliance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#12233F]">
            Data Privacy &amp; Protection (DPDP 2023)
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Digital Katta operates with absolute client-side ephemeral isolation. Your raw financial data and credit numbers are never saved on external tracking servers.
          </p>
          <div className="mt-4 text-xs font-bold text-emerald-700">
            Zero Data Retention Guarantee
          </div>
        </div>

        {/* Resource 4: Dispute Letter Templates */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#9333EA] flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-[#12233F]">
            Legal Formal Notice Formats
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Generate customized legal notice letters for incorrect accounts, wrongful settlements, identity mix-ups, and unauthorized hard enquiries.
          </p>
          <div className="mt-4 text-xs font-bold text-[#9333EA]">
            Ready-to-Print Formats
          </div>
        </div>
      </div>
    </div>
  );
};
