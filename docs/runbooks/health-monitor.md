# Health Monitoring Runbook

<!-- anchor: health-monitor-runbook -->

**Owner:** DevOps Team
**Last Updated:** 2025-11-23
**Related:** [Deployment Runbook](./deployment.md), [Architecture Section 3.7](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-7-observability-health), [Task I5.T3](../../.codemachine/artifacts/plan/02_Iteration_I5.md#task-i5-t3)

---

## Overview

This runbook documents the health monitoring infrastructure for the HOA Management System, including automated health checks, hash chain verification, alerting procedures, and troubleshooting guidelines. The health monitoring system provides continuous visibility into application health, database connectivity, configuration cache freshness, and vote integrity.

**Monitoring Strategy:** Cron-based health checks with email alerting
**Primary Tool:** `scripts/healthcheck.sh`
**Secondary Tool:** `scripts/hash-chain-verify.js`
**Health Endpoints:** `/api/health`, `/api/healthz`, `/api/metrics`
**Alert Method:** SendGrid email notifications

**Key Features:**
- Extended health diagnostics (database, config cache, theme checksum)
- Hash chain verification for democracy/poll vote integrity
- Automated cron-based monitoring with configurable alerts
- Retry logic and timeout handling for reliable checks
- Integration with CI/CD health gate validation

---

## Prerequisites

### System Requirements

**Required Commands:**
- `curl` - For HTTP requests to health endpoints
- `jq` - For JSON parsing and validation
- `node` - For hash chain verification (Node.js 18+)
- `mail` - Optional, for email alerts (mailutils package)

**Installation (Debian/Ubuntu):**
```bash
sudo apt update
sudo apt install curl jq mailutils
```

### Access Requirements

- **Local Health Checks:** No authentication required (health endpoints are public)
- **Production Health Checks:** Network access to production domain
- **Database Access:** Required for hash chain verification (direct DB mode)
- **Email Alerts:** SendGrid API key or local mail server configuration

### Environment Setup

**Cron User Environment:**
Ensure the cron user has access to the project directory and required commands:

```bash
# Test as cron user
sudo -u <cron-user> /path/to/hoa-management-system/scripts/healthcheck.sh --help
```

---

## Health Endpoints

### 1. `/api/health` - Basic Health Check

**Purpose:** Lightweight endpoint for load balancers and Docker Compose healthchecks

**Response Format:**
```json
{
  "status": "ok",
  "time": "2025-11-23T10:30:00.000Z"
}
```

**Usage:**
```bash
curl http://localhost:3001/api/health
```

**Status Codes:**
- `200` - Service is running
- `5xx` - Service error (rare, indicates critical failure)

---

### 2. `/api/healthz` - Extended Health Diagnostics

**Purpose:** Comprehensive health check for CI/CD gates and monitoring scripts

**Response Format:**
```json
{
  "status": "ok",
  "version": "v1.2.3",
  "timestamp": "2025-11-23T10:30:00.000Z",
  "uptime_seconds": 86400,
  "checks": {
    "database": {
      "status": "connected",
      "latency_ms": 0
    },
    "config_cache": {
      "age_seconds": 45,
      "ttl_seconds": 60,
      "fresh": true
    },
    "theme": {
      "checksum": "a3f5d8e9c2b1f4e7"
    },
    "email": {
      "status": "configured"
    }
  },
  "response_time_ms": 12
}
```

**Key Fields:**
- `status` - Overall health: `ok` or `degraded`
- `checks.database.status` - Database connectivity: `connected` or `disconnected`
- `checks.config_cache.fresh` - Whether cache is within TTL (60 seconds)
- `checks.theme.checksum` - SHA256 hash of theme configuration (first 16 chars)
- `checks.email.status` - Email provider status: `configured`, `not_configured`, or `error`

**Usage:**
```bash
curl http://localhost:3001/api/healthz | jq
```

**Status Codes:**
- `200` - All checks passed (status: `ok`)
- `503` - Degraded health (database disconnected or critical check failed)

**CI/CD Integration:**
The deploy workflow health gate validates:
1. HTTP 200 response
2. `status` field is `ok`
3. Database is `connected`
4. Config cache is `fresh` (optional, warnings only)

---

### 3. `/api/healthz/hashchain/:pollId` - Hash Chain Verification

**Purpose:** Verify cryptographic integrity of poll votes via API

**Response Format:**
```json
{
  "poll_id": 123,
  "validation": {
    "valid": true,
    "totalVotes": 42,
    "brokenLinks": [],
    "message": "Hash chain is valid"
  },
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

**Usage:**
```bash
curl http://localhost:3001/api/healthz/hashchain/123 | jq
```

**Status Codes:**
- `200` - Validation completed (check `validation.valid` field)
- `404` - Poll not found or no votes
- `500` - Validation error

**Broken Links Example:**
```json
{
  "validation": {
    "valid": false,
    "totalVotes": 42,
    "brokenLinks": [
      {
        "index": 15,
        "voteId": 789,
        "reason": "Hash mismatch - vote data may have been tampered with"
      }
    ],
    "message": "Found 1 integrity issues"
  }
}
```

---

### 4. `/api/metrics` - Prometheus Metrics

**Purpose:** Expose application metrics in Prometheus text format

**Response Format:** (Prometheus text, not JSON)
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 12345
...
```

**Usage:**
```bash
curl http://localhost:3001/api/metrics
```

**Status Codes:**
- `200` - Metrics available
- `500` - Metrics collection error

---

## Health Check Script

### Basic Usage

**Location:** `scripts/healthcheck.sh`

**Default Behavior:**
```bash
cd /path/to/hoa-management-system
./scripts/healthcheck.sh
```

Checks `http://localhost:3001` with 3 retries, 10-second timeout per request.

**Exit Codes:**
- `0` - All checks passed
- `1` - Health check failed or warnings (with `--fail-on-warn`)
- `2` - Invalid arguments or missing dependencies

---

### Command-Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--host URL` | Target host URL | `http://localhost:3001` |
| `--retries N` | Retry attempts per request | `3` |
| `--timeout N` | Timeout in seconds | `10` |
| `--alert-email ADDR` | Email for alerts (requires `mail` command) | None |
| `--fail-on-warn` | Exit code 1 on warnings (not just errors) | `false` |
| `--verbose` | Enable verbose output | `false` |
| `--help` | Show help message | - |

**Examples:**

**Production check with alerts:**
```bash
./scripts/healthcheck.sh \
  --host https://hoa.example.com \
  --alert-email ops@example.com \
  --verbose
```

**Strict mode (fail on warnings):**
```bash
./scripts/healthcheck.sh \
  --host https://hoa.example.com \
  --fail-on-warn
```

**Quick local check:**
```bash
./scripts/healthcheck.sh --retries 1 --timeout 5
```

---

### Environment Variables

Alternative to command-line options (useful for cron):

| Variable | Equivalent Option |
|----------|------------------|
| `HEALTHCHECK_HOST` | `--host` |
| `HEALTHCHECK_RETRIES` | `--retries` |
| `HEALTHCHECK_TIMEOUT` | `--timeout` |
| `HEALTHCHECK_ALERT_EMAIL` | `--alert-email` |
| `HEALTHCHECK_FAIL_ON_WARN` | `--fail-on-warn` |
| `HEALTHCHECK_VERBOSE` | `--verbose` |

**Example:**
```bash
export HEALTHCHECK_HOST=https://hoa.example.com
export HEALTHCHECK_ALERT_EMAIL=ops@example.com
./scripts/healthcheck.sh
```

---

## Cron Setup

### Recommended Schedule

**Every 5 minutes (production):**
```cron
*/5 * * * * /opt/hoa/scripts/healthcheck.sh --host https://hoa.example.com --alert-email ops@example.com >> /var/log/hoa-healthcheck.log 2>&1
```

**Every 15 minutes (development/staging):**
```cron
*/15 * * * * /opt/hoa/scripts/healthcheck.sh --host http://localhost:3001 >> /var/log/hoa-healthcheck.log 2>&1
```

**Daily hash chain verification (2 AM):**
```cron
0 2 * * * /usr/bin/node /opt/hoa/scripts/hash-chain-verify.js --all >> /var/log/hoa-hashchain.log 2>&1
```

---

### Installation Steps

1. **Edit crontab as root or deploy user:**
   ```bash
   sudo crontab -e
   # or
   crontab -e
   ```

2. **Add health check entry:**
   ```cron
   # HOA Health Monitor - runs every 5 minutes
   */5 * * * * /opt/hoa/scripts/healthcheck.sh --host https://hoa.example.com --alert-email ops@example.com >> /var/log/hoa-healthcheck.log 2>&1
   ```

3. **Verify cron syntax:**
   ```bash
   crontab -l | grep hoa
   ```

4. **Create log file with correct permissions:**
   ```bash
   sudo touch /var/log/hoa-healthcheck.log
   sudo chown <cron-user>:<cron-user> /var/log/hoa-healthcheck.log
   ```

5. **Test cron execution:**
   ```bash
   # Manually run as cron user
   sudo -u <cron-user> /opt/hoa/scripts/healthcheck.sh --host https://hoa.example.com
   ```

6. **Monitor initial runs:**
   ```bash
   tail -f /var/log/hoa-healthcheck.log
   ```

---

### Log Rotation

Prevent log files from growing indefinitely:

**Create `/etc/logrotate.d/hoa-healthcheck`:**
```
/var/log/hoa-healthcheck.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 <cron-user> <cron-user>
}

/var/log/hoa-hashchain.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 0644 <cron-user> <cron-user>
}
```

**Test rotation:**
```bash
sudo logrotate -d /etc/logrotate.d/hoa-healthcheck
sudo logrotate -f /etc/logrotate.d/hoa-healthcheck
```

---

## Hash Chain Verification

### CLI Tool Usage

**Location:** `scripts/hash-chain-verify.js`

**Verify specific poll:**
```bash
node scripts/hash-chain-verify.js --poll-id 123
```

**Verify all polls:**
```bash
node scripts/hash-chain-verify.js --all
```

**Export hash chain data for audit:**
```bash
node scripts/hash-chain-verify.js --export audit-2025-11-23.json
```

**Verify via API (remote server):**
```bash
node scripts/hash-chain-verify.js \
  --api-url https://hoa.example.com \
  --poll-id 123
```

**Verbose output:**
```bash
node scripts/hash-chain-verify.js --poll-id 123 --verbose
```

---

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All hash chains valid |
| `1` | Hash chain validation failed (integrity breach detected) |
| `2` | Invalid arguments or setup error |

---

### Verification Modes

**1. Direct Database Access (Default):**
- Reads votes directly from SQLite database
- Requires backend models and utilities
- Fastest, most accurate (no network overhead)
- Use for local/on-server verification

**2. API Mode (`--api-url`):**
- Uses `/api/healthz/hashchain/:pollId` endpoint
- Works remotely without database access
- Subject to network timeouts and retries
- Use for external monitoring

**3. Export Mode (`--export`):**
- Generates JSON audit file with all hash chains
- Includes poll metadata and vote sequences
- Preserves data for external analysis tools
- Use for compliance audits and backups

---

## Alert Configuration

### Email Alerts

**Requirements:**
- `mail` command installed (mailutils package)
- Configured mail server or SendGrid relay
- Valid recipient email address

**Test email delivery:**
```bash
echo "Test email from HOA health monitor" | mail -s "Test Alert" ops@example.com
```

**Configure SendGrid relay (optional):**

Edit `/etc/postfix/main.cf`:
```
relayhost = [smtp.sendgrid.net]:587
smtp_sasl_auth_enable = yes
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_security_level = encrypt
```

Create `/etc/postfix/sasl_passwd`:
```
[smtp.sendgrid.net]:587    apikey:<SENDGRID_API_KEY>
```

Apply configuration:
```bash
sudo postmap /etc/postfix/sasl_passwd
sudo systemctl restart postfix
```

---

### Alert Escalation Path

**Tier 1: Email Alerts (Immediate)**
- Recipient: `ops@example.com` (operations team)
- Trigger: Health check failure (HTTP non-200, database disconnected)
- Response SLA: 15 minutes

**Tier 2: On-Call Notification (If unresolved)**
- Recipient: On-call engineer (via PagerDuty/Slack integration)
- Trigger: 3 consecutive health check failures (15 minutes at 5-minute intervals)
- Response SLA: 5 minutes

**Tier 3: Management Escalation (Critical)**
- Recipient: Engineering lead, product owner
- Trigger: Outage exceeds 1 hour or data integrity issue detected
- Response SLA: Immediate

**Contact Tree:**
```
ops@example.com
  ├─ DevOps Engineer (Primary)
  ├─ Backend Engineer (Secondary)
  └─ On-Call Engineer (via PagerDuty)
      └─ Engineering Lead (if >1 hour)
```

---

## Verification Checklist

Use this checklist after setting up health monitoring:

### Initial Setup

- [ ] **Dependencies installed:** `curl`, `jq`, `node`, `mail` available
- [ ] **Scripts executable:** `chmod +x scripts/healthcheck.sh scripts/hash-chain-verify.js`
- [ ] **Health endpoints responding:**
  ```bash
  curl http://localhost:3001/api/health
  curl http://localhost:3001/api/healthz | jq
  curl http://localhost:3001/api/metrics
  ```
- [ ] **Manual health check succeeds:**
  ```bash
  ./scripts/healthcheck.sh --host http://localhost:3001 --verbose
  ```
- [ ] **Hash chain verification works:**
  ```bash
  node scripts/hash-chain-verify.js --all
  ```
- [ ] **Email alerts configured:** Test `mail` command delivery
- [ ] **Cron entries added:** Verify with `crontab -l`
- [ ] **Log files created:** `/var/log/hoa-healthcheck.log` writable
- [ ] **Log rotation configured:** `/etc/logrotate.d/hoa-healthcheck` present

### Ongoing Monitoring

- [ ] **Review logs daily:** Check for recurring errors/warnings
- [ ] **Verify alert delivery:** Confirm ops team receives emails
- [ ] **Test escalation path:** Simulate failure and verify on-call notification
- [ ] **Audit hash chains weekly:** Run `--all` mode and review output
- [ ] **Update contact tree:** Keep escalation contacts current (quarterly)

---

## Troubleshooting

### Issue: "Health check failed after N attempts"

**Symptoms:**
- `healthcheck.sh` exits with code 1
- Log shows: `[ERROR] Request failed after 3 attempts`

**Diagnosis:**
```bash
# Test endpoint manually
curl -v http://localhost:3001/api/healthz

# Check if backend is running
docker ps | grep hoa_backend

# Review backend logs
docker logs hoa_backend_prod | tail -50
```

**Common Causes:**
1. **Backend container not running:** Restart with `docker-compose up -d`
2. **Database locked:** Check for long-running queries or migrations
3. **Network connectivity:** Verify DNS resolution and firewall rules
4. **Port conflict:** Ensure port 3001 is not bound by another process

**Resolution:**
```bash
# Restart backend
cd /opt/hoa
docker-compose restart backend

# Verify health
./scripts/healthcheck.sh --verbose
```

---

### Issue: "Config cache is stale"

**Symptoms:**
- Health check warning: `Config cache is stale: 120s > 60s TTL`
- `/api/healthz` shows `checks.config_cache.fresh: false`

**Diagnosis:**
This is a **warning**, not an error. Config cache exceeds 60-second TTL but doesn't block health checks.

**Common Causes:**
1. **Normal behavior:** Cache age resets periodically, not on every request
2. **Heavy load:** Config service experiencing high request volume
3. **Implementation gap:** Cache invalidation logic not implemented yet

**Resolution:**
```bash
# Restart backend to reset cache (if needed)
docker-compose restart backend

# Or ignore warning (use --fail-on-warn to enforce strictness)
./scripts/healthcheck.sh  # Exits 0 even with warnings by default
```

**Future Enhancement:**
Implement cache invalidation hooks in `config.service.js` to reset cache age on flag updates.

---

### Issue: "Hash chain validation failed"

**Symptoms:**
- `hash-chain-verify.js` exits with code 1
- Output shows: `[ERROR] Poll 123: INVALID - Found 1 integrity issues`

**Diagnosis:**
```bash
# Get detailed broken link info
node scripts/hash-chain-verify.js --poll-id 123 --verbose
```

**Example Output:**
```
[ERROR] Broken Links:
  1. Vote 789 (index 15): Hash mismatch - vote data may have been tampered with
```

**Common Causes:**
1. **Database corruption:** SQLite file corrupted (disk error, crash during write)
2. **Manual vote edits:** Votes modified via SQL without recomputing hash
3. **Migration bug:** Schema change broke hash computation logic
4. **Code regression:** Hash function changed between vote creation and verification

**Resolution:**

**⚠️ CRITICAL:** Hash chain breaks indicate potential data integrity issues. Do NOT ignore.

1. **Isolate poll:**
   ```bash
   # Mark poll as under investigation (via admin UI or SQL)
   # Prevent new votes until resolved
   ```

2. **Review audit logs:**
   ```bash
   # Check for manual database modifications
   docker-compose exec backend node -e "
   const db = require('./src/models');
   db.AuditLog.findAll({ where: { entity_type: 'vote' }, order: [['createdAt', 'DESC']], limit: 20 }).then(logs => console.log(logs));
   "
   ```

3. **Restore from backup (if available):**
   ```bash
   # Find last good backup before hash break
   ls -lt /root/hoa-backups/ | head -10

   # Restore database (see deployment.md rollback section)
   ```

4. **Contact engineering team:** Escalate to backend developers for forensic analysis

**Prevention:**
- Run hash chain verification daily via cron (catches issues early)
- Include hash validation in backup verification workflow
- Never modify `Vote` table directly without recomputing hashes

---

### Issue: "Email alerts not received"

**Symptoms:**
- Health checks succeed but no email alerts during failures
- Log shows: `[WARN] mail command not found, cannot send alert`

**Diagnosis:**
```bash
# Test mail command
command -v mail

# Test email delivery
echo "Test" | mail -s "Test Subject" ops@example.com

# Check mail logs
sudo tail -f /var/log/mail.log
```

**Common Causes:**
1. **mailutils not installed:** Install with `sudo apt install mailutils`
2. **Mail server not configured:** No local MTA (Postfix/Exim) or relay
3. **SendGrid relay misconfigured:** Check `/etc/postfix/main.cf`
4. **Recipient address blocked:** Check spam filters

**Resolution:**
```bash
# Install mailutils
sudo apt update && sudo apt install mailutils

# Configure SendGrid relay (see Alert Configuration section)

# Test again
./scripts/healthcheck.sh --alert-email ops@example.com --host http://invalid-host
# Should send alert email due to connection failure
```

---

### Issue: "Cron job not running"

**Symptoms:**
- `/var/log/hoa-healthcheck.log` not updating
- No health check activity despite cron entry

**Diagnosis:**
```bash
# Verify cron entry exists
crontab -l | grep hoa

# Check cron logs
sudo tail -f /var/log/syslog | grep CRON

# Test manual execution as cron user
sudo -u <cron-user> /opt/hoa/scripts/healthcheck.sh --verbose
```

**Common Causes:**
1. **Cron syntax error:** Invalid crontab entry
2. **Script not executable:** Missing `chmod +x`
3. **PATH issues:** Cron environment doesn't include `/usr/bin` or `/usr/local/bin`
4. **Permission denied:** Cron user lacks access to project directory

**Resolution:**
```bash
# Fix permissions
chmod +x /opt/hoa/scripts/healthcheck.sh
sudo chown -R <cron-user>:<cron-user> /opt/hoa

# Use absolute paths in crontab
crontab -e
# Change: */5 * * * * healthcheck.sh
# To:     */5 * * * * /opt/hoa/scripts/healthcheck.sh

# Add PATH to crontab (top of file)
PATH=/usr/local/bin:/usr/bin:/bin

# Reload cron
sudo systemctl restart cron
```

---

## Monitoring Best Practices

### 1. Baseline Metrics

Establish baseline health metrics to identify anomalies:

| Metric | Healthy Baseline | Alert Threshold |
|--------|-----------------|----------------|
| `/api/healthz` response time | <50ms | >200ms |
| Database latency | <10ms | >100ms |
| Config cache age | <60s | >120s |
| Uptime | Days/weeks | <5 minutes (restart detected) |
| Hash chain validity | 100% | <100% (immediate alert) |

### 2. Alert Fatigue Prevention

**Do:**
- Use warnings for non-critical issues (stale cache)
- Aggregate alerts (send summary email every 6 hours for warnings)
- Implement retry logic (3 attempts before alerting)

**Don't:**
- Alert on every transient network blip
- Send individual emails for each health check failure
- Use `--fail-on-warn` in production cron (reserve for CI/CD)

### 3. Incident Response Workflow

1. **Receive Alert** → Check email for health check failure
2. **Triage** → Review logs (`/var/log/hoa-healthcheck.log`)
3. **Diagnose** → Run manual health check with `--verbose`
4. **Remediate** → Restart backend, fix database, or escalate
5. **Verify** → Confirm health check succeeds
6. **Document** → Record incident in runbook or issue tracker

### 4. Regular Audits

**Weekly:**
- Review health check logs for patterns (recurring warnings)
- Verify hash chain integrity for all polls

**Monthly:**
- Test alert escalation path (simulate failure)
- Review and update contact tree

**Quarterly:**
- Audit cron schedule (optimize frequency vs. load)
- Benchmark health endpoint response times

---

## Related Documentation

- **Architecture:**
  - [Section 3.7: Observability & Health Management](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-7-observability-health)
  - [Section 3.3: Deployment Artifacts & Pipeline](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-3-deployment-artifacts-pipeline)
- **Runbooks:**
  - [Deployment Runbook](./deployment.md)
  - [CI Pipeline Runbook](./ci-pipeline.md)
  - [Release Checklist](./release-checklist.md)
- **Implementation:**
  - [Health Controller](../../backend/src/controllers/health.controller.js)
  - [Hash Chain Utilities](../../backend/src/utils/hashChain.js)
- **Scripts:**
  - [scripts/healthcheck.sh](../../scripts/healthcheck.sh)
  - [scripts/hash-chain-verify.js](../../scripts/hash-chain-verify.js)
- **Planning:**
  - [Task I5.T3 - Health Tooling](../../.codemachine/artifacts/plan/02_Iteration_I5.md#task-i5-t3)

---

## Maintenance & Review

**Review Schedule:** Quarterly or after health monitoring incidents

**Update Triggers:**
- New health check dimensions added (e.g., external API checks)
- Alert escalation path changes
- Cron schedule adjustments
- Migration to external monitoring (Prometheus, Datadog, etc.)

**Change Process:**
1. Update health controller or scripts
2. Test changes locally with `--verbose` flag
3. Update this runbook (sync examples, troubleshooting)
4. Deploy to production during maintenance window
5. Monitor first 24 hours of new health checks
6. Document changes in deployment log

**Owner:** DevOps Team
**Review Approvers:** Lead Engineer, Backend Team Lead

---

**End of Runbook**

For questions or runbook updates, contact DevOps team or file issue with label `ops/monitoring`.
