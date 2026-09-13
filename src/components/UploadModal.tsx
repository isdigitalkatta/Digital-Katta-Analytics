import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  FileCode,
  FileType,
} from 'lucide-react';
import { parseCreditReportFile } from '../utils/reportParser';
import { NormalizedCreditReport } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportLoaded: (report: NormalizedCreditReport) => void;
  onSelectDemo: (demoId: 'stressed' | 'good') => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onReportLoaded,
  onSelectDemo,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'html', 'htm', 'json'].includes(ext || '')) {
      setErrorMessage(
        'Unsupported format. Please upload your CIBIL credit report in .PDF, .HTML, or .JSON format.'
      );
      setSelectedFile(null);
      return;
    }

    // Size limit check (e.g. 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File exceeds the 25MB size limit. Please upload a smaller report file.');
      setSelectedFile(null);
      return;
    }

    try {
      setIsLoading(true);
      const parsedReport = await parseCreditReportFile(file, (stage, pct) => {
        setProgressStage(stage);
        setProgressPercent(pct);
      });

      // Notify parent
      onReportLoaded(parsedReport);
      onClose();
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(err?.message || 'Failed to parse credit report. Please verify the file integrity.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Upload Credit Report
            </h3>
            <p className="text-xs text-slate-500">
              Supports official CIBIL, Experian, Equifax, or CRIF reports
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Privacy note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-800">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Zero-Retention Guarantee:</strong> Your report is parsed transiently in your browser session. Account numbers & PAN details are automatically masked.
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
            } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.html,.htm,.json"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">{progressStage || 'Processing...'}</p>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{progressPercent}% complete</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800">
                  Click to browse or drag and drop your report
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, HTML, JSON (max 25MB)
                </p>
                <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <FileType className="w-3.5 h-3.5" /> PDF
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <FileCode className="w-3.5 h-3.5" /> HTML
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-600">
                    <FileText className="w-3.5 h-3.5" /> JSON
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block mb-0.5">Upload Failed</span>
                {errorMessage}
                {errorMessage.includes('password') && (
                  <p className="mt-1 text-[11px] text-rose-700 font-medium">
                    Tip: Open your CIBIL PDF in Chrome/Adobe, print to a new unlocked PDF, and re-upload.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Demo Options */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Or explore immediately with realistic demo profiles:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectDemo('stressed');
                  onClose();
                }}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-rose-800">Arun Kumar (Score: 618)</div>
                <div className="text-[11px] text-slate-500">Stressed profile with Write-off & Overdue</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectDemo('good');
                  onClose();
                }}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald-800">Priya Sharma (Score: 742)</div>
                <div className="text-[11px] text-slate-500">Good profile with Active Home Loan</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
