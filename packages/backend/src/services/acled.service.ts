import { config } from '../config.js';
import { getDb } from '../db/connection.js';
import type { ConflictEvent, ConflictZone } from '@frcs/shared';
import {
  CONFLICT_EVENT_LOOKBACK_DAYS,
  DBSCAN_EPSILON_KM,
  DBSCAN_MIN_POINTS,
  CONFLICT_BUFFER_KM,
} from '@frcs/shared';
import { haversineDistance } from '@frcs/shared';

export async function fetchConflictEvents(): Promise<ConflictEvent[]> {
  if (!config.acled.apiKey || !config.acled.email) {
    console.warn('ACLED API key not configured, using seeded data');
    return [];
  }

  const since = new Date();
  since.setDate(since.getDate() - CONFLICT_EVENT_LOOKBACK_DAYS);
  const sinceStr = since.toISOString().split('T')[0];

  const params = new URLSearchParams({
    key: config.acled.apiKey,
    email: config.acled.email,
    event_date: `${sinceStr}|${new Date().toISOString().split('T')[0]}`,
    event_date_where: 'BETWEEN',
    event_type: 'Battles|Explosions/Remote violence',
    limit: '5000',
  });

  try {
    const resp = await fetch(`${config.acled.baseUrl}?${params}`);
    if (!resp.ok) {
      console.error(`ACLED API error: ${resp.status}`);
      return [];
    }
    const data = await resp.json() as { data: any[] };
    return data.data.map((e: any) => ({
      id: parseInt(e.data_id),
      eventDate: e.event_date,
      eventType: e.event_type,
      subEventType: e.sub_event_type,
      actor1: e.actor1,
      country: e.country,
      admin1: e.admin1,
      latitude: parseFloat(e.latitude),
      longitude: parseFloat(e.longitude),
      fatalities: parseInt(e.fatalities),
      notes: e.notes,
    }));
  } catch (err) {
    console.error('ACLED fetch error:', err);
    return [];
  }
}

export function storeConflictEvents(events: ConflictEvent[]): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO conflict_events (id, event_date, event_type, sub_event_type, actor1, country, admin1, latitude, longitude, fatalities, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: ConflictEvent[]) => {
    for (const e of items) {
      upsert.run(e.id, e.eventDate, e.eventType, e.subEventType, e.actor1, e.country, e.admin1, e.latitude, e.longitude, e.fatalities, e.notes);
    }
  });
  tx(events);
}

export function getConflictZones(): ConflictZone[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM conflict_zones ORDER BY severity_score DESC
  `).all() as any[];
  return rows.map(r => ({
    id: r.id,
    centroidLat: r.centroid_lat,
    centroidLon: r.centroid_lon,
    radiusKm: r.radius_km,
    severityScore: r.severity_score,
    eventCount: r.event_count,
    totalFatalities: r.total_fatalities,
    regionName: r.region_name,
    geojson: JSON.parse(r.geojson),
    lastEventDate: r.last_event_date,
  }));
}

export function computeConflictZones(): void {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - CONFLICT_EVENT_LOOKBACK_DAYS);
  const sinceStr = since.toISOString().split('T')[0];

  const events = db.prepare(`
    SELECT * FROM conflict_events
    WHERE event_date >= ?
      AND (event_type = 'Battles' OR event_type = 'Explosions/Remote violence')
      AND fatalities > 0
  `).all(sinceStr) as any[];

  // DBSCAN clustering
  const clusters = dbscan(
    events.map(e => ({ lat: e.latitude, lon: e.longitude, event: e })),
    DBSCAN_EPSILON_KM,
    DBSCAN_MIN_POINTS
  );

  // Clear old zones and insert new ones
  db.prepare('DELETE FROM conflict_zones').run();
  const insert = db.prepare(`
    INSERT INTO conflict_zones (centroid_lat, centroid_lon, radius_km, severity_score, event_count, total_fatalities, region_name, geojson, last_event_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const cluster of clusters) {
      const lats = cluster.map(p => p.lat);
      const lons = cluster.map(p => p.lon);
      const centLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centLon = lons.reduce((a, b) => a + b, 0) / lons.length;

      let maxDist = 0;
      for (const p of cluster) {
        const d = haversineDistance(centLat, centLon, p.lat, p.lon);
        if (d > maxDist) maxDist = d;
      }

      const totalFatalities = cluster.reduce((sum, p) => sum + (p.event.fatalities || 0), 0);
      const severity = Math.min(totalFatalities / 100, 1) * 0.6 + Math.min(cluster.length / 50, 1) * 0.4;
      const region = cluster[0].event.country + (cluster[0].event.admin1 ? `, ${cluster[0].event.admin1}` : '');
      const lastDate = cluster.map(p => p.event.event_date).sort().pop() || '';

      // Simple circle GeoJSON
      const radiusKm = Math.max(maxDist + CONFLICT_BUFFER_KM, CONFLICT_BUFFER_KM);
      const geojson = makeCirclePolygon(centLat, centLon, radiusKm);

      insert.run(centLat, centLon, radiusKm, severity, cluster.length, totalFatalities, region, JSON.stringify(geojson), lastDate);
    }
  });
  tx();
}

interface ClusterPoint {
  lat: number;
  lon: number;
  event: any;
}

function dbscan(points: ClusterPoint[], epsilonKm: number, minPoints: number): ClusterPoint[][] {
  const visited = new Set<number>();
  const clusters: ClusterPoint[][] = [];
  const noise = new Set<number>();

  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);

    const neighbors = regionQuery(points, i, epsilonKm);
    if (neighbors.length < minPoints) {
      noise.add(i);
      continue;
    }

    const cluster: ClusterPoint[] = [points[i]];
    const queue = [...neighbors];
    const inCluster = new Set<number>([i]);

    while (queue.length > 0) {
      const j = queue.pop()!;
      if (!visited.has(j)) {
        visited.add(j);
        const jNeighbors = regionQuery(points, j, epsilonKm);
        if (jNeighbors.length >= minPoints) {
          queue.push(...jNeighbors);
        }
      }
      if (!inCluster.has(j)) {
        inCluster.add(j);
        cluster.push(points[j]);
        noise.delete(j);
      }
    }
    clusters.push(cluster);
  }

  return clusters;
}

function regionQuery(points: ClusterPoint[], idx: number, epsilonKm: number): number[] {
  const neighbors: number[] = [];
  const p = points[idx];
  for (let i = 0; i < points.length; i++) {
    if (i === idx) continue;
    if (haversineDistance(p.lat, p.lon, points[i].lat, points[i].lon) <= epsilonKm) {
      neighbors.push(i);
    }
  }
  return neighbors;
}

function makeCirclePolygon(lat: number, lon: number, radiusKm: number, steps = 32): GeoJSON.Polygon {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / 111) * Math.cos(angle);
    const dLon = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    coords.push([lon + dLon, lat + dLat]);
  }
  return { type: 'Polygon', coordinates: [coords] };
}
