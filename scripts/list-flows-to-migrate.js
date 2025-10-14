#!/usr/bin/env node
// scripts/list-flows-to-migrate.js
// Helper script to list all flows that need CollapsibleHeader migration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FLOWS_DIR = path.join(__dirname, '../src/pages/flows');
const TARGET_FILE = process.argv[2];

function analyzeFile(filePath) {
	const content = fs.readFileSync(filePath, 'utf-8');
	const fileName = path.basename(filePath);
	
	// Check migration status
	const hasCollapsibleHeader = content.includes('from \'../../services/collapsibleHeaderService\'');
	const hasLocalCollapsible = content.includes('const CollapsibleSection = styled');
	const usesFlowUIService = content.includes('FlowUIService.getFlowUIComponents');
	const sectionCount = (content.match(/<CollapsibleSection>/g) || []).length;
	
	return {
		fileName,
		filePath,
		hasCollapsibleHeader,
		hasLocalCollapsible,
		usesFlowUIService,
		sectionCount,
		status: hasCollapsibleHeader ? 'migrated' : 
		        usesFlowUIService ? 'flowui-service' :
		        hasLocalCollapsible ? 'needs-migration' : 'no-collapsibles'
	};
}

function main() {
	console.log('\n📋 CollapsibleHeader Migration Status\n');
	console.log('='.repeat(80));
	
	// Get files to check
	let files = [];
	if (TARGET_FILE) {
		const targetPath = path.join(FLOWS_DIR, TARGET_FILE);
		if (fs.existsSync(targetPath)) {
			files = [targetPath];
		} else {
			console.error(`❌ File not found: ${TARGET_FILE}`);
			process.exit(1);
		}
	} else {
		files = fs.readdirSync(FLOWS_DIR)
			.filter(f => f.endsWith('.tsx') && !f.includes('.backup'))
			.map(f => path.join(FLOWS_DIR, f));
	}
	
	// Analyze all files
	const results = files.map(analyzeFile);
	
	// Group by status
	const migrated = results.filter(r => r.status === 'migrated');
	const needsMigration = results.filter(r => r.status === 'needs-migration');
	const flowUIService = results.filter(r => r.status === 'flowui-service');
	const noCollapsibles = results.filter(r => r.status === 'no-collapsibles');
	
	// Display results
	console.log(`\n✅ Already Migrated (${migrated.length})`);
	console.log('-'.repeat(80));
	migrated.forEach(r => {
		console.log(`  ✓ ${r.fileName}`);
	});
	
	console.log(`\n⏳ Needs Migration (${needsMigration.length})`);
	console.log('-'.repeat(80));
	needsMigration.sort((a, b) => b.sectionCount - a.sectionCount);
	needsMigration.forEach(r => {
		console.log(`  🔧 ${r.fileName.padEnd(45)} (${r.sectionCount} sections)`);
	});
	
	console.log(`\n⚠️  Uses FlowUIService (${flowUIService.length}) - Manual Migration Required`);
	console.log('-'.repeat(80));
	flowUIService.forEach(r => {
		console.log(`  ⚙️  ${r.fileName.padEnd(45)} (${r.sectionCount} sections)`);
	});
	
	console.log(`\n➖ No Collapsibles (${noCollapsibles.length})`);
	console.log('-'.repeat(80));
	noCollapsibles.forEach(r => {
		console.log(`  ⊘ ${r.fileName}`);
	});
	
	// Summary
	console.log(`\n${'='.repeat(80)}`);
	console.log('📊 SUMMARY');
	console.log('='.repeat(80));
	console.log(`Total flows analyzed: ${results.length}`);
	console.log(`✅ Already migrated: ${migrated.length}`);
	console.log(`⏳ Needs migration: ${needsMigration.length}`);
	console.log(`⚠️  FlowUIService (manual): ${flowUIService.length}`);
	console.log(`➖ No collapsibles: ${noCollapsibles.length}`);
	
	const totalSections = needsMigration.reduce((sum, r) => sum + r.sectionCount, 0);
	console.log(`\n🎯 Total sections to migrate: ${totalSections}`);
	
	// Next steps
	if (needsMigration.length > 0) {
		console.log(`\n💡 Next Steps:`);
		console.log(`   1. Run: node scripts/migrate-collapsible-sections.js --dry-run`);
		console.log(`   2. Review the output`);
		console.log(`   3. Run: node scripts/migrate-collapsible-sections.js`);
		console.log(`   4. Test each migrated flow`);
	} else if (flowUIService.length > 0) {
		console.log(`\n💡 Next Steps:`);
		console.log(`   FlowUIService flows require manual migration`);
		console.log(`   See scripts/README_MIGRATION.md for details`);
	} else {
		console.log(`\n🎉 All flows are migrated!`);
	}
	
	console.log('\n');
}

try {
	main();
} catch (error) {
	console.error('\n❌ Error:', error.message);
	process.exit(1);
}

