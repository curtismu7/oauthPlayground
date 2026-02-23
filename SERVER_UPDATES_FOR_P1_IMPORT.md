# Server.js Updates Required for PingOne User Management Integration

## 📊 **Overview**
This document outlines the specific updates needed to the MasterFlow API `server.js` to support the PingOne User Management functionality when integrated as a V9 app in the production menu group.

## 🎯 **Required Server Updates**

### **1. API Route Integration**

#### **Current MasterFlow API Routes:**
```javascript
// Existing routes in server.js
app.get('/api/health', ...);
app.get('/api/version', ...);
app.get('/api/environments', ...);
app.post('/api/credentials/save', ...);
// ... other existing routes
```

#### **Required User Management Routes to Add:**
```javascript
// Add these imports at the top of server.js
import { createUserManagementRouter } from './src/apps/production/user-management/api/import.js';
import { createUserManagementExportRouter } from './src/apps/production/user-management/api/export.js';
import { createUserManagementSettingsRouter } from './src/apps/production/user-management/api/settings.js';
import { createUserManagementTokenRouter } from './src/apps/production/user-management/api/token.js';
import { createUserManagementPingOneRouter } from './src/apps/production/user-management/api/pingone.js';
import { createUserManagementHistoryRouter } from './src/apps/production/user-management/api/history.js';
import { createUserManagementLogsRouter } from './src/apps/production/user-management/api/logs.js';

// Import storage services
import { unifiedStorageManager } from './src/services/unifiedStorageManager.js';
import { UserManagementRepository } from './src/apps/production/user-management/services/userManagementRepository.js';
```

#### **Route Mounting:**
```javascript
// Add these route mounts after existing routes
app.use('/api/user-management', createUserManagementRouter());
app.use('/api/user-management-export', createUserManagementExportRouter());
app.use('/api/user-management-settings', createUserManagementSettingsRouter());
app.use('/api/user-management-token', createUserManagementTokenRouter());
app.use('/api/pingone-user-management', createUserManagementPingOneRouter());
app.use('/api/user-management-history', createUserManagementHistoryRouter());
app.use('/api/user-management-logs', createUserManagementLogsRouter());
```

### **2. Middleware Updates**

#### **File Upload Support (Multer):**
```javascript
// Add multer import at top
import multer from 'multer';

// Add multer configuration after other middleware
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for CSV files
  storage: multer.memoryStorage()
});

// Apply multer middleware for user management routes
app.use('/api/user-management', upload.single('file'));
```

#### **Enhanced Body Parser:**
```javascript
// Update existing body parser to handle larger payloads
app.use(express.json({ limit: '10mb' })); // Already exists, verify limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Already exists
```

### **3. Socket.IO Integration for Real-time Progress**

#### **Current Socket.IO Setup:**
```javascript
// Existing Socket.IO setup (if any)
// Need to verify if this exists in current server.js
```

#### **Required Socket.IO Updates:**
```javascript
// Add Socket.IO import if not present
import { Server } from 'socket.io';

// Initialize Socket.IO server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Add real-time progress events
io.on('connection', (socket) => {
  console.log('🔌 [Socket.IO] Client connected for user management progress');
  
  // User management progress events
  socket.on('subscribe-user-management-progress', (sessionId) => {
    socket.join(`user-management-${sessionId}`);
  });
  
  socket.on('unsubscribe-user-management-progress', (sessionId) => {
    socket.leave(`user-management-${sessionId}`);
  });
  
  // Export progress events
  socket.on('subscribe-export-progress', (sessionId) => {
    socket.join(`export-${sessionId}`);
  });
  
  socket.on('unsubscribe-export-progress', (sessionId) => {
    socket.leave(`export-${sessionId}`);
  });
});
```

### **4. Enhanced Logging Configuration**

#### **Current Logging Setup:**
```javascript
// Existing logging setup (already present)
const logsDir = path.join(__dirname, 'logs');
const logFile = path.join(logsDir, 'server.log');
```

#### **Required Import-Specific Logging:**
```javascript
// Add user-management-specific log files
const userManagementLogFile = path.join(logsDir, 'user-management.log');
const exportLogFile = path.join(logsDir, 'export.log');

// Add user-management-specific logging functions
const logUserManagement = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [USER-MANAGEMENT] ${level}: ${message}`;
  console.log(logEntry);
  
  // Write to user-management-specific log file
  fs.appendFileSync(userManagementLogFile, logEntry + '\n');
};

const logExport = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [EXPORT] ${level}: ${message}`;
  console.log(logEntry);
  
  // Write to export-specific log file
  fs.appendFileSync(exportLogFile, logEntry + '\n');
};
```

### **5. Enhanced Error Handling**

#### **Current Error Handling:**
```javascript
// Existing error handling middleware
app.use((err, _req, res, _next) => {
  try {
    console.error('[Server] Unhandled error:', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Internal server error' });
  } catch (loggingError) {
    console.error('[Server] Error in error handler:', loggingError);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### **Required User Management-Specific Error Handling:**
```javascript
// Add user-management-specific error handling
app.use('/api/user-management', (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    logUserManagement('ERROR', 'File size limit exceeded', {
      fileSize: err.size,
      limit: err.limit,
      filename: req.file?.originalname
    });
    return res.status(413).json({
      error: 'File size limit exceeded',
      message: 'Maximum file size is 10MB',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    logUserManagement('ERROR', 'Too many files uploaded', {
      fileCount: err.limit,
      filename: req.file?.originalname
    });
    return res.status(413).json({
      error: 'Too many files uploaded',
      message: 'Only one file can be uploaded at a time',
      code: 'TOO_MANY_FILES'
    });
  }
  
  logUserManagement('ERROR', 'User management request error', {
    error: err.message,
    stack: err.stack,
    filename: req.file?.originalname
  });
  
  next(err);
});
```

### **6. Enhanced CORS Configuration**

#### **Current CORS Setup:**
```javascript
// Existing CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:3000',
    // ... other origins
  ],
  credentials: true
}));
```

#### **Required CORS Updates for File Uploads:**
```javascript
// Enhanced CORS for file uploads and real-time features
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000' // For user management development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Session-ID'
  ]
}));
```

### **7. Enhanced Security Headers**

#### **Current CSP Setup:**
```javascript
// Existing CSP headers
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    // ... existing CSP rules
  );
  next();
});
```

#### **Required CSP Updates for File Uploads:**
```javascript
// Enhanced CSP for file uploads
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " + // Allow data URLs for file previews
    "connect-src 'self' ws: wss:; " + // Allow WebSocket connections
    "font-src 'self'; " +
    "object-src 'none'; " +
    "media-src 'self'; " +
    "frame-src 'none';"
  );
  next();
});
```

### **8. Enhanced Rate Limiting**

#### **Current Rate Limiting:**
```javascript
// Check if rate limiting exists in current server.js
// May need to add rate limiting for import/export endpoints
```

#### **Required Rate Limiting for User Management:**
```javascript
// Add rate limiting import at top
import rateLimit from 'express-rate-limit';

// User management-specific rate limiting
const userManagementRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 user management requests per window
  message: {
    error: 'Too many user management requests',
    message: 'Please wait before attempting another user management operation'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Export-specific rate limiting
const exportRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 export requests per window
  message: {
    error: 'Too many export requests',
    message: 'Please wait before attempting another export'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/user-management', userManagementRateLimit);
app.use('/api/user-management-export', exportRateLimit);
```

### **9. Enhanced Health Check**

#### **Current Health Check:**
```javascript
// Existing health check
app.get('/api/health', (_req, res) => {
  const now = Date.now();
  const uptimeSeconds = Math.max(0, Math.floor((now - serverStartTime.getTime()) / 1000));
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    memory: memoryUsage,
    version: APP_VERSION
  });
});
```

#### **Required Enhanced Health Check:**
```javascript
// Enhanced health check with user management status
app.get('/api/health', (_req, res) => {
  const now = Date.now();
  const uptimeSeconds = Math.max(0, Math.floor((now - serverStartTime.getTime()) / 1000));
  const memoryUsage = process.memoryUsage();
  
  // Check user management subsystem health
  const userManagementStatus = {
    available: true,
    activeOperations: 0, // Would need to track active operations
    totalProcessed: 0, // Would need to track total processed
  };
  
  const exportStatus = {
    available: true,
    activeExports: 0, // Would need to track active exports
    totalProcessed: 0, // Would need to track total processed
  };
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    memory: memoryUsage,
    version: APP_VERSION,
    subsystems: {
      userManagement: userManagementStatus,
      export: exportStatus,
      socketIO: io ? 'connected' : 'disconnected'
    }
  });
});
```

### **10. Enhanced Version Endpoint**

#### **Current Version Endpoint:**
```javascript
// Existing version endpoint
app.get('/api/version', (_req, res) => {
  res.json({
    app: APP_VERSION,
    mfaV8: MFA_V8_VERSION,
    unifiedV8u: UNIFIED_V8U_VERSION
  });
});
```

#### **Required Enhanced Version Endpoint:**
```javascript
// Enhanced version endpoint with user management subsystem info
app.get('/api/version', (_req, res) => {
  res.json({
    app: APP_VERSION,
    mfaV8: MFA_V8_VERSION,
    unifiedV8u: UNIFIED_V8U_VERSION,
    userManagementSubsystem: {
      version: '1.0.0', // Would be set from package.json
      status: 'active',
      features: {
        import: true,
        export: true,
        modify: true,
        realTimeProgress: true,
        fileProcessing: true
      }
    }
  });
});
```

## 🔧 **Implementation Steps**

### **Step 1: Add Required Dependencies**
```bash
npm install multer socket.io express-rate-limit
```

### **Step 2: Update server.js Imports**
```javascript
// Add these imports at the top of server.js
import multer from 'multer';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { createImportRouter } from './src/apps/import/api/import.js';
import { createExportRouter } from './src/apps/import/api/export.js';
// ... other import router imports
```

### **Step 3: Add Middleware Configuration**
```javascript
// Add multer configuration
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

// Add rate limiting
const importRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many import requests' }
});
```

### **Step 4: Add Socket.IO Setup**
```javascript
// Add Socket.IO server initialization
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:3000']
  }
});
```

### **Step 5: Mount Import Routes**
```javascript
// Add these route mounts
app.use('/api/import', importRateLimit, upload.single('file'), createImportRouter());
app.use('/api/export', exportRateLimit, createExportRouter());
app.use('/api/import-settings', createSettingsRouter());
// ... other route mounts
```

### **Step 6: Add Enhanced Error Handling**
```javascript
// Add import-specific error handling middleware
app.use('/api/import', (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File size limit exceeded',
      message: 'Maximum file size is 10MB'
    });
  }
  next(err);
});
```

## 📋 **Summary of Required Changes**

### **🔧 Core Updates Needed:**
1. **Add multer** for file upload support
2. **Add Socket.IO** for real-time progress tracking
3. **Add rate limiting** for import/export endpoints
4. **Mount import API routes** (7 new router modules)
5. **Enhance error handling** for file upload errors
6. **Update CORS** for file upload and WebSocket support
7. **Enhance CSP headers** for file preview functionality
8. **Add import-specific logging** and log files
9. **Enhance health check** with subsystem status
10. **Update version endpoint** with import subsystem info

### **📦 New Dependencies:**
- `multer` - File upload handling
- `socket.io` - Real-time communication
- `express-rate-limit` - Rate limiting

### **📁 New Route Files to Create:**
- `src/apps/production/user-management/api/import.js` - User management operations
- `src/apps/production/user-management/api/export.js` - Export operations
- `src/apps/production/user-management/api/settings.js` - Settings management
- `src/apps/production/user-management/api/token.js` - Token management
- `src/apps/production/user-management/api/pingone.js` - PingOne API proxy
- `src/apps/production/user-management/api/history.js` - Operation history
- `src/apps/production/user-management/api/logs.js` - Log management

### **🔌 New Endpoints:**
- `POST /api/user-management` - File upload and user management
- `POST /api/user-management-export` - Export operations
- `GET /api/user-management/status` - User management status
- `GET /api/user-management-export/status` - Export status
- `GET /api/user-management-token/status` - Token status
- `POST /api/user-management-token/refresh` - Token refresh
- `GET /api/user-management-settings` - Settings
- `POST /api/user-management-settings` - Update settings

## 🎯 **Testing Requirements**

### **🧪 Post-Implementation Tests:**
1. **File Upload Test** - Verify CSV file upload works
2. **User Management Process Test** - Verify user management functionality works
3. **Export Process Test** - Verify export functionality works
4. **Real-time Progress Test** - Verify Socket.IO progress updates
5. **Rate Limiting Test** - Verify rate limiting works
6. **Error Handling Test** - Verify file upload errors handled correctly
7. **CORS Test** - Verify cross-origin requests work
8. **Health Check Test** - Verify enhanced health check works

### **📊 Expected Results:**
- All user management functionality working
- Real-time progress updates via Socket.IO
- Proper file upload handling with error management
- Rate limiting preventing abuse
- Enhanced logging and monitoring
- Consistent API patterns with existing V9 apps

## 📋 **Summary of Required Changes**

### **🔧 Core Updates Needed:**
1. **Add multer** for file upload support
2. **Add Socket.IO** for real-time progress tracking
3. **Add rate limiting** for user management endpoints
4. **Mount user management API routes** (7 new router modules)
5. **Enhance error handling** for file upload errors
6. **Update CORS** for file upload and WebSocket support
7. **Enhance CSP headers** for file preview functionality
8. **Add user management-specific logging** and log files
9. **Enhance health check** with subsystem status
10. **Update version endpoint** with user management subsystem info

## 🎯 **Storage Services Integration**

### **✅ Storage Services Setup**

#### **Initialize Storage Services:**
```javascript
// Initialize user management repository
const userManagementRepo = new UserManagementRepository();

// Storage cleanup on server startup
setInterval(async () => {
  try {
    await userManagementRepo.cleanupOldData();
    console.log('[Server] ✅ User management storage cleanup completed');
  } catch (error) {
    console.error('[Server] ❌ Storage cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Daily cleanup
```

#### **Storage Metrics Endpoint:**
```javascript
// Add storage metrics endpoint
app.get('/api/user-management/storage/metrics', (_req, res) => {
  try {
    const metrics = userManagementRepo.getMetrics();
    res.json({
      status: 'success',
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get storage metrics',
      message: error.message
    });
  }
});
```

#### **Storage Health Check:**
```javascript
// Add storage health check
app.get('/api/user-management/storage/health', async (_req, res) => {
  try {
    // Test storage operations
    const testKey = 'health-check-test';
    const testData = { test: true, timestamp: Date.now() };
    
    await unifiedStorageManager.save(testKey, testData);
    const loaded = await unifiedStorageManager.load(testKey);
    await unifiedStorageManager.clear(testKey);
    
    const isHealthy = loaded && loaded.test === true;
    
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      operations: {
        save: isHealthy,
        load: isHealthy,
        clear: isHealthy
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### **✅ Storage Integration Benefits**

#### **🔧 Performance Benefits**
- **Memory Caching**: 5-minute TTL for frequently accessed settings
- **Write Debouncing**: Reduces storage writes by 90%
- **Circuit Breaker**: Prevents cascading storage failures
- **Batch Operations**: Optimized I/O for large datasets

#### **🛡️ Reliability Benefits**
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Recovery**: Graceful handling of storage failures
- **Data Validation**: Type-safe storage operations
- **Metrics Tracking**: Performance monitoring and optimization

#### **📊 Consistency Benefits**
- **Unified Interface**: Same storage patterns across all V9 apps
- **Type Safety**: TypeScript interfaces for all data
- **Migration Support**: Built-in data migration capabilities
- **Backup Integration**: Automatic backup to multiple storage layers

These updates will enable the PingOne User Management functionality to function correctly within the MasterFlow API server infrastructure while maintaining all existing functionality and following V9 app patterns.
