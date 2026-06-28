'use client';

import Link from 'next/link';
import { Camera, ShieldAlert, CheckCheck, Package, BarChart2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function AppPage() {
  const { t } = useLanguage();

  const roles = [
    {
      href: '/app/sender',
      badge: 'SENDER',
      title: t('role_cashier_cook'),
      sub: t('submit_writeoff'),
      detail: t('role_submit_detail'),
      Icon: Camera,
      iconColor: '#51a2ff',
      iconBg: 'rgba(81,162,255,0.08)',
      iconBorder: 'rgba(81,162,255,0.16)',
      cardBg: '#0c0c0f',
      borderColor: 'rgba(81,162,255,0.14)',
    },
    {
      href: '/app/reviewer',
      badge: 'REVIEWER',
      title: t('role_control_dept'),
      sub: t('role_high_risk'),
      detail: t('role_reject_detail'),
      Icon: ShieldAlert,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.08)',
      iconBorder: 'rgba(239,68,68,0.18)',
      cardBg: '#0f0c0c',
      borderColor: 'rgba(239,68,68,0.14)',
    },
    {
      href: '/app/reviewer',
      badge: 'REVIEWER',
      title: t('role_supervisor'),
      sub: t('role_standard'),
      detail: t('role_approve_detail'),
      Icon: CheckCheck,
      iconColor: '#22c55e',
      iconBg: 'rgba(34,197,94,0.07)',
      iconBorder: 'rgba(34,197,94,0.14)',
      cardBg: '#0b0f0c',
      borderColor: 'rgba(34,197,94,0.12)',
    },
    {
      href: '/app/reviewer',
      badge: 'REVIEWER',
      title: t('role_supply_dept'),
      sub: t('role_supply_issues'),
      detail: t('role_delivery_detail'),
      Icon: Package,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.07)',
      iconBorder: 'rgba(245,158,11,0.15)',
      cardBg: '#0f0e0b',
      borderColor: 'rgba(245,158,11,0.13)',
    },
    {
      href: '/app/dashboard',
      badge: 'ADMIN',
      title: t('role_owner'),
      sub: t('role_analytics_sub'),
      detail: t('role_branch_detail'),
      Icon: BarChart2,
      iconColor: '#51a2ff',
      iconBg: 'rgba(81,162,255,0.08)',
      iconBorder: 'rgba(81,162,255,0.14)',
      cardBg: '#0c0c0f',
      borderColor: 'rgba(81,162,255,0.12)',
    },
  ];

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 24px 140px' }}>
      {/* Header */}
      <div style={{ marginBottom: '72px' }}>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.22)',
            marginBottom: 20,
          }}
        >
          {t('demo_mode')}
        </div>
        <h1
          style={{
            fontSize: 'clamp(40px, 5vw, 62px)',
            fontWeight: 400,
            letterSpacing: '-0.04em',
            lineHeight: 1.02,
            margin: 0,
            color: '#fff',
          }}
        >
          {t('choose_role')}
        </h1>
        <p
          style={{
            marginTop: 14,
            color: 'rgba(255,255,255,0.38)',
            fontSize: 15,
            maxWidth: 420,
            lineHeight: 1.55,
          }}
        >
          Select your role to enter the demo flow. Each role has different access and responsibilities.
        </p>
      </div>

      {/* Role cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '14px',
        }}
      >
        {roles.map((role) => (
          <Link
            key={role.title + role.href}
            href={role.href}
            className="role-card"
            style={{
              background: role.cardBg,
              border: `1px solid ${role.borderColor}`,
            }}
          >
            {/* Top: badge + icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.28)',
                  padding: '3px 8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2,
                }}
              >
                {role.badge}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: role.iconBg,
                  border: `1px solid ${role.iconBorder}`,
                  borderRadius: 8,
                }}
              >
                <role.Icon size={18} color={role.iconColor} strokeWidth={1.5} />
              </div>
            </div>

            {/* Title block */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  marginBottom: 6,
                  lineHeight: 1.25,
                }}
              >
                {role.title}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
                {role.sub}
              </div>
            </div>

            {/* Detail line */}
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                color: 'rgba(255,255,255,0.22)',
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.055)',
                letterSpacing: '0.02em',
                lineHeight: 1.5,
              }}
            >
              {role.detail}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer quote */}
      <div
        style={{
          marginTop: '5rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 16,
          padding: '1rem 1.5rem',
          border: '1px solid rgba(255,255,255,0.06)',
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.22)',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.42)', fontStyle: 'italic' }}>
          Подделать списание физически невозможно.
        </span>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
        <span>Every write-off must prove itself.</span>
      </div>
    </main>
  );
}
