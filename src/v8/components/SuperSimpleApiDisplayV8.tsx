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

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import { apiDisplayServiceV8 } from '@/v8/services/apiDisplayServiceV8';

const MODULE_TAG = '[⚡ SUPER-SIMPLE-API-V8]';

interface ApiCall {
	id: string;
	method: string;
	url: string;
	body?: unknown;
	response?:
		| {
				status: number;
				data?: unknown;
		  }
		| undefined;
	timestamp: number;
}

// Helper function to create fully functional pop-out window
const createPopOutWindow = (
	apiCalls: ApiCall[],
	fontSize: number,
	_onFontSizeChange: (newSize: number) => void, // Unused - font size changes are handled via postMessage
	flowFilter: 'unified' | 'mfa' | 'spiffe-spire' | 'all',
	excludePatterns: string[],
	includePatterns: string[]
): Window | null => {
	const width = 1400;
	const height = 900;
	const left = (window.screen.width - width) / 2;
	const top = (window.screen.height - height) / 2;
	const newWindow = window.open(
		'',
		'apiDisplay',
		`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
	);
	
	if (!newWindow) return null;

	// Create a fully functional HTML page with JavaScript
	const html = `<!DOCTYPE html>
<html>
<head>
	<title>API Display - Pop Out</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: monospace;
			background: white;
			overflow: hidden;
		}
		.expanded-row { background: #f9fafb !important; }
		.expanded-row td { padding: 12px !important; }
		.copy-btn { 
			padding: 2px 6px; 
			background: #e5e7eb; 
			color: #374151; 
			border: none; 
			border-radius: 3px; 
			font-size: 9px; 
			cursor: pointer; 
			font-weight: 600;
		}
		.copy-btn:hover { background: #d1d5db; }
		.copy-btn.copied { background: #10b981; color: white; }
		.json-display {
			background: white;
			padding: 12px;
			border-radius: 4px;
			font-size: 12px;
			overflow-x: auto;
			max-height: 400px;
			overflow-y: auto;
		}
		pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
	</style>
</head>
<body>
	<div id="api-display-root"></div>
	<script>
		(function() {
			let currentApiCalls = ${JSON.stringify(apiCalls)};
			let currentFontSize = ${fontSize};
			let expandedIds = new Set();
			let copiedField = null;
			const flowFilter = ${JSON.stringify(flowFilter)};
			const excludePatterns = ${JSON.stringify(excludePatterns)};
			const includePatterns = ${JSON.stringify(includePatterns)};

			function getStatusDot(status) {
				if (!status) return '⚪';
				if (status >= 200 && status < 300) return '🟢';
				return '🔴';
			}

			function getApiTypeIcon(url) {
				const isAdminApi = url.includes('/as/token') || 
					url.includes('/users?filter=') || 
					(url.includes('/users/') && (url.includes('/devices') || url.includes('/mfa'))) ||
					url.includes('lookup-user') || 
					url.includes('register-device') || 
					url.includes('mfa/') || 
					(url.includes('/environments/') && !url.includes('/authorize'));
				return isAdminApi ? { icon: '🔑', label: 'Admin API (Worker Token)' } : { icon: '👤', label: 'User API' };
			}

			function getShortUrl(url) {
				let shortUrl = url
					.replace('https://api.pingone.com/v1/', '')
					.replace('https://auth.pingone.com/', 'auth/')
					.replace('/api/pingone/mfa/', 'mfa/');
				if (shortUrl.length > 60) {
					shortUrl = shortUrl.substring(0, 57) + '...';
				}
				return shortUrl;
			}

			function toggleExpand(id) {
				if (expandedIds.has(id)) {
					expandedIds.delete(id);
				} else {
					expandedIds.add(id);
				}
				render();
			}

			function expandAll() {
				currentApiCalls.forEach(call => expandedIds.add(call.id));
				render();
			}

			function collapseAll() {
				expandedIds.clear();
				render();
			}

			async function handleCopy(text, field) {
				try {
					await navigator.clipboard.writeText(text);
					copiedField = field;
					setTimeout(() => { copiedField = null; render(); }, 2000);
					render();
				} catch (error) {
					try {
						const textArea = document.createElement('textarea');
						textArea.value = text;
						textArea.style.position = 'fixed';
						textArea.style.left = '-999999px';
						document.body.appendChild(textArea);
						textArea.select();
						document.execCommand('copy');
						document.body.removeChild(textArea);
						copiedField = field;
						setTimeout(() => { copiedField = null; render(); }, 2000);
						render();
					} catch (e) {
						console.error('Copy failed:', e);
					}
				}
			}

			function decreaseFont() {
				currentFontSize = Math.max(8, currentFontSize - 1);
				localStorage.setItem('apiDisplay.fontSize', currentFontSize);
				if (window.opener) {
					window.opener.postMessage({ type: 'fontSizeChange', fontSize: currentFontSize }, '*');
				}
				render();
			}

			function increaseFont() {
				currentFontSize = Math.min(24, currentFontSize + 1);
				localStorage.setItem('apiDisplay.fontSize', currentFontSize);
				if (window.opener) {
					window.opener.postMessage({ type: 'fontSizeChange', fontSize: currentFontSize }, '*');
				}
				render();
			}

			function clearCalls() {
				if (confirm('Clear all API calls?')) {
					currentApiCalls = [];
					expandedIds.clear();
					if (window.opener) {
						window.opener.postMessage({ type: 'clearCalls' }, '*');
					}
					render();
				}
			}

			function render() {
				const root = document.getElementById('api-display-root');
				if (!root) return;

				// IMPORTANT: The main window already applies all flow and Hide PROXY
				// logic when building apiCalls. To guarantee the pop-out shows the
				// exact same set of calls (including backend PingOne calls), we do
				// not re-filter here.
				const filteredCalls = currentApiCalls;

				const html = \`
					<div style="width: 100%; height: 100vh; display: flex; flex-direction: column; font-family: monospace; font-size: \${currentFontSize}px; background: white;">
						<div style="padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
							<div style="color: #10b981; font-weight: bold; font-size: \${currentFontSize + 2}px;">
								⚡ API Calls (\${filteredCalls.length}) - Pop Out Window
							</div>
							<div style="display: flex; gap: 8px; align-items: center;">
								<div style="display: flex; gap: 4px; align-items: center; margin-right: 8px; padding: 4px 8px; background: #e5e7eb; border-radius: 4px;">
									<button onclick="window.decreaseFont()" style="padding: 4px 8px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 3px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">−</button>
									<span style="font-size: \${currentFontSize - 2}px; color: #6b7280; min-width: 32px; text-align: center;">\${currentFontSize}px</span>
									<button onclick="window.increaseFont()" style="padding: 4px 8px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 3px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">+</button>
								</div>
								\${filteredCalls.length > 0 ? \`
									<button onclick="window.expandAll()" style="padding: 6px 12px; background: \${expandedIds.size === filteredCalls.length ? '#10b981' : '#3b82f6'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">▼ Expand All</button>
									<button onclick="window.collapseAll()" style="padding: 6px 12px; background: \${expandedIds.size === 0 ? '#6b7280' : '#3b82f6'}; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">▲ Collapse All</button>
									<button onclick="window.clearCalls()" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">Clear</button>
								\` : ''}
								<button onclick="window.close()" style="padding: 6px 12px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: \${currentFontSize - 2}px; font-weight: 600;">✕ Close</button>
							</div>
						</div>
						<div style="flex: 1; overflow-y: auto; padding: 16px;">
							\${filteredCalls.length === 0 ? \`
								<div style="text-align: center; padding: 40px; color: #9ca3af;">
									<div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
									<div style="font-weight: 600; margin-bottom: 8px; color: #6b7280; font-size: \${currentFontSize + 2}px;">No API Calls Yet</div>
									<div style="font-size: \${currentFontSize}px;">API calls will appear here as you use the flow</div>
								</div>
							\` : \`
								<table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
									<thead style="background: #f3f4f6; position: sticky; top: 0; z-index: 1;">
										<tr>
											<th style="padding: 8px 12px; text-align: center; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px;">Type</th>
											<th style="padding: 8px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px;">Status</th>
											<th style="padding: 8px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px;">Method</th>
											<th style="padding: 8px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px;">Code</th>
											<th style="padding: 8px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px; width: 40%;">URL</th>
											<th style="padding: 8px 12px; text-align: left; color: #374151; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-size: \${currentFontSize}px;">Time</th>
										</tr>
									</thead>
									<tbody>
										\${filteredCalls.map(call => {
											const status = call.response?.status || 0;
											const statusColor = status >= 200 && status < 300 ? '#10b981' : status >= 400 ? '#ef4444' : '#f59e0b';
											const methodColor = call.method === 'GET' ? '#3b82f6' : call.method === 'POST' ? '#10b981' : call.method === 'DELETE' ? '#ef4444' : '#6b7280';
											const apiType = getApiTypeIcon(call.url);
											const isExpanded = expandedIds.has(call.id);
											const hasBody = call.body && typeof call.body === 'object' && Object.keys(call.body).length > 0;
											const hasResponse = call.response?.data !== undefined && call.response.data !== null;
											const bodyText = hasBody ? (typeof call.body === 'string' ? call.body : JSON.stringify(call.body, null, 2)) : '';
											const responseText = hasResponse ? JSON.stringify(call.response.data, null, 2) : '';
											const bodyTextEscaped = bodyText.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
											const responseTextEscaped = responseText.replace(/\\\\/g, '\\\\\\\\').replace(/'/g, "\\\\'").replace(/"/g, '\\\\"').replace(/\\n/g, '\\\\n');
											const urlEscaped = call.url.replace(/'/g, "\\\\'");
											
											return \`
												<tr onclick="window.toggleExpand('\${call.id}')" style="cursor: pointer; background: \${isExpanded ? '#f3f4f6' : 'white'}; border-bottom: 1px solid #e5e7eb;" onmouseover="this.style.background='\${isExpanded ? '#f3f4f6' : '#f9fafb'}'" onmouseout="this.style.background='\${isExpanded ? '#f3f4f6' : 'white'}'">
													<td style="padding: 12px; text-align: center; font-size: \${currentFontSize + 4}px;" title="\${apiType.label}">\${apiType.icon}</td>
													<td style="padding: 12px; font-size: \${currentFontSize + 4}px;">\${getStatusDot(status)}</td>
													<td style="padding: 12px;"><span style="padding: 4px 8px; background: \${methodColor}; color: white; border-radius: 3px; font-size: \${currentFontSize}px; font-weight: bold;">\${call.method}</span></td>
													<td style="padding: 12px; color: \${statusColor}; font-weight: bold; font-size: \${currentFontSize}px;">\${status || '...'}</td>
													<td style="padding: 12px; color: #1f2937; font-size: \${currentFontSize}px; word-break: break-all; white-space: normal; overflow-wrap: anywhere;">
														\${call.url.startsWith('/api/') ? '<span style="padding: 2px 6px; background: #374151; color: #9ca3af; border-radius: 2px; font-size: ' + (currentFontSize - 2) + 'px; margin-right: 6px;">PROXY</span>' : ''}\${getShortUrl(call.url)}</td>
													<td style="padding: 12px; color: #6b7280; font-size: \${currentFontSize}px;">\${new Date(call.timestamp).toLocaleTimeString()}</td>
												</tr>
												\${isExpanded ? \`
													<tr class="expanded-row">
														<td colspan="6" style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
															<div style="display: grid; gap: 12px;">
																<div>
																	<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
																		<div style="color: #6b7280; font-size: 10px; font-weight: 600;">FULL URL:</div>
																		<button class="copy-btn \${copiedField === 'url-' + call.id ? 'copied' : ''}" onclick="event.stopPropagation(); window.handleCopy('\${urlEscaped}', 'url-\${call.id}')">\${copiedField === 'url-' + call.id ? '✓ Copied' : '📋 Copy'}</button>
																	</div>
																	<div style="color: #2563eb; font-size: 11px; word-break: break-all; white-space: normal; overflow-wrap: anywhere;">\${call.url}</div>
																</div>
																\${hasBody ? \`
																	<div>
																		<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
																			<div style="color: #6b7280; font-size: 10px; font-weight: 600;">REQUEST BODY:</div>
																			<button class="copy-btn \${copiedField === 'body-' + call.id ? 'copied' : ''}" onclick="event.stopPropagation(); window.handleCopy('\${bodyTextEscaped}', 'body-\${call.id}')">\${copiedField === 'body-' + call.id ? '✓ Copied' : '📋 Copy'}</button>
																		</div>
																		<div class="json-display"><pre>\${bodyText}</pre></div>
																	</div>
																\` : ''}
																\${hasResponse ? \`
																	<div>
																		<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
																			<div style="color: #6b7280; font-size: 10px; font-weight: 600;">RESPONSE:</div>
																			<button class="copy-btn \${copiedField === 'response-' + call.id ? 'copied' : ''}" onclick="event.stopPropagation(); window.handleCopy('\${responseTextEscaped}', 'response-\${call.id}')">\${copiedField === 'response-' + call.id ? '✓ Copied' : '📋 Copy'}</button>
																		</div>
																		<div class="json-display"><pre>\${responseText}</pre></div>
																	</div>
																\` : ''}
															</div>
														</td>
													</tr>
												\` : ''}
											\`;
										}).join('')}
									</tbody>
								</table>
							\`}
						</div>
					</div>
				\`;
				root.innerHTML = html;
			}

			// Expose functions to window
			window.decreaseFont = decreaseFont;
			window.increaseFont = increaseFont;
			window.toggleExpand = toggleExpand;
			window.expandAll = expandAll;
			window.collapseAll = collapseAll;
			window.handleCopy = handleCopy;
			window.clearCalls = clearCalls;

			// Listen for updates from main window
			window.addEventListener('message', (event) => {
				if (event.data.type === 'apiCallsUpdate') {
					currentApiCalls = event.data.apiCalls || [];
					render();
				} else if (event.data.type === 'fontSizeChange') {
					currentFontSize = event.data.fontSize;
					localStorage.setItem('apiDisplay.fontSize', currentFontSize);
					render();
				} else if (event.data.type === 'clearCalls') {
					currentApiCalls = [];
					expandedIds.clear();
					render();
				}
			});

			// Initial render
			render();
		})();
	</script>
</body>
</html>`;

	newWindow.document.write(html);
	newWindow.document.close();

	return newWindow;
};

export const ApiDisplayCheckbox: React.FC = () => {
	const [isVisible, setIsVisible] = useState(apiDisplayServiceV8.isVisible());
	const [callCount, setCallCount] = useState(0);

	useEffect(() => {
		// Subscribe to visibility changes from service
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsVisible(visible);
		});

		// Update call count
		const updateCount = () => {
			const allCalls = apiCallTrackerService.getApiCalls();
			const pingOneCalls = allCalls.filter((call) => {
				const url = call.url || '';
				return (
					url.includes('pingone.com') ||
					url.includes('auth.pingone') ||
					url.includes('/api/pingone/')
				);
			});
			setCallCount(pingOneCalls.length);
		};

		updateCount();
		const interval = setInterval(updateCount, 500);

		return () => {
			clearInterval(interval);
			unsubscribe();
		};
	}, []);

	const handleToggle = () => {
		apiDisplayServiceV8.toggle();
	};

	return (
		<label
			style={{
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
			}}
		>
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

interface SuperSimpleApiDisplayV8Props {
	/** Filter to only show calls from a specific flow */
	flowFilter?: 'unified' | 'mfa' | 'spiffe-spire' | 'all';
	/** Exclude URL patterns (e.g., ['/api/pingone/mfa/']) */
	excludePatterns?: string[];
	/** Include only URL patterns (e.g., ['/api/pingone/redirectless/']) */
	includePatterns?: string[];
}

export const SuperSimpleApiDisplayV8: React.FC<SuperSimpleApiDisplayV8Props> = ({
	flowFilter = 'all',
	excludePatterns = [],
	includePatterns = [],
}) => {
	const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
	const [isVisible, setIsVisible] = useState(apiDisplayServiceV8.isVisible());
	const [height, setHeight] = useState(300);
	const [isResizing, setIsResizing] = useState(false);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [sidebarWidth, setSidebarWidth] = useState(280);
	const [previousCallCount, setPreviousCallCount] = useState(0);
	const [fontSize, setFontSize] = useState(() => {
		// Load font size from localStorage, default to 12px
		try {
			const saved = localStorage.getItem('apiDisplay.fontSize');
			return saved ? parseInt(saved, 10) : 12;
		} catch {
			return 12;
		}
	});
	const [popOutWindow, setPopOutWindow] = useState<Window | null>(null);

	// Use refs to track array props and prevent infinite loops from reference changes
	const excludePatternsRef = useRef<string[]>(excludePatterns);
	const includePatternsRef = useRef<string[]>(includePatterns);
	const updateCallsRef = useRef<(() => void) | null>(null);
	
	// Update refs only when array contents actually change, and trigger immediate update
	useEffect(() => {
		const excludeChanged = JSON.stringify(excludePatternsRef.current) !== JSON.stringify(excludePatterns);
		const includeChanged = JSON.stringify(includePatternsRef.current) !== JSON.stringify(includePatterns);
		
		if (excludeChanged || includeChanged) {
			excludePatternsRef.current = excludePatterns;
			includePatternsRef.current = includePatterns;
			// Trigger immediate update when patterns change
			if (updateCallsRef.current) {
				updateCallsRef.current();
			}
		}
	}, [excludePatterns, includePatterns]);

	useEffect(() => {
		// Subscribe to visibility changes from service
		const unsubscribe = apiDisplayServiceV8.subscribe((visible) => {
			setIsVisible(visible);
		});
		return () => unsubscribe();
	}, []);

	// Save font size to localStorage when it changes
	useEffect(() => {
		try {
			localStorage.setItem('apiDisplay.fontSize', String(fontSize));
		} catch {
			// Ignore localStorage errors
		}
	}, [fontSize]);

	// Handle pop-out window close and sync API calls via postMessage
	useEffect(() => {
		if (popOutWindow) {
			const checkClosed = setInterval(() => {
				if (popOutWindow.closed) {
					setPopOutWindow(null);
					clearInterval(checkClosed);
				} else {
					// Send API calls update to pop-out window
					try {
						popOutWindow.postMessage({
							type: 'apiCallsUpdate',
							apiCalls: apiCalls,
						}, '*');
					} catch (error) {
						console.warn(`${MODULE_TAG} Failed to sync to pop-out window:`, error);
					}
				}
			}, 500); // Update every 500ms for real-time sync
			return () => clearInterval(checkClosed);
		}
		return undefined;
	}, [popOutWindow, apiCalls]);

	// Listen for font size changes from pop-out window
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === 'fontSizeChange') {
				setFontSize(event.data.fontSize);
			} else if (event.data.type === 'clearCalls') {
				apiCallTrackerService.clearApiCalls();
			}
		};
		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

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
			const sidebar = document.querySelector(
				'[class*="sidebar"], [data-testid="sidebar"], nav[role="navigation"], aside'
			);
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

	const updateCalls = useCallback(() => {
		try {
			const allCalls = apiCallTrackerService.getApiCalls();

			// Filter to PingOne API calls (direct or via proxy) and SPIFFE/SPIRE lab calls
			const relevantCalls = allCalls
				.filter((call) => {
					const url = call.url || '';
					const actualPingOneUrl = (call as { actualPingOneUrl?: string }).actualPingOneUrl || '';
					const step = (call as { step?: string }).step;
					
					// Check both url and actualPingOneUrl for PingOne API calls
					const isPingOne =
						url.includes('pingone.com') ||
						url.includes('auth.pingone') ||
						url.includes('/api/pingone/') ||
						url.includes('/api/device-authorization') || // Device authorization proxy endpoint
						url.includes('/api/token-exchange') || // Token exchange proxy endpoint (used by device flow)
						url.includes('/api/client-credentials') || // Client credentials proxy endpoint
						url.includes('/api/par') || // PAR (Pushed Authorization Request) proxy endpoint
						url.includes('/as/device') || // Direct device authorization endpoint
						url.includes('/as/par') || // Direct PAR endpoint
						actualPingOneUrl.includes('pingone.com') || // Check actualPingOneUrl too
						actualPingOneUrl.includes('auth.pingone');
					const isSpiffeSpire = !!step && step.startsWith('spiffe-spire-');
					
					if (!isPingOne && !isSpiffeSpire) {
						return false;
					}

					// Flow-specific filtering
					if (flowFilter === 'unified') {
						// Unified flow: exclude MFA calls, include redirectless, token, authorize, etc.
						// Explicitly exclude MFA-specific endpoints
						if (url.includes('/api/pingone/mfa/')) {
							return false;
						}
						// Include unified flow patterns (OAuth/OIDC flows)
						const isUnifiedFlow =
							url.includes('/api/pingone/redirectless/') ||
							url.includes('/api/pingone/token') ||
							url.includes('/api/pingone/authorize') ||
							url.includes('/api/pingone/resume') ||
							url.includes('/api/pingone/flows/') ||
							url.includes('/api/device-authorization') || // Device authorization flow
							url.includes('/api/token-exchange') || // Token exchange (used by device flow)
							url.includes('/api/client-credentials') || // Client credentials flow
							url.includes('/api/par') || // PAR (Pushed Authorization Request) flow
							url.includes('/as/authorize') ||
							url.includes('/as/token') ||
							url.includes('/as/userinfo') ||
							url.includes('/as/introspect') ||
							url.includes('/as/revoke') ||
							url.includes('/as/device') || // Direct device authorization endpoint
							url.includes('/as/par') || // Direct PAR endpoint
							step?.startsWith('unified-');
						return isUnifiedFlow;
					} else if (flowFilter === 'mfa') {
						// MFA flow: only MFA calls (device management, challenges, etc.)
						// Check both url, actualPingOneUrl, and step
						return url.includes('/api/pingone/mfa/') || 
						       actualPingOneUrl.includes('/users/') && actualPingOneUrl.includes('/devices') || // PingOne devices endpoint
						       step?.startsWith('mfa-');
					} else if (flowFilter === 'spiffe-spire') {
						// SPIFFE/SPIRE: only SPIFFE/SPIRE calls (identified by step prefix)
						return isSpiffeSpire;
					}
					// flowFilter === 'all': show all PingOne API calls (default behavior)

					// Apply exclude patterns
					if (excludePatternsRef.current.length > 0) {
						const shouldExclude = excludePatternsRef.current.some((pattern) => url.includes(pattern));
						if (shouldExclude) {
							return false;
						}
					}

					// Apply include patterns (if specified, only show matching calls)
					if (includePatternsRef.current.length > 0) {
						const shouldInclude = includePatternsRef.current.some((pattern) => url.includes(pattern));
						if (!shouldInclude) {
							return false;
						}
					}

					return true;
				})
				.map((call) => {
					// Use actualPingOneUrl if available, otherwise use url
					const displayUrl = (call as { actualPingOneUrl?: string }).actualPingOneUrl || call.url || '';
					const apiCall: ApiCall = {
						id: String(call.id || ''),
						method: String(call.method || 'GET'),
						url: String(displayUrl), // Use actual PingOne URL for display
						body: call.body,
						timestamp:
							call.timestamp instanceof Date
								? call.timestamp.getTime()
								: new Date(call.timestamp).getTime(),
					};
					if (call.response) {
						apiCall.response = {
							status: Number(call.response.status) || 0,
							data: call.response.data,
						};
					}
					return apiCall;
				});

			// Only log when call count changes to reduce console noise
			if (relevantCalls.length !== previousCallCount) {
				if (relevantCalls.length > 0) {
					console.log(`${MODULE_TAG} Found ${relevantCalls.length} API calls`);
				}
				setPreviousCallCount(relevantCalls.length);
			}

			setApiCalls(relevantCalls);
		} catch (error) {
			console.error(`${MODULE_TAG} Error updating API calls:`, error);
		}
	}, [flowFilter, previousCallCount]);

	// Store updateCalls in ref so it can be called from other effects
	updateCallsRef.current = updateCalls;

	// Subscribe to API call updates
	useEffect(() => {
		const unsubscribe = apiCallTrackerService.subscribe(() => {
			updateCalls();
		});

		// Initial update
		updateCalls();

		// Poll for updates (in case subscription doesn't catch all updates)
		const interval = setInterval(updateCalls, 1000);

		return () => {
			unsubscribe();
			clearInterval(interval);
		};
	}, [updateCalls]);

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
			(url.includes('/users/') && (url.includes('/devices') || url.includes('/mfa'))) || // Device management
			url.includes('lookup-user') || // Proxy user lookup
			url.includes('register-device') || // Proxy device registration
			url.includes('mfa/') || // MFA proxy endpoints
			(url.includes('/environments/') && !url.includes('/authorize')); // Management API

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
			shortUrl = `${shortUrl.substring(0, 57)}...`;
		}

		return shortUrl;
	};

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	};

	const expandAll = () => {
		const allIds = new Set(apiCalls.map((call) => call.id));
		setExpandedIds(allIds);
	};

	const collapseAll = () => {
		setExpandedIds(new Set());
	};

	const isExpanded = (id: string) => {
		return expandedIds.has(id);
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

	// Shared base style for header buttons (Pop Out, Expand/Collapse, Clear, Close)
	const headerButtonBaseStyle: React.CSSProperties = {
		padding: '3px 8px',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: `${Math.max(8, fontSize - 2)}px`,
		fontWeight: 600,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 4,
		height: `${Math.max(8, fontSize - 2) * 2.6}px`,
	};

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
						// Start smaller when there are no API calls so we don't hide key buttons
						height: `${apiCalls.length === 0 ? 140 : Math.min(height, 400)}px`,
						maxHeight: apiCalls.length === 0 ? '180px' : 'calc(50vh - 20px)',
						background: 'white',
						borderTop: '3px solid #10b981',
						borderLeft: '1px solid #e5e7eb',
						borderRight: '1px solid #e5e7eb',
						display: 'flex',
						flexDirection: 'column',
						zIndex: 100,
						fontFamily: 'monospace',
						fontSize: `${fontSize}px`,
						boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
						borderRadius: '8px 8px 0 0',
						transition: 'left 0.3s ease',
					}}
				>
					{/* Resize Handle */}
					<div
						role="button"
						aria-label="Resize API calls panel"
						tabIndex={0}
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
						<div
							style={{
								width: '40px',
								height: '3px',
								background: '#9ca3af',
								borderRadius: '2px',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								right: '12px',
								fontSize: '9px',
								color: '#6b7280',
								fontWeight: '500',
								userSelect: 'none',
							}}
						>
							↕ Drag to resize
						</div>
					</div>

					{/* Scrollable Content */}
					<div
						style={{
							flex: 1,
							overflowY: 'auto',
							overflowX: 'hidden',
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: '6px 12px',
								background: '#f9fafb', // Light grey background
								borderBottom: '1px solid #e5e7eb',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								position: 'sticky',
								top: 0,
								zIndex: 1,
							}}
						>
							<div style={{ color: '#10b981', fontWeight: 'bold', fontSize: `${fontSize}px` }}>
								⚡ API Calls ({apiCalls.length})
							</div>
							<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
								{/* Font Size Controls */}
								<div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginRight: '8px', padding: '2px 6px', background: '#e5e7eb', borderRadius: '4px' }}>
									<button
										type="button"
										onClick={() => setFontSize((prev) => Math.max(8, prev - 1))}
										style={{
											padding: '2px 6px',
											background: 'white',
											color: '#374151',
											border: '1px solid #d1d5db',
											borderRadius: '3px',
											cursor: 'pointer',
											fontSize: `${Math.max(8, fontSize - 2)}px`,
											fontWeight: '600',
										}}
										title="Decrease font size"
									>
										−
									</button>
									<span style={{ fontSize: `${Math.max(8, fontSize - 2)}px`, color: '#6b7280', minWidth: '24px', textAlign: 'center' }}>
										{fontSize}px
									</span>
									<button
										type="button"
										onClick={() => setFontSize((prev) => Math.min(24, prev + 1))}
										style={{
											padding: '2px 6px',
											background: 'white',
											color: '#374151',
											border: '1px solid #d1d5db',
											borderRadius: '3px',
											cursor: 'pointer',
											fontSize: `${Math.max(8, fontSize - 2)}px`,
											fontWeight: '600',
										}}
										title="Increase font size"
									>
										+
									</button>
								</div>
								{/* Pop Out Button */}
								<button
									type="button"
									onClick={() => {
										if (popOutWindow && !popOutWindow.closed) {
											popOutWindow.focus();
											return;
										}
										const newWindow = createPopOutWindow(
											apiCalls,
											fontSize,
											(newSize) => setFontSize(newSize),
											flowFilter,
											excludePatterns,
											includePatterns
										);
										if (newWindow) {
											setPopOutWindow(newWindow);
										}
									}}
									style={{
										...headerButtonBaseStyle,
										background: '#8b5cf6',
										color: 'white',
									}}
									title="Open API display in new window"
								>
									🔲 Pop Out
								</button>
								{apiCalls.length > 0 && (
									<>
										<button
											type="button"
											onClick={expandAll}
											style={{
												...headerButtonBaseStyle,
												background: expandedIds.size === apiCalls.length ? '#10b981' : '#3b82f6',
												color: 'white',
											}}
											title="Expand all API calls"
										>
											▼ Expand All
										</button>
										<button
											type="button"
											onClick={collapseAll}
											style={{
												...headerButtonBaseStyle,
												background: expandedIds.size === 0 ? '#6b7280' : '#3b82f6',
												color: 'white',
											}}
											title="Collapse all API calls"
										>
											▲ Collapse All
										</button>
									</>
								)}
								<button
									type="button"
									onClick={() => setShowClearConfirm(true)}
									style={{
										...headerButtonBaseStyle,
										background: '#ef4444',
										color: 'white',
									}}
									title="Clear all API calls"
								>
									Clear
								</button>
								<button
									type="button"
									onClick={() => apiDisplayServiceV8.hide()}
									style={{
										...headerButtonBaseStyle,
										background: '#6b7280',
										color: 'white',
									}}
									title="Close API calls panel"
								>
									✕ Close
								</button>
							</div>
						</div>

						{/* Table */}
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
							}}
						>
							<thead
								style={{
									background: '#f3f4f6',
									position: 'sticky',
									top: '34px',
									zIndex: 1,
								}}
							>
								<tr>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'center',
											color: '#374151',
											fontWeight: '600',
											width: '50px',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										Type
									</th>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'left',
											color: '#374151',
											fontWeight: '600',
											width: '50px',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										Status
									</th>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'left',
											color: '#374151',
											fontWeight: '600',
											width: '80px',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										Method
									</th>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'left',
											color: '#374151',
											fontWeight: '600',
											width: '60px',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										Code
									</th>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'left',
											color: '#374151',
											fontWeight: '600',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										URL
									</th>
									<th
										style={{
											padding: '6px 12px',
											textAlign: 'left',
											color: '#374151',
											fontWeight: '600',
											width: '100px',
											borderBottom: '1px solid #e5e7eb',
											fontSize: `${fontSize}px`,
										}}
									>
										Time
									</th>
								</tr>
							</thead>
							<tbody>
								{apiCalls.length === 0 && (
									<tr>
										<td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center' }}>
											<div style={{ color: '#9ca3af', fontSize: `${fontSize + 2}px` }}>
												<div style={{ fontSize: `${fontSize * 2.5}px`, marginBottom: '12px' }}>⚡</div>
												<div style={{ fontWeight: '600', marginBottom: '4px', color: '#6b7280', fontSize: `${fontSize + 2}px` }}>
													No API Calls Yet
												</div>
												<div style={{ fontSize: `${fontSize}px` }}>
													API calls will appear here as you use the flow
												</div>
											</div>
										</td>
									</tr>
								)}
								{apiCalls.length > 0 &&
									apiCalls.map((call) => {
										const apiType = getApiTypeIcon(call.url);
										return (
											<React.Fragment key={call.id}>
												{/* Main Row */}
												<tr
													onClick={() => toggleExpand(call.id)}
													style={{
														cursor: 'pointer',
														background: isExpanded(call.id) ? '#f3f4f6' : 'white',
														borderBottom: '1px solid #e5e7eb',
													}}
													onMouseEnter={(e) => {
														if (!isExpanded(call.id)) {
															e.currentTarget.style.background = '#f9fafb';
														}
													}}
													onMouseLeave={(e) => {
														if (!isExpanded(call.id)) {
															e.currentTarget.style.background = 'white';
														}
													}}
												>
													<td
														style={{ padding: '12px 16px', textAlign: 'center', fontSize: `${fontSize + 4}px` }}
														title={apiType.label}
													>
														{apiType.icon}
													</td>
													<td style={{ padding: '12px 16px', fontSize: `${fontSize + 4}px` }}>
														{getStatusDot(call.response?.status)}
													</td>
													<td style={{ padding: '12px 16px' }}>
														<span
															style={{
																padding: '3px 8px',
																background:
																	call.method === 'GET'
																		? '#3b82f6'
																		: call.method === 'POST'
																			? '#10b981'
																			: call.method === 'DELETE'
																				? '#ef4444'
																				: call.method === 'PATCH'
																					? '#f59e0b'
																					: '#6b7280',
																color: 'white',
																borderRadius: '3px',
																fontSize: `${Math.max(8, fontSize - 2)}px`,
																fontWeight: 'bold',
															}}
														>
															{call.method}
														</span>
													</td>
													<td style={{ padding: '8px' }}>
														<span
															style={{
																color: call.response?.status
																	? call.response.status >= 200 && call.response.status < 300
																		? '#10b981'
																		: call.response.status >= 400
																			? '#ef4444'
																			: '#f59e0b'
																	: '#6b7280',
																fontWeight: 'bold',
																fontSize: `${fontSize}px`,
															}}
														>
															{call.response?.status || '...'}
														</span>
													</td>
													<td style={{ padding: '12px 16px', color: '#1f2937', fontSize: `${fontSize}px` }}>
														{call.url.startsWith('/api/') && (
															<span
																style={{
																	padding: '1px 4px',
																	background: '#374151',
																	color: '#9ca3af',
																	borderRadius: '2px',
																	fontSize: '9px',
																	marginRight: '6px',
																}}
															>
																PROXY
															</span>
														)}
														{call.url}
													</td>
													<td style={{ padding: '12px 16px', color: '#6b7280', fontSize: `${fontSize}px` }}>
														{new Date(call.timestamp).toLocaleTimeString()}
													</td>
												</tr>

												{/* Expanded Details Row */}
												{isExpanded(call.id) && (
													<tr key={`expanded-${call.id}`} style={{ background: '#f9fafb' }}>
														<td
															colSpan={6}
															style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}
														>
															<div style={{ display: 'grid', gap: '12px' }}>
																{/* Full URL */}
																<div>
																	<div
																		style={{
																			display: 'flex',
																			alignItems: 'center',
																			justifyContent: 'space-between',
																			marginBottom: '4px',
																		}}
																	>
																		<div
																			style={{
																				color: '#6b7280',
																				fontSize: '10px',
																				fontWeight: '600',
																			}}
																		>
																			FULL URL:
																		</div>
																		<button
																			type="button"
																			onClick={(e) => {
																				e.stopPropagation();
																				handleCopy(String(call.url || ''), `url-${call.id}`);
																			}}
																			style={{
																				padding: '2px 6px',
																				background:
																					copiedField === `url-${call.id}`
																						? '#10b981'
																						: '#e5e7eb',
																				color:
																					copiedField === `url-${call.id}`
																						? 'white'
																						: '#374151',
																				border: 'none',
																				borderRadius: '3px',
																				fontSize: '9px',
																				cursor: 'pointer',
																				fontWeight: '600',
																			}}
																			title="Copy full URL"
																		>
																			{copiedField === `url-${call.id}`
																				? '✓ Copied'
																				: '📋 Copy'}
																		</button>
																	</div>
																	<div
																		style={{
																			color: '#2563eb',
																			fontSize: '11px',
																			wordBreak: 'break-all',
																		}}
																	>
																		{String(call.url || '')}
																	</div>
																</div>

																{/* Request Body */}
																{(() => {
																	const body = call.body;
																	if (!body) {
																		return null;
																	}

																	let bodyText: string;
																	if (typeof body === 'string') {
																		bodyText = body;
																	} else {
																		try {
																			bodyText = JSON.stringify(body, null, 2);
																		} catch {
																			bodyText = String(body);
																		}
																	}

																	return (
																		<div>
																			<div
																				style={{
																					display: 'flex',
																					alignItems: 'center',
																					justifyContent: 'space-between',
																					marginBottom: '4px',
																				}}
																			>
																				<div
																					style={{
																						color: '#6b7280',
																						fontSize: '10px',
																						fontWeight: '600',
																					}}
																				>
																					REQUEST BODY:
																				</div>
																				<button
																					type="button"
																					onClick={(e) => {
																						e.stopPropagation();
																						handleCopy(bodyText, `body-${call.id}`);
																					}}
																					style={{
																						padding: '2px 6px',
																						background:
																							copiedField === `body-${call.id}`
																								? '#10b981'
																								: '#e5e7eb',
																						color:
																							copiedField === `body-${call.id}`
																								? 'white'
																								: '#374151',
																						border: 'none',
																						borderRadius: '3px',
																						fontSize: '9px',
																						cursor: 'pointer',
																						fontWeight: '600',
																					}}
																					title="Copy request body"
																				>
																					{copiedField === `body-${call.id}`
																						? '✓ Copied'
																						: '📋 Copy'}
																				</button>
																			</div>
																			<div
																				style={{
																					background: 'white',
																					padding: '12px',
																					borderRadius: '4px',
																					fontSize: '12px',
																					overflowX: 'auto',
																					maxHeight: '400px',
																					overflowY: 'auto',
																				}}
																			>
																				<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
																					{bodyText}
																				</pre>
																			</div>
																		</div>
																	);
																})()}

																{/* Response */}
																{(() => {
																	const data = call.response?.data;
																	if (data === null || data === undefined) {
																		return null;
																	}

																	let responseText: string;
																	try {
																		responseText = JSON.stringify(data, null, 2);
																	} catch {
																		responseText = String(data);
																	}

																	return (
																		<div>
																			<div
																				style={{
																					display: 'flex',
																					alignItems: 'center',
																					justifyContent: 'space-between',
																					marginBottom: '4px',
																				}}
																			>
																				<div
																					style={{
																						color: '#6b7280',
																						fontSize: '10px',
																						fontWeight: '600',
																					}}
																				>
																					RESPONSE:
																				</div>
																				<button
																					type="button"
																					onClick={(e) => {
																						e.stopPropagation();
																						handleCopy(responseText, `response-${call.id}`);
																					}}
																					style={{
																						padding: '2px 6px',
																						background:
																							copiedField === `response-${call.id}`
																								? '#10b981'
																								: '#e5e7eb',
																						color:
																							copiedField === `response-${call.id}`
																								? 'white'
																								: '#374151',
																						border: 'none',
																						borderRadius: '3px',
																						fontSize: '9px',
																						cursor: 'pointer',
																						fontWeight: '600',
																					}}
																					title="Copy response"
																				>
																					{copiedField === `response-${call.id}`
																						? '✓ Copied'
																						: '📋 Copy'}
																				</button>
																			</div>
																			<div
																				style={{
																					background: 'white',
																					padding: '12px',
																					borderRadius: '4px',
																					fontSize: '12px',
																					overflowX: 'auto',
																					maxHeight: '400px',
																					overflowY: 'auto',
																				}}
																			>
																				<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
																					{responseText}
																				</pre>
																			</div>
																		</div>
																	);
																})()}
															</div>
														</td>
													</tr>
												)}
											</React.Fragment>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
				
				{/* Clear Confirmation Modal */}
				{showClearConfirm && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background: 'rgba(0, 0, 0, 0.5)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							zIndex: 1000,
						}}
						onClick={() => setShowClearConfirm(false)}
					>
						<div
							style={{
								background: 'white',
								borderRadius: '8px',
								padding: '24px',
								maxWidth: '400px',
								width: '90%',
								boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
							}}
							onClick={(e) => e.stopPropagation()}
						>
							<h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
								Clear All API Calls?
							</h3>
							<p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
								This will remove all API calls from the display. This action cannot be undone.
							</p>
							<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
								<button
									type="button"
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
									type="button"
									onClick={() => {
										apiCallTrackerService.clearApiCalls();
										setExpandedIds(new Set());
										setShowClearConfirm(false);
										if (popOutWindow && !popOutWindow.closed) {
											popOutWindow.postMessage({ type: 'clearCalls' }, '*');
										}
									}}
									style={{
										padding: '8px 16px',
										background: '#ef4444',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer',
										fontSize: '14px',
										fontWeight: '500',
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
