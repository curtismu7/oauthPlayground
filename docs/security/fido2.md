# FIDO2 / WebAuthn with PingOne – RP ID and Origin

This document explains how to configure **RP ID** and **origin** when using **PingOne FIDO2** from a web application, including localhost and production setups.

---

## 1. Key Concepts: Origin vs RP ID

### Origin

The **origin** is the full origin of the page where WebAuthn runs, i.e. where you call:

- `navigator.credentials.create(...)`
- `navigator.credentials.get(...)`

Format:

```
<scheme>://<host>[:port]
```

Examples:

- `https://localhost:3000`
- `https://auth.example.com`
- `http://localhost:3000`  ← allowed as a special-case for `localhost`

The browser sends this origin to the FIDO2 server so it can validate that the request comes from an allowed page.

---

### RP ID (Relying Party ID)

The **RP ID** identifies the web application that "owns" the WebAuthn credentials.

Rules:

- The RP ID **must be equal to** or a **suffix of** the host in the origin.
- It is **not** a URL — just a hostname-like value.

Examples:

- If the origin is `https://localhost:3000`:
  - Valid RP ID: `localhost`
  - Invalid: `pingone.com`

- If the origin is `https://auth.example.com`:
  - Valid RP IDs: `auth.example.com` or `example.com`
  - Invalid: `otherexample.com`, `pingone.com`

PingOne validates that the RP ID used in WebAuthn operations matches the application's configuration.

---

## 2. Localhost with PingOne FIDO2

**Scenario:**

- Web application runs locally: `https://localhost:3000`
- PingOne FIDO2 server lives on a cloud domain such as `*.pingone.com`

WebAuthn cares about **your web application's origin**, not PingOne’s domain.

### Recommended values for localhost

Use:

- **RP ID:**

```
localhost
```

- **Origin:**

```
https://localhost:3000
```

(or `http://localhost:3000` — WebAuthn treats `http://localhost` as secure for development.)

### PingOne configuration for localhost

In the PingOne admin console, for the application using FIDO2:

- Set **RP ID** to:

```
localhost
```

- Add allowed **origin(s)**:

```
https://localhost:3000
```

During WebAuthn ceremonies, the browser sends `https://localhost:3000` as the origin and the RP ID `localhost`, and PingOne validates them.

`pingone.com` is never used as the RP ID.

---

## 3. Production Configuration

Same rules apply when moving off localhost.

**Example:** Your production web app runs at `https://auth.example.com`

### Common RP ID choices

- **`example.com`** → allows credential sharing across subdomains
- **`auth.example.com`** → restricts credentials to this host only

### Allowed origins

- `https://auth.example.com`
- Any others you intentionally allow

### Examples

1. **RP ID: `example.com`**
   - Valid origins: `https://auth.example.com`, `https://login.example.com`, `https://example.com`

2. **RP ID: `auth.example.com`**
   - Valid origin: `https://auth.example.com` only

---

## 4. Interaction with PingOne

PingOne’s FIDO2 / WebAuthn service:

- **Does not define** the RP ID or origin; it **validates** them.
- Verifies that:
  - The RP ID matches the RP ID configured for the application.
  - The browser's origin is one of the allowed origins for that RP ID.

Your RP is always **your application's domain**, not `pingone.com`.

---

## 5. Quick Reference

### Localhost (development)
- **RP ID:** `localhost`
- **Origin:** `https://localhost:<port>`

### Production
- **RP ID:** `example.com` or `auth.example.com`
- **Origin(s):** any valid origins you configure for your application

**Never** use `pingone.com` as the RP ID for your application. PingOne is the FIDO2 server; your RP ID always reflects your own application's domain.
