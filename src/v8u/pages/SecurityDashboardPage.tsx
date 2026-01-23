import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
	FiShield, 
	FiAlertTriangle, 
	FiCheckCircle, 
	FiLock, 
	FiUnlock, 
	FiEye, 
	FiEyeOff,
	FiActivity,
	FiClock,
	FiDatabase,
	FiSettings,
	FiRefreshCw,
	FiFileText,
	FiZap
} from 'react-icons/fi';
import { useUnifiedFlowState } from '../services/enhancedStateManagement';
import { securityService, type SecurityScan, type SecurityThreat } from '../services/securityService';

const PageContainer = styled.div`
	padding: 2rem;
	max-width: 1400px;
	margin: 0 auto;
`;

const PageHeader = styled.div`
	margin-bottom: 2rem;
	text-align: center;
`;

const PageTitle = styled.h1`
	color: #1e293b;
	font-size: 2rem;
	font-weight: 700;
	margin-bottom: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
`;

const PageSubtitle = styled.p`
	color: #64748b;
	font-size: 1rem;
	margin: 0;
`;

const SecurityGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

const SecurityCard = styled.div<{ $variant?: 'primary' | 'success' | 'warning' | 'danger' }>`
	background: white;
	border: 1px solid ${props => {
		switch (props.$variant) {
			case 'success': return '#10b981';
			case 'warning': return '#f59e0b';
			case 'danger': return '#ef4444';
			case 'primary': return '#3b82f6';
			default: return '#e2e8f0';
		}
	}};
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	transition: all 0.3s ease;
	
	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}
`;

const CardHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
	font-size: 1.125rem;
	font-weight: 600;
	color: #1e293b;
	margin: 0;
	display: flex;
	align-items: center;
	gap: 0.5rem;
`;

const CardValue = styled.div<{ $variant?: 'success' | 'warning' | 'danger' }>`
	font-size: 2rem;
	font-weight: 700;
	color: ${props => {
		switch (props.$variant) {
			case 'success': return '#10b981';
			case 'warning': return '#f59e0b';
			case 'danger': return '#ef4444';
			default: return '#3b82f6';
		}
	}};
	text-align: center;
	margin: 1rem 0;
`;

const SecurityScore = styled.div<{ $score: number }>`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2rem;
	font-weight: 700;
	color: white;
	margin: 0 auto 1rem;
	background: ${props => {
		if (props.$score >= 80) return 'linear-gradient(135deg, #10b981, #059669)';
		if (props.$score >= 60) return 'linear-gradient(135deg, #f59e0b, #d97706)';
		return 'linear-gradient(135deg, #ef4444, #dc2626)';
	}};
	position: relative;
	
	&::before {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: ${props => {
			if (props.$score >= 80) return 'rgba(16, 185, 129, 0.2)';
			if (props.$score >= 60) return 'rgba(245, 158, 11, 0.2)';
			return 'rgba(239, 68, 68, 0.2)';
		}};
		z-index: -1;
	}
`;

const ThreatList = styled.div`
	max-height: 300px;
	overflow-y: auto;
`;

const ThreatItem = styled.div<{ $severity: 'low' | 'medium' | 'high' | 'critical' }>`
	padding: 0.75rem;
	margin-bottom: 0.5rem;
	border-radius: 6px;
	border-left: 4px solid ${props => {
		switch (props.$severity) {
			case 'critical': return '#dc2626';
			case 'high': return '#ef4444';
			case 'medium': return '#f59e0b';
			case 'low': return '#3b82f6';
		}
	}};
	background: ${props => {
		switch (props.$severity) {
			case 'critical': return '#fef2f2';
			case 'high': return '#fef2f2';
			case 'medium': return '#fffbeb';
			case 'low': return '#eff6ff';
		}
	}};
`;

const SeverityBadge = styled.span<{ $severity: 'low' | 'medium' | 'high' | 'critical' }>`
	padding: 0.25rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	color: white;
	background: ${props => {
		switch (props.$severity) {
			case 'critical': return '#dc2626';
			case 'high': return '#ef4444';
			case 'medium': return '#f59e0b';
			case 'low': return '#3b82f6';
		}
	}};
	margin-left: 0.5rem;
`;

const ActionButton = styled.button`
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	
	&:hover {
		transform: translateY(-1px);
	}
	
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
`;

const ScanButton = styled(ActionButton)`
	background: #3b82f6;
	color: white;
	
	&:hover:not(:disabled) {
		background: #2563eb;
	}
`;

const SettingsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
	gap: 1rem;
	margin-top: 1rem;
`;

const SettingItem = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
`;

const SettingLabel = styled.span`
	font-size: 0.875rem;
	color: #374151;
`;

const SettingToggle = styled.button<{ $enabled: boolean }>`
	width: 48px;
	height: 24px;
	border-radius: 12px;
	border: none;
	background: ${props => props.$enabled ? '#10b981' : '#d1d5db'};
	position: relative;
	cursor: pointer;
	transition: background 0.2s ease;
	
	&::after {
		content: '';
		position: absolute;
		top: 2px;
		left: ${props => props.$enabled ? '26px' : '2px'};
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		transition: left 0.2s ease;
	}
`;

const AuditLogList = styled.div`
	max-height: 400px;
	overflow-y: auto;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
`;

const AuditLogItem = styled.div`
	padding: 0.75rem;
	border-bottom: 1px solid #f3f4f6;
	font-size: 0.875rem;
	
	&:last-child {
		border-bottom: none;
	}
`;

const LogTimestamp = styled.span`
	color: #64748b;
	font-size: 0.75rem;
`;

const LogEvent = styled.div`
	font-weight: 500;
	color: #1e293b;
	margin: 0.25rem 0;
`;

const LogDetails = styled.div`
	color: #64748b;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

export const SecurityDashboardPage: React.FC = () => {
	const { state, actions } = useUnifiedFlowState();
	const [isScanning, setIsScanning] = useState(false);
	const [lastScan, setLastScan] = useState<SecurityScan | null>(null);
	const [showAuditLogs, setShowAuditLogs] = useState(false);

	const securityMetrics = securityService.getSecurityMetrics();

	useEffect(() => {
		// Load last scan if available
		const scan = securityService.getLastScan();
		setLastScan(scan);
	}, []);

	const handleSecurityScan = async () => {
		setIsScanning(true);
		try {
			const scan = await securityService.performSecurityScan();
			setLastScan(scan);
			
			// Update the security metrics in state
			actions.setTokenMetrics({
				securityMetrics: {
					securityScore: scan.score,
					threatsBlocked: scan.threats.filter(t => t.blocked).length,
					lastSecurityScan: scan.timestamp,
					encryptionEnabled: securityMetrics.encryptionEnabled,
					auditLogCount: securityMetrics.auditLogCount,
				}
			});
		} catch (error) {
			console.error('Security scan failed:', error);
		} finally {
			setIsScanning(false);
		}
	};

	const handleSettingToggle = (setting: keyof typeof securityMetrics) => {
		const newValue = !securityMetrics[setting];
		securityService.updateSecuritySettings({ [setting]: newValue });
		
		// Update state
		actions.setTokenMetrics({
			securityMetrics: {
				...state.unifiedFlow.securityMetrics,
				encryptionEnabled: setting === 'encryptionEnabled' ? newValue : state.unifiedFlow.securityMetrics.encryptionEnabled,
			}
		});
	};

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleString();
	};

	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'critical': return '#dc2626';
			case 'high': return '#ef4444';
			case 'medium': return '#f59e0b';
			case 'low': return '#3b82f6';
			default: return '#64748b';
		}
	};

	const auditLogs = securityService.getAuditLogs(20);

	return (
		<PageContainer>
			<PageHeader>
				<PageTitle>
					<FiShield /> Security Dashboard
				</PageTitle>
				<PageSubtitle>
					Comprehensive security monitoring and threat detection
				</PageSubtitle>
			</PageHeader>

			<SecurityGrid>
				{/* Security Score */}
				<SecurityCard $variant="primary">
					<CardHeader>
						<CardTitle>
							<FiShield /> Security Score
						</CardTitle>
						<ScanButton onClick={handleSecurityScan} disabled={isScanning}>
							<FiRefreshCw className={isScanning ? 'animate-spin' : ''} />
							{isScanning ? 'Scanning...' : 'Scan Now'}
						</ScanButton>
					</CardHeader>
					<SecurityScore $score={lastScan?.score || state.unifiedFlow.securityMetrics.securityScore}>
						{lastScan?.score || state.unifiedFlow.securityMetrics.securityScore}
					</SecurityScore>
					<div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
						{lastScan ? `Last scan: ${formatTimestamp(lastScan.timestamp)}` : 'No scan performed'}
					</div>
				</SecurityCard>

				{/* Threats Blocked */}
				<SecurityCard $variant={state.unifiedFlow.securityMetrics.threatsBlocked > 0 ? 'warning' : 'success'}>
					<CardHeader>
						<CardTitle>
							<FiAlertTriangle /> Threats Blocked
						</CardTitle>
					</CardHeader>
					<CardValue $variant={state.unifiedFlow.securityMetrics.threatsBlocked > 0 ? 'warning' : 'success'}>
						{state.unifiedFlow.securityMetrics.threatsBlocked}
					</CardValue>
					<div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
						Total threats detected and blocked
					</div>
				</SecurityCard>

				{/* Encryption Status */}
				<SecurityCard $variant={securityMetrics.encryptionEnabled ? 'success' : 'danger'}>
					<CardHeader>
						<CardTitle>
							{securityMetrics.encryptionEnabled ? <FiLock /> : <FiUnlock />}
							Token Encryption
						</CardTitle>
					</CardHeader>
					<CardValue $variant={securityMetrics.encryptionEnabled ? 'success' : 'danger'}>
						{securityMetrics.encryptionEnabled ? 'Enabled' : 'Disabled'}
					</CardValue>
					<div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
						{securityMetrics.encryptionEnabled ? 'Tokens are encrypted' : 'Tokens stored in plain text'}
					</div>
				</SecurityCard>

				{/* Audit Logs */}
				<SecurityCard>
					<CardHeader>
						<CardTitle>
							<FiFileText /> Audit Logs
						</CardTitle>
					</CardHeader>
					<CardValue>
						{securityMetrics.auditLogCount}
					</CardValue>
					<div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
						Security events logged
					</div>
				</SecurityCard>
			</SecurityGrid>

			{/* Security Settings */}
			<SecurityCard>
				<CardHeader>
					<CardTitle>
						<FiSettings /> Security Settings
					</CardTitle>
				</CardHeader>
				<SettingsGrid>
					<SettingItem>
						<SettingLabel>Token Encryption</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.encryptionEnabled}
							onClick={() => handleSettingToggle('encryptionEnabled')}
						/>
					</SettingItem>
					<SettingItem>
						<SettingLabel>Token Masking</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.tokenMaskingEnabled}
							onClick={() => handleSettingToggle('tokenMaskingEnabled')}
						/>
					</SettingItem>
					<SettingItem>
						<SettingLabel>Secure Storage</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.secureStorageEnabled}
							onClick={() => handleSettingToggle('secureStorageEnabled')}
						/>
					</SettingItem>
					<SettingItem>
						<SettingLabel>Require Re-authentication</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.requireReauth}
							onClick={() => handleSettingToggle('requireReauth')}
						/>
					</SettingItem>
					<SettingItem>
						<SettingLabel>Session Timeout: {securityMetrics.sessionTimeoutMinutes}min</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.sessionTimeoutMinutes > 0}
							onClick={() => handleSettingToggle('sessionTimeoutMinutes')}
						/>
					</SettingItem>
					<SettingItem>
						<SettingLabel>Audit Logging</SettingLabel>
						<SettingToggle 
							$enabled={securityMetrics.auditLogging}
							onClick={() => handleSettingToggle('auditLogging')}
						/>
					</SettingItem>
				</SettingsGrid>
			</SecurityCard>

			{/* Recent Threats */}
			{lastScan && lastScan.threats.length > 0 && (
				<SecurityCard $variant="warning">
					<CardHeader>
						<CardTitle>
							<FiAlertTriangle /> Recent Threats ({lastScan.threats.length})
						</CardTitle>
					</CardHeader>
					<ThreatList>
						{lastScan.threats.map((threat) => (
							<ThreatItem key={threat.id} $severity={threat.severity}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
									<div>
										<strong>{threat.type.replace('_', ' ').toUpperCase()}</strong>
										<SeverityBadge $severity={threat.severity}>
											{threat.severity}
										</SeverityBadge>
									</div>
									<div style={{ fontSize: '0.75rem', color: '#64748b' }}>
										{formatTimestamp(threat.timestamp)}
									</div>
								</div>
								<div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
									{threat.description}
								</div>
								{threat.url && (
									<div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#3b82f6' }}>
										URL: {threat.url}
									</div>
								)}
							</ThreatItem>
						))}
					</ThreatList>
				</SecurityCard>
			)}

			{/* Recommendations */}
			{lastScan && lastScan.recommendations.length > 0 && (
				<SecurityCard>
					<CardHeader>
						<CardTitle>
							<FiZap /> Security Recommendations
						</CardTitle>
					</CardHeader>
					<div style={{ marginTop: '1rem' }}>
						{lastScan.recommendations.map((recommendation, index) => (
							<div key={index} style={{ 
								padding: '0.75rem', 
								marginBottom: '0.5rem', 
								background: '#f0f9ff',
								border: '1px solid #bae6fd',
								borderRadius: '6px',
								borderLeft: '4px solid #0ea5e9'
							}}>
								{recommendation}
							</div>
						))}
					</div>
				</SecurityCard>
			)}

			{/* Audit Logs */}
			<SecurityCard>
				<CardHeader>
					<CardTitle>
						<FiActivity /> Recent Audit Logs
					</CardTitle>
					<ActionButton onClick={() => setShowAuditLogs(!showAuditLogs)}>
						{showAuditLogs ? <FiEyeOff /> : <FiEye />}
						{showAuditLogs ? 'Hide' : 'Show'}
					</ActionButton>
				</CardHeader>
				{showAuditLogs && (
					<AuditLogList>
						{auditLogs.map((log) => (
							<AuditLogItem key={log.id}>
								<LogTimestamp>
									<FiClock style={{ marginRight: '0.25rem' }} />
									{formatTimestamp(log.timestamp)}
								</LogTimestamp>
								<LogEvent>{log.event}</LogEvent>
								{log.details && (
									<LogDetails>
										{JSON.stringify(log.details, null, 2)}
									</LogDetails>
								)}
							</AuditLogItem>
						))}
					</AuditLogList>
				)}
			</SecurityCard>
		</PageContainer>
	);
};

export default SecurityDashboardPage;
