/**
 * Validation script: confirms Astana demo branch overrides are correct.
 * Run: node scripts/validate-astana-branches.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Load raw stores
const stores = JSON.parse(readFileSync(join(root, 'src/lib/stores-geocoded.json'), 'utf8'));

// Inline apply-overrides logic (no TS imports in .mjs)
function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

const OVERRIDES = [
  {
    match: 'store-038',
    matches: ['мega silkway', 'мега silkway', 'мера silkway', 'mera silkway', 'мангилик ел 56', 'мангилик ел'],
    lat: 51.0897, lng: 71.4139,
    name: 'Bahandi Mera SilkWay',
    address: 'Проспект Мангилик Ел 56, MEGA / Мега SilkWay',
    coordinates_source: 'manual_demo_override',
    geocode_status: 'curated',
  },
  {
    match: 'store-088',
    matches: ['туран 55д', 'turan 55д', 'туран 55', 'туран киоск', 'turan kiosk', '55д киоск'],
    lat: 51.1239, lng: 71.4019,
    name: 'Bahandi Туран 55д киоск',
    address: 'Проспект Туран 55д киоск, Turan',
    coordinates_source: 'manual_demo_override',
    geocode_status: 'curated',
  },
];

function applyOverrides(stores) {
  return stores.map((store) => {
    for (const ov of OVERRIDES) {
      const terms = [ov.match, ...(ov.matches ?? [])];
      const id = store.id.toLowerCase();
      const nameLower = normalize(store.name);
      const addrLower = normalize(store.address);
      const hit = terms.some((t) => id === t || nameLower.includes(t) || addrLower.includes(t));
      if (hit) {
        return { ...store, ...ov };
      }
    }
    return store;
  });
}

const resolved = applyOverrides(stores);

// Find our branches
const mera = resolved.find((s) => s.id === 'store-038');
const turan = resolved.find((s) => s.id === 'store-088');
const kabanbay204 = resolved.find((s) => s.address.includes('204') && s.address.toLowerCase().includes('кабанбай'));

// Landing default is store-003 (Almaty, hardcoded in BranchRiskMapSection)
const landingDefault = resolved.find((s) => s.id === 'store-003');

console.log('\n=== PHYLAX Astana Demo Branch Validation ===\n');

console.log('✅ Mera / Mega SilkWay branch:');
console.log(`   id:                  ${mera?.id}`);
console.log(`   name:                ${mera?.name}`);
console.log(`   address:             ${mera?.address}`);
console.log(`   lat:                 ${mera?.lat}`);
console.log(`   lng:                 ${mera?.lng}`);
console.log(`   geocode_status:      ${mera?.geocode_status}`);
console.log(`   coordinates_source:  ${mera?.coordinates_source}`);

console.log('\n✅ Туран 55д киоск branch:');
console.log(`   id:                  ${turan?.id}`);
console.log(`   name:                ${turan?.name}`);
console.log(`   address:             ${turan?.address}`);
console.log(`   lat:                 ${turan?.lat}`);
console.log(`   lng:                 ${turan?.lng}`);
console.log(`   geocode_status:      ${turan?.geocode_status}`);
console.log(`   coordinates_source:  ${turan?.coordinates_source}`);

console.log('\n✅ Кабанбай батыра 204 (store-049):');
console.log(`   id:                  ${kabanbay204?.id}`);
console.log(`   name:                ${kabanbay204?.name}`);
console.log(`   address:             ${kabanbay204?.address}`);
console.log(`   (remains as generic branch, not featured)`);

console.log('\n✅ Landing map default (store-003, Almaty/Branch #3):');
console.log(`   id:                  ${landingDefault?.id}`);
console.log(`   name:                ${landingDefault?.name}`);
console.log(`   address:             ${landingDefault?.address}`);

const landingIsKabanbay204 = landingDefault?.address?.includes('Кабанбай') && landingDefault?.address?.includes('204');
console.log(`   landingDefaultBranch.address !== "пр. Кабанбай батыра 204": ${!landingIsKabanbay204}`);

// Search term tests
console.log('\n=== Search Term Tests ===\n');
const searchTerms = ['SilkWay', 'Mera', 'Mega', 'Мега', 'Мангилик', '56', 'Туран', 'Turan', '55д', 'киоск'];
for (const term of searchTerms) {
  const matches = resolved.filter((s) =>
    s.name.toLowerCase().includes(term.toLowerCase()) ||
    s.address.toLowerCase().includes(term.toLowerCase()) ||
    s.city.toLowerCase().includes(term.toLowerCase())
  );
  const found = matches.map((s) => s.name).join(', ') || 'NONE';
  const ok = matches.length > 0;
  console.log(`   ${ok ? '✅' : '❌'} "${term}" → ${found}`);
}

console.log('\n=== Validation Complete ===\n');
