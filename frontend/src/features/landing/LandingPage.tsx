import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Play, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Cpu, 
  Zap, 
  Check, 
  Globe, 
  Clock, 
  ChevronDown, 
  Shield,
  Droplets,
  Activity,
  Camera,
  Wifi,
  WifiOff,
  Thermometer,
  Sun,
  CloudRain,
  ShieldAlert,
  PhoneCall,
  Compass,
  MapPin,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Sliders,
  Bot,
  X,
  Phone,
  Power,
  Server,
  BarChart3,
  Download,
  FileJson,
  LayoutDashboard,
  LogIn
} from 'lucide-react';
import sampleData from '../../data/sample_dataset.json';

interface TranslationSet {
  tagline: string;
  heroTitle: string;
  heroSub: string;
  exploreBtn: string;
  monitorBtn: string;
  problemTitle: string;
  problemSub: string;
  problemLine: string;
  howTitle: string;
  sensorTitle: string;
  visionTitle: string;
  zoneTitle: string;
  irrigationTitle: string;
  riskTitle: string;
  alertTitle: string;
  callbackTitle: string;
  loggingTitle: string;
  controlTitle: string;
  archTitle: string;
  impactTitle: string;
  simTitle: string;
  ctaTitle: string;
  ctaSub: string;
  demoBtn: string;
  dashboardBtn: string;
  datasetBtn: string;
  datasetViewBtn: string;
  navLinks: string[];
}

const TRANSLATIONS: Record<string, TranslationSet> = {
  EN: {
    tagline: 'Autonomous Edge-AI Agricultural Platform',
    heroTitle: 'Intelligence That Moves With Your Farm.',
    heroSub: 'An Edge-AI agricultural robot that monitors crop health, soil and environmental conditions, detects early risks, and helps farmers take action in real time — even with limited connectivity.',
    exploreBtn: 'Explore Agri Bot',
    monitorBtn: 'See Live Monitoring',
    problemTitle: 'Traditional Farming Is Blind to Early Risks',
    problemSub: 'Conventional inspection relies on manual spot checks, often revealing disease or water stress after crop damage has already occurred.',
    problemLine: 'Agri Bot brings field intelligence directly to the farm.',
    howTitle: 'How Agri Bot Operates',
    sensorTitle: 'Smart Sensing System',
    visionTitle: "The Camera Doesn't Just See. It Understands.",
    zoneTitle: 'Turn the Farm Into an Intelligent Map',
    irrigationTitle: 'Water Where It Is Needed. Not Everywhere.',
    riskTitle: 'Environmental Risk Engine',
    alertTitle: 'When Something Goes Wrong, The Farmer Knows.',
    callbackTitle: 'AI When Possible. Human When Needed.',
    loggingTitle: 'Continuous Field Monitoring',
    controlTitle: 'Control the Robot.',
    archTitle: 'Complete System Architecture',
    impactTitle: 'Why Agri Bot Matters',
    simTitle: 'Live Field Simulator',
    ctaTitle: 'Bring Intelligence to Every Acre.',
    ctaSub: 'Monitor. Detect. Decide. Act.',
    demoBtn: 'Farmer Login',
    dashboardBtn: 'Go to Dashboard',
    datasetBtn: 'Download Sample Dataset (JSON)',
    datasetViewBtn: 'View Dataset Schema',
    navLinks: ['How It Works', 'Sensors', 'Zones', 'Irrigation', 'Simulation', 'Architecture']
  },
  HI: {
    tagline: 'स्वायत्त एज-एआई कृषि प्लेटफॉर्म',
    heroTitle: 'इंटेलिजेंस जो आपके खेत के साथ चलती है।',
    heroSub: 'एक एज-एआई कृषि रोबोट जो फसल के स्वास्थ्य, मिट्टी और पर्यावरणीय स्थितियों की निगरानी करता है और वास्तविक समय में कार्रवाई करने में मदद करता है।',
    exploreBtn: 'एग्री बॉट खोजें',
    monitorBtn: 'लाइव मॉनिटरिंग देखें',
    problemTitle: 'पारंपरिक खेती शुरुआती जोखिमों के प्रति अंधी है',
    problemSub: 'पारंपरिक निरीक्षण मैन्युअल जांच पर निर्भर करता है, जिससे फसल क्षति होने के बाद ही बीमारियों का पता चलता है।',
    problemLine: 'एग्री बॉट सीधे खेत में फील्ड इंटेलिजेंस लाता है।',
    howTitle: 'एग्री बॉट कैसे काम करता है',
    sensorTitle: 'स्मार्ट सेंसिंग सिस्टम',
    visionTitle: 'कैमरा सिर्फ देखता नहीं है। यह समझता है।',
    zoneTitle: 'खेत को एक बुद्धिमान मानचित्र में बदलें',
    irrigationTitle: 'पानी वहीं जहां जरूरत है। हर जगह नहीं।',
    riskTitle: 'पर्यावरणीय जोखिम इंजन',
    alertTitle: 'जब कुछ गलत होता है, तो किसान को पता चल जाता है।',
    callbackTitle: 'संभव होने पर एआई। आवश्यकता होने पर इंसान।',
    loggingTitle: 'सतत क्षेत्र निगरानी',
    controlTitle: 'रोबोट को नियंत्रित करें।',
    archTitle: 'संपूर्ण सिस्टम आर्किटेक्चर',
    impactTitle: 'एग्री बॉट क्यों महत्वपूर्ण है',
    simTitle: 'लाइव फील्ड सिम्युलेटर',
    ctaTitle: 'हर एकड़ में इंटेलिजेंस लाएं।',
    ctaSub: 'निगरानी करें। पता लगाएं। निर्णय लें। कार्य करें।',
    demoBtn: 'किसान लॉगिन',
    dashboardBtn: 'डैशबोर्ड पर जाएं',
    datasetBtn: 'नमूना डेटासेट डाउनलोड करें (JSON)',
    datasetViewBtn: 'डेटासेट स्कीमा देखें',
    navLinks: ['कार्यप्रणाली', 'सेंसर', 'ज़ोन', 'सिंचाई', 'सिमुलेशन', 'आर्किटेक्चर']
  },
  PA: {
    tagline: 'ਸੁਤੰਤਰ ਐਜ-ਏਆਈ ਖੇਤੀਬਾੜੀ ਪਲੇਟਫਾਰਮ',
    heroTitle: 'ਇੰਟੈਲੀਜੈਂਸ ਜੋ ਤੁਹਾਡੇ ਖੇਤ ਨਾਲ ਚਲਦੀ ਹੈ।',
    heroSub: 'ਇੱਕ ਐਜ-ਏਆਈ ਖੇਤੀਬਾੜੀ ਰੋਬੋਟ ਜੋ ਫਸਲਾਂ ਦੀ ਸਿਹਤ, ਮਿੱਟੀ ਅਤੇ ਵਾਤਾਵਰਣ ਦੀ ਨਿਗਰਾਨੀ ਕਰਦਾ ਹੈ ਅਤੇ ਅਸਲ ਸਮੇਂ ਵਿੱਚ ਕਾਰਵਾਈ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ।',
    exploreBtn: 'ਐਗਰੀ ਬੋਟ ਦੀ ਖੋਜ ਕਰੋ',
    monitorBtn: 'ਲਾਈਵ ਨਿਗਰਾਨੀ ਦੇਖੋ',
    problemTitle: 'ਰਵਾਇਤੀ ਖੇਤੀ ਸ਼ੁਰੂਆਤੀ ਜੋਖਮਾਂ ਤੋਂ ਅਣਜਾਣ ਹੈ',
    problemSub: 'ਰਵਾਇਤੀ ਨਿਰੀਖਣ ਮੈਨੂਅਲ ਜਾਂਚਾਂ ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ, ਜੋ ਨੁਕਸਾਨ ਹੋਣ ਤੋਂ ਬਾਅਦ ਹੀ ਬਿਮਾਰੀਆਂ ਦਾ ਪਤਾ ਲਗਾਉਂਦਾ ਹੈ।',
    problemLine: 'ਐਗਰੀ ਬੋਟ ਸਿੱਧੇ ਖੇਤ ਵਿੱਚ ਫੀਲਡ ਇੰਟੈਲੀਜੈਂਸ ਲਿਆਉਂਦਾ ਹੈ।',
    howTitle: 'ਐਗਰੀ ਬੋਟ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
    sensorTitle: 'ਸਮਾਰਟ ਸੈਂਸਿੰਗ ਸਿਸਟਮ',
    visionTitle: 'ਕੈਮਰਾ ਸਿਰਫ ਦੇਖਦਾ ਨਹੀਂ, ਸਮਝਦਾ ਹੈ।',
    zoneTitle: 'ਖੇਤ ਨੂੰ ਨਕਸ਼ੇ ਵਿੱਚ ਬਦਲੋ',
    irrigationTitle: 'ਪਾਣੀ ਉੱਥੇ ਹੀ ਜਿੱਥੇ ਲੋੜ ਹੈ।',
    riskTitle: 'ਵਾਤਾਵਰਣ ਜੋਖਮ ਇੰਜਣ',
    alertTitle: 'ਜਦੋਂ ਕੁਝ ਗਲਤ ਹੁੰਦਾ ਹੈ, ਕਿਸਾਨ ਨੂੰ ਪਤਾ ਲੱਗ ਜਾਂਦਾ ਹੈ।',
    callbackTitle: 'ਸੰਭਵ ਹੋਵੇ ਤਾਂ ਏ.ਆਈ., ਲੋੜ ਪੈਣ ਤੇ ਇਨਸਾਨ।',
    loggingTitle: 'ਨਿਰੰਤਰ ਨਿਗਰਾਨੀ',
    controlTitle: 'ਰੋਬੋਟ ਨੂੰ ਕੰਟਰੋਲ ਕਰੋ।',
    archTitle: 'ਸੰਪੂਰਨ ਸਿਸਟਮ ਆਰਕੀਟੈਕਚਰ',
    impactTitle: 'ਐਗਰੀ ਬੋਟ ਕਿਉਂ ਮਹੱਤਵਪੂਰਨ ਹੈ',
    simTitle: 'ਲਾਈਵ ਸਿਮੂਲੇਟਰ',
    ctaTitle: 'ਹਰ ਏਕੜ ਵਿੱਚ ਇੰਟੈਲੀਜੈਂਸ ਲਿਆਓ।',
    ctaSub: 'ਨਿਗਰਾਨੀ। ਪਤਾ ਲਗਾਓ। ਫੈਸਲਾ। ਕਾਰਵਾਈ।',
    demoBtn: 'ਕਿਸਾਨ ਲੌਗਇਨ',
    dashboardBtn: 'ਡੈਸ਼ਬੋਰਡ ਤੇ ਜਾਓ',
    datasetBtn: 'ਡਾਟਾਸੈੱਟ ਡਾਊਨਲੋਡ ਕਰੋ (JSON)',
    datasetViewBtn: 'ਡਾਟਾਸੈੱਟ ਸਕੀਮਾ ਦੇਖੋ',
    navLinks: ['ਕਾਰਜ-ਪ੍ਰਣਾਲੀ', 'ਸੈਂਸਰ', 'ਜ਼ੋਨ', 'ਸਿੰਚਾਈ', 'ਸਿਮੂਲੇਸ਼ਨ', 'ਆਰਕੀਟੈਕਚਰ']
  }
};

const PROBLEM_CARDS = [
  { icon: Droplets, title: 'Water Waste', description: 'Irrigation without knowing actual soil conditions.', tag: 'Irrigation Deficit' },
  { icon: ShieldAlert, title: 'Crop Disease', description: 'Problems are often noticed after visible damage has already spread.', tag: 'Late Detection' },
  { icon: CloudRain, title: 'Environmental Risk', description: 'Heat, rainfall, humidity and other conditions can rapidly affect crops.', tag: 'Climate Risk' },
  { icon: WifiOff, title: 'Limited Connectivity', description: 'Farm intelligence cannot depend entirely on continuous cloud access.', tag: 'Offline Resilience' }
];

const WORK_STEPS = [
  { id: '01', title: 'Sense', detail: 'Temperature, humidity, soil moisture, rain, pH, water level, etc.', icon: Activity },
  { id: '02', title: 'See', detail: 'Camera captures high-resolution crop and leaf images.', icon: Camera },
  { id: '03', title: 'Analyze', detail: 'Edge AI analyses crop and environmental data locally.', icon: Cpu },
  { id: '04', title: 'Map', detail: 'Field is divided into zones and risk locations are recorded.', icon: MapPin },
  { id: '05', title: 'Decide', detail: 'System generates irrigation / inspection / crop-protection recommendations.', icon: Zap },
  { id: '06', title: 'Act', detail: 'Sprinkler, pump, or other connected equipment can respond.', icon: Power },
  { id: '07', title: 'Alert', detail: 'Farmer receives app, SMS, automated call, or voice alert.', icon: PhoneCall },
  { id: '08', title: 'Monitor', detail: 'System continues polling and tracks whether condition improves (Feedback Loop).', icon: RotateCcw },
];

const SENSOR_ITEMS = [
  { name: 'Camera', desc: 'Crop and leaf imagery for visual analysis.', val: '4K Ultra-HD AI Vision', icon: Camera },
  { name: 'Soil Moisture', desc: 'Determines water-stress and irrigation requirement.', val: '38% Volumetric', icon: Droplets },
  { name: 'Temp + Humidity', desc: 'Understands environmental crop stress.', val: '32°C / 55% RH', icon: Thermometer },
  { name: 'Rain Sensor', desc: 'Prevents unnecessary irrigation.', val: '0.0 mm/hr (Dry)', icon: CloudRain },
  { name: 'Water Level', desc: 'Monitors available water/chemical supply.', val: '68% Tank Volume', icon: Activity },
  { name: 'Light Sensor', desc: 'Tracks light conditions affecting crop status.', val: '84,000 Lux', icon: Sun },
  { name: 'pH Sensor', desc: 'Supports soil-condition monitoring.', val: '6.5 pH (Balanced)', icon: Shield },
  { name: 'Solar Power', desc: 'Supports field deployment & energy independence.', val: '120W Charge', icon: Zap },
];

const ZONE_GRID = [
  { id: 'A1', status: 'healthy', label: 'Healthy', moisture: '42%', temp: '29°C', disease: 'None', lastScan: '10 mins ago', gps: 'Lat 22.7196, Lon 75.8577' },
  { id: 'A2', status: 'healthy', label: 'Healthy', moisture: '40%', temp: '30°C', disease: 'None', lastScan: '12 mins ago', gps: 'Lat 22.7199, Lon 75.8580' },
  { id: 'A3', status: 'warning', label: 'Warning', moisture: '28%', temp: '33°C', disease: 'Mild Moisture Stress', lastScan: '5 mins ago', gps: 'Lat 22.7202, Lon 75.8583' },
  { id: 'A4', status: 'healthy', label: 'Healthy', moisture: '41%', temp: '29°C', disease: 'None', lastScan: '15 mins ago', gps: 'Lat 22.7205, Lon 75.8586' },
  { id: 'B1', status: 'healthy', label: 'Healthy', moisture: '39%', temp: '30°C', disease: 'None', lastScan: '8 mins ago', gps: 'Lat 22.7208, Lon 75.8589' },
  { id: 'B2', status: 'critical', label: 'Critical', moisture: '21%', temp: '35°C', disease: 'Possible Leaf Blight (91% Conf)', lastScan: '2 mins ago', gps: 'Lat 22.7211, Lon 75.8592' },
  { id: 'B3', status: 'warning', label: 'Warning', moisture: '26%', temp: '34°C', disease: 'Low Soil Moisture', lastScan: '4 mins ago', gps: 'Lat 22.7214, Lon 75.8595' },
  { id: 'B4', status: 'healthy', label: 'Healthy', moisture: '44%', temp: '29°C', disease: 'None', lastScan: '1 min ago', gps: 'Lat 22.7217, Lon 75.8598' },
  { id: 'C1', status: 'healthy', label: 'Healthy', moisture: '45%', temp: '28°C', disease: 'None', lastScan: '20 mins ago', gps: 'Lat 22.7220, Lon 75.8601' },
  { id: 'C2', status: 'healthy', label: 'Healthy', moisture: '43%', temp: '29°C', disease: 'Pest Activity Increasing', lastScan: '3 mins ago', gps: 'Lat 22.7223, Lon 75.8604' },
  { id: 'C3', status: 'critical', label: 'Critical', moisture: '18%', temp: '36°C', disease: 'Severe Water Stress', lastScan: '6 mins ago', gps: 'Lat 22.7226, Lon 75.8607' },
  { id: 'C4', status: 'healthy', label: 'Healthy', moisture: '40%', temp: '30°C', disease: 'None', lastScan: '14 mins ago', gps: 'Lat 22.7229, Lon 75.8610' },
];

const NAV_LINKS = [
  { href: '#how-it-works' },
  { href: '#sensors' },
  { href: '#zone-map' },
  { href: '#irrigation' },
  { href: '#simulation' },
  { href: '#architecture' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<string>('EN');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedZone, setSelectedZone] = useState(ZONE_GRID[5]);
  const [robotMode, setRobotMode] = useState('Autonomous');
  const [robotDir, setRobotDir] = useState('NORTH ⬆');
  const [roverPos, setRoverPos] = useState('B2');
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [datasetModalOpen, setDatasetModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState({ indore: '', delhi: '', london: '' });

  const isLoggedIn = Boolean(localStorage.getItem('krishivision_token'));
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setCurrentTime({
        indore: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
        delhi: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
        london: now.toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }),
      });
    };
    updateClocks();
    const interval = setInterval(updateClocks, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroTranslateY = scrollY * 0.32;
  const videoScale = 1 + scrollY * 0.0004;
  const videoBlur = Math.min(12, scrollY * 0.015);
  const videoDarkness = Math.min(0.85, 0.28 + scrollY * 0.001);

  const handleLoginClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050508] text-white font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* FLOATING GLASS NAVBAR */}
      <header className="fixed top-4 md:top-6 inset-x-0 mx-auto w-[95%] max-w-6xl z-50 transition-all duration-300">
        <nav className="apple-glass rounded-full px-4 sm:px-6 py-2.5 md:py-3 flex items-center justify-between transition-all duration-300 shadow-2xl backdrop-blur-xl bg-black/40 border border-white/20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group text-white font-semibold text-lg md:text-xl tracking-tight shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
              🌿
            </div>
            <span className="font-instrument-serif italic text-2xl font-normal group-hover:text-white/80 transition-colors whitespace-nowrap">
              KrishiVision AI
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
            {t.navLinks.map((name, i) => (
              <a key={i} href={NAV_LINKS[i]?.href || '#'} className="text-white/80 hover:text-white text-xs lg:text-sm font-medium tracking-normal transition-colors whitespace-nowrap">
                {name}
              </a>
            ))}
          </div>

          {/* Right Action & Language selector */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language dropdown */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/15 text-xs font-mono">
              {['EN', 'HI', 'PA'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded-full transition-all ${lang === l ? 'bg-white text-black font-bold' : 'text-white/70 hover:text-white'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={handleLoginClick}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs md:text-sm rounded-full px-4 py-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shrink-0 whitespace-nowrap"
            >
              {isLoggedIn ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{t.dashboardBtn}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.demoBtn}</span>
                </>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex flex-col items-end justify-center w-9 h-9 gap-1.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`block h-[2px] bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? 'w-5 translate-y-[8px] rotate-45' : 'w-5'}`} />
              <span className={`block h-[2px] bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : 'w-3.5'}`} />
              <span className={`block h-[2px] bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? 'w-5 -translate-y-[8px] -rotate-45' : 'w-5'}`} />
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 flex flex-col ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl transition-opacity duration-500" onClick={closeMenu} />
        <div className="relative z-50 flex flex-col justify-between h-full pt-28 pb-12 px-8 max-w-md mx-auto w-full">
          <div className="flex flex-col gap-5">
            <span className="text-xs uppercase tracking-widest text-white/40 font-medium">Navigation</span>
            {t.navLinks.map((name, i) => (
              <a key={i} href={NAV_LINKS[i]?.href || '#'} onClick={closeMenu} className="font-instrument-serif text-3xl text-white/90 hover:text-white flex items-center justify-between border-b border-white/10 pb-3">
                <span>{name}</span>
                <ArrowUpRight className="w-5 h-5 opacity-50" />
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => { closeMenu(); handleLoginClick(); }} className="w-full text-center bg-emerald-500 text-slate-950 font-bold py-3.5 rounded-full text-base shadow-lg">
              {isLoggedIn ? t.dashboardBtn : t.demoBtn}
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION WITH VIDEO BACKGROUND */}
      <section className="relative w-full h-screen overflow-hidden flex flex-col justify-between pt-28 md:pt-36 pb-8 px-6">
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{ transform: `scale(${videoScale})`, filter: `blur(${videoBlur}px)`, transition: 'filter 0.1s ease-out' }}
            className="w-full h-full object-cover object-center will-change-transform opacity-75"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204103_f607742e-09da-4cf5-bb06-4e67b0a531de.mp4"
          />
          <div style={{ backgroundColor: `rgba(5, 5, 8, ${videoDarkness})` }} className="absolute inset-0 transition-colors duration-150" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050508]" />
        </div>

        <div style={{ opacity: heroOpacity, transform: `translateY(-${heroTranslateY}px)`, willChange: 'transform, opacity' }} className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full apple-glass text-xs text-white/80 uppercase tracking-widest mb-6 sm:mb-8 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.tagline}</span>
          </div>

          <h1 className="font-instrument-serif text-white text-4xl sm:text-6xl md:text-7xl lg:text-[84px] leading-[1.08] tracking-tight max-w-4xl drop-shadow-2xl">
            {t.heroTitle}
          </h1>

          <p className="mt-5 md:mt-7 text-white/80 text-base md:text-lg font-light max-w-xl leading-relaxed">
            {t.heroSub}
          </p>

          <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleLoginClick}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-emerald-500 text-slate-950 rounded-full px-8 py-3.5 text-sm font-bold hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              <span>{isLoggedIn ? t.dashboardBtn : t.demoBtn}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <a href="#simulation" className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/25 text-white rounded-full px-8 py-3.5 text-sm font-medium hover:bg-white/20 transition-all shadow-lg">
              <Play className="w-4 h-4 fill-white/80" />
              <span>{t.monitorBtn}</span>
            </a>
          </div>

        </div>

        <div style={{ opacity: Math.max(0, 1 - scrollY / 250) }} className="relative z-10 flex flex-col items-center justify-center gap-2 text-white/50 text-xs tracking-widest uppercase transition-opacity">
          <span>Scroll to explore platform</span>
          <ChevronDown className="w-4 h-4 animate-bounce text-white/70" />
        </div>
      </section>

      {/* DATASET DOWNLOAD BANNER */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 py-8 border-y border-white/10 bg-[#08080d]/80">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-instrument-serif text-xl text-white">Agri Bot Sample Dataset</h3>
              <p className="text-xs text-white/60 font-light">Includes 12-zone field telemetry, soil sensors, leaf pathology scans & GPS logs (JSON).</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDatasetModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all"
            >
              {t.datasetViewBtn}
            </button>
            <a
              href="/sample_dataset.json"
              download="agri_bot_sample_dataset.json"
              className="px-5 py-2 rounded-full bg-white text-black font-medium text-xs hover:bg-gray-100 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.datasetBtn}</span>
            </a>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-3">
              <span>The Problem</span>
            </div>
            <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
              {t.problemTitle}
            </h2>
          </div>
          <p className="text-white/60 text-sm md:text-base max-w-md font-light">
            {t.problemSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROBLEM_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="apple-glass-card rounded-3xl p-8 flex flex-col justify-between group transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider px-2 py-0.5 rounded border border-white/10">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3 tracking-tight">{card.title}</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center apple-glass rounded-2xl py-6 px-8 max-w-3xl mx-auto border border-white/15">
          <p className="font-instrument-serif text-2xl md:text-3xl text-white">
            "{t.problemLine}"
          </p>
        </div>
      </section>

      {/* HOW AGRI BOT WORKS */}
      <section id="how-it-works" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Closed-Loop Workflow</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.howTitle}
          </h2>
        </div>

        <div className="w-full overflow-x-auto pb-6 mb-12">
          <div className="flex items-center justify-between min-w-[900px] gap-2 apple-glass p-4 rounded-full border border-white/15">
            {WORK_STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setActiveStep(idx)}
                    className={`flex-1 flex flex-col items-center p-3 rounded-full transition-all ${
                      isActive 
                        ? 'bg-white text-black scale-105 shadow-lg' 
                        : 'hover:bg-white/5 border border-transparent text-white/70'
                    }`}
                  >
                    <span className="text-[10px] font-mono mb-1">{step.id}</span>
                    <StepIcon className="w-4 h-4 mb-1" />
                    <span className="text-xs font-medium tracking-wide">{step.title}</span>
                  </button>

                  {idx < WORK_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-white/20 shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="apple-glass-card rounded-3xl p-8 md:p-10 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0">
              {(() => {
                const Icon = WORK_STEPS[activeStep].icon;
                return <Icon className="w-6 h-6" />;
              })()}
            </div>
            <div>
              <div className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1">
                Step {WORK_STEPS[activeStep].id} Breakdown
              </div>
              <h3 className="font-instrument-serif text-3xl text-white mb-2">{WORK_STEPS[activeStep].title}</h3>
              <p className="text-white/70 text-sm font-light leading-relaxed">{WORK_STEPS[activeStep].detail}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SMART SENSING SYSTEM */}
      <section id="sensors" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <Cpu className="w-3.5 h-3.5 text-amber-300" />
            <span>Hardware Payload</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.sensorTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SENSOR_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="apple-glass-card rounded-2xl p-7 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-emerald-400">{item.val}</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{item.name}</h3>
                  <p className="text-white/60 text-xs font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FIELD ZONE DIVISION */}
      <section id="zone-map" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Field Segmentation</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.zoneTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 apple-glass rounded-3xl p-6 border border-white/15">
            <div className="flex items-center justify-between mb-6 text-xs font-mono text-white/50">
              <span>FIELD ZONES (12 SECTORS)</span>
              <div className="flex gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Critical</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {ZONE_GRID.map((z) => {
                const isSelected = selectedZone.id === z.id;
                return (
                  <button
                    key={z.id}
                    onClick={() => setSelectedZone(z)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-3 border transition-all ${
                      z.status === 'critical' ? 'bg-red-500/20 border-red-500/40 text-white' :
                      z.status === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-white' :
                      'bg-white/5 border-white/10 text-white/80'
                    } ${isSelected ? 'ring-2 ring-emerald-400 scale-105 shadow-xl' : 'hover:bg-white/10'}`}
                  >
                    <span className="text-lg font-mono font-bold">{z.id}</span>
                    <span className="text-[10px] uppercase font-mono mt-1 opacity-60">{z.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 apple-glass-card rounded-3xl p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono text-white/40">ZONE DIAGNOSTICS</span>
                <h3 className="font-instrument-serif text-3xl text-white">Zone {selectedZone.id}</h3>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-mono bg-white/10 text-white border border-white/15">
                {selectedZone.label}
              </span>
            </div>

            <div className="space-y-4 text-sm font-light mb-6">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Observation</span>
                <span className="text-white font-medium">{selectedZone.disease}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Soil Moisture</span>
                <span className="text-emerald-400 font-mono">{selectedZone.moisture}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">Ambient Temp</span>
                <span className="text-white font-mono">{selectedZone.temp}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/50">GPS Location</span>
                <span className="text-white/60 font-mono text-xs">{selectedZone.gps}</span>
              </div>
            </div>

            <button
              onClick={() => setInspectModalOpen(true)}
              className="w-full py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-gray-100 transition-all"
            >
              Inspect Leaf Pathology Image
            </button>
          </div>
        </div>
      </section>

      {/* SMART IRRIGATION */}
      <section id="irrigation" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Targeted Water Management</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.irrigationTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="apple-glass rounded-3xl p-8 border border-white/15">
            <h3 className="font-instrument-serif text-2xl text-white mb-6">Decision Engine Schema</h3>
            <div className="space-y-3 font-mono text-xs text-white/70">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">Soil Moisture + Temp + Humidity + Rain</div>
              <div className="text-center text-white/30">↓</div>
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-center">
                IRRIGATION DECISION ENGINE
              </div>
              <div className="text-center text-white/30">↓</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-emerald-500/30 text-emerald-200">Irrigate B2</div>
                <div className="p-2 rounded bg-white/5 text-white/50">Delay C1</div>
                <div className="p-2 rounded bg-white/5 text-white/50">Stop A3</div>
              </div>
            </div>
          </div>

          <div className="apple-glass-card rounded-3xl p-8">
            <h3 className="font-instrument-serif text-2xl text-white mb-6">Automatic Actions</h3>
            <div className="grid grid-cols-2 gap-4 text-sm font-light">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-white/40 block mb-1">Pump Status</span>
                <span className="text-emerald-400 font-medium">Shower Pump ON</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-white/40 block mb-1">Water Volume Used</span>
                <span className="text-white font-medium">420 Liters</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-white/40 block mb-1">Target Zone</span>
                <span className="text-white font-medium">Zone B2</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-xs text-white/40 block mb-1">Duration</span>
                <span className="font-mono text-white">14m 22s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM ARCHITECTURE */}
      <section id="architecture" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>Architecture Integration</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.archTitle}
          </h2>
        </div>

        <div className="apple-glass rounded-3xl p-8 border border-white/15 max-w-4xl mx-auto overflow-x-auto">
          <div className="min-w-[800px] flex flex-col gap-5 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-center font-bold text-white text-base">
              KRISHIVISION AI HARDWARE & EMBEDDED STACK
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">4K AI VISION CAMERA</div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">IOT SOIL & CLIMATE SENSORS</div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white">VALVE & PUMP ACTUATORS</div>
            </div>

            <div className="text-center text-white/30 text-sm">↓</div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/5 text-white/80">YOLOv11 + ViT Patch16 AI</div>
              <div className="p-3 rounded-xl bg-white/5 text-white/80">ESP32 Telemetry Module</div>
              <div className="p-3 rounded-xl bg-white/5 text-white/80">FastAPI Server Backend</div>
            </div>

            <div className="text-center text-white/30 text-sm">↓</div>

            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-center">
              DECISION ENGINE & AGRI ASSISTANT
            </div>

            <div className="text-center text-white/30 text-sm">↓</div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-white/5 text-white/70">Irrigation → Smart Pump</div>
              <div className="p-3 rounded-xl bg-white/5 text-white/70">Disease Risk → PDF Report</div>
              <div className="p-3 rounded-xl bg-white/5 text-white/70">Escalation → Extension Officer</div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE FIELD SIMULATOR */}
      <section id="simulation" className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Live Field Simulation</span>
          </div>
          <h2 className="font-instrument-serif text-4xl sm:text-5xl md:text-6xl text-white tracking-tight">
            {t.simTitle}
          </h2>
        </div>

        <div className="apple-glass rounded-3xl p-8 border border-white/20 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4 text-xs font-mono text-white/50">
              <span>LIVE FIELD MAP</span>
              <span className="text-emerald-400">Rover @ Zone {roverPos}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'].map((code) => {
                const isRoverHere = roverPos === code;
                const isB2 = code === 'B2';
                return (
                  <button
                    key={code}
                    onClick={() => setRoverPos(code)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-3 border transition-all relative ${
                      isB2 ? 'bg-red-500/20 border-red-500/40 text-white' : 'bg-white/5 border-white/10 text-white/80'
                    }`}
                  >
                    <span className="text-lg font-mono">{code}</span>
                    {isRoverHere && (
                      <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg">
                        🤖
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 apple-glass-card rounded-3xl p-8">
            <span className="text-xs font-mono text-red-400 uppercase block mb-2">EVENT DETECTED @ ZONE B2</span>
            <h3 className="font-instrument-serif text-2xl text-white mb-2">Possible Crop Disease</h3>
            <p className="text-xs text-white/60 font-light mb-4">
              Temp: 34°C | Humidity: 62% | Soil Moisture: 24%
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setInspectModalOpen(true)}
                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-all"
              >
                View Image
              </button>
              <button
                onClick={() => setRoverPos('B2')}
                className="flex-1 py-3 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all"
              >
                Navigate Robot
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 py-28 border-t border-white/10 text-center">
        <div className="apple-glass rounded-3xl p-12 md:p-16 border border-white/20 max-w-4xl mx-auto">
          <h2 className="font-instrument-serif text-4xl sm:text-6xl text-white tracking-tight mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-white/80 text-lg md:text-xl font-light mb-8">
            {t.ctaSub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleLoginClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all shadow-xl"
            >
              {isLoggedIn ? t.dashboardBtn : t.demoBtn}
            </button>
            <a
              href="/sample_dataset.json"
              download="agri_bot_sample_dataset.json"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/25 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t.datasetBtn}</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-white/10 bg-[#030306] pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="pb-12 border-b border-white/10 grid grid-cols-3 gap-6">
            <div><div className="text-white/40 text-xs uppercase mb-1 font-mono">INDORE, MP</div><div className="font-mono text-sm text-white/80">{currentTime.indore || '05:30 PM'} IST</div></div>
            <div><div className="text-white/40 text-xs uppercase mb-1 font-mono">NEW DELHI</div><div className="font-mono text-sm text-white/80">{currentTime.delhi || '05:30 PM'} IST</div></div>
            <div><div className="text-white/40 text-xs uppercase mb-1 font-mono">LONDON</div><div className="font-mono text-sm text-white/80">{currentTime.london || '01:00 PM'} BST</div></div>
          </div>

          <div className="py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <a href="#" className="font-instrument-serif italic text-3xl text-white tracking-tight">KrishiVision AI</a>
                <p className="mt-3 text-white/60 text-sm font-light max-w-sm leading-relaxed">
                  Autonomous Edge-AI agricultural robotics platform engineering resilient crop intelligence for Indian agriculture.
                </p>
              </div>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-white/40 font-medium">Index</span>
                <a href="#how-it-works" className="text-white/70 hover:text-white">How It Works</a>
                <a href="#sensors" className="text-white/70 hover:text-white">Sensors</a>
                <a href="#zone-map" className="text-white/70 hover:text-white">Zone Mapping</a>
                <a href="#architecture" className="text-white/70 hover:text-white">Architecture</a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-white/40 font-medium">Platform</span>
                <Link to="/login" className="text-white/70 hover:text-white">Farmer Login</Link>
                <Link to="/dashboard" className="text-white/70 hover:text-white">Live Dashboard</Link>
                <a href="/sample_dataset.json" download className="text-white/70 hover:text-white">Sample Dataset</a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs uppercase tracking-wider text-white/40 font-medium">Direct</span>
                <span className="text-white/70">support@krishivision.ai</span>
                <span className="text-white/70">+91 (1800) 180-FARM</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-xs text-white/40">
            &copy; {new Date().getFullYear()} KrishiVision AI Systems. All rights reserved.
          </div>
        </div>
      </footer>

      {/* MODAL: LEAF INSPECTOR */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="apple-glass rounded-3xl p-8 max-w-lg w-full border border-white/20 relative">
            <button onClick={() => setInspectModalOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-white/40 uppercase block mb-1">ZONE {selectedZone.id} SCANNED IMAGE</span>
            <h3 className="font-instrument-serif text-2xl text-white mb-4">Pathology Scan</h3>
            <div className="w-full h-44 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-4 mb-4 text-center">
              <Camera className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-xs text-white/80 font-mono">Simulated 4K Vision Scan</span>
              <span className="text-xs text-emerald-400 font-mono mt-1">{selectedZone.disease}</span>
            </div>
            <button onClick={() => setInspectModalOpen(false)} className="w-full py-3 rounded-full bg-white text-black font-medium text-sm hover:bg-gray-100">
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DATASET SCHEMA VIEWER */}
      {datasetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="apple-glass rounded-3xl p-8 max-w-2xl w-full border border-white/20 relative max-h-[80vh] flex flex-col">
            <button onClick={() => setDatasetModalOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-emerald-400 block mb-1">SAMPLE_DATASET.JSON</span>
            <h3 className="font-instrument-serif text-2xl text-white mb-4">Agri Bot Structured Data Payload</h3>
            
            <div className="flex-1 overflow-y-auto bg-black/60 p-4 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300">
              <pre>{JSON.stringify(sampleData, null, 2)}</pre>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <a
                href="/sample_dataset.json"
                download="agri_bot_sample_dataset.json"
                className="px-5 py-2.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </a>
              <button onClick={() => setDatasetModalOpen(false)} className="text-xs text-white/60 hover:text-white">
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
