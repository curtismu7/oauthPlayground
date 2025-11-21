// src/components/ClientCredentialManager.tsx
// Component for managing client credentials in V8 apps
// Allows adding client secrets and importing from environment variables

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useCredentialStoreV8 } from '../hooks/useCredentialStoreV8';

const Container = styled.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: #f9fafb;
  margin: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 1rem;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  ${(props) => {
		switch (props.variant) {
			case 'primary':
				return `
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;

          &:hover:not(:disabled) {
            background: #2563eb;
            border-color: #2563eb;
          }
        `;
			case 'danger':
				return `
          background: #ef4444;
          color: white;
          border: 1px solid #ef4444;

          &:hover:not(:disabled) {
            background: #dc2626;
            border-color: #dc2626;
          }
        `;
			default:
				return `
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;

          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
          }
        `;
		}
	}}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AppList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const AppItem = styled.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: white;
`;

const AppHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const AppName = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 0.875rem;
`;

const CredentialStatus = styled.div<{ $hasSecret: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => (props.$hasSecret ? '#059669' : '#d97706')};
  font-weight: 500;
`;

const FormGroup = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #374151;
  font-size: 0.75rem;
`;

const Input = styled.input`
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.75rem;
`;

interface ClientCredentialManagerProps {
	onCredentialsUpdated?: () => void;
}

export const ClientCredentialManager: React.FC<ClientCredentialManagerProps> = ({
	onCredentialsUpdated,
}) => {
	const { apps, addOrUpdateApp } = useCredentialStoreV8();
	const [editingApp, setEditingApp] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({
		clientSecret: '',
		scopes: [] as string[],
	});

	// Load environment variables for auto-import
	const [envCredentials, setEnvCredentials] = useState({
		clientId: '',
		clientSecret: '',
		environmentId: '',
	});

	useEffect(() => {
		// Load from environment variables
		const envClientId = import.meta.env?.VITE_PINGONE_CLIENT_ID || '';
		const envClientSecret = import.meta.env?.VITE_PINGONE_CLIENT_SECRET || '';
		const envEnvironmentId = import.meta.env?.VITE_PINGONE_ENVIRONMENT_ID || '';

		setEnvCredentials({
			clientId: envClientId,
			clientSecret: envClientSecret,
			environmentId: envEnvironmentId,
		});
	}, []);

	const startEditing = (appId: string) => {
		const app = apps.find((a) => a.appId === appId);
		if (app) {
			setEditingApp(appId);
			setEditForm({
				clientSecret: app.clientSecret || '',
				scopes: app.scopes || [],
			});
		}
	};

	const cancelEditing = () => {
		setEditingApp(null);
		setEditForm({
			clientSecret: '',
			scopes: [],
		});
	};

	const saveCredentials = () => {
		if (!editingApp) return;

		const app = apps.find((a) => a.appId === editingApp);
		if (!app) return;

		const updatedApp = {
			...app,
			clientSecret: editForm.clientSecret || undefined,
			scopes: editForm.scopes.length > 0 ? editForm.scopes : undefined,
		};

		addOrUpdateApp(updatedApp);
		cancelEditing();
		onCredentialsUpdated?.();
	};

	const importFromEnvironment = () => {
		// Find or create an app that matches the environment credentials
		const matchingApp = apps.find(
			(app) =>
				app.clientId === envCredentials.clientId &&
				app.environmentId === envCredentials.environmentId
		);

		if (matchingApp) {
			// Update existing app
			const updatedApp = {
				...matchingApp,
				clientSecret: envCredentials.clientSecret || matchingApp.clientSecret,
				scopes: matchingApp.scopes || ['openid', 'profile', 'email'],
			};
			addOrUpdateApp(updatedApp);
		} else if (envCredentials.clientId && envCredentials.environmentId) {
			// Create new app
			const newApp = {
				appId: `env-import-${Date.now()}`,
				label: 'Environment Import',
				environmentId: envCredentials.environmentId,
				clientId: envCredentials.clientId,
				clientSecret: envCredentials.clientSecret,
				scopes: ['openid', 'profile', 'email'],
				redirectUris: ['http://localhost:3000/callback'],
			};
			addOrUpdateApp(newApp);
		}

		onCredentialsUpdated?.();
	};

	const updateEditForm = (field: keyof typeof editForm, value: string | string[]) => {
		setEditForm((prev) => ({ ...prev, [field]: value }));
	};

	const hasEnvCredentials =
		envCredentials.clientId && envCredentials.clientSecret && envCredentials.environmentId;

	return (
		<Container>
			<Header>
				<Title>Client Credential Manager</Title>
				<Actions>
					{hasEnvCredentials && (
						<Button variant="primary" onClick={importFromEnvironment}>
							Import from Environment
						</Button>
					)}
				</Actions>
			</Header>

			{hasEnvCredentials && (
				<div
					style={{
						background: '#ecfdf5',
						border: '1px solid #d1fae5',
						borderRadius: '0.375rem',
						padding: '0.75rem',
						marginBottom: '1rem',
						fontSize: '0.875rem',
						color: '#065f46',
					}}
				>
					<strong>Environment Variables Detected:</strong> Client credentials found in environment.
					Click "Import from Environment" to add them to an app.
				</div>
			)}

			<AppList>
				{apps.map((app) => (
					<AppItem key={app.appId}>
						<AppHeader>
							<div>
								<AppName>{app.label}</AppName>
								<div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
									Client ID: {app.clientId.substring(0, 12)}... • Env:{' '}
									{app.environmentId.substring(0, 12)}...
								</div>
							</div>
							<CredentialStatus $hasSecret={!!app.clientSecret}>
								{app.clientSecret ? '✅ Has Secret' : '⚠️ No Secret'}
							</CredentialStatus>
						</AppHeader>

						{editingApp === app.appId ? (
							<div>
								<FormGroup>
									<Label>Client Secret:</Label>
									<Input
										type="password"
										value={editForm.clientSecret}
										onChange={(e) => updateEditForm('clientSecret', e.target.value)}
										placeholder="Enter client secret"
									/>
								</FormGroup>

								<FormGroup>
									<Label>Scopes:</Label>
									<Input
										type="text"
										value={editForm.scopes.join(' ')}
										onChange={(e) =>
											updateEditForm('scopes', e.target.value.split(/\s+/).filter(Boolean))
										}
										placeholder="openid profile email"
									/>
								</FormGroup>

								<ButtonGroup>
									<Button variant="primary" onClick={saveCredentials}>
										Save
									</Button>
									<Button variant="secondary" onClick={cancelEditing}>
										Cancel
									</Button>
								</ButtonGroup>
							</div>
						) : (
							<ButtonGroup>
								<Button variant="secondary" onClick={() => startEditing(app.appId)}>
									{app.clientSecret ? 'Edit Credentials' : 'Add Client Secret'}
								</Button>
							</ButtonGroup>
						)}
					</AppItem>
				))}

				{apps.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							color: '#6b7280',
							fontSize: '0.875rem',
						}}
					>
						No apps configured yet. Add apps through the PingOne Application Picker or import from
						environment variables.
					</div>
				)}
			</AppList>
		</Container>
	);
};

export default ClientCredentialManager;
