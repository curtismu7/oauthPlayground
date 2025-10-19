// src/components/EnhancedApiCallDisplay.tsx
// React component for displaying API calls with enhanced features

import React, { useCallback, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCode, FiCopy, FiExternalLink, FiInfo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
	type ApiCallDisplayOptions,
	type EnhancedApiCallData,
	EnhancedApiCallDisplayService,
} from '../services/enhancedApiCallDisplayService';
import { v4ToastManager } from '../utils/v4ToastMessages';

// Styled Components
const Container = styled.div<{ $theme?: 'light' | 'dark' }>`
	background: ${({ $theme }) => ($theme === 'dark' ? '#1f2937' : '#ffffff')};
	border: 1px solid ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e5e7eb')};
	border-radius: 12px;
	padding: 1.5rem;
	margin: 1rem 0;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	color: #111827;
	display: flex;
	align-items: center;
	gap: 0.75rem;
`;

const StatusBadge = styled.div<{
	$status: 'success' | 'error' | 'pending' | 'info';
	$clickable?: boolean;
}>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-radius: 9999px;
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
	transition: all 0.2s ease;
	background: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#d1fae5';
			case 'error':
				return '#fee2e2';
			case 'pending':
				return '#fef3c7';
			case 'info':
				return '#dbeafe';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${({ $status }) => {
		switch ($status) {
			case 'success':
				return '#065f46';
			case 'error':
				return '#991b1b';
			case 'pending':
				return '#92400e';
			case 'info':
				return '#1e40af';
			default:
				return '#374151';
		}
	}};

	${({ $clickable }) =>
		$clickable &&
		`
		&:hover {
			transform: scale(1.05);
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	`}
`;

const CollapsibleSection = styled.div`
	margin-bottom: 1rem;
`;

const SectionHeader = styled.div<{ $sectionType?: string }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.75rem;
	background: ${({ $sectionType }) => {
		switch ($sectionType) {
			case 'details':
				return 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'; // Blue gradient
			case 'curl':
				return 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'; // Green gradient
			case 'pingone':
				return 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'; // Yellow gradient
			case 'response':
				return 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'; // Pink gradient
			case 'notes':
				return 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'; // Purple gradient
			default:
				return '#f8fafc';
		}
	}};
	border: 2px solid ${({ $sectionType }) => {
		switch ($sectionType) {
			case 'details':
				return '#3b82f6'; // Blue border
			case 'curl':
				return '#10b981'; // Green border
			case 'pingone':
				return '#f59e0b'; // Yellow border
			case 'response':
				return '#ec4899'; // Pink border
			case 'notes':
				return '#8b5cf6'; // Purple border
			default:
				return '#e2e8f0';
		}
	}};
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	
	&:hover {
		background: ${({ $sectionType }) => {
			switch ($sectionType) {
				case 'details':
					return 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)'; // Darker blue
				case 'curl':
					return 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)'; // Darker green
				case 'pingone':
					return 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)'; // Darker yellow
				case 'response':
					return 'linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%)'; // Darker pink
				case 'notes':
					return 'linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%)'; // Darker purple
				default:
					return '#f1f5f9';
			}
		}};
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}
`;

const SectionTitle = styled.h4`
	margin: 0;
	font-size: 1rem;
	font-weight: 600;
	color: #374151;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const SectionContent = styled.div<{ $isExpanded: boolean }>`
	max-height: ${({ $isExpanded }) => ($isExpanded ? '1000px' : '0')};
	overflow: hidden;
	transition: max-height 0.3s ease;
	padding: ${({ $isExpanded }) => ($isExpanded ? '1rem' : '0')};
	border: ${({ $isExpanded }) => ($isExpanded ? '1px solid #e2e8f0' : 'none')};
	border-top: none;
	border-radius: 0 0 6px 6px;
`;

const CodeBlock = styled.pre<{ $theme?: 'light' | 'dark' }>`
	background: ${({ $theme }) => ($theme === 'dark' ? '#111827' : '#f8fafc')};
	border: 1px solid ${({ $theme }) => ($theme === 'dark' ? '#374151' : '#e2e8f0')};
	border-radius: 6px;
	padding: 1rem;
	overflow-x: auto;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	color: ${({ $theme }) => ($theme === 'dark' ? '#f9fafb' : '#374151')};
	margin: 0;
	white-space: pre-wrap;
`;

const InfoTooltip = styled.div<{ $show: boolean }>`
	position: absolute;
	top: 100%;
	right: 0;
	background: #1f2937;
	color: white;
	padding: 0.75rem 1rem;
	border-radius: 6px;
	font-size: 0.875rem;
	line-height: 1.4;
	z-index: 1000;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	white-space: nowrap;
	opacity: ${({ $show }) => ($show ? 1 : 0)};
	visibility: ${({ $show }) => ($show ? 'visible' : 'hidden')};
	transform: ${({ $show }) => ($show ? 'translateY(0)' : 'translateY(-10px)')};
	transition: all 0.2s ease;
	max-width: 300px;
	white-space: normal;

	&::before {
		content: '';
		position: absolute;
		top: -4px;
		right: 20px;
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-bottom: 4px solid #1f2937;
	}
`;

const URLDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 1rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	word-break: break-all;
	position: relative;
`;

const URLPart = styled.span<{
	$isHighlighted?: boolean;
	$color?: string;
	$backgroundColor?: string;
}>`
	background: ${({ $isHighlighted, $backgroundColor }) =>
		$isHighlighted ? ($backgroundColor || '#fef3c7') : 'transparent'};
	color: ${({ $isHighlighted, $color }) => ($isHighlighted ? $color || '#92400e' : 'inherit')};
	padding: ${({ $isHighlighted }) => ($isHighlighted ? '2px 4px' : '0')};
	border-radius: ${({ $isHighlighted }) => ($isHighlighted ? '4px' : '0')};
	font-weight: ${({ $isHighlighted }) => ($isHighlighted ? '600' : 'normal')};
	border: ${({ $isHighlighted, $color }) =>
		$isHighlighted ? `1px solid ${$color || '#f59e0b'}` : 'none'};
`;

const RARNote = styled.div`
	background: #fef3c7;
	border: 1px solid #f59e0b;
	border-radius: 8px;
	padding: 0.75rem 1rem;
	margin: 0.5rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: #92400e;
`;

const RARIcon = styled.div`
	color: #f59e0b;
	margin-top: 2px;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.75rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	background: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return '#3b82f6';
			case 'secondary':
				return '#f3f4f6';
			case 'success':
				return '#10b981';
			case 'danger':
				return '#ef4444';
			default:
				return '#f3f4f6';
		}
	}};
	color: ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return 'white';
			case 'secondary':
				return '#374151';
			case 'success':
				return 'white';
			case 'danger':
				return 'white';
			default:
				return '#374151';
		}
	}};
	
	&:hover {
		background: ${({ $variant }) => {
			switch ($variant) {
				case 'primary':
					return '#2563eb';
				case 'secondary':
					return '#e5e7eb';
				case 'success':
					return '#059669';
				case 'danger':
					return '#dc2626';
				default:
					return '#e5e7eb';
			}
		}};
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const EducationalNote = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 6px;
	padding: 1rem;
	margin: 0.75rem 0;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const FlowContext = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 6px;
	padding: 1rem;
	margin: 0.75rem 0;
	font-size: 0.875rem;
	color: #166534;
`;

const ParameterList = styled.ul`
	margin: 0.5rem 0;
	padding-left: 0;
	list-style: none;
`;

const ParameterItem = styled.li`
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	margin: 0.5rem 0;
	padding: 0.75rem;
	background: #f8fafc;
	border-radius: 6px;
	border-left: 4px solid #3b82f6;
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const ParameterValue = styled.code`
	background: #e2e8f0;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.8rem;
`;

interface EnhancedApiCallDisplayProps {
	apiCall: EnhancedApiCallData;
	options?: ApiCallDisplayOptions;
	onExecute?: () => Promise<void>;
	showExecuteButton?: boolean;
	className?: string;
}

export const EnhancedApiCallDisplay: React.FC<EnhancedApiCallDisplayProps> = ({
	apiCall,
	options = {},
	onExecute,
	showExecuteButton = false,
	className,
}) => {
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(['url']) // Only URL expanded by default, curl and details collapsed
	);
	const [isExecuting, setIsExecuting] = useState(false);
	const [showInfoTooltip, setShowInfoTooltip] = useState(false);
	const navigate = useNavigate();

	const { theme = 'light', showEducationalNotes = true, showFlowContext = true } = options;

	const toggleSection = useCallback((section: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(section)) {
				newSet.delete(section);
			} else {
				newSet.add(section);
			}
			return newSet;
		});
	}, []);

	const handleCopy = useCallback(async (text: string, description: string) => {
		try {
			await navigator.clipboard.writeText(text);
			v4ToastManager.showSuccess(`${description} copied to clipboard.`);
		} catch {
			v4ToastManager.showError('Failed to copy to clipboard.');
		}
	}, []);

	const handleExecute = useCallback(async () => {
		if (!onExecute) return;

		setIsExecuting(true);
		try {
			await onExecute();
		} catch {
			v4ToastManager.showError('Failed to execute API call.');
		} finally {
			setIsExecuting(false);
		}
	}, [onExecute]);

	const handleViewCodeExamples = useCallback(() => {
		// Navigate to code examples page with flow type and step context
		const flowType = apiCall.flowType || 'oauth';
		const stepName = apiCall.stepName || 'api-call';
		navigate(`/code-examples?flow=${flowType}&step=${stepName}`);
	}, [navigate, apiCall.flowType, apiCall.stepName]);

	const handleInfoClick = useCallback(() => {
		setShowInfoTooltip(!showInfoTooltip);
	}, [showInfoTooltip]);

	const getStatus = (): 'success' | 'error' | 'pending' | 'info' => {
		if (isExecuting) return 'pending';
		if (apiCall.response) {
			if (apiCall.response.status >= 200 && apiCall.response.status < 300) {
				return 'success';
			} else if (apiCall.response.status >= 400) {
				return 'error';
			}
		}
		return 'info';
	};

	const curlCommand = EnhancedApiCallDisplayService.generateEnhancedCurlCommand(apiCall, options);

	// Function to highlight URL based on service rules
	const highlightURL = useCallback(
		(url: string) => {
			if (!url) return null;

			// Get highlighting rules from service
			const rules =
				options.urlHighlightRules ||
				EnhancedApiCallDisplayService.getDefaultHighlightRules(apiCall.flowType);

			if (rules.length === 0) return null;

			// Use service to highlight URL
			const highlightedParts = EnhancedApiCallDisplayService.highlightURL(url, rules);

			// Check if any parts are highlighted
			const hasHighlights = highlightedParts.some((part) => part.isHighlighted);
			if (!hasHighlights) return null;

			return highlightedParts.map((part, index) => {
				const props: {
					key: number;
					$isHighlighted: boolean;
					$color?: string;
					$backgroundColor?: string;
					title?: string | undefined;
				} = {
					key: index,
					$isHighlighted: part.isHighlighted,
				};

				if (part.isHighlighted && part.label && part.description) {
					props.title = `${part.label}: ${part.description}`;
				}
				if (part.color) props.$color = part.color;
				if (part.backgroundColor) props.$backgroundColor = part.backgroundColor;

				return <URLPart {...props}>{part.content}</URLPart>;
			});
		},
		[apiCall.flowType, options.urlHighlightRules]
	);

	return (
		<Container $theme={theme} className={className}>
			<Header>
				<Title>
					{apiCall.method} {apiCall.url.split('?')[0]}
					{apiCall.stepName && ` - ${apiCall.stepName}`}
				</Title>
				<div style={{ position: 'relative' }}>
					<StatusBadge
						$status={getStatus()}
						$clickable={getStatus() === 'info'}
						onClick={getStatus() === 'info' ? handleInfoClick : undefined}
						title={getStatus() === 'info' ? 'Click for more information' : undefined}
					>
						{getStatus().toUpperCase()}
					</StatusBadge>
					{getStatus() === 'info' && (
						<InfoTooltip $show={showInfoTooltip}>
							<strong>API Call Ready</strong>
							<br />
							This API call is prepared but not yet executed. Click the "Open Authorization URL"
							button above to test the authorization flow, or use the cURL command below to test the
							API call directly.
						</InfoTooltip>
					)}
				</div>
			</Header>

			{apiCall.description && (
				<p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
					{apiCall.description}
				</p>
			)}

			{showFlowContext && apiCall.flowType && (
				<FlowContext>
					<strong>Flow Context:</strong> {apiCall.flowType.replace('-', ' ').toUpperCase()} Flow
				</FlowContext>
			)}

			{/* Request Details */}
			<CollapsibleSection>
				<SectionHeader $sectionType="details" onClick={() => toggleSection('details')}>
					<SectionTitle>Request Details</SectionTitle>
					<FiChevronDown
						style={{
							transform: expandedSections.has('details') ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s ease',
						}}
					/>
				</SectionHeader>
				<SectionContent $isExpanded={expandedSections.has('details')}>
					{apiCall.queryParams && Object.keys(apiCall.queryParams).length > 0 && (
						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								Query Parameters
							</h5>
							<ParameterList>
								{Object.entries(apiCall.queryParams).map(([key, value]) => (
									<ParameterItem key={key}>
										<span>
											<strong>{key}:</strong>
										</span>
										<ParameterValue>{value}</ParameterValue>
									</ParameterItem>
								))}
							</ParameterList>
						</div>
					)}

					{apiCall.headers && Object.keys(apiCall.headers).length > 0 && (
						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								Headers
							</h5>
							<ParameterList>
								{Object.entries(apiCall.headers).map(([key, value]) => (
									<ParameterItem key={key}>
										<span>
											<strong>{key}:</strong>
										</span>
										<ParameterValue>{value}</ParameterValue>
									</ParameterItem>
								))}
							</ParameterList>
						</div>
					)}

					{apiCall.body && (
						<div>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								Request Body
							</h5>
							<CodeBlock $theme={theme}>
								{typeof apiCall.body === 'string'
									? apiCall.body
									: JSON.stringify(apiCall.body, null, 2)}
							</CodeBlock>
						</div>
					)}
				</SectionContent>
			</CollapsibleSection>

			{/* URL Display with Highlighting */}
			{apiCall.url && highlightURL(apiCall.url) && (
				<CollapsibleSection>
					<SectionHeader onClick={() => toggleSection('url')}>
						<SectionTitle>Authorization URL (Highlighted)</SectionTitle>
						<FiChevronDown
							style={{
								transform: expandedSections.has('url') ? 'rotate(0deg)' : 'rotate(-90deg)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</SectionHeader>
					<SectionContent $isExpanded={expandedSections.has('url')}>
						<URLDisplay>{highlightURL(apiCall.url)}</URLDisplay>
						{apiCall.flowType && (
							<RARNote>
								<RARIcon>
									<FiInfo size={16} />
								</RARIcon>
								<div>
									<strong>{apiCall.flowType.toUpperCase()} Parameters:</strong>
									<br />
									The highlighted sections show important OAuth/OIDC parameters specific to this
									flow type. Hover over highlighted sections to see detailed descriptions of each
									parameter.
								</div>
							</RARNote>
						)}
					</SectionContent>
				</CollapsibleSection>
			)}

			{/* cURL Command */}
			<CollapsibleSection>
				<SectionHeader $sectionType="curl" onClick={() => toggleSection('curl')}>
					<SectionTitle>cURL Command</SectionTitle>
					<FiChevronDown
						style={{
							transform: expandedSections.has('curl') ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s ease',
						}}
					/>
				</SectionHeader>
				<SectionContent $isExpanded={expandedSections.has('curl')}>
					<CodeBlock $theme={theme}>{curlCommand}</CodeBlock>
					<ActionButtons>
						<ActionButton
							$variant="primary"
							onClick={() => handleCopy(curlCommand, 'cURL command')}
						>
							<FiCopy size={14} />
							Copy cURL Command
						</ActionButton>
						<ActionButton $variant="secondary" onClick={() => window.open(apiCall.url, '_blank')}>
							<FiExternalLink size={14} />
							Open URL
						</ActionButton>
						<ActionButton $variant="success" onClick={handleViewCodeExamples}>
							<FiCode size={14} />
							View Code Examples
						</ActionButton>
					</ActionButtons>
				</SectionContent>
			</CollapsibleSection>

			{/* Real PingOne Request */}
			<CollapsibleSection>
				<SectionHeader $sectionType="pingone" onClick={() => toggleSection('pingone')}>
					<SectionTitle>Real Request to PingOne</SectionTitle>
					<FiChevronDown
						style={{
							transform: expandedSections.has('pingone') ? 'rotate(0deg)' : 'rotate(-90deg)',
							transition: 'transform 0.2s ease',
						}}
					/>
				</SectionHeader>
				<SectionContent $isExpanded={expandedSections.has('pingone')}>
					<div style={{ marginBottom: '1rem' }}>
						<p style={{ margin: '0 0 0.75rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
							This shows the actual HTTP request that will be sent to PingOne's token endpoint:
						</p>
						
						{/* Real PingOne URL */}
						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								PingOne Token Endpoint
							</h5>
							<CodeBlock $theme={theme}>
								{apiCall.method} {apiCall.url}
							</CodeBlock>
						</div>

						{/* Real Headers */}
						{apiCall.headers && Object.keys(apiCall.headers).length > 0 && (
							<div style={{ marginBottom: '1rem' }}>
								<h5
									style={{
										margin: '0 0 0.5rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#374151',
									}}
								>
									HTTP Headers
								</h5>
								<ParameterList>
									{Object.entries(apiCall.headers).map(([key, value]) => (
										<ParameterItem key={key}>
											<span>
												<strong>{key}:</strong>
											</span>
											<ParameterValue>{value}</ParameterValue>
										</ParameterItem>
									))}
								</ParameterList>
							</div>
						)}

						{/* Real Request Body */}
						{apiCall.body && (
							<div style={{ marginBottom: '1rem' }}>
								<h5
									style={{
										margin: '0 0 0.5rem 0',
										fontSize: '0.875rem',
										fontWeight: 600,
										color: '#374151',
									}}
								>
									Request Body (JSON)
								</h5>
								<CodeBlock $theme={theme}>
									{typeof apiCall.body === 'string'
										? apiCall.body
										: JSON.stringify(apiCall.body, null, 2)}
								</CodeBlock>
							</div>
						)}

						{/* JavaScript Example */}
						<div style={{ marginBottom: '1rem' }}>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								JavaScript Fetch Example
							</h5>
							<CodeBlock $theme={theme}>
								{`// JavaScript fetch request to PingOne
const response = await fetch('${apiCall.url}', {
  method: '${apiCall.method}',
  headers: {
${apiCall.headers ? Object.entries(apiCall.headers).map(([key, value]) => `    '${key}': '${value}'`).join(',\n') : '    // No headers'},${apiCall.body ? `
  body: JSON.stringify(${typeof apiCall.body === 'string' ? apiCall.body : JSON.stringify(apiCall.body, null, 2)})` : ''}
});

const data = await response.json();
console.log('PingOne Response:', data);`}
							</CodeBlock>
							<ActionButtons style={{ marginTop: '0.75rem' }}>
								<ActionButton
									$variant="primary"
									onClick={() => handleCopy(
										`// JavaScript fetch request to PingOne
const response = await fetch('${apiCall.url}', {
  method: '${apiCall.method}',
  headers: {
${apiCall.headers ? Object.entries(apiCall.headers).map(([key, value]) => `    '${key}': '${value}'`).join(',\n') : '    // No headers'},${apiCall.body ? `
  body: JSON.stringify(${typeof apiCall.body === 'string' ? apiCall.body : JSON.stringify(apiCall.body, null, 2)})` : ''}
});

const data = await response.json();
console.log('PingOne Response:', data);`,
										'JavaScript Fetch Example'
									)}
								>
									<FiCopy size={14} />
									Copy JavaScript
								</ActionButton>
							</ActionButtons>
						</div>

						{/* Real cURL for PingOne */}
						<div>
							<h5
								style={{
									margin: '0 0 0.5rem 0',
									fontSize: '0.875rem',
									fontWeight: 600,
									color: '#374151',
								}}
							>
								Real cURL Command to PingOne
							</h5>
							<CodeBlock $theme={theme}>
								{EnhancedApiCallDisplayService.generateEnhancedCurlCommand(apiCall, {
									...options,
									verbose: true,
									includeHeaders: true,
									includeBody: true,
								})}
							</CodeBlock>
							<ActionButtons style={{ marginTop: '0.75rem' }}>
								<ActionButton
									$variant="primary"
									onClick={() => handleCopy(
										EnhancedApiCallDisplayService.generateEnhancedCurlCommand(apiCall, {
											...options,
											verbose: true,
											includeHeaders: true,
											includeBody: true,
										}),
										'Real PingOne cURL Command'
									)}
								>
									<FiCopy size={14} />
									Copy Real cURL
								</ActionButton>
							</ActionButtons>
						</div>
					</div>
				</SectionContent>
			</CollapsibleSection>

			{/* Response */}
			{apiCall.response && (
				<CollapsibleSection>
					<SectionHeader $sectionType="response" onClick={() => toggleSection('response')}>
						<SectionTitle>Response</SectionTitle>
						<FiChevronDown
							style={{
								transform: expandedSections.has('response') ? 'rotate(0deg)' : 'rotate(-90deg)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</SectionHeader>
					<SectionContent $isExpanded={expandedSections.has('response')}>
						<CodeBlock $theme={theme}>
							{apiCall.response.error
								? `Error: ${apiCall.response.error}`
								: `HTTP ${apiCall.response.status} ${apiCall.response.statusText}\n\n${
										apiCall.response.data
											? JSON.stringify(apiCall.response.data, null, 2)
											: 'No response body'
									}`}
						</CodeBlock>
					</SectionContent>
				</CollapsibleSection>
			)}

			{/* Educational Notes */}
			{showEducationalNotes && apiCall.educationalNotes && apiCall.educationalNotes.length > 0 && (
				<CollapsibleSection>
					<SectionHeader onClick={() => toggleSection('notes')}>
						<SectionTitle>Educational Notes</SectionTitle>
						<FiChevronDown
							style={{
								transform: expandedSections.has('notes') ? 'rotate(0deg)' : 'rotate(-90deg)',
								transition: 'transform 0.2s ease',
							}}
						/>
					</SectionHeader>
					<SectionContent $isExpanded={expandedSections.has('notes')}>
						{apiCall.educationalNotes.map((note, index) => (
							<EducationalNote key={index}>
								<FiExternalLink size={16} style={{ color: '#3b82f6', marginTop: '2px' }} />
								<span>{note}</span>
							</EducationalNote>
						))}
					</SectionContent>
				</CollapsibleSection>
			)}

			{/* Execute Button */}
			{showExecuteButton && onExecute && (
				<ActionButtons>
					<ActionButton $variant="success" onClick={handleExecute} disabled={isExecuting}>
						{isExecuting ? 'Executing...' : 'Execute API Call'}
					</ActionButton>
				</ActionButtons>
			)}

			{/* Performance Info */}
			{apiCall.duration && (
				<div
					style={{
						marginTop: '1rem',
						padding: '0.75rem',
						background: '#f8fafc',
						borderRadius: '6px',
						fontSize: '0.875rem',
						color: '#6b7280',
					}}
				>
					<strong>Duration:</strong>{' '}
					{apiCall.duration < 1000
						? `${apiCall.duration}ms`
						: `${(apiCall.duration / 1000).toFixed(2)}s`}
				</div>
			)}
		</Container>
	);
};

export default EnhancedApiCallDisplay;
