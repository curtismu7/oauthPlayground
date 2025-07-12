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
import { TokenManager } from './server/token-manager.js';
import pingoneProxyRouter from './routes/pingone-proxy.js';
import apiRouter from './routes/api/index.js';
import settingsRouter from './routes/settings.js';
import logsRouter from './routes/logs.js';
import indexRouter from './routes/index.js';
import { setupSwagger } from './swagger.js';

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

// Setup Swagger documentation
setupSwagger(app);

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

// Enhanced error handling middleware
app.use(errorLogger);

// 404 handler with logging
app.use('*', (req, res) => {
    logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        status: 404,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use(async (err, req, res, next) => {
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
                console.log(`   📚 API Docs: ${url}/api-docs`);
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
if (require.main === module) {
    startServer().catch(error => {
        logger.error('Failed to start server', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
}

export { app, logger, startServer };
