import React, { useState } from 'react';
import styled from 'styled-components';
import { V9_COLORS } from '../services/v9/V9ColorStandards';
import TokenIntrospectionFlow from './flows/TokenIntrospectionFlow';
import TokenMonitoringTab from './TokenMonitoringTab';
import TokenRevocationFlow from './flows/TokenRevocationFlow';
import { TokenMonitoringPage } from '../v8u/pages/TokenMonitoringPage';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: ${V9_COLORS.BG.WHITE};
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(31, 41, 55, 0.08);
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${V9_COLORS.TEXT.GRAY_DARK};
  margin-bottom: 24px;
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid ${V9_COLORS.TEXT.GRAY_LIGHTER};
  margin-bottom: 24px;
`;

const TabButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 12px 24px;
  border: none;
  background: ${({ $active, $color }) => ($active ? $color : 'transparent')};
  color: ${({ $active }) => ($active ? V9_COLORS.TEXT.WHITE : V9_COLORS.TEXT.GRAY_DARK)};
  font-weight: 600;
  border-bottom: ${({ $active, $color }) => ($active ? `3px solid ${$color}` : 'none')};
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
`;

const CombinedTokenPage: React.FC = () => {
	const [activeTab, setActiveTab] = useState<
		'management' | 'introspection' | 'revocation' | 'monitoring'
	>('management');

	return (
		<Container>
			<Title>Token Operations</Title>
			<TabBar>
				<TabButton
					$active={activeTab === 'management'}
					$color={V9_COLORS.PRIMARY.RED}
					onClick={() => setActiveTab('management')}
				>
					Token Management
				</TabButton>
				<TabButton
					$active={activeTab === 'introspection'}
					$color={V9_COLORS.PRIMARY.BLUE}
					onClick={() => setActiveTab('introspection')}
				>
					Token Introspection
				</TabButton>
				<TabButton
					$active={activeTab === 'revocation'}
					$color={V9_COLORS.PRIMARY.GREEN}
					onClick={() => setActiveTab('revocation')}
				>
					Token Revocation
				</TabButton>
				<TabButton
					$active={activeTab === 'monitoring'}
					$color={V9_COLORS.PRIMARY.PURPLE}
					onClick={() => setActiveTab('monitoring')}
				>
					Token Monitoring
				</TabButton>
			</TabBar>
			{activeTab === 'management' && <TokenMonitoringPage />}
			{activeTab === 'introspection' && <TokenIntrospectionFlow />}
			{activeTab === 'revocation' && <TokenRevocationFlow />}
			{activeTab === 'monitoring' && <TokenMonitoringTab />}
		</Container>
	);
};

export default CombinedTokenPage;
