import React from 'react';
import { FiChevronDown, FiInfo } from 'react-icons/fi';
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
`;

const InfoTitle = styled.div`
	font-weight: 600;
	margin-bottom: 0.5rem;
`;

const InfoText = styled.div`
	line-height: 1.6;
`;

interface OAuthUserInfoExtensionServiceProps {
	collapsed: boolean;
	onToggleCollapsed: () => void;
}

export class OAuthUserInfoExtensionService {
	static getExtensionSection({
		collapsed,
		onToggleCollapsed
	}: OAuthUserInfoExtensionServiceProps) {
		return (
			<CollapsibleSection>
				<CollapsibleHeaderButton 
					onClick={onToggleCollapsed} 
					aria-expanded={!collapsed}
				>
					<CollapsibleTitle>
						<FiInfo /> OAuth + UserInfo Extension
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
								<InfoTitle>OAuth + UserInfo Extension</InfoTitle>
								<InfoText>
									While not part of core OAuth 2.0, many OAuth providers support UserInfo-like endpoints.
									The claims parameter can specify what user data to return. This shows how OAuth evolved into OIDC.
								</InfoText>
							</div>
						</InfoBox>
					</CollapsibleContent>
				)}
			</CollapsibleSection>
		);
	}
}

export default OAuthUserInfoExtensionService;
