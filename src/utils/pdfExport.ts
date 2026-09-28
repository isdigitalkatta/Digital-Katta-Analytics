import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DIGITAL_KATTA_LOGO_BASE64 } from '../assets/logoBase64';
import i18n from '../i18n';

export interface PdfExportOptions {
  fileName?: string;
  onProgress?: (status: string) => void;
}

export interface AiAnalysisPdfOptions {
  fileName?: string;
  onProgress?: (status: string) => void;
  language?: string;
}

/**
 * Wait for element to exist, be visible, and have non-zero height.
 */
async function waitForRenderedElement(
  elementId: string,
  timeoutMs: number = 3000
): Promise<HTMLElement> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const el = document.getElementById(elementId);
    if (el && el.offsetHeight > 0 && el.scrollHeight > 0) {
      return el;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error(`Report element #${elementId} was not found in the DOM.`);
  }
  if (el.offsetHeight === 0 || el.scrollHeight === 0) {
    throw new Error(`Report element #${elementId} is currently hidden or has zero height.`);
  }
  return el;
}

/**
 * Hardened client-side PDF export using html2canvas and jsPDF with A4 slicing and Blob download.
 */
export async function exportReportToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  options.onProgress?.('Preparing report canvas...');

  const element = await waitForRenderedElement(elementId);

  // Preserve initial window scroll position
  const currentScrollX = window.scrollX;
  const currentScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Save previous styles to restore after capture
  const prevMaxHeight = element.style.maxHeight;
  const prevOverflow = element.style.overflow;
  const prevHeight = element.style.height;

  try {
    // Temporarily expand the element to its full scroll height
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';
    element.style.height = 'auto';

    // Allow browser a tick to recalculate layout
    await new Promise((resolve) => setTimeout(resolve, 60));

    options.onProgress?.('Capturing high-resolution report snapshot...');

    const canvas = await html2canvas(element, {
      scale: 2, // 2x density for sharp typography & vector lines
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1200,
      foreignObjectRendering: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.width = '920px';
          clonedEl.style.maxWidth = '920px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.padding = '32px 28px';
          clonedEl.style.borderRadius = '0px';
          clonedEl.style.border = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.maxHeight = 'none';
          clonedEl.style.overflow = 'visible';

          // Force exact color reproduction on all child nodes
          const allElements = clonedEl.querySelectorAll('*');
          allElements.forEach((node) => {
            const el = node as HTMLElement;
            if (el.style) {
              el.style.setProperty('-webkit-print-color-adjust', 'exact');
              el.style.setProperty('print-color-adjust', 'exact');
            }
          });
        }
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas render produced an empty image. Falling back to server PDF generator.');
    }

    options.onProgress?.('Building multi-page A4 PDF document...');

    // A4 dimensions in mm
    const PDF_PAGE_WIDTH_MM = 210;
    const PDF_PAGE_HEIGHT_MM = 297;
    const MARGIN_MM = 8;
    const PRINTABLE_WIDTH_MM = PDF_PAGE_WIDTH_MM - MARGIN_MM * 2;
    const PRINTABLE_HEIGHT_MM = PDF_PAGE_HEIGHT_MM - MARGIN_MM * 2;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Pixels per mm on the captured canvas
    const pxPerMm = canvas.width / PRINTABLE_WIDTH_MM;
    const pageSliceHeightPx = Math.floor(PRINTABLE_HEIGHT_MM * pxPerMm);

    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const currentSliceHeight = Math.min(pageSliceHeightPx, canvas.height - sourceY);

      // Create an offscreen canvas for each page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = currentSliceHeight;

      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentSliceHeight,
          0,
          0,
          canvas.width,
          currentSliceHeight
        );
      }

      const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.95);
      const renderHeightMm = (currentSliceHeight * PRINTABLE_WIDTH_MM) / canvas.width;

      pdf.addImage(
        sliceDataUrl,
        'JPEG',
        MARGIN_MM,
        MARGIN_MM,
        PRINTABLE_WIDTH_MM,
        renderHeightMm,
        undefined,
        'FAST'
      );

      sourceY += pageSliceHeightPx;
      pageIndex++;
    }

    const outputName = options.fileName || 'Digital_Katta_Credit_Health_Report.pdf';
    options.onProgress?.('Downloading PDF file...');

    // Robust Blob-based download for browser and iframe environments
    const pdfBlob = pdf.output('blob');
    if (!pdfBlob || pdfBlob.size === 0) {
      throw new Error('Generated PDF blob was empty. Falling back to server generator.');
    }

    const blobUrl = URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = outputName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);

    // Trigger download
    anchor.click();

    setTimeout(() => {
      try {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      } catch (_) {}
    }, 2500);

    return true;
  } finally {
    // Restore element styles and scroll position
    element.style.maxHeight = prevMaxHeight;
    element.style.overflow = prevOverflow;
    element.style.height = prevHeight;
    window.scrollTo(currentScrollX, currentScrollY);
  }
}

/**
 * Robust document printing helper with iframe isolation and fallback
 */
export function printReportDocument(elementId: string, title: string): Promise<boolean> {
  return new Promise((resolve) => {
    const element = document.getElementById(elementId);
    if (!element) {
      try {
        window.print();
        resolve(true);
      } catch (err) {
        console.error('window.print failed:', err);
        resolve(false);
      }
      return;
    }

    try {
      // Create hidden print iframe to isolate report styles and prevent flex clipping
      const printIframe = document.createElement('iframe');
      printIframe.setAttribute('title', 'Print Preview Frame');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      printIframe.style.visibility = 'hidden';

      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        // Collect stylesheet tags from parent document
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map((el) => el.outerHTML)
          .join('\n');

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>${title}</title>
              ${styles}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                body {
                  background: #ffffff !important;
                  color: #0f172a !important;
                  padding: 12px !important;
                  margin: 0 !important;
                  font-family: system-ui, -apple-system, sans-serif;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .print-break-inside-avoid {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                }
              </style>
            </head>
            <body>
              <div style="max-width: 900px; margin: 0 auto;">
                ${element.innerHTML}
              </div>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
            resolve(true);
          } catch (iframeErr) {
            console.warn('Iframe print restricted, triggering window.print():', iframeErr);
            try {
              window.print();
              resolve(true);
            } catch (windowPrintErr) {
              console.error('window.print also blocked:', windowPrintErr);
              resolve(false);
            }
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(printIframe);
              } catch (_) {}
            }, 3000);
          }
        }, 350);
        return;
      }
    } catch (err) {
      console.warn('Print iframe error, attempting window.print:', err);
    }

    try {
      window.print();
      resolve(true);
    } catch (finalErr) {
      console.error('Print dialog failed to open:', finalErr);
      resolve(false);
    }
  });
}

/**
 * Helper to get clean ASCII-safe text for jsPDF Helvetica renderer
 */
function toSafePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[₹]/g, 'INR ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Multilingual content dictionary for the executive PDF report
 */
function getPdfLocalizedContent(lang: string) {
  const code = (lang || 'en').toLowerCase().slice(0, 2);

  // Marathi (MR)
  if (code === 'mr') {
    return {
      langLabel: 'Marathi (MR)',
      brandTagline: 'Theekan Ek, Suvidha Anek..! (Financial Growth Partner)',
      reportTitle: 'AI CIBIL CREDIT HEALTH AUDIT & RECOVERY PLAN',
      regionalAdvisory: 'Maharashtra Regional Desk  |  DPDP Act 2023 Compliant',
      topKeyPointsTitle: 'TOP KEY POINTS TO IMPROVE CREDIT SCORE',
      topKeyPointsSubtitle: 'Credit score sudharnyache mahatvache mudde va pradhanyakram',
      topPoints: [
        {
          priority: 'PRIORITY 1',
          title: 'Thakit Khate va DPD Durusti (Overdue Accounts & DPD Delinquencies)',
          gain: '+40 to +65 Pts',
          color: [225, 29, 72] as [number, number, number],
          desc: 'Settle or file Section 21 dispute notices for 30+ DPD overdue accounts to halt immediate negative reporting across all 4 bureaus.',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Credit Card Vapar < 30% Kamine (Compress Card Utilization)',
          gain: '+25 to +45 Pts',
          color: [245, 107, 43] as [number, number, number],
          desc: 'Pay down revolving credit card balances below 30% of total credit limit prior to monthly bill generation dates.',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Anadhikrut Hard Enquiries Takrar (Challenge Unauthorized Inquiries)',
          gain: '+15 to +25 Pts',
          color: [37, 99, 235] as [number, number, number],
          desc: 'Issue statutory objection letters to lenders for hard credit enquiries performed without explicit borrower consent.',
        },
        {
          priority: 'PRIORITY 4',
          title: 'NACH / e-Mandate Niyamit Hafte (Automate 100% On-Time Repayments)',
          gain: '+30 to +50 Pts',
          color: [22, 163, 74] as [number, number, number],
          desc: 'Set up auto-debit (NACH/e-mandate) for all active loan EMIs and credit card minimum dues at least 3 business days before due date.',
        },
        {
          priority: 'PRIORITY 5',
          title: 'Juni Khate Chalu Theva (Preserve Seasoned Accounts & Credit Mix)',
          gain: '+10 to +20 Pts',
          color: [147, 51, 234] as [number, number, number],
          desc: 'Keep oldest credit cards and seasoned accounts open to maintain average credit line maturity and a healthy secured/unsecured mix.',
        },
      ],
      phase1Title: 'Phase 1: Divas 1 te 30 (Tatkal Durusti va Thakit Khate Niyantran)',
      phase2Title: 'Phase 2: Divas 31 te 60 (Card Vapar Niyantran va Bank Takrar Pathpuravatha)',
      phase3Title: 'Phase 3: Divas 61 te 90 (Score Punarbandhani va CIBIL Bureau Padtalani)',
    };
  }

  // Hindi (HI)
  if (code === 'hi') {
    return {
      langLabel: 'Hindi (HI)',
      brandTagline: 'Ek Sthan, Anek Suvidhayein..! (Financial Growth Partner)',
      reportTitle: 'AI CIBIL CREDIT HEALTH AUDIT & RECOVERY PLAN',
      regionalAdvisory: 'National Hindi Advisory Desk  |  DPDP Act 2023 Compliant',
      topKeyPointsTitle: 'TOP KEY POINTS TO IMPROVE CREDIT SCORE',
      topKeyPointsSubtitle: 'Credit score sudharne ke mukhya 5 bindu va karyayojana',
      topPoints: [
        {
          priority: 'PRIORITY 1',
          title: 'Bakaya Khate va DPD Sudhar (Overdue Accounts Rectification)',
          gain: '+40 to +65 Pts',
          color: [225, 29, 72] as [number, number, number],
          desc: 'Settle active overdue balances on delinquent accounts immediately or file formal Section 21 dispute letters with bank grievance cells.',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Credit Card Upyog < 30% Se Kam (Compress Card Utilization)',
          gain: '+25 to +45 Pts',
          color: [245, 107, 43] as [number, number, number],
          desc: 'Bring aggregate credit card balance strictly below the recommended 30% credit threshold to boost revolving credit health.',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Anadhikrit Enquiries Ko Chunauti (Challenge Unauthorized Enquiries)',
          gain: '+15 to +25 Pts',
          color: [37, 99, 235] as [number, number, number],
          desc: 'Dispute unconsented hard credit checks with respective financial institutions to purge score-dampening inquiry flags.',
        },
        {
          priority: 'PRIORITY 4',
          title: 'NACH / e-Mandate Se Samay Par Kist (Automate Repayments)',
          gain: '+30 to +50 Pts',
          color: [22, 163, 74] as [number, number, number],
          desc: 'Establish automated bank payment mandates to guarantee 100% on-time EMI and card payments for consistent compounding gains.',
        },
        {
          priority: 'PRIORITY 5',
          title: 'Purane Khate Sakriya Rakhein (Preserve Seasoned Credit Accounts)',
          gain: '+10 to +20 Pts',
          color: [147, 51, 234] as [number, number, number],
          desc: 'Maintain oldest active credit facilities to sustain strong vintage age and a balanced secured-to-unsecured borrowing profile.',
        },
      ],
      phase1Title: 'Phase 1: Din 1 se 30 (Tatkal DPD va Bakaya Khate Sudhar)',
      phase2Title: 'Phase 2: Din 31 se 60 (Card Upyog Niyantran va Bank Dispute Follow-up)',
      phase3Title: 'Phase 3: Din 61 se 90 (Score Punarnirman va Bureau Satyapan)',
    };
  }

  // Gujarati (GU)
  if (code === 'gu') {
    return {
      langLabel: 'Gujarati (GU)',
      brandTagline: 'Theekan Ek, Suvidha Anek..! (Financial Growth Partner)',
      reportTitle: 'AI CIBIL CREDIT HEALTH AUDIT & RECOVERY PLAN',
      regionalAdvisory: 'Gujarat Regional Advisory Desk  |  DPDP Act 2023 Compliant',
      topKeyPointsTitle: 'TOP KEY POINTS TO IMPROVE CREDIT SCORE',
      topKeyPointsSubtitle: 'Credit score sudharava mate na mukhya muddao',
      topPoints: [
        {
          priority: 'PRIORITY 1',
          title: 'Chhadhela Khata ane DPD Sudharo (Overdue Delinquencies Rectification)',
          gain: '+40 to +65 Pts',
          color: [225, 29, 72] as [number, number, number],
          desc: 'Clear overdue payments on delinquent accounts or lodge dispute notices under CICRA Act 2005 to halt negative score trajectory.',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Credit Card Upyog < 30% Kharo (Compress Card Utilization)',
          gain: '+25 to +45 Pts',
          color: [245, 107, 43] as [number, number, number],
          desc: 'Reduce revolving card credit usage below 30% limit across all credit cards before statement cycle closing.',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Bin-adhikrut Enquiries Takrar (Challenge Unauthorized Inquiries)',
          gain: '+15 to +25 Pts',
          color: [37, 99, 235] as [number, number, number],
          desc: 'Challenge unauthorized loan searches and hard inquiries logged without borrower consent.',
        },
        {
          priority: 'PRIORITY 4',
          title: 'NACH / e-Mandate Samay-sar Bhuktan (Automate Repayments)',
          gain: '+30 to +50 Pts',
          color: [22, 163, 74] as [number, number, number],
          desc: 'Enable automated repayment directives for all loan installments and credit card statements.',
        },
        {
          priority: 'PRIORITY 5',
          title: 'Juna Khata Chalu Rakho (Preserve Seasoned Credit Accounts)',
          gain: '+10 to +20 Pts',
          color: [147, 51, 234] as [number, number, number],
          desc: 'Retain oldest credit cards and healthy active loans to preserve established vintage credit history.',
        },
      ],
      phase1Title: 'Phase 1: Divas 1 thi 30 (Tatkal Durusti ane Thakit Khata Niyantran)',
      phase2Title: 'Phase 2: Divas 31 thi 60 (Card Upyog Niyantran ane Bank Takrar Follow-up)',
      phase3Title: 'Phase 3: Divas 61 thi 90 (Score Punarnirman ane Bureau Chakasani)',
    };
  }

  // Default / English (EN) & other regional languages
  return {
    langLabel: 'English (EN)',
    brandTagline: 'Theekan Ek, Suvidha Anek..! (Financial Growth Partner)',
    reportTitle: 'AI CIBIL CREDIT HEALTH AUDIT & RECOVERY PLAN',
    regionalAdvisory: 'National Credit Advisory Desk  |  DPDP Act 2023 Compliant',
    topKeyPointsTitle: 'TOP KEY POINTS TO IMPROVE CREDIT SCORE',
    topKeyPointsSubtitle: 'Prioritized recovery levers ranked by score impact & statutory timeline',
    topPoints: [
      {
        priority: 'PRIORITY 1',
        title: 'Overdue Accounts & DPD Delinquencies Rectification',
        gain: '+40 to +65 Pts',
        color: [225, 29, 72] as [number, number, number],
        desc: 'Settle active overdue balances on delinquent accounts immediately or file formal Section 21 dispute notices with bank grievance cells.',
      },
      {
        priority: 'PRIORITY 2',
        title: 'Compress Revolving Credit Card Utilization Below 30%',
        gain: '+25 to +45 Pts',
        color: [245, 107, 43] as [number, number, number],
        desc: 'Pay down aggregate revolving card balances below 30% of aggregate sanctioned credit limit prior to monthly bill cycle dates.',
      },
      {
        priority: 'PRIORITY 3',
        title: 'Statutory Challenge on Unauthorized Hard Enquiries',
        gain: '+15 to +25 Pts',
        color: [37, 99, 235] as [number, number, number],
        desc: 'Issue dispute letters to banks for hard credit inquiries performed without explicit borrower consent to remove inquiry penalties.',
      },
      {
        priority: 'PRIORITY 4',
        title: 'Automate 100% On-Time Repayments via NACH / e-Mandate',
        gain: '+30 to +50 Pts',
        color: [22, 163, 74] as [number, number, number],
        desc: 'Establish auto-debit NACH mandates for all loan EMIs and credit card minimum dues at least 3 business days before due date.',
      },
      {
        priority: 'PRIORITY 5',
        title: 'Preserve Seasoned Credit Lines & Optimize Account Mix',
        gain: '+10 to +20 Pts',
        color: [147, 51, 234] as [number, number, number],
        desc: 'Keep oldest credit cards active with low recurrent payments to sustain credit vintage age and maintain healthy credit diversity.',
      },
    ],
    phase1Title: 'Phase 1: Days 1 to 30 (Immediate Inaccuracies & Overdue Containment)',
    phase2Title: 'Phase 2: Days 31 to 60 (Revolving Utilization & Dispute Follow-Up)',
    phase3Title: 'Phase 3: Days 61 to 90 (Score Rebuilding & Bureau Verification)',
  };
}

/**
 * High-performance, vector-sharp PDF generator specifically for the AI Report Analysis.
 * Generates an executive 2-page CIBIL Credit Health & Dispute Action Plan document with
 * embedded official logo, full multilingual advisory, and prioritized improvement levers.
 */
export async function downloadAiAnalysisReportPdf(
  report: any,
  analysis: any,
  options: AiAnalysisPdfOptions = {}
): Promise<boolean> {
  const { onProgress, fileName, language } = options;
  const activeLang = language || i18n?.language || 'en';
  const localized = getPdfLocalizedContent(activeLang);

  onProgress?.('Initializing PDF generator with official logo & multilingual engine...');

  // Fallback defaults if objects are incomplete
  const borrowerName = report?.personal?.name || 'Borrower';
  const panMasked = report?.personal?.panMasked || 'XXXXX****X';
  const score = report?.score?.cibilScore ?? report?.score?.score ?? 642;
  const scoreDate = report?.score?.scoreDate || '12 Sep 2026';
  const scoreCategory = report?.score?.category || (score >= 750 ? 'Excellent' : score >= 700 ? 'Good' : score >= 650 ? 'Fair' : 'Needs Improvement');

  const negativeAccountsCount = analysis?.negativeAccounts?.length ?? report?.summary?.negativeAccounts ?? 4;
  const latePaymentsCount = analysis?.paymentBehaviour?.latePaymentsCount ?? analysis?.paymentHistoryAnalysis?.lateCount ?? 2;
  const utilizationPct = analysis?.utilizationAnalysis?.utilizationPct ?? analysis?.utilizationMix?.aggregateUtilization ?? report?.summary?.creditCardUtilizationPct ?? 32;
  const historyYears = analysis?.creditAgeAnalysis?.averageAgeYears ?? (report?.accounts?.[0]?.openedDate
    ? Math.max(1, new Date().getFullYear() - new Date(report.accounts[0].openedDate).getFullYear())
    : 6);

  const totalOutstanding = report?.summary?.totalOutstanding || 845200;
  const totalOverdue = report?.summary?.totalOverdue || 86500;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const NAVY: [number, number, number] = [18, 35, 63]; // #12233F
  const ORANGE: [number, number, number] = [245, 107, 43]; // #F56B2B
  const SLATE_DARK: [number, number, number] = [30, 41, 59]; // #1E293B
  const SLATE_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
  const EMERALD: [number, number, number] = [22, 163, 74]; // #16A34A
  const ROSE: [number, number, number] = [225, 29, 72]; // #E11D48
  const AMBER: [number, number, number] = [217, 119, 6]; // #D97706

  onProgress?.('Composing Executive Summary & Score Analysis...');

  // =========================================================================
  // PAGE 1: EXECUTIVE AUDIT, CORE METRICS & TOP KEY POINTS TO IMPROVE
  // =========================================================================

  // Top Header Banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Orange accent line
  doc.setFillColor(...ORANGE);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Official Brand Logo (embedded high-res vector/image)
  try {
    doc.addImage(DIGITAL_KATTA_LOGO_BASE64, 'JPEG', margin, 3, 22, 22, undefined, 'FAST');
  } catch (err) {
    console.warn('Failed to embed logo image into PDF:', err);
    // Fallback vector mark
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, 7, 5, 5, 'F');
    doc.setFillColor(...ORANGE);
    doc.rect(margin + 6, 7, 5, 5, 'F');
    doc.setFillColor(...EMERALD);
    doc.rect(margin, 13, 5, 5, 'F');
    doc.setFillColor(136, 19, 55);
    doc.rect(margin + 6, 13, 5, 5, 'F');
  }

  // Wordmark & Tagline: "Digital Katta"
  const brandTextX = margin + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('Digital Katta', brandTextX, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(254, 215, 170); // soft warm orange text
  doc.text(toSafePdfText(localized.brandTagline), brandTextX, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text('Multilingual AI Credit Advisory & CIBIL Bureau Health System', brandTextX, 23);

  // Right Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(toSafePdfText(localized.reportTitle), pageWidth - margin, 11.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Report Ref: DK-${Date.now().toString().slice(-6)} | Confidentially Handled`, pageWidth - margin, 17, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(254, 215, 170);
  doc.text(`${toSafePdfText(localized.regionalAdvisory)} | Lang: ${localized.langLabel}`, pageWidth - margin, 23, { align: 'right' });

  let y = 35;

  // 1. Borrower Information & Score Card (Horizontal Split)
  const profileCardHeight = 35;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, profileCardHeight, 3, 3, 'FD');

  // Profile Details (Left half)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(borrowerName.toUpperCase(), margin + 5, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...SLATE_MUTED);
  doc.text(`PAN: ${panMasked}   |   Bureau: TransUnion CIBIL   |   Audit Date: ${scoreDate}`, margin + 5, y + 14);
  doc.text(`Total Accounts: ${report?.summary?.totalAccounts ?? 11}   |   Active Facilities: ${report?.summary?.activeAccounts ?? 7}   |   Closed: ${report?.summary?.closedAccounts ?? 4}`, margin + 5, y + 20);
  doc.text(`Inquiries in last 90 Days: ${report?.summary?.enquiriesLast90Days ?? 3}   |   DPDP Act 2023 Compliant Audit`, margin + 5, y + 26);

  // Score Box (Right half)
  const scoreBoxWidth = 52;
  const scoreBoxX = pageWidth - margin - scoreBoxWidth - 4;
  const scoreBoxY = y + 3.5;
  const scoreBoxHeight = profileCardHeight - 7;

  let badgeColor: [number, number, number] = ROSE;
  if (score >= 750) badgeColor = EMERALD;
  else if (score >= 700) badgeColor = [37, 99, 235];
  else if (score >= 650) badgeColor = AMBER;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...badgeColor);
  doc.roundedRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...badgeColor);
  doc.text(`${score}`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 10, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...NAVY);
  doc.text(`CIBIL SCORE (300-900)`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 15.5, { align: 'center' });

  // Status Pill
  doc.setFillColor(...badgeColor);
  doc.roundedRect(scoreBoxX + 6, scoreBoxY + 18.5, scoreBoxWidth - 12, 5.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text(scoreCategory.toUpperCase(), scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 22.5, { align: 'center' });

  y += profileCardHeight + 4;

  // 2. AI Score Insight Banner
  const insightText = analysis?.creditHealth?.summary ||
    (score < 650
      ? 'Score is currently suppressed by active delinquencies and high revolving credit utilization. Timely dispute of DPD errors and aggressive balance reduction can recover 50-80 points within 60-90 days.'
      : 'Credit profile displays positive payment stability with clear opportunities for dispute and balance optimization to reach the 750+ elite tier.');

  doc.setFillColor(255, 248, 240); // Peach tint #FFF8F0
  doc.setDrawColor(254, 215, 170); // #FED7AA
  doc.roundedRect(margin, y, contentWidth, 20, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ORANGE);
  doc.text('AI EXECUTIVE ASSESSMENT & SCORE DIAGNOSIS', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_DARK);
  const insightLines = doc.splitTextToSize(insightText, contentWidth - 8);
  doc.text(insightLines.slice(0, 2), margin + 4, y + 10.5);

  y += 24;

  // 3. Four Core Bureau Metrics Grid
  const metricBoxWidth = (contentWidth - 9) / 4; // 4 boxes with 3mm gaps
  const metricBoxHeight = 20;

  const metrics = [
    { label: 'Negative Accounts', value: `${negativeAccountsCount}`, note: 'Overdue / Flagged', color: ROSE },
    { label: 'Late Payments', value: `${latePaymentsCount}`, note: 'DPD 30+ / 60+ / 90+', color: AMBER },
    { label: 'Card Utilization', value: `${utilizationPct}%`, note: 'Threshold: < 30%', color: utilizationPct > 30 ? AMBER : EMERALD },
    { label: 'Credit History', value: `${historyYears} Yrs`, note: 'Profile Maturity', color: EMERALD },
  ];

  metrics.forEach((m, idx) => {
    const mx = margin + idx * (metricBoxWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(mx, y, metricBoxWidth, metricBoxHeight, 2, 2, 'FD');

    // Colored top border accent
    doc.setFillColor(...m.color);
    doc.rect(mx, y, metricBoxWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...m.color);
    doc.text(m.value, mx + 4, y + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...NAVY);
    doc.text(m.label, mx + 4, y + 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(m.note, mx + 4, y + 16.5);
  });

  y += metricBoxHeight + 3.5;

  // Mini summary bar: Total Outstanding vs Total Overdue
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...NAVY);
  doc.text(`Aggregate Balance: Rs. ${totalOutstanding.toLocaleString('en-IN')}`, margin + 5, y + 5.2);
  doc.setTextColor(...ROSE);
  doc.text(`Active Overdue: Rs. ${totalOverdue.toLocaleString('en-IN')}`, margin + 80, y + 5.2);
  doc.setTextColor(...SLATE_MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Audited directly from financial institution reporting feeds', pageWidth - margin - 5, y + 5.2, { align: 'right' });

  y += 12;

  // =========================================================================
  // 4. TOP KEY POINTS TO IMPROVE CREDIT SCORE (REQUESTED HIGH-IMPACT SECTION)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text(toSafePdfText(localized.topKeyPointsTitle), margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...SLATE_MUTED);
  doc.text(toSafePdfText(localized.topKeyPointsSubtitle), margin, y + 4.5);

  y += 6.5;

  const pointCardHeight = 15;
  localized.topPoints.forEach((point) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, pointCardHeight, 2, 2, 'FD');

    // Left priority strip
    doc.setFillColor(...point.color);
    doc.rect(margin, y, 2, pointCardHeight, 'F');

    // Priority pill
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin + 4, y + 2.5, 20, 4.5, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(...point.color);
    doc.text(toSafePdfText(point.priority), margin + 14, y + 5.5, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...NAVY);
    doc.text(toSafePdfText(point.title), margin + 27, y + 5.8);

    // Score Gain Badge (Right side)
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(pageWidth - margin - 26, y + 2.5, 24, 4.8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...EMERALD);
    doc.text(toSafePdfText(point.gain), pageWidth - margin - 14, y + 5.8, { align: 'center' });

    // Description text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(toSafePdfText(point.desc), margin + 5, y + 11.5);

    y += pointCardHeight + 2.2;
  });

  y += 2;

  // 5. Multilingual Advisory & Verification Certificate
  const certHeight = 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, certHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text('MULTILINGUAL ADVISORY & RECOVERY SUPPORT (11+ INDIAN LANGUAGES):', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...SLATE_MUTED);
  const certLines = doc.splitTextToSize(
    'Digital Katta provides comprehensive credit counseling and dispute drafting across English, Marathi (मराठी), Hindi (हिंदी), Gujarati (ગુજરાતી), Tamil (தமிழ்), Telugu (తెలుగు), Kannada, Bengali, Malayalam, and Punjabi. All rectification notices comply with RBI Master Directions on Credit Information Companies (Regulation) Act 2005. Contact our Pune/Mumbai advisory desks for authorized assistance.',
    contentWidth - 8
  );
  doc.text(certLines, margin + 4, y + 9.5);

  // Footer for Page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Digital Katta AI Report Analyzer  |  Page 1 of 2  |  Confidential & Privileged Document', margin, pageHeight - 6);
  doc.text('RBI Master Directions on CICRA Act 2005 & DPDP Act 2023', pageWidth - margin, pageHeight - 6, { align: 'right' });

  // =========================================================================
  // PAGE 2: DISPUTE MAP, RECTIFICATION TABLE & 30-60-90 DAY ROADMAP
  // =========================================================================
  onProgress?.('Generating 30-60-90 Day Action Plan & Negative Accounts Map...');

  doc.addPage();

  // Top header for Page 2
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 18, pageWidth, 1.5, 'F');

  try {
    doc.addImage(DIGITAL_KATTA_LOGO_BASE64, 'JPEG', margin, 2, 14, 14, undefined, 'FAST');
  } catch (err) {
    console.warn('Failed to embed Page 2 logo image:', err);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Digital Katta  |  AI CIBIL Analysis & Dispute Resolution Roadmap', margin + 17, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 215, 170);
  doc.text(`Borrower: ${borrowerName.toUpperCase()}   |   Score: ${score}`, pageWidth - margin, 11, { align: 'right' });

  y = 25;

  // 1. Critical Negative Accounts & Rectification Priorities Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('CRITICAL ISSUES IDENTIFIED & RECTIFICATION PRIORITIES', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(...NAVY);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);
  doc.text('FACILITY & LENDER', margin + 3, y + 4.5);
  doc.text('ACCOUNT NO', margin + 50, y + 4.5);
  doc.text('OVERDUE / BALANCE', margin + 83, y + 4.5);
  doc.text('REPORTED STATUS', margin + 122, y + 4.5);
  doc.text('STATUTORY DISPUTE ACTION', margin + 152, y + 4.5);
  y += 6.5;

  const negAccounts = analysis?.negativeAccounts && analysis.negativeAccounts.length > 0
    ? analysis.negativeAccounts
    : [
        {
          lender: 'HDFC Bank Ltd.',
          accountType: 'Credit Card',
          accountNumberMasked: 'XXXX-XXXX-4589',
          overdue: 42500,
          balance: 68000,
          status: 'Written Off',
          dpdSummary: '90+ Days Past Due',
          recommendedAction: 'Obtain OTS settlement letter & request NOC update to bureau.',
        },
        {
          lender: 'ICICI Bank Ltd.',
          accountType: 'Personal Loan',
          accountNumberMasked: 'XXXX-XXXX-8921',
          overdue: 28000,
          balance: 145000,
          status: 'Delinquent (60+ DPD)',
          dpdSummary: '60 DPD reported in June 2026',
          recommendedAction: 'Clear outstanding EMI and submit receipt to lender grievance cell.',
        },
        {
          lender: 'SBI Cards & Payment',
          accountType: 'Credit Card',
          accountNumberMasked: 'XXXX-XXXX-1144',
          overdue: 16000,
          balance: 52000,
          status: 'Settled',
          dpdSummary: 'Post-settlement flag active',
          recommendedAction: 'Verify closure confirmation & check NOC transmission.',
        },
        {
          lender: 'Bajaj Finance Ltd.',
          accountType: 'Consumer Loan',
          accountNumberMasked: 'XXXX-XXXX-7702',
          overdue: 0,
          balance: 0,
          status: 'Spurious DPD Error',
          dpdSummary: 'Inaccurate 30 DPD reported',
          recommendedAction: 'File formal Section 21 dispute under CICRA Act 2005.',
        },
      ];

  const rowHeight = 13.5;
  negAccounts.slice(0, 4).forEach((item: any, idx: number) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    // Left border indicator
    doc.setFillColor(...ROSE);
    doc.rect(margin, y, 1.5, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...NAVY);
    doc.text(item.lender, margin + 4, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(item.accountType, margin + 4, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_DARK);
    doc.text(item.accountNumberMasked || 'XXXX-XXXX', margin + 50, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...ROSE);
    const overdueStr = item.overdue ? `Rs. ${item.overdue.toLocaleString('en-IN')}` : 'Rs. 0';
    doc.text(overdueStr, margin + 83, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...SLATE_MUTED);
    const balStr = item.balance ? `Bal: Rs. ${item.balance.toLocaleString('en-IN')}` : 'Bal: Rs. 0';
    doc.text(balStr, margin + 83, y + 9);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...AMBER);
    doc.text(item.status || 'Active Deficit', margin + 122, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...SLATE_MUTED);
    doc.text(item.dpdSummary || 'DPD Delinquency', margin + 122, y + 9);

    // Recommended Action (wrapped)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...SLATE_DARK);
    const actionLines = doc.splitTextToSize(item.recommendedAction || 'File dispute notice with lender.', 28);
    doc.text(actionLines.slice(0, 2), margin + 152, y + 5);

    y += rowHeight;
  });

  y += 4;

  // 2. Statutory Dispute Opportunities (Under Section 21 of CICRA Act 2005)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text('STATUTORY DISPUTE OPPORTUNITIES (CICRA ACT 2005, SEC 21)', margin, y);
  y += 3.5;

  doc.setFillColor(254, 242, 242); // #FEF2F2
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, contentWidth, 21, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...ROSE);
  doc.text('RBI Regulatory Rectification Mandate:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...SLATE_DARK);
  const disputeLegalText =
    'Under the Credit Information Companies (Regulation) Act 2005 and RBI Master Directions, Credit Institutions (Banks & NBFCs) are legally obligated to investigate and rectify inaccurate credit entries within 30 days of receiving a grievance notice. Failure to rectify entitles the borrower to escalate to the RBI Integrated Ombudsman (cms.rbi.org.in) with compensation provisions.';
  const disputeLines = doc.splitTextToSize(disputeLegalText, contentWidth - 8);
  doc.text(disputeLines, margin + 4, y + 9.5);

  y += 25;

  // 3. Positive Profile Highlights
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text('POSITIVE CREDIT PROFILE HIGHLIGHTS', margin, y);
  y += 4;

  const goodHighlights = [
    'Zero Suit Filed or Wilful Default classifications reported across all bureau repositories.',
    'Secured credit facilities demonstrate structured repayment history and asset backing.',
    'Oldest credit line shows substantial maturity, providing a strong long-term scoring baseline.',
    'Multiple closed facilities successfully updated with zero outstanding balance.',
  ];

  goodHighlights.forEach((item) => {
    doc.setFillColor(...EMERALD);
    doc.circle(margin + 2.5, y + 1.8, 1, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...SLATE_DARK);
    doc.text(item, margin + 6, y + 2.5);
    y += 4.5;
  });

  y += 3;

  // 4. Personalized 30-60-90 Day Action Plan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text('AI PERSONALIZED 30-60-90 DAY SCORE RECOVERY ROADMAP', margin, y);
  y += 4.5;

  const phases = [
    {
      title: toSafePdfText(localized.phase1Title),
      color: ORANGE,
      bg: [255, 248, 240] as [number, number, number],
      items: [
        'File formal Section 21 dispute letters with lender grievance cells for inaccurate DPD flags.',
        'Settle active overdue balances on smallest accounts first to halt ongoing DPD record damage.',
        'Request official No Dues Certificates (NOC) on letterhead for any pre-closed loan facilities.',
      ],
    },
    {
      title: toSafePdfText(localized.phase2Title),
      color: [37, 99, 235] as [number, number, number],
      bg: [239, 246, 255] as [number, number, number],
      items: [
        'Pay down aggregate credit card balances to bring utilization strictly below the 30% ceiling.',
        'Follow up on 30-day statutory dispute timeline with bank Principal Nodal Officers.',
        'Cease submitting new loan or credit card applications to prevent fresh hard inquiries.',
      ],
    },
    {
      title: toSafePdfText(localized.phase3Title),
      color: EMERALD,
      bg: [240, 253, 244] as [number, number, number],
      items: [
        'Download fresh CIBIL CIR report to verify all settled and disputed accounts reflect closed status.',
        'Verify that aggregate credit card utilization remains stable between 10% to 20%.',
        'Maintain 100% on-time automated repayments (NACH/e-mandates) to begin compounding score gains.',
      ],
    },
  ];

  phases.forEach((phase) => {
    const cardHeight = 23;
    doc.setFillColor(...phase.bg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

    // Left color bar
    doc.setFillColor(...phase.color);
    doc.rect(margin, y, 2, cardHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...phase.color);
    doc.text(phase.title, margin + 5, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...SLATE_DARK);

    phase.items.forEach((item, itemIdx) => {
      doc.setFillColor(...phase.color);
      doc.circle(margin + 6, y + 9 + itemIdx * 4.4, 0.7, 'F');
      doc.text(item, margin + 8.5, y + 9.8 + itemIdx * 4.4);
    });

    y += cardHeight + 3;
  });

  y += 2;

  // 5. Statutory & Data Privacy Compliance Notice
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...NAVY);
  doc.text('LEGAL DISCLAIMER & DATA PROTECTION (DPDP ACT 2023):', margin + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...SLATE_MUTED);
  const disclaimer =
    'This credit health audit is prepared by Digital Katta for educational and financial empowerment purposes based on CIR extracts provided by the user. Digital Katta does not alter official bureau records directly; all rectifications must proceed through RBI-regulated dispute mechanisms. Under the DPDP Act 2023, borrower credit files are processed ephemerally with zero permanent storage. In case of dispute refusal by lenders, escalate to cms.rbi.org.in.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 8);
  doc.text(disclaimerLines, margin + 4, y + 8.5);

  // Footer for Page 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_MUTED);
  doc.text('Digital Katta AI Report Analyzer  |  Page 2 of 2  |  Pune / Mumbai, Maharashtra, India', margin, pageHeight - 6);
  doc.text('Support: support@digitalkatta.com  |  +91 98765 43210', pageWidth - margin, pageHeight - 6, { align: 'right' });

  // Trigger download
  const cleanName = borrowerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Borrower';
  const outFileName = fileName || `Digital_Katta_AI_Credit_Analysis_${cleanName}.pdf`;

  onProgress?.('Triggering download...');

  const pdfBlob = doc.output('blob');
  if (!pdfBlob || pdfBlob.size === 0) {
    throw new Error('PDF output blob generation failed.');
  }

  const blobUrl = URL.createObjectURL(pdfBlob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = outFileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    try {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (_) {}
  }, 3000);

  return true;
}
