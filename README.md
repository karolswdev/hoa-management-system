# HOA Community Hub

Welcome to the HOA Community Hub, a modern, full-stack web application designed to be the central digital point of contact for a Homeowners' Association and its residents. This platform streamlines communication, simplifies document access, manages community events, and provides essential administrative tools.

## Table of Contents

1.  [Vision & Purpose](#vision--purpose)
2.  [Core Features](#core-features)
3.  [Technology Stack](#technology-stack)
4.  [Project Structure](#project-structure)
5.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
6.  [Running the Application](#running-the-application)
7.  [Running Tests](#running-tests)
8.  [API Documentation](#api-documentation)

---

## Vision & Purpose

The goal of the HOA Community Hub is to replace fragmented communication channels like email chains and paper notices with a single, secure, and user-friendly platform. It empowers community administrators with the tools they need to manage the HOA efficiently while providing residents with easy access to information and a forum for discussion.

**User Personas:**
*   **Administrator:** Manages users, content, and site configuration.
*   **Resident (Member):** Accesses information, participates in discussions.
*   **Guest:** Views public-facing information about the HOA.

---

## Core Features

| Feature                | Administrator (`admin`)                                      | Resident (`member`)                                  | Guest (Unauthenticated)     |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------- | --------------------------- |
| **Authentication**     | ✅ Login/Logout                                              | ✅ Login/Logout, Register, Password Reset            | ❌                          |
| **User Management**    | ✅ View, Approve/Reject, Change Role, Delete Users           | ✅ Manage Own Profile                                | ❌                          |
| **Announcements**      | ✅ Create, Edit, Delete                                      | ✅ View                                              | ❌                          |
| **Events**             | ✅ Create, Edit, Delete                                      | ✅ View                                              | ❌                          |
| **Documents**          | ✅ Upload, Manage, Set Visibility                            | ✅ View & Download Approved Docs                     | ✅ View & Download Public Docs |
| **Discussions**        | ✅ Delete Threads/Replies                                    | ✅ Create/View Threads, Post Replies                 | ❌                          |
| **Site Configuration** | ✅ Edit Site Name/Description                                | ❌                                                   | ❌                          |
| **Audit Logs**         | ✅ View all administrative actions                           | ❌                                                   | ❌                          |

---

## Technology Stack

*   **Backend:**
    *   **Framework:** Node.js with Express.js
    *   **Database:** SQLite3 (for simplicity and portability)
    *   **ORM:** Sequelize
    *   **Authentication:** JSON Web Tokens (JWT)
    *   **Testing:** Jest & Supertest
*   **Frontend:**
    *   **Framework:** React.js with TypeScript
    *   **UI Library:** Material-UI (MUI)
    *   **Routing:** React Router
    *   **State Management:** React Context API
    *   **Form Handling:** Formik & Yup
    *   **API Client:** Axios

---

## Project Structure

The project is a monorepo containing distinct `backend` and `frontend` applications.

## Getting Started

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm (v10.x or later recommended)

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend/` directory by copying the example.
    ```bash
    # You can manually create a .env file and add the following:
    # A strong, secret key for signing JWTs
    JWT_SECRET=your_super_secret_key_here_123!
    JWT_EXPIRES_IN=8h

    # Default admin credentials for the initial database seed
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=AdminPassword123!
    ```

4.  **Run database migrations and seeders:**
    This command will create the database schema and populate it with an initial admin user and default site configuration.
    ```bash
    npm run db:migrate
    npm run db:seed
    ```

### Frontend Setup

*(These steps are for when Phase 1 of the frontend is complete.)*

1.  **Navigate to the frontend directory:**
    ```bash
    # from the project root
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

---

## Running the Application

You will need two separate terminal windows to run the backend and frontend servers concurrently.

1.  **Start the Backend Server:**
    ```bash
    # In a terminal, from the backend/ directory
    npm start
    ```
    The API will be running on `http://localhost:3001`.

2.  **Start the Frontend Development Server:**
    ```bash
    # In a second terminal, from the frontend/ directory
    npm start
    ```
    The React application will open in your browser, usually at `http://localhost:3000`.

---

## Running Tests

The backend includes a full suite of integration tests to ensure API reliability.

*   **To run all backend tests:**
    ```bash
    # From the backend/ directory
    npm test:integration
    ```
*   **To run a specific test file (e.g., for debugging):**
    ```bash
    # From the backend/ directory
    npm run test:debugging -- test/debugging/users.test.js
    ```