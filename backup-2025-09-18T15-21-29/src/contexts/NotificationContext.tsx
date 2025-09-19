 
import React, { createContext, useContext, ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notify: (message: string, type?: NotificationType, duration?: number) => void;
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message: string, type: NotificationType = 'info', duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notify, notifications, removeNotification }}>
      {children}
      <NotificationContainer>
        {notifications.map(notification => (
          <NotificationItem 
            key={notification.id} 
            type={notification.type}
            onClick={() => removeNotification(notification.id)}
          >
            {notification.message}
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Styled components
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
`;

const NotificationItem = styled.div<{ type: NotificationType }>`
  padding: 1rem;
  border-radius: 4px;
  color: white;
  background-color: ${({ type, theme }) => {
    switch (type) {
      case 'success': return theme.colors.success || '#10b981';
      case 'error': return theme.colors.danger || '#ef4444';
      case 'warning': return theme.colors.warning || '#f59e0b';
      case 'info':
      default:
        return theme.colors.primary || '#3b82f6';
    }
  }};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: ${slideIn} 0.3s ease-out forwards;
  cursor: pointer;
  transition: opacity 0.2s ease-out;
  
  &:hover {
    opacity: 0.9;
  }
  
  &.exiting {
    animation: ${fadeOut} 0.3s ease-out forwards;
  }
`;
