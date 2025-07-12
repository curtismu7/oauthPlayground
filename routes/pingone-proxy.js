import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import workerTokenManager from '../auth/workerTokenManager.js';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a logger instance for this module
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `[${timestamp}] ${level}: ${message}${metaString}\n${'*'.repeat(80)}`;
        })
    ),
    defaultMeta: { 
        service: 'pingone-proxy',
        env: process.env.NODE_ENV || 'development'
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
                    return `[${timestamp}] ${level}: ${message}${metaString}\n${'*'.repeat(80)}`;
                })
            )
        }),
        // Add file transports for proper logging
        new winston.transports.File({
            filename: 'logs/combined.log',
            level: 'info'
        }),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        })
    ]
});

// PingOne API specific rate limiter (more permissive for better user experience)
const pingoneApiLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 150, // Increased from 90 to 150 requests per second for PingOne API calls
    message: {
        error: 'PingOne API rate limit exceeded',
        message: 'Too many PingOne API requests. Please wait before trying again.',
        retryAfter: 1
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('PingOne API rate limit exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            endpoint: req.path
        });
        res.status(429).json({
            error: 'PingOne API rate limit exceeded',
            message: 'Too many PingOne API requests. Please wait before trying again.',
            retryAfter: 1
        });
    },
    // Burst handling for PingOne API
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // Allow burst of up to 600 requests in first 1000ms for export/import operations (4x the base limit)
    burstLimit: 600,
    burstWindowMs: 1000,
    // Queue configuration for PingOne API calls
    queue: {
        enabled: true,
        maxQueueSize: 600, // Increased from 400 to 600
        maxQueueTime: 60000, // Increased from 45 to 60 seconds
        retryAfter: 2 // Wait 2 seconds before retry
    }
});

const router = express.Router();

// Path to settings file
const SETTINGS_PATH = path.join(process.cwd(), "data/settings.json");

// PingOne API base URLs by region
const PINGONE_API_BASE_URLS = {
    'NorthAmerica': 'https://api.pingone.com',
    'Europe': 'https://api.eu.pingone.com',
    'Canada': 'https://api.ca.pingone.com',
    'Asia': 'https://api.apsoutheast.pingone.com',
    'Australia': 'https://api.aus.pingone.com',
    'US': 'https://api.pingone.com',
    'EU': 'https://api.eu.pingone.com',
    'AP': 'https://api.apsoutheast.pingone.com',
    'default': 'https://api.pingone.com'
};

// Helper function to read settings from file
async function readSettingsFromFile() {
    try {
        const data = await fs.readFile(SETTINGS_PATH, "utf8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            // Return empty settings if file doesn't exist
            return {};
        }
        throw error;
    }
}

// Helper function to read settings from environment variables
function readSettingsFromEnv() {
    return {
        environmentId: process.env.PINGONE_ENVIRONMENT_ID || "",
        region: process.env.PINGONE_REGION || "NorthAmerica",
        apiClientId: process.env.PINGONE_CLIENT_ID || "",
        apiSecret: process.env.PINGONE_CLIENT_SECRET || ""
    };
}

// Validate settings middleware
const validateSettings = (req, res, next) => {
    const { environmentId, apiClientId, apiSecret } = req.settings;
    
    if (!environmentId || !apiClientId || !apiSecret) {
        return res.status(400).json({
            error: 'Missing Configuration',
            message: 'PingOne configuration is incomplete. Please configure your settings.',
            missing: {
                environmentId: !environmentId,
                apiClientId: !apiClientId,
                apiSecret: !apiSecret
            }
        });
    }
    
    next();
};

// Extract environment ID from URL path
const extractEnvironmentId = (path) => {
    const match = path.match(/\/environments\/([^\/]+)/);
    return match ? match[1] : null;
};

// Inject settings middleware
const injectSettings = async (req, res, next) => {
    try {
        logger.info('=== Starting injectSettings ===');
        
        // Extract environment ID from URL if present
        const envIdFromUrl = extractEnvironmentId(req.path);
        
        // Read settings from file first
        let fileSettings = {};
        try {
            fileSettings = await readSettingsFromFile();
            logger.info('Settings loaded from file');
        } catch (error) {
            logger.info('No settings file found, using environment variables');
        }
        
        // Read settings from environment variables
        const envSettings = readSettingsFromEnv();
        
        // Initialize settings with file settings first, then environment variables as fallback
        // For API secret, prioritize environment variables to avoid encrypted values
        req.settings = {
            environmentId: envIdFromUrl || fileSettings.environmentId || envSettings.environmentId || '',
            region: fileSettings.region || envSettings.region || 'NorthAmerica',
            apiClientId: fileSettings.apiClientId || envSettings.apiClientId || '',
            apiSecret: envSettings.apiSecret || fileSettings.apiSecret || '' // Prioritize env for API secret
        };

        logger.info('Initial settings (from file/env):', {
            environmentId: req.settings.environmentId ? '***' + req.settings.environmentId.slice(-4) : 'not set',
            region: req.settings.region,
            apiClientId: req.settings.apiClientId ? '***' + req.settings.apiClientId.slice(-4) : 'not set',
            apiSecret: req.settings.apiSecret ? '***' + req.settings.apiSecret.slice(-4) : 'not set'
        });

        logger.debug('Session data:', req.session || {});
        logger.debug('Request body:', req.body || {});

        // Get settings from session if available (lowest priority)
        if (req.session) {
            // Only override environmentId from session if not in URL and not set from file/env
            if (!envIdFromUrl && !fileSettings.environmentId && !envSettings.environmentId) {
                req.settings.environmentId = req.session.environmentId || req.settings.environmentId;
            }
            req.settings.region = req.session.region || req.settings.region;
            req.settings.apiClientId = req.session.apiClientId || req.settings.apiClientId;
            req.settings.apiSecret = req.session.apiSecret || req.settings.apiSecret;
        }

        // Override with body parameters if provided (lowest priority)
        if (req.body) {
            // Only override environmentId from body if not in URL and not set from file/env
            if (!envIdFromUrl && !fileSettings.environmentId && !envSettings.environmentId) {
                req.settings.environmentId = req.body.environmentId || req.settings.environmentId;
            }
            req.settings.region = req.body.region || req.settings.region;
            req.settings.apiClientId = req.body.apiClientId || req.settings.apiClientId;
            req.settings.apiSecret = req.body.apiSecret || req.settings.apiSecret;
        }
        
        // Log final settings (masking sensitive data)
        logger.info('Final settings:', {
            environmentId: req.settings.environmentId ? '***' + req.settings.environmentId.slice(-4) : 'not set',
            region: req.settings.region,
            apiClientId: req.settings.apiClientId ? '***' + req.settings.apiClientId.slice(-4) : 'not set',
            apiSecret: req.settings.apiSecret ? '***' + req.settings.apiSecret.slice(-4) : 'not set',
            hasCredentials: !!(req.settings.apiClientId && req.settings.apiSecret)
        });
        
        logger.info('=== Ending injectSettings ===');
        next();
    } catch (error) {
        logger.error('Error in injectSettings middleware:', error);
        next(error);
    }
};

// Enhanced PingOne proxy with automatic token re-authentication
// 
// This proxy automatically handles token expiration by:
// - Detecting 401 responses with token_expired errors
// - Automatically obtaining new tokens using stored credentials
// - Retrying the original request with the new token
// - Providing seamless access without user intervention

const createAutoRetryProxy = (tokenManager) => {
    return async (req, res) => {
        const requestId = uuidv4();
        const startTime = Date.now();
        
        try {
            // Get target URL from query parameters
            const targetUrl = req.query.url;
            if (!targetUrl) {
                return res.status(400).json({ error: 'Target URL is required' });
            }
            
            // Determine if this is an auth request (don't retry auth requests)
            const isAuthRequest = targetUrl.includes('/as/token');
            
            console.log(`[${requestId}] Proxying to: ${targetUrl}`);
            
            // Prepare request headers
            const headers = {};
            
            // Copy allowed headers from the original request
            const allowedHeaders = [
                'accept',
                'accept-encoding',
                'authorization',
                'content-type',
                'x-request-id'
            ];
            
            Object.entries(req.headers).forEach(([key, value]) => {
                const lowerKey = key.toLowerCase();
                if (allowedHeaders.includes(lowerKey)) {
                    headers[key] = value;
                }
            });
            
            // Add our own headers
            headers['x-request-id'] = requestId;
            headers['accept'] = 'application/json';
            
            // For non-auth requests, add authorization header with token
            if (!isAuthRequest) {
                try {
                    const token = await tokenManager.getAccessToken({
                        apiClientId: req.settings?.apiClientId,
                        apiSecret: req.settings?.apiSecret,
                        environmentId: req.settings?.environmentId,
                        region: req.settings?.region
                    });
                    headers['Authorization'] = `Bearer ${token}`;
                } catch (error) {
                    console.error(`[${requestId}] Error obtaining access token:`, error.message);
                    return res.status(401).json({ 
                        error: 'Failed to authenticate with PingOne API', 
                        details: error.message 
                    });
                }
            }
            
            // Log the outgoing request for debugging
            console.log(`[${requestId}] Proxying request:`, {
                method: req.method,
                url: targetUrl,
                headers: {
                    ...headers,
                    'Authorization': headers['Authorization'] ? '***REDACTED***' : 'Not set'
                },
                body: req.body ? '***BODY***' : 'No body'
            });
            
            // Make the request with automatic retry on token expiration
            const response = await tokenManager.retryWithNewToken(async (token) => {
                // Update authorization header with new token
                if (!isAuthRequest) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                
                // Prepare request options
                const fetchOptions = {
                    method: req.method,
                    headers: headers,
                    timeout: 30000 // 30 second timeout
                };
                
                // Add body for non-GET/HEAD requests
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    if (req.body) {
                        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
                    }
                }
                
                return await fetch(targetUrl, fetchOptions);
            });
            
            // Forward the response
            const contentType = response.headers.get('content-type') || '';
            const responseData = contentType.includes('application/json') 
                ? await response.json() 
                : await response.text();
            
            // Log response for debugging
            console.log(`[${requestId}] Response received:`, {
                status: response.status,
                statusText: response.statusText,
                contentType: contentType,
                responseTime: `${Date.now() - startTime}ms`
            });
            
            // Forward the response status and headers
            res.status(response.status);
            
            // Copy relevant headers
            const responseHeaders = response.headers;
            ['content-type', 'content-length', 'cache-control'].forEach(header => {
                const value = responseHeaders.get(header);
                if (value) {
                    res.set(header, value);
                }
            });
            
            // Send the response data
            if (contentType.includes('application/json')) {
                res.json(responseData);
            } else {
                res.send(responseData);
            }
            
        } catch (error) {
            console.error(`[${requestId}] Proxy error:`, error.message);
            
            // Handle specific error types
            if (error.message.includes('Rate limit exceeded')) {
                return res.status(429).json({ 
                    error: 'Rate limit exceeded', 
                    details: 'Too many requests to PingOne API' 
                });
            }
            
            if (error.message.includes('Max retries exceeded')) {
                return res.status(500).json({ 
                    error: 'Service temporarily unavailable', 
                    details: 'Failed to authenticate after multiple attempts' 
                });
            }
            
            return res.status(500).json({ 
                error: 'Proxy error', 
                details: error.message 
            });
        }
    };
};

// Apply middleware and routes
router.use('/', (req, res, next) => {
    // Get token manager from app
    const tokenManager = req.app.get('tokenManager');
    if (!tokenManager) {
        return res.status(500).json({ error: 'Token manager not available' });
    }
    
    // Create auto-retry proxy for this request
    const autoRetryProxy = createAutoRetryProxy(tokenManager);
    return autoRetryProxy(req, res, next);
});

// Apply middleware and routes
// Note: express.json() is already applied by the main server

// Apply CORS headers to all responses
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-PingOne-Environment-Id, X-PingOne-Region');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Apply settings middleware
router.use(injectSettings);
router.use(validateSettings);

// Apply rate limiting middleware
router.use(pingoneApiLimiter);

// Handle specific endpoints that don't exist in PingOne API
router.get('/token', (req, res) => {
    res.status(404).json({
        error: 'Endpoint Not Found',
        message: 'The /token endpoint does not exist in the PingOne API. Use the server\'s token manager for authentication.',
        availableEndpoints: [
            '/environments/{environmentId}/users',
            '/environments/{environmentId}/populations',
            '/environments/{environmentId}/applications',
            '/environments/{environmentId}/groups'
        ]
    });
});

router.post('/token', (req, res) => {
    res.status(404).json({
        error: 'Endpoint Not Found',
        message: 'The /token endpoint does not exist in the PingOne API. Use the server\'s token manager for authentication.',
        availableEndpoints: [
            '/environments/{environmentId}/users',
            '/environments/{environmentId}/populations',
            '/environments/{environmentId}/applications',
            '/environments/{environmentId}/groups'
        ]
    });
});

// Proxy all other requests to PingOne API
router.all('*', (req, res, next) => {
    // Get token manager from app
    const tokenManager = req.app.get('tokenManager');
    if (!tokenManager) {
        return res.status(500).json({ error: 'Token manager not available' });
    }
    
    // Create auto-retry proxy for this request
    const autoRetryProxy = createAutoRetryProxy(tokenManager);
    return autoRetryProxy(req, res, next);
});

// Export the router
export default router;
