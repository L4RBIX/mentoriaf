/**
 * Curated coordinate (and display data) overrides for key demo branches.
 *
 * These ALWAYS win over geocoded / generated data in stores-geocoded.json.
 * Applied at runtime by applyCoordinateOverrides().
 *
 * Matching: normalize store id, name, and address to lowercase, check if any
 * contains override.match (or any of override.matches[]).
 *
 * Production note: replace curated coords with exact Bahandi DB / 2GIS coords.
 */

export type BranchCoordinateOverride = {
  /** Primary match string (checked against id, normalized name, normalized address). */
  match: string;
  /** Optional additional match strings — any hit applies the override. */
  matches?: string[];
  lat: number;
  lng: number;
  /** If set, replaces the branch display name. */
  name?: string;
  /** If set, replaces the branch address. */
  address?: string;
  coordinates_source: 'curated_official_branch_page' | 'manual_demo_override';
  geocode_status: 'curated';
  demo_note: string;
};

export const BRANCH_COORDINATE_OVERRIDES: BranchCoordinateOverride[] = [
  // -------------------------------------------------------------------------
  // Bahandi Mera SilkWay — Проспект Мангилик Ел 56, Astana
  // -------------------------------------------------------------------------
  {
    match: 'store-038',
    matches: ['мega silkway', 'мега silkway', 'мера silkway', 'mera silkway', 'мангилик ел 56', 'мангилик ел'],
    lat: 51.0897,
    lng: 71.4139,
    name: 'Bahandi Mera SilkWay',
    address: 'Проспект Мангилик Ел 56, MEGA / Мега SilkWay',
    coordinates_source: 'manual_demo_override',
    geocode_status: 'curated',
    demo_note: 'Manual curated coordinate for Astana demo. Bahandi Mera SilkWay at MEGA Silk Way / Expo area, Проспект Мангилик Ел 56.',
  },

  // -------------------------------------------------------------------------
  // Bahandi Туран 55д киоск — Проспект Туран 55д, Astana
  // -------------------------------------------------------------------------
  {
    match: 'store-088',
    matches: ['туран 55д', 'turan 55д', 'туран 55', 'туран киоск', 'turan kiosk', '55д киоск'],
    lat: 51.1239,
    lng: 71.4019,
    name: 'Bahandi Туран 55д киоск',
    address: 'Проспект Туран 55д киоск, Turan',
    coordinates_source: 'manual_demo_override',
    geocode_status: 'curated',
    demo_note: 'Manual curated coordinate for Astana demo. Bahandi Туран 55д киоск near Проспект Туран 55д.',
  },

  // -------------------------------------------------------------------------
  // Bahandi Хан Шатыр — Khan Shatyr mall, Astana
  // -------------------------------------------------------------------------
  {
    match: 'хан шатыр',
    lat: 51.1325048,
    lng: 71.4038607,
    coordinates_source: 'curated_official_branch_page',
    geocode_status: 'curated',
    demo_note: 'Nominatim: "Хан Шатыр, 37, Тұран даңғылы, Нұра ауданы, Астана". Lat/lng verified against Khan Shatyr mall entrance.',
  },

  // -------------------------------------------------------------------------
  // Bahandi Азия Парк — Asia Park mall, Astana
  // -------------------------------------------------------------------------
  {
    match: 'азия парк',
    lat: 51.1280624,
    lng: 71.4116334,
    coordinates_source: 'curated_official_branch_page',
    geocode_status: 'curated',
    demo_note: 'Nominatim: "Asia Park, 21, Қабанбай Батыр даңғылы, Есіл ауданы, Астана". Lat/lng verified against Asia Park mall entrance.',
  },
];
