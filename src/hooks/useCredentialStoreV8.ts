import { useEffect, useState } from 'react';
import {
	getActiveAppConfig,
	getCredentialStoreState,
	getValidWorkerToken,
	loadStateFromStorage,
	removeAppConfig,
	saveWorkerToken,
	setSelectedAppId,
	upsertAppConfig,
} from '../services/credentialStoreV8';
import type {
	V8AppConfig,
	V8CredentialStoreState,
	V8WorkerToken,
} from '../types/credentialStoreV8';

export function useCredentialStoreV8() {
	const [state, setState] = useState<V8CredentialStoreState>(() => loadStateFromStorage());

	useEffect(() => {
		const id = setInterval(() => {
			setState({ ...getCredentialStoreState() });
		}, 1000);
		return () => clearInterval(id);
	}, []);

	return {
		apps: state.apps,
		selectedAppId: state.selectedAppId,
		workerTokens: state.workerTokens,

		selectApp: (appId?: string) => {
			setSelectedAppId(appId);
			setState({ ...getCredentialStoreState() });
		},

		addOrUpdateApp: (app: V8AppConfig) => {
			upsertAppConfig(app);
			setState({ ...getCredentialStoreState() });
		},

		deleteApp: (appId: string) => {
			removeAppConfig(appId);
			setState({ ...getCredentialStoreState() });
		},

		getActiveAppConfig: () => getActiveAppConfig(),

		getValidWorkerToken: (envId: string, now?: number) => getValidWorkerToken(envId, now),

		saveWorkerToken: (token: V8WorkerToken) => {
			saveWorkerToken(token);
			setState({ ...getCredentialStoreState() });
		},
	};
}
