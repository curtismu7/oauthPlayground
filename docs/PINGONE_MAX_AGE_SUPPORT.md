# PingOne `max_age` Parameter Support

## Research Summary

**PingOne DOES support the `max_age` parameter** in OpenID Connect (OIDC) authorization requests, but there are important configuration requirements and limitations.

## Official Support

According to PingOne API documentation:
- ✅ `max_age` is supported in OIDC authorization requests
- ✅ Parameter specifies maximum allowable time (in seconds) since user's last authentication
- ✅ If elapsed time exceeds `max_age`, user must re-authenticate
- ✅ `max_age=0` forces immediate re-authentication (no SSO)

## Critical Configuration Requirement

**"Use Force Authentication for max_age" Property**

PingOne has a specific configuration property that controls how `max_age` is handled:

### Default Behavior (Property = `false`)
- When `max_age` threshold is exceeded, PingOne **destroys the existing session** and creates a new one upon re-authentication
- This is the default behavior

### Alternative Behavior (Property = `true`)
- When `max_age` threshold is exceeded, PingOne performs a **session upgrade** instead of destroying the session
- This allows for seamless re-authentication while maintaining session continuity

### Where to Configure
This property is found in PingOne's **Services Configuration** settings. It must be enabled/configured in your PingOne environment for `max_age` to work as expected.

## Implementation Notes

### Parameter Format
- **Parameter name**: `max_age` (with underscore, not hyphen)
- **Value type**: Integer (seconds)
- **Example**: `max_age=3600` (1 hour)
- **Special value**: `max_age=0` (force immediate re-authentication)

### Where It Works
- ✅ Standard OAuth/OIDC authorization flows
- ✅ Redirectless flows (`pi.flow`)
- ✅ Device authorization flows
- ⚠️ May have limited effect in some SSO scenarios

### Where It May Not Work
- ❌ If "Use Force Authentication for max_age" is not configured
- ❌ In environments with complex SSO policies that override it
- ❌ If the user's session doesn't have an `auth_time` claim to compare against

## Code Implementation

### Standard Authorization Flow
```javascript
// Authorization URL
const params = new URLSearchParams({
  client_id: clientId,
  response_type: 'code',
  redirect_uri: redirectUri,
  scope: 'openid profile email',
  max_age: '3600'  // 1 hour
});
```

### Redirectless Flow (pi.flow)
```javascript
// POST body to /as/authorize
const authParams = new URLSearchParams();
authParams.set('response_type', 'code');
authParams.set('response_mode', 'pi.flow');
authParams.set('client_id', clientId);
authParams.set('max_age', '3600');  // Must be included in POST body
```

## Testing Recommendations

1. **Verify Configuration**
   - Check PingOne Admin Console → Services Configuration
   - Ensure "Use Force Authentication for max_age" is configured appropriately

2. **Test with Different Values**
   - `max_age=0`: Should always force re-authentication
   - `max_age=300`: Should force re-auth if last login > 5 minutes
   - `max_age=3600`: Should force re-auth if last login > 1 hour

3. **Check ID Token Response**
   - After authentication, verify the ID token contains `auth_time` claim
   - The `auth_time` claim indicates when the user last authenticated
   - PingOne compares current time - `auth_time` against `max_age`

4. **Verify Behavior**
   - Log in once
   - Wait for the `max_age` duration to pass
   - Attempt another authorization request
   - User should be prompted to re-authenticate if `max_age` is exceeded

## Common Issues

### Issue: `max_age` Not Being Honored

**Possible Causes:**
1. **Configuration Missing**: "Use Force Authentication for max_age" not configured in PingOne
2. **Parameter Not Sent**: `max_age` not included in authorization request
3. **SSO Override**: SSO policies may override `max_age` behavior
4. **Session State**: User's session may not have `auth_time` to compare against

**Solutions:**
1. Configure "Use Force Authentication for max_age" in PingOne Admin Console
2. Verify `max_age` is included in authorization URL/request body
3. Check PingOne environment SSO settings
4. Ensure OIDC scopes include `openid` (required for `auth_time` claim)

### Issue: `max_age=0` Not Forcing Re-Authentication

**Possible Causes:**
1. SSO session is being maintained despite `max_age=0`
2. PingOne configuration not set to honor `max_age=0`
3. Application-level session management overriding PingOne behavior

**Solutions:**
1. Combine with `prompt=login` to force re-authentication
2. Verify PingOne environment configuration
3. Check application session management logic

## Best Practices

1. **Always Include `openid` Scope**: Required for `auth_time` claim in ID token
2. **Combine with `prompt` Parameter**: Use `prompt=login` with `max_age` for stronger enforcement
3. **Test in Your Environment**: PingOne behavior may vary based on environment configuration
4. **Document Configuration**: Note your PingOne environment's "Use Force Authentication for max_age" setting

## References

- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/auth/v1/api/)
- [PingOne Services Configuration](https://docs.pingidentity.com/pingoneaic/latest/am-reference/services-configuration.html)
- [OIDC Core 1.0 Specification - Section 3.1.2.1](https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest)

## Code Fixes Applied

1. ✅ Added `max_age` extraction in `/api/pingone/redirectless/authorize` endpoint
2. ✅ Added `max_age` to redirectless authorization request body
3. ✅ Added `prompt`, `loginHint`, and `display` parameters for completeness
4. ✅ Added logging to track when `max_age` is included in requests

