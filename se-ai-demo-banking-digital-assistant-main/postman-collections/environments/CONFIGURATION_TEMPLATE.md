# Environment Configuration Template

This document explains how to configure the environment variables in each Postman environment file.

## Required Configuration Values

Before using the Postman collections, you need to replace the placeholder values in the environment files with your actual configuration values.

### OAuth Configuration

Replace these placeholder values in each environment file:

#### Development Environment
- `{{p1aic_tenant_name}}` → Your PingOne development tenant name
- `{{p1aic_environment_id}}` → Your PingOne development environment ID
- `{{admin_client_id}}` → Your development admin OAuth client ID
- `{{admin_client_secret}}` → Your development admin OAuth client secret
- `{{user_client_id}}` → Your development user OAuth client ID
- `{{user_client_secret}}` → Your development user OAuth client secret

#### Staging Environment
- `{{p1aic_staging_tenant_name}}` → Your PingOne staging tenant name
- `{{p1aic_staging_environment_id}}` → Your PingOne staging environment ID
- `{{staging_admin_client_id}}` → Your staging admin OAuth client ID
- `{{staging_admin_client_secret}}` → Your staging admin OAuth client secret
- `{{staging_user_client_id}}` → Your staging user OAuth client ID
- `{{staging_user_client_secret}}` → Your staging user OAuth client secret

#### Production Environment
- `{{p1aic_prod_tenant_name}}` → Your PingOne production tenant name
- `{{p1aic_prod_environment_id}}` → Your PingOne production environment ID
- `{{prod_admin_client_id}}` → Your production admin OAuth client ID
- `{{prod_admin_client_secret}}` → Your production admin OAuth client secret
- `{{prod_user_client_id}}` → Your production user OAuth client ID
- `{{prod_user_client_secret}}` → Your production user OAuth client secret

## Auto-Populated Variables

These variables are automatically populated by the collection scripts and should not be manually modified:

- `access_token` - Current OAuth access token
- `refresh_token` - Current OAuth refresh token
- `token_expires_at` - Token expiration timestamp
- `user_id` - Current authenticated user ID
- `account_id` - Test account ID for operations
- `transaction_id` - Test transaction ID for operations
- `unique_id` - Unique identifier for test data
- `test_email` - Generated test email address
- `code_verifier` - PKCE code verifier
- `code_challenge` - PKCE code challenge
- `state` - OAuth state parameter

## Environment-Specific Settings

### Development
- Uses `http://localhost:3000` as the base URL
- Configured for local development testing
- Uses localhost redirect URI

### Staging
- Uses `https://staging-api.bankingapi.com` as the base URL
- Configured for staging environment testing
- Uses staging-specific OAuth clients

### Production
- Uses `https://api.bankingapi.com` as the base URL
- Configured for production environment testing
- **Use with caution** - only for read-only operations in production

## Security Notes

- Never commit actual client secrets to version control
- Use Postman's secure variable storage for sensitive values
- Consider using environment-specific OAuth clients with appropriate permissions
- Regularly rotate OAuth client secrets
- Use minimal scopes required for testing in production environments