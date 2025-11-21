#!/usr/bin/env node

/**
 * Test Worker Token Script
 * Tests if a PingOne worker token is valid by making API calls
 */

const https = require('https');

const WORKER_TOKEN =
	'eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlZmF1bHQiLCJ4NXQiOiIwV01SZmxrZTlGQ1NKbWtmN0JFSWVmbEllS1UifQ.eyJjbGllbnRfaWQiOiI2NmE0Njg2Yi05MjIyLTRhZDItOTFiNi0wMzExMzcxMWM5YWEiLCJpc3MiOiJodHRwczovL2F1dGgucGluZ29uZS5jb20vYjk4MTdjMTYtOTkxMC00NDE1LWI2N2UtNGFjNjg3ZGE3NGQ5L2FzIiwianRpIjoiOGExY2FiODEtMDVhMi00NjM0LTg3MGYtNGRkYTUzYWUzODJlIiwiaWF0IjoxNzYzMDY2ODg2LCJleHAiOjE3NjMwNzA0ODYsImF1ZCI6WyJodHRwczovL2FwaS5waW5nb25lLmNvbSJdLCJlbnYiOiJiOTgxN2MxNi05OTEwLTQ0MTUtYjY3ZS00YWM2ODdkYTc0ZDkiLCJvcmciOiI5N2JhNDRmMi1mN2VlLTQxNDQtYWE5NS05ZTYzNmI1N2MwOTYiLCJwMS5yaWQiOiI4YTFjYWI4MS0wNWEyLTQ2MzQtODcwZi00ZGRhNTNhZTM4MmUifQ.XxjvcRn1CZmI-hOH6sNrOcSZO58IcVCxIbYlrdac1PZpuxo7DB9tkji4cu5a6hclHcpD685cx06x4H6lBKy1fTvnUEAABKEULnkeSePKYej5_kWBIcawBvq5G1wgtNRrz33tZxIrGxaAHtZbkd-_2wcw2vSg2eRg21LwwsFWO50EuC0UINYosLSZ4S8W2VpwvnlIwFmF0OkbaJ3NUbzvbl_3xfk1iAok8I0eqwCRaiBh0MNGlFDkChRjJAzLWM13CTf16CPp8XBdzTVv4pox0PZGF4O-el5iKpPgsIu4PgbmuxSXrOdSYGRN1AfOEaM0fLr4oe42r15KvJb9oJ3Uxg';

// Decode JWT to get environment ID
function decodeJWT(token) {
	try {
		const parts = token.split('.');
		const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
		return payload;
	} catch (error) {
		console.error('❌ Failed to decode JWT:', error.message);
		return null;
	}
}

// Make HTTPS request
function makeRequest(options) {
	return new Promise((resolve, reject) => {
		const req = https.request(options, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					body: data,
				});
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.end();
	});
}

// Test token against PingOne API
async function testWorkerToken() {
	console.log('🔍 Testing PingOne Worker Token\n');
	console.log('='.repeat(60));

	// Step 1: Decode token
	console.log('\n📋 Step 1: Decoding JWT token...');
	const payload = decodeJWT(WORKER_TOKEN);

	if (!payload) {
		console.error('❌ Failed to decode token');
		process.exit(1);
	}

	console.log('✅ Token decoded successfully');
	console.log('   Client ID:', payload.client_id);
	console.log('   Environment:', payload.env);
	console.log('   Organization:', payload.org);
	console.log('   Issued At:', new Date(payload.iat * 1000).toISOString());
	console.log('   Expires At:', new Date(payload.exp * 1000).toISOString());

	// Check if expired
	const now = Math.floor(Date.now() / 1000);
	const isExpired = now > payload.exp;
	const timeRemaining = payload.exp - now;

	if (isExpired) {
		console.log('   ⚠️  Status: EXPIRED');
		console.log('   Expired:', Math.abs(timeRemaining), 'seconds ago');
	} else {
		console.log('   ✅ Status: VALID');
		console.log('   Expires in:', timeRemaining, 'seconds');
	}

	const environmentId = payload.env;

	// Step 2: Test API call - Get Environment
	console.log('\n📋 Step 2: Testing API call - GET /environments/{id}...');

	const options = {
		hostname: 'api.pingone.com',
		port: 443,
		path: `/v1/environments/${environmentId}`,
		method: 'GET',
		headers: {
			Authorization: `Bearer ${WORKER_TOKEN}`,
			'Content-Type': 'application/json',
		},
	};

	try {
		const response = await makeRequest(options);

		console.log('   Status Code:', response.statusCode);

		if (response.statusCode === 200) {
			console.log('   ✅ SUCCESS - Token is valid!');
			const data = JSON.parse(response.body);
			console.log('   Environment Name:', data.name);
			console.log('   Environment Type:', data.type);
			console.log('   Region:', data.region);
		} else if (response.statusCode === 401) {
			console.log('   ❌ UNAUTHORIZED - Token is invalid or expired');
			try {
				const error = JSON.parse(response.body);
				console.log('   Error:', error.message || error.error);
				console.log('   Details:', error.details || error.error_description);
			} catch (e) {
				console.log('   Response:', response.body);
			}
		} else if (response.statusCode === 403) {
			console.log('   ❌ FORBIDDEN - Token lacks required permissions');
			try {
				const error = JSON.parse(response.body);
				console.log('   Error:', error.message || error.error);
			} catch (e) {
				console.log('   Response:', response.body);
			}
		} else {
			console.log('   ⚠️  Unexpected status code');
			console.log('   Response:', response.body);
		}
	} catch (error) {
		console.error('   ❌ Request failed:', error.message);
	}

	// Step 3: Test API call - List Users (requires more permissions)
	console.log('\n📋 Step 3: Testing API call - GET /environments/{id}/users...');

	const usersOptions = {
		hostname: 'api.pingone.com',
		port: 443,
		path: `/v1/environments/${environmentId}/users?limit=1`,
		method: 'GET',
		headers: {
			Authorization: `Bearer ${WORKER_TOKEN}`,
			'Content-Type': 'application/json',
		},
	};

	try {
		const response = await makeRequest(usersOptions);

		console.log('   Status Code:', response.statusCode);

		if (response.statusCode === 200) {
			console.log('   ✅ SUCCESS - Token has user read permissions');
			const data = JSON.parse(response.body);
			console.log('   Total Users:', data._embedded?.users?.length || 0);
		} else if (response.statusCode === 401) {
			console.log('   ❌ UNAUTHORIZED - Token is invalid or expired');
		} else if (response.statusCode === 403) {
			console.log('   ⚠️  FORBIDDEN - Token lacks user read permissions');
		} else {
			console.log('   ⚠️  Unexpected status code');
		}
	} catch (error) {
		console.error('   ❌ Request failed:', error.message);
	}

	console.log('\n' + '='.repeat(60));
	console.log('✅ Test complete\n');
}

// Run the test
testWorkerToken().catch((error) => {
	console.error('❌ Test failed:', error);
	process.exit(1);
});
