/**
 * @file RegistrationFlow.tsx
 * @module samples/p1mfa/sms
 * @description SMS device registration flow component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { type DeviceRegistrationResult, P1MFASDK, SMSHelper } from '@/sdk/p1mfa';
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
	const [step, setStep] = useState<'input' | 'registering' | 'sending' | 'activating' | 'success'>(
		'input'
	);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState<string>();
	const [request, setRequest] = useState<unknown>();
	const [response, setResponse] = useState<unknown>();
	const [error, setError] = useState<Error | unknown>();
	const [deviceId, setDeviceId] = useState<string>();
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [_registrationResult, setRegistrationResult] = useState<DeviceRegistrationResult>();

	const handleRegister = async () => {
		if (!userId || !phone) {
			setError(new Error('User ID and phone number are required'));
			setStatus('error');
			return;
		}

		setStep('registering');
		setStatus('loading');
		setMessage('Registering SMS device...');
		setError(undefined);

		try {
			// Step 1: Register device with PingOne
			const result = await SMSHelper.registerSMSDevice(sdk, {
				userId,
				type: 'SMS',
				phone,
				status: 'ACTIVATION_REQUIRED',
			});

			setRegistrationResult(result);
			setDeviceId(result.deviceId);
			setRequest({
				method: 'POST',
				url: `/v1/environments/{envId}/users/${userId}/devices`,
				body: { type: 'SMS', phone, status: 'ACTIVATION_REQUIRED' },
			});
			setResponse(result);
			setStep('sending');
			setStatus('success');
			setMessage('Device registered. Sending OTP...');
		} catch (err) {
			setError(err);
			setStatus('error');
			setStep('input');
		}
	};

	const handleSendOTP = async () => {
		if (!deviceId) {
			setError(new Error('Device ID not available'));
			setStatus('error');
			return;
		}

		setStep('sending');
		setStatus('loading');
		setMessage('Sending OTP to phone...');
		setError(undefined);

		try {
			// Step 2: Send OTP
			await SMSHelper.sendOTP(sdk, userId, deviceId);

			setRequest({
				method: 'POST',
				url: `/v1/environments/{envId}/users/${userId}/devices/${deviceId}/otp`,
			});
			setResponse({ message: 'OTP sent successfully' });
			setStatus('success');
			setMessage('OTP sent! Please check your phone and enter the code below.');
		} catch (err) {
			setError(err);
			setStatus('error');
		}
	};

	const handleActivate = async () => {
		if (!deviceId || !otp) {
			setError(new Error('Device ID and OTP are required'));
			setStatus('error');
			return;
		}

		setStep('activating');
		setStatus('loading');
		setMessage('Activating device with OTP...');
		setError(undefined);

		try {
			// Step 3: Activate device with OTP
			await SMSHelper.activateSMSDevice(sdk, {
				userId,
				deviceId,
				otp,
			});

			setRequest({
				method: 'POST',
				url: `/v1/environments/{envId}/users/${userId}/devices/${deviceId}`,
				headers: { 'Content-Type': 'application/vnd.pingidentity.device.activate+json' },
				body: { otp },
			});
			setResponse({ message: 'Device activated successfully' });
			setStatus('success');
			setStep('success');
			setMessage('SMS device registered and activated successfully!');
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
				<button
					type="button"
					onClick={() => {
						setStep('input');
						setStatus('idle');
						setDeviceId(undefined);
						setOtp('');
						setPhone('');
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
			<h2>SMS Device Registration</h2>

			{step === 'input' && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label
							htmlFor="phone"
							style={{ display: 'block', marginBottom: '0.5rem' }}
							htmlFor="phonenumbereg1234567890"
						>
							Phone Number * (e.g., +1234567890)
						</label>
						<input
							id="phone"
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+1234567890"
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
						type="button"
						onClick={handleRegister}
						disabled={!userId || !phone}
						style={{
							padding: '0.75rem 1.5rem',
							backgroundColor: '#007bff',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: userId && phone ? 'pointer' : 'not-allowed',
							opacity: userId && phone ? 1 : 0.5,
						}}
					>
						Register SMS Device
					</button>
				</div>
			)}

			{step === 'registering' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
				</div>
			)}

			{step === 'sending' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
					{status === 'success' && (
						<div style={{ marginTop: '1rem' }}>
							<button
								type="button"
								onClick={handleSendOTP}
								style={{
									marginBottom: '1rem',
									padding: '0.75rem 1.5rem',
									backgroundColor: '#28a745',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: 'pointer',
								}}
							>
								Send OTP
							</button>
							<div style={{ marginTop: '1rem' }}>
								<label
									htmlFor="otp"
									style={{ display: 'block', marginBottom: '0.5rem' }}
									htmlFor="enterotpcode"
								>
									Enter OTP Code *
								</label>
								<input
									id="otp"
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
									type="button"
									onClick={handleActivate}
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
									Activate Device
								</button>
							</div>
						</div>
					)}
				</div>
			)}

			{step === 'activating' && (
				<div>
					<StatusDisplay status={status} message={message} request={request} response={response} />
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
