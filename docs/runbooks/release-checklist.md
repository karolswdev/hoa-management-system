# Release Checklist - HOA Management System

**Version:** 1.0
**Last Updated:** 2025-11-23
**Owner:** Operations Team
**Related Documentation:** [QA Test Report](../testing/vendor-suite-report.md), [Vendor Moderation Runbook](vendor-moderation.md), [Notification Log Runbook](notification-log.md)

---

## Overview

This checklist ensures safe, repeatable deployments of the HOA Management System to production. Follow all steps sequentially to minimize downtime and ensure feature quality.

**Deployment Model:** Single-container rolling deployment on Linode Nanode with SQLite database and bind-mounted volumes.

**Estimated Duration:** 45-60 minutes (including verification steps)

---

## Pre-Release Checklist

### 1. Code & Artifact Preparation

- [ ] **All CI Checks Passing**
  - Verify latest commit on `main` branch shows all green checks
  - Confirm jobs: `backend`, `frontend`, `hygiene` passed
  - Review workflow run: https://github.com/[org]/hoa-management-system/actions
  - **Verification:** `git log -1 --oneline` matches latest CI run commit

- [ ] **QA Report Approved**
  - Read QA test report: `docs/testing/vendor-suite-report.md`
  - Confirm: "Status: ✅ PASSED" and "Recommendation: APPROVE"
  - Verify test coverage meets targets (Backend >80%, Frontend >75%)
  - Check defect count: 0 critical, 0 major
  - **Sign-off:** Tech Lead approval documented in QA report

- [ ] **Changelog Updated**
  - Review `CHANGELOG.md` for `[Unreleased]` section
  - Confirm new features documented under appropriate modules (Vendor Directory, Democracy)
  - Verify version number incremented (e.g., `1.1.0` for minor release)
  - Include rollout instructions and migration notes
  - **Verification:** `git diff HEAD~5 CHANGELOG.md` shows recent updates

- [ ] **Plan Manifest Validated**
  - Run JSON schema validation: `npx ajv-cli validate -s .codemachine/artifacts/plan_manifest_schema.json -d .codemachine/artifacts/plan_manifest.json`
  - Confirm iteration I4 tasks marked `"done": true`
  - Verify anchor paths align with markdown files
  - **Expected Output:** `valid`

- [ ] **Database Migrations Reviewed**
  - List pending migrations: `cd backend && NODE_ENV=production npx sequelize-cli db:migrate:status`
  - Review SQL in new migration files for correctness (no DROP TABLE without backup)
  - Verify rollback scripts exist for all new migrations
  - **Expected Migrations:** Vendors table, EmailAudit, ResidentNotificationLog, indexes

- [ ] **Dependency Audit Clean**
  - Run `cd backend && npm audit --production`
  - Run `cd frontend && npm audit --production`
  - Confirm: 0 critical vulnerabilities, 0 high vulnerabilities
  - Document any moderate/low vulnerabilities as accepted risk or plan remediation
  - **Verification:** Exit code 0, no audit warnings

- [ ] **Environment Variables Documented**
  - Review `.env.example` files in backend + frontend
  - Confirm all production-required vars documented
  - Check for new vars added in I4 (vendor flags, notification settings)
  - **New Vars to Configure:**
    - `EMAIL_FROM` (production sender)
    - `SENDGRID_API_KEY` (production key, not sandbox)
    - `vendors.directory` flag default
    - `vendors.public-categories` value

### 2. Infrastructure & Deployment Preparation

- [ ] **Backup Current Production Database**
  - SSH into Linode host: `ssh root@[production-ip]`
  - Run backup script: `cd /opt/hoa && ./scripts/backup.sh`
  - Verify backup created: `ls -lh /root/hoa-backups/ | tail -1`
  - Record backup filename: `hoa-backup-YYYYMMDD-HHMMSS.tar.gz`
  - **Expected Size:** 50-200 MB (compressed)

- [ ] **Backup Verification**
  - Extract backup to temp location: `tar -tzf /root/hoa-backups/hoa-backup-*.tar.gz | head -20`
  - Confirm `database/hoa.db` present in archive
  - Verify backup includes uploads, logs, and code snapshot
  - **Critical:** Do not proceed if backup fails

- [ ] **Docker Image Built & Tagged**
  - Verify GHCR image exists: `docker pull ghcr.io/[org]/hoa-management-system:latest`
  - Check image build date: `docker inspect ghcr.io/[org]/hoa-management-system:latest | grep Created`
  - Confirm image matches latest commit SHA
  - Tag release: `docker tag ghcr.io/[org]/hoa-management-system:latest ghcr.io/[org]/hoa-management-system:v1.1.0`
  - **Verification:** Image size ~500-800 MB

- [ ] **Feature Flag Configuration Reviewed**
  - Review recommended defaults from QA report (Section 10.1)
  - Document flags to toggle during deployment
  - Plan: Start with safe defaults (vendors.directory=false), enable after verification
  - **Flags to Configure:**
    ```json
    {
      "vendors.directory": "false",
      "vendors.public-categories": "Landscaping,Plumbing,Electrical,HVAC",
      "polls.binding-enabled": "false",
      "polls.notify-members-enabled": "true",
      "board.visibility": "members-only"
    }
    ```

- [ ] **Deployment Window Scheduled**
  - Confirm deployment during low-traffic window (e.g., Sunday 2:00 AM - 4:00 AM)
  - Notify stakeholders: board members, admin users, support team
  - Schedule Go/No-Go meeting 1 hour before deployment
  - **Communication:** Email + announcement banner on site 48 hours prior

- [ ] **Rollback Plan Documented**
  - Document steps to revert to previous version (see Section 5 below)
  - Test rollback procedure on staging environment
  - Identify rollback decision criteria (e.g., >10% error rate, critical feature broken)
  - **Rollback Owner:** [Name] has authority to initiate rollback

---

## Deployment Checklist

### 3. Pre-Deployment Verification

- [ ] **Go/No-Go Meeting Held**
  - Attendees: Tech Lead, Product Owner, Operations, QA
  - Review: QA report, backup status, known issues, support readiness
  - Decision: Proceed / Abort / Delay
  - **Sign-off:** Meeting notes captured in `ops/deploy-log.md`

- [ ] **System Health Check (Pre-Deployment)**
  - Check current health: `curl -f https://hoa.example.com/api/health`
  - Check metrics: `curl -f https://hoa.example.com/api/metrics | grep hoa_http_requests_total`
  - Review logs for errors: `ssh root@[ip] 'docker compose logs app --tail 100 | grep ERROR'`
  - **Expected:** HTTP 200, no recent errors, normal request volume

- [ ] **Support Team Notified**
  - Alert support team deployment is starting
  - Provide deployment ETA and expected downtime (< 5 minutes)
  - Share link to this checklist and rollback procedure
  - **Contact:** Support Slack channel + email

### 4. Deployment Execution

**Deployment Start Time:** __________ (record actual time)

- [ ] **SSH into Production Host**
  - Connect: `ssh root@[production-ip]`
  - Navigate to app directory: `cd /opt/hoa`
  - Confirm user: `whoami` (should be `root`)

- [ ] **Stop Application (Optional - for zero-downtime skip this)**
  - Stop container: `docker compose down app`
  - Verify stopped: `docker compose ps` (app should be absent)
  - **Note:** Skip if using rolling restart with health checks

- [ ] **Pull New Docker Image**
  - Authenticate to GHCR: `docker login ghcr.io -u [github-user] -p [PAT]`
  - Pull latest: `docker compose pull app`
  - Verify new image: `docker images | grep hoa-management-system | head -1`
  - **Expected:** New image ID matches GHCR latest

- [ ] **Run Database Migrations**
  - Run migrations: `docker compose run --rm app npm run db:migrate --prefix backend`
  - Review migration output for errors
  - Verify migrations applied: `docker compose run --rm app npx sequelize-cli db:migrate:status --prefix backend`
  - **Expected Output:** All migrations show `up` status
  - **Critical:** If migration fails, restore backup and abort deployment

- [ ] **Start Application Container**
  - Start container: `docker compose up -d app`
  - Wait for startup: `sleep 10`
  - Check logs: `docker compose logs app --tail 50`
  - **Expected:** No ERROR logs, "Server listening on port 3000" message

- [ ] **Health Check (Post-Deployment)**
  - Check health endpoint: `curl -f http://localhost:3000/api/health`
  - Expected: `{"status":"ok","timestamp":"..."}`
  - Check external access: `curl -f https://hoa.example.com/api/health`
  - **Expected:** HTTP 200 response within 5 seconds

- [ ] **Metrics Endpoint Validation**
  - Check metrics: `curl -f http://localhost:3000/api/metrics | grep hoa_http_requests_total`
  - Verify Prometheus counters present
  - **Expected:** Metrics endpoint returns data (no 500 errors)

- [ ] **Database Integrity Check**
  - Run SQLite integrity check: `sqlite3 /var/lib/hoa/database/hoa.db 'PRAGMA integrity_check;'`
  - **Expected:** `ok`
  - If errors, restore backup immediately

**Deployment End Time:** __________ (record actual time)

---

## Post-Deployment Checklist

### 5. Functional Verification

**Perform these checks as both guest and authenticated member:**

- [ ] **Homepage Loads**
  - Visit: `https://hoa.example.com`
  - Verify: No errors, navigation menu visible
  - **Expected:** Page loads in <3 seconds

- [ ] **Authentication Works**
  - Login as test member: `test-member@example.com`
  - Verify: Dashboard loads, JWT token issued
  - Logout and verify redirect to login
  - **Expected:** No 401/403 errors

- [ ] **Vendor Directory (If Enabled)**
  - Navigate to `/vendors`
  - Verify: Vendor list displays (or "Feature disabled" if flag off)
  - Test filter by category: Select "Plumbing"
  - **Expected:** Results update, no JavaScript errors

- [ ] **Poll Notifications (Smoke Test)**
  - Admin creates test poll with `notify_members=false` (no email spam)
  - Verify: Poll appears in `/polls` list
  - Member casts vote, verifies receipt code displayed
  - **Expected:** Vote accepted, receipt code returned

- [ ] **Accessibility Toggle**
  - Click accessibility toggle in navbar
  - Verify: Theme switches to high-vis, font size increases
  - Refresh page, verify preference persists
  - **Expected:** LocalStorage contains `accessibilityPreferences` key

- [ ] **Admin Panel Access**
  - Login as admin: `admin@example.com`
  - Navigate to `/admin/vendors` (or other admin route)
  - Verify: Admin UI loads, no authorization errors
  - **Expected:** Admin sees vendor moderation queue

- [ ] **Email Notification Test (Optional)**
  - Admin creates test poll with `notify_members=true` and single test recipient
  - Verify: Email audit created in database
  - Check test recipient inbox for poll notification
  - **Expected:** Email delivered within 30 seconds

### 6. Monitoring & Observability

- [ ] **Prometheus Metrics Collecting**
  - Check `/metrics` endpoint: `curl http://localhost:3000/api/metrics`
  - Verify counters incrementing: `hoa_http_requests_total`, `hoa_vendors_by_state`
  - **Expected:** Metrics update after requests

- [ ] **Grafana Dashboard (If Configured)**
  - Access: `http://[linode-ip]:3002`
  - Login: admin / [password]
  - Verify: Dashboard shows live data, no gaps
  - **Expected:** Request rate, response times visible

- [ ] **Log Files Rotating**
  - Check logs directory: `ls -lh /opt/hoa/backend/logs/`
  - Verify: Current day log files present (combined, error, http)
  - Check rotation: Files older than 14 days deleted
  - **Expected:** Log files <100 MB each

- [ ] **Audit Log Validation**
  - Query recent audit events: `sqlite3 /var/lib/hoa/database/hoa.db "SELECT * FROM AuditEvents ORDER BY created_at DESC LIMIT 10;"`
  - Verify: Deployment-related events logged (e.g., config changes)
  - **Expected:** Audit log contains recent entries

### 7. Feature Flag Configuration

- [ ] **Set Feature Flags to Pilot Defaults**
  - Navigate to: `https://hoa.example.com/admin/config` (admin login required)
  - Set flags per QA recommendations:
    - `vendors.directory = false` (enable after pilot approval)
    - `vendors.public-categories = Landscaping,Plumbing,Electrical,HVAC`
    - `polls.binding-enabled = false`
    - `polls.notify-members-enabled = true`
    - `board.visibility = members-only`
  - Save changes, verify cache invalidation
  - **Expected:** Flags update within 60 seconds (cache TTL)

- [ ] **Test Flag Behavior**
  - Logout, visit `/vendors` as guest
  - Verify: "Feature disabled" message (since `vendors.directory=false`)
  - Admin toggles flag to `true`, waits 60s
  - Guest refreshes page, sees vendor directory
  - **Expected:** Flag changes take effect after cache TTL

### 8. Stakeholder Communication

- [ ] **Deployment Complete Notification**
  - Email stakeholders: "Deployment complete, system operational"
  - Include: Version number, new features summary, known issues
  - Provide: Link to CHANGELOG.md, user guides
  - **Recipients:** Board members, admin users, support team

- [ ] **Update System Banner (If Applicable)**
  - Admin creates announcement: "New features available: Vendor Directory, Poll Notifications"
  - Set announcement priority: Normal
  - **Expected:** Banner visible on homepage

- [ ] **Document Deployment in Log**
  - Update `ops/deploy-log.md` with:
    - Date/time of deployment
    - Version deployed (e.g., v1.1.0)
    - Operator name
    - Issues encountered (if any)
    - Verification steps completed
  - **Verification:** Log entry created

### 9. Post-Deployment Monitoring (24 Hours)

- [ ] **Monitor Error Rate**
  - Check Grafana dashboard hourly for first 6 hours
  - Alert threshold: >5% error rate triggers investigation
  - **Expected:** Error rate <1% (normal baseline)

- [ ] **Review Support Tickets**
  - Check support channel for user-reported issues
  - Triage any bugs related to new features
  - **Expected:** <3 support tickets in first 24 hours

- [ ] **Validate Email Deliverability**
  - Check SendGrid dashboard: https://app.sendgrid.com/
  - Verify: Delivered rate >98%, bounce rate <2%
  - Review: Any spam reports or unsubscribes
  - **Expected:** Normal delivery rates

- [ ] **Database Growth Monitoring**
  - Check database size: `du -h /var/lib/hoa/database/hoa.db`
  - Compare to pre-deployment backup size
  - **Expected:** <10% growth from new tables

- [ ] **Performance Regression Check**
  - Run Lighthouse audit on `/vendors` and `/polls` pages
  - Compare scores to pre-deployment baseline (from QA report)
  - Alert if Performance score drops >10 points
  - **Expected:** Performance scores ≥88

---

## Rollback Procedure

**Use this procedure if critical issues detected post-deployment.**

### Rollback Decision Criteria

Initiate rollback immediately if:
- Database migrations fail or corrupt data
- Error rate exceeds 10% for >5 minutes
- Critical feature completely broken (e.g., login fails)
- Security vulnerability discovered in new code

### Rollback Steps

1. **Stop Current Application**
   ```bash
   ssh root@[production-ip]
   cd /opt/hoa
   docker compose down app
   ```

2. **Restore Database Backup**
   ```bash
   cd /root/hoa-backups
   tar -xzf hoa-backup-YYYYMMDD-HHMMSS.tar.gz -C /tmp/restore
   sqlite3 /var/lib/hoa/database/hoa.db ".restore /tmp/restore/database/hoa.db"
   sqlite3 /var/lib/hoa/database/hoa.db "PRAGMA integrity_check;"
   # Expected: ok
   ```

3. **Rollback Database Migrations (If Needed)**
   ```bash
   docker compose run --rm app npx sequelize-cli db:migrate:undo --prefix backend
   # Repeat for each new migration
   ```

4. **Revert to Previous Docker Image**
   ```bash
   docker pull ghcr.io/[org]/hoa-management-system:v1.0.0
   docker tag ghcr.io/[org]/hoa-management-system:v1.0.0 ghcr.io/[org]/hoa-management-system:latest
   ```

5. **Start Application**
   ```bash
   docker compose up -d app
   docker compose logs app --tail 50
   ```

6. **Verify Health**
   ```bash
   curl -f http://localhost:3000/api/health
   curl -f https://hoa.example.com/api/health
   ```

7. **Notify Stakeholders**
   - Email: "Rollback completed, system restored to v1.0.0"
   - Document rollback reason in `ops/deploy-log.md`
   - Schedule post-mortem meeting

**Rollback Duration:** ~15-20 minutes

---

## Vendor Directory Specific Verifications

**Additional checks for vendor module deployment:**

- [ ] **Vendor Table Seeded (Optional)**
  - If pre-populating vendors, run seed script: `npm run db:seed:vendors`
  - Verify seed data: `sqlite3 hoa.db "SELECT COUNT(*) FROM Vendors;"`
  - **Expected:** Count matches seed file entries

- [ ] **Vendor Moderation Queue Empty**
  - Admin navigates to `/admin/vendors`
  - Verify: Pending tab shows 0 vendors (or expected seed count)
  - **Expected:** No unintended pending vendors

- [ ] **Public Categories Configuration**
  - Verify `vendors.public-categories` flag matches board-approved categories
  - Test guest access: Logout, visit `/vendors`, confirm only public categories visible
  - **Expected:** Guest sees 4 categories (Landscaping, Plumbing, Electrical, HVAC)

- [ ] **Vendor Submission Alert Tested**
  - Submit test vendor as member
  - Verify: Admin receives email alert within 30 seconds
  - Check `EmailAudit` table: `SELECT * FROM email_audits WHERE template='vendor-submission-alert' ORDER BY sent_at DESC LIMIT 1;`
  - **Expected:** Email audit record present, status=sent

- [ ] **Vendor Approval Broadcast (If Enabled)**
  - Admin approves test vendor with "Broadcast to members" checked
  - Verify: Members receive email (use test distribution list)
  - Check email content: Includes vendor name, category, contact info, unsubscribe link
  - **Expected:** Broadcast email compliant with HOA bylaws Section 4.7

---

## Democracy Module Specific Verifications

**Additional checks for poll notification deployment:**

- [ ] **Poll Notification Flag Enabled**
  - Verify `polls.notify-members-enabled=true` in Config table
  - **Expected:** Flag value cached with 60s TTL

- [ ] **Poll Notification Email Template Validated**
  - Review SendGrid template for `poll-notify`
  - Confirm: Subject line, poll details, voting link, unsubscribe footer
  - **Expected:** Template approved by board communications

- [ ] **Batch Size Validation**
  - Create test poll with 100+ member recipients
  - Check logs for batching: `grep "Email sent successfully" backend/logs/combined-*.log | tail -10`
  - Verify: Recipients batched into groups of 50
  - **Expected:** 2+ batch API calls to SendGrid

- [ ] **Vote Receipt Email Tested**
  - Cast vote on test poll
  - Verify: Receipt email received with code and hash
  - Verify: Receipt code format (16+ alphanumeric characters)
  - **Expected:** Email delivery <10 seconds

- [ ] **Email Audit Retention Validated**
  - Confirm cron job configured for notification log cleanup
  - Check crontab: `crontab -l | grep notification-cleanup`
  - **Expected:** Weekly cron job to purge logs >90 days old

---

## Accessibility Specific Verifications

**Additional checks for accessibility features:**

- [ ] **Accessibility Toggle Present**
  - Verify toggle button in navbar (Visibility icon)
  - Click toggle, verify theme switches
  - **Expected:** High-vis mode activates, font size increases

- [ ] **Theme Persistence Tested**
  - Enable high-vis mode, refresh page
  - Verify: Preference persists via localStorage
  - Open new tab, verify: High-vis mode active in new tab
  - **Expected:** Shared state across tabs

- [ ] **Touch Target Sizes Validated (Mobile)**
  - Open site on mobile device (or Chrome DevTools mobile emulation)
  - Verify: All buttons meet 44px minimum (52px in high-vis)
  - **Expected:** No touch target warnings in Lighthouse audit

- [ ] **Screen Reader Compatibility (Manual)**
  - Test with screen reader (NVDA, VoiceOver, or TalkBack)
  - Navigate vendor directory and poll list
  - Verify: ARIA labels announced, focus order logical
  - **Expected:** All interactive elements accessible

---

## Sign-Off

**Deployment Completed By:** ______________________________ (Name, Date, Time)

**Go/No-Go Decision:** ☐ GO ☐ NO-GO ☐ ROLLBACK

**Tech Lead Approval:** ______________________________ (Signature)

**Product Owner Approval:** ______________________________ (Signature)

**Board Liaison Approval (Vendor Module):** ______________________________ (Signature)

**Post-Deployment Status:**
- ☐ All checks passed, system operational
- ☐ Minor issues detected, documented in `ops/issues-log.md`
- ☐ Rollback initiated, system restored to previous version

**Next Steps:**
- [ ] Schedule pilot program kick-off (Vendor Directory)
- [ ] Begin Phase 1: Admin-only pilot (Week 1)
- [ ] Collect feedback and iterate for Phase 2: Member pilot (Week 2)
- [ ] Monitor KPIs for 30 days before General Availability

---

## Related Documentation

- [QA Test Report](../testing/vendor-suite-report.md)
- [Vendor Moderation Runbook](vendor-moderation.md)
- [Notification Log Runbook](notification-log.md)
- [CHANGELOG.md](../../CHANGELOG.md)
- [Deployment Strategy](../artifacts/architecture/04_Operational_Architecture.md#3-9-2-deployment-strategy)
- [Backup & Restore Guide](../BACKUP_AND_RESTORE.md)
- [Incident Response Runbook](../INCIDENT_RESPONSE.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Maintained By:** Operations Team
**Review Cycle:** After each major release
