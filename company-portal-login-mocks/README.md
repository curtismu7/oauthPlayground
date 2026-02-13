# Company Portal / Login UI Mock Pack

This folder contains a **config-driven** portal + login UI that can imitate multiple company styles
using **one shared HTML/CSS/JS** system.

## Open files
- `dist/index.html` – home with dropdown
- `dist/portal.html?company=pิง...` – portal (supports modal login for some companies)
- `dist/login.html?company=...` – dedicated login page

## Add a new company (no code changes)
1) Edit `shared/companies.json` and add an entry:
   - `id` (unique)
   - `name`
   - `domain` (for reference)
   - `loginMode`: `"page"` or `"modal"`
   - `palette`: `primary`, `primaryDark`, `bg`, `surface`, `muted`, `border`, optional `accent`
   - `logoSvg`: inline SVG string

2) Reload `dist/index.html`:
   - The dropdown is built from `companies.json` automatically.
   - Pages work immediately using `?company=<id>`.

## Optional: generate static per-company files
If you need physical files per company (e.g. for packaging), run:
```bash
python generate.py
```
This writes `dist/<company>/portal.html` and `dist/<company>/login.html`.

## Notes
- These are **demo UI mocks** and should not be used as-is for production without review.
- Logos are simplified SVG approximations.
