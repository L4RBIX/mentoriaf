const CARDS = [
  {
    title: "Camera Lock",
    copy: "Only live camera capture. No gallery uploads.",
    snippet: `req = camera.capture({\n  mode: "camera_only",\n  branch: "branch_3"\n})`,
  },
  {
    title: "Photo Fingerprint",
    copy: "Catches reused images after crop or compression.",
    snippet: `hash = phash(photo)\nmatch = db.nearest(hash)`,
  },
  {
    title: "Gemini Vision",
    copy: "Checks product, damage, and quantity.",
    snippet: `verdict = gemini.verify({\n  photo,\n  product,\n  damage\n})`,
  },
  {
    title: "Risk Score",
    copy: "Ranks every request from 0–100.",
    snippet: `score = risk.calculate({\n  duplicate,\n  quantity,\n  sender\n})`,
  },
  {
    title: "Anti-collusion",
    copy: "Blocks self-approval and suspicious pairs.",
    snippet: `if sender == reviewer:\n  block("self_approval")`,
  },
  {
    title: "Black Box Audit",
    copy: "Stores every decision and sync event.",
    snippet: `audit.log({\n  request_id,\n  decision,\n  iiko_doc\n})`,
  },
];

export function AntiFraudSection() {
  return (
    <section className="developer-section dark-section">
      <div className="section-shell">
        <div className="ascii-title" aria-label="ANTI-FRAUD ENGINE">
          ANTI-FRAUD ENGINE
        </div>
        <a className="button button-light" href="/app/demo">
          LAUNCH DEMO
        </a>
        <div className="developer-grid">
          {CARDS.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, copy, snippet }: { title: string; copy: string; snippet: string }) {
  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 300,
        borderRight: "1px solid #2c2c2c",
        borderBottom: "1px solid #2c2c2c",
      }}
    >
      {/* Code snippet area — fixed compact height */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "24px 24px 20px",
          minHeight: 120,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <pre
          style={{
            fontFamily: "var(--mono, monospace)",
            fontSize: 12,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {snippet}
        </pre>
      </div>

      {/* Title + description — fills remaining height */}
      <div
        style={{
          flex: 1,
          padding: "20px 24px 28px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.025)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {copy}
        </p>
      </div>
    </article>
  );
}
