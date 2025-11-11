# Deployment Guide

## Overview

This guide covers deploying the HOA Management System to your VPS, including all production-ready features: monitoring, logging, backups, and security enhancements.

---

## Quick Start for Updates

```bash
# From your local machine
cd /path/to/hoa-management-system
bash deploy/deploy.local.sh
```

---

## First-Time Deployment

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Create directories
mkdir -p /opt/hoa-management/backend/{database,uploads,logs}
mkdir -p /root/hoa-backups
chmod 755 /opt/hoa-management/backend/logs /root/hoa-backups
```

### Step 2: Create .env on VPS

Create `/opt/hoa-management/.env` with:

```bash
# CRITICAL - Change these!
JWT_SECRET=GENERATE_RANDOM_32_CHAR_STRING
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
TURNSTILE_SECRET_KEY=YOUR_TURNSTILE_SECRET
VITE_TURNSTILE_SITE_KEY=YOUR_TURNSTILE_SITE_KEY
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Required
NODE_ENV=production
APP_PORT=3001
EMAIL_FROM=no-reply@yourdomain.com
EMAIL_FROM_NAME=Your HOA Name
FRONTEND_BASE_URL=https://yourdomain.com

# New variables (important!)
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
GRAFANA_ADMIN_PASSWORD=CHANGE_THIS

# See .env.example for complete list
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Configure Local Deployment

```bash
cd deploy
cp config.example.env config.env
nano config.env  # Edit with your VPS details
```

### Step 4: Deploy

```bash
bash deploy/deploy.local.sh
```

### Step 5: Set Up Automated Backups

```bash
# On VPS
ssh root@YOUR_VPS_IP
crontab -e
# Add: 0 2 * * * /opt/hoa-management/scripts/backup.sh
```

### Step 6: Deploy Monitoring (Optional)

```bash
# On VPS
cd /opt/hoa-management
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access Grafana: http://YOUR_VPS_IP:3002
# Login: admin / [GRAFANA_ADMIN_PASSWORD]
```

---

## Important Environment Variables

### Must Change
- `JWT_SECRET` - Random 32+ chars
- `SENDGRID_API_KEY` - From SendGrid dashboard
- `ALLOWED_ORIGINS` - Your domain(s)
- `TURNSTILE_SECRET_KEY` - From Cloudflare
- `VITE_TURNSTILE_SITE_KEY` - From Cloudflare

### New in This Update
- `ALLOWED_ORIGINS` - CORS security (REQUIRED!)
- `LOG_LEVEL` - Logging verbosity (default: info)
- `ENABLE_FILE_LOGGING` - Enable file logs (default: true)
- `LOGS_DIR` - Log directory (default: ./logs)
- `SENTRY_DSN` - Optional error tracking
- `GRAFANA_ADMIN_PASSWORD` - Grafana login
- `BACKUP_RETENTION_DAYS` - Backup retention (default: 30)

---

## Deployment Troubleshooting

### Application Won't Start

```bash
# Check .env has ALLOWED_ORIGINS
ssh root@YOUR_VPS_IP "grep ALLOWED_ORIGINS /opt/hoa-management/.env"

# Check logs directory exists
ssh root@YOUR_VPS_IP "ls -la /opt/hoa-management/backend/logs"

# Create if missing
ssh root@YOUR_VPS_IP "mkdir -p /opt/hoa-management/backend/logs && chmod 755 /opt/hoa-management/backend/logs"

# Check container logs
ssh root@YOUR_VPS_IP "cd /opt/hoa-management && docker logs hoa_backend_api --tail=100"
```

### After Updating to Latest Code

1. **Update .env** - Add new variables from .env.example
2. **Create logs directory** - `mkdir -p backend/logs`
3. **Rebuild containers** - Deploy script does this automatically
4. **Set up backups** - Add cron job if not done
5. **Optional: Deploy monitoring** - See Step 6 above

---

## Monitoring Stack

### Start Monitoring

```bash
# On VPS
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Access
- Grafana: `http://YOUR_VPS_IP:3002`
- Prometheus: `http://YOUR_VPS_IP:9090`
- Metrics: `http://YOUR_VPS_IP:3001/api/metrics`

---

## Backups

### Automated Backups

```bash
# Test backup
/opt/hoa-management/scripts/backup.sh

# Schedule daily backups at 2 AM
crontab -e
# Add: 0 2 * * * /opt/hoa-management/scripts/backup.sh
```

### Restore

```bash
cd /opt/hoa-management
./scripts/restore.sh  # Interactive
./scripts/restore.sh 20250111_020000  # Specific backup
```

---

## Quick Reference

```bash
# Deploy
bash deploy/deploy.local.sh

# SSH to VPS
ssh root@YOUR_VPS_IP

# View status
docker-compose ps

# View logs
docker logs hoa_backend_api --follow

# Restart
docker-compose restart

# Backup
./scripts/backup.sh

# Check health
curl http://localhost:3001/api/health
```

---

## Post-Deployment Checklist

- [ ] Application accessible at https://yourdomain.com
- [ ] `/api/health` returns 200
- [ ] Login works
- [ ] Email notifications work
- [ ] Logs in `backend/logs/`
- [ ] Backup cron configured
- [ ] Grafana accessible (if enabled)
- [ ] All containers running

---

## Additional Documentation

- [Monitoring Guide](../docs/MONITORING.md) - Complete monitoring setup
- [Backup & Restore](../docs/BACKUP_AND_RESTORE.md) - Backup procedures
- [Incident Response](../docs/INCIDENT_RESPONSE.md) - Troubleshooting runbook
- [Changelog](../CHANGELOG.md) - All changes documented

---

*Last Updated: January 2025*
