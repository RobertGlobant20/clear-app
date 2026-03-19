import { getDb } from '../db/connection.js';
import type { AirportSearchResult } from '@frcs/shared';

export function searchAirports(query: string, limit = 10): AirportSearchResult[] {
  const db = getDb();
  const q = `%${query}%`;
  const rows = db.prepare(`
    SELECT iata_code, icao_code, name, municipality, iso_country, latitude, longitude
    FROM airports
    WHERE (iata_code LIKE ? OR icao_code LIKE ? OR name LIKE ? OR municipality LIKE ?)
      AND type IN ('large_airport', 'medium_airport')
      AND iata_code IS NOT NULL
    ORDER BY
      CASE type WHEN 'large_airport' THEN 0 ELSE 1 END,
      name
    LIMIT ?
  `).all(q, q, q, q, limit) as any[];

  return rows.map(r => ({
    iataCode: r.iata_code,
    icaoCode: r.icao_code,
    name: r.name,
    municipality: r.municipality,
    country: r.iso_country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export function getAirportByCode(code: string): AirportSearchResult | null {
  const db = getDb();
  const upper = code.toUpperCase();
  const row = db.prepare(`
    SELECT iata_code, icao_code, name, municipality, iso_country, latitude, longitude
    FROM airports
    WHERE iata_code = ? OR icao_code = ?
    LIMIT 1
  `).get(upper, upper) as any;

  if (!row) return null;
  return {
    iataCode: row.iata_code,
    icaoCode: row.icao_code,
    name: row.name,
    municipality: row.municipality,
    country: row.iso_country,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export function getMajorAirportsInRadius(
  lat: number, lon: number, radiusKm: number, limit = 20
): AirportSearchResult[] {
  const db = getDb();
  // Rough bounding box filter first, then Haversine
  const degDelta = radiusKm / 111;
  const rows = db.prepare(`
    SELECT iata_code, icao_code, name, municipality, iso_country, latitude, longitude
    FROM airports
    WHERE type = 'large_airport'
      AND iata_code IS NOT NULL
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    ORDER BY name
    LIMIT ?
  `).all(
    lat - degDelta, lat + degDelta,
    lon - degDelta, lon + degDelta,
    limit * 3
  ) as any[];

  return rows
    .map(r => ({
      iataCode: r.iata_code,
      icaoCode: r.icao_code,
      name: r.name,
      municipality: r.municipality,
      country: r.iso_country,
      latitude: r.latitude,
      longitude: r.longitude,
    }))
    .slice(0, limit);
}
