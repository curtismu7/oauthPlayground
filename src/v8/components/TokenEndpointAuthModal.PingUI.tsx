/**
 * @file TokenEndpointAuthModal.PingUI.tsx
 * @module v8/components
 * @description PingOne UI version of Educational modal explaining PingOne Token Endpoint Authentication Methods
 * @version 8.0.0-PingUI
 * @since 2024-11-20
 *
 * PingOne UI migration following pingui2.md standards:
 * - Added .end-user-nano namespace wrapper
 * - Replaced React Icons with MDI CSS icons
 * - Applied Ping UI CSS variables and transitions
 * - Enhanced accessibility with proper ARIA labels
 * - Used 0.15s ease-in-out transitions
 */

import React from 'react';

// PingOne UI Icon Component
const MDIIcon: React.FC<{
	icon: string;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	title?: string;
}> = ({ icon, size = 24, className = '', style, title }) => {
	return (
		<span
			className={`mdi mdi-${icon} ${className}`}
			style={{ fontSize: `${size}px`, ...style }}
			title={title}
		/>
	);
};

interface TokenEndpointAuthModalProps {
	isOpen: boolean;
	onClose: () => void;
}

// PingOne UI Helper Functions
const getOverlayStyle = (isOpen: boolean): React.CSSProperties => ({
	display: isOpen ? 'flex' : 'none',
	position: 'fixed',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	background: 'rgba(0, 0, 0, 0.5)',
	alignItems: 'center',
	justifyContent: 'center',
	zIndex: 1000,
	padding: 'var(--ping-spacing-lg, 1rem)',
});

const getModalContainerStyle = (): React.CSSProperties => ({
	background: 'var(--ping-secondary-color, white)',
	borderRadius: 'var(--ping-border-radius-lg, 1rem)',
	maxWidth: '900px',
	width: '100%',
	maxHeight: '90vh',
	overflowY: 'auto',
	boxShadow: 'var(--ping-shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.3))',
});

const getModalHeaderStyle = (): React.CSSProperties => ({
	background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
	color: 'white',
	padding: 'var(--ping-spacing-xl, 1.5rem)',
	borderRadius: 'var(--ping-border-radius-lg, 1rem) var(--ping-border-radius-lg, 1rem) 0 0',
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
});

const getModalTitleStyle = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--ping-spacing-sm, 0.5rem)',
	fontSize: 'var(--ping-font-size-lg, 1.25rem)',
	fontWeight: '600',
	margin: 0,
});

const getCloseButtonStyle = (): React.CSSProperties => ({
	background: 'none',
	border: 'none',
	color: 'white',
	cursor: 'pointer',
	padding: 'var(--ping-spacing-sm, 0.25rem)',
	borderRadius: 'var(--ping-border-radius-sm, 0.25rem)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
});

const getModalContentStyle = (): React.CSSProperties => ({
	padding: 'var(--ping-spacing-xl, 1.5rem)',
});

const getSectionStyle = (): React.CSSProperties => ({
	marginBottom: 'var(--ping-spacing-xl, 1.5rem)',
});

const getSectionTitleStyle = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--ping-spacing-sm, 0.5rem)',
	fontSize: 'var(--ping-font-size-lg, 1.125rem)',
	fontWeight: '600',
	color: 'var(--ping-text-color, #1f2937)',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
});

const getInfoBoxStyle = (variant: 'info' | 'warning'): React.CSSProperties => ({
	background:
		variant === 'info' ? 'var(--ping-info-bg, #dbeafe)' : 'var(--ping-warning-bg, #fef3c7)',
	border: `1px solid ${
		variant === 'info' ? 'var(--ping-info-border, #3b82f6)' : 'var(--ping-warning-border, #f59e0b)'
	}`,
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	padding: 'var(--ping-spacing-md, 1rem)',
	display: 'flex',
	gap: 'var(--ping-spacing-sm, 0.75rem)',
	alignItems: 'flex-start',
	color:
		variant === 'info' ? 'var(--ping-info-text, #1e40af)' : 'var(--ping-warning-text, #92400e)',
});

const getMethodCardStyle = (): React.CSSProperties => ({
	background: 'var(--ping-surface-color, #f9fafb)',
	border: '1px solid var(--ping-border-color, #e5e7eb)',
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	padding: 'var(--ping-spacing-lg, 1rem)',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
	transition: 'var(--ping-transition-fast, 0.15s ease-in-out)',
});

const getMethodHeaderStyle = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--ping-spacing-sm, 0.5rem)',
	fontWeight: '600',
	marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
});

const getMethodNameStyle = (): React.CSSProperties => ({
	fontSize: 'var(--ping-font-size-base, 1rem)',
	margin: 0,
});

const getMethodDescriptionStyle = (): React.CSSProperties => ({
	color: 'var(--ping-text-secondary, #6b7280)',
	lineHeight: '1.6',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
});

const getCodeExampleStyle = (): React.CSSProperties => ({
	background: 'var(--ping-code-bg, #1f2937)',
	color: 'var(--ping-code-text, #f3f4f6)',
	padding: 'var(--ping-spacing-md, 1rem)',
	borderRadius: 'var(--ping-border-radius-sm, 0.375rem)',
	fontFamily: 'monospace',
	fontSize: 'var(--ping-font-size-sm, 0.875rem)',
	overflowX: 'auto',
	whiteSpace: 'pre-wrap',
	wordBreak: 'break-all',
});

const getTableStyle = (): React.CSSProperties => ({
	width: '100%',
	borderCollapse: 'collapse',
	marginTop: 'var(--ping-spacing-md, 1rem)',
});

const getTableHeaderStyle = (): React.CSSProperties => ({
	background: 'var(--ping-table-header-bg, #f3f4f6)',
	fontWeight: '600',
	textAlign: 'left',
	padding: 'var(--ping-spacing-sm, 0.75rem)',
	border: '1px solid var(--ping-border-color, #e5e7eb)',
});

const getTableCellStyle = (): React.CSSProperties => ({
	padding: 'var(--ping-spacing-sm, 0.75rem)',
	border: '1px solid var(--ping-border-color, #e5e7eb)',
});

const getRecommendationCardStyle = (): React.CSSProperties => ({
	background: 'var(--ping-success-bg, #f0fdf4)',
	border: '1px solid var(--ping-success-border, #10b981)',
	borderRadius: 'var(--ping-border-radius-md, 0.5rem)',
	padding: 'var(--ping-spacing-md, 1rem)',
	marginBottom: 'var(--ping-spacing-md, 1rem)',
});

const getRecommendationTitleStyle = (): React.CSSProperties => ({
	fontWeight: '600',
	color: 'var(--ping-success-text, #059669)',
	marginBottom: 'var(--ping-spacing-sm, 0.5rem)',
});

const getRecommendationTextStyle = (): React.CSSProperties => ({
	color: 'var(--ping-text-secondary, #6b7280)',
	lineHeight: '1.6',
});

export const TokenEndpointAuthModalPingUI: React.FC<TokenEndpointAuthModalProps> = ({
	isOpen,
	onClose,
}) => {
	// Handle ESC key to close modal
	React.useEffect(() => {
		if (!isOpen) return undefined;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="end-user-nano">
			<div
				style={getOverlayStyle(isOpen)}
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						onClose();
					}
				}}
				role="dialog"
				aria-modal="true"
				aria-labelledby="token-auth-modal-title"
			>
				<main
					style={getModalContainerStyle()}
					onClick={(e) => e.stopPropagation()}
					role="document"
					tabIndex={-1}
				>
					<div style={getModalHeaderStyle()}>
						<h2 id="token-auth-modal-title" style={getModalTitleStyle()}>
							<MDIIcon icon="key" size={24} />
							Token Endpoint Authentication Methods
						</h2>
						<button
							type="button"
							style={getCloseButtonStyle()}
							onClick={onClose}
							aria-label="Close modal"
							title="Close modal"
						>
							<MDIIcon icon="close" size={24} />
						</button>
					</div>

					<div style={getModalContentStyle()}>
						{/* Introduction */}
						<div style={getSectionStyle()}>
							<div style={getInfoBoxStyle('info')}>
								<MDIIcon icon="information" size={20} />
								<div>
									<strong>What is Token Endpoint Authentication?</strong>
									<p style={{ margin: '0.5rem 0 0 0' }}>
										Token Endpoint Authentication is how OAuth 2.0 clients authenticate themselves
										when requesting access tokens. This is different from the initial authorization
										where users authenticate.
									</p>
								</div>
							</div>
						</div>

						{/* Authentication Methods */}
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="shield-check" size={20} />
								Authentication Methods
							</h3>

							<div style={getMethodCardStyle()}>
								<div style={getMethodHeaderStyle()}>
									<MDIIcon icon="key" size={18} style={{ color: '#10b981' }} />
									<h4 style={getMethodNameStyle()}>None (Public Client)</h4>
								</div>
								<p style={getMethodDescriptionStyle()}>
									No authentication - suitable for public clients (mobile apps, SPAs) that cannot
									securely store credentials. Requires PKCE for security.
								</p>
								<div style={getCodeExampleStyle()}>
									{`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=your-client-id
&code_verifier=xyz789  // PKCE required`}
								</div>
							</div>

							<div style={getMethodCardStyle()}>
								<div style={getMethodHeaderStyle()}>
									<MDIIcon icon="lock" size={18} style={{ color: '#3b82f6' }} />
									<h4 style={getMethodNameStyle()}>Client Secret Basic</h4>
								</div>
								<p style={getMethodDescriptionStyle()}>
									Client ID and secret sent in HTTP Basic Authorization header. Most common method
									for confidential clients.
								</p>
								<div style={getCodeExampleStyle()}>
									{`POST /token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=your-client-id`}
								</div>
							</div>

							<div style={getMethodCardStyle()}>
								<div style={getMethodHeaderStyle()}>
									<MDIIcon icon="lock" size={18} style={{ color: '#8b5cf6' }} />
									<h4 style={getMethodNameStyle()}>Client Secret Post</h4>
								</div>
								<p style={getMethodDescriptionStyle()}>
									Client ID and secret sent in request body instead of header. Functionally
									equivalent to Basic auth.
								</p>
								<div style={getCodeExampleStyle()}>
									{`POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=abc123
&client_id=your-client-id
&client_secret=your-secret`}
								</div>
							</div>

							<div style={getMethodCardStyle()}>
								<div style={getMethodHeaderStyle()}>
									<MDIIcon icon="shield-check" size={18} style={{ color: '#f59e0b' }} />
									<h4 style={getMethodNameStyle()}>Client Secret JWT</h4>
								</div>
								<p style={getMethodDescriptionStyle()}>
									Client creates and signs a JWT using client secret as key. Enhanced security with
									timestamp and nonce.
								</p>
							</div>

							<div style={getMethodCardStyle()}>
								<div style={getMethodHeaderStyle()}>
									<MDIIcon icon="shield-check" size={18} style={{ color: '#ef4444' }} />
									<h4 style={getMethodNameStyle()}>Private Key JWT</h4>
								</div>
								<p style={getMethodDescriptionStyle()}>
									Client creates and signs JWT using private key. Highest security for
									server-to-server communication.
								</p>
							</div>
						</div>

						{/* Compatibility Matrix */}
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="information" size={20} />
								Flow Compatibility Matrix
							</h3>

							<table style={getTableStyle()}>
								<thead>
									<tr>
										<th style={getTableHeaderStyle()}>Method</th>
										<th style={getTableHeaderStyle()}>Auth Code</th>
										<th style={getTableHeaderStyle()}>Client Credentials</th>
										<th style={getTableHeaderStyle()}>Resource Owner</th>
										<th style={getTableHeaderStyle()}>PKCE Required</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td style={getTableCellStyle()}>None</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>❌</td>
										<td style={getTableCellStyle()}>❌</td>
										<td style={getTableCellStyle()}>✅</td>
									</tr>
									<tr>
										<td style={getTableCellStyle()}>Client Secret Basic</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>❌</td>
									</tr>
									<tr>
										<td style={getTableCellStyle()}>Client Secret Post</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>❌</td>
									</tr>
									<tr>
										<td style={getTableCellStyle()}>Client Secret JWT</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>❌</td>
									</tr>
									<tr>
										<td style={getTableCellStyle()}>Private Key JWT</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>✅</td>
										<td style={getTableCellStyle()}>❌</td>
									</tr>
								</tbody>
							</table>
						</div>

						{/* Recommendations */}
						<div style={getSectionStyle()}>
							<h3 style={getSectionTitleStyle()}>
								<MDIIcon icon="check-circle" size={20} />
								Recommended Pairings
							</h3>

							<div style={getRecommendationCardStyle()}>
								<h4 style={getRecommendationTitleStyle()}>🌐 Web App (Confidential)</h4>
								<p style={getRecommendationTextStyle()}>
									<strong>Default:</strong> Client Secret Basic
									<br />
									<strong>Enterprise:</strong> Client Secret JWT
									<br />
									<strong>High Security:</strong> Private Key JWT
								</p>
							</div>

							<div style={getRecommendationCardStyle()}>
								<h4 style={getRecommendationTitleStyle()}>📱 Mobile App (Public)</h4>
								<p style={getRecommendationTextStyle()}>
									<strong>Required:</strong> None + PKCE
									<br />
									<strong>Security:</strong> Code verifier prevents interception
								</p>
							</div>

							<div style={getRecommendationCardStyle()}>
								<h4 style={getRecommendationTitleStyle()}>🔧 Server-to-Server</h4>
								<p style={getRecommendationTextStyle()}>
									<strong>Standard:</strong> Client Credentials + Basic Auth
									<br />
									<strong>Enterprise:</strong> Client Credentials + JWT
								</p>
							</div>
						</div>

						{/* Key Takeaways */}
						<div style={getSectionStyle()}>
							<div style={getInfoBoxStyle('warning')}>
								<MDIIcon icon="information" size={20} />
								<div>
									<strong>Key Takeaways</strong>
									<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
										<li>
											Public clients (mobile, SPAs) <strong>must</strong> use "None" with PKCE
										</li>
										<li>
											Confidential clients (web apps, services) <strong>must</strong> authenticate
										</li>
										<li>
											JWT-based methods (Client Secret JWT, Private Key JWT) are strongest for
											enterprise workloads
										</li>
										<li>PingOne rejects "None" for confidential clients</li>
										<li>Always use PKCE with "None" authentication method</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default TokenEndpointAuthModalPingUI;
