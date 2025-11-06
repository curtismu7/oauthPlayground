# Test Credentials for PingOne Authentication

Use these credentials to test the Credential Diagnostic Modal:

## PingOne Application Details

```
Client ID: bdb78dcc-d530-4144-90c7-c7537a55128a
Client Secret: VhIALUz93iLEPhmTs~Y3_oj~hxzi7gnqw6cJYXLSJEq2LyLz2m7KV0bOq9LFj_GU
```

## How to Test

1. Navigate to the **PingOne Authentication** page
2. Fill in the **Environment ID**, **Client ID**, and **Client Secret** fields
3. Use the copy buttons (📋) next to each field for easy copying
4. Click **Kroger Login** button to test redirectless flow
5. The **Credential Diagnostic Modal** will automatically appear if any credentials are empty
6. The modal will show:
   - Which credentials are being sent
   - The length of each credential
   - Whether each field is empty or filled
   - The source of each credential value

## What to Look For

The diagnostic modal will help identify:
- ❌ Empty fields (shown in red)
- ✅ Filled fields (shown in green)
- The exact values being sent (masked for sensitive data)
- Where each value came from (config state, localStorage, etc.)

## Expected Behavior

- If all credentials are filled, you'll see all green checkmarks
- If any credential is empty, you'll see a red warning with the field name
- You can choose to "Send Anyway" (will likely fail) or "Cancel" to fix the issue
