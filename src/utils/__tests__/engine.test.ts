import { runDeterministicAnalysis } from '../hybridAnalysisEngine.js';
import { goldenCibilCleanReport, goldenExperianStressedReport } from './testFixtures.js';

export function runTests(): { total: number; passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✓ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`✗ FAIL: ${testName}`);
    }
  }

  // Test 1: Clean report produces high credit health score (> 80)
  const cleanAnalysis = runDeterministicAnalysis(goldenCibilCleanReport);
  assert(
    cleanAnalysis.creditHealth.healthScore100 >= 80,
    'Clean CIBIL profile scores >= 80 health score'
  );
  assert(
    cleanAnalysis.negativeAccounts.length === 0,
    'Clean profile has 0 negative accounts'
  );
  assert(
    cleanAnalysis.criticalIssues.length === 0,
    'Clean profile has 0 critical issues'
  );

  // Test 2: Stressed report produces low health score and identifies critical issues
  const stressedAnalysis = runDeterministicAnalysis(goldenExperianStressedReport);
  assert(
    stressedAnalysis.creditHealth.healthScore100 < 55,
    'Stressed profile scores < 55 health score'
  );
  assert(
    stressedAnalysis.negativeAccounts.length === 2,
    'Stressed profile detects exactly 2 negative accounts'
  );
  assert(
    stressedAnalysis.criticalIssues.some(issue => issue.title.includes('Overdue') || issue.title.includes('Written-Off')),
    'Stressed profile detects overdue or written-off critical issue'
  );
  assert(
    stressedAnalysis.utilizationAnalysis.utilizationPct === 95,
    'Utilization correctly computed as 95%'
  );

  return { total: passed + failed, passed, failed, results };
}

// Auto-run if executed via tsx/node directly
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('engine.test')) {
  const { total, passed, failed, results } = runTests();
  console.log(`\n=== Digital Katta Engine Test Suite ===`);
  results.forEach(r => console.log(r));
  console.log(`Summary: ${passed}/${total} passed\n`);
  if (failed > 0) process.exit(1);
}
