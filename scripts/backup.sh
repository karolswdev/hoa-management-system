#!/bin/bash

################################################################################
# HOA Management System - Automated Backup Script
#
# This script creates backups of:
# - SQLite database
# - Uploaded documents
# - Application code
# - Environment configuration (without secrets)
#
# Usage:
#   ./scripts/backup.sh
#
# Cron setup (daily at 2 AM):
#   0 2 * * * /path/to/hoa-management-system/scripts/backup.sh
################################################################################

set -e  # Exit on error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-/root/hoa-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE_DIR}/${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"  # Keep backups for 30 days

# Log file
LOG_FILE="${BACKUP_BASE_DIR}/backup.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to handle errors
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Create backup directory
log "Starting backup process..."
mkdir -p "$BACKUP_DIR" || error_exit "Failed to create backup directory"

# Backup database
log "Backing up database..."
if [ -f "${PROJECT_ROOT}/backend/database/hoa.db" ]; then
    cp "${PROJECT_ROOT}/backend/database/hoa.db" "${BACKUP_DIR}/hoa.db" || error_exit "Failed to backup database"
    # Create compressed copy
    gzip -c "${BACKUP_DIR}/hoa.db" > "${BACKUP_DIR}/hoa.db.gz" && rm "${BACKUP_DIR}/hoa.db"
    log "Database backup completed (compressed)"
else
    log "WARNING: Database file not found at ${PROJECT_ROOT}/backend/database/hoa.db"
fi

# Backup uploads directory
log "Backing up uploads..."
if [ -d "${PROJECT_ROOT}/backend/uploads" ]; then
    tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C "${PROJECT_ROOT}/backend" uploads/ || error_exit "Failed to backup uploads"
    log "Uploads backup completed"
else
    log "WARNING: Uploads directory not found"
fi

# Backup logs (if they exist)
log "Backing up logs..."
if [ -d "${PROJECT_ROOT}/backend/logs" ]; then
    tar -czf "${BACKUP_DIR}/logs.tar.gz" -C "${PROJECT_ROOT}/backend" logs/ || log "WARNING: Failed to backup logs"
    log "Logs backup completed"
fi

# Backup code (git repository state)
log "Backing up code repository state..."
cd "${PROJECT_ROOT}"
if [ -d ".git" ]; then
    # Save current git commit hash and branch
    git rev-parse HEAD > "${BACKUP_DIR}/git-commit.txt" 2>/dev/null || log "WARNING: Failed to save git commit"
    git branch --show-current > "${BACKUP_DIR}/git-branch.txt" 2>/dev/null || log "WARNING: Failed to save git branch"

    # Create archive of tracked files only (excludes node_modules, etc.)
    git archive --format=tar.gz HEAD > "${BACKUP_DIR}/code.tar.gz" || log "WARNING: Failed to archive code"
    log "Code backup completed"
else
    log "WARNING: Not a git repository"
fi

# Backup .env file (sanitized - remove sensitive values)
log "Backing up environment configuration..."
if [ -f "${PROJECT_ROOT}/.env" ]; then
    # Copy .env but mask sensitive values
    sed -E 's/(SECRET|KEY|PASSWORD|TOKEN|DSN)=.*/\1=***REDACTED***/g' "${PROJECT_ROOT}/.env" > "${BACKUP_DIR}/env.txt" || log "WARNING: Failed to backup .env"
    log "Environment configuration backed up (secrets redacted)"
fi

# Create backup manifest
log "Creating backup manifest..."
cat > "${BACKUP_DIR}/manifest.txt" << EOF
HOA Management System Backup
============================
Backup Date: $(date)
Backup Location: ${BACKUP_DIR}
Hostname: $(hostname)
Project Root: ${PROJECT_ROOT}

Contents:
$(ls -lh "${BACKUP_DIR}")

Git Info:
EOF

if [ -f "${BACKUP_DIR}/git-commit.txt" ]; then
    echo "Commit: $(cat ${BACKUP_DIR}/git-commit.txt)" >> "${BACKUP_DIR}/manifest.txt"
    echo "Branch: $(cat ${BACKUP_DIR}/git-branch.txt)" >> "${BACKUP_DIR}/manifest.txt"
fi

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log "Backup completed successfully. Size: $BACKUP_SIZE"
echo "Total Size: $BACKUP_SIZE" >> "${BACKUP_DIR}/manifest.txt"

# Cleanup old backups
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || log "WARNING: Failed to cleanup some old backups"

OLD_BACKUP_COUNT=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | wc -l)
log "Cleanup completed. Total backups retained: $OLD_BACKUP_COUNT"

# Log summary
log "========================================="
log "Backup Summary:"
log "  Backup ID: ${TIMESTAMP}"
log "  Location: ${BACKUP_DIR}"
log "  Size: ${BACKUP_SIZE}"
log "  Retention: ${RETENTION_DAYS} days"
log "  Total Backups: ${OLD_BACKUP_COUNT}"
log "========================================="

# Send notification (optional - requires mail command)
if command -v mail &> /dev/null && [ -n "${BACKUP_NOTIFICATION_EMAIL}" ]; then
    echo "Backup completed successfully. Backup ID: ${TIMESTAMP}, Size: ${BACKUP_SIZE}" | \
        mail -s "HOA System Backup: Success" "${BACKUP_NOTIFICATION_EMAIL}"
fi

exit 0
