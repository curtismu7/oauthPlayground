/**
 * @file TokenEndpointAuthModal.PingUI.tsx
 * @module v8/components
 * @description Ping UI migrated educational modal explaining PingOne Token Endpoint Authentication Methods
 * @version 8.0.0
 * @since 2024-11-20
 *
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';

const _MODULE_TAG = '[🔐 TOKEN-AUTH-MODAL-V8-PINGUI]';

// Bootstrap Icon Component (migrated from MDI)
import BootstrapIcon from '@/components/BootstrapIcon';
import { getBootstrapIconName } from '@/components/iconMapping';

interface TokenEndpointAuthModalPingUIProps {
	isOpen: boolean;
	onClose: () => void;
}

// Styled Components
const Overlay = styled.div<{ $isOpen: boolean }>`
	display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: var(--ping-spacing-md, 1rem);
`;

const ModalContainer = styled.div`
	background: var(--ping-surface-primary, white);
	border-radius: var(--ping-border-radius-xl, 1rem);
	max-width: 900px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: var(--ping-shadow-xl, 0 20px 40px rgba(0, 0, 0, 0.3));
`;

const ModalHeader = styled.div`
	background: linear-gradient(135deg, var(--ping-primary-color, #3b82f6) 0%, var(--ping-primary-hover, #2563eb) 100%);
	color: white;
	padding: var(--ping-spacing-xl, 1.5rem);
	border-radius: var(--ping-border-radius-xl, 1rem) var(--ping-border-radius-xl, 1rem) 0 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const ModalTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin: 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const CloseButton = styled.button`
	background: transparent;
	border: none;
	color: white;
	font-size: 1.5rem;
	cursor: pointer;
	padding: var(--ping-spacing-xs, 0.25rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const ModalBody = styled.div`
	padding: var(--ping-spacing-xl, 2rem);
`;

const Section = styled.div`
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const SectionTitle = styled.h3`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.25rem;
	font-weight: 600;
	margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const SectionDescription = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 1rem;
	line-height: 1.6;
	margin: 0 0 var(--ping-spacing-lg, 1.5rem) 0;
`;

const AuthMethodsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: var(--ping-spacing-lg, 1.5rem);
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const AuthMethodCard = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-lg, 1.5rem);
	transition: all var(--ping-transition-fast, 0.15s) ease-in-out;

	&:hover {
		border-color: var(--ping-primary-color, #3b82f6);
		box-shadow: var(--ping-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
		transform: translateY(-2px);
	}
`;

const MethodHeader = styled.div`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
	margin-bottom: var(--ping-spacing-md, 1rem);
`;

const MethodIcon = styled.div<{ $method: string }>`
	color: ${({ $method }) => {
		switch ($method) {
			case 'none':
				return 'var(--ping-error-color, #ef4444)';
			case 'client_secret_basic':
				return 'var(--ping-warning-color, #f59e0b)';
			case 'client_secret_post':
				return 'var(--ping-info-color, #3b82f6)';
			case 'private_key_jwt':
				return 'var(--ping-success-color, #10b981)';
			default:
				return 'var(--ping-text-primary, #1e293b)';
		}
	}};
`;

const MethodName = styled.h4`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
`;

const MethodDescription = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 0 0 var(--ping-spacing-md, 1rem) 0;
`;

const SecurityLevel = styled.div<{ $level: 'low' | 'medium' | 'high' }>`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.5rem);
	font-size: 0.75rem;
	font-weight: 600;
	padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	background: ${({ $level }) => {
		switch ($level) {
			case 'low':
				return 'var(--ping-error-light, #fef2f2)';
			case 'medium':
				return 'var(--ping-warning-light, #fef3c7)';
			case 'high':
				return 'var(--ping-success-light, #d1fae5)';
			default:
				return 'var(--ping-surface-secondary, #f8fafc)';
		}
	}};
	color: ${({ $level }) => {
		switch ($level) {
			case 'low':
				return 'var(--ping-error-dark, #991b1b)';
			case 'medium':
				return 'var(--ping-warning-dark, #92400e)';
			case 'high':
				return 'var(--ping-success-dark, #065f46)';
			default:
				return 'var(--ping-text-primary, #1e293b)';
		}
	}};
`;

const ComparisonTable = styled.div`
	background: var(--ping-surface-primary, white);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	overflow: hidden;
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const TableHeader = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border-bottom: 1px solid var(--ping-border-default, #e2e8f0);
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	padding: var(--ping-spacing-md, 1rem);
	font-weight: 600;
	color: var(--ping-text-primary, #1e293b);
`;

const TableRow = styled.div`
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	padding: var(--ping-spacing-md, 1rem);
	border-bottom: 1px solid var(--ping-border-light, #f1f5f9);

	&:last-child {
		border-bottom: none;
	}

	&:nth-child(even) {
		background: var(--ping-surface-secondary, #f8fafc);
	}
`;

const TableCell = styled.div`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-xs, 0.5rem);
`;

const _CheckIcon = styled.div`
	color: var(--ping-success-color, #10b981);
`;

const _CrossIcon = styled.div`
	color: var(--ping-error-color, #ef4444);
`;

const InfoBox = styled.div`
	background: var(--ping-info-light, #eff6ff);
	border: 1px solid var(--ping-info-color, #3b82f6);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
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

const CodeBlock = styled.code`
	background: var(--ping-code-background, #1e293b);
	color: var(--ping-code-text, #e2e8f0);
	padding: var(--ping-spacing-xs, 0.25rem) var(--ping-spacing-sm, 0.5rem);
	border-radius: var(--ping-border-radius-sm, 4px);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
`;

export const TokenEndpointAuthModalPingUI: React.FC<TokenEndpointAuthModalPingUIProps> = ({
	isOpen,
	onClose,
}) => {
	const authMethods = [
		{
			name: 'None',
			method: 'none',
			description: 'No authentication - for public clients or testing only',
			security: 'low',
			useCase: 'Mobile apps, SPAs (less secure)',
		},
		{
			name: 'Client Secret Basic',
			method: 'client_secret_basic',
			description: 'Client ID and secret sent in HTTP Basic header',
			security: 'medium',
			useCase: 'Server-side applications',
		},
		{
			name: 'Client Secret Post',
			method: 'client_secret_post',
			description: 'Client ID and secret sent in request body',
			security: 'medium',
			useCase: 'Server-side applications',
		},
		{
			name: 'Private Key JWT',
			method: 'private_key_jwt',
			description: 'Client assertion signed with private key',
			security: 'high',
			useCase: 'High-security environments',
		},
	];

	const getSecurityIcon = (level: string) => {
		switch (level) {
			case 'low':
				return <BootstrapIcon icon={getBootstrapIconName("FiXCircle")} size={12} aria-hidden={true} />;
			case 'medium':
				return <BootstrapIcon icon={getBootstrapIconName("FiShield")} size={12} aria-hidden={true} />;
			case 'high':
				return <BootstrapIcon icon={getBootstrapIconName("FiCheckCircle")} size={12} aria-hidden={true} />;
			default:
				return <BootstrapIcon icon={getBootstrapIconName("FiInfo")} size={12} aria-hidden={true} />;
		}
	};

	return (
		<div className="end-user-nano">
			<Overlay $isOpen={isOpen}>
				<ModalContainer>
					<ModalHeader>
						<ModalTitle>
							<BootstrapIcon icon={getBootstrapIconName("FiKey")} size={24} aria-label="Authentication Methods" />
							Token Endpoint Authentication Methods
						</ModalTitle>
						<CloseButton onClick={onClose} aria-label="Close modal">
							<BootstrapIcon icon={getBootstrapIconName("FiX")} size={20} aria-label="Close" style={{ color: 'white' }} />
						</CloseButton>
					</ModalHeader>

					<ModalBody>
						<Section>
							<SectionTitle>
								<BootstrapIcon icon={getBootstrapIconName("FiInfo")} size={20} aria-label="Information" />
								What is Token Endpoint Authentication?
							</SectionTitle>
							<SectionDescription>
								Token endpoint authentication is how OAuth 2.0 clients prove their identity to the
								authorization server when requesting access tokens. The method you choose impacts
								security and compatibility.
							</SectionDescription>

							<InfoBox>
								<BootstrapIcon icon={getBootstrapIconName("FiShield")} size={20} aria-label="Security Information" />
								<InfoText>
									<strong>Security Recommendation:</strong> Use the most secure method supported by
									your client type. For server-side applications, prefer client secret methods. For
									high-security environments, use private key JWT authentication.
								</InfoText>
							</InfoBox>
						</Section>

						<Section>
							<SectionTitle>Authentication Methods</SectionTitle>
							<AuthMethodsGrid>
								{authMethods.map((method) => (
									<AuthMethodCard key={method.method}>
										<MethodHeader>
											<MethodIcon $method={method.method}>
												<BootstrapIcon icon={getBootstrapIconName("FiLock")} size={24} aria-label={method.name} />
											</MethodIcon>
											<MethodName>{method.name}</MethodName>
										</MethodHeader>
										<MethodDescription>{method.description}</MethodDescription>
										<SecurityLevel $level={method.security as 'low' | 'medium' | 'high'}>
											{getSecurityIcon(method.security)}
											Security: {method.security.toUpperCase()}
										</SecurityLevel>
									</AuthMethodCard>
								))}
							</AuthMethodsGrid>
						</Section>

						<Section>
							<SectionTitle>Feature Comparison</SectionTitle>
							<ComparisonTable>
								<TableHeader>
									<div>Method</div>
									<div>Security</div>
									<div>Complexity</div>
									<div>Best For</div>
								</TableHeader>
								{authMethods.map((method) => (
									<TableRow key={method.method}>
										<TableCell>
											<strong>{method.name}</strong>
										</TableCell>
										<TableCell>
											<SecurityLevel $level={method.security as 'low' | 'medium' | 'high'}>
												{getSecurityIcon(method.security)}
												{method.security}
											</SecurityLevel>
										</TableCell>
										<TableCell>
											{method.security === 'low' ? (
												<span>Low</span>
											) : method.security === 'high' ? (
												<span>High</span>
											) : (
												<span>Medium</span>
											)}
										</TableCell>
										<TableCell>
											<span style={{ fontSize: '0.875rem' }}>{method.useCase}</span>
										</TableCell>
									</TableRow>
								))}
							</ComparisonTable>
						</Section>

						<Section>
							<SectionTitle>Implementation Examples</SectionTitle>
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									gap: 'var(--ping-spacing-md, 1rem)',
								}}
							>
								<div>
									<h4
										style={{
											margin: '0 0 var(--ping-spacing-sm, 0.75rem) 0',
											color: 'var(--ping-text-primary, #1e293b)',
											fontSize: '1rem',
										}}
									>
										Client Secret Basic:
									</h4>
									<CodeBlock>Authorization: Basic base64(client_id:client_secret)</CodeBlock>
								</div>
								<div>
									<h4
										style={{
											margin: '0 0 var(--ping-spacing-sm, 0.75rem) 0',
											color: 'var(--ping-text-primary, #1e293b)',
											fontSize: '1rem',
										}}
									>
										Client Secret Post:
									</h4>
									<CodeBlock>client_id=your_client_id&client_secret=your_secret</CodeBlock>
								</div>
							</div>
						</Section>
					</ModalBody>
				</ModalContainer>
			</Overlay>
		</div>
	);
};

export default TokenEndpointAuthModalPingUI;
