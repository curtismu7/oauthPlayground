// src/pages/ServiceDiscovery.tsx
// Demo page for the Service Discovery Tools
// Shows developers how to use the ServiceDiscoveryBrowser component

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ServiceDiscoveryBrowser from '../components/ServiceDiscoveryBrowser';
import { FlowType } from '../services/serviceDiscoveryService';

const ServiceDiscovery: React.FC = () => {
	const [searchParams] = useSearchParams();
	const flowType = searchParams.get('flow') as FlowType;

	return (
		<div style={{ minHeight: '100vh', background: '#f9fafb' }}>
			<ServiceDiscoveryBrowser initialFlowType={flowType} showStatistics={true} />
		</div>
	);
};

export default ServiceDiscovery;
