# Incident Response Runbook

This document provides step-by-step procedures for responding to common incidents in the HOA Management System.

## Table of Contents

1. [General Incident Response Procedure](#general-incident-response-procedure)
2. [Application Down](#application-down)
3. [Database Issues](#database-issues)
4. [High Error Rates](#high-error-rates)
5. [Performance Degradation](#performance-degradation)
6. [Security Incidents](#security-incidents)
7. [Email Service Failures](#email-service-failures)
8. [Disk Space Issues](#disk-space-issues)
9. [Post-Incident Review](#post-incident-review)

---

## General Incident Response Procedure

### Initial Response (First 5 minutes)

1. **Acknowledge the incident**
   - Note the time incident was detected
   - Identify the severity (Critical, High, Medium, Low)

2. **Gather initial information**
   - Check Grafana dashboards: http://your-domain:3002
   - Review recent logs: `docker logs hoa_backend_api --tail=100`
   - Check application status: `curl http://localhost:3001/api/health`

3. **Assess impact**
   - Is the application accessible?
   - Are users affected?
   - What functionality is impaired?

4. **Communicate**
   - Notify stakeholders if user-facing
   - Document findings as you investigate

---

## Application Down

### Symptoms
- Application not responding
- Health check endpoint returns errors
- Users cannot access the site

### Diagnosis

```bash
# Check if containers are running
docker ps | grep hoa

# Check container health
docker inspect hoa_backend_api | grep -A 10 Health

# Check recent container logs
docker logs hoa_backend_api --tail=100 --follow

# Check system resources
df -h  # Disk space
free -h  # Memory
top  # CPU usage
```

### Resolution Steps

#### Option 1: Restart the application

```bash
cd /path/to/hoa-management-system
docker-compose restart
```

#### Option 2: Rebuild and restart

```bash
cd /path/to/hoa-management-system
docker-compose down
docker-compose up -d --build
```

#### Option 3: Check nginx configuration

```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx error logs
sudo tail -f /var/log/nginx/hoa-management-error.log
```

### Prevention
- Set up monitoring alerts for application downtime
- Enable automatic container restart policies
- Regular health checks

---

## Database Issues

### Symptoms
- "Database connection failed" errors
- Slow query performance
- Data inconsistencies

### Diagnosis

```bash
# Check database file exists and is accessible
ls -lh backend/database/hoa.db

# Check database size
du -h backend/database/hoa.db

# Verify database integrity (requires sqlite3)
sqlite3 backend/database/hoa.db "PRAGMA integrity_check;"

# Check for lock files
ls -la backend/database/ | grep lock
```

### Resolution Steps

#### Database Connection Issues

```bash
# Restart backend to release connections
docker-compose restart backend

# Check file permissions
chmod 664 backend/database/hoa.db
chown 1000:1000 backend/database/hoa.db  # Adjust UID/GID as needed
```

#### Database Corruption

```bash
# Stop the application
docker-compose stop backend

# Backup current database
cp backend/database/hoa.db backend/database/hoa.db.corrupted

# Attempt recovery
sqlite3 backend/database/hoa.db ".recover" | sqlite3 backend/database/hoa_recovered.db

# If recovery successful, replace database
mv backend/database/hoa.db backend/database/hoa.db.corrupted
mv backend/database/hoa_recovered.db backend/database/hoa.db

# Restart application
docker-compose start backend
```

#### Restore from Backup

```bash
# List available backups
./scripts/restore.sh

# Follow prompts to restore
```

### Prevention
- Regular automated backups (configured via cron)
- Monitor database size growth
- Implement database health checks

---

## High Error Rates

### Symptoms
- Grafana shows spike in error metrics
- Users reporting errors
- `hoa_errors_total` metric increasing rapidly

### Diagnosis

```bash
# Check error logs
docker logs hoa_backend_api --tail=200 | grep -i error

# Check Sentry for error details (if configured)
# Visit Sentry dashboard

# Check recent deployments
git log -10 --oneline

# Check for failed requests by status code
# View Grafana dashboard: HTTP Requests by Status Code
```

### Resolution Steps

#### Recent Deployment Issue

```bash
# Rollback to previous version
git checkout <previous-commit>
docker-compose up -d --build
```

#### External Service Failure (e.g., SendGrid)

```bash
# Check SendGrid status: https://status.sendgrid.com/

# Verify API key is valid
# Check .env file for EMAIL_PROVIDER and SENDGRID_API_KEY

# Test email service manually
# Use backend logs to verify email sending attempts
```

#### Rate Limiting Issues

```bash
# Check if legitimate traffic is being rate limited
docker logs hoa_backend_api | grep "Rate limit exceeded"

# Temporarily increase rate limits in:
# backend/src/config/rate-limit.js

# Restart backend
docker-compose restart backend
```

### Prevention
- Set up error rate alerts in Grafana
- Configure Sentry for automatic error tracking
- Implement gradual rollout for deployments

---

## Performance Degradation

### Symptoms
- Slow response times
- High p95/p99 latency in Grafana
- Users reporting slowness

### Diagnosis

```bash
# Check response times in Grafana
# View: Response Time Percentiles panel

# Check CPU usage
docker stats hoa_backend_api

# Check memory usage
docker stats hoa_backend_api

# Check slow queries
docker logs hoa_backend_api | grep -i "slow\|timeout"

# Check system load
uptime
top
```

### Resolution Steps

#### High CPU/Memory Usage

```bash
# Restart backend to clear memory leaks
docker-compose restart backend

# If issue persists, check for resource limits
docker inspect hoa_backend_api | grep -A 5 Memory

# Increase container resources in docker-compose.yml
```

#### Database Performance

```bash
# Check for missing indexes or slow queries
# Review backend logs for query patterns

# Analyze database
sqlite3 backend/database/hoa.db "ANALYZE;"

# Restart application
docker-compose restart backend
```

#### Disk I/O Issues

```bash
# Check disk usage
df -h
iostat -x 1 5

# Clear logs if disk is full
docker system prune -af  # CAUTION: removes unused images
```

### Prevention
- Monitor performance metrics continuously
- Set up performance degradation alerts
- Regular performance testing
- Implement caching where appropriate

---

## Security Incidents

### Symptoms
- Unusual authentication patterns
- High authentication failure rates
- Unexpected user activity
- Reports of unauthorized access

### Diagnosis

```bash
# Check authentication attempts in Grafana
# View: Authentication Attempts panel

# Review audit logs
docker logs hoa_backend_api | grep "Audit Log"

# Check for suspicious IPs
docker logs hoa_backend_api | grep "Rate limit exceeded"

# Review recent admin actions via API
# GET /api/admin/audit-logs
```

### Resolution Steps

#### Suspected Brute Force Attack

```bash
# Check rate limiting is active
docker logs hoa_backend_api | grep "login rate limit"

# Identify attacking IPs
docker logs hoa_backend_api | grep "Login rate limit exceeded" | awk '{print $1}' | sort | uniq -c

# Block IPs at nginx level (temporary)
sudo nano /etc/nginx/sites-available/your-site
# Add: deny <ip-address>;
sudo nginx -t && sudo systemctl reload nginx
```

#### Compromised Account

```bash
# Disable user account immediately via admin panel
# OR directly via API:
# PUT /api/admin/users/{userId}/status
# Body: { "status": "rejected" }

# Force password reset
# PUT /api/admin/users/{userId}/password

# Review user's recent activity
# GET /api/admin/audit-logs?userId={userId}
```

#### Data Breach Suspected

1. **Immediate Actions**
   - Take application offline if necessary
   - Preserve evidence (logs, database)
   - Contact system administrator

2. **Investigation**
   ```bash
   # Create forensic backup
   ./scripts/backup.sh
   mv /root/hoa-backups/<latest> /root/hoa-backups/forensic-$(date +%Y%m%d)

   # Review all admin actions
   # GET /api/admin/audit-logs

   # Check for unauthorized admin accounts
   # GET /api/admin/users?role=admin
   ```

3. **Notification**
   - Notify affected users
   - Follow legal/compliance requirements
   - Document incident timeline

### Prevention
- Regular security audits
- Strong password policies enforced
- Monitor authentication failure rates
- Implement 2FA for admin accounts (future enhancement)
- Regular review of admin user accounts

---

## Email Service Failures

### Symptoms
- Email notification failures
- SendGrid errors in logs
- Users not receiving emails

### Diagnosis

```bash
# Check email metrics in Grafana
# View: Email Sending Rate panel

# Check SendGrid logs
docker logs hoa_backend_api | grep -i "email\|sendgrid"

# Verify SendGrid API key
echo $SENDGRID_API_KEY  # From .env

# Check SendGrid service status
# https://status.sendgrid.com/
```

### Resolution Steps

#### Invalid API Key

```bash
# Update API key in .env
nano .env
# Set SENDGRID_API_KEY=your-new-key

# Restart backend
docker-compose restart backend
```

#### Rate Limit Reached

```bash
# Check SendGrid dashboard for rate limit status
# Upgrade SendGrid plan if needed

# Temporarily disable notification emails if critical
# Comment out notify:true in announcement creation
```

#### Email Bounces

```bash
# Review bounced emails in SendGrid dashboard
# Clean up invalid email addresses from database

# Check email validation logic
# Verify EMAIL_FROM address is verified in SendGrid
```

### Prevention
- Monitor email sending rates
- Set up SendGrid webhook for bounce notifications
- Regular SendGrid API key rotation
- Backup email provider configuration

---

## Disk Space Issues

### Symptoms
- "No space left on device" errors
- Application crashes
- Backup failures

### Diagnosis

```bash
# Check disk usage
df -h

# Find large files/directories
du -h /root/hoa-backups | sort -rh | head -10
du -h /var/lib/docker | sort -rh | head -10

# Check log sizes
du -sh backend/logs/*
du -sh /var/log/nginx/*
```

### Resolution Steps

```bash
# Clean up old backups
find /root/hoa-backups -type d -name "20*" -mtime +30 -exec rm -rf {} \;

# Rotate and compress logs
cd backend/logs
gzip *.log
find . -name "*.log.gz" -mtime +7 -delete

# Clean up Docker resources
docker system prune -af  # CAUTION: removes unused images
docker volume prune -f

# Clean up nginx logs
sudo truncate -s 0 /var/log/nginx/*.log
```

### Prevention
- Monitor disk space with alerts
- Automated backup cleanup (configured in backup.sh)
- Log rotation policies
- Regular cleanup schedule

---

## Post-Incident Review

After resolving any incident, conduct a post-incident review:

### Template

```markdown
# Incident Report: [Title]

**Date**: [Date]
**Severity**: [Critical/High/Medium/Low]
**Duration**: [Start time] to [End time]
**Impact**: [Description of user impact]

## Timeline
- [Time]: Incident detected
- [Time]: Initial response
- [Time]: Root cause identified
- [Time]: Fix implemented
- [Time]: Incident resolved

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to resolve the incident]

## Action Items
- [ ] [Preventive measure 1]
- [ ] [Monitoring improvement 1]
- [ ] [Documentation update 1]

## Lessons Learned
[Key takeaways and improvements]
```

### Follow-up Actions
1. Update runbooks with new procedures
2. Implement additional monitoring
3. Schedule follow-up review
4. Share learnings with team

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| System Administrator | [Name] | [Email/Phone] |
| HOA Board President | [Name] | [Email/Phone] |
| Hosting Provider | Linode Support | https://www.linode.com/support/ |
| Email Provider | SendGrid Support | https://support.sendgrid.com/ |

---

## Quick Reference

### Important URLs
- Production Site: https://sandersoncreekhoa.com
- Grafana Dashboard: http://your-server:3002
- Prometheus Metrics: http://your-server:9090

### Important Paths
- Project Root: `/path/to/hoa-management-system`
- Database: `backend/database/hoa.db`
- Uploads: `backend/uploads/`
- Logs: `backend/logs/` and `/var/log/nginx/`
- Backups: `/root/hoa-backups/`

### Key Commands
```bash
# Application status
docker ps
curl http://localhost:3001/api/health

# Restart application
docker-compose restart

# View logs
docker logs hoa_backend_api --tail=100 --follow

# Backup
./scripts/backup.sh

# Restore
./scripts/restore.sh

# Check metrics
curl http://localhost:3001/api/metrics
```

---

*Last Updated: January 2025*
