# Backup and Restore Guide

This guide explains how to backup and restore the HOA Management System.

## Table of Contents

1. [Backup Strategy](#backup-strategy)
2. [Automated Backups](#automated-backups)
3. [Manual Backups](#manual-backups)
4. [Restore Procedures](#restore-procedures)
5. [Testing Backups](#testing-backups)
6. [Backup Best Practices](#backup-best-practices)

---

## Backup Strategy

The HOA Management System implements a comprehensive backup strategy that includes:

- **Database**: SQLite database file containing all application data
- **Uploads**: User-uploaded documents and files
- **Logs**: Application and system logs
- **Code State**: Git commit information for version tracking
- **Configuration**: Environment variables (secrets redacted)

### What Gets Backed Up

| Component | Location | Backup Location | Compressed |
|-----------|----------|-----------------|------------|
| Database | `backend/database/hoa.db` | `hoa.db.gz` | Yes (gzip) |
| Uploads | `backend/uploads/` | `uploads.tar.gz` | Yes (tar.gz) |
| Logs | `backend/logs/` | `logs.tar.gz` | Yes (tar.gz) |
| Code | Git repository | `code.tar.gz` | Yes (tar.gz) |
| Config | `.env` file | `env.txt` | No (sanitized) |

### Backup Retention

- **Default Retention**: 30 days
- **Backup Frequency**: Daily at 2:00 AM (when configured with cron)
- **Storage Location**: `/root/hoa-backups/` (configurable)

---

## Automated Backups

### Setting Up Automated Backups

The system includes an automated backup script that can be run via cron.

#### 1. Verify Backup Script

```bash
# Check script exists and is executable
ls -l scripts/backup.sh

# Test the script manually
./scripts/backup.sh
```

#### 2. Configure Cron Job

```bash
# Edit crontab
crontab -e

# Add the following line for daily backups at 2:00 AM
0 2 * * * /path/to/hoa-management-system/scripts/backup.sh

# Or use a different schedule:
# Every 6 hours: 0 */6 * * * /path/to/hoa-management-system/scripts/backup.sh
# Weekly on Sunday at 3 AM: 0 3 * * 0 /path/to/hoa-management-system/scripts/backup.sh
```

#### 3. Environment Variables

You can customize backup behavior with environment variables:

```bash
# Add to .env or set in cron job
BACKUP_DIR=/custom/backup/path          # Default: /root/hoa-backups
BACKUP_RETENTION_DAYS=60                # Default: 30
BACKUP_NOTIFICATION_EMAIL=admin@example.com  # Optional: email notifications
```

Example cron entry with environment variables:

```bash
0 2 * * * BACKUP_DIR=/mnt/backups BACKUP_RETENTION_DAYS=60 /path/to/hoa-management-system/scripts/backup.sh
```

#### 4. Verify Automated Backups

```bash
# Check cron is running
sudo systemctl status cron

# View cron logs
grep CRON /var/log/syslog | tail -20

# Check backup directory
ls -lh /root/hoa-backups/

# View backup log
cat /root/hoa-backups/backup.log
```

---

## Manual Backups

### Using the Backup Script

```bash
# Navigate to project directory
cd /path/to/hoa-management-system

# Run backup script
./scripts/backup.sh
```

The script will create a timestamped backup directory with all components.

### Manual Backup Commands

If you need to create backups manually without the script:

```bash
# Create backup directory
BACKUP_DIR="/root/hoa-backups/manual-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
cp backend/database/hoa.db "$BACKUP_DIR/"
gzip "$BACKUP_DIR/hoa.db"

# Backup uploads
tar -czf "$BACKUP_DIR/uploads.tar.gz" backend/uploads/

# Backup logs (if they exist)
tar -czf "$BACKUP_DIR/logs.tar.gz" backend/logs/

# Save git state
git rev-parse HEAD > "$BACKUP_DIR/git-commit.txt"
git branch --show-current > "$BACKUP_DIR/git-branch.txt"
```

### Pre-Deployment Backup

Always create a backup before deployments:

```bash
# This is automatically done by deploy/deploy.local.sh
# But you can run it manually
./scripts/backup.sh

# Or use the deployment script which includes backup
cd deploy
./deploy.local.sh
```

---

## Restore Procedures

### Interactive Restore

The easiest way to restore is using the interactive restore script:

```bash
# Run restore script
./scripts/restore.sh

# Follow the prompts:
# 1. Select backup from list
# 2. Review backup details
# 3. Confirm restore
```

### Restore Specific Backup

```bash
# Restore from specific timestamp
./scripts/restore.sh 20250111_020000
```

### Manual Restore

If you need to restore manually:

#### 1. Stop the Application

```bash
docker-compose down
```

#### 2. Backup Current State

```bash
# Safety backup
cp backend/database/hoa.db backend/database/hoa.db.before-restore
tar -czf uploads-before-restore.tar.gz backend/uploads/
```

#### 3. Restore Database

```bash
# Extract and restore database
gunzip -c /root/hoa-backups/20250111_020000/hoa.db.gz > backend/database/hoa.db

# Verify database integrity
sqlite3 backend/database/hoa.db "PRAGMA integrity_check;"
```

#### 4. Restore Uploads

```bash
# Remove current uploads (or move to backup)
mv backend/uploads backend/uploads.old

# Extract uploads
tar -xzf /root/hoa-backups/20250111_020000/uploads.tar.gz -C backend/
```

#### 5. Restart Application

```bash
docker-compose up -d
```

#### 6. Verify Restore

```bash
# Check application health
curl http://localhost:3001/api/health

# Check recent data exists
# Login to application and verify data

# Check logs for errors
docker logs hoa_backend_api --tail=50
```

---

## Testing Backups

Regular backup testing is crucial. Follow these steps monthly:

### 1. Test Backup Creation

```bash
# Run manual backup
./scripts/backup.sh

# Verify backup was created
ls -lh /root/hoa-backups/ | tail -1

# Check backup contents
ls -lh /root/hoa-backups/<latest-backup>/
```

### 2. Test Backup Restore (Non-Production)

**CAUTION**: Only test restores in non-production environments or with proper safety backups.

```bash
# Create safety backup first
./scripts/backup.sh

# Test restore from older backup
./scripts/restore.sh <test-backup-timestamp>

# Verify application works
docker-compose up -d
curl http://localhost:3001/api/health

# Restore to latest backup if test successful
./scripts/restore.sh <latest-backup-timestamp>
```

### 3. Verify Backup Integrity

```bash
# Check database integrity
BACKUP_DIR="/root/hoa-backups/<backup-timestamp>"

# Extract database temporarily
gunzip -c "$BACKUP_DIR/hoa.db.gz" > /tmp/test-restore.db

# Check integrity
sqlite3 /tmp/test-restore.db "PRAGMA integrity_check;"

# Clean up
rm /tmp/test-restore.db
```

### 4. Test Off-Site Backup

```bash
# Copy backup to off-site location
rsync -avz /root/hoa-backups/<backup-timestamp>/ \
  user@backup-server:/backups/hoa/

# Verify copied backup
ssh user@backup-server "ls -lh /backups/hoa/<backup-timestamp>/"
```

---

## Backup Best Practices

### 1. Follow the 3-2-1 Rule

- **3 copies** of your data (production + 2 backups)
- **2 different media** types (local disk + cloud/remote)
- **1 off-site** backup

### 2. Regular Testing

- Test backups monthly
- Verify backup integrity
- Practice restore procedures
- Document test results

### 3. Monitor Backup Status

```bash
# Check recent backups
ls -lht /root/hoa-backups/ | head -10

# Check backup log for failures
tail -50 /root/hoa-backups/backup.log | grep ERROR

# Verify cron job is running
crontab -l | grep backup.sh
```

### 4. Off-Site Backups

Implement off-site backup strategy:

```bash
# Option 1: rsync to remote server
rsync -avz /root/hoa-backups/ user@backup-server:/backups/hoa/

# Option 2: Upload to cloud storage (example with rclone)
rclone sync /root/hoa-backups/ remote:hoa-backups/

# Option 3: Use Linode Backups service
# Enable in Linode dashboard for automatic server snapshots
```

### 5. Monitoring and Alerts

Set up monitoring for backup health:

```bash
# Add to monitoring script
#!/bin/bash
LATEST_BACKUP=$(ls -t /root/hoa-backups/ | grep "^20" | head -1)
BACKUP_AGE=$(find /root/hoa-backups/$LATEST_BACKUP -mtime +1)

if [ -n "$BACKUP_AGE" ]; then
    echo "WARNING: Latest backup is older than 24 hours"
    # Send alert email
fi
```

### 6. Document Backup Locations

Maintain a backup inventory:

```bash
# Create backup inventory
cat > /root/hoa-backups/INVENTORY.txt << EOF
HOA Management System Backup Inventory
======================================
Last Updated: $(date)

Backup Locations:
- Primary: /root/hoa-backups/ ($(hostname))
- Off-site: [Document your off-site location]

Recent Backups:
$(ls -lt /root/hoa-backups/ | grep "^d" | head -5)

Retention Policy: 30 days
Backup Schedule: Daily at 2:00 AM

Emergency Contacts:
- System Admin: [Name/Email]
- HOA Board: [Name/Email]
EOF
```

### 7. Security Considerations

- Encrypt backups containing sensitive data
- Restrict backup directory permissions
- Secure off-site backup transfer (SSH/SFTP)
- Regular security audits

```bash
# Secure backup directory
chmod 700 /root/hoa-backups
chown root:root /root/hoa-backups

# Encrypt sensitive backups
tar -czf - /root/hoa-backups/<backup>/ | \
  gpg --encrypt --recipient admin@example.com > backup-encrypted.tar.gz.gpg
```

---

## Disaster Recovery Plan

### Scenario 1: Complete Server Failure

1. **Provision new server**
2. **Install dependencies** (Docker, Docker Compose, etc.)
3. **Clone repository**
   ```bash
   git clone <repository-url>
   cd hoa-management-system
   ```
4. **Retrieve backup** from off-site location
5. **Restore data**
   ```bash
   ./scripts/restore.sh <backup-timestamp>
   ```
6. **Configure environment**
   - Update `.env` with production values
   - Configure nginx
   - Set up SSL certificates
7. **Start application**
   ```bash
   docker-compose up -d
   ```
8. **Verify functionality**

### Scenario 2: Database Corruption

1. **Stop application**
   ```bash
   docker-compose stop backend
   ```
2. **Backup corrupted database**
   ```bash
   mv backend/database/hoa.db backend/database/hoa.db.corrupted
   ```
3. **Restore from backup**
   ```bash
   ./scripts/restore.sh
   ```
4. **Verify database integrity**
   ```bash
   sqlite3 backend/database/hoa.db "PRAGMA integrity_check;"
   ```
5. **Restart application**
   ```bash
   docker-compose start backend
   ```

### Scenario 3: Accidental Data Deletion

1. **Identify what was deleted**
2. **Find appropriate backup** (before deletion)
3. **Extract specific data** (if possible)
   ```bash
   # Extract database
   gunzip -c /root/hoa-backups/<backup>/hoa.db.gz > /tmp/old-db.db

   # Use SQLite to query specific data
   sqlite3 /tmp/old-db.db "SELECT * FROM users WHERE id = X;"
   ```
4. **Manually restore specific records** or perform full restore

---

## Quick Reference

### Backup Commands
```bash
# Manual backup
./scripts/backup.sh

# List backups
ls -lht /root/hoa-backups/

# View backup log
tail -50 /root/hoa-backups/backup.log
```

### Restore Commands
```bash
# Interactive restore
./scripts/restore.sh

# Restore specific backup
./scripts/restore.sh 20250111_020000

# List backup contents
ls -lh /root/hoa-backups/<timestamp>/
```

### Verification Commands
```bash
# Check database integrity
sqlite3 backend/database/hoa.db "PRAGMA integrity_check;"

# Check application health
curl http://localhost:3001/api/health

# View logs
docker logs hoa_backend_api --tail=50
```

---

## Support

For backup and restore issues:

1. Check the [Incident Response Runbook](INCIDENT_RESPONSE.md)
2. Review backup logs: `/root/hoa-backups/backup.log`
3. Contact system administrator

---

*Last Updated: January 2025*
