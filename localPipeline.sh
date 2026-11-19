#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
npm ci
npm exec -- playwright install chromium firefox webkit
npm run format:check
npm run lint
npm run typecheck
npm run performance
npm run coverage
npm run coverage:browser
npm run build
npm run e2e -- "$@"
npm audit --audit-level=moderate
npm run dependencies:check
if command -v shellcheck >/dev/null; then
  shellcheck localPipeline.sh
fi
if command -v actionlint >/dev/null; then
  actionlint
fi
