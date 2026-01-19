#!/bin/bash
# =============================================================================
# Script de déploiement Le Phare - À exécuter sur le serveur
# Usage: ./server-deploy.sh
# =============================================================================

set -e

# Configuration
APP_DIR="/var/www/lephare"
BUILD_DIR="$APP_DIR/build"
REPO_URL="git@github.com:ThomasTodoweb/Lephare.git"
BRANCH="main"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║            🚀 Le Phare - Déploiement depuis GitHub             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier qu'on est dans le bon dossier
cd "$APP_DIR" || { echo -e "${RED}❌ Erreur: Dossier $APP_DIR introuvable${NC}"; exit 1; }

# Sauvegarder le .env et storage
echo -e "${YELLOW}📦 [1/6] Sauvegarde des fichiers locaux...${NC}"
if [ -f "$BUILD_DIR/.env" ]; then
    cp "$BUILD_DIR/.env" /tmp/lephare-env-backup
    echo "  ✓ .env sauvegardé"
fi
if [ -d "$BUILD_DIR/storage" ]; then
    cp -r "$BUILD_DIR/storage" /tmp/lephare-storage-backup
    echo "  ✓ storage sauvegardé"
fi

# Pull depuis GitHub
echo -e "${YELLOW}📥 [2/6] Pull depuis GitHub ($BRANCH)...${NC}"
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/$BRANCH
    echo "  ✓ Code mis à jour"
else
    echo "  ⚠ Repo non initialisé, clonage..."
    cd /var/www
    rm -rf lephare
    git clone "$REPO_URL" lephare
    cd lephare
    echo "  ✓ Repo cloné"
fi

# Installer les dépendances et build
echo -e "${YELLOW}📦 [3/6] Installation des dépendances...${NC}"
npm ci
echo "  ✓ Dépendances installées"

echo -e "${YELLOW}🔨 [4/6] Build de l'application...${NC}"
npm run build
echo "  ✓ Build terminé"

# Restaurer .env et storage
echo -e "${YELLOW}🔄 [5/6] Restauration des fichiers locaux...${NC}"
if [ -f /tmp/lephare-env-backup ]; then
    cp /tmp/lephare-env-backup "$BUILD_DIR/.env"
    echo "  ✓ .env restauré"
fi
if [ -d /tmp/lephare-storage-backup ]; then
    cp -r /tmp/lephare-storage-backup "$BUILD_DIR/storage"
    echo "  ✓ storage restauré"
fi

# Installation dépendances production
echo -e "${YELLOW}📦 [5b/6] Installation dépendances production...${NC}"
cd "$BUILD_DIR"
npm ci --omit=dev
echo "  ✓ Dépendances production installées"

# Migrations et restart
echo -e "${YELLOW}🗃️ [6/6] Migrations et redémarrage...${NC}"

# Vérifier si les migrations peuvent être exécutées
if [ -f "$BUILD_DIR/ace.js" ]; then
    # Tenter les migrations avec node directement sur les fichiers compilés
    echo "  ⚠ Migrations manuelles requises si nouvelles colonnes ajoutées"
fi

# Restart PM2
pm2 restart lephare
echo "  ✓ Application redémarrée"

# Nettoyage
rm -f /tmp/lephare-env-backup
rm -rf /tmp/lephare-storage-backup

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ Déploiement terminé!                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Afficher le statut
echo -e "${BLUE}📊 Statut PM2:${NC}"
pm2 status lephare

echo ""
echo -e "${GREEN}🌐 Application disponible sur: https://lephare.todoweb.fr${NC}"
