# Back-end Development Plan (Node.js)

## Technology Stack Assumptions

*   **Runtime Environment:** Node.js (LTS version, e.g., v18.x or v20.x)
*   **Web Framework:** Express.js
*   **Database:** SQLite (retaining from the original application for initial migration simplicity)
*   **Object-Relational Mapper (ORM):** Sequelize
*   **Authentication Strategy:** JSON Web Tokens (JWT)
*   **Password Hashing:** bcrypt
*   **API Documentation Standard:** OpenAPI Specification (Swagger)
*   **File Upload Handling:** Multer middleware for Express.js
*   **Development Language:** JavaScript (ES6+) or TypeScript (if preferred by the team, for this plan we'll assume JavaScript for simplicity in description, but TypeScript is a strong recommendation for new Node.js projects)
*   **Data Validation:** A library like Joi or express-validator.
*   **HTML Sanitization:** A library like DOMPurify (used server-side if applicable, or ensuring input that becomes HTML is handled safely).

## Goal

To develop a robust, scalable, and secure Node.js API that replicates all backend functionalities of the current PHP application. This API will serve as the single source of truth for data and business logic, ready to be consumed by the new React frontend.

## Expected Output

A fully functional set of RESTful API endpoints, complete with authentication, authorization, data validation, and business logic for all HOA application features. The API will be well-documented using OpenAPI/Swagger. The codebase will follow best practices for Node.js/Express.js development, including modular design and comprehensive error handling.

---

## Epic: User Authentication & Authorization

### User Story 1: Implement User Registration API
*   **As a** prospective user,
*   **I want** to register for an account via an API endpoint, providing my name, email, and password,
*   **So that** my details are securely stored, and my account is created in a 'pending' state awaiting administrator approval, enabling me to eventually access the HOA platform features.

    **Technical Requirements:**
    This story involves creating a public API endpoint (e.g., `POST /api/auth/register`). The backend will receive user details (`name`, `email`, `password`) in the request body.
    1.  **Controller (`auth.controller.js`):** This controller will handle the incoming request. It will utilize a validation service/middleware (e.g., using Joi or express-validator) to ensure `name` is non-empty, `email` is a valid email format and unique, and `password` meets defined complexity requirements (Minimum 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character).
        *   DONE: [`backend/src/validators/auth.validator.js`](./backend/src/validators/auth.validator.js) created and integrated for request validation.
    2.  **Service (`auth.service.js` or `user.service.js`):** This service will contain the core business logic. It will check if an email already exists in the `users` table using the Sequelize model.
    3.  **Password Hashing:** If the email is unique and validation passes, the `password` will be securely hashed using `bcrypt` (with an appropriate salt round, e.g., 10-12).
    4.  **Database Interaction (`user.model.js` via Sequelize):** A new record will be created in the `users` table with the provided `name`, `email`, the hashed password, a default `role` of 'member', and a `status` of 'pending'. The `created_at` timestamp will be set automatically.
    5.  **Response:** The API will return a success message (e.g., "Registration successful. Your account is pending approval.") and an appropriate HTTP status code (e.g., 201 Created). If registration fails (e.g., email exists, validation error), an appropriate error message and status code (e.g., 409 Conflict for duplicate email, 400 Bad Request for validation errors) will be returned.
    6.  **Security:** Ensure no sensitive information (like password hashes) is inadvertently leaked in error responses. Sanitize inputs to prevent injection attacks, though ORM helps.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `auth.controller.js` (or similar controller handling registration) and any associated `auth.service.js` or `user.service.js`:**
            *   Instruction: Verify that an API endpoint, such as `POST /api/auth/register`, is defined and mapped to a controller function.
            *   Instruction: Check the controller function to confirm it expects `name`, `email`, and `password` in the request body (e.g., `req.body`).
        2.  **Inspect the registration service logic and `user.model.js` (Sequelize model):**
            *   Instruction: Verify that the `password` received from the request is hashed using `bcrypt.hash()` or a similar method before any database operation.
            *   Instruction: Examine the Sequelize `User.create()` or equivalent call to ensure new users are created with a `role` property set to 'member' and a `status` property set to 'pending' by default.
        3.  **Inspect the response handling in the registration controller function:**
            *   Instruction: Confirm that upon successful user creation, the API responds with a JSON object containing a success message (e.g., `{ "message": "Registration successful. Your account is pending approval." }`) and an HTTP status code of 201.
        4.  **Inspect error handling for duplicate emails and validation failures:**
            *   Instruction: Verify that if a registration attempt is made with an email that already exists in the `users` table, the API responds with an HTTP status code of 409 and an appropriate error message (e.g., `{ "error": "Email already registered." }`).
            *   Instruction: Verify that if input validation fails (e.g., missing name, invalid email format, short password), the API responds with an HTTP status code of 400 and an error message detailing the validation failures.
        5.  **Inspect input validation logic (e.g., using Joi, express-validator, or custom middleware):**
            *   Instruction: Review the validation rules to ensure `name` is checked for non-emptiness.
            *   Instruction: Review the validation rules to ensure `email` is checked for a valid email format.
            *   Instruction: Review the validation rules to ensure `password` is checked for minimum 8 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character.

### User Story 2: Implement User Login API
*   **As a** registered user,
*   **I want** to log in via an API endpoint using my email and password,
*   **So that** I can receive a JSON Web Token (JWT) if my credentials are valid and my account is approved, allowing me to authenticate subsequent requests and access protected parts of the application.

    **Technical Requirements:**
    This story involves creating a public API endpoint (e.g., `POST /api/auth/login`).
    1.  **Controller (`auth.controller.js`):** Handles the incoming request with `email` and `password` in the body. Input validation will ensure both fields are present.
        *   DONE: [`backend/src/validators/auth.validator.js`](./backend/src/validators/auth.validator.js) created and integrated for request validation.
    2.  **Service (`auth.service.js` or `user.service.js`):**
        *   Fetches the user record from the `users` table by `email` using the Sequelize model. If no user is found, it's an authentication failure.
        *   Compares the provided `password` with the stored hashed password using `bcrypt.compare()`. If it doesn't match, it's an authentication failure.
        *   Checks the user's `status`. If the status is not 'approved' (e.g., 'pending', 'rejected'), an appropriate error (e.g., "Account not approved" or "Account pending approval") should be returned, even if credentials are correct.
    3.  **JWT Generation:** If authentication is successful and the account is approved, a JWT will be generated. The JWT payload should include essential, non-sensitive user identifiers like `userId` and `role`. The token should be signed with a secret key stored securely in environment variables and have a defined expiration time (e.g., 1 hour for access token, longer for a refresh token if implemented).
    4.  **Response:** The API will return the JWT (e.g., `{ "token": "your.jwt.here", "user": { "id": "...", "name": "...", "role": "..." } }`) and an HTTP status code 200 OK. For authentication failures or non-approved accounts, appropriate error messages and status codes (e.g., 401 Unauthorized, 403 Forbidden) will be returned.
    5.  **Security:** The JWT secret must be strong and kept confidential. Avoid including sensitive data in the JWT payload.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `auth.controller.js` (or similar) and any associated `auth.service.js`:**
            *   Instruction: Verify an API endpoint, such as `POST /api/auth/login`, is defined.
            *   Instruction: Check that the controller function expects `email` and `password` in the request body.
        2.  **Inspect the login service logic for user lookup and password verification:**
            *   Instruction: Verify the service attempts to find a user in the `users` table based on the provided `email`.
            *   Instruction: Confirm that `bcrypt.compare()` (or equivalent) is used to compare the plaintext password from the request with the stored hashed password from the database.
        3.  **Inspect the account status check logic:**
            *   Instruction: Verify that after successful password verification, the user's `status` field is checked.
            *   Instruction: If the `status` is not 'approved', confirm the API returns an HTTP status code of 403 and an error message like `{ "error": "Account pending approval." }` or `{ "error": "Account access denied." }`.
        4.  **Inspect JWT generation logic:**
            *   Instruction: Verify that upon successful authentication and 'approved' status, a JWT is generated using a library like `jsonwebtoken`.
            *   Instruction: Check that the JWT payload includes at least `userId` (or `id`) and `role`.
            *   Instruction: Verify the JWT is signed with a secret key loaded from environment variables (e.g., `process.env.JWT_SECRET`).
            *   Instruction: Confirm the API response includes the generated JWT (e.g., in a field named `token`) and user details (excluding password) and an HTTP status code of 200.
        5.  **Inspect error handling for invalid credentials:**
            *   Instruction: Verify that if the email is not found or the password does not match, the API responds with an HTTP status code of 401 and an error message like `{ "error": "Invalid email or password." }`.

### User Story 3: Implement JWT-based Authorization Middleware
*   **As a** backend developer,
*   **I want** to implement Express.js middleware to validate JWTs present in the `Authorization` header of incoming requests and to check user roles for protected endpoints,
*   **So that** sensitive operations are restricted to authenticated and appropriately authorized users, enhancing application security.

    **Technical Requirements:**
    This involves creating one or more middleware functions.
    1.  **Authentication Middleware (`auth.middleware.js` or similar - e.g., `verifyToken`):**
        *   This middleware will be applied to routes that require authentication.
        *   It will extract the JWT from the `Authorization` header (typically in the 'Bearer [token]' format).
        *   If no token is found or the format is incorrect, it should respond with a 401 Unauthorized error.
        *   It will verify the token's signature using the same JWT secret key used for generation. If verification fails (e.g., tampered token, invalid signature, expired token), it responds with 401 Unauthorized or 403 Forbidden.
        *   Upon successful verification, it will decode the token payload and attach user information (e.g., `userId`, `role`) to the `request` object (e.g., `req.user`) so subsequent handlers can access it.
        *   If verification is successful, it calls `next()` to pass control to the next middleware or route handler.
    2.  **Role-Checking Middleware (`auth.middleware.js` or similar - e.g., `authorizeRoles(...allowedRoles)`):**
        *   This middleware factory function will take an array of allowed roles as arguments.
        *   It will be applied *after* the authentication middleware.
        *   It will check if `req.user.role` is included in the `allowedRoles` array.
        *   If the user's role is not permitted, it responds with a 403 Forbidden error.
        *   If the role is permitted, it calls `next()`.
    3.  **Integration:** These middlewares will be added to the Express route definitions for protected endpoints. For example, an admin-only endpoint would use both `verifyToken` and `authorizeRoles('admin')`.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `auth.middleware.js` (or a similarly named file containing authentication middleware):**
            *   Instruction: Verify a middleware function (e.g., `verifyToken` or `authenticateJWT`) is created.
            *   Instruction: Check that this middleware attempts to extract a JWT from the `Authorization` header (e.g., from `req.headers.authorization` and expects a "Bearer" scheme).
            *   Instruction: Verify the middleware uses `jsonwebtoken.verify()` (or equivalent) with the correct secret key (from environment variables) to validate the token.
        2.  **Inspect the logic for attaching user information to the request object:**
            *   Instruction: Confirm that upon successful token verification, the decoded payload (containing at least `userId` and `role`) is attached to the `request` object (e.g., `req.user = decodedPayload;`).
        3.  **Inspect error handling for missing or invalid tokens:**
            *   Instruction: Verify that if no token is provided in the header, the middleware responds with an HTTP status code of 401 and an error message (e.g., `{ "error": "Access token is required." }`).
            *   Instruction: Verify that if the token is invalid (e.g., incorrect signature, expired), the middleware responds with an HTTP status code of 401 or 403 and an appropriate error message (e.g., `{ "error": "Invalid or expired token." }`).
        4.  **Inspect the role-checking middleware (e.g., `authorizeRoles`):**
            *   Instruction: Verify a middleware function exists that accepts one or more role strings as arguments (e.g., `authorizeRoles('admin', 'system')`).
            *   Instruction: Check that this middleware accesses `req.user.role` (set by the authentication middleware).
            *   Instruction: Verify it compares `req.user.role` against the list of allowed roles.
        5.  **Inspect error handling for insufficient role permissions:**
            *   Instruction: Confirm that if `req.user.role` is not in the list of allowed roles, the middleware responds with an HTTP status code of 403 and an error message (e.g., `{ "error": "You do not have permission to access this resource." }`).
        6.  **Inspect route definitions in relevant router files (e.g., `user.routes.js`, `admin.routes.js`):**
            *   Instruction: Verify that protected routes are configured to use the authentication middleware (e.g., `router.get('/protected', verifyToken, ...)`) and, where necessary, the role-checking middleware (e.g., `router.get('/admin/resource', verifyToken, authorizeRoles('admin'), ...)`).

### User Story 3.1: Implement Self-Service Password Reset API (Request & Verify Token)
*   **As a** registered user who has forgotten my password,
*   **I want** to request a password reset link via an API endpoint by providing my email address,
*   **So that** I can receive an email with a unique, time-sensitive token/link to initiate the password reset process.

 **Technical Requirements:**

    **1. Request Password Reset Token API**
    *   **Endpoint:** `POST /api/auth/forgot-password`
    *   **Request Body Example:**
        ```json
        {
          "email": "user@example.com"
        }
        ```
    *   **Response Body (Success - 200 OK):**
        ```json
        {
          "message": "Password reset email sent. Please check your inbox."
        }
        ```
    *   **Response Body (Error - 404 Not Found - Email not registered):**
        ```json
        {
          "error": "Email not found."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - User not approved/pending):**
        ```json
        {
          "error": "User account is not active or eligible for password reset."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Invalid email format):**
        ```json
        {
          "error": "Invalid email format."
        }
        ```
    *   **Authentication/Authorization:** Public endpoint.
    *   **Key Logic:**
        1.  Validate the `email` format in the request body.
        2.  Check if the email exists in the `users` table and if the user's `status` is 'approved'. If not, return an appropriate error.
        3.  Generate a cryptographically secure, unique, and time-limited token (e.g., UUID v4 or a long random string).
        4.  Hash the generated token using `bcrypt` before storing it.
        5.  Store the hashed token in the `verification_tokens` table, associated with the `user_id`, a `type` of 'password_reset', and an `expires_at` timestamp (e.g., 1 hour from creation).
        6.  Compose an email containing a password reset link. This link should point to a frontend page and include the plain (unhashed) token as a query parameter (e.g., `https://your-frontend-domain.com/reset-password?token=THE_GENERATED_TOKEN`).
        7.  Send the email to the user's registered email address.
        8.  Return a success message indicating the email has been sent.

    **2. Verify Password Reset Token API**
    *   **Endpoint:** `GET /api/auth/verify-reset-token`
    *   **Request Query Parameter:** `token` (e.g., `/api/auth/verify-reset-token?token=THE_GENERATED_TOKEN`)
    *   **Response Body (Success - 200 OK):**
        ```json
        {
          "message": "Token is valid."
        }
        ```
    *   **Response Body (Error - 400 Bad Request / 404 Not Found - Invalid, expired, or not found token):**
        ```json
        {
          "error": "Invalid or expired password reset token."
        }
        ```
    *   **Authentication/Authorization:** Public endpoint.
    *   **Key Logic:**
        1.  Extract the `token` from the request query parameters.
        2.  Iterate through tokens in the `verification_tokens` table: hash the provided `token` and compare it against stored hashed tokens of type 'password_reset' that are not expired. (Alternatively, if storing the plain token is acceptable for this specific short-lived use case and the transport is secure, direct lookup is simpler but less secure if the DB is compromised). For better security, hash the input token and compare with stored hashes.
        3.  If a matching, valid (correct type, not expired) token is found, return a success response.
        4.  If no such token is found, or if it's expired or of the wrong type, return an error.

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        *   **Request Reset Token:**
            1.  Given a user provides a valid email address associated with an 'approved' account, when they submit a request to `POST /api/auth/forgot-password`, then the system generates a unique password reset token, stores its hashed version with an expiry, sends an email containing the plain token in a reset link to the user, and the API returns a 200 OK response with a success message.
            2.  Given a user provides an email address not found in the system, when they request a password reset, then the API returns a 404 Not Found error.
            3.  Given a user provides an email address for an account that is 'pending' or 'rejected', when they request a password reset, then the API returns a 400 Bad Request error (or a generic message to prevent account status enumeration).
            4.  Given a user provides an improperly formatted email address, when they request a password reset, then the API returns a 400 Bad Request error.
            5.  The generated password reset token must be unique for each request and have a clearly defined, short expiration period (e.g., 1 hour).
            6.  The email sent to the user must contain a direct link to the password reset page on the frontend, including the token.
        *   **Verify Reset Token:**
            1.  Given a user navigates to `GET /api/auth/verify-reset-token` with a valid, unexpired 'password_reset' token, then the API returns a 200 OK response confirming token validity.
            2.  Given an invalid, expired, or non-existent token is provided to `GET /api/auth/verify-reset-token`, then the API returns a 400 Bad Request or 404 Not Found error.
            3.  The verification endpoint must ensure the token is specifically for 'password_reset' purposes.


### User Story 3.2: Implement Self-Service Password Reset API (Submit New Password)
*   **As a** user who has verified my password reset token,
*   **I want** to submit a new password via an API endpoint, providing the reset token and my new password,
*   **So that** my account password can be securely updated, and I can regain access.

    **Technical Requirements:**
    *   **Endpoint:** `POST /api/auth/reset-password`
    *   **Request Body Example:**
        ```json
        {
          "token": "THE_GENERATED_TOKEN_FROM_EMAIL",
          "newPassword": "NewSecurePassword123!"
        }
        ```
    *   **Response Body (Success - 200 OK):**
        ```json
        {
          "message": "Password has been reset successfully."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Invalid/Expired Token):**
        ```json
        {
          "error": "Invalid or expired password reset token."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Password Complexity):**
        ```json
        {
          "error": "Password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Missing fields):**
        ```json
        {
          "error": "Token and newPassword are required."
        }
        ```
    *   **Authentication/Authorization:** Public endpoint (the token itself acts as a temporary authorization for this specific action).
    *   **Key Logic:**
        1.  Validate that `token` and `newPassword` are present in the request body.
        2.  Verify the provided `token`:
            *   Hash the input `token` and search for it in the `verification_tokens` table.
            *   Ensure the found token record is of type 'password_reset', is associated with a valid `user_id`, and has not expired.
        3.  If the token is invalid, expired, or not found, return an appropriate error.
        4.  Validate the `newPassword` against the application's password complexity rules (e.g., minimum length, character types – align with registration policy). If validation fails, return an error.
        5.  Securely hash the `newPassword` using `bcrypt`.
        6.  Retrieve the `user_id` associated with the valid token.
        7.  Update the `password` field in the `users` table for the identified `user_id` with the new hashed password.
        8.  Invalidate or delete the used verification token from the `verification_tokens` table to prevent reuse.
        9.  (Optional but recommended) Consider invalidating other active sessions for the user to enhance security after a password reset.
        10. Log the successful password reset event (e.g., in an audit log if applicable for security monitoring).

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        1.  Given a user provides a valid, unexpired 'password_reset' token and a `newPassword` that meets complexity requirements to `POST /api/auth/reset-password`, then the user's password in the `users` table is updated with the new hashed password, the used token is invalidated/deleted from `verification_tokens`, and the API returns a 200 OK response with a success message.
        2.  Given a user provides an invalid, expired, or already used token, when they attempt to reset the password, then the API returns a 400 Bad Request error.
        3.  Given a user provides a `newPassword` that does not meet the defined complexity requirements, when they attempt to reset the password, then the API returns a 400 Bad Request error detailing the password policy.
        4.  The `newPassword` must be securely hashed using `bcrypt` before being stored in the database.
        5.  A password reset token must be single-use; attempting to use it again after a successful password reset must fail.
        6.  If `token` or `newPassword` fields are missing from the request, the API returns a 400 Bad Request error.

### User Story 3.3: Implement User Profile Self-Management API (View & Update Own Details)
*   **As an** authenticated user,
*   **I want** API endpoints to view my own user profile details (excluding sensitive data like password hash) and to update my modifiable details (e.g., name),
*   **So that** I can manage my personal information.

   **Technical Requirements:**

    **1. View Own User Profile API**
    *   **Endpoint:** `GET /api/users/me`
    *   **Request Body:** None.
    *   **Response Body (Success - 200 OK):**
        ```json
        {
          "id": 123,
          "name": "Current User Name",
          "email": "current.user@example.com",
          "role": "member",
          "status": "approved",
          "created_at": "2025-01-15T10:30:00.000Z",
          "updated_at": "2025-01-16T11:00:00.000Z"
        }
        ```
        (Note: Excludes sensitive fields like `password` hash, `is_system_user`, etc.)
    *   **Response Body (Error - 401 Unauthorized):** If token is missing or invalid.
        ```json
        {
          "error": "Unauthorized"
        }
        ```
    *   **Authentication/Authorization:** Requires an active, valid JWT for an authenticated user. Accessible by any authenticated role ('member', 'admin').
    *   **Key Logic:**
        1.  The `auth.middleware` (verifyToken) validates the JWT and attaches `req.user` (containing `userId`, `role`, etc.).
        2.  Extract `userId` from `req.user`.
        3.  Fetch the user's record from the `users` table using `userId`.
        4.  If user not found (should not happen if token is valid and user exists), return 404 or 500.
        5.  Select and return only the publicly safe and relevant user profile fields.

    **2. Update Own User Profile API**
    *   **Endpoint:** `PUT /api/users/me`
    *   **Request Body Example (Only `name` is updatable in this example):**
        ```json
        {
          "name": "New User Name"
        }
        ```
        (Other fields like email might require a separate, more complex flow with verification).
    *   **Response Body (Success - 200 OK):** Returns the updated user profile object.
        ```json
        {
          "id": 123,
          "name": "New User Name",
          "email": "current.user@example.com",
          "role": "member",
          "status": "approved",
          "created_at": "2025-01-15T10:30:00.000Z",
          "updated_at": "2025-06-01T14:20:00.000Z"
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Validation Error):**
        ```json
        {
          "errors": [
            { "field": "name", "message": "Name cannot be empty." }
          ]
        }
        ```
    *   **Response Body (Error - 401 Unauthorized):** If token is missing or invalid.
    *   **Authentication/Authorization:** Requires an active, valid JWT for an authenticated user.
    *   **Key Logic:**
        1.  The `auth.middleware` validates JWT and attaches `req.user`.
        2.  Extract `userId` from `req.user`.
        3.  Extract updatable fields (e.g., `name`) from `req.body`.
        4.  Validate the input data (e.g., `name` should not be empty if provided).
        5.  If validation fails, return a 400 error.
        6.  Fetch the user's record from the `users` table.
        7.  Update the allowed fields in the user's record.
        8.  Save the changes to the database.
        9.  Return the updated user profile object (selected fields).

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        *   **View Profile:**
            1.  Given an authenticated user sends a `GET` request to `/api/users/me`, then the API returns a 200 OK response containing their own profile information (including `id`, `name`, `email`, `role`, `status`, `created_at`, `updated_at`), and excluding sensitive data like the password hash.
            2.  Given a request is made to `GET /api/users/me` without a valid authentication token, then the API returns a 401 Unauthorized error.
        *   **Update Profile:**
            1.  Given an authenticated user sends a `PUT` request to `/api/users/me` with valid data for modifiable fields (e.g., a new `name`), then the user's record in the database is updated, and the API returns a 200 OK response with the complete updated user profile.
            2.  Given an authenticated user sends a `PUT` request to `/api/users/me` with invalid data (e.g., an empty `name`), then the API returns a 400 Bad Request error with details about the validation failure.
            3.  An authenticated user must only be able to update their own profile information.
            4.  Attempting to update fields not designated as user-modifiable via this endpoint (e.g., `email` if it requires verification, `role`, `status`) should be ignored or result in a specific error if explicitly disallowed.

### User Story 3.4: Implement User API to Change Own Password
*   **As an** authenticated user,
*   **I want** an API endpoint to change my own password by providing my current password and a new password,
*   **So that** I can maintain the security of my account.

    **Technical Requirements:**
    *   **Endpoint:** `PUT /api/users/me/password`
    *   **Request Body Example:**
        ```json
        {
          "currentPassword": "OldSecurePassword123!",
          "newPassword": "BrandNewSecurePassword456$"
        }
        ```
    *   **Response Body (Success - 200 OK):**
        ```json
        {
          "message": "Password changed successfully."
        }
        ```
    *   **Response Body (Error - 400 Bad Request - Password Complexity / Missing Fields):**
        ```json
        {
          "error": "New password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
        }
        ```
        ```json
        {
          "error": "Current password and new password are required."
        }
        ```
    *   **Response Body (Error - 401 Unauthorized):** If token is missing or invalid.
    *   **Response Body (Error - 403 Forbidden - Incorrect Current Password):**
        ```json
        {
          "error": "Incorrect current password."
        }
        ```
    *   **Authentication/Authorization:** Requires an active, valid JWT for an authenticated user.
    *   **Key Logic:**
        1.  The `auth.middleware` validates JWT and attaches `req.user`.
        2.  Extract `userId` from `req.user`.
        3.  Extract `currentPassword` and `newPassword` from `req.body`. Validate their presence.
        4.  Fetch the authenticated user's record from the `users` table (including the `password` hash).
        5.  Verify the provided `currentPassword` against the stored hashed password using `bcrypt.compare()`.
        6.  If `currentPassword` does not match, return a 403 Forbidden error.
        7.  Validate the `newPassword` against the application's password complexity rules. If validation fails, return a 400 Bad Request error.
        8.  Securely hash the `newPassword` using `bcrypt`.
        9.  Update the `password` field in the `users` table for the `userId` with the new hashed password.
        10. Return a success message.
        11. (Optional but recommended) Consider invalidating other active sessions for the user.

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        1.  Given an authenticated user sends a `PUT` request to `/api/users/me/password` with their correct `currentPassword` and a `newPassword` that meets complexity requirements, then the user's password in the database is updated with the new hashed password, and the API returns a 200 OK response with a success message.
        2.  Given an authenticated user provides an incorrect `currentPassword`, when they attempt to change their password, then the API returns a 403 Forbidden error.
        3.  Given an authenticated user provides a `newPassword` that does not meet the defined complexity requirements, when they attempt to change their password, then the API returns a 400 Bad Request error detailing the password policy.
        4.  Given an authenticated user omits `currentPassword` or `newPassword` from the request, then the API returns a 400 Bad Request error.
        5.  The `newPassword` must be securely hashed using `bcrypt` before being stored.
        6.  Given a request is made to `PUT /api/users/me/password` without a valid authentication token, then the API returns a 401 Unauthorized error.

---

## Epic: User Management (Admin)

### User Story 4: Implement API to List and Retrieve Users (Admin)
*   **As an** administrator,
*   **I want** API endpoints to list all non-system users and retrieve a specific non-system user's details (excluding sensitive information like passwords),
*   **So that** I can effectively manage user accounts within the HOA system.

    **Technical Requirements:**
    These endpoints will be protected and accessible only to users with an 'admin' role.
    1.  **List Users Endpoint (e.g., `GET /api/admin/users`):**
        *   **Controller (`admin.user.controller.js` or similar):** Handles the request.
        *   **Service (`user.service.js`):** Fetches users from the `users` table using Sequelize.
        *   **Filtering:** Excludes users where `is_system_user` is true.
        *   **Data Projection:** Ensures that sensitive fields like `password` are *not* returned in the response. Only necessary fields like `id`, `name`, `email`, `role`, `status`, `created_at` should be included.
        *   **Pagination:** Implement pagination (e.g., using `limit` and `offset` query parameters) to handle potentially large numbers of users.
        *   **Response:** Returns a list of user objects and pagination details.
    2.  **Retrieve Specific User Endpoint (e.g., `GET /api/admin/users/:id`):**
        *   **Controller:** Handles the request, extracting `id` from path parameters.
        *   **Service:** Fetches a single user by `id`.
        *   **Security:** Ensures the user being fetched is not a system user (or handles this case appropriately, e.g., by returning 404 or 403 if admins should not view system user details this way).
        *   **Data Projection:** Excludes `password`.
        *   **Response:** Returns the user object or a 404 Not Found if the user doesn't exist or access is denied.
    3.  **Authorization:** Both endpoints must be protected by the JWT authentication and 'admin' role authorization middlewares.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect the route definitions for admin user management (e.g., in `admin.routes.js` or `user.routes.js`):**
            *   Instruction: Verify an endpoint like `GET /api/admin/users` is defined and protected by authentication and 'admin' role authorization middleware.
            *   Instruction: Verify an endpoint like `GET /api/admin/users/:userId` is defined and protected similarly.
        2.  **Inspect the controller and service logic for listing users (`GET /api/admin/users`):**
            *   Instruction: Verify the service layer queries the `users` table, explicitly filtering out users where `is_system_user` is true (or an equivalent flag).
            *   Instruction: Check the Sequelize query options (e.g., `attributes: { exclude: ['password'] }`) to ensure the `password` field is never returned in the list.
            *   Instruction: Verify that the response is an array of user objects.
            *   Instruction: (Optional but recommended) Check for support for pagination query parameters (e.g., `limit`, `offset` or `page`, `pageSize`).
        3.  **Inspect the controller and service logic for retrieving a specific user (`GET /api/admin/users/:userId`):**
            *   Instruction: Verify the service layer queries the `users` table for a user with the given `userId`.
            *   Instruction: Ensure it checks if the retrieved user has `is_system_user` as true and returns a 404 or 403 if such users should not be accessible via this endpoint.
            *   Instruction: Check the Sequelize query options to ensure the `password` field is excluded from the response.
            *   Instruction: Verify that if a user is found and accessible, their details are returned. If not found, a 404 status is returned.

### User Story 5: Implement API to Update User Role and Status (Admin)
*   **As an** administrator,
*   **I want** API endpoints to update a non-system user's role (e.g., from 'member' to 'admin') and status (e.g., from 'pending' to 'approved'),
*   **So that** I can manage user access levels and activate new accounts.

    **Technical Requirements:**
    These endpoints will modify user data and must be protected for 'admin' role access.
    1.  **Update Status Endpoint (e.g., `PUT /api/admin/users/:id/status`):**
        *   **Controller (`admin.user.controller.js`):** Extracts `id` from path and new `status` from request body.
        *   **Validation:** Validates the new `status` value against allowed values (e.g., 'approved', 'pending', 'rejected').
        *   **Service (`user.service.js`):** Fetches the user by `id`.
        *   **Security Check:** Verifies the user is not a system user (`is_system_user !== true`). If so, disallow update and return 403.
        *   **Database Interaction:** Updates the `status` field for the user.
        *   **Audit Logging:** Logs this action (see Audit Log epic).
        *   **Response:** Returns the updated user object (excluding password) or success message.
    2.  **Update Role Endpoint (e.g., `PUT /api/admin/users/:id/role`):**
        *   **Controller:** Extracts `id` from path and new `role` from request body.
        *   **Validation:** Validates the new `role` value against allowed roles (e.g., 'admin', 'member'). The original PHP also has a "system" role concept for `manage_config.php`, this should be considered if distinct.
        *   **Service:** Fetches the user by `id`.
        *   **Security Check:** Verifies the user is not a system user.
        *   **Database Interaction:** Updates the `role` field for the user.
        *   **Audit Logging:** Logs this action.
        *   **Response:** Returns the updated user object (excluding password) or success message.
    3.  **Authorization:** Both endpoints protected by JWT auth and 'admin' role.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for updating user status and role:**
            *   Instruction: Verify an endpoint like `PUT /api/admin/users/:userId/status` is defined and protected by authentication and 'admin' role authorization.
            *   Instruction: Verify an endpoint like `PUT /api/admin/users/:userId/role` is defined and protected similarly.
        2.  **Inspect controller and service logic for `PUT /api/admin/users/:userId/status`:**
            *   Instruction: Verify the controller expects a `status` field in the request body.
            *   Instruction: Check that the service validates the new `status` value (e.g., against ['approved', 'pending', 'rejected']).
            *   Instruction: Verify the service fetches the user by `userId` and checks if `is_system_user` is true. If true, ensure the update is prevented and a 403 status is returned.
            *   Instruction: Confirm the `status` field of the user is updated in the database if the user is not a system user.
            *   Instruction: Verify an audit log entry is created for this action, including `adminId`, `action` type (e.g., 'user_status_update'), and relevant details (e.g., `userId`, new `status`).
        3.  **Inspect controller and service logic for `PUT /api/admin/users/:userId/role`:**
            *   Instruction: Verify the controller expects a `role` field in the request body.
            *   Instruction: Check that the service validates the new `role` value (e.g., against ['admin', 'member']).
            *   Instruction: Verify the service fetches the user by `userId` and checks if `is_system_user` is true. If true, ensure the update is prevented and a 403 status is returned.
            *   Instruction: Confirm the `role` field of the user is updated in the database if the user is not a system user.
            *   Instruction: Verify an audit log entry is created for this action, including `adminId`, `action` type (e.g., 'user_role_update'), and relevant details (e.g., `userId`, new `role`).
        4.  **Inspect the responses from both endpoints:**
            *   Instruction: Verify that upon successful update, the API returns the updated user object (excluding the password) or a success message, with an HTTP status code of 200.

### User Story 6: Implement API to Delete User (Admin)
*   **As an** administrator,
*   **I want** an API endpoint to delete a non-system user, which also handles their associated data like uploaded documents,
*   **So that** I can permanently remove accounts and their contributions from the system when necessary.

    **Technical Requirements:**
    This is a destructive operation and requires careful implementation.
    1.  **Endpoint (e.g., `DELETE /api/admin/users/:id`):**
        *   **Controller (`admin.user.controller.js`):** Extracts `id` from path.
        *   **Service (`user.service.js`):**
            *   Fetches the user by `id`. If not found, return 404.
            *   **Security Check:** Verifies the user is not a system user (`is_system_user !== true`). If so, disallow deletion and return 403.
            *   **Associated Data Handling:**
                *   **Documents:** Identify all documents uploaded by this user (from `documents` table). For each document, delete the physical file from storage (using `fs.unlink` and the stored `file_path`) and then delete the document record from the database. This matches the PHP app's behavior.
                *   **Other Content (Discussions, Announcements, Events):** Review if the PHP app cascaded deletions or anonymized. For this migration, if not explicitly cascaded, user-created content in these tables might remain but be linked to a non-existent `created_by` ID, or a decision needs to be made (e.g., set `created_by` to NULL or a special "deleted user" ID if the schema allows, or cascade delete if appropriate). The PHP code in `manage_users.php` only explicitly handles document deletion. For other content, deletion is managed by their respective admin modules. We will replicate the PHP app's document deletion logic.
            *   **Database Interaction:** Delete the user record from the `users` table. Consider using `ON DELETE SET NULL` or `ON DELETE CASCADE` for foreign keys in other tables if appropriate for the new design, defined at the ORM/DB level.
        *   **Audit Logging:** Logs this action.
        *   **Response:** Returns a success message and 200 OK or 204 No Content.
    2.  **Authorization:** Protected by JWT auth and 'admin' role.
    3.  **Transactions:** Use database transactions to ensure atomicity, especially when deleting files and multiple database records. If a file deletion fails, the user deletion should ideally be rolled back.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for deleting a user:**
            *   Instruction: Verify an endpoint like `DELETE /api/admin/users/:userId` is defined and protected by authentication and 'admin' role authorization.
        2.  **Inspect controller and service logic for `DELETE /api/admin/users/:userId`:**
            *   Instruction: Verify the service fetches the user by `userId`.
            *   Instruction: Confirm the service checks if `is_system_user` is true for the fetched user. If true, ensure the deletion is prevented and a 403 status is returned.
        3.  **Inspect handling of associated documents:**
            *   Instruction: Verify the service queries the `documents` table for all documents where `uploaded_by` matches the `userId`.
            *   Instruction: For each found document, verify the code attempts to delete the corresponding physical file from the server's file system (using the `file_path` stored in the document record and `fs.unlink()`).
            *   Instruction: After attempting file deletion, verify the document record is deleted from the `documents` table.
        4.  **Inspect user deletion from the database:**
            *   Instruction: Verify that after handling associated data, the user record itself is deleted from the `users` table. (Check if foreign key constraints in other tables like `discussions`, `announcements`, `events` are handled gracefully, e.g., `ON DELETE SET NULL` if `created_by` is nullable, or if they prevent deletion if not handled).
        5.  **Inspect audit logging:**
            *   Instruction: Verify an audit log entry is created for this action, including `adminId`, `action` type (e.g., 'user_delete'), and `userId`.
        6.  **Inspect the response:**
            *   Instruction: Verify that upon successful deletion, the API returns an HTTP status code of 200 with a success message or a 204 No Content status.
        7.  **Inspect database transaction usage:**
            *   Instruction: Verify that the operations for deleting associated documents (files and DB records) and the user record are wrapped in a database transaction (e.g., `sequelize.transaction()`).

### User Story 7: Implement API for Admin to Change User Password
*   **As an** administrator,
*   **I want** an API endpoint to change a non-system user's password,
*   **So that** I can assist users who are locked out or require a password reset, without needing to know their current password.

    **Technical Requirements:**
    This endpoint allows admins to directly set a new password for a user.
    1.  **Endpoint (e.g., `PUT /api/admin/users/:id/password`):**
        *   **Controller (`admin.user.controller.js`):** Extracts `id` from path and `newPassword` from request body.
        *   **Validation:** Validates `newPassword` meets complexity requirements (e.g., min 8 characters).
        *   **Service (`user.service.js`):**
            *   Fetches the user by `id`. If not found, return 404.
            *   **Security Check:** Verifies the user is not a system user (`is_system_user !== true`). If so, disallow update and return 403.
            *   **Password Hashing:** Securely hash the `newPassword` using `bcrypt`.
            *   **Database Interaction:** Update the `password` field for the user with the new hashed password.
        *   **Audit Logging:** Logs this action.
        *   **Response:** Returns a success message and 200 OK.
    2.  **Authorization:** Protected by JWT auth and 'admin' role.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for changing a user's password by admin:**
            *   Instruction: Verify an endpoint like `PUT /api/admin/users/:userId/password` is defined and protected by authentication and 'admin' role authorization.
        2.  **Inspect controller and service logic for `PUT /api/admin/users/:userId/password`:**
            *   Instruction: Verify the controller expects a `newPassword` field in the request body.
            *   Instruction: Check that the service validates the `newPassword` for minimum length/complexity.
            *   Instruction: Verify the service fetches the user by `userId`.
            *   Instruction: Confirm the service checks if `is_system_user` is true for the fetched user. If true, ensure the password change is prevented and a 403 status is returned.
            *   Instruction: Verify the `newPassword` is hashed using `bcrypt.hash()` before updating the database.
            *   Instruction: Confirm the `password` field of the user is updated in the database with the new hash.
        3.  **Inspect audit logging:**
            *   Instruction: Verify an audit log entry is created for this action, including `adminId`, `action` type (e.g., 'admin_password_change'), and `userId`.
        4.  **Inspect the response:**
            *   Instruction: Verify that upon successful password change, the API returns an HTTP status code of 200 and a success message.

---

## Epic: Document Management

### User Story 8: Implement API to Upload Document (Admin)
*   **As an** administrator,
*   **I want** an API endpoint to upload documents (e.g., PDF, DOCX, images) along with metadata like title, description, and a public access flag,
*   **So that** these documents can be stored securely and made available to HOA members as appropriate.

    **Technical Requirements:**
    This endpoint will handle file uploads and metadata storage.
    1.  **Endpoint (e.g., `POST /api/admin/documents`):**
        *   **Middleware:** Uses `Multer` for handling `multipart/form-data`. Configure Multer for file destination (secure server location, e.g., `./uploads/documents` - ensure this path is not directly web-accessible if files are to be served via a protected download endpoint), file naming (e.g., unique ID + original extension to prevent collisions and manage file types), and file size/type limits (from PHP config: `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`).
        *   **Controller (`document.controller.js`):** Accesses uploaded file details from `req.file` (or `req.files`) and other metadata (`title`, `description`, `is_public`) from `req.body`.
        *   **Validation:** Validates `title` (non-empty). `description` is optional. `is_public` is a boolean.
        *   **Service (`document.service.js`):**
            *   **Database Interaction:** Creates a new record in the `documents` table. Store `title`, `description`, original `file_name` (from `req.file.originalname`), the Multer-generated `file_name` for storage (from `req.file.filename`), `file_path` (path to the file on server, constructed from Multer's destination and filename), `uploaded_by` (admin's `userId` from `req.user`), `is_public` flag. If `is_public` is true, `approved` status should be set to true; otherwise, `approved` is false by default (matching PHP logic: `upload_document.php` sets `approved = $is_public ? 1 : 0`).
        *   **Audit Logging:** Logs document upload.
        *   **Response:** Returns the created document metadata object and 201 Created.
    2.  **Authorization:** Protected by JWT auth and 'admin' role.
    3.  **Error Handling:** Gracefully handle file upload errors (e.g., disk full, permission issues, type/size violations from Multer).

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for document upload:**
            *   Instruction: Verify an endpoint like `POST /api/admin/documents` is defined and protected by authentication and 'admin' role authorization.
            *   Instruction: Verify this route uses `Multer` middleware configured for single file upload (e.g., `upload.single('documentFile')`).
        2.  **Inspect Multer configuration:**
            *   Instruction: Check Multer's `diskStorage` (or other storage) options for `destination` (points to a server directory, e.g., `uploads/documents/`) and `filename` (generates a unique name, e.g., using `Date.now()` or `uuid` along with the original extension).
            *   Instruction: Verify `fileFilter` options are set to allow specific MIME types (e.g., PDF, DOC, DOCX, common image types based on `ALLOWED_FILE_TYPES` from PHP config) and `limits` are set for file size (based on `MAX_FILE_SIZE` from PHP config).
        3.  **Inspect controller and service logic for `POST /api/admin/documents`:**
            *   Instruction: Verify the controller accesses file information from `req.file` (e.g., `req.file.filename` for stored name, `req.file.originalname` for original name, `req.file.path` for full path) and text fields like `title`, `description`, `is_public` from `req.body`.
            *   Instruction: Confirm `title` is validated as non-empty.
            *   Instruction: Verify the service creates a new record in the `documents` table. The record must include `title`, `description`, `file_name` (stored unique filename), `file_path` (full path to the uploaded file on server), `uploaded_by` (from `req.user.id`), `is_public` (boolean from request), and `approved`.
            *   Instruction: Verify that if `is_public` is true, the `approved` status is set to `true`; otherwise, `approved` is set to `false`.
        4.  **Inspect audit logging:**
            *   Instruction: Verify an audit log entry is created for the document upload, including `adminId`, `action` ('document_upload'), and document details (e.g., new document ID, title).
        5.  **Inspect the physical file system on the server after a test upload:**
            *   Instruction: Confirm the uploaded file exists in the configured Multer destination directory with the generated unique filename.
        6.  **Inspect the API response:**
            *   Instruction: Verify that upon successful upload, the API returns the newly created document's metadata (from the database) with an HTTP status code of 201.

### User Story 9: Implement API to List and Retrieve Documents (User & Admin)
*   **As a** user (member or admin),
*   **I want** API endpoints to list available documents and retrieve specific document details and download the files, respecting access permissions (public vs. authenticated, approved status),
*   **So that** I can access shared HOA information relevant to my role.

    **Technical Requirements:**
    This involves multiple endpoints with varying access logic.
    1.  **List Documents Endpoint (e.g., `GET /api/documents`):**
        *   **Controller (`document.controller.js`):**
        *   **Service (`document.service.js`):**
            *   **If user is not authenticated (guest):** Fetches only documents where `is_public = true` AND `approved = true`. (Matches `documents.php` logic for non-logged-in users).
            *   **If user is authenticated (member or admin):** Fetches all documents (both public/private, approved/unapproved). (Matches `documents.php` logic for logged-in users which simply selects all; admin view in `manage_documents.php` also shows all). For the new API, to provide more granular control, an admin flag could be used: if admin, show all; if member, show all approved. Let's align with: Guest - public & approved; Member - all approved; Admin - all.
            *   **Data Projection:** Returns relevant metadata (id, title, description, uploaded_at, is_public, approved status, uploader name).
            *   **Pagination:** Support `limit` and `offset`.
        *   **Response:** List of document metadata objects.
    2.  **Retrieve Specific Document Metadata Endpoint (e.g., `GET /api/documents/:id`):**
        *   **Controller:** Extracts `id`.
        *   **Service:** Fetches document by `id`. Applies same access logic as listing based on auth state and document properties (`is_public`, `approved`).
        *   **Response:** Single document metadata object or 404/403.
    3.  **Download Document Endpoint (e.g., `GET /api/documents/:id/download`):**
        *   **Controller:** Extracts `id`.
        *   **Service:**
            *   Fetches document by `id`. If not found, 404.
            *   **Access Control (based on `download_document.php`):**
                *   If document `approved != 1` AND user is not 'admin': Deny access (403).
                *   If document `is_public != 1` AND user is not authenticated: Deny access (redirect to login in PHP, so 401/403 for API).
                *   Otherwise, allow download. This means: admins can download anything. Authenticated members can download approved non-public docs. Anyone can download approved public docs.
            *   If allowed, construct the full server file path from stored `file_path`.
            *   **File Serving:** Use `res.download(fullFilePath, document.file_name)` (where `document.file_name` is the original filename for download prompt, though `download_document.php` used basename of stored path, implies stored name was original name). For clarity, assume `file_name` in DB is the user-facing filename for download.
        *   **Security:** Ensure the path derived from `file_path` does not allow path traversal vulnerabilities. It should be an absolute path or resolved safely.

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect controller and service logic for `GET /api/documents` (List Documents):**
            *   Instruction: If the request is unauthenticated, verify the query to the `documents` table filters for `is_public = true` AND `approved = true`.
            *   Instruction: If the request is authenticated by a 'member', verify the query filters for `approved = true`.
            *   Instruction: If the request is authenticated by an 'admin', verify the query fetches all documents without `is_public` or `approved` filters.
            *   Instruction: Verify pagination parameters (`limit`, `offset`) are correctly applied.
            *   Instruction: Check that the response is an array of document metadata objects, including uploader's name (joined from `users` table).
        2.  **Inspect controller and service logic for `GET /api/documents/:id` (Retrieve Metadata):**
            *   Instruction: Verify the service fetches the document by `id`.
            *   Instruction: Confirm access control logic matches the listing endpoint for visibility of metadata: Guest - public & approved; Member - all approved; Admin - all.
            *   Instruction: If access is denied, verify a 403 status is returned. If not found, 404.
            *   Instruction: If access is granted, verify the document metadata is returned.
        3.  **Inspect controller and service logic for `GET /api/documents/:id/download` (Download Document):**
            *   Instruction: Verify the service fetches the document by `id`.
            *   Instruction: Confirm download access control:
                *   If `document.approved` is false AND user is not 'admin', return 403.
                *   If `document.is_public` is false AND user is not authenticated, return 401 or 403.
                *   Otherwise, proceed to download.
            *   Instruction: If download is permitted, verify `res.download(absoluteFilePath, userFacingFileName)` is used. `absoluteFilePath` should be correctly resolved from the stored `file_path` in the database. `userFacingFileName` should be the original name of the file or the `title`.
            *   Instruction: Verify the `Content-Type` header is set based on the file's type if possible.

### User Story 10: Implement API for Admin to Manage Documents (Approve/Delete)
*   **As an** administrator,
*   **I want** API endpoints to approve pending documents and to delete existing documents (including their physical files),
*   **So that** I can curate the available documents and remove outdated or inappropriate ones.

    **Technical Requirements:**
    Admin-only, destructive operations.
    1.  **Approve Document Endpoint (e.g., `PUT /api/admin/documents/:id/approve`):**
        *   **Controller (`document.controller.js`):** Extracts `id`.
        *   **Service (`document.service.js`):**
            *   Fetches document by `id`. If not found, 404.
            *   **Database Interaction:** Sets `approved = true` for the document.
        *   **Audit Logging:** Logs approval.
        *   **Response:** Updated document metadata or success message.
    2.  **Delete Document Endpoint (e.g., `DELETE /api/admin/documents/:id`):**
        *   **Controller:** Extracts `id`.
        *   **Service:**
            *   Fetches document by `id` to get `file_path`. If not found, 404.
            *   **File System Interaction:** Deletes the physical file from the server path identified by `file_path` using `fs.unlink()`. Handle errors if file not found on disk but exists in DB (log error, but proceed with DB deletion).
            *   **Database Interaction:** Deletes the document record from `documents` table.
        *   **Audit Logging:** Logs deletion.
        *   **Response:** Success message (200 OK or 204 No Content).
    3.  **Authorization:** Both protected by JWT auth and 'admin' role.

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for admin document management:**
            *   Instruction: Verify an endpoint like `PUT /api/admin/documents/:documentId/approve` is defined and protected for 'admin' role.
            *   Instruction: Verify an endpoint like `DELETE /api/admin/documents/:documentId` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `PUT /api/admin/documents/:documentId/approve`:**
            *   Instruction: Verify the service fetches the document by `documentId`. If not found, ensure 404.
            *   Instruction: Confirm the `approved` field of the document is set to `true` and saved to the database.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'document_approval'`, `details: { documentId }`).
            *   Instruction: Verify the API returns the updated document metadata or a success message.
        3.  **Inspect controller and service logic for `DELETE /api/admin/documents/:documentId`:**
            *   Instruction: Verify the service fetches the document by `documentId` to retrieve its `file_path`. If not found, ensure 404.
            *   Instruction: Verify the code uses `fs.unlink()` or similar to delete the physical file from the server using the retrieved `file_path`. Log errors from `fs.unlink()` but proceed.
            *   Instruction: Confirm the document record is deleted from the `documents` table.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'document_deletion'`, `details: { documentId }`).
            *   Instruction: Verify the API returns a success status (e.g., 200 or 204).

---

## Epic: Announcements Management

### User Story 11: Implement API for Admin to Create Announcements
*   **As an** administrator,
*   **I want** an API endpoint to create new announcements with a title and content (which may include HTML formatting),
*   **So that** I can efficiently publish important information to the HOA community.

    **Technical Requirements:**
    *   **API Endpoint**:
        *   Method: `POST`
        *   URL: `/api/admin/announcements`
    *   **Request Body Structure & Validation Rules**:
        *   `title`: `string`, required, max length 255.
        *   `content`: `text`, required. (If HTML is allowed, server-side sanitization is crucial, e.g., using DOMPurify).
        *   `userId`: This will be derived from the authenticated admin user (e.g., `req.user.id` or similar, obtained via JWT authentication middleware) and will be used as `created_by` in the database. It is not part of the direct request body from the client.
        *   `expiresAt`: `date` (ISO 8601 format), optional. If provided, must be a date in the future.
    *   **Response Structure**:
        *   **Success (HTTP 201 Created)**:
            *   Body: The newly created announcement object.
            ```json
            {
              "id": 123,
              "title": "New Maintenance Schedule",
              "content": "<p>Details about the new schedule...</p>",
              "userId": 1, // or created_by
              "createdAt": "2025-06-01T10:00:00.000Z",
              "updatedAt": "2025-06-01T10:00:00.000Z",
              "expiresAt": "2025-07-01T23:59:59.000Z" // null if not provided
            }
            ```
        *   **Error (HTTP 400 Bad Request)**: For validation errors.
            ```json
            {
              "errors": [
                { "field": "title", "message": "Title cannot exceed 255 characters." },
                { "field": "expiresAt", "message": "Expiration date must be in the future." }
              ]
            }
            ```
        *   **Error (HTTP 401 Unauthorized)**: If the user is not authenticated.
        *   **Error (HTTP 403 Forbidden)**: If the authenticated user is not an admin.
    *   **Service Layer Logic Outline (`announcement.service.js`)**:
        1.  Receive validated data (`title`, `content`, optional `expiresAt`) and `userId` (from authenticated admin) from the controller.
        2.  If `content` is HTML and requires sanitization, ensure it has been sanitized by the controller or perform sanitization here.
        3.  Prepare the announcement object for database insertion:
            *   `title`
            *   `content` (sanitized)
            *   `created_by`: `userId`
            *   `expires_at`: `expiresAt` (if provided and valid)
            *   `created_at`, `updated_at`: Will be set by Sequelize.
        4.  If `expiresAt` is provided, validate that it's a date in the future. If not, throw a validation error.
        5.  Use the `Announcement` Sequelize model to save the object to the `announcements` table.
        6.  Log the "announcement_creation" action to the audit log (e.g., `auditService.logAdminAction(userId, 'announcement_creation', { announcementId: newAnnouncement.id, title: newAnnouncement.title })`).
        7.  Return the newly created announcement object (including `id`, `createdAt`, `updatedAt`).
    *   **Controller Layer Logic Outline (`announcement.controller.js`)**:
        1.  Extract `title`, `content`, and `expiresAt` (optional) from `req.body`.
        2.  Perform input validation:
            *   `title`: required, string, max length 255.
            *   `content`: required, text.
            *   `expiresAt`: optional, valid ISO 8601 date string.
        3.  If validation fails, return an HTTP 400 response with detailed error messages.
        4.  If `content` is intended to be HTML and needs sanitization (as per application policy for rich text editors), sanitize it using a library like DOMPurify: `const sanitizedContent = DOMPurify.sanitize(content);`.
        5.  Obtain `userId` from the authenticated user object attached by the authentication middleware (e.g., `req.user.id`).
        6.  Call `announcementService.createAnnouncement({ title, content: sanitizedContent || content, expiresAt }, userId)`.
        7.  Handle the service response:
            *   On successful creation, send an HTTP 201 Created response with the new announcement object.
            *   If the service throws a validation error (e.g., `expiresAt` not in future), send an HTTP 400 response.
            *   For other unexpected service errors, send an HTTP 500 Internal Server Error response.
    *   **Authorization**:
        *   This endpoint must be protected by JWT authentication middleware (`verifyToken`).
        *   It must also be protected by role-based authorization middleware ensuring only users with the 'admin' role can access it (`authorizeRoles('admin')`).

*   `[x] Completed`
    *   - Implementation complete.
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for creating announcements:**
            *   Instruction: Verify an endpoint like `POST /api/admin/announcements` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `POST /api/admin/announcements`:**
            *   Instruction: Verify the controller expects `title` and `content` in the request body.
            *   Instruction: Confirm validation ensures `title` and `content` are not empty.
            *   Instruction: If `content` is expected to be HTML, verify a server-side HTML sanitization step (e.g., using `DOMPurify` or a similar library) is performed on the `content` before it's saved to the database.
            *   Instruction: Verify the service creates a new record in the `announcements` table, storing `title`, (sanitized) `content`, and `created_by` (from `req.user.id`).
        3.  **Inspect audit logging:**
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'announcement_creation'`, `details: { announcementId, title }`).
        4.  **Inspect the API response:**
            *   Instruction: Verify that upon successful creation, the API returns the newly created announcement object (including its ID) with an HTTP status code of 201.

### User Story 12: Implement API to List Announcements (User)
*   **As an** authenticated user,
*   **I want** an API endpoint to list recent announcements, ordered by creation date,
*   **So that** I can stay informed about community news.

    **Technical Requirements:**
    *   **API Endpoint**:
        *   Method: `GET`
        *   URL: `/api/announcements`
    *   **Query Parameters**:
        *   `page`: `integer`, optional. Represents the page number for pagination.
            *   Default: `1`.
            *   Validation: Must be a positive integer (>= 1).
        *   `limit`: `integer`, optional. Represents the number of items per page.
            *   Default: `10`.
            *   Validation: Must be a positive integer (>= 1), recommended maximum of `100`.
        *   `status`: `string`, optional. Filters announcements by their active status.
            *   Allowed values: `active`.
            *   Default: `active`.
            *   Behavior: When `active`, only returns announcements where `expires_at` IS NULL OR `expires_at` > NOW().
        *   `sortBy`: `string`, optional. Field to sort the announcements by.
            *   Allowed values: `created_at`.
            *   Default: `created_at`.
        *   `sortOrder`: `string`, optional. Order of sorting.
            *   Allowed values: `ASC`, `DESC`.
            *   Default: `DESC`.
    *   **Response Structure (Success - HTTP 200 OK)**:
        *   The response will be a JSON object containing an array of announcement objects and pagination details.
        *   **Announcement Object Fields**:
            *   `id`: `integer` - The unique identifier of the announcement.
            *   `title`: `string` - The title of the announcement.
            *   `content`: `string` - The HTML content of the announcement (sanitized during creation).
            *   `created_at`: `datetime` (ISO 8601) - Timestamp of when the announcement was created.
            *   `created_by` (optional): `object` - Details of the user who created the announcement.
                *   `id`: `integer` - User ID.
                *   `name`: `string` - User's name.
            *   `expires_at`: `datetime` (ISO 8601) or `null` - Timestamp of when the announcement expires.
        *   **Example Success Response**:
            ```json
            {
              "data": [
                {
                  "id": 123,
                  "title": "Pool Maintenance Next Week",
                  "content": "<p>The community pool will be closed for maintenance...</p>",
                  "created_at": "2025-06-05T10:00:00.000Z",
                  "created_by": {
                    "id": 2,
                    "name": "Admin User"
                  },
                  "expires_at": "2025-06-15T23:59:59.000Z"
                }
                // ...other announcement objects
              ],
              "pagination": {
                "totalItems": 42,
                "totalPages": 5,
                "currentPage": 1,
                "limit": 10
              }
            }
            ```
    *   **Service Layer Logic (`announcement.service.js`)**:
        1.  Accept validated query parameters (`page`, `limit`, `status`, `sortBy`, `sortOrder`) from the controller.
        2.  Construct the database query for the `announcements` table:
            *   **Filtering**: Apply the `status` filter (e.g., `WHERE expires_at IS NULL OR expires_at > NOW()` if `status` is `active`).
            *   **Ordering**: Apply `ORDER BY [sortBy] [sortOrder]` (e.g., `created_at DESC`).
            *   **Pagination**: Calculate `offset` as `(page - 1) * limit`. Apply `LIMIT limit` and `OFFSET offset`.
        3.  Fetch the list of announcement records matching the criteria. Optionally join with the `users` table to include `created_by.name`.
        4.  Fetch the total count of records matching the filtering criteria (before applying pagination) to calculate `totalItems` and `totalPages`.
        5.  Return the list of announcements and the pagination object (`totalItems`, `totalPages`, `currentPage`, `limit`).
    *   **Controller Layer Logic (`announcement.controller.js`)**:
        1.  Extract `page`, `limit`, `status`, `sortBy`, `sortOrder` from `req.query`.
        2.  Validate query parameters, applying defaults if not provided or if invalid:
            *   `page`: Ensure positive integer, default `1`.
            *   `limit`: Ensure positive integer (e.g., 1-100), default `10`.
            *   `status`: Ensure valid value (e.g., `active`), default `active`.
            *   `sortBy`: Ensure valid value (e.g., `created_at`), default `created_at`.
            *   `sortOrder`: Ensure valid value (e.g., `ASC`, `DESC`), default `DESC`.
            *   If critical validation fails (e.g., non-integer page), consider returning HTTP 400 Bad Request. For non-critical, use defaults.
        3.  Call `announcementService.listAnnouncements({ validated_params })`.
        4.  On success from the service, construct the HTTP 200 OK response with the `data` (announcements list) and `pagination` object.
        5.  Handle potential errors from the service (e.g., database errors) by returning an appropriate HTTP 500 Internal Server Error.
    *   **Authorization**:
        *   Protected by JWT authentication middleware (`verifyToken`).
        *   Accessible to any authenticated user (e.g., 'member' or 'admin' roles).

*   `[x] Completed`
    *   - Implementation complete.
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for listing announcements:**
            *   Instruction: Verify an endpoint like `GET /api/announcements` is defined and protected by authentication middleware (accessible to all authenticated users).
        2.  **Inspect controller and service logic for `GET /api/announcements`:**
            *   Instruction: Verify the service queries the `announcements` table.
            *   Instruction: Confirm the results are ordered by `created_at` in descending order.
            *   Instruction: Verify pagination parameters (`limit`, `offset`) are correctly applied to the query.
            *   Instruction: Check the response to ensure it's an array of announcement objects, each containing fields like `id`, `title`, `content`, `created_at`. (Note: `content` should be the sanitized HTML ready for rendering).
            *   Instruction: (Optional) Verify if `created_by` information (e.g., author's name) is included by joining with the `users` table.

### User Story 13: Implement API for Admin to Update and Delete Announcements
*   **As an** administrator,
*   **I want** API endpoints to update the title and/or content of existing announcements, and to delete announcements,
*   **So that** I can correct or remove outdated information.

    **Technical Requirements:**
    1.  **Update Announcement (Admin)**
        *   **API Endpoint**:
            *   Method: `PUT`
            *   URL: `/api/announcements/:id` (Protected by `isAdmin` middleware)
        *   **Request Body Structure & Validation Rules**:
            *   `title`: `string`, optional. If provided, max length 255.
            *   `content`: `text`, optional. If provided, must not be empty. (If HTML is allowed, server-side sanitization is crucial, e.g., using DOMPurify, consistent with create).
            *   `expires_at`: `date` (ISO 8601 format), optional, nullable. If provided (and not null), must be a valid date.
        *   **Response Structure**:
            *   **Success (HTTP 200 OK)**:
                *   Body: The updated announcement object.
                ```json
                {
                  "id": 123,
                  "title": "Updated Maintenance Schedule",
                  "content": "<p>Updated details about the schedule...</p>",
                  "created_by": 1,
                  "created_at": "2025-06-01T10:00:00.000Z",
                  "updated_at": "2025-06-01T10:05:00.000Z",
                  "expires_at": "2025-07-15T23:59:59.000Z" // or null
                }
                ```
            *   **Error (HTTP 400 Bad Request)**: For validation errors (e.g., invalid date format, title too long).
                ```json
                {
                  "errors": [
                    { "field": "title", "message": "Title cannot exceed 255 characters." },
                    { "field": "expires_at", "message": "expires_at must be a valid ISO 8601 date or null." }
                  ]
                }
                ```
            *   **Error (HTTP 401 Unauthorized)**: If the user is not authenticated.
            *   **Error (HTTP 403 Forbidden)**: If the authenticated user is not an admin.
            *   **Error (HTTP 404 Not Found)**: If the announcement with the given `id` does not exist.
        *   **Service Layer Logic Outline (`announcement.service.js`)**:
            1.  Receive `announcementId`, validated optional data (`title`, `content`, `expires_at`), and `userId` (from authenticated admin) from the controller.
            2.  Fetch the announcement by `announcementId` using the `Announcement` Sequelize model. If not found, throw a "Not Found" error (404).
            3.  If `content` is provided and requires sanitization, ensure it has been sanitized by the controller or perform sanitization here.
            4.  Apply updates: If `title` is provided, update `announcement.title`. If `content` is provided, update `announcement.content` (sanitized). If `expires_at` is provided (can be `null` to clear it or a date string), update `announcement.expires_at`.
            5.  If `expires_at` is provided and is not null, validate that it's a valid date.
            6.  Save the updated announcement object using `announcement.save()`.
            7.  Log the "announcement_update" action to the audit log (e.g., `auditService.logAdminAction(userId, 'announcement_update', { announcementId: announcement.id, updatedFields: ['title', 'content', 'expires_at'] })`).
            8.  Return the updated announcement object.
        *   **Controller Layer Logic Outline (`announcement.controller.js`)**:
            1.  Extract `id` from `req.params`.
            2.  Extract optional `title`, `content`, `expires_at` from `req.body`.
            3.  Perform input validation for provided fields:
                *   `title`: optional, string, max length 255.
                *   `content`: optional, text.
                *   `expires_at`: optional, valid ISO 8601 date string or null.
            4.  If validation fails, return an HTTP 400 response with detailed error messages.
            5.  If `content` is provided and intended to be HTML, sanitize it: `const sanitizedContent = DOMPurify.sanitize(content);`.
            6.  Obtain `userId` from `req.user.id`.
            7.  Call `announcementService.updateAnnouncement(id, { title, content: (content ? sanitizedContent : undefined), expires_at }, userId)`.
            8.  Handle the service response:
                *   On success, send HTTP 200 OK with the updated announcement.
                *   If service throws "Not Found", send HTTP 404.
                *   If service throws validation error, send HTTP 400.
                *   For other errors, send HTTP 500.

    2.  **Delete Announcement (Admin)**
        *   **API Endpoint**:
            *   Method: `DELETE`
            *   URL: `/api/announcements/:id` (Protected by `isAdmin` middleware)
        *   **Response Structure**:
            *   **Success (HTTP 204 No Content)**: Standard for successful deletion.
            *   **Error (HTTP 401 Unauthorized)**: If the user is not authenticated.
            *   **Error (HTTP 403 Forbidden)**: If the authenticated user is not an admin.
            *   **Error (HTTP 404 Not Found)**: If the announcement with the given `id` does not exist.
        *   **Service Layer Logic Outline (`announcement.service.js`)**:
            1.  Receive `announcementId` and `userId` (from authenticated admin) from the controller.
            2.  Fetch the announcement by `announcementId`. If not found, throw a "Not Found" error (404) to ensure an explicit 404 is returned if the resource doesn't exist.
            3.  If found, delete the announcement record using `announcement.destroy()`.
            4.  Log the "announcement_deletion" action to the audit log (e.g., `auditService.logAdminAction(userId, 'announcement_deletion', { announcementId })`).
            5.  Return success.
        *   **Controller Layer Logic Outline (`announcement.controller.js`)**:
            1.  Extract `id` from `req.params`.
            2.  Obtain `userId` from `req.user.id`.
            3.  Call `announcementService.deleteAnnouncement(id, userId)`.
            4.  Handle the service response:
                *   On success, send HTTP 204 No Content.
                *   If service throws "Not Found", send HTTP 404.
                *   For other errors, send HTTP 500.

    3.  **Authorization**: Both endpoints must be protected by JWT authentication middleware (`verifyToken`) and role-based authorization middleware ensuring only users with the 'admin' role can access them (`authorizeRoles('admin')`). This is typically handled at the router level for `/api/announcements/:id` for `PUT` and `DELETE` methods, likely using the existing `isAdmin` middleware pattern.

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for admin announcement management:**
            *   Instruction: Verify an endpoint `PUT /api/announcements/:announcementId` is defined and protected for 'admin' role (e.g., via `isAdmin` middleware).
            *   Instruction: Verify an endpoint `DELETE /api/announcements/:announcementId` is defined and protected for 'admin' role (e.g., via `isAdmin` middleware).
        2.  **Inspect controller and service logic for `PUT /api/announcements/:announcementId` (Update):**
            *   Instruction: Verify the controller expects optional `title`, `content`, and `expires_at` in the request body.
            *   Instruction: Confirm validation is applied to provided fields (e.g., `title` max length 255, `content` non-empty if present, `expires_at` is a valid ISO 8601 date or null).
            *   Instruction: If `content` is updatable and HTML, verify server-side HTML sanitization.
            *   Instruction: Verify the service fetches the announcement by `announcementId`. If not found, ensure a 404 status is returned.
            *   Instruction: Confirm the specified fields (`title`, `content`, `expires_at`) are updated in the database for the announcement.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'announcement_update'`, `details: { announcementId, updatedFields: ['title', 'content', 'expires_at'] }`).
            *   Instruction: Verify the API returns the updated announcement object with HTTP 200 OK on success.
            *   Instruction: Verify appropriate error responses (400 for validation, 401 for unauthorized, 403 for forbidden, 404 for not found).
        3.  **Inspect controller and service logic for `DELETE /api/announcements/:announcementId` (Delete):**
            *   Instruction: Verify the service attempts to delete the announcement from the `announcements` table by `announcementId`.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'announcement_deletion'`, `details: { announcementId }`).
            *   Instruction: Verify the API returns an HTTP 204 No Content status on success.
            *   Instruction: Verify appropriate error responses (401 for unauthorized, 403 for forbidden, 404 for not found).

---

## Epic: Events Management

### User Story 14: Implement API for Admin to Create Events
*   **As an** administrator,
*   **I want** an API endpoint to create new events with details like title, description, start/end dates and times, and location,
*   **So that** I can schedule and publicize community activities.

    **Technical Requirements:**
    *   **API Endpoint**:
        *   Method: `POST`
        *   URL: `/api/events` (This path will be protected by `authenticateToken` and `isAdmin` middleware at the route definition level).
    *   **Request Body Structure & Validation Rules**:
        *   `title`: (string, required, e.g., min length 3, max length 255)
        *   `description`: (text, required, e.g., min length 10)
        *   `event_date`: (date, required, must be a valid date, must be in the future)
        *   `location`: (string, required, e.g., max length 255)
        *   `created_by`: (This will be derived from the authenticated admin user (`req.user.id`) and not part of the direct request body from the client).
    *   **Response Structure**:
        *   Success (HTTP 201 Created): Body should include the newly created event object (including `id`, `title`, `description`, `event_date`, `end_date`, `location`, `created_by`, `createdAt`, `updatedAt`).
        *   Error (HTTP 400 Bad Request): For validation errors, include details.
        *   Error (HTTP 401 Unauthorized / 403 Forbidden): If the user is not authenticated or not an admin.
    *   **Service Layer Logic Outline**:
        *   Receive validated data and `userId` from controller.
        *   Prepare event object (including `created_by: userId`).
        *   **Note on `end_date`**: If the `Event` model has a non-nullable `end_date` field, it should default to the same value as `event_date` during creation, as `end_date` is not part of the explicit request body for this user story.
        *   Save to `Events` table using the `Event` model.
        *   Return created event object.
    *   **Controller Layer Logic Outline**:
        *   Extract data from `req.body`.
        *   (Validation will be handled by middleware before this controller function).
        *   Get `userId` from `req.user.id`.
        *   Call the event service's `createEvent` function.
        *   Handle service response and send appropriate HTTP response (201 on success, or error).
    *   **Audit Logging:** Log event creation (e.g., `action: 'event_creation'`, details: event ID, title).

*   `[x] Completed`
    *   - Implementation complete.
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for creating events:**
            *   Instruction: Verify an API endpoint `POST /api/events` is defined.
            *   Instruction: Verify this route is protected by `authenticateToken` and `isAdmin` (or equivalent 'admin' role) middleware.
        2.  **Inspect controller layer logic for `POST /api/events`:**
            *   Instruction: Verify the controller extracts `title`, `description`, `event_date`, and `location` from `req.body`.
            *   Instruction: Verify `userId` is obtained from `req.user.id`.
            *   Instruction: Verify the controller calls a service function (e.g., `eventService.createEvent`) with the validated data and `userId`.
            *   Instruction: Verify the controller sends an HTTP 201 response with the created event object on success.
            *   Instruction: Verify appropriate error responses (400, 401, 403) are handled.
        3.  **Inspect request body validation rules (likely in middleware or controller):**
            *   Instruction: Confirm `title` is required (string, min length 3, max length 255).
            *   Instruction: Confirm `description` is required (text, min length 10).
            *   Instruction: Confirm `event_date` is required (valid date, must be in the future).
            *   Instruction: Confirm `location` is required (string, max length 255).
        4.  **Inspect service layer logic for creating events:**
            *   Instruction: Verify the service receives validated data and `userId`.
            *   Instruction: Verify an event object is prepared, including `created_by: userId`.
            *   Instruction: Verify the event object is saved to the `Events` table using the `Event` model.
            *   Instruction: Verify the newly created event object (including `id`, `createdAt`, `updatedAt`) is returned.
        5.  **Inspect response structure for success (HTTP 201):**
            *   Instruction: Verify the response body includes the newly created event object with fields: `id`, `title`, `description`, `event_date`, `location`, `created_by`, `createdAt`, `updatedAt`.
        6.  **Inspect audit logging:**
            *   Instruction: Verify an audit log entry is created for event creation (e.g., `action: 'event_creation'`, `details: { eventId, title }`).

### User Story 15: Implement API to List Events (User)
*   **As an** authenticated user,
*   **I want** an API endpoint to list community events, with options to filter for upcoming events, ordered by start date,
*   **So that** I can easily find out what's happening.

    **Technical Requirements:**
    1.  **Endpoint:**
        *   `GET /api/events`
        *   **Controller (`event.controller.js`):** Handles incoming requests, validates query parameters, and calls the service layer.
        *   **Service (`event.service.js`):** Contains business logic for fetching, filtering, sorting, and paginating events.

    2.  **Query Parameters:**
        *   `status`: (string, optional) Filters events by their status.
            *   Allowed values: `upcoming`, `past`.
            *   Default: `upcoming`.
            *   Behavior:
                *   `upcoming`: Returns events where `event_date` is greater than the current date/time.
                *   `past`: Returns events where `event_date` is less than or equal to the current date/time.
        *   `page`: (integer, optional) Page number for pagination.
            *   Default: `1`.
            *   Validation: Must be a positive integer (>= 1).
        *   `limit`: (integer, optional) Number of items per page.
            *   Default: `10`.
            *   Validation: Must be a positive integer (>= 1), recommended maximum of `50`.
        *   `sortBy`: (string, optional) Field to sort events by.
            *   Allowed values: `event_date`, `title`, `created_at`. (Assuming `event_date` refers to the primary sortable date of the event, likely its start).
            *   Default: `event_date`.
        *   `sortOrder`: (string, optional) Order of sorting.
            *   Allowed values: `asc`, `desc`.
            *   Default: `asc` when `sortBy=event_date` and `status=upcoming` (or default status). `desc` when `sortBy=event_date` and `status=past`. `desc` for `created_at`. `asc` for `title`.

    3.  **Success Response Body (200 OK):**
        *   The response will be a JSON object containing an array of event objects and pagination metadata.
        *   **Structure Example:**
            ```json
            {
              "data": [
                {
                  "id": 1,
                  "title": "Community BBQ",
                  "description": "Join us for a fun community BBQ event.",
                  "event_date": "2025-07-15T18:00:00.000Z",
                  "location": "Community Park Pavilion",
                  "created_by": {
                    "id": 5,
                    "name": "Admin User"
                  },
                  "created_at": "2025-06-01T10:00:00.000Z",
                  "updated_at": "2025-06-01T10:00:00.000Z"
                }
                // ... more event objects
              ],
              "pagination": {
                "totalItems": 25,
                "totalPages": 3,
                "currentPage": 1,
                "limit": 10,
                "hasNextPage": true,
                "hasPrevPage": false
              }
            }
            ```
        *   **Event Item Fields:**
            *   `id`: (integer) Unique identifier of the event.
            *   `title`: (string) Title of the event.
            *   `description`: (text) Description of the event.
            *   `event_date`: (datetime ISO 8601) The primary date and time for the event.
            *   `location`: (string) Location of the event.
            *   `created_by` (object, optional): Details of the user who created the event.
                *   `id`: (integer) User ID of the creator.
                *   `name`: (string) Name of the creator.
            *   `created_at`: (datetime ISO 8601) Timestamp of when the event was created.
            *   `updated_at`: (datetime ISO 8601) Timestamp of the last update to the event.

    4.  **Error Responses:**
        *   **400 Bad Request:** If query parameters are invalid (e.g., non-integer `page`/`limit`, invalid `status` value, unrecognized `sortBy`/`sortOrder` values).
            ```json
            {
              "errors": [
                { "param": "page", "message": "Page must be a positive integer." },
                { "param": "status", "message": "Invalid status value. Allowed: upcoming, past." }
              ]
            }
            ```
        *   **401 Unauthorized:** If the JWT token is missing or invalid.
            ```json
            {
              "error": "Unauthorized"
            }
            ```
        *   **500 Internal Server Error:** For unexpected server-side issues.
            ```json
            {
              "error": "Internal Server Error"
            }
            ```

    5.  **Authentication/Authorization:**
        *   Requires an active, valid JWT for an authenticated user.
        *   Accessible by users with 'member' or 'admin' roles.

*   `[x] Implemented - Functionality complete and tested`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for listing events:**
            *   Instruction: Verify an endpoint `GET /api/events` is defined.
            *   Instruction: Verify this route is protected by authentication middleware (e.g., `verifyToken`), making it accessible to authenticated users ('member', 'admin').

        2.  **Default Behavior (No Query Parameters):**
            *   Instruction: When a `GET` request is made to `/api/events` without any query parameters, the API should return a paginated list of `upcoming` events.
            *   Instruction: Upcoming events should be sorted by `event_date` in ascending order by default.
            *   Instruction: Default pagination should be applied (e.g., `page=1`, `limit=10`).
            *   Instruction: The response should include pagination metadata (`totalItems`, `totalPages`, `currentPage`, `limit`, `hasNextPage`, `hasPrevPage`).

        3.  **Filtering by Status:**
            *   Instruction: Given a `GET` request to `/api/events?status=upcoming`, the API returns only events where `event_date` is in the future, sorted by `event_date` ascending.
            *   Instruction: Given a `GET` request to `/api/events?status=past`, the API returns only events where `event_date` is in the past, sorted by `event_date` descending.
            *   Instruction: Given an invalid `status` value (e.g., `/api/events?status=invalid`), the API returns a 400 Bad Request error with a descriptive message.

        4.  **Pagination:**
            *   Instruction: Given a `GET` request to `/api/events?page=2&limit=5`, the API returns the second page of events, with a maximum of 5 events per page.
            *   Instruction: Verify the `pagination` object in the response correctly reflects `currentPage=2`, `limit=5`, and accurate `totalItems`, `totalPages`, `hasNextPage`, `hasPrevPage`.
            *   Instruction: Given invalid pagination parameters (e.g., `page=0`, `limit=-5`, `page=abc`), the API returns a 400 Bad Request error with descriptive messages for each invalid parameter.

        5.  **Sorting:**
            *   Instruction: Given a `GET` request to `/api/events?sortBy=title&sortOrder=asc`, the API returns events sorted by `title` in ascending order.
            *   Instruction: Given a `GET` request to `/api/events?status=past&sortBy=created_at&sortOrder=desc`, the API returns past events sorted by their creation date in descending order.
            *   Instruction: Given invalid `sortBy` or `sortOrder` values (e.g., `/api/events?sortBy=invalidField`), the API returns a 400 Bad Request error with a descriptive message.

        6.  **Response Data Structure:**
            *   Instruction: Verify each event object in the `data` array contains `id`, `title`, `description`, `event_date`, `location`, `created_at`, `updated_at`.
            *   Instruction: (Optional) If creator details are included, verify the `created_by` object contains `id` and `name`.
            *   Instruction: Verify timestamps (`event_date`, `created_at`, `updated_at`) are in ISO 8601 format.

        7.  **Handling No Events:**
            *   Instruction: If there are no events matching the criteria (e.g., no upcoming events, or a filter results in an empty set), the API returns a 200 OK response with an empty `data` array and appropriate pagination metadata (e.g., `totalItems=0`, `totalPages=0`).

        8.  **Authentication/Authorization:**
            *   Instruction: Given a request to `/api/events` without a valid JWT, the API returns a 401 Unauthorized error.

### User Story 16: Implement API for Admin to Update and Delete Events
*   **As an** administrator,
*   **I want** API endpoints to update the details of existing events and to delete events,
*   **So that** I can manage the event schedule and correct any inaccuracies.

    **Technical Requirements:**
    1.  **Update Endpoint (e.g., `PUT /api/admin/events/:id`):**
        *   **Controller (`event.controller.js`):** Extracts `id`; receives fields for update in `req.body`.
        *   **Validation:** Validate any provided fields (e.g., date formats, `end_date` after `start_date`).
        *   **Service (`event.service.js`):**
            *   Fetches event by `id`. If not found, 404.
            *   **Database Interaction:** Updates the specified fields.
        *   **Audit Logging:** Log event update (e.g., `action: 'event_update'`, details: ID, title). PHP app was missing this.
        *   **Response:** Updated event object.
    2.  **Delete Endpoint (e.g., `DELETE /api/admin/events/:id`):**
        *   **Controller:** Extracts `id`.
        *   **Service:**
            *   Fetches event by `id`. If not found, 404.
            *   **Database Interaction:** Deletes record from `events` table.
        *   **Audit Logging:** Log event deletion (e.g., `action: 'event_deletion'`, details: ID). PHP app was missing this for `manage_events.php` specifically.
        *   **Response:** Success message (200 OK or 204 No Content).
    3.  **Authorization:** Both protected by JWT auth and 'admin' role.

*   **Status:** `[x] Implemented - Functionality complete and tested` <!-- Or [ ] To Do, [>] In Progress, [x] Done, [-] Blocked, [!] Needs Review -->
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for admin event management:**
            *   Instruction: Verify an endpoint like `PUT /api/admin/events/:eventId` is defined and protected for 'admin' role.
            *   Instruction: Verify an endpoint like `DELETE /api/admin/events/:eventId` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `PUT /api/admin/events/:eventId` (Update):**
            *   Instruction: Verify the controller accepts event fields (e.g., `title`, `description`, `start_date`, `end_date`, `location`) in the request body for update.
            *   Instruction: Confirm validation is applied to any provided fields.
            *   Instruction: Verify the service fetches the event by `eventId`. If not found, ensure a 404.
            *   Instruction: Confirm the specified fields are updated in the database.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'event_update'`).
            *   Instruction: Verify the API returns the updated event object.
        3.  **Inspect controller and service logic for `DELETE /api/admin/events/:eventId` (Delete):**
            *   Instruction: Verify the service attempts to delete the event from the `events` table by `eventId`. If not found, ensure a 404 status is returned. If found and deleted, verify the API returns a success status (e.g., 200 or 204).
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'event_deletion'`).
            *   Instruction: Verify the API returns a success status (e.g., 200 or 204).

---

## Epic: Discussions Management

### User Story 17: Implement API to Create Discussion Threads and Replies (User)
*   **As an** authenticated user,
*   **I want** API endpoints to create new discussion threads (with a title and content) and to post replies (with content) to existing threads,
*   **So that** I can actively participate in community conversations by initiating topics and responding to others.

    **Technical Requirements:**
    1.  **Create Thread Endpoint (e.g., `POST /api/discussions`):**
        *   **Controller (`discussion.controller.js`):** Receives `title` and `content` from `req.body`.
        *   **Validation:** `title` and `content` are required and non-empty.
        *   **Sanitization:** If `content` can be HTML, sanitize it server-side (e.g., DOMPurify).
        *   **Service (`discussion.service.js`):**
            *   **Database Interaction:** Creates a new record in `discussions` table with `title`, sanitized `content`, `created_by` (user's ID from `req.user`), and `parent_id` set to `NULL`. `document_id` is also `NULL` unless linked.
        *   **Response:** Returns the created discussion thread object and 201 Created.
    2.  **Post Reply Endpoint (e.g., `POST /api/discussions/:threadId/replies`):**
        *   **Controller:** Extracts `threadId` from path; receives `content` from `req.body`.
        *   **Validation:** `content` is required and non-empty. `threadId` must correspond to an existing main discussion thread (where `parent_id` is `NULL`).
        *   **Sanitization:** Sanitize `content` if HTML.
        *   **Service:**
            *   **Database Interaction:** Creates a new record in `discussions` table with `title` set to `NULL`, sanitized `content`, `created_by` (user's ID), and `parent_id` set to `threadId`.
        *   **Response:** Returns the created reply object and 201 Created.
    3.  **Authorization:** Both endpoints protected by JWT auth (accessible to 'member' or 'admin').

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for creating discussion threads:**
            *   Instruction: Verify an endpoint like `POST /api/discussions` is defined and protected by authentication.
        2.  **Inspect controller and service logic for `POST /api/discussions` (Create Thread):**
            *   Instruction: Verify the controller expects `title` and `content` in `req.body`.
            *   Instruction: Confirm validation for non-empty `title` and `content`.
            *   Instruction: If `content` is HTML, verify server-side sanitization.
            *   Instruction: Verify a new record is inserted into `discussions` with `title`, `content`, `created_by` (current user's ID), and `parent_id` as `NULL`.
            *   Instruction: Verify the API returns the created thread object with status 201.
        3.  **Inspect route definition for posting replies:**
            *   Instruction: Verify an endpoint like `POST /api/discussions/:threadId/replies` is defined and protected by authentication.
        4.  **Inspect controller and service logic for `POST /api/discussions/:threadId/replies` (Post Reply):**
            *   Instruction: Verify the controller extracts `threadId` from path and expects `content` in `req.body`.
            *   Instruction: Confirm validation for non-empty `content`. Verify `threadId` is validated to exist and be a main thread.
            *   Instruction: If `content` is HTML, verify server-side sanitization.
            *   Instruction: Verify a new record is inserted into `discussions` with `content`, `created_by` (current user's ID), `parent_id` as `threadId`, and `title` as `NULL`.
            *   Instruction: Verify the API returns the created reply object with status 201.

### User Story 18: Implement API to List Discussion Threads and View a Thread with Replies (User)
*   **As an** authenticated user,
*   **I want** API endpoints to list all main discussion threads (with author and reply count) and to view a specific thread along with all its replies (with authors), ordered chronologically,
*   **So that** I can browse, read, and follow community conversations.

    **Technical Requirements:**
    1.  **List Threads Endpoint (e.g., `GET /api/discussions`):**
        *   **Controller (`discussion.controller.js`):**
        *   **Service (`discussion.service.js`):**
            *   **Database Interaction:** Fetches records from `discussions` where `parent_id IS NULL`. Order by `created_at` DESC.
            *   **Data Augmentation:** For each thread, include author's name (join `users` on `created_by`) and a count of replies (subquery or a join with aggregation on `discussions` where `parent_id` matches the thread's ID).
            *   **Pagination:** Support `limit` and `offset`.
            *   **Response:** List of thread objects, each including `id`, `title`, `content` (snippet or full), `created_at`, `author_name`, `reply_count`.
    2.  **View Thread with Replies Endpoint (e.g., `GET /api/discussions/:threadId`):**
        *   **Controller:** Extracts `threadId`.
        *   **Service:**
            *   **Fetch Main Thread:** Fetches the main discussion record by `threadId` (where `parent_id IS NULL`). Include author's name. If not found, 404.
            *   **Fetch Replies:** Fetches all records from `discussions` where `parent_id = threadId`. Order by `created_at` ASC. Include author's name for each reply.
            *   **Response:** An object containing the main thread details and an array of its replies.
    3.  **Authorization:** Both protected by JWT auth.

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for listing discussion threads:**
            *   Instruction: Verify an endpoint like `GET /api/discussions` is defined and protected by authentication.
        2.  **Inspect controller and service logic for `GET /api/discussions` (List Threads):**
            *   Instruction: Verify the service queries `discussions` for records where `parent_id IS NULL`, ordered by `created_at` DESC.
            *   Instruction: Confirm it joins with `users` to get the author's name for each thread.
            *   Instruction: Verify it calculates or retrieves a `reply_count` for each thread.
            *   Instruction: Verify pagination is supported.
            *   Instruction: Check the response format for an array of threads with expected fields.
        3.  **Inspect route definition for viewing a single thread with replies:**
            *   Instruction: Verify an endpoint like `GET /api/discussions/:threadId` is defined and protected by authentication.
        4.  **Inspect controller and service logic for `GET /api/discussions/:threadId` (View Thread):**
            *   Instruction: Verify the service first fetches the main thread by `threadId` (where `parent_id IS NULL`), joining with `users` for author name. If not found, ensure 404.
            *   Instruction: Verify it then fetches all replies where `parent_id = threadId`, ordered by `created_at` ASC, joining with `users` for each reply's author name.
            *   Instruction: Check the response structure: an object containing the main thread details and an array of reply objects.

### User Story 19: Implement API for Admin to Delete Discussion Threads and Replies
*   **As an** administrator,
*   **I want** API endpoints to delete entire discussion threads (including all their replies) or to delete individual replies,
*   **So that** I can effectively moderate community discussions by removing inappropriate or irrelevant content.

    **Technical Requirements:**
    1.  **Delete Thread Endpoint (e.g., `DELETE /api/admin/discussions/:threadId`):**
        *   **Controller (`discussion.controller.js`):** Extracts `threadId`.
        *   **Service (`discussion.service.js`):**
            *   Verify `threadId` refers to a main thread.
            *   **Database Interaction (Transaction):**
                *   Delete all replies where `parent_id = threadId`.
                *   Delete the main thread record itself.
                *   These operations should be within a database transaction.
        *   **Audit Logging:** Logs thread deletion (e.g., `action: 'discussion_deletion'`, details: thread ID, title). Matches `manage_discussions.php`.
        *   **Response:** Success message (200 OK or 204 No Content).
    2.  **Delete Reply Endpoint (e.g., `DELETE /api/admin/discussions/replies/:replyId`):**
        *   **Controller:** Extracts `replyId`.
        *   **Service:**
            *   Verify `replyId` refers to a reply (i.e., `parent_id IS NOT NULL`).
            *   **Database Interaction:** Deletes the specific reply record by `id = replyId`.
        *   **Audit Logging:** Logs reply deletion (e.g., `action: 'reply_deletion'`, details: reply ID). Matches `manage_discussions.php`.
        *   **Response:** Success message.
    3.  **Authorization:** Both protected by JWT auth and 'admin' role.

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for admin discussion management:**
            *   Instruction: Verify an endpoint like `DELETE /api/admin/discussions/:threadId` is defined and protected for 'admin' role.
            *   Instruction: Verify an endpoint like `DELETE /api/admin/discussions/replies/:replyId` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `DELETE /api/admin/discussions/:threadId` (Delete Thread):**
            *   Instruction: Verify the service checks that `threadId` exists and is a main thread.
            *   Instruction: Confirm that, within a transaction, it first deletes all records from `discussions` where `parent_id = threadId`.
            *   Instruction: Confirm it then deletes the main thread record (where `id = threadId`).
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'discussion_deletion'`, `details: { threadId, title }`).
            *   Instruction: Verify a success status is returned.
        3.  **Inspect controller and service logic for `DELETE /api/admin/discussions/replies/:replyId` (Delete Reply):**
            *   Instruction: Verify the service checks that `replyId` exists and is a reply (`parent_id IS NOT NULL`).
            *   Instruction: Confirm it deletes the record from `discussions` where `id = replyId`.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'reply_deletion'`, `details: { replyId }`).
            *   Instruction: Verify a success status is returned.

---

## Epic: Configuration Management (Admin)

### User Story 20: Implement API for Admin to Manage Site Configuration
*   **As an** administrator (with 'system' or equivalent high-level admin privileges, typically 'admin' role for simplicity unless a distinct 'system' role is strictly necessary),
*   **I want** API endpoints to view all site configuration key-value pairs and to update the value for a specific configuration key,
*   **So that** I can customize site-wide settings like the HOA name or description.

    **Technical Requirements:**
    1.  **Get Configuration Endpoint (e.g., `GET /api/admin/config`):**
        *   **Controller (`config.controller.js`):**
        *   **Service (`config.service.js`):**
            *   **Database Interaction:** Fetches all records from `config` table.
        *   **Response:** An object or array of key-value pairs.
    2.  **Update Configuration Endpoint (e.g., `PUT /api/admin/config/:key`):**
        *   **Controller:** Extracts `key` from path; receives `value` in `req.body`.
        *   **Validation:** `value` should not be empty.
        *   **Service:**
            *   **Database Interaction:** Updates the `value` for the given `key` in `config` table. If key doesn't exist, it should perform an "upsert" (insert or replace, as in PHP's `INSERT OR REPLACE`).
        *   **Audit Logging:** Log config update (e.g., `action: 'config_update'`, details: key, new value). PHP was missing this.
        *   **Response:** Updated config item or success message.
    3.  **Authorization:** Both protected by JWT auth and 'admin' role. (PHP used 'system' role for `manage_config.php`; decide if this distinction is needed or if 'admin' suffices. For simplicity, 'admin' is assumed here).

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definitions for configuration management:**
            *   Instruction: Verify an endpoint like `GET /api/admin/config` is defined and protected for 'admin' role.
            *   Instruction: Verify an endpoint like `PUT /api/admin/config/:configKey` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `GET /api/admin/config`:**
            *   Instruction: Verify the service queries the `config` table and returns all key-value pairs.
            *   Instruction: Check the response format (e.g., an object where keys are config keys, or an array of `{key, value}` objects).
        3.  **Inspect controller and service logic for `PUT /api/admin/config/:configKey`:**
            *   Instruction: Verify the controller extracts `configKey` from path and expects `value` in `req.body`.
            *   Instruction: Confirm validation for non-empty `value`.
            *   Instruction: Verify the service performs an "upsert" operation (insert if key doesn't exist, update if it does) on the `config` table for the given `configKey` and `value`.
            *   Instruction: Verify an audit log entry is created (e.g., `action: 'config_update'`, `details: { key: configKey, value: newValue }`).
            *   Instruction: Verify the API returns the updated config item or a success message.

---

## Epic: Audit Logging

### User Story 21: Implement Centralized Audit Logging Service/Utility
*   **As a** backend developer,
*   **I want** a centralized service or utility function for logging administrative actions consistently across various modules,
*   **So that** all auditable events are recorded with necessary details (admin ID, action type, specific details, timestamp) into the `audit_logs` table.

    **Technical Requirements:**
    1.  **Utility/Service (`audit.service.js` or `utils/logger.js`):**
        *   Define a function like `async logAdminAction(adminId, action, details)`.
        *   `adminId`: The ID of the admin performing the action (from `req.user.id`).
        *   `action`: A string identifier for the action (e.g., 'user_creation', 'document_approval', 'announcement_delete').
        *   `details`: A JSON object or string containing relevant specifics (e.g., `{ targetUserId: 123, newRole: 'admin' }` or "Deleted document ID 45").
        *   **Database Interaction:** This function will use the `AuditLog` Sequelize model to create a new entry in the `audit_logs` table. `created_at` will be set automatically.
    2.  **Integration:** This `logAdminAction` function must be called from all relevant service methods or controller actions that perform auditable administrative operations (as identified in previous user stories).

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect `audit.service.js` (or a similar utility file):**
            *   Instruction: Verify a function, e.g., `logAdminAction(adminId, action, details)`, is defined.
            *   Instruction: Check that this function accepts parameters for the administrator's ID, a string describing the action, and an object/string for additional details.
            *   Instruction: Verify this function uses the `AuditLog` Sequelize model to `create` a new record in the `audit_logs` table with the provided `admin_id`, `action`, `details`, and an automatically generated `created_at` timestamp.
        2.  **Review various admin-related service or controller files (e.g., `admin.user.service.js`, `document.service.js` for admin actions, `announcement.service.js` for admin actions, etc.):**
            *   Instruction: For each administrative CUD (Create, Update, Delete) operation that should be audited (e.g., user role change, document approval, announcement deletion), confirm that the `logAdminAction` function is called with appropriate parameters.
            *   Instruction: Example: After successfully updating a user's role, ensure `auditService.logAdminAction(req.user.id, 'user_role_update', { userId: targetUser.id, newRole: newRole })` or similar is invoked.

### User Story 22: Implement API for Admin to View Audit Logs
*   **As an** administrator,
*   **I want** an API endpoint to view audit logs, paginated and ordered by the most recent entries, including the name of the admin who performed the action,
*   **So that** I can track administrative activities and review system changes.

    **Technical Requirements:**
    1.  **Endpoint (e.g., `GET /api/admin/audit-logs`):**
        *   **Controller (`audit.controller.js`):**
        *   **Service (`audit.service.js`):**
            *   **Database Interaction:** Fetches records from `audit_logs` table.
            *   **Join:** Join with `users` table on `audit_logs.admin_id = users.id` to retrieve the admin's name (`users.name`).
            *   **Ordering:** Order by `created_at` DESC.
            *   **Pagination:** Support `limit` and `offset`.
        *   **Response:** List of audit log objects, each including `id`, `admin_name`, `action`, `details`, `created_at`.
    2.  **Authorization:** Protected by JWT auth and 'admin' role. (PHP `audit_log.php` allowed any logged-in user; this should be restricted to admins).

*   `[x] Done`
    *   **Acceptance Criteria:**
        1.  **Inspect route definition for viewing audit logs:**
            *   Instruction: Verify an endpoint like `GET /api/admin/audit-logs` is defined and protected for 'admin' role.
        2.  **Inspect controller and service logic for `GET /api/admin/audit-logs`:**
            *   Instruction: Verify the service queries the `audit_logs` table.
            *   Instruction: Confirm it performs a join with the `users` table using `audit_logs.admin_id` to fetch the `name` of the admin user.
            *   Instruction: Verify results are ordered by `audit_logs.created_at` in descending order.
            *   Instruction: Verify pagination parameters (`limit`, `offset`) are applied.
            *   Instruction: Check the response format: an array of audit log objects, each including at least `id`, `admin_name` (from the joined users table), `action`, `details` (as stored), and `created_at`.

---

## Epic: Database Setup & Migration

### User Story 23: Setup Node.js Project with Database (SQLite) and ORM (Sequelize)
*   **As a** backend developer,
*   **I want** to initialize the Node.js project with SQLite as the database and Sequelize as the ORM, defining all necessary models (Users, Documents, Announcements, Events, Discussions, Config, AuditLogs, VerificationTokens) and their relationships as per the existing schema,
*   **So that** the application has a structured way to interact with the database, manage its schema through migrations, and ensure data integrity.

    **Technical Requirements:**
    1.  **Project Initialization:** `npm init` or `yarn init`. Install `express`, `sequelize`, `sqlite3`, `bcrypt`, `jsonwebtoken`, `multer`, `dotenv`, `joi` (or `express-validator`), `dompurify` (if server-side HTML sanitization for rich text is chosen), and development dependencies.
    2.  **Sequelize Setup:**
        *   Initialize Sequelize CLI (`npx sequelize-cli init`).
        *   Configure `config/config.json` (or JS) to use SQLite, pointing to a database file (e.g., `database/hoa.db` to match PHP structure).
    3.  **Model Definition:** Create Sequelize models for all tables derived from `db_connect.php`:
        *   `User`: id, name, email, password, role, status, email_verified, is_system_user, created_at.
        *   `Config`: key, value.
        *   `VerificationToken`: id, user_id, token, type, created_at, expires_at.
        *   `Event`: id, title, description, start_date, end_date, location, created_by, created_at.
        *   `Document`: id, title, description, file_name (stored unique name), file_path (server path), uploaded_by, uploaded_at, approved, is_public. (Note: `file_name` and `file_path` distinction as per User Story 8).
        *   `Discussion`: id, title (nullable for replies), content, created_by, created_at, parent_id, document_id.
        *   `Announcement`: id, title, content, created_by, created_at.
        *   `AuditLog`: id, admin_id, action, details, created_at.
        *   Define all columns with correct Sequelize data types, constraints (`allowNull`, `unique`, `defaultValue`), and foreign key associations (e.g., `User.hasMany(Event, { foreignKey: 'created_by' })`).
    4.  **Migrations:** Use Sequelize CLI to generate migrations for creating each table and defining indexes.
    5.  **Database Initialization Script/Seeders:**
        *   Script to run all migrations (`npx sequelize-cli db:migrate`).
        *   Seed initial `config` data (HOA Name, etc.).
        *   Seed initial system admin user.
    6.  **Connection:** Establish and export Sequelize instance and models (typically `models/index.js`).

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect `package.json`:**
            *   Instruction: Verify `sequelize`, `sqlite3`, `express`, `bcrypt`, `jsonwebtoken`, `multer`, `dotenv`, and chosen validation/sanitization libraries are listed as dependencies.
        2.  **Inspect Sequelize CLI configuration (e.g., `config/config.json` or `.sequelizerc`):**
            *   Instruction: Verify the 'development' (and other relevant environments) configuration points to an SQLite database file (e.g., path to `database/hoa.db`).
        3.  **Inspect model files (e.g., `models/user.js`, `models/document.js`, etc.):**
            *   Instruction: For each table (`User`, `Config`, `VerificationToken`, `Event`, `Document`, `Discussion`, `Announcement`, `AuditLog`), verify a corresponding Sequelize model file exists.
            *   Instruction: In each model file, verify all columns are defined with Sequelize data types accurately reflecting the original schema from `db_connect.php` (e.g., `DataTypes.STRING`, `DataTypes.INTEGER`, `DataTypes.BOOLEAN`, `DataTypes.DATE`, `DataTypes.TEXT`).
            *   Instruction: Verify constraints like `allowNull: false`, `unique: true`, `defaultValue` are correctly set.
            *   Instruction: Verify foreign key associations (e.g., `User.hasMany(Announcement, { foreignKey: 'created_by' })`, `Announcement.belongsTo(User, { as: 'creator', foreignKey: 'created_by' })`) are defined in the `associate` method of the models. Specifically check `Discussions.belongsTo(Discussions, { as: 'parentThread', foreignKey: 'parent_id' })` and `Discussions.hasMany(Discussions, { as: 'replies', foreignKey: 'parent_id' })`.
        4.  **Inspect migration files (in `migrations/` directory):**
            *   Instruction: Verify a set of migration files exists, capable of creating all tables from scratch, including defining primary keys, foreign keys, indexes, and constraints.
            *   Instruction: Check the `up` method in each migration to ensure it uses `queryInterface.createTable` with correct column definitions and `queryInterface.addConstraint` or inline foreign key definitions.
        5.  **Execute `npx sequelize-cli db:migrate` (or equivalent script):**
            *   Instruction: Run the migrations on an empty database. Verify they execute without errors.
            *   Instruction: Inspect the SQLite database file (e.g., using DB Browser for SQLite) to confirm all tables are created with the correct schema, including columns, types, constraints, and relationships/foreign keys.
        6.  **Inspect database connection logic (e.g., `models/index.js` or `db.js`):**
            *   Instruction: Verify Sequelize is instantiated and connects to the database using the configured settings.
            *   Instruction: Verify that all defined models are imported, associated (if `associate` methods are present), and available through the exported `db` object.

### User Story 24: Create Initial System User/Admin Account via Seeder
*   **As a** backend developer,
*   **I want** a Sequelize seeder to create an initial system administrator account with a pre-defined, securely managed password, and default site configurations,
*   **So that** the application is immediately administrable and configured after a fresh setup.

    **Technical Requirements:**
    1.  **Seeding Mechanism:** Use Sequelize seeders (`npx sequelize-cli seed:generate --name initial-setup`).
    2.  **System Admin User:**
        *   `name`: "System Administrator"
        *   `email`: From `process.env.ADMIN_EMAIL`.
        *   `password`: From `process.env.ADMIN_PASSWORD`, hashed with `bcrypt` in the seeder.
        *   `role`: 'admin'.
        *   `status`: 'approved'.
        *   `is_system_user`: `true`.
        *   The seeder should check if this admin email already exists to prevent duplicates.
    3.  **Default Configuration:**
        *   Seed `config` table with default values based on `config.php`:
            *   `hoa_name`: 'Sanderson Creek HOA' (or from env var)
            *   `hoa_description`: 'Sanderson Creek HOA Community Management System' (or from env var)
            *   `hoa_logo`: '/images/logo.png' (or from env var, path might need adjustment for new stack)
        *   The seeder should use `findOrCreate` or check existence for config keys to avoid duplicates.
    4.  **Execution:** Seeder run via `npx sequelize-cli db:seed:all` after migrations. Document environment variable requirements.

*   `[x] Completed`
    *   **Acceptance Criteria:**
        1.  **Inspect the seeder file(s) (e.g., `seeders/YYYYMMDDHHMMSS-initial-admin-user.js`, `seeders/YYYYMMDDHHMMSS-initial-config.js`):**
            *   Instruction: For the admin user seeder: Verify the `up` method attempts to create or find an admin user. Check that `email` and initial `password` are sourced from environment variables (e.g., `process.env.ADMIN_EMAIL`, `process.env.ADMIN_PASSWORD`). Verify the password is hashed using `bcrypt` before insertion/update. Confirm the user record has `role: 'admin'`, `status: 'approved'`, and `is_system_user: true`.
            *   Instruction: For the config seeder: Verify the `up` method attempts to `findOrCreate` or insert default key-value pairs into the `config` table (e.g., `hoa_name`, `hoa_description`, `hoa_logo`) with values potentially sourced from environment variables or defaults.
        2.  **Set required environment variables (e.g., `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEFAULT_HOA_NAME`).**
        3.  **Execute `npx sequelize-cli db:seed:all` (or specific seeder commands) after migrations have run on an empty but migrated database.**
            *   Instruction: Run the seeders. Verify they execute without errors.
        4.  **Inspect the `users` table in the SQLite database:**
            *   Instruction: Verify the system administrator user record exists with the correct email (from env var), a hashed password, `role: 'admin'`, `status: 'approved'`, and `is_system_user: true`.
        5.  **Inspect the `config` table in the SQLite database:**
            *   Instruction: Verify the default configuration records (e.g., `hoa_name`) exist with their seeded values.
        6.  **Attempt to log in to the application using the newly seeded admin credentials (once login API is ready and if this seeder runs before User Story 2):**
            *   Instruction: (This step is for later integration testing but confirms the seed worked). Verify successful login.
