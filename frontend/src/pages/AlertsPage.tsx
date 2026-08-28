import React, { useState } from 'react';
import { useMockTelemetry } from '../hooks/useMockTelemetry';
import LoadingState from '../components/common/LoadingState';
import { formatDateTime, formatRelativeTime } from '../utils/formatters';
import { 
  AlertTriangle, AlertOctagon, Info, CheckCircle2, ShieldAlert, 
  Check, Filter, Eye, X, MessageSquare, PhoneCall, Radio, Send, Bell 
} from 'lucide-react';
import { RISK_TEXT_CLASSES, type Alert, type AlertSeverity } from '../types';
import PrototypeLabel from '../components/common/PrototypeLabel';
import clsx from 'clsx';

const AlertsPage: React.FC = () => {
  const { state, acknowledgeAlert } = useMockTelemetry();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showAcknowledged, setShowAcknowledged] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  
  if (!state) {
    return <LoadingState message="Loading incident audit logs..." />;
  }

  const getAlertReasons = (alert: Alert): string[] => {
    if (alert.trigger_reasons && alert.trigger_reasons.length > 0) {
      return alert.trigger_reasons;
    }
    if (alert.trigger_reason) {
      return alert.trigger_reason.split(';').map((s) => s.trim()).filter(Boolean);
    }
    if (alert.severity === 'critical' || alert.risk_level === 'CRITICAL') {
      return [
        'Soil moisture critical (saturation > 80%)',
        'Tilt rate increasing (active creep displacement)',
        'Stability indicator decreasing (FoS < 1.00)',
      ];
    }
    return [
      'Soil moisture elevated',
      'Tilt rate increasing',
      'Stability indicator decreasing',
    ];
  };

  const filteredAlerts = state.alerts.filter((alert: Alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (!showAcknowledged && alert.acknowledged) return false;
    return true;
  }).sort((a: Alert, b: Alert) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const criticalCount = state.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const highCount = state.alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;
  const unackTotal = state.alerts.filter(a => !a.acknowledged).length;

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          label: 'CRITICAL RISK',
          icon: AlertOctagon,
          className: 'bg-red-950/80 text-red-300 border-red-800/80',
          indicator: 'bg-red-500',
        };
      case 'high':
        return {
          label: 'HIGH RISK',
          icon: AlertTriangle,
          className: 'bg-orange-950/80 text-orange-300 border-orange-800/80',
          indicator: 'bg-orange-500',
        };
      case 'warning':
        return {
          label: 'MODERATE HAZARD',
          icon: Info,
          className: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          label: 'LOW HAZARD',
          icon: Info,
          className: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
          indicator: 'bg-cyan-500',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            <h1 className="text-xl font-bold font-mono text-slate-100 uppercase">Alert & Incident Command Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time threshold violation logs, hazard trigger reasons, and audit workflow for landslide warning events.
          </p>
        </div>
        <PrototypeLabel text="Incident Dispatch Active" />
      </div>

      {/* Incident Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="card p-3 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Total Logged Incidents</span>
          <span className="text-2xl font-bold text-slate-100 mt-1">{state.alerts.length}</span>
        </div>
        <div className={clsx("card p-3 flex flex-col justify-between", unackTotal > 0 ? "border-red-700/60 bg-red-950/20" : "")}>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Unacknowledged</span>
          <span className={clsx("text-2xl font-bold mt-1", unackTotal > 0 ? "text-red-400" : "text-emerald-400")}>
            {unackTotal}
          </span>
        </div>
        <div className="card p-3 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Critical Alarms</span>
          <span className={clsx("text-2xl font-bold mt-1", criticalCount > 0 ? "text-red-400" : "text-slate-300")}>
            {criticalCount}
          </span>
        </div>
        <div className="card p-3 flex flex-col justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">High Warnings</span>
          <span className={clsx("text-2xl font-bold mt-1", highCount > 0 ? "text-orange-400" : "text-slate-300")}>
            {highCount}
          </span>
        </div>
      </div>

      {/* Extensible Notification Architecture Strip */}
      <div className="card p-3.5 border-dashed border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="font-bold text-slate-200 uppercase tracking-wider block text-[11px]">
              Notification Dispatch Subsystem Architecture
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              Local System Audit & WebSocket dispatch active · Cellular SMS / WhatsApp / IVR stubs ready for future deployment.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            ● LOCAL LOG / WS (ACTIVE)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            ○ SMS / WHATSAPP / IVR (EXTENSIBLE STUBS)
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-300 uppercase tracking-wider font-mono text-[11px]">Filter Severity:</span>
          <div className="flex gap-1">
            {['all', 'critical', 'high', 'warning', 'info'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={clsx(
                  "px-2.5 py-1 rounded text-xs font-mono uppercase transition-colors",
                  filterSeverity === sev
                    ? "bg-cyan-600 text-white font-bold"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={showAcknowledged} 
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
          />
          <span>Include Acknowledged Incidents</span>
        </label>
      </div>

      {/* Incidents History Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 font-mono text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <div className="font-bold text-slate-200">NO INCIDENTS MATCHING CRITERIA</div>
            <div className="text-slate-500 text-[11px] mt-1">All monitored slope parameters are currently within normal baseline thresholds.</div>
          </div>
        ) : (
          filteredAlerts.map((alert: Alert) => {
            const badge = getSeverityBadge(alert.severity);
            const SevIcon = badge.icon;
            const reasons = getAlertReasons(alert);

            return (
              <div 
                key={alert.id}
                className={clsx(
                  "card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all border-l-4",
                  alert.acknowledged
                    ? "bg-slate-900/40 opacity-70 border-slate-700"
                    : alert.severity === 'critical'
                      ? "bg-red-950/20 border-red-500 shadow-md shadow-red-950/30"
                      : alert.severity === 'high'
                        ? "bg-orange-950/20 border-orange-500 shadow-md shadow-orange-950/20"
                        : "bg-amber-950/20 border-amber-500"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 mt-0.5 shrink-0">
                    <SevIcon className={clsx("w-5 h-5", alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'high' ? 'text-orange-400' : 'text-amber-400')} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx("badge font-mono text-[10px]", badge.className)}>
                        {badge.label}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm">
                        {alert.title}
                      </h3>
                    </div>

                    {/* Reasons list (Phase 12 requirement) */}
                    <div className="mt-2 space-y-0.5">
                      <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Reasons:</span>
                      <ul className="text-xs text-slate-300 space-y-0.5 font-sans ml-2">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-orange-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-slate-500 flex-wrap">
                      <span>ALERT ID: <strong className="text-slate-300">{alert.alert_id || `ALT-${alert.id}`}</strong></span>
                      <span>•</span>
                      <span>NODE: <strong className="text-slate-300">{alert.node_id}</strong></span>
                      <span>•</span>
                      <span>TIMESTAMP: {formatDateTime(alert.timestamp)} ({formatRelativeTime(alert.timestamp)})</span>
                      <span>•</span>
                      <span className={RISK_TEXT_CLASSES[alert.risk_level]}>
                        RISK SCORE: {(alert.risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: ACKNOWLEDGE & VIEW DETAILS */}
                <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1 text-xs font-mono text-slate-400 px-3 py-2 bg-slate-950/60 rounded border border-slate-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ACKNOWLEDGED
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded text-xs"
                    >
                      <Check size={14} /> ACKNOWLEDGE
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Detail Modal Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={clsx("font-mono text-xs font-black uppercase px-2 py-0.5 rounded border", getSeverityBadge(selectedAlert.severity).className)}>
                  {getSeverityBadge(selectedAlert.severity).label}
                </span>
                <span className="font-mono text-sm font-bold text-slate-100">
                  Incident Report ({selectedAlert.alert_id || `ALT-${selectedAlert.id}`})
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono grid grid-cols-2 gap-2 text-[11px]">
                <div>Node Identifier: <strong className="text-slate-200">{selectedAlert.node_id}</strong></div>
                <div>Hazard Score: <strong className="text-orange-400">{(selectedAlert.risk_score * 100).toFixed(1)}%</strong></div>
                <div>Event Timestamp: <span className="text-slate-300">{formatDateTime(selectedAlert.timestamp)}</span></div>
                <div>Status: <strong className={selectedAlert.acknowledged ? "text-emerald-400" : "text-red-400"}>{selectedAlert.acknowledged ? "ACKNOWLEDGED" : "PENDING ACK"}</strong></div>
              </div>

              <div>
                <span className="font-mono font-bold uppercase text-[11px] text-slate-300 block mb-1">
                  Trigger Reasons:
                </span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                  {getAlertReasons(selectedAlert).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-200">
                      <span className="text-orange-400 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-mono font-bold uppercase text-[11px] text-slate-300 block mb-1">
                  Full Diagnostic Message:
                </span>
                <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed font-sans">
                  {selectedAlert.message}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">
                Created: {formatDateTime(selectedAlert.created_at || selectedAlert.timestamp)}
              </span>
              <div className="flex gap-2">
                {!selectedAlert.acknowledged && (
                  <button
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id);
                      setSelectedAlert((prev) => prev ? { ...prev, acknowledged: true } : null);
                    }}
                    className="py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold uppercase"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;
