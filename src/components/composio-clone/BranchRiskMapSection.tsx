'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import storesData from '@/lib/stores-geocoded.json';
import { getBranchRisk } from '@/lib/branch-risk';
import { findNearestBranch, haversineDistanceKm } from '@/lib/geo';
import { applyCoordinateOverrides } from '@/lib/apply-coordinate-overrides';
import type { GeocodedStore } from '@/lib/types';
import type { BranchRiskData } from '@/lib/branch-risk';
import { CSS_HREF } from '@/components/map/BranchMap';

// ---------------------------------------------------------------------------
// Data (computed once at module level)
// ---------------------------------------------------------------------------

const stores = applyCoordinateOverrides(storesData as GeocodedStore[]);
const riskMap: Record<string, BranchRiskData> = Object.fromEntries(
  stores.map((s) => [s.id, getBranchRisk(s.id)]),
);

const highRiskBranch = stores.find((s) => s.id === 'store-003');
const highRiskData = getBranchRisk('store-003');

// ---------------------------------------------------------------------------
// Map loading placeholder
// ---------------------------------------------------------------------------

function MapPlaceholder() {
  return (
    <div
      style={{
        height: '420px',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.06)',
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
// Dynamic Leaflet map
// ---------------------------------------------------------------------------

const BranchMap = dynamic(
  () => import('@/components/map/BranchMap').then((m) => m.BranchMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
);

// ---------------------------------------------------------------------------
// Stat strip item
// ---------------------------------------------------------------------------

function StatItem({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: 'monospace',
        fontSize: 10,
        letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function StatSep() {
  return (
    <span style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'monospace', fontSize: 10 }}>
      |
    </span>
  );
}

// ---------------------------------------------------------------------------
// High-risk callout card
// ---------------------------------------------------------------------------

function HighRiskCallout() {
  return (
    <div
      style={{
        background: '#0f0f0f',
        border: '1px solid rgba(239,68,68,0.25)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 280,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          paddingBottom: 10,
          borderBottom: '1px solid rgba(239,68,68,0.12)',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ef4444',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 9,
            color: '#ef4444',
            letterSpacing: '0.1em',
          }}
        >
          HIGH RISK BRANCH
        </span>
      </div>

      {/* Branch name */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}
        >
          {highRiskBranch?.name ?? 'Bahandi Branch #3'}
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 2,
          }}
        >
          {highRiskBranch?.city ?? 'Almaty'}
        </div>
      </div>

      {/* Risk score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 28,
            fontWeight: 600,
            color: '#ef4444',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          {highRiskData.riskScore}
        </span>
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          / 100
        </span>
      </div>

      {/* Details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          fontFamily: 'monospace',
          fontSize: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>Alerts</span>
          <span style={{ color: '#ef4444' }}>{highRiskData.alertCount} alerts</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>Prevented</span>
          <span style={{ color: '#22c55e' }}>₸{highRiskData.preventedLoss.toLocaleString()}</span>
        </div>
      </div>

      {/* Anomaly */}
      <div
        style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.15)',
          padding: '8px 10px',
          fontFamily: 'monospace',
          fontSize: 9,
          color: '#f59e0b',
          letterSpacing: '0.02em',
          lineHeight: 1.5,
        }}
      >
        {highRiskData.topAnomaly}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function BranchRiskMapSection() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearestBranchId, setNearestBranchId] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
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

  return (
    <section
      style={{
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <link rel="stylesheet" href={CSS_HREF} />

      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '5rem 1.5rem',
        }}
      >
        {/* Heading */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              color: '#fff',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Branch Risk Network
          </h2>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              marginTop: 12,
              letterSpacing: '0.02em',
              lineHeight: 1.6,
            }}
          >
            Every Bahandi branch. Every request. Real-time risk intelligence.
          </p>
        </div>

        {/* Stat strip */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
            padding: '10px 16px',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <StatItem label="87 BRANCHES MONITORED" />
          <StatSep />
          <StatItem label="₸18,400 PREVENTED TODAY" />
          <StatSep />
          <StatItem label="1 HIGH-RISK BRANCH" />
          <StatSep />
          <StatItem label="iiko SYNC READY" />
        </div>

        {/* Map + callout layout */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Map with overlay locate button */}
          <div
            style={{
              flex: 1,
              minWidth: 280,
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <BranchMap
              stores={stores}
              risks={riskMap}
              selectedId={nearestBranchId ?? 'store-003'}
              nearestId={nearestBranchId ?? undefined}
              onSelect={() => {}}
              userLocation={userLocation}
              center={[43.238, 76.945]}
              zoom={8}
              height="420px"
            />

            {/* Locate me overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                alignItems: 'flex-start',
              }}
            >
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationLoading}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: locationLoading ? 'rgba(6,182,212,0.5)' : '#06b6d4',
                  background: 'rgba(7,7,7,0.88)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  padding: '7px 13px',
                  cursor: locationLoading ? 'wait' : 'pointer',
                  backdropFilter: 'blur(4px)',
                  whiteSpace: 'nowrap',
                }}
              >
                {locationLoading ? 'LOCATING…' : '⊙ LOCATE ME'}
              </button>

              {locationError && (
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.45)',
                    background: 'rgba(7,7,7,0.88)',
                    padding: '4px 8px',
                    backdropFilter: 'blur(4px)',
                    maxWidth: 220,
                    lineHeight: 1.4,
                  }}
                >
                  {locationError}
                </span>
              )}

              {nearestBranchId && !locationError && (
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    color: '#06b6d4',
                    background: 'rgba(7,7,7,0.88)',
                    padding: '4px 8px',
                    backdropFilter: 'blur(4px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stores.find((s) => s.id === nearestBranchId)?.name}
                  {nearestDistance !== null && ` · ${nearestDistance} km`}
                </span>
              )}
            </div>
          </div>

          {/* High-risk callout */}
          <HighRiskCallout />
        </div>

        {/* CTA */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-start' }}>
          <Link
            href="/app/map"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: '#070707',
              background: '#f5f5f0',
              padding: '10px 20px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Open live map →
          </Link>
        </div>
      </div>
    </section>
  );
}
