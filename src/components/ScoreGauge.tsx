import React from 'react';
import { CreditCategory, RiskLevel } from '../types';

interface ScoreGaugeProps {
  score: number;
  category: CreditCategory;
  riskLevel: RiskLevel;
  minScore?: number;
  maxScore?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  category,
  riskLevel,
  minScore = 300,
  maxScore = 900,
}) => {
  // Clamp score between 300 and 900
  const clampedScore = Math.max(minScore, Math.min(maxScore, score));
  const percentage = (clampedScore - minScore) / (maxScore - minScore);

  // SVG Gauge calculations
  // Semi-circle arc from 180 deg to 360 deg
  const radius = 80;
  const strokeWidth = 14;
  const cx = 100;
  const cy = 95;
  const circumference = Math.PI * radius; // Half-circle circumference ~ 251.3
  const strokeDashoffset = circumference - circumference * percentage;

  // Color selection based on category
  const getColor = () => {
    if (clampedScore >= 750) return { stroke: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' };
    if (clampedScore >= 700) return { stroke: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' };
    if (clampedScore >= 650) return { stroke: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' };
    return { stroke: '#ef4444', badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' };
  };

  const colors = getColor();

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="relative w-56 h-32 flex items-end justify-center overflow-hidden">
        <svg viewBox="0 0 200 115" className="w-full h-full">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Value Arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Number */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-heading leading-none">
            {clampedScore}
          </span>
          <span className="text-xs font-semibold text-slate-500 mt-0.5">
            CIBIL Score
          </span>
        </div>
      </div>

      {/* Scale indicators */}
      <div className="w-56 flex justify-between text-[11px] font-medium text-slate-400 px-2 mt-1">
        <span>300</span>
        <span>650</span>
        <span>750</span>
        <span>900</span>
      </div>

      {/* Category and Risk Badges */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${colors.badge}`}>
          {category}
        </span>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          Risk: <strong className="text-slate-700">{riskLevel}</strong>
        </span>
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-2 max-w-xs leading-relaxed">
        Score ranges are informational and individual lender underwriting criteria may vary.
      </p>
    </div>
  );
};
