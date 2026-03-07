import MarkdownViewer from './MarkdownViewer';
import { V9_COLORS } from '../../services/v9/V9ColorStandards';

const SecurityFeaturesGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/security/SECURITY_FEATURES_CONFIGURATION.md"
			title="Security Features Configuration"
			pageName="Security Features Guide"
		/>
	);
};

export default SecurityFeaturesGuide;
