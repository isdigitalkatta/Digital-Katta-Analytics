import 'regenerator-runtime/runtime.js';
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import { NormalizedCreditReport, AIAnalysisResult } from '../src/types.js';

// Mapping of language codes to installed Noto TrueType font paths
const SCRIPT_FONT_MAP: Record<string, { regular: string; bold?: string }> = {
  hi: { regular: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf' },
  mr: { regular: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf' },
  ne: { regular: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf' },
  bn: { regular: '/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf' },
  as: { regular: '/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf' },
  gu: { regular: '/usr/share/fonts/truetype/noto/NotoSansGujarati-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansGujarati-Bold.ttf' },
  ta: { regular: '/usr/share/fonts/truetype/noto/NotoSansTamil-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansTamil-Bold.ttf' },
  te: { regular: '/usr/share/fonts/truetype/noto/NotoSansTelugu-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansTelugu-Bold.ttf' },
  kn: { regular: '/usr/share/fonts/truetype/noto/NotoSansKannada-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansKannada-Bold.ttf' },
  ml: { regular: '/usr/share/fonts/truetype/noto/NotoSansMalayalam-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansMalayalam-Bold.ttf' },
  pa: { regular: '/usr/share/fonts/truetype/noto/NotoSansGurmukhi-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansGurmukhi-Bold.ttf' },
  or: { regular: '/usr/share/fonts/truetype/noto/NotoSansOriya-Regular.ttf', bold: '/usr/share/fonts/truetype/noto/NotoSansOriya-Bold.ttf' },
};

// Multilingual labels for PDF generation
const PDF_LABELS: Record<string, Record<string, string>> = {
  en: {
    dossierTitle: 'DIGITAL KATTA CREDIT HEALTH DOSSIER',
    dossierSubtitle: 'AI-Powered Indian CIBIL & Credit Bureau Diagnostic Report | Zero-Retention Verified',
    borrowerParticulars: 'BORROWER PARTICULARS',
    creditScore: 'CIBIL CREDIT SCORE',
    portfolioSnapshot: 'CREDIT PORTFOLIO SNAPSHOT',
    totalAccounts: 'Total Accounts',
    activeOverdue: 'Active Overdue',
    totalBalance: 'Total Balance',
    utilization: 'Credit Card Utilization',
    executiveSummary: 'EXECUTIVE DIAGNOSTIC SUMMARY',
    criticalIssues: 'CRITICAL RED FLAGS IDENTIFIED',
    negativeAccounts: 'NEGATIVE & DELINQUENT ACCOUNTS',
    disputeOpportunities: 'POTENTIAL DISPUTE OPPORTUNITIES',
    actionRoadmap: 'TARGETED 30 / 60 / 90-DAY ACTION ROADMAP',
    statutoryNotice: 'STATUTORY REGULATORY & DATA PROTECTION NOTICE',
    disclaimer: 'Informational only - not affiliated with CIBIL/TransUnion/Experian/Equifax/CRIF or the Reserve Bank of India (RBI). Complies with DPDP Act 2023 with zero permanent server-side retention.',
    pageFooter: 'Informational only - not affiliated with CIBIL/TransUnion/RBI',
    problem: 'Problem',
    recommendation: 'Recommended Action',
    immediateAction: 'Immediate Action',
    evidence: 'Evidence to Provide',
    route: 'Channel',
  },
  hi: {
    dossierTitle: 'डिजिटल कट्टा क्रेडिट हेल्थ रिपोर्ट',
    dossierSubtitle: 'एआई-संचालित भारतीय सिबिल क्रेडिट विश्लेषण रिपोर्ट | शून्य डेटा प्रतिधारण',
    borrowerParticulars: 'उधारकर्ता का विवरण',
    creditScore: 'सिबिल क्रेडिट स्कोर',
    portfolioSnapshot: 'क्रेडिट पोर्टफोलियो स्नैपशॉट',
    totalAccounts: 'कुल खाते',
    activeOverdue: 'सक्रिय बकाया राशि',
    totalBalance: 'कुल शेष राशि',
    utilization: 'क्रेडिट कार्ड उपयोग',
    executiveSummary: 'मुख्य डायग्नोस्टिक सारांश',
    criticalIssues: 'पहचाने गए गंभीर मुद्दे',
    negativeAccounts: 'नकारात्मक और डिफ़ॉल्ट खाते',
    disputeOpportunities: 'संभावित विवाद एवं सुधार के अवसर',
    actionRoadmap: '30 / 60 / 90-दिवसीय सुधार कार्य योजना',
    statutoryNotice: 'वैधानिक विनियामक और डेटा सुरक्षा सूचना',
    disclaimer: 'केवल सूचनात्मक उद्देश्य के लिए - सिबिल/आरबीआई से संबद्ध नहीं। डीपीडीपी अधिनियम 2023 के अनुरूप शून्य डेटा प्रतिधारण।',
    pageFooter: 'केवल सूचनात्मक - सिबिल/आरबीआई से कोई आधिकारिक संबंध नहीं',
    problem: 'समस्या',
    recommendation: 'सुझाई गई कार्रवाई',
    immediateAction: 'तत्काल कार्रवाई',
    evidence: 'प्रस्तुत करने योग्य प्रमाण',
    route: 'माध्यम',
  },
  mr: {
    dossierTitle: 'डिजिटल कट्टा क्रेडिट आरोग्य अहवाल',
    dossierSubtitle: 'एआय-आधारित भारतीय सिबिल क्रेडिट विश्लेषण अहवाल | शून्य डेटा धारणा',
    borrowerParticulars: 'कर्जदाराचा तपशील',
    creditScore: 'सिबिल क्रेडिट स्कोअर',
    portfolioSnapshot: 'क्रेडिट पोर्टफोलिओ स्नॅपशॉट',
    totalAccounts: 'एकूण खाती',
    activeOverdue: 'सक्रिय थकित रक्कम',
    totalBalance: 'एकूण बाकी रक्कम',
    utilization: 'क्रेडिट कार्ड वापर',
    executiveSummary: 'कार्यकारी निदान सारांश',
    criticalIssues: 'ओळखल्या गेलेल्या गंभीर त्रुटी',
    negativeAccounts: 'नकारात्मक आणि थकित खाती',
    disputeOpportunities: 'संभाव्य तक्रार व दुरुस्तीच्या संधी',
    actionRoadmap: '३० / ६० / ९०-दिवसीय कृती आराखडा',
    statutoryNotice: 'वैधानिक नियामक आणि डेटा संरक्षण सूचना',
    disclaimer: 'केवळ माहितीच्या उद्देशाने - सिबिल/आरबीआयशी संलग्न नाही. डीपीडीपी कायदा २०२३ नुसार डेटा सुरक्षित.',
    pageFooter: 'केवळ माहितीसाठी - सिबिल/आरबीआयशी अधिकृत संलग्नता नाही',
    problem: 'समस्या',
    recommendation: 'शिफारस केलेली कृती',
    immediateAction: 'तातडीची कृती',
    evidence: 'सादर करावयाचा पुरावा',
    route: 'मार्ग',
  },
  gu: {
    dossierTitle: 'ડિજિટલ કટ્ટા ક્રેડિટ હેલ્થ રિપોર્ટ',
    dossierSubtitle: 'એઆઈ-સંચાલિત સિબિલ વિશ્લેષણ અહેવાલ | ઝીરો ડેટા રિટેન્શન',
    borrowerParticulars: 'ઉધારકર્તાની વિગતો',
    creditScore: 'સિબિલ ક્રેડિટ સ્કોર',
    portfolioSnapshot: 'ક્રેડિટ પોર્ટફોલિયો સારાંશ',
    totalAccounts: 'કુલ ખાતાઓ',
    activeOverdue: 'સક્રિય બાકી રકમ',
    totalBalance: 'કુલ બાકી રકમ',
    utilization: 'ક્રેડિટ કાર્ડ વપરાશ',
    executiveSummary: 'મુખ્ય વિશ્લેષણ સારાંશ',
    criticalIssues: 'ઓળખાયેલી ગંભીર સમસ્યાઓ',
    negativeAccounts: 'નકારાત્મક અને બાકી ખાતાઓ',
    disputeOpportunities: 'સુધારણા માટેની તકો',
    actionRoadmap: '૩૦ / ૬૦ / ૯૦ દિવસની કાર્ય યોજના',
    statutoryNotice: 'વૈધાનિક અને ડેટા સુરક્ષા નોટિસ',
    disclaimer: 'માત્ર માહિતી માટે - સિબિલ/આરબીઆઈ સાથે કોઈ જોડાણ નથી.',
    pageFooter: 'માત્ર માહિતી માટે - સિબિલ/આરબીઆઈ સંબંધિત નથી',
    problem: 'સમસ્યા',
    recommendation: 'ભલામણ કરેલ પગલાં',
    immediateAction: 'તાત્કાલિક પગલું',
    evidence: 'જરૂરી પુરાવા',
    route: 'ચેનલ',
  },
  bn: {
    dossierTitle: 'ডিজিটাল কাট্টা ক্রেডিট হেলথ রিপোর্ট',
    dossierSubtitle: 'এআই-চালিত ভারতীয় সিবিল ক্রেডিট রিপোর্ট বিশ্লেষণ | শূন্য তথ্য ধারণ',
    borrowerParticulars: 'ঋণগ্রহীতার বিবরণ',
    creditScore: 'সিবিল ক্রেডিট স্কোর',
    portfolioSnapshot: 'ক্রেডিট পোর্টফোলিও স্ন্যাপশট',
    totalAccounts: 'মোট অ্যাকাউন্ট',
    activeOverdue: 'সক্রিয় বকেয়া',
    totalBalance: 'মোট ব্যালেন্স',
    utilization: 'ক্রেডিট কার্ড ব্যবহার',
    executiveSummary: 'নির্বাহী সারাংশ',
    criticalIssues: 'চিহ্নিত গুরুত্বপূর্ণ সমস্যা',
    negativeAccounts: 'নেতিবাচক ও খেলাপি অ্যাকাউন্ট',
    disputeOpportunities: 'সংশোধনের সুযোগসমূহ',
    actionRoadmap: '৩০ / ৬০ / ৯০ দিনের পুনরুদ্ধার পরিকল্পনা',
    statutoryNotice: 'সংবিধিবদ্ধ নিয়ন্ত্রক ও ডেটা সুরক্ষা বিজ্ঞপ্তি',
    disclaimer: 'শুধুমাত্র তথ্যগত উদ্দেশ্যে - সিবিল বা আরবিআই-এর সাথে অনুমোদিত নয়।',
    pageFooter: 'শুধুমাত্র তথ্যের জন্য - সিবিল/আরবিআই যুক্ত নয়',
    problem: 'সমস্যা',
    recommendation: 'সুপারিশকৃত পদক্ষেপ',
    immediateAction: 'তাৎক্ষণিক পদক্ষেপ',
    evidence: 'প্রয়োজনীয় প্রমাণ',
    route: 'মাধ্যম',
  },
  ta: {
    dossierTitle: 'டிஜிட்டல் கட்டா கடன் சுகாதார அறிக்கை',
    dossierSubtitle: 'AI அடிப்படையிலான இந்திய சிபில் அறிக்கை ஆய்வு | பூஜ்ஜிய தரவு சேமிப்பு',
    borrowerParticulars: 'கடன் வாங்குபவர் விவரங்கள்',
    creditScore: 'சிபில் கிரெடிட் ஸ்கோர்',
    portfolioSnapshot: 'கடன் விவரங்கள் சுருக்கம்',
    totalAccounts: 'மொத்த கணக்குகள்',
    activeOverdue: 'நிலுவைத் தொகை',
    totalBalance: 'மொத்த பாக்கி',
    utilization: 'கிரெடிட் கார்டு பயன்பாடு',
    executiveSummary: 'முக்கிய அறிக்கை சுருக்கம்',
    criticalIssues: 'கண்டறியப்பட்ட முக்கியமான சிக்கல்கள்',
    negativeAccounts: 'எதிர்மறை மற்றும் தவறிய கணக்குகள்',
    disputeOpportunities: 'சரிசெய்யக்கூடிய வாய்ப்புகள்',
    actionRoadmap: '30 / 60 / 90 நாள் மீட்புத் திட்டம்',
    statutoryNotice: 'சட்டரீதியான மற்றும் தரவு பாதுகாப்பு அறிவிப்பு',
    disclaimer: 'தகவலுக்காக மட்டுமே - சிபில்/ஆர்பிஐ உடன் அதிகாரப்பூர்வ இணைப்பில்லை.',
    pageFooter: 'தகவல் நோக்கம் மட்டுமே - சிபில்/ஆர்பிஐ தொடர்பில்லை',
    problem: 'சிக்கல்',
    recommendation: 'பரிந்துரைக்கப்பட்ட நடவடிக்கை',
    immediateAction: 'உடனடி நடவடிக்கை',
    evidence: 'தேவையான சான்றுகள்',
    route: 'வழிமுறை',
  },
  te: {
    dossierTitle: 'డిజిటల్ కట్టా క్రెడిట్ హెల్త్ నివేదిక',
    dossierSubtitle: 'AI ఆధారిత సిబిల్ క్రెడిట్ నివేదిక విశ్లేషణ | సున్నా డేటా నిల్వ',
    borrowerParticulars: 'రుణగ్రహీత వివరాలు',
    creditScore: 'సిబిల్ క్రెడిట్ స్కోర్',
    portfolioSnapshot: 'క్రెడిట్ పోర్ట్‌ఫోలియో వివరాలు',
    totalAccounts: 'మొత్తం ఖాతాలు',
    activeOverdue: 'బకాయి మొత్తం',
    totalBalance: 'మొత్తం మిగిలిన బకాయి',
    utilization: 'క్రెడిట్ కార్డ్ వినియోగం',
    executiveSummary: 'ప్రధాన నివేదిక సారాంశం',
    criticalIssues: 'గుర్తించబడిన కీలక సమస్యలు',
    negativeAccounts: 'ప్రతికూల మరియు బకాయి ఖాతాలు',
    disputeOpportunities: 'సవరణ అవకాశాలు',
    actionRoadmap: '30 / 60 / 90 రోజుల కార్యాచరణ ప్రణాళిక',
    statutoryNotice: 'చట్టబద్ధమైన మరియు డేటా రక్షణ నోటీసు',
    disclaimer: 'సమాచార ప్రయోజనాల కోసం మాత్రమే - సిబిల్/ఆర్బీఐతో అధికారిక అనుబంధం లేదు.',
    pageFooter: 'కేవలం సమాచారం కొరకు - సిబిల్/ఆర్బీఐ అనుబంధం లేదు',
    problem: 'సమస్య',
    recommendation: 'సిఫార్సు చేసిన చర్య',
    immediateAction: 'తక్షణ చర్య',
    evidence: 'అందించాల్సిన సాక్ష్యం',
    route: 'మార్గం',
  },
  kn: {
    dossierTitle: 'ಡಿಜಿಟಲ್ ಕಟ್ಟಾ ಕ್ರೆಡಿಟ್ ಹೆಲ್ತ್ ವರದಿ',
    dossierSubtitle: 'AI-ಆಧಾರಿತ ಸಿಬಿಲ್ ಕ್ರೆಡಿಟ್ ವರದಿ ವಿಶ್ಲೇಷಣೆ | ಶೂನ್ಯ ಡೇಟಾ ಸಂಗ್ರಹಣೆ',
    borrowerParticulars: 'ಸಾಲಗಾರರ ವಿವರಗಳು',
    creditScore: 'ಸಿಬಿಲ್ ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್',
    portfolioSnapshot: 'ಕ್ರೆಡಿಟ್ ವಿವರಗಳ ಸಾರಾಂಶ',
    totalAccounts: 'ಒಟ್ಟು ಖಾತೆಗಳು',
    activeOverdue: 'ಸಕ್ರಿಯ ಬಾಕಿ ಮೊತ್ತ',
    totalBalance: 'ಒಟ್ಟು ಬಾಕಿ',
    utilization: 'ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಬಳಕೆ',
    executiveSummary: 'ಕಾರ್ಯನಿರ್ವಾಹಕ ಸಾರಾಂಶ',
    criticalIssues: 'ಗುರುತಿಸಲಾದ ಗಂಭೀರ ಸಮಸ್ಯೆಗಳು',
    negativeAccounts: 'ಋಣಾತ್ಮಕ ಮತ್ತು ಬಾಕಿ ಖಾತೆಗಳು',
    disputeOpportunities: 'ತಕರಾರು ಮತ್ತು ತಿದ್ದುಪಡಿ ಅವಕಾಶಗಳು',
    actionRoadmap: '30 / 60 / 90 ದಿನಗಳ ಕ್ರಿಯಾ ಯೋಜನೆ',
    statutoryNotice: 'ಶಾಸನಬದ್ಧ ಮತ್ತು ಡೇಟಾ ಸಂರಕ್ಷಣಾ ಸೂಚನೆ',
    disclaimer: 'ಮಾಹಿತಿ ಉದ್ದೇಶಗಳಿಗಾಗಿ ಮಾತ್ರ - ಸಿಬಿಲ್/ಆರ್‌ಬಿಐ ಜೊತೆ ಯಾವುದೇ ಅಧಿಕೃತ ಸಂಬಂಧವಿಲ್ಲ.',
    pageFooter: 'ಮಾಹಿತಿಗಾಗಿ ಮಾತ್ರ - ಸಿಬಿಲ್/ಆರ್‌ಬಿಐ ಅಧಿಕೃತವಲ್ಲ',
    problem: 'ಸಮಸ್ಯೆ',
    recommendation: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ',
    immediateAction: 'ತಕ್ಷಣದ ಕ್ರಮ',
    evidence: 'ಒದಗಿಸಬೇಕಾದ ಪುರಾವೆ',
    route: 'ಮಾರ್ಗ',
  },
  ml: {
    dossierTitle: 'ഡിജിറ്റൽ കട്ട ക്രെഡിറ്റ് ഹെൽത്ത് റിപ്പോർട്ട്',
    dossierSubtitle: 'AI അടിസ്ഥാനമാക്കിയുള്ള സിബിൽ ക്രെഡിറ്റ് വിശകലനം | സീറോ ഡാറ്റ സംഭരണം',
    borrowerParticulars: 'വായ്പക്കാരന്റെ വിവരങ്ങൾ',
    creditScore: 'സിബിൽ ക്രെഡിറ്റ് സ്കോർ',
    portfolioSnapshot: 'ക്രെഡിറ്റ് പോർട്ട്ഫോളിയോ സംഗ്രഹം',
    totalAccounts: 'ആകെ അക്കൗണ്ടുകൾ',
    activeOverdue: 'കുടിശ്ശിക തുക',
    totalBalance: 'ആകെ ബാലൻസ്',
    utilization: 'ക്രെഡിറ്റ് കാർഡ് ഉപയോഗം',
    executiveSummary: 'പ്രധാന കണ്ടെത്തലുകളുടെ സംഗ്രഹം',
    criticalIssues: 'കണ്ടെത്തിയ പ്രധാന പ്രശ്നങ്ങൾ',
    negativeAccounts: 'നെഗറ്റീവ് & കുടിശ്ശിക അക്കൗണ്ടുകൾ',
    disputeOpportunities: 'തിരുത്തൽ അവസരങ്ങൾ',
    actionRoadmap: '30 / 60 / 90 ദിവസത്തെ പുനരുദ്ധാരണ പദ്ധതി',
    statutoryNotice: 'ഡാറ്റ സംരക്ഷണ അറിയിപ്പ്',
    disclaimer: 'വിവര ആവശ്യങ്ങൾക്ക് മാത്രം - സിബിൽ/ആർബിഐ ഔദ്യോഗിക ബന്ധമില്ല.',
    pageFooter: 'വിവരങ്ങൾക്കായി മാത്രം - സിബിൽ/ആർബിഐ ബന്ധമില്ല',
    problem: 'പ്രശ്നം',
    recommendation: 'ശുപാർശ ചെയ്യുന്ന നടപടി',
    immediateAction: 'ഉടൻ ചെയ്യേണ്ടത്',
    evidence: 'ഹാജരാക്കേണ്ട തെളിവ്',
    route: 'മാർഗ്ഗം',
  },
  pa: {
    dossierTitle: 'ਡਿਜੀਟਲ ਕੱਟਾ ਕ੍ਰੈਡਿਟ ਹੈਲਥ ਰਿਪੋਰਟ',
    dossierSubtitle: 'AI-ਅਧਾਰਿਤ ਸਿਬਿਲ ਕ੍ਰੈਡਿਟ ਰਿਪੋਰਟ ਵਿਸ਼ਲੇਸ਼ਣ | ਜ਼ੀਰੋ ਡਾਟਾ ਸਟੋਰੇਜ',
    borrowerParticulars: 'ਕਰਜ਼ਦਾਰ ਦਾ ਵੇਰਵਾ',
    creditScore: 'ਸਿਬਿਲ ਕ੍ਰੈਡਿਟ ਸਕੋਰ',
    portfolioSnapshot: 'ਕ੍ਰੈਡਿਟ ਪੋਰਟਫੋਲੀਓ ਸੰਖੇਪ',
    totalAccounts: 'ਕੁੱਲ ਖਾਤੇ',
    activeOverdue: 'ਸਰਗਰਮ ਬਕਾਇਆ ਰਕਮ',
    totalBalance: 'ਕੁੱਲ ਬਕਾਇਆ',
    utilization: 'ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਦੀ ਵਰਤੋਂ',
    executiveSummary: 'ਕਾਰਜਕਾਰੀ ਸੰਖੇਪ',
    criticalIssues: 'ਮਹੱਤਵਪੂਰਨ ਸਮੱਸਿਆਵਾਂ',
    negativeAccounts: 'ਨਕਾਰਾਤਮਕ ਅਤੇ ਬਕਾਇਆ ਖਾਤੇ',
    disputeOpportunities: 'ਸੁਧਾਰ ਦੇ ਮੌਕੇ',
    actionRoadmap: '30 / 60 / 90 ਦਿਨਾਂ ਦੀ ਕਾਰਜ ਯੋਜਨਾ',
    statutoryNotice: 'ਕਾਨੂੰਨੀ ਅਤੇ ਡਾਟਾ ਸੁਰੱਖਿਆ ਨੋਟਿਸ',
    disclaimer: 'ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ - ਸਿਬਿਲ/ਆਰਬੀਆਈ ਨਾਲ ਕੋਈ ਸਬੰਧ ਨਹੀਂ।',
    pageFooter: 'ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ - ਸਿਬਿਲ/ਆਰਬੀਆਈ ਸੰਬੰਧਿਤ ਨਹੀਂ',
    problem: 'ਸਮੱਸਿਆ',
    recommendation: 'ਸਿਫ਼ਾਰਿਸ਼ ਕੀਤੀ ਕਾਰਵਾਈ',
    immediateAction: 'ਤੁਰੰਤ ਕਾਰਵਾਈ',
    evidence: 'ਲੋੜੀਂਦੇ ਸਬੂਤ',
    route: 'ਚੈਨਲ',
  },
  or: {
    dossierTitle: 'ଡିଜିଟାଲ୍ କଟ୍ଟା କ୍ରେଡିଟ୍ ହେଲଥ୍ ରିପୋର୍ଟ',
    dossierSubtitle: 'AI-ଆଧାରିତ ସିବିଲ୍ କ୍ରେଡିଟ୍ ରିପୋର୍ଟ ବିଶ୍ଳେଷଣ | ଶୂନ୍ୟ ଡାଟା ସଂରକ୍ଷଣ',
    borrowerParticulars: 'ଋଣଗ୍ରହୀତାଙ୍କ ବିବରଣୀ',
    creditScore: 'ସିବିଲ୍ କ୍ରେଡିଟ୍ ସ୍କୋର୍',
    portfolioSnapshot: 'କ୍ରେଡିଟ୍ ପୋର୍ଟଫୋଲିଓ ସାରାଂଶ',
    totalAccounts: 'ମୋଟ ଖାତା',
    activeOverdue: 'ସକ୍ରିୟ ବକେୟା ରାଶି',
    totalBalance: 'ମୋଟ ବାକି ରାଶି',
    utilization: 'କ୍ରେଡିଟ୍ କାର୍ଡ ବ୍ୟବହାର',
    executiveSummary: 'କାର୍ଯ୍ୟନିର୍ବାହୀ ସାରାଂଶ',
    criticalIssues: 'ଚିହ୍ନଟ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସମସ୍ୟା',
    negativeAccounts: 'ନକାରାତ୍ମକ ଏବଂ ବକେୟା ଖାତା',
    disputeOpportunities: 'ସଂଶୋଧନ ସୁଯୋଗ',
    actionRoadmap: '୩୦ / ୬୦ / ୯୦ ଦିନର କାର୍ଯ୍ୟ ଯୋଜନା',
    statutoryNotice: 'ବୈଧାନିକ ଏବଂ ଡାଟା ସୁରକ୍ଷା ସୂଚନା',
    disclaimer: 'କେବଳ ସୂଚନା ଉଦ୍ଦେଶ୍ୟରେ - ସିବିଲ୍/ଆରବିଆଇ ସହ ସମ୍ପର୍କ ନାହିଁ।',
    pageFooter: 'କେବଳ ସୂଚନା ପାଇଁ - ସିବିଲ୍/ଆରବିଆଇ ସହ ଯୋଡା ନୁହେଁ',
    problem: 'ସମସ୍ୟା',
    recommendation: 'ପରାମର୍ଶିତ ପଦକ୍ଷେପ',
    immediateAction: 'ତୁରନ୍ତ କାର୍ଯ୍ୟାନୁଷ୍ଠାନ',
    evidence: 'ପ୍ରମାଣ',
    route: 'ମାଧ୍ୟମ',
  },
};

/**
 * Sanitize text based on whether a Unicode custom font is used.
 * When using custom fonts (Noto Indic), Unicode characters are fully preserved.
 * When using StandardFonts.Helvetica, text is converted to safe ASCII/WinAnsi.
 */
function safeText(str: string | undefined | null, isCustomFont: boolean = false): string {
  if (!str) return '';
  const cleaned = String(str)
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"');

  if (!isCustomFont) {
    return cleaned
      .replace(/₹/g, 'Rs. ')
      .replace(/[•]/g, '*')
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .trim();
  }
  return cleaned.trim();
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  isCustomFont: boolean = false
): string[] {
  const safe = safeText(text, isCustomFont);
  if (!safe) return [];

  const paragraphs = safe.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!word) continue;
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      try {
        const width = font.widthOfTextAtSize(candidate, fontSize);
        if (width <= maxWidth) {
          currentLine = candidate;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      } catch (_) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

export async function generateCreditReportPdf(
  report: NormalizedCreditReport,
  analysis: AIAnalysisResult,
  language: string = 'en'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  let fontRegular: PDFFont;
  let fontBold: PDFFont;
  let fontOblique: PDFFont;
  let isCustomFont = false;

  const fontConfig = SCRIPT_FONT_MAP[language];
  if (fontConfig && fs.existsSync(fontConfig.regular)) {
    try {
      pdfDoc.registerFontkit(fontkit);
      const regBytes = fs.readFileSync(fontConfig.regular);
      fontRegular = await pdfDoc.embedFont(regBytes, { subset: true });
      if (fontConfig.bold && fs.existsSync(fontConfig.bold)) {
        const boldBytes = fs.readFileSync(fontConfig.bold);
        fontBold = await pdfDoc.embedFont(boldBytes, { subset: true });
      } else {
        fontBold = fontRegular;
      }
      fontOblique = fontRegular;
      isCustomFont = true;
    } catch (fontErr) {
      console.warn('[PDF Generator] Error embedding Indic font, falling back to Helvetica:', fontErr);
      fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      isCustomFont = false;
    }
  } else {
    fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    isCustomFont = false;
  }

  const L = PDF_LABELS[language] || PDF_LABELS.en;

  // A4 size: 595.28 x 841.89 points
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const MARGIN_TOP = 45;
  const MARGIN_BOTTOM = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let currentPage: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;

  function checkPageBreak(neededHeight: number) {
    if (y - neededHeight < MARGIN_BOTTOM) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN_TOP;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    currentPage.drawText('DIGITAL KATTA - AI CREDIT HEALTH REPORT', {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 25,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.58, 0.56),
    });
    currentPage.drawText(
      `Borrower: ${safeText(report.personal.name, isCustomFont)} | Ref: ${safeText(report.personal.reportNumber || 'N/A', isCustomFont)}`,
      {
        x: PAGE_WIDTH - MARGIN_RIGHT - 240,
        y: PAGE_HEIGHT - 25,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5),
      }
    );
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: PAGE_HEIGHT - 30 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: PAGE_HEIGHT - 30 },
      thickness: 0.5,
      color: rgb(0.8, 0.82, 0.85),
    });
  }

  // --- Document Header ---
  currentPage.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 55,
    width: CONTENT_WIDTH,
    height: 55,
    color: rgb(0.96, 0.98, 0.98),
    borderColor: rgb(0.2, 0.58, 0.56),
    borderWidth: 1,
  });

  currentPage.drawText(safeText(L.dossierTitle, isCustomFont), {
    x: MARGIN_LEFT + 12,
    y: y - 20,
    size: 13,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });

  currentPage.drawText(safeText(L.dossierSubtitle, isCustomFont), {
    x: MARGIN_LEFT + 12,
    y: y - 34,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.4, 0.45),
  });

  const dateStr = new Date().toLocaleDateString('en-GB');
  currentPage.drawText(
    `Generated: ${dateStr} | Report Ref: ${safeText(report.personal.reportNumber || 'N/A', isCustomFont)} | Lang: ${language.toUpperCase()}`,
    {
      x: MARGIN_LEFT + 12,
      y: y - 46,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.4, 0.45, 0.5),
    }
  );

  y -= 70;

  // --- Borrower & Score Snapshot Box ---
  checkPageBreak(110);
  currentPage.drawRectangle({
    x: MARGIN_LEFT,
    y: y - 90,
    width: CONTENT_WIDTH,
    height: 90,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.75,
  });

  // Column 1: Borrower Details
  currentPage.drawText(safeText(L.borrowerParticulars, isCustomFont), {
    x: MARGIN_LEFT + 12,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: rgb(0.35, 0.4, 0.45),
  });

  currentPage.drawText(safeText(report.personal.name || 'Borrower', isCustomFont), {
    x: MARGIN_LEFT + 12,
    y: y - 32,
    size: 11,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });
  currentPage.drawText(`PAN: ${safeText(report.personal.panMasked || 'XXXXX0000X', isCustomFont)}`, {
    x: MARGIN_LEFT + 12,
    y: y - 46,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });
  currentPage.drawText(`Mobile: ${safeText(report.personal.mobileMasked || '+91 XXXXX XXXXX', isCustomFont)}`, {
    x: MARGIN_LEFT + 12,
    y: y - 58,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });
  currentPage.drawText(`Bureau: ${safeText(report.personal.bureauName || report.score?.scoreName || 'CIBIL', isCustomFont)}`, {
    x: MARGIN_LEFT + 12,
    y: y - 70,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Column 2: Score
  const scoreX = MARGIN_LEFT + 185;
  currentPage.drawText(safeText(L.creditScore, isCustomFont), {
    x: scoreX,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: rgb(0.35, 0.4, 0.45),
  });

  const scoreVal = String(report.score.score || 'N/A');
  const scoreNum = Number(report.score.score) || 0;
  const scoreColor =
    scoreNum >= 750
      ? rgb(0.1, 0.6, 0.3)
      : scoreNum >= 650
      ? rgb(0.85, 0.5, 0.1)
      : rgb(0.8, 0.15, 0.15);

  currentPage.drawText(scoreVal, {
    x: scoreX,
    y: y - 44,
    size: 26,
    font: fontBold,
    color: scoreColor,
  });

  currentPage.drawText(`Category: ${safeText(report.score.category || 'Fair', isCustomFont)}`, {
    x: scoreX,
    y: y - 58,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });
  currentPage.drawText(`Risk Level: ${safeText(report.score.riskLevel || 'Moderate', isCustomFont)}`, {
    x: scoreX,
    y: y - 70,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.35, 0.4, 0.45),
  });

  // Column 3: Portfolio Snapshot
  const snapX = MARGIN_LEFT + 340;
  currentPage.drawText(safeText(L.portfolioSnapshot, isCustomFont), {
    x: snapX,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: rgb(0.35, 0.4, 0.45),
  });

  const currencyPrefix = isCustomFont ? '₹' : 'Rs. ';
  const overdueStr = report.summary.totalOverdue
    ? `${currencyPrefix}${report.summary.totalOverdue.toLocaleString('en-IN')}`
    : `${currencyPrefix}0`;
  const balanceStr = report.summary.totalOutstanding
    ? `${currencyPrefix}${report.summary.totalOutstanding.toLocaleString('en-IN')}`
    : `${currencyPrefix}0`;

  currentPage.drawText(
    `${safeText(L.totalAccounts, isCustomFont)}: ${report.summary.totalAccounts || 0} (${report.summary.activeAccounts || 0} active)`,
    {
      x: snapX,
      y: y - 32,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.3),
    }
  );
  currentPage.drawText(`${safeText(L.activeOverdue, isCustomFont)}: ${overdueStr}`, {
    x: snapX,
    y: y - 45,
    size: 8.5,
    font: fontBold,
    color: report.summary.totalOverdue > 0 ? rgb(0.8, 0.15, 0.15) : rgb(0.1, 0.5, 0.2),
  });
  currentPage.drawText(`${safeText(L.totalBalance, isCustomFont)}: ${balanceStr}`, {
    x: snapX,
    y: y - 58,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.3),
  });
  currentPage.drawText(
    `${safeText(L.utilization, isCustomFont)}: ${report.summary.creditCardUtilizationPct || 0}%`,
    {
      x: snapX,
      y: y - 70,
      size: 8.5,
      font: fontBold,
      color:
        (report.summary.creditCardUtilizationPct || 0) > 30
          ? rgb(0.8, 0.4, 0.1)
          : rgb(0.1, 0.5, 0.2),
    }
  );

  y -= 105;

  // --- Executive Diagnostic Summary ---
  const summaryText = analysis.creditHealth?.summary || 'No diagnostic summary available.';
  const summaryLines = wrapText(summaryText, fontRegular, 9, CONTENT_WIDTH - 20, isCustomFont);
  const summaryBoxHeight = 26 + summaryLines.length * 13;

  checkPageBreak(summaryBoxHeight + 20);

  currentPage.drawText(safeText(L.executiveSummary, isCustomFont), {
    x: MARGIN_LEFT,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.15, 0.2),
  });
  y -= 14;

  currentPage.drawRectangle({
    x: MARGIN_LEFT,
    y: y - summaryBoxHeight + 10,
    width: CONTENT_WIDTH,
    height: summaryBoxHeight,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 0.5,
  });

  let textY = y - 10;
  for (const line of summaryLines) {
    currentPage.drawText(line, {
      x: MARGIN_LEFT + 10,
      y: textY,
      size: 9,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.25),
    });
    textY -= 13;
  }
  y = textY - 15;

  // --- Critical Issues ---
  if (analysis.criticalIssues && analysis.criticalIssues.length > 0) {
    checkPageBreak(40);
    currentPage.drawText(
      `${safeText(L.criticalIssues, isCustomFont)} (${analysis.criticalIssues.length})`,
      {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.8, 0.15, 0.15),
      }
    );
    y -= 14;

    for (const issue of analysis.criticalIssues) {
      const descLines = wrapText(issue.description, fontRegular, 8.5, CONTENT_WIDTH - 24, isCustomFont);
      const actLines = wrapText(
        `${L.immediateAction}: ${issue.actionImmediate}`,
        fontBold,
        8.5,
        CONTENT_WIDTH - 24,
        isCustomFont
      );
      const cardHeight = 28 + (descLines.length + actLines.length) * 12;

      checkPageBreak(cardHeight + 10);

      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: y - cardHeight + 8,
        width: CONTENT_WIDTH,
        height: cardHeight,
        color: rgb(1, 0.97, 0.97),
        borderColor: rgb(0.95, 0.75, 0.75),
        borderWidth: 0.5,
      });

      currentPage.drawText(`* ${safeText(issue.title, isCustomFont)}`, {
        x: MARGIN_LEFT + 10,
        y: y - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.7, 0.1, 0.1),
      });

      currentPage.drawText(`[${safeText(issue.severity || 'CRITICAL', isCustomFont)}]`, {
        x: PAGE_WIDTH - MARGIN_RIGHT - 70,
        y: y - 10,
        size: 8,
        font: fontBold,
        color: rgb(0.75, 0.1, 0.1),
      });

      let itemY = y - 23;
      for (const line of descLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 12,
          y: itemY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3),
        });
        itemY -= 12;
      }

      for (const line of actLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 12,
          y: itemY,
          size: 8.5,
          font: fontBold,
          color: rgb(0.65, 0.15, 0.15),
        });
        itemY -= 12;
      }

      y = itemY - 8;
    }
    y -= 5;
  }

  // --- Negative & Delinquent Accounts ---
  if (analysis.negativeAccounts && analysis.negativeAccounts.length > 0) {
    checkPageBreak(40);
    currentPage.drawText(
      `${safeText(L.negativeAccounts, isCustomFont)} (${analysis.negativeAccounts.length})`,
      {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.2),
      }
    );
    y -= 14;

    for (const acc of analysis.negativeAccounts) {
      const probLines = wrapText(
        `${L.problem}: ${acc.problem}`,
        fontRegular,
        8.5,
        CONTENT_WIDTH - 20,
        isCustomFont
      );
      const recLines = wrapText(
        `${L.recommendation}: ${acc.recommendedAction}`,
        fontBold,
        8.5,
        CONTENT_WIDTH - 20,
        isCustomFont
      );
      const accHeight = 36 + (probLines.length + recLines.length) * 12;

      checkPageBreak(accHeight + 10);

      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: y - accHeight + 8,
        width: CONTENT_WIDTH,
        height: accHeight,
        color: rgb(0.99, 0.99, 1.0),
        borderColor: rgb(0.85, 0.88, 0.92),
        borderWidth: 0.5,
      });

      currentPage.drawText(
        `${safeText(acc.lender, isCustomFont)} (${safeText(acc.accountType, isCustomFont)}) - Acc: ${safeText(acc.accountNumberMasked, isCustomFont)}`,
        {
          x: MARGIN_LEFT + 10,
          y: y - 10,
          size: 9,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.2),
        }
      );

      const overdueVal = acc.overdue
        ? `${currencyPrefix}${acc.overdue.toLocaleString('en-IN')}`
        : `${currencyPrefix}0`;
      const balanceVal = acc.balance
        ? `${currencyPrefix}${acc.balance.toLocaleString('en-IN')}`
        : `${currencyPrefix}0`;
      currentPage.drawText(
        `Balance: ${balanceVal} | Overdue: ${overdueVal} | Status: ${safeText(acc.status, isCustomFont)}`,
        {
          x: MARGIN_LEFT + 10,
          y: y - 22,
          size: 8,
          font: fontRegular,
          color: rgb(0.3, 0.35, 0.4),
        }
      );

      let subY = y - 34;
      for (const line of probLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 10,
          y: subY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3),
        });
        subY -= 12;
      }
      for (const line of recLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 10,
          y: subY,
          size: 8.5,
          font: fontBold,
          color: rgb(0.15, 0.35, 0.6),
        });
        subY -= 12;
      }

      y = subY - 8;
    }
    y -= 5;
  }

  // --- Dispute Opportunities ---
  if (analysis.disputeOpportunities && analysis.disputeOpportunities.length > 0) {
    checkPageBreak(40);
    currentPage.drawText(
      `${safeText(L.disputeOpportunities, isCustomFont)} (${analysis.disputeOpportunities.length})`,
      {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.7, 0.4, 0.1),
      }
    );
    y -= 14;

    for (const disp of analysis.disputeOpportunities) {
      const whyLines = wrapText(
        `Inconsistency: ${disp.whyInconsistent}`,
        fontRegular,
        8.5,
        CONTENT_WIDTH - 20,
        isCustomFont
      );
      const evLines = wrapText(
        `${L.evidence}: ${disp.evidenceToProvide}`,
        fontBold,
        8.5,
        CONTENT_WIDTH - 20,
        isCustomFont
      );
      const dispHeight = 28 + (whyLines.length + evLines.length) * 12;

      checkPageBreak(dispHeight + 10);

      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: y - dispHeight + 8,
        width: CONTENT_WIDTH,
        height: dispHeight,
        color: rgb(1, 0.99, 0.96),
        borderColor: rgb(0.95, 0.85, 0.7),
        borderWidth: 0.5,
      });

      currentPage.drawText(`Issue: ${safeText(disp.issue, isCustomFont)}`, {
        x: MARGIN_LEFT + 10,
        y: y - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.6, 0.3, 0.05),
      });

      currentPage.drawText(`${L.route}: ${safeText(disp.recommendedRoute, isCustomFont)}`, {
        x: PAGE_WIDTH - MARGIN_RIGHT - 140,
        y: y - 10,
        size: 8,
        font: fontBold,
        color: rgb(0.5, 0.3, 0.1),
      });

      let dY = y - 22;
      for (const line of whyLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 10,
          y: dY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3),
        });
        dY -= 12;
      }
      for (const line of evLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 10,
          y: dY,
          size: 8.5,
          font: fontBold,
          color: rgb(0.5, 0.25, 0.05),
        });
        dY -= 12;
      }

      y = dY - 8;
    }
    y -= 5;
  }

  // --- 30 / 60 / 90-Day Action Roadmap ---
  if (analysis.actionPlan30_60_90) {
    checkPageBreak(80);
    currentPage.drawText(safeText(L.actionRoadmap, isCustomFont), {
      x: MARGIN_LEFT,
      y,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    });
    y -= 14;

    const phases = [
      {
        title: 'Month 1 (Days 1-30): Immediate Triage & Grievances',
        items: analysis.actionPlan30_60_90.days8To30 || [],
      },
      {
        title: 'Month 2 (Days 31-60): Bureau Tracking & Ratio Optimization',
        items: analysis.actionPlan30_60_90.days31To60 || [],
      },
      {
        title: 'Month 3 (Days 61-90): Score Stabilization & Audit',
        items: analysis.actionPlan30_60_90.days61To90 || [],
      },
    ];

    for (const phase of phases) {
      const itemLines: string[] = [];
      for (const it of phase.items.slice(0, 4)) {
        itemLines.push(...wrapText(`* ${it}`, fontRegular, 8.5, CONTENT_WIDTH - 20, isCustomFont));
      }
      const boxH = 22 + itemLines.length * 12;

      checkPageBreak(boxH + 10);

      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: y - boxH + 8,
        width: CONTENT_WIDTH,
        height: boxH,
        color: rgb(0.97, 0.98, 0.99),
        borderColor: rgb(0.85, 0.88, 0.92),
        borderWidth: 0.5,
      });

      currentPage.drawText(safeText(phase.title, isCustomFont), {
        x: MARGIN_LEFT + 10,
        y: y - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.3),
      });

      let pY = y - 22;
      for (const line of itemLines) {
        currentPage.drawText(line, {
          x: MARGIN_LEFT + 12,
          y: pY,
          size: 8.5,
          font: fontRegular,
          color: rgb(0.2, 0.25, 0.3),
        });
        pY -= 12;
      }

      y = pY - 8;
    }
  }

  // --- Legal Disclaimer on Final Page ---
  checkPageBreak(50);
  currentPage.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
    thickness: 0.5,
    color: rgb(0.8, 0.82, 0.85),
  });
  y -= 12;

  currentPage.drawText(safeText(L.statutoryNotice, isCustomFont), {
    x: MARGIN_LEFT,
    y,
    size: 7.5,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.5),
  });
  y -= 10;

  const disclaimerText = L.disclaimer;
  const disLines = wrapText(disclaimerText, fontRegular, 7, CONTENT_WIDTH, isCustomFont);
  for (const line of disLines) {
    currentPage.drawText(line, {
      x: MARGIN_LEFT,
      y,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.55),
    });
    y -= 9;
  }

  // Draw Page Footers on all pages
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    page.drawLine({
      start: { x: MARGIN_LEFT, y: 35 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: 35 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });

    page.drawText(safeText(L.pageFooter, isCustomFont), {
      x: MARGIN_LEFT,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    });

    const pageNumText = `Page ${i + 1} of ${totalPages}`;
    try {
      const pageNumWidth = fontRegular.widthOfTextAtSize(pageNumText, 7.5);
      page.drawText(pageNumText, {
        x: PAGE_WIDTH - MARGIN_RIGHT - pageNumWidth,
        y: 22,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      });
    } catch (_) {
      page.drawText(pageNumText, {
        x: PAGE_WIDTH - MARGIN_RIGHT - 60,
        y: 22,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6),
      });
    }
  }

  return await pdfDoc.save();
}
