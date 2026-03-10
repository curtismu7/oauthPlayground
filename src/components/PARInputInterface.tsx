// src/components/PARInputInterface.tsx

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { logger } from '../utils/logger';

interface PARInputInterfaceProps {
	onPARDataSubmit: (parData: PARInputData) => void;
	onCancel?: () => void;
	onClose?: () => void;
	isOpen: boolean;
	initialData?: Partial<PARInputData>;
}

interface PARInputData {
	requestUri: string;
	expiresIn?: number;
	clientId: string;
	environmentId: string;
	redirectUri?: string;
}

interface PARRequestBuilder {
	responseType: string;
	scope: string;
	redirectUri: string;
	state: string;
	nonce?: string;
	codeChallenge?: string;
	codeChallengeMethod?: string;
}

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	padding: 1rem;
`;

const Modal = styled.div`
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
`;

const Header = styled.div`
	padding: 1.5rem 1.5rem 0;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Title = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Subtitle = styled.p`
	font-size: 0.875rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin: 0 0 1.5rem 0;
	line-height: 1.5;
`;

const Content = styled.div`
	padding: 1.5rem;
`;

const InfoBox = styled.div`
	background: linear-gradient(135deg, V9_COLORS.BG.GRAY_LIGHT 0%, V9_COLORS.BG.GRAY_LIGHT 100%);
	border: 1px solid #0ea5e9;
	border-radius: 8px;
	padding: 1rem;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const InfoIcon = styled.div`
	color: #0ea5e9;
	margin-top: 0.125rem;
`;

const InfoContent = styled.div`
	flex: 1;
`;

const InfoTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
`;

const InfoText = styled.p`
	font-size: 0.8rem;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0;
	line-height: 1.5;
`;

const Form = styled.form`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
`;

const Label = styled.label`
	font-size: 0.875rem;
	font-weight: 500;
	color: V9_COLORS.TEXT.GRAY_DARK;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const Input = styled.input`
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const _TextArea = styled.textarea`
	padding: 0.75rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 6px;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	background: #f9fafb;
	min-height: 100px;
	resize: vertical;

	&:focus {
		outline: none;
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
`;

const Helper = styled.div`
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	line-height: 1.4;
`;

const Actions = styled.div`
	display: flex;
	gap: 0.75rem;
	justify-content: flex-end;
	padding: 1.5rem;
	border-top: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' | 'warning' }>`
	padding: 0.75rem 1.5rem;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	display: flex;
	align-items: center;
	gap: 0.5rem;

	${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
					background: V9_COLORS.PRIMARY.BLUE;
					color: white;
					border: 1px solid V9_COLORS.PRIMARY.BLUE;
					
					&:hover {
						background: V9_COLORS.PRIMARY.BLUE_DARK;
						border-color: V9_COLORS.PRIMARY.BLUE_DARK;
					}
				`;
			case 'success':
				return `
					background: V9_COLORS.PRIMARY.GREEN_DARK;
					color: white;
					border: 1px solid V9_COLORS.PRIMARY.GREEN_DARK;
					
					&:hover {
						background: #15803d;
						border-color: #15803d;
					}
				`;
			case 'warning':
				return `
					background: V9_COLORS.PRIMARY.YELLOW;
					color: white;
					border: 1px solid V9_COLORS.PRIMARY.YELLOW;
					
					&:hover {
						background: V9_COLORS.PRIMARY.YELLOW_DARK;
						border-color: V9_COLORS.PRIMARY.YELLOW_DARK;
					}
				`;
			default:
				return `
					background: white;
					color: V9_COLORS.TEXT.GRAY_DARK;
					border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
					
					&:hover {
						background: #f9fafb;
						border-color: V9_COLORS.TEXT.GRAY_LIGHT;
					}
				`;
		}
	}}
`;

const TabContainer = styled.div`
	display: flex;
	border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
	padding: 0.75rem 1rem;
	border: none;
	background: none;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	border-bottom: 2px solid transparent;
	color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
	border-bottom-color: ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};

	&:hover {
		color: V9_COLORS.PRIMARY.BLUE;
	}
`;

const CodeBlock = styled.pre`
	background: V9_COLORS.TEXT.GRAY_DARK;
	color: #f9fafb;
	padding: 1rem;
	border-radius: 6px;
	font-size: 0.75rem;
	overflow-x: auto;
	margin: 0.5rem 0;
	position: relative;
`;

const CopyButton = styled.button`
	position: absolute;
	top: 0.5rem;
	right: 0.5rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.25rem;

	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
`;

const StepContainer = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	margin-bottom: 1.5rem;
	padding: 1rem;
	background: V9_COLORS.BG.GRAY_LIGHT;
	border-radius: 8px;
	border-left: 4px solid V9_COLORS.PRIMARY.BLUE;
`;

const StepNumber = styled.div`
	background: V9_COLORS.PRIMARY.BLUE;
	color: white;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.75rem;
	font-weight: 600;
	flex-shrink: 0;
`;

const StepContent = styled.div`
	flex: 1;
`;

const StepTitle = styled.h4`
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin: 0 0 0.5rem 0;
`;

const StepDescription = styled.p`
	font-size: 0.8rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	margin: 0;
	line-height: 1.4;
`;

const ExampleBox = styled.div<{ $variant?: 'success' | 'warning' | 'info' }>`
	padding: 1rem;
	border-radius: 8px;
	margin: 1rem 0;
	border-left: 4px solid;

	${({ $variant }) => {
		switch ($variant) {
			case 'success':
				return `
					background: #f0fdf4;
					border-left-color: V9_COLORS.PRIMARY.GREEN_DARK;
				`;
			case 'warning':
				return `
					background: V9_COLORS.BG.WARNING;
					border-left-color: V9_COLORS.PRIMARY.YELLOW;
				`;
			default:
				return `
					background: V9_COLORS.BG.GRAY_LIGHT;
					border-left-color: V9_COLORS.PRIMARY.BLUE;
				`;
		}
	}}
`;

const QuickFillGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	margin: 1rem 0;
`;

const QuickFillCard = styled.button`
	padding: 1rem;
	border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	text-align: left;
	transition: all 0.2s;

	&:hover {
		border-color: V9_COLORS.PRIMARY.BLUE;
		box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
	}
`;

const QuickFillTitle = styled.div`
	font-size: 0.875rem;
	font-weight: 600;
	color: V9_COLORS.TEXT.GRAY_DARK;
	margin-bottom: 0.25rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const QuickFillDesc = styled.div`
	font-size: 0.75rem;
	color: V9_COLORS.TEXT.GRAY_MEDIUM;
	line-height: 1.3;
`;

const PARInputInterface: React.FC<PARInputInterfaceProps> = ({
	onPARDataSubmit,
	onCancel,
	onClose,
	isOpen,
	initialData,
}) => {
	const handleCancel = () => {
		if (onCancel) onCancel();
		if (onClose) onClose();
	};
	const [activeTab, setActiveTab] = useState<'input' | 'builder' | 'learn'>('input');
	const [formData, setFormData] = useState<PARInputData>({
		requestUri:
			initialData?.requestUri ||
			'urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
		expiresIn: initialData?.expiresIn || 60, // PingOne default lifetime
		clientId: initialData?.clientId || 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
		environmentId: initialData?.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
		redirectUri: initialData?.redirectUri || 'https://localhost:3000/callback',
	});

	const [parBuilder, setParBuilder] = useState<PARRequestBuilder>({
		responseType: 'code',
		scope: 'openid profile email',
		redirectUri: 'https://localhost:3000/callback',
		state: 'abc123xyz789',
		nonce: 'n-0S6_WzA2Mj',
		codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
		codeChallengeMethod: 'S256',
	});

	const [copiedText, setCopiedText] = useState<string>('');

	// Update form data when initialData changes
	useEffect(() => {
		if (initialData) {
			setFormData((prev) => ({
				...prev,
				...initialData,
			}));
		}
	}, [initialData]);

	// Update parBuilder redirectUri when formData redirectUri changes
	useEffect(() => {
		if (formData.redirectUri) {
			setParBuilder((prev) => ({
				...prev,
				redirectUri: formData.redirectUri || 'https://localhost:3000/callback',
			}));
		}
	}, [formData.redirectUri]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (formData.requestUri && formData.clientId && formData.environmentId) {
			onPARDataSubmit(formData);
		}
	};

	const handleInputChange = (field: keyof PARInputData, value: string | number) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleBuilderChange = (field: keyof PARRequestBuilder, value: string) => {
		setParBuilder((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedText(label);
			setTimeout(() => setCopiedText(''), 2000);
		} catch (err) {
			logger.error('PARInputInterface', 'Failed to copy text: ', undefined, err as Error);
		}
	};

	const generatePARRequest = () => {
		const parEndpoint = `https://auth.pingone.com/${formData.environmentId}/as/par`;
		const requestBody = new URLSearchParams({
			response_type: parBuilder.responseType,
			client_id: formData.clientId,
			scope: parBuilder.scope,
			redirect_uri: parBuilder.redirectUri,
			state: parBuilder.state,
			...(parBuilder.nonce && { nonce: parBuilder.nonce }),
			...(parBuilder.codeChallenge && {
				code_challenge: parBuilder.codeChallenge,
				code_challenge_method: parBuilder.codeChallengeMethod || 'S256',
			}),
		});

		return {
			endpoint: parEndpoint,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: 'Basic <base64(client_id:client_secret)>',
			},
			body: requestBody.toString(),
		};
	};

	const quickFillExamples = [
		{
			title: 'Current Configuration',
			icon: <span>✅</span>,
			description: 'Use your current client ID, environment ID, and redirect URI',
			data: {
				requestUri:
					'urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
				clientId: formData.clientId,
				environmentId: formData.environmentId,
				redirectUri: formData.redirectUri,
				expiresIn: 60,
			},
		},
		{
			title: 'PingOne Production',
			icon: <span>🌐</span>,
			description: 'Real PingOne production environment example',
			data: {
				requestUri:
					'urn:ietf:params:oauth:request_uri:pingone-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
				clientId: formData.clientId || 'a4f963ea-0736-456a-be72-b1fa4f63f81f',
				environmentId: formData.environmentId || 'b9817c16-9910-4415-b67e-4ac687da74d9',
				redirectUri: formData.redirectUri || 'https://localhost:3000/callback',
				expiresIn: 60,
			},
		},
		{
			title: 'High Security',
			icon: <span>🔒</span>,
			description: 'Short-lived request URI for high security',
			data: {
				requestUri: 'urn:ietf:params:oauth:request_uri:pingone-secure-xyz789abc123def456ghi',
				clientId: formData.clientId || 'secure-client-uuid-here',
				environmentId: formData.environmentId || 'secure-env-uuid-here',
				redirectUri: formData.redirectUri || 'https://localhost:3000/callback',
				expiresIn: 30,
			},
		},
		{
			title: 'Extended Session',
			icon: <span>⚙️</span>,
			description: 'Longer-lived request URI for complex flows',
			data: {
				requestUri: 'urn:ietf:params:oauth:request_uri:pingone-extended-session-long-identifier',
				clientId: formData.clientId || 'extended-client-uuid',
				environmentId: formData.environmentId || 'extended-env-uuid',
				redirectUri: formData.redirectUri || 'https://localhost:3000/callback',
				expiresIn: 300,
			},
		},
	];

	if (!isOpen) return null;

	return (
		<Overlay>
			<Modal>
				<Header>
					<Title>
						<span>🛡️</span>
						PAR (Pushed Authorization Request) Assistant
					</Title>
					<Subtitle>
						Use an existing PAR request URI, build a new PAR request, or learn about PAR security
						benefits. This tool helps you understand and implement RFC 9126 Pushed Authorization
						Requests with PingOne.
					</Subtitle>
				</Header>

				<Content>
					{/* Enhanced Info Box */}
					<InfoBox>
						<InfoIcon>
							<span style={{ fontSize: '20px' }}>🛡️</span>
						</InfoIcon>
						<InfoContent>
							<InfoTitle>🔐 PAR (Pushed Authorization Request) - RFC 9126</InfoTitle>
							<InfoText>
								PAR enhances OAuth 2.0 security by allowing clients to push authorization request
								parameters to the authorization server via a secure back-channel POST request. This
								prevents parameter tampering, reduces URL length limitations, and keeps sensitive
								data away from user agents.
							</InfoText>
						</InfoContent>
					</InfoBox>

					{/* Tab Navigation */}
					<TabContainer>
						<Tab $active={activeTab === 'input'} onClick={() => setActiveTab('input')}>
							<span style={{ fontSize: '14px' }}>🔑</span>
							Use Existing PAR
						</Tab>
						<Tab $active={activeTab === 'builder'} onClick={() => setActiveTab('builder')}>
							<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
							Build PAR Request
						</Tab>
						<Tab $active={activeTab === 'learn'} onClick={() => setActiveTab('learn')}>
							<span style={{ fontSize: '14px' }}>📖</span>
							Learn PAR
						</Tab>
					</TabContainer>

					{/* Tab Content */}
					{activeTab === 'input' && (
						<div>
							<ExampleBox $variant="warning">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<span style={{ fontSize: '16px' }}>⚠️</span>
									<strong>Quick Fill Examples</strong>
								</div>
								<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
									Choose a pre-configured example to understand the PAR format, then replace with
									your actual values.
								</p>

								<QuickFillGrid>
									{quickFillExamples.map((example, index) => (
										<QuickFillCard key={index} onClick={() => setFormData(example.data)}>
											<QuickFillTitle>
												{example.icon}
												{example.title}
											</QuickFillTitle>
											<QuickFillDesc>{example.description}</QuickFillDesc>
										</QuickFillCard>
									))}
								</QuickFillGrid>
							</ExampleBox>

							<Form onSubmit={handleSubmit}>
								<Field>
									<Label>
										<span style={{ fontSize: '14px' }}>🔑</span>
										PAR Request URI *
									</Label>
									<Input
										type="text"
										value={formData.requestUri}
										onChange={(e) => handleInputChange('requestUri', e.target.value)}
										placeholder="urn:ietf:params:oauth:request_uri:pingone-abc123def456..."
										required
									/>
									<Helper>
										<strong>Real PingOne Format:</strong>{' '}
										<code>urn:ietf:params:oauth:request_uri:pingone-[32-char-identifier]</code>
										<br />
										This is the request_uri returned from PingOne's PAR endpoint (/as/par). It's a
										unique, opaque identifier that references your authorization request parameters
										stored server-side. Default lifetime: 60 seconds, single-use only.
									</Helper>
								</Field>

								<Field>
									<Label>
										<i className="bi bi-question-circle" style={{ fontSize: '14px' }}></i>
										Client ID *
									</Label>
									<Input
										type="text"
										value={formData.clientId}
										onChange={(e) => handleInputChange('clientId', e.target.value)}
										placeholder="a4f963ea-0736-456a-be72-b1fa4f63f81f"
										required
									/>
									<Helper>
										<strong>PingOne Client ID:</strong> UUID format (36 characters with hyphens)
										<br />
										Found in PingOne Admin Console → Applications → [Your App] → Configuration →
										Client ID
									</Helper>
								</Field>

								<Field>
									<Label>
										<span style={{ fontSize: '14px' }}>🌐</span>
										Environment ID *
									</Label>
									<Input
										type="text"
										value={formData.environmentId}
										onChange={(e) => handleInputChange('environmentId', e.target.value)}
										placeholder="b9817c16-9910-4415-b67e-4ac687da74d9"
										required
									/>
									<Helper>
										<strong>PingOne Environment ID:</strong> UUID format (36 characters with
										hyphens)
										<br />
										Found in PingOne Admin Console → Environment → Settings → Environment ID
									</Helper>
								</Field>

								<Field>
									<Label>
										<span style={{ fontSize: '14px' }}>➡️</span>
										Redirect URI
									</Label>
									<Input
										type="text"
										value={formData.redirectUri || ''}
										onChange={(e) => handleInputChange('redirectUri', e.target.value)}
										placeholder="https://localhost:3000/callback"
									/>
									<Helper>
										<strong>OAuth Redirect URI:</strong> Where users are redirected after
										authorization
										<br />
										Must match exactly with the redirect URI registered in your PingOne application
									</Helper>
								</Field>

								<Field>
									<Label>
										<span style={{ fontSize: '14px' }}>ℹ️</span>
										Expires In (seconds)
									</Label>
									<Input
										type="number"
										value={formData.expiresIn}
										onChange={(e) =>
											handleInputChange('expiresIn', parseInt(e.target.value, 10) || 60)
										}
										placeholder="60"
										min="1"
										max="600"
									/>
									<Helper>
										<strong>PingOne PAR Lifetime:</strong> Default 60 seconds (range: 1-600 seconds)
										<br />
										Shorter lifetimes increase security but may cause timeouts in slow networks or
										complex flows.
									</Helper>
								</Field>
							</Form>

							{/* Generated Authorization URL Preview */}
							{formData.requestUri && formData.clientId && formData.environmentId && (
								<ExampleBox $variant="success">
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '0.5rem',
											marginBottom: '0.5rem',
										}}
									>
										<span style={{ fontSize: '16px' }}>✅</span>
										<strong>Generated Authorization URL</strong>
									</div>
									<CodeBlock>
										{`https://auth.pingone.com/${formData.environmentId}/as/authorize?client_id=${formData.clientId}&request_uri=${encodeURIComponent(formData.requestUri)}`}
										<CopyButton
											onClick={() =>
												copyToClipboard(
													`https://auth.pingone.com/${formData.environmentId}/as/authorize?client_id=${formData.clientId}&request_uri=${encodeURIComponent(formData.requestUri)}`,
													'Authorization URL'
												)
											}
										>
											{copiedText === 'Authorization URL' ? (
												<span style={{ fontSize: '12px' }}>✅</span>
											) : (
												<span style={{ fontSize: '12px' }}>📋</span>
											)}
											{copiedText === 'Authorization URL' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</CodeBlock>
									<p
										style={{
											margin: '0.5rem 0 0 0',
											fontSize: '0.75rem',
											color: '#059669',
										}}
									>
										This is the final authorization URL that users will visit to authenticate.
										Notice how it only contains the client_id and request_uri - all other parameters
										are securely stored server-side.
									</p>
								</ExampleBox>
							)}
						</div>
					)}

					{activeTab === 'builder' && (
						<div>
							<ExampleBox $variant="info">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<i className="bi bi-question-circle" style={{ fontSize: '16px' }}></i>
									<strong>Build Your PAR Request</strong>
								</div>
								<p style={{ margin: 0, fontSize: '0.875rem' }}>
									Configure the parameters that will be sent to PingOne's PAR endpoint. This helps
									you understand what data gets pushed to the server before generating the
									authorization URL.
								</p>
							</ExampleBox>

							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: '1rem',
								}}
							>
								<Field>
									<Label>Response Type</Label>
									<Input
										type="text"
										value={parBuilder.responseType}
										onChange={(e) => handleBuilderChange('responseType', e.target.value)}
										placeholder="code"
									/>
									<Helper>
										Standard: <code>code</code> for Authorization Code flow
									</Helper>
								</Field>

								<Field>
									<Label>Scope</Label>
									<Input
										type="text"
										value={parBuilder.scope}
										onChange={(e) => handleBuilderChange('scope', e.target.value)}
										placeholder="openid profile email"
									/>
									<Helper>
										Space-separated scopes. OIDC requires <code>openid</code>
									</Helper>
								</Field>

								<Field>
									<Label>Redirect URI</Label>
									<Input
										type="text"
										value={parBuilder.redirectUri}
										onChange={(e) => handleBuilderChange('redirectUri', e.target.value)}
										placeholder="https://localhost:3000/callback"
									/>
									<Helper>Must match exactly with registered redirect URI</Helper>
								</Field>

								<Field>
									<Label>State</Label>
									<Input
										type="text"
										value={parBuilder.state}
										onChange={(e) => handleBuilderChange('state', e.target.value)}
										placeholder="abc123xyz789"
									/>
									<Helper>Random value for CSRF protection</Helper>
								</Field>

								<Field>
									<Label>Nonce (OIDC)</Label>
									<Input
										type="text"
										value={parBuilder.nonce || ''}
										onChange={(e) => handleBuilderChange('nonce', e.target.value)}
										placeholder="n-0S6_WzA2Mj"
									/>
									<Helper>Required for OIDC ID token validation</Helper>
								</Field>

								<Field>
									<Label>PKCE Code Challenge</Label>
									<Input
										type="text"
										value={parBuilder.codeChallenge || ''}
										onChange={(e) => handleBuilderChange('codeChallenge', e.target.value)}
										placeholder="E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
									/>
									<Helper>Base64URL-encoded SHA256 hash of code verifier</Helper>
								</Field>
							</div>

							{/* Generated PAR Request */}
							<ExampleBox $variant="success">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<span style={{ fontSize: '16px' }}>➡️</span>
									<strong>Generated PAR Request</strong>
								</div>
								<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
									This is the HTTP request you would send to PingOne's PAR endpoint:
								</p>

								<div style={{ marginBottom: '1rem' }}>
									<strong style={{ fontSize: '0.875rem' }}>Endpoint:</strong>
									<CodeBlock>
										POST https://auth.pingone.com/{formData.environmentId}/as/par
										<CopyButton
											onClick={() =>
												copyToClipboard(
													`https://auth.pingone.com/${formData.environmentId}/as/par`,
													'PAR Endpoint'
												)
											}
										>
											{copiedText === 'PAR Endpoint' ? (
												<span style={{ fontSize: '12px' }}>✅</span>
											) : (
												<span style={{ fontSize: '12px' }}>📋</span>
											)}
											{copiedText === 'PAR Endpoint' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</CodeBlock>
								</div>

								<div style={{ marginBottom: '1rem' }}>
									<strong style={{ fontSize: '0.875rem' }}>Headers:</strong>
									<CodeBlock>
										{`Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(client_id:client_secret)>`}
										<CopyButton
											onClick={() =>
												copyToClipboard(
													`Content-Type: application/x-www-form-urlencoded\nAuthorization: Basic <base64(client_id:client_secret)>`,
													'Headers'
												)
											}
										>
											{copiedText === 'Headers' ? (
												<span style={{ fontSize: '12px' }}>✅</span>
											) : (
												<span style={{ fontSize: '12px' }}>📋</span>
											)}
											{copiedText === 'Headers' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</CodeBlock>
								</div>

								<div>
									<strong style={{ fontSize: '0.875rem' }}>Request Body:</strong>
									<CodeBlock>
										{generatePARRequest().body}
										<CopyButton
											onClick={() => copyToClipboard(generatePARRequest().body, 'Request Body')}
										>
											{copiedText === 'Request Body' ? (
												<span style={{ fontSize: '12px' }}>✅</span>
											) : (
												<span style={{ fontSize: '12px' }}>📋</span>
											)}
											{copiedText === 'Request Body' ? 'Copied!' : 'Copy'}
										</CopyButton>
									</CodeBlock>
								</div>

								<div
									style={{
										marginTop: '1rem',
										padding: '0.75rem',
										background: 'rgba(16, 185, 129, 0.1)',
										borderRadius: '6px',
									}}
								>
									<strong style={{ fontSize: '0.875rem', color: '#059669' }}>
										Expected Response:
									</strong>
									<CodeBlock style={{ marginTop: '0.5rem' }}>
										{`{
  "request_uri": "urn:ietf:params:oauth:request_uri:pingone-abc123def456...",
  "expires_in": 60
}`}
									</CodeBlock>
								</div>
							</ExampleBox>
						</div>
					)}

					{activeTab === 'learn' && (
						<div>
							<ExampleBox $variant="info">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<span style={{ fontSize: '16px' }}>📖</span>
									<strong>Understanding PAR (Pushed Authorization Request)</strong>
								</div>
								<p style={{ margin: 0, fontSize: '0.875rem' }}>
									Learn how PAR enhances OAuth 2.0 security and when to use it in your applications.
								</p>
							</ExampleBox>

							{/* Step-by-step guide */}
							<StepContainer>
								<StepNumber>1</StepNumber>
								<StepContent>
									<StepTitle>🔐 What is PAR?</StepTitle>
									<StepDescription>
										PAR (RFC 9126) allows OAuth clients to push authorization request parameters to
										the authorization server via a secure back-channel POST request, instead of
										passing them through the browser URL.
									</StepDescription>
								</StepContent>
							</StepContainer>

							<StepContainer>
								<StepNumber>2</StepNumber>
								<StepContent>
									<StepTitle>🛡️ Security Benefits</StepTitle>
									<StepDescription>
										• <strong>Parameter Protection:</strong> Sensitive data never appears in browser
										URLs
										<br />• <strong>Tamper Resistance:</strong> Users cannot modify authorization
										parameters
										<br />• <strong>URL Length Limits:</strong> No browser URL length restrictions
										<br />• <strong>Client Authentication:</strong> Enforced at request creation
										time
									</StepDescription>
								</StepContent>
							</StepContainer>

							<StepContainer>
								<StepNumber>3</StepNumber>
								<StepContent>
									<StepTitle>🔄 How PAR Works</StepTitle>
									<StepDescription>
										<strong>Step 1:</strong> Client sends POST request to /as/par with authorization
										parameters
										<br />
										<strong>Step 2:</strong> Server validates and stores parameters, returns
										request_uri
										<br />
										<strong>Step 3:</strong> Client redirects user to /as/authorize with only
										client_id and request_uri
										<br />
										<strong>Step 4:</strong> Server retrieves stored parameters using request_uri
									</StepDescription>
								</StepContent>
							</StepContainer>

							<StepContainer>
								<StepNumber>4</StepNumber>
								<StepContent>
									<StepTitle>⚡ When to Use PAR</StepTitle>
									<StepDescription>
										• <strong>High Security Apps:</strong> Banking, healthcare, government
										applications
										<br />• <strong>Complex Requests:</strong> Many scopes, claims, or authorization
										details
										<br />• <strong>Mobile Apps:</strong> Avoid deep link parameter limits
										<br />• <strong>Compliance:</strong> Regulatory requirements for parameter
										protection
									</StepDescription>
								</StepContent>
							</StepContainer>

							{/* Real-world example */}
							<ExampleBox $variant="success">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<span style={{ fontSize: '16px' }}>✅</span>
									<strong>Real-World Example: Banking Application</strong>
								</div>
								<p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
									A banking app needs to request access to account data with specific authorization
									details:
								</p>

								<div style={{ marginBottom: '1rem' }}>
									<strong style={{ fontSize: '0.875rem' }}>Without PAR (Traditional OAuth):</strong>
									<CodeBlock style={{ fontSize: '0.7rem' }}>
										{`https://auth.pingone.com/env/as/authorize?
  response_type=code&
  client_id=banking-app&
  scope=openid%20profile%20accounts%20transactions&
  redirect_uri=https://bank.example.com/callback&
  state=abc123&
  nonce=xyz789&
  authorization_details=%5B%7B%22type%22%3A%22account_information%22%2C%22actions%22%3A%5B%22read%22%5D%2C%22locations%22%3A%5B%22https%3A//api.bank.com%22%5D%7D%5D

❌ Problems: Long URL, visible parameters, tamperable by user`}
									</CodeBlock>
								</div>

								<div>
									<strong style={{ fontSize: '0.875rem' }}>With PAR (Secure):</strong>
									<CodeBlock style={{ fontSize: '0.7rem' }}>
										{`https://auth.pingone.com/env/as/authorize?
  client_id=banking-app&
  request_uri=urn:ietf:params:oauth:request_uri:pingone-secure123

✅ Benefits: Short URL, parameters stored server-side, tamper-proof`}
									</CodeBlock>
								</div>
							</ExampleBox>

							{/* PingOne specific notes */}
							<ExampleBox $variant="warning">
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '0.5rem',
										marginBottom: '0.5rem',
									}}
								>
									<span style={{ fontSize: '16px' }}>⚠️</span>
									<strong>PingOne PAR Implementation Notes</strong>
								</div>
								<ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
									<li>
										<strong>Endpoint:</strong>{' '}
										<code>https://auth.pingone.com/{'<env-id>'}/as/par</code>
									</li>
									<li>
										<strong>Authentication:</strong> Client credentials required (Basic Auth or
										client_secret_post)
									</li>
									<li>
										<strong>Lifetime:</strong> Default 60 seconds, configurable 1-600 seconds
									</li>
									<li>
										<strong>Usage:</strong> Single-use only, expires after authorization or timeout
									</li>
									<li>
										<strong>Format:</strong>{' '}
										<code>urn:ietf:params:oauth:request_uri:pingone-[identifier]</code>
									</li>
								</ul>
							</ExampleBox>
						</div>
					)}
				</Content>

				<Actions>
					<Button type="button" onClick={handleCancel}>
						Cancel
					</Button>

					{activeTab === 'input' && (
						<Button
							type="submit"
							$variant="primary"
							onClick={handleSubmit}
							disabled={!formData.requestUri || !formData.clientId || !formData.environmentId}
						>
							<span>🛡️</span>
							Generate Authorization URL
						</Button>
					)}

					{activeTab === 'builder' && (
						<Button
							type="button"
							$variant="success"
							onClick={() => {
								// Switch to input tab with generated request_uri
								const mockRequestUri = `urn:ietf:params:oauth:request_uri:pingone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
								setFormData((prev) => ({
									...prev,
									requestUri: mockRequestUri,
								}));
								setActiveTab('input');
							}}
						>
							<span>➡️</span>
							Use This Configuration
						</Button>
					)}

					{activeTab === 'learn' && (
						<Button type="button" $variant="primary" onClick={() => setActiveTab('builder')}>
							<i className="bi bi-question-circle"></i>
							Try Building a PAR Request
						</Button>
					)}
				</Actions>
			</Modal>
		</Overlay>
	);
};

export default PARInputInterface;
