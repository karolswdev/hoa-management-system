# Vendor Moderation Runbook

**Version:** 1.0
**Last Updated:** 2025-11-23
**Owner:** Admin Team
**Related Architecture:** [06_UI_UX_Architecture.md](../artifacts/architecture/06_UI_UX_Architecture.md), [04_Operational_Architecture.md](../artifacts/architecture/04_Operational_Architecture.md)

## Overview

This runbook describes the vendor moderation workflow for the HOA Management System. Vendor moderation ensures that only appropriate, verified vendors are visible to community members while maintaining a transparent, auditable approval process.

## Purpose

The vendor directory allows community members to discover trusted service providers recommended by fellow residents. The moderation process:
- Ensures vendor submissions are legitimate and relevant
- Prevents spam or inappropriate listings
- Maintains quality control over visible vendors
- Provides audit trail for all moderation decisions

## Prerequisites

- Admin-level access to the HOA Management System
- Familiarity with vendor categories configured in `vendors.public-categories` flag
- Understanding of visibility scopes (public, members, admins)

## Process Overview

```
Member Submission → Pending Queue → Admin Review → Approval/Denial → Member Notification
```

## Step-by-Step Procedures

### 1. Accessing the Vendor Management Page

**Location:** `/admin/vendors`

**Steps:**
1. Log in as an admin user
2. Navigate to Admin section from the sidebar
3. Click "Vendor Management" in the admin menu
4. You will see three tabs:
   - **Pending:** Vendors awaiting review
   - **Approved:** Vendors visible to members
   - **Denied:** Vendors that have been rejected

**Expected Outcome:** Dashboard displays vendor counts and moderation queue

### 2. Reviewing Pending Vendors

**When to perform:** Daily or when pending queue exceeds 10 vendors

**Steps:**
1. Click the "Pending" tab
2. Review the pending vendors table showing:
   - Vendor name
   - Service category
   - Contact information (phone, email, website)
   - Rating (if provided)
   - Visibility scope requested
   - Submission date
3. Assess each vendor submission against criteria below

**Approval Criteria:**
- ✅ Vendor provides services relevant to HOA community (landscaping, plumbing, electrical, etc.)
- ✅ Contact information appears legitimate (valid phone/email format)
- ✅ Category matches service description
- ✅ No duplicate listings for same business
- ✅ No obvious spam or promotional content in notes field

**Denial Reasons:**
- ❌ Service category irrelevant to HOA needs
- ❌ Duplicate of existing approved vendor
- ❌ Incomplete or invalid contact information
- ❌ Suspicious or spam-like submission
- ❌ Violates community guidelines

### 3. Approving Vendors (Individual)

**Steps:**
1. Locate vendor in Pending tab
2. Click the green checkmark icon (Approve) in the Actions column
3. Confirm approval in the dialog
4. Vendor moves to Approved tab and becomes visible to members

**System Actions:**
- Moderation state changes from `pending` → `approved`
- Audit log entry created with admin name, timestamp, and vendor details
- Prometheus counter `hoa_vendor_moderations_total{action="approve"}` increments
- Vendor appears in member/guest directory based on visibility scope
- Cache invalidation triggers for vendor lists

**Expected Time:** < 5 seconds per vendor

### 4. Approving Vendors (Bulk)

**When to use:** Multiple similar vendors pending (e.g., batch submission from community event)

**Steps:**
1. In Pending tab, check boxes next to vendors to approve
2. Click "Approve (N)" button in the alert banner
3. Confirm bulk approval in the dialog
4. All selected vendors move to Approved tab

**Limits:** No hard limit, but recommend batches of ≤ 20 for performance

### 5. Denying Vendors

**Steps:**
1. Locate vendor in Pending or Approved tab
2. Click the red X icon (Deny) in the Actions column
3. Confirm denial in the dialog
4. Vendor moves to Denied tab

**System Actions:**
- Moderation state changes to `denied`
- Vendor becomes hidden from all member views
- Audit log entry created
- Prometheus counter `hoa_vendor_moderations_total{action="deny"}` increments

**Note:** Denied vendors remain in the database for audit purposes but are not visible to members. They can be re-approved if needed.

### 6. Deleting Vendors

**When to use:** Spam, duplicate, or vendor requests removal

**Steps:**
1. Locate vendor in any tab (Pending, Approved, or Denied)
2. Click the trash icon (Delete) in the Actions column
3. Confirm permanent deletion in the dialog
4. Vendor is permanently removed from database

**⚠️ WARNING:** This action is irreversible. Prefer denying over deleting to maintain audit trail.

**System Actions:**
- Vendor record deleted from database
- Audit log entry created
- Prometheus counter `hoa_vendor_deletions_total` increments

### 7. Viewing Audit Log

**Purpose:** Track all vendor-related admin actions for accountability and compliance

**Steps:**
1. Click "Show Audit Log" button on Vendor Management page
2. Review table showing:
   - Date & time of action
   - Admin who performed action
   - Action type (Created, Updated, Moderated, Deleted)
   - Vendor details and state transitions
3. Use pagination to navigate history

**Audit Events:**
- `vendor_create`: New submission (by member or admin)
- `vendor_update`: Modification to vendor details
- `vendor_moderation`: Approval/denial state change
- `vendor_delete`: Permanent removal

**Retention:** Audit logs are retained indefinitely per compliance requirements

### 8. Monitoring Metrics

**Access:** `/metrics` endpoint (admin only, Prometheus format)

**Key Metrics:**
- `hoa_vendors_pending`: Current pending queue length
- `hoa_vendors_by_state{state="approved|pending|denied"}`: Vendor counts by state
- `hoa_vendor_moderations_total{action="approve|deny|revert"}`: Moderation action counts
- `hoa_vendor_submissions_total{submitted_by_role="member|admin"}`: Submission rates

**Alerting Thresholds (recommended):**
- Pending queue > 20: Review backlog
- Pending queue > 50: Urgent attention needed
- Days since last moderation action > 7: Check for abandoned queue

### 9. Configuring Feature Flags

**Relevant Flags:**
- `vendors.directory`: Enable/disable vendor directory feature
- `vendors.public-categories`: Comma-separated list of categories visible to guests

**Updating Flags:**
1. Navigate to `/admin/config`
2. Locate vendor-related configuration keys
3. Update values and save
4. Cache invalidation occurs automatically

**Example:** To allow guests to see "Landscaping" and "Snow Removal" vendors:
```
vendors.public-categories = Landscaping, Snow Removal
```

## Troubleshooting

### Issue: Vendor not appearing after approval

**Diagnosis:**
1. Check vendor visibility scope (must be `public` or `members` for member visibility)
2. Verify moderation state is `approved` in database
3. Check category against `vendors.public-categories` for guest access
4. Clear browser cache and refresh

**Resolution:**
- Edit vendor and ensure visibility scope is appropriate
- Re-moderate (deny then approve) to trigger cache invalidation

### Issue: Bulk actions failing

**Diagnosis:**
1. Check browser console for errors
2. Verify admin JWT token is valid
3. Check backend logs for rate limiting or database errors

**Resolution:**
- Reduce batch size
- Refresh page and retry
- Check `/metrics` for error counts

### Issue: Audit log not showing recent actions

**Diagnosis:**
1. Check pagination (recent actions may be on page 1)
2. Verify audit service is recording events (check logs)
3. Filter by vendor-related actions only

**Resolution:**
- Refresh page
- Contact tech support if audit logging is failing

## Escalation Path

### Level 1: Admin Self-Service
- Routine approvals/denials
- Viewing audit logs
- Monitoring metrics

### Level 2: Tech Support
- Configuration changes (feature flags)
- Database queries for vendor verification
- Audit log investigation

### Level 3: Engineering Team
- Metrics alerting issues
- Backend service failures
- Data integrity problems

**Contact:** [Your escalation contacts here]

## Compliance & Best Practices

### Transparency
- All moderation actions are logged with admin identity
- Audit logs accessible to board members upon request
- Metrics published to demonstrate fair moderation

### Consistency
- Apply approval criteria uniformly
- Document denial reasons in notes (future enhancement)
- Review pending queue within 48 hours of submission

### Privacy
- Contact info only visible to authenticated members (or admins for all scopes)
- Guests see limited vendor data based on `vendors.public-categories`
- Never share vendor contact info externally without consent

### Performance
- Keep pending queue < 20 for optimal UX
- Bulk approve similar vendors to save time
- Monitor `hoa_vendors_pending` metric weekly

## Related Documentation

- [System Structure & Data Architecture](../artifacts/architecture/02_System_Structure_and_Data.md) - Vendor schema and visibility rules
- [UI/UX Architecture](../artifacts/architecture/06_UI_UX_Architecture.md) - Route definitions and access patterns
- [Operational Architecture](../artifacts/architecture/04_Operational_Architecture.md) - Metrics and KPIs

## Changelog

| Version | Date       | Changes                           | Author |
|---------|------------|-----------------------------------|--------|
| 1.0     | 2025-11-23 | Initial runbook creation          | System |

## Appendix: CLI Operations (Optional)

For advanced troubleshooting, admins with database access can query vendors directly:

```sql
-- Count vendors by state
SELECT moderation_state, COUNT(*) FROM Vendors GROUP BY moderation_state;

-- List pending vendors older than 7 days
SELECT id, name, service_category, created_at
FROM Vendors
WHERE moderation_state = 'pending'
AND created_at < datetime('now', '-7 days');

-- Audit log for specific vendor
SELECT * FROM AuditEvents
WHERE action LIKE 'vendor_%'
AND JSON_EXTRACT(details, '$.vendorId') = 123;
```

**⚠️ WARNING:** Direct database modifications bypass audit logging. Use admin UI whenever possible.
