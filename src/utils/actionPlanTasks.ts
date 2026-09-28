import { ActionPlan } from '../types';

export const ACTION_PLAN_STORAGE_KEY = 'cibil_action_plan_306090_tasks';

export interface PlanTaskItem {
  id: string; // e.g. 'first7Days-0', 'days8To30-1', 'days31To60-0', 'days61To90-0'
  stageKey: 'first7Days' | 'days8To30' | 'days31To60' | 'days61To90';
  phaseGroup: 'phase1' | 'phase2' | 'phase3';
  phaseLabel: string;
  timeframeLabel: string;
  title: string;
  category: string;
  pointImpact: number;
}

export interface PhaseImpactSummary {
  phaseKey: 'phase1' | 'phase2' | 'phase3';
  phaseName: string;
  timeframe: string;
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  realizedPoints: number;
  isComplete: boolean;
}

export interface TrajectoryCalculationResult {
  baselineScore: number;
  realizedScore: number;
  totalRealizedPoints: number;
  totalAvailablePoints: number;
  completedCount: number;
  totalTaskCount: number;
  completionPercentage: number;
  phases: {
    phase1: PhaseImpactSummary;
    phase2: PhaseImpactSummary;
    phase3: PhaseImpactSummary;
  };
  trajectoryPoints: {
    day0: { score: number; realizedGain: number; baselineProjected: number };
    day30: { score: number; realizedGain: number; baselineProjected: number; target: number };
    day60: { score: number; realizedGain: number; baselineProjected: number; target: number };
    day90: { score: number; realizedGain: number; baselineProjected: number; target: number };
  };
}

/**
 * Extracts normalized PlanTaskItems with designated point values from ActionPlan
 */
export function getPlanTaskItems(actionPlan?: ActionPlan | null): PlanTaskItem[] {
  const items: PlanTaskItem[] = [];

  // Default fallback tasks if none provided in report analysis
  const defaultFirst7 = [
    'Obtain complete bureau CIR and audit personal identity and contact tags',
    'Flag duplicate account numbers and erroneous DPD delinquency remarks',
  ];

  const defaultDays8To30 = [
    'Dispatch formal Section 21 dispute notices to lender grievance desks',
    'Settle outstanding overdue balances on smallest negative facilities',
    'Enforce complete freeze on fresh loan and card hard enquiries',
  ];

  const defaultDays31To60 = [
    'Compress revolving credit card utilization strictly under 25%',
    'Acquire written No Dues Certificates (NOC) from settled financial institutions',
    'Establish automated 100% on-time NACH repayment mandates',
  ];

  const defaultDays61To90 = [
    'Pull refreshed bureau CIR to verify overdue markers are purged',
    'Confirm lender transmission of rectified Standard (STD) status',
    'Maintain seasoned clean trade lines to cross into 750+ prime credit tier',
  ];

  const first7 = actionPlan?.first7Days && actionPlan.first7Days.length > 0 ? actionPlan.first7Days : defaultFirst7;
  const days8To30 = actionPlan?.days8To30 && actionPlan.days8To30.length > 0 ? actionPlan.days8To30 : defaultDays8To30;
  const days31To60 = actionPlan?.days31To60 && actionPlan.days31To60.length > 0 ? actionPlan.days31To60 : defaultDays31To60;
  const days61To90 = actionPlan?.days61To90 && actionPlan.days61To90.length > 0 ? actionPlan.days61To90 : defaultDays61To90;

  // Helper to categorize task
  const categorize = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('dispute') || lower.includes('section 21') || lower.includes('error')) return 'Disputes & Inaccuracies';
    if (lower.includes('settle') || lower.includes('overdue') || lower.includes('dpd') || lower.includes('delinquent')) return 'Overdue Resolution';
    if (lower.includes('utilization') || lower.includes('card') || lower.includes('balance') || lower.includes('limit')) return 'Utilization Compression';
    if (lower.includes('mandate') || lower.includes('nach') || lower.includes('auto-debit') || lower.includes('payment')) return 'Repayment Mandates';
    if (lower.includes('noc') || lower.includes('certificate')) return 'Bank Reconciliation';
    if (lower.includes('enquir') || lower.includes('freeze') || lower.includes('hard')) return 'Enquiry Control';
    return 'Bureau Compliance';
  };

  // Phase 1 (Days 1 to 30) - Stage 1: first7Days
  first7.forEach((title, idx) => {
    items.push({
      id: `first7Days-${idx}`,
      stageKey: 'first7Days',
      phaseGroup: 'phase1',
      phaseLabel: 'Phase 1: Immediate Containment',
      timeframeLabel: 'Days 1–7',
      title,
      category: categorize(title),
      pointImpact: idx === 0 ? 6 : 8,
    });
  });

  // Phase 1 (Days 1 to 30) - Stage 2: days8To30
  days8To30.forEach((title, idx) => {
    items.push({
      id: `days8To30-${idx}`,
      stageKey: 'days8To30',
      phaseGroup: 'phase1',
      phaseLabel: 'Phase 1: Dispute & Delinquency',
      timeframeLabel: 'Days 8–30',
      title,
      category: categorize(title),
      pointImpact: idx === 0 ? 10 : idx === 1 ? 8 : 6,
    });
  });

  // Phase 2 (Days 31 to 60) - Stage 3: days31To60
  days31To60.forEach((title, idx) => {
    items.push({
      id: `days31To60-${idx}`,
      stageKey: 'days31To60',
      phaseGroup: 'phase2',
      phaseLabel: 'Phase 2: Utilization Compression',
      timeframeLabel: 'Days 31–60',
      title,
      category: categorize(title),
      pointImpact: idx === 0 ? 14 : idx === 1 ? 10 : 8,
    });
  });

  // Phase 3 (Days 61 to 90) - Stage 4: days61To90
  days61To90.forEach((title, idx) => {
    items.push({
      id: `days61To90-${idx}`,
      stageKey: 'days61To90',
      phaseGroup: 'phase3',
      phaseLabel: 'Phase 3: Bureau Synchronization',
      timeframeLabel: 'Days 61–90',
      title,
      category: categorize(title),
      pointImpact: idx === 0 ? 10 : idx === 1 ? 10 : 8,
    });
  });

  return items;
}

/**
 * Loads completed task IDs from localStorage safely
 */
export function getStoredCompletedTasks(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(ACTION_PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Persists completed tasks to localStorage and dispatches sync event
 */
export function saveStoredCompletedTasks(tasks: Record<string, boolean>): void {
  try {
    localStorage.setItem(ACTION_PLAN_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event('cibil_milestone_event'));
  } catch (err) {
    console.warn('Action plan sync warning:', err);
  }
}

/**
 * Computes real-time dynamic score trajectory based on completed tasks
 */
export function calculateDynamicTrajectory(
  currentScore: number,
  taskItems: PlanTaskItem[],
  completedMap: Record<string, boolean>,
  severityMultiplier: number = 1.0,
  targetScore: number = 750
): TrajectoryCalculationResult {
  const phase1Tasks = taskItems.filter((t) => t.phaseGroup === 'phase1');
  const phase2Tasks = taskItems.filter((t) => t.phaseGroup === 'phase2');
  const phase3Tasks = taskItems.filter((t) => t.phaseGroup === 'phase3');

  const p1TotalPoints = phase1Tasks.reduce((sum, t) => sum + t.pointImpact, 0);
  const p2TotalPoints = phase2Tasks.reduce((sum, t) => sum + t.pointImpact, 0);
  const p3TotalPoints = phase3Tasks.reduce((sum, t) => sum + t.pointImpact, 0);

  const p1CompletedTasks = phase1Tasks.filter((t) => completedMap[t.id]);
  const p2CompletedTasks = phase2Tasks.filter((t) => completedMap[t.id]);
  const p3CompletedTasks = phase3Tasks.filter((t) => completedMap[t.id]);

  const p1RealizedPoints = p1CompletedTasks.reduce((sum, t) => sum + t.pointImpact, 0);
  const p2RealizedPoints = p2CompletedTasks.reduce((sum, t) => sum + t.pointImpact, 0);
  const p3RealizedPoints = p3CompletedTasks.reduce((sum, t) => sum + t.pointImpact, 0);

  const totalRealizedPoints = p1RealizedPoints + p2RealizedPoints + p3RealizedPoints;
  const totalAvailablePoints = p1TotalPoints + p2TotalPoints + p3TotalPoints;
  const totalTaskCount = taskItems.length;
  const completedCount = Object.keys(completedMap).filter((k) => completedMap[k]).length;
  const completionPercentage = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  // Realized baseline (score directly unlocked right now by completed items)
  const realizedScore = Math.min(850, currentScore + totalRealizedPoints);

  // Baseline projected trajectory if no extra tasks are completed ahead of schedule
  const baseP1Gain = Math.round(26 * severityMultiplier);
  const baseP2Gain = Math.round(30 * severityMultiplier);
  const baseP3Gain = Math.round(28 * severityMultiplier);

  // Dynamic Trajectory:
  // Each phase's score incorporates:
  // 1. All realized points from previous and current phase tasks
  // 2. Projected points for remaining pending tasks in that phase
  // 3. Acceleration bonus when a phase is 100% finished
  const p1Bonus = p1CompletedTasks.length === phase1Tasks.length ? 5 : 0;
  const p2Bonus = p2CompletedTasks.length === phase2Tasks.length ? 6 : 0;
  const p3Bonus = p3CompletedTasks.length === phase3Tasks.length ? 8 : 0;

  // Day 30 calculation
  const p1Remaining = p1TotalPoints - p1RealizedPoints;
  const day30Score = Math.min(
    880,
    currentScore +
      p1RealizedPoints +
      Math.round(p1Remaining * 0.75) +
      p1Bonus
  );

  // Day 60 calculation
  const p2Remaining = p2TotalPoints - p2RealizedPoints;
  const day60Score = Math.min(
    890,
    day30Score +
      p2RealizedPoints +
      Math.round(p2Remaining * 0.75) +
      p2Bonus
  );

  // Day 90 calculation
  const p3Remaining = p3TotalPoints - p3RealizedPoints;
  const day90Score = Math.min(
    900,
    day60Score +
      p3RealizedPoints +
      Math.round(p3Remaining * 0.8) +
      p3Bonus
  );

  return {
    baselineScore: currentScore,
    realizedScore,
    totalRealizedPoints,
    totalAvailablePoints,
    completedCount,
    totalTaskCount,
    completionPercentage,
    phases: {
      phase1: {
        phaseKey: 'phase1',
        phaseName: 'Phase 1: Dispute & Delinquency',
        timeframe: 'Days 1–30',
        totalTasks: phase1Tasks.length,
        completedTasks: p1CompletedTasks.length,
        totalPoints: p1TotalPoints,
        realizedPoints: p1RealizedPoints,
        isComplete: phase1Tasks.length > 0 && p1CompletedTasks.length === phase1Tasks.length,
      },
      phase2: {
        phaseKey: 'phase2',
        phaseName: 'Phase 2: Utilization Compression',
        timeframe: 'Days 31–60',
        totalTasks: phase2Tasks.length,
        completedTasks: p2CompletedTasks.length,
        totalPoints: p2TotalPoints,
        realizedPoints: p2RealizedPoints,
        isComplete: phase2Tasks.length > 0 && p2CompletedTasks.length === phase2Tasks.length,
      },
      phase3: {
        phaseKey: 'phase3',
        phaseName: 'Phase 3: Bureau Synchronization',
        timeframe: 'Days 61–90',
        totalTasks: phase3Tasks.length,
        completedTasks: p3CompletedTasks.length,
        totalPoints: p3TotalPoints,
        realizedPoints: p3RealizedPoints,
        isComplete: phase3Tasks.length > 0 && p3CompletedTasks.length === phase3Tasks.length,
      },
    },
    trajectoryPoints: {
      day0: {
        score: currentScore,
        realizedGain: 0,
        baselineProjected: currentScore,
      },
      day30: {
        score: day30Score,
        realizedGain: day30Score - currentScore,
        baselineProjected: currentScore + baseP1Gain,
        target: targetScore,
      },
      day60: {
        score: day60Score,
        realizedGain: day60Score - currentScore,
        baselineProjected: currentScore + baseP1Gain + baseP2Gain,
        target: targetScore,
      },
      day90: {
        score: day90Score,
        realizedGain: day90Score - currentScore,
        baselineProjected: currentScore + baseP1Gain + baseP2Gain + baseP3Gain,
        target: targetScore,
      },
    },
  };
}
