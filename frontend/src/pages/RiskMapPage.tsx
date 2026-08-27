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
    <div className="space-y-4 flex flex-col h-[calc(100vh-7.5rem)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3 shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold font-mono text-slate-100 uppercase">Geospatial Slope Risk Map</h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Georeferenced monitoring stations, physical slope inclination sectors, and early warning boundaries.
            </p>
          </div>
        </div>
        <PrototypeLabel text="GIS Spatial Node Mapping — Single Node Prototype" />
      </div>

      {/* Main Map + Inspector Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Map Viewport (3 cols) */}
        <div className="lg:col-span-3 relative rounded-lg overflow-hidden border border-slate-800 shadow-md h-full flex flex-col">
          <MapContainer 
            center={position} 
            zoom={14} 
            scrollWheelZoom={true} 
            style={{ height: '100%', width: '100%', backgroundColor: '#090d16' }}
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
                    <span className="font-mono text-cyan-700 font-bold">{node.id}</span>
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
                    <span className="font-bold text-cyan-700">{currentReading.soil_moisture_pct.toFixed(1)}%</span>
                    <span className="text-slate-500">Precipitation:</span>
                    <span className="font-bold text-blue-700">{currentReading.rainfall_24h_mm.toFixed(1)} mm</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Floating Legend */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur border border-slate-800 rounded p-3 shadow-xl font-mono text-xs">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Hazard Tier Legend
            </h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-200">LOW (0.00 – 0.25)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-200">MODERATE (0.25 – 0.50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-slate-200">HIGH (0.50 – 0.75)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-slate-200">CRITICAL (0.75 – 1.00)</span>
              </div>
            </div>
          </div>

          {/* Map Floating Coordinates Tag */}
          <div className="absolute top-4 left-4 z-[1000] bg-slate-950/90 border border-slate-800 rounded px-2.5 py-1.5 shadow-lg text-[10px] font-mono text-slate-300">
            <div>COORDINATES: <strong className="text-cyan-400">{node.location.lat.toFixed(6)}° N, {node.location.lng.toFixed(6)}° E</strong></div>
            <div className="text-slate-400">ELEVATION: {node.location.altitude_m}m ASL · SECTOR 7</div>
          </div>
        </div>

        {/* Node Inspector Side Panel (1 col) */}
        <div className="card flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="card-header flex items-center justify-between">
              <span>Station Telemetry Inspector</span>
              <span className="badge badge-low text-[10px]">Active</span>
            </div>
            
            <div className="card-body space-y-4 text-xs font-mono">
              {/* Selected Node Identity */}
              <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Monitoring Station</div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">{node.name}</div>
                <div className="text-[11px] text-cyan-400 font-bold mt-0.5">{node.id}</div>
              </div>

              {/* Live Hazard Score */}
              <div className="p-2.5 bg-slate-950/80 rounded border border-slate-800">
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
                  <span>Current Stability Rating</span>
                  <span className={clsx("font-bold", RISK_TEXT_CLASSES[currentRisk.risk_level])}>
                    {currentRisk.risk_level}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={clsx("text-2xl font-black", RISK_TEXT_CLASSES[currentRisk.risk_level])}>
                    {(currentRisk.risk_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-400 text-xs">FoS: <strong className="text-slate-200">{currentRisk.fos_estimate.toFixed(2)}</strong></span>
                </div>
              </div>

              {/* Physical Sensor Readouts */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Live Sensor Channels
                </div>
                
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Soil Moisture:
                  </span>
                  <span className="font-bold text-slate-100">{currentReading.soil_moisture_pct.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-blue-400" /> 24h Rain:
                  </span>
                  <span className="font-bold text-slate-100">{currentReading.rainfall_24h_mm.toFixed(1)} mm</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Slope Angle:
                  </span>
                  <span className="font-bold text-slate-100">{formatDegrees(currentReading.tilt_angle)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" /> Creep Rate:
                  </span>
                  <span className="font-bold text-slate-100">{currentReading.tilt_rate.toFixed(3)} °/m</span>
                </div>
              </div>

              {/* Radio & Power */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">LoRa Link RSSI:</span>
                  <span className="text-slate-200 font-bold">{formatRSSI(currentReading.rssi_dbm)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Battery Level:</span>
                  <span className="text-slate-200 font-bold">{currentReading.battery_pct}% ({formatBattery(currentReading.battery_mv)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Panel Footer */}
          <div className="px-3.5 py-2 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex justify-between">
            <span>LAST SEEN: {formatTimeShort(currentReading.timestamp)}</span>
            <span className="text-emerald-400">SYNCED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMapPage;
