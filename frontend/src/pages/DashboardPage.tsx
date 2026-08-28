import React from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import { getGenerator, Scenario } from '../mock/generator';
import RiskCard from '../components/dashboard/RiskCard';
import SensorCards from '../components/dashboard/SensorCards';
import LiveCharts from '../components/dashboard/LiveCharts';
import AIExplanation from '../components/dashboard/AIExplanation';
import RiskTimeline from '../components/dashboard/RiskTimeline';
import DeviceHealth from '../components/dashboard/DeviceHealth';
import AlertPanel from '../components/dashboard/AlertPanel';
import MiniMap from '../components/dashboard/MiniMap';
import RecentEvents from '../components/dashboard/RecentEvents';
import PhysicalDemoPanel from '../components/dashboard/PhysicalDemoPanel';
import SecurityPanel from '../components/dashboard/SecurityPanel';
import LoadingState from '../components/common/LoadingState';
import { formatTime, formatDateTime, formatRelativeTime } from '../utils/formatters';
import { Radio, RefreshCw, AlertTriangle, ShieldAlert, Cpu, Sparkles, Server, CheckCircle2, FlaskConical, WifiOff, Wifi } from 'lucide-react';
import clsx from 'clsx';

import BlynkIntegrationPanel from '../components/dashboard/BlynkIntegrationPanel';

const DashboardPage: React.FC = () => {
  const { 
    state, 
    scenario, 
    setScenario, 
    reset, 
    acknowledgeAlert, 
    mode, 
    setMode,
    demoStage,
    setDemoStage,
    sihState,
    setSihState,
    runDemoSequence,
    runSihSequence,
    connectionState,
    securityEvents,
    simulateReplayAttack,
    simulateUnauthorizedNode,
  } = useMockTelemetry();
  
  if (!state) {
    return <LoadingState message="Connecting to telemetry ingest gateway..." />;
  }

  const isHardware = mode === 'HARDWARE';
  const isDemo = mode === 'DEMO';
  const isOffline = connectionState === 'OFFLINE';
  
  // Format chart data: use real hardware history if in HARDWARE mode, else mock generator
  const chartData = isHardware
    ? state.readingHistory.map((r, i) => ({
        time: new Date(r.timestamp).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        timestamp: new Date(r.timestamp).getTime(),
        soil_moisture: r.soil_moisture_pct,
        rainfall: r.rainfall_pct,
        tilt_angle: r.tilt_angle,
        tilt_rate: r.tilt_rate,
        risk_score: state.riskHistory[i]?.risk_score ?? state.currentRisk.risk_score,
        fos: state.riskHistory[i]?.fos_estimate ?? state.currentRisk.fos_estimate,
      }))
    : getGenerator().getChartData();

  const riskTimelineData = state.riskHistory.map(r => ({ time: r.timestamp, risk_score: r.risk_score }));
  const isElevatedRisk = state.currentRisk.risk_level === 'HIGH' || state.currentRisk.risk_level === 'CRITICAL';

  return (
    <div className="space-y-4">
      {/* ── Offline-First Status Strip ───────────────────────── */}
      {connectionState !== 'ONLINE' && (
        <div className={clsx(
          "rounded-xl p-3 flex items-center justify-between border-l-4 shadow-sm text-xs font-mono transition-all",
          isOffline
            ? "bg-red-950/40 border-red-500 text-red-200"
            : "bg-amber-950/40 border-amber-500 text-amber-200"
        )}>
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <strong className="uppercase">
                {isOffline ? "OFFLINE AIR-GAPPED OPERATION ACTIVE" : "DEGRADED NETWORK METRICS"}
              </strong>
              <span className="opacity-90 ml-2 font-sans">
                {isOffline 
                  ? "Zero cloud/internet dependency. ESP32 Gateway buffering packets locally in SRAM. Local FastAPI, SQLite & XGBoost AI computing continuously."
                  : "Increased network latency detected. Local edge fallback buffering enabled."}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-current text-[10px] uppercase shrink-0">
            {isOffline ? "BUFFERING LOCALLY" : "EDGE FALLBACK"}
          </span>
        </div>
      )}

      {/* ── Operational Mode & Connection Strip ───────────────── */}
      <div className={clsx(
        "rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs border transition-all",
        isDemo
          ? "bg-slate-900/90 border-cyan-700/60 shadow-lg shadow-cyan-950/30"
          : isHardware 
          ? "bg-slate-900/90 border-red-700/60 shadow-lg shadow-red-950/20" 
          : "bg-slate-900/90 border-slate-800/80"
      )}>
        {/* Left: Node Identity & Source Mode Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isDemo ? "bg-cyan-400" : isHardware ? "bg-red-400" : "bg-emerald-400")}></span>
              <span className={clsx("relative inline-flex rounded-full h-2.5 w-2.5", isDemo ? "bg-cyan-500" : isHardware ? "bg-red-500" : "bg-emerald-500")}></span>
            </span>
            <span className="font-bold text-slate-100 font-mono tracking-wider">{state.node.id}</span>
          </div>

          <span className={clsx(
            "px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase flex items-center gap-1.5 border",
            isDemo 
              ? "bg-cyan-950 text-cyan-300 border-cyan-600 shadow-sm"
              : isHardware 
              ? "bg-red-950 text-red-300 border-red-700 shadow-sm" 
              : "bg-amber-950 text-amber-300 border-amber-700 shadow-sm"
          )}>
            {isDemo ? <FlaskConical className="w-3 h-3 text-cyan-400" /> : isHardware ? <Radio className="w-3 h-3 text-red-400" /> : <Cpu className="w-3 h-3 text-amber-400" />}
            {isDemo ? 'LAB SCENARIO CONTROLLER' : isHardware ? 'LIVE ESP32 SENSOR FEED' : 'SYNTHETIC EVOLUTION'}
          </span>

          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 font-sans hidden sm:inline truncate max-w-[240px]">
            {isDemo ? 'Geotechnical Corridor Sector 7' : state.node.location.description}
          </span>
        </div>

        {/* Center: Ingest Clock & Sequence Counter */}
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <div>
            LAST PACKET: <span className="text-slate-200 font-bold">{formatRelativeTime(state.currentReading.timestamp)}</span>
            <span className="text-slate-500 ml-1">({formatTime(state.currentReading.timestamp)})</span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            SEQ: <span className="text-cyan-400 font-bold">#{state.currentReading.seq_num}</span>
          </div>
          {isDemo && (
            <>
              <span className="text-slate-700">|</span>
              <div className="text-cyan-300 flex items-center gap-1 font-mono font-bold">
                <span>SCENARIO ACTIVE</span>
              </div>
            </>
          )}
          {isHardware && (
            <>
              <span className="text-slate-700">|</span>
              <div className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3" />
                <span>LORA GATEWAY SYNCED</span>
              </div>
            </>
          )}
        </div>

        {/* Right: Mode-Specific Controls */}
        <div className="flex items-center gap-2">
          {isDemo ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800 font-semibold">
                SCENARIO MODE
              </span>
              <button 
                onClick={() => reset()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Reset Scenario Buffer"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          ) : !isHardware ? (
            <>
              <select 
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="dry_stable">Profile: Dry & Stable</option>
                <option value="moderate_rain">Profile: Moderate Rain</option>
                <option value="heavy_rain">Profile: Heavy Rain</option>
                <option value="crisis">Profile: Critical Failure</option>
                <option value="escalation">Profile: Escalation</option>
                <option value="physical_demo">Profile: Physical Progression</option>
              </select>
              <button 
                onClick={() => reset()}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Reset Simulation Buffer"
              >
                <RefreshCw size={13} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-400">
                RSSI: <strong className="text-slate-100">{state.currentReading.rssi_dbm} dBm</strong>
              </span>
              <span className="text-slate-400">
                SNR: <strong className="text-slate-100">{state.currentReading.snr_db} dB</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Geotechnical Scenario & Field Controller ──────────── */}
      {isDemo && (
        <PhysicalDemoPanel
          currentStage={demoStage}
          currentSihState={sihState}
          onSelectStage={(s) => setDemoStage(s)}
          onSelectSihState={(st) => setSihState(st)}
          onRunAuto={runSihSequence}
          onReset={reset}
          reading={state.currentReading}
          risk={state.currentRisk}
          events={state.events}
        />
      )}

      {/* ── High Hazard Warning Banner ──────────────────────── */}
      {isElevatedRisk && (
        <div className={clsx(
          "rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 shadow-xl transition-all",
          state.currentRisk.risk_level === 'CRITICAL'
            ? "bg-red-950/60 border-red-500 text-red-200 ring-1 ring-red-500/40"
            : "bg-orange-950/60 border-orange-500 text-orange-200 ring-1 ring-orange-500/40"
        )}>
          <div className="flex items-start gap-3">
            <ShieldAlert className={clsx("w-6 h-6 shrink-0 mt-0.5 animate-pulse", state.currentRisk.risk_level === 'CRITICAL' ? 'text-red-400' : 'text-orange-400')} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-sm uppercase px-2.5 py-0.5 rounded-full bg-slate-900 border border-current">
                  {state.currentRisk.risk_level === 'CRITICAL' ? 'CRITICAL RISK ALERT' : 'HIGH RISK WARNING'}
                </span>
                <span className="font-mono font-bold text-xs text-slate-100">
                  Node: {state.node.id} (Sector 7)
                </span>
                <span className="font-mono text-[11px] opacity-90">
                  (FoS: {state.currentRisk.fos_estimate.toFixed(2)} | Risk Score: {(state.currentRisk.risk_score * 100).toFixed(0)}%)
                </span>
              </div>

              {/* Reasons List */}
              <div className="mt-2 text-xs">
                <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-slate-300 block mb-1">
                  Active Geotechnical Triggers:
                </span>
                <ul className="space-y-0.5 text-xs text-slate-200 font-sans ml-1">
                  <li className="flex items-center gap-1.5">
                    <span className="text-orange-400 font-bold">•</span>
                    <span>Soil moisture matrix elevated — pore-water saturation active</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-orange-400 font-bold">•</span>
                    <span>3D IMU angular creep velocity accelerating (+0.16°/min)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-orange-400 font-bold">•</span>
                    <span>Bishop Factor of Safety degraded below stability threshold (FoS &lt; 1.00)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons: ACKNOWLEDGE & VIEW DETAILS */}
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {state.alerts.length > 0 && !state.alerts[0].acknowledged ? (
              <button
                onClick={() => acknowledgeAlert(state.alerts[0].id)}
                className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
              >
                ACKNOWLEDGE
              </button>
            ) : (
              <button
                onClick={() => {
                  if (state.alerts.length > 0) acknowledgeAlert(state.alerts[0].id);
                }}
                className="py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-mono font-bold text-xs uppercase tracking-wider"
              >
                ACKNOWLEDGE
              </button>
            )}
            <a
              href="/alerts"
              className="py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-mono font-bold text-xs uppercase tracking-wider transition-colors inline-block text-center"
            >
              VIEW DETAILS
            </a>
          </div>
        </div>
      )}

      {/* ── Real Hardware ESP32 & Blynk IoT Cloud Bridge Widget ── */}
      <BlynkIntegrationPanel reading={state.currentReading} risk={state.currentRisk} />

      {/* ── Main Command Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Row 1: Primary Risk Card (1 col) + Sensor Metrics Grid (2 cols) */}
        <div className="lg:col-span-1">
          <RiskCard risk={state.currentRisk} />
        </div>
        <div className="lg:col-span-2">
          <SensorCards reading={state.currentReading} />
        </div>
        
        {/* Row 2: Live Engineering Charts (2 cols) + AI Explainability (1 col) */}
        <div className="lg:col-span-2">
          <LiveCharts data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <AIExplanation risk={state.currentRisk} />
        </div>
        
        {/* Row 3: Risk Trajectory (1 col) + Node Diagnostics (1 col) + Alert Feed (1 col) */}
        <div className="lg:col-span-1">
          <RiskTimeline data={riskTimelineData} />
        </div>
        <div className="lg:col-span-1">
          <DeviceHealth node={state.node} reading={state.currentReading} />
        </div>
        <div className="lg:col-span-1">
          <AlertPanel alerts={state.alerts} onAcknowledge={acknowledgeAlert} />
        </div>
        
        {/* Row 4: Geographic Map Sector (1 col) + Live Audit Stream (2 cols) */}
        <div className="lg:col-span-1">
          <MiniMap node={state.node} />
        </div>
        <div className="lg:col-span-2">
          <RecentEvents events={state.events} />
        </div>

        {/* Row 5: Edge Cybersecurity & Replay Defense */}
        <div className="lg:col-span-3">
          <SecurityPanel
            events={securityEvents}
            onSimulateReplay={simulateReplayAttack}
            onSimulateUnauthorized={simulateUnauthorizedNode}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
