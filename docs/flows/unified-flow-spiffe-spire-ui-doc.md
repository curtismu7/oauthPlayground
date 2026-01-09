# Unified Flow - SPIFFE/SPIRE Flow UI Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-27  
**Audience:** End Users  
**Flow Type:** SPIFFE/SPIRE Mock Flow (Workload Identity to PingOne Token Exchange)

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Understanding the Results](#understanding-the-results)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Overview

The **SPIFFE/SPIRE Flow** is an educational mock flow that demonstrates how workload identity (SPIFFE Verifiable Identity Documents, or SVIDs) can be exchanged for PingOne OAuth/OIDC tokens. This flow shows the integration between SPIFFE/SPIRE workload identity systems and PingOne authentication.

### Key Characteristics

- ✅ **Workload Identity**: Uses SPIFFE IDs to identify workloads
- ✅ **SVID Generation**: Creates X.509 certificates for workload authentication
- ✅ **Token Exchange**: Exchanges SVIDs for OAuth/OIDC tokens (RFC 8693)
- ✅ **Educational**: Demonstrates concepts (not production implementation)
- ✅ **Mock Flow**: Simulates SPIRE agent/server interactions

### When to Use

- Understanding SPIFFE/SPIRE workload identity concepts
- Learning how workload identity integrates with OAuth/OIDC
- Demonstrating token exchange flows
- Educational purposes and proof-of-concept

### Spec Version Support

- ✅ **OAuth 2.0**: Supported (Token Exchange - RFC 8693)
- ✅ **OAuth 2.1**: Supported (Token Exchange)
- ✅ **OIDC**: Supported (ID tokens issued with workload identity)

---

## Getting Started

### Prerequisites

Before using the SPIFFE/SPIRE Flow, ensure you have:

1. **PingOne Account**: Access to PingOne Admin Console
2. **Environment ID**: Your PingOne Environment ID (UUID format)
3. **Understanding of SPIFFE/SPIRE**: Basic knowledge of workload identity concepts

### Accessing the Flow

1. Navigate to the SPIFFE/SPIRE Flow page: `/v8u/spiffe-spire/attest`
2. The flow will automatically load your Environment ID from global storage (if available)
3. Configure your workload attributes
4. Follow the 4-step process

---

## Step-by-Step Guide

### Step 1: Workload Attestation

**Purpose**: Configure your workload's identity attributes for SVID generation.

#### Required Information

1. **Trust Domain** *(Required)*
   - Your SPIFFE trust domain
   - Format: Domain name (e.g., `example.org`, `company.com`)
   - Example: `example.org`
   - **Note**: In production, this is configured in SPIRE Server

2. **Workload Path** *(Required)*
   - Path identifying your workload within the trust domain
   - Format: Path segments separated by `/` (e.g., `frontend/api`, `backend/service`)
   - Example: `frontend/api`
   - **Note**: This forms part of your SPIFFE ID: `spiffe://{trustDomain}/{workloadPath}`

3. **Workload Type** *(Required)*
   - Platform where your workload runs
   - Options:
     - **Kubernetes**: For workloads running in Kubernetes
     - **VM**: For workloads running on virtual machines
     - **Container**: For containerized workloads
   - **Default**: `kubernetes`

4. **Environment ID** *(Required)*
   - Your PingOne Environment ID
   - Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - **Auto-loaded**: Automatically loaded from global storage if available
   - Where to find: PingOne Admin Console → Environments

#### Optional Information (Kubernetes Only)

If you selected **Kubernetes** as your workload type:

5. **Namespace** *(Optional)*
   - Kubernetes namespace where your workload runs
   - Format: Kubernetes namespace name
   - **Default**: `default`
   - Example: `production`, `staging`, `default`

6. **Service Account** *(Optional)*
   - Kubernetes service account name
   - Format: Kubernetes service account name
   - **Default**: Empty
   - Example: `frontend-sa`, `api-service-account`

#### What Happens

When you click **"Generate SVID"**:

1. **Workload Attestation**: SPIRE Agent attests your workload identity
2. **SVID Generation**: SPIRE Server issues an X.509 certificate (SVID)
3. **SPIFFE ID Created**: Your SPIFFE ID is generated: `spiffe://{trustDomain}/{workloadPath}`
4. **Certificate Issued**: X.509 certificate with private key and trust bundle
5. **Auto-Advance**: Automatically proceeds to Step 2 (SVID Issuance)

#### Tips

- 💡 **Trust Domain**: Use your organization's domain name
- 💡 **Workload Path**: Use a hierarchical path (e.g., `team/service/component`)
- 💡 **Kubernetes**: If using Kubernetes, provide namespace and service account for more accurate attestation
- 💡 **Environment ID**: This is shared with other flows - if you've used it before, it will be auto-filled

---

### Step 2: SVID Issuance

**Purpose**: View your issued SPIFFE Verifiable Identity Document (SVID).

#### What You'll See

1. **SPIFFE ID**
   - Your unique workload identity
   - Format: `spiffe://{trustDomain}/{workloadPath}`
   - Example: `spiffe://example.org/frontend/api`
   - **Copy**: Click copy button to copy SPIFFE ID

2. **X.509 Certificate**
   - PEM-encoded X.509 certificate
   - Contains your SPIFFE ID in the subject
   - Signed by SPIRE Server
   - **Copy**: Click copy button to copy certificate

3. **Private Key**
   - PEM-encoded private key
   - Used to prove workload identity
   - ⚠️ **Security**: Keep this secure - never expose in logs or code
   - **Copy**: Click copy button to copy private key

4. **Trust Bundle**
   - PEM-encoded trust bundle certificate
   - Used to validate SVID signatures
   - **Copy**: Click copy button to copy trust bundle

5. **Expiration**
   - ISO 8601 timestamp when SVID expires
   - SVIDs are automatically rotated before expiration
   - Example: `2025-01-27T15:30:00.000Z`

#### Understanding SVIDs

- **Purpose**: Prove workload identity without shared secrets
- **Format**: X.509 certificate (PEM-encoded)
- **Lifetime**: Typically 1 hour (automatically rotated)
- **Security**: Private key never leaves the workload (in production)

#### Educational Content

This step explains:
- What an SVID is and why it's useful
- How SPIFFE IDs are structured
- Certificate format and contents
- Trust bundle purpose

#### Next Steps

- Review your SVID details
- Copy any values you need
- Proceed to Step 3 to validate the SVID

---

### Step 3: SVID Validation

**Purpose**: Validate your SVID against the trust bundle to ensure it's legitimate.

#### What You'll See

1. **Validation Status**
   - Success or error indicator
   - Shows whether SVID is valid

2. **Validation Checks**
   - **Signature Valid**: Certificate signature verified against trust bundle
   - **Not Expired**: Certificate has not expired
   - **SPIFFE ID Matches**: SPIFFE ID matches certificate subject
   - **Chain Valid**: Certificate chain is valid

3. **Validation Details**
   - SPIFFE ID confirmation
   - Expiration information
   - Trust domain verification

#### What Happens When You Click "Validate SVID"

1. **Validation Request**: SVID sent to Token Exchange Service
2. **Signature Check**: Certificate signature verified against trust bundle
3. **Expiration Check**: Certificate expiration verified
4. **ID Verification**: SPIFFE ID matches certificate subject
5. **Chain Validation**: Certificate chain validated
6. **Results Displayed**: All validation checks shown

#### Validation Results

**Success**:
- ✅ All validation checks pass
- ✅ SVID is valid and ready for token exchange
- ✅ "Exchange for PingOne Token" button enabled

**Failure**:
- ❌ One or more validation checks fail
- ❌ Error message displayed
- ❌ Must regenerate SVID or fix configuration

#### Common Issues

**Problem**: "Signature validation failed"
- **Solution**: Regenerate SVID (may be a mock flow issue)
- **Solution**: Check trust bundle is correct

**Problem**: "Certificate expired"
- **Solution**: Regenerate SVID (certificates expire after 1 hour)
- **Solution**: This is normal - SVIDs have short lifetimes

**Problem**: "SPIFFE ID mismatch"
- **Solution**: Check workload configuration matches SVID
- **Solution**: Regenerate SVID with correct configuration

#### Next Steps

- If validation succeeds, proceed to Step 4 (Token Exchange)
- If validation fails, review configuration and regenerate SVID

---

### Step 4: Token Exchange

**Purpose**: Exchange your validated SVID for PingOne OAuth/OIDC tokens.

#### What You'll See

1. **Token Exchange Information**
   - Shows what will be sent to PingOne
   - Displays grant type, subject token type, and scopes

2. **Exchange Button**
   - "Exchange for PingOne Token" button
   - Executes the token exchange

3. **Token Display** (after exchange)
   - **Access Token**: JWT access token
   - **ID Token**: JWT ID token (OIDC)
   - **Token Type**: Always `Bearer`
   - **Expiration**: Token lifetime (typically 3600 seconds)
   - **Scopes**: Granted scopes

#### What Happens When You Click "Exchange for PingOne Token"

1. **Token Exchange Request**: POST to PingOne token endpoint
2. **SVID Authentication**: SVID used as subject token
3. **Token Exchange**: PingOne validates SVID and issues tokens
4. **Token Response**: Access token and ID token received
5. **Token Display**: Tokens displayed with decode/copy options

#### Token Exchange Details

**Endpoint**: `POST https://auth.pingone.com/{environmentId}/as/token`

**Request Body**:
```json
{
  "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
  "subject_token": "{x509Certificate}",
  "subject_token_type": "urn:ietf:params:oauth:token-type:spiffe-svid",
  "scope": "openid profile email",
  "requested_token_type": "urn:ietf:params:oauth:token-type:access_token"
}
```

**Token Exchange Standard**: OAuth 2.0 Token Exchange (RFC 8693)

#### Token Response

**Success Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "openid profile email"
}
```

#### Understanding Tokens

**Access Token**:
- **Purpose**: Access PingOne-protected APIs and resources
- **Format**: JWT (JSON Web Token)
- **Lifetime**: Typically 3600 seconds (1 hour)
- **Claims**: Contains SPIFFE ID as workload identity

**ID Token** (OIDC):
- **Purpose**: Prove workload identity
- **Format**: JWT (JSON Web Token)
- **Lifetime**: Typically 3600 seconds (1 hour)
- **Claims**: Contains SPIFFE ID, workload type, and identity information

#### Token Claims

**Access Token Claims**:
- `sub`: SPIFFE ID (e.g., `spiffe://example.org/frontend/api`)
- `iss`: PingOne issuer
- `aud`: PingOne audience
- `exp`: Expiration timestamp
- `scope`: Granted scopes
- `spiffe_id`: SPIFFE ID (custom claim)
- `workload_identity`: `true` (custom claim)

**ID Token Claims**:
- `sub`: SPIFFE ID
- `iss`: PingOne issuer
- `aud`: Client ID
- `name`: Workload name (derived from SPIFFE ID)
- `spiffe_id`: SPIFFE ID (custom claim)
- `workload_type`: `'service'` (custom claim)

#### Token Actions

- **Copy**: Copy token to clipboard
- **Decode**: View JWT claims (header, payload, signature)
- **Use**: Include in `Authorization: Bearer {token}` header for API calls

#### Educational Content

This step explains:
- OAuth 2.0 Token Exchange (RFC 8693)
- How SPIFFE ID maps to PingOne service account
- Workload identity concepts
- Using tokens for API access

#### Next Steps

- Use access token to call PingOne-protected APIs
- Use ID token for workload authentication
- Tokens can be used until expiration (typically 1 hour)

---

## Understanding the Results

### What You Receive

#### SPIFFE ID

- **Format**: `spiffe://{trustDomain}/{workloadPath}`
- **Purpose**: Unique workload identity
- **Example**: `spiffe://example.org/frontend/api`
- **Use**: Identifies your workload in SPIFFE/SPIRE systems

#### SVID (SPIFFE Verifiable Identity Document)

- **Format**: X.509 certificate (PEM-encoded)
- **Components**: Certificate, private key, trust bundle
- **Lifetime**: Typically 1 hour (automatically rotated)
- **Purpose**: Prove workload identity without shared secrets

#### Access Token

- **Purpose**: Access PingOne-protected APIs
- **Lifetime**: Typically 3600 seconds (1 hour)
- **Format**: JWT
- **Claims**: Contains SPIFFE ID as workload identity

#### ID Token

- **Purpose**: Prove workload identity (OIDC)
- **Lifetime**: Typically 3600 seconds (1 hour)
- **Format**: JWT
- **Claims**: Contains SPIFFE ID, workload type, and identity information

### Token Expiration

- Access tokens typically expire in **3600 seconds (1 hour)**
- ID tokens typically expire in **3600 seconds (1 hour)**
- When tokens expire, you must:
  1. Re-validate SVID (if still valid)
  2. Exchange SVID for new tokens
  3. Use new tokens for API calls

### Workload Identity

- Tokens contain your SPIFFE ID as the subject (`sub` claim)
- Custom claims include `spiffe_id`, `workload_identity`, and `workload_type`
- This allows APIs to identify which workload is making requests

---

## Troubleshooting

### Common Issues

#### "Missing required data for token exchange"

**Problem**: Error when trying to exchange SVID for tokens.

**Solutions**:
1. Ensure SVID was generated successfully (Step 2)
2. Ensure SVID was validated successfully (Step 3)
3. Check that Environment ID is set
4. Try regenerating SVID and re-validating

#### "SVID validation failed"

**Problem**: SVID validation fails in Step 3.

**Solutions**:
1. Regenerate SVID (may be expired or invalid)
2. Check workload configuration matches SVID
3. Verify trust bundle is correct
4. This is a mock flow - validation is simulated

#### "Token exchange failed"

**Problem**: Error when exchanging SVID for PingOne tokens.

**Solutions**:
1. Check Environment ID is correct
2. Ensure SVID is valid (Step 3 passed)
3. Verify PingOne configuration
4. This is a mock flow - token exchange is simulated

#### "Environment ID not found"

**Problem**: Environment ID field is empty.

**Solutions**:
1. Enter Environment ID manually
2. Check if Environment ID is saved in global storage
3. Use Environment ID from PingOne Admin Console
4. Format: UUID (e.g., `12345678-1234-1234-1234-123456789012`)

#### "Workload configuration invalid"

**Problem**: Cannot generate SVID due to invalid configuration.

**Solutions**:
1. Check all required fields are filled
2. Verify trust domain format (domain name)
3. Verify workload path format (path segments)
4. Ensure workload type is selected

---

## FAQ

### General Questions

**Q: What is SPIFFE/SPIRE?**  
A: SPIFFE (Secure Production Identity Framework for Everyone) is a set of standards for workload identity. SPIRE (SPIFFE Runtime Environment) is a production implementation that issues and manages identities.

**Q: Is this a production flow?**  
A: No, this is an educational mock flow that demonstrates concepts. Production implementations would use real SPIRE agents and servers.

**Q: Can I use this in production?**  
A: No, this is for educational purposes only. Use real SPIRE agents and servers for production workloads.

**Q: What is an SVID?**  
A: SVID (SPIFFE Verifiable Identity Document) is an X.509 certificate that proves workload identity. It contains a SPIFFE ID and is signed by SPIRE Server.

**Q: What is a SPIFFE ID?**  
A: A SPIFFE ID is a unique identifier for a workload, formatted as `spiffe://{trustDomain}/{workloadPath}`.

### Technical Questions

**Q: How does token exchange work?**  
A: Token exchange (RFC 8693) allows you to exchange one token type (SVID) for another (OAuth tokens). The SVID is used as a subject token to obtain OAuth access and ID tokens.

**Q: What is the trust bundle?**  
A: The trust bundle is a certificate that validates SVID signatures. It's issued by SPIRE Server and used to verify that SVIDs are legitimate.

**Q: How long do SVIDs last?**  
A: SVIDs typically expire after 1 hour and are automatically rotated by SPIRE before expiration.

**Q: How long do tokens last?**  
A: Access and ID tokens typically expire after 1 hour (3600 seconds). You must exchange a new SVID for new tokens when they expire.

**Q: What scopes are requested?**  
A: The flow requests `openid profile email` scopes, which are standard OIDC scopes.

### Security Questions

**Q: Is it safe to copy the private key?**  
A: In this mock flow, yes (it's simulated). In production, private keys should never be copied or exposed - they stay on the workload.

**Q: Are SVIDs stored?**  
A: In this mock flow, SVIDs are not persisted (only in component state). In production, SVIDs are stored securely on the workload.

**Q: Are tokens stored?**  
A: In this mock flow, tokens are passed via navigation state (not persisted). In production, tokens should be stored securely.

**Q: Can I use this for real authentication?**  
A: No, this is a mock flow for educational purposes. Use real SPIRE and PingOne integrations for production.

---

## Additional Resources

- [SPIFFE Specification](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/)
- [SPIRE Documentation](https://spiffe.io/docs/latest/spire-about/)
- [RFC 8693 - OAuth 2.0 Token Exchange](https://tools.ietf.org/html/rfc8693)
- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/main/v1/api/)
- [PingOne Postman Collections](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)
- [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template)
- [SPIFFE/SPIRE PingOne Integration Guide](/docs/spiffe-spire-pingone)

---

## Downloading API Documentation

If the documentation page is implemented, it provides three download options:

### 1. Download as Markdown

- **Format**: Markdown (.md) file
- **Content**: Complete API documentation with all API calls, request/response examples, and notes
- **Use Case**: Documentation, sharing with team, version control

### 2. Download as PDF

- **Format**: PDF file
- **Content**: Same as Markdown, formatted for printing
- **Use Case**: Printing, offline reference, formal documentation

### 3. Download Postman Collection

- **Format**: Postman Collection JSON file
- **Content**: Complete Postman collection with all API calls from the flow
- **Use Case**: Import into Postman for testing, API exploration, team sharing

#### Postman Collection Features

The generated Postman collection includes:

- **All API Calls**: Every API call made during the flow
- **Pre-configured Variables**: 
  - `authPath`: `https://auth.pingone.com` (includes protocol)
  - `envID`: Your environment ID (pre-filled from credentials)
  - `workerToken`: Empty (fill in after obtaining token)
- **URL Format**: Matches PingOne documentation format: `{{authPath}}/{{envID}}/as/token`
- **Headers**: Automatically configured (Content-Type, Authorization)
- **Request Bodies**: Pre-filled with example data

#### Using the Postman Collection

1. **Download**: Click "Download Postman Collection" button. This downloads two files:
    -   **Collection file** (`*-collection.json`) - Contains all API requests
    -   **Environment file** (`*-environment.json`) - Contains all variables with pre-filled values
2. **Import Collection**: Open Postman → Import → Select the collection file (`*-collection.json`)
3. **Import Environment**: Open Postman → Import → Select the environment file (`*-environment.json`)
4. **Select Environment**: In Postman, select the imported environment from the dropdown (top right)
5. **Update Variables**: Edit environment variables with your actual values:
    -   `envID` is pre-filled from your flow credentials
    -   `workerToken` will be empty; fill in after obtaining a worker token
    -   Other variables have default values
6. **Test**: Run requests directly in Postman. All variables are automatically substituted from the environment.

**Reference**: [PingOne Postman Collections Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-collections)

---

## Support

If you encounter issues not covered in this documentation:

1. Check the **Troubleshooting** section above
2. Review SPIFFE/SPIRE documentation
3. Check browser console for error messages
4. Verify all prerequisites are met
5. Remember this is a mock flow for educational purposes
