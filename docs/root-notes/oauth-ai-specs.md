# OAuth for AI — Specification & PingOne Compatibility Matrix

**Last updated:** 2025-11-05

---

## 🧠 Overview
This document summarizes the current state of **OAuth specifications relevant to AI and agentic systems**, and identifies which are **publicly supported** in **PingOne**, which can be **simulated**, and which are **not yet supported**.

All data here is based **only on publicly available Ping Identity documentation** and **IETF RFCs/drafts**, not on internal or speculative information.

---

## 📘 Reference Table — Key OAuth Specs for AI

| **Spec / Draft** | **RFC / Draft ID** | **Purpose for AI / Agents** | **Status (IETF)** |
|------------------|--------------------|------------------------------|------------------|
| OAuth 2.1 Core | RFC 6749 + updates | Modernized OAuth baseline (PKCE, redirect URI, best practices) | ✅ Final |
| JWT Bearer Assertion | RFC 7523 | Key-based service auth without client secrets | ✅ Final |
| Token Exchange | RFC 8693 | Delegation and impersonation between agents | ✅ Final |
| Rich Authorization Requests (RAR) | RFC 9396 | Structured, machine-readable authorization objects | ✅ Final |
| Pushed Authorization Requests (PAR) | RFC 9126 | Secure pre-submission of authorization requests | ✅ Final |
| JWT-Secured Authorization Requests (JAR) | RFC 9101 | Signed JWT request objects for integrity | ✅ Final |
| DPoP (Proof of Possession) | RFC 9449 | Token key-binding (per agent instance) | ✅ Final |
| Step-Up Authentication Challenge | RFC 9470 | Contextual step-up for dynamic reauthentication | ✅ Final |
| GNAP (Grant Negotiation and Authorization Protocol) | draft-ietf-gnap-core-protocol | Next-generation dynamic delegation model | 🧪 Draft |
| Attestation-Based Client Authentication | draft-ietf-oauth-attestation-based-client-auth | Hardware/runtime-bound client attestation | 🧪 Draft |
| Attestation-Based Token Binding | draft-ietf-oauth-attestation-based-token-binding | Token binding via enclave proofs | 🧪 Draft |
| Identity Federation for AI | emerging | Cross-organization AI and model federation | 🧩 Proposed |

---

## 🔍 PingOne Compatibility Matrix (Publicly Verified)

| **Spec / Feature** | **PingOne Public Status** | **How to Implement or Simulate** | **AI Use Case** |
|--------------------|---------------------------|----------------------------------|-----------------|
| **OAuth 2.1 Core** | ✅ Supported | Default for all PingOne OAuth/OIDC apps | Baseline for secure token issuance |
| **JWT Bearer (RFC 7523)** | ✅ Supported | Worker Apps using JWT assertion with `client_credentials` grant | Service-to-service or AI agent authentication |
| **PAR (RFC 9126)** | ✅ Supported | `/as/par` endpoint available in PingOne Auth API | Redirect-less secure authorization |
| **RAR (RFC 9396)** | ✅ Supported | Configurable via PingOne Authorize / SSO | Fine-grained AI task and context-specific consent |
| **Step-Up Authentication (RFC 9470)** | ✅ Supported | PingOne Protect adaptive MFA and policies | Human-in-loop decisioning for AI actions |
| **Token Exchange (RFC 8693)** | ❌ Not Supported | Simulate using Worker tokens and introspection | Delegation chain between AI agents |
| **DPoP (RFC 9449)** | ❌ Not Supported | Simulate via mTLS or key-bound claims | Proof-of-possession for model endpoints |
| **JAR (RFC 9101)** | 🔸 Partial via PAR | JAR semantics implied through signed PAR requests | Secure request integrity for AI-to-AI auth |
| **GNAP (draft)** | ❌ Not Supported | Simulate via PAR + RAR + DaVinci orchestration | Dynamic multi-agent negotiation |
| **Attestation Auth / Binding** | ❌ Not Supported | Simulate via mTLS + PingOne Protect | Trusted AI agent provenance |
| **AI Federation (draft)** | ❌ Not Supported | Not available in PingOne | Cross-tenant AI orchestration |

---

## 🧩 PingOne Components Relevant to AI

| **Component** | **Relevant OAuth Capabilities** | **AI-Oriented Use Case** |
|----------------|----------------------------------|--------------------------|
| **PingOne SSO** | OAuth 2.1, PKCE, PAR, RAR, JWT Bearer | Secure multi-agent login orchestration |
| **PingOne Protect** | Step-Up (RFC 9470), risk policies | Adaptive MFA for agent-triggered actions |
| **PingOne DaVinci** | Visual flow orchestration | Simulate GNAP-style dynamic authorization |
| **PingOne Authorize** | Policy and RAR enforcement | Structured consent for AI actions |
| **Worker Apps** | JWT Bearer and Client Credentials | Non-interactive agent/service identity |
| **PingOne APIs** | Full PAR/RAR endpoint compliance | Redirect-less AI integration |

---

## ✅ Summary
PingOne provides most foundational OAuth capabilities for **AI-ready orchestration**, including:
- **JWT Bearer (RFC 7523)** for agent-based key authentication  
- **PAR (RFC 9126)** and **RAR (RFC 9396)** for structured, redirect-less authorization  
- **Step-Up (RFC 9470)** via PingOne Protect for adaptive security

Features such as **Token Exchange**, **DPoP**, and **GNAP** are **not publicly supported**, but can be **safely simulated** using **Worker tokens**, **RAR/PAR**, and **PingOne DaVinci** for prototype AI authorization chains.

---

*Prepared for: PingOne AI & OAuth Interoperability Overview*  
*Author: ChatGPT (GPT‑5)*  
*Date: November 05, 2025*

---

## 📚 References (RFCs & Drafts)

- **OAuth 2.0 Authorization Framework** — RFC 6749: https://www.rfc-editor.org/rfc/rfc6749  
- **OAuth 2.0 Authorization Server Metadata** — RFC 8414: https://www.rfc-editor.org/rfc/rfc8414  
- **OAuth 2.0 for Native Apps** — RFC 8252: https://www.rfc-editor.org/rfc/rfc8252  
- **OAuth 2.0 PKCE** — RFC 7636: https://www.rfc-editor.org/rfc/rfc7636  
- **OAuth 2.0 Mutual-TLS Client Authentication** — RFC 8705: https://www.rfc-editor.org/rfc/rfc8705  
- **OAuth 2.0 Authorization Server Issuer Identification** — RFC 9207: https://www.rfc-editor.org/rfc/rfc9207  

- **JWT Bearer Token / Assertion** — RFC 7523: https://www.rfc-editor.org/rfc/rfc7523  
- **Token Exchange** — RFC 8693: https://www.rfc-editor.org/rfc/rfc8693  
- **Rich Authorization Requests (RAR)** — RFC 9396: https://www.rfc-editor.org/rfc/rfc9396  
- **JWT-Secured Authorization Request (JAR)** — RFC 9101: https://www.rfc-editor.org/rfc/rfc9101  
- **Pushed Authorization Requests (PAR)** — RFC 9126: https://www.rfc-editor.org/rfc/rfc9126  
- **Demonstrating Proof-of-Possession (DPoP)** — RFC 9449: https://www.rfc-editor.org/rfc/rfc9449  
- **OAuth 2.0 Step-up Authentication Challenge** — RFC 9470: https://www.rfc-editor.org/rfc/rfc9470  

- **GNAP Core Protocol (draft-ietf-gnap-core-protocol)**: https://datatracker.ietf.org/doc/draft-ietf-gnap-core-protocol/  
- **GNAP Resource Servers (draft-ietf-gnap-resource-servers)**: https://datatracker.ietf.org/doc/draft-ietf-gnap-resource-servers/  

- **Attestation-Based Client Authentication (draft-ietf-oauth-attestation-based-client-auth)**: https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-client-auth/  
- **Attestation-Based Token Binding (draft-ietf-oauth-attestation-based-token-binding)**: https://datatracker.ietf.org/doc/draft-ietf-oauth-attestation-based-token-binding/  

> *“Identity Federation for AI” is an emerging area without a single canonical draft; monitor the OAuth WG and GNAP WG for new documents.*

**Last updated:** 2025-11-05 11:29:04
