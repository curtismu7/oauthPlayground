import React from 'react';
import { FlowComparisonTool } from '../components/FlowComparisonTool';
import { usePageScroll } from '../hooks/usePageScroll';
import PageLayoutService from '../services/pageLayoutService';
import { V9_COLORS } from '../services/v9/V9ColorStandards';

// Layout components at module scope — styled-components v6 calls useContext
// internally when creating styled components; must not run inside a component.
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

const FlowComparison: React.FC = () => {
	usePageScroll({ pageName: 'Flow Comparison', force: true });

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
