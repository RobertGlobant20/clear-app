import { getDb } from '../db/connection.js';
import type { Notam, Advisory } from '@frcs/shared';

// NASA DIP provides FAA NOTAM data publicly
const NOTAM_API_URL = 'https://external-api.faa.gov/notamapi/v1/notams';

export async function fetchNotams(
  lat: number, lon: number, radiusNm = 100
): Promise<Notam[]> {
  // FAA NOTAM API - may require registration
  // For now, return data from DB (seeded)
  try {
    const params = new URLSearchParams({
      locationLatitude: lat.toString(),
      locationLongitude: lon.toString(),
      locationRadius: radiusNm.toString(),
    });
    const resp = await fetch(`${NOTAM_API_URL}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) return getStoredNotams();

    const data = await resp.json() as { items?: any[] };
    if (!data.items) return getStoredNotams();

    return data.items.map((item: any, idx: number) => ({
      id: item.id || `notam-${idx}`,
      location: item.location || '',
      latitude: item.coordinates?.latitude || lat,
      longitude: item.coordinates?.longitude || lon,
      radiusNm: item.radius || radiusNm,
      startTime: new Date(item.startDate).getTime() / 1000,
      endTime: new Date(item.endDate).getTime() / 1000,
      text: item.text || item.message || '',
    }));
  } catch {
    return getStoredNotams();
  }
}

function getStoredNotams(): Notam[] {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  const rows = db.prepare(`
    SELECT * FROM notams
    WHERE end_time > ?
    ORDER BY start_time DESC
  `).all(now) as any[];

  return rows.map(r => ({
    id: r.id,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    radiusNm: r.radius_nm,
    startTime: r.start_time,
    endTime: r.end_time,
    text: r.text,
  }));
}

export function storeNotams(notams: Notam[]): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO notams (id, location, latitude, longitude, radius_nm, start_time, end_time, text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: Notam[]) => {
    for (const n of items) {
      upsert.run(n.id, n.location, n.latitude, n.longitude, n.radiusNm, n.startTime, n.endTime, n.text);
    }
  });
  tx(notams);
}

export function getAdvisories(): Advisory[] {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  // Combine NOTAMs and recent conflict events into advisories
  const notamRows = db.prepare(`
    SELECT * FROM notams WHERE end_time > ? ORDER BY start_time DESC LIMIT 20
  `).all(now) as any[];

  const conflictRows = db.prepare(`
    SELECT * FROM conflict_events
    WHERE event_date >= date('now', '-7 days')
    ORDER BY event_date DESC LIMIT 20
  `).all() as any[];

  const advisories: Advisory[] = [];

  for (const n of notamRows) {
    advisories.push({
      id: `notam-${n.id}`,
      type: 'notam',
      title: `NOTAM: ${n.location}`,
      description: n.text,
      region: n.location,
      latitude: n.latitude,
      longitude: n.longitude,
      radiusKm: n.radius_nm * 1.852,
      severity: 'warning',
      issuedAt: new Date(n.start_time * 1000).toISOString(),
      expiresAt: n.end_time ? new Date(n.end_time * 1000).toISOString() : null,
      source: 'FAA',
    });
  }

  for (const e of conflictRows) {
    advisories.push({
      id: `conflict-${e.id}`,
      type: 'conflict',
      title: `${e.event_type}: ${e.country}`,
      description: e.notes || `${e.sub_event_type} in ${e.admin1}, ${e.country}. ${e.fatalities} fatalities reported.`,
      region: `${e.admin1}, ${e.country}`,
      latitude: e.latitude,
      longitude: e.longitude,
      radiusKm: null,
      severity: e.fatalities > 10 ? 'critical' : e.fatalities > 0 ? 'warning' : 'info',
      issuedAt: e.event_date,
      expiresAt: null,
      source: 'ACLED',
    });
  }

  return advisories.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}
