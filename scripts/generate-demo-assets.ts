// Generates real JPEG demo assets for FORGED duplicate-detection demo.
// Run once: npm run demo:assets
// Committed output lives in /demo-assets/.
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import sharp from "sharp";

const OUT = path.resolve(import.meta.dirname ?? __dirname, "../demo-assets");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

async function svgToJpeg(svg: string, quality = 90): Promise<Buffer> {
  return sharp(Buffer.from(svg)).jpeg({ quality, mozjpeg: false }).toBuffer();
}

// ── Tomatoes ──────────────────────────────────────────────────────────────
const tomatoesSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#A0522D"/>
      <stop offset="100%" stop-color="#6B3410"/>
    </radialGradient>
    <radialGradient id="tg" cx="38%" cy="32%" r="65%">
      <stop offset="0%" stop-color="#FF5555"/>
      <stop offset="60%" stop-color="#CC1010"/>
      <stop offset="100%" stop-color="#880000"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <line x1="0" y1="80" x2="800" y2="95" stroke="#5A2A08" stroke-width="10" opacity="0.5"/>
  <line x1="0" y1="200" x2="800" y2="190" stroke="#5A2A08" stroke-width="8" opacity="0.4"/>
  <line x1="0" y1="380" x2="800" y2="370" stroke="#7B3C0E" stroke-width="9" opacity="0.4"/>
  <line x1="0" y1="510" x2="800" y2="520" stroke="#5A2A08" stroke-width="7" opacity="0.3"/>
  <ellipse cx="400" cy="370" rx="360" ry="210" fill="#EDEAE0" stroke="#D4CFC4" stroke-width="4"/>
  <circle cx="195" cy="330" r="95" fill="url(#tg)"/>
  <circle cx="225" cy="300" r="22" fill="rgba(255,255,255,0.28)"/>
  <ellipse cx="195" cy="236" rx="7" ry="16" fill="#228822" transform="rotate(-12 195 236)"/>
  <path d="M188 238 Q178 220 168 214 Q185 225 197 234 Z" fill="#2D7A22"/>
  <path d="M202 238 Q212 220 222 214 Q207 225 196 234 Z" fill="#38882A"/>
  <circle cx="415" cy="308" r="102" fill="url(#tg)"/>
  <circle cx="447" cy="277" r="25" fill="rgba(255,255,255,0.28)"/>
  <ellipse cx="415" cy="207" rx="7" ry="17" fill="#228822" transform="rotate(8 415 207)"/>
  <path d="M408 209 Q398 191 388 185 Q405 196 416 207 Z" fill="#2D7A22"/>
  <path d="M422 209 Q432 191 442 185 Q427 196 415 207 Z" fill="#38882A"/>
  <circle cx="620" cy="340" r="88" fill="url(#tg)"/>
  <circle cx="648" cy="312" r="20" fill="rgba(255,255,255,0.28)"/>
  <ellipse cx="620" cy="253" rx="6" ry="15" fill="#228822" transform="rotate(-7 620 253)"/>
  <path d="M613 255 Q603 238 593 232 Q610 243 621 254 Z" fill="#2D7A22"/>
  <path d="M627 255 Q637 238 647 232 Q632 243 620 254 Z" fill="#38882A"/>
</svg>`;

// ── Buns ─────────────────────────────────────────────────────────────────
const bunsSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg2" cx="50%" cy="0%" r="100%">
      <stop offset="0%" stop-color="#D2B48C"/>
      <stop offset="100%" stop-color="#C8A070"/>
    </radialGradient>
    <radialGradient id="bun" cx="40%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#F0D080"/>
      <stop offset="50%" stop-color="#D4A040"/>
      <stop offset="100%" stop-color="#A07020"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg2)"/>
  <ellipse cx="400" cy="380" rx="370" ry="200" fill="#F5F0E8" stroke="#E0DDD5" stroke-width="3"/>
  <ellipse cx="200" cy="340" rx="130" ry="90" fill="url(#bun)"/>
  <ellipse cx="205" cy="313" rx="35" ry="12" fill="rgba(255,255,200,0.35)"/>
  <circle cx="170" cy="335" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="195" cy="320" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="220" cy="330" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="240" cy="345" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="185" cy="355" r="4" fill="#F5F0E0" opacity="0.8"/>
  <ellipse cx="415" cy="320" rx="140" ry="95" fill="url(#bun)"/>
  <ellipse cx="420" cy="292" rx="38" ry="13" fill="rgba(255,255,200,0.35)"/>
  <circle cx="385" cy="315" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="410" cy="302" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="435" cy="310" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="455" cy="328" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="400" cy="335" r="4" fill="#F5F0E0" opacity="0.8"/>
  <ellipse cx="625" cy="350" rx="125" ry="85" fill="url(#bun)"/>
  <ellipse cx="629" cy="325" rx="33" ry="11" fill="rgba(255,255,200,0.35)"/>
  <circle cx="598" cy="345" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="620" cy="332" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="643" cy="340" r="4" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="660" cy="358" r="3.5" fill="#F5F0E0" opacity="0.8"/>
  <circle cx="610" cy="362" r="4" fill="#F5F0E0" opacity="0.8"/>
</svg>`;

// ── Cheese ───────────────────────────────────────────────────────────────
const cheeseSvg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgc" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF8DC"/>
      <stop offset="100%" stop-color="#F5E8A0"/>
    </linearGradient>
    <linearGradient id="cheese" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFE878"/>
      <stop offset="50%" stop-color="#F0C830"/>
      <stop offset="100%" stop-color="#D4A800"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bgc)"/>
  <rect x="120" y="180" width="560" height="280" rx="18" ry="18" fill="url(#cheese)" stroke="#C8A000" stroke-width="3"/>
  <rect x="122" y="182" width="556" height="60" rx="14" ry="14" fill="rgba(255,255,200,0.3)"/>
  <circle cx="250" cy="290" r="32" fill="#E8D040" stroke="#C8A000" stroke-width="2"/>
  <circle cx="250" cy="290" r="20" fill="#D8B820"/>
  <circle cx="400" cy="340" r="28" fill="#E8D040" stroke="#C8A000" stroke-width="2"/>
  <circle cx="400" cy="340" r="17" fill="#D8B820"/>
  <circle cx="560" cy="280" r="35" fill="#E8D040" stroke="#C8A000" stroke-width="2"/>
  <circle cx="560" cy="280" r="22" fill="#D8B820"/>
  <circle cx="340" cy="240" r="22" fill="#E8D040" stroke="#C8A000" stroke-width="2"/>
  <circle cx="340" cy="240" r="13" fill="#D8B820"/>
  <circle cx="490" cy="390" r="26" fill="#E8D040" stroke="#C8A000" stroke-width="2"/>
  <circle cx="490" cy="390" r="16" fill="#D8B820"/>
  <rect x="120" y="420" width="560" height="40" rx="8" ry="8" fill="#D4A800" opacity="0.5"/>
</svg>`;

async function generate() {
  console.log("Generating demo assets in", OUT);

  const tomatoBase = await svgToJpeg(tomatoesSvg, 90);
  await writeFile(path.join(OUT, "tomatoes_1847.jpg"), tomatoBase);
  console.log("✓ tomatoes_1847.jpg", tomatoBase.length, "bytes");

  // Reused: slight resize + recompress to simulate "saved and re-uploaded" photo.
  // The 95% → 100% resize creates mild subpixel artifacts that flip a few dHash bits.
  const tomatoReused = await sharp(tomatoBase)
    .resize(760, 570, { fit: "fill" })
    .resize(800, 600, { fit: "fill" })
    .jpeg({ quality: 72 })
    .toBuffer();
  await writeFile(path.join(OUT, "tomatoes_reused.jpg"), tomatoReused);
  console.log("✓ tomatoes_reused.jpg", tomatoReused.length, "bytes");

  const buns = await svgToJpeg(bunsSvg, 88);
  await writeFile(path.join(OUT, "buns.jpg"), buns);
  console.log("✓ buns.jpg", buns.length, "bytes");

  const cheese = await svgToJpeg(cheeseSvg, 88);
  await writeFile(path.join(OUT, "cheese.jpg"), cheese);
  console.log("✓ cheese.jpg", cheese.length, "bytes");

  // Quick dHash sanity check.
  const { computeDHash, hammingDistance, duplicateMatchPercent } = await import(
    "../src/lib/phash.js"
  );
  const h1847 = (await computeDHash(tomatoBase)).hash;
  const hReused = (await computeDHash(tomatoReused)).hash;
  const dist = hammingDistance(h1847, hReused);
  const matchPct = duplicateMatchPercent(dist);
  console.log(`\ndHash comparison:`);
  console.log(`  tomatoes_1847:  ${h1847}`);
  console.log(`  tomatoes_reused: ${hReused}`);
  console.log(`  Hamming distance: ${dist}`);
  console.log(`  Match %: ${matchPct.toFixed(1)}%`);
  console.log(`  Duplicate strength: ${dist <= 3 ? "STRONG ✓" : dist <= 8 ? "POSSIBLE ⚠" : "NONE ✗"}`);

  if (dist > 8) {
    console.error("\n⚠ WARNING: Hamming distance > 8 — demo duplicate detection will NOT trigger.");
    console.error("  Adjust generate-demo-assets.ts to increase the perturbation.");
    process.exit(1);
  } else {
    console.log("\n✓ Assets ready for demo.");
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
