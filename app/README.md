# AI Content Factory

A complete, monetizable, production-ready SaaS that generates viral-ready
short-form content (Instagram Reels, YouTube Shorts, Facebook Reels) in
seconds.

Pick a niche → get a hook, 10–15 second script, scene-by-scene shot list,
captions with hashtags, a virality score, and a 7-day content plan.

This is an additive Next.js application that lives at `app/` inside the
`Content-Automator` repo. It is **fully self-contained** — no Postgres,
no external AI provider, no extra services required.

---

## Stack

- **Next.js 14 (App Router)** + React 18 + TypeScript
- **Tailwind CSS** + dark-mode glassmorphism design
- **better-sqlite3** as the embedded database
- **bcryptjs + jose** (JWT) for email/password auth
- **Zod** for input validation
- Optional **Stripe** integration (mock checkout works without keys)
- Optional **OpenAI** integration (deterministic engine works without keys)

---

## Features

### Core product

| Feature | Description |
| --- | --- |
| Viral hook engine | Niche-aware hooks tuned for the first 1–2 seconds |
| 10–15s script generator | Hook → tension → reveal → loop ending |
| Scene-by-scene breakdown | 5-shot storyboard with motion + stock footage ideas |
| Caption + hashtag engine | Per-platform captions with engagement triggers |
| Virality score (1–100) | Hook, emotion, retention, shareability — independently scored |
| 7-day content planner | Auto-rotated niches and platforms |
| History | Every generation persisted, viewable, exportable |
| Analytics | Per-niche / per-platform stats + last-14-day series |

### Monetization

| Plan | Price | Limits | Features |
| --- | --- | --- | --- |
| **Free** | $0 | 3 / day | Limited niches, watermarked outputs |
| **Starter** | $9 / mo | 50 / month | All niches, no watermark |
| **Pro** | $19 / mo | 200 / month | Virality score, content planner |
| **Agency** | $49 / mo | Unlimited | Multi-client, exports, priority speed |

The pricing page lets a logged-in user switch plans. By default the app uses
a **demo checkout** that flips the plan immediately so every gated feature
can be exercised end-to-end. Wire `STRIPE_SECRET_KEY` and the
`STRIPE_PRICE_*` env vars to switch to real Stripe Checkout (the
`/api/billing/checkout` route is the integration point).

---

## Niches available

- Motivation
- Money / Finance
- Fitness
- Psychology
- Tech facts

Each niche ships with a curated bank of:

- Topic ideas
- Hook patterns (16 templates × niche-specific nouns/adjectives)
- Educational facts and reveal twists
- Stock footage search queries
- Hashtag stacks
- Emojis and CTAs

---

## Local development

```bash
cd app
cp .env.example .env
# generate a real signing secret:
sed -i.bak "s|AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -hex 32)|" .env

npm install
npm run dev
# open http://localhost:3000
```

Then sign up at `/signup`, generate a reel at `/generate`, and try every plan
on `/pricing`.

### Useful commands

```bash
npm run dev         # Next dev server (http://localhost:3000)
npm run build       # production build
npm run start       # serve production build
npm run lint        # eslint + Next rules
npm run typecheck   # tsc --noEmit
```

---

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `AUTH_SECRET` | yes | Long random string — signs session JWTs. |
| `DATABASE_PATH` | no | SQLite file path. Defaults to `./data/app.db`. |
| `STRIPE_SECRET_KEY` | no | If set, you can wire real Stripe Checkout. |
| `STRIPE_PRICE_STARTER` | no | Stripe Price ID for Starter. |
| `STRIPE_PRICE_PRO` | no | Stripe Price ID for Pro. |
| `STRIPE_PRICE_AGENCY` | no | Stripe Price ID for Agency. |
| `STRIPE_WEBHOOK_SECRET` | no | For verifying Stripe webhooks. |
| `OPENAI_API_KEY` | no | If you want to delegate generation to an LLM. |

Without any of the optional vars, the app is **fully functional** — the
content engine produces fresh, niche-correct scripts deterministically and
the checkout flow runs in demo mode.

---

## API surface

All routes are auth-gated except `/api/auth/login` and `/api/auth/signup`.
Sessions use an httpOnly `acf_session` cookie holding a 30-day JWT.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create account, set session |
| POST | `/api/auth/login` | Verify password, set session |
| POST | `/api/auth/logout` | Clear session |
| GET  | `/api/auth/me` | Return user, plan, usage |
| POST | `/api/generate` | Generate + persist a viral script |
| GET  | `/api/history` | List recent generations |
| GET  | `/api/history/[id]` | Fetch one |
| DELETE | `/api/history/[id]` | Remove one |
| GET  | `/api/history/export?format=json\|csv` | Agency-only export |
| GET  | `/api/planner` | Current 7-day plan |
| POST | `/api/planner` | Regenerate the 7-day plan |
| PATCH | `/api/planner/[id]` | Toggle a planner item done/undone |
| GET  | `/api/usage` | Current quota snapshot |
| GET  | `/api/analytics` | Aggregated stats |
| POST | `/api/billing/checkout` | Switch plan (mock or Stripe) |

---

## Deployment

The app is a single Next.js app. It deploys cleanly to:

### Vercel

1. Point the project root at `app/`.
2. Add `AUTH_SECRET` (and any Stripe keys you wire up).
3. Vercel's filesystem is ephemeral, so set `DATABASE_PATH=/tmp/app.db` for
   demos, or back the app with a hosted SQLite (e.g. Turso / LiteFS) for
   real persistence.

### Replit / Railway / Fly.io

```bash
cd app
npm install
npm run build
AUTH_SECRET=... npm start
```

The SQLite file at `./data/app.db` will persist across restarts as long as
the disk does.

### Docker (sketch)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm install --omit=dev
COPY app/ ./
RUN npm run build
ENV PORT=3000
CMD ["npm", "start"]
```

---

## Project layout

```
app/
├── data/                       SQLite DB lives here (gitignored)
├── src/
│   ├── app/
│   │   ├── (app)/              authenticated app shell + pages
│   │   │   ├── dashboard/
│   │   │   ├── generate/
│   │   │   ├── planner/
│   │   │   ├── history/
│   │   │   ├── analytics/
│   │   │   ├── pricing/
│   │   │   └── settings/
│   │   ├── api/                route handlers (auth, generate, planner…)
│   │   ├── login/  signup/     auth pages
│   │   ├── page.tsx            marketing landing
│   │   └── layout.tsx + globals.css
│   ├── components/             sidebar, score-badge, generation-card, …
│   └── lib/
│       ├── db.ts               better-sqlite3 init + migrations
│       ├── auth.ts             bcrypt + JWT
│       ├── plans.ts            plan tiers + feature flags
│       ├── usage.ts            quota tracking
│       ├── utils.ts            shared helpers
│       └── engine/
│           ├── data.ts         niche knowledge banks
│           ├── score.ts        virality scoring
│           └── index.ts        full pipeline (hook → score)
├── package.json / tsconfig.json / next.config.mjs / tailwind.config.ts
└── README.md (this file)
```

---

## How the content engine works

`generate({ niche, platform, topicHint?, watermark })` runs this pipeline:

1. Pick a topic (from niche bank, or use the user's `topicHint`).
2. Build a hook by filling a curated pattern (e.g. `"Stop scrolling. {X} is lying to you."`)
   with a niche-specific noun + adjective.
3. Compose the script using a 5-beat structure: hook → educational fact →
   normalization line → reveal → loop ending.
4. Slice the script into 5 scenes, attach a duration (1.2–2.8s), motion
   direction (e.g. "punch-in", "whip pan", "match cut"), and a stock-footage
   query per scene.
5. Build a per-platform caption with emojis + CTA.
6. Build hashtags by merging niche-specific tags with platform discovery
   tags.
7. Score the result on hook strength (35%), emotion (25%), retention (25%),
   and shareability (15%) → 1–100 total.

The engine is deterministic given a seed but uses the wall clock as a seed
by default, so every call produces fresh content.

If `OPENAI_API_KEY` is set, you can later replace the engine's
`generate()` body with an LLM call — every other layer (auth, plans, usage,
score, breakdown, planner) keeps working as-is.

---

## Why this layout?

The host repo (`Content-Automator`) is a Replit-style pnpm monorepo backed
by PostgreSQL + Orval codegen. Adding all of the SaaS surface area (auth,
billing, virality score, planner, captions, analytics, watermarks, multiple
new pages) on top of that monorepo would require a Postgres instance and a
full OpenAPI/codegen round-trip per change. To deliver a complete, working,
deployable SaaS quickly and cleanly, this app is **self-contained** at
`app/` and outside the pnpm workspace globs — so it doesn't disturb any
existing artifact.
