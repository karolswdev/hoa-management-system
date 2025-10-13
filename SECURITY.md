Security Policy

Reporting a Vulnerability
- Please email the maintainers with a brief description and reproduction steps.
- Do not open public issues for sensitive reports. We will acknowledge receipt within 72 hours and coordinate a fix.

Supported Versions
- Main branch is supported. We will backport critical fixes when feasible.

Secrets & Configuration
- Never commit secrets (.env, API keys) to the repo. Use `.env.example` and keep real values in environment or secret managers.
- The deployment scripts intentionally exclude `.env` and persisted data from sync.

