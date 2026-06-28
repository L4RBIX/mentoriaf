# Branch Risk Map — Runbook

## Coordinate tiers

| Status | Count | Source | Notes |
|---|---|---|---|
| `ok` | ~37 | Nominatim (exact address) | Trusted. Do not overwrite. |
| `curated` | 3 | Official branch page / Nominatim landmark | Key demo branches. See override file. |
| `approximate` | ~47 | City-center + FNV-1a 2D offset | Spread realistically but NOT exact locations. |
| `failed` | 0 | — | Should remain 0. |

## Key demo branch coordinates (curated)

These branches appear at recognisable real locations for the pitch:

| Branch | Mall | lat | lng |
|---|---|---|---|
| Bahandi Хан Шатыр | Khan Shatyr, пр. Туран 37 | 51.1325048 | 71.4038607 |
| Bahandi Мега SilkWay | MEGA Silk Way, пр. Кабанбай батыра 62 | 51.0890861 | 71.4072859 |
| Bahandi Азия Парк | Asia Park, пр. Кабанбай батыра 21 | 51.1280624 | 71.4116334 |

Coordinates sourced from Nominatim (OpenStreetMap) queries against official mall names.

## Override mechanism

`src/lib/branch-coordinate-overrides.ts` — source of truth for curated coordinates.

`src/lib/apply-coordinate-overrides.ts` — runtime utility that applies overrides when loading store data.

All pages (`/app/map`, `/app/sender`, landing `BranchRiskMapSection`) call `applyCoordinateOverrides()` after loading `stores-geocoded.json`.

## Re-running geocoding

```bash
npm run geocode:stores   # Only re-geocodes non-ok, non-curated entries
npm run validate:coordinates  # Print coordinate quality report
```

`geocode:stores` **preserves** all `geocode_status: "curated"` entries and will not overwrite them.

## Validation

```bash
npm run validate:coordinates
```

Expected output:
- 0 duplicate coordinate clusters
- Key demo branches at correct Astana mall locations
- Astana spread > 0.05° in both lat and lng

## Production notes

- Replace **all** approximate coordinates with exact Bahandi database / 2GIS / Yandex coordinates.
- Remove city-fallback entries (geocode_status: "approximate") once exact coords are available.
- Curated coords are accurate to the mall entrance — good enough for demo but may not match the exact restaurant unit inside the mall.
