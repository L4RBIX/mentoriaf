import sharp from "sharp";

// dHash: 9x8 grayscale, compare adjacent horizontal pairs → 64-bit hash string.
// This implementation produces a 64-character hex string (8 chars × 8 hex bits → 64 bits total).
//
// Duplicate thresholds (per anti-fraud spec):
//   distance 0-3  → strong duplicate (+50 risk)
//   distance 4-8  → possible duplicate (+35 risk)
//   distance  >8  → not a duplicate

export interface DHashResult {
  hash: string;
  width: number;
  height: number;
}

export async function computeDHash(imageBuffer: Buffer): Promise<DHashResult> {
  const { data } = await sharp(imageBuffer)
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: srcWidth, height: srcHeight } = await sharp(imageBuffer)
    .metadata()
    .then((m) => ({ width: m.width ?? 0, height: m.height ?? 0 }));

  let bits = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      bits += left < right ? "1" : "0";
    }
  }

  // Encode 64 bits as 16 hex characters (4 bits each).
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }

  return { hash: hex, width: srcWidth, height: srcHeight };
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) throw new Error("Hash length mismatch");
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const xor =
      (parseInt(a[i], 16) ^ parseInt(b[i], 16)) >>> 0;
    dist += popcount4(xor);
  }
  return dist;
}

function popcount4(n: number): number {
  // Count set bits in a nibble (0-15).
  return [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][n];
}

export function duplicateMatchPercent(distance: number): number {
  return 100 * (1 - distance / 64);
}

export type DuplicateStrength = "strong" | "possible" | "none";

export function classifyDuplicate(distance: number): DuplicateStrength {
  if (distance <= 3) return "strong";
  if (distance <= 8) return "possible";
  return "none";
}
