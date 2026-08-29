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
        <Cpu className="w-6 h-6 animate-pulse mb-2 text-slate-400" />
        <span className="text-xs">Awaiting AI explainability inference...</span>
      </div>
    );
  }

  // Sort factors by absolute impact magnitude
  const sortedShap = [...(risk.shap_values || [])].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  const top3 = sortedShap.slice(0, 3);

  // Helper to convert technical contributions to clear plain language
  const formatHumanImpact = (displayName: string, contribution: number, value: number) => {
    const isRiskDriver = contribution > 0;
    
    if (displayName.toLowerCase().includes('factor of safety')) {
      if (value < 1.0) {
        return { text: 'decreasing stability (failure threshold reached)', isNegativeForSafety: true };
      } else if (value < 1.3) {
        return { text: 'decreasing stability (approaching threshold)', isNegativeForSafety: true };
      } else {
        return { text: 'providing stability margin', isNegativeForSafety: false };
      }
    }

    if (displayName.toLowerCase().includes('moisture')) {
      return isRiskDriver
        ? { text: 'increasing risk (pore pressure saturation)', isNegativeForSafety: true }
        : { text: 'stabilizing slope (low moisture saturation)', isNegativeForSafety: false };
    }

    if (displayName.toLowerCase().includes('rain')) {
      return isRiskDriver
        ? { text: 'increasing risk (precipitation load)', isNegativeForSafety: true }
        : { text: 'stabilizing (dry condition)', isNegativeForSafety: false };
    }

    if (displayName.toLowerCase().includes('tilt') || displayName.toLowerCase().includes('creep') || displayName.toLowerCase().includes('angle')) {
      return isRiskDriver
        ? { text: 'increasing risk (accelerating creep velocity)', isNegativeForSafety: true }
        : { text: 'within nominal angle bounds', isNegativeForSafety: false };
    }

    return isRiskDriver 
      ? { text: 'increasing risk', isNegativeForSafety: true }
      : { text: 'stabilizing factor', isNegativeForSafety: false };
  };

  return (
    <div className="card h-full flex flex-col justify-between">
      {/* Header */}
      <div className="card-header border-b border-[#f1f5f9] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-800">
          <Brain className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-xs uppercase tracking-wider font-sans">
            AI Hazard Explainability (SHAP)
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
          SHAP Analysis
        </span>
      </div>

      <div className="card-body flex-1 flex flex-col justify-between space-y-3.5">
        {/* Core Question Header */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Why is the current risk {risk.risk_level}?</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-sans">
            Top geotechnical factors identified by XGBoost & Bishop limit equilibrium model:
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
                  "p-2.5 rounded-xl border text-xs transition-all",
                  isDriver 
                    ? "bg-red-50/60 border-red-100 text-slate-800" 
                    : "bg-emerald-50/60 border-emerald-100 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-slate-400">{idx + 1}.</span>
                    <span className="text-slate-900">{shap.display_name}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({shap.value.toFixed(1)})
                    </span>
                  </div>
                  <span className={clsx("text-[11px] font-bold flex items-center gap-0.5", isDriver ? "text-red-600" : "text-emerald-600")}>
                    {isDriver ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    {isDriver ? `+${shap.contribution.toFixed(2)}` : shap.contribution.toFixed(2)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-sans mt-0.5 ml-4">
                  — <span className={isDriver ? "text-red-700 font-medium" : "text-emerald-700 font-medium"}>{humanExp.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prototype Validation Note */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-[10.5px] text-amber-800 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Edge AI Model</strong> — Gray-box physics coupling with 100% offline SHAP TreeExplainer running on local edge gateway.
          </span>
        </div>
      </div>

      {/* Footer Model Tag */}
      <div className="px-4 py-2 bg-slate-50 border-t border-[#f1f5f9] flex justify-between items-center text-[10px] text-slate-500 font-sans">
        <span>XGBoost + SHAP TreeExplainer</span>
        <span className="text-blue-600 font-semibold">Confidence: {Math.round(risk.confidence * 100)}%</span>
      </div>
    </div>
  );
}
