/**
 * @file SpiffeSpireTokenDisplayPage.tsx
 * @description Educational page for SPIFFE and SPIRE token management and display
 * @version 9.27.0
 */

import React, { useState, useEffect } from 'react';
import { FiShield, FiKey, FiRefreshCw, FiCopy, FiEye, FiEyeOff, FiInfo, FiAlertTriangle, FiCheckCircle, FiDatabase, FiLock, FiUnlock } from 'react-icons/fi';
import styled from 'styled-components';
import { PageHeaderV8, PageHeaderTextColors } from '@/v8/components/shared/PageHeaderV8';
import BootstrapButton from '@/components/bootstrap/BootstrapButton';
import { toastV8 } from '@/v8/utils/toastNotificationsV8';

const _MODULE_TAG = '[🔐 SPIFFE-SPIRE-TOKEN-DISPLAY]';

interface SpiffeToken {
	svid: string;
	bundles: string[];
	selector: string;
	expiresAt: string;
	issuedAt: string;
	csr: string;
	keyId: string;
	algorithm: string;
}

interface SpireWorkload {
	workloadId: string;
	selector: string;
	attested: boolean;
	lastSeen: string;
	agentId: string;
}

const Container = styled.div`
	padding: 2rem;
	max-width: 1400px;
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

const TokenDisplay = styled.div`
	background: #1f2937;
	color: #f3f4f6;
	padding: 1.5rem;
	border-radius: 0.5rem;
	font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
	font-size: 0.875rem;
	line-height: 1.5;
	overflow-x: auto;
	margin: 1rem 0;
	position: relative;
`;

const TokenHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid #374151;
`;

const TokenContent = styled.div<{ $obfuscated: boolean }>`
	white-space: pre-wrap;
	word-break: break-all;
	filter: ${({ $obfuscated }) => ($obfuscated ? 'blur(8px)' : 'none')};
	transition: filter 0.3s ease;
`;

const InfoBox = styled.div`
	background: #eff6ff;
	border: 1px solid #bfdbfe;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #1e40af;
`;

const WarningBox = styled.div`
	background: #fef3c7;
	border: 1px solid #fcd34d;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #92400e;
`;

const SuccessBox = styled.div`
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 0.375rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #166534;
`;

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin: 1.5rem 0;
`;

const Card = styled.div`
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 0.5rem;
	padding: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1f2937;
	margin: 0 0 1rem 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const PropertyList = styled.dl`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.75rem;
	margin: 0;
	
	dt {
		font-weight: 600;
		color: #374151;
	}
	
	dd {
		color: #6b7280;
		word-break: break-all;
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 0.5rem;
	margin-top: 1rem;
	flex-wrap: wrap;
`;

const StatusBadge = styled.span<{ $status: 'valid' | 'expired' | 'invalid' }>`
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	${({ $status }) => {
		switch ($status) {
			case 'valid':
				return 'background: #10b981; color: white;';
			case 'expired':
				return 'background: #f59e0b; color: white;';
			case 'invalid':
				return 'background: #ef4444; color: white;';
			default:
				return 'background: #6b7280; color: white;';
		}
	}}
`;

const mockSpiffeToken: SpiffeToken = {
	svid: "spiffe://example.org/workload/web-server",
	bundles: ["spiffe://example.org", "spiffe://trust-domain.org"],
	selector: "unix:uid:1000",
	expiresAt: "2026-02-23T18:36:00Z",
	issuedAt: "2026-02-23T12:36:00Z",
	csr: "-----BEGIN CERTIFICATE REQUEST-----\nMIIBVjCB...mock-csr-data...\n-----END CERTIFICATE REQUEST-----",
	keyId: "key-id-12345",
	algorithm: "ECDSA"
};

const mockWorkloads: SpireWorkload[] = [
	{
		workloadId: "web-server-01",
		selector: "unix:uid:1000",
		attested: true,
		lastSeen: "2026-02-23T12:35:00Z",
		agentId: "agent-node-01"
	},
	{
		workloadId: "api-service-02",
		selector: "k8s:ns:default:pod:api-service",
		attested: true,
		lastSeen: "2026-02-23T12:34:00Z",
		agentId: "agent-node-02"
	},
	{
		workloadId: "database-03",
		selector: "unix:uid:1001",
		attested: false,
		lastSeen: "2026-02-23T12:30:00Z",
		agentId: "agent-node-01"
	}
];

export const SpiffeSpireTokenDisplayPage: React.FC = () => {
	const [currentToken, setCurrentToken] = useState<SpiffeToken | null>(mockSpiffeToken);
	const [workloads, setWorkloads] = useState<SpireWorkload[]>(mockWorkloads);
	const [showToken, setShowToken] = useState(false);
	const [copiedText, setCopiedText] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const getTokenStatus = (expiresAt: string): 'valid' | 'expired' | 'invalid' => {
		const now = new Date();
		const expiry = new Date(expiresAt);
		
		if (expiry < now) {
			return 'expired';
		}
		
		const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
		if (expiry < sixHoursFromNow) {
			return 'expired'; // Consider tokens expiring within 6 hours as "expiring soon"
		}
		
		return 'valid';
	};

	const refreshToken = async () => {
		setIsLoading(true);
		try {
			// Simulate token refresh
			await new Promise(resolve => setTimeout(resolve, 1500));
			
			const newToken: SpiffeToken = {
				...mockSpiffeToken,
				issuedAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
				keyId: `key-id-${Date.now()}`
			};
			
			setCurrentToken(newToken);
			toastV8.success('SPIFFE token refreshed successfully');
		} catch (error) {
			toastV8.error('Failed to refresh SPIFFE token');
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard.writeText(text).then(() => {
			setCopiedText(type);
			toastV8.success(`${type} copied to clipboard`);
			setTimeout(() => setCopiedText(''), 2000);
		}).catch(() => {
			toastV8.error('Failed to copy to clipboard');
		});
	};

	const formatTokenForDisplay = (token: SpiffeToken): string => {
		return JSON.stringify(token, null, 2);
	};

	const getTokenExpiryTime = (expiresAt: string): string => {
		const expiry = new Date(expiresAt);
		const now = new Date();
		const diff = expiry.getTime() - now.getTime();
		
		if (diff <= 0) {
			return 'Expired';
		}
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		
		return `${minutes}m`;
	};

	return (
		<Container>
			<PageHeaderV8
				title="SPIFFE & SPIRE Token Display"
				subtitle="Secure identity-based authentication with SPIFFE and SPIRE"
				gradient="#8b5cf6"
				textColor={PageHeaderTextColors.white}
			/>

			<Section>
				<SectionTitle>
					<FiInfo />
					About SPIFFE & SPIRE
				</SectionTitle>
				<p style={{ marginBottom: '1rem', color: '#6b7280' }}>
					SPIFFE (Secure Production Identity Framework for Everyone) provides a secure identity framework 
					for distributed systems. SPIRE (SPIFFE Runtime Environment) is the reference implementation 
					that issues and manages SPIFFE identities through X.509 SVIDs (SPIFFE Verifiable Identity Documents).
				</p>
				
				<InfoBox>
					<div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
						<FiInfo style={{ marginTop: '2px' }} />
						<div>
							<strong>Security Note:</strong> SPIFFE tokens provide cryptographically verifiable 
							identity for workloads. They are automatically rotated and managed by SPIRE, ensuring 
							continuous security without manual intervention.
						</div>
					</div>
				</InfoBox>
			</Section>

			<Section>
				<SectionTitle>
					<FiKey />
					Current SPIFFE Token
				</SectionTitle>
				
				{currentToken && (
					<>
						<TokenDisplay>
							<TokenHeader>
								<div>
									<div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
										SPIFFE Verifiable Identity Document (SVID)
									</div>
									<div style={{ fontSize: '1rem', fontWeight: 600 }}>
										{currentToken.svid}
									</div>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
									<StatusBadge $status={getTokenStatus(currentToken.expiresAt)}>
										{getTokenStatus(currentToken.expiresAt)}
									</StatusBadge>
									<span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
										Expires in {getTokenExpiryTime(currentToken.expiresAt)}
									</span>
								</div>
							</TokenHeader>
							
							<TokenContent $obfuscated={!showToken}>
								{formatTokenForDisplay(currentToken)}
							</TokenContent>
						</TokenDisplay>
						
						<ActionButtons>
							<BootstrapButton
								variant="primary"
								onClick={() => setShowToken(!showToken)}
							>
								{showToken ? <FiEyeOff /> : <FiEye />}
								{showToken ? 'Hide Token' : 'Show Token'}
							</BootstrapButton>
							
							<BootstrapButton
								variant="primary"
								onClick={() => copyToClipboard(formatTokenForDisplay(currentToken), 'Token')}
							>
								{copiedText === 'Token' ? <FiRefreshCw /> : <FiCopy />}
								{copiedText === 'Token' ? 'Copied!' : 'Copy Token'}
							</BootstrapButton>
							
							<BootstrapButton
								variant="success"
								onClick={refreshToken}
								disabled={isLoading}
							>
								{isLoading ? <FiRefreshCw /> : <FiRefreshCw />}
								{isLoading ? 'Refreshing...' : 'Refresh Token'}
							</BootstrapButton>
						</ActionButtons>
					</>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiDatabase />
					Token Details
				</SectionTitle>
				
				{currentToken && (
					<Grid>
						<Card>
							<CardTitle>
								<FiShield />
								Identity Information
							</CardTitle>
							<PropertyList>
								<dt>SVID:</dt>
								<dd>{currentToken.svid}</dd>
								<dt>Key ID:</dt>
								<dd>{currentToken.keyId}</dd>
								<dt>Algorithm:</dt>
								<dd>{currentToken.algorithm}</dd>
								<dt>Selector:</dt>
								<dd>{currentToken.selector}</dd>
							</PropertyList>
						</Card>
						
						<Card>
							<CardTitle>
								<FiRefreshCw />
								Timing Information
							</CardTitle>
							<PropertyList>
								<dt>Issued At:</dt>
								<dd>{new Date(currentToken.issuedAt).toLocaleString()}</dd>
								<dt>Expires At:</dt>
								<dd>{new Date(currentToken.expiresAt).toLocaleString()}</dd>
								<dt>Time to Expiry:</dt>
								<dd>{getTokenExpiryTime(currentToken.expiresAt)}</dd>
								<dt>Status:</dt>
								<dd>
									<StatusBadge $status={getTokenStatus(currentToken.expiresAt)}>
										{getTokenStatus(currentToken.expiresAt)}
									</StatusBadge>
								</dd>
							</PropertyList>
						</Card>
						
						<Card>
							<CardTitle>
								<FiLock />
								Trust Bundles
							</CardTitle>
							<PropertyList>
								<dt>Trust Domains:</dt>
								<dd>
									{currentToken.bundles.map((bundle, index) => (
										<div key={index} style={{ marginBottom: '0.25rem' }}>
											{bundle}
										</div>
									))}
								</dd>
								<dt>Bundle Count:</dt>
								<dd>{currentToken.bundles.length}</dd>
							</PropertyList>
						</Card>
					</Grid>
				)}
			</Section>

			<Section>
				<SectionTitle>
					<FiDatabase />
					Attested Workloads
				</SectionTitle>
				
				<div style={{ overflowX: 'auto' }}>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
						<thead>
							<tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Workload ID
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Selector
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#1f2937' }}>
									Status
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Last Seen
								</th>
								<th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>
									Agent ID
								</th>
							</tr>
						</thead>
						<tbody>
							{workloads.map((workload, index) => (
								<tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
									<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
										{workload.workloadId}
									</td>
									<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
										{workload.selector}
									</td>
									<td style={{ padding: '0.75rem', textAlign: 'center' }}>
										<StatusBadge $status={workload.attested ? 'valid' : 'invalid'}>
											{workload.attested ? 'Attested' : 'Not Attested'}
										</StatusBadge>
									</td>
									<td style={{ padding: '0.75rem' }}>
										{new Date(workload.lastSeen).toLocaleString()}
									</td>
									<td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
										{workload.agentId}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</Section>

			<Section>
				<SectionTitle>
					<FiShield />
					Security Best Practices
				</SectionTitle>
				
				<Grid>
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Token Management
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Let SPIRE handle automatic token rotation</li>
							<li>Monitor token expiration and refresh status</li>
							<li>Validate SVID chains before accepting tokens</li>
							<li>Implement proper trust bundle management</li>
							<li>Use short-lived tokens for enhanced security</li>
						</ul>
					</SuccessBox>
					
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Workload Attestation
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Configure proper workload selectors</li>
							<li>Monitor attestation status regularly</li>
							<li>Implement fallback mechanisms</li>
							<li>Log attestation failures appropriately</li>
							<li>Use node attesters for secure identity</li>
						</ul>
					</SuccessBox>
					
					<SuccessBox>
						<h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<FiCheckCircle /> Network Security
						</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#166534' }}>
							<li>Secure SPIRE server communication</li>
							<li>Implement proper firewall rules</li>
							<li>Use mTLS for inter-service communication</li>
							<li>Monitor for unauthorized access attempts</li>
							<li>Regular security audits and updates</li>
						</ul>
					</SuccessBox>
				</Grid>
			</Section>

			<Section>
				<SectionTitle>
					<FiAlertTriangle />
					Troubleshooting
				</SectionTitle>
				
				<Grid>
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Common Issues</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li><strong>Token Not Issued:</strong> Workload not properly attested</li>
							<li><strong>Expired Tokens:</strong> SPIRE server connectivity issues</li>
							<li><strong>Invalid SVID:</strong> Trust bundle misconfiguration</li>
							<li><strong>Selector Mismatch:</strong> Workload selector configuration</li>
						</ul>
					</WarningBox>
					
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Debugging Steps</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Check SPIRE agent logs for errors</li>
							<li>Verify workload attestation configuration</li>
							<li>Validate trust bundle distribution</li>
							<li>Test network connectivity to SPIRE server</li>
							<li>Review workload selector patterns</li>
						</ul>
					</WarningBox>
					
					<WarningBox>
						<h4 style={{ margin: '0 0 0.5rem 0' }}>Performance Tips</h4>
						<ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e' }}>
							<li>Optimize token refresh intervals</li>
							<li>Cache trust bundles appropriately</li>
							<li>Monitor SPIRE server performance</li>
							<li>Implement connection pooling</li>
							<li>Use efficient selector patterns</li>
						</ul>
					</WarningBox>
				</Grid>
			</Section>
		</Container>
	);
};

export default SpiffeSpireTokenDisplayPage;
