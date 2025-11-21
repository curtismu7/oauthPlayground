// src/components/PARConfigurationExample.tsx
// Example component showing how to use PARConfigurationService in any flow

import React, { useState } from 'react';
import {
	PARConfigurationService,
	PARConfigurationServiceUtils,
} from '../services/parConfigurationService';

interface PARConfigurationExampleProps {
	flowType?: string;
	title?: string;
}

const PARConfigurationExample: React.FC<PARConfigurationExampleProps> = ({
	flowType = 'authorization-code',
	title = 'PAR Configuration Example',
}) => {
	// Initialize with flow-specific defaults
	const [parConfig, setParConfig] = useState(
		PARConfigurationServiceUtils.getFlowSpecificConfig(flowType)
	);

	// Handle configuration changes
	const handleConfigChange = (newConfig: any) => {
		console.log('PAR Configuration changed:', newConfig);
		setParConfig(newConfig);

		// Validate configuration
		const validation = PARConfigurationServiceUtils.validateConfig(newConfig);
		if (!validation.isValid) {
			console.warn('PAR Configuration validation errors:', validation.errors);
		}
	};

	// Convert to URL parameters (for use in PAR requests)
	const getUrlParams = () => {
		return PARConfigurationServiceUtils.configToUrlParams(parConfig);
	};

	return (
		<div
			style={{
				padding: '1rem',
				border: '1px solid #e5e7eb',
				borderRadius: '0.5rem',
				margin: '1rem 0',
			}}
		>
			<h3 style={{ marginBottom: '1rem', color: '#374151' }}>{title}</h3>

			{/* PAR Configuration Service */}
			<PARConfigurationService
				config={parConfig}
				onConfigChange={handleConfigChange}
				defaultCollapsed={false}
				title="PAR Authorization Request Configuration"
				showEducationalContent={true}
			/>

			{/* Display current configuration */}
			<div
				style={{
					marginTop: '1rem',
					padding: '1rem',
					background: '#f9fafb',
					borderRadius: '0.375rem',
				}}
			>
				<h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Current Configuration:</h4>
				<pre style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
					{JSON.stringify(parConfig, null, 2)}
				</pre>
			</div>

			{/* Display URL parameters */}
			<div
				style={{
					marginTop: '1rem',
					padding: '1rem',
					background: '#f0f9ff',
					borderRadius: '0.375rem',
				}}
			>
				<h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>
					URL Parameters for PAR Request:
				</h4>
				<pre style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
					{JSON.stringify(getUrlParams(), null, 2)}
				</pre>
			</div>

			{/* Flow-specific information */}
			<div
				style={{
					marginTop: '1rem',
					padding: '1rem',
					background: '#f0fdf4',
					borderRadius: '0.375rem',
				}}
			>
				<h4 style={{ marginBottom: '0.5rem', color: '#374151' }}>Flow-Specific Defaults:</h4>
				<p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
					This example uses <strong>{flowType}</strong> flow defaults. Different flow types have
					different default PAR configurations.
				</p>
			</div>
		</div>
	);
};

export default PARConfigurationExample;
