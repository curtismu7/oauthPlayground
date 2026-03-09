import { V9_COLORS } from '../../services/v9/V9ColorStandards';
import MarkdownViewer from './MarkdownViewer';

const RedirectURIsGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/flows/redirect-uris.md"
			title="Redirect URIs Configuration"
			pageName="Redirect URIs Guide"
		/>
	);
};

export default RedirectURIsGuide;
