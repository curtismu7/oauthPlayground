import React from 'react';
import styled from 'styled-components';
import { PageLayoutService } from '../../../services/pageLayoutService';

// Create layout components at module level
const _migrationLayout = PageLayoutService.createPageLayout({
	flowType: 'documentation',
	theme: 'red',
	showHeader: true,
});

const ContentContainer = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 2rem;
`;

const Title = styled.h1`
	font-size: 2.5rem;
	font-weight: 700;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const Description = styled.p`
	color: #6b7280;
	font-size: 1.125rem;
	margin-bottom: 2rem;
	line-height: 1.6;
`;

const Section = styled.section`
	margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
	font-size: 1.875rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
	border-bottom: 2px solid #ef4444;
	padding-bottom: 0.5rem;
`;

const Subsection = styled.div`
	margin-bottom: 2rem;
`;

const SubsectionTitle = styled.h3`
	font-size: 1.25rem;
	font-weight: 600;
	color: #374151;
	margin-bottom: 0.75rem;
`;

const CodeBlock = styled.pre`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 0.5rem;
	padding: 1rem;
	overflow-x: auto;
	font-family: 'Courier New', monospace;
	font-size: 0.875rem;
`;

const Note = styled.div`
	background: #fef3c7;
	border: 1px solid #fbbf24;
	border-radius: 0.5rem;
	padding: 1rem;
	margin: 1rem 0;
	color: #92400e;
`;

const MigrateVscode: React.FC = () => {
	return (
		<_migrationLayout.PageContainer>
			<_migrationLayout.PageHeader />
			<_migrationLayout.ContentWrapper>
				<ContentContainer>
					<Title>VSCode Migration Guide</Title>
					<Description>
						Comprehensive guide for migrating VSCode extensions and configurations to the latest
						MasterFlow API platform.
					</Description>

					<Section>
						<SectionTitle>Overview</SectionTitle>
						<p>
							This migration guide helps you transition your VSCode setup to work seamlessly with
							the MasterFlow API platform, ensuring consistent development experience and optimal
							performance.
						</p>
					</Section>

					<Section>
						<SectionTitle>Prerequisites</SectionTitle>
						<Subsection>
							<SubsectionTitle>Required Software</SubsectionTitle>
							<ul>
								<li>VSCode 1.85.0 or later</li>
								<li>Node.js 18.0.0 or later</li>
								<li>MasterFlow API CLI tools</li>
								<li>Git 2.40.0 or later</li>
							</ul>
						</Subsection>
					</Section>

					<Section>
						<SectionTitle>Migration Steps</SectionTitle>
						<Subsection>
							<SubsectionTitle>1. Backup Current Configuration</SubsectionTitle>
							<CodeBlock>{`# Export VSCode settings
code --export-extensions > extensions.txt
cp ~/.vscode/settings.json ./settings-backup.json
cp ~/.vscode/keybindings.json ./keybindings-backup.json`}</CodeBlock>
						</Subsection>

						<Subsection>
							<SubsectionTitle>2. Install MasterFlow Extensions</SubsectionTitle>
							<CodeBlock>{`# Install required extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint`}</CodeBlock>
						</Subsection>

						<Subsection>
							<SubsectionTitle>3. Update Configuration Files</SubsectionTitle>
							<CodeBlock>{`{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": ["typescript", "typescriptreact"]
}`}</CodeBlock>
						</Subsection>
					</Section>

					<Section>
						<SectionTitle>Troubleshooting</SectionTitle>
						<Note>
							<strong>Common Issue:</strong> Extension conflicts may occur during migration. Disable
							all extensions first, then enable them one by one to identify conflicts.
						</Note>
					</Section>

					<Section>
						<SectionTitle>Next Steps</SectionTitle>
						<p>
							After completing the migration, refer to the{' '}
							<a href="/docs/prompts/prompt-all">Complete Prompts Guide</a>
							for comprehensive development workflows and best practices.
						</p>
					</Section>
				</ContentContainer>
			</_migrationLayout.ContentWrapper>
		</_migrationLayout.PageContainer>
	);
};

export default MigrateVscode;
