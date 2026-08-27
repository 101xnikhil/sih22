import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine 
} from 'recharts';
import { ChartDataPoint } from '../../types';
import clsx from 'clsx';
import { formatTimeShort } from '../../utils/formatters';

interface Props {
  data: ChartDataPoint[];
}

export default function LiveCharts({ data }: Props) {
  const [activeTab, setActiveTab] = useState<'Moisture' | 'Tilt' | 'Rainfall' | 'Risk'>('Moisture');

  const latest = data.length > 0 ? data[data.length - 1] : null;

  const tabs = [
    { id: 'Moisture', label: 'Soil Moisture', value: latest ? `${latest.soil_moisture.toFixed(1)}%` : '--' },
    { id: 'Tilt', label: 'Slope & Tilt Rate', value: latest ? `${latest.tilt_angle.toFixed(1)}°` : '--' },
    { id: 'Rainfall', label: 'Rainfall (24h)', value: latest ? `${latest.rainfall.toFixed(1)}mm` : '--' },
    { id: 'Risk', label: 'Risk Score & FoS', value: latest ? `${(latest.risk_score * 100).toFixed(0)}%` : '--' },
  ] as const;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded shadow-xl text-xs font-mono">
          <div className="text-slate-400 border-b border-slate-800 pb-1 mb-1.5 flex justify-between gap-4">
            <span>TIMESTAMP</span>
            <span className="text-slate-200">{formatTimeShort(label)}</span>
          </div>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
                  {p.name}:
                </span>
                <span className="font-bold text-slate-100">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'Moisture':
        return (
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Saturation Limit (80%)', fill: '#ef4444', fontSize: 9, position: 'right' }} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Elevated Threshold', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
            <Line type="monotone" dataKey="soil_moisture" name="VWC Moisture" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        );
      case 'Tilt':
        return (
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="angle" stroke="#10b981" tick={{ fill: '#10b981', fontSize: 10 }} tickFormatter={(v) => `${v}°`} />
            <YAxis yAxisId="rate" orientation="right" stroke="#f59e0b" tick={{ fill: '#f59e0b', fontSize: 10 }} tickFormatter={(v) => `${v}°/m`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="angle" y={30} stroke="#ef4444" strokeDasharray="3 3" />
            <Line yAxisId="angle" type="monotone" dataKey="tilt_angle" name="Slope Angle (°)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="rate" type="monotone" dataKey="tilt_rate" name="Displacement Rate (°/m)" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        );
      case 'Rainfall':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v}mm`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Heavy Rain Warning (50mm)', fill: '#ef4444', fontSize: 9 }} />
            <Area type="monotone" dataKey="rainfall" name="24h Accumulation" stroke="#3b82f6" fillOpacity={0.25} fill="#3b82f6" isAnimationActive={false} />
          </AreaChart>
        );
      case 'Risk':
        return (
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={formatTimeShort} stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
            <YAxis yAxisId="risk" domain={[0, 1]} stroke="#f97316" tick={{ fill: '#f97316', fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <YAxis yAxisId="fos" orientation="right" domain={[0, 3]} stroke="#10b981" tick={{ fill: '#10b981', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(1)}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="fos" y={1.0} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: 'FoS = 1.0 (Critical Equilibrium)', fill: '#ef4444', fontSize: 9 }} />
            <ReferenceLine yAxisId="risk" y={0.75} stroke="#ef4444" strokeDasharray="2 2" />
            <Line yAxisId="risk" type="monotone" dataKey="risk_score" name="Risk Score" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="fos" type="monotone" dataKey="fos" name="Factor of Safety" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        );
    }
  };

  return (
    <div className="card flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="card-header border-b border-slate-800 flex items-center justify-between p-0 px-2 overflow-x-auto">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                "px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5",
                activeTab === tab.id
                  ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              )}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-slate-800/80 text-slate-300">
                {tab.value}
              </span>
            </button>
          ))}
        </div>
        <div className="text-[10px] font-mono text-slate-500 pr-2 hidden sm:block">
          STREAM BUFFER ({data.length} PTS)
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="card-body flex-grow p-3 min-h-[280px]">
        <ResponsiveContainer width="100%" height={280}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
