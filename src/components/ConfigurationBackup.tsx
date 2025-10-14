// src/components/ConfigurationBackup.tsx
/**
 * Configuration Backup Component
 * Provides UI for exporting and importing flow configurations
 */

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { FiDownload, FiUpload, FiAlertCircle, FiCheckCircle, FiFile } from 'react-icons/fi';
import configurationBackupService, { FlowConfiguration } from '../services/configurationBackupService';

interface ConfigurationBackupProps {
	flowType: string;
	credentials: Record<string, any>;
	onImport: (credentials: Record<string, any>) => void;
	metadata?: {
		appName?: string;
		description?: string;
		notes?: string;
	};
}

const Container = styled.div`
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: 1px solid #bae6fd;
	border-radius: 0.75rem;
	padding: 1.25rem;
	margin: 1rem 0;
`;

const Header = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const HeaderIcon = styled.div`
	color: #0284c7;
	display: flex;
	align-items: center;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #0c4a6e;
`;

const Description = styled.p`
	margin: 0 0 1rem 0;
	font-size: 0.875rem;
	color: #0369a1;
	line-height: 1.5;
`;

const ButtonRow = styled.div`
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.625rem 1rem;
	border-radius: 0.5rem;
	border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#0284c7' : '#7dd3fc')};
	background: ${({ $variant }) => ($variant === 'primary' ? '#0284c7' : 'white')};
	color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#0369a1')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => ($variant === 'primary' ? '#0369a1' : '#f0f9ff')};
		border-color: ${({ $variant }) => ($variant === 'primary' ? '#0369a1' : '#0284c7')};
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const HiddenInput = styled.input`
	display: none;
`;

const Message = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem;
	margin-top: 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	background: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#f0fdf4';
			case 'error':
				return '#fef2f2';
			case 'info':
				return '#eff6ff';
		}
	}};
	border: 1px solid ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#bbf7d0';
			case 'error':
				return '#fecaca';
			case 'info':
				return '#bfdbfe';
		}
	}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#166534';
			case 'error':
				return '#991b1b';
			case 'info':
				return '#1e40af';
		}
	}};
`;

export const ConfigurationBackup: React.FC<ConfigurationBackupProps> = ({
	flowType,
	credentials,
	onImport,
	metadata,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
	const [isImporting, setIsImporting] = useState(false);

	const handleExport = () => {
		try {
			configurationBackupService.exportConfiguration(flowType, credentials, metadata);
			setMessage({
				type: 'success',
				text: `Configuration exported successfully! Check your downloads folder.`,
			});
			setTimeout(() => setMessage(null), 5000);
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Failed to export configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		setIsImporting(true);
		setMessage(null);

		try {
			const config: FlowConfiguration = await configurationBackupService.importConfiguration(file);

			// Validate configuration
			const validation = configurationBackupService.validateConfiguration(config);
			if (!validation.valid) {
				throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
			}

			// Check if flow type matches
			if (config.flowType !== flowType) {
				setMessage({
					type: 'info',
					text: `Note: This configuration is from "${config.flowType}" but you're importing it into "${flowType}". Some fields may not apply.`,
				});
			}

			// Import credentials
			onImport(config.credentials);

			setMessage({
				type: 'success',
				text: `Configuration imported successfully! ${Object.keys(config.credentials).length} fields loaded.`,
			});

			setTimeout(() => setMessage(null), 5000);
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		} finally {
			setIsImporting(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const hasCredentials = Object.keys(credentials).some((key) => credentials[key]);

	return (
		<Container>
			<Header>
				<HeaderIcon>
					<FiFile size={20} />
				</HeaderIcon>
				<Title>Configuration Backup</Title>
			</Header>

			<Description>
				Export your configuration to a JSON file for backup, or import a previously saved configuration.
				This includes all credentials and settings for this flow.
			</Description>

			<ButtonRow>
				<Button $variant="primary" onClick={handleExport} disabled={!hasCredentials}>
					<FiDownload size={16} />
					Export Configuration
				</Button>

				<Button $variant="secondary" onClick={handleImportClick} disabled={isImporting}>
					<FiUpload size={16} />
					{isImporting ? 'Importing...' : 'Import Configuration'}
				</Button>

				<HiddenInput
					ref={fileInputRef}
					type="file"
					accept=".json,application/json"
					onChange={handleFileChange}
				/>
			</ButtonRow>

			{message && (
				<Message $type={message.type}>
					{message.type === 'success' && <FiCheckCircle size={16} />}
					{message.type === 'error' && <FiAlertCircle size={16} />}
					{message.type === 'info' && <FiAlertCircle size={16} />}
					{message.text}
				</Message>
			)}

			{!hasCredentials && (
				<Message $type="info">
					<FiAlertCircle size={16} />
					Fill in your credentials above to enable configuration export.
				</Message>
			)}
		</Container>
	);
};

export default ConfigurationBackup;
