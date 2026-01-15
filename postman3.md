Postman Generator V8 – Hotspot Mapping + Cursor Refactor Checklist

Target file:
src/services/postmanCollectionGeneratorV8.ts

Purpose:
Eliminate all blank generation across Postman collections and environments while preserving all existing functionality. This document maps concrete improvements to likely hotspots in the current V8 generator and provides a step-by-step Cursor refactor checklist.

======================================================================

PART 1 – HOTSPOT MAPPING (WHAT TO FIX AND WHERE)

HOTSPOT A: VARIABLE INITIALIZATION AND DEFAULTS

Likely locations:
	•	Top-level config parsing
	•	Objects that initialize variables like login, envId, domain, etc.

Problem:
Blank strings are used as defaults. Failures later in the pipeline never surface, and blank values silently propagate into Postman output.

Fix:
Do not initialize required variables to empty strings. Leave them unresolved until validated. Resolve variables in a dedicated step with explicit rules.

⸻

HOTSPOT B: VALUE DERIVATION LOGIC

Likely locations:
	•	Helper functions reading from config, env vars, discovery documents, user input
	•	Patterns like value || “”, value ?? “”, String(value), trim without checks

Problem:
Undefined or null values are coerced into empty strings, and the generator continues as if everything is valid.

Fix:
Replace all coercion with explicit resolution helpers. Required values must error if blank. User-fill values must always emit warnings if blank.

⸻

HOTSPOT C: TRY/CATCH THAT RETURNS EMPTY VALUES

Likely locations:
	•	Discovery metadata fetch
	•	Userinfo parsing
	•	Optional enrichment logic

Problem:
Errors are swallowed. Catch blocks return empty strings or empty objects. Downstream code cannot distinguish success from failure.

Fix:
Never return empty values from catch blocks. Required failures must produce errors and stop generation. Optional enhancements may continue only with explicit warnings.

⸻

HOTSPOT D: TEMPLATE AND INTERPOLATION LOGIC

Likely locations:
	•	URL builders
	•	Header builders
	•	Pre-request and test script generators
	•	Replace logic that substitutes missing values with empty strings

Problem:
Missing variables produce empty URLs, headers, or scripts, resulting in broken Postman requests.

Fix:
Only interpolate from resolved variables. Validate that no unresolved or empty templates remain before output is written.

⸻

HOTSPOT E: FINAL OUTPUT WRITING

Likely locations:
	•	Code immediately before writing collection and environment JSON files

Problem:
The generator assumes upstream correctness and writes broken artifacts without inspection.

Fix:
Add a final validation pass for both collection and environment output. Do not write files if validation fails.

======================================================================

PART 2 – CURSOR REFACTOR CHECKLIST (STEP BY STEP)

STEP 1: ADD A CENTRAL ISSUE COLLECTOR

Create a mechanism that collects errors and warnings during generation. Errors block generation. Warnings are always printed.

Rules:
	•	Required blank values produce errors
	•	User-fill blank values always produce warnings (mandatory)

⸻

STEP 2: DEFINE A STRICT BLANK POLICY

There are only two value categories.

Required values:
	•	Must never be blank
	•	Missing values stop generation

User-fill values:
	•	May be blank only intentionally
	•	Must always emit a warning
	•	Must be clearly described as user-fill in the output

No other category is allowed.

⸻

STEP 3: INTRODUCE EXPLICIT VALUE RESOLUTION HELPERS

Replace all direct access to config, env, or inputs with explicit resolution helpers.

Every value must go through either:
	•	required resolution (errors if blank)
	•	user-fill resolution (warnings if blank)

There must be no bypasses.

⸻

STEP 4: CENTRALIZE VARIABLE DEFINITIONS

Define all Postman variables in a single registry:
	•	variable key
	•	description
	•	required vs user-fill
	•	sensitive flag
	•	derivation logic

All flows and API calls must consume variables from this registry.

⸻

STEP 5: REMOVE BLANK DEFAULTS

Refactor all logic so required values are never defaulted to empty strings. Values must be explicitly resolved and validated before use.

⸻

STEP 6: VALIDATE GENERATED COLLECTION

Before writing the collection:
	•	Every request has a non-empty name
	•	Every request has a method
	•	URLs are valid and complete
	•	Header keys are non-empty
	•	Auth blocks are complete
	•	Scripts reference existing variables only

⸻

STEP 7: VALIDATE GENERATED ENVIRONMENT

Before writing the environment:
	•	Variable keys are non-empty
	•	Required variables are non-blank
	•	User-fill blanks always have warnings
	•	Descriptions explicitly instruct the user to fill missing values

⸻

STEP 8: SCAN FOR BROKEN PATTERNS

Fail generation if any output contains:
	•	empty template variables
	•	undefined or null template values
	•	bearer headers without tokens
	•	URLs with missing hosts

⸻

STEP 9: MAKE OUTPUT DETERMINISTIC

Sort variables by key. Use stable ordering for folders and requests. Keep JSON formatting predictable. This is required for debugging, reviews, and regression tests.

⸻

STEP 10: ADD TESTS

At minimum:
	•	Required value missing causes generator failure
	•	User-fill value blank produces warning
	•	Regression test for blank login scenario
	•	Global scan ensuring no blank required values
	•	Golden output tests for representative configurations

======================================================================

DEFINITION OF DONE

The generator cannot silently emit blank required values. User-fill blanks always produce warnings. All API calls and flows are protected. Existing functionality is preserved. Code is readable, documented, and debuggable. Tests prevent regression.

======================================================================

CORE PRINCIPLE

The generator must never default its way to success. It must either generate valid, safe Postman artifacts or fail loudly with actionable errors. Silent blank output is not acceptable.

⸻

If you want next, I can also:
	•	convert this into inline TODO comments for the TypeScript file
	•	split this into smaller Cursor tasks
	•	or map each checklist step to specific functions once you paste the code