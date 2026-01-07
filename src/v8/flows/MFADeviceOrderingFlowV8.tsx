import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import React, { useEffect, useState } from 'react';
import { usePageScroll } from '@/hooks/usePageScroll';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { MFAHeaderV8 } from '@/v8/components/MFAHeaderV8';
import { SuperSimpleApiDisplayV8 } from '@/v8/components/SuperSimpleApiDisplayV8';
import { WorkerTokenModalV8 } from '@/v8/components/WorkerTokenModalV8';
import { useApiDisplayPadding } from '@/v8/hooks/useApiDisplayPadding';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';
import { CredentialsServiceV8 } from '@/v8/services/credentialsServiceV8';
import { EnvironmentIdServiceV8 } from '@/v8/services/environmentIdServiceV8';
import { MFAServiceV8 } from '@/v8/services/mfaServiceV8';
import { workerTokenServiceV8 } from '@/v8/services/workerTokenServiceV8';
import { WorkerTokenStatusServiceV8 } from '@/v8/services/workerTokenStatusServiceV8';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const MODULE_TAG = '[📋 DEVICE-ORDER-FLOW-V8]';
const FLOW_KEY = 'mfa-device-order-v8';

interface Credentials {
	environmentId: string;
	username: string;
	[key: string]: unknown;
}

interface Device {
	id: string;
	type: string;
	name?: string;
	nickname?: string;
	status?: string;
	phone?: string;
	email?: string;
	[key: string]: unknown;
}

export const MFADeviceOrderingFlowV8: React.FC = () => {
	console.log(`${MODULE_TAG} Initializing device ordering flow`);

	usePageScroll({ pageName: 'MFA Device Ordering V8', force: true });

	const [credentials, setCredentials] = useState<Credentials>(() => {
		const stored = CredentialsServiceV8.loadCredentials(FLOW_KEY, {
			flowKey: FLOW_KEY,
			flowType: 'oidc',
			includeClientSecret: false,
			includeRedirectUri: false,
			includeLogoutUri: false,
			includeScopes: false,
		});

		const globalEnvId = EnvironmentIdServiceV8.getEnvironmentId();
		const environmentId = stored.environmentId || globalEnvId || '';

		console.log(`${MODULE_TAG} Loading credentials`, {
			flowSpecificEnvId: stored.environmentId,
			globalEnvId,
			usingEnvId: environmentId,
		});

		return {
			environmentId,
			username: stored.username || '',
		};
	});

	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [tokenStatus, setTokenStatus] = useState(() =>
		WorkerTokenStatusServiceV8.checkWorkerTokenStatus()
	);
	const [isReady, setIsReady] = useState(false);

	const [devices, setDevices] = useState<Device[]>([]);
	const [isLoadingDevices, setIsLoadingDevices] = useState(false);
	const [isSavingOrder, setIsSavingOrder] = useState(false);
	const [isRemovingOrder, setIsRemovingOrder] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [typeFilter, setTypeFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const filtersActive = typeFilter !== 'all' || statusFilter !== 'all';

	// Get API display padding
	const { paddingBottom } = useApiDisplayPadding();

	// Check token status periodically
	useEffect(() => {
		const checkStatus = () => {
			const status = WorkerTokenStatusServiceV8.checkWorkerTokenStatus();
			setTokenStatus(status);
		};

		const interval = setInterval(checkStatus, 30000);

		const handleStorageChange = () => {
			checkStatus();
		};
		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleStorageChange);

		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleStorageChange);
		};
	}, []);

	// Clear API calls on mount
	useEffect(() => {
		apiCallTrackerService.clearApiCalls();
	}, []);

	// Save credentials when they change
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		CredentialsServiceV8.saveCredentials(FLOW_KEY, credentials as any);

		if (credentials.environmentId) {
			EnvironmentIdServiceV8.saveEnvironmentId(credentials.environmentId);
			console.log(`${MODULE_TAG} Environment ID saved globally`, {
				environmentId: credentials.environmentId,
			});
		}
	}, [credentials]);

	const handleManageWorkerToken = async () => {
		if (tokenStatus.isValid) {
			const { uiNotificationServiceV8 } = await import('@/v8/services/uiNotificationServiceV8');
			const confirmed = await uiNotificationServiceV8.confirm({
				title: 'Remove Worker Token',
				message: 'Worker token is currently stored.\n\nDo you want to remove it?',
				confirmText: 'Remove',
				cancelText: 'Cancel',
				severity: 'warning',
			});
			if (confirmed) {
				workerTokenServiceV8.clearToken();
				window.dispatchEvent(new Event('workerTokenUpdated'));
				setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
				toastV8.success('Worker token removed');
			}
		} else {
			// Use helper to check silentApiRetrieval before showing modal
			const { handleShowWorkerTokenModal } = await import('@/v8/utils/workerTokenModalHelperV8');
			await handleShowWorkerTokenModal(setShowWorkerTokenModal, setTokenStatus);
		}
	};

	const handleWorkerTokenGenerated = () => {
		window.dispatchEvent(new Event('workerTokenUpdated'));
		setTokenStatus(WorkerTokenStatusServiceV8.checkWorkerTokenStatus());
		toastV8.success('Worker token generated and saved!');
	};

	const canLoad =
		credentials.environmentId?.trim() && credentials.username?.trim() && tokenStatus.isValid;

	const handleLoadDevices = async () => {
		if (!credentials.environmentId?.trim()) {
			toastV8.error('Environment ID is required');
			return;
		}
		if (!credentials.username?.trim()) {
			toastV8.error('Username is required');
			return;
		}
		if (!tokenStatus.isValid) {
			toastV8.error('Worker token is required');
			return;
		}

		setIsLoadingDevices(true);
		setLoadError(null);
		try {
			const result = await MFAServiceV8.getAllDevices({
				environmentId: credentials.environmentId.trim(),
				username: credentials.username.trim(),
			});
			setDevices((result || []) as Device[]);
			setIsReady(true);
			toastV8.success(`Loaded ${Array.isArray(result) ? result.length : 0} devices`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to load devices`, error);
			setLoadError(error instanceof Error ? error.message : 'Failed to load devices from PingOne');
			toastV8.error(
				`Failed to load devices: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsLoadingDevices(false);
		}
	};

	const handleDragEnd = (result: DropResult) => {
		console.log(`${MODULE_TAG} Drag ended:`, {
			source: result.source,
			destination: result.destination,
			draggableId: result.draggableId,
		});

		if (filtersActive) {
			console.log(`${MODULE_TAG} Drag attempt ignored because filters are active`, {
				typeFilter,
				statusFilter,
			});
			toastV8.info('Clear filters to change device ordering');
			return;
		}

		if (!result.destination) {
			console.log(`${MODULE_TAG} Drag cancelled - no destination`);
			return;
		}

		if (result.destination.index === result.source.index) {
			console.log(`${MODULE_TAG} Drag ended at same position - no change`);
			return;
		}

		const items = Array.from(devices);
		const [reordered] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reordered);

		console.log(`${MODULE_TAG} Reordered devices:`, {
			from: result.source.index,
			to: result.destination.index,
			newOrder: items.map((d, i) => ({ index: i, id: d.id, type: d.type })),
		});

		setDevices(items);
	};

	const handleMoveUp = (deviceId: string) => {
		const index = devices.findIndex((d) => d.id === deviceId);
		if (index <= 0) return; // Already at top or not found
		const newDevices = [...devices];
		const [device] = newDevices.splice(index, 1);
		newDevices.splice(index - 1, 0, device);
		setDevices(newDevices);
	};

	const handleMoveDown = (deviceId: string) => {
		const index = devices.findIndex((d) => d.id === deviceId);
		if (index === -1 || index === devices.length - 1) return; // Already at bottom or not found
		const newDevices = [...devices];
		const [device] = newDevices.splice(index, 1);
		newDevices.splice(index + 1, 0, device);
		setDevices(newDevices);
	};

	const handleSetAsDefault = async (deviceId: string) => {
		if (!credentials.environmentId?.trim() || !credentials.username?.trim()) {
			toastV8.error('Environment ID and username are required');
			return;
		}

		const deviceIndex = devices.findIndex((d) => d.id === deviceId);
		if (deviceIndex === -1) {
			toastV8.error('Device not found');
			return;
		}

		if (deviceIndex === 0) {
			toastV8.info('This device is already the default');
			return;
		}

		// Move device to first position
		const newDevices = [...devices];
		const [deviceToMove] = newDevices.splice(deviceIndex, 1);
		newDevices.unshift(deviceToMove);
		setDevices(newDevices);

		// Save the new order
		setIsSavingOrder(true);
		try {
			const user = await MFAServiceV8.lookupUserByUsername(
				credentials.environmentId.trim(),
				credentials.username.trim()
			);

			const deviceIds = newDevices.map((d) => d.id).filter((id) => id && id.trim());

			if (deviceIds.length === 0) {
				throw new Error('No valid device IDs found');
			}

			console.log(`${MODULE_TAG} Setting device order:`, {
				userId: user.id,
				deviceCount: deviceIds.length,
				deviceIds: deviceIds.slice(0, 3), // Log first 3 for debugging
			});

			await MFAServiceV8.setUserMfaDeviceOrder(
				credentials.environmentId.trim(),
				user.id,
				deviceIds
			);
			toastV8.success(`"${deviceToMove.type}" set as default device`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to set default device:`, error);
			toastV8.error(error instanceof Error ? error.message : 'Failed to set default device');
			// Revert on error
			setDevices(devices);
		} finally {
			setIsSavingOrder(false);
		}
	};

	const handleSaveOrder = async () => {
		if (devices.length <= 1) {
			toastV8.info('Add more than one device to change ordering');
			return;
		}
		if (!credentials.environmentId?.trim() || !credentials.username?.trim()) {
			toastV8.error('Environment ID and username are required');
			return;
		}
		setIsSavingOrder(true);
		try {
			const user = await MFAServiceV8.lookupUserByUsername(
				credentials.environmentId.trim(),
				credentials.username.trim()
			);

			const deviceIds = devices.map((d) => d.id).filter((id) => id && id.trim());

			if (deviceIds.length === 0) {
				throw new Error('No valid device IDs found');
			}

			if (deviceIds.length !== devices.length) {
				console.warn(`${MODULE_TAG} Some devices have invalid IDs:`, {
					totalDevices: devices.length,
					validDeviceIds: deviceIds.length,
				});
			}

			console.log(`${MODULE_TAG} Saving device order:`, {
				userId: user.id,
				deviceCount: deviceIds.length,
				deviceIds: deviceIds.slice(0, 3), // Log first 3 for debugging
			});

			await MFAServiceV8.setUserMfaDeviceOrder(
				credentials.environmentId.trim(),
				user.id,
				deviceIds
			);
			toastV8.success('Device order updated successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to save device order`, error);
			toastV8.error(
				`Failed to save device order: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsSavingOrder(false);
		}
	};

	const handleRemoveOrder = async () => {
		if (!credentials.environmentId?.trim() || !credentials.username?.trim()) {
			toastV8.error('Environment ID and username are required');
			return;
		}
		setIsRemovingOrder(true);
		try {
			const user = await MFAServiceV8.lookupUserByUsername(
				credentials.environmentId.trim(),
				credentials.username.trim()
			);
			await MFAServiceV8.removeUserMfaDeviceOrder(credentials.environmentId.trim(), user.id);
			toastV8.success('Device ordering removed successfully');
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to remove device order`, error);
			toastV8.error(
				`Failed to remove device order: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		} finally {
			setIsRemovingOrder(false);
		}
	};

	const normalizeStatus = (status?: string) => status || 'UNKNOWN';

	const typeOptions = Array.from(
		new Set(devices.map((d) => d.type).filter((t): t is string => !!t))
	).sort();

	const statusOptions = Array.from(
		new Set(devices.map((d) => normalizeStatus(d.status as string | undefined)))
	).sort();

	const filteredDevices = devices.filter((device) => {
		const matchesType = typeFilter === 'all' || device.type === typeFilter;
		const deviceStatus = normalizeStatus(device.status as string | undefined);
		const matchesStatus = statusFilter === 'all' || statusFilter === deviceStatus;
		return matchesType && matchesStatus;
	});

	return (
		<>
			<div
				className="mfa-device-order-flow-v8"
				style={{
					maxWidth: '1200px',
					margin: '0 auto',
					background: '#f8f9fa',
					minHeight: '100vh',
					overflowY: 'auto',
					paddingBottom: paddingBottom !== '0' ? paddingBottom : '40px',
					transition: 'padding-bottom 0.3s ease',
				}}
			>
				<MFAHeaderV8
					title="Device Ordering"
					description="Drag and drop to set the order of MFA devices. The first device is used as default."
					versionTag="V8"
					currentPage="ordering"
					showRestartFlow={false}
					showBackToMain
					headerColor="blue"
				/>
				<div
					className="flow-container"
					style={{
						padding: 20,
					}}
				>
					<div className="setup-section">
						<h2>Setup</h2>
						<p>Enter user details and load devices to configure their ordering.</p>

						<div style={{ marginBottom: '20px' }}>
							<div
								style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}
							>
								<button
									type="button"
									onClick={handleManageWorkerToken}
									style={{
										padding: '10px 16px',
										background: tokenStatus.isValid ? '#10b981' : '#ef4444',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '600',
										cursor: 'pointer',
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
									}}
								>
									<span>🔑</span>
									<span>{tokenStatus.isValid ? 'Manage Token' : 'Add Token'}</span>
								</button>
								<div
									style={{
										flex: 1,
										padding: '10px 12px',
										background: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#fef3c7'
												: '#d1fae5'
											: '#fee2e2',
										border: `1px solid ${WorkerTokenStatusServiceV8.getStatusColor(tokenStatus.status)}`,
										borderRadius: '4px',
										fontSize: '12px',
										fontWeight: '500',
										color: tokenStatus.isValid
											? tokenStatus.status === 'expiring-soon'
												? '#92400e'
												: '#065f46'
											: '#991b1b',
									}}
								>
									<span>{WorkerTokenStatusServiceV8.getStatusIcon(tokenStatus.status)}</span>
									<span style={{ marginLeft: '6px' }}>{tokenStatus.message}</span>
								</div>
							</div>
						</div>

						<div className="credentials-grid">
							<div className="form-group">
								<label htmlFor="order-env-id">
									Environment ID <span className="required">*</span>
								</label>
								<input
									id="order-env-id"
									type="text"
									value={credentials.environmentId}
									onChange={(e) =>
										setCredentials({ ...credentials, environmentId: e.target.value })
									}
									placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
								/>
								<small>PingOne environment ID</small>
							</div>

							<div className="form-group">
								<label htmlFor="order-username">
									Username <span className="required">*</span>
								</label>
								<input
									id="order-username"
									type="text"
									value={credentials.username}
									onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
									placeholder="john.doe"
								/>
								<small>PingOne username whose device order you want to manage</small>
							</div>
						</div>

						<button
							type="button"
							className="btn btn-primary"
							onClick={handleLoadDevices}
							disabled={!canLoad || isLoadingDevices}
							style={{ marginTop: '20px' }}
						>
							{isLoadingDevices ? 'Loading devices...' : 'Load Devices'}
						</button>

						{loadError && (
							<div className="info-box" style={{ marginTop: '16px' }}>
								<p>
									<strong>Error:</strong> {loadError}
								</p>
							</div>
						)}
					</div>

					{isReady && (
						<div
							style={{
								marginTop: '24px',
								background: 'white',
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
								padding: '16px',
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '12px',
								}}
							>
								<div>
									<h3
										style={{
											margin: 0,
											fontSize: '16px',
											fontWeight: 600,
											color: '#111827',
										}}
									>
										Device Ordering
									</h3>
									<p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
										Drag devices to change their order. The first device is treated as the default
										device.
									</p>
								</div>
								{devices.length > 0 && (
									<div
										style={{
											display: 'flex',
											flexWrap: 'wrap',
											gap: '12px',
											marginTop: '8px',
										}}
									>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
											<label
												htmlFor="device-type-filter"
												style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}
											>
												Type
											</label>
											<select
												id="device-type-filter"
												value={typeFilter}
												onChange={(e) => setTypeFilter(e.target.value)}
												style={{
													padding: '8px 10px',
													fontSize: '13px',
													fontWeight: 500,
													borderRadius: '6px',
													border: '1px solid #9ca3af',
													background: '#f9fafb',
													color: '#111827',
													minWidth: '160px',
												}}
											>
												<option value="all">All types</option>
												{typeOptions.map((type) => (
													<option key={type} value={type}>
														{type}
													</option>
												))}
											</select>
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
											<label
												htmlFor="device-status-filter"
												style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}
											>
												Status
											</label>
											<select
												id="device-status-filter"
												value={statusFilter}
												onChange={(e) => setStatusFilter(e.target.value)}
												style={{
													padding: '8px 10px',
													fontSize: '13px',
													fontWeight: 500,
													borderRadius: '6px',
													border: '1px solid #9ca3af',
													background: '#f9fafb',
													color: '#111827',
													minWidth: '160px',
												}}
											>
												<option value="all">All statuses</option>
												{statusOptions.map((status) => (
													<option key={status} value={status}>
														{status}
													</option>
												))}
											</select>
										</div>
										{filtersActive && (
											<button
												type="button"
												onClick={() => {
													setTypeFilter('all');
													setStatusFilter('all');
												}}
												style={{
													padding: '6px 10px',
													fontSize: '12px',
													borderRadius: '6px',
													border: '1px solid #d1d5db',
													background: 'white',
													cursor: 'pointer',
												}}
											>
												Clear filters
											</button>
										)}
									</div>
								)}
								<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
									<button
										type="button"
										onClick={handleSaveOrder}
										style={{
											padding: '10px 20px',
											background: '#3b82f6',
											color: 'white',
											border: 'none',
											borderRadius: '8px',
											fontSize: '14px',
											fontWeight: 600,
											cursor: isSavingOrder ? 'wait' : 'pointer',
											opacity: isSavingOrder ? 0.7 : 1,
										}}
										disabled={isSavingOrder || devices.length <= 1}
									>
										{isSavingOrder ? 'Saving...' : 'Save Order'}
									</button>
									<button
										type="button"
										onClick={handleRemoveOrder}
										style={{
											padding: '10px 20px',
											background: '#f97316',
											color: 'white',
											border: 'none',
											borderRadius: '8px',
											fontSize: '14px',
											fontWeight: 600,
											cursor: isRemovingOrder ? 'wait' : 'pointer',
											opacity: isRemovingOrder ? 0.7 : 1,
										}}
										disabled={isRemovingOrder}
									>
										{isRemovingOrder ? 'Removing...' : 'Remove Ordering'}
									</button>
								</div>
							</div>

							{devices.length === 0 ? (
								<p style={{ fontSize: '13px', color: '#6b7280' }}>
									No devices found for this user. Register at least one device to configure
									ordering.
								</p>
							) : filteredDevices.length === 0 ? (
								<p style={{ fontSize: '13px', color: '#6b7280' }}>
									No devices match the current filters. Try changing or clearing the filters.
								</p>
							) : (
								<DragDropContext
									onDragEnd={(result) => {
										if (!filtersActive) {
											handleDragEnd(result);
										}
									}}
									onDragStart={() => {
										console.log(`${MODULE_TAG} Drag started`);
									}}
									onDragUpdate={(update) => {
										console.log(`${MODULE_TAG} Drag update:`, update);
									}}
								>
									<Droppable droppableId="order-devices">
										{(provided) => (
											<div
												{...provided.droppableProps}
												ref={provided.innerRef}
												style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
											>
												{filteredDevices.map((device, index) => {
													const originalIndex = devices.findIndex((d) => d.id === device.id);
													const isFirst = originalIndex === 0;
													const isLast = originalIndex === devices.length - 1;
													const isDefault = devices[0]?.id === device.id;
													return (
														<Draggable
															key={device.id}
															draggableId={String(device.id)}
															index={index}
														>
															{(draggableProvided, snapshot) => (
																<div
																	ref={draggableProvided.innerRef}
																	{...draggableProvided.draggableProps}
																	{...draggableProvided.dragHandleProps}
																	style={{
																		userSelect: 'none',
																		padding: '10px 12px',
																		borderRadius: '6px',
																		border: '1px solid #e5e7eb',
																		background: snapshot.isDragging ? '#e0f2fe' : '#f9fafb',
																		display: 'flex',
																		alignItems: 'center',
																		gap: '8px',
																		boxShadow: snapshot.isDragging
																			? '0 4px 12px rgba(0, 0, 0, 0.15)'
																			: 'none',
																		transform: snapshot.isDragging ? 'rotate(2deg)' : 'none',
																		transition: snapshot.isDragging
																			? 'none'
																			: 'box-shadow 0.2s ease',
																		opacity: snapshot.isDragging ? 0.8 : 1,
																		position: 'relative',
																		zIndex: snapshot.isDragging ? 1000 : 1,
																		cursor: snapshot.isDragging ? 'grabbing' : 'grab',
																		...draggableProvided.draggableProps.style,
																	}}
																	onClick={(e) => {
																		// Prevent clicks on buttons from triggering drag
																		if ((e.target as HTMLElement).tagName === 'BUTTON') {
																			e.stopPropagation();
																		}
																	}}
																>
																	{/* Drag Handle Icon - Visual indicator only */}
																	<div
																		style={{
																			padding: '8px 12px',
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'center',
																			userSelect: 'none',
																			WebkitUserSelect: 'none',
																			MozUserSelect: 'none',
																			msUserSelect: 'none',
																			fontSize: '20px',
																			color: '#6b7280',
																			lineHeight: '1',
																			flexShrink: 0,
																			pointerEvents: 'none',
																		}}
																		title="Drag to reorder"
																	>
																		⋮⋮
																	</div>
																	{/* Arrow buttons - separate from drag handle */}
																	<div
																		style={{
																			display: 'flex',
																			flexDirection: 'column',
																			gap: '2px',
																			paddingRight: '4px',
																		}}
																	>
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleMoveUp(device.id);
																			}}
																			disabled={isFirst}
																			style={{
																				padding: '2px 6px',
																				background: isFirst ? '#e5e7eb' : '#3b82f6',
																				color: 'white',
																				border: 'none',
																				borderRadius: '4px',
																				cursor: isFirst ? 'not-allowed' : 'pointer',
																				fontSize: '12px',
																				opacity: isFirst ? 0.5 : 1,
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'center',
																			}}
																			title="Move up"
																		>
																			↑
																		</button>
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleMoveDown(device.id);
																			}}
																			disabled={isLast}
																			style={{
																				padding: '2px 6px',
																				background: isLast ? '#e5e7eb' : '#3b82f6',
																				color: 'white',
																				border: 'none',
																				borderRadius: '4px',
																				cursor: isLast ? 'not-allowed' : 'pointer',
																				fontSize: '12px',
																				opacity: isLast ? 0.5 : 1,
																				display: 'flex',
																				alignItems: 'center',
																				justifyContent: 'center',
																			}}
																			title="Move down"
																		>
																			↓
																		</button>
																	</div>
																	<div style={{ flex: 1 }}>
																		<div
																			style={{
																				fontSize: '13px',
																				fontWeight: 600,
																				color: '#111827',
																			}}
																		>
																			{isDefault && (
																				<span
																					style={{
																						marginRight: '6px',
																						padding: '2px 6px',
																						borderRadius: '999px',
																						background: '#dcfce7',
																						color: '#166534',
																						fontSize: '10px',
																						fontWeight: 700,
																					}}
																				>
																					DEFAULT
																				</span>
																			)}
																			<span>{device.type}</span>
																		</div>
																		{(device.nickname || device.name) && (
																			<div style={{ fontSize: '12px', color: '#4b5563' }}>
																				{device.nickname || device.name}
																			</div>
																		)}
																		{(device.phone || device.email) && (
																			<div style={{ fontSize: '12px', color: '#6b7280' }}>
																				{device.phone || device.email}
																			</div>
																		)}
																	</div>
																	<div
																		style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
																	>
																		<div style={{ fontSize: '11px', color: '#6b7280' }}>
																			ID: <code style={{ fontSize: '11px' }}>{device.id}</code>
																		</div>
																		{!isDefault && (
																			<button
																				type="button"
																				onClick={() => handleSetAsDefault(device.id)}
																				disabled={isSavingOrder}
																				style={{
																					padding: '6px 12px',
																					background: '#3b82f6',
																					color: 'white',
																					border: 'none',
																					borderRadius: '4px',
																					fontSize: '11px',
																					fontWeight: '500',
																					cursor: isSavingOrder ? 'wait' : 'pointer',
																					opacity: isSavingOrder ? 0.6 : 1,
																					whiteSpace: 'nowrap',
																				}}
																				title="Set this device as the default (move to first position)"
																			>
																				Set as Default
																			</button>
																		)}
																	</div>
																</div>
															)}
														</Draggable>
													);
												})}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							)}
						</div>
					)}
				</div>
			</div>
			<WorkerTokenModalV8
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				onTokenGenerated={handleWorkerTokenGenerated}
				environmentId={credentials.environmentId}
			/>
			<SuperSimpleApiDisplayV8 flowFilter="mfa" />
			<style>{`
			.mfa-device-order-flow-v8 .credentials-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: 20px;
				margin-bottom: 20px;
			}

			.mfa-device-order-flow-v8 .form-group {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}

			.mfa-device-order-flow-v8 .form-group label {
				font-size: 14px;
				font-weight: 600;
				color: #374151;
				display: flex;
				align-items: center;
				gap: 4px;
			}

			.mfa-device-order-flow-v8 .form-group .required {
				color: #ef4444;
				font-weight: 600;
			}

			.mfa-device-order-flow-v8 .form-group input[type="text"] {
				width: 100%;
				padding: 10px 12px;
				border: 1px solid #d1d5db;
				border-radius: 6px;
				font-size: 14px;
				font-family: inherit;
				background: white;
				color: #1f2937;
				box-sizing: border-box;
				transition: border-color 0.2s ease, box-shadow 0.2s ease;
			}

			.mfa-device-order-flow-v8 .form-group input[type="text"]:focus {
				outline: none;
				border-color: #3b82f6;
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.mfa-device-order-flow-v8 .form-group input[type="text"]:hover {
				border-color: #9ca3af;
			}

			.mfa-device-order-flow-v8 .form-group small {
				font-size: 12px;
				color: #6b7280;
				margin-top: -4px;
				line-height: 1.4;
			}

			@media (max-width: 768px) {
				.mfa-device-order-flow-v8 .credentials-grid {
					grid-template-columns: 1fr;
				}
			}

			/* Drag and Drop Styles - Ensure drag works */
			.mfa-device-order-flow-v8 [data-rbd-droppable-id] {
				min-height: 50px;
			}

			.mfa-device-order-flow-v8 [data-rbd-draggable-id] {
				position: relative;
				touch-action: none;
			}

			.mfa-device-order-flow-v8 [data-rbd-draggable-id]:hover {
				background: #f3f4f6 !important;
			}

			/* Ensure drag handle is visible and clickable */
			.mfa-device-order-flow-v8 [data-rbd-drag-handle-draggable-id] {
				cursor: grab !important;
			}

			.mfa-device-order-flow-v8 [data-rbd-drag-handle-draggable-id]:active {
				cursor: grabbing !important;
			}

			/* Prevent text selection during drag */
			.mfa-device-order-flow-v8 [data-rbd-draggable-context-id] {
				user-select: none;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
			}

			/* Ensure placeholder is visible */
			.mfa-device-order-flow-v8 [data-rbd-placeholder-context-id] {
				background: #f0f9ff;
				border: 2px dashed #3b82f6;
				border-radius: 6px;
			}

			/* Fix for react-beautiful-dnd in React 18 */
			.mfa-device-order-flow-v8 [data-rbd-drag-handle-context-id] {
				cursor: grab !important;
				touch-action: none;
			}

			.mfa-device-order-flow-v8 [data-rbd-drag-handle-context-id]:active {
				cursor: grabbing !important;
			}

			/* Ensure drag handle is always clickable */
			.mfa-device-order-flow-v8 [data-rbd-drag-handle-draggable-id] {
				pointer-events: auto !important;
				z-index: 10 !important;
			}

			/* Allow pointer events on buttons but not on draggable container during drag */
			.mfa-device-order-flow-v8 [data-rbd-draggable-id] button {
				pointer-events: auto;
			}

			/* Prevent drag handle from being blocked */
			.mfa-device-order-flow-v8 [data-rbd-draggable-id] > div:first-child {
				pointer-events: auto !important;
			}
		`}</style>
		</>
	);
};

export default MFADeviceOrderingFlowV8;
