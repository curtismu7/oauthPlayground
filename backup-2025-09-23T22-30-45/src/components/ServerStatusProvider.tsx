import React, { createContext, useContext, ReactNode } from 'react';
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
  showHealthCheck = true 
}) => {
  const serverHealth = useServerHealth(30000); // Check every 30 seconds

  return (
    <ServerStatusContext.Provider value={serverHealth}>
      {children}
      {showHealthCheck && !serverHealth.isOnline && (
        <ServerHealthCheck />
      )}
    </ServerStatusContext.Provider>
  );
};

export default ServerStatusProvider;
