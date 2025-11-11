# Monitoring and Observability Guide

This document explains how to monitor and observe the HOA Management System in production.

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Stack](#monitoring-stack)
3. [Accessing Dashboards](#accessing-dashboards)
4. [Key Metrics](#key-metrics)
5. [Alerts](#alerts)
6. [Logs](#logs)
7. [Error Tracking](#error-tracking)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The HOA Management System includes a comprehensive monitoring stack to provide visibility into:

- **Application Performance**: Request rates, response times, error rates
- **System Resources**: CPU, memory, disk usage
- **Business Metrics**: User activity, email sending, authentication attempts
- **Application Health**: Uptime, database connectivity
- **Errors**: Detailed error tracking and stack traces

---

## Monitoring Stack

### Components

| Component | Purpose | Port | URL |
|-----------|---------|------|-----|
| **Prometheus** | Metrics collection and storage | 9090 | http://your-server:9090 |
| **Grafana** | Metrics visualization and dashboards | 3002 | http://your-server:3002 |
| **Node Exporter** | System metrics (CPU, memory, disk) | 9100 | http://your-server:9100 |
| **Winston** | Structured logging | N/A | File-based |
| **Sentry** | Error tracking (optional) | N/A | Cloud-based |

### Starting the Monitoring Stack

```bash
# Start with main application
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Or start separately
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps
```

### Stopping the Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml down
```

---

## Accessing Dashboards

### Grafana Dashboard

**URL**: `http://your-server:3002`

**Default Credentials**:
- Username: `admin`
- Password: `admin` (change on first login)

**Change Password**:
```bash
# Set in .env before starting
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password
```

### Prometheus

**URL**: `http://your-server:9090`

No authentication by default. Access PromQL query interface and targets.

### Application Metrics Endpoint

**URL**: `http://your-server:3001/api/metrics`

Raw Prometheus metrics in text format.

---

## Key Metrics

### Application Performance Metrics

| Metric | Description | Type | Labels |
|--------|-------------|------|--------|
| `hoa_http_requests_total` | Total HTTP requests | Counter | `method`, `route`, `status_code` |
| `hoa_http_request_duration_seconds` | HTTP request duration | Histogram | `method`, `route`, `status_code` |
| `hoa_active_connections` | Number of active connections | Gauge | - |
| `hoa_errors_total` | Total application errors | Counter | `type`, `route`, `status_code` |

### Database Metrics

| Metric | Description | Type | Labels |
|--------|-------------|------|--------|
| `hoa_db_query_duration_seconds` | Database query duration | Histogram | `operation`, `model` |

### Business Metrics

| Metric | Description | Type | Labels |
|--------|-------------|------|--------|
| `hoa_auth_attempts_total` | Authentication attempts | Counter | `type`, `success` |
| `hoa_emails_sent_total` | Emails sent | Counter | `type`, `success` |
| `hoa_user_registrations_total` | User registrations | Counter | `status` |
| `hoa_announcements_created_total` | Announcements created | Counter | `notify` |
| `hoa_documents_uploaded_total` | Documents uploaded | Counter | `category` |

### System Metrics (from Node Exporter)

| Metric | Description |
|--------|-------------|
| `node_cpu_seconds_total` | CPU usage |
| `node_memory_*` | Memory usage |
| `node_filesystem_*` | Disk usage |
| `node_network_*` | Network I/O |

---

## Alerts

### Configured Alerts

Alerts are defined in `monitoring/prometheus/alerts.yml`.

#### Application Alerts

1. **HighErrorRate** (Warning)
   - Condition: Error rate > 0.05 errors/second for 5 minutes
   - Action: Investigate recent changes, check logs

2. **CriticalErrorRate** (Critical)
   - Condition: Error rate > 0.1 errors/second for 2 minutes
   - Action: Immediate investigation, possible rollback

3. **HighResponseTime** (Warning)
   - Condition: p95 response time > 2 seconds for 5 minutes
   - Action: Check database performance, system resources

4. **APIEndpointDown** (Critical)
   - Condition: Health check fails for 1 minute
   - Action: Check application status, restart if necessary

5. **HighMemoryUsage** (Warning)
   - Condition: Memory usage > 500MB for 5 minutes
   - Action: Check for memory leaks, restart if necessary

#### System Alerts

1. **HighCPUUsage** (Warning)
   - Condition: CPU usage > 80% for 5 minutes
   - Action: Check for runaway processes

2. **DiskSpaceLow** (Warning)
   - Condition: Disk space < 20%
   - Action: Clean up old backups, logs

3. **DiskSpaceCritical** (Critical)
   - Condition: Disk space < 10%
   - Action: Immediate cleanup required

#### Business Metric Alerts

1. **HighAuthFailureRate** (Warning)
   - Condition: Authentication failure rate > 0.5/second for 5 minutes
   - Action: Possible brute force attack, review IPs

2. **EmailSendingFailures** (Warning)
   - Condition: Email failure rate > 0.1/second for 5 minutes
   - Action: Check SendGrid status and API key

### Viewing Alerts

```bash
# In Prometheus
http://your-server:9090/alerts

# In Grafana
# Add an "Alert list" panel to your dashboard
```

---

## Logs

### Log Locations

| Log Type | Location | Rotation |
|----------|----------|----------|
| Combined logs | `backend/logs/combined-YYYY-MM-DD.log` | Daily, 14 days |
| Error logs | `backend/logs/error-YYYY-MM-DD.log` | Daily, 14 days |
| HTTP logs | `backend/logs/http-YYYY-MM-DD.log` | Daily, 7 days |
| Docker logs | Docker daemon | 10MB, 3 files |

### Viewing Logs

```bash
# Real-time application logs
docker logs hoa_backend_api --follow

# Last 100 lines
docker logs hoa_backend_api --tail=100

# Logs from specific time
docker logs hoa_backend_api --since=1h

# Error logs only
docker logs hoa_backend_api 2>&1 | grep -i error

# View log files directly
tail -f backend/logs/combined-$(date +%Y-%m-%d).log

# Search logs for specific pattern
grep "authentication" backend/logs/combined-*.log

# View HTTP request logs
tail -f backend/logs/http-$(date +%Y-%m-%d).log
```

### Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `error` | Errors and exceptions | Application failures, uncaught errors |
| `warn` | Warning messages | Degraded functionality, recoverable errors |
| `info` | Informational messages | Normal operations, startup/shutdown |
| `http` | HTTP request logs | All HTTP requests and responses |
| `debug` | Debug information | Development and troubleshooting |

### Structured Logging

Logs are output in JSON format (production) for easy parsing:

```json
{
  "timestamp": "2025-01-11 10:30:45",
  "level": "error",
  "message": "Database query failed",
  "userId": 123,
  "query": "SELECT * FROM users",
  "error": "SQLITE_BUSY"
}
```

---

## Error Tracking

### Sentry Setup (Optional)

Sentry provides detailed error tracking with stack traces, user context, and release tracking.

#### 1. Sign Up for Sentry

Visit https://sentry.io and create an account.

#### 2. Configure Sentry DSN

```bash
# Add to .env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
APP_VERSION=1.0.0
```

#### 3. Restart Application

```bash
docker-compose restart backend
```

#### 4. Verify Integration

Check Sentry dashboard for incoming events.

### Viewing Errors in Sentry

- **Issues**: Grouped errors with frequency and impact
- **Performance**: Transaction traces and slow queries
- **Releases**: Track errors by deployment version
- **Alerts**: Configure email/Slack notifications

---

## Troubleshooting

### Metrics Not Appearing in Grafana

1. **Check Prometheus is scraping**
   ```bash
   # Visit Prometheus targets
   http://your-server:9090/targets

   # Should show hoa-backend as "UP"
   ```

2. **Check application metrics endpoint**
   ```bash
   curl http://localhost:3001/api/metrics
   ```

3. **Verify Grafana data source**
   - Grafana → Configuration → Data Sources → Prometheus
   - Test connection

### Logs Not Being Written

1. **Check log directory exists**
   ```bash
   ls -la backend/logs/
   ```

2. **Check permissions**
   ```bash
   chmod 755 backend/logs
   ```

3. **Check environment variables**
   ```bash
   # In .env
   LOG_LEVEL=info
   ENABLE_FILE_LOGGING=true
   ```

### High Memory Usage

1. **Check memory metrics in Grafana**
2. **Restart application**
   ```bash
   docker-compose restart backend
   ```
3. **Check for memory leaks**
   - Review recent code changes
   - Monitor memory growth over time

### Prometheus Not Scraping

1. **Check Prometheus configuration**
   ```bash
   cat monitoring/prometheus/prometheus.yml
   ```

2. **Verify network connectivity**
   ```bash
   docker exec hoa_prometheus ping backend
   ```

3. **Check Prometheus logs**
   ```bash
   docker logs hoa_prometheus
   ```

---

## Best Practices

### 1. Regular Dashboard Review

- Check dashboards daily
- Set up email/Slack alerts for critical issues
- Review error trends weekly

### 2. Log Management

- Regularly archive old logs
- Set up log aggregation for long-term storage
- Use structured logging for easier parsing

### 3. Alert Tuning

- Adjust alert thresholds based on baseline
- Reduce alert fatigue by tuning sensitivity
- Create runbooks for common alerts

### 4. Performance Monitoring

- Set performance budgets
- Monitor p95/p99 latency
- Track database query performance

### 5. Security Monitoring

- Monitor authentication failure rates
- Track suspicious activity patterns
- Review audit logs regularly

---

## Quick Reference

### Common Commands

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# View all metrics
curl http://localhost:3001/api/metrics

# Check application health
curl http://localhost:3001/api/health

# View real-time logs
docker logs hoa_backend_api --follow

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Export Grafana dashboard
# Grafana UI → Dashboard → Share → Export → Save to file
```

### Important URLs

- Application: https://sandersoncreekhoa.com
- Health Check: https://sandersoncreekhoa.com/api/health
- Metrics: http://your-server:3001/api/metrics
- Grafana: http://your-server:3002
- Prometheus: http://your-server:9090

---

*Last Updated: January 2025*
