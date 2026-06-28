# AI Website Cloner Template

<a href="https://github.com/JCodesMore/ai-website-cloner-template/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a> <a href="https://github.com/JCodesMore/ai-website-cloner-template/stargazers"><img src="https://img.shields.io/github/stars/JCodesMore/ai-website-cloner-template?style=flat" alt="Stars" /></a> <a href="https://discord.gg/hrTSX5yTpB"><img src="https://img.shields.io/discord/1400896964597383279?label=discord" alt="Discord" /></a>

A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. 

**Recommended: [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with Opus 4.7 for best results** — but works with a variety of AI coding agents.

Point it at a URL, run `/clone-website`, and your AI agent will inspect the site, extract design tokens and assets, write component specs, and dispatch parallel builders to reconstruct every section.

## Demo

[![Watch the demo](docs/design-references/comparison.png)](https://youtu.be/O669pVZ_qr0)

> Click the image above to watch the full demo on YouTube.

## Quick Start

> **Important:** Start by making your own copy with GitHub's **Use this template** button. Do not clone this template repository directly for your website project, and do not open pull requests here with your generated website.

1. **Create your own repository from this template**

   On the GitHub page for this project, click **Use this template**, then click **Create a new repository**.

   Give your new repository a name, choose whether it should be public or private, then click **Create repository**. If GitHub shows an **Include all branches** option, you can leave it off.

   This gives you your own separate project to work in, so your website changes stay in your account instead of coming back to the main template.

2. **Open your new repository on your computer**

   After GitHub creates your copy, open that new repository. Click **Code** and open or clone your new repository with your preferred coding tool.

   If you use the terminal, the command will look like this:

   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-NEW-REPOSITORY.git
   cd YOUR-NEW-REPOSITORY
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start your AI agent** — Claude Code recommended:
   ```bash
   claude --chrome
   ```
5. **Run the skill**:
   ```
   /clone-website <target-url1> [<target-url2> ...]
   ```
6. **Customize** (optional) — after the base clone is built, modify as needed

> Using a different agent? Open `AGENTS.md` for project instructions — most agents pick it up automatically.

## Supported Platforms

| Agent                                                         | Status                     |
| ------------------------------------------------------------- | -------------------------- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | **Recommended** — Opus 4.7 |
| [Codex CLI](https://github.com/openai/codex)                  | Supported                  |
| [OpenCode](https://opencode.ai/)                              | Supported                  |
| [GitHub Copilot](https://github.com/features/copilot)         | Supported                  |
| [Cursor](https://cursor.com/)                                 | Supported                  |
| [Windsurf](https://codeium.com/windsurf)                      | Supported                  |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli)     | Supported                  |
| [Cline](https://github.com/cline/cline)                       | Supported                  |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code)            | Supported                  |
| [Continue](https://continue.dev/)                             | Supported                  |
| [Amazon Q](https://aws.amazon.com/q/developer/)               | Supported                  |
| [Augment Code](https://www.augmentcode.com/)                  | Supported                  |
| [Aider](https://aider.chat/)                                  | Supported                  |

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- An AI coding agent (see [Supported Platforms](#supported-platforms))

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **Lucide React** — default icons (replaced by extracted SVGs during cloning)

## How It Works

The `/clone-website` skill runs a multi-phase pipeline:

1. **Reconnaissance** — screenshots, design token extraction, interaction sweep (scroll, click, hover, responsive)
2. **Foundation** — updates fonts, colors, globals, downloads all assets
3. **Component Specs** — writes detailed spec files (`docs/research/components/`) with exact computed CSS values, states, behaviors, and content
4. **Parallel Build** — dispatches builder agents in git worktrees, one per section/component
5. **Assembly & QA** — merges worktrees, wires up the page, runs visual diff against the original

Each builder agent receives the full component specification inline — exact `getComputedStyle()` values, interaction models, multi-state content, responsive breakpoints, and asset paths. No guessing.

## Use Cases

- **Platform migration** — rebuild a site you own from WordPress/Webflow/Squarespace into a modern Next.js codebase
- **Lost source code** — your site is live but the repo is gone, the developer left, or the stack is legacy. Get the code back in a modern format
- **Learning** — deconstruct how production sites achieve specific layouts, animations, and responsive behavior by working with real code

## Not Intended For

- **Phishing or impersonation** — this project must not be used for deceptive purposes, impersonation, or any activity that breaks the law.
- **Passing off someone's design as your own** — logos, brand assets, and original copy belong to their owners.
- **Violating terms of service** — some sites explicitly prohibit scraping or reproduction. Check first.

## Project Structure

```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons
  lib/utils.ts      # cn() utility
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target
  videos/           # Downloaded videos from target
  seo/              # Favicons, OG images
docs/
  research/         # Extraction output & component specs
  design-references/ # Screenshots
scripts/
  sync-agent-rules.sh  # Regenerate agent instruction files
  sync-skills.mjs      # Regenerate /clone-website for all platforms
AGENTS.md           # Agent instructions (single source of truth)
CLAUDE.md           # Claude Code config (imports AGENTS.md)
GEMINI.md           # Gemini CLI config (imports AGENTS.md)
```

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint check
npm run typecheck # TypeScript check
npm run check  # Run lint + typecheck + build
```

## PHYLAX Integration Runbook

PHYLAX / СВЕРКА is wired as a Next.js API backend inside this app. The imported backend code lives under `src/app/api`, `src/lib/pipeline`, `src/lib/risk`, `src/integrations`, `supabase`, `scripts`, `tests`, and `demo-assets`. The frontend talks to it through `src/lib/api.ts`.

Product copy used in the app:

- “AI ranks. Human decides. Audit remembers.”
- “Every write-off must prove itself.”
- “Подделать списание физически невозможно.”
- “iiko sandbox provider uses the same contract as real iikoServer API.”

Install:

```bash
npm install
cp .env.example .env.local
```

Run frontend and backend together:

```bash
npm run dev
```

Open:

- Landing: `http://localhost:3000`
- Sender: `http://localhost:3000/app/sender`
- Reviewer: `http://localhost:3000/app/reviewer`
- Dashboard: `http://localhost:3000/app/dashboard`
- Audit: `http://localhost:3000/app/audit`
- iiko: `http://localhost:3000/app/iiko`
- Guided demo: `http://localhost:3000/app/demo`

Environment variables:

```bash
NEXT_PUBLIC_API_BASE_URL=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
VISION_PROVIDER=gemini
VISION_TIMEOUT_MS=30000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
IIKO_MODE=sandbox
IIKO_API_KEY=
```

Local demo mode:

If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is empty, `/api/*` uses the local backend provider. It still calls the backend hashing and risk engine, detects duplicate tomato photos, returns risk `91/100`, records audit events, and syncs through the iiko sandbox provider. This is intended for live pitch reliability without secrets.

Gemini setup:

```bash
cp .env.local.example .env.local
# paste the key into GEMINI_API_KEY
npm run dev
curl http://localhost:3000/api/health
```

Expected health response with a key:

```json
{
  "status": "ok",
  "database": "local",
  "iiko_mode": "sandbox",
  "vision_provider": "gemini",
  "gemini_configured": true,
  "vision_status": "ready"
}
```

Never expose `GEMINI_API_KEY` to the frontend. Do not prefix it with `NEXT_PUBLIC_`.

Fallback behavior:

- Without `GEMINI_API_KEY`, health reports `vision_provider=local`, `vision_status=disabled`, and `gemini_configured=false`.
- If Gemini returns invalid JSON, markdown, times out, rate limits, or errors, the backend returns a local fallback verdict with a safe short error code such as `error=gemini_timeout` and `error_detail=gemini_timeout`.
- Duplicate photo detection, risk scoring, reviewer queue, approve/reject, iiko sandbox sync, dashboard, and audit continue to work.

`VISION_PROVIDER` values:

- `gemini`: use Gemini when `GEMINI_API_KEY` is present.
- `local`: force local fallback verdicts while keeping hash/risk/iiko/audit paths active.

Supabase-backed mode:

```bash
npm run db:migrate
npm run seed
npm run dev
npm run demo:scenario
```

Database/demo scripts:

```bash
npm run db:migrate     # Apply Supabase/Postgres schema; requires DATABASE_URL
npm run seed           # Seed stores, products, users, historical WO-1847 fingerprint
npm run reset          # Delete FORGED demo data from Supabase
npm run demo:assets    # Regenerate demo JPEG assets
npm run demo:scenario  # End-to-end scenario; uses Supabase if configured, local backend otherwise
npm test               # Backend unit tests
```

Live demo flow:

1. Go to `/app/demo`.
2. Click `Reset demo`.
3. Click `Create duplicate request`.
4. Open `/app/reviewer` or continue in demo and click `Reject duplicate`.
5. Click `Create normal request`.
6. Click `Approve normal request`.
7. Click `Show analytics`.

Expected backend results:

- Duplicate photo detected.
- Match: `98.4%`.
- Risk: `91/100`.
- Route: `Control Department`.
- Suggested action: reject.
- Prevented loss: `₸18,400`.
- iiko status: `synced`.
- iiko document: `IIKO-SBX-WO-2341`.
- Audit log contains create, photo upload, duplicate detection, risk scoring, rejection, approval, and iiko sync events.

Known limitations:

- `demo-assets/patty.jpg` is a placeholder copied from the available uploaded proof asset. Replace it with a real patty photo before a production-quality demo.
- Without `GEMINI_API_KEY`, the UI shows “Vision unavailable”; duplicate/photo metadata checks still complete and the request does not hard-fail.
- Local demo mode is process memory. Restarting `npm run dev` resets local state.
- Supabase reset preserves the seeded historical baseline request numbers documented in the imported backend README.

Switching iiko from sandbox to real later:

Set `IIKO_MODE=real`, then configure `IIKO_BASE_URL`, `IIKO_LOGIN`, and `IIKO_PASSWORD` in `.env.local`. The sandbox provider and real iikoServer provider use the same backend contract, so frontend pages do not change.

Production deployment:

Current Vercel project target:

- Project: `phylax`
- Production URL: `https://phylax-demo.vercel.app`
- `phylax.vercel.app` availability: unavailable; fallback alias `phylax-demo.vercel.app` is active.
- Framework: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- API mode: same-origin `/api/*`

Production env vars:

```bash
GEMINI_API_KEY=              # server-side only; never NEXT_PUBLIC
GEMINI_MODEL=gemini-2.5-flash
VISION_PROVIDER=gemini
VISION_TIMEOUT_MS=30000
IIKO_MODE=sandbox
NEXT_PUBLIC_API_BASE_URL=    # intentionally empty for same-origin API routes
```

Supabase persistence env vars, when available:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-side only
DATABASE_URL=                # used by npm run db:migrate
SUPABASE_STORAGE_BUCKET=writeoff-photos
```

Production setup commands:

```bash
vercel link --yes --project phylax --scope <scope>
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_MODEL production
vercel env add VISION_PROVIDER production
vercel env add VISION_TIMEOUT_MS production
vercel env add IIKO_MODE production
vercel deploy --prod -y
```

If Supabase credentials are available, run before the production smoke demo:

```bash
npm run db:migrate
npm run seed
```

Health check:

```bash
curl https://phylax-demo.vercel.app/api/health
```

Expected with Gemini configured:

```json
{
  "status": "ok",
  "database": "connected",
  "iiko_mode": "sandbox",
  "vision_provider": "gemini",
  "vision_status": "ready",
  "gemini_configured": true
}
```

If Supabase env vars are not configured, `database` reports `local`. On Vercel this local fallback can reset between serverless instances and should be treated as a demo fallback, not durable production storage. The app still keeps Gemini fallback safety, duplicate hashing, risk scoring, reviewer actions, iiko sandbox sync, and audit behavior available for local/demo flows.

Gemini quota/rate limits:

- Health can still report `gemini_configured=true` when the key is present.
- `GEMINI_MODEL` defaults to `gemini-2.5-flash`.
- `VISION_TIMEOUT_MS` defaults to `30000` for live-demo reliability.
- If Gemini times out, rate limits, or returns invalid JSON, PHYLAX returns a local fallback verdict with a safe code such as `gemini_timeout`.
- Duplicate detection, risk scoring, reviewer queue, approve/reject, dashboard, audit, and iiko sandbox sync continue.

iiko note:

`IIKO_MODE=sandbox` uses the sandbox adapter until a real Bahandi/iiko test API key is available. The sandbox provider uses the same contract as the real iikoServer API.

### If using docker

```bash
docker compose up app --build # build and run the app
docker compose up dev --build # run the app in dev mode on port 3001
```

## Updating for Other Platforms

Two source-of-truth files power all platform support. Edit the source, then run the sync script:

| What                   | Source of truth                         | Sync command                       |
| ---------------------- | --------------------------------------- | ---------------------------------- |
| Project instructions   | `AGENTS.md`                             | `bash scripts/sync-agent-rules.sh` |
| `/clone-website` skill | `.claude/skills/clone-website/SKILL.md` | `node scripts/sync-skills.mjs`     |

Each script regenerates the platform-specific copies automatically. Agents that read the source files natively need no regeneration.


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=JCodesMore/ai-website-cloner-template&type=Date)](https://star-history.com/#JCodesMore/ai-website-cloner-template&Date)

## License

MIT
