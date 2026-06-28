import type { ReactNode } from 'react';
import { AppNav } from '@/components/app/AppNav';
import { DemoProvider } from '@/lib/demo-store';

export const metadata = {
  title: 'PHYLAX · Platform',
  description: 'AI control layer for restaurant write-offs.',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      <div style={{ minHeight: '100vh', background: '#070707', color: '#f5f5f0' }}>
        <AppNav />
        {children}
      </div>
    </DemoProvider>
  );
}
