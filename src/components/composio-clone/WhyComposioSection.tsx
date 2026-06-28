"use client";

import { Fragment, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    id: "camera-lock",
    number: "01",
    label: "CAMERA LOCK",
    title: "Proof captured at source",
    description:
      "Write-off photos are taken from the PWA camera — not uploaded from gallery. Each capture is tied to branch, time, and device context.",
    bullets: [
      "Camera-only flow prevents gallery uploads or screenshot reuse",
      "Branch, timestamp, and device ID attached at capture",
      "Request and photo are inseparable from submission onward",
    ],
  },
  {
    id: "ai-detection",
    number: "02",
    label: "AI DETECTION",
    title: "Duplicate caught instantly",
    description:
      "Perceptual hashing fingerprints every photo. Gemini Vision checks product, damage, and quantity against the claim.",
    bullets: [
      "Perceptual hash survives crop, resize, compression, and screenshots",
      "Gemini Vision confirms product identity and visible damage",
      "98.4% match triggers automatic rejection before review",
    ],
  },
  {
    id: "risk-engine",
    number: "03",
    label: "RISK ENGINE",
    title: "Score before it reaches review",
    description:
      "Every request gets a risk score from multiple signals before a reviewer sees it. High-risk requests route to Control Department automatically.",
    bullets: [
      "Duplicate photo, quantity anomaly, weak comment, sender pattern",
      "Score 0–100 determines routing: Supervisor, Control, or Supply",
      "Anti-collusion: employees cannot approve their own requests",
    ],
  },
  {
    id: "iiko-sync",
    number: "04",
    label: "IIKO SYNC",
    title: "One approval. One write-off act.",
    description:
      "Approved requests create iiko write-off acts automatically. IIKO_MODE=sandbox in demo; same contract as real iikoServer API.",
    bullets: [
      "iiko adapter with sandbox provider — same contract as iikoServer API",
      "Write-off act created on approval with full audit trail",
      "IIKO_MODE switches from sandbox to real without code changes",
    ],
  },
];

const bgImages = [
  "/images/composio/tool-calls-bg.png",
  "/images/composio/constant-evolution-bg.png",
  "/images/composio/end-user-auth-bg.png",
  "/images/composio/dynamic-sandbox.png",
];

const colorStrips = [
  ["#1a1a1a", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)", "#1a1a1a", "rgba(255,255,255,0.02)"],
  ["#1a1a1a", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)", "#1a1a1a", "rgba(255,255,255,0.02)"],
  ["rgba(255,255,255,0.02)", "#1a1a1a", "rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)", "#1a1a1a"],
];

// ─── Shared ───────────────────────────────────────────────────────────────────

type DemoState = { phase: string; replay: () => void };

function ActiveDots({ active, cols = 6 }: { active: boolean; cols?: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [active]);

  const rows = 2;
  return (
    <div
      className="inline-grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 5px)`, gridTemplateRows: `repeat(${rows}, 5px)` }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const wave = 0.5 * Math.sin((0.5 * col - 0.15 * tick) * Math.PI) + 0.5;
        const rand = (() => {
          const n = Math.sin(12.9898 * 0.6 * col + 78.233 * 0.7 * row + 43.758 * 0.08 * tick) * 43758.5453;
          return n - Math.floor(n);
        })();
        const brightness = 0.4 * rand + 0.6 * wave;
        const on = active && brightness > 0.25;
        const tier = brightness > 0.7 ? 2 : brightness > 0.5 ? 1 : 0;
        return (
          <div
            key={i}
            className={cn(
              "h-[5px] w-[5px] transition-colors duration-300",
              !on && "bg-white/[0.04]",
              on && tier === 2 && "bg-red-400",
              on && tier === 1 && "bg-red-500/70",
              on && tier === 0 && "bg-red-700/40",
            )}
          />
        );
      })}
    </div>
  );
}

function PanelShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[340px] border border-white/[0.12] bg-[#0f0f0f] font-mono text-xs shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Demo 1: Camera Lock ──────────────────────────────────────────────────────

function CameraLockDemo({ onStateChange }: { onStateChange?: (s: DemoState) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "pwa" | "capturing" | "submitted">("idle");
  const triggered = useRef(false);

  const run = useCallback(() => {
    setPhase("pwa");
    setTimeout(() => setPhase("capturing"), 900);
    setTimeout(() => setPhase("submitted"), 2100);
  }, []);

  const replay = useCallback(() => {
    setPhase("idle");
    setTimeout(run, 400);
  }, [run]);

  useEffect(() => { onStateChange?.({ phase, replay }); }, [phase, replay, onStateChange]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          setTimeout(run, 700);
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [run]);

  return (
    <div className="flex h-full w-full items-center justify-center" ref={rootRef}>
      <PanelShell>
        {/* PWA header */}
        <div className="flex items-center justify-between border-white/[0.06] border-b px-3 py-2">
          <span className="text-[9px] text-white/30 uppercase tracking-wider">PHYLAX PWA · Write-off</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <span className="text-[9px] text-white/20">Branch #3</span>
          </div>
        </div>

        {/* Camera area */}
        <div className="relative h-[140px] overflow-hidden bg-[#111]">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                className="flex h-full items-center justify-center"
              >
                <span className="text-[10px] text-white/15">camera · tap to capture</span>
              </motion.div>
            )}
            {phase === "pwa" && (
              <motion.div
                key="pwa"
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-2"
              >
                <div className="flex h-[56px] w-[56px] items-center justify-center border-2 border-white/20">
                  <div className="h-[36px] w-[36px] border border-white/10 bg-white/[0.04]" />
                </div>
                <span className="text-[9px] text-white/25">camera only · no gallery upload</span>
              </motion.div>
            )}
            {phase === "capturing" && (
              <motion.div
                key="capturing"
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                className="flex h-full items-center justify-center bg-white/[0.03]"
              >
                <motion.div
                  animate={{ scale: 1.8, opacity: 0 }}
                  initial={{ scale: 0.6, opacity: 1 }}
                  transition={{ duration: 0.55 }}
                  className="h-[100px] w-[100px] border-2 border-white/30"
                />
                <span className="absolute text-[10px] text-white/40">Capturing...</span>
              </motion.div>
            )}
            {phase === "submitted" && (
              <motion.div
                key="submitted"
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center gap-2 bg-[#0a1a0f]"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  <span className="text-[10px] text-green-400/80">Photo fingerprinted</span>
                </div>
                <span className="text-[9px] text-white/25">hash: a3f2b1c4d5e6f7a8...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-0 px-3 py-2.5">
          {[
            ["Branch", "Branch #3"],
            ["Product", "Tomatoes"],
            ["Quantity", "40 pcs"],
            ["Device", "SMP-X7 · camera:locked"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between border-white/[0.04] border-b py-1.5">
              <span className="text-[10px] text-white/30">{label}</span>
              <span className="text-[10px] text-white/50">{value}</span>
            </div>
          ))}
          {phase === "submitted" ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 4 }}
              className="mt-2 border border-blue-500/20 bg-blue-500/[0.06] px-2.5 py-1.5 text-center"
            >
              <span className="text-[9px] text-blue-400/70">Entering risk queue · PHYLAX</span>
            </motion.div>
          ) : (
            <div className="mt-2 cursor-default bg-white/[0.06] px-2.5 py-1.5 text-center">
              <span className="text-[9px] text-white/35">Submit write-off</span>
            </div>
          )}
        </div>
      </PanelShell>
    </div>
  );
}

// ─── Demo 2: AI Detection ─────────────────────────────────────────────────────

function AIDetectionDemo({ onStateChange }: { onStateChange?: (s: DemoState) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "hashing" | "searching" | "matched">("idle");
  const triggered = useRef(false);

  const run = useCallback(() => {
    setPhase("hashing");
    setTimeout(() => setPhase("searching"), 900);
    setTimeout(() => setPhase("matched"), 2000);
  }, []);

  const replay = useCallback(() => {
    setPhase("idle");
    setTimeout(run, 400);
  }, [run]);

  useEffect(() => { onStateChange?.({ phase, replay }); }, [phase, replay, onStateChange]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          setTimeout(run, 800);
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [run]);

  const hashChars = "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6";

  return (
    <div className="flex h-full w-full items-center justify-center" ref={rootRef}>
      <div className="flex h-[320px] w-[340px] flex-col border border-white/[0.12] bg-[#0f0f0f] font-mono text-xs shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-white/[0.06] border-b px-3 py-2">
          <span className="text-[9px] text-white/30 uppercase tracking-wider">Photo Fingerprint</span>
          <div className="flex items-center gap-1.5">
            <ActiveDots active={phase === "hashing" || phase === "searching"} cols={8} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-3">
          {/* Incoming request */}
          {phase !== "idle" && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}>
              <div className="mb-1 text-[9px] text-white/20 uppercase tracking-wider">Incoming request</div>
              <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
                <span className="text-[10px] text-white/40">req-2341 · Tomatoes · 40 pcs · Branch #3</span>
              </div>
            </motion.div>
          )}

          {/* Hash computation */}
          {(phase === "hashing" || phase === "searching" || phase === "matched") && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 4 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <div className="mb-1 text-[9px] text-white/20 uppercase tracking-wider">Perceptual hash</div>
              <div className="border border-white/[0.06] bg-[#111] px-2.5 py-1.5">
                <span
                  className="text-[10px] leading-normal"
                  style={{
                    color: phase === "hashing" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {phase === "hashing"
                    ? hashChars
                        .split("")
                        .map((c, i) => (i % 3 === 0 ? "·" : c))
                        .join("")
                    : hashChars}
                </span>
              </div>
            </motion.div>
          )}

          {/* History search */}
          {(phase === "searching" || phase === "matched") && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 4 }} transition={{ duration: 0.3 }}>
              <div className="mb-1 text-[9px] text-white/20 uppercase tracking-wider">
                {phase === "searching" ? "Searching 12,847 photos..." : "Match found"}
              </div>
              {phase === "searching" && (
                <div className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  <span className="text-[10px] text-white/25">scanning history...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* Match result */}
          {phase === "matched" && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} transition={{ duration: 0.35 }}>
              <div className="flex flex-col gap-1.5 border border-red-500/30 bg-red-500/[0.06] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-red-400/80 uppercase tracking-wider">Duplicate detected</span>
                  <span className="text-[11px] font-semibold text-red-400">98.4%</span>
                </div>
                <div className="flex gap-3 text-[10px] text-white/30">
                  <span>req-1847</span>
                  <span>·</span>
                  <span>Branch #3</span>
                  <span>·</span>
                  <span>3 days ago</span>
                </div>
                <div className="mt-1 flex items-center justify-between border border-red-500/20 px-2 py-1">
                  <span className="text-[10px] text-white/40">STATUS</span>
                  <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">REJECTED</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Demo 3: Risk Engine ──────────────────────────────────────────────────────

const riskSignals = [
  { label: "Duplicate photo detected", score: 40, color: "#ef4444" },
  { label: "Weak damage description", score: 20, color: "#f59e0b" },
  { label: "Sender history: 3 rejections", score: 18, color: "#f59e0b" },
  { label: "Abnormal quantity for product", score: 13, color: "#f59e0b" },
];

function RiskEngineDemo({ onStateChange }: { onStateChange?: (s: DemoState) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "signals" | "scoring" | "routed">("idle");
  const [visibleSignals, setVisibleSignals] = useState(0);
  const triggered = useRef(false);

  const run = useCallback(() => {
    setPhase("signals");
    setVisibleSignals(0);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleSignals(i);
      if (i >= riskSignals.length) {
        clearInterval(interval);
        setTimeout(() => setPhase("scoring"), 300);
        setTimeout(() => setPhase("routed"), 1100);
      }
    }, 400);
  }, []);

  const replay = useCallback(() => {
    setPhase("idle");
    setVisibleSignals(0);
    setTimeout(run, 400);
  }, [run]);

  useEffect(() => { onStateChange?.({ phase, replay }); }, [phase, replay, onStateChange]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          setTimeout(run, 800);
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [run]);

  const totalScore = riskSignals.slice(0, visibleSignals).reduce((a, s) => a + s.score, 0);

  return (
    <div className="flex h-full w-full items-center justify-center" ref={rootRef}>
      <div className="flex h-[320px] w-[340px] flex-col border border-white/[0.12] bg-[#0f0f0f] font-mono text-xs shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-white/[0.06] border-b px-3 py-2">
          <span className="text-[9px] text-white/30 uppercase tracking-wider">Risk Engine · req-2341</span>
          {phase !== "idle" && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: totalScore >= 80 ? "#ef4444" : totalScore >= 50 ? "#f59e0b" : "#22c55e" }}
            >
              {totalScore}/100
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
          {/* Signals */}
          <div className="flex flex-col gap-1.5">
            {riskSignals.slice(0, visibleSignals).map((signal, i) => (
              <motion.div
                key={signal.label}
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25, delay: 0.05 * i }}
                className="flex items-center justify-between border border-white/[0.04] bg-white/[0.02] px-2.5 py-1.5"
              >
                <span className="text-[10px] text-white/40">{signal.label}</span>
                <span className="text-[10px] font-semibold" style={{ color: signal.color }}>
                  +{signal.score}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Score bar */}
          {phase === "scoring" || phase === "routed" ? (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 4 }} transition={{ duration: 0.3 }}>
              <div className="mb-1 flex items-center justify-between text-[9px] text-white/20">
                <span>risk score</span>
                <span className="text-red-400 font-semibold">91 / 100</span>
              </div>
              <div className="h-[3px] w-full bg-white/[0.06]">
                <motion.div
                  animate={{ width: "91%" }}
                  initial={{ width: "0%" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-red-500"
                />
              </div>
            </motion.div>
          ) : null}

          {/* Routing decision */}
          {phase === "routed" && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="mt-auto border border-red-500/30 bg-red-500/[0.07] px-2.5 py-2"
            >
              <div className="mb-1 text-[9px] text-white/25 uppercase tracking-wider">Routing decision</div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/60">Control Department</span>
                <span className="text-[9px] text-red-400 uppercase tracking-wider">auto-routed</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Demo 4: iiko Sync ────────────────────────────────────────────────────────

function IikoSyncDemo({ onStateChange }: { onStateChange?: (s: DemoState) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "approved" | "creating" | "synced">("idle");
  const triggered = useRef(false);

  const run = useCallback(() => {
    setPhase("approved");
    setTimeout(() => setPhase("creating"), 800);
    setTimeout(() => setPhase("synced"), 2200);
  }, []);

  const replay = useCallback(() => {
    setPhase("idle");
    setTimeout(run, 400);
  }, [run]);

  useEffect(() => { onStateChange?.({ phase, replay }); }, [phase, replay, onStateChange]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          setTimeout(run, 800);
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [run]);

  const isActive = phase === "approved" || phase === "creating";
  const statusLabel = { idle: "iiko adapter · sandbox", approved: "approved · processing...", creating: "creating act...", synced: "synced" }[phase];

  return (
    <div className="flex h-full w-full items-center justify-center" ref={rootRef}>
      <div className="w-[340px] border border-white/[0.12] bg-[#0f0f0f] font-mono text-xs shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between border-white/[0.06] border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <ActiveDots active={isActive} cols={8} />
            <span className="text-[9px] text-white/30 uppercase tracking-wider">iiko Adapter</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                isActive ? "animate-pulse bg-amber-400" : phase === "synced" ? "bg-green-400" : "bg-white/10",
              )}
            />
            <span className="text-[9px] text-white/25">{statusLabel}</span>
          </div>
        </div>

        <div className="p-3">
          {/* Approval event */}
          {phase !== "idle" && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }} className="mb-3">
              <div className="flex flex-col gap-1 border border-green-500/20 bg-green-500/[0.05] px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-green-400/70 uppercase tracking-wider">writeoff.approved</span>
                  <span className="text-[9px] text-white/25">req-2342</span>
                </div>
                {[
                  ["product", "Tomatoes"],
                  ["quantity", "40 pcs"],
                  ["branch", "Branch #3"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[9px]">
                    <span className="text-white/20">{k}:</span>
                    <span className="text-white/40">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Adapter code */}
          {(phase === "creating" || phase === "synced") && (
            <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mb-3">
              <div className="border border-white/[0.08] bg-[#111]">
                {phase === "creating" && (
                  <div className="flex items-center gap-2 border-white/[0.06] border-b px-2.5 py-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    <span className="text-[9px] text-white/25">iiko_adapter.create_writeoff_act()</span>
                  </div>
                )}
                <pre className="px-2.5 py-2 text-[9px] leading-relaxed text-white/25">
                  {`mode:      ${phase === "synced" ? "sandbox" : "sandbox"}\nwarehouse: branch_3_iiko_id\nproduct:   tomatoes_sku_041\nquantity:  40`}
                </pre>
              </div>
            </motion.div>
          )}

          {/* Synced result */}
          {phase === "synced" && (
            <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 4 }} transition={{ duration: 0.35 }}>
              <div className="flex flex-col gap-1.5 border border-green-500/25 bg-green-500/[0.06] px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-green-400/80">Write-off act created</span>
                </div>
                {[
                  ["document_id", "IIKO-SBX-WO-2342", "#22c55e"],
                  ["IIKO_MODE", "sandbox", "rgba(255,255,255,0.4)"],
                  ["status", "synced", "#22c55e"],
                ].map(([k, v, color]) => (
                  <div key={k} className="flex justify-between text-[9px]">
                    <span className="text-white/25">{k}</span>
                    <span style={{ color }}>{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

const VISUAL_DEMOS = [CameraLockDemo, AIDetectionDemo, RiskEngineDemo, IikoSyncDemo];

// ─── Color strip ──────────────────────────────────────────────────────────────

function ColorStrip({ patternIndex }: { patternIndex: number }) {
  const strip = colorStrips[patternIndex] ?? colorStrips[0];
  return (
    <div className="flex h-[14px] w-full">
      {strip.map((color, i) => (
        <div key={i} className="h-full flex-1 border border-[#2c2c2c]" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

// ─── Feature panel ────────────────────────────────────────────────────────────

function FeaturePanel({ tab, gradientIndex }: { tab: (typeof features)[0]; gradientIndex: number }) {
  const Demo = VISUAL_DEMOS[gradientIndex];
  const [demoState, setDemoState] = useState<DemoState | null>(null);

  const endPhases = ["submitted", "matched", "routed", "synced"];
  const showReplay = demoState !== null && demoState.phase === endPhases[gradientIndex];

  return (
    <div className="dark flex flex-col border border-[#2c2c2c] bg-[#0f0f0f] lg:min-h-[400px] lg:flex-row lg:items-start lg:gap-[24px] lg:py-0 lg:pr-[30px] lg:pl-0 xl:gap-[30px] xl:pr-[40px]">
      {/* Visual demo area */}
      <div
        className="relative flex h-[240px] w-full items-center justify-center overflow-hidden sm:h-[280px] md:h-[320px] lg:h-auto lg:w-[55%] lg:shrink-0 lg:self-stretch xl:w-[580px]"
        style={{
          backgroundImage: `url(${bgImages[gradientIndex]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="scale-[0.65] sm:scale-[0.75] md:scale-[0.85] lg:scale-100">
          {Demo && <Demo onStateChange={setDemoState} />}
        </div>
        {showReplay && demoState && (
          <motion.button
            animate={{ opacity: 1 }}
            className="absolute right-3 bottom-3 flex size-6 items-center justify-center bg-white/20 text-white/50 backdrop-blur-sm transition-colors hover:bg-white/30 hover:text-white/80"
            initial={{ opacity: 0 }}
            onClick={demoState.replay}
            transition={{ delay: 0.5 }}
            type="button"
          >
            <RotateCw size={12} strokeWidth={3} />
          </motion.button>
        )}
      </div>

      {/* Copy area */}
      <div className="flex w-full min-w-0 flex-1 flex-col px-4 pt-4 pb-5 sm:px-5 lg:px-0 lg:pt-[30px] lg:pb-[30px]">
        <div className="flex flex-col gap-3">
          <div className="flex size-7 items-center justify-center rounded-[4px] bg-white/[0.08] font-mono text-[rgba(255,255,255,0.64)] text-sm">
            {tab.number}
          </div>
          <h3 className="text-[22px] text-white leading-snug sm:text-[26px] lg:text-[28px]">{tab.title}</h3>
        </div>
        <p className="mt-3 text-[13px] text-white leading-normal opacity-80 sm:text-sm sm:leading-snug lg:mt-4">
          {tab.description}
        </p>
        <div className="relative mt-5 flex flex-col gap-4 sm:mt-6 lg:mt-10">
          <div className="absolute top-0 bottom-0 left-0 w-[3px] rounded-full bg-white/[0.24]" />
          {tab.bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-4">
              <div className="relative z-10 mt-[2px] h-[14px] w-[3px] shrink-0 rounded-full bg-white/[0.56]" />
              <p className="text-[13px] text-white/80 leading-normal sm:text-sm sm:leading-snug lg:w-[215px]">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function WhyComposioSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sentinels = useRef<(HTMLDivElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      let active = 0;
      for (let i = 1; i < sentinels.current.length; i++) {
        const el = sentinels.current[i];
        if (el && el.getBoundingClientRect().top <= 303) active = i;
      }
      setActiveIndex(active);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToPanel = useCallback((index: number) => {
    const panel = panels.current[index];
    if (!panel) return;
    const top = panel.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <section className="dark bg-[#0f0f0f]">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-10 pb-10 md:px-6 md:pt-[86px] md:pb-[72px] lg:px-6 xl:px-0">
        {/* Header */}
        <div className="flex flex-col gap-4 py-4 sm:gap-6 sm:py-0">
          <div className="flex items-center gap-2 self-start border border-white px-2 py-1">
            <div className="size-[5.82px] bg-white" />
            <span className="font-mono text-sm text-white leading-normal tracking-[-0.011em]">WHY PHYLAX</span>
          </div>
          <h2 className="max-w-[540px] text-white text-[1.5rem] font-normal leading-[1.1] tracking-[-0.025em]">
            Every write-off must
            <br />
            prove itself.
          </h2>
        </div>

        {/* Main layout */}
        <div className="mt-8 flex flex-col gap-4 sm:mt-10 md:mt-[79px] lg:flex-row lg:gap-[30px] xl:gap-[58px]">
          {/* Mobile/tablet horizontal tabs */}
          <div className="hidden gap-2 overflow-x-auto pb-1 sm:flex lg:hidden">
            {features.map((tab, i) => (
              <button
                key={tab.id}
                className={cn(
                  "flex shrink-0 items-center gap-2 border px-3 py-2 text-left transition-all duration-300",
                  activeIndex === i ? "border-[#0007cd] bg-[#1e1e1e]" : "border-[#2c2c2c]",
                )}
                onClick={() => scrollToPanel(i)}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-[20px] items-center justify-center rounded-[4px] font-mono text-xs",
                    activeIndex === i ? "bg-[#0007cd] text-white" : "bg-[#0f0f0f] text-white/56",
                  )}
                >
                  {tab.number}
                </span>
                <span className="font-mono text-white text-xs leading-normal tracking-[-0.011em]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Desktop sticky sidebar */}
          <div className="hidden lg:block lg:w-[226px] lg:shrink-0">
            <div className="lg:sticky" style={{ top: 96 }}>
              <div className="relative">
                <div className="absolute inset-0 hidden border border-[#2c2c2c] lg:block" />
                <div className="relative flex overflow-x-auto lg:flex-col">
                  {features.map((tab, i) => (
                    <button
                      key={tab.id}
                      className={cn(
                        "flex min-w-[160px] shrink-0 items-center gap-[14px] border p-[10px] text-left transition-all duration-300 lg:w-full lg:min-w-0",
                        activeIndex === i ? "border-[#0007cd] bg-[#1e1e1e]" : "border-[#2c2c2c]",
                      )}
                      onClick={() => scrollToPanel(i)}
                      type="button"
                    >
                      <span
                        className={cn(
                          "flex size-[23px] items-center justify-center rounded-[4px] p-0.5 font-mono text-sm",
                          activeIndex === i ? "bg-[#0007cd] text-white" : "bg-[#0f0f0f] text-white/56",
                        )}
                      >
                        {tab.number}
                      </span>
                      <span className="font-mono text-sm text-white leading-normal tracking-[-0.011em]">
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content panels */}
          <div className="flex-1">
            {features.map((tab, i) => (
              <Fragment key={tab.id}>
                <div
                  className="pointer-events-none h-0"
                  ref={(el) => { sentinels.current[i] = el; }}
                />
                <div
                  className="lg:sticky"
                  ref={(el) => { panels.current[i] = el; }}
                  style={{ top: 96, zIndex: i }}
                >
                  <FeaturePanel gradientIndex={i} tab={tab} />
                  <ColorStrip patternIndex={i < 3 ? i : 0} />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
