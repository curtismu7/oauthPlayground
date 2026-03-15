import React from 'react';
import styled from 'styled-components';
import AIAssistant from '../components/AIAssistant';
import { FlowHeader } from '../services/flowHeaderService';

const PageContainer = styled.div`
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background: #f8fafc;
`;

const ContentContainer = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 0;
`;

const AIAssistantContainer = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
`;

const AIAssistantPage: React.FC = () => {
	return (
		<PageContainer>
			<ContentContainer>
				<FlowHeader flowId="ai-assistant-page" />
				<AIAssistantContainer>
					<AIAssistant fullPage={true} />
				</AIAssistantContainer>
			</ContentContainer>
		</PageContainer>
	);
};

export default AIAssistantPage;
