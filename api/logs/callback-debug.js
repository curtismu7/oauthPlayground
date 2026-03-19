/**
 * @file callback-debug-logs.js
 * @description API endpoint to store and retrieve callback debugging information
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = process.env.VERCEL
	? path.join('/tmp', 'callback-debug')
	: path.join(__dirname, '../../logs/callback-debug');
try {
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true });
	}
} catch {
	// Non-fatal — log writes will fail gracefully
}

// Create a log file for today's date
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
const logFile = path.join(logsDir, `callback-debug-${today}.log`);

export default function handler(req, res) {
	// Handle GET requests - serve log files
	if (req.method === 'GET') {
		try {
			// Check if a specific date was requested
			const url = new URL(req.url, `http://localhost`);
			const dateParam = url.searchParams.get('date');
			const targetDate = dateParam || today;
			const targetFile = path.join(logsDir, `callback-debug-${targetDate}.log`);

			// Check if file exists
			if (!fs.existsSync(targetFile)) {
				return res.status(404).json({ 
					error: 'Log file not found',
					message: `No callback debug log found for ${targetDate}`,
					availableFiles: fs.existsSync(logsDir) ? fs.readdirSync(logsDir) : []
				});
			}

			// Read and return the log file
			const content = fs.readFileSync(targetFile, 'utf8');
			
			// Set appropriate headers
			res.setHeader('Content-Type', 'text/plain');
			res.setHeader('Cache-Control', 'no-cache');
			
			return res.status(200).send(content);
		} catch (error) {
			console.error('Failed to read callback debug log:', error);
			return res.status(500).json({ 
				error: 'Failed to read log file',
				message: error.message 
			});
		}
	}

	// Handle POST requests - store log entries
	if (req.method === 'POST') {
		try {
			const logEntry = {
				timestamp: new Date().toISOString(),
				...req.body,
			};

			// Append to log file
			const logLine = JSON.stringify(logEntry) + '\n';
			fs.appendFileSync(logFile, logLine, 'utf8');

			// Return success
			return res.status(200).json({ 
				success: true, 
				message: 'Log entry recorded',
				logFile: `callback-debug-${today}.log`
			});
		} catch (error) {
			console.error('Failed to write callback debug log:', error);
			return res.status(500).json({ 
				error: 'Failed to write log entry',
				message: error.message 
			});
		}
	}

	// Handle other methods
	res.setHeader('Allow', ['GET', 'POST']);
	return res.status(405).json({ 
		error: 'Method not allowed',
		allowedMethods: ['GET', 'POST']
	});
}
