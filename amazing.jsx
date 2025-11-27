import React, { useState, useEffect, useRef } from 'react';
import {
    LayoutDashboard, MessageSquareText, Settings, Bell, Search,
    ChevronRight, Send, Paperclip, FileText, Globe, TrendingUp,
    Database, MapPin, UploadCloud, Download, Filter, Layers,
    Zap, Truck, Sprout, ThermometerSun, AlertTriangle,
    CheckCircle2, ArrowUpRight, Share2, Activity, BookOpen, MoreHorizontal,
    Calendar, FilePlus, ExternalLink
} from 'lucide-react';

// --- 1. EXTENDED KNOWLEDGE BASE (RAG SOURCE) ---

const GEO_CONFIG = {
    'Toronto': { country: 'Canada', flag: '🇨🇦', code: 'CA' },
    'Berlin': { country: 'Germany', flag: '🇩🇪', code: 'DE' },
    'Paris': { country: 'France', flag: '🇫🇷', code: 'FR' },
};

const SCENARIO_CONFIG = {
    'Agri': {
        label: 'Agri-Food Security',
        icon: Sprout,
        theme: 'emerald', // Greenish
        metrics: ['Soil Moisture', 'Precipitation', 'Crop Stress Idx'],
        desc: 'Monitoring drought risks and food supply chain stability.',
        ragTags: ['agri', 'food', 'water']
    },
    'Energy': {
        label: 'Energy Grid Resilience',
        icon: Zap,
        theme: 'amber', // Yellowish
        metrics: ['Grid Load', 'Solar Output', 'Wind Output'],
        desc: 'Balancing renewable integration with peak demand loads.',
        ragTags: ['energy', 'grid', 'renewable']
    },
    'Supply': {
        label: 'Supply Chain Logistics',
        icon: Truck,
        theme: 'blue',
        metrics: ['Port Congestion', 'Wind Gusts', 'Transport Delay'],
        desc: 'Ensuring infrastructure safety and trade flow continuity.',
        ragTags: ['transport', 'trade', 'logistics']
    },
    'Health': {
        label: 'Urban Health & Safety',
        icon: ThermometerSun,
        theme: 'rose', // Reddish
        metrics: ['Wet Bulb Temp', 'Air Quality', 'Heat Stress'],
        desc: 'Protecting citizens from extreme heat and pollution events.',
        ragTags: ['health', 'safety', 'urban']
    }
};

// [확장된 정책 DB: 각 시나리오/국가별 3-4개 이상]
const FULL_POLICY_DB = [
    // --- CANADA (Agri) ---
    { id: 'CA-A1', country: 'Canada', tags: ['agri'], title: 'Sustainable Canadian Agricultural Partnership', type: 'Framework', year: '2023', excerpt: 'Allocating $3.5B for sustainable farming and drought resilience...' },
    { id: 'CA-A2', country: 'Canada', tags: ['agri'], title: 'Canada Grain Act Modernization', type: 'Legislation', year: '2021', excerpt: 'Section 12: Emergency grain storage protocols during extreme weather...' },
    { id: 'CA-A3', country: 'Canada', tags: ['agri'], title: 'Federal Drought Response Plan', type: 'Protocol', year: '2024', excerpt: 'Level 3 Trigger: Income stability support for farmers when yield drops >15%...' },
    { id: 'CA-A4', country: 'Canada', tags: ['agri'], title: 'Soil Conservation Standards 2024', type: 'Standard', year: '2024', excerpt: 'Mandatory cover cropping for high-risk zones...' },

    // --- CANADA (Energy) ---
    { id: 'CA-E1', country: 'Canada', tags: ['energy'], title: '2030 Emissions Reduction Plan', type: 'Strategy', year: '2022', excerpt: 'Chapter 2: Grid modernization for 100% net-zero electricity...' },
    { id: 'CA-E2', country: 'Canada', tags: ['energy'], title: 'Clean Electricity Regulations', type: 'Regulation', year: '2023', excerpt: 'Setting performance standards for natural gas generation...' },
    { id: 'CA-E3', country: 'Canada', tags: ['energy'], title: 'Pan-Canadian Framework on Clean Growth', type: 'Framework', year: '2016', excerpt: 'Pricing carbon pollution to drive innovation...' },

    // --- GERMANY (Energy) ---
    { id: 'DE-E1', country: 'Germany', tags: ['energy'], title: 'Renewable Energy Sources Act (EEG 2023)', type: 'Legislation', year: '2023', excerpt: 'Para 8: Priority feed-in for renewables to ensure energy security...' },
    { id: 'DE-E2', country: 'Germany', tags: ['energy'], title: 'Building Energy Act (GEG)', type: 'Act', year: '2024', excerpt: 'Mandating 65% renewable energy for new heating systems...' },
    { id: 'DE-E3', country: 'Germany', tags: ['energy'], title: 'Energy Security Act (EnSiG)', type: 'Crisis Law', year: '2022', excerpt: 'Article 1: Load shedding protocols for heavy industry...' },

    // --- FRANCE (Health) ---
    { id: 'FR-H1', country: 'France', tags: ['health'], title: 'National Heat Wave Management Plan', type: 'Plan', year: '2023', excerpt: 'Level Red: Mandatory cooling center activation in Paris...' },
    { id: 'FR-H2', country: 'France', tags: ['health'], title: 'Climate and Resilience Law', type: 'Law', year: '2021', excerpt: 'Title IV: Adapting urban planning to reduce heat islands...' },
    { id: 'FR-H3', country: 'France', tags: ['health'], title: 'Public Health Code - Air Quality', type: 'Code', year: '2022', excerpt: 'Emergency traffic restrictions when PM2.5 exceeds 50µg/m³...' },

    // --- GLOBAL (Supply/All) ---
    { id: 'GL-S1', country: 'Global', tags: ['transport', 'supply'], title: 'Sendai Framework for Disaster Risk', type: 'Framework', year: '2015', excerpt: 'Priority 4: Enhancing disaster preparedness for effective response...' },
    { id: 'GL-S2', country: 'Global', tags: ['transport', 'supply'], title: 'G7 Supply Chain Resilience Principles', type: 'Agreement', year: '2023', excerpt: 'Principle 3: Diversification of critical logistics routes...' },
];

// --- 2. MAIN COMPONENT ---

const G7PolicyCoPilot = () => {
    // State
    const [selectedCity, setSelectedCity] = useState('Toronto');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [activeScenario, setActiveScenario] = useState('Agri');
    const [dateFilter, setDateFilter] = useState('1M');

    // Chat State
    const [chatOpen, setChatOpen] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Policy Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [docs, setDocs] = useState(FULL_POLICY_DB);

    // Derived
    const currentCountry = GEO_CONFIG[selectedCity].country;
    const currentConfig = SCENARIO_CONFIG[activeScenario];

    // RAG Filter Logic
    const mappedPolicies = docs.filter(doc =>
        (doc.country === currentCountry || doc.country === 'Global') &&
        doc.tags.some(tag => currentConfig.ragTags.includes(tag))
    );

    // Initialize Chat
    useEffect(() => {
        setMessages([{
            id: 1,
            sender: 'ai',
            type: 'text',
            content: `시스템 가동 완료. 현재 [${selectedCity}]의 [${currentConfig.label}] 시나리오를 모니터링 중입니다.`
        }]);
    }, []);

    // Scroll to bottom
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
            // RAG Logic: Find most relevant policy
            const bestMatch = mappedPolicies[0] || FULL_POLICY_DB[0];

            const response = {
                id: Date.now() + 1,
                sender: 'ai',
                type: 'rag_card', // New type for rich card response
                title: 'Policy Mapping Detected',
                policyTitle: bestMatch.title,
                excerpt: bestMatch.excerpt,
                action: 'View Full Analysis',
                content: `질문하신 내용에 대해 RAG 엔진이 ${currentCountry} 정책 DB에서 관련 조항을 찾았습니다.`
            };
            setMessages(prev => [...prev, response]);
        }, 1200);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newDoc = {
                id: Date.now(),
                country: currentCountry,
                tags: [currentConfig.ragTags[0]],
                title: file.name,
                type: 'Uploaded',
                year: '2025',
                excerpt: 'Processing document content for vector search...'
            };
            setDocs([newDoc, ...docs]);
        }
    };

    // --- RENDER HELPERS ---
    const ScenarioButton = ({ id, config }) => (
        <button
            onClick={() => setActiveScenario(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${activeScenario === id
                    ? `bg-${config.theme}-600 text-white border-${config.theme}-600 shadow-md`
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
        >
            <config.icon size={16} />
            <span className="text-sm font-bold">{config.label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden">

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
                            Mapped to {mappedPolicies.length} docs for {currentCountry}
                        </p>
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* HEADER */}
                <header className="h-20 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-bold text-slate-700 hidden md:block">Climate Resilience Platform</h1>
                        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

                        {/* Global Context Selector */}
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
                        <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">UN</div>
                    </div>
                </header>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-8 scroll-smooth">

                    {/* --- TAB: DASHBOARD --- */}
                    {activeTab === 'dashboard' && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

                            {/* Scenario Switcher */}
                            <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-slate-200/50">
                                {Object.entries(SCENARIO_CONFIG).map(([key, config]) => (
                                    <ScenarioButton key={key} id={key} config={config} />
                                ))}
                                <div className="ml-auto flex gap-2">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 shadow-sm transition-all">
                                        <Download size={14} /> Report
                                    </button>
                                </div>
                            </div>

                            {/* Tableau Container */}
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[550px] relative flex flex-col group">
                                <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <currentConfig.icon size={18} className={`text-${currentConfig.theme}-600`} />
                                        <span className="text-sm font-bold text-slate-700">Live Dashboard: {selectedCity} {activeScenario}</span>
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold ml-2">LIVE</span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono">Params: {currentConfig.metrics.join(', ')}</div>
                                </div>

                                {/* Placeholder for Tableau Embed */}
                                <div className="flex-1 bg-slate-50 relative flex flex-col items-center justify-center text-center p-8">
                                    <div className={`p-6 rounded-full bg-${currentConfig.theme}-50 mb-6 group-hover:scale-105 transition-transform duration-500`}>
                                        <LayoutDashboard className={`w-16 h-16 text-${currentConfig.theme}-400`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-600">Tableau Analytics Container</h3>
                                    <p className="text-slate-400 max-w-md mt-2 text-sm">
                                        This iframe renders the Tableau dashboard filtered for
                                        <span className={`font-bold text-${currentConfig.theme}-600 mx-1`}>{currentConfig.label}</span>
                                        data in {selectedCity}.
                                    </p>
                                </div>
                            </div>

                            {/* AI Strategic Analysis (GRID OF 4) */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <MessageSquareText className="text-indigo-600" size={24} />
                                    AI Strategic Briefing
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                    {/* Card 1: Signal Detection */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
                                        <div className="flex justify-between mb-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Activity size={20} /></div>
                                            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-1 rounded h-fit">CRITICAL</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Signal Detected</div>
                                        <div className="text-lg font-bold text-slate-800 mb-1">{currentConfig.metrics[0]} Risk</div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Anomaly detected exceeding 15% safety variance. Immediate review required.
                                        </p>
                                    </div>

                                    {/* Card 2: Primary Policy Map */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                        <div className="flex justify-between mb-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><BookOpen size={20} /></div>
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded h-fit">RAG MATCH</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Primary Protocol</div>
                                        <div className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">{mappedPolicies[0]?.title || 'Standard Protocol'}</div>
                                        <p className="text-xs text-slate-500 italic line-clamp-2">
                                            "{mappedPolicies[0]?.excerpt || 'Loading...'}"
                                        </p>
                                    </div>

                                    {/* Card 3: Secondary Policy Map */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                                        <div className="flex justify-between mb-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Layers size={20} /></div>
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded h-fit">SUPPORTING</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Legal Basis</div>
                                        <div className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">{mappedPolicies[1]?.title || 'G7 Framework'}</div>
                                        <p className="text-xs text-slate-500 italic line-clamp-2">
                                            "{mappedPolicies[1]?.excerpt || 'Loading...'}"
                                        </p>
                                    </div>

                                    {/* Card 4: Action Plan */}
                                    <div className={`bg-${currentConfig.theme}-50 p-5 rounded-2xl border border-${currentConfig.theme}-100 shadow-sm relative overflow-hidden group`}>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 size={20} className={`text-${currentConfig.theme}-600`} />
                                                <span className={`text-xs font-bold text-${currentConfig.theme}-700 uppercase`}>Recommendation</span>
                                            </div>
                                            <div className={`text-lg font-bold text-${currentConfig.theme}-900 mb-2`}>Execute Protocol</div>
                                            <button className="w-full py-2 bg-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all mt-2">
                                                Authorize Action
                                            </button>
                                        </div>
                                        <div className={`absolute -right-4 -bottom-4 text-${currentConfig.theme}-200 opacity-50 transform rotate-12 group-hover:scale-110 transition-transform`}>
                                            <currentConfig.icon size={80} />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: POLICY LIBRARY --- */}
                    {activeTab === 'library' && (
                        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Policy Document Explorer</h2>
                                    <p className="text-slate-500 mt-1">
                                        Showing {mappedPolicies.length} documents for <span className="font-bold text-indigo-600">{currentCountry}</span> • {activeScenario}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search corpus..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                                        />
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('upload-doc').click()}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2"
                                    >
                                        <UploadCloud size={16} /> Upload
                                    </button>
                                    <input id="upload-doc" type="file" className="hidden" onChange={handleFileUpload} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {mappedPolicies
                                    .filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map(doc => (
                                        <div key={doc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">{doc.type}</span>
                                                <span className="text-xs font-medium text-slate-400">{doc.year}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {doc.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 italic mb-4 flex-1 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                "...{doc.excerpt}..."
                                            </p>
                                            <div className="flex gap-2 mb-4">
                                                {doc.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">#{tag}</span>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
                                                <button className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100">View PDF</button>
                                                <button className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DATA LAKE (Simple Table for completeness) --- */}
                    {activeTab === 'data' && (
                        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-bold text-slate-800">Raw Data Stream: {selectedCity}</h2>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">1W</button>
                                    <button className="px-3 py-1 bg-slate-800 rounded text-xs font-bold text-white">1M</button>
                                    <button className="px-3 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">3M</button>
                                </div>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-4">Timestamp</th>
                                        <th className="p-4">Metric</th>
                                        <th className="p-4 text-right">Value</th>
                                        <th className="p-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...Array(10)].map((_, i) => (
                                        <tr key={i} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono text-slate-400">2025-11-27 14:{30 - i}:00</td>
                                            <td className="p-4 font-medium">{currentConfig.metrics[0]}</td>
                                            <td className="p-4 text-right font-mono font-bold">{(Math.random() * 100).toFixed(2)}</td>
                                            <td className="p-4 text-center"><span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">NORMAL</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </main>

            {/* 3. CHATBOT (Right Panel) */}
            <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 flex flex-col border-l border-slate-200 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <button onClick={() => setChatOpen(!chatOpen)} className="absolute -left-12 top-1/2 bg-white p-3 rounded-l-2xl shadow-lg border-y border-l border-slate-200 text-indigo-600">
                    {chatOpen ? <ChevronRight /> : <MessageSquareText />}
                </button>
                <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-bold text-slate-700">GovAI Assistant</span>
                    </div>
                    <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><MoreHorizontal size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.type === 'rag_card' ? (
                                <div className="max-w-[90%] bg-indigo-50 border border-indigo-100 p-4 rounded-2xl rounded-bl-none shadow-sm animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen size={14} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-indigo-700 uppercase">Policy Found</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{msg.policyTitle}</h4>
                                    <p className="text-xs text-slate-500 italic mb-3 border-l-2 border-indigo-200 pl-2">"{msg.excerpt}"</p>
                                    <p className="text-sm text-slate-700 mb-3">{msg.content}</p>
                                    <button className="w-full py-1.5 bg-white text-indigo-600 text-xs font-bold rounded border border-indigo-200 hover:bg-indigo-600 hover:text-white transition-colors">
                                        {msg.action}
                                    </button>
                                </div>
                            ) : (
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && <div className="text-xs text-slate-400 px-4 flex gap-1"><span className="animate-bounce">●</span><span className="animate-bounce delay-75">●</span><span className="animate-bounce delay-150">●</span></div>}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <div className="flex gap-2 bg-white p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
                            placeholder="Ask GovAI..."
                        />
                        <button onClick={handleSend} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"><Send size={16} /></button>
                    </div>
                </div>
            </div>

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