import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Radio, Cpu, Clock, Shield, Sparkles, Server, FlaskConical } from 'lucide-react';
import clsx from 'clsx';
import { useMockTelemetry } from '../../hooks/useMockTelemetry';

interface HeaderProps {
  title: string;
  alertCount: number;
  isConnected: boolean;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, alertCount, isConnected, onMenuToggle }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { mode, setMode, state, connectionState } = useMockTelemetry();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateString = currentTime.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isHardware = mode === 'HARDWARE';

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0 shadow-sm">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-slate-200 focus:outline-none p-1 rounded hover:bg-slate-800"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase font-mono">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Operational Status & Mode Switcher */}
      <div className="flex items-center gap-3">
        {/* TRI-MODE SELECTOR BUTTON */}
        <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setMode('DEMO')}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold tracking-wider",
              mode === 'DEMO'
                ? "bg-cyan-600 text-slate-950 shadow-md shadow-cyan-900/50"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Physical Landslide Laboratory Demonstration (SIH 2026)"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>PHYSICAL DEMO</span>
          </button>

          <button
            onClick={() => setMode('HARDWARE')}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold tracking-wider",
              isHardware
                ? "bg-red-600 text-white shadow-md shadow-red-900/50"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Switch to Real ESP32 Sensor & LoRa Gateway"
          >
            <span className="relative flex h-2 w-2">
              {isHardware && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              )}
              <span className={clsx("relative inline-flex rounded-full h-2 w-2", isHardware ? "bg-white" : "bg-red-500/50")}></span>
            </span>
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE HARDWARE</span>
          </button>

          <button
            onClick={() => setMode('SIMULATION')}
            className={clsx(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-bold tracking-wider",
              mode === 'SIMULATION'
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/50"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Switch to Synthetic Demonstration Scenarios"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>SIMULATION</span>
          </button>
        </div>

        {/* Connection State Badge (Phase 13) */}
        <div className={clsx(
          "flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border font-mono text-[11px] transition-all",
          connectionState === 'ONLINE'
            ? "border-emerald-800/80 text-emerald-300"
            : connectionState === 'DEGRADED'
            ? "border-amber-800/80 text-amber-300 animate-pulse"
            : "border-red-800/80 text-red-300 bg-red-950/30"
        )}>
          <span className="relative flex h-2 w-2">
            {connectionState === 'ONLINE' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              connectionState === 'ONLINE' ? "bg-emerald-500" :
              connectionState === 'DEGRADED' ? "bg-amber-500" : "bg-red-500"
            )}></span>
          </span>
          <span className="font-bold tracking-wider">
            {connectionState}
          </span>
        </div>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 text-[11px]">{dateString}</span>
          <span className="font-bold text-slate-100">{timeString}</span>
        </div>

        {/* Alert Bell Shortcut */}
        <Link 
          to="/alerts" 
          className="relative text-slate-400 hover:text-slate-100 transition-colors p-1.5 rounded hover:bg-slate-800"
          title="Active Alarms"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900 animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;
