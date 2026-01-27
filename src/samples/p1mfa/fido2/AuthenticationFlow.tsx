/**
 * @file AuthenticationFlow.tsx
 * @module samples/p1mfa/fido2
 * @description FIDO2 authentication flow component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { type AuthenticationResult, FIDO2Helper, P1MFASDK } from '@/sdk/p1mfa';
import { StatusDisplay } from '../shared/StatusDisplay';

interface AuthenticationFlowProps {
	sdk: P1MFASDK;
	userId: string;
}

export const AuthenticationFlow: React.FC<AuthenticationFlowProps> = ({ sdk, userId }) => {
	const [step, setStep] = useState<
		'input' | 'initializing' | 'webauthn' | 'completing' | 'success'
	>('input');
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [authenticationId, setAuthenticationId] = useState<string>();
	const [policyId, setPolicyId] = useState('');
	const [deviceId, setDeviceId] = useState('');

	const handleInitialize = async () => {
		if (!userId || !policyId) {
			setError(new Error('User ID and Policy ID are required'));
			setStatus('error');
			return;
		}

		setStep('initializing');
		setStatus('loading');
		setMessage('Initializing FIDO2 authentication...');
		setError(undefined);

		try {
			const result = await sdk.initializeAuthentication({
				userId,
				deviceId: deviceId || undefined,
				deviceAuthenticationPolicyId: policyId,
			});

			setAuthenticationId(result.authenticationId);
			setRequest({
				method: 'POST',
				url: `/mfa/v1/environments/{envId}/deviceAuthentications`,
				body: { user: { id: userId }, device: deviceId ? { id: deviceId } : undefined },
			});
			setResponse(result);
			setStep('webauthn');
			setStatus('success');
			setMessage('Authentication initialized. Now get WebAuthn assertion...');
		} catch (err) {
			setError(err);
			setStatus('error');
			setStep('input');
		}
	};

	const handleGetAssertion = async () => {
		if (!authenticationId) {
			setError(new Error('Authentication ID not available'));
			setStatus('error');
			return;
		}

		setStep('webauthn');
		setStatus('loading');
		setMessage('Getting WebAuthn assertion...');
		setError(undefined);

		try {
			// For FIDO2, we need to get the challenge from the authentication response
			// In a real implementation, you'd fetch the authentication status to get the challenge
			// For this sample, we'll use a simplified approach
			const requestOptions: PublicKeyCredentialRequestOptions = {
				challenge: new Uint8Array(32), // In real app, get from authentication response
				timeout: 60000,
				rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
			};

			const assertion = await FIDO2Helper.getWebAuthnAssertion(requestOptions);

			setRequest({
				action: 'navigator.credentials.get',
				options: requestOptions,
			});
			setResponse({ credentialId: assertion.id, type: assertion.type });

			// Complete authentication
			setStep('completing');
			setMessage('Completing authentication...');

			const result = await sdk.completeAuthentication({
				authenticationId,
				fido2Assertion: assertion,
			});

			setStatus('success');
			setStep('success');
			setMessage('FIDO2 authentication completed successfully!');
			setResponse(result);
		} catch (err) {
			setError(err);
			setStatus('error');
		}
	};

	if (step === 'success') {
		return (
			<div>
				<StatusDisplay status={status} message={message} request={request} response={response} />
				<button
					onClick={() => {
						setStep('input');
						setStatus('idle');
						setAuthenticationId(undefined);
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
					Authenticate Again
				</button>
			</div>
		);
	}

	return (
		<div>
			<h2>FIDO2 Authentication</h2>

			{step === 'input' && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="authPolicyId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							Device Authentication Policy ID *
						</label>
						<input
							id="authPolicyId"
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
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="authDeviceId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							Device ID (Optional)
						</label>
						<input
							id="authDeviceId"
							type="text"
							value={deviceId}
							onChange={(e) => setDeviceId(e.target.value)}
							placeholder="Leave empty to select device automatically"
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
						onClick={handleInitialize}
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
						Initialize Authentication
					</button>
				</div>
			)}

			{(step === 'initializing' || step === 'webauthn' || step === 'completing') && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					{step === 'webauthn' && status === 'success' && (
						<button
							onClick={handleGetAssertion}
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
							Get WebAuthn Assertion
						</button>
					)}
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
