import {
  BureauName,
  type BureauNameString,
  type BureauPullRequest,
  type BureauPullResult,
  type BureauErrorCode,
  type ErrorCode,
  type CreditBureauProvider,
  type FileUploadProvider,
  type CreditProvider,
  type CreditProviderMode,
  type ConsentRecord,
} from './types.js';

import {
  ConsumerBureauProvider,
  defaultConsumerBureauProvider,
} from './consumerBureauProvider.js';

import {
  MockBureauProvider,
  defaultMockBureauProvider,
} from './mockBureauProvider.js';

import {
  PdfUploadProvider,
  defaultPdfUploadProvider,
} from './pdfUploadProvider.js';

// Re-export all types, interfaces and enum
export {
  BureauName,
  type BureauNameString,
  type BureauPullRequest,
  type BureauPullResult,
  type BureauErrorCode,
  type ErrorCode,
  type CreditBureauProvider,
  type FileUploadProvider,
  type CreditProvider,
  type CreditProviderMode,
  type ConsentRecord,
};

export {
  ConsumerBureauProvider,
  MockBureauProvider,
  PdfUploadProvider,
  defaultConsumerBureauProvider,
  defaultMockBureauProvider,
  defaultPdfUploadProvider,
};

/**
 * Checks if live bureau integration is fully configured and ready
 */
export function isLiveBureauConfigured(): boolean {
  const isEnabled = process.env.BUREAU_PROVIDER_ENABLED === 'true';
  const hasBaseUrl = Boolean(process.env.BUREAU_API_BASE_URL?.trim());
  const hasApiKey = Boolean(process.env.BUREAU_API_KEY?.trim());
  return isEnabled && hasBaseUrl && hasApiKey;
}

/**
 * Universal Credit Provider Factory Function
 * Switches between mock, file-upload, and live providers based on
 * BUREAU_PROVIDER_ENABLED and BUREAU_PROVIDER_MODE environment variables.
 *
 * Selection rules:
 * 1. Explicit parameter or BUREAU_PROVIDER_MODE === 'upload':
 *    -> PdfUploadProvider
 * 2. Explicit parameter or BUREAU_PROVIDER_MODE === 'mock' / 'sandbox' or USE_MOCK_BUREAU === 'true':
 *    -> MockBureauProvider (deterministic sandbox)
 * 3. Explicit parameter or BUREAU_PROVIDER_MODE === 'live':
 *    -> ConsumerBureauProvider (live partner gateway)
 * 4. Auto / default evaluation:
 *    -> If BUREAU_PROVIDER_ENABLED === 'true' and credentials set: ConsumerBureauProvider
 *    -> Otherwise: ConsumerBureauProvider (which responds gracefully with NOT_CONFIGURED code
 *       and message: "Official pull is not connected. Upload your CIBIL PDF instead.")
 */
export function getCreditProvider(
  mode?: CreditProviderMode
): CreditBureauProvider | FileUploadProvider {
  const envMode = (process.env.BUREAU_PROVIDER_MODE || '').trim().toLowerCase();
  const effectiveMode = (mode || envMode || 'auto').toLowerCase();

  // 1. Upload mode
  if (effectiveMode === 'upload') {
    return defaultPdfUploadProvider;
  }

  // 2. Mock / sandbox mode
  if (
    effectiveMode === 'mock' ||
    effectiveMode === 'sandbox' ||
    process.env.USE_MOCK_BUREAU === 'true'
  ) {
    return defaultMockBureauProvider;
  }

  // 3. Live bureau mode
  if (effectiveMode === 'live') {
    return defaultConsumerBureauProvider;
  }

  // 4. Auto mode: check BUREAU_PROVIDER_ENABLED and credentials
  const isEnabled = process.env.BUREAU_PROVIDER_ENABLED === 'true';
  if (isEnabled && isLiveBureauConfigured()) {
    return defaultConsumerBureauProvider;
  }

  // Default fallback when bureau pull is attempted but live integration is not enabled/configured:
  // ConsumerBureauProvider returns NOT_CONFIGURED with the required clear UI guidance
  return defaultConsumerBureauProvider;
}

/**
 * Bureau provider factory alias specifically for bureau pulls
 */
export function getBureauProvider(mode?: CreditProviderMode): CreditBureauProvider {
  const provider = getCreditProvider(mode);
  if ('pullReport' in provider && typeof provider.pullReport === 'function') {
    return provider as CreditBureauProvider;
  }
  return defaultConsumerBureauProvider;
}

/**
 * Helper to get the document upload provider
 */
export function getFileUploadProvider(): FileUploadProvider {
  return defaultPdfUploadProvider;
}

/**
 * Alias for factory function
 */
export const createCreditProvider = getCreditProvider;
