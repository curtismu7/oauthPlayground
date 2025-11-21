/**
 * @file SuperSimpleApiDisplayV8.tsx
 * @module v8/components
 * @description Super compact table-based API display with expandable details
 * @version 8.0.0
 * @since 2024-11-19
 * 
 * Features:
 * - Compact table view of all API calls
 * - Red/Green status dots
 * - Click to expand for full details
 * - Shows only PingOne API calls
 * 
 * @example
 * <SuperSimpleApiDisplayV8 />
 */

import React, { useEffect, useState, type ReactElement } from 'react';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const MODULE_TAG = '[⚡ SUPER-SIMPLE-API-V8]';

interface ApiCall {
	id: string;
	method: string;
	url: string;
	body?: unknown;
	response?: {
		status: number;
		data?: unknown;
	} | undefined;
	timestamp: number;
}

// Shared state for visibility
let globalIsVisible = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let globalSetIsVisible: ((value: boolean) => void) | null = null;

export const ApiDisplayCheckbox: React.FC = () => {
	const [isVisible, setIsVisible] = useState(globalIsVisible);
	const [callCount, setCallCount] = useState(0);

	useEffect(() => {
		globalSetIsVisible = setIsVisible;
		
		// Update call count
		const updateCount = () => {
			const allCalls = apiCallTrackerService.getApiCalls();
			const pingOneCalls = allCalls.filter(call => {
				const url = call.url || '';
				return url.includes('pingone.com') || 
				       url.includes('auth.pingone') ||
				       url.includes('/api/pingone/');
			});
			setCallCount(pingOneCalls.length);
		};

		updateCount();
		const interval = setInterval(updateCount, 500);

		return () => {
			clearInterval(interval);
			globalSetIsVisible = null;
		};
	}, []);

	const handleToggle = () => {
		const newValue = !isVisible;
		setIsVisible(newValue);
		globalIsVisible = newValue;
	};

	return (
		<label style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: '8px',
			padding: '8px 12px',
			background: '#f9fafb',
			border: '1px solid #e5e7eb',
			borderRadius: '6px',
			cursor: 'pointer',
			fontSize: '13px',
			fontWeight: '500',
			color: '#1f2937',
			userSelect: 'none',
		}}>
			<input
				type="checkbox"
				checked={isVisible}
				onChange={handleToggle}
				style={{
					width: '16px',
					height: '16px',
					cursor: 'pointer',
				}}
			/>
			<span>⚡ Show API Calls ({callCount})</span>
		</label>
	);
};

export const SuperSimpleApiDisplayV8: React.FC = () => {
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [isVisible, setIsVisible] = useState(globalIsVisible);
	const [height, setHeight] = useState(300);
	const [isResizing, setIsResizing] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [sidebarWidth, setSidebarWidth] = useState(280);

	useEffect(() => {
		// Sync with global state
		const checkVisibility = () => {
			if (isVisible !== globalIsVisible) {
				setIsVisible(globalIsVisible);
			}
		};
		const interval = setInterval(checkVisibility, 100);
		return () => clearInterval(interval);
	}, [isVisible]);

	// Detect sidebar width dynamically and adjust accordingly
	useEffect(() => {
		const updateSidebarWidth = () => {
			// First try localStorage (where Sidebar component stores width)
			try {
				const saved = localStorage.getItem('sidebar.width');
				const parsed = saved ? parseInt(saved, 10) : NaN;
				if (Number.isFinite(parsed) && parsed >= 300 && parsed <= 600) {
					setSidebarWidth(parsed);
					return;
				}
			} catch {}

			// Try to find the sidebar element
			const sidebar = document.querySelector('[class*="sidebar"], [data-testid="sidebar"], nav[role="navigation"], aside');
			if (sidebar) {
				const computedWidth = sidebar.getBoundingClientRect().width;
				if (computedWidth > 0) {
					setSidebarWidth(computedWidth);
					return;
				}
			}

			// Fallback to default
			setSidebarWidth(280);
		};

		// Initial update
		updateSidebarWidth();

		// Update on window resize
		window.addEventListener('resize', updateSidebarWidth);
		
		// Listen for storage changes (sidebar width saved to localStorage)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'sidebar.width') {
				updateSidebarWidth();
			}
		};
		window.addEventListener('storage', handleStorageChange);

		// Poll for sidebar width changes (localStorage updates don't trigger storage event in same tab)
		const interval = setInterval(updateSidebarWidth, 500);
		
		// Use MutationObserver to detect sidebar DOM changes
		const observer = new MutationObserver(updateSidebarWidth);
		observer.observe(document.body, {
			attributes: true,
			childList: true,
			subtree: true,
			attributeFilter: ['class', 'style', 'data-sidebar-width'],
		});

		return () => {
			window.removeEventListener('resize', updateSidebarWidth);
			window.removeEventListener('storage', handleStorageChange);
			clearInterval(interval);
			observer.disconnect();
		};
	}, []);

	// Handle resize
	useEffect(() => {
		if (!isResizing) return;

		const handleMouseMove = (e: MouseEvent) => {
			const newHeight = window.innerHeight - e.clientY;
			// Min height 150px, max height 50% of window (so it doesn't cover form)
			const maxHeight = Math.min(window.innerHeight * 0.5, 500);
			const clampedHeight = Math.max(150, Math.min(newHeight, maxHeight));
			setHeight(clampedHeight);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};
	}, [isResizing]);

	useEffect(() => {
		const updateCalls = () => {
			const allCalls = apiCallTrackerService.getApiCalls();
			
			// Filter to PingOne API calls (direct or via proxy)
			const pingOneCalls = allCalls
				.filter(call => {
					const url = call.url || '';
					return url.includes('pingone.com') || 
					       url.includes('auth.pingone') ||
					       url.includes('/api/pingone/');
				})
				.map(call => {
					const apiCall: ApiCall = {
						id: String(call.id || ''),
						method: String(call.method || 'GET'),
						url: String(call.url || ''),
						body: call.body,
						timestamp: call.timestamp instanceof Date ? call.timestamp.getTime() : new Date(call.timestamp).getTime(),
					};
					if (call.response) {
						apiCall.response = {
							status: Number(call.response.status) || 0,
							data: call.response.data,
						};
					}
					return apiCall;
				});

			if (pingOneCalls.length > 0) {
				console.log(`${MODULE_TAG} Found ${pingOneCalls.length} API calls`);
			}
			setApiCalls(pingOneCalls);
		};

		// Initial load
		updateCalls();

		// Listen for updates
		const interval = setInterval(updateCalls, 500);

		return () => clearInterval(interval);
	}, []);

	const getStatusDot = (status?: number) => {
		if (!status) {
			return '⚪'; // Pending
		}
		if (status >= 200 && status < 300) {
			return '🟢'; // Success
		}
		return '🔴'; // Error
	};

	const getApiTypeIcon = (url: string) => {
		// Check if it's an admin/worker token API call
		const isAdminApi = 
			url.includes('/as/token') || // Token endpoint
			url.includes('/users?filter=') || // User lookup
			url.includes('/users/') && (url.includes('/devices') || url.includes('/mfa')) || // Device management
			url.includes('lookup-user') || // Proxy user lookup
			url.includes('register-device') || // Proxy device registration
			url.includes('mfa/') || // MFA proxy endpoints
			url.includes('/environments/') && !url.includes('/authorize'); // Management API
		
		if (isAdminApi) {
			return { icon: '🔑', label: 'Admin API (Worker Token)', color: '#f59e0b' };
		}
		
		return { icon: '👤', label: 'User API', color: '#3b82f6' };
	};

	const getShortUrl = (url: string) => {
		// Remove protocol and domain for cleaner display
		let shortUrl = url
			.replace('https://api.pingone.com/v1/', '')
			.replace('https://auth.pingone.com/', 'auth/')
			.replace('/api/pingone/mfa/', 'mfa/');
		
		// Truncate if too long
		if (shortUrl.length > 60) {
			shortUrl = shortUrl.substring(0, 57) + '...';
		}
		
		return shortUrl;
	};

	const toggleExpand = (id: string) => {
		setExpandedId(expandedId === id ? null : id);
	};

	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
			console.log(`${MODULE_TAG} Copied ${field} to clipboard`);
		} catch (error) {
			console.error(`${MODULE_TAG} Failed to copy to clipboard:`, error);
			// Fallback for older browsers
			try {
				const textArea = document.createElement('textarea');
				textArea.value = text;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				setCopiedField(field);
				setTimeout(() => setCopiedField(null), 2000);
			} catch (fallbackError) {
				console.error(`${MODULE_TAG} Fallback copy failed:`, fallbackError);
			}
		}
	};

	// Debug log
	useEffect(() => {
		console.log(`${MODULE_TAG} Visibility: ${isVisible}, API Calls: ${apiCalls.length}`);
	}, [isVisible, apiCalls.length]);

	return (
		<>
			{/* Global cursor style when resizing */}
			{isResizing && (
				<style>{`
					* {
						cursor: ns-resize !important;
						user-select: none !important;
					}
				`}</style>
			)}

			{/* API Table - Toggleable and Resizable */}
			{isVisible && (
				<div 
					className="super-simple-api-display"
					style={{
						position: 'fixed',
						bottom: 0,
						left: `${sidebarWidth}px`,
						right: '20px',
						height: `${Math.min(height, 400)}px`,
						maxHeight: 'calc(50vh - 20px)',
						background: 'white',
						borderTop: '3px solid #10b981',
						borderLeft: '1px solid #e5e7eb',
						borderRight: '1px solid #e5e7eb',
					display: 'flex',
					flexDirection: 'column',
					zIndex: 100,
					fontFamily: 'monospace',
						fontSize: '12px',
						boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
						borderRadius: '8px 8px 0 0',
						transition: 'left 0.3s ease',
					}}>
					{/* Resize Handle */}
					<div
						onMouseDown={() => setIsResizing(true)}
						style={{
							height: '8px',
							background: isResizing ? '#10b981' : '#f3f4f6',
							cursor: 'ns-resize',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							borderBottom: '1px solid #e5e7eb',
							transition: 'background 0.2s',
							position: 'relative',
						}}
						onMouseEnter={(e) => {
							if (!isResizing) {
								e.currentTarget.style.background = '#e5e7eb';
							}
						}}
						onMouseLeave={(e) => {
							if (!isResizing) {
								e.currentTarget.style.background = '#f3f4f6';
							}
						}}
						title="Drag to resize"
					>
						<div style={{
							width: '40px',
							height: '3px',
							background: '#9ca3af',
							borderRadius: '2px',
						}} />
						<div style={{
							position: 'absolute',
							right: '12px',
							fontSize: '9px',
							color: '#6b7280',
							fontWeight: '500',
							userSelect: 'none',
						}}>
							↕ Drag to resize
						</div>
					</div>

					{/* Scrollable Content */}
					<div style={{
						flex: 1,
						overflowY: 'auto',
						overflowX: 'hidden',
					}}>
					{/* Header */}
					<div style={{
						padding: '6px 12px',
						background: '#f9fafb',
						borderBottom: '1px solid #e5e7eb',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						position: 'sticky',
						top: 0,
						zIndex: 1,
					}}>
						<div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>
							⚡ API Calls ({apiCalls.length})
						</div>
						<button
							onClick={() => setShowClearConfirm(true)}
							style={{
								padding: '3px 8px',
								background: '#ef4444',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
								fontSize: '10px',
								fontWeight: '600',
							}}
						>
							Clear
						</button>
					</div>

					{/* Table */}
					<table style={{
						width: '100%',
						borderCollapse: 'collapse',
					}}>
						<thead style={{
							background: '#f3f4f6',
							position: 'sticky',
							top: '34px',
							zIndex: 1,
						}}>
							<tr>
								<th style={{ padding: '6px 12px', textAlign: 'center', color: '#374151', fontWeight: '600', width: '50px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									Type
								</th>
								<th style={{ padding: '6px 12px', textAlign: 'left', color: '#374151', fontWeight: '600', width: '50px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									Status
								</th>
								<th style={{ padding: '6px 12px', textAlign: 'left', color: '#374151', fontWeight: '600', width: '80px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									Method
								</th>
								<th style={{ padding: '6px 12px', textAlign: 'left', color: '#374151', fontWeight: '600', width: '60px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									Code
								</th>
								<th style={{ padding: '6px 12px', textAlign: 'left', color: '#374151', fontWeight: '600', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									URL
								</th>
								<th style={{ padding: '6px 12px', textAlign: 'left', color: '#374151', fontWeight: '600', width: '100px', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>
									Time
								</th>
							</tr>
						</thead>
						<tbody>
							{apiCalls.length === 0 ? (
								<tr>
									<td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
										<div style={{ color: '#9ca3af', fontSize: '14px' }}>
											<div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
											<div style={{ fontWeight: '600', marginBottom: '4px', color: '#6b7280' }}>
												No API Calls Yet
											</div>
											<div style={{ fontSize: '12px' }}>
												API calls will appear here as you use the flow
											</div>
										</div>
									</td>
								</tr>
							) : (
								apiCalls.map((call) => {
									const apiType = getApiTypeIcon(call.url);
									return (
									<React.Fragment key={call.id}>
										{/* Main Row */}
										<tr
											onClick={() => toggleExpand(call.id)}
											style={{
												cursor: 'pointer',
												background: expandedId === call.id ? '#f3f4f6' : 'white',
												borderBottom: '1px solid #e5e7eb',
											}}
											onMouseEnter={(e) => {
												if (expandedId !== call.id) {
													e.currentTarget.style.background = '#f9fafb';
												}
											}}
											onMouseLeave={(e) => {
												if (expandedId !== call.id) {
													e.currentTarget.style.background = 'white';
												}
											}}
										>
											<td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '16px' }} title={apiType.label}>
												{apiType.icon}
											</td>
											<td style={{ padding: '12px 16px', fontSize: '16px' }}>
												{getStatusDot(call.response?.status)}
											</td>
								<td style={{ padding: '12px 16px' }}>
									<span style={{
										padding: '3px 8px',
										background: call.method === 'GET' ? '#3b82f6' : 
										           call.method === 'POST' ? '#10b981' : 
										           call.method === 'DELETE' ? '#ef4444' : 
										           call.method === 'PATCH' ? '#f59e0b' : '#6b7280',
										color: 'white',
										borderRadius: '3px',
										fontSize: '10px',
										fontWeight: 'bold',
									}}>
										{call.method}
									</span>
								</td>
								<td style={{ padding: '8px' }}>
									<span style={{
										color: call.response?.status ? 
											call.response.status >= 200 && call.response.status < 300 ? '#10b981' :
											call.response.status >= 400 ? '#ef4444' : '#f59e0b'
											: '#6b7280',
										fontWeight: 'bold',
									}}>
										{call.response?.status || '...'}
									</span>
								</td>
								<td style={{ padding: '12px 16px', color: '#1f2937' }}>
									{call.url.startsWith('/api/') && (
										<span style={{
											padding: '1px 4px',
											background: '#374151',
											color: '#9ca3af',
											borderRadius: '2px',
											fontSize: '9px',
											marginRight: '6px',
										}}>
											PROXY
										</span>
									)}
									{getShortUrl(call.url)}
								</td>
								<td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '11px' }}>
									{new Date(call.timestamp).toLocaleTimeString()}
								</td>
							</tr>

							{/* Expanded Details Row */}
							{expandedId === call.id && ((): ReactElement => {
								const hasBody = call.body && typeof call.body === 'object' && call.body !== null && Object.keys(call.body as Record<string, unknown>).length > 0;
								const hasResponse = call.response?.data !== undefined && call.response.data !== null;
								
								const expandedRow: ReactElement = (
									<tr key={`expanded-${call.id}`} style={{ background: '#f9fafb' }}>
										<td colSpan={6} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
											<div style={{ display: 'grid', gap: '12px' }}>
												{/* Full URL */}
												<div>
													<div style={{ 
														display: 'flex', 
														alignItems: 'center', 
														justifyContent: 'space-between',
														marginBottom: '4px'
													}}>
														<div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '600' }}>
															FULL URL:
														</div>
														<button
															onClick={(e) => {
																e.stopPropagation();
																handleCopy(String(call.url || ''), `url-${call.id}`);
															}}
															style={{
																padding: '2px 6px',
																background: copiedField === `url-${call.id}` ? '#10b981' : '#e5e7eb',
																color: copiedField === `url-${call.id}` ? 'white' : '#374151',
																border: 'none',
																borderRadius: '3px',
																fontSize: '9px',
																cursor: 'pointer',
																fontWeight: '600',
															}}
															title="Copy full URL"
														>
															{copiedField === `url-${call.id}` ? '✓ Copied' : '📋 Copy'}
														</button>
													</div>
													<div style={{ color: '#2563eb', fontSize: '11px', wordBreak: 'break-all' }}>
														{String(call.url || '')}
													</div>
												</div>

												{/* Request Body */}
												{hasBody ? ((): ReactElement => {
													const bodyText = (() => {
														const body = call.body;
														if (!body) {
															return '';
														}
														if (typeof body === 'string') {
															return body;
														}
														try {
															return JSON.stringify(body, null, 2);
														} catch {
															return String(body);
														}
													})();
													
													return (
														<div>
															<div style={{ 
																display: 'flex', 
																alignItems: 'center', 
																justifyContent: 'space-between',
																marginBottom: '4px'
															}}>
																<div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '600' }}>
																	REQUEST BODY:
																</div>
																<button
																	onClick={(e) => {
																		e.stopPropagation();
																		handleCopy(bodyText, `body-${call.id}`);
																	}}
																	style={{
																		padding: '2px 6px',
																		background: copiedField === `body-${call.id}` ? '#10b981' : '#e5e7eb',
																		color: copiedField === `body-${call.id}` ? 'white' : '#374151',
																		border: 'none',
																		borderRadius: '3px',
																		fontSize: '9px',
																		cursor: 'pointer',
																		fontWeight: '600',
																	}}
																	title="Copy request body"
																>
																	{copiedField === `body-${call.id}` ? '✓ Copied' : '📋 Copy'}
																</button>
															</div>
															<pre style={{
																margin: 0,
																padding: '8px',
																background: '#f3f4f6',
																border: '1px solid #e5e7eb',
																borderRadius: '4px',
																color: '#1f2937',
																fontSize: '10px',
																overflow: 'auto',
																maxHeight: '150px',
															}}>
																{bodyText}
															</pre>
														</div>
													);
												})() : null}

											{/* Response */}
											{hasResponse && call.response ? ((): ReactElement => {
												const responseText = (() => {
													const responseData = call.response?.data;
													if (responseData === undefined || responseData === null) {
														return '';
													}
													if (typeof responseData === 'string') {
														return responseData;
													}
													try {
														return JSON.stringify(responseData, null, 2);
													} catch {
														return String(responseData);
													}
												})();
												
												return (
													<div>
														<div style={{ 
															display: 'flex', 
															alignItems: 'center', 
															justifyContent: 'space-between',
															marginBottom: '4px'
														}}>
															<div style={{ color: '#6b7280', fontSize: '10px', fontWeight: '600' }}>
																RESPONSE:
															</div>
															<button
																onClick={(e) => {
																	e.stopPropagation();
																	handleCopy(responseText, `response-${call.id}`);
																}}
																style={{
																	padding: '2px 6px',
																	background: copiedField === `response-${call.id}` ? '#10b981' : '#e5e7eb',
																	color: copiedField === `response-${call.id}` ? 'white' : '#374151',
																	border: 'none',
																	borderRadius: '3px',
																	fontSize: '9px',
																	cursor: 'pointer',
																	fontWeight: '600',
																}}
																title="Copy response"
															>
																{copiedField === `response-${call.id}` ? '✓ Copied' : '📋 Copy'}
															</button>
														</div>
														<pre style={{
															margin: 0,
															padding: '8px',
															background: '#f3f4f6',
															border: '1px solid #e5e7eb',
															borderRadius: '4px',
															color: '#1f2937',
															fontSize: '10px',
															overflow: 'auto',
															maxHeight: '200px',
														}}>
															{responseText}
														</pre>
														</div>
													);
												})() : null}

											{/* Close Button */}
											<div style={{ textAlign: 'right' }}>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setExpandedId(null);
													}}
													style={{
														padding: '4px 12px',
														background: '#6b7280',
														color: 'white',
														border: 'none',
														borderRadius: '4px',
														cursor: 'pointer',
														fontSize: '11px',
													}}
												>
													Close
												</button>
											</div>
										</div>
									</td>
								</tr>
								);
								return expandedRow;
							})()}
								</React.Fragment>
							);
						})
					)}
						</tbody>
					</table>
					</div>
					{/* End Scrollable Content */}
				</div>
			)}

			{/* Custom Confirmation Modal */}
			{showClearConfirm && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 10000,
				}}>
					<div style={{
						background: 'white',
						borderRadius: '8px',
						padding: '24px',
						maxWidth: '400px',
						boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
					}}>
						<h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1f2937' }}>
							Clear API Calls?
						</h3>
						<p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
							This will remove all {apiCalls.length} API call{apiCalls.length !== 1 ? 's' : ''} from the display. This action cannot be undone.
						</p>
						<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
							<button
								onClick={() => setShowClearConfirm(false)}
								style={{
									padding: '8px 16px',
									background: '#f3f4f6',
									color: '#374151',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Cancel
							</button>
							<button
								onClick={() => {
									apiCallTrackerService.clearApiCalls();
									setApiCalls([]);
									setExpandedId(null);
									setShowClearConfirm(false);
								}}
								style={{
									padding: '8px 16px',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '600',
								}}
							>
								Clear All
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SuperSimpleApiDisplayV8;
