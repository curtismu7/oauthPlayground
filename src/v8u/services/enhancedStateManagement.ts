import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useReducer,
	type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';

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
	| { type: 'IMPORT_STATE'; payload: EnhancedStateSnapshot };

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
		console.warn('[EnhancedState] Failed to load snapshot', error);
	}
	return defaultSnapshot;
};

const persistSnapshot = (snapshot: EnhancedStateSnapshot) => {
	try {
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
		}
	} catch (error) {
		console.warn('[EnhancedState] Failed to persist snapshot', error);
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
					pendingActions: snapshot.offline.pendingActions.filter((item) => item.id !== action.payload),
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
			};
		default:
			return snapshot;
	}
};

const snapshotsEqual = (a: EnhancedStateSnapshot, b: EnhancedStateSnapshot): boolean =>
	JSON.stringify(a) === JSON.stringify(b);

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
			queueOfflineAction: (pending: PendingAction) => dispatch({ type: 'QUEUE_OFFLINE_ACTION', payload: pending }),
			completeOfflineAction: (actionId: string) => dispatch({ type: 'COMPLETE_OFFLINE_ACTION', payload: actionId }),
			startSync: () => dispatch({ type: 'START_SYNC' }),
			finishSync: (success: boolean) => dispatch({ type: 'FINISH_SYNC', payload: { success, timestamp: Date.now() } }),
			setTokenMetrics: (metrics: Partial<UnifiedFlowMetrics>) =>
				dispatch({ type: 'SET_TOKEN_METRICS', payload: metrics }),
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

	return <UnifiedFlowContext.Provider value={contextValue}>{children}</UnifiedFlowContext.Provider>;
};

export const useUnifiedFlowState = () => {
	const context = useContext(UnifiedFlowContext);
	if (!context) {
		throw new Error('useUnifiedFlowState must be used within a UnifiedFlowProvider');
	}
	return context;
};

export const stateUtils = {
	exportAllState(): EnhancedStateSnapshot {
		return JSON.parse(JSON.stringify(historyState.present));
	},
	importAllState(data: EnhancedStateSnapshot): boolean {
		if (!externalDispatch.current) return false;
		externalDispatch.current({ type: 'IMPORT_STATE', payload: data });
		return true;
	},
	resetAllState(): void {
		externalDispatch.current?.({ type: 'RESET_STATE' });
	},
	getStateStats() {
		return {
			...historyState.present,
			history: {
				pastCount: historyState.past.length,
				futureCount: historyState.future.length,
			},
		};
	},
};

export type { PendingAction as UnifiedPendingAction };

export default EnhancedStateProvider;
