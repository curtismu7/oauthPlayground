# Browser Console Test for Password Check API

## Quick Test in Browser Console

1. Open https://localhost:3000 in your browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Paste and run this code:

```javascript
// Test Password Check API
async function testPasswordCheck() {
  const config = {
    environmentId: 'b9817c16-9910-4415-b8e0-e0e1e0e1e0e1', // Replace with your env ID
    userId: '5adc497b-dde7-44c6-a8e0-e0e1e0e1e0e1', // Replace with curtis7 user ID
    workerToken: 'YOUR_WORKER_TOKEN_HERE', // Get from Client Credentials flow
    correctPassword: 'Claire7&',
    wrongPassword: 'WrongPassword123!'
  };

  console.log('🚀 Testing Password Check API...\n');

  // Test 1: Correct password
  console.log('Test 1: Correct Password');
  const test1 = await fetch('/api/pingone/password/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environmentId: config.environmentId,
      userId: config.userId,
      workerToken: config.workerToken,
      password: config.correctPassword
    })
  });
  const result1 = await test1.json();
  console.log('✅ Result:', result1);
  console.log('');

  // Test 2: Wrong password
  console.log('Test 2: Wrong Password');
  const test2 = await fetch('/api/pingone/password/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environmentId: config.environmentId,
      userId: config.userId,
      workerToken: config.workerToken,
      password: config.wrongPassword
    })
  });
  const result2 = await test2.json();
  console.log('❌ Result:', result2);
  console.log('');

  // Test 3: Empty password
  console.log('Test 3: Empty Password');
  const test3 = await fetch('/api/pingone/password/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      environmentId: config.environmentId,
      userId: config.userId,
      workerToken: config.workerToken,
      password: ''
    })
  });
  const result3 = await test3.json();
  console.log('⚠️  Result:', result3);

  console.log('\n✅ All tests completed!');
}

// Run the test
testPasswordCheck();
```

## Expected Results

### Test 1: Correct Password (Claire7&)
```json
{
  "success": true,
  "valid": true,
  "message": "Password is correct"
}
```

### Test 2: Wrong Password
```json
{
  "success": true,
  "valid": false,
  "message": "The provided password does not match the user's current password",
  "failuresRemaining": 4
}
```

### Test 3: Empty Password
```json
{
  "error": "INVALID_DATA",
  "error_description": "The request could not be completed. One or more validation errors were in the request.",
  "details": [
    {
      "code": "EMPTY_VALUE",
      "target": "password",
      "message": "must not be empty"
    }
  ]
}
```

## How to Get Worker Token

1. Go to https://localhost:3000
2. Navigate to "Client Credentials" flow
3. Enter your credentials:
   - Environment ID: (from .env)
   - Client ID: (from .env)
   - Client Secret: (from .env)
4. Click "Get Token"
5. Copy the `access_token` from the response
6. Use it in the test above

## Alternative: Use the UI

The easiest way is to use the Password Reset UI:

1. Go to https://localhost:3000
2. Click on "Password Reset" in the navigation
3. Enter your environment credentials
4. Go to "Check Password" tab
5. Look up user: `curtis7`
6. Enter password: `Claire7&`
7. Click "Check Password"
8. Should see: ✅ "Password is correct"

Then try with wrong password:
1. Enter password: `WrongPassword123!`
2. Click "Check Password"
3. Should see: ❌ "Password does not match"
