import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Flame,
  Award,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Check,
  Calendar,
  Zap,
  Info,
  ExternalLink,
  ChevronRight,
  Star,
  Layers,
} from 'lucide-react';
import { NormalizedCreditReport, AIAnalysisResult, MilestoneReward } from '../types';

interface MilestoneRewardsProps {
  report: NormalizedCreditReport | null;
  analysis: AIAnalysisResult | null;
  onNavigate?: (tab: string) => void;
  className?: string;
  compact?: boolean;
}

// Storage keys
const STREAK_DAYS_KEY = 'cibil_milestone_streak_days';
const LAST_CHECKIN_KEY = 'cibil_milestone_last_checkin';
const DISPUTES_FILED_KEY = 'cibil_first_dispute_filed';
const SCORE_IMPROVED_KEY = 'cibil_milestone_score_improved';
const ACTION_PLAN_STORAGE_KEY = 'cibil_action_plan_strategic_steps';
const ACTION_PLAN_TASKS_KEY = 'cibil_action_plan_306090_tasks';

export const MilestoneRewards: React.FC<MilestoneRewardsProps> = ({
  report,
  analysis,
  onNavigate,
  className = '',
  compact = false,
}) => {
  // 1. Streak State
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STREAK_DAYS_KEY);
      return saved ? parseInt(saved, 10) : 12; // default healthy baseline for demo
    } catch {
      return 12;
    }
  });

  const [lastCheckinDate, setLastCheckinDate] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LAST_CHECKIN_KEY);
    } catch {
      return null;
    }
  });

  // 2. First Dispute Filed State
  const [hasFiledDispute, setHasFiledDispute] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISPUTES_FILED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // 3. Score Improvement State
  const [hasScoreImprovement, setHasScoreImprovement] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SCORE_IMPROVED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // 4. Action Plan Completed Count
  const [actionPlanProgress, setActionPlanProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 5,
  });

  // 5. Selected Badge for Detail Modal
  const [selectedBadge, setSelectedBadge] = useState<MilestoneReward | null>(null);

  // 6. Filter Tab
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // 7. Toast Celebration State
  const [celebrationToast, setCelebrationToast] = useState<{
    title: string;
    description: string;
    points: number;
  } | null>(null);

  // Sync all states from localStorage
  const syncFromStorage = () => {
    try {
      const savedDispute = localStorage.getItem(DISPUTES_FILED_KEY) === 'true';
      setHasFiledDispute(savedDispute);

      const savedScoreImp = localStorage.getItem(SCORE_IMPROVED_KEY) === 'true';
      setHasScoreImprovement(savedScoreImp);

      const savedStreak = localStorage.getItem(STREAK_DAYS_KEY);
      if (savedStreak) setStreakDays(parseInt(savedStreak, 10));

      const savedCheckin = localStorage.getItem(LAST_CHECKIN_KEY);
      if (savedCheckin) setLastCheckinDate(savedCheckin);

      const savedStrategic = localStorage.getItem(ACTION_PLAN_STORAGE_KEY);
      const strategicObj = savedStrategic ? JSON.parse(savedStrategic) : {};
      const strategicDone = Object.values(strategicObj).filter(Boolean).length;

      const savedRoadmap = localStorage.getItem(ACTION_PLAN_TASKS_KEY);
      const roadmapObj = savedRoadmap ? JSON.parse(savedRoadmap) : {};
      const roadmapDone = Object.values(roadmapObj).filter(Boolean).length;

      const totalDone = strategicDone + roadmapDone;
      setActionPlanProgress({
        completed: totalDone,
        total: 5,
      });
    } catch (err) {
      console.warn('Action plan sync offline:', err);
    }
  };

  // Listen for storage events or custom milestone update events
  useEffect(() => {
    syncFromStorage();

    const handleCustomEvent = () => syncFromStorage();
    window.addEventListener('cibil_milestone_event', handleCustomEvent);
    window.addEventListener('storage', handleCustomEvent);

    return () => {
      window.removeEventListener('cibil_milestone_event', handleCustomEvent);
      window.removeEventListener('storage', handleCustomEvent);
    };
  }, []);

  // Today's Date String YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = lastCheckinDate === todayStr;

  // Handler for Daily Check-in
  const handleCheckIn = () => {
    const nextStreak = hasCheckedInToday ? streakDays : streakDays + 1;
    setStreakDays(nextStreak);
    setLastCheckinDate(todayStr);

    try {
      localStorage.setItem(STREAK_DAYS_KEY, nextStreak.toString());
      localStorage.setItem(LAST_CHECKIN_KEY, todayStr);
    } catch {}

    if (nextStreak === 30) {
      setCelebrationToast({
        title: '🏆 30-Day Streak Milestone Unlocked!',
        description: 'You earned the Gold 30-Day Discipline Badge and +150 Recovery Points!',
        points: 150,
      });
    } else {
      setCelebrationToast({
        title: `🔥 Day ${nextStreak} Check-in Complete!`,
        description: 'Consistent daily financial monitoring keeps bureau errors at zero.',
        points: 10,
      });
    }

    setTimeout(() => {
      setCelebrationToast(null);
    }, 3200);
  };

  // Handler to toggle fast-forward streak for testing/gratification
  const handleToggleFastForwardStreak = () => {
    const targetStreak = streakDays >= 30 ? 14 : 30;
    setStreakDays(targetStreak);
    try {
      localStorage.setItem(STREAK_DAYS_KEY, targetStreak.toString());
    } catch {}

    if (targetStreak === 30) {
      setCelebrationToast({
        title: '🏆 30-Day Streak Achieved!',
        description: 'Outstanding discipline! 30-Day Streak badge is now active on your profile.',
        points: 150,
      });
      setTimeout(() => setCelebrationToast(null), 3000);
    }
  };

  // Handler to toggle Dispute Filed status
  const handleToggleDispute = () => {
    const next = !hasFiledDispute;
    setHasFiledDispute(next);
    try {
      localStorage.setItem(DISPUTES_FILED_KEY, next ? 'true' : 'false');
    } catch {}

    if (next) {
      setCelebrationToast({
        title: '⚖️ First Dispute Filed Badge Earned!',
        description: 'Statutory Section 21 dispute claim registered. +100 Recovery Points awarded.',
        points: 100,
      });
      setTimeout(() => setCelebrationToast(null), 3000);
    }
  };

  // Handler to toggle Score Improvement
  const handleToggleScoreImprovement = () => {
    const next = !hasScoreImprovement;
    setHasScoreImprovement(next);
    try {
      localStorage.setItem(SCORE_IMPROVED_KEY, next ? 'true' : 'false');
    } catch {}

    if (next) {
      setCelebrationToast({
        title: '📈 Score Improvement Badge Unlocked!',
        description: 'Credit score upgraded by +35 points! +120 Recovery Points added.',
        points: 120,
      });
      setTimeout(() => setCelebrationToast(null), 3000);
    }
  };

  // Compile list of Milestone Rewards Badges
  const badges: MilestoneReward[] = useMemo(() => {
    // 1. Report Diagnostic
    const hasReport = !!report;

    // 2. Safe Utilization (<30%)
    const cardAccounts = report?.accounts.filter(
      (a) => a.accountType === 'CREDIT_CARD' || a.accountType.includes('CARD')
    ) || [];
    const totalLimit = cardAccounts.reduce((sum, a) => sum + (a.sanctionedAmount || a.highCredit || 0), 0);
    const totalBalance = cardAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const utilizationPct = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 18;
    const isUtilizationSafe = utilizationPct <= 30;

    // 3. Action Plan Pioneer
    const actionPlanUnlocked = actionPlanProgress.completed >= 3;

    // 4. Streak 30 Days
    const streakUnlocked = streakDays >= 30;

    // 5. Score Improvement (+25 pts)
    const baseScore = report?.score.score || 618;
    const isScoreImproved = hasScoreImprovement || (report && report.score.score >= 700);

    return [
      {
        id: 'first-dispute',
        title: 'First Dispute Filed',
        description: 'Generated or lodged a statutory Section 21 dispute on inaccurate overdue or loan data.',
        category: 'dispute',
        tier: 'gold',
        points: 100,
        currentValue: hasFiledDispute ? 1 : 0,
        targetValue: 1,
        unit: 'dispute',
        isUnlocked: hasFiledDispute,
        unlockedAt: hasFiledDispute ? 'Verified Record' : undefined,
        howToUnlock: 'Draft and submit a formal dispute letter for any discrepancy in your credit report.',
        actionLabel: hasFiledDispute ? 'Review Dispute Status' : 'Draft Dispute Letter',
        actionTab: 'disputes',
        bureauTip: 'Under the CICRA 2005 regulations and RBI Master Directions, credit bureaus must verify disputes with credit institutions within 30 days.',
      },
      {
        id: 'streak-30',
        title: '30-Day Streak',
        description: 'Maintained 30 consecutive days of disciplined credit health monitoring and on-time habit tracking.',
        category: 'streak',
        tier: 'platinum',
        points: 150,
        currentValue: Math.min(streakDays, 30),
        targetValue: 30,
        unit: 'days',
        isUnlocked: streakUnlocked,
        unlockedAt: streakUnlocked ? 'Day 30 Achieved' : undefined,
        howToUnlock: 'Check in regularly to track your payment obligations and maintain zero default reporting.',
        actionLabel: streakUnlocked ? 'Streak Maintained' : 'Check In Today',
        actionTab: undefined,
        bureauTip: 'Consistent monthly payment reporting without late tags (000 DPD) carries a 35% weight in your CIBIL score calculation.',
      },
      {
        id: 'score-improvement',
        title: 'Score Improvement',
        description: 'Recorded a verified score recovery jump of +25 to +50 points over baseline.',
        category: 'score',
        tier: 'platinum',
        points: 120,
        currentValue: isScoreImproved ? 42 : 18,
        targetValue: 35,
        unit: 'pts jump',
        isUnlocked: isScoreImproved,
        unlockedAt: isScoreImproved ? '+42 Pts Upgrade' : undefined,
        howToUnlock: 'Reduce high revolving card balances or resolve negative accounts to drive upward score velocity.',
        actionLabel: 'View Future Outlook',
        actionTab: 'future-outlook',
        bureauTip: 'Clearing single 90+ DPD overdue flags can rebound a damaged credit score by 30-65 points within 2 reporting cycles.',
      },
      {
        id: 'report-audit',
        title: 'Report Diagnosed',
        description: 'Uploaded and completed a deep-scan AI audit of CIBIL bureau trade lines and remarks.',
        category: 'audit',
        tier: 'silver',
        points: 50,
        currentValue: hasReport ? 1 : 0,
        targetValue: 1,
        unit: 'audit',
        isUnlocked: hasReport,
        unlockedAt: hasReport ? 'Report Analyzed' : undefined,
        howToUnlock: 'Upload your CIBIL statement or run the interactive demo report to unlock this foundational badge.',
        actionLabel: 'View Diagnostics',
        actionTab: 'analysis',
        bureauTip: 'Annual credit report audits catch identity theft, duplicate trade lines, and clerical errors before loan rejections happen.',
      },
      {
        id: 'safe-utilization',
        title: 'Safe Utilization (<30%)',
        description: 'Maintained revolving credit card utilization comfortably below the 30% safe threshold.',
        category: 'utilization',
        tier: 'silver',
        points: 80,
        currentValue: isUtilizationSafe ? 18 : utilizationPct,
        targetValue: 30,
        unit: '% ratio',
        isUnlocked: isUtilizationSafe,
        unlockedAt: isUtilizationSafe ? `${utilizationPct}% Active` : undefined,
        howToUnlock: 'Pay down high card balances or request limit enhancements without taking hard credit pulls.',
        actionLabel: 'Check Utilization',
        actionTab: 'analysis',
        bureauTip: 'Credit utilization ratio is calculated on both individual cards and aggregate revolving limits on your statement date.',
      },
      {
        id: 'action-pioneer',
        title: 'Action Plan Pioneer',
        description: 'Successfully cleared 3 or more recovery milestones in your 30-60-90 day action plan.',
        category: 'action',
        tier: 'gold',
        points: 100,
        currentValue: Math.min(actionPlanProgress.completed, 5),
        targetValue: 3,
        unit: 'milestones',
        isUnlocked: actionPlanUnlocked,
        unlockedAt: actionPlanUnlocked ? `${actionPlanProgress.completed} Tasks Done` : undefined,
        howToUnlock: 'Mark tasks as complete in your personalized Action Plan to build your recovery momentum.',
        actionLabel: 'Go to Action Plan',
        actionTab: 'action-plan',
        bureauTip: 'Organized 30-day follow-up SLAs with lender Nodal Officers guarantee systematic resolution of disputed trade lines.',
      },
    ];
  }, [report, hasFiledDispute, streakDays, hasScoreImprovement, actionPlanProgress]);

  // Calculations
  const totalBadges = badges.length;
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const unlockedCount = unlockedBadges.length;
  const progressPct = Math.round((unlockedCount / totalBadges) * 100);
  const totalPointsEarned = unlockedBadges.reduce((sum, b) => sum + b.points, 0);

  // User Level Tier
  const userLevel = useMemo(() => {
    if (unlockedCount >= 5) return { title: 'Level 4: Prime 750+ Elite', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (unlockedCount >= 3) return { title: 'Level 3: Credit Champion', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (unlockedCount >= 2) return { title: 'Level 2: Discipline Builder', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    return { title: 'Level 1: Recovery Novice', color: 'text-slate-700 bg-slate-100 border-slate-200' };
  }, [unlockedCount]);

  // Filtered Badges
  const filteredBadges = useMemo(() => {
    if (filter === 'unlocked') return badges.filter((b) => b.isUnlocked);
    if (filter === 'locked') return badges.filter((b) => !b.isUnlocked);
    return badges;
  }, [badges, filter]);

  // Helper for Tier Badge styles
  const getTierDetails = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return {
          label: 'Platinum',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          gradient: 'from-purple-500 to-indigo-600',
          glow: 'shadow-purple-500/20',
        };
      case 'gold':
        return {
          label: 'Gold',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          gradient: 'from-amber-400 to-orange-500',
          glow: 'shadow-amber-500/25',
        };
      case 'silver':
        return {
          label: 'Silver',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
          gradient: 'from-slate-400 to-slate-600',
          glow: 'shadow-slate-400/20',
        };
      default:
        return {
          label: 'Bronze',
          badgeClass: 'bg-orange-100 text-orange-900 border-orange-200',
          gradient: 'from-orange-400 to-amber-600',
          glow: 'shadow-orange-500/20',
        };
    }
  };

  // Helper to render icon
  const renderBadgeIcon = (id: string, isUnlocked: boolean, tier: string) => {
    const tierInfo = getTierDetails(tier);

    const iconElement = (() => {
      switch (id) {
        case 'first-dispute':
          return <FileCheck2 className="w-5 h-5 text-white" />;
        case 'streak-30':
          return <Flame className="w-5 h-5 text-white animate-pulse" />;
        case 'score-improvement':
          return <TrendingUp className="w-5 h-5 text-white" />;
        case 'report-audit':
          return <Award className="w-5 h-5 text-white" />;
        case 'safe-utilization':
          return <ShieldCheck className="w-5 h-5 text-white" />;
        case 'action-pioneer':
          return <Trophy className="w-5 h-5 text-white" />;
        default:
          return <Star className="w-5 h-5 text-white" />;
      }
    })();

    if (isUnlocked) {
      return (
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tierInfo.gradient} flex items-center justify-center shadow-md ${tierInfo.glow} relative shrink-0 ring-2 ring-white`}
        >
          {iconElement}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-2xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        </div>
      );
    }

    return (
      <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 relative">
        <Lock className="w-5 h-5 text-slate-400" />
      </div>
    );
  };

  return (
    <div className={`space-y-5 text-left relative ${className}`}>
      {/* Celebration Toast */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="fixed top-20 right-6 z-50 max-w-sm w-full pointer-events-none"
          >
            <div className="pointer-events-auto p-4 rounded-2xl bg-[#12233F] text-white border border-amber-400/40 shadow-xl flex items-start gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Trophy className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-wide">
                  {celebrationToast.title}
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {celebrationToast.description}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">
                  +{celebrationToast.points} Recovery Points
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Banner: Overall Milestone Progress & Level */}
      <div className="bg-gradient-to-r from-white via-white to-orange-50/50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-2xs">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#12233F] font-heading">
                Recovery Milestone Rewards
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${userLevel.color}`}>
                {userLevel.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
              Earn badges by completing statutory disputes, maintaining clean repayment streaks, and lowering credit card debt.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-right">
              <span className="text-xs text-slate-500 font-medium block">Total Rewards</span>
              <div className="flex items-center gap-1 font-extrabold text-[#12233F]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{totalPointsEarned} Pts</span>
              </div>
            </div>

            <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 text-right">
              <span className="text-xs text-slate-500 font-medium block">Badges Earned</span>
              <span className="text-base font-extrabold text-emerald-600">
                {unlockedCount} / {totalBadges}
              </span>
            </div>
          </div>
        </div>

        {/* Global Journey Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Milestone Roadmap Completion</span>
            <span className="text-emerald-700 font-bold">{progressPct}% Complete</span>
          </div>

          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 relative">
            <motion.div
              className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-[#FF6A00] via-amber-500 to-emerald-600"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 85, damping: 16 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Interactive 30-Day Streak Highlight Bar */}
        <div className="bg-[#12233F] rounded-xl p-3.5 sm:p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">
                  {streakDays}-Day Credit Habit Streak
                </span>
                {streakDays >= 30 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                    Badge Unlocked 🏅
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {streakDays >= 30
                  ? '30 days reached! You have established a resilient zero-late-payment cycle.'
                  : `${30 - streakDays} days remaining to unlock the Platinum 30-Day Streak Badge.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={hasCheckedInToday}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                hasCheckedInToday
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-[#FF6A00] hover:bg-[#E65F00] text-white shadow-xs'
              }`}
            >
              {hasCheckedInToday ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Checked In Today</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Check In (+1 Day)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleFastForwardStreak}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              title="Test 30-day badge unlock"
            >
              {streakDays >= 30 ? 'Reset Streak' : 'Simulate 30 Days'}
            </button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#12233F] text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              All Badges ({totalBadges})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unlocked')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === 'unlocked'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('locked')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filter === 'locked'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              In Progress ({totalBadges - unlockedCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any badge to view statutory tips & criteria
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const tierInfo = getTierDetails(badge.tier);
          const isUnlocked = badge.isUnlocked;
          const badgeProgressPct = Math.min(
            100,
            Math.round((badge.currentValue / badge.targetValue) * 100)
          );

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedBadge(badge)}
              className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between shadow-xs ${
                isUnlocked
                  ? 'bg-white border-emerald-200/90 hover:border-emerald-300 hover:shadow-md'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-95'
              }`}
            >
              {/* Badge Top Row */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  {renderBadgeIcon(badge.id, isUnlocked, badge.tier)}

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${tierInfo.badgeClass}`}>
                      {tierInfo.label}
                    </span>
                    <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      +{badge.points} Pts
                    </span>
                  </div>
                </div>

                {/* Badge Title & Description */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-base font-bold ${isUnlocked ? 'text-[#12233F]' : 'text-slate-700'}`}>
                      {badge.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress and Unlock Status */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">
                    {isUnlocked ? 'Status' : 'Progress'}
                  </span>
                  <span className={`font-bold ${isUnlocked ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Earned ({badge.unlockedAt})</span>
                      </span>
                    ) : (
                      `${badge.currentValue} / ${badge.targetValue} ${badge.unit}`
                    )}
                  </span>
                </div>

                {/* Mini animated progress bar */}
                <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isUnlocked
                        ? 'bg-emerald-600'
                        : 'bg-gradient-to-r from-orange-400 to-[#FF6A00]'
                    }`}
                    initial={false}
                    animate={{ width: `${isUnlocked ? 100 : badgeProgressPct}%` }}
                    transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                  />
                </div>

                {/* Action Trigger Row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#FF6A00] font-bold group-hover:underline flex items-center gap-0.5">
                    <span>{badge.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>

                  {/* Fast Action Toggle for demo testing */}
                  {badge.id === 'first-dispute' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDispute();
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {hasFiledDispute ? 'Unmark' : 'Mark Filed'}
                    </button>
                  )}

                  {badge.id === 'score-improvement' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleScoreImprovement();
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {hasScoreImprovement ? 'Revert' : 'Simulate +35'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Badge Detail Modal Dialog */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 text-left relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {renderBadgeIcon(selectedBadge.id, selectedBadge.isUnlocked, selectedBadge.tier)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#12233F]">
                        {selectedBadge.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getTierDetails(selectedBadge.tier).badgeClass}`}>
                        {getTierDetails(selectedBadge.tier).label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      +{selectedBadge.points} Recovery Points • {selectedBadge.isUnlocked ? 'Unlocked' : 'In Progress'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {selectedBadge.description}
              </p>

              {/* Criteria / How to unlock */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  How to unlock
                </span>
                <p className="text-xs text-slate-700 font-medium">
                  {selectedBadge.howToUnlock}
                </p>
              </div>

              {/* Bureau / Regulatory Tip */}
              <div className="bg-amber-50/80 rounded-xl p-3.5 border border-amber-200/80 space-y-1 text-amber-950">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Bureau & Legal Impact
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {selectedBadge.bureauTip}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBadge(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedBadge.actionTab && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      const tab = selectedBadge.actionTab;
                      setSelectedBadge(null);
                      if (tab) onNavigate(tab);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6A00] hover:bg-[#E65F00] shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{selectedBadge.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
