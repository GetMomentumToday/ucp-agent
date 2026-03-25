#!/usr/bin/env bash
set -euo pipefail

# Fail if any TS file contains a comment that just restates the code.
# Pattern: single-line comments that start with common descriptive words.
PATTERN='^\s*//\s*(This|The|We|It|Here|Set|Get|Create|Return|Check|Handle|Update|Initialize|Define|Import)\b'

FOUND=$(grep -rn --include='*.ts' --include='*.tsx' -E "$PATTERN" app/ lib/ 2>/dev/null || true)

if [ -n "$FOUND" ]; then
  echo "❌ Descriptive comments found (restate what code does — remove them):"
  echo "$FOUND"
  exit 1
fi

echo "✅ No descriptive comments found"
