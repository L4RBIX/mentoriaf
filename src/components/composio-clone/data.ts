export type Logo = {
  name: string;
  src: string;
};

export type Feature = {
  id: string;
  tab: string;
  title: string;
  text: string;
  bullets: string[];
  image: string;
  visual: "search" | "blank" | "chat" | "code";
};

export type Workflow = {
  label: string;
  tag: string;
  copy: string;
  dark: boolean;
};

export type DeveloperCard = {
  title: string;
  copy: string;
  art: "auth" | "triggers" | "sessions" | "agnostic" | "fingerprint" | "audit";
};

export const clientLogos: Logo[] = [
  { name: "Bahandi", src: "" },
  { name: "iiko", src: "" },
  { name: "Gemini Vision", src: "" },
  { name: "Supabase", src: "" },
  { name: "PWA Camera", src: "" },
  { name: "Risk Engine", src: "" },
  { name: "Audit Log", src: "" },
];

export const features: Feature[] = [
  {
    id: "01",
    tab: "CAMERA LOCK",
    title: "Proof captured at source",
    text: "Write-off photos are taken from the PWA camera — not uploaded from gallery. Each capture is tied to branch, time, and device context.",
    bullets: [
      "Camera-only flow prevents gallery uploads or screenshot reuse",
      "Branch, timestamp, and device ID attached at capture",
      "Request and photo are inseparable from submission onward",
    ],
    image: "/images/composio/tool-calls-bg.png",
    visual: "search",
  },
  {
    id: "02",
    tab: "AI DETECTION",
    title: "Duplicate caught instantly",
    text: "Perceptual hashing fingerprints every photo. Gemini Vision checks product, damage, and quantity against the claim.",
    bullets: [
      "Perceptual hash survives crop, resize, compression, and screenshots",
      "Gemini Vision confirms product identity and visible damage",
      "98.4% match triggers automatic rejection before review",
    ],
    image: "/images/composio/constant-evolution-bg.png",
    visual: "blank",
  },
  {
    id: "03",
    tab: "RISK ENGINE",
    title: "Score before it reaches review",
    text: "Every request gets a risk score from multiple signals before a reviewer sees it. High-risk requests route to Control Department automatically.",
    bullets: [
      "Duplicate photo, quantity anomaly, weak comment, sender pattern",
      "Risk score 0–100 determines routing: Supervisor, Control, or Supply",
      "Anti-collusion: employees cannot approve their own requests",
    ],
    image: "/images/composio/end-user-auth-bg.png",
    visual: "chat",
  },
  {
    id: "04",
    tab: "IIKO SYNC",
    title: "One approval. One write-off act.",
    text: "Approved requests create iiko write-off acts automatically through the adapter layer. IIKO_MODE=sandbox in demo; same contract as real iikoServer API.",
    bullets: [
      "iiko adapter with sandbox provider, same contract as iikoServer API",
      "Write-off act created on approval with full audit trail",
      "IIKO_MODE switches from sandbox to real without business logic changes",
    ],
    image: "/images/composio/dynamic-sandbox.png",
    visual: "code",
  },
];

export const workflows: Workflow[] = [
  {
    label: "PHYLAX",
    tag: "RISK QUEUE",
    dark: false,
    copy: "Risk score, AI verdict, and routing — attached before any reviewer sees the request.",
  },
  {
    label: "PHYLAX",
    tag: "BRANCH MAP",
    dark: true,
    copy: "See which branches leak money before it reaches iiko.",
  },
];

export const developerCards: DeveloperCard[] = [
  {
    title: "Camera Lock",
    copy: "Only live camera capture. No gallery uploads.",
    art: "auth",
  },
  {
    title: "Photo Fingerprint",
    copy: "Catches reused images after crop, resize, or compression.",
    art: "fingerprint",
  },
  {
    title: "Gemini Vision",
    copy: "Checks product, visible damage, and quantity.",
    art: "sessions",
  },
  {
    title: "Risk Score",
    copy: "0–100 from duplicate photo, quantity, comment, and sender patterns.",
    art: "agnostic",
  },
  {
    title: "Anti-collusion",
    copy: "Flags suspicious sender-reviewer pairs automatically.",
    art: "triggers",
  },
  {
    title: "Black Box Audit",
    copy: "Every decision stored with iiko document ID.",
    art: "audit",
  },
];

export const appIcons = {
  slack: "/images/composio/app-icons/slack.png",
  notion: "/images/composio/app-icons/notion.png",
  github: "/images/composio/app-icons/github.png",
  linear: "/images/composio/app-icons/linear.png",
  gmail: "/images/composio/app-icons/gmail.png",
  stripe: "/images/composio/app-icons/stripe.png",
  sentry: "/images/composio/app-icons/sentry.png",
  vercel: "/images/composio/app-icons/vercel.png",
  supabase: "/images/composio/app-icons/supabase.png",
  sheets: "/images/composio/app-icons/googlesheets.png",
  calendar: "/images/composio/app-icons/googlecalendar.png",
  docs: "/images/composio/app-icons/googledocs.png",
  firecrawl: "/images/composio/app-icons/firecrawl.png",
} as const;

export type AppIconName = keyof typeof appIcons;
