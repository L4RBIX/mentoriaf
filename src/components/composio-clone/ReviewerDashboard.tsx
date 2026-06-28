const request = {
  id: "2341",
  branch: "Branch #3",
  product: "Tomatoes",
  quantity: "40 pcs",
  sender: "Cook · A. Bekova",
  route: "Control Department",
  riskScore: 91,
  matchScore: "98.4%",
  iiko: {
    status: "ready",
    docId: "IIKO-SBX-WO-2341",
  },
};

function Row({
  label,
  value,
  accent,
  large,
}: {
  label: string;
  value: string;
  accent?: string;
  large?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontFamily: "monospace",
        fontSize: large ? "0.82rem" : "0.75rem",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.28)" }}>{label}</span>
      <span style={{ color: accent ?? "rgba(255,255,255,0.75)", fontWeight: large ? 500 : 400 }}>{value}</span>
    </div>
  );
}

export function ReviewerDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: "560px" }}>
      {/* Title bar */}
      <div
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            height: "36px",
            padding: "0 14px",
            background: "#1a1a1a",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ width: "11px", height: "11px", borderRadius: "999px", background: "#ff605c", flexShrink: 0 }} />
          <span style={{ width: "11px", height: "11px", borderRadius: "999px", background: "#ffbd44", flexShrink: 0 }} />
          <span style={{ width: "11px", height: "11px", borderRadius: "999px", background: "#00ca4e", flexShrink: 0 }} />
          <em
            style={{
              marginLeft: "8px",
              color: "rgba(255,255,255,0.25)",
              fontStyle: "normal",
              fontSize: "10px",
              letterSpacing: "0.06em",
              fontFamily: "monospace",
            }}
          >
            PHYLAX · Risk Queue
          </em>
        </div>

        {/* Risk header — dominant */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.08em",
                marginBottom: "4px",
              }}
            >
              REQUEST
            </div>
            <strong style={{ fontFamily: "monospace", fontSize: "1rem", color: "white", fontWeight: 600 }}>
              #{request.id}
            </strong>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ef4444",
                lineHeight: 1,
              }}
            >
              {request.riskScore}
              <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "rgba(239,68,68,0.55)" }}>/100</span>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.1em",
              }}
            >
              RISK
            </div>
          </div>
        </div>
      </div>

      {/* Request fields */}
      <div
        style={{
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "0.75rem 1rem",
        }}
      >
        <Row label="Branch" value={request.branch} />
        <Row label="Product" value={request.product} large />
        <Row label="Quantity" value={request.quantity} />
        <Row label="Sender" value={request.sender} />
        <Row label="Route" value={request.route} accent="#ef4444" large />
      </div>

      {/* AI verdict */}
      <div
        style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.25)",
          padding: "0.85rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
        }}
      >
        <div
          style={{ fontFamily: "monospace", fontSize: "10px", letterSpacing: "0.08em", color: "#ef4444" }}
        >
          AI VERDICT
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
          Duplicate photo detected · Match:{" "}
          <span style={{ color: "#ef4444" }}>{request.matchScore}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="button"
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            padding: "0.65rem",
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e",
            cursor: "pointer",
          }}
        >
          APPROVE
        </button>
        <button
          type="button"
          style={{
            flex: 1,
            fontFamily: "monospace",
            fontSize: "0.72rem",
            letterSpacing: "0.08em",
            padding: "0.65rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            cursor: "pointer",
          }}
        >
          REJECT
        </button>
      </div>

      {/* iiko status row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          background: "#0f0f0f",
          border: "1px solid rgba(255,255,255,0.07)",
          fontFamily: "monospace",
          fontSize: "0.7rem",
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>IIKO_MODE=sandbox</span>
        <span style={{ color: "#22c55e" }}>● ready</span>
      </div>
    </div>
  );
}
