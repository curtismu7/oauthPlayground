// src/components/password-reset/PasswordSetValueTab.tsx
// Update Password (Set Value) Tab Component

import React, { useState } from 'react';
import { FiBook, FiCheckCircle, FiExternalLink, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import { setPasswordValue as setPasswordValueService } from '../../services/passwordResetService';
import { lookupPingOneUser } from '../../services/pingOneUserProfileService';
import { v4ToastManager } from '../../utils/v4ToastMessages';

const HELIOMART_ACCENT_START = '#F59E0B';

const Card = styled.div`
	background: #ffffff;
	border: 1px solid #E5E7EB;
	border-radius: 1rem;
	padding: 2rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Alert = styled.div<{ $type: 'success' | 'error' | 'info' }>`
	display: flex;
	align-items: flex-start;
	gap: 1rem;
	padding: 1rem;
	border-radius: 0.5rem;
	margin-bottom: 1.5rem;
	background: ${(props) => {
		if (props.$type === 'success') return '#F0FDF4';
		if (props.$type === 'error') return '#FEF2F2';
		return '#EFF6FF';
	}};
	border: 1px solid ${(props) => {
		if (props.$type === 'success') return '#22C55E';
		if (props.$type === 'error') return '#DC2626';
		return '#3B82F6';
	}};
	color: ${(props) => {
		if (props.$type === 'success') return '#166534';
		if (props.$type === 'error') return '#991B1B';
		return '#1E40AF';
	}};
`;

const FormGroup = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	margin-bottom: 0.5rem;
	font-weight: 600;
	color: #374151;
	font-size: 0.875rem;
`;

const Input = styled.input`
	width: 100%;
	padding: 0.75rem;
	background: #ffffff;
	border: 1px solid #D1D5DB;
	border-radius: 0.5rem;
	color: #1F2937;
	font-size: 1rem;
	transition: border-color 0.2s;

	&:focus {
		outline: none;
		border-color: ${HELIOMART_ACCENT_START};
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}

	&::placeholder {
		color: #9CA3AF;
	}
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 0.5rem;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	${(props) => {
		if (props.$variant === 'success') {
			return `
				background: #22C55E;
				color: #ffffff;
				&:hover {
					background: #16A34A;
				}
			`;
		}
		return `
			background: linear-gradient(135deg, ${HELIOMART_ACCENT_START} 0%, #F97316 100%);
			color: #ffffff;
			&:hover {
				opacity: 0.9;
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
			}
		`;
	}}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

const UserCard = styled.div`
	background: #F9FAFB;
	border: 1px solid #E5E7EB;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 1.5rem;
`;

const UserInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const UserAvatar = styled.div`
	width: 3rem;
	height: 3rem;
	border-radius: 50%;
	background: linear-gradient(135deg, ${HELIOMART_ACCENT_START} 0%, #F97316 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 700;
	font-size: 1.25rem;
`;

const SuccessMessage = styled.div`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	padding: 2rem;
	border-radius: 1rem;
	text-align: center;
	margin: 2rem 0;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
`;

const SuccessTitle = styled.h2`
	font-size: 1.5rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
`;

const SuccessText = styled.p`
	font-size: 1rem;
	opacity: 0.95;
	margin: 0;
`;

const DocumentationSection = styled.div`
	margin-bottom: 1.5rem;
	padding-top: 1rem;
	border-top: 1px solid #E5E7EB;
`;

const DocumentationLink = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: ${HELIOMART_ACCENT_START};
	text-decoration: none;
	font-size: 0.875rem;
	font-weight: 600;
	transition: color 0.2s;

	&:hover {
		color: #F97316;
		text-decoration: underline;
	}
`;

const SpinningIcon = styled.div`
	display: inline-block;
	width: 1rem;
	height: 1rem;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: white;
	border-radius: 50%;
	animation: spin 0.6s linear infinite;

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
`;

interface User {
	id: string;
	name?: {
		given?: string;
		family?: string;
	};
	username?: string;
	email?: string;
}

interface PasswordSetValueTabProps {
	environmentId: string;
	workerToken: string;
}

export const PasswordSetValueTab: React.FC<PasswordSetValueTabProps> = ({
	environmentId,
	workerToken,
}) => {
	const [identifier, setIdentifier] = useState('');
	const [user, setUser] = useState<User | null>(null);
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [forceChange, setForceChange] = useState(false);
	const [bypassPasswordPolicy, setBypassPasswordPolicy] = useState(false);
	const [lookupLoading, setLookupLoading] = useState(false);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleLookup = async () => {
		if (!identifier || !workerToken || !environmentId) {
			v4ToastManager.showError('Please configure worker token and environment ID first');
			return;
		}
		setLookupLoading(true);
		setUser(null);
		setSuccess(false);
		try {
			console.log('[PasswordSetValueTab] Looking up user:', {
				identifier,
				environmentId: `${environmentId?.substring(0, 20)}...`,
			});
			const result = await lookupPingOneUser({
				environmentId,
				accessToken: workerToken,
				identifier: identifier.trim(),
			});
			console.log('[PasswordSetValueTab] Lookup result:', {
				hasUser: !!result.user,
				userId: result.user?.id,
			});
			if (result.user?.id) {
				setUser(result.user as unknown as User);
				v4ToastManager.showSuccess(
					`User found: ${result.user.email || result.user.username || result.user.id}`
				);
			} else {
				v4ToastManager.showError(
					`User not found with identifier: ${identifier}. Please check the username or email address.`
				);
			}
		} catch (error) {
			console.error('[PasswordSetValueTab] Lookup error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to lookup user';
			v4ToastManager.showError(
				`${errorMessage}. Make sure the worker token has p1:read:user scope.`
			);
		} finally {
			setLookupLoading(false);
		}
	};

	const handleSetPassword = async () => {
		if (!user || !password || !workerToken || !environmentId) {
			v4ToastManager.showError('Please fill in all required fields');
			return;
		}
		setLoading(true);
		setSuccess(false);
		try {
			const result = await setPasswordValueService(
				environmentId,
				user.id as string,
				workerToken,
				password,
				{ forceChange, bypassPasswordPolicy }
			);
			if (result.success) {
				setSuccess(true);
				const message = forceChange
					? 'Password set successfully! User will be required to change password on next sign-on.'
					: 'Password set successfully! User can now sign in with the new password.';
				v4ToastManager.showSuccess(message);
				setPassword('');
				// Clear success message after 5 seconds
				setTimeout(() => setSuccess(false), 5000);
			} else {
				v4ToastManager.showError(result.errorDescription || 'Password set failed');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Password set failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Update Password (Set Value)
			</h2>

			<Alert
				$type="success"
				style={{ marginBottom: '1.5rem', borderColor: '#22C55E', background: '#F0FDF4' }}
			>
				<FiCheckCircle style={{ color: '#22C55E' }} />
				<div>
					<strong style={{ color: '#22C55E' }}>✅ Recommended for Admin Password Resets</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Worker token + New password
						<br />
						<strong>Content-Type Header:</strong>{' '}
						<code
							style={{
								background: '#F3F4F6',
								padding: '0.25rem 0.5rem',
								borderRadius: '0.25rem',
								fontSize: '0.875rem',
							}}
						>
							application/vnd.pingidentity.password.setValue+json
						</code>
						<br />
						<strong style={{ color: '#22C55E' }}>✅ This is the recommended approach:</strong> Sets
						password without requiring a recovery code and does <strong>NOT</strong> put the user in
						a forced password change state. The user can sign in immediately with the new password.
					</p>
				</div>
			</Alert>

			<DocumentationSection>
				<DocumentationLink
					href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords"
					target="_blank"
					rel="noopener noreferrer"
				>
					<FiBook />
					PingOne API: Update Password (Set Value) - Content-Type:
					application/vnd.pingidentity.password.setValue+json
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && (
				<SuccessMessage>
					<SuccessTitle>
						<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Set Successfully!
					</SuccessTitle>
					<SuccessText>
						The user's password has been set. They can now sign in with the new password without
						being forced to change it.
					</SuccessText>
				</SuccessMessage>
			)}

			<FormGroup>
				<Label>Username or Email</Label>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<Input
						type="text"
						placeholder="Enter username or email"
						value={identifier}
						onChange={(e) => setIdentifier(e.target.value)}
					/>
					<Button onClick={handleLookup} disabled={lookupLoading || loading || !identifier}>
						{lookupLoading ? <SpinningIcon /> : <FiSearch />}
						{lookupLoading ? 'Looking up...' : 'Lookup'}
					</Button>
				</div>
			</FormGroup>

			{user && (
				<>
					<UserCard>
						<UserInfo>
							<UserAvatar>
								{user.name?.given || user.username?.[0]?.toUpperCase() || 'U'}
							</UserAvatar>
							<div>
								<div style={{ fontWeight: 600 }}>
									{user.name?.given} {user.name?.family}
								</div>
								<div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
									{user.email || user.username}
								</div>
							</div>
						</UserInfo>
					</UserCard>

					<FormGroup>
						<Label>New Password</Label>
						<div style={{ position: 'relative' }}>
							<Input
								type={showPassword ? 'text' : 'password'}
								placeholder="Enter new password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								style={{ paddingRight: '3rem' }}
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								style={{
									position: 'absolute',
									right: '0.75rem',
									top: '50%',
									transform: 'translateY(-50%)',
									background: 'none',
									border: 'none',
									color: '#6B7280',
									cursor: 'pointer',
									padding: '0.25rem',
								}}
							>
								{showPassword ? <FiEyeOff /> : <FiEye />}
							</button>
						</div>
					</FormGroup>

					<FormGroup>
						<Label
							style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
						>
							<input
								type="checkbox"
								checked={forceChange}
								onChange={(e) => setForceChange(e.target.checked)}
								style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
							/>
							<span>Force password change on next sign-on</span>
						</Label>
						<p
							style={{
								marginTop: '0.5rem',
								fontSize: '0.875rem',
								color: '#6B7280',
								marginLeft: '1.75rem',
							}}
						>
							If checked, the user will be required to change their password when they next sign in.
							Leave unchecked to allow immediate sign-in with the new password.
						</p>
					</FormGroup>

					<FormGroup>
						<Label
							style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
						>
							<input
								type="checkbox"
								checked={bypassPasswordPolicy}
								onChange={(e) => setBypassPasswordPolicy(e.target.checked)}
								style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
							/>
							<span>Bypass password policy</span>
						</Label>
						<p
							style={{
								marginTop: '0.5rem',
								fontSize: '0.875rem',
								color: '#6B7280',
								marginLeft: '1.75rem',
							}}
						>
							If checked, the password will be set even if it doesn't meet the password policy
							requirements. Use with caution - this allows setting weak passwords that may violate
							security policies.
						</p>
					</FormGroup>

					<Button $variant="success" onClick={handleSetPassword} disabled={loading || !password}>
						{loading ? <SpinningIcon /> : <FiCheckCircle />}
						{loading ? 'Setting...' : 'Set Password (Recommended)'}
					</Button>
				</>
			)}
		</Card>
	);
};
