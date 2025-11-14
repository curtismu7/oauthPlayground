// src/components/password-reset/tabs/LdapGatewayTab.tsx
// LDAP Gateway Password Set Tab Component

import React from 'react';
import {
	FiAlertCircle,
	FiBook,
	FiCheckCircle,
	FiExternalLink,
	FiKey,
} from '../../../services/commonImportsService';
import { setPasswordLdapGateway } from '../../../services/passwordResetService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { PasswordInput } from '../shared/PasswordInput';
import { PasswordOptions } from '../shared/PasswordOptions';
import { PasswordResetErrorInfo } from '../shared/PasswordResetErrorModal';
import { PasswordOperationSuccessModal } from '../shared/PasswordOperationSuccessModal';
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
} from '../shared/PasswordResetSharedComponents';
import { UserLookupForm } from '../shared/UserLookupForm';
import { type PingOneUser } from '../shared/useUserLookup';

interface LdapGatewayTabProps {
	environmentId: string;
	workerToken: string;
	onError?: (error: PasswordResetErrorInfo) => void;
}

export const LdapGatewayTab: React.FC<LdapGatewayTabProps> = ({
	environmentId,
	workerToken,
	onError,
}) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
	const [password, setPassword] = React.useState('');
	const [gatewayId, setGatewayId] = React.useState('');
	const [forceChange, setForceChange] = React.useState(false);
	const [bypassPolicy, setBypassPolicy] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [beforeState, setBeforeState] = React.useState<PingOneUser | null>(null);
	const [afterState, setAfterState] = React.useState<PingOneUser | null>(null);

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
				message:
					'Select a user, enter the new password, and ensure credentials are configured before continuing.',
				suggestion:
					'Use the lookup form to select a user and provide the password you want to set.',
			});
			return;
		}

		setLoading(true);
		setSuccess(false);
		setBeforeState(user);
		try {
			const result = await setPasswordLdapGateway(
				environmentId,
				user.id,
				workerToken,
				password,
				gatewayId || undefined,
				{
					forceChange,
					bypassPasswordPolicy: bypassPolicy,
				}
			);
			if (result.success) {
				setAfterState(result.user || null);
				setSuccess(true);
				const message = forceChange
					? 'Password set successfully via LDAP Gateway! User will be required to change password on next sign-on.'
					: 'Password set successfully via LDAP Gateway!';
				v4ToastManager.showSuccess(message);
				setPassword('');
				return;
			}

			raiseError({
				title: 'LDAP Gateway Password Update Failed',
				message:
					result.errorDescription || 'PingOne rejected the LDAP Gateway password update request.',
				suggestion:
					'Ensure the LDAP Gateway ID is correct (if provided) and that the worker token has the required scope.',
			});
		} catch (error) {
			raiseError({
				title: 'LDAP Gateway Password Update Failed',
				message: error instanceof Error ? error.message : 'An unexpected error occurred.',
				suggestion: 'Verify network connectivity and confirm the LDAP Gateway is reachable.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setUser(null);
		setPassword('');
		setGatewayId('');
		setForceChange(false);
		setBypassPolicy(false);
		setSuccess(false);
		setBeforeState(null);
		setAfterState(null);
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>
				Set Password via LDAP Gateway
			</h2>

			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Worker token + New password + (Optional) LDAP Gateway ID
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
							application/vnd.pingidentity.password.ldap-gateway+json
						</code>
						<br />
						Set a user's password via an LDAP Gateway. This is useful when integrating with LDAP
						directories.
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
					PingOne API: Set Password via LDAP Gateway (Content-Type:
					application/vnd.pingidentity.password.ldap-gateway+json)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			<PasswordOperationSuccessModal
				isOpen={success}
				onClose={() => setSuccess(false)}
				operation="Set Password via LDAP Gateway"
				beforeState={beforeState}
				afterState={afterState}
			/>

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
					<FormGroup>
						<Label>LDAP Gateway ID (Optional)</Label>
						<Input
							type="text"
							placeholder="Enter LDAP Gateway ID (optional)"
							value={gatewayId}
							onChange={(e) => setGatewayId(e.target.value)}
						/>
					</FormGroup>

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
						{loading ? 'Setting...' : 'Set Password via LDAP Gateway'}
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
		</Card>
	);
};
