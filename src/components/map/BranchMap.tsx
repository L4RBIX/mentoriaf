/**
 * BranchMap — client-only Leaflet map of all Bahandi branches.
 *
 * Must be loaded via dynamic import with ssr:false:
 *   const BranchMap = dynamic(() => import('@/components/map/BranchMap').then(m => m.BranchMap), { ssr: false });
 *
 * Add CSS to the consuming page:
 *   <link rel="stylesheet" href={CSS_HREF} />
 */

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, DivIcon, CircleMarker } from 'leaflet';
import type { GeocodedStore } from '@/lib/types';
import type { BranchRiskData } from '@/lib/branch-risk';

export const CSS_HREF = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BranchMapProps {
  stores: GeocodedStore[];
  risks: Record<string, BranchRiskData>;
  selectedId?: string;
  nearestId?: string;
  onSelect: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  height?: string;
  zoom?: number;
  center?: [number, number];
}

// ---------------------------------------------------------------------------
// Risk colours
// ---------------------------------------------------------------------------

const RISK_COLORS: Record<'high' | 'medium' | 'low', string> = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
};

// ---------------------------------------------------------------------------
// Marker factories
// ---------------------------------------------------------------------------

function makeBranchIcon(
  L: typeof import('leaflet'),
  riskLevel: 'high' | 'medium' | 'low',
  selected: boolean,
  nearest = false,
): DivIcon {
  const color = RISK_COLORS[riskLevel];
  const pulse = riskLevel === 'high';

  const pulseKeyframes = pulse
    ? `@keyframes phylax-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.25)}}`
    : '';

  // Box-shadow layers for visual states
  let shadow = '';
  if (selected && nearest) {
    shadow = 'box-shadow:0 0 0 4px white,0 0 12px 6px rgba(255,255,255,0.5),0 0 0 7px rgba(6,182,212,0.6);';
  } else if (selected) {
    shadow = 'box-shadow:0 0 0 4px white,0 0 12px 6px rgba(255,255,255,0.6);';
  } else if (nearest) {
    shadow = 'box-shadow:0 0 0 3px #06b6d4,0 0 8px 4px rgba(6,182,212,0.35);';
  }

  const pulseStyle = pulse ? 'animation:phylax-pulse 1.4s ease-in-out infinite;' : '';
  const size = nearest && !selected ? 16 : 14;
  const offset = size / 2;

  const html = `
    <style>${pulseKeyframes}</style>
    <div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      ${shadow}
      ${pulseStyle}
    "></div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [offset, offset],
    popupAnchor: [0, -10],
  });
}

function makeUserIcon(L: typeof import('leaflet')): DivIcon {
  const html = `
    <style>
      @keyframes phylax-user-ring{0%{opacity:.8;transform:scale(1)}100%{opacity:0;transform:scale(2.4)}}
      @keyframes phylax-user-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.8;transform:scale(1.1)}}
    </style>
    <div style="position:relative;width:28px;height:28px;">
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid #06b6d4;animation:phylax-user-ring 1.8s ease-out infinite;"></div>
      <div style="position:absolute;top:7px;left:7px;width:14px;height:14px;border-radius:50%;background:#06b6d4;border:2px solid white;animation:phylax-user-pulse 2s ease-in-out infinite;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BranchMap({
  stores,
  risks,
  selectedId,
  nearestId,
  onSelect,
  userLocation,
  height = '500px',
  zoom = 6,
  center = [48.0, 67.0],
}: BranchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, CircleMarker>>(new Map());
  // Separate ref for the user location marker so we can replace it reactively
  const userMarkerRef = useRef<{ remove: () => void } | null>(null);

  // ── Map initialisation (once) ────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    (async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'));

      if (!isMounted || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, { center, zoom, zoomControl: true });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current.clear();

      for (const store of stores) {
        if (store.lat === null || store.lng === null) continue;

        const risk = risks[store.id];
        const riskLevel = risk?.riskLevel ?? 'low';
        const icon = makeBranchIcon(L, riskLevel, store.id === selectedId, store.id === nearestId);

        const marker = L.marker([store.lat, store.lng], { icon })
          .bindPopup(`<strong>${store.name}</strong><br>${store.address}<br><em>${store.city}</em>`, { maxWidth: 220 })
          .addTo(map);

        marker.on('click', () => { onSelect(store.id); });
        markersRef.current.set(store.id, marker as unknown as CircleMarker);
      }
    })();

    return () => {
      isMounted = false;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initialise once

  // ── Update marker icons when selection / nearest changes ─────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'));

      for (const [id, marker] of markersRef.current.entries()) {
        const risk = risks[id];
        const riskLevel = risk?.riskLevel ?? 'low';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (marker as any).setIcon(makeBranchIcon(L, riskLevel, id === selectedId, id === nearestId));
      }
    })();
  }, [selectedId, nearestId, risks]);

  // ── Pan to selected branch ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const store = stores.find((s) => s.id === selectedId);
    if (store?.lat !== null && store?.lat !== undefined && store?.lng !== null && store?.lng !== undefined) {
      mapRef.current.panTo([store.lat, store.lng], { animate: true });
    }
  }, [selectedId, stores]);

  // ── React to userLocation changes (add/remove user marker) ───────────────
  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      const L = (await import('leaflet')).default ?? (await import('leaflet'));

      // Remove previous user marker
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;

      if (userLocation && mapRef.current) {
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: makeUserIcon(L) })
          .bindPopup('Your location')
          .addTo(mapRef.current);
        userMarkerRef.current = marker;

        // Pan + zoom to user
        mapRef.current.setView([userLocation.lat, userLocation.lng], 12, { animate: true });
      }
    })();
  }, [userLocation]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: '100%' }}
      aria-label="Branch risk map"
    />
  );
}

export default BranchMap;
