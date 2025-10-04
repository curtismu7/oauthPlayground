// Example usage of ApiCallDisplayService

import { ApiCallDisplayService, type ApiCallData } from './apiCallDisplayService';

// Example API call data
const apiCall: ApiCallData = {
	method: 'POST',
	url: 'https://api.pingone.com/v1/environments/{envId}/users',
	headers: {
		Authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
		'Content-Type': 'application/json',
	},
	body: {
		username: 'john.doe',
		email: 'john.doe@example.com',
		password: 'secret-password',
	},
	response: {
		status: 201,
		statusText: 'Created',
		data: {
			id: '12345',
			username: 'john.doe',
			email: 'john.doe@example.com',
			createdAt: '2024-01-15T10:30:00Z',
		},
	},
	duration: 245,
};

// 1. Create a full display with curl command
const fullDisplay = ApiCallDisplayService.createFullDisplay(apiCall);
console.log(fullDisplay);

// Output:
// 🚀 API Call Details
// ==================================================
//
// 📤 Request:
// POST https://api.pingone.com/v1/environments/{envId}/users
// Headers:
//   Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
//   Content-Type: application/json
// Body:
//   {
//     "username": "john.doe",
//     "email": "john.doe@example.com",
//     "password": "secret-password"
//   }
//
// 💻 cURL Command:
// curl -X POST -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." -H "Content-Type: application/json" -d "{\"username\":\"john.doe\",\"email\":\"john.doe@example.com\",\"password\":\"secret-password\"}" "https://api.pingone.com/v1/environments/{envId}/users"
//
// 📥 Response:
// HTTP 201 Created
// Response:
//   {
//     "id": "12345",
//     "username": "john.doe",
//     "email": "john.doe@example.com",
//     "createdAt": "2024-01-15T10:30:00Z"
//   }
//
// ⏱️  Duration: 245ms

// 2. Create a compact display for quick reference
const compactDisplay = ApiCallDisplayService.createCompactDisplay(apiCall);
console.log(compactDisplay);
// Output: POST https://api.pingone.com/v1/environments/{envId}/users → 201 (Duration: 245ms)

// 3. Generate just the curl command
const curlCommand = ApiCallDisplayService.generateCurlCommand(apiCall);
console.log(curlCommand);

// 4. Sanitize sensitive data before display
const sanitizedCall = ApiCallDisplayService.sanitizeApiCall(apiCall);
const safeDisplay = ApiCallDisplayService.createFullDisplay(sanitizedCall);
console.log('Sanitized display:');
console.log(safeDisplay);
// The Authorization header and password field will be replaced with ***REDACTED***

// 5. Validate API call data
const validation = ApiCallDisplayService.validateApiCall(apiCall);
if (validation.isValid) {
	console.log('API call data is valid');
} else {
	console.log('Validation errors:', validation.errors);
}

// 6. Custom curl options
const curlWithOptions = ApiCallDisplayService.generateCurlCommand(apiCall, {
	verbose: true,
	insecure: true,
	includeBody: false,
});
console.log('cURL with options:', curlWithOptions);
// Output: curl -v -k -X POST -H "Authorization: Bearer ..." -H "Content-Type: application/json" "https://api.pingone.com/v1/environments/{envId}/users"
