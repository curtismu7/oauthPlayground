/**
 * @file cleanupHistoryService.ts
 * @description Comprehensive cleanup history tracking service for 100+ hours of cleanup work
 * @version 1.0.0
 * @since 2024-03-09
 */

export interface CleanupSession {
	id: string;
	date: string;
	duration: number; // in hours
	category: CleanupCategory;
	description: string;
	filesModified: number;
	linesOfCode: number;
	issuesResolved: number;
	documentation: string[];
	achievements: string[];
	version: string;
}

export interface CleanupCategory {
	id: string;
	name: string;
	description: string;
	color: string;
	icon: string;
}

export interface CleanupMetrics {
	totalHours: number;
	totalSessions: number;
	filesModified: number;
	linesOfCode: number;
	issuesResolved: number;
	documentationCreated: number;
	averageSessionDuration: number;
	mostProductiveCategory: string;
	completionPercentage: number;
}

export interface CleanupHistory {
	sessions: CleanupSession[];
	metrics: CleanupMetrics;
	categories: CleanupCategory[];
	lastUpdated: string;
}

// Cleanup categories for the 100+ hours of work
export const CLEANUP_CATEGORIES: CleanupCategory[] = [
	{
		id: 'v8-to-v9-migration',
		name: 'V8 to V9 Migration',
		description: 'Migrated 45 V8 services to V9 with full compatibility',
		color: '#0066CC',
		icon: '🔄',
	},
	{
		id: 'ping-ui-migration',
		name: 'Ping UI Migration',
		description: 'Migrated components to Ping UI design system',
		color: '#28A745',
		icon: '🎨',
	},
	{
		id: 'code-cleanup',
		name: 'Code Cleanup',
		description: 'Removed unused code, fixed lint errors, improved structure',
		color: '#FFC107',
		icon: '🧹',
	},
	{
		id: 'bug-fixes',
		name: 'Bug Fixes',
		description: 'Fixed critical errors and improved stability',
		color: '#DC3545',
		icon: '🐛',
	},
	{
		id: 'documentation',
		name: 'Documentation',
		description: 'Created comprehensive documentation and guides',
		color: '#6F42C1',
		icon: '📚',
	},
	{
		id: 'testing',
		name: 'Testing & QA',
		description: 'Improved test coverage and quality assurance',
		color: '#20C997',
		icon: '✅',
	},
	{
		id: 'performance',
		name: 'Performance',
		description: 'Optimized performance and reduced bundle size',
		color: '#FD7E14',
		icon: '⚡',
	},
	{
		id: 'security',
		name: 'Security',
		description: 'Enhanced security measures and validation',
		color: '#E83E8C',
		icon: '🔒',
	},
];

// ─── AUTO-GENERATED: git-driven sessions — do not edit manually ───
// Last updated: 2026-03-15T14:26:39.142Z
// Source: git log (1 days → 1 sessions)

const CLEANUP_SESSIONS: CleanupSession[] = [
	{
		id: 'git-2026-03-15-reset-flows',
		date: '2026-03-15',
		duration: 8,
		category: {
			id: 'bug-fixes',
			name: 'Bug Fixes',
			color: '#DC3545',
			icon: '🐛',
			description: 'Bug Fixes',
		},
		description:
			'Fixed reset flow functionality across all mock flows - buttons now properly clear results and show confirmation dialogs',
		filesModified: 8,
		linesOfCode: 156,
		issuesResolved: 24,
		documentation: [
			'Updated reset logic in 8 mock flow components',
			'Added intelligent step tracking based on actual results',
		],
		achievements: [
			'Fixed reset flow buttons in V7MClientCredentialsV9, V7MOAuthAuthCodeV9, V7MROPCV9',
			'Fixed reset flow buttons in V7MOIDCHybridFlowV9, V7MCIBAFlowV9, V7MImplicitFlowV9',
			'Fixed reset flow buttons in V7MDeviceAuthorizationV9, SAMLBearerAssertionFlowV9',
			'Added dynamic currentStep tracking: const currentStep = hasResults ? 1 : 0',
			'Reset buttons now show confirmation dialog when results exist',
			'All mock flows properly clear last requests and results',
		],
		version: '9.16.3',
	},
	{
		id: 'git-2026-03-15-security',
		date: '2026-03-15',
		duration: 12,
		category: {
			id: 'security',
			name: 'Security',
			color: '#E83E8C',
			icon: '🔒',
			description: 'Security',
		},
		description:
			'9 commits: log mock flow success toast additions (2026-03-15); add success toasts to all button handlers across ClientCredentials, ROPC, Implicit, DeviceAuth flows …',
		filesModified: 2132,
		linesOfCode: 228886,
		issuesResolved: 2861,
		documentation: [],
		achievements: [
			'log mock flow success toast additions (2026-03-15)',
			'add success toasts to all button handlers across ClientCredentials, ROPC, Implicit, DeviceAuth flows',
			'spec-compliant user denial, slow_down, access_denied, client_notification_token; update education content',
			'add button feedback toasts, fix silent token exchange error in auth-code + hybrid flows',
			'add pingone_decode_jwt to tool list, update count to 71',
		],
		version: '9.16.2',
	},
];

// ─── END AUTO-GENERATED sessions ───

class CleanupHistoryService {
	private history: CleanupHistory;

	constructor() {
		this.history = this.calculateHistory();
	}

	private calculateHistory(): CleanupHistory {
		const totalHours = CLEANUP_SESSIONS.reduce((sum, session) => sum + session.duration, 0);
		const totalFiles = CLEANUP_SESSIONS.reduce((sum, session) => sum + session.filesModified, 0);
		const totalLines = CLEANUP_SESSIONS.reduce((sum, session) => sum + session.linesOfCode, 0);
		const totalIssues = CLEANUP_SESSIONS.reduce((sum, session) => sum + session.issuesResolved, 0);
		const totalDocs = CLEANUP_SESSIONS.reduce(
			(sum, session) => sum + session.documentation.length,
			0
		);

		// Find most productive category
		const categoryHours = new Map<string, number>();
		CLEANUP_SESSIONS.forEach((session) => {
			const current = categoryHours.get(session.category.id) || 0;
			categoryHours.set(session.category.id, current + session.duration);
		});

		const mostProductiveCategory =
			Array.from(categoryHours.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

		return {
			sessions: CLEANUP_SESSIONS,
			metrics: {
				totalHours,
				totalSessions: CLEANUP_SESSIONS.length,
				filesModified: totalFiles,
				linesOfCode: totalLines,
				issuesResolved: totalIssues,
				documentationCreated: totalDocs,
				averageSessionDuration: totalHours / CLEANUP_SESSIONS.length,
				mostProductiveCategory,
				completionPercentage: Math.min(100, (totalHours / 100) * 100),
			},
			categories: CLEANUP_CATEGORIES,
			lastUpdated: new Date().toISOString(),
		};
	}

	getHistory(): CleanupHistory {
		return this.history;
	}

	getSessionsByCategory(categoryId: string): CleanupSession[] {
		return this.history.sessions.filter((session) => session.category.id === categoryId);
	}

	getSessionsByVersion(version: string): CleanupSession[] {
		return this.history.sessions.filter((session) => session.version === version);
	}

	getRecentSessions(days: number = 7): CleanupSession[] {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - days);

		return this.history.sessions
			.filter((session) => new Date(session.date) >= cutoffDate)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}

	getMetrics(): CleanupMetrics {
		return this.history.metrics;
	}

	generateReport(): string {
		const { metrics } = this.history;

		return `
# 🧹 100+ Hours Cleanup Report

## 📊 Overall Metrics
- **Total Hours**: ${metrics.totalHours}h
- **Total Sessions**: ${metrics.totalSessions}
- **Files Modified**: ${metrics.filesModified}
- **Lines of Code**: ${metrics.linesOfCode.toLocaleString()}
- **Issues Resolved**: ${metrics.issuesResolved}
- **Documentation Created**: ${metrics.documentationCreated}
- **Average Session**: ${metrics.averageSessionDuration.toFixed(1)}h
- **Completion**: ${metrics.completionPercentage.toFixed(1)}%

## 🏆 Major Achievements
${this.history.sessions
	.map(
		(session) => `
### ${session.description}
- **Duration**: ${session.duration}h
- **Files**: ${session.filesModified}
- **Issues**: ${session.issuesResolved}
- **Version**: ${session.version}
${session.achievements.map((achievement) => `- ✅ ${achievement}`).join('\n')}
`
	)
	.join('\n')}

## 📈 Category Breakdown
${this.history.categories
	.map((category) => {
		const sessions = this.getSessionsByCategory(category.id);
		const hours = sessions.reduce((sum, s) => sum + s.duration, 0);
		return `
### ${category.icon} ${category.name}
- **Hours**: ${hours}h
- **Sessions**: ${sessions.length}
- **Description**: ${category.description}
`;
	})
	.join('\n')}
    `.trim();
	}

	exportHistory(): string {
		return JSON.stringify(this.history, null, 2);
	}

	addSession(session: Omit<CleanupSession, 'id'>): CleanupSession {
		const newSession: CleanupSession = {
			...session,
			id: `cleanup-${Date.now()}`,
		};

		this.history.sessions.push(newSession);
		this.history.metrics = this.calculateHistory().metrics;
		this.history.lastUpdated = new Date().toISOString();

		return newSession;
	}
}

export const cleanupHistoryService = new CleanupHistoryService();
export default cleanupHistoryService;
