import React from 'react';
import { FlowComparisonTool } from '../components/FlowComparisonTool';
import { usePageScroll } from '../hooks/usePageScroll';
import PageLayoutService from '../services/pageLayoutService';

const FlowComparison: React.FC = () => {
	usePageScroll({ pageName: 'Flow Comparison', force: true });

	// Use V6 pageLayoutService for consistent dimensions and FlowHeader integration
	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem', // Wider for flow comparison (1152px)
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: 'flow-comparison', // Enables FlowHeader integration
	};

	const {
		PageContainer,
		ContentWrapper,
		FlowHeader: LayoutFlowHeader,
	} = PageLayoutService.createPageLayout(pageConfig);

	return (
		<PageContainer>
			<ContentWrapper>
				{LayoutFlowHeader && <LayoutFlowHeader />}
				<FlowComparisonTool />
			</ContentWrapper>
		</PageContainer>
	);
};

export default FlowComparison;
