// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');

// Import logging and monitoring utilities
const { logger } = require('./utils/logger');
const { healthMonitor } = require('./utils/healthMonitor');
const { 
  activityLogger, 
  creditActivityLogger, 
  userActivityLogger, 
  adminActivityLogger, 
  errorLogger,
  requestIdMiddleware 
} = require('./middleware/activityLogger');

// Import enhanced rate limiting
const { 
  generalLimiter, 
  oauthLimiter, 
  adminLimiter,
  getRateLimitStats 
} = require('./middleware/rateLimiting');

const app = express();
const PORT = process.env.PORT || 3002;

// Trust proxy for rate limiting (needed when behind React dev server proxy)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003',
  credentials: true
}));

// Enhanced rate limiting with different limits for different endpoints
app.use(generalLimiter);

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Logging middleware
app.use(morgan('combined'));

// Activity logging middleware
app.use(activityLogger);

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'lending-service-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Import route handlers
const userRoutes = require('./routes/users');
const creditRoutes = require('./routes/credit');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const oauthRoutes = require('./routes/oauth');

// Mount API routes with specific activity logging and rate limiting
app.use('/api/auth/oauth', oauthLimiter, oauthRoutes);
app.use('/api/users', userActivityLogger, userRoutes);
app.use('/api/credit', creditActivityLogger, creditRoutes);
app.use('/health', healthRoutes);
app.use('/api/admin', adminLimiter, adminActivityLogger, adminRoutes);

// Basic health check endpoint
app.get('/api/healthz', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'lending-api-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Legacy health check endpoint (redirect to new health routes)
app.get('/api/health', (req, res) => {
  res.redirect('/health');
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Lending API Server', 
    version: '1.0.0',
    service: 'consumer-lending-service',
    endpoints: [
      '/api/auth',
      '/api/users', 
      '/api/credit',
      '/api/admin'
    ],
    documentation: '/api/docs',
    health: '/health'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Consumer Lending API',
    version: '1.0.0',
    description: 'API for consumer lending operations including credit scoring and limit determination',
    endpoints: {
      authentication: {
        'POST /api/auth/login': 'Initiate OAuth login flow',
        'GET /api/auth/oauth/callback': 'OAuth callback endpoint',
        'POST /api/auth/logout': 'Logout and clear session'
      },
      users: {
        'GET /api/users': 'List all users (admin only)',
        'GET /api/users/:id': 'Get specific user profile',
        'GET /api/users/me': 'Get current user profile'
      },
      credit: {
        'GET /api/credit/:userId/score': 'Get credit score for user',
        'GET /api/credit/:userId/limit': 'Get credit limit for user',
        'GET /api/credit/:userId/assessment': 'Get full credit assessment'
      },
      admin: {
        'GET /api/admin/users': 'Admin user management',
        'GET /api/admin/credit/reports': 'Credit reporting',
        'POST /api/admin/credit/recalculate': 'Trigger credit recalculation'
      }
    },
    scopes: {
      'lending:read': 'Basic user and lending data access',
      'lending:credit:read': 'Credit score access',
      'lending:credit:limits': 'Credit limit access',
      'lending:admin': 'Administrative access'
    },
    rateLimiting: {
      general: '500 requests per 15 minutes (development)',
      oauth: '100 requests per 15 minutes (development)',
      admin: '200 requests per 15 minutes (development)'
    }
  });
});

// Rate limiting status endpoint (admin only)
app.get('/api/admin/rate-limit-stats', (req, res) => {
  // Simple auth check - in production you'd want proper middleware
  if (!req.session?.user?.role || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const stats = getRateLimitStats();
  res.json({
    ...stats,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware with comprehensive logging
app.use(errorLogger);
app.use((err, req, res, next) => {
  // Determine error type and status code
  let statusCode = 500;
  let errorCode = 'internal_server_error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'validation_error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorCode = 'unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorCode = 'forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'not_found';
  }

  // Log the error with structured logging
  logger.logErrorHandling(errorCode, {
    error_message: err.message,
    error_stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    status_code: statusCode,
    path: req.path,
    method: req.method,
    user_id: req.user?.sub || req.user?.id || 'anonymous',
    request_id: req.id
  });
  
  res.status(statusCode).json({ 
    error: errorCode,
    error_description: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    request_id: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'not_found',
    error_description: 'The requested endpoint was not found',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    available_endpoints: [
      '/api/healthz',
      '/health',
      '/api/docs',
      '/api/auth',
      '/api/users',
      '/api/credit',
      '/api/admin'
    ]
  });
});

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    // Log server startup
    logger.info('SERVER', 'Lending API server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      pid: process.pid
    });

    console.log(`Lending API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API documentation: http://localhost:${PORT}/api/docs`);

    // Start periodic health checks
    healthMonitor.startPeriodicChecks(300000); // 5 minutes

    // Log initial health check
    setTimeout(async () => {
      try {
        await healthMonitor.runAllChecks();
        logger.info('SERVER', 'Initial health check completed');
      } catch (error) {
        logger.error('SERVER', 'Initial health check failed', {
          error: error.message
        });
      }
    }, 5000); // Wait 5 seconds after startup
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    logger.info('SERVER', 'SIGTERM received, shutting down gracefully');
    healthMonitor.stopPeriodicChecks();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SERVER', 'SIGINT received, shutting down gracefully');
    healthMonitor.stopPeriodicChecks();
    process.exit(0);
  });
}

module.exports = app;