#!/usr/bin/env node

// Health check script for OAuth Playground
import https from 'https';
import http from 'http';

const config = {
	frontend: {
		url: 'https://localhost:3000',
		port: 3000,
		name: 'Frontend (Vite)',
	},
	backend: {
		url: 'http://localhost:3001/api/health',
		port: 3001,
		name: 'Backend (Express)',
	},
};

// Disable SSL certificate verification for self-signed certs
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

function checkServer(server) {
	return new Promise((resolve) => {
		const startTime = Date.now();

		const options = {
			rejectUnauthorized: false,
			timeout: 5000,
		};

		const req = server.url.startsWith('https')
			? https.get(server.url, options, (res) => {
					const endTime = Date.now();
					const responseTime = endTime - startTime;

					let data = '';
					res.on('data', (chunk) => (data += chunk));
					res.on('end', () => {
						resolve({
							name: server.name,
							status: res.statusCode === 200 ? '✅ HEALTHY' : '❌ UNHEALTHY',
							statusCode: res.statusCode,
							responseTime: `${responseTime}ms`,
							port: server.port,
							details: server.name.includes('Backend') ? JSON.parse(data) : 'Frontend loaded',
						});
					});
				})
			: http.get(server.url, options, (res) => {
					const endTime = Date.now();
					const responseTime = endTime - startTime;

					let data = '';
					res.on('data', (chunk) => (data += chunk));
					res.on('end', () => {
						resolve({
							name: server.name,
							status: res.statusCode === 200 ? '✅ HEALTHY' : '❌ UNHEALTHY',
							statusCode: res.statusCode,
							responseTime: `${responseTime}ms`,
							port: server.port,
							details: server.name.includes('Backend') ? JSON.parse(data) : 'Frontend loaded',
						});
					});
				});

		req.on('error', (error) => {
			resolve({
				name: server.name,
				status: '❌ ERROR',
				statusCode: 'N/A',
				responseTime: 'N/A',
				port: server.port,
				details: error.message,
			});
		});

		req.on('timeout', () => {
			req.destroy();
			resolve({
				name: server.name,
				status: '❌ TIMEOUT',
				statusCode: 'N/A',
				responseTime: 'N/A',
				port: server.port,
				details: 'Request timed out after 5 seconds',
			});
		});
	});
}

async function runHealthCheck() {
	console.log('🔍 OAuth Playground Health Check');
	console.log('================================');
	console.log(`⏰ ${new Date().toISOString()}`);
	console.log('');

	const results = await Promise.all([checkServer(config.frontend), checkServer(config.backend)]);

	results.forEach((result) => {
		console.log(`${result.status} ${result.name}`);
		console.log(`   Port: ${result.port}`);
		console.log(`   Status Code: ${result.statusCode}`);
		console.log(`   Response Time: ${result.responseTime}`);
		console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
		console.log('');
	});

	const allHealthy = results.every((r) => r.status.includes('✅'));
	console.log(
		`Overall Status: ${allHealthy ? '✅ ALL SYSTEMS HEALTHY' : '❌ SOME ISSUES DETECTED'}`
	);

	if (allHealthy) {
		console.log('');
		console.log('🚀 Ready to use:');
		console.log(`   Frontend: https://localhost:3000`);
		console.log(`   Backend API: http://localhost:3001/api/health`);
	}
}

runHealthCheck().catch(console.error);
