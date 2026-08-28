import React from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import LoadingState from '../components/common/LoadingState';
import PrototypeLabel from '../components/common/PrototypeLabel';
import { Server, Settings, Database, RefreshCw, AlertTriangle, Cpu, Layers, ShieldCheck, Sliders, Radio, CheckCircle2, Wifi, FlaskConical } from 'lucide-react';
import { Scenario } from '../mock/generator';
import clsx from 'clsx';

const SettingsPage: React.FC = () => {
  const { 
    state, 
    scenario, 
    setScenario, 
    setInterval: setUpdateInterval, 
    reset, 
    mode, 
    setMode, 
    demoStage, 
    setDemoStage,
    connectionState,
    setConnectionState,
  } = useMockTelemetry();
  
  if (!state) return <LoadingState message="Loading system configuration..." />;

  const isHardware = mode === 'HARDWARE';
  const isDemo = mode === 'DEMO';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-mono text-slate-100 uppercase">Hardware & Ingestion Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Configure data ingestion modes: Real ESP32 Sensors via LoRa Gateway, Blynk IoT Cloud Webhooks, or Geotechnical Scenarios.
          </p>
        </div>
        <PrototypeLabel text="Live Telemetry Active" />
      </div>

      {/* Section 1: Data Source Mode Switcher */}
      <section className="card border border-slate-700/60">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">Telemetry Data Ingestion Source</span>
          </div>
          <span className={clsx(
            "badge text-[10px] font-mono",
            isDemo ? "badge-low text-cyan-300 border border-cyan-700" :
            isHardware ? "badge-critical text-red-300" : "badge-moderate text-amber-300"
          )}>
            Current Mode: {mode}
          </span>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode 1: Physical Demonstration */}
            <div
              onClick={() => setMode('DEMO')}
              className={clsx(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                isDemo
                  ? "bg-cyan-950/30 border-cyan-500 shadow-lg shadow-cyan-950/50"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className={clsx("w-5 h-5", isDemo ? "text-cyan-400 animate-pulse" : "text-slate-500")} />
                    <span className="font-bold text-sm text-slate-100">FIELD SCENARIO</span>
                  </div>
                  {isDemo && (
                    <span className="px-2 py-0.5 rounded bg-cyan-600 text-slate-950 font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                  Controlled geotechnical progression: Dry soil baseline $\rightarrow$ Precipitation $\rightarrow$ Pore saturation $\rightarrow$ Shear displacement.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• Progression: <span className="text-slate-200">6 Continuous States</span></div>
                <div>• Active State: <span className="text-cyan-400 font-bold">Stage {demoStage}</span></div>
                <div>• Endpoint: <span className="text-slate-200">/api/demo/state</span></div>
              </div>
            </div>

            {/* Mode 2: Real ESP32 Hardware */}
            <div
              onClick={() => setMode('HARDWARE')}
              className={clsx(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                isHardware
                  ? "bg-red-950/30 border-red-500 shadow-lg shadow-red-950/50"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={clsx("w-5 h-5", isHardware ? "text-red-400 animate-pulse" : "text-slate-500")} />
                    <span className="font-bold text-sm text-slate-100">LIVE HARDWARE</span>
                  </div>
                  {isHardware && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                  Receives real sensor packets from the physical <strong>ESP32 Sensor Node (LG-N01)</strong> over LoRa via <strong>LG-GW01</strong> gateway.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• Ingest URL: <span className="text-slate-200">/api/telemetry</span></div>
                <div>• Stream URL: <span className="text-slate-200">/ws/telemetry</span></div>
                <div>• Protocol: <span className="text-slate-200">LoRa 433MHz + Wi-Fi</span></div>
              </div>
            </div>

            {/* Mode 3: Synthetic Simulation */}
            <div
              onClick={() => setMode('SIMULATION')}
              className={clsx(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                mode === 'SIMULATION'
                  ? "bg-amber-950/30 border-amber-500 shadow-lg shadow-amber-950/50"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className={clsx("w-5 h-5", mode === 'SIMULATION' ? "text-amber-400" : "text-slate-500")} />
                    <span className="font-bold text-sm text-slate-100">SIMULATION</span>
                  </div>
                  {mode === 'SIMULATION' && (
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                  Generates smooth continuous synthetic environmental and geological time-series profiles with controllable parameters.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>• Profile: <span className="text-slate-200">{scenario}</span></div>
                <div>• Rate: <span className="text-slate-200">3.0s interval</span></div>
                <div>• Engine: <span className="text-slate-200">Gray-Box FoS</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Phase 13 Offline Connection State Tester */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Offline-First Operational Network Tester</span>
          </div>
          <span className={clsx(
            "badge font-mono text-[10px]",
            connectionState === 'ONLINE' ? "badge-low text-emerald-300" :
            connectionState === 'DEGRADED' ? "badge-moderate text-amber-300" : "badge-critical text-red-300"
          )}>
            STATUS: {connectionState}
          </span>
        </div>
        <div className="card-body space-y-3">
          <p className="text-xs text-slate-300 font-sans">
            LANDGUARD AI operates completely offline on local compute with zero cloud or internet dependency. Use the controls below to test gateway buffering and local edge processing during network degradation or total offline conditions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <button
              onClick={() => setConnectionState('ONLINE')}
              className={clsx(
                "p-3 rounded-lg border text-left transition-all",
                connectionState === 'ONLINE'
                  ? "bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              )}
            >
              <div className="font-bold text-sm">1. ONLINE</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">Normal real-time LoRa stream & WebSocket broadcast.</p>
            </button>

            <button
              onClick={() => setConnectionState('DEGRADED')}
              className={clsx(
                "p-3 rounded-lg border text-left transition-all",
                connectionState === 'DEGRADED'
                  ? "bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              )}
            >
              <div className="font-bold text-sm">2. DEGRADED</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">High packet latency / sporadic frame loss simulation.</p>
            </button>

            <button
              onClick={() => setConnectionState('OFFLINE')}
              className={clsx(
                "p-3 rounded-lg border text-left transition-all",
                connectionState === 'OFFLINE'
                  ? "bg-red-950/40 border-red-500 text-red-200 shadow-sm"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
              )}
            >
              <div className="font-bold text-sm">3. OFFLINE</div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">Zero internet. Gateway ring buffers; local DB & AI stay live.</p>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Telemetry Simulation Profile (Available in SIMULATION Mode) */}
      {!isHardware && (
        <section className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Simulation Scenario Profiles</span>
            </div>
            <span className="badge badge-low text-[10px]">Mock Generator</span>
          </div>
          <div className="card-body space-y-6">
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'dry_stable', title: '1. Dry & Stable Conditions', desc: 'Low moisture (20%), zero rain, nominal slope angle (22°). Risk is LOW.' },
                  { id: 'moderate_rain', title: '2. Moderate Rainfall & Saturation', desc: 'Moisture rising to 50%, steady rain (30mm), FoS drops to ~1.3. Risk is MODERATE.' },
                  { id: 'heavy_rain', title: '3. Heavy Monsoon Event', desc: 'Moisture at 75%, heavy precipitation (65mm), slight slope creep. Risk is HIGH.' },
                  { id: 'crisis', title: '4. Critical Slope Failure (Crisis)', desc: 'Moisture >90%, intense rain, accelerating tilt (+0.5°/m), FoS < 1.0. Risk is CRITICAL.' },
                  { id: 'escalation', title: '5. Dynamic Escalation Sequence', desc: 'Gradually evolves from baseline dry to critical landslide crisis over time.' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setScenario(item.id as Scenario)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      scenario === item.id
                        ? 'bg-amber-950/50 border-amber-500 shadow-sm shadow-amber-950'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{item.title}</span>
                      {scenario === item.id && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Telemetry Tick Rate:
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">Controls frequency of incoming sensor packets.</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="1" max="10" step="1" 
                  defaultValue="3"
                  onChange={(e) => setUpdateInterval(parseInt(e.target.value) * 1000)}
                  className="w-36 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-amber-400 min-w-[50px]">
                  3.0 sec
                </span>
                <button 
                  onClick={() => reset()}
                  className="btn-secondary flex items-center gap-1.5 text-xs font-mono font-semibold"
                >
                  <RefreshCw size={13} /> Reset Buffer
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Geotechnical Soil Parameters (FoS) */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Geotechnical Soil & Limit Equilibrium Model Parameters</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Skempton-DeLory Model</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Effective Cohesion (c')</span>
              <span className="text-base font-bold text-slate-100 mt-1 block">5.00 kPa</span>
              <span className="text-[10px] text-slate-500">Colluvium baseline</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Friction Angle (φ')</span>
              <span className="text-base font-bold text-slate-100 mt-1 block">25.0°</span>
              <span className="text-[10px] text-slate-500">Internal shear angle</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Saturated Unit Weight</span>
              <span className="text-base font-bold text-slate-100 mt-1 block">18.0 kN/m³</span>
              <span className="text-[10px] text-slate-500">γ_sat soil mass</span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Slip Depth (z)</span>
              <span className="text-base font-bold text-slate-100 mt-1 block">1.50 m</span>
              <span className="text-[10px] text-slate-500">Failure shear plane</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 font-sans leading-relaxed">
            Note: The physics engine applies dynamic degradation of cohesion $c'$ and friction angle $\phi'$ proportionally as volumetric soil moisture increases from baseline to saturation, computing continuous Factor of Safety ($FoS$) approximations.
          </p>
        </div>
      </section>

      {/* Section 4: System Runtime Metadata */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>System Runtime & Architecture</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">ONLINE</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Application</span>
              <span className="text-slate-200 font-bold mt-0.5 block">LANDGUARD AI</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Version</span>
              <span className="text-slate-200 font-bold mt-0.5 block">v0.2.0-modular</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">AI Model</span>
              <span className="text-slate-200 font-bold mt-0.5 block">XGBoost 2.0.3</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Explainer</span>
              <span className="text-slate-200 font-bold mt-0.5 block">SHAP TreeExplainer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
