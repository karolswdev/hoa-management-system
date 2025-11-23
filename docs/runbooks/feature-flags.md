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

**Scenario:** Deploying new feature with staged rollout plan

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

#### Phase 2: Member Pilot

**Timeline:** Week 2 (after admin approval)

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

#### Phase 3: General Availability

**Timeline:** Week 4 (after pilot review)

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

**Rollout Checklist:**
- [ ] Admin-only pilot completed (1 week)
- [ ] No critical bugs reported
- [ ] Member pilot feedback reviewed
- [ ] Board approval for general availability
- [ ] Communication sent to all residents
- [ ] Flags toggled to GA configuration
- [ ] Monitoring dashboards reviewed (24 hours post-toggle)

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
