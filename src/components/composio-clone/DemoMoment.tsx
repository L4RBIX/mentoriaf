'use client';

import { CodeCard, SandboxInstance } from "./CodeCard";
import { useLanguage } from "@/components/LanguageProvider";

export function DemoMoment() {
  const { t } = useLanguage();
  return (
    <div className="hero-console">
      <div className="console-column left">
        <DetectionPanel />
        <CodeCard title={t('watch_panel_title')} className="watch-panel">
          <a className="button button-light button-small" href="/app/reviewer">
            {t('open_risk_queue_btn')}
          </a>
        </CodeCard>
      </div>
      <RiskEventCard />
      <RightPanels />
      <div className="sandbox-panel">
        <CodeCard title="AUDIT LOG">
          <div className="sandbox-grid">
            <SandboxInstance
              id="req-2341 · Branch #3"
              code={`Duplicate photo detected\nMatch: 98.4% (req-1847)\nRisk score: 91 → REJECTED`}
            />
            <SandboxInstance
              id="req-2342 · Branch #1"
              code={`Photo verified by Gemini\nQuantity match: confirmed\nRisk score: 8 → APPROVED`}
            />
          </div>
        </CodeCard>
      </div>
    </div>
  );
}

function Dot({ color, square }: { color: string; square?: boolean }) {
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: square ? 2 : "50%",
        background: color,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  );
}

function DetectionPanel() {
  return (
    <CodeCard title="FAKE_WRITEOFF_DETECTED" className="search-tools-panel">
      <div className="search-row">
        <svg viewBox="0 0 16 16" fill="none" style={{ color: "rgba(255,255,255,0.3)" }}>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span>Analyzing photo hash…</span>
        <em>req-2341</em>
      </div>

      <div className="tool-match">
        <Dot color="#ef4444" />
        <span>
          <strong>risk_score</strong>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>fraud probability</span>
        </span>
        <b style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>91/100</b>
      </div>

      <div className="tool-match">
        <Dot color="#f59e0b" />
        <span>
          <strong>duplicate_match</strong>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>perceptual hash</span>
        </span>
        <b style={{ background: "rgba(245,158,11,0.18)", color: "#f59e0b" }}>98.4%</b>
      </div>

      <div className="tool-match">
        <Dot color="#22c55e" />
        <span>
          <strong>prevented_loss</strong>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>financial impact</span>
        </span>
        <b style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>₸18,400</b>
      </div>

      <div className="tool-match">
        <Dot color="#ef4444" square />
        <span>
          <strong>status</strong>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>writeoff blocked</span>
        </span>
        <b style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", letterSpacing: "0.04em" }}>REJECTED</b>
      </div>
    </CodeCard>
  );
}

function RiskEventCard() {
  return (
    <div className="agent-card">
      <div className="agent-title">
        <span className="spark">✳</span>
        Risk <em>Engine</em>
      </div>
      <div className="agent-prompt">
        Request #2341 · Branch #3 · Tomatoes · 40 pcs · Sender: Cook A. Bekova
      </div>
      <div className="agent-steps">
        <div>HASH PHOTO ›</div>
        <div>MATCH HISTORY ›</div>
      </div>
      <p className="agent-result">
        Duplicate detected. Photo hash matches request #1847 at 98.4%. Risk score: 91/100. Routing to Control Department.
      </p>
      <pre className="agent-json">
        {`{\n  "event": "writeoff.rejected",\n  "risk_score": 91,\n  "duplicate_match": 98.4,\n  "prevented_loss": 18400,\n  "route_to": "control_department"\n}`}
      </pre>
      <div className="reply-box">
        <svg viewBox="0 0 20 20" fill="none" style={{ opacity: 0.3 }}>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <em>Route to reviewer…</em>
        <span />
        <button aria-label="send">
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
            <path d="M10 3l7 7-7 7M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function RightPanels() {
  return (
    <div className="console-column right">
      <CodeCard title="IIKO_SYNC" className="connection-panel">
        <div className="connection-row">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
          <span>
            <strong style={{ color: "rgba(255,255,255,0.72)", fontWeight: 500, fontSize: "0.75rem" }}>mode</strong>
            <small>adapter layer</small>
          </span>
          <b style={{ color: "rgba(255,255,255,0.58)", fontWeight: "normal" }}>sandbox</b>
        </div>
        <div className="connection-row">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
          <span>
            <strong style={{ color: "rgba(255,255,255,0.72)", fontWeight: 500, fontSize: "0.75rem" }}>status</strong>
            <small>iiko sync</small>
          </span>
          <b>• synced</b>
        </div>
        <div className="kv">
          <span>document_id</span>
          <em>IIKO-SBX-WO-2341</em>
        </div>
        <div className="kv">
          <span>warehouse</span>
          <em>Branch #3</em>
        </div>
      </CodeCard>

      <CodeCard title="IIKO ADAPTER" className="execute-panel">
        <div className="panel-meta">MODE: sandbox · contract: iikoServer</div>
        <div className="command-row">
          <span style={{ color: "rgba(255,255,255,0.38)" }}>›</span>
          <span style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.75rem" }}>create_writeoff_act</span>
        </div>
        <div className="kv">
          <span>warehouse</span>
          <em>Branch #3</em>
        </div>
        <div className="kv">
          <span>product</span>
          <em>Tomatoes · 40 pcs</em>
        </div>
        <p className="ok">✓ IIKO-SBX-WO-2341 created</p>
      </CodeCard>

      <CodeCard title="SYSTEM STATUS" className="config-panel">
        {(
          [
            ["IIKO_MODE", "sandbox"],
            ["GEMINI", "active"],
            ["HASH_ENGINE", "running"],
          ] as const
        ).map(([k, v]) => (
          <div className="config-row" key={k}>
            <span>{k}</span>
            <em>{v}</em>
          </div>
        ))}
      </CodeCard>
    </div>
  );
}
