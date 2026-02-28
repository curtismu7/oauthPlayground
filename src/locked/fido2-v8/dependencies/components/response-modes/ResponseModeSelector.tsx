// src/components/response-modes/ResponseModeSelector.tsx
// Compact checkbox UI with live URL preview for OAuth/OIDC response modes

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertTriangle, FiChevronDown, FiInfo } from '@icons';
import styled from 'styled-components';
import { CopyButtonService } from '../../services/copyButtonService';

// Types
type ResponseMode = 'query' | 'fragment' | 'form_post' | 'pi.flow';
type FlowKey = 'authorization_code' | 'implicit' | 'hybrid' | 'device' | 'client_credentials';
type ResponseType =
	| 'code'
	| 'token'
	| 'id_token'
	| 'token id_token'
	| 'code id_token'
	| 'code token'
	| 'code token id_token';

interface ResponseModeInfo {
	mode: ResponseMode;
	label: string;
	description: string;
	bestFor: string;
	icon: string;
}

interface CompatibilityWarning {
	level: 'info' | 'warn' | 'error';
	reason: string;
}

interface ResponseModeSelectorProps {
	flowKey: FlowKey;
	responseType: ResponseType;
	redirectUri: string;
	clientId: string;
	scope?: string;
	state?: string;
	nonce?: string;
	extraParams?: Record<string, string>;
	defaultMode?: ResponseMode;
	readOnlyFlowContext?: boolean;
	onModeChange?: (mode: ResponseMode) => void;
	className?: string;
}

// Response mode definitions
const RESPONSE_MODES: Record<ResponseMode, ResponseModeInfo> = {
	query: {
		mode: 'query',
		label: 'Query String',
		description:
			'Authorization response parameters are encoded in the query string added to the redirect_uri when redirecting back to the application.',
		bestFor: 'Traditional web applications with server-side handling',
		icon: '🔗',
	},
	fragment: {
		mode: 'fragment',
		label: 'URL Fragment',
		description:
			'Authorization response parameters are encoded in the fragment added to the redirect_uri when redirecting back to the application.',
		bestFor: 'Single Page Applications (SPAs) and client-side applications',
		icon: '🧩',
	},
	form_post: {
		mode: 'form_post',
		label: 'Form POST',
		description:
			'Authorization response parameters are encoded as HTML form values that are auto-submitted in the browser, transmitted through HTTP POST to the application.',
		bestFor: 'Applications requiring secure parameter transmission without URL exposure',
		icon: '📝',
	},
	'pi.flow': {
		mode: 'pi.flow',
		label: 'PingOne Flow Object',
		description:
			'PingOne proprietary redirectless flow that returns a flow object instead of redirecting. Enables embedded authentication without browser redirects.',
		bestFor: 'Embedded authentication, mobile apps, headless applications, IoT devices',
		icon: '⚡',
	},
};

// Compatibility matrix
const COMPATIBILITY_MATRIX: Record<
	ResponseType,
	Record<ResponseMode, CompatibilityWarning | null>
> = {
	code: {
		query: null, // Standard
		fragment: { level: 'warn', reason: 'Fragment mode is unusual for authorization code flows' },
		form_post: null, // Allowed
		'pi.flow': null, // PingOne proprietary
	},
	token: {
		query: { level: 'error', reason: 'Query mode is not standard for token responses' },
		fragment: null, // Recommended
		form_post: { level: 'warn', reason: 'Form POST is not standard for token responses' },
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for tokens' },
	},
	id_token: {
		query: { level: 'error', reason: 'Query mode is not standard for ID token responses' },
		fragment: null, // Recommended
		form_post: { level: 'warn', reason: 'Form POST is not standard for ID token responses' },
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for ID tokens' },
	},
	'token id_token': {
		query: { level: 'error', reason: 'Query mode is not standard for token responses' },
		fragment: null, // Recommended
		form_post: { level: 'warn', reason: 'Form POST is not standard for token responses' },
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for tokens' },
	},
	'code id_token': {
		query: { level: 'warn', reason: 'Query mode may expose tokens in server logs' },
		fragment: null, // Recommended
		form_post: null, // Allowed
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for tokens' },
	},
	'code token': {
		query: { level: 'warn', reason: 'Query mode may expose tokens in server logs' },
		fragment: null, // Recommended
		form_post: null, // Allowed
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for tokens' },
	},
	'code token id_token': {
		query: { level: 'warn', reason: 'Query mode may expose tokens in server logs' },
		fragment: null, // Recommended
		form_post: null, // Allowed
		'pi.flow': { level: 'warn', reason: 'Server-side exchange required for tokens' },
	},
};

// Styled Components
const Container = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CollapseIcon = styled.div<{ $collapsed: boolean }>`
  transition: transform 0.2s ease;
  transform: ${(props) => (props.$collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  color: #6b7280;
`;

const Content = styled.div<{ $collapsed: boolean }>`
  padding: ${(props) => (props.$collapsed ? '0' : '1rem')};
  max-height: ${(props) => (props.$collapsed ? '0' : 'none')};
  overflow: hidden;
  transition: all 0.3s ease;
`;

const Description = styled.p`
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
`;

const CheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const CheckboxItem = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$selected ? '#3b82f6' : '#d1d5db')};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.$selected ? '#eff6ff' : 'white')};
  
  &:hover {
    border-color: #3b82f6;
    background: ${(props) => (props.$selected ? '#eff6ff' : '#f9fafb')};
  }
`;

const CheckboxInput = styled.input`
  margin: 0;
  margin-top: 0.125rem;
`;

const CheckboxContent = styled.div`
  flex: 1;
`;

const CheckboxHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const CheckboxTitle = styled.span<{ $selected: boolean }>`
  font-weight: ${(props) => (props.$selected ? '600' : '500')};
  color: #111827;
`;

const RecommendedBadge = styled.span`
  background: #10b981;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

const CheckboxDescription = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 0.25rem;
`;

const BestFor = styled.div`
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
`;

const PreviewSection = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const PreviewTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PreviewBlock = styled.div`
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
`;

const PreviewLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const PreviewText = styled.code`
  display: block;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: #1e293b;
  background: #f8fafc;
  padding: 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.2;
`;

const PreviewContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  
  ${PreviewText} {
    flex: 1;
    margin-bottom: 0;
  }
`;

const WarningChip = styled.div<{ $level: 'info' | 'warn' | 'error' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.625rem;
  font-weight: 500;
  margin-top: 0.5rem;
  
  ${(props) => {
		switch (props.$level) {
			case 'info':
				return 'background: #dbeafe; color: #1e40af;';
			case 'warn':
				return 'background: #fef3c7; color: #92400e;';
			case 'error':
				return 'background: #fee2e2; color: #991b1b;';
			default:
				return '';
		}
	}}
`;

const SummaryText = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
`;

// Main Component
const ResponseModeSelector: React.FC<ResponseModeSelectorProps> = ({
	flowKey,
	responseType,
	redirectUri,
	clientId,
	scope = 'openid profile email',
	state = 'random_state_123',
	nonce = 'random_nonce_456',
	extraParams = {},
	defaultMode = 'fragment',
	readOnlyFlowContext = false,
	onModeChange,
	className,
}) => {
	const [collapsed, setCollapsed] = useState(false);
	const [selectedMode, setSelectedMode] = useState<ResponseMode>(defaultMode);

	// Load saved preference from localStorage
	useEffect(() => {
		const saved = localStorage.getItem(`response_mode:${flowKey}`);
		if (saved && Object.keys(RESPONSE_MODES).includes(saved)) {
			setSelectedMode(saved as ResponseMode);
		}
	}, [flowKey]);

	// Save preference to localStorage
	const savePreference = useCallback(
		(mode: ResponseMode) => {
			localStorage.setItem(`response_mode:${flowKey}`, mode);
			console.log(`[🪪 RESPONSE-MODE] changed to ${mode} for ${flowKey}`);
		},
		[flowKey]
	);

	// Handle mode selection
	const handleModeChange = useCallback(
		(mode: ResponseMode) => {
			console.log(`[🪪 RESPONSE-MODE] Mode changing from ${selectedMode} to ${mode}`);
			setSelectedMode(mode);
			savePreference(mode);
			onModeChange?.(mode);
		},
		[savePreference, onModeChange, selectedMode]
	);

	// Build authorization URL
	const buildAuthUrl = useCallback(
		(mode: ResponseMode) => {
			console.log(`[🪪 RESPONSE-MODE] Building URL for mode: ${mode}`);
			const params = new URLSearchParams({
				client_id: clientId,
				redirect_uri: redirectUri,
				response_type: responseType,
				scope,
				state,
				...extraParams,
			});

			// Always add response_mode parameter for clarity
			params.set('response_mode', mode);
			console.log(`[🪪 RESPONSE-MODE] Added response_mode=${mode} to URL`);

			// Add nonce for OIDC flows with id_token
			if (responseType.includes('id_token') && nonce) {
				params.set('nonce', nonce);
			}

			const url = `https://auth.pingone.com/{envID}/as/authorize?${params.toString()}`;
			console.log(`[🪪 RESPONSE-MODE] Generated URL:`, url);
			return url;
		},
		[clientId, redirectUri, responseType, scope, state, nonce, extraParams]
	);

	// Highlight only response_mode parameter
	const highlightUrl = useCallback((url: string) => {
		let highlighted = url;

		// Only highlight response_mode parameter since that's what we're demonstrating
		const responseModeRegex = /(response_mode=[^&\s]*)/g;
		highlighted = highlighted.replace(
			responseModeRegex,
			`<span style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-weight: 600; margin: 0 0.25rem; font-size: 0.8rem; border: 2px solid #ea580c; box-shadow: 0 2px 4px rgba(249, 115, 22, 0.3); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); display: inline-block; transform: scale(1.05);">$1</span>`
		);

		return highlighted;
	}, []);

	// Highlight response mode specific URLs
	const highlightResponseMode = useCallback(
		(url: string, mode: ResponseMode) => {
			let highlighted = highlightUrl(url);

			// For fragment mode, remove response_mode if present
			if (mode === 'fragment') {
				highlighted = highlighted.replace(/response_mode=[^&]*&?/g, '');
			}

			return highlighted;
		},
		[highlightUrl]
	);

	// Build response examples
	const buildResponseExample = useCallback(
		(mode: ResponseMode) => {
			const baseUrl = redirectUri;

			switch (mode) {
				case 'query':
					return `${baseUrl}?code=authorization_code_123&state=${state}`;

				case 'fragment':
					if (responseType.includes('token')) {
						return `${baseUrl}#access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&token_type=Bearer&expires_in=3600&state=${state}&scope=${scope}`;
					} else if (responseType.includes('id_token')) {
						return `${baseUrl}#id_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...&state=${state}`;
					}
					return `${baseUrl}#code=authorization_code_123&state=${state}`;

				case 'form_post':
					return `HTML Form POST to ${baseUrl}:\nContent-Type: application/x-www-form-urlencoded\n\ncode=authorization_code_123&state=${state}`;

				case 'pi.flow':
					return JSON.stringify(
						{
							flow: 'pi.flow',
							txId: 'tx_123456789',
							next: 'https://auth.pingone.com/{envID}/as/continue',
							expires_in: 300,
						},
						null,
						2
					);

				default:
					return 'No example available';
			}
		},
		[redirectUri, state, responseType, scope]
	);

	// Get compatibility warning
	const getCompatibilityWarning = useCallback(
		(mode: ResponseMode): CompatibilityWarning | null => {
			return COMPATIBILITY_MATRIX[responseType]?.[mode] || null;
		},
		[responseType]
	);

	// Render preview content
	const renderPreview = useMemo(() => {
		if (collapsed) return null;

		const authUrl = buildAuthUrl(selectedMode);
		const highlightedUrl = highlightResponseMode(authUrl, selectedMode);
		const responseExample = buildResponseExample(selectedMode);
		const highlightedResponseExample = highlightUrl(responseExample);
		const warning = getCompatibilityWarning(selectedMode);

		return (
			<PreviewSection>
				<PreviewTitle>Live Preview</PreviewTitle>
				<PreviewContent>
					<PreviewBlock>
						<PreviewLabel>Authorization Request URL</PreviewLabel>
						<PreviewContentRow>
							<PreviewText dangerouslySetInnerHTML={{ __html: highlightedUrl }} />
							<CopyButtonService
								text={authUrl}
								label="Copy URL"
								size="sm"
								variant="outline"
								showLabel={true}
							/>
						</PreviewContentRow>
					</PreviewBlock>

					<PreviewBlock>
						<PreviewLabel>Response Format</PreviewLabel>
						<PreviewContentRow>
							<PreviewText dangerouslySetInnerHTML={{ __html: highlightedResponseExample }} />
							<CopyButtonService
								text={responseExample}
								label="Copy Response"
								size="sm"
								variant="outline"
								showLabel={true}
							/>
						</PreviewContentRow>
					</PreviewBlock>

					{warning && (
						<WarningChip $level={warning.level}>
							{warning.level === 'error' ? <FiAlertTriangle size={12} /> : <FiInfo size={12} />}
							{warning.reason}
						</WarningChip>
					)}
				</PreviewContent>
			</PreviewSection>
		);
	}, [
		collapsed,
		selectedMode,
		buildAuthUrl,
		highlightResponseMode,
		buildResponseExample,
		highlightUrl,
		getCompatibilityWarning,
	]);

	// Get summary text for collapsed state
	const getSummaryText = useCallback(() => {
		const modeInfo = RESPONSE_MODES[selectedMode];
		return `Selected: ${modeInfo.label}`;
	}, [selectedMode]);

	return (
		<Container className={className}>
			<Header onClick={() => setCollapsed(!collapsed)}>
				<HeaderTitle>
					<span>Response Mode</span>
					{selectedMode === 'fragment' && <RecommendedBadge>Recommended</RecommendedBadge>}
				</HeaderTitle>
				<CollapseIcon $collapsed={collapsed}>
					<FiChevronDown size={16} />
				</CollapseIcon>
			</Header>

			<Content $collapsed={collapsed}>
				{!collapsed && (
					<>
						<Description>
							Choose how the authorization response should be returned to your application.
						</Description>

						<CheckboxList>
							{Object.values(RESPONSE_MODES).map((modeInfo) => (
								<CheckboxItem key={modeInfo.mode} $selected={selectedMode === modeInfo.mode}>
									<CheckboxInput
										type="radio"
										name="response-mode"
										checked={selectedMode === modeInfo.mode}
										onChange={() => handleModeChange(modeInfo.mode)}
										disabled={readOnlyFlowContext}
									/>
									<CheckboxContent>
										<CheckboxHeader>
											<span>{modeInfo.icon}</span>
											<CheckboxTitle $selected={selectedMode === modeInfo.mode}>
												{modeInfo.label}
											</CheckboxTitle>
											{modeInfo.mode === 'fragment' && (
												<RecommendedBadge>Recommended</RecommendedBadge>
											)}
										</CheckboxHeader>
										<CheckboxDescription>{modeInfo.description}</CheckboxDescription>
										<BestFor>Best for: {modeInfo.bestFor}</BestFor>
									</CheckboxContent>
								</CheckboxItem>
							))}
						</CheckboxList>

						{renderPreview}
					</>
				)}

				{collapsed && <SummaryText>{getSummaryText()}</SummaryText>}
			</Content>
		</Container>
	);
};

export default ResponseModeSelector;
export type { ResponseModeSelectorProps, ResponseMode, FlowKey, ResponseType };
