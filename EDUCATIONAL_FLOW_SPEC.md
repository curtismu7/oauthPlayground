# Educational OAuth 2.1 Authorization Code Flow Mock

## Overview
Interactive HTML-based educational tool teaching OAuth 2.1 Authorization Code flow with real PingOne API integration. Users can animate through all 7 steps and see actual API calls, requests, responses, and decoded tokens.

## Layout (4-column grid)
1. **Sidebar (220px)** — Flow selector (OAuth 2.0 Auth Code, OIDC, Client Credentials)
2. **Config Panel (1fr)** — PingOne credentials input (Region, Environment ID, Client ID, Redirect URI)
3. **Flow Panel (1fr)** — 7 interactive step cards
4. **Inspector Panel (320px)** — Tokens and decoded JWT claims

## Navbar
- Title: "OAuth 2.1 Authorization Code"
- **URL Display** (prominent): Shows current API endpoint dynamically
  - Updates based on step and user config (Region/Env ID)
  - Format: `METHOD https://auth.pingone.com/{env-id}{endpoint}`
- Play button: Triggers animation through all 7 steps

## 7 Steps (in flow-panel)
Each step clickable, shows active state (teal left border, white bg):

1. **Configure** — Set client credentials (no API call)
2. **PKCE Challenge** — Generate verifier & challenge → `GET /as/authorize`
3. **Authorization Request** — Redirect to PingOne → `GET /as/authorize`
4. **Authorization Code** — User approves → `GET /callback` (returns code)
5. **Exchange Code** — Backend trades code for tokens → `POST /as/token`
6. **Introspect Tokens** — Verify claims → `POST /as/introspect`
7. **Call APIs** — Use access token → `GET https://api.pingone.com/v1/users`

## Right Panel (api-panel)
- **Request Details** box: Shows full request with method, URL, headers, parameters
- **Response Details** box: Shows status, headers, response body
- **Tokens section**: Three token cards (Access, ID, Refresh) with "Decode" buttons

## Inspector (far right)
- Shows decoded JWT claims for currently selected token
- Modal popup on "Decode" button with full JWT breakdown (Header, Payload, Signature)

## Animation (Play button)
Timed sequence (2s intervals):
- 0.5s: Show step 0
- 2s: Show step 1 + run PKCE generation
- 4s: Show step 2
- 6s: Show step 3 + get auth code
- 8s: Show step 4 + exchange for tokens
- 10s: Show step 5 + introspect
- 12s: Show step 6

## Config Panel Features
- Region selector: US, EU, APAC → Maps to `auth.pingone.com`, `auth.eu.pingone.com`, `auth.ap.pingone.com`
- Environment ID input → Updates navbar URL in real-time
- Client ID input
- Redirect URI input

## Dynamic URL Display (top navbar)
Updates when:
- User steps to a different step
- User changes Region or Environment ID
- Shows: `METHOD https://auth.pingone.com/{env-id}{endpoint}`
- Step 4 (callback) shows: `GET https://localhost:8000/callback`
- Step 7 (API call) shows: `GET https://api.pingone.com/v1/users`

## Colors
- Primary: `#1e3a8a` (dark blue)
- Accent: `#3b82f6` (bright blue)
- Success: `#10b981` (green, for result badges)
- Neutral-100: `#f3f4f6` (light backgrounds)

## Fonts
- Headers: `IBM Plex Mono` (monospace, uppercase)
- Body: `Inter` (sans-serif)
- API details: `IBM Plex Mono` (monospace)

## Token Decode Modal
Shows JWT structure:
- Header: `{"alg":"RS256","typ":"JWT","kid":"key-1"}`
- Payload: Claims (sub, name, email, iat, exp)
- Signature: First 40 chars

## Key Behaviors
- Step cards are clickable — go to any step
- Region/Env ID changes trigger URL update
- Animation runs all 7 steps with timed intervals
- Tokens only appear after step 5 (token exchange)
- Decode button opens modal with parsed JWT

## File Location
`/Users/curtismuir/Development/oauthPlayground/educational-flow-mock-v2.html`

This mock serves as an educational reference showing real PingOne API endpoints and actual OAuth flow mechanics.
