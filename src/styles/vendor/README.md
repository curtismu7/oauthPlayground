# Vendor styles

## end-user-nano.css

Local copy of **Ping end-user-nano** CSS (Ping Identity UX).

- **Source:** https://assets.pingone.com/ux/end-user-nano/0.1.0-alpha.9/end-user-nano.css  
- **Usage:** Imported in `src/main.tsx`. Use a `.end-user-nano` wrapper on containers that should receive these styles.  
- **Scope:** Components using the Ping Nano look (e.g. AI & Identity pages, Debug Log Viewer) wrap content in `<div className="end-user-nano">`.

To update from Ping: download the same URL (or a newer version from assets.pingone.com) and replace this file. Keep the source comment at the top of the file.
