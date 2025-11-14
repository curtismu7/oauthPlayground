# RAR (Rich Authorization Requests) for OIDC

**Date:** 2025-10-08  
**Author:** He who talks the most  
**Version:** 1.0.0  

---

## 🔍 Overview

**RAR (Rich Authorization Requests)** is an extension to **OAuth 2.0 and OpenID Connect** that enables clients to express **fine-grained authorization details** beyond simple scope strings.  
It allows the client to describe *what kind of access* is being requested — not just *which resources* — by using structured JSON data called **authorization details**.

While **OAuth scopes** typically convey coarse-grained permissions (e.g., `openid profile email`), **RAR** lets clients describe complex, domain-specific access needs (e.g., “read account #1234 transactions between specific dates”).

---

## ⚙️ How RAR Works in OIDC

RAR defines a new request parameter named **`authorization_details`** that can be included in:
- The **authorization request**
- The **PAR (Pushed Authorization Request)** endpoint  
- Or other OAuth/OIDC request mechanisms

The **authorization_details** parameter is a JSON array of one or more objects describing:
- The **type** of access requested
- The **resources** involved
- The **actions** or operations requested
- Any **constraints** (like time, location, or amount limits)

---

## 🧱 Example Structure

```json
{
  "authorization_details": [
    {
      "type": "payment_initiation",
      "instructedAmount": {
        "currency": "USD",
        "amount": "250.00"
      },
      "creditorName": "ABC Supplies",
      "creditorAccount": {
        "iban": "US12345678901234567890"
      },
      "remittanceInformation": "Invoice #789"
    }
  ]
}
```

In this example, the client asks permission to **initiate a $250 payment** to *ABC Supplies*.  
The authorization server interprets this structured data and may display it to the user in a **human-readable consent screen**.

---

## ✅ Benefits of RAR

| Feature | Without RAR | With RAR |
|----------|--------------|----------|
| Permission granularity | Broad scopes only (e.g., “read/write”) | Fine-grained and contextual |
| Data model | Unstructured strings | Structured JSON objects |
| Security context | Ambiguous | Explicit intent and limits |
| User consent | Generic and unclear | Clear, human-readable purpose |
| Auditing | Difficult | Rich, structured data for logs and audit |

---

## 🧩 Example RAR Flow

### 1️⃣ Client Sends Pushed Authorization Request with RAR
RAR is often used **together with PAR** for maximum security.

```http
POST /as/par HTTP/1.1
Host: auth.pingone.com
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

client_id=rar-client-123
&redirect_uri=https%3A%2F%2Fapp.example.com%2Fcallback
&response_type=code
&scope=openid
&authorization_details=%5B%7B%22type%22%3A%22payment_initiation%22%2C%22instructedAmount%22%3A%7B%22currency%22%3A%22USD%22%2C%22amount%22%3A%22250.00%22%7D%2C%22creditorName%22%3A%22ABC%20Supplies%22%7D%5D
```

### 2️⃣ Authorization Server Responds
```json
{
  "request_uri": "urn:pingone:par:29fsl2lkd0s",
  "expires_in": 90
}
```

### 3️⃣ Client Redirects User’s Browser
```http
GET /as/authorize?client_id=rar-client-123
&request_uri=urn:pingone:par:29fsl2lkd0s
```

### 4️⃣ User Sees Rich Consent Screen
The authorization server displays the details (e.g., “You are authorizing a $250 payment to ABC Supplies”).

---

## 🔐 Integration Notes for PingOne

- **Endpoint:** `https://auth.pingone.com/{environmentId}/as/par`  
- **Parameter:** `authorization_details` (JSON encoded and URL encoded if sent via form)  
- **Authentication:** Client credentials (Basic or private_key_jwt)  
- **Supported With:** OIDC Authorization Code Flow, Hybrid Flow, PAR + PKCE  
- **Enable:** RAR must be supported by your PingOne environment or authorization policy  

---

## 🧠 Summary

RAR provides:
- Fine-grained authorization using **structured JSON**
- Better **security context** and **user transparency**
- Improved **auditability** and **compliance**  
- Seamless integration with **PAR** for enhanced protection  

**Recommended Use:**  
Use RAR whenever you need to express domain-specific or transaction-level details (payments, data sharing, API access) within your OpenID Connect or OAuth flows.

---

**References**
- [RFC 9396 – OAuth 2.0 Rich Authorization Requests (RAR)](https://datatracker.ietf.org/doc/html/rfc9396)
- [RFC 9126 – OAuth 2.0 Pushed Authorization Requests (PAR)](https://datatracker.ietf.org/doc/html/rfc9126)
- [OpenID Connect Core Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [Ping Identity RAR Documentation](https://docs.pingidentity.com/)
