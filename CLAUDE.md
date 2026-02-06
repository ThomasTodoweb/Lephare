# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Le Phare is an Instagram management SaaS for restaurants. Users get daily missions, publish content to Instagram via the Late API, receive AI-generated captions (OpenAI/Anthropic), track stats, earn badges/streaks, and follow tutorials. Subscriptions are handled via Stripe. All UI is in French.

## Commands

```bash
npm run dev          # Dev server with HMR (port 3333)
npm run build        # Production build (node ace build)
npm start            # Start production server (node bin/server.js)
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run test         # Run all tests (Japa runner)
node ace test --suites=unit        # Unit tests only (2s timeout)
node ace test --suites=functional  # Functional tests only (30s timeout)
```

### Database

```bash
node ace migration:run              # Run pending migrations
node ace migration:rollback         # Rollback last batch
node ace migration:status           # Check migration status
node ace make:migration <name>      # Create new migration
node ace db:seed                    # Run seeders (badges, levels, strategies, templates, tutorial categories)
```

### Custom Ace Commands (Scheduled Tasks)

```bash
node ace check_streaks                      # Check/reset user streaks
node ace send_daily_notifications           # Combined daily notifications
node ace send_daily_email_notifications     # Daily email notifications only
node ace send_daily_in_app_notifications    # Daily in-app notifications only
node ace sync_notification_times            # Sync notification schedules
```

### Ace Scaffolding

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

- **Backend**: AdonisJS 6 + TypeScript + Lucid ORM (PostgreSQL)
- **Frontend**: React 19 + Inertia.js + TailwindCSS 4 + Vite
- **External APIs**: Stripe (payments), Late (Instagram publishing), OpenAI (captions/stats), Anthropic (AI title generation), Resend (email), Web Push (notifications), Notion (content import)
- **Auth**: Session-based with Google/Apple OAuth via @adonisjs/ally

### Request Flow

Routes (`start/routes.ts`, ~408 lines) -> Middleware (`app/middleware/`) -> Controllers (`app/controllers/`) -> Services (`app/services/`) -> Models (`app/models/`)

Controllers return Inertia responses that render React pages from `inertia/pages/`.

### Key Directories

| Path | Purpose |
|------|---------|
| `app/controllers/http/` | Main route handlers (~19 controllers) |
| `app/controllers/admin/` | Admin panel controllers (~14 controllers, under `/admin` routes) |
| `app/services/` | Business logic: Stripe, Late API, AI, push, gamification, missions, stats, levels, Notion, email, alerts, audit (15 services) |
| `app/models/` | Lucid ORM models (26 models) |
| `app/middleware/` | Auth, subscription, admin, throttle, raw body, guest |
| `app/validators/` | Vine request validators (French error messages): auth, onboarding, profile, restaurant, admin |
| `inertia/pages/` | React page components (69 pages across 18 feature directories) |
| `inertia/components/` | Reusable React components (ui/, layout/, features/) |
| `database/migrations/` | 51 migration files |
| `database/seeders/` | badges, levels, strategies, mission templates, tutorial categories |
| `commands/` | Custom Ace commands for scheduled tasks (streaks, notifications) |
| `start/routes.ts` | All route definitions |
| `start/kernel.ts` | Middleware registration |
| `start/env.ts` | Environment variable validation |
| `config/` | AdonisJS configuration files |

### Frontend Conventions

- Vite entry point: `inertia/app/app.tsx`
- Import alias: `~/` resolves to `inertia/`
- Shared Inertia props (available on every page): `user`, `flash`, `errors`, `unreadNotificationsCount` (defined in `config/inertia.ts`)
- SSR is disabled
- Icons: `lucide-react`
- Mobile-first responsive design (max-width 428px container)
- Fonts: Montserrat + Poppins (Google Fonts, loaded in Edge layout)
- Service Worker registered in app.tsx for PWA & push notifications (`public/sw.js`)
- PWA manifest at `public/manifest.json`

### Route Groups & Middleware

- **Public**: Home, static files (no auth)
- **Auth routes**: Register, login, password reset (guest middleware + rate limiting)
- **OAuth**: Google and Apple sign-in with callbacks
- **Protected (free tier)**: Dashboard, profile, onboarding, subscription page, calendar (auth middleware)
- **Premium routes**: Missions, publications, tutorials, badges, reports, statistics (auth + subscription middleware)
- **Admin routes** (`/admin`): Dashboard, strategies, templates, tutorials, alerts, users, email logs, subscriptions, levels (auth + admin middleware)
- **Webhooks**: Stripe webhook at `POST /webhooks/stripe` (rawBody + throttle middleware for signature verification)

### Subscription Tiers

The `subscription` middleware checks for active subscription (trial or paid). Returns 402 for API requests, redirects otherwise. Free tier users can access dashboard, profile, onboarding, and subscription pages.

### Important Patterns

- **Service layer**: Controllers delegate to services in `app/services/` for business logic and external API calls
- **Vine validators**: Request validation with French error messages, compiled schemas in `app/validators/`
- **JSONB columns**: Complex data (aiInterpretation, mediaItems) stored as PostgreSQL JSONB
- **UTC DateTimes**: All dates handled in UTC with Luxon
- **Eager loading**: Use `.preload()` on relationships to avoid N+1 queries
- **Node subpath imports**: Use `#controllers/*`, `#models/*`, `#services/*`, `#validators/*`, `#start/*` etc. (defined in package.json `imports`)
- **Dual AI providers**: OpenAI for captions/analysis, Anthropic for title generation (both optional via env vars)

### Environment Variables

Validated in `start/env.ts`. Key groups: App (PORT, HOST, APP_KEY), Database (DB_*), Stripe (STRIPE_*), Late API (LATE_API_KEY), OpenAI (OPENAI_API_KEY), Anthropic (ANTHROPIC_API_KEY), VAPID (push notifications), Google/Apple OAuth, Notion (NOTION_API_KEY). Most external API keys are optional to allow local development without all services.

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

### En cas de conflit

```bash
# Voir les derniers commits
git log --oneline -10
```

### Notification automatique (pour Claude Code)

**IMPORTANT pour Claude** : Après chaque `git pull`, si des commits d'un autre développeur ont été récupérés, **prévenir l'utilisateur** avec un résumé des changements avant de commencer à travailler.

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

Production runs from `/var/www/lephare/build/`, not the project root.

## Features désactivées (à supprimer si non réactivées)

### Notifications in-app (désactivée le 31/01/2026)

La feature de notifications in-app a été désactivée :
- Le header avec le logo "Le Phare" et la cloche de notifications a été retiré du layout
- Le `NotificationBanner` sur le dashboard a été supprimé
- Le composant `Header.tsx` existe toujours dans `inertia/components/layout/` mais n'est plus utilisé

**Fichiers concernés :**
- `inertia/components/layout/AppLayout.tsx` - Header retiré
- `inertia/components/layout/Header.tsx` - Non supprimé, juste inutilisé
- `inertia/components/NotificationBanner.tsx` - Non supprimé, juste inutilisé
- `inertia/pages/dashboard.tsx` - Import et utilisation retirés

**TODO :** Si la feature n'est pas réactivée d'ici 3 mois, supprimer les fichiers `Header.tsx` et `NotificationBanner.tsx` ainsi que les routes `/notifications/*` dans `start/routes.ts`.
