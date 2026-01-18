/**
 * @file EnrollSms.tsx
 * @module features/mfa
 * @description SMS device enrollment component
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { P1MFASDK, SMSHelper, type DeviceRegistrationResult } from '@/sdk/p1mfa';
import { DebugPanel } from '@/samples/p1mfa/shared/DebugPanel';
import { StatusDisplay } from '@/samples/p1mfa/shared/StatusDisplay';

interface EnrollSmsProps {
	sdk: P1MFASDK;
	userId: string;
	onDeviceRegistered?: () => void;
}

export const EnrollSms: React.FC<EnrollSmsProps> = ({ sdk, userId, onDeviceRegistered }) => {
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
	const [correlationId, setCorrelationId] = useState<string>();

	const stateMachineStatus =
		step === 'input'
			? 'IDLE'
			: step === 'registering'
				? 'DEVICE_CREATION_PENDING'
				: step === 'sending'
					? 'OTP_SEND_PENDING'
					: step === 'activating'
						? 'DEVICE_ACTIVATION_PENDING'
						: step === 'success'
							? 'DEVICE_ACTIVE'
							: 'ERROR';

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
			const result = await SMSHelper.registerSMSDevice(sdk, {
				userId,
				type: 'SMS',
				phone,
				status: 'ACTIVATION_REQUIRED',
			});

			setDeviceId(result.deviceId);
			setCorrelationId(result.deviceId);
			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/register-device',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					type: 'SMS',
					phone,
					status: 'ACTIVATION_REQUIRED',
					workerToken: '***REDACTED***',
				},
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
			await SMSHelper.sendOTP(sdk, userId, deviceId);

			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/send-otp',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					deviceId,
					workerToken: '***REDACTED***',
				},
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
			await SMSHelper.activateSMSDevice(sdk, {
				userId,
				deviceId,
				otp,
			});

			setRequest({
				method: 'POST',
				url: '/api/pingone/mfa/activate-device',
				headers: { 'Content-Type': 'application/json' },
				body: {
					environmentId: '***REDACTED***',
					userId,
					deviceId,
					otp: '***REDACTED***',
					workerToken: '***REDACTED***',
				},
			});
			setResponse({ message: 'Device activated successfully' });
			setStatus('success');
			setStep('success');
			setMessage('SMS device enrolled and activated successfully!');
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
						deviceId: deviceId || '',
						userId,
					}}
				/>
				<button
					onClick={() => {
						setStep('input');
						setStatus('idle');
						setDeviceId(undefined);
						setPhone('');
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
					Enroll Another Device
				</button>
			</div>
		);
	}

	return (
		<div>
			<h2>SMS Device Enrollment</h2>

			{step === 'input' && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem' }}>
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
						copyableValues={deviceId ? { deviceId, userId } : { userId }}
					/>
					<button
						onClick={handleSendOTP}
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
						Send OTP
					</button>
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
							deviceId: deviceId || '',
							userId,
						}}
					/>
					<div style={{ marginTop: '1rem' }}>
						<label htmlFor="otp" style={{ display: 'block', marginBottom: '0.5rem' }}>
							OTP Code *
						</label>
						<input
							id="otp"
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
			)}

			{step === 'activating' && (
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
							deviceId: deviceId || '',
							userId,
						}}
					/>
				</div>
			)}

			{error && <StatusDisplay status="error" error={error} />}
		</div>
	);
};
