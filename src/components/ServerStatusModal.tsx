import { FiCheckCircle, FiGlobe, FiRefreshCw, FiServer, FiX, FiXCircle } from '@icons';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface ServerStatusModalProps {
	isOpen: boolean;
	onClose: () => void;
}

interface ServerStatus {
	name: string;
	url: string;
	status: 'checking' | 'online' | 'offline';
	responseTime?: number;
	error?: string;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  svg {
    font-size: 1.25rem;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
`;

const ServerCard = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  background: ${({ $status }) => {
		switch ($status) {
			case 'online':
				return '#f0fdf4';
			case 'offline':
				return '#fef2f2';
			case 'checking':
				return '#f9fafb';
			default:
				return '#f9fafb';
		}
	}};
  border: 2px solid ${({ $status }) => {
		switch ($status) {
			case 'online':
				return '#bbf7d0';
			case 'offline':
				return '#fecaca';
			case 'checking':
				return '#e5e7eb';
			default:
				return '#e5e7eb';
		}
	}};
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.2s;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ServerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ServerName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const StatusIndicator = styled.div<{ $status: 'checking' | 'online' | 'offline' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ $status }) => {
		switch ($status) {
			case 'online':
				return '#059669';
			case 'offline':
				return '#dc2626';
			case 'checking':
				return '#6b7280';
			default:
				return '#6b7280';
		}
	}};
`;

const ServerDetails = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const FooterButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  ${({ $variant = 'secondary' }) =>
		$variant === 'primary'
			? `
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  `
			: `
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;

    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const ServerStatusModal: React.FC<ServerStatusModalProps> = ({ isOpen, onClose }) => {
	const [servers, setServers] = useState<ServerStatus[]>([
		{
			name: 'Frontend Server',
			url: window.location.origin,
			status: 'checking',
		},
		{
			name: 'Backend Server',
			url: '/api/health',
			status: 'checking',
		},
	]);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const checkServerStatus = async (server: ServerStatus): Promise<ServerStatus> => {
		try {
			const startTime = Date.now();

			// Different headers for frontend vs backend
			const headers: HeadersInit =
				server.name === 'Frontend Server'
					? {
							Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						}
					: {
							Accept: 'application/json',
						};

			const response = await fetch(server.url, {
				method: 'GET',
				mode: 'cors',
				headers,
				signal: AbortSignal.timeout(5000), // 5 second timeout
			});
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			if (response.ok) {
				return {
					...server,
					status: 'online',
					responseTime,
				};
			} else {
				return {
					...server,
					status: 'offline',
					error: `HTTP ${response.status}: ${response.statusText}`,
				};
			}
		} catch (error) {
			return {
				...server,
				status: 'offline',
				error: error instanceof Error ? error.message : 'Connection failed',
			};
		}
	};

	const refreshAllServers = async () => {
		setIsRefreshing(true);
		try {
			const updatedServers = await Promise.all(servers.map((server) => checkServerStatus(server)));
			setServers(updatedServers);
		} catch (error) {
			console.error('Error refreshing servers:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		if (isOpen) {
			refreshAllServers();
		}
	}, [isOpen, refreshAllServers]);

	if (!isOpen) return null;

	const getStatusIcon = (status: 'checking' | 'online' | 'offline') => {
		switch (status) {
			case 'online':
				return <FiCheckCircle size={20} color="#059669" />;
			case 'offline':
				return <FiXCircle size={20} color="#dc2626" />;
			case 'checking':
				return <FiRefreshCw size={20} color="#6b7280" className="animate-spin" />;
			default:
				return <FiXCircle size={20} color="#dc2626" />;
		}
	};

	const getStatusText = (status: 'checking' | 'online' | 'offline') => {
		switch (status) {
			case 'online':
				return 'Online';
			case 'offline':
				return 'Offline';
			case 'checking':
				return 'Checking...';
			default:
				return 'Unknown';
		}
	};

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<ModalTitle>
						<FiServer size={24} />
						Server Status
					</ModalTitle>
					<CloseButton onClick={onClose}>
						<FiX />
					</CloseButton>
				</ModalHeader>

				<ModalBody>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '1rem',
						}}
					>
						<p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
							Check the status of frontend and backend servers
						</p>
						<RefreshButton onClick={refreshAllServers} disabled={isRefreshing}>
							<FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
							{isRefreshing ? 'Refreshing...' : 'Refresh'}
						</RefreshButton>
					</div>

					{servers.map((server, index) => (
						<ServerCard key={index} $status={server.status}>
							<ServerHeader>
								<ServerName>
									{server.name === 'Frontend Server' ? (
										<FiGlobe size={20} />
									) : (
										<FiServer size={20} />
									)}
									{server.name}
								</ServerName>
								<StatusIndicator $status={server.status}>
									{getStatusIcon(server.status)}
									{getStatusText(server.status)}
								</StatusIndicator>
							</ServerHeader>

							<ServerDetails>
								<div>
									<strong>URL:</strong> {server.url}
								</div>
								{server.responseTime && (
									<div>
										<strong>Response Time:</strong> {server.responseTime}ms
									</div>
								)}
								{server.error && (
									<div style={{ color: '#dc2626', marginTop: '0.5rem' }}>
										<strong>Error:</strong> {server.error}
									</div>
								)}
								{server.status === 'online' && (
									<div style={{ color: '#059669', marginTop: '0.5rem' }}>
										<strong>Status:</strong> Server is responding normally
									</div>
								)}
							</ServerDetails>
						</ServerCard>
					))}
				</ModalBody>

				<ModalFooter>
					<FooterButton $variant="secondary" onClick={onClose}>
						Close
					</FooterButton>
					<FooterButton $variant="primary" onClick={onClose}>
						OK
					</FooterButton>
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};

export default ServerStatusModal;
