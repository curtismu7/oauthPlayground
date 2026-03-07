import MarkdownViewer from './MarkdownViewer';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const PingOnePiFlowGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/flows/pingone-pi-flow-guidance.md"
			title="PingOne pi.flow Usage"
			pageName="PingOne pi.flow Guide"
		/>
	);
};

export default PingOnePiFlowGuide;
