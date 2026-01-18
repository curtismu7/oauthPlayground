// src/services/postmanIssues.ts

type IssueLevel = 'error' | 'warning';

export type GenerationIssue = {
	level: IssueLevel;
	code: string;
	message: string;
	context?: Record<string, unknown>;
};

/**
 * Redact known sensitive fields from logs to avoid leaking secrets.
 */
export const redactSensitive = (
	context?: Record<string, unknown>
): Record<string, unknown> | undefined => {
	if (!context) return context;
	const redactionKeys = [
		'secret',
		'token',
		'password',
		'authorization',
		'code_verifier',
		'codeverifier',
		'code_challenge',
		'codechallenge',
	];
	const redacted: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(context)) {
		const lowerKey = key.toLowerCase();
		const shouldRedact = redactionKeys.some((needle) => lowerKey.includes(needle));
		if (shouldRedact) {
			redacted[key] = '[REDACTED]';
			continue;
		}
		if (typeof value === 'string' && value.length > 500) {
			redacted[key] = `${value.slice(0, 500)}...[truncated]`;
			continue;
		}
		redacted[key] = value;
	}
	return redacted;
};

/**
 * GenerationIssues collects errors and warnings for a single generation run.
 */
export class GenerationIssues {
	private issues: GenerationIssue[] = [];
	private readonly runLabel: string;

	/**
	 * Create a new issue collector with a readable label.
	 */
	constructor(runLabel: string) {
		this.runLabel = runLabel;
	}

	/**
	 * Add a generation error with context.
	 */
	addError(code: string, message: string, context?: Record<string, unknown>): void {
		const issue: GenerationIssue = context
			? { level: 'error', code, message, context }
			: { level: 'error', code, message };
		this.issues.push(issue);
	}

	/**
	 * Add a generation warning with context.
	 */
	addWarning(code: string, message: string, context?: Record<string, unknown>): void {
		const issue: GenerationIssue = context
			? { level: 'warning', code, message, context }
			: { level: 'warning', code, message };
		this.issues.push(issue);
	}

	/**
	 * Print a summary of warnings/errors for diagnostics.
	 */
	printSummary(): void {
		if (!this.issues.length) return;
		const grouped = this.issues.reduce(
			(acc, issue) => {
				acc[issue.level].push(issue);
				return acc;
			},
			{ error: [] as GenerationIssue[], warning: [] as GenerationIssue[] }
		);
		if (grouped.error.length) {
			console.error(`[POSTMAN-GEN] ${this.runLabel} errors: ${grouped.error.length}`);
			grouped.error.forEach((issue) => {
				console.error(
					`[POSTMAN-GEN][ERROR] ${issue.code}: ${issue.message}`,
					redactSensitive(issue.context)
				);
			});
		}
		if (grouped.warning.length) {
			console.warn(`[POSTMAN-GEN] ${this.runLabel} warnings: ${grouped.warning.length}`);
			grouped.warning.forEach((issue) => {
				console.warn(
					`[POSTMAN-GEN][WARN] ${issue.code}: ${issue.message}`,
					redactSensitive(issue.context)
				);
			});
		}
	}

	/**
	 * Throw when errors exist, after printing a summary.
	 */
	throwIfErrors(): void {
		const hasErrors = this.issues.some((issue) => issue.level === 'error');
		if (!hasErrors) return;
		this.printSummary();
		throw new Error(`[POSTMAN-GEN] ${this.runLabel} failed with validation errors.`);
	}

	/**
	 * Check if warnings are present.
	 */
	hasWarnings(): boolean {
		return this.issues.some((issue) => issue.level === 'warning');
	}

	/**
	 * Expose issues for testing and diagnostics.
	 */
	getIssues(): GenerationIssue[] {
		return [...this.issues];
	}
}
