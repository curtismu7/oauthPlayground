/**
 * @file FlowNotAvailableModal.tsx
 * @module v8u/components
 * @description Modal to inform user when selected flow is not available for the spec version
 * @version 8.0.0
 * @since 2024-11-19
 */

import React from 'react';
import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import { SpecVersionServiceV8 } from '@/v8/services/specVersionServiceV8';
import { logger } from '@/v8u/services/unifiedFlowLoggerServiceV8U';

interface FlowNotAvailableModalProps {
	isOpen: boolean;
	onClose: () => void;
	requestedFlow: FlowType;
	specVersion: SpecVersion;
	fallbackFlow: FlowType;
	onAccept: () => void;
	onChangeSpec: () => void;
}

const _MODULE_TAG = '[🚫 FLOW-NOT-AVAILABLE-MODAL-V8U]';

export const FlowNotAvailableModal: React.FC<FlowNotAvailableModalProps> = ({
	isOpen,
	onClose,
	requestedFlow,
	specVersion,
	fallbackFlow,
	onAccept,
	onChangeSpec,
}) => {
	if (!isOpen) return null;

	const requestedFlowLabel = SpecVersionServiceV8.getFlowLabel(requestedFlow);
	const specLabel = SpecVersionServiceV8.getSpecLabel(specVersion);
	const fallbackFlowLabel = SpecVersionServiceV8.getFlowLabel(fallbackFlow);

	// CRITICAL: Log the actual spec version being used to debug modal issues
	logger.debug(Modal rendering`, {
		requestedFlow,
		specVersion,
		specLabel,
		fallbackFlow,
		isOpen,
	});

	// Get reason why flow is not available
	const getReason = (): string => {
		// OAuth 2.1 specific restrictions
		if (specVersion === 'oauth2.1') {
			if (requestedFlow === 'implicit') {
				return 'The Implicit Flow has been removed from OAuth 2.1 due to security concerns. OAuth 2.1 requires PKCE for public clients instead.';
			}
			if (requestedFlow === 'ropc') {
				return 'The Resource Owner Password Credentials (ROPC) flow has been removed from OAuth 2.1 due to security concerns. Use Authorization Code with PKCE instead.';
			}
			if (requestedFlow === 'hybrid') {
				return 'The Hybrid Flow is not part of the OAuth 2.1 specification. Use Authorization Code with PKCE instead.';
			}
		}

		// OIDC specific restrictions
		if (specVersion === 'oidc') {
			if (requestedFlow === 'client-credentials') {
				return 'Client Credentials Flow is not part of OpenID Connect. OIDC is for user authentication, while Client Credentials is for machine-to-machine communication with no user involved.';
			}
		}

		// OAuth 2.0 specific restrictions
		if (specVersion === 'oauth2.0') {
			if (requestedFlow === 'hybrid') {
				return 'Hybrid Flow is an OpenID Connect flow, not part of OAuth 2.0. Use OIDC spec version for Hybrid Flow.';
			}
		}

		return `The ${requestedFlowLabel} is not supported in ${specLabel}.`;
	};

	const getRecommendation = (): string => {
		if (specVersion === 'oauth2.1') {
			if (requestedFlow === 'implicit' || requestedFlow === 'ropc') {
				return 'For public clients (SPAs, mobile apps), use Authorization Code Flow with PKCE, which provides better security.';
			}
		}
		return `We recommend using ${fallbackFlowLabel} for ${specLabel}.`;
	};

	logger.debug(Modal opened`, {
		requestedFlow,
		specVersion,
		fallbackFlow,
	});

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="flow-not-available-title"
			style={{
				display: isOpen ? 'flex' : 'none',
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.6)',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 10000,
				padding: '20px',
			}}
			onClick={onClose}
			onKeyDown={(e) => {
				if (e.key === 'Escape') {
					onClose();
				}
			}}
		>
			<div
				style={{
					backgroundColor: 'white',
					borderRadius: '12px',
					padding: '32px',
					maxWidth: '600px',
					width: '100%',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					position: 'relative',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div style={{ textAlign: 'center', marginBottom: '24px' }}>
					<div style={{ fontSize: '64px', marginBottom: '16px' }}>🚫</div>
					<h2
						id="flow-not-available-title"
						style={{
							margin: 0,
							fontSize: '28px',
							fontWeight: '700',
							color: '#dc2626', // Red for error
						}}
					>
						Flow Not Available
					</h2>
				</div>

				{/* Message */}
				<div
					style={{
						marginBottom: '24px',
						padding: '20px',
						background: '#fef2f2', // Light red background
						borderRadius: '8px',
						border: '2px solid #fecaca',
					}}
				>
					<div
						style={{
							fontSize: '16px',
							fontWeight: '600',
							color: '#991b1b',
							marginBottom: '12px',
						}}
					>
						{requestedFlowLabel} is not supported in {specLabel}
					</div>
					<div
						style={{
							fontSize: '14px',
							color: '#7f1d1d',
							lineHeight: '1.6',
							marginBottom: '12px',
						}}
					>
						{getReason()}
					</div>
					<div
						style={{
							fontSize: '14px',
							color: '#7f1d1d',
							lineHeight: '1.6',
							fontWeight: '500',
						}}
					>
						{getRecommendation()}
					</div>
				</div>

				{/* Available Flows Info */}
				<div
					style={{
						marginBottom: '24px',
						padding: '16px',
						background: '#f0f9ff', // Light blue background
						borderRadius: '8px',
						border: '1px solid #bae6fd',
					}}
				>
					<div
						style={{
							fontSize: '14px',
							fontWeight: '600',
							color: '#0c4a6e',
							marginBottom: '8px',
						}}
					>
						Available flows for {specLabel}:
					</div>
					<div style={{ fontSize: '13px', color: '#075985', lineHeight: '1.8' }}>
						{SpecVersionServiceV8.getAvailableFlows(specVersion)
							.map((flow) => SpecVersionServiceV8.getFlowLabel(flow))
							.join(', ')}
					</div>
				</div>

				{/* Actions */}
				<div
					style={{
						display: 'flex',
						gap: '12px',
						flexDirection: 'column',
					}}
				>
					{/* Primary action: Use fallback flow */}
					<button
						type="button"
						onClick={() => {
							logger.debug(User accepted fallback flow`, { fallbackFlow });
							onAccept();
							onClose();
						}}
						style={
							padding: '14px 24px',
							background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',}
						onMouseEnter={(_e) => {
							e.currentTarget.style.transform = 'translateY(-1px)';
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = 'none';
						}}
					>
						✅ Use {fallbackFlowLabel} Instead
					</button>

					{/* Secondary action: Change spec version */}
					<button
						type="button"
						onClick={() => {
							logger.debug(User wants to change spec version`);
							onChangeSpec();
							onClose();
						}}
						style={{
							padding: '14px 24px',
							background: 'white',
							color: '#3b82f6',
							border: '2px solid #3b82f6',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#eff6ff';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'white';
						}}
					>
						🔄 Change Spec Version
					</button>

					{/* Tertiary action: Cancel */}
					<button
						type="button"
						onClick={() => {
							logger.debug(User cancelled`);
							onClose();
						}}
						style={{
							padding: '12px 24px',
							background: 'transparent',
							color: '#6b7280',
							border: 'none',
							borderRadius: '8px',
							fontSize: '14px',
							fontWeight: '500',
							cursor: 'pointer',
							transition: 'all 0.2s ease',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'transparent';
						}}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};
