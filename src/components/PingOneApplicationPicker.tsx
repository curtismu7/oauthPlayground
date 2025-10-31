// src/components/PingOneApplicationPicker.tsx
import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { FiRefreshCw, FiChevronDown, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { fetchApplications as fetchPingOneApplications, type PingOneApplication } from '../services/pingOneApplicationService';

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
	border: 1px solid ${props => props.$hasError ? '#dc3545' : '#ddd'};
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
	margin-top: 1rem;
	padding: 1rem;
	background: #f8f9fa;
	border-radius: 6px;
	border: 1px solid #e9ecef;
`;

const DetailRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
	
	&:last-child {
		margin-bottom: 0;
	}
`;

const DetailLabel = styled.span`
	font-weight: 500;
	color: #495057;
`;

const DetailValue = styled.span`
	color: #6c757d;
	font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
	font-size: 0.875rem;
`;

const RefreshButton = styled.button`
	background: #007bff;
	color: white;
	border: none;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin-top: 0.5rem;
	
	&:hover:not(:disabled) {
		background: #0056b3;
	}
	
	&:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
`;

const PingOneApplicationPicker: React.FC<PingOneApplicationPickerProps> = ({
	environmentId,
	clientId,
	clientSecret,
	region = 'na',
	workerToken,
	onApplicationSelect,
	disabled = false
}) => {
	const [applications, setApplications] = useState<PingOneApplication[]>([]);
	const [selectedAppId, setSelectedAppId] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

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

	const handleApplicationChange = useCallback((appId: string) => {
		setSelectedAppId(appId);
		
		if (appId && appId !== '') {
			const selectedApp = applications.find(app => app.id === appId);
			if (selectedApp) {
				onApplicationSelect(selectedApp);
				setSuccess(`Selected application: ${selectedApp.name}`);
			}
		}
	}, [applications, onApplicationSelect]);

	// Auto-fetch applications when credentials are available
	useEffect(() => {
		if (environmentId && (clientId || clientSecret) && workerToken && applications.length === 0) {
			fetchApplications();
		}
	}, [environmentId, clientId, clientSecret, workerToken, applications.length, fetchApplications]);

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
					<option value="">
						{loading ? 'Loading applications...' : 'Select an application'}
					</option>
					{applications.map((app) => (
						<option key={app.id} value={app.id}>
							{app.name} ({app.clientId})
						</option>
					))}
				</Select>
				{loading ? (
					<LoadingSpinner size={16} />
				) : (
					<ChevronIcon size={16} />
				)}
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
						const selectedApp = applications.find(app => app.id === selectedAppId);
						if (!selectedApp) return null;

						return (
							<>
								<DetailRow>
									<DetailLabel>Client ID:</DetailLabel>
									<DetailValue>{selectedApp.clientId}</DetailValue>
								</DetailRow>
								<DetailRow>
									<DetailLabel>Grant Types:</DetailLabel>
									<DetailValue>{selectedApp.grantTypes?.join(', ') || 'None'}</DetailValue>
								</DetailRow>
								<DetailRow>
									<DetailLabel>Redirect URIs:</DetailLabel>
									<DetailValue>{selectedApp.redirectUris?.join(', ') || 'None'}</DetailValue>
								</DetailRow>
								<DetailRow>
									<DetailLabel>Post-Logout URIs:</DetailLabel>
									<DetailValue>{selectedApp.postLogoutRedirectUris?.join(', ') || 'None'}</DetailValue>
								</DetailRow>
								<DetailRow>
									<DetailLabel>Scopes:</DetailLabel>
									<DetailValue>{selectedApp.scopes?.join(', ') || 'None'}</DetailValue>
								</DetailRow>
								<DetailRow>
									<DetailLabel>Token Auth Method:</DetailLabel>
									<DetailValue>{selectedApp.tokenEndpointAuthMethod || 'client_secret_post'}</DetailValue>
								</DetailRow>
								{selectedApp.pkceEnforcement && (
									<DetailRow>
										<DetailLabel>PKCE Enforcement:</DetailLabel>
										<DetailValue>{selectedApp.pkceEnforcement}</DetailValue>
									</DetailRow>
								)}
							</>
						);
					})()}
				</ApplicationDetails>
			)}

			<RefreshButton onClick={fetchApplications} disabled={loading || disabled}>
				<FiRefreshCw size={14} />
				{loading ? 'Loading...' : 'Refresh Applications'}
			</RefreshButton>
		</Container>
	);
};

export default PingOneApplicationPicker;
