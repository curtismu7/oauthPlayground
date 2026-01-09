# Generate Complete Postman Collection (Unified + MFA)

## Method 1: Using the Postman Collection Generator Page (Recommended)

1. Open the OAuth Playground app in your browser
2. Navigate to: `/postman-collection-generator`
3. Select:
   - ✅ Unified OAuth/OIDC Flows
   - ✅ MFA Flows
   - ✅ OAuth 2.0
   - ✅ OAuth 2.1
   - ✅ OpenID Connect (OIDC)
   - ✅ All MFA device types (SMS, Email, WhatsApp, TOTP, FIDO2, Mobile)
4. Click "Generate & Download Postman Collection"
5. Both files will be downloaded:
   - `pingone-complete-unified-mfa-{date}-collection.json`
   - `pingone-complete-unified-mfa-{date}-environment.json`

## Method 2: Using Browser Console

Open the browser console on any page and run:

```javascript
// Import the generator functions
const { generateCompletePostmanCollection, downloadPostmanCollectionWithEnvironment } = await import('/src/services/postmanCollectionGeneratorV8.ts');

// Generate the complete collection
const collection = generateCompletePostmanCollection({
  environmentId: '', // Will be empty - fill in your values
  clientId: '',      // Will be empty - fill in your values
  clientSecret: '',  // Will be empty - fill in your values
  username: ''      // Will be empty - fill in your values
});

// Generate filename with date
const date = new Date().toISOString().split('T')[0];
const filename = `pingone-complete-unified-mfa-${date}-collection.json`;

// Download both collection and environment files
downloadPostmanCollectionWithEnvironment(collection, filename, 'PingOne Complete Collection Environment');
```

## What's Included

The complete collection includes:

### Unified OAuth/OIDC Flows:
- 7 Authorization Code Grant variations
- Implicit Flow
- Client Credentials Flow
- Device Code Flow
- Hybrid Flow

### MFA Flows:
- SMS Device Registration & Authentication
- Email Device Registration & Authentication
- WhatsApp Device Registration & Authentication
- TOTP Device Registration & Authentication
- FIDO2 Device Registration & Authentication
- Mobile Device Registration & Authentication

### Features:
- Educational comments on every API request
- Automatic variable extraction scripts
- Complete OAuth login steps for user flows
- Validated API calls matching PingOne documentation
- Both collection and environment files for easy import

## Importing into Postman

1. Open Postman
2. Click "Import" button
3. Select both files:
   - The collection JSON file
   - The environment JSON file
4. Configure the environment variables:
   - `authPath`: `https://auth.pingone.com`
   - `apiPath`: `https://api.pingone.com`
   - `envID`: Your PingOne environment ID
   - `client_id`: Your OAuth client ID
   - `client_secret`: Your OAuth client secret
   - `username`: Your test username (for MFA flows)
   - `workerToken`: Your worker token (get from "Get Worker Token" request)
5. Start testing!
