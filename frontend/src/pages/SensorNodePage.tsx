import React from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import LoadingState from '../components/common/LoadingState';
import { formatNumber, formatDegrees, formatPercent, getSignalQuality, formatRSSI, formatBattery, formatDateTime } from '../utils/formatters';
import PrototypeLabel from '../components/common/PrototypeLabel';
import { Radio, Cpu, Battery, Signal, Mountain, Droplets, CloudRain, Activity, Layers, Compass, CheckCircle2, Sliders } from 'lucide-react';
import clsx from 'clsx';

const SensorNodePage: React.FC = () => {
  const { state } = useMockTelemetry();
  
  if (!state) {
    return <LoadingState message="Connecting to node telemetry interface..." />;
  }
  
  const { node, currentReading } = state;
  const signalQuality = getSignalQuality(currentReading.rssi_dbm);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
            <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">{node.name} ({node.id})</h1>
            <span className="badge badge-elite text-[10px]">Online</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {node.location.description} · Elevation: {node.location.altitude_m}m ASL · Sector 7 (Shimla Northern Face)
          </p>
        </div>
        <PrototypeLabel text="Live Telemetry Stream — ESP32 Sensor Node (LG-N01)" />
      </div>

      {/* Grid Row 1: Hardware Specifications & Link Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node Specs */}
        <div className="card lg:col-span-2">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs uppercase tracking-wider">Hardware Platform Specifications</span>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-slate-500">ESP32-WROOM-32D</span>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Node ID</dt>
                <dd className="text-sm font-bold text-slate-900 mt-1 font-mono">{node.id}</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Firmware</dt>
                <dd className="text-sm font-bold text-blue-600 mt-1 font-mono">{node.firmware_version}</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">System Uptime</dt>
                <dd className="text-sm font-bold text-slate-900 mt-1 font-mono">{node.uptime_hours.toFixed(1)} hrs</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tx Interval</dt>
                <dd className="text-sm font-bold text-emerald-600 mt-1 font-mono">{node.reading_interval_s} seconds</dd>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">GPS Latitude</dt>
                <dd className="text-xs text-slate-800 font-mono mt-1 font-semibold">{node.location.lat.toFixed(6)}° N</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">GPS Longitude</dt>
                <dd className="text-xs text-slate-800 font-mono mt-1 font-semibold">{node.location.lng.toFixed(6)}° E</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Altitude ASL</dt>
                <dd className="text-xs text-slate-800 font-mono mt-1 font-semibold">{node.location.altitude_m} meters</dd>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Seq Number</dt>
                <dd className="text-xs font-bold text-blue-600 font-mono mt-1">#{currentReading.seq_num}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* LoRa Link Quality & Battery */}
        <div className="card flex flex-col justify-between">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Radio className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs uppercase tracking-wider">RF & Power Diagnostics</span>
            </div>
            <span className="font-mono text-[10.5px] font-bold text-emerald-600">433.0 MHz</span>
          </div>
          <div className="card-body space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">LoRa RSSI / Quality:</span>
                <span className="text-slate-900 font-bold font-mono">{formatRSSI(currentReading.rssi_dbm)} ({signalQuality.toUpperCase()})</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>Signal-to-Noise Ratio:</span>
                <span className="text-slate-800 font-bold">{currentReading.snr_db > 0 ? `+${currentReading.snr_db.toFixed(1)}` : currentReading.snr_db.toFixed(1)} dB</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Battery Subsystem:</span>
                <span className="text-slate-900 font-bold font-mono">{currentReading.battery_pct}% ({formatBattery(currentReading.battery_mv)})</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-[#10b981] h-full rounded-full" style={{ width: `${currentReading.battery_pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex justify-between">
                <span>Operational: 3.2V - 4.2V</span>
                <span className="text-[#10b981] font-bold">NOMINAL</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-[#f1f5f9] text-[10px] font-mono text-slate-500 flex justify-between">
            <span>PACKET LOSS: 0.0%</span>
            <span>BURST RATE: SF7/BW125</span>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Raw 6-DOF IMU & Sensor Calibration Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Raw Accelerometer & Gyroscope Matrix */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-xs uppercase tracking-wider">MPU6050 6-Axis Motion Telemetry</span>
            </div>
            <span className="font-mono text-[10.5px] text-slate-500">I²C Bus (0x68)</span>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-3 gap-3 text-center mb-3.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Accel X</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{currentReading.accel_x > 0 ? `+${currentReading.accel_x.toFixed(3)}` : currentReading.accel_x.toFixed(3)}g</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Accel Y</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{currentReading.accel_y > 0 ? `+${currentReading.accel_y.toFixed(3)}` : currentReading.accel_y.toFixed(3)}g</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Accel Z</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">{currentReading.accel_z.toFixed(3)}g</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Gyro X</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{currentReading.gyro_x.toFixed(2)} °/s</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Gyro Y</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{currentReading.gyro_y.toFixed(2)} °/s</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Gyro Z</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{currentReading.gyro_z.toFixed(2)} °/s</div>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-[#f1f5f9] text-[10px] font-sans text-slate-600 flex justify-between">
            <span>Computed Slope Angle: <strong className="text-emerald-600 font-mono">{formatDegrees(currentReading.tilt_angle)}</strong></span>
            <span>Creep Rate: <strong className="text-blue-600 font-mono">{currentReading.tilt_rate.toFixed(3)} °/min</strong></span>
          </div>
        </div>

        {/* Environmental & Soil Calibration Spec */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-xs uppercase tracking-wider">Analog Transducer Calibration Constants</span>
            </div>
            <span className="font-mono text-[10.5px] text-slate-500">ADC1 (12-bit)</span>
          </div>
          <div className="card-body space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-800 font-bold flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" /> Capacitive Moisture V2.0 (GPIO 34)
                </span>
                <span className="text-blue-600 font-bold font-mono">{currentReading.soil_moisture_pct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>ADC Reading: {currentReading.soil_moisture} counts</span>
                <span>Air: 3200 | Water: 1400 ADC</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-800 font-bold flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" /> FC-37 Rain Interface (GPIO 35/25)
                </span>
                <span className="text-blue-600 font-bold font-mono">{currentReading.rainfall_24h_mm.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>ADC Intensity: {currentReading.rainfall} counts</span>
                <span>Precipitation Flag: {currentReading.rain_detected ? 'ACTIVE' : 'NONE'}</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-[#f1f5f9] text-[10px] font-sans text-slate-600 flex justify-between">
            <span>Calibration Status: Verified</span>
            <span className="text-emerald-600 font-bold">All Sensors Nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorNodePage;
