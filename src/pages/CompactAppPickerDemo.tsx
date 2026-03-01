// src/pages/CompactAppPickerDemo.tsx
// Demo page for testing the compact application picker with real PingOne data

import { FiAlertCircle, FiCheckCircle, FiKey, FiX } from '@icons';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { CompactApplicationPicker } from '../components/CompactApplicationPicker';
import { WorkerTokenDetectedBanner } from '../components/WorkerTokenDetectedBanner';
import { WorkerTokenModal } from '../components/WorkerTokenModal';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { getAnyWorkerToken } from '../utils/workerTokenDetection';

const PageContainer = styled.div`
	max-width: 90rem;
	margin: 0 auto;
	padding: 2rem 1.5rem 4rem;
	display: flex;
	flex-direction: column;
	gap: 1.75rem;
`;

const HeaderCard = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1.75rem;
	border-radius: 1rem;
	background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.04));
	border: 1px solid rgba(102, 126, 234, 0.2);
`;

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	color: #4f46e5;
`;

const Title = styled.h1`
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
`;

const Subtitle = styled.p`
	margin: 0;
	color: #4338ca;
	max-width: 720px;
	line-height: 1.6;
`;

const Card = styled.div`
	background: #ffffff;
	border-radius: 1rem;
	border: 1px solid #e2e8f0;
	box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.18);
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
`;

const SectionTitle = styled.h2`
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.1rem;
	font-weight: 600;
	color: #0f172a;
`;

const ButtonRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
`;

const PrimaryButton = styled.button<{ disabled?: boolean }>`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: ${({ disabled }) => (disabled ? '#cbd5f5' : '#667eea')};
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: ${({ disabled }) => (disabled ? 'none' : 'translateY(-1px)')};
		box-shadow: ${({ disabled }) => (disabled ? 'none' : '0 10px 22px -12px rgba(102, 126, 234, 0.65)')};
	}
`;

const DangerButton = styled.button`
	border: none;
	border-radius: 0.75rem;
	padding: 0.85rem 1.35rem;
	background: #ef4444;
	color: white;
	font-weight: 600;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 10px 22px -12px rgba(239, 68, 68, 0.65);
		background: #dc2626;
	}
`;

const WarningBanner = styled.div`
	padding: 1rem;
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 0.75rem;
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
`;

const SelectedAppCard = styled.div`
	padding: 1.5rem;
	background: #f0f9ff;
	border: 1px solid #bae6fd;
	border-radius: 0.75rem;
`;

const SelectedAppTitle = styled.h3`
	margin: 0 0 1rem 0;
	font-size: 1rem;
	color: #0c4a6e;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const AppDetails = styled.div`
	display: grid;
	grid-template-columns: 140px 1fr;
	gap: 0.75rem;
	font-size: 0.875rem;
`;

const DetailLabel = styled.div`
	font-weight: 600;
	color: #64748b;
	padding: 0.5rem;
	background: white;
	border-radius: 0.375rem;
`;

const DetailValue = styled.div`
	color: #1e293b;
	padding: 0.5rem;
	word-break: break-word;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.8rem;
	background: white;
	border-radius: 0.375rem;
	border: 1px solid #e2e8f0;
`;

const CompactAppPickerDemo: React.FC = () => {
	const [workerToken, setWorkerToken] = useState<string>(() => getAnyWorkerToken() || '');
	const [showWorkerTokenModal, setShowWorkerTokenModal] = useState(false);
	const [selectedApp, setSelectedApp] = useState<any>(null);
	const [environmentId, setEnvironmentId] = useState<string>(() => {
		const credsStr = localStorage.getItem('worker_credentials');
		const creds = credsStr ? JSON.parse(credsStr) : null;
		return creds?.environmentId || '';
	});

	const hasWorkerToken = !!workerToken;

	useEffect(() => {
		const checkWorkerToken = () => {
			const token = getAnyWorkerToken() || '';
			setWorkerToken(token);
		};

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key?.startsWith('worker_token') || e.key?.startsWith('pingone_worker_token')) {
				checkWorkerToken();
			}
		};

		const handleWorkerTokenUpdate = () => {
			checkWorkerToken();
			const credsStr = localStorage.getItem('worker_credentials');
			const creds = credsStr ? JSON.parse(credsStr) : null;
			if (creds?.environmentId) {
				setEnvironmentId(creds.environmentId);
			}
		};

		window.addEventListener('storage', handleStorageChange);
		window.addEventListener('workerTokenUpdated', handleWorkerTokenUpdate);
		const pollInterval = setInterval(checkWorkerToken, 1000);

		return () => {
			window.removeEventListener('storage', handleStorageChange);
			window.removeEventListener('workerTokenUpdated', handleWorkerTokenUpdate);
			clearInterval(pollInterval);
		};
	}, []);

	const handleClearWorkerToken = useCallback(() => {
		localStorage.removeItem('worker_token');
		localStorage.removeItem('worker_token_expires_at');
		localStorage.removeItem('pingone_worker_token');
		setWorkerToken('');
		setSelectedApp(null);
		v4ToastManager.showSuccess('Worker token cleared successfully.');
	}, []);

	const handleGetWorkerToken = useCallback(() => {
		setShowWorkerTokenModal(true);
	}, []);

	const handleAppSelect = useCallback((app: any) => {
		setSelectedApp(app);
		console.log('Selected application:', app);
	}, []);

	return (
		<PageContainer>
			<HeaderCard>
				<TitleRow>
					<FiKey size={24} />
					<Title>Compact Application Picker Demo</Title>
				</TitleRow>
				<Subtitle>
					Test the compact application picker component with real PingOne data. This picker fetches
					applications from your PingOne environment and displays them in a space-efficient
					dropdown.
				</Subtitle>
				{!hasWorkerToken && (
					<WarningBanner>
						<FiAlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
						<div style={{ flex: 1 }}>
							<strong>Worker Token Required</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								Click "Get Worker Token" below to generate a token with your PingOne credentials.
							</p>
						</div>
					</WarningBanner>
				)}
			</HeaderCard>

			<Card>
				<SectionTitle>
					<FiKey /> Authentication
				</SectionTitle>

				{hasWorkerToken ? (
					<WorkerTokenDetectedBanner token={workerToken} tokenExpiryKey="worker_token_expires_at" />
				) : (
					<WarningBanner>
						<FiAlertCircle size={18} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
						<div style={{ flex: 1 }}>
							<strong>No Worker Token Found</strong>
							<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
								Click the button below to open the Worker Token modal and generate a token.
							</p>
						</div>
					</WarningBanner>
				)}

				<ButtonRow>
					<PrimaryButton
						onClick={handleGetWorkerToken}
						type="button"
						style={{ background: hasWorkerToken ? '#10b981' : undefined }}
					>
						{hasWorkerToken ? (
							<>
								<FiCheckCircle /> Worker Token Ready
							</>
						) : (
							<>
								<FiKey /> Get Worker Token
							</>
						)}
					</PrimaryButton>
					{hasWorkerToken && (
						<DangerButton onClick={handleClearWorkerToken} type="button">
							<FiX /> Clear Token
						</DangerButton>
					)}
				</ButtonRow>
			</Card>

			<Card>
				<SectionTitle>
					<FiCheckCircle /> Application Picker
				</SectionTitle>

				<CompactApplicationPicker
					environmentId={environmentId}
					workerToken={workerToken}
					onSelect={handleAppSelect}
					disabled={!hasWorkerToken}
				/>

				{!hasWorkerToken && (
					<p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
						Generate a worker token above to enable the application picker.
					</p>
				)}
			</Card>

			{selectedApp && (
				<SelectedAppCard>
					<SelectedAppTitle>
						<FiCheckCircle /> Selected Application
					</SelectedAppTitle>
					<AppDetails>
						<DetailLabel>Name</DetailLabel>
						<DetailValue>{selectedApp.name}</DetailValue>

						<DetailLabel>Application ID</DetailLabel>
						<DetailValue>{selectedApp.id}</DetailValue>

						{selectedApp.protocol && (
							<>
								<DetailLabel>Protocol</DetailLabel>
								<DetailValue>{selectedApp.protocol}</DetailValue>
							</>
						)}

						{selectedApp.type && (
							<>
								<DetailLabel>Type</DetailLabel>
								<DetailValue>{selectedApp.type}</DetailValue>
							</>
						)}

						{selectedApp.enabled !== undefined && (
							<>
								<DetailLabel>Status</DetailLabel>
								<DetailValue>{selectedApp.enabled ? 'Enabled' : 'Disabled'}</DetailValue>
							</>
						)}
					</AppDetails>
				</SelectedAppCard>
			)}

			<WorkerTokenModal
				isOpen={showWorkerTokenModal}
				onClose={() => setShowWorkerTokenModal(false)}
				storageKey="worker_token"
				expiryKey="worker_token_expires_at"
				eventName="workerTokenUpdated"
			/>
		</PageContainer>
	);
};

export default CompactAppPickerDemo;
