#!/bin/bash

################################################################################
# HOA Management System - Backup Restore Script
#
# This script restores a backup created by backup.sh
#
# Usage:
#   ./scripts/restore.sh <backup_timestamp>
#   ./scripts/restore.sh 20250111_020000
#
# Or interactively:
#   ./scripts/restore.sh
################################################################################

set -e  # Exit on error

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_BASE_DIR="${BACKUP_DIR:-/root/hoa-backups}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to list available backups
list_backups() {
    echo ""
    print_info "Available backups:"
    echo "================================"
    local count=0
    for backup in $(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | sort -r); do
        count=$((count + 1))
        local timestamp=$(basename "$backup")
        local size=$(du -sh "$backup" | cut -f1)
        local date=$(echo "$timestamp" | sed 's/_/ /')
        echo "$count) $timestamp ($size) - $date"

        # Show manifest if available
        if [ -f "$backup/manifest.txt" ]; then
            local git_commit=$(grep "Commit:" "$backup/manifest.txt" 2>/dev/null | cut -d: -f2- || echo "N/A")
            if [ -n "$git_commit" ] && [ "$git_commit" != "N/A" ]; then
                echo "   Git:$git_commit"
            fi
        fi
    done
    echo "================================"

    if [ $count -eq 0 ]; then
        print_error "No backups found in $BACKUP_BASE_DIR"
        exit 1
    fi
}

# Check if backup directory exists
if [ ! -d "$BACKUP_BASE_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_BASE_DIR"
    exit 1
fi

# Get backup timestamp
BACKUP_TIMESTAMP="$1"

if [ -z "$BACKUP_TIMESTAMP" ]; then
    # Interactive mode
    list_backups
    echo ""
    read -p "Enter backup timestamp to restore (or number): " BACKUP_INPUT

    # Check if input is a number
    if [[ "$BACKUP_INPUT" =~ ^[0-9]+$ ]]; then
        # Get backup by number
        BACKUP_TIMESTAMP=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "20*" | sort -r | sed -n "${BACKUP_INPUT}p" | xargs basename)
    else
        BACKUP_TIMESTAMP="$BACKUP_INPUT"
    fi
fi

BACKUP_DIR="${BACKUP_BASE_DIR}/${BACKUP_TIMESTAMP}"

# Verify backup exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup not found: $BACKUP_DIR"
    list_backups
    exit 1
fi

print_info "Restoring from backup: $BACKUP_TIMESTAMP"
print_info "Backup location: $BACKUP_DIR"

# Show backup manifest
if [ -f "$BACKUP_DIR/manifest.txt" ]; then
    echo ""
    cat "$BACKUP_DIR/manifest.txt"
    echo ""
fi

# Confirmation
read -p "Are you sure you want to restore this backup? This will OVERWRITE current data! (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_warn "Restore cancelled"
    exit 0
fi

print_warn "Creating safety backup of current state..."
SAFETY_BACKUP_DIR="${BACKUP_BASE_DIR}/pre-restore-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$SAFETY_BACKUP_DIR"
if [ -f "${PROJECT_ROOT}/backend/database/hoa.db" ]; then
    cp "${PROJECT_ROOT}/backend/database/hoa.db" "${SAFETY_BACKUP_DIR}/" || print_warn "Failed to create safety backup of database"
fi

# Restore database
print_info "Restoring database..."
if [ -f "$BACKUP_DIR/hoa.db.gz" ]; then
    gunzip -c "$BACKUP_DIR/hoa.db.gz" > "${PROJECT_ROOT}/backend/database/hoa.db" || print_error "Failed to restore database"
    print_info "Database restored successfully"
elif [ -f "$BACKUP_DIR/hoa.db" ]; then
    cp "$BACKUP_DIR/hoa.db" "${PROJECT_ROOT}/backend/database/hoa.db" || print_error "Failed to restore database"
    print_info "Database restored successfully"
else
    print_warn "No database backup found in this backup"
fi

# Restore uploads
print_info "Restoring uploads..."
if [ -f "$BACKUP_DIR/uploads.tar.gz" ]; then
    # Backup current uploads
    if [ -d "${PROJECT_ROOT}/backend/uploads" ]; then
        mv "${PROJECT_ROOT}/backend/uploads" "${SAFETY_BACKUP_DIR}/uploads_backup" || print_warn "Failed to backup current uploads"
    fi

    mkdir -p "${PROJECT_ROOT}/backend"
    tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "${PROJECT_ROOT}/backend" || print_error "Failed to restore uploads"
    print_info "Uploads restored successfully"
else
    print_warn "No uploads backup found in this backup"
fi

# Restore logs (optional)
if [ -f "$BACKUP_DIR/logs.tar.gz" ]; then
    print_info "Restoring logs..."
    tar -xzf "$BACKUP_DIR/logs.tar.gz" -C "${PROJECT_ROOT}/backend" || print_warn "Failed to restore logs"
    print_info "Logs restored successfully"
fi

# Show git information
if [ -f "$BACKUP_DIR/git-commit.txt" ]; then
    print_info "Git information from backup:"
    echo "  Commit: $(cat $BACKUP_DIR/git-commit.txt)"
    echo "  Branch: $(cat $BACKUP_DIR/git-branch.txt 2>/dev/null || echo 'Unknown')"
    echo ""
    print_warn "Note: Code was not restored. Use 'git checkout' to restore code if needed."
fi

# Summary
echo ""
print_info "========================================="
print_info "Restore completed successfully!"
print_info "  Restored from: $BACKUP_TIMESTAMP"
print_info "  Safety backup: $SAFETY_BACKUP_DIR"
print_info "========================================="
print_warn "Remember to restart the application for changes to take effect"
echo ""
print_info "To restart: docker-compose restart"
echo ""

exit 0
