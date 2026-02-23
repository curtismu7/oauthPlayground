/**
 * @file TokenOperationsEducationModalV8.tsx
 * @module v8/components
 * @description Educational modal explaining token introspection and UserInfo rules
 * @version 8.0.0
 * @since 2024-11-21
 *
 * Features:
 * - Flow-specific rules for introspection and UserInfo
 * - Visual indicators (✅/❌) for what's allowed
 * - Educational content with examples
 * - Simple, user-friendly explanations
 *
 * @example
 * <TokenOperationsEducationModalV8
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   flowType="oauth-authz"
 *   scopes="openid profile email"
 * />
 */

import React from 'react';
import { FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi';
import { TokenOperationsServiceV8 } from '@/v8/services/tokenOperationsServiceV8';

interface TokenOperationsEducationModalV8Props {
	isOpen: boolean;
	onClose: () => void;
	flowType: string;
	scopes?: string;
}

export const TokenOperationsEducationModalV8: React.FC<TokenOperationsEducationModalV8Props> = ({
	isOpen,
	onClose,
	flowType,
	scopes,
}) => {
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

	if (!isOpen) return null;

	const rules = TokenOperationsServiceV8.getOperationRules(flowType, scopes);
	const introspectionContent = TokenOperationsServiceV8.getEducationalContent('introspection');
	const userInfoContent = TokenOperationsServiceV8.getEducationalContent('userinfo');

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				aria-label="Close modal"
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 9998,
					backdropFilter: 'blur(4px)',
					border: 'none',
					padding: 0,
					margin: 0,
					cursor: 'pointer',
				}}
				onClick={onClose}
				onKeyDown={(e: React.KeyboardEvent) => {
					if (e.key === 'Enter' || e.key === ' ') {
						onClose();
					}
				}}
			/>

			{/* Modal */}
			<div
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: '#ffffff', // Light background for dark text
					borderRadius: '12px',
					boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
					zIndex: 9999,
					maxWidth: '800px',
					width: '90%',
					maxHeight: '85vh',
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
						padding: '20px 24px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: '1px solid #e5e7eb',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
						<FiInfo size={24} style={{ color: '#ffffff' }} />
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#ffffff' }}>
							Token Operations Guide
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: 'rgba(255, 255, 255, 0.2)',
							border: 'none',
							borderRadius: '6px',
							padding: '8px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'background 0.2s',
							color: '#ffffff',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
						}}
						aria-label="Close modal"
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				<div
					style={{
						padding: '20px 24px',
						overflowY: 'auto',
						flex: 1,
						minHeight: 0,
					}}
				>
					{/* Current Flow Summary */}
					<div
						style={{
							background: '#f0f9ff', // Light blue background
							border: '2px solid #0ea5e9',
							borderRadius: '6px',
							padding: '12px',
							marginBottom: '16px',
						}}
					>
						<h3
							style={{
								margin: '0 0 8px 0',
								fontSize: '15px',
								fontWeight: '600',
								color: '#0c4a6e', // Dark blue text on light background
							}}
						>
							📋 Your Current Flow
						</h3>
						<div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
								<span style={{ fontWeight: '600', color: '#0c4a6e' }}>Flow:</span>
								<span style={{ color: '#0c4a6e' }}>{flowType}</span>
							</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
								<span style={{ fontWeight: '600', color: '#0c4a6e' }}>Scopes:</span>
								<span style={{ color: '#0c4a6e' }}>{scopes || 'None'}</span>
							</div>
						</div>
					</div>

					{/* What You Can Do */}
					<div style={{ marginBottom: '16px' }}>
						<h3
							style={{
								margin: '0 0 10px 0',
								fontSize: '16px',
								fontWeight: '600',
								color: '#1f2937', // Dark text on light background
							}}
						>
							✨ What You Can Do
						</h3>

						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{/* Introspect Access Token */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
									padding: '10px',
									background: rules.canIntrospectAccessToken ? '#f0fdf4' : '#fef2f2', // Light green or light red
									borderRadius: '6px',
									border: `1px solid ${rules.canIntrospectAccessToken ? '#86efac' : '#fecaca'}`,
								}}
							>
								{rules.canIntrospectAccessToken ? (
									<FiCheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
								) : (
									<FiXCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
								)}
								<div style={{ flex: 1, fontSize: '13px' }}>
									<span style={{ fontWeight: '600', color: '#1f2937' }}>
										Introspect Access Token
									</span>
									<span style={{ color: '#6b7280', marginLeft: '6px' }}>
										{rules.canIntrospectAccessToken
											? '- Verify validity & permissions'
											: '- Not available'}
									</span>
								</div>
							</div>

							{/* Introspect Refresh Token */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
									padding: '10px',
									background: rules.canIntrospectRefreshToken ? '#f0fdf4' : '#fef2f2',
									borderRadius: '6px',
									border: `1px solid ${rules.canIntrospectRefreshToken ? '#86efac' : '#fecaca'}`,
								}}
							>
								{rules.canIntrospectRefreshToken ? (
									<FiCheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
								) : (
									<FiXCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
								)}
								<div style={{ flex: 1, fontSize: '13px' }}>
									<span style={{ fontWeight: '600', color: '#1f2937' }}>
										Introspect Refresh Token
									</span>
									<span style={{ color: '#6b7280', marginLeft: '6px' }}>
										{rules.canIntrospectRefreshToken ? '- Check token status' : '- Not available'}
									</span>
								</div>
							</div>

							{/* Call UserInfo */}
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
									padding: '10px',
									background: rules.canCallUserInfo ? '#f0fdf4' : '#fef2f2',
									borderRadius: '6px',
									border: `1px solid ${rules.canCallUserInfo ? '#86efac' : '#fecaca'}`,
								}}
							>
								{rules.canCallUserInfo ? (
									<FiCheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
								) : (
									<FiXCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
								)}
								<div style={{ flex: 1, fontSize: '13px' }}>
									<span style={{ fontWeight: '600', color: '#1f2937' }}>
										Call UserInfo Endpoint
									</span>
									<span style={{ color: '#6b7280', marginLeft: '6px' }}>
										{rules.canCallUserInfo
											? '- Get user profile claims'
											: `- ${rules.userInfoReason.split('.')[0]}`}
									</span>
								</div>
							</div>
						</div>
					</div>

					{/* Token Introspection Details */}
					<div
						style={{
							marginBottom: '12px',
							padding: '12px',
							background: '#f9fafb', // Light grey background
							borderRadius: '6px',
							border: '1px solid #e5e7eb',
						}}
					>
						<h4
							style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}
						>
							🔍 {introspectionContent.title}
						</h4>
						<p
							style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.5', color: '#4b5563' }}
						>
							{introspectionContent.description}
						</p>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '12px',
								fontSize: '12px',
							}}
						>
							<div>
								<div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
									When to use:
								</div>
								<ul style={{ margin: 0, paddingLeft: '16px', color: '#4b5563' }}>
									{introspectionContent.whenToUse.slice(0, 2).map((item, index) => (
										<li key={index} style={{ marginBottom: '2px' }}>
											{item}
										</li>
									))}
								</ul>
							</div>
							<div>
								<div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
									Common mistakes:
								</div>
								<ul style={{ margin: 0, paddingLeft: '16px', color: '#4b5563' }}>
									{introspectionContent.commonMistakes.slice(0, 2).map((item, index) => (
										<li key={index} style={{ marginBottom: '2px' }}>
											{item}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>

					{/* UserInfo Details */}
					<div
						style={{
							padding: '12px',
							background: '#f9fafb',
							borderRadius: '6px',
							border: '1px solid #e5e7eb',
							marginBottom: '12px',
						}}
					>
						<h4
							style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}
						>
							👤 {userInfoContent.title}
						</h4>
						<p
							style={{ margin: '0 0 8px 0', fontSize: '12px', lineHeight: '1.5', color: '#4b5563' }}
						>
							{userInfoContent.description}
						</p>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '12px',
								fontSize: '12px',
							}}
						>
							<div>
								<div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
									When to use:
								</div>
								<ul style={{ margin: 0, paddingLeft: '16px', color: '#4b5563' }}>
									{userInfoContent.whenToUse.slice(0, 2).map((item, index) => (
										<li key={index} style={{ marginBottom: '2px' }}>
											{item}
										</li>
									))}
								</ul>
							</div>
							<div>
								<div style={{ fontWeight: '600', marginBottom: '4px', color: '#1f2937' }}>
									Common mistakes:
								</div>
								<ul style={{ margin: 0, paddingLeft: '16px', color: '#4b5563' }}>
									{userInfoContent.commonMistakes.slice(0, 2).map((item, index) => (
										<li key={index} style={{ marginBottom: '2px' }}>
											{item}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>

					{/* Learn More Section */}
					<div
						style={{
							padding: '10px 12px',
							background: '#f0f9ff', // Light blue background
							borderRadius: '6px',
							border: '1px solid #0ea5e9',
						}}
					>
						<h4
							style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '600', color: '#1f2937' }}
						>
							📖 Learn More
						</h4>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: '6px',
								fontSize: '12px',
							}}
						>
							<a
								href="https://tools.ietf.org/html/rfc7662"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: '#0ea5e9',
									textDecoration: 'none',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									transition: 'color 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#0284c7';
									e.currentTarget.style.textDecoration = 'underline';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = '#0ea5e9';
									e.currentTarget.style.textDecoration = 'none';
								}}
							>
								<span>🔗</span>
								<span>RFC 7662 - Token Introspection</span>
							</a>
							<a
								href="https://openid.net/specs/openid-connect-core-1_0.html#UserInfo"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: '#0ea5e9',
									textDecoration: 'none',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									transition: 'color 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#0284c7';
									e.currentTarget.style.textDecoration = 'underline';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = '#0ea5e9';
									e.currentTarget.style.textDecoration = 'none';
								}}
							>
								<span>🔗</span>
								<span>OIDC Core - UserInfo</span>
							</a>
							<a
								href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: '#0ea5e9',
									textDecoration: 'none',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									transition: 'color 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#0284c7';
									e.currentTarget.style.textDecoration = 'underline';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = '#0ea5e9';
									e.currentTarget.style.textDecoration = 'none';
								}}
							>
								<span>🔗</span>
								<span>OAuth 2.0 Security BCP</span>
							</a>
							<a
								href="https://www.w3.org/WAI/WCAG2AA-Conformance"
								target="_blank"
								rel="noopener noreferrer"
								style={{
									color: '#0ea5e9',
									textDecoration: 'none',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									transition: 'color 0.2s',
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.color = '#0284c7';
									e.currentTarget.style.textDecoration = 'underline';
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.color = '#0ea5e9';
									e.currentTarget.style.textDecoration = 'none';
								}}
							>
								<span>🔗</span>
								<span>WCAG 2.1 Level AA</span>
							</a>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						padding: '16px 24px',
						borderTop: '1px solid #e5e7eb',
						display: 'flex',
						justifyContent: 'flex-end',
						background: '#f9fafb', // Light grey background
					}}
				>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: '#0ea5e9',
							color: '#ffffff', // White text on blue button
							border: 'none',
							borderRadius: '6px',
							padding: '10px 24px',
							fontSize: '14px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 0.2s',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#0284c7';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#0ea5e9';
						}}
					>
						Got It!
					</button>
				</div>
			</div>
		</>
	);
};

export default TokenOperationsEducationModalV8;
