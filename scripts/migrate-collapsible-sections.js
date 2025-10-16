#!/usr/bin/env node
// scripts/migrate-collapsible-sections.js
// Automated migration tool to convert local CollapsibleSection components to CollapsibleHeader service

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FLOWS_DIR = path.join(__dirname, '../src/pages/flows');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const TARGET_FILES = process.argv.filter(arg => arg.endsWith('.tsx') && !arg.startsWith('--'));

// Section types that should default to open (not collapsed)
const ALWAYS_OPEN_SECTIONS = [
	'credentials',
	'overview',
	'configuration',
	'intro',
	'introduction',
];

// Helper to check if section should be open by default
function shouldBeOpenByDefault(sectionId) {
	const lowerCaseId = sectionId.toLowerCase();
	return ALWAYS_OPEN_SECTIONS.some(keyword => lowerCaseId.includes(keyword));
}

// Helper to extract section ID from toggle function call
function extractSectionId(toggleCall) {
	const match = toggleCall.match(/toggleCollapsed\(['"](\w+)['"]\)|toggleSection\(['"](\w+)['"]\)/);
	return match ? (match[1] || match[2]) : null;
}

// Helper to extract title text
function extractTitle(content) {
	// Look for title between CollapsibleTitle tags
	const match = content.match(/<CollapsibleTitle[^>]*>(.*?)<\/CollapsibleTitle>/s);
	if (!match) return null;
	
	// Remove icon components and get text
	const title = match[1]
		.replace(/<Fi\w+\s*\/>/g, '')  // Remove self-closing icons
		.replace(/<Fi\w+>.*?<\/Fi\w+>/g, '')  // Remove icon wrappers
		.trim();
	
	return title || null;
}

// Helper to extract icon
function extractIcon(content) {
	const match = content.match(/<(Fi\w+)\s*\/>/);
	return match ? match[1] : null;
}

// Migration function
function migrateFile(filePath) {
	console.log(`\n${'='.repeat(80)}`);
	console.log(`Processing: ${path.basename(filePath)}`);
	console.log('='.repeat(80));
	
	let content = fs.readFileSync(filePath, 'utf-8');
	const originalContent = content;
	const changes = [];
	
	// Step 1: Check if already using CollapsibleHeader
	if (content.includes('from \'../../services/collapsibleHeaderService\'')) {
		console.log('✅ Already using CollapsibleHeader service - skipping');
		return { file: filePath, skipped: true, reason: 'Already migrated' };
	}
	
	// Step 2: Check if has local CollapsibleSection
	if (!content.includes('const CollapsibleSection = styled')) {
		console.log('ℹ️  No local CollapsibleSection found - checking FlowUIService');
		if (content.includes('FlowUIService.getFlowUIComponents')) {
			console.log('⚠️  Uses FlowUIService - requires manual migration');
			return { file: filePath, skipped: true, reason: 'Uses FlowUIService' };
		}
		console.log('⚠️  No collapsible components found - skipping');
		return { file: filePath, skipped: true, reason: 'No collapsible components' };
	}
	
	// Step 3: Add CollapsibleHeader import
	const importPattern = /import\s+{[^}]*}\s+from\s+['"]\.\.\/\.\.\/services\/\w+Service['"]/;
	const lastServiceImport = content.match(importPattern);
	
	if (lastServiceImport) {
		const insertPosition = content.indexOf(lastServiceImport[0]) + lastServiceImport[0].length;
		content = content.slice(0, insertPosition) + 
			`\nimport { CollapsibleHeader } from '../../services/collapsibleHeaderService';` +
			content.slice(insertPosition);
		changes.push('Added CollapsibleHeader import');
	}
	
	// Step 4: Count sections
	const sectionMatches = [...content.matchAll(/<CollapsibleSection>/g)];
	console.log(`📊 Found ${sectionMatches.length} collapsible sections to migrate`);
	
	// Step 5: Remove local styled components
	const styledComponentsToRemove = [
		/const CollapsibleSection = styled\.section`[\s\S]*?`;/,
		/const CollapsibleHeaderButton = styled\.button.*?`[\s\S]*?`;/,
		/const CollapsibleTitle = styled\.span`[\s\S]*?`;/,
		/const CollapsibleToggleIcon = styled\.\w+.*?`[\s\S]*?`;/,
		/const CollapsibleContent = styled\.div`[\s\S]*?`;/,
	];
	
	styledComponentsToRemove.forEach((pattern, index) => {
		if (pattern.test(content)) {
			content = content.replace(pattern, '// [REMOVED] Local collapsible styled component');
			changes.push(`Removed local styled component ${index + 1}`);
		}
	});
	
	// Step 6: Transform JSX sections (complex pattern matching)
	// This is a simplified version - may need manual review
	let sectionsTransformed = 0;
	const sectionPattern = /<CollapsibleSection>([\s\S]*?)<\/CollapsibleSection>/g;
	
	content = content.replace(sectionPattern, (match, sectionContent) => {
		// Extract components
		const sectionId = extractSectionId(sectionContent) || `section-${sectionsTransformed}`;
		const title = extractTitle(sectionContent);
		const icon = extractIcon(sectionContent);
		const defaultCollapsed = !shouldBeOpenByDefault(sectionId);
		
		// Extract content between CollapsibleContent tags
		const contentMatch = sectionContent.match(/<CollapsibleContent>([\s\S]*?)<\/CollapsibleContent>/);
		const innerContent = contentMatch ? contentMatch[1].trim() : '/* content */';
		
		sectionsTransformed++;
		
		if (!title) {
			console.log(`⚠️  Could not extract title for section ${sectionsTransformed} - needs manual review`);
			return match; // Return original if can't parse
		}
		
		// Build new CollapsibleHeader JSX
		const iconProp = icon ? `\n\t\t\t\t\ticon={<${icon} />}` : '';
		const result = `<CollapsibleHeader
					title="${title}"${iconProp}
					defaultCollapsed={${defaultCollapsed}}
				>
					${innerContent}
				</CollapsibleHeader>`;
		
		if (VERBOSE) {
			console.log(`  ✓ Transformed section "${title}" (collapsed: ${defaultCollapsed})`);
		}
		
		return result;
	});
	
	changes.push(`Transformed ${sectionsTransformed} sections`);
	
	// Step 7: Remove unused FiChevronDown import if present
	content = content.replace(/,\s*FiChevronDown/g, '');
	content = content.replace(/FiChevronDown,\s*/g, '');
	
	// Step 8: Clean up multiple blank lines
	content = content.replace(/\n{3,}/g, '\n\n');
	
	// Step 9: Write results
	if (!DRY_RUN) {
		fs.writeFileSync(filePath, content, 'utf-8');
		console.log(`✅ Migration complete - ${changes.length} changes made`);
	} else {
		console.log(`🔍 DRY RUN - Would make ${changes.length} changes`);
	}
	
	changes.forEach((change, i) => console.log(`  ${i + 1}. ${change}`));
	
	return {
		file: filePath,
		success: true,
		changes: changes.length,
		sections: sectionsTransformed,
		needsReview: sectionsTransformed !== sectionMatches.length,
	};
}

// Main execution
function main() {
	console.log('\n🚀 CollapsibleHeader Migration Tool\n');
	console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  LIVE'}`);
	console.log(`Verbose: ${VERBOSE ? 'Yes' : 'No'}\n`);
	
	// Get files to process
	let files = [];
	if (TARGET_FILES.length > 0) {
		files = TARGET_FILES.map(f => path.join(FLOWS_DIR, f));
	} else {
		// Find all flows with local CollapsibleSection
		const allFiles = fs.readdirSync(FLOWS_DIR)
			.filter(f => f.endsWith('.tsx') && !f.includes('.backup'));
		
		files = allFiles
			.map(f => path.join(FLOWS_DIR, f))
			.filter(f => {
				const content = fs.readFileSync(f, 'utf-8');
				return content.includes('const CollapsibleSection = styled');
			});
	}
	
	console.log(`📁 Found ${files.length} files to process\n`);
	
	if (files.length === 0) {
		console.log('✅ No files need migration!');
		return;
	}
	
	// Process each file
	const results = files.map(migrateFile);
	
	// Summary
	console.log(`\n${'='.repeat(80)}`);
	console.log('📊 MIGRATION SUMMARY');
	console.log('='.repeat(80));
	
	const successful = results.filter(r => r.success);
	const skipped = results.filter(r => r.skipped);
	const needsReview = results.filter(r => r.needsReview);
	
	console.log(`\nTotal files processed: ${results.length}`);
	console.log(`✅ Successfully migrated: ${successful.length}`);
	console.log(`⏭️  Skipped: ${skipped.length}`);
	console.log(`⚠️  Needs manual review: ${needsReview.length}`);
	
	if (skipped.length > 0) {
		console.log('\nSkipped files:');
		skipped.forEach(r => console.log(`  - ${path.basename(r.file)}: ${r.reason}`));
	}
	
	if (needsReview.length > 0) {
		console.log('\n⚠️  Files needing manual review:');
		needsReview.forEach(r => console.log(`  - ${path.basename(r.file)}`));
	}
	
	const totalSections = successful.reduce((sum, r) => sum + (r.sections || 0), 0);
	console.log(`\n🎯 Total sections transformed: ${totalSections}`);
	
	if (DRY_RUN) {
		console.log('\n💡 Run without --dry-run to apply changes');
	} else {
		console.log('\n✅ Migration complete! Remember to:');
		console.log('  1. Run linter to check for errors');
		console.log('  2. Test each migrated flow');
		console.log('  3. Review any files marked for manual review');
	}
}

// Run
try {
	main();
} catch (error) {
	console.error('\n❌ Migration failed:', error.message);
	if (VERBOSE) {
		console.error(error.stack);
	}
	process.exit(1);
}

