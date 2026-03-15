// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

// Import routes
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const oauthUserRoutes = require('./routes/oauthUser');
const userRoutes = require('./routes/users');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { logActivity } = require('./middleware/activityLogger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Logging middleware
app.use(morgan('combined'));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity logging middleware
app.use(logActivity);



// Health check endpoint
app.get('/api/healthz', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/auth/oauth/user', oauthUserRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/accounts', authenticateToken, accountRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Import OAuth health check and monitoring
const { checkOAuthProviderHealth } = require('./middleware/oauthErrorHandler');
const { oauthMonitor } = require('./utils/oauthMonitor');
const { logger, LOG_CATEGORIES } = require('./utils/logger');
const oauthConfig = require('./config/oauth');

// Enhanced health check endpoint with comprehensive OAuth monitoring
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  const healthStatus = {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    service: 'banking-api-server',
    components: {
      api: 'healthy'
    }
  };

  // Check OAuth provider health with monitoring
  try {
    const oauthHealth = await checkOAuthProviderHealth(oauthConfig);
    const oauthMetrics = oauthMonitor.getMetrics();
    
    healthStatus.components.oauth_provider = oauthHealth.healthy ? 'healthy' : 'unhealthy';
    healthStatus.components.oauth_details = {
      ...oauthHealth,
      metrics: {
        total_requests: oauthMetrics.totalRequests,
        success_rate: oauthMetrics.successRate,
        average_response_time: Math.round(oauthMetrics.averageResponseTime),
        circuit_breaker_open: oauthMetrics.circuitBreaker.isOpen,
        health_status: oauthMetrics.healthStatus,
        recent_errors: oauthMetrics.recentErrors.slice(0, 3) // Last 3 errors
      }
    };
    
    // Determine overall health based on OAuth metrics
    if (!oauthHealth.healthy || oauthMetrics.healthStatus === 'critical') {
      healthStatus.status = 'unhealthy';
    } else if (oauthMetrics.healthStatus === 'degraded' || oauthMetrics.healthStatus === 'unhealthy') {
      healthStatus.status = 'degraded';
    }
    
  } catch (error) {
    healthStatus.components.oauth_provider = 'unhealthy';
    healthStatus.components.oauth_error = error.message;
    healthStatus.status = 'unhealthy';
    
    logger.error(LOG_CATEGORIES.PROVIDER_HEALTH, 'Health check failed for OAuth provider', {
      error_message: error.message,
      error_code: error.code
    });
  }

  const responseTime = Date.now() - startTime;
  healthStatus.response_time_ms = responseTime;

  // Log health check results
  logger.debug(LOG_CATEGORIES.PROVIDER_HEALTH, 'Health check completed', {
    overall_status: healthStatus.status,
    oauth_status: healthStatus.components.oauth_provider,
    response_time_ms: responseTime
  });

  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Start periodic OAuth monitoring (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  oauthMonitor.startPeriodicHealthCheck();
}

// Root endpoint for API-only mode (Docker deployment)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Banking API Server', 
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/users', '/api/accounts', '/api/transactions', '/api/admin'],
    mode: 'api-only'
  });
});

// Redirect /login requests to frontend
app.get('/login', (req, res) => {
  const frontendUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000';
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
  const redirectUrl = queryString ? `${frontendUrl}/login?${queryString}` : `${frontendUrl}/login`;
  res.redirect(redirectUrl);
});

// Import OAuth error handler
const { oauthErrorHandler } = require('./middleware/oauthErrorHandler');

// OAuth error handling middleware (should be before general error handler)
app.use(oauthErrorHandler);

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred for path:', req.path);
  console.error('Error details:', err.message);
  console.error('Full stack:', err.stack);
  res.status(500).json({ 
    error: 'internal_server_error',
    error_description: 'An internal server error occurred',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Banking API server running on port ${PORT}`);
  });
}

module.exports = app;
