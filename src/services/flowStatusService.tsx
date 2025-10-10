// src/services/flowStatusService.tsx
// Reusable service for flow status tables used in Dashboard and Configuration

import React from 'react';

export interface FlowStatusTableProps {
	getFlowStatus: (
		flowId: string
	) => { lastExecutionTime?: string; hasCredentials?: boolean } | undefined;
}

export interface FlowTableConfig {
	title: string;
	flows: Array<{
		id: string;
		name: string;
	}>;
	borderColor: string;
	backgroundColor: string;
}

export const FLOW_TABLE_CONFIGS: FlowTableConfig[] = [
	{
		title: 'OAuth 2.0 Flows',
		borderColor: '#bfdbfe',
		backgroundColor: '#eff6ff',
		flows: [
			{ id: 'oauth-authorization-code-v5', name: 'OAuth 2.0 Authorization Code V5' },
			{ id: 'oauth-implicit-v5', name: 'OAuth 2.0 Implicit V5' },
			{ id: 'client-credentials-v5', name: 'OAuth 2.0 Client Credentials V5' },
			{ id: 'device-authorization-v6', name: 'OAuth Device Authorization V6' },
		],
	},
	{
		title: 'OpenID Connect Flows',
		borderColor: '#bfdbfe',
		backgroundColor: '#eff6ff',
		flows: [
			{ id: 'oidc-authorization-code-v5', name: 'OIDC Authorization Code V5' },
			{ id: 'oidc-implicit-v5', name: 'OIDC Implicit V5' },
			{ id: 'hybrid-v5', name: 'OIDC Hybrid V5' },
			{ id: 'oidc-device-authorization-v6', name: 'OIDC Device Authorization V6' },
		],
	},
	{
		title: 'PingOne Flows',
		borderColor: '#bfdbfe',
		backgroundColor: '#eff6ff',
		flows: [
			{ id: 'worker-token-v5', name: 'PingOne Worker Token V5' },
			{ id: 'pingone-par-v5', name: 'PingOne PAR Flow V5' },
			{ id: 'redirectless-flow-v5', name: 'Redirectless Flow V5 (Real)' },
		],
	},
];

export const FlowStatusTable: React.FC<FlowStatusTableProps & { config: FlowTableConfig }> = ({
	getFlowStatus,
	config,
}) => {
	return (
		<div
			style={{
				backgroundColor: config.backgroundColor,
				border: `2px solid ${config.borderColor}`,
				borderRadius: '0.75rem',
				overflow: 'hidden',
				marginBottom: '2rem',
				boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
			}}
		>
			<table
				style={{
					width: '100%',
					borderCollapse: 'collapse',
					fontSize: '0.875rem',
				}}
			>
				<thead>
					<tr style={{ backgroundColor: '#dbeafe' }}>
						<th
							style={{
								padding: '0.875rem',
								textAlign: 'left',
								borderBottom: `1px solid ${config.borderColor}`,
								fontWeight: '600',
								color: '#1e40af',
								fontSize: '0.875rem',
							}}
						>
							Flow Type
						</th>
						<th
							style={{
								padding: '0.875rem',
								textAlign: 'center',
								borderBottom: `1px solid ${config.borderColor}`,
								fontWeight: '600',
								color: '#1e40af',
								fontSize: '0.875rem',
							}}
						>
							Last Execution Time
						</th>
						<th
							style={{
								padding: '0.875rem',
								textAlign: 'center',
								borderBottom: `1px solid ${config.borderColor}`,
								fontWeight: '600',
								color: '#1e40af',
								fontSize: '0.875rem',
							}}
						>
							Credentials
						</th>
					</tr>
				</thead>
				<tbody>
					{config.flows.map((flow, index) => {
						const status = getFlowStatus(flow.id);
						const isLastRow = index === config.flows.length - 1;

						return (
							<tr key={flow.id} style={{ backgroundColor: '#ffffff' }}>
								<td
									style={{
										padding: '0.875rem',
										borderBottom: isLastRow ? 'none' : `1px solid ${config.borderColor}`,
										fontSize: '0.875rem',
										fontWeight: '500',
										color: '#374151',
									}}
								>
									{flow.name}
								</td>
								<td
									style={{
										padding: '0.875rem',
										textAlign: 'center',
										borderBottom: isLastRow ? 'none' : `1px solid ${config.borderColor}`,
									}}
								>
									<span
										style={{
											padding: '0.375rem 0.75rem',
											borderRadius: '0.5rem',
											fontSize: '0.75rem',
											fontWeight: '600',
											backgroundColor:
												status?.lastExecutionTime && status.lastExecutionTime !== 'Never'
													? '#dbeafe'
													: '#f3f4f6',
											color:
												status?.lastExecutionTime && status.lastExecutionTime !== 'Never'
													? '#1e40af'
													: '#6b7280',
											border: `1px solid ${
												status?.lastExecutionTime && status.lastExecutionTime !== 'Never'
													? '#93c5fd'
													: '#d1d5db'
											}`,
										}}
									>
										{status?.lastExecutionTime || 'Never'}
									</span>
								</td>
								<td
									style={{
										padding: '0.875rem',
										textAlign: 'center',
										borderBottom: isLastRow ? 'none' : `1px solid ${config.borderColor}`,
									}}
								>
									<span
										style={{
											padding: '0.375rem 0.75rem',
											borderRadius: '0.5rem',
											fontSize: '0.75rem',
											fontWeight: '600',
											backgroundColor: status?.hasCredentials ? '#dcfce7' : '#dbeafe',
											color: status?.hasCredentials ? '#166534' : '#1e40af',
											border: `1px solid ${status?.hasCredentials ? '#86efac' : '#93c5fd'}`,
										}}
									>
										{status?.hasCredentials ? 'Configured' : 'Missing'}
									</span>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};

export const FlowStatusTables: React.FC<FlowStatusTableProps> = ({ getFlowStatus }) => {
	return (
		<div>
			{FLOW_TABLE_CONFIGS.map((config) => (
				<div key={config.title}>
					<h5
						style={{
							fontSize: '1rem',
							fontWeight: '700',
							marginBottom: '1rem',
							marginTop: config.title === 'OAuth 2.0 Flows' ? '0' : '2rem',
							color: '#1e40af',
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
						}}
					>
						<span
							style={{
								width: '0.5rem',
								height: '0.5rem',
								backgroundColor: '#3b82f6',
								borderRadius: '50%',
							}}
						/>
						{config.title}
					</h5>
					<FlowStatusTable getFlowStatus={getFlowStatus} config={config} />
				</div>
			))}
		</div>
	);
};

export default {
	FlowStatusTable,
	FlowStatusTables,
	FLOW_TABLE_CONFIGS,
};
