'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { WriteOffRequest, AuditEvent } from './types';
import { INITIAL_REQUESTS } from './demo-data';

interface DemoState {
  requests: WriteOffRequest[];
  preventedLoss: number;
  addRequest: (req: WriteOffRequest) => void;
  approveRequest: (id: string, reviewer: string) => void;
  rejectRequest: (id: string, reviewer: string, reason?: string) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<WriteOffRequest[]>(INITIAL_REQUESTS);
  const [preventedLoss, setPreventedLoss] = useState(0);

  const addRequest = (req: WriteOffRequest) => {
    setRequests((prev) => [req, ...prev]);
  };

  const approveRequest = (id: string, reviewer: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const ts = new Date().toISOString();
        const approveEvent: AuditEvent = {
          id: `ae-${Date.now()}`,
          requestId: id,
          event: 'approved',
          actor: reviewer,
          timestamp: ts,
          detail: 'Request approved. iiko write-off act created.',
        };
        const iikoEvent: AuditEvent = {
          id: `ae-${Date.now()}-iiko`,
          requestId: id,
          event: 'iiko_synced',
          actor: 'iiko Adapter',
          timestamp: ts,
          detail: `document_id=IIKO-SBX-WO-${id}`,
        };
        return {
          ...r,
          status: 'synced' as const,
          reviewer,
          iiko: {
            mode: 'sandbox' as const,
            status: 'synced' as const,
            documentId: `IIKO-SBX-WO-${id}`,
            warehouse: r.branch,
            documentType: 'write-off act',
            syncedAt: ts,
          },
          auditEvents: [...r.auditEvents, approveEvent, iikoEvent],
        };
      })
    );
  };

  const rejectRequest = (id: string, reviewer: string, reason?: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        if (r.aiVerdict?.duplicateDetected) {
          setPreventedLoss((prev) => prev + 18400);
        }
        const event: AuditEvent = {
          id: `ae-${Date.now()}`,
          requestId: id,
          event: 'rejected',
          actor: reviewer,
          timestamp: new Date().toISOString(),
          detail: reason ?? 'Request rejected.',
        };
        return {
          ...r,
          status: 'rejected' as const,
          reviewer,
          reviewerNote: reason,
          auditEvents: [...r.auditEvents, event],
        };
      })
    );
  };

  const resetDemo = () => {
    setRequests(INITIAL_REQUESTS);
    setPreventedLoss(0);
  };

  return (
    <DemoContext.Provider value={{ requests, preventedLoss, addRequest, approveRequest, rejectRequest, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoStore() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoStore must be used within DemoProvider');
  return ctx;
}
