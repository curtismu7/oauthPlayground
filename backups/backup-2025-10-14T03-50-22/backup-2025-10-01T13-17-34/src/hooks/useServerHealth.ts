import { useState, useEffect, useCallback } from 'react';

export interface ServerHealth {
	isOnline: boolean;
	isChecking: boolean;
	lastChecked: Date | null;
	error: string | null;
	retryCount: number;
}

export const useServerHealth = (checkInterval: number = 30000) => {
	const [health, setHealth] = useState<ServerHealth>({
		isOnline: false,
		isChecking: true,
		lastChecked: null,
		error: null,
		retryCount: 0,
	});

	const checkHealth = useCallback(async () => {
		setHealth((prev) => ({ ...prev, isChecking: true, error: null }));

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch('/api/health', {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				setHealth(() => ({
					isOnline: true,
					isChecking: false,
					lastChecked: new Date(),
					error: null,
					retryCount: 0,
				}));
			} else {
				setHealth((prev) => ({
					isOnline: false,
					isChecking: false,
					lastChecked: new Date(),
					error: `Server responded with status ${response.status}`,
					retryCount: prev.retryCount + 1,
				}));
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setHealth((prev) => ({
				isOnline: false,
				isChecking: false,
				lastChecked: new Date(),
				error: errorMessage,
				retryCount: prev.retryCount + 1,
			}));
		}
	}, []);

	// Initial check with delay to allow backend to start
	useEffect(() => {
		const timer = setTimeout(() => {
			checkHealth();
		}, 2000); // 2 second delay

		return () => clearTimeout(timer);
	}, [checkHealth]);

	// Periodic checks
	useEffect(() => {
		if (checkInterval > 0) {
			const interval = setInterval(() => {
				if (!health.isOnline) {
					checkHealth();
				}
			}, checkInterval);

			return () => clearInterval(interval);
		}

		return undefined;
	}, [checkHealth, checkInterval, health.isOnline]);

	return {
		...health,
		checkHealth,
	};
};

export default useServerHealth;
