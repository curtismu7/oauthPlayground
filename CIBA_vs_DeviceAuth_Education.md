# PingOne CIBA vs Device Authorization — Educational Flow

## Overview

This document explains the difference between **CIBA (Client-Initiated Backchannel Authentication)** and **Device Authorization (Device Code Flow)**, focusing on where sessions exist and what devices participate in each flow.

---

## 🔍 Conceptual Comparison

| Aspect | **Device Authorization (RFC 8628)** | **CIBA (OIDC Core Extension)** |
|:--|:--|:--|
| **Who initiates** | Limited UI device (e.g., TV) | Backend or web client |
| **How user authorizes** | User manually enters code on another device | Authorization Server contacts known user device |
| **User linking** | User types verification code | Automatic device binding |
| **Polling** | Device polls `/token` | Client polls `/token` |
| **Session exists where** | On the web browser device | On user’s mobile (PingOne SDK/App) |

---

## 📱 CIBA Session Model

- **Initiating Device (Client)**: Kiosk, TV, or backend app; holds `auth_req_id` only.
- **PingOne Authorization Server**: Maintains CIBA transaction metadata and user binding.
- **User’s Authentication Device (Mobile)**: Holds active PingOne user session (via SDK or PingID app).

---

## 🧩 CIBA Flow Steps

1. **Client → /bc-authorize**  
   Client sends authentication request and receives `auth_req_id`.

2. **PingOne → User’s Mobile Device**  
   PingOne sends a push notification to the user’s registered device.

3. **User Approval**  
   User approves via the PingOne SDK or PingID app (biometric or PIN).

4. **Client Polling**  
   Client polls `/token` using the `auth_req_id` until approval is complete.

---

## 🖼️ Flow Diagram

Below is the diagram showing **CIBA flow** where the **session exists on the mobile device**, not the initiating client.

![CIBA Flow Diagram](A_flowchart_diagram_illustrates_the_CIBA_(Client-I.png)

---

## ✅ Teaching Notes

- Emphasize that CIBA **reverses** the direction of authorization: the **server** contacts the user’s device, not the other way around.
- Always label which device holds the **user session** (mobile).
- Never show a “user code” — that’s specific to the Device Authorization flow.
- The **PingOne Authorization Server** orchestrates the transaction and ensures secure token issuance.

---

© 2025 — Ping Identity Educational Guide for CIBA vs Device Authorization Flow
