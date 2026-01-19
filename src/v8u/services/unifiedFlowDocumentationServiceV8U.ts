/**
 * @file unifiedFlowDocumentationServiceV8U.ts
 * @module v8u/services
 * @description Service to generate combined documentation for all Unified Flow use cases
 * @version 8.0.0
 */

import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import {
	convertTrackedCallsToDocumentation,
	generateUnifiedFlowMarkdown,
} from '../components/UnifiedFlowDocumentationPageV8U';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U';

interface UseCase {
	flowType: FlowType;
	specVersion: SpecVersion;
	credentials?: UnifiedFlowCredentials;
	apiCalls: ReturnType<typeof convertTrackedCallsToDocumentation>;
}

/**
 * Generate combined documentation for all Unified Flow use cases
 */
export const generateAllUseCasesDocumentation = (): string => {
	const flowTypeLabels: Record<FlowType, string> = {
		'oauth-authz': 'Authorization Code',
		hybrid: 'Hybrid',
		implicit: 'Implicit',
		'client-credentials': 'Client Credentials',
		'device-code': 'Device Code',
	};

	const specVersions: SpecVersion[] = ['oauth2.0', 'oauth2.1', 'oidc'];
	const flowTypes: FlowType[] = [
		'oauth-authz',
		'hybrid',
		'implicit',
		'client-credentials',
		'device-code',
	];

	const generatedDate = new Date().toLocaleString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short',
	});

	let md = `# PingOne OAuth 2.0 - All Unified Flow Use Cases\n\n`;
	md += `**Generated:** ${generatedDate}\n\n`;
	md += `## Overview\n\n`;
	md += `This document contains API call documentation for all OAuth 2.0 flow types and specification versions supported by the Unified Flow system.\n\n`;
	md += `### Supported Flow Types\n\n`;
	flowTypes.forEach((flowType) => {
		md += `- **${flowTypeLabels[flowType]}** (${flowType})\n`;
	});
	md += `\n### Supported Specification Versions\n\n`;
	specVersions.forEach((spec) => {
		const specLabel = SpecVersionServiceV8.getSpecLabel(spec);
		md += `- **${specLabel}**\n`;
	});
	md += `\n---\n\n`;

	// Get all tracked API calls
	const allTrackedCalls = apiCallTrackerService.getApiCalls();

	// Group calls by flow type and spec version
	const useCases: UseCase[] = [];
	for (const flowType of flowTypes) {
		for (const specVersion of specVersions) {
			// Filter calls for this flow type (we'll use a generic filter since we don't have spec version in tracked calls)
			const filteredCalls = allTrackedCalls.filter(
				(call) => call.flowType === 'unified' || call.step?.startsWith('unified-')
			);

			if (filteredCalls.length > 0) {
				const apiCalls = convertTrackedCallsToDocumentation(filteredCalls, flowType, specVersion);
				if (apiCalls.length > 0) {
					useCases.push({
						flowType,
						specVersion,
						apiCalls,
					});
				}
			}
		}
	}

	// If no tracked calls, generate template documentation for each use case
	if (useCases.length === 0) {
		md += `## Note\n\n`;
		md += `No API calls have been tracked yet. Complete flows to see API call documentation here.\n\n`;
		md += `## Use Case Templates\n\n`;

		for (const flowType of flowTypes) {
			for (const specVersion of specVersions) {
				md += `### ${flowTypeLabels[flowType]} Flow (${specVersion.toUpperCase()})\n\n`;
				md += `Complete this flow to see API calls documented here.\n\n`;
				md += `---\n\n`;
			}
		}
	} else {
		// Generate documentation for each use case
		useCases.forEach((useCase, index) => {
			md += `## ${flowTypeLabels[useCase.flowType]} Flow (${useCase.specVersion.toUpperCase()})\n\n`;
			const useCaseMarkdown = generateUnifiedFlowMarkdown(
				useCase.flowType,
				useCase.specVersion,
				useCase.apiCalls,
				useCase.credentials
			);

			// Extract the content after the title (skip the first line which is the title)
			const contentLines = useCaseMarkdown.split('\n');
			const contentWithoutTitle = contentLines.slice(2).join('\n'); // Skip title and empty line
			md += contentWithoutTitle;

			if (index < useCases.length - 1) {
				md += `\n\n---\n\n`;
			}
		});
	}

	md += `\n## References\n\n`;
	md += `- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)\n`;
	md += `- [OAuth 2.0 Device Authorization Grant (RFC 8628)](https://datatracker.ietf.org/doc/html/rfc8628)\n`;
	md += `- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)\n`;
	md += `- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)\n`;
	md += `- [PingOne API Documentation](https://apidocs.pingidentity.com/)\n`;

	return md;
};

/**
 * Export all use cases as markdown file
 */
export const exportAllUseCasesAsMarkdown = (): void => {
	const markdown = generateAllUseCasesDocumentation();
	const filename = `pingone-all-unified-flows-${new Date().toISOString().split('T')[0]}.md`;

	const blob = new Blob([markdown], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

/**
 * Export all use cases as PDF
 */
export const exportAllUseCasesAsPDF = (): void => {
	const markdown = generateAllUseCasesDocumentation();
	const title = 'PingOne OAuth 2.0 - All Unified Flow Use Cases';

	// Convert markdown to HTML (simplified version)
	const markdownToHtml = (md: string): string => {
		let html = '';
		let inCodeBlock = false;

		const lines = md.split('\n');

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

	const html = markdownToHtml(markdown);
	const fullHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>${title}</title>
			<style>
				body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
				h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
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
