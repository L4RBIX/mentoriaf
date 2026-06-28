/**
 * Geocode all stores in stores_rows.csv using the Nominatim API.
 *
 * Usage:
 *   npm run geocode:stores
 *
 * Output: src/lib/stores-geocoded.json
 *
 * Resume logic: only skips entries with geocode_status="ok" (Nominatim success).
 * Re-geocodes any entry marked "approximate" or "failed".
 *
 * DO NOT run during CI — one-time data generation only.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'stores_rows.csv');
const OUTPUT_PATH = path.join(ROOT, 'src', 'lib', 'stores-geocoded.json');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  id: string;
  name: string;
  address: string;
  city: string;
  created_at: string;
}

interface GeocodedEntry {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  geocode_status: 'ok' | 'approximate' | 'failed' | 'curated';
  geocode_provider?: string;
  coordinates_source?: string;
  geocoded_at?: string;
  demo_note?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
}

// ---------------------------------------------------------------------------
// City-centre fallback coordinates
// ---------------------------------------------------------------------------

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Almaty:            { lat: 43.238,  lng: 76.945 },
  Astana:            { lat: 51.180,  lng: 71.446 },
  Shymkent:          { lat: 42.317,  lng: 69.590 },
  Karaganda:         { lat: 49.807,  lng: 73.089 },
  Aktobe:            { lat: 50.279,  lng: 57.208 },
  Pavlodar:          { lat: 52.285,  lng: 76.940 },
  Semey:             { lat: 50.411,  lng: 80.226 },
  Taraz:             { lat: 42.900,  lng: 71.363 },
  Atyrau:            { lat: 47.107,  lng: 51.914 },
  Kostanay:          { lat: 53.215,  lng: 63.625 },
  'Ust-Kamenogorsk': { lat: 49.951,  lng: 82.621 },
  Oral:              { lat: 51.228,  lng: 51.360 },
  Kyzylorda:         { lat: 44.852,  lng: 65.509 },
  Temirtau:          { lat: 50.059,  lng: 72.958 },
  Petropavl:         { lat: 54.875,  lng: 69.153 },
};

// ---------------------------------------------------------------------------
// Deterministic 2-D offset — spreads points realistically within a city.
// Uses two independent hash values so lat and lng move independently.
// Spread: ±0.10° ≈ ±8 km, realistic for a city-wide restaurant network.
// ---------------------------------------------------------------------------

function deterministicOffset(id: string): { lat: number; lng: number } {
  // Two independent passes with different multipliers.
  let h1 = 2166136261;
  let h2 = 0xcbf29ce4;

  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ (c * 0x9e3779b9), 0x01000193) >>> 0;
  }

  // Map to [-0.10, +0.10] independently for lat and lng.
  const latOffset = (h1 % 2001) / 10000 - 0.10;   // -0.10 … +0.10
  const lngOffset = (h2 % 2001) / 10000 - 0.10;

  return { lat: latOffset, lng: lngOffset };
}

// ---------------------------------------------------------------------------
// CSV parser (no external deps, handles quoted fields)
// ---------------------------------------------------------------------------

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = fields[i] ?? '';
    });

    return row as unknown as CsvRow;
  });
}

// ---------------------------------------------------------------------------
// Nominatim geocoding — tries multiple query variants
// ---------------------------------------------------------------------------

const USER_AGENT = 'PHYLAX-Hackathon-Demo/1.0 (larbix222@gmail.com)';
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

async function nominatimQuery(q: string): Promise<NominatimResult[] | null> {
  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '3');
  url.searchParams.set('countrycodes', 'kz');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) {
      console.warn(`    Nominatim HTTP ${res.status} for: ${q}`);
      return null;
    }
    return (await res.json()) as NominatimResult[];
  } catch (err) {
    console.warn(`    Fetch error for: ${q} — ${String(err)}`);
    return null;
  }
}

async function geocodeWithFallback(
  row: CsvRow,
): Promise<{ lat: number; lng: number; status: 'ok' | 'approximate'; provider: string } | null> {
  // Strategy 1: address + city + Kazakhstan
  const queries = [
    `${row.address}, ${row.city}, Kazakhstan`,
    `${row.name}, ${row.address}, ${row.city}, Kazakhstan`,
    `${row.address}, ${row.city}`,
    `${row.city}, Kazakhstan`,
  ];

  for (const q of queries) {
    const results = await nominatimQuery(q);
    if (results && results.length > 0) {
      const best = results[0];
      const lat = parseFloat(best.lat);
      const lng = parseFloat(best.lon);
      if (!isNaN(lat) && !isNaN(lng)) {
        // If we fell back to city-only query, mark as approximate
        const isExact = q !== `${row.city}, Kazakhstan`;
        return {
          lat, lng,
          status: isExact ? 'ok' : 'approximate',
          provider: isExact ? 'nominatim' : 'nominatim-city-only',
        };
      }
    }
    // 1 s between requests (Nominatim policy)
    await sleep(1100);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Coordinate-clustering validation
// ---------------------------------------------------------------------------

function validateClustering(entries: GeocodedEntry[]): void {
  console.log('\n── Coordinate quality report ────────────────────────────');

  const okCount      = entries.filter((e) => e.geocode_status === 'ok').length;
  const curatedCount = entries.filter((e) => e.geocode_status === 'curated').length;
  const approxCount  = entries.filter((e) => e.geocode_status === 'approximate').length;
  const failedCount  = entries.filter((e) => e.geocode_status === 'failed').length;

  console.log(`  geocoded (nominatim ok):  ${okCount}`);
  console.log(`  curated (official/demo):  ${curatedCount}`);
  console.log(`  approximate (fallback):   ${approxCount}`);
  console.log(`  failed:                   ${failedCount}`);
  console.log(`  total:                    ${entries.length}`);

  // Detect duplicate coordinate clusters (rounded to 4 decimals)
  const coordMap = new Map<string, string[]>();
  for (const e of entries) {
    if (e.lat === null || e.lng === null) continue;
    const key = `${e.lat.toFixed(4)},${e.lng.toFixed(4)}`;
    const group = coordMap.get(key) ?? [];
    group.push(e.id);
    coordMap.set(key, group);
  }
  const clusters = [...coordMap.values()].filter((g) => g.length > 1);
  if (clusters.length > 0) {
    console.warn(`\n  ⚠ ${clusters.length} duplicate-coordinate cluster(s) detected:`);
    for (const g of clusters) {
      console.warn(`    ${g.join(', ')}`);
    }
  } else {
    console.log('  ✓ No duplicate coordinate clusters detected.');
  }

  // Check spread per city
  const byCity = new Map<string, { lat: number; lng: number }[]>();
  for (const e of entries) {
    if (e.lat === null || e.lng === null) continue;
    const arr = byCity.get(e.city) ?? [];
    arr.push({ lat: e.lat, lng: e.lng });
    byCity.set(e.city, arr);
  }
  console.log('\n  Spread per city (should be > 0.01°):');
  for (const [city, pts] of byCity) {
    if (pts.length < 2) continue;
    const latSpread = Math.max(...pts.map((p) => p.lat)) - Math.min(...pts.map((p) => p.lat));
    const lngSpread = Math.max(...pts.map((p) => p.lng)) - Math.min(...pts.map((p) => p.lng));
    const warn = latSpread < 0.01 || lngSpread < 0.01 ? ' ⚠ unrealistically tight' : ' ✓';
    console.log(`    ${city.padEnd(20)} lat±${latSpread.toFixed(4)}  lng±${lngSpread.toFixed(4)}${warn}`);
  }
  console.log('─────────────────────────────────────────────────────────\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at ${CSV_PATH}`);
  }
  const rows = parseCsv(fs.readFileSync(CSV_PATH, 'utf-8'));
  console.log(`Loaded ${rows.length} rows from ${CSV_PATH}`);

  // Load existing progress — only keep "ok" entries to avoid re-geocoding
  // successfully-resolved addresses.
  let existing: GeocodedEntry[] = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8')) as GeocodedEntry[];
      // Preserve confirmed-good geocodes AND manually curated entries.
      existing = raw.filter(
        (e) =>
          (e.geocode_status === 'ok' && e.geocode_provider === 'nominatim') ||
          e.geocode_status === 'curated',
      );
      console.log(`Found ${raw.length} existing entries; preserving ${existing.length} confirmed-ok geocodes`);
    } catch {
      console.warn('Could not parse existing output — starting fresh');
    }
  }

  const existingById = new Map(existing.map((e) => [e.id, e]));

  for (const row of rows) {
    if (existingById.has(row.id)) {
      console.log(`  skip ${row.id} (already geocoded ok)`);
      continue;
    }

    console.log(`  geocoding ${row.id}: "${row.address}", ${row.city}`);

    let entry: GeocodedEntry;

    try {
      const result = await geocodeWithFallback(row);

      if (result) {
        entry = {
          id: row.id,
          name: row.name,
          address: row.address,
          city: row.city,
          lat: result.lat,
          lng: result.lng,
          geocode_status: result.status,
          geocode_provider: result.provider,
          coordinates_source: result.status === 'ok' ? 'nominatim' : 'nominatim_city_fallback',
          geocoded_at: new Date().toISOString(),
        };
        const tag = result.status === 'ok' ? 'ok' : 'approximate (city)';
        console.log(`    ${tag}: ${result.lat.toFixed(5)}, ${result.lng.toFixed(5)}`);
      } else {
        // All Nominatim attempts failed — use city-centre + deterministic 2D offset
        const center = CITY_CENTERS[row.city] ?? { lat: 48.0, lng: 67.0 };
        const off = deterministicOffset(row.id);
        entry = {
          id: row.id,
          name: row.name,
          address: row.address,
          city: row.city,
          lat: center.lat + off.lat,
          lng: center.lng + off.lng,
          geocode_status: 'approximate',
          geocode_provider: 'city_center_offset',
          coordinates_source: 'city_center_fallback',
          geocoded_at: new Date().toISOString(),
        };
        console.log(`    all queries failed — city-offset fallback: ${entry.lat!.toFixed(5)}, ${entry.lng!.toFixed(5)}`);
      }
    } catch (err) {
      console.error(`    unexpected error: ${String(err)} — city-offset fallback`);
      const center = CITY_CENTERS[row.city] ?? { lat: 48.0, lng: 67.0 };
      const off = deterministicOffset(row.id);
      entry = {
        id: row.id,
        name: row.name,
        address: row.address,
        city: row.city,
        lat: center.lat + off.lat,
        lng: center.lng + off.lng,
        geocode_status: 'approximate',
        geocode_provider: 'error_fallback',
        coordinates_source: 'city_center_fallback',
        geocoded_at: new Date().toISOString(),
      };
    }

    existingById.set(row.id, entry);

    // Save progress after every entry
    const output = rows
      .map((r) => existingById.get(r.id))
      .filter((e): e is GeocodedEntry => e !== undefined);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  }

  const final = rows
    .map((r) => existingById.get(r.id))
    .filter((e): e is GeocodedEntry => e !== undefined);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(final, null, 2), 'utf-8');

  validateClustering(final);
  console.log(`Output written to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
