import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Leaf, ShieldAlert, HeartPulse, Sprout, CheckCircle2, AlertCircle, ChevronLeft, Globe, Search, Volume2, VolumeX, MessageSquare, Mic, History, SendHorizontal, Sparkles, User, Bot, X, Trash2, Download } from 'lucide-react';
import { analyzeCropPhoto, AnalysisResult, chatWithAgriBot } from './services/geminiService';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';


interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  isAudio?: boolean;
}

interface ScanHistory {
  id: string;
  timestamp: number;
  image: string;
  result: AnalysisResult;
  language: string;
}

const LANG_CODES: Record<string, string> = {
  English: 'en-US',
  "Simplified Chinese": 'zh-CN',
  "Traditional Chinese": 'zh-TW',
  Urdu: 'ur-PK',
  Sindhi: 'sd-PK'
};

const LANGUAGES = [
  "English",
  "Simplified Chinese",
  "Traditional Chinese",
  "Urdu",
  "Sindhi"
];

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  "English": "English",
  "Simplified Chinese": "简体中文",
  "Traditional Chinese": "繁體中文",
  "Urdu": "اردو",
  "Sindhi": "سنڌي"
};

const UI_TRANSLATIONS: Record<string, any> = {
  English: {
    title: "AGROGENESIS",
    home: "Home",
    scanner: "Diagnostic Scanner",
    futureFarming: "Future of Farming",
    heroTitle: "RESCUE YOUR",
    heroTitleItalic: "HARVEST.",
    heroSubtitle: "Deploy instant AI diagnostics for your crops. Detect diseases in seconds, get organic treatment protocols, and prevent failure before it spreads.",
    startScan: "Start Vision Scan",
    documentation: "Documentation",
    detectionRate: "Detection rate",
    cropsSupported: "Crops supported",
    scanningPathogens: "SCANNING FOR PATHOGENS",
    advancedVision: "Advanced Biological Vision",
    diagnosisReady: "Diagnosis Ready",
    organicCare: "Organic Care",
    organicCareDesc: "Detailed, step-by-step organic treatment protocols generated specifically for your crop's phenotype.",
    diseaseShield: "Disease Shield",
    diseaseShieldDesc: "Identify pests and biological threats early with confidence scores powered by advanced agricultural intelligence.",
    sustainabilityTitle: "Sustainability",
    sustainabilityDesc: "Get expert care tips to improve future yields and sustainably prevent disease recurrence in your fields.",
    howItWorks: "How It Works",
    step1Title: "Vision Setup",
    step1Desc: "Capture a high-resolution image of the affected plant area using any mobile device.",
    step2Title: "Neural Analysis",
    step2Desc: "Our L0 neural network scans for over 150 unique pathogens and metabolic deficiencies.",
    step3Title: "Protocol Deployment",
    step3Desc: "Receive immediate, localized organic and chemical treatment protocols tailored to your soil type.",
    impactTitle: "Strategic Impact",
    impact1Title: "Food Security",
    impact1Desc: "Prevent localized crop failure and stabilize regional food supplies.",
    impact2Title: "Economic Resilience",
    impact2Desc: "Reduce input costs by applying precisely what your crops need, exactly when they need it.",
    impact3Title: "Data Intelligence",
    impact3Desc: "Transform visual data into actionable harvest forecasts and yield optimizations.",
    uploadTitle: "Initialize Analysis",
    uploadDesc: "Upload cross-section or leaf sample",
    symptoms: "Visible Symptoms",
    organic: "Organic Protocol",
    chemical: "Chemical Override",
    prevention: "Preventative Measures",
    syncNew: "Sync New Scan",
    indicators: "Detected Indicators",
    confidence: "Confidence Coefficient",
    preventionStrategy: "Prevention Strategy",
    sustainability: "Sustainability Advice",
    biologicalDiagnosis: "Biological Diagnosis",
    severeness: "Severeness",
    moderate: "Moderate",
    spread: "Spread",
    standard: "Standard",
    processingPathogens: "Processing Pathogens...",
    awaitingResults: "Awaiting Results",
    searchLang: "Search language...",
    focusPrecision: "Focus Precision",
    focusDesc: "Analyze specific decay areas",
    l0Diagnostic: "L0 Diagnostic",
    realtimeCheck: "Real-time pathogen check",
    retry: "Retry Analysis",
    failed: "Failed to analyze image. Please try again with a clearer photo.",
    mockDiagnosis: "Septoria Leaf Spot Detected",
    footer: "AgroGenesis Intelligence System",
    speakResults: "Speak Results",
    detailedReport: "Detailed Pathological Report",
    yieldImpact: "Estimated Yield Impact"
  },
  "Simplified Chinese": {
    title: "农业创世纪",
    home: "首页",
    scanner: "诊断扫描仪",
    futureFarming: "农业的未来",
    heroTitle: "拯救您的",
    heroTitleItalic: "作物。",
    heroSubtitle: "为您的作物部署即时 AI 诊断。在几秒钟内检测疾病，获取有机治疗方案，并在失败蔓延前阻止它。",
    startScan: "开始视觉扫描",
    documentation: "文档",
    detectionRate: "检测率",
    cropsSupported: "支持的作物",
    scanningPathogens: "正在扫描病原体",
    advancedVision: "高级生物视觉",
    diagnosisReady: "诊断就绪",
    organicCare: "有机护理",
    organicCareDesc: "专门针对您的作物表型生成的详细、循序渐进的有机治疗方案。",
    diseaseShield: "疾病盾牌",
    diseaseShieldDesc: "通过先进农业智能驱动的置信度评分，尽早识别害虫和生物威胁。",
    sustainabilityTitle: "可持续性",
    sustainabilityDesc: "获取专家护理建议，以提高未来产量并可持续地防止田间疾病复发。",
    howItWorks: "工作原理",
    step1Title: "视觉设置",
    step1Desc: "使用任何移动设备拍摄受影响植物区域的高分辨率图像。",
    step2Title: "神经分析",
    step2Desc: "我们的 L0 神经网络扫描超过 150 种独特的病原体和代谢缺陷。",
    step3Title: "协议部署",
    step3Desc: "接收根据您的土壤类型量身定制的即时、局部有机和化学治疗方案。",
    impactTitle: "战略影响",
    impact1Title: "粮食安全",
    impact1Desc: "防止局部作物歉收并稳定地区粮食供应。",
    impact2Title: "经济韧性",
    impact2Desc: "在作物需要的时候，精确施用它们需要的肥料，从而降低投入成本。",
    impact3Title: "数据智能",
    impact3Desc: "将视觉数据转化为可操作的收获预测和产量优化。",
    uploadTitle: "初始化分析",
    uploadDesc: "上传横截面或叶片样本",
    symptoms: "可见症状",
    organic: "有机协议",
    chemical: "化学干预",
    prevention: "预防措施",
    syncNew: "同步新扫描",
    indicators: "检测到的指标",
    confidence: "置信系数",
    preventionStrategy: "预防策略",
    sustainability: "可持续性建议",
    biologicalDiagnosis: "生物诊断",
    severeness: "严重程度",
    moderate: "中度",
    spread: "传播",
    standard: "标准",
    processingPathogens: "正在处理病原体...",
    awaitingResults: "等待结果",
    searchLang: "搜索语言...",
    focusPrecision: "焦距精度",
    focusDesc: "分析特定的分解区域",
    l0Diagnostic: "L0 诊断",
    realtimeCheck: "实时病原体检查",
    retry: "重试分析",
    failed: "分析图像失败。请使用更清晰的照片重试。",
    mockDiagnosis: "检测到叶斑病",
    footer: "AgroGenesis 智能系统",
    speakResults: "朗读结果",
    detailedReport: "详细病理报告",
    yieldImpact: "估计产量受损"
  },
  "Traditional Chinese": {
    title: "農業創世紀",
    home: "首頁",
    scanner: "診斷掃描儀",
    futureFarming: "農業的未來",
    heroTitle: "拯救您的",
    heroTitleItalic: "作物。",
    heroSubtitle: "為您的作物部署即時 AI 診斷。在幾秒鐘內檢測疾病，獲取有機治療方案，並在失敗蔓延前阻止它。",
    startScan: "開始視覺掃描",
    documentation: "文檔",
    detectionRate: "檢測率",
    cropsSupported: "支持的作物",
    scanningPathogens: "正在掃描病原體",
    advancedVision: "高級生物視覺",
    diagnosisReady: "診斷就緒",
    organicCare: "有機護理",
    organicCareDesc: "專門針對您的作物表型生成的詳細、循序漸進的有機治療方案。",
    diseaseShield: "疾病盾牌",
    diseaseShieldDesc: "通過先進農業智能驅動的置信度評分，盡早識別害蟲和生物威脅。",
    sustainabilityTitle: "可持續性",
    sustainabilityDesc: "獲取專家護理建議，以提高未來產量並可持續地防止田間疾病復發。",
    howItWorks: "工作原理",
    step1Title: "視覺設置",
    step1Desc: "使用任何移動設備拍攝受影響植物區域的高分辨率圖像。",
    step2Title: "神經分析",
    step2Desc: "我們的 L0 神經網絡掃描超過 150 種獨特的病原體和代謝缺陷。",
    step3Title: "協議部署",
    step3Desc: "接收根據您的土壤類型量身定做的即時、局部有機與化學治療方案。",
    impactTitle: "戰略影響",
    impact1Title: "糧食安全",
    impact1Desc: "防止局部作物歉收並穩定地區糧食供應。",
    impact2Title: "經濟韌性",
    impact2Desc: "在作物需要的時候，精確施用它們需要的肥料，從而降低投入成本。",
    impact3Title: "數據智能",
    impact3Desc: "將視覺數據轉化為可操作的收穫預測和產量優化。",
    uploadTitle: "初始化分析",
    uploadDesc: "上傳橫截面或葉片樣本",
    symptoms: "可見症狀",
    organic: "有機協議",
    chemical: "化學干預",
    prevention: "預防措施",
    syncNew: "同步新掃描",
    indicators: "檢測到的指標",
    confidence: "置信係數",
    preventionStrategy: "預防策略",
    sustainability: "可持續性建議",
    biologicalDiagnosis: "生物診斷",
    severeness: "嚴重程度",
    moderate: "中度",
    spread: "傳播",
    standard: "標準",
    processingPathogens: "正在處理病原體...",
    awaitingResults: "等待結果",
    searchLang: "搜索語言...",
    focusPrecision: "焦距精度",
    focusDesc: "分析特定的分解區域",
    l0Diagnostic: "L0 診斷",
    realtimeCheck: "實時病原體檢查",
    retry: "重試分析",
    failed: "分析圖像失敗。請使用更清晰的照片重試。",
    mockDiagnosis: "檢測到葉斑病",
    footer: "AgroGenesis 智能系統",
    speakResults: "朗讀結果",
    detailedReport: "詳細病理報告",
    yieldImpact: "估計產量受損"
  },
  Urdu: {
    title: "ایگرو جینیسس",
    home: "ہوم",
    scanner: "تشخیصی اسکینر",
    futureFarming: "کاشتکاری کا مستقبل",
    heroTitle: "اپنی فصل",
    heroTitleItalic: "بچائیں۔",
    heroSubtitle: "اپنی فصلوں کے لیے فوری AI تشخیص نافذ کریں۔ سیکنڈوں میں بیماریوں کا پتہ لگائیں، نامیاتی علاج کے طریقے حاصل کریں، اور پھیلنے سے پہلے ناکامی کو روکیں۔",
    startScan: "ویژن اسکین شروع کریں",
    documentation: "دستاویزات",
    detectionRate: "تشخیص کی شرح",
    cropsSupported: "سپورٹ شدہ فصلیں",
    scanningPathogens: "جراثیم کی تلاش جاری ہے",
    advancedVision: "جدید حیاتیاتی وژن",
    diagnosisReady: "تشخیص تیار ہے",
    organicCare: "نامیاتی دیکھ بھال",
    organicCareDesc: "آپ کی فصل کی قسم کے لیے خاص طور پر تیار کردہ تفصیلی، قدم بہ قدم نامیاتی علاج کے طریقے۔",
    diseaseShield: "بیماریوں سے بچاؤ",
    diseaseShieldDesc: "جدید زرعی ذہانت کے ذریعے فراہم کردہ اعتماد کے اسکور کے ساتھ کیڑوں اور حیاتیاتی خطرات کی جلد شناخت کریں۔",
    sustainabilityTitle: "پائیداری",
    sustainabilityDesc: "مستقبل کی پیداوار کو بہتر بنانے اور اپنے کھیتوں میں بیماری کے دوبارہ ہونے کو مستقل طور پر روکنے کے لیے ماہرانہ مشورے حاصل کریں۔",
    uploadTitle: "تجزیہ شروع کریں",
    uploadDesc: "پتے یا فصل کا نمونہ اپ لوڈ کریں",
    symptoms: "ظاہری علامات",
    organic: "نامیاتی طریقہ کار",
    chemical: "کیمیائی طریقہ کار",
    prevention: "تدارکاتی اقدامات",
    syncNew: "نیا اسکین کریں",
    indicators: "شناخت شدہ اشارے",
    confidence: "اعتماد کا تناسب",
    preventionStrategy: "روک تھام کی حکمت عملی",
    sustainability: "پائیداری کا مشورہ",
    biologicalDiagnosis: "حیاتیاتی تشخیص",
    severeness: "شدت",
    moderate: "معتدل",
    spread: "پھیلاؤ",
    standard: "معیاری",
    processingPathogens: "جراثیم کا تجزیہ ہو رہا ہے...",
    awaitingResults: "نتائج کا انتظار ہے",
    searchLang: "زبان تلاش کریں...",
    focusPrecision: "فورس ڈیٹا",
    focusDesc: "خرابی کے مخصوص حصوں کا تجزیہ کریں",
    l0Diagnostic: "تشخیص L0",
    realtimeCheck: "فی الوقت جراثیم کی جانچ",
    retry: "دوبارہ کوشش کریں",
    failed: "تصویر کا تجزیہ کرنے میں ناکامی۔ براہ کرم واضح تصویر کے ساتھ دوبارہ کوشش کریں۔",
    mockDiagnosis: "سیپٹوریا لیف سپاٹ کا پتہ چلا",
    footer: "ایگرو جینیسس انٹیلی جنس سسٹم",
    howItWorks: "یہ کیسے کام کرتا ہے",
    step1Title: "ویژن سیٹ اپ",
    step1Desc: "کسی بھی موبائل ڈیوائس کا استعمال کرتے ہوئے متاثرہ پودے کے حصے کی ہائی ریزولوشن تصویر کھینچیں۔",
    step2Title: "اعصابی تجزیہ",
    step2Desc: "ہمارا L0 نیورل نیٹ ورک 150 سے زیادہ منفرد پیتھوجینز اور میٹابولک کمیوں کو تلاش کرتا ہے۔",
    step3Title: "پروٹوکول کی تعیناتی",
    step3Desc: "اپنی مٹی کی قسم کے مطابق فوری، مقامی نامیاتی اور کیمیائی علاج کے پروٹوکول حاصل کریں۔",
    impactTitle: "تزویراتی اثرات",
    impact1Title: "غذائی تحفظ",
    impact1Desc: "مقامی طور پر فصلوں کی ناکامی کو روکیں اور علاقائی خوراک کی فراہمی کو مستحکم کریں۔",
    impact2Title: "معاشی استحکام",
    impact2Desc: "اپنی فصلوں کی ضرورت کے عین مطابق اور وقت پر استعمال کر کے لاگت میں کمی لائیں۔",
    impact3Title: "ڈیٹا انٹیلی جنس",
    impact3Desc: "بصری ڈیٹا کو قابل عمل فصل کی پیشن گوئی اور پیداوار کی اصلاح میں تبدیل کریں۔",
    speakResults: "نتائج سنیں",
    detailedReport: "تفصیلی تشخیصی رپورٹ",
    yieldImpact: "ممکنہ نقصان"
  },
  Sindhi: {
    title: "ايگرو جينيسسس",
    home: "گھر",
    scanner: "تشخيصي اسڪينر",
    futureFarming: "زراعت جو مستقبل",
    heroTitle: "پنهنجو فصل",
    heroTitleItalic: "بچايو.",
    heroSubtitle: "پنھنجي فصلن لاءِ فوري AI تشخيص تيار ڪريو. سيڪنڊن ۾ بيمارين جو پتو لڳايو، حياتياتي علاج جو طريقو حاصل ڪريو ۽ بيماري کي وڌڻ کان اڳ روڪيو.",
    startScan: "اسڪين شروع ڪريو",
    documentation: "دستاویزات",
    detectionRate: "تشخيص جو ريشو",
    cropsSupported: "سپورٽ ٿيل فصل",
    scanningPathogens: "بيمارين جي اسڪيننگ جاري آهي",
    advancedVision: "جديد حياتياتي نظر",
    diagnosisReady: "رپورٽ تيار آهي",
    organicCare: "حياتياتي سنڀال",
    organicCareDesc: "توهان جي فصل جي قسم لاء تيار ڪيل نامياتي علاج جا طريقا.",
    diseaseShield: "بيماري کان بچاءُ",
    diseaseShieldDesc: "ترقي يافته زرعي ذھانت جي ذريعي بيمارين ۽ جيتن کي جلدي سڃاڻو.",
    sustainabilityTitle: "سنگت ۽ بقا",
    sustainabilityDesc: "فصل جي پيداوار کي بہتر بنائڻ ۽ بيماري کي ٻيھر اچڻ کان روڪڻ لاء ماهرن جون صلاحون.",
    uploadTitle: "تجزيي جي شروعات",
    uploadDesc: "ٻوٽي يا پن جو فوٽو اپلوڊ ڪريو",
    symptoms: "ظاهر ٿيل نشانيون",
    organic: "نامياتي پروٽوڪول",
    chemical: "ڪيميائي علاج",
    prevention: "حفاظتي اپاءُ",
    syncNew: "نئون اسڪين ڪريو",
    indicators: "سڃاڻپ ٿيل نشانيون",
    confidence: "تصديق جو درجو",
    preventionStrategy: "بچاءُ جي حڪمت عملي",
    sustainability: "حفاظتي مشورا",
    biologicalDiagnosis: "حياتياتي تشخيص",
    severeness: "شدت",
    moderate: "معتدل",
    spread: "پکڙجڻ",
    standard: "معياري",
    processingPathogens: "بيمارين جا تجزيا ڪيا پيا وڃن...",
    awaitingResults: "نتيجن جو انتظار آهي",
    searchLang: "ٻولي ڳوليو...",
    focusPrecision: "فوڪس جي درستگي",
    focusDesc: "خراب ٿيل حصن جو خاص جائزو",
    l0Diagnostic: "L0 ڊائگنوسٽڪ",
    realtimeCheck: "زندہ وقت جي چڪاس",
    retry: "ٻيهر ڪوشش ڪريو",
    failed: "ٻيهر ڪوشش ڪريو يا صاف تصوير اپلوڊ ڪريو.",
    mockDiagnosis: "سيپٽوريا پتيءَ جو داغ مليو",
    footer: "ايگرو جينيسس انٽيلجينس سسٽم",
    speakResults: "نتيجا ٻڌو",
    detailedReport: "تفصيلي رپورٽ",
    yieldImpact: "ممڪن نقصان",
    howItWorks: "اهو ڪيئن ڪم ڪندو آهي",
    step1Title: "تصويري ترتيب",
    step1Desc: "موبائل ڪيمرا جي مدد سان بيمار پن يا حصي جو فوٽو ڪڍو.",
    step2Title: "دماغي تجزيو (AI)",
    step2Desc: "اسان جو L0 نيورل سسٽم 150 کان وڌيڪ جراثيمن ۽ ڪمزورين جي سڃاڻپ ڪري ٿو.",
    step3Title: "علاج جي شروعات",
    step3Desc: "پنهنجي مٽي جي هدايتن مطابق نامياتي ۽ ڪيميائي حڪمت عمليون حاصل ڪريو.",
    impactTitle: "فصل تي اثر",
    impact1Title: "غذائي امن",
    impact1Desc: "مجموعي فصل جي نقصان کي روڪي ڪري خوراڪ جي سپلاءِ کي يقيني بنايو.",
    impact2Title: "خرچن ۾ بچت",
    impact2Desc: "فقط گهربل دوائن جي صحيح مقدار استعمال ڪري خرچ گھٽايو.",
    impact3Title: "زرعي تجزيا",
    impact3Desc: "تصويري ڊيٽا جي بنياد تي بهتر فصل ۽ پيداوار جي اڳڪٿي حاصل ڪريو."
  }
};

// Simple helper to get translated string
const t = (lang: string, key: string) => UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS["English"][key];

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'scanner'>('home');
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<ScanHistory[]>([]);

  // Load History from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('agroGenesis_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history from localStorage', e);
      }
    }
  }, []);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, isChatOpen]);

  const filteredLanguages = LANGUAGES.filter(l => l.toLowerCase().includes(langSearch.toLowerCase()));

  const resizeImage = (dataUrl: string, maxWidth = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const saveToHistory = async (img: string, res: AnalysisResult) => {
    try {
      const thumbnail = await resizeImage(img);
      const scanId = Math.random().toString(36).substr(2, 9);
      const newEntry: ScanHistory = {
        id: scanId,
        timestamp: Date.now(),
        image: thumbnail,
        result: res,
        language: selectedLanguage
      };
      
      setHistory(prev => {
        const updated = [newEntry, ...prev].slice(0, 10);
        localStorage.setItem('agroGenesis_history', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Failed to process image for history:', err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem('agroGenesis_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    const utterance = new SpeechSynthesisUtterance();
    
    // Construct the text to speak
    const textParts = [
      result.diseaseName,
      `${t(selectedLanguage, "confidence")}: ${result.confidence}`,
      `${t(selectedLanguage, "detailedReport")}: ${result.detailedAnalysis}`,
      `${t(selectedLanguage, "yieldImpact")}: ${result.yieldImpact}`,
      `${t(selectedLanguage, "indicators")}: ${result.symptoms.join(", ")}`,
      `${t(selectedLanguage, "organic")}: ${result.organicTreatment}`,
      result.chemicalTreatment ? `${t(selectedLanguage, "chemical")}: ${result.chemicalTreatment}` : "",
      `${t(selectedLanguage, "prevention")}: ${result.prevention}`,
      `${t(selectedLanguage, "sustainability")}: ${result.careTips.join(", ")}`
    ].filter(Boolean).join(". ");

    utterance.text = textParts.replace(/[*#]/g, ''); // Strip markdown characters
    utterance.lang = LANG_CODES[selectedLanguage] || 'en-US';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const downloadDiagnosisPDF = async () => {
    if (!result || downloadingPDF) return;
    setDownloadingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let fontName = 'helvetica';
      
      // Dynamic Font Loading for non-Latin scripts to avoid blank blocks or gibberish character mapping
      if (selectedLanguage === "Sindhi" || selectedLanguage === "Urdu") {
        try {
          const fontUrl = "/NotoSansArabic-Regular.ttf";
          const response = await fetch(fontUrl);
          if (!response.ok) throw new Error("Font fetch failed");
          const arrayBuffer = await response.arrayBuffer();
          
          let binary = '';
          const bytes = new Uint8Array(arrayBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const fontBase64 = window.btoa(binary);
          
          doc.addFileToVFS('NotoSansArabic.ttf', fontBase64);
          doc.addFont('NotoSansArabic.ttf', 'NotoSansArabic', 'normal');
          fontName = 'NotoSansArabic';
        } catch (fontErr) {
          console.error("Failed to load Arabic/Sindhi font, falling back to default.", fontErr);
        }
      } else if (selectedLanguage === "Simplified Chinese" || selectedLanguage === "Traditional Chinese") {
        try {
          const fontUrl = "/ZCOOLXiaoWei.ttf";
          const response = await fetch(fontUrl);
          if (!response.ok) throw new Error("Font fetch failed");
          const arrayBuffer = await response.arrayBuffer();
          
          let binary = '';
          const bytes = new Uint8Array(arrayBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const fontBase64 = window.btoa(binary);
          
          doc.addFileToVFS('ZCOOLXiaoWei.ttf', fontBase64);
          doc.addFont('ZCOOLXiaoWei.ttf', 'ChineseFont', 'normal');
          fontName = 'ChineseFont';
        } catch (fontErr) {
          console.error("Failed to load Chinese font, falling back to default.", fontErr);
        }
      }

      // Localized dictionary for PDF labels depending on the user's selected language
      const labelsMap: Record<string, any> = {
        English: {
          headerTitle: "AGROGENESIS DIGITAL REPORT",
          headerSub: "SYSTEM DIAGNOSISTIQUE • PRECISION CROP HEALTH INTELLIGENCE",
          dateLabel: "DATE",
          secTypeLabel: "SECURITY TYPE: BIO-ANALYSIS REPORT",
          verifyStatus: "VERIFY STATUS: COGNITIVE SYSTEM CERTIFIED",
          h1: "1. Biological Crop & Plant Diagnosis",
          lblPrimary: "Primary Diagnosis & Plant Name: ",
          lblConfidence: "AI Diagnosis Confidence Coefficient: ",
          lblSecState: "Security Pathological State: ",
          valNormal: "NORMAL PROTOCOL HEALTHY STABILIZED",
          valInfestation: "PATHO-AGENT CLASSIFIED INFESTATION",
          h2: "2. Diagnostic Analysis & Pathology Explanation",
          h3: "3. Pathological Effects on Plant and Harvest Prediction",
          lblYield: "Economic Harvest / Yield Impact: ",
          lblSpeed: "Infection Speed Profile: ",
          valSpeed: "Standard distribution speed. Bio-organic barriers recommended immediately.",
          h4: "4. Recorded Phenotypic Symptoms & Indicators",
          h5: "5. Primary Treatment: Organic and Biological Protocol",
          h6: "6. Secondary Treatment: Synthetic Chemical Remediation",
          h7: "7. Eco-Prevention Strategies & General Crop Security",
          lblStabilizer: "Long-term Crop Stabilizer Recommendations:",
          confidenceSuffix: "confidence index",
          footerText: "AgroGenesis Systems • Professional Diagnostic Report • Safe Crop Operations",
          watermark1: "AGROGENESIS COGNITIVE SYSTEMS",
          watermark2: "SECURITY INTEL DX MASTER LAB PROTOCOL"
        },
        "Simplified Chinese": {
          headerTitle: "AGROGENESIS 数字化诊断报告",
          headerSub: "诊断系统 • 精准作物健康智能",
          dateLabel: "发布日期",
          secTypeLabel: "安全类型: 生物分析诊断报告",
          verifyStatus: "核验状态: 技术校验中心认证",
          h1: "一、 作物与植物生物学诊断",
          lblPrimary: "首要诊断与植物名称: ",
          lblConfidence: "AI 诊断置信系数: ",
          lblSecState: "安全病理状态: ",
          valNormal: "正常状态: 健康、稳定",
          valInfestation: "病原体侵染状态: 确认感染",
          h2: "二、 病理诊断分析与详情说明",
          h3: "三、 作物病理损害与产量预测",
          lblYield: "经济作物损失 / 产量影响: ",
          lblSpeed: "感染扩散速度等级: ",
          valSpeed: "标准扩散速度。建议立即采取有机生物防治屏障。",
          h4: "四、 记录的植物表型症状和指标",
          h5: "五、 首轮治理方案: 有机和生物防治协议",
          h6: "六、 二轮治理方案: 防治类化学制剂干预",
          h7: "七、 生态预防策略与长期作物安保",
          lblStabilizer: "长期作物稳定化建议与预防护理:",
          confidenceSuffix: "置信指数",
          footerText: "AgroGenesis 系统 • 专业诊断报告 • 作物安全生产作业",
          watermark1: "AGROGENESIS 智能农业系统",
          watermark2: "农业诊断技术实验室安全协议"
        },
        "Traditional Chinese": {
          headerTitle: "AGROGENESIS 數位化診斷報告",
          headerSub: "診斷系統 • 精準作物健康智能",
          dateLabel: "發布日期",
          secTypeLabel: "安全類型: 生物分析診斷報告",
          verifyStatus: "核驗狀態: 技術校驗中心認證",
          h1: "一、 作物與植物生物學診斷",
          lblPrimary: "首要診斷與植物名稱: ",
          lblConfidence: "AI 診斷置信係數: ",
          lblSecState: "安全病理狀態: ",
          valNormal: "正常狀態: 健康、穩定",
          valInfestation: "病原體侵染狀態: 確認感染",
          h2: "二、 病理診斷分析與詳情說明",
          h3: "三、 作物病理損害與產量預測",
          lblYield: "經濟作物損失 / 產量影響: ",
          lblSpeed: "感染擴散速度等級: ",
          valSpeed: "標準擴散速度。建議立即採取有機生物防治屏障。",
          h4: "四、 記錄的植物表型症狀和指標",
          h5: "五、 首輪治理方案: 有機和生物防治協議",
          h6: "六、 二輪治理方案: 防治類化學制劑干預",
          h7: "七、 生態預防策略與長期作物安保",
          lblStabilizer: "長期作物穩定化建議與預防護理:",
          confidenceSuffix: "置信指數",
          footerText: "AgroGenesis 系統 • 專業診斷報告 • 作物安全生產作業",
          watermark1: "AGROGENESIS 智能農業系統",
          watermark2: "農業診斷技術實驗室安全協議"
        },
        Urdu: {
          headerTitle: "ایگرو جینیسس ڈیجیٹل رپورٹ",
          headerSub: "تشخیصی نظام • درست فصل صحت انٹیلی جنس",
          dateLabel: "تاریخ",
          secTypeLabel: "سیکورٹی کی قسم: حیاتیاتی تجزیہ رپورٹ",
          verifyStatus: "تصدیق کی حیثیت: علمی نظام مصدقہ",
          h1: "1. حیاتیاتی فصل اور پودوں کی تشخیص",
          lblPrimary: "بنیادی تشخیص اور پودے کا نام: ",
          lblConfidence: "AI تشخیص اعتماد کا عنصر: ",
          lblSecState: "سیکورٹی پیتھولوجیکل اسٹیٹ: ",
          valNormal: "عام پروٹوکول صحت مند مستحکم",
          valInfestation: "پیتھو ایجنٹ درجہ بند انفیکشن",
          h2: "2. تشخیصی تجزیہ اور پیتھالوجی کی وضاحت",
          h3: "3. پودوں پر پیتھولوجیکل اثرات اور فصل کی پیشن گوئی",
          lblYield: "اقتصادی فصل / پیداوار کا اثر: ",
          lblSpeed: "انفیکشن پھیلنے کا پروفائل: ",
          valSpeed: "معیاری رفتار۔ فوری طور پر نامیاتی حیاتیاتی علاج تجویز کیا جاتا ہے۔",
          h4: "4. درج کردہ علامات اور مشاہدہ شدہ اشارے",
          h5: "5. بنیادی علاج: نامیاتی اور حیاتیاتی طریقہ کار",
          h6: "6. ثانوی علاج: مصنوعی کیمیائی علاج",
          h7: "7. ماحولیاتی روک تھام کی حکمت عملی اور فصلوں کی حفاظت",
          lblStabilizer: "طویل مدتی فصل کو مستحکم کرنے کی سفارشات:",
          confidenceSuffix: "اعتماد کا اشاریہ",
          footerText: "ایگرو جینیسس سسٹمز • پیشہ ورانہ تشخیصی رپورٹ • محفوظ فصل کے آپریشنز",
          watermark1: "ایگرو جینیسس علمی نظام",
          watermark2: "سیکورٹی انٹیل تشخیصی لیب پروٹوکول"
        },
        Sindhi: {
          headerTitle: "ايگرو جينيسيس ڊيجيٽل رپورٽ",
          headerSub: "تشخيصي نظام • فصلن جي صحت لاءِ ترقي يافته ذھانت",
          dateLabel: "تاريخ",
          secTypeLabel: "سيڪيورٽي قسم: حياتياتي تجزيو رپورٽ",
          verifyStatus: "تصديق جو درجو: اي آئي سسٽم پاران منظور ٿيل",
          h1: "1. ٻوٽي ۽ فصل جي حياتياتي تشخيص",
          lblPrimary: "بنيادي تشخيص ۽ ٻوٽي جو نالو: ",
          lblConfidence: "اي آئي تشخيص جي تصديق جو درجو: ",
          lblSecState: "فصل جي بيماري جو درجو: ",
          valNormal: "عام پروٽوڪول: ٻوٽو صحتمند ۽ محفوظ آھي",
          valInfestation: "حياتياتي جراثيم جو خطرناڪ حملو",
          h2: "2. بيماري جو تجزيو ۽ تفصيلي وضاحت",
          h3: "3. ٻوٽي تي بيماري جو اثر ۽ پيداوار جو اڳڪٿي",
          lblYield: "اقتصادي نقصان ۽ پيداوار تي اثر: ",
          lblSpeed: "بيماري جي پکڙجڻ جي رفتار: ",
          valSpeed: "معياري رفتار. ترت ئي نامياتي طريقيڪار جي سفارش ڪئي وڃي ٿي.",
          h4: "4. رڪارڊ ڪيل نشانيون ۽ ظاهر ٿيل ثبوت",
          h5: "5. بنيادي علاج: نامياتي ۽ حياتياتي حڪمت عملي",
          h6: "6. ثانوي علاج: ڪيميائي تدارڪاتي اپاءُ",
          h7: "7. ماحول دوست بچاءُ واري حڪمت عملي ۽ فصل جي سيڪيورٽي",
          lblStabilizer: "ڊگھي مدت لاء ٻوٽي جي صحت برقرار رکڻ جون صلاحون:",
          confidenceSuffix: "تصديق جو درجو",
          footerText: "ايگرو جينيسس سسٽم • پيشه ورانه تشخيصي رپورٽ • محفوظ فصل عمليات",
          watermark1: "ايگرو جينيسس سسٽم ٻوٽن جي صحت",
          watermark2: "حفاظتي ۽ تشخيصي ليبارٽري پروٽوڪول"
        }
      };

      const labels = labelsMap[selectedLanguage] || labelsMap["English"];

      const setDocFont = (style: 'normal' | 'bold' | 'italic' | 'bolditalic') => {
        if (fontName === 'helvetica') {
          doc.setFont('helvetica', style);
        } else {
          doc.setFont(fontName, 'normal');
        }
      };

      // Corporate/Scientific palette
      const emerald = [16, 185, 129];
      const slate = [30, 41, 59];

      let y = 45;
      let pageNumber = 1;

      const checkPageSpace = (neededHeight: number) => {
        if (y + neededHeight > 265) {
          doc.addPage();
          pageNumber++;
          drawWatermark();
          drawPageBorderAndFooter(pageNumber);
          y = 30; // Reset y coordinate on the new page
        }
      };

      const drawWatermark = () => {
        doc.saveGraphicsState();
        doc.setTextColor(242, 249, 245); // highly subtle light-toned gray-green
        doc.setFontSize(24);
        setDocFont('bolditalic');
        // Rotating diagonal watermarks across the canvas
        for (let row = 40; row < 280; row += 75) {
          doc.text(labels.watermark1, 12, row, { angle: 12 });
          doc.text(labels.watermark2, 30, row + 35, { angle: 12 });
        }
        doc.restoreGraphicsState();
      };

      const drawPageBorderAndFooter = (pageNum: number) => {
        // Border frame
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, 190, 277, 'S');

        // Footer block
        setDocFont('normal');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(labels.footerText, 15, 282);
        
        const pageLabel = selectedLanguage === "Spanish" ? "Página" :
                          selectedLanguage === "French" ? "Page" :
                          selectedLanguage === "German" ? "Seite" :
                          selectedLanguage === "Italian" ? "Pagina" :
                          selectedLanguage === "Ukrainian" ? "Storinka" : "Page";
        doc.text(`${pageLabel} ${pageNum}`, 195, 282, { align: 'right' });
      };

      // Header Banner block
      const drawReportHeader = () => {
        doc.setFillColor(16, 185, 129); // Emerald Background
        doc.rect(12, 12, 186, 22, 'F');
        
        const isRtlLang = ["Arabic", "Urdu", "Sindhi"].includes(selectedLanguage);
        
        setDocFont('bold');
        doc.setFontSize(13); // safer font size for longer titles
        doc.setTextColor(255, 255, 255);
        
        if (isRtlLang) {
          doc.text(labels.headerTitle, 192, 21, { align: 'right' });
        } else {
          doc.text(labels.headerTitle, 16, 21);
        }
        
        setDocFont('normal');
        doc.setFontSize(8.5);
        
        if (isRtlLang) {
          doc.text(labels.headerSub, 192, 28, { align: 'right' });
        } else {
          doc.text(labels.headerSub, 16, 28);
        }

        // Date and Metadata alignment on the right / left
        const todayStr = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        doc.setFontSize(7.5);
        if (isRtlLang) {
          doc.text(`${labels.dateLabel}: ${todayStr}`, 16, 18, { align: 'left' });
          doc.text(labels.secTypeLabel, 16, 23, { align: 'left' });
          doc.text(labels.verifyStatus, 16, 28, { align: 'left' });
        } else {
          doc.text(`${labels.dateLabel}: ${todayStr}`, 192, 18, { align: 'right' });
          doc.text(labels.secTypeLabel, 192, 23, { align: 'right' });
          doc.text(labels.verifyStatus, 192, 28, { align: 'right' });
        }
      };

      // Initial page drawing
      drawWatermark();
      drawPageBorderAndFooter(pageNumber);
      drawReportHeader();

      const writeHeading = (text: string) => {
        y += 7;
        checkPageSpace(12);
        
        // Background Strip for the beautiful colorful heading
        doc.setFillColor(240, 246, 242);
        doc.rect(15, y - 5, 180, 8, 'F');
        
        // Accent Color Side-bar
        doc.setFillColor(16, 185, 129);
        doc.rect(15, y - 5, 3, 8, 'F');

        // Heading title core formatting
        doc.setFontSize(10);
        setDocFont('bold');
        doc.setTextColor(16, 185, 129);
        
        const isRtlLang = ["Arabic", "Urdu", "Sindhi"].includes(selectedLanguage);
        if (isRtlLang) {
          doc.text(text, 191, y - 0.2, { align: 'right' });
        } else {
          doc.text(text.toUpperCase(), 22, y - 0.2);
        }
        
        y += 7;
      };

      const writeText = (text: string, options?: {
        fontSize?: number;
        color?: number[];
        isBold?: boolean;
        isItalic?: boolean;
        lineGap?: number;
        marginTop?: number;
      }) => {
        const fontSize = options?.fontSize || 9.5;
        const color = options?.color || slate;
        const isBold = options?.isBold || false;
        const isItalic = options?.isItalic || false;
        const lineGap = options?.lineGap || 5;
        const marginTop = options?.marginTop !== undefined ? options.marginTop : 0;

        y += marginTop;

        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        
        if (isBold && isItalic) {
          setDocFont('bolditalic');
        } else if (isBold) {
          setDocFont('bold');
        } else if (isItalic) {
          setDocFont('italic');
        } else {
          setDocFont('normal');
        }

        const max_width = 175;
        const splitLines = doc.splitTextToSize(text, max_width);
        const isRtlLang = ["Arabic", "Urdu", "Sindhi"].includes(selectedLanguage);
        
        for (let i = 0; i < splitLines.length; i++) {
          checkPageSpace(lineGap);
          if (isRtlLang) {
            doc.text(splitLines[i], 193, y, { align: 'right' });
          } else {
            doc.text(splitLines[i], 18, y);
          }
          y += lineGap;
        }
      };

      // 1. Biological Plant Diagnosis Heading & Scope
      writeHeading(labels.h1);
      
      const diagnosisStr = result.diseaseName;
      const confidenceStr = result.confidence;
      const statusTitle = diagnosisStr.toLowerCase().includes('healthy') ? labels.valNormal : labels.valInfestation;

      writeText(`${labels.lblPrimary}${diagnosisStr}`, { isBold: true, fontSize: 10 });
      writeText(`${labels.lblConfidence}${confidenceStr} ${labels.confidenceSuffix}`, { isBold: true, color: emerald });
      
      // Determine biological path state color (green vs red)
      const isHealthy = diagnosisStr.toLowerCase().includes('healthy') || diagnosisStr.toLowerCase().includes('स्वस्थ') || diagnosisStr.toLowerCase().includes('sustha') || diagnosisStr.toLowerCase().includes('sog\'lom');
      writeText(`${labels.lblSecState}${statusTitle}`, { 
        isBold: true, 
        color: isHealthy ? emerald : [220, 38, 38] 
      });
      y += 2.5;

      // 2. Diagnostics & Explanation
      writeHeading(labels.h2);
      writeText(result.detailedAnalysis, { isItalic: true });

      // 3. Effects on Breed
      writeHeading(labels.h3);
      
      writeText(`${labels.lblYield}${result.yieldImpact}`, { isBold: true, color: [217, 119, 6] });
      writeText(`${labels.lblSpeed}${labels.valSpeed}`);
      y += 2.5;

      // 4. Symptoms Listing
      if (result.symptoms && result.symptoms.length > 0) {
        writeHeading(labels.h4);
        for (const sym of result.symptoms) {
          writeText(`• ${sym}`);
        }
      }

      // 5. Treatment Protocol (Organic)
      writeHeading(labels.h5);
      const organicStr = Array.isArray(result.organicTreatment) ? result.organicTreatment.join('\n\n') : result.organicTreatment;
      writeText(organicStr);

      // 6. Treatment Protocol (Chemical)
      writeHeading(labels.h6);
      const chemicalStr = Array.isArray(result.chemicalTreatment) ? result.chemicalTreatment.join('\n\n') : (result.chemicalTreatment || 'Biological state does not configure immediate chemical interventions.');
      writeText(chemicalStr);

      // 7. General Care & Prevention
      writeHeading(labels.h7);
      writeText(result.prevention);

      if (result.careTips && result.careTips.length > 0) {
        y += 4;
        writeText(labels.lblStabilizer, { isBold: true });
        for (const tip of result.careTips) {
          writeText(`  - ${tip}`);
        }
      }

      // Final save instruction
      const safeSuffix = diagnosisStr.toLowerCase().replace(/[^a-z0-9]/g, "_");
      doc.save(`AgroGenesis_Digital_Report_${safeSuffix}.pdf`);
    } catch (err) {
      console.error("PDF generation error: ", err);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleSendMessage("", base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setChatError(null);
    } catch (err) {
      setChatError(selectedLanguage === "English" ? "Microphone access denied. Please check your browser permissions." : "माइक्रोफ़ोन एक्सेस अस्वीकार कर दिया गया। कृपया अनुमति जांचें।");
      setIsRecording(false);
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (text: string, audioBase64?: string) => {
    if (!text.trim() && !audioBase64) return;
    if (!result) return;

    const userMsg: ChatMessage = { 
      role: 'user', 
      content: text || (selectedLanguage === "English" ? "Voice Message" : "صوتية"), 
      isAudio: !!audioBase64 
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      const historyForAI = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithAgriBot(text, result, selectedLanguage, historyForAI, audioBase64);
      setChatMessages(prev => [...prev, { role: 'bot', content: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Content = (reader.result as string).split(',')[1];
      setImage(reader.result as string);
      processImage(base64Content, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, fullDataUrl: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setChatMessages([]); // Reset chat for new scan
    try {
      const data = await analyzeCropPhoto(base64, selectedLanguage);
      setResult(data);
      saveToHistory(fullDataUrl, data);
    } catch (err) {
      setError(t(selectedLanguage, "failed"));
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setImage(null);
    setResult(null);
    setError(null);
  };

  const isRTL = ["Arabic", "Urdu", "Sindhi"].includes(selectedLanguage);

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 text-emerald-500"
        >
          <Leaf size={600} strokeWidth={0.2} />
        </motion.div>
      </div>

      {/* Persistent Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setCurrentView('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Sprout className="text-slate-950" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              AGRO<span className="text-emerald-500 underline underline-offset-4 decoration-2">GENESIS</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => setCurrentView('home')} 
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                currentView === 'home' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {t(selectedLanguage, "home")}
            </button>
            <button 
              onClick={() => setCurrentView('scanner')} 
              className={cn(
                "hidden md:block text-xs font-bold uppercase tracking-widest transition-colors",
                currentView === 'scanner' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {t(selectedLanguage, "scanner")}
            </button>
            
            <div className="h-6 w-[1px] bg-slate-800 hidden md:block" />

            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 p-2 px-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all relative group"
              title="Recent Scans"
            >
              <History size={18} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest transition-all">History</span>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              )}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 hover:border-emerald-500/50 transition-colors"
              >
                <Globe size={12} className="text-emerald-400" />
                <span className="hidden sm:inline">{selectedLanguage}</span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute end-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950">
                        <Search size={12} className="text-slate-500 ml-2" />
                        <input 
                          type="text" 
                          placeholder={t(selectedLanguage, "searchLang")} 
                          className="bg-transparent border-none text-[10px] text-white focus:ring-0 w-full"
                          value={langSearch}
                          onChange={(e) => setLangSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto py-2">
                        {filteredLanguages.map(lang => (
                          <button
                            key={lang}
                            onClick={() => {
                              setSelectedLanguage(lang);
                              setShowLangMenu(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-[11px] font-medium transition-colors hover:bg-slate-800",
                              selectedLanguage === lang ? "text-emerald-400 bg-emerald-500/5" : "text-slate-400"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-16 h-full">
        <AnimatePresence mode="wait">
          {currentView === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-6xl mx-auto px-6 py-20 pb-32"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-emerald-500 font-mono text-sm tracking-[0.3em] uppercase mb-4 block">{t(selectedLanguage, "futureFarming")}</span>
                    <h2 className="text-6xl md:text-8xl font-bold text-white leading-[0.9] mb-8">
                      {t(selectedLanguage, "heroTitle")} <span className="text-emerald-500 italic">{t(selectedLanguage, "heroTitleItalic")}</span>
                    </h2>
                    <p className="text-slate-400 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
                      {t(selectedLanguage, "heroSubtitle")}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => setCurrentView('scanner')}
                        className="px-8 py-4 bg-emerald-500 text-slate-950 font-bold rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center gap-3"
                      >
                        <Camera size={20} />
                        {t(selectedLanguage, "startScan")}
                      </button>
                      <button className="px-8 py-4 bg-slate-900 border border-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm uppercase tracking-widest">
                        {t(selectedLanguage, "documentation")}
                      </button>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-900">
                    <div>
                      <h4 className="text-4xl font-bold text-white mb-1">98%</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t(selectedLanguage, "detectionRate")}</p>
                    </div>
                    <div>
                      <h4 className="text-4xl font-bold text-white mb-1">150+</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{t(selectedLanguage, "cropsSupported")}</p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  {/* Decorative Scan Frame */}
                  <div className="aspect-[4/5] rounded-[48px] bg-slate-900 border border-slate-800 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                    
                    {/* Abstract Plant Representation (Visual) */}
                    <div className="absolute inset-0 flex items-center justify-center scale-110">
                       <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 opacity-20"
                       >
                         <Leaf size={400} className="text-emerald-500 absolute top-0 left-0" />
                         <Leaf size={400} className="text-emerald-400 absolute bottom-0 right-0 rotate-180" />
                       </motion.div>
                       
                       <div className="relative z-20 space-y-6 text-center">
                         <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto">
                            <ShieldAlert className="text-emerald-500" size={40} />
                         </div>
                         <div className="glass-card px-8 py-4 border-emerald-500/20">
                           <p className="text-xs font-mono text-emerald-400 mb-1">{t(selectedLanguage, "scanningPathogens")}</p>
                           <h4 className="text-xl font-bold text-white">{t(selectedLanguage, "advancedVision")}</h4>
                         </div>
                       </div>
                    </div>
                    
                    {/* Viewfinder Corners */}
                    <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-emerald-500" />
                    <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-emerald-500" />
                    <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-emerald-500" />
                    <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-emerald-500" />
                    
                    <motion.div 
                      animate={{ y: ["0%", "100%", "0%"] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-[1px] bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,1)] z-30"
                    />
                  </div>
                  
                  {/* Floating Notification */}
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="absolute -bottom-6 -right-6 glass-card p-6 border-emerald-500/40 shadow-2xl z-40 max-w-[200px]"
                  >
                    <div className="flex items-center gap-3 mb-2">
                       <CheckCircle2 className="text-emerald-500" size={20} />
                       <span className="text-[10px] font-bold uppercase text-slate-400">{t(selectedLanguage, "diagnosisReady")}</span>
                    </div>
                    <p className="text-sm font-bold text-white italic">{t(selectedLanguage, "mockDiagnosis")}</p>
                  </motion.div>
                </div>
              </div>

              {/* How it Works Section */}
              <div className="mt-40 space-y-20">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{t(selectedLanguage, "howItWorks")}</h2>
                  <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="relative z-10 bg-slate-950 p-8 rounded-3xl border border-slate-800 space-y-6 group hover:border-emerald-500/30 transition-all duration-500">
                      <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        {step}
                      </div>
                      <h3 className="text-xl font-bold text-white">{t(selectedLanguage, `step${step}Title`)}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        {t(selectedLanguage, `step${step}Desc`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Offer Section */}
              <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-8 glass-card space-y-6 group hover:border-emerald-500/30 transition-colors">
                  <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800">
                    <HeartPulse className="text-emerald-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{t(selectedLanguage, "organicCare")}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {t(selectedLanguage, "organicCareDesc")}
                    </p>
                  </div>
                </div>
                
                <div className="p-8 glass-card space-y-6 group hover:border-emerald-500/30 transition-colors">
                  <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800">
                    <ShieldAlert className="text-amber-500" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{t(selectedLanguage, "diseaseShield")}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {t(selectedLanguage, "diseaseShieldDesc")}
                    </p>
                  </div>
                </div>

                <div className="p-8 glass-card space-y-6 group hover:border-emerald-500/30 transition-colors">
                  <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800">
                    <Sprout className="text-blue-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{t(selectedLanguage, "sustainabilityTitle")}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {t(selectedLanguage, "sustainabilityDesc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategic Impact Section */}
              <div className="mt-40 p-12 bg-slate-900/50 rounded-[48px] border border-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-8">
                     <h2 className="text-4xl font-bold text-white">{t(selectedLanguage, "impactTitle")}</h2>
                     <p className="text-slate-500 leading-relaxed">
                       AgroGenesis is not just a scanner; it is a critical layer in the global agricultural infrastructure. We empower farmers to transition from reactive to proactive land management.
                     </p>
                     <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                               <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <div>
                               <h4 className="text-white font-bold mb-1">{t(selectedLanguage, `impact${i}Title`)}</h4>
                               <p className="text-sm text-slate-500">{t(selectedLanguage, `impact${i}Desc`)}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="relative group overflow-hidden rounded-3xl">
                     <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                     <div className="aspect-square bg-slate-950 flex items-center justify-center border border-slate-800">
                        <Globe className="text-emerald-500/20 w-64 h-64 absolute" />
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="relative z-10 text-center space-y-4"
                        >
                           <p className="text-6xl font-black text-white italic">AI</p>
                           <p className="text-xs font-mono text-emerald-500 tracking-widest">INFRASTRUCTURE</p>
                        </motion.div>
                     </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div id="faqs" className="mt-40 space-y-20">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Common <span className="text-emerald-500 italic">Queries</span></h2>
                  <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      q: "How accurate is the AI diagnosis?",
                      a: "Our neural networks are trained on over 1.2 million validated samples, achieving a confidence coefficient of 94.8% for major crops."
                    },
                    {
                      q: "Does it work for organic farming?",
                      a: "Absolutely. Our primary focus is sustainable agriculture. Every diagnosis includes bio-organic protocol recommendations."
                    },
                    {
                      q: "Do I need a specialized camera?",
                      a: "No. AgroGenesis is optimized for standard mobile lenses. Natural daylight and clear focus are all that's required."
                    },
                    {
                      q: "How does 'Precision Intelligence' help?",
                      a: "It prevents indiscriminate spraying by identifying exact pathogens, reducing resource waste by up to 60%."
                    },
                    {
                      q: "What crops are currently supported?",
                      a: "We currently support over 40 global crop varieties, emphasizing regional staples and nutritional security."
                    },
                    {
                      q: "Can I use it offline?",
                      a: "Initial diagnostics require an active neural link (internet), but protocols can be saved to your local history for field use."
                    }
                  ].map((faq, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <h3 className="text-white font-bold text-lg mb-3 flex gap-3 italic">
                        <span className="text-emerald-500 not-italic">Q.</span> {faq.q}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed font-semibold">
                        {faq.a}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Founder Signature (Reduced) */}
              <footer className="w-full max-w-4xl mx-auto px-6 pt-16 pb-24 text-center mt-40 border-t border-white/5 bg-gradient-to-t from-emerald-500/[0.02] to-transparent">
                <div className="flex flex-col items-center gap-6 mb-8">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.5em]">Founder & Chief Architect</span>
                      </div>
                      <p className="text-white text-5xl font-extrabold tracking-tighter italic drop-shadow-2xl">Azad Ali</p>
                    </div>
                  </div>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="max-w-2xl mx-auto px-6 py-12 md:py-16 h-full"
            >
              <AnimatePresence mode="wait">
                {!image ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-8"
                  >
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative h-96 glass-card flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-slate-900/80"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Viewfinder corners */}
                      <div className="absolute top-6 start-6 w-8 h-8 border-t-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />
                      <div className="absolute top-6 end-6 w-8 h-8 border-t-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />
                      <div className="absolute bottom-6 start-6 w-8 h-8 border-b-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />
                      <div className="absolute bottom-6 end-6 w-8 h-8 border-b-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-500/60 transition-colors" />

                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="p-6 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl mb-6 relative z-10"
                      >
                        <Camera className="text-emerald-400" size={48} />
                      </motion.div>
                      
                      <h3 className="text-xl font-medium text-white mb-2">{t(selectedLanguage, "uploadTitle")}</h3>
                      <p className="text-slate-400 text-sm">{t(selectedLanguage, "uploadDesc")}</p>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 glass-card flex items-start gap-4">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <ShieldAlert className="text-amber-500" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{t(selectedLanguage, "focusPrecision")}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t(selectedLanguage, "focusDesc")}</p>
                        </div>
                      </div>
                      <div className="p-5 glass-card flex items-start gap-4">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                          <CheckCircle2 className="text-blue-400" size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{t(selectedLanguage, "l0Diagnostic")}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t(selectedLanguage, "realtimeCheck")}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Image Preview & Vision HUD */}
                    <div className="relative rounded-[32px] overflow-hidden shadow-2xl bg-slate-900 aspect-video border border-slate-800">
                      <img src={image} alt="Crop preview" className="w-full h-full object-cover opacity-80" />
                      
                      {/* Scanning Lines (Visual Flavor) */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-[20px] border-slate-950/20" />
                        <motion.div 
                          animate={{ y: ["0%", "100%", "0%"] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute top-0 left-0 w-full h-[2px] bg-emerald-400/30 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                        />
                      </div>

                      {analyzing && (
                        <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white backdrop-blur-md">
                          <RefreshCw className="animate-spin mb-6 text-emerald-400" size={56} />
                          <p className="font-display tracking-[0.2em] text-xs uppercase font-bold text-emerald-400">{t(selectedLanguage, "processingPathogens")}</p>
                        </div>
                      )}
                      
                      {!analyzing && (
                        <>
                          <button 
                            onClick={reset}
                            className="absolute top-6 start-6 p-3 bg-slate-950/80 backdrop-blur-md rounded-2xl text-white border border-slate-800 hover:bg-slate-900 transition-colors"
                          >
                            <ChevronLeft size={20} className="rtl:rotate-180" />
                          </button>
                          {!result && (
                            <div className="absolute bottom-6 start-6 glass-card px-4 py-2 border-emerald-500/20">
                               <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">{t(selectedLanguage, "awaitingResults")}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {error && (
                      <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-200 rounded-3xl flex items-center gap-4 backdrop-blur-sm">
                        <div className="p-2 bg-red-500 rounded-lg"><AlertCircle size={20} className="text-white" /></div>
                        <p className="text-sm font-medium">{t(selectedLanguage, "failed")}</p>
                        <button onClick={() => processImage(image.split(',')[1], image)} className="ml-auto text-xs font-bold underline text-red-400 hover:text-red-300">{t(selectedLanguage, "retry")}</button>
                      </div>
                    )}

                    {result && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                      >
                        {/* Diagnosis Result */}
                        <div className="glass-card p-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]",
                              result.diseaseName === 'Healthy' ? "text-emerald-400 bg-emerald-400" : "text-red-500 bg-red-500"
                            )} />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{t(selectedLanguage, "biologicalDiagnosis")}</span>
                          </div>
                          
                          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
                            <div>
                              <div className="flex flex-wrap items-center gap-4 mb-2">
                                <h2 className="text-4xl font-bold text-white leading-none">{result.diseaseName}</h2>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={handleToggleSpeak}
                                    className={cn(
                                      "p-3 rounded-2xl transition-all",
                                      isSpeaking 
                                        ? "bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse" 
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                                    )}
                                    title={t(selectedLanguage, "speakResults")}
                                  >
                                    {isSpeaking ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                  </button>

                                  <button 
                                    onClick={downloadDiagnosisPDF}
                                    disabled={downloadingPDF}
                                    className="p-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-2xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest px-4 shadow-[0_10px_20px_rgba(16,185,129,0.2)] group"
                                    title="Download Report as PDF"
                                  >
                                    <Download size={18} className={cn("transition-transform", downloadingPDF ? "animate-bounce" : "group-hover:translate-y-0.5")} />
                                    <span>
                                      {downloadingPDF 
                                        ? (selectedLanguage === "Sindhi" ? "رپورٽ تيار ٿي رهي آهي..." : 
                                           selectedLanguage === "Urdu" ? "رپورٹ تیار ہو رہی ہے..." : 
                                           selectedLanguage === "Simplified Chinese" ? "正在准备报告..." : 
                                           selectedLanguage === "Traditional Chinese" ? "正在準備報告..." : "Preparing...") 
                                        : (selectedLanguage === "Sindhi" ? "پي ڊي ايف ڊائون لوڊ ڪريو" : 
                                           selectedLanguage === "Urdu" ? "پی ڈی ایف ڈاؤن لوڈ کریں" : 
                                           selectedLanguage === "Simplified Chinese" ? "下载 PDF" : 
                                           selectedLanguage === "Traditional Chinese" ? "下載 PDF" : "Download PDF")}
                                    </span>
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-400 text-sm font-medium">{t(selectedLanguage, "confidence")}: <span className="text-emerald-400 font-mono">{result.confidence} Index</span></p>
                            </div>
                            
                            <div className="flex-shrink-0 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800">
                               <p className="text-xs uppercase font-bold text-slate-500 mb-1 tracking-widest">{t(selectedLanguage, "yieldImpact")}</p>
                               <p className="text-xl font-bold text-orange-400">{result.yieldImpact}</p>
                            </div>
                          </div>

                          {/* Detailed Analysis Section */}
                          <div className="mb-10 p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                            <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                              <Sprout size={20} />
                              {t(selectedLanguage, "detailedReport")}
                            </h3>
                            <p className="text-slate-300 leading-relaxed italic">
                              {result.detailedAnalysis}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-y border-slate-800">
                            <div>
                               <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">{t(selectedLanguage, "indicators")}</p>
                               <div className="flex flex-wrap gap-2">
                                 {result.symptoms.map((s, i) => (
                                   <span key={i} className="text-xs px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                                     {s}
                                   </span>
                                 ))}
                               </div>
                            </div>
                            <div className="flex flex-col justify-end">
                              <div className="flex items-center gap-6">
                                 <div>
                                   <p className="text-[10px] uppercase font-bold text-slate-500">{t(selectedLanguage, "severeness")}</p>
                                   <p className={cn("font-bold", result.diseaseName === 'Healthy' ? "text-emerald-400" : "text-amber-500")}>{t(selectedLanguage, "moderate")}</p>
                                 </div>
                                 <div>
                                   <p className="text-[10px] uppercase font-bold text-slate-500">{t(selectedLanguage, "spread")}</p>
                                   <p className="text-red-400 font-bold">{t(selectedLanguage, "standard")}</p>
                                 </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Treatment Protocol */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <section className="glass-card p-8 group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
                            <div className="flex items-center gap-3 mb-6 text-emerald-400">
                              <HeartPulse size={24} />
                              <h3 className="text-sm font-bold uppercase tracking-widest">{t(selectedLanguage, "organic")}</h3>
                            </div>
                            <div className="text-slate-400 text-sm leading-relaxed prose prose-invert max-w-none">
                              <Markdown>{Array.isArray(result.organicTreatment) ? result.organicTreatment.join('\n\n') : result.organicTreatment}</Markdown>
                            </div>
                          </section>
                          
                          <section className="bg-slate-900 border border-slate-800 rounded-[32px] p-8">
                            <div className="flex items-center gap-3 mb-6 text-slate-400">
                              <ShieldAlert size={24} />
                              <h3 className="text-sm font-bold uppercase tracking-widest">{t(selectedLanguage, "chemical")}</h3>
                            </div>
                            <div className="text-slate-500 text-sm leading-relaxed">
                              <Markdown>{Array.isArray(result.chemicalTreatment) ? result.chemicalTreatment.join('\n\n') : (result.chemicalTreatment || 'Chemical intervention not required for current phenotype.')}</Markdown>
                            </div>
                          </section>
                        </div>

                        {/* Prevention Strategy */}
                        <section className="bg-emerald-600 rounded-[32px] p-10 text-slate-950 relative overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.2)]">
                          <div className="absolute -bottom-10 -right-10 opacity-20 rotate-12">
                            <Leaf size={240} />
                          </div>
                          
                          <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                               <div className="p-2 bg-slate-950/10 rounded-xl"><CheckCircle2 size={24} /></div>
                               {t(selectedLanguage, "prevention")}
                            </h3>
                            <p className="text-slate-950 font-medium mb-8 leading-relaxed max-w-lg">
                              {result.prevention}
                            </p>
                            
                            <div className="pt-8 border-t border-slate-950/10">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 opacity-70">{t(selectedLanguage, "sustainability")}</p>
                              <div className="flex flex-wrap gap-2">
                                {result.careTips.map((tip, i) => (
                                  <span key={i} className="bg-slate-950 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                                    {tip}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        <button 
                          onClick={reset}
                          className="w-full py-5 rounded-2xl bg-emerald-500 text-slate-950 font-bold shadow-[0_10px_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg group"
                        >
                          {t(selectedLanguage, "syncNew")}
                          <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer id="main-footer" className="w-full max-w-4xl mx-auto px-6 pt-16 pb-24 text-center mt-20 border-t border-white/5 bg-gradient-to-t from-emerald-500/[0.02] to-transparent">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse delay-150"></span>
                </div>
                <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.5em]">Founder & Chief Architect</span>
              </div>
              <p className="text-white text-5xl font-black tracking-tighter italic drop-shadow-2xl">Azad Ali</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-xl mx-auto space-y-10">
          <p className="text-slate-400 text-base leading-relaxed font-medium px-4 italic border-l-2 border-emerald-500/20 py-2">
            Driving innovation in agricultural technology by applying advanced domain knowledge to solve real-world farming challenges. This platform represents a commitment to sustainable crop health through precision intelligence.
          </p>
          
          <div className="flex flex-col items-center gap-6 pt-8">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Contact us on</p>
              <a 
                href="mailto:azadali201151@gmail.com" 
                className="group flex items-center gap-4 px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl transition-all duration-300"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping"></div>
                <span className="text-white/80 group-hover:text-white text-sm font-bold tracking-widest transition-colors font-mono">
                  azadali201151@gmail.com
                </span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-10 border-t border-white/[0.03] text-white/10 font-mono tracking-[0.3em] uppercase text-[9px] flex items-center justify-center gap-3">
          <span className="w-10 h-[1px] bg-white/5"></span>
          {t(selectedLanguage, "footer")} • V4.0.2
          <span className="w-10 h-[1px] bg-white/5"></span>
        </div>
      </footer>

      {/* Floating Assistant Button */}
      {result && (
        <motion.button
          initial={{ scale: 0, opacity: 0, x: 50 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 z-[60] flex items-center gap-3 bg-emerald-500 text-slate-950 px-6 py-4 rounded-full shadow-[0_20px_50px_rgba(16,185,129,0.4)] border-2 border-emerald-400/20 group rtl:right-auto rtl:left-8"
        >
          <div className="relative">
            <MessageSquare size={24} className="fill-slate-950/20" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-emerald-500 animate-pulse" />
          </div>
          <span className="font-black tracking-tighter text-lg uppercase">Ask AI</span>
          
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-white/40 -z-10"
          />
        </motion.button>
      )}

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-end p-4 md:p-8 pointer-events-none rtl:justify-start">
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md pointer-events-auto" onClick={() => setIsChatOpen(false)} />
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl h-[85vh] bg-slate-900 border border-slate-800 rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col pointer-events-auto"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/90 backdrop-blur-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] ring-1 ring-white/20">
                    <Leaf size={30} className="text-slate-950 fill-white/20" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-lg tracking-tight uppercase">AgriGenesis</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20">v4.0</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <ShieldAlert size={12} className="text-emerald-500" />
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">Senior Pathology Expert Systems</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-white/5 mr-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Active Link</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-3 bg-slate-800/50 hover:bg-red-500/20 hover:text-red-400 rounded-full text-slate-400 transition-all border border-transparent hover:border-red-500/20">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scroll-smooth">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <MessageSquare size={32} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg mb-2">Need expert advice?</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">Ask about specific treatments, climate impact, or prevention steps. I have full context of your crop scan.</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={cn(
                      "flex max-w-[90%] flex-col",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-5 rounded-3xl text-sm leading-relaxed shadow-lg",
                      msg.role === 'user' 
                        ? "bg-emerald-600 text-white rounded-tr-none font-medium selection:bg-emerald-400" 
                        : "bg-slate-800 border border-slate-700/50 text-slate-100 rounded-tl-none"
                    )}>
                      {msg.isAudio ? (
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-inner", msg.role === 'user' ? "bg-emerald-700" : "bg-slate-900")}>
                            <Mic size={16} className="animate-pulse" />
                          </div>
                          <span className="font-bold uppercase tracking-tight text-xs">Technical Signal Analysis...</span>
                        </div>
                      ) : (
                        <div className="markdown-body chat-markdown prose prose-sm prose-invert prose-emerald max-w-none prose-p:leading-relaxed prose-li:my-1">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-1">
                      {msg.role === 'bot' && <Bot size={10} className="text-emerald-500" />}
                      {msg.role === 'user' && <User size={10} className="text-slate-500" />}
                      <span className="text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
                        {msg.role === 'user' ? 'Operator' : 'AI Pathologist'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {isChatLoading && (
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                      <RefreshCw size={14} className="animate-spin text-emerald-500" />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-3xl rounded-tl-none flex gap-1.5 items-center border border-slate-700/50 shadow-md">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} className="h-4 w-full" />
                
                {chatError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center font-bold uppercase tracking-wider backdrop-blur-md"
                  >
                    <AlertCircle size={14} className="inline mr-2" />
                    {chatError}
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-950/50">
                <div className="flex items-center gap-3 bg-slate-800 border border-white/5 rounded-3xl p-2 focus-within:border-emerald-500/50 transition-all shadow-inner">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(chatInput)}
                    placeholder="Message assistant..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 text-white placeholder:text-slate-500 font-medium"
                  />
                  <div className="flex items-center gap-2 pr-1">
                    <AnimatePresence mode="wait">
                      {chatInput.trim() || isRecording ? (
                        <motion.button
                          key="send-button"
                          initial={{ scale: 0, opacity: 0, rotate: -45 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0, opacity: 0, rotate: 45 }}
                          onClick={() => handleSendMessage(chatInput)}
                          className="w-11 h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center hover:bg-[#128C7E] shadow-[0_4px_15px_rgba(37,211,102,0.4)] active:scale-90 transition-all border border-white/10"
                        >
                          <div className="relative">
                            <SendHorizontal size={20} className="ml-0.5" />
                            <Sparkles size={10} className="absolute -bottom-1 -right-1 text-white fill-white animate-pulse" />
                          </div>
                        </motion.button>
                      ) : (
                        <motion.button
                          key="mic-button"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          onTouchStart={startRecording}
                          onTouchEnd={stopRecording}
                          className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300",
                            isRecording 
                              ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] scale-110" 
                              : "bg-slate-700/40 text-slate-400 hover:text-white"
                          )}
                          title="Hold to Speak"
                        >
                          <Mic size={20} className={cn(isRecording && "animate-pulse")} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {isRecording && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 mt-3"
                    >
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map(n => (
                          <motion.div 
                            key={n}
                            animate={{ height: [8, 16, 8] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: n * 0.1 }}
                            className="w-1 bg-red-500 rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Listening... Release to send</span>
                    </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider">Scan History</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Stored locally on device</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <RefreshCw size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-sm">No scans detected yet</p>
                  </div>
                )}
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="group relative bg-slate-800/50 border border-slate-800 p-4 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer overflow-hidden"
                    onClick={() => {
                      setImage(item.image);
                      setResult(item.result);
                      setSelectedLanguage(item.language);
                      setIsHistoryOpen(false);
                      setCurrentView('scanner');
                    }}
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-900">
                        <img src={item.image} alt="Scan" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id);
                            }}
                            className="p-1 px-1.5 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <h4 className="font-bold text-white truncate text-sm mb-1">{item.result.diseaseName}</h4>
                        <div className="flex items-center gap-2">
                           <Globe size={10} className="text-slate-500" />
                           <span className="text-[10px] text-slate-500 font-bold uppercase">{item.language}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
