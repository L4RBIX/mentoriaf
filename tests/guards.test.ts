import { describe, it, expect } from "vitest";
import { assertIsPending, assertNotSelfReview } from "@/lib/guards";

const REQUEST_ID = "req-abc-123";
const SENDER_ID = "user-sender-001";
const REVIEWER_ID = "user-reviewer-002";

describe("assertIsPending", () => {
  it("passes for pending status", () => {
    expect(() => assertIsPending({ status: "pending", id: REQUEST_ID })).not.toThrow();
  });

  it("throws 409 for approved status", () => {
    expect(() => assertIsPending({ status: "approved", id: REQUEST_ID })).toThrow();
    try {
      assertIsPending({ status: "approved", id: REQUEST_ID });
    } catch (e) {
      expect((e as { status: number }).status).toBe(409);
    }
  });

  it("throws 409 for rejected status", () => {
    expect(() => assertIsPending({ status: "rejected", id: REQUEST_ID })).toThrow();
    try {
      assertIsPending({ status: "rejected", id: REQUEST_ID });
    } catch (e) {
      expect((e as { status: number }).status).toBe(409);
    }
  });
});

describe("assertNotSelfReview", () => {
  it("passes when reviewer is different from sender", () => {
    expect(() =>
      assertNotSelfReview({ sender_id: SENDER_ID }, REVIEWER_ID)
    ).not.toThrow();
  });

  it("throws 403 when reviewer === sender", () => {
    expect(() =>
      assertNotSelfReview({ sender_id: SENDER_ID }, SENDER_ID)
    ).toThrow();
    try {
      assertNotSelfReview({ sender_id: SENDER_ID }, SENDER_ID);
    } catch (e) {
      expect((e as { status: number }).status).toBe(403);
    }
  });
});
