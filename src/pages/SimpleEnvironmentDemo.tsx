import React from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const DemoSection = styled.div`
  background: V9_COLORS.BG.GRAY_LIGHT;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 8px;
  padding: 1.5rem;
`;

const SimpleEnvironmentDemo: React.FC = () => {
	return (
		<Container>
			<Header>
				<h1>🔧 Environment ID Input Demo</h1>
				<p>Simplified PingOne configuration demo</p>
			</Header>

			<DemoSection>
				<h2>Demo Component</h2>
				<p>This is a simple test to verify routing works.</p>
				<p>If you can see this page, the routing is working correctly!</p>
			</DemoSection>
		</Container>
	);
};

export default SimpleEnvironmentDemo;
