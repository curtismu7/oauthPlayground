#!/bin/bash
# Move UI contract, UI doc, and restore/master documents to mfa-ui-documentation folder
# Run this script from the docs/ directory: bash move-ui-docs.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DEST_DIR="mfa-ui-documentation"
mkdir -p "$DEST_DIR"

files=(
  "MFA_CONFIG_PAGE_UI_CONTRACT.md"
  "MFA_CONFIG_PAGE_UI_DOC.md"
  "MFA_CONFIG_PAGE_RESTORE.md"
  "MFA_DOCUMENTATION_MODAL_MASTER.md"
  "MFA_DOCUMENTATION_PAGE_MASTER.md"
  "MFA_FIDO2_UI_CONTRACT.md"
  "MFA_FIDO2_UI_DOC.md"
  "MFA_FIDO2_MASTER.md"
  "MFA_MOBILE_MASTER.md"
  "MFA_OTP_TOTP_MASTER.md"
  "MFA_STATE_PRESERVATION_UI_CONTRACT.md"
  "MFA_SUCCESS_PAGE_UI_CONTRACT.md"
  "MFA_SUCCESS_PAGE_UI_DOC.md"
  "MFA_SUCCESS_PAGE_MASTER.md"
  "MFA_TOTP_MASTER.md"
  "MFA_WORKER_TOKEN_UI_CONTRACT.md"
)

moved=0
not_found=0

echo "Moving UI documentation files to $DEST_DIR/..."
echo ""

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    if mv "$file" "$DEST_DIR/" 2>/dev/null; then
      echo "✓ Moved: $file"
      ((moved++))
    else
      echo "✗ Failed to move: $file"
    fi
  else
    echo "⚠ Not found: $file"
    ((not_found++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully moved $moved files"
if [ $not_found -gt 0 ]; then
  echo "⚠ $not_found files not found (may already be moved)"
fi
echo ""
echo "Files in destination:"
ls -1 "$DEST_DIR"/*.md 2>/dev/null | wc -l | xargs echo "Total:"
echo ""
echo "All files in $DEST_DIR/:"
ls -1 "$DEST_DIR"/*.md 2>/dev/null | sort | sed 's|.*/||' || echo "No .md files found"

