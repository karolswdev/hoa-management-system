#!/bin/bash

################################################################################
# HOA Management System - Health Check Script
#
# This script performs health checks on the HOA management system by:
# - Curling /api/healthz and /api/metrics endpoints
# - Validating response status codes and JSON structure
# - Checking config cache freshness and database connectivity
# - Optionally sending alerts via email when issues detected
#
# Usage:
#   ./scripts/healthcheck.sh [OPTIONS]
#
# Options:
#   --host URL          Target host URL (default: http://localhost:3001)
#   --retries N         Number of retry attempts (default: 3)
#   --timeout N         Timeout in seconds per request (default: 10)
#   --alert-email ADDR  Email address for alerts (requires mail command)
#   --fail-on-warn      Exit with code 1 on warnings (not just errors)
#   --verbose           Enable verbose output
#   --help              Show this help message
#
# Exit Codes:
#   0 - All checks passed
#   1 - Health check failed or warnings (with --fail-on-warn)
#   2 - Invalid arguments or setup error
#
# Cron setup (every 5 minutes with alerts):
#   */5 * * * * /path/to/hoa-management-system/scripts/healthcheck.sh \
#     --host https://hoa.example.com \
#     --alert-email ops@example.com >> /var/log/hoa-healthcheck.log 2>&1
#
# References:
#   - Architecture Section 3.7: Observability & Health Management
#   - Runbook: docs/runbooks/health-monitor.md
################################################################################

set -eo pipefail

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HEALTHCHECK_HOST:-http://localhost:3001}"
RETRIES="${HEALTHCHECK_RETRIES:-3}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-10}"
ALERT_EMAIL="${HEALTHCHECK_ALERT_EMAIL:-}"
FAIL_ON_WARN="${HEALTHCHECK_FAIL_ON_WARN:-false}"
VERBOSE="${HEALTHCHECK_VERBOSE:-false}"

# Temp files for response storage
HEALTHZ_RESPONSE="/tmp/hoa-healthz-$$.json"
METRICS_RESPONSE="/tmp/hoa-metrics-$$.json"

# Counters
ERRORS=0
WARNINGS=0

# Cleanup function
cleanup() {
  rm -f "$HEALTHZ_RESPONSE" "$METRICS_RESPONSE"
}
trap cleanup EXIT

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to log verbose messages
log_verbose() {
  if [ "$VERBOSE" = "true" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [VERBOSE] $1"
  fi
}

# Function to log errors
log_error() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
  ERRORS=$((ERRORS + 1))
}

# Function to log warnings
log_warn() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >&2
  WARNINGS=$((WARNINGS + 1))
}

# Function to check dependencies
check_dependencies() {
  local missing=0
  for cmd in curl jq; do
    if ! command -v "$cmd" &> /dev/null; then
      log_error "Required command not found: $cmd"
      missing=1
    fi
  done

  if [ $missing -eq 1 ]; then
    log_error "Please install missing dependencies (curl, jq)"
    exit 2
  fi
}

# Function to parse arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --host)
        HOST="$2"
        shift 2
        ;;
      --retries)
        RETRIES="$2"
        shift 2
        ;;
      --timeout)
        TIMEOUT="$2"
        shift 2
        ;;
      --alert-email)
        ALERT_EMAIL="$2"
        shift 2
        ;;
      --fail-on-warn)
        FAIL_ON_WARN="true"
        shift
        ;;
      --verbose)
        VERBOSE="true"
        shift
        ;;
      --help)
        grep '^#' "$0" | grep -v '#!/bin/bash' | sed 's/^# //' | sed 's/^#//'
        exit 0
        ;;
      *)
        log_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 2
        ;;
    esac
  done
}

# Function to perform HTTP request with retries
http_get() {
  local url="$1"
  local output_file="$2"
  local attempt=1
  local http_code

  while [ $attempt -le "$RETRIES" ]; do
    log_verbose "Attempt $attempt/$RETRIES: GET $url"

    http_code=$(curl -s -o "$output_file" -w "%{http_code}" \
      --max-time "$TIMEOUT" \
      --connect-timeout 5 \
      "$url" 2>/dev/null || echo "000")

    if [ "$http_code" = "200" ]; then
      log_verbose "Request succeeded (HTTP $http_code)"
      echo "$http_code"
      return 0
    fi

    log_warn "Request failed with HTTP $http_code (attempt $attempt/$RETRIES)"
    attempt=$((attempt + 1))

    if [ $attempt -le "$RETRIES" ]; then
      sleep 2
    fi
  done

  log_error "Request failed after $RETRIES attempts: $url"
  echo "$http_code"
  return 1
}

# Function to check /api/healthz endpoint
check_healthz() {
  log "Checking /api/healthz endpoint..."

  local url="${HOST}/api/healthz"
  local http_code

  http_code=$(http_get "$url" "$HEALTHZ_RESPONSE")

  if [ "$http_code" != "200" ]; then
    log_error "Health endpoint returned HTTP $http_code (expected 200)"
    return 1
  fi

  # Validate JSON structure
  if ! jq empty "$HEALTHZ_RESPONSE" 2>/dev/null; then
    log_error "Health endpoint returned invalid JSON"
    return 1
  fi

  # Extract key fields
  local status
  local version
  local db_status
  local cache_age
  local cache_ttl
  local theme_checksum

  status=$(jq -r '.status // "unknown"' "$HEALTHZ_RESPONSE")
  version=$(jq -r '.version // "unknown"' "$HEALTHZ_RESPONSE")
  db_status=$(jq -r '.checks.database.status // "unknown"' "$HEALTHZ_RESPONSE")
  cache_age=$(jq -r '.checks.config_cache.age_seconds // -1' "$HEALTHZ_RESPONSE")
  cache_ttl=$(jq -r '.checks.config_cache.ttl_seconds // 60' "$HEALTHZ_RESPONSE")
  theme_checksum=$(jq -r '.checks.theme.checksum // "unknown"' "$HEALTHZ_RESPONSE")

  log "Health status: $status (version: $version)"
  log "Database: $db_status"
  log "Config cache: ${cache_age}s age (TTL: ${cache_ttl}s)"
  log "Theme checksum: $theme_checksum"

  # Validate overall status
  if [ "$status" != "ok" ]; then
    log_error "Health status is not 'ok': $status"
  fi

  # Validate database
  if [ "$db_status" != "connected" ]; then
    log_error "Database is not connected: $db_status"
  fi

  # Validate config cache freshness
  if [ "$cache_age" -gt "$cache_ttl" ]; then
    log_warn "Config cache is stale: ${cache_age}s > ${cache_ttl}s TTL"
  fi

  # Check for theme checksum errors
  if [ "$theme_checksum" = "ERROR" ]; then
    log_warn "Theme checksum computation failed"
  fi

  return 0
}

# Function to check /api/metrics endpoint
check_metrics() {
  log "Checking /api/metrics endpoint..."

  local url="${HOST}/api/metrics"
  local http_code

  http_code=$(http_get "$url" "$METRICS_RESPONSE")

  if [ "$http_code" != "200" ]; then
    log_error "Metrics endpoint returned HTTP $http_code (expected 200)"
    return 1
  fi

  # Metrics endpoint returns Prometheus text format, not JSON
  # Just verify it returned some data
  if [ ! -s "$METRICS_RESPONSE" ]; then
    log_error "Metrics endpoint returned empty response"
    return 1
  fi

  local line_count
  line_count=$(wc -l < "$METRICS_RESPONSE")
  log "Metrics endpoint returned $line_count lines"

  return 0
}

# Function to send alert email
send_alert() {
  if [ -z "$ALERT_EMAIL" ]; then
    log_verbose "No alert email configured, skipping notification"
    return 0
  fi

  if ! command -v mail &> /dev/null; then
    log_warn "mail command not found, cannot send alert"
    return 1
  fi

  local subject="HOA Health Check Alert: $ERRORS error(s), $WARNINGS warning(s)"
  local body

  body=$(cat <<EOF
HOA Management System Health Check Alert

Target: $HOST
Timestamp: $(date)

Summary:
- Errors: $ERRORS
- Warnings: $WARNINGS

Healthz Response:
$(cat "$HEALTHZ_RESPONSE" 2>/dev/null || echo "No response captured")

Please investigate immediately.

--
Automated health check from $(hostname)
EOF
)

  echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
  log "Alert sent to $ALERT_EMAIL"
}

# Main execution
main() {
  log "========================================="
  log "HOA Management System Health Check"
  log "Target: $HOST"
  log "Retries: $RETRIES"
  log "Timeout: ${TIMEOUT}s"
  log "========================================="

  # Check dependencies
  check_dependencies

  # Run health checks
  check_healthz
  check_metrics

  # Summary
  log "========================================="
  log "Health Check Summary"
  log "Errors: $ERRORS"
  log "Warnings: $WARNINGS"
  log "========================================="

  # Send alerts if there are errors
  if [ $ERRORS -gt 0 ]; then
    send_alert
  fi

  # Determine exit code
  if [ $ERRORS -gt 0 ]; then
    log_error "Health check failed with $ERRORS error(s)"
    exit 1
  elif [ $WARNINGS -gt 0 ] && [ "$FAIL_ON_WARN" = "true" ]; then
    log_warn "Health check completed with $WARNINGS warning(s) (failing due to --fail-on-warn)"
    exit 1
  else
    log "Health check completed successfully"
    exit 0
  fi
}

# Parse arguments and run
parse_args "$@"
main
