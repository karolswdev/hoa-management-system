# HOA Management API Documentation

## 1. Introduction

Welcome to the HOA Management API documentation. This document provides all the necessary information for developers to build a modern, feature-rich client application for a Homeowners Association website. The API is built using Node.js, Express, and Sequelize, providing a RESTful interface for managing users, announcements, events, documents, and community discussions.

The API is designed with a clear separation of roles and permissions, primarily distinguishing between **members** and **admins**. This documentation will detail each endpoint, its purpose, required permissions, request/response formats, and provide context for its use in a front-end application.

### 1.1. Base URL

All API routes are prefixed with `/api`. The base URL for the API will depend on your deployment environment.

-   **Development (Local):** `http://localhost:3001/api`

### 1.2. General Conventions

-   **Request/Response Format:** All data is sent and received in `JSON` format.
-   **Authentication:** Protected endpoints require a JSON Web Token (JWT) to be sent in the `Authorization` header as a Bearer token.
-   **Error Handling:** The API uses standard HTTP status codes to indicate the success or failure of a request. Error responses will include a `message` or `error` key with a descriptive string.
    -   `400 Bad Request`: Invalid input, validation error.
    -   `401 Unauthorized`: Missing or invalid authentication token.
    -   `403 Forbidden`: Authenticated user lacks permission to access the resource.
    -   `404 Not Found`: The requested resource does not exist.
    -   `409 Conflict`: Resource creation failed due to a conflict (e.g., duplicate email).
    -   `500 Internal Server Error`: An unexpected error occurred on the server.

---

## 2. Authentication

Authentication is managed via JWTs. Users must first register and be approved by an admin before they can log in and access protected resources.

### `POST /auth/register`

Registers a new user. New accounts are created with a `pending` status and must be approved by an administrator.

-   **Authorization:** Public
-   **Request Body:**
    ```json
    {
      "name": "Jane Resident",
      "email": "jane.resident@example.com",
      "password": "SecurePassword123!"
    }
    ```
-   **Success Response (201 Created):**
    ```json
    {
      "message": "Registration successful. Your account is pending approval.",
      "user": {
        "id": 5,
        "name": "Jane Resident",
        "email": "jane.resident@example.com",
        "role": "member",
        "status": "pending",
        "email_verified": false,
        "is_system_user": false,
        "created_at": "2025-06-09T10:00:00.000Z",
        "updated_at": "2025-06-09T10:00:00.000Z"
      }
    }
    ```

### `POST /auth/login`

Logs in an approved user and returns a JWT for accessing protected routes.

-   **Authorization:** Public
-   **Request Body:**
    ```json
    {
      "email": "jane.resident@example.com",
      "password": "SecurePassword123!"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "message": "Login successful.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 5,
        "name": "Jane Resident",
        "email": "jane.resident@example.com",
        "role": "member",
        "status": "approved"
        // ... other user fields
      }
    }
    ```

### `POST /auth/forgot-password`

Initiates the password reset process. If the user exists and is active, a password reset link will be generated (in a real implementation, this would be emailed).

-   **Authorization:** Public
-   **Request Body:**
    ```json
    {
      "email": "jane.resident@example.com"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "message": "Password reset email sent. Please check your inbox."
    }
    ```
 -   Rate limiting: This endpoint is limited per account to once every `PASSWORD_RESET_COOLDOWN_MINUTES` (default 60). Exceeding this returns HTTP 429 with a descriptive message.

### `POST /auth/reset-password`

Resets the user's password using the token from the forgot-password flow.

-   **Authorization:** Public
-   **Request Body:**
    ```json
    {
      "token": "THE_GENERATED_TOKEN_FROM_EMAIL",
      "newPassword": "NewerSecurePassword456!"
    }
    ```
-   **Success Response (200 OK):**
    ```json
    {
      "message": "Password has been reset successfully."
    }
    ```
-   **Note:** The `token` is the plain token from the reset link, not a JWT. The new password must meet complexity requirements (min 8 characters, uppercase, lowercase, number, special character).

### `GET /auth/verify-email`

Verifies a user's email using a token sent during registration.

-   **Authorization:** Public
-   **Query Params:** `token` (string)
-   **Success Response (200 OK):**
    ```json
    { "message": "Email verified successfully." }
    ```

### `POST /auth/resend-verification`

Resends the verification email to a user who has not yet verified their address.

-   **Authorization:** Public
-   **Request Body:**
    ```json
    { "email": "user@example.com" }
    ```
-   **Success Response (200 OK):**
    ```json
    { "message": "Verification email sent." }
    ```

---

## 3. Data Models

These are the primary data objects returned by the API.

### User Object

Represents a user account in the system. The `password` field is never returned.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: 'member' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  email_verified: boolean;
  is_system_user: boolean; // System users cannot be modified/deleted by admins
  created_at: string; // ISO 8601 Date
  updated_at: string; // ISO 8601 Date
}
```

### Announcement Object

Represents a site-wide announcement.

```typescript
interface Announcement {
  id: number;
  title: string;
  content: string; // Sanitized HTML content
  created_by: number;
  expires_at: string | null; // ISO 8601 Date
  created_at: string; // ISO 8601 Date
  updated_at: string; // ISO 8601 Date
  creator?: { // Included in list views
    id: number;
    name: string;
  };
}
```

### Announcements API

-   `POST /announcements` (admin): accepts body fields `title`, `content`, optional `expiresAt`, and optional `notify` (boolean). If `notify` is `true`, the system emails the announcement to all approved, verified, non-system users.
-   `PUT /announcements/{id}` (admin): optional `notify` to trigger a resend (use with care).

Email behavior:
- Password reset, email verification, admin approval/rejection, and optional announcement notifications are delivered via SendGrid. Configure `EMAIL_PROVIDER`, `SENDGRID_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, and `FRONTEND_BASE_URL`.

CAPTCHA:
- Registration is protected with Cloudflare Turnstile. Configure `TURNSTILE_SECRET_KEY` (backend) and `VITE_TURNSTILE_SITE_KEY` (frontend).

### Event Object

Represents a community event.

```typescript
interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string; // ISO 8601 Date
  end_date: string; // ISO 8601 Date
  location: string;
  created_by: number;
  created_at: string; // ISO 8601 Date
  updated_at: string; // ISO 8601 Date
  creator?: { // Included in list views
    id: number;
    name: string;
  };
}
```

### Document Object

Represents a file uploaded to the system.

```typescript
interface Document {
  id: number;
  title: string;
  description: string | null;
  file_name: string; // Unique stored filename
  original_file_name: string; // User-facing filename
  file_path: string; // Server-side path (not for client use)
  uploaded_by: number;
  approved: boolean;
  is_public: boolean;
  uploaded_at: string; // ISO 8601 Date
  updated_at: string; // ISO 8601 Date
  uploader?: { // Included in list views
    id: number;
    name: string;
  };
}
```

### Discussion Object

Represents a discussion thread or a reply.

```typescript
interface Discussion {
  id: number;
  title: string | null; // Null for replies
  content: string; // Sanitized HTML content
  user_id: number;
  parent_id: number | null; // Null for main threads
  created_at: string; // ISO 8601 Date
  updated_at: string; // ISO 8601 Date
  author?: { // Included in list/view endpoints
    id: number;
    name: string;
  };
  // 'reply_count' is included in thread lists
  reply_count?: number; 
}
```

### Config Object

Represents a key-value site configuration setting.

```typescript
interface Config {
  [key: string]: string; // e.g., { "hoa_name": "Sanderson Creek HOA" }
}
```

### AuditLog Object

Represents a logged administrative action.

```typescript
interface AuditLog {
  id: number;
  admin_name: string; // Name of the admin who performed the action
  action: string; // e.g., 'user_status_update'
  details: object; // JSON object with details of the action
  created_at: string; // ISO 8601 Date
}
```
---

## 4. API Endpoints

### 4.1. User Profile (Self-Management)

These endpoints allow authenticated users to manage their own profiles.

-   **Base Path:** `/api/users`
-   **Authorization:** `Member` or `Admin`

#### `GET /me`
-   **Description:** Retrieves the profile of the currently authenticated user.
-   **Success Response (200 OK):** A `User` object.

#### `PUT /me`
-   **Description:** Updates the authenticated user's name.
-   **Request Body:** `{ "name": "New Name" }`
-   **Success Response (200 OK):** The updated `User` object.

#### `PUT /me/password`
-   **Description:** Changes the authenticated user's password.
-   **Request Body:** `{ "currentPassword": "oldPassword", "newPassword": "NewSecurePassword123!" }`
-   **Success Response (200 OK):** `{ "message": "Password changed successfully." }`

### 4.2. Announcements

Endpoints for managing and viewing announcements.

-   **Base Path:** `/api/announcements`

#### `GET /`
-   **Description:** Lists active announcements. Useful for the main dashboard.
-   **Authorization:** `Member` or `Admin`
-   **Query Parameters:**
    -   `page` (number, optional, default: 1)
    -   `limit` (number, optional, default: 10)
    -   `status` (string, optional, must be 'active'): Filters for non-expired announcements.
    -   `sortBy` (string, optional, default: 'created_at')
    -   `sortOrder` (string, optional, 'ASC' or 'DESC')
-   **Success Response (200 OK):**
    ```json
    {
      "data": [ /* Array of Announcement objects */ ],
      "pagination": {
        "totalItems": 15,
        "totalPages": 2,
        "currentPage": 1,
        "limit": 10
      }
    }
    ```

#### `POST /`
-   **Description:** Creates a new announcement.
-   **Authorization:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "title": "Community Pool Maintenance",
      "content": "<p>The community pool will be closed for maintenance from June 10th to June 12th.</p>",
      "expiresAt": "2025-06-13T00:00:00.000Z" // Optional
    }
    ```
-   **Success Response (201 Created):** An `Announcement` object.

#### `PUT /:id`
-   **Description:** Updates an existing announcement.
-   **Authorization:** `Admin Only`
-   **Request Body:** `{ "title": "...", "content": "...", "expires_at": "..." }` (at least one field required)
-   **Success Response (200 OK):** The updated `Announcement` object.

#### `DELETE /:id`
-   **Description:** Deletes an announcement.
-   **Authorization:** `Admin Only`
-   **Success Response (204 No Content):** No body.

### 4.3. Events

Endpoints for managing and viewing community events.

-   **Base Path:** `/api/events`

#### `GET /`
-   **Description:** Lists community events. The main event calendar view.
-   **Authorization:** `Member` or `Admin`
-   **Query Parameters:**
    -   `status` (string, optional, default: 'upcoming'): Can be `upcoming` or `past`.
    -   `page`, `limit`, `sortBy` ('event_date', 'title', 'created_at'), `sortOrder`
-   **Success Response (200 OK):** Paginated list of `Event` objects.

#### `POST /`
-   **Description:** Creates a new event.
-   **Authorization:** `Admin Only`
-   **Request Body:**
    ```json
    {
      "title": "Annual HOA BBQ",
      "description": "Join us for our annual community BBQ!",
      "event_date": "2025-07-04T12:00:00.000Z", // Maps to start_date
      "location": "Community Park"
    }
    ```
-   **Success Response (201 Created):** An `Event` object.

#### `PUT /:id`
-   **Description:** Updates an existing event.
-   **Authorization:** `Admin Only`
-   **Request Body:** `{ "title": "...", "description": "...", "start_date": "...", "end_date": "...", "location": "..." }`
-   **Success Response (200 OK):** The updated `Event` object.

#### `DELETE /:id`
-   **Description:** Deletes an event.
-   **Authorization:** `Admin Only`
-   **Success Response (204 No Content):** No body.

### 4.4. Documents

Endpoints for managing and accessing documents. Note the two base paths for admin vs. public access.

-   **Public/Member Base Path:** `/api/documents`
-   **Admin Base Path:** `/api/admin/documents`

#### `GET /api/documents`
-   **Description:** Lists documents. Guests see only `public` and `approved` documents. Members see all `approved` documents. Admins see all documents via this route if authenticated.
-   **Authorization:** `Optional` (Public, Member, or Admin)
-   **Query Parameters:** `limit`, `offset`
-   **Success Response (200 OK):** `{ "count": 20, "documents": [ /* Array of Document objects */ ] }`

#### `GET /api/documents/:documentId`
-   **Description:** Gets metadata for a single document, respecting access permissions.
-   **Authorization:** `Optional`
-   **Success Response (200 OK):** A `Document` object.

#### `GET /api/documents/:documentId/download`
-   **Description:** Downloads the physical file for a document, respecting access permissions.
-   **Authorization:** `Optional`
-   **Success Response (200 OK):** The file stream with appropriate `Content-Type` header.

#### `POST /api/admin/documents`
-   **Description:** Uploads a new document.
-   **Authorization:** `Admin Only`
-   **Request Body:** `multipart/form-data`
    -   `documentFile`: The file to upload (PDF, DOC/DOCX, JPG, PNG, GIF). Max 10MB.
    -   `title` (string): Title of the document.
    -   `description` (string, optional): Description of the document.
    -   `is_public` (boolean): `true` if the document should be visible to guests.
-   **Success Response (201 Created):** `{ "message": "...", "document": { ...Document object... } }`

#### `PUT /api/admin/documents/:id/approve`
-   **Description:** Approves a document, making it visible to members (and public if flagged).
-   **Authorization:** `Admin Only`
-   **Success Response (200 OK):** The updated `Document` object.

#### `DELETE /api/admin/documents/:id`
-   **Description:** Deletes a document record and its physical file.
-   **Authorization:** `Admin Only`
-   **Success Response (204 No Content):** No body.

### 4.5. Discussions

Endpoints for the community discussion forum.

-   **Base Path:** `/api/discussions`
-   **Authorization:** `Member` or `Admin`

#### `GET /`
-   **Description:** Lists all main discussion threads (not replies), including author info and reply count.
-   **Query Parameters:** `page`, `limit`
-   **Success Response (200 OK):** Paginated list of `Discussion` objects.

#### `POST /`
-   **Description:** Creates a new main discussion thread.
-   **Request Body:** `{ "title": "New Thread Title", "content": "My question is..." }`
-   **Success Response (201 Created):** A `Discussion` object.

#### `GET /:threadId`
-   **Description:** Retrieves a single main thread and all of its replies, sorted chronologically.
-   **Success Response (200 OK):** `{ "mainThread": { ...Discussion object... }, "replies": [ /* Array of Discussion objects */ ] }`

#### `POST /:threadId/replies`
-   **Description:** Adds a reply to a specific discussion thread.
-   **Request Body:** `{ "content": "This is my reply." }`
-   **Success Response (201 Created):** The new reply `Discussion` object.

#### `DELETE /:threadId`
-   **Description:** Deletes a main discussion thread and all its replies.
-   **Authorization:** `Admin Only`
-   **Success Response (204 No Content):** No body.

#### `DELETE /replies/:replyId`
-   **Description:** Deletes a single reply.
-   **Authorization:** `Admin Only`
-   **Success Response (204 No Content):** No body.

### 4.6. Administration

Endpoints reserved for high-level administrative tasks.

#### User Management
-   **Base Path:** `/api/admin/users`
-   **Authorization:** `Admin Only`

-   **`GET /`**: Lists all non-system users. Supports `limit` and `offset` query params.
-   **`GET /:userId`**: Gets a specific non-system user's details.
-   **`PUT /:userId/status`**: Updates a user's status. Body: `{ "status": "approved" | "pending" | "rejected" }`.
-   **`PUT /:userId/role`**: Updates a user's role. Body: `{ "role": "admin" | "member" }`.
-   **`PUT /:userId/password`**: Changes a user's password. Body: `{ "newPassword": "..." }`.
-   **`DELETE /:userId`**: Deletes a user and all their associated content (e.g., uploaded documents).

#### Site Configuration
-   **Base Path:** `/api/admin/config`
-   **Authorization:** `Admin Only`

-   **`GET /`**: Retrieves all site configuration key-value pairs.
-   **`PUT /:key`**: Updates or creates a configuration value. Body: `{ "value": "New HOA Name" }`.

#### Audit Logs
-   **Base Path:** `/api/admin/audit-logs`
-   **Authorization:** `Admin Only`

-   **`GET /`**: Retrieves a paginated list of all administrative actions. Supports `page` and `limit` query params.

---

## 5. UI/UX Implementation Guidance

Based on this API, a modern and "beautiful" web client could be structured as follows:

### 5.1. Public-Facing Pages (No Login Required)

-   **Login Page:** Uses the `/api/auth/login` endpoint. Include a "Forgot Password?" link.
-   **Registration Page:** Uses `/api/auth/register`. Clearly state that accounts require admin approval.
-   **Password Reset Page:** A two-step process. A page to request the reset (`/api/auth/forgot-password`), and a page that accepts the token from the email link to set a new password (`/api/auth/reset-password`).
-   **Public Content:** A section of the site could display public-only documents (`GET /api/documents` without a token) or announcements, creating a welcoming portal for prospective residents.

### 5.2. Member-Authenticated Area

This is the main dashboard for residents.

-   **Dashboard Home:** The landing page after login. Should prominently display a feed of the latest announcements (`GET /api/announcements`) and a list or calendar of upcoming events (`GET /api/events`).
-   **Documents Library:** A searchable, filterable view of all approved documents (`GET /api/documents`). Each document should be viewable (metadata) and downloadable.
-   **Discussion Forum:** A page listing all discussion threads (`GET /api/discussions`) with links to view a single thread and its replies (`GET /api/discussions/:threadId`). Users should be able to create new threads and post replies.
-   **My Profile:** A page for users to view (`GET /api/users/me`), update their name (`PUT /api/users/me`), and change their password (`PUT /api/users/me/password`).

### 5.3. Admin-Authenticated Area

A separate, secure section of the site for administrators. This should have a distinct layout, possibly with a sidebar for navigation.

-   **Admin Dashboard:** Could provide a high-level overview: number of pending users, recent activities, etc.
-   **User Management:** A table of all users (`GET /api/admin/users`).
    -   Provide actions to **approve/reject/pending** user status (`PUT /api/admin/users/:id/status`). This is a key workflow.
    -   Provide actions to change a user's role, change their password, or delete them entirely.
-   **Content Management:**
    -   **Announcements:** A view to list, create, edit, and delete announcements.
    -   **Events:** A view to list, create, edit, and delete events.
    -   **Documents:** A comprehensive view of all documents (approved or not). Admins should have clear "Approve" and "Delete" buttons for each document. A dedicated upload form should use the `POST /api/admin/documents` endpoint.
-   **Site Settings:** A form to manage site configuration (`GET /api/admin/config` to populate, `PUT /api/admin/config/:key` to save), allowing admins to change the HOA Name, Description, etc.
-   **Audit Trail:** A page to display the audit logs (`GET /api/admin/audit-logs`) in a clear, paginated table, showing which admin performed what action and when. This is crucial for accountability.
