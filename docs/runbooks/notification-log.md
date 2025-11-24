# Email Notification & Audit Log Runbook

## Overview

This runbook documents the email notification system, audit logging, and monitoring procedures for the HOA Management System's enhanced EmailNotificationService.

**Objective:** Provide operational guidance for poll notification emails, receipt delivery, audit trail access, and troubleshooting email delivery issues with rate limit awareness.

---

## Architecture Overview

### Components

1. **EmailNotificationService** (`backend/src/services/email.service.js`)
   - Handles poll notifications and receipt emails
   - Implements BCC batching (50 recipients per batch)
   - Provides retry logic with exponential backoff (250ms, 500ms)
   - Creates audit records in `EmailAudit` and `ResidentNotificationLog`

2. **SendGrid Provider** (`backend/src/services/providers/sendgrid.provider.js`)
   - Thin wrapper around SendGrid API
   - Supports BCC/CC batching for bulk sends
   - Accepts custom categories and correlation IDs

3. **Audit Models**
   - **EmailAudit**: Stores aggregated email send metadata
   - **ResidentNotificationLog**: Stores per-recipient notification history

---

## Email Notification Flows

### Poll Notification Flow

When a poll is created with `notify_members: true`:

1. **DemocracyService** triggers `sendPollNotificationEmail()` with:
   - Poll metadata (title, description, type, start/end times)
   - List of recipients (user IDs, emails, names)
   - Optional correlation ID

2. **EmailNotificationService** executes:
   - Creates `EmailAudit` record with status `pending`
   - Batches recipients into groups of 50
   - Sends each batch via SendGrid BCC
   - Retries failed batches with exponential backoff (max 2 retries)
   - Creates `ResidentNotificationLog` entry for each recipient
   - Updates `EmailAudit` status: `sent`, `failed`, or `partial`
   - Commits transaction

3. **Expected Outcomes**:
   - All recipients receive notification email
   - Audit trail captures send status per recipient
   - Correlation ID links email to poll creation event

### Vote Receipt Flow

When a user casts a vote and requests a receipt:

1. **DemocracyService** triggers `sendPollReceiptEmail()` with:
   - Voter details (user ID, email, name)
   - Poll title
   - Receipt code and vote hash
   - Vote timestamp
   - Optional correlation ID

2. **EmailNotificationService** executes:
   - Creates `EmailAudit` record with template `poll-receipt`
   - Sends individual email via SendGrid
   - Retries on failure (max 2 retries, 250ms/500ms backoff)
   - Creates `ResidentNotificationLog` entry
   - Updates `EmailAudit` status
   - Commits transaction

3. **Expected Outcomes**:
   - Voter receives receipt email with hash/code
   - Audit trail captures delivery status
   - Receipt persisted for verification

### Vendor Submission Alert Flow

When a member submits a vendor for moderation:

1. **VendorDirectoryService** triggers `sendVendorSubmissionAlert()` with:
   - Vendor metadata (ID, name, service category)
   - Submitter name
   - List of admin recipients
   - Optional correlation ID (e.g., `vendor-{id}-submission`)

2. **EmailNotificationService** executes:
   - Creates `EmailAudit` record with template `vendor-submission-alert`
   - Batches admin recipients into groups of 50
   - Sends each batch via SendGrid BCC
   - Retries failed batches with exponential backoff (max 2 retries)
   - Creates `ResidentNotificationLog` entry for each admin
   - Updates `EmailAudit` status: `sent`, `failed`, or `partial`
   - Commits transaction

3. **Expected Outcomes**:
   - All admin users receive vendor submission alert
   - Email includes vendor details and action required
   - Audit trail captures send status per admin
   - Correlation ID links email to vendor submission event

### Vendor Approval Broadcast Flow

When an admin approves a vendor (optional broadcast):

1. **VendorDirectoryService** triggers `sendVendorApprovalBroadcast()` with:
   - Vendor metadata (ID, name, category, contact info)
   - List of resident recipients
   - Optional correlation ID (e.g., `vendor-{id}-approval`)

2. **EmailNotificationService** executes:
   - Creates `EmailAudit` record with template `vendor-approval-broadcast`
   - Batches resident recipients into groups of 50
   - Sends each batch via SendGrid BCC
   - Retries failed batches with exponential backoff (max 2 retries)
   - Creates `ResidentNotificationLog` entry for each recipient
   - Updates `EmailAudit` status: `sent`, `failed`, or `partial`
   - Commits transaction

3. **Expected Outcomes**:
   - Residents receive notification of newly approved vendor
   - Email includes unsubscribe instructions per HOA bylaws
   - Audit trail captures send status per recipient
   - Correlation ID links email to vendor approval event

---

## Rate Limits & Throttling

### SendGrid Rate Limits

- **Free Tier**: 100 emails/day
- **Essentials Plan**: 40,000-100,000 emails/month
- **Pro Plan**: 1,500,000+ emails/month

### System Throttling Strategy

1. **Batching**: 50 recipients per BCC batch
   - Reduces API calls (100 recipients = 2 API calls vs 100)
   - Stays within SendGrid's recommended batch size

2. **Retry Backoff**: Exponential delays between retries
   - Attempt 1: Immediate
   - Attempt 2: +250ms delay
   - Attempt 3: +500ms delay
   - Max retries: 2

3. **Synchronous Execution**: No background workers
   - Poll notifications sent during poll creation request
   - Receipt emails sent during vote submission
   - Consider async queues if volume exceeds 1000 recipients/poll

### Monitoring Rate Limit Usage

```bash
# Check recent email audit counts
sqlite3 backend/database/hoa.db "
  SELECT
    DATE(sent_at) as date,
    template,
    COUNT(*) as email_count,
    SUM(recipient_count) as total_recipients
  FROM email_audits
  WHERE sent_at >= datetime('now', '-7 days')
  GROUP BY date, template
  ORDER BY date DESC;
"

# Check SendGrid API usage (if configured)
curl -X GET "https://api.sendgrid.com/v3/stats?start_date=$(date -d '7 days ago' +%Y-%m-%d)" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

---

## Audit Trail Access

### Querying Email Audits

#### List Recent Poll Notifications
```sql
SELECT
  ea.id,
  ea.template,
  ea.recipient_count,
  ea.status,
  ea.request_payload_hash as correlation_id,
  ea.sent_at,
  COUNT(rnl.id) as logged_recipients
FROM email_audits ea
LEFT JOIN resident_notification_logs rnl ON rnl.email_audit_id = ea.id
WHERE ea.template = 'poll-notify'
  AND ea.sent_at >= datetime('now', '-30 days')
GROUP BY ea.id
ORDER BY ea.sent_at DESC
LIMIT 20;
```

#### List Recent Vendor Notifications
```sql
SELECT
  ea.id,
  ea.template,
  ea.recipient_count,
  ea.status,
  ea.request_payload_hash as correlation_id,
  ea.sent_at,
  COUNT(rnl.id) as logged_recipients
FROM email_audits ea
LEFT JOIN resident_notification_logs rnl ON rnl.email_audit_id = ea.id
WHERE ea.template IN ('vendor-submission-alert', 'vendor-approval-broadcast')
  AND ea.sent_at >= datetime('now', '-30 days')
GROUP BY ea.id
ORDER BY ea.sent_at DESC
LIMIT 20;
```

#### Find Failed Email Sends
```sql
SELECT
  ea.id,
  ea.template,
  ea.recipient_count,
  ea.status,
  ea.sent_at,
  ea.request_payload_hash
FROM email_audits ea
WHERE ea.status IN ('failed', 'partial')
  AND ea.sent_at >= datetime('now', '-7 days')
ORDER BY ea.sent_at DESC;
```

#### Check Individual Recipient Delivery
```sql
SELECT
  u.name,
  u.email,
  rnl.subject,
  rnl.status,
  rnl.sent_at,
  ea.template
FROM resident_notification_logs rnl
JOIN users u ON u.id = rnl.user_id
LEFT JOIN email_audits ea ON ea.id = rnl.email_audit_id
WHERE rnl.user_id = :user_id
  AND rnl.sent_at >= datetime('now', '-90 days')
ORDER BY rnl.sent_at DESC;
```

### Correlation ID Tracking

Correlation IDs link emails to originating events:

```sql
-- Find all emails related to a poll creation
SELECT
  ea.id as audit_id,
  ea.template,
  ea.recipient_count,
  ea.status,
  ea.sent_at
FROM email_audits ea
WHERE ea.request_payload_hash = :poll_correlation_id
ORDER BY ea.sent_at DESC;

-- Find all recipients for a specific email audit
SELECT
  u.name,
  u.email,
  rnl.status,
  rnl.sent_at
FROM resident_notification_logs rnl
JOIN users u ON u.id = rnl.user_id
WHERE rnl.email_audit_id = :audit_id
ORDER BY rnl.sent_at ASC;
```

---

## Data Retention

### Retention Policies

- **EmailAudit**: Indefinite (supports compliance audits)
- **ResidentNotificationLog**: 90 days (configurable via cron cleanup)

### Cleanup Script

Create a cron job to purge old notification logs:

```bash
# /etc/cron.d/hoa-notification-cleanup
# Runs weekly on Sunday at 2 AM
0 2 * * 0 sqlite3 /path/to/backend/database/hoa.db "DELETE FROM resident_notification_logs WHERE sent_at < datetime('now', '-90 days');"
```

SQL command:
```sql
DELETE FROM resident_notification_logs
WHERE sent_at < datetime('now', '-90 days');
```

---

## Troubleshooting

### Issue: Poll Notification Not Received

**Symptoms**: Users report not receiving poll notification emails

**Diagnosis Steps**:

1. Check `EmailAudit` for the poll:
   ```sql
   SELECT * FROM email_audits
   WHERE template = 'poll-notify'
     AND sent_at >= datetime('now', '-1 day')
   ORDER BY sent_at DESC;
   ```

2. Check individual recipient logs:
   ```sql
   SELECT u.email, rnl.status, rnl.sent_at
   FROM resident_notification_logs rnl
   JOIN users u ON u.id = rnl.user_id
   WHERE rnl.email_audit_id = :audit_id;
   ```

3. Review application logs:
   ```bash
   grep "Poll notification email" backend/logs/combined-*.log | tail -50
   ```

**Common Causes**:
- SendGrid API key not configured → emails logged instead of sent
- Recipient email bounced → check SendGrid dashboard
- Rate limit exceeded → implement queuing for large batches
- SMTP/DNS issues → verify SendGrid status page

**Resolution**:
- Re-send notification via admin panel (if implemented)
- Manually notify affected users
- Adjust batching/throttling if rate limited

---

### Issue: Vote Receipt Email Failed

**Symptoms**: User cast vote but did not receive receipt

**Diagnosis Steps**:

1. Find receipt email audit:
   ```sql
   SELECT * FROM email_audits
   WHERE template = 'poll-receipt'
     AND sent_at >= datetime('now', '-1 hour')
   ORDER BY sent_at DESC;
   ```

2. Check recipient log:
   ```sql
   SELECT rnl.*, u.email
   FROM resident_notification_logs rnl
   JOIN users u ON u.id = rnl.user_id
   WHERE rnl.email_audit_id = :audit_id;
   ```

3. Check retry logs:
   ```bash
   grep "Poll receipt email" backend/logs/combined-*.log | grep -E "(failed|retry)"
   ```

**Resolution**:
- User can retrieve receipt from portal using receipt code
- Admin can manually re-send via API if needed

---

### Issue: Vendor Submission Alert Not Received

**Symptoms**: Admins report not receiving vendor submission alerts

**Diagnosis Steps**:

1. Check `EmailAudit` for vendor submission alerts:
   ```sql
   SELECT * FROM email_audits
   WHERE template = 'vendor-submission-alert'
     AND sent_at >= datetime('now', '-1 day')
   ORDER BY sent_at DESC;
   ```

2. Check individual admin logs:
   ```sql
   SELECT u.email, u.role, rnl.status, rnl.sent_at
   FROM resident_notification_logs rnl
   JOIN users u ON u.id = rnl.user_id
   WHERE rnl.email_audit_id = :audit_id;
   ```

3. Review application logs:
   ```bash
   grep "Vendor submission alert" backend/logs/combined-*.log | tail -50
   ```

**Common Causes**:
- No admin users configured in system
- Admin email addresses invalid or bounced
- SendGrid API issues
- Vendor submission code path not triggering notification

**Resolution**:
- Verify admin users exist: `SELECT * FROM users WHERE role = 'admin';`
- Manually notify admins of pending submissions
- Check vendor submission workflow in code

---

### Issue: Vendor Approval Broadcast Not Sent

**Symptoms**: Residents did not receive vendor approval notification

**Diagnosis Steps**:

1. Check if broadcast was triggered:
   ```sql
   SELECT * FROM email_audits
   WHERE template = 'vendor-approval-broadcast'
     AND sent_at >= datetime('now', '-1 day')
   ORDER BY sent_at DESC;
   ```

2. Review vendor approval workflow:
   ```bash
   grep "Vendor approval broadcast" backend/logs/combined-*.log
   ```

**Common Causes**:
- Broadcast feature disabled or not implemented in approval workflow
- No resident recipients configured for broadcast
- Feature flag disabled for vendor notifications

**Resolution**:
- Verify broadcast is enabled in vendor approval code path
- Check if resident notification list is configured
- Review feature flag settings

---

### Issue: High Email Failure Rate

**Symptoms**: Many emails in `partial` or `failed` status

**Diagnosis**:

1. Check failure rate:
   ```sql
   SELECT
     status,
     COUNT(*) as count,
     SUM(recipient_count) as total_recipients
   FROM email_audits
   WHERE sent_at >= datetime('now', '-7 days')
   GROUP BY status;
   ```

2. Review error logs:
   ```bash
   grep -E "(Email send failed|SendGrid)" backend/logs/error-*.log
   ```

**Common Causes**:
- SendGrid API quota exceeded
- Invalid API key
- Recipient email invalid/bounced
- Network connectivity issues

**Resolution**:
- Verify SendGrid account status and quota
- Check API key validity: `curl -H "Authorization: Bearer $SENDGRID_API_KEY" https://api.sendgrid.com/v3/user/account`
- Review SendGrid activity dashboard for bounces/blocks
- Implement email validation before adding users

---

## Testing Notification System

### Manual Testing

1. **Log-Only Mode** (no SendGrid):
   ```bash
   unset SENDGRID_API_KEY
   # Emails will be logged to console instead of sent
   ```

2. **Test Poll Notification**:
   ```bash
   curl -X POST http://localhost:3000/api/polls \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Poll",
       "description": "Testing notification system",
       "type": "informal",
       "notify_members": true,
       "start_at": "2025-01-20T00:00:00Z",
       "end_at": "2025-01-27T23:59:59Z",
       "options": ["Option A", "Option B"]
     }'
   ```

3. **Verify Audit Records**:
   ```sql
   SELECT * FROM email_audits ORDER BY sent_at DESC LIMIT 1;
   SELECT * FROM resident_notification_logs ORDER BY sent_at DESC LIMIT 10;
   ```

### Automated Testing

Run unit tests:
```bash
cd backend
npm test -- test/services/email.service.test.js
```

Test coverage:
```bash
npm test -- --coverage test/services/email.service.test.js
```

---

## Performance Considerations

### Current Limitations

- **Synchronous Execution**: Email sending blocks API response
  - Poll creation with 100 recipients → ~4-5 seconds response time
  - Vote casting with receipt → ~1-2 seconds response time

- **No Queue System**: All emails sent immediately
  - Risk of timeout for large recipient lists (>500)
  - No retry mechanism beyond immediate retries

### Scaling Recommendations

1. **Implement Background Queue** (e.g., Bull, BullMQ):
   ```javascript
   // Queue poll notification
   await emailQueue.add('poll-notification', {
     pollId: poll.id,
     recipients: memberList
   });
   ```

2. **Add Rate Limiting Middleware**:
   ```javascript
   // Limit poll creation to 10/hour for non-admins
   app.use('/api/polls', rateLimit({
     windowMs: 60 * 60 * 1000,
     max: 10
   }));
   ```

3. **Monitor SendGrid Webhooks**:
   - Track bounces, spam reports, unsubscribes
   - Automatically update user email preferences
   - Clean invalid emails from recipient lists

---

## Configuration Reference

### Environment Variables

```bash
# Email Provider (log|sendgrid)
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@hoamanagement.example.com
EMAIL_FROM_NAME="HOA Community Hub"

# Optional: Custom batch size (default: 50)
EMAIL_BATCH_SIZE=50

# Optional: Retry configuration (default: 250,500)
EMAIL_RETRY_DELAYS=250,500
```

### Service Constants

Defined in `backend/src/services/email.service.js`:

```javascript
const BATCH_SIZE = 50; // Recipients per BCC batch
const RETRY_DELAYS = [250, 500]; // Milliseconds between retries
const MAX_RETRIES = 2; // Maximum retry attempts
```

---

## Support & Escalation

### Log Locations

- **Combined Logs**: `backend/logs/combined-YYYY-MM-DD.log`
- **Error Logs**: `backend/logs/error-YYYY-MM-DD.log`
- **HTTP Logs**: `backend/logs/http-YYYY-MM-DD.log`

### Key Log Patterns

```bash
# Successful sends
grep "Email sent successfully" backend/logs/combined-*.log

# Retry attempts
grep "Email send failed, retrying" backend/logs/combined-*.log

# Final failures
grep "Email send failed after all retries" backend/logs/error-*.log

# Notification completion
grep "Poll notification email completed" backend/logs/combined-*.log
```

### SendGrid Dashboard

Monitor delivery stats:
- **URL**: https://app.sendgrid.com/
- **Key Metrics**: Delivered, Bounced, Spam Reports, Unsubscribes
- **Activity Feed**: Real-time email status updates

### Contact Escalation

1. **Level 1**: Check audit logs and application logs
2. **Level 2**: Verify SendGrid account status and quotas
3. **Level 3**: Review SendGrid activity feed for specific emails
4. **Level 4**: Contact SendGrid support if API issues persist

---

## Appendix

### Email Templates

#### Poll Notification Template
- **Subject**: `New Poll: {pollTitle}`
- **Template ID**: `poll-notify`
- **Fields**: Poll title, description, type, voting period
- **Recipients**: All members

#### Vote Receipt Template
- **Subject**: `Vote Receipt: {pollTitle}`
- **Template ID**: `poll-receipt`
- **Fields**: Receipt code, vote hash, timestamp, voter name
- **Recipients**: Individual voter

#### Vendor Submission Alert Template
- **Subject**: `New Vendor Submission Requires Review`
- **Template ID**: `vendor-submission-alert`
- **Fields**: Vendor name, service category, submitter name
- **Recipients**: Admin users
- **Compliance**: Includes contact information per HOA governance procedures

#### Vendor Approval Broadcast Template
- **Subject**: `New Vendor Approved: {vendorName}`
- **Template ID**: `vendor-approval-broadcast`
- **Fields**: Vendor name, service category, contact info
- **Recipients**: Member residents (optional broadcast)
- **Compliance**: Includes unsubscribe instructions referencing HOA bylaws Section 4.7

### Database Schema References

#### EmailAudit Table
```sql
CREATE TABLE email_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template VARCHAR(255) NOT NULL,
  recipient_count INTEGER NOT NULL,
  request_payload_hash VARCHAR(255),
  sent_at DATETIME NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### ResidentNotificationLog Table
```sql
CREATE TABLE resident_notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_audit_id INTEGER,
  subject VARCHAR(255) NOT NULL,
  sent_at DATETIME NOT NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (email_audit_id) REFERENCES email_audits(id)
);
```

---

**Document Version**: 1.1
**Last Updated**: 2025-01-23
**Maintained By**: Backend Team
**Review Cycle**: Quarterly

**Changelog**:
- **v1.1** (2025-01-23): Added vendor notification flows (submission alerts + approval broadcasts) with audit queries, troubleshooting steps, and template documentation
- **v1.0** (2025-01-15): Initial version with poll notifications and receipt flows
