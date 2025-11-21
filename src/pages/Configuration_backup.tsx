import styled from 'styled-components';
import { usePageScroll } from '../hooks/usePageScroll';
import { FlowHeader } from '../services/flowHeaderService';

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
