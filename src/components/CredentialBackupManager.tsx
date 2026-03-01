// src/components/CredentialBackupManager.tsx
// V7 Credential Backup Manager Component

import { FiDownload, FiInfo, FiRefreshCw, FiShield, FiTrash2 } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { credentialBackupService, type EnvBackupData } from '../services/credentialBackupService';
import { v4ToastManager } from '../utils/v4ToastMessages';
import ConfirmationModal from './ConfirmationModal';

const Container = styled.div`
	background: #ffffff;
	border-radius: 0.75rem;
	border: 1px solid #e5e7eb;
	padding: 1.5rem;
	margin: 1rem 0;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StatsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1rem;
	margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	text-align: center;
`;

const StatValue = styled.div`
	font-size: 1.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
`;

const ActionsContainer = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	margin-bottom: 1.5rem;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	border: 1px solid;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	${({ $variant = 'secondary' }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: #3b82f6;
					border-color: #3b82f6;
					color: white;
					&:hover {
						background: #2563eb;
						border-color: #2563eb;
					}
				`;
			case 'danger':
				return `
					background: #ef4444;
					border-color: #ef4444;
					color: white;
					&:hover {
						background: #dc2626;
						border-color: #dc2626;
					}
				`;
			default:
				return `
					background: #f9fafb;
					border-color: #d1d5db;
					color: #374151;
					&:hover {
						background: #f3f4f6;
						border-color: #9ca3af;
					}
				`;
		}
	}}
`;

const FlowsList = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
`;

const FlowItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	margin-bottom: 0.5rem;

	&:last-child {
		margin-bottom: 0;
	}
`;

const FlowName = styled.div`
	font-weight: 500;
	color: #1f2937;
`;

const FlowDetails = styled.div`
	font-size: 0.75rem;
	color: #6b7280;
	margin-top: 0.25rem;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.5rem;
	padding: 1rem;
	margin-top: 1rem;
`;

const InfoTitle = styled.div`
	font-weight: 600;
	color: #1e40af;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const InfoText = styled.div`
	font-size: 0.875rem;
	color: #1e40af;
	line-height: 1.5;
`;

interface CredentialBackupManagerProps {
	onRefresh?: () => void;
}

export const CredentialBackupManager: React.FC<CredentialBackupManagerProps> = ({ onRefresh }) => {
	const [backupData, setBackupData] = useState<EnvBackupData>({});
	const [isLoading, setIsLoading] = useState(false);
	const [showClearModal, setShowClearModal] = useState(false);

	const loadBackupData = useCallback(() => {
		setIsLoading(true);
		try {
			const data = credentialBackupService.getCredentialBackup();
			setBackupData(data);
		} catch (error) {
			console.error('Failed to load backup data:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadBackupData();
	}, [loadBackupData]);

	const handleDownloadEnv = () => {
		credentialBackupService.downloadEnvFile();
	};

	const handleClearAll = () => {
		setShowClearModal(true);
	};

	const confirmClearAll = () => {
		credentialBackupService.clearAllBackups();
		loadBackupData();
		onRefresh?.();
		v4ToastManager.showSuccess('All credential backups cleared successfully');
		console.log(
			`[${new Date().toISOString()}] [🧩 UI-NOTIFICATIONS] All credential backups cleared successfully in CredentialBackupManager`
		);
		setShowClearModal(false);
	};

	const handleRefresh = () => {
		loadBackupData();
		onRefresh?.();
	};

	const stats = credentialBackupService.getBackupStats();

	return (
		<Container>
			<Header>
				<Title>
					<FiShield size={20} />
					Credential Backup Manager
				</Title>
				<ActionButton onClick={handleRefresh} disabled={isLoading}>
					<FiRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
					Refresh
				</ActionButton>
			</Header>

			<StatsContainer>
				<StatCard>
					<StatValue>{stats.totalFlows}</StatValue>
					<StatLabel>Flows Backed Up</StatLabel>
				</StatCard>
				<StatCard>
					<StatValue>{Object.keys(backupData).length}</StatValue>
					<StatLabel>Active Backups</StatLabel>
				</StatCard>
				<StatCard>
					<StatValue>Non-Sensitive</StatValue>
					<StatLabel>Data Type</StatLabel>
				</StatCard>
			</StatsContainer>

			<ActionsContainer>
				<ActionButton $variant="primary" onClick={handleDownloadEnv}>
					<FiDownload size={16} />
					Download .env File
				</ActionButton>
				<ActionButton $variant="danger" onClick={handleClearAll}>
					<FiTrash2 size={16} />
					Clear All Backups
				</ActionButton>
			</ActionsContainer>

			{Object.keys(backupData).length > 0 && (
				<FlowsList>
					<h4
						style={{
							margin: '0 0 1rem 0',
							fontSize: '0.875rem',
							fontWeight: '600',
							color: '#374151',
						}}
					>
						Backed Up Flows
					</h4>
					{Object.entries(backupData).map(([flowKey, config]) => (
						<FlowItem key={flowKey}>
							<div>
								<FlowName>{flowKey}</FlowName>
								<FlowDetails>
									{config.environmentId && `Env: ${config.environmentId.substring(0, 8)}...`}
									{config.clientId && ` • Client: ${config.clientId.substring(0, 8)}...`}
									{config.scopes && ` • Scopes: ${config.scopes.length}`}
								</FlowDetails>
							</div>
						</FlowItem>
					))}
				</FlowsList>
			)}

			<InfoBox>
				<InfoTitle>
					<FiInfo size={16} />
					About Credential Backup
				</InfoTitle>
				<InfoText>
					This system automatically backs up non-sensitive credentials (environment ID, client ID,
					redirect URIs, scopes) to provide fallback when browser storage is cleared. Client secrets
					and worker tokens are never backed up for security. You can download a .env file with
					these configurations for easy restoration.
				</InfoText>
			</InfoBox>

			{/* Clear All Backups Confirmation Modal */}
			<ConfirmationModal
				isOpen={showClearModal}
				onClose={() => setShowClearModal(false)}
				onConfirm={confirmClearAll}
				title="Clear All Backups"
				message="Are you sure you want to clear all credential backups? This action cannot be undone."
				confirmText="Clear All"
				cancelText="Cancel"
				variant="danger"
			/>
		</Container>
	);
};

export default CredentialBackupManager;
