/* eslint-disable */
// Service Worker for OAuth Playground
// Version: 1.0.1

const CACHE_NAME = 'oauth-playground-v1.0.1';
const STATIC_CACHE_NAME = 'oauth-playground-static-v1.0.1';
const DYNAMIC_CACHE_NAME = 'oauth-playground-dynamic-v1.0.1';

// Static assets to cache
const STATIC_ASSETS = [
	'/',
	'/index.html',
	'/manifest.json',
	'/favicon.ico',
	// Add other static assets as needed
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
	/\/api\/health/,
	/\/api\/token-exchange/,
	/\/api\/userinfo/,
	/\/api\/validate-token/,
];

// PingOne API endpoints to exclude from caching
const PINGONE_API_EXCLUSIONS = [/api\.pingone\.com/, /auth\.pingone\.com/];

// Cache strategies
const CACHE_STRATEGIES = {
	STATIC: 'cache-first',
	DYNAMIC: 'network-first',
	API: 'network-first',
	IMAGES: 'cache-first',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker...');

	event.waitUntil(
		// Clear old caches first
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName.startsWith('oauth-playground-') && !cacheName.includes('v1.0.1')) {
							console.log('[SW] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				// Cache new static assets
				return caches
					.open(STATIC_CACHE_NAME)
					.then((cache) => {
						console.log('[SW] Caching static assets');
						return cache.addAll(STATIC_ASSETS);
					})
					.then(() => {
						console.log('[SW] Static assets cached successfully');
						return self.skipWaiting();
					})
					.catch((error) => {
						console.error('[SW] Failed to cache static assets:', error);
					});
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker...');

	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (
							cacheName !== STATIC_CACHE_NAME &&
							cacheName !== DYNAMIC_CACHE_NAME &&
							cacheName !== CACHE_NAME
						) {
							console.log('[SW] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('[SW] Service worker activated');
				return self.clients.claim();
			})
	);
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') {
		return;
	}

	// Skip chrome-extension and other non-http requests
	if (!url.protocol.startsWith('http')) {
		return;
	}

	// Handle different types of requests
	if (isStaticAsset(request)) {
		event.respondWith(handleStaticAsset(request));
	} else if (isAPIRequest(request)) {
		event.respondWith(handleAPIRequest(request));
	} else if (isImageRequest(request)) {
		event.respondWith(handleImageRequest(request));
	} else {
		event.respondWith(handleDynamicRequest(request));
	}
});

// Check if request is for static asset
function isStaticAsset(request) {
	const url = new URL(request.url);
	return url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/);
}

// Check if request is for API
function isAPIRequest(request) {
	const url = new URL(request.url);
	return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// Check if request is for image
function isImageRequest(request) {
	const url = new URL(request.url);
	return url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/);
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
	try {
		const cache = await caches.open(STATIC_CACHE_NAME);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			console.log('[SW] Serving static asset from cache:', request.url);
			return cachedResponse;
		}

		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
			console.log('[SW] Cached static asset:', request.url);
		}

		return networkResponse;
	} catch (error) {
		console.error('[SW] Error handling static asset:', error);
		return new Response('Static asset not available', { status: 404 });
	}
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
	try {
		const cache = await caches.open(DYNAMIC_CACHE_NAME);

		// Try network first
		try {
			const networkResponse = await fetch(request);
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
				console.log('[SW] Cached API response:', request.url);
			}
			return networkResponse;
		} catch (networkError) {
			console.log('[SW] Network failed, trying cache:', request.url);

			// Fallback to cache
			const cachedResponse = await cache.match(request);
			if (cachedResponse) {
				console.log('[SW] Serving API from cache:', request.url);
				return cachedResponse;
			}

			throw networkError;
		}
	} catch (error) {
		console.error('[SW] Error handling API request:', error);
		return new Response('API not available', { status: 503 });
	}
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
	try {
		const cache = await caches.open(DYNAMIC_CACHE_NAME);
		const cachedResponse = await cache.match(request);

		if (cachedResponse) {
			console.log('[SW] Serving image from cache:', request.url);
			return cachedResponse;
		}

		const networkResponse = await fetch(request);
		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
			console.log('[SW] Cached image:', request.url);
		}

		return networkResponse;
	} catch (error) {
		console.error('[SW] Error handling image request:', error);
		return new Response('Image not available', { status: 404 });
	}
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
	try {
		const cache = await caches.open(DYNAMIC_CACHE_NAME);

		// Try network first
		try {
			const networkResponse = await fetch(request);
			if (networkResponse.ok) {
				cache.put(request, networkResponse.clone());
				console.log('[SW] Cached dynamic response:', request.url);
			}
			return networkResponse;
		} catch (networkError) {
			console.log('[SW] Network failed, trying cache:', request.url);

			// Fallback to cache
			const cachedResponse = await cache.match(request);
			if (cachedResponse) {
				console.log('[SW] Serving dynamic content from cache:', request.url);
				return cachedResponse;
			}

			throw networkError;
		}
	} catch (error) {
		console.error('[SW] Error handling dynamic request:', error);
		return new Response('Content not available', { status: 503 });
	}
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
	console.log('[SW] Background sync triggered:', event.tag);

	if (event.tag === 'oauth-token-sync') {
		event.waitUntil(syncOAuthTokens());
	}
});

// Sync OAuth tokens when back online
async function syncOAuthTokens() {
	try {
		console.log('[SW] Syncing OAuth tokens...');

		// Get stored tokens from IndexedDB or localStorage
		const tokens = await getStoredTokens();

		if (tokens && tokens.length > 0) {
			// Sync tokens with server
			for (const token of tokens) {
				try {
					await fetch('/api/sync-token', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(token),
					});
				} catch (error) {
					console.error('[SW] Failed to sync token:', error);
				}
			}
		}

		console.log('[SW] OAuth token sync completed');
	} catch (error) {
		console.error('[SW] Error syncing OAuth tokens:', error);
	}
}

// Get stored tokens (placeholder implementation)
async function getStoredTokens() {
	// This would typically read from IndexedDB or localStorage
	// For now, return empty array
	return [];
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
	console.log('[SW] Push notification received');

	const options = {
		body: event.data ? event.data.text() : 'OAuth Playground notification',
		icon: '/favicon.ico',
		badge: '/favicon.ico',
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: 1,
		},
		actions: [
			{
				action: 'explore',
				title: 'Explore OAuth Flows',
				icon: '/favicon.ico',
			},
			{
				action: 'close',
				title: 'Close',
				icon: '/favicon.ico',
			},
		],
	};

	event.waitUntil(self.registration.showNotification('OAuth Playground', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	console.log('[SW] Notification clicked:', event.action);

	event.notification.close();

	if (event.action === 'explore') {
		event.waitUntil(clients.openWindow('/flows'));
	}
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
	console.log('[SW] Message received:', event.data);

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_CACHE_STATUS') {
		event.ports[0].postMessage({
			type: 'CACHE_STATUS',
			status: 'active',
		});
	}
});

// Error handling
self.addEventListener('error', (event) => {
	console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
	console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service worker script loaded');
