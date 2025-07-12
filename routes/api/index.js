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
import express from 'express';
import multer from 'multer';
import { logSSEEvent, handleSSEError, generateConnectionId, updateSSEMetrics } from '../../server/sse-logger.js';

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
        
        // Process users in batches to avoid rate limiting
        const batchSize = 5;
        const delayBetweenBatches = 1000; // 1 second delay between batches
        
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            debugLog("Import", `📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`, {
                batchSize: batch.length,
                startIndex: i
            });
            
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
                                { processed, created, skipped, failed }, username, populationName, populationId);
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
                        sendProgressEvent(sessionId, processed, users.length, `Created: ${username} in ${populationName}`, 
                            { processed, created, skipped, failed }, username, populationName, populationId);
                    } else {
                        const errorText = await createResponse.text();
                        const error = `Line ${user._lineNumber}: Failed to create user ${username} - ${createResponse.status}: ${errorText}`;
                        errors.push(error);
                        failed++;
                        debugLog("Import", `❌ ${error}`);
                        sendProgressEvent(sessionId, processed, users.length, `Failed: ${username}`, 
                            { processed, created, skipped, failed }, username, populationName, populationId);
                    }
                    
                } catch (error) {
                    const errorMsg = `Line ${user._lineNumber}: Error processing user ${user.username || user.email || 'unknown'} - ${error.message}`;
                    errors.push(errorMsg);
                    failed++;
                    debugLog("Import", `❌ ${errorMsg}`);
                    sendProgressEvent(sessionId, processed, users.length, `Error: ${user.username || user.email || 'unknown'}`, 
                        { processed, created, skipped, failed }, user.username || user.email || 'unknown', populationName, populationId);
                }
            }
            
            // Add delay between batches to avoid rate limiting
            if (i + batchSize < users.length) {
                debugLog("Import", `⏱️ Adding delay between batches: ${delayBetweenBatches}ms`);
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }
        
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
        sendCompletionEvent(sessionId, processed, users.length, finalMessage, { processed, created, skipped, failed });
        
        // Clean up session
        importSessions.delete(sessionId);
        
    } catch (error) {
        debugLog("Import", "❌ Error in background import process", {
            error: error.message,
            stack: error.stack
        });
        
        sendErrorEvent(sessionId, 'Import failed', error.message);
        
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
function sendProgressEvent(sessionId, current, total, message, counts, user, populationName, populationId) {
    const startTime = Date.now();
    
    try {
        const eventData = {
            type: 'progress',
            current,
            total,
            message,
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
        if (global.sseClients && global.sseClients.has(sessionId)) {
            const client = global.sseClients.get(sessionId);
            if (client && !client.destroyed) {
                try {
                    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
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
function sendCompletionEvent(sessionId, current, total, message, counts) {
    const startTime = Date.now();
    
    try {
        const eventData = {
            type: 'completion',
            current,
            total,
            message,
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
        if (global.sseClients && global.sseClients.has(sessionId)) {
            const client = global.sseClients.get(sessionId);
            if (client && !client.destroyed) {
                try {
                    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
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
function sendErrorEvent(sessionId, title, message, details = {}) {
    const startTime = Date.now();
    
    try {
        const eventData = {
            type: 'error',
            title,
            message,
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
        if (global.sseClients && global.sseClients.has(sessionId)) {
            const client = global.sseClients.get(sessionId);
            if (client && !client.destroyed) {
                try {
                    client.write(`data: ${JSON.stringify(eventData)}\n\n`);
                    
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
router.post('/import', upload.single('file'), async (req, res, next) => {
    try {
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
        
        // Start import process in background
        runImportProcess(sessionId, req.app)
            .catch(error => {
                debugLog("Import", "❌ Background import process failed", { error: error.message });
                sendErrorEvent(sessionId, 'Import failed', error.message);
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
    app.importSessions = app.importSessions || {};
    app.importSessions[sessionId] = {
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
            if (app.importSessions[sessionId]) {
                app.importSessions[sessionId].lastActivity = Date.now();
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
            lastActivity: app.importSessions[sessionId]?.lastActivity
        });
        
        updateSSEMetrics('disconnect', sessionId, { duration: connectionDuration });
        
        // Clean up session
        if (app.importSessions[sessionId]) {
            delete app.importSessions[sessionId];
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
        if (app.importSessions[sessionId]) {
            delete app.importSessions[sessionId];
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
        
        if (app.importSessions[sessionId]) {
            delete app.importSessions[sessionId];
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
router.post('/export-users', async (req, res, next) => {
    try {
        const { populationId, fields, format, ignoreDisabledUsers } = req.body;
        
        // Convert ignoreDisabledUsers to boolean if it's a string (handles form data)
        const shouldIgnoreDisabledUsers = ignoreDisabledUsers === true || ignoreDisabledUsers === 'true';
        
        // Validate required population ID parameter
        if (!populationId && populationId !== '') {
            return res.status(400).json({
                error: 'Missing population ID',
                message: 'Population ID is required for export'
            });
        }

        // Build PingOne API URL with population filtering and population details expansion
        // This ensures we get complete user data including population information
        let pingOneUrl = 'http://127.0.0.1:4000/api/pingone/users';
        const params = new URLSearchParams();
        
        // Add population filter if specified (empty string means all populations)
        if (populationId && populationId.trim() !== '') {
            params.append('population.id', populationId.trim());
        }
        
        // Always expand population details to get population name and ID in response
        params.append('expand', 'population');
        
        // Append query parameters if any exist
        if (params.toString()) {
            pingOneUrl += `?${params.toString()}`;
        }

        const pingOneResponse = await fetch(pingOneUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!pingOneResponse.ok) {
            const errorData = await pingOneResponse.json().catch(() => ({}));
            return res.status(pingOneResponse.status).json({
                error: 'Failed to fetch users from PingOne',
                message: errorData.message || `HTTP ${pingOneResponse.status}`,
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

        // Filter out disabled users if the ignore flag is set
        // This provides a way to export only active users
        if (shouldIgnoreDisabledUsers) {
            users = users.filter(user => user.enabled !== false);
        }

        // Check if population information is available in the user objects
        // This determines whether we need to fetch population data separately
        let hasPopulationInfo = false;
        if (users.length > 0 && users[0].population) {
            hasPopulationInfo = true;
        }

        // If population info is not available, try to fetch it separately
        if (!hasPopulationInfo && populationId && populationId.trim() !== '') {
            try {
                const populationResponse = await fetch(`http://127.0.0.1:4000/api/pingone/populations/${populationId.trim()}`);
                if (populationResponse.ok) {
                    const populationData = await populationResponse.json();
                    const populationName = populationData.name || '';
                    
                    // Add population information to all users
                    users = users.map(user => ({
                        ...user,
                        population: {
                            id: populationId.trim(),
                            name: populationName
                        }
                    }));
                }
            } catch (error) {
                // [CLEANUP] Removed verbose debug logging
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

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(output);
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// USER MODIFICATION ENDPOINT
// ============================================================================

/**
 * POST /api/modify
 * Modifies existing users in PingOne based on CSV data
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
        const { createIfNotExists, defaultPopulationId, defaultEnabled, generatePasswords } = req.body;
        
        // Validate that a CSV file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please upload a CSV file with user data'
            });
        }
        
        // Parse CSV file content from uploaded buffer
        // Convert buffer to string and split into lines, filtering out empty lines
        const csvContent = req.file.buffer.toString('utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Validate CSV structure: must have header row and at least one data row
        if (lines.length < 2) {
            return res.status(400).json({
                error: 'Invalid CSV file',
                message: 'CSV file must have at least a header row and one data row'
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
                error: 'No valid users found',
                message: 'CSV file must contain at least one user with username or email'
            });
        }
        
        // Get settings for environment ID
        // [CLEANUP] Removed unused imports: fs, path, fileURLToPath, fetch
        const settingsData = await fetch('http://localhost:3000/api/settings').then(res => res.json());
        const settings = settingsData;
        const environmentId = settings.environmentId;
        
        if (!environmentId) {
            return res.status(400).json({
                error: 'Missing environment ID',
                message: 'Please configure your PingOne environment ID in settings'
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
                        const lookupResponse = await fetch(`http://127.0.0.1:4000/api/pingone/environments/${environmentId}/users?filter=username eq "${encodeURIComponent(user.username)}"`);
                        
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
                        const lookupResponse = await fetch(`http://127.0.0.1:4000/api/pingone/environments/${environmentId}/users?filter=email eq "${encodeURIComponent(user.email)}"`);
                        
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
                            
                            const createResponse = await fetch(`http://127.0.0.1:4000/api/pingone/environments/${environmentId}/users`, {
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
                    const updateResponse = await fetch(`http://127.0.0.1:4000/api/pingone/environments/${environmentId}/users/${existingUser.id}`, {
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
        const finalMessage = `Import completed: ${results.created} created, ${results.failed} failed, ${results.skipped} skipped`;
        const finalCounts = { 
            succeeded: results.created, 
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
    } catch (error) {
        // Handle any unexpected errors during the import process
        debugLog("Import", "❌ Error in background import process", {
            error: error.message,
            stack: error.stack
        });
        
        // Send error event to frontend via SSE using proper function
        // This ensures the user is notified of any failures
        const errorResult = sendErrorEvent(
            sessionId, 
            'Import failed', 
            error.message, 
            { stack: error.stack }
        );
        
        if (errorResult) {
            debugLog("SSE", "✅ Error event sent successfully");
        } else {
            debugLog("SSE", "❌ Failed to send error event");
        }
    }
}); // <-- Add this closing brace to properly end the async function

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

// Export the configured router with all API endpoints
export default router;
