#!/usr/bin/env bash
# Generate updated screenshots and User Guide PDF.
# Outputs:
#   frontend/screenshots/*.png (fresh)
#   dist/user-guide.pdf
#   frontend/public/user-guide.pdf

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Generating fresh screenshots"
bash "${ROOT_DIR}/scripts/run-screenshots.sh"

echo "==> Building User Guide PDF"
pushd "${ROOT_DIR}/frontend" >/dev/null
node scripts/build-user-guide.js
popd >/dev/null

echo "==> User Guide ready at:"
echo "    - ${ROOT_DIR}/frontend/public/user-guide.pdf"
echo "    - ${ROOT_DIR}/dist/user-guide.pdf"
