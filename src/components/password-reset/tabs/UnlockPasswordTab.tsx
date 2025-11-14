// src/components/password-reset/tabs/UnlockPasswordTab.tsx
// Unlock Password Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiKey,
} from '../../../services/commonImportsService';
import { readPasswordState, unlockPassword } from '../../../services/passwordResetService';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { UserComparisonDisplay, type UserState } from '../../../services/userComparisonService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { PasswordResetErrorInfo } from '../shared/PasswordResetErrorModal';
import {
	Alert,
	Button,
	Card,
	DocumentationLink,
	DocumentationSection,
	SpinningIcon,
	SuccessMessage,
	SuccessText,
	SuccessTitle,
} from '../shared/PasswordResetSharedComponents';
import { UserLookupForm } from '../shared/UserLookupForm';
import { type PingOneUser } from '../shared/useUserLookup';
import { PasswordOperationSuccessModal } from '../shared/PasswordOperationSuccessModal';

interface UnlockPasswordTabProps {
	environmentId: string;
	workerToken: string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const UnlockPasswordTab: React.FC<UnlockPasswordTabProps> = ({
	environmentId,
	workerToken,
	onError,
}) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [beforeState, setBeforeState] = React.useState<UserState | null>(null);
	const [afterState, setAfterState] = React.useState<UserState | null>(null);
	const [showSuccessModal, setShowSuccessModal] = React.useState(false);

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

	const handleUnlock = async () => {
		if (!user || !user.id || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: 'Please look up a user before attempting to unlock their account.',
				suggestion: 'Use the lookup form to select a user, then try unlocking the password.',
			});
			return;
		}

		setLoading(true);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);

		try {
			console.log('[UnlockPasswordTab] Unlocking password for user:', {
				userId: user.id,
				environmentId: `${environmentId?.substring(0, 20)}...`,
				hasWorkerToken: !!workerToken,
			});

			const passwordStateBefore = await readPasswordState(environmentId, user.id, workerToken);
			const beforeUserState: UserState = {
				...user,
				passwordState: passwordStateBefore.success ? passwordStateBefore.passwordState : undefined,
			};
			setBeforeState(beforeUserState);

			const result = await unlockPassword(environmentId, user.id, workerToken);
			console.log('[UnlockPasswordTab] Unlock result:', result);

			if (result.success) {
				const passwordStateAfter = await readPasswordState(environmentId, user.id, workerToken);
				const userLookupResult = await lookupPingOneUser({
					environmentId,
					accessToken: workerToken,
					identifier: user.id,
				});
				const afterUserState: UserState = {
					...(userLookupResult.success ? userLookupResult.user : user),
					passwordState: passwordStateAfter.success ? passwordStateAfter.passwordState : undefined,
				};
				setAfterState(afterUserState);

				setSuccess(true);
				setShowSuccessModal(true);
				v4ToastManager.showSuccess(
					`Password unlocked successfully for ${user.name?.given || user.username || user.email || 'user'}!`
				);
				return;
			}

			const errorMsg = result.errorDescription || result.error || 'Password unlock failed';
			console.error('[UnlockPasswordTab] Unlock failed:', errorMsg);
			raiseError({
				title: 'Password Unlock Failed',
				message: errorMsg,
				suggestion:
					'Confirm the user is currently locked and that your worker token has the required permissions.',
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Password unlock failed';
			console.error('[UnlockPasswordTab] Unlock error:', error);
			raiseError({
				title: 'Password Unlock Failed',
				message: errorMessage,
				suggestion: 'Check network connectivity and ensure PingOne services are available.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setUser(null);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);
		setShowSuccessModal(false);
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Unlock Password
			</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Worker token (admin operation)
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
							application/vnd.pingidentity.password.unlock
						</code>
						<br />
						Unlock a user's account that has been locked due to failed login attempts. This is an
						admin operation.
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
					PingOne API: Unlock Password
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && user && (
				<SuccessMessage>
					<SuccessTitle>
						<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Unlocked Successfully!
					</SuccessTitle>
					<SuccessText>
						The user account for{' '}
						<strong>
							{user.name?.given ||
								user.name?.family ||
								user.username ||
								user.email ||
								'the selected user'}
						</strong>{' '}
						has been successfully unlocked.
						<br />
						<br />
						<strong>What was accomplished:</strong>
						<ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, textAlign: 'left' }}>
							<li>The user's account is no longer locked</li>
							<li>The user can now sign in with their credentials</li>
							<li>Failed login attempt counters have been reset</li>
						</ul>
					</SuccessText>
				</SuccessMessage>
			)}

			{success && beforeState && afterState && (
				<UserComparisonDisplay
					before={beforeState}
					after={afterState}
					title="User State Changes"
					operationName="password unlock"
				/>
			)}

			<UserLookupForm
				environmentId={environmentId}
				workerToken={workerToken}
				onUserFound={(foundUser) => {
					setUser(foundUser);
					setSuccess(false); // Clear success message when new user is found
				}}
			/>

			{user?.id && (
				<>
					<Button
						$variant="danger"
						onClick={handleUnlock}
						disabled={loading}
						style={{ marginTop: '1rem' }}
					>
						{loading ? <SpinningIcon /> : <FiKey />}
						{loading ? 'Unlocking...' : 'Unlock Password'}
					</Button>
					<Button
						$variant="secondary"
						onClick={handleReset}
						style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
					>
						Reset
					</Button>
				</>
			)}

			{showSuccessModal && user && (
				<PasswordOperationSuccessModal
					user={user}
					operationType="unlock"
					onClose={() => setShowSuccessModal(false)}
				/>
			)}
		</Card>
	);
};
