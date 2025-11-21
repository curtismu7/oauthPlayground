import type {
	V8AppConfig,
	V8CredentialStoreState,
	V8WorkerToken,
} from '../types/credentialStoreV8';

const STORAGE_KEY = 'p1-v8-credential-store';

let memoryState: V8CredentialStoreState = {
	apps: [],
	workerTokens: [],
};

export function loadStateFromStorage(): V8CredentialStoreState {
	if (typeof window === 'undefined') return memoryState;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return memoryState;
		const parsed = JSON.parse(raw) as V8CredentialStoreState;
		memoryState = parsed;
		return memoryState;
	} catch {
		return memoryState;
	}
}

function persistState() {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
}

export function getCredentialStoreState(): V8CredentialStoreState {
	return memoryState;
}

export function setSelectedAppId(appId?: string) {
	memoryState.selectedAppId = appId;
	persistState();
}

export function upsertAppConfig(app: V8AppConfig) {
	const idx = memoryState.apps.findIndex((a) => a.appId === app.appId);
	if (idx === -1) {
		memoryState.apps.push(app);
	} else {
		memoryState.apps[idx] = app;
	}
	persistState();
}

export function removeAppConfig(appId: string) {
	memoryState.apps = memoryState.apps.filter((a) => a.appId !== appId);
	if (memoryState.selectedAppId === appId) {
		memoryState.selectedAppId = undefined;
	}
	persistState();
}

export function getActiveAppConfig(): V8AppConfig | undefined {
	if (!memoryState.selectedAppId) return undefined;
	return memoryState.apps.find((a) => a.appId === memoryState.selectedAppId);
}

export function saveWorkerToken(token: V8WorkerToken) {
	// replace any existing token for this env
	memoryState.workerTokens = [
		...memoryState.workerTokens.filter((t) => t.environmentId !== token.environmentId),
		token,
	];
	persistState();
}

export function getValidWorkerToken(envId: string, now = Date.now()): V8WorkerToken | undefined {
	const token = memoryState.workerTokens.find((t) => t.environmentId === envId);
	if (!token) return undefined;
	if (token.expiresAt <= now) return undefined;
	return token;
}
