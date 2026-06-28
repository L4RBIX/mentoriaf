'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createWriteOff } from '@/lib/api';
import { EMPLOYEES, PRODUCTS, WRITE_OFF_REASONS } from '@/lib/demo-data';
import type { WriteOffRequest, WriteOffType } from '@/lib/types';
import storesData from '@/lib/stores-geocoded.json';
import { useLanguage } from '@/components/LanguageProvider';
import { getBranchRisk } from '@/lib/branch-risk';
import { haversineDistanceKm, findNearestBranch } from '@/lib/geo';
import { applyCoordinateOverrides } from '@/lib/apply-coordinate-overrides';
import type { GeocodedStore } from '@/lib/types';
import type { BranchMapProps } from '@/components/map/BranchMap';
import { CSS_HREF } from '@/components/map/BranchMap';

const allStores = applyCoordinateOverrides(storesData as GeocodedStore[]);
const riskMap: Record<string, ReturnType<typeof getBranchRisk>> = Object.fromEntries(
  allStores.map((s) => [s.id, getBranchRisk(s.id)])
);

function MapSkeleton() {
  return (
    <div
      style={{
        height: '280px',
        width: '100%',
        background: '#0c0c0c',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.08em',
      }}
    >
      LOADING MAP...
    </div>
  );
}

const BranchMap = dynamic<BranchMapProps>(
  () => import('@/components/map/BranchMap').then((m) => m.BranchMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

const VERIFY_STEPS = [
  'Uploading proof...',
  'Computing photo fingerprint...',
  'Checking duplicate history...',
  'Running Gemini Vision...',
  'Calculating risk score...',
  'Routing request...',
];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const PRESETS = [
  {
    label: 'Normal patty',
    sub: 'Low risk → Supervisor',
    branch: 'Bahandi Branch #1',
    product: 'Patty',
    quantity: '3',
    unit: 'pcs' as const,
    reason: 'Fell on floor',
    type: 'with_deduction' as WriteOffType,
    employee: 'Aibek M.',
    comment: 'Three patties fell during prep rush.',
    riskScore: 18,
    route: 'supervisor' as const,
    demoAsset: 'patty' as const,
  },
  {
    label: 'Duplicate tomato fraud',
    sub: 'High risk → Control',
    branch: 'Bahandi Branch #3',
    product: 'Tomatoes',
    quantity: '40',
    unit: 'kg' as const,
    reason: 'Delivery damage',
    type: 'without_deduction' as WriteOffType,
    employee: '',
    comment: 'Tomatoes bad today',
    riskScore: 91,
    route: 'control' as const,
    duplicate: true,
    demoAsset: 'tomatoes_reused' as const,
  },
  {
    label: 'Damaged buns delivery',
    sub: 'Medium risk → Supply',
    branch: 'Bahandi Branch #2',
    product: 'Buns',
    quantity: '24',
    unit: 'pcs' as const,
    reason: 'Delivery damage',
    type: 'without_deduction' as WriteOffType,
    employee: '',
    comment: 'Entire delivery batch arrived with visible mold.',
    riskScore: 47,
    route: 'supply' as const,
    demoAsset: 'buns' as const,
  },
];

type Phase = 'form' | 'verifying' | 'result';

interface FormState {
  role: 'cashier' | 'cook';
  branch: string;
  product: string;
  quantity: string;
  unit: 'pcs' | 'kg' | 'box';
  reason: string;
  writeOffType: WriteOffType;
  employee: string;
  comment: string;
  hasPhoto: boolean;
  uploadedFile?: File;
  uploadedPreviewUrl?: string;
  uploadedFileName?: string;
  demoAsset?: 'tomatoes_reused' | 'tomatoes_1847' | 'patty' | 'buns' | 'cheese';
  /** How the photo was captured: live phone camera, test file upload, or demo preset. */
  photoSource?: 'live_camera_capture' | 'upload' | 'demo';
}

const empty: FormState = {
  role: 'cook',
  branch: '',
  product: '',
  quantity: '',
  unit: 'pcs',
  reason: '',
  writeOffType: 'without_deduction',
  employee: '',
  comment: '',
  hasPhoto: false,
};

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </label>
      {children}
      {error && <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#ef4444' }}>{error}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  padding: '10px 12px',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

export default function SenderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const { t } = useLanguage();

  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [verifyStep, setVerifyStep] = useState(0);
  const [result, setResult] = useState<WriteOffRequest | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Branch selector state
  const [branchSearch, setBranchSearch] = useState('');
  const [showBranchMap, setShowBranchMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [nearestBranchId, setNearestBranchId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (form.uploadedPreviewUrl) URL.revokeObjectURL(form.uploadedPreviewUrl);
    };
  }, [form.uploadedPreviewUrl]);

  function set(key: keyof FormState, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function applyPreset(p: typeof PRESETS[0]) {
    if (form.uploadedPreviewUrl) URL.revokeObjectURL(form.uploadedPreviewUrl);
    setForm({
      role: 'cook',
      branch: p.branch,
      product: p.product,
      quantity: p.quantity,
      unit: p.unit,
      reason: p.reason,
      writeOffType: p.type,
      employee: p.employee,
      comment: p.comment,
      hasPhoto: true,
      demoAsset: p.demoAsset,
      photoSource: 'demo',
    });
    setErrors({});
    setApiError(null);
  }

  function clearUploadedPhoto() {
    setForm((f) => {
      if (f.uploadedPreviewUrl) URL.revokeObjectURL(f.uploadedPreviewUrl);
      return {
        ...f,
        hasPhoto: false,
        uploadedFile: undefined,
        uploadedPreviewUrl: undefined,
        uploadedFileName: undefined,
        demoAsset: undefined,
        photoSource: undefined,
      };
    });
  }

  function takeLivePhoto() {
    cameraInputRef.current?.click();
  }

  function applyPhotoFile(file: File, source: 'upload' | 'live_camera_capture') {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    if (isHeic) {
      setErrors((e) => ({ ...e, hasPhoto: 'HEIC photos not supported. Use JPEG, PNG, or WebP.' }));
      return;
    }
    if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors((e) => ({ ...e, hasPhoto: 'Use JPEG, PNG, or WebP image' }));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((e) => ({ ...e, hasPhoto: 'Image must be 8MB or smaller' }));
      return;
    }
    setForm((f) => {
      if (f.uploadedPreviewUrl) URL.revokeObjectURL(f.uploadedPreviewUrl);
      return {
        ...f,
        hasPhoto: true,
        uploadedFile: file,
        uploadedPreviewUrl: URL.createObjectURL(file),
        uploadedFileName: file.name,
        demoAsset: undefined,
        photoSource: source,
      };
    });
    setErrors((e) => ({ ...e, hasPhoto: undefined }));
    setApiError(null);
  }

  function handleUpload(file: File | undefined) {
    if (!file) return;
    applyPhotoFile(file, 'upload');
  }

  function handleCameraCapture(file: File | undefined) {
    if (!file) return;
    applyPhotoFile(file, 'live_camera_capture');
  }

  function selectBranchById(storeId: string) {
    const store = allStores.find((s) => s.id === storeId);
    if (store) {
      set('branch', store.name);
      setErrors((e) => ({ ...e, branch: undefined }));
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not available in this browser');
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(userLoc);
        setLocationLoading(false);
        const validStores = allStores.filter((s) => s.lat !== null && s.lng !== null);
        const nearest = findNearestBranch(userLoc.lat, userLoc.lng, validStores);
        if (nearest) {
          setNearestBranchId(nearest.id);
          set('branch', nearest.name);
          setShowBranchMap(true);
        }
      },
      () => {
        setLocationError('Location access denied. Select branch manually.');
        setLocationLoading(false);
      }
    );
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.branch) e.branch = 'Select branch';
    if (!form.product) e.product = 'Select product';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) e.quantity = 'Enter valid quantity';
    if (!form.reason) e.reason = 'Select reason';
    if (form.writeOffType === 'with_deduction' && !form.employee) e.employee = 'Select employee';
    if (!form.comment || form.comment.length < 10) e.comment = 'Minimum 10 characters';
    if (!form.hasPhoto) e.hasPhoto = 'Photo required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setApiError(null);

    setPhase('verifying');
    setVerifyStep(0);
    const createPromise = createWriteOff({
      branch: form.branch,
      product: form.product,
      quantity: Number(form.quantity),
      unit: form.unit,
      reason: form.reason,
      writeOffType: form.writeOffType,
      deductionEmployee: form.employee || undefined,
      comment: form.comment,
      senderRole: form.role,
      demoAsset: form.photoSource === 'demo' || (!form.uploadedFile && !form.photoSource)
        ? (form.demoAsset ?? (form.product === 'Tomatoes' ? 'tomatoes_reused' : 'buns'))
        : undefined,
      photo: form.uploadedFile,
      photoSource: form.photoSource === 'live_camera_capture'
        ? 'live_camera_capture'
        : form.photoSource === 'upload'
        ? 'uploaded_test_photo'
        : 'camera_demo_capture',
    });

    try {
      for (let i = 0; i < VERIFY_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setVerifyStep(i + 1);
      }
      const req = await createPromise;
      setResult(req);
      setPhase('result');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Backend unavailable');
      setPhase('form');
    }
  }

  const filteredStores = allStores.filter(
    (s) =>
      !branchSearch ||
      s.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
      s.address.toLowerCase().includes(branchSearch.toLowerCase()) ||
      s.city.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const selectedStoreId = allStores.find((s) => s.name === form.branch)?.id ?? null;

  if (phase === 'verifying') {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>
            PHYLAX · VERIFYING
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {VERIFY_STEPS.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'monospace', fontSize: 12 }}>
                <span style={{ color: i < verifyStep ? '#22c55e' : i === verifyStep ? '#51a2ff' : 'rgba(255,255,255,0.15)' }}>
                  {i < verifyStep ? '✓' : i === verifyStep ? '●' : '○'}
                </span>
                <span style={{ color: i < verifyStep ? 'rgba(255,255,255,0.6)' : i === verifyStep ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (phase === 'result' && result) {
    const risk = result.aiVerdict!;
    const riskColor = risk.riskScore >= 71 ? '#ef4444' : risk.riskScore >= 31 ? '#f59e0b' : '#22c55e';
    const routeLabel = { supervisor: 'Supervisor-admin', control: 'Control Department', supply: 'Supply Department' }[result.route!];
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>REQUEST #{result.id}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>PENDING REVIEW</span>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {[
                { k: 'Branch', v: result.branch },
                { k: 'Product', v: result.product },
                { k: 'Quantity', v: `${result.quantity} ${result.unit}` },
                { k: 'Reason', v: result.reason },
                { k: 'Source', v: result.proofSource === 'uploaded_test_photo' ? 'uploaded test photo' : result.proofSource === 'live_camera_capture' ? 'live camera capture' : 'camera/demo capture' },
              ].map((row) => (
                <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontFamily: 'monospace', fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{row.k}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{row.v}</span>
                </div>
              ))}
              {result.proofImageUrl && (
                <div style={{ marginTop: 14, border: '1px solid rgba(255,255,255,0.08)', background: '#050505', overflow: 'hidden' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.proofImageUrl}
                    alt={`${result.product} proof thumbnail`}
                    style={{ width: '100%', maxHeight: 140, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#0a0a0a', border: `1px solid ${risk.riskScore >= 71 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>RISK SCORE</div>
              <div style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 700, color: riskColor, lineHeight: 1 }}>
                {risk.riskScore}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'rgba(255,255,255,0.25)' }}>/100</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4 }}>ROUTED TO</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: riskColor }}>{routeLabel}</div>
            </div>
          </div>

          {risk.duplicateDetected && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ color: '#ef4444', letterSpacing: '0.06em' }}>⚠ DUPLICATE PHOTO DETECTED</div>
              <div style={{ color: 'rgba(255,255,255,0.5)' }}>Match: {risk.matchScore}% · Request #{risk.matchedRequestId}</div>
            </div>
          )}

          <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.08)', padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', fontSize: 9 }}>AI VERDICT</div>
            {[
              { k: 'Provider', v: risk.provider === 'gemini' ? 'Gemini' : 'Local fallback', accent: risk.provider === 'gemini' ? '#51a2ff' : '#f59e0b' },
              { k: 'Product', v: risk.productVerified ? 'Verified' : 'Unverified', accent: risk.productVerified ? '#22c55e' : '#f59e0b' },
              { k: 'Damage', v: risk.damageVerified ? 'Verified' : 'Unverified', accent: risk.damageVerified ? '#22c55e' : '#f59e0b' },
              ...(typeof risk.quantityEstimate === 'number' ? [{ k: 'Quantity est.', v: String(risk.quantityEstimate), accent: 'rgba(255,255,255,0.65)' }] : []),
            ].map((row) => (
              <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>{row.k}</span>
                <span style={{ color: row.accent }}>{row.v}</span>
              </div>
            ))}
            {risk.summary && <div style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{risk.summary}</div>}
            {risk.visionFlags && risk.visionFlags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {risk.visionFlags.slice(0, 3).map((flag) => (
                  <span key={flag} style={{ color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 6px', fontSize: 9 }}>
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push('/app/reviewer')}
            style={{ background: '#eeeee9', color: '#050505', border: 'none', padding: '14px', fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.09em', cursor: 'pointer', width: '100%' }}
          >
            {t('view_in_queue')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (form.uploadedPreviewUrl) URL.revokeObjectURL(form.uploadedPreviewUrl);
              setForm(empty);
              setPhase('form');
              setResult(null);
            }}
            className="action-btn action-btn-neutral"
            style={{ width: '100%' }}
          >
            {t('submit_another')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '72px 24px 120px' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
          PHYLAX · WRITE-OFF REQUEST
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: 0, color: '#fff' }}>{t('submit_writeoff')}</h1>
      </div>

      {apiError && (
        <div style={{ marginBottom: 24, padding: '0.9rem 1rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444', fontFamily: 'monospace', fontSize: 11 }}>
          Backend unavailable · {apiError}
        </div>
      )}

      {/* Demo presets */}
      <div
        style={{
          marginBottom: 32,
          padding: '1.25rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>
          {t('quick_presets')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === 1 ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.08)'}`,
                color: 'rgba(255,255,255,0.7)',
                padding: '10px 14px',
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ color: i === 1 ? '#ef4444' : '#fff' }}>{p.label}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>{p.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Role */}
        <Field label={t('field_role')}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['cook', 'cashier'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set('role', r)}
                style={{
                  flex: 1,
                  padding: '9px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  background: form.role === r ? 'rgba(255,255,255,0.1)' : '#111',
                  border: `1px solid ${form.role === r ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: form.role === r ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </Field>

        {/* Branch selector */}
        <Field label={t('field_branch')} error={errors.branch}>
          {/* Search + Use nearest row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <input
              type="text"
              placeholder="Search branch name, address, city..."
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              style={{
                ...inputStyle,
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                flex: 1,
              }}
            />
            <button
              type="button"
              onClick={requestLocation}
              disabled={locationLoading}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                padding: '8px 12px',
                fontFamily: 'monospace',
                fontSize: 10,
                letterSpacing: '0.06em',
                cursor: locationLoading ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {locationLoading ? t('locating') : t('locate_me')}
            </button>
          </div>

          {/* Location status messages */}
          {locationError && (
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#ef4444' }}>
              {locationError}
            </span>
          )}
          {userLocation && (
            <span style={{ fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.18)', display: 'block' }}>
              Location is used only locally to suggest nearest branch.
            </span>
          )}

          {/* Branch list */}
          <div
            style={{
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0c0c0c',
            }}
          >
            {filteredStores.length === 0 ? (
              <div style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                No branches match your search.
              </div>
            ) : (
              filteredStores.map((store) => {
                const risk = riskMap[store.id];
                const isSelected = store.name === form.branch;
                const isNearest = store.id === nearestBranchId;
                const riskColor =
                  risk.riskLevel === 'high'
                    ? '#ef4444'
                    : risk.riskLevel === 'medium'
                    ? '#f59e0b'
                    : '#22c55e';

                return (
                  <div
                    key={store.id}
                    onClick={() => selectBranchById(store.id)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                      borderLeft: isSelected ? '2px solid #f5f5f0' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Risk dot */}
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: riskColor,
                        flexShrink: 0,
                      }}
                    />
                    {/* Branch info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: isSelected ? '#f5f5f0' : 'rgba(255,255,255,0.7)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {store.name}
                        {isNearest && (
                          <span style={{ marginLeft: 6, fontSize: 9, color: '#06b6d4', letterSpacing: '0.06em' }}>
                            NEAREST
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.3)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {store.address} · {store.city}
                      </div>
                    </div>
                    {/* Risk badge */}
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 8,
                        color: riskColor,
                        opacity: 0.7,
                        flexShrink: 0,
                      }}
                    >
                      {risk.riskLevel.toUpperCase()}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Show map toggle */}
          <button
            type="button"
            onClick={() => setShowBranchMap((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'monospace',
              fontSize: 10,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              padding: '4px 0',
              textAlign: 'left',
            }}
          >
            {showBranchMap ? 'HIDE MAP ▲' : 'SHOW MAP ▼'}
          </button>

          {/* Map */}
          {showBranchMap && (
            <>
              <link rel="stylesheet" href={CSS_HREF} />
              <BranchMap
                stores={filteredStores}
                risks={riskMap}
                selectedId={selectedStoreId ?? undefined}
                nearestId={nearestBranchId ?? undefined}
                onSelect={selectBranchById}
                userLocation={userLocation}
                height="280px"
                zoom={5}
                center={[48, 67]}
              />
            </>
          )}

          {/* Selected branch info card */}
          {form.branch && (() => {
            const store = allStores.find((s) => s.name === form.branch);
            if (!store) return null;
            const risk = getBranchRisk(store.id);
            const dist =
              userLocation && store.lat !== null && store.lng !== null
                ? haversineDistanceKm(userLocation.lat, userLocation.lng, store.lat, store.lng)
                : null;
            return (
              <div
                style={{
                  background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '10px 12px',
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: '#f5f5f0' }}>
                      {store.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {store.address} · {store.city}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 9,
                        padding: '2px 6px',
                        border: `1px solid ${
                          risk.riskLevel === 'high'
                            ? 'rgba(239,68,68,0.4)'
                            : risk.riskLevel === 'medium'
                            ? 'rgba(245,158,11,0.3)'
                            : 'rgba(34,197,94,0.2)'
                        }`,
                        color:
                          risk.riskLevel === 'high'
                            ? '#ef4444'
                            : risk.riskLevel === 'medium'
                            ? '#f59e0b'
                            : '#22c55e',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {risk.riskLevel.toUpperCase()} {risk.riskScore}
                    </span>
                  </div>
                </div>
                {dist !== null && (
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.25)',
                      marginTop: 4,
                    }}
                  >
                    {dist.toFixed(1)} km from your location
                  </div>
                )}
              </div>
            );
          })()}
        </Field>

        <Field label={t('field_product')} error={errors.product}>
          <select style={selectStyle} value={form.product} onChange={(e) => set('product', e.target.value)}>
            <option value="">Select product</option>
            {PRODUCTS.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
          <Field label={t('field_quantity')} error={errors.quantity}>
            <input
              type="number"
              style={inputStyle}
              value={form.quantity}
              placeholder="0"
              min={1}
              onChange={(e) => set('quantity', e.target.value)}
            />
          </Field>
          <Field label={t('field_unit')}>
            <select style={selectStyle} value={form.unit} onChange={(e) => set('unit', e.target.value as 'pcs' | 'kg' | 'box')}>
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="box">box</option>
            </select>
          </Field>
        </div>

        <Field label={t('field_reason')} error={errors.reason}>
          <select style={selectStyle} value={form.reason} onChange={(e) => set('reason', e.target.value)}>
            <option value="">Select reason</option>
            {WRITE_OFF_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label={t('field_writeoff_type')}>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { v: 'without_deduction', l: 'Without deduction' },
              { v: 'with_deduction', l: 'With deduction' },
            ] as const).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => set('writeOffType', opt.v)}
                style={{
                  flex: 1,
                  padding: '9px 4px',
                  fontFamily: 'monospace',
                  fontSize: 10,
                  letterSpacing: '0.04em',
                  background: form.writeOffType === opt.v ? 'rgba(255,255,255,0.1)' : '#111',
                  border: `1px solid ${form.writeOffType === opt.v ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  color: form.writeOffType === opt.v ? '#fff' : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </Field>

        {form.writeOffType === 'with_deduction' && (
          <Field label={t('field_deduct_from')} error={errors.employee}>
            <select style={selectStyle} value={form.employee} onChange={(e) => set('employee', e.target.value)}>
              <option value="">Select employee</option>
              {EMPLOYEES.filter((e) => e.role === 'cook' || e.role === 'cashier').map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </Field>
        )}

        <Field label={t('field_comment')} error={errors.comment}>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.comment}
            placeholder="Describe the situation..."
            onChange={(e) => set('comment', e.target.value)}
          />
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: form.comment.length >= 10 ? '#22c55e' : 'rgba(255,255,255,0.25)', alignSelf: 'flex-end' }}>
            {form.comment.length}/10
          </span>
        </Field>

        {/* Camera proof */}
        <Field label={t('field_photo')} error={errors.hasPhoto ? 'Photo required' : undefined}>
          <div
            style={{
              background: '#111',
              border: `1px solid ${form.hasPhoto ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {form.hasPhoto ? (
              <>
                {/* Preview */}
                <div style={{ width: '100%', minHeight: 120, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {form.uploadedPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.uploadedPreviewUrl}
                      alt="Selected write-off proof"
                      style={{ width: '100%', height: 168, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e' }}>PHOTO READY</span>
                  )}
                </div>

                {/* Source + file info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 10, flex: 1,
                      color: form.photoSource === 'live_camera_capture' ? '#22c55e'
                        : form.photoSource === 'upload' ? '#51a2ff'
                        : 'rgba(255,255,255,0.3)',
                    }}>
                      {form.photoSource === 'live_camera_capture'
                        ? `Source: live camera capture${form.uploadedFile ? ` · ${(form.uploadedFile.size / 1024).toFixed(0)} KB` : ''}`
                        : form.photoSource === 'upload'
                        ? `Source: uploaded test photo · ${form.uploadedFileName ?? ''}`
                        : 'Source: demo preset'}
                    </span>
                    <button type="button" onClick={clearUploadedPhoto} style={{ fontFamily: 'monospace', fontSize: 10, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      REPLACE
                    </button>
                  </div>

                  {/* Re-capture options */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                    <button
                      type="button"
                      onClick={takeLivePhoto}
                      style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer', width: '100%' }}
                    >
                      TAKE LIVE PHOTO
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ background: 'rgba(81,162,255,0.08)', border: '1px solid rgba(81,162,255,0.22)', color: '#51a2ff', padding: '8px 10px', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer', width: '100%' }}
                    >
                      UPLOAD TEST PHOTO
                    </button>
                  </div>

                  {form.photoSource === 'live_camera_capture' && (
                    <div style={{ alignSelf: 'flex-start', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', color: '#22c55e', border: '1px solid rgba(34,197,94,0.24)', padding: '2px 7px' }}>
                      LIVE CAMERA
                    </div>
                  )}
                  {form.photoSource === 'upload' && (
                    <div style={{ alignSelf: 'flex-start', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em', color: '#51a2ff', border: '1px solid rgba(81,162,255,0.24)', padding: '2px 7px' }}>
                      TEST UPLOAD MODE
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Camera size={28} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}>
                  <button
                    type="button"
                    onClick={takeLivePhoto}
                    style={{
                      background: 'rgba(34,197,94,0.07)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      color: '#22c55e',
                      padding: '10px 12px',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    TAKE LIVE PHOTO
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'rgba(81,162,255,0.08)',
                      border: '1px solid rgba(81,162,255,0.22)',
                      color: '#51a2ff',
                      padding: '10px 12px',
                      fontFamily: 'monospace',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    UPLOAD TEST PHOTO
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                  On mobile: TAKE LIVE PHOTO opens the camera directly.
                  On desktop: either button opens file picker.
                </div>
              </>
            )}

            {/* Hidden file inputs */}
            {/* Camera capture input — capture="environment" opens rear camera on mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                handleCameraCapture(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
              style={{ display: 'none' }}
            />
            {/* Test photo upload input — no capture attribute, opens file picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                handleUpload(e.target.files?.[0]);
                e.currentTarget.value = '';
              }}
              style={{ display: 'none' }}
            />
          </div>
        </Field>

        <button
          type="button"
          onClick={submit}
          style={{
            background: '#f5f5f0',
            color: '#070707',
            border: 'none',
            padding: '14px',
            fontFamily: 'monospace',
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            width: '100%',
            marginTop: 8,
          }}
        >
          {t('send_verification')}
        </button>
      </div>
    </main>
  );
}
