# API Request Modal Service - Educational Modal for All API Calls

## 📚 Overview

The `apiRequestModalService` is a unified, educational modal system for displaying API request details before execution. It provides a consistent, professional UX across all API calls in the OAuth Playground, with detailed explanations, cURL commands, and visual styling based on request type.

## 🎯 Purpose

- **Educational**: Shows users exactly what API calls are being made
- **Transparent**: Displays full request details (URL, headers, body, method)
- **Consistent**: Single service for all API calls (OAuth, PingOne Management API, etc.)
- **Professional**: Color-coded by request type with icons and animations

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { apiRequestModalService } from '../services/apiRequestModalService';
```

### 2. Call the Service

```typescript
apiRequestModalService.showModal({
	type: 'data_api_get',
	method: 'GET',
	url: 'https://api.pingone.com/v1/environments/abc123/totalIdentities',
	headers: {
		'Authorization': 'Bearer eyJhbGc...',
		'Accept': 'application/json',
	},
	description: 'Retrieve aggregated total identity counts for your PingOne environment',
	educationalNotes: [
		'This endpoint returns aggregated identity count data',
		'Requires Identity Data Admin or Environment Admin role in PingOne'
	],
	onProceed: async () => {
		// Your actual API call logic here
		const response = await fetch(url, options);
		// Handle response...
	},
});
```

## 📋 Request Types

The service supports 6 different request types, each with unique styling:

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `oauth_token` | 🟡 Yellow | FiKey | OAuth 2.0 Token Endpoint requests |
| `oauth_authorize` | 🔵 Blue | FiShield | OAuth 2.0 Authorization Endpoint requests |
| `data_api_get` | 🟢 Green | FiDatabase | PingOne Management API GET requests |
| `data_api_post` | 🟣 Purple | FiSend | PingOne Management API POST requests |
| `data_api_put` | 🩷 Pink | FiCode | PingOne Management API PUT requests |
| `data_api_delete` | 🔴 Red | FiX | PingOne Management API DELETE requests |

## 📖 Complete Examples

### Example 1: PingOne Metrics API (GET)

```typescript
// In PingOneIdentityMetrics.tsx
const handleFetch = useCallback(async () => {
	const workerToken = localStorage.getItem('worker_token_metrics') || '';
	const environmentId = 'abc-123-def';
	const region = 'us';
	
	const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/totalIdentities`;
	
	// Show educational modal FIRST
	apiRequestModalService.showModal({
		type: 'data_api_get',
		method: 'GET',
		url: apiUrl,
		headers: {
			'Authorization': `Bearer ${workerToken}`,
			'Accept': 'application/json',
		},
		description: 'Retrieve aggregated total identity counts for your PingOne environment',
		educationalNotes: [
			'This endpoint returns aggregated identity count data for the specified date range',
			'The sampleSize parameter controls how many historical data points are returned',
			'Results show total counts across all populations in the environment',
			'Requires Identity Data Admin or Environment Admin role in PingOne'
		],
		onProceed: async () => {
			// This function is called when user clicks "Send Request"
			setLoading(true);
			try {
				const response = await fetch(apiUrl, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${workerToken}`,
						'Accept': 'application/json',
					},
				});
				const data = await response.json();
				setMetrics(data);
				v4ToastManager.showSuccess('Metrics retrieved successfully!');
			} catch (error) {
				v4ToastManager.showError('Failed to retrieve metrics');
			} finally {
				setLoading(false);
			}
		},
	});
}, []);
```

### Example 2: Worker Token Request (POST)

```typescript
// In WorkerTokenModal.tsx or similar
const handleGenerateToken = useCallback(async () => {
	const tokenEndpoint = `https://auth.pingone.com/${environmentId}/as/token`;
	const requestBody = {
		grant_type: 'client_credentials',
		client_id: credentials.clientId,
		client_secret: credentials.clientSecret,
		scope: 'p1:read:users p1:read:environments',
	};
	
	apiRequestModalService.showModal({
		type: 'oauth_token',
		method: 'POST',
		url: tokenEndpoint,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams(requestBody).toString(),
		description: 'Request a worker token using OAuth 2.0 Client Credentials Grant',
		educationalNotes: [
			'The Client Credentials grant is used for machine-to-machine authentication',
			'No user interaction required - uses client_id and client_secret only',
			'Returns an access_token that can be used to call PingOne Management APIs',
			'Token scope determines which APIs can be accessed',
		],
		onProceed: async () => {
			const response = await fetch(tokenEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams(requestBody),
			});
			const tokenData = await response.json();
			localStorage.setItem('worker_token', tokenData.access_token);
			v4ToastManager.showSuccess('Worker token generated successfully!');
		},
	});
}, []);
```

### Example 3: User Lookup API (POST with JSON Body)

```typescript
// In PingOneUserProfile.tsx or similar
const handleSearchUser = useCallback(async () => {
	const apiUrl = `/api/pingone/user-lookup`;
	const requestBody = {
		environmentId: 'abc-123',
		identifier: 'john.doe@example.com',
		workerToken: localStorage.getItem('worker_token'),
	};
	
	apiRequestModalService.showModal({
		type: 'data_api_post',
		method: 'POST',
		url: 'https://api.pingone.com/v1/environments/abc-123/users',
		headers: {
			'Authorization': `Bearer ${requestBody.workerToken}`,
			'Content-Type': 'application/json',
		},
		body: requestBody,
		description: 'Search for a user in PingOne directory by email, username, or ID',
		educationalNotes: [
			'This endpoint uses the PingOne Management API to search for users',
			'Supports searching by email, username, or user ID',
			'Returns user profile with attributes, groups, and MFA devices',
			'Requires p1:read:users scope in your worker token',
		],
		onProceed: async () => {
			setLoading(true);
			try {
				const response = await fetch(apiUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(requestBody),
				});
				const userData = await response.json();
				setUser(userData);
				v4ToastManager.showSuccess('User found!');
			} catch (error) {
				v4ToastManager.showError('User not found');
			} finally {
				setLoading(false);
			}
		},
	});
}, []);
```

### Example 4: Authorization URL (GET - Redirect)

```typescript
// In OAuth flow components
const handleBuildAuthUrl = useCallback(() => {
	const authUrl = new URL(`https://auth.pingone.com/${environmentId}/as/authorize`);
	authUrl.searchParams.set('client_id', clientId);
	authUrl.searchParams.set('redirect_uri', redirectUri);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('scope', 'openid profile email');
	authUrl.searchParams.set('state', generateState());
	
	apiRequestModalService.showModal({
		type: 'oauth_authorize',
		method: 'GET',
		url: authUrl.toString(),
		description: 'Initiate OAuth 2.0 Authorization Code flow by redirecting user to PingOne login',
		educationalNotes: [
			'This starts the OAuth 2.0 Authorization Code flow',
			'User will be redirected to PingOne login page',
			'After successful login, PingOne redirects back with authorization code',
			'The authorization code can then be exchanged for tokens',
		],
		onProceed: () => {
			// Redirect user to authorization URL
			window.location.href = authUrl.toString();
		},
	});
}, []);
```

### Example 5: Update User (PUT)

```typescript
// In user management component
const handleUpdateUser = useCallback(async () => {
	const apiUrl = `https://api.pingone.com/v1/environments/${envId}/users/${userId}`;
	const requestBody = {
		email: 'newemail@example.com',
		name: {
			given: 'John',
			family: 'Doe',
		},
	};
	
	apiRequestModalService.showModal({
		type: 'data_api_put',
		method: 'PUT',
		url: apiUrl,
		headers: {
			'Authorization': `Bearer ${workerToken}`,
			'Content-Type': 'application/vnd.pingidentity.user.update+json',
		},
		body: requestBody,
		description: 'Update user profile attributes in PingOne directory',
		educationalNotes: [
			'PUT requests replace the entire resource (full update)',
			'Use PATCH for partial updates (single field changes)',
			'Requires p1:update:users scope in your worker token',
			'Changes are immediately reflected in PingOne',
		],
		onProceed: async () => {
			const response = await fetch(apiUrl, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${workerToken}`,
					'Content-Type': 'application/vnd.pingidentity.user.update+json',
				},
				body: JSON.stringify(requestBody),
			});
			const updatedUser = await response.json();
			v4ToastManager.showSuccess('User updated successfully!');
		},
	});
}, []);
```

### Example 6: Delete Resource (DELETE)

```typescript
// In resource management component
const handleDeleteDevice = useCallback(async () => {
	const apiUrl = `https://api.pingone.com/v1/environments/${envId}/users/${userId}/devices/${deviceId}`;
	
	apiRequestModalService.showModal({
		type: 'data_api_delete',
		method: 'DELETE',
		url: apiUrl,
		headers: {
			'Authorization': `Bearer ${workerToken}`,
		},
		description: 'Remove MFA device from user account',
		educationalNotes: [
			'DELETE requests permanently remove the resource',
			'This action cannot be undone',
			'User will need to re-register their MFA device',
			'Requires p1:delete:devices scope in your worker token',
		],
		onProceed: async () => {
			const response = await fetch(apiUrl, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${workerToken}`,
				},
			});
			if (response.ok) {
				v4ToastManager.showSuccess('Device deleted successfully!');
			}
		},
	});
}, []);
```

## 🎨 Features

### 1. Automatic cURL Generation
The modal automatically generates a cURL command for testing:

```bash
curl -X GET \
  'https://api.pingone.com/v1/environments/abc123/totalIdentities' \
  -H 'Authorization: Bearer eyJhbGc...' \
  -H 'Accept: application/json'
```

### 2. Secret Masking
Sensitive data (Authorization headers) are automatically masked with a show/hide toggle:
- **Hidden**: `Bearer eyJhbGciOiJSUzI1NiIs...`
- **Shown**: Full token visible when user clicks eye icon

### 3. Color-Coded URLs
Uses `ColoredUrlDisplay` component to highlight different parts of URLs for better readability.

### 4. Educational Notes
Provide context-specific learning points about each API call:
- What the endpoint does
- Required permissions/scopes
- Best practices
- Common pitfalls

## 🔧 API Reference

### `apiRequestModalService.showModal(config)`

Shows the educational API request modal.

**Parameters:**

```typescript
interface ApiRequestConfig {
	// Type of API request (determines color scheme and icon)
	type: 'oauth_token' | 'oauth_authorize' | 'data_api_get' | 'data_api_post' | 'data_api_put' | 'data_api_delete';
	
	// HTTP method
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	
	// Full API endpoint URL
	url: string;
	
	// Optional request headers
	headers?: Record<string, string>;
	
	// Optional request body (string or object)
	body?: string | Record<string, unknown>;
	
	// Short description of what this API call does
	description: string;
	
	// Optional array of educational bullet points
	educationalNotes?: string[];
	
	// Function to call when user clicks "Send Request"
	onProceed: () => void;
	
	// Optional function to call when user clicks "Cancel"
	onCancel?: () => void;
}
```

### `apiRequestModalService.hideModal()`

Manually hide the modal (usually not needed - modal auto-closes on proceed/cancel).

## 📦 Integration Checklist

When adding this service to a new page:

- [ ] Import `apiRequestModalService` from `'../services/apiRequestModalService'`
- [ ] Refactor existing API call to separate the request preparation from execution
- [ ] Call `apiRequestModalService.showModal()` with request details
- [ ] Move actual API logic into `onProceed` callback
- [ ] Add educational notes explaining the API call
- [ ] Choose appropriate `type` for color scheme
- [ ] Test that modal shows before API call executes
- [ ] Verify cURL command is correct
- [ ] Check that secret masking works for sensitive headers

## 🎯 Best Practices

### 1. Show Modal Before Every API Call
Users should always see what's being sent before it's executed:

```typescript
// ❌ BAD - Call API directly
const response = await fetch(url, options);

// ✅ GOOD - Show modal first, then call API
apiRequestModalService.showModal({
	// ... config ...
	onProceed: async () => {
		const response = await fetch(url, options);
	}
});
```

### 2. Provide Educational Context
Always include `educationalNotes` to help users learn:

```typescript
educationalNotes: [
	'This endpoint returns aggregated data across all populations',
	'Requires Identity Data Admin role in PingOne',
	'Results are cached for 5 minutes',
]
```

### 3. Use Correct Request Type
Choose the type that best matches the API call:

```typescript
// OAuth token requests
type: 'oauth_token'

// PingOne data APIs
type: 'data_api_get'  // for GET requests
type: 'data_api_post' // for POST requests
```

### 4. Handle Errors Gracefully
Always wrap API calls in try/catch within `onProceed`:

```typescript
onProceed: async () => {
	try {
		const response = await fetch(url, options);
		if (!response.ok) throw new Error('Request failed');
		const data = await response.json();
		// Handle success
	} catch (error) {
		v4ToastManager.showError('API call failed');
		console.error('[API Error]', error);
	}
}
```

## 🚀 Next Steps

This service is now ready to be used across the entire application. Priority areas for integration:

1. ✅ **PingOne Identity Metrics** - Already implemented
2. ⏳ **PingOne Audit Activities** - Next to implement
3. ⏳ **PingOne User Profile** - User lookup and CRUD operations
4. ⏳ **Organization Licensing** - Org info and license API calls
5. ⏳ **MFA Management** - Device registration, activation, deletion
6. ⏳ **Worker Token Modal** - Token generation preview
7. ⏳ **All OAuth Flows** - Authorization and token exchange

## 📝 Migration Guide

### Migrating Existing API Calls

**Before:**
```typescript
const handleFetch = async () => {
	const response = await fetch(url, options);
	const data = await response.json();
	setData(data);
};
```

**After:**
```typescript
const executeApiCall = async () => {
	const response = await fetch(url, options);
	const data = await response.json();
	setData(data);
};

const handleFetch = () => {
	apiRequestModalService.showModal({
		type: 'data_api_get',
		method: 'GET',
		url: apiUrl,
		headers: { /* ... */ },
		description: 'What this API does',
		educationalNotes: ['Point 1', 'Point 2'],
		onProceed: executeApiCall,
	});
};
```

## 💡 Tips

- The modal is **non-blocking** - users can still interact with the page behind it
- Click outside the modal or press ESC to close it
- The cURL command is **automatically copied** when user clicks "Copy cURL"
- Secrets are **masked by default** for security
- Modal is **responsive** and works on all screen sizes

---

**Happy Coding! 🎉** If you have questions or need help integrating this service, refer to the existing implementation in `PingOneIdentityMetrics.tsx` for a complete working example.


