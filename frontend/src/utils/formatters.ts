import { RiskLevel } from '../types';

/** Format a number with fixed decimal places */
export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

/** Format percentage */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format a timestamp to time string (HH:MM:SS) */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Format a timestamp to short time (HH:MM) */
export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format a timestamp to date + time */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Format relative time (e.g., "2 min ago") */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return formatDateTime(iso);
}

/** Get risk level from score */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.75) return 'CRITICAL';
  if (score >= 0.50) return 'HIGH';
  if (score >= 0.25) return 'MODERATE';
  return 'LOW';
}

/** Get risk level label */
export function getRiskLabel(level: RiskLevel): string {
  return level;
}

/** Format battery voltage */
export function formatBattery(mv: number): string {
  return `${(mv / 1000).toFixed(2)}V`;
}

/** Format signal strength */
export function formatRSSI(dbm: number): string {
  return `${dbm} dBm`;
}

/** Format degrees */
export function formatDegrees(deg: number, decimals = 1): string {
  return `${deg.toFixed(decimals)}°`;
}

/** Signal quality from RSSI */
export function getSignalQuality(rssi: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (rssi > -60) return 'excellent';
  if (rssi > -75) return 'good';
  if (rssi > -90) return 'fair';
  return 'poor';
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
