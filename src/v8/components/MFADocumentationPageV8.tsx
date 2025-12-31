/**
 * @file MFADocumentationPageV8.tsx
 * @module v8/components
 * @description Comprehensive documentation page for MFA device registration flows
 * @version 8.0.0
 *
 * Displays API calls, JSON bodies, rules, and allows download as PDF/MD
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiChevronDown, FiChevronUp, FiDownload, FiFileText, FiInfo, FiHome } from 'react-icons/fi';
import type { DeviceType } from '../flows/shared/MFATypes';

interface MFADocumentationPageV8Props {
	deviceType: DeviceType;
	flowType: 'registration' | 'authentication';
	credentials?: {
		environmentId?: string;
		username?: string;
		deviceAuthenticationPolicyId?: string;
	};
	currentStep?: number;
	totalSteps?: number;
}

interface ApiCall {
	step: string;
	method: string;
	endpoint: string;
	description: string;
	requestBody: Record<string, unknown>;
	responseBody: Record<string, unknown>;
	notes?: string[];
}

const DEVICE_DOCS: Record<
	DeviceType,
	{
		registrationApiDocs: string;
		activationApiDocs: string;
		deviceName: string;
	}
> = {
	SMS: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'SMS',
	},
	EMAIL: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-email',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'Email',
	},
	WHATSAPP: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-whatsapp',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'WhatsApp',
	},
	TOTP: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-totp',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'TOTP',
	},
	FIDO2: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-fido2',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'FIDO2',
	},
	MOBILE_APP: {
		registrationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-mobile-app',
		activationApiDocs:
			'https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device',
		deviceName: 'Mobile App',
	},
};

const getApiCalls = (
	deviceType: DeviceType,
	flowType: 'registration' | 'authentication'
): ApiCall[] => {
	const deviceInfo = DEVICE_DOCS[deviceType];
	const baseUrl = 'https://api.pingone.com/v1/environments/{environmentId}/users/{userId}';

	if (flowType === 'registration') {
		const calls: ApiCall[] = [
			{
				step: '1. User Lookup',
				method: 'GET',
				endpoint: `${baseUrl.replace('/users/{userId}', '/users')}?filter=username eq "{username}"`,
				description: 'Find the user by username to get the user ID',
				requestBody: {},
				responseBody: {
					_embedded: {
						users: [
							{
								id: 'user-id-123',
								username: 'john.doe',
								email: 'john.doe@example.com',
							},
						],
					},
				},
				notes: [
					'Authorization: Bearer {workerToken} for Admin Flow',
					'Authorization: Bearer {userToken} for User Flow',
				],
			},
		];

		// Add device-specific registration call
		if (deviceType === 'SMS') {
			calls.push({
				step: '2. Register SMS Device',
				method: 'POST',
				endpoint: `${baseUrl}/devices`,
				description: 'Create a new SMS device for the user',
				requestBody: {
					type: 'SMS',
					phone: {
						number: '+1.5125201234',
					},
					nickname: 'My SMS Device',
					status: 'ACTIVATION_REQUIRED',
					policy: {
						id: '{deviceAuthenticationPolicyId}',
					},
				},
				responseBody: {
					id: 'device-id-123',
					type: 'SMS',
					status: 'ACTIVATION_REQUIRED',
					nickname: 'My SMS Device',
					phone: {
						number: '+1.5125201234',
					},
					_links: {
						'device.activate': {
							href: `${baseUrl}/devices/{deviceId}`,
						},
					},
				},
				notes: [
					'Authorization: Bearer {workerToken} for Admin Flow',
					'Authorization: Bearer {userToken} for User Flow',
					'Status must be "ACTIVATION_REQUIRED" for User Flow',
					'Admin Flow can use "ACTIVE" or "ACTIVATION_REQUIRED"',
					'OTP is automatically sent when status is "ACTIVATION_REQUIRED"',
				],
			});
		} else if (deviceType === 'EMAIL') {
			calls.push({
				step: '2. Register Email Device',
				method: 'POST',
				endpoint: `${baseUrl}/devices`,
				description: 'Create a new Email device for the user',
				requestBody: {
					type: 'EMAIL',
					email: 'user@example.com',
					nickname: 'My Email Device',
					status: 'ACTIVATION_REQUIRED',
					policy: {
						id: '{deviceAuthenticationPolicyId}',
					},
				},
				responseBody: {
					id: 'device-id-123',
					type: 'EMAIL',
					status: 'ACTIVATION_REQUIRED',
					nickname: 'My Email Device',
					email: 'user@example.com',
					_links: {
						'device.activate': {
							href: `${baseUrl}/devices/{deviceId}`,
						},
					},
				},
				notes: [
					'Authorization: Bearer {workerToken} for Admin Flow',
					'Authorization: Bearer {userToken} for User Flow',
					'Status must be "ACTIVATION_REQUIRED" for User Flow',
					'Admin Flow can use "ACTIVE" or "ACTIVATION_REQUIRED"',
					'OTP is automatically sent when status is "ACTIVATION_REQUIRED"',
				],
			});
		} else if (deviceType === 'WHATSAPP') {
			calls.push({
				step: '2. Register WhatsApp Device',
				method: 'POST',
				endpoint: `${baseUrl}/devices`,
				description: 'Create a new WhatsApp device for the user',
				requestBody: {
					type: 'WHATSAPP',
					phone: {
						number: '+1.5125201234',
					},
					nickname: 'My WhatsApp Device',
					status: 'ACTIVATION_REQUIRED',
					policy: {
						id: '{deviceAuthenticationPolicyId}',
					},
				},
				responseBody: {
					id: 'device-id-123',
					type: 'WHATSAPP',
					status: 'ACTIVATION_REQUIRED',
					nickname: 'My WhatsApp Device',
					phone: {
						number: '+1.5125201234',
					},
					_links: {
						'device.activate': {
							href: `${baseUrl}/devices/{deviceId}`,
						},
					},
				},
				notes: [
					'Authorization: Bearer {workerToken} for Admin Flow',
					'Authorization: Bearer {userToken} for User Flow',
					'Status must be "ACTIVATION_REQUIRED" for User Flow',
					'Admin Flow can use "ACTIVE" or "ACTIVATION_REQUIRED"',
					'OTP is automatically sent when status is "ACTIVATION_REQUIRED"',
				],
			});
		}

		// Add activation call for ACTIVATION_REQUIRED devices
		calls.push({
			step: '3. Activate Device (if ACTIVATION_REQUIRED)',
			method: 'POST',
			endpoint: `${baseUrl}/devices/{deviceId}`,
			description: 'Activate the device by verifying the OTP code',
			requestBody: {
				otp: '123456',
			},
			responseBody: {
				id: 'device-id-123',
				type: deviceType,
				status: 'ACTIVE',
				nickname: 'My Device',
				updatedAt: '2024-01-15T10:35:00Z',
			},
			notes: [
				'Content-Type: application/vnd.pingidentity.device.activate+json',
				'Authorization: Bearer {workerToken} for Admin Flow',
				'Authorization: Bearer {userToken} for User Flow',
				'Use the device.activate URI from registration response',
				'OTP is sent automatically when device is created with ACTIVATION_REQUIRED status',
			],
		});

		return calls;
	}

	// Authentication flow API calls would go here
	return [];
};

const generateMarkdown = (
	deviceType: DeviceType,
	flowType: 'registration' | 'authentication',
	apiCalls: ApiCall[]
): string => {
	const deviceInfo = DEVICE_DOCS[deviceType];
	const title = `Ping Identity - ${deviceInfo.deviceName} MFA ${flowType === 'registration' ? 'Registration' : 'Authentication'} Flow`;

	const generatedDate = new Date().toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short',
	});
	
	let md = `# ${title}\n\n`;
	md += `**Generated:** ${generatedDate}\n\n`;
	md += `## Overview\n\n`;
	md += `This document describes the PingOne MFA API calls required for ${deviceInfo.deviceName} device ${flowType === 'registration' ? 'registration' : 'authentication'}.\n\n`;

	md += `## API Reference\n\n`;
	md += `- **Registration API:** [${deviceInfo.registrationApiDocs}](${deviceInfo.registrationApiDocs})\n`;
	md += `- **Activation API:** [${deviceInfo.activationApiDocs}](${deviceInfo.activationApiDocs})\n`;
	md += `- **PingOne MFA API Docs:** https://apidocs.pingidentity.com/pingone/mfa/v1/api/\n\n`;

	md += `## Flow Rules\n\n`;
	md += `### Admin Flow\n`;
	md += `- **Token Type:** Worker Token (Client Credentials Grant)\n`;
	md += `- **Status Options:** Can choose \`ACTIVE\` or \`ACTIVATION_REQUIRED\`\n`;
	md += `- **Use Case:** Administrative device provisioning\n\n`;

	md += `### User Flow\n`;
	md += `- **Token Type:** User Token (Access Token from Authorization Code Flow)\n`;
	md += `- **Status Options:** Always \`ACTIVATION_REQUIRED\` (security requirement)\n`;
	md += `- **Use Case:** User self-service device registration\n`;
	md += `- **Authentication:** User must authenticate with PingOne before device registration\n\n`;

	md += `## API Calls\n\n`;

	apiCalls.forEach((call, index) => {
		md += `### ${call.step}\n\n`;
		md += `**${call.method}** \`${call.endpoint}\`\n\n`;
		md += `${call.description}\n\n`;

		if (call.notes && call.notes.length > 0) {
			md += `**Notes:**\n`;
			call.notes.forEach((note) => {
				md += `- ${note}\n`;
			});
			md += `\n`;
		}

		if (Object.keys(call.requestBody).length > 0) {
			md += `**Request Body:**\n\n`;
			md += `\`\`\`json\n`;
			md += `${JSON.stringify(call.requestBody, null, 2)}\n`;
			md += `\`\`\`\n\n`;
		}

		if (Object.keys(call.responseBody).length > 0) {
			md += `**Response:**\n\n`;
			md += `\`\`\`json\n`;
			md += `${JSON.stringify(call.responseBody, null, 2)}\n`;
			md += `\`\`\`\n\n`;
		}

		if (index < apiCalls.length - 1) {
			md += `---\n\n`;
		}
	});

	md += `## UI Requirements\n\n`;
	if (flowType === 'registration') {
		md += `### OTP Validation Modal\n`;
		md += `- **When:** Device status is \`ACTIVATION_REQUIRED\`\n`;
		md += `- **Requires:** User must enter OTP code received via ${deviceInfo.deviceName.toLowerCase()}\n`;
		md += `- **Action:** Calls device activation API with OTP\n\n`;
	}

	md += `## References\n\n`;
	md += `- [PingOne MFA API Documentation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/)\n`;
	md += `- [PingOne MFA Device Registration](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-create-mfa-user-device-sms)\n`;
	md += `- [PingOne MFA Device Activation](https://apidocs.pingidentity.com/pingone/mfa/v1/api/#post-activate-mfa-user-device)\n`;

	return md;
};

const downloadAsMarkdown = (content: string, filename: string): void => {
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

// Convert markdown to HTML with better formatting for PDF
const markdownToHtml = (markdown: string): string => {
	let html = '';
	let inCodeBlock = false;
	let inList = false;
	
	const lines = markdown.split('\n');
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		
		// Handle code blocks
		if (trimmed.startsWith('```')) {
			if (inCodeBlock) {
				html += '</code></pre>\n';
				inCodeBlock = false;
			} else {
				const lang = trimmed.substring(3).trim() || 'text';
				html += `<pre class="code-block"><code class="language-${lang}">`;
				inCodeBlock = true;
			}
			continue;
		}
		
		if (inCodeBlock) {
			html += escapeHtml(line) + '\n';
			continue;
		}
		
		// Handle headers
		if (trimmed.startsWith('# ')) {
			if (inList) {
				html += '</ul>\n';
				inList = false;
			}
			html += `<h1>${processInlineMarkdown(trimmed.substring(2))}</h1>\n`;
			continue;
		}
		if (trimmed.startsWith('## ')) {
			if (inList) {
				html += '</ul>\n';
				inList = false;
			}
			html += `<h2>${processInlineMarkdown(trimmed.substring(3))}</h2>\n`;
			continue;
		}
		if (trimmed.startsWith('### ')) {
			if (inList) {
				html += '</ul>\n';
				inList = false;
			}
			html += `<h3>${processInlineMarkdown(trimmed.substring(4))}</h3>\n`;
			continue;
		}
		
		// Handle horizontal rules
		if (trimmed === '---' || trimmed === '***') {
			if (inList) {
				html += '</ul>\n';
				inList = false;
			}
			html += '<hr class="section-divider">\n';
			continue;
		}
		
		// Handle list items
		if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
			if (!inList) {
				html += '<ul class="documentation-list">\n';
				inList = true;
			}
			const listContent = trimmed.substring(2);
			html += `<li>${processInlineMarkdown(listContent)}</li>\n`;
			continue;
		}
		
		// Close list if we hit a non-list line
		if (inList && trimmed !== '') {
			html += '</ul>\n';
			inList = false;
		}
		
		// Handle empty lines
		if (trimmed === '') {
			html += '<br>\n';
			continue;
		}
		
		// Handle regular paragraphs
		html += `<p class="documentation-paragraph">${processInlineMarkdown(trimmed)}</p>\n`;
	}
	
	// Close any open tags
	if (inList) {
		html += '</ul>\n';
	}
	if (inCodeBlock) {
		html += '</code></pre>\n';
	}
	
	return html;
};

// Process inline markdown (bold, code, links)
const processInlineMarkdown = (text: string): string => {
	// Escape HTML first
	text = escapeHtml(text);
	
	// Process links [text](url)
	text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
	
	// Process inline code `code`
	text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
	
	// Process bold **text**
	text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	
	// Process italic *text* (but not if it's part of **text**)
	text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
	
	return text;
};

// Escape HTML entities
const escapeHtml = (text: string): string => {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (m) => map[m] || m);
};

const downloadAsPDF = (content: string, title: string): void => {
	// Create a new window with the content
	const printWindow = window.open('', '_blank');
	if (!printWindow) {
		console.error('Failed to open print window');
		return;
	}

	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>${escapeHtml(title)}</title>
			<style>
				@page {
					margin: 2cm;
					size: letter;
				}
				
				* {
					box-sizing: border-box;
				}
				
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
					max-width: 850px;
					margin: 0 auto;
					padding: 40px 50px;
					line-height: 1.7;
					color: #1f2937;
					font-size: 11pt;
					background: white;
				}
				
				h1 {
					color: #E31837;
					border-bottom: 4px solid #E31837;
					padding-bottom: 12px;
					margin-bottom: 24px;
					margin-top: 0;
					font-size: 28pt;
					font-weight: 700;
					page-break-after: avoid;
				}
				
				h2 {
					color: #1f2937;
					margin-top: 36px;
					margin-bottom: 16px;
					border-bottom: 2px solid #e5e7eb;
					padding-bottom: 8px;
					font-size: 20pt;
					font-weight: 600;
					page-break-after: avoid;
				}
				
				h3 {
					color: #374151;
					margin-top: 24px;
					margin-bottom: 12px;
					font-size: 16pt;
					font-weight: 600;
					page-break-after: avoid;
				}
				
				p {
					margin: 12px 0;
					text-align: justify;
				}
				
				.documentation-paragraph {
					margin: 14px 0;
				}
				
				ul, ol {
					margin: 16px 0;
					padding-left: 32px;
				}
				
				.documentation-list {
					margin: 16px 0;
					padding-left: 32px;
				}
				
				.documentation-list li {
					margin: 8px 0;
					line-height: 1.8;
				}
				
				pre {
					background: #f8f9fa;
					padding: 20px;
					border-radius: 8px;
					overflow-x: auto;
					border: 1px solid #e1e4e8;
					margin: 20px 0;
					page-break-inside: avoid;
					font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace;
					font-size: 9.5pt;
					line-height: 1.5;
				}
				
				.code-block {
					background: #f8f9fa;
					border-left: 4px solid #E31837;
				}
				
				code {
					font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Courier New', monospace;
					font-size: 0.95em;
				}
				
				.inline-code {
					background: #f1f3f5;
					padding: 3px 6px;
					border-radius: 4px;
					font-size: 0.9em;
					color: #d63384;
					border: 1px solid #dee2e6;
				}
				
				hr.section-divider {
					border: none;
					border-top: 2px solid #e5e7eb;
					margin: 32px 0;
					page-break-after: avoid;
				}
				
				a {
					color: #E31837;
					text-decoration: none;
					border-bottom: 1px solid #E31837;
				}
				
				a:hover {
					background-color: #fef2f2;
				}
				
				strong {
					font-weight: 600;
					color: #111827;
				}
				
				em {
					font-style: italic;
					color: #4b5563;
				}
				
				@media print {
					body {
						padding: 20px;
						max-width: 100%;
					}
					
					h1, h2, h3 {
						page-break-after: avoid;
					}
					
					pre, code {
						page-break-inside: avoid;
					}
					
					ul, ol {
						page-break-inside: avoid;
					}
					
					hr.section-divider {
						page-break-after: avoid;
					}
				}
			</style>
		</head>
		<body>
			${markdownToHtml(content)}
		</body>
		</html>
	`;

	printWindow.document.write(html);
	printWindow.document.close();

	// Wait for content to load, then print
	setTimeout(() => {
		printWindow.print();
	}, 500);
};

export const MFADocumentationPageV8: React.FC<MFADocumentationPageV8Props> = ({
	deviceType,
	flowType,
	credentials: _credentials,
	currentStep,
	totalSteps,
}) => {
	const navigate = useNavigate();
	const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
	const deviceInfo = DEVICE_DOCS[deviceType];
	const apiCalls = getApiCalls(deviceType, flowType);

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
		const markdown = generateMarkdown(deviceType, flowType, apiCalls);
		const filename = `pingone-${deviceType.toLowerCase()}-${flowType}-${new Date().toISOString().split('T')[0]}.md`;
		downloadAsMarkdown(markdown, filename);
	};

	const handleDownloadPDF = (): void => {
		const markdown = generateMarkdown(deviceType, flowType, apiCalls);
		const title = `Ping Identity - ${deviceInfo.deviceName} MFA ${flowType === 'registration' ? 'Registration' : 'Authentication'}`;
		downloadAsPDF(markdown, title);
	};

	const deviceTypeLabel = DEVICE_DOCS[deviceType].deviceName;
	const pageName = `${deviceTypeLabel} Flow - Documentation`;

	return (
		<div
			style={{
				maxWidth: '1000px',
				margin: '0 auto',
				padding: '32px',
				background: 'white',
			}}
		>
			{/* Page Name and Step Number */}
			<div
				style={{
					marginBottom: '24px',
					padding: '16px 20px',
					background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
							MFA Flow V8
						</div>
						<h1
							style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '700', color: '#ffffff' }}
						>
							{pageName}
						</h1>
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
							<span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
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

			{/* Header */}
			<div style={{ marginBottom: '32px', textAlign: 'center' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '12px',
						marginBottom: '12px',
					}}
				>
					<FiBook size={32} color="#E31837" />
					<h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1f2937' }}>
						Ping Identity
					</h1>
				</div>
				<h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '600', color: '#374151' }}>
					{deviceInfo.deviceName} MFA{' '}
					{flowType === 'registration' ? 'Registration' : 'Authentication'} Flow
				</h2>
				<p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
					Complete API documentation with examples and rules
				</p>
			</div>

			{/* Download Buttons and Navigation */}
			<div style={{ display: 'flex', gap: '12px', marginBottom: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
				<button
					type="button"
					onClick={() => navigate('/v8/mfa-hub')}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px 24px',
						background: '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '15px',
						fontWeight: '600',
						cursor: 'pointer',
						boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
					}}
				>
					<FiHome size={18} />
					Back to Hub
				</button>
				<button
					type="button"
					onClick={handleDownloadMarkdown}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px 24px',
						background: '#3b82f6',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '15px',
						fontWeight: '600',
						cursor: 'pointer',
						boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
					}}
				>
					<FiFileText size={18} />
					Download as Markdown
				</button>
				<button
					type="button"
					onClick={handleDownloadPDF}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px 24px',
						background: '#ef4444',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						fontSize: '15px',
						fontWeight: '600',
						cursor: 'pointer',
						boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
					}}
				>
					<FiDownload size={18} />
					Download as PDF
				</button>
			</div>

			{/* Flow Rules */}
			<div
				style={{
					background: '#f9fafb',
					border: '1px solid #e5e7eb',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '32px',
				}}
			>
				<h3
					style={{
						margin: '0 0 16px 0',
						fontSize: '18px',
						fontWeight: '600',
						color: '#1f2937',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiInfo size={20} color="#3b82f6" />
					Flow Rules
				</h3>
				<div style={{ display: 'grid', gap: '16px' }}>
					<div>
						<h4
							style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#374151' }}
						>
							Admin Flow
						</h4>
						<ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px' }}>
							<li>
								<strong>Token Type:</strong> Worker Token (Client Credentials Grant)
							</li>
							<li>
								<strong>Status Options:</strong> Can choose{' '}
								<code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>
									ACTIVE
								</code>{' '}
								or{' '}
								<code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>
									ACTIVATION_REQUIRED
								</code>
							</li>
							<li>
								<strong>Use Case:</strong> Administrative device provisioning
							</li>
						</ul>
					</div>
					<div>
						<h4
							style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#374151' }}
						>
							User Flow
						</h4>
						<ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px' }}>
							<li>
								<strong>Token Type:</strong> User Token (Access Token from Authorization Code Flow)
							</li>
							<li>
								<strong>Status Options:</strong> Always{' '}
								<code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>
									ACTIVATION_REQUIRED
								</code>{' '}
								(security requirement)
							</li>
							<li>
								<strong>Use Case:</strong> User self-service device registration
							</li>
							<li>
								<strong>Authentication:</strong> User must authenticate with PingOne before device
								registration
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* API Calls */}
			<div style={{ marginBottom: '32px' }}>
				<h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
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
											<strong>{call.method}</strong> {call.endpoint}
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
										style={{ padding: '20px', background: 'white', borderTop: '1px solid #e5e7eb' }}
									>
										<p style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px' }}>
											{call.description}
										</p>

										{call.notes && call.notes.length > 0 && (
											<div
												style={{
													marginBottom: '16px',
													padding: '12px',
													background: '#eff6ff',
													borderRadius: '6px',
													border: '1px solid #93c5fd',
												}}
											>
												<div
													style={{
														fontSize: '12px',
														fontWeight: '600',
														color: '#1e40af',
														marginBottom: '8px',
													}}
												>
													Important Notes:
												</div>
												<ul
													style={{
														margin: 0,
														paddingLeft: '20px',
														fontSize: '13px',
														color: '#1e40af',
													}}
												>
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
														fontSize: '15px',
														fontWeight: '700',
														color: '#374151',
														marginBottom: '12px',
													}}
												>
													Request Body:
												</div>
												<pre
													style={{
														margin: 0,
														padding: '16px',
														background: '#f9fafb',
														borderRadius: '6px',
														border: '4px solid #f97316',
														fontSize: '14px',
														overflow: 'auto',
														color: '#1f2937',
														fontWeight: '500',
													}}
												>
													{JSON.stringify(call.requestBody, null, 2)}
												</pre>
											</div>
										)}

										{Object.keys(call.responseBody).length > 0 && (
											<div>
												<div
													style={{
														fontSize: '13px',
														fontWeight: '600',
														color: '#374151',
														marginBottom: '8px',
													}}
												>
													Response:
												</div>
												<pre
													style={{
														margin: 0,
														padding: '16px',
														background: '#f9fafb',
														borderRadius: '6px',
														border: '1px solid #e5e7eb',
														fontSize: '13px',
														overflow: 'auto',
														color: '#1f2937',
													}}
												>
													{JSON.stringify(call.responseBody, null, 2)}
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

			{/* UI Requirements */}
			<div
				style={{
					background: '#fffbeb',
					border: '1px solid #fcd34d',
					borderRadius: '12px',
					padding: '24px',
					marginBottom: '32px',
				}}
			>
				<h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
					UI Requirements
				</h3>
				{flowType === 'registration' && (
					<div>
						<h4
							style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', color: '#78350f' }}
						>
							OTP Validation Modal
						</h4>
						<ul style={{ margin: 0, paddingLeft: '20px', color: '#78350f', fontSize: '14px' }}>
							<li>
								<strong>When:</strong> Device status is{' '}
								<code style={{ background: '#fef3c7', padding: '2px 6px', borderRadius: '3px' }}>
									ACTIVATION_REQUIRED
								</code>
							</li>
							<li>
								<strong>Requires:</strong> User must enter OTP code received via{' '}
								{deviceInfo.deviceName.toLowerCase()}
							</li>
							<li>
								<strong>Action:</strong> Calls device activation API with OTP
							</li>
						</ul>
					</div>
				)}
			</div>

			{/* API References */}
			<div
				style={{
					background: '#f0fdf4',
					border: '1px solid #6ee7b7',
					borderRadius: '12px',
					padding: '24px',
				}}
			>
				<h3
					style={{
						margin: '0 0 16px 0',
						fontSize: '18px',
						fontWeight: '600',
						color: '#065f46',
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<FiBook size={20} color="#10b981" />
					API References
				</h3>
				<ul style={{ margin: 0, paddingLeft: '20px', color: '#065f46', fontSize: '14px' }}>
					<li>
						<a
							href={deviceInfo.registrationApiDocs}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#059669', textDecoration: 'underline' }}
						>
							{deviceInfo.deviceName} Device Registration API
						</a>
					</li>
					<li>
						<a
							href={deviceInfo.activationApiDocs}
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#059669', textDecoration: 'underline' }}
						>
							Device Activation API
						</a>
					</li>
					<li>
						<a
							href="https://apidocs.pingidentity.com/pingone/mfa/v1/api/"
							target="_blank"
							rel="noopener noreferrer"
							style={{ color: '#059669', textDecoration: 'underline' }}
						>
							PingOne MFA API Documentation
						</a>
					</li>
				</ul>
			</div>
		</div>
	);
};
