/**
 * @file V9ModernMessagingComponents.tsx
 * @module components/v9
 * @description V9 Modern Messaging UI Components
 * @version 9.0.0
 * @since 2026-03-02
 *
 * UI components for V9 Modern Messaging system:
 * - WaitScreen for blocking operations
 * - Banner for persistent context/warnings
 * - CriticalError for error display with guidance
 * - FooterMessage for status updates
 */

import React from 'react';
import styled from 'styled-components';

// MDI Icon Component for React Icons migration
const MDIIcon: React.FC<{ icon: string; size?: number; className?: string }> = ({ 
	icon, 
	size = 16, 
	className = '' 
}) => {
	const iconMap: Record<string, string> = {
		'FiAlertCircle': 'mdi-alert-circle',
		'FiAlertTriangle': 'mdi-alert-triangle',
		'FiCheckCircle': 'mdi-check-circle',
		'FiInfo': 'mdi-information',
		'FiLoader': 'mdi-loading',
		'FiPhone': 'mdi-phone',
		'FiX': 'mdi-close',
	};
	
	const mdiIcon = iconMap[icon] || 'mdi-help';
	
	return (
		<i 
			className={`mdi ${mdiIcon} ${className}`}
			style={{ fontSize: `${size}px` }}
		></i>
	);
};
import {
	type BannerConfig,
	type CriticalErrorConfig,
	type FooterMessageConfig,
	useModernMessaging,
	type WaitScreenConfig,
} from '../../services/v9/V9ModernMessagingService';

// V9 Color Standards
const V9_COLORS = {
	PRIMARY_BLUE: '#2563eb',
	DARK_BLUE: '#1e40af',
	RED: '#dc2626',
	LIGHT_RED_BG: '#fef2f2',
	LIGHT_RED_BORDER: '#fecaca',
	ORANGE: '#f59e0b',
	LIGHT_ORANGE_BG: '#fffbeb',
	LIGHT_ORANGE_BORDER: '#fed7aa',
	GREEN: '#10b981',
	LIGHT_GREEN_BG: '#f0fdf4',
	LIGHT_GREEN_BORDER: '#bbf7d0',
	BLUE: '#3b82f6',
	LIGHT_BLUE_BG: '#eff6ff',
	LIGHT_BLUE_BORDER: '#bfdbfe',
	GRAY: '#6b7280',
	LIGHT_GRAY_BG: '#f9fafb',
	LIGHT_GRAY_BORDER: '#e5e7eb',
	BLACK: '#000000',
	WHITE: '#ffffff',
};

// Wait Screen Component
const WaitScreenOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(2px);
`;

const WaitScreenContent = styled.div`
	background: ${V9_COLORS.WHITE};
	padding: 2rem;
	border-radius: 1rem;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	max-width: 400px;
	text-align: center;
`;

const WaitScreenIcon = styled.div`
	margin-bottom: 1rem;
`;

const WaitScreenTitle = styled.h3`
	margin: 0 0 0.5rem 0;
	color: ${V9_COLORS.BLACK};
	font-size: 1.25rem;
	font-weight: 600;
`;

const WaitScreenMessage = styled.p`
	margin: 0 0 1rem 0;
	color: ${V9_COLORS.GRAY};
	font-size: 0.875rem;
	line-height: 1.5;
`;

const WaitScreenCancelButton = styled.button`
	background: ${V9_COLORS.LIGHT_GRAY_BG};
	color: ${V9_COLORS.GRAY};
	border: 1px solid ${V9_COLORS.LIGHT_GRAY_BORDER};
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: ${V9_COLORS.GRAY};
		color: ${V9_COLORS.WHITE};
	}
`;

// Banner Component
const BannerContainer = styled.div<{ $type: BannerConfig['type'] }>`
	padding: 1rem;
	border-radius: 0.75rem;
	margin-bottom: 1rem;
	border: 1px solid;
	
	${(props) => {
		switch (props.$type) {
			case 'error':
				return `
					background: ${V9_COLORS.LIGHT_RED_BG};
					border-color: ${V9_COLORS.LIGHT_RED_BORDER};
					color: ${V9_COLORS.RED};
				`;
			case 'warning':
				return `
					background: ${V9_COLORS.LIGHT_ORANGE_BG};
					border-color: ${V9_COLORS.LIGHT_ORANGE_BORDER};
					color: ${V9_COLORS.ORANGE};
				`;
			case 'success':
				return `
					background: ${V9_COLORS.LIGHT_GREEN_BG};
					border-color: ${V9_COLORS.LIGHT_GREEN_BORDER};
					color: ${V9_COLORS.GREEN};
				`;
			default:
				return `
					background: ${V9_COLORS.LIGHT_BLUE_BG};
					border-color: ${V9_COLORS.LIGHT_BLUE_BORDER};
					color: ${V9_COLORS.BLUE};
				`;
		}
	}}
`;

const BannerHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
`;

const BannerTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	font-size: 0.875rem;
`;

const BannerMessage = styled.div`
	font-size: 0.875rem;
	line-height: 1.5;
	margin-bottom: 0.5rem;
`;

const BannerActions = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 0.75rem;
`;

const BannerButton = styled.button<{ $variant?: 'primary' | 'secondary' | undefined }>`
	padding: 0.375rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.75rem;
	font-weight: 500;
	cursor: pointer;
	border: 1px solid;
	transition: all 0.2s;

	${(props) => {
		if (props.$variant === 'primary') {
			return `
				background: ${V9_COLORS.PRIMARY_BLUE};
				color: ${V9_COLORS.WHITE};
				border-color: ${V9_COLORS.PRIMARY_BLUE};
				&:hover {
					background: ${V9_COLORS.DARK_BLUE};
				}
			`;
		} else {
			return `
				background: transparent;
				border-color: currentColor;
				&:hover {
					background: rgba(0, 0, 0, 0.05);
				}
			`;
		}
	}}
`;

// Critical Error Component
const CriticalErrorContainer = styled.div`
	background: ${V9_COLORS.LIGHT_RED_BG};
	border: 2px solid ${V9_COLORS.RED};
	border-radius: 1rem;
	padding: 2rem;
	margin: 1rem 0;
`;

const CriticalErrorHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 1rem;
`;

const CriticalErrorTitle = styled.h2`
	margin: 0;
	color: ${V9_COLORS.RED};
	font-size: 1.5rem;
	font-weight: 700;
`;

const CriticalErrorMessage = styled.p`
	margin: 0 0 1.5rem 0;
	color: ${V9_COLORS.BLACK};
	font-size: 1rem;
	line-height: 1.6;
`;

const CriticalErrorDetails = styled.details`
	margin-bottom: 1.5rem;
	
	summary {
		cursor: pointer;
		font-weight: 500;
		color: ${V9_COLORS.GRAY};
		margin-bottom: 0.5rem;
		
		&:hover {
			color: ${V9_COLORS.BLACK};
		}
	}
	
	pre {
		background: ${V9_COLORS.LIGHT_GRAY_BG};
		padding: 1rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		overflow-x: auto;
		color: ${V9_COLORS.BLACK};
	}
`;

const CriticalErrorActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
`;

const CriticalErrorAction = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem;
	background: ${V9_COLORS.WHITE};
	border-radius: 0.5rem;
	border: 1px solid ${V9_COLORS.LIGHT_GRAY_BORDER};
`;

const CriticalErrorActionContent = styled.div`
	flex: 1;
`;

const CriticalErrorActionTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.25rem;
`;

const CriticalErrorActionDescription = styled.div`
	font-size: 0.875rem;
	color: ${V9_COLORS.GRAY};
`;

const CriticalErrorActionButton = styled.button`
	background: ${V9_COLORS.PRIMARY_BLUE};
	color: ${V9_COLORS.WHITE};
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	white-space: nowrap;

	&:hover {
		background: ${V9_COLORS.DARK_BLUE};
	}
`;

const SupportSection = styled.div`
	margin-top: 1.5rem;
	padding-top: 1.5rem;
	border-top: 1px solid ${V9_COLORS.LIGHT_RED_BORDER};
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: ${V9_COLORS.GRAY};
	font-size: 0.875rem;
`;

// Footer Message Component
const FooterMessageContainer = styled.div<{ $type: FooterMessageConfig['type'] }>`
	padding: 0.75rem 1rem;
	border-radius: 0.5rem;
	margin-top: 1rem;
	font-size: 0.875rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	${(props) => {
		switch (props.$type) {
			case 'progress':
				return `
					background: ${V9_COLORS.LIGHT_BLUE_BG};
					color: ${V9_COLORS.BLUE};
				`;
			case 'status':
				return `
					background: ${V9_COLORS.LIGHT_GRAY_BG};
					color: ${V9_COLORS.GRAY};
				`;
			default:
				return `
					background: ${V9_COLORS.LIGHT_BLUE_BG};
					color: ${V9_COLORS.BLUE};
				`;
		}
	}}
`;

// Individual Components
export const WaitScreen: React.FC<{ config: WaitScreenConfig }> = ({ config }) => {
	return (
		<WaitScreenOverlay>
			<WaitScreenContent>
				<WaitScreenIcon>
					<MDIIcon icon="FiLoader" size={48} className="animate-spin" style={{ color: V9_COLORS.PRIMARY_BLUE }} />
				</WaitScreenIcon>
				<WaitScreenTitle>{config.message}</WaitScreenTitle>
				{config.detail && <WaitScreenMessage>{config.detail}</WaitScreenMessage>}
				{config.allowCancel && config.onCancel && (
					<WaitScreenCancelButton onClick={config.onCancel}>Cancel</WaitScreenCancelButton>
				)}
			</WaitScreenContent>
		</WaitScreenOverlay>
	);
};

export const Banner: React.FC<{ config: BannerConfig }> = ({ config }) => {
	const getIcon = () => {
		switch (config.type) {
			case 'error':
				return <MDIIcon icon="FiAlertCircle" size={16} />;
			case 'warning':
				return <MDIIcon icon="FiAlertTriangle" size={16} />;
			case 'success':
				return <MDIIcon icon="FiCheckCircle" size={16} />;
			default:
				return <MDIIcon icon="FiInfo" size={16} />;
		}
	};

	return (
		<BannerContainer $type={config.type}>
			<BannerHeader>
				<BannerTitle>
					{getIcon()}
					{config.title}
				</BannerTitle>
				{config.dismissible && (
					<MDIIcon icon="FiX" size={16} style={{ cursor: 'pointer' }} onClick={config.onDismiss} />
				)}
			</BannerHeader>
			<BannerMessage>{config.message}</BannerMessage>
			{config.actions && config.actions.length > 0 && (
				<BannerActions>
					{config.actions.map((action, index) => (
						<BannerButton key={index} $variant={action.variant} onClick={action.action}>
							{action.label}
						</BannerButton>
					))}
				</BannerActions>
			)}
		</BannerContainer>
	);
};

export const CriticalError: React.FC<{ config: CriticalErrorConfig }> = ({ config }) => {
	return (
		<CriticalErrorContainer>
			<CriticalErrorHeader>
				<MDIIcon icon="FiAlertCircle" size={32} style={{ color: V9_COLORS.RED }} />
				<CriticalErrorTitle>{config.title}</CriticalErrorTitle>
			</CriticalErrorHeader>
			<CriticalErrorMessage>{config.message}</CriticalErrorMessage>

			{config.technicalDetails && (
				<CriticalErrorDetails>
					<summary>Technical Details</summary>
					<pre>{config.technicalDetails}</pre>
				</CriticalErrorDetails>
			)}

			{config.recoveryActions && config.recoveryActions.length > 0 && (
				<CriticalErrorActions>
					{config.recoveryActions.map((action, index) => (
						<CriticalErrorAction key={index}>
							<CriticalErrorActionContent>
								<CriticalErrorActionTitle>{action.label}</CriticalErrorActionTitle>
								{action.instructions && (
									<CriticalErrorActionDescription>
										{action.instructions}
									</CriticalErrorActionDescription>
								)}
							</CriticalErrorActionContent>
							<CriticalErrorActionButton onClick={action.action}>
								{action.label}
							</CriticalErrorActionButton>
						</CriticalErrorAction>
					))}
				</CriticalErrorActions>
			)}

			{config.contactSupport && (
				<SupportSection>
					<MDIIcon icon="FiPhone" size={16} />
					<span>If this problem persists, contact support for assistance.</span>
				</SupportSection>
			)}
		</CriticalErrorContainer>
	);
};

export const FooterMessage: React.FC<{ config: FooterMessageConfig }> = ({ config }) => {
	const getIcon = () => {
		switch (config.type) {
			case 'progress':
				return <MDIIcon icon="FiLoader" size={14} className="animate-spin" />;
			case 'status':
				return <MDIIcon icon="FiCheckCircle" size={14} />;
			default:
				return <MDIIcon icon="FiInfo" size={14} />;
		}
	};

	return (
		<FooterMessageContainer $type={config.type}>
			{getIcon()}
			<span>{config.message}</span>
		</FooterMessageContainer>
	);
};

// Main Modern Messaging Provider Component
export const V9ModernMessagingProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [messageState] = useModernMessaging();

	return (
		<>
			{children}

			{messageState.waitScreen && <WaitScreen config={messageState.waitScreen} />}

			{messageState.banner && <Banner config={messageState.banner} />}

			{messageState.criticalError && <CriticalError config={messageState.criticalError} />}

			{messageState.footerMessage && <FooterMessage config={messageState.footerMessage} />}
		</>
	);
};

// Export hook and service for convenience
export { modernMessaging, useModernMessaging } from '../../services/v9/V9ModernMessagingService';
