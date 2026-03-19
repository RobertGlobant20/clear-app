export interface FlightState {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  latitude: number;
  longitude: number;
  baroAltitude: number | null;
  velocity: number | null;
  trueTrack: number | null;
  onGround: boolean;
  timestamp: number;
}

export interface FlightTrack {
  icao24: string;
  callsign: string;
  points: TrackPoint[];
}

export interface TrackPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  heading: number | null;
  velocity: number | null;
  timestamp: number;
}

export interface AirlineProfile {
  icao: string;
  name: string;
  route: string;
  averagePath: GeoJSON.LineString;
  corridorPolygon: GeoJSON.Polygon | null;
  flightCount: number;
  minConflictDistance: number;
  avgConflictDistance: number;
  riskLevel: RiskLevel;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
