Contributing Guide

Thank you for your interest in contributing!

How to Contribute
- Fork the repo and create a feature branch.
- Keep changes focused and documented.
- Open a pull request targeting `main` with a clear description.

Development
- Backend: Node/Express + Sequelize (SQLite). Use `npm ci` then `npm start`.
- Frontend: React/TS + Vite. Use `npm ci` then `npm run dev`.
- See README for environment variables and running migrations/seeds.

Testing & CI
- CI runs backend dependency install + sqlite migrations and frontend vite build.
- Please ensure local builds succeed before opening a PR.

Security
- Do not commit secrets (.env, API keys). Use `.env.example` placeholders.
- Report vulnerabilities privately (see SECURITY.md).

Code Style
- Keep code simple, readable, and consistent with the current project style.
- Favor small, focused PRs over large, sweeping changes.

