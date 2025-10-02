// src/components/FlowConfigurationTable.tsx
// Comprehensive table showing configuration requirements for all OAuth/OIDC flows

import React from 'react';
import { FiCheck, FiX, FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';

const TableContainer = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 0.75rem;
	overflow: hidden;
	margin: 2rem 0;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableTitle = styled.h3`
	margin: 0;
	padding: 1.5rem;
	background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
	color: white;
	font-size: 1.25rem;
	font-weight: 700;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`;

const Thead = styled.thead`
	background: #f9fafb;
	border-bottom: 2px solid #e5e7eb;
`;

const Th = styled.th`
	padding: 1rem;
	text-align: left;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.05em;
`;

const Tbody = styled.tbody`
	tr:nth-child(even) {
		background: #f9fafb;
	}
	
	tr:hover {
		background: #f3f4f6;
	}
`;

const Td = styled.td`
	padding: 1rem;
	font-size: 0.875rem;
	color: #374151;
	border-bottom: 1px solid #e5e7eb;
`;

const FlowName = styled.div`
	font-weight: 600;
	color: #1f2937;
`;

const StatusBadge = styled.div<{ $status: 'required' | 'optional' | 'not-used' }>`
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.375rem 0.75rem;
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	background: ${({ $status }) =>
		$status === 'required' ? '#fef3c7' : $status === 'not-used' ? '#d1fae5' : '#f3f4f6'};
	color: ${({ $status }) =>
		$status === 'required' ? '#92400e' : $status === 'not-used' ? '#065f46' : '#374151'};
`;

const CodeBadge = styled.code`
	background: #f3f4f6;
	padding: 0.25rem 0.5rem;
	border-radius: 0.25rem;
	font-size: 0.75rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	color: #1f2937;
	border: 1px solid #e5e7eb;
`;

const Note = styled.div`
	padding: 1rem 1.5rem;
	background: #f0f9ff;
	border-top: 1px solid #bae6fd;
	font-size: 0.875rem;
	color: #0c4a6e;
	line-height: 1.6;
`;

interface FlowConfig {
	name: string;
	clientSecret: 'required' | 'optional' | 'not-used';
	redirectUri: 'required' | 'optional' | 'not-used';
	tokenAuthMethod: string;
}

const FLOW_CONFIGS: FlowConfig[] = [
	{
		name: 'Device Authorization',
		clientSecret: 'not-used',
		redirectUri: 'not-used',
		tokenAuthMethod: 'none',
	},
	{
		name: 'Implicit',
		clientSecret: 'not-used',
		redirectUri: 'required',
		tokenAuthMethod: 'none',
	},
	{
		name: 'Authorization Code',
		clientSecret: 'optional',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
	},
	{
		name: 'Client Credentials',
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
	},
	{
		name: 'Resource Owner Password',
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
	},
	{
		name: 'Hybrid (OIDC)',
		clientSecret: 'required',
		redirectUri: 'required',
		tokenAuthMethod: 'client_secret_post',
	},
	{
		name: 'CIBA',
		clientSecret: 'required',
		redirectUri: 'not-used',
		tokenAuthMethod: 'client_secret_post',
	},
];

const FlowConfigurationTable: React.FC = () => {
	const getIcon = (status: string) => {
		switch (status) {
			case 'required':
				return <FiAlertTriangle size={14} />;
			case 'not-used':
				return <FiX size={14} />;
			case 'optional':
				return <FiCheck size={14} />;
			default:
				return null;
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'required':
				return 'Required';
			case 'not-used':
				return 'Not Used';
			case 'optional':
				return 'Optional';
			default:
				return status;
		}
	};

	return (
		<TableContainer>
			<TableTitle>Configuration Requirements by Flow</TableTitle>
			<Table>
				<Thead>
					<tr>
						<Th>Flow</Th>
						<Th>Client Secret</Th>
						<Th>Redirect URI</Th>
						<Th>Token Auth Method</Th>
					</tr>
				</Thead>
				<Tbody>
					{FLOW_CONFIGS.map((flow) => (
						<tr key={flow.name}>
							<Td>
								<FlowName>{flow.name}</FlowName>
							</Td>
							<Td>
								<StatusBadge $status={flow.clientSecret}>
									{getIcon(flow.clientSecret)}
									{getStatusText(flow.clientSecret)}
								</StatusBadge>
							</Td>
							<Td>
								<StatusBadge $status={flow.redirectUri}>
									{getIcon(flow.redirectUri)}
									{getStatusText(flow.redirectUri)}
								</StatusBadge>
							</Td>
							<Td>
								<CodeBadge>{flow.tokenAuthMethod}</CodeBadge>
							</Td>
						</tr>
					))}
				</Tbody>
			</Table>
			<Note>
				<strong>Note:</strong> Configure your PingOne application's Token Endpoint Authentication Method
				according to the flow you're using. Public clients (Device Authorization, Implicit) use{' '}
				<code>none</code>, while confidential clients use <code>client_secret_post</code> or{' '}
				<code>client_secret_basic</code>.
			</Note>
		</TableContainer>
	);
};

export default FlowConfigurationTable;