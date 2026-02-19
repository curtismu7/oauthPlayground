import React, {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useReducer,
} from 'react';

// Auth Types
export interface User {
	id: string;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	roles: string[];
	permissions: string[];
	avatar?: string;
	lastLogin?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface AuthState {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
	refreshToken: string | null;
	isLoading: boolean;
	error: string | null;
	sessionTimeout: number;
	lastActivity: Date;
}

export interface LoginCredentials {
	username: string;
	password: string;
	rememberMe?: boolean;
}

export interface AuthContextType {
	state: AuthState;
	dispatch: React.Dispatch<AuthAction>;
	// Methods
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
	refreshToken: () => Promise<void>;
	updateUser: (user: Partial<User>) => void;
	checkAuthStatus: () => Promise<void>;
	isAuthenticated: boolean;
	hasPermission: (permission: string) => boolean;
	hasRole: (role: string) => boolean;
}

// Action Types
export type AuthAction =
	| { type: 'LOGIN_START' }
	| { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
	| { type: 'LOGIN_FAILURE'; payload: string }
	| { type: 'LOGOUT' }
	| { type: 'REFRESH_TOKEN_START' }
	| { type: 'REFRESH_TOKEN_SUCCESS'; payload: { token: string; refreshToken: string } }
	| { type: 'REFRESH_TOKEN_FAILURE'; payload: string }
	| { type: 'UPDATE_USER'; payload: Partial<User> }
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_ERROR'; payload: string | null }
	| { type: 'UPDATE_LAST_ACTIVITY' }
	| { type: 'SET_SESSION_TIMEOUT'; payload: number };

// Initial State
const initialState: AuthState = {
	isAuthenticated: false,
	user: null,
	token: null,
	refreshToken: null,
	isLoading: true, // Start with loading true to prevent race conditions
	error: null,
	sessionTimeout: 30 * 60 * 1000, // 30 minutes
	lastActivity: new Date(),
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
	switch (action.type) {
		case 'LOGIN_START':
			return {
				...state,
				isLoading: true,
				error: null,
			};

		case 'LOGIN_SUCCESS':
			return {
				...state,
				isAuthenticated: true,
				user: action.payload.user,
				token: action.payload.token,
				refreshToken: action.payload.refreshToken,
				isLoading: false,
				error: null,
				lastActivity: new Date(),
			};

		case 'LOGIN_FAILURE':
			return {
				...state,
				isAuthenticated: false,
				user: null,
				token: null,
				refreshToken: null,
				isLoading: false,
				error: action.payload,
			};

		case 'LOGOUT':
			return {
				...initialState,
				isLoading: false, // Ensure loading is false on logout
			};

		case 'REFRESH_TOKEN_START':
			return {
				...state,
				isLoading: true,
			};

		case 'REFRESH_TOKEN_SUCCESS':
			return {
				...state,
				token: action.payload.token,
				refreshToken: action.payload.refreshToken,
				isLoading: false,
				error: null,
				lastActivity: new Date(),
			};

		case 'REFRESH_TOKEN_FAILURE':
			return {
				...initialState,
				error: action.payload,
			};

		case 'UPDATE_USER':
			return {
				...state,
				user: state.user ? { ...state.user, ...action.payload, updatedAt: new Date() } : null,
			};

		case 'SET_LOADING':
			return {
				...state,
				isLoading: action.payload,
			};

		case 'SET_ERROR':
			return {
				...state,
				error: action.payload,
			};

		case 'UPDATE_LAST_ACTIVITY':
			return {
				...state,
				lastActivity: new Date(),
			};

		case 'SET_SESSION_TIMEOUT':
			return {
				...state,
				sessionTimeout: action.payload,
			};

		default:
			return state;
	}
};

// Mock API Service (replace with actual PingOne API calls)
class AuthService {
	static async login(credentials: LoginCredentials): Promise<{
		user: User;
		token: string;
		refreshToken: string;
	}> {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Mock user data
		const user: User = {
			id: '1',
			username: credentials.username,
			email: `${credentials.username}@example.com`,
			firstName: 'John',
			lastName: 'Doe',
			roles: ['admin', 'security-analyst'],
			permissions: ['read:risks', 'write:risks', 'read:users', 'manage:settings'],
			avatar: `https://ui-avatars.com/api/?name=${credentials.username}&background=random`,
			lastLogin: new Date(),
			createdAt: new Date('2023-01-01'),
			updatedAt: new Date(),
		};

		return {
			user,
			token: 'mock-jwt-token',
			refreshToken: 'mock-refresh-token',
		};
	}

	static async refreshToken(_refreshToken: string): Promise<{
		token: string;
		refreshToken: string;
	}> {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));

		return {
			token: 'mock-new-jwt-token',
			refreshToken: 'mock-new-refresh-token',
		};
	}

	static async validateToken(token: string): Promise<User | null> {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));

		// Mock validation
		if (token === 'mock-jwt-token' || token === 'mock-new-jwt-token') {
			return {
				id: '1',
				username: 'johndoe',
				email: 'johndoe@example.com',
				firstName: 'John',
				lastName: 'Doe',
				roles: ['admin', 'security-analyst'],
				permissions: ['read:risks', 'write:risks', 'read:users', 'manage:settings'],
				avatar: 'https://ui-avatars.com/api/?name=johndoe&background=random',
				lastLogin: new Date(),
				createdAt: new Date('2023-01-01'),
				updatedAt: new Date(),
			};
		}

		return null;
	}
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	// Load saved auth state on mount
	useEffect(() => {
		const loadAuthState = async () => {
			const savedToken = localStorage.getItem('protect-portal-token');
			const savedRefreshToken = localStorage.getItem('protect-portal-refresh-token');

			if (savedToken && savedRefreshToken) {
				try {
					dispatch({ type: 'SET_LOADING', payload: true });
					const user = await AuthService.validateToken(savedToken);

					if (user) {
						dispatch({
							type: 'LOGIN_SUCCESS',
							payload: { user, token: savedToken, refreshToken: savedRefreshToken },
						});
					} else {
						// Token invalid, clear storage
						localStorage.removeItem('protect-portal-token');
						localStorage.removeItem('protect-portal-refresh-token');
						dispatch({ type: 'LOGOUT' });
					}
				} catch (error) {
					console.error('Failed to validate saved token:', error);
					dispatch({ type: 'LOGOUT' });
				} finally {
					dispatch({ type: 'SET_LOADING', payload: false });
				}
			} else {
				// No saved token, set loading to false
				dispatch({ type: 'SET_LOADING', payload: false });
			}
		};

		loadAuthState();
	}, []);

	// Methods
	const logout = useCallback(() => {
		dispatch({ type: 'LOGOUT' });
		localStorage.removeItem('protect-portal-token');
		localStorage.removeItem('protect-portal-refresh-token');
		localStorage.removeItem('protect-portal-remember-me');
	}, []);

	// Auto-logout on session timeout
	useEffect(() => {
		if (!state.isAuthenticated) return;

		const checkSessionTimeout = () => {
			const now = new Date();
			const timeSinceLastActivity = now.getTime() - state.lastActivity.getTime();

			if (timeSinceLastActivity > state.sessionTimeout) {
				logout();
			}
		};

		const interval = setInterval(checkSessionTimeout, 60000); // Check every minute

		return () => clearInterval(interval);
	}, [state.isAuthenticated, state.lastActivity, state.sessionTimeout, logout]);

	// Update last activity on user interaction
	useEffect(() => {
		const updateActivity = () => {
			if (state.isAuthenticated) {
				dispatch({ type: 'UPDATE_LAST_ACTIVITY' });
			}
		};

		const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
		events.forEach((event) => {
			document.addEventListener(event, updateActivity);
		});

		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, updateActivity);
			});
		};
	}, [state.isAuthenticated]);

	// Methods
	const login = async (credentials: LoginCredentials) => {
		dispatch({ type: 'LOGIN_START' });

		try {
			const response = await AuthService.login(credentials);

			dispatch({
				type: 'LOGIN_SUCCESS',
				payload: response,
			});

			// Save to localStorage
			localStorage.setItem('protect-portal-token', response.token);
			localStorage.setItem('protect-portal-refresh-token', response.refreshToken);

			if (credentials.rememberMe) {
				localStorage.setItem('protect-portal-remember-me', 'true');
			}
		} catch (error) {
			dispatch({
				type: 'LOGIN_FAILURE',
				payload: error instanceof Error ? error.message : 'Login failed',
			});
		}
	};

	const refreshTokenAction = async () => {
		if (!state.refreshToken) return;

		dispatch({ type: 'REFRESH_TOKEN_START' });

		try {
			const response = await AuthService.refreshToken(state.refreshToken);

			dispatch({
				type: 'REFRESH_TOKEN_SUCCESS',
				payload: response,
			});

			// Update localStorage
			localStorage.setItem('protect-portal-token', response.token);
			localStorage.setItem('protect-portal-refresh-token', response.refreshToken);
		} catch (error) {
			dispatch({
				type: 'REFRESH_TOKEN_FAILURE',
				payload: error instanceof Error ? error.message : 'Token refresh failed',
			});
		}
	};

	const updateUser = (userUpdate: Partial<User>) => {
		dispatch({ type: 'UPDATE_USER', payload: userUpdate });
	};

	const checkAuthStatus = async () => {
		if (!state.token) return;

		try {
			dispatch({ type: 'SET_LOADING', payload: true });
			const user = await AuthService.validateToken(state.token);

			if (user) {
				dispatch({ type: 'UPDATE_USER', payload: user });
			} else {
				logout();
			}
		} catch (error) {
			console.error('Failed to check auth status:', error);
			logout();
		} finally {
			dispatch({ type: 'SET_LOADING', payload: false });
		}
	};

	const hasPermission = (permission: string): boolean => {
		return state.user?.permissions.includes(permission) || false;
	};

	const hasRole = (role: string): boolean => {
		return state.user?.roles.includes(role) || false;
	};

	const value: AuthContextType = {
		state,
		dispatch,
		login,
		logout,
		refreshToken: refreshTokenAction,
		updateUser,
		checkAuthStatus,
		isAuthenticated: state.isAuthenticated,
		hasPermission,
		hasRole,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
