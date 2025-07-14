/**
 * @fileoverview Express API routes for PingOne user import tool
 * 
 * This module handles all backend API endpoints for the PingOne user import tool,
 * including user import/export/modify operations, real-time progress tracking via SSE,
 * population validation, and token management.
 * 
 * Key Features:
 * - CSV file upload and parsing
 * - User import with conflict resolution
 * - Real-time progress streaming via Server-Sent Events (SSE)
 * - Population validation and conflict handling
 * - User export in JSON/CSV formats
 * - User modification with batch processing
 * - Token management and authentication
 * - Feature flag management
 * 
 * @author PingOne Import Tool
 * @version 4.9
 */

import { Router } from 'express';
import multer from 'multer';
import { isFeatureEnabled, setFeatureFlag, getAllFeatureFlags, resetFeatureFlags } from '../../server/feature-flags.js';
import { v4 as uuidv4 } from 'uuid';
import { logSSEEvent, handleSSEError, generateConnectionId, updateSSEMetrics } from '../../server/sse-logger.js';
import fetch from 'node-fetch'; // Add this if not already present
import { logSeparator, logTag } from '../../server/winston-config.js';
import serverMessageFormatter from '../../server/message-formatter.js';

// Feature flags configuration object for easy access
const featureFlags = {
  isFeatureEnabled,
  setFeatureFlag,
  getAllFeatureFlags,
  resetFeatureFlags,
};

const router = Router();

// Enable debug logging in development mode
const DEBUG_MODE = process.env.NODE_ENV === 'development';

/**
 * Debug logging utility for server-side diagnostics
 * Provides structured logging with timestamps and area categorization
 * Only active in development mode to avoid production noise
 * 
 * @param {string} area - Log area/tag for categorization (e.g., 'Import', 'SSE', 'User')
 * @param {string} message - Human-readable log message
 * @param {any} data - Optional data object for detailed debugging
 */
function debugLog(area, message, data = null) {
    if (!DEBUG_MODE) return;
    const timestamp = new Date().toISOString();
    const formatted = `[DEBUG - ${area}] ${message}`;
    if (data !== null) {
        console.log(`${timestamp} ${formatted}`, data);
    } else {
        console.log(`${timestamp} ${formatted}`);
    }
}

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

/**
 * Configure multer for secure file uploads
 * Uses memory storage for processing CSV files with 10MB size limit
 * This prevents disk I/O and allows direct buffer access for parsing
 */
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit - sufficient for most CSV files
    }
});

// ============================================================================
// IMPORT PROCESS FUNCTION
// ============================================================================

/**
 * Runs the import process in the background
 * 
 * This function handles the complete import workflow:
 * 1. Parses the uploaded CSV file
 * 2. Validates user data and population information
 * 3. Creates users in PingOne via API calls
 * 4. Sends real-time progress updates via SSE
 * 5. Handles errors and provides detailed logging
 * 
 * @param {string} sessionId - Unique session identifier for SSE communication
 * @param {Object} app - Express app instance for accessing services
 */
async function runImportProcess(sessionId, app) {
    try {
        const logger = app.get('importLogger') || console;
        logger.info(logSeparator());
        logger.info(logTag('START OF IMPORT'), { tag: logTag('START OF IMPORT'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Import process started`, { sessionId });
        if (logger.flush) await logger.flush();
        
        debugLog("Import", "🔄 Starting import process", { sessionId });
        
        // Get import session data
        const importSessions = app.get('importSessions');
        const session = importSessions.get(sessionId);
        if (!session) {
            throw new Error('Import session not found');
        }
        
        const { file, populationId, populationName, totalUsers } = session;
        
        // Parse CSV file
        debugLog("Import", "📄 Parsing CSV file", { fileName: file.originalname });
        const csvContent = file.buffer.toString('utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        // Parse header and data
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const users = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const user = {};
            headers.forEach((header, i) => {
                user[header] = values[i] || '';
            });
            user._lineNumber = index + 2; // +2 for 1-based indexing and header row
            return user;
        });
        
        debugLog("Import", "✅ CSV parsed successfully", { 
            totalUsers: users.length,
            headers: headers
        });
        if (logger.flush) await logger.flush();
        
        // Initialize progress tracking
        let processed = 0;
        let created = 0;
        let skipped = 0;
        let failed = 0;
        let errors = [];
        
        // Get token manager for PingOne API calls
        const tokenManager = app.get('tokenManager');
        if (!tokenManager) {
            throw new Error('Token manager not available');
        }
        
        // Get access token
        const token = await tokenManager.getAccessToken();
        if (!token) {
            throw new Error('Failed to get access token');
        }
        
        // Get environment ID from settings
        const settingsResponse = await fetch('http://localhost:4000/api/settings');
        if (!settingsResponse.ok) {
            throw new Error('Failed to load settings');
        }
        const settingsData = await settingsResponse.json();
        const settings = settingsData.success && settingsData.data ? settingsData.data : settingsData;
        const environmentId = settings.environmentId;
        
        if (!environmentId) {
            throw new Error('Environment ID not configured');
        }
        
        debugLog("Import", "🔑 Authentication ready", { environmentId });
        if (logger.flush) await logger.flush();
        
        // Process users in batches to avoid rate limiting
        const batchSize = 5;
        const delayBetweenBatches = 1000; // 1 second delay between batches
        
        const importStart = Date.now();
        
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            debugLog("Import", `📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`, {
                batchSize: batch.length,
                startIndex: i
            });
            if (logger.flush) await logger.flush();
            
            // Process each user in the batch
            for (const user of batch) {
                try {
                    processed++;
                    
                    // Validate required fields
                    const username = user.username || user.email;
                    if (!username) {
                        const error = `Line ${user._lineNumber}: Missing username or email`;
                        errors.push(error);
                        failed++;
                        debugLog("Import", `❌ ${error}`);
                        if (logger.flush) await logger.flush();
                        continue;
                    }
                    
                    // Check if user already exists
                    const checkUrl = `https://api.pingone.com/v1/environments/${environmentId}/users?username=${encodeURIComponent(username)}`;
                    const checkResponse = await fetch(checkUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (checkResponse.ok) {
                        const checkData = await checkResponse.json();
                        if (checkData._embedded && checkData._embedded.users && checkData._embedded.users.length > 0) {
                            // User already exists
                            skipped++;
                            debugLog("Import", `⏭️ User already exists: ${username}`, { lineNumber: user._lineNumber });
                            sendProgressEvent(sessionId, processed, users.length, `Skipped: ${username} already exists`, 
                                { processed, created, skipped, failed }, username, populationName, populationId, app);
                            continue;
                        }
                    }
                    
                    // Create user in PingOne
                    const createUrl = `https://api.pingone.com/v1/environments/${environmentId}/users`;
                    const userData = {
                        username: username,
                        email: user.email || username,
                        givenName: user.givenname || user.firstname || user['first name'] || '',
                        familyName: user.familyname || user.lastname || user['last name'] || '',
                        population: {
                            id: populationId
                        }
                    };
                    
                    // Add optional fields if present
                    if (user.phone) userData.phoneNumber = user.phone;
                    if (user.title) userData.title = user.title;
                    
                    const createResponse = await fetch(createUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(userData)
                    });
                    
                    if (createResponse.ok) {
                        created++;
                        debugLog("Import", `✅ User created successfully: ${username}`, { 
                            lineNumber: user._lineNumber,
                            populationName,
                            populationId
                        });
                        if (logger.flush) await logger.flush();
                        sendProgressEvent(sessionId, processed, users.length, `Created: ${username} in ${populationName}`, 
                            { processed, created, skipped, failed }, username, populationName, populationId, app);
                    } else {
                        const errorText = await createResponse.text();
                        const error = `Line ${user._lineNumber}: Failed to create user ${username} - ${createResponse.status}: ${errorText}`;
                        errors.push(error);
                        failed++;
                        debugLog("Import", `❌ ${error}`);
                        if (logger.flush) await logger.flush();
                        sendProgressEvent(sessionId, processed, users.length, `Failed: ${username}`, 
                            { processed, created, skipped, failed }, username, populationName, populationId, app);
                    }
                    
                } catch (error) {
                    const errorMsg = `Line ${user._lineNumber}: Error processing user ${user.username || user.email || 'unknown'} - ${error.message}`;
                    errors.push(errorMsg);
                    failed++;
                    debugLog("Import", `❌ ${errorMsg}`);
                    if (logger.flush) await logger.flush();
                    sendProgressEvent(sessionId, processed, users.length, `Error: ${user.username || user.email || 'unknown'}`, 
                        { processed, created, skipped, failed }, user.username || user.email || 'unknown', populationName, populationId, app);
                }
            }
            
            // Add delay between batches to avoid rate limiting
            if (i + batchSize < users.length) {
                debugLog("Import", `⏱️ Adding delay between batches: ${delayBetweenBatches}ms`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        const importDuration = Date.now() - importStart;
        logger.info(logSeparator('-'));
        logger.info(logTag('IMPORT SUMMARY'), { tag: logTag('IMPORT SUMMARY'), separator: logSeparator('-') });
        logger.info(`[${new Date().toISOString()}] [INFO] Import Summary:`, {
            total: users.length,
            processed,
            created,
            skipped,
            failed,
            durationMs: importDuration
        });
        logger.info(logSeparator());
        logger.info(logTag('END OF IMPORT'), { tag: logTag('END OF IMPORT'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Import process completed`, { sessionId });
        if (logger.flush) await logger.flush();
        
        // Send completion event
        debugLog("Import", "🏁 Import process completed", {
            total: users.length,
            processed,
            created,
            skipped,
            failed,
            errors: errors.length
        });
        
        const finalMessage = `Import completed: ${created} created, ${failed} failed, ${skipped} skipped`;
        sendCompletionEvent(sessionId, processed, users.length, finalMessage, { processed, created, skipped, failed }, app);
        
        // Clean up session
        importSessions.delete(sessionId);
        
    } catch (error) {
        const logger = app.get('importLogger') || console;
        logger.error(logSeparator());
        logger.error(logTag('ERROR'), { tag: logTag('ERROR'), separator: logSeparator() });
        logger.error(`[${new Date().toISOString()}] [ERROR] Import failed: ${error.message}`, {
            error: error.message,
            stack: error.stack
        });
        logger.error(logSeparator());
        if (logger.flush) await logger.flush();
        
        sendErrorEvent(sessionId, 'Import failed', error.message, {}, app);
        
        // Clean up session on error
        const importSessions = app.get('importSessions');
        if (importSessions) {
            importSessions.delete(sessionId);
        }
    }
}

// ============================================================================
// FEATURE FLAGS MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     description: Retrieves all current feature flags and their states
 *     tags: [Feature Flags]
 *     responses:
 *       200:
 *         description: Feature flags retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 flags:
 *                   $ref: '#/components/schemas/FeatureFlags'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/feature-flags', (req, res) => {
    try {
        const flags = featureFlags.getAllFeatureFlags();
        res.json({ success: true, flags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get feature flags', details: error.message });
    }
});

/**
 * @swagger
 * /api/feature-flags/{flag}:
 *   post:
 *     summary: Update feature flag
 *     description: Updates a specific feature flag's enabled state
 *     tags: [Feature Flags]
 *     parameters:
 *       - in: path
 *         name: flag
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature flag name to update
 *         example: A
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: New enabled state for the flag
 *                 example: true
 *             required:
 *               - enabled
 *     responses:
 *       200:
 *         description: Feature flag updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 flag:
 *                   type: string
 *                   example: A
 *                 enabled:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/feature-flags/:flag', (req, res) => {
    try {
        const { flag } = req.params;
        const { enabled } = req.body;
        
        // Validate that enabled is a boolean value
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({ error: 'enabled must be a boolean' });
        }
        
        featureFlags.setFeatureFlag(flag, enabled);
        res.json({ success: true, flag, enabled });
    } catch (error) {
        res.status(500).json({ error: 'Failed to set feature flag', details: error.message });
    }
});

/**
 * @swagger
 * /api/feature-flags/reset:
 *   post:
 *     summary: Reset feature flags
 *     description: Resets all feature flags to their default values
 *     tags: [Feature Flags]
 *     responses:
 *       200:
 *         description: Feature flags reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Feature flags reset to defaults
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/feature-flags/reset', (req, res) => {
    try {
        featureFlags.resetFeatureFlags();
        res.json({ success: true, message: 'Feature flags reset to defaults' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset feature flags', details: error.message });
    }
});

// ============================================================================
// SSE EVENT FUNCTIONS
// ============================================================================

/**
 * Send progress event via Server-Sent Events
 * Provides real-time updates to frontend during import operations
 * 
 * @param {string} sessionId - Unique session identifier
 * @param {number} current - Current progress count
 * @param {number} total - Total items to process
 * @param {string} message - Progress message
 * @param {Object} counts - Success/fail/skip counts
 * @param {Object} user - Current user being processed
 * @param {string} populationName - Population name
 * @param {string} populationId - Population ID
 * @returns {boolean} Success status
 */
function sendProgressEvent(sessionId, current, total, message, counts, user, populationName, populationId, app) {
    const startTime = Date.now();
    
    try {
        // Format the message for better readability
        const formattedMessage = serverMessageFormatter.formatProgressMessage(
            'import', 
            current, 
            total, 
            message, 
            counts
        );

        const eventData = {
            type: 'progress',
            current,
            total,
            message: formattedMessage, // Use formatted message
            counts,
            user: {
                username: user?.username || user?.email || 'unknown',
                lineNumber: user?._lineNumber
            },
            populationName,
            populationId,
            timestamp: new Date().toISOString()
        };
        
        // Log progress event with enhanced context
        logSSEEvent('progress', sessionId, {
            progress: {
                current,
                total,
                percentage: Math.round((current / total) * 100)
            },
            user: eventData.user,
            population: { name: populationName, id: populationId },
            message,
            duration: Date.now() - startTime
        });
        
        // Send to connected SSE clients with error handling
        if (app && app.importSessions && app.importSessions[sessionId]) {
            const session = app.importSessions[sessionId];
            if (session && session.res && !session.res.destroyed) {
                try {
                    session.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
                    // Update metrics for successful send
                    updateSSEMetrics('progress', sessionId, { 
                        duration: Date.now() - startTime 
                    });
                    
                    return true;
                } catch (writeError) {
                    // Handle write errors
                    const recovery = handleSSEError(sessionId, writeError, {
                        context: 'progress_event_write',
                        eventData: { current, total, message }
                    });
                    
                    logSSEEvent('error', sessionId, {
                        error: writeError.message,
                        context: 'progress_event_write',
                        duration: Date.now() - startTime
                    });
                    
                    return false;
                }
            }
        }
        // --- WebSocket broadcast fallback ---
        if (global.wsClients && global.wsClients.has(sessionId)) {
            const ws = global.wsClients.get(sessionId);
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(eventData));
            }
        }
        
        // --- Socket.IO broadcast primary ---
        if (global.ioClients && global.ioClients.has(sessionId)) {
            const socket = global.ioClients.get(sessionId);
            if (socket && socket.connected) {
                socket.emit('progress', eventData);
            }
        }
        
        // Log if no client found
        logSSEEvent('warning', sessionId, {
            message: 'No SSE client found for session',
            progress: { current, total },
            duration: Date.now() - startTime
        });
        
        return false;
    } catch (error) {
        // Handle general errors
        const recovery = handleSSEError(sessionId, error, {
            context: 'progress_event_general',
            eventData: { current, total, message }
        });
        
        logSSEEvent('error', sessionId, {
            error: error.message,
            stack: error.stack,
            context: 'progress_event_general',
            duration: Date.now() - startTime
        });
        
        return false;
    }
}

/**
 * Send completion event via Server-Sent Events
 * Signals that the import process has finished
 * 
 * @param {string} sessionId - Unique session identifier
 * @param {number} current - Final progress count
 * @param {number} total - Total items processed
 * @param {string} message - Completion message
 * @param {Object} counts - Final success/fail/skip counts
 * @returns {boolean} Success status
 */
function sendCompletionEvent(sessionId, current, total, message, counts, app) {
    const startTime = Date.now();
    
    try {
        // Format the completion message for better readability
        const formattedMessage = serverMessageFormatter.formatCompletionMessage(
            'import', 
            { current, total, ...counts }
        );

        const eventData = {
            type: 'completion',
            current,
            total,
            message: formattedMessage, // Use formatted message
            counts,
            timestamp: new Date().toISOString()
        };
        
        // Log completion event with enhanced context
        logSSEEvent('completion', sessionId, {
            progress: {
                current,
                total,
                percentage: Math.round((current / total) * 100)
            },
            counts,
            message,
            duration: Date.now() - startTime
        });
        
        // Send to connected SSE clients with error handling
        if (app && app.importSessions && app.importSessions[sessionId]) {
            const session = app.importSessions[sessionId];
            if (session && session.res && !session.res.destroyed) {
                try {
                    session.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
                    // Update metrics for successful send
                    updateSSEMetrics('completion', sessionId, { 
                        duration: Date.now() - startTime 
                    });
                    
                    return true;
                } catch (writeError) {
                    // Handle write errors
                    const recovery = handleSSEError(sessionId, writeError, {
                        context: 'completion_event_write',
                        eventData: { current, total, message }
                    });
                    
                    logSSEEvent('error', sessionId, {
                        error: writeError.message,
                        context: 'completion_event_write',
                        duration: Date.now() - startTime
                    });
                    
                    return false;
                }
            }
        }
        
        // --- Socket.IO broadcast primary ---
        if (global.ioClients && global.ioClients.has(sessionId)) {
            const socket = global.ioClients.get(sessionId);
            if (socket && socket.connected) {
                socket.emit('completion', eventData);
            }
        }
        
        // Log if no client found
        logSSEEvent('warning', sessionId, {
            message: 'No SSE client found for completion event',
            progress: { current, total },
            duration: Date.now() - startTime
        });
        
        return false;
    } catch (error) {
        // Handle general errors
        const recovery = handleSSEError(sessionId, error, {
            context: 'completion_event_general',
            eventData: { current, total, message }
        });
        
        logSSEEvent('error', sessionId, {
            error: error.message,
            stack: error.stack,
            context: 'completion_event_general',
            duration: Date.now() - startTime
        });
        
        return false;
    }
}

/**
 * Send error event via Server-Sent Events
 * Notifies frontend of errors during import process
 * 
 * @param {string} sessionId - Unique session identifier
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {boolean} Success status
 */
function sendErrorEvent(sessionId, title, message, details = {}, app) {
    const startTime = Date.now();
    
    try {
        // Format the error message for better readability
        const formattedMessage = serverMessageFormatter.formatErrorMessage(
            'import', 
            message, 
            { title, ...details }
        );

        const eventData = {
            type: 'error',
            title,
            message: formattedMessage, // Use formatted message
            details,
            timestamp: new Date().toISOString()
        };
        
        // Log error event with enhanced context
        logSSEEvent('error', sessionId, {
            title,
            message,
            details,
            duration: Date.now() - startTime,
            context: 'error_event_send'
        });
        
        // Send to connected SSE clients with error handling
        if (app && app.importSessions && app.importSessions[sessionId]) {
            const session = app.importSessions[sessionId];
            if (session && session.res && !session.res.destroyed) {
                try {
                    session.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
                    // Update metrics for successful send
                    updateSSEMetrics('error', sessionId, { 
                        duration: Date.now() - startTime 
                    });
                    
                    return true;
                } catch (writeError) {
                    // Handle write errors
                    const recovery = handleSSEError(sessionId, writeError, {
                        context: 'error_event_write',
                        eventData: { title, message }
                    });
                    
                    logSSEEvent('error', sessionId, {
                        error: writeError.message,
                        context: 'error_event_write',
                        duration: Date.now() - startTime
                    });
                    
                    return false;
                }
            }
        }
        
        // --- Socket.IO broadcast primary ---
        if (global.ioClients && global.ioClients.has(sessionId)) {
            const socket = global.ioClients.get(sessionId);
            if (socket && socket.connected) {
                socket.emit('error', eventData);
            }
        }
        
        // Log if no client found
        logSSEEvent('warning', sessionId, {
            message: 'No SSE client found for error event',
            title,
            message,
            duration: Date.now() - startTime
        });
        
        return false;
    } catch (error) {
        // Handle general errors
        const recovery = handleSSEError(sessionId, error, {
            context: 'error_event_general',
            eventData: { title, message }
        });
        
        logSSEEvent('error', sessionId, {
            error: error.message,
            stack: error.stack,
            context: 'error_event_general',
            duration: Date.now() - startTime
        });
        
        return false;
    }
}

// ============================================================================
// MAIN IMPORT ENDPOINT
// ============================================================================

/**
 * @swagger
 * /api/import:
 *   post:
 *     summary: Import users from CSV
 *     description: Handles user import from CSV file with real-time progress tracking
 *     tags: [Import]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user data
 *               populationId:
 *                 type: string
 *                 description: PingOne population ID
 *                 example: 3840c98d-202d-4f6a-8871-f3bc66cb3fa8
 *               populationName:
 *                 type: string
 *                 description: PingOne population name
 *                 example: Sample Users
 *               totalUsers:
 *                 type: number
 *                 description: Expected number of users in CSV
 *                 example: 100
 *             required:
 *               - file
 *               - populationId
 *               - populationName
 *     responses:
 *       200:
 *         description: Import started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResponse'
 *       400:
 *         description: Invalid request (missing file or population info)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File too large (max 10MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
/**
 * @swagger
 * /api/import:
 *   post:
 *     summary: Import users from CSV file
 *     description: |
 *       Uploads a CSV file and imports users into a specified PingOne population.
 *       This endpoint starts an asynchronous import process and returns a session ID
 *       for tracking progress via Server-Sent Events (SSE).
 *       
 *       ## Process Flow
 *       1. Validates the uploaded CSV file
 *       2. Checks population selection and permissions
 *       3. Generates a unique session ID for progress tracking
 *       4. Starts background import process
 *       5. Returns session ID for SSE connection
 *       
 *       ## CSV Format Requirements
 *       - Must contain header row with column names
 *       - Required columns: username or email
 *       - Optional columns: firstname, lastname, phone, title
 *       - Maximum file size: 10MB
 *       
 *       ## Progress Tracking
 *       Use the returned sessionId with `/api/import/progress/{sessionId}` 
 *       to receive real-time progress updates via SSE.
 *       
 *       ## Error Handling
 *       - Validates file format and size
 *       - Checks population existence and permissions
 *       - Handles duplicate user detection
 *       - Provides detailed error messages
 *     tags: [User Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user data
 *               populationId:
 *                 type: string
 *                 description: PingOne population ID
 *                 example: 3840c98d-202d-4f6a-8871-f3bc66cb3fa8
 *               populationName:
 *                 type: string
 *                 description: PingOne population name
 *                 example: Sample Users
 *               totalUsers:
 *                 type: number
 *                 description: Expected number of users in CSV
 *                 example: 100
 *             required:
 *               - file
 *               - populationId
 *               - populationName
 *     responses:
 *       200:
 *         description: Import started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImportResponse'
 *             example:
 *               success: true
 *               sessionId: "session-12345"
 *               message: "Import started successfully"
 *               populationName: "Sample Users"
 *               populationId: "3840c98d-202d-4f6a-8871-f3bc66cb3fa8"
 *               totalUsers: 100
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "No file uploaded"
 *               message: "Please select a CSV file to import"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/import', upload.single('file'), async (req, res, next) => {
    try {
        const logger = req.app.get('importLogger') || console;
        logger.info(logSeparator());
        logger.info(logTag('IMPORT ENDPOINT HIT'), { tag: logTag('IMPORT ENDPOINT HIT'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Import endpoint triggered`, {
            file: req.file ? req.file.originalname : null,
            populationId: req.body.populationId,
            populationName: req.body.populationName
        });
        if (logger.flush) await logger.flush();
        
        debugLog("Import", "🚀 Import request received");
        
        // Validate file upload
        if (!req.file) {
            debugLog("Import", "❌ No file uploaded");
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please select a CSV file to import'
            });
        }
        
        // Validate population selection
        const { populationId, populationName, totalUsers } = req.body;
        if (!populationId || !populationName) {
            debugLog("Import", "❌ Missing population information", { populationId, populationName });
            return res.status(400).json({
                success: false,
                error: 'Missing population information',
                message: 'Please select a population for the import'
            });
        }
        
        debugLog("Import", "✅ Import options validated", {
            totalUsers: parseInt(totalUsers) || 0,
            populationId,
            populationName,
            fileName: req.file.originalname
        });
        
        // Generate session ID for SSE connection
        const sessionId = uuidv4();
        
        // Store import session data
        const importSession = {
            sessionId,
            file: req.file,
            populationId,
            populationName,
            totalUsers: parseInt(totalUsers) || 0,
            startTime: new Date(),
            status: 'starting'
        };
        
        // Store session in app context for SSE access
        if (!req.app.get('importSessions')) {
            req.app.set('importSessions', new Map());
        }
        req.app.get('importSessions').set(sessionId, importSession);
        
        debugLog("Import", "📋 Import session created", { sessionId });
        
        // Start import process in background with proper error handling
        runImportProcess(sessionId, req.app).catch(error => {
            debugLog("Import", "❌ Background import process failed", { error: error.message });
            sendErrorEvent(sessionId, 'Import failed', error.message, {}, req.app);
        });
        
        // Return session ID for SSE connection
        res.json({
            success: true,
            sessionId,
            message: 'Import started successfully',
            populationName,
            populationId,
            totalUsers: parseInt(totalUsers) || 0
        });
        
    } catch (error) {
        debugLog("Import", "❌ Import endpoint error", { error: error.message });
        res.status(500).json({
            success: false,
            error: 'Import failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============================================================================
// SSE Endpoint for Import Progress
// ============================================================================
/**
 * @swagger
 * /api/import/progress/{sessionId}:
 *   get:
 *     summary: Get import progress via SSE
 *     description: Establishes a Server-Sent Events (SSE) connection for real-time import progress
 *     tags: [Import]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Import session ID
 *         example: session-12345
 *     responses:
 *       200:
 *         description: SSE connection established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: Server-Sent Events stream
 *       400:
 *         description: Invalid session ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/import/progress/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const clientIP = req.ip;
    const userAgent = req.get('user-agent');
    const connectionStart = Date.now();
    const connectionId = generateConnectionId();
    
    // Log connection attempt with comprehensive context
    logSSEEvent('connect_attempt', sessionId, {
        clientIP,
        userAgent,
        connectionId,
        timestamp: new Date().toISOString(),
        duration: 0
    });
    
    // Validate session ID with enhanced error handling
    if (!sessionId || typeof sessionId !== 'string' || sessionId.length < 8) {
        const error = new Error('Invalid session ID');
        error.code = 'INVALID_SESSION_ID';
        
        logSSEEvent('connect_failed', sessionId, {
            error: error.message,
            clientIP,
            userAgent,
            connectionId,
            duration: Date.now() - connectionStart,
            reason: 'invalid_session_id'
        });
        
        return res.status(400).json({ 
            error: 'Invalid session ID for SSE connection', 
            code: 'INVALID_SESSION_ID',
            details: {
                sessionId,
                minLength: 8,
                actualLength: sessionId ? sessionId.length : 0
            }
        });
    }
    
    // Set SSE headers with enhanced configuration
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    res.flushHeaders();
    
    // Log successful connection with detailed metrics
    logSSEEvent('connect_success', sessionId, {
        clientIP,
        userAgent,
        connectionId,
        duration: Date.now() - connectionStart,
        headers: {
            'Content-Type': res.get('Content-Type'),
            'Cache-Control': res.get('Cache-Control'),
            'Connection': res.get('Connection')
        }
    });
    
    // Track connection metrics
    updateSSEMetrics('connect', sessionId, { duration: Date.now() - connectionStart });
    
    // Store connection with enhanced tracking
    req.app.importSessions = req.app.importSessions || {};
    req.app.importSessions[sessionId] = {
        res,
        connectionId,
        startTime: connectionStart,
        clientIP,
        userAgent,
        lastActivity: Date.now()
    };
    
    // Keep-alive interval with enhanced logging
    const keepAlive = setInterval(() => {
        try {
            res.write(': keep-alive\n\n');
            logSSEEvent('keepalive', sessionId, {
                connectionId,
                duration: Date.now() - connectionStart
            });
            updateSSEMetrics('keepalive', sessionId);
            
            // Update last activity
            if (req.app.importSessions[sessionId]) {
                req.app.importSessions[sessionId].lastActivity = Date.now();
            }
        } catch (error) {
            // Handle keep-alive errors
            const recovery = handleSSEError(sessionId, error, {
                context: 'keepalive_interval',
                connectionId
            });
            
            if (!recovery.shouldReconnect) {
                clearInterval(keepAlive);
            }
        }
    }, 25000);
    
    // Enhanced disconnect handling with detailed logging
    req.on('close', () => {
        clearInterval(keepAlive);
        const connectionDuration = Date.now() - connectionStart;
        
        logSSEEvent('disconnect', sessionId, {
            clientIP,
            userAgent,
            connectionId,
            duration: connectionDuration,
            reason: 'client_disconnect',
            lastActivity: req.app.importSessions[sessionId]?.lastActivity
        });
        
        updateSSEMetrics('disconnect', sessionId, { duration: connectionDuration });
        
        // Clean up session
        if (req.app.importSessions[sessionId]) {
            delete req.app.importSessions[sessionId];
        }
    });
    
    // Enhanced error handling with recovery mechanisms
    req.on('error', (error) => {
        clearInterval(keepAlive);
        const connectionDuration = Date.now() - connectionStart;
        
        // Log error with full context
        logSSEEvent('error', sessionId, {
            error: error.message,
            stack: error.stack,
            code: error.code,
            clientIP,
            userAgent,
            connectionId,
            duration: connectionDuration,
            context: 'request_error'
        });
        
        // Attempt error recovery
        const recovery = handleSSEError(sessionId, error, {
            context: 'request_error',
            connectionId,
            duration: connectionDuration
        });
        
        updateSSEMetrics('error', sessionId, { duration: connectionDuration });
        
        // Clean up session on error
        if (req.app.importSessions[sessionId]) {
            delete req.app.importSessions[sessionId];
        }
        
        // Log recovery attempt if applicable
        if (recovery.shouldReconnect) {
            logSSEEvent('recovery_attempt', sessionId, {
                strategy: recovery.reason,
                delay: recovery.delay,
                maxRetries: recovery.maxRetries,
                connectionId
            });
        }
    });
    
    // Handle response errors
    res.on('error', (error) => {
        clearInterval(keepAlive);
        const connectionDuration = Date.now() - connectionStart;
        
        logSSEEvent('error', sessionId, {
            error: error.message,
            stack: error.stack,
            code: error.code,
            clientIP,
            userAgent,
            connectionId,
            duration: connectionDuration,
            context: 'response_error'
        });
        
        const recovery = handleSSEError(sessionId, error, {
            context: 'response_error',
            connectionId,
            duration: connectionDuration
        });
        
        updateSSEMetrics('error', sessionId, { duration: connectionDuration });
        
        if (req.app.importSessions[sessionId]) {
            delete req.app.importSessions[sessionId];
        }
    });
});

// ============================================================================
// USER EXPORT ENDPOINT
// ============================================================================

/**
 * @swagger
 * /api/export-users:
 *   post:
 *     summary: Export users from PingOne
 *     description: Exports users from PingOne in JSON or CSV format with optional filtering
 *     tags: [Export]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExportRequest'
 *     responses:
 *       200:
 *         description: Users exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportResponse'
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV file content
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/history:
 *   get:
 *     summary: Get operation history
 *     description: |
 *       Retrieves the history of all operations performed in the application.
 *       This endpoint provides audit trail data for import, export, modify, and delete operations.
 *       
 *       ## History Data
 *       - Operation type and status
 *       - Timestamp and duration
 *       - Population information
 *       - User counts and results
 *       - Error messages and details
 *       
 *       ## Filtering Options
 *       - **limit**: Maximum number of operations to return (default: 50)
 *       - **type**: Filter by operation type (IMPORT, EXPORT, DELETE, MODIFY)
 *       - **population**: Filter by population name
 *       - **startDate**: Filter operations after this date
 *       - **endDate**: Filter operations before this date
 *       
 *       ## Data Structure
 *       Each history entry includes:
 *       - Unique operation ID
 *       - Timestamp and duration
 *       - Operation type and status
 *       - Population details
 *       - User counts (total, processed, successful, failed)
 *       - Error messages and details
 *       
 *       ## Caching
 *       Results are cached for 30 seconds to improve performance.
 *       Cache is invalidated when new operations are performed.
 *     tags: [System]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 50
 *         description: Maximum number of operations to return
 *         example: 50
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [IMPORT, EXPORT, DELETE, MODIFY]
 *         description: Filter by operation type
 *         example: IMPORT
 *       - in: query
 *         name: population
 *         schema:
 *           type: string
 *         description: Filter by population name
 *         example: Sample Users
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter operations after this date
 *         example: 2025-07-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter operations before this date
 *         example: 2025-07-31
 *     responses:
 *       200:
 *         description: Operation history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 operations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: log-12345
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-07-12T15:35:29.053Z
 *                       type:
 *                         type: string
 *                         enum: [IMPORT, EXPORT, DELETE, MODIFY]
 *                         example: IMPORT
 *                       message:
 *                         type: string
 *                         example: Import completed successfully
 *                       level:
 *                         type: string
 *                         enum: [info, warning, error, debug]
 *                         example: info
 *                       fileName:
 *                         type: string
 *                         example: users.csv
 *                       population:
 *                         type: string
 *                         example: Sample Users
 *                       success:
 *                         type: number
 *                         example: 95
 *                       errors:
 *                         type: number
 *                         example: 2
 *                       skipped:
 *                         type: number
 *                         example: 3
 *                       total:
 *                         type: number
 *                         example: 100
 *                       environmentId:
 *                         type: string
 *                         example: b9817c16-9910-4415-b67e-4ac687da74d9
 *                       userAgent:
 *                         type: string
 *                         example: Mozilla/5.0...
 *                       ip:
 *                         type: string
 *                         example: 127.0.0.1
 *                 total:
 *                   type: number
 *                   description: Total number of operations found
 *                   example: 150
 *                 filtered:
 *                   type: number
 *                   description: Number of operations returned after filtering
 *                   example: 25
 *             example:
 *               success: true
 *               operations: [
 *                 {
 *                   id: "log-12345",
 *                   timestamp: "2025-07-12T15:35:29.053Z",
 *                   type: "IMPORT",
 *                   message: "Import completed successfully",
 *                   level: "info",
 *                   fileName: "users.csv",
 *                   population: "Sample Users",
 *                   success: 95,
 *                   errors: 2,
 *                   skipped: 3,
 *                   total: 100,
 *                   environmentId: "b9817c16-9910-4415-b67e-4ac687da74d9",
 *                   userAgent: "Mozilla/5.0...",
 *                   ip: "127.0.0.1"
 *                 }
 *               ]
 *               total: 150
 *               filtered: 25
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/history', async (req, res) => {
    try {
        const { limit = 50, type, population, startDate, endDate } = req.query;
        
        // Get logs from the existing logs endpoint with caching
        const cacheKey = `history_logs_${limit}_${type || 'all'}_${population || 'all'}`;
        const cachedData = req.app.get('historyCache')?.get(cacheKey);
        
        let logsData;
        if (cachedData && (Date.now() - cachedData.timestamp) < 30000) { // 30 second cache
            logsData = cachedData.data;
        } else {
            const logsResponse = await fetch(`http://localhost:4000/api/logs/ui?limit=1000`);
            if (!logsResponse.ok) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch logs for history'
                });
            }
            
            logsData = await logsResponse.json();
            if (!logsData.success || !logsData.logs) {
                return res.status(500).json({
                    success: false,
                    error: 'Invalid logs data'
                });
            }
            
            // Cache the result
            if (!req.app.get('historyCache')) {
                req.app.set('historyCache', new Map());
            }
            req.app.get('historyCache').set(cacheKey, {
                data: logsData,
                timestamp: Date.now()
            });
        }
        
        // Filter and transform logs into operation history
        const operations = [];
        const operationTypes = ['IMPORT', 'EXPORT', 'DELETE', 'MODIFY'];
        
        logsData.logs.forEach(log => {
            // Look for operation-related logs
            const message = log.message.toLowerCase();
            const data = log.data || {};
            
            let operationType = null;
            let operationData = {};
            
            // Determine operation type from log message and data
            if (message.includes('import') || data.operation === 'import') {
                operationType = 'IMPORT';
                operationData = {
                    fileName: data.fileName || data.filename || 'Unknown file',
                    population: data.population || data.populationName || 'Unknown population',
                    success: data.success || 0,
                    errors: data.errors || 0,
                    skipped: data.skipped || 0,
                    total: data.total || 0
                };
            } else if (message.includes('export') || data.operation === 'export') {
                operationType = 'EXPORT';
                operationData = {
                    fileName: data.fileName || 'Export file',
                    population: data.population || data.populationName || 'All populations',
                    recordCount: data.recordCount || data.userCount || 0,
                    format: data.format || 'CSV',
                    fileSize: data.fileSize || 'Unknown'
                };
            } else if (message.includes('delete') || data.operation === 'delete') {
                operationType = 'DELETE';
                operationData = {
                    fileName: data.fileName || data.filename || 'No file',
                    population: data.population || data.populationName || 'Unknown population',
                    deleteCount: data.deleteCount || data.deleted || 0,
                    total: data.total || 0,
                    deleteType: data.deleteType || 'file'
                };
            } else if (message.includes('modify') || data.operation === 'modify') {
                operationType = 'MODIFY';
                operationData = {
                    fileName: data.fileName || data.filename || 'Unknown file',
                    population: data.population || data.populationName || 'Unknown population',
                    success: data.success || 0,
                    errors: data.errors || 0,
                    skipped: data.skipped || 0,
                    total: data.total || 0
                };
            }
            
            if (operationType) {
                // Apply filters
                if (type && operationType !== type.toUpperCase()) {
                    return;
                }
                
                if (population && !operationData.population.toLowerCase().includes(population.toLowerCase())) {
                    return;
                }
                
                const operationDate = new Date(log.timestamp);
                if (startDate && operationDate < new Date(startDate)) {
                    return;
                }
                
                if (endDate && operationDate > new Date(endDate)) {
                    return;
                }
                
                operations.push({
                    id: log.id,
                    timestamp: log.timestamp,
                    type: operationType,
                    message: log.message,
                    level: log.level,
                    ...operationData,
                    environmentId: data.environmentId || 'Unknown',
                    userAgent: log.userAgent,
                    ip: log.ip
                });
            }
        });
        
        // Sort by timestamp (most recent first)
        operations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        const limitedOperations = operations.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            operations: limitedOperations,
            total: operations.length,
            filtered: limitedOperations.length
        });
        
    } catch (error) {
        debugLog("History", `❌ History error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch operation history',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/populations:
 *   get:
 *     summary: Get PingOne populations
 *     description: |
 *       Retrieves all populations from the configured PingOne environment.
 *       This endpoint fetches population data including user counts and metadata.
 *       
 *       ## Population Data
 *       - Population ID and name
 *       - Description and metadata
 *       - User count for each population
 *       - Creation and update timestamps
 *       
 *       ## Authentication
 *       Requires valid PingOne API credentials configured in settings.
 *       
 *       ## Rate Limiting
 *       Subject to PingOne API rate limits for population queries.
 *       
 *       ## Error Handling
 *       - Handles authentication failures gracefully
 *       - Provides detailed error messages for debugging
 *       - Returns empty array if no populations found
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Populations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PopulationsResponse'
 *             example:
 *               success: true
 *               populations: [
 *                 {
 *                   id: "3840c98d-202d-4f6a-8871-f3bc66cb3fa8",
 *                   name: "Sample Users",
 *                   description: "This is a sample user population",
 *                   userCount: 380
 *                 }
 *               ]
 *               total: 5
 *       401:
 *         description: Authentication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/populations', async (req, res) => {
    try {
        // Get token manager from Express app context
        const tokenManager = req.app.get('tokenManager');
        if (!tokenManager) {
            return res.status(500).json({ success: false, error: 'Token manager not available' });
        }
        
        // Get credentials for environmentId and region
        const credentials = await tokenManager.getCredentials();
        if (!credentials || !credentials.environmentId) {
            return res.status(500).json({ success: false, error: 'Missing environment ID' });
        }
        
        const { environmentId, region } = credentials;
        
        // Get access token
        const token = await tokenManager.getAccessToken();
        if (!token) {
            return res.status(401).json({ success: false, error: 'Failed to get access token' });
        }
        
        // Fetch populations from PingOne API
        const populationsUrl = `https://api.pingone.com/v1/environments/${environmentId}/populations`;
        const response = await fetch(populationsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            debugLog("Populations", `❌ Failed to fetch populations: ${response.status} ${errorText}`);
            return res.status(response.status).json({
                success: false,
                error: `Failed to fetch populations: ${response.statusText}`,
                details: errorText
            });
        }
        
        const data = await response.json();
        const populations = data._embedded?.populations || [];
        
        debugLog("Populations", `✅ Fetched ${populations.length} populations`);
        
        // Format populations for frontend
        const formattedPopulations = populations.map(population => ({
            id: population.id,
            name: population.name,
            description: population.description || '',
            userCount: population.userCount || 0
        }));
        
        res.json({
            success: true,
            populations: formattedPopulations,
            total: formattedPopulations.length
        });
        
    } catch (error) {
        debugLog("Populations", `❌ Populations error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch populations',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/export-users:
 *   post:
 *     summary: Export users from population
 *     description: |
 *       Exports users from a specified PingOne population in JSON or CSV format.
 *       This endpoint fetches user data from PingOne API and returns it in the
 *       requested format with optional field filtering.
 *       
 *       ## Export Options
 *       - **Format**: JSON or CSV output
 *       - **Fields**: All fields, basic fields only, or custom selection
 *       - **Population**: Export from specific population or all populations
 *       - **User Status**: Include or exclude disabled users
 *       
 *       ## Field Selection
 *       - **all**: Complete user data including all PingOne fields
 *       - **basic**: Essential fields (id, username, email, firstName, lastName, enabled)
 *       - **custom**: User-defined field selection (not implemented in current version)
 *       
 *       ## Response Format
 *       - **JSON**: Structured data with user objects
 *       - **CSV**: Comma-separated values with header row
 *       
 *       ## Rate Limiting
 *       Export operations are subject to PingOne API rate limits.
 *       Large exports may take time to complete.
 *     tags: [User Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               populationId:
 *                 type: string
 *                 description: PingOne population ID (empty for all populations)
 *                 example: 3840c98d-202d-4f6a-8871-f3bc66cb3fa8
 *               selectedPopulationId:
 *                 type: string
 *                 description: Alternative field name for population ID
 *                 example: 3840c98d-202d-4f6a-8871-f3bc66cb3fa8
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 description: Export format
 *                 example: csv
 *               fields:
 *                 type: string
 *                 enum: [all, basic, custom]
 *                 description: Field selection for export
 *                 example: basic
 *               ignoreDisabledUsers:
 *                 type: boolean
 *                 description: Include disabled users in export
 *                 example: false
 *             required:
 *               - populationId
 *     responses:
 *       200:
 *         description: Export completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExportResponse'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: "user-123",
 *                   username: "john.doe@example.com",
 *                   email: "john.doe@example.com",
 *                   firstName: "John",
 *                   lastName: "Doe",
 *                   enabled: true
 *                 }
 *               ]
 *               total: 100
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/export-users', async (req, res, next) => {
    try {
        // Log the incoming request for debugging
        console.log('Export request received:', {
            body: req.body,
            headers: req.headers,
            timestamp: new Date().toISOString()
        });

        // Extract and normalize request parameters
        const { 
            populationId, 
            selectedPopulationId, // Frontend sends this
            fields, 
            format, 
            ignoreDisabledUsers 
        } = req.body;
        
        // Handle both field name variations
        const actualPopulationId = populationId || selectedPopulationId;
        
        // Convert ignoreDisabledUsers to boolean if it's a string (handles form data)
        const shouldIgnoreDisabledUsers = ignoreDisabledUsers === true || ignoreDisabledUsers === 'true';
        
        // Enhanced validation with detailed error messages
        if (!actualPopulationId && actualPopulationId !== '') {
            console.error('Export validation failed: Missing population ID', {
                received: { populationId, selectedPopulationId },
                body: req.body
            });
            return res.status(400).json({
                error: 'Missing required field',
                message: 'Population ID is required for export operations',
                details: {
                    received: { populationId, selectedPopulationId },
                    expected: 'populationId or selectedPopulationId'
                }
            });
        }

        // Validate format parameter
        const validFormats = ['csv', 'json'];
        if (format && !validFormats.includes(format)) {
            console.error('Export validation failed: Invalid format', {
                received: format,
                validFormats
            });
            return res.status(400).json({
                error: 'Invalid format',
                message: `Format must be one of: ${validFormats.join(', ')}`,
                details: {
                    received: format,
                    validFormats
                }
            });
        }

        // Validate fields parameter
        const validFields = ['all', 'basic', 'custom'];
        if (fields && !validFields.includes(fields)) {
            console.error('Export validation failed: Invalid fields', {
                received: fields,
                validFields
            });
            return res.status(400).json({
                error: 'Invalid fields',
                message: `Fields must be one of: ${validFields.join(', ')}`,
                details: {
                    received: fields,
                    validFields
                }
            });
        }

        console.log('Export validation passed, proceeding with export', {
            populationId: actualPopulationId,
            fields: fields || 'all',
            format: format || 'csv',
            ignoreDisabledUsers: shouldIgnoreDisabledUsers
        });

        // Build PingOne API URL with population filtering and population details expansion
        // This ensures we get complete user data including population information
        let pingOneUrl = 'http://127.0.0.1:4000/api/pingone/users';
        const params = new URLSearchParams();
        
        // Add population filter if specified (empty string means all populations)
        if (actualPopulationId && actualPopulationId.trim() !== '') {
            params.append('population.id', actualPopulationId.trim());
        }
        
        // Always expand population details to get population name and ID in response
        params.append('expand', 'population');
        
        // Append query parameters if any exist
        if (params.toString()) {
            pingOneUrl += `?${params.toString()}`;
        }

        console.log('Fetching users from PingOne API:', pingOneUrl);

        const pingOneResponse = await fetch(pingOneUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!pingOneResponse.ok) {
            const errorData = await pingOneResponse.json().catch(() => ({}));
            console.error('PingOne API request failed:', {
                status: pingOneResponse.status,
                statusText: pingOneResponse.statusText,
                errorData
            });
            return res.status(pingOneResponse.status).json({
                error: 'Failed to fetch users from PingOne',
                message: errorData.message || `HTTP ${pingOneResponse.status}: ${pingOneResponse.statusText}`,
                details: errorData
            });
        }

        let users = await pingOneResponse.json();
        
        // Handle PingOne API response format variations
        // PingOne can return users directly as array or nested in _embedded.users
        if (users._embedded && users._embedded.users) {
            users = users._embedded.users;
        } else if (!Array.isArray(users)) {
            users = [];
        }

        console.log('Users fetched successfully:', {
            count: users.length,
            populationId: actualPopulationId
        });

        // Filter out disabled users if the ignore flag is set
        // This provides a way to export only active users
        if (shouldIgnoreDisabledUsers) {
            const originalCount = users.length;
            users = users.filter(user => user.enabled !== false);
            console.log('Filtered disabled users:', {
                originalCount,
                filteredCount: users.length,
                disabledCount: originalCount - users.length
            });
        }

        // Check if population information is available in the user objects
        // This determines whether we need to fetch population data separately
        let hasPopulationInfo = false;
        if (users.length > 0 && users[0].population) {
            hasPopulationInfo = true;
        }

        // If population info is not available, try to fetch it separately
        if (!hasPopulationInfo && actualPopulationId && actualPopulationId.trim() !== '') {
            try {
                const populationResponse = await fetch(`http://127.0.0.1:4000/api/pingone/populations/${actualPopulationId.trim()}`);
                if (populationResponse.ok) {
                    const populationData = await populationResponse.json();
                    const populationName = populationData.name || '';
                    
                    // Add population information to all users
                    users = users.map(user => ({
                        ...user,
                        population: {
                            id: actualPopulationId.trim(),
                            name: populationName
                        }
                    }));
                    console.log('Added population info to users:', {
                        populationId: actualPopulationId.trim(),
                        populationName
                    });
                }
            } catch (error) {
                console.warn('Failed to fetch population info:', error.message);
            }
        }
        
        // Process user data based on the requested field selection
        // This transforms the raw PingOne API response into the desired format
        let processedUsers = users;
        
        if (fields === 'basic') {
            // Basic fields: minimal set of essential user information
            // Useful for quick exports with core user data only
            processedUsers = users.map(user => ({
                id: user.id,
                username: user.username || '',
                email: user.email || '',
                populationId: user.population?.id || '',
                populationName: user.population?.name || '',
                enabled: user.enabled || false
            }));
        } else if (fields === 'custom') {
            // Custom fields: comprehensive field mapping with nested object flattening
            // Excludes complex objects and _links, flattens nested structures for CSV compatibility
            processedUsers = users.map(user => {
                const customFields = {};
                
                Object.keys(user).forEach(key => {
                    // Skip _links entirely (PingOne API metadata)
                    if (key === '_links') {
                        return;
                    }
                    
                    const value = user[key];
                    
                    // Handle nested objects by flattening or extracting meaningful values
                    // This prevents [object Object] in CSV exports
                    if (typeof value === 'object' && value !== null) {
                        if (key === 'name') {
                            // Flatten name object into givenName and familyName
                            customFields.givenName = value.given || '';
                            customFields.familyName = value.family || '';
                        } else if (key === 'population') {
                            // Flatten population object into populationId and populationName
                            customFields.populationId = value.id || '';
                            customFields.populationName = value.name || '';
                        } else if (key === 'environment') {
                            customFields.environmentId = value.id || '';
                        } else if (key === 'account') {
                            customFields.accountId = value.id || '';
                        } else if (key === 'identityProvider') {
                            customFields.identityProviderType = value.type || '';
                        } else if (key === 'lifecycle') {
                            customFields.lifecycleStatus = value.status || '';
                        } else if (key === 'address') {
                            // Flatten address object into individual address fields
                            customFields.streetAddress = value.streetAddress || '';
                            customFields.locality = value.locality || '';
                            customFields.region = value.region || '';
                            customFields.postalCode = value.postalCode || '';
                            customFields.countryCode = value.countryCode || '';
                        } else {
                            // Skip other complex objects to avoid [object Object] in CSV
                        }
                    } else {
                        // Include primitive values as-is
                        customFields[key] = value;
                    }
                });
                return {
                    id: user.id,
                    populationId: user.population?.id || '',
                    populationName: user.population?.name || '',
                    ...customFields
                };
            });
        } else {
            // All fields: comprehensive export with all available data
            // Similar to custom but processes all users with complete field mapping
            processedUsers = users.map(user => {
                const processedUser = {};
                
                Object.keys(user).forEach(key => {
                    // Skip _links entirely (PingOne API metadata)
                    if (key === '_links') {
                        return;
                    }
                    
                    const value = user[key];
                    
                    // Handle nested objects by flattening or extracting meaningful values
                    if (typeof value === 'object' && value !== null) {
                        if (key === 'name') {
                            // Flatten name object into givenName and familyName
                            processedUser.givenName = value.given || '';
                            processedUser.familyName = value.family || '';
                        } else if (key === 'population') {
                            // Flatten population object into populationId and populationName
                            processedUser.populationId = value.id || '';
                            processedUser.populationName = value.name || '';
                        } else if (key === 'environment') {
                            processedUser.environmentId = value.id || '';
                        } else if (key === 'account') {
                            processedUser.accountId = value.id || '';
                        } else if (key === 'address') {
                            // Flatten address object into individual address fields
                            processedUser.streetAddress = value.streetAddress || '';
                            processedUser.locality = value.locality || '';
                            processedUser.region = value.region || '';
                            processedUser.postalCode = value.postalCode || '';
                            processedUser.countryCode = value.countryCode || '';
                        } else if (key === 'identityProvider') {
                            processedUser.identityProviderType = value.type || '';
                            processedUser.identityProviderName = value.name || '';
                        } else if (key === 'lifecycle') {
                            processedUser.lifecycleStatus = value.status || '';
                        } else {
                            // Skip other complex objects to avoid [object Object] in CSV
                        }
                    } else {
                        // Include primitive values as-is
                        processedUser[key] = value;
                    }
                });
                
                return processedUser;
            });
        }

        console.log('User processing completed:', {
            originalCount: users.length,
            processedCount: processedUsers.length,
            fields: fields || 'all'
        });

        // Convert processed user data to the requested output format
        // Supports both JSON and CSV formats with proper content type headers
        let output;
        let contentType;
        let fileName;
        
        if (format === 'json') {
            // JSON format: pretty-printed with 2-space indentation
            output = JSON.stringify(processedUsers, null, 2);
            contentType = 'application/json';
            fileName = `pingone-users-export-${new Date().toISOString().split('T')[0]}.json`;
        } else {
            // CSV format: comma-separated values with proper escaping
            if (processedUsers.length === 0) {
                output = '';
            } else {
                // Extract headers from the first user object
                const headers = Object.keys(processedUsers[0]);
                const csvRows = [headers.join(',')];
                
                // Convert each user to a CSV row with proper escaping
                processedUsers.forEach(user => {
                    const row = headers.map(header => {
                        const value = user[header];
                        // Escape commas and quotes in CSV values
                        // Double quotes are escaped by doubling them
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value || '';
                    });
                    csvRows.push(row.join(','));
                });
                
                output = csvRows.join('\n');
            }
            contentType = 'text/csv';
            fileName = `pingone-users-export-${new Date().toISOString().split('T')[0]}.csv`;
        }

        console.log('Export completed successfully:', {
            format: format || 'csv',
            userCount: processedUsers.length,
            fileName,
            contentType
        });

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(output);
    } catch (error) {
        console.error('Export operation failed:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        next(error);
    }
});

// ============================================================================
// USER MODIFICATION ENDPOINT
// ============================================================================

/**
 * @swagger
 * /api/modify:
 *   post:
 *     summary: Modify existing users from CSV
 *     description: |
 *       Processes a CSV file containing user data and updates existing users in PingOne.
 *       This endpoint supports user lookup by username or email, batch processing with
 *       delays to avoid API rate limits, and detailed result reporting.
 *       
 *       ## Features
 *       - **User Lookup**: Finds users by username or email
 *       - **Batch Processing**: Processes users in small batches to avoid rate limits
 *       - **Create if Missing**: Optionally creates users if they don't exist
 *       - **Password Generation**: Optionally generates passwords for new users
 *       - **Detailed Reporting**: Comprehensive results with success/failure counts
 *       
 *       ## CSV Format
 *       - Must include header row with column names
 *       - Required fields: username or email (for user lookup)
 *       - Optional fields: firstName, lastName, email, enabled, populationId
 *       - Supports quoted values for fields containing commas
 *       
 *       ## Processing Options
 *       - **createIfNotExists**: Create users if they don't exist (true/false)
 *       - **defaultPopulationId**: Default population for new users
 *       - **defaultEnabled**: Default enabled state for new users (true/false)
 *       - **generatePasswords**: Generate passwords for new users (true/false)
 *     tags: [Modify]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user updates
 *               createIfNotExists:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Whether to create users if they don't exist
 *                 example: "true"
 *               defaultPopulationId:
 *                 type: string
 *                 description: Default population ID for new users
 *                 example: "3840c98d-202d-4f6a-8871-f3bc66cb3fa8"
 *               defaultEnabled:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Default enabled state for new users
 *                 example: "true"
 *               generatePasswords:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Whether to generate passwords for new users
 *                 example: "false"
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: User modification completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: number
 *                   description: Total number of users processed
 *                   example: 100
 *                 modified:
 *                   type: number
 *                   description: Number of users successfully modified
 *                   example: 85
 *                 created:
 *                   type: number
 *                   description: Number of users created (if createIfNotExists enabled)
 *                   example: 10
 *                 failed:
 *                   type: number
 *                   description: Number of users that failed to process
 *                   example: 3
 *                 skipped:
 *                   type: number
 *                   description: Number of users skipped (no changes needed)
 *                   example: 2
 *                 noChanges:
 *                   type: number
 *                   description: Number of users with no changes detected
 *                   example: 0
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         description: User data from CSV
 *                       status:
 *                         type: string
 *                         enum: [modified, created, failed, skipped, noChanges]
 *                         description: Processing status for this user
 *                       pingOneId:
 *                         type: string
 *                         description: PingOne user ID (if created or modified)
 *                       error:
 *                         type: string
 *                         description: Error message (if failed)
 *       400:
 *         description: Invalid request (missing file or invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "No file uploaded"
 *               message: "Please upload a CSV file with user data"
 *       413:
 *         description: File too large (max 10MB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * Processes a CSV file containing user data and updates existing users
 * 
 * This endpoint processes a CSV file containing user data and updates existing users
 * in PingOne. It supports user lookup by username or email, batch processing with
 * delays to avoid API rate limits, and detailed result reporting.
 * 
 * @param {Object} req.file - Uploaded CSV file buffer
 * @param {string} createIfNotExists - Whether to create users if they don't exist
 * @param {string} defaultPopulationId - Default population ID for new users
 * @param {string} defaultEnabled - Default enabled state for new users
 * @param {string} generatePasswords - Whether to generate passwords for new users
 * 
 * @returns {Object} JSON response with modification results and statistics
 */
router.post('/modify', upload.single('file'), async (req, res, next) => {
    try {
        const logger = req.app.get('importLogger') || console;
        
        // Generate session ID for this modify operation
        const sessionId = `modify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        logger.info(logSeparator());
        logger.info(logTag('START OF MODIFY OPERATION'), { tag: logTag('START OF MODIFY OPERATION'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Modify operation started`, {
            sessionId,
            fileName: req.file?.originalname || 'No file',
            createIfNotExists: req.body.createIfNotExists,
            defaultPopulationId: req.body.defaultPopulationId,
            defaultEnabled: req.body.defaultEnabled,
            generatePasswords: req.body.generatePasswords,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        if (logger.flush) await logger.flush();
        
        const { createIfNotExists, defaultPopulationId, defaultEnabled, generatePasswords } = req.body;
        
        // Validate that a CSV file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                message: 'Please upload a CSV file with user data',
                sessionId
            });
        }
        
        // Validate that population ID is provided
        if (!defaultPopulationId) {
            return res.status(400).json({
                success: false,
                error: 'Population ID is required',
                message: 'Please select a population for the modify operation',
                sessionId
            });
        }
        
        // Parse CSV file content from uploaded buffer
        // Convert buffer to string and split into lines, filtering out empty lines
        const csvContent = req.file.buffer.toString('utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Validate CSV structure: must have header row and at least one data row
        if (lines.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Invalid CSV file',
                message: 'CSV file must have at least a header row and one data row',
                sessionId
            });
        }
        
        // Parse CSV headers from the first line
        const headers = lines[0].split(',').map(h => h.trim());
        const users = [];
        
        // Parse each data row into user objects
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const user = {};
            
            // Map each header to its corresponding value
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // Remove surrounding quotes if present (handles quoted CSV values)
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                user[header] = value;
            });
            
            // Only include users that have either username or email (required for lookup)
            if (user.username || user.email) {
                users.push(user);
            }
        }
        
        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid users found',
                message: 'CSV file must contain at least one user with username or email',
                sessionId
            });
        }
        
        // Get settings for environment ID
        const settingsResponse = await fetch('http://localhost:4000/api/settings');
        if (!settingsResponse.ok) {
            return res.status(500).json({
                success: false,
                error: 'Failed to load settings',
                message: 'Could not load settings from server',
                sessionId
            });
        }
        const settingsData = await settingsResponse.json();
        const settings = settingsData.success && settingsData.data ? settingsData.data : settingsData;
        const environmentId = settings.environmentId;
        
        if (!environmentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing environment ID',
                message: 'Please configure your PingOne environment ID in settings',
                sessionId
            });
        }
        
        // Initialize results tracking object for detailed reporting
        // Tracks various outcome categories for comprehensive result analysis
        const results = {
            total: users.length,
            modified: 0,
            created: 0,
            failed: 0,
            skipped: 0,
            noChanges: 0,
            details: []
        };
        
        // Configure batch processing to avoid overwhelming the PingOne API
        // Small batches with delays help prevent rate limiting and improve reliability
        const batchSize = 5;
        const delayBetweenBatches = 1000; // 1 second delay between batches
        
        // Initialize tracking variables
        let processed = 0;
        let status = 'pending';
        
        // Default population info (will be updated if user has population data)
        let populationInfo = {
            name: 'Unknown',
            id: defaultPopulationId || settings.populationId || ''
        };
        
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            for (const user of batch) {
                try {
                    // Find existing user in PingOne by username or email
                    // Uses PingOne API filtering to locate users efficiently
                    let existingUser = null;
                    let lookupMethod = null;
                    
                    // First attempt: Look up user by username (preferred method)
                    if (user.username) {
                        const lookupResponse = await fetch(`/api/pingone/proxy?url=https://api.pingone.com/v1/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(user.username)}"`);
                        
                        if (lookupResponse.ok) {
                            const lookupData = await lookupResponse.json();
                            if (lookupData._embedded?.users?.length > 0) {
                                existingUser = lookupData._embedded.users[0];
                                lookupMethod = 'username';
                            }
                        }
                    }
                    
                    // Second attempt: Look up user by email if username lookup failed
                    if (!existingUser && user.email) {
                        const lookupResponse = await fetch(`/api/pingone/proxy?url=https://api.pingone.com/v1/environments/${environmentId}/users?filter=email eq "${encodeURIComponent(user.email)}"`);
                        
                        if (lookupResponse.ok) {
                            const lookupData = await lookupResponse.json();
                            if (lookupData._embedded?.users?.length > 0) {
                                existingUser = lookupData._embedded.users[0];
                                lookupMethod = 'email';
                            }
                        }
                    }
                    
                    // If user not found and createIfNotExists is enabled, create the user
                    if (!existingUser && createIfNotExists === 'true') {
                        try {
                            const userData = {
                                name: {
                                    given: user.firstName || user.givenName || '',
                                    family: user.lastName || user.familyName || ''
                                },
                                email: user.email,
                                username: user.username || user.email,
                                population: {
                                    id: user.populationId || defaultPopulationId || settings.populationId
                                },
                                enabled: user.enabled !== undefined ? user.enabled === 'true' : (defaultEnabled === 'true')
                            };
                            
                            // Add password if generatePasswords is enabled
                            if (generatePasswords === 'true') {
                                userData.password = {
                                    value: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
                                };
                            }
                            
                            const createResponse = await fetch(`/api/pingone/proxy?url=https://api.pingone.com/v1/environments/${environmentId}/users`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(userData)
                            });
                            
                            debugLog("User", `📡 Create response status: ${createResponse.status}`);
                            
                            // Log the actual API call details for debugging
                            debugLog("PingOne API", `🚀 Creating user via PingOne API`, {
                                endpoint: `/environments/${environmentId}/users`,
                                method: 'POST',
                                userData: {
                                    ...userData,
                                    password: userData.password ? '[HIDDEN]' : undefined
                                },
                                responseStatus: createResponse.status,
                                responseStatusText: createResponse.statusText
                            });
                            
                            if (createResponse.ok) {
                                // User created successfully
                                const createdUser = await createResponse.json();
                                debugLog("User", `✅ User created successfully: ${createdUser.id}`, {
                                    userId: createdUser.id,
                                    username: createdUser.username,
                                    email: createdUser.email,
                                    population: createdUser.population?.name || 'unknown'
                                });
                                
                                // Log successful API response
                                debugLog("PingOne API", `✅ User creation successful`, {
                                    userId: createdUser.id,
                                    username: createdUser.username,
                                    email: createdUser.email,
                                    populationId: createdUser.population?.id,
                                    populationName: createdUser.population?.name
                                });
                                
                                results.created++;
                                status = 'created';
                                results.details.push({ user, status, pingOneId: createdUser.id });
                            } else {
                                // User creation failed
                                const errorData = await createResponse.json().catch(() => ({}));
                                debugLog("User", `❌ Failed to create user: ${createResponse.status}`, {
                                    errorData,
                                    userData: {
                                        ...userData,
                                        password: userData.password ? '[HIDDEN]' : undefined
                                    }
                                });
                                
                                // Log failed API response
                                debugLog("PingOne API", `❌ User creation failed`, {
                                    statusCode: createResponse.status,
                                    statusText: createResponse.statusText,
                                    errorData: errorData,
                                    userData: {
                                        ...userData,
                                        password: userData.password ? '[HIDDEN]' : undefined
                                    }
                                });
                                
                                results.failed++;
                                status = 'failed';
                                results.details.push({ user, status, error: errorData.message || 'Failed to create user', statusCode: createResponse.status });
                            }
                        } catch (error) {
                            results.failed++;
                            results.details.push({
                                user,
                                status: 'failed',
                                error: error.message,
                                reason: 'User creation failed'
                            });
                        }
                        continue;
                    }
                    
                    // If user not found and createIfNotExists is disabled, skip
                    if (!existingUser) {
                        results.skipped++;
                        results.details.push({
                            user,
                            status: 'skipped',
                            reason: 'User not found and createIfNotExists is disabled'
                        });
                        continue;
                    }
                    
                    // Prepare changes for modification
                    const changes = {};
                    let hasChanges = false;
                    
                    // Map CSV fields to PingOne API fields
                    const fieldMappings = {
                        firstName: 'name.given',
                        lastName: 'name.family',
                        givenName: 'name.given',
                        familyName: 'name.family',
                        email: 'email',
                        phoneNumber: 'phoneNumber',
                        title: 'title',
                        department: 'department'
                    };
                    
                    // Check each field for changes
                    for (const [csvField, apiField] of Object.entries(fieldMappings)) {
                        if (user[csvField] !== undefined && user[csvField] !== '') {
                            if (apiField.startsWith('name.')) {
                                const nameField = apiField.split('.')[1];
                                if (!changes.name) {
                                    changes.name = { ...existingUser.name };
                                }
                                if (user[csvField] !== existingUser.name?.[nameField]) {
                                    changes.name[nameField] = user[csvField];
                                    hasChanges = true;
                                }
                            } else {
                                if (user[csvField] !== existingUser[apiField]) {
                                    changes[apiField] = user[csvField];
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                    
                    // Include required fields
                    if (hasChanges) {
                        changes.username = existingUser.username;
                        changes.email = existingUser.email;
                    }
                    
                    if (!hasChanges) {
                        results.noChanges++;
                        results.details.push({
                            user,
                            status: 'no_changes',
                            pingOneId: existingUser.id,
                            lookupMethod: lookupMethod
                        });
                        continue;
                    }
                    
                    // Update the user
                    const updateResponse = await fetch(`/api/pingone/proxy?url=https://api.pingone.com/v1/environments/${environmentId}/users/${existingUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(changes)
                    });
                    
                    if (updateResponse.ok) {
                        results.modified++;
                        results.details.push({
                            user,
                            status: 'modified',
                            pingOneId: existingUser.id,
                            changes,
                            lookupMethod: lookupMethod
                        });
                    } else {
                        results.failed++;
                        const errorData = await updateResponse.json().catch(() => ({}));
                        results.details.push({
                            user,
                            status: 'failed',
                            error: errorData.message || 'Update failed',
                            statusCode: updateResponse.status
                        });
                    }
                    
                } catch (error) {
                    debugLog("User", `❌ Error processing user ${user.username || user.email}`, {
                        error: error.message,
                        stack: error.stack
                    });
                    results.failed++;
                    status = 'failed';
                    results.details.push({ user, status, error: error.message });
                }
                
                processed++;
                
                // Send real-time progress event for each processed user
                // This provides immediate feedback to the frontend during long imports
                // Use the proper sendProgressEvent function for consistent event formatting
                const progressMessage = `Processing user ${processed}/${users.length}`;
                const progressCounts = { 
                    succeeded: results.created, 
                    failed: results.failed, 
                    skipped: results.skipped,
                    current: processed,
                    total: users.length
                };
                
                // Include population information in progress data
                const progressData = {
                    current: processed,
                    total: users.length,
                    message: progressMessage,
                    counts: progressCounts,
                    user: user, // Include current user being processed
                    populationName: populationInfo.name,
                    populationId: populationInfo.id,
                    // Include detailed status information for better UI feedback
                    status: status,
                    statusDetails: status === 'skipped' ? {
                        reason: skipReason,
                        existingUser: existingUser ? {
                            id: existingUser.id,
                            username: existingUser.username,
                            email: existingUser.email,
                            population: existingUser.population?.name || 'unknown'
                        } : null
                    } : null
                };
                
                // Send progress event with user details and population information
                const progressResult = sendProgressEvent(
                    sessionId, 
                    processed, 
                    users.length, 
                    progressMessage, 
                    progressCounts, 
                    user, // Include current user being processed
                    populationInfo.name, // populationName
                    populationInfo.id    // populationId
                );
                
                if (!progressResult) {
                    debugLog("SSE", `❌ Failed to send progress event for user ${processed}/${users.length}`);
                } else {
                    debugLog("SSE", `✅ Progress event sent successfully for user ${processed}/${users.length}`);
                }
            }
            
            // Add delay between batches to prevent API rate limiting
            // This ensures we don't overwhelm the PingOne API with too many requests
            if (i + batchSize < users.length && delayBetweenBatches > 0) {
                debugLog("Import", `⏱️ Adding delay between batches: ${delayBetweenBatches}ms`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
        debugLog("Import", "🏁 Import process completed", {
            results,
            summary: {
                total: results.total,
                created: results.created,
                failed: results.failed,
                skipped: results.skipped
            }
        });
        
        // Send final completion event to frontend using proper function
        // This signals that the import process has finished and provides final results
        const finalMessage = `Modify completed: ${results.modified} modified, ${results.created} created, ${results.failed} failed, ${results.skipped} skipped`;
        const finalCounts = { 
            succeeded: results.modified + results.created, 
            failed: results.failed, 
            skipped: results.skipped,
            current: users.length,
            total: users.length
        };
        
        const completionResult = sendCompletionEvent(
            sessionId, 
            users.length, 
            users.length, 
            finalMessage, 
            finalCounts
        );
        
        if (completionResult) {
            debugLog("SSE", "✅ Completion event sent successfully");
        } else {
            debugLog("SSE", "❌ Failed to send completion event");
        }
        
        // Return the final results to the client
        res.json({
            success: true,
            sessionId,
            results,
            summary: {
                total: results.total,
                modified: results.modified,
                created: results.created,
                failed: results.failed,
                skipped: results.skipped,
                noChanges: results.noChanges
            }
        });
        
    } catch (error) {
        // Handle any unexpected errors during the modify process
        debugLog("Modify", "❌ Error in modify process", {
            error: error.message,
            stack: error.stack
        });
        
        // Send error event to frontend via SSE using proper function
        // This ensures the user is notified of any failures
        const errorResult = sendErrorEvent(
            sessionId, 
            'Modify failed', 
            error.message, 
            { stack: error.stack }
        );
        
        if (errorResult) {
            debugLog("SSE", "✅ Error event sent successfully");
        } else {
            debugLog("SSE", "❌ Failed to send error event");
        }
        
        // Return error response to client
        res.status(500).json({
            success: false,
            error: 'Modify operation failed',
            message: error.message,
            sessionId
        });
    }
});

// Resolve invalid population endpoint
router.post('/import/resolve-invalid-population', async (req, res, next) => {
    try {
        const { sessionId, selectedPopulationId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        if (!selectedPopulationId) {
            return res.status(400).json({ error: 'Selected population ID is required' });
        }
        
        // Store the resolution in a way that the background process can access
        if (!global.invalidPopulationResolutions) {
            global.invalidPopulationResolutions = new Map();
        }
        
        global.invalidPopulationResolutions.set(sessionId, {
            selectedPopulationId
        });
        
        res.json({ success: true, message: 'Invalid population resolution stored' });
        
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// PINGONE API PROXY ENDPOINTS
// ============================================================================

/**
 * GET /api/pingone/populations
 * Fetches available populations from PingOne API
 * 
 * This endpoint acts as a proxy to the PingOne API, fetching all available
 * populations for the configured environment. It handles authentication and
 * returns the populations in a simplified array format for frontend consumption.
 * 
 * @returns {Array} Array of population objects with id, name, and other properties
 */
router.get('/pingone/populations', async (req, res, next) => {
    try {
        debugLog("Populations", "Fetching populations from PingOne");
        
        // Get application settings to determine environment ID
        const settingsResponse = await fetch('http://localhost:4000/api/settings');
        if (!settingsResponse.ok) {
            console.error('[DEBUG] Failed to fetch settings:', settingsResponse.status);
            return res.status(500).json({ 
                error: 'Failed to load settings',
                message: 'Could not load settings from server'
            });
        }
        
        const settingsData = await settingsResponse.json();
        
        // Handle different settings response formats
        // Some endpoints return {success, data} while others return the data directly
        const settings = settingsData.success && settingsData.data ? settingsData.data : settingsData;
        
        if (!settings || typeof settings !== 'object') {
            console.error('[DEBUG] Invalid settings response:', settingsData);
            return res.status(500).json({ 
                error: 'Invalid settings data',
                message: 'Settings response format is invalid'
            });
        }
        const environmentId = settings.environmentId;
        
        if (!environmentId) {
            console.error('[DEBUG] No environment ID in settings');
            return res.status(400).json({ 
                error: 'Missing environment ID',
                message: 'Please configure your PingOne environment ID in settings'
            });
        }
        
        console.log('[DEBUG] Using environment ID:', environmentId);
        
        // Get token manager from app
        const tokenManager = req.app.get('tokenManager');
        if (!tokenManager) {
            console.error('[DEBUG] Token manager not available');
            return res.status(500).json({ 
                error: 'Token manager not available',
                message: 'Server token manager is not initialized'
            });
        }
        
        // Get access token
        const token = await tokenManager.getAccessToken();
        if (!token) {
            console.error('[DEBUG] Failed to get access token');
            return res.status(500).json({ 
                error: 'Failed to get access token',
                message: 'Could not authenticate with PingOne'
            });
        }
        
        // Call PingOne API directly
        const apiUrl = `https://api.pingone.com/v1/environments/${environmentId}/populations`;
        console.log('[DEBUG] Calling PingOne API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DEBUG] PingOne API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'PingOne API error',
                message: `API returned ${response.status}: ${errorText}`,
                status: response.status
            });
        }
        
        const data = await response.json();
        console.log('[DEBUG] Populations response:', data);
        
        const populations = data._embedded && Array.isArray(data._embedded.populations) 
            ? data._embedded.populations 
            : [];
            
        res.json(populations);
        
    } catch (error) {
        console.error('[DEBUG] Error in /api/pingone/populations:', error);
        res.status(500).json({
            success: false,
            error: 'fetch failed',
            stack: error.stack,
            timestamp: new Date().toISOString(),
            path: '/api/pingone/populations',
            method: 'GET'
        });
    }
});

/**
 * POST /api/pingone/get-token
 * Retrieves access token for PingOne API authentication
 * 
 * This endpoint provides access tokens to the frontend for direct PingOne API
 * calls. It uses the server's token manager to handle authentication and token
 * refresh automatically. Returns token information in the format expected by
 * the PingOneClient frontend library.
 * 
 * @returns {Object} Token response with access_token, expires_in, and token_type
 */
router.post('/pingone/get-token', async (req, res, next) => {
    try {
        debugLog("Token", "Getting access token from PingOne");
        
        // Get token manager from Express app context
        // The token manager handles authentication and token refresh
        const tokenManager = req.app.get('tokenManager');
        if (!tokenManager) {
            console.error('[DEBUG] Token manager not available');
            return res.status(500).json({ 
                success: false,
                error: 'Token manager not available',
                message: 'Server token manager is not initialized'
            });
        }
        
        console.log('[DEBUG] Token manager found, getting access token...');
        
        // Retrieve access token from token manager
        // This handles token refresh automatically if needed
        const token = await tokenManager.getAccessToken();
        if (!token) {
            console.error('[DEBUG] Failed to get access token');
            return res.status(500).json({ 
                success: false,
                error: 'Failed to get access token',
                message: 'Could not authenticate with PingOne'
            });
        }
        
        console.log('[DEBUG] Access token obtained, getting token info...');
        
        // Get additional token information for debugging and validation
        const tokenInfo = tokenManager.getTokenInfo();
        
        console.log('[DEBUG] Token retrieved successfully, token info:', {
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            expiresIn: tokenInfo ? tokenInfo.expiresIn : 'unknown',
            isValid: tokenInfo ? tokenInfo.isValid : false
        });
        
        // Return token in the format expected by PingOneClient frontend library
        // This includes all necessary fields for API authentication
        const response = {
            success: true,
            access_token: token,
            expires_in: tokenInfo ? tokenInfo.expiresIn : 3600, // Default to 1 hour if not available
            token_type: 'Bearer',
            message: 'Token retrieved successfully'
        };
        
        console.log('[DEBUG] Sending response to frontend');
        res.json(response);
        
    } catch (error) {
        console.error('[DEBUG] Error in /api/pingone/get-token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get token',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            path: '/api/pingone/get-token',
            method: 'POST'
        });
    }
});

// ============================================================================
// WORKER TOKEN ENDPOINT
// ============================================================================

/**
 * @swagger
 * /api/token:
 *   post:
 *     summary: Get PingOne Worker Access Token
 *     description: |
 *       Retrieves a worker access token from PingOne using client credentials flow.
 *       This token is required for authenticating subsequent API calls to PingOne services.
 *       
 *       ## Authentication Flow
 *       1. This endpoint uses client credentials (client_id + client_secret) to authenticate
 *       2. Returns an access token with expiry time for use in other API calls
 *       3. The token should be included in Authorization header as "Bearer {token}"
 *       
 *       ## Usage
 *       - Use this token in the Authorization header for other PingOne API calls
 *       - Token expires after the specified time (typically 1 hour)
 *       - Store the token securely and refresh before expiry
 *       
 *       ## Security Notes
 *       - Client credentials are read from environment variables or settings file
 *       - Never expose client_secret in client-side code
 *       - Use HTTPS in production to protect credentials
 *     tags:
 *       - Authentication
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_id:
 *                 type: string
 *                 description: PingOne client ID (optional, uses server config if not provided)
 *                 example: "26e7f07c-11a4-402a-b064-07b55aee189e"
 *               client_secret:
 *                 type: string
 *                 description: PingOne client secret (optional, uses server config if not provided)
 *                 example: "your-client-secret"
 *               grant_type:
 *                 type: string
 *                 description: OAuth grant type (defaults to client_credentials)
 *                 example: "client_credentials"
 *                 default: "client_credentials"
 *     responses:
 *       200:
 *         description: Successfully retrieved access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *             example:
 *               success: true
 *               data:
 *                 access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 token_type: "Bearer"
 *                 expires_in: 3600
 *                 scope: "p1:read:user p1:write:user"
 *                 expires_at: "2025-07-12T16:45:32.115Z"
 *               message: "Access token retrieved successfully"
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Invalid client credentials"
 *               details:
 *                 code: "INVALID_CREDENTIALS"
 *       401:
 *         description: Unauthorized - invalid client credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Invalid client credentials"
 *               details:
 *                 code: "UNAUTHORIZED"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Failed to retrieve access token"
 *               details:
 *                 code: "TOKEN_ERROR"
 */
router.post('/token', async (req, res) => {
    try {
        debugLog("Token", "🔑 Worker token request received");
        
        // Get token manager from app
        const tokenManager = req.app.get('tokenManager');
        if (!tokenManager) {
            debugLog("Token", "❌ Token manager not available");
            return res.status(500).json({
                success: false,
                error: "Token manager not available",
                details: { code: "TOKEN_MANAGER_ERROR" }
            });
        }

        // Get custom credentials from request body (optional)
        const { client_id, client_secret, grant_type = 'client_credentials' } = req.body;
        
        // Validate grant type
        if (grant_type !== 'client_credentials') {
            debugLog("Token", "❌ Invalid grant type", { grant_type });
            return res.status(400).json({
                success: false,
                error: "Only client_credentials grant type is supported",
                details: { code: "INVALID_GRANT_TYPE" }
            });
        }

        // Create custom settings if client credentials provided
        let customSettings = null;
        if (client_id && client_secret) {
            debugLog("Token", "🔧 Using custom client credentials");
            customSettings = {
                clientId: client_id,
                clientSecret: client_secret,
                environmentId: req.app.get('environmentId') || process.env.PINGONE_ENVIRONMENT_ID
            };
        }

        // Get access token
        const token = await tokenManager.getAccessToken(customSettings);
        if (!token) {
            debugLog("Token", "❌ Failed to get access token");
            return res.status(401).json({
                success: false,
                error: "Failed to retrieve access token",
                details: { code: "TOKEN_ERROR" }
            });
        }

        // Get token info for response
        const tokenInfo = tokenManager.getTokenInfo();
        
        debugLog("Token", "✅ Access token retrieved successfully", {
            expiresIn: tokenInfo.expiresIn,
            expiresAt: tokenInfo.expiresAt
        });

        // Return token response
        res.json({
            success: true,
            data: {
                access_token: token,
                token_type: "Bearer",
                expires_in: tokenInfo.expiresIn,
                scope: "p1:read:user p1:write:user p1:read:population p1:write:population",
                expires_at: tokenInfo.expiresAt
            },
            message: "Access token retrieved successfully"
        });

    } catch (error) {
        debugLog("Token", "❌ Token request failed", { error: error.message });
        
        // Determine appropriate error response
        let statusCode = 500;
        let errorCode = "TOKEN_ERROR";
        
        if (error.message.includes("credentials") || error.message.includes("unauthorized")) {
            statusCode = 401;
            errorCode = "UNAUTHORIZED";
        } else if (error.message.includes("invalid") || error.message.includes("bad request")) {
            statusCode = 400;
            errorCode = "INVALID_CREDENTIALS";
        }

        res.status(statusCode).json({
            success: false,
            error: "Failed to retrieve access token",
            details: {
                code: errorCode,
                message: error.message
            }
        });
    }
});

// ============================================================================
// DELETE USERS API ENDPOINT
// ============================================================================

/**
 * @swagger
 * /api/delete-users:
 *   post:
 *     summary: Delete users from PingOne environment
 *     description: |
 *       Deletes users from the PingOne environment based on the specified type:
 *       - File-based: Delete users listed in uploaded CSV file
 *       - Population-based: Delete all users in a specific population
 *       - Environment-based: Delete ALL users in the environment (requires confirmation)
 *       
 *       ## Delete Types
 *       1. **File-based**: Upload CSV with usernames/emails to delete specific users
 *       2. **Population-based**: Delete all users in a selected population
 *       3. **Environment-based**: Delete ALL users in the environment (IRREVERSIBLE)
 *       
 *       ## Security & Confirmation
 *       - Environment deletion requires "DELETE ALL" text confirmation
 *       - All deletions are logged for audit purposes
 *       - Skip option available for missing users
 *       
 *       ## Response
 *       Returns deletion statistics including count of deleted and skipped users
 *     tags:
 *       - User Management
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [file, population, environment]
 *                 description: Type of deletion to perform
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with users to delete (for file-based deletion)
 *               populationId:
 *                 type: string
 *                 description: Population ID to delete all users from (for population-based deletion)
 *               confirmation:
 *                 type: string
 *                 description: DELETE ALL confirmation text for environment-based deletion
 *               skipNotFound:
 *                 type: boolean
 *                 description: Skip users not found in the population
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 deletedCount:
 *                   type: number
 *                 skippedCount:
 *                   type: number
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request - invalid parameters or missing confirmation
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
/**
 * @swagger
 * /api/delete-users:
 *   post:
 *     summary: Delete users from PingOne
 *     description: |
 *       Deletes users from PingOne based on different criteria. This endpoint supports
 *       three deletion modes: file-based, population-based, and environment-wide deletion.
 *       
 *       ## Deletion Types
 *       - **File-based**: Delete users specified in a CSV file
 *       - **Population-based**: Delete all users in a specific population
 *       - **Environment-wide**: Delete all users in the environment (requires confirmation)
 *       
 *       ## Security Features
 *       - Environment-wide deletion requires explicit 'DELETE ALL' confirmation
 *       - All operations are logged for audit purposes
 *       - Rate limiting to prevent accidental mass deletions
 *       
 *       ## CSV Format (for file-based deletion)
 *       - Must contain header row with column names
 *       - Required columns: username, email, or user (for user identification)
 *       - Optional columns: additional user data for verification
 *       - Maximum file size: 10MB
 *       
 *       ## Error Handling
 *       - Validates user existence before deletion
 *       - Handles missing users gracefully (configurable)
 *       - Provides detailed error reporting
 *       
 *       ## Rate Limiting
 *       Deletion operations are processed in batches to respect PingOne API limits.
 *     tags: [User Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing users to delete (required for file-based deletion)
 *               type:
 *                 type: string
 *                 enum: [file, population, environment]
 *                 description: Type of deletion to perform
 *                 example: file
 *               populationId:
 *                 type: string
 *                 description: Population ID for population-based deletion
 *                 example: 3840c98d-202d-4f6a-8871-f3bc66cb3fa8
 *               confirmation:
 *                 type: string
 *                 description: Confirmation text for environment-wide deletion
 *                 example: DELETE ALL
 *               skipNotFound:
 *                 type: string
 *                 enum: [true, false]
 *                 description: Skip users that are not found
 *                 example: "true"
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deletedCount:
 *                   type: number
 *                   description: Number of users successfully deleted
 *                   example: 50
 *                 skippedCount:
 *                   type: number
 *                   description: Number of users skipped (not found)
 *                   example: 5
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of error messages
 *                   example: ["User not found: john.doe@example.com"]
 *                 message:
 *                   type: string
 *                   example: "Successfully deleted 50 users"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Invalid delete type. Must be 'file', 'population', or 'environment'"
 *               message: "Invalid delete type. Must be 'file', 'population', or 'environment'"
 *       401:
 *         description: Authentication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/delete-users', upload.single('file'), async (req, res) => {
    try {
        debugLog("Delete", "🗑️ Delete users request received", { 
            type: req.body.type,
            hasFile: !!req.file,
            populationId: req.body.populationId,
            confirmation: req.body.confirmation ? 'PROVIDED' : 'MISSING'
        });

        const { type, populationId, confirmation, skipNotFound } = req.body;
        const file = req.file;

        // Validate delete type
        if (!type || !['file', 'population', 'environment'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: "Invalid delete type. Must be 'file', 'population', or 'environment'",
                message: "Invalid delete type. Must be 'file', 'population', or 'environment'"
            });
        }

        // Get token manager
        const tokenManager = req.app.get('tokenManager');
        if (!tokenManager) {
            return res.status(500).json({
                success: false,
                error: "Token manager not available",
                message: "Token manager not available"
            });
        }

        // Get access token
        const token = await tokenManager.getAccessToken();
        if (!token) {
            return res.status(401).json({
                success: false,
                error: "Failed to get access token",
                message: "Failed to get access token"
            });
        }

        // Get environment ID
        const settingsResponse = await fetch('http://localhost:4000/api/settings');
        if (!settingsResponse.ok) {
            return res.status(500).json({
                success: false,
                error: "Failed to load settings",
                message: "Failed to load settings"
            });
        }
        const settingsData = await settingsResponse.json();
        const settings = settingsData.success && settingsData.data ? settingsData.data : settingsData;
        const environmentId = settings.environmentId;

        if (!environmentId) {
            return res.status(500).json({
                success: false,
                error: "Environment ID not configured",
                message: "Environment ID not configured"
            });
        }

        let usersToDelete = [];
        let deleteType = '';

        // Prepare users to delete based on type
        switch (type) {
            case 'file':
                if (!file) {
                    return res.status(400).json({
                        success: false,
                        error: "File is required for file-based deletion",
                        message: "File is required for file-based deletion"
                    });
                }
                usersToDelete = await parseDeleteFile(file);
                deleteType = 'FILE_BASED';
                break;

            case 'population':
                if (!populationId) {
                    return res.status(400).json({
                        success: false,
                        error: "Population ID is required for population-based deletion",
                        message: "Population ID is required for population-based deletion"
                    });
                }
                usersToDelete = await getUsersInPopulation(token, environmentId, populationId);
                deleteType = 'POPULATION_BASED';
                break;

            case 'environment':
                if (confirmation !== 'DELETE ALL') {
                    return res.status(400).json({
                        success: false,
                        error: "Environment deletion requires 'DELETE ALL' confirmation",
                        message: "Environment deletion requires 'DELETE ALL' confirmation"
                    });
                }
                usersToDelete = await getAllUsers(token, environmentId);
                deleteType = 'FULL_ENVIRONMENT';
                break;
        }

        debugLog("Delete", `📋 Users to delete prepared`, { 
            count: usersToDelete.length,
            type: deleteType
        });

        // Validate that we have users to delete
        if (!usersToDelete || usersToDelete.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No users found to delete",
                message: "No users found to delete. Please check your selection criteria."
            });
        }

        // Perform deletion
        const result = await performUserDeletion(token, environmentId, usersToDelete, skipNotFound === 'true');

        // Log the deletion operation
        logDeleteOperation(req, deleteType, usersToDelete.length, result);

        res.json({
            success: true,
            deletedCount: result.deletedCount,
            skippedCount: result.skippedCount,
            errors: result.errors,
            message: `Successfully deleted ${result.deletedCount} users`
        });

    } catch (error) {
        debugLog("Delete", "❌ Delete operation failed", { error: error.message });
        
        res.status(500).json({
            success: false,
            error: "Delete operation failed",
            message: error.message,
            details: error.message
        });
    }
});

/**
 * Parse CSV file for user deletion
 */
async function parseDeleteFile(file) {
    const csvContent = file.buffer.toString('utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const users = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const user = {};
        
        headers.forEach((header, j) => {
            user[header] = values[j] || '';
        });

        // Extract username or email
        const username = user.username || user.email || user.user;
        if (username) {
            users.push({ username, lineNumber: i + 1 });
        }
    }

    return users;
}

/**
 * Get all users in a specific population
 */
async function getUsersInPopulation(token, environmentId, populationId) {
    const url = `https://api.pingone.com/v1/environments/${environmentId}/populations/${populationId}/users`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get users in population: ${response.statusText}`);
    }

    const data = await response.json();
    return data._embedded.users.map(user => ({ 
        username: user.username || user.email,
        userId: user.id 
    }));
}

/**
 * Get all users in the environment
 */
async function getAllUsers(token, environmentId) {
    const url = `https://api.pingone.com/v1/environments/${environmentId}/users`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get all users: ${response.statusText}`);
    }

    const data = await response.json();
    return data._embedded.users.map(user => ({ 
        username: user.username || user.email,
        userId: user.id 
    }));
}

/**
 * Perform the actual user deletion
 */
async function performUserDeletion(token, environmentId, users, skipNotFound) {
    let deletedCount = 0;
    let skippedCount = 0;
    let errors = [];

    for (const user of users) {
        try {
            // If we have userId, use it directly
            if (user.userId) {
                const deleteUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${user.userId}`;
                const response = await fetch(deleteUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    deletedCount++;
                    debugLog("Delete", `✅ Deleted user: ${user.username}`);
                } else if (response.status === 404 && skipNotFound) {
                    skippedCount++;
                    debugLog("Delete", `⏭️ Skipped user not found: ${user.username}`);
                } else {
                    const error = `Failed to delete user ${user.username}: ${response.statusText}`;
                    errors.push(error);
                    debugLog("Delete", `❌ ${error}`);
                }
            } else {
                // Search for user by username/email first
                const searchUrl = `https://api.pingone.com/v1/environments/${environmentId}/users?username=${encodeURIComponent(user.username)}`;
                const searchResponse = await fetch(searchUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData._embedded && searchData._embedded.users.length > 0) {
                        const userId = searchData._embedded.users[0].id;
                        const deleteUrl = `https://api.pingone.com/v1/environments/${environmentId}/users/${userId}`;
                        const deleteResponse = await fetch(deleteUrl, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (deleteResponse.ok) {
                            deletedCount++;
                            debugLog("Delete", `✅ Deleted user: ${user.username}`);
                        } else {
                            const error = `Failed to delete user ${user.username}: ${deleteResponse.statusText}`;
                            errors.push(error);
                            debugLog("Delete", `❌ ${error}`);
                        }
                    } else if (skipNotFound) {
                        skippedCount++;
                        debugLog("Delete", `⏭️ Skipped user not found: ${user.username}`);
                    } else {
                        const error = `User not found: ${user.username}`;
                        errors.push(error);
                        debugLog("Delete", `❌ ${error}`);
                    }
                } else {
                    const error = `Failed to search for user ${user.username}: ${searchResponse.statusText}`;
                    errors.push(error);
                    debugLog("Delete", `❌ ${error}`);
                }
            }

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
        const errorMsg = `Error deleting user ${user.username}: ${error.message}`;
        errors.push(errorMsg);
        debugLog("Delete", `❌ ${errorMsg}`);
        
        // Log additional error details for debugging
        if (error.response) {
            debugLog("Delete", `❌ API Error Details`, {
                status: error.response.status,
                statusText: error.response.statusText,
                user: user.username
            });
        }
    }
    }

    return { deletedCount, skippedCount, errors };
}

/**
 * Log deletion operation for audit purposes
 */
function logDeleteOperation(req, deleteType, totalUsers, result) {
    const logger = req.app.get('importLogger') || console;
    
    logger.info(logSeparator());
    logger.info(logTag('DELETE OPERATION SUMMARY'), { tag: logTag('DELETE OPERATION SUMMARY'), separator: logSeparator('-') });
    logger.info(`[${new Date().toISOString()}] [INFO] Delete operation completed`, {
        deleteType,
        totalUsers,
        deletedCount: result.deletedCount,
        skippedCount: result.skippedCount,
        errorCount: result.errors?.length || 0,
        duration: result.duration || 0
    });
    logger.info(logTag('END OF DELETE'), { tag: logTag('END OF DELETE'), separator: logSeparator() });
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'DELETE_USERS',
        type: deleteType,
        totalUsers,
        deletedCount: result.deletedCount,
        skippedCount: result.skippedCount,
        errors: result.errors,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    };

    // Log to console for debugging
    debugLog("Delete", "📝 Delete operation logged", logEntry);

    // TODO: Add to centralized logging system
    // This could be sent to a logging service or stored in database
}

// ============================================================================
// Export Token Management
// ============================================================================

/**
 * Generate export-specific token with override credentials
 * POST /api/export-token
 */
router.post('/export-token', async (req, res) => {
    try {
        const logger = req.app.get('importLogger') || console;
        
        logger.info(logSeparator());
        logger.info(logTag('START OF EXPORT TOKEN GENERATION'), { tag: logTag('START OF EXPORT TOKEN GENERATION'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Export token generation started`, {
            environmentId: req.body.environmentId,
            region: req.body.region,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        if (logger.flush) await logger.flush();
        
        debugLog("Export", "🔑 Generating export token with override credentials");
        
        const { environmentId, apiClientId, apiSecret, region } = req.body;
        
        // Validate required fields
        if (!environmentId || !apiClientId || !apiSecret) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: environmentId, apiClientId, apiSecret'
            });
        }

        // Determine region TLD
        const regionInfo = getRegionInfo(region || 'NA');
        const tokenUrl = `https://auth.pingone.${regionInfo.tld}/${environmentId}/as/token`;
        
        // Generate token using override credentials
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'openid export delete'
            }),
            auth: {
                username: apiClientId,
                password: apiSecret
            }
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            debugLog("Export", `❌ Token generation failed: ${tokenResponse.status} ${errorText}`);
            return res.status(400).json({
                success: false,
                error: `Failed to generate token: ${tokenResponse.statusText}`,
                details: errorText
            });
        }

        const tokenData = await tokenResponse.json();
        
        // Calculate expiration time (60 minutes from now)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        
        debugLog("Export", "✅ Export token generated successfully", {
            environmentId,
            expiresAt,
            scopes: tokenData.scope
        });
        if (logger.flush) await logger.flush();

        // Log token generation for audit
        logExportTokenGeneration(req, environmentId, expiresAt);

        res.json({
            success: true,
            token: tokenData.access_token,
            expiresAt: expiresAt,
            scopes: tokenData.scope,
            environmentId: environmentId
        });

    } catch (error) {
        const logger = req.app.get('importLogger') || console;
        logger.error(`[${new Date().toISOString()}] [ERROR] Export token generation failed: ${error.message}`, {
            error: error.message,
            stack: error.stack,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        if (logger.flush) await logger.flush();
        
        debugLog("Export", `❌ Error generating export token: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to generate export token',
            details: error.message
        });
    }
});

/**
 * Enhanced export users endpoint with credential override support
 * POST /api/export-users
 */
router.post('/export-users', async (req, res) => {
    try {
        const logger = req.app.get('importLogger') || console;
        
        logger.info(logSeparator());
        logger.info(logTag('START OF EXPORT OPERATION'), { tag: logTag('START OF EXPORT OPERATION'), separator: logSeparator() });
        logger.info(`[${new Date().toISOString()}] [INFO] Export operation started`, {
            populationId: req.body.populationId,
            populationName: req.body.populationName,
            userStatusFilter: req.body.userStatusFilter,
            format: req.body.format,
            includeDisabled: req.body.includeDisabled,
            includeMetadata: req.body.includeMetadata,
            useOverrideCredentials: req.body.useOverrideCredentials,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        if (logger.flush) await logger.flush();
        
        debugLog("Export", "📤 Starting enhanced export operation");
        
        const {
            populationId,
            populationName,
            userStatusFilter,
            format,
            includeDisabled,
            includeMetadata,
            useOverrideCredentials,
            exportToken
        } = req.body;

        // Validate population selection
        if (!populationId) {
            return res.status(400).json({
                success: false,
                error: 'Population ID is required'
            });
        }

        // Get token based on credential override
        let token;
        let environmentId;
        
        if (useOverrideCredentials && exportToken) {
            // Use override credentials and provided token
            token = exportToken;
            // Extract environment ID from token if possible
            try {
                const decoded = decodeJWT(exportToken);
                environmentId = decoded.payload.env || req.app.get('environmentId');
            } catch (error) {
                environmentId = req.app.get('environmentId');
            }
            debugLog("Export", "🔑 Using override credentials for export");
        } else {
            // Use shared app credentials
            token = req.app.get('token');
            environmentId = req.app.get('environmentId');
            debugLog("Export", "🔑 Using shared app credentials for export");
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'No valid token available for export'
            });
        }

        // Build export URL based on population selection
        let exportUrl;
        if (populationId === 'ALL') {
            exportUrl = `https://api.pingone.com/v1/environments/${environmentId}/users`;
        } else {
            exportUrl = `https://api.pingone.com/v1/environments/${environmentId}/populations/${populationId}/users`;
        }

        // Add query parameters for filtering
        const params = new URLSearchParams();
        if (userStatusFilter && userStatusFilter !== 'all') {
            params.append('filter', `status eq "${userStatusFilter}"`);
        }
        if (!includeDisabled) {
            params.append('filter', 'enabled eq true');
        }

        if (params.toString()) {
            exportUrl += `?${params.toString()}`;
        }

        debugLog("Export", "📡 Fetching users for export", {
            url: exportUrl,
            populationId,
            userStatusFilter,
            includeDisabled
        });

        // Fetch users from PingOne API
        const response = await fetch(exportUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            debugLog("Export", `❌ Failed to fetch users: ${response.status} ${errorText}`);
            return res.status(response.status).json({
                success: false,
                error: `Failed to fetch users: ${response.statusText}`,
                details: errorText
            });
        }

        const data = await response.json();
        const users = data._embedded?.users || [];

        debugLog("Export", `✅ Fetched ${users.length} users for export`);
        if (logger.flush) await logger.flush();

        // Process and format export data
        const exportData = users.map(user => {
            const userData = {
                id: user.id,
                username: user.username,
                email: user.email,
                givenName: user.name?.given,
                familyName: user.name?.family,
                status: user.enabled ? 'active' : 'inactive',
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            // Add metadata if requested
            if (includeMetadata && user.metadata) {
                userData.metadata = user.metadata;
            }

            return userData;
        });

        // Format export data
        let formattedData;
        let filename;
        let contentType;

        if (format === 'json') {
            formattedData = JSON.stringify(exportData, null, 2);
            filename = `users_export_${populationName || populationId}_${new Date().toISOString().split('T')[0]}.json`;
            contentType = 'application/json';
        } else {
            // CSV format
            const headers = Object.keys(exportData[0] || {});
            const csvRows = [
                headers.join(','),
                ...exportData.map(user => 
                    headers.map(header => {
                        const value = user[header];
                        return typeof value === 'string' && value.includes(',') 
                            ? `"${value.replace(/"/g, '""')}"` 
                            : value || '';
                    }).join(',')
                )
            ];
            formattedData = csvRows.join('\n');
            filename = `users_export_${populationName || populationId}_${new Date().toISOString().split('T')[0]}.csv`;
            contentType = 'text/csv';
        }

        // Log export operation
        logExportOperation(req, {
            populationId,
            populationName,
            userCount: users.length,
            format,
            includeDisabled,
            includeMetadata,
            useOverrideCredentials
        });

        // Set response headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(formattedData, 'utf8'));

        debugLog("Export", "✅ Export completed successfully", {
            userCount: users.length,
            format,
            filename
        });
        if (logger.flush) await logger.flush();

        res.send(formattedData);

    } catch (error) {
        const logger = req.app.get('importLogger') || console;
        logger.error(`[${new Date().toISOString()}] [ERROR] Export operation failed: ${error.message}`, {
            error: error.message,
            stack: error.stack,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });
        if (logger.flush) await logger.flush();
        
        debugLog("Export", `❌ Export error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Export failed',
            details: error.message
        });
    }
});

/**
 * Decode JWT token for environment extraction
 */
function decodeJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return { payload };
}

/**
 * Log export token generation for audit
 */
function logExportTokenGeneration(req, environmentId, expiresAt) {
    const logger = req.app.get('importLogger') || console;
    
    logger.info(logSeparator());
    logger.info(logTag('EXPORT TOKEN GENERATION'), { tag: logTag('EXPORT TOKEN GENERATION'), separator: logSeparator() });
    logger.info(`[${new Date().toISOString()}] [INFO] Export token generated`, {
        environmentId,
        expiresAt,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger.info(logTag('END OF TOKEN GENERATION'), { tag: logTag('END OF TOKEN GENERATION'), separator: logSeparator() });
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'EXPORT_TOKEN_GENERATION',
        environmentId,
        expiresAt,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    };

    debugLog("Export", "📝 Export token generation logged", logEntry);
}

/**
 * Log export operation for audit
 */
function logExportOperation(req, operationData) {
    const logger = req.app.get('importLogger') || console;
    
    logger.info(logSeparator());
    logger.info(logTag('EXPORT OPERATION SUMMARY'), { tag: logTag('EXPORT OPERATION SUMMARY'), separator: logSeparator('-') });
    logger.info(`[${new Date().toISOString()}] [INFO] Export operation completed`, {
        populationId: operationData.populationId,
        populationName: operationData.populationName,
        userCount: operationData.userCount,
        format: operationData.format,
        includeDisabled: operationData.includeDisabled,
        includeMetadata: operationData.includeMetadata,
        useOverrideCredentials: operationData.useOverrideCredentials,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    logger.info(logTag('END OF EXPORT'), { tag: logTag('END OF EXPORT'), separator: logSeparator() });
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'EXPORT_USERS',
        ...operationData,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    };

    debugLog("Export", "📝 Export operation logged", logEntry);
}

// ============================================================================
// Export the configured router with all API endpoints
export default router;
