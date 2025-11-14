#!/bin/bash

# Setup script for hourly backups
# This will add a cron job to run backups every hour

PROJECT_DIR="/Users/cmuir/P1Import-apps/oauth-playground"
BACKUP_SCRIPT="$PROJECT_DIR/backup-hourly.sh"

echo "Setting up hourly backups for OAuth Playground..."

# Create the backup directory
mkdir -p "/Users/cmuir/P1Import-apps/oauth-playground-backups"

# Add cron job (runs every hour at minute 0)
(crontab -l 2>/dev/null; echo "0 * * * * $BACKUP_SCRIPT >> $PROJECT_DIR/backup.log 2>&1") | crontab -

echo "✅ Hourly backup cron job added!"
echo "📁 Backups will be stored in: /Users/cmuir/P1Import-apps/oauth-playground-backups"
echo "📝 Backup logs will be in: $PROJECT_DIR/backup.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove the backup job: crontab -e (then delete the line)"
echo ""
echo "To test the backup script manually: $BACKUP_SCRIPT"

