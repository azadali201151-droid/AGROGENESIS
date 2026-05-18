import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Leaf, ShieldAlert, HeartPulse, Sprout, CheckCircle2, AlertCircle, ChevronLeft, Globe, Search, Volume2, VolumeX, MessageSquare, Mic, History, SendHorizontal, Sparkles, User, Bot, X, Trash2 } from 'lucide-react';
import { analyzeCropPhoto, AnalysisResult, chatWithAgriBot } from './services/geminiService';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';


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
  Hindi: 'hi-IN',
  Bengali: 'bn-BD',
  Spanish: 'es-ES',
  French: 'fr-FR',
  Arabic: 'ar-SA',
  Mandarin: 'zh-CN',
  Urdu: 'ur-PK',
  Portuguese: 'pt-BR',
  Russian: 'ru-RU',
  Japanese: 'ja-JP',
  German: 'de-DE',
  Punjabi: 'pa-IN',
  Marathi: 'mr-IN',
  Telugu: 'te-IN',
  Tamil: 'ta-IN',
  Vietnamese: 'vi-VN',
  Turkish: 'tr-TR',
  Italian: 'it-IT',
  Thai: 'th-TH',
  Hausa: 'ha-NE',
  Indonesian: 'id-ID'
};

const LANGUAGES = [
  "English", "Hindi", "Bengali", "Spanish", "French", "Arabic", "Mandarin", "Urdu", "Portuguese", "Russian", "Japanese", "German", "Punjabi", "Marathi", "Telugu", "Tamil", "Vietnamese", "Turkish", "Italian", "Thai", "Hausa", "Indonesian"
];

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
  Hindi: {
    title: "एग्रोजेनेसिस",
    home: "होम",
    scanner: "डायग्नोस्टिक स्कैनर",
    futureFarming: "खेती का भविष्य",
    heroTitle: "अपनी फसल",
    heroTitleItalic: "बचाएं।",
    heroSubtitle: "अपनी फसलों के लिए तत्काल एआई निदान तैनात करें। सेकंड में बीमारियों का पता लगाएं, जैविक उपचार प्रोटोकॉल प्राप्त करें, और फैलने से पहले विफलता को रोकें।",
    startScan: "विज़न स्कैन शुरू करें",
    documentation: "दस्तावेज़ीकरण",
    detectionRate: "सটিকতা दर",
    cropsSupported: "समर्थित फसलें",
    scanningPathogens: "रोगजनकों के लिए स्कैनिंग",
    advancedVision: "उन्नत जैविक दृष्टि",
    diagnosisReady: "निदान तैयार है",
    organicCare: "जैविक देखभाल",
    organicCareDesc: "आपकी फसल के फेनोटाइप के लिए विशेष रूप से तैयार किए गए विस्तृत, चरण-दर-चरण जैविक उपचार प्रोटोकॉल।",
    diseaseShield: "रोग कवच",
    diseaseShieldDesc: "उन्नत कृषि बुद्धिमत्ता द्वारा संचालित आत्मविश्वास स्कोर के साथ कीटों और जैविक खतरों की जल्दी पहचान करें।",
    sustainabilityTitle: "स्थिरता",
    sustainabilityDesc: "भविष्य की पैदावार में सुधार करने और अपने खेतों में बीमारी की पुनरावृत्ति को स्थायी रूप से रोकने के लिए विशेषज्ञ देखभाल युक्तियाँ प्राप्त करें।",
    uploadTitle: "विश्लेषण शुरू करें",
    uploadDesc: "पत्ती या फसल का नमूना अपलोड करें",
    symptoms: "दृश्य लक्षण",
    organic: "जैविक प्रोटोकॉल",
    chemical: "रासायनिक ओवरराइड",
    prevention: "निवारक उपाय",
    syncNew: "नया स्कैन सिंक करें",
    indicators: "पाए गए संकेतक",
    confidence: "आत्मविश्वास गुणांक",
    preventionStrategy: "रोकथाम की रणनीति",
    sustainability: "सतत खेती सलाह",
    biologicalDiagnosis: "जैविक निदान",
    severeness: "गंभीरता",
    moderate: "मध्यम",
    spread: "फैलाव",
    standard: "मानक",
    processingPathogens: "रोगजनकों का विश्लेषण...",
    awaitingResults: "परिणामों की प्रतीक्षा है",
    searchLang: "भाषा खोजें...",
    focusPrecision: "फोकस परिशुद्धता",
    focusDesc: "विशिष्ट क्षय क्षेत्रों का विश्लेषण करें",
    l0Diagnostic: "L0 डायग्नोस्टिक",
    realtimeCheck: "रीयल-टाइम रोगजनक जांच",
    retry: "पुनः प्रयास करें",
    failed: "छवि का विश्लेषण करने में विफल। कृपया स्पष्ट फोटो के साथ पुनः प्रयास करें।",
    mockDiagnosis: "सेप्टोरिया लीफ स्पॉट का पता चला",
    footer: "एग्रोजेनेसिस इंटेलिजेंस सिस्टम",
    speakResults: "परिणाम सुनें",
    detailedReport: "विस्तृत रोग रिपोर्ट",
    yieldImpact: "अनुमानित उपज प्रभाव",
    howItWorks: "यह कैसे काम करता है",
    step1Title: "विजन सेटअप",
    step1Desc: "किसी بھی موبાઈल डिवाइस का उपयोग करके प्रभावित पौधे के क्षेत्र की उच्च-रिज़ॉल्यूशन छवि कैप्चर करें।",
    step2Title: "तंत्रिका विश्लेषण",
    step2Desc: "हमारा L0 न्यूरल नेटवर्क 150 से अधिक अद्वितीय रोगजनकों और चयापचय कमियों के लिए स्कैन करता है।",
    step3Title: "प्रोटोकॉल परिनियोजन",
    step3Desc: "अपनी मिट्टी के प्रकार के अनुरूप तत्काल, स्थानीयकृत जैविक और रासायनिक उपचार प्रोटोकॉल प्राप्त करें।",
    impactTitle: "रणनीतिक प्रभाव",
    impact1Title: "खाद्य सुरक्षा",
    impact1Desc: "स्थानीयकृत फसल की बर्बादी को रोकें और क्षेत्रीय खाद्य आपूर्ति को स्थिर करें।",
    impact2Title: "आर्थिक लचीलापन",
    impact2Desc: "ठीक वही लगाकर अपनी इनपुट लागत कम करें जिसकी आपकी फसलों को ज़रूरत है, ठीक उसी समय जब उन्हें इसकी ज़रूरत है।",
    impact3Title: "डेटा इंटेलिजेंस",
    impact3Desc: "दृश्य डेटा को कार्रवाई योग्य फसल पूर्वानुमान और उपज अनुकूलन में बदलें।"
  },
  Spanish: {
    title: "AGROGÉNESIS",
    home: "Inicio",
    scanner: "Escáner de Diagnóstico",
    futureFarming: "Futuro de la Agricultura",
    heroTitle: "RESCATA TU",
    heroTitleItalic: "COSECHA.",
    heroSubtitle: "Implementa diagnósticos instantáneos de IA para tus cultivos. Detecta enfermedades en segundos, obtén protocolos de tratamiento orgánico y evita fallas antes de que se propaguen.",
    startScan: "Iniciar Escaneo de Visión",
    documentation: "Documentación",
    detectionRate: "Tasa de detección",
    cropsSupported: "Cultivos soportados",
    scanningPathogens: "ESCANEANDO PATÓGENOS",
    advancedVision: "Visión Biológica Avanzada",
    diagnosisReady: "Diagnóstico Listo",
    organicCare: "Cuidado Orgánico",
    organicCareDesc: "Protocolos de tratamiento orgánico detallados, paso a paso, generados específicamente para el fenotipo de su cultivo.",
    diseaseShield: "Escudo de Enfermedades",
    diseaseShieldDesc: "Identifique plagas y amenazas biológicas temprano con puntajes de confianza impulsados por inteligencia agrícola avanzada.",
    sustainabilityTitle: "Sostenibilidad",
    sustainabilityDesc: "Obtenga consejos de expertos para mejorar los rendimientos futuros y prevenir de manera sostenible la recurrencia de enfermedades en sus campos.",
    uploadTitle: "Iniciar Análisis",
    uploadDesc: "Sube una sección transversal o muestra de hoja",
    symptoms: "Síntomas Visibles",
    organic: "Protocolo Orgánico",
    chemical: "Anulación Química",
    prevention: "Medidas Preventivas",
    syncNew: "Sincronizar Nuevo Escaneo",
    indicators: "Indicadores Detectados",
    confidence: "Coeficiente de Confianza",
    preventionStrategy: "Estrategia de Prevención",
    sustainability: "Consejos de Sostenibilidad",
    biologicalDiagnosis: "Diagnóstico Biológico",
    severeness: "Gravedad",
    moderate: "Moderada",
    spread: "Propagación",
    standard: "Estándar",
    processingPathogens: "Procesando Patógenos...",
    awaitingResults: "Esperando Resultados",
    searchLang: "Buscar idioma...",
    focusPrecision: "Precisión de Enfoque",
    focusDesc: "Analizar áreas específicas de descomposición",
    l0Diagnostic: "Diagnóstico L0",
    realtimeCheck: "Verificación de patógenos en tiempo real",
    retry: "Reintentar Análisis",
    failed: "No se pudo analizar la imagen. Inténtelo de nuevo con una foto más clara.",
    mockDiagnosis: "Mancha foliar por Septoria detectada",
    footer: "Sistema de Inteligencia AgroGenesis",
    speakResults: "Escuchar Resultados",
    detailedReport: "Informe Patológico Detallado",
    yieldImpact: "Impacto Estimado en el Rendimiento",
    howItWorks: "Cómo funciona",
    step1Title: "Configuración de Visión",
    step1Desc: "Capture una imagen de alta resolución del área de la planta afectada utilizando cualquier dispositivo móvil.",
    step2Title: "Análisis Neuronal",
    step2Desc: "Nuestra red neuronal L0 detecta más de 150 patógenos únicos y deficiencias metabólicas.",
    step3Title: "Despliegue de Protocolo",
    step3Desc: "Reciba protocolos de tratamiento orgánicos y químicos inmediatos y localizados adaptados a su tipo de suelo.",
    impactTitle: "Impacto Estratégico",
    impact1Title: "Seguridad Alimentaria",
    impact1Desc: "Evite la pérdida de cosechas localizadas y estabilice el suministro regional de alimentos.",
    impact2Title: "Resiliencia Económica",
    impact2Desc: "Reduzca los costos de insumos aplicando exactamente lo que sus cultivos necesitan, justo cuando lo necesitan.",
    impact3Title: "Inteligencia de Datos",
    impact3Desc: "Transforme los datos visuales en pronósticos de cosecha accionables y optimización de rendimientos."
  },
  Bengali: {
    title: "এগ্রোজেনেসি",
    home: "হোম",
    scanner: "ডায়াগনস্টিক স্ক্যানার",
    futureFarming: "চাষাবাদের ভবিষ্যৎ",
    heroTitle: "আপনার ফসল",
    heroTitleItalic: "রক্ষা করুন।",
    heroSubtitle: "আপনার ফসলের জন্য তাৎক্ষণিক AI ডায়াগনস্টিকস মোতায়েন করুন। সেকেন্ডের মধ্যে রোগ শনাক্ত করুন, জৈব চিকিত্সা প্রোটোকল পান এবং ছড়িয়ে পড়ার আগেই ফসলের ক্ষতি রোধ করুন।",
    startScan: "ভিশন স্ক্যান শুরু করুন",
    documentation: "নথিপত্র",
    detectionRate: "সনাক্তকরণের হার",
    cropsSupported: "সমর্থিত ফসল",
    scanningPathogens: "প্যাথোজেন স্ক্যান করা হচ্ছে",
    advancedVision: "উন্নত জৈবিক দৃষ্টি",
    diagnosisReady: "রোগ নির্ণয় প্রস্তুত",
    organicCare: "জৈব যত্ন",
    organicCareDesc: "আপনার ফসলের জন্য বিশেষভাবে তৈরি করা বিস্তারিত, ধাপে ধাপে জৈব চিকিত্সা প্রোটোকল।",
    diseaseShield: "রোগ প্রতিরক্ষা",
    diseaseShieldDesc: "উন্নত কৃষি বুদ্ধিমত্তা দ্বারা চালিত আত্মবিশ্বাসের স্কোরের সাথে কীটপতঙ্গ এবং জৈবিক হুমকি আগেভাগেই শনাক্ত করুন।",
    sustainabilityTitle: "স্থায়িত্ব",
    sustainabilityDesc: "ভবিষ্যতের ফলন উন্নত করতে এবং আপনার জমিতে টেকসইভাবে রোগের পুনরাবৃত্তি রোধ করতে বিশেষজ্ঞের পরামর্শ নিন।",
    uploadTitle: "বিশ্লেষণ শুরু করুন",
    uploadDesc: "পাতার নমুনা আপলোড করুন",
    symptoms: "দৃশ্যমান লক্ষণ",
    organic: "জৈব চিকিত্সা",
    chemical: "রাসায়নিক চিকিত্সা",
    prevention: "প্রতিরোধমূলক ব্যবস্থা",
    syncNew: "নতুন স্ক্যান সিঙ্ক করুন",
    indicators: "শনাক্ত করা সূচক",
    confidence: "কনফিডেন্স ইনডেক্স",
    preventionStrategy: "প্রতিরোধের কৌশল",
    sustainability: "টেকসই চাষাবাদের পরামর্শ",
    biologicalDiagnosis: "জৈবিক রোগ নির্ণয়",
    severeness: "তীব্রতা",
    moderate: "মাঝারি",
    spread: "বিস্তার",
    standard: "প্রমিত",
    processingPathogens: "প্যাথোজেন বিশ্লেষণ করা হচ্ছে...",
    awaitingResults: "ফলাফলের জন্য অপেক্ষা করা হচ্ছে",
    searchLang: "ভাষা অনুসন্ধান করুন...",
    focusPrecision: "ফোকাস প্রিসিশন",
    focusDesc: "নির্দিষ্ট ক্ষয়প্রাপ্ত এলাকার বিশ্লেষণ",
    l0Diagnostic: "L0 ডায়াগনস্টিক",
    realtimeCheck: "রিয়েল-টাইম পপ্যাথোজেন পরীক্ষা",
    retry: "পুনরায় চেষ্টা করুন",
    failed: "ছবি বিশ্লেষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আরও পরিষ্কার ছবির সাথে আবার চেষ্টা করুন।",
    mockDiagnosis: "সেপ্টোরিয়া লিফ স্পট শনাক্ত হয়েছে",
    footer: "এগ্রোজেনেসি ইন্টেলিজেন্স সিস্টেম",
    howItWorks: "এটি যেভাবে কাজ করে",
    step1Title: "ভিশন সেটআপ",
    step1Desc: "যেকোনো মোবাইল ডিভাইস ব্যবহার করে আক্রান্ত উদ্ভিদের উচ্চ-রেজোলিউশন ছবি তোলো।",
    step2Title: "নিওরাল বিশ্লেষণ",
    step2Desc: "আমাদের L0 নিউরাল নেটওয়ার্ক ১৫০টিরও বেশি অনন্য প্যাথোজেন এবং বিপাকীয় ঘাটতি স্ক্যান করে।",
    step3Title: "প্রোটোকল মোতায়েন",
    step3Desc: "আপনার মাটির ধরন অনুযায়ী তাৎক্ষণিক জৈব এবং রাসায়নিক চিকিত্সা প্রোটোকল পান।",
    impactTitle: "কৌশলগত প্রভাব",
    impact1Title: "খাদ্য নিরাপত্তা",
    impact1Desc: "ফসলের ক্ষতি রোধ করুন এবং আঞ্চলিক খাদ্য সরবরাহ স্থিতিশীল করুন।",
    impact2Title: "অর্থনৈতিক স্থিতিস্থাপকতা",
    impact2Desc: "আপনার ফসলের যা প্রয়োজন ঠিক তাই প্রয়োগ করে খরচ কমান।",
    impact3Title: "ডেটা ইন্টেলিজেন্স",
    impact3Desc: "ভিজ্যুয়াল ডেটাকে কার্যকর ফসল পূর্বাভাস এবং ফলন অপ্টিমাইজেশনে রূপান্তর করুন।"
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
    step3Desc: "ایڈمنسٹریشن اپنی مٹی کی قسم کے مطابق فوری، مقامی نامیاتی اور کیمیائی علاج کے پروٹوکول حاصل کریں۔",
    impactTitle: "تزویراتی اثرات",
    impact1Title: "غذائی تحفظ",
    impact1Desc: "مقامی طور پر فصلوں کی ناکامی کو روکیں اور علاقائی خوراک کی فراہمی کو مستحکم کریں۔",
    impact2Title: "معاشی استحکام",
    impact2Desc: "اپنی فصلوں کی ضرورت کے عین مطابق اور وقت پر استعمال کر کے لاگت میں کمی لائیں۔",
    impact3Title: "ڈیٹا انٹیلی جنس",
    impact3Desc: "بصری ڈیٹا کو قابل عمل فصل کی پیشن گوئی اور پیداوار کی اصلاح میں تبدیل کریں۔"
  },
  Arabic: {
    title: "أجرو جينيسيس",
    home: "الرئيسية",
    scanner: "ماسح التشخيص",
    futureFarming: "مستقبل الزراعة",
    heroTitle: "أنقذ",
    heroTitleItalic: "حصادك.",
    heroSubtitle: "قم بنشر تشخيصات الذكاء الاصطناعي الفورية لمحاصيلك. اكتشف الأمراض في ثوانٍ، واحصل على بروتوكولات العلاج العضوي، وامنع الفشل قبل انتشاره.",
    startScan: "بدء فحص الرؤية",
    documentation: "التوثيق",
    detectionRate: "معدل الكشف",
    cropsSupported: "المحاصيل المدعومة",
    scanningPathogens: "جارٍ فحص مسببات الأمراض",
    advancedVision: "رؤية بيولوجية متقدمة",
    diagnosisReady: "التشخيص جاهز",
    organicCare: "العناية العضوية",
    organicCareDesc: "بروتوكولات علاج عضوي مفصلة خطوة بخطوة مخصصة لنوع محصولك.",
    diseaseShield: "درع الأمراض",
    diseaseShieldDesc: "تعرف على الآفات والتهديدات البيولوجية مبكرًا مع درجات ثقة مدعومة بالذكاء الزراعي المتقدم.",
    sustainabilityTitle: "الاستدامة",
    sustainabilityDesc: "احصل على نصائح الخبراء لتحسين المحاصيل المستقبلية ومنع تكرار الأمراض بشكل مستدام في حقولك.",
    uploadTitle: "بدء التحليل",
    uploadDesc: "تحميل عينة من ورقة الشجر",
    symptoms: "الأعراض المرئية",
    organic: "البروتوكول العضوي",
    chemical: "التدخل الكيميائي",
    prevention: "تدابير وقائية",
    syncNew: "مزامنة فحص جديد",
    indicators: "المؤشرات المكتشفة",
    confidence: "معامل الثقة",
    preventionStrategy: "استراتيجية الوقاية",
    sustainability: "نصيحة الاستدامة",
    biologicalDiagnosis: "التشخيص البيولوجي",
    severeness: "الخطورة",
    moderate: "متوسطة",
    spread: "الانتشار",
    standard: "قياسي",
    processingPathogens: "جارٍ معالجة مسببات الأمراض...",
    awaitingResults: "في انتظار النتائج",
    searchLang: "ابحث عن لغة...",
    focusPrecision: "دقة التركيز",
    focusDesc: "تحليل مناطق محددة من التحلل",
    l0Diagnostic: "التشخيص L0",
    realtimeCheck: "فحص مسببات الأمراض في الوقت الفعلي",
    retry: "إعادة المحاولة",
    failed: "فشل تحليل الصورة. يرجى المحاولة مرة أخرى بصورة أوضح.",
    mockDiagnosis: "تم اكتشاف بقعة أوراق السبتوريا",
    footer: "نظام استخبارات أجرو جينيسيس",
    howItWorks: "كيف يعمل الجهاز",
    step1Title: "إعداد الرؤية",
    step1Desc: "التقط صورة عالية الدقة لمنطقة النبات المصابة باستخدام أي جهاز محمول.",
    step2Title: "التحليل العصبي",
    step2Desc: "تبحث شبكتنا العصبية L0 عن أكثر من 150 من مسببات الأمراض الفريدة والاضطرابات الاستقلابية.",
    step3Title: "نشر البروتوكول",
    step3Desc: "احصل على بروتوكولات علاج عضوية وكيميائية فورية ومحلية مصممة لتناسب نوع تربتك.",
    impactTitle: "التأثير الاستراتيجي",
    impact1Title: "الأمن الغذائي",
    impact1Desc: "منع فشل المحاصيل المحلي واستقرار إمدادات الغذاء الإقليمية.",
    impact2Title: "المرونة الاقتصادية",
    impact2Desc: "قلل تكاليف المدخلات من خلال تطبيق ما تحتاجه محاصيلك بالضبط، وفقط عندما تحتاج إليه.",
    impact3Title: "ذكاء البيانات",
    impact3Desc: "تحويل البيانات المرئية إلى توقعات حصاد قابلة للتنفيذ وتحسينات في الإنتاجية."
  },
  French: {
    title: "AGROGÉNÈSE",
    home: "Accueil",
    scanner: "Scanner de Diagnostic",
    futureFarming: "L'Avenir de l'Agriculture",
    heroTitle: "SAUVEZ VOTRE",
    heroTitleItalic: "RÉCOLTE.",
    heroSubtitle: "Déployez des diagnostics instantanés par IA pour vos cultures. Détectez les maladies en quelques secondes, obtenez des protocoles de traitement organique et prévenez l'échec avant qu'il ne se propage.",
    startScan: "Démarrer le Scan Vision",
    documentation: "Documentation",
    detectionRate: "Taux de détection",
    cropsSupported: "Cultures supportées",
    scanningPathogens: "SCAN DES PATHOGÈNES",
    advancedVision: "Vision Biologique Avancée",
    diagnosisReady: "Diagnostic Prêt",
    organicCare: "Soin Biologique",
    organicCareDesc: "Protocoles de traitement organique détaillés, étape par étape, générés spécifiquement pour le phénotype de votre culture.",
    diseaseShield: "Bouclier Contre les Maladies",
    diseaseShieldDesc: "Identifiez les parasites et les menaces biologiques tôt avec des scores de confiance optimisés par une intelligence agricole avancée.",
    sustainabilityTitle: "Durabilité",
    sustainabilityDesc: "Obtenez des conseils d'experts pour améliorer les rendements futurs et prévenir durablement la récurrence des maladies dans vos champs.",
    uploadTitle: "Initialiser l'Analyse",
    uploadDesc: "Télécharger une coupe transversale ou un échantillon de feuille",
    symptoms: "Symptômes Visibles",
    organic: "Protocole Organique",
    chemical: "Intervention Chimique",
    prevention: "Mesures Préventives",
    syncNew: "Synchroniser Nouveau Scan",
    indicators: "Indicateurs Détectés",
    confidence: "Coefficient de Confiance",
    preventionStrategy: "Stratégie de Prévention",
    sustainability: "Conseils de Durabilité",
    biologicalDiagnosis: "Diagnostic Biologique",
    severeness: "Gravité",
    moderate: "Modérée",
    spread: "Propagation",
    standard: "Standard",
    processingPathogens: "Traitement des Pathogènes...",
    awaitingResults: "En Attente de Résultats",
    searchLang: "Rechercher une langue...",
    focusPrecision: "Précision de Mise au Point",
    focusDesc: "Analyser les zones de décomposition spécifiques",
    l0Diagnostic: "Diagnostic L0",
    realtimeCheck: "Vérification des pathogènes en temps réel",
    retry: "Réessayer l'Analyse",
    failed: "Échec de l'analyse de l'image. Veuillez réessayer avec une photo plus claire.",
    mockDiagnosis: "Tache septorienne détectée",
    footer: "Système d'Intelligence AgroGenesis",
    howItWorks: "Comment ça fonctionne",
    step1Title: "Configuration de la Vision",
    step1Desc: "Capturez une image haute résolution de la zone de la plante affectée à l'aide de n'importe quel appareil mobile.",
    step2Title: "Analyse Neuronale",
    step2Desc: "Notre réseau neuronal L0 scanne plus de 150 agents pathogènes uniques et déficiences métaboliques.",
    step3Title: "Déploiement du Protocole",
    step3Desc: "Recevez des protocoles de traitement organiques et chimiques immédiats et localisés adaptés à votre type de sol.",
    impactTitle: "Impact Stratégique",
    impact1Title: "Sécurité Alimentaire",
    impact1Desc: "Prévenir les mauvaises récoltes localisées et stabiliser les approvisionnements alimentaires régionaux.",
    impact2Title: "Résilience Économique",
    impact2Desc: "Réduisez vos coûts d'intrants en appliquant précisément ce dont vos cultures ont besoin, exactement quand elles en ont besoin.",
    impact3Title: "Intelligence des Données",
    impact3Desc: "Transformez les données visuelles en prévisions de récolte exploitables et en optimisations de rendement."
  },
  Mandarin: {
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
    footer: "AgroGenesis 智能系统"
  },
  Portuguese: {
    title: "AGROGÊNESE",
    home: "Início",
    scanner: "Scanner de Diagnóstico",
    futureFarming: "O Futuro da Agricultura",
    heroTitle: "SALVE SUA",
    heroTitleItalic: "COLHEITA.",
    heroSubtitle: "Implante diagnósticos instantâneos por IA para suas plantações. Detecte doenças em segundos, obtenha protocolos de tratamento orgânico e evite falhas antes que se espalhem.",
    startScan: "Iniciar Varredura Visão",
    documentation: "Documentação",
    detectionRate: "Taxa de Detecção",
    cropsSupported: "Culturas Suportadas",
    scanningPathogens: "VARREDURA DE PATÓGENOS",
    advancedVision: "Visão Biológica Avançada",
    diagnosisReady: "Diagnóstico Pronto",
    organicCare: "Cuidado Orgânico",
    organicCareDesc: "Protocolos de tratamento orgânico detalhados, passo a passo, gerados especificamente para o fenótipo da sua cultura.",
    diseaseShield: "Escudo de Doenças",
    diseaseShieldDesc: "Identifique pragas e ameaças biológicas precocemente com pontuações de confiança baseadas em inteligência agrícola avançada.",
    sustainabilityTitle: "Sustentabilidade",
    sustainabilityDesc: "Obtenha dicas de cuidados de especialistas para melhorar colheitas futuras e prevenir de forma sustentável a recorrência de doenças em seus campos.",
    howItWorks: "Como Funciona",
    step1Title: "Configuração de Visão",
    step1Desc: "Capture uma imagem de alta resolução da área afetada da planta usando qualquer dispositivo móvel.",
    step2Title: "Análise Neuronal",
    step2Desc: "Nossa rede neural L0 faz varredura para mais de 150 patógenos exclusivos e deficiências metabólicas.",
    step3Title: "Implantação de Protocolo",
    step3Desc: "Receba protocolos de tratamento orgânico e químico imediatos e localizados, adaptados ao seu tipo de solo.",
    impactTitle: "Impacto Estratégico",
    impact1Title: "Segurança Alimentar",
    impact1Desc: "Previna a quebra de safra localizada e estabilize suprimentos regionais de alimentos.",
    impact2Title: "Resiliência Econômica",
    impact2Desc: "Reduza custos de insumos aplicando exatamente o que suas culturas precisam, exatamente quando precisam.",
    impact3Title: "Inteligência de Dados",
    impact3Desc: "Transforme dados visuais em previsões de colheita acionáveis e otimizações de rendimento.",
    uploadTitle: "Inicializar Análise",
    uploadDesc: "Carregar corte transversal ou amostra de folha",
    symptoms: "Sintomas Visíveis",
    organic: "Protocolo Orgânico",
    chemical: "Intervenção Química",
    prevention: "Medidas Preventivas",
    syncNew: "Sincronizar Nova Varredura",
    indicators: "Indicadores Detectados",
    confidence: "Coeficiente de Confiança",
    preventionStrategy: "Estratégia de Prevenção",
    sustainability: "Dicas de Sustentabilidade",
    biologicalDiagnosis: "Diagnóstico Biológico",
    severeness: "Gravidade",
    moderate: "Moderada",
    spread: "Propagação",
    standard: "Padrão",
    processingPathogens: "Processando Patógenos...",
    awaitingResults: "Aguardando Resultados",
    searchLang: "Procurar idioma...",
    focusPrecision: "Precisão de Foco",
    focusDesc: "Analisar áreas específicas de decomposição",
    l0Diagnostic: "Diagnóstico L0",
    realtimeCheck: "Verificação de patógenos em tempo real",
    retry: "Repetir Análise",
    failed: "Falha ao analisar imagem. Tente novamente com uma foto mais clara.",
    mockDiagnosis: "Mancha de Septoria Detectada",
    footer: "Sistema de Inteligência AgroGenesis"
  },
  Russian: {
    title: "АГРОГЕНЕЗИС",
    home: "Главная",
    scanner: "Диагностический сканер",
    futureFarming: "Будущее сельского хозяйства",
    heroTitle: "СПАСИТЕ ВАШ",
    heroTitleItalic: "УРОЖАЙ.",
    heroSubtitle: "Используйте мгновенную ИИ-диагностику для ваших культур. Обнаруживайте болезни за секунды, получайте протоколы органического лечения и предотвращайте потери до их распространения.",
    startScan: "Начать визуальное сканирование",
    documentation: "Документация",
    detectionRate: "Точность обнаружения",
    cropsSupported: "Поддерживаемые культуры",
    scanningPathogens: "СКАНИРОВАНИЕ ПАТОГЕНОВ",
    advancedVision: "Продвинутое биологическое зрение",
    diagnosisReady: "Диагноз готов",
    organicCare: "Органический уход",
    organicCareDesc: "Подробные пошаговые протоколы органического лечения, созданные специально для фенотипа вашей культуры.",
    diseaseShield: "Защита от болезней",
    diseaseShieldDesc: "Выявляйте вредителей и биологические угрозы на ранних стадиях с помощью показателей достоверности на базе передового аграрного интеллекта.",
    sustainabilityTitle: "Устойчивость",
    sustainabilityDesc: "Получайте советы экспертов по уходу для повышения будущих урожаев и устойчивого предотвращения повторения болезней на ваших полях.",
    howItWorks: "Как это работает",
    step1Title: "Настройка зрения",
    step1Desc: "Сделайте снимок пораженного участка растения в высоком разрешении с помощью любого мобильного устройства.",
    step2Title: "Нейронный анализ",
    step2Desc: "Наша нейронная сеть L0 сканирует более 150 уникальных патогенов и метаболических нарушений.",
    step3Title: "Развертывание протокола",
    step3Desc: "Получайте мгновенные локализованные протоколы органического и химического лечения, адаптированные к вашему типу почвы.",
    impactTitle: "Стратегическое влияние",
    impact1Title: "Продовольственная безопасность",
    impact1Desc: "Предотвращайте локальные неурожаи и стабилизируруйте региональные поставки продовольствия.",
    impact2Title: "Экономическая устойчивость",
    impact2Desc: "Снижайте затраты на ресурсы, применяя именно то, что нужно вашим культурам, и именно тогда, когда это необходимо.",
    impact3Title: "Интеллектуальный анализ данных",
    impact3Desc: "Превращайте визуальные данные в действенные прогнозы урожая и оптимизацию доходности.",
    uploadTitle: "Инициализировать анализ",
    uploadDesc: "Загрузить срез или образец листа",
    symptoms: "Видимые симптомы",
    organic: "Органический протокол",
    chemical: "Химическое вмешательство",
    prevention: "Превентивные меры",
    syncNew: "Синхронизировать новое сканирование",
    indicators: "Обнаруженные индикаторы",
    confidence: "Коэффициент достоверности",
    preventionStrategy: "Стратегия профилактики",
    sustainability: "Советы по устойчивости",
    biologicalDiagnosis: "Биологический диагноз",
    severeness: "Тяжесть",
    moderate: "Умеренная",
    spread: "Распространение",
    standard: "Стандарт",
    processingPathogens: "Обработка патогенов...",
    awaitingResults: "Ожидание результатов",
    searchLang: "Поиск языка...",
    focusPrecision: "Точность фокусировки",
    focusDesc: "Анализ специфических зон разложения",
    l0Diagnostic: "L0 Диагностика",
    realtimeCheck: "Проверка патогенов в реальном времени",
    retry: "Повторить анализ",
    failed: "Не удалось проанализировать изображение. Попробуйте еще раз с более четким фото.",
    mockDiagnosis: "Обнаружена септориозная пятнистость листьев",
    footer: "Интеллектуальная система AgroGenesis"
  }
};

// Simple helper to get translated string
const t = (lang: string, key: string) => UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS["English"][key];

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'home' | 'scanner'>('landing');
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

  const isRTL = ["Arabic", "Urdu"].includes(selectedLanguage);

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
              onClick={() => setCurrentView('landing')} 
              className={cn(
                "hidden sm:block text-xs font-bold uppercase tracking-widest transition-colors",
                currentView === 'landing' ? "text-emerald-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Info
            </button>
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
          {currentView === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen"
            >
              {/* Hero Section */}
              <section className="relative pt-24 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,#10b98115_0%,transparent_50%)]" />
                <div className="max-w-4xl mx-auto text-center space-y-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest"
                  >
                    <Sparkles size={14} />
                    Next-Gen Agriculture
                  </motion.div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.9]"
                  >
                    AgroGenesis <span className="text-emerald-500 not-italic">Vision</span>
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
                  >
                    Driving innovation in agricultural technology by applying advanced domain knowledge to solve real-world farming challenges. This platform represents a commitment to sustainable crop health through precision intelligence.
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
                  >
                    <button
                      onClick={() => setCurrentView('scanner')}
                      className="group relative px-8 py-5 bg-emerald-500 text-slate-950 font-black uppercase tracking-[0.2em] text-xs rounded-2xl overflow-hidden hover:bg-white transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] active:scale-95"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Camera size={18} />
                        Enter Scanner place
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        const faqEl = document.getElementById('faqs');
                        faqEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all"
                    >
                      Learn More
                    </button>
                  </motion.div>
                </div>
              </section>

              {/* FAQ Section */}
              <section id="faqs" className="py-32 px-6 bg-slate-900/10">
                <div className="max-w-4xl mx-auto space-y-16">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Common <span className="text-emerald-500 not-italic">Queries</span></h2>
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
                        <h3 className="text-white font-black text-lg mb-3 flex gap-3 italic">
                          <span className="text-emerald-500 not-italic">Q.</span> {faq.q}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                          {faq.a}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Founder Signature (Reduced) */}
              <footer className="w-full max-w-4xl mx-auto px-6 pt-16 pb-24 text-center mt-20 border-t border-white/5 bg-gradient-to-t from-emerald-500/[0.02] to-transparent">
                <div className="flex flex-col items-center gap-6 mb-8">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <span className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.5em]">Founder & Chief Architect</span>
                      </div>
                      <p className="text-white text-5xl font-black tracking-tighter italic drop-shadow-2xl">Azad Ali</p>
                    </div>
                  </div>
                </div>
              </footer>
            </motion.div>
          ) : currentView === 'home' ? (
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
                              <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-4xl font-bold text-white leading-none">{result.diseaseName}</h2>
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
