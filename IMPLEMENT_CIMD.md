IMPLEMENT_CIMD.md

# Implementation Guide: CIMD for PingOne SSO

## 1. Executive Summary
We are implementing **Client ID Metadata Document (CIMD)** support (per MCP SEP-991) using **PingOne SSO** as the backing Identity Provider. 

Since PingOne SSO does not natively resolve URL-based `client_id`s, we are building a **Sidecar Registration Bridge**. This bridge fetches metadata from an HTTPS URL and uses the PingOne Management API to dynamically provision a corresponding OIDC application.

---

## 2. Technical Architecture
### The "Worker App" Registrar
- **App Type**: Worker Application (PingOne SSO)
- **Role Required**: `Application Configurator` or `Environment Admin`
- **Responsibility**: Authenticates via `client_credentials` to obtain an **Initial Access Token (IAT)** used to call the `/applications` Management API.

### Logic Flow
1. **Request**: App receives a CIMD URL (e.g., `https://client.com`).
2. **Lookup**: Check local `CIMD_Mappings` table. If exists, return `pingone_client_id`.
3. **Fetch**: If new, GET the JSON from the URL. Validate `client_id` matches the URL.
4. **Bridge**: Worker App calls PingOne POST `/applications` with metadata.
5. **Store**: Save the new PingOne UUID against the original URL.

---

## 3. TypeScript Implementation (Bridge)

```typescript
import axios from 'axios';
import { z } from 'zod';

// Schema for MCP/CIMD Validation
const CIMD_SCHEMA = z.object({
  client_id: z.string().url(),
  client_name: z.string(),
  redirect_uris: z.array(z.string().url()),
  grant_types: z.array(z.string()).optional().default(['authorization_code']),
});

export class PingOneCIMDBridge {
  constructor(
    private envId: string,
    private workerId: string,
    private workerSecret: string,
    private region: string = 'com'
  ) {}

  async getIAT(): Promise<string> {
    const url = `https://auth.pingone.${this.region}/${this.envId}/as/token`;
    const params = new URLSearchParams({ grant_type: 'client_credentials' });
    const { data } = await axios.post(url, params, {
      auth: { username: this.workerId, password: this.workerSecret }
    });
    return data.access_token;
  }

  async provisionApp(cimdUrl: string) {
    const { data: rawJson } = await axios.get(cimdUrl);
    const metadata = CIMD_SCHEMA.parse(rawJson);

    if (metadata.client_id !== cimdUrl) throw new Error("ID Mismatch");

    const iat = await this.getIAT();
    const p1Url = `https://api.pingone.${this.region}/v1/environments/${this.envId}/applications`;
    
    const { data: p1App } = await axios.post(p1Url, {
      name: metadata.client_name,
      type: 'WEB_APP',
      protocol: 'OPENID_CONNECT',
      enabled: true,
      configuration: {
        redirectUris: metadata.redirect_uris,
        grantTypes: metadata.grant_types.map(g => g.toUpperCase()),
        tokenEndpointAuthMethod: 'NONE'
      }
    }, {
      headers: { Authorization: `Bearer ${iat}` }
    });

    return p1App.id; // The UUID PingOne uses
  }
}
4. Database Schema (Prisma/SQL)
To avoid redundant registrations, maintain a mapping table:
sql
CREATE TABLE CIMD_Mappings (
    id SERIAL PRIMARY KEY,
    cimd_url VARCHAR(255) UNIQUE NOT NULL,
    pingone_app_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
Use code with caution.

5. Educational Documentation (For Users)
What is CIMD?
Instead of manually registering your application with us to get a random ID, you can use your app's HTTPS URL as its identity.
Why we use it
No Waiting: Connect your app instantly without manual admin approval.
Domain Trust: We verify your identity by fetching metadata directly from your domain via secure HTTPS.
Standardized: This follows the Model Context Protocol (MCP) standard for modern AI-driven applications.
6. Cursor Context Prompts
Generate Bridge: "Use the @PingOneCIMDBridge code in @IMPLEMENT_CIMD.md to create a production-ready service with retry logic."
Generate Docs: "Create a React-based documentation page using the 'Educational Documentation' section from @IMPLEMENT_CIMD.md." 

### Next Steps for Cursor
Once saved, you can use **`@IMPLEMENT_CIMD.md`** as context in any chat to tell Cursor exactly what to do.









