#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "FAIL ripgrep is required for scripts/security-scan.sh"
  exit 2
fi

EXCLUDES=(
  --glob '!node_modules/**'
  --glob '!dist/**'
  --glob '!**/.git/**'
  --glob '!**/.env'
  --glob '!**/.env.*'
  --glob '!**/.timmy/**'
  --glob '!**/.wrangler/**'
  --glob '!**/.venv/**'
  --glob '!**/__pycache__/**'
  --glob '!logs/**'
  --glob '!package-lock.json'
  --glob '!*.pdf'
  --glob '!*.docx'
  --glob '!scripts/security-scan.sh'
)

PATTERNS=(
  'sk-or-v1-[A-Za-z0-9_-]{24,}'
  'sk-proj-[A-Za-z0-9_-]{24,}'
  'github_pat_[A-Za-z0-9_]{24,}'
  'ghp_[A-Za-z0-9]{24,}'
  'xox[baprs]-[A-Za-z0-9-]{24,}'
  'AKIA[0-9A-Z]{16}'
  'postgresql://[^[:space:]]+:(postgres|password|admin|root|[A-Za-z0-9_-]{12,})@'
)

failed=0
SCAN_FILES="$(mktemp -t timmy-security-files.XXXXXX)"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git ls-files -z --cached --others --exclude-standard >"$SCAN_FILES"
else
  rg --files --hidden -0 "${EXCLUDES[@]}" >"$SCAN_FILES"
fi

for pattern in "${PATTERNS[@]}"; do
  if xargs -0 rg --files-with-matches --hidden "${EXCLUDES[@]}" -e "$pattern" <"$SCAN_FILES" >/tmp/timmy-security-scan-matches.txt; then
    echo "FAIL possible secret pattern matched in:"
    sed 's/^/  /' /tmp/timmy-security-scan-matches.txt
    failed=1
  fi
done

rm -f /tmp/timmy-security-scan-matches.txt
rm -f "$SCAN_FILES"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if ! git check-ignore -q .env; then
    echo "FAIL .env is not ignored by git"
    failed=1
  fi
  if ! git check-ignore -q .timmy/receipts/index.json; then
    echo "FAIL .timmy receipts are not ignored by git"
    failed=1
  fi
fi

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "OK no obvious secret patterns found in commit candidates"
