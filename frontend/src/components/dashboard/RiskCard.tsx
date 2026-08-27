import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
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
        <span className="text-sm font-medium text-slate-400">Awaiting AI Telemetry Ingestion...</span>
        <span className="text-xs text-slate-600 mt-1">Initializing gray-box risk pipeline</span>
      </div>
    );
  }

  const scorePct = Math.round(risk.risk_score * 100);
  const glowClass = RISK_GLOW_CLASSES[risk.risk_level] || '';

  // Config mapping for risk levels
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
      label: 'LOW HAZARD',
      action: 'Normal Routine Monitoring — Slopes nominal',
      colorText: 'text-emerald-400',
      colorBg: 'bg-emerald-950/40',
      colorBorder: 'border-emerald-700/60',
      icon: ShieldCheck,
      badgeClass: 'badge-low',
    },
    MODERATE: {
      label: 'MODERATE HAZARD',
      action: 'Advisory Alert — Elevated pore pressure / rainfall',
      colorText: 'text-amber-400',
      colorBg: 'bg-amber-950/40',
      colorBorder: 'border-amber-700/60',
      icon: Shield,
      badgeClass: 'badge-moderate',
    },
    HIGH: {
      label: 'HIGH HAZARD',
      action: 'Warning Active — Significant displacement & saturation',
      colorText: 'text-orange-400',
      colorBg: 'bg-orange-950/40',
      colorBorder: 'border-orange-700/60',
      icon: AlertTriangle,
      badgeClass: 'badge-high',
    },
    CRITICAL: {
      label: 'CRITICAL HAZARD',
      action: 'Evacuation Warning — Slope failure imminent (FoS < 1.0)',
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

  // FoS stability status
  const fos = risk.fos_estimate;
  const fosStatus = fos < 1.0 ? { label: 'FAILURE (FoS < 1.0)', color: 'text-red-400' }
    : fos < 1.3 ? { label: 'WARNING (1.0–1.3)', color: 'text-amber-400' }
    : { label: 'STABLE (> 1.3)', color: 'text-emerald-400' };

  return (
    <div className={clsx("card h-full flex flex-col justify-between border-2 relative overflow-hidden transition-all duration-300", glowClass)}>
      {/* Top Header */}
      <div className="card-header border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelIcon className={clsx("w-4 h-4", config.colorText)} />
          <span className="text-slate-200">Early Warning Assessment</span>
        </div>
        <span className={clsx("badge", config.badgeClass)}>
          {risk.risk_level}
        </span>
      </div>

      <div className="card-body flex-1 flex flex-col justify-between py-4">
        {/* Risk Percentage Display */}
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={clsx("text-6xl font-black font-mono tracking-tight", config.colorText)}>
                {scorePct}
              </span>
              <span className={clsx("text-2xl font-bold font-mono", config.colorText)}>%</span>
            </div>
            <div className="text-xs font-semibold text-slate-300 tracking-wide mt-0.5">
              {config.label}
            </div>
          </div>

          {/* Quick Metrics Column */}
          <div className="text-right space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-xs">
              <TrendIcon className={clsx("w-3.5 h-3.5", risk.trend === 'rising' ? 'text-red-400' : risk.trend === 'falling' ? 'text-emerald-400' : 'text-slate-400')} />
              <span className="font-mono text-slate-300 uppercase">{risk.trend}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Confidence: <span className="font-mono font-medium text-slate-200">{(risk.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* 4-Segment Hazard Level Meter */}
        <div className="my-3 space-y-1">
          <div className="grid grid-cols-4 gap-1.5 h-2.5">
            <div className={clsx(
              "rounded-sm transition-all duration-300",
              risk.risk_level === 'LOW' ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 ring-1 ring-emerald-400" : "bg-emerald-950/60 border border-emerald-900/40"
            )} />
            <div className={clsx(
              "rounded-sm transition-all duration-300",
              risk.risk_level === 'MODERATE' ? "bg-amber-500 shadow-sm shadow-amber-500/50 ring-1 ring-amber-400" : "bg-amber-950/60 border border-amber-900/40"
            )} />
            <div className={clsx(
              "rounded-sm transition-all duration-300",
              risk.risk_level === 'HIGH' ? "bg-orange-500 shadow-sm shadow-orange-500/50 ring-1 ring-orange-400" : "bg-orange-950/60 border border-orange-900/40"
            )} />
            <div className={clsx(
              "rounded-sm transition-all duration-300",
              risk.risk_level === 'CRITICAL' ? "bg-red-500 shadow-sm shadow-red-500/50 ring-1 ring-red-400" : "bg-red-950/60 border border-red-900/40"
            )} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
            <span className={risk.risk_level === 'LOW' ? 'text-emerald-400 font-bold' : ''}>LOW (0-25)</span>
            <span className={risk.risk_level === 'MODERATE' ? 'text-amber-400 font-bold' : ''}>MOD (25-50)</span>
            <span className={risk.risk_level === 'HIGH' ? 'text-orange-400 font-bold' : ''}>HIGH (50-75)</span>
            <span className={risk.risk_level === 'CRITICAL' ? 'text-red-400 font-bold' : ''}>CRIT (75-100)</span>
          </div>
        </div>

        {/* Geotechnical Stability Indicator (FoS) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded p-2.5 my-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              Factor of Safety (FoS)
            </span>
            <span className={clsx("font-mono font-bold text-sm", fosStatus.color)}>
              {fos.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
            <span>Infinite slope limit equilibrium</span>
            <span className={clsx("font-semibold", fosStatus.color)}>{fosStatus.label}</span>
          </div>
        </div>

        {/* Action / Operational Advisory Recommendation */}
        <div className={clsx("px-2.5 py-1.5 rounded border text-[11px] font-medium leading-tight", config.colorBg, config.colorBorder, config.colorText)}>
          <span className="font-bold uppercase tracking-wider block text-[10px] opacity-80 mb-0.5">Recommended Action:</span>
          {config.action}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-3.5 py-2 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
        <span>Model: <span className="font-mono text-slate-300">{risk.model_version}</span></span>
        <span className="text-amber-400/90 font-medium">⚠️ Prototype AI Model</span>
      </div>
    </div>
  );
}
