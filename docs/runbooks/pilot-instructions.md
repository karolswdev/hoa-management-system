# Pilot Program Instructions - Vendor Directory & Democracy Modules

**Version:** 1.0
**Date:** 2025-11-23
**Target Release:** Iteration 4 (I4)
**Program Duration:** 3-4 weeks (phased rollout)
**Program Manager:** [Assign board liaison or community coordinator]

---

## Executive Summary

This document provides step-by-step instructions for conducting a phased pilot program for the **Vendor Directory** and **Democracy Module** features introduced in Iteration 4. The pilot follows a three-phase approach to minimize risk, gather feedback, and ensure feature readiness before general availability.

**Pilot Objectives:**
1. Validate vendor moderation workflows with admin users (Week 1)
2. Collect member feedback on vendor submission and directory usability (Week 2)
3. Assess community engagement with poll notifications and voting features (Weeks 1-3)
4. Identify and resolve usability issues before full public launch (Week 4)

**Success Criteria:**
- Zero critical defects discovered during pilot
- >80% pilot participant satisfaction (measured via survey)
- <3 support tickets per week related to new features
- Vendor moderation SLA <48 hours maintained
- Poll notification delivery rate >98%

---

## Phase 1: Admin-Only Pilot (Week 1)

### Objectives
- Train admin users on vendor moderation workflows
- Validate email notification delivery (vendor submission alerts)
- Test moderation UI (approve/deny/delete actions, bulk operations)
- Establish baseline metrics for vendor queue management

### Participants
- **Target Group:** All admin users (3-5 admins)
- **Selection Criteria:** Active board members or community managers
- **Notification Method:** Direct email + in-person meeting

### Feature Flags Configuration

**Before Phase 1 starts:**
```bash
# Via Admin UI: https://hoa.example.com/admin/config
vendors.directory = false  # Disabled for general users
vendors.public-categories = Landscaping,Plumbing  # Limited scope for testing

# Democracy module flags (already enabled from previous release)
polls.notify-members-enabled = true
polls.binding-enabled = false  # Keep disabled until legal review complete
```

**Admin Session Override (Dev/Staging Only):**
- Admins can enable `vendors.directory` for their session via admin panel toggle
- Production: Use test environment or staging clone for Phase 1

### Step-by-Step Pilot Tasks

**Day 1: Admin Training Session (60 minutes)**

**Agenda:**
1. **Welcome & Overview (10 min):**
   - Introduce vendor directory purpose, benefits for community
   - Review pilot timeline and success criteria
   - Distribute [Vendor Moderation Runbook](vendor-moderation.md)

2. **Vendor Directory Demo (20 min):**
   - Navigate to `/vendors` as guest, member, admin (show visibility differences)
   - Demonstrate category filtering, search functionality
   - Show vendor submission form (member view)

3. **Moderation Workflow Training (20 min):**
   - Navigate to `/admin/vendors` moderation dashboard
   - Practice approving vendors: Select vendor → Click "Approve" → Confirm
   - Practice denying vendors: Select vendor → Click "Deny" → Confirm
   - Practice bulk actions: Select multiple → Click "Approve (N)" → Confirm
   - Review audit log: Click "Show Audit Log" → View moderation history

4. **Email Notifications Demo (10 min):**
   - Submit test vendor as member → Admin receives submission alert email
   - Approve vendor with broadcast enabled → Members receive approval notification
   - Review email templates in SendGrid dashboard

**Days 2-5: Hands-On Testing**

**Admin Tasks:**
1. **Submit Test Vendors (Each admin submits 2-3 vendors):**
   - Use real or realistic vendor data (names, categories, contact info)
   - Vary categories: Landscaping, Plumbing, Electrical, HVAC
   - Include notes with service details, ratings (1-5 stars)
   - **Goal:** 10-15 test vendors in pending queue

2. **Practice Moderation:**
   - Review pending vendors individually
   - Approve 70% of vendors (realistic approval rate)
   - Deny 20% of vendors (test denial workflow)
   - Delete 10% of vendors (test deletion + confirmation)
   - **Goal:** All admins complete 5+ moderation actions each

3. **Test Bulk Actions:**
   - Select 3-5 pending vendors → Bulk approve
   - Select 2-3 approved vendors → Bulk deny (move to denied tab)
   - **Goal:** Validate bulk workflow, check for UI/performance issues

4. **Verify Email Notifications:**
   - Confirm receipt of vendor submission alerts (check admin inbox)
   - Verify email contains vendor name, category, submitter, moderation link
   - Test "Broadcast to Members" toggle on approval → Check member test inbox
   - **Goal:** 100% email delivery rate to admins

5. **Review Metrics & Audit Log:**
   - Navigate to `/admin/vendors` → Check metrics: pending count, approval rate
   - Click "Show Audit Log" → Verify all moderation actions logged
   - Verify audit entries include admin name, timestamp, vendor details
   - **Goal:** Audit trail complete and accurate

**Day 6: Feedback Collection**

**Feedback Survey (10 questions, 5 minutes):**
1. How intuitive was the vendor moderation UI? (1-5 scale)
2. Did you encounter any errors or bugs? (Yes/No, describe)
3. How long did it take to approve/deny a vendor on average? (seconds)
4. Did you receive vendor submission alert emails reliably? (Yes/No)
5. How useful is the audit log for tracking moderation actions? (1-5 scale)
6. Did bulk actions work as expected? (Yes/No, describe issues)
7. What features did you find most useful? (free text)
8. What improvements would you suggest? (free text)
9. Are you confident using the moderation tools independently? (Yes/No)
10. Overall satisfaction with vendor directory admin features? (1-5 scale)

**Feedback Analysis:**
- Compile survey responses in shared document
- Identify common pain points or feature requests
- Triage bugs: Critical (blocks pilot) → Major (fix before GA) → Minor (defer to I5)
- Schedule follow-up meeting to review findings and decide Go/No-Go for Phase 2

### Phase 1 Success Criteria

- [ ] All admins complete training session
- [ ] 10+ test vendors submitted and moderated
- [ ] Email delivery rate: 100% to admins (submission alerts)
- [ ] Zero critical defects identified
- [ ] Average moderation time: <2 minutes per vendor
- [ ] Admin satisfaction: >4/5 average score
- [ ] Decision: Proceed to Phase 2 (Yes/No)

---

## Phase 2: Member Pilot (Week 2)

### Objectives
- Validate vendor submission form usability for members
- Test vendor directory search, filter, and contact workflows
- Collect member feedback on directory value and content quality
- Assess vendor approval turnaround time (admin SLA)

### Participants
- **Target Group:** 10-15 volunteer members (active community participants)
- **Selection Criteria:** Tech-savvy, willing to provide detailed feedback
- **Notification Method:** Announcement + direct email invitation

### Feature Flags Configuration

**Before Phase 2 starts:**
```bash
# Via Admin UI: https://hoa.example.com/admin/config
vendors.directory = true  # Enabled for all members
vendors.public-categories = Landscaping,Plumbing,Electrical  # Expand to 3 categories

# Keep binding polls disabled for safety
polls.binding-enabled = false
```

### Step-by-Step Pilot Tasks

**Day 1: Pilot Kick-Off Announcement**

**Announcement Content:**
```
Subject: Join Our Vendor Directory Pilot Program!

We're excited to announce a new Vendor Directory feature to help community members discover trusted service providers recommended by fellow residents.

We need YOUR feedback! Join our pilot program to:
✅ Test the new vendor directory
✅ Submit vendors you've used and recommend
✅ Help shape this feature before public launch

PILOT DATES: [Start Date] - [End Date] (2 weeks)
WHAT TO DO:
1. Visit the Vendor Directory: https://hoa.example.com/vendors
2. Browse vendors, filter by category, and test search
3. Submit 1-2 vendors you recommend (Landscaping, Plumbing, or Electrical only for pilot)
4. Complete a short feedback survey at the end

QUESTIONS? Contact [Program Manager] at [email]

Thank you for helping improve our community hub!
```

**Days 2-10: Member Testing**

**Member Tasks:**

1. **Browse Vendor Directory:**
   - Visit `/vendors` page
   - View vendor list (should see approved vendors from Phase 1)
   - Test category filter: Click "Plumbing" chip → Results update
   - Test search: Type "lawn" → Results filter by name/category
   - View vendor details: Click vendor card → See contact info, rating, notes
   - **Goal:** Validate UI is intuitive, no JavaScript errors

2. **Submit Vendors (Each member submits 1-2 vendors):**
   - Click "Submit Vendor" button (top-right of directory page)
   - Fill form:
     - Name: [Vendor business name]
     - Service Category: [Select from dropdown]
     - Contact Info: [Phone/email/website]
     - Rating: [1-5 stars]
     - Notes: [Brief description of service experience]
   - Submit form → Verify success toast: "Vendor submitted for approval"
   - **Goal:** 10-20 new vendor submissions from pilot members

3. **Wait for Approval (Admins moderate within 48 hours):**
   - Admins review pending vendors daily
   - Admins approve legitimate vendors, deny duplicates/spam
   - Members receive no direct notification (future enhancement)
   - **Goal:** Test admin SLA, validate moderation quality

4. **Return to Directory (After approval):**
   - Visit `/vendors` again 24-48 hours later
   - Verify submitted vendor appears in directory (if approved)
   - Click on own submitted vendor → Confirm details accurate
   - **Goal:** Validate end-to-end submission → approval → visibility flow

5. **Test Contact Workflow (Optional):**
   - Select vendor from directory
   - Click phone number or email link → Verify contact info correct
   - **Goal:** Ensure contact info displayed correctly for members

**Days 11-12: Feedback Collection**

**Feedback Survey (12 questions, 7 minutes):**

1. How easy was it to find the Vendor Directory? (1-5 scale)
2. Did the vendor list load quickly? (Yes/No)
3. How useful were the category filters? (1-5 scale)
4. Did the search function work as expected? (Yes/No, describe issues)
5. How easy was the vendor submission form to complete? (1-5 scale)
6. Did you encounter any errors during submission? (Yes/No, describe)
7. Were you notified when your vendor was approved? (Yes/No - expect "No" for pilot)
8. Did your submitted vendor appear in the directory after approval? (Yes/No)
9. How valuable is the vendor directory for finding service providers? (1-5 scale)
10. What types of vendors would you like to see added? (free text)
11. What improvements would make the directory more useful? (free text)
12. Overall satisfaction with vendor directory? (1-5 scale)

**Admin Metrics Review:**
- Check pending queue length daily: Target <10 vendors at any time
- Measure moderation turnaround: From submission to approval (target <48 hours)
- Monitor email delivery rate for vendor submission alerts
- Review audit log for any unusual patterns (spam, duplicates)

### Phase 2 Success Criteria

- [ ] 10+ pilot members actively participating
- [ ] 10-20 new vendor submissions received
- [ ] Admin moderation SLA: 90% approved within 48 hours
- [ ] Email delivery rate: >98% (submission alerts to admins)
- [ ] Zero major defects identified
- [ ] Member satisfaction: >3.5/5 average score
- [ ] Decision: Proceed to Phase 3 (Yes/No)

---

## Phase 3: General Availability (Week 3+)

### Objectives
- Expand vendor directory to all members and guests
- Enable full category list (7 categories)
- Monitor community engagement and support ticket volume
- Validate scalability with increased traffic
- Prepare for public announcement and marketing

### Participants
- **Target Group:** All HOA members + public guests
- **Notification Method:** Homepage banner, email blast, social media

### Feature Flags Configuration

**Before Phase 3 starts:**
```bash
# Via Admin UI: https://hoa.example.com/admin/config
vendors.directory = true  # Enabled for all users (including guests)
vendors.public-categories = Landscaping,Plumbing,Electrical,HVAC,Roofing,Painting,Snow Removal  # Full category list

# Democracy module flags (unchanged)
polls.notify-members-enabled = true
polls.binding-enabled = false  # Enable only after legal review + board approval
```

### Step-by-Step Launch Tasks

**Day 1: Public Announcement**

**Announcement Content (Homepage Banner):**
```
🎉 NEW FEATURE: Vendor Directory Now Live!

Discover trusted service providers recommended by fellow community members.
Browse vendors by category, view ratings, and contact directly.

➜ Visit Vendor Directory
➜ Submit a Vendor
```

**Email Blast (All Members):**
```
Subject: Introducing the HOA Vendor Directory

Dear Community Members,

We're excited to announce the launch of our new Vendor Directory - a resource to help you find reliable service providers recommended by your neighbors.

FEATURES:
✅ Browse vendors by category (Landscaping, Plumbing, Electrical, HVAC, Roofing, Painting, Snow Removal)
✅ View ratings and reviews from community members
✅ Contact vendors directly via phone, email, or website
✅ Submit your own vendor recommendations for approval

GET STARTED:
Visit: https://hoa.example.com/vendors

HAVE QUESTIONS?
Review our [Vendor Directory FAQ] or contact [Program Manager].

Thank you for helping build a valuable community resource!
```

**Days 2-21: Ongoing Monitoring (3 weeks)**

**Daily Monitoring Tasks (Admins):**

1. **Review Moderation Queue:**
   - Check pending vendors: Target <20 in queue at any time
   - Approve/deny vendors within 48 hours (SLA)
   - Monitor for spam or duplicate submissions

2. **Check Support Tickets:**
   - Review tickets related to vendor directory
   - Triage: UI bugs, feature requests, content questions
   - Target: <5 tickets/week (indicates good UX)

3. **Monitor Metrics:**
   - Vendor submission rate: Track daily, identify spikes
   - Vendor page views: Monitor engagement via analytics
   - Search queries: Identify popular categories
   - Moderation metrics: Approval rate, denial reasons

4. **Email Delivery Health:**
   - Check SendGrid dashboard for vendor notification delivery rates
   - Monitor bounces, spam reports, unsubscribes
   - Target: >98% delivery rate

**Weekly KPI Review (Program Manager + Tech Lead):**

| Metric | Target | Week 1 | Week 2 | Week 3 | Status |
|--------|--------|--------|--------|--------|--------|
| Vendor Submissions | 10-20/week | ___ | ___ | ___ | 🟢/🟡/🔴 |
| Moderation SLA (<48h) | >90% | ___% | ___% | ___% | 🟢/🟡/🔴 |
| Support Tickets | <5/week | ___ | ___ | ___ | 🟢/🟡/🔴 |
| Email Delivery Rate | >98% | ___% | ___% | ___% | 🟢/🟡/🔴 |
| Page Views (/vendors) | 100+/week | ___ | ___ | ___ | 🟢/🟡/🔴 |
| Approved Vendors | 50+ total | ___ | ___ | ___ | 🟢/🟡/🔴 |
| Member Satisfaction | >4/5 | ___ | ___ | ___ | 🟢/🟡/🔴 |

**Legend:** 🟢 On Track | 🟡 At Risk | 🔴 Critical

**End of Week 3: Post-Launch Survey (Optional)**

**Survey (5 questions, 3 minutes):**
1. How often have you used the vendor directory? (Never / Once / 2-5 times / 5+ times)
2. Have you contacted a vendor from the directory? (Yes/No)
3. How satisfied are you with the vendor directory? (1-5 scale)
4. What categories would you like to see added? (free text)
5. Any additional feedback? (free text)

### Phase 3 Success Criteria

- [ ] 50+ approved vendors in directory (across all categories)
- [ ] Vendor submission rate: 10-20/week sustained
- [ ] Admin moderation SLA: >90% within 48 hours
- [ ] Support ticket volume: <5/week (stable)
- [ ] Email delivery rate: >98% (no degradation)
- [ ] Member satisfaction: >4/5 average
- [ ] Zero critical defects identified
- [ ] Decision: Feature stable for indefinite operation (Yes/No)

---

## Democracy Module Pilot (Parallel Timeline)

### Poll Notification Testing

**Pilot Approach:** Democracy module already live from previous iteration. Focus I4 pilot on **email notification enhancements**.

**Week 1-3: Poll Notification Validation**

**Admin Tasks:**
1. Create test poll with `notify_members = true`
2. Verify all members receive notification email within 5 minutes
3. Check email content: Poll title, description, voting link, unsubscribe footer
4. Monitor SendGrid dashboard for delivery rates, bounces
5. **Success Criteria:** >98% delivery rate, <2 bounce complaints

**Member Tasks:**
1. Receive poll notification email
2. Click voting link → Navigate to poll detail page
3. Cast vote → Verify receipt code displayed
4. Receive vote receipt email (if requested)
5. Verify receipt code → Navigate to `/polls/receipts/{code}` → See verification

**Email Template Validation:**
- **Poll Notify Template:** Includes poll title, description, type, start/end dates, voting link
- **Vote Receipt Template:** Includes receipt code, vote hash, timestamp, poll title
- **Compliance:** Both templates include unsubscribe link, sender info, HOA branding

**Metrics to Monitor:**
- Poll creation rate with notifications enabled
- Email delivery rate (poll-notify template)
- Vote receipt email delivery rate (poll-receipt template)
- Member engagement: % of notified members who vote
- Support tickets related to poll notifications

### Hash Chain Integrity Validation (Binding Polls)

**Note:** Binding polls remain disabled (`polls.binding-enabled = false`) until legal review complete.

**Post-Legal Review Pilot Plan:**
1. Enable `polls.binding-enabled = true` for admin session only
2. Admin creates test binding poll (internal board vote, low stakes)
3. Board members cast votes, receive receipts
4. Admin runs integrity check: `GET /api/polls/{id}/integrity`
5. Verify hash chain report: All votes valid, no discrepancies
6. **Success Criteria:** 100% hash chain integrity, receipts verifiable

**Timeline:** Legal review expected by end of I4. If approved, run binding poll pilot in Week 4.

---

## Rollback & Contingency Plans

### Rollback Triggers

**Initiate rollback immediately if:**
- Critical defect discovered (login broken, data corruption, security vulnerability)
- Email delivery failure rate >20% for 24 hours
- Vendor spam submissions overwhelm moderation queue (>50 pending)
- Support ticket volume exceeds 15/week for 2 consecutive weeks
- Admin team unable to maintain <48 hour moderation SLA

### Rollback Procedure

**Step 1: Disable Feature Flags**
```bash
# Via Admin UI: https://hoa.example.com/admin/config
vendors.directory = false  # Disables all vendor endpoints instantly
polls.notify-members-enabled = false  # Disables poll notifications
```

**Step 2: Notify Stakeholders**
- Email all pilot participants: "Vendor directory temporarily disabled for maintenance"
- Post announcement: "Feature paused while we address feedback"
- Provide timeline for re-enablement: "Expected to resume [date]"

**Step 3: Investigate & Fix**
- Review support tickets, bug reports, feedback surveys
- Prioritize critical bugs for hotfix
- Schedule engineering time to address issues
- Re-test on staging environment before re-enabling

**Step 4: Re-Enable (After Fixes)**
- Apply hotfix to production
- Re-enable feature flags
- Notify participants: "Vendor directory re-enabled, issues resolved"
- Resume pilot at current phase

**Data Retention During Rollback:**
- All vendor submissions remain in database (moderation_state preserved)
- Members cannot submit new vendors while disabled
- Admins can still access `/admin/vendors` to review existing queue
- No data loss, just temporary feature blackout

---

## Post-Pilot Review & Iteration

### Post-Pilot Meeting (End of Week 4)

**Attendees:** Program Manager, Tech Lead, Product Owner, Admin Users (3-5), Pilot Members (2-3 representatives)

**Agenda (90 minutes):**

1. **Pilot Overview (10 min):**
   - Review pilot timeline, phases, participation rates
   - Present final KPIs dashboard (from weekly tracking)

2. **Feedback Summary (20 min):**
   - Share compiled survey results (Phase 1, Phase 2, Phase 3)
   - Highlight common themes: positive feedback, pain points, feature requests
   - Present support ticket analysis: categories, resolution times

3. **Technical Metrics Review (15 min):**
   - Vendor submission/approval rates, moderation SLA adherence
   - Email delivery rates, SendGrid stats
   - Performance metrics: Page load times, API response times
   - Accessibility audit results (if re-run)

4. **Lessons Learned (15 min):**
   - What went well? (celebrate successes)
   - What challenges did we encounter? (identify root causes)
   - What surprised us? (unexpected insights)

5. **Feature Requests Triage (15 min):**
   - Review member-suggested improvements (from surveys)
   - Categorize: Quick wins (I5) | Medium term (I6) | Long term (I7+)
   - Prioritize based on impact, effort, community demand

6. **Go/No-Go Decision (10 min):**
   - Decision: Keep vendor directory enabled indefinitely? (Yes/No)
   - Decision: Enable vendor approval broadcasts by default? (Yes/No)
   - Decision: Expand to additional categories? (Yes/No/Which?)
   - Decision: Proceed with binding poll enablement (after legal)? (Yes/No)

7. **Next Steps & Action Items (5 min):**
   - Assign owners for I5 feature enhancements
   - Schedule follow-up meetings (monthly KPI review)
   - Plan public announcement for wider community (if not already GA)

### Iteration Planning for I5

**Deferred Features from Pilot Feedback:**
- Vendor rating/review moderation (requires additional UX design)
- Member notification preferences (opt-out of poll notifications)
- Advanced vendor search (geolocation, availability calendars)
- Vendor performance analytics (views, contact clicks per vendor)
- Automated email queue for large notification batches (async processing)

**Prioritization Framework:**
| Feature | Impact | Effort | Community Demand | Priority |
|---------|--------|--------|------------------|----------|
| Vendor ratings | High | High | High | P1 |
| Notification opt-out | Medium | Low | Medium | P2 |
| Advanced search | Medium | Medium | Low | P3 |
| Async email queue | Low | High | Low | P4 |

**I5 Planning Meeting:** Schedule within 2 weeks of pilot completion to incorporate feedback into next iteration goals.

---

## Appendix

### A. Pilot Participant Recruitment Email Template

```
Subject: Invitation: Join Our Vendor Directory Pilot Program

Dear [Member Name],

You're invited to participate in our Vendor Directory Pilot Program!

As an active community member, your feedback is invaluable in shaping new features for our HOA platform.

WHAT IS IT?
A new vendor directory to help members discover trusted service providers (landscapers, plumbers, electricians, etc.) recommended by neighbors.

WHAT'S INVOLVED?
- 2 weeks of testing (light commitment, ~30 minutes total)
- Browse the directory, submit 1-2 vendor recommendations
- Complete a short feedback survey

WHAT'S IN IT FOR YOU?
- Early access to a valuable community resource
- Influence the final feature design
- Help your neighbors find great service providers

INTERESTED?
Reply to this email by [Date] to confirm participation.

QUESTIONS?
Contact [Program Manager] at [email] or [phone].

Thank you for helping improve our community hub!

Best regards,
[Sender Name]
[HOA Board / Community Manager]
```

### B. Pilot Feedback Survey Links

**Phase 1 Admin Survey:** [Google Forms / SurveyMonkey link]
**Phase 2 Member Survey:** [Google Forms / SurveyMonkey link]
**Phase 3 Post-Launch Survey:** [Google Forms / SurveyMonkey link]

### C. Support Ticket Categories

**Pre-defined ticket categories for pilot issues:**
- `Vendor Directory - UI Bug`: Visual issues, layout problems
- `Vendor Directory - Submission Error`: Form submission failures
- `Vendor Directory - Search/Filter`: Search or category filter not working
- `Vendor Directory - Moderation`: Admin moderation workflow issues
- `Vendor Directory - Email Notification`: Missing or delayed vendor alert emails
- `Polls - Notification Email`: Poll notification delivery issues
- `Polls - Vote Receipt`: Vote receipt email or verification issues
- `Accessibility - High-Vis Mode`: Theme toggle or accessibility issues
- `General - Feature Request`: Enhancement suggestions

### D. KPI Dashboard (Sample)

**Vendor Directory Metrics (Week 3 Example):**
```
Total Vendors: 62
  - Approved: 48
  - Pending: 10
  - Denied: 4

Submissions This Week: 14
Approval Rate: 77%
Avg Moderation Time: 18 hours (SLA: <48h ✅)

Email Delivery Rate: 99.2% ✅
Support Tickets: 3 (target <5 ✅)

Top Categories:
  1. Landscaping (18 vendors)
  2. Plumbing (12 vendors)
  3. Electrical (10 vendors)

Member Satisfaction: 4.3/5 ✅
```

### E. Contact Information

**Program Manager:** [Name], [Email], [Phone]
**Tech Lead:** [Name], [Email]
**Support Team:** [support@hoamanagement.example.com]
**Emergency Escalation:** [On-call engineer contact]

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Next Review:** After pilot completion (Week 4)
**Maintained By:** Program Manager + Tech Lead
