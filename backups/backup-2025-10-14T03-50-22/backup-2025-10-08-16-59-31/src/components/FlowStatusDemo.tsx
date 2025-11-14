// src/components/FlowStatusDemo.tsx
// Demo component to showcase the improved flow status tables

import React from 'react';
import { FlowStatusTables } from '../services/flowStatusService';

// Mock getFlowStatus function for demo
const mockGetFlowStatus = (flowId: string) => {
	// Simulate different statuses for demo
	const mockData: Record<string, { lastExecutionTime?: string; hasCredentials?: boolean }> = {
		'oauth-authorization-code-v5': { lastExecutionTime: '2 minutes ago', hasCredentials: true },
		'oauth-implicit-v5': { lastExecutionTime: 'Never', hasCredentials: false },
		'client-credentials-v5': { lastExecutionTime: '1 hour ago', hasCredentials: true },
		'device-authorization-v5': { lastExecutionTime: 'Never', hasCredentials: false },
		'oidc-authorization-code-v5': { lastExecutionTime: '5 minutes ago', hasCredentials: true },
		'oidc-implicit-v5': { lastExecutionTime: 'Never', hasCredentials: false },
		'hybrid-v5': { lastExecutionTime: '30 minutes ago', hasCredentials: true },
		'oidc-device-authorization-v5': { lastExecutionTime: '1 day ago', hasCredentials: true },
		'worker-token-v5': { lastExecutionTime: '10 minutes ago', hasCredentials: true },
		'pingone-par-v5': { lastExecutionTime: 'Never', hasCredentials: false },
		'redirectless-flow-v5': { lastExecutionTime: '2 hours ago', hasCredentials: true },
	};

	return mockData[flowId] || { lastExecutionTime: 'Never', hasCredentials: false };
};

export const FlowStatusDemo: React.FC = () => {
	return (
		<div style={{ padding: '2rem', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
			<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
				<h1
					style={{
						fontSize: '2rem',
						fontWeight: '700',
						color: '#1e40af',
						marginBottom: '2rem',
						textAlign: 'center',
					}}
				>
					Enhanced Flow Status Tables
				</h1>

				<div
					style={{
						backgroundColor: '#ffffff',
						borderRadius: '1rem',
						padding: '2rem',
						boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
						border: '1px solid #e5e7eb',
					}}
				>
					<FlowStatusTables getFlowStatus={mockGetFlowStatus} />
				</div>

				<div
					style={{
						marginTop: '2rem',
						padding: '1.5rem',
						backgroundColor: '#eff6ff',
						borderRadius: '0.75rem',
						border: '2px solid #bfdbfe',
					}}
				>
					<h3 style={{ color: '#1e40af', marginBottom: '1rem' }}>Improvements Made:</h3>
					<ul style={{ color: '#374151', lineHeight: '1.6' }}>
						<li>
							✅ <strong>Consistent Light Blue Theme:</strong> All tables now use light blue
							(#eff6ff) backgrounds instead of mixed red/green
						</li>
						<li>
							✅ <strong>Enhanced Headers:</strong> Blue headers (#dbeafe) with consistent styling
							and better contrast
						</li>
						<li>
							✅ <strong>Improved Status Badges:</strong> "Missing" status now uses light blue
							instead of red for a friendlier appearance
						</li>
						<li>
							✅ <strong>Better Spacing:</strong> Increased padding and margins for better
							readability
						</li>
						<li>
							✅ <strong>Visual Hierarchy:</strong> Section titles with blue dots and consistent
							typography
						</li>
						<li>
							✅ <strong>Enhanced Borders:</strong> Thicker borders and subtle shadows for better
							definition
						</li>
						<li>
							✅ <strong>Consistent Colors:</strong> All sections use the same color scheme for
							uniformity
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default FlowStatusDemo;
