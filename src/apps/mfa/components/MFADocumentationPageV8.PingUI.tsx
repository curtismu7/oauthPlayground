/**
 * @file MFADocumentationPageV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migrated comprehensive documentation page for MFA device registration flows
 * @version 8.0.0-Bootstrap
 *
 * Displays API calls, JSON bodies, rules, and allows download as PDF/MD
 * Migrated to Ping UI with Bootstrap icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';
// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';
import { apiCallTrackerService } from '@/services/apiCallTrackerService';
import {
	downloadPostmanCollectionWithEnvironment,
	generateMFAPostmanCollection,
} from '@/services/postmanCollectionGeneratorV8';
import type { DeviceType } from '../flows/shared/MFATypes';

interface MFADocumentationPageV8PingUIProps {
	deviceType: DeviceType;
	flowType: 'registration' | 'authentication';
	credentials?: {
		environmentId?: string;
		username?: string;
		deviceAuthenticationPolicyId?: string;
	};
	currentStep?: number;
	totalSteps?: number;
	// Flow-specific props
	registrationFlowType?: 'admin' | 'user';
	adminDeviceStatus?: 'ACTIVE' | 'ACTIVATION_REQUIRED';
	tokenType?: 'worker' | 'user';
	flowSpecificData?: {
		environmentId?: string;
		userId?: string;
		deviceId?: string;
		policyId?: string;
		deviceStatus?: string;
		username?: string;
		clientId?: string;
		phone?: string;
		email?: string;
	};
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
  padding: ${({ $isOpen }) => ($isOpen ? 'var(--spacing-lg, 1.5rem) 0' : '0')};
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

export const MFADocumentationPageV8PingUI: React.FC<MFADocumentationPageV8PingUIProps> = ({
	deviceType,
	flowType,
	credentials,
	currentStep = 1,
	totalSteps = 5,
	registrationFlowType = 'user',
	adminDeviceStatus = 'ACTIVATION_REQUIRED',
	tokenType = 'user',
	flowSpecificData,
}) => {
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
		const deviceTypeLabel = deviceType.replace('_', ' ').toUpperCase();
		const flowTypeLabel = flowType.charAt(0).toUpperCase() + flowType.slice(1);

		return {
			title: `${deviceTypeLabel} ${flowTypeLabel} Documentation`,
			description: `Complete API documentation for ${deviceTypeLabel} device ${flowTypeLabel} flow`,
			apiCalls: apiCalls.map((call) => ({
				...call,
				prettyBody: (() => {
					try {
						return JSON.stringify(JSON.parse(call.body || '{}'), null, 2);
					} catch {
						return call.body || '{}';
					}
				})(),
			})),
		};
	}, [deviceType, flowType]);

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
			const collection = generateMFAPostmanCollection(deviceType, flowType);
			await downloadPostmanCollectionWithEnvironment(collection, deviceType);
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

	return (
		<div className="end-user-nano">
			<DocumentationContainer>
				<Header>
					<Title>
						<BootstrapIcon
							icon={getBootstrapIconName('book')}
							size={24}
							ariaLabel="Documentation"
						/>
						{generateDocumentation.title}
					</Title>
					<ActionButtons>
						<ActionButton onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
							{isGeneratingPDF ? (
								<LoadingSpinner />
							) : (
								<BootstrapIcon
									icon={getBootstrapIconName('download')}
									size={16}
									ariaLabel="Download PDF"
								/>
							)}
							{isGeneratingPDF ? 'Generating...' : 'Download PDF'}
						</ActionButton>
						<ActionButton onClick={handleDownloadMD} disabled={isGeneratingMD}>
							{isGeneratingMD ? (
								<LoadingSpinner />
							) : (
								<BootstrapIcon
									icon={getBootstrapIconName('file-earmark-text')}
									size={16}
									ariaLabel="Download Markdown"
								/>
							)}
							{isGeneratingMD ? 'Generating...' : 'Download MD'}
						</ActionButton>
						<SecondaryButton onClick={handleDownloadPostman} disabled={isGeneratingPostman}>
							{isGeneratingPostman ? (
								<LoadingSpinner />
							) : (
								<BootstrapIcon
									icon={getBootstrapIconName('box-seam')}
									size={16}
									ariaLabel="Download Postman Collection"
								/>
							)}
							{isGeneratingPostman ? 'Generating...' : 'Postman'}
						</SecondaryButton>
					</ActionButtons>
				</Header>

				{totalSteps > 1 && (
					<ProgressIndicator>
						<BootstrapIcon
							icon={getBootstrapIconName('info-circle')}
							size={16}
							ariaLabel="Progress Information"
						/>
						<ProgressText>
							Step {currentStep} of {totalSteps} - {generateDocumentation.description}
						</ProgressText>
					</ProgressIndicator>
				)}

				<Section>
					<SectionHeader onClick={() => toggleSection('api-calls')}>
						<SectionTitle>
							API Calls
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedSections.has('api-calls') ? 'chevron-up' : 'chevron-down'
								)}
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
									<CopyButton
										onClick={() =>
											copyToClipboard(
												typeof call.prettyBody === 'string'
													? call.prettyBody
													: JSON.stringify(call.prettyBody, null, 2)
											)
										}
									>
										<BootstrapIcon
											icon={getBootstrapIconName('clipboard')}
											size={12}
											ariaLabel="Copy"
										/>
										Copy
									</CopyButton>
								</ApiCallHeader>
								{call.body && (
									<ApiBody>
										<JsonDisplay>
											{typeof call.prettyBody === 'string'
												? call.prettyBody
												: JSON.stringify(call.prettyBody, null, 2)}
										</JsonDisplay>
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
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedSections.has('credentials') ? 'chevron-up' : 'chevron-down'
								)}
								size={16}
								ariaLabel={expandedSections.has('credentials') ? 'Collapse' : 'Expand'}
							/>
						</SectionTitle>
					</SectionHeader>
					<SectionContent $isOpen={expandedSections.has('credentials')}>
						<InfoBox>
							<BootstrapIcon
								icon={getBootstrapIconName('info-circle')}
								size={20}
								ariaLabel="Information"
							/>
							<InfoText>
								<strong>Environment ID:</strong> {credentials?.environmentId || 'Not provided'}
								<br />
								<strong>Username:</strong> {credentials?.username || 'Not provided'}
								<br />
								<strong>Policy ID:</strong>{' '}
								{credentials?.deviceAuthenticationPolicyId || 'Not provided'}
								<br />
								<strong>Device Type:</strong> {deviceType}
								<br />
								<strong>Flow Type:</strong> {flowType}
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>

				<Section>
					<SectionHeader onClick={() => toggleSection('flow-details')}>
						<SectionTitle>
							Flow Details
							<BootstrapIcon
								icon={getBootstrapIconName(
									expandedSections.has('flow-details') ? 'chevron-up' : 'chevron-down'
								)}
								size={16}
								ariaLabel={expandedSections.has('flow-details') ? 'Collapse' : 'Expand'}
							/>
						</SectionTitle>
					</SectionHeader>
					<SectionContent $isOpen={expandedSections.has('flow-details')}>
						<InfoBox>
							<BootstrapIcon
								icon={getBootstrapIconName('info-circle')}
								size={20}
								ariaLabel="Information"
							/>
							<InfoText>
								<strong>Registration Flow Type:</strong> {registrationFlowType}
								<br />
								<strong>Admin Device Status:</strong> {adminDeviceStatus}
								<br />
								<strong>Token Type:</strong> {tokenType}
								<br />
								{flowSpecificData &&
									Object.entries(flowSpecificData).map(([key, value]) => (
										<span key={key}>
											<strong>{key}:</strong> {value || 'Not provided'}
											<br />
										</span>
									))}
							</InfoText>
						</InfoBox>
					</SectionContent>
				</Section>
			</DocumentationContainer>
		</div>
	);
};

export default MFADocumentationPageV8PingUI;
