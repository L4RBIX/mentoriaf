const R = 6371; // Earth radius in kilometres

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance between two lat/lng points, in kilometres. */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Haversine distance in metres (kept for backward compatibility). */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Find the nearest branch from a list to the given user location.
 * Branches with null lat/lng are skipped.
 * Returns null if the list is empty or all branches have null coordinates.
 */
export function findNearestBranch<T extends { lat: number | null; lng: number | null }>(
  userLat: number,
  userLng: number,
  branches: T[],
): T | null {
  let nearest: T | null = null;
  let minDist = Infinity;

  for (const branch of branches) {
    if (branch.lat === null || branch.lng === null) continue;
    const dist = haversineDistanceKm(userLat, userLng, branch.lat, branch.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = branch;
    }
  }

  return nearest;
}
