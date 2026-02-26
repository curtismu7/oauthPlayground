/**
 * Shared server health check for Dashboard and API Status page.
 * Single place for backend health URL and simple status check so we don't duplicate logic.
 * See docs/DASHBOARD_UPDATES.md.
 */

export type ServerStatusValue = 'online' | 'offline' | 'checking';

export interface SimpleServerStatus {
	frontend: ServerStatusValue;
	backend: ServerStatusValue;
}

/** Backend health URL: use VITE_BACKEND_URL when set (e.g. production without proxy), else relative. */
export function getBackendHealthUrl(): string {
	const base = import.meta.env.VITE_BACKEND_URL;
	if (base) {
		const normalized = (base as string).replace(/\/$/, '');
		return `${normalized}/api/health`;
	}
	return '/api/health';
}

/** Simple check used by Dashboard: frontend is online if we're in the app; backend from /api/health. */
export async function checkServerStatusForDashboard(): Promise<SimpleServerStatus> {
	const result: SimpleServerStatus = {
		frontend: 'online',
		backend: 'checking',
	};
	try {
		const url = getBackendHealthUrl();
		const response = await fetch(url, {
			method: 'GET',
			mode: 'cors',
			signal: AbortSignal.timeout(3000),
		});
		result.backend = response.ok ? 'online' : 'offline';
	} catch {
		result.backend = 'offline';
	}
	return result;
}
