/**
 * @file CompactAppPickerV9.tsx
 * @module components
 * @description V9 standardized compact app picker component
 * @version 9.0.0
 * @since 2026-03-06
 *
 * Migrated from CompactAppPickerV8U with V9 standardization:
 * - Uses V9AppDiscoveryService for app discovery
 * - Uses V9WorkerTokenStatusService for token status
 * - Uses useGlobalWorkerToken hook for token management
 * - Follows V9 color standards and styling patterns
 * - Enhanced TypeScript types and error handling
 * - Improved accessibility and user experience
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalWorkerToken } from '@/hooks/useGlobalWorkerToken';
import type { V9DiscoveredApp } from '@/services/v9/V9AppDiscoveryService';
import { V9AppDiscoveryService } from '@/services/v9/V9AppDiscoveryService';
import { modernMessaging } from '@/services/v9/V9ModernMessagingService';
import {
	type V9TokenStatusInfo,
	V9WorkerTokenStatusService,
} from '@/services/v9/V9WorkerTokenStatusService';
import { FiSearch } from '../icons';
import { logger } from '../utils/logger';

const _MODULE_TAG = '[🔍 COMPACT-APP-PICKER-V9]';

interface CompactAppPickerV9Props {
	environmentId: string;
	onAppSelected: (app: V9DiscoveredApp) => void;
	grantType?: string; // Optional filter for specific grant types
	compact?: boolean; // Use compact styling
	disabled?: boolean; // Manual disable override
}

/**
 * V9 standardized compact app picker component
 *
 * Provides a search button that expands to show discovered PingOne applications.
 * Uses V9 services for consistent behavior and follows V9 design standards.
 *
 * @param environmentId - PingOne environment ID
 * @param onAppSelected - Callback when app is selected
 * @param grantType - Optional filter for specific OAuth grant types
 * @param compact - Use compact styling (default: false)
 * @param disabled - Manual disable override (default: false)
 */
export const CompactAppPickerV9: React.FC<CompactAppPickerV9Props> = ({
	environmentId,
	onAppSelected,
	grantType,
	compact = false,
	disabled = false,
}) => {
	// V9 global worker token hook
	const globalTokenStatus = useGlobalWorkerToken();
	const workerToken = globalTokenStatus.token || '';
	const hasWorkerToken = globalTokenStatus.isValid;

	// Component state
	const [isLoading, setIsLoading] = useState(false);
	const [apps, setApps] = useState<V9DiscoveredApp[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [hasDiscovered, setHasDiscovered] = useState(false);
	const [tokenStatus, setTokenStatus] = useState<V9TokenStatusInfo>({
		status: 'missing',
		message: 'Checking...',
		isValid: false,
	});

	// Refs
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Check token status using V9 service
	useEffect(() => {
		const checkStatus = async () => {
			const status = await V9WorkerTokenStatusService.checkStatus();
			setTokenStatus(status);
		};

		checkStatus();
		const interval = setInterval(checkStatus, 60000);
		window.addEventListener('workerTokenUpdated', checkStatus);

		return () => {
			clearInterval(interval);
			window.removeEventListener('workerTokenUpdated', checkStatus);
		};
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
				setShowSearch(false);
				setSearchQuery('');
			}
		};

		if (showDropdown || showSearch) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown, showSearch]);

	// Focus search input when search box opens
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearch]);

	// Filter apps based on search query and optional grant type
	const filteredApps = useMemo(() => {
		let filtered = apps;

		// Apply grant type filter if specified
		if (grantType) {
			filtered = V9AppDiscoveryService.getAppsByGrantType(filtered, grantType);
		}

		// Apply search query filter
		if (searchQuery) {
			filtered = filtered.filter(
				(app) =>
					app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					app.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
					app.description?.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		return filtered;
	}, [apps, searchQuery, grantType]);

	const handleDiscover = async () => {
		if (!environmentId.trim()) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Environment ID is required',
				dismissible: true,
			});
			return;
		}

		if (!hasWorkerToken) {
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message: 'Worker token required - please generate one first',
				dismissible: true,
			});
			return;
		}

		setIsLoading(true);
		try {
			// Use V9AppDiscoveryService for consistent behavior
			const result = await V9AppDiscoveryService.discoverApplications(environmentId, workerToken);

			if (result.success && result.apps.length > 0) {
				setApps(result.apps);
				setHasDiscovered(true);
				setShowDropdown(true);
				modernMessaging.showFooterMessage({
					type: 'info',
					message: `Found ${result.apps.length} application(s)`,
					duration: 3000,
				});
			} else {
				modernMessaging.showBanner({
					type: 'error',
					title: 'Error',
					message: result.error || 'No applications found',
					dismissible: true,
				});
				setApps([]);
				setHasDiscovered(false);
			}
		} catch (error) {
			logger.error(_MODULE_TAG, 'Discovery error:', undefined, error as Error);
			modernMessaging.showBanner({
				type: 'error',
				title: 'Error',
				message:
					error instanceof Error
						? error.message
						: 'Failed to discover applications - check worker token',
				dismissible: true,
			});
			setHasDiscovered(false);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSearchClick = async () => {
		// Always show search box immediately for better UX
		setShowSearch(true);
		setShowDropdown(true);

		// If apps haven't been discovered yet, discover them
		if (!hasDiscovered && apps.length === 0 && !isLoading) {
			await handleDiscover();
		}
	};

	const handleSelectApp = (app: V9DiscoveredApp) => {
		onAppSelected(app);
		setShowDropdown(false);
		setShowSearch(false);
		setSearchQuery('');
		modernMessaging.showFooterMessage({
			type: 'info',
			message: `Selected: ${app.name}`,
			duration: 3000,
		});
	};

	// Determine if button should be disabled
	const isDisabled = disabled || isLoading || !environmentId.trim() || !tokenStatus.isValid;

	// V9 color standards
	const getV9Color = (variant: 'primary' | 'secondary' | 'disabled') => {
		switch (variant) {
			case 'primary':
				return '#2563eb'; // V9 primary blue
			case 'secondary':
				return '#6b7280'; // V9 secondary gray
			case 'disabled':
				return '#9ca3af'; // V9 disabled gray
			default:
				return '#2563eb';
		}
	};

	// V9 spacing standards
	const getV9Spacing = (size: 'xs' | 'sm' | 'md' | 'lg') => {
		switch (size) {
			case 'xs':
				return '4px';
			case 'sm':
				return '8px';
			case 'md':
				return '12px';
			case 'lg':
				return '16px';
			default:
				return '8px';
		}
	};

	// Button styling following V9 standards
	const buttonStyle: React.CSSProperties = {
		padding: compact ? getV9Spacing('xs') : getV9Spacing('sm'),
		fontSize: compact ? '14px' : '16px',
		background: isDisabled ? getV9Color('disabled') : getV9Color('primary'),
		color: 'white',
		border: 'none',
		borderRadius: '6px', // V9 standard border radius
		cursor: isDisabled ? 'not-allowed' : 'pointer',
		transition: 'all 0.15s ease-in-out', // V9 standard transition
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: compact ? '28px' : '32px',
		height: compact ? '28px' : '32px',
		boxShadow: isDisabled ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // V9 subtle shadow
	};

	// Dropdown container styling
	const dropdownStyle: React.CSSProperties = {
		position: 'absolute',
		top: '100%',
		right: '-8px',
		marginTop: getV9Spacing('xs'),
		border: `1px solid V9_COLORS.TEXT.GRAY_LIGHTER`, // V9 border color
		borderRadius: '8px', // V9 standard border radius
		background: 'white',
		boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // V9 shadow
		zIndex: 2000,
		minWidth: '280px',
		maxWidth: '350px',
		maxHeight: '70vh',
		overflow: 'auto',
	};

	// Debug logging (V9 pattern)
	if (isDisabled && process.env.NODE_ENV === 'development') {
		logger.info(`${_MODULE_TAG} App lookup button disabled:`, {
			isLoading,
			environmentId: environmentId.trim(),
			environmentIdEmpty: !environmentId.trim(),
			tokenStatus,
			tokenValid: tokenStatus.isValid,
			disabled,
		});
	}

	return (
		<div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
			{/* Search Icon Button (compact) */}
			{!showSearch && (
				<div
					role="tooltip"
					style={{ position: 'relative', display: 'inline-block' }}
					onMouseEnter={(e) => {
						const tooltip = e.currentTarget.querySelector('.app-search-tooltip');
						if (tooltip) {
							(tooltip as HTMLElement).style.opacity = '1';
						}
					}}
					onMouseLeave={(e) => {
						const tooltip = e.currentTarget.querySelector('.app-search-tooltip');
						if (tooltip) {
							(tooltip as HTMLElement).style.opacity = '0';
						}
					}}
				>
					<button
						type="button"
						onClick={handleSearchClick}
						disabled={isDisabled}
						style={buttonStyle}
						title="Search and select PingOne application to auto-fill credentials"
						aria-label="Search and select PingOne application to auto-fill credentials"
					>
						{isLoading ? '🔄' : <span style={{ fontSize: compact ? 14 : 16 }}>🔍</span>}
					</button>

					{/* Tooltip on hover */}
					<div
						className="app-search-tooltip"
						style={{
							position: 'absolute',
							bottom: '100%',
							left: '50%',
							transform: 'translateX(-50%)',
							marginBottom: getV9Spacing('xs'),
							padding: `${getV9Spacing('xs')} ${getV9Spacing('sm')}`,
							background: '#1f2937', // V9 dark background
							color: 'white',
							fontSize: '12px',
							borderRadius: '4px',
							whiteSpace: 'nowrap',
							pointerEvents: 'none',
							opacity: 0,
							transition: 'opacity 0.15s ease-in-out',
							zIndex: 1000,
						}}
					>
						Search PingOne apps
						<div
							style={{
								position: 'absolute',
								top: '100%',
								left: '50%',
								transform: 'translateX(-50%)',
								border: '4px solid transparent',
								borderTopColor: '#1f2937',
							}}
						/>
					</div>
				</div>
			)}

			{/* Search Box (expanded) */}
			{showSearch && (
				<div style={dropdownStyle}>
					{/* Search Input */}
					<div
						style={{
							padding: getV9Spacing('sm'),
							borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							display: 'flex',
							alignItems: 'center',
							gap: getV9Spacing('sm'),
						}}
					>
						<FiSearch size={16} style={{ color: getV9Color('secondary'), flexShrink: 0 }} />
						<input
							ref={searchInputRef}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search applications..."
							style={{
								flex: 1,
								border: 'none',
								outline: 'none',
								fontSize: '13px',
								padding: `${getV9Spacing('xs')} 0`,
								background: 'transparent',
							}}
						/>
						<button
							type="button"
							onClick={() => {
								setShowSearch(false);
								setSearchQuery('');
								setShowDropdown(false);
							}}
							style={{
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								padding: getV9Spacing('xs'),
								color: getV9Color('secondary'),
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: '4px',
								transition: 'background 0.15s ease-in-out',
							}}
							aria-label="Close search"
						>
							<span style={{ fontSize: '16px' }}>❌</span>
						</button>
					</div>

					{/* App List */}
					<div
						style={{
							maxHeight: '300px',
							overflow: 'auto',
						}}
					>
						{filteredApps.length > 0 ? (
							filteredApps.map((app) => (
								<button
									key={app.clientId}
									type="button"
									onClick={() => handleSelectApp(app)}
									style={{
										width: '100%',
										padding: `${getV9Spacing('sm')} ${getV9Spacing('md')}`,
										borderBottom: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
										cursor: 'pointer',
										background: 'white',
										border: 'none',
										textAlign: 'left',
										transition: 'background 0.15s ease-in-out',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#f9fafb';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'white';
									}}
									aria-label={`Select application: ${app.name}`}
								>
									<div
										style={{
											fontWeight: '600',
											fontSize: '13px',
											color: '#1f2937',
											marginBottom: '2px',
										}}
									>
										{app.name}
									</div>
									<div style={{ fontSize: '11px', color: '#999', marginBottom: '2px' }}>
										ID: {app.clientId}
									</div>
									<div
										style={{
											fontSize: '11px',
											color: '#6b7280',
											marginBottom: '2px',
										}}
									>
										Type: {app.type} | Enabled: {app.enabled ? 'Yes' : 'No'}
									</div>
									{app.description && (
										<div
											style={{
												fontSize: '11px',
												color: '#6b7280',
												marginTop: '2px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{app.description}
										</div>
									)}
								</button>
							))
						) : searchQuery.trim() ? (
							<div
								style={{
									padding: `${getV9Spacing('lg')} ${getV9Spacing('md')}`,
									textAlign: 'center',
									color: getV9Color('secondary'),
									fontSize: '13px',
								}}
							>
								No applications found matching "{searchQuery}"
							</div>
						) : apps.length === 0 ? (
							<div
								style={{
									padding: `${getV9Spacing('lg')} ${getV9Spacing('md')}`,
									textAlign: 'center',
									color: getV9Color('secondary'),
									fontSize: '13px',
								}}
							>
								{isLoading ? 'Discovering applications...' : 'Click to discover applications'}
							</div>
						) : null}
					</div>
				</div>
			)}
		</div>
	);
};

export default CompactAppPickerV9;
