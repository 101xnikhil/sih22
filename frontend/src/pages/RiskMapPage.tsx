import React, { useState } from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import LoadingState from '../components/common/LoadingState';
import PrototypeLabel from '../components/common/PrototypeLabel';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RISK_COLORS, RISK_TEXT_CLASSES } from '../types';
import { formatTimeShort, formatPercent, formatRSSI, formatBattery, formatDegrees } from '../utils/formatters';
import { MapPin, Mountain, Radio, Droplets, CloudRain, Activity, Layers, Compass, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

// Fix leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RiskMapPage: React.FC = () => {
  const { state } = useMockTelemetry();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('LG-N01');
  
  if (!state) {
    return <LoadingState message="Initializing geospatial GIS engine..." />;
  }
  
  const { node, currentReading, currentRisk } = state;
  const position: [number, number] = [node.location.lat, node.location.lng];
  
  const getMarkerIcon = () => {
    const color = RISK_COLORS[currentRisk.risk_level] || '#10b981';
    const isPulsing = currentRisk.risk_level === 'HIGH' || currentRisk.risk_level === 'CRITICAL';
    
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;">
          ${isPulsing ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background-color: ${color}; opacity: 0.6; animation: radarPing 1.8s infinite;"></div>` : ''}
          <div style="
            width: 18px; 
            height: 18px; 
            background-color: ${color}; 
            border-radius: 50%; 
            border: 2px solid #ffffff;
            box-shadow: 0 0 10px ${color};
            z-index: 10;
          "></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)] font-sans">
      {/* Top Banner */}
      <div className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="text-base font-bold text-[#0f172a] uppercase tracking-tight">Geospatial Slope Risk Map</h1>
            <p className="text-xs text-slate-500">
              Georeferenced monitoring stations, physical slope inclination sectors, and early warning boundaries.
            </p>
          </div>
        </div>
        <PrototypeLabel text="GIS Spatial Node Mapping" />
      </div>

      {/* Main Map + Inspector Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Map Viewport (3 cols) */}
        <div className="lg:col-span-3 relative rounded-2xl overflow-hidden border border-[#e5e9f2] shadow-sm h-full flex flex-col bg-white">
          <MapContainer 
            center={position} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={getMarkerIcon()}>
              <Popup>
                <div className="p-1 text-slate-900 font-sans min-w-[180px]">
                  <div className="font-bold text-xs flex justify-between items-center border-b pb-1 mb-1">
                    <span>{node.name}</span>
                    <span className="font-mono text-blue-700 font-bold">{node.id}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mb-2">{node.location.description}</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono">
                    <span className="text-slate-500">Risk Level:</span>
                    <span className={clsx("font-bold", RISK_TEXT_CLASSES[currentRisk.risk_level])}>
                      {currentRisk.risk_level}
                    </span>
                    <span className="text-slate-500">Hazard Score:</span>
                    <span className="font-bold text-slate-800">{(currentRisk.risk_score * 100).toFixed(0)}%</span>
                    <span className="text-slate-500">FoS Ratio:</span>
                    <span className="font-bold text-slate-800">{currentRisk.fos_estimate.toFixed(2)}</span>
                    <span className="text-slate-500">Soil Moisture:</span>
                    <span className="font-bold text-blue-700">{currentReading.soil_moisture_pct.toFixed(1)}%</span>
                    <span className="text-slate-500">Precipitation:</span>
                    <span className="font-bold text-blue-700">{currentReading.rainfall_24h_mm.toFixed(1)} mm</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-3 shadow-lg font-sans text-xs">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Hazard Tier Legend
            </h4>
            <div className="space-y-1 text-[11px] font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span className="text-slate-700">LOW (0.00 – 0.25)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-slate-700">MODERATE (0.25 – 0.50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                <span className="text-slate-700">HIGH (0.50 – 0.75)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                <span className="text-slate-700">CRITICAL (0.75 – 1.00)</span>
              </div>
            </div>
          </div>

          {/* Map Floating Coordinates Tag */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-md text-xs text-slate-700 font-sans">
            <div>Coordinates: <strong className="text-blue-600 font-mono">{node.location.lat.toFixed(6)}° N, {node.location.lng.toFixed(6)}° E</strong></div>
            <div className="text-slate-500 text-[11px]">Elevation: {node.location.altitude_m}m ASL · Sector 7</div>
          </div>
        </div>

        {/* Node Inspector Side Panel (1 col) */}
        <div className="card flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="card-header flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Station Inspector</span>
              <span className="badge badge-elite text-[10px]">Active</span>
            </div>
            
            <div className="card-body p-4 space-y-4 text-xs">
              {/* Selected Node Identity */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Monitoring Station</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{node.name}</div>
                <div className="text-xs text-blue-600 font-bold font-mono mt-0.5">{node.id}</div>
              </div>

              {/* Live Hazard Score */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold">
                  <span>Stability Rating</span>
                  <span className={clsx("font-bold", RISK_TEXT_CLASSES[currentRisk.risk_level])}>
                    {currentRisk.risk_level}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 font-mono">
                  <span className={clsx("text-2xl font-extrabold", RISK_TEXT_CLASSES[currentRisk.risk_level])}>
                    {(currentRisk.risk_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-500 text-xs font-sans">FoS: <strong className="text-slate-800 font-mono">{currentRisk.fos_estimate.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Physical Sensor Readouts */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Live Sensor Channels
                </div>
                
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-blue-600" /> Soil Moisture:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{currentReading.soil_moisture_pct.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <CloudRain className="w-3.5 h-3.5 text-blue-600" /> 24h Rain:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{currentReading.rainfall_24h_mm.toFixed(1)} mm</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Mountain className="w-3.5 h-3.5 text-emerald-600" /> Slope Angle:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{formatDegrees(currentReading.tilt_angle)}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                    <Activity className="w-3.5 h-3.5 text-orange-600" /> Creep Rate:
                  </span>
                  <span className="font-bold text-slate-900 font-mono">{currentReading.tilt_rate.toFixed(3)} °/m</span>
                </div>
              </div>

              {/* Radio & Power */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">LoRa Link RSSI:</span>
                  <span className="text-slate-800 font-bold">{formatRSSI(currentReading.rssi_dbm)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500 font-sans">Battery Level:</span>
                  <span className="text-slate-800 font-bold">{currentReading.battery_pct}% ({formatBattery(currentReading.battery_mv)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-[#f1f5f9] text-[10px] text-slate-500 flex justify-between font-sans">
            <span>Last seen: {formatTimeShort(currentReading.timestamp)}</span>
            <span className="text-emerald-600 font-semibold">Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMapPage;
