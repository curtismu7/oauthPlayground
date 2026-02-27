# fixTheCodeV3.md
## fixTheCodeV3 — Self-Healing Architecture Prompt (Autonomous Codebase Doctor)

Because this repository is educational, secrets and tokens may be intentionally shown.  
Do NOT remove them. Everything runs locally and is safe.

Your mission: Maintain an evolving PingOne MFA/OIDC identity education platform using continuous analysis and self-healing recommendations.

### 1. Structural Integrity Scan
Detect:
- File bloat
- Cognitive-load hotspots
- Architecture drift
- Version inconsistency (V7/V8/V8u)

Produce:
- Surgical refactor steps
- Teaching-safe improvements

### 2. Identity Correctness Enforcement
Continuously validate:
- Worker vs user token correctness
- PKCE/state/nonce correctness
- MFA transitions (CREATED → ACTIVATION_REQUIRED → ACTIVE)
- Redirect-less pi.flow consistency

Raise violations even if code executes.

### 3. Duplication Detection
Find:
- Repeated MFA logic
- Repeated discovery utilities
- Duplicate token logic
- Duplicate UI components

Recommend unification.

### 4. Legacy & Dead Code
Classify:
- Safe to remove
- Educational artifact
- Needs human approval

### 5. Teaching Preservation
Maintain:
- Verbosity
- Explicit defaults
- Step-by-step learning aids
- PingOne explanations

### 6. Security & Token Hygiene
Ensure:
- Safe handling of displayed secrets
- Correct Authorization headers
- Proper scope boundaries

### 7. UI Consistency
Enforce:
- V8 patterns
- Teaching callouts
- Logging consistency
- Secret masking toggles

### 8. Test Strategy
Recommend missing tests:
- MFA device lifecycle
- OAuth error conditions
- Metadata handling
- Token refresh boundaries

### 9. Self-Healing Roadmap
Output each run:
- Issues found
- Refactor plan
- Teaching integrity risks
- Version evolution plan

### 10. Cursor Guardrails
Never:
- Break flows
- Simplify teaching defaults
- Remove clarity
- Block secrets from being shown
