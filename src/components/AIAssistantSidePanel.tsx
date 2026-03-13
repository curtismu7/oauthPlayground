import React, { useState } from 'react';
import styled from 'styled-components';

// Import the application's logging service
import { logger } from '../utils/logger';

interface AIAssistantSidePanelProps {
	isVisible: boolean;
	onClose: () => void;
}

const AIAssistantSidePanel: React.FC<AIAssistantSidePanelProps> = ({ isVisible, onClose }) => {
	const [activeTab, setActiveTab] = useState<'pingone-login' | 'documentation' | 'tools'>(
		'pingone-login'
	);

	if (!isVisible) return null;

	return (
		<SidePanelOverlay>
			<SidePanelContainer>
				<SidePanelHeader>
					<SidePanelTitle>Tools & Resources</SidePanelTitle>
					<CloseButton onClick={onClose}>×</CloseButton>
				</SidePanelHeader>

				<TabsContainer>
					<TabButton
						$active={activeTab === 'pingone-login'}
						onClick={() => setActiveTab('pingone-login')}
					>
						PingOne Login
					</TabButton>
					<TabButton
						$active={activeTab === 'documentation'}
						onClick={() => setActiveTab('documentation')}
					>
						Documentation
					</TabButton>
					<TabButton $active={activeTab === 'tools'} onClick={() => setActiveTab('tools')}>
						Tools
					</TabButton>
				</TabsContainer>

				<SidePanelContent>
					{activeTab === 'pingone-login' && <PingOneLoginContent />}
					{activeTab === 'documentation' && <DocumentationContent />}
					{activeTab === 'tools' && <ToolsContent />}
				</SidePanelContent>
			</SidePanelContainer>
		</SidePanelOverlay>
	);
};

const PingOneLoginContent: React.FC = () => (
	<ContentSection>
		<SectionTitle>PingOne Authentication</SectionTitle>
		<SectionDescription>
			Connect to PingOne to test OAuth flows and manage your authentication setup.
		</SectionDescription>

		<LoginCard>
			<CardTitle>Environment Login</CardTitle>
			<CardDescription>
				Use your PingOne credentials to authenticate and access the API playground features.
			</CardDescription>
			<LoginButton onClick={() => window.open('/configuration', '_blank')}>
				Open Configuration
			</LoginButton>
		</LoginCard>

		<LoginCard>
			<CardTitle>Worker Token</CardTitle>
			<CardDescription>
				Generate a worker token for API access and testing purposes.
			</CardDescription>
			<LoginButton
				onClick={() => logger.info('Side Panel', 'Worker token functionality requested')}
			>
				Get Worker Token
			</LoginButton>
		</LoginCard>
	</ContentSection>
);

const DocumentationContent: React.FC = () => (
	<ContentSection>
		<SectionTitle>Documentation & Resources</SectionTitle>

		<ResourceLink
			href="https://docs.pingidentity.com/pingone/p1_cloud__platform_main_landing_page.html"
			target="_blank"
		>
			<ResourceTitle>PingOne Platform Docs</ResourceTitle>
			<ResourceDescription>
				Complete PingOne platform documentation and API references
			</ResourceDescription>
		</ResourceLink>

		<ResourceLink href="https://apidocs.pingidentity.com/pingone/platform/v1/api/" target="_blank">
			<ResourceTitle>API Documentation</ResourceTitle>
			<ResourceDescription>
				Interactive API documentation for all PingOne services
			</ResourceDescription>
		</ResourceLink>

		<ResourceLink href="/user-guide" target="_blank">
			<ResourceTitle>User Guide</ResourceTitle>
			<ResourceDescription>Learn how to use the OAuth Playground effectively</ResourceDescription>
		</ResourceLink>
	</ContentSection>
);

const ToolsContent: React.FC = () => (
	<ContentSection>
		<SectionTitle>Developer Tools</SectionTitle>

		<ToolCard>
			<ToolTitle>Token Debugger</ToolTitle>
			<ToolDescription>Analyze and debug JWT tokens and OAuth flows</ToolDescription>
			<ToolButton onClick={() => logger.info('Side Panel', 'Token debugger tool requested')}>
				Launch Debugger
			</ToolButton>
		</ToolCard>

		<ToolCard>
			<ToolTitle>Flow Generator</ToolTitle>
			<ToolDescription>Generate custom OAuth flows and configurations</ToolDescription>
			<ToolButton onClick={() => logger.info('Side Panel', 'Flow generator tool requested')}>
				Create Flow
			</ToolButton>
		</ToolCard>

		<ToolCard>
			<ToolTitle>API Explorer</ToolTitle>
			<ToolDescription>Interactive API testing and exploration tool</ToolDescription>
			<ToolButton onClick={() => logger.info('Side Panel', 'API explorer tool requested')}>
				Explore APIs
			</ToolButton>
		</ToolCard>
	</ContentSection>
);

// Styled Components
const SidePanelOverlay = styled.div`
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	width: 400px;
	background: rgba(0, 0, 0, 0.5);
	z-index: 10052;
	display: flex;
	justify-content: flex-end;
`;

const SidePanelContainer = styled.div`
	width: 100%;
	height: 100%;
	background: white;
	display: flex;
	flex-direction: column;
	box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
`;

const SidePanelHeader = styled.div`
	background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
	color: white;
	padding: 16px 20px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`;

const SidePanelTitle = styled.div`
	font-size: 16px;
	font-weight: 600;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: white;
	font-size: 24px;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;
	transition: background 0.2s;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const TabsContainer = styled.div`
	display: flex;
	background: #f8f9fa;
	border-bottom: 1px solid #e0e0e0;
`;

const TabButton = styled.button<{ $active?: boolean }>`
	background: ${({ $active }) => ($active ? 'white' : 'transparent')};
	border: none;
	color: ${({ $active }) => ($active ? '#2563eb' : '#666')};
	padding: 12px 20px;
	font-size: 14px;
	font-weight: ${({ $active }) => ($active ? '600' : '400')};
	cursor: pointer;
	transition: all 0.2s;
	border-bottom: ${({ $active }) => ($active ? '2px solid #2563eb' : '2px solid transparent')};

	&:hover {
		background: rgba(37, 99, 235, 0.05);
		color: #2563eb;
	}
`;

const SidePanelContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 20px;
`;

const ContentSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`;

const SectionTitle = styled.h2`
	font-size: 18px;
	font-weight: 600;
	color: #333;
	margin: 0;
`;

const SectionDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.5;
	margin: 0;
`;

const LoginCard = styled.div`
	background: #f8f9fa;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
`;

const CardTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin: 0 0 8px 0;
`;

const CardDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.4;
	margin: 0 0 16px 0;
`;

const LoginButton = styled.button`
	background: linear-gradient(135deg, #10b981 0%, #059669 100%);
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

const ResourceLink = styled.a`
	display: block;
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
	text-decoration: none;
	color: inherit;
	transition: all 0.2s;

	&:hover {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
		transform: translateY(-1px);
	}
`;

const ResourceTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #2563eb;
	margin: 0 0 8px 0;
`;

const ResourceDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.4;
	margin: 0;
`;

const ToolCard = styled.div`
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	padding: 16px;
`;

const ToolTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin: 0 0 8px 0;
`;

const ToolDescription = styled.p`
	font-size: 14px;
	color: #666;
	line-height: 1.4;
	margin: 0 0 16px 0;
`;

const ToolButton = styled.button`
	background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
	color: white;
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
`;

export default AIAssistantSidePanel;
