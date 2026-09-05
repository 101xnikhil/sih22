import { useState, useEffect } from 'react';

export interface QueuedCitizenReport {
  localId: string;
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
  queuedAt: string;
}

const OFFLINE_REPORTS_KEY = 'landguard_offline_reports_queue';

export function getQueuedReports(): QueuedCitizenReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline reports queue:', e);
    return [];
  }
}

export function queueOfflineReport(report: Omit<QueuedCitizenReport, 'localId' | 'queuedAt'>): QueuedCitizenReport {
  const queued: QueuedCitizenReport = {
    ...report,
    localId: `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    queuedAt: new Date().toISOString(),
  };

  const existing = getQueuedReports();
  existing.push(queued);
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('landguard-offline-queue-changed', { detail: existing.length }));
  return queued;
}

export function removeQueuedReport(localId: string): void {
  const existing = getQueuedReports().filter((r) => r.localId !== localId);
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(existing));
  window.dispatchEvent(new CustomEvent('landguard-offline-queue-changed', { detail: existing.length }));
}

export async function flushOfflineReports(): Promise<{ synced: number; failed: number }> {
  const queued = getQueuedReports();
  if (queued.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queued) {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: item.latitude,
          longitude: item.longitude,
          elevation_m: item.elevation_m || 0.0,
          location_name: item.location_name,
          district: item.district,
          state: item.state,
          highway_corridor: item.highway_corridor,
          category: item.category,
          severity: item.severity,
          description: item.description,
          photo_url: item.photo_url,
          reporter_type: item.reporter_type,
          reporter_name: item.reporter_name,
          contact_phone: item.contact_phone,
          is_offline_synced: true,
        }),
      });

      if (response.ok) {
        removeQueuedReport(item.localId);
        synced++;
      } else {
        failed++;
      }
    } catch (e) {
      console.warn('Network sync failed for queued item:', item.localId, e);
      failed++;
    }
  }

  window.dispatchEvent(new CustomEvent('landguard-sync-complete', { detail: { synced, failed } }));
  return { synced, failed };
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(getQueuedReports().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync when network returns
      setIsSyncing(true);
      flushOfflineReports().finally(() => setIsSyncing(false));
    };

    const handleOffline = () => setIsOnline(false);

    const handleQueueChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setPendingCount(customEvent.detail ?? getQueuedReports().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('landguard-offline-queue-changed', handleQueueChange);
    window.addEventListener('landguard-sync-complete', () => setPendingCount(getQueuedReports().length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('landguard-offline-queue-changed', handleQueueChange);
    };
  }, []);

  const triggerManualSync = async () => {
    setIsSyncing(true);
    const res = await flushOfflineReports();
    setIsSyncing(false);
    return res;
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    queueReport: queueOfflineReport,
    triggerManualSync,
  };
}
