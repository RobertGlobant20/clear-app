import type { ConflictZone } from './conflict.js';
import type { RiskLevel } from './flight.js';

export interface ScanRequest {
  origin: string;
  destination: string;
}

export interface ScanResponse {
  origin: { code: string; name: string; lat: number; lon: number };
  destination: { code: string; name: string; lat: number; lon: number };
  routes: ScoredRoute[];
  riskScore: RiskScore;
  alternatives: AlternativeRoute[];
}

export interface ScoredRoute {
  id: string;
  name: string;
  path: GeoJSON.LineString;
  score: number;
  riskLevel: RiskLevel;
  distanceKm: number;
  nearbyZones: NearbyZone[];
  reasoning: string;
}

export interface NearbyZone {
  zone: ConflictZone;
  distanceKm: number;
  bearing: string;
}

export interface RiskScore {
  overall: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  summary: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface AlternativeRoute {
  id: string;
  description: string;
  via: string;
  path: GeoJSON.LineString;
  score: number;
  riskLevel: RiskLevel;
  distanceKm: number;
  extraDistanceKm: number;
  extraTimeMinutes: number;
  stops: number;
  reasoning: string;
}
