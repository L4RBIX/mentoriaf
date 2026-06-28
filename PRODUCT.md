# Product

## Register

brand

## Users

Restaurant and retail operations staff at Bahandi-style multi-branch businesses. Three roles:
- **Cashiers / cooks** — submit write-off requests from a phone PWA, capture camera-only photo proof
- **Supervisor-administrator** — reviews normal-risk write-off requests
- **Control Department** — reviews high-risk and duplicate-photo fraud cases
- **Supply Department** — reviews product-quality write-off cases

They use this under time pressure, often on mobile, in a kitchen or warehouse context. They are not developers — but the people who buy and advocate for this tool (ops directors, CFOs) are data-literate and trust infrastructure that looks like infrastructure.

## Product Purpose

PHYLAX (also known as СВЕРКА) is an AI anti-fraud control layer for restaurant write-offs. It prevents fraudulent write-off acts before they reach iiko by:
- Enforcing camera-only photo capture tied to time, branch, and device
- Computing perceptual hashes to detect reused or duplicate photos
- Running Gemini Vision to verify product, damage, and quantity match the photo
- Scoring risk from multiple signals and routing to the right reviewer
- Syncing approved write-offs to iiko as write-off acts via an adapter layer (sandbox provider in demo mode, real iikoServer API in production — same contract)

Success: A restaurant chain reduces food-cost fraud to near zero within the first month. The food cost report shows exactly where write-offs were blocked and how much was prevented.

## Brand Personality

Uncompromising. Forensic. Industrial.

The brand does not try to be friendly. It tries to be airtight. The voice is that of an audit system, not a startup. Copy is declarative, not conversational. The Russian phrase "Подделать списание физически невозможно" captures the brand stance exactly — not a promise, a fact.

Emotional goal: *institutional trust*. Buyers should feel they are acquiring infrastructure, not software.

## Anti-references

- Generic SaaS landing page (cream/sand/beige, Inter, big stat cards)
- Restaurant menu or food delivery apps (bright, warm, food-centric)
- Childish or consumer fintech (rounded cards, emoji, approachable illustration)
- Editorial-magazine aesthetics (Cormorant italic, broadsheet columns, drop caps)
- Composio branding or product identity — the *visual system* is preserved from the clone, but the brand voice and copy are entirely PHYLAX

## Design Principles

1. **Infrastructure, not software.** Every visual decision should reinforce the feeling that this is a system people depend on, not an app people try. Terminals, audit logs, risk scores, document IDs — not icons and bullet points.
2. **Precision over warmth.** Data is always exact: risk 91/100, match 98.4%, prevented ₸18,400, document IIKO-SBX-WO-2341. Round numbers are suspicious; FORGED deals in specifics.
3. **Red means fraud. Green means clear.** No decorative color. Red appears exactly where fraud is detected or risk is high. Green appears exactly where a write-off is clean and synced. Every other color is neutral infrastructure.
4. **The demo is the argument.** The most persuasive moment on the page is showing a fake write-off being blocked. That sequence — duplicate detected → risk 91 → rejected → ₸18,400 prevented — must land before the buyer scrolls past it.
5. **iiko is real, not marketing.** The iiko integration is presented as an adapter architecture with a sandbox provider using the same contract as real iikoServer API. IIKO_MODE=sandbox in copy; actual document IDs (IIKO-SBX-WO-2341) in UI. Never call it a "mock" or "fake."

## Accessibility & Inclusion

- WCAG AA minimum for all body text contrast
- `prefers-reduced-motion` must be respected — the warp tunnel background and all scroll-driven animations need reduced-motion fallbacks (crossfade or instant)
- Russian phrase ("Подделать списание физически невозможно") is decorative emphasis — ensure it has an English equivalent nearby for screen reader context
- Color is never the sole signal for fraud/clear status — always pair red/green with a text label
