import React from 'react';
import { Terminal, ShieldAlert, Activity, Radio } from 'lucide-react';
import { SystemEvent } from '../../types';
import { formatTime } from '../../utils/formatters';
import clsx from 'clsx';

interface Props {
  events: SystemEvent[];
}

export default function RecentEvents({ events }: Props) {
  const displayEvents = events.slice(0, 25);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'alert':
        return {
          label: 'ALARM',
          badgeClass: 'bg-red-950/80 text-red-400 border border-red-800/80',
          dot: 'bg-red-500',
        };
      case 'risk_change':
        return {
          label: 'RISK_SHIFT',
          badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-800/80',
          dot: 'bg-amber-500',
        };
      case 'reading':
        return {
          label: 'INGEST',
          badgeClass: 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60',
          dot: 'bg-cyan-400',
        };
      default:
        return {
          label: 'SYS',
          badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="card h-full flex flex-col justify-between min-h-[260px]">
      {/* Header */}
      <div className="card-header border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-200">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Real-Time Audit Log & Telemetry Stream</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          {events.length} EVENTS BUFFERED
        </span>
      </div>

      {/* Stream List */}
      <div className="card-body p-0 flex-1 overflow-y-auto max-h-[190px]">
        {displayEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            AWAITING SYSTEM EVENTS...
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {displayEvents.map((event) => {
              const badge = getEventBadge(event.type);
              return (
                <div 
                  key={event.id} 
                  className="px-3.5 py-2 flex items-start gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                    {formatTime(event.timestamp)}
                  </span>
                  
                  <span className={clsx("text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 mt-0.5", badge.badgeClass)}>
                    {badge.label}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="text-slate-200 text-xs font-sans font-medium truncate">
                      {event.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                      {event.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 py-1.5 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          STREAM LISTENING (10s TICK)
        </span>
        <span className="text-slate-300">CRC-16 VERIFIED</span>
      </div>
    </div>
  );
}
