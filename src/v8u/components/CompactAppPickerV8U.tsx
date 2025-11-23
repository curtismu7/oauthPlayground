/**
 * @file CompactAppPickerV8U.tsx
 * @module v8u/components
 * @description Compact app picker - small button with dropdown
 * @version 8.0.0
 * @since 2024-11-16
 */

import React, { useEffect, useRef, useState } from 'react';
import type { DiscoveredApp } from '@/v8/components/AppPickerV8';
import { AppDiscoveryServiceV8 } from '@/v8/services/appDiscoveryServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

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
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const dropdownRef = useRef<HTMLDivElement>(null);

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
			}
		};

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

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
				setShowDropdown(true);
				toastV8.success(`Found ${discovered.length} application(s)`);
			} else {
				toastV8.error('No applications found');
				setApps([]);
			}
		} catch (error) {
			console.error(`${MODULE_TAG} Discovery error`, error);
			toastV8.error(
				error instanceof Error
					? error.message
					: 'Failed to discover applications - check worker token'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSelectApp = (app: DiscoveredApp) => {
		onAppSelected(app);
		setShowDropdown(false);
		setApps([]);
		toastV8.success(`Selected: ${app.name}`);
	};

	const isDisabled = isLoading || !environmentId.trim() || !tokenStatus.isValid;

	return (
		<div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
			<button
				type="button"
				onClick={handleDiscover}
				disabled={isDisabled}
				style={{
					padding: '6px 12px',
					fontSize: '13px',
					fontWeight: '500',
					background: isDisabled ? '#9ca3af' : '#3b82f6',
					color: 'white',
					border: 'none',
					borderRadius: '4px',
					cursor: isDisabled ? 'not-allowed' : 'pointer',
					transition: 'background 0.2s ease',
					whiteSpace: 'nowrap',
				}}
			>
				{isLoading ? '🔄...' : '🔍 Discover Apps'}
			</button>

			{/* Dropdown */}
			{showDropdown && apps.length > 0 && (
				<div
					style={{
						position: 'absolute',
						top: '100%',
						left: 0,
						marginTop: '4px',
						border: '1px solid #d1d5db',
						borderRadius: '4px',
						background: 'white',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						maxHeight: '300px',
						overflow: 'auto',
						zIndex: 1000,
						minWidth: '300px',
					}}
				>
					{apps.map((app) => (
						<div
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
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default CompactAppPickerV8U;
