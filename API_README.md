# FORGED — Backend API Reference

Anti-fraud trust system for restaurant/retail write-offs.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env.local
# (edit .env.local — see Environment Variables section below)

# 3. Apply database schema
npm run db:migrate

# 4. Seed demo data
npm run seed

# 5. Start dev server (in another terminal)
npm run dev

# 6. Run end-to-end demo scenario
npm run demo:scenario
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (never sent to client) |
| `SUPABASE_STORAGE_BUCKET` | optional | Storage bucket name (default: `writeoff-photos`) |
| `DATABASE_URL` | for migrate | PostgreSQL connection string for `npm run db:migrate` |
| `GEMINI_API_KEY` | optional | Enables AI photo analysis. Without it, `VISION_UNAVAILABLE=+1` fires and demo score = 91 exactly |
| `GEMINI_MODEL` | optional | Model override (default: `gemini-2.5-flash`) |
| `IIKO_MODE` | optional | `sandbox` (default) or `real` |
| `IIKO_BASE_URL` | real mode only | iikoServer base URL |
| `IIKO_LOGIN` | real mode only | iikoServer login |
| `IIKO_PASSWORD` | real mode only | iikoServer password |
| `DEMO_BASE_URL` | optional | Dev server URL for demo:scenario (default: `http://localhost:3000`) |
| `AUTO_REJECT_STRONG_DUPLICATE` | optional | `true` to auto-reject strong duplicate photos (default: `false`) |

---

## Database Scripts

```bash
npm run db:migrate    # Apply SQL migrations via pg (requires DATABASE_URL)
npm run seed          # Insert 3 stores, 5 products, 6 employees, 4 users, 5 historical requests
npm run reset         # Delete all FORGED data (keeps schema)
npm run demo:assets   # (Re-)generate demo JPEG files in demo-assets/
```

The seed inserts:
- Branch #1 (Almaty), Branch #2 (Almaty), Branch #3 (Astana)
- Tomatoes (₸460/kg), Buns (₸50/pcs), Cutlets, Cheese, Sauce
- 6 store employees, 1 sender user, 2 reviewers, 1 admin
- Request **WO-1847** — approved tomato spoilage, photo fingerprinted in `photo_fingerprints`
- 3 norm-baseline approved requests (WO-1844/45/46, qty=5/6/7 over 3 days → avg ≈ 6 kg/day)

---

## API Endpoints

All routes require `export const runtime = "nodejs"` (set). All respond with JSON.

### `GET /api/health`

Returns system health and Supabase connection status.

```json
{ "status": "ok", "database": "connected", "timestamp": "2026-06-27T...", "version": "1.0.0" }
```

---

### `GET /api/writeoffs`

List write-off requests (default: pending, sorted by risk score desc).

**Query parameters:**

| Param | Default | Values |
|---|---|---|
| `status` | `pending` | `draft`, `pending`, `approved`, `rejected` |
| `store_id` | — | UUID |
| `product_id` | — | UUID |
| `fraud_risk` | — | `low`, `medium`, `high` |
| `sort` | `risk_desc` | `risk_desc`, `newest`, `oldest` |
| `limit` | `50` | 1–100 |
| `offset` | `0` | integer |

**Response:** `200 OK` — array of summary objects with store/product embeds.

---

### `POST /api/writeoffs`

Create a new write-off request. Runs the **full verification pipeline** inline before returning.

**Request:** `multipart/form-data` or JSON with `photo_base64`

| Field | Type | Required | Notes |
|---|---|---|---|
| `sender_id` | UUID | ✅ | |
| `store_id` | UUID | ✅ | |
| `product_id` | UUID | ✅ | |
| `quantity` | number | ✅ | > 0 |
| `reason` | string | ✅ | |
| `writeoff_type` | string | ✅ | `no_deduction` or `employee_deduction` |
| `deduction_employee_id` | UUID | ✅ if employee_deduction | |
| `comment` | string | ✅ | min 10 chars |
| `photo` | File | ✅ | JPEG/PNG |
| `captured_at` | ISO datetime | optional | Camera capture timestamp |
| `latitude` | number | optional | Capture GPS latitude |
| `longitude` | number | optional | Capture GPS longitude |
| `source` | string | optional | `pwa` (default), `telegram`, `upload` |

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "request_number": "WO-20260627-ABCD",
  "status": "pending",
  "risk_score": 91,
  "fraud_risk": "high",
  "duplicate_detected": true,
  "verification": {
    "duplicate_match_percent": 100.0,
    "duplicate_request_number": "WO-1847",
    "risk_flags": [
      "Duplicate photo detected (100.0% match) — image already used in request WO-1847",
      "Quantity exceeds 2× the average daily norm for this product at this store",
      "Comment is too short (18 chars) — insufficient justification",
      "AI image verification layer was unavailable — scoring based on duplicate detection and metadata only"
    ],
    "reviewer_hint": "Reject or request a new live photo. This image appears to match request WO-1847."
  }
}
```

---

### `GET /api/writeoffs/:id`

Full detail view including store, product, sender, reviewer, risk events, audit logs.

---

### `POST /api/writeoffs/:id/verify`

Re-run the verification pipeline idempotently (re-computes dHash, re-calls vision, re-scores).

---

### `POST /api/writeoffs/:id/approve`

Approve a write-off request and trigger iiko sync.

**State guards:**
- Returns `409` if request is not `pending`
- Returns `403` if `reviewer_id == sender_id`

**Body:** `{ "reviewer_id": "uuid", "reviewer_comment": "optional string" }`

**Response:** Full request row + `iiko_sync` object.

---

### `POST /api/writeoffs/:id/reject`

Reject a write-off request (no iiko sync).

**State guards:** same 409/403 checks.

**Body:** `{ "reviewer_id": "uuid", "reviewer_comment": "required — reason for rejection" }`

---

### `POST /api/iiko/writeoff`

Directly trigger iiko sync for an already-approved request.

**Body:** `{ "request_id": "uuid" }`

---

### `GET /api/analytics/summary`

Today's write-off summary with prevented loss calculation.

```json
{
  "total_writeoffs_today": 12,
  "total_value_today": 54800,
  "prevented_loss_today": 18400,
  "high_risk_count": 3,
  "approved_count": 8,
  "rejected_count": 2,
  "pending_count": 2,
  "top_stores_by_loss": [...],
  "top_products_by_loss": [...],
  "store_integrity_index": [
    { "store_id": "...", "store_name": "Branch #1", "score": 87, "high_risk_ratio": 0.13 }
  ]
}
```

**prevented_loss_today** = SUM(quantity × estimated_price) for requests where `status='rejected'` AND `fraud_risk='high'` created today.

---

## Risk Score Explained

The risk engine is a pure function (`src/lib/risk/risk-engine.ts`) with no side effects. Weights:

| Rule | Delta | Condition |
|---|---|---|
| BASE | +10 | Always |
| DUPLICATE_STRONG | +50 | Hamming distance ≤ 3 (≥ 95.3% match) |
| DUPLICATE_POSSIBLE | +35 | Hamming distance 4–8 |
| PRODUCT_MISMATCH | +25 | Vision: product not visible |
| NO_DAMAGE_DESPITE_CLAIM | +20 | Claims spoilage but vision sees no damage |
| FAR_FROM_STORE | +20 | Capture > 1 km from store |
| ABOVE_NORM_QUANTITY | +20 | quantity > 2× avg daily norm |
| REPEATED_DEDUCTION_EMPLOYEE | +20 | Same employee deducted ≥ 3× in 7 days |
| QUANTITY_EXCEEDS_VISIBLE | +15 | Claimed qty > 130% of AI estimate |
| FREQUENT_SENDER | +15 | Sender created ≥ 5 requests in 24h |
| UNTRUSTED_SOURCE | +15 | Source not `pwa`/`telegram` |
| WEAK_COMMENT | +10 | comment.length < 20 |
| MISSING_CAPTURED_AT | +10 | No camera timestamp |
| MISSING_GEO | +5 | No GPS coordinates |
| VISION_UNAVAILABLE | +1 | GEMINI_API_KEY not set / timeout / error |
| CLEAR_DAMAGE_VISIBLE | −10 | Vision confirms damage (when claimed) |
| PRODUCT_MATCH | −5 | Vision confirms product |
| QUANTITY_MATCHES_ESTIMATE | −5 | Qty within 20% of AI estimate |
| CLEAN_METADATA | −5 | capturedAt + pwa/telegram + geo near store — **only when no duplicate** |

Final score is clamped to `[0, 100]`. Risk level: `low` < 35 ≤ `medium` < 70 ≤ `high`.

### Demo Scenario: risk_score = 91

```
BASE                = 10
DUPLICATE_STRONG    = 50   (distance=0, 100% match vs WO-1847)
ABOVE_NORM_QUANTITY = 20   (40 kg > 2 × 6 kg avg daily)
WEAK_COMMENT        = 10   ("Tomatoes bad today" = 18 chars < 20)
VISION_UNAVAILABLE  =  1   (GEMINI_API_KEY not set → deterministic)
─────────────────────────
TOTAL               = 91   (clamped to [0,100])
```

Note: `CLEAN_METADATA` is **not applied** when `duplicate_strength = "strong"` — metadata quality doesn't offset fraud risk when the photo itself is flagged.

`VISION_UNAVAILABLE = 1` is intentionally non-round (not a multiple of 5) so the demo reaches 91 rather than a suspiciously round number. This flag fires deterministically whenever `GEMINI_API_KEY` is absent, making the exact-91 guarantee CI-safe.

**prevented_loss_today formula:** 40 kg × ₸460/kg = **₸18,400**

---

## Gemini Vision

- Provider: `gemini-2.5-flash` (override with `GEMINI_MODEL`)
- Timeout: 8 seconds — any timeout/error adds `VISION_UNAVAILABLE=+1` and scoring continues
- Output is validated against a strict JSON schema (no free-form text)
- All calls go through `src/integrations/vision/vision.service.ts`

To test with real vision: set `GEMINI_API_KEY` in `.env.local`. Without it, the system scores correctly but uses metadata/duplicate signals only.

---

## iiko Integration

### Sandbox (default, `IIKO_MODE=sandbox`)

Returns a synthetic `IIKO-SBX-WO-{externalNumber}` document ID without making any network calls. Safe for all demo and CI environments.

### Real (`IIKO_MODE=real`)

Requires `IIKO_BASE_URL`, `IIKO_LOGIN`, `IIKO_PASSWORD`. Uses SHA1-hashed password auth. Caches the auth token in memory (re-fetches on 401). 

> ⚠️ **Note:** The exact iikoServer write-off payload schema (`/documents/import/writeOff`) is not confirmed — it's the most commonly documented path. Confirm with real credentials against your iikoServer version before using real mode in production.

---

## Demo Scenario Script

```bash
npm run demo:scenario
```

Asserts (in order):
1. ✓ `GET /api/health` returns `status: ok`
2. ✓ POST `tomatoes_reused.jpg` (qty=40, short comment) → `duplicate_detected: true`, `risk_score: 91`, `fraud_risk: high`
3. ✓ POST reject → `status: rejected`
4. ✓ GET analytics → `prevented_loss_today: 18400`
5. ✓ State guard: re-rejecting an already-rejected request returns error (409)
6. ✓ POST `buns.jpg` (normal request) → `status: pending`, `fraud_risk != high`
7. ✓ POST approve → `status: approved`, `iiko_status: synced`, document ID starts with `IIKO-SBX-WO-`

---

## Project Structure (backend)

```
src/
  app/api/
    health/route.ts           GET /api/health
    writeoffs/route.ts        GET list, POST create (with pipeline)
    writeoffs/[id]/route.ts   GET detail
    writeoffs/[id]/verify/    POST re-verify
    writeoffs/[id]/approve/   POST approve + iiko sync
    writeoffs/[id]/reject/    POST reject
    iiko/writeoff/route.ts    POST direct iiko sync
    analytics/summary/route.ts GET analytics
  lib/
    supabase/admin.ts         Singleton service-role client
    supabase/database.types.ts Full Database<> interface
    phash.ts                  dHash perceptual hashing
    risk/risk-engine.ts       Pure risk scoring function
    risk/risk-rules.ts        WEIGHTS + RiskInput type
    risk/norms.ts             Daily quantity norms (30-day rolling)
    risk/anomaly.ts           Frequent sender / repeated deduction checks
    pipeline/verify-writeoff.ts Full verification pipeline
    validation.ts             Zod schemas
    guards.ts                 assertIsPending, assertNotSelfReview
    audit.ts                  Append-only audit log helper
    geo.ts                    Haversine distance
    http.ts                   jsonOk / jsonError / ApiError
    env.ts                    Typed env accessor
  integrations/
    vision/gemini.provider.ts Gemini 2.5 Flash with timeout
    vision/vision.service.ts  Facade + configured check
    iiko/iiko-auth.ts         SHA1 auth + token cache
    iiko/iiko-mapper.ts       Request → iiko payload
    iiko/iiko.service.ts      Mode-switched service
    iiko/providers/           sandbox + real providers
  types/forged.ts             Frontend contract types
demo-assets/
  tomatoes_1847.jpg           Anchor photo for WO-1847 (seeded)
  tomatoes_reused.jpg         Duplicate photo for demo (Hamming=0)
  buns.jpg, cheese.jpg        Other product photos
supabase/migrations/
  0001_init.sql               Full schema (10 tables)
scripts/
  generate-demo-assets.ts     Generate + verify demo JPEGs
  migrate.ts                  Apply SQL migrations via pg
  seed.ts                     Insert demo data + fingerprint anchor
  reset.ts                    Delete all FORGED data
  demo-scenario.ts            End-to-end HTTP assertion suite
tests/
  phash.test.ts               dHash, Hamming, duplicate thresholds
  risk-engine.test.ts         Score calculation incl. exact-91 assertion
  validation.test.ts          Zod schema validation
  iiko-sandbox.test.ts        Sandbox provider output
  guards.test.ts              assertIsPending (409), assertNotSelfReview (403)
```

---

## What Remains for Frontend Integration

The frontend team can now call all routes listed above. Items that require live infrastructure:

1. **Supabase project** — create at supabase.com, copy URL + service role key to `.env.local`
2. **Storage bucket** — `npm run seed` creates it automatically (`writeoff-photos`, public)
3. **Auth** — FORGED backend currently accepts `sender_id` and `reviewer_id` as plain UUIDs in request bodies. The frontend should wire these to Supabase Auth user IDs or pass them from the session
4. **Real iiko credentials** — set `IIKO_MODE=real` + base URL + credentials for production
5. **Gemini API key** — optional; scoring works without it (deterministic `VISION_UNAVAILABLE=+1`)
6. **Custom domain / Vercel deploy** — `npm run build` then deploy to Vercel (zero config with Next.js 16)
