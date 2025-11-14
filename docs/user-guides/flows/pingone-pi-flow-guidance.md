---
title: PingOne pi.flow Usage Notes
last_updated: 2025-10-29
owner: pingone-integration
---

## Overview

PingOne’s `response_mode=pi.flow` enables *non-redirect* authorization. The authorization server returns the flow payload (auth code/tokens plus flow links) directly to the client with HTTP 200, so apps can render the UI and call Flow APIs without browser redirects. This page captures the requirements we validated while wiring the OAuth Playground to PingOne’s pi.flow implementation.

## Authorization Request Requirements

- **HTTP**: `POST https://auth.pingone.com/{environmentId}/as/authorize`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Required parameters**
  - `response_type=code`
  - `response_mode=pi.flow`
  - `client_id` – worker/hosted login client with Redirectless enabled.
  - `scope` – include `openid`; add others as needed.
  - `state` – caller-generated mitm protection.
  - PKCE strongly recommended: `code_challenge`, `code_challenge_method=S256`.
- **Optional parameters**
  - `redirect_uri` is *not required*. When omitted, PingOne honors the flow response pattern described in the docs (no HTTP redirect).
  - Include it only if you have a specific registered URI to validate against; otherwise leave it out.

```http
POST /{envId}/as/authorize HTTP/1.1
Host: auth.pingone.com
Content-Type: application/x-www-form-urlencoded

response_type=code
&response_mode=pi.flow
&client_id=...your client id...
&scope=openid
&state=pi-flow-<timestamp>
&code_challenge=...
&code_challenge_method=S256
```

## Username/Password Handling

- Do **not** send `username` or `password` in the initial `/as/authorize` call. The whole point of `pi.flow` is that your app renders the end-user UI and then drives the Flow API.
- After the authorize call succeeds, inspect the returned JSON for:
  - `resumeUrl`
  - `_links['usernamePassword.check'].href`
  - `_cookies` (if present; see below)
- Post credentials to the `usernamePassword.check` link using the same cookies the authorize response provided.

```http
POST https://.../flows/v1/environments/{envId}/flows/{flowId}/usernamePassword.check
Content-Type: application/x-www-form-urlencoded
Cookie: AWSELBAuthSessionCookie-0=...; pingone.flow=...

username=<user>
&password=<pass>
```

## Cookie Propagation

- PingOne issues flow cookies in `Set-Cookie` headers on the authorize response.
- Persist them (for example, `data._cookies` in our server proxy) and send them as `Cookie` headers on subsequent Flow API requests (username/password check, MFA selection, etc.).
- Without the cookies, PingOne will treat follow-up calls as out-of-session and return an error.

## Sequence Summary

1. Client POSTs `/as/authorize` with `response_mode=pi.flow` (no redirect URI required).
2. Response body contains flow metadata + Set-Cookie headers.
3. Client submits credentials to `usernamePassword.check` (and any other required flow steps) using those cookies.
4. Upon success, PingOne either issues tokens directly or returns `resumeUrl` to complete the OAuth code exchange on the backend.

## Additional References

- PingOne Platform API → *Redirect and Non-Redirect Authentication Flows* – Non-redirect section shows `response_mode=pi.flow` usage with a flow JSON response.
- PingOne Admin Console → Applications → Experiences → Hosted Login → Redirectless – Verify the client is configured to allow pi.flow (Redirectless) operations.
