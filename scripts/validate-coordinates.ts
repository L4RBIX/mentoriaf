/**
 * Coordinate validation report.
 * Usage: npm run validate:coordinates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_PATH = path.join(__dirname, '..', 'src', 'lib', 'stores-geocoded.json');

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  geocode_status: string;
  coordinates_source?: string;
  demo_note?: string;
}

const stores: Store[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

const okCount      = stores.filter((s) => s.geocode_status === 'ok').length;
const curatedCount = stores.filter((s) => s.geocode_status === 'curated').length;
const approxCount  = stores.filter((s) => s.geocode_status === 'approximate').length;
const failedCount  = stores.filter((s) => s.geocode_status === 'failed').length;

console.log('\n── Coordinate Validation Report ─────────────────────────────');
console.log(`  total stores:              ${stores.length}`);
console.log(`  geocoded (nominatim ok):   ${okCount}`);
console.log(`  curated (official/demo):   ${curatedCount}`);
console.log(`  approximate (fallback):    ${approxCount}`);
console.log(`  failed (no coords):        ${failedCount}`);

// Check for duplicate coordinates
const coordMap = new Map<string, string[]>();
for (const s of stores) {
  if (s.lat === null || s.lng === null) continue;
  const key = `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`;
  const group = coordMap.get(key) ?? [];
  group.push(s.id);
  coordMap.set(key, group);
}
const clusters = [...coordMap.values()].filter((g) => g.length > 1);
if (clusters.length > 0) {
  console.warn(`\n  ⚠  ${clusters.length} duplicate coordinate cluster(s):`);
  for (const g of clusters) console.warn(`    ${g.join(', ')}`);
} else {
  console.log('\n  ✓ No duplicate coordinate clusters');
}

// Key demo branch locations
const KEY_MATCHES = [
  { label: 'Мега SilkWay', match: 'мега silkway' },
  { label: 'Хан Шатыр',    match: 'хан шатыр' },
  { label: 'Азия Парк',    match: 'азия парк' },
];

console.log('\n  Key demo branches:');
for (const { label, match } of KEY_MATCHES) {
  const store = stores.find((s) => s.name.toLowerCase().includes(match));
  if (store) {
    console.log(`    ${label.padEnd(14)} lat=${store.lat?.toFixed(6)}  lng=${store.lng?.toFixed(6)}  status=${store.geocode_status}`);
  } else {
    console.warn(`    ${label.padEnd(14)} NOT FOUND in stores`);
  }
}

// Astana spread check
const astanaStores = stores.filter((s) => s.city === 'Astana' && s.lat !== null && s.lng !== null);
const lats = astanaStores.map((s) => s.lat!);
const lngs = astanaStores.map((s) => s.lng!);
const latSpread = Math.max(...lats) - Math.min(...lats);
const lngSpread = Math.max(...lngs) - Math.min(...lngs);
console.log(`\n  Astana spread (${astanaStores.length} stores): lat±${latSpread.toFixed(4)}  lng±${lngSpread.toFixed(4)}`);
if (latSpread < 0.05 || lngSpread < 0.05) {
  console.warn('  ⚠  Astana spread looks suspiciously tight');
} else {
  console.log('  ✓ Astana spread looks realistic');
}

console.log('─────────────────────────────────────────────────────────────\n');
