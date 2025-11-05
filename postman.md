# Postman Export Builder – Multi-Flow Wizard (PingOne)

**Last updated:** 2025-11-05

---

## 🎯 Goal
Build a **wizard-style page** that asks users configuration questions for the selected OAuth/OIDC **flow**, then generates & downloads **Postman Collection** + **Environment** JSON files that work out of the box with PingOne.

---

## ✅ Supported Flows
- **Authorization Code + PKCE** (recommended)
- **Authorization Code + client_secret**
- **Authorization Code + Redirect-less (`pi.flow`)**
- **Hybrid** (`code id_token`, `code token`, `code id_token token`)
- **Implicit** (`id_token`, `token`, combos) *(warn + de-emphasize)*
- **Client Credentials**
- **Device Authorization (Device Code)**
- **JWT Bearer (client assertion)**
- **Token Exchange**
- **Extras:** **PAR**, **RAR**, **UserInfo**, **Introspect**, **Revoke**, **Logout**

---

## 🧭 Wizard Steps

### Step 0 – Choose Flow
Dropdown: **Flow Type** (list above).  
Context help for each flow and recommended best practices.

### Step 1 – Common Inputs (prefilled from app state)
| Question | Type | Default / Source | Notes |
|-----------|------|------------------|-------|
| **Region** | Dropdown | `NA`, `EU`, `AP` | Determines hosts |
| **Environment ID** | Text | `appState.environmentId` | Read-only if set |
| **Auth Host** | Text | Derived by region | Example: `auth.pingone.com` |
| **API Host** | Text | Derived by region | Example: `api.pingone.com` |
| **Client ID** | Text | `appState.client_id` | Required |
| **Client Secret** | Password | Optional | Masked |
| **Redirect URI** | Text | `appState.redirect_uri` | Required if interactive |
| **Response Type** | Dropdown | `code` | Options: `code`, `token`, `id_token`, etc. |
| **Token Auth Method** | Dropdown | `none` | `none`, `client_secret_basic`, `client_secret_post` |
| **Scopes** | Text | `openid profile email` | Space-separated |
| **Include** | Checkboxes | All checked | `userinfo`, `introspect`, `revoke`, `logout` |
| **Advanced Toggles** | Toggles | OFF | `Enable PAR`, `Enable RAR`, `Add Token Exchange`, `Enable Redirect-less (pi.flow)` |

> Mask secrets and avoid logging sensitive data.

### Step 2 – Flow-Specific Inputs
| Flow | Additional Inputs |
|------|------------------|
| Auth Code + PKCE | none (PKCE auto-generated) |
| Auth Code + client_secret | `client_secret` |
| **Redirect-less (pi.flow)** | `username`, `password`, optional `mfa_code` |
| Hybrid/Implicit | confirm `response_type` combo |
| Client Credentials | optional `audience` |
| Device Code | polling interval |
| JWT Bearer | `iss`, `sub`, `private_key`, `kid`, `aud`, lifetime |
| Token Exchange | subject/actor tokens, `audience`, `requested_token_type`, `scope` |
| PAR/RAR | JSON editors for auth details |

---

## 🔁 Redirect-less (`pi.flow`) Flow

### Overview
The `pi.flow` mechanism lets PingOne perform the Authorization Code flow **without browser redirects**. This is ideal for automation and backend testing scenarios.

### Steps
1️⃣ **Start Flow** – Call `/as/authorize` with `response=pi.flow`.  
2️⃣ **Authenticate** – POST credentials to the returned `resumeUrl`.  
3️⃣ **MFA / Consent (if required)** – Continue the flow via new `resumeUrl`.  
4️⃣ **Extract `authorization_code`** – From final response or redirect param.  
5️⃣ **Exchange Code** – Standard `/as/token` (PKCE or client_secret).

### Required Environment Variables for `pi.flow`
| Variable | Required? | Description |
|-----------|------------|-------------|
| `pi_flow_enabled` | **Required** | Toggle to activate redirect-less logic |
| `username` | **Conditional** | Required for credential steps |
| `password` | **Conditional** | Required for credential steps |
| `mfa_code` | Optional | Only when MFA triggered |
| `pi_flow_resume_url` | **Generated** | From PingOne’s flow step |
| `pi_flow_step` | **Generated** | Tracks step (`authenticate`, `mfa`, etc.) |
| `authorization_code` | **Generated** | Extracted prior to `/as/token` |

> ⚠️ Never log `username`, `password`, or `mfa_code`.

---

## 📋 Variable Matrix (Required vs Optional)

### Common (all flows)
| Variable | Required? | When / Notes | Example |
|-----------|------------|---------------|----------|
| region | **Required** | Derives hostnames | `NA` |
| environmentId | **Required** | All PingOne APIs | `b9817c16-...` |
| authHost | **Required** | Authorization endpoints | `auth.pingone.com` |
| apiHost | Optional | API endpoints | `api.pingone.com` |
| client_id | **Required** | All flows | GUID |
| client_secret | **Conditional** | Required for secret-based methods | *(masked)* |
| redirect_uri | **Conditional** | Required for interactive flows | `https://app/callback` |
| scopes | **Required** | Defines API/OIDC access | `openid profile email` |
| response_type | **Required** | Flow-specific | `code` |
| token_auth_method | **Required** | Defines client auth type | `none` or `client_secret_basic` |
| audience | Optional | Only if API requires | resource URI |

### PKCE
| Variable | Required? | Notes |
|-----------|------------|-------|
| code_verifier | **Generated** | Random 43–128 chars |
| code_challenge | **Generated** | SHA256 of verifier |
| code_method | **Required** | Always `S256` |
| state | **Generated** | Random nonce |

### Redirect-less (`pi.flow`)
| Variable | Required? | When / Notes |
|-----------|------------|--------------|
| pi_flow_enabled | **Required** | Enables redirect-less mode |
| username | **Conditional** | When user credentials needed |
| password | **Conditional** | When user credentials needed |
| mfa_code | Optional | Only when MFA challenge |
| pi_flow_resume_url | **Generated** | Returned by PingOne |
| pi_flow_step | **Generated** | Current flow step |
| authorization_code | **Generated** | Returned before token exchange |

### Client Credentials
| Variable | Required? | Notes |
|-----------|------------|-------|
| audience | Optional | Some APIs require |
| client_secret | **Required** | Always required |

### Device Authorization
| Variable | Required? | Notes |
|-----------|------------|-------|
| device_code | **Generated** | Device flow response |
| user_code | **Generated** | User entry code |
| verification_uri | **Generated** | User-facing URI |
| poll_interval_sec | Optional | Defaults to server value |

### JWT Bearer
| Variable | Required? | Notes |
|-----------|------------|-------|
| iss | **Required** | JWT issuer |
| sub | **Required** | JWT subject |
| aud | **Required** | Token endpoint URL |
| kid | Optional | Key ID |
| private_key | **Required** | For JWT signing |
| assertion_lifetime_sec | Optional | 300–600 default |

### Token Exchange
| Variable | Required? | Notes |
|-----------|------------|-------|
| subject_token | **Required** | Token to exchange |
| subject_token_type | **Required** | e.g. `access_token` |
| actor_token | Optional | Delegation scenario |
| requested_token_type | Optional | Defaults to `access_token` |
| audience | Optional | Target resource |

---

## 🔐 Security Rules
- Mask: `client_secret`, `password`, `private_key`.  
- Never log `username`, `mfa_code`, or tokens.  
- Validate redirect URIs begin with `https://`.  
- PKCE: always auto-generate secure verifier/challenge.  
- For `pi.flow`: block generate unless `username`/`password` are filled when required.

---

*Prepared for: PingOne OAuth Flow Postman Export Builder (with pi.flow & Variable Matrix)*  
*Author: ChatGPT (GPT‑5)*  
*Date: November 05, 2025*
