import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, Volume2, VolumeX, 
  MapPin, AlertTriangle, Activity, Waves, Layers, RotateCcw,
  Compass, ShieldCheck, ChevronRight, Zap, Search, Globe, Mountain,
  CloudRain, ShieldAlert, ArrowUpRight, BookOpen, Filter
} from 'lucide-react';
import clsx from 'clsx';
import { useMockTelemetry } from '../../hooks/useMockTelemetry';

interface LocationProfile {
  id: string;
  name: string;
  region: 'Himalayas' | 'Western Ghats' | 'Garhwal' | 'Railway / Highway';
  state: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  coordinates: string;
  elevation: string;
  soilType: string;
  bedrock: string;
  triggerRainfallThreshold: string;
  recurrencePeriod: string;
  historicalDisasters: string;
  recurringCause: string;
  mitigationStrategy: string;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  locationCard?: LocationProfile;
  liveTelemetryCard?: boolean;
}

const REGIONAL_LOCATIONS: LocationProfile[] = [
  {
    id: 'loc-wayanad',
    name: 'Wayanad (Chooralmala & Meppadi)',
    region: 'Western Ghats',
    state: 'Kerala',
    riskLevel: 'CRITICAL',
    coordinates: '11.5434° N, 76.1362° E',
    elevation: '700 – 1,150 m MSL',
    soilType: 'Lateritic clay-sand with high hydraulic conductivity',
    bedrock: 'Charnockite & Hornblende Gneiss',
    triggerRainfallThreshold: '> 250 mm / 24 hours',
    recurrencePeriod: 'Every 2 – 4 years during extreme monsoon spells',
    historicalDisasters: 'July 2024 Mega Debris Avalanche (400+ casualties), 2019 Puthumala Landslide',
    recurringCause: 'Hyper-concentrated torrential cloudbursts saturating porous laterite overburden resting on smooth, impermeable sloping bedrock.',
    mitigationStrategy: 'Borehole piezometers, deep subsurface horizontal drainage pipes, and community early warning sirens.',
  },
  {
    id: 'loc-shimla',
    name: 'Shimla — Solan Corridor (NH-5 & Sector 7)',
    region: 'Himalayas',
    state: 'Himachal Pradesh',
    riskLevel: 'CRITICAL',
    coordinates: '31.1048° N, 77.1734° E',
    elevation: '1,800 – 2,200 m MSL',
    soilType: 'Colluvial talus and fractured micaceous silt',
    bedrock: 'Jutogh Group Phyllites and Quartzites',
    triggerRainfallThreshold: '> 140 mm / 24 hours',
    recurrencePeriod: 'Annual recurring event during July–August monsoons',
    historicalDisasters: 'August 2023 Summer Hill Shiv Temple slide, multiple NH-5 blockades at Chakki Mor',
    recurringCause: 'Steep road widening cutting away natural toe resistance, high antecedent pore-water pressure, and overloaded building terraces.',
    mitigationStrategy: 'Reinforced soil retaining walls, micropiles, toe-buttress gabions, and LoRa edge tiltmeters.',
  },
  {
    id: 'loc-konkan',
    name: 'Konkan Railway Ghat Cutting Zone',
    region: 'Railway / Highway',
    state: 'Maharashtra / Goa',
    riskLevel: 'HIGH',
    coordinates: '17.2934° N, 73.4124° E',
    elevation: '150 – 600 m MSL',
    soilType: 'Weathered red clayey laterite',
    bedrock: 'Stratified Deccan Traps Basalt',
    triggerRainfallThreshold: '> 180 mm / 24 hours',
    recurrencePeriod: 'Recurring every monsoon season',
    historicalDisasters: 'Periodic monsoon boulders & rotational mudslides disrupting Mumbai–Goa train traffic',
    recurringCause: 'High pore-water pressure along basalt lithological contacts during continuous Western Ghat deluges.',
    mitigationStrategy: 'Automated railway track signal interlocks, high-tensile rockfall netting, and slope sensor arrays.',
  },
  {
    id: 'loc-mandi',
    name: 'Mandi — Pandoh — Aut Gorge (NH-3)',
    region: 'Himalayas',
    state: 'Himachal Pradesh',
    riskLevel: 'HIGH',
    coordinates: '31.7088° N, 76.9318° E',
    elevation: '850 – 1,400 m MSL',
    soilType: 'Loose alluvial & fluvio-glacial boulders',
    bedrock: 'Granitic gneiss and mica-schist',
    triggerRainfallThreshold: '> 160 mm / 24 hours',
    recurrencePeriod: '1 – 2 years during heavy monsoon swells',
    historicalDisasters: 'July–August 2023 Beas river deluge sweeping away NH-3 carriageways and tunnel approaches',
    recurringCause: 'Aggressive river toe scouring by the swollen Beas River liquefying saturated overburden slopes.',
    mitigationStrategy: 'Heavy rip-rap river armouring, rock bolt anchoring, and acoustic emission displacement sensors.',
  },
  {
    id: 'loc-joshimath',
    name: 'Joshimath & Chamoli Subsidence Belt',
    region: 'Garhwal',
    state: 'Uttarakhand',
    riskLevel: 'CRITICAL',
    coordinates: '30.5564° N, 79.5637° E',
    elevation: '1,890 m MSL',
    soilType: 'Ancient glacial moraine deposits & loose boulders',
    bedrock: 'Vaikrita Group High-grade Gneiss and Schist',
    triggerRainfallThreshold: '> 100 mm / 24 hours or sudden glacial outburst',
    recurrencePeriod: 'Continuous progressive creep with monsoon acceleration',
    historicalDisasters: 'January 2023 citywide structural subsidence crisis; February 2021 Rishiganga flash flood',
    recurringCause: 'City built on ancient landslide debris; uncontrolled wastewater infiltration creating internal hydrostatic lubrication.',
    mitigationStrategy: 'Comprehensive citywide subsurface drainage masterplan and long-range InSAR/LoRa monitoring.',
  },
  {
    id: 'loc-sikkim',
    name: 'Sikkim Lifeline Corridor (NH-10 & Teesta Valley)',
    region: 'Railway / Highway',
    state: 'Sikkim / West Bengal',
    riskLevel: 'CRITICAL',
    coordinates: '27.3389° N, 88.6065° E',
    elevation: '400 – 1,700 m MSL',
    soilType: 'Mica-rich weathered clay and river talus',
    bedrock: 'Daling Series Chlorite Schist and Phyllite',
    triggerRainfallThreshold: '> 150 mm / 24 hours',
    recurrencePeriod: 'Multiple occurrences every single monsoon',
    historicalDisasters: 'October 2023 South Lhonak GLOF flash flood destroying NH-10; frequent monsoon cuts at 29th Mile',
    recurringCause: 'Extreme tectonic fracturing, fragile young Himalayan strata, and intense orographic precipitation.',
    mitigationStrategy: 'Flexible rockfall drapery, river training gabion spurs, and fiber-optic strain sensor cables.',
  },
];

const PRESET_QUESTIONS = [
  { label: '📍 High-Risk Landslide Locations', prompt: 'Which specific locations and corridors in India are at highest risk for landslides?' },
  { label: '⚡ What is the current situation right now?', prompt: 'What is the current live geotechnical situation and risk level at our station?' },
  { label: '🔄 Why do landslides recur repeatedly?', prompt: 'What are the main recurring causes of repeated landslides in hill areas like Wayanad and Shimla?' },
  { label: '📐 How does Bishop Factor of Safety work?', prompt: 'Explain how the Bishop limit equilibrium physics model calculates slope stability.' },
  { label: '🚨 What are the evacuation protocols?', prompt: 'What are the tiered emergency protocols and evacuation triggers when critical risk is detected?' },
];

export default function VirtualChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'locations'>('chat');
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: "Hello! I am LandGuard GeoBot — your interactive Geotechnical AI Assistant. I provide real-time updates on active slope situations, explain why recurring landslides happen, and analyze vulnerable high-risk geographic corridors across India.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const { state } = useMockTelemetry();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, activeTab]);

  // Speech synthesis helper
  const speakText = (text: string) => {
    if (!isTtsEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    setActiveTab('chat');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Generate intelligent geotechnical response
    setTimeout(() => {
      generateBotResponse(query);
    }, 450);
  };

  const selectLocationForAnalysis = (loc: LocationProfile) => {
    setActiveTab('chat');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: `Analyze specific landslide vulnerability and recurrence for ${loc.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const responseText = `**Comprehensive Geotechnical Profile: ${loc.name}**\n\n• **State / Region**: ${loc.state} (${loc.region})\n• **Risk Classification**: **${loc.riskLevel}**\n• **Geographic Coordinates**: ${loc.coordinates} (Elevation: ${loc.elevation})\n• **Soil Stratigraphy**: ${loc.soilType}\n• **Bedrock Formation**: ${loc.bedrock}\n• **Critical Rainfall Trigger**: ${loc.triggerRainfallThreshold}\n• **Recurrence Frequency**: ${loc.recurrencePeriod}\n• **Key Recurring Cause**: ${loc.recurringCause}\n• **Recommended Mitigation**: ${loc.mitigationStrategy}`;

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        locationCard: loc,
      };

      setMessages((prev) => [...prev, botMsg]);
      speakText(responseText);
    }, 400);
  };

  const generateBotResponse = (query: string) => {
    const q = query.toLowerCase();
    let responseText = '';
    let locationCard: LocationProfile | undefined = undefined;
    let liveTelemetryCard = false;

    // Check if query directly matches any known location
    const matchedLoc = REGIONAL_LOCATIONS.find((l) => 
      q.includes(l.name.toLowerCase()) || 
      (l.name.includes('Wayanad') && q.includes('wayanad')) ||
      (l.name.includes('Shimla') && (q.includes('shimla') || q.includes('solan'))) ||
      (l.name.includes('Konkan') && (q.includes('konkan') || q.includes('railway'))) ||
      (l.name.includes('Mandi') && (q.includes('mandi') || q.includes('kullu'))) ||
      (l.name.includes('Joshimath') && (q.includes('joshimath') || q.includes('chamoli'))) ||
      (l.name.includes('Sikkim') && (q.includes('sikkim') || q.includes('teesta')))
    );

    if (matchedLoc) {
      locationCard = matchedLoc;
      responseText = `**Location Intelligence Profile: ${matchedLoc.name}**\n\n• **Risk Level**: **${matchedLoc.riskLevel}**\n• **Coordinates**: ${matchedLoc.coordinates} (${matchedLoc.elevation})\n• **Soil / Geology**: ${matchedLoc.soilType} over ${matchedLoc.bedrock}\n• **Trigger Rainfall**: ${matchedLoc.triggerRainfallThreshold}\n• **Recurrence Cycle**: ${matchedLoc.recurrencePeriod}\n\n**Recurring Cause:** ${matchedLoc.recurringCause}\n\n**Mitigation Strategy:** ${matchedLoc.mitigationStrategy}`;
    }
    // 1. Current Situation / Live Telemetry
    else if (q.includes('situation') || q.includes('current') || q.includes('live') || q.includes('right now') || q.includes('status')) {
      const moisture = state?.currentReading ? state.currentReading.soil_moisture_pct.toFixed(1) : '38.4';
      const rain = state?.currentReading ? state.currentReading.rainfall_pct.toFixed(1) : '0.0';
      const tilt = state?.currentReading ? state.currentReading.tilt_angle.toFixed(2) : '12.40';
      const fos = state?.currentRisk ? state.currentRisk.fos_estimate.toFixed(2) : '1.82';
      const riskScore = state?.currentRisk ? Math.round(state.currentRisk.risk_score * 100) : 18;
      const riskLevel = state?.currentRisk ? state.currentRisk.risk_level.toUpperCase() : 'LOW';

      liveTelemetryCard = true;
      responseText = `**Current Geotechnical Situation (Station LG-N01 · Sector 7):**\n\n• **Overall Risk Level**: **${riskLevel}** (${riskScore}% Hazard Score)\n• **Volumetric Soil Moisture**: **${moisture}% VWC**\n• **Precipitation Intensity**: **${rain}%**\n• **Slope Dip / Tilt Angle**: **${tilt}°**\n• **Bishop Factor of Safety (FoS)**: **${fos}**\n\n${
        Number(fos) < 1.0 
          ? "🚨 **CRITICAL WARNING**: The driving shear force exceeds resisting strength (FoS < 1.0). Immediate slope failure is imminent."
          : Number(fos) < 1.3
          ? "⚠️ **ALERT**: Soil saturation is accumulating. Elevated pore-water pressure is reducing shear strength."
          : "✅ **STABLE**: Current slope parameters are within safe baseline stability limits."
      }`;
    }
    // 2. Specific Locations / Where Landslides Happen
    else if (q.includes('where') || q.includes('location') || q.includes('corridor') || q.includes('place') || q.includes('spot') || q.includes('india')) {
      locationCard = REGIONAL_LOCATIONS[0];
      responseText = `**Major High-Risk Landslide Corridors in India:**\n\n1. **North-Western Himalayas**: Shimla — Solan NH-5, Mandi — Pandoh NH-3, Kinnaur NH-05.\n2. **Western Ghats Scarp**: Wayanad (Chooralmala), Idukki (Munnar), Konkan Railway Ghat cuts.\n3. **Garhwal Himalayas**: Chamoli, Joshimath Subsidence Belt, Kedarnath Valley.\n4. **Eastern Himalayas & North-East**: Sikkim (NH-10 Teesta Valley), Dima Hasao.\n\nOver **12.6% of India's landmass (0.42 million sq km)** is landslide-prone due to fragile young orogeny, steep relief, and intense monsoon cloudbursts. Click the **'Location Explorer'** tab above to inspect any sector.`;
    }
    // 3. Recurring Causes / Why Landslides Happen Repeatedly
    else if (q.includes('recur') || q.includes('why') || q.includes('cause') || q.includes('reason') || q.includes('repeated')) {
      responseText = `**Why Do Landslides Recur in the Same Specific Zones?**\n\n1. **Pore-Water Pressure Buildup ($u$)**: Rainwater infiltrates soil, pushing soil particles apart and drastically reducing effective normal stress ($\sigma_n' = \sigma - u$).\n2. **Pre-Existing Slip Planes**: Once a slope moves, internal friction angle ($\phi'$) drops to residual levels ($\phi_r < \phi_p$), making subsequent slips much easier to trigger.\n3. **Toe Support Removal**: Cutting road bases or river erosion removes the structural buttress at the bottom of the slope.\n4. **Drainage Choking**: Blocked roadside channels force water into deep fissures instead of surface runoff.\n5. **Deforestation & Root Loss**: Tree roots provide 3–15 kPa of apparent cohesion ($c'$); their loss accelerates sudden slope shear.`;
    }
    // 4. Bishop Physics Model
    else if (q.includes('bishop') || q.includes('physics') || q.includes('fos') || q.includes('factor of safety') || q.includes('math') || q.includes('formula')) {
      responseText = `**Bishop & Fellenius Limit Equilibrium Geotechnical Mechanics:**\n\nLANDGUARD AI calculates the real-time **Factor of Safety (FoS)**:\n\n$$\\text{FoS} = \\frac{c' + (\\gamma z \\cos^2\\beta - u) \\tan\\phi'}{\\gamma z \\sin\\beta \\cos\\beta}$$\n\n• **$c'$ (Cohesion)**: Soil particle bonding strength (12 kPa)\n• **$u$ (Pore-Water Pressure)**: Uplift force from water saturation\n• **$\\beta$ (Slope Angle)**: Measured directly by MPU6050 IMU\n• **$\\phi'$ (Internal Friction)**: Angle of shear resistance (28°)\n\n**Safety Criteria:**\n• **FoS > 1.5**: Safe & Stable\n• **1.0 ≤ FoS ≤ 1.3**: Warning / Creep Accumulation\n• **FoS < 1.0**: Failure Imminent (Driving force > Resisting strength)`;
    }
    // 5. Emergency Protocols & Evacuation
    else if (q.includes('evacuat') || q.includes('protocol') || q.includes('alert') || q.includes('action') || q.includes('safety') || q.includes('alarm')) {
      responseText = `**Multi-Tier Emergency Response & Alarm System:**\n\n1. **🟢 LOW (FoS > 1.5, Hazard < 40%)**: Normal periodic monitoring (10s telemetry).\n2. **🟡 MODERATE (FoS 1.2–1.5, Hazard 40–60%)**: Advisory issued to local road authorities, sampling frequency doubles (5s).\n3. **🟠 HIGH (FoS 1.0–1.2, Hazard 60–75%)**: Traffic restricted to single lane, rail speed limited to 20 km/h, audio sirens armed.\n4. **🔴 CRITICAL (FoS < 1.0, Hazard > 75%)**: **Immediate Evacuation Triggered!** Highway closed, automated railway signal interlock set to RED, siren broadcast, and SMS/WhatsApp emergency alerts dispatched to district disaster management.`;
    }
    // 6. General / Fallback
    else {
      responseText = `**LandGuard AI Geotechnical Intelligence:**\n\nI can provide detailed explanations on:\n• **Current Station Status**: Live moisture, tilt, Bishop FoS, and AI risk prediction.\n• **Geographic Hotspots**: Specific risk zones in the Western Ghats (Wayanad), Himalayas (Shimla/Chamoli), and Konkan corridors.\n• **Recurrence Mechanics**: How rainfall saturation and pore-water pressure trigger repeated slips.\n• **Hardware & IoT Architecture**: Our $18 low-cost ESP32 LoRa wireless edge nodes.`;
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      locationCard,
      liveTelemetryCard,
    };

    setMessages((prev) => [...prev, botMsg]);
    speakText(responseText);
  };

  const toggleTts = () => {
    const next = !isTtsEnabled;
    setIsTtsEnabled(next);
    if (!next && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const filteredLocations = REGIONAL_LOCATIONS.filter((loc) => {
    const matchesRegion = selectedRegionFilter === 'ALL' || loc.region === selectedRegionFilter;
    const matchesSearch = loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase()) || 
                          loc.state.toLowerCase().includes(locationSearchTerm.toLowerCase()) ||
                          loc.soilType.toLowerCase().includes(locationSearchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <>
      {/* ── Floating Chatbot Widget Trigger Button ────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0c101d]/90 backdrop-blur-xl border border-white/10 text-xs font-mono text-slate-200 shadow-2xl animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Ask LandGuard GeoBot</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            'w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 relative group',
            isOpen 
              ? 'bg-slate-800 text-white border border-white/20 rotate-90' 
              : 'bg-gradient-to-tr from-orange-500 via-rose-500 to-amber-500 text-slate-950 hover:scale-105 shadow-orange-950/60'
          )}
          aria-label="Open Landslide AI Assistant"
          title="Open LandGuard Virtual AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-7 h-7 transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-slate-950"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* ── Chatbot Modal Window ─────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[500px] h-[660px] max-h-[88vh] z-50 bg-[#0c101d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-[#0c101d] rounded-[14px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif italic text-lg text-white font-bold tracking-tight leading-none">
                    LandGuard GeoBot
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-orange-950 text-orange-300 border border-orange-600/40 text-[9px] font-mono font-bold">
                    AI AUDIENCE COPILOT
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Geotechnical Intelligence & Location Advisory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* TTS Voice Readout Toggle */}
              <button
                onClick={toggleTts}
                className={clsx(
                  'p-2 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1',
                  isTtsEnabled
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                )}
                title={isTtsEnabled ? 'Voice narration active (Click to mute)' : 'Enable voice narration for presentation'}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs: Chat vs Location Explorer */}
          <div className="flex items-center border-b border-white/10 bg-black/40 px-3 py-1.5 gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveTab('chat')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all font-bold',
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Interactive Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('locations')}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all font-bold',
                activeTab === 'locations'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Location Risk Database ({REGIONAL_LOCATIONS.length})</span>
            </button>
          </div>

          {/* ── TAB 1: Chat Stream ────────────────────────────── */}
          {activeTab === 'chat' && (
            <>
              {/* Preset Question Pills */}
              <div className="px-3 py-2 border-b border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto no-scrollbar">
                {PRESET_QUESTIONS.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(pq.prompt)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-[10px] font-mono text-slate-300 hover:text-orange-300 transition-colors"
                  >
                    {pq.label}
                  </button>
                ))}
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
                {messages.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={clsx('flex gap-2.5', isBot ? 'items-start' : 'items-end justify-end')}
                    >
                      {isBot && (
                        <div className="w-7 h-7 rounded-xl bg-orange-950/80 border border-orange-500/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-orange-400" />
                        </div>
                      )}

                      <div className={clsx('space-y-2 max-w-[88%]', isBot ? 'text-left' : 'text-right')}>
                        <div
                          className={clsx(
                            'p-3.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-md',
                            isBot
                              ? 'bg-[#13192b] text-slate-200 border border-white/10'
                              : 'bg-gradient-to-r from-orange-500 to-rose-600 text-slate-950 font-medium'
                          )}
                        >
                          {msg.text}

                          {/* Optional Live Telemetry Mini-Card */}
                          {msg.liveTelemetryCard && state && (
                            <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-white/10 space-y-1.5 font-mono text-[10px]">
                              <div className="flex items-center justify-between text-slate-400">
                                <span>STATION: LG-N01</span>
                                <span className="text-emerald-400 font-bold">LIVE TELEMETRY</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                                  <span className="text-slate-400 block text-[9px]">MOISTURE VWC</span>
                                  <strong className="text-slate-100">{state.currentReading.soil_moisture_pct.toFixed(1)}%</strong>
                                </div>
                                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                                  <span className="text-slate-400 block text-[9px]">BISHOP FoS</span>
                                  <strong className={state.currentRisk.fos_estimate < 1.0 ? 'text-red-400' : 'text-emerald-400'}>
                                    {state.currentRisk.fos_estimate.toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Optional Location Profile Card */}
                          {msg.locationCard && (
                            <div className="mt-3 p-3.5 rounded-2xl bg-black/60 border border-orange-500/40 space-y-2 font-mono text-[10px] text-slate-300 text-left shadow-lg">
                              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                <div className="flex items-center gap-1.5 text-orange-300 font-bold text-xs">
                                  <MapPin className="w-4 h-4 text-orange-400" />
                                  <span>{msg.locationCard.name}</span>
                                </div>
                                <span className={clsx(
                                  'px-2 py-0.5 rounded-full text-[9px] font-bold border',
                                  msg.locationCard.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                                )}>
                                  {msg.locationCard.riskLevel}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400">
                                <div><strong className="text-slate-200">GPS:</strong> {msg.locationCard.coordinates}</div>
                                <div><strong className="text-slate-200">Elevation:</strong> {msg.locationCard.elevation}</div>
                                <div><strong className="text-slate-200">Trigger Rain:</strong> {msg.locationCard.triggerRainfallThreshold}</div>
                                <div><strong className="text-slate-200">Recurrence:</strong> {msg.locationCard.recurrencePeriod}</div>
                              </div>

                              <div className="text-slate-300 font-sans text-xs pt-1 border-t border-white/5 space-y-1">
                                <div><strong className="text-orange-400 font-mono text-[10px]">Geology:</strong> {msg.locationCard.soilType} over {msg.locationCard.bedrock}</div>
                                <div><strong className="text-orange-400 font-mono text-[10px]">Disasters:</strong> {msg.locationCard.historicalDisasters}</div>
                                <div><strong className="text-orange-400 font-mono text-[10px]">Mitigation:</strong> {msg.locationCard.mitigationStrategy}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] font-mono text-slate-400 block px-1">
                          {msg.timestamp}
                        </span>
                      </div>

                      {!isBot && (
                        <div className="w-7 h-7 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-slate-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="p-3 border-t border-white/10 bg-white/[0.01] flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about live situation, Wayanad, Shimla, recurring triggers..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 disabled:opacity-40 text-slate-950 flex items-center justify-center shadow-md transition-all shrink-0"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* ── TAB 2: Location Risk Database ────────────────── */}
          {activeTab === 'locations' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              {/* Region Filter Bar & Search */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search locations, soil, states (e.g. Wayanad, Shimla, Konkan)..."
                    value={locationSearchTerm}
                    onChange={(e) => setLocationSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto no-scrollbar font-mono text-[10px]">
                  {['ALL', 'Western Ghats', 'Himalayas', 'Garhwal', 'Railway / Highway'].map((reg) => (
                    <button
                      key={reg}
                      onClick={() => setSelectedRegionFilter(reg)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg border shrink-0 transition-colors',
                        selectedRegionFilter === reg
                          ? 'bg-orange-950/80 text-orange-300 border-orange-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      )}
                    >
                      {reg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Cards List */}
              <div className="space-y-3">
                {filteredLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-3.5 rounded-2xl bg-[#13192b] border border-white/10 hover:border-orange-500/40 transition-all space-y-2 group shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-100 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          <span>{loc.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {loc.state} &middot; {loc.coordinates} ({loc.elevation})
                        </div>
                      </div>

                      <span className={clsx(
                        'px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border uppercase shrink-0',
                        loc.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                      )}>
                        {loc.riskLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {loc.recurringCause}
                    </p>

                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between font-mono text-[10px]">
                      <span className="text-orange-400 font-medium">
                        🌧️ Trigger: {loc.triggerRainfallThreshold}
                      </span>

                      <button
                        onClick={() => selectLocationForAnalysis(loc)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold transition-all shadow-sm"
                      >
                        <span>Analyze</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
