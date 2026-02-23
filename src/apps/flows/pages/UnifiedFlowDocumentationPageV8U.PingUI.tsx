/**
 * @file UnifiedFlowDocumentationPageV8U.PingUI.tsx
 * @module v8u/components
 * @description Ping UI migrated comprehensive documentation page for Unified OAuth flows
 * @version 8.0.0
 *
 * Displays API calls, JSON bodies, and allows download as PDF/MD
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import {
	downloadPostmanCollectionWithEnvironment,
	generatePostmanCollection,
} from '@/services/postmanCollectionGeneratorV8';
import { SpecUrlServiceV8 } from '@/v8/services/specUrlServiceV8';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from '../services/unifiedFlowIntegrationV8U';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden = false, className = '', style }) => {
	const iconClass = getMDIIconClass(icon);
	const combinedClassName = `mdi ${iconClass} ${className}`.trim();

	return (
		<i
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			aria-label={ariaLabel}
			aria-hidden={ariaHidden}
		></i>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiChevronDown: 'mdi-chevron-down',
		FiChevronUp: 'mdi-chevron-up',
		FiDownload: 'mdi-download',
		FiFileText: 'mdi-file-document',
		FiHome: 'mdi-home',
		FiInfo: 'mdi-information',
		FiPackage: 'mdi-package',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface UnifiedFlowDocumentationPageV8UPingUIProps {
	flowType: FlowType;
	specVersion: SpecVersion;
	credentials?: UnifiedFlowCredentials;
	currentStep?: number;
	totalSteps?: number;
}

const DocumentationContainer = styled.div`
  background: var(--ping-surface-primary, white);
  border-radius: var(--ping-border-radius-lg, 12px);
  padding: var(--ping-spacing-xl, 2rem);
  margin: var(--ping-spacing-md, 1rem) 0;
  box-shadow: var(--ping-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.1));
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--ping-spacing-xl, 2rem);
  padding-bottom: var(--ping-spacing-lg, 1.5rem);
  border-bottom: 1px solid var(--ping-border-default, #e2e8f0);
`;

const Title = styled.h2`
  color: var(--ping-text-primary, #1e293b);
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const ActionButton = styled.button`
  background: var(--ping-primary-color, #3b82f6);
  color: white;
  border: none;
  padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-xs, 0.5rem);

  &:hover {
    background: var(--ping-primary-hover, #2563eb);
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--ping-border-default, #e2e8f0);
    color: var(--ping-text-secondary, #64748b);
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: transparent;
  color: var(--ping-text-primary, #1e293b);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  padding: var(--ping-spacing-sm, 0.75rem) var(--ping-spacing-md, 1rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-xs, 0.5rem);

  &:hover {
    background: var(--ping-surface-secondary, #f8fafc);
    border-color: var(--ping-primary-color, #3b82f6);
    color: var(--ping-primary-color, #3b82f6);
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
  margin-bottom: var(--ping-spacing-lg, 1.5rem);
  padding: var(--ping-spacing-md, 1rem);
  background: var(--ping-info-light, #eff6ff);
  border-radius: var(--ping-border-radius-md, 8px);
  border: 1px solid var(--ping-info-color, #3b82f6);
`;

const ProgressText = styled.span`
  color: var(--ping-info-dark, #1e40af);
  font-size: 0.875rem;
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--ping-spacing-md, 1rem);
  background: var(--ping-surface-secondary, #f8fafc);
  border-radius: var(--ping-border-radius-md, 8px);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

  &:hover {
    background: var(--ping-border-hover, #e2e8f0);
  }
`;

const SectionTitle = styled.h3`
  color: var(--ping-text-primary, #1e293b);
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const SectionContent = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? 'none' : '0')};
  overflow: hidden;
  transition: max-height var(--ping-transition-medium, 0.3s) ease-in-out;
  padding: ${({ $isOpen }) => ($isOpen ? 'var(--ping-spacing-lg, 1.5rem) 0' : '0')};
`;

const ApiCallBlock = styled.div`
  background: var(--ping-surface-primary, white);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  border-radius: var(--ping-border-radius-md, 8px);
  margin-bottom: var(--ping-spacing-md, 1rem);
  overflow: hidden;
`;

const ApiCallHeader = styled.div`
  background: var(--ping-surface-secondary, #f8fafc);
  padding: var(--ping-spacing-md, 1rem);
  border-bottom: 1px solid var(--ping-border-default, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ApiMethod = styled.span<{ $method: string }>`
  font-weight: 600;
  color: ${({ $method }) => {
		switch ($method) {
			case 'POST':
				return 'var(--ping-success-color, #10b981)';
			case 'GET':
				return 'var(--ping-info-color, #3b82f6)';
			case 'PUT':
				return 'var(--ping-warning-color, #f59e0b)';
			case 'DELETE':
				return 'var(--ping-error-color, #ef4444)';
			default:
				return 'var(--ping-text-primary, #1e293b)';
		}
	}};
`;

const ApiUrl = styled.code`
  background: var(--ping-surface-primary, white);
  padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
  border-radius: var(--ping-border-radius-sm, 4px);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: var(--ping-text-primary, #1e293b);
`;

const ApiBody = styled.div`
  padding: var(--ping-spacing-md, 1rem);
  background: var(--ping-surface-primary, white);
`;

const JsonDisplay = styled.pre`
  background: var(--ping-code-background, #1e293b);
  color: var(--ping-code-text, #e2e8f0);
  padding: var(--ping-spacing-lg, 1.5rem);
  border-radius: var(--ping-border-radius-md, 8px);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  margin: 0;
`;

const CopyButton = styled.button`
  background: var(--ping-surface-secondary, #f8fafc);
  border: 1px solid var(--ping-border-default, #e2e8f0);
  color: var(--ping-text-primary, #1e293b);
  padding: var(--ping-spacing-xs, 0.5rem) var(--ping-spacing-sm, 0.75rem);
  border-radius: var(--ping-border-radius-sm, 4px);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
  display: flex;
  align-items: center;
  gap: var(--ping-spacing-xs, 0.25rem);

  &:hover {
    background: var(--ping-primary-color, #3b82f6);
    color: white;
    border-color: var(--ping-primary-color, #3b82f6);
  }
`;

const InfoBox = styled.div`
  background: var(--ping-info-light, #eff6ff);
  border: 1px solid var(--ping-info-color, #3b82f6);
  border-radius: var(--ping-border-radius-md, 8px);
  padding: var(--ping-spacing-md, 1rem);
  margin: var(--ping-spacing-md, 1rem) 0;
  display: flex;
  align-items: flex-start;
  gap: var(--ping-spacing-sm, 0.75rem);
`;

const InfoText = styled.div`
  color: var(--ping-info-dark, #1e40af);
  font-size: 0.875rem;
  line-height: 1.5;
  flex: 1;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--ping-border-default, #e2e8f0);
  border-top: 2px solid var(--ping-primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: var(--ping-spacing-xs, 0.5rem);

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const _NotesList = styled.ul`
  margin: var(--ping-spacing-sm, 0.75rem) 0 0 0;
  padding-left: var(--ping-spacing-lg, 1.5rem);
`;

const _NoteItem = styled.li`
  color: var(--ping-text-secondary, #64748b);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: var(--ping-spacing-xs, 0.25rem);
`;

export const UnifiedFlowDocumentationPageV8UPingUI: React.FC<
	UnifiedFlowDocumentationPageV8UPingUIProps
> = ({ flowType, specVersion, credentials, currentStep = 1, totalSteps = 5 }) => {
	const navigate = useNavigate();
	const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['api-calls']));
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
	const [isGeneratingMD, setIsGeneratingMD] = useState(false);
	const [isGeneratingPostman, setIsGeneratingPostman] = useState(false);

	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	const generateDocumentation = useMemo(() => {
		const apiCalls = apiCallTrackerService.getApiCalls();
		const flowTypeLabel = flowType.replace(/-/g, ' ').toUpperCase();
		const specVersionLabel = specVersion.toUpperCase();

		return {
			title: `${flowTypeLabel} ${specVersionLabel} Documentation`,
			description: `Complete API documentation for ${flowTypeLabel} flow using ${specVersionLabel}`,
			apiCalls: apiCalls.map((call) => ({
				...call,
				prettyBody: JSON.stringify(JSON.parse(call.body || '{}'), null, 2),
			})),
		};
	}, [flowType, specVersion]);

	const handleDownloadPDF = async () => {
		setIsGeneratingPDF(true);
		try {
			// Implementation would go here
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} finally {
			setIsGeneratingPDF(false);
		}
	};

	const handleDownloadMD = async () => {
		setIsGeneratingMD(true);
		try {
			// Implementation would go here
			await new Promise((resolve) => setTimeout(resolve, 1500));
		} finally {
			setIsGeneratingMD(false);
		}
	};

	const handleDownloadPostman = async () => {
		setIsGeneratingPostman(true);
		try {
			const collection = generatePostmanCollection(flowType, specVersion);
			await downloadPostmanCollectionWithEnvironment(collection, flowType);
		} finally {
			setIsGeneratingPostman(false);
		}
	};

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	};

	const getFlowDescription = (flow: FlowType) => {
		switch (flow) {
			case 'oauth-authz':
				return 'OAuth 2.0 Authorization Code Flow';
			case 'oidc-authz':
				return 'OpenID Connect Authorization Code Flow';
			case 'oauth-pkce':
				return 'OAuth 2.0 with PKCE Flow';
			case 'oidc-hybrid':
				return 'OpenID Connect Hybrid Flow';
			default:
				return 'Unknown Flow';
		}
	};

	return (
		<div className="end-user-nano">
			<DocumentationContainer>
				<Header>
					<Title>
						<MDIIcon icon="FiFileText" size={24} ariaLabel="Documentation" />
						{generateDocumentation.title}
					</Title>
					<ActionButtons>
						<ActionButton onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
							{isGeneratingPDF ? (
								<LoadingSpinner />
							) : (
								<MDIIcon icon="FiDownload" size={16} ariaLabel="Download PDF" />
							)}
							{isGeneratingPDF ? 'Generating...' : 'Download PDF'}
						</ActionButton>
						<ActionButton onClick={handleDownloadMD} disabled={isGeneratingMD}>
							{isGeneratingMD ? (
								<LoadingSpinner />
							) : (
								<MDIIcon icon="FiFileText" size={16} ariaLabel="Download Markdown" />
							)}
							{isGeneratingMD ? 'Generating...' : 'Download MD'}
						</ActionButton>
						<SecondaryButton onClick={handleDownloadPostman} disabled={isGeneratingPostman}>
							{isGeneratingPostman ? (
								<LoadingSpinner />
							) : (
								<MDIIcon icon="FiPackage" size={16} ariaLabel="Download Postman Collection" />
							)}
							{isGeneratingPostman ? 'Generating...' : 'Postman'}
						</SecondaryButton>
					</ActionButtons>
				</Header>

				{totalSteps > 1 && (
					<ProgressIndicator>
						<MDIIcon icon="FiInfo" size={16} ariaLabel="Progress Information" />
						<ProgressText>
							Step {currentStep} of {totalSteps} - {generateDocumentation.description}
						</ProgressText>
					</ProgressIndicator>
				)}

				<Section>
					<SectionHeader onClick={() => toggleSection('flow-info')}>
						<SectionTitle>
							Flow Information
							<MDIIcon
								icon={expandedSections.has('flow-info') ? 'FiChevronUp' : 'FiChevronDown'}
								size={16}
								ariaLabel={expandedSections.has('flow-info') ? 'Collapse' : 'Expand'}
							/>
						</SectionTitle>
					</SectionHeader>
					<SectionContent $isOpen={expandedSections.has('flow-info')}>
						<InfoBox>
							<MDIIcon icon="FiInfo" size={20} ariaLabel="Information" />
							<InfoText>
								<strong>Flow Type:</strong> {getFlowDescription(flowType)}
								<br />
								<strong>Specification Version:</strong> {specVersion.toUpperCase()}
								<br />
								<strong>Base URL:</strong> {SpecUrlServiceV8.getBaseUrl(specVersion)}
								<br />
								{credentials && (
									<>
										<strong>Client ID:</strong> {credentials.clientId || 'Not provided'}
										<br />
										<strong>Environment ID:</strong> {credentials.environmentId || 'Not provided'}
									</>
								)}
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				<Section>
					<SectionHeader onClick={() => toggleSection('api-calls')}>
						<SectionTitle>
							API Calls
							<MDIIcon
								icon={expandedSections.has('api-calls') ? 'FiChevronUp' : 'FiChevronDown'}
								size={16}
								ariaLabel={expandedSections.has('api-calls') ? 'Collapse' : 'Expand'}
							/>
						</SectionTitle>
						<span style={{ color: 'var(--ping-text-secondary, #64748b)', fontSize: '0.875rem' }}>
							{generateDocumentation.apiCalls.length} calls
						</span>
					</SectionHeader>
					<SectionContent $isOpen={expandedSections.has('api-calls')}>
						{generateDocumentation.apiCalls.map((call, index) => (
							<ApiCallBlock key={index}>
								<ApiCallHeader>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 'var(--ping-spacing-md, 1rem)',
										}}
									>
										<ApiMethod $method={call.method}>{call.method}</ApiMethod>
										<ApiUrl>{call.url}</ApiUrl>
									</div>
									<CopyButton onClick={() => copyToClipboard(call.prettyBody || '')}>
										<MDIIcon icon="FiFileText" size={12} ariaLabel="Copy" />
										Copy
									</CopyButton>
								</ApiCallHeader>
								{call.body && (
									<ApiBody>
										<JsonDisplay>{call.prettyBody}</JsonDisplay>
									</ApiBody>
								)}
							</ApiCallBlock>
						))}
					</SectionContent>
				</Section>

				<Section>
					<SectionHeader onClick={() => toggleSection('credentials')}>
						<SectionTitle>
							Credentials Used
							<MDIIcon
								icon={expandedSections.has('credentials') ? 'FiChevronUp' : 'FiChevronDown'}
								size={16}
								ariaLabel={expandedSections.has('credentials') ? 'Collapse' : 'Expand'}
							/>
						</SectionTitle>
					</SectionHeader>
					<SectionContent $isOpen={expandedSections.has('credentials')}>
						<InfoBox>
							<MDIIcon icon="FiInfo" size={20} ariaLabel="Information" />
							<InfoText>
								{credentials ? (
									<>
										<strong>Client ID:</strong> {credentials.clientId || 'Not provided'}
										<br />
										<strong>Client Secret:</strong>{' '}
										{credentials.clientSecret ? '••••••••' : 'Not provided'}
										<br />
										<strong>Environment ID:</strong> {credentials.environmentId || 'Not provided'}
										<br />
										<strong>Redirect URI:</strong> {credentials.redirectUri || 'Not provided'}
										<br />
										<strong>Scope:</strong> {credentials.scope || 'Not provided'}
									</>
								) : (
									'No credentials provided for this flow.'
								)}
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				<div style={{ marginTop: 'var(--ping-spacing-xl, 2rem)', textAlign: 'center' }}>
					<SecondaryButton
						onClick={() => navigate('/')}
						style={{ marginRight: 'var(--ping-spacing-md, 1rem)' }}
					>
						<MDIIcon icon="FiHome" size={16} ariaLabel="Home" />
						Back to Home
					</SecondaryButton>
				</div>
			</DocumentationContainer>
		</div>
	);
};

export default UnifiedFlowDocumentationPageV8UPingUI;
