/**
 * @file UserSearchPage.tsx
 * @description Educational page for making API calls around users with user dropdown and API display service
 * @version 9.27.0
 */

import React, { useState, useCallback } from 'react';
import { FiSearch, FiUsers, FiCode, FiCopy, FiRefreshCw, FiInfo } from 'react-icons/fi';
import styled from 'styled-components';
import { UserSearchDropdownV8 } from '@/v8/components/UserSearchDropdownV8';
import { ApiCallDisplayService } from '@/services/apiCallDisplayService';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';
import { PageHeaderV8, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';

const _MODULE_TAG = '[🔍 USER-SEARCH-PAGE]';

interface User {
	id: string;
	username: string;
	email: string;
}

interface ApiCallData {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	url: string;
	headers?: Record<string, string>;
	body?: string | object | null;
	response?: {
		status: number;
		statusText: string;
		headers?: Record<string, string>;
		data?: unknown;
		error?: string;
	};
	timestamp?: Date;
	duration?: number;
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1200px;
	margin: 0 auto;
`;

const Section = styled.div`
	background: white;
	border-radius: 0.5rem;
	padding: 1.5rem;
	margin-bottom: 2rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
	font-size: 1.25rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const ApiCallDisplay = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	white-space: pre-wrap;
	overflow-x: auto;
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`;

const UserCard = styled.div`
	background: #f9fafb;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
`;

const UserCardTitle = styled.h3`
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 0.5rem 0;
`;

const UserCardInfo = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.5rem;
	font-size: 0.875rem;
`;

const InfoItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
`;

const InfoLabel = styled.span`
	font-weight: 600;
	color: #6b7280;
`;

const InfoValue = styled.span`
	color: #1f2937;
	word-break: break-all;
`;

export const UserSearchPage: React.FC = () => {
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [environmentId, setEnvironmentId] = useState<string>('');
	const [apiCall, setApiCall] = useState<ApiCallData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Mock environment ID for demo
	React.useEffect(() => {
		setEnvironmentId('demo-environment-id');
	}, []);

	const handleUserSelect = useCallback((username: string) => {
		setError(null);
		setSelectedUser(null);
		setApiCall(null);

		// Mock user selection
		const mockUser: User = {
			id: 'demo-user-id',
			username,
			email: `${username}@example.com`
		};
		setSelectedUser(mockUser);
	}, []);

	const generateUserApiCall = useCallback((user: User, endpoint: string, method: ApiCallData['method'] = 'GET', body?: object) => {
		const baseUrl = 'https://api.pingone.com/v1';
		const url = `${baseUrl}/environments/${environmentId}/users/${user.id}${endpoint}`;
		
		const apiCallData: ApiCallData = {
			method,
			url,
			headers: {
				'Authorization': 'Bearer ***REDACTED***',
				'Content-Type': 'application/json',
			},
			body: method !== 'GET' ? body : null,
			timestamp: new Date(),
		};

		setApiCall(apiCallData);
	}, [environmentId]);

	const executeApiCall = useCallback(async (user: User, endpoint: string, method: ApiCallData['method'] = 'GET', body?: object) => {
		if (!user || !environmentId) return;

		setIsLoading(true);
		setError(null);

		try {
			const baseUrl = 'https://api.pingone.com/v1';
			const url = `${baseUrl}/environments/${environmentId}/users/${user.id}${endpoint}`;
			
			const response = await fetch(url, {
				method,
				headers: {
					'Authorization': 'Bearer ***REDACTED***',
					'Content-Type': 'application/json',
				},
				body: method !== 'GET' ? JSON.stringify(body) : null,
			});

			const responseData = response.ok ? await response.json() : { error: 'Request failed' };

			const apiCallData: ApiCallData = {
				method,
				url,
				headers: {
					'Authorization': 'Bearer ***REDACTED***',
					'Content-Type': 'application/json',
				},
				body: method !== 'GET' ? body : null,
				response: {
					status: response.status,
					statusText: response.statusText,
					data: responseData,
				},
				timestamp: new Date(),
				duration: Math.random() * 1000 + 100, // Mock duration
			};

			setApiCall(apiCallData);
			toastV8.success(`API call executed: ${method} ${endpoint}`);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
			setError(errorMessage);
			toastV8.error(`API call failed: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, [environmentId]);

	const copyToClipboard = useCallback((text: string) => {
		navigator.clipboard.writeText(text).then(() => {
			toastV8.success('Copied to clipboard');
		}).catch(() => {
			toastV8.error('Failed to copy to clipboard');
		});
	}, []);

	const generateCurlCommand = useCallback((apiCallData: ApiCallData) => {
		return ApiCallDisplayService.generateCurlCommand(apiCallData, {
			includeHeaders: true,
			includeBody: true,
			prettyPrint: true,
		});
	}, []);

	const formatApiCall = useCallback((apiCallData: ApiCallData) => {
		return ApiCallDisplayService.createFullDisplay(apiCallData);
	}, []);

	return (
		<Container>
			<PageHeaderV8
				title="User API Explorer"
				subtitle="Learn how to make API calls around user management with interactive examples"
				gradient="#3b82f6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiUsers />
					Select User
				</SectionTitle>
				<p style={{ marginBottom: '1rem', color: '#6b7280' }}>
					Choose a user to explore various user-related API endpoints. This educational tool demonstrates how to structure API calls for user management operations.
				</p>
				
				<div style={{ maxWidth: '400px' }}>
					<UserSearchDropdownV8
						environmentId={environmentId}
						value={selectedUser?.username || ''}
						onChange={handleUserSelect}
						placeholder="Search and select a user..."
					/>
				</div>

				{selectedUser && (
					<UserCard>
						<UserCardTitle>Selected User</UserCardTitle>
						<UserCardInfo>
							<InfoItem>
								<InfoLabel>Username:</InfoLabel>
								<InfoValue>{selectedUser.username}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>Email:</InfoLabel>
								<InfoValue>{selectedUser.email}</InfoValue>
							</InfoItem>
							<InfoItem>
								<InfoLabel>User ID:</InfoLabel>
								<InfoValue>{selectedUser.id}</InfoValue>
							</InfoItem>
						</UserCardInfo>
					</UserCard>
				)}
			</Section>

			{selectedUser && (
				<Section>
					<SectionTitle>
						<FiCode />
						User API Endpoints
					</SectionTitle>
					<p style={{ marginBottom: '1rem', color: '#6b7280' }}>
						Explore common user management API endpoints. Click any button to generate the API call structure and see the curl command.
					</p>

					<InfoBox>
						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
							<FiInfo style={{ marginTop: '2px' }} />
							<div>
								<strong>Educational Note:</strong> This is a demonstration tool. The API calls shown here are for educational purposes only and won't actually execute against real PingOne APIs. Use this to learn the structure and format of user API calls.
							</div>
						</div>
					</InfoBox>

					<ActionButtons>
						<BootstrapButton
							variant="primary"
							onClick={() => generateUserApiCall(selectedUser, '')}
							disabled={isLoading}
						>
							<FiSearch /> Get User Details
						</BootstrapButton>
						<BootstrapButton
							variant="primary"
							onClick={() => generateUserApiCall(selectedUser, '/groups')}
							disabled={isLoading}
						>
							<FiUsers /> Get User Groups
						</BootstrapButton>
						<BootstrapButton
							variant="success"
							onClick={() => generateUserApiCall(selectedUser, '/password', 'PUT', { newPassword: '***REDACTED***' })}
							disabled={isLoading}
						>
							<FiRefreshCw /> Update Password
						</BootstrapButton>
						<BootstrapButton
							variant="warning"
							onClick={() => generateUserApiCall(selectedUser, '/mfa', 'POST', { deviceType: 'EMAIL' })}
							disabled={isLoading}
						>
							<FiCode /> Enable MFA
						</BootstrapButton>
					</ActionButtons>

					{apiCall && (
						<div style={{ marginTop: '2rem' }}>
							<SectionTitle>
								<FiCode />
								API Call Details
							</SectionTitle>

							<ApiCallDisplay>
								{formatApiCall(apiCall)}
							</ApiCallDisplay>

							<ActionButtons>
								<BootstrapButton
									variant="secondary"
									onClick={() => copyToClipboard(generateCurlCommand(apiCall))}
								>
									<FiCopy /> Copy cURL
								</BootstrapButton>
								<BootstrapButton
									variant="secondary"
									onClick={() => executeApiCall(selectedUser, apiCall.url.replace(`https://api.pingone.com/v1/environments/${environmentId}/users/${selectedUser.id}`, ''), apiCall.method)}
									disabled={isLoading}
								>
									<FiRefreshCw /> Execute Demo
								</BootstrapButton>
							</ActionButtons>
						</div>
					)}

					{error && (
						<div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#dc2626' }}>
							<strong>Error:</strong> {error}
						</div>
					)}
				</Section>
			)}

			<Section>
				<SectionTitle>
					<FiInfo />
					Learning Resources
				</SectionTitle>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
					<div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>User Management APIs</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>GET /users/{'id'} - Get user details</li>
							<li>PUT /users/{'id'} - Update user information</li>
							<li>DELETE /users/{'id'} - Delete user</li>
							<li>GET /users/{'id'}/groups - Get user groups</li>
							<li>POST /users/{'id'}/password - Reset password</li>
						</ul>
					</div>
					<div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Authentication</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>Bearer token authentication</li>
							<li>Environment-specific endpoints</li>
							<li>JSON request/response format</li>
							<li>Error handling patterns</li>
						</ul>
					</div>
					<div style={{ padding: '1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.375rem' }}>
						<h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Best Practices</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
							<li>Always validate user permissions</li>
							<li>Use HTTPS for all API calls</li>
							<li>Implement proper error handling</li>
							<li>Rate limit API requests</li>
						</ul>
					</div>
				</div>
			</Section>
		</Container>
	);
};

export default UserSearchPage;
