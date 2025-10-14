import React from 'react';
import { FiChevronDown, FiInfo, FiUser } from 'react-icons/fi';
import styled from 'styled-components';

// Styled components for collapsible sections
const CollapsibleSection = styled.div`
	margin-bottom: 2rem;
	background: #ffffff;
	border-radius: 0.75rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	border: 1px solid #e5e7eb;
	overflow: hidden;
`;

const CollapsibleHeaderButton = styled.button`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
	border: none;
	border-bottom: 1px solid #bae6fd;
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
	}
`;

const CollapsibleTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: #0c4a6e;
`;

const CollapsibleToggleIcon = styled.div<{ $collapsed: boolean }>`
	font-size: 1.25rem;
	color: #0284c7;
	transition: transform 0.2s;
	transform: ${props => props.$collapsed ? 'rotate(-90deg)' : 'rotate(0)'};
`;

const CollapsibleContent = styled.div`
	padding: 1.5rem;
`;

const InfoBox = styled.div<{ $variant?: 'info' | 'success' | 'warning' }>`
	display: flex;
	gap: 0.75rem;
	padding: 1rem;
	background: ${props => {
		switch (props.$variant) {
			case 'success': return '#f0fdf4';
			case 'warning': return '#fffbeb';
			default: return '#eff6ff';
		}
	}};
	border: 1px solid ${props => {
		switch (props.$variant) {
			case 'success': return '#bbf7d0';
			case 'warning': return '#fed7aa';
			default: return '#bfdbfe';
		}
	}};
	border-radius: 0.5rem;
	font-size: 0.875rem;
	color: ${props => {
		switch (props.$variant) {
			case 'success': return '#166534';
			case 'warning': return '#92400e';
			default: return '#1e40af';
		}
	}};
	line-height: 1.5;
	margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 1rem;
	font-weight: 600;
	color: #1f2937;
	margin-bottom: 1rem;
`;

const SectionDescription = styled.div`
	font-size: 0.875rem;
	color: #6b7280;
	line-height: 1.6;
	margin-bottom: 1.5rem;
`;

const CodeHighlight = styled.code`
	background: #f3f4f6;
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
	font-size: 0.875rem;
	font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	color: #374151;
`;

interface OAuthPromptParameterServiceProps {
	collapsed: boolean;
	onToggleCollapsed: () => void;
}

export class OAuthPromptParameterService {
	static getPromptParameterSection({
		collapsed,
		onToggleCollapsed
	}: OAuthPromptParameterServiceProps) {
		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton 
					onClick={onToggleCollapsed} 
					aria-expanded={!collapsed}
				>
					<CollapsibleTitle>
						<FiUser /> OAuth Prompt Parameter
					</CollapsibleTitle>
					<CollapsibleToggleIcon $collapsed={collapsed}>
						<FiChevronDown />
					</CollapsibleToggleIcon>
				</CollapsibleHeaderButton>
				{!collapsed && (
					<CollapsibleContent>
						<InfoBox $variant="info">
							<FiInfo size={20} />
							<div>
								<div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
									OAuth Prompt Parameter
								</div>
								<div>
									The prompt parameter controls authentication and consent behavior in OAuth flows. 
									While more commonly used in OIDC, many OAuth providers also support this parameter.
								</div>
							</div>
						</InfoBox>

						<SectionHeader>
							<FiUser size={20} />
							Prompt Parameter (OIDC Authentication Behavior)
						</SectionHeader>

						<SectionDescription>
							The <CodeHighlight>prompt</CodeHighlight> parameter controls the authentication and consent behavior. 
							You can select multiple values to combine behaviors (e.g., "login consent").
						</SectionDescription>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	}
}

export default OAuthPromptParameterService;
