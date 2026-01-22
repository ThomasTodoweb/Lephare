#!/bin/bash
# =============================================================================
# Configuration Cron pour Le Phare
# Ce script configure les tâches cron nécessaires pour l'envoi d'emails
# =============================================================================

# Chemin vers l'application
APP_DIR="/var/www/lephare/build"
NODE="/usr/bin/node"
LOG_DIR="/var/log/lephare"

# Créer le dossier de logs s'il n'existe pas
mkdir -p $LOG_DIR

# Afficher les cron jobs à ajouter
echo "========================================"
echo "Configuration Cron pour Le Phare"
echo "========================================"
echo ""
echo "Ajoutez ces lignes au crontab (crontab -e) :"
echo ""
echo "# Le Phare - Envoi emails quotidiens (toutes les minutes pour vérifier l'heure de chaque user)"
echo "* * * * * cd $APP_DIR && $NODE ace notifications:send-daily-emails >> $LOG_DIR/daily-emails.log 2>&1"
echo ""
echo "# Le Phare - Envoi notifications push quotidiennes (toutes les minutes)"
echo "* * * * * cd $APP_DIR && $NODE ace notifications:send-daily >> $LOG_DIR/daily-push.log 2>&1"
echo ""
echo "# Le Phare - Nettoyage des logs email (hebdomadaire, dimanche à 3h)"
echo "0 3 * * 0 cd $APP_DIR && $NODE ace email-logs:cleanup --days=30 >> $LOG_DIR/cleanup.log 2>&1"
echo ""
echo "========================================"
echo ""
echo "Pour ajouter automatiquement, exécutez:"
echo "(crontab -l 2>/dev/null; echo '* * * * * cd $APP_DIR && $NODE ace notifications:send-daily-emails >> $LOG_DIR/daily-emails.log 2>&1') | crontab -"
echo "(crontab -l 2>/dev/null; echo '* * * * * cd $APP_DIR && $NODE ace notifications:send-daily >> $LOG_DIR/daily-push.log 2>&1') | crontab -"
