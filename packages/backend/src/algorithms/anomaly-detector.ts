import {
  ANOMALY_LOOKBACK_DAYS,
  ANOMALY_DETECTION_DAYS,
  ANOMALY_DEVIATION_THRESHOLD,
  ANOMALY_STDDEV_MULTIPLIER,
  TRACK_RESAMPLE_POINTS,
  haversineDistance,
  polylineToGeoJSON,
} from '@frcs/shared';
import type { AnomalyResult } from '@frcs/shared';
import { getHistoricalFlights } from '../services/opensky.service.js';
import { getConflictZones } from '../services/acled.service.js';

export function detectAnomalies(callsignPattern: string, routeLabel: string): AnomalyResult[] {
  const now = Math.floor(Date.now() / 1000);
  const baselineStart = now - ANOMALY_LOOKBACK_DAYS * 86400;
  const detectionStart = now - ANOMALY_DETECTION_DAYS * 86400;

  // Get all historical flights for this route pattern
  const allFlights = getHistoricalFlights(callsignPattern, baselineStart, now);
  if (allFlights.length < 5) return []; // Not enough data for baseline

  // Split into baseline and recent
  const baselineFlights = allFlights.filter(f => f.points[0]?.ts < detectionStart);
  const recentFlights = allFlights.filter(f => f.points[0]?.ts >= detectionStart);

  if (baselineFlights.length < 3) return []; // Need baseline

  // Build corridor from baseline
  const corridor = buildCorridor(baselineFlights);
  if (!corridor) return [];

  // Check recent flights against corridor
  const anomalies: AnomalyResult[] = [];
  const zones = getConflictZones();

  for (const flight of recentFlights) {
    const resampled = resampleTrack(flight.points, TRACK_RESAMPLE_POINTS);
    let deviationCount = 0;
    let maxDeviation = 0;
    let maxDeviationIdx = 0;

    for (let i = 0; i < TRACK_RESAMPLE_POINTS; i++) {
      if (!resampled[i] || !corridor.mean[i]) continue;
      const dist = haversineDistance(
        resampled[i].lat, resampled[i].lon,
        corridor.mean[i].lat, corridor.mean[i].lon
      );
      if (dist > corridor.stddev[i] * ANOMALY_STDDEV_MULTIPLIER) {
        deviationCount++;
      }
      if (dist > maxDeviation) {
        maxDeviation = dist;
        maxDeviationIdx = i;
      }
    }

    const deviationScore = deviationCount / TRACK_RESAMPLE_POINTS;
    if (deviationScore > ANOMALY_DEVIATION_THRESHOLD) {
      // Check if deviation direction correlates with conflict zone
      let correlatedZone: string | null = null;
      if (resampled[maxDeviationIdx] && corridor.mean[maxDeviationIdx]) {
        for (const zone of zones) {
          const distFromDeviation = haversineDistance(
            resampled[maxDeviationIdx].lat, resampled[maxDeviationIdx].lon,
            zone.centroidLat, zone.centroidLon
          );
          const distFromCorridor = haversineDistance(
            corridor.mean[maxDeviationIdx].lat, corridor.mean[maxDeviationIdx].lon,
            zone.centroidLat, zone.centroidLon
          );
          if (distFromDeviation > distFromCorridor) {
            correlatedZone = zone.regionName;
            break;
          }
        }
      }

      const direction = getDeviationDirection(
        corridor.mean[maxDeviationIdx],
        resampled[maxDeviationIdx]
      );

      anomalies.push({
        id: `anomaly-${flight.icao24}-${flight.points[0]?.ts}`,
        airline: flight.callsign.replace(/\d+/g, ''),
        callsign: flight.callsign,
        route: routeLabel,
        detectedAt: new Date(flight.points[0]?.ts * 1000).toISOString(),
        deviationScore: Math.round(deviationScore * 100),
        maxDeviationKm: Math.round(maxDeviation),
        deviationDirection: direction,
        correlatedConflictZone: correlatedZone,
        historicalPath: polylineToGeoJSON(corridor.mean.map(p => [p.lat, p.lon] as [number, number])),
        anomalousPath: polylineToGeoJSON(resampled.map(p => [p.lat, p.lon] as [number, number])),
        reasoning: generateAnomalyReasoning(flight.callsign, maxDeviation, direction, correlatedZone, deviationScore),
      });
    }
  }

  return anomalies.sort((a, b) => b.deviationScore - a.deviationScore);
}

interface Point { lat: number; lon: number }

function buildCorridor(flights: { points: { lat: number; lon: number; ts: number }[] }[]) {
  const resampled = flights.map(f => resampleTrack(f.points, TRACK_RESAMPLE_POINTS));
  if (resampled.length === 0) return null;

  const mean: Point[] = [];
  const stddev: number[] = [];

  for (let i = 0; i < TRACK_RESAMPLE_POINTS; i++) {
    const points = resampled.map(r => r[i]).filter(Boolean);
    if (points.length === 0) {
      mean.push({ lat: 0, lon: 0 });
      stddev.push(50);
      continue;
    }
    const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const avgLon = points.reduce((s, p) => s + p.lon, 0) / points.length;
    mean.push({ lat: avgLat, lon: avgLon });

    const distances = points.map(p => haversineDistance(avgLat, avgLon, p.lat, p.lon));
    const avgDist = distances.reduce((s, d) => s + d, 0) / distances.length;
    const variance = distances.reduce((s, d) => s + (d - avgDist) ** 2, 0) / distances.length;
    stddev.push(Math.max(Math.sqrt(variance), 10)); // min 10km stddev
  }

  return { mean, stddev };
}

function resampleTrack(
  points: { lat: number; lon: number; ts: number }[],
  numPoints: number
): Point[] {
  if (points.length <= 1) return points.map(p => ({ lat: p.lat, lon: p.lon }));

  // Resample by distance progress
  let totalDist = 0;
  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    totalDist += haversineDistance(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
    cumDist.push(totalDist);
  }

  const result: Point[] = [];
  for (let i = 0; i < numPoints; i++) {
    const targetDist = (i / (numPoints - 1)) * totalDist;
    let j = 0;
    while (j < cumDist.length - 1 && cumDist[j + 1] < targetDist) j++;
    if (j >= points.length - 1) {
      result.push({ lat: points[points.length - 1].lat, lon: points[points.length - 1].lon });
    } else {
      const segLen = cumDist[j + 1] - cumDist[j];
      const t = segLen > 0 ? (targetDist - cumDist[j]) / segLen : 0;
      result.push({
        lat: points[j].lat + t * (points[j + 1].lat - points[j].lat),
        lon: points[j].lon + t * (points[j + 1].lon - points[j].lon),
      });
    }
  }
  return result;
}

function getDeviationDirection(from: Point | undefined, to: Point | undefined): string {
  if (!from || !to) return 'unknown';
  const dLat = to.lat - from.lat;
  const dLon = to.lon - from.lon;
  const parts: string[] = [];
  if (Math.abs(dLat) > 0.1) parts.push(dLat > 0 ? 'north' : 'south');
  if (Math.abs(dLon) > 0.1) parts.push(dLon > 0 ? 'east' : 'west');
  return parts.join('-') || 'minimal';
}

function generateAnomalyReasoning(
  callsign: string, maxDevKm: number, direction: string,
  conflictZone: string | null, score: number
): string {
  let text = `Flight ${callsign} deviated up to ${Math.round(maxDevKm)}km ${direction} from its historical corridor. `;
  text += `${Math.round(score * 100)}% of track points fell outside the expected envelope. `;
  if (conflictZone) {
    text += `Deviation appears to route away from conflict activity in ${conflictZone}. This suggests the airline may be avoiding the area.`;
  } else {
    text += `No direct correlation with known conflict zones detected, but the deviation warrants monitoring.`;
  }
  return text;
}
