import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, MessageSquareText, Settings, Bell, Search, 
  ChevronRight, Send, Paperclip, FileText, X, Menu,
  MoreHorizontal, CheckCircle2, AlertTriangle, ArrowUpRight,
  Database, MapPin, UploadCloud, FilePlus, Globe, TrendingUp,
  Calendar, Download, Filter, Layers, Zap, Truck, Sprout, Share2,
  ThermometerSun, Wind, Droplets, Activity, ExternalLink
} from 'lucide-react';

// --- 1. KNOWLEDGE GRAPH & CONFIGURATION ---

// [국가/도시 메타데이터]
const GEO_CONFIG = {
  'Toronto': { country: 'Canada', code: 'CA', flag: '🇨🇦', lat: 43.7, lon: -79.4, currency: 'CAD' },
  'Berlin': { country: 'Germany', code: 'DE', flag: '🇩🇪', lat: 52.5, lon: 13.4, currency: 'EUR' },
  'Paris': { country: 'France', code: 'FR', flag: '🇫🇷', lat: 48.8, lon: 2.3, currency: 'EUR' },
  'Tokyo': { country: 'Japan', code: 'JP', flag: '🇯🇵', lat: 35.6, lon: 139.6, currency: 'JPY' },
  'Rome': { country: 'Italy', code: 'IT', flag: '🇮🇹', lat: 41.9, lon: 12.5, currency: 'EUR' },
};

// [시나리오별 데이터 필드 및 분석 설정]
const SCENARIO_CONFIG = {
  'Agri': {
    label: 'Agri-Food Security',
    icon: Sprout,
    theme: 'green',
    dataFields: ['Soil Moisture (0-7cm)', 'Evapotranspiration (ET0)', 'Precipitation Sum', 'Surface Temp'],
    kpiUnit: '% Saturation',
    threshold: 0.20, // 20% 미만이면 위험
    ragKeywords: ['agriculture', 'food', 'drought', 'crop', 'irrigation']
  },
  'Energy': {
    label: 'Energy Grid Resilience',
    icon: Zap,
    theme: 'amber',
    dataFields: ['Solar Radiation (GHI)', 'Wind Speed (100m)', 'Temperature (Demand)', 'Grid Load'],
    kpiUnit: 'MW Output',
    threshold: 15, // 15% 미만 효율이면 위험
    ragKeywords: ['energy', 'grid', 'renewable', 'electricity', 'solar']
  },
  'Supply': {
    label: 'Supply Chain Logistics',
    icon: Truck,
    theme: 'blue',
    dataFields: ['Wind Gusts (Max)', 'Snowfall Depth', 'Visibility', 'Precipitation Hours'],
    kpiUnit: 'km/h Gusts',
    threshold: 80, // 80km/h 이상이면 위험
    ragKeywords: ['transport', 'logistics', 'infrastructure', 'supply chain', 'trade']
  },
  'Health': {
    label: 'Urban Health & Safety',
    icon: ThermometerSun,
    theme: 'rose',
    dataFields: ['Wet Bulb Temp', 'Heat Index', 'Air Quality (PM2.5)', 'Humidity'],
    kpiUnit: '°C Wet Bulb',
    threshold: 28, // 28도 이상이면 위험
    ragKeywords: ['health', 'heat', 'urban', 'safety', 'emergency']
  }
};

// [RAG 정책 데이터베이스 (자동 매핑용)]
const POLICY_DATABASE = [
  // CANADA Policies
  { id: 101, country: 'Canada', tags: ['agri'], title: 'Sustainable Canadian Agricultural Partnership', type: 'Framework', year: '2023', link: 'https://agriculture.canada.ca' },
  { id: 102, country: 'Canada', tags: ['energy'], title: 'Canada’s 2030 Emissions Reduction Plan', type: 'Strategy', year: '2022', link: 'https://canada.ca/environment' },
  { id: 103, country: 'Canada', tags: ['supply'], title: 'National Trade Corridors Fund Strategy', type: 'Funding', year: '2021', link: 'https://tc.canada.ca' },
  { id: 104, country: 'Canada', tags: ['health'], title: 'National Adaptation Strategy: Health Systems', type: 'Report', year: '2023', link: 'https://health-infobase.canada.ca' },
  
  // GERMANY Policies
  { id: 201, country: 'Germany', tags: ['energy'], title: 'German Renewable Energy Sources Act (EEG 2023)', type: 'Legislation', year: '2023', link: 'https://bmwk.de' },
  { id: 202, country: 'Germany', tags: ['supply'], title: 'Federal Transport Infrastructure Plan 2030', type: 'Plan', year: '2016', link: 'https://bmdv.bund.de' },
  { id: 203, country: 'Germany', tags: ['agri'], title: 'Arable Farming Strategy 2035', type: 'Strategy', year: '2022', link: 'https://bmel.de' },
  
  // FRANCE Policies
  { id: 301, country: 'France', tags: ['energy'], title: 'Multi-Year Energy Programme (PPE)', type: 'Decree', year: '2020', link: 'https://ecologie.gouv.fr' },
  { id: 302, country: 'France', tags: ['health'], title: 'National Heat Wave Management Plan', type: 'Protocol', year: '2023', link: 'https://sante.gouv.fr' },
  
  // GLOBAL/G7 Policies
  { id: 901, country: 'Global', tags: ['agri', 'energy', 'supply', 'health'], title: 'Paris Agreement', type: 'Treaty', year: '2015', link: 'https://unfccc.int' },
  { id: 902, country: 'Global', tags: ['supply', 'health'], title: 'Sendai Framework for Disaster Risk Reduction', type: 'Framework', year: '2015', link: 'https://undrr.org' }
];

// --- 2. MAIN COMPONENT ---

const G7PolicyCoPilot = () => {
  // Global State
  const [selectedCity, setSelectedCity] = useState('Toronto');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeScenario, setActiveScenario] = useState('Agri');
  const [dateFilter, setDateFilter] = useState('1M');
  
  // Derived State
  const currentCountry = GEO_CONFIG[selectedCity].country;
  const currentConfig = SCENARIO_CONFIG[activeScenario];
  
  // Data Lake State
  const [dataLakeRows, setDataLakeRows] = useState([]);
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial Chat Message
  useEffect(() => {
    setMessages([{
      id: 1,
      sender: 'ai',
      type: 'text',
      content: `G7 Intelligence System Online. 현재 [${selectedCity}]의 [${currentConfig.label}] 시나리오를 분석 중입니다.`
    }]);
  }, []);

  // --- LOGIC: DATA GENERATION ---
  useEffect(() => {
    // 시나리오에 맞는 데이터 필드를 사용하여 더미 데이터 생성
    const generateRows = () => {
      const count = 50; // Demo count
      const rows = [];
      const fields = currentConfig.dataFields;
      
      for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setHours(d.getHours() - i);
        
        // Generate values based on scenario logic
        let val1, val2, status;
        
        if (activeScenario === 'Agri') {
          val1 = (0.15 + Math.random() * 0.3).toFixed(2); // Soil Moisture
          status = val1 < 0.2 ? 'Critical' : 'Normal';
        } else if (activeScenario === 'Energy') {
          val1 = (Math.random() * 100).toFixed(1); // Solar
          status = val1 < 15 ? 'Critical' : 'Normal';
        } else if (activeScenario === 'Supply') {
          val1 = (10 + Math.random() * 100).toFixed(1); // Wind Gust
          status = val1 > 80 ? 'Critical' : 'Normal';
        } else {
          val1 = (20 + Math.random() * 15).toFixed(1); // Heat
          status = val1 > 30 ? 'Critical' : 'Normal';
        }

        rows.push({
          id: i,
          timestamp: d.toISOString().replace('T', ' ').substring(0, 16),
          primaryMetric: fields[0],
          primaryValue: val1,
          secondaryMetric: fields[1],
          secondaryValue: (Math.random() * 50).toFixed(1),
          status: status
        });
      }
      return rows;
    };
    setDataLakeRows(generateRows());
  }, [activeScenario, selectedCity]);

  // --- LOGIC: RAG POLICY MAPPING ---
  // 현재 도시(국가)와 시나리오(태그)에 맞는 정책만 필터링
  const mappedPolicies = POLICY_DATABASE.filter(doc => {
    const isGlobal = doc.country === 'Global';
    const isLocal = doc.country === currentCountry;
    const isRelevant = doc.tags.some(tag => SCENARIO_CONFIG[activeScenario].ragKeywords.includes(tag));
    return (isGlobal || isLocal) && isRelevant;
  });

  // --- HANDLERS ---
  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), sender: 'user', type: 'text', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyContent = '';
      
      if (input.includes('분석') || input.includes('이유')) {
        replyContent = `[RAG 분석 결과] ${currentCountry}의 '${mappedPolicies[0]?.title || '관련 정책'}'에 의거하여, 현재 감지된 데이터 패턴은 즉각적인 조치가 필요한 위험 단계입니다.`;
      } else {
        replyContent = `현재 ${selectedCity} 데이터 레이크에서 ${currentConfig.dataFields.join(', ')} 지표를 실시간 상관분석 중입니다.`;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', type: 'text', content: replyContent }]);
    }, 1000);
  };

  // --- UI COMPONENTS ---

  const ScenarioSelector = () => (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {Object.entries(SCENARIO_CONFIG).map(([key, config]) => {
        const isActive = activeScenario === key;
        const Icon = config.icon;
        const activeClass = `bg-${config.theme}-600 text-white shadow-md ring-2 ring-${config.theme}-200`;
        const inactiveClass = `bg-white text-slate-600 hover:bg-slate-50 border border-slate-200`;
        
        return (
          <button
            key={key}
            onClick={() => setActiveScenario(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${isActive ? activeClass : inactiveClass}`}
          >
            <Icon size={18} />
            <span className="font-bold text-sm">{config.label}</span>
            {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F1F5F9] font-sans text-slate-800 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 z-30">
        <div>
          <div className="h-20 flex items-center px-8 border-b border-slate-50">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg shrink-0">
              <Globe className="text-white w-5 h-5" />
            </div>
            <span className="hidden lg:block ml-3 font-bold text-xl tracking-tight text-slate-900">GovAI<span className="text-indigo-600">.Nexus</span></span>
          </div>

          <nav className="p-4 space-y-1 mt-6">
            <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 hidden lg:block">Core Modules</div>
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <LayoutDashboard size={18} /> <span className="hidden lg:block">Strategic Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Layers size={18} /> <span className="hidden lg:block">Policy RAG Library</span>
            </button>
            <button onClick={() => setActiveTab('data')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Database size={18} /> <span className="hidden lg:block">Raw Data Lake</span>
            </button>
          </nav>
        </div>
        
        <div className="p-6 hidden lg:block">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-mono text-green-400">RAG ENGINE ONLINE</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-mapping policies for {selectedCity} ({currentConfig.label}) active.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 hidden md:block">G7 Command Center</h1>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            
            {/* Context Selector */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1.5 border border-slate-200 hover:border-indigo-300 transition-all">
              <MapPin size={16} className="text-indigo-600 ml-2" />
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none min-w-[120px]"
              >
                {Object.keys(GEO_CONFIG).map(city => (
                  <option key={city} value={city}>{city}, {GEO_CONFIG[city].country}</option>
                ))}
              </select>
              <span className="text-lg">{GEO_CONFIG[selectedCity].flag}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold flex items-center gap-2">
                <Globe size={14}/>
                Global Context Active
             </div>
             <Bell className="text-slate-400 w-5 h-5 hover:text-slate-600 cursor-pointer" />
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          
          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* 1. Scenario Navigation */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <ScenarioSelector />
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg text-sm font-bold">
                  <Download size={18} />
                  Download Briefing (PDF)
                </button>
              </div>

              {/* 2. Tableau Visualization Area (The Stage) */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px] relative">
                {/* Tableau Header */}
                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full bg-${currentConfig.theme}-500 animate-pulse`}></span>
                    <span className="font-bold text-slate-700 text-sm">Live Visualization: {selectedCity} {currentConfig.label}</span>
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <Filter size={16} className="hover:text-slate-600 cursor-pointer"/>
                    <Share2 size={16} className="hover:text-slate-600 cursor-pointer"/>
                  </div>
                </div>
                {/* Visual Placeholder for Tableau */}
                <div className="absolute inset-0 top-14 flex flex-col items-center justify-center text-slate-400">
                   <div className={`p-6 rounded-full bg-${currentConfig.theme}-50 mb-4`}>
                      <LayoutDashboard className={`w-12 h-12 text-${currentConfig.theme}-500`} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-600">Tableau Analytics Container</h3>
                   <p className="text-sm max-w-md text-center mt-2">
                     This area renders the Tableau Dashboard tailored for <br/>
                     <span className={`font-bold text-${currentConfig.theme}-600`}>{currentConfig.dataFields.join(', ')}</span> 
                   </p>
                </div>
              </div>

              {/* 3. AI Strategic Analysis (Storytelling Core) */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <MessageSquareText className="text-indigo-600" size={24} />
                  AI Strategic Analysis: {activeScenario}
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Step 1: Detect */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full group hover:border-red-300 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <Activity size={24} />
                      </div>
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">DETECTED</span>
                    </div>
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Data Signal</h4>
                    <div className="text-xl font-bold text-slate-800 mb-2">
                      {currentConfig.dataFields[0]} Risk
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">
                      Real-time telemetry indicates values breaching the safe threshold of {currentConfig.threshold} ({currentConfig.kpiUnit}). This signals a developing crisis in {activeScenario.toLowerCase()} systems.
                    </p>
                  </div>

                  {/* Step 2: Map (RAG Engine) */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full group hover:border-indigo-300 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Layers size={24} />
                      </div>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">RAG MAPPED</span>
                    </div>
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">Policy Context</h4>
                    <div className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">
                      {mappedPolicies[0]?.title || 'G7 Framework'}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">
                      The AI RAG Engine matched this signal with <strong>{mappedPolicies.length} relevant documents</strong> from {currentCountry} and G7 protocols. Key clause: Article 4.2 Emergency Response.
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => setActiveTab('library')} className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline">
                        View Mapped Documents <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Act */}
                  <div className={`bg-${currentConfig.theme}-50 p-6 rounded-2xl border border-${currentConfig.theme}-200 shadow-sm relative overflow-hidden group`}>
                    <div className={`absolute -right-6 -bottom-6 text-${currentConfig.theme}-200 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform`}>
                      <currentConfig.icon size={140} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="flex items-center gap-2 mb-4">
                          <span className={`w-2 h-2 rounded-full bg-${currentConfig.theme}-600 animate-pulse`}></span>
                          <span className={`text-xs font-bold uppercase text-${currentConfig.theme}-700`}>Recommended Action</span>
                       </div>
                       <h4 className={`text-2xl font-bold text-${currentConfig.theme}-900 mb-2`}>Execute Protocol</h4>
                       <p className={`text-sm text-${currentConfig.theme}-800 font-medium leading-relaxed mb-6`}>
                         Trigger {activeScenario} emergency funding and deploy resources to {selectedCity} North Sector immediately.
                       </p>
                       <button className="mt-auto w-full py-3 bg-white rounded-xl shadow-sm text-sm font-bold text-slate-800 hover:shadow-md transition-all">
                         Authorize Action
                       </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB: POLICY LIBRARY (DYNAMIC MAPPING) */}
          {activeTab === 'library' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-end mb-8">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800">Policy RAG Library</h2>
                   <p className="text-slate-500 mt-1">Automatically curated documents for <span className="font-bold text-indigo-600">{currentCountry}</span> • <span className="font-bold text-indigo-600">{currentConfig.label}</span></p>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2">
                       <UploadCloud size={16}/> Upload PDF
                    </button>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {mappedPolicies.length > 0 ? mappedPolicies.map(doc => (
                   <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase">{doc.type}</span>
                        <span className="text-xs font-medium text-slate-400">{doc.year}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {doc.title}
                      </h3>
                      <div className="flex gap-2 mb-4">
                        {doc.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">#{tag}</span>
                        ))}
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
                        <button className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100">View</button>
                        <a href={doc.link} target="_blank" rel="noreferrer" className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                          <ExternalLink size={18}/>
                        </a>
                      </div>
                   </div>
                 )) : (
                   <div className="col-span-3 py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                     <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                     <p>No mapped policies found for this specific context.</p>
                   </div>
                 )}
               </div>
            </div>
          )}

          {/* TAB: DATA LAKE (DYNAMIC FIELDS) */}
          {activeTab === 'data' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                     Raw Data Lake: {selectedCity}
                     <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">LIVE</span>
                   </h2>
                   <p className="text-slate-500 mt-1">
                     Displaying fields: <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{currentConfig.dataFields.join(' | ')}</span>
                   </p>
                 </div>
                 <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                   {['1W', '1M', '3M', '6M', '1Y'].map(f => (
                     <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${dateFilter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{f}</button>
                   ))}
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-4 font-bold text-slate-600">Timestamp</th>
                          <th className="p-4 font-bold text-slate-600">Primary Metric</th>
                          <th className="p-4 font-bold text-slate-600 text-right">Value</th>
                          <th className="p-4 font-bold text-slate-600">Secondary Metric</th>
                          <th className="p-4 font-bold text-slate-600 text-right">Value</th>
                          <th className="p-4 font-bold text-slate-600 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dataLakeRows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-4 font-mono text-slate-500 text-xs">{row.timestamp}</td>
                            <td className="p-4 font-medium text-slate-700">{row.primaryMetric}</td>
                            <td className="p-4 text-right font-mono font-bold">{row.primaryValue}</td>
                            <td className="p-4 text-slate-500">{row.secondaryMetric}</td>
                            <td className="p-4 text-right font-mono text-slate-500">{row.secondaryValue}</td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.status === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* CHATBOT */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col border-l border-slate-200 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button onClick={() => setChatOpen(!chatOpen)} className="absolute -left-12 top-1/2 bg-white p-3 rounded-l-2xl shadow-lg border-y border-l border-slate-200 text-indigo-600">
          {chatOpen ? <ChevronRight /> : <MessageSquareText />}
        </button>
        <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="font-bold text-slate-700">GovAI Assistant</span>
           </div>
           <span className="text-xs text-slate-400 font-mono">{activeScenario} Protocol</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && <div className="text-xs text-slate-400 px-4">AI analyzing policy vectors...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent border-none text-sm focus:ring-0" 
              placeholder="Ask about data or policy..." 
            />
            <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Send size={16}/></button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default G7PolicyCoPilot;
