import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, ShieldAlert, AlertTriangle, Droplets, CloudRain, 
  Mountain, Activity, CheckCircle2, ChevronRight, Sparkles, Clock, 
  FlaskConical, ArrowRight, Zap, Layers, Flame, Sliders, ShieldCheck
} from 'lucide-react';
import { RiskAssessment, RiskLevel, TelemetryReading, DemoStageId, SihDemoStateKey } from '../../types';
import clsx from 'clsx';

interface Props {
  currentStage?: DemoStageId;
  currentSihState?: SihDemoStateKey;
  onSelectStage?: (stage: DemoStageId) => void;
  onSelectSihState?: (state: SihDemoStateKey) => void;
  onRunAuto: () => void;
  onReset: () => void;
  reading: TelemetryReading;
  risk: RiskAssessment;
  events?: Array<{
    id: string;
    timestamp: string;
    event?: string;
    title?: string;
    description: string;
    severity?: string;
    stage?: number;
  }>;
}

interface SihStateConfig {
  key: SihDemoStateKey;
  label: string;
  sublabel: string;
  riskLevel: RiskLevel;
  riskColor: string;
  dotColor: string;
  activeGlow: string;
  icon: React.ComponentType<{ className?: string }>;
  expectedMoisture: string;
  expectedRain: string;
  expectedTilt: string;
  expectedFos: string;
  summary: string;
  badge: string;
}

const SIH_STATES: SihStateConfig[] = [
  {
    key: 'NORMAL',
    label: 'DRY BASELINE',
    sublabel: 'Dry Soil Nominal Stability',
    riskLevel: 'LOW',
    riskColor: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/30',
    dotColor: 'bg-emerald-400',
    activeGlow: 'ring-2 ring-emerald-500 shadow-xl shadow-emerald-950/60',
    icon: Mountain,
    expectedMoisture: '18.5%',
    expectedRain: '0 mm/h',
    expectedTilt: '21.8°',
    expectedFos: '> 1.80',
    summary: 'Baseline dry soil with nominal shear stability. Stable tilt angle, zero rainfall.',
    badge: '1. STABLE',
  },
  {
    key: 'RAIN',
    label: 'PRECIPITATION',
    sublabel: 'Rain Ingress Commences',
    riskLevel: 'LOW',
    riskColor: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/30',
    dotColor: 'bg-cyan-400',
    activeGlow: 'ring-2 ring-cyan-500 shadow-xl shadow-cyan-950/60',
    icon: CloudRain,
    expectedMoisture: '38.0%',
    expectedRain: '35 mm/h',
    expectedTilt: '22.1°',
    expectedFos: '1.45',
    summary: 'Precipitation starts; rain gauge active, surface moisture infiltration begins.',
    badge: '2. INGRESS',
  },
  {
    key: 'HEAVY_RAIN',
    label: 'DOWNPOUR',
    sublabel: 'Intense Monsoon Load',
    riskLevel: 'MODERATE',
    riskColor: 'text-amber-300 border-amber-500/40 bg-amber-950/30',
    dotColor: 'bg-amber-400',
    activeGlow: 'ring-2 ring-amber-500 shadow-xl shadow-amber-950/60',
    icon: CloudRain,
    expectedMoisture: '58.0%',
    expectedRain: '75 mm/h',
    expectedTilt: '22.8°',
    expectedFos: '1.28',
    summary: 'Heavy downpour event; moisture threshold crossed, pore pressure begins rising.',
    badge: '3. DOWNPOUR',
  },
  {
    key: 'SATURATION',
    label: 'SATURATION',
    sublabel: 'Pore-Water Saturation',
    riskLevel: 'HIGH',
    riskColor: 'text-orange-300 border-orange-500/40 bg-orange-950/30',
    dotColor: 'bg-orange-400',
    activeGlow: 'ring-2 ring-orange-500 shadow-xl shadow-orange-950/60',
    icon: Droplets,
    expectedMoisture: '84.0%',
    expectedRain: '85 mm/h',
    expectedTilt: '25.2°',
    expectedFos: '1.08',
    summary: 'Extensive pore-water saturation; effective normal stress drops, HIGH RISK alert triggered.',
    badge: '4. SATURATED',
  },
  {
    key: 'SLOPE_MOVEMENT',
    label: 'DISPLACEMENT',
    sublabel: 'Angular Shear & Creep',
    riskLevel: 'CRITICAL',
    riskColor: 'text-rose-300 border-rose-500/50 bg-rose-950/40',
    dotColor: 'bg-rose-500',
    activeGlow: 'ring-2 ring-rose-500 shadow-xl shadow-rose-950/60',
    icon: Activity,
    expectedMoisture: '91.0%',
    expectedRain: '80 mm/h',
    expectedTilt: '31.5°',
    expectedFos: '0.92',
    summary: 'Active angular tilt displacement on MPU6050 (+0.16°/min). Limit equilibrium failure FoS < 1.0.',
    badge: '5. CREEP ANOMALY',
  },
  {
    key: 'CRITICAL',
    label: 'FAILURE ALARM',
    sublabel: 'Limit Equilibrium Failure',
    riskLevel: 'CRITICAL',
    riskColor: 'text-red-300 border-red-500/60 bg-red-950/50',
    dotColor: 'bg-red-500',
    activeGlow: 'ring-2 ring-red-500 shadow-xl shadow-red-950/80 animate-pulse',
    icon: ShieldAlert,
    expectedMoisture: '96.0%',
    expectedRain: '92 mm/h',
    expectedTilt: '38.4°',
    expectedFos: '< 0.70',
    summary: 'Catastrophic slope shear failure. Automated railway stoppage and evacuation active.',
    badge: '6. EVACUATION',
  },
];

const REQUIRED_MILESTONES = [
  { id: 'm1', stateKey: 'RAIN', label: 'Rainfall detected', desc: 'Precipitation sensor triggered' },
  { id: 'm2', stateKey: 'HEAVY_RAIN', label: 'Moisture threshold crossed', desc: 'Soil moisture > 45% threshold' },
  { id: 'm3', stateKey: 'SATURATION', label: 'Stability indicator decreased', desc: 'Factor of Safety degraded below 1.25' },
  { id: 'm4', stateKey: 'SLOPE_MOVEMENT', label: 'Tilt anomaly detected', desc: 'Rapid angular movement on MPU6050' },
  { id: 'm5', stateKey: 'CRITICAL', label: 'HIGH RISK ALERT', desc: 'Critical evacuation alert dispatched' },
];

export default function PhysicalDemoPanel({
  currentStage = 1,
  currentSihState = 'NORMAL',
  onSelectStage,
  onSelectSihState,
  onRunAuto,
  onReset,
  reading,
  risk,
  events = [],
}: Props) {
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const resolvedStateKey: SihDemoStateKey = currentSihState || (
    currentStage === 1 ? 'NORMAL' :
    currentStage === 2 ? 'HEAVY_RAIN' :
    currentStage === 3 ? 'SATURATION' : 'SLOPE_MOVEMENT'
  );

  const activeStateConfig = SIH_STATES.find((s) => s.key === resolvedStateKey) || SIH_STATES[0];

  const handleStateClick = (stateKey: SihDemoStateKey) => {
    if (onSelectSihState) {
      onSelectSihState(stateKey);
    } else if (onSelectStage) {
      const stageMap: Record<SihDemoStateKey, DemoStageId> = {
        NORMAL: 1,
        RAIN: 2,
        HEAVY_RAIN: 2,
        SATURATION: 3,
        SLOPE_MOVEMENT: 4,
        CRITICAL: 4,
      };
      onSelectStage(stageMap[stateKey] || 1);
    }
  };

  const handleStartAuto = () => {
    setIsAutoRunning(true);
    onRunAuto();
    setCountdown(24);
  };

  useEffect(() => {
    if (!isAutoRunning || countdown === null) return;
    if (countdown <= 0) {
      setIsAutoRunning(false);
      setCountdown(null);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAutoRunning, countdown]);

  const stateIndex = SIH_STATES.findIndex((s) => s.key === resolvedStateKey);

  return (
    <div className="card p-4 space-y-4 border border-slate-700/60 shadow-2xl">
      {/* ── Top Header: Geotechnical Hazard Scenario Controller ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-400 shrink-0 shadow-sm">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-black text-slate-100 uppercase tracking-wider">
                Geotechnical Scenario & Telemetry Controller
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-[10px] font-bold tracking-wider">
                INTERACTIVE SCENARIOS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Test dynamic pore-water pressure spikes, shear angle changes, and automated multi-tier emergency response protocols.
            </p>
          </div>
        </div>

        {/* Station Mode Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono shrink-0">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-200 uppercase tracking-wider block text-[11px]">
              Active Simulation Pipeline
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Real-time synchronization with Local Physics & XGBoost AI Engine
            </span>
          </div>
        </div>
      </div>

      {/* ── 6 Controllable State Buttons ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Select Geotechnical Condition (Click to test scenario):
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            ACTIVE: [{activeStateConfig.label}]
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SIH_STATES.map((s) => {
            const Icon = s.icon;
            const isActive = resolvedStateKey === s.key;

            return (
              <button
                key={s.key}
                onClick={() => handleStateClick(s.key)}
                className={clsx(
                  "p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group focus:outline-none",
                  isActive
                    ? `${s.riskColor} ${s.activeGlow}`
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 opacity-75 hover:opacity-100"
                )}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={clsx("w-2 h-2 rounded-full", s.dotColor, isActive && "animate-ping")} />
                    <span className={clsx(
                      "text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full uppercase border",
                      s.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800' :
                      s.riskLevel === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-800' :
                      s.riskLevel === 'MODERATE' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border-emerald-800'
                    )}>
                      {s.riskLevel}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-bold text-slate-100 tracking-wide mt-1">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5 truncate">
                    {s.sublabel}
                  </div>
                </div>

                {/* Metrics Preview */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[9px] font-mono grid grid-cols-2 gap-0.5 text-slate-400">
                  <div>VWC: <strong className="text-slate-200">{s.expectedMoisture}</strong></div>
                  <div>Rain: <strong className="text-slate-200">{s.expectedRain}</strong></div>
                  <div>Tilt: <strong className="text-slate-200">{s.expectedTilt}</strong></div>
                  <div>FoS: <strong className="text-slate-200">{s.expectedFos}</strong></div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="mt-2 text-center py-0.5 rounded bg-slate-950 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-700/80 shadow-sm">
                    ● CURRENT
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Physics & ML Engine Response Strip ── */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center font-mono shadow-inner">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Soil Moisture</div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">
            {reading.soil_moisture_pct.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500">Pore Saturation</div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Precipitation</div>
          <div className="text-base font-bold text-sky-400 mt-0.5">
            {reading.rainfall_pct.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500">{reading.rainfall_24h_mm.toFixed(1)} mm / 24h</div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Slope Incline (Dip)</div>
          <div className="text-base font-bold text-amber-400 mt-0.5">
            {reading.tilt_angle.toFixed(2)}°
          </div>
          <div className="text-[9px] text-slate-500">3D IMU Spatial</div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Creep Velocity</div>
          <div className={clsx("text-base font-bold mt-0.5", Math.abs(reading.tilt_rate) > 0.05 ? "text-red-400" : "text-slate-200")}>
            {reading.tilt_rate >= 0 ? `+${reading.tilt_rate.toFixed(3)}` : reading.tilt_rate.toFixed(3)}°/m
          </div>
          <div className="text-[9px] text-slate-500">Shear Strain Rate</div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Factor of Safety</div>
          <div className={clsx(
            "text-base font-bold mt-0.5",
            risk.fos_estimate < 1.0 ? "text-red-400 font-black animate-pulse" :
            risk.fos_estimate < 1.3 ? "text-orange-400" : "text-emerald-400"
          )}>
            {risk.fos_estimate.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500">
            {risk.fos_estimate < 1.0 ? "FAILURE (FoS < 1)" : "Limit Equilibrium"}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Hazard Probability</div>
          <div className={clsx(
            "text-base font-bold mt-0.5",
            risk.risk_level === 'CRITICAL' ? "text-red-400 font-black" :
            risk.risk_level === 'HIGH' ? "text-orange-400" :
            risk.risk_level === 'MODERATE' ? "text-amber-400" : "text-emerald-400"
          )}>
            {(risk.risk_score * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-500">{risk.confidence ? `${(risk.confidence * 100).toFixed(0)}% Confidence` : 'XGBoost AI'}</div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Hazard Tier</div>
          <span className={clsx(
            "font-mono font-black text-xs uppercase px-2.5 py-0.5 rounded-full mt-1 border",
            risk.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-300 border-red-800 animate-pulse' :
            risk.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-300 border-orange-800' :
            risk.risk_level === 'MODERATE' ? 'bg-amber-950 text-amber-300 border-amber-800' :
            'bg-emerald-950 text-emerald-300 border-emerald-800'
          )}>
            {risk.risk_level}
          </span>
          <div className="text-[9px] text-slate-500 mt-1">{activeStateConfig.badge}</div>
        </div>
      </div>

      {/* ── Control Bar + Milestone Event Timeline Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* Left: Interactive Demo Actions */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider mb-1">
              Automated Scenario Sequencer
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Runs the continuous rainfall-to-failure progression automatically across all 6 geotechnical phases.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStartAuto}
              disabled={isAutoRunning}
              className={clsx(
                "w-full py-2.5 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md",
                isAutoRunning
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-950/50"
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isAutoRunning ? `Running Scenario Sequence (${countdown}s)...` : 'Run Automated Progression'}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const prevIdx = Math.max(0, stateIndex - 1);
                  handleStateClick(SIH_STATES[prevIdx].key);
                }}
                disabled={stateIndex <= 0}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 font-mono text-xs font-medium transition-colors"
              >
                ◀ Prev Step
              </button>
              <button
                onClick={() => {
                  const nextIdx = Math.min(SIH_STATES.length - 1, stateIndex + 1);
                  handleStateClick(SIH_STATES[nextIdx].key);
                }}
                disabled={stateIndex >= SIH_STATES.length - 1}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 font-mono text-xs font-medium transition-colors"
              >
                Next Step ▶
              </button>
              <button
                onClick={onReset}
                className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset to Dry Baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right (2 Cols): Event Timeline Milestones */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Geotechnical Event Timeline & Thresholds
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                MONITORING LOG
              </span>
            </div>

            {/* 5 Required Milestone Trackers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {REQUIRED_MILESTONES.map((m, idx) => {
                const triggerIndex = SIH_STATES.findIndex((s) => s.key === m.stateKey);
                const isTriggered = stateIndex >= triggerIndex;
                const isCurrent = resolvedStateKey === m.stateKey;

                return (
                  <div
                    key={m.id}
                    className={clsx(
                      "p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all",
                      isTriggered
                        ? isCurrent
                          ? "bg-cyan-950/50 border-cyan-500/80 text-slate-100 shadow-md shadow-cyan-950/40"
                          : "bg-slate-900/80 border-slate-700/80 text-slate-300"
                        : "bg-slate-950/40 border-slate-900 text-slate-600 opacity-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[9px] font-bold text-slate-500">#{idx + 1}</span>
                        {isTriggered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div className="font-mono font-bold text-[11px] leading-tight text-slate-200">
                        "{m.label}"
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans mt-1">
                      {m.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Limit Equilibrium Infinite Slope Stability + XGBoost Hybrid Coupling</span>
            <span className="text-cyan-400 font-semibold uppercase">STATE {stateIndex + 1} OF 6: [{activeStateConfig.label}]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
