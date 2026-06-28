import { describe, it, expect } from "vitest";
import { readFile } from "fs/promises";
import { join } from "path";
import { computeDHash, hammingDistance, duplicateMatchPercent, classifyDuplicate } from "@/lib/phash";

const ASSETS = join(process.cwd(), "demo-assets");

describe("dHash", () => {
  it("produces a 16-character hex hash", async () => {
    const buf = await readFile(join(ASSETS, "tomatoes_1847.jpg"));
    const { hash } = await computeDHash(buf);
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it("is deterministic for the same image", async () => {
    const buf = await readFile(join(ASSETS, "tomatoes_1847.jpg"));
    const h1 = (await computeDHash(buf)).hash;
    const h2 = (await computeDHash(buf)).hash;
    expect(h1).toBe(h2);
  });

  it("produces different hashes for different product images", async () => {
    const t = await readFile(join(ASSETS, "tomatoes_1847.jpg"));
    const b = await readFile(join(ASSETS, "buns.jpg"));
    const ht = (await computeDHash(t)).hash;
    const hb = (await computeDHash(b)).hash;
    // They may differ; if they happen to collide that's an asset design issue,
    // but in practice two very different SVGs should produce different hashes.
    const dist = hammingDistance(ht, hb);
    expect(dist).toBeGreaterThan(3);
  });

  it("tomatoes_reused is a STRONG duplicate of tomatoes_1847 (distance ≤ 3)", async () => {
    const orig = await readFile(join(ASSETS, "tomatoes_1847.jpg"));
    const reused = await readFile(join(ASSETS, "tomatoes_reused.jpg"));
    const h1 = (await computeDHash(orig)).hash;
    const h2 = (await computeDHash(reused)).hash;
    const dist = hammingDistance(h1, h2);
    expect(dist).toBeLessThanOrEqual(3);
    expect(classifyDuplicate(dist)).toBe("strong");
  });

  it("duplicate match percent formula", () => {
    expect(duplicateMatchPercent(0)).toBe(100);
    expect(duplicateMatchPercent(1)).toBeCloseTo(98.4375, 2);
    expect(duplicateMatchPercent(8)).toBeCloseTo(87.5, 1);
  });
});

describe("hammingDistance", () => {
  it("is 0 for identical hashes", () => {
    expect(hammingDistance("f033e8ec2faad4f0", "f033e8ec2faad4f0")).toBe(0);
  });

  it("counts correctly for known difference", () => {
    // flip last nibble: f0 → e0 → 1 bit difference (0xf=1111, 0xe=1110 → 1 bit)
    expect(hammingDistance("f033e8ec2faad4f0", "f033e8ec2faad4e0")).toBe(1);
  });

  it("throws for length mismatch", () => {
    expect(() => hammingDistance("abc", "abcd")).toThrow();
  });
});

describe("classifyDuplicate", () => {
  it("0 → strong", () => expect(classifyDuplicate(0)).toBe("strong"));
  it("3 → strong", () => expect(classifyDuplicate(3)).toBe("strong"));
  it("4 → possible", () => expect(classifyDuplicate(4)).toBe("possible"));
  it("8 → possible", () => expect(classifyDuplicate(8)).toBe("possible"));
  it("9 → none", () => expect(classifyDuplicate(9)).toBe("none"));
  it("64 → none", () => expect(classifyDuplicate(64)).toBe("none"));
});
