import React, { useState } from 'react';
import {
  History,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Building2,
} from 'lucide-react';
import { CreditAccount, PaymentBehaviourAnalysis, PaymentRecord } from '../types';

interface PaymentHistoryHeatmapProps {
  accounts: CreditAccount[];
  paymentBehaviour: PaymentBehaviourAnalysis;
}

export const PaymentHistoryHeatmap: React.FC<PaymentHistoryHeatmapProps> = ({
  accounts,
  paymentBehaviour,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    accountName: string;
    accountNumberMasked: string;
    record: PaymentRecord;
  } | null>(null);

  // Helper for cell color styling
  const getCellColor = (record?: PaymentRecord) => {
    if (!record) return 'bg-slate-100 text-slate-300 border-slate-200';
    const d = typeof record.dpd === 'number' ? record.dpd : parseInt(record.dpd, 10) || 0;

    if (record.status === 'WRITTEN_OFF' || d >= 90 || record.status === 'LATE_90_PLUS') {
      return 'bg-rose-500 text-white font-bold border-rose-600 shadow-2xs';
    }
    if (d >= 60 || record.status === 'LATE_60') {
      return 'bg-amber-500 text-white font-bold border-amber-600';
    }
    if (d >= 30 || record.status === 'LATE_30') {
      return 'bg-yellow-400 text-slate-900 font-bold border-yellow-500';
    }
    if (d > 0) {
      return 'bg-yellow-200 text-yellow-900 font-semibold border-yellow-300';
    }
    return 'bg-emerald-100 text-emerald-800 font-medium border-emerald-200 hover:bg-emerald-200';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">
              Payment History & DPD Heatmap
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Month-by-month Days Past Due (DPD) record reported by financial institutions to TransUnion CIBIL
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400 border border-emerald-500"></span>
            <span className="text-slate-600">000 (On-Time)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-400 border border-yellow-500"></span>
            <span className="text-slate-600">1–30 DPD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 border border-amber-600"></span>
            <span className="text-slate-600">60+ DPD</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600"></span>
            <span className="text-slate-600">90+ / Written-Off</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Late Instances</span>
          <div className={`text-2xl font-extrabold font-heading mt-1 ${paymentBehaviour.latePaymentsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {paymentBehaviour.latePaymentsCount}
          </div>
          <span className="text-[11px] text-slate-400">Across all recorded months</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">30+ DPD Occurrences</span>
          <div className="text-2xl font-extrabold text-amber-600 font-heading mt-1">
            {paymentBehaviour.dpd30Plus}
          </div>
          <span className="text-[11px] text-slate-400">Minor / Moderate delay</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">60+ DPD Occurrences</span>
          <div className="text-2xl font-extrabold text-orange-600 font-heading mt-1">
            {paymentBehaviour.dpd60Plus}
          </div>
          <span className="text-[11px] text-slate-400">SMA-1 / High delinquency</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">90+ DPD / NPA</span>
          <div className={`text-2xl font-extrabold font-heading mt-1 ${paymentBehaviour.dpd90Plus > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {paymentBehaviour.dpd90Plus}
          </div>
          <span className="text-[11px] text-slate-400">Severe credit damage</span>
        </div>
      </div>

      {/* AI Behavioral Diagnostic Note */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Payment Behaviour Diagnosis:</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          {paymentBehaviour.explanation}
        </p>
        <div className="pt-2 text-slate-800 font-medium">
          <strong>Key Recommendation:</strong> {paymentBehaviour.recommendation}
        </div>
      </div>

      {/* Interactive Account-by-Account Payment Timeline Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 font-heading">
            Monthly Trade Line Records (Recent 12-24 Months)
          </h3>
          <span className="text-xs text-slate-400">Click any block to inspect details</span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {accounts.map(acc => (
            <div key={acc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50">
              {/* Account details */}
              <div className="w-64 shrink-0">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{acc.lender}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {acc.accountType} • <span className="font-mono">{acc.accountNumberMasked}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Status: <span className="font-semibold text-slate-700">{acc.rawStatus}</span>
                  {acc.maxDPD > 0 && ` • Max DPD: ${acc.maxDPD}`}
                </div>
              </div>

              {/* Month Blocks */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1">
                {acc.paymentHistory.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No historical monthly records reported</span>
                ) : (
                  acc.paymentHistory.map((rec, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSelectedCell({
                          accountName: acc.lender,
                          accountNumberMasked: acc.accountNumberMasked,
                          record: rec,
                        })
                      }
                      title={`${acc.lender} - ${rec.monthYear}: DPD ${rec.dpd} (${rec.status})`}
                      className={`h-8 min-w-[42px] px-1 rounded-md border text-[11px] flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer ${getCellColor(
                        rec
                      )}`}
                    >
                      <span className="leading-none text-[9px] opacity-80">{rec.monthYear.split('/')[0]}</span>
                      <span className="leading-none text-[10px] font-bold mt-0.5">{rec.dpd}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Cell Inspector Modal / Popover */}
      {selectedCell && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="font-bold block text-sm">
              Monthly Record Detail: {selectedCell.record.monthYear}
            </span>
            <p className="text-xs text-blue-800 mt-0.5">
              Institution: <strong>{selectedCell.accountName}</strong> ({selectedCell.accountNumberMasked}) •
              Reported DPD: <strong>{selectedCell.record.dpd}</strong> •
              Classification Status: <strong>{selectedCell.record.status}</strong>
            </p>
          </div>
          <button
            onClick={() => setSelectedCell(null)}
            className="px-3 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-semibold hover:bg-blue-100 transition-colors cursor-pointer text-xs"
          >
            Close Detail
          </button>
        </div>
      )}
    </div>
  );
};
