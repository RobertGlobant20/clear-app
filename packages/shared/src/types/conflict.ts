export interface ConflictEvent {
  id: number;
  eventDate: string;
  eventType: string;
  subEventType: string;
  actor1: string;
  country: string;
  admin1: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string;
}

export interface ConflictZone {
  id: number;
  centroidLat: number;
  centroidLon: number;
  radiusKm: number;
  severityScore: number;
  eventCount: number;
  totalFatalities: number;
  geojson: GeoJSON.Polygon;
  lastEventDate: string;
  regionName: string;
}
