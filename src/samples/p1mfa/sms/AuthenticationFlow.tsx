/**
 * @file AuthenticationFlow.tsx
 * @module samples/p1mfa/sms
 * @description SMS authentication flow component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { P1MFASDK } from '@/sdk/p1mfa';
import { StatusDisplay } from '../shared/StatusDisplay';

interface AuthenticationFlowProps {
	sdk: P1MFASDK;
	userId: string;
}

export const AuthenticationFlow: React.FC<AuthenticationFlowProps> = ({ sdk, userId }) => {
	const [step, setStep] = useState<'input' | 'initializing' | 'sending' | 'completing' | 'success'>(
		'input'
	);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [authenticationId, setAuthenticationId] = useState<string>();
	const [policyId, setPolicyId] = useState('');
	const [deviceId, setDeviceId] = useState('');
	const [otp, setOtp] = useState('');

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
			setRequest({
				method: 'POST',
				url: `/mfa/v1/environments/{envId}/deviceAuthentications`,
				body: { user: { id: userId }, device: deviceId ? { id: deviceId } : undefined },
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
				url: `/mfa/v1/environments/{envId}/deviceAuthentications/${authenticationId}/complete`,
				body: { otp },
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
				<button
					onClick={() => {
						setStep('input');
						setStatus('idle');
						setAuthenticationId(undefined);
						setOtp('');
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
			<h2>SMS Authentication</h2>

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

			{(step === 'initializing' || step === 'sending' || step === 'completing') && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					{step === 'sending' && status === 'success' && (
						<div style={{ marginTop: '1rem' }}>
							<label htmlFor="authOtp" style={{ display: 'block', marginBottom: '0.5rem' }}>
								Enter OTP Code *
							</label>
							<input
								id="authOtp"
								type="text"
								value={otp}
								onChange={(e) => setOtp(e.target.value)}
								placeholder="123456"
								maxLength={6}
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
								Complete Authentication
							</button>
						</div>
					)}
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
