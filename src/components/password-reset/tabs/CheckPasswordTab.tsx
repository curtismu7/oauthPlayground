// src/components/password-reset/tabs/CheckPasswordTab.tsx
// Check Password Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiKey,
} from '../../../services/commonImportsService';
import { checkPassword } from '../../../services/passwordResetService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { PasswordInput } from '../shared/PasswordInput';
import { PasswordOperationSuccessModal } from '../shared/PasswordOperationSuccessModal';
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

interface CheckPasswordTabProps {
	environmentId: string;
	workerToken: string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const CheckPasswordTab: React.FC<CheckPasswordTabProps> = ({
	environmentId,
	workerToken,
	onError,
}) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
	const [passwordValue, setPasswordValue] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const [result, setResult] = React.useState<{ valid?: boolean; message?: string } | null>(null);
	const [showSuccessModal, setShowSuccessModal] = React.useState(false);

	const raiseError = React.useCallback(
		(info: PasswordResetErrorInfo, toast: 'error' | 'warning' = 'error') => {
			onError?.(info);
			if (toast === 'warning') {
				v4ToastManager.showWarning(info.message);
				return;
			}
			v4ToastManager.showError(info.message);
		},
		[onError]
	);

	const handleCheckPassword = async () => {
		if (!user || !user.id || !passwordValue || !workerToken || !environmentId) {
			raiseError({
				title: 'Missing Information',
				message: 'Please select a user and provide a password before running the check.',
				suggestion: 'Look up the user, then enter the password you want to validate.',
			});
			return;
		}

		setLoading(true);
		setResult(null);
		try {
			const checkResult = await checkPassword(environmentId, user.id, workerToken, passwordValue);
			if (checkResult.success) {
				if (checkResult.valid === false) {
					const message = checkResult.message || 'The provided password does not match';
					const failuresMsg = checkResult.failuresRemaining
						? ` (${checkResult.failuresRemaining} attempts remaining)`
						: '';
					const fullMessage = `${message}${failuresMsg}`;
					setResult({ valid: false, message: fullMessage });
					raiseError(
						{
							title: 'Password Does Not Match',
							message: fullMessage,
							suggestion:
								'Ask the user to re-enter their password carefully. If they have forgotten it, initiate a password recovery flow.',
							severity: 'warning',
						},
						'warning'
					);
					return;
				}

				setResult({ valid: true, message: checkResult.message || 'Password is correct' });
				setShowSuccessModal(true);
				v4ToastManager.showSuccess('Password is correct');
				return;
			}

			setResult({ valid: false, message: checkResult.errorDescription || 'Password check failed' });
			raiseError({
				title: 'Password Check Failed',
				message: checkResult.errorDescription || 'The password check request was not successful.',
				suggestion: 'Verify that the worker token and environment ID are valid, then try again.',
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Password check failed';
			setResult({ valid: false, message: errorMessage });
			raiseError({
				title: 'Password Check Failed',
				message: errorMessage,
				suggestion: 'Ensure the user still exists and that you have the correct permissions.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setUser(null);
		setPasswordValue('');
		setResult(null);
		setShowSuccessModal(false);
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Check Password
			</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Worker token + Password to verify
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
							application/vnd.pingidentity.password.check+json
						</code>
						<br />
						<strong>⚠️ Important:</strong> This operation only <strong>verifies</strong> if a
						password matches the user's current password. It does <strong>NOT</strong> change the
						password, force a password change, or unlock the account. Use this to validate a
						password before allowing password changes.
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
					PingOne API: Check Password (Content-Type:
					application/vnd.pingidentity.password.check+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			<UserLookupForm
				environmentId={environmentId}
				workerToken={workerToken}
				onUserFound={(foundUser) => {
					setUser(foundUser);
					setResult(null); // Clear previous result when new user is found
				}}
			/>

			{user?.id && (
				<>
					<PasswordInput
						label="Password to Verify"
						value={passwordValue}
						onChange={setPasswordValue}
						placeholder="Enter password to check"
						required
					/>

					{result &&
						(result.valid ? (
							<SuccessMessage>
								<SuccessTitle>
									<FiCheckCircle style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
									Password Check Successful!
								</SuccessTitle>
								<SuccessText>
									The password you provided matches the user's current password. The password is
									valid and correct.
									{result.message && (
										<div style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.9 }}>
											{result.message}
										</div>
									)}
								</SuccessText>
							</SuccessMessage>
						) : (
							<Alert $type="error">
								<FiAlertCircle />
								<div>
									<strong>Password Check Failed</strong>
									{result.message && (
										<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>{result.message}</p>
									)}
									<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
										The password you provided does not match the user's current password. Please
										verify the password and try again.
									</p>
								</div>
							</Alert>
						))}

					<Button
						onClick={handleCheckPassword}
						disabled={loading || !passwordValue}
						style={{ marginTop: '1rem' }}
					>
						{loading ? <SpinningIcon /> : <FiKey />}
						{loading ? 'Checking...' : 'Check Password'}
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
					operationType="check"
					onClose={() => setShowSuccessModal(false)}
				/>
			)}
		</Card>
	);
};
