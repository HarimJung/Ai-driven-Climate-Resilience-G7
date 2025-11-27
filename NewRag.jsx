import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, MessageSquareText, Settings, Bell, Search, 
  ChevronRight, Send, Paperclip, FileText, Globe, TrendingUp,
  Database, MapPin, UploadCloud, Download, Filter, Layers, 
  Zap, Truck, Sprout, ThermometerSun, AlertTriangle, 
  CheckCircle2, ArrowUpRight, Share2, Activity, BookOpen, MoreHorizontal,
  Calendar, FilePlus, ExternalLink, Eye, X, Maximize2, Hash
} from 'lucide-react';

// --- 1. EXPANDED KNOWLEDGE BASE (REAL-WORLD DATA MOCKUP) ---

const GEO_CONFIG = {
  'Toronto': { country: 'Canada', flag: '🇨🇦', code: 'CA' },
  'Vancouver': { country: 'Canada', flag: '🇨🇦', code: 'CA' },
  'Berlin': { country: 'Germany', flag: '🇩🇪', code: 'DE' },
  'Munich': { country: 'Germany', flag: '🇩🇪', code: 'DE' },
  'Paris': { country: 'France', flag: '🇫🇷', code: 'FR' },
  'Lyon': { country: 'France', flag: '🇫🇷', code: 'FR' },
};

const SCENARIO_CONFIG = {
  'Agri': {
    label: 'Agri-Food Security',
    icon: Sprout,
    theme: 'emerald', 
    metrics: ['Soil Moisture', 'Precipitation', 'Crop Stress'],
    ragTags: ['agri', 'food', 'drought']
  },
  'Energy': {
    label: 'Energy Grid Resilience',
    icon: Zap,
    theme: 'amber', 
    metrics: ['Grid Load', 'Solar Output', 'Frequency'],
    ragTags: ['energy', 'grid', 'renewable']
  },
  'Supply': {
    label: 'Supply Chain Logistics',
    icon: Truck,
    theme: 'blue',
    metrics: ['Port Status', 'Wind Gusts', 'Throughput'],
    ragTags: ['transport', 'trade', 'logistics']
  },
  'Health': {
    label: 'Urban Health & Safety',
    icon: ThermometerSun,
    theme: 'rose', 
    metrics: ['Wet Bulb Temp', 'Air Quality', 'ER Visits'],
    ragTags: ['health', 'safety', 'heat']
  }
};

// [정책 DB: 실제 G7 및 UN 정책 기반 시뮬레이션 데이터]
const FULL_POLICY_DB = [
  // --- GLOBAL / UN (Critical Frameworks) ---
  { id: 'UN-01', country: 'Global', tags: ['agri', 'food'], title: 'UN Zero Hunger Challenge (SDG 2)', type: 'Goal', year: '2015', desc: 'Global initiative to end hunger, achieve food security and improved nutrition.', excerpt: 'Target 2.4: Ensure sustainable food production systems and implement resilient agricultural practices.' },
  { id: 'UN-02', country: 'Global', tags: ['energy', 'climate'], title: 'Paris Agreement', type: 'Treaty', year: '2015', desc: 'Legally binding international treaty on climate change adopted by 196 Parties.', excerpt: 'Article 7: Enhancing adaptive capacity, strengthening resilience and reducing vulnerability to climate change.' },
  { id: 'UN-03', country: 'Global', tags: ['supply', 'risk'], title: 'Sendai Framework for Disaster Risk Reduction', type: 'Framework', year: '2015', desc: 'Global blueprint to prevent new and reduce existing disaster risks.', excerpt: 'Priority 4: Enhancing disaster preparedness for effective response and to "Build Back Better" in recovery.' },

  // --- CANADA (Agri & Energy focus) ---
  { id: 'CA-A1', country: 'Canada', tags: ['agri', 'strategy'], title: 'Sustainable Canadian Agricultural Partnership', type: 'Framework', year: '2023', desc: 'A $3.5 billion, 5-year agreement to strengthen the competitiveness and resilience of the agriculture sector.', excerpt: 'Clause 4.2: $250M allocated for Resilient Agricultural Landscape Program to support soil carbon sequestration.' },
  { id: 'CA-A2', country: 'Canada', tags: ['agri', 'emergency'], title: 'Canada Grain Act Modernization', type: 'Legislation', year: '2021', desc: 'Updates to grain quality assurance and producer protection protocols.', excerpt: 'Section 12: Emergency grain storage protocols triggered when transport capacity drops below 50% due to weather.' },
  { id: 'CA-E1', country: 'Canada', tags: ['energy', 'net-zero'], title: '2030 Emissions Reduction Plan', type: 'Strategy', year: '2022', desc: 'Comprehensive roadmap to reach 40-45% emission reductions below 2005 levels.', excerpt: 'Chapter 2: Grid modernization investments ($900M) to support inter-provincial renewable transmission.' },

  // --- GERMANY (Energy & Industry focus) ---
  { id: 'DE-E1', country: 'Germany', tags: ['energy', 'law'], title: 'Renewable Energy Sources Act (EEG 2023)', type: 'Legislation', year: '2023', desc: 'The central instrument for the eco-power expansion in Germany.', excerpt: 'Para 8: Priority feed-in for renewables is established as a matter of overriding public interest and public security.' },
  { id: 'DE-E2', country: 'Germany', tags: ['energy', 'crisis'], title: 'Energy Security Act (EnSiG)', type: 'Act', year: '2022', desc: 'Legal framework for ensuring energy supply during crisis situations.', excerpt: 'Article 1, Section 3: Federal government authority to mandate load shedding for non-essential industries.' },
  { id: 'DE-A1', country: 'Germany', tags: ['agri'], title: 'Arable Farming Strategy 2035', type: 'Strategy', year: '2022', desc: 'Long-term strategy for sustainable crop production.', excerpt: 'Guideline 5: Improving water retention in soil through humus build-up to combat increasing drought periods.' },

  // --- FRANCE (Health & Urban focus) ---
  { id: 'FR-H1', country: 'France', tags: ['health', 'heat'], title: 'Plan National Canicule (Heat Wave Plan)', type: 'Protocol', year: '2023', desc: 'Operational levels for managing extreme heat waves in France.', excerpt: 'Level 3 (Orange): Prefects must activate "ORSEC" emergency plans and open cooling centers in urban zones.' },
  { id: 'FR-H2', country: 'France', tags: ['health', 'urban'], title: 'Climate and Resilience Law', type: 'Law', year: '2021', desc: 'Wide-ranging law to combat climate change and strengthen resilience.', excerpt: 'Article 15: Ban on renting "thermal sieves" (poorly insulated housing) starting 2025 to protect vulnerable populations.' },
];

// --- 2. COMPONENTS ---

const G7PolicyCoPilot = () => {
  // Global State
  const [selectedCity, setSelectedCity] = useState('Toronto');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeScenario, setActiveScenario] = useState('Agri');
  const [dateFilter, setDateFilter] = useState('1M');
  
  // PDF Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState(null); 

  // Dynamic Briefing State (The "Brain")
  const [briefingData, setBriefingData] = useState({
    signal: 'Initializing...',
    status: 'ANALYZING',
    policyTitle: 'Mapping Policies...',
    policyExcerpt: '...',
    action: 'Calculating Strategy...'
  });

  // Chat State
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Policy Lib State
  const [searchTerm, setSearchTerm] = useState('');
  const [docs, setDocs] = useState(FULL_POLICY_DB); // Local state for docs (allowing uploads)
  
  // Derived
  const currentCountry = GEO_CONFIG[selectedCity].country;
  const currentConfig = SCENARIO_CONFIG[activeScenario];
  
  // RAG Filter Logic (Context Aware)
  const contextPolicies = docs.filter(doc => 
    (doc.country === currentCountry || doc.country === 'Global') &&
    doc.tags.some(tag => currentConfig.ragTags.includes(tag))
  );

  // --- EFFECT: Update Briefing on Context Change ---
  useEffect(() => {
    // 1. Initial Message
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'ai',
      type: 'text',
      content: `[시스템 모드 변경] ${selectedCity}(${currentCountry}) / ${currentConfig.label} 모니터링을 시작합니다. 관련 UN 및 국가 정책 ${contextPolicies.length}건이 로드되었습니다.`
    }]);

    // 2. Simulate AI Analysis based on Scenario
    // 시나리오가 바뀌면 기본 '초기값'을 설정하되, 채팅으로 바꿀 수 있게 함
    let signal = "Normal";
    let status = "STABLE";
    let action = "Monitor";
    
    if (activeScenario === 'Agri') {
        signal = "Soil Moisture < 15%";
        status = "CRITICAL";
        action = "Activate Drought Relief";
    } else if (activeScenario === 'Energy') {
        signal = "Renewable Drop > 30%";
        status = "WARNING";
        action = "Request Load Shedding";
    } else if (activeScenario === 'Health') {
        signal = "Heat Index > 40°C";
        status = "DANGER";
        action = "Open Cooling Centers";
    } else if (activeScenario === 'Supply') {
        signal = "Port Congestion > 85%";
        status = "DELAYED";
        action = "Reroute Logistics";
    }

    setBriefingData({
        signal: signal,
        status: status,
        policyTitle: contextPolicies[0]?.title || "Generic Protocol",
        policyExcerpt: contextPolicies[0]?.excerpt || "No specific clause found.",
        action: action
    });

  }, [selectedCity, activeScenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- HANDLERS ---

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', type: 'text', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      
      // Dynamic Logic based on User Input (This is the AI Brain Simulation)
      let newBriefing = { ...briefingData };
      let replyContent = "";
      let matchedDoc = contextPolicies[0];
      let actionTitle = "View Analysis";

      // 키워드에 따라 대시보드의 '전략(Strategy)'을 바꿈
      if (input.includes("예산") || input.includes("돈") || input.includes("funding")) {
          newBriefing.signal = "Budgetary Gap Detected";
          newBriefing.status = "FINANCIAL ALERT";
          newBriefing.action = "Authorize Emergency Fund";
          replyContent = "예산 관련 정책 조항을 분석했습니다. 긴급 자금 투입이 가능한 조항을 찾았습니다. 대시보드 전략을 '자금 집행' 모드로 전환합니다.";
          // Find a funding related doc if possible
          matchedDoc = contextPolicies.find(p => p.excerpt.includes('$') || p.tags.includes('strategy')) || contextPolicies[0];
          newBriefing.policyTitle = matchedDoc.title;
          newBriefing.policyExcerpt = matchedDoc.excerpt;
          actionTitle = "Approve Funds";

      } else if (input.includes("법") || input.includes("규제") || input.includes("law")) {
          newBriefing.action = "Legal Review Required";
          replyContent = "관련 법령 및 규제 사항을 검토하여 대시보드에 반영했습니다. 법적 리스크가 감지됩니다.";
          matchedDoc = contextPolicies.find(p => p.type === 'Legislation' || p.type === 'Law' || p.type === 'Act') || contextPolicies[0];
          newBriefing.policyTitle = matchedDoc.title;
          newBriefing.policyExcerpt = matchedDoc.excerpt;
          actionTitle = "Review Law";

      } else if (input.includes("대안") || input.includes("방법") || input.includes("solution")) {
          newBriefing.action = "Deploy Alternative Route";
          replyContent = "현재 위기 상황에 대한 대체 프로토콜(Alternative Protocol)을 제안합니다.";
          matchedDoc = contextPolicies[1] || contextPolicies[0]; // Switch to second policy
          newBriefing.policyTitle = matchedDoc.title;
          newBriefing.policyExcerpt = matchedDoc.excerpt;
          actionTitle = "Deploy Alt";

      } else {
          replyContent = `RAG 엔진이 ${currentCountry}의 정책 문서와 UN 프레임워크를 교차 분석하여 답변을 생성 중입니다.`;
      }

      // Update Dashboard UI (The connection between Chat -> Dashboard)
      setBriefingData(newBriefing);

      // Reply in Chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        type: 'rag_card',
        title: 'Strategy Updated',
        policyTitle: matchedDoc?.title,
        excerpt: matchedDoc?.excerpt,
        action: actionTitle,
        docId: matchedDoc?.id,
        content: replyContent
      }]);

    }, 1000);
  };

  const openPdfViewer = (docId) => {
    const doc = docs.find(d => d.id === docId);
    if (doc) setViewingDoc(doc);
  };

  const closePdfViewer = () => setViewingDoc(null);

  const simulateDownload = (title) => {
    alert(`Downloading package for: ${title}\nIncludes: PDF Report, Raw Data (CSV), Visualization Snapshot`);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulate file upload and indexing
      const newDoc = {
        id: Date.now(),
        country: currentCountry,
        tags: [currentConfig.ragTags[0], 'uploaded'],
        title: file.name,
        type: 'Uploaded Report',
        year: '2025',
        desc: 'User uploaded document. Pending detailed vector analysis.',
        excerpt: 'Content indexing in progress... RAG vectors will be available shortly.'
      };
      setDocs([newDoc, ...docs]);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        type: 'text',
        content: `문서 '${file.name}' 업로드 완료. RAG 엔진에 인덱싱되었습니다. 이제 이 문서를 기반으로 질의응답이 가능합니다.`
      }]);
    }
  };

  // --- RENDER HELPERS ---

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          <div className="h-20 flex items-center px-6 lg:px-8 border-b border-slate-50">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-slate-900">GovAI<span className="text-indigo-600">.Nexus</span></span>
          </div>
          <nav className="p-4 space-y-1 mt-6">
            <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hidden lg:block">Platform</div>
            <NavItem icon={LayoutDashboard} label="Command Center" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={Layers} label="Policy Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
            <NavItem icon={Database} label="Data Lake" active={activeTab === 'data'} onClick={() => setActiveTab('data')} />
          </nav>
        </div>
        <div className="p-4 border-t border-slate-50 hidden lg:block">
           <div className="bg-slate-900 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                 <span className="text-xs font-bold text-green-400">RAG ACTIVE</span>
              </div>
              <p className="text-xs text-slate-400">
                Indexing {docs.length} documents across G7 datasets.
              </p>
           </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-700 hidden md:block">Climate Resilience Platform</h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 border border-slate-200 hover:border-indigo-400 transition-colors">
              <MapPin size={16} className="text-indigo-600" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none min-w-[140px]"
              >
                {Object.keys(GEO_CONFIG).map(city => (
                  <option key={city} value={city}>{city}, {GEO_CONFIG[city].country}</option>
                ))}
              </select>
              <span className="text-lg">{GEO_CONFIG[selectedCity].flag}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">UN</div>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          
          {/* === DASHBOARD TAB === */}
          {activeTab === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              
              {/* Scenario & Actions */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex bg-white p-1.5 rounded-full border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                   {Object.entries(SCENARIO_CONFIG).map(([key, config]) => (
                     <button
                        key={key}
                        onClick={() => setActiveScenario(key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                          activeScenario === key 
                            ? `bg-${config.theme}-600 text-white shadow-md` 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <config.icon size={16} />
                        {config.label}
                      </button>
                   ))}
                 </div>
                 <button 
                   onClick={() => simulateDownload(`Dashboard Report - ${selectedCity}`)}
                   className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg text-sm font-bold whitespace-nowrap"
                 >
                    <Download size={18} /> Export Report
                 </button>
              </div>

              {/* Tableau Container */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[550px] relative flex flex-col group">
                 <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm absolute w-full top-0 z-10">
                    <div className="flex items-center gap-3">
                       <span className={`w-2.5 h-2.5 rounded-full bg-${currentConfig.theme}-500 animate-pulse`}></span>
                       <span className="font-bold text-slate-700">Live View: {selectedCity}</span>
                       <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 font-mono border border-slate-200">
                         {currentConfig.metrics.join(' • ')}
                       </span>
                    </div>
                    <div className="flex gap-2">
                       <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Filter size={18}/></button>
                       <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Share2 size={18}/></button>
                    </div>
                 </div>
                 <div className="flex-1 bg-slate-50 relative flex flex-col items-center justify-center text-center p-8 pt-20">
                    <div className={`p-8 rounded-full bg-${currentConfig.theme}-50 mb-6 group-hover:scale-105 transition-transform duration-500 shadow-inner`}>
                       <LayoutDashboard className={`w-20 h-20 text-${currentConfig.theme}-500`} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700">Tableau Analytics Container</h3>
                    <p className="text-slate-400 max-w-md mt-3">
                      Visualizing real-time <strong>{activeScenario}</strong> data for <strong>{selectedCity}</strong>.
                      <br/>(Tableau Iframe area)
                    </p>
                 </div>
              </div>

              {/* AI Strategic Analysis */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                    <MessageSquareText className="text-white" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">AI Strategic Briefing</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500 animate-pulse">
                    Live updates from Chat Context
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Card 1: Signal */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-red-200 transition-all group h-full">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors"><Activity size={24}/></div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                          briefingData.status === 'CRITICAL' || briefingData.status === 'DANGER' || briefingData.status === 'FINANCIAL ALERT' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {briefingData.status}
                        </span>
                     </div>
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">Detected Signal</div>
                     <div className="text-xl font-bold text-slate-800 mb-2">{briefingData.signal}</div>
                     <p className="text-sm text-slate-500 leading-relaxed">
                       AI analysis of telemetry vs. policy baselines. Context: {activeScenario}.
                     </p>
                  </div>

                  {/* Card 2: Policy Map (Clickable) */}
                  <div 
                    onClick={() => openPdfViewer(contextPolicies.find(p => p.title === briefingData.policyTitle)?.id)}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all group h-full flex flex-col cursor-pointer"
                  >
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors"><BookOpen size={24}/></div>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                          RAG Match <ArrowUpRight size={10}/>
                        </span>
                     </div>
                     <div className="text-xs font-bold text-slate-400 uppercase mb-1">Primary Protocol</div>
                     <div className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{briefingData.policyTitle}</div>
                     <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4 flex-1">
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          "{briefingData.policyExcerpt}"
                        </p>
                     </div>
                     <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:underline">
                       Click to read full policy document
                     </div>
                  </div>

                  {/* Card 3: Action Plan */}
                  <div className={`bg-${currentConfig.theme}-50 p-6 rounded-2xl border border-${currentConfig.theme}-200 shadow-sm relative overflow-hidden group h-full flex flex-col`}>
                     <div className="relative z-10 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                           <CheckCircle2 size={24} className={`text-${currentConfig.theme}-600`}/>
                           <span className={`text-xs font-bold text-${currentConfig.theme}-700 uppercase`}>Recommendation</span>
                        </div>
                        <h4 className={`text-2xl font-bold text-${currentConfig.theme}-900 mb-3`}>{briefingData.action}</h4>
                        <p className={`text-sm text-${currentConfig.theme}-800 font-medium leading-relaxed mb-6`}>
                          Execute this protocol immediately to mitigate the detected risks in accordance with national guidelines.
                        </p>
                        <button className="mt-auto w-full py-3 bg-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all text-slate-800">
                          Authorize Action
                        </button>
                     </div>
                     <div className={`absolute -right-6 -bottom-6 text-${currentConfig.theme}-200 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform`}>
                        <currentConfig.icon size={120} />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === POLICY LIBRARY TAB === */}
          {activeTab === 'library' && (
            <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800">Policy Document Explorer</h2>
                   <p className="text-slate-500 mt-1">
                     Showing <strong>{contextPolicies.length}</strong> documents for <span className="font-bold text-indigo-600">{currentCountry}</span> & Global Frameworks
                   </p>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                   <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"/>
                      <input 
                        type="text" 
                        placeholder="Search corpus..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                      />
                   </div>
                   <button 
                     onClick={() => document.getElementById('upload-doc').click()}
                     className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap"
                   >
                      <UploadCloud size={16}/> Upload
                   </button>
                   <input id="upload-doc" type="file" className="hidden" onChange={handleFileUpload} />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {contextPolicies
                   .filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))
                   .map(doc => (
                   <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col h-full">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                           <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wide">{doc.type}</span>
                           <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wide">{doc.country}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Calendar size={12}/> {doc.year}</span>
                      </div>
                      
                      {/* Title & Desc */}
                      <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                        {doc.desc}
                      </p>

                      {/* Hashtags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                         {doc.tags.map(t => (
                           <span key={t} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1">
                             <Hash size={10}/> {t}
                           </span>
                         ))}
                      </div>

                      {/* RAG Excerpt (Highlighted) */}
                      <div className="mt-auto bg-amber-50/50 p-3 rounded-xl border border-amber-100 mb-4">
                         <p className="text-[10px] font-bold text-amber-700 mb-1 uppercase tracking-wide">RAG Extract</p>
                         <p className="text-xs text-slate-700 italic line-clamp-3">
                           "{doc.excerpt}"
                         </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 flex gap-3">
                        <button 
                          onClick={() => openPdfViewer(doc.id)}
                          className="flex-1 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                           <Eye size={16}/> View PDF
                        </button>
                        <button 
                          onClick={() => simulateDownload(doc.title)}
                          className="px-4 py-2.5 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                        >
                          <Download size={18}/>
                        </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* === DATA LAKE TAB === */}
          {activeTab === 'data' && (
             <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <div>
                      <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        Raw Data Stream: {selectedCity}
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">LIVE</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">Metrics: {currentConfig.metrics.join(', ')}</p>
                   </div>
                   <div className="flex gap-2 bg-slate-50 p-1 rounded-lg">
                      {['1M', '3M', '6M', '1Y'].map(f => (
                        <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${dateFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>{f}</button>
                      ))}
                   </div>
                </div>
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                         <th className="p-4 pl-6">Timestamp</th>
                         {currentConfig.metrics.map(m => <th key={m} className="p-4">{m}</th>)}
                         <th className="p-4 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {[...Array(15)].map((_, i) => (
                         <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 pl-6 font-mono text-slate-400 text-xs">2025-11-{27-i}</td>
                            {currentConfig.metrics.map(m => (
                                <td key={m} className="p-4 font-mono font-bold text-slate-700">{(Math.random()*100).toFixed(2)}</td>
                            ))}
                            <td className="p-4 text-center">
                               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${i % 3 === 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                 {i % 3 === 0 ? 'WARNING' : 'NORMAL'}
                               </span>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

        </div>
      </main>

      {/* 3. CHATBOT (Right Panel) */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-40 flex flex-col border-l border-slate-200 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setChatOpen(!chatOpen)} className="absolute -left-12 top-1/2 bg-white p-3 rounded-l-2xl shadow-lg border-y border-l border-slate-200 text-indigo-600 hover:pl-4 transition-all">
          {chatOpen ? <ChevronRight /> : <MessageSquareText />}
        </button>
        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50 backdrop-blur">
           <div>
              <h3 className="font-bold text-slate-800 text-sm">Policy Co-Pilot</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 <span className="text-[10px] text-slate-500 font-medium uppercase">Online</span>
              </div>
           </div>
           <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><MoreHorizontal size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'rag_card' ? (
                <div className="max-w-[90%] bg-indigo-50 border border-indigo-100 p-4 rounded-2xl rounded-bl-none shadow-sm animate-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} className="text-indigo-600"/>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Policy Match</span>
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{msg.policyTitle}</h4>
                   <p className="text-xs text-slate-500 italic mb-3 border-l-2 border-indigo-200 pl-2 line-clamp-2">"{msg.excerpt}"</p>
                   <p className="text-sm text-slate-700 mb-3 leading-relaxed">{msg.content}</p>
                   {msg.docId && (
                     <button 
                       onClick={() => openPdfViewer(msg.docId)}
                       className="w-full py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors"
                     >
                       {msg.action}
                     </button>
                   )}
                </div>
              ) : (
                <div className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                   {msg.content}
                </div>
              )}
            </div>
          ))}
          {isTyping && <div className="text-xs text-slate-400 px-4 flex gap-1"><span className="animate-bounce">●</span><span className="animate-bounce delay-75">●</span><span className="animate-bounce delay-150">●</span></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
           <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
             <input 
               value={input} 
               onChange={e => setInput(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400 pl-2" 
               placeholder="Ask about data trends or policies..." 
             />
             <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md"><Send size={16}/></button>
           </div>
        </div>
      </div>

      {/* 4. PDF VIEWER MODAL (Interactive) */}
      {viewingDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white w-[90%] h-[90%] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50">
                 <div className="flex items-center gap-3">
                    <FileText className="text-red-500" size={20}/>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">{viewingDoc.title}</h3>
                       <p className="text-xs text-slate-500">{viewingDoc.country} • {viewingDoc.year} • {viewingDoc.type}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => simulateDownload(viewingDoc.title)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Download size={18}/></button>
                    <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-500"><Maximize2 size={18}/></button>
                    <button onClick={closePdfViewer} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg text-slate-500"><X size={18}/></button>
                 </div>
              </div>
              <div className="flex-1 bg-slate-100 overflow-auto p-8 flex justify-center">
                 {/* PDF Content Simulator */}
                 <div className="w-full max-w-3xl bg-white shadow-lg min-h-[1000px] p-12 text-slate-800">
                    <div className="mb-8 border-b-2 border-slate-800 pb-4">
                       <h1 className="text-3xl font-serif font-bold mb-4 leading-tight">{viewingDoc.title}</h1>
                       <p className="text-sm font-serif italic text-slate-600">Official Publication of the {viewingDoc.country} Government</p>
                    </div>
                    <div className="space-y-6 font-serif leading-relaxed text-justify">
                       <p className="text-lg font-bold">Executive Summary</p>
                       <p>{viewingDoc.desc}</p>
                       
                       <p className="text-lg font-bold mt-6">RAG Analysis Highlight</p>
                       <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-2">
                          <p className="font-bold text-sm mb-1 text-yellow-800">Excerpt Matched by AI:</p>
                          <p className="italic">"{viewingDoc.excerpt}"</p>
                       </div>

                       <p className="mt-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                       <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                       
                       <div className="flex gap-2 my-8">
                          {viewingDoc.tags.map(tag => (
                             <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-mono">#{tag}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

// Helper
const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
    <Icon size={18} />
    <span className="font-medium text-sm hidden lg:block">{label}</span>
  </button>
);

export default G7PolicyCoPilot;
