import { describe, expect, it } from "vitest";
import { isProofImageUrl, toDisplayPhotoHash } from "@/lib/api";

describe("write-off proof photo mapping", () => {
  const dataUrl = "data:image/jpeg;base64,/9j/2wBDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

  it("treats data image URLs as proof images, not hashes", () => {
    expect(isProofImageUrl(dataUrl)).toBe(true);
    expect(toDisplayPhotoHash(dataUrl)).toBeUndefined();
  });

  it("treats demo and public URLs as proof images", () => {
    expect(isProofImageUrl("/demo-assets/tomatoes_1847.jpg")).toBe(true);
    expect(isProofImageUrl("https://example.supabase.co/storage/v1/object/public/writeoff-photos/a.jpg")).toBe(true);
  });

  it("keeps short fingerprints displayable", () => {
    expect(toDisplayPhotoHash("f03e8ec2faad4f0")).toBe("f03e8ec2faad4f0");
  });

  it("does not display very long non-image values as hashes", () => {
    expect(toDisplayPhotoHash("x".repeat(101))).toBeUndefined();
  });
});

describe("photo source label mapping", () => {
  // Mirrors the label logic used in sender/page.tsx and reviewer/page.tsx
  function proofSourceLabel(proofSource: string | undefined): string {
    if (proofSource === "uploaded_test_photo") return "uploaded test photo";
    if (proofSource === "live_camera_capture") return "live camera capture";
    return "camera/demo capture";
  }

  it("maps uploaded_test_photo correctly", () => {
    expect(proofSourceLabel("uploaded_test_photo")).toBe("uploaded test photo");
  });

  it("maps live_camera_capture correctly", () => {
    expect(proofSourceLabel("live_camera_capture")).toBe("live camera capture");
  });

  it("maps camera_demo_capture and unknown values to fallback", () => {
    expect(proofSourceLabel("camera_demo_capture")).toBe("camera/demo capture");
    expect(proofSourceLabel("pwa")).toBe("camera/demo capture");
    expect(proofSourceLabel(undefined)).toBe("camera/demo capture");
  });
});
