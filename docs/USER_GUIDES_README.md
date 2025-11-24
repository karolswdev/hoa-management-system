# HOA Management System - User Guides

This directory contains comprehensive user guides for the Sanderson Creek HOA Management System.

## Available Guides

### 1. [Member User Guide](MEMBER_USER_GUIDE.md)
**For:** HOA residents and community members

**Contents:**
- Getting started with registration and login
- Navigating the dashboard
- Viewing announcements and events
- Accessing HOA documents
- Participating in community discussions
- Managing your profile
- Troubleshooting common issues

**Target Audience:**
- New residents joining the community
- Existing members learning the portal
- Anyone needing help with member features

---

### 2. [Administrator User Guide](ADMIN_USER_GUIDE.md)
**For:** HOA administrators and board members

**Contents:**
- Administrator dashboard overview
- User management and approvals
- Creating and managing announcements
- Event management
- Document library management
- System configuration
- Audit logs and compliance
- Best practices and security guidelines

**Target Audience:**
- HOA board members
- Community managers
- System administrators
- Anyone with admin portal access

---

## Quick Start

### For Members
1. Read the [Member User Guide](MEMBER_USER_GUIDE.md)
2. Start with "Getting Started" section
3. Follow registration process
4. Explore dashboard features

### For Administrators
1. Read the [Administrator User Guide](ADMIN_USER_GUIDE.md)
2. Start with "Introduction" section
3. Review all management features
4. Follow security guidelines

---

## Screenshots

All user guides include screenshots of each screen and feature. Screenshots are automatically generated and can be found in:

```
frontend/screenshots/
```

To regenerate screenshots:
```bash
./scripts/run-screenshots.sh
```

See [frontend/screenshots/README.md](../frontend/screenshots/README.md) for details.

## PDF User Guide (auto-generated)

We publish a downloadable PDF as part of the static frontend (`frontend/public/user-guide.pdf`). The PDF is built from this README + fresh screenshots.

- Local build (screenshots + PDF): `./scripts/build-user-guide.sh`
- PDF outputs: `dist/user-guide.pdf` and `frontend/public/user-guide.pdf`
- Release gate: the production deploy workflow runs the build and will fail the release if screenshots or PDF generation fail.

---

## Additional Documentation

### Technical Documentation
- [README.md](../README.md) - Project overview and setup
- [API Overview](../API-overview.md) - Backend API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment

### Infrastructure
- [Infrastructure Guide](INFRASTRUCTURE.md) - Infrastructure setup
- [Monitoring Guide](MONITORING.md) - System monitoring
- [Backup and Restore](BACKUP_AND_RESTORE.md) - Data backup procedures

---

## Keeping Guides Updated

### When to Update

Update user guides when:
- New features are added
- UI changes significantly
- Workflows change
- User feedback indicates confusion
- Bug fixes affect user experience

### How to Update

1. **Edit the Markdown Files:**
   - `MEMBER_USER_GUIDE.md` for member documentation
   - `ADMIN_USER_GUIDE.md` for admin documentation

2. **Update Screenshots:**
   - Run `./scripts/run-screenshots.sh` locally
   - Or use the GitHub Actions workflow (also runs on release)
   - Replace outdated screenshot references

3. **Review and Test:**
   - Verify all links work
   - Check screenshot references
   - Test instructions with actual system

---

## Visual Walkthrough (auto-generated screenshots)

**Public & Authentication**
- Login: ![Login](../frontend/screenshots/01-login-page.png)
- Validation errors: ![Login validation](../frontend/screenshots/02-login-validation-errors.png)
- Registration: ![Registration](../frontend/screenshots/03-registration-page.png)
- Forgot password: ![Forgot password](../frontend/screenshots/04-forgot-password-page.png)

**Member Experience**
- Dashboard: ![Member dashboard](../frontend/screenshots/06-member-dashboard.png)
- Announcements: ![Announcements](../frontend/screenshots/07-member-announcements-list.png)
- Events (upcoming/past): ![Events](../frontend/screenshots/08-member-events-upcoming.png)
- Documents: ![Documents](../frontend/screenshots/10-member-documents-page.png)
- Discussions: ![Discussions](../frontend/screenshots/11-member-discussions-list.png)
- Polls overview: ![Polls](../frontend/screenshots/30-member-polls.png)
- Poll detail: ![Poll detail](../frontend/screenshots/31-poll-detail.png)
- Poll receipt verification (public): ![Poll receipt](../frontend/screenshots/32-poll-receipt.png)
- Vendor directory: ![Vendor directory](../frontend/screenshots/33-vendor-directory-member.png)
- Profile: ![Profile](../frontend/screenshots/13-member-profile-page.png)

**Admin Experience**
- Dashboard: ![Admin dashboard](../frontend/screenshots/14-admin-dashboard.png)
- Users: ![Users](../frontend/screenshots/15-admin-users-management.png)
- Announcements: ![Admin announcements](../frontend/screenshots/17-admin-announcements-management.png)
- Events: ![Admin events](../frontend/screenshots/20-admin-events-management.png)
- Documents: ![Admin documents](../frontend/screenshots/22-admin-documents-management.png)
- Audit logs: ![Audit logs](../frontend/screenshots/25-admin-audit-logs.png)
- Vendor management: ![Vendor management](../frontend/screenshots/34-admin-vendor-management.png)
   - Proofread content

4. **Version Control:**
   - Update "Last Updated" date
   - Note changes in commit message
   - Tag releases if major updates

---

## Contributing

If you find errors or have suggestions:

1. **Submit Issues:**
   - Report errors via GitHub issues
   - Suggest improvements
   - Request clarifications

2. **Pull Requests:**
   - Fork repository
   - Make improvements
   - Submit pull request
   - Describe changes

3. **Feedback:**
   - Email: info@sandersoncreekhoa.com
   - Phone: (555) 123-4567

---

## Document Standards

### Formatting

- **Headings:** Use markdown heading hierarchy
- **Lists:** Use bullets for items, numbers for steps
- **Code:** Use code blocks for technical content
- **Emphasis:** Use **bold** for important items
- **Screenshots:** Reference with relative paths

### Writing Style

- **Clear:** Use simple, direct language
- **Concise:** Avoid unnecessary words
- **Complete:** Include all necessary information
- **Consistent:** Use same terminology throughout
- **Helpful:** Focus on user needs

### Screenshot Standards

- **Resolution:** 1280x720 viewport
- **Format:** PNG
- **Naming:** Descriptive, numbered
- **Alt Text:** Descriptive for accessibility
- **Currency:** Updated with UI changes

---

## Version History

### Version 1.0 (November 2025)
- Initial release
- Complete member user guide
- Complete administrator user guide
- Automated screenshot generation
- GitHub Actions integration

---

## Contact

**Sanderson Creek HOA**
- Email: info@sandersoncreekhoa.com
- Phone: (555) 123-4567
- Office Hours: Monday - Friday, 9:00 AM - 5:00 PM

**Technical Support**
- Email: info@sandersoncreekhoa.com
- Emergency: (555) 911-HELP

---

## License

These user guides are proprietary to Sanderson Creek HOA and provided for authorized use only.

---

*Last Updated: November 11, 2025*
