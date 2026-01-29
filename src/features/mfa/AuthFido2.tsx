/**
 * @file AuthFido2.tsx
 * @module features/mfa
 * @description FIDO2 authentication component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { DebugPanel } from '@/samples/p1mfa/shared/DebugPanel';
import { StatusDisplay } from '@/samples/p1mfa/shared/StatusDisplay';
import { FIDO2Helper, P1MFASDK } from '@/sdk/p1mfa';
import { credentialToJson } from './webauthn';

interface AuthFido2Props {
	sdk: P1MFASDK;
	userId: string;
	policyId: string;
	deviceId?: string;
}

export const AuthFido2: React.FC<AuthFido2Props> = ({ sdk, userId, policyId, deviceId }) => {
	const [step, setStep] = useState<
		'input' | 'initializing' | 'webauthn' | 'completing' | 'success'
	>('input');
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [authenticationId, setAuthenticationId] = useState<string>();
	const [assertionOptions, setAssertionOptions] = useState<PublicKeyCredentialRequestOptions>();
	const [correlationId, setCorrelationId] = useState<string>();
	const [webauthnAssertion, setWebauthnAssertion] = useState<string>();

	const stateMachineStatus =
		step === 'input'
			? 'IDLE'
			: step === 'initializing'
				? 'AUTH_INITIALIZED'
				: step === 'webauthn'
					? 'WEBAUTHN_ASSERTION_REQUIRED'
					: step === 'completing'
						? 'AUTH_COMPLETING'
						: step === 'success'
							? 'AUTH_SUCCESS'
							: 'ERROR';

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
			setCorrelationId(result.authenticationId);

			// For FIDO2, we need to get assertion options from the authentication response
			// This would typically come from the _links in the response
			// For this sample, we'll construct basic options
			const options: PublicKeyCredentialRequestOptions = {
				challenge: new Uint8Array(32), // In real app, get from auth response
				timeout: 60000,
				rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
			};

			setAssertionOptions(options);
			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/initialize-device-authentication',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					deviceId: deviceId || undefined,
					deviceAuthenticationPolicyId: policyId,
					workerToken: '***REDACTED***',
				},
			});
			setResponse(result);
			setStep('webauthn');
			setStatus('success');
			setMessage('Authentication initialized. Click below to get WebAuthn assertion...');
		} catch (err) {
			setError(err);
			setStatus('error');
			setStep('input');
		}
	};

	const handleGetAssertion = async () => {
		if (!assertionOptions || !authenticationId) {
			setError(new Error('Assertion options or authentication ID not available'));
			setStatus('error');
			return;
		}

		setStep('webauthn');
		setStatus('loading');
		setMessage('Getting WebAuthn assertion...');
		setError(undefined);

		try {
			// Get WebAuthn assertion
			const assertion = await FIDO2Helper.getWebAuthnAssertion(assertionOptions);

			// Convert assertion to JSON for copy button
			const assertionJson = JSON.stringify(credentialToJson(assertion), null, 2);
			setWebauthnAssertion(assertionJson);

			setRequest({
				action: 'navigator.credentials.get',
				options: assertionOptions,
			});
			setResponse({ credentialId: assertion.id, type: assertion.type });

			// Complete authentication
			setStep('completing');
			setMessage('Completing authentication with WebAuthn assertion...');

			const result = await sdk.completeAuthentication({
				authenticationId,
				fido2Assertion: assertion,
			});

			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/complete',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					deviceAuthenticationId: authenticationId,
					assertion: '***REDACTED***',
					workerToken: '***REDACTED***',
				},
			});
			setResponse(result);
			setStatus('success');
			setStep('success');
			setMessage('FIDO2 authentication completed successfully!');
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
						authenticationId: authenticationId || '',
						userId,
						webauthnAssertion: webauthnAssertion || '',
					}}
				/>
			</div>
		);
	}

	return (
		<div>
			<h2>FIDO2 Authentication</h2>

			{step === 'input' && (
				<div>
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
						Initialize FIDO2 Authentication
					</button>
				</div>
			)}

			{step === 'initializing' && (
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
							authenticationId: authenticationId || '',
							userId,
						}}
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
							authenticationId: authenticationId || '',
							userId,
						}}
					/>
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
				</div>
			)}

			{step === 'completing' && (
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
							authenticationId: authenticationId || '',
							userId,
							webauthnAssertion: webauthnAssertion || '',
						}}
					/>
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
