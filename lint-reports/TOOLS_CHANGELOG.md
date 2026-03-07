# Tools Changelog

> **Append a row whenever a new tool or significant script change is added.**
> Other programmers: check here first before building something new.
> Never delete or edit existing rows — this is an append-only log.

| Date | Tool | Command | Purpose | Added By |
|------|------|---------|---------|----------|
| 2026-03-07 | `lint_per_group.py` | `python3 scripts/lint_per_group.py` | Per-group Biome+ESLint+tsc+runtime-analysis scan with manual-fix tracking, service regression detection, and optional test integration (Vitest/Jest/Playwright mapped per sidebar group) | (initial) |
| 2026-03-07 | `lint_per_group.py` v2 | `python3 scripts/lint_per_group.py` | Added 3 new analysis layers: **a11y-keyboard** (7 WCAG 2.1 keyboard patterns), **a11y-color** (4 WCAG 1.4.1 color patterns), **migration-check** (9 V8→V9 gate patterns incl. token-value-in-jsx, v4toast-straggler, toastv8-straggler at error severity). Fixed KeyboardInterrupt crash on long `--all` runs. Full 17-group scan completed: 23,663 issues / 1,630 errors. | (session) |
