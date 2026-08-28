import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity, Gauge } from 'lucide-react';
import { RiskAssessment, RiskLevel } from '../../types';
import clsx from 'clsx';
import { RISK_GLOW_CLASSES } from '../../types';

interface Props {
  risk: RiskAssessment | null;
}

export default function RiskCard({ risk }: Props) {
  if (!risk) {
    return (
      <div className="card h-full min-h-[320px] flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-8 h-8 text-slate-600 animate-pulse mb-3" />
        <span className="text-sm font-medium text-slate-400 font-mono">Awaiting AI Telemetry Ingestion...</span>
        <span className="text-xs text-slate-600 mt-1 font-mono">Initializing gray-box risk pipeline</span>
      </div>
    );
  }

  const scorePct = Math.round(risk.risk_score * 100);
  const glowClass = RISK_GLOW_CLASSES[risk.risk_level] || '';

  const levelConfig: Record<RiskLevel, {
    label: string;
    action: string;
    colorText: string;
    colorBg: string;
    colorBorder: string;
    icon: typeof ShieldCheck;
    badgeClass: string;
  }> = {
    LOW: {
      label: 'NOMINAL STABILITY',
      action: 'Standard Routine Surveillance — Slope shear within safe limits',
      colorText: 'text-emerald-400',
      colorBg: 'bg-emerald-950/40',
      colorBorder: 'border-emerald-700/60',
      icon: ShieldCheck,
      badgeClass: 'badge-low',
    },
    MODERATE: {
      label: 'ELEVATED SURVEILLANCE',
      action: 'Advisory Alert — Precipitation accumulation & pore pressure rising',
      colorText: 'text-amber-400',
      colorBg: 'bg-amber-950/40',
      colorBorder: 'border-amber-700/60',
      icon: Shield,
      badgeClass: 'badge-moderate',
    },
    HIGH: {
      label: 'HIGH WARNING TIER',
      action: 'Warning Active — Significant angular creep & matrix saturation',
      colorText: 'text-orange-400',
      colorBg: 'bg-orange-950/40',
      colorBorder: 'border-orange-700/60',
      icon: AlertTriangle,
      badgeClass: 'badge-high',
    },
    CRITICAL: {
      label: 'CRITICAL EMERGENCY',
      action: 'Emergency Siren Active — Limit equilibrium failure imminent (FoS < 1.0)',
      colorText: 'text-red-400',
      colorBg: 'bg-red-950/50',
      colorBorder: 'border-red-700/80',
      icon: ShieldAlert,
      badgeClass: 'badge-critical',
    },
  };

  const config = levelConfig[risk.risk_level];
  const LevelIcon = config.icon;
  const TrendIcon = risk.trend === 'rising' ? TrendingUp : risk.trend === 'falling' ? TrendingDown : Minus;

  const fos = risk.fos_estimate;
  const fosStatus = fos < 1.0 ? { label: 'FAILURE (FoS < 1.0)', color: 'text-red-400' }
    : fos < 1.3 ? { label: 'WARNING (1.0–1.3)', color: 'text-amber-400' }
    : { label: 'STABLE (> 1.3)', color: 'text-emerald-400' };

  return (
    <div className={clsx("card h-full flex flex-col justify-between border-2 relative overflow-hidden transition-all duration-300", glowClass)}>
      {/* Top Header */}
      <div className="card-header border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelIcon className={clsx("w-4 h-4", config.colorText)} />
          <span className="text-slate-200">Hazard Assessment Engine</span>
        </div>
        <span className={clsx("badge", config.badgeClass)}>
          {risk.risk_level}
        </span>
      </div>

      <div className="card-body flex-1 flex flex-col justify-between py-4 space-y-3">
        {/* Risk Percentage Display */}
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={clsx("text-6xl font-black font-mono tracking-tight", config.colorText)}>
                {scorePct}
              </span>
              <span className={clsx("text-2xl font-bold font-mono", config.colorText)}>%</span>
            </div>
            <div className="text-xs font-bold text-slate-300 font-mono tracking-wide mt-0.5">
              {config.label}
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="text-right space-y-1.5 font-mono">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-xs">
              <TrendIcon className={clsx("w-3.5 h-3.5", risk.trend === 'rising' ? 'text-red-400' : risk.trend === 'falling' ? 'text-emerald-400' : 'text-slate-400')} />
              <span className="text-slate-300 font-bold uppercase">{risk.trend}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Confidence: <span className="font-bold text-slate-200">{(risk.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 4-Segment Hazard Level Meter */}
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-1.5 h-2.5">
            <div className={clsx(
              "rounded-full transition-all duration-300",
              risk.risk_level === 'LOW' ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 ring-1 ring-emerald-400" : "bg-emerald-950/60 border border-emerald-900/40"
            )} />
            <div className={clsx(
              "rounded-full transition-all duration-300",
              risk.risk_level === 'MODERATE' ? "bg-amber-500 shadow-sm shadow-amber-500/50 ring-1 ring-amber-400" : "bg-amber-950/60 border border-amber-900/40"
            )} />
            <div className={clsx(
              "rounded-full transition-all duration-300",
              risk.risk_level === 'HIGH' ? "bg-orange-500 shadow-sm shadow-orange-500/50 ring-1 ring-orange-400" : "bg-orange-950/60 border border-orange-900/40"
            )} />
            <div className={clsx(
              "rounded-full transition-all duration-300",
              risk.risk_level === 'CRITICAL' ? "bg-red-500 shadow-sm shadow-red-500/50 ring-1 ring-red-400" : "bg-red-950/60 border border-red-900/40"
            )} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            <span className={risk.risk_level === 'LOW' ? 'text-emerald-400 font-bold' : ''}>NOMINAL (0-25)</span>
            <span className={risk.risk_level === 'MODERATE' ? 'text-amber-400 font-bold' : ''}>ADVISORY (25-50)</span>
            <span className={risk.risk_level === 'HIGH' ? 'text-orange-400 font-bold' : ''}>WARNING (50-75)</span>
            <span className={risk.risk_level === 'CRITICAL' ? 'text-red-400 font-bold' : ''}>CRITICAL (75-100)</span>
          </div>
        </div>

        {/* Geotechnical Stability Indicator (FoS) */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 font-mono">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Factor of Safety (FoS)
            </span>
            <span className={clsx("font-bold text-base", fosStatus.color)}>
              {fos.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
            <span>Infinite slope limit equilibrium</span>
            <span className={clsx("font-bold", fosStatus.color)}>{fosStatus.label}</span>
          </div>
        </div>

        {/* Action / Operational Advisory Recommendation */}
        <div className={clsx("px-3 py-2 rounded-lg border text-xs font-mono leading-tight", config.colorBg, config.colorBorder, config.colorText)}>
          <span className="font-bold uppercase tracking-wider block text-[10px] opacity-80 mb-0.5">Response Protocol:</span>
          {config.action}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
        <span>Engine: <span className="font-bold text-slate-200">XGBoost v0.2-Physics</span></span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Hybrid Physics-ML Calibrated
        </span>
      </div>
    </div>
  );
}
