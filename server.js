// File: server.js
// Description: Main server entry point for PingOne user import tool
// 
// This file sets up the Express server with all necessary middleware,
// route handlers, and server management functionality. It handles:
// - Express app configuration and middleware setup
// - Rate limiting and security measures
// - API routing and request handling
// - Logging and monitoring
// - Graceful shutdown and error handling
// - Token management and authentication
// 
// The server provides both REST API endpoints and serves the frontend application.

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWinstonLogger, createRequestLogger, createErrorLogger, createPerformanceLogger } from './server/winston-config.js';
import TokenManager from './server/token-manager.js';
import pingoneProxyRouter from './routes/pingone-proxy.js';
import apiRouter from './routes/api/index.js';
import settingsRouter from './routes/settings.js';
import logsRouter from './routes/logs.js';
import indexRouter from './routes/index.js';
import { setupSwagger } from './swagger.js';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create production-ready Winston logger
const logger = createWinstonLogger({
    service: 'pingone-import',
    env: process.env.NODE_ENV || 'development',
    enableFileLogging: process.env.NODE_ENV !== 'test'
});

// Create specialized loggers
const requestLogger = createRequestLogger(logger);
const errorLogger = createErrorLogger(logger);
const performanceLogger = createPerformanceLogger(logger);

// Initialize TokenManager with enhanced logging
const tokenManager = new TokenManager(logger);

// Server state management
const serverState = {
    isInitialized: false,
    isInitializing: false,
    lastError: null,
    pingOneInitialized: false
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Attach token manager to app for route access
app.set('tokenManager', tokenManager);

// Enhanced request logging middleware
app.use(requestLogger);

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
        process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'] : 
        true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with enhanced limits
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Static file serving with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    etag: true,
    lastModified: true
}));

// --- Auth routes ---
app.get('/auth/login', (req, res) => {
  res.send('<h2>Login Required</h2><p>Please log in to continue.</p>');
});

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/auth/login');
  });
});

app.get('/auth/denied', (req, res) => {
  res.status(403).send('<h2>Access Denied</h2><p>Your account is not authorized to view this page.</p>');
});

// --- Auth middleware ---
function ensureAuthenticated(req, res, next) {
  // No authentication required for now, as Google OAuth is removed
  return next();
}

// --- Protect Swagger UI and spec ---
app.use(['/swagger/html', '/swagger', '/swagger.json'], ensureAuthenticated);

// Setup Swagger documentation
setupSwagger(app);

console.log('📚 Swagger UI available at http://localhost:4000/swagger/html');
console.log('📄 Swagger JSON available at http://localhost:4000/swagger.json');

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: |
 *       Returns comprehensive health status of the server and all services.
 *       This endpoint provides detailed information about server state, PingOne connectivity,
 *       system resources, and various health checks.
 *       
 *       ## Health Checks
 *       - **Server Status**: Initialization state and last errors
 *       - **PingOne Connectivity**: API credentials and connection status
 *       - **System Resources**: Memory usage, uptime, and performance metrics
 *       - **Environment**: Node.js version, platform, and configuration
 *       
 *       ## Usage
 *       - Use for monitoring and alerting systems
 *       - Check before performing critical operations
 *       - Monitor system resource usage
 *       
 *       ## Response Details
 *       - `status`: Overall health status ('ok' or 'error')
 *       - `server`: Server initialization and PingOne connection status
 *       - `system`: Node.js version, memory usage, and platform info
 *       - `checks`: Individual health check results
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             example:
 *               status: "ok"
 *               timestamp: "2025-07-12T15:35:29.053Z"
 *               uptime: 5.561143042
 *               server:
 *                 isInitialized: true
 *                 isInitializing: false
 *                 pingOneInitialized: true
 *                 pingOne:
 *                   initialized: true
 *                   hasRequiredConfig: true
 *                   environmentId: "configured"
 *                   region: "NorthAmerica"
 *               system:
 *                 node: "v22.16.0"
 *                 platform: "darwin"
 *                 memory:
 *                   rss: 105086976
 *                   heapTotal: 38617088
 *                   heapUsed: 22732848
 *                 memoryUsage: "59%"
 *                 env: "development"
 *                 pid: 3317
 *               checks:
 *                 pingOneConfigured: "ok"
 *                 pingOneConnected: "ok"
 *                 memory: "ok"
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               error: "Health check failed"
 *               timestamp: "2025-07-12T15:35:29.053Z"
 */
// Health check endpoint with enhanced logging
app.get('/api/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
        // Get server status
        const serverStatus = {
            isInitialized: serverState.isInitialized,
            isInitializing: serverState.isInitializing,
            lastError: serverState.lastError?.message,
            pingOneInitialized: serverState.pingOneInitialized
        };
        
        // Check PingOne environment variables
        const hasRequiredPingOneVars = process.env.PINGONE_CLIENT_ID && 
                                     process.env.PINGONE_CLIENT_SECRET && 
                                     process.env.PINGONE_ENVIRONMENT_ID;
        
        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        const status = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            server: {
                ...serverStatus,
                pingOne: {
                    initialized: serverStatus.pingOneInitialized,
                    hasRequiredConfig: hasRequiredPingOneVars,
                    environmentId: process.env.PINGONE_ENVIRONMENT_ID ? 'configured' : 'not configured',
                    region: process.env.PINGONE_REGION || 'not configured'
                }
            },
            system: {
                node: process.version,
                platform: process.platform,
                memory: memoryUsage,
                memoryUsage: `${Math.round(memoryUsagePercent)}%`,
                env: process.env.NODE_ENV || 'development',
                pid: process.pid
            },
            checks: {
                pingOneConfigured: hasRequiredPingOneVars ? 'ok' : 'error',
                pingOneConnected: serverStatus.pingOneInitialized ? 'ok' : 'error',
                memory: memoryUsagePercent < 90 ? 'ok' : 'warn'
            }
        };
        
        const duration = Date.now() - startTime;
        performanceLogger('health_check', duration, { status: 'ok' });
        
        logger.info('Health check completed', {
            duration: `${duration}ms`,
            status: 'ok',
            checks: status.checks
        });
        
        res.json(status);
    } catch (error) {
        const duration = Date.now() - startTime;
        performanceLogger('health_check', duration, { status: 'error', error: error.message });
        
        logger.error('Health check failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API routes with enhanced logging
app.use('/api', apiRouter);
app.use('/api/pingone', pingoneProxyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/logs', logsRouter);
app.use('/', indexRouter);

// Enhanced error handling middleware (structured, safe, Winston-logged)
app.use((err, req, res, next) => {
    // Log full error details with Winston
    logger.error('API Error', {
        message: err.message,
        stack: err.stack,
        code: err.code || 'INTERNAL_ERROR',
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body ? JSON.stringify(req.body).substring(0, 500) : null,
        timestamp: new Date().toISOString()
    });

    // Determine safe, actionable message for user
    let userMessage = 'An unexpected error occurred. Please try again.';
    let code = 'INTERNAL_ERROR';
    let status = 500;
    
    // Handle specific error types with user-friendly messages
    if (err.isJoi || err.name === 'ValidationError') {
        userMessage = err.details?.[0]?.message || 'Please check your input and try again.';
        code = 'VALIDATION_ERROR';
        status = 400;
    } else if (err.code === 'UNAUTHORIZED' || err.status === 401) {
        userMessage = 'Session expired – please log in again.';
        code = 'AUTH_ERROR';
        status = 401;
    } else if (err.code === 'FORBIDDEN' || err.status === 403) {
        userMessage = 'Access denied. Please check your permissions.';
        code = 'FORBIDDEN';
        status = 403;
    } else if (err.code === 'NOT_FOUND' || err.status === 404) {
        userMessage = 'Resource not found. Please check your settings.';
        code = 'NOT_FOUND';
        status = 404;
    } else if (err.code === 'RATE_LIMIT' || err.status === 429) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
        code = 'RATE_LIMIT';
        status = 429;
    } else if (err.code === 'MAINTENANCE') {
        userMessage = 'Service is temporarily unavailable for maintenance.';
        code = 'MAINTENANCE';
        status = 503;
    } else if (err.code === 'TIMEOUT') {
        userMessage = 'Request timed out. Please try again.';
        code = 'TIMEOUT';
        status = 408;
    } else if (err.code === 'NETWORK_ERROR') {
        userMessage = 'Network error. Please check your connection.';
        code = 'NETWORK_ERROR';
        status = 503;
    } else if (err.code === 'FILE_TOO_LARGE') {
        userMessage = 'File is too large. Please use a smaller file.';
        code = 'FILE_TOO_LARGE';
        status = 413;
    } else if (err.code === 'INVALID_FILE_TYPE') {
        userMessage = 'Invalid file type. Please use a CSV file.';
        code = 'INVALID_FILE_TYPE';
        status = 400;
    } else if (err.code === 'POPULATION_NOT_FOUND') {
        userMessage = 'Selected population not found. Please check your settings.';
        code = 'POPULATION_NOT_FOUND';
        status = 404;
    } else if (err.code === 'TOKEN_EXPIRED') {
        userMessage = 'Authentication token expired. Please refresh and try again.';
        code = 'TOKEN_EXPIRED';
        status = 401;
    } else if (err.expose && err.message) {
        userMessage = err.message;
        code = err.code || 'ERROR';
        status = err.status || 400;
    }

    // Send structured error response
    res.status(status).json({
        success: false,
        error: userMessage,
        code,
        timestamp: new Date().toISOString()
    });
});

// Fallback 404 route (with status message)
app.use('*', (req, res) => {
    // Check if response has already been sent
    if (res.headersSent) {
        return;
    }
    
    logger.warn('404 Not Found', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    res.status(404).json({
        success: false,
        error: 'Page not found.',
        code: 'NOT_FOUND'
    });
});

// Global error handler
app.use(async (err, req, res, next) => {
    // Check if response has already been sent
    if (res.headersSent) {
        return next(err);
    }
    
    // Log the error with full context
    logger.error('Unhandled application error', {
        error: err.message,
        stack: err.stack,
        code: err.code,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body ? JSON.stringify(req.body).substring(0, 500) : null,
        timestamp: new Date().toISOString()
    });
    
    // Update server state
    serverState.lastError = err;
    
    // Send error response
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        status: err.status || 500,
        timestamp: new Date().toISOString()
    });
});

// Server startup with enhanced logging
const startServer = async () => {
    const startTime = Date.now();
    
    try {
        logger.info('Starting server initialization', {
            port: PORT,
            env: process.env.NODE_ENV || 'development',
            pid: process.pid
        });
        
        if (serverState.isInitializing) {
            throw new Error('Server initialization already in progress');
        }
        
        if (serverState.isInitialized) {
            throw new Error('Server is already initialized');
        }
        
        serverState.isInitializing = true;
        serverState.lastError = null;
        
        // Initialize PingOne connection
        logger.info('Initializing PingOne connection');
        try {
            await tokenManager.getAccessToken();
            serverState.pingOneInitialized = true;
            logger.info('PingOne connection established successfully');
        } catch (error) {
            logger.warn('Failed to initialize PingOne connection', {
                error: error.message,
                code: error.code,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
            });
            serverState.pingOneInitialized = false;
        }
        
        // Start server
        const server = app.listen(PORT, '127.0.0.1', () => {
            const duration = Date.now() - startTime;
            const url = `http://127.0.0.1:${PORT}`;
            
            serverState.isInitialized = true;
            serverState.isInitializing = false;
            
            performanceLogger('server_startup', duration, { url });
            
            logger.info('Server started successfully', {
                url,
                port: PORT,
                pid: process.pid,
                node: process.version,
                platform: process.platform,
                env: process.env.NODE_ENV || 'development',
                pingOneInitialized: serverState.pingOneInitialized,
                duration: `${duration}ms`
            });
            
            // Console output for development
            if (process.env.NODE_ENV !== 'production') {
                console.log('\n🚀 Server started successfully!');
                console.log('='.repeat(60));
                console.log(`   URL: ${url}`);
                console.log(`   PID: ${process.pid}`);
                console.log(`   Node: ${process.version}`);
                console.log(`   Platform: ${process.platform}`);
                console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`   PingOne: ${serverState.pingOneInitialized ? '✅ Connected' : '⚠️  Not connected'}`);
                console.log(`   📚 Swagger UI: ${url}/swagger.html`);
                console.log(`   📄 Swagger JSON: ${url}/swagger.json`);
                console.log('='.repeat(60) + '\n');
            }
        });
        
        // Handle server errors
        server.on('error', (error) => {
            logger.error('Server error', {
                error: error.message,
                code: error.code,
                stack: error.stack,
                syscall: error.syscall,
                address: error.address,
                port: error.port
            });
            
            serverState.isInitialized = false;
            serverState.isInitializing = false;
            serverState.lastError = error;
            
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        });
        
        return server;
    } catch (error) {
        const duration = Date.now() - startTime;
        performanceLogger('server_startup', duration, { status: 'error', error: error.message });
        
        logger.error('Server startup failed', {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        
        serverState.isInitialized = false;
        serverState.isInitializing = false;
        serverState.lastError = error;
        
        throw error;
    }
};

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);
    
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        code: error.code
    });
    
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise
    });
    
    process.exit(1);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer().catch(error => {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
}

export { app, logger, startServer };
