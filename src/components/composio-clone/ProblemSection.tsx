import type { Feature } from "./data";
import { features } from "./data";
import { Kicker } from "./shared";
import { SearchIcon } from "@/components/icons";

export function ProblemSection() {
  return (
    <section className="why-section dark-section">
      <div className="section-shell">
        <Kicker>WHY COMPOSIO</Kicker>
        <h2 className="section-title">Your agents are smart. Their tools should be too.</h2>
        <div className="feature-grid">
          <div className="feature-tabs">
            {features.map((feature, index) => (
              <a className={index === 0 ? "active" : ""} href={`#feature-${feature.id}`} key={feature.id}>
                <span>{feature.id}</span>
                {feature.tab}
              </a>
            ))}
          </div>
          <div className="feature-stack">
            {features.map((feature) => (
              <FeaturePanel feature={feature} key={feature.id} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturePanel({ feature }: { feature: Feature }) {
  return (
    <article className="feature-panel" id={`feature-${feature.id}`}>
      <div className="feature-art" data-art={feature.visual}>
        <img src={feature.image} alt="" />
        {feature.visual === "search" && <SearchVisual />}
        {feature.visual === "blank" && <div className="black-window" />}
        {feature.visual === "chat" && <ChatVisual />}
        {feature.visual === "code" && (
          <div className="feature-code">
            <span>Fetch and triage open production issues</span>
            <span>Group related traces by customer impact</span>
            <span>Create the follow-up task with context attached</span>
          </div>
        )}
      </div>
      <div className="feature-copy">
        <span className="feature-id">{feature.id}</span>
        <h3>{feature.title}</h3>
        <p>{feature.text}</p>
        <ul>
          {feature.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function SearchVisual() {
  return (
    <div className="floating-command">
      <SearchIcon />
      <span>list sentry errors and create linear issues</span>
      <em>resolving intent...</em>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="black-chat">
      <div>
        <span>AGENT CHAT</span>
        <em>• connected</em>
      </div>
      <p>Ask your agent something...</p>
    </div>
  );
}
