# Feature Flags Runbook

<!-- anchor: feature-flags-runbook -->

**Owner:** Operations Team
**Last Updated:** 2025-11-23
**Related:** [Deployment Runbook](./deployment.md), [Release Checklist](./release-checklist.md), [Architecture Section 3.4](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-4-runtime-configuration--secrets)

---

## Overview

This runbook provides operational procedures for managing feature flags in the HOA Management System. Feature flags enable staged rollouts, A/B testing, and runtime configuration changes without code deployments, supporting the system's iterative delivery model and volunteer operator constraints.

**Feature Flag System:** Database-backed configuration stored in `Config` table
**Admin Interface:** `/admin/config` (requires admin role)
**Cache TTL:** 60 seconds (config changes propagate within 1 minute)
**Persistence:** SQLite database with audit logging

**Key Capabilities:**
- Enable/disable features without redeployment
- Gradual rollout control (admin-only → member pilot → general availability)
- Emergency kill switch for problematic features
- Configuration versioning and audit trail

---

## Prerequisites

### Access Requirements

- **Admin Account:** Authenticated user with `role: 'admin'`
- **Database Access (Optional):** SSH access to production host for direct queries
- **Audit Log Access:** Permission to view `AuditEvents` table

### Tools & Interfaces

**Primary Method: Admin UI**
- URL: `https://<domain>/admin/config`
- Authentication: Session-based JWT
- Permissions: Admin role required

**Fallback Method: Database CLI**
```bash
ssh root@<production-host>
cd /opt/hoa
docker compose exec app bash
sqlite3 backend/database/hoa.db
```

---

## Feature Flag Catalog

### Core System Flags

| Flag Key | Type | Default | Description | Dependencies |
|----------|------|---------|-------------|--------------|
| `board.visibility` | `string` | `public` | Board member page visibility (`public`, `members-only`, `hidden`) | None |
| `maintenance.mode` | `boolean` | `false` | Global maintenance mode (disables all non-admin routes) | None |
| `registration.enabled` | `boolean` | `true` | New user registration toggle | `TURNSTILE_SECRET_KEY` env var |

### Vendor Directory Flags

| Flag Key | Type | Default | Description | Dependencies |
|----------|------|---------|-------------|--------------|
| `vendors.directory` | `boolean` | `false` | Master switch for vendor directory feature | Vendors table migrated |
| `vendors.public-categories` | `string` | `""` | Comma-separated list of categories visible to guests | `vendors.directory=true` |
| `vendors.moderation-queue` | `boolean` | `true` | Require admin approval for vendor submissions | None |
| `vendors.member-submissions` | `boolean` | `true` | Allow members to submit vendors | `vendors.directory=true` |

### Democracy Module Flags

| Flag Key | Type | Default | Description | Dependencies |
|----------|------|---------|-------------|--------------|
| `polls.enabled` | `boolean` | `true` | Master switch for poll creation/voting | Polls table migrated |
| `polls.notify-members-enabled` | `boolean` | `false` | Email notifications for new polls | `EMAIL_PROVIDER` configured |
| `polls.binding-enabled` | `boolean` | `false` | Mark polls as binding (vs. advisory) | Board governance policy |
| `polls.public-results` | `boolean` | `false` | Show results to all members (vs. admin-only) | `polls.enabled=true` |

### Accessibility Flags

| Flag Key | Type | Default | Description | Dependencies |
|----------|------|---------|-------------|--------------|
| `accessibility.high-vis-default` | `boolean` | `false` | Default new users to high-visibility mode | Theme tokens loaded |
| `accessibility.font-scaling` | `boolean` | `true` | Enable font size scaling controls | CSS variables configured |

### Notification & Communication Flags

| Flag Key | Type | Default | Description | Dependencies |
|----------|------|---------|-------------|--------------|
| `notifications.email-audit` | `boolean` | `true` | Log all outbound emails to `EmailAudit` table | None |
| `notifications.batch-size` | `integer` | `50` | Max recipients per SendGrid batch | `EMAIL_PROVIDER=sendgrid` |
| `notifications.resident-log-retention` | `integer` | `90` | Days to retain resident notification logs | None |

---

## Operational Procedures

### 1. Viewing Current Flag States

#### Method A: Admin UI

1. **Login to admin account:**
   - Navigate to `https://<domain>/admin`
   - Authenticate with admin credentials

2. **Access configuration page:**
   - Click "Configuration" in admin navigation
   - URL: `/admin/config`

3. **Review flag states:**
   - Flags displayed in table format with key, value, description
   - Color-coded: Green (enabled), Red (disabled), Blue (custom value)

**Expected View:**
```
┌─────────────────────────────┬─────────┬──────────────────────────┐
│ Key                         │ Value   │ Last Updated             │
├─────────────────────────────┼─────────┼──────────────────────────┤
│ vendors.directory           │ false   │ 2025-11-23 14:30:00 UTC │
│ polls.notify-members-enabled│ true    │ 2025-11-23 14:30:00 UTC │
│ board.visibility            │ members │ 2025-11-22 10:15:00 UTC │
└─────────────────────────────┴─────────┴──────────────────────────┘
```

#### Method B: Database Query

```bash
# SSH into production host
ssh root@<production-host>
cd /opt/hoa

# Query all flags
docker compose exec app bash -c "sqlite3 backend/database/hoa.db \"SELECT key, value FROM Config ORDER BY key;\""

# Query specific flag
docker compose exec app bash -c "sqlite3 backend/database/hoa.db \"SELECT key, value FROM Config WHERE key='vendors.directory';\""
```

**Expected Output:**
```
vendors.directory|false
vendors.public-categories|Landscaping,Plumbing,Electrical,HVAC
polls.notify-members-enabled|true
```

---

### 2. Toggling Boolean Flags

#### Method A: Admin UI (Recommended)

1. **Navigate to `/admin/config`**

2. **Locate flag in table:**
   - Use search/filter if available
   - Example: Search for `vendors.directory`

3. **Click toggle switch or edit button**

4. **Confirm change:**
   - Modal may prompt for confirmation
   - Click "Save" or "Update"

5. **Verify update:**
   - Flag value updates in table
   - Success message displayed
   - `Last Updated` timestamp refreshed

6. **Wait for cache invalidation:**
   - Changes propagate within 60 seconds (cache TTL)
   - For immediate effect, restart backend container:
     ```bash
     ssh root@<host> "cd /opt/hoa && docker compose restart app"
     ```

**Audit Trail:**
- All flag changes logged to `AuditEvents` table
- Includes: operator user_id, timestamp, old value, new value

#### Method B: Database CLI (Emergency Only)

**Use case:** Admin UI unavailable, emergency toggle required

```bash
# Connect to database
ssh root@<production-host>
cd /opt/hoa
docker compose exec app bash
sqlite3 backend/database/hoa.db

# Toggle flag (example: enable vendor directory)
UPDATE Config SET value = 'true' WHERE key = 'vendors.directory';

# Verify update
SELECT key, value FROM Config WHERE key = 'vendors.directory';

# Exit SQLite
.quit
```

**Critical:** Manual database changes bypass audit logging. Document changes in deployment log.

---

### 3. Setting String/Integer Flags

#### Update Multi-Value Flags

**Example:** Setting public vendor categories

1. **Navigate to `/admin/config`**

2. **Locate flag:** `vendors.public-categories`

3. **Click "Edit" button**

4. **Update value in text field:**
   ```
   Landscaping,Plumbing,Electrical,HVAC,Roofing,Painting
   ```
   **Format:** Comma-separated, no spaces after commas

5. **Save changes**

6. **Verify parsing:**
   - Frontend splits on comma: `value.split(',')`
   - Test guest access to `/vendors` to confirm category filter

**Validation Rules:**
- Categories must be non-empty strings
- No leading/trailing whitespace
- Case-sensitive matching

---

### 4. Feature Flag Coordination During Deployment

<!-- anchor: feature-flag-rollout-coordination -->

**Scenario:** Deploying new feature with staged rollout plan

This section provides the phased rollout playbook for feature flags, with automation scripts and detailed verification steps tied to KPI monitoring and Go/No-Go decision gates.

#### Phase 1: Pre-Deployment (Admin-Only Pilot)

**Timeline:** Week 1 after deployment

**Flag Configuration:**
```json
{
  "vendors.directory": "false",
  "vendors.member-submissions": "false"
}
```

**Access:**
- Admin can access `/admin/vendors` directly (route whitelisted)
- Members see "Feature coming soon" message
- Guests see no vendor navigation link

**Verification:**
- Admin creates test vendor entries
- Admin tests moderation workflow
- Admin reviews vendor submission emails

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/phase1-admin-pilot.sh
# Configures feature flags for Phase 1 (Admin-Only Pilot)

set -e

echo "=== Phase 1: Admin-Only Pilot ==="
echo "Setting feature flags for admin-only access..."

# Set flags via Admin UI API (requires admin token)
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  echo "Usage: ADMIN_TOKEN=<token> ./phase1-admin-pilot.sh"
  exit 1
fi

# Helper function to update config
update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

# Vendor Directory flags
update_config "vendors.directory" "false"
update_config "vendors.member-submissions" "false"
update_config "vendors.public-categories" ""

# Accessibility flags (enable for pilot testing)
update_config "accessibility.high-vis-default" "false"

# Democracy flags (keep existing state)
echo "Democracy flags unchanged (already enabled from I3)"

echo ""
echo "Phase 1 configuration complete!"
echo "Verify admin access: https://hoa.example.com/admin/vendors"
echo "Next: Run KPI baseline measurement before pilot starts"
```

**KPI Baseline Measurement:**
- Capture pre-pilot metrics for comparison
- Document admin user list for pilot participation tracking
- Reference: [KPI Dashboard](../metrics/kpi-dashboard.md#kpi-definitions)

#### Phase 2: Member Pilot

**Timeline:** Week 2 (after admin approval via [Go/No-Go Checklist](./go-no-go-checklist.md#phase-1-to-phase-2))

**Flag Configuration:**
```json
{
  "vendors.directory": "true",
  "vendors.member-submissions": "true",
  "vendors.public-categories": ""
}
```

**Access:**
- All authenticated members can view vendor directory
- Members can submit vendors for moderation
- Guests still restricted (empty public categories)

**Monitoring:**
- Track vendor submission rate
- Monitor moderation queue length
- Review member feedback

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/phase2-member-pilot.sh
# Configures feature flags for Phase 2 (Member Pilot)

set -e

echo "=== Phase 2: Member Pilot ==="
echo "Enabling vendor directory for authenticated members..."

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

# Enable vendor directory for members
update_config "vendors.directory" "true"
update_config "vendors.member-submissions" "true"
update_config "vendors.public-categories" ""  # Keep empty (members-only)

# Accessibility flags (enable high-vis for broader testing)
update_config "accessibility.high-vis-default" "false"  # Keep opt-in

# Poll notification flags (ensure enabled for pilot engagement)
update_config "polls.notify-members-enabled" "true"

echo ""
echo "Phase 2 configuration complete!"
echo "Verify member access: https://hoa.example.com/vendors"
echo "Monitor KPIs: Vendor submission rate, moderation SLA"
echo "Next: Wait 1-2 weeks, then proceed to Phase 3 via Go/No-Go review"
```

**KPI Monitoring:**
- Daily: Check vendor submission rate and moderation queue length
- Weekly: Vendor freshness, email success rate
- Reference: [KPI Dashboard](../metrics/kpi-dashboard.md#kpi-vendor-freshness)

#### Phase 3: General Availability

**Timeline:** Week 4 (after pilot review via [Go/No-Go Checklist](./go-no-go-checklist.md#phase-2-to-phase-3))

**Flag Configuration:**
```json
{
  "vendors.directory": "true",
  "vendors.member-submissions": "true",
  "vendors.public-categories": "Landscaping,Plumbing,Electrical,HVAC"
}
```

**Access:**
- Full feature availability
- Guests can view public categories
- Members can view all categories + submit vendors

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/phase3-general-availability.sh
# Configures feature flags for Phase 3 (General Availability)

set -e

echo "=== Phase 3: General Availability ==="
echo "Enabling vendor directory for all users (including guests)..."

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

# Enable full vendor directory access
update_config "vendors.directory" "true"
update_config "vendors.member-submissions" "true"
update_config "vendors.public-categories" "Landscaping,Plumbing,Electrical,HVAC,Roofing,Painting,Snow Removal"

# Accessibility flags (consider making high-vis default based on pilot KPIs)
HIGHVIS_ADOPTION=$(curl -s "$API_BASE/metrics/accessibility-adoption" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.adoption_rate')
if (( $(echo "$HIGHVIS_ADOPTION > 20" | bc -l) )); then
  echo "High-vis adoption >20%, enabling as default for new users"
  update_config "accessibility.high-vis-default" "true"
else
  echo "High-vis adoption ${HIGHVIS_ADOPTION}%, keeping opt-in"
  update_config "accessibility.high-vis-default" "false"
fi

echo ""
echo "Phase 3 configuration complete!"
echo "Verify guest access: https://hoa.example.com/vendors (logged out)"
echo "Monitor KPIs: Vendor page views, support ticket volume"
echo "Next: 30-day post-GA monitoring, then finalize feature documentation"
```

**Post-GA Monitoring:**
- Daily (Week 1): Support tickets, email delivery rate, health check pass rate
- Weekly (Weeks 2-4): Vendor submission rate, board engagement, poll participation
- Monthly: Full KPI dashboard review, operational retrospective
- Reference: [KPI Dashboard Monthly Review](../metrics/kpi-dashboard.md#dashboard-interpretation)

**Rollout Checklist:**
- [ ] Admin-only pilot completed (1 week)
- [ ] No critical bugs reported
- [ ] Member pilot feedback reviewed
- [ ] Board approval for general availability (documented in meeting minutes)
- [ ] Communication sent to all residents (email + homepage banner)
- [ ] Flags toggled to GA configuration (via `phase3-general-availability.sh`)
- [ ] Monitoring dashboards reviewed (24 hours post-toggle)
- [ ] KPI baseline vs. post-GA comparison documented
- [ ] Go/No-Go checklist signed off by operations team
- [ ] Plan anchors referenced: [iteration-5-plan](../../.codemachine/artifacts/plan/02_Iteration_I5.md#iteration-5-plan), [task-i5-t6](../../.codemachine/artifacts/plan/02_Iteration_I5.md#task-i5-t6)

---

### 4A. Democracy Module Rollout Automation

<!-- anchor: democracy-rollout-automation -->

**Scenario:** Enabling poll notifications and binding polls with phased approach

Democracy module endpoints are already live from Iteration 3, but notification enhancements and binding polls require careful rollout tied to legal review and community trust building.

#### Democracy Phase 1: Notification Testing

**Flags:**
```json
{
  "polls.enabled": "true",
  "polls.notify-members-enabled": "true",
  "polls.binding-enabled": "false",
  "polls.public-results": "false"
}
```

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/democracy-phase1-notifications.sh
# Enables poll notifications for pilot testing

set -e

echo "=== Democracy Phase 1: Notification Testing ==="

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "polls.enabled" "true"
update_config "polls.notify-members-enabled" "true"
update_config "polls.binding-enabled" "false"  # Keep disabled until legal review
update_config "polls.public-results" "false"   # Admin-only results

echo ""
echo "Democracy Phase 1 complete!"
echo "Create test poll with notify_members=true to validate email delivery"
echo "Monitor: Email success rate, poll participation KPIs"
```

#### Democracy Phase 2: Binding Polls (Post-Legal Review)

**Prerequisites:**
- Legal review of hash chain integrity complete
- Board approval for binding votes documented
- Go/No-Go checklist Phase 2 signed off

**Flags:**
```json
{
  "polls.enabled": "true",
  "polls.notify-members-enabled": "true",
  "polls.binding-enabled": "true",
  "polls.public-results": "true"
}
```

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/democracy-phase2-binding-polls.sh
# Enables binding polls after legal approval

set -e

echo "=== Democracy Phase 2: Binding Polls ==="
echo "WARNING: This enables binding votes. Ensure legal review complete."
read -p "Proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "polls.binding-enabled" "true"
update_config "polls.public-results" "true"  # Enable transparent results

# Run hash chain integrity check
echo ""
echo "Running hash chain integrity verification..."
curl -s "$API_BASE/polls/integrity-check" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'

echo ""
echo "Democracy Phase 2 complete!"
echo "Binding polls now enabled. Monitor vote receipt verification KPI."
echo "Verify hash chain integrity after first binding poll completes."
```

**KPI Monitoring:**
- Poll participation (binding vs. informal)
- Vote receipt verification rate
- Hash chain integrity check results
- Reference: [KPI Dashboard](../metrics/kpi-dashboard.md#kpi-poll-participation)

---

### 4B. Accessibility Suite Rollout Automation

<!-- anchor: accessibility-rollout-automation -->

**Scenario:** Enabling accessibility features with adoption monitoring

Accessibility flags control theme defaults and feature availability, allowing phased rollout based on community adoption metrics.

#### Accessibility Phase 1: Opt-In High-Vis Mode

**Flags:**
```json
{
  "accessibility.high-vis-default": "false",
  "accessibility.font-scaling": "true"
}
```

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/accessibility-phase1-opt-in.sh
# Enables accessibility features with opt-in high-vis mode

set -e

echo "=== Accessibility Phase 1: Opt-In High-Vis Mode ==="

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "accessibility.high-vis-default" "false"
update_config "accessibility.font-scaling" "true"

echo ""
echo "Accessibility Phase 1 complete!"
echo "Users can toggle high-vis mode via UI"
echo "Monitor: Accessibility adoption KPI (target >15%)"
```

#### Accessibility Phase 2: Default High-Vis (Based on KPIs)

**Decision Criteria:**
- Accessibility adoption rate >20% for 2 consecutive months
- Positive user feedback from pilot participants
- No accessibility regressions reported

**Automation Script:**
```bash
#!/bin/bash
# scripts/rollout/accessibility-phase2-default-highvis.sh
# Enables high-vis mode as default for new users (based on KPI thresholds)

set -e

echo "=== Accessibility Phase 2: Default High-Vis Mode ==="

ADMIN_TOKEN="${ADMIN_TOKEN:-}"
API_BASE="${API_BASE:-https://hoa.example.com/api}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: ADMIN_TOKEN environment variable not set"
  exit 1
fi

# Check adoption rate before proceeding
echo "Checking accessibility adoption rate..."
ADOPTION_RATE=$(curl -s "$API_BASE/metrics/accessibility-adoption" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.adoption_rate')

echo "Current adoption rate: ${ADOPTION_RATE}%"

if (( $(echo "$ADOPTION_RATE < 20" | bc -l) )); then
  echo "ERROR: Adoption rate below 20% threshold"
  echo "Current: ${ADOPTION_RATE}%, Required: >20%"
  echo "Continue monitoring and re-run when threshold met."
  exit 1
fi

update_config() {
  local KEY=$1
  local VALUE=$2
  echo "Setting $KEY = $VALUE..."
  curl -s -X PUT "$API_BASE/admin/config/$KEY" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"value\": \"$VALUE\"}" \
    | jq -r '.status // "ERROR"'
}

update_config "accessibility.high-vis-default" "true"

echo ""
echo "Accessibility Phase 2 complete!"
echo "New users default to high-vis mode (existing users retain preferences)"
echo "Monitor: User feedback, support ticket volume"
```

---

### 5. Emergency Kill Switch

**Use Case:** Critical bug discovered in production feature

#### Immediate Disable Procedure

1. **Identify impacted feature flag:**
   - Example: `vendors.directory` causing database deadlocks

2. **Disable flag via fastest method:**
   - **Admin UI:** Toggle to `false` (60s propagation)
   - **Database CLI:** Instant update + manual cache flush

3. **Flush cache (if using CLI method):**
   ```bash
   ssh root@<host> "cd /opt/hoa && docker compose restart app"
   ```
   **Downtime:** < 5 seconds (zero-downtime restart)

4. **Verify feature disabled:**
   ```bash
   curl -f https://<domain>/vendors
   # Expected: "Feature disabled" message or 404
   ```

5. **Notify stakeholders:**
   - Email board members and support team
   - Post announcement in admin panel
   - Update incident log

6. **Root cause analysis:**
   - Review logs: `docker compose logs app --tail 200`
   - Identify bug trigger
   - Create hotfix branch
   - Re-enable flag after fix deployed + verified

**Rollback Time:** < 2 minutes (flag toggle + cache flush)

---

## Verification & Testing

### Flag Change Verification Checklist

After toggling any flag, perform these checks:

- [ ] **Flag value updated in database**
  ```sql
  SELECT key, value, updated_at FROM Config WHERE key = '<flag-key>';
  ```

- [ ] **Audit event logged**
  ```sql
  SELECT * FROM AuditEvents WHERE action LIKE '%config%' ORDER BY created_at DESC LIMIT 1;
  ```

- [ ] **Cache invalidation confirmed**
  - Wait 60 seconds OR restart backend
  - Verify config endpoint: `curl -f https://<domain>/api/config/<flag-key>`

- [ ] **Frontend behavior matches flag state**
  - Login as member and admin
  - Navigate to impacted routes
  - Verify feature visibility/functionality

- [ ] **Accessibility not regressed**
  - Toggle high-vis mode
  - Verify theme tokens applied
  - Check screen reader announcements (if applicable)

---

## Troubleshooting

### Issue: Flag changes not taking effect

**Symptoms:** Config updated in database but feature behavior unchanged

**Diagnosis:**
1. Check cache TTL has elapsed (60 seconds since update)
2. Verify backend container running: `docker ps | grep hoa_app`
3. Check backend logs for config loading errors:
   ```bash
   docker compose logs app --tail 100 | grep -i config
   ```

**Resolution:**
- **Option A:** Wait for cache TTL (60s)
- **Option B:** Restart backend to force reload:
  ```bash
  docker compose restart app
  ```
- **Option C:** Verify `Config` table schema matches code expectations

---

### Issue: Admin UI not displaying config page

**Symptoms:** HTTP 403 or blank page at `/admin/config`

**Diagnosis:**
1. Verify user has admin role:
   ```sql
   SELECT email, role FROM Users WHERE email = '<admin-email>';
   ```
2. Check frontend route protection (JWT middleware)
3. Review browser console for JavaScript errors

**Resolution:**
- If role missing: Update user role:
  ```sql
  UPDATE Users SET role = 'admin' WHERE email = '<admin-email>';
  ```
- Clear browser cache and cookies
- Test with incognito window

---

### Issue: Flag validation errors

**Symptoms:** Config update rejected with validation error

**Common Causes:**
- **Type mismatch:** Setting boolean flag to string value
- **Invalid format:** Comma-separated list contains invalid characters
- **Missing dependencies:** Enabling flag without prerequisite configuration

**Resolution:**
1. Review flag type in catalog (Section 2)
2. Verify value format matches expected type
3. Check dependencies (e.g., `EMAIL_PROVIDER` env var for notification flags)
4. Consult error message for specific validation rule

---

## Monitoring & Observability

### Audit Log Queries

**View recent config changes:**
```sql
SELECT
  ae.action,
  ae.details,
  ae.created_at,
  u.email AS operator
FROM AuditEvents ae
JOIN Users u ON ae.user_id = u.id
WHERE ae.action LIKE '%config%'
ORDER BY ae.created_at DESC
LIMIT 20;
```

**Track specific flag history:**
```sql
SELECT
  details,
  created_at
FROM AuditEvents
WHERE details LIKE '%vendors.directory%'
ORDER BY created_at DESC;
```

### Metrics & Alerts

**Prometheus Metrics (if configured):**
- `hoa_config_changes_total`: Counter of config updates
- `hoa_feature_flag_state{flag="<key>"}`: Gauge of current flag state (1=enabled, 0=disabled)

**Alert Rules:**
- Alert if `maintenance.mode` enabled for >30 minutes
- Alert if critical flags toggled outside deployment window
- Alert if config database write errors detected

---

## Security Considerations

### Access Control

- **Principle of Least Privilege:** Only grant admin role to trusted operators
- **Audit Logging:** All flag changes permanently logged with operator identity
- **Session Management:** JWT tokens expire after `JWT_EXPIRES_IN` (default: 7 days)

### Data Integrity

- **Database Constraints:** Config keys unique, values non-null
- **Backup Before Changes:** Automated backups run daily (2 AM UTC)
- **Rollback Capability:** Config changes reversible via audit log replay

### Compliance

- **GDPR:** Feature flags do not store personal data
- **HOA Bylaws:** Board approval required for flags affecting member rights (e.g., `polls.binding-enabled`)
- **Change Control:** Document flag changes in deployment log for governance audits

---

## Best Practices

### 1. Use Descriptive Flag Names

**Good:** `vendors.moderation-queue`, `polls.notify-members-enabled`
**Bad:** `feature1`, `enableNewThing`

**Rationale:** Self-documenting flags reduce operator cognitive load

### 2. Default to Safe States

- New features default to `false` (opt-in, not opt-out)
- Critical features default to restrictive settings (e.g., `board.visibility = members-only`)

### 3. Test Flag Changes in Staging First

- If staging environment available, test flag toggles before production
- Verify cache behavior, frontend rendering, and database performance

### 4. Coordinate with Stakeholders

- Email board members before enabling member-facing features
- Schedule flag changes during low-traffic windows
- Provide 48-hour notice for major feature rollouts

### 5. Document Flag Dependencies

- Update this runbook when adding new flags
- Cross-reference environment variables and database migrations
- Include rollback instructions for complex flags

---

## Related Documentation

- **Architecture:**
  - [Section 3.4: Runtime Configuration & Secrets](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-4-runtime-configuration--secrets)
  - [Section 3.10: Operational Controls & Maintenance](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-10-operational-controls--maintenance)
- **Runbooks:**
  - [Deployment Runbook](./deployment.md)
  - [Release Checklist](./release-checklist.md)
  - [Vendor Moderation Runbook](./vendor-moderation.md)
- **Code References:**
  - Backend Config Model: `backend/src/models/config.model.js`
  - Frontend Config Hook: `frontend/src/hooks/useConfig.ts`
  - Admin Config Page: `frontend/src/pages/AdminConfigPage.tsx`

---

## Maintenance & Review

**Review Schedule:** Quarterly or after major feature releases

**Update Triggers:**
- New feature flag added to codebase
- Flag removed/deprecated
- Cache TTL configuration changed
- Admin UI redesign

**Change Process:**
1. Update flag catalog (Section 2)
2. Add operational procedures if new flag type introduced
3. Update troubleshooting section with known issues
4. Review with operations team
5. Publish updated runbook to docs repository

**Owner:** Operations Team
**Review Approvers:** Tech Lead, Product Owner

---

**End of Runbook**

For questions or runbook updates, contact Operations team or file issue with label `ops/config`.
