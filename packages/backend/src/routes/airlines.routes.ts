import type { FastifyInstance } from 'fastify';
import { getHistoricalFlights } from '../services/opensky.service.js';
import { getConflictZones } from '../services/acled.service.js';
import {
  haversineDistance,
  polylineToGeoJSON,
  getRiskLevel,
  ANOMALY_LOOKBACK_DAYS,
} from '@frcs/shared';
import type { AirlineProfile } from '@frcs/shared';

export async function airlineRoutes(app: FastifyInstance) {
  app.get('/api/airlines/profiles', async (req) => {
    const { route } = req.query as { route?: string };
    if (!route) return [];

    const now = Math.floor(Date.now() / 1000);
    const from = now - ANOMALY_LOOKBACK_DAYS * 86400;

    // Get all flights on this route from historical data
    const flights = getHistoricalFlights('%', from, now);
    if (flights.length === 0) return [];

    // Group by airline prefix
    const byAirline = new Map<string, typeof flights>();
    for (const flight of flights) {
      const airline = flight.callsign.replace(/\d+/g, '').trim();
      if (!airline) continue;
      if (!byAirline.has(airline)) byAirline.set(airline, []);
      byAirline.get(airline)!.push(flight);
    }

    const zones = getConflictZones();
    const profiles: AirlineProfile[] = [];

    for (const [icao, airlineFlights] of byAirline) {
      // Compute average path
      const avgPoints: { lat: number; lon: number }[] = [];
      const numSamples = 50;

      for (let i = 0; i < numSamples; i++) {
        let sumLat = 0, sumLon = 0, count = 0;
        for (const flight of airlineFlights) {
          const idx = Math.floor((i / numSamples) * flight.points.length);
          if (flight.points[idx]) {
            sumLat += flight.points[idx].lat;
            sumLon += flight.points[idx].lon;
            count++;
          }
        }
        if (count > 0) {
          avgPoints.push({ lat: sumLat / count, lon: sumLon / count });
        }
      }

      // Min distance to conflict zones
      let minDist = Infinity;
      let avgDist = 0;
      for (const zone of zones) {
        for (const pt of avgPoints) {
          const d = haversineDistance(pt.lat, pt.lon, zone.centroidLat, zone.centroidLon);
          if (d < minDist) minDist = d;
          avgDist += d;
        }
      }
      avgDist = zones.length > 0 && avgPoints.length > 0
        ? avgDist / (zones.length * avgPoints.length)
        : Infinity;

      const riskScore = minDist < 200 ? 80 : minDist < 500 ? 50 : 20;

      profiles.push({
        icao,
        name: icao, // Would need airline name lookup
        route,
        averagePath: polylineToGeoJSON(avgPoints.map(p => [p.lat, p.lon] as [number, number])),
        corridorPolygon: null,
        flightCount: airlineFlights.length,
        minConflictDistance: Math.round(minDist === Infinity ? 999 : minDist),
        avgConflictDistance: Math.round(avgDist === Infinity ? 999 : avgDist),
        riskLevel: getRiskLevel(riskScore),
      });
    }

    return profiles.sort((a, b) => a.minConflictDistance - b.minConflictDistance);
  });
}
