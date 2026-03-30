# Sanderson Creek HOA - Administrator User Guide

**Version 1.2** | Last Updated: March 2026

This comprehensive guide will help HOA administrators effectively manage the Sanderson Creek HOA Management System.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Administrator Dashboard](#administrator-dashboard)
3. [User Management](#user-management)
4. [Managing Announcements](#managing-announcements)
5. [Event Management](#event-management)
6. [Calendar Entry Management](#calendar-entry-management)
7. [Document Management](#document-management)
8. [Vendor Management](#vendor-management)
9. [Polls & Voting Management](#polls--voting-management)
10. [Board Governance](#board-governance)
11. [Committee Management](#committee-management)
12. [ARC Category Management](#arc-category-management)
13. [System Configuration](#system-configuration)
14. [Audit Logs](#audit-logs)
15. [Best Practices](#best-practices)
16. [Troubleshooting](#troubleshooting)
17. [Security Guidelines](#security-guidelines)

---

## Introduction

### Administrator Role

As an administrator of the Sanderson Creek HOA Management System, you have full access to:

- **User Management:** Approve, modify, and manage user accounts
- **Content Management:** Create and manage announcements, events, and documents
- **Committee & ARC Management:** Manage review committees, categories, and architectural review workflows
- **System Configuration:** Configure HOA information and system settings
- **Audit & Compliance:** Monitor system activity and user actions
- **Member Support:** Assist members with portal issues

### Administrator Responsibilities

1. **User Account Management**
   - Review and approve new member registrations
   - Maintain accurate user records
   - Manage user roles and permissions

2. **Content Moderation**
   - Post timely announcements
   - Manage community events
   - Upload and organize documents
   - Monitor discussion forums

3. **System Maintenance**
   - Keep system configuration up to date
   - Ensure accurate HOA information
   - Review audit logs regularly

4. **Security**
   - Protect member data and privacy
   - Use strong authentication
   - Follow security best practices

### Getting Started

1. **Log in** with your administrator credentials
2. **Navigate** using the admin menu
3. **Familiarize yourself** with each section
4. **Review** existing content and settings

---

## Administrator Dashboard

![Admin Dashboard](../frontend/screenshots/14-admin-dashboard.png)

The administrator dashboard is your control center for managing the HOA portal.

### Dashboard Features

- **Quick Statistics:** Overview of system metrics
  - Total users (approved, pending, rejected)
  - Active announcements
  - Upcoming events
  - Document count

- **Recent Activity:** Latest system actions and updates

- **Quick Actions:** Common administrative tasks
  - Approve pending users
  - Create announcements
  - Add events
  - Upload documents

### Navigation Menu

The admin navigation menu provides access to:

![Admin Navigation Menu](../frontend/screenshots/28-navigation-menu-admin.png)

- **Dashboard:** Main admin overview
- **Users:** User management
- **Announcements:** Content management
- **Events:** Event calendar management
- **Calendar Entries:** Recurring community calendar management
- **Documents:** Document library management
- **Configuration:** System settings
- **Audit Logs:** Activity monitoring
- **Profile:** Your admin account

---

## User Management

![Admin Users Management](../frontend/screenshots/15-admin-users-management.png)

User management is one of your most important responsibilities as an administrator.

### Accessing User Management

1. Click **"Users"** or **"User Management"** in the admin menu
2. You'll see a table of all registered users

### User Table Columns

The user management table displays:

- **ID:** Unique user identifier
- **Name:** User's full name
- **Email:** User's email address
- **Role:** Admin or Member
- **Status:** Approved, Pending, or Rejected
- **Verified:** Email verification status
- **Registration Date:** When user registered
- **Actions:** Available actions for each user

### User Filters and Search

![Admin Users - Filters](../frontend/screenshots/16-admin-users-filters.png)

Efficiently find users using:

1. **Search Bar**
   - Search by name or email
   - Real-time search results
   - Clear search to reset

2. **Status Filter**
   - All Users
   - Approved Only
   - Pending Only
   - Rejected Only

3. **Role Filter**
   - All Roles
   - Administrators
   - Members

4. **Pagination**
   - 10 users per page by default
   - **Rows per page selector:** Choose 10, 25, 50, or "All" to control how many users display at once
   - Navigate with page numbers
   - Jump to first/last page
   - "Showing X to Y of Z entries" counter at the bottom

### Approving New Users

When a new member registers:

1. **Receive Notification**
   - Check for pending users regularly
   - Filter by "Pending" status

2. **Review User Information**
   - Verify name matches HOA records
   - Confirm email address
   - Check registration date

3. **Approve the User**
   - Click **"Approve"** button next to user
   - Confirmation dialog appears
   - Click **"Confirm"** to approve
   - User receives approval notification email

4. **Alternative: Reject User**
   - If user is not a valid resident
   - Click **"Reject"** button
   - Provide reason for rejection (optional)
   - User receives rejection notification

### Changing User Roles

To promote a member to administrator or demote an admin:

1. **Locate the User** in the table
2. **Click "Change Role"** or role dropdown
3. **Select New Role:**
   - **Admin:** Full system access
   - **Member:** Standard user access
4. **Confirm the Change**
5. User's permissions update immediately

**Important:**
- Be careful when assigning admin roles
- Admins have full system access
- Only promote trusted individuals
- System users (default admins) cannot have roles changed

### Updating User Status

Change user status as needed:

1. **Find the User** in the table
2. **Click "Change Status"** or status dropdown
3. **Select New Status:**
   - **Approved:** User can access portal
   - **Pending:** Awaiting approval
   - **Rejected:** Access denied
4. **Confirm the Change**

**Use Cases:**
- **Suspend access:** Change approved to pending/rejected
- **Restore access:** Change rejected to approved
- **Review accounts:** Check pending registrations

### Deleting Users

Remove user accounts when necessary:

1. **Locate the User** in the table
2. **Click "Delete"** or trash icon
3. **Review Warning:**
   - This action cannot be undone
   - All user data will be deleted
   - Discussions/replies remain but show "Deleted User"
4. **Confirm Deletion** by typing username or clicking confirmation
5. User account is permanently removed

**Note:** System users (default administrators) cannot be deleted.

### User Management Best Practices

1. **Regular Reviews**
   - Check for pending users daily
   - Review user list monthly
   - Remove inactive accounts

2. **Verification**
   - Verify new users against resident records
   - Confirm email addresses are legitimate
   - Check for duplicate accounts

3. **Communication**
   - Respond to registration requests promptly
   - Explain rejections when appropriate
   - Notify users of status changes

4. **Security**
   - Limit number of administrators
   - Review admin accounts regularly
   - Remove access for former board members

---

## Managing Announcements

![Admin Announcements Management](../frontend/screenshots/17-admin-announcements-management.png)

Announcements keep residents informed about important community news and updates.

### Viewing Announcements

1. Click **"Announcements"** in the admin menu
2. See list of all announcements (active and expired)

### Announcement Table

Displays:
- **Title:** Announcement headline
- **Content:** Preview of announcement text
- **Created Date:** When posted
- **Expires Date:** Expiration date (if set)
- **Status:** Active or Expired
- **Actions:** Edit, Delete buttons

### Creating a New Announcement

![Admin Create Announcement Dialog](../frontend/screenshots/18-admin-create-announcement-dialog.png)

1. **Click "Create Announcement" or "New Announcement"**

2. **Fill in the Form:**

   ![Filled Announcement Form](../frontend/screenshots/19-admin-create-announcement-filled.png)

   - **Title (Required)**
     - Clear, concise headline
     - Maximum 200 characters
     - Example: "Pool Opening This Weekend"

   - **Content (Required)**
     - Detailed announcement text
     - Rich text formatting supported
     - Include all relevant information
     - Maximum 5,000 characters
     - Example: "The community pool will open for the season this Saturday, June 1st, at 9:00 AM. Pool hours are 6 AM to 10 PM daily..."

   - **Expiration Date (Optional)**
     - Set when announcement should no longer display
     - Use date picker to select date
     - Leave empty for permanent announcements
     - System automatically marks as expired after date

   - **Notify Members (Optional)**
     - Check box to send email notification
     - Email sent to all approved members
     - Use sparingly for important announcements only
     - Members receive immediate email with announcement content

3. **Preview Announcement (Optional)**
   - Review how announcement will appear
   - Check formatting and content
   - Make adjustments as needed

4. **Click "Create" or "Submit"**
   - Announcement posted immediately
   - Success notification appears
   - Email sent if notification checked

![Success Notification](../frontend/screenshots/29-success-notification.png)

### Editing Announcements

To update an existing announcement:

1. **Find the Announcement** in the table
2. **Click "Edit"** button
3. **Modify Information:**
   - Update title or content
   - Change expiration date
   - Add/remove email notification
4. **Click "Update" or "Save Changes"**
5. Changes take effect immediately

**Note:** Editing does not resend email notifications

### Deleting Announcements

Remove outdated or incorrect announcements:

1. **Locate the Announcement**
2. **Click "Delete"** button
3. **Confirm Deletion:**
   - Warning dialog appears
   - Action cannot be undone
4. **Click "Confirm"** or "Delete"
5. Announcement removed from system

### Announcement Best Practices

1. **Timing**
   - Post announcements promptly
   - Update information regularly
   - Remove outdated content

2. **Content Quality**
   - Write clear, concise messages
   - Include all relevant details
   - Proofread before posting
   - Use proper formatting

3. **Email Notifications**
   - Use for important announcements only
   - Don't overuse to avoid email fatigue
   - Recommended uses:
     - Emergency notices
     - Critical deadlines
     - Important policy changes
     - Mandatory meetings

4. **Expiration Dates**
   - Set expiration for time-sensitive announcements
   - Leave empty for ongoing information
   - Review and update regularly

### Announcement Types and Examples

**Community Updates**
- "New Landscaping Schedule"
- "Community Center Renovation Update"
- "Annual Budget Approved"

**Events**
- "Annual HOA Meeting - November 15th"
- "Summer BBQ This Saturday"
- "Holiday Decoration Contest"

**Maintenance**
- "Pool Closed for Maintenance May 1-3"
- "Street Repaving Schedule"
- "Trash Collection Holiday Schedule"

**Reminders**
- "HOA Dues Due This Month"
- "Parking Permit Renewal Deadline"
- "Architectural Review Submission Process"

**Safety & Security**
- "Recent Break-in - Security Reminder"
- "Severe Weather Advisory"
- "Street Light Repairs in Progress"

---

## Event Management

![Admin Events Management](../frontend/screenshots/20-admin-events-management.png)

Manage community events, meetings, and social gatherings.

### Viewing Events

1. Click **"Events"** in the admin menu
2. See list of all events (upcoming and past)
3. Events sorted by date (most recent first)

### Event Table

Displays:
- **Title:** Event name
- **Date:** Start date and time
- **Location:** Event venue
- **Status:** Upcoming, Ongoing, or Completed
- **Actions:** Edit, Delete buttons

### Creating a New Event

![Admin Create Event Dialog](../frontend/screenshots/21-admin-create-event-dialog.png)

1. **Click "Create Event" or "New Event"**

2. **Fill in the Event Form:**

   - **Title (Required)**
     - Event name or description
     - Clear and descriptive
     - Maximum 200 characters
     - Example: "Annual HOA Meeting"

   - **Description (Required)**
     - Full event details
     - What to expect
     - What to bring
     - RSVP information
     - Maximum 2,000 characters
     - Example: "Join us for our annual HOA meeting to discuss community improvements, review the budget, and vote on proposed changes. Light refreshments will be served."

   - **Location (Required)**
     - Event venue or meeting place
     - Include room/area if applicable
     - Maximum 200 characters
     - Example: "Community Center - Main Hall"

   - **Start Date & Time (Required)**
     - When event begins
     - Use date/time picker
     - Specify exact time
     - Example: "November 15, 2025 at 7:00 PM"

   - **End Date & Time (Required)**
     - When event concludes
     - Must be after start date/time
     - Use date/time picker
     - Example: "November 15, 2025 at 9:00 PM"

3. **Review Event Details**
   - Verify all information is correct
   - Check date and time accuracy
   - Confirm location details

4. **Click "Create" or "Submit"**
   - Event posted immediately
   - Appears in members' event calendar
   - Success notification displays

### Editing Events

Update event information as needed:

1. **Find the Event** in the table
2. **Click "Edit"** button
3. **Modify Information:**
   - Update any event details
   - Change date, time, or location
   - Revise description
4. **Click "Update" or "Save Changes"**
5. Changes visible to members immediately

**Common Reasons to Edit:**
- Location change
- Time adjustment
- Updated event details
- Cancellation notice (update description)

### Deleting Events

Remove cancelled or past events:

1. **Locate the Event** in the table
2. **Click "Delete"** button
3. **Confirm Deletion:**
   - Warning appears
   - Cannot be undone
4. **Click "Confirm"**
5. Event removed from calendar

**Note:** Consider editing instead of deleting to note cancellations

### Event Status

Events automatically show status:

- **Upcoming:** Start date in the future
- **Ongoing:** Currently happening (between start and end time)
- **Completed:** End date has passed

### Event Management Best Practices

1. **Advance Notice**
   - Post events at least 2 weeks in advance
   - More notice for major events
   - Update promptly if changes occur

2. **Complete Information**
   - Include all relevant details
   - Specify exact location
   - Note any requirements (RSVP, what to bring)
   - Provide contact information

3. **Accurate Times**
   - Double-check dates and times
   - Use 12-hour format (AM/PM)
   - Include setup/cleanup times if volunteers needed

4. **Regular Updates**
   - Update events if details change
   - Post reminders for major events
   - Archive old events periodically

### Event Types and Examples

**HOA Meetings**
- "Monthly Board Meeting"
- "Annual General Meeting"
- "Special Assessment Vote"

**Social Events**
- "Summer BBQ and Pool Party"
- "Holiday Lights Contest"
- "National Night Out Celebration"

**Community Service**
- "Spring Cleanup Day"
- "Community Garden Workday"
- "Food Drive Collection"

**Informational**
- "Landscaping Workshop"
- "Home Security Seminar"
- "New Resident Welcome Meeting"

---

## Calendar Entry Management

Calendar entries are recurring community items that appear on the Community Calendar alongside events, polls, and announcements. Use this feature to set up schedules like trash pickup, recycling, board meetings, and dues deadlines.

### How Calendar Entries Differ from Events

- **Events** are one-time occurrences with a specific date, time, and location
- **Calendar entries** are primarily for recurring schedules (weekly trash, monthly meetings, quarterly dues) and community-wide dates
- Both appear together on the member Community Calendar

### Accessing Calendar Entry Management

1. Click **"Calendar Entries"** in the admin navigation menu
2. See a table of all calendar entries

### Calendar Entry Table

Displays:
- **Title:** Entry name with color indicator
- **Category:** Color-coded category badge
- **Frequency:** One-time, Weekly, Biweekly, Monthly, Quarterly, or Yearly
- **Start Date:** When the entry begins
- **Season:** Seasonal bounds if applicable (e.g., March - November)
- **Actions:** Edit, Exceptions, Delete buttons

### Creating a Calendar Entry

1. **Click "Create Entry"**

2. **Fill in the Entry Form:**

   - **Title (Required)**
     - Clear, descriptive name
     - Example: "Trash Pickup", "Board Meeting", "HOA Dues Deadline"

   - **Description (Optional)**
     - Additional details about this entry
     - Example: "Place bins at curb by 7:00 AM"

   - **Category (Required)**
     - Select from predefined categories:

     | Category | Color | Use For |
     |----------|-------|---------|
     | Trash | Green | Trash collection days |
     | Recycling | Blue | Recycling pickup days |
     | Yard Waste | Light Green | Yard waste / leaf collection |
     | Meeting | Purple | Board, committee, annual meetings |
     | Dues | Red | Payment deadlines |
     | Community | Orange | Garage sales, block parties |
     | Holiday | Pink | Holiday-related dates |
     | Other | Grey | Anything that doesn't fit above |

   - **Color**
     - Auto-set based on category, but can be customized
     - Use the color picker to choose a custom hex color

   - **All-Day Toggle**
     - Enabled by default (most community items are all-day)
     - Disable to set specific start/end times

   - **Start Date (Required)**
     - The first occurrence date (or only date for one-time entries)

   - **End Date (Optional)**
     - For multi-day one-time entries only

3. **Configure Recurrence (Optional)**

   Toggle **"Recurring"** to enable recurrence settings:

   - **Frequency (Required when recurring)**
     - **Daily:** Every day
     - **Weekly:** Same day every week (e.g., every Tuesday)
     - **Every 2 Weeks:** Alternating weeks (e.g., recycling every other Wednesday)
     - **Monthly:** Once a month on a specific day or weekday
     - **Quarterly:** Four times a year (Jan, Apr, Jul, Oct)
     - **Yearly:** Once a year on a specific date

   - **Day of Week**
     - Available for Weekly, Biweekly, and Monthly frequencies
     - Select which day (Sunday through Saturday)

   - **Week of Month**
     - Available for Monthly frequency when a day of week is selected
     - Choose: First, Second, Third, Fourth, or Last
     - Example: "First Thursday" for monthly board meetings

   - **Day of Month**
     - Available for Monthly, Quarterly, and Yearly when no day of week is set
     - Example: Day 1 for quarterly dues deadlines

   - **Month**
     - Available for Yearly frequency
     - Select the specific month

   - **Seasonal Bounds (Optional)**
     - Set **Active From** and **Active Until** months
     - Entry only appears during these months
     - Example: Yard waste collection March through November

   - **Recurrence End Date (Optional)**
     - When the recurrence should stop
     - Leave empty for entries that continue indefinitely

4. **Review and Create**
   - Verify all settings
   - Click **"Create"**
   - The entry appears on the Community Calendar immediately

### Recurrence Examples

| Scenario | Frequency | Day of Week | Week of Month | Day of Month | Season |
|----------|-----------|-------------|---------------|--------------|--------|
| Trash every Tuesday | Weekly | Tuesday | - | - | - |
| Recycling every other Wednesday | Every 2 Weeks | Wednesday | - | - | - |
| Yard waste, 1st Monday, Mar-Nov | Monthly | Monday | First | - | Mar - Nov |
| Board meeting, 1st Thursday | Monthly | Thursday | First | - | - |
| Dues deadline (quarterly) | Quarterly | - | - | 1 | - |
| Annual meeting, June 15 | Yearly | - | - | 15 | June |

### Editing Calendar Entries

1. **Find the entry** in the table
2. **Click the Edit button** (pencil icon)
3. **Modify any field** — all the same options as creation
4. **Preview panel** shows the next 5 upcoming occurrences to verify your changes
5. **Click "Update"** to save

### Managing Exceptions

Exceptions let you skip or move a specific occurrence of a recurring entry. Common scenarios include holidays causing trash pickup to shift by a day.

1. **Click the Exceptions button** (calendar-X icon) on a recurring entry
2. **View existing exceptions** — listed with date, status (cancelled or moved), and notes

#### Skipping a Date

1. Select the **Original Date** to skip
2. Leave the **"Move to a different date"** toggle off
3. Add an optional **note** (e.g., "No pickup — Christmas Day")
4. Click **"Skip Date"**

#### Moving a Date

Use this when an occurrence shifts to a different day (e.g., trash moves from Tuesday to Wednesday due to a holiday):

1. Select the **Original Date** (the date being replaced)
2. Toggle on **"Move to a different date"**
3. Select the **Move To Date** (the replacement date)
4. Add an optional **note** (e.g., "Moved due to Christmas — pickup on Wednesday instead of Tuesday")
5. Click **"Move Occurrence"**

The original date disappears from the calendar, and the item appears on the new date with your note visible to members.

#### Removing an Exception

Click the delete button next to any exception to restore the original occurrence.

### Deleting Calendar Entries

1. **Click the Delete button** (trash icon) on an entry
2. **Confirm deletion** — this permanently removes the entry and all its exceptions
3. The entry is immediately removed from the Community Calendar

### Audit Logging

All calendar entry operations are logged in the audit system:
- `calendar_entry_create` — new entry created
- `calendar_entry_update` — entry modified
- `calendar_entry_delete` — entry deleted
- `calendar_exception_create` — exception added
- `calendar_exception_delete` — exception removed

### Calendar Entry Best Practices

1. **Set Up Community Basics First**
   - Trash and recycling schedules
   - Regular board meeting dates
   - Dues deadlines
   - These recurring entries save members from having to remember schedules

2. **Use Seasonal Bounds**
   - Set yard waste collection to only show during active months
   - Avoids cluttering the winter calendar with irrelevant items

3. **Use Exceptions Proactively**
   - Add holiday skip exceptions at the start of each year
   - Include notes explaining alternative dates
   - Members will see the note on the calendar

4. **Choose Meaningful Colors**
   - Stick to the default category colors for consistency
   - Members learn to quickly identify item types by color

5. **Keep Descriptions Helpful**
   - Include practical details: "Place bins at curb by 7:00 AM"
   - Note any special instructions for the community

---

## Document Management

![Admin Documents Management](../frontend/screenshots/22-admin-documents-management.png)

Manage the HOA document library, including bylaws, forms, meeting minutes, and resources.

### Viewing Documents

1. Click **"Documents"** in the admin menu
2. See list of all documents

### Document Table

Displays:
- **Title:** Document name
- **Description:** Document description
- **File Name:** Uploaded file name
- **File Size:** Size in KB/MB
- **Type:** File format (PDF, DOC, etc.)
- **Visibility:** Public or Private
- **Status:** Pending or Approved
- **Uploaded Date:** When uploaded
- **Actions:** View, Approve, Delete buttons

### Uploading a New Document

![Admin Upload Document Dialog](../frontend/screenshots/23-admin-upload-document-dialog.png)

1. **Click "Upload Document" or "Add Document"**

2. **Fill in the Document Form:**

   - **Title (Required)**
     - Document name
     - Clear and descriptive
     - Maximum 200 characters
     - Example: "HOA Bylaws 2024"

   - **Description (Optional but Recommended)**
     - Brief description of contents
     - What the document contains
     - When it applies
     - Maximum 500 characters
     - Example: "Official HOA bylaws and regulations governing the Sanderson Creek community, updated January 2024"

   - **File (Required)**
     - Click "Choose File" or "Browse"
     - Select file from your computer
     - Supported formats:
       - PDF (.pdf)
       - Microsoft Word (.doc, .docx)
       - Microsoft Excel (.xls, .xlsx)
       - Text files (.txt)
       - Images (.jpg, .png, .gif)
     - Maximum file size: 10 MB
     - File name shown after selection

   - **Visibility (Required)**
     - **Public:** All members can see and download
     - **Private:** Only administrators can access
     - Default: Public
     - Use Private for sensitive documents

   - **Status (Optional)**
     - **Pending:** Requires approval before visible
     - **Approved:** Immediately visible to members
     - Default: Approved for admins
     - Use Pending for review process

3. **Click "Upload" or "Submit"**
   - File uploads to server
   - Processing notification appears
   - Success message when complete
   - Document appears in table

### File Upload Best Practices

1. **File Naming**
   - Use descriptive file names
   - Include year if applicable
   - Avoid special characters
   - Example: "hoa-bylaws-2024.pdf"

2. **File Format**
   - Prefer PDF for official documents
   - PDF preserves formatting
   - Compatible with all devices
   - Cannot be easily edited

3. **File Size**
   - Compress large files before uploading
   - Keep under 10 MB limit
   - Optimize images and scans
   - Consider splitting very large documents

4. **Organization**
   - Use consistent naming conventions
   - Group related documents
   - Update old versions
   - Archive outdated documents

### Approving Documents

If documents require approval:

1. **Filter by "Pending" Status**
2. **Review Document:**
   - Click "View" or download
   - Verify content is appropriate
   - Check file opens correctly
3. **Click "Approve"** button
4. Document becomes visible to members

### Editing Document Information

Update document details without re-uploading:

1. **Find the Document** in the table
2. **Click "Edit"** button
3. **Modify:**
   - Title
   - Description
   - Visibility (Public/Private)
   - Status (Approved/Pending)
4. **Cannot change:** Actual file (must re-upload)
5. **Click "Save Changes"**

### Deleting Documents

Remove outdated or incorrect documents:

1. **Locate the Document** in the table
2. **Click "Delete"** button
3. **Confirm Deletion:**
   - Warning appears
   - File permanently deleted
   - Cannot be undone
4. **Click "Confirm"**
5. Document and file removed

### Document Categories

Organize documents by type:

**Governing Documents**
- HOA Bylaws
- CC&Rs (Covenants, Conditions & Restrictions)
- Articles of Incorporation
- Amendments

**Forms**
- Architectural Review Request
- Variance Application
- Rental Registration
- Pet Registration
- Complaint Form

**Financial**
- Annual Budgets
- Financial Reports
- Fee Schedules
- Reserve Study

**Meeting Records**
- Board Meeting Minutes
- Annual Meeting Minutes
- Special Meeting Minutes
- Election Results

**Community Information**
- Community Map
- Amenity Rules
- Parking Guidelines
- Landscape Standards
- Contact Directory

**Resources**
- Maintenance Tips
- Local Services
- Emergency Contacts
- Community Calendar

### Document Management Best Practices

1. **Version Control**
   - Include year/version in title
   - Remove outdated versions
   - Note "DRAFT" or "FINAL" status
   - Keep archive of old versions

2. **Accessibility**
   - Make important documents public
   - Ensure files are readable
   - Provide alternate formats if needed
   - Test downloads regularly

3. **Regular Maintenance**
   - Review document library quarterly
   - Remove outdated content
   - Update annual documents
   - Fix broken links

4. **Security**
   - Mark sensitive documents private
   - Limit access to financial details
   - Protect personal information
   - Don't upload confidential member data

---

## System Configuration

![Admin System Configuration](../frontend/screenshots/24-admin-system-configuration.png)

Configure HOA information and system settings visible to members.

### Accessing Configuration

1. Click **"Configuration"** or **"Settings"** in admin menu
2. View all system settings

### Available Settings

The configuration page includes:

#### HOA Name
- **Field:** HOA Name
- **Description:** Official name of the HOA
- **Example:** "Sanderson Creek Homeowners Association"
- **Max Length:** 100 characters
- **Displayed:** Throughout portal, emails, documents

#### HOA Description
- **Field:** HOA Description
- **Description:** Brief description of the community
- **Example:** "A vibrant and welcoming community dedicated to maintaining high standards and fostering neighborly connections"
- **Max Length:** 500 characters
- **Displayed:** Public home page, about section

#### Contact Email
- **Field:** Contact Email
- **Description:** Main HOA email address
- **Example:** "info@sandersoncreekhoa.com"
- **Format:** Valid email address
- **Displayed:** Contact page, footer, automated emails

#### Contact Phone
- **Field:** Contact Phone
- **Description:** Main HOA phone number
- **Example:** "(555) 123-4567"
- **Format:** Any format accepted
- **Displayed:** Contact page, footer

#### HOA Address
- **Field:** Address
- **Description:** Physical HOA office address
- **Example:** "123 Sanderson Creek Blvd, Suite 100, Anytown, ST 12345"
- **Max Length:** 200 characters
- **Displayed:** Contact page, official communications

#### Website URL
- **Field:** Website URL
- **Description:** HOA website (if different from portal)
- **Example:** "https://www.sandersoncreekhoa.com"
- **Format:** Valid URL with http:// or https://
- **Displayed:** Footer, external links

#### Office Hours
- **Field:** Office Hours
- **Description:** When office is staffed
- **Example:** "Monday - Friday: 9:00 AM - 5:00 PM"
- **Max Length:** 200 characters
- **Displayed:** Contact page

#### Emergency Contact
- **Field:** Emergency Contact
- **Description:** After-hours or emergency number
- **Example:** "(555) 911-HELP"
- **Format:** Any format accepted
- **Displayed:** Contact page, emergency info

### Updating Configuration

To change system settings:

1. **Navigate to Configuration Page**

2. **Edit Individual Settings:**
   - **Single Field Update:**
     - Click "Edit" next to field
     - Modify value
     - Click "Save" for that field

   - **Multiple Field Update:**
     - Click "Edit All" or "Edit Configuration"
     - Modify multiple fields
     - Click "Save All Changes"

3. **Validation:**
   - System validates input
   - Error messages if invalid
   - Fix errors and resubmit

4. **Confirmation:**
   - Success message appears
   - Changes take effect immediately
   - Members see updated information

### Configuration Best Practices

1. **Accuracy**
   - Keep information current
   - Verify contact details regularly
   - Test email addresses and links
   - Update office hours for holidays

2. **Consistency**
   - Use official HOA name consistently
   - Match printed materials
   - Coordinate with board

3. **Professionalism**
   - Use professional language
   - Proofread all content
   - Avoid abbreviations
   - Include complete information

4. **Regular Review**
   - Review quarterly
   - Update annually
   - Verify after board changes
   - Test contact methods

### What Members See

Members can view (but not edit) configuration on:
- Public home page
- Contact information page
- Email footers
- About section
- Help pages

---

## Committee Management

![Admin Committee Management](../frontend/screenshots/49-admin-committee-management.png)

Committees review member requests such as architectural changes. Administrators create and manage committees and assign members.

### Accessing Committee Management

1. Click **"Committees"** in the Administration section of the navigation menu
2. You'll see a table of all committees (active and inactive)

### Creating a Committee

1. Click **"Create Committee"**
2. Fill in the form:
   - **Name** (required) -- e.g., "Architectural Review"
   - **Description** (optional) -- purpose of the committee
   - **Approval Expiration (days)** -- how long approvals remain valid (default: 365)
3. Click **"Save"**

### Editing a Committee

1. Click the **edit icon** next to a committee
2. Modify the name, description, status, or expiration period
3. Click **"Save"**

### Deactivating a Committee

1. Click the **delete icon** next to an active committee
2. The committee status changes to inactive
3. Inactive committees cannot accept new requests

### Managing Committee Members

1. Click the **expand arrow** on a committee row to show its members
2. To **add a member:**
   - Click **"Add Member"**
   - Enter the user's ID and select their role (Member or Chair)
   - Click **"Add"**
3. To **remove a member:**
   - Click the remove icon next to their name

### Committee Roles

| Role | Permissions |
|------|------------|
| **Chair** | All member permissions plus administrative oversight |
| **Member** | Review requests, approve/deny, add comments, perform transitions |

### Important Notes

- Committee membership determines who can review and act on requests -- admin status alone does not grant committee review access (by design)
- Each committee has its own approval expiration period
- At least one member (preferably a chair) should be assigned before the committee begins receiving requests

---

## ARC Category Management

![Admin ARC Categories](../frontend/screenshots/50-admin-arc-categories.png)

ARC categories define the types of architectural changes homeowners can request.

### Accessing Category Management

1. Click **"ARC Categories"** in the Administration section of the navigation menu
2. You'll see all categories with their status and sort order

### Creating a Category

1. Click **"Create Category"**
2. Fill in the form:
   - **Name** (required) -- e.g., "Fence", "Solar Panels"
   - **Description** (optional) -- explain what this category covers
   - **Sort Order** -- controls display order in the dropdown (lower numbers first)
3. Click **"Save"**

### Editing a Category

1. Click the **edit icon** next to a category
2. Modify name, description, active status, or sort order
3. Click **"Save"**

### Deactivating a Category

1. Click the **delete icon** next to an active category
2. The category becomes inactive and won't appear in the member's submission form
3. Existing requests in this category are not affected

### Default Categories

The system ships with 9 default categories:
Fence, Paint/Exterior Color, Landscaping, Roofing, Deck/Patio, Shed/Outbuilding, Solar Panels, Signage, Other

These can be edited or deactivated as needed.

---

## Audit Logs

![Admin Audit Logs](../frontend/screenshots/25-admin-audit-logs.png)

Monitor system activity and maintain compliance records.

### Accessing Audit Logs

1. Click **"Audit Logs"** or **"Activity"** in admin menu
2. View complete system activity log

### Audit Log Table

Each log entry displays:
- **ID:** Unique log identifier
- **Action:** Type of action performed
- **Performed By:** User who performed action
- **Target Type:** What was affected (User, Announcement, etc.)
- **Target ID:** Specific item ID
- **Details:** Additional information (expandable)
- **Date/Time:** When action occurred

### Types of Actions Logged

**User Actions:**
- `user_login` - User logged in
- `user_logout` - User logged out
- `user_created` - New user registered
- `user_approved` - Admin approved user
- `user_rejected` - Admin rejected user
- `user_role_changed` - Admin changed user role
- `user_status_changed` - Admin changed user status
- `user_deleted` - Admin deleted user

**Announcement Actions:**
- `announcement_created` - Admin created announcement
- `announcement_updated` - Admin edited announcement
- `announcement_deleted` - Admin deleted announcement

**Event Actions:**
- `event_created` - Admin created event
- `event_updated` - Admin edited event
- `event_deleted` - Admin deleted event

**Document Actions:**
- `document_uploaded` - Admin uploaded document
- `document_approved` - Admin approved document
- `document_deleted` - Admin deleted document
- `document_downloaded` - User downloaded document

**Discussion Actions:**
- `discussion_created` - User created discussion
- `discussion_updated` - User edited discussion
- `discussion_deleted` - User deleted discussion
- `reply_created` - User replied to discussion

**Configuration Actions:**
- `config_updated` - Admin changed system configuration

### Filtering Audit Logs

![Admin Audit Logs Filters](../frontend/screenshots/26-admin-audit-logs-filters.png)

Efficiently find specific log entries:

1. **Action Type Filter**
   - Dropdown menu of action types
   - Filter by specific actions
   - Example: Show only login attempts

2. **User Filter**
   - Search by username or email
   - See all actions by specific user
   - Example: Show all admin actions

3. **Date Range Filter**
   - Start date and end date pickers
   - View activity in time period
   - Example: Last month's activity

4. **Search**
   - Free text search
   - Searches details and actions
   - Real-time results

5. **Clear Filters**
   - Reset all filters
   - Return to full log view

### Viewing Log Details

Expand log entries for more information:

1. **Click "Details"** or expand icon
2. **View JSON data** with complete information:
   - Old values (for updates)
   - New values (for updates)
   - IP address (for logins)
   - Browser information
   - Additional metadata

### Pagination

- **20 entries per page** by default
- Navigate with page numbers
- Jump to specific page
- First/last page buttons

### Audit Log Use Cases

**Security Monitoring**
- Review failed login attempts
- Check for unauthorized access
- Monitor suspicious activity
- Verify admin actions

**Compliance**
- Document user approvals
- Track content changes
- Maintain activity records
- Prepare for audits

**Troubleshooting**
- Investigate user issues
- Find when changes occurred
- Identify who made changes
- Debug problems

**Reporting**
- Generate activity reports
- Count user actions
- Analyze usage patterns
- Board meeting reports

### Audit Log Best Practices

1. **Regular Reviews**
   - Check logs weekly
   - Look for unusual activity
   - Verify admin actions
   - Monitor failed logins

2. **Security Monitoring**
   - Watch for unauthorized access
   - Check IP addresses
   - Review deleted items
   - Monitor role changes

3. **Retention**
   - Logs stored indefinitely
   - Export important records
   - Keep for compliance
   - Reference for disputes

4. **Privacy**
   - Logs contain sensitive information
   - Limit access to audit logs
   - Don't share publicly
   - Follow data protection laws

---

## Vendor Management

Manage the community vendor directory, review submissions from members, and moderate listings.

### Accessing Vendor Management

1. Click **"Vendors"** in the admin menu
2. View all vendor listings and pending submissions

### Vendor Moderation Dashboard

The vendor management page includes:

- **Pending Vendors Tab:** Submissions awaiting your review
- **Approved Vendors Tab:** Currently listed vendors
- **Rejected Vendors Tab:** Previously denied submissions

### Reviewing Vendor Submissions

When a member submits a new vendor:

1. **Check the Pending tab** for new submissions
2. **Review vendor details:**
   - Vendor name and service category
   - Contact information
   - Member rating and notes
   - Submitting member's identity
3. **Approve or Deny:**
   - **Approve:** Vendor appears in the public directory
   - **Deny:** Vendor is rejected with optional reason

### Managing Existing Vendors

- **Edit:** Update vendor name, category, contact info, or visibility
- **Delete:** Remove a vendor from the directory
- **Change Visibility:** Set to Public (guests can see), Members Only, or Admins Only

### Vendor Categories

The system includes these service categories:
- Plumbing, Electrical, Landscaping, HVAC, Roofing, Painting, General Contractor, Other

### Vendor Management Best Practices

1. Review pending submissions promptly (within 1-2 business days)
2. Verify vendor legitimacy before approving
3. Encourage members to include contact information and honest ratings
4. Remove vendors that are no longer in business or have received complaints

---

## Polls & Voting Management

Create and manage community polls, monitor voting, and verify vote integrity.

### Creating a Poll

1. Navigate to **Admin > Polls**
2. Click **"Create Poll"**
3. Fill in poll details:
   - **Title:** Clear question or topic
   - **Description:** Context for voters
   - **Type:** Binding (official vote) or Informal (survey)
   - **Options:** Fill in Option 1 and Option 2, then click "Add another option" for more
   - **Start/End Dates:** When voting opens and closes
   - **Anonymous Voting:** Toggle if voter identity should be hidden
4. Optionally check **"Notify Members"** to send an email alert
5. Click **"Create"**

### Monitoring Poll Results

- View real-time vote counts and percentages
- See participation rates
- Results available to admins during voting; members see results after poll closes

### Vote Receipts

When members vote, they receive a cryptographic receipt code. Members can verify their vote was recorded correctly by visiting the public receipt verification page at `/polls/{pollId}/receipts/{hash}`.

### Hash Chain Integrity

The system records votes in a cryptographic hash chain. Each vote's hash depends on the previous vote, making tampering detectable.

To verify integrity:
1. Navigate to a poll's detail page
2. Click **"Verify Integrity"** or **"Hash Chain Check"**
3. The system validates the entire chain and reports any discrepancies

### Poll Management Best Practices

1. Set clear, unambiguous poll questions
2. Use binding polls for official HOA decisions; informal for surveys
3. Allow adequate voting time (at least 7 days for important decisions)
4. Announce polls via email notification so members don't miss them

---

## Board Governance

Manage the HOA board roster, titles, and history.

### Board Roster

The board page displays current board members and their titles to all community members.

### Managing Board Members

1. Navigate to **Admin > Board**
2. **Add Board Member:** Assign a title (President, Vice President, Treasurer, Secretary, etc.) to an existing user
3. **Edit Title:** Change a board member's role
4. **Remove:** Remove a member from the board roster

### Board History

Members can view historical board compositions for reference.

---

## Best Practices

### Time Management

**Daily Tasks:**
- Check for pending user approvals
- Review new registrations
- Monitor discussions for inappropriate content
- Respond to member inquiries

**Weekly Tasks:**
- Post important announcements
- Update upcoming events
- Review audit logs
- Check system configuration

**Monthly Tasks:**
- Review user list
- Archive old announcements
- Update document library
- Generate activity reports

**Quarterly Tasks:**
- Audit administrator accounts
- Review system settings
- Clean up old content
- Update policies and procedures

### Communication

**Announcements:**
- Write clear, concise content
- Include all relevant information
- Proofread before posting
- Use email notifications sparingly

**Email:**
- Respond promptly to inquiries
- Use professional tone
- Include contact information
- Follow up on issues

**Events:**
- Post with advance notice
- Include complete details
- Update if changes occur
- Send reminders for important events

### Content Management

**Quality:**
- Proofread all content
- Use proper grammar and spelling
- Format for readability
- Include relevant dates

**Organization:**
- Use consistent naming
- Categorize logically
- Archive old content
- Keep current information prominent

**Updates:**
- Review content regularly
- Remove outdated information
- Update annually recurring items
- Fix broken links

### Security

**Account Security:**
- Use strong passwords
- Change passwords regularly
- Never share credentials
- Log out when finished

**Data Protection:**
- Protect member information
- Mark sensitive documents private
- Don't share personal data
- Follow privacy laws

**Access Control:**
- Limit number of admins
- Review permissions regularly
- Remove former admins promptly
- Document who has access

### Member Support

**Responsiveness:**
- Answer questions promptly
- Be helpful and courteous
- Provide clear instructions
- Follow up on issues

**Resources:**
- Keep contact info current
- Provide help documentation
- Offer multiple contact methods
- Be accessible during office hours

**Problem Solving:**
- Listen to member concerns
- Troubleshoot technical issues
- Escalate when necessary
- Document solutions

---

## Troubleshooting

### Common Administrator Issues

#### Can't Approve Users

**Problem:** Approve button not working

**Solutions:**
1. Refresh the page
2. Check user status (may already be approved)
3. Verify you have admin role
4. Check browser console for errors
5. Try different browser
6. Contact technical support

#### Documents Won't Upload

**Problem:** File upload fails

**Solutions:**
1. **Check file size** - Must be under 10 MB
2. **Verify file type** - Must be supported format
3. **Check internet connection**
4. **Try smaller file** - Compress if needed
5. **Clear browser cache**
6. **Disable browser extensions**
7. **Try different browser**

#### Emails Not Sending

**Problem:** Announcement emails not delivered

**Solutions:**
1. **Verify email configuration** - Check with technical admin
2. **Check recipient email addresses** - Ensure users have valid emails
3. **Look in spam folders** - Tell members to check spam
4. **Review audit logs** - Check if email action logged
5. **Test with small group** - Send to yourself first
6. **Contact email service provider** - May be SendGrid issue

#### Changes Not Saving

**Problem:** Configuration or content updates don't save

**Solutions:**
1. **Check for validation errors** - Red error messages
2. **Verify required fields** - All required fields must be filled
3. **Check character limits** - Content may be too long
4. **Refresh and retry** - May be temporary issue
5. **Clear browser cache**
6. **Try incognito mode**
7. **Contact support with details**

#### Audit Logs Not Loading

**Problem:** Audit log page empty or not loading

**Solutions:**
1. **Check date filters** - May be filtering out all results
2. **Clear all filters** - Reset to default view
3. **Refresh page**
4. **Check internet connection**
5. **Try different browser**
6. **Contact technical support**

### Getting Technical Support

If issues persist:

1. **Document the Problem:**
   - What you were trying to do
   - What happened instead
   - Error messages
   - Screenshots

2. **Gather Information:**
   - Browser and version
   - Operating system
   - When problem started
   - Steps to reproduce

3. **Contact Support:**
   - Email: info@sandersoncreekhoa.com
   - Phone: (555) 123-4567
   - Include all documentation
   - Request ticket number

---

## Security Guidelines

### Password Security

**Strong Passwords:**
- At least 12 characters for admins
- Mix of uppercase and lowercase
- Include numbers and symbols
- Avoid common words
- Don't reuse passwords

**Password Management:**
- Change every 90 days
- Don't share passwords
- Use password manager
- Don't write down passwords
- Enable two-factor if available

### Account Security

**Login Best Practices:**
- Always log out when finished
- Don't save password on shared computers
- Clear browser data on public computers
- Don't leave computer unlocked
- Be aware of shoulder surfing

**Session Management:**
- Close browser when done
- Don't stay logged in permanently
- Use private/incognito for sensitive work
- Log out if away from computer

### Data Protection

**Member Privacy:**
- Don't share member information
- Mark sensitive documents private
- Don't discuss members publicly
- Follow data protection laws
- Protect contact information

**Document Security:**
- Don't upload confidential files
- Use private visibility for sensitive docs
- Verify recipients before sharing
- Shred printed copies
- Encrypt email attachments

### System Security

**Monitoring:**
- Review audit logs regularly
- Watch for unauthorized access
- Check failed login attempts
- Monitor unusual activity
- Report security incidents

**Updates:**
- Keep software updated
- Apply security patches
- Update browser regularly
- Maintain antivirus software
- Keep operating system current

### Incident Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Log out immediately
   - Change your password
   - Document what happened
   - Note any suspicious activity

2. **Reporting:**
   - Contact HOA board
   - Email: info@sandersoncreekhoa.com
   - Emergency: (555) 911-HELP
   - Provide detailed information

3. **Follow Up:**
   - Review audit logs
   - Check for unauthorized changes
   - Notify affected members if needed
   - Implement additional security

### Compliance

**Legal Requirements:**
- Follow data protection laws
- Maintain proper records
- Respect member privacy
- Keep audit trails
- Document procedures

**HOA Policies:**
- Follow board guidelines
- Maintain confidentiality
- Use system appropriately
- Report violations
- Document decisions

---

## Additional Resources

### Quick Reference

**Common Tasks:**
- Approve user: Users → Find user → Approve
- Create announcement: Announcements → Create → Fill form → Submit
- Add event: Events → Create → Fill form → Submit
- Upload document: Documents → Upload → Select file → Submit
- Update config: Configuration → Edit → Save

**Keyboard Shortcuts:**
- Ctrl/Cmd + S: Save (on edit forms)
- Ctrl/Cmd + F: Find on page
- Esc: Close dialog
- Tab: Navigate form fields

### Contact Information

**Technical Support:**
- Email: info@sandersoncreekhoa.com
- Phone: (555) 123-4567
- Office Hours: Monday - Friday, 9:00 AM - 5:00 PM

**Emergency:**
- Emergency Line: (555) 911-HELP
- Available 24/7

### Training Resources

**Administrator Training:**
- New admin orientation
- Monthly admin meetings
- Online help documentation
- Video tutorials (if available)

**Updates:**
- System updates announced via email
- Release notes on dashboard
- Change log in documentation

---

## Conclusion

Thank you for serving as an administrator for the Sanderson Creek HOA Management System. Your work keeps our community connected and informed.

**Remember:**
- Check system daily
- Respond to members promptly
- Keep information accurate
- Follow security guidelines
- Document important actions

**For assistance:**
- Review this guide
- Check online documentation
- Contact technical support
- Consult with other administrators

---

*This guide was last updated on March 25, 2026. Features and procedures may change. Please refer to the system for the most current information.*

**Document Control:**
- Version: 1.1
- Last Updated: March 25, 2026
- Next Review: June 25, 2026
- Maintained by: HOA Management Team
