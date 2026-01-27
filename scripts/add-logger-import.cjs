#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);

for (const filePath of files) {
	const fullPath = path.resolve(filePath);
	
	if (!fs.existsSync(fullPath)) {
		console.error(`File not found: ${fullPath}`);
		continue;
	}
	
	let content = fs.readFileSync(fullPath, 'utf8');
	
	// Check if logger import already exists
	if (content.includes("from './unifiedFlowLoggerServiceV8U'") || 
	    content.includes('from "@/v8u/services/unifiedFlowLoggerServiceV8U"') ||
	    content.includes("from '@/v8u/services/unifiedFlowLoggerServiceV8U'")) {
		console.log(`✓ ${path.basename(filePath)} - logger import already exists`);
		continue;
	}
	
	// Determine the correct import path based on file location
	const relativePath = filePath.replace(/\\/g, '/');
	let importPath;
	
	if (relativePath.includes('/services/')) {
		importPath = './unifiedFlowLoggerServiceV8U';
	} else {
		importPath = '@/v8u/services/unifiedFlowLoggerServiceV8U';
	}
	
	// Find the last import statement
	const lines = content.split('\n');
	let lastImportIndex = -1;
	
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('} from ')) {
			lastImportIndex = i;
		}
		// Stop at first non-import, non-comment, non-empty line after imports
		if (lastImportIndex > -1 && lines[i].trim() && 
		    !lines[i].trim().startsWith('import ') && 
		    !lines[i].trim().startsWith('} from ') &&
		    !lines[i].trim().startsWith('//') &&
		    !lines[i].trim().startsWith('/*') &&
		    !lines[i].trim().startsWith('*')) {
			break;
		}
	}
	
	if (lastImportIndex > -1) {
		// Insert after last import
		lines.splice(lastImportIndex + 1, 0, `import { logger } from '${importPath}';`);
		content = lines.join('\n');
		fs.writeFileSync(fullPath, content, 'utf8');
		console.log(`✅ ${path.basename(filePath)} - added logger import`);
	} else {
		console.warn(`⚠️  ${path.basename(filePath)} - could not find import section`);
	}
}
