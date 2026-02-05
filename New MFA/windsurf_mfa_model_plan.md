# windsurf_mfa_model_plan.md
## Model Plan (Windsurf): SWE‑1.5 (Free) → Claude (2×) → GPT‑5.2 Medium (1×)

This plan minimizes credits by using **SWE‑1.5 (free)** for repo work and implementation loops, reserving **Claude (2×)** for a single “hard thinking” spec pass, and using **GPT‑5.2 Medium (1×)** for cheaper-but-strong iterations when SWE isn’t enough.

### Phase Overview
1) **Phase 1 — Inventory + Prove mfa-hub Works (FREE)**
   - Model: **SWE‑1.5 (free)**
   - File allowlist only (no repo scan)
   - Output: A–H inventory + interception point + server.log path + smoke plan

2) **Phase 2 — Spec Pass (2×, do once)**
   - Model: **Claude (2×)**
   - Input: paste Phase 1 output
   - Output: state machine + persistence + journaling + server.log shipping semantics + DoD + next tasks

3) **Phase 3 — Implementation Iterations (FREE / 1×)**
   - Default: **SWE‑1.5 (free)** for small-batch diffs (1–3 files)
   - Switch to: **GPT‑5.2 Medium (1×)** when you need stronger reasoning but still cheaper than Claude
   - Output each iteration: unified diff + verification + `grep runId` in `server.log`

### Universal “Credit Saver” Header (paste at top of every run)
- Output cap: ≤120 lines.
- Diffs/snippets only. Never paste whole files.
- Touch 1–3 files per iteration.
- No repo scan: only open files you change + up to 2 read-only context files.
- Loop stop: if same class of fix fails twice, STOP and report error + causes + next experiment.
- Always include verification steps and how to confirm `runId` appears in `server.log`.
