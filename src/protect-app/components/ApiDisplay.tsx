/**
 * @file ApiDisplay.tsx
 * @module protect-app/components
 * @description API call display component for Protect Portal
 * @version 1.0.0
 * @since 2026-02-12
 *
 * Features:
 * - Real-time API call monitoring
 * - Category-based filtering
 * - Expandable details view
 * - Toggle functionality
 * - SWE-15 compliant design
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ApiDisplayService, { ProtectApiCall } from '../services/ApiDisplayService';

/**
 * Props for ApiDisplay component
 */
interface ApiDisplayProps {
	className?: string;
	style?: React.CSSProperties;
}

/**
 * API Display Component
 *
 * Shows real-time API calls made by the Protect Portal
 * with filtering and expandable details.
 */
export const ApiDisplay: React.FC<ApiDisplayProps> = ({ className = '', style = {} }) => {
	const { currentTheme } = useTheme();
	const [apiCalls, setApiCalls] = useState<ProtectApiCall[]>([]);
	const [expandedCall, setExpandedCall] = useState<string | null>(null);
	const [filterCategory, setFilterCategory] = useState<string>('all');
	const [config, setConfig] = useState(ApiDisplayService.getConfig());

	// Update API calls periodically
	useEffect(() => {
		const updateInterval = setInterval(() => {
			setApiCalls(ApiDisplayService.getApiCalls());
			setConfig(ApiDisplayService.getConfig());
		}, 1000);

		return () => clearInterval(updateInterval);
	}, []);

	// Filter calls based on selected category
	const filteredCalls =
		filterCategory === 'all' ? apiCalls : ApiDisplayService.getApiCallsByCategory(filterCategory);

	const stats = ApiDisplayService.getStatistics();

	const clearCalls = () => {
		ApiDisplayService.clearCalls();
		setApiCalls([]);
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString();
	};

	const getStatusColor = (status?: number) => {
		if (!status) return '#6b7280';
		if (status >= 200 && status < 300) return '#059669';
		if (status >= 300 && status < 400) return '#f59e0b';
		if (status >= 400) return '#ef4444';
		return '#6b7280';
	};

	const getMethodColor = (method: string) => {
		switch (method.toUpperCase()) {
			case 'GET':
				return '#3b82f6';
			case 'POST':
				return '#10b981';
			case 'PUT':
				return '#f59e0b';
			case 'DELETE':
				return '#ef4444';
			default:
				return '#6b7280';
		}
	};

	if (!config.enabled) {
		return null;
	}

	return (
		<div
			className={`fixed top-4 right-4 w-96 max-h-96 overflow-hidden rounded-lg shadow-2xl z-50 ${className}`}
			style={{
				backgroundColor: currentTheme.colors.surface,
				border: `1px solid ${currentTheme.colors.textSecondary}`,
				...style,
			}}
		>
			{/* Header */}
			<div
				className="px-4 py-3 border-b flex items-center justify-between"
				style={{ borderColor: currentTheme.colors.textSecondary }}
			>
				<div className="flex items-center space-x-2">
					<span className="font-semibold" style={{ color: currentTheme.colors.text }}>
						📡 API Monitor
					</span>
					<span
						className="px-2 py-1 rounded text-xs font-medium"
						style={{
							backgroundColor: currentTheme.colors.primary,
							color: 'white',
						}}
					>
						{stats.totalCalls} calls
					</span>
				</div>
				<div className="flex items-center space-x-2">
					<select
						value={filterCategory}
						onChange={(e) => setFilterCategory(e.target.value)}
						className="px-2 py-1 rounded text-xs border"
						style={{
							backgroundColor: currentTheme.colors.surface,
							borderColor: currentTheme.colors.textSecondary,
							color: currentTheme.colors.text,
						}}
					>
						<option value="all">All</option>
						<option value="auth">Auth</option>
						<option value="risk">Risk</option>
						<option value="user">User</option>
						<option value="admin">Admin</option>
						<option value="system">System</option>
					</select>
					<button
						type="button"
						onClick={clearCalls}
						className="px-2 py-1 rounded text-xs border hover:bg-opacity-80"
						style={{
							backgroundColor: currentTheme.colors.surface,
							borderColor: currentTheme.colors.textSecondary,
							color: currentTheme.colors.text,
						}}
					>
						Clear
					</button>
				</div>
			</div>

			{/* API Calls List */}
			<div className="overflow-y-auto max-h-64">
				{filteredCalls.length === 0 ? (
					<div className="p-4 text-center" style={{ color: currentTheme.colors.textSecondary }}>
						<div className="text-2xl mb-2">📡</div>
						<p className="text-sm">No API calls tracked yet</p>
					</div>
				) : (
					<div className="divide-y" style={{ borderColor: currentTheme.colors.textSecondary }}>
						{filteredCalls.map((call) => (
							<button
								key={call.id}
								type="button"
								className="w-full p-3 hover:bg-opacity-50 cursor-pointer transition-colors text-left"
								style={{
									backgroundColor:
										expandedCall === call.id ? currentTheme.colors.background : 'transparent',
									border: 'none',
									background:
										expandedCall === call.id ? currentTheme.colors.background : 'transparent',
								}}
								onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
							>
								{/* Main Info */}
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<span className="text-lg">{call.apiType.icon}</span>
										<div>
											<div
												className="font-medium text-sm"
												style={{ color: currentTheme.colors.text }}
											>
												{call.apiType.label}
											</div>
											<div className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
												{call.method} {call.url}
											</div>
										</div>
									</div>
									<div className="flex items-center space-x-2">
										<span
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: getStatusColor(call.response?.status) }}
										/>
										<span className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
											{call.response?.status || 'Pending'}
										</span>
										<span className="text-xs" style={{ color: currentTheme.colors.textSecondary }}>
											{formatTimestamp(call.timestamp)}
										</span>
									</div>
								</div>

								{/* Expanded Details */}
								{expandedCall === call.id && (
									<div
										className="mt-3 pt-3 border-t"
										style={{ borderColor: currentTheme.colors.textSecondary }}
									>
										<div className="space-y-2 text-xs">
											{/* Method */}
											<div>
												<span className="font-medium" style={{ color: currentTheme.colors.text }}>
													Method:
												</span>
												<span
													className="ml-2 px-2 py-1 rounded font-mono"
													style={{
														backgroundColor: getMethodColor(call.method),
														color: 'white',
													}}
												>
													{call.method}
												</span>
											</div>

											{/* URL */}
											<div>
												<span className="font-medium" style={{ color: currentTheme.colors.text }}>
													URL:
												</span>
												<div
													className="ml-2 p-2 rounded font-mono text-xs break-all"
													style={{
														backgroundColor: currentTheme.colors.background,
														color: currentTheme.colors.text,
														border: `1px solid ${currentTheme.colors.textSecondary}`,
													}}
												>
													{call.url}
												</div>
											</div>

											{/* Headers */}
											{call.headers && Object.keys(call.headers).length > 0 && (
												<div>
													<span className="font-medium" style={{ color: currentTheme.colors.text }}>
														Headers:
													</span>
													<div
														className="ml-2 p-2 rounded text-xs"
														style={{
															backgroundColor: currentTheme.colors.background,
															color: currentTheme.colors.text,
															border: `1px solid ${currentTheme.colors.textSecondary}`,
														}}
													>
														{Object.entries(call.headers).map(([key, value]) => (
															<div key={key}>
																<span className="font-medium">{key}:</span> {value}
															</div>
														))}
													</div>
												</div>
											)}

											{/* Body */}
											{call.body && (
												<div>
													<span className="font-medium" style={{ color: currentTheme.colors.text }}>
														Body:
													</span>
													<div
														className="ml-2 p-2 rounded text-xs overflow-auto max-h-32"
														style={{
															backgroundColor: currentTheme.colors.background,
															color: currentTheme.colors.text,
															border: `1px solid ${currentTheme.colors.textSecondary}`,
														}}
													>
														{typeof call.body === 'string' ? (
															<pre className="whitespace-pre-wrap break-words">
																{call.body}
															</pre>
														) : (
															<pre className="whitespace-pre-wrap break-words">
																{JSON.stringify(call.body, null, 2)}
															</pre>
														)}
													</div>
												</div>
											)}

											{/* Response */}
											{call.response && (
												<div>
													<span className="font-medium" style={{ color: currentTheme.colors.text }}>
														Response:
													</span>
													<div className="ml-2">
														<div
															className="px-2 py-1 rounded text-xs font-mono"
															style={{
																backgroundColor: getStatusColor(call.response.status),
																color: 'white',
															}}
														>
															Status: {call.response.status}
														</div>
														{call.response.data && (
															<div
																className="mt-2 p-2 rounded text-xs overflow-auto max-h-32"
																style={{
																	backgroundColor: currentTheme.colors.background,
																	color: currentTheme.colors.text,
																	border: `1px solid ${currentTheme.colors.textSecondary}`,
																}}
															>
																<pre className="whitespace-pre-wrap break-words">
																	{JSON.stringify(call.response.data, null, 2)}
																</pre>
															</div>
														)}
													</div>
												</div>
											)}

											{/* Proxy Info */}
											{call.isProxy && (
												<div>
													<span className="font-medium" style={{ color: currentTheme.colors.text }}>
														Proxy:
													</span>
													<span
														className="ml-2 text-xs"
														style={{ color: currentTheme.colors.textSecondary }}
													>
														✅ Routed through proxy
													</span>
												</div>
											)}
										</div>
									</div>
								)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};
