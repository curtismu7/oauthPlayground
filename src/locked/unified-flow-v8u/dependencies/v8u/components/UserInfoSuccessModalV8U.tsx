/**
 * @file UserInfoSuccessModalV8U.tsx
 * @module v8u/components
 * @description Success modal displaying user information after authentication
 * @version 8.0.0
 * @since 2024-11-17
 */

import React from 'react';
import { FiCheckCircle, FiHash, FiMail, FiUser, FiX } from 'react-icons/fi';

const MODULE_TAG = '[✅ USER-INFO-SUCCESS-MODAL-V8U]';

interface UserInfoSuccessModalV8UProps {
	isOpen: boolean;
	onClose: () => void;
	userInfo?: Record<string, unknown>;
	idToken?: string;
}

/**
 * Extract user information from UserInfo or ID Token
 */
const extractUserInfo = (
	userInfo?: Record<string, unknown>,
	idToken?: string
): {
	username?: string;
	email?: string;
	name?: string;
	givenName?: string;
	familyName?: string;
	sub?: string;
	[key: string]: unknown;
} => {
	const result: Record<string, unknown> = {};

	// First, try to get from UserInfo (most reliable)
	if (userInfo) {
		result.username = userInfo.username || userInfo.preferred_username || userInfo.sub;
		result.email = userInfo.email;
		result.name = userInfo.name;
		result.givenName = userInfo.given_name || userInfo.givenName;
		result.familyName = userInfo.family_name || userInfo.familyName;
		result.sub = userInfo.sub;

		// Copy any other fields
		Object.keys(userInfo).forEach((key) => {
			if (!result[key]) {
				result[key] = userInfo[key];
			}
		});
	}

	// If we have an ID token, try to decode it (basic base64 decode)
	if (idToken && !result.email && !result.username) {
		try {
			const parts = idToken.split('.');
			if (parts.length >= 2) {
				// Decode the payload (second part)
				const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

				if (!result.email) result.email = payload.email;
				if (!result.username)
					result.username = payload.preferred_username || payload.username || payload.sub;
				if (!result.name) result.name = payload.name;
				if (!result.givenName) result.givenName = payload.given_name || payload.givenName;
				if (!result.familyName) result.familyName = payload.family_name || payload.familyName;
				if (!result.sub) result.sub = payload.sub;
			}
		} catch (err) {
			console.warn(`${MODULE_TAG} Failed to decode ID token`, err);
		}
	}

	return result;
};

export const UserInfoSuccessModalV8U: React.FC<UserInfoSuccessModalV8UProps> = ({
	isOpen,
	onClose,
	userInfo,
	idToken,
}) => {
	if (!isOpen) return null;

	const extractedInfo = extractUserInfo(userInfo, idToken);
	const hasUserInfo = !!(
		extractedInfo.username ||
		extractedInfo.email ||
		extractedInfo.name ||
		extractedInfo.sub
	);

	// Get all other fields (excluding the ones we display prominently)
	const otherFields = Object.keys(extractedInfo).filter(
		(key) =>
			!['username', 'email', 'name', 'givenName', 'familyName', 'sub'].includes(key) &&
			extractedInfo[key] !== undefined &&
			extractedInfo[key] !== null &&
			extractedInfo[key] !== ''
	);

	return (
		<>
			{/* Backdrop */}
			<div
				onClick={onClose}
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					background: 'rgba(0, 0, 0, 0.5)',
					zIndex: 1000,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					animation: 'fadeIn 0.2s ease',
				}}
			>
				{/* Modal */}
				<div
					onClick={(e) => e.stopPropagation()}
					style={{
						background: 'white',
						borderRadius: '12px',
						width: '90%',
						maxWidth: '500px',
						maxHeight: '80vh',
						overflow: 'auto',
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
						zIndex: 1001,
						animation: 'slideUp 0.3s ease',
					}}
				>
					{/* Header */}
					<div
						style={{
							padding: '24px',
							borderBottom: '1px solid #e5e7eb',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<div
								style={{
									width: '48px',
									height: '48px',
									borderRadius: '50%',
									background: 'rgba(255, 255, 255, 0.2)',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: '24px',
								}}
							>
								<FiCheckCircle color="white" size={28} />
							</div>
							<div>
								<h2
									style={{
										margin: 0,
										fontSize: '20px',
										fontWeight: '600',
										color: 'white',
									}}
								>
									Authentication Successful!
								</h2>
								<p
									style={{
										margin: '4px 0 0 0',
										fontSize: '14px',
										color: 'rgba(255, 255, 255, 0.9)',
									}}
								>
									Welcome back
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							style={{
								background: 'rgba(255, 255, 255, 0.2)',
								border: 'none',
								fontSize: '24px',
								cursor: 'pointer',
								color: 'white',
								padding: '8px',
								borderRadius: '6px',
								lineHeight: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								transition: 'background 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
							}}
						>
							<FiX size={20} />
						</button>
					</div>

					{/* Content */}
					<div style={{ padding: '24px' }}>
						{hasUserInfo ? (
							<>
								{/* Primary User Information */}
								<div
									style={{
										background: '#f0fdf4',
										borderRadius: '8px',
										padding: '20px',
										marginBottom: '20px',
										border: '1px solid #86efac',
									}}
								>
									{extractedInfo.name && (
										<div style={{ marginBottom: '16px' }}>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px',
													color: '#166534',
													fontSize: '12px',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												<FiUser size={14} />
												Full Name
											</div>
											<div
												style={{
													fontSize: '18px',
													fontWeight: '600',
													color: '#1f2937',
												}}
											>
												{extractedInfo.name as string}
											</div>
										</div>
									)}

									{extractedInfo.email && (
										<div style={{ marginBottom: '16px' }}>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px',
													color: '#166534',
													fontSize: '12px',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												<FiMail size={14} />
												Email
											</div>
											<div
												style={{
													fontSize: '16px',
													color: '#374151',
												}}
											>
												{extractedInfo.email as string}
											</div>
										</div>
									)}

									{extractedInfo.username && extractedInfo.username !== extractedInfo.email && (
										<div style={{ marginBottom: '16px' }}>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px',
													color: '#166534',
													fontSize: '12px',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												<FiUser size={14} />
												Username
											</div>
											<div
												style={{
													fontSize: '16px',
													color: '#374151',
												}}
											>
												{extractedInfo.username as string}
											</div>
										</div>
									)}

									{extractedInfo.sub && (
										<div>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '8px',
													marginBottom: '4px',
													color: '#166534',
													fontSize: '12px',
													fontWeight: '600',
													textTransform: 'uppercase',
													letterSpacing: '0.5px',
												}}
											>
												<FiHash size={14} />
												Subject ID
											</div>
											<div
												style={{
													fontSize: '14px',
													color: '#6b7280',
													fontFamily: 'monospace',
													wordBreak: 'break-all',
												}}
											>
												{extractedInfo.sub as string}
											</div>
										</div>
									)}
								</div>

								{/* Additional Information */}
								{otherFields.length > 0 && (
									<div>
										<h3
											style={{
												fontSize: '14px',
												fontWeight: '600',
												color: '#374151',
												marginBottom: '12px',
											}}
										>
											Additional Information
										</h3>
										<div
											style={{
												background: '#f8fafc',
												borderRadius: '6px',
												padding: '12px',
												border: '1px solid #e2e8f0',
											}}
										>
											{otherFields.map((key) => (
												<div
													key={key}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														padding: '8px 0',
														borderBottom: '1px solid #e2e8f0',
													}}
												>
													<span
														style={{
															fontSize: '13px',
															fontWeight: '500',
															color: '#6b7280',
															textTransform: 'capitalize',
														}}
													>
														{key.replace(/_/g, ' ')}
													</span>
													<span
														style={{
															fontSize: '13px',
															color: '#1f2937',
															textAlign: 'right',
															maxWidth: '60%',
															wordBreak: 'break-word',
														}}
													>
														{typeof extractedInfo[key] === 'object'
															? JSON.stringify(extractedInfo[key])
															: String(extractedInfo[key])}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</>
						) : (
							<div
								style={{
									padding: '20px',
									textAlign: 'center',
									color: '#6b7280',
								}}
							>
								<p>User information is being loaded...</p>
							</div>
						)}

						{/* Close Button */}
						<button
							onClick={onClose}
							style={{
								width: '100%',
								marginTop: '24px',
								padding: '12px 24px',
								background: '#22c55e',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = '#16a34a';
								e.currentTarget.style.transform = 'translateY(-1px)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = '#22c55e';
								e.currentTarget.style.transform = 'translateY(0)';
							}}
						>
							Continue
						</button>
					</div>
				</div>
			</div>

			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slideUp {
					from { 
						opacity: 0;
						transform: translateY(20px);
					}
					to { 
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</>
	);
};

export default UserInfoSuccessModalV8U;
