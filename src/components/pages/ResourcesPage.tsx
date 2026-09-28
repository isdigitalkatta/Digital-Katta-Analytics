import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Search,
  X,
  ExternalLink,
  ShieldCheck,
  Scale,
  Building2,
  FileText,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileCode,
  Sparkles,
  Lightbulb,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useAppLanguage } from '../../hooks/useAppLanguage';
import {
  CIBIL_GLOSSARY_DATA,
  CIBIL_GLOSSARY_CATEGORIES,
  CIBIL_CODE_CHEAT_SHEET,
  GlossaryTerm,
  GlossaryCategory,
  TermSeverity,
} from '../../data/cibilGlossary';

export const ResourcesPage: React.FC = () => {
  const { currentLang } = useAppLanguage();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GlossaryCategory>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedTermIds, setExpandedTermIds] = useState<Set<string>>(new Set(['dpd', 'suit-filed']));
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Toggle individual card expansion
  const toggleTermExpansion = useCallback((id: string) => {
    setExpandedTermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedTermIds(new Set(CIBIL_GLOSSARY_DATA.map((t) => t.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedTermIds(new Set());
  }, []);

  // Copy code snippet helper
  const handleCopySnippet = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => {
      setCopiedSnippetId((current) => (current === id ? null : current));
    }, 2000);
  }, []);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CIBIL_GLOSSARY_DATA.length };
    CIBIL_GLOSSARY_CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = CIBIL_GLOSSARY_DATA.filter((t) => t.category === cat.id).length;
      }
    });
    return counts;
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return CIBIL_GLOSSARY_DATA.filter((item) => {
      // Category match
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Severity match
      if (selectedSeverity !== 'all' && item.severity !== selectedSeverity) {
        return false;
      }

      // Search match
      if (!q) return true;

      const regionalName = item.regionalNames?.[currentLang]?.toLowerCase() || '';
      return (
        item.term.toLowerCase().includes(q) ||
        (item.acronym && item.acronym.toLowerCase().includes(q)) ||
        item.reportCode.toLowerCase().includes(q) ||
        item.definition.toLowerCase().includes(q) ||
        item.scoreImpact.toLowerCase().includes(q) ||
        item.borrowerImplication.toLowerCase().includes(q) ||
        item.actionStrategy.toLowerCase().includes(q) ||
        item.commonMyth.toLowerCase().includes(q) ||
        regionalName.includes(q)
      );
    });
  }, [searchQuery, selectedCategory, selectedSeverity, currentLang]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSeverity('all');
  }, []);

  // Severity styling helper following Zero-Pill & Metadata guidelines
  const getSeverityStyle = (severity: TermSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          textColor: 'text-rose-700',
          dotColor: 'bg-rose-600',
          borderColor: 'border-rose-200/90',
          bgHover: 'hover:border-rose-300',
        };
      case 'high':
        return {
          textColor: 'text-amber-700',
          dotColor: 'bg-amber-500',
          borderColor: 'border-amber-200/90',
          bgHover: 'hover:border-amber-300',
        };
      case 'moderate':
        return {
          textColor: 'text-blue-700',
          dotColor: 'bg-blue-500',
          borderColor: 'border-blue-200/90',
          bgHover: 'hover:border-blue-300',
        };
      case 'positive':
        return {
          textColor: 'text-emerald-700',
          dotColor: 'bg-emerald-600',
          borderColor: 'border-emerald-200/90',
          bgHover: 'hover:border-emerald-300',
        };
      case 'neutral':
      default:
        return {
          textColor: 'text-slate-600',
          dotColor: 'bg-slate-400',
          borderColor: 'border-slate-200/90',
          bgHover: 'hover:border-slate-300',
        };
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10 text-left max-w-5xl mx-auto pb-14">
      {/* Top Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#F56B2B]" />
              <span>Credit & Legal Resources</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium leading-relaxed">
              Technical CIBIL report glossary, borrower rights under CICRA 2005, and RBI statutory dispute mechanisms.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium self-start sm:self-center">
            <span>14+ Technical Terms</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>12 Indian Languages</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="text-emerald-700 font-semibold">RBI Compliant</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION: CREDIT LITERACY & SEARCHABLE CIBIL GLOSSARY      */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F56B2B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F56B2B]">
                Credit Literacy Center
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#12233F] mt-1">
              Searchable CIBIL Report Technical Glossary
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Decode complex credit bureau symbols (DPD, Suit Filed, SMA, OTS) and learn their exact score implications and dispute remedies.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-slate-600 hover:text-[#12233F] px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-slate-600 hover:text-[#12233F] px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Quick CIBIL Code Reference Decoder Bar */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12233F]">
              <FileCode className="w-4 h-4 text-[#F56B2B]" />
              <span>Quick CIBIL Code Decoder (Click any code to filter)</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Common codes found in standard CIR reports
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {CIBIL_CODE_CHEAT_SHEET.map((item) => (
              <button
                key={item.code}
                onClick={() => setSearchQuery(item.code.split(' ')[0])}
                className="text-left p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-orange-300 hover:shadow-xs transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-[#12233F] group-hover:text-[#F56B2B]">
                    {item.code}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'positive'
                        ? 'bg-emerald-500'
                        : item.status === 'critical'
                        ? 'bg-rose-500'
                        : item.status === 'high'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-snug">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="space-y-3">
          {/* Real-time Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CIBIL terms (e.g., DPD, Suit Filed, SMA, Settled, NOC, Hard Enquiry, Restructured)..."
              className="w-full pl-10 pr-10 py-3 text-sm bg-white rounded-xl border border-slate-200/90 focus:border-[#F56B2B] focus:ring-2 focus:ring-[#F56B2B]/20 outline-none text-[#12233F] placeholder:text-slate-400 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Interactive Category Segmented Tabs (Zero-Pill compliant functional buttons) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              {CIBIL_GLOSSARY_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#12233F] shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`ml-1.5 text-[11px] font-normal ${
                        isActive ? 'text-[#F56B2B] font-bold' : 'text-slate-400'
                      }`}
                    >
                      ({categoryCounts[cat.id] ?? 0})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Severity Filter Dropdown or Counter */}
            <div className="flex items-center gap-3 text-xs text-slate-600 self-end sm:self-center">
              <span className="font-medium">
                Showing <strong className="text-[#12233F]">{filteredTerms.length}</strong> of{' '}
                {CIBIL_GLOSSARY_DATA.length} terms
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedSeverity !== 'all') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#F56B2B] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Glossary Terms Cards List */}
        {filteredTerms.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#12233F]">No matching terms found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any CIBIL report terms matching "{searchQuery}". Try searching for acronyms like DPD, OTS, SMA, or reset filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#12233F] hover:bg-[#1A3158] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Glossary Terms</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTerms.map((item) => {
              const isExpanded = expandedTermIds.has(item.id);
              const styling = getSeverityStyle(item.severity);
              const regionalName = item.regionalNames?.[currentLang];

              return (
                <article
                  key={item.id}
                  className={`bg-white rounded-2xl border ${styling.borderColor} ${styling.bgHover} shadow-xs transition-all overflow-hidden`}
                >
                  {/* Card Header & Summary Bar */}
                  <div
                    onClick={() => toggleTermExpansion(item.id)}
                    className="p-5 sm:p-6 cursor-pointer select-none"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleTermExpansion(item.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 text-left flex-1 min-w-0">
                        {/* Title & Acronym */}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-[#12233F] tracking-tight">
                            {item.term}
                          </h3>
                          {item.acronym && (
                            <span className="font-mono text-xs font-extrabold text-[#F56B2B] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                              {item.acronym}
                            </span>
                          )}
                        </div>

                        {/* Regional Translation when active language is not English */}
                        {regionalName && currentLang !== 'en' && (
                          <p className="text-xs sm:text-sm font-semibold text-[#12233F]/80">
                            {regionalName}
                          </p>
                        )}

                        {/* Unboxed Metadata with Typographic Separators (Zero-Pill Compliance) */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-0.5">
                          <span className="font-semibold text-slate-700">{item.categoryLabel}</span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className={`inline-flex items-center gap-1.5 font-medium ${styling.textColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${styling.dotColor}`} aria-hidden="true" />
                            {item.scoreImpactBadge}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="font-semibold text-slate-600">{item.scoreImpact}</span>
                        </div>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Collapse term details' : 'Expand term details'}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Concise Definition */}
                    <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                      {item.definition}
                    </p>
                  </div>

                  {/* Expanded Detailed Guidance */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-6 space-y-4 text-left">
                      {/* CIBIL Report Appearance Snippet */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <FileCode className="w-3.5 h-3.5 text-slate-500" />
                            <span>How it appears on your CIBIL CIR Report</span>
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySnippet(item.id, item.reportSnippet);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Copy snippet"
                          >
                            {copiedSnippetId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="bg-[#12233F] text-slate-100 rounded-xl p-3 font-mono text-xs border border-slate-700/60 overflow-x-auto shadow-inner leading-relaxed">
                          <div className="text-slate-400 text-[11px] mb-1 select-none">
                            // CIBIL BUREAU RECORD EXTRACT:
                          </div>
                          <div className="text-amber-300 font-bold select-all">
                            {item.reportCode}
                          </div>
                          <div className="text-slate-200 mt-1 select-all">
                            {item.reportSnippet}
                          </div>
                        </div>
                      </div>

                      {/* Borrower Implication & Loan Approval Impact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                            <AlertCircle className="w-4 h-4 text-[#F56B2B]" />
                            <span>Borrower Loan & Card Impact</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.borrowerImplication}
                          </p>
                        </div>

                        {/* Action & Dispute Strategy */}
                        <div className="bg-white rounded-xl p-4 border border-slate-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Actionable Fix & Dispute Strategy</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.actionStrategy}
                          </p>
                        </div>
                      </div>

                      {/* Myth vs Reality Card */}
                      <div className="bg-white rounded-xl p-4 border border-amber-200/80 bg-amber-50/20">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs leading-relaxed">
                            <div>
                              <strong className="text-rose-700 font-bold">Common Misconception: </strong>
                              <span className="text-slate-700 italic">"{item.commonMyth}"</span>
                            </div>
                            <div>
                              <strong className="text-emerald-700 font-bold">Legal Reality: </strong>
                              <span className="text-slate-700 font-medium">{item.mythReality}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* SECTION: STATUTORY DISPUTE MECHANISMS & OMBUDSMAN         */}
      {/* ========================================================= */}
      <section className="space-y-6 pt-6 border-t border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#F56B2B]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#F56B2B]">
              Statutory Protections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#12233F] mt-1">
            RBI Guidelines &amp; Consumer Dispute Rights
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Statutory redressal frameworks established under Indian law to protect borrowers against erroneous reporting and bank negligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Resource 1: RBI Integrated Ombudsman */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F56B2B] flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12233F]">
                RBI Integrated Ombudsman Scheme (2021)
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                If a bank or NBFC fails to resolve your credit report dispute, wrong overdue status, or unissued NOC within 30 calendar days, file an escalation directly with the Reserve Bank of India Complaint Management System (CMS).
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4">
              <a
                href="https://cms.rbi.org.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F56B2B] hover:underline"
              >
                <span>Visit Official RBI CMS Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Resource 2: CICRA Act 2005 Dispute Rights & RBI Compensation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0284C7] flex items-center justify-center mb-3">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12233F]">
                CICRA Act 2005 &amp; ₹100/Day Delay Fine
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Under Section 21 of the Credit Information Companies (Regulation) Act and RBI Circular RBI/2023-24/73, bureaus and lenders must rectify disputed data within 30 days. Lenders failing the 30-day SLA must pay ₹100/day compensation to the aggrieved borrower.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Statutory Turnaround:</span>
              <span className="font-bold text-[#0284C7]">30-Day Mandatory SLA</span>
            </div>
          </div>

          {/* Resource 3: DPDP Act 2023 Compliance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12233F]">
                Data Privacy &amp; Protection (DPDP 2023)
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Digital Katta operates with absolute client-side ephemeral isolation. Your raw financial data, PAN numbers, and credit account numbers are never retained on external servers or sold to telemarketers.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Architecture:</span>
              <span className="font-bold text-emerald-700">Zero Data Retention</span>
            </div>
          </div>

          {/* Resource 4: Dispute Notice Formats */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-200 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#9333EA] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#12233F]">
                Legal Notice Formats &amp; Templates
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Pre-formatted formal legal notice templates citing Section 21 of CICRA 2005 for incorrect accounts, wrongful settlements, identity theft, and unauthorized hard enquiries. Ready to export or print.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Format:</span>
              <span className="font-bold text-[#9333EA]">Ready-to-Print Legal Formats</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
