import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useServerHealth } from '../hooks/useServerHealth';
import ServerHealthCheck from './ServerHealthCheck';

interface ServerStatusContextType {
	isOnline: boolean;
	isChecking: boolean;
	lastChecked: Date | null;
	error: string | null;
	retryCount: number;
	checkHealth: () => void;
}

const ServerStatusContext = createContext<ServerStatusContextType | undefined>(undefined);

export const useServerStatus = () => {
	const context = useContext(ServerStatusContext);
	if (context === undefined) {
		throw new Error('useServerStatus must be used within a ServerStatusProvider');
	}
	return context;
};

interface ServerStatusProviderProps {
	children: ReactNode;
	showHealthCheck?: boolean;
}

export const ServerStatusProvider: React.FC<ServerStatusProviderProps> = ({
	children,
	showHealthCheck = true,
}) => {
	const serverHealth = useServerHealth(showHealthCheck ? 30000 : 0); // Check every 30 seconds when enabled
	const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);

	useEffect(() => {
		if (!hasCompletedInitialCheck && !serverHealth.isChecking) {
			setHasCompletedInitialCheck(true);
		}
	}, [hasCompletedInitialCheck, serverHealth.isChecking]);

	const shouldDisplay = useMemo(() => {
		if (!showHealthCheck) {
			return false;
		}

		if (!hasCompletedInitialCheck) {
			return true; // Only show during startup until a result is received
		}

		return !serverHealth.isOnline || !!serverHealth.error;
	}, [showHealthCheck, hasCompletedInitialCheck, serverHealth.isOnline, serverHealth.error]);

	return (
		<ServerStatusContext.Provider value={serverHealth}>
			{children}
			{shouldDisplay && <ServerHealthCheck />}
		</ServerStatusContext.Provider>
	);
};

export default ServerStatusProvider;
