import {
  greatCirclePolyline,
  polylineToGeoJSON,
  haversineDistance,
  bearing,
  bearingToCompass,
  CONFLICT_PROXIMITY_RADIUS_KM,
  SCORE_WEIGHT_PROXIMITY,
  SCORE_WEIGHT_SEVERITY,
  SCORE_WEIGHT_RECENCY,
  MAX_ZONE_PENALTY,
  ROUTE_INTERPOLATION_POINTS,
  getRiskLevel,
  pointToPolylineDistance,
} from '@frcs/shared';
import type { ConflictZone, ScoredRoute, NearbyZone } from '@frcs/shared';
import { getConflictZones } from '../services/acled.service.js';

export function scoreRoute(
  originLat: number, originLon: number,
  destLat: number, destLon: number,
  routeName: string,
  waypoints?: [number, number][]
): ScoredRoute {
  const zones = getConflictZones();

  // Build the route polyline
  let polyline: [number, number][];
  if (waypoints && waypoints.length > 0) {
    polyline = [];
    const allPoints = [[originLat, originLon] as [number, number], ...waypoints, [destLat, destLon] as [number, number]];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const segment = greatCirclePolyline(
        allPoints[i][0], allPoints[i][1],
        allPoints[i + 1][0], allPoints[i + 1][1],
        Math.floor(ROUTE_INTERPOLATION_POINTS / allPoints.length)
      );
      polyline.push(...(i > 0 ? segment.slice(1) : segment));
    }
  } else {
    polyline = greatCirclePolyline(originLat, originLon, destLat, destLon, ROUTE_INTERPOLATION_POINTS);
  }

  // Calculate total distance
  let distanceKm = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    distanceKm += haversineDistance(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1]);
  }

  // Score against conflict zones
  const nearbyZones: NearbyZone[] = [];
  let score = 100;

  for (const zone of zones) {
    const dist = pointToPolylineDistance(zone.centroidLat, zone.centroidLon, polyline);

    if (dist <= CONFLICT_PROXIMITY_RADIUS_KM) {
      const proximity = Math.max(0, CONFLICT_PROXIMITY_RADIUS_KM - dist) / CONFLICT_PROXIMITY_RADIUS_KM;
      const severity = Math.min(zone.totalFatalities / 100, 1.0);
      const daysSince = zone.lastEventDate
        ? (Date.now() - new Date(zone.lastEventDate).getTime()) / (1000 * 60 * 60 * 24)
        : 90;
      const recency = Math.max(0, 90 - daysSince) / 90;

      const penalty = (
        proximity * SCORE_WEIGHT_PROXIMITY +
        severity * SCORE_WEIGHT_SEVERITY +
        recency * SCORE_WEIGHT_RECENCY
      ) * MAX_ZONE_PENALTY;

      score -= penalty;

      const b = bearing(polyline[Math.floor(polyline.length / 2)][0], polyline[Math.floor(polyline.length / 2)][1], zone.centroidLat, zone.centroidLon);
      nearbyZones.push({
        zone,
        distanceKm: Math.round(dist),
        bearing: bearingToCompass(b),
      });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Generate reasoning
  const reasoning = generateReasoning(nearbyZones, score);

  return {
    id: `route-${routeName.toLowerCase().replace(/\s+/g, '-')}`,
    name: routeName,
    path: polylineToGeoJSON(polyline),
    score,
    riskLevel: getRiskLevel(100 - score),
    distanceKm: Math.round(distanceKm),
    nearbyZones,
    reasoning,
  };
}

function generateReasoning(nearbyZones: NearbyZone[], score: number): string {
  if (nearbyZones.length === 0) {
    return 'This route does not pass near any active conflict zones. Low risk.';
  }

  const parts: string[] = [];
  const sorted = [...nearbyZones].sort((a, b) => a.distanceKm - b.distanceKm);

  for (const nz of sorted.slice(0, 3)) {
    const dist = nz.distanceKm;
    const region = nz.zone.regionName;
    const events = nz.zone.eventCount;
    const fatalities = nz.zone.totalFatalities;

    if (dist < 100) {
      parts.push(`Route passes directly through active conflict zone in ${region} (${events} events, ${fatalities} fatalities in last 90 days).`);
    } else if (dist < 250) {
      parts.push(`Route passes within ${dist}km of conflict area in ${region} to the ${nz.bearing} (${events} events, ${fatalities} fatalities).`);
    } else {
      parts.push(`Conflict activity in ${region} is ${dist}km ${nz.bearing} of route (${events} events).`);
    }
  }

  if (nearbyZones.length > 3) {
    parts.push(`${nearbyZones.length - 3} additional conflict zones nearby.`);
  }

  return parts.join(' ');
}

export function scoreMultipleRoutes(
  originLat: number, originLon: number,
  destLat: number, destLon: number
): ScoredRoute[] {
  const routes: ScoredRoute[] = [];

  // Direct route
  routes.push(scoreRoute(originLat, originLon, destLat, destLon, 'Direct'));

  // Generate alternate waypoint routes by offsetting the midpoint
  const midLat = (originLat + destLat) / 2;
  const midLon = (originLon + destLon) / 2;
  const b = bearing(originLat, originLon, destLat, destLon);

  // Northern deviation
  const northOffset = offsetPoint(midLat, midLon, b - 90, 300);
  routes.push(scoreRoute(originLat, originLon, destLat, destLon, 'Northern deviation', [northOffset]));

  // Southern deviation
  const southOffset = offsetPoint(midLat, midLon, b + 90, 300);
  routes.push(scoreRoute(originLat, originLon, destLat, destLon, 'Southern deviation', [southOffset]));

  return routes.sort((a, b) => b.score - a.score);
}

function offsetPoint(lat: number, lon: number, bearingDeg: number, distKm: number): [number, number] {
  const dLat = (distKm / 111) * Math.cos((bearingDeg * Math.PI) / 180);
  const dLon = (distKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin((bearingDeg * Math.PI) / 180);
  return [lat + dLat, lon + dLon];
}
