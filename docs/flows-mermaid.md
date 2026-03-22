# MasterFlow + Banking Demo — Mermaid Diagrams

---

## 1. System Architecture

```mermaid
graph TB
    subgraph Browser["User Browser"]
        UI["MasterFlow UI\n(React / Vite)"]
        BUI["Banking UI\n(React)"]
    end

    subgraph Playground["OAuth Playground · Vercel"]
        EXP["Express server.js\n/api/* routes"]
        VFN["api/token-exchange.js\n(Vercel Serverless)"]
    end

    subgraph Banking["Banking Demo · Vercel"]
        BAPI["Banking API Server\n(Express / JWT validation)"]
    end

    subgraph MCP["Banking MCP Cluster"]
        BMCP["Banking MCP Server\n(TypeScript · WebSocket)"]
        AGENT["LangChain Agent\n(Python · FastAPI)"]
    end

    subgraph PingOne["PingOne"]
        P1_TOK["Token Endpoint"]
        P1_INT["Introspect Endpoint"]
        P1_AUTH["Authorization Endpoint"]
    end

    UI -->|"OAuth flows via BFF"| EXP
    UI -->|"RFC 8693 token-exchange"| VFN
    EXP -->|"proxied token requests"| P1_TOK
    VFN -->|"token exchange"| P1_TOK

    BUI -->|"banking API calls"| BAPI
    BAPI -->|"validate access token"| P1_INT

    AGENT -->|"Authorization: Bearer {agentToken}"| BMCP
    BMCP -->|"introspect agent token + aud check"| P1_INT
    AGENT -->|"CC token + resource indicator"| P1_TOK
    AGENT -->|"user-delegated auth code"| P1_AUTH
```

---

## 2. MCP Zero-Trust — Agent Token Flow

```mermaid
sequenceDiagram
    participant A as LangChain Agent
    participant P1 as PingOne Token Endpoint
    participant WS as Banking MCP Server
    participant PI as PingOne Introspect

    Note over A,PI: Phase 1 — Narrow CC Token Acquisition
    A->>P1: POST /token<br/>grant_type=client_credentials<br/>resource={MCP_SERVER_RESOURCE_URI}
    P1-->>A: access_token (aud={MCP_SERVER_RESOURCE_URI})

    Note over A,PI: Phase 4 — WebSocket Connect with Token in Header
    A->>WS: WS Upgrade<br/>Authorization: Bearer {agentToken}
    WS->>WS: Extract token from Authorization header<br/>connectionInfo.agentToken = bearerToken

    Note over WS,PI: Phase 3 — aud Claim Validation (opt-in)
    WS->>PI: POST /introspect token={agentToken}
    PI-->>WS: { active: true, aud: "https://mcp.example.com", sub: "agent-client-id" }
    WS->>WS: Check aud matches MCP_SERVER_RESOURCE_URI
    alt aud mismatch
        WS-->>A: 401 INVALID_AGENT_TOKEN
    else aud valid (or env var not set)
        WS-->>A: WS 101 Switching Protocols ✓
    end

    Note over A,WS: Tool call — token stays in header, NOT in params
    A->>WS: {"jsonrpc":"2.0","method":"tools/call",<br/>"params":{"name":"getBalance","arguments":{...}}}
    WS-->>A: {"result": {...}}
```

---

## 3. may_act / act — RFC 8693 Delegation Flow

```mermaid
sequenceDiagram
    participant C as Client App
    participant OPX as OAuth Playground<br/>/api/pingone/token-exchange
    participant P1 as PingOne Token Endpoint

    Note over C,P1: Pre-conditions<br/>subjectToken has may_act: { sub: "actor-client-id" }<br/>actorToken identifies the acting party

    C->>OPX: POST /api/pingone/token-exchange<br/>{ subjectToken, actorToken,<br/>  grant_type: "urn:ietf:params:oauth:grant-type:token-exchange" }

    Note over OPX: Validate delegation rights
    OPX->>OPX: decodeJwtPayload(actorToken) → actorSub
    OPX->>OPX: decodeJwtPayload(subjectToken) → may_act claim
    alt actorSub NOT in may_act.sub
        OPX-->>C: 403 { error: "actor_not_authorized" }
    end

    OPX->>P1: POST /token<br/>grant_type=urn:ietf:params:oauth:grant-type:token-exchange<br/>subject_token={subjectToken}<br/>actor_token={actorToken} (validated)<br/>actor_token_type=urn:ietf:params:oauth:token-type:access_token

    P1-->>OPX: { access_token, token_type, ... }

    Note over OPX: Inject act claim (RFC 8693 §2.2)
    OPX->>OPX: responseData.act = { sub: actorSub }
    OPX-->>C: { access_token, act: { sub: "actor-client-id" }, ... }
```

---

## 4. Banking API — BFF Session Auth Flow

```mermaid
sequenceDiagram
    participant U as User Browser
    participant P1 as PingOne Authorize
    participant OPX as OAuth Playground BFF
    participant BAPI as Banking API Server

    U->>OPX: Initiate Auth (PKCE)
    OPX->>P1: /authorize?code_challenge=...&scope=banking:read
    P1-->>U: Login page
    U->>P1: Credentials
    P1-->>OPX: Authorization Code (redirect)
    OPX->>P1: POST /token  code + code_verifier
    P1-->>OPX: { access_token, refresh_token, id_token }

    Note over OPX: BFF stores tokens server-side<br/>issues opaque session cookie ONLY
    OPX-->>U: Set-Cookie: session=<opaque-id> HttpOnly; Secure; SameSite=Strict

    U->>BAPI: GET /accounts  Cookie: session=<opaque-id>
    BAPI->>BAPI: Resolve session → access_token (server-side)
    BAPI->>P1: POST /introspect token={access_token}
    P1-->>BAPI: { active: true, scope: "banking:read", sub: "user-id" }
    BAPI-->>U: [ account data ]
```

---

## 5. Zero-Trust Env-Var Gates

```mermaid
flowchart TD
    ENV{{"MCP_SERVER_RESOURCE_URI\nset in .env?"}}

    ENV -->|"empty / unset"| SKIP["Skip aud validation\n(backward compat)"]
    ENV -->|"set to URI"| INTROSPECT["Introspect agent token\nwith PingOne"]

    INTROSPECT --> AUD_CHECK{{"token has aud claim?"}}
    AUD_CHECK -->|"no aud"| WARN["Log warning\n(allow through)"]
    AUD_CHECK -->|"aud present"| MATCH{{"aud matches\nresource URI?"}}

    MATCH -->|"match"| ALLOW["✅ Connection allowed"]
    MATCH -->|"mismatch"| DENY["❌ 401 INVALID_AGENT_TOKEN"]

    SKIP --> ALLOW
    WARN --> ALLOW
```
