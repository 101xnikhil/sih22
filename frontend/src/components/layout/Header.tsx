import React, { useState } from 'react';
import { Menu, Calendar, ChevronDown, Bell, Radio, FlaskConical, Cpu, Layers } from 'lucide-react';
import clsx from 'clsx';
import { useMockTelemetry } from '../../hooks/useMockTelemetry';
import ThemeToggle from '../common/ThemeToggle';

interface HeaderProps {
  title: string;
  alertCount: number;
  isConnected: boolean;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, alertCount, isConnected, onMenuToggle }) => {
  const { mode, setMode, state } = useMockTelemetry();
  const [selectedAggregate, setSelectedAggregate] = useState<'node' | 'selected'>('selected');
  const [selectedTeam, setSelectedTeam] = useState('All sectors (2)');

  return (
    <header className="h-20 bg-transparent flex items-center justify-between px-4 sm:px-6 lg:px-8 z-30 transition-all max-w-[1600px] w-full mx-auto">
      {/* Left: Mobile Toggle + Huge Bold Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none p-2 rounded-xl bg-white dark:bg-[#0f172a] border border-[#e5e9f2] dark:border-white/10 shadow-sm"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-2xl sm:text-3xl font-black text-[#1e40af] dark:text-[#60a5fa] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Controls matching the screenshot */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 font-sans text-xs">
        {/* Teams / Sector Dropdown */}
        <div className="hidden md:flex items-center gap-2 text-slate-600 dark:text-slate-200 font-semibold">
          <span>Sector:</span>
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="appearance-none bg-white dark:bg-[#0f172a] border border-[#e5e9f2] dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-100 font-semibold py-1.5 pl-3 pr-8 rounded-xl cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="All sectors (2)">All sectors (2)</option>
              <option value="Sector 7 (Shimla NH-5)">Sector 7 (Shimla NH-5)</option>
              <option value="Wayanad Scarp Zone">Wayanad Scarp Zone</option>
              <option value="Konkan Ghat Section">Konkan Ghat Section</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Aggregate by Segmented Control */}
        <div className="hidden lg:flex items-center gap-2 text-slate-600 dark:text-slate-200 font-semibold">
          <span>Aggregate by:</span>
          <div className="segmented-control">
            <button
              onClick={() => setSelectedAggregate('node')}
              className={clsx(
                'segmented-item',
                selectedAggregate === 'node' ? 'segmented-item-active' : 'hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Node
            </button>
            <button
              onClick={() => setSelectedAggregate('selected')}
              className={clsx(
                'segmented-item',
                selectedAggregate === 'selected' ? 'segmented-item-active' : 'hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Selected nodes
            </button>
          </div>
        </div>

        {/* Date Range Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-[#0f172a] border border-[#e5e9f2] dark:border-white/10 px-3.5 py-1.5 rounded-xl font-medium text-slate-700 dark:text-slate-100 shadow-sm">
          <span>01/01/2026 - 28/08/2026</span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center bg-white dark:bg-[#0f172a] border border-[#e5e9f2] dark:border-white/10 p-0.5 rounded-xl shadow-sm">
          <button
            onClick={() => setMode('DEMO')}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
              mode === 'DEMO' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            )}
          >
            Lab Sim
          </button>
          <button
            onClick={() => setMode('HARDWARE')}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all',
              mode === 'HARDWARE' ? 'bg-[#ef4444] text-white shadow-xs' : 'text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white'
            )}
          >
            ESP32
          </button>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
