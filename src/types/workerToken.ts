// Worker Token flow type definitions

export interface WorkerTokenFlowState {
	config: {
		environmentId: string;
		tokenEndpoint: string;
		introspectionEndpoint: string;
		clientId: string;
		clientSecret: string;
		scopes: string[];
	};
	tokens?: WorkerTokenResponse | null;
	introspection?: TokenIntrospectionResponse | null;
	workerApp?: WorkerApp | null;
	environment?: Environment | null;
	apiAccess?: ApiAccessTest | null;
	lastRequestTime?: number;
}

export interface WorkerTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope?: string;
	issued_at?: number;
}

export interface TokenIntrospectionResponse {
	active: boolean;
	scope?: string;
	clientId?: string;
	exp?: number;
	iat?: number;
	sub?: string;
	aud?: string;
	iss?: string;
	token_type?: string;
	username?: string;
}

export interface WorkerApp {
	id: string;
	name: string;
	description?: string;
	enabled: boolean;
	type: string;
	scopes: string[];
	redirect_uris: string[];
	client_id?: string;
	created_at?: string;
	updated_at?: string;
}

export interface Environment {
	id: string;
	name: string;
	description?: string;
	region: string;
	license: {
		name: string;
		status: string;
	};
	services: string[];
	created_at?: string;
	updated_at?: string;
}

export interface ApiAccessTest {
	success: boolean;
	accessibleEndpoints: string[];
	errors: string[];
	testedAt: number;
}

export interface WorkerTokenStep {
	id: string;
	title: string;
	description: string;
	category: 'preparation' | 'token-exchange' | 'validation' | 'cleanup';
	canExecute: boolean;
	completed: boolean;
	execute: () => Promise<{ success: boolean; data?: any }>;
}

export interface WorkerTokenCredentials {
	clientId: string;
	clientSecret: string;
	environmentId: string;
	scopes: string[];
	tokenEndpoint?: string;
	introspectionEndpoint?: string;
}

export interface WorkerTokenConfig {
	defaultScopes: string[];
	tokenCacheTtlPercent: number;
	introspectionEnabled: boolean;
	managementApiEnabled: boolean;
	autoDiscovery: boolean;
	region: string;
}

export interface CachedWorkerToken {
	token: WorkerTokenResponse;
	issuedAt: number;
	expiresAt: number;
	cacheKey: string;
	scopes: string[];
	clientId: string;
}

export interface JWTPayload {
	iss?: string;
	sub?: string;
	aud?: string | string[];
	exp?: number;
	iat?: number;
	nbf?: number;
	jti?: string;
	scope?: string;
	client_id?: string;
	token_type?: string;
	[key: string]: any;
}

export interface ApiEndpoint {
	path: string;
	method: string;
	description: string;
	requiredScope: string;
	parameters?: Record<string, any>;
}

export interface ApiResponse {
	success: boolean;
	data?: any;
	error?: string;
	statusCode?: number;
	responseTime?: number;
}

export interface WorkerTokenError extends Error {
	code?: string;
	statusCode?: number;
	details?: any;
}

export interface TokenValidationResult {
	isValid: boolean;
	isExpired: boolean;
	timeToExpiry?: number;
	payload?: JWTPayload;
	error?: string;
}

export interface ScopeValidationResult {
	requested: string[];
	granted: string[];
	denied: string[];
	isValid: boolean;
	errors: string[];
}

export interface WorkerTokenMetrics {
	tokensRequested: number;
	tokensCached: number;
	tokensRefreshed: number;
	apiCalls: number;
	errors: number;
	lastActivity?: number;
}

export interface WorkerTokenFlowProps {
	onComplete?: (tokens: WorkerTokenResponse) => void;
	onError?: (error: WorkerTokenError) => void;
	initialCredentials?: Partial<WorkerTokenCredentials>;
	autoStart?: boolean;
	showApiExplorer?: boolean;
}

export interface SecureInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	label?: string;
	error?: string;
	disabled?: boolean;
	autoComplete?: string;
}

export interface TokenDisplayProps {
	token: WorkerTokenResponse;
	introspection?: TokenIntrospectionResponse;
	showIntrospection?: boolean;
	showJWTDecode?: boolean;
	onRefresh?: () => void;
	onCopy?: (token: string) => void;
}

export interface ApiExplorerProps {
	token: string;
	environmentId: string;
	onApiCall?: (endpoint: string, response: ApiResponse) => void;
	availableEndpoints?: ApiEndpoint[];
}

export interface WorkerCredentialsFormProps {
	credentials: WorkerTokenCredentials;
	onChange: (credentials: WorkerTokenCredentials) => void;
	onValidate?: (isValid: boolean, errors: string[]) => void;
	showAdvanced?: boolean;
	autoDiscover?: boolean;
}

export interface WorkerTokenStatusProps {
	token?: WorkerTokenResponse | null;
	introspection?: TokenIntrospectionResponse | null;
	workerApp?: WorkerApp | null;
	environment?: Environment | null;
	onRefresh?: () => void;
	onClear?: () => void;
	showDetails?: boolean;
}

export interface WorkerTokenConfigProps {
	config: WorkerTokenConfig;
	onChange: (config: WorkerTokenConfig) => void;
	availableScopes?: string[];
	regions?: string[];
}

export interface WorkerTokenHistoryProps {
	tokens: CachedWorkerToken[];
	onSelectToken?: (token: CachedWorkerToken) => void;
	onClearHistory?: () => void;
	maxHistory?: number;
}

export interface WorkerTokenDebugProps {
	flowState: WorkerTokenFlowState;
	metrics: WorkerTokenMetrics;
	onClearDebug?: () => void;
	showRawData?: boolean;
}

// Utility types for form handling
export type WorkerTokenFormField =
	| 'client_id'
	| 'client_secret'
	| 'environment_id'
	| 'scopes'
	| 'token_endpoint'
	| 'introspection_endpoint';

export type WorkerTokenStepId =
	| 'configure'
	| 'request-token'
	| 'validate-token'
	| 'test-api'
	| 'complete';

export type WorkerTokenCategory = 'preparation' | 'token-exchange' | 'validation' | 'cleanup';

export type WorkerTokenErrorCode =
	| 'INVALID_CREDENTIALS'
	| 'INVALID_SCOPE'
	| 'TOKEN_REQUEST_FAILED'
	| 'INTROSPECTION_FAILED'
	| 'API_ACCESS_DENIED'
	| 'NETWORK_ERROR'
	| 'CONFIGURATION_ERROR';

// Constants
export const DEFAULT_WORKER_SCOPES = [
	'p1:read:user',
	'p1:update:user',
	'p1:read:device',
	'p1:update:device',
];

export const SUPPORTED_REGIONS = ['NA', 'EU', 'CA', 'AP'];

export const COMMON_API_ENDPOINTS: ApiEndpoint[] = [
	{
		path: '/users',
		method: 'GET',
		description: 'List users',
		requiredScope: 'p1:read:users',
	},
	{
		path: '/applications',
		method: 'GET',
		description: 'List applications',
		requiredScope: 'p1:read:applications',
	},
	{
		path: '/userGroups',
		method: 'GET',
		description: 'List user groups',
		requiredScope: 'p1:read:groups',
	},
	{
		path: '',
		method: 'GET',
		description: 'Environment info',
		requiredScope: 'p1:read:environments',
	},
];

export const WORKER_TOKEN_STORAGE_KEYS = {
	CREDENTIALS: 'worker_credentials',
	TOKENS: 'worker_tokens',
	CACHE: 'worker_token_cache',
	CONFIG: 'worker_token_config',
	METRICS: 'worker_token_metrics',
} as const;
