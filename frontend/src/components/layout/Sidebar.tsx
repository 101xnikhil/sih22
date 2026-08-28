import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Radio, Bell, BarChart3, Map, Settings, Activity, Wifi, Cpu, Layers, Users, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const links = [
    { name: 'Mission Control', path: '/', icon: LayoutDashboard, badge: 'LIVE', category: 'MONITORING' },
    { name: 'Station Telemetry', path: '/sensor', icon: Radio, category: 'MONITORING' },
    { name: 'Geospatial Sector GIS', path: '/map', icon: Map, category: 'SPATIAL & FIELD' },
    { name: 'Alerts & Incidents', path: '/alerts', icon: Bell, badge: 'AUTO', category: 'INTELLIGENCE' },
    { name: 'Geotechnical Analytics', path: '/analytics', icon: BarChart3, category: 'INTELLIGENCE' },
    { name: 'Hardware & Blynk IoT', path: '/settings', icon: Settings, category: 'SYSTEM & INTEGRATIONS' },
    { name: 'About LANDGUARD AI', path: '/about', icon: Users, category: 'ABOUT & INNOVATION' },
  ];

  const categories = ['MONITORING', 'SPATIAL & FIELD', 'INTELLIGENCE', 'SYSTEM & INTEGRATIONS', 'ABOUT & INNOVATION'];

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-40 h-screen transition-transform bg-[#0a0d18]/95 backdrop-blur-2xl border-r border-white/10 flex flex-col',
        'w-64',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/[0.01]">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 p-0.5 shadow-md shadow-orange-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-[#0a0d18] rounded-[10px] flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg font-bold tracking-tight text-white group-hover:text-orange-300 transition-colors">
                LANDGUARD
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-300 border border-orange-600/40 font-bold">
                AI
              </span>
            </div>
            <p className="text-[9px] font-mono text-slate-400 tracking-wider">EARLY WARNING OS</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {categories.map((category) => {
          const categoryLinks = links.filter((l) => l.category === category);
          if (categoryLinks.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                {category}
              </div>
              {categoryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => onToggle()}
                    className={clsx(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500/20 via-rose-500/10 to-transparent text-white border-l-2 border-orange-500 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={clsx(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-slate-300'
                      )} />
                      <span className="tracking-wide">{link.name}</span>
                    </div>

                    {link.badge && (
                      <span className={clsx(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
                        isActive 
                          ? 'bg-orange-950/80 text-orange-300 border-orange-500/40' 
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      )}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Operational Station Footer */}
      <div className="p-3 border-t border-white/10 bg-[#080a14]">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5 font-mono text-[10px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>SECTOR GIS</span>
            <span className="text-slate-200 font-bold">SECTOR 7 (SHIMLA)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>EDGE GATEWAY</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE (LoRa 433)
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
