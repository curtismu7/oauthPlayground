#!/usr/bin/env node

const fs = require('node:fs');
const _path = require('node:path');

const filePath = 'src/v8u/services/indexedDBBackupServiceV8U.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace specific console statements
const replacements = [
	{
		from: `console.log(\`\${MODULE_TAG} ✅ Object store created with indexes\`)`,
		to: `logger.debug('Object store created with indexes')`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Transaction failed:\`, transaction.error)`,
		to: `logger.error('Transaction failed', { error: transaction.error })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to save backup\`, { key, type, error: err })`,
		to: `logger.error('Failed to save backup', { key, type, error: err })`,
	},
	{
		from: `console.log(\`\${MODULE_TAG} ✅ Loaded backup\`, {`,
		to: `logger.debug('Loaded backup', {`,
	},
	{
		from: `console.log(\`\${MODULE_TAG} ⚠️ No backup found\`, { key })`,
		to: `logger.warn('No backup found', { key })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to load:\`, request.error)`,
		to: `logger.error('Failed to load', { error: request.error })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to load backup\`, { key, error: err })`,
		to: `logger.error('Failed to load backup', { key, error: err })`,
	},
	{
		from: `console.log(\`\${MODULE_TAG} ✅ Deleted backup\`, { key })`,
		to: `logger.debug('Deleted backup', { key })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to delete backup\`, { key, error: err })`,
		to: `logger.error('Failed to delete backup', { key, error: err })`,
	},
	{
		from: `console.log(\`\${MODULE_TAG} ✅ Listed backups\`, { type, count: request.result.length })`,
		to: `logger.debug('Listed backups', { type, count: request.result.length })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to list backups\`, { type, error: err })`,
		to: `logger.error('Failed to list backups', { type, error: err })`,
	},
	{
		from: `console.log(\`\${MODULE_TAG} ✅ Cleared all backups\`)`,
		to: `logger.debug('Cleared all backups')`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to clear backups\`, err)`,
		to: `logger.error('Failed to clear backups', { error: err })`,
	},
	{
		from: `console.error(\`\${MODULE_TAG} ❌ Failed to get stats\`, err)`,
		to: `logger.error('Failed to get stats', { error: err })`,
	},
];

let count = 0;
for (const { from, to } of replacements) {
	if (content.includes(from)) {
		content = content.replace(from, to);
		count++;
	}
}

fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Replaced ${count} console statements in indexedDBBackupServiceV8U.ts`);
