import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';
import { environmentIdPersistenceService } from '../services/environmentIdPersistenceService';
import { v4ToastManager } from '../utils/v4ToastMessages';

import { logger } from '../../../utils/logger';
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
		logger.info('[EnvironmentIdPersistenceStatus] Updated status:', persistenceStatus);
		setStatus(persistenceStatus);
	}, []);

	const handleCopyEnvContent = () => {
		logger.info('[EnvironmentIdPersistenceStatus] Copy .env content clicked');
		const envContent = environmentIdPersistenceService.generateEnvContent();
		logger.info('[EnvironmentIdPersistenceStatus] Generated env content:', envContent);
		navigator.clipboard.writeText(envContent).then(() => {
			logger.info('[EnvironmentIdPersistenceStatus] Copied to clipboard');
			v4ToastManager.showSuccess('Environment content copied to clipboard!');
		});
	};

	const handleUpdateEnv = () => {
		logger.info('[EnvironmentIdPersistenceStatus] Update .env clicked');
		const envContent = environmentIdPersistenceService.generateEnvContentWithNewline();
		logger.info('[EnvironmentIdPersistenceStatus] Generated env content with newline:', envContent);
		navigator.clipboard.writeText(envContent).then(() => {
			logger.info('[EnvironmentIdPersistenceStatus] Copied to clipboard with newline');
			v4ToastManager.showSuccess(
				'Environment content copied! Paste into your .env file on a new line.'
			);
		});
	};

	const handleClearPersistence = () => {
		logger.info('[EnvironmentIdPersistenceStatus] Clear persistence clicked');
		environmentIdPersistenceService.clearEnvironmentId();
		logger.info('[EnvironmentIdPersistenceStatus] Cleared from localStorage');
		if (onRefresh) onRefresh();
	};

	if (!status) return null;

	return (
		<CollapsibleHeader
			title="Environment ID Persistence"
			icon={<span>ℹ️</span>}
			theme="blue"
			defaultCollapsed={true}
			variant="compact"
		>
			<StatusContent>
				<StatusItem>
					{status.hasStoredId ? (
						<span style={{ fontSize: 14, color: '#10b981' }}>✅</span>
					) : (
						<span style={{ fontSize: 14, color: '#f59e0b' }}>⚠️</span>
					)}
					<span>{status.hasStoredId ? 'Stored in localStorage' : 'Not stored locally'}</span>
				</StatusItem>

				<StatusItem>
					{status.hasEnvVar ? (
						<span style={{ fontSize: 14, color: '#10b981' }}>✅</span>
					) : (
						<span style={{ fontSize: 14, color: '#f59e0b' }}>⚠️</span>
					)}
					<span>{status.hasEnvVar ? 'Available in .env' : 'Not in .env file'}</span>
				</StatusItem>

				{status.lastUpdated && (
					<StatusItem>
						<span style={{ fontSize: '14px' }}>ℹ️</span>
						<span>Last updated: {new Date(status.lastUpdated).toLocaleString()}</span>
					</StatusItem>
				)}

				{status.source && (
					<StatusItem>
						<span style={{ fontSize: '14px' }}>ℹ️</span>
						<span>Source: {status.source.replace('_', ' ')}</span>
					</StatusItem>
				)}

				<div style={{ marginTop: '0.5rem' }}>
					<ActionButton onClick={() => setShowEnvContent(!showEnvContent)}>
						<span style={{ fontSize: '12px' }}>ℹ️</span>
						{showEnvContent ? 'Hide' : 'Show'} .env Content
					</ActionButton>

					<ActionButton onClick={handleCopyEnvContent}>
						<span style={{ fontSize: '12px' }}>💾</span>
						Copy .env Content
					</ActionButton>

					<ActionButton onClick={handleUpdateEnv}>
						<span style={{ fontSize: '12px' }}>✏️</span>
						Update .env
					</ActionButton>

					<ActionButton onClick={handleClearPersistence}>
						<span style={{ fontSize: '12px' }}>🔄</span>
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
