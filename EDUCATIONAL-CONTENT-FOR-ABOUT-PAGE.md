# Educational Content to Add to About/Overview Page

## 🔍 PingOne API Best Practices

### Understanding PingOne API Patterns

When working with PingOne Platform APIs, there are important patterns to understand:

#### **User Lookup & Search**

**Filter Syntax**
- Use **lowercase** attribute names in filters: `username` not `userName`
- Proper URL encoding is critical: `filter=username%20eq%20%22john.doe%22`
- Supported filter attributes include: `username`, `email`, `enabled`, `population.id`, and more

**Search Methods**
```
✅ GET /users?filter=username eq "john.doe"
✅ GET /users?filter=email eq "john@example.com"
✅ GET /users/{userId} (for direct ID lookup)
```

**Pro Tips**
- Always check if identifier is a UUID before attempting direct ID lookup
- Use filter search for username/email lookups
- Implement fallback search (try email if username fails)

---

#### **Password Operations Content-Type Pattern**

PingOne password operations use vendor-specific content types with a specific pattern:

**The Rule**: Operations with NO request body use content type WITHOUT `+json` suffix

| Operation | Method | Content-Type | Has Body? |
|-----------|--------|--------------|-----------|
| Force Change | POST | `application/vnd.pingidentity.password.forceChange` | ❌ No |
| Unlock | POST | `application/vnd.pingidentity.password.unlock` | ❌ No |
| Send Recovery | POST | `application/vnd.pingidentity.password.sendRecoveryCode` | ❌ No |
| Check Password | POST | `application/vnd.pingidentity.password.check+json` | ✅ Yes |
| Recover | POST | `application/vnd.pingidentity.password.recover+json` | ✅ Yes |
| Reset | PUT | `application/vnd.pingidentity.password.reset+json` | ✅ Yes |
| Set | PUT | `application/vnd.pingidentity.password.set+json` | ✅ Yes |

**Why This Matters**
- Using wrong content type results in `415 Unsupported Media Type` error
- The `+json` suffix indicates the operation expects a JSON body
- Operations without body don't need the suffix

---

#### **Common Field Names**

**Password Operations**
```json
{
  "value": "newPassword123!",        // ✅ Use "value" not "password"
  "forceChange": true,                // ✅ Boolean flag
  "bypassPolicy": false,              // ✅ Use "bypassPolicy" not "verifyPolicy"
  "currentPassword": "oldPass123!"    // ✅ For user-initiated changes
}
```

**Why These Names?**
- `value` is the standard field for password values across all set operations
- `bypassPolicy` explicitly states the intent (bypass password policy checks)
- `currentPassword` is required for user-initiated password changes (not admin)

---

#### **Error Handling Patterns**

**UUID Validation**
```javascript
// Don't attempt direct ID lookup for non-UUIDs
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (isUUID.test(identifier)) {
  // Try direct GET /users/{userId}
} else {
  // Use filter search
}
```

**INVALID_REQUEST Handling**
- When direct ID lookup returns `INVALID_REQUEST`, continue to filter search
- Don't return the error to the client - it's expected for non-UUID identifiers

---

### 🎓 Key Learnings

1. **Content-Type Matters**: PingOne uses vendor-specific content types that must match exactly
2. **Attribute Names**: Use lowercase attribute names in filters (`username` not `userName`)
3. **URL Encoding**: Always properly encode filter parameters
4. **Field Names**: Use `value` for passwords, `bypassPolicy` for policy bypass
5. **Error Handling**: Handle `INVALID_REQUEST` gracefully and implement fallback searches

---

### 📚 Additional Resources

- [PingOne Platform API - User Passwords](https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords)
- [PingOne Platform API - Read Users](https://apidocs.pingidentity.com/pingone/platform/v1/api/#get-read-all-users)
- [SCIM 2.0 Filter Syntax](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2)

---

### 💡 Interactive Examples

Try these operations in the playground:

**User Lookup**
1. Navigate to User Profile page
2. Enter a username (e.g., "john.doe") or email
3. See the API request format and response

**Password Operations**
1. Navigate to Password Reset page
2. Try different operations (force change, unlock, set password)
3. Observe the different content types used for each operation

---

### 🔧 Developer Tips

**Testing with Worker Apps**
- Configure a Worker App in PingOne with appropriate roles
- Use `client_credentials` grant to get a worker token
- Worker tokens are required for user management operations

**Common Mistakes to Avoid**
- ❌ Using `userName` instead of `username` in filters
- ❌ Forgetting to URL encode filter parameters
- ❌ Using wrong content type (with/without `+json`)
- ❌ Using `password` field instead of `value`
- ❌ Attempting direct ID lookup for non-UUID identifiers

**Best Practices**
- ✅ Validate identifier format before choosing lookup method
- ✅ Implement fallback search mechanisms
- ✅ Use proper content types for each operation
- ✅ Handle errors gracefully with helpful messages
- ✅ Log API requests for debugging
