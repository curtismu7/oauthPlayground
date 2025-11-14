// src/components/password-reset/tabs/ForceResetTab.tsx
// Force Password Reset Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiExternalLink,
	FiLock,
} from '../../../services/commonImportsService';
import { forcePasswordChange, readPasswordState } from '../../../services/passwordResetService';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { UserComparisonDisplay, type UserState } from '../../../services/userComparisonService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { CodeGenerator } from '../shared/CodeGenerator';
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

interface ForceResetTabProps {
	environmentId: string;
	workerToken: string;
	onGenerateCode?: () => string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const ForceResetTab: React.FC<ForceResetTabProps> = ({
	environmentId,
	workerToken,
	onGenerateCode,
	onError,
}) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
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

	// Debug logging
	React.useEffect(() => {
		console.log('[ForceResetTab] Props received:', {
			environmentId: environmentId ? `${environmentId.substring(0, 8)}...` : 'empty',
			workerToken: workerToken ? `${workerToken.substring(0, 10)}...` : 'empty',
			hasOnGenerateCode: !!onGenerateCode,
		});
	}, [environmentId, workerToken, onGenerateCode]);

	const handleForceReset = async () => {
		if (!user || !user.id || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: 'Select a user first and ensure that worker token credentials are configured.',
				suggestion: 'Use the lookup form above to select a user, then try the operation again.',
			});
			return;
		}

		setLoading(true);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);

		try {
			const passwordStateBefore = await readPasswordState(environmentId, user.id, workerToken);
			const beforeUserState: UserState = {
				...user,
				passwordState: passwordStateBefore.success ? passwordStateBefore.passwordState : undefined,
			};
			setBeforeState(beforeUserState);

			const result = await forcePasswordChange(environmentId, user.id, workerToken);

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
				v4ToastManager.showSuccess('Password change forced successfully');
				return;
			}

			raiseError({
				title: 'Force Password Change Failed',
				message: result.errorDescription || 'PingOne rejected the force password change request.',
				suggestion:
					'Ensure the user is eligible for a forced change and that your worker token has the required scope.',
			});
		} catch (error) {
			raiseError({
				title: 'Force Password Change Failed',
				message: error instanceof Error ? error.message : 'An unexpected error occurred.',
				suggestion: 'Check logs for additional details and verify that PingOne is reachable.',
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
	};

	const handleGenerateCode = () => {
		if (onGenerateCode) {
			setGeneratedCode(onGenerateCode());
		}
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Admin Force Password Reset
			</h2>

			<Alert $type="error" style={{ marginBottom: '1.5rem', borderColor: '#DC2626' }}>
				<FiAlertCircle style={{ color: '#DC2626' }} />
				<div>
					<strong style={{ color: '#DC2626' }}>
						⚠️ Important: This Puts User in Password Change State
					</strong>
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
							application/vnd.pingidentity.password.forceChange+json
						</code>
						<br />
						<strong style={{ color: '#DC2626' }}>⚠️ WARNING:</strong> This operation will force the
						user to change their password on their next sign-on. If you just want to set a password
						without forcing a change, use <strong>"Update Password (Set Value)"</strong> instead.
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
					PingOne API: Force Password Change (Content-Type:
					application/vnd.pingidentity.password.forceChange+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && user && (
				<SuccessMessage>
					<SuccessTitle>
						<FiLock style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Change Forced Successfully!
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
						has been successfully marked for password change.
						<br />
						<br />
						<strong>What was accomplished:</strong>
						<ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, textAlign: 'left' }}>
							<li>The user's account is now in a "password change required" state</li>
							<li>The user will be required to change their password on their next sign-on</li>
							<li>The user cannot access their account until they change their password</li>
						</ul>
						<br />
						<strong>Note:</strong> This is different from setting a password. The user must still
						provide their current password and choose a new one during their next login.
					</SuccessText>
				</SuccessMessage>
			)}

			{success && beforeState && afterState && (
				<UserComparisonDisplay
					before={beforeState}
					after={afterState}
					title="User State Changes"
					operationName="force password change"
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
					<Alert $type="info" style={{ marginTop: '1rem' }}>
						<FiAlertCircle />
						<div>
							<strong>Force Password Change</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								This will require the user to change their password the next time they sign in.
							</p>
						</div>
					</Alert>

					<Button
						$variant="danger"
						onClick={handleForceReset}
						disabled={loading}
						style={{ marginTop: '1rem' }}
					>
						{loading ? <SpinningIcon /> : <FiLock />}
						{loading ? 'Processing...' : 'Force Password Change'}
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

			{onGenerateCode && <CodeGenerator code={generatedCode} onGenerate={handleGenerateCode} />}
		</Card>
	);
};
