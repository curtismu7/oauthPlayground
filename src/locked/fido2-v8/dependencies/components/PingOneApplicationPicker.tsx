// src/components/PingOneApplicationPicker.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
	FiAlertCircle,
	FiCheck,
	FiChevronDown,
	FiCopy,
	FiEye,
	FiEyeOff,
	FiRefreshCw,
} from 'react-icons/fi';
import styled from 'styled-components';
import {
	fetchApplications as fetchPingOneApplications,
	type PingOneApplication,
} from '../services/pingOneApplicationService';
import { v4ToastManager } from '../utils/v4ToastMessages';

export interface PingOneApplicationPickerProps {
	environmentId: string;
	clientId: string;
	clientSecret: string;
	region?: string;
	workerToken?: string | undefined;
	onApplicationSelect: (application: PingOneApplication) => void;
	disabled?: boolean;
}

// NOTE: The PingOneApplication type is imported from the service

const Container = styled.div`
	margin-bottom: 1.5rem;
`;

const Label = styled.label`
	display: block;
	color: #333;
	font-weight: 500;
	margin-bottom: 0.5rem;
`;

const SelectContainer = styled.div`
	position: relative;
	width: 100%;
`;

const Select = styled.select<{ $hasError?: boolean }>`
	width: 100%;
	padding: 0.75rem 2.5rem 0.75rem 0.75rem;
	border: 1px solid ${(props) => (props.$hasError ? '#dc3545' : '#ddd')};
	border-radius: 6px;
	font-size: 1rem;
	color: #333;
	background: white;
	appearance: none;
	cursor: pointer;
	
	&:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
	}
	
	&:disabled {
		background: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.6;
	}
`;

const ChevronIcon = styled(FiChevronDown)`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	color: #6c757d;
`;

const LoadingSpinner = styled(FiRefreshCw)`
	position: absolute;
	right: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	pointer-events: none;
	color: #007bff;
	animation: spin 1s linear infinite;
	
	@keyframes spin {
		from { transform: translateY(-50%) rotate(0deg); }
		to { transform: translateY(-50%) rotate(360deg); }
	}
`;

const ErrorMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #dc3545;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`;

const SuccessMessage = styled.div`
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: #28a745;
	font-size: 0.875rem;
	margin-top: 0.5rem;
`;

const ApplicationDetails = styled.div`
	margin-top: 0.75rem;
	background: white;
	border-radius: 6px;
	border: 1px solid #dee2e6;
	overflow: hidden;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`;

const TableHeader = styled.thead`
	background: #f8f9fa;
	border-bottom: 2px solid #dee2e6;
`;

const TableHeaderCell = styled.th`
	padding: 0.5rem 0.75rem;
	text-align: left;
	font-weight: 700;
	color: #495057;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	
	&:first-child {
		width: 30%;
	}
	
	&:last-child {
		width: 50px;
		text-align: center;
	}
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
	border-bottom: 1px solid #e9ecef;
	
	&:last-child {
		border-bottom: none;
	}
	
	&:nth-child(even) {
		background: #f8f9fa;
	}
	
	&:hover {
		background: #e9ecef;
	}
`;

const TableCell = styled.td`
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
`;

const FieldLabel = styled.span`
	font-weight: 500;
	color: #333;
	font-size: 0.625rem;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const FieldValue = styled.span`
	color: #495057;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.625rem;
	font-weight: 500;
	word-break: break-all;
`;

const CopyButton = styled.button`
	background: none;
	border: 1px solid #dee2e6;
	border-radius: 3px;
	padding: 0.25rem;
	color: #6c757d;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	
	&:hover {
		background: #f8f9fa;
		border-color: #007bff;
		color: #007bff;
	}
	
	&:active {
		transform: scale(0.95);
	}
`;

const RefreshButton = styled.button`
	background: #007bff;
	color: white;
	border: none;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	flex: 1;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`;

const ApplyButton = styled.button`
	background: #28a745;
	color: white;
	border: none;
	padding: 0.5rem 0.75rem;
	border-radius: 0.375rem;
	font-size: 0.8125rem;
	font-weight: 600;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
	flex: 1;
	
	&:hover:not(:disabled) {
		background: #218838;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 0.75rem;
`;

const PingOneApplicationPicker: React.FC<PingOneApplicationPickerProps> = ({
	environmentId,
	clientId,
	clientSecret,
	region = 'na',
	workerToken,
	onApplicationSelect,
	disabled = false,
}) => {
	console.log('[PingOneApplicationPicker] Component initialized with props:', {
		hasEnvironmentId: !!environmentId,
		hasClientId: !!clientId,
		hasClientSecret: !!clientSecret,
		hasWorkerToken: !!workerToken,
		hasOnApplicationSelect: !!onApplicationSelect,
		disabled,
		onApplicationSelectType: typeof onApplicationSelect,
	});

	const [applications, setApplications] = useState<PingOneApplication[]>([]);
	const [selectedAppId, setSelectedAppId] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [showClientSecret, setShowClientSecret] = useState(false);

	const fetchApplications = useCallback(async () => {
		if (!environmentId || (!clientId && !clientSecret) || !workerToken) {
			setError('Missing required credentials to fetch applications');
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);

		try {
			const apps = await fetchPingOneApplications({
				environmentId,
				region,
				workerToken,
				clientId,
				clientSecret,
			});

			setApplications(apps);
			setSuccess(`Found ${apps.length} applications`);
			if (apps.length === 0) setError('No applications found in this environment');
		} catch (err) {
			console.error('[PingOneApplicationPicker] Error fetching applications:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch applications');
		} finally {
			setLoading(false);
		}
	}, [environmentId, clientId, clientSecret, region, workerToken]);

	const handleApplicationChange = useCallback(
		(appId: string) => {
			console.log('[PingOneApplicationPicker] Application changed:', appId);
			setSelectedAppId(appId);

			// Auto-fill credentials when app is selected
			if (appId && appId !== '') {
				const selectedApp = applications.find((app) => app.id === appId);
				console.log('[PingOneApplicationPicker] Found application:', selectedApp);
				if (selectedApp) {
					console.log('[PingOneApplicationPicker] Calling onApplicationSelect with:', selectedApp);
					onApplicationSelect(selectedApp);
					setSuccess(`Selected application: ${selectedApp.name}`);
				} else {
					console.log('[PingOneApplicationPicker] No application found for ID:', appId);
				}
			}
		},
		[applications, onApplicationSelect]
	);

	const handleCopy = useCallback((text: string, label: string) => {
		navigator.clipboard.writeText(text);
		v4ToastManager.showSuccess(`${label} copied to clipboard`);
	}, []);

	// Auto-fetch applications when credentials are available
	useEffect(() => {
		if (
			environmentId &&
			(clientId || clientSecret) &&
			workerToken &&
			applications.length === 0 &&
			!loading
		) {
			console.log('[PingOneApplicationPicker] Auto-fetching applications with:', {
				hasEnvironmentId: !!environmentId,
				hasClientId: !!clientId,
				hasClientSecret: !!clientSecret,
				hasWorkerToken: !!workerToken,
			});
			fetchApplications();
		}
	}, [
		environmentId,
		clientId,
		clientSecret,
		workerToken,
		applications.length,
		loading,
		fetchApplications,
	]);

	return (
		<Container>
			<Label>PingOne Application</Label>
			<SelectContainer>
				<Select
					value={selectedAppId}
					onChange={(e) => handleApplicationChange(e.target.value)}
					disabled={disabled || loading}
					$hasError={!!error}
				>
					<option value="">{loading ? 'Loading applications...' : 'Select an application'}</option>
					{applications.map((app) => (
						<option key={app.id} value={app.id}>
							{app.name} ({app.clientId})
						</option>
					))}
				</Select>
				{loading ? <LoadingSpinner size={16} /> : <ChevronIcon size={16} />}
			</SelectContainer>

			{error && (
				<ErrorMessage>
					<FiAlertCircle size={16} />
					{error}
				</ErrorMessage>
			)}

			{success && !error && (
				<SuccessMessage>
					<FiCheck size={16} />
					{success}
				</SuccessMessage>
			)}

			{selectedAppId && applications.length > 0 && (
				<ApplicationDetails>
					{(() => {
						const selectedApp = applications.find((app) => app.id === selectedAppId);
						if (!selectedApp) return null;

						return (
							<>
								<Table>
									<TableHeader>
										<tr>
											<TableHeaderCell>Field</TableHeaderCell>
											<TableHeaderCell>Value</TableHeaderCell>
											<TableHeaderCell></TableHeaderCell>
										</tr>
									</TableHeader>
									<TableBody>
										<TableRow>
											<TableCell>
												<FieldLabel>Client ID</FieldLabel>
											</TableCell>
											<TableCell>
												<FieldValue>{selectedApp.clientId}</FieldValue>
											</TableCell>
											<TableCell style={{ textAlign: 'center' }}>
												<CopyButton
													onClick={() => handleCopy(selectedApp.clientId, 'Client ID')}
													title="Copy Client ID"
												>
													<FiCopy size={14} />
												</CopyButton>
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>
												<FieldLabel>Client Secret</FieldLabel>
											</TableCell>
											<TableCell>
												<FieldValue>
													{selectedApp.clientSecret
														? showClientSecret
															? selectedApp.clientSecret
															: '••••••••••••••••'
														: 'None'}
												</FieldValue>
											</TableCell>
											<TableCell style={{ textAlign: 'center' }}>
												{selectedApp.clientSecret && (
													<div
														style={{
															display: 'flex',
															gap: '0.25rem',
															alignItems: 'center',
															justifyContent: 'center',
														}}
													>
														<CopyButton
															onClick={() => handleCopy(selectedApp.clientSecret!, 'Client Secret')}
															title="Copy Client Secret"
														>
															<FiCopy size={14} />
														</CopyButton>
														<CopyButton
															onClick={() => setShowClientSecret(!showClientSecret)}
															title={showClientSecret ? 'Hide' : 'Show'}
														>
															{showClientSecret ? <FiEyeOff size={14} /> : <FiEye size={14} />}
														</CopyButton>
													</div>
												)}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>
												<FieldLabel>Grant Types</FieldLabel>
											</TableCell>
											<TableCell>
												<FieldValue>{selectedApp.grantTypes?.join(', ') || 'None'}</FieldValue>
											</TableCell>
											<TableCell style={{ textAlign: 'center' }}>
												{selectedApp.grantTypes && selectedApp.grantTypes.length > 0 && (
													<CopyButton
														onClick={() =>
															handleCopy(selectedApp.grantTypes!.join(', '), 'Grant Types')
														}
														title="Copy Grant Types"
													>
														<FiCopy size={14} />
													</CopyButton>
												)}
											</TableCell>
										</TableRow>
										{/* Hide redirect URIs for SERVICE type applications or if only client_credentials grant type is present */}
										{selectedApp.type !== 'SERVICE' &&
											!(
												selectedApp.grantTypes &&
												selectedApp.grantTypes.length === 1 &&
												selectedApp.grantTypes.includes('client_credentials')
											) && (
												<>
													<TableRow>
														<TableCell>
															<FieldLabel>Redirect URIs</FieldLabel>
														</TableCell>
														<TableCell>
															<FieldValue>
																{selectedApp.redirectUris?.join(', ') || 'None'}
															</FieldValue>
														</TableCell>
														<TableCell style={{ textAlign: 'center' }}></TableCell>
													</TableRow>
													<TableRow>
														<TableCell>
															<FieldLabel>Post-Logout URIs</FieldLabel>
														</TableCell>
														<TableCell>
															<FieldValue>
																{selectedApp.postLogoutRedirectUris?.join(', ') || 'None'}
															</FieldValue>
														</TableCell>
														<TableCell style={{ textAlign: 'center' }}>
															{selectedApp.postLogoutRedirectUris &&
																selectedApp.postLogoutRedirectUris.length > 0 && (
																	<CopyButton
																		onClick={() =>
																			handleCopy(
																				selectedApp.postLogoutRedirectUris!.join(', '),
																				'Post-Logout URIs'
																			)
																		}
																		title="Copy Post-Logout URIs"
																	>
																		<FiCopy size={14} />
																	</CopyButton>
																)}
														</TableCell>
													</TableRow>
												</>
											)}
										<TableRow>
											<TableCell>
												<FieldLabel>Scopes</FieldLabel>
											</TableCell>
											<TableCell>
												<FieldValue>{selectedApp.scopes?.join(', ') || 'None'}</FieldValue>
											</TableCell>
											<TableCell style={{ textAlign: 'center' }}>
												{selectedApp.scopes && selectedApp.scopes.length > 0 && (
													<CopyButton
														onClick={() => handleCopy(selectedApp.scopes!.join(', '), 'Scopes')}
														title="Copy Scopes"
													>
														<FiCopy size={14} />
													</CopyButton>
												)}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>
												<FieldLabel>Token Auth Method</FieldLabel>
											</TableCell>
											<TableCell>
												<FieldValue>
													{selectedApp.tokenEndpointAuthMethod || 'client_secret_post'}
												</FieldValue>
											</TableCell>
											<TableCell style={{ textAlign: 'center' }}>
												<CopyButton
													onClick={() =>
														handleCopy(
															selectedApp.tokenEndpointAuthMethod || 'client_secret_post',
															'Token Auth Method'
														)
													}
													title="Copy Token Auth Method"
												>
													<FiCopy size={14} />
												</CopyButton>
											</TableCell>
										</TableRow>
										{selectedApp.pkceEnforcement && (
											<TableRow>
												<TableCell>
													<FieldLabel>PKCE Enforcement</FieldLabel>
												</TableCell>
												<TableCell>
													<FieldValue>{selectedApp.pkceEnforcement}</FieldValue>
												</TableCell>
												<TableCell style={{ textAlign: 'center' }}>
													<CopyButton
														onClick={() =>
															handleCopy(selectedApp.pkceEnforcement || '', 'PKCE Enforcement')
														}
														title="Copy PKCE Enforcement"
													>
														<FiCopy size={14} />
													</CopyButton>
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>

								<ButtonContainer>
									<ApplyButton
										onClick={() => {
											console.log(
												'[PingOneApplicationPicker] Apply Configuration clicked, calling onApplicationSelect with:',
												selectedApp
											);
											onApplicationSelect(selectedApp);
										}}
									>
										<FiCheck size={14} />
										Apply Configuration
									</ApplyButton>
									<RefreshButton onClick={fetchApplications} disabled={loading || disabled}>
										<FiRefreshCw size={14} />
										{loading ? 'Loading...' : 'Refresh Applications'}
									</RefreshButton>
								</ButtonContainer>
							</>
						);
					})()}
				</ApplicationDetails>
			)}

			{!selectedAppId && (
				<RefreshButton onClick={fetchApplications} disabled={loading || disabled}>
					<FiRefreshCw size={14} />
					{loading ? 'Loading...' : 'Refresh Applications'}
				</RefreshButton>
			)}
		</Container>
	);
};

export default PingOneApplicationPicker;
