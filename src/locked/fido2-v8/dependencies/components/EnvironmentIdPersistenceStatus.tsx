import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiCheckCircle, FiEdit, FiInfo, FiRefreshCw, FiSave } from 'react-icons/fi';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { environmentIdPersistenceService } from '../services/environmentIdPersistenceService';
import { v4ToastManager } from '../utils/v4ToastMessages';

const StatusContent = styled.div`
  color: #075985;
  line-height: 1.4;
`;

const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
`;

const ActionButton = styled.button`
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;

  &:hover {
    background: #0284c7;
  }
`;

const _CopyButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: 0.5rem;

  &:hover {
    background: #059669;
  }
`;

interface EnvironmentIdPersistenceStatusProps {
	environmentId: string;
	onRefresh?: () => void;
}

export const EnvironmentIdPersistenceStatus: React.FC<EnvironmentIdPersistenceStatusProps> = ({
	environmentId,
	onRefresh,
}) => {
	const [status, setStatus] = useState<any>(null);
	const [showEnvContent, setShowEnvContent] = useState(false);

	useEffect(() => {
		const persistenceStatus = environmentIdPersistenceService.getPersistenceStatus();
		console.log('[EnvironmentIdPersistenceStatus] Updated status:', persistenceStatus);
		setStatus(persistenceStatus);
	}, []);

	const handleCopyEnvContent = () => {
		console.log('[EnvironmentIdPersistenceStatus] Copy .env content clicked');
		const envContent = environmentIdPersistenceService.generateEnvContent();
		console.log('[EnvironmentIdPersistenceStatus] Generated env content:', envContent);
		navigator.clipboard.writeText(envContent).then(() => {
			console.log('[EnvironmentIdPersistenceStatus] Copied to clipboard');
			v4ToastManager.showSuccess('Environment content copied to clipboard!');
		});
	};

	const handleUpdateEnv = () => {
		console.log('[EnvironmentIdPersistenceStatus] Update .env clicked');
		const envContent = environmentIdPersistenceService.generateEnvContentWithNewline();
		console.log('[EnvironmentIdPersistenceStatus] Generated env content with newline:', envContent);
		navigator.clipboard.writeText(envContent).then(() => {
			console.log('[EnvironmentIdPersistenceStatus] Copied to clipboard with newline');
			v4ToastManager.showSuccess(
				'Environment content copied! Paste into your .env file on a new line.'
			);
		});
	};

	const handleClearPersistence = () => {
		console.log('[EnvironmentIdPersistenceStatus] Clear persistence clicked');
		environmentIdPersistenceService.clearEnvironmentId();
		console.log('[EnvironmentIdPersistenceStatus] Cleared from localStorage');
		if (onRefresh) onRefresh();
	};

	if (!status) return null;

	return (
		<CollapsibleHeader
			title="Environment ID Persistence"
			icon={<FiInfo />}
			theme="blue"
			defaultCollapsed={true}
			variant="compact"
		>
			<StatusContent>
				<StatusItem>
					{status.hasStoredId ? (
						<FiCheckCircle size={14} color="#10b981" />
					) : (
						<FiAlertCircle size={14} color="#f59e0b" />
					)}
					<span>{status.hasStoredId ? 'Stored in localStorage' : 'Not stored locally'}</span>
				</StatusItem>

				<StatusItem>
					{status.hasEnvVar ? (
						<FiCheckCircle size={14} color="#10b981" />
					) : (
						<FiAlertCircle size={14} color="#f59e0b" />
					)}
					<span>{status.hasEnvVar ? 'Available in .env' : 'Not in .env file'}</span>
				</StatusItem>

				{status.lastUpdated && (
					<StatusItem>
						<FiInfo size={14} />
						<span>Last updated: {new Date(status.lastUpdated).toLocaleString()}</span>
					</StatusItem>
				)}

				{status.source && (
					<StatusItem>
						<FiInfo size={14} />
						<span>Source: {status.source.replace('_', ' ')}</span>
					</StatusItem>
				)}

				<div style={{ marginTop: '0.5rem' }}>
					<ActionButton onClick={() => setShowEnvContent(!showEnvContent)}>
						<FiInfo size={12} />
						{showEnvContent ? 'Hide' : 'Show'} .env Content
					</ActionButton>

					<ActionButton onClick={handleCopyEnvContent}>
						<FiSave size={12} />
						Copy .env Content
					</ActionButton>

					<ActionButton onClick={handleUpdateEnv}>
						<FiEdit size={12} />
						Update .env
					</ActionButton>

					<ActionButton onClick={handleClearPersistence}>
						<FiRefreshCw size={12} />
						Clear Storage
					</ActionButton>
				</div>

				{showEnvContent && (
					<div
						style={{
							marginTop: '0.75rem',
							background: '#1e293b',
							color: '#f1f5f9',
							padding: '0.75rem',
							borderRadius: '0.25rem',
							fontFamily: 'monospace',
							fontSize: '0.75rem',
							whiteSpace: 'pre-wrap',
						}}
					>
						{environmentIdPersistenceService.generateEnvContent()}
					</div>
				)}
			</StatusContent>
		</CollapsibleHeader>
	);
};
