# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Le Phare is an Instagram management SaaS for restaurants. Users get daily missions, publish content to Instagram via the Late API, receive AI-generated captions (OpenAI), track stats, earn badges/streaks, and follow tutorials. Subscriptions are handled via Stripe. All UI is in French.

## Commands

```bash
npm run dev          # Dev server with HMR (port 3333)
npm run build        # Production build (node ace build)
npm start            # Start production server (node bin/server.js)
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run test         # Run all tests
node ace test --suites=unit        # Unit tests only
node ace test --suites=functional  # Functional tests only
```

### Database

```bash
node ace migration:run              # Run pending migrations
node ace migration:rollback         # Rollback last batch
node ace migration:status           # Check migration status
node ace make:migration <name>      # Create new migration
node ace db:seed                    # Run seeders (badges, strategies, tutorials)
sudo -u postgres psql lephare       # Accès direct PostgreSQL
```

### Ace scaffolding

```bash
node ace make:controller <name>
node ace make:model <name>
node ace make:migration <name>
node ace make:validator <name>
node ace make:middleware <name>
node ace make:service <name>
```

## Architecture

### Tech Stack

- **Backend**: AdonisJS 6 + TypeScript + Lucid ORM
- **Frontend**: React 19 + Inertia.js + TailwindCSS 4
- **Database**: PostgreSQL 17
- **External APIs**: Stripe (payments), Late (Instagram publishing), OpenAI (captions/stats), Resend (email), Web Push (notifications)
- **Auth**: Session-based with Google/Apple OAuth via @adonisjs/ally

### Request Flow

Routes (`start/routes.ts`, 275+ routes) -> Middleware (`app/middleware/`) -> Controllers (`app/controllers/`) -> Services (`app/services/`) -> Models (`app/models/`)

Controllers return Inertia responses that render React pages from `inertia/pages/`.

### Key Directories

| Path | Purpose |
|------|---------|
| `app/controllers/http/` | Main route handlers |
| `app/controllers/admin/` | Admin panel controllers (under `/admin` routes) |
| `app/services/` | Business logic (Stripe, Late API, AI, push, gamification, etc.) |
| `app/models/` | Lucid ORM models (20+) |
| `app/middleware/` | Auth, subscription, admin, throttle, raw body, guest |
| `app/validators/` | Vine request validators (French error messages) |
| `inertia/pages/` | React page components (58 pages, organized by feature) |
| `inertia/components/` | Reusable React components (ui/, layout/, features/) |
| `database/migrations/` | 89 migration files |
| `start/routes.ts` | All route definitions |
| `start/kernel.ts` | Middleware registration |
| `config/` | AdonisJS configuration files |

### Frontend Conventions

- Vite entry point: `inertia/app/app.tsx`
- Import alias: `~/` resolves to `inertia/`
- Shared Inertia props (available on every page): `user`, `flash`, `errors` (defined in `config/inertia.ts`)
- SSR is disabled
- Icons: `lucide-react`
- Mobile-first responsive design (max-width 428px container)
- Service Worker registered in app.tsx for PWA & push notifications

### Route Groups & Middleware

- **Public**: Home, static files (no auth)
- **Auth routes**: Register, login, password reset (guest middleware + rate limiting)
- **Protected (free tier)**: Dashboard, profile, onboarding, subscription page (auth middleware)
- **Premium routes**: Missions, publications, tutorials, badges, reports, statistics (auth + subscription middleware)
- **Admin routes** (`/admin`): Dashboard, strategies, templates, tutorials, alerts, users (auth + admin middleware)
- **Webhooks**: Stripe webhook at `POST /webhooks/stripe` (raw body middleware for signature verification)

### Subscription Tiers

The `subscription` middleware checks for active subscription (trial or paid). Returns 402 for API requests, redirects otherwise. Free tier users can access dashboard, profile, onboarding, and subscription pages.

### Important Patterns

- **Service layer**: Controllers delegate to services in `app/services/` for business logic and external API calls
- **Vine validators**: Request validation with French error messages, compiled schemas in `app/validators/`
- **JSONB columns**: Complex data (aiInterpretation, mediaItems) stored as PostgreSQL JSONB
- **UTC DateTimes**: All dates handled in UTC with Luxon
- **Eager loading**: Use `.preload()` on relationships to avoid N+1 queries
- **Node subpath imports**: Use `#controllers/*`, `#models/*`, `#services/*` etc. (defined in package.json `imports`)

### Environment Variables

Validated in `start/env.ts`. Key groups: App (PORT, HOST, APP_KEY), Database (DB_*), Stripe (STRIPE_*), Late API (LATE_API_KEY), OpenAI (OPENAI_API_KEY), VAPID (push notifications), Google/Apple OAuth.

## Workflow de développement en équipe avec Claude Code

**IMPORTANT** : Plusieurs développeurs utilisent Claude Code sur ce projet. Pour éviter les conflits de version, suivre ces règles strictement.

### Règle d'or : TOUJOURS synchroniser avec GitHub

```bash
# AVANT de commencer à coder
git pull origin main

# APRÈS chaque modification
git add -A && git commit -m "description" && git push origin main
```

### GitHub

- **Repo** : `git@github.com:ThomasTodoweb/Lephare.git`
- **Branch** : `main`

### Workflow complet pour chaque session de dev

**1. Récupérer la dernière version (OBLIGATOIRE)**
```bash
cd /Users/.../le-phare  # ou le chemin local du projet
git pull origin main
```

**2. Faire les modifications demandées**

**3. Commit et push**
```bash
git add -A
git commit -m "description claire des changements"
git push origin main
```

**4. Déployer en production**
```bash
bash deploy.sh
```

### Script deploy.sh

Le script `deploy.sh` effectue :
1. Build local (`npm run build`)
2. Rsync vers le serveur (`/var/www/lephare/build/`)
3. Installation des dépendances prod sur le serveur
4. Copie du `.env` dans `build/`
5. Redémarrage PM2
6. Exécution des migrations

### En cas de conflit ou version cassée

Si quelqu'un a poussé une version qui casse le site :
```bash
# Voir les derniers commits
git log --oneline -10

# Revenir à un commit spécifique
git reset --hard <commit-hash>

# Forcer la mise à jour sur GitHub
git push origin main --force

# Redéployer
bash deploy.sh
```

### Communication entre développeurs

- **Avant de bosser** : Prévenir l'autre pour éviter de modifier les mêmes fichiers
- **Après avoir poussé** : Informer l'autre de faire `git pull`
- **En cas de doute** : Toujours faire `git pull` avant de commencer

### Server Info

| Property | Value |
|----------|-------|
| Server | `lephare.todoweb.fr` (147.93.94.82) |
| App path | `/var/www/lephare` |
| Build dir | `/var/www/lephare/build` |
| App port | `3335` |
| Production URL | `https://lephare.todoweb.fr` |

### PM2

```bash
pm2 status                          # App status
pm2 logs lephare --lines 50        # App logs
pm2 logs lephare --err --lines 50  # Error logs only
pm2 restart lephare                 # Restart
```

Production runs from `/var/www/lephare/build/`, not the project root. The `.env` file must be copied to `build/.env` after each build.

### Script server-deploy.sh (alternative)

Le script `server-deploy.sh` peut aussi être utilisé. Il effectue :
- Sauvegarde `.env` et `storage/` depuis `build/`
- `git fetch origin` + `git reset --hard origin/main`
- `npm ci` + `npm run build`
- Restaure `.env` et `storage/` dans `build/`
- `cd build && npm ci --omit=dev`
- `pm2 restart lephare`
- **⚠️ Les migrations ne sont PAS exécutées automatiquement** par ce script.
