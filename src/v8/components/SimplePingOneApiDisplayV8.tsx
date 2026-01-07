/**
 * @file SimplePingOneApiDisplayV8.tsx
 * @module v8/components
 * @description Simple, educational display of PingOne API calls
 * @version 8.0.0
 * @since 2024-11-19
 *
 * Shows only the essential information:
 * - HTTP method and URL
 * - Response status code
 * - Request body (if present)
 * - Response body (if present)
 *
 * Filters out proxy calls - only shows actual PingOne API calls
 */

import React, { useEffect, useState } from 'react';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';

const MODULE_TAG = '[📡 SIMPLE-API-DISPLAY-V8]';

interface ApiCall {
	id: string;
	method: string;
	url: string;
	body?: Record<string, unknown> | string | null;
	response?: {
		status: number;
		data?: unknown;
	};
	timestamp: number;
	isProxy?: boolean;
}

export const SimplePingOneApiDisplayV8: React.FC = () => {
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [showInfo, setShowInfo] = useState(false);

	useEffect(() => {
		const updateCalls = () => {
			const allCalls = apiCallTrackerService.getApiCalls();

			// Filter to PingOne API calls (direct or via proxy)
			const pingOneCalls = allCalls
				.filter((call) => {
					const url = call.url || '';
					// Include direct PingOne calls and our proxy endpoints
					return (
						url.includes('pingone.com') ||
						url.includes('auth.pingone') ||
						url.includes('/api/pingone/')
					);
				})
				.map((call) => ({
					id: call.id,
					method: call.method,
					url: call.actualPingOneUrl || call.url,
					body: call.body,
					response: call.response,
					timestamp: call.timestamp,
					isProxy:
						typeof call.isProxy === 'boolean'
							? call.isProxy
							: Boolean(call.actualPingOneUrl && call.url?.startsWith('/api/')),
					source: call.source,
				}));

			setApiCalls(pingOneCalls);

			if (pingOneCalls.length > 0) {
				console.log(`${MODULE_TAG} Displaying ${pingOneCalls.length} API calls`);
			}
		};

		// Initial load
		updateCalls();

		// Listen for updates
		const interval = setInterval(updateCalls, 500);

		return () => clearInterval(interval);
	}, []);

	const hasCalls = apiCalls.length > 0;

	return (
		<div
			style={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				maxHeight: '400px',
				background: '#1f2937', // Dark background
				borderTop: '2px solid #10b981',
				overflowY: 'auto',
				zIndex: 1000,
				fontFamily: 'monospace',
				fontSize: '13px',
			}}
		>
			<div
				style={{
					padding: '12px 16px',
					background: '#111827',
					borderBottom: '1px solid #374151',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '14px' }}>
					📡 PingOne API Calls ({apiCalls.length})
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<button
						type="button"
						onClick={() => setShowInfo((prev) => !prev)}
						style={{
							padding: '4px 10px',
							background: showInfo ? '#dbeafe' : '#eff6ff',
							color: '#1d4ed8',
							border: '1px solid #93c5fd',
							borderRadius: '4px',
							fontSize: '12px',
							fontWeight: 600,
							cursor: 'pointer',
						}}
					>
						{showInfo ? 'Hide Info' : 'What is this?'}
					</button>
					<button
						type="button"
						onClick={() => {
							apiCallTrackerService.clearApiCalls();
							setApiCalls([]);
						}}
						style={{
							padding: '4px 12px',
							background: '#374151',
							color: '#f9fafb',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '12px',
						}}
					>
						Clear
					</button>
				</div>
			</div>

			{showInfo && (
				<div
					style={{
						padding: '14px 18px',
						background: '#fef3c7',
						borderBottom: '1px solid #fcd34d',
						color: '#7c2d12',
						fontSize: '13px',
						lineHeight: 1.6,
					}}
				>
					<strong>How to read this list:</strong>
					<ul style={{ margin: '8px 0 0 16px' }}>
						<li>
							<span style={{ fontWeight: 600 }}>PROXY</span> rows represent the browser calling our
							OAuth Playground API (e.g., <code>/api/pingone/mfa/*</code>).
						</li>
						<li>
							Rows with the blue <strong>SERVER</strong> badge mirror the real PingOne request that
							the backend just executed.
						</li>
						<li>
							Proxy + Server entries usually come in pairs so you can follow the full flow from
							browser request to PingOne API call.
						</li>
						<li>
							Timestamps, status colors, and method badges make it easy to compare timing and
							outcomes for each hop.
						</li>
					</ul>
				</div>
			)}

			<div style={{ padding: '16px' }}>
				{!hasCalls ? (
					<div
						style={{
							padding: '24px',
							textAlign: 'center',
							color: '#9ca3af',
							background: '#111827',
							borderRadius: '8px',
							border: '1px dashed #374151',
						}}
					>
						No PingOne API calls captured yet. Start an MFA or OAuth flow and the requests will
						appear here in real time.
					</div>
				) : (
					apiCalls.map((call, _index) => {
						const isProxy = call.isProxy;
						return (
							<div
								key={call.id}
								style={{
									marginBottom: '16px',
									padding: '12px',
									background: isProxy ? '#fefce8' : '#111827',
									borderRadius: '6px',
									border: isProxy ? '2px solid #fcd34d' : '1px solid #374151',
									boxShadow: isProxy ? '0 0 12px rgba(250, 204, 21, 0.35)' : 'none',
									color: isProxy ? '#0f172a' : undefined,
								}}
							>
								{/* Request Line */}
								<div
									style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
								>
									<span
										style={{
											padding: '2px 8px',
											background:
												call.method === 'GET'
													? '#3b82f6'
													: call.method === 'POST'
														? '#10b981'
														: call.method === 'DELETE'
															? '#ef4444'
															: '#f59e0b',
											color: 'white',
											borderRadius: '4px',
											fontSize: '11px',
											fontWeight: 'bold',
										}}
									>
										{call.method}
									</span>
									<span
										style={{
											padding: '2px 8px',
											background: call.response?.status
												? call.response.status >= 200 && call.response.status < 300
													? '#10b981'
													: call.response.status >= 400
														? '#ef4444'
														: '#f59e0b'
												: '#6b7280',
											color: 'white',
											borderRadius: '4px',
											fontSize: '11px',
											fontWeight: 'bold',
										}}
									>
										{call.response?.status || '...'}
									</span>
									{call.source === 'backend' && (
										<span
											style={{
												padding: '2px 8px',
												background: '#dbeafe',
												color: '#1d4ed8',
												borderRadius: '999px',
												fontSize: '11px',
												fontWeight: 700,
											}}
										>
											SERVER
										</span>
									)}
								</div>

								{/* URL */}
								<div
									style={{
										color: '#60a5fa',
										marginBottom: '8px',
										wordBreak: 'break-all',
										fontSize: '12px',
									}}
								>
									{isProxy && (
										<span
											style={{
												padding: '2px 8px',
												background: '#fef08a',
												color: '#92400e',
												borderRadius: '12px',
												fontSize: '11px',
												fontWeight: 700,
												marginRight: '10px',
												boxShadow: '0 0 0 2px rgba(250,204,21,0.4)',
											}}
										>
											PROXY
										</span>
									)}
									{call.url}
								</div>

								{/* Request Body */}
								{call.body && Object.keys(call.body).length > 0 && (
									<div style={{ marginTop: '8px' }}>
										<div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>
											Request Body:
										</div>
										<pre
											style={{
												margin: 0,
												padding: '8px',
												background: '#0f172a',
												borderRadius: '4px',
												color: '#e5e7eb',
												fontSize: '11px',
												overflow: 'auto',
												maxHeight: '150px',
											}}
										>
											{JSON.stringify(call.body, null, 2)}
										</pre>
									</div>
								)}

								{/* Response Body */}
								{call.response?.data && (
									<div style={{ marginTop: '8px' }}>
										<div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>
											Response:
										</div>
										<pre
											style={{
												margin: 0,
												padding: '8px',
												background: '#0f172a',
												borderRadius: '4px',
												color: '#e5e7eb',
												fontSize: '11px',
												overflow: 'auto',
												maxHeight: '150px',
											}}
										>
											{JSON.stringify(call.response.data, null, 2)}
										</pre>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default SimplePingOneApiDisplayV8;
