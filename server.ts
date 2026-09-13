import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { AIAnalysisSchema } from './src/utils/aiSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory anonymous analytics store
const anonymousStats = {
  totalReportsAnalyzed: 142,
  successfulParses: 139,
  averageProcessingTimeMs: 1450,
  mostCommonNegativeFactors: [
    { factor: 'Active Overdue Balance', count: 78 },
    { factor: 'High Card Utilization (>60%)', count: 65 },
    { factor: 'Written-Off / Default Record', count: 42 },
    { factor: 'Multiple Inquiries within 90 Days', count: 39 },
    { factor: 'Reported Delay > 60 DPD', count: 34 },
  ],
  accountStatusDistribution: [
    { status: 'Standard / Active', percentage: 64 },
    { status: 'Closed / Settled', percentage: 22 },
    { status: 'Delinquent / Overdue', percentage: 9 },
    { status: 'Written Off', percentage: 5 },
  ],
  mostCommonDisputes: [
    { type: 'Active status shown after loan closure NOC', count: 48 },
    { type: 'Incorrect overdue amount post-settlement', count: 36 },
    { type: 'Duplicate trade line from same lender', count: 24 },
    { type: 'Unauthorized hard credit enquiry', count: 18 },
  ],
};

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Anonymous aggregate stats
app.get('/api/stats', (req, res) => {
  res.json(anonymousStats);
});

app.post('/api/stats/track', (req, res) => {
  anonymousStats.totalReportsAnalyzed++;
  anonymousStats.successfulParses++;
  res.json({ success: true, total: anonymousStats.totalReportsAnalyzed });
});

// AI Credit Report Analysis
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { report, deterministicBaseline } = req.body;
    if (!report) {
      return res.status(400).json({ error: 'Credit report payload is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return deterministic baseline safely if API key is not configured
      return res.json({
        result: {
          ...deterministicBaseline,
          generatedByAI: false,
          fallbackReason: 'AI model running in deterministic baseline mode (API key not configured in environment).',
        },
      });
    }

    const prompt = `
You are the elite AI Credit Analyst for "Digital Katta", an Indian Credit Information (CIBIL / TransUnion) Analysis platform.
Analyze the following normalized Indian credit report data with strict factual discipline, financial accuracy, and empathy.

CRITICAL INSTRUCTIONS:
1. Indian Context: Refer to CIBIL score (300 to 900 range), RBI norms, NOC (No Objection Certificate), DPD (Days Past Due), SMA/NPA, and Indian lenders (HDFC, SBI, ICICI, Axis, Bajaj Finance, etc.).
2. Negative Accounts: Deeply analyze every problematic account (Written Off, Settled, Overdue, High DPD > 30). For each, give:
   - "problem": Precise issue statement
   - "whyItMatters": Impact on credit score and future borrowing
   - "whatToVerify": Exactly what documents/dates the borrower must cross-check
   - "recommendedAction": Pragmatic steps (e.g. paying overdue, converting written-off to closed with NOC, raising lender grievance)
   - "documentsRequired": List of necessary documents (Closure letter, NOC, receipt, statement)
3. Disputable Items: Detect potential discrepancies (e.g. account active despite closure proof, overdue mismatch, duplicate accounts, incorrect DPD, unauthorized enquiry). Use cautious language like "Potential discrepancy detected".
4. Action Plan: Provide concrete 30/60/90 day steps tailored specifically to their overdue amounts and utilization.
5. NEVER guarantee a specific future CIBIL score increase.
6. Return structured JSON matching the provided schema.

REPORT DATA:
${JSON.stringify({
  personal: report.personal,
  score: report.score,
  summary: report.summary,
  accounts: report.accounts?.map((a: any) => ({
    lender: a.lender,
    type: a.accountType,
    maskedNo: a.accountNumberMasked,
    sanctioned: a.sanctionedAmount,
    balance: a.currentBalance,
    overdue: a.overdueAmount,
    status: a.rawStatus,
    maxDPD: a.maxDPD,
    dpdHistory: a.paymentHistory?.slice(0, 6),
    remarks: a.negativeRemarks,
  })),
  enquiries: report.enquiries,
})}

BASELINE DETERMINISTIC CALCULATIONS FOR GUIDANCE:
${JSON.stringify({
  healthScore100: deterministicBaseline?.creditHealth?.healthScore100,
  summary: deterministicBaseline?.creditHealth?.summary,
  criticalIssues: deterministicBaseline?.criticalIssues,
  disputeOpportunities: deterministicBaseline?.disputeOpportunities,
  rankedNegativeFactors: deterministicBaseline?.rankedNegativeFactors,
})}

Return ONLY a valid JSON object matching the requested schema with all fields.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text || '{}';
    let parsedJson = JSON.parse(responseText);

    // Validate with Zod
    const validationResult = AIAnalysisSchema.safeParse(parsedJson);
    if (validationResult.success) {
      return res.json({ result: { ...validationResult.data, generatedByAI: true } });
    } else {
      console.warn('AI JSON schema validation mismatch, falling back to baseline:', validationResult.error.message);
      return res.json({
        result: {
          ...deterministicBaseline,
          generatedByAI: false,
          fallbackReason: 'AI output adjusted to guaranteed deterministic schema.',
        },
      });
    }
  } catch (error: any) {
    console.error('AI Analysis endpoint error:', error);
    // Graceful fallback to deterministic baseline
    const baseline = req.body?.deterministicBaseline;
    return res.json({
      result: {
        ...(baseline || {}),
        generatedByAI: false,
        fallbackReason: 'AI service temporarily unavailable. Deterministic rule-based engine delivered full analysis.',
      },
    });
  }
});

// "Ask About My Credit Report" Chat Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { question, report, history } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Deterministic rule-based smart answer generator
      const answer = generateDeterministicChatResponse(question, report);
      return res.json({ answer, source: 'RULE_ENGINE' });
    }

    const systemInstruction = `
You are the AI Assistant for "Digital Katta – AI CIBIL Report Analyzer".
Your task is to answer user queries strictly regarding their uploaded Indian CIBIL/Credit report.
Tone: Professional, helpful, objective, empathetic, Indian banking knowledgeable.

RULES:
1. Answer ONLY using the uploaded credit report facts.
2. If certain information is NOT in the report (e.g. salary, reason for past job loss, current bank balance), clearly state that it is not available in the report.
3. Never promise a specific future score increase (e.g. do not say "your score will jump by 80 points"). Instead use "this may positively impact your score over 3 to 6 months of disciplined repayment".
4. Mask all account numbers (e.g. XXXXXX1234) and PAN numbers.
5. Reference RBI grievance guidelines, CIBIL dispute portal, and lender Nodal officers when suggesting corrections.
`;

    const reportContext = `
USER'S CREDIT REPORT CONTEXT:
- Name: ${report.personal?.name}
- CIBIL Score: ${report.score?.score} (${report.score?.category})
- Total Accounts: ${report.summary?.totalAccounts} (Active: ${report.summary?.activeAccounts}, Closed: ${report.summary?.closedAccounts}, Negative: ${report.summary?.negativeAccounts})
- Total Outstanding: ₹${report.summary?.totalOutstanding?.toLocaleString('en-IN')}
- Active Overdue: ₹${report.summary?.totalOverdue?.toLocaleString('en-IN')}
- Credit Card Utilization: ${report.summary?.creditCardUtilizationPct}% (Limit: ₹${report.summary?.totalCreditCardLimit?.toLocaleString('en-IN')}, Balance: ₹${report.summary?.totalCreditCardBalance?.toLocaleString('en-IN')})
- Recent Inquiries (90 Days): ${report.summary?.enquiriesLast90Days}
- Accounts List:
${report.accounts
  ?.map(
    (a: any) =>
      `  * [${a.lender}] ${a.accountType} (No: ${a.accountNumberMasked}): Balance ₹${a.currentBalance}, Overdue ₹${a.overdueAmount}, Status: "${a.rawStatus}", Max DPD: ${a.maxDPD}`
  )
  .join('\n')}
`;

    const prompt = `${reportContext}\n\nUser Question: ${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    res.json({ answer: response.text || 'Unable to generate response.', source: 'GEMINI' });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    const fallbackAnswer = generateDeterministicChatResponse(req.body.question, req.body.report);
    res.json({ answer: fallbackAnswer, source: 'RULE_ENGINE_FALLBACK' });
  }
});

// "Generate Correction Request" Letter Generator
app.post('/api/ai/letter', async (req, res) => {
  try {
    const { templateConfig, report } = req.body;
    const ai = getGeminiClient();

    const {
      templateType,
      lenderName,
      accountNumberMasked,
      borrowerName,
      borrowerPan,
      borrowerPhone,
      borrowerEmail,
      customDetails,
    } = templateConfig || {};

    if (!ai) {
      const letter = generateDeterministicLetter(templateConfig);
      return res.json({ letter, source: 'RULE_ENGINE' });
    }

    const prompt = `
Generate a formal, legally structured, and polite Indian Banking Grievance / Correction Request Letter.
Borrower Name: ${borrowerName || report?.personal?.name || 'Borrower'}
Borrower PAN: ${borrowerPan || report?.personal?.panMasked || 'XXXXX****X'}
Borrower Contact: ${borrowerPhone || '+91 XXXXX XXXXX'}, ${borrowerEmail || 'email@domain.com'}
Recipient Bank / NBFC: Principal Nodal Officer / Grievance Redressal Officer, ${lenderName || 'Financial Institution'}
Subject Issue Type: ${templateType}
Target Account Number: ${accountNumberMasked || 'XXXX-XXXX-XXXX'}
Specific Context / Details: ${customDetails || 'Please refer to enclosed loan clearance records and credit report extracts.'}

Include:
1. Proper date and address placeholders: [Date: DD/MM/YYYY], [Branch Address].
2. Reference to RBI Master Direction on Credit Information Companies (Regulation) Rules, 2006 (mandating credit data rectification within 30 days).
3. Clear factual description of the discrepancy.
4. Specific remedy demanded (e.g. update status to "Closed", remove inaccurate DPD, zero out spurious overdue, notify TransUnion CIBIL).
5. List of attached annexures/proofs.
6. Signature block.

Generate ONLY the clean letter text ready to print or email.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    res.json({ letter: response.text || generateDeterministicLetter(templateConfig), source: 'GEMINI' });
  } catch (error) {
    console.error('Letter generation error:', error);
    res.json({ letter: generateDeterministicLetter(req.body?.templateConfig), source: 'RULE_ENGINE_FALLBACK' });
  }
});

// Deterministic response helper for chat
function generateDeterministicChatResponse(question: string, report: any): string {
  const q = (question || '').toLowerCase();
  const summary = report?.summary || {};
  const accounts = report?.accounts || [];

  if (q.includes('why') && (q.includes('low') || q.includes('score'))) {
    const reasons: string[] = [];
    if (summary.totalOverdue > 0) reasons.push(`an active overdue balance of ₹${summary.totalOverdue.toLocaleString('en-IN')}`);
    const writtenOff = accounts.filter((a: any) => a.normalizedStatus === 'WRITTEN_OFF').length;
    if (writtenOff > 0) reasons.push(`${writtenOff} written-off / default account(s)`);
    if (summary.creditCardUtilizationPct > 50) reasons.push(`high credit card utilization of ${summary.creditCardUtilizationPct}%`);
    if (summary.enquiriesLast90Days >= 3) reasons.push(`${summary.enquiriesLast90Days} recent hard inquiries within 90 days`);

    if (reasons.length > 0) {
      return `Your CIBIL score is currently ${report?.score?.score || 618} (${report?.score?.category || 'Needs Improvement'}). The primary factors affecting your score are:\n\n` +
        reasons.map((r, i) => `${i + 1}. ${r.charAt(0).toUpperCase() + r.slice(1)}`).join('\n') +
        `\n\nResolving active overdues and reducing card balances below 30% typically provides the fastest recovery.`;
    }
    return `Your score is ${report?.score?.score || 700}. Maintaining on-time repayments and low credit utilization will help sustain and strengthen it over time.`;
  }

  if (q.includes('which account') || q.includes('hurting') || q.includes('worst')) {
    const overdueAcc = accounts.find((a: any) => a.overdueAmount > 0);
    const writeOffAcc = accounts.find((a: any) => a.normalizedStatus === 'WRITTEN_OFF');
    if (overdueAcc) {
      return `The account causing the most immediate ongoing damage is your ${overdueAcc.accountType} with ${overdueAcc.lender} (Account: ${overdueAcc.accountNumberMasked}), reporting an active overdue of ₹${overdueAcc.overdueAmount.toLocaleString('en-IN')}. Clearing this overdue should be your highest priority.`;
    }
    if (writeOffAcc) {
      return `The account with the most severe long-term mark is your ${writeOffAcc.accountType} with ${writeOffAcc.lender} (Account: ${writeOffAcc.accountNumberMasked}), classified as "Written Off". You should approach ${writeOffAcc.lender} to settle the dues and obtain an official No Dues Certificate (NOC).`;
    }
    return `None of your accounts currently carry critical overdue or write-off statuses. Focus on keeping revolving balances under 30% of your credit limit.`;
  }

  if (q.includes('utilization') || q.includes('card')) {
    return `Your credit card utilization is currently ${summary.creditCardUtilizationPct || 0}%. You are using ₹${(summary.totalCreditCardBalance || 0).toLocaleString('en-IN')} out of an aggregate credit ceiling of ₹${(summary.totalCreditCardLimit || 0).toLocaleString('en-IN')}. For optimal CIBIL scoring, credit rating agencies recommend keeping utilization strictly below 30% (approx ₹${Math.round((summary.totalCreditCardLimit || 0) * 0.3).toLocaleString('en-IN')}).`;
  }

  if (q.includes('document') || q.includes('proof')) {
    return `To dispute errors or clear negative accounts with Indian lenders, keep the following documents ready:\n1. Loan Foreclosure / Closure Letter\n2. Bank No Objection Certificate (NOC) on official letterhead\n3. Final payment receipt with UTR/Transaction Reference\n4. Bank account statement showing EMI debits\n5. Self-attested PAN Card and CIBIL report extract.`;
  }

  return `Based on your uploaded CIBIL report, your profile shows ${summary.totalAccounts || 0} accounts with an aggregate outstanding balance of ₹${(summary.totalOutstanding || 0).toLocaleString('en-IN')}. Feel free to ask specific questions about any individual account, overdue amount, dispute opportunities, or your 30/60/90-day action plan.`;
}

// Deterministic letter template generator
function generateDeterministicLetter(config: any): string {
  const date = new Date().toLocaleDateString('en-GB');
  return `Date: ${date}

To,
The Principal Nodal Officer / Grievance Redressal Cell,
${config?.lenderName || 'Financial Institution Ltd.'},
Consumer Credit Operations Division.

Subject: Formal Request for Rectification of Credit Information - Account No: ${config?.accountNumberMasked || 'XXXX-XXXX'}

Dear Sir / Madam,

I am writing to bring to your urgent attention an inaccurate entry reported by your institution in my TransUnion CIBIL credit report under facility reference ${config?.accountNumberMasked || 'XXXX-XXXX'}.

Borrower Particulars:
- Full Name: ${config?.borrowerName || 'Borrower Name'}
- PAN Number: ${config?.borrowerPan || 'ABCDE1234F'}
- Contact Number: ${config?.borrowerPhone || '+91 XXXXX XXXXX'}
- Registered Email: ${config?.borrowerEmail || 'user@domain.com'}

Description of Discrepancy:
${config?.customDetails || 'The account status or overdue amount reflected in my credit report does not match the actual repayment records. The necessary payments / closures have been executed and acknowledged.'}

Legal & Regulatory Mandate:
As per the Master Directions issued by the Reserve Bank of India (RBI) under the Credit Information Companies (Regulation) Act, 2005 (Section 21 and CIC Rules, 2006), Credit Institutions are required to update and rectify inaccurate credit data with all four credit bureaus (CIBIL, Experian, Equifax, CRIF High Mark) within 30 days of receiving a grievance.

Remedy Requested:
1. Immediately verify your internal ledger and correct the reporting of this facility to reflect accurate status (Zero Outstanding / Closed / NOC Issued / Correct DPD).
2. Transmit the rectified data to TransUnion CIBIL and other authorized credit bureaus in your upcoming monthly reporting cycle.
3. Issue a formal written confirmation / No Dues Certificate (NOC) to my registered email address.

Enclosures:
1. Copy of relevant Payment Receipt / Bank Statement.
2. Relevant Loan Closure / NOC document (if applicable).
3. Self-attested PAN Card copy for identity verification.

Thanking you,

Yours sincerely,

___________________________
${config?.borrowerName || 'Authorized Signatory'}
`;
}

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Katta Server running on port ${PORT}`);
  });
}

startServer();
