/**
 * @file UnifiedCredentialManagerV9.tsx
 * @module components
 * @description V9 unified credential management component combining App Picker and Import/Export
 * @version 9.0.0
 * @since 2026-03-06
 *
 * Combines CompactAppPickerV9 and CredentialsImportExport into a single, collapsible
 * component for easier maintenance and consistent user experience across all flows.
 */

import { FiChevronDown, FiChevronUp, FiDownload, FiSearch, FiUpload } from '@icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	credentialsImportExportService,
	type ImportExportOptions,
} from '@/services/credentialsImportExportService';
import type { V9DiscoveredApp } from '@/services/v9/V9AppDiscoveryService';
import { V9AppDiscoveryService } from '@/services/v9/V9AppDiscoveryService';
import { V9CredentialStorageService } from '@/services/v9/V9CredentialStorageService';
import {
	type V9TokenStatusInfo,
	V9WorkerTokenStatusService,
} from '@/services/v9/V9WorkerTokenStatusService';
import { logger } from '../utils/logger';

const _MODULE_TAG = '[🔧 UNIFIED-CREDENTIAL-MANAGER-V9]';

// Styled components
const Container = styled.div`
	background: V9_COLORS.BG.GRAY_LIGHT;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	overflow: hidden;
`;

const Header = styled.div<{ $isExpanded: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: linear-gradient(135deg, V9_COLORS.BG.GRAY_MEDIUM 0%, V9_COLORS.TEXT.GRAY_LIGHTER 100%);
	border-bottom: ${({ $isExpanded }) => ($isExpanded ? '1px solid V9_COLORS.TEXT.GRAY_LIGHTER' : 'none')};
	cursor: pointer;
	user-select: none;
	transition: all 0.2s ease;

	&:hover {
		background: linear-gradient(135deg, V9_COLORS.TEXT.GRAY_LIGHTER 0%, #cbd5e1 100%);
	}
`;

const HeaderTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
`;

const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Content = styled.div<{ $isExpanded: boolean }>`
	max-height: ${({ $isExpanded }) => ($isExpanded ? '2000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease-in-out;
`;

const ContentInner = styled.div`
	padding: 1rem;
`;

const Section = styled.div`
	margin-bottom: 1.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const SectionTitle = styled.h4`
	margin: 0 0 0.75rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 0.5rem;
	flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'outline' }>`
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.5rem 0.75rem;
	border: 1px solid ${({ $variant }) =>
		$variant === 'primary'
			? 'V9_COLORS.PRIMARY.BLUE'
			: $variant === 'secondary'
				? 'V9_COLORS.TEXT.GRAY_MEDIUM'
				: 'V9_COLORS.TEXT.GRAY_LIGHTER'};
	border-radius: 0.375rem;
	background: ${({ $variant }) =>
		$variant === 'primary'
			? 'V9_COLORS.PRIMARY.BLUE'
			: $variant === 'secondary'
				? 'V9_COLORS.TEXT.GRAY_MEDIUM'
				: 'V9_COLORS.TEXT.WHITE'};
	color: ${({ $variant }) =>
		$variant === 'primary' || $variant === 'secondary'
			? 'V9_COLORS.TEXT.WHITE'
			: 'V9_COLORS.TEXT.GRAY_DARK'};
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${({ $variant }) =>
			$variant === 'primary'
				? 'V9_COLORS.PRIMARY.BLUE_DARK'
				: $variant === 'secondary'
					? '#4b5563'
					: '#f9fafb'};
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
`;

const AppList = styled.div`
	max-height: 300px;
	overflow-y: auto;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 0.375rem;
	background: V9_COLORS.TEXT.WHITE;
`;

const AppItem = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	padding: 0.75rem;
	border: none;
	border-bottom: 1px solid #f3f4f6;
	background: V9_COLORS.TEXT.WHITE;
	text-align: left;
	cursor: pointer;
	transition: all 0.2s ease;

	&:last-child {
		border-bottom: none;
	}

	&:hover {
		background: V9_COLORS.BG.GRAY_LIGHT;
		transform: translateX(2px);
	}

	&:active {
		background: V9_COLORS.BG.GRAY_MEDIUM;
	}
`;

const AppInfo = styled.div`
	flex: 1;
`;

const AppName = styled.div`
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.25rem;
`;

const AppDetails = styled.div`
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const StatusMessage = styled.div<{ $type?: 'info' | 'success' | 'warning' | 'error' }>`
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.875rem;
	margin-top: 0.5rem;
	background: ${({ $type }) =>
		$type === 'success'
			? 'V9_COLORS.PRIMARY.GREEN'
			: $type === 'warning'
				? 'V9_COLORS.PRIMARY.YELLOW'
				: $type === 'error'
					? 'V9_COLORS.PRIMARY.RED'
					: 'V9_COLORS.PRIMARY.BLUE'};
	color: V9_COLORS.TEXT.WHITE;
`;

// Types
export interface UnifiedCredentialManagerV9Props {
	environmentId: string;
	flowKey: string; // For V9 credential storage
	credentials: Record<string, unknown>;
	importExportOptions: ImportExportOptions;
	onAppSelected?: (app: V9DiscoveredApp) => void;
	grantType?: string; // Optional filter for specific grant types
	disabled?: boolean; // Manual disable override
	defaultExpanded?: boolean; // Whether to start expanded
	compact?: boolean; // Use compact styling (reserved for future use)
	showImportExport?: boolean; // Show import/export section
	showAppPicker?: boolean; // Show app picker section
}

/**
 * V9 unified credential management component
 *
 * Combines app discovery and credential import/export into a single,
 * collapsible component for consistent user experience across all flows.
 *
 * @param environmentId - PingOne environment ID
 * @param flowKey - Flow key for V9 credential storage
 * @param credentials - Current credentials object
 * @param importExportOptions - Import/export service options
 * @param onAppSelected - Callback when app is selected
 * @param grantType - Optional filter for specific OAuth grant types
 * @param disabled - Manual disable override
 * @param defaultExpanded - Whether to start expanded (default: false)
 * @param compact - Use compact styling (default: false)
 * @param showImportExport - Show import/export section (default: true)
 * @param showAppPicker - Show app picker section (default: true)
 */
export const UnifiedCredentialManagerV9: React.FC<UnifiedCredentialManagerV9Props> = ({
	environmentId,
	flowKey,
	credentials,
	importExportOptions,
	onAppSelected,
	grantType,
	disabled = false,
	defaultExpanded = false,
	compact: _compact = false,
	showImportExport = true,
	showAppPicker = true,
}) => {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const [isSearching, setIsSearching] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [discoveredApps, setDiscoveredApps] = useState<V9DiscoveredApp[]>([]);
	const [tokenStatus, setTokenStatus] = useState<V9TokenStatusInfo | null>(null);
	const [statusMessage, setStatusMessage] = useState<{
		type: 'info' | 'success' | 'warning' | 'error';
		text: string;
	} | null>(null);

	const importFileRef = useRef<HTMLInputElement>(null);

	// Check token status using V9 service (same pattern as CompactAppPickerV9)
	useEffect(() => {
		const checkStatus = async () => {
			const status = await V9WorkerTokenStatusService.checkStatus();
			setTokenStatus(status);
		};
		checkStatus();
	}, []);

	// Handle app discovery
	const handleDiscover = async () => {
		if (!environmentId || !tokenStatus?.isValid) {
			logger.warn(_MODULE_TAG, 'Worker token required for app discovery');
			return;
		}

		setIsSearching(true);
		setStatusMessage({ type: 'info', text: 'Discovering applications...' });

		try {
			const result = await V9AppDiscoveryService.discoverApplications(
				environmentId,
				tokenStatus.token || ''
			);
			const filteredApps = grantType
				? V9AppDiscoveryService.getAppsByGrantType(result.apps, grantType)
				: result.apps;

			setDiscoveredApps(filteredApps);
			setStatusMessage(null);

			if (filteredApps.length === 0) {
				setStatusMessage({ type: 'warning', text: 'No applications found for this grant type' });
			}
		} catch (error) {
			logger.error(_MODULE_TAG, 'App discovery failed:', undefined, error as Error);
			setStatusMessage({ type: 'error', text: 'Failed to discover applications' });
		} finally {
			setIsSearching(false);
		}
	};

	// Handle app selection
	const handleAppSelected = (app: V9DiscoveredApp) => {
		// Save to V9 credential storage
		V9CredentialStorageService.save(
			flowKey,
			{ clientId: app.clientId, environmentId },
			{ environmentId }
		);

		if (onAppSelected) {
			onAppSelected(app);
		}

		setStatusMessage({ type: 'success', text: `Selected: ${app.name}` });
	};

	// Handle import/export
	const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		credentialsImportExportService.importCredentials(file, importExportOptions);
	};

	const handleExport = () => {
		credentialsImportExportService.exportCredentials(credentials, importExportOptions);
	};

	// Filter apps based on search query
	const filteredApps = useMemo(() => {
		if (!searchQuery) return discoveredApps;

		const query = searchQuery.toLowerCase();
		return discoveredApps.filter(
			(app) =>
				app.name.toLowerCase().includes(query) ||
				app.clientId.toLowerCase().includes(query) ||
				app.description?.toLowerCase().includes(query)
		);
	}, [discoveredApps, searchQuery]);

	// Check if app discovery is available
	const canDiscover = !!(environmentId && tokenStatus?.isValid && !disabled);

	return (
		<Container>
			<Header $isExpanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
				<HeaderTitle>
					<FiSearch size={16} />
					Credential Management
				</HeaderTitle>
				<HeaderActions>
					{!isExpanded && (
						<span style={{ fontSize: '0.75rem', color: 'V9_COLORS.TEXT.GRAY_MEDIUM' }}>
							{showAppPicker && 'App Picker'}
							{showAppPicker && showImportExport && ' • '}
							{showImportExport && 'Import/Export'}
						</span>
					)}
					{isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
				</HeaderActions>
			</Header>

			<Content $isExpanded={isExpanded}>
				<ContentInner>
					{showAppPicker && (
						<Section>
							<SectionTitle>Application Discovery</SectionTitle>

							<ButtonGroup>
								<ActionButton
									$variant="primary"
									onClick={handleDiscover}
									disabled={!canDiscover || isSearching}
								>
									<FiSearch size={14} />
									{isSearching ? 'Discovering...' : 'Discover Apps'}
								</ActionButton>

								{searchQuery && (
									<ActionButton $variant="outline" onClick={() => setSearchQuery('')}>
										Clear Search
									</ActionButton>
								)}
							</ButtonGroup>

							{filteredApps.length > 0 && (
								<AppList>
									{filteredApps.map((app) => (
										<AppItem
											key={app.clientId}
											onClick={() => handleAppSelected(app)}
											disabled={disabled}
										>
											<AppInfo>
												<AppName>{app.name}</AppName>
												<AppDetails>
													ID: {app.clientId}
													{app.description && ` • ${app.description}`}
												</AppDetails>
											</AppInfo>
										</AppItem>
									))}
								</AppList>
							)}

							{statusMessage && (
								<StatusMessage $type={statusMessage.type}>{statusMessage.text}</StatusMessage>
							)}
						</Section>
					)}

					{showImportExport && (
						<Section>
							<SectionTitle>Import/Export Credentials</SectionTitle>

							<ButtonGroup>
								<input
									ref={importFileRef}
									type="file"
									accept=".json"
									onChange={handleImport}
									style={{ display: 'none' }}
								/>

								<ActionButton
									$variant="secondary"
									onClick={() => importFileRef.current?.click()}
									disabled={disabled}
								>
									<FiUpload size={14} />
									Import
								</ActionButton>

								<ActionButton
									$variant="secondary"
									onClick={handleExport}
									disabled={disabled || !credentials || Object.keys(credentials).length === 0}
								>
									<FiDownload size={14} />
									Export
								</ActionButton>
							</ButtonGroup>
						</Section>
					)}
				</ContentInner>
			</Content>
		</Container>
	);
};

export default UnifiedCredentialManagerV9;
