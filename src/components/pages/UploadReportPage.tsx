import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { NormalizedCreditReport } from '../../types';
import { parseCreditReportFile } from '../../utils/reportParser';
import { LineArtBuildings } from '../LineArtBuildings';
import { useAppLanguage } from '../../hooks/useAppLanguage';

interface UploadReportPageProps {
  onReportLoaded: (report: NormalizedCreditReport) => void;
  onSelectDemo: (demoId: 'stressed' | 'good') => void;
  currentReport: NormalizedCreditReport | null;
}

export const UploadReportPage: React.FC<UploadReportPageProps> = ({
  onReportLoaded,
  onSelectDemo,
  currentReport,
}) => {
  const { t } = useAppLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size exceeds the 10 MB limit.');
      }

      const parsed = await parseCreditReportFile(file);
      setSuccessMessage(`Successfully processed "${file.name}"!`);
      setTimeout(() => {
        onReportLoaded(parsed);
      }, 600);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(
        err.message || 'Failed to parse credit report. Ensure it is a valid CIBIL PDF, HTML, or JSON file.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-left max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="border-b border-[#E8ECF0] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12233F] font-heading tracking-tight">
          {t('upload.title', 'Upload Your CIBIL Report')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium max-w-2xl">
          {t('upload.subtitle', "Upload your CIBIL report in PDF, HTML or JSON format. We'll analyze it and provide detailed insights with a personalized resolution plan.")}
        </p>
      </div>

      {/* Currently loaded report banner if one exists */}
      {currentReport && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">{t('upload.activeReport', 'Active Report')}: {currentReport.personal.name}</p>
              <p className="text-slate-600">Score: {currentReport.score.cibilScore} • {currentReport.accounts.length} Accounts Identified</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-200/80 font-bold text-emerald-800">
            {t('common.active', 'Active')}
          </span>
        </div>
      )}

      {/* 2. Large Dashed-Border Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative bg-white rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed transition-all shadow-xs ${
          isDragging
            ? 'border-[#FF6A00] bg-orange-50/50 scale-[1.01]'
            : 'border-[#E8ECF0] hover:border-orange-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.html,.htm,.json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Cloud Upload Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-50 text-[#FF6A00] flex items-center justify-center mx-auto mb-4 shadow-xs border border-orange-100">
          {isLoading ? (
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-[#FF6A00]" />
          ) : (
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          )}
        </div>

        {/* Text Instructions */}
        <h2 className="text-base sm:text-lg font-bold text-[#12233F]">
          {t('upload.dropzoneText', 'Drag & drop your file here')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-semibold my-2">
          or
        </p>

        {/* Primary Orange "Choose File" Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 rounded-xl bg-[#FF6A00] hover:bg-[#E65F00] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer inline-flex items-center gap-2 transform active:scale-98 disabled:opacity-50"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{isLoading ? 'Parsing Report...' : 'Choose File'}</span>
        </button>

        {/* Supported Format & Size Caption */}
        <p className="text-xs text-slate-400 font-medium mt-4">
          Supported formats: PDF, HTML, JSON &nbsp;|&nbsp; Maximum file size: 10 MB
        </p>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center justify-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center justify-center gap-2 max-w-md mx-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Quick Demo Loader Buttons (For instant testing without finding a PDF) */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8ECF0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#12233F]">{t('upload.orTryDemo', "Don't have a report on hand?")}</p>
          <p className="text-xs text-slate-500">Test the analysis engine with pre-verified mock reports:</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onSelectDemo('stressed')}
            className="px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6A00] border border-orange-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {t('upload.stressedDemoBtn', 'Stressed Profile (642 Score)')}
          </button>
          <button
            type="button"
            onClick={() => onSelectDemo('good')}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#16A34A] border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
          >
            {t('upload.goodDemoBtn', 'Prime Profile (785 Score)')}
          </button>
        </div>
      </div>

      {/* 3. Blue-Tinted Privacy Banner with Shield Icon */}
      <div className="bg-[#EBF3FF] border border-[#BFDBFE] rounded-2xl p-5 flex items-start gap-3.5 text-[#1D4ED8] shadow-xs">
        <div className="w-9 h-9 rounded-full bg-white text-[#0284C7] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-[#1E40AF]">
            Your data is 100% secure
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
            We respect your privacy. Your CIBIL report is processed client-side with zero data retention in strict compliance with the Indian Digital Personal Data Protection (DPDP) Act 2023. Your report is used solely for your analysis and is not stored or shared with any third party.
          </p>
        </div>
      </div>

      {/* 4. Footer Branding Block (Bottom Right) */}
      <div className="flex justify-end pt-4">
        <div className="text-right space-y-1">
          <LineArtBuildings showText={false} className="items-end" />
          <p className="text-xs font-bold text-[#12233F]">
            Your Financial Growth Partner
          </p>
          <p className="text-[10px] font-semibold text-slate-500">
            CIBIL Report Analysis & Resolution Platform
          </p>
        </div>
      </div>
    </div>
  );
};
