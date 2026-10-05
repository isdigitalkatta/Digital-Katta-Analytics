import type { NormalizedCreditReport } from '../../src/types.js';

/**
 * Supported Indian Credit Bureaus
 */
export enum BureauName {
  CIBIL = 'CIBIL',
  EXPERIAN = 'EXPERIAN',
  CRIF = 'CRIF',
  EQUIFAX = 'EQUIFAX',
}

export type BureauNameString = 'CIBIL' | 'EXPERIAN' | 'CRIF' | 'EQUIFAX';

export interface BureauPullRequest {
  userId: string;
  name: string;
  pan: string;
  dob: string; // YYYY-MM-DD
  mobile: string;
  consentAccepted: true;
  consentTextVersion: string;
  otpVerified: boolean;
  purpose: 'CONSUMER_SELF_VIEW'; // advisory, not lending hard pull
  bureau?: BureauName | BureauNameString; // default CIBIL
}

export type ErrorCode =
  | 'NOT_CONFIGURED'
  | 'CONSENT_REQUIRED'
  | 'OTP_REQUIRED'
  | 'VENDOR_ERROR'
  | 'PARSE_FAILED';

export type BureauErrorCode = ErrorCode;

export interface BureauPullResult {
  ok: boolean;
  providerName: string;
  bureau: BureauName | BureauNameString;
  score?: number;
  pdfBase64?: string;
  rawJson?: unknown;
  normalized?: NormalizedCreditReport;
  vendorRef?: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
}

export interface ConsentRecord {
  userId: string;
  panMasked: string;
  mobileMasked: string;
  consentTimestamp: string;
  ipAddress?: string;
  userAgent?: string;
  consentTextVersion: string;
  purpose: 'CONSUMER_SELF_VIEW';
  bureau: BureauName | BureauNameString;
}

export interface CreditBureauProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  pullReport(req: BureauPullRequest): Promise<BureauPullResult>;
}

export interface FileUploadProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  processUploadedFile(
    fileBuffer: Buffer | string,
    fileName: string,
    mimeType?: string
  ): Promise<BureauPullResult>;
}

export interface CreditProvider {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  pullReport?(req: BureauPullRequest): Promise<BureauPullResult>;
  processUploadedFile?(
    fileBuffer: Buffer | string,
    fileName: string,
    mimeType?: string
  ): Promise<BureauPullResult>;
}

export type CreditProviderMode = 'live' | 'mock' | 'upload' | 'auto';
