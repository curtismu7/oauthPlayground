#!/usr/bin/env python3
"""
lint_per_group.py — Per-sidebar-group linter + runtime-analysis + test runner.

Analysis layers (run with --fix or --report):
  1. Biome           — formatting + fast lint rules (auto-fixable)
  2. ESLint          — React hook rules, import order
  3. tsc             — full TypeScript type checking
  4. runtime-analysis — runtime bug patterns (JSON.parse, null-deref, etc.)
  5. a11y-keyboard   — keyboard accessibility (missing roles, no onKeyDown, tabIndex > 0)
  6. a11y-color      — color/visual accessibility (hardcoded colors, color-only state)
  7. migration-check — V8→V9 migration gate regressions (toast stragglers, fetch-in-component, etc.)
  8. Tests           — vitest unit + Playwright e2e (optional, --tests flag)

Usage:
    python3 scripts/lint_per_group.py --list
    python3 scripts/lint_per_group.py --fix --group oauth-flows
    python3 scripts/lint_per_group.py --fix --tests unit --group dashboard
    python3 scripts/lint_per_group.py --fix --tests unit --all
    python3 scripts/lint_per_group.py --report
    python3 scripts/lint_per_group.py --update-issue oauth-flows-001 --status fixed
    python3 scripts/lint_per_group.py --update-issue dashboard-002 --status waived --notes "intentional"

See lint-reports/DEVELOPER_GUIDE.md for full documentation.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).parent.parent.resolve()
REPORTS_DIR = ROOT / "lint-reports"
GROUPS_DIR = REPORTS_DIR / "groups"
INDEX_FILE = REPORTS_DIR / "index.json"
SERVICE_COV_FILE = REPORTS_DIR / "service-coverage.json"
STATUS_FILE = REPORTS_DIR / "STATUS.md"
SRC = ROOT / "src"

# ---------------------------------------------------------------------------
# Group definitions (sidebar order, from sidebarMenuConfig.ts)
# Pages listed here are resolved; import tracing then adds services/components/hooks.
# ---------------------------------------------------------------------------
GROUPS: dict[str, dict[str, Any]] = {
    "dashboard": {
        "num": "01",
        "label": "Dashboard",
        "pages": [
            "src/pages/Dashboard.tsx",
        ],
        "tests": {
            "unit": ["src/services/__tests__/serviceDiscovery*", "src/services/__tests__/serverHealth*"],
            "api": ["tests/backend/health.test.js"],
            "e2e": ["e2e/tests/navigation/ui-navigation.spec.ts"],
        },
    },
    "admin-configuration": {
        "num": "02",
        "label": "Admin & Configuration",
        "pages": [
            "src/pages/ApiStatusPage.tsx",
            "src/pages/CustomDomainTestPage.tsx",
            "src/pages/AdvancedConfiguration.tsx",
            "src/pages/EnvironmentManagementPageV8.tsx",
            "src/pages/AutoDiscover.tsx",
        ],
        "tests": {
            "unit": ["src/services/__tests__/configCheckerService*", "src/services/__tests__/errorHandling*"],
            "api": ["tests/backend/env-config.test.js", "tests/backend/health.test.js"],
            "e2e": ["e2e/tests/configuration/config-validation.spec.ts"],
        },
    },
    "pingone-platform": {
        "num": "03",
        "label": "PingOne Platform",
        "pages": [
            "src/pages/PingOneUserProfile.tsx",
            "src/pages/PingOneIdentityMetrics.tsx",
            "src/pages/security/HelioMartPasswordReset.tsx",
            "src/pages/PingOneAuditActivities.tsx",
            "src/pages/PingOneWebhookViewer.tsx",
            "src/pages/OrganizationLicensing.tsx",
        ],
        "tests": {
            "unit": ["src/services/__tests__/aiAgentService*", "src/services/__tests__/pingOneMfaService*"],
            "api": [],
            "e2e": [],
        },
    },
    "unified-production-flows": {
        "num": "04",
        "label": "Unified & Production Flows",
        "pages": [
            "src/v8u/flows/UnifiedOAuthFlowV8U.tsx",
            "src/v8u/pages/FlowComparisonPage.tsx",
            "src/v8u/pages/EnhancedStateManagementPage.tsx",
            "src/pages/protect-portal/ProtectPortalWrapper.tsx",
            "src/pages/flows/v9/TokenExchangeFlowV9.tsx",
            "src/pages/FlowComparison.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/flowContext*",
                "src/services/__tests__/performanceService*",
                "src/services/__tests__/phase3Validation*",
            ],
            "api": [],
            "e2e": [
                "e2e/tests/golden-path-flows.spec.ts",
                "e2e/tests/integration.spec.ts",
            ],
        },
    },
    "oauth-flows": {
        "num": "05",
        "label": "OAuth 2.0 Flows",
        "pages": [
            "src/pages/flows/v9/OAuthAuthorizationCodeFlowV9.tsx",
            "src/pages/flows/v9/OAuthAuthorizationCodeFlowV9_Condensed.tsx",
            "src/pages/flows/v9/ImplicitFlowV9.tsx",
            "src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx",
            "src/pages/flows/v9/ClientCredentialsFlowV9.tsx",
            "src/pages/flows/v9/DPoPAuthorizationCodeFlowV9.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/authorizationUrlValidation*",
                "src/services/__tests__/flowContext*",
                "src/services/__tests__/flowUI*",
            ],
            "api": ["tests/backend/client-credentials.test.js"],
            "e2e": [
                "e2e/tests/oauth-flows/oauth-2-flows.spec.ts",
                "e2e/tests/oauth-flows/oauth-authorization-code.spec.ts",
            ],
        },
    },
    "oidc-flows": {
        "num": "06",
        "label": "OpenID Connect",
        "pages": [
            "src/pages/flows/v9/ImplicitFlowV9.tsx",
            "src/pages/flows/v9/DeviceAuthorizationFlowV9.tsx",
            "src/pages/flows/v9/OIDCHybridFlowV9.tsx",
            "src/pages/flows/CIBAFlowV9.tsx",
        ],
        "tests": {
            "unit": ["src/services/__tests__/oidcCompliance*", "src/services/__tests__/oauth2Compliance*"],
            "api": [],
            "e2e": ["e2e/tests/oauth-flows/oidc-flows.spec.ts"],
        },
    },
    "pingone-flows": {
        "num": "07",
        "label": "PingOne Flows",
        "pages": [
            "src/pages/flows/v9/PingOnePARFlowV9.tsx",
            "src/pages/flows/RedirectlessFlowV9_Real.tsx",
            "src/pages/flows/v9/MFAWorkflowLibraryFlowV9.tsx",
            "src/pages/flows/KrogerGroceryStoreMFA.tsx",
            "src/pages/PingOneAuthentication.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/passwordResetService*",
                "src/services/__tests__/redirectStateManager*",
            ],
            "api": ["tests/backend/password-reset.test.js"],
            "e2e": ["e2e/tests/oauth-flows/pingone-flows.spec.ts"],
        },
    },
    "tokens-session": {
        "num": "08",
        "label": "Tokens & Session",
        "pages": [
            "src/pages/flows/v9/WorkerTokenFlowV9.tsx",
            "src/pages/CredentialManagement.tsx",
            "src/pages/TokenManagement.tsx",
            "src/pages/flows/TokenRevocationFlow.tsx",
            "src/pages/flows/UserInfoPostFlow.tsx",
            "src/pages/flows/PingOneLogoutFlow.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/workerTokenDiscovery*",
                "src/services/__tests__/unifiedStorageService*",
            ],
            "api": [
                "tests/backend/introspect-token.test.js",
                "tests/backend/token-exchange.test.js",
                "tests/backend/userinfo-validation.test.js",
            ],
            "e2e": ["e2e/tests/comprehensive-flows.spec.ts"],
        },
    },
    "developer-tools": {
        "num": "09",
        "label": "Developer & Tools",
        "pages": [
            "src/pages/PostmanCollectionGenerator.tsx",
            "src/pages/OAuthCodeGeneratorHub.tsx",
            "src/pages/ApplicationGenerator.tsx",
            "src/pages/ClientGenerator.tsx",
            "src/pages/JWKSTroubleshooting.tsx",
            "src/pages/URLDecoder.tsx",
            "src/pages/sdk-examples/SDKExamplesHome.tsx",
            "src/pages/UltimateTokenDisplayDemo.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/postmanCollectionGenerator*",
                "src/services/__tests__/qrCodeService*",
            ],
            "api": ["tests/backend/jwks-discovery.test.js"],
            "e2e": [],
        },
    },
    "education-tutorials": {
        "num": "10",
        "label": "Education & Tutorials",
        "pages": [
            "src/pages/flows/AdvancedOAuthParametersDemoFlow.tsx",
            "src/v8u/flows/SpiffeSpireFlowV8U.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "oauth-mock-flows": {
        "num": "11a",
        "label": "OAuth Mock Flows",
        "pages": [
            "src/pages/flows/v9/JWTBearerTokenFlowV9.tsx",
            "src/pages/flows/v9/SAMLBearerAssertionFlowV9.tsx",
            "src/pages/flows/v9/OAuthROPCFlowV9.tsx",
            "src/pages/flows/OAuth2ResourceOwnerPasswordFlow.tsx",
        ],
        "tests": {
            "unit": [
                "src/services/__tests__/v7CredentialValidation*",
                "src/services/__tests__/errorHandler*",
            ],
            "api": [],
            "e2e": [],
        },
    },
    "advanced-mock-flows": {
        "num": "11b",
        "label": "Advanced Mock Flows",
        "pages": [
            "src/pages/flows/DPoPFlow.tsx",
            "src/pages/flows/v9/RARFlowV9.tsx",
            "src/pages/flows/SAMLServiceProviderFlowV1.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "v7m-mock-server-flows": {
        "num": "11c",
        "label": "V7 Mock Server Flows",
        "pages": [
            "src/v7/pages/V7MOAuthAuthCodeV9.tsx",
            "src/v7/pages/V7MDeviceAuthorizationV9.tsx",
            "src/v7/pages/V7MClientCredentialsV9.tsx",
            "src/v7/pages/V7MImplicitFlowV9.tsx",
            "src/v7/pages/V7MROPCV9.tsx",
            "src/v7/pages/V7MSettingsV9.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "ai-ping": {
        "num": "12",
        "label": "AI - Ping",
        "pages": [
            "src/pages/PingAIResources.tsx",
            "src/pages/AIIdentityArchitectures.tsx",
            "src/pages/docs/OIDCForAI.tsx",
            "src/pages/docs/OAuthForAI.tsx",
            "src/pages/docs/PingViewOnAI.tsx",
            "src/pages/docs/AIAgentAuthDraft.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "ai-prompts": {
        "num": "13",
        "label": "AI Prompts & Development",
        "pages": [
            "src/pages/docs/PromptAll.tsx",
            "src/pages/docs/MigrateVscode.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "documentation-reference": {
        "num": "14",
        "label": "Documentation & Reference",
        "pages": [
            "src/pages/PARvsRAR.tsx",
            "src/pages/CIBAvsDeviceAuthz.tsx",
            "src/pages/PingOneMockFeatures.tsx",
            "src/pages/PingOneScopesReference.tsx",
            "src/pages/docs/OIDCSpecs.tsx",
            "src/pages/docs/OAuth2SecurityBestPractices.tsx",
            "src/pages/docs/SpiffeSpirePingOne.tsx",
            "src/pages/PingOneSessionsAPI.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
    "review": {
        "num": "15",
        "label": "Review - New Apps",
        "pages": [
            "src/pages/Configuration.tsx",
            "src/pages/CredentialManagement.tsx",
            "src/pages/AdvancedConfiguration.tsx",
            "src/pages/ServiceTestRunner.tsx",
            "src/pages/PingOneAuthentication.tsx",
            "src/sdk-examples/davinci-todo-app/DavinciTodoApp.tsx",
            "src/pages/docs/PromptAll.tsx",
            "src/pages/Documentation.tsx",
            "src/pages/docs/OIDCOverviewV7.tsx",
            "src/pages/ComprehensiveOAuthEducation.tsx",
            "src/pages/About.tsx",
            "src/pages/OAuth21.tsx",
            "src/pages/OIDC.tsx",
            "src/pages/OIDCSessionManagement.tsx",
            "src/pages/AIAgentOverview.tsx",
            "src/pages/AIGlossary.tsx",
            "src/pages/AIIdentityArchitectures.tsx",
            "src/pages/CodeExamplesDemo.tsx",
            "src/pages/AdvancedSecuritySettingsDemo.tsx",
            "src/pages/AdvancedSecuritySettingsComparison.tsx",
        ],
        "tests": {
            "unit": [],
            "api": [],
            "e2e": [],
        },
    },
}

# ---------------------------------------------------------------------------
# Runtime analysis patterns
# ---------------------------------------------------------------------------
RUNTIME_PATTERNS = [
    {
        "name": "json-parse-no-try",
        "severity": "error",
        "message": "JSON.parse() outside try/catch — throws SyntaxError on bad input",
        "pattern": r"JSON\.parse\(",
        # Heuristic: flag if not inside a try block (rough check)
        "check": "json_parse",
    },
    {
        "name": "map-on-nullable",
        "severity": "info",
        "message": ".map()/.filter()/.forEach() called without optional chaining — verify non-null",
        "pattern": r"(?<!\?)\.(map|filter|forEach|reduce)\(",
        "check": "direct",
    },
    {
        "name": "jwt-decode-no-verify",
        "severity": "error",
        "message": "JWT decoded with atob/base64 only — not cryptographically verified",
        "pattern": r"JSON\.parse\(atob\(|JSON\.parse\(Buffer\.from\(",
        "check": "direct",
    },
    {
        "name": "setInterval-no-assign",
        "severity": "warning",
        "message": "setInterval() result not assigned — cannot be cleared",
        "pattern": r"(?<![=\w])setInterval\(",
        "check": "direct",
    },
    {
        "name": "localstorage-no-null-check",
        "severity": "warning",
        "message": "localStorage.getItem() result used directly without null check",
        "pattern": r"localStorage\.getItem\([^)]+\)\.",
        "check": "direct",
    },
    {
        "name": "fetch-no-ok-check",
        "severity": "warning",
        "message": "response.json() called without checking response.ok first",
        "pattern": r"response\.json\(\)(?![^;{}]*response\.ok)",
        "check": "direct",
    },
    {
        "name": "unsafe-any-cast",
        "severity": "warning",
        "message": "Unsafe cast to 'any' or 'unknown' bypasses type safety",
        "pattern": r"\bas\s+(?:any|unknown)\b",
        "check": "direct",
    },
]

# ---------------------------------------------------------------------------
# Keyboard accessibility patterns
# Detects interactive elements that are not reachable or operable via keyboard.
# Severity guidance:
#   warning — WCAG 2.1 SC 2.1.1 (Level A) violation — cannot be deferred
#   info    — advisory / easy to audit manually
# ---------------------------------------------------------------------------
KEYBOARD_A11Y_PATTERNS = [
    {
        "name": "div-click-no-role",
        "severity": "warning",
        "message": "<div onClick> without role= — not keyboard-reachable; use <button> or add role+tabIndex+onKeyDown",
        "pattern": r"<div\b[^>]*onClick=",
        "check": "direct",
    },
    {
        "name": "span-click-no-role",
        "severity": "warning",
        "message": "<span onClick> without role= — not keyboard-reachable; use <button> or add role+tabIndex+onKeyDown",
        "pattern": r"<span\b[^>]*onClick=",
        "check": "direct",
    },
    {
        "name": "li-click-no-role",
        "severity": "info",
        "message": "<li onClick> without role=option/menuitem — keyboard users cannot activate this item",
        "pattern": r"<li\b[^>]*onClick=",
        "check": "direct",
    },
    {
        "name": "tabindex-positive",
        "severity": "warning",
        "message": "tabIndex > 0 disrupts natural tab order — use tabIndex={0} or tabIndex={-1} only",
        "pattern": r"tabIndex=\{[1-9]\d*\}",
        "check": "direct",
    },
    {
        "name": "onclick-no-keydown",
        "severity": "warning",
        "message": "onClick handler without a paired onKeyDown/onKeyPress — keyboard users cannot trigger this action",
        "pattern": r"onClick=\{[^}]+\}(?![^>]*onKey(?:Down|Press|Up))",
        "check": "a11y_onclick",
    },
    {
        "name": "missing-aria-label-icon-btn",
        "severity": "warning",
        "message": "Button with icon child but no aria-label/aria-labelledby — screen reader sees no label",
        "pattern": r"<button\b(?![^>]*aria-label)[^>]*>\s*<[A-Z][A-Za-z]+\s*/?>",
        "check": "direct",
    },
    {
        "name": "autofocus-without-aria",
        "severity": "info",
        "message": "autofocus= set — verify focus management is intentional and modal/page context is communicated via aria-label",
        "pattern": r"\bautofocus\b|autoFocus=\{true\}|autoFocus\b",
        "check": "direct",
    },
]

# ---------------------------------------------------------------------------
# Color / visual accessibility patterns
# Detects hardcoded colors and color-only state communication that may
# fail WCAG 1.4.1 (Use of Color) and 1.4.3 (Contrast).
# ---------------------------------------------------------------------------
COLOR_A11Y_PATTERNS = [
    {
        "name": "hardcoded-hex-color",
        "severity": "info",
        "message": "Hardcoded hex color in style prop — use a design token or CSS variable for consistency and theming",
        "pattern": r'(?:color|background|borderColor|fill|stroke)\s*:\s*[\'"]#[0-9a-fA-F]{3,8}[\'"]',
        "check": "direct",
    },
    {
        "name": "hardcoded-rgb-color",
        "severity": "info",
        "message": "Hardcoded rgb/rgba color in style prop — use a design token or CSS variable instead",
        "pattern": r'(?:color|background|borderColor|fill|stroke)\s*:\s*rgba?\(',
        "check": "direct",
    },
    {
        "name": "color-only-error-state",
        "severity": "warning",
        "message": "Error/success state may be communicated by color alone — add an icon, text label, or aria-label (WCAG 1.4.1)",
        "pattern": r'(?:color|backgroundColor)\s*:\s*[\'"](?:red|green|orange|#[a-fA-F0-9]{3,6})[\'"]',
        "check": "direct",
    },
    {
        "name": "inline-color-style",
        "severity": "info",
        "message": "Inline color style= on JSX element — extract to CSS module or design token to support high-contrast mode",
        "pattern": r'style=\{\{[^}]*color\s*:',
        "check": "direct",
    },
]

# ---------------------------------------------------------------------------
# Migration guide quick-fix patterns
# These are checks derived from the V9 Engineering Quality Gates in
# A-Migration/V9_MIGRATION_TODOS_CONSISTENT_QG.md and STANDARDIZATION_HANDOFF.md.
# They catch regressions and leftover patterns from the V8→V9 migration.
# ---------------------------------------------------------------------------
MIGRATION_PATTERNS = [
    {
        "name": "fetch-in-component",
        "severity": "warning",
        "message": "Direct fetch() call inside a component/hook — move network calls to a service (services-first migration gate)",
        "pattern": r"await\s+fetch\(|fetch\(['\"]https?://",
        "check": "non_service",
    },
    {
        "name": "fetch-no-abort-signal",
        "severity": "info",
        "message": "fetch() call without AbortController signal — request cannot be cancelled on component unmount (async cleanup gate)",
        "pattern": r"await\s+fetch\((?![^)]*signal)",
        "check": "direct",
    },
    {
        "name": "useeffect-async-no-cleanup",
        "severity": "warning",
        "message": "useEffect with async inner function — verify AbortController cleanup is returned (prevents memory leaks)",
        "pattern": r"useEffect\(\s*\(\s*\)\s*=>\s*\{\s*(?:const\s+\w+\s*=\s*)?async\s+(?:function|\()",
        "check": "direct",
    },
    {
        "name": "v4toast-straggler",
        "severity": "error",
        "message": "v4ToastManager/toastV4 still referenced — must be migrated to modernMessaging (migration gate: DONE per STANDARDIZATION_HANDOFF.md, verify no new usages)",
        "pattern": r"v4ToastManager|toastV4|showToastV4",
        "check": "direct",
    },
    {
        "name": "toastv8-straggler",
        "severity": "error",
        "message": "toastV8/showToastV8 still referenced — must be migrated to modernMessaging (migration gate: DONE per STANDARDIZATION_HANDOFF.md)",
        "pattern": r"\btoastV8\b|showToastV8\b",
        "check": "direct",
    },
    {
        "name": "raw-console-in-src",
        "severity": "warning",
        "message": "console.error/warn in source — use logger.* instead (migration gate; see intentional-exception list in STANDARDIZATION_HANDOFF.md)",
        "pattern": r"console\.(error|warn)\(",
        "check": "direct",
    },
    {
        "name": "token-value-in-jsx",
        "severity": "error",
        "message": "Raw token field name in JSX output — sanitize/truncate before rendering (migration guide security gate)",
        "pattern": r"\{(?:.*\b(?:access_token|id_token|refresh_token|client_secret)\b.*)\}",
        "check": "direct",
    },
    {
        "name": "throw-in-service",
        "severity": "info",
        "message": "throw statement in service file — prefer ServiceResult<T> error return pattern (migration gate: Gate B)",
        "pattern": r"\bthrow\s+new\s+Error\(",
        "check": "service_only",
    },
    {
        "name": "no-flow-loading-state",
        "severity": "info",
        "message": "Async service call without a visible isLoading/loading state guard — flow state gate: idle→loading→success→error",
        "pattern": r"await\s+\w+Service\.\w+\(",
        "check": "direct",
    },
]

# ---------------------------------------------------------------------------
# All pattern sets — iterated in run_runtime_analysis
# Each entry: (list, tool-tag)
# ---------------------------------------------------------------------------
ALL_PATTERN_SETS = [
    (RUNTIME_PATTERNS, "runtime-analysis"),
    (KEYBOARD_A11Y_PATTERNS, "a11y-keyboard"),
    (COLOR_A11Y_PATTERNS, "a11y-color"),
    (MIGRATION_PATTERNS, "migration-check"),
]

# ---------------------------------------------------------------------------
# Import tracing helpers
# ---------------------------------------------------------------------------
IMPORT_RE = re.compile(
    r"""(?:import|from)\s+['"](\.[^'"]+)['"]\s*""",
    re.MULTILINE,
)

TS_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"]


def resolve_import(base_file: Path, import_path: str) -> Path | None:
    """Resolve a relative import path from base_file to an absolute path."""
    base_dir = base_file.parent
    candidate = (base_dir / import_path).resolve()

    # Try exact path first
    if candidate.exists():
        return candidate

    # Try adding extensions
    for ext in TS_EXTENSIONS:
        p = Path(str(candidate) + ext)
        if p.exists():
            return p

    # Try as index file
    for ext in TS_EXTENSIONS:
        p = candidate / f"index{ext}"
        if p.exists():
            return p

    return None


def collect_imports(file_path: Path, visited: set[Path], depth: int, max_depth: int) -> None:
    """Recursively collect imports from a file, up to max_depth."""
    if depth > max_depth or file_path in visited:
        return
    visited.add(file_path)

    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return

    for match in IMPORT_RE.finditer(content):
        import_path = match.group(1)
        if not import_path.startswith("."):
            continue
        resolved = resolve_import(file_path, import_path)
        if resolved is None:
            continue
        # Only trace files inside src/
        try:
            resolved.relative_to(ROOT / "src")
        except ValueError:
            continue
        collect_imports(resolved, visited, depth + 1, max_depth)


def collect_files(group_id: str, max_depth: int = 3) -> list[str]:
    """
    Resolve the full file set for a group:
    - Listed page files (must exist)
    - All imports in those pages (recursively, up to max_depth)
    Returns paths as strings relative to ROOT.
    """
    group = GROUPS[group_id]
    visited: set[Path] = set()

    for rel_page in group["pages"]:
        abs_path = ROOT / rel_page
        if abs_path.exists():
            collect_imports(abs_path, visited, depth=0, max_depth=max_depth)
        else:
            # Still add the entry so it shows up in files_scanned with a note
            pass

    # Convert to ROOT-relative strings and sort
    result = []
    for p in sorted(visited):
        try:
            rel = str(p.relative_to(ROOT))
        except ValueError:
            rel = str(p)
        result.append(rel)

    return result


def categorize_files(files: list[str]) -> dict[str, list[str]]:
    """Split a file list into pages / services / components / hooks / other."""
    cats: dict[str, list[str]] = {
        "pages": [],
        "services": [],
        "components": [],
        "hooks": [],
        "other": [],
    }
    for f in files:
        lf = f.lower()
        if "/pages/" in lf:
            cats["pages"].append(f)
        elif "/services/" in lf:
            cats["services"].append(f)
        elif "/components/" in lf:
            cats["components"].append(f)
        elif "/hooks/" in lf:
            cats["hooks"].append(f)
        else:
            cats["other"].append(f)
    return cats


# ---------------------------------------------------------------------------
# Load / save helpers
# ---------------------------------------------------------------------------
def _read_json(path: Path) -> Any:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return {}


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _load_service_coverage() -> dict[str, list[str]]:
    return _read_json(SERVICE_COV_FILE)


def _save_service_coverage(cov: dict[str, list[str]]) -> None:
    _write_json(SERVICE_COV_FILE, cov)


def _load_group_report(group_id: str) -> dict[str, Any]:
    path = GROUPS_DIR / f"{GROUPS[group_id]['num']}-{group_id}.json"
    return _read_json(path)


def _save_group_report(group_id: str, report: dict[str, Any]) -> None:
    path = GROUPS_DIR / f"{GROUPS[group_id]['num']}-{group_id}.json"
    _write_json(path, report)


# ---------------------------------------------------------------------------
# Biome scan
# ---------------------------------------------------------------------------
def run_biome_fix(files: list[str]) -> int:
    """Run biome check --write on the given files. Returns number of files changed."""
    if not files:
        return 0
    cmd = ["npx", "--yes", "@biomejs/biome", "check", "--write", "--unsafe"] + files
    try:
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    except KeyboardInterrupt:
        # Stray Ctrl+C from terminal — skip auto-fix silently
        return 0
    # Count files changed from output
    changed = len([l for l in result.stdout.splitlines() if "fixed" in l.lower()])
    return changed


def run_biome_check(files: list[str]) -> list[dict[str, Any]]:
    """Run biome check --reporter json and parse results into issue dicts."""
    if not files:
        return []
    cmd = ["npx", "--yes", "@biomejs/biome", "check", "--reporter", "json"] + files
    try:
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    except KeyboardInterrupt:
        return []

    issues = []
    try:
        # Biome may output to stdout or stderr depending on version
        raw = result.stdout.strip() or result.stderr.strip()
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        # Try line-by-line (biome sometimes outputs one JSON object per diagnostic)
        for line in (result.stdout + result.stderr).splitlines():
            line = line.strip()
            if line.startswith("{"):
                try:
                    data = json.loads(line)
                    issues += _parse_biome_json(data)
                except json.JSONDecodeError:
                    pass
        return issues

    issues += _parse_biome_json(data)
    return issues


def _parse_biome_json(data: dict | list) -> list[dict[str, Any]]:
    """Parse Biome's JSON output into a flat list of issue dicts."""
    issues = []
    if isinstance(data, list):
        for item in data:
            issues += _parse_biome_json(item)
        return issues

    diagnostics = data.get("diagnostics", [])
    for diag in diagnostics:
        category = diag.get("category", "")
        severity_raw = diag.get("severity", "warning")
        severity = severity_raw.lower() if severity_raw else "warning"

        location = diag.get("location", {})
        path_info = location.get("path", {})
        file_path = path_info.get("file", "") if isinstance(path_info, dict) else str(path_info)

        # Span: Biome uses [offset_start, offset_end] — we prefer line numbers
        line = location.get("line") or 0
        col = location.get("column") or 0

        # Also check textRange or span for line info
        if not line:
            span = location.get("span") or location.get("textRange", {})
            if isinstance(span, dict):
                line = span.get("start", {}).get("line", 0) if isinstance(span.get("start"), dict) else 0

        # Description (the primary message)
        description = diag.get("description", "") or ""
        if not description:
            message_parts = diag.get("message", [])
            if isinstance(message_parts, list):
                description = " ".join(
                    p.get("content", "") if isinstance(p, dict) else str(p)
                    for p in message_parts
                )
            elif isinstance(message_parts, str):
                description = message_parts

        can_autofix = bool(diag.get("fix") or diag.get("fixes"))
        fix_type = "auto" if can_autofix else "manual"
        if category.startswith("format/"):
            fix_type = "auto"
            can_autofix = True

        issues.append(
            {
                "_tool": "biome",
                "_file": file_path,
                "_line": line,
                "_col": col,
                "_severity": severity,
                "_rule": category,
                "_message": description.strip(),
                "_can_autofix": can_autofix,
                "_fix_type": fix_type,
            }
        )
    return issues


# ---------------------------------------------------------------------------
# ESLint scan
# ---------------------------------------------------------------------------
def run_eslint_check(files: list[str]) -> list[dict[str, Any]]:
    """Run ESLint --format json and parse results into issue dicts."""
    if not files:
        return []

    # Filter to only files ESLint handles (ts/tsx/js/jsx)
    eslint_files = [f for f in files if f.endswith((".ts", ".tsx", ".js", ".jsx"))]
    if not eslint_files:
        return []

    cmd = ["npx", "--yes", "eslint", "--format", "json"] + eslint_files
    try:
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    except KeyboardInterrupt:
        return []

    issues = []
    try:
        raw = result.stdout.strip()
        if not raw:
            return []
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return []

    for file_report in data:
        file_path = file_report.get("filePath", "")
        # Make relative
        try:
            file_path = str(Path(file_path).relative_to(ROOT))
        except ValueError:
            pass

        for msg in file_report.get("messages", []):
            severity_int = msg.get("severity", 1)
            severity = "error" if severity_int == 2 else "warning"
            rule = msg.get("ruleId") or "eslint/unknown"
            message = msg.get("message", "")
            line = msg.get("line", 0)
            col = msg.get("column", 0)
            can_autofix = bool(msg.get("fix"))
            fix_type = "auto" if can_autofix else "manual"

            issues.append(
                {
                    "_tool": "eslint",
                    "_file": file_path,
                    "_line": line,
                    "_col": col,
                    "_severity": severity,
                    "_rule": rule,
                    "_message": message,
                    "_can_autofix": can_autofix,
                    "_fix_type": fix_type,
                }
            )
    return issues


# ---------------------------------------------------------------------------
# TypeScript check
# ---------------------------------------------------------------------------
def run_tsc_check(files: list[str]) -> list[dict[str, Any]]:
    """
    Run tsc --noEmit globally and filter errors to only those in the given files.
    Returns issue dicts.
    """
    if not files:
        return []

    file_set = set(files)
    cmd = ["npx", "--yes", "tsc", "--noEmit"]
    try:
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    except KeyboardInterrupt:
        return []

    # tsc output format:  path/file.ts(line,col): error TSxxxx: message
    TSC_RE = re.compile(r"^(.+)\((\d+),(\d+)\):\s+(error|warning|message)\s+(TS\d+):\s+(.+)$")

    issues = []
    for raw_line in (result.stdout + result.stderr).splitlines():
        m = TSC_RE.match(raw_line.strip())
        if not m:
            continue
        raw_file, line, col, severity, code, message = m.groups()

        # Normalise path
        try:
            norm_file = str(Path(raw_file).relative_to(ROOT))
        except ValueError:
            norm_file = raw_file

        if norm_file not in file_set:
            continue

        issues.append(
            {
                "_tool": "tsc",
                "_file": norm_file,
                "_line": int(line),
                "_col": int(col),
                "_severity": severity,
                "_rule": code,
                "_message": message.strip(),
                "_can_autofix": False,
                "_fix_type": "manual",
            }
        )
    return issues


# ---------------------------------------------------------------------------
# Runtime pattern analysis
# ---------------------------------------------------------------------------
def run_runtime_analysis(files: list[str]) -> list[dict[str, Any]]:
    """
    Python regex-based pattern checks across four categories:
      1. runtime-analysis  — runtime bug patterns (null-deref, bad JSON.parse, etc.)
      2. a11y-keyboard     — keyboard accessibility issues (missing roles, no onKeyDown, etc.)
      3. a11y-color        — color/visual accessibility (hardcoded colors, color-only state)
      4. migration-check   — V8→V9 migration gate regressions (toast stragglers, fetch-in-component, etc.)
    """
    issues = []
    file_set = [f for f in files if f.endswith((".ts", ".tsx", ".js", ".jsx"))]

    for rel_file in file_set:
        abs_file = ROOT / rel_file
        if not abs_file.exists():
            continue
        try:
            content = abs_file.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue

        lines = content.splitlines()
        is_service_file = "/services/" in rel_file.lower()

        for pattern_list, tool_tag in ALL_PATTERN_SETS:
            for pattern_def in pattern_list:
                pat = re.compile(pattern_def["pattern"])
                check = pattern_def["check"]

                # service_only patterns only apply to service files
                if check == "service_only" and not is_service_file:
                    continue

                # non_service patterns skip service files (services may use fetch directly)
                if check == "non_service" and is_service_file:
                    continue

                for lineno, line_text in enumerate(lines, start=1):
                    if not pat.search(line_text):
                        continue

                    # Skip comment lines
                    stripped = line_text.strip()
                    if stripped.startswith("//") or stripped.startswith("*"):
                        continue

                    # Skip if preceded by an educational-ok suppression comment
                    if lineno >= 2 and lines[lineno - 2].strip().startswith("// educational-ok:"):
                        continue

                    # --- heuristic: json_parse — skip if inside a try block ---
                    if check == "json_parse":
                        start = max(0, lineno - 50)
                        context_lines = lines[start : lineno - 1]
                        in_try = any("try {" in cl or "try{" in cl for cl in context_lines)
                        if in_try:
                            continue

                    # --- heuristic: a11y_onclick — only flag non-button/non-anchor elements ---
                    # Skip if the line already contains onKeyDown/onKeyPress/onKeyUp after onClick,
                    # or if the element is a native <button> or <a> (already keyboard-accessible).
                    if check == "a11y_onclick":
                        if re.search(r"<(?:button|a)\b", line_text):
                            continue
                        if re.search(r"onKey(?:Down|Press|Up)", line_text):
                            continue

                    issues.append(
                        {
                            "_tool": tool_tag,
                            "_file": rel_file,
                            "_line": lineno,
                            "_col": 1,
                            "_severity": pattern_def["severity"],
                            "_rule": f"{tool_tag}/{pattern_def['name']}",
                            "_message": pattern_def["message"],
                            "_can_autofix": False,
                            "_fix_type": "manual",
                        }
                    )

    return issues


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------
def run_tests(group_id: str, test_types: list[str]) -> dict[str, Any]:
    """Run mapped tests for a group and return result dict."""
    group = GROUPS[group_id]
    test_map = group.get("tests", {})
    now = datetime.now(timezone.utc).isoformat()

    result: dict[str, Any] = {
        "ran_at": now,
        "unit": None,
        "api": None,
        "e2e": None,
        "overall": "not_run",
    }

    if "unit" in test_types:
        result["unit"] = _run_vitest(test_map.get("unit", []))

    if "api" in test_types:
        result["api"] = _run_jest_api(test_map.get("api", []))

    if "e2e" in test_types:
        result["e2e"] = _run_playwright(test_map.get("e2e", []))

    # Compute overall
    ran_results = [v for v in [result["unit"], result["api"], result["e2e"]] if v is not None]
    if not ran_results:
        result["overall"] = "not_run"
    elif all(r.get("failed", 0) == 0 for r in ran_results):
        result["overall"] = "pass"
    elif all(r.get("passed", 0) == 0 for r in ran_results):
        result["overall"] = "fail"
    else:
        result["overall"] = "partial"

    return result


def _run_vitest(patterns: list[str]) -> dict[str, Any]:
    if not patterns:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no tests mapped"}

    pattern_args = []
    for p in patterns:
        # Convert glob-style to vitest --reporter=json filter
        base = Path(p).name.rstrip("*").rstrip(".")
        if base:
            pattern_args += ["--reporter", "json", "--testNamePattern", base]

    # Get unique test path patterns
    test_files = []
    for p in patterns:
        if "*" in p:
            base_dir = ROOT / Path(p).parent
            stem_pat = Path(p).name.replace("*", "")
            if base_dir.exists():
                matches = list(base_dir.glob(f"*{stem_pat}*"))
                test_files += [str(m) for m in matches if m.is_file()]
        else:
            abs_p = ROOT / p
            if abs_p.exists():
                test_files.append(str(abs_p))

    if not test_files:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no test files found"}

    cmd = ["npx", "--yes", "vitest", "run", "--reporter=json"] + test_files
    t0 = datetime.now()
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=120)
    dur = int((datetime.now() - t0).total_seconds() * 1000)

    try:
        data = json.loads(result.stdout)
        total = data.get("numTotalTests", 0)
        failed = data.get("numFailedTests", 0)
        passed = data.get("numPassedTests", 0)
        skipped = data.get("numPendingTests", 0)
        failures = []
        for suite in data.get("testResults", []):
            for t in suite.get("testResults", []):
                if t.get("status") == "failed":
                    failures.append({"test": t.get("title", ""), "error": t.get("failureMessages", [""])[0][:200]})
        out = {"passed": passed, "failed": failed, "skipped": skipped, "duration_ms": dur}
        if failures:
            out["failures"] = failures
        return out
    except (json.JSONDecodeError, ValueError):
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": dur, "note": "could not parse output"}


def _run_jest_api(test_files: list[str]) -> dict[str, Any]:
    if not test_files:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no tests mapped"}

    existing = [f for f in test_files if (ROOT / f).exists()]
    if not existing:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no test files found"}

    cmd = ["npx", "--yes", "jest", "--json"] + existing
    t0 = datetime.now()
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=120)
    dur = int((datetime.now() - t0).total_seconds() * 1000)

    try:
        data = json.loads(result.stdout)
        passed = data.get("numPassedTests", 0)
        failed = data.get("numFailedTests", 0)
        skipped = data.get("numPendingTests", 0)
        out = {"passed": passed, "failed": failed, "skipped": skipped, "duration_ms": dur}
        return out
    except (json.JSONDecodeError, ValueError):
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": dur, "note": "could not parse output"}


def _run_playwright(spec_files: list[str]) -> dict[str, Any]:
    if not spec_files:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no tests mapped"}

    existing = [f for f in spec_files if (ROOT / f).exists()]
    if not existing:
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": 0, "note": "no test files found"}

    cmd = ["npx", "--yes", "playwright", "test", "--reporter=json"] + existing
    t0 = datetime.now()
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=300)
    dur = int((datetime.now() - t0).total_seconds() * 1000)

    try:
        data = json.loads(result.stdout)
        stats = data.get("stats", {})
        passed = stats.get("expected", 0)
        failed = stats.get("unexpected", 0)
        skipped = stats.get("skipped", 0)
        out = {"passed": passed, "failed": failed, "skipped": skipped, "duration_ms": dur}
        return out
    except (json.JSONDecodeError, ValueError):
        return {"passed": 0, "failed": 0, "skipped": 0, "duration_ms": dur, "note": "could not parse output"}


# ---------------------------------------------------------------------------
# Issue ID generation
# ---------------------------------------------------------------------------
def make_issue_id(group_id: str, index: int) -> str:
    return f"{group_id}-{index:03d}"


def build_issue(group_id: str, index: int, raw: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": make_issue_id(group_id, index),
        "tool": raw["_tool"],
        "file": raw["_file"],
        "line": raw.get("_line", 0),
        "col": raw.get("_col", 0),
        "severity": raw["_severity"],
        "rule": raw["_rule"],
        "message": raw["_message"],
        "can_autofix": raw["_can_autofix"],
        "fix_type": raw["_fix_type"],
        "status": "auto_fixed" if raw.get("_auto_fixed") else "open",
        "assignee": "auto" if raw.get("_auto_fixed") else None,
        "fixed_at": now if raw.get("_auto_fixed") else None,
        "notes": "Applied by biome --write" if raw.get("_auto_fixed") else None,
    }


# ---------------------------------------------------------------------------
# Regression check
# ---------------------------------------------------------------------------
def check_regression(group_id: str, services: list[str], cov: dict[str, list[str]]) -> list[dict]:
    regressions = []
    for svc in services:
        svc_key = Path(svc).name
        if svc_key in cov:
            prior_groups = [g for g in cov[svc_key] if g != group_id]
            if prior_groups:
                regressions.append(
                    {
                        "service": svc_key,
                        "previously_in": prior_groups[0],
                        "check_regression": True,
                    }
                )
        else:
            regressions.append(
                {
                    "service": svc_key,
                    "previously_in": None,
                    "check_regression": False,
                }
            )
    return regressions


def update_service_coverage(group_id: str, services: list[str], cov: dict[str, list[str]]) -> None:
    for svc in services:
        svc_key = Path(svc).name
        if svc_key not in cov:
            cov[svc_key] = []
        if group_id not in cov[svc_key]:
            cov[svc_key].append(group_id)


# ---------------------------------------------------------------------------
# Main scan
# ---------------------------------------------------------------------------
def scan_group(
    group_id: str,
    fix: bool = False,
    test_types: list[str] | None = None,
    scanned_by: str | None = None,
) -> dict[str, Any]:
    if group_id not in GROUPS:
        print(f"ERROR: unknown group '{group_id}'. Run --list to see valid IDs.", file=sys.stderr)
        sys.exit(1)

    group = GROUPS[group_id]
    print(f"\n{'='*60}")
    print(f"  Scanning group: {group['num']} — {group['label']}")
    print(f"{'='*60}")

    # 1. Resolve files
    print("  → Resolving file set...")
    all_files = collect_files(group_id)
    cats = categorize_files(all_files)

    # Merge in pages from group def even if not found by import tracing
    for rel_page in group["pages"]:
        abs_p = ROOT / rel_page
        if abs_p.exists() and rel_page not in all_files:
            all_files.append(rel_page)

    all_files = sorted(set(all_files))
    cats = categorize_files(all_files)
    print(f"     {len(all_files)} files: {len(cats['pages'])} pages, {len(cats['services'])} services, "
          f"{len(cats['components'])} components, {len(cats['hooks'])} hooks, {len(cats['other'])} other")

    # Load existing report to preserve manually-set statuses
    existing_report = _load_group_report(group_id)
    existing_issues: dict[str, dict] = {iss["id"]: iss for iss in existing_report.get("issues", [])}

    # 2. Auto-fix pass
    auto_fixed_count = 0
    if fix:
        print("  → Applying auto-fixes (biome --write)...")
        auto_fixed_count = run_biome_fix(all_files)
        print(f"     auto-fixed: {auto_fixed_count} files modified")

    # 3. Collect raw issues
    print("  → Running Biome check...")
    raw_biome = run_biome_check(all_files)
    print(f"     {len(raw_biome)} issues")

    print("  → Running ESLint check...")
    raw_eslint = run_eslint_check(all_files)
    print(f"     {len(raw_eslint)} issues")

    print("  → Running TypeScript check (global, filtered to group)...")
    raw_tsc = run_tsc_check(all_files)
    print(f"     {len(raw_tsc)} issues")

    print("  → Running runtime pattern analysis...")
    raw_runtime = run_runtime_analysis(all_files)
    print(f"     {len(raw_runtime)} issues")

    all_raw = raw_biome + raw_eslint + raw_tsc + raw_runtime

    # 4. Build issue records (preserve existing status where issue key matches)
    issues = []
    idx = 1
    for raw in all_raw:
        # Deduplicate: same file+line+rule already in existing
        key = f"{raw['_file']}:{raw.get('_line', 0)}:{raw['_rule']}"
        existing_match = None
        for eid, eiss in existing_issues.items():
            if (
                eiss["file"] == raw["_file"]
                and eiss["line"] == raw.get("_line", 0)
                and eiss["rule"] == raw["_rule"]
            ):
                existing_match = eiss
                break

        if existing_match:
            # Preserve manual status changes (in_progress, fixed, waived, auto_fixed)
            if existing_match["status"] in ("in_progress", "fixed", "waived", "auto_fixed"):
                issues.append(existing_match)
                continue

        issue = build_issue(group_id, idx, raw)
        idx += 1
        issues.append(issue)

    # 5. Service regression check
    cov = _load_service_coverage()
    service_cross_refs = check_regression(group_id, cats["services"], cov)
    update_service_coverage(group_id, cats["services"], cov)
    _save_service_coverage(cov)

    # Print regression warnings
    warned = [r for r in service_cross_refs if r["check_regression"]]
    if warned:
        print(f"\n  ⚠️  Service regression warnings:")
        for w in warned:
            print(f"     {w['service']} was previously scanned in group '{w['previously_in']}'")
            print(f"     Re-run: python3 scripts/lint_per_group.py --group {w['previously_in']}")

    # 6. Run tests
    test_results = {"ran_at": None, "unit": None, "api": None, "e2e": None, "overall": "not_run"}
    if test_types:
        print(f"\n  → Running tests: {', '.join(test_types)}...")
        test_results = run_tests(group_id, test_types)
        print(f"     Tests overall: {test_results['overall']}")

    # 7. Build summary
    auto_fixed_issues = len([i for i in issues if i["status"] == "auto_fixed"])
    open_issues = len([i for i in issues if i["status"] == "open"])
    manual_required = len([i for i in issues if i["fix_type"] == "manual" and i["status"] == "open"])

    summary = {
        "total": len(issues),
        "errors": len([i for i in issues if i["severity"] == "error"]),
        "warnings": len([i for i in issues if i["severity"] == "warning"]),
        "auto_fixed": auto_fixed_issues,
        "manual_required": manual_required,
        "open": open_issues,
        "in_progress": len([i for i in issues if i["status"] == "in_progress"]),
        "fixed": len([i for i in issues if i["status"] == "fixed"]),
        "waived": len([i for i in issues if i["status"] == "waived"]),
    }

    # 8. Build and save report
    report = {
        "group_id": group_id,
        "label": group["label"],
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "scanned_by": scanned_by,
        "files_scanned": all_files,
        "services_scanned": cats["services"],
        "service_cross_refs": service_cross_refs,
        "biome": {
            "errors": len([i for i in raw_biome if i["_severity"] == "error"]),
            "warnings": len([i for i in raw_biome if i["_severity"] == "warning"]),
            "auto_fixed": auto_fixed_count,
        },
        "eslint": {
            "errors": len([i for i in raw_eslint if i["_severity"] == "error"]),
            "warnings": len([i for i in raw_eslint if i["_severity"] == "warning"]),
        },
        "tsc": {
            "errors": len(raw_tsc),
        },
        "runtime": {
            "errors": len([i for i in raw_runtime if i["_severity"] == "error"]),
            "warnings": len([i for i in raw_runtime if i["_severity"] == "warning"]),
        },
        "tests": test_results,
        "issues": issues,
        "summary": summary,
    }

    _save_group_report(group_id, report)
    regenerate_status_md()

    status_emoji = "✅" if summary["total"] == 0 else ("🔴" if summary["errors"] > 0 else "🟡")
    print(f"\n  {status_emoji} Done — {summary['total']} issues ({summary['errors']} errors, "
          f"{summary['warnings']} warnings, {summary['auto_fixed']} auto-fixed, "
          f"{summary['manual_required']} need manual fix)")
    print(f"  Report: lint-reports/groups/{GROUPS[group_id]['num']}-{group_id}.json")

    return report


# ---------------------------------------------------------------------------
# STATUS.md regeneration
# ---------------------------------------------------------------------------
def regenerate_status_md() -> None:
    cov = _load_service_coverage()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = [
        "# Linter Audit — STATUS",
        f"> Updated: {now} | Tools: Biome + ESLint + tsc + runtime-analysis + a11y-keyboard + a11y-color + migration-check",
        "> Run: `python3 scripts/lint_per_group.py --help` for full CLI reference",
        "",
        "| # | Group | Files | Total | Errors | Warns | Auto-fixed | Manual | Open | Done | Assignee | Status |",
        "|---|-------|-------|-------|--------|-------|------------|--------|------|------|----------|--------|",
    ]

    regressions = []

    for group_id, group in GROUPS.items():
        report_path = GROUPS_DIR / f"{group['num']}-{group_id}.json"
        if not report_path.exists():
            lines.append(
                f"| {group['num']} | {group['label']} | — | — | — | — | — | — | — | — | | ⬜ Not run |"
            )
            continue

        report = json.loads(report_path.read_text(encoding="utf-8"))
        s = report.get("summary", {})
        total = s.get("total", 0)
        errors = s.get("errors", 0)
        warnings = s.get("warnings", 0)
        auto_fixed = s.get("auto_fixed", 0)
        manual = s.get("manual_required", 0)
        open_c = s.get("open", 0)
        done = s.get("fixed", 0) + s.get("waived", 0) + s.get("auto_fixed", 0)  # type: ignore[operator]
        assignee = report.get("scanned_by") or ""
        n_files = len(report.get("files_scanned", []))

        if total == 0:
            status = "✅ Clean"
        elif errors > 0:
            status = "🔴 Has errors"
        elif open_c > 0:
            status = "🟡 In progress"
        else:
            status = "✅ Clean"

        lines.append(
            f"| {group['num']} | {group['label']} | {n_files} | {total} | {errors} | "
            f"{warnings} | {auto_fixed} | {manual} | {open_c} | {done} | {assignee} | {status} |"
        )

        # Collect regression items
        for ref in report.get("service_cross_refs", []):
            if ref.get("check_regression") and ref.get("previously_in"):
                regressions.append(
                    (ref["service"], ref["previously_in"], group_id)
                )

    # Regression section
    if regressions:
        lines += [
            "",
            "## ⚠️ Service Regression Checks",
            "",
            "| Service | Fixed In | Now In | Action needed |",
            "|---------|----------|--------|---------------|",
        ]
        for svc, fixed_in, now_in in regressions:
            lines.append(f"| {svc} | {fixed_in} | {now_in} | Re-test service in {now_in} |")
    else:
        lines += [
            "",
            "## Service Regression Checks",
            "",
            "_No cross-group service overlaps detected yet._",
        ]

    # Footer
    lines += [
        "",
        "---",
        "",
        f"_Generated by `scripts/lint_per_group.py` — {now}_",
    ]

    STATUS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------
# Update a single issue
# ---------------------------------------------------------------------------
def update_issue(
    issue_id: str,
    status: str | None = None,
    assignee: str | None = None,
    notes: str | None = None,
) -> None:
    # issue_id format: <group-id>-<NNN>
    # Extract group_id: everything except the last dash-number segment
    parts = issue_id.rsplit("-", 1)
    if len(parts) != 2 or not parts[1].isdigit():
        print(f"ERROR: issue ID '{issue_id}' is not in the expected format <group-id>-NNN", file=sys.stderr)
        sys.exit(1)

    group_id = parts[0]
    if group_id not in GROUPS:
        print(f"ERROR: group '{group_id}' not found.", file=sys.stderr)
        sys.exit(1)

    report = _load_group_report(group_id)
    if not report:
        print(f"ERROR: no report found for group '{group_id}'. Run a scan first.", file=sys.stderr)
        sys.exit(1)

    for issue in report.get("issues", []):
        if issue["id"] == issue_id:
            if status:
                issue["status"] = status
                if status == "fixed":
                    issue["fixed_at"] = datetime.now(timezone.utc).isoformat()
            if assignee:
                issue["assignee"] = assignee
            if notes:
                issue["notes"] = notes
            _save_group_report(group_id, report)
            regenerate_status_md()
            print(f"✅ Updated {issue_id}: status={issue['status']}, assignee={issue.get('assignee')}")
            return

    print(f"ERROR: issue '{issue_id}' not found in group '{group_id}'.", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# --list
# ---------------------------------------------------------------------------
def cmd_list() -> None:
    print("\nAvailable scan groups (sidebar order):\n")
    print(f"  {'#':<4} {'ID':<35} {'Label'}")
    print("  " + "-" * 65)
    for group_id, group in GROUPS.items():
        report_path = GROUPS_DIR / f"{group['num']}-{group_id}.json"
        scanned = "✅" if report_path.exists() else "  "
        print(f"  {group['num']:<4} {group_id:<35} {group['label']}  {scanned}")
    print()
    print("  ✅ = report exists   (blank) = not yet scanned")
    print()
    print("Run a scan:")
    print("  python3 scripts/lint_per_group.py --fix --group <id>")
    print("  python3 scripts/lint_per_group.py --fix --tests unit --all")
    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Per-sidebar-group linter + runtime-analysis + a11y + migration-check + test runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/lint_per_group.py --list
  python3 scripts/lint_per_group.py --fix --group dashboard
  python3 scripts/lint_per_group.py --fix --tests unit --group oauth-flows
  python3 scripts/lint_per_group.py --fix --tests unit --all
  python3 scripts/lint_per_group.py --report
  python3 scripts/lint_per_group.py --update-issue oauth-flows-001 --status fixed
  python3 scripts/lint_per_group.py --update-issue dashboard-002 --status waived --notes "intentional"

See lint-reports/DEVELOPER_GUIDE.md for full documentation.
        """,
    )

    parser.add_argument("--list", action="store_true", help="List all available group IDs")
    parser.add_argument("--group", metavar="ID", help="Scan a single group by ID")
    parser.add_argument("--all", action="store_true", help="Scan all groups in sidebar order")
    parser.add_argument("--fix", action="store_true", help="Apply biome auto-fixes before scanning")
    parser.add_argument(
        "--tests",
        metavar="TYPE",
        help="Run tests after scan: unit | api | e2e | all",
    )
    parser.add_argument("--report", action="store_true", help="Regenerate STATUS.md from existing JSON (no scan)")
    parser.add_argument("--update-issue", metavar="ISSUE_ID", help="Update a specific issue record")
    parser.add_argument("--status", metavar="STATUS", help="New status for --update-issue (open|in_progress|fixed|waived)")
    parser.add_argument("--assignee", metavar="NAME", help="Assignee name for --update-issue")
    parser.add_argument("--notes", metavar="TEXT", help="Notes text for --update-issue")
    parser.add_argument("--scanned-by", metavar="NAME", help="Programmer name to record in the report")

    args = parser.parse_args()

    # Resolve test types
    test_types: list[str] | None = None
    if args.tests:
        if args.tests == "all":
            test_types = ["unit", "api", "e2e"]
        else:
            test_types = [t.strip() for t in args.tests.split(",")]

    if args.list:
        cmd_list()
        return

    if args.report:
        print("Regenerating STATUS.md from existing reports...")
        regenerate_status_md()
        print(f"✅ STATUS.md updated: lint-reports/STATUS.md")
        return

    if args.update_issue:
        if not args.status and not args.assignee and not args.notes:
            print("ERROR: --update-issue requires at least one of --status, --assignee, --notes", file=sys.stderr)
            sys.exit(1)
        update_issue(args.update_issue, status=args.status, assignee=args.assignee, notes=args.notes)
        return

    if args.all:
        for group_id in GROUPS:
            scan_group(group_id, fix=args.fix, test_types=test_types, scanned_by=args.scanned_by)
        print("\n✅ All groups scanned. See lint-reports/STATUS.md for summary.")
        return

    if args.group:
        scan_group(args.group, fix=args.fix, test_types=test_types, scanned_by=args.scanned_by)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
