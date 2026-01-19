#!/bin/bash
set -e

# Configuration
SERVER="root@lephare.todoweb.fr"
APP_PATH="/var/www/lephare"

echo "🚀 Déploiement Le Phare..."
echo "================================"

# 1. Build local
echo ""
echo "📦 [1/4] Build local..."
npm run build

# 2. Sync des fichiers build
echo ""
echo "📤 [2/4] Envoi des fichiers..."
rsync -avz --delete \
  --exclude='.env' \
  ./build/ $SERVER:$APP_PATH/build/

# 3. Installer dépendances production et restart
echo ""
echo "🔧 [3/4] Installation dépendances et redémarrage..."
ssh $SERVER "cd $APP_PATH/build && npm ci --omit=dev && pm2 restart lephare"

# 4. Migrations
echo ""
echo "🗃️ [4/4] Exécution des migrations..."
ssh $SERVER "cd $APP_PATH/build && node ace migration:run --force"

echo ""
echo "================================"
echo "✅ Déploiement terminé!"
echo "🌐 https://lephare.todoweb.fr"
