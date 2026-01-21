# Le Phare - Guide de Développement Collaboratif

## 📋 Informations du Projet

- **Repository GitHub**: `git@github.com:ThomasTodoweb/Lephare.git`
- **Serveur de production**: `root@lephare.todoweb.fr`
- **Chemin serveur**: `/var/www/lephare`
- **URL production**: `https://lephare.todoweb.fr`
- **Process manager**: PM2 (process name: `lephare`)

---

## 🚀 Setup Initial (Nouveau Développeur)

### 1. Cloner le repository

```bash
git clone git@github.com:ThomasTodoweb/Lephare.git le-phare
cd le-phare
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env avec les bonnes valeurs (demander à Thomas)
```

### 4. Lancer en développement

```bash
npm run dev
```

---

## 🔄 Workflow de Développement Collaboratif

### Avant de commencer à travailler

**TOUJOURS synchroniser avec GitHub avant de modifier du code:**

```bash
# 1. Vérifier l'état actuel
git status

# 2. Récupérer les dernières modifications
git fetch origin

# 3. Voir les commits distants non synchronisés
git log HEAD..origin/main --oneline

# 4. Merger les changements
git pull origin main
```

### Pendant le développement

```bash
# Voir les fichiers modifiés
git status

# Voir les différences
git diff

# Ajouter les fichiers modifiés
git add -A

# Committer avec un message clair
git commit -m "Description claire de la modification"
```

### Après avoir terminé

```bash
# Pousser les modifications
git push origin main
```

---

## 🚢 Déploiement en Production

### Commande de déploiement complète

```bash
ssh root@lephare.todoweb.fr "cd /var/www/lephare && git pull origin main && npm install && npm run build && cp .env build/.env && cd build && npm ci --omit=dev && pm2 restart lephare"
```

### Déploiement étape par étape

```bash
# 1. Se connecter au serveur
ssh root@lephare.todoweb.fr

# 2. Aller dans le dossier du projet
cd /var/www/lephare

# 3. Récupérer les dernières modifications
git pull origin main

# 4. Installer les dépendances
npm install

# 5. Build le projet
npm run build

# 6. Copier le .env dans build (IMPORTANT!)
cp .env build/.env

# 7. Installer les dépendances de production
cd build && npm ci --omit=dev

# 8. Redémarrer l'application
pm2 restart lephare
```

---

## 🔍 Commandes Utiles

### Vérifier les logs en production

```bash
# Voir les derniers logs
ssh root@lephare.todoweb.fr "pm2 logs lephare --lines 50 --nostream"

# Suivre les logs en temps réel
ssh root@lephare.todoweb.fr "pm2 logs lephare"
```

### Vérifier le statut PM2

```bash
ssh root@lephare.todoweb.fr "pm2 status"
```

### Redémarrer l'application

```bash
ssh root@lephare.todoweb.fr "pm2 restart lephare"
```

### Voir les derniers commits sur GitHub

```bash
git log --oneline -10
```

### Voir les modifications non commitées

```bash
git diff
git diff --staged
```

---

## 🗄️ Base de Données

### Lancer les migrations

```bash
# En local
node ace migration:run

# En production
ssh root@lephare.todoweb.fr "cd /var/www/lephare/build && node ace migration:run"
```

### Rollback une migration

```bash
node ace migration:rollback
```

---

## 📁 Structure du Projet

```
le-phare/
├── app/
│   ├── controllers/     # Contrôleurs AdonisJS
│   ├── models/          # Modèles Lucid ORM
│   ├── services/        # Services métier
│   └── middleware/      # Middlewares
├── inertia/
│   ├── components/      # Composants React réutilisables
│   ├── pages/           # Pages React (routes Inertia)
│   └── css/             # Styles CSS/Tailwind
├── database/
│   └── migrations/      # Migrations de base de données
├── start/
│   ├── routes.ts        # Définition des routes
│   └── env.ts           # Validation des variables d'environnement
└── build/               # Dossier de production (généré)
```

---

## ⚠️ Points Importants

1. **Toujours pull avant de travailler** pour éviter les conflits
2. **Ne jamais committer le fichier .env** (il contient des secrets)
3. **Copier .env dans build/** après chaque `npm run build` en production
4. **Tester localement** avant de déployer en production
5. **Messages de commit clairs** pour faciliter le suivi des modifications

---

## 🆘 En cas de problème

### 502 Bad Gateway
→ Vérifier que `.env` est bien copié dans `build/`
```bash
ssh root@lephare.todoweb.fr "cp /var/www/lephare/.env /var/www/lephare/build/.env && pm2 restart lephare"
```

### Conflits Git
```bash
git stash           # Mettre de côté vos modifications
git pull origin main
git stash pop       # Réappliquer vos modifications
# Résoudre les conflits manuellement si nécessaire
```

### L'application ne démarre pas
```bash
ssh root@lephare.todoweb.fr "pm2 logs lephare --lines 100 --nostream"
```
