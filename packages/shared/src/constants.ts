// Conflict zone scoring
export const CONFLICT_PROXIMITY_RADIUS_KM = 500;
export const CONFLICT_BUFFER_KM = 50;
export const DBSCAN_EPSILON_KM = 50;
export const DBSCAN_MIN_POINTS = 3;
export const CONFLICT_EVENT_LOOKBACK_DAYS = 90;

// Route scoring weights
export const SCORE_WEIGHT_PROXIMITY = 0.5;
export const SCORE_WEIGHT_SEVERITY = 0.3;
export const SCORE_WEIGHT_RECENCY = 0.2;
export const MAX_ZONE_PENALTY = 25;

// Cancellation risk weights
export const RISK_WEIGHT_CONFLICT = 0.4;
export const RISK_WEIGHT_REROUTING = 0.25;
export const RISK_WEIGHT_NOTAMS = 0.25;
export const RISK_WEIGHT_HISTORICAL = 0.1;

// Anomaly detection
export const ANOMALY_LOOKBACK_DAYS = 30;
export const ANOMALY_DETECTION_DAYS = 7;
export const ANOMALY_DEVIATION_THRESHOLD = 0.15;
export const ANOMALY_STDDEV_MULTIPLIER = 2;
export const TRACK_RESAMPLE_POINTS = 50;

// Alternative routes
export const ALTERNATIVE_SEARCH_RADIUS_KM = 800;
export const ALTERNATIVE_MAX_RESULTS = 3;
export const CRUISE_SPEED_KMH = 850;

// Polling intervals (ms)
export const FLIGHT_POLL_INTERVAL_MS = 10 * 60 * 1000;
export const CONFLICT_UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const NOTAM_UPDATE_INTERVAL_MS = 60 * 60 * 1000;
export const ADVISORY_POLL_INTERVAL_MS = 60 * 1000;

// Risk level thresholds
export const RISK_THRESHOLDS = {
  low: 30,
  moderate: 60,
  high: 80,
} as const;

export function getRiskLevel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (score < RISK_THRESHOLDS.low) return 'low';
  if (score < RISK_THRESHOLDS.moderate) return 'moderate';
  if (score < RISK_THRESHOLDS.high) return 'high';
  return 'critical';
}

// High-risk corridor bounding boxes for OpenSky polling
export const MONITORED_CORRIDORS = [
  { name: 'Middle East', minLat: 12, maxLat: 42, minLon: 25, maxLon: 65 },
  { name: 'Eastern Europe', minLat: 44, maxLat: 56, minLon: 22, maxLon: 42 },
  { name: 'East Africa', minLat: -5, maxLat: 18, minLon: 28, maxLon: 52 },
  { name: 'South China Sea', minLat: 2, maxLat: 25, minLon: 105, maxLon: 122 },
] as const;

// Great circle route interpolation
export const ROUTE_INTERPOLATION_POINTS = 100;
