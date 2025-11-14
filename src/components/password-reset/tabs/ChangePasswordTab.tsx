// src/components/password-reset/tabs/ChangePasswordTab.tsx
// Change Password Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiLogIn,
} from '../../../services/commonImportsService';
import { changePassword, readPasswordState } from '../../../services/passwordResetService';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { UserComparisonDisplay, type UserState } from '../../../services/userComparisonService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { CodeGenerator } from '../shared/CodeGenerator';
import { PasswordInput } from '../shared/PasswordInput';
import { PasswordResetErrorInfo } from '../shared/PasswordResetErrorModal';
import {
	Alert,
	Button,
	Card,
	DocumentationLink,
	DocumentationSection,
	FormGroup,
	Input,
	Label,
	SpinningIcon,
	SuccessMessage,
	SuccessText,
	SuccessTitle,
	UserAvatar,
	UserCard,
	UserInfo,
} from '../shared/PasswordResetSharedComponents';

interface ChangePasswordTabProps {
	environmentId: string;
	userId: string;
	userAccessToken: string;
	userInfo: { name?: string; username?: string; email?: string } | null;
	onLoginClick: () => void;
	onGenerateCode?: () => string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const ChangePasswordTab: React.FC<ChangePasswordTabProps> = ({
	environmentId,
	userId,
	userAccessToken,
	userInfo,
	onLoginClick,
	onGenerateCode,
	onError,
}) => {
	const [oldPassword, setOldPassword] = React.useState('');
	const [newPassword, setNewPassword] = React.useState('');
	const [confirmPassword, setConfirmPassword] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [generatedCode, setGeneratedCode] = React.useState('');
	const [beforeState, setBeforeState] = React.useState<UserState | null>(null);
	const [afterState, setAfterState] = React.useState<UserState | null>(null);

	const raiseError = React.useCallback(
		(info: PasswordResetErrorInfo) => {
			onError?.(info);
			if (info.severity === 'warning') {
				v4ToastManager.showWarning(info.message);
				return;
			}
			v4ToastManager.showError(info.message);
		},
		[onError]
	);

	const handleChangePassword = async () => {
		if (!oldPassword || !newPassword || !confirmPassword) {
			raiseError({
				title: 'Missing Information',
				message: 'Please provide your current password and the new password in both fields.',
				suggestion: 'Fill out every password field before changing the password.',
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			raiseError({
				title: 'Passwords Do Not Match',
				message: 'The new password and confirmation password must match exactly.',
				suggestion: 'Re-enter the new password in both fields to make sure they match.',
				severity: 'warning',
			});
			return;
		}

		if (!userId || !userAccessToken || !environmentId) {
			raiseError({
				title: 'Sign In Required',
				message: 'Please sign in so we can use your access token to change the password.',
				suggestion: 'Select “Sign In to Change Password” and authenticate before trying again.',
			});
			return;
		}

		setLoading(true);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);

		try {
			const passwordStateBefore = await readPasswordState(environmentId, userId, userAccessToken);
			const userLookupBefore = await lookupPingOneUser({
				environmentId,
				accessToken: userAccessToken,
				identifier: userId,
			});
			const beforeUserState: UserState = {
				...(userLookupBefore.success ? userLookupBefore.user : { id: userId, ...userInfo }),
				passwordState: passwordStateBefore.success ? passwordStateBefore.passwordState : undefined,
			};
			setBeforeState(beforeUserState);

			const result = await changePassword(
				environmentId,
				userId,
				userAccessToken,
				oldPassword,
				newPassword
			);

			if (result.success) {
				const passwordStateAfter = await readPasswordState(environmentId, userId, userAccessToken);
				const userLookupAfter = await lookupPingOneUser({
					environmentId,
					accessToken: userAccessToken,
					identifier: userId,
				});
				const afterUserState: UserState = {
					...(userLookupAfter.success ? userLookupAfter.user : beforeUserState),
					passwordState: passwordStateAfter.success ? passwordStateAfter.passwordState : undefined,
				};
				setAfterState(afterUserState);

				setSuccess(true);
				v4ToastManager.showSuccess('Password changed successfully!');
				setOldPassword('');
				setNewPassword('');
				setConfirmPassword('');
				return;
			}

			raiseError({
				title: 'Password Change Failed',
				message: result.errorDescription || 'PingOne rejected the password change request.',
				suggestion:
					'Confirm that the current password is correct and that the new password meets your policy.',
			});
		} catch (error) {
			raiseError({
				title: 'Password Change Failed',
				message:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred while changing the password.',
				suggestion: 'Check your network connection and confirm that your session is still valid.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateCode = () => {
		if (onGenerateCode) {
			setGeneratedCode(onGenerateCode());
		}
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Change Password
			</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> User access token (from OAuth login) + Old password + New
						password
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
							application/vnd.pingidentity.password.change+json
						</code>
						<br />
						For authenticated users who know their current password. Requires the user's access
						token (obtained from OAuth login), not a worker token. The user must provide their
						current password to verify identity before changing to a new password.
					</p>
				</div>
			</Alert>

			{!userAccessToken && (
				<>
					<Alert $type="info">
						<FiAlertCircle />
						<div>
							<strong>Authentication Required</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								Please sign in first to change your password. This operation requires your user
								access token.
							</p>
						</div>
					</Alert>
					<div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
						<Button onClick={onLoginClick}>
							<FiLogIn />
							Sign In to Change Password
						</Button>
					</div>
				</>
			)}

			{userInfo && (
				<UserCard
					style={{
						marginBottom: '1.5rem',
						background: 'linear-gradient(135deg, #EBF4FF 0%, #E0F2FE 100%)',
						border: '2px solid #3B82F6',
						boxShadow:
							'0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)',
					}}
				>
					<UserInfo>
						<UserAvatar
							style={{
								background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
								color: 'white',
								fontSize: '1.25rem',
								width: '3rem',
								height: '3rem',
							}}
						>
							{(userInfo.name || userInfo.username || '').charAt(0).toUpperCase()}
						</UserAvatar>
						<div style={{ flex: 1 }}>
							<div
								style={{
									fontWeight: 700,
									color: '#1E40AF',
									marginBottom: '0.25rem',
									fontSize: '1.1rem',
								}}
							>
								{userInfo.name || userInfo.username}
							</div>
							<div
								style={{
									fontSize: '0.9rem',
									color: '#1F2937',
									marginBottom: '0.5rem',
									fontWeight: 500,
								}}
							>
								📧 {userInfo.email}
							</div>
							<div
								style={{
									fontSize: '0.8rem',
									color: '#374151',
									fontFamily: 'monospace',
									background: 'rgba(255, 255, 255, 0.7)',
									padding: '0.5rem',
									borderRadius: '0.375rem',
									border: '1px solid rgba(59, 130, 246, 0.2)',
								}}
							>
								<strong style={{ color: '#1E40AF' }}>Username:</strong> {userInfo.username || 'N/A'}{' '}
								• <strong style={{ color: '#1E40AF' }}>User ID:</strong> {userId || 'N/A'}
							</div>
						</div>
					</UserInfo>
				</UserCard>
			)}

			<DocumentationSection>
				<DocumentationLink
					href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#post-environments-environmentid-users-userid-password"
					target="_blank"
					rel="noopener noreferrer"
				>
					<FiBook />
					PingOne API: Change Password (Content-Type:
					application/vnd.pingidentity.password.change+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && (
				<SuccessMessage>
					<SuccessTitle>
						<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Changed Successfully!
					</SuccessTitle>
					<SuccessText>
						Your password has been updated. You can now sign in with your new password.
					</SuccessText>
				</SuccessMessage>
			)}

			{success && beforeState && afterState && (
				<UserComparisonDisplay
					before={beforeState}
					after={afterState}
					title="User State Changes"
					operationName="change password"
				/>
			)}

			{userAccessToken && (
				<>
					<PasswordInput
						label="Current Password"
						value={oldPassword}
						onChange={setOldPassword}
						placeholder="Enter your current password"
						required
					/>

					<PasswordInput
						label="New Password"
						value={newPassword}
						onChange={setNewPassword}
						placeholder="Enter new password"
						required
					/>

					<FormGroup>
						<Label>Confirm New Password</Label>
						<Input
							type="password"
							placeholder="Confirm new password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</FormGroup>

					<Button
						onClick={handleChangePassword}
						disabled={loading || !oldPassword || !newPassword || !confirmPassword}
						style={{ marginTop: '1rem' }}
					>
						{loading ? <SpinningIcon /> : <FiCheckCircle />}
						{loading ? 'Changing...' : 'Change Password'}
					</Button>
				</>
			)}

			{onGenerateCode && <CodeGenerator code={generatedCode} onGenerate={handleGenerateCode} />}
		</Card>
	);
};
