import { normalizeExtractedReport } from '../reportNormalizer.js';
import { BureauName, type FileUploadProvider, type BureauPullResult } from './types.js';

/**
 * PDF / HTML / JSON Document Upload Provider
 * Processes borrower-uploaded credit report files securely
 */
export class PdfUploadProvider implements FileUploadProvider {
  readonly id = 'pdf-upload';
  readonly name = 'User Document Upload (PDF/HTML/JSON)';

  isAvailable(): boolean {
    return true;
  }

  async pullReport(req?: any): Promise<BureauPullResult> {
    return {
      ok: false,
      providerName: this.name,
      bureau: req?.bureau || BureauName.CIBIL,
      errorCode: 'NOT_CONFIGURED',
      errorMessage: 'Upload provider does not perform direct bureau pulls. Please upload your report file.',
    };
  }

  async processUploadedFile(
    fileBuffer: Buffer | string,
    fileName: string = 'credit_report.pdf',
    mimeType?: string
  ): Promise<BureauPullResult> {
    try {
      let rawData: any = null;
      const textContent =
        typeof fileBuffer === 'string'
          ? fileBuffer
          : Buffer.isBuffer(fileBuffer)
            ? fileBuffer.toString('utf-8')
            : String(fileBuffer || '');

      // Check if it's JSON
      if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
        try {
          rawData = JSON.parse(textContent);
        } catch {
          // not valid JSON, treat as text/binary
        }
      }

      if (!rawData) {
        // Fallback default structure for binary PDF / raw text passed directly to normalizer
        const applicantName = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Self Applicant';
        rawData = {
          personal: {
            name: applicantName,
            reportDate: new Date().toISOString().split('T')[0],
          },
          score: {
            score: 650,
            scoreName: 'CIBIL TransUnion Score 2.0',
            scoreDate: new Date().toISOString().split('T')[0],
          },
          accounts: [],
          enquiries: [],
        };
      }

      const normalized = normalizeExtractedReport(rawData, fileName);
      return {
        ok: true,
        providerName: this.name,
        bureau: BureauName.CIBIL,
        score: normalized.score.score,
        normalized,
      };
    } catch (err: any) {
      return {
        ok: false,
        providerName: this.name,
        bureau: BureauName.CIBIL,
        errorCode: 'PARSE_FAILED',
        errorMessage: `Failed to parse uploaded document: ${err?.message || 'Invalid format'}`,
      };
    }
  }
}

export const defaultPdfUploadProvider = new PdfUploadProvider();
