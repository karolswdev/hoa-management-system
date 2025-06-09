### **Project Kick-off: UI for HOA Management Platform**

**Objective:** To create a modern, mobile-friendly, and beautiful yet functional user interface for the existing HOA Management Platform backend. The UI will be developed under the `frontend/` directory.

**Guiding Principles:**
*   **Component-Based Architecture:** Promote reusability and maintainability.
*   **Mobile-First Design:** Ensure a seamless experience on all devices.
*   **Clear State Management:** Maintain a predictable and debuggable application state.
*   **Optimistic UI (where appropriate):** Provide a fast, responsive feel for the user.
*   **Security:** Properly handle JWTs, user roles, and secure API communication.

**Recommended Tech Stack:**
*   **Framework:** **React** (with TypeScript for type safety)
*   **Build Tool:** **Vite** (for fast development and optimized builds)
*   **Styling:** **Tailwind CSS** for utility-first styling, combined with a headless component library like **Headless UI** or a styled one like **Shadcn/UI** for accessibility and functionality.
*   **Routing:** **React Router**
*   **API Communication:** **Axios** (for its ease of use with interceptors for auth headers)
*   **State Management:** **Zustand** (for its simplicity and minimal boilerplate)
*   **Forms:** **React Hook Form** (for performance and validation)

---

### **Phase 1: Project Bootstrap & Core Authentication**

**Goal:** Establish the frontend project structure, set up the development environment, and implement the complete user authentication and registration flow. By the end of this phase, users can register, log in, log out, and reset their passwords.

#### **1. Project Initialization & Tooling Setup**

1.  **Create Project:** Inside the root directory, create the frontend project.
    ```bash
    # Ensure you are in the project root directory
    npm create vite@latest frontend -- --template react-ts
    cd frontend
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    npm install axios react-router-dom zustand tailwindcss postcss autoprefixer react-hook-form @hookform/resolvers joi
    npm install -D @types/react-router-dom
    ```
3.  **Configure Tailwind CSS:**
    ```bash
    npx tailwindcss init -p
    # Follow the official Tailwind guide to configure template paths in tailwind.config.js
    ```

#### **2. Docker Integration**

Update the root `docker-compose.yml` to include the new frontend service for a unified development environment.

**Updated `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend # Point build context to backend subdirectory
      dockerfile: Dockerfile
    container_name: hoa_backend_api
    user: "${UID:-1000}:${GID:-1000}"
    ports:
      - "${APP_PORT:-3001}:${PORT:-3001}"
    volumes:
      - ./backend/database:/usr/src/app/database
      - ./backend/uploads:/usr/src/app/uploads
    env_file:
      - ./backend/.env
    restart: unless-stopped
    networks:
      - hoa-app-network

  frontend:
    build:
      context: ./frontend # Point build context to frontend subdirectory
      dockerfile: Dockerfile
    container_name: hoa_frontend_ui
    user: "${UID:-1000}:${GID:-1000}"
    ports:
      - "5173:5173" # Default Vite port
    volumes:
      - ./frontend:/app
      - /app/node_modules # Isolate node_modules inside the container
    depends_on:
      - backend
    networks:
      - hoa-app-network
    environment:
      - VITE_API_BASE_URL=http://backend:3001/api # Use service name for inter-container communication

# test-runner service remains as is...

networks:
  hoa-app-network:
    driver: bridge
```

**Create `frontend/Dockerfile`:**

```dockerfile
# Stage 1: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# If you were building for production, you'd have a build step:
# RUN npm run build

# Stage 2: Serve the application for development
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

#### **3. Application Shell & Routing**

1.  **Create a main layout component:** `src/components/layout/MainLayout.tsx` with a header, a placeholder sidebar, and a main content area.
2.  **Set up routing:** In `src/App.tsx`, configure React Router with public routes (`/login`, `/register`, `/forgot-password`) and a placeholder for protected routes.
3.  **Create `ProtectedRoute` component:** This component will wrap protected routes. It checks for a valid auth token in the state and redirects to `/login` if it's missing.

#### **4. Authentication Flow Implementation**

**State Management (`src/store/authStore.ts`)**

Create a Zustand store to manage authentication state globally.

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
```

**API Service (`src/services/api.ts` & `src/services/authService.ts`)**

*   Create an Axios instance with the base URL and an interceptor to add the auth token to headers.
*   Implement functions for each auth endpoint.

**Pages & API Calls:**

*   **Login Page (`src/pages/Login.tsx`)**
    *   **UI:** Form with email and password fields.
    *   **API Call:**
        *   **Endpoint:** `POST /api/auth/login`
        *   **Request Body:** `{ "email": "user@example.com", "password": "password123" }`
        *   **On Success (200):**
            *   **Response Data Structure:**
                ```json
                {
                  "message": "Login successful.",
                  "token": "eyJhbGciOiJI...",
                  "user": {
                    "id": 1,
                    "name": "John Doe",
                    "email": "john.doe@example.com",
                    "role": "member",
                    "status": "approved",
                    "created_at": "...",
                    "updated_at": "..."
                  }
                }
                ```
            *   **Action:** Call `useAuthStore.getState().setAuth(token, user)` and navigate to the dashboard.

*   **Registration Page (`src/pages/Register.tsx`)**
    *   **UI:** Form for name, email, and password.
    *   **API Call:**
        *   **Endpoint:** `POST /api/auth/register`
        *   **Request Body:** `{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123!" }`
        *   **On Success (201):**
            *   **Response Data Structure:**
                ```json
                {
                  "message": "Registration successful. Your account is pending approval.",
                  "user": { /* ... user object ... */ }
                }
                ```
            *   **Action:** Display the success message to the user, prompting them to wait for admin approval.

*   **Forgot & Reset Password Pages**
    *   **UI:** Forms for email submission and then token + new password submission.
    *   **API Calls:**
        *   `POST /api/auth/forgot-password` (Request Body: `{ "email": "..." }`)
        *   `POST /api/auth/reset-password` (Request Body: `{ "token": "...", "newPassword": "..." }`)

**Deliverables:**
*   A runnable `docker-compose up` environment for both backend and frontend.
*   Functional Login, Registration, and Forgot/Reset Password pages.
*   A protected dashboard route that is only accessible after login.
*   Global state management for authentication.

---

### **Phase 2: Member-Facing Core Features**

**Goal:** Build the essential features that an approved member will use. This includes the dashboard, viewing announcements, events, and documents, and managing their own profile.

#### **1. Main Dashboard (`src/pages/Dashboard.tsx`)**

*   **UI:** A central hub displaying a summary of key information.
    *   A "Welcome, [User Name]!" message.
    *   A component showing the 2-3 most recent **active announcements**.
    *   A component showing the 2-3 next **upcoming events**.
*   **API Calls:**
    *   `GET /api/announcements?limit=3&status=active&sortBy=created_at&sortOrder=DESC`
    *   `GET /api/events?limit=3&status=upcoming&sortBy=start_date&sortOrder=ASC`

#### **2. Announcements Module**

*   **UI:** A dedicated page (`/announcements`) listing all active announcements with pagination.
*   **API Call:**
    *   **Endpoint:** `GET /api/announcements` (with query params for pagination: `?page=1&limit=10`)
    *   **Response Data Structure:**
        ```json
        {
          "data": [
            {
              "id": 1,
              "title": "Pool Maintenance",
              "content": "<p>The community pool will be closed...</p>",
              "expires_at": "2025-07-01T23:59:59.000Z",
              "created_at": "...",
              "creator": { "id": 1, "name": "System Administrator" }
            }
          ],
          "pagination": { "totalItems": 20, "totalPages": 2, "currentPage": 1, "limit": 10 }
        }
        ```

#### **3. Events Calendar/List**

*   **UI:** A page (`/events`) that lists upcoming and past events, with a toggle or tabs. A simple list view is sufficient for this phase; a full calendar can be a future enhancement.
*   **API Call:**
    *   **Endpoint:** `GET /api/events?status=upcoming` (or `?status=past`)
    *   **Response Data Structure:**
        ```json
        {
          "data": [
            {
              "id": 1,
              "title": "Annual HOA Meeting",
              "description": "Discussing the budget for the next year.",
              "start_date": "2025-08-15T19:00:00.000Z",
              "end_date": "2025-08-15T21:00:00.000Z",
              "location": "Community Clubhouse",
              "created_by": { "id": 1, "name": "System Administrator" }
            }
          ],
          "pagination": { /* ... */ }
        }
        ```

#### **4. Document Library**

*   **UI:** A page (`/documents`) listing all approved documents (both public and member-only). Each item should have a title, description, uploader, and a download button.
*   **API Calls:**
    *   **Listing:** `GET /api/documents`
        *   **Response Data Structure:**
            ```json
            {
              "count": 5,
              "documents": [
                {
                  "id": 1,
                  "title": "Community Bylaws",
                  "description": "The official bylaws of the HOA.",
                  "original_file_name": "bylaws_2024.pdf",
                  "approved": true,
                  "is_public": true,
                  "uploaded_at": "...",
                  "uploader": { "id": 1, "name": "System Administrator" }
                }
              ]
            }
            ```
    *   **Downloading:** The download button will link to `GET /api/documents/:documentId/download`. This must be handled carefully. The link should be an `<a>` tag with the `download` attribute. The `href` will need to include the auth token if the API requires it for secure downloads. A better approach is a function that fetches the blob and triggers a download programmatically to attach the auth header.

#### **5. User Profile Management**

*   **UI:** A page (`/profile` or `/settings`) where users can view their details, update their name, and change their password.
*   **API Calls:**
    *   **Get Profile:** `GET /api/users/me`
    *   **Update Profile:** `PUT /api/users/me` (Request Body: `{ "name": "New Name" }`)
    *   **Change Password:** `PUT /api/users/me/password` (Request Body: `{ "currentPassword": "...", "newPassword": "..." }`)

**Deliverables:**
*   A functional dashboard for logged-in members.
*   Read-only modules for Announcements, Events, and Documents with pagination.
*   A fully functional user profile and password management page.

---

### **Phase 3: Community Discussion Forum**

**Goal:** Implement the interactive discussion board feature, allowing members to create threads and post replies.

#### **1. Discussion Threads List**

*   **UI:** A page (`/discussions`) that lists all parent discussion threads, showing the title, author, creation date, and reply count.
*   **API Call:**
    *   **Endpoint:** `GET /api/discussions`
    *   **Response Data Structure:**
        ```json
        {
          "totalItems": 15,
          "totalPages": 2,
          "currentPage": 1,
          "threads": [
            {
              "id": 1,
              "title": "Question about landscaping services",
              "content": "Does anyone know when the next lawn treatment is scheduled?",
              "created_at": "...",
              "author": { "id": 5, "name": "Jane Doe" },
              "reply_count": 3
            }
          ]
        }
        ```

#### **2. Thread View and Replies**

*   **UI:** A dynamic page (`/discussions/:threadId`) that shows the main thread's content at the top, followed by a chronological list of all replies. Include a form to add a new reply.
*   **API Calls:**
    *   **View Thread:** `GET /api/discussions/:threadId`
        *   **Response Data Structure:**
            ```json
            {
              "mainThread": { /* ... thread object ... */ },
              "replies": [
                {
                  "id": 10,
                  "content": "I believe it's next Tuesday.",
                  "created_at": "...",
                  "author": { "id": 8, "name": "Mark Smith" }
                }
              ]
            }
            ```
    *   **Post Reply:** `POST /api/discussions/:threadId/replies`
        *   **Request Body:** `{ "content": "This is my reply." }`
        *   **Action:** On success, refetch the thread data or optimistically add the new reply to the UI.

#### **3. Create New Thread**

*   **UI:** A form/modal for creating a new discussion thread with a title and content.
*   **API Call:**
    *   **Endpoint:** `POST /api/discussions`
    *   **Request Body:** `{ "title": "New Thread Title", "content": "..." }`
    *   **Action:** On success, navigate the user to the newly created thread's page.

**Deliverables:**
*   A complete, interactive discussion forum.
*   Members can create, view, and reply to threads.

---

### **Phase 4: Comprehensive Admin Panel**

**Goal:** Build a secure, dedicated section of the UI for administrators to manage all aspects of the platform. This section should be under a route like `/admin`.

#### **1. Admin Layout & Navigation**

*   Create a distinct layout for the admin panel, possibly with a different sidebar containing links to all admin-specific pages.
*   Use the `ProtectedRoute` component, but with an additional check for `user.role === 'admin'`.

#### **2. User Management Dashboard**

*   **UI:** A table listing all non-system users with their name, email, role, and status. Provide controls to edit status/role, change password, or delete.
*   **API Calls:**
    *   `GET /api/admin/users`: List all users.
    *   `PUT /api/admin/users/:userId/status`: (Body: `{ "status": "approved" }`)
    *   `PUT /api/admin/users/:userId/role`: (Body: `{ "role": "admin" }`)
    *   `DELETE /api/admin/users/:userId`

#### **3. Content Management (Announcements, Events, Documents)**

*   For each content type, create a management page with a table listing all items (not just active/approved).
*   Implement forms (modals are a good choice) for **creating** and **editing** items.
*   **Documents:**
    *   The creation form must handle `multipart/form-data` for file uploads.
    *   Add controls to **approve** documents.
    *   `POST /api/admin/documents`: (form-data with `documentFile`, `title`, etc.)
    *   `PUT /api/admin/documents/:id/approve`
*   **Announcements & Events:**
    *   `POST /api/announcements` | `PUT /api/announcements/:id` | `DELETE /api/announcements/:id`
    *   `POST /api/events` | `PUT /api/events/:id` | `DELETE /api/events/:id`

#### **4. Site Configuration**

*   **UI:** A simple form page that lists all configuration key-value pairs and allows admins to update the values.
*   **API Calls:**
    *   `GET /api/admin/config`: To populate the form.
    *   `PUT /api/admin/config/:key`: (Body: `{ "value": "New HOA Name" }`) - Call this for each changed value.

#### **5. Audit Log Viewer**

*   **UI:** A paginated table displaying the audit logs. Show the admin's name, the action, details, and timestamp.
*   **API Call:** `GET /api/admin/audit-logs`

**Deliverables:**
*   A fully functional and secure admin panel.
*   Admins can perform all CRUD and management operations as defined by the backend API.

---

### **Phase 5: Finalization, Polish, and Pre-Deployment**

**Goal:** Refine the application, ensure high quality across the board, and prepare for production deployment.

#### **1. Comprehensive UI/UX Polish**

*   Review all pages for consistent design, spacing, and typography.
*   Add loading states (spinners, skeletons) for all data-fetching operations.
*   Implement user-friendly error messages for API failures (e.g., "Invalid password" vs. a generic "Error").
*   Add subtle animations and transitions for a smoother feel.

#### **2. Final Responsive & Cross-Browser Testing**

*   Rigorously test the entire application on various screen sizes, from small mobile phones to large desktops.
*   Test on major browsers (Chrome, Firefox, Safari, Edge).

#### **3. Accessibility (a11y) Audit**

*   Ensure all interactive elements are keyboard-navigable.
*   Use semantic HTML and add appropriate ARIA attributes.
*   Check color contrast ratios.

#### **4. Performance Optimization**

*   Implement code-splitting (route-based) to reduce initial bundle size.
*   Optimize images and other static assets.
*   Analyze and optimize any slow-rendering components.

#### **5. Final Review and Documentation**

*   Update `README.md` with instructions on how to run the frontend.
*   Conduct a final code review.

**Deliverables:**
*   A production-ready, polished, and performant frontend application.
*   A high-quality user experience on all target platforms.