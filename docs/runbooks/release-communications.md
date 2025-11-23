# Release Communications Runbook

<!-- anchor: release-communications-runbook -->

**Owner:** Product & Operations Teams
**Last Updated:** 2025-11-23
**Related:** [Release Checklist](./release-checklist.md), [Deployment Runbook](./deployment.md), [Architecture Section 3.12](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-12-documentation--knowledge-transfer)

---

## Overview

This runbook defines communication templates, timelines, and procedures for HOA Management System releases. Effective stakeholder communication ensures smooth feature adoption, manages expectations, and maintains trust with the volunteer HOA board and resident community.

**Communication Channels:**
- **Email:** Primary channel for board members and admin users
- **System Announcements:** In-app banner for logged-in members
- **Board Meeting Presentations:** Quarterly release reviews
- **Documentation:** README, CHANGELOG, and runbooks

**Stakeholder Groups:**
- **Board Members:** Policy decisions, budget approvals, strategic direction
- **Admin Users:** Day-to-day system operators, feature pilots
- **Members (Residents):** End users of member-facing features
- **Support Team:** Handles user questions and bug reports
- **Technical Team:** Developers and operations staff

---

## Communication Timeline

### Pre-Release Phase (T-7 days)

**Purpose:** Set expectations, prepare stakeholders, collect feedback

#### T-7 Days: Board Notification Email

**Audience:** Board members
**Sender:** Product Owner or Tech Lead
**Subject:** `[HOA System] Upcoming Release: <Feature Name> - <Release Date>`

**Template:**

```
Dear Board Members,

We're preparing to release new features for the HOA Management System on <Release Date>. This email provides an overview of what's changing and how it impacts our community.

## Release Summary
- **Version:** <Version Number> (e.g., v1.5.0)
- **Deployment Window:** <Day, Date, Time> (e.g., Sunday, Nov 26, 2025, 2:00 AM - 4:00 AM EST)
- **Expected Downtime:** <5 minutes
- **Major Features:** <Brief bullet list>

## New Features

### 1. <Feature Name> (e.g., Vendor Directory)
**Description:** <1-2 sentence summary>

**Why This Matters:** <Business value, community benefit>

**Rollout Plan:**
- **Week 1 (Admin-Only Pilot):** Board and admin users test feature, provide feedback
- **Week 2 (Member Pilot):** Selected members gain access, usage monitored
- **Week 4 (General Availability):** All residents can use feature (pending board approval)

**Policy Considerations:** <Any governance, privacy, or bylaw impacts>

### 2. <Additional Features>
...

## Testing & Quality Assurance
- **Backend Test Coverage:** <Percentage>% (Target: 80%)
- **Frontend Test Coverage:** <Percentage>% (Target: 75%)
- **Accessibility Compliance:** WCAG 2.1 AA validated
- **Security Audit:** No critical vulnerabilities detected

## What You Can Do
1. **Review Release Notes:** <Link to detailed CHANGELOG>
2. **Attend Pre-Release Demo (Optional):** <Date, Time, Video Conference Link>
3. **Provide Feedback:** Reply to this email or contact <Product Owner Email>
4. **Participate in Pilot:** Admin users will receive access credentials on <Date>

## Support Resources
- **User Guides:** <Link to docs/guides/>
- **Runbooks:** <Link to docs/runbooks/>
- **Emergency Contact:** <On-call email/phone>

We're excited to deliver these improvements and welcome your questions or concerns.

Best regards,
<Product Owner Name>
<Title>
<Contact Information>

---
This is an automated release notification. For urgent matters, contact <Emergency Email>.
```

---

#### T-5 Days: Admin User Preparation Email

**Audience:** Admin users (system operators)
**Sender:** Operations Team
**Subject:** `[Action Required] Admin Pilot Begins <Date> - <Feature Name>`

**Template:**

```
Hi <Admin Name>,

You're receiving this email because you're an administrator for the HOA Management System. We need your help piloting new features before they're released to all members.

## Admin Pilot Details
- **Start Date:** <Date, Time>
- **Duration:** 1 week (admin-only access)
- **Features to Test:** <Feature list>
- **Your Role:** Use features as you would in daily operations, report any issues

## Access Instructions
1. **Login:** Use your existing admin credentials at <Domain>/admin
2. **New Features:** Navigate to <Specific Routes/Pages>
3. **Testing Checklist:** <Link to pilot testing checklist>

## What to Test
- [ ] <Feature 1>: <Specific test scenarios>
- [ ] <Feature 2>: <Specific test scenarios>
- [ ] Accessibility: Toggle high-visibility mode, test keyboard navigation
- [ ] Performance: Note any slow page loads or errors

## Reporting Issues
**Critical Bugs:** Email <Emergency Email> immediately
**Non-Critical Feedback:** Reply to this email or use <Feedback Form Link>

**Feedback Deadline:** <Date> (end of pilot week)

## Training Materials
- **Video Walkthrough:** <Link to recorded demo>
- **Quick Start Guide:** <Link to PDF guide>
- **FAQ:** <Link to docs/faq.md>

Thank you for helping us deliver quality features to our community!

<Operations Team Contact>
```

---

#### T-2 Days: System Maintenance Announcement

**Audience:** All members (in-app banner + optional email)
**Medium:** System announcement banner
**Timing:** 48 hours before deployment window

**Template (In-App Banner):**

```
📅 Scheduled Maintenance: <Day, Date> at <Time>

The HOA Community Hub will be briefly unavailable (<5 minutes) for scheduled updates. New features will be available immediately after.

[Learn More] [Dismiss]
```

**Template (Email - Optional for Major Releases):**

```
Subject: [HOA System] Scheduled Maintenance - <Date, Time>

Dear Residents,

The HOA Management System will undergo scheduled maintenance on <Day, Date> from <Start Time> to <End Time>. Expected downtime is less than 5 minutes.

## What's Changing
We're introducing new features to improve your experience:
- <Feature 1>: <Brief description>
- <Feature 2>: <Brief description>

## What You Need to Know
- **When:** <Day, Date, Time>
- **Duration:** <5 minutes
- **Impact:** Brief service interruption
- **Action Required:** None - features will be available after maintenance

Visit <Domain> after <End Time> to explore the new features.

Questions? Contact the board at <Board Email>.

Best regards,
<HOA Board>
```

---

### Deployment Phase (T-0)

#### Real-Time Status Updates

**Audience:** Technical team, operations
**Channel:** Deployment log (`ops/deploy-log.md`), Slack/equivalent

**Status Update Format:**

```markdown
### Deployment YYYY-MM-DD HH:MM UTC

**Version:** v1.5.0
**Operator:** @username
**Trigger:** Release / Manual Dispatch / Hotfix

#### Timeline
- [HH:MM] Deployment started
- [HH:MM] Health gate passed
- [HH:MM] Images pushed to GHCR
- [HH:MM] SSH connection established
- [HH:MM] Backups created
- [HH:MM] Database migrations executed
- [HH:MM] Containers restarted
- [HH:MM] Health checks passed
- [HH:MM] Deployment complete

**Status:** ✅ Success / ⚠️ Issues Detected / ❌ Rollback Required

**Notes:** <Any issues encountered, resolution steps>
```

---

### Post-Release Phase (T+0 to T+7 days)

#### T+0 Hours: Deployment Complete Notification

**Audience:** Board members, admin users, support team
**Sender:** Operations Team
**Subject:** `[HOA System] Release v<Version> Deployed Successfully`

**Template:**

```
Subject: [HOA System] Release v1.5.0 Deployed Successfully

The HOA Management System has been successfully updated to version 1.5.0. All systems are operational.

## Deployment Summary
- **Deployment Time:** <Date, Time>
- **Duration:** <Actual duration>
- **Downtime:** <Actual downtime>
- **Status:** ✅ All checks passed

## New Features Available
1. **<Feature 1>:** <Brief description> - [User Guide](<Link>)
2. **<Feature 2>:** <Brief description> - [User Guide](<Link>)

## Access & Rollout
- **Admin Users:** Full access immediately
- **Member Pilot:** Begins <Date> (invitation emails sent separately)
- **General Availability:** Pending pilot feedback and board approval

## Known Issues
<None / List of minor known issues with workarounds>

## Support Resources
- **User Guides:** <Link>
- **Release Notes:** <Link to CHANGELOG>
- **Submit Feedback:** <Link to feedback form>
- **Report Issues:** <Support email>

## Next Steps for Admins
1. Review new admin features: <Link to admin guide>
2. Configure feature flags (if applicable): <Link to feature flags runbook>
3. Test pilot workflows: <Link to pilot checklist>

Thank you for your patience during the maintenance window.

<Operations Team>
<Contact Email>
```

---

#### T+1 Day: Member Pilot Invitation (If Applicable)

**Audience:** Selected members (pilot group)
**Sender:** Product Owner
**Subject:** `[Invitation] Be the First to Try <Feature Name>`

**Template:**

```
Dear <Member Name>,

You're invited to be among the first residents to try our new <Feature Name> feature! We value your feedback and want to ensure this feature meets our community's needs before broader release.

## What is <Feature Name>?
<2-3 sentence description of feature and benefits>

## Pilot Program Details
- **Duration:** <Date Range> (~1 week)
- **Your Role:** Use the feature naturally, report any issues or suggestions
- **Feedback Deadline:** <Date>

## Getting Started
1. **Login:** <Domain>
2. **Navigate to:** <Specific page/route>
3. **Follow Guide:** <Link to quick start guide>

## What We Need From You
- Test at least <Number> of the following scenarios:
  - [ ] <Scenario 1>
  - [ ] <Scenario 2>
  - [ ] <Scenario 3>
- Report any bugs or confusing workflows
- Share your overall experience (survey link below)

## Feedback Channels
- **Quick Survey:** <Link to 5-minute survey>
- **Detailed Feedback:** Reply to this email
- **Bug Reports:** <Link to issue form>

## Support
Questions during the pilot? Contact <Support Email> or refer to the [User Guide](<Link>).

Thank you for helping us build a better community platform!

<Product Owner Name>
```

---

#### T+7 Days: Pilot Retrospective & GA Decision

**Audience:** Board members, product team
**Medium:** Email + board meeting agenda item
**Subject:** `[Decision Required] <Feature Name> Pilot Results & GA Recommendation`

**Template:**

```
Subject: [Decision Required] Vendor Directory Pilot Results & GA Recommendation

Dear Board Members,

The <Feature Name> pilot program has concluded. Below is a summary of results and our recommendation for general availability.

## Pilot Summary
- **Participants:** <Number> admin users, <Number> member testers
- **Duration:** <Date Range>
- **Usage Metrics:**
  - <Metric 1>: <Value> (e.g., 45 vendor submissions)
  - <Metric 2>: <Value> (e.g., 120 directory searches)
  - <Metric 3>: <Value> (e.g., 98% uptime)

## Feedback Highlights
**Positive:**
- "<User quote about feature benefit>"
- "<User quote about ease of use>"

**Constructive:**
- "<User suggestion for improvement>"
- "<Minor usability concern>"

## Issues Identified
| Severity | Issue | Status | Resolution |
|----------|-------|--------|------------|
| Critical | <Issue> | ✅ Fixed | Hotfix deployed <Date> |
| Medium | <Issue> | 🔧 In Progress | Fix scheduled for v1.5.1 |
| Low | <Issue> | 📝 Backlog | Non-blocking, future enhancement |

## Recommendation
**Proceed to General Availability:** ☐ Yes  ☐ No  ☐ Extend Pilot

**Rationale:** <1-2 paragraphs explaining recommendation based on data>

**Proposed GA Date:** <Date>

**Required Actions Before GA:**
- [ ] Resolve all critical and medium issues
- [ ] Update user documentation based on pilot feedback
- [ ] Send GA announcement to all members
- [ ] Configure feature flags for full rollout

## Board Approval Required
Please approve or request changes by <Deadline Date>. Reply to this email or discuss at the <Next Board Meeting Date> meeting.

**Approve GA:** Email confirmation to <Product Owner Email>
**Request Changes:** Schedule follow-up meeting via <Calendar Link>

Detailed pilot report attached.

<Product Owner Name>
```

---

#### T+7 Days: General Availability Announcement

**Audience:** All members (email + in-app banner)
**Sender:** HOA Board or Product Owner
**Subject:** `[New Feature] <Feature Name> Now Available to All Residents`

**Template:**

```
Subject: [New Feature] Vendor Directory Now Available to All Residents

Dear Neighbors,

We're excited to announce that the <Feature Name> is now available to all residents!

## What is <Feature Name>?
<2-3 sentence description focused on resident benefits>

## How to Use It
1. **Login:** Visit <Domain> and sign in with your credentials
2. **Navigate:** Click "<Navigation Label>" in the menu
3. **Explore:** <1-2 sentence quick start>

**New Users:** If you don't have an account yet, [register here](<Registration Link>). Accounts are approved within 24 hours.

## Key Features
- <Feature Highlight 1>
- <Feature Highlight 2>
- <Feature Highlight 3>

## Learn More
- **Video Tutorial:** <Link to 2-minute demo video>
- **User Guide:** <Link to PDF guide>
- **FAQs:** <Link to frequently asked questions>

## Feedback Welcome
We value your input! Share your experience or suggestions:
- **Email:** <Feedback Email>
- **Survey:** <Link to feedback survey>

## Need Help?
Contact the board at <Board Email> or consult the [Help Center](<Link>).

Thank you for being part of our community!

<HOA Board Name>
<Community Name>
```

---

### Ongoing Communication

#### Monthly Release Notes (For Frequent Updates)

**Audience:** All members
**Medium:** Email newsletter or system announcement
**Frequency:** Monthly (if release cadence >1 per month)

**Template:**

```
Subject: [HOA System] November 2025 Updates

Dear Residents,

Here's what's new in the HOA Community Hub this month:

## 🆕 New Features
- **<Feature>:** <Description> - [Learn More](<Link>)

## 🔧 Improvements
- **<Enhancement>:** <Description>
- **Performance:** <Metric improvement>

## 🐛 Bug Fixes
- Fixed: <Issue description>
- Resolved: <Issue description>

## 📚 Resources
- **Changelog:** <Link to detailed CHANGELOG>
- **User Guides:** <Link to docs>
- **Support:** <Email>

## 📅 What's Next
We're working on <upcoming features> for the next release. Stay tuned!

<HOA Board or Product Team>
```

---

## Communication Templates by Scenario

### Scenario 1: Hotfix Deployment

**Audience:** Technical team, board (if user-impacting)
**Timing:** Immediate notification post-deploy

**Template:**

```
Subject: [Urgent] Hotfix Deployed - <Issue Description>

A critical issue was identified and resolved with an emergency hotfix deployment.

**Issue:** <Brief description of bug>
**Impact:** <Who was affected, what functionality broken>
**Resolution:** Deployed hotfix v<Version> at <Time>
**Verification:** <How issue was confirmed fixed>

**User Impact:** <None / Minimal / Service restored>

**Root Cause:** <1 sentence>
**Preventative Measures:** <Actions to prevent recurrence>

No further action required. System is operating normally.

<Operations Team>
```

---

### Scenario 2: Rollback Notification

**Audience:** Board members, admin users, technical team
**Timing:** Immediate during/after rollback

**Template:**

```
Subject: [Alert] Deployment Rolled Back - <Reason>

The v<Version> deployment has been rolled back to the previous version (v<Previous Version>) due to <critical issue>.

**Reason for Rollback:** <1-2 sentence description>
**Rollback Time:** <Time completed>
**Current Status:** System restored, operating on v<Previous Version>

**User Impact:**
- <Feature> temporarily unavailable
- All other functionality normal

**Next Steps:**
1. Root cause analysis scheduled for <Date>
2. Fix development in progress
3. New deployment date: TBD (will notify 48 hours in advance)

**Actions Required:** None. We'll communicate when the fix is ready for re-deployment.

We apologize for the disruption and are committed to resolving this quickly.

<Operations Team>
<Incident Commander Contact>
```

---

### Scenario 3: Feature Flag Toggle Announcement

**Audience:** Members (if user-facing feature)
**Timing:** Immediate when toggling to enabled

**Template (In-App Banner):**

```
🎉 New Feature Enabled: <Feature Name>

<Feature> is now available! [Try it now](<Link>) | [Learn more](<Guide>)
```

**Template (Email - Major Features Only):**

```
Subject: [Feature Enabled] <Feature Name> Now Live

Great news! The <Feature Name> feature you've been waiting for is now enabled.

**What Changed:** <1 sentence>
**How to Access:** <Navigation instructions>
**Learn More:** <Link to guide>

This feature was enabled based on pilot feedback and board approval. Enjoy!

<Product Team>
```

---

## Stakeholder-Specific Communication Guidelines

### Board Members

**Tone:** Formal, policy-focused
**Content:** Business value, governance impacts, budget implications
**Frequency:** Pre-release, post-pilot, quarterly reviews
**Response Time:** Allow 48-72 hours for feedback

### Admin Users

**Tone:** Technical but accessible, action-oriented
**Content:** Operational procedures, troubleshooting, pilot instructions
**Frequency:** Pre-release, during pilots, incident notifications
**Response Time:** Expect 24-hour response, acknowledge immediately

### Members (Residents)

**Tone:** Friendly, concise, benefit-focused
**Content:** What's new, how to use, where to get help
**Frequency:** Major releases, GA announcements, monthly updates
**Response Time:** No response expected (one-way broadcast)

### Support Team

**Tone:** Technical, detailed
**Content:** Known issues, workarounds, escalation procedures
**Frequency:** Pre-release, post-deploy, incident updates
**Response Time:** Immediate acknowledgment required

---

## Best Practices

### 1. Lead with Benefits, Not Features

**Good:** "Find trusted vendors for your home repairs with our new directory"
**Bad:** "We've added a vendors table with CRUD endpoints"

### 2. Use Progressive Disclosure

- **Email subject:** High-level summary
- **First paragraph:** Key takeaway
- **Body:** Details for interested readers
- **Links:** Deep dives for technical users

### 3. Manage Expectations Proactively

- Always include deployment window times
- State expected downtime explicitly (<5 minutes)
- Communicate rollout phases (admin → pilot → GA)
- Provide support contact for questions

### 4. Celebrate Wins, Own Issues

- Highlight community benefits and volunteer contributions
- Acknowledge bugs quickly, provide transparent timelines
- Thank pilot participants and feedback providers

### 5. Archive All Communications

- Store release emails in `ops/communications/` directory
- Include in deployment log references
- Useful for onboarding new board members

---

## Approval Workflows

### Minor Releases (Patches, Bug Fixes)

**Approvers:** Tech Lead
**Timeline:** Same-day approval
**Communication:** Tech team only (unless user-impacting bug)

### Major Releases (New Features)

**Approvers:** Product Owner + Board Liaison
**Timeline:** 1 week notice minimum
**Communication:** All stakeholder groups

### Emergency Hotfixes

**Approvers:** On-call engineer (post-deploy board notification)
**Timeline:** Immediate
**Communication:** Tech team + board (if user-impacting)

---

## Metrics & Feedback Collection

### Communication Effectiveness Metrics

**Tracked Metrics:**
- Email open rates (target: >60% for board emails)
- Link click-through rates (user guide links)
- Support ticket volume post-release (target: <5 per week)
- Pilot participation rate (target: >80% of invited users)

**Feedback Collection:**
- **Post-Deploy Survey:** Sent T+7 days, 5-minute survey
- **Pilot Feedback Form:** Required for pilot participants
- **Board Meeting Reviews:** Quarterly release retrospectives

### Continuous Improvement

- Review communication templates quarterly
- Update based on feedback and metrics
- A/B test subject lines and content for major announcements
- Maintain stakeholder contact lists (quarterly review)

---

## Related Documentation

- **Runbooks:**
  - [Release Checklist](./release-checklist.md)
  - [Deployment Runbook](./deployment.md)
  - [Feature Flags Runbook](./feature-flags.md)
- **Architecture:**
  - [Section 3.12: Documentation & Knowledge Transfer](../../.codemachine/artifacts/architecture/04_Operational_Architecture.md#3-12-documentation--knowledge-transfer)
- **Templates:**
  - Email Templates: `ops/email-templates/`
  - In-App Banners: Admin UI announcement composer

---

## Maintenance & Review

**Review Schedule:** After each major release or quarterly

**Update Triggers:**
- New stakeholder group identified
- Communication channel added/removed
- Governance policy changes (board approval requirements)
- Feedback indicates templates need revision

**Change Process:**
1. Draft template updates in PR
2. Review with product owner and board liaison
3. A/B test new templates if significant changes
4. Update this runbook and archive old versions
5. Train operations team on new procedures

**Owner:** Product Owner + Operations Team
**Review Approvers:** Board Communications Committee

---

**End of Runbook**

For questions or template requests, contact Product Owner at <email> or file issue with label `ops/communications`.
