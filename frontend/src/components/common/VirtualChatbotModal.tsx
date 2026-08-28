import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, Volume2, VolumeX, 
  MapPin, AlertTriangle, Activity, Waves, Layers, RotateCcw,
  Compass, ShieldCheck, ChevronRight, Zap
} from 'lucide-react';
import clsx from 'clsx';
import { useMockTelemetry } from '../../hooks/useMockTelemetry';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  locationCard?: {
    name: string;
    state: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
    recurringCause: string;
    coordinates: string;
    soilType: string;
  };
  liveTelemetryCard?: boolean;
}

const PRESET_QUESTIONS = [
  { label: '📍 High-Risk Landslide Locations', prompt: 'Which specific locations and corridors in India are at highest risk for landslides?' },
  { label: '⚡ What is the current situation right now?', prompt: 'What is the current live geotechnical situation and risk level at our station?' },
  { label: '🔄 Why do landslides recur repeatedly?', prompt: 'What are the main recurring causes of repeated landslides in hill areas like Wayanad and Shimla?' },
  { label: '📐 How does Bishop Factor of Safety work?', prompt: 'Explain how the Bishop limit equilibrium physics model calculates slope stability.' },
  { label: '🚨 What are the evacuation protocols?', prompt: 'What are the tiered emergency protocols and evacuation triggers when critical risk is detected?' },
];

const LOCATION_DATABASE = [
  {
    name: 'Wayanad (Chooralmala & Meppadi)',
    state: 'Kerala (Western Ghats)',
    riskLevel: 'CRITICAL' as const,
    recurringCause: 'Extreme hyper-concentrated rainfall (>300mm/24h) saturating lateritic soil over impermeable basalt bedrock, causing massive debris flows.',
    coordinates: '11.5434° N, 76.1362° E',
    soilType: 'Lateritic clay-sand with high hydraulic conductivity',
  },
  {
    name: 'Shimla — Solan Corridor (NH-5)',
    state: 'Himachal Pradesh (Himalayas)',
    riskLevel: 'CRITICAL' as const,
    recurringCause: 'Steep road-cutting removing toe support, combined with high antecedent pore-water pressure and seismic fragility.',
    coordinates: '31.1048° N, 77.1734° E',
    soilType: 'Colluvial debris and fractured phyllite bedrock',
  },
  {
    name: 'Konkan Railway Ghat Section',
    state: 'Maharashtra / Goa (Western Ghats)',
    riskLevel: 'HIGH' as const,
    recurringCause: 'Steep overburden rock-soil cuts during intense continuous monsoon deluges triggering sudden rotational track blockages.',
    coordinates: '17.2934° N, 73.4124° E',
    soilType: 'Red laterite and weathered Deccan basalt',
  },
  {
    name: 'Mandi — Pandoh — Kullu (NH-3)',
    state: 'Himachal Pradesh (Himalayas)',
    riskLevel: 'HIGH' as const,
    recurringCause: 'Beas river toe-erosion during cloudburst events liquefying saturated slope strata.',
    coordinates: '31.7088° N, 76.9318° E',
    soilType: 'Granitic gneiss and mica-schist talus',
  },
  {
    name: 'Chamoli & Joshimath Belt',
    state: 'Uttarakhand (Garhwal Himalayas)',
    riskLevel: 'CRITICAL' as const,
    recurringCause: 'Old landslide debris foundation, lack of sub-surface drainage, and hydrostatic pressure loading from glacier-fed torrents.',
    coordinates: '30.5564° N, 79.5637° E',
    soilType: 'Glacio-fluvial moraine and fractured quartzites',
  },
];

export default function VirtualChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

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

  const generateBotResponse = (query: string) => {
    const q = query.toLowerCase();
    let responseText = '';
    let locationCard: ChatMessage['locationCard'] = undefined;
    let liveTelemetryCard = false;

    // 1. Current Situation / Live Telemetry
    if (q.includes('situation') || q.includes('current') || q.includes('live') || q.includes('right now') || q.includes('status')) {
      const moisture = state?.telemetry.moisture.toFixed(1) || '38.4';
      const rain = state?.telemetry.rain.toFixed(1) || '0.0';
      const tilt = state?.telemetry.tilt.toFixed(2) || '12.40';
      const fos = state?.risk.factorOfSafety.toFixed(2) || '1.82';
      const riskScore = state ? Math.round(state.risk.riskScore * 100) : 18;
      const riskLevel = state?.risk.riskLevel || 'LOW';

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
    else if (q.includes('where') || q.includes('location') || q.includes('corridor') || q.includes('place') || q.includes('wayanad') || q.includes('shimla') || q.includes('kerala') || q.includes('himalaya') || q.includes('spot')) {
      if (q.includes('wayanad') || q.includes('kerala')) {
        locationCard = LOCATION_DATABASE[0];
        responseText = `**Wayanad (Meppadi & Chooralmala), Kerala:**\nWayanad sits on the steep Western Ghats scarp. The 2024 catastrophic disaster occurred when **300mm+ of continuous rainfall** saturated loose laterite topsoil over smooth, impermeable charnockite bedrock, creating an uncontrollable debris avalanche.`;
      } else if (q.includes('shimla') || q.includes('himachal')) {
        locationCard = LOCATION_DATABASE[1];
        responseText = `**Shimla — Solan Corridor (NH-5), Himachal Pradesh:**\nOne of the most vulnerable Himalayan highways. Unplanned hill slope excavation, toe removal for road widening, and blocked natural culverts cause frequent shear displacement whenever heavy monsoon rain increases soil weight and pore pressure.`;
      } else {
        locationCard = LOCATION_DATABASE[0];
        responseText = `**High-Risk Landslide Corridors in India:**\n\n1. **North-Western Himalayas**: Shimla, Mandi, Kullu-Manali (NH-3), Chamoli, Joshimath, Kedarnath Valley.\n2. **Western Ghats**: Wayanad (Kerala), Idukki, Konkan Railway Ghats (Maharashtra/Goa).\n3. **North-Eastern Ranges**: Shillong Plateau, Dima Hasao, Sikkim (NH-10).\n\nOver **12.6% of India's landmass** is prone to rainfall-induced landslides due to steep topography, fragile geology, and intense monsoon cloudbursts.`;
      }
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
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] h-[620px] max-h-[85vh] z-50 bg-[#0c101d]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
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
                {isTtsEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4" />}
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

                  <div className={clsx('space-y-2 max-w-[85%]', isBot ? 'text-left' : 'text-right')}>
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
                            <span className="text-emerald-400 font-bold">10s TELEMETRY</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-center pt-1">
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-400 block text-[9px]">MOISTURE VWC</span>
                              <strong className="text-slate-100">{state.telemetry.moisture.toFixed(1)}%</strong>
                            </div>
                            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-400 block text-[9px]">BISHOP FoS</span>
                              <strong className={state.risk.factorOfSafety < 1.0 ? 'text-red-400' : 'text-emerald-400'}>
                                {state.risk.factorOfSafety.toFixed(2)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Optional Location Profile Card */}
                      {msg.locationCard && (
                        <div className="mt-3 p-3 rounded-xl bg-black/50 border border-orange-500/30 space-y-1.5 font-mono text-[10px] text-slate-300 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-orange-300 font-bold">
                              <MapPin className="w-3.5 h-3.5 text-orange-400" />
                              <span>{msg.locationCard.name}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[9px] font-bold">
                              {msg.locationCard.riskLevel}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[9px]">{msg.locationCard.state} · {msg.locationCard.coordinates}</div>
                          <div className="text-slate-300 font-sans text-[11px] pt-1">
                            <strong>Recurring Cause:</strong> {msg.locationCard.recurringCause}
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
        </div>
      )}
    </>
  );
}
