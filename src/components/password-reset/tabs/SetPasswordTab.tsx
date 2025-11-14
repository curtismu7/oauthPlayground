// src/components/password-reset/tabs/SetPasswordTab.tsx
// Set Password Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiKey,
} from '../../../services/commonImportsService';
import {
	readPasswordState,
	setPassword as setPasswordService,
} from '../../../services/passwordResetService';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { UserComparisonDisplay, type UserState } from '../../../services/userComparisonService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { HighlightedSection } from '../shared/HighlightedSection';
import { PasswordInput } from '../shared/PasswordInput';
import { PasswordOptions } from '../shared/PasswordOptions';
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

interface SetPasswordTabProps {
	environmentId: string;
	workerToken: string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const SetPasswordTab: React.FC<SetPasswordTabProps> = ({
	environmentId,
	workerToken,
	onError,
}) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
	const [password, setPassword] = React.useState('');
	const [forceChange, setForceChange] = React.useState(false);
	const [bypassPolicy, setBypassPolicy] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
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

	const handleSetPassword = async () => {
		if (!user || !user.id || !password || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: 'Select a user and provide a new password before setting it.',
				suggestion:
					'Use the lookup form to select a user, then enter the password you want to set.',
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

			const result = await setPasswordService(environmentId, user.id, workerToken, password, {
				forceChange,
				bypassPasswordPolicy: bypassPolicy,
			});

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
				const message = forceChange
					? 'Password set successfully! User will be required to change password on next sign-on.'
					: 'Password set successfully!';
				v4ToastManager.showSuccess(message);
				setPassword('');
				return;
			}

			raiseError({
				title: 'Password Set Failed',
				message: result.errorDescription || 'PingOne rejected the set password request.',
				suggestion: bypassPolicy
					? 'Confirm the worker token has permission to bypass password policy requirements.'
					: 'Ensure the new password satisfies your password policy or enable “Bypass policy”.',
			});
		} catch (error) {
			raiseError({
				title: 'Password Set Failed',
				message: error instanceof Error ? error.message : 'An unexpected error occurred.',
				suggestion: 'Verify connectivity to PingOne and ensure the selected user still exists.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setUser(null);
		setPassword('');
		setForceChange(false);
		setBypassPolicy(false);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>Set Password</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
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
							application/vnd.pingidentity.password.set+json
						</code>
						<br />
						General password set operation. Admin operation to set a user's password.
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
					PingOne API: Set Password (Content-Type: application/vnd.pingidentity.password.set+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && user && (
				<SuccessMessage>
					<SuccessTitle>
						<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Set Successfully!
					</SuccessTitle>
					<SuccessText>
						The password for{' '}
						<strong>
							{user.name?.given ||
								user.name?.family ||
								user.username ||
								user.email ||
								'the selected user'}
						</strong>{' '}
						has been successfully set.
						<br />
						<br />
						<strong>What was accomplished:</strong>
						<ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, textAlign: 'left' }}>
							<li>The user's password has been updated to the new password you provided</li>
							{forceChange && (
								<li>The user will be required to change their password on their next sign-on</li>
							)}
							{!forceChange && <li>The user can sign in immediately with the new password</li>}
							{bypassPolicy && (
								<li>Password policy requirements were bypassed for this operation</li>
							)}
						</ul>
					</SuccessText>
				</SuccessMessage>
			)}

			{success && beforeState && afterState && (
				<UserComparisonDisplay
					before={beforeState}
					after={afterState}
					title="User State Changes"
					operationName="set password"
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
				<HighlightedSection highlightDuration={6000}>
					<PasswordInput
						label="New Password"
						value={password}
						onChange={setPassword}
						placeholder="Enter new password"
						required
					/>

					<PasswordOptions
						forceChange={forceChange}
						bypassPolicy={bypassPolicy}
						onForceChangeChange={setForceChange}
						onBypassPolicyChange={setBypassPolicy}
					/>

					<Button
						onClick={handleSetPassword}
						disabled={loading || !password}
						style={{ marginTop: '1rem' }}
					>
						{loading ? <SpinningIcon /> : <FiKey />}
						{loading ? 'Setting...' : 'Set Password'}
					</Button>
					<Button
						$variant="secondary"
						onClick={handleReset}
						style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
					>
						Reset
					</Button>
				</HighlightedSection>
			)}
		</Card>
	);
};
