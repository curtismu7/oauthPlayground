#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Comprehensive Inventory Check (Hardened)
# - Fails fast on regressions (non-zero exit)
# - Produces deterministic, CI-friendly output
# =============================================================================

ROOT_DIR="${ROOT_DIR:-.}"
cd "${ROOT_DIR}"

failures=0

log() { printf "%s\n" "$*"; }
section() { printf "\n=== %s ===\n" "$*"; }

fail() {
  log "❌ $*"
  failures=$((failures+1))
}

pass() {
  log "✅ $*"
}

# count_matches <label> <pattern> <path> [<grep_args...>]
count_matches() {
  local label="$1"; shift
  local pattern="$1"; shift
  local path="$1"; shift

  local count
  # shellcheck disable=SC2068
  count="$(grep -R ${@:-} -n -- "${pattern}" "${path}" 2>/dev/null | wc -l | tr -d ' ')"
  echo "${count}"
}

require_zero() {
  local label="$1"
  local count="$2"
  if [[ "${count}" -gt 0 ]]; then
    fail "${label} (found ${count}, expected 0)"
  else
    pass "${label}"
  fi
}

require_at_least_one() {
  local label="$1"
  local count="$2"
  if [[ "${count}" -lt 1 ]]; then
    fail "${label} (found ${count}, expected >= 1)"
  else
    pass "${label}"
  fi
}

# -----------------------------------------------------------------------------
# Checks (adapt/extend these based on UNIFIED_MFA_INVENTORY.md)
# -----------------------------------------------------------------------------
section "Baseline build hygiene"
# Non-fatal here (we want inventory checks even if build steps run elsewhere),
# but you can flip these to hard failures in CI.
if command -v npm >/dev/null 2>&1; then
  pass "npm present"
else
  fail "npm not found on PATH"
fi

section "Unified MFA structure sanity"
# Example: prohibit direct base flow framework edits by pattern, but allow docs
c1="$(count_matches "Direct edits to MFAFlowBaseV8 (excluding docs)" "MFAFlowBaseV8" "src/v8/flows/unified/" | tr -d ' ')"
# If you want to ignore .md matches, do it by filtering the grep itself:
# grep -R -n --exclude="*.md" -- "MFAFlowBaseV8" src/v8/flows/unified/
# For now, just ensure we find at least one reference (expected) and rely on inventory for nuance.
require_at_least_one "MFAFlowBaseV8 referenced somewhere under unified flows" "${c1}"

section "Known regression patterns (examples)"
# Replace patterns/paths with the real ones you care about.
c_modal="$(count_matches "Direct modal calls" "openModal\(" "src/v8u/" --include="*.ts" --include="*.tsx" | tr -d ' ')"
require_zero "Direct modal calls (should use hook/service abstraction)" "${c_modal}"

c_danger="$(count_matches "dangerouslySetInnerHTML usage" "dangerouslySetInnerHTML" "src/v8/flows/unified/" --include="*.ts" --include="*.tsx" | tr -d ' ')"
# This might be allowed in very specific cases; set threshold as needed.
require_zero "dangerouslySetInnerHTML in unified flows" "${c_danger}"

c_ref_error="$(count_matches "ReferenceError patterns in Unified MFA flows" "ReferenceError.*is not defined" "src/v8/flows/unified/" --include="*.ts" --include="*.tsx" | tr -d ' ')"
require_zero "ReferenceError patterns in Unified MFA flows" "${c_ref_error}"

section "SQLite Backup Integration Check"
# Check Production apps SQLite backup integration
log "🔍 Checking Production apps SQLite backup integration..."
if node scripts/verify-production-sqlite-backup.cjs > /dev/null 2>&1; then
  pass "Production apps SQLite backup integration (100% coverage)"
else
  fail "Production apps SQLite backup integration failed"
fi

# Check SQLite backup services exist
c_oauth_service="$(count_matches "UnifiedOAuthCredentialsServiceV8U service" "UnifiedOAuthCredentialsServiceV8U" "src/v8u/services/unifiedOAuthCredentialsServiceV8U.ts" | tr -d ' ')"
require_at_least_one "UnifiedOAuthCredentialsServiceV8U service exists" "${c_oauth_service}"

c_worker_service="$(count_matches "UnifiedWorkerTokenBackupServiceV8 service" "UnifiedWorkerTokenBackupServiceV8" "src/services/unifiedWorkerTokenBackupServiceV8.ts" | tr -d ' ')"
require_at_least_one "UnifiedWorkerTokenBackupServiceV8 service exists" "${c_worker_service}"

# Check for SQLite backup patterns in Production apps (simplified check)
c_oauth_usage="$(find src/v8u/pages/EnhancedStateManagementPage.tsx src/pages/protect-portal/ProtectPortalApp.tsx -exec grep -l "UnifiedOAuthCredentialsServiceV8U" {} \; 2>/dev/null | wc -l | tr -d ' ')"
require_at_least_one "SQLite backup usage in OAuth apps" "${c_oauth_usage}"

c_worker_usage="$(find src/v8/pages/DeleteAllDevicesUtilityV8.tsx src/v8u/pages/TokenMonitoringPage.tsx -exec grep -l "UnifiedWorkerTokenBackupServiceV8" {} \; 2>/dev/null | wc -l | tr -d ' ')"
require_at_least_one "SQLite backup usage in worker token apps" "${c_worker_usage}"

section "Summary"
if [[ "${failures}" -gt 0 ]]; then
  log "🚫 Inventory gate failed: ${failures} check(s) failed."
  exit 1
fi

log "🎯 Inventory gate passed."
