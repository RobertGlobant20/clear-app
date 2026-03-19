import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'frcs.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

console.log('Seeding database...');

// ─── Airports (subset of major airports for quick seeding) ───
const airports = [
  [1, 'KJFK', 'large_airport', 'John F Kennedy International Airport', 40.6399, -73.7787, 13, 'NA', 'US', 'US-NY', 'New York', 'JFK', 'KJFK'],
  [2, 'EGLL', 'large_airport', 'Heathrow Airport', 51.4706, -0.4619, 83, 'EU', 'GB', 'GB-ENG', 'London', 'LHR', 'EGLL'],
  [3, 'LLBG', 'large_airport', 'Ben Gurion International Airport', 32.0114, 34.8867, 135, 'AS', 'IL', 'IL-M', 'Tel Aviv', 'TLV', 'LLBG'],
  [4, 'OMDB', 'large_airport', 'Dubai International Airport', 25.2528, 55.3644, 62, 'AS', 'AE', 'AE-DU', 'Dubai', 'DXB', 'OMDB'],
  [5, 'OMAA', 'large_airport', 'Abu Dhabi International Airport', 24.433, 54.6511, 88, 'AS', 'AE', 'AE-AZ', 'Abu Dhabi', 'AUH', 'OMAA'],
  [6, 'WSSS', 'large_airport', 'Singapore Changi Airport', 1.3502, 103.9944, 22, 'AS', 'SG', 'SG-04', 'Singapore', 'SIN', 'WSSS'],
  [7, 'LFPG', 'large_airport', 'Charles de Gaulle Airport', 49.0097, 2.5478, 392, 'EU', 'FR', 'FR-IDF', 'Paris', 'CDG', 'LFPG'],
  [8, 'EDDF', 'large_airport', 'Frankfurt am Main Airport', 50.0333, 8.5706, 364, 'EU', 'DE', 'DE-HE', 'Frankfurt', 'FRA', 'EDDF'],
  [9, 'LEMD', 'large_airport', 'Adolfo Suárez Madrid–Barajas Airport', 40.4719, -3.5626, 1998, 'EU', 'ES', 'ES-MD', 'Madrid', 'MAD', 'LEMD'],
  [10, 'LIRF', 'large_airport', 'Leonardo da Vinci–Fiumicino Airport', 41.8003, 12.2389, 14, 'EU', 'IT', 'IT-62', 'Rome', 'FCO', 'LIRF'],
  [11, 'LTFM', 'large_airport', 'Istanbul Airport', 41.2608, 28.7419, 325, 'AS', 'TR', 'TR-34', 'Istanbul', 'IST', 'LTFM'],
  [12, 'OERK', 'large_airport', 'King Khalid International Airport', 24.9576, 46.6988, 2049, 'AS', 'SA', 'SA-01', 'Riyadh', 'RUH', 'OERK'],
  [13, 'OTHH', 'large_airport', 'Hamad International Airport', 25.2731, 51.6081, 13, 'AS', 'QA', 'QA-DA', 'Doha', 'DOH', 'OTHH'],
  [14, 'VHHH', 'large_airport', 'Hong Kong International Airport', 22.3089, 113.9146, 28, 'AS', 'HK', 'HK-U-A', 'Hong Kong', 'HKG', 'VHHH'],
  [15, 'RJTT', 'large_airport', 'Tokyo Haneda Airport', 35.5533, 139.7811, 35, 'AS', 'JP', 'JP-13', 'Tokyo', 'HND', 'RJTT'],
  [16, 'KLAX', 'large_airport', 'Los Angeles International Airport', 33.9425, -118.4081, 125, 'NA', 'US', 'US-CA', 'Los Angeles', 'LAX', 'KLAX'],
  [17, 'KORD', 'large_airport', "O'Hare International Airport", 41.9742, -87.9073, 680, 'NA', 'US', 'US-IL', 'Chicago', 'ORD', 'KORD'],
  [18, 'KATL', 'large_airport', 'Hartsfield-Jackson Atlanta International Airport', 33.6367, -84.4281, 1026, 'NA', 'US', 'US-GA', 'Atlanta', 'ATL', 'KATL'],
  [19, 'CYYZ', 'large_airport', 'Toronto Pearson International Airport', 43.6772, -79.6306, 569, 'NA', 'CA', 'CA-ON', 'Toronto', 'YYZ', 'CYYZ'],
  [20, 'FACT', 'large_airport', 'Cape Town International Airport', -33.9649, 18.6017, 151, 'AF', 'ZA', 'ZA-WC', 'Cape Town', 'CPT', 'FACT'],
  [21, 'FAOR', 'large_airport', 'O.R. Tambo International Airport', -26.1392, 28.2460, 5558, 'AF', 'ZA', 'ZA-GT', 'Johannesburg', 'JNB', 'FAOR'],
  [22, 'HKJK', 'large_airport', 'Jomo Kenyatta International Airport', -1.3192, 36.9278, 5330, 'AF', 'KE', 'KE-110', 'Nairobi', 'NBO', 'HKJK'],
  [23, 'HAAB', 'large_airport', 'Addis Ababa Bole International Airport', 8.9779, 38.7994, 7625, 'AF', 'ET', 'ET-AA', 'Addis Ababa', 'ADD', 'HAAB'],
  [24, 'UUEE', 'large_airport', 'Sheremetyevo International Airport', 55.9726, 37.4146, 630, 'EU', 'RU', 'RU-MOS', 'Moscow', 'SVO', 'UUEE'],
  [25, 'UKBB', 'large_airport', 'Boryspil International Airport', 50.3450, 30.8947, 427, 'EU', 'UA', 'UA-32', 'Kyiv', 'KBP', 'UKBB'],
  [26, 'EPWA', 'large_airport', 'Warsaw Chopin Airport', 52.1657, 20.9671, 362, 'EU', 'PL', 'PL-MZ', 'Warsaw', 'WAW', 'EPWA'],
  [27, 'LOWW', 'large_airport', 'Vienna International Airport', 48.1103, 16.5697, 600, 'EU', 'AT', 'AT-9', 'Vienna', 'VIE', 'LOWW'],
  [28, 'EHAM', 'large_airport', 'Amsterdam Airport Schiphol', 52.3086, 4.7639, -11, 'EU', 'NL', 'NL-NH', 'Amsterdam', 'AMS', 'EHAM'],
  [29, 'ZBAA', 'large_airport', 'Beijing Capital International Airport', 40.0801, 116.5846, 116, 'AS', 'CN', 'CN-11', 'Beijing', 'PEK', 'ZBAA'],
  [30, 'VIDP', 'large_airport', 'Indira Gandhi International Airport', 28.5665, 77.1031, 777, 'AS', 'IN', 'IN-DL', 'New Delhi', 'DEL', 'VIDP'],
  [31, 'VABB', 'large_airport', 'Chhatrapati Shivaji Maharaj International Airport', 19.0887, 72.8679, 39, 'AS', 'IN', 'IN-MH', 'Mumbai', 'BOM', 'VABB'],
  [32, 'HECA', 'large_airport', 'Cairo International Airport', 30.1219, 31.4056, 382, 'AF', 'EG', 'EG-C', 'Cairo', 'CAI', 'HECA'],
  [33, 'OBBI', 'large_airport', 'Bahrain International Airport', 26.2708, 50.6336, 6, 'AS', 'BH', 'BH-13', 'Muharraq', 'BAH', 'OBBI'],
  [34, 'OJAI', 'large_airport', 'Queen Alia International Airport', 31.7226, 35.9932, 2395, 'AS', 'JO', 'JO-AM', 'Amman', 'AMM', 'OJAI'],
  [35, 'OLBA', 'large_airport', 'Beirut–Rafic Hariri International Airport', 33.8209, 35.4884, 87, 'AS', 'LB', 'LB-BA', 'Beirut', 'BEY', 'OLBA'],
];

const insertAirport = db.prepare(`
  INSERT OR REPLACE INTO airports (id, ident, type, name, latitude, longitude, elevation_ft, continent, iso_country, iso_region, municipality, iata_code, icao_code)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const a of airports) {
    insertAirport.run(...a);
  }
})();
console.log(`  Seeded ${airports.length} airports`);

// ─── Conflict Events (realistic sample data) ───
const now = Date.now();
const day = 86400000;

const conflictEvents = [
  // Ukraine conflict zone
  ...generateConflictCluster(48.5, 37.5, 'Ukraine', 'Donetsk', 'Battles', 60, 15),
  ...generateConflictCluster(49.0, 36.3, 'Ukraine', 'Kharkiv', 'Explosions/Remote violence', 40, 25),
  ...generateConflictCluster(46.6, 32.6, 'Ukraine', 'Kherson', 'Battles', 25, 8),

  // Middle East
  ...generateConflictCluster(33.3, 44.4, 'Iraq', 'Baghdad', 'Explosions/Remote violence', 20, 5),
  ...generateConflictCluster(36.3, 43.1, 'Iraq', 'Nineveh', 'Battles', 15, 8),
  ...generateConflictCluster(34.8, 36.7, 'Syria', 'Homs', 'Battles', 30, 12),
  ...generateConflictCluster(36.2, 37.1, 'Syria', 'Aleppo', 'Explosions/Remote violence', 35, 10),
  ...generateConflictCluster(15.4, 44.2, 'Yemen', 'Sanaa', 'Explosions/Remote violence', 25, 15),
  ...generateConflictCluster(13.6, 44.0, 'Yemen', 'Taiz', 'Battles', 18, 6),
  ...generateConflictCluster(31.5, 34.5, 'Palestine', 'Gaza', 'Explosions/Remote violence', 80, 50),

  // East Africa
  ...generateConflictCluster(9.0, 38.7, 'Ethiopia', 'Amhara', 'Battles', 20, 10),
  ...generateConflictCluster(2.0, 45.3, 'Somalia', 'Mogadishu', 'Explosions/Remote violence', 30, 12),
  ...generateConflictCluster(4.8, 31.6, 'South Sudan', 'Jonglei', 'Battles', 15, 8),
  ...generateConflictCluster(12.9, 30.2, 'Sudan', 'Khartoum', 'Battles', 45, 20),

  // Other
  ...generateConflictCluster(35.0, 69.0, 'Afghanistan', 'Kabul', 'Explosions/Remote violence', 12, 5),
  ...generateConflictCluster(12.0, -1.5, 'Burkina Faso', 'Sahel', 'Battles', 20, 8),
  ...generateConflictCluster(13.5, 2.1, 'Niger', 'Tillaberi', 'Battles', 10, 6),
  ...generateConflictCluster(5.5, 7.5, 'Nigeria', 'Southeast', 'Explosions/Remote violence', 15, 4),
  ...generateConflictCluster(11.8, 13.2, 'Nigeria', 'Borno', 'Battles', 25, 12),
];

function generateConflictCluster(
  baseLat: number, baseLon: number, country: string, admin1: string,
  eventType: string, count: number, avgFatalities: number
): any[] {
  const events = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const eventDate = new Date(now - daysAgo * day);
    events.push({
      id: Math.floor(Math.random() * 10000000) + 1000000,
      eventDate: eventDate.toISOString().split('T')[0],
      eventType,
      subEventType: eventType === 'Battles' ? 'Armed clash' : 'Shelling/artillery/missile attack',
      actor1: `${country} Armed Forces`,
      country,
      admin1,
      latitude: baseLat + (Math.random() - 0.5) * 1.5,
      longitude: baseLon + (Math.random() - 0.5) * 1.5,
      fatalities: Math.floor(Math.random() * avgFatalities * 2),
      notes: `Armed conflict event in ${admin1}, ${country}.`,
    });
  }
  return events;
}

const insertEvent = db.prepare(`
  INSERT OR REPLACE INTO conflict_events (id, event_date, event_type, sub_event_type, actor1, country, admin1, latitude, longitude, fatalities, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const e of conflictEvents) {
    insertEvent.run(e.id, e.eventDate, e.eventType, e.subEventType, e.actor1, e.country, e.admin1, e.latitude, e.longitude, e.fatalities, e.notes);
  }
})();
console.log(`  Seeded ${conflictEvents.length} conflict events`);

// ─── Compute conflict zones from seeded events ───
// Inline DBSCAN for seeding
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ClusterPoint { lat: number; lon: number; fatalities: number; country: string; admin1: string; eventDate: string }

function dbscanCluster(points: ClusterPoint[], eps: number, minPts: number): ClusterPoint[][] {
  const visited = new Set<number>();
  const clusters: ClusterPoint[][] = [];
  for (let i = 0; i < points.length; i++) {
    if (visited.has(i)) continue;
    visited.add(i);
    const neighbors = points.map((p, j) => j).filter(j => j !== i && haversineDistance(points[i].lat, points[i].lon, points[j].lat, points[j].lon) <= eps);
    if (neighbors.length < minPts) continue;
    const cluster = [points[i]];
    const queue = [...neighbors];
    const inCluster = new Set([i]);
    while (queue.length) {
      const j = queue.pop()!;
      if (!visited.has(j)) {
        visited.add(j);
        const jn = points.map((p, k) => k).filter(k => k !== j && haversineDistance(points[j].lat, points[j].lon, points[k].lat, points[k].lon) <= eps);
        if (jn.length >= minPts) queue.push(...jn);
      }
      if (!inCluster.has(j)) { inCluster.add(j); cluster.push(points[j]); }
    }
    clusters.push(cluster);
  }
  return clusters;
}

const clusterPoints: ClusterPoint[] = conflictEvents.map(e => ({
  lat: e.latitude, lon: e.longitude, fatalities: e.fatalities, country: e.country, admin1: e.admin1, eventDate: e.eventDate,
}));

const clusters = dbscanCluster(clusterPoints, 100, 3);

const insertZone = db.prepare(`
  INSERT INTO conflict_zones (centroid_lat, centroid_lon, radius_km, severity_score, event_count, total_fatalities, region_name, geojson, last_event_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  db.prepare('DELETE FROM conflict_zones').run();
  for (const cluster of clusters) {
    const centLat = cluster.reduce((s, p) => s + p.lat, 0) / cluster.length;
    const centLon = cluster.reduce((s, p) => s + p.lon, 0) / cluster.length;
    let maxDist = 0;
    for (const p of cluster) {
      const d = haversineDistance(centLat, centLon, p.lat, p.lon);
      if (d > maxDist) maxDist = d;
    }
    const totalFat = cluster.reduce((s, p) => s + p.fatalities, 0);
    const severity = Math.min(totalFat / 100, 1) * 0.6 + Math.min(cluster.length / 50, 1) * 0.4;
    const region = cluster[0].country + (cluster[0].admin1 ? `, ${cluster[0].admin1}` : '');
    const lastDate = cluster.map(p => p.eventDate).sort().pop() || '';
    const radiusKm = Math.max(maxDist + 50, 50);

    // Simple circle GeoJSON
    const coords: [number, number][] = [];
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * 2 * Math.PI;
      const dLat = (radiusKm / 111) * Math.cos(angle);
      const dLon = (radiusKm / (111 * Math.cos(centLat * Math.PI / 180))) * Math.sin(angle);
      coords.push([centLon + dLon, centLat + dLat]);
    }
    const geojson = JSON.stringify({ type: 'Polygon', coordinates: [coords] });

    insertZone.run(centLat, centLon, radiusKm, severity, cluster.length, totalFat, region, geojson, lastDate);
  }
})();
console.log(`  Computed ${clusters.length} conflict zones`);

// ─── Sample Flight States (for anomaly detection demo) ───
// Simulate 30 days of flights on JFK-TLV route for several airlines
const airlines = [
  { prefix: 'ELY', name: 'El Al', baseRoute: [[40.6, -73.8], [42.0, -50.0], [45.0, -20.0], [43.0, 5.0], [40.0, 20.0], [36.0, 30.0], [32.0, 34.9]] },
  { prefix: 'BAW', name: 'British Airways', baseRoute: [[40.6, -73.8], [45.0, -50.0], [51.5, -0.5], [47.0, 15.0], [42.0, 28.0], [36.0, 32.0], [32.0, 34.9]] },
  { prefix: 'UAE', name: 'Emirates', baseRoute: [[40.6, -73.8], [42.0, -40.0], [45.0, -10.0], [40.0, 20.0], [35.0, 35.0], [28.0, 45.0], [25.3, 55.4], [32.0, 34.9]] },
  { prefix: 'THY', name: 'Turkish Airlines', baseRoute: [[40.6, -73.8], [44.0, -40.0], [48.0, -10.0], [45.0, 15.0], [41.3, 28.7], [37.0, 32.0], [32.0, 34.9]] },
];

const insertState = db.prepare(`
  INSERT INTO flight_states (icao24, callsign, origin_country, latitude, longitude, baro_altitude, velocity, true_track, on_ground, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  for (const airline of airlines) {
    // Generate flights over 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const flightTs = Math.floor((now - dayOffset * day) / 1000);
      const callsign = `${airline.prefix}${100 + Math.floor(Math.random() * 900)}`;
      const icao24 = `${Math.random().toString(16).slice(2, 8)}`;

      // Is this a recent anomalous flight? (for 2 airlines in last 7 days)
      const isAnomaly = dayOffset < 7 && (airline.prefix === 'ELY' || airline.prefix === 'UAE') && Math.random() < 0.3;

      for (let i = 0; i < airline.baseRoute.length; i++) {
        const [baseLat, baseLon] = airline.baseRoute[i];
        const jitter = isAnomaly ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 0.5;
        // If anomaly, deviate away from conflict zones (north for Middle East routes)
        const anomalyOffset = isAnomaly && i >= 3 && i <= 5 ? 3 + Math.random() * 2 : 0;
        const lat = baseLat + jitter + anomalyOffset;
        const lon = baseLon + jitter;
        const ts = flightTs + i * 3600; // 1 hour between points

        insertState.run(icao24, callsign, airline.prefix === 'BAW' ? 'United Kingdom' : 'Israel', lat, lon, 35000 + Math.random() * 5000, 450 + Math.random() * 50, 0, 0, ts);
      }
    }
  }
})();
console.log(`  Seeded flight state history for ${airlines.length} airlines over 30 days`);

// ─── Sample NOTAMs ───
const notams = [
  { id: 'A0001/26', location: 'UKFV (Ukraine FIR)', lat: 48.0, lon: 35.0, radiusNm: 200, text: 'AIRSPACE CLOSED. Ukraine FIR closed to all civil aviation due to ongoing armed conflict. All flights must reroute around Ukrainian airspace. Contact Eurocontrol for alternative routings.' },
  { id: 'A0002/26', location: 'OSTT (Damascus FIR)', lat: 34.5, lon: 37.0, radiusNm: 150, text: 'WARNING. Operators are advised to exercise caution when operating in Damascus FIR due to ongoing military operations. Risk of anti-aircraft fire and missile activity below FL250.' },
  { id: 'A0003/26', location: 'OYSC (Sanaa FIR)', lat: 15.0, lon: 44.0, radiusNm: 200, text: 'AIRSPACE RESTRICTION. Sanaa FIR restricted to civil aviation. All overflights must maintain FL260 or above. Risk of surface-to-air missile activity.' },
  { id: 'A0004/26', location: 'ORBB (Baghdad FIR)', lat: 33.0, lon: 44.0, radiusNm: 100, text: 'CAUTION. Military operations ongoing in eastern Iraq. Aircraft transiting Baghdad FIR advised to monitor 121.5 MHz and follow published routings.' },
  { id: 'A0005/26', location: 'HSSS (Khartoum FIR)', lat: 15.0, lon: 32.5, radiusNm: 250, text: 'WARNING. Armed conflict in Sudan. Khartoum FIR operations restricted. Multiple airports closed. Overflights above FL300 permitted on published routes only.' },
  { id: 'A0006/26', location: 'LLLL (Tel Aviv FIR)', lat: 31.5, lon: 34.5, radiusNm: 50, text: 'NOTAM. Intermittent restrictions on Ben Gurion Airport arrivals and departures due to security situation. Check latest updates before filing flight plan.' },
];

const insertNotam = db.prepare(`
  INSERT OR REPLACE INTO notams (id, location, latitude, longitude, radius_nm, start_time, end_time, text)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const nowSec = Math.floor(now / 1000);
db.transaction(() => {
  for (const n of notams) {
    insertNotam.run(n.id, n.location, n.lat, n.lon, n.radiusNm, nowSec - 7 * 86400, nowSec + 30 * 86400, n.text);
  }
})();
console.log(`  Seeded ${notams.length} NOTAMs`);

db.close();
console.log('Database seeded successfully!');
