/**
 * @file UnifiedDocumentationModalV8U.tsx
 * @module v8u/components
 * @description Modal for selecting and downloading Unified flow documentation
 * @version 8.0.0
 *
 * Allows users to select specific spec versions and flow types
 * and download documentation as PDF or Markdown.
 */

import React, { useState } from 'react';
import { FiBook, FiDownload, FiFileText, FiX } from 'react-icons/fi';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import {
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';
	type DocumentationApiCall,
	downloadAsMarkdown,
	downloadAsPDF,
	generateUnifiedFlowMarkdown,
} from './UnifiedFlowDocumentationPageV8U';

interface UseCase {
	id: string;
	flowType: FlowType;
	specVersion: SpecVersion;
	title: string;
	description: string;
}

interface UnifiedDocumentationModalV8UProps {
	isOpen: boolean;
	onClose: () => void;
}

const SPEC_VERSIONS: SpecVersion[] = ['oauth2.0', 'oidc', 'oauth2.1'];
const FLOW_TYPES: FlowType[] = [
	'oauth-authz',
	'implicit',
	'client-credentials',
	'device-code',
	'hybrid',
];

const FLOW_TYPE_LABELS: Record<FlowType, string> = {
	'oauth-authz': 'Authorization Code',
	implicit: 'Implicit',
	'client-credentials': 'Client Credentials',
	'device-code': 'Device Code',
	hybrid: 'Hybrid',
};

const SPEC_VERSION_LABELS: Record<SpecVersion, string> = {
	'oauth2.0': 'OAuth 2.0',
	oidc: 'OIDC Core 1.0',
	'oauth2.1': 'OAuth 2.1 / OIDC 2.1',
};

// Generate all possible use cases
const USE_CASES: UseCase[] = [];
SPEC_VERSIONS.forEach((specVersion) => {
	FLOW_TYPES.forEach((flowType) => {
		// Skip flows that don't exist for certain spec versions
		if (specVersion === 'oauth2.0' && (flowType === 'hybrid' || flowType === 'implicit')) {
			return; // Hybrid and Implicit are OIDC Core 1.0 only
		}
		if (specVersion === 'oauth2.1' && flowType === 'implicit') {
			return; // Implicit is deprecated in OAuth 2.1 / OIDC 2.1
		}
		USE_CASES.push({
			id: `${specVersion}-${flowType}`,
			flowType,
			specVersion,
			title: `${FLOW_TYPE_LABELS[flowType]} (${SPEC_VERSION_LABELS[specVersion]})`,
			description: `Complete ${FLOW_TYPE_LABELS[flowType]} flow implementation for ${SPEC_VERSION_LABELS[specVersion]}, including authorization, token exchange, and token usage.`,
		});
	});
});

// Generate mock API calls for documentation purposes
// In a real implementation, these would be generated from actual flow execution data
const generateMockApiCalls = (
	flowType: FlowType,
	specVersion: SpecVersion
): DocumentationApiCall[] => {
	const baseCalls: DocumentationApiCall[] = [];

	// Common: Build Authorization URL
	if (flowType !== 'client-credentials') {
		baseCalls.push({
			step: 'Build Authorization URL',
			method: 'GET',
			endpoint: '{{authPath}}/{{envID}}/as/authorize',
			description: `Build authorization URL for ${FLOW_TYPE_LABELS[flowType]} flow (${SPEC_VERSION_LABELS[specVersion]})`,
			requestBody: {
				client_id: '{{client_id}}',
				response_type:
					flowType === 'oauth-authz'
						? 'code'
						: flowType === 'implicit'
							? 'token id_token'
							: 'code id_token',
				redirect_uri: '{{redirect_uri}}',
				scope: specVersion === 'oauth2.0' ? 'openid' : 'openid profile email',
				state: '{{state}}',
			},
			responseBody: {
				redirect_url: 'https://auth.pingone.com/...',
			},
		});
	}

	// Token exchange (for flows that use authorization code)
	if (flowType === 'oauth-authz' || flowType === 'hybrid') {
		baseCalls.push({
			step: 'Exchange Authorization Code for Tokens',
			method: 'POST',
			endpoint: '{{authPath}}/{{envID}}/as/token',
			description: `Exchange authorization code for access token and ID token using ${FLOW_TYPE_LABELS[flowType]} flow`,
			requestBody: {
				grant_type: 'authorization_code',
				code: '{{authorization_code}}',
				redirect_uri: '{{redirect_uri}}',
				client_id: '{{client_id}}',
				client_secret: '{{client_secret}}',
			},
			responseBody: {
				access_token: '{{access_token}}',
				token_type: 'Bearer',
				expires_in: 3600,
				id_token: '{{id_token}}',
				refresh_token: '{{refresh_token}}',
			},
		});
	}

	// Client Credentials specific
	if (flowType === 'client-credentials') {
		baseCalls.push({
			step: 'Request Access Token',
			method: 'POST',
			endpoint: '{{authPath}}/{{envID}}/as/token',
			description: `Request access token using Client Credentials flow (${SPEC_VERSION_LABELS[specVersion]})`,
			requestBody: {
				grant_type: 'client_credentials',
				client_id: '{{client_id}}',
				client_secret: '{{client_secret}}',
				scope: 'openid',
			},
			responseBody: {
				access_token: '{{access_token}}',
				token_type: 'Bearer',
				expires_in: 3600,
			},
		});
	}

	// Device Code specific
	if (flowType === 'device-code') {
		baseCalls.push({
			step: 'Request Device Authorization',
			method: 'POST',
			endpoint: '{{authPath}}/{{envID}}/as/device_authorization',
			description: `Request device authorization code for Device Code flow (${SPEC_VERSION_LABELS[specVersion]})`,
			requestBody: {
				client_id: '{{client_id}}',
				scope: 'openid profile email',
			},
			responseBody: {
				device_code: '{{device_code}}',
				user_code: '{{user_code}}',
				verification_uri: '{{verification_uri}}',
				expires_in: 600,
				interval: 5,
			},
		});
		baseCalls.push({
			step: 'Poll for Tokens',
			method: 'POST',
			endpoint: '{{authPath}}/{{envID}}/as/token',
			description: 'Poll for tokens using device code',
			requestBody: {
				grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
				device_code: '{{device_code}}',
				client_id: '{{client_id}}',
			},
			responseBody: {
				access_token: '{{access_token}}',
				token_type: 'Bearer',
				expires_in: 3600,
				id_token: '{{id_token}}',
				refresh_token: '{{refresh_token}}',
			},
		});
	}

	return baseCalls;
};

export const UnifiedDocumentationModalV8U: React.FC<UnifiedDocumentationModalV8UProps> = ({
	isOpen,
	onClose,
}) => {
	const [selectedCategory, setSelectedCategory] = useState<
		'all' | 'oauth2.0' | 'oidc' | 'oauth2.1' | 'specific'
	>('all');
	const [selectedUseCases, setSelectedUseCases] = useState<Set<string>>(new Set());
	const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'md'>('md');

	if (!isOpen) return null;

	const handleCategoryChange = (category: typeof selectedCategory) => {
		setSelectedCategory(category);
		if (category === 'all') {
			setSelectedUseCases(new Set(USE_CASES.map((uc) => uc.id)));
		} else if (category === 'oauth2.0' || category === 'oidc' || category === 'oauth2.1') {
			setSelectedUseCases(
				new Set(USE_CASES.filter((uc) => uc.specVersion === category).map((uc) => uc.id))
			);
		} else {
			setSelectedUseCases(new Set());
		}
	};

	const handleUseCaseToggle = (useCaseId: string) => {
		const newSelection = new Set(selectedUseCases);
		if (newSelection.has(useCaseId)) {
			newSelection.delete(useCaseId);
		} else {
			newSelection.add(useCaseId);
		}
		setSelectedUseCases(newSelection);
		setSelectedCategory('specific');
	};

	const handleDownload = async () => {
		if (selectedUseCases.size === 0) {
			alert('Please select at least one use case to download.');
			return;
		}

		const selectedCases = USE_CASES.filter((uc) => selectedUseCases.has(uc.id));

		try {
			if (downloadFormat === 'md') {
				await downloadMarkdown(selectedCases);
			} else {
				await downloadPDF(selectedCases);
			}
		} catch (error) {
			logger.error('Failed to download documentation:', error);
			alert('Failed to download documentation. Please try again.');
		}
	};

	const downloadMarkdown = async (useCases: UseCase[]) => {
		let markdown = '# Unified OAuth/OIDC Flow Documentation\n\n';
		markdown += `**Generated:** ${new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		})}\n\n`;
		markdown += `## Overview\n\n`;
		markdown += `This document contains comprehensive API documentation for ${useCases.length} selected Unified flow use case${useCases.length !== 1 ? 's' : ''}.\n\n`;

		// Group by spec version
		const groupedBySpec = useCases.reduce(
			(acc, uc) => {
				if (!acc[uc.specVersion]) {
					acc[uc.specVersion] = [];
				}
				acc[uc.specVersion].push(uc);
				return acc;
			},
			{} as Record<SpecVersion, UseCase[]>
		);

		// Generate documentation for each use case
		for (const [specVersion, cases] of Object.entries(groupedBySpec)) {
			markdown += `\n\n## ${SPEC_VERSION_LABELS[specVersion as SpecVersion]}\n\n`;
			for (const useCase of cases) {
				// Generate mock API calls for documentation
				// In a real implementation, these would come from the actual flow execution
				const apiCalls: DocumentationApiCall[] = generateMockApiCalls(
					useCase.flowType,
					useCase.specVersion
				);
				const useCaseMarkdown = generateUnifiedFlowMarkdown(
					useCase.flowType,
					useCase.specVersion,
					apiCalls,
					undefined // No credentials needed for documentation
				);
				markdown += `\n\n---\n\n`;
				markdown += useCaseMarkdown;
			}
		}

		// Download the markdown file
		const filename = `unified-flow-documentation-${new Date().toISOString().split('T')[0]}.md`;
		downloadAsMarkdown(markdown, filename);
	};

	const downloadPDF = async (useCases: UseCase[]) => {
		// Generate markdown for all use cases
		let combinedMarkdown = '# Unified OAuth/OIDC Flow Documentation\n\n';
		combinedMarkdown += `**Generated:** ${new Date().toLocaleString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		})}\n\n`;
		combinedMarkdown += `## Overview\n\n`;
		combinedMarkdown += `This document contains comprehensive API documentation for ${useCases.length} selected Unified flow use case${useCases.length !== 1 ? 's' : ''}.\n\n`;

		// Group by spec version
		const groupedBySpec = useCases.reduce(
			(acc, uc) => {
				if (!acc[uc.specVersion]) {
					acc[uc.specVersion] = [];
				}
				acc[uc.specVersion].push(uc);
				return acc;
			},
			{} as Record<SpecVersion, UseCase[]>
		);

		// Generate documentation for each use case
		for (const [specVersion, cases] of Object.entries(groupedBySpec)) {
			combinedMarkdown += `\n\n## ${SPEC_VERSION_LABELS[specVersion as SpecVersion]}\n\n`;
			for (const useCase of cases) {
				// Generate mock API calls for documentation
				const apiCalls: DocumentationApiCall[] = generateMockApiCalls(
					useCase.flowType,
					useCase.specVersion
				);
				const useCaseMarkdown = generateUnifiedFlowMarkdown(
					useCase.flowType,
					useCase.specVersion,
					apiCalls,
					undefined // No credentials needed for documentation
				);
				combinedMarkdown += `\n\n---\n\n`;
				combinedMarkdown += useCaseMarkdown;
			}
		}

		// Use the PDF download function
		const title = `Ping Identity - Unified OAuth/OIDC Flow Documentation (${useCases.length} use case${useCases.length !== 1 ? 's' : ''})`;
		downloadAsPDF(combinedMarkdown, title);
	};

	return (
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
				zIndex: 10000,
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: 'white',
					borderRadius: '12px',
					padding: '24px',
					maxWidth: '800px',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
					width: '90%',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '24px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<FiBook size={24} color="#fbbf24" />
						<h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
							Download Unified Flow Documentation
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							padding: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<FiX size={24} color="#6b7280" />
					</button>
				</div>

				{/* Category Selection */}
				<div style={{ marginBottom: '24px' }}>
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '12px',
						}}
					>
						Select Category
					</label>
					<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
						{[
							{ value: 'all', label: 'All Use Cases' },
							{ value: 'oauth2.0', label: 'OAuth 2.0 Only' },
							{ value: 'oidc', label: 'OIDC Core 1.0 Only' },
							{ value: 'oauth2.1', label: 'OAuth 2.1 / OIDC 2.1 Only' },
							{ value: 'specific', label: 'Select Specific Use Cases' },
						].map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => handleCategoryChange(option.value as typeof selectedCategory)}
								style={{
									padding: '10px 16px',
									border: `2px solid ${selectedCategory === option.value ? '#3b82f6' : '#d1d5db'}`,
									borderRadius: '8px',
									background: selectedCategory === option.value ? '#eff6ff' : 'white',
									color: selectedCategory === option.value ? '#3b82f6' : '#374151',
									fontSize: '14px',
									fontWeight: selectedCategory === option.value ? '600' : '500',
									cursor: 'pointer',
									transition: 'all 0.2s ease',
								}}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Use Case Selection */}
				{selectedCategory === 'specific' && (
					<div style={{ marginBottom: '24px' }}>
						<label
							style={{
								display: 'block',
								fontSize: '14px',
								fontWeight: '600',
								color: '#374151',
								marginBottom: '12px',
							}}
						>
							Select Use Cases ({selectedUseCases.size} selected)
						</label>
						<div
							style={{
								maxHeight: '300px',
								overflowY: 'auto',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '12px',
							}}
						>
							{USE_CASES.map((useCase) => (
								<label
									key={useCase.id}
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: '12px',
										padding: '12px',
										borderRadius: '6px',
										cursor: 'pointer',
										background: selectedUseCases.has(useCase.id) ? '#f0f9ff' : 'transparent',
										transition: 'background 0.2s ease',
									}}
								>
									<input
										type="checkbox"
										checked={selectedUseCases.has(useCase.id)}
										onChange={() => handleUseCaseToggle(useCase.id)}
										style={{
											marginTop: '4px',
											cursor: 'pointer',
											width: '18px',
											height: '18px',
										}}
									/>
									<div style={{ flex: 1 }}>
										<div
											style={{
												fontSize: '15px',
												fontWeight: '600',
												color: '#1f2937',
												marginBottom: '4px',
											}}
										>
											{useCase.title}
										</div>
										<div
											style={{
												fontSize: '13px',
												color: '#6b7280',
												lineHeight: '1.5',
											}}
										>
											{useCase.description}
										</div>
										<div
											style={{
												fontSize: '12px',
												color: '#9ca3af',
												marginTop: '4px',
											}}
										>
											{FLOW_TYPE_LABELS[useCase.flowType]} •{' '}
											{SPEC_VERSION_LABELS[useCase.specVersion]}
										</div>
									</div>
								</label>
							))}
						</div>
					</div>
				)}

				{/* Download Format Selection */}
				<div style={{ marginBottom: '24px' }}>
					<label
						style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							color: '#374151',
							marginBottom: '12px',
						}}
					>
						Download Format
					</label>
					<div style={{ display: 'flex', gap: '12px' }}>
						{[
							{ value: 'md', label: 'Markdown (.md)', icon: FiFileText },
							{ value: 'pdf', label: 'PDF (.pdf)', icon: FiDownload },
						].map((option) => {
							const Icon = option.icon;
							return (
								<button
									key={option.value}
									type="button"
									onClick={() => setDownloadFormat(option.value as 'pdf' | 'md')}
									style={{
										flex: 1,
										padding: '12px 16px',
										border: `2px solid ${downloadFormat === option.value ? '#3b82f6' : '#d1d5db'}`,
										borderRadius: '8px',
										background: downloadFormat === option.value ? '#eff6ff' : 'white',
										color: downloadFormat === option.value ? '#3b82f6' : '#374151',
										fontSize: '14px',
										fontWeight: downloadFormat === option.value ? '600' : '500',
										cursor: 'pointer',
										transition: 'all 0.2s ease',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: '8px',
									}}
								>
									<Icon size={18} />
									{option.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: '12px 24px',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							background: 'white',
							color: '#374151',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleDownload}
						disabled={selectedUseCases.size === 0}
						style={{
							padding: '12px 24px',
							border: 'none',
							borderRadius: '8px',
							background: selectedUseCases.size === 0 ? '#9ca3af' : '#3b82f6',
							color: 'white',
							fontSize: '14px',
							fontWeight: '600',
							cursor: selectedUseCases.size === 0 ? 'not-allowed' : 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						<FiDownload size={18} />
						Download ({selectedUseCases.size} use case{selectedUseCases.size !== 1 ? 's' : ''})
					</button>
				</div>
			</div>
		</div>
	);
};
