# phase3_gpt52medium_fallback_prompt.md
## Phase 3 Fallback Prompt — GPT‑5.2 Medium (1×) (When SWE‑1.5 Isn’t Enough)

You are GPT‑5.2 Medium (1×). Follow the Operating Rules in **swe_phase3_implementation.md**.

INPUT — Claude spec (paste here):
```
[PASTE CLAUDE SPEC HERE]
```

Use this model only when:
- the bug is subtle (async/state/race)
- you need more reasoning depth than SWE‑1.5
- but you want cheaper than Claude

Same iteration rules:
- 1–3 files, unified diff, verification + grep runId server.log
- stop after one iteration
