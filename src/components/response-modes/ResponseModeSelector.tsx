// src/components/response-modes/ResponseModeSelector.tsx
// Compact checkbox UI with live URL preview for OAuth/OIDC response modes

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiCopy, FiCheckCircle, FiAlertTriangle, FiInfo, FiChevronDown } from 'react-icons/fi';
import styled from 'styled-components';

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
  font-size: 0.75rem;
  color: #1e293b;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e2e8f0;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
`;

const HighlightedParam = styled.span`
  background: #f59e0b;
  color: #1e293b;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
`;

const CopyButton = styled.button`
  background: #374151;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.5rem;
  
  &:hover {
    background: #1f2937;
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
	const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

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

	// Copy to clipboard
	const handleCopy = useCallback(async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedItems((prev) => new Set([...prev, label]));
			setTimeout(() => {
				setCopiedItems((prev) => {
					const next = new Set(prev);
					next.delete(label);
					return next;
				});
			}, 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	}, []);

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

			// Add response_mode if not default
			if (mode !== 'fragment') {
				params.set('response_mode', mode);
				console.log(`[🪪 RESPONSE-MODE] Added response_mode=${mode} to URL`);
			} else {
				console.log(`[🪪 RESPONSE-MODE] Fragment mode - no response_mode parameter added`);
			}

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

	// Highlight response_mode parameter in URL
	const highlightResponseMode = useCallback((url: string, mode: ResponseMode) => {
		if (mode === 'fragment') {
			// For fragment mode, highlight the absence of response_mode
			return url.replace(/(\?[^#]*)/, (match) => {
				if (match.includes('response_mode')) {
					return match.replace(/response_mode=[^&]*&?/g, '');
				}
				return match;
			});
		} else {
			// For other modes, highlight the response_mode parameter
			return url.replace(
				/(response_mode=[^&]*)/g,
				'<span style="background: #f59e0b; color: #1e293b; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-weight: 600;">$1</span>'
			);
		}
	}, []);

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
		const warning = getCompatibilityWarning(selectedMode);

		return (
			<PreviewSection>
				<PreviewTitle>Live Preview</PreviewTitle>
				<PreviewContent>
					<PreviewBlock>
						<PreviewLabel>Authorization Request URL</PreviewLabel>
						<PreviewText dangerouslySetInnerHTML={{ __html: highlightedUrl }} />
						<CopyButton onClick={() => handleCopy(authUrl, 'auth-url')}>
							{copiedItems.has('auth-url') ? <FiCheckCircle size={12} /> : <FiCopy size={12} />}
							{copiedItems.has('auth-url') ? 'Copied!' : 'Copy URL'}
						</CopyButton>
					</PreviewBlock>

					<PreviewBlock>
						<PreviewLabel>Response Format</PreviewLabel>
						<PreviewText>{responseExample}</PreviewText>
						<CopyButton onClick={() => handleCopy(responseExample, 'response')}>
							{copiedItems.has('response') ? <FiCheckCircle size={12} /> : <FiCopy size={12} />}
							{copiedItems.has('response') ? 'Copied!' : 'Copy Response'}
						</CopyButton>
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
		getCompatibilityWarning,
		copiedItems,
		handleCopy,
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
