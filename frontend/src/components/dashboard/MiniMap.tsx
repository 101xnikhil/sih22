import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Maximize2 } from 'lucide-react';
import { SensorNode } from '../../types';

interface Props {
  node: SensorNode | null;
}

export default function MiniMap({ node }: Props) {
  const position: [number, number] = node ? [node.location.lat, node.location.lng] : [31.1048, 77.1734];

  // Custom Radar Ping Marker
  const radarIcon = L.divIcon({
    className: 'custom-radar-icon',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="radar-ping absolute w-5 h-5 rounded-full bg-cyan-500 opacity-75"></div>
        <div class="w-3 h-3 rounded-full bg-cyan-400 border-2 border-white shadow-md"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="card overflow-hidden flex flex-col h-full min-h-[260px] isolate z-0">
      {/* Header */}
      <div className="card-header border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <span>Slope Geographic Sector</span>
        </div>
        <Link 
          to="/map" 
          className="text-[10px] font-mono text-blue-600 hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 uppercase tracking-wider font-semibold"
          title="Open Full Geospatial Map"
        >
          <Maximize2 size={11} /> Expand
        </Link>
      </div>

      {/* Map Viewport */}
      <div className="flex-1 w-full relative min-h-[170px]">
        <MapContainer 
          center={position} 
          zoom={13} 
          scrollWheelZoom={false} 
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; National Geographic, Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          {node && (
            <Marker position={position} icon={radarIcon}>
              <Popup>
                <div className="p-1 text-slate-900 font-sans">
                  <div className="font-bold text-xs">{node.name} ({node.id})</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{node.location.description}</div>
                  <div className="text-[10px] font-mono text-blue-700 dark:text-cyan-700 mt-1 font-semibold">
                    Elev: {node.location.altitude_m} m ASL
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Coordinates Overlay Pill */}
        <div className="absolute bottom-2 left-2 z-[1000] px-2 py-1 rounded bg-white/95 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 shadow-md">
          {node ? `${node.location.lat.toFixed(4)}° N, ${node.location.lng.toFixed(4)}° E` : '--'}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
        <span className="truncate max-w-[200px]">{node?.location.description || 'Sector Alpha'}</span>
        <span className="text-slate-800 dark:text-slate-300 font-bold">{node?.location.altitude_m}m ASL</span>
      </div>
    </div>
  );
}
