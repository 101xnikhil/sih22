import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Radio, Cpu, Clock, Shield, Sparkles, Server, FlaskConical, Wifi, Zap } from 'lucide-react';
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
    <header className="h-16 bg-[#0c101d]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-7 z-30 sticky top-0 shadow-lg transition-all">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-slate-200 focus:outline-none p-2 rounded-xl hover:bg-slate-900 border border-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <h1 className="text-sm font-bold text-slate-100 tracking-wider uppercase font-mono">
              {title}
            </h1>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono font-medium text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            STATION: LG-N01 · SECTOR 7
          </span>
        </div>
      </div>

      {/* Right: Operational Status & Mode Switcher */}
      <div className="flex items-center gap-3">
        {/* TRI-MODE SELECTOR BUTTON */}
        <div className="flex items-center rounded-xl bg-slate-950/80 p-1 border border-white/10 font-mono text-[11px] shadow-inner">
          <button
            onClick={() => setMode('DEMO')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold tracking-wider",
              mode === 'DEMO'
                ? "bg-gradient-to-r from-orange-500 to-rose-500 text-slate-950 shadow-md shadow-orange-950/60"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Physical Lab Experiment & Interactive Scenario Controller"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">LAB CONTROLLER</span>
            <span className="md:hidden">LAB</span>
          </button>

          <button
            onClick={() => setMode('HARDWARE')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold tracking-wider",
              isHardware
                ? "bg-red-600 text-white shadow-md shadow-red-950"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Direct ESP32 Hardware via LoRa Gateway / Serial"
          >
            <span className="relative flex h-2 w-2">
              {isHardware && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              )}
              <span className={clsx("relative inline-flex rounded-full h-2 w-2", isHardware ? "bg-white" : "bg-red-500/50")}></span>
            </span>
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ESP32 HARDWARE</span>
            <span className="md:hidden">ESP32</span>
          </button>

          <button
            onClick={() => setMode('SIMULATION')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-bold tracking-wider",
              mode === 'SIMULATION'
                ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Synthetic Telemetry Evolution"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SIMULATION</span>
            <span className="md:hidden">SIM</span>
          </button>
        </div>

        {/* Blynk IoT Cloud Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-violet-700/40 text-[11px] font-mono text-violet-300 shadow-sm" title="Blynk IoT Cloud Virtual Pins V0-V6 Connected">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="font-bold">BLYNK IOT: SYNCED</span>
        </div>

        {/* Connection State Badge */}
        <div className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold tracking-wider uppercase transition-all shadow-sm",
          connectionState === 'ONLINE'
            ? "border-emerald-500/40 text-emerald-300 bg-emerald-950/30"
            : connectionState === 'DEGRADED'
            ? "border-amber-500/40 text-amber-300 bg-amber-950/30 animate-pulse"
            : "border-red-500/40 text-red-300 bg-red-950/40"
        )}>
          <span className="relative flex h-2 w-2">
            {connectionState === 'ONLINE' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={clsx(
              "relative inline-flex rounded-full h-2 w-2",
              connectionState === 'ONLINE' ? "bg-emerald-400" :
              connectionState === 'DEGRADED' ? "bg-amber-400" : "bg-red-400"
            )}></span>
          </span>
          <span>{connectionState}</span>
        </div>

        {/* Real-time Clock */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 text-[11px]">{dateString}</span>
          <span className="font-bold text-slate-100 tabular-nums">{timeString}</span>
        </div>

        {/* Alert Bell Shortcut */}
        <Link 
          to="/alerts" 
          className="relative text-slate-400 hover:text-slate-100 transition-colors p-2 rounded-xl hover:bg-slate-900 border border-slate-800"
          title="Active Alarms & Incident Center"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md ring-2 ring-slate-950 animate-pulse">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;
