# Le Phare - Instagram Management for Restaurants

**Le Phare** est une application web qui aide les restaurateurs à développer leur présence Instagram grâce à un système de missions quotidiennes, de tutoriels et d'analyses IA.

## Features

### Pour les restaurateurs
- **Missions quotidiennes** - Recevez chaque jour une mission adaptée à votre stratégie (post, story, reel, carrousel)
- **Publication directe** - Publiez sur Instagram directement depuis l'app via l'API Late
- **Captions IA** - Génération automatique de légendes optimisées avec OpenAI
- **Tutoriels** - Apprenez les meilleures pratiques Instagram avec des guides vidéo
- **Statistiques** - Suivez votre progression et vos stats Instagram
- **Gamification** - Badges, streaks et système de récompenses

### Pour les administrateurs
- **Gestion des stratégies** - Créez des parcours personnalisés par type de restaurant
- **Templates de missions** - Définissez les missions disponibles
- **Gestion des tutoriels** - Ajoutez du contenu éducatif
- **Suivi utilisateurs** - Dashboard complet avec métriques

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | AdonisJS 6, TypeScript, PostgreSQL |
| **Frontend** | React 18, Inertia.js, TailwindCSS |
| **APIs** | Late (Instagram), OpenAI, Stripe |
| **Infra** | PM2, Nginx, Ubuntu |

## Installation

### Prérequis
- Node.js >= 20
- PostgreSQL >= 14
- Compte [Late](https://late.social) pour l'API Instagram
- Compte OpenAI (optionnel, pour les captions IA)
- Compte Stripe (pour les abonnements)

### Setup local

```bash
# Cloner le repo
git clone git@github.com:ThomasTodoweb/Lephare.git
cd Lephare

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# Créer la base de données
createdb lephare

# Lancer les migrations
node ace migration:run

# Seeder les données initiales
node ace db:seed

# Lancer le serveur de dev
npm run dev
```

L'application sera disponible sur `http://localhost:3333`

## Configuration

### Variables d'environnement

```env
# Application
TZ=UTC
PORT=3333
HOST=localhost
NODE_ENV=development
APP_KEY=your-app-key

# Database
DB_CONNECTION=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=lephare
DB_PASSWORD=your-password
DB_DATABASE=lephare

# Session
SESSION_DRIVER=cookie

# Late API (Instagram)
LATE_API_KEY=your-late-api-key
LATE_API_URL=https://api.late.social/v1

# OpenAI (optionnel)
OPENAI_API_KEY=your-openai-key

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

## Déploiement

### Déploiement automatique via GitHub

Le serveur est configuré pour se mettre à jour automatiquement depuis GitHub :

```bash
# Sur le serveur, lancer la mise à jour
cd /var/www/lephare
./server-deploy.sh
```

Le script `server-deploy.sh` :
1. Pull les derniers changements depuis GitHub
2. Installe les dépendances
3. Build le projet
4. Lance les migrations
5. Redémarre PM2

### Déploiement manuel

```bash
# Build local
npm run build

# Sync vers le serveur
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'storage' \
  build/ user@server:/var/www/lephare/

# Sur le serveur
cd /var/www/lephare
npm ci --omit=dev
node ace migration:run --force
pm2 restart lephare
```

## Structure du projet

```
le-phare/
├── app/
│   ├── controllers/     # Contrôleurs HTTP
│   ├── models/          # Modèles Lucid ORM
│   ├── services/        # Logique métier
│   ├── middleware/      # Middleware custom
│   └── validators/      # Validation des requêtes
├── config/              # Configuration AdonisJS
├── database/
│   ├── migrations/      # Migrations DB
│   └── seeders/         # Données initiales
├── inertia/
│   ├── components/      # Composants React réutilisables
│   └── pages/           # Pages Inertia
├── start/
│   ├── routes.ts        # Définition des routes
│   └── kernel.ts        # Middleware globaux
└── resources/
    └── views/           # Templates Edge
```

## API Endpoints

### Authentication
- `POST /register` - Inscription
- `POST /login` - Connexion
- `POST /logout` - Déconnexion

### Missions
- `GET /missions` - Mission du jour
- `POST /missions/:id/accept` - Accepter une mission
- `POST /missions/:id/skip` - Passer une mission
- `GET /missions/history` - Historique

### Publications
- `POST /missions/:id/photo` - Upload média
- `POST /publications/:id/publish` - Publier sur Instagram

### Instagram
- `GET /instagram/connect` - Connexion OAuth Late
- `GET /instagram/callback` - Callback OAuth
- `GET /instagram/status` - Statut de connexion

## Scripts npm

```bash
npm run dev        # Serveur de développement
npm run build      # Build production
npm run start      # Lancer en production
npm run lint       # Linter ESLint
npm run typecheck  # Vérification TypeScript
```

## Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## License

Propriétaire - Tous droits réservés

---

Développé avec par [Thomas Todoweb](https://github.com/ThomasTodoweb) & Claude AI
