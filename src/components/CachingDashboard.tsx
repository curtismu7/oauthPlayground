import React, { useState } from 'react';
import styled from 'styled-components';
import { useServiceWorker } from '../hooks/useServiceWorker';

import { logger } from '../utils/logger';

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const DashboardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DashboardTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

const DashboardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, V9_COLORS.PRIMARY.GREEN 0%, V9_COLORS.PRIMARY.GREEN_DARK 100%);
  border-radius: 12px;
  color: white;
  font-size: 24px;
`;

const DashboardSubtitle = styled.p`
  margin: 0;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.6;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatusCard = styled.div<{ $status: 'active' | 'inactive' | 'error' }>`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatusLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusIcon = styled.div<{ $status: 'active' | 'inactive' | 'error' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $status }) => {
		switch ($status) {
			case 'active':
				return '#ecfdf5';
			case 'inactive':
				return '#f3f4f6';
			case 'error':
				return '#fef2f2';
		}
	}};
  color: ${({ $status }) => {
		switch ($status) {
			case 'active':
				return '#059669';
			case 'inactive':
				return '#6b7280';
			case 'error':
				return '#dc2626';
		}
	}};
  font-size: 16px;
`;

const StatusValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const StatusDescription = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.5;
`;

const CacheSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const CacheList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CacheItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const CacheInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CacheName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};
`;

const CacheSize = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const Actions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid ${({ variant, theme }) => {
		switch (variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return theme.colors.gray300;
		}
	}};
  background: ${({ variant, theme }) => {
		switch (variant) {
			case 'primary':
				return theme.colors.primary;
			case 'danger':
				return theme.colors.danger;
			default:
				return 'white';
		}
	}};
  color: ${({ variant }) => {
		switch (variant) {
			case 'primary':
			case 'danger':
				return 'white';
			default:
				return '#1f2937';
		}
	}};
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${({ variant, theme }) => {
			switch (variant) {
				case 'primary':
					return theme.colors.primaryDark;
				case 'danger':
					return '#dc2626';
				default:
					return theme.colors.gray100;
			}
		}};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Notification = styled.div<{ type: 'info' | 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border-left: 4px solid ${({ type }) => {
		switch (type) {
			case 'success':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
  min-width: 300px;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const NotificationIcon = styled.div<{ type: 'info' | 'success' | 'warning' | 'error' }>`
  color: ${({ type }) => {
		switch (type) {
			case 'success':
				return '#10b981';
			case 'warning':
				return '#f59e0b';
			case 'error':
				return '#ef4444';
			default:
				return '#3b82f6';
		}
	}};
  font-size: 18px;
`;

const NotificationMessage = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray900};
`;

// CachingDashboard component
export const CachingDashboard: React.FC = () => {
	const {
		isRegistered,
		isActive,
		cacheNames,
		cacheSize,
		updateAvailable,
		isLoading,
		error,
		register,
		unregister,
		update,
		skipWaiting,
		clearCaches,
		updateState,
		formatCacheSize,
		getCacheSizeFormatted,
	} = useServiceWorker({
		autoRegister: true,
		autoUpdate: false,
		onUpdateAvailable: () => {
			logger.info('[CachingDashboard] Service worker update available', "Logger info");
		},
		onUpdateInstalled: () => {
			logger.info('[CachingDashboard] Service worker update installed', "Logger info");
		},
	});

	const [notifications, setNotifications] = useState<
		{
			type: 'info' | 'success' | 'warning' | 'error';
			message: string;
			timestamp: number;
		}[]
	>([]);

	// Add notification
	const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
		const notification = {
			type,
			message,
			timestamp: Date.now(),
		};

		setNotifications((prev) => [...prev, notification]);

		// Auto-remove after 5 seconds
		setTimeout(() => {
			setNotifications((prev) => prev.filter((n) => n.timestamp !== notification.timestamp));
		}, 5000);
	};

	// Handle register
	const handleRegister = async () => {
		try {
			await register();
			addNotification('success', 'Service worker registered successfully');
		} catch (_error) {
			addNotification('error', 'Failed to register service worker');
		}
	};

	// Handle unregister
	const handleUnregister = async () => {
		try {
			await unregister();
			addNotification('success', 'Service worker unregistered successfully');
		} catch (_error) {
			addNotification('error', 'Failed to unregister service worker');
		}
	};

	// Handle update
	const handleUpdate = async () => {
		try {
			await update();
			addNotification('success', 'Service worker update triggered');
		} catch (_error) {
			addNotification('error', 'Failed to update service worker');
		}
	};

	// Handle skip waiting
	const handleSkipWaiting = async () => {
		try {
			await skipWaiting();
			addNotification('success', 'Service worker updated and activated');
		} catch (_error) {
			addNotification('error', 'Failed to activate new service worker');
		}
	};

	// Handle clear caches
	const handleClearCaches = async () => {
		try {
			await clearCaches();
			addNotification('success', 'All caches cleared successfully');
		} catch (_error) {
			addNotification('error', 'Failed to clear caches');
		}
	};

	// Handle refresh
	const handleRefresh = async () => {
		try {
			await updateState();
			addNotification('info', 'Cache status refreshed');
		} catch (_error) {
			addNotification('error', 'Failed to refresh cache status');
		}
	};

	// Get status for display
	const getStatus = (): 'active' | 'inactive' | 'error' => {
		if (error) return 'error';
		if (isActive) return 'active';
		return 'inactive';
	};

	return (
		<DashboardContainer>
			<DashboardHeader>
				<DashboardIcon>
					<span>🗄️</span>
				</DashboardIcon>
				<div>
					<DashboardTitle>Caching Dashboard</DashboardTitle>
					<DashboardSubtitle>
						Manage service worker, cache storage, and offline functionality
					</DashboardSubtitle>
				</div>
			</DashboardHeader>

			<StatusGrid>
				<StatusCard $status={getStatus()}>
					<StatusHeader>
						<StatusLabel>Service Worker</StatusLabel>
						<StatusIcon $status={getStatus()}>
							{isActive ? <span>✅</span> : <span>❌</span>}
						</StatusIcon>
					</StatusHeader>
					<StatusValue>{isActive ? 'Active' : 'Inactive'}</StatusValue>
					<StatusDescription>
						{isActive
							? 'Service worker is running and caching resources'
							: 'Service worker is not active'}
					</StatusDescription>
				</StatusCard>

				<StatusCard $status={cacheNames.length > 0 ? 'active' : 'inactive'}>
					<StatusHeader>
						<StatusLabel>Cache Storage</StatusLabel>
						<StatusIcon $status={cacheNames.length > 0 ? 'active' : 'inactive'}>
							<span>🗄️</span>
						</StatusIcon>
					</StatusHeader>
					<StatusValue>{cacheNames.length}</StatusValue>
					<StatusDescription>
						{cacheNames.length > 0 ? 'Caches are available for offline use' : 'No caches available'}
					</StatusDescription>
				</StatusCard>

				<StatusCard $status={cacheSize.totalSize > 0 ? 'active' : 'inactive'}>
					<StatusHeader>
						<StatusLabel>Cache Size</StatusLabel>
						<StatusIcon $status={cacheSize.totalSize > 0 ? 'active' : 'inactive'}>
							<span>📥</span>
						</StatusIcon>
					</StatusHeader>
					<StatusValue>{getCacheSizeFormatted()}</StatusValue>
					<StatusDescription>Total storage used by cached resources</StatusDescription>
				</StatusCard>

				<StatusCard $status={updateAvailable ? 'active' : 'inactive'}>
					<StatusHeader>
						<StatusLabel>Updates</StatusLabel>
						<StatusIcon $status={updateAvailable ? 'active' : 'inactive'}>
							<span>🔄</span>
						</StatusIcon>
					</StatusHeader>
					<StatusValue>{updateAvailable ? 'Available' : 'Up to Date'}</StatusValue>
					<StatusDescription>
						{updateAvailable
							? 'New service worker version available'
							: 'Service worker is up to date'}
					</StatusDescription>
				</StatusCard>
			</StatusGrid>

			{cacheNames.length > 0 && (
				<CacheSection>
					<SectionTitle>Cache Storage</SectionTitle>
					<CacheList>
						{cacheNames.map((cacheName) => (
							<CacheItem key={cacheName}>
								<CacheInfo>
									<CacheName>{cacheName}</CacheName>
									<CacheSize>{formatCacheSize(cacheSize.cacheSizes[cacheName] || 0)}</CacheSize>
								</CacheInfo>
							</CacheItem>
						))}
					</CacheList>
				</CacheSection>
			)}

			<Actions>
				<ActionButton
					variant="primary"
					onClick={handleRegister}
					disabled={isLoading || isRegistered}
				>
					<span>✅</span>
					Register Service Worker
				</ActionButton>

				<ActionButton
					variant="secondary"
					onClick={handleUnregister}
					disabled={isLoading || !isRegistered}
				>
					<span>❌</span>
					Unregister Service Worker
				</ActionButton>

				<ActionButton
					variant="secondary"
					onClick={handleUpdate}
					disabled={isLoading || !isRegistered}
				>
					<span>🔄</span>
					Check for Updates
				</ActionButton>

				{updateAvailable && (
					<ActionButton variant="primary" onClick={handleSkipWaiting} disabled={isLoading}>
						<span>🔄</span>
						Activate Update
					</ActionButton>
				)}

				<ActionButton
					variant="danger"
					onClick={handleClearCaches}
					disabled={isLoading || cacheNames.length === 0}
				>
					<span>🗑️</span>
					Clear All Caches
				</ActionButton>

				<ActionButton variant="secondary" onClick={handleRefresh} disabled={isLoading}>
					<span>🔄</span>
					Refresh Status
				</ActionButton>
			</Actions>

			{/* Notifications */}
			<NotificationContainer>
				{notifications.map((notification) => (
					<Notification key={notification.timestamp} type={notification.type}>
						<NotificationIcon type={notification.type}>
							{notification.type === 'success' && <span>✅</span>}
							{notification.type === 'error' && <span>❌</span>}
							{notification.type === 'warning' && <span>ℹ️</span>}
							{notification.type === 'info' && <span>ℹ️</span>}
						</NotificationIcon>
						<NotificationMessage>{notification.message}</NotificationMessage>
					</Notification>
				))}
			</NotificationContainer>
		</DashboardContainer>
	);
};

export default CachingDashboard;
