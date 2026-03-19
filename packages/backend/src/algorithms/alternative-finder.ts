import {
  ALTERNATIVE_SEARCH_RADIUS_KM,
  ALTERNATIVE_MAX_RESULTS,
  CRUISE_SPEED_KMH,
  haversineDistance,
  getRiskLevel,
} from '@frcs/shared';
import type { AlternativeRoute } from '@frcs/shared';
import { getMajorAirportsInRadius } from '../services/airports.service.js';
import { scoreRoute } from './route-scorer.js';

export function findAlternatives(
  originLat: number, originLon: number,
  destLat: number, destLon: number,
  originCode: string, destCode: string,
  directScore: number
): AlternativeRoute[] {
  const directDist = haversineDistance(originLat, originLon, destLat, destLon);
  const candidates: AlternativeRoute[] = [];

  // Find hub airports between origin and destination
  const midLat = (originLat + destLat) / 2;
  const midLon = (originLon + destLon) / 2;

  const hubAirports = getMajorAirportsInRadius(midLat, midLon, ALTERNATIVE_SEARCH_RADIUS_KM, 30);

  // Also search near origin and destination for different hub connections
  const nearOrigin = getMajorAirportsInRadius(originLat, originLon, ALTERNATIVE_SEARCH_RADIUS_KM, 10);
  const nearDest = getMajorAirportsInRadius(destLat, destLon, ALTERNATIVE_SEARCH_RADIUS_KM, 10);
  const allHubs = [...hubAirports, ...nearOrigin, ...nearDest];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueHubs = allHubs.filter(h => {
    if (seen.has(h.iataCode)) return false;
    if (h.iataCode === originCode || h.iataCode === destCode) return false;
    seen.add(h.iataCode);
    return true;
  });

  for (const hub of uniqueHubs) {
    // Score the two-leg route through this hub
    const leg1 = scoreRoute(originLat, originLon, hub.latitude, hub.longitude, `via ${hub.iataCode} (leg 1)`);
    const leg2 = scoreRoute(hub.latitude, hub.longitude, destLat, destLon, `via ${hub.iataCode} (leg 2)`);

    const combinedScore = Math.round((leg1.score + leg2.score) / 2);
    const totalDist = leg1.distanceKm + leg2.distanceKm;
    const extraDist = totalDist - directDist;
    const extraTime = Math.round((extraDist / CRUISE_SPEED_KMH) * 60) + 60; // +60 min for connection

    // Only include if it's meaningfully safer
    if (combinedScore > directScore + 5) {
      candidates.push({
        id: `alt-${hub.iataCode.toLowerCase()}`,
        description: `Route via ${hub.name} (${hub.iataCode})`,
        via: hub.iataCode,
        path: leg1.path, // Simplified: just show first leg for preview
        score: combinedScore,
        riskLevel: getRiskLevel(100 - combinedScore),
        distanceKm: Math.round(totalDist),
        extraDistanceKm: Math.round(extraDist),
        extraTimeMinutes: extraTime,
        stops: 1,
        reasoning: `Routing through ${hub.municipality || hub.name} (${hub.iataCode}) avoids ${summarizeAvoidedZones(leg1, leg2)}. Adds ${Math.round(extraDist)}km and approximately ${extraTime} minutes including connection time.`,
      });
    }
  }

  // Sort by combined metric: safety + efficiency
  candidates.sort((a, b) => {
    const aMetric = a.score * 0.6 + (1 / (a.distanceKm / directDist)) * 100 * 0.3 + (a.stops === 0 ? 10 : 0) * 0.1;
    const bMetric = b.score * 0.6 + (1 / (b.distanceKm / directDist)) * 100 * 0.3 + (b.stops === 0 ? 10 : 0) * 0.1;
    return bMetric - aMetric;
  });

  return candidates.slice(0, ALTERNATIVE_MAX_RESULTS);
}

function summarizeAvoidedZones(leg1: ReturnType<typeof scoreRoute>, leg2: ReturnType<typeof scoreRoute>): string {
  const allZones = [...leg1.nearbyZones, ...leg2.nearbyZones];
  if (allZones.length === 0) return 'the most congested airspace';

  const regions = [...new Set(allZones.map(z => z.zone.regionName.split(',')[0].trim()))];
  if (regions.length <= 2) return `conflict areas in ${regions.join(' and ')}`;
  return `conflict areas in ${regions.slice(0, 2).join(', ')} and ${regions.length - 2} other regions`;
}
