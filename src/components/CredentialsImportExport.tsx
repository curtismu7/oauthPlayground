// src/components/CredentialsImportExport.tsx
/**
 * Standardized Credentials Import/Export Component
 * Provides consistent UI for credential import/export across all flows
 * @version 9.0.0
 * @since 2026-03-06
 */

import React, { useRef } from 'react';
import {
	credentialsImportExportService,
	type ImportExportOptions,
} from '@/services/credentialsImportExportService';

export interface CredentialsImportExportProps {
	credentials: Record<string, unknown>;
	options: ImportExportOptions;
	style?: React.CSSProperties;
	className?: string;
	showLabels?: boolean;
	buttonStyle?: React.CSSProperties;
	compact?: boolean;
}

/**
 * Standardized credentials import/export component
 *
 * Usage:
 * ```tsx
 * <CredentialsImportExport
 *   credentials={credentials}
 *   options={{
 *     flowType: 'oauth-authorization-code',
 *     appName: 'OAuth Authorization Code Flow',
 *     onImportSuccess: (creds) => setCredentials(creds),
 *     onImportError: (error) => log.error(error),
 *   }}
 * />
 * ```
 */
export const CredentialsImportExport: React.FC<CredentialsImportExportProps> = ({
	credentials,
	options,
	style,
	className,
	showLabels = true,
	buttonStyle,
	compact = false,
}) => {
	const importFileRef = useRef<HTMLInputElement>(null);

	// Create handlers using the service
	const handleExport = credentialsImportExportService.createExportHandler(credentials, options);
	const handleImport = credentialsImportExportService.createImportHandler(options);

	const containerStyle: React.CSSProperties = {
		display: 'flex',
		gap: compact ? '0.5rem' : '0.75rem',
		alignItems: 'center',
		padding: compact ? '0.5rem' : '0.75rem 1rem',
		background: '#f9fafb',
		border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
		borderRadius: '0.5rem',
		marginBottom: '1rem',
		...style,
	};

	const buttonBaseStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
		padding: compact ? '0.3rem 0.7rem' : '0.4rem 0.9rem',
		background: '#2563eb',
		color: 'white',
		border: 'none',
		borderRadius: '0.375rem',
		fontSize: compact ? '0.75rem' : '0.8rem',
		fontWeight: 600,
		cursor: 'pointer',
		transition: 'all 0.15s ease-in-out',
		...buttonStyle,
	};

	const exportButtonStyle: React.CSSProperties = {
		...buttonBaseStyle,
		'&:hover': {
			background: '#2563eb',
		},
	};

	const importButtonStyle: React.CSSProperties = {
		...buttonBaseStyle,
		background: '#059669',
		'&:hover': {
			background: '#047857',
		},
	};

	return (
		<div style={containerStyle} className={className}>
			{!compact && (
				<span style={{ fontSize: '0.8rem', color: '#6b7280', marginRight: 'auto' }}>
					Credentials
				</span>
			)}

			{/* Export Button */}
			<button
				type="button"
				onClick={handleExport}
				style={exportButtonStyle}
				title={`Export ${options.appName || options.flowType} credentials as JSON`}
			>
				<span style={{ fontSize: compact ? 12 : 13 }}>📥</span>
				{showLabels && 'Export'}
			</button>

			{/* Import Button */}
			<button
				type="button"
				onClick={() => importFileRef.current?.click()}
				style={importButtonStyle}
				title={`Import ${options.appName || options.flowType} credentials from JSON file`}
			>
				<span style={{ fontSize: compact ? 12 : 13 }}>📤</span>
				{showLabels && 'Import'}
			</button>

			{/* Hidden File Input */}
			<input
				ref={importFileRef}
				type="file"
				accept=".json,application/json"
				style={{ display: 'none' }}
				onChange={handleImport}
			/>
		</div>
	);
};

export default CredentialsImportExport;
