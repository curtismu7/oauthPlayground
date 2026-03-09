import { V9_COLORS } from '../../services/v9/V9ColorStandards';
import MarkdownViewer from './MarkdownViewer';

const LogoutURIsGuide = () => {
	return (
		<MarkdownViewer
			markdownPath="/docs/user-guides/flows/logout-uris.md"
			title="Logout URIs Configuration"
			pageName="Logout URIs Guide"
		/>
	);
};

export default LogoutURIsGuide;
