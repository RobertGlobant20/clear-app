const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Haversine distance between two points in km */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Bearing from point 1 to point 2 in degrees */
export function bearing(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/** Compass direction from bearing */
export function bearingToCompass(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(deg / 45) % 8];
}

/** Interpolate a point along a great circle at fraction t (0..1) */
export function interpolateGreatCircle(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  t: number
): [number, number] {
  const φ1 = toRadians(lat1);
  const λ1 = toRadians(lon1);
  const φ2 = toRadians(lat2);
  const λ2 = toRadians(lon2);
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((φ2 - φ1) / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
    )
  );
  if (d === 0) return [lat1, lon1];
  const a = Math.sin((1 - t) * d) / Math.sin(d);
  const b = Math.sin(t * d) / Math.sin(d);
  const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
  const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
  const z = a * Math.sin(φ1) + b * Math.sin(φ2);
  return [toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))), toDegrees(Math.atan2(y, x))];
}

/** Minimum distance from a point to a polyline (array of [lat,lon]) in km */
export function pointToPolylineDistance(
  lat: number, lon: number,
  polyline: [number, number][]
): number {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = pointToSegmentDistance(lat, lon, polyline[i], polyline[i + 1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/** Approximate distance from point to line segment */
function pointToSegmentDistance(
  lat: number, lon: number,
  a: [number, number], b: [number, number]
): number {
  const ab = haversineDistance(a[0], a[1], b[0], b[1]);
  if (ab === 0) return haversineDistance(lat, lon, a[0], a[1]);

  const ap = haversineDistance(a[0], a[1], lat, lon);
  const bp = haversineDistance(b[0], b[1], lat, lon);

  // Use cross-track distance for better accuracy
  const bearingAB = toRadians(bearing(a[0], a[1], b[0], b[1]));
  const bearingAP = toRadians(bearing(a[0], a[1], lat, lon));
  const dAP = ap / EARTH_RADIUS_KM;

  const crossTrack = Math.abs(
    Math.asin(Math.sin(dAP) * Math.sin(bearingAP - bearingAB)) * EARTH_RADIUS_KM
  );

  // Check if the perpendicular falls within the segment
  const alongTrack = Math.acos(Math.cos(dAP) / Math.cos(crossTrack / EARTH_RADIUS_KM)) * EARTH_RADIUS_KM;

  if (alongTrack < 0 || alongTrack > ab) {
    return Math.min(ap, bp);
  }

  return crossTrack;
}

/** Generate a great circle polyline as [lat, lon][] */
export function greatCirclePolyline(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  numPoints: number = 100
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    points.push(interpolateGreatCircle(lat1, lon1, lat2, lon2, i / numPoints));
  }
  return points;
}

/** Convert polyline to GeoJSON LineString */
export function polylineToGeoJSON(polyline: [number, number][]): GeoJSON.LineString {
  return {
    type: 'LineString',
    coordinates: polyline.map(([lat, lon]) => [lon, lat]),
  };
}
