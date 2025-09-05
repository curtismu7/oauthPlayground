#!/bin/bash

# Hourly backup script for OAuth Playground
# This script creates timestamped backups of your work every hour

# Configuration
PROJECT_DIR="/Users/cmuir/P1Import-apps/oauth-playground"
BACKUP_DIR="/Users/cmuir/P1Import-apps/oauth-playground-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="oauth-playground-backup-${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Check if there are any changes to backup
if git diff --quiet && git diff --cached --quiet; then
    echo "No changes to backup at $(date)"
    exit 0
fi

# Create backup
echo "Creating backup: $BACKUP_NAME"
tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    --exclude=logs \
    --exclude=*.log \
    --exclude=.env \
    --exclude=certs \
    .

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_DIR/$BACKUP_NAME"
    
    # Keep only last 24 backups (24 hours)
    cd "$BACKUP_DIR"
    ls -t oauth-playground-backup-*.tar.gz | tail -n +25 | xargs -r rm
    echo "🧹 Cleaned up old backups (keeping last 24)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Also create a git backup
echo "Creating git backup..."
git bundle create "$BACKUP_DIR/oauth-playground-git-${TIMESTAMP}.bundle" --all

echo "✅ Hourly backup completed at $(date)"

