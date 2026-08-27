import React from 'react';
import { Droplets, CloudRain, Mountain, Activity, Battery, Radio, AlertCircle } from 'lucide-react';
import { TelemetryReading } from '../../types';
import { formatPercent, formatDegrees, formatBattery, formatRSSI, getSignalQuality } from '../../utils/formatters';
import clsx from 'clsx';

interface Props {
  reading: TelemetryReading | null;
}

export default function SensorCards({ reading }: Props) {
  if (!reading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-3.5 animate-pulse bg-slate-900/50">
            <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
            <div className="h-7 bg-slate-800 rounded w-2/3 mb-2" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Sensor definitions with engineering metrics
  const cards = [
    {
      id: 'soil_moisture',
      label: 'Soil Moisture (VWC)',
      icon: Droplets,
      value: reading.soil_moisture_pct.toFixed(1),
      unit: '%',
      secondary: `${reading.soil_moisture} ADC`,
      status: reading.soil_moisture_pct > 80 ? 'CRITICAL SATURATION' : reading.soil_moisture_pct > 50 ? 'ELEVATED' : 'NOMINAL',
      statusColor: reading.soil_moisture_pct > 80 ? 'text-red-400 border-red-800/60 bg-red-950/40' : reading.soil_moisture_pct > 50 ? 'text-amber-400 border-amber-800/60 bg-amber-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: Math.min(reading.soil_moisture_pct, 100),
      meterColor: reading.soil_moisture_pct > 80 ? 'bg-red-500' : reading.soil_moisture_pct > 50 ? 'bg-amber-500' : 'bg-cyan-500',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'rainfall',
      label: 'Rainfall Intensity (24h)',
      icon: CloudRain,
      value: reading.rainfall_24h_mm.toFixed(1),
      unit: 'mm',
      secondary: `Rate: ${reading.rainfall_pct.toFixed(0)}% (${reading.rain_detected ? 'PRECIP' : 'DRY'})`,
      status: reading.rainfall_24h_mm > 60 ? 'HEAVY RAIN' : reading.rainfall_24h_mm > 25 ? 'MODERATE' : 'NORMAL',
      statusColor: reading.rainfall_24h_mm > 60 ? 'text-red-400 border-red-800/60 bg-red-950/40' : reading.rainfall_24h_mm > 25 ? 'text-amber-400 border-amber-800/60 bg-amber-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: Math.min((reading.rainfall_24h_mm / 100) * 100, 100),
      meterColor: reading.rainfall_24h_mm > 60 ? 'bg-red-500' : 'bg-blue-500',
      iconColor: 'text-blue-400',
    },
    {
      id: 'tilt_angle',
      label: 'Slope Angle (Dip)',
      icon: Mountain,
      value: reading.tilt_angle.toFixed(1),
      unit: '°',
      secondary: `Acc: ${reading.accel_x.toFixed(2)}, ${reading.accel_z.toFixed(2)}g`,
      status: reading.tilt_angle > 30 ? 'HIGH INCLINE' : 'NOMINAL',
      statusColor: reading.tilt_angle > 30 ? 'text-amber-400 border-amber-800/60 bg-amber-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: Math.min((reading.tilt_angle / 60) * 100, 100),
      meterColor: reading.tilt_angle > 30 ? 'bg-amber-500' : 'bg-emerald-500',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'tilt_rate',
      label: 'Displacement Velocity',
      icon: Activity,
      value: reading.tilt_rate > 0 ? `+${reading.tilt_rate.toFixed(3)}` : reading.tilt_rate.toFixed(3),
      unit: '°/min',
      secondary: `Δt: 10s window`,
      status: Math.abs(reading.tilt_rate) > 0.05 ? 'CREEP DETECTED' : 'STABLE',
      statusColor: Math.abs(reading.tilt_rate) > 0.05 ? 'text-red-400 border-red-800/60 bg-red-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: Math.min((Math.abs(reading.tilt_rate) / 0.1) * 100, 100),
      meterColor: Math.abs(reading.tilt_rate) > 0.05 ? 'bg-red-500' : 'bg-cyan-500',
      iconColor: 'text-amber-400',
    },
    {
      id: 'battery',
      label: 'Node Power (Li-ion)',
      icon: Battery,
      value: reading.battery_pct.toString(),
      unit: '%',
      secondary: formatBattery(reading.battery_mv),
      status: reading.battery_pct < 20 ? 'LOW BATTERY' : 'OPTIMAL',
      statusColor: reading.battery_pct < 20 ? 'text-red-400 border-red-800/60 bg-red-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: reading.battery_pct,
      meterColor: reading.battery_pct < 20 ? 'bg-red-500' : 'bg-emerald-500',
      iconColor: reading.battery_pct < 20 ? 'text-red-400' : 'text-emerald-400',
    },
    {
      id: 'lora_signal',
      label: 'LoRa 433MHz Telemetry',
      icon: Radio,
      value: reading.rssi_dbm.toString(),
      unit: 'dBm',
      secondary: `SNR: ${reading.snr_db > 0 ? '+' : ''}${reading.snr_db.toFixed(1)} dB`,
      status: getSignalQuality(reading.rssi_dbm).toUpperCase(),
      statusColor: reading.rssi_dbm < -100 ? 'text-amber-400 border-amber-800/60 bg-amber-950/40' : 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40',
      meterPct: Math.min(Math.max((reading.rssi_dbm + 120) * (100 / 70), 0), 100),
      meterColor: reading.rssi_dbm < -100 ? 'bg-amber-500' : 'bg-cyan-500',
      iconColor: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 h-full">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.id} className="card p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate mr-1">
                  {card.label}
                </span>
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", card.iconColor)} />
              </div>

              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs font-mono text-slate-400">{card.unit}</span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
              {/* Mini Meter */}
              <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                <div 
                  className={clsx("h-full transition-all duration-300", card.meterColor)}
                  style={{ width: `${card.meterPct}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400">{card.secondary}</span>
                <span className={clsx("px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase", card.statusColor)}>
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
