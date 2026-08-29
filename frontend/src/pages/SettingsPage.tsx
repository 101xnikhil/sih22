import React from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import LoadingState from '../components/common/LoadingState';
import PrototypeLabel from '../components/common/PrototypeLabel';
import { Server, Settings, Database, RefreshCw, AlertTriangle, Cpu, Layers, ShieldCheck, Sliders, Radio, CheckCircle2, Wifi, FlaskConical } from 'lucide-react';
import { Scenario } from '../mock/generator';
import clsx from 'clsx';
import BlynkIntegrationPanel from '../components/dashboard/BlynkIntegrationPanel';

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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">Hardware & Ingestion Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure data ingestion modes: Real ESP32 Sensors via LoRa Gateway, Blynk IoT Cloud Webhooks, or Geotechnical Scenarios.
          </p>
        </div>
        <PrototypeLabel text="Live Telemetry Active" />
      </div>

      {/* Section 1: Data Source Mode Switcher */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Server className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs uppercase tracking-wider">Telemetry Data Ingestion Source</span>
          </div>
          <span className={clsx(
            "badge text-[10px]",
            isDemo ? "badge-blue" : isHardware ? "badge-low" : "badge-medium"
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
                  ? "bg-blue-50/50 border-blue-500 shadow-sm"
                  : "bg-white border-[#e5e9f2] hover:border-slate-300 opacity-80"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className={clsx("w-5 h-5", isDemo ? "text-blue-600 animate-pulse" : "text-slate-400")} />
                    <span className="font-bold text-sm text-slate-900">FIELD SCENARIO</span>
                  </div>
                  {isDemo && (
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed">
                  Controlled geotechnical progression: Dry soil baseline $\rightarrow$ Precipitation $\rightarrow$ Pore saturation $\rightarrow$ Shear displacement.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div>• Progression: <span className="text-slate-800 font-semibold">6 Continuous States</span></div>
                <div>• Active State: <span className="text-blue-600 font-bold">Stage {demoStage}</span></div>
                <div>• Endpoint: <span className="text-slate-800">/api/demo/state</span></div>
              </div>
            </div>

            {/* Mode 2: Real ESP32 Hardware */}
            <div
              onClick={() => setMode('HARDWARE')}
              className={clsx(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                isHardware
                  ? "bg-red-50/50 border-red-500 shadow-sm"
                  : "bg-white border-[#e5e9f2] hover:border-slate-300 opacity-80"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className={clsx("w-5 h-5", isHardware ? "text-red-600 animate-pulse" : "text-slate-400")} />
                    <span className="font-bold text-sm text-slate-900">LIVE HARDWARE</span>
                  </div>
                  {isHardware && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed">
                  Receives real sensor packets from the physical <strong>ESP32 Sensor Node (LG-N01)</strong> over LoRa via <strong>LG-GW01</strong> gateway.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div>• Ingest URL: <span className="text-slate-800">/api/telemetry</span></div>
                <div>• Stream URL: <span className="text-slate-800">/ws/telemetry</span></div>
                <div>• Protocol: <span className="text-slate-800">LoRa 433MHz + Wi-Fi</span></div>
              </div>
            </div>

            {/* Mode 3: Synthetic Simulation */}
            <div
              onClick={() => setMode('SIMULATION')}
              className={clsx(
                "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                mode === 'SIMULATION'
                  ? "bg-amber-50/50 border-amber-500 shadow-sm"
                  : "bg-white border-[#e5e9f2] hover:border-slate-300 opacity-80"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className={clsx("w-5 h-5", mode === 'SIMULATION' ? "text-amber-600" : "text-slate-400")} />
                    <span className="font-bold text-sm text-slate-900">SIMULATION</span>
                  </div>
                  {mode === 'SIMULATION' && (
                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-sans leading-relaxed">
                  Generates smooth continuous synthetic environmental and geological time-series profiles with controllable parameters.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                <div>• Profile: <span className="text-slate-800 font-semibold">{scenario}</span></div>
                <div>• Rate: <span className="text-slate-800">3.0s interval</span></div>
                <div>• Engine: <span className="text-slate-800">Gray-Box FoS</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blynk IoT Cloud Hardware Integration */}
      <BlynkIntegrationPanel reading={state.currentReading} risk={state.currentRisk} />

      {/* Section 2: Offline Connection State Tester */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-xs uppercase tracking-wider">Offline-First Operational Network Tester</span>
          </div>
          <span className={clsx(
            "badge font-mono text-[10px]",
            connectionState === 'ONLINE' ? "badge-elite" :
            connectionState === 'DEGRADED' ? "badge-medium" : "badge-low"
          )}>
            STATUS: {connectionState}
          </span>
        </div>
        <div className="card-body space-y-3">
          <p className="text-xs text-slate-600 font-sans">
            LANDGUARD AI operates completely offline on local compute with zero cloud or internet dependency. Use the controls below to test gateway buffering and local edge processing during network degradation or total offline conditions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              onClick={() => setConnectionState('ONLINE')}
              className={clsx(
                "p-3 rounded-xl border text-left transition-all",
                connectionState === 'ONLINE'
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              <div className="font-bold text-sm font-sans">1. ONLINE</div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">Normal real-time LoRa stream & WebSocket broadcast.</p>
            </button>

            <button
              onClick={() => setConnectionState('DEGRADED')}
              className={clsx(
                "p-3 rounded-xl border text-left transition-all",
                connectionState === 'DEGRADED'
                  ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              <div className="font-bold text-sm font-sans">2. DEGRADED</div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">High packet latency / sporadic frame loss simulation.</p>
            </button>

            <button
              onClick={() => setConnectionState('OFFLINE')}
              className={clsx(
                "p-3 rounded-xl border text-left transition-all",
                connectionState === 'OFFLINE'
                  ? "bg-red-50 border-red-400 text-red-900 shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              <div className="font-bold text-sm font-sans">3. OFFLINE</div>
              <p className="text-[11px] text-slate-500 font-sans mt-1">Zero internet. Gateway ring buffers; local DB & AI stay live.</p>
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Geotechnical Soil Parameters (FoS) */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs uppercase tracking-wider">Geotechnical Soil & Limit Equilibrium Model Parameters</span>
          </div>
          <span className="font-mono text-[10.5px] font-bold text-slate-500">Skempton-DeLory Model</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">Effective Cohesion (c')</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">5.00 kPa</span>
              <span className="text-[10px] text-slate-500 font-sans">Colluvium baseline</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">Friction Angle (φ')</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">25.0°</span>
              <span className="text-[10px] text-slate-500 font-sans">Internal shear angle</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">Saturated Unit Weight</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">18.0 kN/m³</span>
              <span className="text-[10px] text-slate-500 font-sans">γ_sat soil mass</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-sans">Slip Depth (z)</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">1.50 m</span>
              <span className="text-[10px] text-slate-500 font-sans">Failure shear plane</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-sans leading-relaxed">
            Note: The physics engine applies dynamic degradation of cohesion $c'$ and friction angle $\phi'$ proportionally as volumetric soil moisture increases from baseline to saturation, computing continuous Factor of Safety ($FoS$) approximations.
          </p>
        </div>
      </section>

      {/* Section 4: System Runtime Metadata */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs uppercase tracking-wider">System Runtime & Architecture</span>
          </div>
          <span className="badge badge-elite text-[10px]">ONLINE</span>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Application</span>
              <span className="text-slate-900 font-bold mt-0.5 block">LANDGUARD AI</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Version</span>
              <span className="text-slate-900 font-bold mt-0.5 block">v0.2.0-modular</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">AI Model</span>
              <span className="text-slate-900 font-bold mt-0.5 block">XGBoost 2.0.3</span>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Explainer</span>
              <span className="text-slate-900 font-bold mt-0.5 block">SHAP TreeExplainer</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
