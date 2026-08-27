import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, ShieldAlert, AlertTriangle, Droplets, CloudRain, 
  Mountain, Activity, CheckCircle2, ChevronRight, Sparkles, Clock, 
  FlaskConical, ArrowRight, Info, Zap, Layers, Flame
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
    label: 'NORMAL',
    sublabel: 'Dry Stable Baseline',
    riskLevel: 'LOW',
    riskColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    dotColor: 'bg-emerald-400',
    activeGlow: 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-950/80',
    icon: Mountain,
    expectedMoisture: '18.5%',
    expectedRain: '0 mm/h',
    expectedTilt: '21.8°',
    expectedFos: '> 1.80',
    summary: 'Baseline dry soil with nominal stability. Stable tilt angle, zero rainfall.',
    badge: '1. STABLE',
  },
  {
    key: 'RAIN',
    label: 'RAIN',
    sublabel: 'Onset Precipitation',
    riskLevel: 'LOW',
    riskColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    dotColor: 'bg-cyan-400',
    activeGlow: 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-950/80',
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
    label: 'HEAVY RAIN',
    sublabel: 'Monsoon Downpour',
    riskLevel: 'MODERATE',
    riskColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    dotColor: 'bg-amber-400',
    activeGlow: 'ring-2 ring-amber-500 shadow-lg shadow-amber-950/80',
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
    sublabel: 'High Pore Pressure',
    riskLevel: 'HIGH',
    riskColor: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    dotColor: 'bg-orange-400',
    activeGlow: 'ring-2 ring-orange-500 shadow-lg shadow-orange-950/80',
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
    label: 'SLOPE MOVEMENT',
    sublabel: 'Active Kinematic Tilt',
    riskLevel: 'CRITICAL',
    riskColor: 'text-rose-400 border-rose-500/50 bg-rose-950/50',
    dotColor: 'bg-rose-500',
    activeGlow: 'ring-2 ring-rose-500 shadow-lg shadow-rose-950/80',
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
    label: 'CRITICAL',
    sublabel: 'Imminent Collapse',
    riskLevel: 'CRITICAL',
    riskColor: 'text-red-400 border-red-500/50 bg-red-950/50',
    dotColor: 'bg-red-500',
    activeGlow: 'ring-2 ring-red-500 shadow-lg shadow-red-950/80 animate-pulse',
    icon: ShieldAlert,
    expectedMoisture: '96.0%',
    expectedRain: '92 mm/h',
    expectedTilt: '38.4°',
    expectedFos: '< 0.70',
    summary: 'Imminent catastrophic slope collapse. Automated railway stoppage and evacuation active.',
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

  // Determine active state from either currentSihState or currentStage
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
    <div className="rounded-xl border border-cyan-800/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4 shadow-2xl space-y-4">
      {/* ── Top Header: SIH Judging Demo Controller + Honest Prototype Disclaimer ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950/90 border border-cyan-500/60 text-cyan-400 shrink-0 shadow-md shadow-cyan-950">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-black text-slate-100 uppercase tracking-wider">
                SIH 2026 Landslide Demo Mode Controller
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider animate-pulse">
                DEMO / SIMULATION MODE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              3–5 Minute controlled evaluation scenario suite. Generates realistic telemetry transitions, FoS degradation, and automated hazard alerts.
            </p>
          </div>
        </div>

        {/* PROMINENT MANDATORY DISCLAIMER */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono shrink-0">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold uppercase tracking-wider block text-[11px]">
              Controlled laboratory prototype demonstration
            </span>
            <span className="text-[10px] text-amber-400/80 font-sans">
              Miniature scale test-bed · Real-world hardware telemetry mode remains unaltered
            </span>
          </div>
        </div>
      </div>

      {/* ── 6 Controllable State Buttons (The SIH Demo Controller) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              Trigger Demonstration States (Click any state to test):
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold">
            CURRENT STATE: [{activeStateConfig.label}]
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
                  "p-2.5 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group focus:outline-none",
                  isActive
                    ? `${s.riskColor} ${s.activeGlow}`
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 opacity-80 hover:opacity-100"
                )}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={clsx("w-2 h-2 rounded-full", s.dotColor, isActive && "animate-ping")} />
                    <span className={clsx(
                      "text-[9px] font-mono font-bold px-1 rounded uppercase",
                      s.riskLevel === 'CRITICAL' ? 'bg-red-950 text-red-300' :
                      s.riskLevel === 'HIGH' ? 'bg-orange-950 text-orange-300' :
                      s.riskLevel === 'MODERATE' ? 'bg-amber-950 text-amber-300' :
                      'bg-emerald-950 text-emerald-300'
                    )}>
                      {s.riskLevel}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-black text-slate-100 tracking-wide mt-1">
                    [ {s.label} ]
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans leading-tight mt-0.5 truncate">
                    {s.sublabel}
                  </div>
                </div>

                {/* Metrics Preview */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 text-[9px] font-mono grid grid-cols-2 gap-0.5 text-slate-400">
                  <div>M: <strong className="text-slate-200">{s.expectedMoisture}</strong></div>
                  <div>R: <strong className="text-slate-200">{s.expectedRain}</strong></div>
                  <div>T: <strong className="text-slate-200">{s.expectedTilt}</strong></div>
                  <div>FoS: <strong className="text-slate-200">{s.expectedFos}</strong></div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="mt-2 text-center py-0.5 rounded bg-slate-950 text-[9px] font-mono font-bold text-cyan-300 border border-cyan-800/80 shadow-inner">
                    ● ACTIVE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Active Physics & ML Engine Response Strip ── */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center font-mono">
        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Soil Moisture</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">
            {reading.soil_moisture_pct.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500">Pore Saturation</div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Rainfall Intensity</div>
          <div className="text-sm font-bold text-sky-400 mt-0.5">
            {reading.rainfall_pct.toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-500">{reading.rainfall_24h_mm.toFixed(1)} mm/24h</div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Slope Dip (Tilt)</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5">
            {reading.tilt_angle.toFixed(2)}°
          </div>
          <div className="text-[9px] text-slate-500">MPU6050 3D Vector</div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Tilt Creep Rate</div>
          <div className={clsx("text-sm font-bold mt-0.5", Math.abs(reading.tilt_rate) > 0.05 ? "text-red-400" : "text-slate-200")}>
            {reading.tilt_rate >= 0 ? `+${reading.tilt_rate.toFixed(3)}` : reading.tilt_rate.toFixed(3)}°/m
          </div>
          <div className="text-[9px] text-slate-500">Shear Strain</div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Factor of Safety</div>
          <div className={clsx(
            "text-sm font-bold mt-0.5",
            risk.fos_estimate < 1.0 ? "text-red-400 font-black animate-pulse" :
            risk.fos_estimate < 1.3 ? "text-orange-400" : "text-emerald-400"
          )}>
            {risk.fos_estimate.toFixed(2)}
          </div>
          <div className="text-[9px] text-slate-500">
            {risk.fos_estimate < 1.0 ? "FAILURE (FoS<1)" : "Limit Equilibrium"}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">XGBoost Risk Score</div>
          <div className={clsx(
            "text-sm font-bold mt-0.5",
            risk.risk_level === 'CRITICAL' ? "text-red-400 font-black" :
            risk.risk_level === 'HIGH' ? "text-orange-400" :
            risk.risk_level === 'MODERATE' ? "text-amber-400" : "text-emerald-400"
          )}>
            {(risk.risk_score * 100).toFixed(0)}%
          </div>
          <div className="text-[9px] text-slate-500">{risk.confidence ? `${(risk.confidence * 100).toFixed(0)}% Certain` : 'Gray-Box Model'}</div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-2 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-center items-center">
          <div className="text-[10px] text-slate-400 uppercase">Hazard Level</div>
          <span className={clsx(
            "font-mono font-black text-xs uppercase px-2 py-0.5 rounded mt-0.5",
            risk.risk_level === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800 animate-pulse' :
            risk.risk_level === 'HIGH' ? 'bg-orange-950 text-orange-300 border border-orange-800' :
            risk.risk_level === 'MODERATE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
            'bg-emerald-950 text-emerald-300 border border-emerald-800'
          )}>
            {risk.risk_level}
          </span>
          <div className="text-[9px] text-slate-500 mt-0.5">{activeStateConfig.badge}</div>
        </div>
      </div>

      {/* ── Control Bar + Milestone Event Timeline Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* Left: Interactive Demo Actions */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider mb-1">
              Automated Judging Sequence
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Runs the 6-state progression automatically (`NORMAL → RAIN → HEAVY RAIN → SATURATION → SLOPE MOVEMENT → CRITICAL`).
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleStartAuto}
              disabled={isAutoRunning}
              className={clsx(
                "w-full py-2 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all",
                isAutoRunning
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse cursor-not-allowed"
                  : "bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md shadow-cyan-900/40"
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isAutoRunning ? `Running 6-State Demo Sequence (${countdown}s)...` : 'Run 3–5 Min SIH Demo Sequence'}</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const prevIdx = Math.max(0, stateIndex - 1);
                  handleStateClick(SIH_STATES[prevIdx].key);
                }}
                disabled={stateIndex <= 0}
                className="flex-1 py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 font-mono text-xs font-medium"
              >
                ◀ Prev State
              </button>
              <button
                onClick={() => {
                  const nextIdx = Math.min(SIH_STATES.length - 1, stateIndex + 1);
                  handleStateClick(SIH_STATES[nextIdx].key);
                }}
                disabled={stateIndex >= SIH_STATES.length - 1}
                className="flex-1 py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-300 font-mono text-xs font-medium"
              >
                Next State ▶
              </button>
              <button
                onClick={onReset}
                className="py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200"
                title="Reset to NORMAL"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right (2 Cols): Event Timeline Milestones */}
        <div className="lg:col-span-2 bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                  Event Timeline & Milestone Log
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                CHRONOLOGICAL MILESTONE LOG
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
                      "p-2 rounded border text-xs flex flex-col justify-between transition-all",
                      isTriggered
                        ? isCurrent
                          ? "bg-cyan-950/50 border-cyan-500 text-slate-100 shadow-sm"
                          : "bg-slate-900/80 border-slate-700 text-slate-300"
                        : "bg-slate-950/40 border-slate-900 text-slate-600 opacity-60"
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
            <span>Infinite Slope Physics Engine (Bishop/Fellenius FoS) + XGBoost Ensemble</span>
            <span className="text-cyan-400 font-medium uppercase">STATE {stateIndex + 1} OF 6: [{activeStateConfig.label}]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
