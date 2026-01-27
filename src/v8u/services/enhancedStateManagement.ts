import React, {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useReducer,
} from 'react';
import { unifiedWorkerTokenService } from '../../services/unifiedWorkerTokenService';
import { type ApiCall, TokenMonitoringService } from './tokenMonitoringService';
import { logger } from './unifiedFlowLoggerServiceV8U';

export type ThemePreference = 'light' | 'dark' | 'auto';

export interface SecuritySettings {
	enableTokenEncryption: boolean;
	sessionTimeout: number; // minutes
	requireReauth: boolean;
	secureStorage: boolean;
	auditLogging: boolean;
	tokenMasking: boolean;
}

export interface SecurityAuditLog {
	id: string;
	timestamp: number;
	event: string;
	details: Record<string, unknown>;
	severity: 'low' | 'medium' | 'high' | 'critical';
	userAction: boolean;
	ipAddress?: string;
	userAgent?: string;
}

export interface PendingAction {
	id: string;
	type: string;
	timestamp: number;
	payload?: Record<string, unknown>;
}

export interface UnifiedFlowMetrics {
	tokenCount: number;
	featureCount: number;
	errorCount: number;
	apiCallCount: number;
	lastApiCall: number | null;
	performanceMetrics: {
		avgResponseTime: number;
		successRate: number;
		totalCalls: number;
	};
	workerTokenMetrics: {
		hasWorkerToken: boolean;
		workerTokenValid: boolean;
		workerTokenExpiry: number | null;
		lastWorkerTokenRefresh: number | null;
	};
	securityMetrics: {
		securityScore: number; // 0-100
		threatsBlocked: number;
		lastSecurityScan: number | null;
		encryptionEnabled: boolean;
		auditLogCount: number;
	};
}

export interface OfflineState {
	isOnline: boolean;
	pendingActions: PendingAction[];
	syncStatus: 'idle' | 'pending' | 'syncing' | 'error';
	lastSyncTime: number | null;
}

export interface PerformanceState {
	lastActivity: number | null;
}

export interface EnhancedStateSnapshot {
	notifications: boolean;
	theme: ThemePreference;
	unifiedFlow: UnifiedFlowMetrics;
	offline: OfflineState;
	performance: PerformanceState;
	security: SecuritySettings;
	auditLogs: SecurityAuditLog[];
}

interface HistoryState {
	past: EnhancedStateSnapshot[];
	present: EnhancedStateSnapshot;
	future: EnhancedStateSnapshot[];
}

type DomainAction =
	| { type: 'SET_THEME'; payload: ThemePreference }
	| { type: 'TOGGLE_NOTIFICATIONS' }
	| { type: 'RECORD_ACTIVITY' }
	| { type: 'SET_TOKEN_METRICS'; payload: Partial<UnifiedFlowMetrics> }
	| { type: 'SET_OFFLINE_STATUS'; payload: boolean }
	| { type: 'QUEUE_OFFLINE_ACTION'; payload: PendingAction }
	| { type: 'COMPLETE_OFFLINE_ACTION'; payload: string }
	| { type: 'START_SYNC' }
	| { type: 'FINISH_SYNC'; payload: { success: boolean; timestamp: number } }
	| { type: 'RESET_STATE' }
	| { type: 'IMPORT_STATE'; payload: EnhancedStateSnapshot }
	| { type: 'UPDATE_REAL_METRICS'; payload: Partial<UnifiedFlowMetrics> }
	| { type: 'UPDATE_SECURITY_SETTINGS'; payload: Partial<SecuritySettings> }
	| { type: 'ADD_AUDIT_LOG'; payload: SecurityAuditLog }
	| { type: 'SECURITY_SCAN'; payload: { threats: number; score: number } };

type HistoryAction =
	| DomainAction
	| { type: 'HISTORY_UNDO' }
	| { type: 'HISTORY_REDO' }
	| { type: 'CLEAR_HISTORY' };

const STORAGE_KEY = 'v8u.enhancedState.snapshot.v1';
const HISTORY_LIMIT = 100;

const defaultSnapshot: EnhancedStateSnapshot = {
	notifications: true,
	theme: 'auto',
	unifiedFlow: {
		tokenCount: 0,
		featureCount: 5,
		errorCount: 0,
		apiCallCount: 0,
		lastApiCall: null,
		performanceMetrics: {
			avgResponseTime: 0,
			successRate: 100,
			totalCalls: 0,
		},
		workerTokenMetrics: {
			hasWorkerToken: false,
			workerTokenValid: false,
			workerTokenExpiry: null,
			lastWorkerTokenRefresh: null,
		},
		securityMetrics: {
			securityScore: 85, // Default good score
			threatsBlocked: 0,
			lastSecurityScan: Date.now(),
			encryptionEnabled: true,
			auditLogCount: 0,
		},
	},
	offline: {
		isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
		pendingActions: [],
		syncStatus: 'idle',
		lastSyncTime: null,
	},
	performance: {
		lastActivity: null,
	},
	security: {
		enableTokenEncryption: true,
		sessionTimeout: 30, // 30 minutes
		requireReauth: false,
		secureStorage: true,
		auditLogging: true,
		tokenMasking: true,
	},
	auditLogs: [],
};

const loadSnapshot = (): EnhancedStateSnapshot => {
	try {
		const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
		if (raw) {
			const parsed = JSON.parse(raw) as EnhancedStateSnapshot;
			return {
				...defaultSnapshot,
				...parsed,
				offline: { ...defaultSnapshot.offline, ...parsed.offline },
				unifiedFlow: { ...defaultSnapshot.unifiedFlow, ...parsed.unifiedFlow },
				performance: { ...defaultSnapshot.performance, ...parsed.performance },
			};
		}
	} catch (error) {
		logger.warn('[EnhancedState] Failed to load snapshot', error);
	}
	return defaultSnapshot;
};

const persistSnapshot = (snapshot: EnhancedStateSnapshot) => {
	try {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		}
	} catch (error) {
		logger.warn('[EnhancedState] Failed to persist snapshot', error);
	}
};

const applyDomainAction = (
	snapshot: EnhancedStateSnapshot,
	action: DomainAction
): EnhancedStateSnapshot => {
	switch (action.type) {
		case 'SET_THEME':
			return { ...snapshot, theme: action.payload };
		case 'TOGGLE_NOTIFICATIONS':
			return { ...snapshot, notifications: !snapshot.notifications };
		case 'RECORD_ACTIVITY':
			return {
				...snapshot,
				performance: { ...snapshot.performance, lastActivity: Date.now() },
			};
		case 'SET_TOKEN_METRICS':
			return {
				...snapshot,
				unifiedFlow: { ...snapshot.unifiedFlow, ...action.payload },
			};
		case 'UPDATE_REAL_METRICS':
			return {
				...snapshot,
				unifiedFlow: { ...snapshot.unifiedFlow, ...action.payload },
			};
		case 'SET_OFFLINE_STATUS':
			return {
				...snapshot,
				offline: { ...snapshot.offline, isOnline: action.payload },
			};
		case 'QUEUE_OFFLINE_ACTION':
			return {
				...snapshot,
				offline: {
					...snapshot.offline,
					pendingActions: [...snapshot.offline.pendingActions, action.payload],
					syncStatus: 'pending',
				},
			};
		case 'COMPLETE_OFFLINE_ACTION':
			return {
				...snapshot,
				offline: {
					...snapshot.offline,
					pendingActions: snapshot.offline.pendingActions.filter(
						(item) => item.id !== action.payload
					),
				},
			};
		case 'START_SYNC':
			return {
				...snapshot,
				offline: { ...snapshot.offline, syncStatus: 'syncing' },
			};
		case 'FINISH_SYNC':
			return {
				...snapshot,
				offline: {
					...snapshot.offline,
					syncStatus: action.payload.success ? 'idle' : 'error',
					lastSyncTime: action.payload.timestamp,
				},
			};
		case 'RESET_STATE':
			return defaultSnapshot;
		case 'IMPORT_STATE':
			return {
				...defaultSnapshot,
				...action.payload,
				offline: { ...defaultSnapshot.offline, ...action.payload.offline },
				unifiedFlow: { ...defaultSnapshot.unifiedFlow, ...action.payload.unifiedFlow },
				performance: { ...defaultSnapshot.performance, ...action.payload.performance },
				security: { ...defaultSnapshot.security, ...action.payload.security },
				auditLogs: action.payload.auditLogs || defaultSnapshot.auditLogs,
			};
		case 'UPDATE_SECURITY_SETTINGS':
			return {
				...snapshot,
				security: { ...snapshot.security, ...action.payload },
			};
		case 'ADD_AUDIT_LOG':
			return {
				...snapshot,
				auditLogs: [action.payload, ...snapshot.auditLogs].slice(0, 1000), // Keep last 1000 logs
			};
		case 'SECURITY_SCAN':
			return {
				...snapshot,
				unifiedFlow: {
					...snapshot.unifiedFlow,
					securityMetrics: {
						...snapshot.unifiedFlow.securityMetrics,
						securityScore: action.payload.score,
						threatsBlocked: action.payload.threats,
						lastSecurityScan: Date.now(),
					},
				},
			};
		default:
			return snapshot;
	}
};

const snapshotsEqual = (a: EnhancedStateSnapshot, b: EnhancedStateSnapshot): boolean =>
	JSON.stringify(a) === JSON.stringify(b);

// Function to get real metrics from token monitoring service
const getRealMetrics = async (): Promise<Partial<UnifiedFlowMetrics>> => {
	try {
		const tokenService = TokenMonitoringService.getInstance();
		const tokens = tokenService.getAllTokens();
		const apiCalls = tokenService.getApiCalls();

		// Calculate API call metrics
		const successCount = apiCalls.filter((call) => call.success).length;
		const totalCalls = apiCalls.length;
		const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 100;
		const avgResponseTime =
			totalCalls > 0 ? apiCalls.reduce((sum, call) => sum + call.duration, 0) / totalCalls : 0;

		const lastApiCall =
			apiCalls.length > 0 ? Math.max(...apiCalls.map((call) => call.timestamp)) : null;

		// Get worker token metrics
		let workerTokenMetrics = {
			hasWorkerToken: false,
			workerTokenValid: false,
			workerTokenExpiry: null as number | null,
			lastWorkerTokenRefresh: null as number | null,
		};

		try {
			const workerTokenStatus = await unifiedWorkerTokenService.getStatus();
			workerTokenMetrics = {
				hasWorkerToken: workerTokenStatus.hasToken || false,
				workerTokenValid: workerTokenStatus.tokenValid || false,
				workerTokenExpiry: workerTokenStatus.tokenExpiresIn
					? Date.now() + workerTokenStatus.tokenExpiresIn * 1000
					: null,
				lastWorkerTokenRefresh: workerTokenStatus.lastFetchedAt || null,
			};
		} catch (error) {
			logger.warn('[EnhancedState] Failed to get worker token status:', error);
		}

		// Count worker tokens specifically
		const workerTokens = tokens.filter((token) => token.type === 'worker_token');

		return {
			tokenCount: tokens.length,
			apiCallCount: totalCalls,
			lastApiCall,
			performanceMetrics: {
				avgResponseTime: Math.round(avgResponseTime),
				successRate: Math.round(successRate),
				totalCalls,
			},
			workerTokenMetrics,
			// Add worker token count to feature count
			featureCount: 5 + workerTokens.length,
		};
	} catch (error) {
		logger.warn('[EnhancedState] Failed to get real metrics:', error);
		return {
			tokenCount: 0,
			apiCallCount: 0,
			lastApiCall: null,
			performanceMetrics: {
				avgResponseTime: 0,
				successRate: 100,
				totalCalls: 0,
			},
			workerTokenMetrics: {
				hasWorkerToken: false,
				workerTokenValid: false,
				workerTokenExpiry: null,
				lastWorkerTokenRefresh: null,
			},
		};
	}
};

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
	switch (action.type) {
		case 'HISTORY_UNDO':
			if (!state.past.length) return state;
			return {
				past: state.past.slice(0, -1),
				present: state.past[state.past.length - 1],
				future: [state.present, ...state.future],
			};
		case 'HISTORY_REDO':
			if (!state.future.length) return state;
			return {
				past: [...state.past, state.present],
				present: state.future[0],
				future: state.future.slice(1),
			};
		case 'CLEAR_HISTORY':
			return { past: [], present: state.present, future: [] };
		default: {
			const next = applyDomainAction(state.present, action as DomainAction);
			if (snapshotsEqual(next, state.present)) {
				return state;
			}
			const trimmedPast = [...state.past, state.present].slice(-HISTORY_LIMIT);
			return { past: trimmedPast, present: next, future: [] };
		}
	}
};

interface UnifiedFlowContextValue {
	state: EnhancedStateSnapshot;
	stats: {
		pastCount: number;
		futureCount: number;
	};
	actions: {
		setTheme: (theme: ThemePreference) => void;
		toggleNotifications: () => void;
		recordActivity: () => void;
		queueOfflineAction: (action: PendingAction) => void;
		completeOfflineAction: (actionId: string) => void;
		startSync: () => void;
		finishSync: (success: boolean) => void;
		setTokenMetrics: (metrics: Partial<UnifiedFlowMetrics>) => void;
		updateRealMetrics: () => void;
		undo: () => boolean;
		redo: () => boolean;
		canUndo: () => boolean;
		canRedo: () => boolean;
		clearHistory: () => void;
		resetState: () => void;
	};
}

const UnifiedFlowContext = createContext<UnifiedFlowContextValue | undefined>(undefined);

const EnhancedStateProvider = ({ children }: { children: ReactNode }) => {
	const [historyState, dispatch] = useReducer(historyReducer, {
		past: [],
		present: loadSnapshot(),
		future: [],
	});

	const externalDispatch = React.useRef<((action: HistoryAction) => void) | null>(null);

	// Auto-update real metrics every 2 seconds
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const metrics = await getRealMetrics();
				dispatch({ type: 'UPDATE_REAL_METRICS', payload: metrics });
			} catch (error) {
				logger.warn('[EnhancedState] Failed to update real metrics:', error);
			}
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		externalDispatch.current = dispatch;
		return () => {
			externalDispatch.current = null;
		};
	}, [dispatch]);

	const actions = useMemo(() => {
		return {
			setTheme: (theme: ThemePreference) => dispatch({ type: 'SET_THEME', payload: theme }),
			toggleNotifications: () => dispatch({ type: 'TOGGLE_NOTIFICATIONS' }),
			recordActivity: () => dispatch({ type: 'RECORD_ACTIVITY' }),
			queueOfflineAction: (pending: PendingAction) =>
				dispatch({ type: 'QUEUE_OFFLINE_ACTION', payload: pending }),
			completeOfflineAction: (actionId: string) =>
				dispatch({ type: 'COMPLETE_OFFLINE_ACTION', payload: actionId }),
			startSync: () => dispatch({ type: 'START_SYNC' }),
			finishSync: (success: boolean) =>
				dispatch({ type: 'FINISH_SYNC', payload: { success, timestamp: Date.now() } }),
			setTokenMetrics: (metrics: Partial<UnifiedFlowMetrics>) =>
				dispatch({ type: 'SET_TOKEN_METRICS', payload: metrics }),
			updateRealMetrics: async () => {
				try {
					const metrics = await getRealMetrics();
					dispatch({ type: 'UPDATE_REAL_METRICS', payload: metrics });
				} catch (error) {
					logger.warn('[EnhancedState] Failed to update real metrics:', error);
				}
			},
			updateSecuritySettings: (settings: Partial<SecuritySettings>) =>
				dispatch({ type: 'UPDATE_SECURITY_SETTINGS', payload: settings }),
			addAuditLog: (log: SecurityAuditLog) => dispatch({ type: 'ADD_AUDIT_LOG', payload: log }),
			performSecurityScan: (score: number, threats: number) =>
				dispatch({ type: 'SECURITY_SCAN', payload: { score, threats } }),
			undo: () => {
				if (historyState.past.length === 0) return false;
				dispatch({ type: 'HISTORY_UNDO' });
				return true;
			},
			redo: () => {
				if (historyState.future.length === 0) return false;
				dispatch({ type: 'HISTORY_REDO' });
				return true;
			},
			canUndo: () => historyState.past.length > 0,
			canRedo: () => historyState.future.length > 0,
			clearHistory: () => dispatch({ type: 'CLEAR_HISTORY' }),
			resetState: () => dispatch({ type: 'RESET_STATE' }),
		};
	}, [historyState.past.length, historyState.future.length]);

	const contextValue: UnifiedFlowContextValue = {
		state: historyState.present,
		stats: {
			pastCount: historyState.past.length,
			futureCount: historyState.future.length,
		},
		actions,
	};

	useEffect(() => {
		persistSnapshot(historyState.present);
	}, [historyState.present]);

	return React.createElement(UnifiedFlowContext.Provider, { value: contextValue }, children);
};

export const useUnifiedFlowState = () => {
	const context = useContext(UnifiedFlowContext);
	if (!context) {
		throw new Error('useUnifiedFlowState must be used within an EnhancedStateProvider');
	}
	return context;
};

export const stateUtils = {
	exportAllState(): EnhancedStateSnapshot {
		const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
		if (stored) {
			return JSON.parse(stored) as EnhancedStateSnapshot;
		}
		return defaultSnapshot;
	},
	importAllState(data: EnhancedStateSnapshot): boolean {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			return true;
		}
		return false;
	},
	resetAllState(): void {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSnapshot));
		}
	},
	getStateStats() {
		const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
		if (stored) {
			const state = JSON.parse(stored) as EnhancedStateSnapshot;
			return {
				...state,
				history: {
					pastCount: 0,
					futureCount: 0,
				},
			};
		}
		return {
			...defaultSnapshot,
			history: {
				pastCount: 0,
				futureCount: 0,
			},
		};
	},
};

export type { PendingAction as UnifiedPendingAction };

export default EnhancedStateProvider;
