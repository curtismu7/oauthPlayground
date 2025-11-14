import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { tokenLifecycleManager } from '../utils/tokenLifecycle';
import { getOAuthTokens } from '../utils/tokenStorage';

const SharingContainer = styled.div`
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SharingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const SharingTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
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
    color: #3b82f6;
  }
`;

const ContentArea = styled.div`
  min-height: 200px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #f9fafb;
  min-height: 150px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
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
          background-color: #3b82f6;
          color: white;
          &:hover { background-color: #2563eb; }
        `;
			case 'secondary':
				return `
          background-color: #6b7280;
          color: white;
          &:hover { background-color: #4b5563; }
        `;
			case 'success':
				return `
          background-color: #10b981;
          color: white;
          &:hover { background-color: #059669; }
        `;
			case 'danger':
				return `
          background-color: #ef4444;
          color: white;
          &:hover { background-color: #dc2626; }
        `;
		}
	}}
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
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
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
			case 'success':
				return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        `;
			case 'warning':
				return `
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        `;
			case 'error':
				return `
          background-color: #fecaca;
          color: #991b1b;
          border: 1px solid #fca5a5;
        `;
		}
	}}
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  overflow-x: auto;
  margin: 1rem 0;
`;

const TokenSharing: React.FC = () => {
	const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup'>('export');
	const [selectedTokenId, setSelectedTokenId] = useState<string>('');
	const [exportData, setExportData] = useState<string>('');
	const [importData, setImportData] = useState<string>('');
	const [message, setMessage] = useState<{
		type: 'info' | 'success' | 'warning' | 'error';
		text: string;
	} | null>(null);
	const [availableTokens, setAvailableTokens] = useState<
		Array<{ id: string; flowType: string; flowName: string; isExpired: boolean }>
	>([]);

	useEffect(() => {
		loadAvailableTokens();
	}, []);

	const loadAvailableTokens = () => {
		const tokens = tokenLifecycleManager.getAllTokenLifecycleInfo();
		setAvailableTokens(
			tokens.map((token) => ({
				id: token.tokenId,
				flowType: token.flowType,
				flowName: token.flowName,
				isExpired: token.isExpired,
			}))
		);
	};

	const handleExport = () => {
		if (!selectedTokenId) {
			setMessage({ type: 'warning', text: 'Please select a token to export' });
			return;
		}

		try {
			const data = tokenLifecycleManager.exportTokenData(selectedTokenId);
			setExportData(data);
			setMessage({ type: 'success', text: 'Token data exported successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const handleDownload = () => {
		if (!exportData) {
			setMessage({ type: 'warning', text: 'No data to download' });
			return;
		}

		const blob = new Blob([exportData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `token-${selectedTokenId}-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		setMessage({ type: 'success', text: 'File downloaded successfully' });
	};

	const handleCopyToClipboard = async () => {
		if (!exportData) {
			setMessage({ type: 'warning', text: 'No data to copy' });
			return;
		}

		try {
			await navigator.clipboard.writeText(exportData);
			setMessage({ type: 'success', text: 'Data copied to clipboard' });
		} catch (error) {
			setMessage({ type: 'error', text: 'Failed to copy to clipboard' });
		}
	};

	const handleImport = () => {
		if (!importData.trim()) {
			setMessage({ type: 'warning', text: 'Please paste the token data to import' });
			return;
		}

		try {
			const data = JSON.parse(importData);

			// Validate the data structure
			if (!data.tokenId || !data.flowType || !data.flowName) {
				throw new Error('Invalid token data format');
			}

			// Here you would implement the actual import logic
			// For now, we'll just show a success message
			setMessage({
				type: 'success',
				text: 'Token data imported successfully (import functionality to be implemented)',
			});
			setImportData('');
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Import failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`,
			});
		}
	};

	const handleBackup = () => {
		try {
			const currentTokens = getOAuthTokens();
			const lifecycleData = tokenLifecycleManager.getAllTokenLifecycleInfo();

			const backupData = {
				tokens: currentTokens,
				lifecycle: lifecycleData,
				backupDate: new Date().toISOString(),
				version: '1.0',
			};

			const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `oauth-playground-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			setMessage({ type: 'success', text: 'Backup created successfully' });
		} catch (error) {
			setMessage({
				type: 'error',
				text: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	};

	const renderExportTab = () => (
		<div>
			<FormGroup>
				<Label>Select Token to Export</Label>
				<Select value={selectedTokenId} onChange={(e) => setSelectedTokenId(e.target.value)}>
					<option value="">Choose a token...</option>
					{availableTokens.map((token) => (
						<option key={token.id} value={token.id}>
							{token.flowName} ({token.flowType}) - {token.isExpired ? 'Expired' : 'Active'}
						</option>
					))}
				</Select>
			</FormGroup>

			{exportData && (
				<div>
					<Label>Exported Data</Label>
					<CodeBlock>{exportData}</CodeBlock>
					<ButtonGroup>
						<Button $variant="success" onClick={handleDownload}>
							Download JSON
						</Button>
						<Button $variant="primary" onClick={handleCopyToClipboard}>
							Copy to Clipboard
						</Button>
					</ButtonGroup>
				</div>
			)}

			<ButtonGroup>
				<Button $variant="primary" onClick={handleExport}>
					Export Token Data
				</Button>
			</ButtonGroup>
		</div>
	);

	const renderImportTab = () => (
		<div>
			<FormGroup>
				<Label>Paste Token Data (JSON)</Label>
				<TextArea
					value={importData}
					onChange={(e) => setImportData(e.target.value)}
					placeholder="Paste the exported token data here..."
				/>
			</FormGroup>

			<ButtonGroup>
				<Button $variant="primary" onClick={handleImport}>
					Import Token Data
				</Button>
				<Button $variant="secondary" onClick={() => setImportData('')}>
					Clear
				</Button>
			</ButtonGroup>
		</div>
	);

	const renderBackupTab = () => (
		<div>
			<Alert $type="info">
				<strong>Backup Information:</strong> This will create a complete backup of all your tokens
				and their lifecycle data. The backup includes token metadata, usage statistics, and security
				analysis data.
			</Alert>

			<ButtonGroup>
				<Button $variant="success" onClick={handleBackup}>
					Create Full Backup
				</Button>
			</ButtonGroup>
		</div>
	);

	return (
		<SharingContainer>
			<SharingHeader>
				<SharingTitle>Token Sharing & Management</SharingTitle>
			</SharingHeader>

			{message && <Alert $type={message.type}>{message.text}</Alert>}

			<TabContainer>
				<Tab $active={activeTab === 'export'} onClick={() => setActiveTab('export')}>
					Export Token
				</Tab>
				<Tab $active={activeTab === 'import'} onClick={() => setActiveTab('import')}>
					Import Token
				</Tab>
				<Tab $active={activeTab === 'backup'} onClick={() => setActiveTab('backup')}>
					Backup & Restore
				</Tab>
			</TabContainer>

			<ContentArea>
				{activeTab === 'export' && renderExportTab()}
				{activeTab === 'import' && renderImportTab()}
				{activeTab === 'backup' && renderBackupTab()}
			</ContentArea>
		</SharingContainer>
	);
};

export default TokenSharing;
