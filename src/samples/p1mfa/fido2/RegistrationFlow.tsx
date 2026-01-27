/**
 * @file RegistrationFlow.tsx
 * @module samples/p1mfa/fido2
 * @description FIDO2 device registration flow component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { type DeviceRegistrationResult, FIDO2Helper, P1MFASDK } from '@/sdk/p1mfa';
import { DebugPanel } from '../shared/DebugPanel';
import { StatusDisplay } from '../shared/StatusDisplay';

interface RegistrationFlowProps {
	sdk: P1MFASDK;
	userId: string;
	onDeviceRegistered?: () => void;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
	sdk,
	userId,
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
	const [policyId, setPolicyId] = useState('');
	const [registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult>();
	const [correlationId, setCorrelationId] = useState<string>();
	const [webauthnCredential, setWebauthnCredential] = useState<string>();

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
			// Step 1: Register device with PingOne
			const result = await FIDO2Helper.registerFIDO2Device(sdk, {
				userId,
				type: 'FIDO2',
				policy: policyId,
			});

			setRegistrationResult(result);
			setDeviceId(result.deviceId);
			// Extract correlation ID from response headers if available
			const corrId = result.device?.id || `device-${Date.now()}`;
			setCorrelationId(corrId);
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
			// Step 2: Parse and convert PingOne's options
			let creationOptions: PublicKeyCredentialCreationOptions;
			try {
				const optionsStr =
					typeof registrationResult.publicKeyCredentialCreationOptions === 'string'
						? registrationResult.publicKeyCredentialCreationOptions
						: JSON.stringify(registrationResult.publicKeyCredentialCreationOptions);
				creationOptions = JSON.parse(optionsStr);
			} catch (parseError) {
				throw new Error('Failed to parse device creation options');
			}

			// Convert byte arrays to Uint8Array
			const toUint8Array = (arr: number[]): Uint8Array => new Uint8Array(arr);

			if (Array.isArray(creationOptions.challenge)) {
				creationOptions.challenge = toUint8Array(creationOptions.challenge) as BufferSource;
			}

			if (creationOptions.user && Array.isArray(creationOptions.user.id)) {
				creationOptions.user.id = toUint8Array(creationOptions.user.id) as BufferSource;
			}

			if (Array.isArray(creationOptions.excludeCredentials)) {
				creationOptions.excludeCredentials = creationOptions.excludeCredentials.map(
					(cred: PublicKeyCredentialDescriptor) => ({
						...cred,
						id: Array.isArray(cred.id) ? (toUint8Array(cred.id) as BufferSource) : cred.id,
					})
				) as PublicKeyCredentialDescriptor[];
			}

			// Step 3: Create WebAuthn credential
			const credential = await FIDO2Helper.createWebAuthnCredential(creationOptions);

			// Convert credential to JSON for copy button
			const credentialJson = JSON.stringify(
				{
					id: credential.id,
					type: credential.type,
					rawId: Array.from(new Uint8Array(credential.rawId)),
					response: {
						clientDataJSON: Array.from(
							new Uint8Array(
								(credential.response as AuthenticatorAttestationResponse).clientDataJSON
							)
						),
						attestationObject: Array.from(
							new Uint8Array(
								(credential.response as AuthenticatorAttestationResponse).attestationObject
							)
						),
					},
				},
				null,
				2
			);
			setWebauthnCredential(credentialJson);

			setRequest({
				action: 'navigator.credentials.create',
				options: creationOptions,
			});
			setResponse({ credentialId: credential.id, type: credential.type });

			// Step 4: Activate device with credential
			setStep('activating');
			setMessage('Activating device with WebAuthn credential...');

			await FIDO2Helper.activateFIDO2Device(sdk, {
				userId,
				deviceId: deviceId!,
				fido2Credential: credential,
			});

			setStatus('success');
			setStep('success');
			setMessage('FIDO2 device registered and activated successfully!');
			onDeviceRegistered?.();
		} catch (err) {
			setError(err);
			setStatus('error');
		}
	};

	// State machine status mapping
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
					Register Another Device
				</button>
			</div>
		);
	}

	return (
		<div>
			<h2>FIDO2 Device Registration</h2>

			{step === 'input' && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="policyId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							Device Authentication Policy ID *
						</label>
						<input
							id="policyId"
							type="text"
							value={policyId}
							onChange={(e) => setPolicyId(e.target.value)}
							placeholder="Enter Policy ID"
							style={{
								width: '100%',
								maxWidth: '400px',
								padding: '0.5rem',
								border: '1px solid #ccc',
								borderRadius: '4px',
							}}
						/>
					</div>
					<button
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
							webauthnCredential: webauthnCredential || '',
						}}
					/>
					<button
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
