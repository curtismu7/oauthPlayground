import MarkdownViewer from './MarkdownViewer';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const PARExplanationGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/flows/oidc_par_explanation_20251008.md"
			title="PAR (Pushed Authorization Requests)"
			pageName="PAR Explanation"
		/>
	);
};

export default PARExplanationGuide;
