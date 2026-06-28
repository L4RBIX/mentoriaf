/**
 * Runtime utility: apply BRANCH_COORDINATE_OVERRIDES to a loaded store array.
 *
 * Overrides win over all geocoded / generated data — coordinates, name, and
 * address are all replaced when a match is found.
 *
 * Matching priority (first match wins):
 *   1. override.match === store.id
 *   2. normalized(store.name) includes override.match (or any override.matches[])
 *   3. normalized(store.address) includes override.match (or any override.matches[])
 *
 * Usage:
 *   import storesData from '@/lib/stores-geocoded.json';
 *   import type { GeocodedStore } from '@/lib/types';
 *   import { applyCoordinateOverrides } from '@/lib/apply-coordinate-overrides';
 *
 *   const stores = applyCoordinateOverrides(storesData as GeocodedStore[]);
 */

import { BRANCH_COORDINATE_OVERRIDES } from './branch-coordinate-overrides';
import type { GeocodedStore } from './types';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesOverride(store: GeocodedStore, terms: string[]): boolean {
  const id = store.id.toLowerCase();
  const nameLower = normalize(store.name);
  const addrLower = normalize(store.address);
  return terms.some(
    (term) => id === term || nameLower.includes(term) || addrLower.includes(term),
  );
}

export function applyCoordinateOverrides(stores: GeocodedStore[]): GeocodedStore[] {
  return stores.map((store) => {
    for (const override of BRANCH_COORDINATE_OVERRIDES) {
      const terms = [override.match, ...(override.matches ?? [])];
      if (matchesOverride(store, terms)) {
        return {
          ...store,
          lat: override.lat,
          lng: override.lng,
          ...(override.name !== undefined ? { name: override.name } : {}),
          ...(override.address !== undefined ? { address: override.address } : {}),
          coordinates_source: override.coordinates_source,
          geocode_status: override.geocode_status,
          demo_note: override.demo_note,
        };
      }
    }
    return store;
  });
}
