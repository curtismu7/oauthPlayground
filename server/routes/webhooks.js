// Webhook receiver, webhook events API, and dev webhook tunnel — moved verbatim from server.js.

import { randomUUID } from 'node:crypto';
import express from 'express';

const router = express.Router();

// In-memory storage for webhook events (for demo purposes)
// In production, you'd want to use a database or persistent storage
const webhookEvents = [];
const MAX_WEBHOOK_EVENTS = 1000; // Keep last 1000 events

router.post('/api/webhooks/pingone', express.json({ limit: '10mb' }), async (req, res) => {
	try {
		const timestamp = new Date();
		const eventId = randomUUID();

		console.log(
			`[Webhook Receiver] Received webhook event ${eventId} at ${timestamp.toISOString()}`
		);

		// Store the webhook event
		const webhookEvent = {
			id: eventId,
			timestamp: timestamp.toISOString(),
			timestampMs: timestamp.getTime(),
			type: req.body?.type || req.body?.event || 'unknown',
			event: req.body?.event || 'webhook.event',
			data: req.body,
			headers: req.headers,
			status: 'success',
			source: 'pingone-api',
			rawBody: req.body,
		};

		// Add to beginning of array (newest first)
		webhookEvents.unshift(webhookEvent);

		// Keep only the last MAX_WEBHOOK_EVENTS
		if (webhookEvents.length > MAX_WEBHOOK_EVENTS) {
			webhookEvents.splice(MAX_WEBHOOK_EVENTS);
		}

		console.log(
			`[Webhook Receiver] Stored webhook event ${eventId}, total events: ${webhookEvents.length}`
		);

		// Return 200 OK to PingOne
		res.status(200).json({
			success: true,
			eventId: eventId,
			receivedAt: timestamp.toISOString(),
		});
	} catch (error) {
		console.error('[Webhook Receiver] Error processing webhook:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error processing webhook',
			details: error.message,
		});
	}
});

/**
 * Webhook Events API - Get all stored webhook events
 * GET /api/webhooks/events
 */
router.get('/api/webhooks/events', (req, res) => {
	try {
		const { limit = 100, offset = 0 } = req.query;
		const limitNum = Math.min(parseInt(limit, 10) || 100, 1000);
		const offsetNum = parseInt(offset, 10) || 0;

		const events = webhookEvents.slice(offsetNum, offsetNum + limitNum);

		res.json({
			events: events,
			total: webhookEvents.length,
			limit: limitNum,
			offset: offsetNum,
		});
	} catch (error) {
		console.error('[Webhook Events API] Error fetching events:', error);
		res.status(500).json({
			error: 'Failed to fetch webhook events',
			details: error.message,
		});
	}
});

/**
 * Clear Webhook Events API
 * DELETE /api/webhooks/events
 */
router.delete('/api/webhooks/events', (_req, res) => {
	try {
		const clearedCount = webhookEvents.length;
		webhookEvents.length = 0; // Clear array
		console.log(`[Webhook Events API] Cleared ${clearedCount} webhook events`);
		res.json({
			success: true,
			cleared: clearedCount,
		});
	} catch (error) {
		console.error('[Webhook Events API] Error clearing events:', error);
		res.status(500).json({
			error: 'Failed to clear webhook events',
			details: error.message,
		});
	}
});

/**
 * Start ngrok tunnel for localhost webhook development (Mac).
 * POST /api/dev/start-webhook-tunnel
 * Spawns ngrok, waits for it to be ready, returns public URL.
 * Requires ngrok to be installed (brew install ngrok).
 */
router.post('/api/dev/start-webhook-tunnel', async (_req, res) => {
	const { spawn } = await import('child_process');
	const http = await import('http');
	const port = 5000;

	try {
		const proc = spawn('ngrok', ['http', String(port)], {
			detached: true,
			stdio: 'ignore',
		});
		proc.unref();

		// Poll ngrok local API for tunnel URL (max 15s)
		for (let i = 0; i < 30; i++) {
			await new Promise((r) => setTimeout(r, 500));
			const url = await new Promise((resolve) => {
				const req = http.request(
					{
						hostname: '127.0.0.1',
						port: 4040,
						path: '/api/tunnels',
						method: 'GET',
					},
					(resp) => {
						let data = '';
						resp.on('data', (ch) => (data += ch));
						resp.on('end', () => {
							try {
								const j = JSON.parse(data);
								const tunnels = j.tunnels || [];
								const https = tunnels.find(
									(t) => t.public_url && t.public_url.startsWith('https://')
								);
								resolve(https ? https.public_url : null);
							} catch {
								resolve(null);
							}
						});
					}
				);
				req.on('error', () => resolve(null));
				req.setTimeout(2000, () => {
					req.destroy();
					resolve(null);
				});
				req.end();
			});
			if (url) {
				return res.json({ publicUrl: url, url });
			}
		}

		res.status(408).json({
			error:
				'ngrok did not start in time. Ensure ngrok is installed (brew install ngrok) and not already running.',
		});
	} catch (e) {
		const msg = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
		res.status(500).json({
			error: msg.includes('spawn') ? 'ngrok not found. Install with: brew install ngrok' : msg,
		});
	}
});

export default router;
