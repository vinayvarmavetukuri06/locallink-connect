import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "te";

export const LANGUAGES: { code: Lang; native: string; english: string; flag: string }[] = [
  { code: "en", native: "English", english: "English", flag: "🇬🇧" },
  { code: "hi", native: "हिंदी", english: "Hindi", flag: "🇮🇳" },
  { code: "te", native: "తెలుగు", english: "Telugu", flag: "🇮🇳" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // splash
  "splash.tagline": "Find Trusted Local Workers Near You",
  "splash.verified": "10,000+ verified workers across India",
  "splash.getStarted": "Get Started",
  "splash.haveAccount": "I have an account · Login",
  "splash.terms": "By continuing you agree to our Terms & Privacy",

  // auth
  "auth.back": "Back",
  "auth.chooser.title": "Choose Account Type",
  "auth.chooser.subtitle": "How would you like to use LocalConnect?",
  "auth.chooser.userTitle": "I Need a Service",
  "auth.chooser.userDesc": "Find nearby workers and book services instantly.",
  "auth.chooser.userCta": "Continue as User →",
  "auth.chooser.memberTitle": "I Provide Services",
  "auth.chooser.memberDesc": "Get customers and grow your local business.",
  "auth.chooser.memberCta": "Continue as Member →",
  "auth.chooser.workers": "Workers",
  "auth.chooser.bookings": "Bookings",
  "auth.chooser.rating": "Rating",
  "auth.chooser.howItWorks": "How it works",
  "auth.chooser.step1Title": "Choose a service",
  "auth.chooser.step1Desc": "Pick from 12+ local services.",
  "auth.chooser.step2Title": "Pick a worker",
  "auth.chooser.step2Desc": "Compare ratings and prices.",
  "auth.chooser.step3Title": "Book instantly",
  "auth.chooser.step3Desc": "Confirm in seconds, get help fast.",

  // login
  "login.title": "Welcome Back",
  "login.subtitle": "Sign in to continue",
  "login.mobileLabel": "Mobile Number",
  "login.passwordLabel": "Password",
  "login.passwordPlaceholder": "Enter your password",
  "login.forgot": "Forgot password?",
  "login.submit": "Login",
  "login.invalidMobile": "Enter a valid 10-digit mobile number.",
  "login.enterPassword": "Enter your password.",
  "login.notRegistered": "Phone number not registered",
  "login.wrongPassword": "Incorrect password",
  "login.noAccount": "Don't have an account?",
  "login.signup": "Sign up",

  // bottom nav
  "nav.home": "Home",
  "nav.bookings": "Bookings",
  "nav.chat": "Chat",
  "nav.profile": "Profile",
  "nav.plan": "Plan",

  // user home
  "userHome.namaste": "Namaste,",
  "auth.nameHintHi": "You can type your name in Hindi script (हिंदी)",
  "auth.nameHintTe": "You can type your name in Telugu script (తెలుగు)",
  "userHome.searchPlaceholder": "Search by name, service or area...",
  "userHome.services": "Our Services",
  "userHome.viewAll": "View All",
  "userHome.results": "Results for",
  "userHome.localHeroes": "Local Heroes",
  "userHome.verifiedExperts": "Verified Experts",
  "userHome.nearby": "Nearby Workers",
  "userHome.recentBooking": "Recent Booking",
  "userHome.view": "View",
  "userHome.noMatch": "No workers match your search yet — try a different service or area.",

  // member home
  "memberHome.welcome": "Welcome back,",
  "memberHome.totalBookings": "Total Bookings",
  "memberHome.allTime": "all time",
  "memberHome.earnings": "Earnings",
  "memberHome.completedJobs": "completed jobs",
  "memberHome.customerRequests": "Customer Requests",
  "memberHome.new": "NEW",
  "memberHome.loading": "Loading…",
  "memberHome.noPending": "No pending requests",
  "memberHome.noPendingSub": "New customer requests will appear here.",
  "memberHome.replyFaster": "Reply faster, rank higher",
  "memberHome.replyFasterDesc": "Accept requests quickly to boost your visibility in your area.",
  "memberHome.available": "Available",
  "memberHome.busy": "Busy",

  // language selector
  "lang.choose": "Choose Language",
  "lang.subtitle": "App will switch to the selected language instantly.",
};

const hi: Dict = {
  "splash.tagline": "अपने पास भरोसेमंद स्थानीय कारीगर खोजें",
  "splash.verified": "भारत भर में 10,000+ सत्यापित कारीगर",
  "splash.getStarted": "शुरू करें",
  "splash.haveAccount": "मेरा खाता है · लॉगिन",
  "splash.terms": "जारी रखने पर आप हमारी शर्तें और गोपनीयता से सहमत हैं",

  "auth.back": "वापस",
  "auth.chooser.title": "खाता प्रकार चुनें",
  "auth.chooser.subtitle": "आप LocalConnect का उपयोग कैसे करना चाहते हैं?",
  "auth.chooser.userTitle": "मुझे सेवा चाहिए",
  "auth.chooser.userDesc": "नज़दीकी कारीगर खोजें और तुरंत सेवा बुक करें।",
  "auth.chooser.userCta": "उपयोगकर्ता के रूप में जारी रखें →",
  "auth.chooser.memberTitle": "मैं सेवा देता हूँ",
  "auth.chooser.memberDesc": "ग्राहक पाएं और अपना स्थानीय व्यवसाय बढ़ाएं।",
  "auth.chooser.memberCta": "सदस्य के रूप में जारी रखें →",
  "auth.chooser.workers": "कारीगर",
  "auth.chooser.bookings": "बुकिंग",
  "auth.chooser.rating": "रेटिंग",
  "auth.chooser.howItWorks": "यह कैसे काम करता है",
  "auth.chooser.step1Title": "सेवा चुनें",
  "auth.chooser.step1Desc": "12+ स्थानीय सेवाओं में से चुनें।",
  "auth.chooser.step2Title": "कारीगर चुनें",
  "auth.chooser.step2Desc": "रेटिंग और कीमत की तुलना करें।",
  "auth.chooser.step3Title": "तुरंत बुक करें",
  "auth.chooser.step3Desc": "सेकंडों में पुष्टि, तेज़ मदद।",

  "login.title": "वापसी पर स्वागत है",
  "login.subtitle": "जारी रखने के लिए साइन इन करें",
  "login.mobileLabel": "मोबाइल नंबर",
  "login.passwordLabel": "पासवर्ड",
  "login.passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
  "login.forgot": "पासवर्ड भूल गए?",
  "login.submit": "लॉगिन",
  "login.invalidMobile": "मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।",
  "login.enterPassword": "अपना पासवर्ड दर्ज करें।",
  "login.notRegistered": "फ़ोन नंबर पंजीकृत नहीं है",
  "login.wrongPassword": "गलत पासवर्ड",
  "login.noAccount": "खाता नहीं है?",
  "login.signup": "साइन अप",

  "nav.home": "होम",
  "nav.bookings": "बुकिंग",
  "nav.chat": "चैट",
  "nav.profile": "प्रोफ़ाइल",
  "nav.plan": "प्लान",

  "userHome.namaste": "नमस्ते,",
  "userHome.searchPlaceholder": "नाम, सेवा या क्षेत्र से खोजें...",
  "userHome.services": "हमारी सेवाएँ",
  "userHome.viewAll": "सभी देखें",
  "userHome.results": "परिणाम",
  "userHome.localHeroes": "स्थानीय हीरो",
  "userHome.verifiedExperts": "सत्यापित विशेषज्ञ",
  "userHome.nearby": "नज़दीकी कारीगर",
  "userHome.recentBooking": "हाल की बुकिंग",
  "userHome.view": "देखें",
  "userHome.noMatch": "आपकी खोज से कोई कारीगर मेल नहीं खाता — कोई और सेवा या क्षेत्र आज़माएँ।",

  "memberHome.welcome": "वापसी पर स्वागत है,",
  "memberHome.totalBookings": "कुल बुकिंग",
  "memberHome.allTime": "अब तक",
  "memberHome.earnings": "कमाई",
  "memberHome.completedJobs": "पूरे किए गए काम",
  "memberHome.customerRequests": "ग्राहक अनुरोध",
  "memberHome.new": "नया",
  "memberHome.loading": "लोड हो रहा है…",
  "memberHome.noPending": "कोई लंबित अनुरोध नहीं",
  "memberHome.noPendingSub": "नए ग्राहक अनुरोध यहाँ दिखाई देंगे।",
  "memberHome.replyFaster": "तेज़ी से जवाब दें, ऊपर आएं",
  "memberHome.replyFasterDesc": "अनुरोध जल्दी स्वीकार करें और अपने क्षेत्र में अधिक दिखें।",
  "memberHome.available": "उपलब्ध",
  "memberHome.busy": "व्यस्त",

  "lang.choose": "भाषा चुनें",
  "lang.subtitle": "ऐप तुरंत चुनी गई भाषा में बदल जाएगा।",
};

const te: Dict = {
  "splash.tagline": "మీ దగ్గర నమ్మదగిన స్థానిక కార్మికులను కనుగొనండి",
  "splash.verified": "భారతదేశం అంతటా 10,000+ ధృవీకరించబడిన కార్మికులు",
  "splash.getStarted": "ప్రారంభించండి",
  "splash.haveAccount": "నాకు ఖాతా ఉంది · లాగిన్",
  "splash.terms": "కొనసాగించడం ద్వారా మీరు మా నిబంధనలు & గోప్యతకు అంగీకరిస్తారు",

  "auth.back": "వెనుకకు",
  "auth.chooser.title": "ఖాతా రకాన్ని ఎంచుకోండి",
  "auth.chooser.subtitle": "మీరు LocalConnectని ఎలా ఉపయోగించాలనుకుంటున్నారు?",
  "auth.chooser.userTitle": "నాకు సేవ కావాలి",
  "auth.chooser.userDesc": "సమీపంలోని కార్మికులను కనుగొని వెంటనే సేవలను బుక్ చేయండి.",
  "auth.chooser.userCta": "వినియోగదారుగా కొనసాగండి →",
  "auth.chooser.memberTitle": "నేను సేవలు అందిస్తాను",
  "auth.chooser.memberDesc": "కస్టమర్‌లను పొందండి మరియు మీ స్థానిక వ్యాపారాన్ని పెంచండి.",
  "auth.chooser.memberCta": "సభ్యునిగా కొనసాగండి →",
  "auth.chooser.workers": "కార్మికులు",
  "auth.chooser.bookings": "బుకింగ్‌లు",
  "auth.chooser.rating": "రేటింగ్",
  "auth.chooser.howItWorks": "ఇది ఎలా పనిచేస్తుంది",
  "auth.chooser.step1Title": "సేవను ఎంచుకోండి",
  "auth.chooser.step1Desc": "12+ స్థానిక సేవల నుండి ఎంచుకోండి.",
  "auth.chooser.step2Title": "కార్మికుని ఎంచుకోండి",
  "auth.chooser.step2Desc": "రేటింగ్‌లు మరియు ధరలను సరిపోల్చండి.",
  "auth.chooser.step3Title": "తక్షణమే బుక్ చేయండి",
  "auth.chooser.step3Desc": "సెకన్లలో నిర్ధారించండి, త్వరగా సహాయం పొందండి.",

  "login.title": "తిరిగి స్వాగతం",
  "login.subtitle": "కొనసాగించడానికి సైన్ ఇన్ చేయండి",
  "login.mobileLabel": "మొబైల్ నంబర్",
  "login.passwordLabel": "పాస్‌వర్డ్",
  "login.passwordPlaceholder": "మీ పాస్‌వర్డ్ నమోదు చేయండి",
  "login.forgot": "పాస్‌వర్డ్ మరిచిపోయారా?",
  "login.submit": "లాగిన్",
  "login.invalidMobile": "చెల్లుబాటు అయ్యే 10-అంకెల మొబైల్ నంబర్ నమోదు చేయండి.",
  "login.enterPassword": "మీ పాస్‌వర్డ్ నమోదు చేయండి.",
  "login.notRegistered": "ఫోన్ నంబర్ నమోదు చేయబడలేదు",
  "login.wrongPassword": "తప్పు పాస్‌వర్డ్",
  "login.noAccount": "ఖాతా లేదా?",
  "login.signup": "సైన్ అప్",

  "nav.home": "హోమ్",
  "nav.bookings": "బుకింగ్‌లు",
  "nav.chat": "చాట్",
  "nav.profile": "ప్రొఫైల్",
  "nav.plan": "ప్లాన్",

  "userHome.namaste": "నమస్తే,",
  "userHome.searchPlaceholder": "పేరు, సేవ లేదా ప్రాంతం ద్వారా శోధించండి...",
  "userHome.services": "మా సేవలు",
  "userHome.viewAll": "అన్నీ చూడండి",
  "userHome.results": "ఫలితాలు",
  "userHome.localHeroes": "స్థానిక హీరోలు",
  "userHome.verifiedExperts": "ధృవీకరించబడిన నిపుణులు",
  "userHome.nearby": "సమీపంలోని కార్మికులు",
  "userHome.recentBooking": "ఇటీవలి బుకింగ్",
  "userHome.view": "చూడండి",
  "userHome.noMatch": "మీ శోధనకు సరిపోయే కార్మికులు లేరు — వేరే సేవ లేదా ప్రాంతాన్ని ప్రయత్నించండి.",

  "memberHome.welcome": "తిరిగి స్వాగతం,",
  "memberHome.totalBookings": "మొత్తం బుకింగ్‌లు",
  "memberHome.allTime": "ఇప్పటి వరకు",
  "memberHome.earnings": "ఆదాయం",
  "memberHome.completedJobs": "పూర్తయిన పనులు",
  "memberHome.customerRequests": "కస్టమర్ అభ్యర్థనలు",
  "memberHome.new": "కొత్తది",
  "memberHome.loading": "లోడ్ అవుతోంది…",
  "memberHome.noPending": "పెండింగ్ అభ్యర్థనలు లేవు",
  "memberHome.noPendingSub": "కొత్త కస్టమర్ అభ్యర్థనలు ఇక్కడ కనిపిస్తాయి.",
  "memberHome.replyFaster": "త్వరగా ప్రతిస్పందించండి, ఎక్కువ ర్యాంక్ పొందండి",
  "memberHome.replyFasterDesc": "అభ్యర్థనలను త్వరగా అంగీకరించండి మరియు మీ ప్రాంతంలో ఎక్కువగా కనిపించండి.",
  "memberHome.available": "అందుబాటులో",
  "memberHome.busy": "బిజీ",

  "lang.choose": "భాషను ఎంచుకోండి",
  "lang.subtitle": "యాప్ ఎంచుకున్న భాషకు తక్షణమే మారుతుంది.",
};

const dicts: Record<Lang, Dict> = { en, hi, te };

const STORAGE_KEY = "lc:lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && dicts[saved]) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const t = useCallback(
    (key: string) => dicts[lang][key] ?? dicts.en[key] ?? key,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so non-wrapped trees don't crash
    return {
      lang: "en",
      setLang: () => {},
      t: (k) => dicts.en[k] ?? k,
    };
  }
  return ctx;
}
