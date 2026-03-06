// Example usage of ApiCallDisplayService

import { logger } from '../utils/logger';
import { type ApiCallData, ApiCallDisplayService } from './apiCallDisplayService';

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
logger.info('ApiCallDisplayService', fullDisplay);

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
logger.info('ApiCallDisplayService', compactDisplay);
// Output: POST https://api.pingone.com/v1/environments/{envId}/users → 201 (Duration: 245ms)

// 3. Generate just the curl command
const curlCommand = ApiCallDisplayService.generateCurlCommand(apiCall);
logger.info('ApiCallDisplayService', curlCommand);

// 4. Sanitize sensitive data before display
const sanitizedCall = ApiCallDisplayService.sanitizeApiCall(apiCall);
const safeDisplay = ApiCallDisplayService.createFullDisplay(sanitizedCall);
logger.info('ApiCallDisplayService', 'Sanitized display:');
logger.info('ApiCallDisplayService', safeDisplay);
// The Authorization header and password field will be replaced with ***REDACTED***

// 5. Validate API call data
const validation = ApiCallDisplayService.validateApiCall(apiCall);
if (validation.isValid) {
	logger.info('ApiCallDisplayService', 'API call data is valid');
} else {
	logger.info('ApiCallDisplayService', 'Validation errors:', { arg0: validation.errors });
}

// 6. Custom curl options
const curlWithOptions = ApiCallDisplayService.generateCurlCommand(apiCall, {
	verbose: true,
	insecure: true,
	includeBody: false,
});
logger.info('ApiCallDisplayService', 'cURL with options:', { arg0: curlWithOptions });
// Output: curl -v -k -X POST -H "Authorization: Bearer ..." -H "Content-Type: application/json" "https://api.pingone.com/v1/environments/{envId}/users"
