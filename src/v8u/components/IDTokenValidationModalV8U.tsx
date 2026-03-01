/**
 * @file IDTokenValidationModalV8U.tsx
 * @module v8u/components
 * @description Modal for locally validating ID tokens
 * @version 8.0.0
 * @since 2026-01-18
 *
 * Provides comprehensive ID token validation including:
 * - JWT signature verification using JWKS
 * - Claims validation (iss, aud, exp, iat, nonce)
 * - Educational feedback on validation results
 */

import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiX } from '@icons';
import { useEffect, useState } from 'react';
import type { IDTokenValidationResult } from '@/v8/services/idTokenValidationServiceV8';
import { IDTokenValidationServiceV8 } from '@/v8/services/idTokenValidationServiceV8';

const MODULE_TAG = '[🔐 ID-TOKEN-VALIDATION-MODAL-V8U]';

export interface IDTokenValidationModalV8UProps {
	isOpen: boolean;
	onClose: () => void;
	idToken: string;
	clientId: string;
	environmentId: string;
	nonce?: string;
}

export const IDTokenValidationModalV8U: React.FC<IDTokenValidationModalV8UProps> = ({
	isOpen,
	onClose,
	idToken,
	clientId,
	environmentId,
	nonce,
}) => {
	const [isValidating, setIsValidating] = useState(false);
	const [validationResult, setValidationResult] = useState<IDTokenValidationResult | null>(null);

	const handleValidate = async () => {
		console.log(`${MODULE_TAG} Starting ID token validation`);
		setIsValidating(true);
		setValidationResult(null);

		try {
			const issuer = `https://auth.pingone.com/${environmentId}/as`;
			const result = await IDTokenValidationServiceV8.validate({
				idToken,
				clientId,
				issuer,
				nonce,
			});

			console.log(`${MODULE_TAG} Validation complete`, { valid: result.valid });
			setValidationResult(result);
		} catch (error) {
			console.error(`${MODULE_TAG} Validation failed`, error);
			setValidationResult({
				valid: false,
				errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
				warnings: [],
				validationDetails: {
					signatureVerified: false,
					issuerValid: false,
					audienceValid: false,
					expirationValid: false,
					issuedAtValid: false,
				},
			});
		} finally {
			setIsValidating(false);
		}
	};

	// Auto-validate when modal opens
	useEffect(() => {
		if (isOpen && idToken && !validationResult) {
			handleValidate();
		}
	}, [isOpen, idToken, validationResult, handleValidate]);

	if (!isOpen) return null;

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0, 0, 0, 0.5)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 9999,
				padding: '20px',
			}}
			onClick={onClose}
		>
			<div
				style={{
					background: '#ffffff',
					borderRadius: '12px',
					maxWidth: '800px',
					width: '100%',
					maxHeight: '90vh',
					overflow: 'auto',
					boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				}}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div
					style={{
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						color: 'white',
						padding: '20px 24px',
						borderRadius: '12px 12px 0 0',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<div>
						<h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
							🔐 ID Token Local Validation
						</h2>
						<p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
							Comprehensive JWT signature and claims validation
						</p>
					</div>
					<button
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
							color: 'white',
						}}
						title="Close"
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Content */}
				<div style={{ padding: '24px' }}>
					{/* Loading State */}
					{isValidating && (
						<div style={{ textAlign: 'center', padding: '40px 20px' }}>
							<div
								style={{
									border: '4px solid #e5e7eb',
									borderTop: '4px solid #667eea',
									borderRadius: '50%',
									width: '48px',
									height: '48px',
									animation: 'spin 1s linear infinite',
									margin: '0 auto 16px',
								}}
							/>
							<p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
								Validating ID token...
							</p>
							<p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 0' }}>
								Fetching JWKS, verifying signature, validating claims
							</p>
						</div>
					)}

					{/* Validation Result */}
					{!isValidating && validationResult && (
						<div>
							{/* Overall Result */}
							<div
								style={{
									background: validationResult.valid ? '#dcfce7' : '#fee2e2',
									border: `2px solid ${validationResult.valid ? '#86efac' : '#fca5a5'}`,
									borderRadius: '8px',
									padding: '16px',
									marginBottom: '20px',
									display: 'flex',
									alignItems: 'center',
									gap: '12px',
								}}
							>
								{validationResult.valid ? (
									<FiCheckCircle size={24} color="#16a34a" />
								) : (
									<FiAlertCircle size={24} color="#dc2626" />
								)}
								<div>
									<div
										style={{
											fontSize: '16px',
											fontWeight: '600',
											color: validationResult.valid ? '#16a34a' : '#dc2626',
										}}
									>
										{validationResult.valid
											? '✅ ID Token is Valid'
											: '❌ ID Token Validation Failed'}
									</div>
									<div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
										{validationResult.valid
											? 'All checks passed. This token can be trusted.'
											: 'One or more validation checks failed. Do not trust this token.'}
									</div>
								</div>
							</div>

							{/* Validation Details */}
							<div style={{ marginBottom: '20px' }}>
								<h3
									style={{
										fontSize: '14px',
										fontWeight: '600',
										color: '#374151',
										marginBottom: '12px',
									}}
								>
									Validation Checks
								</h3>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{[
										{
											label: 'JWT Signature',
											valid: validationResult.validationDetails.signatureVerified,
											description: 'Verified using JWKS from PingOne',
										},
										{
											label: 'Issuer (iss)',
											valid: validationResult.validationDetails.issuerValid,
											description: 'Matches expected authorization server',
										},
										{
											label: 'Audience (aud)',
											valid: validationResult.validationDetails.audienceValid,
											description: 'Matches your client ID',
										},
										{
											label: 'Expiration (exp)',
											valid: validationResult.validationDetails.expirationValid,
											description: 'Token has not expired',
										},
										{
											label: 'Issued At (iat)',
											valid: validationResult.validationDetails.issuedAtValid,
											description: 'Token has valid timestamp',
										},
										...(validationResult.validationDetails.nonceValid !== undefined
											? [
													{
														label: 'Nonce',
														valid: validationResult.validationDetails.nonceValid,
														description: 'Matches authorization request nonce',
													},
												]
											: []),
										...(validationResult.validationDetails.authorizedPartyValid !== undefined
											? [
													{
														label: 'Authorized Party (azp)',
														valid: validationResult.validationDetails.authorizedPartyValid,
														description: 'Matches client ID (multi-audience)',
													},
												]
											: []),
									].map((check) => (
										<div
											key={check.label}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '8px',
												padding: '10px 12px',
												background: '#f9fafb',
												borderRadius: '6px',
												border: '1px solid #e5e7eb',
											}}
										>
											{check.valid ? (
												<FiCheckCircle size={16} color="#16a34a" />
											) : (
												<FiAlertCircle size={16} color="#dc2626" />
											)}
											<div style={{ flex: 1 }}>
												<div
													style={{
														fontSize: '13px',
														fontWeight: '500',
														color: check.valid ? '#16a34a' : '#dc2626',
													}}
												>
													{check.label}
												</div>
												<div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
													{check.description}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Errors */}
							{validationResult.errors.length > 0 && (
								<div style={{ marginBottom: '20px' }}>
									<h3
										style={{
											fontSize: '14px',
											fontWeight: '600',
											color: '#dc2626',
											marginBottom: '8px',
										}}
									>
										❌ Errors ({validationResult.errors.length})
									</h3>
									<div
										style={{
											background: '#fee2e2',
											border: '1px solid #fca5a5',
											borderRadius: '6px',
											padding: '12px',
										}}
									>
										<ul style={{ margin: 0, paddingLeft: '20px' }}>
											{validationResult.errors.map((error, index) => (
												<li
													key={index}
													style={{
														color: '#dc2626',
														fontSize: '13px',
														marginTop: index > 0 ? '4px' : 0,
													}}
												>
													{error}
												</li>
											))}
										</ul>
									</div>
								</div>
							)}

							{/* Warnings */}
							{validationResult.warnings.length > 0 && (
								<div style={{ marginBottom: '20px' }}>
									<h3
										style={{
											fontSize: '14px',
											fontWeight: '600',
											color: '#d97706',
											marginBottom: '8px',
										}}
									>
										⚠️ Warnings ({validationResult.warnings.length})
									</h3>
									<div
										style={{
											background: '#fef3c7',
											border: '1px solid #fbbf24',
											borderRadius: '6px',
											padding: '12px',
										}}
									>
										<ul style={{ margin: 0, paddingLeft: '20px' }}>
											{validationResult.warnings.map((warning, index) => (
												<li
													key={index}
													style={{
														color: '#d97706',
														fontSize: '13px',
														marginTop: index > 0 ? '4px' : 0,
													}}
												>
													{warning}
												</li>
											))}
										</ul>
									</div>
								</div>
							)}

							{/* Learn More */}
							<div
								style={{
									background: '#f0f9ff',
									border: '1px solid #bae6fd',
									borderRadius: '8px',
									padding: '12px',
								}}
							>
								<div
									style={{
										fontSize: '13px',
										fontWeight: '600',
										color: '#0369a1',
										marginBottom: '8px',
									}}
								>
									📚 Learn More
								</div>
								<div style={{ fontSize: '12px', color: '#0c4a6e', lineHeight: '1.6' }}>
									ID token validation follows the OIDC Core 1.0 specification. For more details:
									<br />
									<a
										href="https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation"
										target="_blank"
										rel="noopener noreferrer"
										style={{
											color: '#2563eb',
											textDecoration: 'underline',
											display: 'inline-flex',
											alignItems: 'center',
											gap: '4px',
											marginTop: '4px',
										}}
									>
										OIDC ID Token Validation Spec
										<FiExternalLink size={12} />
									</a>
								</div>
							</div>
						</div>
					)}

					{/* Actions */}
					<div
						style={{
							marginTop: '20px',
							display: 'flex',
							justifyContent: 'space-between',
							gap: '12px',
						}}
					>
						<button
							onClick={handleValidate}
							disabled={isValidating}
							style={{
								padding: '10px 20px',
								background: '#667eea',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: isValidating ? 'not-allowed' : 'pointer',
								opacity: isValidating ? 0.6 : 1,
							}}
						>
							{isValidating ? 'Validating...' : 'Validate Again'}
						</button>
						<button
							onClick={onClose}
							style={{
								padding: '10px 20px',
								background: '#f3f4f6',
								color: '#374151',
								border: '1px solid #d1d5db',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '500',
								cursor: 'pointer',
							}}
						>
							Close
						</button>
					</div>
				</div>
			</div>

			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
};
