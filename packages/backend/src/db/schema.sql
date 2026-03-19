-- Flight state vectors (polled from OpenSky every 10 min)
CREATE TABLE IF NOT EXISTS flight_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  icao24 TEXT NOT NULL,
  callsign TEXT,
  origin_country TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  baro_altitude REAL,
  velocity REAL,
  true_track REAL,
  on_ground INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_fs_icao24_ts ON flight_states(icao24, timestamp);
CREATE INDEX IF NOT EXISTS idx_fs_callsign ON flight_states(callsign);
CREATE INDEX IF NOT EXISTS idx_fs_ts ON flight_states(timestamp);

-- ACLED conflict events
CREATE TABLE IF NOT EXISTS conflict_events (
  id INTEGER PRIMARY KEY,
  event_date TEXT,
  event_type TEXT,
  sub_event_type TEXT,
  actor1 TEXT,
  country TEXT,
  admin1 TEXT,
  latitude REAL,
  longitude REAL,
  fatalities INTEGER,
  notes TEXT,
  fetched_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_ce_coords ON conflict_events(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_ce_date ON conflict_events(event_date);
CREATE INDEX IF NOT EXISTS idx_ce_type ON conflict_events(event_type);

-- Computed conflict zone clusters
CREATE TABLE IF NOT EXISTS conflict_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  centroid_lat REAL,
  centroid_lon REAL,
  radius_km REAL,
  severity_score REAL,
  event_count INTEGER,
  total_fatalities INTEGER,
  region_name TEXT,
  geojson TEXT,
  last_event_date TEXT,
  computed_at INTEGER DEFAULT (unixepoch())
);

-- Airport data (from OurAirports CSV)
CREATE TABLE IF NOT EXISTS airports (
  id INTEGER PRIMARY KEY,
  ident TEXT NOT NULL,
  type TEXT,
  name TEXT,
  latitude REAL,
  longitude REAL,
  elevation_ft INTEGER,
  continent TEXT,
  iso_country TEXT,
  iso_region TEXT,
  municipality TEXT,
  iata_code TEXT,
  icao_code TEXT
);
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao_code);
CREATE INDEX IF NOT EXISTS idx_airports_name ON airports(name);

-- Cached NOTAMs
CREATE TABLE IF NOT EXISTS notams (
  id TEXT PRIMARY KEY,
  location TEXT,
  latitude REAL,
  longitude REAL,
  radius_nm REAL,
  start_time INTEGER,
  end_time INTEGER,
  text TEXT,
  fetched_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_notams_coords ON notams(latitude, longitude);
