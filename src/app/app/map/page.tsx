'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import storesData from '@/lib/stores-geocoded.json';
import { useLanguage } from '@/components/LanguageProvider';
import { getBranchRisk } from '@/lib/branch-risk';
import { findNearestBranch, haversineDistanceKm } from '@/lib/geo';
import { applyCoordinateOverrides } from '@/lib/apply-coordinate-overrides';
import type { GeocodedStore } from '@/lib/types';
import type { BranchRiskData } from '@/lib/branch-risk';
import { CSS_HREF } from '@/components/map/BranchMap';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function MapSkeleton() {
  return (
    <div
      style={{
        height: '560px',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '0.08em',
        }}
      >
        LOADING MAP...
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic BranchMap import (client-only, Leaflet)
// ---------------------------------------------------------------------------

const BranchMap = dynamic(
  () => import('@/components/map/BranchMap').then((m) => m.BranchMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterType = 'all' | 'high' | 'medium' | 'low' | 'alerts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function riskBadgeStyle(level: 'high' | 'medium' | 'low'): React.CSSProperties {
  if (level === 'high') {
    return {
      background: 'rgba(239,68,68,0.12)',
      color: '#ef4444',
      border: '1px solid rgba(239,68,68,0.3)',
      fontFamily: 'monospace',
      fontSize: 9,
      letterSpacing: '0.08em',
      padding: '2px 8px',
    };
  }
  if (level === 'medium') {
    return {
      background: 'rgba(245,158,11,0.1)',
      color: '#f59e0b',
      border: '1px solid rgba(245,158,11,0.2)',
      fontFamily: 'monospace',
      fontSize: 9,
      letterSpacing: '0.08em',
      padding: '2px 8px',
    };
  }
  return {
    background: 'rgba(34,197,94,0.08)',
    color: '#22c55e',
    border: '1px solid rgba(34,197,94,0.2)',
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: '0.08em',
    padding: '2px 8px',
  };
}

function riskDotColor(level: 'high' | 'medium' | 'low'): string {
  return level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#22c55e';
}

function formatMoney(n: number): string {
  return `₸${n.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Data setup (module-level, computed once)
// ---------------------------------------------------------------------------

const stores = applyCoordinateOverrides(storesData as GeocodedStore[]);
const riskMap: Record<string, BranchRiskData> = Object.fromEntries(
  stores.map((s) => [s.id, getBranchRisk(s.id)]),
);

const highCount = Object.values(riskMap).filter((r) => r.riskLevel === 'high').length;
const medCount = Object.values(riskMap).filter((r) => r.riskLevel === 'medium').length;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatPill({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 9,
        letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.3)',
        padding: '4px 10px',
        border: '1px solid rgba(255,255,255,0.08)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: active ? '#fff' : 'rgba(255,255,255,0.35)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        padding: '5px 12px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function BranchListItem({
  store,
  risk,
  selected,
  onClick,
}: {
  store: GeocodedStore;
  risk: BranchRiskData;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        width: '100%',
        textAlign: 'left',
        background: selected ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        borderLeft: selected ? '2px solid rgba(255,255,255,0.6)' : '2px solid transparent',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
      }}
      type="button"
    >
      {/* Risk dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: riskDotColor(risk.riskLevel),
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            color: selected ? '#fff' : 'rgba(255,255,255,0.75)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {store.name}
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 2,
          }}
        >
          {store.city}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: riskDotColor(risk.riskLevel),
          flexShrink: 0,
        }}
      >
        {risk.riskScore}
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 16,
        padding: '6px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: valueColor ?? 'rgba(255,255,255,0.7)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MapPage() {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearestBranchId, setNearestBranchId] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by this browser.');
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationLoading(false);
        const validStores = stores.filter((s) => s.lat !== null && s.lng !== null);
        const nearest = findNearestBranch(loc.lat, loc.lng, validStores);
        if (nearest) {
          setNearestBranchId(nearest.id);
          const dist = haversineDistanceKm(loc.lat, loc.lng, nearest.lat!, nearest.lng!);
          setNearestDistance(Math.round(dist * 10) / 10);
        }
      },
      () => {
        setLocationError('Location permission denied. Select branch manually.');
        setLocationLoading(false);
      },
    );
  }

  const filteredStores = useMemo(() => {
    let result = stores;

    if (filter === 'high') result = result.filter((s) => riskMap[s.id].riskLevel === 'high');
    else if (filter === 'medium') result = result.filter((s) => riskMap[s.id].riskLevel === 'medium');
    else if (filter === 'low') result = result.filter((s) => riskMap[s.id].riskLevel === 'low');
    else if (filter === 'alerts') result = result.filter((s) => riskMap[s.id].alertCount > 0);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q),
      );
    }

    return result;
  }, [filter, search]);

  const selectedStore = selectedId ? stores.find((s) => s.id === selectedId) : undefined;
  const selectedRisk = selectedId ? riskMap[selectedId] : undefined;

  function geocodeLabel(status: GeocodedStore['geocode_status']): string {
    if (status === 'ok') return 'Exact';
    if (status === 'approximate') return 'Approximate';
    if (status === 'curated') return 'Curated demo';
    return 'Failed';
  }

  return (
    <>
      {/* Leaflet CSS — injected client-side, safe with 'use client' */}
      <link rel="stylesheet" href={CSS_HREF} />

      <div
        style={{
          minHeight: '100vh',
          background: '#070707',
          color: '#f5f5f0',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '20px 24px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.25)',
                  marginBottom: 6,
                }}
              >
                PHYLAX · BRANCH INTELLIGENCE
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-0.03em',
                  margin: 0,
                  color: '#fff',
                }}
              >
                {t('branch_risk_map')}
              </h1>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                  marginTop: 4,
                }}
              >
                {stores.length} branches · Kazakhstan
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <StatPill label={`${stores.length} BRANCHES MONITORED`} />
              <StatPill label={`${highCount} HIGH RISK`} />
              <StatPill label={`${medCount} MEDIUM RISK`} />
              <StatPill label="₸18,400 PREVENTED TODAY" />
              <StatPill label="iiko SYNC 100%" />
            </div>
          </div>

          {/* ── Filter bar ──────────────────────────────────────────────── */}
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search branch, address, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: '#0f0f0f',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 11,
                padding: '6px 12px',
                width: 240,
                outline: 'none',
              }}
            />

            {/* Risk filter buttons */}
            {(
              [
                ['all', 'All'],
                ['high', 'High'],
                ['medium', 'Medium'],
                ['low', 'Low'],
                ['alerts', 'With Alerts'],
              ] as [FilterType, string][]
            ).map(([value, label]) => (
              <FilterButton
                key={value}
                label={label}
                active={filter === value}
                onClick={() => setFilter(value)}
              />
            ))}

            {/* Focus High Risk */}
            <button
              onClick={() => {
                setSelectedId('store-003');
                setFilter('all');
                setSearch('');
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                letterSpacing: '0.06em',
                color: '#ef4444',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                padding: '5px 14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginLeft: 'auto',
              }}
              type="button"
            >
              Focus High Risk
            </button>

            {/* Locate me */}
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                letterSpacing: '0.06em',
                color: locationLoading ? 'rgba(6,182,212,0.45)' : '#06b6d4',
                background: 'rgba(6,182,212,0.06)',
                border: '1px solid rgba(6,182,212,0.25)',
                padding: '5px 14px',
                cursor: locationLoading ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {locationLoading ? t('locating') : `⊙ ${t('locate_me_full')}`}
            </button>
          </div>

          {/* Location status strip */}
          {(locationError ?? nearestBranchId) && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {locationError && (
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                  {locationError}
                </span>
              )}
              {nearestBranchId && !locationError && (
                <>
                  <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#06b6d4' }}>
                    NEAREST BRANCH
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                    {stores.find((s) => s.id === nearestBranchId)?.name}
                  </span>
                  {nearestDistance !== null && (
                    <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                      {nearestDistance} km away
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedId(nearestBranchId)}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 9,
                      letterSpacing: '0.06em',
                      color: '#06b6d4',
                      background: 'transparent',
                      border: '1px solid rgba(6,182,212,0.25)',
                      padding: '2px 8px',
                      cursor: 'pointer',
                    }}
                  >
                    SELECT
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Main content: list + map ──────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            minHeight: 560,
          }}
        >
          {/* Branch list */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.08)',
              overflowY: 'auto',
              background: '#0a0a0a',
              maxHeight: 'calc(100vh - 280px)',
            }}
          >
            {/* Count */}
            <div
              style={{
                padding: '8px 14px',
                fontFamily: 'monospace',
                fontSize: 9,
                color: 'rgba(255,255,255,0.2)',
                letterSpacing: '0.08em',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {filteredStores.length} BRANCHES
            </div>

            {filteredStores.map((store) => (
              <BranchListItem
                key={store.id}
                store={store}
                risk={riskMap[store.id]}
                selected={selectedId === store.id}
                onClick={() => setSelectedId(store.id === selectedId ? undefined : store.id)}
              />
            ))}

            {filteredStores.length === 0 && (
              <div
                style={{
                  padding: '32px 16px',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.2)',
                  textAlign: 'center',
                }}
              >
                No branches match
              </div>
            )}
          </div>

          {/* Map */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <BranchMap
              stores={stores}
              risks={riskMap}
              selectedId={selectedId}
              nearestId={nearestBranchId ?? undefined}
              onSelect={(id) => setSelectedId(id === selectedId ? undefined : id)}
              userLocation={userLocation}
              height="calc(100vh - 280px)"
              zoom={5}
              center={[48, 67]}
            />
          </div>
        </div>

        {/* ── Selected branch detail panel ─────────────────────────────── */}
        {selectedStore && selectedRisk && (
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: '#0b0b0b',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                display: 'flex',
                gap: 32,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              {/* Name + location */}
              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: riskDotColor(selectedRisk.riskLevel),
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: '#fff',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {selectedStore.name}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    marginTop: 2,
                  }}
                >
                  {selectedStore.city} · {selectedStore.address}
                </div>
              </div>

              {/* Risk score */}
              <div style={{ flex: '1 1 180px', minWidth: 160 }}>
                <div style={{ marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 500,
                      color: riskDotColor(selectedRisk.riskLevel),
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {selectedRisk.riskScore}
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.3)',
                      marginLeft: 4,
                    }}
                  >
                    / 100
                  </span>
                </div>
                <span style={riskBadgeStyle(selectedRisk.riskLevel)}>
                  {selectedRisk.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              {/* Details */}
              <div style={{ flex: '2 1 260px', minWidth: 220 }}>
                <DetailRow
                  label="ALERTS"
                  value={selectedRisk.alertCount > 0 ? `${selectedRisk.alertCount} alerts` : 'None'}
                  valueColor={selectedRisk.alertCount > 0 ? '#ef4444' : undefined}
                />
                <DetailRow
                  label="PREVENTED LOSS"
                  value={selectedRisk.preventedLoss > 0 ? formatMoney(selectedRisk.preventedLoss) : '—'}
                  valueColor={selectedRisk.preventedLoss > 0 ? '#22c55e' : undefined}
                />
                {selectedRisk.topAnomaly && (
                  <DetailRow label="TOP ANOMALY" value={selectedRisk.topAnomaly} valueColor="#f59e0b" />
                )}
                <DetailRow label="ROUTE" value={selectedRisk.route} />
                {selectedRisk.lastRequestId && (
                  <DetailRow label="LAST REQUEST" value={selectedRisk.lastRequestId} />
                )}
                <DetailRow label="GEOCODE" value={geocodeLabel(selectedStore.geocode_status)} />
              </div>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'flex-end',
                  flexShrink: 0,
                }}
              >
                <Link
                  href="/app/reviewer"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: '#070707',
                    background: '#f5f5f0',
                    padding: '8px 16px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  View requests →
                </Link>
                <button
                  onClick={() => setSelectedId(undefined)}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.3)',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '6px 14px',
                    cursor: 'pointer',
                  }}
                  type="button"
                >
                  × Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
