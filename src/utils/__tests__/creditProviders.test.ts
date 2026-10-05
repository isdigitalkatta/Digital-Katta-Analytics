import {
  BureauName,
  getCreditProvider,
  getBureauProvider,
  getFileUploadProvider,
  isLiveBureauConfigured,
  type BureauPullRequest,
  type BureauPullResult,
} from '../../../server/creditProviders/index.js';

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName}`);
    process.exit(1);
  }
}

async function runCreditProviderTests() {
  console.log('\n=== Testing Credit Provider Abstraction ===');

  // 1. Enum values
  assert(BureauName.CIBIL === 'CIBIL', 'BureauName.CIBIL is "CIBIL"');
  assert(BureauName.EXPERIAN === 'EXPERIAN', 'BureauName.EXPERIAN is "EXPERIAN"');
  assert(BureauName.CRIF === 'CRIF', 'BureauName.CRIF is "CRIF"');
  assert(BureauName.EQUIFAX === 'EQUIFAX', 'BureauName.EQUIFAX is "EQUIFAX"');

  // 2. Factory switching with explicit mode
  const uploadProvider = getCreditProvider('upload');
  assert(uploadProvider.id === 'pdf-upload', 'Explicit upload mode returns PdfUploadProvider');

  const mockProvider = getCreditProvider('mock');
  assert(mockProvider.id === 'mock-bureau', 'Explicit mock mode returns MockBureauProvider');

  const liveProvider = getCreditProvider('live');
  assert(liveProvider.id === 'consumer-bureau', 'Explicit live mode returns ConsumerBureauProvider');

  // 3. Factory switching with environment variables
  const prevMode = process.env.BUREAU_PROVIDER_MODE;
  const prevEnabled = process.env.BUREAU_PROVIDER_ENABLED;
  const prevUrl = process.env.BUREAU_API_BASE_URL;
  const prevKey = process.env.BUREAU_API_KEY;

  try {
    // Mode = mock
    process.env.BUREAU_PROVIDER_MODE = 'mock';
    const envMock = getCreditProvider();
    assert(envMock.id === 'mock-bureau', 'BUREAU_PROVIDER_MODE="mock" selects MockBureauProvider');

    // Mode = upload
    process.env.BUREAU_PROVIDER_MODE = 'upload';
    const envUpload = getCreditProvider();
    assert(envUpload.id === 'pdf-upload', 'BUREAU_PROVIDER_MODE="upload" selects PdfUploadProvider');

    // Auto with live configured
    delete process.env.BUREAU_PROVIDER_MODE;
    process.env.BUREAU_PROVIDER_ENABLED = 'true';
    process.env.BUREAU_API_BASE_URL = 'https://api.bureau-gateway.internal';
    process.env.BUREAU_API_KEY = 'secret-key-123';
    assert(isLiveBureauConfigured() === true, 'isLiveBureauConfigured() returns true when vars set');
    const liveConfigured = getCreditProvider();
    assert(liveConfigured.id === 'consumer-bureau', 'Enabled + configured selects ConsumerBureauProvider');

    // Auto without configuration -> returns ConsumerBureauProvider which enforces NOT_CONFIGURED
    process.env.BUREAU_PROVIDER_ENABLED = 'false';
    delete process.env.BUREAU_API_BASE_URL;
    delete process.env.BUREAU_API_KEY;
    const notConfiguredProvider = getBureauProvider();
    assert(notConfiguredProvider.id === 'consumer-bureau', 'Unconfigured bureau defaults to ConsumerBureauProvider');

    const result = await notConfiguredProvider.pullReport({
      userId: 'test-user',
      name: 'Test Borrower',
      pan: 'ABCDE1234F',
      dob: '1990-01-01',
      mobile: '9876543210',
      consentAccepted: true,
      consentTextVersion: '1.0',
      otpVerified: true,
      purpose: 'CONSUMER_SELF_VIEW',
      bureau: BureauName.CIBIL,
    });
    assert(result.ok === false, 'Unconfigured pull returns ok=false');
    assert(result.errorCode === 'NOT_CONFIGURED', 'Unconfigured pull returns NOT_CONFIGURED error code');
    assert(
      result.errorMessage === 'Official pull is not connected. Upload your CIBIL PDF instead.',
      'Unconfigured pull returns exact fallback UI instruction message'
    );

    // Mock provider pulls successfully with consent & OTP
    const mockBureau = getBureauProvider('mock');
    const mockPullResult = await mockBureau.pullReport({
      userId: 'test-user-2',
      name: 'Demo Borrower',
      pan: 'ABCDE1234F',
      dob: '1988-05-15',
      mobile: '9876543210',
      consentAccepted: true,
      consentTextVersion: '1.0',
      otpVerified: true,
      purpose: 'CONSUMER_SELF_VIEW',
      bureau: BureauName.CIBIL,
    });
    assert(mockPullResult.ok === true, 'Mock provider pull succeeds');
    assert(typeof mockPullResult.score === 'number', 'Mock pull returns numeric score');
    assert(Boolean(mockPullResult.normalized), 'Mock pull returns NormalizedCreditReport');

    console.log('✓ All credit provider tests passed successfully!\n');
  } finally {
    process.env.BUREAU_PROVIDER_MODE = prevMode;
    process.env.BUREAU_PROVIDER_ENABLED = prevEnabled;
    process.env.BUREAU_API_BASE_URL = prevUrl;
    process.env.BUREAU_API_KEY = prevKey;
  }
}

runCreditProviderTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
