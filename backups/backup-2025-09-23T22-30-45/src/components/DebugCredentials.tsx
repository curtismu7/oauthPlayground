// src/components/DebugCredentials.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { credentialManager } from '../utils/credentialManager';

const DebugContainer = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
  font-size: 0.875rem;
`;

const DebugSection = styled.div`
  margin-bottom: 1rem;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #495057;
  }
  
  pre {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 0.5rem;
    margin: 0;
    overflow-x: auto;
  }
`;

const DebugCredentials: React.FC = () => {
	interface DebugInfo {
		allLocalStorageKeys: string[];
		pingoneKeys: string[];
		pingone_permanent_credentials: string | null;
		pingone_session_credentials: string | null;
		pingone_config: string | null;
		pingone_config_credentials: string | null;
		pingone_authz_flow_credentials: string | null;
		enhanced_flow_authorization_code: string | null;
		credentialManager: {
			permanent: Record<string, unknown>;
			session: Record<string, unknown>;
			all: Record<string, unknown>;
			config: Record<string, unknown>;
			authzFlow: Record<string, unknown>;
			arePermanentComplete: boolean;
			areAllComplete: boolean;
		};
	}

	const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

	useEffect(() => {
		const updateDebugInfo = () => {
			try {
				const allKeys = Object.keys(localStorage);
				const pingoneKeys = allKeys.filter((key) => key.includes('pingone'));

				console.log('🔍 [DebugCredentials] Updating debug info...', { allKeys, pingoneKeys });

				const info = {
					allLocalStorageKeys: allKeys,
					pingoneKeys: pingoneKeys,
					pingone_permanent_credentials: localStorage.getItem('pingone_permanent_credentials'),
					pingone_session_credentials: localStorage.getItem('pingone_session_credentials'),
					pingone_config: localStorage.getItem('pingone_config'),
					pingone_config_credentials: localStorage.getItem('pingone_config_credentials'),
					pingone_authz_flow_credentials: localStorage.getItem('pingone_authz_flow_credentials'),
					enhanced_flow_authorization_code: localStorage.getItem(
						'enhanced-flow-authorization-code'
					),
					credentialManager: {
						permanent: credentialManager.loadPermanentCredentials(),
						session: credentialManager.loadSessionCredentials(),
						all: credentialManager.getAllCredentials(),
						config: credentialManager.loadConfigCredentials(),
						authzFlow: credentialManager.loadAuthzFlowCredentials(),
						arePermanentComplete: credentialManager.arePermanentCredentialsComplete(),
						areAllComplete: credentialManager.areAllCredentialsComplete(),
					},
				};

				console.log('🔍 [DebugCredentials] Debug info created:', info);
				setDebugInfo(info);
			} catch (error) {
				console.error('❌ [DebugCredentials] Error updating debug info:', error);
				setDebugInfo({
					allLocalStorageKeys: ['Error loading'],
					pingoneKeys: [],
					pingone_permanent_credentials: null,
					pingone_session_credentials: null,
					pingone_config: null,
					pingone_config_credentials: null,
					pingone_authz_flow_credentials: null,
					enhanced_flow_authorization_code: null,
					credentialManager: {
						permanent: {},
						session: {},
						all: {},
						config: {},
						authzFlow: {},
						arePermanentComplete: false,
						areAllComplete: false,
					},
				});
			}
		};

		updateDebugInfo();

		// Update every 2 seconds
		const interval = setInterval(updateDebugInfo, 2000);

		return () => clearInterval(interval);
	}, []);

	if (!debugInfo) {
		return (
			<DebugContainer>
				<h3>🔍 Credential Debug Information</h3>
				<p>Loading debug information...</p>
			</DebugContainer>
		);
	}

	return (
		<DebugContainer>
			<h3>🔍 Credential Debug Information</h3>

			<DebugSection>
				<h4>All localStorage Keys:</h4>
				<pre>{JSON.stringify(debugInfo.allLocalStorageKeys, null, 2)}</pre>
			</DebugSection>

			<DebugSection>
				<h4>PingOne Keys:</h4>
				<pre>{JSON.stringify(debugInfo.pingoneKeys, null, 2)}</pre>
			</DebugSection>

			<DebugSection>
				<h4>pingone_permanent_credentials (raw):</h4>
				<pre>{debugInfo.pingone_permanent_credentials || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>pingone_session_credentials (raw):</h4>
				<pre>{debugInfo.pingone_session_credentials || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>pingone_config (raw):</h4>
				<pre>{debugInfo.pingone_config || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>pingone_config_credentials (raw):</h4>
				<pre>{debugInfo.pingone_config_credentials || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>pingone_authz_flow_credentials (raw):</h4>
				<pre>{debugInfo.pingone_authz_flow_credentials || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>enhanced_flow_authorization_code (raw):</h4>
				<pre>{debugInfo.enhanced_flow_authorization_code || 'null'}</pre>
			</DebugSection>

			<DebugSection>
				<h4>Credential Manager Results:</h4>
				<pre>{JSON.stringify(debugInfo.credentialManager, null, 2)}</pre>
			</DebugSection>
		</DebugContainer>
	);
};

export default DebugCredentials;
