import { useEffect, useId, useState } from 'react';
import { FiEye, FiEyeOff, FiGlobe, FiRefreshCw, FiSave, FiSettings } from 'react-icons/fi';
import styled from 'styled-components';
import packageJson from '../../package.json';
import CollapsibleSection from '../components/CollapsibleSection';
import DiscoveryPanel from '../components/DiscoveryPanel';
import StandardMessage from '../components/StandardMessage';
import UISettingsModal from '../components/UISettingsModal';
import { showGlobalSuccess } from '../hooks/useNotifications';
import { v4ToastManager } from '../utils/v4ToastMessages';
import { usePageScroll } from '../hooks/usePageScroll';
import type { OpenIDConfiguration } from '../services/discoveryService';
import { getAllFlowCredentialStatuses } from '../utils/flowCredentialChecker';
import { useUISettings } from '../contexts/UISettingsContext';
import { FlowHeader } from '../services/flowHeaderService';
import { credentialManager } from '../utils/credentialManager';

const ConfigurationContainer = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	padding: 1.5rem;
	background: var(--color-background, white);
	color: var(--color-text-primary, #1e293b);
	min-height: 100vh;
`;

const Configuration = () => {
	usePageScroll({ pageName: 'Configuration', force: true });

	return (
		<ConfigurationContainer>
			<FlowHeader flowId="configuration" />
			<h1>Configuration</h1>
			<p>This is a simplified version for debugging.</p>
		</ConfigurationContainer>
	);
};

export default Configuration;
