/**
 * @file UnifiedCredentialsDemo.tsx
 * @description Demo component showing unified shared credentials in action
 * @version 9.0.0
 * @since 2025-01-25
 */

import React, { useState } from 'react';
import { useUnifiedSharedCredentials } from '../hooks/useUnifiedSharedCredentials';

const UnifiedCredentialsDemo: React.FC = () => {
	const {
		credentials,
		saveEnvironmentId,
		saveOAuthCredentials,
		saveWorkerTokenCredentials,
		hasAnyCredentials,
		hasOAuthCredentials,
		hasWorkerTokenCredentials,
		getCredentialStatus,
		refreshCredentials,
	} = useUnifiedSharedCredentials();

	const [formData, setFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		issuerUrl: '',
		clientAuthMethod: 'client_secret_basic' as const,
	});

	const [workerTokenFormData, setWorkerTokenFormData] = useState({
		environmentId: '',
		clientId: '',
		clientSecret: '',
		region: 'us' as const,
	});

	const credentialStatus = getCredentialStatus();

	const handleSaveOAuthCredentials = async () => {
		try {
			await saveOAuthCredentials(formData, 'UnifiedCredentialsDemo');
			setFormData({
				environmentId: '',
				clientId: '',
				clientSecret: '',
				issuerUrl: '',
				clientAuthMethod: 'client_secret_basic',
			});
		} catch (error) {
			console.error('Failed to save OAuth credentials:', error);
		}
	};

	const handleSaveEnvironmentId = async () => {
		try {
			await saveEnvironmentId(formData.environmentId, 'UnifiedCredentialsDemo');
			setFormData(prev => ({ ...prev, environmentId: '' }));
		} catch (error) {
			console.error('Failed to save Environment ID:', error);
		}
	};

	const handleSaveWorkerTokenCredentials = async () => {
		try {
			await saveWorkerTokenCredentials(workerTokenFormData, 'UnifiedCredentialsDemo');
			setWorkerTokenFormData({
				environmentId: '',
				clientId: '',
				clientSecret: '',
				region: 'us',
			});
		} catch (error) {
			console.error('Failed to save Worker Token credentials:', error);
		}
	};

	return (
		<div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
			<h1>🔗 Unified Shared Credentials Demo</h1>
			
			{/* Credential Status */}
			<div style={{ 
				background: '#f8f9fa', 
				border: '1px solid #dee2e6', 
				borderRadius: '8px', 
				padding: '16px', 
				marginBottom: '24px' 
			}}>
				<h2>📊 Credential Status</h2>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
					<div>
						<strong>Environment ID:</strong> {credentialStatus.hasEnvironmentId ? '✅ Set' : '❌ Missing'}
					</div>
					<div>
						<strong>Client ID:</strong> {credentialStatus.hasClientId ? '✅ Set' : '❌ Missing'}
					</div>
					<div>
						<strong>Client Secret:</strong> {credentialStatus.hasClientSecret ? '✅ Set' : '❌ Missing'}
					</div>
					<div>
						<strong>Worker Token:</strong> {credentialStatus.hasWorkerToken ? '✅ Set' : '❌ Missing'}
					</div>
					<div>
						<strong>Complete OAuth:</strong> {credentialStatus.isComplete ? '✅ Yes' : '❌ No'}
					</div>
				</div>
			</div>

			{/* Current Shared Credentials */}
			<div style={{ 
				background: '#e3f2fd', 
				border: '1px solid #90caf9', 
				borderRadius: '8px', 
				padding: '16px', 
				marginBottom: '24px' 
			}}>
				<h2>🔐 Current Shared Credentials</h2>
				<pre style={{ background: '#fff', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
					{JSON.stringify(credentials, null, 2)}
				</pre>
			</div>

			{/* OAuth Credentials Form */}
			<div style={{ 
				background: '#fff3e0', 
				border: '1px solid #ffb74d', 
				borderRadius: '8px', 
				padding: '16px', 
				marginBottom: '24px' 
			}}>
				<h2>🔑 Save OAuth Credentials</h2>
				<div style={{ display: 'grid', gap: '12px' }}>
					<input
						type="text"
						placeholder="Environment ID"
						value={formData.environmentId}
						onChange={(e) => setFormData(prev => ({ ...prev, environmentId: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<input
						type="text"
						placeholder="Client ID"
						value={formData.clientId}
						onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<input
						type="password"
						placeholder="Client Secret"
						value={formData.clientSecret}
						onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<input
						type="text"
						placeholder="Issuer URL"
						value={formData.issuerUrl}
						onChange={(e) => setFormData(prev => ({ ...prev, issuerUrl: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<select
						value={formData.clientAuthMethod}
						onChange={(e) => setFormData(prev => ({ ...prev, clientAuthMethod: e.target.value as any }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					>
						<option value="client_secret_basic">client_secret_basic</option>
						<option value="client_secret_post">client_secret_post</option>
						<option value="none">none</option>
					</select>
					<div style={{ display: 'flex', gap: '8px' }}>
						<button
							onClick={handleSaveOAuthCredentials}
							disabled={!formData.environmentId && !formData.clientId}
							style={{ 
								padding: '8px 16px', 
								background: '#1976d2', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px', 
								cursor: 'pointer' 
							}}
						>
							Save OAuth Credentials
						</button>
						<button
							onClick={handleSaveEnvironmentId}
							disabled={!formData.environmentId}
							style={{ 
								padding: '8px 16px', 
								background: '#388e3c', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px', 
								cursor: 'pointer' 
							}}
						>
							Save Only Environment ID
						</button>
					</div>
				</div>
			</div>

			{/* Worker Token Credentials Form */}
			<div style={{ 
				background: '#f3e5f5', 
				border: '1px solid #ce93d8', 
				borderRadius: '8px', 
				padding: '16px', 
				marginBottom: '24px' 
			}}>
				<h2>🔧 Save Worker Token Credentials</h2>
				<div style={{ display: 'grid', gap: '12px' }}>
					<input
						type="text"
						placeholder="Environment ID"
						value={workerTokenFormData.environmentId}
						onChange={(e) => setWorkerTokenFormData(prev => ({ ...prev, environmentId: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<input
						type="text"
						placeholder="Client ID"
						value={workerTokenFormData.clientId}
						onChange={(e) => setWorkerTokenFormData(prev => ({ ...prev, clientId: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<input
						type="password"
						placeholder="Client Secret"
						value={workerTokenFormData.clientSecret}
						onChange={(e) => setWorkerTokenFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					/>
					<select
						value={workerTokenFormData.region}
						onChange={(e) => setWorkerTokenFormData(prev => ({ ...prev, region: e.target.value as any }))}
						style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
					>
						<option value="us">US</option>
						<option value="eu">EU</option>
						<option value="ap">AP</option>
						<option value="ca">CA</option>
					</select>
					<button
						onClick={handleSaveWorkerTokenCredentials}
						disabled={!workerTokenFormData.environmentId || !workerTokenFormData.clientId || !workerTokenFormData.clientSecret}
						style={{ 
							padding: '8px 16px', 
							background: '#7b1fa2', 
							color: 'white', 
							border: 'none', 
							borderRadius: '4px', 
							cursor: 'pointer' 
						}}
					>
						Save Worker Token Credentials
					</button>
				</div>
			</div>

			{/* Actions */}
			<div style={{ 
				background: '#e8f5e8', 
				border: '1px solid #81c784', 
				borderRadius: '8px', 
				padding: '16px' 
			}}>
				<h2>🔄 Actions</h2>
				<div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
					<button
						onClick={refreshCredentials}
						style={{ 
							padding: '8px 16px', 
							background: '#2e7d32', 
							color: 'white', 
							border: 'none', 
							borderRadius: '4px', 
							cursor: 'pointer' 
						}}
					>
						🔄 Refresh Credentials
					</button>
					<button
						onClick={() => {
							if (confirm('This will clear all shared credentials. Are you sure?')) {
								// Clear credentials logic would go here
								console.log('Clear all credentials - implement in service');
							}
						}}
						style={{ 
							padding: '8px 16px', 
							background: '#d32f2f', 
							color: 'white', 
							border: 'none', 
							borderRadius: '4px', 
							cursor: 'pointer' 
						}}
					>
						🗑️ Clear All Credentials
					</button>
				</div>
			</div>

			{/* Instructions */}
			<div style={{ 
				background: '#fffde7', 
				border: '1px solid #fff9c4', 
				borderRadius: '8px', 
				padding: '16px', 
				marginTop: '24px' 
			}}>
				<h2>📖 How This Works</h2>
				<ol>
					<li><strong>Environment ID</strong> is global across ALL flows - enter once, reuse everywhere</li>
					<li><strong>OAuth Credentials</strong> (Client ID, Secret, Issuer URL) are shared across all OAuth flows</li>
					<li><strong>Worker Token Credentials</strong> are shared across all flows that need worker tokens</li>
					<li>Credentials are automatically synchronized between flows</li>
					<li>All flows (Authorization Code, Implicit, etc.) will automatically see these shared credentials</li>
				</ol>
			</div>
		</div>
	);
};

export default UnifiedCredentialsDemo;
