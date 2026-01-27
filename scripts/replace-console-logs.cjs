#!/usr/bin/env node

/**
 * Script to replace console.log/warn/error statements with logger service calls
 * Usage: node scripts/replace-console-logs.js <file-path>
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];

if (!filePath) {
	console.error('Usage: node scripts/replace-console-logs.js <file-path>');
	process.exit(1);
}

const fullPath = path.resolve(filePath);

if (!fs.existsSync(fullPath)) {
	console.error(`File not found: ${fullPath}`);
	process.exit(1);
}

let content = fs.readFileSync(fullPath, 'utf8');
let replacements = 0;

// Replace console.log with logger.debug
content = content.replace(/console\.log\(/g, () => {
	replacements++;
	return 'logger.debug(';
});

// Replace console.warn with logger.warn
content = content.replace(/console\.warn\(/g, () => {
	replacements++;
	return 'logger.warn(';
});

// Replace console.error with logger.error
content = content.replace(/console\.error\(/g, () => {
	replacements++;
	return 'logger.error(';
});

// Replace console.debug with logger.debug
content = content.replace(/console\.debug\(/g, () => {
	replacements++;
	return 'logger.debug(';
});

// Replace console.info with logger.info
content = content.replace(/console\.info\(/g, () => {
	replacements++;
	return 'logger.info(';
});

// Remove MODULE_TAG from logger calls (logger adds its own tag)
content = content.replace(/logger\.(debug|info|warn|error)\(\s*`\$\{MODULE_TAG\}\s*/g, (match, level) => {
	return `logger.${level}(`;
});

// Clean up emoji and extra formatting in messages
content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*🔑\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*⚠️\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*❌\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*✅\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*🎯\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*🔧\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

content = content.replace(/logger\.(debug|info|warn|error)\(\s*`([^`]*?)\s*🔄\s*/g, (match, level, msg) => {
	return `logger.${level}(\`${msg.trim()}`;
});

fs.writeFileSync(fullPath, content, 'utf8');

console.log(`✅ Replaced ${replacements} console statements in ${path.basename(fullPath)}`);
