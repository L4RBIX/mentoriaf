import { workflows } from "./data";
import { ReviewerDashboard } from "./ReviewerDashboard";
import { RiskMap } from "./RiskMap";

const steps = [
  {
    step: "01",
    label: "Capture",
    copy: "Camera-only photo from cashier or cook. Tied to branch, device, and time.",
  },
  {
    step: "02",
    label: "Detect",
    copy: "Hash match + Gemini Vision + risk score.",
  },
  {
    step: "03",
    label: "Sync",
    copy: "Reviewer decides. iiko write-off act created automatically.",
  },
];

export function HowItWorks() {
  return (
    <section className="workflow-section">
      <div className="section-shell">
        <h2 className="section-title">Capture → Detect → Sync</h2>

        {/* 3-step overview */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: "2rem",
          }}
        >
          {steps.map((s) => (
            <div
              key={s.step}
              style={{
                background: "#0f0f0f",
                padding: "2rem 2.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.1em",
                }}
              >
                {s.step}
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 500, color: "white", margin: 0 }}>{s.label}</h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.55, margin: 0 }}>
                {s.copy}
              </p>
            </div>
          ))}
        </div>

        {/* Visual cards with ReviewerDashboard and RiskMap */}
        <div className="workflow-cards">
          {workflows.map((workflow) => (
            <article className={`workflow-card ${workflow.dark ? "dark-card" : ""}`} key={workflow.tag}>
              <div className="workflow-copy">
                <h3>
                  {workflow.label} <span>{workflow.tag}</span>
                </h3>
                <p>{workflow.copy}</p>
                <a className="button button-light" href="#">
                  VIEW DETAILS
                </a>
              </div>
              {workflow.dark ? <RiskMap /> : <ReviewerDashboard />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
