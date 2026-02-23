/**
 * @file TokenOperationsEducationModalV8.PingUI.tsx
 * @module v8/components
 * @description Ping UI migrated educational modal explaining token introspection and UserInfo rules
 * @version 8.0.0
 * @since 2024-11-21
 *
 * Features:
 * - Flow-specific rules for introspection and UserInfo
 * - Visual indicators (✅/❌) for what's allowed
 * - Educational content with examples
 * - Simple, user-friendly explanations
 *
 * Migrated to Ping UI with MDI icons and CSS variables.
 */

import React from 'react';
import styled from 'styled-components';
import { TokenOperationsServiceV8 } from '@/v8/services/tokenOperationsServiceV8';

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
		<span
			className={combinedClassName}
			style={{ fontSize: `${size}px`, ...style }}
			{...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
			{...(ariaHidden ? { 'aria-hidden': 'true' } : {})}
			role="img"
		></span>
	);
};

// MDI Icon mapping function
const getMDIIconClass = (iconName: string): string => {
	const iconMap: Record<string, string> = {
		FiCheckCircle: 'mdi-check-circle',
		FiInfo: 'mdi-information',
		FiX: 'mdi-close',
		FiXCircle: 'mdi-close-circle',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface TokenOperationsEducationModalV8PingUIProps {
	isOpen: boolean;
	onClose: () => void;
	flowType: string;
	scopes?: string;
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
	max-width: 800px;
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

const FlowInfo = styled.div`
	background: var(--ping-info-light, #eff6ff);
	border: 1px solid var(--ping-info-color, #3b82f6);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const FlowText = styled.div`
	color: var(--ping-info-dark, #1e40af);
	font-size: 0.875rem;
	font-weight: 500;
`;

const RulesGrid = styled.div`
	display: grid;
	gap: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-xl, 2rem);
`;

const RuleCard = styled.div`
	background: var(--ping-surface-secondary, #f8fafc);
	border: 1px solid var(--ping-border-default, #e2e8f0);
	border-radius: var(--ping-border-radius-lg, 12px);
	padding: var(--ping-spacing-lg, 1.5rem);
`;

const RuleHeader = styled.div`
	display: flex;
	align-items: center;
	gap: var(--ping-spacing-sm, 0.75rem);
	margin-bottom: var(--ping-spacing-md, 1rem);
`;

const RuleTitle = styled.h4`
	color: var(--ping-text-primary, #1e293b);
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0;
`;

const RuleDescription = styled.p`
	color: var(--ping-text-secondary, #64748b);
	font-size: 0.875rem;
	line-height: 1.5;
	margin: 0 0 var(--ping-spacing-md, 1rem) 0;
`;

const RuleItems = styled.div`
	display: grid;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const RuleItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const ItemIcon = styled.div<{ $allowed: boolean }>`
	color: ${({ $allowed }) =>
		$allowed ? 'var(--ping-success-color, #10b981)' : 'var(--ping-error-color, #ef4444)'};
	flex-shrink: 0;
	margin-top: 2px;
`;

const ItemText = styled.div`
	color: var(--ping-text-primary, #1e293b);
	font-size: 0.875rem;
	line-height: 1.5;
	flex: 1;
`;

const ExampleBox = styled.div`
	background: var(--ping-code-background, #1e293b);
	color: var(--ping-code-text, #e2e8f0);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-lg, 1.5rem);
	margin-top: var(--ping-spacing-md, 1rem);
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
`;

const ScopesInfo = styled.div`
	background: var(--ping-warning-light, #fef3c7);
	border: 1px solid var(--ping-warning-color, #f59e0b);
	border-radius: var(--ping-border-radius-md, 8px);
	padding: var(--ping-spacing-md, 1rem);
	margin-bottom: var(--ping-spacing-lg, 1.5rem);
	display: flex;
	align-items: flex-start;
	gap: var(--ping-spacing-sm, 0.75rem);
`;

const ScopesText = styled.div`
	color: var(--ping-warning-dark, #92400e);
	font-size: 0.875rem;
	line-height: 1.5;
	flex: 1;
`;

export const TokenOperationsEducationModalV8PingUI: React.FC<
	TokenOperationsEducationModalV8PingUIProps
> = ({ isOpen, onClose, flowType, scopes }) => {
	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
		return undefined;
	}, [isOpen]);

	const getFlowRules = () => {
		return TokenOperationsServiceV8.getFlowRules(flowType);
	};

	const getFlowDisplayName = (flow: string) => {
		switch (flow) {
			case 'oauth-authz':
				return 'OAuth 2.0 Authorization Code';
			case 'oidc-authz':
				return 'OpenID Connect Authorization Code';
			case 'oauth-pkce':
				return 'OAuth 2.0 with PKCE';
			case 'oidc-hybrid':
				return 'OpenID Connect Hybrid';
			default:
				return flow;
		}
	};

	const rules = getFlowRules();

	return (
		<div className="end-user-nano">
			<Overlay $isOpen={isOpen}>
				<ModalContainer>
					<ModalHeader>
						<ModalTitle>
							<MDIIcon icon="FiInfo" size={24} ariaLabel="Information" />
							Token Operations Rules
						</ModalTitle>
						<CloseButton onClick={onClose} aria-label="Close modal">
							<MDIIcon icon="FiX" size={20} ariaLabel="Close" style={{ color: 'white' }} />
						</CloseButton>
					</ModalHeader>

					<ModalBody>
						<Section>
							<SectionTitle>Flow Information</SectionTitle>
							<FlowInfo>
								<MDIIcon icon="FiInfo" size={20} ariaLabel="Flow Information" />
								<FlowText>
									<strong>Current Flow:</strong> {getFlowDisplayName(flowType)}
									<br />
									<strong>Available Scopes:</strong> {scopes || 'None specified'}
								</FlowText>
							</FlowInfo>

							{scopes && (
								<ScopesInfo>
									<MDIIcon icon="FiInfo" size={20} ariaLabel="Scopes Information" />
									<ScopesText>
										<strong>Scopes Control Access:</strong> The scopes you requested determine what
										information is available in the ID token and UserInfo endpoint. The 'openid'
										scope is required for any OpenID Connect flow to receive an ID token.
									</ScopesText>
								</ScopesInfo>
							)}
						</Section>

						<Section>
							<SectionTitle>Token Introspection Rules</SectionTitle>
							<SectionDescription>
								Token introspection allows you to validate and get information about access tokens.
								What you can introspect depends on your flow type and permissions.
							</SectionDescription>

							<RulesGrid>
								<RuleCard>
									<RuleHeader>
										<MDIIcon icon="FiCheckCircle" size={20} ariaLabel="Allowed" />
										<RuleTitle>What You Can Introspect</RuleTitle>
									</RuleHeader>
									<RuleDescription>
										Based on your flow type, you can introspect the following token information:
									</RuleDescription>
									<RuleItems>
										{rules.introspection.allowed.map((item, index) => (
											<RuleItem key={index}>
												<ItemIcon $allowed={true}>
													<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Allowed" />
												</ItemIcon>
												<ItemText>{item}</ItemText>
											</RuleItem>
										))}
									</RuleItems>
								</RuleCard>

								<RuleCard>
									<RuleHeader>
										<MDIIcon icon="FiXCircle" size={20} ariaLabel="Not Allowed" />
										<RuleTitle>What You Cannot Introspect</RuleTitle>
									</RuleHeader>
									<RuleDescription>
										Some information is restricted based on security and privacy requirements:
									</RuleDescription>
									<RuleItems>
										{rules.introspection.restricted.map((item, index) => (
											<RuleItem key={index}>
												<ItemIcon $allowed={false}>
													<MDIIcon icon="FiXCircle" size={16} ariaLabel="Not Allowed" />
												</ItemIcon>
												<ItemText>{item}</ItemText>
											</RuleItem>
										))}
									</RuleItems>
								</RuleCard>
							</RulesGrid>
						</Section>

						<Section>
							<SectionTitle>UserInfo Endpoint Rules</SectionTitle>
							<SectionDescription>
								The UserInfo endpoint provides additional user information for OpenID Connect flows.
								Access depends on the requested scopes and permissions.
							</SectionDescription>

							<RulesGrid>
								<RuleCard>
									<RuleHeader>
										<MDIIcon icon="FiCheckCircle" size={20} ariaLabel="Available" />
										<RuleTitle>Available User Information</RuleTitle>
									</RuleHeader>
									<RuleDescription>
										Based on your requested scopes, you can access the following user information:
									</RuleDescription>
									<RuleItems>
										{rules.userInfo.available.map((item, index) => (
											<RuleItem key={index}>
												<ItemIcon $allowed={true}>
													<MDIIcon icon="FiCheckCircle" size={16} ariaLabel="Available" />
												</ItemIcon>
												<ItemText>{item}</ItemText>
											</RuleItem>
										))}
									</RuleItems>
								</RuleCard>

								<RuleCard>
									<RuleHeader>
										<MDIIcon icon="FiXCircle" size={20} ariaLabel="Not Available" />
										<RuleTitle>Not Available Without Additional Scopes</RuleTitle>
									</RuleHeader>
									<RuleDescription>
										Additional information requires specific scopes to be requested:
									</RuleDescription>
									<RuleItems>
										{rules.userInfo.requiresScopes.map((item, index) => (
											<RuleItem key={index}>
												<ItemIcon $allowed={false}>
													<MDIIcon icon="FiXCircle" size={16} ariaLabel="Requires Scope" />
												</ItemIcon>
												<ItemText>{item}</ItemText>
											</RuleItem>
										))}
									</RuleItems>
								</RuleCard>
							</RulesGrid>
						</Section>

						<Section>
							<SectionTitle>Example Usage</SectionTitle>
							<SectionDescription>
								Here's how to use token introspection and UserInfo endpoints with your current flow:
							</SectionDescription>

							<ExampleBox>
								{`// Token Introspection Example
POST /introspect
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(client_id:client_secret)

token=your_access_token

// UserInfo Endpoint Example  
GET /userinfo
Authorization: Bearer your_access_token

// Response will include user information based on requested scopes`}
							</ExampleBox>
						</Section>
					</ModalBody>
				</ModalContainer>
			</Overlay>
		</div>
	);
};

export default TokenOperationsEducationModalV8PingUI;
