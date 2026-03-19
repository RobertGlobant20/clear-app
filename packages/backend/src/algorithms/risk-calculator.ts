import {
  RISK_WEIGHT_CONFLICT,
  RISK_WEIGHT_REROUTING,
  RISK_WEIGHT_NOTAMS,
  RISK_WEIGHT_HISTORICAL,
  getRiskLevel,
  haversineDistance,
  greatCirclePolyline,
  pointToPolylineDistance,
} from '@frcs/shared';
import type { RiskScore, RiskFactor } from '@frcs/shared';
import { getConflictZones } from '../services/acled.service.js';
import { detectAnomalies } from './anomaly-detector.js';
import { getDb } from '../db/connection.js';

export function calculateRisk(
  originLat: number, originLon: number,
  destLat: number, destLon: number,
  routeLabel: string
): RiskScore {
  const factors: RiskFactor[] = [];

  // Factor 1: Conflict proximity (40%)
  const conflictScore = calculateConflictProximity(originLat, originLon, destLat, destLon);
  factors.push({
    name: 'Conflict Proximity',
    score: conflictScore,
    weight: RISK_WEIGHT_CONFLICT,
    description: conflictScore > 60
      ? `Route passes near active conflict zones with significant recent activity.`
      : conflictScore > 30
      ? `Some conflict activity in the broader region, but not directly on route.`
      : `No significant conflict activity near this route.`,
  });

  // Factor 2: Rerouting frequency (25%)
  const reroutingScore = calculateReroutingFrequency(routeLabel);
  factors.push({
    name: 'Rerouting Frequency',
    score: reroutingScore,
    weight: RISK_WEIGHT_REROUTING,
    description: reroutingScore > 50
      ? `Multiple airlines have deviated from normal paths on this route in the last 7 days.`
      : reroutingScore > 20
      ? `Some rerouting activity detected, but within normal variance.`
      : `Airlines are flying their standard routes.`,
  });

  // Factor 3: Active NOTAMs (25%)
  const notamScore = calculateNotamImpact(originLat, originLon, destLat, destLon);
  factors.push({
    name: 'Airspace Restrictions',
    score: notamScore,
    weight: RISK_WEIGHT_NOTAMS,
    description: notamScore > 50
      ? `Active NOTAMs restrict airspace along portions of this route.`
      : notamScore > 20
      ? `Minor airspace notices in the area, unlikely to cause cancellation.`
      : `No significant airspace restrictions affecting this route.`,
  });

  // Factor 4: Historical cancellation rate (10%)
  const historicalScore = 15; // Default moderate baseline; would use AviationStack if available
  factors.push({
    name: 'Historical Cancellation Rate',
    score: historicalScore,
    weight: RISK_WEIGHT_HISTORICAL,
    description: `Based on general route reliability data.`,
  });

  // Compute weighted overall
  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );
  const riskLevel = getRiskLevel(overall);

  const summary = generateRiskSummary(overall, riskLevel, factors);

  return { overall, riskLevel, factors, summary };
}

function calculateConflictProximity(
  originLat: number, originLon: number,
  destLat: number, destLon: number
): number {
  const zones = getConflictZones();
  const polyline = greatCirclePolyline(originLat, originLon, destLat, destLon, 50);

  let maxProximityScore = 0;
  for (const zone of zones) {
    const dist = pointToPolylineDistance(zone.centroidLat, zone.centroidLon, polyline);
    if (dist < 500) {
      const proximity = ((500 - dist) / 500) * 100;
      const weighted = proximity * (0.5 + 0.5 * zone.severityScore);
      maxProximityScore = Math.max(maxProximityScore, weighted);
    }
  }

  return Math.min(100, Math.round(maxProximityScore));
}

function calculateReroutingFrequency(routeLabel: string): number {
  // Look for anomalies that serve as rerouting signals
  const parts = routeLabel.split('-');
  if (parts.length < 2) return 0;

  const anomalies = detectAnomalies(`%`, routeLabel);
  if (anomalies.length === 0) return 10; // Low baseline
  return Math.min(100, anomalies.length * 20);
}

function calculateNotamImpact(
  originLat: number, originLon: number,
  destLat: number, destLon: number
): number {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const polyline = greatCirclePolyline(originLat, originLon, destLat, destLon, 50);

  const notams = db.prepare(`
    SELECT latitude, longitude, radius_nm FROM notams
    WHERE end_time > ? AND latitude IS NOT NULL
  `).all(now) as any[];

  let impactCount = 0;
  for (const notam of notams) {
    const dist = pointToPolylineDistance(notam.latitude, notam.longitude, polyline);
    const radiusKm = (notam.radius_nm || 50) * 1.852;
    if (dist < radiusKm + 100) {
      impactCount++;
    }
  }

  return Math.min(100, impactCount * 25);
}

function generateRiskSummary(overall: number, riskLevel: string, factors: RiskFactor[]): string {
  const level = riskLevel.toUpperCase();
  const topFactor = [...factors].sort((a, b) => (b.score * b.weight) - (a.score * a.weight))[0];

  let text = `Risk Score: ${overall}/100 (${level}). `;
  if (overall < 30) {
    text += `This route has low cancellation risk. Standard booking recommended.`;
  } else if (overall < 60) {
    text += `This itinerary has moderate cancellation risk. Consider flexible booking options. Primary concern: ${topFactor.name.toLowerCase()}.`;
  } else if (overall < 80) {
    text += `This itinerary has elevated cancellation risk based on ${topFactor.name.toLowerCase()}. Strongly recommend flexible tickets and backup options.`;
  } else {
    text += `High cancellation risk. ${topFactor.name} is a major concern. Consider alternative routes or postponing travel.`;
  }

  return text;
}
