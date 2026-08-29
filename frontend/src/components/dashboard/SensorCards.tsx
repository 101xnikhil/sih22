import React from 'react';
import { Droplets, CloudRain, Mountain, Activity, Battery, Radio, Sparkles } from 'lucide-react';
import { TelemetryReading } from '../../types';
import { formatBattery, getSignalQuality } from '../../utils/formatters';
import clsx from 'clsx';

interface Props {
  reading: TelemetryReading | null;
}

export default function SensorCards({ reading }: Props) {
  if (!reading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse bg-slate-900/40 min-h-[140px] rounded-2xl">
            <div className="h-4 bg-slate-800/80 rounded w-1/3 mb-3" />
            <div className="h-8 bg-slate-800/80 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-800/80 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'soil_moisture',
      label: 'Soil Moisture (VWC)',
      icon: Droplets,
      value: reading.soil_moisture_pct.toFixed(1),
      unit: '%',
      secondary: `${reading.soil_moisture} ADC`,
      status: reading.soil_moisture_pct > 80 ? 'SATURATED' : reading.soil_moisture_pct > 50 ? 'ELEVATED' : 'NOMINAL',
      statusColor: reading.soil_moisture_pct > 80 ? 'text-red-300 border-red-500/40 bg-red-950/60' : reading.soil_moisture_pct > 50 ? 'text-amber-300 border-amber-500/40 bg-amber-950/60' : 'text-cyan-300 border-cyan-500/40 bg-cyan-950/60',
      meterPct: Math.min(reading.soil_moisture_pct, 100),
      gradient: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
      ambientGlow: 'hover:border-cyan-500/40 hover:shadow-cyan-950/30',
    },
    {
      id: 'rainfall',
      label: 'Rainfall (24h Intensity)',
      icon: CloudRain,
      value: reading.rainfall_24h_mm.toFixed(1),
      unit: 'mm',
      secondary: `Rate: ${reading.rainfall_pct.toFixed(0)}% (${reading.rain_detected ? 'PRECIP' : 'DRY'})`,
      status: reading.rainfall_24h_mm > 60 ? 'HEAVY RAIN' : reading.rainfall_24h_mm > 25 ? 'MODERATE' : 'NORMAL',
      statusColor: reading.rainfall_24h_mm > 60 ? 'text-red-300 border-red-500/40 bg-red-950/60' : reading.rainfall_24h_mm > 25 ? 'text-amber-300 border-amber-500/40 bg-amber-950/60' : 'text-blue-300 border-blue-500/40 bg-blue-950/60',
      meterPct: Math.min((reading.rainfall_24h_mm / 100) * 100, 100),
      gradient: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-950/80 text-blue-400 border-blue-500/30',
      ambientGlow: 'hover:border-blue-500/40 hover:shadow-blue-950/30',
    },
    {
      id: 'tilt_angle',
      label: 'Slope Incline (Dip Angle)',
      icon: Mountain,
      value: reading.tilt_angle.toFixed(1),
      unit: '°',
      secondary: `Acc: ${reading.accel_x.toFixed(2)}, ${reading.accel_z.toFixed(2)}g`,
      status: reading.tilt_angle > 30 ? 'HIGH INCLINE' : 'NOMINAL',
      statusColor: reading.tilt_angle > 30 ? 'text-amber-300 border-amber-500/40 bg-amber-950/60' : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
      meterPct: Math.min((reading.tilt_angle / 60) * 100, 100),
      gradient: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
      ambientGlow: 'hover:border-emerald-500/40 hover:shadow-emerald-950/30',
    },
    {
      id: 'tilt_rate',
      label: 'Creep Velocity (Angular)',
      icon: Activity,
      value: reading.tilt_rate > 0 ? `+${reading.tilt_rate.toFixed(3)}` : reading.tilt_rate.toFixed(3),
      unit: '°/min',
      secondary: `Δt: 10s window`,
      status: Math.abs(reading.tilt_rate) > 0.05 ? 'CREEP ANOMALY' : 'STABLE',
      statusColor: Math.abs(reading.tilt_rate) > 0.05 ? 'text-rose-300 border-rose-500/50 bg-rose-950/60 animate-pulse' : 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60',
      meterPct: Math.min((Math.abs(reading.tilt_rate) / 0.1) * 100, 100),
      gradient: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-950/80 text-rose-400 border-rose-500/30',
      ambientGlow: 'hover:border-rose-500/40 hover:shadow-rose-950/30',
    },
    {
      id: 'battery',
      label: 'Power Matrix (Li-ion 3.7V)',
      icon: Battery,
      value: reading.battery_pct.toString(),
      unit: '%',
      secondary: formatBattery(reading.battery_mv),
      status: reading.battery_pct < 20 ? 'LOW POWER' : 'OPTIMAL',
      statusColor: reading.battery_pct < 20 ? 'text-red-300 border-red-500/40 bg-red-950/60' : 'text-violet-300 border-violet-500/40 bg-violet-950/60',
      meterPct: reading.battery_pct,
      gradient: 'from-violet-500 to-purple-600',
      badgeBg: 'bg-violet-950/80 text-violet-400 border-violet-500/30',
      ambientGlow: 'hover:border-violet-500/40 hover:shadow-violet-950/30',
    },
    {
      id: 'lora_signal',
      label: 'Telemetry Link (433MHz)',
      icon: Radio,
      value: reading.rssi_dbm.toString(),
      unit: 'dBm',
      secondary: `SNR: ${reading.snr_db > 0 ? '+' : ''}${reading.snr_db.toFixed(1)} dB`,
      status: getSignalQuality(reading.rssi_dbm).toUpperCase(),
      statusColor: reading.rssi_dbm < -100 ? 'text-amber-300 border-amber-500/40 bg-amber-950/60' : 'text-orange-300 border-orange-500/40 bg-orange-950/60',
      meterPct: Math.min(Math.max((reading.rssi_dbm + 120) * (100 / 70), 0), 100),
      gradient: 'from-amber-500 to-orange-600',
      badgeBg: 'bg-orange-950/80 text-orange-400 border-orange-500/30',
      ambientGlow: 'hover:border-orange-500/40 hover:shadow-orange-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 h-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.id} 
            className={clsx(
              "card p-4 flex flex-col justify-between rounded-2xl relative overflow-hidden transition-all duration-300 shadow-lg",
              card.ambientGlow
            )}
          >
            <div>
              {/* Card Header Tag */}
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className={clsx("p-1.5 rounded-lg border shrink-0", card.badgeBg)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Main Metric Value */}
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-black font-mono text-white tracking-tight tabular-nums">
                  {card.value}
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400">{card.unit}</span>
              </div>
            </div>

            {/* Micro Gauge Bar & Secondary Details */}
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-2">
              <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={clsx("h-full rounded-full transition-all duration-500 bg-gradient-to-r", card.gradient)}
                  style={{ width: `${card.meterPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{card.secondary}</span>
                <span className={clsx("px-2 py-0.5 rounded-full border text-[8.5px] font-bold uppercase tracking-wider", card.statusColor)}>
                  {card.status}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
