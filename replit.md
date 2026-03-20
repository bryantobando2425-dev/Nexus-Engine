# NEXUS ENGINE

## Overview

NEXUS ENGINE is a full-stack procedural narrative game engine PWA. It uses AI narration (Claude via Anthropic) to tell the story of any life, in any era, with no objectives — pure open-ended existence simulation.

**Current game: "A Life"** — Live any life, in any era, on Earth.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle for server, Vite for frontend)
- **Frontend**: React + Vite + Tailwind CSS v4
- **State**: Zustand (persisted in localStorage)
- **AI**: Claude `claude-sonnet-4-6` via `@workspace/integrations-anthropic-ai`
- **Fonts**: Syne (headers/display), Lora (narrative body), IBM Plex Mono (UI/stats)

## Structure

```
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server (port 8080)
│   │   └── src/routes/       # players, runs, events, narrative, legacy, moments, achievements, maps
│   ├── nexus-engine/         # React+Vite PWA frontend (proxies /api/ → 8080)
│   │   └── src/
│   │       ├── pages/        # Home, NewRun, Game, Profile, Editor
│   │       ├── components/   # Layout, UI (shadcn-based + custom)
│   │       └── store/        # Zustand engine-store (playerId, runId, voice, explicitMode)
│   └── mockup-sandbox/       # Component preview server (canvas prototyping)
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks + custom-fetch
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   ├── db/                   # Drizzle ORM schema + DB connection
│   └── integrations-anthropic-ai/  # Claude AI integration helper
└── scripts/                  # Utility scripts
```

## Database Tables

- `players` — player accounts with settings, totalRuns, totalPlaytimeMinutes
- `runs` — individual gameplay runs with eraConfig, character, status, endCause
- `run_events` — narrative events with legacyWeight, eventType, mood
- `legacy_echoes` — cross-run memory fragments (core feature: echoes surface in future runs)
- `moments` — special captured moments (image snapshots of pivotal events)
- `achievements` — player achievements
- `world_maps` — procedurally generated map data per run

## API Routes

All routes under `/api/`:
- `GET /healthz` — health check
- `POST|GET|PATCH /players` — player management
- `GET /players/:id/stats` — player stats (totalRuns, totalInGameYears, deathsByCause)
- `GET /players/:id/runs` — all runs for a player
- `GET /players/:id/moments` — all moments for a player
- `POST|GET|PATCH /runs` — run management
- `POST /runs/:id/end` — end a run, triggers legacy echo processing
- `POST /narrative/generate` — Claude AI narration (returns JSON with narrative, eventType, legacyWeight, mood, characterStatChanges)
- `POST /narrative/summarize-run` — generate end-of-run epitaph via Claude
- `POST /events` / `GET /events/run/:id` — run event CRUD
- `POST /legacy/process` — extract legacy echoes from run events
- `POST /legacy/resolve-echoes` — surface legacy echoes into current narration
- `GET /legacy/echoes/:playerId` — get player's echo library
- `POST /moments` / `GET /moments/:id` — moment CRUD
- `POST /achievements/unlock` — unlock achievement
- `GET /achievements/:playerId` — player achievements
- `GET /maps/:runId` / `POST /maps` / `PATCH /maps/:id` — world map CRUD

## Key Design Decisions

- **Legacy Echoes**: Cross-run memories surface naturally in narration without being explicitly announced. Claude is instructed to weave them in organically.
- **No Objectives**: "A Life" has no win/fail conditions. Claude narrates consequence, not success/failure.
- **Narrative Voice**: Player can choose from literary, omniscient, immersive, stark — affects Claude's system prompt style.
- **Engine-agnostic**: Game-specific config (name, rules, tone) is passed per-request, not hardcoded in engine code.
- **Player ID**: Stored in Zustand persisted store (localStorage). Created automatically on first visit.
- **Proxy**: Vite dev server proxies `/api/*` → `http://localhost:8080`. This makes API calls work transparently from the browser.
- **Explicit Mode**: Zustand store has `explicitMode` flag for mature content (not yet wired to narrative API).

## Frontend Pages

- **Home (`/`)**: Dark atmospheric hero with "A LIFE" title, Start New Life / Continue / Legacy / Settings
- **NewRun (`/new-run`)**: 7-step character creator (Era & World, Identity, Appearance, Personality, Skills, Beliefs, Review)
- **Game (`/game/:runId`)**: Three-panel layout — left stats sidebar, center narrative scroll + input, right procedural map canvas
- **Profile (`/profile`)**: Legacy & history — stat cards (runs, years, deaths), chronicles list, moments gallery
- **Editor (`/editor/:runId`)**: Run editor / settings (scaffold)

## Color Palette

- Background: `#0a0c0f` (220 40% 4%)
- Accent Blue: `#3d8eff` (215 100% 62%)
- Accent Teal: `#00d4a8` (167 100% 42%)
- Accent Amber: `#f5a623` (38 92% 55%)
- Destructive: `#ff4444`

## PWA

- `public/manifest.json` — PWA manifest (standalone, dark theme)
- Apple web app meta tags configured
- OG tags for sharing

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (Replit managed)
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` — Anthropic proxy URL (auto-set by Replit integration)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` — Anthropic API key (auto-set by Replit integration)
- `PORT` — assigned per-artifact by Replit
- `BASE_PATH` — URL base path, passed to Vite `base` config

## Workflows

- `artifacts/api-server: API Server` — `pnpm --filter @workspace/api-server run dev` (port 8080)
- `artifacts/nexus-engine: web` — `pnpm --filter @workspace/nexus-engine run dev` (dynamic PORT)
- `artifacts/mockup-sandbox: Component Preview Server` — component preview server

## Codegen

To regenerate the API client after changing `lib/api-spec/openapi.yaml`:
```
pnpm --filter @workspace/api-spec run generate
```
