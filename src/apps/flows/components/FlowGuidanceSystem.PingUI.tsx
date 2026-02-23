/**
 * @file FlowGuidanceSystem.PingUI.tsx
 * @module apps/flows/components
 * @description Flow Guidance System Component - Ping UI migrated
 * @version 8.0.0-PingUI
 * @since 2026-02-21
 *
 * Ping UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React, { useState } from 'react';
import { type FlowType, type SpecVersion } from '@/v8/services/specVersionServiceV8';

// MDI Icon Component with proper accessibility
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	ariaLabel?: string;
	ariaHidden?: boolean;
	className?: string;
	style?: React.CSSProperties;
}> = ({ icon, size = 16, ariaLabel, ariaHidden, className = '', style }) => {
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
		FiArrowRight: 'mdi-arrow-right',
		FiBook: 'mdi-book',
		FiCheck: 'mdi-check',
		FiChevronDown: 'mdi-chevron-down',
		FiInfo: 'mdi-information',
		FiLock: 'mdi-lock',
		FiUsers: 'mdi-account-group',
		FiZap: 'mdi-lightning-bolt',
	};
	return iconMap[iconName] || 'mdi-help-circle';
};

interface FlowGuidanceSystemPingUIProps {
	flowType: FlowType;
	specVersion: SpecVersion;
}

const FlowGuidanceSystemPingUI: React.FC<FlowGuidanceSystemPingUIProps> = ({
	flowType,
	specVersion,
}) => {
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

	const toggleSection = (sectionId: string) => {
		setCollapsedSections((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(sectionId)) {
				newSet.delete(sectionId);
			} else {
				newSet.add(sectionId);
			}
			return newSet;
		});
	};

	const isCollapsed = (sectionId: string) => collapsedSections.has(sectionId);

	const getFlowSpecificGuidance = () => {
		const guidance: Record<FlowType, { title: string; icon: string; steps: string[] }> = {
			'oauth-authz': {
				title: 'Authorization Code Flow',
				icon: 'FiLock',
				steps: [
					'User is redirected to authorization server',
					'User grants permission to the application',
					'Authorization server returns authorization code',
					'Application exchanges code for access token',
					'Application can now access protected resources',
				],
			},
			implicit: {
				title: 'Implicit Flow',
				icon: 'FiZap',
				steps: [
					'User is redirected to authorization server',
					'User grants permission to the application',
					'Authorization server returns access token directly',
					'Application can now access protected resources',
					'Note: This flow is no longer recommended for SPAs',
				],
			},
			'client-credentials': {
				title: 'Client Credentials Flow',
				icon: 'FiUsers',
				steps: [
					'Application authenticates with authorization server',
					'Authorization server issues access token',
					'Application can now access protected resources',
					'Used for machine-to-machine communication',
				],
			},
			'device-code': {
				title: 'Device Code Flow',
				icon: 'FiArrowRight',
				steps: [
					'Application requests device code from authorization server',
					'Application displays device code and user code',
					'User visits authorization URL on separate device',
					'User enters user code and grants permission',
					'Application polls for token until user completes authorization',
				],
			},
			hybrid: {
				title: 'Hybrid Flow',
				icon: 'FiLock',
				steps: [
					'User is redirected to authorization server',
					'User grants permission to the application',
					'Authorization server returns both authorization code and tokens',
					'Application validates tokens and exchanges code if needed',
					'Application can now access protected resources',
				],
			},
			ropc: {
				title: 'Resource Owner Password Credentials',
				icon: 'FiUsers',
				steps: [
					'User provides credentials directly to application',
					'Application presents credentials to authorization server',
					'Authorization server validates credentials',
					'Authorization server issues access token',
					'Application can now access protected resources',
					'Note: Only use when other flows are not available',
				],
			},
			mfa: {
				title: 'Multi-Factor Authentication Flow',
				icon: 'FiLock',
				steps: [
					'User initiates authentication with primary factor',
					'Application verifies primary credentials',
					'User prompted for additional authentication factors',
					'Application validates all factors',
					'User granted access upon successful verification',
				],
			},
		};

		return guidance[flowType] || guidance['oauth-authz'];
	};

	const getSpecVersionGuidance = () => {
		const guidance: Record<SpecVersion, { title: string; features: string[] }> = {
			'oauth2.0': {
				title: 'OAuth 2.0 Core',
				features: [
					'Authorization Code Flow',
					'Implicit Flow',
					'Client Credentials Flow',
					'Resource Owner Password Credentials',
					'Extension grants supported',
					'Bearer token usage',
				],
			},
			'oauth2.1': {
				title: 'OAuth 2.1 (Latest)',
				features: [
					'Authorization Code Flow with PKCE',
					'Client Credentials Flow',
					'Device Authorization Flow',
					'Improved security requirements',
					'Deprecated Implicit Flow',
					'Deprecated Resource Owner Password Credentials',
					'Mandatory PKCE for public clients',
				],
			},
			oidc: {
				title: 'OpenID Connect (OAuth 2.0 + Identity Layer)',
				features: [
					'All OAuth 2.0 flows plus ID tokens',
					'UserInfo endpoint',
					'Dynamic client registration',
					'Discovery document',
					'JWT ID tokens with user claims',
					'Session management',
				],
			},
		};

		return guidance[specVersion] || guidance['oauth2.0'];
	};

	const flowGuidance = getFlowSpecificGuidance();
	const specGuidance = getSpecVersionGuidance();

	return (
		<div className="end-user-nano">
			<div
				style={{
					background:
						'linear-gradient(135deg, var(--ping-surface-primary, #f8fafc) 0%, var(--ping-surface-secondary, #e2e8f0) 100%)',
					border: '1px solid var(--ping-border-color, #cbd5e1)',
					borderRadius: 'var(--ping-border-radius-lg, 12px)',
					margin: 'var(--ping-spacing-lg, 1rem) 0',
				}}
			>
				{/* Flow Type Guidance */}
				<div
					style={{
						marginBottom: 'var(--ping-spacing-md, 1rem)',
					}}
				>
					<button
						type="button"
						onClick={() => toggleSection('flow-type')}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							width: '100%',
							padding: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 1.75rem)',
							background:
								'linear-gradient(135deg, var(--ping-success-light, #f0fdf4) 0%, var(--ping-success-lighter, #ecfdf3) 100%)',
							border: '3px solid transparent',
							borderRadius: 'var(--ping-border-radius-lg, 1rem)',
							cursor: 'pointer',
							transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-success-color, #22c55e)';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.borderColor = 'transparent';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
						onFocus={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-success-color, #22c55e)';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = 'transparent';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<MDIIcon
								icon={flowGuidance.icon}
								size={24}
								ariaLabel={flowGuidance.title}
								style={{ color: 'var(--ping-success-color, #22c55e)' }}
							/>
							<div
								style={{
									fontSize: '1.125rem',
									fontWeight: 600,
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							>
								{flowGuidance.title}
							</div>
						</div>
						<MDIIcon
							icon="FiChevronDown"
							size={20}
							ariaLabel={isCollapsed('flow-type') ? 'Expand section' : 'Collapse section'}
							style={{
								color: 'var(--ping-text-secondary, #6b7280)',
								transform: isCollapsed('flow-type') ? 'rotate(-90deg)' : 'rotate(0deg)',
								transition: 'transform var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						/>
					</button>

					{!isCollapsed('flow-type') && (
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 1.75rem)',
								animation: 'fadeIn var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						>
							<div
								style={{
									marginBottom: 'var(--ping-spacing-md, 1rem)',
									color: 'var(--ping-text-secondary, #6b7280)',
									fontSize: '0.875rem',
								}}
							>
								Follow these steps to complete the {flowGuidance.title.toLowerCase()}:
							</div>
							{flowGuidance.steps.map((step, index) => (
								<button
									key={index}
									type="button"
									style={{
										display: 'flex',
										alignItems: 'flex-start',
										gap: 'var(--ping-spacing-md, 1rem)',
										marginBottom: 'var(--ping-spacing-md, 1rem)',
										padding: 'var(--ping-spacing-sm, 0.75rem)',
										background: 'var(--ping-surface-primary, #ffffff)',
										borderRadius: 'var(--ping-border-radius-md, 8px)',
										border: '1px solid var(--ping-border-color, #e5e7eb)',
										transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
										cursor: 'pointer',
									}}
									onMouseOver={(e) => {
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.boxShadow =
											'var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))';
									}}
									onMouseOut={(e) => {
										e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
										e.currentTarget.style.boxShadow = 'none';
									}}
									onFocus={(e) => {
										e.currentTarget.style.borderColor = 'var(--ping-primary-color, #3b82f6)';
										e.currentTarget.style.boxShadow =
											'var(--ping-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))';
									}}
									onBlur={(e) => {
										e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
										e.currentTarget.style.boxShadow = 'none';
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											// Handle step selection if needed
										}
									}}
								>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '24px',
											height: '24px',
											background: 'var(--ping-primary-color, #3b82f6)',
											color: 'white',
											borderRadius: '50%',
											fontSize: '0.75rem',
											fontWeight: 600,
											flexShrink: 0,
										}}
									>
										{index + 1}
									</div>
									<div
										style={{
											color: 'var(--ping-text-primary, #1a1a1a)',
											fontSize: '0.875rem',
											lineHeight: '1.4',
										}}
									>
										{step}
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Spec Version Guidance */}
				<div>
					<button
						type="button"
						onClick={() => toggleSection('spec-version')}
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							width: '100%',
							padding: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 1.75rem)',
							background:
								'linear-gradient(135deg, var(--ping-info-light, #f0f9ff) 0%, var(--ping-info-lighter, #ecfeff) 100%)',
							border: '3px solid transparent',
							borderRadius: 'var(--ping-border-radius-lg, 1rem)',
							cursor: 'pointer',
							transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-info-color, #3b82f6)';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.borderColor = 'transparent';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
						onFocus={(e) => {
							e.currentTarget.style.borderColor = 'var(--ping-info-color, #3b82f6)';
							e.currentTarget.style.transform = 'translateY(-1px)';
						}}
						onBlur={(e) => {
							e.currentTarget.style.borderColor = 'transparent';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 'var(--ping-spacing-md, 1rem)',
							}}
						>
							<MDIIcon
								icon="FiBook"
								size={24}
								ariaLabel="Specification"
								style={{ color: 'var(--ping-info-color, #3b82f6)' }}
							/>
							<div
								style={{
									fontSize: '1.125rem',
									fontWeight: 600,
									color: 'var(--ping-text-primary, #1a1a1a)',
								}}
							>
								{specGuidance.title}
							</div>
						</div>
						<MDIIcon
							icon="FiChevronDown"
							size={20}
							ariaLabel={isCollapsed('spec-version') ? 'Expand section' : 'Collapse section'}
							style={{
								color: 'var(--ping-text-secondary, #6b7280)',
								transform: isCollapsed('spec-version') ? 'rotate(-90deg)' : 'rotate(0deg)',
								transition: 'transform var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						/>
					</button>

					{!isCollapsed('spec-version') && (
						<div
							style={{
								padding: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 1.75rem)',
								animation: 'fadeIn var(--ping-transition-fast, 0.15s) ease-in-out',
							}}
						>
							<div
								style={{
									marginBottom: 'var(--ping-spacing-md, 1rem)',
									color: 'var(--ping-text-secondary, #6b7280)',
									fontSize: '0.875rem',
								}}
							>
								Key features and capabilities:
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
									gap: 'var(--ping-spacing-sm, 0.75rem)',
								}}
							>
								{specGuidance.features.map((feature, index) => (
									<button
										key={index}
										type="button"
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 'var(--spacing-sm, 0.5rem)',
											padding: 'var(--ping-spacing-sm, 0.75rem)',
											background: 'var(--ping-surface-primary, #ffffff)',
											borderRadius: 'var(--ping-border-radius-md, 8px)',
											border: '1px solid var(--ping-border-color, #e5e7eb)',
											transition: 'all var(--ping-transition-fast, 0.15s) ease-in-out',
											cursor: 'pointer',
										}}
										onMouseOver={(e) => {
											e.currentTarget.style.borderColor = 'var(--ping-info-color, #3b82f6)';
											e.currentTarget.style.transform = 'translateX(2px)';
										}}
										onMouseOut={(e) => {
											e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
											e.currentTarget.style.transform = 'translateX(0)';
										}}
										onFocus={(e) => {
											e.currentTarget.style.borderColor = 'var(--ping-info-color, #3b82f6)';
											e.currentTarget.style.transform = 'translateX(2px)';
										}}
										onBlur={(e) => {
											e.currentTarget.style.borderColor = 'var(--ping-border-color, #e5e7eb)';
											e.currentTarget.style.transform = 'translateX(0)';
										}}
									>
										<MDIIcon
											icon="FiCheck"
											size={16}
											ariaLabel="Feature included"
											style={{ color: 'var(--ping-success-color, #22c55e)' }}
										/>
										<span
											style={{
												color: 'var(--ping-text-primary, #1a1a1a)',
												fontSize: '0.875rem',
											}}
										>
											{feature}
										</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>

				{/* Additional Resources */}
				<div
					style={{
						padding: 'var(--ping-spacing-lg, 1.5rem) var(--ping-spacing-xl, 1.75rem)',
						background: 'var(--ping-surface-secondary, #f8fafc)',
						borderTop: '1px solid var(--ping-border-color, #e5e7eb)',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 'var(--ping-spacing-sm, 0.5rem)',
							marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
						}}
					>
						<MDIIcon
							icon="FiInfo"
							size={16}
							ariaLabel="Information"
							style={{ color: 'var(--ping-info-color, #3b82f6)' }}
						/>
						<span
							style={{
								fontSize: '0.875rem',
								fontWeight: 600,
								color: 'var(--ping-text-primary, #1a1a1a)',
							}}
						>
							Learn More
						</span>
					</div>
					<div
						style={{
							fontSize: '0.813rem',
							color: 'var(--ping-text-secondary, #6b7280)',
							lineHeight: '1.5',
						}}
					>
						{specVersion === 'oidc'
							? 'OpenID Connect extends OAuth 2.0 with identity verification, providing ID tokens and user information.'
							: 'OAuth 2.0 provides secure authorization flows for applications to access protected resources on behalf of users.'}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FlowGuidanceSystemPingUI;
