import React from 'react';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import { FlowComparisonTool } from '../components/FlowComparisonTool';
import { usePageScroll } from '../hooks/usePageScroll';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const FlowComparison: React.FC = () => {
	usePageScroll({ pageName: 'Flow Comparison', force: true });

	return (
		<Container>
			<FlowHeader flowId="flow-comparison" />
			<FlowComparisonTool />
		</Container>
	);
};

export default FlowComparison;
