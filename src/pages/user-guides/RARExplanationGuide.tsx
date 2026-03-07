import MarkdownViewer from './MarkdownViewer';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const RARExplanationGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/flows/oidc_rar_explanation_20251008.md"
			title="RAR (Rich Authorization Requests)"
			pageName="RAR Explanation"
		/>
	);
};

export default RARExplanationGuide;
