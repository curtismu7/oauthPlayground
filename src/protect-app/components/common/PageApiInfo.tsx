import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ApiDisplayService from '../../services/ApiDisplayService';
import { JsonDisplay } from './JsonDisplay';

/**
 * PageApiInfo Component
 * 
 * Displays API call information (headers, body, response) at the bottom of pages
 * for easy visibility of what's happening on each page.
 * 
 * Follows SWE-15 principles:
 * - Single Responsibility: Only displays API info for the current page
 * - Interface Segregation: Minimal props, focused functionality
 * - Dependency Inversion: Depends on theme abstraction, not concrete implementation
 */
interface PageApiInfoProps {
	/** Page name for filtering relevant API calls */
	pageName: string;
	/** Whether to show the component (can be controlled by parent) */
	show?: boolean;
	/** Maximum number of API calls to display */
	maxCalls?: number;
}

export const PageApiInfo: React.FC<PageApiInfoProps> = ({
	pageName,
	show = true,
	maxCalls = 5
}) => {
	const { currentTheme } = useTheme();
	const [apiCalls, setApiCalls] = useState(ApiDisplayService.getApiCalls());
	const [expandedCall, setExpandedCall] = useState<string | null>(null);

	// Update API calls periodically
	useEffect(() => {
		const interval = setInterval(() => {
			setApiCalls(ApiDisplayService.getApiCalls());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	// Filter calls relevant to current page (simple heuristic based on URL patterns)
	const pageRelevantCalls = apiCalls
		.filter(call => {
			// Filter calls that might be relevant to this page
			const callLower = call.url.toLowerCase();
			const pageLower = pageName.toLowerCase();
			
			// Check if URL contains page-relevant keywords
			if (pageLower.includes('dashboard') && callLower.includes('risk')) return true;
			if (pageLower.includes('login') && callLower.includes('auth')) return true;
			if (pageLower.includes('risk') && callLower.includes('risk')) return true;
			if (pageLower.includes('security') && (callLower.includes('risk') || callLower.includes('signal'))) return true;
			if (pageLower.includes('user') && callLower.includes('user')) return true;
			if (pageLower.includes('setting') && callLower.includes('config')) return true;
			
			// Default: show recent calls for any page
			return true;
		})
		.slice(0, maxCalls);

	if (!show || pageRelevantCalls.length === 0) {
		return null;
	}

	const toggleExpanded = (callId: string) => {
		setExpandedCall(expandedCall === callId ? null : callId);
	};

	return (
		<div className="mt-8 border-t pt-6">
			<div className="flex items-center justify-between mb-4">
				<h3 
					className="text-lg font-semibold"
					style={{ color: currentTheme.colors.text }}
				>
					📡 Recent API Activity
				</h3>
				<span 
					className="text-xs px-2 py-1 rounded"
					style={{ 
						backgroundColor: `${currentTheme.colors.primary}20`,
						color: currentTheme.colors.primary 
					}}
				>
					{pageRelevantCalls.length} calls
				</span>
			</div>

			<div className="space-y-3">
				{pageRelevantCalls.map((call) => (
					<div
						key={call.id}
						className="border rounded-lg overflow-hidden transition-all"
						style={{ borderColor: currentTheme.colors.textSecondary }}
					>
						{/* Header */}
						<button
							type="button"
							className="w-full p-3 cursor-pointer hover:bg-opacity-50 transition-colors text-left"
							style={{
								backgroundColor: expandedCall === call.id 
									? `${currentTheme.colors.primary}10` 
									: 'transparent'
							}}
							onClick={() => toggleExpanded(call.id)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleExpanded(call.id);
								}
							}}
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<span className="text-lg">{call.apiType.icon}</span>
									<div>
										<div className="flex items-center space-x-2">
											<span 
												className="text-xs font-mono px-2 py-1 rounded"
												style={{
													backgroundColor: 
														call.method === 'GET' ? '#10b98120' :
														call.method === 'POST' ? '#3b82f620' :
														call.method === 'PUT' ? '#f59e0b20' :
														call.method === 'DELETE' ? '#ef444420' :
														'#6b728020',
													color: 
														call.method === 'GET' ? '#10b981' :
														call.method === 'POST' ? '#3b82f6' :
														call.method === 'PUT' ? '#f59e0b' :
														call.method === 'DELETE' ? '#ef4444' :
														'#6b7280'
												}}
											>
												{call.method}
											</span>
											<span 
												className="text-sm font-medium"
												style={{ color: currentTheme.colors.text }}
											>
												{call.apiType.label}
											</span>
										</div>
										<div 
											className="text-xs font-mono mt-1"
											style={{ color: currentTheme.colors.textSecondary }}
										>
											{call.url}
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									{call.response && (
										<span 
											className="text-xs px-2 py-1 rounded"
											style={{
												backgroundColor: 
													call.response.status >= 200 && call.response.status < 300 ? '#10b98120' :
													call.response.status >= 400 ? '#ef444420' :
													'#f59e0b20',
												color: 
													call.response.status >= 200 && call.response.status < 300 ? '#10b981' :
													call.response.status >= 400 ? '#ef4444' :
													'#f59e0b'
											}}
										>
											{call.response.status}
										</span>
									)}
									<span 
										className="text-xs"
										style={{ color: currentTheme.colors.textSecondary }}
									>
										{new Date(call.timestamp).toLocaleTimeString()}
									</span>
								</div>
							</div>
						</button>

						{/* Expanded Details */}
						{expandedCall === call.id && (
							<div className="border-t" style={{ borderColor: currentTheme.colors.textSecondary }}>
								{/* Headers */}
								{call.headers && Object.keys(call.headers).length > 0 && (
									<JsonDisplay
										data={call.headers}
										title="Headers"
										maxHeight="150px"
									/>
								)}

								{/* Body */}
								{call.body && (
									<JsonDisplay
										data={call.body}
										title="Request Body"
										maxHeight="200px"
									/>
								)}

								{/* Response */}
								{call.response && (
									<JsonDisplay
										data={call.response.data || 'No response data'}
										title="Response"
										maxHeight="200px"
									/>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{pageRelevantCalls.length === 0 && (
				<div 
					className="text-center py-8 text-sm"
					style={{ color: currentTheme.colors.textSecondary }}
				>
					No recent API activity for this page
				</div>
			)}
		</div>
	);
};
