import { config } from '../config.js';
import { getDb } from '../db/connection.js';
import type { FlightState } from '@frcs/shared';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string | null> {
  if (!config.opensky.clientId || !config.opensky.clientSecret) return null;
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  try {
    const resp = await fetch('https://opensky-network.org/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.opensky.clientId,
        client_secret: config.opensky.clientSecret,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { access_token: string; expires_in: number };
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch {
    return null;
  }
}

export async function fetchFlightStates(
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): Promise<FlightState[]> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${config.opensky.baseUrl}/states/all?lamin=${bbox.minLat}&lomin=${bbox.minLon}&lamax=${bbox.maxLat}&lomax=${bbox.maxLon}`;

  try {
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      console.error(`OpenSky API error: ${resp.status}`);
      return [];
    }
    const data = await resp.json() as { time: number; states: any[][] | null };
    if (!data.states) return [];

    return data.states.map(s => ({
      icao24: s[0],
      callsign: s[1]?.trim() || null,
      originCountry: s[2],
      latitude: s[6],
      longitude: s[5],
      baroAltitude: s[7],
      velocity: s[9],
      trueTrack: s[10],
      onGround: s[8],
      timestamp: s[3] || data.time,
    }));
  } catch (err) {
    console.error('OpenSky fetch error:', err);
    return [];
  }
}

export function storeFlightStates(states: FlightState[]): void {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO flight_states (icao24, callsign, origin_country, latitude, longitude, baro_altitude, velocity, true_track, on_ground, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: FlightState[]) => {
    for (const s of items) {
      insert.run(s.icao24, s.callsign, s.originCountry, s.latitude, s.longitude, s.baroAltitude, s.velocity, s.trueTrack, s.onGround ? 1 : 0, s.timestamp);
    }
  });
  tx(states);
}

export function getHistoricalFlights(
  callsignPattern: string,
  fromTimestamp: number,
  toTimestamp: number
): { icao24: string; callsign: string; points: { lat: number; lon: number; alt: number | null; heading: number | null; ts: number }[] }[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT icao24, callsign, latitude, longitude, baro_altitude, true_track, timestamp
    FROM flight_states
    WHERE callsign LIKE ?
      AND timestamp BETWEEN ? AND ?
    ORDER BY icao24, timestamp
  `).all(callsignPattern, fromTimestamp, toTimestamp) as any[];

  const flights = new Map<string, { icao24: string; callsign: string; points: any[] }>();
  for (const r of rows) {
    const key = `${r.icao24}-${r.callsign}`;
    if (!flights.has(key)) {
      flights.set(key, { icao24: r.icao24, callsign: r.callsign, points: [] });
    }
    flights.get(key)!.points.push({
      lat: r.latitude,
      lon: r.longitude,
      alt: r.baro_altitude,
      heading: r.true_track,
      ts: r.timestamp,
    });
  }
  return [...flights.values()];
}
