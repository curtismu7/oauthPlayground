// src/pages/ConfigurationManagerPage.tsx
// Demo page for the Configuration Manager
// Shows developers how to use the enhanced configuration management

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ConfigurationManager from '../components/ConfigurationManager';
import { Environment, FlowType } from '../services/enhancedConfigurationService';

const ConfigurationManagerPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const flowType = searchParams.get('flow') as FlowType;
	const environment = searchParams.get('env') as Environment;

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<ConfigurationManager initialFlowType={flowType} initialEnvironment={environment} />
		</div>
	);
};

export default ConfigurationManagerPage;
