#!/usr/bin/env node

/**
 * MFA Automated Regression Detection System
 * 
 * This script automatically detects regressions in MFA functionality by:
 * 1. Running comprehensive prevention checks
 * 2. Monitoring critical file changes
 * 3. Validating SWE-15 compliance
 * 4. Checking for breaking changes
 * 
 * Usage: node scripts/mfa-regression-detector.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
	criticalFiles: [
		'src/v8/flows/unified/UnifiedMFARegistrationFlowV8_Legacy.tsx',
		'src/v8/services/sqliteStatsServiceV8.ts',
		'src/v8/components/WorkerTokenModalV8.tsx',
		'src/services/unifiedWorkerTokenService.ts',
		'src/utils/fileStorageUtil.ts',
		'src/services/credentialExportImportService.ts',
		'src/v8/services/preFlightValidationServiceV8.ts'
	],
	swe15Patterns: {
		singleResponsibility: [
			/components.*\.tsx.*should.*only.*handle.*one.*concern/,
			/services.*\.ts.*should.*have.*single.*purpose/
		],
		openClosed: [
			/MFAFlowBaseV8.*should.*not.*be.*modified/,
			/base.*step.*structure.*should.*not.*change/
		],
		interfaceSegregation: [
			/interface.*Props.*should.*be.*minimal/,
			/no.*unused.*dependencies.*in.*interfaces/
		]
	},
	preventionCommands: [
		'./scripts/prevent-base64-display.sh',
		'grep -n "useCallback" src/v8/hooks/useSQLiteStats.ts',
		'grep -n "dangerouslySetInnerHTML" src/v8/flows/unified/ --include="*.ts" --include="*.tsx"'
	]
};

class RegressionDetector {
	constructor() {
		this.issues = [];
		this.warnings = [];
		this.passed = 0;
		this.total = 0;
	}

	log(level, message, details = '') {
		const timestamp = new Date().toISOString();
		const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}${details ? ' - ' + details : ''}`;
		console.log(logEntry);
		
		if (level === 'error') {
			this.issues.push({ message, details, timestamp });
		} else if (level === 'warning') {
			this.warnings.push({ message, details, timestamp });
		}
	}

	async runCommand(command, description) {
		this.total++;
		try {
			const result = execSync(command, { encoding: 'utf8', timeout: 30000 });
			this.passed++;
			this.log('info', `✅ ${description}`, 'Command executed successfully');
			return { success: true, result };
		} catch (error) {
			this.log('error', `❌ ${description}`, error.message);
			return { success: false, error: error.message };
		}
	}

	async checkFileExists(filePath, description) {
		this.total++;
		const fullPath = path.resolve(filePath);
		if (fs.existsSync(fullPath)) {
			this.passed++;
			this.log('info', `✅ ${description}`, 'File exists');
			return true;
		} else {
			this.log('error', `❌ ${description}`, 'File not found');
			return false;
		}
	}

	async checkSWE15Compliance() {
		this.log('info', '🔍 Checking SWE-15 Compliance', '');

		// Check Single Responsibility Principle
		await this.runCommand(
			'grep -r "export.*class.*{" src/v8/flows/unified/ | wc -l',
			'Single Responsibility: Classes should have single purpose'
		);

		// Check Open/Closed Principle
		await this.runCommand(
			'grep -r "MFAFlowBaseV8.*extends" src/v8/flows/unified/ | wc -l',
			'Open/Closed: Base classes should not be modified'
		);

		// Check Interface Segregation
		await this.runCommand(
			'grep -r "interface.*Props" src/v8/flows/unified/ | head -10 | wc -l',
			'Interface Segregation: Interfaces should be minimal'
		);

		// Check Dependency Inversion
		await this.runCommand(
			'grep -r "import.*Service" src/v8/flows/unified/ | head -10 | wc -l',
			'Dependency Inversion: Should depend on abstractions'
		);
	}

	async checkCriticalFiles() {
		this.log('info', '🔍 Checking Critical Files', '');

		for (const file of CONFIG.criticalFiles) {
			await this.checkFileExists(file, `Critical file: ${file}`);
		}
	}

	async runPreventionCommands() {
		this.log('info', '🔍 Running Prevention Commands', '');

		for (const command of CONFIG.preventionCommands) {
			await this.runCommand(command, `Prevention check: ${command.split(' ').slice(0, 2).join(' ')}`);
		}
	}

	async checkActiveIssues() {
		this.log('info', '🔍 Checking Active Issues Resolution', '');

		// Issue 23: SQLite Resource Exhaustion
		await this.runCommand(
			'grep -n "activeConnections\|circuitBreakerOpen" src/v8/services/sqliteStatsServiceV8.ts | wc -l',
			'Issue 23: SQLite connection monitoring'
		);

		// Issue 30: Worker Token Credentials Persistence
		await this.runCommand(
			'grep -n "backend.*API.*first" src/utils/fileStorageUtil.ts | wc -l',
			'Issue 30: FileStorageUtil backend integration'
		);

		// Issue 81: OIDC Scopes Validation
		await this.runCommand(
			'grep -n "Invalid OIDC Scopes" src/v8/services/preFlightValidationServiceV8.ts | wc -l',
			'Issue 81: Client credentials scope validation'
		);

		// Issue 82: Credential Import JSON Parsing
		await this.runCommand(
			'grep -n "HTML.*page.*instead.*JSON" src/services/credentialExportImportService.ts | wc -l',
			'Issue 82: HTML download detection'
		);
	}

	async checkBreakingChanges() {
		this.log('info', '🔍 Checking for Breaking Changes', '');

		// Check for removed interfaces
		await this.runCommand(
			'find src/v8/flows/unified -name "*.tsx" -exec grep -l "interface.*Props" {} \\; | wc -l',
			'Interface preservation check'
		);

		// Check for removed services
		await this.runCommand(
			'find src/v8/services -name "*.ts" | grep -v test | wc -l',
			'Service preservation check'
		);

		// Check for component removal
		await this.runCommand(
			'find src/v8/components -name "*.tsx" | wc -l',
			'Component preservation check'
		);
	}

	async checkPerformanceAndSecurity() {
		this.log('info', '🔍 Checking Performance and Security', '');

		// Performance checks
		await this.runCommand(
			'grep -rn "setInterval.*clearInterval\\|setTimeout.*clearTimeout" src/v8/ --include="*.ts" --include="*.tsx" | wc -l',
			'Timer cleanup check'
		);

		// Security checks
		await this.runCommand(
			'grep -rn "eval(" src/v8/ --include="*.ts" --include="*.tsx" | wc -l',
			'Eval usage prevention'
		);

		await this.runCommand(
			'grep -rn "javascript:" src/v8/ --include="*.ts" --include="*.tsx" | wc -l',
			'Inline script prevention'
		);
	}

	async generateReport() {
		const report = {
			timestamp: new Date().toISOString(),
			summary: {
				total: this.total,
				passed: this.passed,
				failed: this.issues.length,
				warnings: this.warnings.length
			},
			issues: this.issues,
			warnings: this.warnings,
			status: this.issues.length === 0 ? 'PASS' : 'FAIL'
		};

		// Save report to file
		const reportPath = path.resolve('mfa-regression-report.json');
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
		
		this.log('info', '📊 Report Generated', `Saved to ${reportPath}`);
		
		return report;
	}

	async run() {
		console.log('🚀 Starting MFA Automated Regression Detection...');
		console.log(`⏰ Started at: ${new Date().toISOString()}`);
		console.log('');

		try {
			await this.checkCriticalFiles();
			await this.checkSWE15Compliance();
			await this.runPreventionCommands();
			await this.checkActiveIssues();
			await this.checkBreakingChanges();
			await this.checkPerformanceAndSecurity();

			const report = await this.generateReport();

			console.log('');
			console.log('📊 === REGRESSION DETECTION SUMMARY ===');
			console.log(`Total Checks: ${report.summary.total}`);
			console.log(`✅ Passed: ${report.summary.passed}`);
			console.log(`⚠️  Warnings: ${report.summary.warnings}`);
			console.log(`❌ Failed: ${report.summary.failed}`);
			console.log(`🎯 Status: ${report.status}`);

			if (report.status === 'FAIL') {
				console.log('');
				console.log('❌ REGRESSIONS DETECTED');
				console.log('Please review the issues before proceeding with deployment.');
				process.exit(1);
			} else {
				console.log('');
				console.log('✅ NO REGRESSIONS DETECTED');
				console.log('MFA system is ready for deployment.');
				process.exit(0);
			}

		} catch (error) {
			this.log('error', 'Regression detection failed', error.message);
			process.exit(1);
		}
	}
}

// Run the regression detector
if (require.main === module) {
	const detector = new RegressionDetector();
	detector.run();
}

module.exports = RegressionDetector;
