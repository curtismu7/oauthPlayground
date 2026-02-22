/**
 * @file EnrollFido2.tsx
 * @module features/mfa
 * @description FIDO2 device enrollment component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { DebugPanel } from '@/samples/p1mfa/shared/DebugPanel';
import { StatusDisplay } from '@/samples/p1mfa/shared/StatusDisplay';
import { type DeviceRegistrationResult, FIDO2Helper, P1MFASDK } from '@/sdk/p1mfa';
import { credentialToJson, jsonToCreationOptions } from './webauthn';

interface EnrollFido2Props {
	sdk: P1MFASDK;
	userId: string;
	policyId: string;
	onDeviceRegistered?: () => void;
}

export const EnrollFido2: React.FC<EnrollFido2Props> = ({
	sdk,
	userId,
	policyId,
	onDeviceRegistered,
}) => {
	const [step, setStep] = useState<'input' | 'registering' | 'webauthn' | 'activating' | 'success'>(
		'input'
	);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [deviceId, setDeviceId] = useState<string>();
	const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult>();
	const [correlationId, setCorrelationId] = useState<string>();
	const [webauthnCredential, setWebauthnCredential] = useState<string>();

	const stateMachineStatus =
		step === 'input'
			? 'IDLE'
			: step === 'registering'
				? 'DEVICE_CREATION_PENDING'
				: step === 'webauthn'
					? 'WEBAUTHN_REGISTRATION_REQUIRED'
					: step === 'activating'
						? 'DEVICE_ACTIVATION_PENDING'
						: step === 'success'
							? 'DEVICE_ACTIVE'
							: 'ERROR';

	const handleRegister = async () => {
		if (!userId || !policyId) {
			setError(new Error('User ID and Policy ID are required'));
			setStatus('error');
			return;
		}

		setStep('registering');
		setStatus('loading');
		setMessage('Registering FIDO2 device...');
		setError(undefined);

		try {
			const result = await FIDO2Helper.registerFIDO2Device(sdk, {
				userId,
				type: 'FIDO2',
				policy: policyId,
			});

			setRegistrationResult(result);
			setDeviceId(result.deviceId);
			setCorrelationId(result.deviceId);
			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/register-device',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					type: 'FIDO2',
					policy: { id: policyId },
					workerToken: '***REDACTED***',
				},
			});
			setResponse(result);
			setStep('webauthn');
			setStatus('success');
			setMessage('Device registered. Now create WebAuthn credential...');
		} catch (err) {
			setError(err);
			setStatus('error');
			setStep('input');
		}
	};

	const handleCreateCredential = async () => {
		if (!registrationResult?.publicKeyCredentialCreationOptions) {
			setError(new Error('Device registration options not available'));
			setStatus('error');
			return;
		}

		setStep('webauthn');
		setStatus('loading');
		setMessage('Creating WebAuthn credential...');
		setError(undefined);

		try {
			// Parse and convert PingOne's options
			const creationOptions = jsonToCreationOptions(
				registrationResult.publicKeyCredentialCreationOptions
			);

			// Create WebAuthn credential
			const credential = await FIDO2Helper.createWebAuthnCredential(creationOptions);

			// Convert credential to JSON for copy button
			const credentialJson = JSON.stringify(credentialToJson(credential), null, 2);
			setWebauthnCredential(credentialJson);

			setRequest({
				action: 'navigator.credentials.create',
				options: creationOptions,
			});
			setResponse({ credentialId: credential.id, type: credential.type });

			// Activate device with credential
			setStep('activating');
			setMessage('Activating device with WebAuthn credential...');

			await FIDO2Helper.activateFIDO2Device(sdk, {
				userId,
				deviceId: deviceId!,
				fido2Credential: credential,
			});

			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/activate-fido2-device',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					deviceId,
					attestation: '***REDACTED***',
					workerToken: '***REDACTED***',
				},
			});
			setResponse({ message: 'Device activated successfully' });
			setStatus('success');
			setStep('success');
			setMessage('FIDO2 device enrolled and activated successfully!');
			onDeviceRegistered?.();
		} catch (err) {
			setError(err);
			setStatus('error');
		}
	};

	if (step === 'success') {
		return (
			<div>
				<StatusDisplay status={status} message={message} request={request} response={response} />
				<DebugPanel
					request={
						request as {
							method?: string;
							url?: string;
							headers?: Record<string, string>;
							body?: unknown;
						}
					}
					response={response}
					correlationId={correlationId}
					stateMachineStatus={stateMachineStatus}
					copyableValues={{
						deviceId: deviceId || '',
						userId,
						webauthnCredential: webauthnCredential || '',
					}}
				/>
				<button
					type="button"
					onClick={() => {
						setStep('input');
						setStatus('idle');
						setDeviceId(undefined);
						setRegistrationResult(undefined);
					}}
					style={{
						marginTop: '1rem',
						padding: '0.75rem 1.5rem',
						backgroundColor: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Enroll Another Device
				</button>
			</div>
		);
	}

	return (
		<div>
			<h2>FIDO2 Device Enrollment</h2>

			{step === 'input' && (
				<div>
					<button
						type="button"
						onClick={handleRegister}
						disabled={!userId || !policyId}
						style={{
							padding: '0.75rem 1.5rem',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: userId && policyId ? 'pointer' : 'not-allowed',
							opacity: userId && policyId ? 1 : 0.5,
						}}
					>
						Register FIDO2 Device
					</button>
				</div>
			)}

			{step === 'registering' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={
							request as {
								method?: string;
								url?: string;
								headers?: Record<string, string>;
								body?: unknown;
							}
						}
						response={response}
						correlationId={correlationId}
						stateMachineStatus={stateMachineStatus}
						copyableValues={deviceId ? { deviceId, userId } : { userId }}
					/>
				</div>
			)}

			{step === 'webauthn' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={
							request as {
								method?: string;
								url?: string;
								headers?: Record<string, string>;
								body?: unknown;
							}
						}
						response={response}
						correlationId={correlationId}
						stateMachineStatus={stateMachineStatus}
						copyableValues={{
							deviceId: deviceId || '',
							userId,
						}}
					/>
					<button
						type="button"
						onClick={handleCreateCredential}
						style={{
							marginTop: '1rem',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#28a745',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Create WebAuthn Credential
					</button>
				</div>
			)}

			{step === 'activating' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={
							request as {
								method?: string;
								url?: string;
								headers?: Record<string, string>;
								body?: unknown;
							}
						}
						response={response}
						correlationId={correlationId}
						stateMachineStatus={stateMachineStatus}
						copyableValues={{
							deviceId: deviceId || '',
							userId,
							webauthnCredential: webauthnCredential || '',
						}}
					/>
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
