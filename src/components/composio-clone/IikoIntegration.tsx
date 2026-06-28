import { Kicker } from "./shared";

const flowSteps = ["Request", "Review", "Approve", "iiko Adapter", "Write-off act", "Inventory"];

const adapterCards = [
  { label: "iikoServer API", detail: "Same contract in sandbox and production." },
  { label: "Token cache", detail: "Auth tokens cached and refreshed automatically." },
  { label: "Product mapping", detail: "PHYLAX products mapped to iiko nomenclature." },
  { label: "Warehouse mapping", detail: "Branch IDs mapped to iiko warehouse IDs." },
  { label: "Write-off act", detail: "Created on approval with full document metadata." },
  { label: "Audit log", detail: "Every sync stored with iiko document ID." },
];

export function IikoIntegration() {
  return (
    <>
      {/* Demo moment: dramatic comparison */}
      <section className="security-section dark-section">
        <div className="section-shell">
          <h2 className="section-title">The fake write-off gets blocked before iiko.</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginTop: "3rem",
            }}
          >
            {/* Left: Old process */}
            <div
              style={{
                background: "#111",
                padding: "2.5rem 2.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.28)",
                    letterSpacing: "0.1em",
                  }}
                >
                  OLD PROCESS
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    background: "rgba(239,68,68,0.12)",
                    color: "#ef4444",
                    padding: "3px 10px",
                    letterSpacing: "0.06em",
                  }}
                >
                  APPROVED
                </span>
              </div>

              <p
                style={{
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Reused photo submitted via chat. No duplicate check.
              </p>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#ef4444",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(239,68,68,0.12)",
                }}
              >
                Loss: ₸18,400
              </div>
            </div>

            {/* Right: PHYLAX */}
            <div
              style={{
                background: "#0a0a0a",
                padding: "2.5rem 2.5rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.28)",
                    letterSpacing: "0.1em",
                  }}
                >
                  PHYLAX
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.7rem",
                    background: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                    padding: "3px 10px",
                    letterSpacing: "0.06em",
                  }}
                >
                  REJECTED
                </span>
              </div>

              <div
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  padding: "0.85rem 1rem",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "#ef4444",
                  letterSpacing: "0.04em",
                }}
              >
                Duplicate photo detected
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.8,
                }}
              >
                Match: <span style={{ color: "rgba(255,255,255,0.6)" }}>98.4%</span>
                <br />
                Risk: <span style={{ color: "#ef4444" }}>91/100</span>
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#22c55e",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(34,197,94,0.1)",
                }}
              >
                Prevented: ₸18,400
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* iiko Integration section */}
      <section className="community-section">
        <div className="section-shell">
          <Kicker>IIKO INTEGRATION</Kicker>
          <h2 className="section-title">One approval. One iiko write-off act.</h2>

          {/* Flow diagram */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflowX: "auto",
              paddingBottom: "0.5rem",
              margin: "2.5rem 0",
              gap: "0",
            }}
          >
            {flowSteps.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.72rem",
                    color: i === 3 ? "white" : "rgba(255,255,255,0.45)",
                    padding: "0.45rem 0.9rem",
                    border: `1px solid ${i === 3 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                    background: i === 3 ? "rgba(255,255,255,0.06)" : "transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step}
                </div>
                {i < flowSteps.length - 1 && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.18)",
                      padding: "0 0.3rem",
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Adapter cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "2rem",
            }}
          >
            {adapterCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: "#0f0f0f",
                  padding: "1.5rem 1.5rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.35rem",
                }}
              >
                <h3
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                    color: "white",
                    margin: 0,
                    letterSpacing: "0.02em",
                    fontWeight: 500,
                  }}
                >
                  {card.label}
                </h3>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {card.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Sandbox note */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.65rem 1rem",
              border: "1px solid rgba(255,255,255,0.07)",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.55)" }}>IIKO_MODE=sandbox</span>
            <span>·</span>
            <span>Demo uses sandbox provider with same contract as real iikoServer API.</span>
          </div>
        </div>
      </section>
    </>
  );
}
