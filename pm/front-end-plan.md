# Front-end Development Plan (React)

## Technology Stack Assumptions

*   **JavaScript Library/Framework:** React (v18+)
*   **Project Scaffolding:** Vite (preferred for speed and modern ESM)
*   **Routing:** React Router DOM (v6+)
*   **State Management:** React Context API with `useReducer` for global state (e.g., Auth, Site Config). Component-level state (`useState`) for local UI state.
*   **Component Styling:** Material UI (MUI v5+) for a comprehensive component library and theming, to align with the original Materialize CSS feel but with modern React practices. This includes `@mui/material`, `@emotion/react`, `@emotion/styled`, and `@mui/icons-material`.
*   **API Communication:** Axios for structured HTTP requests.
*   **Form Handling:** React Hook Form for efficient form state management and validation.
*   **Development Language:** JavaScript (ES6+) or TypeScript. (This plan will assume JavaScript (JSX) for simplicity in description, but TypeScript (TSX) is highly recommended for new React projects for better type safety and developer experience).
*   **Linting/Formatting:** ESLint and Prettier.
*   **Rich Text Editor:** React-Quill or a similar library (e.g., Tiptap, Slate) for discussion/announcement content, ensuring compatibility with MUI if possible or styling to match.
*   **Date/Time Pickers:** MUI X Date and Time Pickers (or equivalent integrated with MUI).
*   **Notifications/Toasts:** A library like `react-toastify` or MUI's Snackbar component for user feedback.

## Goal

To create a modern, responsive, and user-friendly single-page application (SPA) using React that consumes the Node.js backend API. The frontend will replicate all user-facing functionalities of the current PHP application, offering an improved user experience and maintainability.

## Expected Output

A complete React application with a well-organized component structure, efficient state management, client-side routing, and a build process for deployment. The UI will be intuitive, responsive across devices, and provide a significantly improved user experience by leveraging modern React patterns and Material UI components. All functionalities present in the original PHP application (user views and admin panels) will be implemented.

---

## Epic: Basic Setup & Structure

### User Story 25: Initialize React Application and Setup Basic Structure
*   **As a** frontend developer,
*   **I want** to initialize a new React application using Vite and establish a scalable project structure with essential libraries for routing, API calls, state management, and UI components,
*   **So that** I have a solid and organized foundation for building UI components and features efficiently.

    **Technical Requirements:**
    1.  **Project Initialization:** Use Vite (`npm create vite@latest my-hoa-app -- --template react`).
    2.  **Folder Structure:** Establish a logical `src/` directory structure:
        *   `App.jsx`: Main application component, router setup.
        *   `main.jsx`: Application entry point, renders `App`.
        *   `components/`: Reusable UI components.
            *   `common/`: Generic components (e.g., `StyledButton`, `LoadingSpinner`, `ConfirmationDialog`).
            *   `layout/`: Components like `Header`, `Footer`, `AdminLayout`, `MainLayout`.
        *   `pages/`: Top-level route components (e.g., `HomePage.jsx`, `LoginPage.jsx`, `DashboardPage.jsx`).
        *   `features/`: Module-specific components, hooks, and potentially services (e.g., `features/auth/`, `features/documents/`, `features/admin/users/`).
        *   `services/` or `api/`: Centralized API call logic (e.g., `apiClient.js`, `authService.js`, `documentService.js`).
        *   `hooks/`: Custom React hooks (e.g., `useAuth.js`, `useDebounce.js`).
        *   `contexts/`: Global state management (e.g., `AuthContext.jsx`, `SiteConfigContext.jsx`).
        *   `routes/`: Routing configuration (`AppRoutes.jsx`), including protected route components.
        *   `assets/`: Static assets like images, fonts.
        *   `utils/`: Utility functions (e.g., `dateFormatter.js`, `validationSchemas.js`).
        *   `theme/`: MUI theme customization (`theme.js`).
    3.  **Core Dependencies:** Install `react-router-dom`, `axios`.
    4.  **MUI Setup:** Install `@mui/material @emotion/react @emotion/styled @mui/icons-material @mui/x-date-pickers`. Create `theme/theme.js` for basic MUI theme customization (palette, typography). Wrap the application with `<ThemeProvider theme={theme}>` and `<LocalizationProvider dateAdapter={AdapterDateFns}>` (or dayjs).
    5.  **Linting/Formatting:** Configure ESLint (with React plugins) and Prettier.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `package.json`:**
            *   Instruction: Verify `react`, `react-dom` are present.
            *   Instruction: Verify the project was initialized with Vite by checking scripts (e.g., `vite`, `vite build`) and dependencies.
        2.  **Inspect the `src/` directory structure:**
            *   Instruction: Confirm a clear and organized folder structure exists, generally aligning with the pattern: `components/`, `pages/`, `services/` (or `api/`), `hooks/`, `contexts/`, `routes/`, `theme/`.
        3.  **Verify installation of core libraries in `package.json`:**
            *   Instruction: Check that `react-router-dom` and `axios` are listed as dependencies.
        4.  **Verify MUI library setup:**
            *   Instruction: Verify `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material`, and a date adapter for `@mui/x-date-pickers` (e.g., `date-fns` or `dayjs` along with `@date-io/date-fns` or `@date-io/dayjs`) are in `package.json`.
            *   Instruction: Check `main.jsx` or `App.jsx` for the application being wrapped by MUI's `<ThemeProvider>` (with a custom theme if created) and `<CssBaseline />`.
            *   Instruction: If date pickers are planned, verify `<LocalizationProvider>` wraps the app.
        5.  **Verify ESLint and Prettier configuration:**
            *   Instruction: Check for `.eslintrc.js` (or similar) and `.prettierrc.js` (or similar) configuration files. Confirm linting and formatting scripts are available in `package.json` and run without errors.

### User Story 26: Implement Global Layout and Navigation Structure
*   **As a** frontend developer,
*   **I want** to create a global application layout structure with a responsive `Header` (displaying HOA branding, dynamic navigation links based on auth state and role) and a `Footer`,
*   **So that** users experience a consistent visual and navigational framework across all public and authenticated sections of the application.

    **Technical Requirements:**
    1.  **Main Layout (`components/layout/MainLayout.jsx`):** Wraps general application pages. Renders `Header`, an `Outlet` for page content, and `Footer`.
    2.  **Header Component (`components/layout/Header.jsx`):**
        *   Uses MUI `AppBar`, `Toolbar`, `Typography` for branding (HOA Name from `SiteConfigContext` or fetched config).
        *   Navigation links (MUI `Button` or `Link` components, integrated with `react-router-dom`'s `NavLink`).
        *   Dynamic links based on `AuthContext`:
            *   Unauthenticated: "Home", "Documents", "Login", "Register".
            *   Authenticated Member: "Home", "Dashboard", "Documents", "Discussions", "Logout".
            *   Authenticated Admin: Adds "Admin Panel" link.
        *   Responsive: MUI `IconButton` for menu on small screens (`<MenuIcon />`), opening an MUI `Drawer` or `Menu` with navigation links.
    3.  **Footer Component (`components/layout/Footer.jsx`):** MUI `Box` or `Container` with `Typography` for "© [Year] [HOA Name]". Link to Audit Log visible here (from PHP footer, implies all logged-in users could see it). This needs clarification for role access if Audit Log is admin-only in new design. For now, assume link available if logged in.
    4.  **Site Configuration Context (`contexts/SiteConfigContext.jsx`):** To fetch and provide `hoa_name` and other global settings from `/api/config` (publicly accessible endpoint, or a subset of it).

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `App.jsx` or `AppRoutes.jsx`:**
            *   Instruction: Verify a `MainLayout` component wraps the main application routes that share the common header/footer.
        2.  **Inspect `components/layout/Header.jsx`:**
            *   Instruction: Verify it uses MUI components like `<AppBar>`, `<Toolbar>`, `<Typography>`, `<Button>` or `<Link>`.
            *   Instruction: Verify HOA name is displayed (potentially fetched from a `SiteConfigContext` or hardcoded initially).
            *   Instruction: Using mocked `AuthContext` states:
                *   Unauthenticated: Check visibility of "Home", "Documents", "Login", "Register" links.
                *   Authenticated 'member': Check visibility of "Home", "Dashboard", "Documents", "Discussions", "Logout" links. "Login", "Register", "Admin Panel" should be hidden.
                *   Authenticated 'admin': Check visibility of all member links PLUS "Admin Panel".
            *   Instruction: Resize browser or use dev tools for mobile view. Verify a responsive menu (e.g., hamburger icon) appears and, when clicked, shows the appropriate navigation links.
        3.  **Inspect `components/layout/Footer.jsx`:**
            *   Instruction: Verify it displays copyright text.
            *   Instruction: (Pending clarification on Audit Log visibility) If the Audit Log link from the original PHP footer is to be retained for all logged-in users, verify its presence when a user is authenticated.
        4.  **Inspect `contexts/SiteConfigContext.jsx` (if implemented for HOA name):**
            *   Instruction: Verify it fetches configuration (like `hoa_name`) from a backend endpoint (e.g., a public `/api/config/public` or a restricted part of `/api/admin/config` accessible early) and provides it via context.

### User Story 27: Implement Client-Side Routing and Protected Routes
*   **As a** frontend developer,
*   **I want** to configure client-side routing using React Router DOM for all application pages, including public routes, authenticated-only routes, and admin-only routes, utilizing a protected route mechanism,
*   **So that** navigation is seamless, URLs are descriptive, and access to sensitive sections is properly controlled based on user authentication and roles.

    **Technical Requirements:**
    1.  **Routing Setup (`routes/AppRoutes.jsx` or in `App.jsx`):**
        *   Use `createBrowserRouter` and `RouterProvider` (or `BrowserRouter`, `Routes`, `Route`).
        *   Define routes for:
            *   Public: `/` (Home), `/login`, `/register`, `/documents` (public view).
            *   Authenticated (`ProtectedRoute` for members/admins): `/dashboard`, `/discussions` (list), `/discussions/:threadId` (view thread).
            *   Admin (`ProtectedRoute` with `role='admin'`):
                *   `/admin` (redirects to `/admin/dashboard` or first admin page)
                *   `/admin/dashboard` (Admin landing)
                *   `/admin/users`
                *   `/admin/documents`
                *   `/admin/announcements`
                *   `/admin/events`
                *   `/admin/discussions`
                *   `/admin/config`
                *   `/admin/audit-logs`
    2.  **Protected Route Components (`components/routes/AuthProtectedRoute.jsx`, `components/routes/AdminProtectedRoute.jsx`):**
        *   `AuthProtectedRoute`: Consumes `AuthContext`. If `!isAuthenticated`, redirects to `/login` (preserving target location via `state` for redirect after login). Otherwise, renders `Outlet` or `children`.
        *   `AdminProtectedRoute`: Consumes `AuthContext`. If `!isAuthenticated` OR `user.role !== 'admin'`, redirects to `/login` or an "Unauthorized" page (e.g., `/unauthorized`) or `/dashboard`. Otherwise, renders `Outlet` or `children`.
    3.  **Admin Layout (`components/layout/AdminLayout.jsx`):** A specific layout for `/admin/*` routes, potentially with a sidebar navigation for admin sections, nested within an `AdminProtectedRoute`.
    4.  **Not Found Page (`pages/NotFoundPage.jsx`):** A fallback route (`path="*"`) for undefined paths.
    5.  **Lazy Loading:** Implement `React.lazy` for page-level components to improve initial load time, wrapped with `<Suspense>`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `routes/AppRoutes.jsx` (or main router setup):**
            *   Instruction: Verify routes are defined for all specified public, authenticated, and admin pages.
            *   Instruction: Check that authenticated routes (e.g., `/dashboard`) are wrapped with an `AuthProtectedRoute` component.
            *   Instruction: Check that admin routes (e.g., `/admin/users`) are wrapped with an `AdminProtectedRoute` component (or `AuthProtectedRoute` with role check prop).
            *   Instruction: Verify a wildcard route (`path="*"`) is defined, rendering a `NotFoundPage` component.
        2.  **Inspect `AuthProtectedRoute.jsx`:**
            *   Instruction: Verify it consumes `AuthContext`. If user is not authenticated, check that it uses `Navigate` to redirect to `/login`, passing the current `location` in the `state` prop for post-login redirection.
        3.  **Inspect `AdminProtectedRoute.jsx`:**
            *   Instruction: Verify it consumes `AuthContext`. If user is not authenticated or `user.role` is not 'admin', check redirection (e.g., to `/unauthorized` or `/dashboard`).
        4.  **Inspect `components/layout/AdminLayout.jsx` (if created):**
            *   Instruction: Verify this layout component provides a distinct structure for admin pages (e.g., sidebar navigation using MUI `<Drawer>` and `<List>`). Verify it renders an `<Outlet />` for nested admin page content.
        5.  **Test route protection logic:**
            *   Instruction: Attempt to access `/dashboard` unauthenticated: expect redirect to `/login`.
            *   Instruction: Log in as 'member', attempt to access `/admin/users`: expect redirect to `/unauthorized` or `/dashboard`.
            *   Instruction: Log in as 'admin', access `/admin/users`: expect page to render.
        6.  **Inspect usage of `React.lazy` and `<Suspense>`:**
            *   Instruction: Verify that page-level components are imported using `React.lazy()` (e.g., `const DashboardPage = React.lazy(() => import('../pages/DashboardPage'))`).
            *   Instruction: Ensure these lazy-loaded components are rendered within a `<Suspense fallback={<LoadingSpinner />}>` component in the router configuration.

---

## Epic: User Authentication UI

### User Story 28: Develop Login Page
*   **As a** user,
*   **I want** a visually clear and responsive login page with input fields for email and password, a prominent login button, and appropriate user feedback for actions and errors,
*   **So that** I can easily and securely authenticate to access the application's features.

    **Technical Requirements:**
    1.  **Component (`pages/LoginPage.jsx` or `features/auth/LoginPage.jsx`):**
        *   Use MUI components: `Container`, `Paper` (or `Card`), `Typography`, `TextField`, `Button`, `Link` (for React Router).
        *   Responsive layout (e.g., centered card on larger screens).
    2.  **Form Handling:** Use `react-hook-form` for managing form state, validation, and submission.
        *   Define validation schema (e.g., using Zod or Yup, or inline with RHF): email (required, valid format), password (required).
    3.  **API Call:** On valid form submission, call an `loginUser(email, password)` function from `authService.js`. This service function will use `apiClient.js` (Axios instance) to make the `POST /api/auth/login` request.
    4.  **State Update (`AuthContext`):** On successful API response (200 OK with JWT):
        *   Call `login(userData, token)` method from `AuthContext` to update global auth state and store token (e.g., in memory or `localStorage`).
        *   Use `useNavigate` hook from `react-router-dom` to redirect to `/dashboard` (or intended post-login page, potentially from `location.state` if redirected from a protected route).
    5.  **Error Handling & Feedback:**
        *   Display field-specific validation errors from `react-hook-form`.
        *   Display general API error messages (e.g., "Invalid credentials," "Account pending approval") returned from the backend, using an MUI `Alert` or a toast notification.
        *   Disable login button during API call (show loading state, e.g., MUI `CircularProgress` in button).
    6.  **Links:** MUI `Link` component (as `RouterLink`) to `/register`. Message about contacting admin for forgotten passwords.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/LoginPage.jsx` (or similar):**
            *   Instruction: Verify the component uses MUI components for layout (e.g., `<Container>`, `<Paper>`) and form elements (`<TextField>` for email/password, `<Button type="submit">`).
            *   Instruction: Confirm the layout is responsive, e.g., the login form is centered and appropriately sized on different screen widths.
        2.  **Inspect `react-hook-form` integration:**
            *   Instruction: Verify `useForm` hook is used. Check `register` calls for email and password fields.
            *   Instruction: Review validation rules: email must be `required` and a valid email format; password must be `required`. Verify error messages are displayed near the respective fields if validation fails.
        3.  **Inspect form submission handler (`onSubmit`):**
            *   Instruction: Confirm it calls a login function from an authentication service (e.g., `authService.login(data)`).
            *   Instruction: Verify the login button is disabled and/or shows a loading indicator (e.g., MUI `<CircularProgress>`) while the API request is in progress.
        4.  **Inspect `AuthContext` interaction on successful login:**
            *   Instruction: After a successful API response, verify the `login` method of `AuthContext` is called with user data and token from the API.
            *   Instruction: Verify `useNavigate` is used to redirect to `/dashboard` or the route stored in `location.state.from`.
        5.  **Inspect display of API error messages:**
            *   Instruction: Simulate backend errors (e.g., 401 for invalid credentials, 403 for pending approval). Verify these error messages are displayed clearly to the user (e.g., using an MUI `<Alert>` component).
        6.  **Verify navigation links:**
            *   Instruction: Confirm an MUI `<Link>` component, correctly configured to work with `react-router-dom` (e.g., `component={RouterLink} to="/register"`), navigates to the registration page.
            *   Instruction: Verify the presence of text indicating users should contact an admin for forgotten passwords (as per original app).

### User Story 29: Develop Registration Page
*   **As a** new user,
*   **I want** a responsive registration page with fields for my full name, email address, password, and password confirmation, with clear validation and feedback,
*   **So that** I can easily create an account which will then await administrator approval.

    **Technical Requirements:**
    1.  **Component (`pages/RegisterPage.jsx` or `features/auth/RegisterPage.jsx`):** MUI layout similar to Login page.
    2.  **Form Handling (`react-hook-form`):**
        *   Inputs for `name`, `email`, `password`, `confirmPassword`.
        *   Validation: all fields required; email valid format; password min length (e.g., 8), matches `confirmPassword`.
    3.  **API Call:** On valid submission, call `authService.register(data)` which posts to `/api/auth/register`.
    4.  **Feedback:**
        *   On success (201 Created): Display persistent success message (e.g., MUI `Alert` type="success"): "Registration successful! Your account is pending admin approval." Form might be cleared or disabled.
        *   On API error (e.g., 409 email exists): Display error in MUI `Alert`.
        *   Loading state for submit button.
    5.  **Links:** MUI `Link` to `/login`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/RegisterPage.jsx` (or similar):**
            *   Instruction: Verify MUI components for layout and form elements (`<TextField>` for name, email, password, confirm password; `<Button type="submit">`).
        2.  **Inspect `react-hook-form` integration and validation:**
            *   Instruction: Verify `useForm` is used. Check `register` calls.
            *   Instruction: Review validation rules: `name` (required); `email` (required, valid format); `password` (required, min length); `confirmPassword` (required, matches password). Verify field-specific error messages.
        3.  **Inspect form submission handler:**
            *   Instruction: Confirm it calls a registration function from `authService.register(data)`.
            *   Instruction: Verify loading state on the submit button during API call.
        4.  **Inspect feedback on successful registration:**
            *   Instruction: After a successful API response (201), verify an MUI `<Alert severity="success">` (or similar prominent message) displays "Registration successful! Your account is pending admin approval."
            *   Instruction: Check if the form fields are cleared or the form is disabled post-successful registration.
        5.  **Inspect display of API error messages:**
            *   Instruction: Simulate backend error (e.g., 409 for duplicate email). Verify the error message is displayed in an MUI `<Alert severity="error">`.
        6.  **Verify navigation links:**
            *   Instruction: Confirm an MUI `<Link component={RouterLink} to="/login">` navigates to the login page.

### User Story 30: Implement Logout Functionality in Header
*   **As an** authenticated user,
*   **I want** a clearly visible "Logout" button or link, typically within the main application header or a user-specific menu,
*   **So that** I can securely end my session, clearing my authentication state from the client application and be redirected appropriately.

    **Technical Requirements:**
    1.  **UI Element (`components/layout/Header.jsx`):**
        *   An MUI `Button` or `MenuItem` (if in a dropdown menu) labeled "Logout".
        *   Visible only if `AuthContext.isAuthenticated` is true.
    2.  **Action (`AuthContext`):**
        *   The `onClick` handler for the logout button calls the `logout()` function exposed by `AuthContext`.
        *   `AuthContext.logout()` function:
            *   Clears the token from wherever it's stored (e.g., `localStorage.removeItem('authToken')`).
            *   Resets the context's state: `setUser(null)`, `setToken(null)`, `setIsAuthenticated(false)`.
            *   Uses `useNavigate` (obtained in `Header` or passed to context) to redirect to `/login` or `/`.
    3.  **Backend Interaction (Optional):** If the backend implements a token blacklist or server-side session invalidation, the `authService.logout()` could make an API call to `/api/auth/logout` before clearing client-side state. For simple JWT, client-side clearing is primary.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `components/layout/Header.jsx` (or user menu component):**
            *   Instruction: When authenticated (verified via `AuthContext.isAuthenticated`), confirm a "Logout" MUI `<Button>` or `<MenuItem>` is rendered and visible.
            *   Instruction: When not authenticated, confirm the "Logout" element is not rendered.
        2.  **Inspect the `onClick` handler for the "Logout" element:**
            *   Instruction: Verify it calls a `logout` function provided by `AuthContext` (e.g., `auth.logout()`).
        3.  **Inspect the `logout` function within `AuthContext.jsx`:**
            *   Instruction: Confirm this function removes the authentication token from its storage location (e.g., `localStorage.removeItem('authToken')`).
            *   Instruction: Verify it resets the context's internal state for `user`, `token`, and `isAuthenticated` to their initial unauthenticated values.
        4.  **Verify navigation after logout:**
            *   Instruction: After clicking "Logout", confirm the application navigates (using `useNavigate`) to the `/login` page or the site's home page (`/`).
        5.  **Verify state after logout:**
            *   Instruction: After logout, check `AuthContext` state (e.g., via React DevTools or logging) to ensure `isAuthenticated` is false and `user`/`token` are null.
            *   Instruction: Attempt to access a protected route (e.g., `/dashboard`). Verify redirection to `/login`.

---

## Epic: Core User Features UI (Dashboard, Documents, Discussions)

### User Story 31: Develop Home Page
*   **As a** user (both guest and authenticated),
*   **I want** a home page that displays a welcome message and the HOA name. If I am logged in, it should additionally show recent announcements,
*   **So that** I get a relevant landing experience and quick updates.

    **Technical Requirements:**
    1.  **Component (`pages/HomePage.jsx`):**
        *   Uses MUI `Container`, `Typography`.
        *   Displays HOA Name (from `SiteConfigContext`).
        *   Conditionally fetches and displays announcements if `AuthContext.isAuthenticated`.
    2.  **Announcements Display:**
        *   Calls `announcementService.getAnnouncements({ limit: 5, sortBy: 'createdAt:desc' })`.
        *   Renders each announcement in an MUI `Card` or `Paper` with `Typography` for title, date.
        *   Content (`announcement.content`, potentially HTML) must be rendered safely. If it's sanitized HTML from backend, use `dangerouslySetInnerHTML={{ __html: announcement.content }}`. If plain text, simple rendering.
    3.  **Loading/Error States:** Show MUI `CircularProgress` while fetching, and an `Alert` for errors.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/HomePage.jsx`:**
            *   Instruction: Verify it displays a generic welcome message and the HOA name (sourced from `SiteConfigContext` or a similar global config).
        2.  **Conditional Announcement Fetching & Display (requires `AuthContext` and `announcementService` integration):**
            *   Instruction: When `AuthContext.isAuthenticated` is true, verify an API call is made to fetch recent announcements (e.g., `GET /api/announcements?limit=5&sort=createdAt:desc`).
            *   Instruction: When authenticated and announcements are successfully fetched, verify they are displayed (e.g., each in an MUI `<Card>`), showing title, content snippet, and creation date.
            *   Instruction: If announcement content is HTML, ensure it is rendered safely (e.g., using `dangerouslySetInnerHTML` assuming backend sanitizes, or a React HTML parsing library).
            *   Instruction: When `AuthContext.isAuthenticated` is false, verify no API call for announcements is made and the announcement section is not displayed.
        3.  **Loading and Error State Handling:**
            *   Instruction: While announcements are being fetched, verify a loading indicator (e.g., MUI `<CircularProgress>`) is displayed.
            *   Instruction: If the API call to fetch announcements fails, verify an appropriate error message (e.g., using MUI `<Alert>`) is shown.

### User Story 32: Develop Dashboard Page
*   **As an** authenticated user,
*   **I want** a dashboard page that provides a personalized welcome and summarizes recent announcements, upcoming events, a list of approved documents, and recent discussion threads,
*   **So that** I have a centralized overview of important HOA activities and information.

    **Technical Requirements:**
    1.  **Component (`pages/DashboardPage.jsx`):** Protected by `AuthProtectedRoute`.
    2.  **Welcome Message:** Displays "Welcome, [User Name]!" (name from `AuthContext.user.name`).
    3.  **Data Fetching:** On mount, concurrently fetch data using respective services:
        *   Announcements: `announcementService.getAnnouncements({ limit: 3, sortBy: 'createdAt:desc' })`.
        *   Events: `eventService.getEvents({ limit: 3, filter: 'upcoming', sortBy: 'startDate:asc' })`.
        *   Documents: `documentService.getDocuments({ limit: 5, approved: true, sortBy: 'uploadedAt:desc' })`.
        *   Discussions: `discussionService.getDiscussions({ limit: 3, sortBy: 'createdAt:desc' })`.
    4.  **Layout:** Use MUI `Grid` for a multi-column layout. Each section (Announcements, Events, etc.) in an MUI `Card` or `Paper`.
    5.  **Display:**
        *   **Announcements/Events/Discussions:** List items with titles, dates, brief content. Titles link to full view where applicable (e.g., discussion thread). HTML content rendered safely.
        *   **Documents:** List item with title, description snippet. Link to `documentService.downloadDocument(id)` or to the document details page.
    6.  **Loading/Error States:** Individual loading/error states for each section or a global one for the page.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/DashboardPage.jsx` and its route definition:**
            *   Instruction: Verify the page is protected by `AuthProtectedRoute`.
        2.  **Welcome Message:**
            *   Instruction: Verify it displays a personalized welcome message including the authenticated user's name (from `AuthContext.user.name`).
        3.  **Data Fetching (requires service integrations):**
            *   Instruction: On page load, verify API calls are made to fetch:
                *   Recent announcements (e.g., `GET /api/announcements?limit=X`).
                *   Upcoming events (e.g., `GET /api/events?filter=upcoming&limit=X`).
                *   Approved documents (e.g., `GET /api/documents?approved=true&limit=X`).
                *   Recent discussions (e.g., `GET /api/discussions?limit=X`).
        4.  **Layout and Display:**
            *   Instruction: Verify an MUI `<Grid>` or similar layout component is used to arrange the different sections (Announcements, Events, Documents, Discussions).
            *   Instruction: For each section:
                *   Verify it's presented within an MUI `<Card>` or `<Paper>`.
                *   Announcements: Check for title, date, content snippet. HTML content rendered safely.
                *   Events: Check for title, date(s), location snippet.
                *   Documents: Check for title, and a download link/button which, when clicked, triggers a download.
                *   Discussions: Check for title, author, date. Title should be a link to the full discussion view (e.g., `/discussions/:threadId`).
        5.  **Loading and Error State Handling:**
            *   Instruction: For each data fetching operation, verify loading indicators are shown while data is pending.
            *   Instruction: If any API call fails, verify an appropriate error message is displayed for that section or for the page.

### User Story 33: Develop Documents Page & Download Functionality
*   **As a** user (guest or authenticated),
*   **I want** a documents page that lists available documents (respecting public/private permissions based on my authentication status) with their titles, descriptions, upload dates, and provides a clear way to download them,
*   **So that** I can access shared HOA files.

    **Technical Requirements:**
    1.  **Component (`pages/DocumentsPage.jsx`):**
    2.  **Data Fetching:** Calls `documentService.getDocuments()`. The service/API handles returning appropriate documents based on auth state (public & approved for guests; all approved for members; all for admins if this page is also used by them, or a separate admin doc page exists).
    3.  **Display:** Use MUI `Table` or `List` to display documents: Title, Description, Uploaded Date.
    4.  **Download Action:** Each document row/item has an MUI `Button` or `IconButton` (`<DownloadIcon />`) to trigger download.
        *   `onClick` handler calls `documentService.downloadDocument(doc.id)`. This service function will handle the actual file download triggering, possibly by creating a temporary link and clicking it, or by opening `window.open(API_URL + '/documents/' + doc.id + '/download')` if the backend sets `Content-Disposition: attachment`.
    5.  **Loading/Error States:** Standard handling.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/DocumentsPage.jsx`:**
            *   Instruction: Verify it calls a service function (e.g., `documentService.getDocuments()`) to fetch the list of documents. The backend API is responsible for filtering based on auth status.
        2.  **Document Display:**
            *   Instruction: Verify documents are displayed in an MUI `<Table>` or `<List>`, showing columns/fields for Title, Description (if available), and Uploaded Date.
            *   Instruction: Ensure dates are formatted readably (e.g., using `date-fns` or `dayjs`).
        3.  **Download Functionality:**
            *   Instruction: For each document, verify an MUI `<Button>` or `<IconButton>` (e.g., with `<DownloadIcon />`) is present for downloading.
            *   Instruction: When the download element is clicked, verify it triggers a call to a download service function (e.g., `documentService.downloadDocument(doc.id)`) or directly constructs a URL to the backend download endpoint (e.g., `/api/documents/:id/download`) and initiates the download (e.g., via `window.open` or creating an `<a>` tag).
            *   Instruction: Perform a download and verify the correct file is downloaded with a user-friendly name.
        4.  **Loading and Error State Handling:**
            *   Instruction: Verify a loading indicator is shown while the document list is being fetched.
            *   Instruction: If fetching documents fails, verify an error message is displayed.

### User Story 34: Develop Discussion List Page
*   **As an** authenticated user,
*   **I want** a page listing all main discussion threads, showing key information like title, author, creation date, and reply count, with a way to navigate to view a full thread, and an option to start a new discussion,
*   **So that** I can browse ongoing conversations and initiate new ones.

    **Technical Requirements:**
    1.  **Component (`pages/DiscussionListPage.jsx` or `features/discussions/DiscussionListPage.jsx`):** Protected by `AuthProtectedRoute`.
    2.  **Data Fetching:** Calls `discussionService.getDiscussions()` (supports pagination).
    3.  **Display:** MUI `List` or `Table` to display threads. Each item shows:
        *   Title (as a `Link` from `react-router-dom` to `/discussions/:threadId`).
        *   Author Name.
        *   Creation Date (formatted).
        *   Reply Count.
    4.  **New Discussion Button:** MUI `Button` ("Start New Discussion") that navigates to a new discussion form/page (e.g., `/discussions/new`).
    5.  **Pagination Controls:** If API supports pagination, implement UI controls (e.g., MUI `Pagination` component).
    6.  **Loading/Error States.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/DiscussionListPage.jsx` and its route definition:**
            *   Instruction: Verify the page is protected by `AuthProtectedRoute`.
        2.  **Data Fetching (requires `discussionService` integration):**
            *   Instruction: Verify an API call is made to fetch main discussion threads (e.g., `GET /api/discussions` with pagination parameters).
        3.  **Discussion Thread Display:**
            *   Instruction: Verify threads are displayed in an MUI `<List>` or `<Table>`.
            *   Instruction: For each thread, check for:
                *   Title: Displayed as a clickable link (using `react-router-dom`'s `<Link>`) navigating to the specific thread view (e.g., `/discussions/:threadId`).
                *   Author's Name.
                *   Creation Date (formatted).
                *   Reply Count.
        4.  **"Start New Discussion" Button:**
            *   Instruction: Verify an MUI `<Button>` labeled "Start New Discussion" (or similar) is present.
            *   Instruction: When clicked, verify it navigates the user to a form or page for creating a new discussion (e.g., `/discussions/new`).
        5.  **Pagination (if implemented):**
            *   Instruction: If the API supports pagination for discussions, verify MUI `<Pagination>` controls (or similar) are present and functional, allowing navigation between pages of threads.
        6.  **Loading and Error State Handling:**
            *   Instruction: Verify appropriate loading indicators and error messages are displayed during data fetching.

### User Story 35: Develop View Discussion Page (Thread & Replies)
*   **As an** authenticated user,
*   **I want** a page to view a specific discussion thread's full content and all its replies, chronologically, with author and date for each post, and a form to post my own reply,
*   **So that** I can fully read and participate in the conversation.

    **Technical Requirements:**
    1.  **Component (`pages/ViewDiscussionPage.jsx` or `features/discussions/ViewDiscussionPage.jsx`):** Protected by `AuthProtectedRoute`. Takes `threadId` from route params (`useParams`).
    2.  **Data Fetching:** Calls `discussionService.getDiscussionById(threadId)` which fetches the main thread and its replies.
    3.  **Display Main Thread:**
        *   MUI `Card` or `Paper`. `Typography` for title, author, date.
        *   Content (HTML from backend) rendered safely using `dangerouslySetInnerHTML` or a dedicated renderer.
    4.  **Display Replies:**
        *   MUI `List` of `Card`s/`Paper`s for replies below the main thread.
        *   Each reply shows content (HTML rendered safely), author, date.
    5.  **Reply Form:**
        *   MUI `TextField` (multiline) or a Rich Text Editor component (e.g., `React-Quill`) for reply content.
        *   MUI `Button` to submit.
        *   Uses `react-hook-form`. On submit, calls `discussionService.postReply(threadId, replyData)`.
        *   After successful reply, re-fetch discussion data or optimistically update the UI to show the new reply. Clear form.
    6.  **Loading/Error States.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/ViewDiscussionPage.jsx` and its route definition (e.g., `/discussions/:threadId`):**
            *   Instruction: Verify the page is protected by `AuthProtectedRoute` and correctly extracts `threadId` using `useParams`.
        2.  **Data Fetching (requires `discussionService` integration):**
            *   Instruction: Verify an API call is made to fetch the specific discussion thread and its replies based on `threadId` (e.g., `GET /api/discussions/:threadId`).
        3.  **Main Thread Display:**
            *   Instruction: Verify the main thread's title, author, and creation date are displayed.
            *   Instruction: Verify the main thread's content (potentially HTML) is rendered correctly and safely.
        4.  **Replies Display:**
            *   Instruction: Verify replies are listed chronologically below the main thread.
            *   Instruction: For each reply, check for its content (HTML rendered safely), author, and creation date.
        5.  **Reply Form:**
            *   Instruction: Verify a form is present for posting a new reply. This should include an input area for the reply content (e.g., MUI `<TextField multiline>` or a Rich Text Editor like `React-Quill`).
            *   Instruction: Verify an MUI `<Button>` is present to submit the reply.
            *   Instruction: (If using `react-hook-form`) Verify form state and validation (e.g., reply content is required).
            *   Instruction: On form submission, verify an API call is made to post the reply (e.g., `POST /api/discussions/:threadId/replies`) with the content.
            *   Instruction: After a successful reply submission, verify the list of replies updates to show the new reply, and the reply form is cleared.
        6.  **Loading and Error State Handling:**
            *   Instruction: Verify loading indicators for initial data fetch and for reply submission.
            *   Instruction: Verify error messages for data fetching failures or reply submission failures.

### User Story 36: Develop "Start New Discussion" Form/Page
*   **As an** authenticated user,
*   **I want** a dedicated form or page with fields for a discussion title and rich text content,
*   **So that** I can initiate new topics for community discussion.

    **Technical Requirements:**
    1.  **Component (`pages/NewDiscussionPage.jsx` or modal component):** Protected by `AuthProtectedRoute`.
    2.  **Form Handling (`react-hook-form`):**
        *   MUI `TextField` for "Title".
        *   Rich Text Editor (e.g., `React-Quill`) for "Content".
        *   Validation: Title and Content required.
    3.  **API Call:** On submit, call `discussionService.createDiscussion({ title, content })`.
    4.  **Navigation/Feedback:** On success, navigate to the new discussion's page (`/discussions/:newThreadId`) or back to discussion list (`/discussions`). Show success toast/message.
    5.  **Loading/Error States.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/NewDiscussionPage.jsx` (or modal component) and its route definition (e.g., `/discussions/new`):**
            *   Instruction: Verify the page/modal is protected by `AuthProtectedRoute`.
        2.  **Form Elements and Rich Text Editor:**
            *   Instruction: Verify an MUI `<TextField>` is present for the "Title".
            *   Instruction: Verify a Rich Text Editor component (e.g., `React-Quill`) is integrated for the "Content" input, providing common formatting options (bold, italic, lists, etc.).
            *   Instruction: Verify an MUI `<Button type="submit">` is present.
        3.  **Form Handling and Validation (with `react-hook-form`):**
            *   Instruction: Verify validation rules: `title` is required; `content` (from the rich text editor) is required (editor's content should be extracted and validated).
            *   Instruction: Check for display of validation errors.
        4.  **API Call on Submission:**
            *   Instruction: On valid form submission, verify an API call is made to create a new discussion (e.g., `POST /api/discussions`) with the `title` and HTML `content` from the editor.
        5.  **Navigation and Feedback on Success:**
            *   Instruction: After a successful API response, verify the user is navigated to the newly created discussion's page (e.g., `/discussions/:newThreadId`) or back to the discussion list (`/discussions`).
            *   Instruction: Verify a success notification (e.g., toast message) is displayed.
        6.  **Loading and Error State Handling:**
            *   Instruction: Verify a loading indicator on the submit button during API call.
            *   Instruction: Verify display of API error messages if creation fails.

---

## Epic: Admin Panel UI

### User Story 37: Develop Admin Panel Layout and Navigation
*   **As an** administrator,
*   **I want** a dedicated admin panel section with a distinct layout (e.g., sidebar navigation) that provides easy access to all management features,
*   **So that** I can efficiently manage the HOA system.

    **Technical Requirements:**
    1.  **Admin Layout Component (`components/layout/AdminLayout.jsx`):**
        *   This component will wrap all admin pages (e.g., `/admin/*`).
        *   Uses MUI `Box` for overall structure, potentially with a persistent `Drawer` for sidebar navigation on larger screens, collapsing to a temporary `Drawer` triggered by a menu icon on smaller screens.
        *   The main content area will render an `Outlet` for the specific admin page.
    2.  **Admin Sidebar Navigation (`components/admin/AdminSidebar.jsx`):**
        *   Displayed within the `AdminLayout`.
        *   Uses MUI `List` and `ListItemButton` (with `ListItemIcon` and `ListItemText`) for navigation links.
        *   Links (using `NavLink` from `react-router-dom` for active state styling) to:
            *   Admin Dashboard (e.g., `/admin/dashboard`)
            *   User Management (`/admin/users`)
            *   Document Management (`/admin/documents`)
            *   Announcement Management (`/admin/announcements`)
            *   Event Management (`/admin/events`)
            *   Discussion Management (`/admin/discussions`)
            *   Configuration (`/admin/config`)
            *   Audit Logs (`/admin/audit-logs`)
    3.  **Routing:** All routes under `/admin/` will use `AdminLayout` and be protected by `AdminProtectedRoute`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `routes/AppRoutes.jsx` (or admin-specific route config):**
            *   Instruction: Verify that all routes prefixed with `/admin/` (e.g., `/admin/users`, `/admin/documents`) are wrapped by an `AdminLayout` component and an `AdminProtectedRoute`.
        2.  **Inspect `components/layout/AdminLayout.jsx`:**
            *   Instruction: Verify it renders a distinct layout structure, typically including a sidebar area (for `AdminSidebar`) and a main content area (for an `<Outlet />`).
            *   Instruction: Check responsiveness: e.g., sidebar is persistent on desktop and collapses to a temporary drawer on mobile.
        3.  **Inspect `components/admin/AdminSidebar.jsx` (or similar):**
            *   Instruction: Verify it uses MUI `<List>`, `<ListItemButton>`, `<ListItemIcon>`, `<ListItemText>` to create navigation items.
            *   Instruction: Confirm links exist for all admin sections: Dashboard (Admin), User Management, Document Management, Announcement Management, Event Management, Discussion Management, Configuration, Audit Logs.
            *   Instruction: Verify these links use `react-router-dom`'s `<NavLink>` (or equivalent logic with `Link` and `useMatch`) to correctly navigate to the respective admin pages and highlight the active link.
        4.  **Navigation Test:**
            *   Instruction: As an admin, navigate through all links in the admin sidebar. Verify each link leads to the correct (placeholder or implemented) admin page and the main content area updates, while the admin layout (sidebar, header if any) remains consistent.

### User Story 38: Develop Admin User Management UI
*   **As an** administrator,
*   **I want** a UI to list all non-system users, approve pending registrations, change user roles, trigger password changes for users, and delete user accounts,
*   **So that** I can fully manage user access and lifecycle.

    **Technical Requirements:**
    1.  **Component (`pages/admin/UserManagementPage.jsx`):**
    2.  **Data Display:** MUI `Table` to display users (ID, Name, Email, Role, Status, Joined Date). Fetches from `/api/admin/users` (paginated).
    3.  **Actions per User (in table rows, e.g., using an actions column with `IconButton`s or a `Menu`):**
        *   **Approve:** Button visible for 'pending' users. Calls `userService.approveUser(userId)`.
        *   **Change Role:** Dropdown/Select (MUI `Select`) with 'member', 'admin'. On change, calls `userService.updateUserRole(userId, newRole)`.
        *   **Change Password:** Button opens an MUI `Dialog` (modal). Dialog has a `TextField` for new password, confirm password. Submit calls `userService.changeUserPassword(userId, newPassword)`.
        *   **Delete:** `IconButton` (`<DeleteIcon />`). Opens a `ConfirmationDialog` component. On confirm, calls `userService.deleteUser(userId)`.
    4.  **Feedback:** Use toasts/`Alert`s for action success/failure. Table should refresh or update optimistically.
    5.  **Pagination:** MUI `TablePagination` component integrated with API calls.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/UserManagementPage.jsx`:**
            *   Instruction: Verify an API call is made to fetch users (e.g., `GET /api/admin/users` with pagination) and the data is displayed in an MUI `<Table>`.
            *   Instruction: Check table columns for: ID, Name, Email, Role, Status, Joined Date, and an "Actions" column.
        2.  **Approve User Action:**
            *   Instruction: For users with 'pending' status, verify an "Approve" button is visible.
            *   Instruction: On click, verify an API call (e.g., `PUT /api/admin/users/:id/status` with payload `{ status: 'approved' }`) is made.
            *   Instruction: On success, verify the user's status in the table updates to 'approved' and the "Approve" button is hidden/disabled for that user.
        3.  **Change Role Action:**
            *   Instruction: For each user, verify an MUI `<Select>` (or similar dropdown) is present to change their role (options: 'member', 'admin').
            *   Instruction: When a new role is selected and confirmed (e.g., via a save button or on change), verify an API call (e.g., `PUT /api/admin/users/:id/role` with payload `{ role: newRole }`) is made.
            *   Instruction: On success, verify the user's role in the table updates.
        4.  **Change Password Action:**
            *   Instruction: Verify a "Change Password" button/icon is present for each user.
            *   Instruction: On click, verify an MUI `<Dialog>` opens containing a form with "New Password" and "Confirm Password" `<TextField>` elements.
            *   Instruction: On submitting this modal form (with validation for matching passwords and minimum length), verify an API call (e.g., `PUT /api/admin/users/:id/password` with payload `{ newPassword }`) is made.
            *   Instruction: Verify the modal closes on success and a success notification is shown.
        5.  **Delete User Action:**
            *   Instruction: Verify a "Delete" icon/button (e.g., MUI `<IconButton>` with `<DeleteIcon />`) is present for each user.
            *   Instruction: On click, verify a confirmation dialog (e.g., custom `ConfirmationDialog` component or MUI `<Dialog>`) appears asking for confirmation.
            *   Instruction: Upon confirmation, verify an API call (e.g., `DELETE /api/admin/users/:id`) is made.
            *   Instruction: On success, verify the user is removed from the table.
        6.  **Feedback and Pagination:**
            *   Instruction: Verify success/error notifications (toasts or MUI `<Alert>`) are displayed for all actions.
            *   Instruction: Verify MUI `<TablePagination>` (or similar) is implemented and correctly fetches paged data.

### User Story 39: Develop Admin Document Management UI
*   **As an** administrator,
*   **I want** a UI to upload new documents, list all existing documents (regardless of status), approve pending documents, and delete documents,
*   **So that** I can fully control the document lifecycle and availability.

    **Technical Requirements:**
    1.  **Component (`pages/admin/DocumentManagementPage.jsx`):**
    2.  **Upload Form:**
        *   MUI `TextField` for Title, Description.
        *   HTML5 `<input type="file">` (styled or using an MUI wrapper if available) for file selection.
        *   MUI `Checkbox` for "Is Public".
        *   MUI `Button` to submit. Uses `react-hook-form`. Submits `FormData` to `documentService.uploadDocument(formData)`.
    3.  **Document List:** MUI `Table` displaying all documents (ID, Title, Uploaded By (name), Uploaded At, Status (Approved/Pending), Is Public, Actions). Fetches from `/api/admin/documents` (or `/api/documents` if admin view gives all).
    4.  **Actions per Document:**
        *   **Approve:** Button for 'pending' documents. Calls `documentService.approveDocument(docId)`.
        *   **Delete:** `IconButton` (`<DeleteIcon />`). Opens `ConfirmationDialog`. Calls `documentService.deleteDocument(docId)`.
        *   **Download (Admin):** Link/button to download any document.
    5.  **Feedback & Pagination.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/DocumentManagementPage.jsx`:**
        2.  **Upload Document Form:**
            *   Instruction: Verify a form exists with MUI `<TextField>` for Title and Description, an `<input type="file">` for file selection, an MUI `<Checkbox>` for "Is Public", and a submit `<Button>`.
            *   Instruction: (Using `react-hook-form`) Verify validation (e.g., title and file are required).
            *   Instruction: On submit, verify a `FormData` object is created and an API call (e.g., `POST /api/admin/documents`) is made via a service function.
            *   Instruction: On successful upload, verify the document list updates and a success notification is shown.
        3.  **Document List Table:**
            *   Instruction: Verify an API call fetches all documents for admin view (e.g., `GET /api/admin/documents` or `/api/documents` with admin context).
            *   Instruction: Verify the MUI `<Table>` displays columns for: ID, Title, Uploaded By (Name), Uploaded At, Status (Approved/Pending), Is Public, and Actions.
        4.  **Approve Document Action:**
            *   Instruction: For documents with 'Pending' status, verify an "Approve" button is visible.
            *   Instruction: On click, verify an API call (e.g., `PUT /api/admin/documents/:id/approve`) is made.
            *   Instruction: On success, verify the document's status in the table updates to 'Approved'.
        5.  **Delete Document Action:**
            *   Instruction: Verify a "Delete" icon/button is present for each document.
            *   Instruction: On click, verify a confirmation dialog appears.
            *   Instruction: Upon confirmation, verify an API call (e.g., `DELETE /api/admin/documents/:id`) is made.
            *   Instruction: On success, verify the document is removed from the table.
        6.  **Admin Download Action:**
            *   Instruction: Verify a download link/button exists for each document, allowing admins to download any file regardless of its approved/public status.
        7.  **Feedback and Pagination:**
            *   Instruction: Verify notifications for all actions and functional pagination for the document list.

### User Story 40: Develop Admin Announcement Management UI
*   **As an** administrator,
*   **I want** a UI to create new announcements (using a rich text editor), list all existing announcements, edit their content, and delete them,
*   **So that** I can manage all aspects of community communications.

    **Technical Requirements:**
    1.  **Component (`pages/admin/AnnouncementManagementPage.jsx`):**
    2.  **Create/Edit Form (possibly in an MUI `Dialog` or separate view):**
        *   MUI `TextField` for Title.
        *   Rich Text Editor (e.g., `React-Quill`) for Content.
        *   MUI `Button` to Save. Uses `react-hook-form`.
        *   On Create: calls `announcementService.createAnnouncement({ title, content })`.
        *   On Edit: pre-fills form, calls `announcementService.updateAnnouncement(id, { title, content })`.
    3.  **Announcement List:** MUI `Table` (ID, Title, Content Snippet, Created At, Actions). Fetches from `/api/admin/announcements` (or `/api/announcements` with admin view).
    4.  **Actions per Announcement:**
        *   **Edit:** `IconButton` (`<EditIcon />`). Opens Create/Edit form/dialog pre-filled.
        *   **Delete:** `IconButton` (`<DeleteIcon />`). Opens `ConfirmationDialog`. Calls `announcementService.deleteAnnouncement(id)`.
    5.  **Feedback & Pagination.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/AnnouncementManagementPage.jsx`:**
        2.  **Create/Edit Announcement Form (Dialog or separate view):**
            *   Instruction: Verify a form exists with an MUI `<TextField>` for Title and a Rich Text Editor (`React-Quill`) for Content.
            *   Instruction: Verify a "Save" (or "Create"/"Update") `<Button>` is present.
            *   Instruction: (Using `react-hook-form`) Validate title and content are required.
            *   Instruction: When creating, verify an API call (e.g., `POST /api/admin/announcements`) is made.
            *   Instruction: When editing (form pre-filled with existing announcement data), verify an API call (e.g., `PUT /api/admin/announcements/:id`) is made.
            *   Instruction: On success, verify the announcement list updates/item updates and a success notification is shown. The form/dialog should close.
        3.  **Announcement List Table:**
            *   Instruction: Verify an API call fetches all announcements for admin view.
            *   Instruction: Verify the MUI `<Table>` displays columns for: ID, Title, Content (snippet, safely rendered if HTML), Created At, and Actions.
        4.  **Edit Action:**
            *   Instruction: Verify an "Edit" icon/button is present for each announcement.
            *   Instruction: On click, verify the Create/Edit form opens, pre-filled with the selected announcement's data.
        5.  **Delete Action:**
            *   Instruction: Verify a "Delete" icon/button is present for each announcement.
            *   Instruction: On click, verify a confirmation dialog appears.
            *   Instruction: Upon confirmation, verify an API call (e.g., `DELETE /api/admin/announcements/:id`) is made.
            *   Instruction: On success, verify the announcement is removed from the table.
        6.  **Feedback and Pagination:**
            *   Instruction: Verify notifications for all actions and functional pagination.

### User Story 41: Develop Admin Event Management UI
*   **As an** administrator,
*   **I want** a UI to create new events, list all existing events, edit their details (title, description, dates, location), and delete them,
*   **So that** I can manage the community calendar and event information.

    **Technical Requirements:**
    1.  **Component (`pages/admin/EventManagementPage.jsx`):**
    2.  **Create/Edit Form (Dialog or separate view):**
        *   MUI `TextField` for Title, Description, Location.
        *   MUI X `DateTimePicker` components for Start Date and End Date.
        *   MUI `Button` to Save. Uses `react-hook-form`.
        *   Validation: Title, Start/End Dates, Location required. End Date > Start Date.
        *   On Create: calls `eventService.createEvent(eventData)`.
        *   On Edit: pre-fills form, calls `eventService.updateEvent(id, eventData)`.
    3.  **Event List:** MUI `Table` (ID, Title, Start Date, End Date, Location, Actions). Fetches from `/api/admin/events`.
    4.  **Actions per Event:**
        *   **Edit:** `IconButton` (`<EditIcon />`). Opens form/dialog pre-filled.
        *   **Delete:** `IconButton` (`<DeleteIcon />`). Opens `ConfirmationDialog`. Calls `eventService.deleteEvent(id)`.
    5.  **Feedback & Pagination.**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/EventManagementPage.jsx`:**
        2.  **Create/Edit Event Form (Dialog or separate view):**
            *   Instruction: Verify a form with MUI `<TextField>` for Title, Description, Location, and MUI X `<DateTimePicker>` components for Start Date and End Date.
            *   Instruction: (Using `react-hook-form`) Validate required fields and that End Date is after Start Date.
            *   Instruction: When creating, verify `POST /api/admin/events` is called.
            *   Instruction: When editing, verify `PUT /api/admin/events/:id` is called.
            *   Instruction: On success, list updates, notification shown, form/dialog closes.
        3.  **Event List Table:**
            *   Instruction: Verify API call fetches all events for admin.
            *   Instruction: MUI `<Table>` columns: ID, Title, Start Date (formatted), End Date (formatted), Location, Actions.
        4.  **Edit Action:**
            *   Instruction: "Edit" icon/button opens form pre-filled with event data.
        5.  **Delete Action:**
            *   Instruction: "Delete" icon/button opens confirmation dialog. On confirm, `DELETE /api/admin/events/:id` is called. Event removed from table on success.
        6.  **Feedback and Pagination:**
            *   Instruction: Verify notifications and pagination.

### User Story 42: Develop Admin Discussion Management UI
*   **As an** administrator,
*   **I want** a UI to list all discussion threads and their replies, and have the ability to delete entire threads or individual replies,
*   **So that** I can moderate community discussions and remove inappropriate content.

    **Technical Requirements:**
    1.  **Component (`pages/admin/DiscussionManagementPage.jsx`):**
    2.  **Display:**
        *   Fetch all main threads (`discussionService.getAllDiscussionsForAdmin()`).
        *   Display threads in a list/tree structure (e.g., MUI `TreeView` or nested `List`s). Each thread shows title, author, date.
        *   Clicking a thread expands to show its replies (fetched on demand or with initial thread data). Replies show content snippet, author, date.
    3.  **Actions:**
        *   **Delete Thread:** Button/icon next to each main thread. Opens `ConfirmationDialog`. Calls `discussionService.deleteThreadAsAdmin(threadId)`. UI refreshes.
        *   **Delete Reply:** Button/icon next to each reply. Opens `ConfirmationDialog`. Calls `discussionService.deleteReplyAsAdmin(replyId)`. UI refreshes.
    4.  **Feedback & Pagination (for main threads).**

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/DiscussionManagementPage.jsx`:**
        2.  **Discussion Display:**
            *   Instruction: Verify API call fetches discussion threads (and potentially replies, or replies are fetched on expansion).
            *   Instruction: Verify threads are displayed in a hierarchical or expandable list (e.g., MUI `<TreeView>` or custom expandable items). Main threads show title, author, date.
            *   Instruction: When a thread is expanded, verify its replies are shown, each with content snippet, author, and date.
        3.  **Delete Thread Action:**
            *   Instruction: Verify a "Delete Thread" icon/button is present for each main discussion thread.
            *   Instruction: On click, verify a confirmation dialog appears.
            *   Instruction: Upon confirmation, verify an API call (e.g., `DELETE /api/admin/discussions/:threadId`) is made.
            *   Instruction: On success, verify the thread (and its visible replies) is removed from the UI.
        4.  **Delete Reply Action:**
            *   Instruction: Verify a "Delete Reply" icon/button is present for each individual reply.
            *   Instruction: On click, verify a confirmation dialog appears.
            *   Instruction: Upon confirmation, verify an API call (e.g., `DELETE /api/admin/discussions/replies/:replyId`) is made.
            *   Instruction: On success, verify the reply is removed from the UI.
        5.  **Feedback and Pagination (for main threads):**
            *   Instruction: Verify notifications for delete actions.
            *   Instruction: Verify pagination for the list of main discussion threads, if applicable.

### User Story 43: Develop Admin Configuration Management UI
*   **As an** administrator,
*   **I want** a UI to view all current site configuration key-value pairs and update their values,
*   **So that** I can customize site-wide settings like HOA name and description.

    **Technical Requirements:**
    1.  **Component (`pages/admin/ConfigManagementPage.jsx`):**
    2.  **Data Fetching:** Calls `configService.getAllConfig()` (gets all key-value pairs from `/api/admin/config`).
    3.  **Display & Edit:**
        *   Display key-value pairs in a list or form-like structure. Each key shown as `Typography` or `InputLabel`. Each value in an MUI `TextField`.
        *   An MUI `Button` ("Save Changes" or individual save buttons per item) to submit updates.
    4.  **Update Logic:**
        *   When "Save Changes" is clicked, iterate through modified fields. For each, call `configService.updateConfig(key, newValue)`.
        *   Alternatively, if individual save, the specific key's value is sent.
    5.  **Feedback:** Success/error toasts for updates.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/ConfigManagementPage.jsx`:**
        2.  **Configuration Display and Editing:**
            *   Instruction: Verify an API call (e.g., `GET /api/admin/config`) fetches the current site configurations.
            *   Instruction: Verify configurations are displayed as a list of key-value pairs, where keys are labels (e.g., MUI `<InputLabel>`) and values are editable in MUI `<TextField>` components.
        3.  **Update Mechanism:**
            *   Instruction: Verify a "Save Changes" MUI `<Button>` (or individual save buttons per config item) is present.
            *   Instruction: On clicking "Save", verify that for each modified configuration value, an API call (e.g., `PUT /api/admin/config/:key` with the new value) is made.
            *   Instruction: Alternatively, if a single save button updates all, verify it sends all (or just changed) key-value pairs to a batch update endpoint if available, or makes multiple individual PUT requests.
        4.  **Feedback:**
            *   Instruction: Verify success notifications (e.g., toasts) are displayed when configurations are updated successfully.
            *   Instruction: Verify error messages are shown if an update fails.

### User Story 44: Develop Admin Audit Log Viewer UI
*   **As an** administrator,
*   **I want** a UI to view a paginated list of audit log entries, showing timestamp, admin name, action performed, and details,
*   **So that** I can track administrative actions and monitor system changes.

    **Technical Requirements:**
    1.  **Component (`pages/admin/AuditLogPage.jsx`):**
    2.  **Data Fetching:** Calls `auditLogService.getAuditLogs()` (paginated, from `/api/admin/audit-logs`).
    3.  **Display:** MUI `Table` with columns: Timestamp (formatted), Admin Name, Action, Details.
    4.  **Pagination:** MUI `TablePagination`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `pages/admin/AuditLogPage.jsx`:**
        2.  **Audit Log Display:**
            *   Instruction: Verify an API call (e.g., `GET /api/admin/audit-logs` with pagination parameters) fetches audit log entries.
            *   Instruction: Verify the audit logs are displayed in an MUI `<Table>`.
            *   Instruction: Check table columns for: Timestamp (formatted readably), Admin Name, Action (e.g., 'user_update'), and Details.
        3.  **Pagination:**
            *   Instruction: Verify MUI `<TablePagination>` (or similar) is implemented and allows navigation through pages of audit log entries, correctly fetching data for each page.
        4.  **Loading and Error State Handling:**
            *   Instruction: Verify a loading indicator while logs are fetched.
            *   Instruction: Verify an error message if fetching logs fails.

---

## Epic: State Management and API Integration (General)

### User Story 45: Implement Global State Management (Auth & Site Config)
*   **As a** frontend developer,
*   **I want** to implement a global state management solution using React Context API for critical shared data like user authentication details and site configuration (e.g., HOA name),
*   **So that** this information is easily and consistently accessible throughout the application without prop drilling.

    **Technical Requirements:**
    1.  **AuthContext (`contexts/AuthContext.jsx`):**
        *   Manages `user` object, `token`, `isAuthenticated` boolean.
        *   Provides `login(userData, token)`, `logout()`, `loadUserFromToken()` functions.
        *   `loadUserFromToken()`: On app load, checks `localStorage` for a token. If found, decodes it (or calls a backend `/api/auth/me` endpoint to validate and get user data) and populates context.
    2.  **SiteConfigContext (`contexts/SiteConfigContext.jsx`):**
        *   Manages `siteConfig` object (e.g., `{ hoaName, hoaDescription, hoaLogo }`).
        *   Provides `fetchSiteConfig()` function, called on app load. Fetches from a public config endpoint (e.g., `/api/config/public`).
        *   Provides loading and error states for config fetching.
    3.  **Providers:** Wrap the root application component (`App.jsx`) with `<AuthProvider>` and `<SiteConfigProvider>`.

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `contexts/AuthContext.jsx`:**
            *   Instruction: Verify it manages state for `user`, `token`, `isAuthenticated`.
            *   Instruction: Confirm it provides `login(userData, token)` and `logout()` functions that correctly update this state and interact with `localStorage` (if used for token persistence).
            *   Instruction: If token persistence is used, verify a function like `loadUserFromToken()` is called on initial app load (e.g., in the `AuthProvider`'s `useEffect`). This function should retrieve the token from `localStorage`, and if present, update the context state (potentially after validating the token with a backend call to `/api/auth/me` or by decoding it client-side if expiry is checked).
        2.  **Inspect `contexts/SiteConfigContext.jsx`:**
            *   Instruction: Verify it manages state for `siteConfig` (e.g., an object containing `hoaName`).
            *   Instruction: Confirm it provides a function to fetch this configuration (e.g., from `/api/config/public` or a general `/api/config` if it's public) and updates the context state.
            *   Instruction: Verify this fetch function is called when the `SiteConfigProvider` mounts.
            *   Instruction: Check for handling of loading and error states for config fetching.
        3.  **Inspect `main.jsx` or `App.jsx`:**
            *   Instruction: Verify the root of the application is wrapped by `<AuthProvider>` and `<SiteConfigProvider>` (order might matter depending on dependencies).
        4.  **Test context consumption:**
            *   Instruction: In a component like `Header.jsx`, verify it consumes `AuthContext` to display user-specific links and `SiteConfigContext` to display the HOA name.
            *   Instruction: Test login/logout and verify dependent components update correctly.
            *   Instruction: Refresh the page after login (if using token persistence) and verify the authenticated state is restored.

### User Story 46: Create API Service Layer with Axios
*   **As a** frontend developer,
*   **I want** to create a dedicated API service layer using Axios, including a centralized client configuration with request/response interceptors for token handling and global error management,
*   **So that** all backend API interactions are consistent, maintainable, and abstracted from UI components.

    **Technical Requirements:**
    1.  **Axios Client (`services/apiClient.js`):**
        *   Create an Axios instance: `axios.create({ baseURL: process.env.REACT_APP_API_URL })`.
        *   **Request Interceptor:**
            *   Retrieves token from `AuthContext` (or `localStorage`).
            *   If token exists, adds `Authorization: Bearer ${token}` header to outgoing requests.
        *   **Response Interceptor:**
            *   Handles global errors: e.g., if 401 Unauthorized is received, trigger logout in `AuthContext` and redirect to `/login`.
            *   Standardizes error object format if needed.
    2.  **Service Modules (e.g., `services/authService.js`, `documentService.js`, etc.):**
        *   Each module exports async functions for specific API operations (e.g., `authService.login(credentials)`).
        *   These functions use the configured `apiClient` to make requests.
        *   They `try/catch` errors, potentially re-throwing a standardized error or returning `null/undefined` for components to handle.
        *   Example: `async login(credentials) { try { const response = await apiClient.post('/auth/login', credentials); return response.data; } catch (error) { throw error.response?.data || error; } }`

*   `[ ] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `services/apiClient.js` (or similar):**
            *   Instruction: Verify an Axios instance is created using `axios.create()`.
            *   Instruction: Confirm `baseURL` is configured, ideally from an environment variable (e.g., `process.env.REACT_APP_API_URL` or `import.meta.env.VITE_API_URL` for Vite).
        2.  **Inspect Axios Request Interceptor:**
            *   Instruction: Verify `apiClient.interceptors.request.use()` is implemented.
            *   Instruction: Inside the interceptor, confirm it attempts to retrieve the authentication token (e.g., from `localStorage.getItem('authToken')` or by accessing `AuthContext`).
            *   Instruction: If a token is found, verify it adds an `Authorization` header to the request config (e.g., `config.headers.Authorization = Bearer ${token};`).
        3.  **Inspect Axios Response Interceptor (Optional but Recommended for Global Error Handling):**
            *   Instruction: Verify `apiClient.interceptors.response.use()` is implemented for handling responses or errors globally.
            *   Instruction: Check if it specifically handles 401 Unauthorized errors by, for example, triggering a logout action (from `AuthContext`) and redirecting to login.
            *   Instruction: Check if it standardizes error objects passed to service function callers.
        4.  **Inspect at least one service module (e.g., `services/authService.js`):**
            *   Instruction: Verify it imports and uses the configured `apiClient` instance.
            *   Instruction: For each function (e.g., `login`, `register`), verify it makes the correct HTTP request (method, URL path, payload) using `apiClient`.
            *   Instruction: Check that it returns the `response.data` on success and properly throws or returns a structured error on failure (e.g., `error.response.data`).
        5.  **Inspect a component that uses a service function:**
            *   Instruction: Verify the component imports the service and calls its functions.
            *   Instruction: Confirm the component uses `async/await` with `try/catch` (or promise `.then().catch()`) to handle the results/errors from the service function.