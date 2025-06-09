# HOA Management System API Documentation

## Table of Contents

1.  [Introduction](#introduction)
    *   [Base URL](#base-url)
    *   [Authentication](#authentication)
2.  [API Endpoints](#api-endpoints)
    *   [Auth](#auth)
    *   [Users (Self-Management)](#users-self-management)
    *   [Admin: User Management](#admin-user-management)
    *   [Documents (Public/User)](#documents-publicuser)
    *   [Admin: Document Management](#admin-document-management)
    *   [Announcements](#announcements)
    *   [Events](#events)
    *   [Discussions](#discussions)
    *   [Admin: Configuration](#admin-configuration)
    *   [Admin: Audit Logs](#admin-audit-logs)
3.  [Common Schemas](#common-schemas)

---

## 1. Introduction

This document provides a comprehensive overview of the API for the HOA Management System. It details available endpoints, request/response formats, and authentication requirements.

### Base URL

The base URL for all API endpoints is not explicitly defined but typically would be something like `http://localhost:3001/api` or `https://yourdomain.com/api`. For the purpose of this documentation, endpoint paths will be shown relative to `/api`.

### Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT).

*   **Obtaining a Token**: A JWT is obtained by successfully calling the `POST /auth/login` endpoint.
*   **Using a Token**: The obtained JWT must be included in the `Authorization` header of subsequent requests to protected endpoints. The format is:
    `Authorization: Bearer <YOUR_JWT_TOKEN>`

**User Roles:**

*   `member`: Standard authenticated user.
*   `admin`: Administrator with elevated privileges.

Some endpoints are public, while others require authentication, and some are restricted to specific roles (typically 'admin').

---

## 2. API Endpoints

### Auth

Handles user registration, login, and password management.

#### `POST /auth/register`

Register a new user account. Accounts are created with 'member' role and 'pending' status, requiring admin approval.

*   **Authentication**: Public
*   **Request Body**: `application/json`
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "password": "Password123!"
    }
    ```
    *   `name` (string, required): User's full name.
    *   `email` (string, required, email format): User's email address. Must be unique.
    *   `password` (string, required): User's password. Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.
*   **Responses**:
    *   **201 Created**: Registration successful.
        ```json
        {
          "message": "Registration successful. Your account is pending approval.",
          "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "member",
            "status": "pending",
            "email_verified": false,
            "is_system_user": false,
            "created_at": "2025-06-01T12:00:00.000Z",
            "updated_at": "2025-06-01T12:00:00.000Z"
          }
        }
        ```
    *   **400 Bad Request**: Validation failed.
        ```json
        {
          "message": "Validation failed.",
          "errors": ["Name is required."]
        }
        ```
    *   **409 Conflict**: Email already registered.
        ```json
        {
          "error": "Email already registered."
        }
        ```
    *   **500 Internal Server Error**: Server error.

---

#### `POST /auth/login`

Log in an existing user. Returns a JWT upon successful authentication of an approved account.

*   **Authentication**: Public
*   **Request Body**: `application/json`
    ```json
    {
      "email": "john.doe@example.com",
      "password": "Password123!"
    }
    ```
    *   `email` (string, required, email format): User's email.
    *   `password` (string, required): User's password.
*   **Responses**:
    *   **200 OK**: Login successful.
        ```json
        {
          "message": "Login successful.",
          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john.doe@example.com",
            "role": "member",
            "status": "approved",
            "email_verified": false,
            "is_system_user": false,
            "created_at": "2025-06-01T12:00:00.000Z",
            "updated_at": "2025-06-01T12:05:00.000Z"
          }
        }
        ```
    *   **400 Bad Request**: Validation failed.
    *   **401 Unauthorized**: Invalid email or password.
        ```json
        {
          "error": "Invalid email or password."
        }
        ```
    *   **403 Forbidden**: Account not approved or access denied (e.g., "Account pending approval.").
        ```json
        {
          "error": "Account pending approval."
        }
        ```
    *   **500 Internal Server Error**.

---

#### `POST /auth/forgot-password`

Request a password reset token. An email (simulated by console log in current dev setup) will be sent to the user with a reset link.

*   **Authentication**: Public
*   **Request Body**: `application/json`
    ```json
    {
      "email": "user@example.com"
    }
    ```
    *   `email` (string, required, email format): User's email address.
*   **Responses**:
    *   **200 OK**: Password reset email sent (simulated).
        ```json
        {
          "message": "Password reset email sent. Please check your inbox."
        }
        ```
    *   **400 Bad Request**: Invalid email format or user account not active/eligible.
        ```json
        {
          "error": "User account is not active or eligible for password reset."
        }
        ```
    *   **404 Not Found**: Email not found.
        ```json
        {
          "error": "Email not found."
        }
        ```
    *   **500 Internal Server Error**.

---

#### `GET /auth/verify-reset-token`

Verify the validity of a password reset token.

*   **Authentication**: Public
*   **Query Parameters**:
    *   `token` (string, required): The password reset token from the email link.
*   **Responses**:
    *   **200 OK**: Token is valid.
        ```json
        {
          "message": "Token is valid."
        }
        ```
    *   **400 Bad Request**: Invalid or expired password reset token.
        ```json
        {
          "error": "Invalid or expired password reset token."
        }
        ```
    *   **500 Internal Server Error**.

---

#### `POST /auth/reset-password`

Reset the user's password using a valid token and a new password.

*   **Authentication**: Public
*   **Request Body**: `application/json`
    ```json
    {
      "token": "THE_GENERATED_TOKEN_FROM_EMAIL",
      "newPassword": "NewSecurePassword123!"
    }
    ```
    *   `token` (string, required): The password reset token.
    *   `newPassword` (string, required): The new password. Must meet complexity requirements (Min 8 chars, uppercase, lowercase, number, special char).
*   **Responses**:
    *   **200 OK**: Password reset successfully.
        ```json
        {
          "message": "Password has been reset successfully."
        }
        ```
    *   **400 Bad Request**: Invalid/expired token, password complexity not met, or missing fields.
        ```json
        {
          "error": "Invalid or expired password reset token." 
        }
        ```
        ```json
        {
          "error": "Password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
        }
        ```
    *   **500 Internal Server Error**.

---

### Users (Self-Management)

Endpoints for authenticated users to manage their own profiles.

#### `GET /users/me`

Retrieve the profile of the currently authenticated user.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Responses**:
    *   **200 OK**: Successfully retrieved user profile.
        ```json
        {
          "id": 1,
          "name": "Current User Name",
          "email": "current.user@example.com",
          "role": "member",
          "status": "approved",
          "created_at": "2025-01-15T10:30:00.000Z",
          "updated_at": "2025-01-16T11:00:00.000Z"
        }
        ```
    *   **401 Unauthorized**: Token missing or invalid.
    *   **404 Not Found**: User profile not found (unlikely if token is valid).
    *   **500 Internal Server Error**.

---

#### `PUT /users/me`

Update the profile of the currently authenticated user. Currently, only 'name' is updatable.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Request Body**: `application/json`
    ```json
    {
      "name": "New User Name"
    }
    ```
    *   `name` (string, optional): New name for the user. Cannot be empty if provided.
*   **Responses**:
    *   **200 OK**: Profile updated successfully. Returns updated user profile.
        ```json
        {
          "id": 1,
          "name": "New User Name",
          "email": "current.user@example.com",
          "role": "member",
          "status": "approved",
          "created_at": "2025-01-15T10:30:00.000Z",
          "updated_at": "2025-06-01T14:20:00.000Z"
        }
        ```
    *   **400 Bad Request**: Validation failed (e.g., empty name).
        ```json
        {
          "errors": [{ "name": "Name cannot be empty." }]
        }
        ```
    *   **401 Unauthorized**: Token missing or invalid.
    *   **500 Internal Server Error**.

---

#### `PUT /users/me/password`

Change the password for the currently authenticated user.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Request Body**: `application/json`
    ```json
    {
      "currentPassword": "OldSecurePassword123!",
      "newPassword": "BrandNewSecurePassword456$"
    }
    ```
    *   `currentPassword` (string, required): User's current password.
    *   `newPassword` (string, required): New password. Must meet complexity requirements.
*   **Responses**:
    *   **200 OK**: Password changed successfully.
        ```json
        {
          "message": "Password changed successfully."
        }
        ```
    *   **400 Bad Request**: Validation failed (e.g., missing fields, new password complexity).
        ```json
        {
          "error": "New password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
        }
        ```
    *   **401 Unauthorized**: Token missing or invalid.
    *   **403 Forbidden**: Incorrect current password.
        ```json
        {
          "error": "Incorrect current password."
        }
        ```
    *   **500 Internal Server Error**.

---

### Admin: User Management

Endpoints for administrators to manage user accounts. All endpoints require 'admin' role.

#### `GET /admin/users`

List all non-system users. Supports pagination.

*   **Authentication**: Admin
*   **Query Parameters**:
    *   `limit` (integer, optional, default: 10): Number of users per page.
    *   `offset` (integer, optional, default: 0): Number of users to skip.
*   **Responses**:
    *   **200 OK**: A list of non-system users.
        ```json
        {
          "count": 15,
          "users": [ // Actually "rows" in user.service.js, controller might rename
            {
              "id": 2,
              "name": "Jane Member",
              "email": "jane.member@example.com",
              "role": "member",
              "status": "approved",
              "created_at": "2025-05-20T10:00:00.000Z",
              "updated_at": "2025-05-20T10:00:00.000Z"
            }
            // ... more users
          ]
        }
        ```
    *   **401 Unauthorized**: Token missing or invalid.
    *   **403 Forbidden**: User is not an admin.
    *   **500 Internal Server Error**.

---

#### `GET /admin/users/{userId}`

Get a specific non-system user by ID.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `userId` (integer, required): The ID of the user to retrieve.
*   **Responses**:
    *   **200 OK**: Details of the non-system user. (Schema: `UserResponse`)
    *   **400 Bad Request**: Invalid user ID format.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: User not found or is a system user.
    *   **500 Internal Server Error**.

---

#### `PUT /admin/users/{userId}/status`

Update a user's status (e.g., approve a pending registration).

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `userId` (integer, required): The ID of the user.
*   **Request Body**: `application/json`
    ```json
    {
      "status": "approved"
    }
    ```
    *   `status` (string, required): New status. Enum: `approved`, `pending`, `rejected`.
*   **Responses**:
    *   **200 OK**: User status updated. Returns updated user object. (Schema: `UserResponse`)
    *   **400 Bad Request**: Invalid ID or validation failed for status.
    *   **401 Unauthorized**.
    *   **403 Forbidden**: User is not admin, or trying to update a system user.
    *   **404 Not Found**: User not found.
    *   **500 Internal Server Error**.

---

#### `PUT /admin/users/{userId}/role`

Update a user's role.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `userId` (integer, required): The ID of the user.
*   **Request Body**: `application/json`
    ```json
    {
      "role": "admin"
    }
    ```
    *   `role` (string, required): New role. Enum: `admin`, `member`.
*   **Responses**:
    *   **200 OK**: User role updated. Returns updated user object. (Schema: `UserResponse`)
    *   **400 Bad Request**: Invalid ID or validation failed for role.
    *   **401 Unauthorized**.
    *   **403 Forbidden**: User is not admin, or trying to update a system user.
    *   **404 Not Found**: User not found.
    *   **500 Internal Server Error**.

---

#### `DELETE /admin/users/{userId}`

Delete a non-system user and their associated data (e.g., documents).

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `userId` (integer, required): The ID of the user to delete.
*   **Responses**:
    *   **200 OK**: User deleted successfully.
        ```json
        {
          "message": "User and associated data deleted successfully."
        }
        ```
    *   **204 No Content**: User deleted successfully.
    *   **400 Bad Request**: Invalid user ID format.
    *   **401 Unauthorized**.
    *   **403 Forbidden**: User is not admin, or trying to delete a system user.
    *   **404 Not Found**: User not found.
    *   **500 Internal Server Error**.

---

#### `PUT /admin/users/{userId}/password`

Change a specific user's password (admin action).

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `userId` (integer, required): The ID of the user.
*   **Request Body**: `application/json`
    ```json
    {
      "newPassword": "NewUserPassword123!"
    }
    ```
    *   `newPassword` (string, required): The new password for the user. Must meet complexity requirements.
*   **Responses**:
    *   **200 OK**: User password changed successfully.
        ```json
        {
          "message": "User password changed successfully."
        }
        ```
    *   **400 Bad Request**: Invalid ID or validation failed for `newPassword`.
    *   **401 Unauthorized**.
    *   **403 Forbidden**: User is not admin, or trying to change password for a system user.
    *   **404 Not Found**: User not found.
    *   **500 Internal Server Error**.

---

### Documents (Public/User)

Endpoints for listing and downloading documents, accessible based on permissions.
*(These routes are defined in `document.routes.js` but their mount point under `/api/documents` is assumed based on Swagger/plan, as `app.js` currently only mounts this router under `/api/admin/documents`)*

#### `GET /documents`

List available documents. Access permissions are applied based on authentication status.
Guests see public, approved documents. Members see all approved documents. Admins see all documents.

*   **Authentication**: Optional (Public / Authenticated User)
*   **Query Parameters**:
    *   `limit` (integer, optional, default: 10): Number of documents per page.
    *   `offset` (integer, optional, default: 0): Number of documents to skip.
*   **Responses**:
    *   **200 OK**: A list of documents.
        ```json
        {
          "count": 5,
          "documents": [
            {
              "id": 1,
              "title": "Meeting Minutes Q1",
              "description": "Minutes from the first quarter HOA meeting.",
              "file_name": "doc-unique-name.pdf",
              "original_file_name": "Q1_Minutes.pdf",
              "file_path": "/path/on/server/doc-unique-name.pdf",
              "uploaded_by": { "id": 1, "name": "Admin User" },
              "uploaded_at": "2025-03-10T14:30:00.000Z",
              "approved": true,
              "is_public": true,
              "updated_at": "2025-03-10T14:30:00.000Z"
            }
            // ... more documents
          ]
        }
        ```
    *   **500 Internal Server Error**.

---

#### `GET /documents/{documentId}`

Get metadata for a specific document. Access permissions apply.

*   **Authentication**: Optional (Public / Authenticated User)
*   **Path Parameters**:
    *   `documentId` (integer, required): The ID of the document.
*   **Responses**:
    *   **200 OK**: Document metadata. (Schema: `DocumentResponse`)
    *   **400 Bad Request**: Invalid document ID format.
    *   **403 Forbidden**: Access denied to this document.
    *   **404 Not Found**: Document not found.
    *   **500 Internal Server Error**.

---

#### `GET /documents/{documentId}/download`

Download a specific document file. Access permissions apply.

*   **Authentication**: Optional (Public / Authenticated User) - Required for non-public or unapproved (for admin) documents.
*   **Path Parameters**:
    *   `documentId` (integer, required): The ID of the document.
*   **Responses**:
    *   **200 OK**: Document file. `Content-Type` will vary based on file type. `Content-Disposition` header prompts download.
    *   **400 Bad Request**: Invalid document ID format.
    *   **401 Unauthorized**: Authentication required for this document.
    *   **403 Forbidden**: Access denied to this document.
    *   **404 Not Found**: Document not found.
    *   **500 Internal Server Error**: Could not download the file.

---

### Admin: Document Management

Endpoints for administrators to manage documents. All require 'admin' role.

#### `POST /admin/documents`

Upload a new document.

*   **Authentication**: Admin
*   **Request Body**: `multipart/form-data`
    *   `documentFile` (file, required): The document file.
    *   `title` (string, required): Title for the document.
    *   `description` (string, optional): Description for the document.
    *   `is_public` (boolean, required): Whether the document is publicly accessible. If true, document is also auto-approved.
*   **Responses**:
    *   **201 Created**: Document uploaded successfully.
        ```json
        {
          "message": "Document uploaded successfully.",
          "document": { /* DocumentResponse Schema */ }
        }
        ```
    *   **400 Bad Request**: Validation failed, no file uploaded, file type not allowed, or file too large.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**.

---

#### `PUT /admin/documents/{id}/approve`

Approve a document.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the document to approve.
*   **Responses**:
    *   **200 OK**: Document approved successfully. Returns updated document object. (Schema: `DocumentResponse`)
    *   **400 Bad Request**: Invalid document ID format.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Document not found.
    *   **500 Internal Server Error**.

---

#### `DELETE /admin/documents/{id}`

Delete a document. This also deletes the physical file from the server.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the document to delete.
*   **Responses**:
    *   **204 No Content**: Document deleted successfully.
    *   **400 Bad Request**: Invalid document ID format.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Document not found.
    *   **500 Internal Server Error**.

---

### Announcements

Endpoints for managing and viewing announcements.

#### `GET /announcements`

List announcements. Default is active, paginated, sorted by creation date descending.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Query Parameters**:
    *   `page` (integer, optional, default: 1): Page number.
    *   `limit` (integer, optional, default: 10): Items per page (max 100).
    *   `status` (string, optional, default: 'active'): Filter by status. Currently only 'active' is supported (not expired).
    *   `sortBy` (string, optional, default: 'created_at'): Field to sort by (currently only 'created_at').
    *   `sortOrder` (string, optional, default: 'DESC'): Sort order ('ASC' or 'DESC').
*   **Responses**:
    *   **200 OK**: A list of announcements with pagination.
        ```json
        {
          "data": [
            {
              "id": 1,
              "title": "Pool Maintenance Next Week",
              "content": "<p>The community pool will be closed...</p>",
              "created_by": { "id": 2, "name": "Admin User" },
              "created_at": "2025-06-05T10:00:00.000Z",
              "updated_at": "2025-06-05T10:00:00.000Z",
              "expires_at": "2025-06-15T23:59:59.000Z"
            }
          ],
          "pagination": {
            "totalItems": 10,
            "totalPages": 1,
            "currentPage": 1,
            "limit": 10
          }
        }
        ```
    *   **400 Bad Request**: Invalid query parameters.
    *   **401 Unauthorized**.
    *   **500 Internal Server Error**.

---

#### `POST /announcements`

Create a new announcement.

*   **Authentication**: Admin
*   **Request Body**: `application/json`
    ```json
    {
      "title": "New Maintenance Schedule",
      "content": "<p>Details about the new schedule...</p>",
      "expiresAt": "2025-07-01T23:59:59.000Z"
    }
    ```
    *   `title` (string, required, max 255): Announcement title.
    *   `content` (string, required): Announcement content (HTML sanitized on server).
    *   `expiresAt` (string, optional, ISO 8601 date): Expiration date. Must be in the future.
*   **Responses**:
    *   **201 Created**: Announcement created. Returns created announcement. (Schema: `AnnouncementResponse`)
    *   **400 Bad Request**: Validation failed.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**.

---

#### `PUT /announcements/{id}`

Update an existing announcement.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the announcement.
*   **Request Body**: `application/json`
    ```json
    {
      "title": "Updated Maintenance Schedule",
      "content": "<p>Updated details...</p>",
      "expires_at": "2025-07-15T23:59:59.000Z"
    }
    ```
    *   `title` (string, optional, max 255): New title.
    *   `content` (string, optional): New content (HTML sanitized).
    *   `expires_at` (string, optional, ISO 8601 date or null): New expiration date.
*   **Responses**:
    *   **200 OK**: Announcement updated. Returns updated announcement. (Schema: `AnnouncementResponse`)
    *   **400 Bad Request**: Validation failed or no fields to update.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Announcement not found.
    *   **500 Internal Server Error**.

---

#### `DELETE /announcements/{id}`

Delete an announcement.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the announcement.
*   **Responses**:
    *   **204 No Content**: Announcement deleted.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Announcement not found.
    *   **500 Internal Server Error**.

---

### Events

Endpoints for managing and viewing community events.

#### `GET /events`

List community events. Supports filtering by status (upcoming/past) and pagination/sorting.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Query Parameters**:
    *   `status` (string, optional, default: 'upcoming'): `upcoming` or `past`.
    *   `page` (integer, optional, default: 1): Page number.
    *   `limit` (integer, optional, default: 10): Items per page (max 50).
    *   `sortBy` (string, optional, default: 'event_date'): `event_date` (maps to start_date), `title`, `created_at`.
    *   `sortOrder` (string, optional): `asc` or `desc`. Default depends on `sortBy` and `status`.
*   **Responses**:
    *   **200 OK**: A list of events with pagination.
        ```json
        {
          "data": [
            {
              "id": 1,
              "title": "Community BBQ",
              "description": "Join us for a fun community BBQ event.",
              "event_date": "2025-07-15T18:00:00.000Z",
              "end_date": "2025-07-15T21:00:00.000Z",
              "location": "Community Park Pavilion",
              "created_by": { "id": 5, "name": "Admin User" },
              "created_at": "2025-06-01T10:00:00.000Z",
              "updated_at": "2025-06-01T10:00:00.000Z"
            }
          ],
          "pagination": {
            "totalItems": 5,
            "totalPages": 1,
            "currentPage": 1,
            "limit": 10,
            "hasNextPage": false,
            "hasPrevPage": false
          }
        }
        ```
    *   **400 Bad Request**: Invalid query parameters.
    *   **401 Unauthorized**.
    *   **500 Internal Server Error**.

---

#### `POST /events`

Create a new event.

*   **Authentication**: Admin
*   **Request Body**: `application/json`
    ```json
    {
      "title": "Annual HOA Meeting",
      "description": "Discussion of yearly budget and plans.",
      "event_date": "2025-08-01T19:00:00.000Z", 
      "location": "Community Hall"
    }
    ```
    *   `title` (string, required, 3-255 chars): Event title.
    *   `description` (string, required, min 10 chars): Event description.
    *   `event_date` (string, required, ISO 8601 date): Event start date/time. Must be in the future. `end_date` defaults to `event_date`.
    *   `location` (string, required, max 255 chars): Event location.
*   **Responses**:
    *   **201 Created**: Event created. Returns created event. (Schema: `EventResponse`)
    *   **400 Bad Request**: Validation failed.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**.

---

#### `PUT /events/{id}`

Update an existing event.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the event.
*   **Request Body**: `application/json`
    ```json
    {
      "title": "Updated Annual HOA Meeting",
      "description": "Updated agenda.",
      "start_date": "2025-08-02T19:00:00.000Z",
      "end_date": "2025-08-02T21:00:00.000Z",
      "location": "Main Conference Room"
    }
    ```
    *   `title` (string, optional).
    *   `description` (string, optional).
    *   `start_date` (string, optional, ISO 8601 date): New start date.
    *   `end_date` (string, optional, ISO 8601 date): New end date. Must be after `start_date`.
    *   `location` (string, optional).
*   **Responses**:
    *   **200 OK**: Event updated. Returns updated event. (Schema: `EventResponse`)
    *   **400 Bad Request**: Validation failed (e.g., end_date before start_date).
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Event not found.
    *   **500 Internal Server Error**.

---

#### `DELETE /events/{id}`

Delete an event.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `id` (integer, required): The ID of the event.
*   **Responses**:
    *   **204 No Content**: Event deleted.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Event not found.
    *   **500 Internal Server Error**.

---

### Discussions

Endpoints for community discussions.

#### `POST /discussions`

Create a new discussion thread.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Request Body**: `application/json`
    ```json
    {
      "title": "New Landscaping Ideas",
      "content": "<p>Let's discuss some new ideas for the common areas.</p>"
    }
    ```
    *   `title` (string, required, 3-255 chars): Thread title.
    *   `content` (string, required, min 1 char): Thread content (HTML sanitized on server).
*   **Responses**:
    *   **201 Created**: Thread created. Returns created thread object. (Schema: `DiscussionThreadItem` with full content)
    *   **400 Bad Request**: Validation failed.
    *   **401 Unauthorized**.
    *   **500 Internal Server Error**.

---

#### `POST /discussions/{threadId}/replies`

Post a reply to an existing discussion thread.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Path Parameters**:
    *   `threadId` (integer, required): The ID of the parent discussion thread.
*   **Request Body**: `application/json`
    ```json
    {
      "content": "<p>I agree, that sounds like a great idea!</p>"
    }
    ```
    *   `content` (string, required, min 1 char): Reply content (HTML sanitized on server).
*   **Responses**:
    *   **201 Created**: Reply posted. Returns created reply object. (Schema: `DiscussionReplyItem`)
    *   **400 Bad Request**: Validation failed.
    *   **401 Unauthorized**.
    *   **404 Not Found**: Parent thread not found or is not a main thread.
    *   **500 Internal Server Error**.

---

#### `GET /discussions`

List all main discussion threads. Supports pagination.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Query Parameters**:
    *   `page` (integer, optional, default: 1): Page number.
    *   `limit` (integer, optional, default: 10): Items per page (max 50).
*   **Responses**:
    *   **200 OK**: A list of discussion threads with pagination.
        ```json
        {
          "totalItems": 20,
          "totalPages": 2,
          "currentPage": 1,
          "threads": [
            {
              "id": 5,
              "title": "Pool Opening Party",
              "content": "<p>When is the pool opening party this year?</p>",
              "created_at": "2025-05-01T10:00:00.000Z",
              "author": { "id": 3, "name": "Bob Builder" },
              "reply_count": 2
            }
            // ... more threads
          ]
        }
        ```
    *   **400 Bad Request**: Invalid query parameters.
    *   **401 Unauthorized**.
    *   **500 Internal Server Error**.

---

#### `GET /discussions/{threadId}`

View a specific discussion thread along with all its replies.

*   **Authentication**: Authenticated User (Member or Admin)
*   **Path Parameters**:
    *   `threadId` (integer, required): The ID of the main discussion thread.
*   **Responses**:
    *   **200 OK**: Detailed thread and its replies.
        ```json
        {
          "mainThread": {
            "id": 5,
            "title": "Pool Opening Party",
            "content": "<p>When is the pool opening party this year?</p>",
            "created_at": "2025-05-01T10:00:00.000Z",
            "author": { "id": 3, "name": "Bob Builder" }
          },
          "replies": [
            {
              "id": 10,
              "content": "<p>I heard it's the first weekend of June!</p>",
              "created_at": "2025-05-01T11:00:00.000Z",
              "author": { "id": 4, "name": "Alice Wonder" }
            }
            // ... more replies
          ]
        }
        ```
    *   **401 Unauthorized**.
    *   **404 Not Found**: Thread not found or is not a main thread.
    *   **500 Internal Server Error**.

---

#### `DELETE /discussions/{threadId}`

Delete a discussion thread (including all its replies).

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `threadId` (integer, required): The ID of the main discussion thread to delete.
*   **Responses**:
    *   **204 No Content**: Thread deleted successfully.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Thread not found or is not a main thread.
    *   **500 Internal Server Error**.

---

#### `DELETE /discussions/replies/{replyId}`

Delete a specific reply.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `replyId` (integer, required): The ID of the reply to delete.
*   **Responses**:
    *   **204 No Content**: Reply deleted successfully.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **404 Not Found**: Reply not found or is not a reply.
    *   **500 Internal Server Error**.

---

### Admin: Configuration

Endpoints for administrators to manage site-wide configuration.

#### `GET /admin/config`

Get all site configurations.

*   **Authentication**: Admin
*   **Responses**:
    *   **200 OK**: All configuration key-value pairs.
        ```json
        {
          "hoa_name": "Sanderson Creek HOA",
          "hoa_description": "Sanderson Creek HOA Community Management System",
          "hoa_logo": "/images/logo.png"
        }
        ```
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**: Failed to retrieve configurations.

---

#### `PUT /admin/config/{key}`

Upsert (update or insert) a configuration key-value pair.

*   **Authentication**: Admin
*   **Path Parameters**:
    *   `key` (string, required): The configuration key to update.
*   **Request Body**: `application/json`
    ```json
    {
      "value": "New HOA Name"
    }
    ```
    *   `value` (string, required): The new value for the configuration key.
*   **Responses**:
    *   **200 OK**: Configuration updated. Returns the updated key-value pair.
        ```json
        {
          "key": "hoa_name",
          "value": "New HOA Name"
        }
        ```
    *   **400 Bad Request**: Validation failed (e.g., value is empty).
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**: Failed to update configuration.

---

### Admin: Audit Logs

Endpoints for administrators to view audit logs.

#### `GET /admin/audit-logs`

List audit log entries. Paginated and ordered by most recent.

*   **Authentication**: Admin
*   **Query Parameters**:
    *   `page` (integer, optional, default: 1): Page number.
    *   `limit` (integer, optional, default: 10): Items per page (max 100).
*   **Responses**:
    *   **200 OK**: A list of audit logs with pagination.
        ```json
        {
          "data": [
            {
              "id": 1,
              "admin_name": "System Administrator",
              "action": "user_status_update",
              "details": { "targetUserId": 2, "newStatus": "approved" },
              "created_at": "2025-06-01T15:00:00.000Z"
            }
            // ... more audit logs
          ],
          "pagination": {
            "totalItems": 50,
            "totalPages": 5,
            "currentPage": 1,
            "limit": 10
          }
        }
        ```
    *   **400 Bad Request**: Invalid query parameters.
    *   **401 Unauthorized**.
    *   **403 Forbidden**.
    *   **500 Internal Server Error**.

---

## 3. Common Schemas

Reusable object schemas used in API responses.

#### `UserResponse`
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "member", // "admin" or "member"
  "status": "approved", // "pending", "approved", "rejected"
  "email_verified": false,
  "is_system_user": false,
  "created_at": "2025-06-01T12:00:00.000Z",
  "updated_at": "2025-06-01T12:00:00.000Z"
}
```

#### `DocumentResponse`
```json
{
  "id": 1,
  "title": "Meeting Minutes Q1",
  "description": "Minutes from the first quarter HOA meeting.",
  "file_name": "doc-unique-name.pdf", // Stored unique name
  "original_file_name": "Q1_Minutes.pdf", // Original uploaded name
  "file_path": "/path/on/server/doc-unique-name.pdf", // Server path (usually not exposed directly)
  "uploaded_by": { 
    "id": 1, 
    "name": "Admin User" 
  },
  "uploaded_at": "2025-03-10T14:30:00.000Z", // from createdAt
  "approved": true,
  "is_public": true,
  "updated_at": "2025-03-10T14:30:00.000Z"
}
```

#### `AnnouncementResponse`
```json
{
  "id": 1,
  "title": "Pool Maintenance Next Week",
  "content": "<p>The community pool will be closed for maintenance from June 10th to June 12th.</p>",
  "created_by": {
    "id": 2,
    "name": "Admin User"
  },
  "expires_at": "2025-06-15T23:59:59.000Z", // Can be null
  "created_at": "2025-06-05T10:00:00.000Z",
  "updated_at": "2025-06-05T10:05:00.000Z"
}
```

#### `EventResponse`
```json
{
  "id": 1,
  "title": "Community BBQ",
  "description": "Join us for a fun community BBQ event.",
  "event_date": "2025-07-15T18:00:00.000Z", // Mapped from start_date
  "end_date": "2025-07-15T21:00:00.000Z",
  "location": "Community Park Pavilion",
  "created_by": {
    "id": 5,
    "name": "Admin User"
  },
  "created_at": "2025-06-01T10:00:00.000Z",
  "updated_at": "2025-06-01T10:00:00.000Z"
}
```

#### `DiscussionThreadItem` (Used in lists)
```json
{
  "id": 5,
  "title": "Pool Opening Party",
  "content": "<p>When is the pool opening party this year? Snippet or full.</p>", // Content might be a snippet in lists
  "created_at": "2025-05-01T10:00:00.000Z",
  "author": { 
    "id": 3, 
    "name": "Bob Builder" 
  },
  "reply_count": 2
}
```

#### `DiscussionReplyItem`
```json
{
  "id": 10,
  "content": "<p>I heard it's the first weekend of June!</p>",
  "created_at": "2025-05-01T11:00:00.000Z",
  "author": { 
    "id": 4, 
    "name": "Alice Wonder" 
  }
}
```

#### `AuditLogItem`
```json
{
  "id": 1,
  "admin_name": "System Administrator",
  "action": "user_status_update",
  "details": { "targetUserId": 2, "newStatus": "approved" }, // Can be string or parsed JSON object
  "created_at": "2025-06-01T15:00:00.000Z"
}
```

#### `ErrorResponseValidation` (Example for 400 Bad Request)
```json
{
  "message": "Validation failed.",
  "errors": [
    "Field 'fieldName' is required.",
    "Field 'otherField' must be a valid email."
  ]
}
```
Alternatively:
```json
{
  "errors": [
    { "field": "fieldName", "message": "Field 'fieldName' is required." }
  ]
}
```

#### `ErrorResponseGeneric` (Example for 401, 403, 404, 409, 500)
```json
{
  "message": "Specific error message here." // Or "error": "..."
}
```