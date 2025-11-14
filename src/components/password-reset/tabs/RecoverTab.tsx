// src/components/password-reset/tabs/RecoverTab.tsx
// Recover Password Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiMail,
} from '../../../services/commonImportsService';
import {
	readPasswordState,
	recoverPassword,
	sendRecoveryCode,
} from '../../../services/passwordResetService';
import { lookupPingOneUser } from '../../../services/pingOneUserProfileService';
import { UserComparisonDisplay, type UserState } from '../../../services/userComparisonService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { CodeGenerator } from '../shared/CodeGenerator';
import { HighlightedSection } from '../shared/HighlightedSection';
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
} from '../shared/PasswordResetSharedComponents';
import { type PingOneUser } from '../shared/useUserLookup';

interface RecoverTabProps {
	environmentId: string;
	workerToken: string;
	onGenerateCode?: () => string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const RecoverTab: React.FC<RecoverTabProps> = ({
	environmentId,
	workerToken,
	onGenerateCode,
	onError,
}) => {
	const [email, setEmail] = React.useState('cmuir@pingone.com');
	const [recoveryCode, setRecoveryCode] = React.useState('');
	const [newPassword, setNewPassword] = React.useState('');
	const [userId, setUserId] = React.useState('');
	const [codeSent, setCodeSent] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [generatedCode, setGeneratedCode] = React.useState('');
	const [beforeState, setBeforeState] = React.useState<UserState | null>(null);
	const [afterState, setAfterState] = React.useState<UserState | null>(null);
	const [currentUser, setCurrentUser] = React.useState<PingOneUser | null>(null);

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

	const handleSendCode = async () => {
		if (!email || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: "Please enter the user's email address and ensure a worker token is configured.",
				suggestion: 'Provide an email address, configure credentials if needed, and try again.',
			});
			return;
		}

		setLoading(true);
		try {
			const trimmedEmail = email.trim();
			if (!trimmedEmail) {
				raiseError({
					title: 'Email Required',
					message: 'Please enter an email address before requesting a recovery code.',
					suggestion: "Type the user's email in the field above and select “Send Recovery Code”.",
				});
				setLoading(false);
				return;
			}

			const result = await lookupPingOneUser({
				environmentId,
				accessToken: workerToken,
				identifier: trimmedEmail,
			});

			if (!result.user || !result.user.id) {
				raiseError({
					title: 'User Not Found',
					message: `No user was found with the email address ${trimmedEmail}.`,
					suggestion:
						'Double-check the email address or try searching with a different identifier.',
				});
				setLoading(false);
				return;
			}

			const foundUserId = result.user.id;
			setUserId(foundUserId);
			setCurrentUser(result.user);

			const sendResult = await sendRecoveryCode({
				environmentId,
				userId: foundUserId,
				workerToken,
			});

			if (sendResult.success) {
				setCodeSent(true);
				v4ToastManager.showSuccess(`Recovery code sent to ${trimmedEmail}`);
			} else {
				raiseError({
					title: 'Unable to Send Recovery Code',
					message: sendResult.errorDescription || 'PingOne was unable to send the recovery code.',
					suggestion:
						'Confirm that the user has valid recovery channels configured and that your worker token has the correct scope.',
				});
			}
		} catch (error) {
			raiseError({
				title: 'Unable to Send Recovery Code',
				message: error instanceof Error ? error.message : 'Failed to send recovery code.',
				suggestion: 'Check network connectivity and verify that the worker token is still valid.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleRecover = async () => {
		if (!userId || !recoveryCode || !newPassword || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: 'Please provide the recovery code and a new password before continuing.',
				suggestion:
					'Enter the recovery code you received and choose a new password that meets policy requirements.',
			});
			return;
		}

		setLoading(true);
		setBeforeState(null);
		setAfterState(null);

		try {
			const passwordStateBefore = await readPasswordState(environmentId, userId, workerToken);
			const beforeUserState: UserState = {
				...(currentUser || { id: userId }),
				passwordState: passwordStateBefore.success ? passwordStateBefore.passwordState : undefined,
			};
			setBeforeState(beforeUserState);

			const result = await recoverPassword(
				environmentId,
				userId,
				workerToken,
				recoveryCode,
				newPassword
			);

			if (result.success) {
				const passwordStateAfter = await readPasswordState(environmentId, userId, workerToken);
				const userLookupResult = await lookupPingOneUser({
					environmentId,
					accessToken: workerToken,
					identifier: userId,
				});
				const afterUserState: UserState = {
					...(userLookupResult.success ? userLookupResult.user : beforeUserState),
					passwordState: passwordStateAfter.success ? passwordStateAfter.passwordState : undefined,
				};
				setAfterState(afterUserState);

				setSuccess(true);
				v4ToastManager.showSuccess(
					'Password recovered successfully! You can now sign in with your new password.'
				);
				setRecoveryCode('');
				setNewPassword('');
				setEmail('');
				setCodeSent(false);
				setUserId('');
				return;
			}

			raiseError({
				title: 'Password Recovery Failed',
				message: result.errorDescription || 'PingOne rejected the password recovery request.',
				suggestion:
					'Confirm the recovery code is still valid and that the new password meets your policy.',
			});
		} catch (error) {
			raiseError({
				title: 'Password Recovery Failed',
				message:
					error instanceof Error
						? error.message
						: 'An unexpected error occurred during password recovery.',
				suggestion:
					'Check network connectivity and verify that the worker token has access to manage passwords.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setEmail('');
		setRecoveryCode('');
		setNewPassword('');
		setUserId('');
		setCodeSent(false);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);
		setCurrentUser(null);
	};

	const handleGenerateCode = () => {
		if (onGenerateCode) {
			setGeneratedCode(onGenerateCode());
		}
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Self-Service Password Recovery
			</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Recovery code (sent via email/SMS) + New password
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
							application/vnd.pingidentity.password.recover+json
						</code>
						<br />
						The Content-Type header tells PingOne this is a password recovery operation. User must
						first request a recovery code, then use it to reset their password.
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
					PingOne API: Password Recovery (Content-Type:
					application/vnd.pingidentity.password.recover+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			{success && (
				<SuccessMessage>
					<SuccessTitle>
						<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
						Password Recovered Successfully!
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
					operationName="password recovery"
				/>
			)}

			{!codeSent && (
				<>
					<Alert $type="info">
						<FiAlertCircle />
						<div>
							<strong>Forgot your password?</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								Enter your email address and we'll send you a recovery code to reset your password.
							</p>
						</div>
					</Alert>

					<FormGroup>
						<Label>Email Address</Label>
						<div style={{ display: 'flex', gap: '0.5rem' }}>
							<Input
								type="email"
								placeholder="Enter your email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								onKeyPress={(e) => e.key === 'Enter' && handleSendCode()}
							/>
							<Button onClick={handleSendCode} disabled={loading || !email}>
								{loading ? <SpinningIcon /> : <FiMail />}
								{loading ? 'Sending...' : 'Send Recovery Code'}
							</Button>
						</div>
					</FormGroup>
				</>
			)}

			{codeSent && (
				<HighlightedSection highlightDuration={8000}>
					<Alert $type="success" style={{ marginTop: 0, border: 'none' }}>
						<FiCheckCircle />
						<div>
							<strong>Recovery code sent!</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								We've sent a recovery code to <strong>{email}</strong>. Please check your email and
								enter the code below.
							</p>
						</div>
					</Alert>

					<FormGroup>
						<Label>Recovery Code</Label>
						<Input
							type="text"
							placeholder="Enter recovery code from email"
							value={recoveryCode}
							onChange={(e) => setRecoveryCode(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && handleRecover()}
						/>
					</FormGroup>

					<PasswordInput
						label="New Password"
						value={newPassword}
						onChange={setNewPassword}
						placeholder="Enter new password"
						required
					/>

					<div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
						<Button
							onClick={handleRecover}
							disabled={loading || !recoveryCode || !newPassword}
							style={{ flex: 1, minWidth: '200px' }}
						>
							{loading ? <SpinningIcon /> : <FiCheckCircle />}
							{loading ? 'Recovering...' : 'Recover Password'}
						</Button>
						<Button
							$variant="secondary"
							onClick={handleSendCode}
							disabled={loading}
							style={{ minWidth: '150px' }}
							title="Resend recovery code to your email"
						>
							<FiMail />
							Resend Code
						</Button>
					</div>

					<div style={{ marginTop: '1rem', textAlign: 'center' }}>
						<Button $variant="secondary" onClick={handleReset} style={{ fontSize: '0.875rem' }}>
							Use Different Email
						</Button>
					</div>
				</HighlightedSection>
			)}

			{onGenerateCode && <CodeGenerator code={generatedCode} onGenerate={handleGenerateCode} />}
		</Card>
	);
};
