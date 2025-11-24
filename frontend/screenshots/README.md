# User Guide Screenshots

This directory contains automatically generated screenshots for the HOA Management System user guides.

## Generating Screenshots

### Local Development

To generate screenshots locally:

```bash
# From repo root
./scripts/run-screenshots.sh
```

Screenshots will be saved in the `frontend/screenshots/` directory.

### Build the PDF User Guide

Run the full pipeline (screenshots + PDF):

```bash
./scripts/build-user-guide.sh
```

PDF outputs:
- `dist/user-guide.pdf`
- `frontend/public/user-guide.pdf`

### GitHub Actions

Screenshots are automatically generated via GitHub Actions on:
- Manual workflow dispatch
- Pushes to `claude/**` branches that modify frontend files

The workflow:
1. Sets up a test database with sample data
2. Starts the backend and frontend servers
3. Runs Playwright tests in headless mode
4. Captures screenshots of all application screens
5. Uploads screenshots as workflow artifacts

## Screenshot Naming Convention

Screenshots are numbered and named according to their screen:

- `01-05`: Public/Authentication screens
- `06-13`: Member screens
- `14-26`: Admin screens
- `27-29`: Additional UI states

Each screenshot file name describes the screen being captured.

## Using Screenshots in Documentation

Screenshots are referenced in:
- `docs/ADMIN_USER_GUIDE.md` - Administrator user guide
- `docs/MEMBER_USER_GUIDE.md` - Member/resident user guide

## Updating Screenshots

When UI changes are made:
1. Run the screenshot generation script locally or via GitHub Actions
2. Review the new screenshots
3. Update the user guide documentation if screen descriptions have changed
4. Commit the new screenshots to the repository

## Technical Details

- **Browser:** Chromium (headless)
- **Viewport:** 1280x720
- **Test Framework:** Playwright
- **Configuration:** `playwright.config.ts`
- **Test File:** `e2e/generate-screenshots.spec.ts`
