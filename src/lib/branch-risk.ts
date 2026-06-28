export interface BranchRiskData {
  id: string;
  riskScore: number;
  riskLevel: 'high' | 'medium' | 'low';
  alertCount: number;
  preventedLoss: number;
  topAnomaly: string;
  route: string;
  lastRequestId?: string;
}

/** The single high-risk branch always present in the demo. */
const HIGH_RISK_STORE = 'store-003';

/** Indices (1-based) of medium-risk stores. */
const MEDIUM_RISK_IDS = new Set([
  'store-007',
  'store-012',
  'store-019',
  'store-025',
  'store-031',
  'store-044',
  'store-056',
  'store-072',
]);

const MEDIUM_ANOMALIES: readonly string[] = [
  'Beef patties 2.5× above weekly average',
  'Cheese slices duplicate submission detected',
  'Buns write-off spike — 3 requests in 4 hours',
  'Cooking oil 1.8× above norm',
  'Potato 2× above Tuesday baseline',
  'Sauce packets — sender pattern flagged',
  'Chicken 3× above monthly norm',
  'Salad greens — weak photo quality',
];

const ROUTES: readonly string[] = [
  'Supply Department',
  'Control Department',
  'Supervisor',
];

/**
 * Deterministic integer hash of a string (djb2-style, same as the geocode
 * offset function so the codebase stays consistent).
 */
function hashId(id: string): number {
  let h = 0;
  for (const c of id) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return h;
}

/** Pick a deterministic item from an array using the store hash. */
function pickDeterministic<T>(arr: readonly T[], id: string): T {
  const h = Math.abs(hashId(id));
  return arr[h % arr.length];
}

export function getBranchRisk(storeId: string): BranchRiskData {
  // ── High risk (demo anchor) ──────────────────────────────────────────────
  if (storeId === HIGH_RISK_STORE) {
    return {
      id: storeId,
      riskScore: 91,
      riskLevel: 'high',
      alertCount: 5,
      preventedLoss: 18400,
      topAnomaly: 'Tomatoes 4× above Tuesday baseline',
      route: 'Supply Department',
      lastRequestId: 'req-2024-0847',
    };
  }

  // ── Medium risk ──────────────────────────────────────────────────────────
  if (MEDIUM_RISK_IDS.has(storeId)) {
    const h = Math.abs(hashId(storeId));
    // Score in range [40, 65]
    const riskScore = 40 + (h % 26);
    // Alert count in range [1, 3]
    const alertCount = 1 + (h % 3);

    return {
      id: storeId,
      riskScore,
      riskLevel: 'medium',
      alertCount,
      preventedLoss: 0,
      topAnomaly: pickDeterministic(MEDIUM_ANOMALIES, storeId),
      route: pickDeterministic(ROUTES, storeId),
    };
  }

  // ── Low risk (default) ───────────────────────────────────────────────────
  const h = Math.abs(hashId(storeId));
  // Score in range [5, 25]
  const riskScore = 5 + (h % 21);

  return {
    id: storeId,
    riskScore,
    riskLevel: 'low',
    alertCount: 0,
    preventedLoss: 0,
    topAnomaly: '',
    route: 'Supervisor',
  };
}

export function getAllBranchRisks(storeIds: string[]): BranchRiskData[] {
  return storeIds.map(getBranchRisk);
}
