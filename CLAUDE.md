# Le Phare - Instructions pour Claude

## Déploiement

Quand l'utilisateur demande de "déployer", "mettre en ligne", "push en prod", ou similaire, effectuer ces étapes automatiquement :

### 1. Commit et push vers GitHub
```bash
cd /Users/thomaspraizelin/Devs/LEPHAREPROJET/le-phare
git add -A
git commit -m "description des changements"
git push
```

### 2. Connexion au serveur et déploiement
```bash
ssh root@lephare.todoweb.fr "cd /var/www/lephare && ./server-deploy.sh"
```

Le script `server-deploy.sh` effectue automatiquement :
- `git pull origin main`
- `npm ci`
- `npm run build`
- `node ace migration:run --force`
- `pm2 restart lephare`

### 3. Vérification
```bash
ssh root@lephare.todoweb.fr "pm2 status && pm2 logs lephare --lines 10"
```

## Informations serveur

| Propriété | Valeur |
|-----------|--------|
| Serveur | `lephare.todoweb.fr` (147.93.94.82) |
| Utilisateur SSH | `root` |
| Chemin application | `/var/www/lephare` |
| Build directory | `/var/www/lephare/build` |
| Port application | `3335` |
| URL production | `https://lephare.todoweb.fr` |

## Base de données

- PostgreSQL 17 sur le serveur
- Commande migration : `node ace migration:run --force`
- Accès DB : `sudo -u postgres psql lephare`

## PM2 (Process Manager)

```bash
pm2 status           # État de l'application
pm2 logs lephare     # Voir les logs
pm2 restart lephare  # Redémarrer
pm2 stop lephare     # Arrêter
```

## Logs utiles

```bash
# Logs applicatifs
pm2 logs lephare --lines 50

# Logs d'erreur uniquement
pm2 logs lephare --err --lines 50

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Stack technique

- **Backend** : AdonisJS 6
- **Frontend** : React + Inertia.js
- **Base de données** : PostgreSQL
- **Process manager** : PM2
- **Reverse proxy** : Nginx avec SSL Let's Encrypt
