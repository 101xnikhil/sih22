// ─── Operational Data Source Mode ─────────────────────────────
export type DataSourceMode = 'SIMULATION' | 'HARDWARE' | 'DEMO';

// ─── Physical Demonstration Experiment Types (Phase 11) ────────
export type DemoStageId = 1 | 2 | 3 | 4;

export interface DemoStage {
  stage_id: DemoStageId;
  name: string;
  title: string;
  description: string;
  expected_moisture_pct: number;
  expected_rainfall_pct: number;
  expected_rainfall_24h_mm: number;
  expected_tilt_deg: number;
  expected_tilt_rate_deg_min: number;
  expected_risk_level: RiskLevel;
  expected_fos_range: [number, number];
  rain_detected: boolean;
  milestones?: string[];
}

export interface DemoTimelineEvent {
  id: string;
  timestamp: string;
  event: string;
  stage: number;
  status: string;
  risk_level: RiskLevel;
  description: string;
  disclaimer: string;
}

export interface DemoStatus {
  demo_mode: boolean;
  disclaimer: string;
  honest_prototype_notice: string;
  current_stage: DemoStageId;
  stage_info: DemoStage;
  all_stages: DemoStage[];
  is_running_auto: boolean;
  event_timeline: DemoTimelineEvent[];
  node_id: string;
  risk_transition: RiskLevel[];
}

// ─── SIH Demo Controlled States (Phase 17) ───────────────────────
export type SihDemoStateKey = 'NORMAL' | 'RAIN' | 'HEAVY_RAIN' | 'SATURATION' | 'SLOPE_MOVEMENT' | 'CRITICAL';

export interface SihDemoStateInfo {
  key: SihDemoStateKey;
  label: string;
  shortLabel: string;
  description: string;
  moisture_pct: number;
  rainfall_pct: number;
  rainfall_24h_mm: number;
  tilt_deg: number;
  tilt_rate_deg_min: number;
  risk_level: RiskLevel;
  fos: number;
  rain_detected: boolean;
  milestone: string;
}

// ─── Risk Levels ─────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

// ─── Sensor Status ───────────────────────────────────────────
export type SensorStatus = 'online' | 'degraded' | 'offline';

// ─── Alert Severity ──────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical';

// ─── Telemetry Reading ───────────────────────────────────────
export interface TelemetryReading {
  node_id: string;
  timestamp: string; // ISO 8601
  seq_num: number;
  soil_moisture: number; // raw ADC 0–4095
  soil_moisture_pct: number; // calibrated 0–100 %
  rainfall: number; // raw ADC
  rainfall_pct: number; // calibrated intensity 0–100 %
  rainfall_24h_mm: number; // cumulative 24h (simulated mm)
  rain_detected: boolean;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  tilt_angle: number; // degrees
  tilt_rate: number; // degrees per minute
  battery_mv: number;
  battery_pct: number;
  rssi_dbm: number;
  snr_db: number;
  sensor_status: SensorStatus;
  is_hardware?: boolean;
}

// ─── Risk Assessment ─────────────────────────────────────────
export interface RiskAssessment {
  timestamp: string;
  risk_score: number; // 0.0 – 1.0
  risk_level: RiskLevel;
  confidence: number; // 0.0 – 1.0
  trend: 'rising' | 'falling' | 'stable';
  fos_estimate: number; // Factor of Safety
  features: Record<string, number>;
  shap_values: ShapValue[];
  model_version: string;
}

// ─── SHAP Value ──────────────────────────────────────────────
export interface ShapValue {
  feature: string;
  display_name: string;
  value: number; // raw feature value
  contribution: number; // SHAP contribution (signed)
  impact?: 'positive' | 'negative';
}

// ─── Alert ───────────────────────────────────────────────────
export interface Alert {
  id: string;
  alert_id?: string;
  timestamp: string;
  created_at?: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  node_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  trigger_reason?: string;
  trigger_reasons?: string[];
  acknowledged: boolean;
  acknowledged_at?: string;
  sms_sent?: boolean;
  sms_sent_at?: string | null;
  sms_error?: string | null;
}

// ─── Sensor Node ─────────────────────────────────────────────
export interface SensorNode {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    altitude_m: number;
    description: string;
  };
  status: SensorStatus;
  last_seen: string;
  firmware_version: string;
  uptime_hours: number;
  reading_interval_s: number;
  sensors: {
    soil_moisture: boolean;
    accelerometer: boolean;
    rain_gauge: boolean;
  };
}

// ─── Combined Live State ─────────────────────────────────────
export interface LiveState {
  node: SensorNode;
  currentReading: TelemetryReading;
  currentRisk: RiskAssessment;
  readingHistory: TelemetryReading[];
  riskHistory: RiskAssessment[];
  alerts: Alert[];
  events: SystemEvent[];
  isConnected: boolean;
  lastUpdated: string;
  mode: DataSourceMode;
  isHardwareActive: boolean;
  packetsReceived: number;
}

// ─── System Event ────────────────────────────────────────────
export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'reading' | 'risk_change' | 'alert' | 'node_status' | 'system';
  title: string;
  description: string;
  severity?: AlertSeverity;
}

// ─── Chart Data Point ────────────────────────────────────────
export interface ChartDataPoint {
  time: string;
  timestamp: number;
  soil_moisture: number;
  rainfall: number;
  tilt_angle: number;
  tilt_rate: number;
  risk_score: number;
  fos: number;
}

// ─── Settings ────────────────────────────────────────────────
export interface SystemSettings {
  dataSource: DataSourceMode;
  mockScenario: 'dry_stable' | 'moderate_rain' | 'heavy_rain' | 'crisis' | 'escalation';
  updateIntervalMs: number;
  backendWsUrl: string;
  alertThresholds: {
    high: number; // risk score threshold for HIGH
    critical: number; // risk score threshold for CRITICAL
  };
  fosParameters: {
    cohesion_kpa: number;
    friction_angle_deg: number;
    unit_weight_kn_m3: number;
    depth_m: number;
  };
}

// ─── Visual Helpers ──────────────────────────────────────────
export const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#10b981',
  MODERATE: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export const RISK_BG_CLASSES: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-500/20 border-emerald-500/30',
  MODERATE: 'bg-amber-500/20 border-amber-500/30',
  HIGH: 'bg-orange-500/20 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 border-red-500/30',
};

export const RISK_TEXT_CLASSES: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MODERATE: 'text-amber-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

export const RISK_GLOW_CLASSES: Record<RiskLevel, string> = {
  LOW: 'glow-low',
  MODERATE: 'glow-moderate',
  HIGH: 'glow-high',
  CRITICAL: 'glow-critical',
};

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#06b6d4',
  warning: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

// ─── Phase 13: Offline Connection State ───────────────────────
export type ConnectionState = 'ONLINE' | 'DEGRADED' | 'OFFLINE';

// ─── Phase 14: Security Subsystem Types ───────────────────────
export type SecurityAction = 'ACCEPTED' | 'REJECTED_REPLAY' | 'REJECTED_UNAUTHORIZED' | 'REJECTED_CHECKSUM';

export interface SecurityEvent {
  id: string | number;
  timestamp: string;
  node_id: string;
  sequence_num?: number;
  action: SecurityAction;
  reason: string;
  client_ip?: string;
}

export interface SecurityStatus {
  is_active: boolean;
  replay_protection_enabled: boolean;
  authorized_nodes: string[];
  last_sequence_by_node: Record<string, number>;
  total_events_logged: number;
}
