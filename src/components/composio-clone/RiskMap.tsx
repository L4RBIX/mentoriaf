const branches = [
  { id: 1, name: "Bahandi Branch #1", risk: "low", score: 12, alerts: 0 },
  { id: 2, name: "Bahandi Branch #2", risk: "medium", score: 47, alerts: 2 },
  { id: 3, name: "Bahandi Branch #3", risk: "high", score: 91, alerts: 5 },
  { id: 4, name: "Bahandi Branch #4", risk: "low", score: 8, alerts: 0 },
  { id: 5, name: "Bahandi Branch #5", risk: "medium", score: 53, alerts: 3 },
] as const;

const riskColors = {
  low: { dot: "#22c55e", text: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
  medium: { dot: "#f59e0b", text: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  high: { dot: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

export function RiskMap() {
  return (
    <div className="platform-visual" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Header */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.1em",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        BAHANDI NETWORK · LIVE RISK VIEW
      </div>

      {/* Branch list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {branches.map((branch) => {
          const c = riskColors[branch.risk];
          return (
            <div
              key={branch.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                background: c.bg,
                border: `1px solid ${c.border}`,
                fontFamily: "monospace",
                fontSize: "0.7rem",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "rgba(255,255,255,0.7)" }}>{branch.name}</span>
              <span style={{ color: c.text, fontWeight: 600 }}>{branch.score}/100</span>
              {branch.alerts > 0 && (
                <span
                  style={{
                    fontSize: "0.6rem",
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    padding: "1px 5px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {branch.alerts} alerts
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* High-risk popup */}
      <div
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.25)",
          padding: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: "#ef4444",
            letterSpacing: "0.06em",
          }}
        >
          HIGH RISK · Bahandi Branch #3
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            fontFamily: "monospace",
            fontSize: "0.68rem",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <span>Risk score: 91/100</span>
          <span>Latest alert: Duplicate photo detected</span>
          <span style={{ color: "#22c55e" }}>Prevented loss: ₸18,400</span>
        </div>
      </div>

      {/* Summary footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "monospace",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.25)",
          paddingTop: "0.5rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span>5 branches monitored</span>
        <span style={{ color: "#22c55e" }}>₸18,400 prevented today</span>
      </div>
    </div>
  );
}
