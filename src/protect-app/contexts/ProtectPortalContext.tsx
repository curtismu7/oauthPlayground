import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
export interface ProtectPortalState {
	appName: string;
	version: string;
	isInitialized: boolean;
	configuration: {
		apiBaseUrl: string;
		environmentId: string;
		region: string;
		features: {
			riskEvaluation: boolean;
			realTimeMonitoring: boolean;
			advancedAnalytics: boolean;
			multiBrand: boolean;
		};
	};
	notifications: Notification[];
	loading: {
		global: boolean;
		components: Record<string, boolean>;
	};
}

export interface Notification {
	id: string;
	type: 'success' | 'error' | 'warning' | 'info';
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	actions?: Array<{
		label: string;
		action: () => void;
		variant?: 'primary' | 'secondary';
	}>;
}

export interface ProtectPortalContextType {
	state: ProtectPortalState;
	dispatch: React.Dispatch<ProtectPortalAction>;
	// Helper methods
	addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
	removeNotification: (id: string) => void;
	markNotificationAsRead: (id: string) => void;
	setLoading: (component: string, isLoading: boolean) => void;
	updateConfiguration: (config: Partial<ProtectPortalState['configuration']>) => void;
}

// Action Types
export type ProtectPortalAction =
	| { type: 'INITIALIZE_APP'; payload: { appName: string; version: string } }
	| { type: 'SET_INITIALIZED'; payload: boolean }
	| { type: 'UPDATE_CONFIGURATION'; payload: Partial<ProtectPortalState['configuration']> }
	| { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp' | 'read'> }
	| { type: 'REMOVE_NOTIFICATION'; payload: string }
	| { type: 'MARK_NOTIFICATION_READ'; payload: string }
	| { type: 'SET_LOADING'; payload: { component: string; isLoading: boolean } }
	| { type: 'CLEAR_NOTIFICATIONS' };

// Initial State
const initialState: ProtectPortalState = {
	appName: 'PingOne Protect Portal',
	version: '1.0.0',
	isInitialized: false,
	configuration: {
		apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.pingone.com',
		environmentId: process.env.REACT_APP_ENVIRONMENT_ID || '',
		region: process.env.REACT_APP_REGION || 'us',
		features: {
			riskEvaluation: true,
			realTimeMonitoring: true,
			advancedAnalytics: true,
			multiBrand: true,
		},
	},
	notifications: [],
	loading: {
		global: false,
		components: {},
	},
};

// Reducer
const protectPortalReducer = (
	state: ProtectPortalState,
	action: ProtectPortalAction
): ProtectPortalState => {
	switch (action.type) {
		case 'INITIALIZE_APP':
			return {
				...state,
				appName: action.payload.appName,
				version: action.payload.version,
			};

		case 'SET_INITIALIZED':
			return {
				...state,
				isInitialized: action.payload,
			};

		case 'UPDATE_CONFIGURATION':
			return {
				...state,
				configuration: {
					...state.configuration,
					...action.payload,
				},
			};

		case 'ADD_NOTIFICATION':
			return {
				...state,
				notifications: [
					{
						...action.payload,
						id: Date.now().toString(),
						timestamp: new Date(),
						read: false,
					},
					...state.notifications,
				].slice(0, 50), // Keep only last 50 notifications
			};

		case 'REMOVE_NOTIFICATION':
			return {
				...state,
				notifications: state.notifications.filter(n => n.id !== action.payload),
			};

		case 'MARK_NOTIFICATION_READ':
			return {
				...state,
				notifications: state.notifications.map(n =>
					n.id === action.payload ? { ...n, read: true } : n
				),
			};

		case 'SET_LOADING':
			return {
				...state,
				loading: {
					...state.loading,
					components: {
						...state.loading.components,
						[action.payload.component]: action.payload.isLoading,
					},
					global: Object.values({
						...state.loading.components,
						[action.payload.component]: action.payload.isLoading,
					}).some(isLoading => isLoading),
				},
			};

		case 'CLEAR_NOTIFICATIONS':
			return {
				...state,
				notifications: [],
			};

		default:
			return state;
	}
};

// Context
const ProtectPortalContext = createContext<ProtectPortalContextType | undefined>(undefined);

// Provider Component
export const ProtectPortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(protectPortalReducer, initialState);

	// Helper methods
	const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
		dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
	};

	const removeNotification = (id: string) => {
		dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
	};

	const markNotificationAsRead = (id: string) => {
		dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
	};

	const setLoading = (component: string, isLoading: boolean) => {
		dispatch({ type: 'SET_LOADING', payload: { component, isLoading } });
	};

	const updateConfiguration = (config: Partial<ProtectPortalState['configuration']>) => {
		dispatch({ type: 'UPDATE_CONFIGURATION', payload: config });
	};

	const value: ProtectPortalContextType = {
		state,
		dispatch,
		addNotification,
		removeNotification,
		markNotificationAsRead,
		setLoading,
		updateConfiguration,
	};

	return (
		<ProtectPortalContext.Provider value={value}>
			{children}
		</ProtectPortalContext.Provider>
	);
};

// Hook
export const useProtectPortal = (): ProtectPortalContextType => {
	const context = useContext(ProtectPortalContext);
	if (context === undefined) {
		throw new Error('useProtectPortal must be used within a ProtectPortalProvider');
	}
	return context;
};
