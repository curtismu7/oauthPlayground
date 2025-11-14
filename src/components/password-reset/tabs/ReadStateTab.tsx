// src/components/password-reset/tabs/ReadStateTab.tsx
// Read Password State Tab Component

import React from 'react';
import { FiAlertCircle, FiBook, FiExternalLink, FiRefreshCw, FiLock, FiUnlock, FiCheckCircle, FiXCircle, FiClock } from '../../../services/commonImportsService';
import { Card, Alert, DocumentationSection, DocumentationLink, Button, SpinningIcon } from '../shared/PasswordResetSharedComponents';
import { UserLookupForm } from '../shared/UserLookupForm';
import { type PingOneUser } from '../shared/useUserLookup';
import { readPasswordState } from '../../../services/passwordResetService';
import { v4ToastManager } from '../../../utils/v4ToastMessages';
import { ColoredJsonDisplay } from '../../ColoredJsonDisplay';
import styled from 'styled-components';

const StateDisplayContainer = styled.div`
	background: linear-gradient(135deg, #EBF4FF 0%, #E0F2FE 100%);
	border: 2px solid #3B82F6;
	border-radius: 0.75rem;
	padding: 1.5rem;
	margin-top: 1.5rem;
	box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);
`;

const StateTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 700;
	color: #1E40AF;
	margin-bottom: 1.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StateGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-bottom: 1rem;
`;

const StateItem = styled.div`
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid #3B82F6;
	border-radius: 0.5rem;
	padding: 1rem;
`;

const StateLabel = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #1E40AF;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const StateValue = styled.div<{ $status?: 'good' | 'warning' | 'error' | 'neutral' }>`
	font-size: 1rem;
	font-weight: 600;
	color: ${props => {
		switch (props.$status) {
			case 'good': return '#065F46';
			case 'warning': return '#92400E';
			case 'error': return '#991B1B';
			default: return '#1F2937';
		}
	}};
	background: ${props => {
		switch (props.$status) {
			case 'good': return '#D1FAE5';
			case 'warning': return '#FEF3C7';
			case 'error': return '#FEE2E2';
			default: return '#F3F4F6';
		}
	}};
	padding: 0.5rem;
	border-radius: 0.375rem;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	word-break: break-word;
`;

interface ReadStateTabProps {
	environmentId: string;
	workerToken: string;
}

export const ReadStateTab: React.FC<ReadStateTabProps> = ({ environmentId, workerToken }) => {
	const [user, setUser] = React.useState<PingOneUser | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [passwordState, setPasswordState] = React.useState<Record<string, unknown> | null>(null);

	const handleReadState = async () => {
		if (!user || !user.id || !workerToken || !environmentId) {
			v4ToastManager.showError('Please lookup a user first');
			return;
		}

		setLoading(true);
		try {
			const result = await readPasswordState(environmentId, user.id, workerToken);
			if (result.success && result.passwordState) {
				setPasswordState(result.passwordState);
				v4ToastManager.showSuccess('Password state retrieved successfully!');
			} else {
				v4ToastManager.showError(result.errorDescription || 'Failed to read password state');
			}
		} catch (error) {
			v4ToastManager.showError(error instanceof Error ? error.message : 'Failed to read password state');
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setUser(null);
		setPasswordState(null);
	};

	return (
		<Card>
			<h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#1F2937' }}>Read Password State</h2>
			
			<Alert $type="info" style={{ marginBottom: '1.5rem' }}>
				<FiAlertCircle />
				<div>
					<strong>How This Works:</strong>
					<p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
						<strong>Requires:</strong> Worker token<br/>
						<strong>Method:</strong> GET (no special Content-Type header)<br/>
						Retrieve the current password state information for a user, including lock status, expiration, and change requirements.
					</p>
				</div>
			</Alert>
			
			<DocumentationSection>
				<DocumentationLink 
					href="https://apidocs.pingidentity.com/pingone/platform/v1/api/#user-passwords" 
					target="_blank" 
					rel="noopener noreferrer"
				>
					<FiBook />
					PingOne API: Read Password State (GET method)
					<FiExternalLink size={14} />
				</DocumentationLink>
			</DocumentationSection>

			<UserLookupForm
				environmentId={environmentId}
				workerToken={workerToken}
				onUserFound={setUser}
			/>

			{user && user.id && (
				<>
					<Button onClick={handleReadState} disabled={loading} style={{ marginTop: '1rem' }}>
						{loading ? <SpinningIcon /> : <FiRefreshCw />}
						{loading ? 'Reading...' : 'Read Password State'}
					</Button>
					<Button $variant="secondary" onClick={handleReset} style={{ marginTop: '1rem', marginLeft: '0.5rem' }}>
						Reset
					</Button>

					{passwordState && (
						<>
							<StateDisplayContainer>
								<StateTitle>
									<FiLock />
									Password State Information
								</StateTitle>
								
								<StateGrid>
									{/* Status */}
									{passwordState.status && (
										<StateItem>
											<StateLabel>
												{passwordState.status === 'OK' ? <FiCheckCircle /> : <FiXCircle />}
												Status
											</StateLabel>
											<StateValue $status={passwordState.status === 'OK' ? 'good' : 'error'}>
												{String(passwordState.status)}
											</StateValue>
										</StateItem>
									)}
									
									{/* Force Change */}
									{passwordState.forceChange !== undefined && (
										<StateItem>
											<StateLabel>
												<FiAlertCircle />
												Force Change Required
											</StateLabel>
											<StateValue $status={passwordState.forceChange ? 'warning' : 'good'}>
												{passwordState.forceChange ? 'YES' : 'NO'}
											</StateValue>
										</StateItem>
									)}
									
									{/* Last Changed */}
									{passwordState.lastChangedAt && (
										<StateItem>
											<StateLabel>
												<FiClock />
												Last Changed
											</StateLabel>
											<StateValue $status="neutral">
												{new Date(String(passwordState.lastChangedAt)).toLocaleString()}
											</StateValue>
										</StateItem>
									)}
									
									{/* Expires At */}
									{passwordState.expiresAt && (
										<StateItem>
											<StateLabel>
												<FiClock />
												Expires At
											</StateLabel>
											<StateValue $status="warning">
												{new Date(String(passwordState.expiresAt)).toLocaleString()}
											</StateValue>
										</StateItem>
									)}
									
									{/* Locked */}
									{passwordState.locked !== undefined && (
										<StateItem>
											<StateLabel>
												{passwordState.locked ? <FiLock /> : <FiUnlock />}
												Account Locked
											</StateLabel>
											<StateValue $status={passwordState.locked ? 'error' : 'good'}>
												{passwordState.locked ? 'YES' : 'NO'}
											</StateValue>
										</StateItem>
									)}
									
									{/* Failed Attempts */}
									{passwordState.failedAttempts !== undefined && (
										<StateItem>
											<StateLabel>
												<FiXCircle />
												Failed Login Attempts
											</StateLabel>
											<StateValue $status={Number(passwordState.failedAttempts) > 0 ? 'warning' : 'good'}>
												{String(passwordState.failedAttempts)}
											</StateValue>
										</StateItem>
									)}
									
									{/* Remaining Attempts */}
									{passwordState.remainingAttempts !== undefined && (
										<StateItem>
											<StateLabel>
												<FiAlertCircle />
												Remaining Attempts
											</StateLabel>
											<StateValue $status={Number(passwordState.remainingAttempts) < 3 ? 'warning' : 'good'}>
												{String(passwordState.remainingAttempts)}
											</StateValue>
										</StateItem>
									)}
								</StateGrid>
							</StateDisplayContainer>
							
							<div style={{ marginTop: '1.5rem' }}>
								<ColoredJsonDisplay
									data={passwordState}
									label="Raw JSON Response"
									collapsible={true}
									defaultCollapsed={true}
									maxHeight="400px"
									showCopyButton={true}
								/>
							</div>
						</>
					)}
				</>
			)}
		</Card>
	);
};

