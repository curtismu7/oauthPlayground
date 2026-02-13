#!/usr/bin/env python3
"""Generate per-company portal/login pages from shared templates.

Usage:
  python generate.py

Add or edit companies in shared/companies.json. Then run this script to refresh dist/<company>/portal.html + login.html.

Note: The generic pages in dist/portal.html and dist/login.html already support ?company=<id>
      and do not require regeneration for new companies.
"""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parent
SHARED = ROOT / "shared"
DIST = ROOT / "dist"
YEAR = "2026"

PORTAL_TPL = (DIST / "_templates" / "portal.tpl.html").read_text(encoding="utf-8")
LOGIN_TPL  = (DIST / "_templates" / "login.tpl.html").read_text(encoding="utf-8")

def fill(t, company_id, shared_prefix):
    return (t.replace("__COMPANY__", company_id)
             .replace("__SHARED__", shared_prefix)
             .replace("__YEAR__", YEAR))

def main():
    companies = json.loads((SHARED / "companies.json").read_text(encoding="utf-8"))
    # Recreate per-company folders
    for c in companies:
        cdir = DIST / c["id"]
        cdir.mkdir(parents=True, exist_ok=True)
        (cdir / "portal.html").write_text(fill(PORTAL_TPL, c["id"], "../../shared/"), encoding="utf-8")
        (cdir / "login.html").write_text(fill(LOGIN_TPL, c["id"], "../../shared/"), encoding="utf-8")
    print("Generated per-company pages in dist/<company>/")

if __name__ == "__main__":
    main()
