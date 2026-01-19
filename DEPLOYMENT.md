# Procédure de Déploiement - Le Phare

## Informations Serveur

- **URL**: https://lephare.todoweb.fr
- **IP**: 147.93.94.82
- **User**: root
- **App Path**: /var/www/lephare
- **Port App**: 3335

## État Actuel du Serveur

Le serveur est déjà configuré avec :
- Node.js v20.19.6
- npm 10.8.2
- PM2 6.0.13
- Nginx 1.26.3
- PostgreSQL 17.7
- SSL Let's Encrypt configuré

## Déploiement Rapide

```bash
# Depuis le dossier du projet
./deploy.sh
```

Le script effectue automatiquement :
1. Build local (`npm run build`)
2. Envoi des fichiers via rsync
3. Installation des dépendances prod
4. Redémarrage PM2
5. Exécution des migrations

---

## Configuration Actuelle

### Base de données PostgreSQL

- **Base**: lephare
- **User**: lephare
- **Password**: LePhare2026Prod

### PM2 Ecosystem

Fichier: `/var/www/lephare/ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [{
    name: 'lephare',
    script: './bin/server.js',
    cwd: '/var/www/lephare/build',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3335
    },
    error_file: '/var/log/pm2/lephare-error.log',
    out_file: '/var/log/pm2/lephare-out.log'
  }]
}
```

### Nginx Config

Fichier: `/etc/nginx/sites-available/lephare.todoweb.fr`

```nginx
server {
    listen 80;
    server_name lephare.todoweb.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lephare.todoweb.fr;

    ssl_certificate /etc/letsencrypt/live/lephare.todoweb.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lephare.todoweb.fr/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3335;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Fichier .env de Production

Fichier: `/var/www/lephare/.env` (lien symbolique vers build/.env)

```env
TZ=Europe/Paris
PORT=3335
HOST=127.0.0.1
LOG_LEVEL=info
APP_KEY=W4eULBGXuq4E5FHGs_tKuUPLD1tXol6x
NODE_ENV=production
SESSION_DRIVER=cookie

DB_CONNECTION=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=lephare
DB_PASSWORD=LePhare2026Prod
DB_DATABASE=lephare

# Stripe, Late API, OpenAI keys configured
```

---

## Commandes Utiles

### Sur le serveur

```bash
# Se connecter
ssh root@lephare.todoweb.fr

# Voir les logs
pm2 logs lephare --lines 50

# Status de l'app
pm2 status

# Redémarrer
pm2 restart lephare

# Arrêter
pm2 stop lephare

# Exécuter une commande Ace
cd /var/www/lephare/build && node ace <command>

# Rollback migration
cd /var/www/lephare/build && node ace migration:rollback

# Accès PostgreSQL
sudo -u postgres psql lephare
```

### Depuis local

```bash
# Déployer
./deploy.sh

# Voir les logs en temps réel
ssh root@lephare.todoweb.fr "pm2 logs lephare --lines 100"

# Exécuter une migration
ssh root@lephare.todoweb.fr "cd /var/www/lephare/build && node ace migration:run --force"

# Redémarrer l'app
ssh root@lephare.todoweb.fr "pm2 restart lephare"
```

---

## Seeders

Pour exécuter les seeders (badges, stratégies, tutoriels, etc.) :

```bash
ssh root@lephare.todoweb.fr "cd /var/www/lephare/build && node ace db:seed"
```

---

## Troubleshooting

### L'app ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs lephare --err --lines 50

# Vérifier le port
netstat -tlpn | grep 3335

# Redémarrer manuellement
pm2 delete lephare
cd /var/www/lephare && pm2 start ecosystem.config.cjs
```

### Erreur de migration

```bash
# Voir le status des migrations
cd /var/www/lephare/build && node ace migration:status

# Si migrations corrompues, nettoyer la table adonis_schema
sudo -u postgres psql -d lephare -c "DELETE FROM adonis_schema;"
```

### Nginx ne répond pas

```bash
# Tester la config
nginx -t

# Recharger nginx
systemctl reload nginx

# Voir les erreurs
tail -f /var/log/nginx/lephare.error.log
```

---

## Notes Importantes

1. Le fichier `.env` est un lien symbolique : `/var/www/lephare/build/.env -> /var/www/lephare/.env`
2. L'app tourne sur le port 3335 (pas 3333 qui est utilisé par une autre app)
3. Les clés API (Stripe, Late, OpenAI) sont configurées sur le serveur
4. Les certificats SSL sont gérés automatiquement par Let's Encrypt
