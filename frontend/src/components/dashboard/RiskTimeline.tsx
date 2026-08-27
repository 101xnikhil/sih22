import React from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, ReferenceLine } from 'recharts';
import { formatTimeShort } from '../../utils/formatters';

interface Props {
  data: { time: string; risk_score: number }[];
}

export default function RiskTimeline({ data }: Props) {
  const latestScore = data.length > 0 ? data[data.length - 1].risk_score : 0;
  const maxScore = data.length > 0 ? Math.max(...data.map(d => d.risk_score)) : 0;
  const minScore = data.length > 0 ? Math.min(...data.map(d => d.risk_score)) : 0;

  // Determine line & gradient colors based on latest risk score
  let color = "#10b981"; // LOW
  if (latestScore >= 0.75) color = "#ef4444"; // CRITICAL
  else if (latestScore >= 0.5) color = "#f97316"; // HIGH
  else if (latestScore >= 0.25) color = "#f59e0b"; // MODERATE

  return (
    <div className="card flex flex-col h-full justify-between">
      <div className="card-header border-b border-slate-800 flex items-center justify-between">
        <span className="text-slate-200">Risk Trajectory</span>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-400">PEAK: <strong className="text-slate-200">{(maxScore * 100).toFixed(0)}%</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">MIN: <strong className="text-slate-200">{(minScore * 100).toFixed(0)}%</strong></span>
        </div>
      </div>

      <div className="card-body p-2 flex-grow flex flex-col justify-center">
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="riskTimelineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 1]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 9 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const score = payload[0].value as number;
                    return (
                      <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded shadow-lg text-[10px] font-mono">
                        <span className="text-slate-400">Risk: </span>
                        <strong className="text-slate-100">{(score * 100).toFixed(1)}%</strong>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="2 2" />
              <Area type="monotone" dataKey="risk_score" stroke={color} strokeWidth={2} fill="url(#riskTimelineGrad)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
        <span>60-Tick Rolling Window</span>
        <span className="font-bold text-slate-200">NOW: {(latestScore * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
