import React from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import { getGenerator } from '../mock/generator';
import LoadingState from '../components/common/LoadingState';
import PrototypeLabel from '../components/common/PrototypeLabel';
import { 
  LineChart, Line, AreaChart, Area, ComposedChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { RISK_COLORS } from '../types';
import { formatTimeShort } from '../utils/formatters';
import { BarChart3, TrendingUp, Cpu, Table, Activity } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { state } = useMockTelemetry();
  
  if (!state) {
    return <LoadingState message="Computing time-series analytics..." />;
  }
  
  const chartData = getGenerator().getChartData();
  const { currentRisk, readingHistory } = state;

  // Compute summary statistics
  const calcStats = (arr: number[]) => {
    if (arr.length === 0) return { min: 0, max: 0, avg: 0, cur: 0 };
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    const cur = arr[arr.length - 1];
    return { min, max, avg, cur };
  };

  const moistureStats = calcStats(readingHistory.map(r => r.soil_moisture_pct));
  const rainStats = calcStats(readingHistory.map(r => r.rainfall_24h_mm));
  const tiltStats = calcStats(readingHistory.map(r => r.tilt_angle));
  const tiltRateStats = calcStats(readingHistory.map(r => r.tilt_rate));
  const riskStats = calcStats(state.riskHistory.map(r => r.risk_score * 100));
  const fosStats = calcStats(state.riskHistory.map(r => r.fos_estimate));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold font-mono text-slate-100">Telemetry Analytics & AI Explainability</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Time-series telemetry decomposition, geotechnical limit equilibrium curves, and SHAP feature attributions.
          </p>
        </div>
        <PrototypeLabel text="Synthetic Data Model Diagnostics — SIH 2026" />
      </div>

      {/* Summary Statistics Table */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <span>Telemetry Statistics Summary (Buffer: {readingHistory.length} Samples)</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">10s TELEMETRY INTERVAL</span>
        </div>
        <div className="card-body p-0 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Metric / Channel</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4">Current</th>
                <th className="py-2.5 px-4">Minimum</th>
                <th className="py-2.5 px-4">Maximum</th>
                <th className="py-2.5 px-4">Mean (μ)</th>
                <th className="py-2.5 px-4">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">Volumetric Soil Moisture</td>
                <td className="py-2.5 px-4 text-slate-400">%</td>
                <td className="py-2.5 px-4 font-bold text-cyan-400">{moistureStats.cur.toFixed(1)}%</td>
                <td className="py-2.5 px-4 text-slate-300">{moistureStats.min.toFixed(1)}%</td>
                <td className="py-2.5 px-4 text-slate-300">{moistureStats.max.toFixed(1)}%</td>
                <td className="py-2.5 px-4 text-slate-300">{moistureStats.avg.toFixed(1)}%</td>
                <td className="py-2.5 px-4">
                  <span className={moistureStats.cur > 80 ? "badge badge-critical" : moistureStats.cur > 50 ? "badge badge-moderate" : "badge badge-low"}>
                    {moistureStats.cur > 80 ? "Critical" : moistureStats.cur > 50 ? "Elevated" : "Nominal"}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">24h Rainfall Accumulation</td>
                <td className="py-2.5 px-4 text-slate-400">mm</td>
                <td className="py-2.5 px-4 font-bold text-blue-400">{rainStats.cur.toFixed(1)} mm</td>
                <td className="py-2.5 px-4 text-slate-300">{rainStats.min.toFixed(1)} mm</td>
                <td className="py-2.5 px-4 text-slate-300">{rainStats.max.toFixed(1)} mm</td>
                <td className="py-2.5 px-4 text-slate-300">{rainStats.avg.toFixed(1)} mm</td>
                <td className="py-2.5 px-4">
                  <span className={rainStats.cur > 50 ? "badge badge-critical" : "badge badge-low"}>
                    {rainStats.cur > 50 ? "Heavy" : "Normal"}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">Slope Dip Angle</td>
                <td className="py-2.5 px-4 text-slate-400">°</td>
                <td className="py-2.5 px-4 font-bold text-emerald-400">{tiltStats.cur.toFixed(2)}°</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltStats.min.toFixed(2)}°</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltStats.max.toFixed(2)}°</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltStats.avg.toFixed(2)}°</td>
                <td className="py-2.5 px-4"><span className="badge badge-low">Active</span></td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">Tilt Displacement Rate</td>
                <td className="py-2.5 px-4 text-slate-400">°/min</td>
                <td className="py-2.5 px-4 font-bold text-amber-400">{tiltRateStats.cur.toFixed(3)}</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltRateStats.min.toFixed(3)}</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltRateStats.max.toFixed(3)}</td>
                <td className="py-2.5 px-4 text-slate-300">{tiltRateStats.avg.toFixed(3)}</td>
                <td className="py-2.5 px-4">
                  <span className={Math.abs(tiltRateStats.cur) > 0.05 ? "badge badge-high" : "badge badge-low"}>
                    {Math.abs(tiltRateStats.cur) > 0.05 ? "Creep Detected" : "Stable"}
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-200">Factor of Safety (FoS)</td>
                <td className="py-2.5 px-4 text-slate-400">ratio</td>
                <td className="py-2.5 px-4 font-bold text-slate-100">{fosStats.cur.toFixed(2)}</td>
                <td className="py-2.5 px-4 text-slate-300">{fosStats.min.toFixed(2)}</td>
                <td className="py-2.5 px-4 text-slate-300">{fosStats.max.toFixed(2)}</td>
                <td className="py-2.5 px-4 text-slate-300">{fosStats.avg.toFixed(2)}</td>
                <td className="py-2.5 px-4">
                  <span className={fosStats.cur < 1.0 ? "badge badge-critical" : fosStats.cur < 1.3 ? "badge badge-high" : "badge badge-low"}>
                    {fosStats.cur < 1.0 ? "Failure Imminent" : fosStats.cur < 1.3 ? "Warning" : "Stable"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Soil Moisture & Rainfall Time Series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Soil Moisture Chart */}
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Soil Moisture Time-Series & Thresholds
            </h3>
            <span className="font-mono text-xs text-cyan-400 font-bold">{moistureStats.cur.toFixed(1)}%</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Soil Moisture']}
                />
                <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (80%)', fill: '#ef4444', fontSize: 9 }} />
                <Line type="monotone" dataKey="soil_moisture" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rainfall Accumulation */}
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              24-Hour Precipitation Accumulation (mm)
            </h3>
            <span className="font-mono text-xs text-blue-400 font-bold">{rainStats.cur.toFixed(1)} mm</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `${val}mm`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [`${value.toFixed(1)} mm`, 'Rainfall']}
                />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Heavy Threshold (50mm)', fill: '#ef4444', fontSize: 9 }} />
                <Area type="monotone" dataKey="rainfall" fill="#3b82f6" stroke="#2563eb" fillOpacity={0.25} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Hazard Risk Probability vs. Geotechnical Factor of Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Risk Probability Trend */}
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              AI Hazard Risk Score Probability Trajectory
            </h3>
            <span className="font-mono text-xs text-orange-400 font-bold">{(currentRisk.risk_score * 100).toFixed(0)}%</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 1]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Risk Score']}
                />
                <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (0.75)', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine y={0.50} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'High (0.50)', fill: '#f97316', fontSize: 9 }} />
                <Line type="monotone" dataKey="risk_score" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Factor of Safety (FoS) */}
        <div className="card p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Factor of Safety ($FoS$) Infinite Slope Limit Equilibrium
            </h3>
            <span className="font-mono text-xs text-emerald-400 font-bold">{currentRisk.fos_estimate.toFixed(2)}</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 3]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                  formatter={(value: number) => [value.toFixed(2), 'FoS Ratio']}
                />
                <ReferenceLine y={1.0} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: 'Limit Equilibrium (1.0)', fill: '#ef4444', fontSize: 9 }} />
                <ReferenceLine y={1.3} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Safety Target (1.3)', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="fos" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SHAP Feature Importance Decomposition */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>SHAP Global Feature Attribution Weights</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">TreeExplainer Kernel</span>
        </div>
        <div className="card-body h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart layout="vertical" data={currentRisk.shap_values} margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis dataKey="display_name" type="category" stroke="#475569" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(value: number) => [value > 0 ? `+${value.toFixed(3)}` : value.toFixed(3), 'SHAP Impact']}
              />
              <ReferenceLine x={0} stroke="#64748b" />
              <Bar dataKey="contribution" fill="#0ea5e9" barSize={16} radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {currentRisk.shap_values.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.contribution > 0 ? '#f97316' : '#10b981'} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
