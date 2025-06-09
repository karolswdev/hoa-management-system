# HOA Management System - User Guide

Welcome to the HOA Management System! This guide will help you navigate and use all the features available in the application.

## 🌐 **System Access**

**Application URL**: http://localhost:5173/login

## 👥 **User Roles**

The system supports two main user roles:

### **Member**
- View announcements and events
- Access approved documents
- Participate in community discussions
- Manage personal profile

### **Admin**
- All member capabilities
- User management (approve/reject registrations)
- Content management (announcements, events, documents)
- System configuration
- Audit trail access

---

## 🚀 **Getting Started**

### **1. Registration**
1. Navigate to http://localhost:5173/login
2. Click **"Don't have an account? Register"**
3. Fill in your details:
   - **Name**: Your full name
   - **Email**: Valid email address
   - **Password**: Must be at least 8 characters with uppercase, lowercase, number, and special character
4. Click **"Register"**
5. **Wait for admin approval** - Your account will be in "pending" status until an administrator approves it

### **2. Login**
1. Go to http://localhost:5173/login
2. Enter your **email** and **password**
3. Click **"Login"**
4. You'll be redirected to the dashboard based on your role

### **3. Password Reset**
1. On the login page, click **"Forgot Password?"**
2. Enter your email address
3. Follow the instructions sent to your email
4. Enter the reset token and new password

---

## 👤 **Member Features**

### **Dashboard**
- **Recent Announcements**: View the latest community announcements
- **Upcoming Events**: See scheduled community events
- **Quick Actions**: Access to main features

### **📢 Announcements**
- View all active community announcements
- Filter and search announcements
- See announcement details and expiration dates

### **📅 Events**
- Browse upcoming and past community events
- View event details including:
  - Date and time
  - Location
  - Description
  - Event organizer

### **📄 Documents**
- Access approved community documents
- Download documents (PDF, Word, Excel, images)
- Search and filter documents
- View document descriptions and upload dates

### **💬 Discussions**
- **View Discussions**: Browse community discussion threads
- **Create New Thread**: Start a new discussion topic
- **Reply to Threads**: Participate in existing conversations
- **Search Discussions**: Find specific topics or conversations

### **⚙️ Profile Management**
- **Update Name**: Change your display name
- **Change Password**: Update your account password
- **View Account Info**: See your registration date and status

---

## 🔧 **Admin Features**

Admins have access to all member features plus additional administrative capabilities:

### **👥 User Management**
- **View All Users**: See complete user list with status and roles
- **Approve/Reject Registrations**: Manage pending user accounts
- **Update User Roles**: Promote members to admin or demote admins
- **Update User Status**: Change user status (approved, pending, rejected)
- **Delete Users**: Remove user accounts and associated data
- **Reset User Passwords**: Change passwords for any user

**User Status Options:**
- **Pending**: New registrations awaiting approval
- **Approved**: Active users who can log in
- **Rejected**: Denied access to the system

### **📢 Announcement Management**
- **Create Announcements**: Post new community announcements
- **Edit Announcements**: Modify existing announcements
- **Delete Announcements**: Remove outdated announcements
- **Set Expiration**: Configure when announcements expire
- **Rich Text Content**: Use HTML formatting for announcements

### **📅 Event Management**
- **Create Events**: Schedule new community events
- **Edit Events**: Update event details, dates, and locations
- **Delete Events**: Remove cancelled or past events
- **Event Details**: Set start/end dates, location, and descriptions

### **📄 Document Management**
- **Upload Documents**: Add new documents to the system
- **Approve Documents**: Review and approve uploaded documents
- **Delete Documents**: Remove documents and associated files
- **Set Visibility**: Configure documents as public or member-only
- **Document Types**: Support for PDF, Word, Excel, and image files

**Document Upload Process:**
1. Click **"Upload Document"**
2. Fill in document details:
   - **Title**: Document name
   - **Description**: Optional description
   - **Visibility**: Public (visible to all) or Private (members only)
3. Select file (max 10MB)
4. Click **"Upload"**

### **⚙️ System Configuration**
- **Site Settings**: Configure HOA name, description, and other settings
- **System Parameters**: Manage application-wide configurations
- **Update Settings**: Modify configuration values

### **📊 Audit Trail**
- **View Admin Actions**: See all administrative activities
- **Action Details**: Review what actions were performed and when
- **Admin Accountability**: Track which admin performed each action
- **Search Logs**: Find specific administrative activities

---

## 🔍 **Common Tasks**

### **For Members:**

#### **Joining a Discussion**
1. Go to **"Discussions"** in the navigation
2. Click on a thread title to view the conversation
3. Scroll to the bottom and click **"Reply"**
4. Type your response and click **"Post Reply"**

#### **Starting a New Discussion**
1. Go to **"Discussions"**
2. Click **"New Discussion"**
3. Enter a **title** and your **message**
4. Click **"Create Discussion"**

#### **Downloading a Document**
1. Go to **"Documents"**
2. Find the document you want
3. Click the **download icon** next to the document
4. The file will download to your computer

### **For Admins:**

#### **Approving New Users**
1. Go to **"Admin"** → **"User Management"**
2. Look for users with **"Pending"** status
3. Click the **"Update Status"** button for the user
4. Select **"Approved"** and click **"Update Status"**

#### **Creating an Announcement**
1. Go to **"Admin"** → **"Announcements"**
2. Click **"Create Announcement"**
3. Fill in the details:
   - **Title**: Announcement headline
   - **Content**: Message content (HTML supported)
   - **Expires At**: Optional expiration date
4. Click **"Create"**

#### **Uploading a Document**
1. Go to **"Admin"** → **"Documents"**
2. Click **"Upload Document"**
3. Fill in the form:
   - **Title**: Document name
   - **Description**: Optional description
   - **Public**: Check if visible to non-members
   - **File**: Select the file to upload
4. Click **"Upload"**

---

## 🛡️ **Security & Privacy**

### **Password Requirements**
- Minimum 8 characters
- Must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

### **Data Privacy**
- Personal information is protected
- Only admins can see user management details
- Documents can be set as public or member-only
- Audit logs track all administrative actions

### **Account Security**
- Sessions expire automatically
- Password reset requires email verification
- Failed login attempts are monitored

---

## 📱 **Browser Compatibility**

The system works best with modern browsers:
- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**

---

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **Can't Log In**
- Check your email and password
- Ensure your account is approved (contact an admin)
- Try password reset if needed

#### **File Upload Fails**
- Check file size (max 10MB)
- Ensure file type is supported:
  - PDF files
  - Word documents (.doc, .docx)
  - Excel files
  - Images (JPEG, PNG, GIF)

#### **Page Not Loading**
- Refresh the browser
- Check your internet connection
- Clear browser cache if needed

#### **Permission Denied**
- Ensure you're logged in
- Check if you have the required role (admin features require admin role)
- Contact an admin if you need role changes

### **Getting Help**
- Contact your HOA administrator
- Check with other community members in discussions
- Refer to this user guide for feature explanations

---

## 📞 **Support Information**

For technical issues or questions about using the system:

1. **Check this user guide** for common tasks and troubleshooting
2. **Contact your HOA administrator** for account-related issues
3. **Use the community discussions** to ask questions and get help from other members

---

## 🔄 **System Updates**

The system is regularly updated with new features and improvements. Key areas of ongoing development:

- Enhanced mobile responsiveness
- Additional document types support
- Advanced search capabilities
- Email notifications
- Calendar integration

---

*This user guide covers the current features of the HOA Management System. For the most up-to-date information, please refer to system announcements or contact your administrator.*