import React from 'react';
import { SensorNode, TelemetryReading } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { CheckCircle2, XCircle, Cpu, Radio, BatteryMedium } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  node: SensorNode | null;
  reading: TelemetryReading | null;
}

export default function DeviceHealth({ node, reading }: Props) {
  if (!node) {
    return (
      <div className="card h-full min-h-[220px] flex items-center justify-center p-4 text-slate-500 text-xs">
        <Cpu className="w-5 h-5 animate-pulse mr-2" /> Initializing Node Diagnostics...
      </div>
    );
  }

  const batteryPct = reading?.battery_pct ?? 0;
  const batteryColor = batteryPct > 50 ? 'bg-emerald-500' : (batteryPct > 20 ? 'bg-amber-500' : 'bg-red-500');

  const SensorItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60 last:border-0">
      <span className="text-slate-300">{label}</span>
      {ok ? (
        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
          <CheckCircle2 size={12} /> OK
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-400 font-mono text-[10px]">
          <XCircle size={12} /> FAIL
        </span>
      )}
    </div>
  );

  return (
    <div className="card h-full flex flex-col justify-between">
      {/* Header */}
      <div className="card-header border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Node Diagnostics</span>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          {node.id}
        </span>
      </div>

      <div className="card-body p-3 flex-1 flex flex-col justify-between space-y-3">
        {/* Core System Properties */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Firmware</span>
            <span className="text-slate-200 font-mono text-xs">{node.firmware_version}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Uptime</span>
            <span className="text-slate-200 font-mono text-xs">{node.uptime_hours.toFixed(1)} hrs</span>
          </div>
          <div className="col-span-2 pt-1 border-t border-slate-800/80 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">LAST TELEMETRY INGEST:</span>
            <span className="font-mono text-slate-300">{formatRelativeTime(node.last_seen)}</span>
          </div>
        </div>

        {/* Sensor Bus Status */}
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Sensor Hardware Channels
          </div>
          <SensorItem label="Capacitive Moisture V2 (ADC)" ok={node.sensors.soil_moisture} />
          <SensorItem label="MPU6050 6-DOF IMU (I²C)" ok={node.sensors.accelerometer} />
          <SensorItem label="FC-37 Rain Surface (ADC/DIO)" ok={node.sensors.rain_gauge} />
        </div>

        {/* Power Subsystem */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex justify-between text-[11px] font-mono mb-1">
            <span className="text-slate-400 flex items-center gap-1">
              <BatteryMedium className="w-3.5 h-3.5 text-slate-400" />
              Li-Ion Cell:
            </span>
            <span className="text-slate-200 font-bold">
              {batteryPct}% <span className="text-slate-400 font-normal">({reading ? (reading.battery_mv / 1000).toFixed(2) : '--'}V)</span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${batteryColor}`} style={{ width: `${batteryPct}%` }} />
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
        <span>SAMPLING: 10s</span>
        <span className="text-emerald-400 font-bold">RF LINK OK</span>
      </div>
    </div>
  );
}
