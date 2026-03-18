/**
 * @file TokenRequestStep.tsx
 * @description Token Request Step for OAuth token requests
 * @author OAuth Playground Team
 * @version 1.0.0
 * @since 2026-01-25
 */

import React, { useState } from 'react';
import { logger } from '../../../utils/logger';
import { BaseUnifiedStep } from './BaseUnifiedStep';

export const TokenRequestStep: React.FC<{
	isCompleted?: boolean;
	isActive?: boolean;
	onComplete?: () => void;
}> = ({ isCompleted = false, isActive = false, onComplete }) => {
	const [isRequesting, setIsRequesting] = useState(false);
	const [requestData, setRequestData] = useState({
		grantType: 'authorization_code',
		code: '',
		redirectUri: 'https://localhost:3000/callback',
		clientId: 'test-client-id',
		clientSecret: 'test-client-secret',
	});
	const [response, setResponse] = useState<any>(null);

	const handleInputChange = (field: string, value: string) => {
		setRequestData((prev) => ({ ...prev, [field]: value }));
	};

	const makeTokenRequest = async () => {
		setIsRequesting(true);
		setResponse(null);

		logger.info('TokenRequestStep', 'Making token request', { grantType: requestData.grantType });

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockResponse = {
				access_token:
					'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
				token_type: 'Bearer',
				expires_in: 3600,
				refresh_token: 'refresh_token_here',
				scope: 'read write',
			};

			setResponse(mockResponse);
			logger.success('TokenRequestStep', 'Token request successful');
			onComplete?.();
		} catch (error) {
			logger.error('TokenRequestStep', 'Token request failed', error as Error);
			setResponse({ error: 'Token request failed. Please check your credentials.' });
		} finally {
			setIsRequesting(false);
		}
	};

	return (
		<BaseUnifiedStep
			title="Token Request"
			description="Request OAuth tokens from authorization server"
			stepNumber={2}
			isCompleted={isCompleted}
			isActive={isActive}
		>
			<div>
				<h4>Token Request</h4>
				<p>Configure and send a token request to the OAuth authorization server.</p>

				<div
					style={{
						padding: '1rem',
						background: '#f8fafc',
						borderRadius: '0.5rem',
						marginBottom: '1rem',
					}}
				>
					<div style={{ display: 'grid', gap: '1rem' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
								Grant Type
							</label>
							<select
								value={requestData.grantType}
								onChange={(e) => handleInputChange('grantType', e.target.value)}
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
									background: 'white',
								}}
							>
								<option value="authorization_code">Authorization Code</option>
								<option value="client_credentials">Client Credentials</option>
								<option value="refresh_token">Refresh Token</option>
							</select>
						</div>

						{requestData.grantType === 'authorization_code' && (
							<div>
								<label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
									Authorization Code
								</label>
								<input
									type="text"
									value={requestData.code}
									onChange={(e) => handleInputChange('code', e.target.value)}
									placeholder="Enter authorization code"
									style={{
										width: '100%',
										padding: '0.5rem',
										border: '1px solid #d1d5db',
										borderRadius: '4px',
									}}
								/>
							</div>
						)}

						<div>
							<label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
								Redirect URI
							</label>
							<input
								type="text"
								value={requestData.redirectUri}
								onChange={(e) => handleInputChange('redirectUri', e.target.value)}
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
								}}
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
								Client ID
							</label>
							<input
								type="text"
								value={requestData.clientId}
								onChange={(e) => handleInputChange('clientId', e.target.value)}
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
								}}
							/>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
								Client Secret
							</label>
							<input
								type="password"
								value={requestData.clientSecret}
								onChange={(e) => handleInputChange('clientSecret', e.target.value)}
								style={{
									width: '100%',
									padding: '0.5rem',
									border: '1px solid #d1d5db',
									borderRadius: '4px',
								}}
							/>
						</div>
					</div>
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<button
						type="button"
						onClick={makeTokenRequest}
						disabled={isRequesting || isCompleted}
						style={{
							padding: '0.5rem 1rem',
							background: isRequesting || isCompleted ? '#9ca3af' : '#3b82f6',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: isRequesting || isCompleted ? 'not-allowed' : 'pointer',
						}}
					>
						{isRequesting ? 'Requesting...' : isCompleted ? 'Completed' : 'Request Token'}
					</button>
				</div>

				{response && (
					<div
						style={{
							padding: '1rem',
							background: response.error ? '#fef2f2' : '#f0fdf4',
							borderRadius: '0.5rem',
							border: `1px solid ${response.error ? '#fecaca' : '#bbf7d0'}`,
						}}
					>
						<h5
							style={{
								marginBottom: '0.5rem',
								color: response.error ? '#dc2626' : '#059669',
							}}
						>
							{response.error ? 'Error' : 'Success'}
						</h5>
						<pre
							style={{
								fontSize: '0.875rem',
								whiteSpace: 'pre-wrap',
								color: response.error ? '#dc2626' : '#059669',
							}}
						>
							{JSON.stringify(response, null, 2)}
						</pre>
					</div>
				)}
			</div>
		</BaseUnifiedStep>
	);
};
