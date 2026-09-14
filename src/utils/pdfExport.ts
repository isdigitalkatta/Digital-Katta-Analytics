import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfExportOptions {
  fileName?: string;
  onProgress?: (status: string) => void;
}

/**
 * Direct client-side PDF generator using html2canvas and jsPDF.
 * Bypasses browser print dialog restrictions and sandbox iframe blocks.
 */
export async function exportReportToPdf(
  elementId: string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Report container element #${elementId} was not found in document.`);
  }

  options.onProgress?.('Preparing high-resolution snapshot...');

  // Scroll to top of container to avoid offset distortions
  const currentScroll = window.scrollY;
  window.scrollTo(0, 0);

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for crisp text & badges
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(elementId);
        if (clonedEl) {
          clonedEl.style.width = '960px';
          clonedEl.style.maxWidth = '960px';
          clonedEl.style.margin = '0 auto';
          clonedEl.style.padding = '24px';
          clonedEl.style.borderRadius = '0px';
          clonedEl.style.border = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.backgroundColor = '#ffffff';

          // Ensure all text and borders inside cloned element render sharply
          const allText = clonedEl.querySelectorAll('*');
          allText.forEach((node) => {
            const el = node as HTMLElement;
            if (el.style) {
              el.style.setProperty('-webkit-print-color-adjust', 'exact');
              el.style.setProperty('print-color-adjust', 'exact');
            }
          });
        }
      },
    });

    options.onProgress?.('Formatting A4 PDF document...');

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const margin = 10; // 10 mm margins
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= pageHeight - margin * 2;

    // Subsequent pages
    while (heightLeft > 0) {
      position = margin - (contentHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;
    }

    const outputName = options.fileName || 'Digital_Katta_Credit_Health_Report.pdf';
    options.onProgress?.('Downloading PDF file...');
    pdf.save(outputName);

    return true;
  } finally {
    window.scrollTo(0, currentScroll);
  }
}

/**
 * Robust document printing helper with iframe isolation and sandbox fallback
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
                  margin: 12mm;
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
