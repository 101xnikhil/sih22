import React, { useState, useEffect } from 'react';
import { 
  Camera, MapPin, AlertTriangle, ShieldCheck, CheckCircle, 
  Clock, Filter, RefreshCw, Radio, Phone, User, ExternalLink,
  ChevronRight, ArrowUpRight, UploadCloud, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useOfflineSync, getQueuedReports } from '../utils/offlineSync';
import { useLanguage } from '../utils/i18n';
import ReportIncidentModal from '../components/reports/ReportIncidentModal';

interface ReportItem {
  id: number;
  report_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  location_name: string;
  district: string;
  state: string;
  highway_corridor?: string;
  category: string;
  severity: string;
  description: string;
  photo_url?: string;
  reporter_type: string;
  reporter_name?: string;
  contact_phone?: string;
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  status: string;
  is_offline_synced: boolean;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  GROUND_CRACKS: { label: 'Tension Cracks', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800' },
  SLOPE_SLUMP: { label: 'Slope Slump', color: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-800' },
  ROCKFALL: { label: 'Rockfall on Highway', color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800' },
  BLOCKED_ROAD: { label: 'Blocked Road / Mudflow', color: 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800' },
  RIVER_DAMMING: { label: 'River Impoundment', color: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800' },
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800',
  MODERATE: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800',
  HIGH: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
  CRITICAL: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800',
};

const CitizenReportsPage: React.FC = () => {
  const { t } = useLanguage();
  const { isOnline, pendingCount, isSyncing, triggerManualSync } = useOfflineSync();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = '/api/reports?limit=50';
      if (selectedState !== 'ALL') url += `&state=${encodeURIComponent(selectedState)}`;
      if (selectedSeverity !== 'ALL') url += `&severity=${selectedSeverity}`;
      if (verifiedOnly) url += '&verified_only=true';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.warn('Failed to load reports from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedState, selectedSeverity, verifiedOnly]);

  // Statistics
  const totalReports = reports.length;
  const blockedRoadCount = reports.filter((r) => r.category === 'BLOCKED_ROAD').length;
  const verifiedCount = reports.filter((r) => r.is_verified).length;
  const criticalCount = reports.filter((r) => r.severity === 'CRITICAL').length;

  return (
    <div className="space-y-4 font-sans animate-fade-in pb-12">
      {/* ── Page Header & Action Bar ────────────────────────────── */}
      <div className="card p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {t('citizenFieldReports')}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 text-[10.5px] font-mono font-bold">
                NER Crowdsourced
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Real-time ground-truth verification of slope cracks, boulder roll, and highway blockages across the North Eastern Region.
            </p>
          </div>
        </div>

        {/* Action Controls & Offline Sync Pill */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Offline Sync Status Badge */}
          <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
            isOnline 
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
          )}>
            <Radio className={clsx("w-3.5 h-3.5", !isOnline && "animate-pulse")} />
            <span>{isOnline ? 'Cloud Synced' : `Offline Buffer (${pendingCount} Queued)`}</span>
            {!isOnline && pendingCount > 0 && (
              <button
                type="button"
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="ml-1 px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800 rounded text-[10px] font-bold uppercase hover:bg-amber-300"
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>{t('reportIncidentBtn')}</span>
          </button>
        </div>
      </div>

      {/* ── Summary KPI Tiles ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3.5 bg-white dark:bg-slate-900">
          <div className="text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Ground Reports</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">{totalReports}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Crowdsourced &amp; BRO Patrols</div>
        </div>

        <div className="card p-3.5 bg-white dark:bg-slate-900">
          <div className="text-[10.5px] uppercase font-bold text-rose-600 dark:text-rose-400">Active Road Blockages</div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">{blockedRoadCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">NH-10 &amp; NH-102B Impacted</div>
        </div>

        <div className="card p-3.5 bg-white dark:bg-slate-900">
          <div className="text-[10.5px] uppercase font-bold text-amber-600 dark:text-amber-400">Critical Severity</div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-1">{criticalCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Imminent Slide Threat</div>
        </div>

        <div className="card p-3.5 bg-white dark:bg-slate-900">
          <div className="text-[10.5px] uppercase font-bold text-emerald-600 dark:text-emerald-400">DDMA Verified</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">{verifiedCount}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Confirmed by Authorities</div>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────────────── */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter Reports:</span>
          </span>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 font-semibold text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All NER States</option>
            <option value="Assam">Assam</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Manipur">Manipur</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Mizoram">Mizoram</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl text-slate-800 dark:text-slate-200 font-semibold text-xs focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>

          {/* Verified Only Pill */}
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-white/10 px-3 py-1.5 rounded-xl font-semibold text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <span>DDMA Verified Only</span>
          </label>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-all border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5 text-blue-600", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Reports Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="card p-12 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs">Loading crowdsourced ground-truth observations...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No field reports match your filter criteria.</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to report ground cracks or slope hazards in this sector.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const catInfo = CATEGORY_LABELS[report.category] || { label: report.category, color: 'bg-slate-100 text-slate-700' };
            const sevColor = SEVERITY_COLORS[report.severity] || 'text-slate-700 bg-slate-100';

            return (
              <div 
                key={report.report_id} 
                className="card overflow-hidden flex flex-col justify-between hover:shadow-md transition-all border-slate-200 dark:border-white/10"
              >
                <div>
                  {/* Photo Thumbnail if present */}
                  {report.photo_url ? (
                    <div 
                      onClick={() => setActivePhotoModal(report.photo_url || null)}
                      className="w-full h-44 relative bg-slate-100 dark:bg-slate-900 cursor-pointer group overflow-hidden"
                    >
                      <img 
                        src={report.photo_url} 
                        alt={report.location_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                        <span className="text-[10px] text-white/90 font-mono font-bold flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                          <Camera className="w-3 h-3" /> Click to enlarge photo
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-400 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span>Field Geotagged Vector Observation</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-2.5 text-xs">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={clsx("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", catInfo.color)}>
                        {catInfo.label}
                      </span>
                      <span className={clsx("px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase", sevColor)}>
                        {report.severity}
                      </span>
                    </div>

                    {/* Location & Corridor */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {report.location_name}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>{report.district}, {report.state}</span>
                        {report.highway_corridor && (
                          <span className="ml-1 px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded font-mono font-bold text-[9.5px]">
                            {report.highway_corridor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Observation Description */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                      {report.description}
                    </p>

                    {/* GPS Coordinates & Altitude */}
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                      <span>GPS: {report.latitude.toFixed(4)}° N, {report.longitude.toFixed(4)}° E</span>
                      <span>Elev: {report.elevation_m}m</span>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/10 text-[10.5px] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      {report.reporter_name}
                    </span>
                    <span className="text-[9.5px] text-slate-400 uppercase">
                      {report.reporter_type.replace('_', ' ')}
                    </span>
                  </div>

                  {report.is_verified ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>DDMA Verified</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Review Pending</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Photo Enlarge Modal ──────────────────────────────────── */}
      {activePhotoModal && (
        <div 
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-[10001] bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <img src={activePhotoModal} alt="Enlarged Field Evidence" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* ── Submission Modal ─────────────────────────────────────── */}
      <ReportIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReportSubmitted={fetchReports}
      />
    </div>
  );
};

export default CitizenReportsPage;
