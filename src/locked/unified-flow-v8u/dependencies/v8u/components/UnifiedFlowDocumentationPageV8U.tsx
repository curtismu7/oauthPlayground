/**
 * @file UnifiedFlowDocumentationPageV8U.tsx
 * @module v8u/components
 * @description Comprehensive documentation page for Unified OAuth flows
 * @version 8.0.0
 *
 * Displays API calls, JSON bodies, and allows download as PDF/MD
 */

import {
	FiChevronDown,
	FiChevronUp,
	FiDownload,
	FiFileText,
	FiHome,
	FiInfo,
	FiPackage,
} from '@icons';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	apiCallTrackerService,
	type ApiCall as TrackedApiCall,
} from '../../services/apiCallTrackerService.ts';
import {
	downloadPostmanCollectionWithEnvironment,
	generatePostmanCollection,
} from '../../services/postmanCollectionGeneratorV8.ts';
import { SpecUrlServiceV8 } from '../../v8/services/specUrlServiceV8.ts';
import type { FlowType, SpecVersion } from '../../v8/services/specVersionServiceV8.ts';
import { SpecVersionServiceV8 } from '../../v8/services/specVersionServiceV8.ts';
import type { UnifiedFlowCredentials } from '../services/unifiedFlowIntegrationV8U';

interface UnifiedFlowDocumentationPageV8UProps {
	flowType: FlowType;
	specVersion: SpecVersion;
	credentials?: UnifiedFlowCredentials;
	currentStep?: number;
	totalSteps?: number;
}

interface DocumentationApiCall {
	step: string;
	method: string;
	endpoint: string;
	description: string;
	requestBody: Record<string, unknown>;
	responseBody: Record<string, unknown>;
	notes?: string[];
}

/**
 * Convert tracked API calls to documentation format
 */
export const convertTrackedCallsToDocumentation = (
	trackedCalls: TrackedApiCall[],
	flowType: FlowType,
	_specVersion: SpecVersion
): DocumentationApiCall[] => {
	const filteredCalls = trackedCalls.filter(
		(call) => call.flowType === 'unified' || call.step?.startsWith('unified-')
	);

	return filteredCalls.map((call, index) => {
		// Extract step name from call.step or generate one
		const stepName = call.step
			? call.step
					.replace(/^unified-/, '')
					.replace(/-/g, ' ')
					.replace(/\b\w/g, (l) => l.toUpperCase())
			: `Step ${index + 1}`;

		// Get endpoint (prefer actualPingOneUrl if available)
		const endpoint = call.actualPingOneUrl || call.url;

		// Parse request body
		let requestBody: Record<string, unknown> = {};
		if (call.body) {
			if (typeof call.body === 'string') {
				try {
					requestBody = JSON.parse(call.body);
				} catch {
					requestBody = { raw: call.body };
				}
			} else {
				requestBody = call.body as Record<string, unknown>;
			}
		}

		// Get response body
		const responseBody = (call.response?.data as Record<string, unknown>) || {};

		// Generate description based on step
		let description = `${stepName} for ${flowType} flow`;
		if (call.method === 'POST' && endpoint.includes('/token')) {
			description = `Exchange authorization code for tokens using ${flowType} flow`;
		} else if (call.method === 'GET' && endpoint.includes('/authorize')) {
			description = `Build authorization URL for ${flowType} flow`;
		} else if (endpoint.includes('/device_authorization')) {
			description = 'Request device authorization code (RFC 8628)';
		} else if (endpoint.includes('/token-exchange')) {
			description = 'Poll for tokens using device code';
		}

		// Generate notes
		const notes: string[] = [];
		if (call.headers) {
			const authHeader = call.headers['Authorization'] || call.headers['authorization'];
			if (authHeader) {
				notes.push(`Authorization: ${authHeader}`);
			}
			if (call.headers['Content-Type']) {
				notes.push(`Content-Type: ${call.headers['Content-Type']}`);
			}
		}
		if (call.isProxy) {
			notes.push('Request is proxied through backend to avoid CORS issues');
		}
		if (call.response) {
			notes.push(`Response Status: ${call.response.status} ${call.response.statusText}`);
		}

		return {
			step: `${index + 1}. ${stepName}`,
			method: call.method,
			endpoint,
			description,
			requestBody,
			responseBody,
			notes: notes.length > 0 ? notes : undefined,
		};
	});
};

/**
 * Get PingOne API documentation URL for a flow type
 */
const getApiDocsUrlForFlow = (_flowType: FlowType): string => {
	const _baseUrl = 'https://apidocs.pingidentity.com/pingone/platform/v1/api/';

	// #region agent log
	method: 'POST', headers;
	: 'Content-Type': 'application/json' ,
		body: JSON.stringify(
			location: 'UnifiedFlowDocumentationPageV8U.tsx:132',
			message: 'Getting PingOne API docs URL for flow',
			data: flowType, baseUrl ,
			timestamp: Date.now(),
			sessionId: 'debug-session',
			hypothesisId: 'F',),
};
).catch(() =>
{
}
)
// #endregion

let url: string;
switch (flowType) {
	case 'oauth-authz':
		url = `${baseUrl}#authorization-and-authentication-apis-authorize-authorization-code`;
		break;
	case 'implicit':
		url = `${baseUrl}#authorization-and-authentication-apis-authorize-implicit`;
		break;
	case 'client-credentials':
		url = `${baseUrl}#authorization-and-authentication-apis-token-client-credentials`;
		break;
	case 'device-code':
		url = `${baseUrl}#authorization-and-authentication-apis-device-authorization-request`;
		break;
	case 'hybrid':
		url = `${baseUrl}#openid-connect`;
		break;
	default:
		url = baseUrl;
}

// #region agent log
method: 'POST', headers;
:
{
	('Content-Type');
	: 'application/json'
}
,
		body: JSON.stringify(
{
	location: 'UnifiedFlowDocumentationPageV8U.tsx:153', message;
	: 'Generated PingOne API docs URL',
			data: flowType, url, hasAnchor: url.includes('#'), anchor: url.includes('#') ? url.split('#')[1] : null ,
			timestamp: Date.now(),
			sessionId: 'debug-session',
			hypothesisId: 'F',
}
),
	}).catch(() =>
{
}
)
// #endregion

return url;
}

/**
 * Generate markdown documentation
 */
export const generateUnifiedFlowMarkdown = (
	flowType: FlowType,
	specVersion: SpecVersion,
	apiCalls: DocumentationApiCall[],
	credentials?: UnifiedFlowCredentials
): string => {
	const flowTypeLabels: Record<FlowType, string> = {
		'oauth-authz': 'Authorization Code',
		hybrid: 'Hybrid',
		implicit: 'Implicit',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
	};

	const title = `PingOne OAuth 2.0 - ${flowTypeLabels[flowType]} Flow (${SpecVersionServiceV8.getSpecLabel(specVersion)})`;

	const generatedDate = new Date().toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short',
	});

	let _md = `# ${title}\n\n`;
	_md += `**Generated:** ${generatedDate}\n\n`;
	_md += `## Overview\n\n`;
	_md += `This document describes the PingOne OAuth 2.0 API calls required for the ${flowTypeLabels[flowType]} flow using ${SpecVersionServiceV8.getSpecLabel(specVersion)}.\n\n`;

	if (credentials) {
		_md += `## Configuration\n\n`;
		_md += `- **Environment ID:** ${credentials.environmentId || '{environmentId}'}\n`;
		_md += `- **Client ID:** ${credentials.clientId || '{clientId}'}\n`;
		if (credentials.scopes) {
			_md += `- **Scopes:** ${credentials.scopes}\n`;
		}
		if (credentials.redirectUri) {
			_md += `- **Redirect URI:** ${credentials.redirectUri}\n`;
		}
		_md += `\n`;
	}

	_md += `## API Calls\n\n`;

	apiCalls.forEach((call, index) => {
		_md += `### ${call.step}\n\n`;
		_md += `**${call.method}** \`${call.endpoint}\`\n\n`;
		_md += `${call.description}\n\n`;

		if (call.notes && call.notes.length > 0) {
			_md += `**Notes:**\n`;
			call.notes.forEach((note) => {
				_md += `- ${note}\n`;
			});
			_md += `\n`;
		}

		if (Object.keys(call.requestBody).length > 0) {
			_md += `**Request Body:**\n\n`;
			_md += `\`\`\`json\n`;
			_md += `${JSON.stringify(call.requestBody, null, 2)}\n`;
			_md += `\`\`\`\n\n`;
		}

		if (Object.keys(call.responseBody).length > 0) {
			_md += `**Response:**\n\n`;
			_md += `\`\`\`json\n`;
			_md += `${JSON.stringify(call.responseBody, null, 2)}\n`;
			_md += `\`\`\`\n\n`;
		}

		if (index < apiCalls.length - 1) {
			_md += `---\n\n`;
		}
	});

	_md += `## References\n\n`;

	// Get flow-specific specification links
	const _flowSpecs = SpecUrlServiceV8.getFlowSpecInfo(flowType);
	const _specUrls = SpecUrlServiceV8.getCombinedSpecUrls(specVersion, flowType);
	const _versionSpecs = SpecUrlServiceV8.getSpecUrls(specVersion);

	// #region agent log
	method: 'POST', headers;
	: 'Content-Type': 'application/json' ,
		body: JSON.stringify(
			location: 'UnifiedFlowDocumentationPageV8U.tsx:231',
			message: 'Generating documentation references',
			data: 
				flowType,
				specVersion,
				flowPrimarySpec: flowSpecs.primarySpec,
				flowRelatedSpecs: flowSpecs.relatedSpecs?.map((s) => (label: s.label, url: s.url )),
				combinedPrimaryUrl: specUrls.primary,
				combinedPrimaryLabel: specUrls.primaryLabel,
				combinedAllSpecs: specUrls.allSpecs.map((s) => (label: s.label, url: s.url, isPrimary: s.isPrimary )),,
			timestamp: Date.now(),
			sessionId: 'debug-session',
			hypothesisId: 'E',),
};
).catch(() =>
{
}
)
// #endregion

// Add primary specification with section anchor if available
if (flowSpecs.relatedSpecs && flowSpecs.relatedSpecs.length > 0) {
	flowSpecs.relatedSpecs.forEach((spec) => {
		md += `- [${spec.label}](${spec.url})\n`;
	});
} else {
	// Fallback to primary spec
	md += `- [${specUrls.primaryLabel}](${specUrls.primary})\n`;
}

// Add version-specific related specs
versionSpecs.related.forEach((spec) => {
	// Avoid duplicates
	if (!flowSpecs.relatedSpecs?.some((s) => s.url === spec.url)) {
		md += `- [${spec.label}](${spec.url})\n`;
	}
});

// Add PingOne API documentation with flow-specific anchor
const _apiDocsUrl = getApiDocsUrlForFlow(flowType);

// #region agent log
method: 'POST', headers;
:
{
	('Content-Type');
	: 'application/json'
}
,
		body: JSON.stringify(
{
	location: 'UnifiedFlowDocumentationPageV8U.tsx:257', message;
	: 'Adding PingOne API documentation link',
			data: flowType, apiDocsUrl, hasAnchor: apiDocsUrl.includes('#') ,
			timestamp: Date.now(),
			sessionId: 'debug-session',
			hypothesisId: 'E',
}
),
	}).catch(() =>
{
}
)
// #endregion

md += `- [PingOne API Documentation - $
{
	flowTypeLabels[flowType];
}
Flow;
]($
{
	_apiDocsUrl;
}
)\n`

return md;
}

export const downloadAsMarkdown = (content: string, filename: string): void => {
	const blob = new Blob([content], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

// Convert markdown to HTML for PDF generation (simplified version)
const markdownToHtml = (markdown: string): string => {
	let html = '';
	let inCodeBlock = false;

	const lines = markdown.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.startsWith('```')) {
			if (inCodeBlock) {
				html += '</code></pre>\n';
				inCodeBlock = false;
			} else {
				html += '<pre class="code-block"><code>';
				inCodeBlock = true;
			}
			continue;
		}

		if (inCodeBlock) {
			html += `${escapeHtml(line)}\n`;
			continue;
		}

		if (trimmed.startsWith('# ')) {
			html += `<h1>${escapeHtml(trimmed.substring(2))}</h1>\n`;
		} else if (trimmed.startsWith('## ')) {
			html += `<h2>${escapeHtml(trimmed.substring(3))}</h2>\n`;
		} else if (trimmed.startsWith('### ')) {
			html += `<h3>${escapeHtml(trimmed.substring(4))}</h3>\n`;
		} else if (trimmed.startsWith('- ')) {
			html += `<li>${escapeHtml(trimmed.substring(2))}</li>\n`;
		} else if (trimmed === '---') {
			html += '<hr>\n';
		} else if (trimmed) {
			html += `<p>${escapeHtml(trimmed)}</p>\n`;
		} else {
			html += '<br>\n';
		}
	}

	return html;
};

const escapeHtml = (text: string): string => {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
};

export const downloadAsPDF = (markdown: string, title: string): void => {
	const html = markdownToHtml(markdown);
	const fullHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>${title}</title>
			<style>
				body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
				h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
				h2 { color: #374151; margin-top: 30px; }
				h3 { color: #4b5563; margin-top: 20px; }
				pre.code-block { background: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; }
				code { font-family: 'Courier New', monospace; }
				hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
				li { margin: 5px 0; }
			</style>
		</head>
		<body>
			${html}
		</body>
		</html>
	`;

	const printWindow = window.open('', '_blank');
	if (printWindow) {
		printWindow.document.write(fullHtml);
		printWindow.document.close();
		printWindow.onload = () => {
			printWindow.print();
		};
	}
};

export const UnifiedFlowDocumentationPageV8U: React.FC<UnifiedFlowDocumentationPageV8UProps> = ({
	flowType,
	specVersion,
	credentials,
	currentStep,
	totalSteps,
}) => {
	const navigate = useNavigate();
	const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));

	// Get tracked API calls and convert to documentation format
	const trackedCalls = apiCallTrackerService.getApiCalls();
	const apiCalls = useMemo(
		() => convertTrackedCallsToDocumentation(trackedCalls, flowType, specVersion),
		[trackedCalls, flowType, specVersion]
	);

	const toggleSection = (index: number): void => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(index)) {
				next.delete(index);
			} else {
				next.add(index);
			}
			return next;
		});
	};

	const handleDownloadMarkdown = (): void => {
		const markdown = generateUnifiedFlowMarkdown(flowType, specVersion, apiCalls, credentials);
		const filename = `pingone-${flowType}-${specVersion}-${new Date().toISOString().split('T')[0]}.md`;
		downloadAsMarkdown(markdown, filename);
	};

	const handleDownloadPDF = (): void => {
		const markdown = generateUnifiedFlowMarkdown(flowType, specVersion, apiCalls, credentials);
		const flowTypeLabels: Record<FlowType, string> = {
			'oauth-authz': 'Authorization Code',
			hybrid: 'Hybrid',
			implicit: 'Implicit',
			'client-credentials': 'Client Credentials',
			'device-code': 'Device Code',
		};
		const title = `PingOne OAuth 2.0 - ${flowTypeLabels[flowType]} Flow (${SpecVersionServiceV8.getSpecLabel(specVersion)})`;
		downloadAsPDF(markdown, title);
	};

	const handleGoHome = (): void => {
		navigate('/v8u/unified');
	};

	const handleDownloadPostman = (): void => {
		const trackedCalls = apiCallTrackerService.getApiCalls();
		const collection = generatePostmanCollection(trackedCalls, flowType, specVersion, {
			environmentId: credentials?.environmentId,
			clientId: credentials?.clientId,
			clientSecret: credentials?.clientSecret,
		});
		const date = new Date().toISOString().split('T')[0];
		const filename = `pingone-${flowType}-${specVersion}-${date}-collection.json`;
		const environmentName = `PingOne ${flowType} ${specVersion} Environment`;
		downloadPostmanCollectionWithEnvironment(collection, filename, environmentName);
	};

	const flowTypeLabels: Record<FlowType, string> = {
		'oauth-authz': 'Authorization Code',
		hybrid: 'Hybrid',
		implicit: 'Implicit',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
	};

	const pageName = `${flowTypeLabels[flowType]} Flow - API Documentation`;

	return (
		<div
			style={{
				maxWidth: '1000px',
				margin: '0 auto',
				padding: '32px',
				background: 'white',
			}}
		>
			{/* Page Header */}
			<div
				style={{
					marginBottom: '24px',
					padding: '16px 20px',
					background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
					borderRadius: '8px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<div>
						<div
							style={{
								fontSize: '11px',
								fontWeight: '700',
								color: 'rgba(255, 255, 255, 0.9)',
								letterSpacing: '1.5px',
								textTransform: 'uppercase',
								marginBottom: '4px',
							}}
						>
							Unified Flow V8U
						</div>
						<h1
							style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#ffffff' }}
						>
							{pageName}
						</h1>
						<div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', marginTop: '4px' }}>
							{specVersion.toUpperCase()}
						</div>
					</div>
					{currentStep !== undefined && totalSteps !== undefined && (
						<div
							style={{
								background: 'rgba(255, 255, 255, 0.95)',
								padding: '6px 12px',
								borderRadius: '16px',
								display: 'flex',
								alignItems: 'center',
								gap: '4px',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
							}}
						>
							<span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
								{currentStep + 1}
							</span>
							<span style={{ fontSize: '12px', color: '#999', fontWeight: '500' }}>/</span>
							<span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
								{totalSteps}
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Download Buttons */}
			<div
				style={{
					display: 'flex',
					gap: '12px',
					marginBottom: '32px',
					flexWrap: 'wrap',
				}}
			>
				<button
					type="button"
					onClick={handleDownloadMarkdown}
					style={{
						padding: '12px 24px',
						fontSize: '16px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #3b82f6',
						background: '#3b82f6',
						color: 'white',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiFileText />
					Download Markdown
				</button>
				<button
					type="button"
					onClick={handleDownloadPDF}
					style={{
						padding: '12px 24px',
						fontSize: '16px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #10b981',
						background: '#10b981',
						color: 'white',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiDownload />
					Download PDF
				</button>
				<button
					type="button"
					onClick={handleDownloadPostman}
					style={{
						padding: '12px 24px',
						fontSize: '16px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #8b5cf6',
						background: '#8b5cf6',
						color: 'white',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiPackage />
					Download Postman Collection
				</button>
				<button
					type="button"
					onClick={handleGoHome}
					style={{
						padding: '12px 24px',
						fontSize: '16px',
						fontWeight: '600',
						borderRadius: '8px',
						border: '1px solid #6b7280',
						background: 'white',
						color: '#6b7280',
						cursor: 'pointer',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiHome />
					Back to Flows
				</button>
			</div>

			{/* Overview */}
			<div style={{ marginBottom: '32px' }}>
				<h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
					Overview
				</h3>
				<div
					style={{
						padding: '16px',
						background: '#f9fafb',
						borderRadius: '8px',
						borderLeft: '4px solid #3b82f6',
					}}
				>
					<p style={{ margin: '0 0 12px 0', color: '#4b5563', lineHeight: '1.6' }}>
						This documentation shows all API calls made during the {flowTypeLabels[flowType]} flow
						using {specVersion}. Each API call includes the request method, endpoint, request body,
						and response data.
					</p>
					{apiCalls.length === 0 && (
						<div
							style={{
								padding: '12px',
								background: '#fef3c7',
								borderRadius: '4px',
								borderLeft: '4px solid #f59e0b',
								marginTop: '12px',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e' }}>
								<FiInfo size={18} />
								<span style={{ fontWeight: '600' }}>No API calls recorded</span>
							</div>
							<p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#78350f' }}>
								Complete the flow to see API calls here. API calls are tracked automatically as you
								progress through the flow.
							</p>
						</div>
					)}
				</div>
			</div>

			{/* API Calls */}
			{apiCalls.length > 0 && (
				<div style={{ marginBottom: '32px' }}>
					<h3
						style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}
					>
						API Calls
					</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{apiCalls.map((call, index) => {
							const isExpanded = expandedSections.has(index);
							return (
								<div
									key={index}
									style={{
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										overflow: 'hidden',
									}}
								>
									<button
										type="button"
										onClick={() => toggleSection(index)}
										style={{
											width: '100%',
											padding: '16px 20px',
											background: isExpanded ? '#f3f4f6' : 'white',
											border: 'none',
											borderRadius: '8px',
											cursor: 'pointer',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											textAlign: 'left',
										}}
									>
										<div style={{ flex: 1 }}>
											<div
												style={{
													fontSize: '16px',
													fontWeight: '600',
													color: '#1f2937',
													marginBottom: '4px',
												}}
											>
												{call.step}
											</div>
											<div style={{ fontSize: '18px', color: '#1f2937', fontWeight: '600' }}>
												<strong>{call.method}</strong>{' '}
												<span style={{ color: '#f97316' }}>{call.endpoint}</span>
											</div>
										</div>
										{isExpanded ? (
											<FiChevronUp size={20} color="#6b7280" />
										) : (
											<FiChevronDown size={20} color="#6b7280" />
										)}
									</button>
									{isExpanded && (
										<div
											style={{
												padding: '20px',
												background: 'white',
												borderTop: '1px solid #e5e7eb',
											}}
										>
											<p style={{ margin: '0 0 16px 0', color: '#4b5563', lineHeight: '1.6' }}>
												{call.description}
											</p>

											{call.notes && call.notes.length > 0 && (
												<div style={{ marginBottom: '16px' }}>
													<div
														style={{
															fontSize: '14px',
															fontWeight: '600',
															color: '#374151',
															marginBottom: '8px',
														}}
													>
														Notes:
													</div>
													<ul style={{ margin: '0', paddingLeft: '20px', color: '#6b7280' }}>
														{call.notes.map((note, noteIndex) => (
															<li key={noteIndex} style={{ marginBottom: '4px' }}>
																{note}
															</li>
														))}
													</ul>
												</div>
											)}

											{Object.keys(call.requestBody).length > 0 && (
												<div style={{ marginBottom: '16px' }}>
													<div
														style={{
															fontSize: '14px',
															fontWeight: '600',
															color: '#374151',
															marginBottom: '8px',
														}}
													>
														Request Body:
													</div>
													<pre
														style={{
															background: '#f3f4f6',
															padding: '12px',
															borderRadius: '4px',
															overflow: 'auto',
															fontSize: '13px',
															lineHeight: '1.5',
														}}
													>
														<code>{JSON.stringify(call.requestBody, null, 2)}</code>
													</pre>
												</div>
											)}

											{Object.keys(call.responseBody).length > 0 && (
												<div>
													<div
														style={{
															fontSize: '14px',
															fontWeight: '600',
															color: '#374151',
															marginBottom: '8px',
														}}
													>
														Response:
													</div>
													<pre
														style={{
															background: '#f3f4f6',
															padding: '12px',
															borderRadius: '4px',
															overflow: 'auto',
															fontSize: '13px',
															lineHeight: '1.5',
														}}
													>
														<code>{JSON.stringify(call.responseBody, null, 2)}</code>
													</pre>
												</div>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};
