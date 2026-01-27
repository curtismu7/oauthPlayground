/**
 * @file PasskeyManagementUtility.tsx
 * @module utils
 * @description Utility to help identify and manage passkeys stored in Chrome
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiCopy, FiExternalLink, FiInfo, FiTrash2 } from 'react-icons/fi';

interface PasskeyDevice {
	id: string;
	name?: string;
	type: string;
	status: string;
	createdAt: string;
	credentialId?: string;
	rpId?: string;
	userHandle?: string;
	lastUsed?: string;
}

interface PasskeyManagementUtilityProps {
	environmentId: string;
	userId?: string;
	workerToken?: string;
	onDeviceDeleted?: () => void;
}

export const PasskeyManagementUtility: React.FC<PasskeyManagementUtilityProps> = ({
	environmentId,
	userId,
	workerToken,
	onDeviceDeleted,
}) => {
	const [devices, setDevices] = useState<PasskeyDevice[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	// Load devices from PingOne
	const loadDevices = async () => {
		if (!environmentId || !userId || !workerToken) {
			setError('Missing required credentials');
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices`,
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${workerToken}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to load devices: ${response.statusText}`);
			}

			const data = await response.json();
			const fido2Devices = (data._embedded?.devices || []).filter(
				(device: any) => device.type === 'FIDO2'
			);

			// Enrich with credential information if available
			const enrichedDevices = fido2Devices.map((device: any) => ({
				id: device.id,
				name: device.name,
				type: device.type,
				status: device.status,
				createdAt: device.createdAt,
				credentialId: device.credentialId,
				rpId: device.rpId || 'auth.pingone.com', // Default RP ID
				userHandle: device.userHandle,
				lastUsed: device.lastUsed,
			}));

			setDevices(enrichedDevices);
		} catch (err) {
			console.error('Failed to load devices:', err);
			setError(err instanceof Error ? err.message : 'Failed to load devices');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (environmentId && userId && workerToken) {
			loadDevices();
		}
	}, [environmentId, userId, workerToken]);

	const copyToClipboard = async (text: string, fieldName: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(fieldName);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	/**
	 * Signal Chrome that a credential is no longer valid using WebAuthn Signal API
	 */
	const signalUnknownCredential = async (credentialId: string, rpId: string) => {
		// Check if WebAuthn Signal API is supported
		if (
			typeof PublicKeyCredential !== 'undefined' &&
			'signalUnknownCredential' in PublicKeyCredential &&
			typeof (PublicKeyCredential as any).signalUnknownCredential === 'function'
		) {
			try {
				// Convert credentialId from base64 to ArrayBuffer if needed
				let credentialIdBuffer: ArrayBuffer;
				try {
					// Try to decode as base64url first
					const binaryString = atob(credentialId.replace(/-/g, '+').replace(/_/g, '/'));
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					credentialIdBuffer = bytes.buffer;
				} catch {
					// If base64 decode fails, try treating as base64url directly
					const binaryString = atob(credentialId);
					const bytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						bytes[i] = binaryString.charCodeAt(i);
					}
					credentialIdBuffer = bytes.buffer;
				}

				await (PublicKeyCredential as any).signalUnknownCredential({
					rpId: rpId || window.location.hostname,
					credentialId: credentialIdBuffer,
				});

				console.log('✅ Successfully signaled Chrome to remove passkey', {
					credentialId: credentialId.substring(0, 20) + '...',
					rpId,
				});
			} catch (signalError) {
				console.warn('⚠️ Failed to signal Chrome about deleted credential:', signalError);
				// Don't throw - this is best effort, deletion from server is what matters
			}
		} else {
			console.log('ℹ️ WebAuthn Signal API not supported in this browser');
		}
	};

	/**
	 * Signal Chrome with all accepted credentials (to hide invalid ones)
	 */
	const signalAllAcceptedCredentials = async (validCredentialIds: string[], rpId: string) => {
		if (
			typeof PublicKeyCredential !== 'undefined' &&
			'signalAllAcceptedCredentials' in PublicKeyCredential &&
			typeof (PublicKeyCredential as any).signalAllAcceptedCredentials === 'function'
		) {
			try {
				const credentialIdBuffers = validCredentialIds.map((id) => {
					try {
						const binaryString = atob(id.replace(/-/g, '+').replace(/_/g, '/'));
						const bytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}
						return bytes.buffer;
					} catch {
						const binaryString = atob(id);
						const bytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bytes[i] = binaryString.charCodeAt(i);
						}
						return bytes.buffer;
					}
				});

				await (PublicKeyCredential as any).signalAllAcceptedCredentials({
					rpId: rpId || window.location.hostname,
					credentialIds: credentialIdBuffers,
				});

				console.log('✅ Successfully signaled Chrome with all accepted credentials', {
					count: validCredentialIds.length,
					rpId,
				});
			} catch (signalError) {
				console.warn('⚠️ Failed to signal Chrome with accepted credentials:', signalError);
			}
		}
	};

	const deleteDevice = async (deviceId: string) => {
		if (!environmentId || !userId || !workerToken) {
			return;
		}

		// Find the device to get credentialId and rpId
		const device = devices.find((d) => d.id === deviceId);
		if (!device) {
			alert('Device not found');
			return;
		}

		if (
			!confirm(
				'Are you sure you want to delete this passkey device? This will also remove it from Chrome. This action cannot be undone.'
			)
		) {
			return;
		}

		try {
			// Delete from PingOne server
			const response = await fetch(
				`https://api.pingone.com/v1/environments/${environmentId}/users/${userId}/devices/${deviceId}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${workerToken}`,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Failed to delete device: ${response.statusText}`);
			}

			// Signal Chrome to remove the passkey using WebAuthn Signal API
			if (device.credentialId && device.rpId) {
				await signalUnknownCredential(device.credentialId, device.rpId);
			}

			// Get remaining devices before deletion for signaling
			const remainingDevices = devices.filter((d) => d.id !== deviceId);
			const remainingCredentialIds = remainingDevices
				.map((d) => d.credentialId)
				.filter((id): id is string => !!id);

			// Reload devices to get updated list
			await loadDevices();

			// Signal Chrome with all remaining valid credentials
			if (remainingCredentialIds.length > 0 && device.rpId) {
				await signalAllAcceptedCredentials(remainingCredentialIds, device.rpId);
			}

			onDeviceDeleted?.();
		} catch (err) {
			console.error('Failed to delete device:', err);
			alert(`Failed to delete device: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	};

	const openChromePasskeyManager = () => {
		// Chrome passkey manager URL (may vary by Chrome version)
		window.open('chrome://settings/passwords', '_blank');
	};

	return (
		<div
			style={{
				maxWidth: '1200px',
				margin: '0 auto',
				padding: '2rem',
				background: '#f8fafc',
				minHeight: '100vh',
			}}
		>
			<div
				style={{
					background: 'white',
					padding: '2rem',
					borderRadius: '12px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
					marginBottom: '2rem',
				}}
			>
				<h1 style={{ marginTop: 0, fontSize: '1.75rem', fontWeight: '700' }}>
					🔑 Passkey Management Utility
				</h1>
				<p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
					Identify and manage passkeys stored in Chrome. This tool helps you match PingOne devices
					with Chrome passkeys using identifying information.
				</p>

				{/* Chrome Passkey Manager Instructions */}
				<div
					style={{
						background: '#eff6ff',
						border: '1px solid #3b82f6',
						borderRadius: '8px',
						padding: '1rem',
						marginBottom: '1.5rem',
					}}
				>
					<h3
						style={{
							marginTop: 0,
							fontSize: '1rem',
							fontWeight: '600',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<FiInfo /> How to Access Chrome Passkey Manager
					</h3>
					<ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#1e40af' }}>
						<li>
							Open Chrome Settings: <code>chrome://settings/passwords</code>
						</li>
						<li>Click on the "Passkeys" tab</li>
						<li>You'll see all your stored passkeys with their associated websites</li>
						<li>
							Use the identifying information below to match PingOne devices with Chrome passkeys
						</li>
					</ol>
					<button
						onClick={openChromePasskeyManager}
						style={{
							marginTop: '0.75rem',
							padding: '0.5rem 1rem',
							background: '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							fontSize: '0.875rem',
						}}
					>
						<FiExternalLink /> Open Chrome Passkey Manager
					</button>
				</div>

				{/* Refresh Button */}
				<button
					onClick={loadDevices}
					disabled={loading || !environmentId || !userId || !workerToken}
					style={{
						marginBottom: '1.5rem',
						padding: '0.75rem 1.5rem',
						background: loading ? '#9ca3af' : '#10b981',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: loading ? 'not-allowed' : 'pointer',
						fontSize: '0.95rem',
						fontWeight: '600',
					}}
				>
					{loading ? 'Loading...' : '🔄 Refresh Device List'}
				</button>

				{error && (
					<div
						style={{
							background: '#fef2f2',
							border: '1px solid #ef4444',
							borderRadius: '8px',
							padding: '1rem',
							color: '#dc2626',
							marginBottom: '1.5rem',
						}}
					>
						<strong>Error:</strong> {error}
					</div>
				)}

				{/* Device List */}
				{devices.length === 0 && !loading && !error && (
					<div
						style={{
							background: '#f3f4f6',
							border: '1px solid #d1d5db',
							borderRadius: '8px',
							padding: '2rem',
							textAlign: 'center',
							color: '#6b7280',
						}}
					>
						<p>No FIDO2 devices found. Register a passkey to get started.</p>
					</div>
				)}

				{devices.map((device, index) => (
					<div
						key={device.id}
						style={{
							background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
							border: '2px solid #e5e7eb',
							borderRadius: '12px',
							padding: '1.5rem',
							marginBottom: '1rem',
						}}
					>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
							<div style={{ flex: 1 }}>
								<h3
									style={{
										marginTop: 0,
										marginBottom: '0.5rem',
										fontSize: '1.1rem',
										fontWeight: '600',
									}}
								>
									Passkey #{index + 1} {device.name && `- ${device.name}`}
								</h3>
								<div
									style={{
										display: 'inline-block',
										padding: '0.25rem 0.75rem',
										background: device.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
										color: device.status === 'ACTIVE' ? '#166534' : '#92400e',
										borderRadius: '4px',
										fontSize: '0.75rem',
										fontWeight: '600',
										marginBottom: '1rem',
									}}
								>
									{device.status}
								</div>

								{/* Identifying Information */}
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'auto 1fr',
										gap: '0.75rem 1rem',
										fontSize: '0.875rem',
									}}
								>
									<strong style={{ color: '#6b7280' }}>Device ID:</strong>
									<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
										<code
											style={{
												background: '#f3f4f6',
												padding: '0.25rem 0.5rem',
												borderRadius: '4px',
												fontSize: '0.8rem',
												flex: 1,
												wordBreak: 'break-all',
											}}
										>
											{device.id}
										</code>
										<button
											onClick={() => copyToClipboard(device.id, `device-${device.id}`)}
											style={{
												background: 'none',
												border: 'none',
												cursor: 'pointer',
												color: '#6b7280',
												padding: '0.25rem',
												display: 'flex',
												alignItems: 'center',
											}}
											title="Copy Device ID"
										>
											{copiedField === `device-${device.id}` ? (
												<FiCheckCircle style={{ color: '#10b981' }} />
											) : (
												<FiCopy />
											)}
										</button>
									</div>

									{device.credentialId && (
										<>
											<strong style={{ color: '#6b7280' }}>Credential ID:</strong>
											<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
												<code
													style={{
														background: '#f3f4f6',
														padding: '0.25rem 0.5rem',
														borderRadius: '4px',
														fontSize: '0.8rem',
														flex: 1,
														wordBreak: 'break-all',
													}}
												>
													{device.credentialId.substring(0, 50)}...
												</code>
												<button
													onClick={() => copyToClipboard(device.credentialId!, `cred-${device.id}`)}
													style={{
														background: 'none',
														border: 'none',
														cursor: 'pointer',
														color: '#6b7280',
														padding: '0.25rem',
														display: 'flex',
														alignItems: 'center',
													}}
													title="Copy Full Credential ID"
												>
													{copiedField === `cred-${device.id}` ? (
														<FiCheckCircle style={{ color: '#10b981' }} />
													) : (
														<FiCopy />
													)}
												</button>
											</div>
										</>
									)}

									<strong style={{ color: '#6b7280' }}>RP ID:</strong>
									<code
										style={{
											background: '#f3f4f6',
											padding: '0.25rem 0.5rem',
											borderRadius: '4px',
											fontSize: '0.8rem',
										}}
									>
										{device.rpId}
									</code>

									<strong style={{ color: '#6b7280' }}>Created:</strong>
									<span>{new Date(device.createdAt).toLocaleString()}</span>

									{device.lastUsed && (
										<>
											<strong style={{ color: '#6b7280' }}>Last Used:</strong>
											<span>{new Date(device.lastUsed).toLocaleString()}</span>
										</>
									)}
								</div>

								{/* Help Text */}
								<div
									style={{
										marginTop: '1rem',
										padding: '0.75rem',
										background: '#fef3c7',
										borderLeft: '3px solid #f59e0b',
										borderRadius: '4px',
										fontSize: '0.8rem',
										color: '#92400e',
									}}
								>
									<strong>💡 How to identify this passkey in Chrome:</strong>
									<ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
										<li>
											Look for a passkey with RP ID: <strong>{device.rpId}</strong>
										</li>
										{device.credentialId && (
											<li>
												The credential ID in Chrome may match the beginning of this device's
												credential ID
											</li>
										)}
										<li>Created on: {new Date(device.createdAt).toLocaleDateString()}</li>
									</ul>
								</div>
							</div>

							{/* Delete Button */}
							<button
								onClick={() => deleteDevice(device.id)}
								style={{
									padding: '0.5rem 1rem',
									background: '#ef4444',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									fontSize: '0.875rem',
									marginLeft: '1rem',
								}}
								title="Delete this device (will also remove from PingOne)"
							>
								<FiTrash2 /> Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
