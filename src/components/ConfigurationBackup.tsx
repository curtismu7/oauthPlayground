// src/components/ConfigurationBackup.tsx
/**
 * Configuration Backup Component
 * Provides UI for exporting and importing flow configurations
 */

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import configurationBackupService, {
	FlowConfiguration,
} from '../services/configurationBackupService';

interface ConfigurationBackupProps {
	flowType: string;
	credentials: Record<string, unknown>;
	onImport: (credentials: Record<string, unknown>) => void;
	metadata?: {
		appName?: string;
		description?: string;
		notes?: string;
	};
}

const Container = styled.div`
	background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
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
	color: V9_COLORS.PRIMARY.BLUE;
	display: flex;
	align-items: center;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const Description = styled.p`
	margin: 0 0 1rem 0;
	font-size: 0.875rem;
	color: V9_COLORS.PRIMARY.BLUE;
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
	border: 1px solid ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : '#7dd3fc')};
	background: ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : 'white')};
	color: ${({ $variant }) => ($variant === 'primary' ? 'white' : '#3b82f6')};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : '#f8fafc')};
		border-color: ${({ $variant }) => ($variant === 'primary' ? '#3b82f6' : '#3b82f6')};
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
				return '#f8fafc';
		}
	}};
	border: 1px solid
		${({ $type }) => {
			switch ($type) {
				case 'success':
					return '#10b981';
				case 'error':
					return '#ef4444';
				case 'info':
					return '#e5e7eb';
			}
		}};
	color: ${({ $type }) => {
		switch ($type) {
			case 'success':
				return '#10b981';
			case 'error':
				return '#dc2626';
			case 'info':
				return '#2563eb';
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
	const [message, setMessage] = useState<{
		type: 'success' | 'error' | 'info';
		text: string;
	} | null>(null);
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
					<i className="bi bi-question-circle" style={{ fontSize: '20px' }}></i>
				</HeaderIcon>
				<Title>Configuration Backup</Title>
			</Header>

			<Description>
				Export your configuration to a JSON file for backup, or import a previously saved
				configuration. This includes all credentials and settings for this flow.
			</Description>

			<ButtonRow>
				<Button $variant="primary" onClick={handleExport} disabled={!hasCredentials}>
					<span style={{ fontSize: '16px' }}>📥</span>
					Export Configuration
				</Button>

				<Button $variant="secondary" onClick={handleImportClick} disabled={isImporting}>
					<span style={{ fontSize: '16px' }}>📤</span>
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
					{message.type === 'success' && <span style={{ fontSize: '16px' }}>✅</span>}
					{message.type === 'error' && <span style={{ fontSize: '16px' }}>⚠️</span>}
					{message.type === 'info' && <span style={{ fontSize: '16px' }}>⚠️</span>}
					{message.text}
				</Message>
			)}

			{!hasCredentials && (
				<Message $type="info">
					<span style={{ fontSize: '16px' }}>⚠️</span>
					Fill in your credentials above to enable configuration export.
				</Message>
			)}
		</Container>
	);
};

export default ConfigurationBackup;
