import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Radio, Bell, BarChart3, Map, Settings, Activity } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const links = [
    { name: 'Command Dashboard', path: '/', icon: LayoutDashboard, badge: 'LIVE' },
    { name: 'Sensor Node (LG-N01)', path: '/sensor', icon: Radio },
    { name: 'Alerts & Incidents', path: '/alerts', icon: Bell },
    { name: 'Analytics & Trends', path: '/analytics', icon: BarChart3 },
    { name: 'Geospatial Risk Map', path: '/map', icon: Map },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-40 h-screen transition-transform bg-slate-900 border-r border-slate-800 flex flex-col',
        'w-64',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950">
        <div className="p-1.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 mr-2.5">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-slate-100 tracking-wider font-mono">LANDGUARD</h1>
            <span className="text-[10px] font-bold px-1 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">AI</span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono tracking-tight uppercase">Early Warning & Monitoring</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          Operations Center
        </div>
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => {
                if (window.innerWidth < 1024) onToggle();
              }}
              className={clsx(
                'flex items-center justify-between px-2.5 py-2 rounded text-xs font-medium transition-all',
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border-l-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={clsx('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-500')} />
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Subsystem Deployment Status Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-[11px] space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">DEPLOYMENT:</span>
          <span className="text-slate-300 font-bold">SECTOR ALPHA</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">HARDWARE:</span>
          <span className="text-cyan-400 font-bold">1 NODE (LG-N01)</span>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>SIH 2026 PROTOTYPE</span>
          <span className="text-slate-400">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
