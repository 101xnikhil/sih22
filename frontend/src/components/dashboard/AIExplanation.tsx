import React from 'react';
import { Brain, Cpu, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { RiskAssessment } from '../../types';
import clsx from 'clsx';

interface Props {
  risk: RiskAssessment | null;
}

export default function AIExplanation({ risk }: Props) {
  if (!risk) {
    return (
      <div className="card h-full min-h-[280px] flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <Cpu className="w-6 h-6 animate-pulse mb-2 text-slate-600" />
        <span className="text-xs">Awaiting AI explainability inference...</span>
      </div>
    );
  }

  // Sort factors by absolute impact magnitude
  const sortedShap = [...(risk.shap_values || [])].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  const top3 = sortedShap.slice(0, 3);
  const maxContribution = Math.max(...sortedShap.map(s => Math.abs(s.contribution)), 0.05);

  const riskColor = risk.risk_level === 'CRITICAL' ? 'text-red-400' 
    : risk.risk_level === 'HIGH' ? 'text-orange-400' 
    : risk.risk_level === 'MODERATE' ? 'text-amber-400' 
    : 'text-emerald-400';

  // Helper to convert technical contributions to clear plain language for judges
  const formatHumanImpact = (displayName: string, contribution: number, value: number) => {
    const isRiskDriver = contribution > 0;
    
    if (displayName.toLowerCase().includes('factor of safety')) {
      if (value < 1.0) {
        return { text: 'decreasing stability (failure limit exceeded)', isNegativeForSafety: true };
      } else if (value < 1.3) {
        return { text: 'decreasing stability (approaching threshold)', isNegativeForSafety: true };
      } else {
        return { text: 'providing stability margin', isNegativeForSafety: false };
      }
    }

    if (displayName.toLowerCase().includes('moisture')) {
      return isRiskDriver
        ? { text: 'increasing risk (pore pressure saturation)', isNegativeForSafety: true }
        : { text: 'stabilizing slope (low saturation)', isNegativeForSafety: false };
    }

    if (displayName.toLowerCase().includes('rain')) {
      return isRiskDriver
        ? { text: 'increasing risk (precipitation load)', isNegativeForSafety: true }
        : { text: 'stabilizing (dry conditions)', isNegativeForSafety: false };
    }

    if (displayName.toLowerCase().includes('tilt') || displayName.toLowerCase().includes('creep') || displayName.toLowerCase().includes('angle')) {
      return isRiskDriver
        ? { text: 'increasing risk (accelerating creep)', isNegativeForSafety: true }
        : { text: 'within nominal angle bounds', isNegativeForSafety: false };
    }

    return isRiskDriver 
      ? { text: 'increasing risk', isNegativeForSafety: true }
      : { text: 'stabilizing factor', isNegativeForSafety: false };
  };

  return (
    <div className="card h-full flex flex-col justify-between">
      {/* Header */}
      <div className="card-header border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-xs uppercase tracking-wider font-mono">
            AI Hazard Explainability
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800">
          SHAP Analysis
        </span>
      </div>

      <div className="card-body flex-1 flex flex-col justify-between space-y-3">
        {/* Core Question Header */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>WHY IS THE RISK {risk.risk_level}?</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-sans">
            Top factors identified by the physics-informed model driving current hazard level:
          </div>
        </div>

        {/* Top 3 Contributing Factors in plain human language */}
        <div className="space-y-2">
          {top3.map((shap, idx) => {
            const humanExp = formatHumanImpact(shap.display_name, shap.contribution, shap.value);
            const isDriver = shap.contribution > 0;

            return (
              <div 
                key={idx} 
                className={clsx(
                  "p-2 rounded-lg border text-xs transition-all",
                  isDriver 
                    ? "bg-red-950/20 border-red-900/40 text-slate-200" 
                    : "bg-emerald-950/20 border-emerald-900/40 text-slate-200"
                )}
              >
                <div className="flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-slate-500 font-sans">{idx + 1}.</span>
                    <span className="text-slate-100">{shap.display_name}</span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      ({shap.value.toFixed(1)})
                    </span>
                  </div>
                  <span className={clsx("text-[11px] font-bold flex items-center gap-0.5", isDriver ? "text-orange-400" : "text-emerald-400")}>
                    {isDriver ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {isDriver ? `+${shap.contribution.toFixed(2)}` : shap.contribution.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-sans mt-0.5 ml-4">
                  — <span className={isDriver ? "text-orange-300 font-medium" : "text-emerald-300 font-medium"}>{humanExp.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prototype Validation Note */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded p-2 text-[10px] text-amber-300/90 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong>Prototype model</strong> — requires field calibration & geotechnical borehole surveys before operational life-safety deployment.
          </span>
        </div>
      </div>

      {/* Footer Model Tag */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>XGBoost + SHAP TreeExplainer</span>
        <span className="text-cyan-400 font-semibold">CONFIDENCE: {Math.round(risk.confidence * 100)}%</span>
      </div>
    </div>
  );
}
