/**
 * @file AuthSms.tsx
 * @module features/mfa
 * @description SMS authentication component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { P1MFASDK, type AuthenticationResult } from '@/sdk/p1mfa';
import { DebugPanel } from '@/samples/p1mfa/shared/DebugPanel';
import { StatusDisplay } from '@/samples/p1mfa/shared/StatusDisplay';

interface AuthSmsProps {
	sdk: P1MFASDK;
	userId: string;
	policyId: string;
	deviceId?: string;
}

export const AuthSms: React.FC<AuthSmsProps> = ({ sdk, userId, policyId, deviceId }) => {
	const [step, setStep] = useState<'input' | 'initializing' | 'sending' | 'completing' | 'success'>(
		'input'
	);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [authenticationId, setAuthenticationId] = useState<string>();
	const [otp, setOtp] = useState('');
	const [correlationId, setCorrelationId] = useState<string>();

	const stateMachineStatus =
		step === 'input'
			? 'IDLE'
			: step === 'initializing'
				? 'AUTH_INITIALIZED'
				: step === 'sending'
					? 'OTP_SEND_PENDING'
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
		setMessage('Initializing SMS authentication...');
		setError(undefined);

		try {
			const result = await sdk.initializeAuthentication({
				userId,
				deviceId: deviceId || undefined,
				deviceAuthenticationPolicyId: policyId,
			});

			setAuthenticationId(result.authenticationId);
			setCorrelationId(result.authenticationId);
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
			setStep('sending');
			setStatus('success');
			setMessage('Authentication initialized. OTP will be sent automatically...');
		} catch (err) {
			setError(err);
			setStatus('error');
			setStep('input');
		}
	};

	const handleComplete = async () => {
		if (!authenticationId || !otp) {
			setError(new Error('Authentication ID and OTP are required'));
			setStatus('error');
			return;
		}

		setStep('completing');
		setStatus('loading');
		setMessage('Completing authentication with OTP...');
		setError(undefined);

		try {
			const result = await sdk.completeAuthentication({
				authenticationId,
				otp,
			});

			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/complete',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					deviceAuthenticationId: authenticationId,
					otp: '***REDACTED***',
					workerToken: '***REDACTED***',
				},
			});
			setResponse(result);
			setStatus('success');
			setStep('success');
			setMessage('SMS authentication completed successfully!');
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
					request={request as {
						method?: string;
						url?: string;
						headers?: Record<string, string>;
						body?: unknown;
					}}
					response={response}
					correlationId={correlationId}
					stateMachineStatus={stateMachineStatus}
					copyableValues={{
						authenticationId: authenticationId || '',
						userId,
					}}
				/>
			</div>
		);
	}

	return (
		<div>
			<h2>SMS Authentication</h2>

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
						Initialize SMS Authentication
					</button>
				</div>
			)}

			{step === 'initializing' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={request as {
							method?: string;
							url?: string;
							headers?: Record<string, string>;
							body?: unknown;
						}}
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

			{step === 'sending' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={request as {
							method?: string;
							url?: string;
							headers?: Record<string, string>;
							body?: unknown;
						}}
						response={response}
						correlationId={correlationId}
						stateMachineStatus={stateMachineStatus}
						copyableValues={{
							authenticationId: authenticationId || '',
							userId,
						}}
					/>
					<div style={{ marginTop: '1rem' }}>
						<label htmlFor="authOtp" style={{ display: 'block', marginBottom: '0.5rem' }}>
							OTP Code *
						</label>
						<input
							id="authOtp"
							type="text"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							maxLength={6}
							placeholder="123456"
							style={{
								width: '100%',
								maxWidth: '200px',
								padding: '0.5rem',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '1.25rem',
								textAlign: 'center',
								letterSpacing: '0.5rem',
							}}
						/>
					</div>
					<button
						onClick={handleComplete}
						disabled={!otp || otp.length < 6}
						style={{
							marginTop: '1rem',
							padding: '0.75rem 1.5rem',
							backgroundColor: '#28a745',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: otp && otp.length >= 6 ? 'pointer' : 'not-allowed',
							opacity: otp && otp.length >= 6 ? 1 : 0.5,
						}}
					>
						Verify OTP
					</button>
				</div>
			)}

			{step === 'completing' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					<DebugPanel
						request={request as {
							method?: string;
							url?: string;
							headers?: Record<string, string>;
							body?: unknown;
						}}
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

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
