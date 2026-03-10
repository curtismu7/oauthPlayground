import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { JWKSResponse, jwksService } from '../services/jwksService';
import { unifiedWorkerTokenService } from '../services/unifiedWorkerTokenService';
import { logger } from '../utils/logger';

const ViewerContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ViewerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ViewerTitle = styled.h3`
  margin: 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 1.25rem;
`;

const Button = styled.button<{ $variant: 'primary' | 'secondary' | 'success' | 'danger' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  
  ${({ $variant }) => {
		switch ($variant) {
			case 'primary':
				return `
          background-color: V9_COLORS.PRIMARY.BLUE;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.BLUE_DARK; }
        `;
			case 'secondary':
				return `
          background-color: V9_COLORS.TEXT.GRAY_MEDIUM;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: V9_COLORS.PRIMARY.GREEN;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.GREEN_DARK; }
        `;
			case 'danger':
				return `
          background-color: V9_COLORS.PRIMARY.RED;
          color: white;
          &:hover { background-color: V9_COLORS.PRIMARY.RED_DARK; }
        `;
		}
	}}
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 200px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: V9_COLORS.PRIMARY.BLUE;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CodeBlock = styled.pre`
  background: V9_COLORS.TEXT.GRAY_DARK;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
  max-height: 400px;
  overflow-y: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: V9_COLORS.TEXT.GRAY_DARK;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
  font-weight: 500;
`;

const KeyList = styled.div`
  margin-top: 1rem;
`;

const KeyItem = styled.div`
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #f9fafb;
`;

const KeyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const KeyID = styled.h4`
  margin: 0;
  color: V9_COLORS.TEXT.GRAY_DARK;
  font-size: 1rem;
  font-weight: 600;
`;

const KeyType = styled.span<{ $type: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${({ $type }) => {
		switch ($type) {
			case 'RSA':
				return `
          background-color: #dbeafe;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
        `;
			case 'EC':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
        `;
			case 'oct':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
        `;
			default:
				return `
          background-color: #f3f4f6;
          color: V9_COLORS.TEXT.GRAY_MEDIUM;
        `;
		}
	}}
`;

const KeyDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  font-size: 0.875rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const DetailLabel = styled.span`
  font-weight: 500;
  color: V9_COLORS.TEXT.GRAY_DARK;
`;

const DetailValue = styled.span`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  word-break: break-all;
`;

const Alert = styled.div<{ $type: 'info' | 'success' | 'warning' | 'error' }>`
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  
  ${({ $type }) => {
		switch ($type) {
			case 'info':
				return `
          background-color: #dbeafe;
          color: V9_COLORS.PRIMARY.BLUE_DARK;
          border: 1px solid #93c5fd;
        `;
			case 'success':
				return `
          background-color: V9_COLORS.BG.SUCCESS;
          color: V9_COLORS.PRIMARY.GREEN;
          border: 1px solid #86efac;
        `;
			case 'warning':
				return `
          background-color: V9_COLORS.BG.WARNING;
          color: V9_COLORS.PRIMARY.YELLOW_DARK;
          border: 1px solid V9_COLORS.BG.WARNING_BORDER;
        `;
			case 'error':
				return `
          background-color: V9_COLORS.BG.ERROR_BORDER;
          color: V9_COLORS.PRIMARY.RED_DARK;
          border: 1px solid #fca5a5;
        `;
		}
	}}
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: V9_COLORS.TEXT.GRAY_MEDIUM;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? '#3b82f6' : 'transparent')};
  color: ${({ $active }) => ($active ? '#3b82f6' : '#6b7280')};
  
  &:hover {
    color: V9_COLORS.PRIMARY.BLUE;
  }
`;

const JWKSViewer: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'fetch' | 'view' | 'import'>('fetch');
	const [environmentId, setEnvironmentId] = useState(() => {
		// Auto-populate from worker token credentials
		try {
			// Try synchronous check from localStorage for worker token credentials
			const stored = localStorage.getItem('unified_worker_token');
			if (stored) {
				const data = JSON.parse(stored);
				if (data.credentials?.environmentId) {
					return data.credentials.environmentId;
				}
			}
		} catch {
			return '';
		}
		return '';
	});
	const [jwksResponse, setJwksResponse] = useState<JWKSResponse | null>(null);
	const [importJson, setImportJson] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{
		type: 'info' | 'success' | 'warning' | 'error';
		text: string;
	} | null>(null);

	// Update environment ID when worker token is updated (load from unified storage)
	useEffect(() => {
		const handleTokenUpdate = async () => {
			try {
				const result = await unifiedWorkerTokenService.loadCredentials();
				if (result.success && result.data?.environmentId && !environmentId.trim()) {
					setEnvironmentId(result.data.environmentId);
				}
			} catch (error) {
				logger.error(
					'JWKSViewer',
					'Failed to update environment ID from worker token:',
					undefined,
					error as Error
				);
			}
		};

		window.addEventListener('workerTokenUpdated', handleTokenUpdate);
		return () => {
			window.removeEventListener('workerTokenUpdated', handleTokenUpdate);
		};
	}, [environmentId]);

	const handleFetchJWKS = async () => {
		if (!environmentId.trim()) {
			setMessage({ type: 'warning', text: 'Please enter an environment ID' });
			return;
		}

		try {
			setLoading(true);
			setMessage(null);

			const response = await jwksService.fetchJWKS(environmentId);
			setJwksResponse(response);
			setMessage({
				type: 'success',
				text: `JWKS fetched successfully with ${response.jwks.keys.length} keys`,
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to fetch JWKS';
			setMessage({ type: 'error', text: errorMessage });
		} finally {
			setLoading(false);
		}
	};

	const handleGenerateMockJWKS = () => {
		try {
			const mockJWKS = jwksService.generateMockJWKS();
			const mockResponse: JWKSResponse = {
				jwks: mockJWKS,
				jwks_uri: 'https://auth.pingone.com/mock-env-id/as/jwks',
				issuer: 'https://auth.pingone.com/mock-env-id/as',
				lastUpdated: new Date(),
			};

			setJwksResponse(mockResponse);
			setMessage({ type: 'success', text: 'Mock JWKS generated successfully' });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate mock JWKS';
			setMessage({ type: 'error', text: errorMessage });
		}
	};

	const handleImportJWKS = () => {
		try {
			if (!importJson.trim()) {
				setMessage({ type: 'warning', text: 'Please enter JWKS JSON' });
				return;
			}

			const jwks = jwksService.importJWKS(importJson);
			const response: JWKSResponse = {
				jwks,
				jwks_uri: 'imported',
				issuer: 'imported',
				lastUpdated: new Date(),
			};

			setJwksResponse(response);
			setMessage({ type: 'success', text: 'JWKS imported successfully' });
			setImportJson('');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to import JWKS';
			setMessage({ type: 'error', text: errorMessage });
		}
	};

	const handleExportJWKS = () => {
		if (!jwksResponse) return;

		const jsonString = jwksService.exportJWKS(jwksResponse.jwks);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `jwks-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		setMessage({ type: 'success', text: 'JWKS exported successfully' });
	};

	const handleCopyToClipboard = async () => {
		if (!jwksResponse) return;

		try {
			const jsonString = jwksService.exportJWKS(jwksResponse.jwks);
			await navigator.clipboard.writeText(jsonString);
			setMessage({ type: 'success', text: 'JWKS copied to clipboard' });
		} catch (_error) {
			setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
		}
	};

	const handleClearCache = () => {
		jwksService.clearCache(environmentId);
		setMessage({ type: 'success', text: 'JWKS cache cleared' });
	};

	const renderFetchTab = () => (
		<div>
			<FormGroup>
				<Label>PingOne Environment ID</Label>
				<Input
					type="text"
					value={environmentId}
					onChange={(e) => setEnvironmentId(e.target.value)}
					placeholder="your-environment-id"
				/>
			</FormGroup>

			<div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
				<Button $variant="primary" onClick={handleFetchJWKS} disabled={loading}>
					{loading ? 'Fetching...' : 'Fetch JWKS'}
				</Button>
				<Button $variant="secondary" onClick={handleGenerateMockJWKS}>
					Generate Mock JWKS
				</Button>
				<Button $variant="danger" onClick={handleClearCache}>
					Clear Cache
				</Button>
			</div>
		</div>
	);

	const renderViewTab = () => {
		if (!jwksResponse) {
			return (
				<div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
					No JWKS loaded. Fetch or import JWKS to view details.
				</div>
			);
		}

		const stats = jwksService.getKeyStatistics(jwksResponse.jwks);

		return (
			<div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '1rem',
					}}
				>
					<h4>JWKS Details</h4>
					<div>
						<Button $variant="success" onClick={handleCopyToClipboard}>
							Copy JSON
						</Button>
						<Button $variant="secondary" onClick={handleExportJWKS}>
							Export
						</Button>
					</div>
				</div>

				<StatsGrid>
					<StatCard>
						<StatValue>{stats.totalKeys}</StatValue>
						<StatLabel>Total Keys</StatLabel>
					</StatCard>
					<StatCard>
						<StatValue>{Object.keys(stats.keyTypes).length}</StatValue>
						<StatLabel>Key Types</StatLabel>
					</StatCard>
					<StatCard>
						<StatValue>{Object.keys(stats.algorithms).length}</StatValue>
						<StatLabel>Algorithms</StatLabel>
					</StatCard>
					<StatCard>
						<StatValue>{Object.keys(stats.uses).length}</StatValue>
						<StatLabel>Uses</StatLabel>
					</StatCard>
				</StatsGrid>

				<div style={{ marginBottom: '1rem' }}>
					<h5>Key Types</h5>
					<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
						{Object.entries(stats.keyTypes).map(([type, count]) => (
							<KeyType key={type} $type={type}>
								{type}: {count}
							</KeyType>
						))}
					</div>
				</div>

				<div style={{ marginBottom: '1rem' }}>
					<h5>Algorithms</h5>
					<div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
						{Object.entries(stats.algorithms).map(([alg, count]) => (
							<span
								key={alg}
								style={{
									padding: '0.25rem 0.5rem',
									backgroundColor: '#f3f4f6',
									borderRadius: '0.25rem',
									fontSize: '0.75rem',
								}}
							>
								{alg}: {count}
							</span>
						))}
					</div>
				</div>

				<KeyList>
					<h5>Keys</h5>
					{jwksResponse.jwks.keys.map((key, index) => (
						<KeyItem key={key.kid || index}>
							<KeyHeader>
								<KeyID>{key.kid || `Key ${index + 1}`}</KeyID>
								<KeyType $type={key.kty}>{key.kty}</KeyType>
							</KeyHeader>
							<KeyDetails>
								<DetailItem>
									<DetailLabel>Algorithm</DetailLabel>
									<DetailValue>{key.alg}</DetailValue>
								</DetailItem>
								<DetailItem>
									<DetailLabel>Use</DetailLabel>
									<DetailValue>{key.use}</DetailValue>
								</DetailItem>
								{key.n && (
									<DetailItem>
										<DetailLabel>Modulus (n)</DetailLabel>
										<DetailValue>{key.n.substring(0, 50)}...</DetailValue>
									</DetailItem>
								)}
								{key.e && (
									<DetailItem>
										<DetailLabel>Exponent (e)</DetailLabel>
										<DetailValue>{key.e}</DetailValue>
									</DetailItem>
								)}
								{key.crv && (
									<DetailItem>
										<DetailLabel>Curve</DetailLabel>
										<DetailValue>{key.crv}</DetailValue>
									</DetailItem>
								)}
							</KeyDetails>
						</KeyItem>
					))}
				</KeyList>

				<div style={{ marginTop: '1rem' }}>
					<h5>Full JWKS JSON</h5>
					<CodeBlock>{jwksService.exportJWKS(jwksResponse.jwks)}</CodeBlock>
				</div>
			</div>
		);
	};

	const renderImportTab = () => (
		<div>
			<FormGroup>
				<Label>JWKS JSON</Label>
				<TextArea
					value={importJson}
					onChange={(e) => setImportJson(e.target.value)}
					placeholder="Paste JWKS JSON here..."
				/>
			</FormGroup>

			<Button $variant="primary" onClick={handleImportJWKS}>
				Import JWKS
			</Button>
		</div>
	);

	return (
		<ViewerContainer>
			<ViewerHeader>
				<ViewerTitle>JWKS Viewer</ViewerTitle>
			</ViewerHeader>

			{message && <Alert $type={message.type}>{message.text}</Alert>}

			<TabContainer>
				<Tab $active={activeTab === 'fetch'} onClick={() => setActiveTab('fetch')}>
					Fetch JWKS
				</Tab>
				<Tab $active={activeTab === 'view'} onClick={() => setActiveTab('view')}>
					View JWKS
				</Tab>
				<Tab $active={activeTab === 'import'} onClick={() => setActiveTab('import')}>
					Import JWKS
				</Tab>
			</TabContainer>

			{loading && <LoadingSpinner>Fetching JWKS...</LoadingSpinner>}

			{!loading && (
				<>
					{activeTab === 'fetch' && renderFetchTab()}
					{activeTab === 'view' && renderViewTab()}
					{activeTab === 'import' && renderImportTab()}
				</>
			)}
		</ViewerContainer>
	);
};

export default JWKSViewer;
