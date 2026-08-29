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
import EmergencySmsBroadcastPanel from '../components/dashboard/EmergencySmsBroadcastPanel';
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
          className: 'bg-red-100 text-red-700 border-red-200',
          indicator: 'bg-red-500',
        };
      case 'high':
        return {
          label: 'HIGH RISK',
          icon: AlertTriangle,
          className: 'bg-orange-100 text-orange-700 border-orange-200',
          indicator: 'bg-orange-500',
        };
      case 'warning':
        return {
          label: 'MODERATE HAZARD',
          icon: Info,
          className: 'bg-amber-100 text-amber-700 border-amber-200',
          indicator: 'bg-amber-500',
        };
      default:
        return {
          label: 'LOW HAZARD',
          icon: Info,
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          indicator: 'bg-emerald-500',
        };
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-[#0f172a] tracking-tight">Alert & Incident Command Center</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time threshold violation logs, hazard trigger reasons, and automated public emergency dispatch.
          </p>
        </div>
        <PrototypeLabel text="Incident Dispatch Active" />
      </div>

      {/* Incident Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Logged</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] mt-1 font-mono">{state.alerts.length}</span>
        </div>
        <div className={clsx("card p-4 flex flex-col justify-between", unackTotal > 0 ? "border-red-200 bg-red-50/40" : "")}>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unacknowledged</span>
          <span className={clsx("text-2xl sm:text-3xl font-extrabold mt-1 font-mono", unackTotal > 0 ? "text-red-600" : "text-emerald-600")}>
            {unackTotal}
          </span>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Alarms</span>
          <span className={clsx("text-2xl sm:text-3xl font-extrabold mt-1 font-mono", criticalCount > 0 ? "text-red-600" : "text-slate-800")}>
            {criticalCount}
          </span>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High Warnings</span>
          <span className={clsx("text-2xl sm:text-3xl font-extrabold mt-1 font-mono", highCount > 0 ? "text-orange-600" : "text-slate-800")}>
            {highCount}
          </span>
        </div>
      </div>

      {/* Emergency SMS & Cell Broadcast Hub */}
      <EmergencySmsBroadcastPanel />

      {/* Filter Toolbar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">Filter Severity:</span>
          <div className="flex gap-1.5">
            {['all', 'critical', 'high', 'warning', 'info'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={clsx(
                  "px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-colors",
                  filterSeverity === sev
                    ? "bg-[#2563eb] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none font-medium">
          <input 
            type="checkbox" 
            checked={showAcknowledged} 
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-0"
          />
          <span>Include Acknowledged Incidents</span>
        </label>
      </div>

      {/* Incidents History Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="card p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-[#10b981] mx-auto mb-2 opacity-90" />
            <div className="font-bold text-slate-800 text-sm">NO INCIDENTS MATCHING CRITERIA</div>
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
                    ? "bg-slate-50/60 opacity-80 border-slate-300"
                    : alert.severity === 'critical'
                      ? "bg-red-50/30 border-red-500 shadow-sm"
                      : alert.severity === 'high'
                        ? "bg-orange-50/30 border-orange-500 shadow-sm"
                        : "bg-amber-50/30 border-amber-500"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 mt-0.5 shrink-0">
                    <SevIcon className={clsx("w-5 h-5", alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-amber-600')} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx("badge font-bold text-[10px]", badge.className)}>
                        {badge.label}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {alert.title}
                      </h3>
                    </div>

                    {/* Reasons list */}
                    <div className="mt-2 space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Reasons:</span>
                      <ul className="text-xs text-slate-700 space-y-0.5 font-sans ml-2">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-orange-500 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 flex-wrap">
                      <span>ALERT ID: <strong className="text-slate-700 font-mono">{alert.alert_id || `ALT-${alert.id}`}</strong></span>
                      <span>•</span>
                      <span>NODE: <strong className="text-slate-700 font-mono">{alert.node_id}</strong></span>
                      <span>•</span>
                      <span>TIMESTAMP: {formatDateTime(alert.timestamp)} ({formatRelativeTime(alert.timestamp)})</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">
                        RISK SCORE: {(alert.risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: ACKNOWLEDGE & VIEW DETAILS */}
                <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                  <button
                    onClick={() => setSelectedAlert(alert)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Eye size={13} /> View Details
                  </button>

                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500 px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACKNOWLEDGED
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-4 py-2 bg-[#10b981] hover:bg-emerald-600 text-white font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-xl text-xs shadow-sm"
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

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#e5e9f2] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={clsx("badge font-bold text-xs", getSeverityBadge(selectedAlert.severity).className)}>
                  {getSeverityBadge(selectedAlert.severity).label}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Alert Details ({selectedAlert.alert_id || `ALT-${selectedAlert.id}`})
                </span>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2.5 font-mono text-[11px]">
                <div>Node ID: <strong className="text-slate-900">{selectedAlert.node_id}</strong></div>
                <div>Risk Score: <strong className="text-orange-600 font-bold">{(selectedAlert.risk_score * 100).toFixed(1)}%</strong></div>
                <div>Timestamp: <span className="text-slate-700">{formatDateTime(selectedAlert.timestamp)}</span></div>
                <div>Status: <strong className={selectedAlert.acknowledged ? "text-emerald-600" : "text-red-600"}>{selectedAlert.acknowledged ? "ACKNOWLEDGED" : "PENDING"}</strong></div>
              </div>

              <div>
                <span className="font-bold uppercase text-[11px] text-slate-700 block mb-1">
                  Trigger Reasons:
                </span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  {getAlertReasons(selectedAlert).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-800">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold uppercase text-[11px] text-slate-700 block mb-1">
                  Message:
                </span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-sans">
                  {selectedAlert.message}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">
                Created: {formatDateTime(selectedAlert.created_at || selectedAlert.timestamp)}
              </span>
              <div className="flex gap-2">
                {!selectedAlert.acknowledged && (
                  <button
                    onClick={() => {
                      acknowledgeAlert(selectedAlert.id);
                      setSelectedAlert((prev) => prev ? { ...prev, acknowledged: true } : null);
                    }}
                    className="py-1.5 px-3.5 rounded-xl bg-[#10b981] hover:bg-emerald-600 text-white font-bold text-xs shadow-sm"
                  >
                    Acknowledge
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="py-1.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
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
