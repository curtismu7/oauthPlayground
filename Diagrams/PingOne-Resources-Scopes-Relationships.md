# PingOne SSO: Resources, Scopes, Applications & Custom Attributes Relationship

## Visual Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PINGONE ENVIRONMENT                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         APPLICATIONS                                │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │    │
│  │  │  Mobile App      │  │  Web Dashboard   │  │  Admin Portal   │  │    │
│  │  │  ──────────────  │  │  ──────────────  │  │  ─────────────  │  │    │
│  │  │  Client ID: abc  │  │  Client ID: def  │  │  Client ID: ghi │  │    │
│  │  │  Client Secret   │  │  Client Secret   │  │  Client Secret  │  │    │
│  │  │                  │  │                  │  │                 │  │    │
│  │  │  Requests:       │  │  Requests:       │  │  Requests:      │  │    │
│  │  │  • openid        │  │  • openid        │  │  • openid       │  │    │
│  │  │  • read:orders   │  │  • read:products │  │  • write:*      │  │    │
│  │  │  • create:orders │  │  • read:orders   │  │  • manage:*     │  │    │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘  │    │
│  │           │                     │                     │            │    │
│  │           └─────────────────────┼─────────────────────┘            │    │
│  │                                 │                                  │    │
│  └─────────────────────────────────┼──────────────────────────────────┘    │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    AUTHORIZATION SERVER                             │   │
│  │                                                                      │   │
│  │  1. Validates client credentials                                    │   │
│  │  2. Authenticates user                                              │   │
│  │  3. Checks requested scopes against allowed scopes                  │   │
│  │  4. Issues tokens with approved scopes                              │   │
│  │  5. Includes custom attributes in tokens                            │   │
│  └──────────────────────────────┬───────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          RESOURCES                                   │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │  Resource 1: Product Catalog API                           │    │   │
│  │  │  ─────────────────────────────────────────────────────────  │    │   │
│  │  │  Audience: https://api.example.com/products                │    │   │
│  │  │  Token Lifetime: 3600 seconds                              │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  SCOPES (Permissions)                               │  │    │   │
│  │  │  │  ───────────────────────────────────────────────    │  │    │   │
│  │  │  │  • read:products    - Browse product listings       │  │    │   │
│  │  │  │  • write:products   - Create/edit products (admin)  │  │    │   │
│  │  │  │  • manage:inventory - Update stock levels           │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  CUSTOM ATTRIBUTES (Claims in Access Token)         │  │    │   │
│  │  │  │  ───────────────────────────────────────────────    │  │    │   │
│  │  │  │  • tenant_id        → ${user.tenantId}              │  │    │   │
│  │  │  │  • store_region     → ${user.storeRegion}           │  │    │   │
│  │  │  │  • catalog_level    → ${user.catalogAccessLevel}    │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │  Resource 2: Order Management API                          │    │   │
│  │  │  ─────────────────────────────────────────────────────────  │    │   │
│  │  │  Audience: https://api.example.com/orders                  │    │   │
│  │  │  Token Lifetime: 1800 seconds                              │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  SCOPES (Permissions)                               │  │    │   │
│  │  │  │  ───────────────────────────────────────────────    │  │    │   │
│  │  │  │  • read:orders      - View order history            │  │    │   │
│  │  │  │  • create:orders    - Place new orders              │  │    │   │
│  │  │  │  • cancel:orders    - Cancel pending orders         │  │    │   │
│  │  │  │  • refund:orders    - Process refunds (admin)       │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  CUSTOM ATTRIBUTES (Claims in Access Token)         │  │    │   │
│  │  │  │  ───────────────────────────────────────────────    │  │    │   │
│  │  │  │  • customer_tier    → ${user.customerTier}          │  │    │   │
│  │  │  │  • max_order_value  → ${user.maxOrderValue}         │  │    │   │
│  │  │  │  • region           → ${user.region}                │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │  Resource 3: PingOne API (Built-in)                        │    │   │
│  │  │  ─────────────────────────────────────────────────────────  │    │   │
│  │  │  Audience: https://api.pingone.com                         │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │  SCOPES (PingOne Platform Access)                  │  │    │   │
│  │  │  │  ───────────────────────────────────────────────    │  │    │   │
│  │  │  │  • p1:read:user         - Read user data            │  │    │   │
│  │  │  │  • p1:update:user       - Update user data          │  │    │   │
│  │  │  │  • p1:create:resource   - Create resources          │  │    │   │
│  │  │  │  • p1:read:sessions     - Read session data         │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         USER DIRECTORY                                │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  User: john.doe@example.com                                    │  │   │
│  │  │  ──────────────────────────────────────────────────────────    │  │   │
│  │  │  Standard Attributes:                                          │  │   │
│  │  │  • email: john.doe@example.com                                 │  │   │
│  │  │  • name: John Doe                                              │  │   │
│  │  │  • sub: user-123-456                                           │  │   │
│  │  │                                                                 │  │   │
│  │  │  Custom User Attributes (Source for Custom Claims):            │  │   │
│  │  │  • tenantId: "acme-corp"                                       │  │   │
│  │  │  • storeRegion: "US-WEST"                                      │  │   │
│  │  │  • catalogAccessLevel: "full"                                  │  │   │
│  │  │  • customerTier: "gold"                                        │  │   │
│  │  │  • maxOrderValue: 10000                                        │  │   │
│  │  │  • region: "US-WEST"                                           │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## OAuth 2.0 Flow with Resources & Scopes

```
┌──────────────┐                                    ┌──────────────────────┐
│              │  1. Authorization Request          │                      │
│  Mobile App  │───────────────────────────────────>│  PingOne Auth Server │
│              │    with scopes:                    │                      │
│              │    • openid                        │                      │
│              │    • read:orders                   │  2. User Login &     │
│              │    • create:orders                 │     Consent          │
│              │                                    │                      │
│              │  3. Authorization Code             │  3. Check scopes     │
│              │<───────────────────────────────────│     against          │
│              │                                    │     resources        │
│              │                                    │                      │
│              │  4. Token Request                  │                      │
│              │───────────────────────────────────>│                      │
│              │    • code                          │  4. Validate &       │
│              │    • client_id                     │     Issue Tokens     │
│              │    • client_secret                 │                      │
│              │                                    │                      │
│              │  5. Tokens Response                │                      │
│              │<───────────────────────────────────│                      │
└──────────────┘                                    └──────────────────────┘
```

## Token Structure with Custom Attributes

### ID Token (User Identity)
```json
{
  "sub": "user-123-456",
  "email": "john.doe@example.com",
  "name": "John Doe",
  "iss": "https://auth.pingone.com/env-id",
  "aud": "mobile-app-client-id",
  "exp": 1700000000,
  "iat": 1699996400
}
```

### Access Token for Product Catalog API
```json
{
  "sub": "user-123-456",
  "aud": "https://api.example.com/products",
  "scope": "read:products",
  "tenant_id": "acme-corp",           // ← Custom Attribute
  "store_region": "US-WEST",          // ← Custom Attribute
  "catalog_level": "full",            // ← Custom Attribute
  "iss": "https://auth.pingone.com/env-id",
  "exp": 1700000000,
  "iat": 1699996400
}
```

### Access Token for Order Management API
```json
{
  "sub": "user-123-456",
  "aud": "https://api.example.com/orders",
  "scope": "read:orders create:orders",
  "customer_tier": "gold",            // ← Custom Attribute
  "max_order_value": 10000,           // ← Custom Attribute
  "region": "US-WEST",                // ← Custom Attribute
  "iss": "https://auth.pingone.com/env-id",
  "exp": 1699998200,
  "iat": 1699996400
}
```

## Relationship Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION PHASE                              │
└─────────────────────────────────────────────────────────────────────┘

1. CREATE RESOURCES
   └─> Define API resources with unique audiences
       └─> Product Catalog API: https://api.example.com/products
       └─> Order Management API: https://api.example.com/orders

2. ADD SCOPES TO RESOURCES
   └─> Product Catalog API
       └─> read:products
       └─> write:products
       └─> manage:inventory
   └─> Order Management API
       └─> read:orders
       └─> create:orders
       └─> cancel:orders
       └─> refund:orders

3. ADD CUSTOM ATTRIBUTES TO RESOURCES
   └─> Product Catalog API
       └─> tenant_id → ${user.tenantId}
       └─> store_region → ${user.storeRegion}
   └─> Order Management API
       └─> customer_tier → ${user.customerTier}
       └─> max_order_value → ${user.maxOrderValue}

4. CONFIGURE APPLICATIONS
   └─> Mobile App
       └─> Grant access to scopes:
           • openid
           • read:orders
           • create:orders
   └─> Admin Portal
       └─> Grant access to scopes:
           • openid
           • write:products
           • manage:inventory
           • refund:orders

5. SET USER ATTRIBUTES
   └─> User: john.doe@example.com
       └─> tenantId: "acme-corp"
       └─> storeRegion: "US-WEST"
       └─> customerTier: "gold"
       └─> maxOrderValue: 10000

┌─────────────────────────────────────────────────────────────────────┐
│                    RUNTIME PHASE                                    │
└─────────────────────────────────────────────────────────────────────┘

1. APPLICATION REQUESTS AUTHORIZATION
   └─> Mobile App requests: openid, read:orders, create:orders

2. USER AUTHENTICATES & CONSENTS
   └─> User logs in
   └─> User sees consent screen showing requested permissions

3. AUTHORIZATION SERVER VALIDATES
   └─> Check if Mobile App is allowed to request these scopes
   └─> Check if scopes exist in configured resources
   └─> Check if user has necessary attributes

4. TOKENS ISSUED
   └─> ID Token: User identity (email, name, sub)
   └─> Access Token for Orders API:
       • aud: https://api.example.com/orders
       • scope: read:orders create:orders
       • Custom claims: customer_tier, max_order_value, region

5. APPLICATION CALLS API
   └─> Mobile App → Order Management API
       └─> Authorization: Bearer <access_token>
       └─> API validates:
           • Token signature
           • Token expiration
           • Audience matches (aud claim)
           • Required scopes present
           • Custom attributes for business logic
```

## Key Relationships

### 1. Application → Scopes
- Applications request specific scopes during authorization
- Applications must be granted permission to request scopes
- Users consent to scopes during authorization

### 2. Scopes → Resources
- Scopes belong to specific resources
- Each scope represents a permission within that resource
- Scopes appear in access tokens for that resource

### 3. Resources → Custom Attributes
- Resources define custom attributes to include in access tokens
- Attributes map to user properties: `${user.fieldName}`
- Attributes appear as claims in access tokens

### 4. User Attributes → Custom Claims
- User directory stores custom attributes
- Custom attributes are mapped to token claims via resources
- Claims provide context without additional API calls

### 5. Access Token → API
- Access token contains audience (aud) matching resource
- Access token contains approved scopes
- Access token contains custom attributes as claims
- API validates token and uses claims for authorization

## Real-World Example: E-Commerce Platform

```
┌─────────────────────────────────────────────────────────────────────┐
│  SCENARIO: Customer places an order via mobile app                  │
└─────────────────────────────────────────────────────────────────────┘

1. Mobile App Configuration
   ├─> Allowed Scopes:
   │   • openid
   │   • read:products
   │   • read:orders
   │   • create:orders
   └─> Redirect URI: myapp://callback

2. User: jane@example.com
   ├─> Standard Attributes:
   │   • email: jane@example.com
   │   • name: Jane Customer
   └─> Custom Attributes:
       • tenantId: "acme-corp"
       • customerTier: "gold"
       • maxOrderValue: 50000
       • region: "US-EAST"

3. Authorization Flow
   ├─> User logs in via mobile app
   ├─> App requests: openid, read:products, read:orders, create:orders
   ├─> User consents
   └─> PingOne issues tokens

4. ID Token Received
   {
     "sub": "user-789",
     "email": "jane@example.com",
     "name": "Jane Customer"
   }

5. Access Token for Product Catalog API
   {
     "aud": "https://api.acme-shop.com/products",
     "scope": "read:products",
     "tenant_id": "acme-corp",
     "store_region": "US-EAST",
     "catalog_level": "premium"
   }

6. Access Token for Order Management API
   {
     "aud": "https://api.acme-shop.com/orders",
     "scope": "read:orders create:orders",
     "customer_tier": "gold",
     "max_order_value": 50000,
     "region": "US-EAST"
   }

7. Mobile App Calls APIs
   ├─> GET /products → Uses Product Catalog token
   │   └─> API sees tenant_id="acme-corp", shows relevant products
   │   └─> API sees catalog_level="premium", shows premium features
   │
   └─> POST /orders → Uses Order Management token
       └─> API sees customer_tier="gold", applies 15% discount
       └─> API sees max_order_value=50000, allows $45k order
       └─> API sees region="US-EAST", calculates shipping

8. Result
   └─> Order placed successfully with:
       • Gold tier discount applied
       • No additional API calls needed for user context
       • All authorization decisions made from token claims
```

## Benefits of This Architecture

### 1. Security
- ✅ Principle of least privilege (apps only get needed scopes)
- ✅ Token audience prevents token misuse across APIs
- ✅ Short-lived tokens reduce risk window
- ✅ Scopes provide granular permission control

### 2. Performance
- ✅ Custom attributes eliminate extra database queries
- ✅ APIs can make decisions from token alone
- ✅ No need to call PingOne for every request
- ✅ Reduced latency and improved scalability

### 3. Flexibility
- ✅ Different apps can request different scopes
- ✅ Resources can have different token lifetimes
- ✅ Custom attributes tailored per resource
- ✅ Easy to add new resources and scopes

### 4. Compliance
- ✅ Clear audit trail of permissions
- ✅ User consent for data access
- ✅ Separation of concerns (identity vs authorization)
- ✅ Standards-based (OAuth 2.0, OIDC)

---

**Created:** 2024-11-20  
**Version:** 1.0  
**Purpose:** Educational reference for PingOne SSO architecture
