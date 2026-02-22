/**
 * @file OidcDiscoveryModalV8.tsx
 * @module v8/components
 * @description Simple modal for displaying OIDC discovery results
 * @version 8.0.0
 * @since 2024-11-16
 */

import React from 'react';

export interface OidcDiscoveryResult {
	issuer: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	userInfoEndpoint?: string;
	scopesSupported?: string[];
	responseTypesSupported?: string[];
	[key: string]: any;
}

interface OidcDiscoveryModalV8Props {
	isOpen: boolean;
	result: OidcDiscoveryResult | null;
	onClose: () => void;
	onApply: (result: OidcDiscoveryResult) => void;
}

export const OidcDiscoveryModalV8: React.FC<OidcDiscoveryModalV8Props> = ({
	isOpen,
	result,
	onClose,
	onApply,
}) => {
	const [copiedField, setCopiedField] = React.useState<string | null>(null);

	// Lock body scroll when modal is open
	React.useEffect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	}, [isOpen]);

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

	if (!isOpen || !result) return null;

	const handleCopy = (text: string, field: string) => {
		navigator.clipboard.writeText(text);
		setCopiedField(field);
		setTimeout(() => setCopiedField(null), 2000);
	};

	return (
		<>
			{/* Backdrop */}
			<div
				role="button"
				tabIndex={0}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 999,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						onClose();
					}
				}}
			/>

			{/* Modal */}
			<div
				role="button"
				tabIndex={0}
				style={{
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					background: 'white',
					borderRadius: '8px',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
					zIndex: 1000,
					maxWidth: '500px',
					width: '90%',
					maxHeight: '80vh',
					overflow: 'auto',
					padding: '24px',
				}}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.stopPropagation();
					}
				}}
			>
				{/* Header */}
				<div style={{ marginBottom: '16px' }}>
					<h2
						style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}
					>
						🔍 OIDC Discovery Results
					</h2>
					<p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
						Configuration discovered from OIDC metadata
					</p>
				</div>

				{/* Content */}
				<div style={{ marginBottom: '20px' }}>
					{/* Issuer */}
					<div style={{ marginBottom: '16px' }}>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: '4px',
							}}
						>
							<label
								style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}
								htmlFor="issuer"
							>
								Issuer
							</label>
							<button
								type="button"
								onClick={() => handleCopy(result.issuer, 'issuer')}
								style={{
									padding: '4px 8px',
									background: copiedField === 'issuer' ? '#10b981' : '#e5e7eb',
									color: copiedField === 'issuer' ? 'white' : '#374151',
									border: 'none',
									borderRadius: '4px',
									fontSize: '11px',
									cursor: 'pointer',
									fontWeight: '600',
								}}
							>
								{copiedField === 'issuer' ? '✓ Copied' : '📋 Copy'}
							</button>
						</div>
						<div
							style={{
								padding: '8px 12px',
								background: '#f3f4f6',
								borderRadius: '4px',
								fontSize: '12px',
								fontFamily: 'monospace',
								wordBreak: 'break-all',
								color: '#333',
								overflowWrap: 'anywhere',
							}}
						>
							{result.issuer}
						</div>
					</div>

					{/* Endpoints */}
					{(result.authorizationEndpoint || result.tokenEndpoint || result.userInfoEndpoint) && (
						<div style={{ marginBottom: '16px' }}>
							<label
								style={{
									fontSize: '12px',
									fontWeight: '600',
									color: '#1f2937',
									display: 'block',
									marginBottom: '8px',
								}}
								htmlFor="endpoints"
							>
								Endpoints
							</label>
							<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
								{result.authorizationEndpoint && (
									<div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: '2px',
											}}
										>
											<small style={{ color: '#666', fontWeight: '600' }}>Authorization</small>
											<button
												type="button"
												onClick={() => handleCopy(result.authorizationEndpoint!, 'authz')}
												style={{
													padding: '2px 6px',
													background: copiedField === 'authz' ? '#10b981' : '#e5e7eb',
													color: copiedField === 'authz' ? 'white' : '#374151',
													border: 'none',
													borderRadius: '3px',
													fontSize: '10px',
													cursor: 'pointer',
												}}
											>
												{copiedField === 'authz' ? '✓' : '📋'}
											</button>
										</div>
										<div
											style={{
												padding: '6px 10px',
												background: '#f9fafb',
												borderRadius: '4px',
												fontSize: '11px',
												fontFamily: 'monospace',
												wordBreak: 'break-all',
												color: '#333',
												overflowWrap: 'anywhere',
											}}
										>
											{result.authorizationEndpoint}
										</div>
									</div>
								)}
								{result.tokenEndpoint && (
									<div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: '2px',
											}}
										>
											<small style={{ color: '#666', fontWeight: '600' }}>Token</small>
											<button
												type="button"
												onClick={() => handleCopy(result.tokenEndpoint!, 'token')}
												style={{
													padding: '2px 6px',
													background: copiedField === 'token' ? '#10b981' : '#e5e7eb',
													color: copiedField === 'token' ? 'white' : '#374151',
													border: 'none',
													borderRadius: '3px',
													fontSize: '10px',
													cursor: 'pointer',
												}}
											>
												{copiedField === 'token' ? '✓' : '📋'}
											</button>
										</div>
										<div
											style={{
												padding: '6px 10px',
												background: '#f9fafb',
												borderRadius: '4px',
												fontSize: '11px',
												fontFamily: 'monospace',
												wordBreak: 'break-all',
												color: '#333',
												overflowWrap: 'anywhere',
											}}
										>
											{result.tokenEndpoint}
										</div>
									</div>
								)}
								{result.userInfoEndpoint && (
									<div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												marginBottom: '2px',
											}}
										>
											<small style={{ color: '#666', fontWeight: '600' }}>User Info</small>
											<button
												type="button"
												onClick={() => handleCopy(result.userInfoEndpoint!, 'userinfo')}
												style={{
													padding: '2px 6px',
													background: copiedField === 'userinfo' ? '#10b981' : '#e5e7eb',
													color: copiedField === 'userinfo' ? 'white' : '#374151',
													border: 'none',
													borderRadius: '3px',
													fontSize: '10px',
													cursor: 'pointer',
												}}
											>
												{copiedField === 'userinfo' ? '✓' : '📋'}
											</button>
										</div>
										<div
											style={{
												padding: '6px 10px',
												background: '#f9fafb',
												borderRadius: '4px',
												fontSize: '11px',
												fontFamily: 'monospace',
												wordBreak: 'break-all',
												color: '#333',
												overflowWrap: 'anywhere',
											}}
										>
											{result.userInfoEndpoint}
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Scopes */}
					{result.scopesSupported && result.scopesSupported.length > 0 && (
						<div style={{ marginBottom: '16px' }}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '4px',
								}}
							>
								<label
									style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}
									htmlFor="supportedscopes"
								>
									Supported Scopes
								</label>
								<button
									type="button"
									onClick={() => handleCopy(result.scopesSupported!.join(' '), 'scopes')}
									style={{
										padding: '4px 8px',
										background: copiedField === 'scopes' ? '#10b981' : '#e5e7eb',
										color: copiedField === 'scopes' ? 'white' : '#374151',
										border: 'none',
										borderRadius: '4px',
										fontSize: '11px',
										cursor: 'pointer',
										fontWeight: '600',
									}}
								>
									{copiedField === 'scopes' ? '✓ Copied' : '📋 Copy'}
								</button>
							</div>
							<div
								style={{
									padding: '8px 12px',
									background: '#f3f4f6',
									borderRadius: '4px',
									fontSize: '12px',
									color: '#333',
									maxHeight: '120px',
									overflow: 'auto',
									wordBreak: 'break-word',
									overflowWrap: 'anywhere',
								}}
							>
								{result.scopesSupported.join(', ')}
							</div>
						</div>
					)}

					{/* Response Types */}
					{result.responseTypesSupported && result.responseTypesSupported.length > 0 && (
						<div style={{ marginBottom: '16px' }}>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: '4px',
								}}
							>
								<label
									style={{ fontSize: '12px', fontWeight: '600', color: '#1f2937' }}
									htmlFor="supportedresponsetypes"
								>
									Supported Response Types
								</label>
								<button
									type="button"
									onClick={() =>
										handleCopy(result.responseTypesSupported!.join(' '), 'responseTypes')
									}
									style={{
										padding: '4px 8px',
										background: copiedField === 'responseTypes' ? '#10b981' : '#e5e7eb',
										color: copiedField === 'responseTypes' ? 'white' : '#374151',
										border: 'none',
										borderRadius: '4px',
										fontSize: '11px',
										cursor: 'pointer',
										fontWeight: '600',
									}}
								>
									{copiedField === 'responseTypes' ? '✓ Copied' : '📋 Copy'}
								</button>
							</div>
							<div
								style={{
									padding: '8px 12px',
									background: '#f3f4f6',
									borderRadius: '4px',
									fontSize: '12px',
									color: '#333',
									wordBreak: 'break-word',
									overflowWrap: 'anywhere',
								}}
							>
								{result.responseTypesSupported.join(', ')}
							</div>
						</div>
					)}
				</div>

				{/* Actions */}
				<div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: '8px 16px',
							background: '#e5e7eb',
							color: '#1f2937',
							border: 'none',
							borderRadius: '4px',
							fontSize: '13px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 0.2s ease',
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#d1d5db')}
						onMouseLeave={(e) => (e.currentTarget.style.background = '#e5e7eb')}
					>
						Close
					</button>
					<button
						type="button"
						onClick={() => {
							onApply(result);
							onClose();
						}}
						style={{
							padding: '8px 16px',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							fontSize: '13px',
							fontWeight: '600',
							cursor: 'pointer',
							transition: 'background 0.2s ease',
						}}
						onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
						onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}
					>
						Apply Configuration
					</button>
				</div>
			</div>
		</>
	);
};

export default OidcDiscoveryModalV8;
