# PingOne Worker Token Scopes – Reference Guide

**Last updated:** 2025-11-04

---

## 🧩 What is a Worker Token?
A **Worker Token** in PingOne is a **service-to-service access token** issued via the **Client Credentials grant** for a **Worker App** (a non-interactive, backend application).  
It’s used by automation, backend services, or admin tools (like import or orchestration systems) to securely call **PingOne Admin, Directory, or SSO APIs**.

---

## ✅ Valid Scopes by API Domain

| **Scope** | **Purpose / API Access** |
|------------|---------------------------|
| `p1:read:environments` | Read environments metadata |
| `p1:update:environments` | Modify environment configuration |
| `p1:read:applications` | Read application configurations |
| `p1:create:applications` | Create new applications |
| `p1:update:applications` | Update application settings |
| `p1:delete:applications` | Delete applications |
| `p1:read:connections` | Read IdP/SP and gateway connections |
| `p1:update:connections` | Modify connections |
| `p1:read:populations` | Read population definitions |
| `p1:update:populations` | Modify populations |
| `p1:read:users` | Read users (directory) |
| `p1:create:users` | Create users (directory) |
| `p1:update:users` | Update user attributes |
| `p1:delete:users` | Delete users |
| `p1:read:groups` | Read group info |
| `p1:update:groups` | Modify groups |
| `p1:read:roles` | Read role assignments |
| `p1:update:roles` | Modify roles |
| `p1:read:authenticators` | Read MFA authenticators and devices |
| `p1:update:authenticators` | Modify or delete authenticators |
| `p1:read:policies` | Read access policies (Risk, MFA, etc.) |
| `p1:update:policies` | Modify access policies |
| `p1:read:audit` | Read audit events |
| `p1:read:licenses` | Read license and subscription data |
| `p1:read:logs` | Read log entries (for environments with log export) |

---

## ⚙️ Specialized Scopes (Less Common but Supported)

| **Scope** | **Used For** |
|------------|--------------|
| `p1:read:flows` | Retrieve orchestration flows (PingOne DaVinci) |
| `p1:update:flows` | Modify or publish flows |
| `p1:read:templates` | Read email or SMS templates |
| `p1:update:templates` | Modify templates |
| `p1:read:certificates` | Read signing/encryption certs |
| `p1:update:certificates` | Rotate or upload new certs |
| `p1:read:grants` | Inspect OAuth grants |
| `p1:revoke:grants` | Revoke existing grants |

---

## 🧭 Worker Token Example for SSO APIs

When calling PingOne SSO endpoints such as `/v1/environments/{id}/applications`, `/connections`, `/populations`, or `/users`, use:

```bash
scope="p1:read:applications p1:read:connections p1:read:populations p1:read:users"
```

For write operations (create/update/delete), include corresponding `create:`, `update:`, or `delete:` scopes.

---

## 🧰 Example Token Request

```bash
curl -X POST \
  https://auth.pingone.com/{environmentId}/as/token \
  -u "{client_id}:{client_secret}" \
  -d "grant_type=client_credentials" \
  -d "scope=p1:read:users p1:update:users p1:read:applications"
```

This returns a **JWT access token** scoped to those permissions.

---

## 🛡️ Best Practices

1. **Principle of Least Privilege** – Only request scopes your worker actually needs.  
2. **Environment-Level Tokens** – Each token applies to one environment.  
3. **Regular Secret Rotation** – Rotate worker app credentials periodically.  
4. **Avoid Global Scopes** (`p1:admin`) unless absolutely necessary.  
5. **Audit Worker Apps** – Review under *PingOne Console → Connections → Worker Applications*.

---

## 📘 Summary

- Use **Client Credentials flow** for worker tokens.  
- Scopes map directly to PingOne APIs and permissions.  
- Keep secrets secure, rotate often, and limit scope usage to what’s required.  
- Worker tokens are ideal for secure automation and backend integrations.

---

*Prepared for: PingOne / SSO Worker Token Reference*  
*Author: ChatGPT (GPT‑5)*  
*Date: November 04, 2025*
