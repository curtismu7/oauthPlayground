/**
 * @file CompactAppPickerV8U.tsx
 * @module v8u/components
 * @description Compact app picker - small button with dropdown
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import type { DiscoveredApp } from '../../v8/components/AppPickerV8.tsx';
import { AppDiscoveryServiceV8 } from '../../v8/services/appDiscoveryServiceV8.ts';
import { workerTokenServiceV8 } from '../../v8/services/workerTokenServiceV8.ts';
import { WorkerTokenStatusServiceV8 } from '../../v8/services/workerTokenStatusServiceV8.ts';
import { toastV8 } from '../../v8/utils/toastNotificationsV8.ts';

const MODULE_TAG = '[🔍 COMPACT-APP-PICKER-V8U]';

interface CompactAppPickerV8UProps {
	environmentId: string;
	onAppSelected: (app: DiscoveredApp) => void;
}

export const CompactAppPickerV8U: React.FC<CompactAppPickerV8UProps> = ({
	environmentId,
	onAppSelected,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [apps, setApps] = useState<DiscoveredApp[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [hasDiscovered, setHasDiscovered] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Check token status
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
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

	// Filter apps based on search query
	const filteredApps = useMemo(() => {
		if (!searchQuery.trim()) {
			return apps;
		}
		const query = searchQuery.toLowerCase();
		return apps.filter(
			(app) =>
				app.name.toLowerCase().includes(query) ||
				app.id.toLowerCase().includes(query) ||
				app.description?.toLowerCase().includes(query)
		);
	}, [apps, searchQuery]);

	const handleDiscover = async () => {
		if (!environmentId.trim()) {
			toastV8.error('Please enter an Environment ID first');
			return;
		}

		if (!tokenStatus.isValid) {
			toastV8.error(tokenStatus.message);
			return;
		}

		setIsLoading(true);
		try {
			// Get worker token directly from global service
			const workerToken = await workerTokenServiceV8.getToken();
			if (!workerToken) {
				toastV8.error('Worker token required - please generate one first');
				setIsLoading(false);
				return;
			}

			// Discover applications using the worker token
			const discovered = await AppDiscoveryServiceV8.discoverApplications(
				environmentId,
				workerToken
			);
			if (discovered && discovered.length > 0) {
				setApps(discovered);
				setHasDiscovered(true);
				setShowDropdown(true);
				toastV8.success(`Found ${discovered.length} application(s)`);
			} else {
				toastV8.error('No applications found');
				setApps([]);
				setHasDiscovered(false);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error(
				error instanceof Error
					? error.message
					: 'Failed to discover applications - check worker token'
			);
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

	const handleSelectApp = (app: DiscoveredApp) => {
		onAppSelected(app);
		setShowDropdown(false);
		setShowSearch(false);
		setSearchQuery('');
		toastV8.success(`Selected: ${app.name}`);
	};

	const isDisabled = isLoading || !environmentId.trim() || !tokenStatus.isValid;

	return (
		<div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
			{/* Search Icon Button (compact) */}
			{!showSearch && (
				<div style={{ position: 'relative', display: 'inline-block' }}>
					<button
						type="button"
						onClick={handleSearchClick}
						disabled={isDisabled}
						style={{
							padding: '6px',
							fontSize: '16px',
							background: isDisabled ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: isDisabled ? 'not-allowed' : 'pointer',
							transition: 'background 0.2s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '32px',
							height: '32px',
						}}
						title="Search and select PingOne application to auto-fill credentials"
						aria-label="Search and select PingOne application to auto-fill credentials"
					>
						{isLoading ? '🔄' : <FiSearch size={16} />}
					</button>
					{/* Tooltip on hover */}
					<div
						style={{
							position: 'absolute',
							bottom: '100%',
							left: '50%',
							transform: 'translateX(-50%)',
							marginBottom: '8px',
							padding: '6px 10px',
							background: '#1f2937',
							color: 'white',
							fontSize: '12px',
							borderRadius: '4px',
							whiteSpace: 'nowrap',
							pointerEvents: 'none',
							opacity: 0,
							transition: 'opacity 0.2s ease',
							zIndex: 1000,
						}}
						className="app-search-tooltip"
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
				<div
					style={{
						position: 'absolute',
						top: '100%',
						right: 0,
						marginTop: '4px',
						border: '1px solid #d1d5db',
						borderRadius: '4px',
						background: 'white',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						zIndex: 1000,
						minWidth: '320px',
						maxWidth: '400px',
					}}
				>
					{/* Search Input */}
					<div
						style={{
							padding: '8px',
							borderBottom: '1px solid #e5e7eb',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiSearch size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
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
								padding: '4px 0',
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
								padding: '4px',
								color: '#6b7280',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
							aria-label="Close search"
						>
							<FiX size={16} />
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
								<div
									role="button"
									tabIndex={0}
									key={app.id}
									onClick={() => handleSelectApp(app)}
									style={{
										padding: '10px 12px',
										borderBottom: '1px solid #e5e7eb',
										cursor: 'pointer',
										background: 'white',
										transition: 'background 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.background = '#f9fafb';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.background = 'white';
									}}
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
									<div style={{ fontSize: '11px', color: '#999' }}>ID: {app.id}</div>
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
								</div>
							))
						) : searchQuery.trim() ? (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
									fontSize: '13px',
								}}
							>
								No applications found matching "{searchQuery}"
							</div>
						) : apps.length === 0 ? (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
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

export default CompactAppPickerV8U;
