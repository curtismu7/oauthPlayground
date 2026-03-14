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
// Last updated: 2026-03-13T16:36:56.897Z
// Source: git log (5 days → 5 sessions)

const CLEANUP_SESSIONS: CleanupSession[] = [
  {
    "id": "git-2026-03-13-code-cleanup",
    "date": "2026-03-13",
    "duration": 12,
    "category": {
      "id": "code-cleanup",
      "name": "Code Cleanup",
      "color": "#FFC107",
      "icon": "🧹",
      "description": "Code Cleanup"
    },
    "description": "25 commits: Add AI Assistant dedicated page implementation to regression log; Add dedicated AI Assistant page with full-page support …",
    "filesModified": 121,
    "linesOfCode": 18499,
    "issuesResolved": 231,
    "documentation": [],
    "achievements": [
      "Add AI Assistant dedicated page implementation to regression log",
      "Add dedicated AI Assistant page with full-page support",
      "Replace console.log with proper logging in AI Assistant side panel",
      "Add AI Assistant side panel with PingOne login and tools",
      "Clean up regression plan - remove duplicates and organize entries"
    ],
    "version": "9.16.2"
  },
  {
    "id": "git-2026-03-12-code-cleanup",
    "date": "2026-03-12",
    "duration": 12,
    "category": {
      "id": "code-cleanup",
      "name": "Code Cleanup",
      "color": "#FFC107",
      "icon": "🧹",
      "description": "Code Cleanup"
    },
    "description": "5 commits: Update version to 9.16.2 - Complete all pages implementation; Complete remaining pages and step components …",
    "filesModified": 13152,
    "linesOfCode": 72031,
    "issuesResolved": 900,
    "documentation": [],
    "achievements": [
      "Update version to 9.16.2 - Complete all pages implementation",
      "Complete remaining pages and step components",
      "Update version to 9.16.1 - Complete token operations merge",
      "Replace maintenance message with TokenManagementPage in Token Operations",
      "popout window, persistence, streaming, copy/export, MCP routing fixes"
    ],
    "version": "9.16.2"
  },
  {
    "id": "git-2026-03-11-security",
    "date": "2026-03-11",
    "duration": 12,
    "category": {
      "id": "security",
      "name": "Security",
      "color": "#E83E8C",
      "icon": "🔒",
      "description": "Security"
    },
    "description": "3 commits: 🔒 Security: Remove .env from Git tracking, keep API keys secure; Update CleanlinessDashboardWorking.tsx with new audit items and status changes …",
    "filesModified": 717,
    "linesOfCode": 11487,
    "issuesResolved": 144,
    "documentation": [],
    "achievements": [
      "🔒 Security: Remove .env from Git tracking, keep API keys secure",
      "Update CleanlinessDashboardWorking.tsx with new audit items and status changes",
      "UI: remove V7M/V8 from user-facing text; dashboard update messages; PARFlowV9 fix; Git log quiet"
    ],
    "version": "9.16.2"
  },
  {
    "id": "git-2026-03-10-code-cleanup",
    "date": "2026-03-10",
    "duration": 12,
    "category": {
      "id": "code-cleanup",
      "name": "Code Cleanup",
      "color": "#FFC107",
      "icon": "🧹",
      "description": "Code Cleanup"
    },
    "description": "19 commits: Add dynamic sidebar resize support - v9.14.4; Fix discovery loading state and add validation - v9.14.3 …",
    "filesModified": 548,
    "linesOfCode": 43608,
    "issuesResolved": 545,
    "documentation": [],
    "achievements": [
      "Add dynamic sidebar resize support - v9.14.4",
      "Fix discovery loading state and add validation - v9.14.3",
      "Fix content layout spacing - v9.14.2",
      "Fix menu scrolling issue - v9.14.1",
      "no grey buttons, DPoP route/UI, PAR/RAR stepper, V9 logging, docs"
    ],
    "version": "9.16.2"
  },
  {
    "id": "git-2026-03-09-code-cleanup",
    "date": "2026-03-09",
    "duration": 0.5,
    "category": {
      "id": "code-cleanup",
      "name": "Code Cleanup",
      "color": "#FFC107",
      "icon": "🧹",
      "description": "Code Cleanup"
    },
    "description": "41 commits: migrate credentialDebugger and mfaRedirectUriServiceV8 console.group/log/warn/error to structured logger — zero console.* calls in non-test production source; replace console.group/groupEnd with logger calls in CompleteMFAFlow, Dashboard, credentialLoader/Manager, fieldEditingDiagnostic, useDeviceAuthFlow; remove duplicate logger imports …",
    "filesModified": 0,
    "linesOfCode": 0,
    "issuesResolved": 1,
    "documentation": [],
    "achievements": [
      "migrate credentialDebugger and mfaRedirectUriServiceV8 console.group/log/warn/error to structured logger — zero console.* calls in non-test production source",
      "replace console.group/groupEnd with logger calls in CompleteMFAFlow, Dashboard, credentialLoader/Manager, fieldEditingDiagnostic, useDeviceAuthFlow; remove duplicate logger imports",
      "migrate console.warn Alert calls to showGlobalError/Success/Warning in v7 pages, fix console.error in v8 stepper, logger in webhookViewerPopoutHelper, clean up UnifiedDocumentationModal",
      "remove console.group/groupEnd from credential services, fix V9_COLORS interpolation, drop unused _log in DeviceAuthFlowV9",
      "session cleanup — env ID read-only display, remove floating stepper, logger.success→info, linter warnings (0/0), duplicate import, v8 quote normalization, misc service fixes"
    ],
    "version": "9.16.2"
  }
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
