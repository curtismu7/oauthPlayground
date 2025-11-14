import { useCallback, useEffect, useState } from 'react';
import {
	diagnoseError,
	ErrorDiagnosis,
	ErrorHistory,
	ErrorPattern,
	ErrorStatistics,
	errorDiagnosisManager,
	getErrorHistory,
	getErrorPatterns,
	resolveError,
	SuggestedFix,
} from '../utils/errorDiagnosis';
import { logger } from '../utils/logger';

// Error diagnosis hook configuration
export interface UseErrorDiagnosisConfig {
	enabled?: boolean;
	autoDiagnose?: boolean;
	debug?: boolean;
}

// Error diagnosis state
export interface ErrorDiagnosisState {
	isDiagnosing: boolean;
	currentDiagnosis: ErrorDiagnosis | null;
	errorHistory: ErrorHistory;
	errorPatterns: ErrorPattern[];
	statistics: ErrorStatistics;
	error: Error | null;
}

// useErrorDiagnosis hook
export const useErrorDiagnosis = (config: UseErrorDiagnosisConfig = {}) => {
	const { enabled = true, autoDiagnose = false, debug = false } = config;

	const [state, setState] = useState<ErrorDiagnosisState>({
		isDiagnosing: false,
		currentDiagnosis: null,
		errorHistory: { errors: [], patterns: [], statistics: {} as ErrorStatistics, trends: [] },
		errorPatterns: [],
		statistics: {} as ErrorStatistics,
		error: null,
	});

	// Initialize error patterns and history
	useEffect(() => {
		if (enabled) {
			const patterns = getErrorPatterns();
			const history = getErrorHistory();

			setState((prev) => ({
				...prev,
				errorPatterns: patterns,
				errorHistory: history,
				statistics: history.statistics,
			}));
		}
	}, [enabled]);

	// Diagnose an error
	const diagnoseErrorValue = useCallback(
		async (errorMessage: string, errorCode?: string, context: Record<string, any> = {}) => {
			if (!enabled) return null;

			setState((prev) => ({ ...prev, isDiagnosing: true, error: null }));

			try {
				const diagnosis = diagnoseError(errorMessage, errorCode, context);

				setState((prev) => ({
					...prev,
					currentDiagnosis: diagnosis,
					isDiagnosing: false,
				}));

				// Update history
				const updatedHistory = getErrorHistory();
				setState((prev) => ({
					...prev,
					errorHistory: updatedHistory,
					statistics: updatedHistory.statistics,
				}));

				if (debug) {
					logger.info('[useErrorDiagnosis] Error diagnosed', {
						errorId: diagnosis.errorId,
						confidence: diagnosis.confidence,
						severity: diagnosis.severity,
					});
				}

				return diagnosis;
			} catch (error) {
				const err = error as Error;
				setState((prev) => ({
					...prev,
					error: err,
					isDiagnosing: false,
				}));

				if (debug) {
					logger.error('[useErrorDiagnosis] Error diagnosis failed:', err);
				}

				throw err;
			}
		},
		[enabled, debug]
	);

	// Resolve an error
	const resolveErrorValue = useCallback(
		async (errorId: string, appliedFix: SuggestedFix, success: boolean, notes?: string) => {
			if (!enabled) return;

			try {
				resolveError(errorId, appliedFix, success, notes);

				// Update history
				const updatedHistory = getErrorHistory();
				setState((prev) => ({
					...prev,
					errorHistory: updatedHistory,
					statistics: updatedHistory.statistics,
				}));

				if (debug) {
					logger.info('[useErrorDiagnosis] Error resolved', { errorId, success });
				}
			} catch (error) {
				if (debug) {
					logger.error('[useErrorDiagnosis] Error resolution failed:', error);
				}
				throw error;
			}
		},
		[enabled, debug]
	);

	// Get error patterns by category
	const getErrorPatternsByCategory = useCallback(
		(category: string) => {
			return state.errorPatterns.filter((pattern) => pattern.category === category);
		},
		[state.errorPatterns]
	);

	// Get error patterns by severity
	const getErrorPatternsBySeverity = useCallback(
		(severity: string) => {
			return state.errorPatterns.filter((pattern) => pattern.severity === severity);
		},
		[state.errorPatterns]
	);

	// Get recent errors
	const getRecentErrors = useCallback(
		(limit: number = 10) => {
			return state.errorHistory.errors
				.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
				.slice(0, limit);
		},
		[state.errorHistory.errors]
	);

	// Get unresolved errors
	const getUnresolvedErrors = useCallback(() => {
		return state.errorHistory.errors.filter((error) => !error.resolved);
	}, [state.errorHistory.errors]);

	// Get errors by category
	const getErrorsByCategory = useCallback(
		(category: string) => {
			return state.errorHistory.errors.filter((error) => error.category === category);
		},
		[state.errorHistory.errors]
	);

	// Get errors by severity
	const getErrorsBySeverity = useCallback(
		(severity: string) => {
			return state.errorHistory.errors.filter((error) => error.severity === severity);
		},
		[state.errorHistory.errors]
	);

	// Get critical errors
	const getCriticalErrors = useCallback(() => {
		return state.errorHistory.errors.filter((error) => error.severity === 'critical');
	}, [state.errorHistory.errors]);

	// Get high severity errors
	const getHighSeverityErrors = useCallback(() => {
		return state.errorHistory.errors.filter(
			(error) => error.severity === 'critical' || error.severity === 'high'
		);
	}, [state.errorHistory.errors]);

	// Get most common errors
	const getMostCommonErrors = useCallback(() => {
		return state.statistics.mostCommonErrors || [];
	}, [state.statistics]);

	// Get error trends
	const getErrorTrends = useCallback(() => {
		return state.errorHistory.trends || [];
	}, [state.errorHistory.trends]);

	// Get error statistics
	const getErrorStatistics = useCallback(() => {
		return state.statistics;
	}, [state.statistics]);

	// Get suggested fixes for current diagnosis
	const getSuggestedFixes = useCallback(() => {
		if (!state.currentDiagnosis) {
			return [];
		}

		return state.currentDiagnosis.suggestedFixes.sort((a, b) => {
			const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
			const aPriority = priorityOrder[a.priority];
			const bPriority = priorityOrder[b.priority];

			if (aPriority !== bPriority) {
				return bPriority - aPriority;
			}

			return b.successRate - a.successRate;
		});
	}, [state.currentDiagnosis]);

	// Get error confidence
	const getErrorConfidence = useCallback(() => {
		return state.currentDiagnosis?.confidence || 0;
	}, [state.currentDiagnosis]);

	// Get error severity
	const getErrorSeverity = useCallback(() => {
		return state.currentDiagnosis?.severity || 'medium';
	}, [state.currentDiagnosis]);

	// Get error category
	const getErrorCategory = useCallback(() => {
		return state.currentDiagnosis?.category || 'unknown';
	}, [state.currentDiagnosis]);

	// Check if error is resolved
	const isErrorResolved = useCallback(() => {
		return state.currentDiagnosis?.resolved || false;
	}, [state.currentDiagnosis]);

	// Get error resolution
	const getErrorResolution = useCallback(() => {
		return state.currentDiagnosis?.resolution || null;
	}, [state.currentDiagnosis]);

	// Clear error history
	const clearErrorHistory = useCallback(() => {
		errorDiagnosisManager.clearErrorHistory();
		const updatedHistory = getErrorHistory();
		setState((prev) => ({
			...prev,
			errorHistory: updatedHistory,
			statistics: updatedHistory.statistics,
		}));
	}, []);

	// Export error data
	const exportErrorData = useCallback(() => {
		const dataStr = errorDiagnosisManager.exportErrorData();
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `error-diagnosis-${Date.now()}.json`;
		link.click();

		URL.revokeObjectURL(url);
	}, []);

	// Add custom error pattern
	const addCustomErrorPattern = useCallback((pattern: ErrorPattern) => {
		errorDiagnosisManager.addErrorPattern(pattern);
		const patterns = getErrorPatterns();
		setState((prev) => ({
			...prev,
			errorPatterns: patterns,
		}));
	}, []);

	return {
		// State
		...state,

		// Actions
		diagnoseError: diagnoseErrorValue,
		resolveError: resolveErrorValue,
		clearErrorHistory,
		exportErrorData,
		addCustomErrorPattern,

		// Getters
		getErrorPatternsByCategory,
		getErrorPatternsBySeverity,
		getRecentErrors,
		getUnresolvedErrors,
		getErrorsByCategory,
		getErrorsBySeverity,
		getCriticalErrors,
		getHighSeverityErrors,
		getMostCommonErrors,
		getErrorTrends,
		getErrorStatistics,
		getSuggestedFixes,
		getErrorConfidence,
		getErrorSeverity,
		getErrorCategory,
		isErrorResolved,
		getErrorResolution,

		// Computed values
		hasCurrentDiagnosis: !!state.currentDiagnosis,
		hasErrors: state.errorHistory.errors.length > 0,
		hasUnresolvedErrors: getUnresolvedErrors().length > 0,
		hasCriticalErrors: getCriticalErrors().length > 0,
		totalErrors: state.statistics.totalErrors || 0,
		successRate: state.statistics.successRate || 0,
		averageResolutionTime: state.statistics.averageResolutionTime || 0,
	};
};

// Hook for automated error detection
export const useAutomatedErrorDetection = (enabled: boolean = true) => {
	const { diagnoseError, getErrorPatterns } = useErrorDiagnosis({ enabled });

	const [detectedErrors, _setDetectedErrors] = useState<ErrorDiagnosis[]>([]);
	const [isMonitoring, setIsMonitoring] = useState(false);

	// Start error monitoring
	const startErrorMonitoring = useCallback(() => {
		if (!enabled) return;

		setIsMonitoring(true);

		// Monitor console errors
		const originalConsoleError = console.error;
		console.error = (...args) => {
			const errorMessage = args.join(' ');
			diagnoseError(errorMessage, undefined, { source: 'console' });
			originalConsoleError.apply(console, args);
		};

		// Monitor unhandled promise rejections
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const errorMessage =
				event.reason?.message || event.reason?.toString() || 'Unhandled promise rejection';
			diagnoseError(errorMessage, 'UNHANDLED_REJECTION', {
				source: 'promise_rejection',
				reason: event.reason,
			});
		};

		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		// Monitor fetch errors
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			try {
				const response = await originalFetch(...args);
				if (!response.ok) {
					const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
					diagnoseError(errorMessage, response.status.toString(), {
						source: 'fetch',
						url: args[0],
						status: response.status,
						statusText: response.statusText,
					});
				}
				return response;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Network error';
				diagnoseError(errorMessage, 'NETWORK_ERROR', {
					source: 'fetch',
					url: args[0],
					error,
				});
				throw error;
			}
		};

		return () => {
			console.error = originalConsoleError;
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
			window.fetch = originalFetch;
			setIsMonitoring(false);
		};
	}, [enabled, diagnoseError]);

	// Stop error monitoring
	const stopErrorMonitoring = useCallback(() => {
		setIsMonitoring(false);
	}, []);

	return {
		detectedErrors,
		isMonitoring,
		startErrorMonitoring,
		stopErrorMonitoring,
	};
};

export default useErrorDiagnosis;
