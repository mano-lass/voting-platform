#!/bin/bash

# Database Backup Script
# Creates a backup of the voting platform database

set -e

BACKUP_DIR="/var/backups/mysql"
DB_NAME="voting_db"
DB_USER="root"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD}"
DB_HOST="${DB_HOST:-localhost}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

echo "Starting backup of database: $DB_NAME"
echo "Backup location: $BACKUP_FILE"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "✓ Backup completed: ${BACKUP_FILE}.gz"

# Remove backups older than 7 days
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +7 -delete

echo "✓ Old backups cleaned up"
