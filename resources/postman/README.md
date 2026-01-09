# PingOne Postman Collections

This directory contains sample Postman collections in the PingOne format.

## Files

- `pingone-sample-collection.json` - Sample collection demonstrating the PingOne Postman format with:
  - OAuth 2.0 flows (Authorization Code, Client Credentials)
  - MFA flows (SMS, FIDO2) grouped by Registration and Authentication
  - Proper use of `{{authPath}}` and `{{envID}}` variables
  - PingOne Postman Environment Template format

- `pingone-sample-environment.json` - Sample environment file with all variables pre-configured:
  - All required variables for OAuth and MFA flows
  - Pre-filled default values where applicable
  - Ready to import into Postman

## Usage

1. **Import Collection**: Open Postman → Import → Select `pingone-sample-collection.json`
2. **Import Environment**: Open Postman → Import → Select `pingone-sample-environment.json`
3. **Select Environment**: In Postman, select the imported environment from the environment dropdown
4. **Update Variables**: Edit the environment variables with your actual values:
   - `authPath`: `https://auth.pingone.com` (or your region: `https://auth.pingone.eu`, `https://auth.pingone.asia`)
   - `envID`: Your PingOne Environment ID (UUID)
   - `client_id`: Your OAuth Client ID
   - `client_secret`: Your OAuth Client Secret
   - `workerToken`: Your PingOne Worker Token (for MFA operations)
   - `username`: Username for MFA operations
   - `userId`: User ID (UUID)
   - `deviceId`: MFA Device ID (UUID)
   - `deviceAuthenticationPolicyId`: Your MFA policy ID
   - `redirect_uri`: Your OAuth redirect URI
   - `scopes`: OAuth scopes (e.g., `openid profile email`)

## Format Reference

This collection follows the [PingOne Postman Environment Template](https://apidocs.pingidentity.com/pingone/platform/v1/api/#the-pingone-postman-environment-template) format:

- **URL Format**: `{{authPath}}/{{envID}}/path/to/endpoint`
- **Variables**: All variables use double braces: `{{variableName}}`
- **authPath**: Includes protocol (e.g., `https://auth.pingone.com`)
- **envID**: Environment ID (UUID format)

## Generated Collections

The OAuth Playground application can generate comprehensive Postman collections:

- **Unified Flows**: All OAuth/OIDC flows (Authorization Code, Implicit, Client Credentials, Device Code, Hybrid)
- **MFA Flows**: All device types (SMS, Email, WhatsApp, TOTP, FIDO2, Mobile)

These are available via:
- Unified Flow Hub: "Download All Unified Flows Postman Collection" button
- MFA Hub: "Download All MFA Flows Postman Collection" button
- Individual flow documentation pages: "Download Postman Collection" button

**All generated collections include:**
- **Collection file** (`*-collection.json`) - Contains all API requests
- **Environment file** (`*-environment.json`) - Contains all variables with pre-filled values

**Import both files into Postman:**
1. Import the collection file
2. Import the environment file
3. Select the environment from the dropdown
4. Update variables with your actual values
5. Start testing!

Generated collections are automatically grouped by:
- **Registration**: Initial authorization/device registration steps
- **Authentication**: Token exchange/device authentication steps
