export type AdvisoryType = 'notam' | 'conflict' | 'anomaly' | 'closure';

export interface Advisory {
  id: string;
  type: AdvisoryType;
  title: string;
  description: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number | null;
  severity: 'info' | 'warning' | 'critical';
  issuedAt: string;
  expiresAt: string | null;
  source: string;
}

export interface Notam {
  id: string;
  location: string;
  latitude: number;
  longitude: number;
  radiusNm: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface AnomalyResult {
  id: string;
  airline: string;
  callsign: string;
  route: string;
  detectedAt: string;
  deviationScore: number;
  maxDeviationKm: number;
  deviationDirection: string;
  correlatedConflictZone: string | null;
  historicalPath: GeoJSON.LineString;
  anomalousPath: GeoJSON.LineString;
  reasoning: string;
}
