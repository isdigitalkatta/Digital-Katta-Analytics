import React, { useId } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { ScoreOutlookPoint, OutlookScenarioType } from '../types';
import { TrendingUp, Target, Calendar, CheckCircle2, Award, Zap } from 'lucide-react';

export interface ScoreOutlookLineChartProps {
  data: ScoreOutlookPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  currentScore?: number;
  targetScore?: number;
  scenario?: OutlookScenarioType;
  onScenarioChange?: (scenario: OutlookScenarioType) => void;
  showCibilBands?: boolean;
  showConfidenceBand?: boolean;
  showMilestones?: boolean;
  isPrintMode?: boolean;
  className?: string;
}

// Brand color palette
const COLOR_HISTORICAL = '#12233F'; // Deep Navy
const COLOR_REALISTIC = '#F56B2B';  // Digital Katta Brand Orange
const COLOR_OPTIMISTIC = '#16A34A'; // Emerald Green
const COLOR_CONSERVATIVE = '#2563EB'; // Blue / Slate
const COLOR_TARGET = '#15803D';     // Dark Emerald

export const ScoreOutlookLineChart: React.FC<ScoreOutlookLineChartProps> = ({
  data,
  title = 'CIBIL Score Trajectory & Future Outlook',
  subtitle = 'Actual bureau credit track combined with projected recovery simulations',
  height = 360,
  currentScore = 642,
  targetScore = 750,
  scenario = 'all',
  onScenarioChange,
  showCibilBands = true,
  showConfidenceBand = true,
  showMilestones = true,
  isPrintMode = false,
  className = '',
}) => {
  const gradientId = useId();

  // Determine domain range
  const allScores = data.flatMap((d) => [
    d.score,
    d.projectedScore,
    d.optimisticScore,
    d.conservativeScore,
    d.targetScore,
    d.lowerBound,
    d.upperBound,
  ]).filter((v): v is number => typeof v === 'number');

  const minScore = Math.max(300, Math.min(...allScores, 580) - 30);
  const maxScore = Math.min(900, Math.max(...allScores, 800) + 20);

  // Custom Dot for historical and milestones
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    if (!cx || !cy) return null;

    // Highlight Current Score dot
    if (payload.period === 'Current') {
      return (
        <g key={`dot-curr-${payload.period}`}>
          <circle cx={cx} cy={cy} r={7} fill="#FFF2E8" stroke={COLOR_REALISTIC} strokeWidth={3} />
          <circle cx={cx} cy={cy} r={3.5} fill={COLOR_REALISTIC} />
        </g>
      );
    }

    // Highlight Key Milestones on projected line
    if (showMilestones && payload.isProjection && payload.milestone && dataKey === 'projectedScore') {
      return (
        <g key={`dot-mile-${payload.period}`}>
          <circle cx={cx} cy={cy} r={5} fill="#FFFFFF" stroke={COLOR_REALISTIC} strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={2} fill={COLOR_REALISTIC} />
        </g>
      );
    }

    // Standard historical dot
    if (!payload.isProjection && dataKey === 'score') {
      return (
        <circle
          key={`dot-hist-${payload.period}`}
          cx={cx}
          cy={cy}
          r={4}
          fill="#FFFFFF"
          stroke={COLOR_HISTORICAL}
          strokeWidth={2}
        />
      );
    }

    return null;
  };

  // Custom Interactive Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const pointData = payload[0]?.payload as ScoreOutlookPoint | undefined;
    const isProj = pointData?.isProjection;
    const milestone = pointData?.milestone;

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-xl text-left max-w-xs z-50">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-xs text-[#12233F]">{label}</span>
          </div>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              isProj
                ? 'bg-orange-50 text-[#F56B2B] border-orange-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            {isProj ? 'Projected Future' : 'Historical Record'}
          </span>
        </div>

        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'lowerBound' || entry.dataKey === 'upperBound') return null;
            if (entry.value === null || entry.value === undefined) return null;

            return (
              <div key={`item-${index}`} className="flex items-center justify-between text-xs gap-3">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-extrabold text-[#12233F] tabular-nums">
                  {entry.value} Pts
                </span>
              </div>
            );
          })}
        </div>

        {milestone && (
          <div className="mt-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
              <Zap className="w-3.5 h-3.5 text-[#F56B2B] shrink-0 mt-0.5" />
              <span>
                <strong className="font-bold text-[#12233F]">Key Action:</strong> {milestone}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs print:border-slate-300 print:shadow-none print:p-4 print:rounded-none ${className}`}
    >
      {/* Chart Header & Scenario Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 print:pb-2 print:border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FFF2E8] text-[#F56B2B] flex items-center justify-center font-bold shrink-0 print:hidden">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#12233F] font-heading print:text-black">
              {title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium print:text-slate-600">
            {subtitle}
          </p>
        </div>

        {/* Interactive Scenario Filter Buttons (Hidden in print mode) */}
        {onScenarioChange && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 print:hidden">
            <button
              type="button"
              onClick={() => onScenarioChange('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenario === 'all'
                  ? 'bg-white text-[#12233F] shadow-xs'
                  : 'text-slate-600 hover:text-[#12233F]'
              }`}
            >
              All Scenarios
            </button>
            <button
              type="button"
              onClick={() => onScenarioChange('realistic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenario === 'realistic'
                  ? 'bg-[#F56B2B] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12233F]'
              }`}
            >
              Realistic Plan
            </button>
            <button
              type="button"
              onClick={() => onScenarioChange('optimistic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenario === 'optimistic'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12233F]'
              }`}
            >
              Fast-Track
            </button>
            <button
              type="button"
              onClick={() => onScenarioChange('conservative')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenario === 'conservative'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#12233F]'
              }`}
            >
              Conservative
            </button>
          </div>
        )}
      </div>

      {/* Legend & Tier Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 text-xs">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span
              className="w-3 h-1 rounded-full inline-block"
              style={{ backgroundColor: COLOR_HISTORICAL }}
            />
            <span>Historical CIBIL Score</span>
          </div>

          {(scenario === 'all' || scenario === 'realistic') && (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span
                className="w-3 h-1 rounded-full inline-block"
                style={{ backgroundColor: COLOR_REALISTIC }}
              />
              <span className="font-bold text-[#F56B2B]">Realistic Trajectory</span>
            </div>
          )}

          {(scenario === 'all' || scenario === 'optimistic') && (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dashed"
                style={{ borderColor: COLOR_OPTIMISTIC }}
              />
              <span className="text-emerald-700 font-bold">Fast-Track Optimistic</span>
            </div>
          )}

          {(scenario === 'all' || scenario === 'conservative') && (
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <span
                className="w-3 h-0.5 inline-block border-t-2 border-dotted"
                style={{ borderColor: COLOR_CONSERVATIVE }}
              />
              <span className="text-blue-700">Conservative Plan</span>
            </div>
          )}
        </div>

        {/* Goal Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] print:border-emerald-300">
          <Target className="w-3.5 h-3.5 text-emerald-600" />
          <span>Target Goal: {targetScore}+ Benchmark</span>
        </div>
      </div>

      {/* Recharts Chart Canvas */}
      <div
        className="w-full relative select-none pt-2 print:min-w-[620px] print:h-[280px]"
        style={{ height: height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id={`confidenceGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLOR_REALISTIC} stopOpacity={0.18} />
                <stop offset="95%" stopColor={COLOR_REALISTIC} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* CIBIL Score Rating Bands (Reference Threshold Lines) */}
            {showCibilBands && (
              <>
                <ReferenceLine
                  y={750}
                  stroke="#16A34A"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '750+ (Excellent)',
                    position: 'insideBottomRight',
                    fill: '#16A34A',
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={700}
                  stroke="#2563EB"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: '700+ (Good)',
                    position: 'insideBottomRight',
                    fill: '#2563EB',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={650}
                  stroke="#D97706"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: '650+ (Fair)',
                    position: 'insideBottomRight',
                    fill: '#D97706',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                />
              </>
            )}

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E2E8F0"
              vertical={false}
              opacity={0.8}
            />

            <XAxis
              dataKey="period"
              stroke="#64748B"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              dy={6}
            />

            <YAxis
              domain={[minScore, maxScore]}
              stroke="#64748B"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1' }}
              tickCount={6}
              dx={-4}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Target Score 750 Benchmark Reference Line */}
            <ReferenceLine
              y={targetScore}
              stroke={COLOR_TARGET}
              strokeDasharray="4 4"
              strokeWidth={1.8}
              label={{
                value: `Target Goal: ${targetScore}`,
                position: 'insideTopRight',
                fill: COLOR_TARGET,
                fontSize: 10,
                fontWeight: 700,
                dy: -10,
              }}
            />

            {/* Vertical Marker separating Historical from Projected Future */}
            <ReferenceLine
              x="Current"
              stroke="#F56B2B"
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: 'AUDIT TODAY',
                position: 'insideTopLeft',
                fill: '#F56B2B',
                fontSize: 9,
                fontWeight: 800,
                dy: 10,
              }}
            />

            {/* Confidence Interval Band (Upper to Lower) */}
            {showConfidenceBand && (scenario === 'all' || scenario === 'realistic') && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill={`url(#confidenceGradient-${gradientId})`}
                name="Confidence Band"
                legendType="none"
                tooltipType="none"
              />
            )}

            {/* 1. Historical Actual Score Line */}
            <Line
              type="monotone"
              dataKey="score"
              name="Historical Score"
              stroke={COLOR_HISTORICAL}
              strokeWidth={3}
              dot={renderCustomDot}
              activeDot={{ r: 6, fill: COLOR_HISTORICAL, stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls={false}
            />

            {/* 2. Realistic Projected Trajectory Line */}
            {(scenario === 'all' || scenario === 'realistic') && (
              <Line
                type="monotone"
                dataKey="projectedScore"
                name="Realistic Plan"
                stroke={COLOR_REALISTIC}
                strokeWidth={3.5}
                strokeDasharray="5 5"
                dot={renderCustomDot}
                activeDot={{ r: 7, fill: COLOR_REALISTIC, stroke: '#FFFFFF', strokeWidth: 2.5 }}
                connectNulls={true}
              />
            )}

            {/* 3. Optimistic Fast-Track Trajectory Line */}
            {(scenario === 'all' || scenario === 'optimistic') && (
              <Line
                type="monotone"
                dataKey="optimisticScore"
                name="Fast-Track Optimistic"
                stroke={COLOR_OPTIMISTIC}
                strokeWidth={2.2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 5, fill: COLOR_OPTIMISTIC, stroke: '#FFFFFF', strokeWidth: 2 }}
                connectNulls={true}
              />
            )}

            {/* 4. Conservative Trajectory Line */}
            {(scenario === 'all' || scenario === 'conservative') && (
              <Line
                type="monotone"
                dataKey="conservativeScore"
                name="Conservative Plan"
                stroke={COLOR_CONSERVATIVE}
                strokeWidth={2}
                strokeDasharray="2 2"
                dot={false}
                activeDot={{ r: 5, fill: COLOR_CONSERVATIVE, stroke: '#FFFFFF', strokeWidth: 2 }}
                connectNulls={true}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Printable High-Contrast Milestones Table (Renders cleanly in print or preview) */}
      <div className="mt-6 pt-4 border-t border-slate-100 print:border-slate-300 print:mt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 print:text-black">
          Detailed Milestone Breakdown &amp; Statutory Trajectory
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50/70 print:bg-slate-100 print:text-black font-bold">
                <th className="py-2 px-3">Timeline</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Projected CIBIL</th>
                <th className="py-2 px-3">Impact</th>
                <th className="py-2 px-3">Statutory Milestone / Remediation Action</th>
                <th className="py-2 px-3">Bureau Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {data.map((pt, idx) => {
                const isCurrent = pt.period === 'Current';
                const scoreVal = pt.isProjection ? pt.projectedScore : pt.score;
                const scoreNum = scoreVal ?? currentScore;

                let tierLabel = 'Needs Improvement';
                let tierColor = 'text-rose-700 bg-rose-50 border-rose-200';
                if (scoreNum >= 750) {
                  tierLabel = 'Excellent';
                  tierColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                } else if (scoreNum >= 700) {
                  tierLabel = 'Good';
                  tierColor = 'text-blue-700 bg-blue-50 border-blue-200';
                } else if (scoreNum >= 650) {
                  tierLabel = 'Fair';
                  tierColor = 'text-amber-700 bg-amber-50 border-amber-200';
                }

                return (
                  <tr
                    key={`tbl-${idx}`}
                    className={`${
                      isCurrent
                        ? 'bg-[#FFF8F0] font-bold text-[#12233F] print:bg-orange-50'
                        : 'hover:bg-slate-50/60 text-slate-700'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">
                      {pt.period}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {pt.isProjection ? (
                        <span className="text-orange-700 font-bold text-[10px] uppercase">
                          Projection
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px] uppercase">
                          Historical
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-extrabold text-sm tabular-nums text-[#12233F] print:text-black">
                      {scoreVal ?? '-'}
                    </td>
                    <td className="py-2 px-3 font-bold tabular-nums whitespace-nowrap">
                      {pt.isProjection && pt.impactPoints ? (
                        <span className="text-emerald-700 font-bold">
                          +{pt.impactPoints} Pts
                        </span>
                      ) : isCurrent ? (
                        <span className="text-slate-500">Baseline</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[11px] leading-snug">
                      {pt.milestone || 'Standard scheduled repayment cycle'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${tierColor}`}
                      >
                        {tierLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
