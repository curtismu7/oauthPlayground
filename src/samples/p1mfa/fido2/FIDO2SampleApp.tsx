/**
 * @file FIDO2SampleApp.tsx
 * @module samples/p1mfa/fido2
 * @description FIDO2 MFA Sample Application - Demonstrates complete registration and authentication flows
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { type Device, FIDO2Helper, type P1MFAConfig, P1MFASDK } from '@/sdk/p1mfa';
import { CredentialsForm } from '../shared/CredentialsForm';
import { DeviceList } from '../shared/DeviceList';
import { StatusDisplay } from '../shared/StatusDisplay';
import { AuthenticationFlow } from './AuthenticationFlow';
import { RegistrationFlow } from './RegistrationFlow';

type Tab = 'credentials' | 'registration' | 'authentication' | 'devices';

export const FIDO2SampleApp: React.FC = () => {
	const [sdk, setSdk] = useState<P1MFASDK | null>(null);
	const [config, setConfig] = useState<P1MFAConfig | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>('credentials');
	const [devices, setDevices] = useState<Device[]>([]);
	const [loadingDevices, setLoadingDevices] = useState(false);
	const [userId, setUserId] = useState('');

	const handleInitialize = async (sdkConfig: P1MFAConfig) => {
		try {
			const newSdk = new P1MFASDK();
			await newSdk.initialize(sdkConfig);
			setSdk(newSdk);
			setConfig(sdkConfig);
			setActiveTab('registration');
		} catch (error) {
			console.error('Failed to initialize SDK:', error);
		}
	};

	const handleLoadDevices = async () => {
		if (!sdk || !userId) return;

		setLoadingDevices(true);
		try {
			const deviceList = await sdk.listDevices(userId);
			setDevices(deviceList);
		} catch (error) {
			console.error('Failed to load devices:', error);
		} finally {
			setLoadingDevices(false);
		}
	};

	const handleDeleteDevice = async (deviceId: string) => {
		if (!sdk || !userId) return;

		if (!confirm('Are you sure you want to delete this device?')) return;

		try {
			await sdk.deleteDevice(userId, deviceId);
			await handleLoadDevices();
		} catch (error) {
			console.error('Failed to delete device:', error);
		}
	};

	return (
		<div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
			<h1 style={{ marginBottom: '2rem' }}>P1MFA SDK - FIDO2 Sample App</h1>

			{/* Tabs */}
			<div
				style={{
					display: 'flex',
					gap: '1rem',
					marginBottom: '2rem',
					borderBottom: '2px solid #ddd',
				}}
			>
				<button
					onClick={() => setActiveTab('credentials')}
					style={{
						padding: '0.75rem 1.5rem',
						border: 'none',
						backgroundColor: activeTab === 'credentials' ? '#007bff' : 'transparent',
						color: activeTab === 'credentials' ? 'white' : '#007bff',
						cursor: 'pointer',
						borderBottom: activeTab === 'credentials' ? '3px solid #007bff' : 'none',
					}}
				>
					Credentials
				</button>
				<button
					onClick={() => setActiveTab('registration')}
					disabled={!sdk}
					style={{
						padding: '0.75rem 1.5rem',
						border: 'none',
						backgroundColor: activeTab === 'registration' ? '#007bff' : 'transparent',
						color: activeTab === 'registration' ? 'white' : '#007bff',
						cursor: sdk ? 'pointer' : 'not-allowed',
						opacity: sdk ? 1 : 0.5,
						borderBottom: activeTab === 'registration' ? '3px solid #007bff' : 'none',
					}}
				>
					Registration
				</button>
				<button
					onClick={() => setActiveTab('authentication')}
					disabled={!sdk}
					style={{
						padding: '0.75rem 1.5rem',
						border: 'none',
						backgroundColor: activeTab === 'authentication' ? '#007bff' : 'transparent',
						color: activeTab === 'authentication' ? 'white' : '#007bff',
						cursor: sdk ? 'pointer' : 'not-allowed',
						opacity: sdk ? 1 : 0.5,
						borderBottom: activeTab === 'authentication' ? '3px solid #007bff' : 'none',
					}}
				>
					Authentication
				</button>
				<button
					onClick={() => {
						setActiveTab('devices');
						if (sdk && userId) {
							handleLoadDevices();
						}
					}}
					disabled={!sdk}
					style={{
						padding: '0.75rem 1.5rem',
						border: 'none',
						backgroundColor: activeTab === 'devices' ? '#007bff' : 'transparent',
						color: activeTab === 'devices' ? 'white' : '#007bff',
						cursor: sdk ? 'pointer' : 'not-allowed',
						opacity: sdk ? 1 : 0.5,
						borderBottom: activeTab === 'devices' ? '3px solid #007bff' : 'none',
					}}
				>
					Devices
				</button>
			</div>

			{/* Tab Content */}
			{activeTab === 'credentials' && (
				<div>
					<h2>Step 1: Initialize SDK</h2>
					<p style={{ marginBottom: '1rem', color: '#6c757d' }}>
						Enter your PingOne credentials to initialize the SDK
					</p>
					<CredentialsForm onSubmit={handleInitialize} />
				</div>
			)}

			{activeTab === 'registration' && sdk && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="userId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							User ID *
						</label>
						<input
							id="userId"
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="Enter PingOne User ID"
							style={{
								width: '100%',
								maxWidth: '400px',
								padding: '0.5rem',
								border: '1px solid #ccc',
								borderRadius: '4px',
							}}
						/>
					</div>
					<RegistrationFlow sdk={sdk} userId={userId} onDeviceRegistered={handleLoadDevices} />
				</div>
			)}

			{activeTab === 'authentication' && sdk && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="authUserId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							User ID *
						</label>
						<input
							id="authUserId"
							type="text"
							value={userId}
							onChange={(e) => setUserId(e.target.value)}
							placeholder="Enter PingOne User ID"
							style={{
								width: '100%',
								maxWidth: '400px',
								padding: '0.5rem',
								border: '1px solid #ccc',
								borderRadius: '4px',
							}}
						/>
					</div>
					<AuthenticationFlow sdk={sdk} userId={userId} />
				</div>
			)}

			{activeTab === 'devices' && sdk && (
				<div>
					<div style={{ marginBottom: '1rem' }}>
						<label htmlFor="devicesUserId" style={{ display: 'block', marginBottom: '0.5rem' }}>
							User ID *
						</label>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
							<input
								id="devicesUserId"
								type="text"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								placeholder="Enter PingOne User ID"
								style={{
									width: '100%',
									maxWidth: '400px',
									padding: '0.5rem',
									border: '1px solid #ccc',
									borderRadius: '4px',
								}}
							/>
							<button
								onClick={handleLoadDevices}
								disabled={!userId || loadingDevices}
								style={{
									padding: '0.5rem 1rem',
									backgroundColor: '#007bff',
									color: 'white',
									border: 'none',
									borderRadius: '4px',
									cursor: userId && !loadingDevices ? 'pointer' : 'not-allowed',
									opacity: userId && !loadingDevices ? 1 : 0.5,
								}}
							>
								Load Devices
							</button>
						</div>
					</div>
					<DeviceList devices={devices} onDelete={handleDeleteDevice} loading={loadingDevices} />
				</div>
			)}
		</div>
	);
};
